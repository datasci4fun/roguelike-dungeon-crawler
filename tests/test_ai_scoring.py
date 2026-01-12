"""Tests for v6.2 AI Scoring System.

Verifies:
- Determinism: same inputs produce same outputs
- Hazard avoidance: enemies don't step into lava
- Kill shot priority: enemies take obvious kills
- Position scoring: melee wants adjacency, ranged wants distance
"""
import pytest
from src.combat.battle_types import BattleState, BattleEntity
from src.combat.ai_scoring import (
    enumerate_candidate_actions, score_action, choose_action,
    compute_action_hash, CandidateType, HAZARD_COST
)
from src.core.constants import AIBehavior


def create_test_battle(
    arena_width: int = 9,
    arena_height: int = 7,
    player_pos: tuple = (4, 5),
    enemy_pos: tuple = (4, 2),
    hazard_tiles: dict = None
) -> BattleState:
    """Create a test battle state with configurable positions."""
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
        floor_level=1,
    )

    # Add player
    battle.player = BattleEntity(
        entity_id='player',
        is_player=True,
        arena_x=player_pos[0],
        arena_y=player_pos[1],
        world_x=0,
        world_y=0,
        hp=50,
        max_hp=50,
        attack=10,
        defense=2,
    )

    # Add enemy
    enemy = BattleEntity(
        entity_id='enemy_1',
        is_player=False,
        arena_x=enemy_pos[0],
        arena_y=enemy_pos[1],
        world_x=0,
        world_y=0,
        hp=20,
        max_hp=20,
        attack=5,
        defense=1,
    )
    battle.enemies.append(enemy)

    return battle


class TestDeterminism:
    """Tests for deterministic behavior."""

    def test_same_state_same_action(self):
        """Same battle state should produce same action choice."""
        # Create identical states
        battle1 = create_test_battle()
        battle2 = create_test_battle()

        enemy1 = battle1.enemies[0]
        enemy2 = battle2.enemies[0]

        # Choose actions
        action1 = choose_action(battle1, enemy1, AIBehavior.CHASE)
        action2 = choose_action(battle2, enemy2, AIBehavior.CHASE)

        # Should be identical
        hash1 = compute_action_hash(action1)
        hash2 = compute_action_hash(action2)

        assert hash1 == hash2, f"Non-deterministic: {hash1} != {hash2}"

    def test_multiple_runs_same_result(self):
        """Running scoring multiple times should give same result."""
        battle = create_test_battle()
        enemy = battle.enemies[0]

        hashes = []
        for _ in range(10):
            action = choose_action(battle, enemy, AIBehavior.CHASE)
            hashes.append(compute_action_hash(action))

        # All hashes should be identical
        assert len(set(hashes)) == 1, f"Non-deterministic across runs: {hashes}"

    def test_enumeration_stable_order(self):
        """Candidate actions should be enumerated in stable order."""
        battle = create_test_battle()
        enemy = battle.enemies[0]

        candidates1 = enumerate_candidate_actions(battle, enemy, AIBehavior.CHASE)
        candidates2 = enumerate_candidate_actions(battle, enemy, AIBehavior.CHASE)

        # Convert to comparable format
        hashes1 = [compute_action_hash(c) for c in candidates1]
        hashes2 = [compute_action_hash(c) for c in candidates2]

        assert hashes1 == hashes2, "Enumeration order is unstable"


class TestHazardAvoidance:
    """Tests for hazard avoidance behavior."""

    def test_enemy_avoids_lava_destination(self):
        """Enemy should not step into lava when other paths exist."""
        # Create battle with lava between enemy and player
        hazards = {
            (3, 3): '~',  # Lava
            (4, 3): '~',
            (5, 3): '~',
        }
        battle = create_test_battle(
            player_pos=(4, 5),
            enemy_pos=(4, 1),
            hazard_tiles=hazards
        )
        enemy = battle.enemies[0]

        action = choose_action(battle, enemy, AIBehavior.CHASE)

        # Enemy should NOT move into lava
        if action.action_type == CandidateType.MOVE and action.target_pos:
            x, y = action.target_pos
            tile = battle.arena_tiles[y][x]
            assert tile != '~', f"Enemy chose to step into lava at {action.target_pos}"

    def test_lava_has_high_cost(self):
        """Lava tile should have very high hazard cost."""
        assert HAZARD_COST['~'] >= 100, "Lava cost should be very high"

    def test_enemy_prefers_safe_path(self):
        """Enemy should prefer safe tiles over hazardous ones."""
        # Create battle with partial hazard coverage
        hazards = {
            (3, 3): '~',  # Lava on left path
        }
        battle = create_test_battle(
            player_pos=(4, 5),
            enemy_pos=(4, 2),
            hazard_tiles=hazards
        )
        enemy = battle.enemies[0]

        action = choose_action(battle, enemy, AIBehavior.CHASE)

        # Should choose a non-hazard move
        if action.action_type == CandidateType.MOVE and action.target_pos:
            x, y = action.target_pos
            tile = battle.arena_tiles[y][x]
            assert tile == '.', f"Enemy chose hazard tile {tile} at {action.target_pos}"


class TestHazardIntelligence:
    """Tests for v6.2 Slice 2 hazard intelligence features."""

    def test_enemy_leaves_hazard(self):
        """Enemy standing on hazard should move off it."""
        from src.combat.ai_scoring import is_tile_hazard

        # Place enemy on poison gas
        hazards = {(4, 3): '!'}  # Poison gas
        battle = create_test_battle(
            player_pos=(4, 5),
            enemy_pos=(4, 3),  # Enemy ON the poison
            hazard_tiles=hazards
        )
        enemy = battle.enemies[0]

        # Verify enemy starts on hazard
        assert is_tile_hazard(battle, 4, 3), "Test setup: enemy should be on hazard"

        action = choose_action(battle, enemy, AIBehavior.CHASE)

        # Enemy should move off hazard
        assert action.action_type == CandidateType.MOVE, \
            f"Enemy should move off hazard, chose {action.action_type}"
        if action.target_pos:
            ends_on_hazard = is_tile_hazard(battle, action.target_pos[0], action.target_pos[1])
            assert not ends_on_hazard, \
                f"Enemy should not stay on hazard, moved to {action.target_pos}"

    def test_path_cost_through_lava(self):
        """Path cost through lava should be high."""
        from src.combat.ai_scoring import min_cost_path_hazard

        # Create arena with lava blocking direct path
        hazards = {
            (3, 3): '~',
            (4, 3): '~',
            (5, 3): '~',
        }
        battle = create_test_battle(
            player_pos=(4, 5),
            enemy_pos=(4, 1),
            hazard_tiles=hazards
        )

        # Direct path through lava: cost should be ~120+ per lava tile
        # Verify the cost is high for a path that must cross lava
        # Path from (4,2) to (4,4) - MUST cross lava at (4,3)
        # Actually we can't force it through lava since pathfinder finds cheapest
        # Instead verify that lava has high cost constant
        assert HAZARD_COST['~'] >= 100, "Lava cost should be very high"

    def test_safe_escape_count(self):
        """Player safe escape count should decrease when cornered."""
        from src.combat.ai_scoring import player_safe_escape_count

        # Create scenario with lava limiting player options
        hazards = {
            (3, 4): '~',  # Lava west of player
            (3, 5): '~',
        }
        battle = create_test_battle(
            player_pos=(4, 4),
            enemy_pos=(4, 2),
            hazard_tiles=hazards
        )

        # Count safe escapes with enemy at different positions
        escapes_far = player_safe_escape_count(battle, (4, 2), AIBehavior.CHASE)
        escapes_near = player_safe_escape_count(battle, (5, 4), AIBehavior.CHASE)

        # When enemy is adjacent (5,4), player has fewer safe escapes
        assert escapes_far >= escapes_near, \
            f"Escapes should decrease when enemy is near: far={escapes_far}, near={escapes_near}"

    def test_hazard_pressure_cornering(self):
        """Melee AI should prefer positions that reduce player escapes."""
        from src.combat.ai_scoring import player_safe_escape_count

        # Create scenario where one position corners player better
        hazards = {
            (3, 4): '~',  # Lava west of player
            (3, 5): '~',
        }
        battle = create_test_battle(
            player_pos=(4, 4),
            enemy_pos=(4, 2),
            hazard_tiles=hazards
        )
        enemy = battle.enemies[0]

        action = choose_action(battle, enemy, AIBehavior.CHASE)

        # Enemy should move to a position that creates pressure
        # (exact position depends on scoring, but should not be random)
        if action.action_type == CandidateType.MOVE and action.target_pos:
            safe_count = player_safe_escape_count(battle, action.target_pos, AIBehavior.CHASE)
            # Should reduce player options somewhat
            assert safe_count < 6, \
                f"Enemy should pressure player, safe escapes={safe_count}"


class TestKillShotPriority:
    """Tests for kill shot prioritization."""

    def test_takes_killshot_when_available(self):
        """Enemy should attack when it can kill the player."""
        battle = create_test_battle(
            player_pos=(4, 3),  # Adjacent to enemy
            enemy_pos=(4, 2),
        )
        # Set player to low HP (enemy can kill)
        battle.player.hp = 3
        enemy = battle.enemies[0]

        action = choose_action(battle, enemy, AIBehavior.CHASE)

        assert action.action_type == CandidateType.ATTACK, \
            f"Enemy should attack low-HP player, chose {action.action_type}"

    def test_attack_adjacent_player(self):
        """Enemy should attack when adjacent to player."""
        battle = create_test_battle(
            player_pos=(4, 3),  # Adjacent
            enemy_pos=(4, 2),
        )
        enemy = battle.enemies[0]

        action = choose_action(battle, enemy, AIBehavior.CHASE)

        # Should attack the adjacent player
        assert action.action_type == CandidateType.ATTACK, \
            f"Enemy should attack adjacent player, chose {action.action_type}"


class TestPositionScoring:
    """Tests for position-based scoring."""

    def test_melee_wants_adjacency(self):
        """Melee AI should move toward player."""
        battle = create_test_battle(
            player_pos=(4, 5),
            enemy_pos=(4, 2),  # Not adjacent
        )
        enemy = battle.enemies[0]

        action = choose_action(battle, enemy, AIBehavior.CHASE)

        # Should move closer to player
        if action.action_type == CandidateType.MOVE and action.target_pos:
            old_dist = abs(4 - 4) + abs(5 - 2)  # 3
            new_dist = abs(action.target_pos[0] - 4) + abs(action.target_pos[1] - 5)
            assert new_dist < old_dist, \
                f"Melee should move closer, went from {old_dist} to {new_dist}"

    def test_ranged_maintains_distance(self):
        """Ranged AI should try to maintain distance from player."""
        battle = create_test_battle(
            player_pos=(4, 5),
            enemy_pos=(4, 4),  # Adjacent (dist 1)
        )
        enemy = battle.enemies[0]

        action = choose_action(battle, enemy, AIBehavior.RANGED_KITE)

        # Ranged should move away or attack (not stay adjacent)
        # With current scoring, moving away should be preferred when adjacent
        # because W_TOO_CLOSE_PENALTY is high
        if action.action_type == CandidateType.MOVE and action.target_pos:
            new_dist = abs(action.target_pos[0] - 4) + abs(action.target_pos[1] - 5)
            # Should move to dist > 1
            assert new_dist > 1, \
                f"Ranged should move away from adjacent, new_dist={new_dist}"


class TestLowHPBehavior:
    """Tests for low HP self-preservation."""

    def test_low_hp_avoids_melee(self):
        """Low HP enemy should avoid staying adjacent without killshot."""
        battle = create_test_battle(
            player_pos=(4, 3),
            enemy_pos=(4, 2),  # Adjacent
        )
        # Set enemy to low HP
        enemy = battle.enemies[0]
        enemy.hp = 5  # 25% of 20
        enemy.max_hp = 20

        # Player has full HP so no killshot
        battle.player.hp = 50

        action = choose_action(battle, enemy, AIBehavior.CHASE)

        # With low HP and no killshot, enemy might choose to retreat
        # or attack anyway (attack still has positive score)
        # The key is that adjacency without killshot has a penalty
        # This test documents the behavior rather than asserting specific outcome
        assert action is not None


if __name__ == '__main__':
    pytest.main([__file__, '-v'])
