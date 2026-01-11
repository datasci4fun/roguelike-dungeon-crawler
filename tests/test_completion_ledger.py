"""Validation tests for Completion Ledger and Derived Victory Legacy.

Tests:
1. CompletionLedger serialization is deterministic
2. derive_victory_legacy() is deterministic
3. resolve_ending() returns correct endings
4. Hybrid tie-break produces expected results
"""
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from src.story.completion import (
    CompletionLedger,
    VictoryLegacy,
    VictoryLegacyResult,
    EndingId,
    derive_victory_legacy,
    resolve_ending,
    COMBAT_HIGH_THRESHOLD,
    LORE_HIGH_THRESHOLD,
)


def test_ledger_serialization():
    """Test that CompletionLedger serialization is deterministic."""
    print("\n=== Testing Ledger Serialization ===")

    # Create ledger with some data
    ledger = CompletionLedger()
    ledger.record_floor_cleared(1)
    ledger.record_floor_cleared(2)
    ledger.record_warden_defeated("GOBLIN_KING")
    ledger.record_lore_found("journal_adventurer_1")
    ledger.record_lore_found("journal_adventurer_2")
    ledger.record_artifact_collected("DUPLICATE_SEAL")
    ledger.record_ghost_encounter("ECHO")
    ledger.record_kill(is_elite=False)
    ledger.record_kill(is_elite=True)
    ledger.record_damage(15)
    ledger.record_potion_used()

    # Serialize
    data = ledger.to_dict()

    # Deserialize
    restored = CompletionLedger.from_dict(data)

    # Verify all fields match
    assert restored.floors_cleared == ledger.floors_cleared, "floors_cleared mismatch"
    assert restored.wardens_defeated == ledger.wardens_defeated, "wardens_defeated mismatch"
    assert restored.lore_found_ids == ledger.lore_found_ids, "lore_found_ids mismatch"
    assert restored.artifacts_collected_ids == ledger.artifacts_collected_ids, "artifacts mismatch"
    assert restored.ghost_encounters == ledger.ghost_encounters, "ghost_encounters mismatch"
    assert restored.total_kills == ledger.total_kills, "total_kills mismatch"
    assert restored.elite_kills == ledger.elite_kills, "elite_kills mismatch"
    assert restored.damage_taken == ledger.damage_taken, "damage_taken mismatch"
    assert restored.potions_used == ledger.potions_used, "potions_used mismatch"

    # Verify serialization is deterministic (same input = same output)
    data2 = ledger.to_dict()
    # Convert sets to sorted lists for comparison
    assert sorted(data['floors_cleared']) == sorted(data2['floors_cleared'])
    assert sorted(data['lore_found_ids']) == sorted(data2['lore_found_ids'])

    print("PASS: Ledger serialization is deterministic and reversible")
    return True


def test_derive_legacy_determinism():
    """Test that derive_victory_legacy() is deterministic."""
    print("\n=== Testing Derived Legacy Determinism ===")

    # Same input should always produce same output
    ledger = CompletionLedger()
    for i in range(25):  # High combat
        ledger.record_kill()
    for i in range(3):  # Low lore
        ledger.record_lore_found(f"lore_{i}")

    result1 = derive_victory_legacy(ledger)
    result2 = derive_victory_legacy(ledger)

    assert result1.primary == result2.primary, "Legacy primary mismatch"
    assert result1.secondary_tag == result2.secondary_tag, "Legacy secondary mismatch"

    print(f"  Same ledger produces same result: {result1.primary.name}")
    print("PASS: derive_victory_legacy() is deterministic")
    return True


def test_legacy_rules():
    """Test that legacy derivation follows documented rules."""
    print("\n=== Testing Legacy Rules ===")

    # Test 1: Low combat + low lore = Beacon
    ledger1 = CompletionLedger()
    for i in range(10):  # Below threshold
        ledger1.record_kill()
    for i in range(2):  # Below threshold
        ledger1.record_lore_found(f"lore_{i}")

    result1 = derive_victory_legacy(ledger1)
    assert result1.primary == VictoryLegacy.BEACON, f"Expected BEACON, got {result1.primary.name}"
    assert result1.secondary_tag is None, "Beacon should have no secondary"
    print(f"  Low combat ({ledger1.total_kills}) + low lore ({ledger1.lore_count}) = BEACON")

    # Test 2: High combat + low lore = Champion
    ledger2 = CompletionLedger()
    for i in range(25):  # Above threshold
        ledger2.record_kill()
    for i in range(2):  # Below threshold
        ledger2.record_lore_found(f"lore_{i}")

    result2 = derive_victory_legacy(ledger2)
    assert result2.primary == VictoryLegacy.CHAMPION, f"Expected CHAMPION, got {result2.primary.name}"
    assert result2.secondary_tag is None, "Champion-only should have no secondary"
    print(f"  High combat ({ledger2.total_kills}) + low lore ({ledger2.lore_count}) = CHAMPION")

    # Test 3: Low combat + high lore = Archivist
    ledger3 = CompletionLedger()
    for i in range(10):  # Below threshold
        ledger3.record_kill()
    for i in range(8):  # Above threshold
        ledger3.record_lore_found(f"lore_{i}")

    result3 = derive_victory_legacy(ledger3)
    assert result3.primary == VictoryLegacy.ARCHIVIST, f"Expected ARCHIVIST, got {result3.primary.name}"
    assert result3.secondary_tag is None, "Archivist-only should have no secondary"
    print(f"  Low combat ({ledger3.total_kills}) + high lore ({ledger3.lore_count}) = ARCHIVIST")

    print("PASS: Legacy rules produce expected results")
    return True


def test_hybrid_tiebreak():
    """Test hybrid tie-break when both combat and lore are high."""
    print("\n=== Testing Hybrid Tie-break ===")

    # Test 1: Combat higher -> Champion with archivist_mark
    ledger1 = CompletionLedger()
    for i in range(30):  # Higher
        ledger1.record_kill()
    for i in range(10):  # Also high but lower
        ledger1.record_lore_found(f"lore_{i}")

    result1 = derive_victory_legacy(ledger1)
    assert result1.primary == VictoryLegacy.CHAMPION, f"Expected CHAMPION, got {result1.primary.name}"
    assert result1.secondary_tag == "archivist_mark", f"Expected archivist_mark, got {result1.secondary_tag}"
    print(f"  Combat ({ledger1.total_kills}) > lore ({ledger1.lore_count}) = CHAMPION + archivist_mark")

    # Test 2: Lore higher -> Archivist with champion_edge
    ledger2 = CompletionLedger()
    for i in range(22):  # High but lower
        ledger2.record_kill()
    for i in range(25):  # Higher
        ledger2.record_lore_found(f"lore_{i}")

    result2 = derive_victory_legacy(ledger2)
    assert result2.primary == VictoryLegacy.ARCHIVIST, f"Expected ARCHIVIST, got {result2.primary.name}"
    assert result2.secondary_tag == "champion_edge", f"Expected champion_edge, got {result2.secondary_tag}"
    print(f"  Lore ({ledger2.lore_count}) > combat ({ledger2.total_kills}) = ARCHIVIST + champion_edge")

    # Test 3: Exactly equal -> Champion (combat >= lore)
    ledger3 = CompletionLedger()
    for i in range(25):
        ledger3.record_kill()
    for i in range(25):
        ledger3.record_lore_found(f"lore_{i}")

    result3 = derive_victory_legacy(ledger3)
    assert result3.primary == VictoryLegacy.CHAMPION, f"Expected CHAMPION on tie, got {result3.primary.name}"
    print(f"  Combat ({ledger3.total_kills}) == lore ({ledger3.lore_count}) = CHAMPION (tie goes to combat)")

    print("PASS: Hybrid tie-break produces expected results")
    return True


def test_resolve_ending():
    """Test that resolve_ending() returns correct endings."""
    print("\n=== Testing Ending Resolution ===")

    # Test 1: Dead player = DEATH_STANDARD
    ledger1 = CompletionLedger()
    result1 = resolve_ending(ledger1, player_alive=False)
    assert result1 == EndingId.DEATH_STANDARD, f"Expected DEATH_STANDARD, got {result1.name}"
    print("  Dead player = DEATH_STANDARD")

    # Test 2: Alive player without secret = VICTORY_STANDARD
    ledger2 = CompletionLedger()
    result2 = resolve_ending(ledger2, player_alive=True)
    assert result2 == EndingId.VICTORY_STANDARD, f"Expected VICTORY_STANDARD, got {result2.name}"
    print("  Alive player (no secret) = VICTORY_STANDARD")

    # Test 3: Secret ending is unreachable without flag
    ledger3 = CompletionLedger()
    for i in range(8):
        ledger3.record_floor_cleared(i + 1)
        ledger3.record_warden_defeated(f"BOSS_{i}")
    for i in range(15):
        ledger3.record_lore_found(f"lore_{i}")

    result3 = resolve_ending(ledger3, player_alive=True)
    assert result3 == EndingId.VICTORY_STANDARD, "Secret ending should be unreachable"
    print("  100% completion (no flag) = VICTORY_STANDARD (secret unreachable)")

    # Test 4: Secret ending with flag (future-proof test)
    ledger4 = CompletionLedger()
    for i in range(8):
        ledger4.record_floor_cleared(i + 1)
        ledger4.record_warden_defeated(f"BOSS_{i}")
    for i in range(15):
        ledger4.record_lore_found(f"lore_{i}")
    ledger4.secrets_found.add("SECRET_ENDING_ENABLED")

    result4 = resolve_ending(ledger4, player_alive=True)
    assert result4 == EndingId.VICTORY_SECRET, f"Expected VICTORY_SECRET, got {result4.name}"
    print("  100% completion + secret flag = VICTORY_SECRET")

    print("PASS: Ending resolution works correctly")
    return True


def test_legacy_result_serialization():
    """Test that VictoryLegacyResult serializes correctly."""
    print("\n=== Testing Legacy Result Serialization ===")

    # With secondary
    result1 = VictoryLegacyResult(primary=VictoryLegacy.CHAMPION, secondary_tag="archivist_mark")
    data1 = result1.to_dict()
    restored1 = VictoryLegacyResult.from_dict(data1)
    assert restored1.primary == result1.primary
    assert restored1.secondary_tag == result1.secondary_tag
    print("  Champion + archivist_mark serializes correctly")

    # Without secondary
    result2 = VictoryLegacyResult(primary=VictoryLegacy.BEACON)
    data2 = result2.to_dict()
    restored2 = VictoryLegacyResult.from_dict(data2)
    assert restored2.primary == result2.primary
    assert restored2.secondary_tag is None
    print("  Beacon (no secondary) serializes correctly")

    print("PASS: VictoryLegacyResult serialization works")
    return True


def main():
    """Run all validation tests."""
    print("=" * 60)
    print("Completion Ledger & Derived Legacy Validation")
    print("=" * 60)
    print(f"Thresholds: Combat >= {COMBAT_HIGH_THRESHOLD}, Lore >= {LORE_HIGH_THRESHOLD}")

    results = []
    results.append(("Serialization", test_ledger_serialization()))
    results.append(("Determinism", test_derive_legacy_determinism()))
    results.append(("Legacy Rules", test_legacy_rules()))
    results.append(("Hybrid Tie-break", test_hybrid_tiebreak()))
    results.append(("Ending Resolution", test_resolve_ending()))
    results.append(("Result Serialization", test_legacy_result_serialization()))

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
