"""Message system for game feedback."""
from dataclasses import dataclass, field
from enum import Enum, auto
from typing import List
import time


class MessageCategory(Enum):
    """Categories for game messages."""
    COMBAT = auto()     # Combat-related messages
    ITEM = auto()       # Item pickup/use messages
    SYSTEM = auto()     # System messages (save, quit, etc.)
    STORY = auto()      # Lore/story messages
    LEVEL = auto()      # Level/exploration messages


class MessageImportance(Enum):
    """Importance levels for messages."""
    NORMAL = auto()     # Regular messages
    IMPORTANT = auto()  # Important events (level up, rare item)
    CRITICAL = auto()   # Critical events (low health, boss)


@dataclass
class GameMessage:
    """A game message with metadata."""
    text: str
    category: MessageCategory = MessageCategory.SYSTEM
    importance: MessageImportance = MessageImportance.NORMAL
    timestamp: float = field(default_factory=time.time)

    def __str__(self) -> str:
        return self.text


class MessageLog:
    """Manages the game's message history."""

    MAX_MESSAGES = 100  # Keep last 100 messages

    def __init__(self):
        self.messages: List[GameMessage] = []
        self.scroll_offset = 0  # For message log screen scrolling

    def add(self, text: str, category: MessageCategory = MessageCategory.SYSTEM,
            importance: MessageImportance = MessageImportance.NORMAL):
        """Add a new message to the log."""
        msg = GameMessage(text=text, category=category, importance=importance)
        self.messages.append(msg)

        # Trim old messages
        if len(self.messages) > self.MAX_MESSAGES:
            self.messages = self.messages[-self.MAX_MESSAGES:]

    def get_recent(self, count: int = 5) -> List[GameMessage]:
        """Get the most recent messages."""
        return self.messages[-count:] if self.messages else []

    def get_all(self) -> List[GameMessage]:
        """Get all messages."""
        return self.messages

    def get_by_category(self, category: MessageCategory) -> List[GameMessage]:
        """Get messages filtered by category."""
        return [m for m in self.messages if m.category == category]

    def clear(self):
        """Clear all messages."""
        self.messages.clear()
        self.scroll_offset = 0

    def scroll_up(self, amount: int = 1):
        """Scroll up in the message log."""
        self.scroll_offset = max(0, self.scroll_offset - amount)

    def scroll_down(self, amount: int = 1, visible_lines: int = 20):
        """Scroll down in the message log."""
        max_offset = max(0, len(self.messages) - visible_lines)
        self.scroll_offset = min(max_offset, self.scroll_offset + amount)

    def reset_scroll(self):
        """Reset scroll position to show latest messages."""
        self.scroll_offset = 0

    def to_string_list(self) -> List[str]:
        """Convert messages to simple string list (for compatibility)."""
        return [msg.text for msg in self.messages]
