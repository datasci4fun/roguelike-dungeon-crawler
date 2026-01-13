"""Boss ability definitions for v6.2 tactical combat.

Contains ability definitions for all boss types, organized by theme.
"""
from typing import Dict

from .battle_actions import BattleAction, AbilityDef


# =============================================================================
# Boss Ability Definitions by Theme
# =============================================================================

# Regent (LEGITIMACY) abilities
REGENT_ABILITIES: Dict[BattleAction, AbilityDef] = {
    BattleAction.ROYAL_DECREE: AbilityDef(
        action=BattleAction.ROYAL_DECREE,
        name="Royal Decree",
        description="Summon 1-2 oathbound guards",
        cooldown=5,
        range=0,
        self_buff=True,
    ),
    BattleAction.SUMMON_GUARD: AbilityDef(
        action=BattleAction.SUMMON_GUARD,
        name="Summon Guard",
        description="Summon 1 oathbound guard",
        cooldown=3,
        range=0,
        self_buff=True,
    ),
    BattleAction.COUNTERFEIT_CROWN: AbilityDef(
        action=BattleAction.COUNTERFEIT_CROWN,
        name="Counterfeit Crown",
        description="Stun the player briefly",
        cooldown=4,
        range=3,
        effect="stun",
        effect_duration=1,
    ),
}

# Rat King (CIRCULATION) abilities
RAT_KING_ABILITIES: Dict[BattleAction, AbilityDef] = {
    BattleAction.SUMMON_SWARM: AbilityDef(
        action=BattleAction.SUMMON_SWARM,
        name="Summon Swarm",
        description="Summon rat minions",
        cooldown=4,
        range=0,
        self_buff=True,
    ),
    BattleAction.PLAGUE_BITE: AbilityDef(
        action=BattleAction.PLAGUE_BITE,
        name="Plague Bite",
        description="Poisonous bite attack",
        cooldown=2,
        range=1,
        damage_mult=1.2,
        effect="poison",
        effect_duration=3,
    ),
    BattleAction.BURROW: AbilityDef(
        action=BattleAction.BURROW,
        name="Burrow",
        description="Dig to safety",
        cooldown=5,
        range=0,
        self_buff=True,
    ),
}

# Spider Queen (GROWTH) abilities
SPIDER_QUEEN_ABILITIES: Dict[BattleAction, AbilityDef] = {
    BattleAction.WEB_TRAP: AbilityDef(
        action=BattleAction.WEB_TRAP,
        name="Web Trap",
        description="Slow the player with webbing",
        cooldown=3,
        range=3,
        effect="freeze",
        effect_duration=2,
    ),
    BattleAction.POISON_BITE: AbilityDef(
        action=BattleAction.POISON_BITE,
        name="Poison Bite",
        description="Venomous bite attack",
        cooldown=2,
        range=1,
        damage_mult=1.1,
        effect="poison",
        effect_duration=3,
    ),
    BattleAction.SUMMON_SPIDERS: AbilityDef(
        action=BattleAction.SUMMON_SPIDERS,
        name="Summon Spiders",
        description="Summon spider minions",
        cooldown=4,
        range=0,
        self_buff=True,
    ),
}

# Frost Giant (STASIS) abilities
FROST_GIANT_ABILITIES: Dict[BattleAction, AbilityDef] = {
    BattleAction.FREEZE_GROUND: AbilityDef(
        action=BattleAction.FREEZE_GROUND,
        name="Freeze Ground",
        description="Create ice tiles in area",
        cooldown=6,
        range=0,
        aoe_radius=2,
        effect="freeze",
        effect_duration=2,
    ),
    BattleAction.ICE_BLAST: AbilityDef(
        action=BattleAction.ICE_BLAST,
        name="Ice Blast",
        description="Ranged freezing attack",
        cooldown=3,
        range=4,
        damage_mult=1.3,
        aoe_radius=1,
        effect="freeze",
        effect_duration=2,
    ),
}

# Arcane Keeper (COGNITION) abilities
ARCANE_KEEPER_ABILITIES: Dict[BattleAction, AbilityDef] = {
    BattleAction.ARCANE_BOLT: AbilityDef(
        action=BattleAction.ARCANE_BOLT,
        name="Arcane Bolt",
        description="Ranged magic attack",
        cooldown=1,
        range=5,
        damage_mult=1.4,
    ),
    BattleAction.TELEPORT: AbilityDef(
        action=BattleAction.TELEPORT,
        name="Teleport",
        description="Blink to optimal position",
        cooldown=4,
        range=0,
        self_buff=True,
    ),
}

# Flame Lord (TRANSFORMATION) abilities
FLAME_LORD_ABILITIES: Dict[BattleAction, AbilityDef] = {
    BattleAction.LAVA_POOL: AbilityDef(
        action=BattleAction.LAVA_POOL,
        name="Lava Pool",
        description="Create lava hazard",
        cooldown=5,
        range=4,
        aoe_radius=1,
    ),
    BattleAction.INFERNO: AbilityDef(
        action=BattleAction.INFERNO,
        name="Inferno",
        description="AoE burn around self",
        cooldown=4,
        range=0,
        damage_mult=1.0,
        aoe_radius=2,
        effect="burn",
        effect_duration=2,
    ),
    BattleAction.FIRE_BREATH: AbilityDef(
        action=BattleAction.FIRE_BREATH,
        name="Fire Breath",
        description="Cone of fire",
        cooldown=3,
        range=3,
        damage_mult=1.5,
        effect="burn",
        effect_duration=2,
    ),
}

# Dragon Emperor (INTEGRATION) abilities
DRAGON_EMPEROR_ABILITIES: Dict[BattleAction, AbilityDef] = {
    BattleAction.DRAGON_FEAR: AbilityDef(
        action=BattleAction.DRAGON_FEAR,
        name="Dragon Fear",
        description="Terrifying roar stuns enemies",
        cooldown=6,
        range=0,
        aoe_radius=3,
        effect="stun",
        effect_duration=1,
    ),
    BattleAction.TAIL_SWEEP: AbilityDef(
        action=BattleAction.TAIL_SWEEP,
        name="Tail Sweep",
        description="Sweeping tail attack",
        cooldown=2,
        range=1,
        damage_mult=1.3,
        aoe_radius=1,
    ),
    BattleAction.FIRE_BREATH: AbilityDef(
        action=BattleAction.FIRE_BREATH,
        name="Fire Breath",
        description="Dragon fire attack",
        cooldown=3,
        range=4,
        damage_mult=1.8,
        effect="burn",
        effect_duration=2,
    ),
}


# =============================================================================
# Boss Ability Lookup
# =============================================================================

ALL_BOSS_ABILITIES: Dict[str, Dict[BattleAction, AbilityDef]] = {
    'REGENT': REGENT_ABILITIES,
    'RAT_KING': RAT_KING_ABILITIES,
    'SPIDER_QUEEN': SPIDER_QUEEN_ABILITIES,
    'FROST_GIANT': FROST_GIANT_ABILITIES,
    'ARCANE_KEEPER': ARCANE_KEEPER_ABILITIES,
    'FLAME_LORD': FLAME_LORD_ABILITIES,
    'DRAGON_EMPEROR': DRAGON_EMPEROR_ABILITIES,
}


def get_boss_abilities(boss_type: str) -> Dict[BattleAction, AbilityDef]:
    """Get ability definitions for a boss type."""
    return ALL_BOSS_ABILITIES.get(boss_type.upper(), {})
