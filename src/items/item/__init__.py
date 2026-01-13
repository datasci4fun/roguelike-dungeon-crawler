"""Item package - all game items organized by category.

This package contains:
- types.py: ItemType enum and spawn lists
- base.py: Item base class and Inventory
- equipment.py: Weapons, armor, and shields
- accessories.py: Rings and amulets
- ranged.py: Ranged weapons and throwables
- consumables.py: Potions, scrolls, lore items, and keys
- factory.py: Item creation functions
"""

# Types and lists
from .types import (
    ItemType,
    EQUIPMENT_TYPES,
    CONSUMABLE_TYPES,
    SHIELD_TYPES,
    RING_TYPES,
    AMULET_TYPES,
    RANGED_WEAPON_TYPES,
    THROWABLE_TYPES,
    KEY_TYPES,
    V4_EQUIPMENT_TYPES,
)

# Base classes
from .base import Item, Inventory

# Equipment
from .equipment import (
    Weapon, Dagger, Sword, Axe, DragonSlayer,
    Armor, LeatherArmor, ChainMail, PlateArmor, DragonScaleArmor,
    Shield, WoodenShield, IronShield, TowerShield,
)

# Accessories
from .accessories import (
    Ring, RingOfStrength, RingOfDefense, RingOfSpeed,
    Amulet, AmuletOfHealth, AmuletOfResistance, AmuletOfVision,
)

# Ranged
from .ranged import (
    RangedWeapon, Shortbow, Longbow, Crossbow,
    Throwable, ThrowingKnife, Bomb, PoisonVial,
)

# Consumables
from .consumables import (
    HealthPotion, StrengthPotion, ScrollTeleport,
    LoreScroll, LoreBook,
    Key, BronzeKey, SilverKey, GoldKey,
)

# Factory
from .factory import create_item, create_lore_item

__all__ = [
    # Types
    'ItemType',
    'EQUIPMENT_TYPES', 'CONSUMABLE_TYPES', 'SHIELD_TYPES',
    'RING_TYPES', 'AMULET_TYPES', 'RANGED_WEAPON_TYPES',
    'THROWABLE_TYPES', 'KEY_TYPES', 'V4_EQUIPMENT_TYPES',
    # Base
    'Item', 'Inventory',
    # Equipment
    'Weapon', 'Dagger', 'Sword', 'Axe', 'DragonSlayer',
    'Armor', 'LeatherArmor', 'ChainMail', 'PlateArmor', 'DragonScaleArmor',
    'Shield', 'WoodenShield', 'IronShield', 'TowerShield',
    # Accessories
    'Ring', 'RingOfStrength', 'RingOfDefense', 'RingOfSpeed',
    'Amulet', 'AmuletOfHealth', 'AmuletOfResistance', 'AmuletOfVision',
    # Ranged
    'RangedWeapon', 'Shortbow', 'Longbow', 'Crossbow',
    'Throwable', 'ThrowingKnife', 'Bomb', 'PoisonVial',
    # Consumables
    'HealthPotion', 'StrengthPotion', 'ScrollTeleport',
    'LoreScroll', 'LoreBook',
    'Key', 'BronzeKey', 'SilverKey', 'GoldKey',
    # Factory
    'create_item', 'create_lore_item',
]
