"""Game session package - WebSocket game instance management.

This package contains:
- session.py: GameSession dataclass
- view.py: First-person view and visibility helpers
- cheats.py: Cheat command processing
- manager.py: GameSessionManager class
"""

from .session import GameSession
from .manager import GameSessionManager, GAME_ENGINE_AVAILABLE

# Global session manager instance
session_manager = GameSessionManager()

__all__ = [
    'GameSession',
    'GameSessionManager',
    'session_manager',
    'GAME_ENGINE_AVAILABLE',
]
