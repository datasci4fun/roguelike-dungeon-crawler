"""Abstract command system for platform-agnostic input handling.

Commands represent player intentions, decoupled from specific input methods
(keyboard, gamepad, network, etc.)
"""
from dataclasses import dataclass
from enum import Enum, auto
from typing import Optional, Any


class CommandType(Enum):
    """Types of commands the player can issue."""
    # Movement
    MOVE_UP = auto()
    MOVE_DOWN = auto()
    MOVE_LEFT = auto()
    MOVE_RIGHT = auto()

    # Items (quick slots)
    USE_ITEM_1 = auto()
    USE_ITEM_2 = auto()
    USE_ITEM_3 = auto()

    # UI navigation
    OPEN_INVENTORY = auto()
    OPEN_CHARACTER = auto()
    OPEN_HELP = auto()
    OPEN_MESSAGE_LOG = auto()
    CLOSE_SCREEN = auto()

    # Inventory actions
    INVENTORY_UP = auto()
    INVENTORY_DOWN = auto()
    INVENTORY_USE = auto()
    INVENTORY_EQUIP = auto()
    INVENTORY_DROP = auto()
    INVENTORY_READ = auto()

    # Dialog responses
    CONFIRM = auto()
    CANCEL = auto()

    # Menu navigation
    MENU_SELECT = auto()
    MENU_UP = auto()
    MENU_DOWN = auto()

    # Scrolling
    SCROLL_UP = auto()
    SCROLL_DOWN = auto()
    PAGE_UP = auto()
    PAGE_DOWN = auto()

    # Game actions
    QUIT = auto()
    DESCEND = auto()  # Use stairs

    # Title screen
    NEW_GAME = auto()
    CONTINUE_GAME = auto()

    # Special
    SKIP = auto()      # Skip intro/cutscene
    ANY_KEY = auto()   # Any key pressed (for "press any key" prompts)
    NONE = auto()      # No command (no input or unrecognized)

    # Feat selection
    SELECT_FEAT = auto()  # Select a feat (data contains feat_id)


@dataclass
class Command:
    """
    A command issued by the player.

    Attributes:
        type: The type of command
        data: Optional command-specific data (e.g., item index, direction)
    """
    type: CommandType
    data: Optional[Any] = None

    def __repr__(self):
        if self.data is not None:
            return f"Command({self.type.name}, {self.data})"
        return f"Command({self.type.name})"

    @classmethod
    def none(cls) -> 'Command':
        """Create a no-op command."""
        return cls(CommandType.NONE)

    @classmethod
    def move(cls, dx: int, dy: int) -> 'Command':
        """Create a movement command from delta values."""
        if dy < 0:
            return cls(CommandType.MOVE_UP)
        elif dy > 0:
            return cls(CommandType.MOVE_DOWN)
        elif dx < 0:
            return cls(CommandType.MOVE_LEFT)
        elif dx > 0:
            return cls(CommandType.MOVE_RIGHT)
        return cls.none()


# Command categories for easier handling
MOVEMENT_COMMANDS = {
    CommandType.MOVE_UP,
    CommandType.MOVE_DOWN,
    CommandType.MOVE_LEFT,
    CommandType.MOVE_RIGHT,
}

ITEM_COMMANDS = {
    CommandType.USE_ITEM_1,
    CommandType.USE_ITEM_2,
    CommandType.USE_ITEM_3,
}

UI_OPEN_COMMANDS = {
    CommandType.OPEN_INVENTORY,
    CommandType.OPEN_CHARACTER,
    CommandType.OPEN_HELP,
    CommandType.OPEN_MESSAGE_LOG,
}

INVENTORY_COMMANDS = {
    CommandType.INVENTORY_UP,
    CommandType.INVENTORY_DOWN,
    CommandType.INVENTORY_USE,
    CommandType.INVENTORY_EQUIP,
    CommandType.INVENTORY_DROP,
    CommandType.INVENTORY_READ,
}

SCROLL_COMMANDS = {
    CommandType.SCROLL_UP,
    CommandType.SCROLL_DOWN,
    CommandType.PAGE_UP,
    CommandType.PAGE_DOWN,
}


def get_movement_delta(command_type: CommandType) -> tuple:
    """
    Get the (dx, dy) delta for a movement command.

    Returns:
        Tuple of (dx, dy) for the movement, or (0, 0) if not a movement command
    """
    deltas = {
        CommandType.MOVE_UP: (0, -1),
        CommandType.MOVE_DOWN: (0, 1),
        CommandType.MOVE_LEFT: (-1, 0),
        CommandType.MOVE_RIGHT: (1, 0),
    }
    return deltas.get(command_type, (0, 0))


def get_item_index(command_type: CommandType) -> int:
    """
    Get the item index for an item use command.

    Returns:
        Item index (0-2), or -1 if not an item command
    """
    indices = {
        CommandType.USE_ITEM_1: 0,
        CommandType.USE_ITEM_2: 1,
        CommandType.USE_ITEM_3: 2,
    }
    return indices.get(command_type, -1)
