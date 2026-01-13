"""GameSessionManager - manages active game sessions for all connected users."""
import sys
import os
from typing import Dict, Optional, Any, List
from datetime import datetime
import asyncio
import uuid

from ..ghost_recorder import GhostRecorder
from .session import GameSession
from .view import serialize_visible_tiles, serialize_first_person_view
from .cheats import process_cheat
from . import manager_serialization

# Add game source parent to path for importing engine as a package
# In Docker: /app (parent of game_src), Local: ../../../.. (parent of src)
# The src directory is mounted as game_src, so we import from game_src.core
game_parent_paths = [
    "/app",  # Docker: game_src is mounted here
    os.path.join(os.path.dirname(__file__), "..", "..", "..", "..", ".."),  # Local dev
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

# Initialize serialization module with game constants
manager_serialization.set_game_constants(RACE_STATS, CLASS_STATS, UIMode)


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
            process_cheat(engine, cmd_type)
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
            "transition": engine.transition.to_dict(),
        }

        # Add player data if available
        if engine.player:
            player_data, facing = manager_serialization.serialize_player(engine, engine.player)
            state["player"] = player_data

            # Add first-person view data
            try:
                state["first_person_view"] = serialize_first_person_view(engine, facing)
            except Exception as e:
                print(f"Error in serialize_first_person_view: {e}")
                state["first_person_view"] = {"rows": [], "entities": [], "torches": [], "lighting": {}, "facing": {"dx": facing[0], "dy": facing[1]}, "depth": 8}

        # Add dungeon data if available
        if engine.dungeon:
            try:
                state["dungeon"] = {
                    "level": engine.dungeon.level,
                    "width": engine.dungeon.width,
                    "height": engine.dungeon.height,
                    "tiles": serialize_visible_tiles(engine),
                }
            except Exception as e:
                print(f"Error serializing dungeon: {e}")
                state["dungeon"] = {"level": 1, "width": 50, "height": 30, "tiles": []}

        # Add enemies and items in view
        if engine.entity_manager:
            state["enemies"] = manager_serialization.serialize_enemies(engine)
            state["items"] = manager_serialization.serialize_items(engine)

        # Add messages
        state["messages"] = engine.messages[-10:] if engine.messages else []

        # Add events for animations
        state["events"] = manager_serialization.serialize_events(
            events, manager_serialization.sanitize_event_data
        )

        # Add UI-specific data
        if engine.ui_mode == UIMode.INVENTORY and engine.player:
            state["inventory"] = manager_serialization.serialize_inventory(engine)

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
            state["lore_journal"] = manager_serialization.serialize_lore_journal(engine)

        # Include newly discovered lore notification (one-shot, cleared after sending)
        if hasattr(engine, 'new_lore_discovered') and engine.new_lore_discovered:
            state["new_lore"] = engine.new_lore_discovered
            engine.new_lore_discovered = None

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
            state["zone_overlay"] = manager_serialization.serialize_zone_overlay(engine)

        # v6.0: Include battle state when in tactical combat
        if engine.ui_mode == UIMode.BATTLE and hasattr(engine, 'battle') and engine.battle:
            state["battle"] = manager_serialization.serialize_battle_state(engine.battle)

        return state

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
