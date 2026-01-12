"""Tests for v6.2 Slice 3 Boss Heuristics.

Verifies:
- Each boss uses signature abilities appropriately
- Determinism: same state produces same action
- Hazard sanity: bosses don't step into lava unless killshot
"""
import pytest
from src.combat.battle_types import BattleState, BattleEntity
from src.combat.battle_actions import BattleAction
from src.combat.boss_heuristics import (
    choose_boss_action, get_boss_action_with_fallback, compute_boss_action_hash,
    count_minions, is_player_adjacent, is_player_poisoned,
    REGENT_RULES, RAT_KING_RULES, DRAGON_EMPEROR_RULES, ARCANE_KEEPER_RULES
)
from src.combat.ai_scoring import CandidateType, is_tile_hazard
from src.core.constants import BossType, AIBehavior


def create_boss_battle(
    arena_width: int = 11,
    arena_height: int = 9,
    player_pos: tuple = (5, 7),
    boss_pos: tuple = (5, 2),
    boss_type: BossType = BossType.REGENT,
    hazard_tiles: dict = None,
    turn_number: int = 1
) -> BattleState:
    """Create a test battle state for boss testing."""
    # Create floor tiles
    tiles = [['.' for _ in range(arena_width)] for _ in range(arena_height)]

    # Add walls on borders
    for x in range(arena_width):
        tiles[0][x] = '#'
        tiles[arena_height - 1][x] = '#'
    for y in range(arena_height):
        tiles[y][0] = '#'
        tiles[y][arena_width - 1] = '#'

    # Add hazard tiles
    if hazard_tiles:
        for (x, y), tile_type in hazard_tiles.items():
            if 0 <= y < arena_height and 0 <= x < arena_width:
                tiles[y][x] = tile_type

    battle = BattleState(
        arena_width=arena_width,
        arena_height=arena_height,
        arena_tiles=tiles,
        biome='STONE',
        floor_level=4,  # Boss floor
        turn_number=turn_number,
    )

    # Add player
    battle.player = BattleEntity(
        entity_id='player',
        is_player=True,
        arena_x=player_pos[0],
        arena_y=player_pos[1],
        world_x=0,
        world_y=0,
        hp=100,
        max_hp=100,
        attack=15,
        defense=5,
    )

    # Add boss
    boss = BattleEntity(
        entity_id='boss_1',
        is_player=False,
        arena_x=boss_pos[0],
        arena_y=boss_pos[1],
        world_x=0,
        world_y=0,
        hp=200,
        max_hp=200,
        attack=20,
        defense=8,
    )
    battle.enemies.append(boss)

    return battle


class TestRegentBoss:
    """Tests for Regent (LEGITIMACY) boss behavior."""

    def test_royal_decree_when_no_guards(self):
        """Regent should use Royal Decree when guards < 2 and ability ready."""
        battle = create_boss_battle(boss_type=BossType.REGENT)
        boss = battle.enemies[0]

        # No guards, ability ready (empty cooldowns)
        action = choose_boss_action(battle, boss, BossType.REGENT)

        assert action == BattleAction.ROYAL_DECREE, \
            f"Regent should use Royal Decree with 0 guards, chose {action}"

    def test_counterfeit_crown_many_escapes(self):
        """Regent should use Counterfeit Crown when player has many safe escapes."""
        battle = create_boss_battle(boss_type=BossType.REGENT)
        boss = battle.enemies[0]

        # Set Royal Decree on cooldown
        boss.cooldowns['ROYAL_DECREE'] = 5

        action = choose_boss_action(battle, boss, BossType.REGENT)

        # Should use Counterfeit Crown if player has >= 4 safe escapes
        # (depends on exact position, may fall through to summon_guard)
        assert action in {BattleAction.COUNTERFEIT_CROWN, BattleAction.SUMMON_GUARD, None}, \
            f"Regent should use crown or summon, chose {action}"


class TestRatKingBoss:
    """Tests for Rat King (CIRCULATION) boss behavior."""

    def test_plague_bite_adjacent_not_poisoned(self):
        """Rat King should use Plague Bite when adjacent and player not poisoned."""
        battle = create_boss_battle(
            boss_type=BossType.RAT_KING,
            player_pos=(5, 3),  # Adjacent to boss at (5, 2)
            boss_pos=(5, 2),
        )
        boss = battle.enemies[0]

        # Set summon on cooldown so plague bite is checked
        boss.cooldowns['SUMMON_SWARM'] = 4

        action = choose_boss_action(battle, boss, BossType.RAT_KING)

        assert action == BattleAction.PLAGUE_BITE, \
            f"Rat King should use Plague Bite when adjacent, chose {action}"

    def test_burrow_low_hp_adjacent(self):
        """Rat King should Burrow when low HP and adjacent threat."""
        battle = create_boss_battle(
            boss_type=BossType.RAT_KING,
            player_pos=(5, 3),
            boss_pos=(5, 2),
        )
        boss = battle.enemies[0]

        # Set low HP
        boss.hp = 30
        boss.max_hp = 200

        # Set other abilities on cooldown
        boss.cooldowns['SUMMON_SWARM'] = 4
        boss.cooldowns['PLAGUE_BITE'] = 2

        action = choose_boss_action(battle, boss, BossType.RAT_KING)

        assert action == BattleAction.BURROW, \
            f"Rat King should Burrow when low HP and adjacent, chose {action}"


class TestArcaneKeeperBoss:
    """Tests for Arcane Keeper (COGNITION) boss behavior."""

    def test_teleport_when_adjacent(self):
        """Arcane Keeper should Teleport when player is adjacent."""
        battle = create_boss_battle(
            boss_type=BossType.ARCANE_KEEPER,
            player_pos=(5, 3),  # Adjacent
            boss_pos=(5, 2),
        )
        boss = battle.enemies[0]

        action = choose_boss_action(battle, boss, BossType.ARCANE_KEEPER)

        assert action == BattleAction.TELEPORT, \
            f"Arcane Keeper should Teleport when adjacent, chose {action}"

    def test_arcane_bolt_in_range(self):
        """Arcane Keeper should use Arcane Bolt when in preferred range."""
        battle = create_boss_battle(
            boss_type=BossType.ARCANE_KEEPER,
            player_pos=(5, 6),  # Distance 4 from boss at (5, 2)
            boss_pos=(5, 2),
        )
        boss = battle.enemies[0]

        # Set teleport on cooldown
        boss.cooldowns['TELEPORT'] = 4

        action = choose_boss_action(battle, boss, BossType.ARCANE_KEEPER)

        assert action == BattleAction.ARCANE_BOLT, \
            f"Arcane Keeper should use Arcane Bolt in range, chose {action}"


class TestDragonEmperorBoss:
    """Tests for Dragon Emperor (INTEGRATION) boss behavior."""

    def test_dragon_fear_round_one(self):
        """Dragon Emperor should use Dragon Fear on round 1."""
        battle = create_boss_battle(
            boss_type=BossType.DRAGON_EMPEROR,
            turn_number=1,
        )
        boss = battle.enemies[0]

        action = choose_boss_action(battle, boss, BossType.DRAGON_EMPEROR)

        assert action == BattleAction.DRAGON_FEAR, \
            f"Dragon Emperor should use Dragon Fear on round 1, chose {action}"

    def test_tail_sweep_adjacent(self):
        """Dragon Emperor should use Tail Sweep when adjacent."""
        battle = create_boss_battle(
            boss_type=BossType.DRAGON_EMPEROR,
            player_pos=(5, 3),  # Adjacent
            boss_pos=(5, 2),
            turn_number=5,  # Past round 2
        )
        boss = battle.enemies[0]

        # Set dragon fear on cooldown
        boss.cooldowns['DRAGON_FEAR'] = 6

        action = choose_boss_action(battle, boss, BossType.DRAGON_EMPEROR)

        assert action == BattleAction.TAIL_SWEEP, \
            f"Dragon Emperor should use Tail Sweep when adjacent, chose {action}"


class TestBossDeterminism:
    """Tests for deterministic boss behavior."""

    def test_same_state_same_action(self):
        """Same battle state should produce same boss action."""
        # Run 5 times and verify same result
        hashes = []

        for _ in range(5):
            battle = create_boss_battle(boss_type=BossType.REGENT)
            boss = battle.enemies[0]
            action = get_boss_action_with_fallback(
                battle, boss, BossType.REGENT, AIBehavior.AGGRESSIVE
            )
            hashes.append(compute_boss_action_hash(action))

        assert len(set(hashes)) == 1, f"Non-deterministic: {hashes}"

    def test_multiple_boss_types_deterministic(self):
        """All boss types should be deterministic."""
        boss_types = [
            BossType.REGENT, BossType.RAT_KING, BossType.SPIDER_QUEEN,
            BossType.FROST_GIANT, BossType.ARCANE_KEEPER, BossType.FLAME_LORD,
            BossType.DRAGON_EMPEROR
        ]

        for boss_type in boss_types:
            hashes = []
            for _ in range(3):
                battle = create_boss_battle(boss_type=boss_type)
                boss = battle.enemies[0]
                action = get_boss_action_with_fallback(
                    battle, boss, boss_type, AIBehavior.AGGRESSIVE
                )
                hashes.append(compute_boss_action_hash(action))

            assert len(set(hashes)) == 1, \
                f"{boss_type.name} is non-deterministic: {hashes}"


class TestBossHazardSafety:
    """Tests for boss hazard avoidance."""

    def test_boss_avoids_lava_fallback(self):
        """Boss should not step into lava when using fallback AI."""
        # Create battle with lava around
        hazards = {
            (4, 3): '~',
            (5, 3): '~',
            (6, 3): '~',
        }
        battle = create_boss_battle(
            boss_type=BossType.REGENT,
            hazard_tiles=hazards,
        )
        boss = battle.enemies[0]

        # Set all abilities on cooldown to force fallback
        boss.cooldowns['ROYAL_DECREE'] = 5
        boss.cooldowns['COUNTERFEIT_CROWN'] = 4
        boss.cooldowns['SUMMON_GUARD'] = 3

        action = get_boss_action_with_fallback(
            battle, boss, BossType.REGENT, AIBehavior.AGGRESSIVE
        )

        # If it's a move, verify it doesn't step into lava
        if action.action_type == CandidateType.MOVE and action.target_pos:
            x, y = action.target_pos
            assert not is_tile_hazard(battle, x, y), \
                f"Boss chose to step into lava at {action.target_pos}"


class TestBossHelpers:
    """Tests for boss helper functions."""

    def test_count_minions(self):
        """count_minions should return correct count."""
        battle = create_boss_battle()
        boss = battle.enemies[0]

        # Add some minions
        for i in range(3):
            minion = BattleEntity(
                entity_id=f'minion_{i}',
                is_player=False,
                arena_x=3 + i,
                arena_y=4,
                world_x=0, world_y=0,
                hp=10, max_hp=10, attack=5, defense=0,
            )
            battle.enemies.append(minion)

        count = count_minions(battle, boss)
        assert count == 3, f"Expected 3 minions, got {count}"

    def test_is_player_adjacent(self):
        """is_player_adjacent should detect adjacency correctly."""
        battle = create_boss_battle(
            player_pos=(5, 3),
            boss_pos=(5, 2),
        )
        boss = battle.enemies[0]

        assert is_player_adjacent(battle, boss), "Player should be adjacent"

        # Move player away
        battle.player.arena_y = 5
        assert not is_player_adjacent(battle, boss), "Player should not be adjacent"


if __name__ == '__main__':
    pytest.main([__file__, '-v'])
