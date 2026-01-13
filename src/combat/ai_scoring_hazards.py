"""Hazard intelligence for AI scoring.

Contains pathfinding through hazards, hazard cost calculations,
and player escape analysis for tactical positioning.
"""
import heapq
from typing import Tuple, TYPE_CHECKING

from .battle_types import BattleState, BattleEntity
from .battle_actions import manhattan_distance
from ..core.constants import AIBehavior

if TYPE_CHECKING:
    pass


# =============================================================================
# Hazard Cost Constants
# =============================================================================

# Hazard tile costs (higher = more avoidance)
HAZARD_COST = {
    '~': 120,    # Lava - basically never step unless winning
    '!': 55,     # Poison gas
    '\u2248': 30,  # Deep water (≈)
    '=': 18,     # Ice (slide deferred, mild penalty)
}

# Hazard intelligence weights
PATH_HAZARD_WEIGHT = 1.0    # Multiplier for path hazard cost
W_EXIT_HAZARD = 15          # Bonus for moving off a hazard tile
W_STAY_HAZARD = 40          # Penalty for staying on a hazard tile

# Hazard pressure weights (cornering player)
PRESSURE_WEIGHT = 4         # Per safe escape reduced
SAFE_ESCAPE_BASE = 6        # "Normal" number of safe escapes


# =============================================================================
# Hazard Tile Utilities
# =============================================================================

def get_tile_hazard(battle: BattleState, x: int, y: int) -> str:
    """Get hazard type at tile, or empty string if none."""
    if y < 0 or y >= battle.arena_height or x < 0 or x >= battle.arena_width:
        return ''
    tile = battle.arena_tiles[y][x]
    return tile if tile in HAZARD_COST else ''


def get_hazard_cost(tile: str) -> float:
    """Get hazard cost for a tile type."""
    return HAZARD_COST.get(tile, 0.0)


def is_tile_hazard(battle: BattleState, x: int, y: int) -> bool:
    """Check if a tile is a hazard."""
    if y < 0 or y >= battle.arena_height or x < 0 or x >= battle.arena_width:
        return False
    tile = battle.arena_tiles[y][x]
    return tile in HAZARD_COST


# =============================================================================
# Hazard Pathfinding
# =============================================================================

def min_cost_path_hazard(
    battle: BattleState,
    start: Tuple[int, int],
    goal: Tuple[int, int],
    pulse_mult: float = 1.0
) -> float:
    """
    Calculate minimum hazard cost to path from start to goal.

    Uses BFS/Dijkstra with hazard tile costs. Arena is small (≤11×11)
    so this is cheap to compute.

    Args:
        battle: Current battle state
        start: Starting (x, y) position
        goal: Target (x, y) position
        pulse_mult: Field pulse multiplier for hazard damage

    Returns:
        Total hazard cost along minimum-cost path, or 0 if no path.
        Returns float('inf') if goal is unreachable.
    """
    if start == goal:
        return 0.0

    # Priority queue: (cost, x, y)
    # Use (cost, y, x) for deterministic tie-break
    pq = [(0.0, start[1], start[0])]
    visited = set()

    # Neighbor expansion order: N, E, S, W (deterministic)
    directions = [(0, -1), (1, 0), (0, 1), (-1, 0)]

    while pq:
        cost, y, x = heapq.heappop(pq)

        if (x, y) == goal:
            return cost

        if (x, y) in visited:
            continue
        visited.add((x, y))

        for dx, dy in directions:
            nx, ny = x + dx, y + dy

            # Check bounds
            if nx < 0 or nx >= battle.arena_width or ny < 0 or ny >= battle.arena_height:
                continue

            # Check walkable (allow hazards, they just cost more)
            tile = battle.arena_tiles[ny][nx]
            if tile == '#':
                continue

            if (nx, ny) in visited:
                continue

            # Calculate step cost
            step_cost = 0.0
            if tile in HAZARD_COST:
                step_cost = HAZARD_COST[tile] * pulse_mult

            heapq.heappush(pq, (cost + step_cost, ny, nx))

    # No path found
    return float('inf')


# =============================================================================
# Player Escape Analysis
# =============================================================================

def player_safe_escape_count(
    battle: BattleState,
    enemy_end_pos: Tuple[int, int],
    ai_type: AIBehavior
) -> int:
    """
    Count player's safe escape options after enemy moves.

    Safe escape = tile that is:
    - Walkable and in bounds
    - Not a hazard
    - Not adjacent to enemy_end_pos (for melee threat)
    - Not occupied by another entity

    Args:
        battle: Current battle state
        enemy_end_pos: Where the enemy will be after moving
        ai_type: AI behavior type (melee vs ranged)

    Returns:
        Number of safe escape tiles for player
    """
    player = battle.player
    if player is None:
        return 0

    px, py = player.arena_x, player.arena_y
    safe_count = 0

    # Check all adjacent tiles (player's movement options)
    directions = [(0, -1), (1, 0), (0, 1), (-1, 0)]

    for dx, dy in directions:
        nx, ny = px + dx, py + dy

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

        # Check not occupied by enemy
        occupied = False
        for enemy in battle.enemies:
            if enemy.hp > 0 and enemy.arena_x == nx and enemy.arena_y == ny:
                occupied = True
                break
        if occupied:
            continue

        # Check not adjacent to enemy (melee threat)
        # Only apply melee adjacency check for melee AI types
        if ai_type in {AIBehavior.CHASE, AIBehavior.AGGRESSIVE, AIBehavior.STEALTH}:
            dist_to_enemy = manhattan_distance(nx, ny, enemy_end_pos[0], enemy_end_pos[1])
            if dist_to_enemy <= 1:
                continue  # Adjacent to enemy = not safe

        safe_count += 1

    return safe_count


# =============================================================================
# Hazard Scoring Components
# =============================================================================

def score_hazard_at_tile(tile: str) -> float:
    """Get the penalty score for standing on a hazard tile."""
    return get_hazard_cost(tile)


def score_path_hazard(
    battle: BattleState,
    start_pos: Tuple[int, int],
    end_pos: Tuple[int, int]
) -> float:
    """Calculate path hazard penalty score."""
    path_cost = min_cost_path_hazard(battle, start_pos, end_pos)
    if path_cost < float('inf'):
        return PATH_HAZARD_WEIGHT * path_cost
    return 0.0


def score_hazard_exit(
    battle: BattleState,
    actor_x: int,
    actor_y: int,
    end_x: int,
    end_y: int
) -> float:
    """Calculate bonus for exiting a hazard tile."""
    current_on_hazard = is_tile_hazard(battle, actor_x, actor_y)
    if current_on_hazard:
        end_on_hazard = is_tile_hazard(battle, end_x, end_y)
        if not end_on_hazard:
            return W_EXIT_HAZARD
    return 0.0


def score_hazard_stay_penalty() -> float:
    """Get penalty for waiting on a hazard."""
    return W_STAY_HAZARD


def score_hazard_pressure(
    battle: BattleState,
    end_pos: Tuple[int, int],
    ai_type: AIBehavior
) -> float:
    """Calculate bonus for cornering player toward hazards."""
    # Only for melee AI types
    if ai_type not in {AIBehavior.CHASE, AIBehavior.AGGRESSIVE, AIBehavior.STEALTH}:
        return 0.0

    safe_escapes = player_safe_escape_count(battle, end_pos, ai_type)
    # Reward reducing player's options (fewer safe escapes = better)
    return PRESSURE_WEIGHT * (SAFE_ESCAPE_BASE - safe_escapes)
