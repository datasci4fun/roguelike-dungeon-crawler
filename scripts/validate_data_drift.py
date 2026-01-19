#!/usr/bin/env python3
"""Data drift validation script.

Compares Python constants with JSON seed files to detect divergence.
Exit codes:
  0 = No drift detected
  1 = Drift detected (differences found)
  2 = Error (file not found, parse error, etc.)

Usage:
  .venv/Scripts/python scripts/validate_data_drift.py
  .venv/Scripts/python scripts/validate_data_drift.py --verbose
  .venv/Scripts/python scripts/validate_data_drift.py --json
"""

import argparse
import json
import sys
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any


# Paths
PROJECT_ROOT = Path(__file__).parent.parent
DATA_SEEDS = PROJECT_ROOT / "data" / "seeds"
SRC_CONSTANTS = PROJECT_ROOT / "src" / "core" / "constants"


@dataclass
class DriftIssue:
    """Represents a single data drift issue."""
    category: str  # e.g., "enemies", "bosses"
    entity_id: str  # e.g., "goblin", "goblin_king"
    field: str  # e.g., "hp", "damage"
    python_value: Any
    json_value: Any
    severity: str = "warning"  # "error" or "warning"


@dataclass
class ValidationResult:
    """Aggregated validation results."""
    issues: list[DriftIssue] = field(default_factory=list)
    missing_in_json: list[tuple[str, str]] = field(default_factory=list)
    missing_in_python: list[tuple[str, str]] = field(default_factory=list)

    @property
    def has_errors(self) -> bool:
        return (
            len(self.issues) > 0
            or len(self.missing_in_json) > 0
            or len(self.missing_in_python) > 0
        )

    @property
    def error_count(self) -> int:
        return (
            len([i for i in self.issues if i.severity == "error"])
            + len(self.missing_in_json)
            + len(self.missing_in_python)
        )

    @property
    def warning_count(self) -> int:
        return len([i for i in self.issues if i.severity == "warning"])


def load_json_seed(filename: str) -> dict | None:
    """Load a JSON seed file."""
    path = DATA_SEEDS / filename
    if not path.exists():
        return None
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)


def load_python_constants():
    """Dynamically import Python constants modules."""
    # Add both src and src/core to path for import resolution
    sys.path.insert(0, str(PROJECT_ROOT / "src"))
    sys.path.insert(0, str(PROJECT_ROOT))

    try:
        # Import using absolute paths from src directory
        from src.core.constants.enemy_data import ENEMY_STATS, FLOOR_ENEMY_POOLS
        from src.core.constants.boss_data import BOSS_STATS, LEVEL_BOSS_MAP, BOSS_LOOT
        from src.core.constants.enums import EnemyType, BossType

        return {
            "enemy_stats": ENEMY_STATS,
            "floor_pools": FLOOR_ENEMY_POOLS,
            "boss_stats": BOSS_STATS,
            "level_boss_map": LEVEL_BOSS_MAP,
            "boss_loot": BOSS_LOOT,
            "enemy_type": EnemyType,
            "boss_type": BossType,
        }
    except ImportError as e:
        print(f"Error importing Python constants: {e}", file=sys.stderr)
        return None


def normalize_id(enum_or_str: Any) -> str:
    """Convert enum or string to normalized lowercase ID.

    For enums, use the name (e.g., EnemyType.GOBLIN -> 'goblin').
    For strings, just lowercase them.
    """
    if hasattr(enum_or_str, "name"):
        # It's an enum - use its name
        return str(enum_or_str.name).lower()
    return str(enum_or_str).lower()


def validate_enemies(py_constants: dict, json_data: dict) -> ValidationResult:
    """Validate enemy data between Python and JSON."""
    result = ValidationResult()

    enemy_stats = py_constants["enemy_stats"]
    json_enemies = {e["id"]: e for e in json_data.get("data", [])}

    # Core fields that MUST match (high severity)
    core_fields = ["hp", "damage", "xp", "min_level", "max_level", "symbol", "name"]
    # Optional fields (lower severity)
    optional_fields = ["weight"]

    # Check each Python enemy
    for enemy_type, py_data in enemy_stats.items():
        enemy_id = normalize_id(enemy_type)

        if enemy_id not in json_enemies:
            result.missing_in_json.append(("enemies", enemy_id))
            continue

        json_enemy = json_enemies[enemy_id]

        # Compare core fields
        for field_name in core_fields:
            if field_name not in py_data:
                continue
            py_val = py_data[field_name]
            json_val = json_enemy.get(field_name)

            if py_val != json_val:
                result.issues.append(DriftIssue(
                    category="enemies",
                    entity_id=enemy_id,
                    field=field_name,
                    python_value=py_val,
                    json_value=json_val,
                    severity="error",
                ))

        # Compare optional fields (warnings only)
        for field_name in optional_fields:
            if field_name not in py_data:
                continue
            py_val = py_data[field_name]
            json_val = json_enemy.get(field_name)

            if py_val != json_val:
                result.issues.append(DriftIssue(
                    category="enemies",
                    entity_id=enemy_id,
                    field=field_name,
                    python_value=py_val,
                    json_value=json_val,
                    severity="warning",
                ))

    # Check for enemies in JSON but not in Python
    python_ids = {normalize_id(et) for et in enemy_stats.keys()}
    for json_id in json_enemies.keys():
        if json_id not in python_ids:
            result.missing_in_python.append(("enemies", json_id))

    return result


def validate_bosses(py_constants: dict, json_data: dict) -> ValidationResult:
    """Validate boss data between Python and JSON."""
    result = ValidationResult()

    boss_stats = py_constants["boss_stats"]
    boss_loot = py_constants["boss_loot"]
    json_bosses = {b["id"]: b for b in json_data.get("data", [])}

    # Core fields that MUST match
    core_fields = ["hp", "damage", "xp", "level", "symbol", "name", "description"]

    # Check each Python boss
    for boss_type, py_data in boss_stats.items():
        boss_id = normalize_id(boss_type)

        # Handle special naming (e.g., GOBLIN_KING -> goblin_king)
        if boss_id not in json_bosses:
            result.missing_in_json.append(("bosses", boss_id))
            continue

        json_boss = json_bosses[boss_id]

        # Compare core fields
        for field_name in core_fields:
            if field_name not in py_data:
                continue
            py_val = py_data[field_name]
            json_val = json_boss.get(field_name)

            if py_val != json_val:
                result.issues.append(DriftIssue(
                    category="bosses",
                    entity_id=boss_id,
                    field=field_name,
                    python_value=py_val,
                    json_value=json_val,
                    severity="error",
                ))

        # Compare abilities (as sets to ignore order)
        py_abilities = set(py_data.get("abilities", []))
        json_abilities = set(json_boss.get("abilities", []))

        if py_abilities != json_abilities:
            result.issues.append(DriftIssue(
                category="bosses",
                entity_id=boss_id,
                field="abilities",
                python_value=sorted(py_abilities),
                json_value=sorted(json_abilities),
                severity="error",
            ))

        # Compare loot
        py_loot = boss_loot.get(boss_type, [])
        json_loot = json_boss.get("loot", [])

        if sorted(py_loot) != sorted(json_loot):
            result.issues.append(DriftIssue(
                category="bosses",
                entity_id=boss_id,
                field="loot",
                python_value=sorted(py_loot),
                json_value=sorted(json_loot),
                severity="warning",
            ))

    # Check for bosses in JSON but not in Python
    python_ids = {normalize_id(bt) for bt in boss_stats.keys()}
    for json_id in json_bosses.keys():
        if json_id not in python_ids:
            result.missing_in_python.append(("bosses", json_id))

    return result


def validate_floor_pools(py_constants: dict, json_data: dict) -> ValidationResult:
    """Validate floor enemy pool data."""
    result = ValidationResult()

    py_pools = py_constants["floor_pools"]
    json_pools = {p["floor"]: p for p in json_data.get("floor_pools", [])}

    for floor, py_enemies in py_pools.items():
        if floor not in json_pools:
            result.missing_in_json.append(("floor_pools", f"floor_{floor}"))
            continue

        json_pool = json_pools[floor]
        json_enemies = {e["enemy_id"]: e["weight"] for e in json_pool.get("enemies", [])}

        # Build Python enemy weights
        py_enemy_weights = {}
        for enemy_type, weight in py_enemies:
            enemy_id = normalize_id(enemy_type)
            py_enemy_weights[enemy_id] = weight

        # Compare weights
        all_enemy_ids = set(py_enemy_weights.keys()) | set(json_enemies.keys())

        for enemy_id in all_enemy_ids:
            py_weight = py_enemy_weights.get(enemy_id)
            json_weight = json_enemies.get(enemy_id)

            if py_weight is None:
                result.issues.append(DriftIssue(
                    category="floor_pools",
                    entity_id=f"floor_{floor}",
                    field=f"enemy:{enemy_id}",
                    python_value="(missing)",
                    json_value=json_weight,
                    severity="error",
                ))
            elif json_weight is None:
                result.issues.append(DriftIssue(
                    category="floor_pools",
                    entity_id=f"floor_{floor}",
                    field=f"enemy:{enemy_id}",
                    python_value=py_weight,
                    json_value="(missing)",
                    severity="error",
                ))
            elif py_weight != json_weight:
                result.issues.append(DriftIssue(
                    category="floor_pools",
                    entity_id=f"floor_{floor}",
                    field=f"enemy:{enemy_id}:weight",
                    python_value=py_weight,
                    json_value=json_weight,
                    severity="warning",
                ))

    return result


def merge_results(*results: ValidationResult) -> ValidationResult:
    """Merge multiple validation results."""
    merged = ValidationResult()
    for r in results:
        merged.issues.extend(r.issues)
        merged.missing_in_json.extend(r.missing_in_json)
        merged.missing_in_python.extend(r.missing_in_python)
    return merged


def print_report(result: ValidationResult, verbose: bool = False):
    """Print human-readable validation report."""
    if not result.has_errors:
        print("[OK] No data drift detected")
        return

    print("=" * 60)
    print("DATA DRIFT VALIDATION REPORT")
    print("=" * 60)

    # Missing entries
    if result.missing_in_json:
        print("\n[ERROR] MISSING IN JSON SEEDS (exist in Python only):")
        for category, entity_id in result.missing_in_json:
            print(f"  - {category}/{entity_id}")

    if result.missing_in_python:
        print("\n[ERROR] MISSING IN PYTHON CONSTANTS (exist in JSON only):")
        for category, entity_id in result.missing_in_python:
            print(f"  - {category}/{entity_id}")

    # Value mismatches
    errors = [i for i in result.issues if i.severity == "error"]
    warnings = [i for i in result.issues if i.severity == "warning"]

    if errors:
        print("\n[ERROR] VALUE MISMATCHES:")
        for issue in errors:
            print(f"  [{issue.category}] {issue.entity_id}.{issue.field}")
            print(f"    Python: {issue.python_value}")
            print(f"    JSON:   {issue.json_value}")

    if warnings and verbose:
        print("\n[WARN] VALUE MISMATCHES (warnings):")
        for issue in warnings:
            print(f"  [{issue.category}] {issue.entity_id}.{issue.field}")
            print(f"    Python: {issue.python_value}")
            print(f"    JSON:   {issue.json_value}")

    print("\n" + "=" * 60)
    print(f"SUMMARY: {result.error_count} errors, {result.warning_count} warnings")
    print("=" * 60)


def print_json_report(result: ValidationResult):
    """Print JSON-formatted validation report."""
    report = {
        "status": "pass" if not result.has_errors else "fail",
        "error_count": result.error_count,
        "warning_count": result.warning_count,
        "missing_in_json": [
            {"category": cat, "id": eid}
            for cat, eid in result.missing_in_json
        ],
        "missing_in_python": [
            {"category": cat, "id": eid}
            for cat, eid in result.missing_in_python
        ],
        "issues": [
            {
                "category": i.category,
                "entity_id": i.entity_id,
                "field": i.field,
                "python_value": i.python_value,
                "json_value": i.json_value,
                "severity": i.severity,
            }
            for i in result.issues
        ],
    }
    print(json.dumps(report, indent=2))


def main():
    parser = argparse.ArgumentParser(
        description="Validate data drift between Python constants and JSON seeds"
    )
    parser.add_argument(
        "--verbose", "-v",
        action="store_true",
        help="Show warnings in addition to errors"
    )
    parser.add_argument(
        "--json",
        action="store_true",
        help="Output results as JSON"
    )
    parser.add_argument(
        "--fail-on-warnings",
        action="store_true",
        help="Exit with error code if warnings are found"
    )
    args = parser.parse_args()

    # Load Python constants
    py_constants = load_python_constants()
    if py_constants is None:
        print("Failed to load Python constants", file=sys.stderr)
        sys.exit(2)

    # Load JSON seeds
    enemies_json = load_json_seed("enemies.json")
    bosses_json = load_json_seed("bosses.json")

    if enemies_json is None:
        print("Failed to load enemies.json", file=sys.stderr)
        sys.exit(2)
    if bosses_json is None:
        print("Failed to load bosses.json", file=sys.stderr)
        sys.exit(2)

    # Run validations
    results = []
    results.append(validate_enemies(py_constants, enemies_json))
    results.append(validate_bosses(py_constants, bosses_json))
    results.append(validate_floor_pools(py_constants, enemies_json))

    final_result = merge_results(*results)

    # Output report
    if args.json:
        print_json_report(final_result)
    else:
        print_report(final_result, verbose=args.verbose)

    # Determine exit code
    if final_result.error_count > 0:
        sys.exit(1)
    elif args.fail_on_warnings and final_result.warning_count > 0:
        sys.exit(1)
    else:
        sys.exit(0)


if __name__ == "__main__":
    main()
