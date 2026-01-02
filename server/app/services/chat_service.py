"""Chat service for managing messages and chat history."""
from datetime import datetime, timedelta
from typing import List, Optional
from sqlalchemy import select, or_, and_, desc
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import joinedload

from ..models.chat_message import ChatMessage, ChatChannel
from ..models.user import User


class ChatService:
    """Service for chat message operations."""

    # Maximum message length
    MAX_MESSAGE_LENGTH = 500

    # Rate limiting: messages per minute
    RATE_LIMIT_MESSAGES = 10
    RATE_LIMIT_WINDOW = 60  # seconds

    def __init__(self, db: AsyncSession):
        self.db = db

    async def send_message(
        self,
        sender_id: int,
        content: str,
        channel: str = ChatChannel.GLOBAL.value,
        recipient_id: Optional[int] = None,
    ) -> Optional[ChatMessage]:
        """
        Send a chat message.

        Args:
            sender_id: ID of the sender
            content: Message content
            channel: Chat channel (global, system, whisper)
            recipient_id: Recipient ID for whispers

        Returns:
            The created message, or None if failed
        """
        # Validate content
        if not content or not content.strip():
            return None

        content = content.strip()[:self.MAX_MESSAGE_LENGTH]

        # Check rate limit
        if not await self._check_rate_limit(sender_id):
            return None

        # For whispers, recipient is required
        if channel == ChatChannel.WHISPER.value and not recipient_id:
            return None

        # Create message
        message = ChatMessage(
            sender_id=sender_id,
            recipient_id=recipient_id,
            channel=channel,
            content=content,
        )

        self.db.add(message)
        await self.db.commit()
        await self.db.refresh(message)

        # Load sender relationship
        query = (
            select(ChatMessage)
            .options(joinedload(ChatMessage.sender))
            .where(ChatMessage.id == message.id)
        )
        result = await self.db.execute(query)
        return result.scalar_one()

    async def _check_rate_limit(self, user_id: int) -> bool:
        """Check if user is within rate limit."""
        cutoff = datetime.utcnow() - timedelta(seconds=self.RATE_LIMIT_WINDOW)

        query = select(ChatMessage).where(
            and_(
                ChatMessage.sender_id == user_id,
                ChatMessage.created_at >= cutoff,
            )
        )
        result = await self.db.execute(query)
        recent_messages = result.scalars().all()

        return len(recent_messages) < self.RATE_LIMIT_MESSAGES

    async def get_global_messages(
        self,
        limit: int = 50,
        before_id: Optional[int] = None,
    ) -> List[ChatMessage]:
        """
        Get global chat messages.

        Args:
            limit: Maximum messages to return
            before_id: Get messages before this ID (for pagination)

        Returns:
            List of messages, newest first
        """
        query = (
            select(ChatMessage)
            .options(joinedload(ChatMessage.sender))
            .where(ChatMessage.channel == ChatChannel.GLOBAL.value)
        )

        if before_id:
            query = query.where(ChatMessage.id < before_id)

        query = query.order_by(desc(ChatMessage.created_at)).limit(limit)

        result = await self.db.execute(query)
        messages = result.scalars().all()

        # Return in chronological order
        return list(reversed(messages))

    async def get_whispers(
        self,
        user_id: int,
        other_user_id: int,
        limit: int = 50,
        before_id: Optional[int] = None,
    ) -> List[ChatMessage]:
        """
        Get whisper conversation between two users.

        Args:
            user_id: Current user ID
            other_user_id: Other user in conversation
            limit: Maximum messages to return
            before_id: Get messages before this ID

        Returns:
            List of messages in chronological order
        """
        query = (
            select(ChatMessage)
            .options(
                joinedload(ChatMessage.sender),
                joinedload(ChatMessage.recipient),
            )
            .where(ChatMessage.channel == ChatChannel.WHISPER.value)
            .where(
                or_(
                    and_(
                        ChatMessage.sender_id == user_id,
                        ChatMessage.recipient_id == other_user_id,
                    ),
                    and_(
                        ChatMessage.sender_id == other_user_id,
                        ChatMessage.recipient_id == user_id,
                    ),
                )
            )
        )

        if before_id:
            query = query.where(ChatMessage.id < before_id)

        query = query.order_by(desc(ChatMessage.created_at)).limit(limit)

        result = await self.db.execute(query)
        messages = result.scalars().all()

        return list(reversed(messages))

    async def get_user_whisper_conversations(
        self,
        user_id: int,
        limit: int = 20,
    ) -> List[dict]:
        """
        Get list of users the current user has whispered with.

        Args:
            user_id: Current user ID
            limit: Maximum conversations to return

        Returns:
            List of conversation summaries
        """
        # Get unique users from whisper conversations
        # This is a simplified approach - could be optimized with raw SQL
        query = (
            select(ChatMessage)
            .options(
                joinedload(ChatMessage.sender),
                joinedload(ChatMessage.recipient),
            )
            .where(ChatMessage.channel == ChatChannel.WHISPER.value)
            .where(
                or_(
                    ChatMessage.sender_id == user_id,
                    ChatMessage.recipient_id == user_id,
                )
            )
            .order_by(desc(ChatMessage.created_at))
        )

        result = await self.db.execute(query)
        messages = result.scalars().all()

        # Extract unique conversation partners
        conversations = {}
        for msg in messages:
            if msg.sender_id == user_id:
                other_id = msg.recipient_id
                other_user = msg.recipient
            else:
                other_id = msg.sender_id
                other_user = msg.sender

            if other_id not in conversations:
                conversations[other_id] = {
                    "user_id": other_id,
                    "username": other_user.username if other_user else None,
                    "display_name": other_user.display_name if other_user else None,
                    "last_message": msg.content[:50],
                    "last_message_at": msg.created_at,
                }

            if len(conversations) >= limit:
                break

        return list(conversations.values())

    async def get_system_messages(
        self,
        limit: int = 20,
        since: Optional[datetime] = None,
    ) -> List[ChatMessage]:
        """
        Get system messages/announcements.

        Args:
            limit: Maximum messages to return
            since: Get messages since this time

        Returns:
            List of system messages
        """
        query = (
            select(ChatMessage)
            .where(ChatMessage.channel == ChatChannel.SYSTEM.value)
        )

        if since:
            query = query.where(ChatMessage.created_at >= since)

        query = query.order_by(desc(ChatMessage.created_at)).limit(limit)

        result = await self.db.execute(query)
        messages = result.scalars().all()

        return list(reversed(messages))

    async def send_system_message(self, content: str) -> ChatMessage:
        """
        Send a system announcement message.

        Args:
            content: Message content

        Returns:
            The created message
        """
        # System messages use sender_id 0 or a special system user
        message = ChatMessage(
            sender_id=1,  # Assume user ID 1 is system/admin
            channel=ChatChannel.SYSTEM.value,
            content=content,
        )

        self.db.add(message)
        await self.db.commit()
        await self.db.refresh(message)

        return message

    async def get_online_users(self, user_ids: List[int]) -> List[dict]:
        """
        Get user info for online users.

        Args:
            user_ids: List of user IDs currently online

        Returns:
            List of user info dictionaries
        """
        if not user_ids:
            return []

        query = select(User).where(User.id.in_(user_ids))
        result = await self.db.execute(query)
        users = result.scalars().all()

        return [
            {
                "user_id": u.id,
                "username": u.username,
                "display_name": u.display_name,
            }
            for u in users
        ]
