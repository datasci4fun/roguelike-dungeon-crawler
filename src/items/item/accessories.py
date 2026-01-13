"""Accessory items: rings and amulets."""
from typing import TYPE_CHECKING

from .types import ItemType
from .base import Item

if TYPE_CHECKING:
    from ...entities import Player


class Ring(Item):
    """Accessory providing passive stat bonuses."""

    def __init__(self, x: int, y: int, item_type: ItemType, name: str,
                 description: str, stat_bonuses: dict, rarity):
        from ...core.constants import EquipmentSlot
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
        from ...core.constants import ItemRarity
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
        from ...core.constants import ItemRarity
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
        from ...core.constants import ItemRarity
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
        from ...core.constants import EquipmentSlot
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
        from ...core.constants import ItemRarity
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
        from ...core.constants import ItemRarity
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
        from ...core.constants import ItemRarity
        super().__init__(
            x=x, y=y,
            item_type=ItemType.AMULET_VISION,
            name="Amulet of Vision",
            description="+2 Vision Range",
            effect='vision',
            effect_value=2,
            rarity=ItemRarity.UNCOMMON
        )
