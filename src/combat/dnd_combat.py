"""D&D-style dice-based combat resolution for tactical battles.

Provides attack rolls, damage rolls, and saving throws using the core dice system.
Integrates LUCK stat for probability weighting.
"""
from dataclasses import dataclass, field
from typing import Optional, Tuple, List, TYPE_CHECKING
import random

from ..core.dice import (
    DiceRoll, roll_d20, roll_d20_with_modifier, roll_notation,
    roll_die, calculate_ability_modifier
)

if TYPE_CHECKING:
    from ..entities.entity.player import Player
    from .battle_types import BattleEntity


@dataclass
class AttackRoll:
    """Result of an attack roll (d20 + modifier vs AC)."""
    d20_roll: int = 0           # Natural d20 result
    modifier: int = 0           # Attack modifier (STR/DEX + proficiency)
    total: int = 0              # d20 + modifier
    target_ac: int = 10         # Target's armor class
    is_hit: bool = False        # True if total >= target_ac
    is_critical: bool = False   # Natural 20
    is_fumble: bool = False     # Natural 1
    luck_applied: bool = False  # Whether LUCK influenced the roll
    advantage: bool = False     # Was rolled with advantage
    disadvantage: bool = False  # Was rolled with disadvantage

    def to_dict(self) -> dict:
        """Serialize for frontend."""
        return {
            'd20_roll': self.d20_roll,
            'modifier': self.modifier,
            'total': self.total,
            'target_ac': self.target_ac,
            'is_hit': self.is_hit,
            'is_critical': self.is_critical,
            'is_fumble': self.is_fumble,
            'luck_applied': self.luck_applied,
            'advantage': self.advantage,
            'disadvantage': self.disadvantage,
        }


@dataclass
class DamageRoll:
    """Result of a damage roll (weapon dice + modifier)."""
    dice_notation: str = "1d6"  # e.g., "1d6", "2d6"
    dice_rolls: List[int] = field(default_factory=list)
    modifier: int = 0           # Damage modifier (STR/DEX)
    total: int = 0              # Sum of dice + modifier
    damage_type: str = "physical"  # physical, fire, cold, poison, etc.
    is_critical: bool = False   # If true, dice were doubled
    luck_applied: bool = False

    def to_dict(self) -> dict:
        """Serialize for frontend."""
        return {
            'dice_notation': self.dice_notation,
            'dice_rolls': self.dice_rolls,
            'modifier': self.modifier,
            'total': self.total,
            'damage_type': self.damage_type,
            'is_critical': self.is_critical,
            'luck_applied': self.luck_applied,
        }


@dataclass
class SavingThrow:
    """Result of a saving throw (d20 + ability modifier vs DC)."""
    d20_roll: int = 0
    ability: str = "DEX"        # STR, DEX, CON, or LUCK
    ability_mod: int = 0
    total: int = 0
    dc: int = 10                # Difficulty class
    success: bool = False
    is_natural_20: bool = False
    is_natural_1: bool = False
    luck_applied: bool = False

    def to_dict(self) -> dict:
        """Serialize for frontend."""
        return {
            'd20_roll': self.d20_roll,
            'ability': self.ability,
            'ability_mod': self.ability_mod,
            'total': self.total,
            'dc': self.dc,
            'success': self.success,
            'is_natural_20': self.is_natural_20,
            'is_natural_1': self.is_natural_1,
            'luck_applied': self.luck_applied,
        }


# Default weapon stats
DEFAULT_WEAPON_DAMAGE = "1d6"
UNARMED_DAMAGE = "1d4"

# Weapon damage dice by type
WEAPON_DAMAGE_DICE = {
    'fist': '1d4',
    'dagger': '1d4',
    'sword': '1d6',
    'axe': '1d8',
    'mace': '1d6',
    'staff': '1d6',
    'bow': '1d6',
    'crossbow': '1d8',
    'greatsword': '2d6',
    'greataxe': '1d12',
}


def make_attack_roll(
    attacker_attack_mod: int,
    target_ac: int,
    luck_modifier: float = 0.0,
    advantage: bool = False,
    disadvantage: bool = False,
    proficiency_bonus: int = 0
) -> AttackRoll:
    """Make an attack roll (d20 + modifiers vs AC).

    Args:
        attacker_attack_mod: Attacker's attack modifier (STR or DEX mod)
        target_ac: Target's armor class
        luck_modifier: LUCK stat modifier for reroll chance
        advantage: Roll twice, take higher
        disadvantage: Roll twice, take lower
        proficiency_bonus: Additional bonus (typically +2)

    Returns:
        AttackRoll with hit/miss/crit determination
    """
    # Advantage and disadvantage cancel out
    if advantage and disadvantage:
        advantage = disadvantage = False

    # Roll d20 with LUCK influence
    roll_result = roll_d20(luck_modifier, advantage, disadvantage)

    total_modifier = attacker_attack_mod + proficiency_bonus
    total = roll_result.rolls[0] + total_modifier  # Use natural roll for calculations

    # Determine if natural 20/1 (use highest/lowest of multiple rolls)
    natural_roll = roll_result.rolls[0]
    if len(roll_result.rolls) > 1:
        if advantage:
            natural_roll = max(roll_result.rolls)
        else:  # disadvantage
            natural_roll = min(roll_result.rolls)
        total = natural_roll + total_modifier

    is_critical = (natural_roll == 20)
    is_fumble = (natural_roll == 1)

    # Natural 20 always hits, natural 1 always misses
    if is_critical:
        is_hit = True
    elif is_fumble:
        is_hit = False
    else:
        is_hit = (total >= target_ac)

    return AttackRoll(
        d20_roll=natural_roll,
        modifier=total_modifier,
        total=total,
        target_ac=target_ac,
        is_hit=is_hit,
        is_critical=is_critical,
        is_fumble=is_fumble,
        luck_applied=roll_result.luck_applied,
        advantage=advantage,
        disadvantage=disadvantage,
    )


def make_damage_roll(
    weapon_dice: str = "1d6",
    damage_mod: int = 0,
    is_critical: bool = False,
    luck_modifier: float = 0.0,
    damage_type: str = "physical"
) -> DamageRoll:
    """Make a damage roll (weapon dice + modifier).

    Args:
        weapon_dice: Dice notation (e.g., "1d6", "2d6")
        damage_mod: Damage modifier (STR or DEX mod)
        is_critical: If true, double the dice
        luck_modifier: LUCK stat modifier
        damage_type: Type of damage

    Returns:
        DamageRoll with total damage
    """
    # Parse dice notation to double on critical
    notation = weapon_dice
    if is_critical:
        # Double the number of dice
        parts = notation.split('d')
        if len(parts) == 2:
            count = int(parts[0]) if parts[0] else 1
            notation = f"{count * 2}d{parts[1]}"

    # Roll the damage dice
    roll_result = roll_notation(notation, luck_modifier)
    if not roll_result:
        # Fallback if parsing fails
        roll_result = roll_notation("1d6", luck_modifier)

    total = roll_result.total + damage_mod

    # Minimum 1 damage
    total = max(1, total)

    return DamageRoll(
        dice_notation=notation,
        dice_rolls=roll_result.rolls,
        modifier=damage_mod,
        total=total,
        damage_type=damage_type,
        is_critical=is_critical,
        luck_applied=roll_result.luck_applied,
    )


def make_saving_throw(
    ability_mod: int,
    dc: int,
    ability: str = "DEX",
    luck_modifier: float = 0.0,
    advantage: bool = False,
    disadvantage: bool = False
) -> SavingThrow:
    """Make a saving throw (d20 + ability modifier vs DC).

    Args:
        ability_mod: Ability score modifier
        dc: Difficulty class to beat
        ability: Which ability (STR, DEX, CON, LUCK)
        luck_modifier: LUCK stat modifier
        advantage: Roll twice, take higher
        disadvantage: Roll twice, take lower

    Returns:
        SavingThrow with success/failure
    """
    # Advantage and disadvantage cancel out
    if advantage and disadvantage:
        advantage = disadvantage = False

    roll_result = roll_d20(luck_modifier, advantage, disadvantage)

    natural_roll = roll_result.rolls[0]
    if len(roll_result.rolls) > 1:
        if advantage:
            natural_roll = max(roll_result.rolls)
        else:
            natural_roll = min(roll_result.rolls)

    total = natural_roll + ability_mod

    # Natural 20 always succeeds, natural 1 always fails (optional D&D rule)
    is_natural_20 = (natural_roll == 20)
    is_natural_1 = (natural_roll == 1)

    if is_natural_20:
        success = True
    elif is_natural_1:
        success = False
    else:
        success = (total >= dc)

    return SavingThrow(
        d20_roll=natural_roll,
        ability=ability,
        ability_mod=ability_mod,
        total=total,
        dc=dc,
        success=success,
        is_natural_20=is_natural_20,
        is_natural_1=is_natural_1,
        luck_applied=roll_result.luck_applied,
    )


def calculate_ac(base_ac: int = 10, dex_mod: int = 0,
                 armor_bonus: int = 0, shield_bonus: int = 0) -> int:
    """Calculate armor class.

    Standard D&D formula: 10 + DEX mod + armor + shield
    """
    return base_ac + dex_mod + armor_bonus + shield_bonus


def resolve_attack(
    attacker_attack_mod: int,
    attacker_damage_mod: int,
    target_ac: int,
    weapon_dice: str = "1d6",
    attacker_luck: float = 0.0,
    advantage: bool = False,
    disadvantage: bool = False,
    proficiency_bonus: int = 2
) -> Tuple[AttackRoll, Optional[DamageRoll]]:
    """Resolve a complete attack (roll to hit, then roll damage if hit).

    Args:
        attacker_attack_mod: Attacker's attack modifier
        attacker_damage_mod: Attacker's damage modifier
        target_ac: Target's armor class
        weapon_dice: Weapon's damage dice
        attacker_luck: Attacker's LUCK modifier
        advantage: Attack with advantage
        disadvantage: Attack with disadvantage
        proficiency_bonus: Proficiency bonus to attack

    Returns:
        Tuple of (AttackRoll, DamageRoll or None if miss)
    """
    # Make attack roll
    attack = make_attack_roll(
        attacker_attack_mod=attacker_attack_mod,
        target_ac=target_ac,
        luck_modifier=attacker_luck,
        advantage=advantage,
        disadvantage=disadvantage,
        proficiency_bonus=proficiency_bonus
    )

    damage = None
    if attack.is_hit:
        # Roll damage (doubled on critical)
        damage = make_damage_roll(
            weapon_dice=weapon_dice,
            damage_mod=attacker_damage_mod,
            is_critical=attack.is_critical,
            luck_modifier=attacker_luck
        )

    return (attack, damage)


def get_weapon_damage_dice(weapon_type: str) -> str:
    """Get damage dice for a weapon type."""
    return WEAPON_DAMAGE_DICE.get(weapon_type.lower(), DEFAULT_WEAPON_DAMAGE)


# Saving throw DCs by trap/hazard type
TRAP_DCS = {
    'spike_trap': 12,
    'poison_dart': 14,
    'fire_trap': 13,
    'pit_trap': 10,
    'ice_trap': 11,
    'poison_gas': 15,
}


def resolve_trap_save(
    trap_type: str,
    dex_mod: int,
    luck_modifier: float = 0.0
) -> Tuple[SavingThrow, int]:
    """Resolve a saving throw against a trap.

    Args:
        trap_type: Type of trap
        dex_mod: Character's DEX modifier
        luck_modifier: Character's LUCK modifier

    Returns:
        Tuple of (SavingThrow, damage taken - halved on save)
    """
    dc = TRAP_DCS.get(trap_type, 12)

    save = make_saving_throw(
        ability_mod=dex_mod,
        dc=dc,
        ability="DEX",
        luck_modifier=luck_modifier
    )

    # Base trap damage
    base_damage = roll_notation("2d6").total if roll_notation("2d6") else 7

    if save.success:
        # Half damage on successful save
        damage = base_damage // 2
    else:
        damage = base_damage

    return (save, damage)


def resolve_poison_save(
    poison_dc: int,
    con_mod: int,
    luck_modifier: float = 0.0
) -> Tuple[SavingThrow, bool]:
    """Resolve a CON save against poison.

    Args:
        poison_dc: Difficulty class of the poison
        con_mod: Character's CON modifier
        luck_modifier: Character's LUCK modifier

    Returns:
        Tuple of (SavingThrow, is_poisoned)
    """
    save = make_saving_throw(
        ability_mod=con_mod,
        dc=poison_dc,
        ability="CON",
        luck_modifier=luck_modifier
    )

    return (save, not save.success)


@dataclass
class CombatResult:
    """Complete result of a combat action for frontend display."""
    attack_roll: Optional[AttackRoll] = None
    damage_roll: Optional[DamageRoll] = None
    saving_throw: Optional[SavingThrow] = None
    attacker_id: str = ""
    target_id: str = ""
    damage_dealt: int = 0
    target_hp_remaining: int = 0
    is_kill: bool = False
    message: str = ""

    def to_dict(self) -> dict:
        """Serialize for frontend."""
        result = {
            'attacker_id': self.attacker_id,
            'target_id': self.target_id,
            'damage_dealt': self.damage_dealt,
            'target_hp_remaining': self.target_hp_remaining,
            'is_kill': self.is_kill,
            'message': self.message,
        }

        if self.attack_roll:
            result['attack_roll'] = self.attack_roll.to_dict()
        if self.damage_roll:
            result['damage_roll'] = self.damage_roll.to_dict()
        if self.saving_throw:
            result['saving_throw'] = self.saving_throw.to_dict()

        return result


def format_attack_message(
    attacker_name: str,
    target_name: str,
    attack: AttackRoll,
    damage: Optional[DamageRoll]
) -> str:
    """Format a combat message for display.

    Examples:
        "Warrior rolls 15+3=18 vs AC 14 - HIT! 1d6+2=7 damage"
        "Goblin rolls 5+1=6 vs AC 16 - MISS!"
        "Rogue rolls nat 20! CRITICAL HIT! 2d6+4=14 damage!"
    """
    if attack.is_critical:
        roll_str = f"rolls nat 20! CRITICAL"
    elif attack.is_fumble:
        roll_str = f"rolls nat 1! FUMBLE"
    else:
        roll_str = f"rolls {attack.d20_roll}+{attack.modifier}={attack.total} vs AC {attack.target_ac}"

    if attack.is_hit and damage:
        if attack.is_critical:
            return f"{attacker_name} {roll_str} HIT! {damage.dice_notation}+{damage.modifier}={damage.total} damage!"
        else:
            return f"{attacker_name} {roll_str} - HIT! {damage.total} damage"
    else:
        return f"{attacker_name} {roll_str} - MISS!"
