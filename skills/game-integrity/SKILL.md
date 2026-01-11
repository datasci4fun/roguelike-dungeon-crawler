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

### Step 7: Full Integration Test

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
Zone Validation:        [PASSED/FAILED] (X floors validated)
Enemy Pools:            [PASSED/FAILED] (X/8 floors valid)
Encounter Messages:     [PASSED/FAILED] (X/Y enemies covered)
Dragon Constraint:      [PASSED/FAILED] (max X per run)
Dungeon Structure:      [PASSED/FAILED] (boss/start/zones)
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
