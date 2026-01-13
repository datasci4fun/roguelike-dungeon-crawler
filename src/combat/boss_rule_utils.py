"""Utility functions for boss heuristic rules.

Contains helper functions used by boss decision rules.
"""
from dataclasses import dataclass
from typing import Callable, List, Tuple, TYPE_CHECKING

from .battle_types import BattleState, BattleEntity
from .battle_actions import BattleAction, manhattan_distance
from .ai_scoring import HAZARD_COST

if TYPE_CHECKING:
    pass


# =============================================================================
# Rule System Types
# =============================================================================

@dataclass
class BossRule:
    """A single boss decision rule."""
    name: str
    predicate: Callable[[BattleState, BattleEntity], bool]
    action: Callable[[BattleState, BattleEntity], BattleAction]
    priority: int = 0  # Lower = higher priority (checked first)


# =============================================================================
# State Check Helpers
# =============================================================================

def is_ability_ready(boss: BattleEntity, action: BattleAction) -> bool:
    """Check if a boss ability is off cooldown."""
    cooldown = boss.cooldowns.get(action.name, 0)
    return cooldown <= 0


def count_minions(battle: BattleState, boss: BattleEntity, minion_types: List[str] = None) -> int:
    """Count living minions (non-boss enemies)."""
    count = 0
    for enemy in battle.enemies:
        if enemy.hp > 0 and enemy.entity_id != boss.entity_id:
            count += 1
    return count


def is_player_poisoned(battle: BattleState) -> bool:
    """Check if player has poison status effect."""
    player = battle.player
    if player is None:
        return False
    return player.has_status('poison')


def is_player_adjacent(battle: BattleState, boss: BattleEntity) -> bool:
    """Check if player is adjacent to boss."""
    player = battle.player
    if player is None:
        return False
    dist = manhattan_distance(boss.arena_x, boss.arena_y, player.arena_x, player.arena_y)
    return dist == 1


def is_player_in_range(battle: BattleState, boss: BattleEntity, min_range: int, max_range: int) -> bool:
    """Check if player is within range band."""
    player = battle.player
    if player is None:
        return False
    dist = manhattan_distance(boss.arena_x, boss.arena_y, player.arena_x, player.arena_y)
    return min_range <= dist <= max_range


# =============================================================================
# Tile Finding Helpers
# =============================================================================

def find_safest_tile(battle: BattleState, boss: BattleEntity) -> Tuple[int, int]:
    """Find the safest tile farthest from player, avoiding hazards."""
    player = battle.player
    if player is None:
        return (boss.arena_x, boss.arena_y)

    best_tile = (boss.arena_x, boss.arena_y)
    best_score = -float('inf')

    for y in range(battle.arena_height):
        for x in range(battle.arena_width):
            # Must be walkable and unoccupied
            if not battle.is_tile_walkable(x, y):
                continue
            if battle.get_entity_at(x, y) is not None:
                continue

            # Score: distance from player - hazard cost
            dist = manhattan_distance(x, y, player.arena_x, player.arena_y)
            hazard = battle.arena_tiles[y][x]
            hazard_cost = HAZARD_COST.get(hazard, 0)

            score = dist * 10 - hazard_cost

            if score > best_score:
                best_score = score
                best_tile = (x, y)

    return best_tile


def find_optimal_teleport_tile(battle: BattleState, boss: BattleEntity, preferred_dist: int = 4) -> Tuple[int, int]:
    """Find optimal teleport destination for ranged boss."""
    player = battle.player
    if player is None:
        return (boss.arena_x, boss.arena_y)

    best_tile = (boss.arena_x, boss.arena_y)
    best_score = -float('inf')

    for y in range(battle.arena_height):
        for x in range(battle.arena_width):
            # Must be walkable and unoccupied
            if not battle.is_tile_walkable(x, y):
                continue
            if battle.get_entity_at(x, y) is not None:
                continue

            # Score: prefer tiles near preferred distance, avoid hazards
            dist = manhattan_distance(x, y, player.arena_x, player.arena_y)
            dist_penalty = abs(dist - preferred_dist) * 5
            hazard = battle.arena_tiles[y][x]
            hazard_cost = HAZARD_COST.get(hazard, 0)

            score = 100 - dist_penalty - hazard_cost

            if score > best_score:
                best_score = score
                best_tile = (x, y)

    return best_tile
