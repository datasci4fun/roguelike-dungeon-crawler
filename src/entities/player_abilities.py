"""Player ability definitions for the character class system."""
from dataclasses import dataclass
from enum import Enum, auto
from typing import Optional

from ..core.constants import StatusEffectType


class AbilityCategory(Enum):
    """Categories of player abilities."""
    ACTIVE = auto()    # Must be activated, has cooldown
    PASSIVE = auto()   # Always active, provides bonuses


class TargetType(Enum):
    """How the ability targets."""
    SELF = auto()       # Affects player only
    SINGLE = auto()     # Single enemy target
    AOE = auto()        # Area of effect around player
    DIRECTIONAL = auto() # In facing direction


@dataclass
class PlayerAbility:
    """Definition of a player ability."""
    id: str
    name: str
    description: str
    category: AbilityCategory
    cooldown: int = 0           # Turns between uses (0 for passives)
    target_type: TargetType = TargetType.SELF
    range: int = 0              # 0 = melee, 1+ = tiles away
    damage: int = 0             # Base damage (0 for utility/multiplier abilities)
    damage_multiplier: float = 1.0  # Damage multiplier for attacks
    effect: Optional[StatusEffectType] = None  # Status effect to apply
    effect_chance: float = 1.0  # Probability of effect (0.0 - 1.0)
    duration: int = 0           # Duration for buffs/debuffs

    # Passive-specific
    passive_bonus: float = 0.0  # Bonus value for passive abilities


# All player abilities
PLAYER_ABILITIES = {
    # ========== WARRIOR ABILITIES ==========
    'power_strike': PlayerAbility(
        id='power_strike',
        name='Power Strike',
        description='A devastating melee attack dealing 2x damage',
        category=AbilityCategory.ACTIVE,
        cooldown=4,
        target_type=TargetType.SINGLE,
        range=1,
        damage_multiplier=2.0,
    ),
    'shield_wall': PlayerAbility(
        id='shield_wall',
        name='Shield Wall',
        description='Block all damage for 2 turns, cannot attack',
        category=AbilityCategory.ACTIVE,
        cooldown=8,
        target_type=TargetType.SELF,
        duration=2,
    ),
    'combat_mastery': PlayerAbility(
        id='combat_mastery',
        name='Combat Mastery',
        description='+15% damage with melee attacks',
        category=AbilityCategory.PASSIVE,
        passive_bonus=0.15,
    ),

    # ========== MAGE ABILITIES ==========
    'fireball': PlayerAbility(
        id='fireball',
        name='Fireball',
        description='Hurl a ball of fire dealing 8 damage + burn',
        category=AbilityCategory.ACTIVE,
        cooldown=3,
        target_type=TargetType.SINGLE,
        range=5,
        damage=8,
        effect=StatusEffectType.BURN,
        effect_chance=0.75,
    ),
    'frost_nova': PlayerAbility(
        id='frost_nova',
        name='Frost Nova',
        description='Freeze all enemies within 2 tiles for 4 damage',
        category=AbilityCategory.ACTIVE,
        cooldown=6,
        target_type=TargetType.AOE,
        range=2,
        damage=4,
        effect=StatusEffectType.FREEZE,
        effect_chance=1.0,
    ),
    'mana_shield': PlayerAbility(
        id='mana_shield',
        name='Mana Shield',
        description='25% of incoming damage is absorbed',
        category=AbilityCategory.PASSIVE,
        passive_bonus=0.25,
    ),

    # ========== ROGUE ABILITIES ==========
    'backstab': PlayerAbility(
        id='backstab',
        name='Backstab',
        description='3x damage attack (best used from stealth)',
        category=AbilityCategory.ACTIVE,
        cooldown=2,
        target_type=TargetType.SINGLE,
        range=1,
        damage_multiplier=3.0,
    ),
    'smoke_bomb': PlayerAbility(
        id='smoke_bomb',
        name='Smoke Bomb',
        description='Become invisible for 3 turns',
        category=AbilityCategory.ACTIVE,
        cooldown=10,
        target_type=TargetType.SELF,
        duration=3,
    ),
    'critical_strike': PlayerAbility(
        id='critical_strike',
        name='Critical Strike',
        description='20% chance to deal double damage',
        category=AbilityCategory.PASSIVE,
        passive_bonus=0.20,
    ),

    # ========== CLERIC ABILITIES ==========
    'heal': PlayerAbility(
        id='heal',
        name='Heal',
        description='Restore 10 HP to yourself',
        category=AbilityCategory.ACTIVE,
        cooldown=5,
        target_type=TargetType.SELF,
        damage=-10,  # Negative damage = healing
    ),
    'smite': PlayerAbility(
        id='smite',
        name='Smite',
        description='Holy strike dealing 6 damage, 2x to undead',
        category=AbilityCategory.ACTIVE,
        cooldown=3,
        target_type=TargetType.SINGLE,
        range=1,
        damage=6,
        damage_multiplier=2.0,  # Double vs undead (handled in combat)
    ),
    'divine_protection': PlayerAbility(
        id='divine_protection',
        name='Divine Protection',
        description='20% of incoming damage is negated by divine favor',
        category=AbilityCategory.PASSIVE,
        passive_bonus=0.20,
    ),
}


def get_ability(ability_id: str) -> Optional[PlayerAbility]:
    """Get an ability by its ID."""
    return PLAYER_ABILITIES.get(ability_id)


def get_abilities_for_class(active_abilities: list, passive_abilities: list) -> dict:
    """Get all abilities for a class configuration."""
    abilities = {}
    for ability_id in active_abilities + passive_abilities:
        ability = get_ability(ability_id)
        if ability:
            abilities[ability_id] = ability
    return abilities
