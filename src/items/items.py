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
    WEAPON_DRAGON_SLAYER = auto()  # Legendary weapon
    # Armor
    ARMOR_LEATHER = auto()
    ARMOR_CHAIN = auto()
    ARMOR_PLATE = auto()
    ARMOR_DRAGON_SCALE = auto()    # Legendary armor
    # Story/Lore items
    SCROLL_LORE = auto()
    BOOK = auto()
    # v4.0 New item types
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


class DragonSlayer(Weapon):
    """Legendary weapon dropped by the Dragon Emperor."""

    def __init__(self, x: int, y: int):
        from ..core.constants import ItemRarity
        super().__init__(
            x=x, y=y,
            item_type=ItemType.WEAPON_DRAGON_SLAYER,
            name="Dragon Slayer",
            description="+8 ATK, Legendary",
            attack_bonus=8,
            rarity=ItemRarity.LEGENDARY
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


class DragonScaleArmor(Armor):
    """Legendary armor dropped by the Dragon Emperor."""

    def __init__(self, x: int, y: int):
        from ..core.constants import ItemRarity
        super().__init__(
            x=x, y=y,
            item_type=ItemType.ARMOR_DRAGON_SCALE,
            name="Dragon Scale Armor",
            description="+8 DEF, Legendary",
            defense_bonus=8,
            rarity=ItemRarity.LEGENDARY
        )


class LoreScroll(Item):
    """A scroll containing lore text that can be read."""

    def __init__(self, x: int, y: int, lore_id: str, title: str, content: list):
        from ..core.constants import ItemRarity
        super().__init__(
            x=x, y=y,
            item_type=ItemType.SCROLL_LORE,
            name=title,
            symbol='?',
            description="A weathered scroll",
            rarity=ItemRarity.UNCOMMON
        )
        self.lore_id = lore_id
        self.title = title
        self.content = content  # List of paragraphs

    def use(self, player: 'Player') -> str:
        """Reading is handled by the game - this returns a prompt."""
        return f"You read the {self.name}..."

    def get_text(self) -> tuple:
        """Return the title and content for display."""
        return self.title, self.content


class LoreBook(Item):
    """A book containing lore text that can be read."""

    def __init__(self, x: int, y: int, lore_id: str, title: str, content: list):
        from ..core.constants import ItemRarity
        super().__init__(
            x=x, y=y,
            item_type=ItemType.BOOK,
            name=title,
            symbol='+',
            description="An ancient tome",
            rarity=ItemRarity.RARE
        )
        self.lore_id = lore_id
        self.title = title
        self.content = content  # List of paragraphs

    def use(self, player: 'Player') -> str:
        """Reading is handled by the game - this returns a prompt."""
        return f"You open {self.name}..."

    def get_text(self) -> tuple:
        """Return the title and content for display."""
        return self.title, self.content


# v4.0 New Item Classes

class Shield(Item):
    """Off-hand shield providing defense and block chance."""

    def __init__(self, x: int, y: int, item_type: ItemType, name: str,
                 description: str, defense_bonus: int, block_chance: float, rarity):
        from ..core.constants import EquipmentSlot
        super().__init__(
            x=x, y=y,
            item_type=item_type,
            name=name,
            symbol=')',
            description=description,
            rarity=rarity,
            equip_slot=EquipmentSlot.OFF_HAND
        )
        self.defense_bonus = defense_bonus
        self.block_chance = block_chance  # 0.0 to 1.0

    def use(self, player: 'Player') -> str:
        return "Use [E] to equip this shield."


class WoodenShield(Shield):
    def __init__(self, x: int, y: int):
        from ..core.constants import ItemRarity
        super().__init__(
            x=x, y=y,
            item_type=ItemType.SHIELD_WOODEN,
            name="Wooden Shield",
            description="+1 DEF, 10% block",
            defense_bonus=1,
            block_chance=0.10,
            rarity=ItemRarity.COMMON
        )


class IronShield(Shield):
    def __init__(self, x: int, y: int):
        from ..core.constants import ItemRarity
        super().__init__(
            x=x, y=y,
            item_type=ItemType.SHIELD_IRON,
            name="Iron Shield",
            description="+2 DEF, 15% block",
            defense_bonus=2,
            block_chance=0.15,
            rarity=ItemRarity.UNCOMMON
        )


class TowerShield(Shield):
    def __init__(self, x: int, y: int):
        from ..core.constants import ItemRarity
        super().__init__(
            x=x, y=y,
            item_type=ItemType.SHIELD_TOWER,
            name="Tower Shield",
            description="+4 DEF, 25% block",
            defense_bonus=4,
            block_chance=0.25,
            rarity=ItemRarity.RARE
        )


class Ring(Item):
    """Accessory providing passive stat bonuses."""

    def __init__(self, x: int, y: int, item_type: ItemType, name: str,
                 description: str, stat_bonuses: dict, rarity):
        from ..core.constants import EquipmentSlot
        super().__init__(
            x=x, y=y,
            item_type=item_type,
            name=name,
            symbol='o',
            description=description,
            rarity=rarity,
            equip_slot=EquipmentSlot.RING
        )
        self.stat_bonuses = stat_bonuses  # e.g., {'attack': 2, 'defense': 1}

    def use(self, player: 'Player') -> str:
        return "Use [E] to equip this ring."


class RingOfStrength(Ring):
    def __init__(self, x: int, y: int):
        from ..core.constants import ItemRarity
        super().__init__(
            x=x, y=y,
            item_type=ItemType.RING_STRENGTH,
            name="Ring of Strength",
            description="+2 ATK",
            stat_bonuses={'attack': 2},
            rarity=ItemRarity.UNCOMMON
        )


class RingOfDefense(Ring):
    def __init__(self, x: int, y: int):
        from ..core.constants import ItemRarity
        super().__init__(
            x=x, y=y,
            item_type=ItemType.RING_DEFENSE,
            name="Ring of Defense",
            description="+2 DEF",
            stat_bonuses={'defense': 2},
            rarity=ItemRarity.UNCOMMON
        )


class RingOfSpeed(Ring):
    def __init__(self, x: int, y: int):
        from ..core.constants import ItemRarity
        super().__init__(
            x=x, y=y,
            item_type=ItemType.RING_SPEED,
            name="Ring of Speed",
            description="+1 Move Speed",
            stat_bonuses={'speed': 1},
            rarity=ItemRarity.RARE
        )


class Amulet(Item):
    """Accessory providing passive effects."""

    def __init__(self, x: int, y: int, item_type: ItemType, name: str,
                 description: str, effect: str, effect_value: int, rarity):
        from ..core.constants import EquipmentSlot
        super().__init__(
            x=x, y=y,
            item_type=item_type,
            name=name,
            symbol='&',
            description=description,
            rarity=rarity,
            equip_slot=EquipmentSlot.AMULET
        )
        self.effect = effect  # e.g., 'max_health', 'resistance', 'vision'
        self.effect_value = effect_value

    def use(self, player: 'Player') -> str:
        return "Use [E] to equip this amulet."


class AmuletOfHealth(Amulet):
    def __init__(self, x: int, y: int):
        from ..core.constants import ItemRarity
        super().__init__(
            x=x, y=y,
            item_type=ItemType.AMULET_HEALTH,
            name="Amulet of Health",
            description="+10 Max HP",
            effect='max_health',
            effect_value=10,
            rarity=ItemRarity.UNCOMMON
        )


class AmuletOfResistance(Amulet):
    def __init__(self, x: int, y: int):
        from ..core.constants import ItemRarity
        super().__init__(
            x=x, y=y,
            item_type=ItemType.AMULET_RESISTANCE,
            name="Amulet of Resistance",
            description="25% status resist",
            effect='resistance',
            effect_value=25,
            rarity=ItemRarity.RARE
        )


class AmuletOfVision(Amulet):
    def __init__(self, x: int, y: int):
        from ..core.constants import ItemRarity
        super().__init__(
            x=x, y=y,
            item_type=ItemType.AMULET_VISION,
            name="Amulet of Vision",
            description="+2 Vision Range",
            effect='vision',
            effect_value=2,
            rarity=ItemRarity.UNCOMMON
        )


class RangedWeapon(Item):
    """Ranged weapon for attacking from distance."""

    def __init__(self, x: int, y: int, item_type: ItemType, name: str,
                 description: str, damage: int, range: int, rarity):
        from ..core.constants import EquipmentSlot
        super().__init__(
            x=x, y=y,
            item_type=item_type,
            name=name,
            symbol='}',
            description=description,
            rarity=rarity,
            equip_slot=EquipmentSlot.WEAPON
        )
        self.damage = damage
        self.range = range
        self.is_ranged = True

    def use(self, player: 'Player') -> str:
        return "Use [E] to equip, [f] to fire."


class Shortbow(RangedWeapon):
    def __init__(self, x: int, y: int):
        from ..core.constants import ItemRarity
        super().__init__(
            x=x, y=y,
            item_type=ItemType.WEAPON_SHORTBOW,
            name="Shortbow",
            description="3 DMG, Range 4",
            damage=3,
            range=4,
            rarity=ItemRarity.COMMON
        )


class Longbow(RangedWeapon):
    def __init__(self, x: int, y: int):
        from ..core.constants import ItemRarity
        super().__init__(
            x=x, y=y,
            item_type=ItemType.WEAPON_LONGBOW,
            name="Longbow",
            description="5 DMG, Range 6",
            damage=5,
            range=6,
            rarity=ItemRarity.UNCOMMON
        )


class Crossbow(RangedWeapon):
    def __init__(self, x: int, y: int):
        from ..core.constants import ItemRarity
        super().__init__(
            x=x, y=y,
            item_type=ItemType.WEAPON_CROSSBOW,
            name="Crossbow",
            description="7 DMG, Range 5",
            damage=7,
            range=5,
            rarity=ItemRarity.RARE
        )


class Throwable(Item):
    """Single-use thrown item."""

    def __init__(self, x: int, y: int, item_type: ItemType, name: str,
                 description: str, damage: int, range: int, effect=None, rarity=None):
        from ..core.constants import ItemRarity as IR
        super().__init__(
            x=x, y=y,
            item_type=item_type,
            name=name,
            symbol='*',
            description=description,
            rarity=rarity or IR.COMMON
        )
        self.damage = damage
        self.range = range
        self.effect = effect  # StatusEffectType or None

    def use(self, player: 'Player') -> str:
        return "Use [t] to throw at a target."


class ThrowingKnife(Throwable):
    def __init__(self, x: int, y: int):
        from ..core.constants import ItemRarity
        super().__init__(
            x=x, y=y,
            item_type=ItemType.THROWING_KNIFE,
            name="Throwing Knife",
            description="5 DMG, Range 4",
            damage=5,
            range=4,
            rarity=ItemRarity.COMMON
        )


class Bomb(Throwable):
    def __init__(self, x: int, y: int):
        from ..core.constants import ItemRarity, StatusEffectType
        super().__init__(
            x=x, y=y,
            item_type=ItemType.BOMB,
            name="Bomb",
            description="10 DMG AOE, Range 3",
            damage=10,
            range=3,
            effect=StatusEffectType.STUN,
            rarity=ItemRarity.UNCOMMON
        )


class PoisonVial(Throwable):
    def __init__(self, x: int, y: int):
        from ..core.constants import ItemRarity, StatusEffectType
        super().__init__(
            x=x, y=y,
            item_type=ItemType.POISON_VIAL,
            name="Poison Vial",
            description="3 DMG + Poison, Range 4",
            damage=3,
            range=4,
            effect=StatusEffectType.POISON,
            rarity=ItemRarity.UNCOMMON
        )


class Key(Item):
    """Key item for opening locked doors."""

    def __init__(self, x: int, y: int, item_type: ItemType, name: str,
                 description: str, key_level: int, rarity):
        super().__init__(
            x=x, y=y,
            item_type=item_type,
            name=name,
            symbol='k',
            description=description,
            rarity=rarity
        )
        self.key_level = key_level  # Bronze=1, Silver=2, Gold=3

    def use(self, player: 'Player') -> str:
        return "Walk into a locked door to use this key."


class BronzeKey(Key):
    def __init__(self, x: int, y: int):
        from ..core.constants import ItemRarity
        super().__init__(
            x=x, y=y,
            item_type=ItemType.KEY_BRONZE,
            name="Bronze Key",
            description="Opens bronze doors",
            key_level=1,
            rarity=ItemRarity.COMMON
        )


class SilverKey(Key):
    def __init__(self, x: int, y: int):
        from ..core.constants import ItemRarity
        super().__init__(
            x=x, y=y,
            item_type=ItemType.KEY_SILVER,
            name="Silver Key",
            description="Opens silver doors",
            key_level=2,
            rarity=ItemRarity.UNCOMMON
        )


class GoldKey(Key):
    def __init__(self, x: int, y: int):
        from ..core.constants import ItemRarity
        super().__init__(
            x=x, y=y,
            item_type=ItemType.KEY_GOLD,
            name="Gold Key",
            description="Opens gold doors",
            key_level=3,
            rarity=ItemRarity.RARE
        )


def create_lore_item(lore_id: str, x: int, y: int) -> Item:
    """Create a lore item (scroll or book) from story data."""
    from ..story import get_lore_entry
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
    # v4.0 Shields
    elif item_type == ItemType.SHIELD_WOODEN:
        return WoodenShield(x, y)
    elif item_type == ItemType.SHIELD_IRON:
        return IronShield(x, y)
    elif item_type == ItemType.SHIELD_TOWER:
        return TowerShield(x, y)
    # v4.0 Rings
    elif item_type == ItemType.RING_STRENGTH:
        return RingOfStrength(x, y)
    elif item_type == ItemType.RING_DEFENSE:
        return RingOfDefense(x, y)
    elif item_type == ItemType.RING_SPEED:
        return RingOfSpeed(x, y)
    # v4.0 Amulets
    elif item_type == ItemType.AMULET_HEALTH:
        return AmuletOfHealth(x, y)
    elif item_type == ItemType.AMULET_RESISTANCE:
        return AmuletOfResistance(x, y)
    elif item_type == ItemType.AMULET_VISION:
        return AmuletOfVision(x, y)
    # v4.0 Ranged weapons
    elif item_type == ItemType.WEAPON_SHORTBOW:
        return Shortbow(x, y)
    elif item_type == ItemType.WEAPON_LONGBOW:
        return Longbow(x, y)
    elif item_type == ItemType.WEAPON_CROSSBOW:
        return Crossbow(x, y)
    # v4.0 Throwables
    elif item_type == ItemType.THROWING_KNIFE:
        return ThrowingKnife(x, y)
    elif item_type == ItemType.BOMB:
        return Bomb(x, y)
    elif item_type == ItemType.POISON_VIAL:
        return PoisonVial(x, y)
    # v4.0 Keys
    elif item_type == ItemType.KEY_BRONZE:
        return BronzeKey(x, y)
    elif item_type == ItemType.KEY_SILVER:
        return SilverKey(x, y)
    elif item_type == ItemType.KEY_GOLD:
        return GoldKey(x, y)
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

# v4.0 New item type lists for spawning
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
