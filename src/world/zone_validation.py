"""Zone validation harness for testing zone assignment correctness.

Run from repo root:
    python -c "from src.world.zone_validation import validate_floor; validate_floor(2, seeds=20)"

Or run all floors:
    python -c "from src.world.zone_validation import validate_all; validate_all()"
"""
from collections import Counter
from typing import Dict, List, Optional, Set, Tuple

from .dungeon import Dungeon
from .zone_config import get_floor_config, FloorZoneConfig


def validate_floor(level: int, seeds: int = 20, verbose: bool = True) -> Dict:
    """Validate zone assignment for a floor across multiple seeds.

    Args:
        level: Floor level to validate
        seeds: Number of seeds to test
        verbose: Print detailed output

    Returns:
        Dict with validation results:
        {
            'passed': bool,
            'errors': List[str],
            'warnings': List[str],
            'stats': Dict with zone distribution stats
        }
    """
    config = get_floor_config(level)
    if not config:
        return {
            'passed': False,
            'errors': [f"No zone config found for floor {level}"],
            'warnings': [],
            'stats': {}
        }

    errors = []
    warnings = []
    all_zone_counts: List[Counter] = []
    required_zones = {z.zone_id for z in config.zones if z.required_count > 0}
    required_counts = {z.zone_id: z.required_count for z in config.zones if z.required_count > 0}

    if verbose:
        print(f"\n{'='*60}")
        print(f"ZONE VALIDATION: Floor {level}")
        print(f"{'='*60}")
        print(f"Required zones: {required_zones}")
        print(f"Start zone: {config.start_zone}")
        print(f"Fallback zone: {config.fallback_zone}")
        print(f"Testing {seeds} seeds...\n")

    for seed in range(seeds):
        dungeon = Dungeon(width=80, height=40, level=level, seed=seed)
        zone_counter = Counter()

        for room in dungeon.rooms:
            zone_counter[room.zone] += 1

        all_zone_counts.append(zone_counter)

        # Check required zones are present
        for zone_id in required_zones:
            expected = required_counts[zone_id]
            actual = zone_counter.get(zone_id, 0)
            if actual < expected:
                errors.append(f"Seed {seed}: Required zone '{zone_id}' has {actual}/{expected} rooms")

        # Check start zone exists
        if zone_counter.get(config.start_zone, 0) == 0:
            errors.append(f"Seed {seed}: Start zone '{config.start_zone}' not found")

        # Check for degenerate distribution (one zone > 70% of rooms)
        total_rooms = sum(zone_counter.values())
        for zone_id, count in zone_counter.items():
            if count / total_rooms > 0.7 and zone_id != config.fallback_zone:
                warnings.append(f"Seed {seed}: Zone '{zone_id}' dominates with {count}/{total_rooms} rooms ({100*count/total_rooms:.0f}%)")

        if verbose and seed < 5:  # Show first 5 seeds in detail
            print(f"Seed {seed}: {dict(zone_counter)}")

    # Compute aggregate stats
    zone_totals = Counter()
    zone_appearances = Counter()  # How many seeds each zone appeared in

    for zone_counter in all_zone_counts:
        for zone_id, count in zone_counter.items():
            zone_totals[zone_id] += count
            zone_appearances[zone_id] += 1

    stats = {
        'total_seeds': seeds,
        'zone_totals': dict(zone_totals),
        'zone_appearances': dict(zone_appearances),
        'avg_per_seed': {z: zone_totals[z] / seeds for z in zone_totals}
    }

    passed = len(errors) == 0

    if verbose:
        print(f"\n{'-'*40}")
        print("AGGREGATE STATS:")
        print(f"  Total rooms across all seeds: {sum(zone_totals.values())}")
        print(f"  Zones by frequency:")
        for zone_id, total in zone_totals.most_common():
            avg = total / seeds
            appearances = zone_appearances[zone_id]
            print(f"    {zone_id}: {total} total, {avg:.1f} avg/seed, appeared in {appearances}/{seeds} seeds")

        print(f"\n{'-'*40}")
        print(f"RESULT: {'PASSED' if passed else 'FAILED'}")
        if errors:
            print(f"Errors ({len(errors)}):")
            for err in errors[:10]:  # Show first 10 errors
                print(f"  - {err}")
            if len(errors) > 10:
                print(f"  ... and {len(errors) - 10} more errors")
        if warnings:
            print(f"Warnings ({len(warnings)}):")
            for warn in warnings[:5]:
                print(f"  - {warn}")
            if len(warnings) > 5:
                print(f"  ... and {len(warnings) - 5} more warnings")

    return {
        'passed': passed,
        'errors': errors,
        'warnings': warnings,
        'stats': stats
    }


def validate_all(seeds: int = 20, verbose: bool = True) -> bool:
    """Validate all implemented floors.

    Returns True if all floors pass validation.
    """
    from .zone_config import FLOOR_ZONE_CONFIGS

    all_passed = True
    results = {}

    for level, config in FLOOR_ZONE_CONFIGS.items():
        # Skip placeholder configs (no zones defined)
        if not config.zones:
            if verbose:
                print(f"\nSkipping Floor {level} (placeholder config)")
            continue

        result = validate_floor(level, seeds=seeds, verbose=verbose)
        results[level] = result
        if not result['passed']:
            all_passed = False

    if verbose:
        print(f"\n{'='*60}")
        print(f"VALIDATION SUMMARY")
        print(f"{'='*60}")
        for level, result in results.items():
            status = "PASSED" if result['passed'] else "FAILED"
            print(f"  Floor {level}: {status}")
        print(f"\nOverall: {'ALL PASSED' if all_passed else 'SOME FAILED'}")

    return all_passed


def get_zone_debug_info(dungeon: 'Dungeon') -> str:
    """Get detailed zone debug info for a dungeon instance.

    Returns formatted string with zone assignments and room details.
    """
    lines = []
    lines.append(f"Zone Debug Info - Floor {dungeon.level}")
    lines.append("=" * 40)

    zone_counter = Counter()
    for room in dungeon.rooms:
        zone_counter[room.zone] += 1

    lines.append(f"Total rooms: {len(dungeon.rooms)}")
    lines.append(f"Zone distribution:")
    for zone_id, count in zone_counter.most_common():
        lines.append(f"  {zone_id}: {count}")

    lines.append("")
    lines.append("Room details:")
    for i, room in enumerate(dungeon.rooms):
        lines.append(f"  Room {i}: zone={room.zone}, size={room.width}x{room.height}, area={room.area()}, pos=({room.x},{room.y})")

    return "\n".join(lines)
