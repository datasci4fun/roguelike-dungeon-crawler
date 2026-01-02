"""WebSocket connection manager for real-time game communication."""
from typing import Dict, Set, Optional, Any
import json
import asyncio

from fastapi import WebSocket


class ConnectionManager:
    """
    Manages WebSocket connections for game sessions.

    Tracks active connections and provides methods for
    broadcasting messages to specific users or all users.
    """

    def __init__(self):
        # Map of user_id -> WebSocket connection
        self.active_connections: Dict[int, WebSocket] = {}
        # Map of user_id -> game_session_id
        self.user_sessions: Dict[int, str] = {}
        # Lock for thread-safe operations
        self._lock = asyncio.Lock()

    async def connect(self, websocket: WebSocket, user_id: int) -> bool:
        """
        Accept a new WebSocket connection.

        Args:
            websocket: The WebSocket connection
            user_id: The authenticated user's ID

        Returns:
            True if connected successfully, False if user already connected
        """
        async with self._lock:
            # Disconnect existing connection if any
            if user_id in self.active_connections:
                old_ws = self.active_connections[user_id]
                try:
                    await old_ws.close(code=1000, reason="New connection opened")
                except Exception:
                    pass

            await websocket.accept()
            self.active_connections[user_id] = websocket
            return True

    async def disconnect(self, user_id: int):
        """
        Remove a WebSocket connection.

        Args:
            user_id: The user's ID
        """
        async with self._lock:
            if user_id in self.active_connections:
                del self.active_connections[user_id]
            if user_id in self.user_sessions:
                del self.user_sessions[user_id]

    def is_connected(self, user_id: int) -> bool:
        """Check if a user is currently connected."""
        return user_id in self.active_connections

    def get_connection(self, user_id: int) -> Optional[WebSocket]:
        """Get the WebSocket connection for a user."""
        return self.active_connections.get(user_id)

    async def send_json(self, user_id: int, data: dict):
        """
        Send JSON data to a specific user.

        Args:
            user_id: The user's ID
            data: Dictionary to send as JSON
        """
        websocket = self.active_connections.get(user_id)
        if websocket:
            try:
                await websocket.send_json(data)
            except Exception:
                await self.disconnect(user_id)

    async def send_text(self, user_id: int, message: str):
        """
        Send a text message to a specific user.

        Args:
            user_id: The user's ID
            message: The message to send
        """
        websocket = self.active_connections.get(user_id)
        if websocket:
            try:
                await websocket.send_text(message)
            except Exception:
                await self.disconnect(user_id)

    async def broadcast(self, data: dict, exclude: Optional[Set[int]] = None):
        """
        Broadcast JSON data to all connected users.

        Args:
            data: Dictionary to send as JSON
            exclude: Set of user IDs to exclude from broadcast
        """
        exclude = exclude or set()
        disconnected = []

        for user_id, websocket in self.active_connections.items():
            if user_id not in exclude:
                try:
                    await websocket.send_json(data)
                except Exception:
                    disconnected.append(user_id)

        # Clean up disconnected users
        for user_id in disconnected:
            await self.disconnect(user_id)

    def get_connected_count(self) -> int:
        """Get the number of active connections."""
        return len(self.active_connections)

    def get_connected_users(self) -> Set[int]:
        """Get set of connected user IDs."""
        return set(self.active_connections.keys())


# Global connection manager instance
manager = ConnectionManager()
