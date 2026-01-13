"""Ranged weapons and throwable items."""
from typing import TYPE_CHECKING

from .types import ItemType
from .base import Item

if TYPE_CHECKING:
    from ...entities import Player


class RangedWeapon(Item):
    """Ranged weapon for attacking from distance."""

    def __init__(self, x: int, y: int, item_type: ItemType, name: str,
                 description: str, damage: int, range: int, rarity):
        from ...core.constants import EquipmentSlot
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
        from ...core.constants import ItemRarity
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
        from ...core.constants import ItemRarity
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
        from ...core.constants import ItemRarity
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
        from ...core.constants import ItemRarity as IR
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
        from ...core.constants import ItemRarity
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
        from ...core.constants import ItemRarity, StatusEffectType
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
        from ...core.constants import ItemRarity, StatusEffectType
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
