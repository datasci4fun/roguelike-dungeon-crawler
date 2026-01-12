"""Boss Heuristics for v6.2 tactical combat.

Implements boss-specific decision logic that sits above the general AI scoring.
Each boss has signature behaviors that make fights learnable and predictable.

Architecture:
- Priority rule lists per boss type
- Rules are pure functions (deterministic)
- Falls back to ai_scoring.choose_action() if no rule matches
"""
from dataclasses import dataclass
from typing import Optional, Callable, List, Tuple, TYPE_CHECKING

from .battle_types import BattleState, BattleEntity
from .battle_actions import (
    BattleAction, manhattan_distance,
    REGENT_ABILITIES, RAT_KING_ABILITIES, SPIDER_QUEEN_ABILITIES,
    FROST_GIANT_ABILITIES, ARCANE_KEEPER_ABILITIES, FLAME_LORD_ABILITIES,
    DRAGON_EMPEROR_ABILITIES
)
from .ai_scoring import (
    choose_action, CandidateAction, CandidateType,
    player_safe_escape_count, is_tile_hazard, HAZARD_COST
)
from ..core.constants import BossType, AIBehavior

if TYPE_CHECKING:
    pass


# =============================================================================
# Rule System
# =============================================================================

@dataclass
class BossRule:
    """A single boss decision rule."""
    name: str
    predicate: Callable[[BattleState, BattleEntity], bool]
    action: Callable[[BattleState, BattleEntity], BattleAction]
    priority: int = 0  # Lower = higher priority (checked first)


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


# =============================================================================
# Regent (LEGITIMACY) Rules
# =============================================================================

def regent_rule_royal_decree(battle: BattleState, boss: BattleEntity) -> bool:
    """Use Royal Decree if guards < 2 and ability ready."""
    if not is_ability_ready(boss, BattleAction.ROYAL_DECREE):
        return False
    guards = count_minions(battle, boss)
    return guards < 2


def regent_rule_counterfeit_crown(battle: BattleState, boss: BattleEntity) -> bool:
    """Use Counterfeit Crown if player has many safe escapes."""
    if not is_ability_ready(boss, BattleAction.COUNTERFEIT_CROWN):
        return False
    safe_escapes = player_safe_escape_count(battle, (boss.arena_x, boss.arena_y), AIBehavior.CHASE)
    return safe_escapes >= 4


def regent_rule_summon_guard(battle: BattleState, boss: BattleEntity) -> bool:
    """Use Summon Guard if no guards alive."""
    if not is_ability_ready(boss, BattleAction.SUMMON_GUARD):
        return False
    guards = count_minions(battle, boss)
    return guards == 0


REGENT_RULES: List[BossRule] = [
    BossRule(
        name="royal_decree",
        predicate=regent_rule_royal_decree,
        action=lambda b, e: BattleAction.ROYAL_DECREE,
        priority=0,
    ),
    BossRule(
        name="counterfeit_crown",
        predicate=regent_rule_counterfeit_crown,
        action=lambda b, e: BattleAction.COUNTERFEIT_CROWN,
        priority=1,
    ),
    BossRule(
        name="summon_guard",
        predicate=regent_rule_summon_guard,
        action=lambda b, e: BattleAction.SUMMON_GUARD,
        priority=2,
    ),
]


# =============================================================================
# Rat King (CIRCULATION) Rules
# =============================================================================

def rat_king_rule_summon_swarm(battle: BattleState, boss: BattleEntity) -> bool:
    """Summon swarm if rats < 2."""
    if not is_ability_ready(boss, BattleAction.SUMMON_SWARM):
        return False
    rats = count_minions(battle, boss)
    return rats < 2


def rat_king_rule_plague_bite(battle: BattleState, boss: BattleEntity) -> bool:
    """Use Plague Bite if adjacent and player not poisoned."""
    if not is_ability_ready(boss, BattleAction.PLAGUE_BITE):
        return False
    if not is_player_adjacent(battle, boss):
        return False
    return not is_player_poisoned(battle)


def rat_king_rule_burrow(battle: BattleState, boss: BattleEntity) -> bool:
    """Burrow to safety if low HP and adjacent threat."""
    if not is_ability_ready(boss, BattleAction.BURROW):
        return False
    hp_ratio = boss.hp / boss.max_hp if boss.max_hp > 0 else 1.0
    if hp_ratio >= 0.3:
        return False
    return is_player_adjacent(battle, boss)


RAT_KING_RULES: List[BossRule] = [
    BossRule(
        name="summon_swarm",
        predicate=rat_king_rule_summon_swarm,
        action=lambda b, e: BattleAction.SUMMON_SWARM,
        priority=0,
    ),
    BossRule(
        name="plague_bite",
        predicate=rat_king_rule_plague_bite,
        action=lambda b, e: BattleAction.PLAGUE_BITE,
        priority=1,
    ),
    BossRule(
        name="burrow",
        predicate=rat_king_rule_burrow,
        action=lambda b, e: BattleAction.BURROW,
        priority=2,
    ),
]


# =============================================================================
# Spider Queen (GROWTH) Rules
# =============================================================================

def spider_queen_rule_web_trap(battle: BattleState, boss: BattleEntity) -> bool:
    """Web Trap if player cornered (few safe escapes)."""
    if not is_ability_ready(boss, BattleAction.WEB_TRAP):
        return False
    safe_escapes = player_safe_escape_count(battle, (boss.arena_x, boss.arena_y), AIBehavior.CHASE)
    return safe_escapes <= 2


def spider_queen_rule_summon_spiders(battle: BattleState, boss: BattleEntity) -> bool:
    """Summon spiders if minions < 2."""
    if not is_ability_ready(boss, BattleAction.SUMMON_SPIDERS):
        return False
    spiders = count_minions(battle, boss)
    return spiders < 2


def spider_queen_rule_poison_bite(battle: BattleState, boss: BattleEntity) -> bool:
    """Poison Bite if adjacent and player not poisoned."""
    if not is_ability_ready(boss, BattleAction.POISON_BITE):
        return False
    if not is_player_adjacent(battle, boss):
        return False
    return not is_player_poisoned(battle)


SPIDER_QUEEN_RULES: List[BossRule] = [
    BossRule(
        name="web_trap",
        predicate=spider_queen_rule_web_trap,
        action=lambda b, e: BattleAction.WEB_TRAP,
        priority=0,
    ),
    BossRule(
        name="summon_spiders",
        predicate=spider_queen_rule_summon_spiders,
        action=lambda b, e: BattleAction.SUMMON_SPIDERS,
        priority=1,
    ),
    BossRule(
        name="poison_bite",
        predicate=spider_queen_rule_poison_bite,
        action=lambda b, e: BattleAction.POISON_BITE,
        priority=2,
    ),
]


# =============================================================================
# Frost Giant (STASIS) Rules
# =============================================================================

def frost_giant_rule_freeze_ground(battle: BattleState, boss: BattleEntity) -> bool:
    """Freeze Ground on round 1."""
    if not is_ability_ready(boss, BattleAction.FREEZE_GROUND):
        return False
    return battle.turn_number <= 1


def frost_giant_rule_ice_blast(battle: BattleState, boss: BattleEntity) -> bool:
    """Ice Blast if player in range 2-3."""
    if not is_ability_ready(boss, BattleAction.ICE_BLAST):
        return False
    return is_player_in_range(battle, boss, 2, 3)


FROST_GIANT_RULES: List[BossRule] = [
    BossRule(
        name="freeze_ground",
        predicate=frost_giant_rule_freeze_ground,
        action=lambda b, e: BattleAction.FREEZE_GROUND,
        priority=0,
    ),
    BossRule(
        name="ice_blast",
        predicate=frost_giant_rule_ice_blast,
        action=lambda b, e: BattleAction.ICE_BLAST,
        priority=1,
    ),
]


# =============================================================================
# Arcane Keeper (COGNITION) Rules
# =============================================================================

def arcane_keeper_rule_teleport(battle: BattleState, boss: BattleEntity) -> bool:
    """Teleport if adjacent to player or standing on hazard."""
    if not is_ability_ready(boss, BattleAction.TELEPORT):
        return False
    if is_player_adjacent(battle, boss):
        return True
    return is_tile_hazard(battle, boss.arena_x, boss.arena_y)


def arcane_keeper_rule_arcane_bolt(battle: BattleState, boss: BattleEntity) -> bool:
    """Arcane Bolt if in preferred range 3-5."""
    if not is_ability_ready(boss, BattleAction.ARCANE_BOLT):
        return False
    return is_player_in_range(battle, boss, 3, 5)


ARCANE_KEEPER_RULES: List[BossRule] = [
    BossRule(
        name="teleport",
        predicate=arcane_keeper_rule_teleport,
        action=lambda b, e: BattleAction.TELEPORT,
        priority=0,
    ),
    BossRule(
        name="arcane_bolt",
        predicate=arcane_keeper_rule_arcane_bolt,
        action=lambda b, e: BattleAction.ARCANE_BOLT,
        priority=1,
    ),
]


# =============================================================================
# Flame Lord (TRANSFORMATION) Rules
# =============================================================================

def flame_lord_rule_lava_pool(battle: BattleState, boss: BattleEntity) -> bool:
    """Lava Pool if player has many safe escapes (deny space)."""
    if not is_ability_ready(boss, BattleAction.LAVA_POOL):
        return False
    safe_escapes = player_safe_escape_count(battle, (boss.arena_x, boss.arena_y), AIBehavior.CHASE)
    return safe_escapes >= 4


def flame_lord_rule_inferno(battle: BattleState, boss: BattleEntity) -> bool:
    """Inferno if player adjacent."""
    if not is_ability_ready(boss, BattleAction.INFERNO):
        return False
    return is_player_adjacent(battle, boss)


def flame_lord_rule_fire_breath(battle: BattleState, boss: BattleEntity) -> bool:
    """Fire Breath if in range."""
    if not is_ability_ready(boss, BattleAction.FIRE_BREATH):
        return False
    return is_player_in_range(battle, boss, 1, 3)


FLAME_LORD_RULES: List[BossRule] = [
    BossRule(
        name="lava_pool",
        predicate=flame_lord_rule_lava_pool,
        action=lambda b, e: BattleAction.LAVA_POOL,
        priority=0,
    ),
    BossRule(
        name="inferno",
        predicate=flame_lord_rule_inferno,
        action=lambda b, e: BattleAction.INFERNO,
        priority=1,
    ),
    BossRule(
        name="fire_breath",
        predicate=flame_lord_rule_fire_breath,
        action=lambda b, e: BattleAction.FIRE_BREATH,
        priority=2,
    ),
]


# =============================================================================
# Dragon Emperor (INTEGRATION) Rules
# =============================================================================

def dragon_emperor_rule_dragon_fear(battle: BattleState, boss: BattleEntity) -> bool:
    """Dragon Fear on rounds 1-2."""
    if not is_ability_ready(boss, BattleAction.DRAGON_FEAR):
        return False
    return battle.turn_number <= 2


def dragon_emperor_rule_tail_sweep(battle: BattleState, boss: BattleEntity) -> bool:
    """Tail Sweep if player adjacent."""
    if not is_ability_ready(boss, BattleAction.TAIL_SWEEP):
        return False
    return is_player_adjacent(battle, boss)


def dragon_emperor_rule_fire_breath(battle: BattleState, boss: BattleEntity) -> bool:
    """Fire Breath if in range."""
    if not is_ability_ready(boss, BattleAction.FIRE_BREATH):
        return False
    return is_player_in_range(battle, boss, 1, 4)


DRAGON_EMPEROR_RULES: List[BossRule] = [
    BossRule(
        name="dragon_fear",
        predicate=dragon_emperor_rule_dragon_fear,
        action=lambda b, e: BattleAction.DRAGON_FEAR,
        priority=0,
    ),
    BossRule(
        name="tail_sweep",
        predicate=dragon_emperor_rule_tail_sweep,
        action=lambda b, e: BattleAction.TAIL_SWEEP,
        priority=1,
    ),
    BossRule(
        name="fire_breath",
        predicate=dragon_emperor_rule_fire_breath,
        action=lambda b, e: BattleAction.FIRE_BREATH,
        priority=2,
    ),
]


# =============================================================================
# Boss Rule Registry
# =============================================================================

BOSS_RULES = {
    BossType.REGENT: REGENT_RULES,
    BossType.RAT_KING: RAT_KING_RULES,
    BossType.SPIDER_QUEEN: SPIDER_QUEEN_RULES,
    BossType.FROST_GIANT: FROST_GIANT_RULES,
    BossType.ARCANE_KEEPER: ARCANE_KEEPER_RULES,
    BossType.FLAME_LORD: FLAME_LORD_RULES,
    BossType.DRAGON_EMPEROR: DRAGON_EMPEROR_RULES,
}


# =============================================================================
# Main Decision Function
# =============================================================================

def choose_boss_action(
    battle: BattleState,
    boss: BattleEntity,
    boss_type: BossType
) -> Optional[BattleAction]:
    """
    Choose an action for a boss using signature heuristics.

    Iterates through the boss's priority rule list and returns the first
    matching action. Falls back to None if no rules match (caller should
    use general AI scoring as fallback).

    Args:
        battle: Current battle state
        boss: The boss entity
        boss_type: Type of boss for rule lookup

    Returns:
        BattleAction if a rule matches, None otherwise
    """
    rules = BOSS_RULES.get(boss_type, [])

    # Sort by priority (lower = higher priority)
    sorted_rules = sorted(rules, key=lambda r: r.priority)

    for rule in sorted_rules:
        if rule.predicate(battle, boss):
            return rule.action(battle, boss)

    # No rule matched - caller should use fallback
    return None


def get_boss_action_with_fallback(
    battle: BattleState,
    boss: BattleEntity,
    boss_type: BossType,
    ai_type: AIBehavior = AIBehavior.AGGRESSIVE
) -> CandidateAction:
    """
    Get a boss action, falling back to general AI if no signature rule matches.

    Args:
        battle: Current battle state
        boss: The boss entity
        boss_type: Type of boss for rule lookup
        ai_type: AI behavior type for fallback scoring

    Returns:
        CandidateAction to execute
    """
    # Try boss-specific rules first
    boss_action = choose_boss_action(battle, boss, boss_type)

    if boss_action is not None:
        # Convert BattleAction to CandidateAction
        # For movement abilities like BURROW/TELEPORT, compute target tile
        if boss_action == BattleAction.BURROW:
            target_tile = find_safest_tile(battle, boss)
            return CandidateAction(
                action_type=CandidateType.ABILITY,
                battle_action=boss_action,
                target_pos=target_tile,
                end_tile=target_tile,
            )
        elif boss_action == BattleAction.TELEPORT:
            target_tile = find_optimal_teleport_tile(battle, boss)
            return CandidateAction(
                action_type=CandidateType.ABILITY,
                battle_action=boss_action,
                target_pos=target_tile,
                end_tile=target_tile,
            )
        else:
            # Other abilities don't require special targeting
            return CandidateAction(
                action_type=CandidateType.ABILITY,
                battle_action=boss_action,
                end_tile=(boss.arena_x, boss.arena_y),
            )

    # Fallback to general AI scoring
    return choose_action(battle, boss, ai_type)


# =============================================================================
# Helper for Tests
# =============================================================================

def compute_boss_action_hash(action: CandidateAction) -> str:
    """Compute a hash string for boss action (for testing)."""
    if action.battle_action:
        return action.battle_action.name
    elif action.action_type == CandidateType.MOVE:
        return f"MOVE({action.target_pos[0]},{action.target_pos[1]})"
    elif action.action_type == CandidateType.ATTACK:
        return "BASIC_ATTACK"
    elif action.action_type == CandidateType.WAIT:
        return "WAIT"
    return "UNKNOWN"
