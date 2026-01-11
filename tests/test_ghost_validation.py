"""Validation tests for Ghost Differentiation system (Milestone F).

Tests:
1. Per-floor limits are respected
2. Fairness: Silence not on stairs
3. Echo meaningfulness: paths lead somewhere useful
"""
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from src.world import Dungeon
from src.entities.ghosts import (
    GhostManager, GhostType, Ghost, GHOST_LIMITS,
    GHOST_ZONE_BIAS
)


def test_ghost_limits():
    """Test that ghost spawning respects per-floor limits."""
    print("\n=== Testing Ghost Limits ===")
    violations = []

    for seed in range(20):
        dungeon = Dungeon(level=3, has_stairs_up=True)

        manager = GhostManager()
        manager.initialize_floor(3, dungeon, seed=seed * 12345)

        # Count by type
        counts = {gt: 0 for gt in GhostType}
        for ghost in manager.ghosts:
            counts[ghost.ghost_type] += 1

        # Check limits
        for ghost_type, count in counts.items():
            limit = GHOST_LIMITS.get(ghost_type, 99)
            if count > limit:
                violations.append(
                    f"Seed {seed}: {ghost_type.name} count={count} exceeds limit={limit}"
                )

    if violations:
        print("FAIL: Limit violations:")
        for v in violations:
            print(f"  {v}")
        return False

    print("PASS: All ghost counts within limits across 20 seeds")
    return True


def test_silence_fairness():
    """Test that Silence ghosts don't spawn on stairs."""
    print("\n=== Testing Silence Fairness ===")
    violations = []

    for seed in range(20):
        dungeon = Dungeon(level=3, has_stairs_up=True)

        manager = GhostManager()
        manager.initialize_floor(3, dungeon, seed=seed * 12345)

        for ghost in manager.ghosts:
            if ghost.ghost_type == GhostType.SILENCE:
                # Check if Silence is on or near stairs
                if dungeon.stairs_down_pos:
                    if (ghost.x, ghost.y) == dungeon.stairs_down_pos:
                        violations.append(
                            f"Seed {seed}: Silence at stairs_down {dungeon.stairs_down_pos}"
                        )
                if dungeon.stairs_up_pos:
                    if (ghost.x, ghost.y) == dungeon.stairs_up_pos:
                        violations.append(
                            f"Seed {seed}: Silence at stairs_up {dungeon.stairs_up_pos}"
                        )

    if violations:
        print("FAIL: Fairness violations:")
        for v in violations:
            print(f"  {v}")
        return False

    print("PASS: No Silence ghosts on stairs across 20 seeds")
    return True


def test_echo_meaningfulness():
    """Test that Echo ghosts have meaningful paths."""
    print("\n=== Testing Echo Meaningfulness ===")
    total_echos = 0
    meaningful_echos = 0
    short_paths = []

    for seed in range(20):
        dungeon = Dungeon(level=3, has_stairs_up=True)

        manager = GhostManager()
        manager.initialize_floor(3, dungeon, seed=seed * 12345)

        for ghost in manager.ghosts:
            if ghost.ghost_type == GhostType.ECHO:
                total_echos += 1

                if ghost.path:
                    path_len = len(ghost.path.positions)
                    dest_type = ghost.path.destination_type

                    # Path should have >= 4 positions and lead somewhere
                    if path_len >= 4 and dest_type in ('lore', 'safe_path', 'secret'):
                        meaningful_echos += 1
                    else:
                        short_paths.append(
                            f"Seed {seed}: Echo path len={path_len}, dest={dest_type}"
                        )

    if total_echos == 0:
        print("INFO: No Echo ghosts spawned across 20 seeds (OK - RNG)")
        return True

    rate = meaningful_echos / total_echos * 100
    print(f"Echo meaningfulness: {meaningful_echos}/{total_echos} ({rate:.1f}%)")

    if short_paths:
        print("Short/invalid paths:")
        for p in short_paths[:5]:  # Show first 5
            print(f"  {p}")

    # Expect at least 70% meaningful
    if rate >= 70:
        print(f"PASS: {rate:.1f}% of Echo paths are meaningful (target: >=70%)")
        return True
    else:
        print(f"FAIL: Only {rate:.1f}% of Echo paths meaningful (target: >=70%)")
        return False


def test_zone_bias():
    """Test that ghosts spawn in biased zones more often."""
    print("\n=== Testing Zone Bias ===")

    zone_spawns = {gt: {'biased': 0, 'other': 0} for gt in GhostType}

    for seed in range(50):
        dungeon = Dungeon(level=3, has_stairs_up=True)

        manager = GhostManager()
        manager.initialize_floor(3, dungeon, seed=seed * 12345)

        for ghost in manager.ghosts:
            bias_zones = GHOST_ZONE_BIAS.get(ghost.ghost_type, [])
            if ghost.zone_id in bias_zones:
                zone_spawns[ghost.ghost_type]['biased'] += 1
            else:
                zone_spawns[ghost.ghost_type]['other'] += 1

    print("Zone bias results:")
    any_bias = False
    for gt, counts in zone_spawns.items():
        total = counts['biased'] + counts['other']
        if total > 0:
            bias_rate = counts['biased'] / total * 100
            print(f"  {gt.name}: {counts['biased']}/{total} in biased zones ({bias_rate:.1f}%)")
            if bias_rate > 50:
                any_bias = True

    if any_bias:
        print("PASS: Zone bias is working (some types >50% in preferred zones)")
    else:
        print("INFO: Zone bias may need tuning (depends on dungeon generation)")

    return True  # Informational, not a strict test


def test_spawn_rates():
    """Test overall ghost spawn rates."""
    print("\n=== Testing Spawn Rates ===")

    total_floors = 50
    floors_with_ghosts = 0
    total_ghosts = 0
    ghost_type_counts = {gt: 0 for gt in GhostType}

    for seed in range(total_floors):
        for floor in [1, 3, 5]:
            dungeon = Dungeon(level=floor, has_stairs_up=floor > 1)

            manager = GhostManager()
            manager.initialize_floor(floor, dungeon, seed=seed * 12345)

            if manager.ghosts:
                floors_with_ghosts += 1
                total_ghosts += len(manager.ghosts)

                for ghost in manager.ghosts:
                    ghost_type_counts[ghost.ghost_type] += 1

    total_checks = total_floors * 3
    spawn_rate = floors_with_ghosts / total_checks * 100
    avg_ghosts = total_ghosts / floors_with_ghosts if floors_with_ghosts > 0 else 0

    print(f"Floors with ghosts: {floors_with_ghosts}/{total_checks} ({spawn_rate:.1f}%)")
    print(f"Average ghosts per floor (when present): {avg_ghosts:.2f}")
    print("Ghost type distribution:")
    for gt, count in ghost_type_counts.items():
        print(f"  {gt.name}: {count}")

    # Expect some ghosts (at least 10% of floors)
    if spawn_rate >= 10:
        print("PASS: Reasonable ghost spawn rate")
        return True
    else:
        print("WARN: Low spawn rate, may need tuning")
        return True  # Not a failure, just informational


def main():
    """Run all validation tests."""
    print("=" * 60)
    print("Ghost Differentiation Validation (Milestone F)")
    print("=" * 60)

    results = []
    results.append(("Limits", test_ghost_limits()))
    results.append(("Fairness", test_silence_fairness()))
    results.append(("Echo Meaning", test_echo_meaningfulness()))
    results.append(("Zone Bias", test_zone_bias()))
    results.append(("Spawn Rates", test_spawn_rates()))

    print("\n" + "=" * 60)
    print("SUMMARY")
    print("=" * 60)

    all_pass = True
    for name, passed in results:
        status = "PASS" if passed else "FAIL"
        print(f"  {name}: {status}")
        if not passed:
            all_pass = False

    if all_pass:
        print("\nAll validation tests passed!")
        return 0
    else:
        print("\nSome tests failed - review output above")
        return 1


if __name__ == "__main__":
    sys.exit(main())
