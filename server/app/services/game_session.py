"""Game session manager for WebSocket game instances."""
import sys
import os
from typing import Dict, Optional, Any, List
from dataclasses import dataclass, field
from datetime import datetime
import asyncio
import uuid

from .ghost_recorder import GhostRecorder

# Add game source parent to path for importing engine as a package
# In Docker: /app (parent of game_src), Local: ../../../.. (parent of src)
# The src directory is mounted as game_src, so we import from game_src.core
game_parent_paths = [
    "/app",  # Docker: game_src is mounted here
    os.path.join(os.path.dirname(__file__), "..", "..", "..", ".."),  # Local dev
]
for path in game_parent_paths:
    abs_path = os.path.abspath(path)
    if os.path.exists(abs_path) and abs_path not in sys.path:
        sys.path.insert(0, abs_path)

# Import game engine components - try both package names
try:
    # Docker: src is mounted as game_src
    from game_src.core.engine import GameEngine
    from game_src.core.commands import Command, CommandType
    from game_src.core.constants import GameState, UIMode, Race, PlayerClass, RACE_STATS, CLASS_STATS
    GAME_ENGINE_AVAILABLE = True
except ImportError:
    try:
        # Local: use src directly
        from src.core.engine import GameEngine
        from src.core.commands import Command, CommandType
        from src.core.constants import GameState, UIMode, Race, PlayerClass, RACE_STATS, CLASS_STATS
        GAME_ENGINE_AVAILABLE = True
    except ImportError as e:
        print(f"Warning: Could not import game engine: {e}")
        GAME_ENGINE_AVAILABLE = False
        GameEngine = None
        Command = None
        CommandType = None
        GameState = None
        UIMode = None
        Race = None
        PlayerClass = None
        RACE_STATS = {}
        CLASS_STATS = {}


@dataclass
class GameSession:
    """Represents an active game session for a user."""
    session_id: str
    user_id: int
    username: str
    engine: Any  # GameEngine instance
    ghost_recorder: Optional[GhostRecorder] = None
    created_at: datetime = field(default_factory=datetime.utcnow)
    last_activity: datetime = field(default_factory=datetime.utcnow)
    turn_count: int = 0
    last_action: str = ""  # Last action taken for ghost recording
    allow_spectators: bool = True  # Whether this session allows spectators
    spectator_websockets: List[Any] = field(default_factory=list)  # WebSocket connections

    def update_activity(self):
        """Update last activity timestamp."""
        self.last_activity = datetime.utcnow()

    async def broadcast_to_spectators(self, state: dict):
        """Send game state to all spectators."""
        disconnected = []
        for ws in self.spectator_websockets:
            try:
                await ws.send_json(state)
            except Exception:
                disconnected.append(ws)
        # Remove disconnected spectators
        for ws in disconnected:
            self.spectator_websockets.remove(ws)


class GameSessionManager:
    """
    Manages active game sessions for all connected users.

    Each user can have one active game session at a time.
    Sessions are created when a user starts a new game and
    destroyed when they quit or disconnect.
    """

    def __init__(self):
        # Map of user_id -> GameSession
        self.sessions: Dict[int, GameSession] = {}
        self._lock = asyncio.Lock()

    async def create_session(
        self, user_id: int, username: str = "Unknown",
        race: str = None, player_class: str = None
    ) -> Optional[GameSession]:
        """
        Create a new game session for a user.

        Args:
            user_id: The user's ID
            username: The user's username for ghost recording
            race: Player race name (HUMAN, ELF, DWARF, HALFLING, ORC)
            player_class: Player class name (WARRIOR, MAGE, ROGUE)

        Returns:
            The created GameSession, or None if engine not available
        """
        if not GAME_ENGINE_AVAILABLE:
            return None

        async with self._lock:
            # End existing session if any
            if user_id in self.sessions:
                del self.sessions[user_id]

            # Parse race and class from strings
            parsed_race = None
            parsed_class = None

            if race and Race:
                try:
                    parsed_race = Race[race.upper()]
                except (KeyError, AttributeError):
                    pass  # Invalid race, use defaults

            if player_class and PlayerClass:
                try:
                    parsed_class = PlayerClass[player_class.upper()]
                except (KeyError, AttributeError):
                    pass  # Invalid class, use defaults

            # Create new engine and session
            engine = GameEngine()
            engine.start_new_game(race=parsed_race, player_class=parsed_class)

            # Get dungeon seed if available
            dungeon_seed = getattr(engine.dungeon, 'seed', None) if engine.dungeon else None

            # Create ghost recorder
            ghost_recorder = GhostRecorder(
                user_id=user_id,
                username=username,
                dungeon_seed=dungeon_seed,
            )

            session = GameSession(
                session_id=str(uuid.uuid4()),
                user_id=user_id,
                username=username,
                engine=engine,
                ghost_recorder=ghost_recorder,
            )

            self.sessions[user_id] = session
            return session

    async def get_session(self, user_id: int) -> Optional[GameSession]:
        """Get the active session for a user."""
        return self.sessions.get(user_id)

    async def end_session(self, user_id: int) -> Optional[dict]:
        """
        End a user's game session.

        Args:
            user_id: The user's ID

        Returns:
            Final game stats for recording, or None
        """
        async with self._lock:
            session = self.sessions.pop(user_id, None)
            if session and session.engine:
                # Extract comprehensive final stats
                engine = session.engine
                player = engine.player

                # Calculate game duration
                duration_seconds = int(
                    (datetime.utcnow() - session.created_at).total_seconds()
                )

                # Determine victory and cause of death
                victory = engine.state == GameState.VICTORY if GameState else False
                cause_of_death = None
                killed_by = None

                if not victory and player and player.health <= 0:
                    cause_of_death = "killed"
                    # Try to find what killed the player
                    if hasattr(engine, 'last_attacker_name'):
                        killed_by = engine.last_attacker_name

                # Finalize ghost recording
                ghost_data = None
                if session.ghost_recorder:
                    if victory:
                        session.ghost_recorder.record_victory(
                            final_level=engine.current_level,
                            final_score=0,  # Will be calculated by leaderboard
                        )
                    elif cause_of_death:
                        session.ghost_recorder.record_death(
                            cause=cause_of_death,
                            killed_by=killed_by,
                            final_level=engine.current_level,
                            final_score=0,
                        )
                    ghost_data = session.ghost_recorder.finalize()

                stats = {
                    "victory": victory,
                    "level_reached": engine.current_level,
                    "kills": player.kills if player else 0,
                    "damage_dealt": getattr(player, 'damage_dealt', 0) if player else 0,
                    "damage_taken": getattr(player, 'damage_taken', 0) if player else 0,
                    "final_hp": player.health if player else 0,
                    "max_hp": player.max_health if player else 0,
                    "player_level": player.level if player else 1,
                    "potions_used": getattr(player, 'potions_used', 0) if player else 0,
                    "items_collected": getattr(player, 'items_collected', 0) if player else 0,
                    "gold_collected": getattr(player, 'gold', 0) if player else 0,
                    "cause_of_death": cause_of_death,
                    "killed_by": killed_by,
                    "game_duration_seconds": duration_seconds,
                    "turns_taken": session.turn_count,
                    "started_at": session.created_at.isoformat() if session.created_at else None,
                    "ghost_data": ghost_data,
                }

                return stats
            return None

    async def process_command(
        self, user_id: int, command_type: str, data: dict = None
    ) -> Optional[dict]:
        """
        Process a game command from a user.

        Args:
            user_id: The user's ID
            command_type: The command type string
            data: Optional command data

        Returns:
            Game state update to send to client, or None
        """
        session = self.sessions.get(user_id)
        if not session or not GAME_ENGINE_AVAILABLE:
            return None

        session.update_activity()
        engine = session.engine

        # v6.1: Check for active transition and tick it
        if engine.transition.active:
            engine.tick_transition()

        # v6.1: Input lock during transitions
        if engine.is_input_locked():
            # Allow skip command during skippable transitions
            if command_type.upper() in ('SKIP', 'CANCEL', 'CONFIRM') and engine.transition.can_skip:
                engine.skip_transition()
                return self.serialize_game_state(session, [])
            # During transition, return current state without processing command
            return self.serialize_game_state(session, [])

        # Convert string command to CommandType
        try:
            cmd_type = CommandType[command_type.upper()]
        except (KeyError, AttributeError):
            return {"error": f"Unknown command: {command_type}"}

        # Handle feat selection
        if cmd_type == CommandType.SELECT_FEAT:
            feat_id = data.get("feat_id") if data else None
            if feat_id and engine.player and engine.player.pending_feat_selection:
                # Get feat name from player's available feats list
                available = engine.player.get_available_feats_info()
                feat_name = feat_id
                for f in available:
                    if f['id'] == feat_id:
                        feat_name = f['name']
                        break
                if engine.player.add_feat(feat_id):
                    engine.add_message(f"You learned the {feat_name} feat!")
                else:
                    return {"error": f"Cannot select feat: {feat_id}"}
            return self.serialize_game_state(session, [])

        # Handle cheat commands (dev/testing)
        if command_type.upper().startswith("CHEAT_"):
            self._process_cheat(engine, cmd_type)
            return self.serialize_game_state(session, [])

        command = Command(cmd_type)

        # Process based on current game state
        player_acted = False
        if engine.state == GameState.PLAYING:
            if engine.ui_mode == UIMode.GAME:
                player_acted = engine.process_game_command(command)
                if player_acted:
                    session.turn_count += 1
                    session.last_action = command_type.upper()
            elif engine.ui_mode == UIMode.INVENTORY:
                engine.process_inventory_command(command)
            elif engine.ui_mode == UIMode.DIALOG:
                engine.process_dialog_command(command)
            elif engine.ui_mode == UIMode.MESSAGE_LOG:
                engine.process_message_log_command(command)
            elif engine.ui_mode in (UIMode.CHARACTER, UIMode.HELP, UIMode.READING):
                # These close on any command
                if cmd_type == CommandType.CLOSE_SCREEN:
                    engine.ui_mode = UIMode.GAME
            elif engine.ui_mode == UIMode.BATTLE:
                # v6.0: Process tactical battle commands
                player_acted = engine.process_battle_command(command)
                if player_acted:
                    session.turn_count += 1
                    session.last_action = command_type.upper()

        # Get events generated by the command
        events = engine.flush_events()

        # Record ghost frame if player acted
        if player_acted and session.ghost_recorder and engine.player:
            # Extract damage info from events
            damage_dealt = 0
            damage_taken = 0
            target_x, target_y = None, None
            message = None

            for event in events:
                if event.type.name == "DAMAGE_NUMBER":
                    if event.data.get("x") != engine.player.x or event.data.get("y") != engine.player.y:
                        # Damage dealt to enemy
                        damage_dealt += event.data.get("amount", 0)
                        target_x = event.data.get("x")
                        target_y = event.data.get("y")
                    else:
                        # Damage taken by player
                        damage_taken += event.data.get("amount", 0)
                elif event.type.name == "MESSAGE":
                    message = event.data.get("text")

            session.ghost_recorder.record_frame(
                player=engine.player,
                dungeon_level=engine.current_level,
                action=session.last_action,
                target_x=target_x,
                target_y=target_y,
                damage_dealt=damage_dealt if damage_dealt > 0 else None,
                damage_taken=damage_taken if damage_taken > 0 else None,
                message=message,
            )

        # Check if player confirmed quit
        if engine.state == GameState.QUIT:
            # Return a special response indicating quit was confirmed
            return {"type": "quit_confirmed", "session_id": session.session_id}

        # Build and return state update
        state = self.serialize_game_state(session, events)

        # Broadcast to spectators
        if session.spectator_websockets:
            await session.broadcast_to_spectators(state)

        return state

    def serialize_game_state(
        self, session: GameSession, events: List = None
    ) -> dict:
        """
        Serialize the current game state for sending to client.

        Args:
            session: The game session
            events: List of events from this tick

        Returns:
            Serialized game state dictionary
        """
        engine = session.engine
        events = events or []

        state = {
            "type": "game_state",
            "session_id": session.session_id,
            "game_state": engine.state.name if engine.state else "UNKNOWN",
            "ui_mode": engine.ui_mode.name if engine.ui_mode else "GAME",
            "turn": session.turn_count,
            # v6.1: Transition state for cinematic mode changes
            "transition": engine.transition.to_dict(),
        }

        # Add player data if available
        if engine.player:
            player = engine.player
            # Get facing direction (default to south if not set)
            facing = getattr(player, 'facing', (0, 1))
            state["player"] = {
                "x": player.x,
                "y": player.y,
                "health": player.health,
                "max_health": player.max_health,
                "attack": player.attack_damage,
                "defense": player.defense,
                "level": player.level,
                "xp": player.xp,
                "xp_to_level": player.xp_to_next_level,
                "kills": player.kills,
                "facing": {"dx": facing[0], "dy": facing[1]},
            }

            # Add race/class info if character has them
            if hasattr(player, 'race') and player.race:
                race_data = RACE_STATS.get(player.race, {})
                state["player"]["race"] = {
                    "id": player.race.name,
                    "name": race_data.get('name', 'Unknown'),
                    "trait": player.race_trait,
                    "trait_name": player.race_trait_name,
                    "trait_description": player.race_trait_description,
                }

            if hasattr(player, 'player_class') and player.player_class:
                class_data = CLASS_STATS.get(player.player_class, {})
                state["player"]["class"] = {
                    "id": player.player_class.name,
                    "name": class_data.get('name', 'Unknown'),
                    "description": class_data.get('description', ''),
                }

            # Add abilities info
            if hasattr(player, 'get_ability_info'):
                state["player"]["abilities"] = player.get_ability_info()
            if hasattr(player, 'get_passive_info'):
                state["player"]["passives"] = player.get_passive_info()

            # Add feats info
            if hasattr(player, 'feats'):
                state["player"]["feats"] = player.get_feat_info()
                state["player"]["pending_feat_selection"] = player.pending_feat_selection
                if player.pending_feat_selection:
                    state["player"]["available_feats"] = player.get_available_feats_info()

            # v5.5: Add artifacts info
            if hasattr(player, 'artifacts'):
                state["player"]["artifacts"] = [
                    {
                        "id": a.artifact_id.name,
                        "name": a.name,
                        "symbol": a.symbol,
                        "charges": a.charges,
                        "used": a.used,
                        "active_vow": a.active_vow.name if a.active_vow else None,
                        "vow_broken": a.vow_broken,
                    }
                    for a in player.artifacts
                ]

            # Add first-person view data (tiles in front of player)
            try:
                state["first_person_view"] = self._serialize_first_person_view(engine, facing)
            except Exception as e:
                print(f"Error in _serialize_first_person_view: {e}")
                state["first_person_view"] = {"rows": [], "entities": [], "torches": [], "lighting": {}, "facing": {"dx": facing[0], "dy": facing[1]}, "depth": 8}

        # Add dungeon data if available
        if engine.dungeon:
            try:
                state["dungeon"] = {
                    "level": engine.dungeon.level,
                    "width": engine.dungeon.width,
                    "height": engine.dungeon.height,
                    "tiles": self._serialize_visible_tiles(engine),
                }
            except Exception as e:
                print(f"Error serializing dungeon: {e}")
                state["dungeon"] = {"level": 1, "width": 50, "height": 30, "tiles": []}

        # Add enemies in view
        if engine.entity_manager:
            enemies_list = []
            for e in engine.entity_manager.enemies:
                if e is None:
                    continue
                try:
                    if e.is_alive() and self._is_visible(engine, e.x, e.y):
                        enemies_list.append({
                            "x": e.x,
                            "y": e.y,
                            "name": e.name if hasattr(e, 'name') and e.name else "enemy",
                            "health": e.health if hasattr(e, 'health') else 0,
                            "max_health": e.max_health if hasattr(e, 'max_health') else 0,
                            "is_elite": getattr(e, 'is_elite', False),
                            "symbol": e.symbol if hasattr(e, 'symbol') and e.symbol else "?",
                        })
                except (AttributeError, TypeError):
                    continue  # Skip malformed enemy
            state["enemies"] = enemies_list

            items_list = []
            for i in engine.entity_manager.items:
                if i is None:
                    continue
                try:
                    if self._is_visible(engine, i.x, i.y):
                        items_list.append({
                            "x": i.x,
                            "y": i.y,
                            "name": i.name if hasattr(i, 'name') and i.name else "item",
                            "symbol": getattr(i, 'symbol', '?'),
                        })
                except (AttributeError, TypeError):
                    continue  # Skip malformed item
            state["items"] = items_list

        # Add messages
        state["messages"] = engine.messages[-10:] if engine.messages else []

        # Add events for animations
        events_list = []
        for e in events:
            if e is None:
                continue
            try:
                event_type = e.type.name if hasattr(e, 'type') and hasattr(e.type, 'name') else "UNKNOWN"
                event_data = self._sanitize_event_data(e.data) if hasattr(e, 'data') else {}
                events_list.append({"type": event_type, "data": event_data})
            except (AttributeError, TypeError):
                continue  # Skip malformed event
        state["events"] = events_list

        # Add UI-specific data
        if engine.ui_mode == UIMode.INVENTORY and engine.player:
            inventory_items = []
            for item in engine.player.inventory.items:
                if item is None:
                    continue
                try:
                    inventory_items.append({
                        "name": item.name if hasattr(item, 'name') and item.name else "Unknown Item",
                        "type": item.item_type.name if hasattr(item, 'item_type') and item.item_type else "UNKNOWN",
                        "rarity": item.rarity.name if hasattr(item, 'rarity') and item.rarity else "COMMON",
                    })
                except (AttributeError, TypeError):
                    continue  # Skip malformed item
            state["inventory"] = {
                "items": inventory_items,
                "selected_index": engine.selected_item_index,
            }

        if engine.ui_mode == UIMode.DIALOG:
            state["dialog"] = {
                "title": engine.dialog_title,
                "message": engine.dialog_message,
            }

        if engine.ui_mode == UIMode.READING:
            state["reading"] = {
                "title": engine.reading_title,
                "content": engine.reading_content,
            }

        # Include lore journal data (always available)
        if engine.story_manager:
            discovered, total = engine.story_manager.get_lore_progress()
            # Combine all entry types: lore + bestiary + locations + artifacts + sealed page
            lore_entries = engine.story_manager.get_discovered_lore_entries()
            bestiary_entries = engine.story_manager.get_bestiary_entries()
            location_entries = engine.story_manager.get_location_entries()
            artifact_entries = engine.story_manager.get_artifact_entries()
            all_entries = lore_entries + bestiary_entries + location_entries + artifact_entries

            # Add sealed page (always visible, shows completion progress)
            sealed_page = engine.story_manager.get_sealed_page_entry()
            if sealed_page:
                all_entries.append(sealed_page)

            # Calculate total discovered across all types
            total_discovered = len(lore_entries) + len(bestiary_entries) + len(location_entries) + len(artifact_entries)
            state["lore_journal"] = {
                "entries": all_entries,
                "discovered_count": total_discovered,
                "total_count": total + len(bestiary_entries) + len(location_entries) + len(artifact_entries),
            }

        # Include newly discovered lore notification (one-shot, cleared after sending)
        if hasattr(engine, 'new_lore_discovered') and engine.new_lore_discovered:
            state["new_lore"] = engine.new_lore_discovered
            engine.new_lore_discovered = None  # Clear after sending

        # Include field pulse state for environmental effects
        if hasattr(engine, 'field_pulse_manager') and engine.field_pulse_manager:
            pulse_info = engine.field_pulse_manager.get_pulse_info()
            state["field_pulse"] = {
                "active": pulse_info.get("active_pulse", False),
                "amplification": pulse_info.get("amplification", 1.0),
                "floor_turn": pulse_info.get("floor_turn", 0),
            }

        # Include zone overlay data when debug mode is enabled
        if getattr(engine, 'show_zones', False) and engine.dungeon:
            zone_labels = []
            for room in engine.dungeon.rooms:
                zone_labels.append({
                    "x": room.x + room.width // 2,
                    "y": room.y + room.height // 2,
                    "zone": room.zone,
                    "width": room.width,
                    "height": room.height,
                })
            state["zone_overlay"] = {
                "enabled": True,
                "labels": zone_labels,
            }

        # v6.0: Include battle state when in tactical combat
        if engine.ui_mode == UIMode.BATTLE and hasattr(engine, 'battle') and engine.battle:
            battle = engine.battle
            state["battle"] = {
                "active": True,
                "biome": battle.biome,
                "floor_level": battle.floor_level,
                "turn_number": battle.turn_number,
                "phase": battle.phase.name if battle.phase else "PLAYER_TURN",
                "arena_width": battle.arena_width,
                "arena_height": battle.arena_height,
                "arena_tiles": battle.arena_tiles,
                "player": {
                    "arena_x": battle.player.arena_x,
                    "arena_y": battle.player.arena_y,
                    "hp": battle.player.hp,
                    "max_hp": battle.player.max_hp,
                    "attack": battle.player.attack,
                    "defense": battle.player.defense,
                    "status_effects": [e.get('name', '') for e in battle.player.status_effects],
                    "cooldowns": battle.player.cooldowns,
                } if battle.player else None,
                "enemies": [
                    {
                        "entity_id": e.entity_id,
                        "arena_x": e.arena_x,
                        "arena_y": e.arena_y,
                        "hp": e.hp,
                        "max_hp": e.max_hp,
                        "attack": e.attack,
                        "defense": e.defense,
                        "status_effects": [ef.get('name', '') for ef in e.status_effects],
                    }
                    for e in battle.get_living_enemies()
                ],
                "reinforcements": [
                    {
                        "entity_id": r.entity_id,
                        "enemy_name": r.enemy_name,
                        "turns_until_arrival": r.turns_until_arrival,
                        "is_elite": r.is_elite,
                    }
                    for r in battle.reinforcements
                    if r.turns_until_arrival > 0
                ],
                "outcome": battle.outcome.name if battle.outcome else None,
            }

        return state

    def _sanitize_event_data(self, data: dict) -> dict:
        """Convert non-serializable objects in event data to JSON-safe values."""
        result = {}
        for key, value in data.items():
            if hasattr(value, 'x') and hasattr(value, 'y'):
                # Entity-like object - extract coordinates and name
                result[key] = {
                    'x': value.x,
                    'y': value.y,
                    'name': getattr(value, 'name', str(value)),
                }
            elif isinstance(value, (str, int, float, bool, type(None))):
                result[key] = value
            elif isinstance(value, dict):
                result[key] = self._sanitize_event_data(value)
            elif isinstance(value, list):
                result[key] = [
                    self._sanitize_event_data({'v': v})['v'] if isinstance(v, dict) or hasattr(v, 'x') else v
                    for v in value
                ]
            else:
                # Fallback - convert to string
                result[key] = str(value)
        return result

    def _process_cheat(self, engine, cmd_type: CommandType) -> None:
        """Process cheat commands for dev/testing."""
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

    def _serialize_visible_tiles(self, engine) -> List[List[str]]:
        """Serialize visible dungeon tiles around the player."""
        if not engine.dungeon or not engine.player:
            return []

        # Send a viewport around the player (e.g., 40x20)
        viewport_w, viewport_h = 40, 20
        px, py = engine.player.x, engine.player.y

        tiles = []
        for dy in range(-viewport_h // 2, viewport_h // 2 + 1):
            row = []
            for dx in range(-viewport_w // 2, viewport_w // 2 + 1):
                x, y = px + dx, py + dy
                if 0 <= x < engine.dungeon.width and 0 <= y < engine.dungeon.height:
                    if engine.dungeon.visible[y][x]:
                        tile = engine.dungeon.tiles[y][x]
                        row.append(tile.value if hasattr(tile, 'value') else str(tile))
                    elif engine.dungeon.explored[y][x]:
                        row.append("~")  # Explored but not visible
                    else:
                        row.append(" ")  # Unexplored
                else:
                    row.append(" ")  # Out of bounds
            tiles.append(row)

        return tiles

    def _is_visible(self, engine, x: int, y: int) -> bool:
        """Check if a position is visible to the player."""
        if not engine.dungeon:
            return False
        if 0 <= x < engine.dungeon.width and 0 <= y < engine.dungeon.height:
            return engine.dungeon.visible[y][x]
        return False

    def _is_in_fov_cone(self, player_x: int, player_y: int, target_x: int, target_y: int,
                         facing_dx: int, facing_dy: int, max_distance: int = 8) -> bool:
        """
        Check if a target position is within the player's FOV cone.
        Uses a ~120 degree cone (60 degrees on each side of facing direction).
        """
        import math

        # Calculate relative position
        rel_x = target_x - player_x
        rel_y = target_y - player_y

        # Check distance
        distance = math.sqrt(rel_x * rel_x + rel_y * rel_y)
        if distance > max_distance or distance == 0:
            return distance == 0  # Player's own position is always "visible"

        # Normalize direction to target
        dir_x = rel_x / distance
        dir_y = rel_y / distance

        # Dot product with facing direction
        dot = dir_x * facing_dx + dir_y * facing_dy

        # cos(60°) = 0.5 for a 120° cone (60° on each side)
        cone_threshold = 0.5

        return dot >= cone_threshold

    def _has_line_of_sight(self, dungeon, start_x: int, start_y: int, end_x: int, end_y: int) -> bool:
        """
        Check if there's a clear line of sight between two points.
        Uses Bresenham's line algorithm to trace the path.
        Returns True if no walls block the view (the end tile itself can be a wall - we can see walls).
        """
        dx = abs(end_x - start_x)
        dy = abs(end_y - start_y)
        sx = 1 if start_x < end_x else -1
        sy = 1 if start_y < end_y else -1
        err = dx - dy

        x, y = start_x, start_y

        while True:
            # If we reached the destination, line of sight is clear
            if x == end_x and y == end_y:
                return True

            # Check if current position blocks sight (walls block, but we can see the wall itself)
            if (x != start_x or y != start_y):  # Don't check start position
                if dungeon.is_blocking_sight(x, y):
                    # We hit a wall before reaching destination
                    # But if this IS the destination, we can see it
                    if x == end_x and y == end_y:
                        return True
                    return False

            # Move to next cell
            e2 = 2 * err
            if e2 > -dy:
                err -= dy
                x += sx
            if e2 < dx:
                err += dx
                y += sy

    def _serialize_first_person_view(self, engine, facing: tuple) -> dict:
        """
        Serialize tiles and entities in front of the player for first-person rendering.

        Args:
            engine: The game engine
            facing: Player facing direction (dx, dy)

        Returns:
            Dictionary with rows of tiles and entities in front of player
        """
        if not engine.dungeon or not engine.player:
            return {"rows": [], "entities": []}

        player = engine.player
        dungeon = engine.dungeon
        facing_dx, facing_dy = facing

        # Calculate perpendicular direction for width
        perp_dx = -facing_dy
        perp_dy = facing_dx

        # View parameters
        # Render as far as we can see straight ahead (until OOB or blocking tile),
        # instead of a fixed arbitrary distance.
        max_depth = 0
        step = 1
        while True:
            cx = player.x + facing_dx * step
            cy = player.y + facing_dy * step
            if not (0 <= cx < dungeon.width and 0 <= cy < dungeon.height):
                break
            max_depth = step
            # Stop AFTER including the blocking tile (we can see the wall itself).
            if dungeon.is_blocking_sight(cx, cy):
                break
            step += 1

        # Safety cap (keeps payload bounded on larger maps; still "all LOS" for typical dungeon sizes)
        MAX_FP_DEPTH = max(dungeon.width, dungeon.height)
        depth = min(max_depth, MAX_FP_DEPTH)

        # Width scaling tuned for the original depth=8 look (keeps framing consistent even if depth grows)
        REFERENCE_DEPTH = 8
        base_width = 9
        MAX_HALF_WIDTH = 25

        rows = []
        entities_in_view = []

        # Start from depth 0 (tiles beside player) for accurate side wall detection
        for d in range(0, depth + 1):
            row = []
            # Calculate center of this row
            row_center_x = player.x + facing_dx * d
            row_center_y = player.y + facing_dy * d

            # Width at this depth (perspective)
            # IMPORTANT: do NOT divide by "depth" (which is now dynamic),
            # or the view gets unnaturally narrow as depth increases.
            half_width = (base_width * d) // REFERENCE_DEPTH + 1
            if half_width > MAX_HALF_WIDTH:
                half_width = MAX_HALF_WIDTH

            for w in range(-half_width, half_width + 1):
                tile_x = row_center_x + perp_dx * w
                tile_y = row_center_y + perp_dy * w

                # Check bounds and visibility
                in_bounds = 0 <= tile_x < dungeon.width and 0 <= tile_y < dungeon.height

                # Check line of sight - walls should block visibility of tiles behind them
                has_los = in_bounds and self._has_line_of_sight(dungeon, player.x, player.y, tile_x, tile_y)

                if in_bounds and has_los:
                    tile = dungeon.tiles[tile_y][tile_x]
                    tile_char = tile.value if hasattr(tile, 'value') else str(tile)

                    # Check for entity at this position
                    # Only include entities at depth > 0 (in front of player, not beside)
                    # Depth 0 is used for side wall detection only
                    entity_here = None

                    # Check for enemy (only in front, not beside, and within FOV cone)
                    if engine.entity_manager and d > 0:
                        for enemy in engine.entity_manager.enemies:
                            if enemy is None:
                                continue
                            try:
                                if (enemy.is_alive() and enemy.x == tile_x and enemy.y == tile_y and
                                    self._is_in_fov_cone(player.x, player.y, tile_x, tile_y, facing_dx, facing_dy, max_distance=depth)):
                                    entity_here = {
                                        "type": "enemy",
                                        "name": enemy.name if hasattr(enemy, 'name') and enemy.name else "enemy",
                                        "symbol": enemy.symbol if hasattr(enemy, 'symbol') and enemy.symbol else "?",
                                        "health": enemy.health if hasattr(enemy, 'health') else 0,
                                        "max_health": enemy.max_health if hasattr(enemy, 'max_health') else 0,
                                        "is_elite": getattr(enemy, 'is_elite', False),
                                        "distance": d,
                                        "offset": w,
                                        "x": tile_x,
                                        "y": tile_y,
                                    }
                                    entities_in_view.append(entity_here)
                                    break
                            except (AttributeError, TypeError):
                                continue  # Skip malformed enemy

                        # Check for item (within FOV cone)
                        if not entity_here:
                            for item in engine.entity_manager.items:
                                if item is None:
                                    continue
                                try:
                                    if (item.x == tile_x and item.y == tile_y and
                                        self._is_in_fov_cone(player.x, player.y, tile_x, tile_y, facing_dx, facing_dy, max_distance=depth)):
                                        entity_here = {
                                            "type": "item",
                                            "name": item.name if hasattr(item, 'name') and item.name else "item",
                                            "symbol": getattr(item, 'symbol', '?'),
                                            "distance": d,
                                            "offset": w,
                                            "x": tile_x,
                                            "y": tile_y,
                                        }
                                        entities_in_view.append(entity_here)
                                        break
                                except (AttributeError, TypeError):
                                    continue  # Skip malformed item

                    # Check for visible trap (only in front, not beside, within FOV cone)
                    if d > 0 and engine.trap_manager:
                        trap = engine.trap_manager.get_trap_at(tile_x, tile_y)
                        if (trap and not trap.hidden and trap.trap_type and
                            hasattr(trap.trap_type, 'name') and
                            self._is_in_fov_cone(player.x, player.y, tile_x, tile_y, facing_dx, facing_dy, max_distance=depth)):
                            try:
                                trap_type_name = trap.trap_type.name.lower() if trap.trap_type else "spike"
                                trap_name = trap.name if hasattr(trap, 'name') and trap.name else "trap"
                                trap_symbol = trap.symbol if hasattr(trap, 'symbol') and trap.symbol else "^"
                                trap_entity = {
                                    "type": "trap",
                                    "name": trap_name,
                                    "symbol": trap_symbol,
                                    "trap_type": trap_type_name,
                                    "triggered": trap.triggered if hasattr(trap, 'triggered') else False,
                                    "is_active": trap.is_active if hasattr(trap, 'is_active') else True,
                                    "distance": d,
                                    "offset": w,
                                    "x": tile_x,
                                    "y": tile_y,
                                }
                                entities_in_view.append(trap_entity)
                            except (AttributeError, TypeError):
                                pass  # Skip malformed trap

                    # Check for hidden secret door (for visual hints)
                    has_secret = False
                    if engine.secret_door_manager:
                        secret_door = engine.secret_door_manager.get_door_at(tile_x, tile_y)
                        if secret_door and secret_door.hidden:
                            has_secret = True

                    row.append({
                        "tile": tile_char,
                        "tile_actual": tile_char,  # Same as tile when visible
                        "offset": w,  # Lateral offset from center (-left, +right)
                        "x": tile_x,
                        "y": tile_y,
                        "visible": True,
                        "walkable": dungeon.is_walkable(tile_x, tile_y),
                        "has_entity": entity_here is not None,
                        "has_secret": has_secret,
                    })
                elif in_bounds and dungeon.explored[tile_y][tile_x]:
                    # Get actual tile for geometry even though display shows fog
                    actual_tile = dungeon.tiles[tile_y][tile_x]
                    actual_char = actual_tile.value if hasattr(actual_tile, 'value') else str(actual_tile)
                    row.append({
                        "tile": "~",  # Display: explored but not visible (fog)
                        "tile_actual": actual_char,  # Geometry: real map tile
                        "offset": w,  # Lateral offset from center (-left, +right)
                        "x": tile_x,
                        "y": tile_y,
                        "visible": False,
                        "walkable": dungeon.is_walkable(tile_x, tile_y),
                        "has_entity": False,
                    })
                else:
                    # OOB or unexplored: skip to avoid corrupting offset mapping
                    # Renderer uses tile.offset field instead of array index
                    continue

            rows.append(row)

        # Serialize torches in view
        torches_in_view = []
        if hasattr(engine, 'torch_manager') and engine.torch_manager:
            for torch in engine.torch_manager.torches:
                if not torch.is_lit:
                    continue

                # Check if torch is in FOV cone
                if not self._is_in_fov_cone(player.x, player.y, torch.x, torch.y, facing_dx, facing_dy, max_distance=depth):
                    continue

                # Check line of sight to torch
                if not self._has_line_of_sight(dungeon, player.x, player.y, torch.x, torch.y):
                    continue

                # Calculate relative position
                rel_x = torch.x - player.x
                rel_y = torch.y - player.y

                # Distance along facing direction
                distance = rel_x * facing_dx + rel_y * facing_dy

                # Offset perpendicular to facing
                offset = rel_x * perp_dx + rel_y * perp_dy

                torches_in_view.append({
                    "x": torch.x,
                    "y": torch.y,
                    "distance": distance,
                    "offset": offset,
                    "facing_dx": torch.facing_dx,
                    "facing_dy": torch.facing_dy,
                    "intensity": torch.intensity,
                    "radius": torch.radius,
                    "is_lit": torch.is_lit,
                    "torch_type": torch.torch_type,
                })

        # Calculate lighting data for visible tiles
        lighting = {}
        if hasattr(engine, 'torch_manager') and engine.torch_manager and len(engine.torch_manager.torches) > 0:
            # Get entity positions that block light
            blocker_positions = set()
            blocker_positions.add((player.x, player.y))
            if hasattr(engine, 'entity_manager') and engine.entity_manager:
                for enemy in engine.entity_manager.enemies:
                    if enemy.is_alive():
                        blocker_positions.add((enemy.x, enemy.y))

            # Calculate lighting
            lit_tiles = engine.torch_manager.calculate_lighting(dungeon, blocker_positions)

            # Only include tiles in our view
            for row in rows:
                for tile_data in row:
                    tx, ty = tile_data.get("x", -1), tile_data.get("y", -1)
                    if tx >= 0 and ty >= 0:
                        light_level = lit_tiles.get((tx, ty), 0.0)
                        if light_level > 0.05:  # Only include meaningfully lit tiles
                            lighting[f"{tx},{ty}"] = round(light_level, 2)

        # Generate 11x11 top-down window around player for debug visualization
        top_down_window = []
        window_radius = 5  # 5 in each direction = 11x11
        for dy in range(-window_radius, window_radius + 1):
            row_tiles = []
            for dx in range(-window_radius, window_radius + 1):
                wx = player.x + dx
                wy = player.y + dy
                if 0 <= wx < dungeon.width and 0 <= wy < dungeon.height:
                    tile = dungeon.tiles[wy][wx]
                    tile_char = tile.value if hasattr(tile, 'value') else str(tile)
                    # Mark player position
                    if dx == 0 and dy == 0:
                        tile_char = '@'
                    # Mark enemies
                    elif engine.entity_manager:
                        for enemy in engine.entity_manager.enemies:
                            if enemy and enemy.is_alive() and enemy.x == wx and enemy.y == wy:
                                tile_char = enemy.symbol if hasattr(enemy, 'symbol') else 'E'
                                break
                        # Mark items
                        if tile_char not in ['@', 'E']:
                            for item in engine.entity_manager.items:
                                if item and item.x == wx and item.y == wy:
                                    tile_char = item.symbol if hasattr(item, 'symbol') else '!'
                                    break
                    row_tiles.append(tile_char)
                else:
                    row_tiles.append(' ')  # Out of bounds
            top_down_window.append(row_tiles)

        # Get current room info for ceiling/skybox override
        current_room = dungeon.get_room_at(player.x, player.y)
        zone_id = current_room.zone if current_room else "corridor"

        # Determine ceiling state and skybox override based on floor/zone
        room_has_ceiling = True
        room_skybox_override = None

        # =================================================================
        # OUTDOOR FLOORS: Inverted ceiling logic
        # Corridors = open-air pathways (no ceiling, sky visible)
        # Rooms = buildings (have ceilings), except outdoor plazas
        # =================================================================
        outdoor_floors = {
            4: "crypt",   # Mirror Valdris - ruined outdoor kingdom
        }

        # Outdoor plazas/courtyards in outdoor floors (rooms without ceilings)
        outdoor_plazas = {
            (4, "courtyard_squares"),   # Open plazas
            (4, "throne_hall_ruins"),   # Ruined throne, exposed to sky
        }

        # =================================================================
        # STANDARD FLOORS: Traditional open-air zones (rooms only)
        # =================================================================
        open_air_zones = {
            # Floor 3: Forest - open canopy areas
            (3, "canopy_halls"): "forest",

            # Floor 5: Ice Cavern - some open frozen areas
            (5, "crystal_grottos"): "ice",
            (5, "thaw_fault"): "ice",

            # Floor 7: Volcanic Depths - open caldera/lava areas
            (7, "crucible_heart"): "lava",
            (7, "slag_pits"): "lava",

            # Floor 8: Crystal Cave - dragon's domain
            (8, "dragons_hoard"): "crystal",
        }

        zone_key = (dungeon.level, zone_id)

        # Check if this is an outdoor floor with inverted logic
        if dungeon.level in outdoor_floors:
            skybox = outdoor_floors[dungeon.level]
            if zone_id == "corridor":
                # Corridors are open-air pathways in outdoor floors
                room_has_ceiling = False
                room_skybox_override = skybox
            elif zone_key in outdoor_plazas:
                # Specific outdoor rooms (courtyards, ruins) are also open
                room_has_ceiling = False
                room_skybox_override = skybox
            # else: rooms are buildings with ceilings (default True)
        elif zone_key in open_air_zones:
            # Traditional open-air zone on standard floors
            room_has_ceiling = False
            room_skybox_override = open_air_zones[zone_key]

        return {
            "rows": rows,
            "entities": entities_in_view,
            "torches": torches_in_view,
            "lighting": lighting,
            "facing": {"dx": facing_dx, "dy": facing_dy},
            "depth": depth,
            "top_down_window": top_down_window,
            # Room ceiling/skybox info for 3D renderer
            "zone_id": zone_id,
            "room_has_ceiling": room_has_ceiling,
            "room_skybox_override": room_skybox_override,
        }

    def get_active_session_count(self) -> int:
        """Get the number of active game sessions."""
        return len(self.sessions)

    def get_active_games(self) -> List[dict]:
        """Get list of active games available for spectating."""
        games = []
        for user_id, session in self.sessions.items():
            if session.allow_spectators:
                games.append({
                    "session_id": session.session_id,
                    "username": session.username,
                    "level": session.engine.current_level if session.engine else 1,
                    "turn_count": session.turn_count,
                    "spectator_count": len(session.spectator_websockets),
                    "started_at": session.created_at.isoformat(),
                })
        return games

    async def get_session_by_id(self, session_id: str) -> Optional[GameSession]:
        """Get a session by its session_id (for spectators)."""
        for session in self.sessions.values():
            if session.session_id == session_id:
                return session
        return None

    async def add_spectator(self, session_id: str, websocket: Any) -> Optional[GameSession]:
        """Add a spectator to a game session."""
        session = await self.get_session_by_id(session_id)
        if session and session.allow_spectators:
            session.spectator_websockets.append(websocket)
            return session
        return None

    async def remove_spectator(self, session_id: str, websocket: Any):
        """Remove a spectator from a game session."""
        session = await self.get_session_by_id(session_id)
        if session and websocket in session.spectator_websockets:
            session.spectator_websockets.remove(websocket)


# Global session manager instance
session_manager = GameSessionManager()
