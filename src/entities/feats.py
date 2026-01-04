"""Feat definitions for the character progression system.

Feats are special bonuses that players can acquire:
- Humans start with 1 feat of their choice
- All characters gain a feat at levels 3, 5, 7, and 9
"""
from dataclasses import dataclass
from enum import Enum, auto
from typing import Optional, List


class FeatCategory(Enum):
    """Categories of feats."""
    COMBAT = auto()      # Direct combat bonuses
    DEFENSE = auto()     # Defensive bonuses
    UTILITY = auto()     # Exploration and resource bonuses
    SPECIAL = auto()     # Unique effects


@dataclass
class Feat:
    """Definition of a character feat."""
    id: str
    name: str
    description: str
    category: FeatCategory

    # Stat bonuses
    hp_bonus: int = 0
    atk_bonus: int = 0
    def_bonus: int = 0

    # Combat modifiers
    damage_bonus: float = 0.0        # Flat damage bonus
    damage_multiplier: float = 0.0   # Percentage damage increase
    crit_bonus: float = 0.0          # Additional crit chance
    dodge_bonus: float = 0.0         # Additional dodge chance
    block_bonus: float = 0.0         # Additional block chance

    # Defense modifiers
    damage_reduction: float = 0.0    # Flat damage reduction
    resistance_all: float = 0.0      # Resistance to all damage types

    # Utility modifiers
    xp_bonus: float = 0.0            # XP gain multiplier
    vision_bonus: int = 0            # Vision range bonus
    heal_bonus: float = 0.0          # Healing effectiveness bonus

    # Special flags
    life_steal: float = 0.0          # Percentage of damage healed
    thorns: float = 0.0              # Damage reflected to attackers
    first_strike: bool = False       # Always attack first
    second_wind: bool = False        # Heal on level up bonus


# All available feats
FEATS = {
    # ========== COMBAT FEATS ==========
    'mighty_blow': Feat(
        id='mighty_blow',
        name='Mighty Blow',
        description='+2 Attack damage',
        category=FeatCategory.COMBAT,
        atk_bonus=2,
    ),
    'weapon_master': Feat(
        id='weapon_master',
        name='Weapon Master',
        description='+15% damage with all attacks',
        category=FeatCategory.COMBAT,
        damage_multiplier=0.15,
    ),
    'deadly_precision': Feat(
        id='deadly_precision',
        name='Deadly Precision',
        description='+10% critical hit chance',
        category=FeatCategory.COMBAT,
        crit_bonus=0.10,
    ),
    'berserker': Feat(
        id='berserker',
        name='Berserker',
        description='+25% damage, but -1 Defense',
        category=FeatCategory.COMBAT,
        damage_multiplier=0.25,
        def_bonus=-1,
    ),
    'life_leech': Feat(
        id='life_leech',
        name='Life Leech',
        description='Heal 10% of damage dealt',
        category=FeatCategory.COMBAT,
        life_steal=0.10,
    ),
    'quick_strike': Feat(
        id='quick_strike',
        name='Quick Strike',
        description='Always attack before enemies',
        category=FeatCategory.COMBAT,
        first_strike=True,
    ),

    # ========== DEFENSE FEATS ==========
    'tough': Feat(
        id='tough',
        name='Tough',
        description='+5 Maximum HP',
        category=FeatCategory.DEFENSE,
        hp_bonus=5,
    ),
    'iron_skin': Feat(
        id='iron_skin',
        name='Iron Skin',
        description='+2 Defense',
        category=FeatCategory.DEFENSE,
        def_bonus=2,
    ),
    'evasion': Feat(
        id='evasion',
        name='Evasion',
        description='+8% dodge chance',
        category=FeatCategory.DEFENSE,
        dodge_bonus=0.08,
    ),
    'shield_expert': Feat(
        id='shield_expert',
        name='Shield Expert',
        description='+15% block chance with shields',
        category=FeatCategory.DEFENSE,
        block_bonus=0.15,
    ),
    'resilient': Feat(
        id='resilient',
        name='Resilient',
        description='Take 10% less damage from all sources',
        category=FeatCategory.DEFENSE,
        resistance_all=0.10,
    ),
    'thorns': Feat(
        id='thorns',
        name='Thorns',
        description='Reflect 25% of melee damage back to attackers',
        category=FeatCategory.DEFENSE,
        thorns=0.25,
    ),

    # ========== UTILITY FEATS ==========
    'fast_learner': Feat(
        id='fast_learner',
        name='Fast Learner',
        description='+20% XP gain',
        category=FeatCategory.UTILITY,
        xp_bonus=0.20,
    ),
    'eagle_eye': Feat(
        id='eagle_eye',
        name='Eagle Eye',
        description='+1 vision range',
        category=FeatCategory.UTILITY,
        vision_bonus=1,
    ),
    'healer': Feat(
        id='healer',
        name='Healer',
        description='Potions heal 50% more',
        category=FeatCategory.UTILITY,
        heal_bonus=0.50,
    ),
    'second_wind': Feat(
        id='second_wind',
        name='Second Wind',
        description='Gain +3 HP when leveling up (in addition to normal)',
        category=FeatCategory.UTILITY,
        second_wind=True,
    ),

    # ========== SPECIAL FEATS ==========
    'survivor': Feat(
        id='survivor',
        name='Survivor',
        description='+3 HP, +1 Defense, +5% dodge',
        category=FeatCategory.SPECIAL,
        hp_bonus=3,
        def_bonus=1,
        dodge_bonus=0.05,
    ),
    'warrior_spirit': Feat(
        id='warrior_spirit',
        name='Warrior Spirit',
        description='+1 Attack, +1 Defense, +2 HP',
        category=FeatCategory.SPECIAL,
        hp_bonus=2,
        atk_bonus=1,
        def_bonus=1,
    ),
    'glass_cannon': Feat(
        id='glass_cannon',
        name='Glass Cannon',
        description='+3 Attack, but -3 HP',
        category=FeatCategory.SPECIAL,
        atk_bonus=3,
        hp_bonus=-3,
    ),
}

# Levels at which characters gain feats
FEAT_LEVELS = [3, 5, 7, 9]


def get_feat(feat_id: str) -> Optional[Feat]:
    """Get a feat by its ID."""
    return FEATS.get(feat_id)


def get_all_feats() -> List[Feat]:
    """Get all available feats."""
    return list(FEATS.values())


def get_feats_by_category(category: FeatCategory) -> List[Feat]:
    """Get all feats in a category."""
    return [f for f in FEATS.values() if f.category == category]


def get_available_feats(acquired_feats: List[str]) -> List[Feat]:
    """Get feats that haven't been acquired yet."""
    return [f for f in FEATS.values() if f.id not in acquired_feats]


def should_gain_feat_at_level(level: int) -> bool:
    """Check if a feat should be gained at the given level."""
    return level in FEAT_LEVELS
