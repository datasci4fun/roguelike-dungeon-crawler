"""Item type definitions and spawn lists."""
from enum import Enum, auto


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
    WEAPON_DRAGON_SLAYER = auto()  # Legendary weapon
    # Armor
    ARMOR_LEATHER = auto()
    ARMOR_CHAIN = auto()
    ARMOR_PLATE = auto()
    ARMOR_DRAGON_SCALE = auto()    # Legendary armor
    # Story/Lore items
    SCROLL_LORE = auto()
    BOOK = auto()
    # Shields (off-hand)
    SHIELD_WOODEN = auto()
    SHIELD_IRON = auto()
    SHIELD_TOWER = auto()
    # Rings
    RING_STRENGTH = auto()
    RING_DEFENSE = auto()
    RING_SPEED = auto()
    # Amulets
    AMULET_HEALTH = auto()
    AMULET_RESISTANCE = auto()
    AMULET_VISION = auto()
    # Ranged weapons
    WEAPON_SHORTBOW = auto()
    WEAPON_LONGBOW = auto()
    WEAPON_CROSSBOW = auto()
    # Throwables
    THROWING_KNIFE = auto()
    BOMB = auto()
    POISON_VIAL = auto()
    # Keys
    KEY_BRONZE = auto()
    KEY_SILVER = auto()
    KEY_GOLD = auto()


# Item type lists for spawning
EQUIPMENT_TYPES = [
    ItemType.WEAPON_DAGGER,
    ItemType.WEAPON_SWORD,
    ItemType.WEAPON_AXE,
    ItemType.ARMOR_LEATHER,
    ItemType.ARMOR_CHAIN,
    ItemType.ARMOR_PLATE,
]

CONSUMABLE_TYPES = [
    ItemType.HEALTH_POTION,
    ItemType.STRENGTH_POTION,
    ItemType.SCROLL_TELEPORT,
]

SHIELD_TYPES = [
    ItemType.SHIELD_WOODEN,
    ItemType.SHIELD_IRON,
    ItemType.SHIELD_TOWER,
]

RING_TYPES = [
    ItemType.RING_STRENGTH,
    ItemType.RING_DEFENSE,
    ItemType.RING_SPEED,
]

AMULET_TYPES = [
    ItemType.AMULET_HEALTH,
    ItemType.AMULET_RESISTANCE,
    ItemType.AMULET_VISION,
]

RANGED_WEAPON_TYPES = [
    ItemType.WEAPON_SHORTBOW,
    ItemType.WEAPON_LONGBOW,
    ItemType.WEAPON_CROSSBOW,
]

THROWABLE_TYPES = [
    ItemType.THROWING_KNIFE,
    ItemType.BOMB,
    ItemType.POISON_VIAL,
]

KEY_TYPES = [
    ItemType.KEY_BRONZE,
    ItemType.KEY_SILVER,
    ItemType.KEY_GOLD,
]

# All v4.0 equipment (for mixed spawning)
V4_EQUIPMENT_TYPES = SHIELD_TYPES + RING_TYPES + AMULET_TYPES + RANGED_WEAPON_TYPES
