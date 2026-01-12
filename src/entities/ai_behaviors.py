"""AI behavior system for v4.0 enemy types.

Provides different AI behaviors for enemies:
- CHASE: Standard pathfinding to player
- RANGED_KITE: Maintain distance, use ranged abilities
- AGGRESSIVE: Rush player, spam abilities
- STEALTH: Invisibility, ambush attacks
- ELEMENTAL: Element-based tactics
"""
from typing import TYPE_CHECKING, Tuple, Optional
import random

from ..core.constants import AIBehavior, ENEMY_STATS
from .abilities import execute_ability, BOSS_ABILITIES

if TYPE_CHECKING:
    from .entities import Enemy, Player
    from ..world.dungeon import Dungeon
    from ..managers.entity_manager import EntityManager


def get_ai_action(
    enemy: 'Enemy',
    player: 'Player',
    dungeon: 'Dungeon',
    entity_manager: 'EntityManager',
) -> Tuple[Optional[Tuple[int, int]], Optional[str], Optional[str]]:
    """
    Determine the AI action for an enemy.

    Returns:
        Tuple of (move, ability_used, message):
        - move: (dx, dy) tuple for movement, or None if no movement
        - ability_used: Name of ability used, or None
        - message: Message to display, or None
    """
    # Get AI type from enemy stats
    ai_type = _get_ai_type(enemy)

    # Dispatch to appropriate behavior
    if ai_type == AIBehavior.RANGED_KITE:
        return _ranged_kite_behavior(enemy, player, dungeon, entity_manager)
    elif ai_type == AIBehavior.AGGRESSIVE:
        return _aggressive_behavior(enemy, player, dungeon, entity_manager)
    elif ai_type == AIBehavior.STEALTH:
        return _stealth_behavior(enemy, player, dungeon, entity_manager)
    elif ai_type == AIBehavior.ELEMENTAL:
        return _elemental_behavior(enemy, player, dungeon, entity_manager)
    else:
        # Default CHASE behavior
        return _chase_behavior(enemy, player, dungeon, entity_manager)


def _get_ai_type(enemy: 'Enemy') -> AIBehavior:
    """Get the AI behavior type for an enemy."""
    if enemy.enemy_type is None:
        return AIBehavior.CHASE

    stats = ENEMY_STATS.get(enemy.enemy_type, {})
    return stats.get('ai_type', AIBehavior.CHASE)


def _get_abilities(enemy: 'Enemy') -> list:
    """Get the list of abilities for an enemy."""
    if enemy.enemy_type is None:
        return []

    stats = ENEMY_STATS.get(enemy.enemy_type, {})
    return stats.get('abilities', [])


def _try_use_ability(
    enemy: 'Enemy',
    player: 'Player',
    dungeon: 'Dungeon',
    entity_manager: 'EntityManager',
    ability_name: str,
) -> Tuple[bool, Optional[str]]:
    """
    Try to use an ability if it's available and appropriate.

    Returns:
        Tuple of (success, message)
    """
    # Check cooldown
    cooldown = enemy.ability_cooldowns.get(ability_name, 0)
    if cooldown > 0:
        return False, None

    ability = BOSS_ABILITIES.get(ability_name)
    if not ability:
        return False, None

    # Check range
    distance = enemy.distance_to(player.x, player.y)
    if distance > ability.range and ability.range > 0:
        return False, None

    # Execute ability
    success, message, _ = execute_ability(
        ability_name, enemy, player, dungeon, entity_manager
    )

    if success:
        enemy.ability_cooldowns[ability_name] = ability.cooldown

    return success, message


def _chase_behavior(
    enemy: 'Enemy',
    player: 'Player',
    dungeon: 'Dungeon',
    entity_manager: 'EntityManager',
) -> Tuple[Optional[Tuple[int, int]], Optional[str], Optional[str]]:
    """Standard chase behavior - move toward player."""
    move = enemy.get_move_toward_player(player.x, player.y, dungeon.is_walkable)
    return move, None, None


def _ranged_kite_behavior(
    enemy: 'Enemy',
    player: 'Player',
    dungeon: 'Dungeon',
    entity_manager: 'EntityManager',
) -> Tuple[Optional[Tuple[int, int]], Optional[str], Optional[str]]:
    """
    Ranged kiting behavior:
    - If too close, move away
    - If at good range, use abilities
    - If too far, move closer
    """
    distance = enemy.distance_to(player.x, player.y)
    abilities = _get_abilities(enemy)
    preferred_range = 4  # Ideal distance to maintain

    # Try abilities first if at good range
    if 3 <= distance <= 6:
        for ability_name in abilities:
            success, message = _try_use_ability(
                enemy, player, dungeon, entity_manager, ability_name
            )
            if success:
                return None, ability_name, message

    # If too close, try to move away
    if distance < 3:
        move = _get_move_away_from(enemy, player, dungeon)
        if move != (0, 0):
            return move, None, None

    # If too far or can't kite, move closer
    move = enemy.get_move_toward_player(player.x, player.y, dungeon.is_walkable)
    return move, None, None


def _aggressive_behavior(
    enemy: 'Enemy',
    player: 'Player',
    dungeon: 'Dungeon',
    entity_manager: 'EntityManager',
) -> Tuple[Optional[Tuple[int, int]], Optional[str], Optional[str]]:
    """
    Aggressive behavior:
    - Always try to use abilities when in range
    - Rush toward player
    """
    distance = enemy.distance_to(player.x, player.y)
    abilities = _get_abilities(enemy)

    # Try abilities aggressively
    for ability_name in abilities:
        success, message = _try_use_ability(
            enemy, player, dungeon, entity_manager, ability_name
        )
        if success:
            # Still move toward player after ability
            move = enemy.get_move_toward_player(player.x, player.y, dungeon.is_walkable)
            return move, ability_name, message

    # Rush toward player
    move = enemy.get_move_toward_player(player.x, player.y, dungeon.is_walkable)
    return move, None, None


def _stealth_behavior(
    enemy: 'Enemy',
    player: 'Player',
    dungeon: 'Dungeon',
    entity_manager: 'EntityManager',
) -> Tuple[Optional[Tuple[int, int]], Optional[str], Optional[str]]:
    """
    Stealth behavior:
    - If visible and not adjacent, try to vanish
    - If invisible, sneak toward player
    - If adjacent, backstab
    """
    distance = enemy.distance_to(player.x, player.y)
    abilities = _get_abilities(enemy)
    is_invisible = getattr(enemy, 'is_invisible', False)

    # If adjacent, try backstab
    if distance <= 1.5:
        if 'backstab' in abilities:
            success, message = _try_use_ability(
                enemy, player, dungeon, entity_manager, 'backstab'
            )
            if success:
                return None, 'backstab', message

    # If visible and player is aware, try to vanish
    if not is_invisible and distance <= 6:
        if 'vanish' in abilities:
            success, message = _try_use_ability(
                enemy, player, dungeon, entity_manager, 'vanish'
            )
            if success:
                return None, 'vanish', message

    # Move toward player (invisible enemies move faster conceptually)
    move = enemy.get_move_toward_player(player.x, player.y, dungeon.is_walkable)
    return move, None, None


def _elemental_behavior(
    enemy: 'Enemy',
    player: 'Player',
    dungeon: 'Dungeon',
    entity_manager: 'EntityManager',
) -> Tuple[Optional[Tuple[int, int]], Optional[str], Optional[str]]:
    """
    Elemental behavior:
    - Prioritize abilities matching current element
    - Cycle through elements every few turns
    - Maintain optimal range for ranged attacks
    """
    from ..core.constants import ElementType

    distance = enemy.distance_to(player.x, player.y)
    abilities = _get_abilities(enemy)
    current_element = getattr(enemy, 'current_element', ElementType.NONE)

    # Map elements to their preferred abilities
    element_abilities = {
        ElementType.FIRE: ['fire_bolt', 'fire_strike', 'fire_breath', 'lava_pool', 'inferno'],
        ElementType.ICE: ['ice_shard', 'ice_blast', 'freeze_ground'],
        ElementType.LIGHTNING: ['chain_lightning', 'lightning_bolt', 'thunder_strike'],
        ElementType.DARK: ['dark_bolt', 'shadow_strike', 'drain_life'],
    }

    # Get abilities that match current element (preferred)
    preferred_abilities = element_abilities.get(current_element, [])
    matching_abilities = [a for a in abilities if a in preferred_abilities]
    other_abilities = [a for a in abilities if a not in preferred_abilities]

    # Try matching element abilities first (prioritized)
    for ability_name in matching_abilities:
        success, message = _try_use_ability(
            enemy, player, dungeon, entity_manager, ability_name
        )
        if success:
            return None, ability_name, message

    # Fall back to other abilities if element abilities on cooldown
    for ability_name in other_abilities:
        success, message = _try_use_ability(
            enemy, player, dungeon, entity_manager, ability_name
        )
        if success:
            return None, ability_name, message

    # Maintain range - move away if too close
    if distance < 2:
        move = _get_move_away_from(enemy, player, dungeon)
        if move != (0, 0):
            return move, None, None

    # Move closer if too far
    if distance > 5:
        move = enemy.get_move_toward_player(player.x, player.y, dungeon.is_walkable)
        return move, None, None

    # At good range, just wait
    return (0, 0), None, None


def _get_move_away_from(
    enemy: 'Enemy',
    player: 'Player',
    dungeon: 'Dungeon',
) -> Tuple[int, int]:
    """Calculate a move away from the player."""
    dx = 0
    dy = 0

    if player.x > enemy.x:
        dx = -1
    elif player.x < enemy.x:
        dx = 1

    if player.y > enemy.y:
        dy = -1
    elif player.y < enemy.y:
        dy = 1

    # Try diagonal first
    if dx != 0 and dy != 0:
        if dungeon.is_walkable(enemy.x + dx, enemy.y + dy):
            return (dx, dy)

    # Try horizontal
    if dx != 0 and dungeon.is_walkable(enemy.x + dx, enemy.y):
        return (dx, 0)

    # Try vertical
    if dy != 0 and dungeon.is_walkable(enemy.x, enemy.y + dy):
        return (0, dy)

    return (0, 0)


def tick_enemy_cooldowns(enemy: 'Enemy'):
    """Reduce all ability cooldowns by 1."""
    for ability_name in list(enemy.ability_cooldowns.keys()):
        if enemy.ability_cooldowns[ability_name] > 0:
            enemy.ability_cooldowns[ability_name] -= 1
