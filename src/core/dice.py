"""Core dice rolling system for D&D-style mechanics.

Supports standard dice notation (e.g., "2d6+3") and LUCK-influenced rolls.
"""
import random
import re
from dataclasses import dataclass, field
from typing import List, Tuple, Optional


@dataclass
class DiceRoll:
    """Result of a dice roll."""
    rolls: List[int] = field(default_factory=list)  # Individual die results
    total: int = 0
    modifier: int = 0
    dice_notation: str = ""
    is_critical: bool = False  # Natural 20 on d20
    is_fumble: bool = False    # Natural 1 on d20
    luck_applied: bool = False  # Whether LUCK influenced the roll

    def to_dict(self) -> dict:
        """Serialize to dictionary for frontend."""
        return {
            'rolls': self.rolls,
            'total': self.total,
            'modifier': self.modifier,
            'dice_notation': self.dice_notation,
            'is_critical': self.is_critical,
            'is_fumble': self.is_fumble,
            'luck_applied': self.luck_applied,
        }


@dataclass
class DiceSpec:
    """Parsed dice notation specification."""
    count: int = 1       # Number of dice
    sides: int = 6       # Sides per die
    modifier: int = 0    # Flat bonus/penalty

    @property
    def notation(self) -> str:
        """Get string notation."""
        base = f"{self.count}d{self.sides}"
        if self.modifier > 0:
            return f"{base}+{self.modifier}"
        elif self.modifier < 0:
            return f"{base}{self.modifier}"
        return base


def roll_die(sides: int, luck_modifier: float = 0.0) -> int:
    """Roll a single die with optional LUCK influence.

    Args:
        sides: Number of sides on the die (e.g., 6 for d6)
        luck_modifier: LUCK stat modifier (-5 to +5 typically)
            When positive, chance to roll twice and take higher
            When negative, chance to roll twice and take lower

    Returns:
        Result of the die roll
    """
    first_roll = random.randint(1, sides)

    # LUCK influence: chance to "advantage" or "disadvantage"
    # Each point of luck modifier = 10% chance of reroll
    if luck_modifier != 0:
        reroll_chance = abs(luck_modifier) * 0.10
        if random.random() < reroll_chance:
            second_roll = random.randint(1, sides)
            if luck_modifier > 0:
                # Good luck: take the higher roll
                return max(first_roll, second_roll)
            else:
                # Bad luck: take the lower roll
                return min(first_roll, second_roll)

    return first_roll


def roll_dice(count: int, sides: int, luck_modifier: float = 0.0) -> DiceRoll:
    """Roll multiple dice (e.g., 3d6).

    Args:
        count: Number of dice to roll
        sides: Number of sides per die
        luck_modifier: LUCK stat modifier

    Returns:
        DiceRoll with all results
    """
    rolls = [roll_die(sides, luck_modifier) for _ in range(count)]
    total = sum(rolls)
    luck_applied = luck_modifier != 0

    return DiceRoll(
        rolls=rolls,
        total=total,
        modifier=0,
        dice_notation=f"{count}d{sides}",
        is_critical=False,
        is_fumble=False,
        luck_applied=luck_applied,
    )


# Regex pattern for dice notation: "2d6+3", "1d20-2", "d8", etc.
DICE_PATTERN = re.compile(r'^(\d*)d(\d+)([+-]\d+)?$', re.IGNORECASE)


def parse_dice_notation(notation: str) -> Optional[DiceSpec]:
    """Parse dice notation string (e.g., "2d6+3").

    Supported formats:
        - "d6" -> 1d6
        - "2d6" -> 2d6
        - "2d6+3" -> 2d6 with +3 modifier
        - "1d20-2" -> 1d20 with -2 modifier

    Returns:
        DiceSpec or None if invalid notation
    """
    notation = notation.strip()
    match = DICE_PATTERN.match(notation)

    if not match:
        return None

    count_str, sides_str, mod_str = match.groups()

    count = int(count_str) if count_str else 1
    sides = int(sides_str)
    modifier = int(mod_str) if mod_str else 0

    if count < 1 or sides < 1:
        return None

    return DiceSpec(count=count, sides=sides, modifier=modifier)


def roll_notation(notation: str, luck_modifier: float = 0.0) -> Optional[DiceRoll]:
    """Roll dice from notation string.

    Args:
        notation: Dice notation (e.g., "2d6+3")
        luck_modifier: LUCK stat modifier

    Returns:
        DiceRoll or None if invalid notation
    """
    spec = parse_dice_notation(notation)
    if not spec:
        return None

    result = roll_dice(spec.count, spec.sides, luck_modifier)
    result.modifier = spec.modifier
    result.total += spec.modifier
    result.dice_notation = spec.notation

    return result


def roll_d20(luck_modifier: float = 0.0, advantage: bool = False,
             disadvantage: bool = False) -> DiceRoll:
    """Roll a d20 with critical/fumble detection.

    Args:
        luck_modifier: LUCK stat modifier
        advantage: Roll twice, take higher
        disadvantage: Roll twice, take lower

    Returns:
        DiceRoll with is_critical/is_fumble set appropriately
    """
    if advantage and disadvantage:
        # They cancel out
        advantage = disadvantage = False

    roll1 = roll_die(20, luck_modifier if not (advantage or disadvantage) else 0.0)
    rolls = [roll1]

    if advantage or disadvantage:
        roll2 = roll_die(20, 0.0)
        rolls.append(roll2)
        if advantage:
            result = max(roll1, roll2)
        else:
            result = min(roll1, roll2)
    else:
        result = roll1

    return DiceRoll(
        rolls=rolls,
        total=result,
        modifier=0,
        dice_notation="1d20",
        is_critical=(result == 20),
        is_fumble=(result == 1),
        luck_applied=(luck_modifier != 0 or advantage or disadvantage),
    )


def roll_d20_with_modifier(modifier: int = 0, luck_modifier: float = 0.0,
                           advantage: bool = False, disadvantage: bool = False) -> DiceRoll:
    """Roll a d20 and add a modifier (e.g., attack roll).

    Args:
        modifier: Flat bonus to add to roll
        luck_modifier: LUCK stat modifier
        advantage: Roll twice, take higher
        disadvantage: Roll twice, take lower

    Returns:
        DiceRoll with total including modifier
    """
    result = roll_d20(luck_modifier, advantage, disadvantage)
    result.modifier = modifier
    result.total += modifier

    # Update notation to show modifier
    if modifier > 0:
        result.dice_notation = f"1d20+{modifier}"
    elif modifier < 0:
        result.dice_notation = f"1d20{modifier}"

    return result


def roll_stat() -> DiceRoll:
    """Roll 3d6 for a single ability score (character creation)."""
    return roll_dice(3, 6, luck_modifier=0.0)


def roll_ability_score_4d6_drop_lowest() -> DiceRoll:
    """Roll 4d6, drop lowest die (alternative character creation method)."""
    rolls = [random.randint(1, 6) for _ in range(4)]
    rolls.sort(reverse=True)
    kept_rolls = rolls[:3]  # Keep highest 3

    return DiceRoll(
        rolls=kept_rolls,
        total=sum(kept_rolls),
        modifier=0,
        dice_notation="4d6 drop lowest",
        is_critical=False,
        is_fumble=False,
        luck_applied=False,
    )


def calculate_ability_modifier(score: int) -> int:
    """Calculate the D&D-style modifier for an ability score.

    Standard D&D formula: (score - 10) // 2

    Examples:
        - 10-11 -> +0
        - 12-13 -> +1
        - 8-9 -> -1
        - 18 -> +4
        - 3 -> -4
    """
    return (score - 10) // 2


# Convenient die-specific functions
def roll_d4(luck_modifier: float = 0.0) -> int:
    """Roll a d4."""
    return roll_die(4, luck_modifier)

def roll_d6(luck_modifier: float = 0.0) -> int:
    """Roll a d6."""
    return roll_die(6, luck_modifier)

def roll_d8(luck_modifier: float = 0.0) -> int:
    """Roll a d8."""
    return roll_die(8, luck_modifier)

def roll_d10(luck_modifier: float = 0.0) -> int:
    """Roll a d10."""
    return roll_die(10, luck_modifier)

def roll_d12(luck_modifier: float = 0.0) -> int:
    """Roll a d12."""
    return roll_die(12, luck_modifier)

def roll_d100(luck_modifier: float = 0.0) -> int:
    """Roll a d100 (percentile)."""
    return roll_die(100, luck_modifier)
