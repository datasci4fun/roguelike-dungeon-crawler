"""GameSession dataclass - represents an active game session."""
from typing import Optional, Any, List
from dataclasses import dataclass, field
from datetime import datetime


@dataclass
class GameSession:
    """Represents an active game session for a user."""
    session_id: str
    user_id: int
    username: str
    engine: Any  # GameEngine instance
    ghost_recorder: Optional['GhostRecorder'] = None
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
