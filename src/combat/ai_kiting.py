"""AI Kiting Module for v6.2.1 tactical combat.

Specialized scoring for ranged enemies that:
- Maintain preferred range band (3-5, target 4)
- Avoid adjacency unless killshot
- Choose reposition over standing still
- Avoid backing into hazards/corners/edges

Integrates with ai_scoring.py for RANGED_KITE and ELEMENTAL AI types.
"""
from typing import List, Tuple, Optional, TYPE_CHECKING

from .battle_types import BattleState, BattleEntity
from .battle_actions import manhattan_distance
from .ai_scoring import (
    is_tile_hazard, HAZARD_COST, CandidateAction, CandidateType
)
from ..core.constants import AIBehavior

if TYPE_CHECKING:
    pass


# =============================================================================
# Kiting Constants (v6.2.1)
# =============================================================================

# Range band preferences
PREFERRED_RANGE_MIN = 3
PREFERRED_RANGE_MAX = 5
PREFERRED_RANGE_TARGET = 4

# Distance band shaping bonuses
W_IN_RANGE_BAND = 10       # Bonus for dist in [3,5]
W_SWEET_SPOT = 6           # Extra bonus for dist == 4
W_TOO_FAR_PENALTY = 8      # Penalty for dist >= 6
W_TOO_CLOSE_PENALTY_KITE = 20  # Penalty for dist <= 2 (not killshot)
W_ADJACENT_NO_KILL = 60    # Decisive penalty for dist == 1 without killshot

# Break melee lock bonus
W_BREAK_MELEE_LOCK = 20    # Bonus for escaping adjacency to dist >= 3

# Danger zone avoidance
W_ENTRY_EDGE_PENALTY = 12  # Penalty for reinforcement entry edges
W_CORNER_PENALTY = 8       # Penalty for corners when player is close

# Retreat lane (self-preservation)
W_NO_RETREAT_LANE = 18     # Penalty if actor has <= 1 safe escape
W_GOOD_RETREAT_LANE = 6    # Bonus if actor has >= 3 safe escapes


# =============================================================================
# Helper Functions
# =============================================================================

def is_reinforcement_edge(battle: BattleState, x: int, y: int) -> bool:
    """
    Check if a tile is on a reinforcement entry edge.

    Reinforcements typically enter from the edges of the arena.
    Edge tiles are x==1 or x==arena_width-2 or y==1 or y==arena_height-2.
    (Not walls at 0 or max, but the walkable tiles just inside)
    """
    # Check if on inner edge (one tile from wall)
    if x == 1 or x == battle.arena_width - 2:
        return True
    if y == 1 or y == battle.arena_height - 2:
        return True
    return False


def is_corner_tile(battle: BattleState, x: int, y: int) -> bool:
    """
    Check if a tile is in a corner of the arena.

    Corners are the 4 tiles at the inner corners of the arena.
    """
    # Inner corner positions (one tile from walls)
    corners = [
        (1, 1),
        (1, battle.arena_height - 2),
        (battle.arena_width - 2, 1),
        (battle.arena_width - 2, battle.arena_height - 2),
    ]
    return (x, y) in corners


def actor_safe_escape_count(
    battle: BattleState,
    actor_pos: Tuple[int, int],
    player: BattleEntity
) -> int:
    """
    Count safe escape options for the ranged actor.

    Safe escape = tile that is:
    - Walkable and in bounds
    - Not a hazard
    - Not adjacent to player (avoid melee range)
    - Not occupied by another entity

    Args:
        battle: Current battle state
        actor_pos: Actor's current/ending position
        player: Player entity

    Returns:
        Number of safe escape tiles for actor
    """
    ax, ay = actor_pos
    safe_count = 0

    # Check all adjacent tiles (actor's movement options)
    directions = [(0, -1), (1, 0), (0, 1), (-1, 0)]

    for dx, dy in directions:
        nx, ny = ax + dx, ay + dy

        # Check bounds
        if nx < 0 or nx >= battle.arena_width or ny < 0 or ny >= battle.arena_height:
            continue

        # Check walkable
        tile = battle.arena_tiles[ny][nx]
        if tile == '#':
            continue

        # Check not a hazard
        if tile in HAZARD_COST:
            continue

        # Check not occupied by another enemy
        occupied = False
        for enemy in battle.enemies:
            if enemy.hp > 0 and enemy.arena_x == nx and enemy.arena_y == ny:
                occupied = True
                break
        if occupied:
            continue

        # Check not adjacent to player (want to maintain range)
        dist_to_player = manhattan_distance(nx, ny, player.arena_x, player.arena_y)
        if dist_to_player <= 1:
            continue  # Adjacent to player = not a safe escape for ranged

        safe_count += 1

    return safe_count


# =============================================================================
# Main Kiting Scoring Functions
# =============================================================================

def kite_distance_bonus(
    dist_to_player: int,
    is_killshot: bool = False
) -> float:
    """
    Calculate distance-based kiting bonus.

    Preferred range is 3-5, sweet spot is 4.
    Heavy penalties for being too close without killshot.

    Args:
        dist_to_player: Manhattan distance to player
        is_killshot: Whether the action would kill the player

    Returns:
        Bonus/penalty for the distance
    """
    score = 0.0

    # A) Preferred distance band shaping
    if PREFERRED_RANGE_MIN <= dist_to_player <= PREFERRED_RANGE_MAX:
        score += W_IN_RANGE_BAND
        if dist_to_player == PREFERRED_RANGE_TARGET:
            score += W_SWEET_SPOT  # Extra for sweet spot
    elif dist_to_player >= 6:
        score -= W_TOO_FAR_PENALTY  # Too far = wasted
    elif dist_to_player <= 2 and not is_killshot:
        score -= W_TOO_CLOSE_PENALTY_KITE  # Too close = danger

    # B) Decisive penalty for adjacency without killshot
    if dist_to_player == 1 and not is_killshot:
        score -= W_ADJACENT_NO_KILL

    return score


def kite_break_melee_bonus(
    start_pos: Tuple[int, int],
    end_pos: Tuple[int, int],
    player: BattleEntity
) -> float:
    """
    Bonus for breaking melee lock (escaping adjacency).

    If actor starts adjacent to player and can move to dist >= 3,
    add a bonus to those MOVE actions.

    Args:
        start_pos: Actor's starting position
        end_pos: Actor's ending position after move
        player: Player entity

    Returns:
        Bonus for breaking melee lock
    """
    start_dist = manhattan_distance(start_pos[0], start_pos[1], player.arena_x, player.arena_y)
    end_dist = manhattan_distance(end_pos[0], end_pos[1], player.arena_x, player.arena_y)

    # Only applies if starting adjacent
    if start_dist == 1 and end_dist >= 3:
        return W_BREAK_MELEE_LOCK

    return 0.0


def kite_danger_zone_penalty(
    battle: BattleState,
    end_pos: Tuple[int, int],
    player: BattleEntity
) -> float:
    """
    Penalty for ending in dangerous zones (edges, corners).

    - Entry edge tiles where reinforcements spawn
    - Corner tiles when player is closing in

    Args:
        battle: Current battle state
        end_pos: Actor's ending position
        player: Player entity

    Returns:
        Penalty for dangerous positioning
    """
    penalty = 0.0
    ex, ey = end_pos

    # Penalty for reinforcement entry edges
    if is_reinforcement_edge(battle, ex, ey):
        penalty += W_ENTRY_EDGE_PENALTY

    # Penalty for corners when player is close
    dist_to_player = manhattan_distance(ex, ey, player.arena_x, player.arena_y)
    if is_corner_tile(battle, ex, ey) and dist_to_player <= 4:
        penalty += W_CORNER_PENALTY

    return penalty


def kite_retreat_lane_bonus(
    battle: BattleState,
    end_pos: Tuple[int, int],
    player: BattleEntity
) -> float:
    """
    Bonus/penalty based on actor's retreat options.

    Ranged units shouldn't corner themselves.

    Args:
        battle: Current battle state
        end_pos: Actor's ending position
        player: Player entity

    Returns:
        Bonus for good retreat lanes, penalty for being cornered
    """
    escape_count = actor_safe_escape_count(battle, end_pos, player)

    if escape_count <= 1:
        return -W_NO_RETREAT_LANE
    elif escape_count >= 3:
        return W_GOOD_RETREAT_LANE

    return 0.0


def calculate_kite_score(
    battle: BattleState,
    actor: BattleEntity,
    action: CandidateAction,
    player: BattleEntity
) -> float:
    """
    Calculate total kiting score adjustment for a ranged action.

    This should be called from score_action() for RANGED_KITE and ELEMENTAL
    AI types to add kiting-specific scoring on top of base scores.

    Args:
        battle: Current battle state
        actor: The ranged enemy taking action
        action: Candidate action being scored
        player: Player entity

    Returns:
        Total kiting score adjustment (positive = better)
    """
    if action.end_tile is None:
        return 0.0

    score = 0.0
    end_pos = action.end_tile
    start_pos = (actor.arena_x, actor.arena_y)

    # Distance to player after action
    dist_to_player = manhattan_distance(
        end_pos[0], end_pos[1],
        player.arena_x, player.arena_y
    )

    # Check if this is a killshot
    is_killshot = getattr(action, 'is_killshot', False)

    # A) Distance band shaping
    score += kite_distance_bonus(dist_to_player, is_killshot)

    # B) Break melee lock bonus (only for MOVE actions)
    if action.action_type == CandidateType.MOVE:
        score += kite_break_melee_bonus(start_pos, end_pos, player)

    # C) Danger zone avoidance
    score -= kite_danger_zone_penalty(battle, end_pos, player)

    # D) Retreat lane preservation
    score += kite_retreat_lane_bonus(battle, end_pos, player)

    return score


# =============================================================================
# Integration Check
# =============================================================================

def should_apply_kiting(ai_type: AIBehavior) -> bool:
    """Check if kiting scoring should be applied for this AI type."""
    return ai_type in {AIBehavior.RANGED_KITE, AIBehavior.ELEMENTAL}
