"""Items and inventory system."""
from dataclasses import dataclass
from enum import Enum, auto
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from ..entities import Player


class ItemType(Enum):
    """Types of items in the game."""
    # Consumables
    HEALTH_POTION = auto()
    STRENGTH_POTION = auto()
    SCROLL_TELEPORT = auto()
    # Weapons
    WEAPON_DAGGER = auto()
    WEAPON_SWORD = auto()
    WEAPON_AXE = auto()
    # Armor
    ARMOR_LEATHER = auto()
    ARMOR_CHAIN = auto()
    ARMOR_PLATE = auto()


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
        """
        Use the item on the player.
        Returns a message describing what happened.
        """
        raise NotImplementedError

    def is_equippable(self) -> bool:
        """Check if this item can be equipped."""
        return self.equip_slot is not None


class HealthPotion(Item):
    """Health potion that restores HP."""

    def __init__(self, x: int, y: int):
        from ..core.constants import ItemRarity
        super().__init__(
            x=x,
            y=y,
            item_type=ItemType.HEALTH_POTION,
            name="Health Potion",
            symbol='!',
            description="Restores 10 HP",
            rarity=ItemRarity.COMMON
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
        from ..core.constants import ItemRarity
        super().__init__(
            x=x,
            y=y,
            item_type=ItemType.STRENGTH_POTION,
            name="Strength Potion",
            symbol='!',
            description="Increases ATK by 1",
            rarity=ItemRarity.UNCOMMON
        )

    def use(self, player: 'Player') -> str:
        """Increase player's attack damage."""
        player.attack_damage += 1
        return f"ATK increased to {player.attack_damage}!"


class ScrollTeleport(Item):
    """Scroll that teleports player to a random location."""

    def __init__(self, x: int, y: int):
        from ..core.constants import ItemRarity
        super().__init__(
            x=x,
            y=y,
            item_type=ItemType.SCROLL_TELEPORT,
            name="Scroll of Teleport",
            symbol='?',
            description="Teleports to random location",
            rarity=ItemRarity.UNCOMMON
        )

    def use(self, player: 'Player') -> str:
        """Mark that teleport should happen (handled by game logic)."""
        return "Teleported to a random location!"


class Weapon(Item):
    """Base class for weapon items."""

    def __init__(self, x: int, y: int, item_type: ItemType, name: str,
                 description: str, attack_bonus: int, rarity):
        from ..core.constants import EquipmentSlot
        super().__init__(
            x=x,
            y=y,
            item_type=item_type,
            name=name,
            symbol='/',
            description=description,
            rarity=rarity,
            equip_slot=EquipmentSlot.WEAPON
        )
        self.attack_bonus = attack_bonus

    def use(self, player: 'Player') -> str:
        """Weapons are equipped, not used directly."""
        return "Use [E] to equip this weapon."


class Dagger(Weapon):
    """Basic starting weapon."""

    def __init__(self, x: int, y: int):
        from ..core.constants import ItemRarity
        super().__init__(
            x=x, y=y,
            item_type=ItemType.WEAPON_DAGGER,
            name="Dagger",
            description="+1 ATK",
            attack_bonus=1,
            rarity=ItemRarity.COMMON
        )


class Sword(Weapon):
    """Standard melee weapon."""

    def __init__(self, x: int, y: int):
        from ..core.constants import ItemRarity
        super().__init__(
            x=x, y=y,
            item_type=ItemType.WEAPON_SWORD,
            name="Iron Sword",
            description="+3 ATK",
            attack_bonus=3,
            rarity=ItemRarity.UNCOMMON
        )


class Axe(Weapon):
    """Powerful melee weapon."""

    def __init__(self, x: int, y: int):
        from ..core.constants import ItemRarity
        super().__init__(
            x=x, y=y,
            item_type=ItemType.WEAPON_AXE,
            name="Battle Axe",
            description="+5 ATK",
            attack_bonus=5,
            rarity=ItemRarity.RARE
        )


class Armor(Item):
    """Base class for armor items."""

    def __init__(self, x: int, y: int, item_type: ItemType, name: str,
                 description: str, defense_bonus: int, rarity):
        from ..core.constants import EquipmentSlot
        super().__init__(
            x=x,
            y=y,
            item_type=item_type,
            name=name,
            symbol='[',
            description=description,
            rarity=rarity,
            equip_slot=EquipmentSlot.ARMOR
        )
        self.defense_bonus = defense_bonus

    def use(self, player: 'Player') -> str:
        """Armor is equipped, not used directly."""
        return "Use [E] to equip this armor."


class LeatherArmor(Armor):
    """Basic light armor."""

    def __init__(self, x: int, y: int):
        from ..core.constants import ItemRarity
        super().__init__(
            x=x, y=y,
            item_type=ItemType.ARMOR_LEATHER,
            name="Leather Armor",
            description="+1 DEF",
            defense_bonus=1,
            rarity=ItemRarity.COMMON
        )


class ChainMail(Armor):
    """Medium armor."""

    def __init__(self, x: int, y: int):
        from ..core.constants import ItemRarity
        super().__init__(
            x=x, y=y,
            item_type=ItemType.ARMOR_CHAIN,
            name="Chain Mail",
            description="+3 DEF",
            defense_bonus=3,
            rarity=ItemRarity.UNCOMMON
        )


class PlateArmor(Armor):
    """Heavy armor."""

    def __init__(self, x: int, y: int):
        from ..core.constants import ItemRarity
        super().__init__(
            x=x, y=y,
            item_type=ItemType.ARMOR_PLATE,
            name="Plate Armor",
            description="+5 DEF",
            defense_bonus=5,
            rarity=ItemRarity.RARE
        )


def create_item(item_type: ItemType, x: int, y: int) -> Item:
    """Factory function to create items."""
    # Consumables
    if item_type == ItemType.HEALTH_POTION:
        return HealthPotion(x, y)
    elif item_type == ItemType.STRENGTH_POTION:
        return StrengthPotion(x, y)
    elif item_type == ItemType.SCROLL_TELEPORT:
        return ScrollTeleport(x, y)
    # Weapons
    elif item_type == ItemType.WEAPON_DAGGER:
        return Dagger(x, y)
    elif item_type == ItemType.WEAPON_SWORD:
        return Sword(x, y)
    elif item_type == ItemType.WEAPON_AXE:
        return Axe(x, y)
    # Armor
    elif item_type == ItemType.ARMOR_LEATHER:
        return LeatherArmor(x, y)
    elif item_type == ItemType.ARMOR_CHAIN:
        return ChainMail(x, y)
    elif item_type == ItemType.ARMOR_PLATE:
        return PlateArmor(x, y)
    else:
        raise ValueError(f"Unknown item type: {item_type}")


# List of equipment types for spawning
EQUIPMENT_TYPES = [
    ItemType.WEAPON_DAGGER,
    ItemType.WEAPON_SWORD,
    ItemType.WEAPON_AXE,
    ItemType.ARMOR_LEATHER,
    ItemType.ARMOR_CHAIN,
    ItemType.ARMOR_PLATE,
]

# Consumable types (original items)
CONSUMABLE_TYPES = [
    ItemType.HEALTH_POTION,
    ItemType.STRENGTH_POTION,
    ItemType.SCROLL_TELEPORT,
]


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
