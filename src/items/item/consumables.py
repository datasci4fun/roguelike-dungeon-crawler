"""Consumable items: potions, scrolls, lore items, and keys."""
from typing import TYPE_CHECKING

from .types import ItemType
from .base import Item

if TYPE_CHECKING:
    from ...entities import Player


class HealthPotion(Item):
    """Health potion that restores HP."""

    def __init__(self, x: int, y: int):
        from ...core.constants import ItemRarity
        super().__init__(
            x=x, y=y,
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

        # Apply healer feat bonus (+50% potion effectiveness)
        heal_bonus = player.get_heal_bonus() if hasattr(player, 'get_heal_bonus') else 0
        total_heal = int(self.heal_amount * (1 + heal_bonus))

        player.health = min(player.health + total_heal, player.max_health)
        actual_heal = player.health - old_health

        if actual_heal > 0:
            if heal_bonus > 0:
                return f"Healed {actual_heal} HP! (Healer bonus!)"
            return f"Healed {actual_heal} HP!"
        else:
            return "Already at full health!"


class StrengthPotion(Item):
    """Potion that permanently increases attack damage."""

    def __init__(self, x: int, y: int):
        from ...core.constants import ItemRarity
        super().__init__(
            x=x, y=y,
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
        from ...core.constants import ItemRarity
        super().__init__(
            x=x, y=y,
            item_type=ItemType.SCROLL_TELEPORT,
            name="Scroll of Teleport",
            symbol='?',
            description="Teleports to random location",
            rarity=ItemRarity.UNCOMMON
        )

    def use(self, player: 'Player') -> str:
        """Mark that teleport should happen (handled by game logic)."""
        return "Teleported to a random location!"


class LoreScroll(Item):
    """A scroll containing lore text that can be read."""

    def __init__(self, x: int, y: int, lore_id: str, title: str, content: list):
        from ...core.constants import ItemRarity
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
        from ...core.constants import ItemRarity
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
        from ...core.constants import ItemRarity
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
        from ...core.constants import ItemRarity
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
        from ...core.constants import ItemRarity
        super().__init__(
            x=x, y=y,
            item_type=ItemType.KEY_GOLD,
            name="Gold Key",
            description="Opens gold doors",
            key_level=3,
            rarity=ItemRarity.RARE
        )
