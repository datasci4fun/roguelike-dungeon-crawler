"""Boss ability definitions and data structures.

Contains AbilityType enum, BossAbility dataclass, and all ability definitions.
"""
from dataclasses import dataclass
from enum import Enum, auto


class AbilityType(Enum):
    """Types of boss abilities."""
    AOE_ATTACK = auto()      # Damage in radius
    SUMMON = auto()          # Spawn minions
    BUFF = auto()            # Self-buff (rage, regenerate)
    RANGED = auto()          # Ranged attack
    SPECIAL = auto()         # Unique mechanics (teleport, drain)


@dataclass
class BossAbility:
    """Definition of a boss ability."""
    name: str
    ability_type: AbilityType
    cooldown: int           # Turns between uses
    damage: int             # Damage if applicable (negative = heal)
    range: int              # 0 = self, 1+ = tiles from boss
    description: str


# Element to resistance key mapping
ELEMENT_RESISTANCE_KEYS = {
    'fire': 'fire',
    'ice': 'ice',
    'lightning': 'lightning',
    'dark': 'dark',
}


# All boss abilities
BOSS_ABILITIES = {
    # Goblin King abilities
    'summon_goblins': BossAbility(
        name='Summon Goblins',
        ability_type=AbilityType.SUMMON,
        cooldown=5,
        damage=0,
        range=0,
        description='Summons 2-3 goblin minions',
    ),
    'war_cry': BossAbility(
        name='War Cry',
        ability_type=AbilityType.BUFF,
        cooldown=8,
        damage=0,
        range=0,
        description='Increases damage by 50% for 3 turns',
    ),

    # Cave Troll abilities
    'ground_slam': BossAbility(
        name='Ground Slam',
        ability_type=AbilityType.AOE_ATTACK,
        cooldown=4,
        damage=8,
        range=2,
        description='Slams the ground, damaging all nearby',
    ),
    'regenerate': BossAbility(
        name='Regenerate',
        ability_type=AbilityType.BUFF,
        cooldown=0,  # Passive, always active when low
        damage=-5,   # Heals 5 HP
        range=0,
        description='Regenerates health when below 50%',
    ),

    # Lich Lord abilities
    'raise_dead': BossAbility(
        name='Raise Dead',
        ability_type=AbilityType.SUMMON,
        cooldown=6,
        damage=0,
        range=0,
        description='Raises 2 skeleton minions',
    ),
    'life_drain': BossAbility(
        name='Life Drain',
        ability_type=AbilityType.SPECIAL,
        cooldown=3,
        damage=6,
        range=3,
        description='Drains life from the player, healing self',
    ),

    # Arcane Keeper abilities
    'arcane_bolt': BossAbility(
        name='Arcane Bolt',
        ability_type=AbilityType.RANGED,
        cooldown=2,
        damage=8,
        range=5,
        description='Fires a bolt of arcane energy',
    ),
    'teleport': BossAbility(
        name='Teleport',
        ability_type=AbilityType.SPECIAL,
        cooldown=5,
        damage=0,
        range=0,
        description='Teleports to a random location',
    ),

    # Dragon Emperor abilities
    'fire_breath': BossAbility(
        name='Fire Breath',
        ability_type=AbilityType.AOE_ATTACK,
        cooldown=4,
        damage=12,
        range=3,
        description='Breathes fire in a cone',
    ),
    'tail_sweep': BossAbility(
        name='Tail Sweep',
        ability_type=AbilityType.AOE_ATTACK,
        cooldown=3,
        damage=10,
        range=1,
        description='Sweeps tail, hitting all adjacent',
    ),

    # v4.0 New enemy abilities
    'raise_skeleton': BossAbility(
        name='Raise Skeleton',
        ability_type=AbilityType.SUMMON,
        cooldown=6,
        damage=0,
        range=0,
        description='Raises a skeleton minion',
    ),
    'dark_bolt': BossAbility(
        name='Dark Bolt',
        ability_type=AbilityType.RANGED,
        cooldown=2,
        damage=6,
        range=5,
        description='Fires a bolt of dark energy',
    ),
    'fire_strike': BossAbility(
        name='Fire Strike',
        ability_type=AbilityType.SPECIAL,
        cooldown=3,
        damage=10,
        range=1,
        description='Melee attack that applies burn',
    ),
    'backstab': BossAbility(
        name='Backstab',
        ability_type=AbilityType.SPECIAL,
        cooldown=0,  # Always available from stealth
        damage=0,  # 3x normal damage
        range=1,
        description='3x damage when attacking from stealth',
    ),
    'vanish': BossAbility(
        name='Vanish',
        ability_type=AbilityType.SPECIAL,
        cooldown=5,
        damage=0,
        range=0,
        description='Become invisible',
    ),
    'fire_bolt': BossAbility(
        name='Fire Bolt',
        ability_type=AbilityType.RANGED,
        cooldown=2,
        damage=8,
        range=4,
        description='Ranged fire attack that applies burn',
    ),
    'ice_shard': BossAbility(
        name='Ice Shard',
        ability_type=AbilityType.RANGED,
        cooldown=2,
        damage=6,
        range=4,
        description='Ranged ice attack that applies freeze',
    ),
    'chain_lightning': BossAbility(
        name='Chain Lightning',
        ability_type=AbilityType.SPECIAL,
        cooldown=4,
        damage=5,
        range=5,
        description='Lightning that can jump to nearby targets',
    ),

    # v5.0 New boss abilities for expanded dungeon

    # Frost Giant abilities
    'ice_blast': BossAbility(
        name='Ice Blast',
        ability_type=AbilityType.AOE_ATTACK,
        cooldown=4,
        damage=10,
        range=3,
        description='Blasts freezing ice in all directions',
    ),
    'freeze_ground': BossAbility(
        name='Freeze Ground',
        ability_type=AbilityType.SPECIAL,
        cooldown=6,
        damage=0,
        range=2,
        description='Freezes the ground, slowing enemies',
    ),

    # Spider Queen abilities
    'web_trap': BossAbility(
        name='Web Trap',
        ability_type=AbilityType.SPECIAL,
        cooldown=4,
        damage=0,
        range=4,
        description='Shoots sticky web to immobilize target',
    ),
    'poison_bite': BossAbility(
        name='Poison Bite',
        ability_type=AbilityType.SPECIAL,
        cooldown=3,
        damage=8,
        range=1,
        description='Venomous bite that poisons the target',
    ),
    'summon_spiders': BossAbility(
        name='Summon Spiders',
        ability_type=AbilityType.SUMMON,
        cooldown=5,
        damage=0,
        range=0,
        description='Summons spider minions to attack',
    ),

    # Flame Lord abilities
    'lava_pool': BossAbility(
        name='Lava Pool',
        ability_type=AbilityType.SPECIAL,
        cooldown=5,
        damage=6,
        range=3,
        description='Creates a pool of lava that burns',
    ),
    'inferno': BossAbility(
        name='Inferno',
        ability_type=AbilityType.AOE_ATTACK,
        cooldown=6,
        damage=15,
        range=2,
        description='Erupts in flames, damaging all nearby',
    ),

    # Rat King abilities
    'summon_swarm': BossAbility(
        name='Summon Swarm',
        ability_type=AbilityType.SUMMON,
        cooldown=4,
        damage=0,
        range=0,
        description='Summons a swarm of rats',
    ),
    'plague_bite': BossAbility(
        name='Plague Bite',
        ability_type=AbilityType.SPECIAL,
        cooldown=3,
        damage=8,
        range=1,
        description='Diseased bite that weakens the target',
    ),
    'burrow': BossAbility(
        name='Burrow',
        ability_type=AbilityType.SPECIAL,
        cooldown=5,
        damage=0,
        range=0,
        description='Burrows underground to reposition',
    ),

    # The Regent abilities (Floor 4 - Mirror Valdris)
    'royal_decree': BossAbility(
        name='Royal Decree',
        ability_type=AbilityType.SPECIAL,
        cooldown=5,
        damage=0,
        range=0,
        description='Issues a decree that alters reality - summons oath-bound guards',
    ),
    'summon_guard': BossAbility(
        name='Summon Guard',
        ability_type=AbilityType.SUMMON,
        cooldown=4,
        damage=0,
        range=0,
        description='Summons an oath-bound skeleton guard',
    ),
    'counterfeit_crown': BossAbility(
        name='Counterfeit Crown',
        ability_type=AbilityType.SPECIAL,
        cooldown=8,
        damage=4,
        range=3,
        description='The false crown flashes, stunning nearby enemies',
    ),
}
