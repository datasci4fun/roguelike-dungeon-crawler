"""Game session manager for WebSocket game instances."""
import sys
import os
from typing import Dict, Optional, Any, List
from dataclasses import dataclass, field
from datetime import datetime
import asyncio
import uuid

# Add game source to path for importing engine
# In Docker: /app/game_src, Local: ../../../src
game_src_paths = [
    "/app/game_src",
    os.path.join(os.path.dirname(__file__), "..", "..", "..", "..", "src"),
]
for path in game_src_paths:
    abs_path = os.path.abspath(path)
    if os.path.exists(abs_path) and abs_path not in sys.path:
        sys.path.insert(0, abs_path)

# Import game engine components
try:
    from core.engine import GameEngine
    from core.commands import Command, CommandType
    from core.constants import GameState, UIMode
    GAME_ENGINE_AVAILABLE = True
except ImportError as e:
    print(f"Warning: Could not import game engine: {e}")
    GAME_ENGINE_AVAILABLE = False
    GameEngine = None
    Command = None
    CommandType = None
    GameState = None
    UIMode = None


@dataclass
class GameSession:
    """Represents an active game session for a user."""
    session_id: str
    user_id: int
    engine: Any  # GameEngine instance
    created_at: datetime = field(default_factory=datetime.utcnow)
    last_activity: datetime = field(default_factory=datetime.utcnow)
    turn_count: int = 0

    def update_activity(self):
        """Update last activity timestamp."""
        self.last_activity = datetime.utcnow()


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

    async def create_session(self, user_id: int) -> Optional[GameSession]:
        """
        Create a new game session for a user.

        Args:
            user_id: The user's ID

        Returns:
            The created GameSession, or None if engine not available
        """
        if not GAME_ENGINE_AVAILABLE:
            return None

        async with self._lock:
            # End existing session if any
            if user_id in self.sessions:
                del self.sessions[user_id]

            # Create new engine and session
            engine = GameEngine()
            engine.start_new_game()

            session = GameSession(
                session_id=str(uuid.uuid4()),
                user_id=user_id,
                engine=engine,
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
                    "started_at": session.created_at,
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

        # Convert string command to CommandType
        try:
            cmd_type = CommandType[command_type.upper()]
        except (KeyError, AttributeError):
            return {"error": f"Unknown command: {command_type}"}

        command = Command(cmd_type)

        # Process based on current game state
        if engine.state == GameState.PLAYING:
            if engine.ui_mode == UIMode.GAME:
                player_acted = engine.process_game_command(command)
                if player_acted:
                    session.turn_count += 1
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

        # Get events generated by the command
        events = engine.flush_events()

        # Build and return state update
        return self.serialize_game_state(session, events)

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
        }

        # Add player data if available
        if engine.player:
            state["player"] = {
                "x": engine.player.x,
                "y": engine.player.y,
                "health": engine.player.health,
                "max_health": engine.player.max_health,
                "attack": engine.player.attack_damage,
                "defense": engine.player.defense,
                "level": engine.player.level,
                "xp": engine.player.xp,
                "xp_to_level": engine.player.xp_to_level,
                "kills": engine.player.kills,
            }

        # Add dungeon data if available
        if engine.dungeon:
            state["dungeon"] = {
                "level": engine.dungeon.level,
                "width": engine.dungeon.width,
                "height": engine.dungeon.height,
                "tiles": self._serialize_visible_tiles(engine),
            }

        # Add enemies in view
        if engine.entity_manager:
            state["enemies"] = [
                {
                    "x": e.x,
                    "y": e.y,
                    "name": e.name,
                    "health": e.health,
                    "max_health": e.max_health,
                    "is_elite": e.is_elite,
                    "symbol": e.symbol,
                }
                for e in engine.entity_manager.enemies
                if e.is_alive() and self._is_visible(engine, e.x, e.y)
            ]

            state["items"] = [
                {
                    "x": i.x,
                    "y": i.y,
                    "name": i.name,
                    "symbol": getattr(i, 'symbol', '?'),
                }
                for i in engine.entity_manager.items
                if self._is_visible(engine, i.x, i.y)
            ]

        # Add messages
        state["messages"] = engine.messages[-10:] if engine.messages else []

        # Add events for animations
        state["events"] = [
            {"type": e.type.name, "data": e.data}
            for e in events
        ]

        # Add UI-specific data
        if engine.ui_mode == UIMode.INVENTORY and engine.player:
            state["inventory"] = {
                "items": [
                    {
                        "name": item.name,
                        "type": item.item_type.name if hasattr(item, 'item_type') else "UNKNOWN",
                        "rarity": item.rarity.name if hasattr(item, 'rarity') else "COMMON",
                    }
                    for item in engine.player.inventory.items
                ],
                "selected_index": engine.selected_item_index,
            }

        if engine.ui_mode == UIMode.DIALOG:
            state["dialog"] = {
                "title": engine.dialog_title,
                "message": engine.dialog_message,
            }

        return state

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

    def get_active_session_count(self) -> int:
        """Get the number of active game sessions."""
        return len(self.sessions)


# Global session manager instance
session_manager = GameSessionManager()
