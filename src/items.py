"""Items and inventory system."""
from dataclasses import dataclass
from enum import Enum, auto
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from .entities import Player


class ItemType(Enum):
    """Types of items in the game."""
    HEALTH_POTION = auto()
    STRENGTH_POTION = auto()
    SCROLL_TELEPORT = auto()


@dataclass
class Item:
    """Base class for items."""
    x: int
    y: int
    item_type: ItemType
    name: str
    symbol: str
    description: str

    def use(self, player: 'Player') -> str:
        """
        Use the item on the player.
        Returns a message describing what happened.
        """
        raise NotImplementedError


class HealthPotion(Item):
    """Health potion that restores HP."""

    def __init__(self, x: int, y: int):
        super().__init__(
            x=x,
            y=y,
            item_type=ItemType.HEALTH_POTION,
            name="Health Potion",
            symbol='!',
            description="Restores 10 HP"
        )
        self.heal_amount = 10

    def use(self, player: 'Player') -> str:
        """Heal the player."""
        old_health = player.health
        player.health = min(player.health + self.heal_amount, player.max_health)
        actual_heal = player.health - old_health

        if actual_heal > 0:
            return f"Healed {actual_heal} HP!"
        else:
            return "Already at full health!"


class StrengthPotion(Item):
    """Potion that permanently increases attack damage."""

    def __init__(self, x: int, y: int):
        super().__init__(
            x=x,
            y=y,
            item_type=ItemType.STRENGTH_POTION,
            name="Strength Potion",
            symbol='!',
            description="Increases ATK by 1"
        )

    def use(self, player: 'Player') -> str:
        """Increase player's attack damage."""
        player.attack_damage += 1
        return f"ATK increased to {player.attack_damage}!"


class ScrollTeleport(Item):
    """Scroll that teleports player to a random location."""

    def __init__(self, x: int, y: int):
        super().__init__(
            x=x,
            y=y,
            item_type=ItemType.SCROLL_TELEPORT,
            name="Scroll of Teleport",
            symbol='?',
            description="Teleports to random location"
        )

    def use(self, player: 'Player') -> str:
        """Mark that teleport should happen (handled by game logic)."""
        return "Teleported to a random location!"


def create_item(item_type: ItemType, x: int, y: int) -> Item:
    """Factory function to create items."""
    if item_type == ItemType.HEALTH_POTION:
        return HealthPotion(x, y)
    elif item_type == ItemType.STRENGTH_POTION:
        return StrengthPotion(x, y)
    elif item_type == ItemType.SCROLL_TELEPORT:
        return ScrollTeleport(x, y)
    else:
        raise ValueError(f"Unknown item type: {item_type}")


class Inventory:
    """Player inventory to hold items."""

    def __init__(self, max_size: int = 10):
        self.items: list[Item] = []
        self.max_size = max_size

    def add_item(self, item: Item) -> bool:
        """
        Add an item to inventory.
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
