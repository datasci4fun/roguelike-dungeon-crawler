"""AI Scoring System for v6.2 tactical combat.

Deterministic action selection for enemy AI:
- enumerate_candidate_actions(): list all legal actions
- score_action(): calculate numeric score for an action
- choose_action(): pick best action with deterministic tie-break

No randomness allowed - same inputs must produce same outputs.
"""
from dataclasses import dataclass
from enum import Enum, auto
from typing import List, Optional, Tuple, TYPE_CHECKING

from .battle_types import BattleState, BattleEntity
from .battle_actions import (
    BattleAction, manhattan_distance, get_valid_move_tiles,
    BATTLE_MOVE_RANGE
)
from ..core.constants import AIBehavior

if TYPE_CHECKING:
    pass

# v6.2.1: Import kiting module (deferred to avoid circular import)
# Will be imported at function call time
_kiting_module = None

def _get_kiting_module():
    """Lazy import of kiting module to avoid circular imports."""
    global _kiting_module
    if _kiting_module is None:
        from . import ai_kiting
        _kiting_module = ai_kiting
    return _kiting_module


# =============================================================================
# Scoring Constants (v6.2)
# =============================================================================

# Base action scores
ACTION_BASE = {
    BattleAction.MOVE: 0,
    BattleAction.BASIC_ATTACK: 10,
    BattleAction.WAIT: -5,
    # Abilities typically beat basic attack when useful
    BattleAction.POWER_STRIKE: 14,
    BattleAction.SHIELD_WALL: 6,
    BattleAction.FIREBALL: 12,
    BattleAction.FROST_NOVA: 12,
    BattleAction.BACKSTAB: 16,
    BattleAction.SMOKE_BOMB: 4,
    BattleAction.HEAL: 14,
    BattleAction.SMITE: 12,
}

# Damage weights
W_DMG = 2.5          # Per HP of expected damage
W_KILL = 80          # Huge priority for kill shots
W_OVERKILL = 0.8     # Penalty for wasting big hits

# Status effect values
W_STATUS = {
    'stun': 25,
    'freeze': 14,
    'poison': 10,
    'burn': 10,
}

# Hazard tile costs (higher = more avoidance)
HAZARD_COST = {
    '~': 120,    # Lava - basically never step unless winning
    '!': 55,     # Poison gas
    '\u2248': 30,  # Deep water (≈)
    '=': 18,     # Ice (slide deferred, mild penalty)
}

# Positioning weights
W_ADJACENCY_MELEE = 18      # Bonus for melee being adjacent
W_CLOSING_PRESSURE = 6      # Per tile away from preferred distance
W_RANGED_DESIRED = 4        # Preferred distance for ranged
W_TOO_CLOSE_PENALTY = 35    # Ranged units adjacent to player

# Self-preservation
W_LOW_HP_SURVIVAL = 25      # Penalty when hp<30% adjacent non-killshot

# Maximum move tiles to consider (for performance)
MAX_MOVE_CANDIDATES = 12

# v6.2 Slice 2: Hazard Intelligence weights
PATH_HAZARD_WEIGHT = 1.0    # Multiplier for path hazard cost
W_EXIT_HAZARD = 15          # Bonus for moving off a hazard tile
W_STAY_HAZARD = 40          # Penalty for staying on a hazard tile

# Hazard pressure weights (cornering player)
PRESSURE_WEIGHT = 4         # Per safe escape reduced
SAFE_ESCAPE_BASE = 6        # "Normal" number of safe escapes


# =============================================================================
# Candidate Action Types
# =============================================================================

class CandidateType(Enum):
    """Type of candidate action."""
    ATTACK = auto()       # Basic attack
    ABILITY = auto()      # Use ability
    MOVE = auto()         # Move to tile
    WAIT = auto()         # Skip turn


@dataclass
class CandidateAction:
    """A candidate action for scoring."""
    action_type: CandidateType
    battle_action: Optional[BattleAction] = None  # For ATTACK/ABILITY
    target_pos: Optional[Tuple[int, int]] = None  # For MOVE or targeted abilities
    target_entity: Optional[BattleEntity] = None  # For attacks

    # Computed values (filled by scoring)
    expected_damage: int = 0
    is_killshot: bool = False
    status_applied: Optional[str] = None
    end_tile: Optional[Tuple[int, int]] = None  # Where actor ends up

    def __repr__(self) -> str:
        if self.action_type == CandidateType.MOVE:
            return f"MOVE({self.target_pos})"
        elif self.action_type == CandidateType.WAIT:
            return "WAIT"
        elif self.action_type == CandidateType.ATTACK:
            return f"ATTACK"
        else:
            return f"ABILITY({self.battle_action})"


# =============================================================================
# Action Enumeration
# =============================================================================

def enumerate_candidate_actions(
    battle: BattleState,
    actor: BattleEntity,
    ai_type: AIBehavior = AIBehavior.CHASE
) -> List[CandidateAction]:
    """
    Enumerate all legal candidate actions for an actor.

    Returns actions in deterministic order:
    1. Basic attack (if legal)
    2. Each ability off cooldown (if legal)
    3. Top N reachable tiles sorted by (y, x)
    4. WAIT (always legal)

    Args:
        battle: Current battle state
        actor: The entity taking action
        ai_type: AI behavior type for context

    Returns:
        List of CandidateAction in stable order
    """
    candidates: List[CandidateAction] = []
    player = battle.player

    if player is None or player.hp <= 0:
        # No player target - just wait
        candidates.append(CandidateAction(action_type=CandidateType.WAIT))
        return candidates

    # 1. Basic attack (if adjacent to player)
    dist_to_player = manhattan_distance(
        actor.arena_x, actor.arena_y,
        player.arena_x, player.arena_y
    )

    if dist_to_player == 1:
        candidates.append(CandidateAction(
            action_type=CandidateType.ATTACK,
            battle_action=BattleAction.BASIC_ATTACK,
            target_entity=player,
            end_tile=(actor.arena_x, actor.arena_y),
        ))

    # 2. Abilities (enemies don't have abilities in v6.0 - future expansion)
    # For now, skip ability enumeration for enemies

    # 3. Move tiles - sorted by relevance then (y, x) for determinism
    move_tiles = get_valid_move_tiles(actor, battle, max_range=BATTLE_MOVE_RANGE)

    # Sort by distance to player (melee wants closer, ranged wants ~4)
    # Tie-break with (y, x) for determinism
    if ai_type in {AIBehavior.RANGED_KITE, AIBehavior.ELEMENTAL}:
        # Ranged: prefer tiles near distance 4
        preferred_dist = 4
        move_tiles.sort(key=lambda t: (
            abs(manhattan_distance(t[0], t[1], player.arena_x, player.arena_y) - preferred_dist),
            t[1], t[0]
        ))
    else:
        # Melee: prefer tiles closer to player
        move_tiles.sort(key=lambda t: (
            manhattan_distance(t[0], t[1], player.arena_x, player.arena_y),
            t[1], t[0]
        ))

    # Take top N candidates
    for tile in move_tiles[:MAX_MOVE_CANDIDATES]:
        candidates.append(CandidateAction(
            action_type=CandidateType.MOVE,
            target_pos=tile,
            end_tile=tile,
        ))

    # 4. WAIT always available
    candidates.append(CandidateAction(
        action_type=CandidateType.WAIT,
        end_tile=(actor.arena_x, actor.arena_y),
    ))

    return candidates


# =============================================================================
# Action Scoring
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


# =============================================================================
# v6.2 Slice 2: Hazard Intelligence
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
    import heapq

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


def is_tile_hazard(battle: BattleState, x: int, y: int) -> bool:
    """Check if a tile is a hazard."""
    if y < 0 or y >= battle.arena_height or x < 0 or x >= battle.arena_width:
        return False
    tile = battle.arena_tiles[y][x]
    return tile in HAZARD_COST


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


def calculate_expected_damage(
    attacker: BattleEntity,
    target: BattleEntity,
    damage_mult: float = 1.0
) -> int:
    """Calculate expected damage for an attack."""
    base_damage = attacker.attack
    defense = target.defense
    damage = max(1, int(base_damage * damage_mult) - defense)
    return damage


def position_score(
    tile: Tuple[int, int],
    actor: BattleEntity,
    player: BattleEntity,
    ai_type: AIBehavior
) -> float:
    """
    Calculate positioning score for a tile.

    Melee AI wants to be adjacent (dist 1).
    Ranged AI wants to maintain distance (dist 3-5, preferred 4).
    """
    dist = manhattan_distance(tile[0], tile[1], player.arena_x, player.arena_y)

    # Melee behaviors: CHASE, AGGRESSIVE, STEALTH
    if ai_type in {AIBehavior.CHASE, AIBehavior.AGGRESSIVE, AIBehavior.STEALTH}:
        # Reward adjacency
        adjacency_bonus = W_ADJACENCY_MELEE if dist == 1 else 0
        # Penalty for being far
        closing_penalty = W_CLOSING_PRESSURE * max(0, dist - 1)
        return adjacency_bonus - closing_penalty

    # Ranged behaviors: RANGED_KITE, ELEMENTAL
    if ai_type in {AIBehavior.RANGED_KITE, AIBehavior.ELEMENTAL}:
        desired_dist = 4
        # Penalty for being too close
        too_close_penalty = W_TOO_CLOSE_PENALTY if dist <= 1 else 0
        # Penalty for being off ideal range
        range_penalty = W_RANGED_DESIRED * abs(dist - desired_dist)
        return -range_penalty - too_close_penalty

    # Default: slight preference for closing
    return -2 * max(0, dist - 2)


def score_action(
    battle: BattleState,
    actor: BattleEntity,
    action: CandidateAction,
    ai_type: AIBehavior = AIBehavior.CHASE
) -> float:
    """
    Calculate deterministic score for an action.

    Higher score = better action. No randomness.

    Args:
        battle: Current battle state
        actor: The entity taking action
        action: Candidate action to score
        ai_type: AI behavior type

    Returns:
        Numeric score (float)
    """
    player = battle.player
    if player is None:
        return -1000.0

    score = 0.0

    # Base score from action type
    if action.battle_action:
        score += ACTION_BASE.get(action.battle_action, 0)
    elif action.action_type == CandidateType.WAIT:
        score += ACTION_BASE.get(BattleAction.WAIT, -5)
    elif action.action_type == CandidateType.MOVE:
        score += ACTION_BASE.get(BattleAction.MOVE, 0)

    # Damage / kill value (if action hits something)
    if action.action_type == CandidateType.ATTACK and action.target_entity:
        target = action.target_entity
        expected_damage = calculate_expected_damage(actor, target, 1.0)
        action.expected_damage = expected_damage

        # Check for killshot
        is_killshot = expected_damage >= target.hp
        action.is_killshot = is_killshot

        score += W_DMG * expected_damage

        if is_killshot:
            score += W_KILL
        else:
            # Overkill penalty (if damage > target HP, we're "wasting" damage)
            overkill = max(0, expected_damage - target.hp)
            score -= W_OVERKILL * overkill

    # Positioning value (where actor ends up)
    if action.end_tile:
        score += position_score(action.end_tile, actor, player, ai_type)

    # Hazard cost at end tile (destination penalty)
    if action.end_tile:
        hazard = get_tile_hazard(battle, action.end_tile[0], action.end_tile[1])
        if hazard:
            score -= get_hazard_cost(hazard)

    # v6.2 Slice 2: Path hazard cost (penalize pathing through hazards)
    if action.action_type == CandidateType.MOVE and action.end_tile:
        start_pos = (actor.arena_x, actor.arena_y)
        path_cost = min_cost_path_hazard(battle, start_pos, action.end_tile)
        if path_cost < float('inf'):
            score -= PATH_HAZARD_WEIGHT * path_cost

    # v6.2 Slice 2: Standing-in-hazard urgency
    current_on_hazard = is_tile_hazard(battle, actor.arena_x, actor.arena_y)
    if current_on_hazard:
        if action.action_type == CandidateType.MOVE and action.end_tile:
            # Bonus for leaving hazard
            end_on_hazard = is_tile_hazard(battle, action.end_tile[0], action.end_tile[1])
            if not end_on_hazard:
                score += W_EXIT_HAZARD
        elif action.action_type == CandidateType.WAIT:
            # Penalty for staying on hazard
            score -= W_STAY_HAZARD

    # v6.2 Slice 2: Hazard pressure (corner player toward hazards)
    # Only for melee AI types - prefer positions that reduce player's safe escapes
    if ai_type in {AIBehavior.CHASE, AIBehavior.AGGRESSIVE, AIBehavior.STEALTH}:
        if action.end_tile:
            safe_escapes = player_safe_escape_count(battle, action.end_tile, ai_type)
            # Reward reducing player's options (fewer safe escapes = better)
            pressure_bonus = PRESSURE_WEIGHT * (SAFE_ESCAPE_BASE - safe_escapes)
            score += pressure_bonus

    # Low HP self-preservation
    # If hp<30% and moving/staying adjacent without killing, add penalty
    hp_ratio = actor.hp / actor.max_hp if actor.max_hp > 0 else 1.0
    if hp_ratio < 0.3 and action.end_tile:
        dist_after = manhattan_distance(
            action.end_tile[0], action.end_tile[1],
            player.arena_x, player.arena_y
        )
        # Adjacent and not a killshot
        if dist_after == 1 and not getattr(action, 'is_killshot', False):
            score -= W_LOW_HP_SURVIVAL

    # v6.2.1: Kiting heuristics for ranged AI types
    if ai_type in {AIBehavior.RANGED_KITE, AIBehavior.ELEMENTAL}:
        kiting = _get_kiting_module()
        kite_score = kiting.calculate_kite_score(battle, actor, action, player)
        score += kite_score

    return score


# =============================================================================
# Action Selection with Tie-break
# =============================================================================

def action_tie_break_key(action: CandidateAction) -> Tuple:
    """
    Generate deterministic tie-break key for an action.

    Priority (lower = better):
    1. Non-WAIT beats WAIT
    2. Killshot beats non-killshot
    3. Lower hazard cost
    4. Better positioning (closer to preferred distance)
    5. Stable coords (y, x)
    """
    is_wait = 1 if action.action_type == CandidateType.WAIT else 0
    is_killshot = 0 if getattr(action, 'is_killshot', False) else 1

    # Hazard cost at end tile
    hazard_cost = 0.0
    if action.end_tile:
        hazard_cost = HAZARD_COST.get(action.end_tile, 0.0)

    # Coords for stable sort
    end_y = action.end_tile[1] if action.end_tile else 999
    end_x = action.end_tile[0] if action.end_tile else 999

    return (is_wait, is_killshot, hazard_cost, end_y, end_x)


def choose_action(
    battle: BattleState,
    actor: BattleEntity,
    ai_type: AIBehavior = AIBehavior.CHASE
) -> CandidateAction:
    """
    Choose best action for an enemy using deterministic scoring.

    1. Enumerate all candidate actions
    2. Score each action
    3. Pick max score with deterministic tie-break

    Args:
        battle: Current battle state
        actor: The enemy taking action
        ai_type: AI behavior type

    Returns:
        Best CandidateAction to take
    """
    candidates = enumerate_candidate_actions(battle, actor, ai_type)

    if not candidates:
        # Fallback: wait
        return CandidateAction(
            action_type=CandidateType.WAIT,
            end_tile=(actor.arena_x, actor.arena_y)
        )

    # Score all candidates
    scored: List[Tuple[float, CandidateAction]] = []
    for action in candidates:
        action_score = score_action(battle, actor, action, ai_type)
        scored.append((action_score, action))

    # Sort by score descending, then by tie-break key ascending
    scored.sort(key=lambda x: (-x[0], action_tie_break_key(x[1])))

    # Return best action
    return scored[0][1]


# =============================================================================
# Integration Helper
# =============================================================================

def get_enemy_ai_type(enemy_entity_id: str, engine) -> AIBehavior:
    """
    Get AI behavior type for an enemy from the game engine.

    Looks up the world entity by ID to get its ai_type.
    Falls back to CHASE if not found.
    """
    if not hasattr(engine, 'entity_manager'):
        return AIBehavior.CHASE

    for enemy in engine.entity_manager.enemies:
        if str(id(enemy)) == enemy_entity_id:
            return getattr(enemy, 'ai_type', AIBehavior.CHASE)

    return AIBehavior.CHASE


def execute_ai_action(
    battle: BattleState,
    actor: BattleEntity,
    action: CandidateAction
) -> Tuple[int, int]:
    """
    Execute the chosen AI action on the battle state.

    Returns the actor's new position (arena_x, arena_y).
    Damage/effects are handled by the caller (BattleManager).

    Args:
        battle: Current battle state
        actor: The enemy taking action
        action: The chosen action

    Returns:
        (new_x, new_y) position after action
    """
    if action.action_type == CandidateType.MOVE:
        # Move to target tile
        if action.target_pos:
            return action.target_pos
        return (actor.arena_x, actor.arena_y)

    elif action.action_type == CandidateType.ATTACK:
        # Attack doesn't change position
        return (actor.arena_x, actor.arena_y)

    elif action.action_type == CandidateType.WAIT:
        # Stay in place
        return (actor.arena_x, actor.arena_y)

    # Default: no movement
    return (actor.arena_x, actor.arena_y)


# =============================================================================
# Determinism Test Helper
# =============================================================================

def compute_action_hash(action: CandidateAction) -> str:
    """
    Compute a stable hash string for an action (for determinism testing).

    Returns a string like "MOVE(3,2)" or "ATTACK" or "WAIT".
    """
    if action.action_type == CandidateType.MOVE:
        return f"MOVE({action.target_pos[0]},{action.target_pos[1]})"
    elif action.action_type == CandidateType.ATTACK:
        return "ATTACK"
    elif action.action_type == CandidateType.WAIT:
        return "WAIT"
    elif action.action_type == CandidateType.ABILITY:
        return f"ABILITY({action.battle_action.name if action.battle_action else 'NONE'})"
    return "UNKNOWN"
