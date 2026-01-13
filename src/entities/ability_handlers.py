"""Boss ability execution handlers.

Contains the dispatch table mapping ability names to handler functions.
Individual handlers are organized by category in separate modules.
"""
# Re-export elemental damage calculator for external use
from .ability_handlers_elemental import calculate_elemental_damage

# Import summon abilities
from .ability_handlers_summon import (
    execute_summon_goblins,
    execute_raise_dead,
    execute_raise_skeleton,
    execute_summon_spiders,
    execute_summon_swarm,
    execute_royal_decree,
    execute_summon_guard,
)

# Import elemental/magic abilities
from .ability_handlers_elemental import (
    execute_arcane_bolt,
    execute_fire_breath,
    execute_dark_bolt,
    execute_fire_bolt,
    execute_ice_shard,
    execute_chain_lightning,
    execute_ice_blast,
    execute_freeze_ground,
    execute_lava_pool,
    execute_inferno,
    execute_counterfeit_crown,
)

# Import physical/melee abilities
from .ability_handlers_physical import (
    execute_war_cry,
    execute_ground_slam,
    execute_regenerate,
    execute_life_drain,
    execute_teleport,
    execute_tail_sweep,
    execute_fire_strike,
    execute_backstab,
    execute_vanish,
    execute_web_trap,
    execute_poison_bite,
    execute_plague_bite,
    execute_burrow,
)


# Handler dispatch table mapping ability names to functions
ABILITY_HANDLERS = {
    # Original boss abilities (v1.0-v3.0)
    'summon_goblins': execute_summon_goblins,
    'war_cry': execute_war_cry,
    'ground_slam': execute_ground_slam,
    'regenerate': execute_regenerate,
    'raise_dead': execute_raise_dead,
    'life_drain': execute_life_drain,
    'arcane_bolt': execute_arcane_bolt,
    'teleport': execute_teleport,
    'fire_breath': execute_fire_breath,
    'tail_sweep': execute_tail_sweep,
    # v4.0 new abilities
    'raise_skeleton': execute_raise_skeleton,
    'dark_bolt': execute_dark_bolt,
    'fire_strike': execute_fire_strike,
    'backstab': execute_backstab,
    'vanish': execute_vanish,
    'fire_bolt': execute_fire_bolt,
    'ice_shard': execute_ice_shard,
    'chain_lightning': execute_chain_lightning,
    # v5.0 new boss abilities
    'ice_blast': execute_ice_blast,
    'freeze_ground': execute_freeze_ground,
    'web_trap': execute_web_trap,
    'poison_bite': execute_poison_bite,
    'summon_spiders': execute_summon_spiders,
    'lava_pool': execute_lava_pool,
    'inferno': execute_inferno,
    'summon_swarm': execute_summon_swarm,
    'plague_bite': execute_plague_bite,
    'burrow': execute_burrow,
    # Regent abilities
    'royal_decree': execute_royal_decree,
    'summon_guard': execute_summon_guard,
    'counterfeit_crown': execute_counterfeit_crown,
}
