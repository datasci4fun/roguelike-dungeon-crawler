"""Chat WebSocket manager for real-time messaging."""
from typing import Dict, Set, Optional, List
from dataclasses import dataclass, field
from datetime import datetime
import asyncio
import json

from fastapi import WebSocket


@dataclass
class ChatUser:
    """Represents a connected chat user."""
    user_id: int
    username: str
    websocket: WebSocket
    connected_at: datetime = field(default_factory=datetime.utcnow)


class ChatManager:
    """
    Manages WebSocket connections for real-time chat.

    Handles:
    - User connections/disconnections
    - Broadcasting messages to all users
    - Sending whispers to specific users
    - Tracking online users
    """

    def __init__(self):
        # Map of user_id -> ChatUser
        self._connections: Dict[int, ChatUser] = {}
        self._lock = asyncio.Lock()

    async def connect(
        self,
        websocket: WebSocket,
        user_id: int,
        username: str,
    ) -> bool:
        """
        Connect a user to chat.

        Args:
            websocket: The WebSocket connection
            user_id: User's ID
            username: User's username

        Returns:
            True if connected successfully
        """
        await websocket.accept()

        async with self._lock:
            # Disconnect existing connection if any
            if user_id in self._connections:
                try:
                    await self._connections[user_id].websocket.close()
                except:
                    pass

            self._connections[user_id] = ChatUser(
                user_id=user_id,
                username=username,
                websocket=websocket,
            )

        # Broadcast user joined
        await self.broadcast_system(f"{username} joined the chat")

        return True

    async def disconnect(self, user_id: int):
        """
        Disconnect a user from chat.

        Args:
            user_id: User's ID
        """
        async with self._lock:
            user = self._connections.pop(user_id, None)

        if user:
            # Broadcast user left
            await self.broadcast_system(f"{user.username} left the chat")

    async def broadcast(self, message: dict, exclude_user_id: Optional[int] = None):
        """
        Broadcast a message to all connected users.

        Args:
            message: Message dictionary to send
            exclude_user_id: User ID to exclude from broadcast
        """
        disconnected = []

        for user_id, user in self._connections.items():
            if user_id == exclude_user_id:
                continue

            try:
                await user.websocket.send_json(message)
            except Exception:
                disconnected.append(user_id)

        # Clean up disconnected users
        for user_id in disconnected:
            async with self._lock:
                self._connections.pop(user_id, None)

    async def broadcast_message(
        self,
        sender_id: int,
        sender_username: str,
        content: str,
        message_id: int,
        created_at: str,
    ):
        """
        Broadcast a chat message to all users.

        Args:
            sender_id: Sender's user ID
            sender_username: Sender's username
            content: Message content
            message_id: Database message ID
            created_at: Message timestamp
        """
        message = {
            "type": "chat_message",
            "channel": "global",
            "message": {
                "id": message_id,
                "sender_id": sender_id,
                "sender_username": sender_username,
                "content": content,
                "created_at": created_at,
            },
        }

        await self.broadcast(message)

    async def broadcast_system(self, content: str):
        """
        Broadcast a system message to all users.

        Args:
            content: System message content
        """
        message = {
            "type": "system_message",
            "content": content,
            "created_at": datetime.utcnow().isoformat(),
        }

        await self.broadcast(message)

    async def send_whisper(
        self,
        sender_id: int,
        sender_username: str,
        recipient_id: int,
        content: str,
        message_id: int,
        created_at: str,
    ) -> bool:
        """
        Send a whisper to a specific user.

        Args:
            sender_id: Sender's user ID
            sender_username: Sender's username
            recipient_id: Recipient's user ID
            content: Message content
            message_id: Database message ID
            created_at: Message timestamp

        Returns:
            True if recipient is online and message was sent
        """
        message = {
            "type": "whisper",
            "message": {
                "id": message_id,
                "sender_id": sender_id,
                "sender_username": sender_username,
                "content": content,
                "created_at": created_at,
            },
        }

        # Send to recipient
        recipient = self._connections.get(recipient_id)
        if recipient:
            try:
                await recipient.websocket.send_json(message)
            except Exception:
                return False

        # Also send to sender (echo)
        sender = self._connections.get(sender_id)
        if sender and sender_id != recipient_id:
            try:
                message["type"] = "whisper_sent"
                message["message"]["recipient_id"] = recipient_id
                await sender.websocket.send_json(message)
            except Exception:
                pass

        return recipient is not None

    async def send_to_user(self, user_id: int, message: dict) -> bool:
        """
        Send a message to a specific user.

        Args:
            user_id: Target user's ID
            message: Message dictionary

        Returns:
            True if sent successfully
        """
        user = self._connections.get(user_id)
        if not user:
            return False

        try:
            await user.websocket.send_json(message)
            return True
        except Exception:
            return False

    def get_online_users(self) -> List[dict]:
        """
        Get list of online users.

        Returns:
            List of online user info
        """
        return [
            {
                "user_id": user.user_id,
                "username": user.username,
                "connected_at": user.connected_at.isoformat(),
            }
            for user in self._connections.values()
        ]

    def get_online_user_ids(self) -> List[int]:
        """Get list of online user IDs."""
        return list(self._connections.keys())

    def get_online_count(self) -> int:
        """Get number of online users."""
        return len(self._connections)

    def is_online(self, user_id: int) -> bool:
        """Check if a user is online."""
        return user_id in self._connections


# Global chat manager instance
chat_manager = ChatManager()
