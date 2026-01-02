"""Chat message model for storing chat history."""
from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text, Enum
from sqlalchemy.orm import relationship
import enum

from ..core.database import Base


class ChatChannel(enum.Enum):
    """Available chat channels."""
    GLOBAL = "global"      # Global chat visible to all
    SYSTEM = "system"      # System announcements
    WHISPER = "whisper"    # Direct messages between users


class ChatMessage(Base):
    """Stores chat messages."""
    __tablename__ = "chat_messages"

    id = Column(Integer, primary_key=True, index=True)

    # Sender
    sender_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)

    # Recipient (for whispers/DMs)
    recipient_id = Column(Integer, ForeignKey("users.id"), nullable=True, index=True)

    # Channel type
    channel = Column(
        String(20),
        default=ChatChannel.GLOBAL.value,
        index=True
    )

    # Message content
    content = Column(Text, nullable=False)

    # Timestamp
    created_at = Column(DateTime, default=datetime.utcnow, index=True)

    # Relationships
    sender = relationship("User", foreign_keys=[sender_id], backref="sent_messages")
    recipient = relationship("User", foreign_keys=[recipient_id], backref="received_messages")

    def to_dict(self) -> dict:
        """Convert message to dictionary for JSON serialization."""
        return {
            "id": self.id,
            "sender_id": self.sender_id,
            "sender_username": self.sender.username if self.sender else None,
            "sender_display_name": self.sender.display_name if self.sender else None,
            "recipient_id": self.recipient_id,
            "recipient_username": self.recipient.username if self.recipient else None,
            "channel": self.channel,
            "content": self.content,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }

    def __repr__(self):
        return f"<ChatMessage(id={self.id}, sender={self.sender_id}, channel={self.channel})>"
