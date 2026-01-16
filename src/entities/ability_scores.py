"""Ability scores system for D&D-style character stats.

Supports STR, DEX, CON, and LUCK with race/class modifiers.
"""
from dataclasses import dataclass, field
from typing import Dict, Optional

from ..core.dice import roll_dice, calculate_ability_modifier


@dataclass
class AbilityScores:
    """Character ability scores (STR, DEX, CON, LUCK).

    Attributes:
        strength: Physical power, melee damage
        dexterity: Agility, accuracy, dodge, ranged damage
        constitution: Endurance, HP pool, poison resistance
        luck: Fortune, influences dice roll probability
    """
    strength: int = 10
    dexterity: int = 10
    constitution: int = 10
    luck: int = 10

    @property
    def str_mod(self) -> int:
        """Strength modifier."""
        return calculate_ability_modifier(self.strength)

    @property
    def dex_mod(self) -> int:
        """Dexterity modifier."""
        return calculate_ability_modifier(self.dexterity)

    @property
    def con_mod(self) -> int:
        """Constitution modifier."""
        return calculate_ability_modifier(self.constitution)

    @property
    def luck_mod(self) -> int:
        """Luck modifier."""
        return calculate_ability_modifier(self.luck)

    def to_dict(self) -> dict:
        """Serialize to dictionary for frontend."""
        return {
            'strength': self.strength,
            'dexterity': self.dexterity,
            'constitution': self.constitution,
            'luck': self.luck,
            'str_mod': self.str_mod,
            'dex_mod': self.dex_mod,
            'con_mod': self.con_mod,
            'luck_mod': self.luck_mod,
        }

    @classmethod
    def from_dict(cls, data: dict) -> 'AbilityScores':
        """Create from dictionary."""
        return cls(
            strength=data.get('strength', 10),
            dexterity=data.get('dexterity', 10),
            constitution=data.get('constitution', 10),
            luck=data.get('luck', 10),
        )


# Race base stats and modifiers
RACE_ABILITY_STATS = {
    'HUMAN': {
        'base_stats': {'str': 10, 'dex': 10, 'con': 10, 'luck': 10},
        'modifiers': {'str': 0, 'dex': 0, 'con': 0, 'luck': 2},
    },
    'ELF': {
        'base_stats': {'str': 8, 'dex': 12, 'con': 8, 'luck': 10},
        'modifiers': {'str': -1, 'dex': 2, 'con': 0, 'luck': 0},
    },
    'DWARF': {
        'base_stats': {'str': 12, 'dex': 8, 'con': 12, 'luck': 8},
        'modifiers': {'str': 1, 'dex': 0, 'con': 2, 'luck': -1},
    },
    'HALFLING': {
        'base_stats': {'str': 6, 'dex': 14, 'con': 10, 'luck': 12},
        'modifiers': {'str': -2, 'dex': 2, 'con': 0, 'luck': 2},
    },
    'ORC': {
        'base_stats': {'str': 14, 'dex': 8, 'con': 12, 'luck': 6},
        'modifiers': {'str': 2, 'dex': 0, 'con': 1, 'luck': -1},
    },
}

# Class ability modifiers and hit dice
CLASS_ABILITY_STATS = {
    'WARRIOR': {
        'primary_stat': 'STR',
        'modifiers': {'str': 2, 'dex': 0, 'con': 1, 'luck': 0},
        'hit_die': 'd10',
    },
    'MAGE': {
        'primary_stat': 'DEX',
        'modifiers': {'str': -1, 'dex': 1, 'con': 0, 'luck': 2},
        'hit_die': 'd6',
    },
    'ROGUE': {
        'primary_stat': 'DEX',
        'modifiers': {'str': 0, 'dex': 2, 'con': 0, 'luck': 1},
        'hit_die': 'd8',
    },
    'CLERIC': {
        'primary_stat': 'CON',
        'modifiers': {'str': 0, 'dex': 0, 'con': 2, 'luck': 1},
        'hit_die': 'd8',
    },
}


@dataclass
class AbilityRolls:
    """Result of rolling ability scores during character creation."""
    strength_roll: 'DiceRoll' = None
    dexterity_roll: 'DiceRoll' = None
    constitution_roll: 'DiceRoll' = None
    luck_roll: 'DiceRoll' = None

    def to_scores(self) -> AbilityScores:
        """Convert rolls to final ability scores."""
        return AbilityScores(
            strength=self.strength_roll.total if self.strength_roll else 10,
            dexterity=self.dexterity_roll.total if self.dexterity_roll else 10,
            constitution=self.constitution_roll.total if self.constitution_roll else 10,
            luck=self.luck_roll.total if self.luck_roll else 10,
        )

    def to_dict(self) -> dict:
        """Serialize for frontend display."""
        return {
            'strength': {
                'rolls': self.strength_roll.rolls if self.strength_roll else [],
                'total': self.strength_roll.total if self.strength_roll else 10,
            },
            'dexterity': {
                'rolls': self.dexterity_roll.rolls if self.dexterity_roll else [],
                'total': self.dexterity_roll.total if self.dexterity_roll else 10,
            },
            'constitution': {
                'rolls': self.constitution_roll.rolls if self.constitution_roll else [],
                'total': self.constitution_roll.total if self.constitution_roll else 10,
            },
            'luck': {
                'rolls': self.luck_roll.rolls if self.luck_roll else [],
                'total': self.luck_roll.total if self.luck_roll else 10,
            },
        }


def roll_ability_scores() -> AbilityRolls:
    """Roll 3d6 for each ability score.

    Returns:
        AbilityRolls with individual die results for each stat
    """
    return AbilityRolls(
        strength_roll=roll_dice(3, 6),
        dexterity_roll=roll_dice(3, 6),
        constitution_roll=roll_dice(3, 6),
        luck_roll=roll_dice(3, 6),
    )


def apply_race_modifiers(scores: AbilityScores, race: str) -> AbilityScores:
    """Apply race base stat adjustments and modifiers.

    Args:
        scores: Base rolled ability scores
        race: Race name (e.g., 'HUMAN', 'ELF')

    Returns:
        Modified AbilityScores
    """
    race_upper = race.upper() if isinstance(race, str) else race.name.upper()
    race_data = RACE_ABILITY_STATS.get(race_upper, RACE_ABILITY_STATS['HUMAN'])

    base_stats = race_data['base_stats']
    modifiers = race_data['modifiers']

    # Apply base stat adjustment (race_base - 10) and modifier
    return AbilityScores(
        strength=scores.strength + (base_stats['str'] - 10) + modifiers['str'],
        dexterity=scores.dexterity + (base_stats['dex'] - 10) + modifiers['dex'],
        constitution=scores.constitution + (base_stats['con'] - 10) + modifiers['con'],
        luck=scores.luck + (base_stats['luck'] - 10) + modifiers['luck'],
    )


def apply_class_modifiers(scores: AbilityScores, player_class: str) -> AbilityScores:
    """Apply class ability modifiers.

    Args:
        scores: Ability scores after race modifiers
        player_class: Class name (e.g., 'WARRIOR', 'MAGE')

    Returns:
        Modified AbilityScores
    """
    class_upper = player_class.upper() if isinstance(player_class, str) else player_class.name.upper()
    class_data = CLASS_ABILITY_STATS.get(class_upper, CLASS_ABILITY_STATS['WARRIOR'])

    modifiers = class_data['modifiers']

    return AbilityScores(
        strength=scores.strength + modifiers['str'],
        dexterity=scores.dexterity + modifiers['dex'],
        constitution=scores.constitution + modifiers['con'],
        luck=scores.luck + modifiers['luck'],
    )


def create_ability_scores(race: str, player_class: str,
                          rolled_scores: Optional[AbilityScores] = None) -> AbilityScores:
    """Create final ability scores with race and class modifiers.

    Stat calculation order:
    1. Roll 3d6 for each stat (base roll: 3-18)
    2. Add race base stat adjustment (race_base - 10)
    3. Apply race modifier
    4. Apply class modifier
    5. Final stat = rolled + race_adj + race_mod + class_mod

    Args:
        race: Race name
        player_class: Class name
        rolled_scores: Pre-rolled scores, or None to roll new

    Returns:
        Final AbilityScores with all modifiers applied
    """
    if rolled_scores is None:
        rolls = roll_ability_scores()
        rolled_scores = rolls.to_scores()

    # Apply race modifiers
    scores = apply_race_modifiers(rolled_scores, race)

    # Apply class modifiers
    scores = apply_class_modifiers(scores, player_class)

    # Ensure minimum score of 3
    return AbilityScores(
        strength=max(3, scores.strength),
        dexterity=max(3, scores.dexterity),
        constitution=max(3, scores.constitution),
        luck=max(3, scores.luck),
    )


def get_race_ability_preview(race: str) -> Dict[str, int]:
    """Get preview of race's effect on ability scores.

    Returns combined base adjustment + modifier for display.
    """
    race_upper = race.upper() if isinstance(race, str) else race.name.upper()
    race_data = RACE_ABILITY_STATS.get(race_upper, RACE_ABILITY_STATS['HUMAN'])

    base_stats = race_data['base_stats']
    modifiers = race_data['modifiers']

    return {
        'strength': (base_stats['str'] - 10) + modifiers['str'],
        'dexterity': (base_stats['dex'] - 10) + modifiers['dex'],
        'constitution': (base_stats['con'] - 10) + modifiers['con'],
        'luck': (base_stats['luck'] - 10) + modifiers['luck'],
    }


def get_class_ability_preview(player_class: str) -> Dict[str, int]:
    """Get preview of class's effect on ability scores."""
    class_upper = player_class.upper() if isinstance(player_class, str) else player_class.name.upper()
    class_data = CLASS_ABILITY_STATS.get(class_upper, CLASS_ABILITY_STATS['WARRIOR'])

    return dict(class_data['modifiers'])


def get_hit_die(player_class: str) -> str:
    """Get the hit die for a class (e.g., 'd10' for Warrior)."""
    class_upper = player_class.upper() if isinstance(player_class, str) else player_class.name.upper()
    class_data = CLASS_ABILITY_STATS.get(class_upper, CLASS_ABILITY_STATS['WARRIOR'])
    return class_data.get('hit_die', 'd8')


def get_primary_stat(player_class: str) -> str:
    """Get the primary stat for a class (e.g., 'STR' for Warrior)."""
    class_upper = player_class.upper() if isinstance(player_class, str) else player_class.name.upper()
    class_data = CLASS_ABILITY_STATS.get(class_upper, CLASS_ABILITY_STATS['WARRIOR'])
    return class_data.get('primary_stat', 'STR')
