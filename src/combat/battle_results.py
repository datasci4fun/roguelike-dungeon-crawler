"""Battle result handling: victory, defeat, flee (v6.0.5).

Handles:
- Syncing battle state back to world
- XP awards and loot drops
- Ghost assists during battle
- Flee mechanics and vow violations
"""
import json
import os
from datetime import datetime
from typing import TYPE_CHECKING, Optional, Tuple

from .battle_types import BattleState, BattleOutcome, BattleEntity
from .battle_actions import manhattan_distance
from ..core.events import EventType

if TYPE_CHECKING:
    from ..core.engine import GameEngine
    from ..core.events import EventQueue


class BattleResultHandler:
    """Handles battle outcomes and their effects on game state."""

    def __init__(self, engine: 'GameEngine', events: 'EventQueue' = None):
        self.engine = engine
        self.events = events

    def apply_victory_results(self, battle: BattleState) -> None:
        """
        Apply battle victory results to world state (v6.0.5).

        - Sync player HP from battle
        - Remove defeated enemies from world
        - Award XP for each killed enemy (2x for elites)
        - Increment player kills and ledger stats
        - Drop loot (deterministic where possible)
        - Handle boss victory (route to victory flow if floor 8)
        """
        from ..core.constants import ELITE_XP_MULTIPLIER, BOSS_LOOT, GameState
        from ..items import create_item

        player = self.engine.player

        # Sync player HP
        if battle.player:
            player.health = battle.player.hp

        total_xp = 0
        boss_defeated = None

        # Process each enemy (both initial and reinforcements that joined)
        for battle_enemy in battle.enemies:
            if battle_enemy.hp <= 0:
                # Get world enemy for stats
                world_enemy = self._get_enemy_by_id(battle_enemy.entity_id)

                if world_enemy:
                    # Increment kills
                    player.kills += 1

                    # Track in completion ledger
                    if hasattr(self.engine, 'completion_ledger') and self.engine.completion_ledger:
                        self.engine.completion_ledger.record_kill(
                            is_elite=getattr(world_enemy, 'is_elite', False)
                        )

                    # Award XP
                    base_xp = getattr(world_enemy, 'xp_reward', 10)
                    is_elite = getattr(world_enemy, 'is_elite', False)
                    xp_award = base_xp * ELITE_XP_MULTIPLIER if is_elite else base_xp

                    # Apply Human's Adaptive trait (+10% XP)
                    xp_mult = player.get_xp_multiplier() if hasattr(player, 'get_xp_multiplier') else 1.0
                    xp_award = int(xp_award * xp_mult)
                    total_xp += xp_award

                    # Check if boss
                    if getattr(world_enemy, 'is_boss', False):
                        boss_defeated = world_enemy

                        # Track warden defeat
                        if hasattr(self.engine, 'completion_ledger') and self.engine.completion_ledger:
                            boss_type_name = world_enemy.boss_type.name if world_enemy.boss_type else "UNKNOWN"
                            self.engine.completion_ledger.record_warden_defeated(boss_type_name)

                # Remove from world
                self._remove_enemy_from_world(battle_enemy.entity_id)

        # Award total XP
        if total_xp > 0:
            leveled_up = player.gain_xp(total_xp)
            self.engine.add_message(f"Gained {total_xp} XP!")
            if leveled_up:
                self.engine.add_message(f"LEVEL UP! Now level {player.level}!")

        # Drop boss loot if boss was defeated
        if boss_defeated:
            self._drop_boss_loot(boss_defeated)

            # Check for game victory (floor 8 boss)
            if battle.floor_level >= 8:
                self.engine.add_message("*** THE DRAGON EMPEROR HAS FALLEN! ***")
                # v6.0.5: Preserve ledger/codex before clearing autosave
                self._persist_victory_data()
                from ..data import delete_save
                delete_save()
                self.engine.state = GameState.VICTORY

    def apply_defeat_results(self, battle: BattleState) -> None:
        """Apply battle defeat results - player dies."""
        from ..core.constants import GameState
        self.engine.player.health = 0
        self.engine.state = GameState.DEAD

    def apply_flee_results(self, battle: BattleState) -> None:
        """
        Apply flee results - player escapes, enemies remain.

        Flee semantics (v6.0.4):
        - Sync player HP (may have taken damage before fleeing)
        - Push player back from encounter origin so not standing on enemy
        - Enemies remain in world (not removed)
        - Track battles_escaped in ledger
        """
        # Sync player HP
        if battle.player:
            self.engine.player.health = battle.player.hp

        # Push player back from encounter origin
        origin_x, origin_y = battle.encounter_origin
        player = self.engine.player

        # Find a safe tile adjacent to origin (not occupied by enemy)
        safe_pos = self._find_safe_flee_position(origin_x, origin_y)
        if safe_pos:
            player.x, player.y = safe_pos
        # else: player stays at original position (enemies will be adjacent)

        # v6.0.5: Track battles_escaped in completion ledger
        if hasattr(self.engine, 'completion_ledger') and self.engine.completion_ledger:
            self.engine.completion_ledger.record_battle_escaped()

        # v6.0.5.4: Check Oathstone vow violation if fleeing from boss
        self._check_flee_vow_violation(battle)

    def _persist_victory_data(self) -> None:
        """Persist ledger and codex data for legacy/ghost system (v6.0.5).

        Called before deleting autosave on victory to preserve:
        - Completion ledger (for legacy calculation)
        - Bestiary entries (for codex)
        - Ghost imprint data (for future runs)
        """
        victory_data = {
            'timestamp': datetime.now().isoformat(),
            'floor_reached': self.engine.current_level,
            'player_level': self.engine.player.level if self.engine.player else 0,
            'turns': self.engine.turn,
        }

        # Include completion ledger if available
        if hasattr(self.engine, 'completion_ledger') and self.engine.completion_ledger:
            victory_data['ledger'] = self.engine.completion_ledger.to_dict()

        # Include bestiary/codex if available
        if hasattr(self.engine, 'story_manager') and self.engine.story_manager:
            if hasattr(self.engine.story_manager, 'get_codex_state'):
                victory_data['codex'] = self.engine.story_manager.get_codex_state()

        # Save to victory file (append to list of victories)
        victory_file = "victories.json"
        victories = []
        if os.path.exists(victory_file):
            try:
                with open(victory_file, 'r') as f:
                    victories = json.load(f)
            except (json.JSONDecodeError, IOError):
                victories = []

        victories.append(victory_data)

        try:
            with open(victory_file, 'w') as f:
                json.dump(victories, f, indent=2)
        except IOError as e:
            # Non-fatal - just log
            print(f"Warning: Could not persist victory data: {e}")

    def _drop_boss_loot(self, boss) -> None:
        """Drop loot from a defeated boss at player's position."""
        from ..core.constants import BOSS_LOOT
        from ..items import create_item

        if not boss or not hasattr(boss, 'boss_type'):
            return

        loot_names = BOSS_LOOT.get(boss.boss_type, [])
        if not loot_names:
            return

        player = self.engine.player
        drop_x, drop_y = player.x, player.y
        dropped_count = 0

        for loot_name in loot_names:
            from ..items import ItemType
            try:
                item_type = ItemType[loot_name]
            except KeyError:
                continue

            # Offset items slightly
            offset_x = dropped_count % 3 - 1
            offset_y = dropped_count // 3
            item = create_item(item_type, drop_x + offset_x, drop_y + offset_y)
            self.engine.entity_manager.add_item(item)
            self.engine.add_message(f"The {boss.name} dropped {item.name}!")
            dropped_count += 1

    def _find_safe_flee_position(self, origin_x: int, origin_y: int) -> Optional[Tuple[int, int]]:
        """
        Find a safe position for player to flee to, away from enemies.

        Checks adjacent tiles to origin, preferring tiles away from enemies
        and ensuring tile is walkable and not occupied.
        """
        if not self.engine.dungeon:
            return None

        # Get adjacent tiles
        directions = [(-1, 0), (1, 0), (0, -1), (0, 1), (-1, -1), (-1, 1), (1, -1), (1, 1)]
        candidates = []

        for dx, dy in directions:
            nx, ny = origin_x + dx, origin_y + dy

            # Check walkable
            if not self.engine.dungeon.is_walkable(nx, ny):
                continue

            # Check not occupied by enemy
            occupied = False
            for enemy in self.engine.entity_manager.enemies:
                if enemy.x == nx and enemy.y == ny:
                    occupied = True
                    break

            if not occupied:
                candidates.append((nx, ny))

        # Return first valid candidate (could prioritize by distance from enemies)
        return candidates[0] if candidates else None

    def _check_flee_vow_violation(self, battle: BattleState) -> None:
        """Check if fleeing from battle breaks an Oathstone vow (v6.0.5.4).

        If player has SLAY_WARDEN vow and flees from a boss fight,
        the vow is broken and penalties apply.
        """
        # Only matters if fleeing from boss
        is_boss_fight = any(
            enemy.entity_id.startswith('boss_') or
            getattr(self._get_enemy_by_id(enemy.entity_id), 'is_boss', False)
            for enemy in battle.enemies
        )
        if not is_boss_fight:
            return

        # Check for Oathstone with SLAY_WARDEN vow
        if hasattr(self.engine, 'artifact_manager') and self.engine.artifact_manager:
            artifact = self.engine.artifact_manager.floor_artifact
            if artifact:
                from ..items.artifacts import ArtifactId, VowType, check_vow_violation
                if artifact.artifact_id == ArtifactId.OATHSTONE:
                    violation_msg = check_vow_violation(artifact, 'flee', self.engine)
                    if violation_msg:
                        self.engine.add_message(violation_msg)

    def _get_enemy_by_id(self, enemy_id: str):
        """Get enemy entity by ID from entity manager."""
        for enemy in self.engine.entity_manager.enemies:
            if id(enemy) == int(enemy_id):
                return enemy
        return None

    def _remove_enemy_from_world(self, enemy_id: str) -> None:
        """Remove an enemy from the world after battle defeat."""
        enemies = self.engine.entity_manager.enemies
        for i, enemy in enumerate(enemies):
            if id(enemy) == int(enemy_id):
                enemies.pop(i)
                break


class GhostAssistHandler:
    """Handles ghost assists during battles (v6.0.5)."""

    def __init__(self, engine: 'GameEngine', events: 'EventQueue' = None):
        self.engine = engine
        self.events = events

    def check_champion_assist(self, player: BattleEntity) -> None:
        """Check if a Champion ghost should provide combat assistance (v6.0.5.5).

        If player's health drops below 30% and there's a Champion ghost
        that hasn't used its assist, grant a small heal.
        """
        # Only trigger when health drops below 30%
        if player.hp >= player.max_hp * 0.3:
            return

        # Check for ghost manager and Champion ghost
        if not hasattr(self.engine, 'ghost_manager') or not self.engine.ghost_manager:
            return

        from ..entities.ghosts import GhostType

        for ghost in self.engine.ghost_manager.ghosts:
            if ghost.ghost_type == GhostType.CHAMPION and not ghost.assist_used:
                # Use the assist
                ghost.assist_used = True
                ghost.triggered = True

                # Grant heal
                heal_amount = 5
                player.hp = min(player.hp + heal_amount, player.max_hp)

                self.engine.add_message(
                    "A Champion's imprint surges! (+5 HP)"
                )

                if self.events:
                    self.events.emit(
                        EventType.BUFF_FLASH,
                        entity=player
                    )

                # Only one Champion can assist
                break

    def check_archivist_reveal(self, battle: BattleState) -> None:
        """Check if an Archivist ghost should reveal battle info (v6.0.5).

        At battle start, Archivist reveals reinforcement edges and safe tiles.
        One-time use per battle.
        """
        if not hasattr(self.engine, 'ghost_manager') or not self.engine.ghost_manager:
            return

        from ..entities.ghosts import GhostType

        for ghost in self.engine.ghost_manager.ghosts:
            if ghost.ghost_type == GhostType.ARCHIVIST and not ghost.triggered:
                ghost.triggered = True

                # Reveal safe tiles (similar to woundglass but automatic)
                safe_tiles = []
                for y in range(battle.arena_height):
                    for x in range(battle.arena_width):
                        tile = battle.arena_tiles[y][x]
                        if tile != '.':
                            continue
                        # Check distance from reinforcement edges
                        min_edge_dist = float('inf')
                        for edge_x, edge_y in battle.reinforcement_edges:
                            dist = manhattan_distance(x, y, edge_x, edge_y)
                            min_edge_dist = min(min_edge_dist, dist)
                        if min_edge_dist >= 3:
                            safe_tiles.append((x, y))

                battle.safe_tiles_revealed = safe_tiles
                self.engine.add_message(
                    "An Archivist's mark reveals the battlefield..."
                )
                break

    def check_beacon_guidance(self, battle: BattleState) -> None:
        """Check if a Beacon ghost should provide guidance (v6.0.5).

        Points player away from next reinforcement entry.
        """
        if not hasattr(self.engine, 'ghost_manager') or not self.engine.ghost_manager:
            return

        from ..entities.ghosts import GhostType

        for ghost in self.engine.ghost_manager.ghosts:
            if ghost.ghost_type == GhostType.BEACON and not ghost.triggered:
                if not battle.reinforcements:
                    continue

                ghost.triggered = True

                # Find the next reinforcement's entry edge
                next_reinf = min(battle.reinforcements, key=lambda r: r.turns_until_arrival)
                # Find closest edge to that reinforcement's world position
                closest_edge = None
                min_dist = float('inf')
                for edge_x, edge_y in battle.reinforcement_edges:
                    dist = manhattan_distance(
                        edge_x, edge_y,
                        next_reinf.world_x % battle.arena_width,
                        next_reinf.world_y % battle.arena_height
                    )
                    if dist < min_dist:
                        min_dist = dist
                        closest_edge = (edge_x, edge_y)

                if closest_edge:
                    # Calculate direction away from that edge
                    player = battle.player
                    dx = player.arena_x - closest_edge[0]
                    dy = player.arena_y - closest_edge[1]
                    direction = ""
                    if dy < 0:
                        direction += "north"
                    elif dy > 0:
                        direction += "south"
                    if dx < 0:
                        direction += "west"
                    elif dx > 0:
                        direction += "east"
                    if direction:
                        self.engine.add_message(
                            f"A guiding light pulses toward the {direction}..."
                        )
                break
