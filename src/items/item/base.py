"""Base item class and inventory system."""
from dataclasses import dataclass
from typing import TYPE_CHECKING, List

from .types import ItemType

if TYPE_CHECKING:
    from ...entities import Player


@dataclass
class Item:
    """Base class for items."""
    x: int
    y: int
    item_type: ItemType
    name: str
    symbol: str
    description: str
    rarity: 'ItemRarity' = None  # Item rarity for color coding
    equip_slot: 'EquipmentSlot' = None  # Which slot this item equips to (None = not equippable)

    def use(self, player: 'Player') -> str:
        """Use the item on the player.

        Returns a message describing what happened.
        """
        raise NotImplementedError

    def is_equippable(self) -> bool:
        """Check if this item can be equipped."""
        return self.equip_slot is not None


class Inventory:
    """Player inventory to hold items."""

    def __init__(self, max_size: int = 10):
        self.items: List[Item] = []
        self.max_size = max_size

    def add_item(self, item: Item) -> bool:
        """Add an item to inventory.

        Returns True if successful, False if inventory is full.
        """
        if len(self.items) >= self.max_size:
            return False
        self.items.append(item)
        return True

    def remove_item(self, index: int) -> Item:
        """Remove and return item at given index."""
        return self.items.pop(index)

    def is_full(self) -> bool:
        """Check if inventory is full."""
        return len(self.items) >= self.max_size

    def is_empty(self) -> bool:
        """Check if inventory is empty."""
        return len(self.items) == 0

    def get_item(self, index: int) -> Item:
        """Get item at index without removing it."""
        if 0 <= index < len(self.items):
            return self.items[index]
        return None
