"""Cheat command processing for dev/testing."""


def process_cheat(engine, cmd_type) -> None:
    """Process cheat commands for dev/testing."""
    # Import CommandType for comparison
    try:
        from game_src.core.commands import CommandType
    except ImportError:
        from src.core.commands import CommandType

    # Import with fallback for Docker (game_src) vs local (src)
    try:
        from game_src.items.items import LoreScroll
        from game_src.story.story_data import LORE_ENTRIES
    except ImportError:
        from src.items.items import LoreScroll
        from src.story.story_data import LORE_ENTRIES

    if cmd_type == CommandType.CHEAT_GOD_MODE:
        # Toggle god mode on player
        if engine.player:
            if not hasattr(engine.player, 'god_mode'):
                engine.player.god_mode = False
            engine.player.god_mode = not engine.player.god_mode
            status = "ON" if engine.player.god_mode else "OFF"
            engine.add_message(f"[CHEAT] God mode {status}")

    elif cmd_type == CommandType.CHEAT_KILL_ALL:
        # Kill all enemies on current floor
        if engine.entity_manager:
            count = len(engine.entity_manager.enemies)
            engine.entity_manager.enemies.clear()
            engine.add_message(f"[CHEAT] Killed {count} enemies")

    elif cmd_type == CommandType.CHEAT_HEAL:
        # Heal player to full
        if engine.player:
            engine.player.health = engine.player.max_health
            engine.add_message(f"[CHEAT] Healed to full ({engine.player.health} HP)")

    elif cmd_type == CommandType.CHEAT_NEXT_FLOOR:
        # Skip to next floor
        if engine.level_manager and engine.dungeon:
            current = engine.dungeon.level
            if current < 8:
                engine.level_manager.initialize_level(current + 1)
                engine.add_message(f"[CHEAT] Skipped to floor {current + 1}")
            else:
                engine.add_message("[CHEAT] Already at max floor")

    elif cmd_type == CommandType.CHEAT_REVEAL_MAP:
        # Reveal entire map
        if engine.dungeon:
            for y in range(engine.dungeon.height):
                for x in range(engine.dungeon.width):
                    engine.dungeon.explored[y][x] = True
                    engine.dungeon.visible[y][x] = True
            engine.add_message("[CHEAT] Map revealed")

    elif cmd_type == CommandType.CHEAT_SHOW_ZONES:
        # Toggle zone labels overlay
        if not hasattr(engine, 'show_zones'):
            engine.show_zones = False
        engine.show_zones = not engine.show_zones
        status = "ON" if engine.show_zones else "OFF"
        engine.add_message(f"[CHEAT] Zone labels {status}")

    elif cmd_type == CommandType.CHEAT_SPAWN_LORE:
        # Spawn a random lore item near player
        if engine.player and engine.entity_manager:
            # Find an available lore entry for current floor
            floor = engine.dungeon.level if engine.dungeon else 1
            floor_lore_ids = {
                1: ['journal_adventurer_1', 'warning_stone'],
                2: ['sewer_worker', 'plague_warning'],
                3: ['druid_log', 'webbed_note'],
                4: ['crypt_inscription', 'priest_confession'],
                5: ['frozen_explorer', 'ice_warning'],
                6: ['wizard_research', 'history_valdris'],
                7: ['smith_journal', 'obsidian_tablet'],
                8: ['dragon_pact', 'final_entry'],
            }
            lore_ids = floor_lore_ids.get(floor, ['journal_adventurer_1'])
            lore_id = lore_ids[0]
            lore_data = LORE_ENTRIES.get(lore_id, {})

            if lore_data:
                # Find adjacent walkable tile
                px, py = engine.player.x, engine.player.y
                spawn_pos = None
                for dx, dy in [(1, 0), (-1, 0), (0, 1), (0, -1)]:
                    nx, ny = px + dx, py + dy
                    if engine.dungeon.is_walkable(nx, ny):
                        spawn_pos = (nx, ny)
                        break

                if spawn_pos:
                    scroll = LoreScroll(
                        x=spawn_pos[0],
                        y=spawn_pos[1],
                        lore_id=lore_id,
                        title=lore_data.get('title', 'Unknown'),
                        content=lore_data.get('content', [])
                    )
                    engine.entity_manager.items.append(scroll)
                    engine.add_message(f"[CHEAT] Spawned: {scroll.title}")
                else:
                    engine.add_message("[CHEAT] No space to spawn lore")
