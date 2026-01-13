"""Player configuration data - races, classes, progression."""
from .enums import Race, PlayerClass

# Race stat modifiers and special traits
RACE_STATS = {
    Race.HUMAN: {
        'name': 'Human',
        'description': 'Balanced and adaptable',
        'hp_modifier': 0,
        'atk_modifier': 0,
        'def_modifier': 0,
        'trait': 'adaptive',
        'trait_name': 'Adaptive',
        'trait_description': '+10% XP gain, +1 starting feat',
        'starts_with_feat': True,  # Humans choose 1 feat at character creation
    },
    Race.ELF: {
        'name': 'Elf',
        'description': 'Agile and perceptive',
        'hp_modifier': -2,
        'atk_modifier': 1,
        'def_modifier': 0,
        'trait': 'keen_sight',
        'trait_name': 'Keen Sight',
        'trait_description': '+2 vision range',
    },
    Race.DWARF: {
        'name': 'Dwarf',
        'description': 'Sturdy and resilient',
        'hp_modifier': 4,
        'atk_modifier': -1,
        'def_modifier': 2,
        'trait': 'poison_resist',
        'trait_name': 'Poison Resistance',
        'trait_description': '50% poison resistance',
    },
    Race.HALFLING: {
        'name': 'Halfling',
        'description': 'Lucky and nimble',
        'hp_modifier': -4,
        'atk_modifier': 0,
        'def_modifier': 0,
        'trait': 'lucky',
        'trait_name': 'Lucky',
        'trait_description': '15% dodge chance',
    },
    Race.ORC: {
        'name': 'Orc',
        'description': 'Powerful but reckless',
        'hp_modifier': 6,
        'atk_modifier': 2,
        'def_modifier': -1,
        'trait': 'rage',
        'trait_name': 'Rage',
        'trait_description': '+50% damage below 25% HP',
    },
}

# Class stat modifiers and abilities
CLASS_STATS = {
    PlayerClass.WARRIOR: {
        'name': 'Warrior',
        'description': 'Master of melee combat',
        'hp_modifier': 5,
        'atk_modifier': 1,
        'def_modifier': 1,
        'active_abilities': ['power_strike', 'shield_wall'],
        'passive_abilities': ['combat_mastery'],
    },
    PlayerClass.MAGE: {
        'name': 'Mage',
        'description': 'Wielder of arcane power',
        'hp_modifier': -3,
        'atk_modifier': -1,
        'def_modifier': 0,
        'active_abilities': ['fireball', 'frost_nova'],
        'passive_abilities': ['mana_shield'],
    },
    PlayerClass.ROGUE: {
        'name': 'Rogue',
        'description': 'Silent and deadly',
        'hp_modifier': 0,
        'atk_modifier': 2,
        'def_modifier': -1,
        'active_abilities': ['backstab', 'smoke_bomb'],
        'passive_abilities': ['critical_strike'],
    },
    PlayerClass.CLERIC: {
        'name': 'Cleric',
        'description': 'Divine light in darkness',
        'hp_modifier': 2,
        'atk_modifier': 0,
        'def_modifier': 1,
        'active_abilities': ['heal', 'smite'],
        'passive_abilities': ['divine_protection'],
    },
}

# Combat configuration (base stats)
PLAYER_MAX_HEALTH = 20
PLAYER_ATTACK_DAMAGE = 3
ENEMY_MAX_HEALTH = 8
ENEMY_ATTACK_DAMAGE = 2
ENEMY_CHASE_RANGE = 8

# XP and Leveling configuration
XP_PER_KILL = 15                # XP awarded per enemy kill
XP_BASE_REQUIREMENT = 30        # Level 1→2 requires 30 XP (formula: level × 30)
MAX_PLAYER_LEVEL = 10           # Maximum player level

# Stat growth per level
HP_GAIN_PER_LEVEL = 10         # Max HP increase per level
ATK_GAIN_PER_LEVEL = 1         # Attack damage increase per level
