"""Equipment items: weapons, armor, and shields."""
from typing import TYPE_CHECKING

from .types import ItemType
from .base import Item

if TYPE_CHECKING:
    from ...entities import Player


class Weapon(Item):
    """Base class for melee weapon items.

    Now includes D&D-style damage dice (v6.10).
    """

    def __init__(self, x: int, y: int, item_type: ItemType, name: str,
                 description: str, attack_bonus: int, rarity,
                 damage_dice: str = "1d6", stat_used: str = "STR"):
        from ...core.constants import EquipmentSlot
        super().__init__(
            x=x, y=y,
            item_type=item_type,
            name=name,
            symbol='/',
            description=description,
            rarity=rarity,
            equip_slot=EquipmentSlot.WEAPON
        )
        self.attack_bonus = attack_bonus
        self.damage_dice = damage_dice  # D&D damage notation (e.g., "1d6", "2d6")
        self.stat_used = stat_used  # Which ability score for attack/damage (STR or DEX)

    def use(self, player: 'Player') -> str:
        return "Use [E] to equip this weapon."


class Dagger(Weapon):
    """Basic starting weapon. Light, finesse weapon using DEX."""

    def __init__(self, x: int, y: int):
        from ...core.constants import ItemRarity
        super().__init__(
            x=x, y=y,
            item_type=ItemType.WEAPON_DAGGER,
            name="Dagger",
            description="+1 ATK (1d4)",
            attack_bonus=1,
            rarity=ItemRarity.COMMON,
            damage_dice="1d4",
            stat_used="DEX"  # Finesse weapon
        )


class Sword(Weapon):
    """Standard melee weapon."""

    def __init__(self, x: int, y: int):
        from ...core.constants import ItemRarity
        super().__init__(
            x=x, y=y,
            item_type=ItemType.WEAPON_SWORD,
            name="Iron Sword",
            description="+3 ATK (1d8)",
            attack_bonus=3,
            rarity=ItemRarity.UNCOMMON,
            damage_dice="1d8",
            stat_used="STR"
        )


class Axe(Weapon):
    """Powerful melee weapon."""

    def __init__(self, x: int, y: int):
        from ...core.constants import ItemRarity
        super().__init__(
            x=x, y=y,
            item_type=ItemType.WEAPON_AXE,
            name="Battle Axe",
            description="+5 ATK (1d10)",
            attack_bonus=5,
            rarity=ItemRarity.RARE,
            damage_dice="1d10",
            stat_used="STR"
        )


class DragonSlayer(Weapon):
    """Legendary weapon dropped by the Dragon Emperor."""

    def __init__(self, x: int, y: int):
        from ...core.constants import ItemRarity
        super().__init__(
            x=x, y=y,
            item_type=ItemType.WEAPON_DRAGON_SLAYER,
            name="Dragon Slayer",
            description="+8 ATK (2d8), Legendary",
            attack_bonus=8,
            rarity=ItemRarity.LEGENDARY,
            damage_dice="2d8",
            stat_used="STR"
        )


class Armor(Item):
    """Base class for armor items."""

    def __init__(self, x: int, y: int, item_type: ItemType, name: str,
                 description: str, defense_bonus: int, rarity):
        from ...core.constants import EquipmentSlot
        super().__init__(
            x=x, y=y,
            item_type=item_type,
            name=name,
            symbol='[',
            description=description,
            rarity=rarity,
            equip_slot=EquipmentSlot.ARMOR
        )
        self.defense_bonus = defense_bonus

    def use(self, player: 'Player') -> str:
        return "Use [E] to equip this armor."


class LeatherArmor(Armor):
    """Basic light armor."""

    def __init__(self, x: int, y: int):
        from ...core.constants import ItemRarity
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
        from ...core.constants import ItemRarity
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
        from ...core.constants import ItemRarity
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
        from ...core.constants import ItemRarity
        super().__init__(
            x=x, y=y,
            item_type=ItemType.ARMOR_DRAGON_SCALE,
            name="Dragon Scale Armor",
            description="+8 DEF, Legendary",
            defense_bonus=8,
            rarity=ItemRarity.LEGENDARY
        )


class Shield(Item):
    """Off-hand shield providing defense and block chance."""

    def __init__(self, x: int, y: int, item_type: ItemType, name: str,
                 description: str, defense_bonus: int, block_chance: float, rarity):
        from ...core.constants import EquipmentSlot
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
        from ...core.constants import ItemRarity
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
        from ...core.constants import ItemRarity
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
        from ...core.constants import ItemRarity
        super().__init__(
            x=x, y=y,
            item_type=ItemType.SHIELD_TOWER,
            name="Tower Shield",
            description="+4 DEF, 25% block",
            defense_bonus=4,
            block_chance=0.25,
            rarity=ItemRarity.RARE
        )
