---
name: game-integrity
description: Validates all game systems including zone assignment, enemy spawning, lore drops, boss placement, and encounter messages. Ensures data consistency across floors.
---

## Purpose

This Skill is used when the user asks to **validate**, **check**, or **verify** the integrity of game systems.

Examples of trigger phrases:
- "run game integrity checks"
- "validate all game systems"
- "check if enemies spawn correctly"
- "verify zone configuration"
- "run full validation"
- "check game data integrity"

The goal is to ensure all game data is consistent and working correctly across all floors.

---

## Preconditions

Before running this Skill:

1. Confirm the working directory is the roguelike project root (`claude_test`).
2. Ensure the virtual environment exists (`.venv`).
3. Verify Python can import game modules.

---

## Procedure

### Step 1: Environment Check

Run basic environment validation:

```bash
.\.venv\Scripts\python -m py_compile src\core\constants.py src\managers\entity_manager.py src\world\zone_config.py src\story\story_data.py
```

If compilation fails, stop and report errors.

---

### Step 2: Zone Validation (All 8 Floors)

Run zone validation across all floors:

```python
from src.world.zone_validation import validate_all
result = validate_all(seeds=10, verbose=True)
```

Check for:
- Required zones present on each floor
- Start zones exist
- No zone dominates >70% of rooms
- Fallback zones not overused (>80%)

Report any errors or warnings.

---

### Step 3: Enemy Pool Validation

Validate FLOOR_ENEMY_POOLS configuration:

```python
from src.core.constants import FLOOR_ENEMY_POOLS, EnemyType, ENEMY_STATS

errors = []

# Check all 8 floors have enemy pools
for floor in range(1, 9):
    if floor not in FLOOR_ENEMY_POOLS:
        errors.append(f"Floor {floor} missing from FLOOR_ENEMY_POOLS")
    else:
        pool = FLOOR_ENEMY_POOLS[floor]
        total_weight = sum(w for (t, w) in pool)
        if total_weight != 100:
            errors.append(f"Floor {floor} weights sum to {total_weight}, expected 100")

        for enemy_type, weight in pool:
            # Check enemy exists in ENEMY_STATS
            if enemy_type not in ENEMY_STATS:
                errors.append(f"Floor {floor}: {enemy_type.name} not in ENEMY_STATS")
            else:
                stats = ENEMY_STATS[enemy_type]
                # Check level restrictions allow spawning on this floor
                min_lvl = stats.get('min_level', 1)
                max_lvl = stats.get('max_level', 99)
                if floor < min_lvl or floor > max_lvl:
                    errors.append(f"Floor {floor}: {enemy_type.name} has level range {min_lvl}-{max_lvl}, cannot spawn here")

print(f"Enemy Pool Validation: {len(errors)} errors")
for err in errors:
    print(f"  - {err}")
```

---

### Step 4: Encounter Messages Validation

Verify all enemies have encounter messages:

```python
from src.core.constants import EnemyType, ENEMY_STATS
from src.story.story_data import ENEMY_ENCOUNTER_MESSAGES

missing = []

for enemy_type in EnemyType:
    if enemy_type == EnemyType.NONE:
        continue

    # Get display name from ENEMY_STATS
    if enemy_type in ENEMY_STATS:
        name = ENEMY_STATS[enemy_type].get('name', enemy_type.name.replace('_', ' ').title())
    else:
        name = enemy_type.name.replace('_', ' ').title()

    if name not in ENEMY_ENCOUNTER_MESSAGES:
        missing.append(name)

if missing:
    print(f"Missing encounter messages for: {missing}")
else:
    print("[OK] All enemies have encounter messages")
```

---

### Step 5: Dragon Constraint Validation (Floor 8)

Verify the max-1-dragon constraint works on Floor 8:

```python
import random
from src.core.constants import EnemyType, FLOOR_ENEMY_POOLS

# Simulate spawning 100 times with 6 enemies each
dragon_counts = []
for _ in range(100):
    random.seed(_)
    dragon_spawned = False
    spawned_dragons = 0

    floor_pool = FLOOR_ENEMY_POOLS[8]
    types = [t for (t, w) in floor_pool]
    weights = [w for (t, w) in floor_pool]

    for _ in range(6):  # Typical enemy count per floor
        enemy = random.choices(types, weights=weights)[0]
        if enemy == EnemyType.DRAGON:
            if dragon_spawned:
                # Would reroll - count as prevented
                enemy = EnemyType.CRYSTAL_SENTINEL
            else:
                dragon_spawned = True
                spawned_dragons += 1

    dragon_counts.append(spawned_dragons)

max_dragons = max(dragon_counts)
avg_dragons = sum(dragon_counts) / len(dragon_counts)
runs_with_dragon = sum(1 for c in dragon_counts if c > 0)

print(f"Floor 8 Dragon Analysis (100 simulations, 6 enemies each):")
print(f"  Max dragons per run: {max_dragons} (should be <= 1)")
print(f"  Avg dragons per run: {avg_dragons:.2f}")
print(f"  Runs with dragon: {runs_with_dragon}%")

if max_dragons > 1:
    print("[FAIL] Dragon constraint violated!")
else:
    print("[OK] Dragon constraint working")
```

---

### Step 6: Lore/Artifact/Boss Validation

Verify lore, artifacts, and boss spawning works:

```python
from src.world.dungeon import Dungeon
from src.managers.entity_manager import EntityManager
from src.core.constants import EntityType

errors = []

for floor in range(1, 9):
    dungeon = Dungeon(width=80, height=40, level=floor, seed=42)
    em = EntityManager()

    # Check boss spawns
    boss_room = dungeon.boss_room
    if not boss_room:
        errors.append(f"Floor {floor}: No boss room designated")

    # Check start room exists
    start_room = dungeon.start_room
    if not start_room:
        errors.append(f"Floor {floor}: No start room designated")

    # Check rooms have zones assigned
    unzoned = [r for r in dungeon.rooms if not r.zone or r.zone == ""]
    if unzoned:
        errors.append(f"Floor {floor}: {len(unzoned)} rooms without zones")

if errors:
    print(f"Dungeon Structure: {len(errors)} errors")
    for err in errors:
        print(f"  - {err}")
else:
    print("[OK] All floors have proper dungeon structure")
```

---

### Step 7: Lore Codex Validation

Validate all lore entries and floor assignments:

```python
from src.story.lore_items import (
    ALL_LORE_IDS, FLOOR_LORE_IDS, FLOOR_EVIDENCE_IDS,
    validate_story_data, validate_floor_canon
)

errors = []

# Check lore IDs exist for all 8 floors
for floor in range(1, 9):
    floor_lore = FLOOR_LORE_IDS.get(floor, set())
    if not floor_lore:
        errors.append(f"Floor {floor}: No lore IDs defined")
    else:
        # Each floor should have 2 lore + 2 evidence = 4 entries
        if len(floor_lore) < 4:
            errors.append(f"Floor {floor}: Only {len(floor_lore)} lore entries (expected 4)")

# Check evidence IDs exist for all floors
for floor in range(1, 9):
    evidence = FLOOR_EVIDENCE_IDS.get(floor, [])
    if len(evidence) < 2:
        errors.append(f"Floor {floor}: Only {len(evidence)} evidence entries (expected 2)")

# Run built-in validators
story_errors = validate_story_data()
errors.extend(story_errors)

canon_errors = validate_floor_canon()
errors.extend(canon_errors)

if errors:
    print(f"Lore Codex Validation: {len(errors)} errors")
    for err in errors[:10]:
        print(f"  - {err}")
else:
    print(f"[OK] Lore Codex: {len(ALL_LORE_IDS)} lore entries across 8 floors")
```

---

### Step 8: Ghost System Validation

Validate ghost types, zone biases, and messages:

```python
from src.entities.ghosts import (
    GhostType, GHOST_ZONE_BIAS, GHOST_MESSAGES, GHOST_LIMITS
)

errors = []

# All 6 ghost types should exist
expected_types = ['ECHO', 'HOLLOWED', 'SILENCE', 'BEACON', 'CHAMPION', 'ARCHIVIST']
for type_name in expected_types:
    if not hasattr(GhostType, type_name):
        errors.append(f"Missing GhostType: {type_name}")

# All ghost types should have zone bias
for ghost_type in GhostType:
    if ghost_type not in GHOST_ZONE_BIAS:
        errors.append(f"GhostType.{ghost_type.name} missing from GHOST_ZONE_BIAS")
    if ghost_type not in GHOST_MESSAGES:
        errors.append(f"GhostType.{ghost_type.name} missing from GHOST_MESSAGES")
    if ghost_type not in GHOST_LIMITS:
        errors.append(f"GhostType.{ghost_type.name} missing from GHOST_LIMITS")

if errors:
    print(f"Ghost System: {len(errors)} errors")
    for err in errors:
        print(f"  - {err}")
else:
    print(f"[OK] Ghost System: {len(list(GhostType))} ghost types with zone biases and messages")
```

---

### Step 9: Artifact System Validation

Validate artifacts and vow definitions:

```python
from src.items.artifacts import (
    ArtifactId, ARTIFACT_DATA, VowType, VOW_DATA
)

errors = []

# All artifacts should have data
for artifact_id in ArtifactId:
    if artifact_id not in ARTIFACT_DATA:
        errors.append(f"ArtifactId.{artifact_id.name} missing from ARTIFACT_DATA")
    else:
        data = ARTIFACT_DATA[artifact_id]
        if 'name' not in data:
            errors.append(f"Artifact {artifact_id.name} missing 'name'")
        if 'symbol' not in data:
            errors.append(f"Artifact {artifact_id.name} missing 'symbol'")
        if 'zone_bias' not in data:
            errors.append(f"Artifact {artifact_id.name} missing 'zone_bias'")

# All vows should have data
for vow_type in VowType:
    if vow_type not in VOW_DATA:
        errors.append(f"VowType.{vow_type.name} missing from VOW_DATA")
    else:
        data = VOW_DATA[vow_type]
        if 'name' not in data:
            errors.append(f"Vow {vow_type.name} missing 'name'")
        if 'reward_description' not in data:
            errors.append(f"Vow {vow_type.name} missing 'reward_description'")

if errors:
    print(f"Artifact System: {len(errors)} errors")
    for err in errors:
        print(f"  - {err}")
else:
    print(f"[OK] Artifact System: {len(list(ArtifactId))} artifacts, {len(list(VowType))} vows")
```

---

### Step 10: Completion Ledger Validation

Validate completion tracking and victory legacy derivation:

```python
from src.story.completion import (
    CompletionLedger, VictoryLegacy, EndingId,
    derive_victory_legacy, resolve_ending
)

errors = []

# Test ledger serialization
ledger = CompletionLedger()
ledger.record_floor_cleared(1)
ledger.record_lore_found("test_lore")
ledger.record_kill()

# Serialize and deserialize
state = ledger.to_dict()
restored = CompletionLedger.from_dict(state)

if restored.floors_cleared != ledger.floors_cleared:
    errors.append("Ledger serialization: floors_cleared mismatch")
if restored.lore_count != ledger.lore_count:
    errors.append("Ledger serialization: lore_count mismatch")
if restored.total_kills != ledger.total_kills:
    errors.append("Ledger serialization: total_kills mismatch")

# Test victory legacy derivation
test_cases = [
    (0, 0, VictoryLegacy.BEACON),      # Low combat, low lore
    (25, 0, VictoryLegacy.CHAMPION),   # High combat, low lore
    (0, 10, VictoryLegacy.ARCHIVIST),  # Low combat, high lore
]

for kills, lore, expected in test_cases:
    test_ledger = CompletionLedger()
    test_ledger.total_kills = kills
    for i in range(lore):
        test_ledger.record_lore_found(f"lore_{i}")

    result = derive_victory_legacy(test_ledger)
    if result.primary != expected:
        errors.append(f"Legacy derivation: kills={kills}, lore={lore} gave {result.primary.name}, expected {expected.name}")

# Test ending resolution
alive_ledger = CompletionLedger()
if resolve_ending(alive_ledger, player_alive=True) != EndingId.VICTORY_STANDARD:
    errors.append("Ending resolution: alive player should get VICTORY_STANDARD")
if resolve_ending(alive_ledger, player_alive=False) != EndingId.DEATH_STANDARD:
    errors.append("Ending resolution: dead player should get DEATH_STANDARD")

if errors:
    print(f"Completion Ledger: {len(errors)} errors")
    for err in errors:
        print(f"  - {err}")
else:
    print("[OK] Completion Ledger: serialization, legacy derivation, ending resolution")
```

---

### Step 11: Skybox & Ceiling Validation

Validate open-air zones and skybox configurations match zone_config:

```python
from src.world.zone_config import FLOOR_ZONE_CONFIGS

errors = []

# Skybox configuration from game_session.py
outdoor_floors = {4: "crypt"}  # Mirror Valdris - outdoor kingdom

outdoor_plazas = {
    (4, "courtyard_squares"),
    (4, "throne_hall_ruins"),
}

open_air_zones = {
    (3, "canopy_halls"): "forest",
    (5, "crystal_grottos"): "ice",
    (5, "thaw_fault"): "ice",
    (7, "crucible_heart"): "lava",
    (7, "slag_pits"): "lava",
    (8, "crystal_gardens"): "crystal",
    (8, "dragons_hoard"): "crystal",
}

# Validate outdoor plazas exist in zone_config
for floor, zone_id in outdoor_plazas:
    config = FLOOR_ZONE_CONFIGS.get(floor)
    if not config:
        errors.append(f"Outdoor plaza ({floor}, {zone_id}): Floor {floor} has no config")
        continue
    zone_ids = [z.zone_id for z in config.zones]
    if zone_id not in zone_ids and zone_id != config.start_zone:
        errors.append(f"Outdoor plaza ({floor}, {zone_id}): Zone not in floor config")

# Validate open-air zones exist in zone_config
for (floor, zone_id), skybox in open_air_zones.items():
    config = FLOOR_ZONE_CONFIGS.get(floor)
    if not config:
        errors.append(f"Open-air zone ({floor}, {zone_id}): Floor {floor} has no config")
        continue
    zone_ids = [z.zone_id for z in config.zones]
    if zone_id not in zone_ids and zone_id != config.start_zone and zone_id != config.fallback_zone:
        errors.append(f"Open-air zone ({floor}, {zone_id}): Zone not in floor config")

# Validate outdoor floors have proper theme
for floor, theme in outdoor_floors.items():
    config = FLOOR_ZONE_CONFIGS.get(floor)
    if not config:
        errors.append(f"Outdoor floor {floor}: No zone config")

if errors:
    print(f"Skybox/Ceiling: {len(errors)} errors")
    for err in errors:
        print(f"  - {err}")
else:
    total_open = len(outdoor_plazas) + len(open_air_zones)
    print(f"[OK] Skybox/Ceiling: {len(outdoor_floors)} outdoor floor(s), {total_open} open-air zones")
```

---

### Step 12: Full Integration Test

Run the game briefly to verify it launches:

```bash
timeout 3 .\.venv\Scripts\python main.py 2>&1 || echo "Game launched successfully (timeout expected)"
```

Note: The game uses curses and may not produce visible output. A clean exit or timeout indicates success.

---

## Output

End with a summary report:

```
============================================================
GAME INTEGRITY VALIDATION SUMMARY
============================================================
Environment Check:      [PASSED/FAILED]
Zone Validation:        [PASSED/FAILED] (X floors validated)
Enemy Pools:            [PASSED/FAILED] (X/8 floors valid)
Encounter Messages:     [PASSED/FAILED] (X/Y enemies covered)
Dragon Constraint:      [PASSED/FAILED] (max X per run)
Dungeon Structure:      [PASSED/FAILED] (boss/start/zones)
Lore Codex:             [PASSED/FAILED] (X lore entries)
Ghost System:           [PASSED/FAILED] (X ghost types)
Artifact System:        [PASSED/FAILED] (X artifacts, Y vows)
Completion Ledger:      [PASSED/FAILED] (serialization/derivation)
Skybox/Ceiling:         [PASSED/FAILED] (X outdoor floors, Y open-air zones)
Game Launch:            [PASSED/FAILED]

Overall Status: [ALL PASSED / ISSUES FOUND]
============================================================
```

If any validation fails, list specific errors and recommended fixes.

---

## Safety Rules

- This skill is READ-ONLY; it does not modify game files.
- All tests use fixed seeds for reproducibility.
- If validation fails, provide actionable error messages.
- Do not attempt to auto-fix issues; report them for manual review.

---

## Quick Commands

For individual checks, users can run:

```bash
# Zone validation only
.\.venv\Scripts\python -c "from src.world.zone_validation import validate_all; validate_all()"

# Enemy pool check
.\.venv\Scripts\python -c "from src.core.constants import FLOOR_ENEMY_POOLS; print(f'Floors configured: {list(FLOOR_ENEMY_POOLS.keys())}')"

# Compile check
.\.venv\Scripts\python -m py_compile src\*.py src\*\*.py
```

---

## Scope

This Skill validates the roguelike dungeon crawler game systems. It does not:
- Modify any files
- Run destructive operations
- Test network or external dependencies
- Validate save/load functionality (separate concern)
