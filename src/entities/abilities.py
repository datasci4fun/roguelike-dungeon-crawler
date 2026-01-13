"""Boss ability system for special attacks and effects.

This module provides the public API for the ability system.
Definitions are in ability_definitions.py, handlers in ability_handlers.py.
"""
from typing import TYPE_CHECKING, Tuple

# Re-export public API from submodules
from .ability_definitions import (
    AbilityType,
    BossAbility,
    BOSS_ABILITIES,
    ELEMENT_RESISTANCE_KEYS,
)
from .ability_handlers import (
    calculate_elemental_damage,
    ABILITY_HANDLERS,
)

if TYPE_CHECKING:
    from .entities import Enemy, Player
    from ..world.dungeon import Dungeon
    from ..managers.entity_manager import EntityManager


def execute_ability(
    ability_name: str,
    boss: 'Enemy',
    player: 'Player',
    dungeon: 'Dungeon',
    entity_manager: 'EntityManager',
) -> Tuple[bool, str, int]:
    """
    Execute a boss ability.

    Returns:
        Tuple of (success, message, damage_dealt)
    """
    ability = BOSS_ABILITIES.get(ability_name)
    if not ability:
        return False, "", 0

    handler = ABILITY_HANDLERS.get(ability_name)
    if handler:
        return handler(ability, boss, player, dungeon, entity_manager)

    return False, "", 0
