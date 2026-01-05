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
                    "started_at": session.created_at,
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

            # Add first-person view data (tiles in front of player)
            state["first_person_view"] = self._serialize_first_person_view(engine, facing)

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
            {"type": e.type.name, "data": self._sanitize_event_data(e.data)}
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
        depth = 8  # How far ahead to look
        base_width = 9  # Width at far end (wider to capture room walls)

        rows = []
        entities_in_view = []

        # Start from depth 0 (tiles beside player) for accurate side wall detection
        for d in range(0, depth + 1):
            row = []
            # Calculate center of this row
            row_center_x = player.x + facing_dx * d
            row_center_y = player.y + facing_dy * d

            # Width at this depth (perspective - wider at distance)
            half_width = (base_width * d) // depth + 1

            for w in range(-half_width, half_width + 1):
                tile_x = row_center_x + perp_dx * w
                tile_y = row_center_y + perp_dy * w

                # Check bounds and visibility
                in_bounds = 0 <= tile_x < dungeon.width and 0 <= tile_y < dungeon.height

                if in_bounds and dungeon.visible[tile_y][tile_x]:
                    tile = dungeon.tiles[tile_y][tile_x]
                    tile_char = tile.value if hasattr(tile, 'value') else str(tile)

                    # Check for entity at this position
                    # Only include entities at depth > 0 (in front of player, not beside)
                    # Depth 0 is used for side wall detection only
                    entity_here = None

                    # Check for enemy (only in front, not beside)
                    if engine.entity_manager and d > 0:
                        for enemy in engine.entity_manager.enemies:
                            if enemy.is_alive() and enemy.x == tile_x and enemy.y == tile_y:
                                entity_here = {
                                    "type": "enemy",
                                    "name": enemy.name,
                                    "symbol": enemy.symbol,
                                    "health": enemy.health,
                                    "max_health": enemy.max_health,
                                    "is_elite": enemy.is_elite,
                                    "distance": d,
                                    "offset": w,
                                    "x": tile_x,
                                    "y": tile_y,
                                }
                                entities_in_view.append(entity_here)
                                break

                        # Check for item
                        if not entity_here:
                            for item in engine.entity_manager.items:
                                if item.x == tile_x and item.y == tile_y:
                                    entity_here = {
                                        "type": "item",
                                        "name": item.name,
                                        "symbol": getattr(item, 'symbol', '?'),
                                        "distance": d,
                                        "offset": w,
                                        "x": tile_x,
                                        "y": tile_y,
                                    }
                                    entities_in_view.append(entity_here)
                                    break

                    row.append({
                        "tile": tile_char,
                        "x": tile_x,
                        "y": tile_y,
                        "visible": True,
                        "walkable": dungeon.is_walkable(tile_x, tile_y),
                        "has_entity": entity_here is not None,
                    })
                elif in_bounds and dungeon.explored[tile_y][tile_x]:
                    row.append({
                        "tile": "~",  # Explored but not visible
                        "x": tile_x,
                        "y": tile_y,
                        "visible": False,
                        "walkable": False,
                        "has_entity": False,
                    })
                else:
                    row.append({
                        "tile": "#",  # Unknown or out of bounds
                        "x": tile_x if in_bounds else -1,
                        "y": tile_y if in_bounds else -1,
                        "visible": False,
                        "walkable": False,
                        "has_entity": False,
                    })

            rows.append(row)

        return {
            "rows": rows,
            "entities": entities_in_view,
            "facing": {"dx": facing_dx, "dy": facing_dy},
            "depth": depth,
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
