"""Item factory functions for creating items."""
from .types import ItemType
from .base import Item
from .consumables import (
    HealthPotion, StrengthPotion, ScrollTeleport,
    LoreScroll, LoreBook, BronzeKey, SilverKey, GoldKey
)
from .equipment import (
    Dagger, Sword, Axe, DragonSlayer,
    LeatherArmor, ChainMail, PlateArmor, DragonScaleArmor,
    WoodenShield, IronShield, TowerShield
)
from .accessories import (
    RingOfStrength, RingOfDefense, RingOfSpeed,
    AmuletOfHealth, AmuletOfResistance, AmuletOfVision
)
from .ranged import (
    Shortbow, Longbow, Crossbow,
    ThrowingKnife, Bomb, PoisonVial
)


def create_lore_item(lore_id: str, x: int, y: int) -> Item:
    """Create a lore item (scroll or book) from story data."""
    from ...story import get_lore_entry
    entry = get_lore_entry(lore_id)
    if not entry:
        raise ValueError(f"Unknown lore entry: {lore_id}")

    item_type = entry.get('item_type', 'scroll')
    title = entry['title']
    content = entry['content']

    if item_type == 'book':
        return LoreBook(x, y, lore_id, title, content)
    else:
        return LoreScroll(x, y, lore_id, title, content)


def create_item(item_type: ItemType, x: int, y: int) -> Item:
    """Factory function to create items by type."""
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
    elif item_type == ItemType.WEAPON_DRAGON_SLAYER:
        return DragonSlayer(x, y)
    # Armor
    elif item_type == ItemType.ARMOR_LEATHER:
        return LeatherArmor(x, y)
    elif item_type == ItemType.ARMOR_CHAIN:
        return ChainMail(x, y)
    elif item_type == ItemType.ARMOR_PLATE:
        return PlateArmor(x, y)
    elif item_type == ItemType.ARMOR_DRAGON_SCALE:
        return DragonScaleArmor(x, y)
    # Shields
    elif item_type == ItemType.SHIELD_WOODEN:
        return WoodenShield(x, y)
    elif item_type == ItemType.SHIELD_IRON:
        return IronShield(x, y)
    elif item_type == ItemType.SHIELD_TOWER:
        return TowerShield(x, y)
    # Rings
    elif item_type == ItemType.RING_STRENGTH:
        return RingOfStrength(x, y)
    elif item_type == ItemType.RING_DEFENSE:
        return RingOfDefense(x, y)
    elif item_type == ItemType.RING_SPEED:
        return RingOfSpeed(x, y)
    # Amulets
    elif item_type == ItemType.AMULET_HEALTH:
        return AmuletOfHealth(x, y)
    elif item_type == ItemType.AMULET_RESISTANCE:
        return AmuletOfResistance(x, y)
    elif item_type == ItemType.AMULET_VISION:
        return AmuletOfVision(x, y)
    # Ranged weapons
    elif item_type == ItemType.WEAPON_SHORTBOW:
        return Shortbow(x, y)
    elif item_type == ItemType.WEAPON_LONGBOW:
        return Longbow(x, y)
    elif item_type == ItemType.WEAPON_CROSSBOW:
        return Crossbow(x, y)
    # Throwables
    elif item_type == ItemType.THROWING_KNIFE:
        return ThrowingKnife(x, y)
    elif item_type == ItemType.BOMB:
        return Bomb(x, y)
    elif item_type == ItemType.POISON_VIAL:
        return PoisonVial(x, y)
    # Keys
    elif item_type == ItemType.KEY_BRONZE:
        return BronzeKey(x, y)
    elif item_type == ItemType.KEY_SILVER:
        return SilverKey(x, y)
    elif item_type == ItemType.KEY_GOLD:
        return GoldKey(x, y)
    else:
        raise ValueError(f"Unknown item type: {item_type}")
