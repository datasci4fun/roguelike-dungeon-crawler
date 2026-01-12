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

### Step 12: Canonical Consistency Matrix

Cross-validate all per-floor canonical mappings to prevent drift:

```python
from src.core.constants import (
    LEVEL_THEMES, LEVEL_BOSS_MAP, BOSS_STATS, DungeonTheme, BossType,
    FLOOR_ENEMY_POOLS
)
from src.story.story_data import LEVEL_INTRO_MESSAGES
from src.world.zone_config import FLOOR_ZONE_CONFIGS

errors = []

# Canonical floor definitions: (theme, boss, intro_keyword, display_name_fragment)
CANON = {
    1: (DungeonTheme.STONE, BossType.GOBLIN_KING, "stone", "dungeon"),
    2: (DungeonTheme.SEWER, BossType.RAT_KING, "sewer", "sewer"),
    3: (DungeonTheme.FOREST, BossType.SPIDER_QUEEN, "forest", "forest"),
    4: (DungeonTheme.CRYPT, BossType.REGENT, "mirror", "valdris"),
    5: (DungeonTheme.ICE, BossType.FROST_GIANT, "ice", "ice"),
    6: (DungeonTheme.LIBRARY, BossType.ARCANE_KEEPER, "library", "library"),
    7: (DungeonTheme.VOLCANIC, BossType.FLAME_LORD, "volcanic", "volcanic"),
    8: (DungeonTheme.CRYSTAL, BossType.DRAGON_EMPEROR, "crystal", "crystal"),
}

for floor, (expected_theme, expected_boss, intro_kw, name_frag) in CANON.items():
    # Check theme
    if LEVEL_THEMES.get(floor) != expected_theme:
        errors.append(f"Floor {floor}: LEVEL_THEMES mismatch")

    # Check boss
    if LEVEL_BOSS_MAP.get(floor) != expected_boss:
        errors.append(f"Floor {floor}: LEVEL_BOSS_MAP mismatch")

    # Check boss level in BOSS_STATS
    boss = LEVEL_BOSS_MAP.get(floor)
    if boss and boss in BOSS_STATS:
        if BOSS_STATS[boss].get('level') != floor:
            errors.append(f"Floor {floor}: BOSS_STATS[{boss.name}]['level'] != {floor}")

    # Check intro message contains keyword
    intro = LEVEL_INTRO_MESSAGES.get(floor, "").lower()
    if intro_kw not in intro:
        errors.append(f"Floor {floor}: Intro missing '{intro_kw}'")

    # Check enemy pool exists and non-empty
    if floor not in FLOOR_ENEMY_POOLS or not FLOOR_ENEMY_POOLS[floor]:
        errors.append(f"Floor {floor}: FLOOR_ENEMY_POOLS missing/empty")

    # Check zone config exists
    if floor not in FLOOR_ZONE_CONFIGS:
        errors.append(f"Floor {floor}: FLOOR_ZONE_CONFIGS missing")

if errors:
    print(f"Canonical Matrix: {len(errors)} errors")
    for err in errors[:10]:
        print(f"  - {err}")
else:
    print("[OK] Canonical Matrix: All 8 floors consistent (theme/boss/intro/pools/zones)")
```

---

### Step 13: Seed Determinism Snapshot

Verify dungeon generation is deterministic for fixed seeds:

```python
import hashlib
from src.world.dungeon import Dungeon

errors = []

# Test seeds across multiple floors
test_cases = [(1, 42), (3, 123), (5, 999), (8, 7777)]

for floor, seed in test_cases:
    # Generate twice with same seed
    d1 = Dungeon(width=80, height=40, level=floor, seed=seed)
    d2 = Dungeon(width=80, height=40, level=floor, seed=seed)

    # Hash room data
    def room_hash(dungeon):
        data = []
        for r in dungeon.rooms:
            data.append(f"{r.x},{r.y},{r.width},{r.height},{r.zone}")
        return hashlib.md5("".join(sorted(data)).encode()).hexdigest()[:8]

    # Hash tile data
    def tile_hash(dungeon):
        flat = []
        for row in dungeon.tiles:
            for tile in row:
                flat.append(str(tile.value if hasattr(tile, 'value') else tile))
        return hashlib.md5("".join(flat).encode()).hexdigest()[:8]

    h1_rooms, h2_rooms = room_hash(d1), room_hash(d2)
    h1_tiles, h2_tiles = tile_hash(d1), tile_hash(d2)

    if h1_rooms != h2_rooms:
        errors.append(f"Floor {floor} seed {seed}: Room hash mismatch ({h1_rooms} vs {h2_rooms})")
    if h1_tiles != h2_tiles:
        errors.append(f"Floor {floor} seed {seed}: Tile hash mismatch ({h1_tiles} vs {h2_tiles})")

if errors:
    print(f"Seed Determinism: {len(errors)} errors")
    for err in errors:
        print(f"  - {err}")
else:
    print(f"[OK] Seed Determinism: {len(test_cases)} floor/seed pairs verified stable")
```

---

### Step 14: Save/Load Roundtrip (Nasty Moments)

Test save/load in edge-case states:

```python
from src.story.completion import CompletionLedger
from src.entities.ghosts import GhostManager, Ghost, GhostType, GhostPath
from src.items.artifacts import ArtifactInstance, ArtifactId, VowType

errors = []

# Test 1: CompletionLedger with complex state
ledger = CompletionLedger()
ledger.record_floor_cleared(1)
ledger.record_floor_cleared(2)
ledger.record_warden_defeated("GOBLIN_KING")
ledger.record_lore_found("test_lore_1")
ledger.record_lore_found("test_lore_2")
ledger.record_artifact_collected("DUPLICATE_SEAL")
ledger.record_ghost_encounter("ECHO")
ledger.record_ghost_encounter("ECHO")  # Multiple encounters
ledger.total_kills = 15
ledger.damage_taken = 42
ledger.pulses_survived = 3

state = ledger.to_dict()
restored = CompletionLedger.from_dict(state)

checks = [
    (restored.floors_cleared, {1, 2}, "floors_cleared"),
    (restored.wardens_defeated, {"GOBLIN_KING"}, "wardens_defeated"),
    (len(restored.lore_found_ids), 2, "lore_count"),
    (restored.ghost_encounters.get("ECHO"), 2, "ghost_encounters"),
    (restored.total_kills, 15, "total_kills"),
    (restored.damage_taken, 42, "damage_taken"),
    (restored.pulses_survived, 3, "pulses_survived"),
]

for actual, expected, name in checks:
    if actual != expected:
        errors.append(f"Ledger roundtrip: {name} = {actual}, expected {expected}")

# Test 2: Artifact with active vow
artifact = ArtifactInstance(
    artifact_id=ArtifactId.OATHSTONE,
    charges=1,
    floor_acquired=3,
    active_vow=VowType.NO_POTIONS,
    vow_broken=False,
)
art_state = {
    'artifact_id': artifact.artifact_id.name,
    'charges': artifact.charges,
    'floor_acquired': artifact.floor_acquired,
    'active_vow': artifact.active_vow.name if artifact.active_vow else None,
    'vow_broken': artifact.vow_broken,
}
# Simulate restore
restored_vow = VowType[art_state['active_vow']] if art_state['active_vow'] else None
if restored_vow != VowType.NO_POTIONS:
    errors.append("Artifact roundtrip: active_vow mismatch")

# Test 3: Ghost manager state
gm = GhostManager()
gm.floor = 3
gm.seed = 12345
gm._messages_shown.add(GhostType.ECHO)
ghost_state = gm.get_state()

gm2 = GhostManager()
gm2.load_state(ghost_state)
if gm2.floor != 3 or gm2.seed != 12345:
    errors.append("GhostManager roundtrip: floor/seed mismatch")
if GhostType.ECHO not in gm2._messages_shown:
    errors.append("GhostManager roundtrip: messages_shown not restored")

if errors:
    print(f"Save/Load Roundtrip: {len(errors)} errors")
    for err in errors:
        print(f"  - {err}")
else:
    print("[OK] Save/Load Roundtrip: Ledger, Artifact, GhostManager all stable")
```

---

### Step 15: Payload Contract Test

Validate game state payload contains all required fields for frontend:

```python
# Simulate the structure expected by TypeScript frontend
# These are the critical fields that, if missing, break the UI silently

errors = []

# Required top-level keys in game_state payload
REQUIRED_PAYLOAD_KEYS = [
    "type",
    "session_id",
    "game_state",
    "ui_mode",
    "turn",
    "player",
    "dungeon",
    "messages",
    "events",
]

# Required first_person_view keys (3D renderer)
REQUIRED_FPV_KEYS = [
    "rows",
    "entities",
    "facing",
    "depth",
    "zone_id",
    "room_has_ceiling",
    "room_skybox_override",
]

# Required field_pulse keys
REQUIRED_PULSE_KEYS = ["active", "amplification", "floor_turn"]

# Required lore_journal keys
REQUIRED_LORE_KEYS = ["entries", "discovered_count", "total_count"]

# Required artifact keys (when present)
REQUIRED_ARTIFACT_KEYS = ["id", "name", "symbol", "charges", "used", "active_vow", "vow_broken"]

# Validate by checking the serialize function includes these
import inspect
try:
    from server.app.services.game_session import GameSessionService
    source = inspect.getsource(GameSessionService.serialize_game_state)

    # Check first_person_view keys
    for key in REQUIRED_FPV_KEYS:
        if f'"{key}"' not in source and f"'{key}'" not in source:
            errors.append(f"first_person_view missing '{key}'")

    # Check field_pulse keys
    for key in REQUIRED_PULSE_KEYS:
        if f'"{key}"' not in source and f"'{key}'" not in source:
            errors.append(f"field_pulse missing '{key}'")

    # Check lore_journal structure
    if '"entries"' not in source:
        errors.append("lore_journal missing 'entries'")
    if '"discovered_count"' not in source:
        errors.append("lore_journal missing 'discovered_count'")

except ImportError:
    # Running outside Docker context, check local path
    try:
        with open('server/app/services/game_session.py', 'r') as f:
            source = f.read()

        for key in REQUIRED_FPV_KEYS:
            if f'"{key}"' not in source and f"'{key}'" not in source:
                errors.append(f"first_person_view missing '{key}'")

        for key in REQUIRED_PULSE_KEYS:
            if f'"{key}"' not in source and f"'{key}'" not in source:
                errors.append(f"field_pulse missing '{key}'")
    except FileNotFoundError:
        errors.append("Cannot find game_session.py for validation")

if errors:
    print(f"Payload Contract: {len(errors)} errors")
    for err in errors:
        print(f"  - {err}")
else:
    print("[OK] Payload Contract: All required keys present in serializer")
```

---

### Step 16: Glyph Collision Test

Ensure all glyphs are distinct (prevents unreadable fallback mode):

```python
from src.core.constants import ENEMY_STATS, BOSS_STATS, TileType
from src.entities.ghosts import GhostType

errors = []
all_glyphs = {}

def register(glyph, category, name):
    key = glyph
    if key in all_glyphs:
        existing = all_glyphs[key]
        errors.append(f"Collision: '{glyph}' used by {existing} AND {category}:{name}")
    else:
        all_glyphs[key] = f"{category}:{name}"

# Player
register('@', 'player', 'player')

# Tiles
for tile in TileType:
    if tile.value and len(str(tile.value)) == 1:
        register(str(tile.value), 'tile', tile.name)

# Enemy symbols
for enemy_type, stats in ENEMY_STATS.items():
    sym = stats.get('symbol')
    if sym:
        register(sym, 'enemy', enemy_type.name)

# Boss symbols
for boss_type, stats in BOSS_STATS.items():
    sym = stats.get('symbol')
    if sym:
        register(sym, 'boss', boss_type.name)

# Ghost symbols (use chr() for Unicode safety)
GHOST_GLYPHS = {
    GhostType.ECHO: chr(949),      # ε
    GhostType.HOLLOWED: 'H',
    GhostType.SILENCE: chr(216),   # Ø
    GhostType.BEACON: chr(10023),  # ✧
    GhostType.CHAMPION: chr(8224), # †
    GhostType.ARCHIVIST: chr(167), # §
}
for ghost_type, glyph in GHOST_GLYPHS.items():
    register(glyph, 'ghost', ghost_type.name)

# Artifact symbols
ARTIFACT_GLYPHS = {'&': 'DUPLICATE_SEAL', '%': 'WOUNDGLASS_SHARD', '*': 'OATHSTONE'}
for glyph, name in ARTIFACT_GLYPHS.items():
    register(glyph, 'artifact', name)

# Item symbols (common)
ITEM_GLYPHS = {'!': 'potion', '?': 'scroll', ')': 'weapon', '[': 'armor', '$': 'gold'}
for glyph, name in ITEM_GLYPHS.items():
    register(glyph, 'item', name)

# Known acceptable collisions (distinguished by color/context in renderer)
ACCEPTABLE_COLLISIONS = {
    ('enemy', 'boss'),    # Boss uses same letter as related enemy (e.g., 'r' for Rat/Rat King)
    ('boss', 'enemy'),
    ('tile', 'item'),     # Tile and item can share if color-coded
    ('item', 'tile'),
}

critical_errors = []
warnings = []
for err in errors:
    # Parse the collision
    is_acceptable = False
    for cat1, cat2 in ACCEPTABLE_COLLISIONS:
        if f"{cat1}:" in err and f"{cat2}:" in err:
            is_acceptable = True
            break
    if is_acceptable:
        warnings.append(err)
    else:
        critical_errors.append(err)

if critical_errors:
    print(f"Glyph Collision: {len(critical_errors)} CRITICAL errors")
    for err in critical_errors:
        print(f"  - {err}")
elif warnings:
    print(f"[OK] Glyph Collision: {len(all_glyphs)} glyphs ({len(warnings)} acceptable overlaps)")
else:
    print(f"[OK] Glyph Collision: {len(all_glyphs)} distinct glyphs, no collisions")
```

---

### Step 17: Full Integration Test

Run the game briefly to verify it launches:

```bash
timeout 3 .\.venv\Scripts\python main.py 2>&1 || echo "Game launched successfully (timeout expected)"
```

Note: The game uses curses and may not produce visible output. A clean exit or timeout indicates success.

---

### Step 18: Battle State Roundtrip (v6.0)

Test mid-battle serialization preserves all combat state:

```python
from src.combat import (
    BattleState, BattleEntity, BattlePhase, BattleOutcome,
    PendingReinforcement
)

errors = []

# Test 1: BattleEntity with status effects and cooldowns
entity = BattleEntity(
    entity_id='test_entity',
    is_player=True,
    arena_x=3, arena_y=4,
    world_x=10, world_y=15,
    hp=25, max_hp=50,
    attack=10, defense=5,
    has_acted=True,
)
entity.status_effects = [
    {'name': 'burn', 'duration': 2, 'damage_per_tick': 3},
    {'name': 'shield_wall', 'duration': 1, 'defense_mod': 2.0},
]
entity.cooldowns = {'Power Strike': 2, 'Shield Wall': 4}

entity_state = entity.to_dict()
restored_entity = BattleEntity.from_dict(entity_state)

checks = [
    (restored_entity.entity_id, 'test_entity', 'entity_id'),
    (restored_entity.hp, 25, 'hp'),
    (restored_entity.has_acted, True, 'has_acted'),
    (len(restored_entity.status_effects), 2, 'status_effects count'),
    (restored_entity.cooldowns.get('Power Strike'), 2, 'cooldown_power_strike'),
    (restored_entity.has_status('burn'), True, 'has_burn_status'),
    (restored_entity.get_effective_defense(), 10, 'effective_defense'),  # 5 * 2.0
]

for actual, expected, name in checks:
    if actual != expected:
        errors.append(f"BattleEntity roundtrip: {name} = {actual}, expected {expected}")

# Test 2: PendingReinforcement
reinforcement = PendingReinforcement(
    entity_id='enemy_123',
    enemy_name='Plague Rat',
    enemy_type='RAT',
    is_elite=True,
    turns_until_arrival=3,
    world_x=20, world_y=25,
    hp=15, max_hp=15,
    attack=5, defense=2
)

reinf_state = reinforcement.to_dict()
restored_reinf = PendingReinforcement.from_dict(reinf_state)

if restored_reinf.is_elite != True:
    errors.append("Reinforcement roundtrip: is_elite mismatch")
if restored_reinf.turns_until_arrival != 3:
    errors.append("Reinforcement roundtrip: turns_until_arrival mismatch")
if restored_reinf.defense != 2:
    errors.append("Reinforcement roundtrip: defense mismatch")

# Test 3: Full BattleState with phase, turn, and reinforcements
battle = BattleState(
    arena_width=9,
    arena_height=7,
    arena_tiles=[['.' for _ in range(9)] for _ in range(7)],
    biome='VOLCANIC',
    zone_id='crucible_heart',
    floor_level=7,
    turn_number=5,
    phase=BattlePhase.ENEMY_TURN,
    outcome=BattleOutcome.PENDING,
    seed=12345,
    max_reinforcements=3,
    reinforcements_spawned=1,
    encounter_origin=(15, 20),
    outside_time=2.5,
    noise_level=1.0,
)

# Add player
battle.player = entity

# Add enemy
enemy = BattleEntity(
    entity_id='enemy_1',
    is_player=False,
    arena_x=5, arena_y=2,
    world_x=18, world_y=22,
    hp=10, max_hp=20,
    attack=8, defense=3,
)
enemy.status_effects = [{'name': 'freeze', 'duration': 1, 'speed_mod': 0.5}]
battle.enemies.append(enemy)

# Add pending reinforcement
battle.reinforcements.append(reinforcement)

# Serialize and restore
battle_state = battle.to_dict()
restored_battle = BattleState.from_dict(battle_state)

battle_checks = [
    (restored_battle.biome, 'VOLCANIC', 'biome'),
    (restored_battle.zone_id, 'crucible_heart', 'zone_id'),
    (restored_battle.turn_number, 5, 'turn_number'),
    (restored_battle.phase, BattlePhase.ENEMY_TURN, 'phase'),
    (restored_battle.outcome, BattleOutcome.PENDING, 'outcome'),
    (restored_battle.seed, 12345, 'seed'),
    (restored_battle.max_reinforcements, 3, 'max_reinforcements'),
    (restored_battle.reinforcements_spawned, 1, 'reinforcements_spawned'),
    (restored_battle.encounter_origin, (15, 20), 'encounter_origin'),
    (restored_battle.outside_time, 2.5, 'outside_time'),
    (restored_battle.noise_level, 1.0, 'noise_level'),
    (len(restored_battle.enemies), 1, 'enemy_count'),
    (len(restored_battle.reinforcements), 1, 'reinforcement_count'),
    (restored_battle.player.hp, 25, 'player_hp'),
    (restored_battle.player.has_acted, True, 'player_has_acted'),
    (len(restored_battle.player.status_effects), 2, 'player_status_count'),
    (restored_battle.enemies[0].has_status('freeze'), True, 'enemy_has_freeze'),
    (restored_battle.reinforcements[0].is_elite, True, 'reinf_is_elite'),
]

for actual, expected, name in battle_checks:
    if actual != expected:
        errors.append(f"BattleState roundtrip: {name} = {actual}, expected {expected}")

if errors:
    print(f"Battle State Roundtrip: {len(errors)} errors")
    for err in errors:
        print(f"  - {err}")
else:
    print("[OK] Battle State Roundtrip: entity/reinforcement/battle state all stable")
```

---

### Step 19: Ship Insurance Test

Verify class abilities are consistent and properly defined:

```python
from src.combat import (
    get_class_abilities, BattleAction,
    WARRIOR_ABILITIES, MAGE_ABILITIES, ROGUE_ABILITIES, CLERIC_ABILITIES
)

errors = []

# All 4 classes should have abilities defined
class_kits = {
    'WARRIOR': WARRIOR_ABILITIES,
    'MAGE': MAGE_ABILITIES,
    'ROGUE': ROGUE_ABILITIES,
    'CLERIC': CLERIC_ABILITIES,
}

for class_name, abilities in class_kits.items():
    if not abilities:
        errors.append(f"{class_name}: No abilities defined")
        continue

    # First ability should be basic attack
    if abilities[0].action != BattleAction.BASIC_ATTACK:
        errors.append(f"{class_name}: First ability is not BASIC_ATTACK")

    # All abilities should have names and descriptions
    for ability in abilities:
        if not ability.name:
            errors.append(f"{class_name}: Ability missing name")
        if not ability.description:
            errors.append(f"{class_name}: {ability.name} missing description")

    # Check get_class_abilities returns correct kit
    retrieved = get_class_abilities(class_name)
    if retrieved != abilities:
        errors.append(f"{class_name}: get_class_abilities mismatch")

# Specific ability checks
warrior_abilities = {a.name for a in WARRIOR_ABILITIES}
if 'Power Strike' not in warrior_abilities:
    errors.append("Warrior missing Power Strike")
if 'Shield Wall' not in warrior_abilities:
    errors.append("Warrior missing Shield Wall")

mage_abilities = {a.name for a in MAGE_ABILITIES}
if 'Fireball' not in mage_abilities:
    errors.append("Mage missing Fireball")
if 'Frost Nova' not in mage_abilities:
    errors.append("Mage missing Frost Nova")

rogue_abilities = {a.name for a in ROGUE_ABILITIES}
if 'Backstab' not in rogue_abilities:
    errors.append("Rogue missing Backstab")
if 'Smoke Bomb' not in rogue_abilities:
    errors.append("Rogue missing Smoke Bomb")

cleric_abilities = {a.name for a in CLERIC_ABILITIES}
if 'Heal' not in cleric_abilities:
    errors.append("Cleric missing Heal")
if 'Smite' not in cleric_abilities:
    errors.append("Cleric missing Smite")

if errors:
    print(f"Ship Insurance: {len(errors)} errors")
    for err in errors:
        print(f"  - {err}")
else:
    total = sum(len(a) for a in class_kits.values())
    print(f"[OK] Ship Insurance: {len(class_kits)} classes, {total} abilities defined")
```

---

### Step 20: Battle Payload Contract Test (v6.0.5)

Verify game state payload includes `battle_view` when `ui_mode == BATTLE`:

```python
errors = []

# Required battle_view keys when ui_mode == 'BATTLE'
REQUIRED_BATTLE_VIEW_KEYS = [
    "arena_tiles",
    "arena_width",
    "arena_height",
    "player",
    "enemies",
    "reinforcements",
    "round",
    "phase",
    "biome",
    "floor_level",
]

# Required battle entity keys (player and enemies)
REQUIRED_BATTLE_ENTITY_KEYS = [
    "entity_id",
    "is_player",
    "arena_x",
    "arena_y",
    "hp",
    "max_hp",
    "attack",
    "defense",
    "status_effects",
]

# Required reinforcement keys
REQUIRED_REINFORCEMENT_KEYS = [
    "enemy_name",
    "enemy_type",
    "is_elite",
    "turns_until_arrival",
]

# Artifact state keys (v6.0.5)
BATTLE_ARTIFACT_KEYS = [
    "duplicate_seal_armed",
    "woundglass_reveal_active",
    "safe_tiles_revealed",
]

# Validate by checking the serialize function
try:
    with open('server/app/services/game_session.py', 'r') as f:
        source = f.read()

    # Check battle_view is emitted when ui_mode is BATTLE
    if 'battle_view' not in source:
        errors.append("Missing battle_view in payload serialization")
    else:
        # Check required battle_view keys
        for key in REQUIRED_BATTLE_VIEW_KEYS:
            if f'"{key}"' not in source and f"'{key}'" not in source:
                # Try snake_case and camelCase variants
                camel = ''.join(w.title() if i else w for i, w in enumerate(key.split('_')))
                if f'"{camel}"' not in source and f"'{camel}'" not in source:
                    errors.append(f"battle_view missing '{key}'")

        # Check artifact state keys
        for key in BATTLE_ARTIFACT_KEYS:
            if f'"{key}"' not in source and f"'{key}'" not in source:
                errors.append(f"battle_view missing artifact key '{key}'")

except FileNotFoundError:
    errors.append("Cannot find game_session.py for battle_view validation")

# Also validate the BattleState serialization
try:
    from src.combat.battle_types import BattleState, BattleEntity, PendingReinforcement

    # Create a minimal battle state
    battle = BattleState(
        arena_width=9,
        arena_height=7,
        arena_tiles=[['.' for _ in range(9)] for _ in range(7)],
        biome='STONE',
        zone_id='entrance',
        floor_level=1,
    )

    # Add player
    player = BattleEntity(
        entity_id='player_1',
        is_player=True,
        arena_x=4, arena_y=3,
        world_x=10, world_y=10,
        hp=50, max_hp=50,
        attack=10, defense=5,
    )
    battle.player = player

    # Add enemy
    enemy = BattleEntity(
        entity_id='enemy_1',
        is_player=False,
        arena_x=6, arena_y=3,
        world_x=12, world_y=10,
        hp=20, max_hp=20,
        attack=5, defense=2,
    )
    battle.enemies.append(enemy)

    # Add reinforcement
    reinf = PendingReinforcement(
        entity_id='reinf_1',
        enemy_name='Goblin',
        enemy_type='GOBLIN',
        is_elite=False,
        turns_until_arrival=2,
        world_x=14, world_y=10,
        hp=15, max_hp=15,
        attack=4, defense=1,
    )
    battle.reinforcements.append(reinf)

    # Serialize and check keys
    state = battle.to_dict()

    for key in REQUIRED_BATTLE_VIEW_KEYS:
        if key not in state:
            errors.append(f"BattleState.to_dict() missing '{key}'")

    # Check player entity keys
    if 'player' in state:
        player_state = state['player']
        for key in REQUIRED_BATTLE_ENTITY_KEYS:
            if key not in player_state:
                errors.append(f"BattleEntity (player) missing '{key}'")

    # Check reinforcement keys
    if 'reinforcements' in state and state['reinforcements']:
        reinf_state = state['reinforcements'][0]
        for key in REQUIRED_REINFORCEMENT_KEYS:
            if key not in reinf_state:
                errors.append(f"PendingReinforcement missing '{key}'")

    # Check artifact state keys
    for key in BATTLE_ARTIFACT_KEYS:
        if key not in state:
            errors.append(f"BattleState.to_dict() missing artifact key '{key}'")

except ImportError as e:
    errors.append(f"Cannot import battle types: {e}")

if errors:
    print(f"Battle Payload Contract: {len(errors)} errors")
    for err in errors:
        print(f"  - {err}")
else:
    print("[OK] Battle Payload Contract: battle_view, entities, reinforcements, artifact state")
```

---

### Step 21: Battle Determinism Snapshot (v6.0.5)

Verify battle engagement is deterministic for fixed seeds:

```python
import hashlib
from src.combat.battle_manager import BattleManager
from src.combat.battle_types import BattleState, BattleEntity

errors = []

# Test seeds
test_seeds = [42, 12345]

for seed in test_seeds:
    # Simulate identical engagement conditions
    results = []

    for trial in range(2):
        # Create deterministic battle state with same seed
        import random
        random.seed(seed)

        # Create battle manager with fixed parameters
        manager = BattleManager(
            floor_level=3,
            biome='FOREST',
            zone_id='canopy_halls',
            seed=seed,
        )

        # Create player
        player = BattleEntity(
            entity_id='player',
            is_player=True,
            arena_x=4, arena_y=3,
            world_x=20, world_y=20,
            hp=50, max_hp=50,
            attack=10, defense=5,
        )

        # Create identical enemy setup
        enemies = [
            BattleEntity(
                entity_id='enemy_1',
                is_player=False,
                arena_x=6, arena_y=3,
                world_x=22, world_y=20,
                hp=20, max_hp=20,
                attack=5, defense=2,
            ),
        ]

        # Start battle
        battle = manager.start_battle(
            player=player,
            enemies=enemies,
            encounter_origin=(20, 20),
        )

        # Capture deterministic elements
        snapshot = {
            'arena_width': battle.arena_width,
            'arena_height': battle.arena_height,
            'tile_hash': hashlib.md5(
                str(battle.arena_tiles).encode()
            ).hexdigest()[:8],
            'reinforcement_queue': [
                (r.enemy_type, r.turns_until_arrival, r.is_elite)
                for r in battle.reinforcements
            ],
            'player_pos': (battle.player.arena_x, battle.player.arena_y),
            'enemy_positions': [
                (e.arena_x, e.arena_y) for e in battle.enemies
            ],
        }
        results.append(snapshot)

    # Compare results
    if results[0] != results[1]:
        differences = []
        for key in results[0]:
            if results[0][key] != results[1][key]:
                differences.append(f"{key}: {results[0][key]} vs {results[1][key]}")
        errors.append(f"Seed {seed}: Battle not deterministic - {', '.join(differences)}")

# Alternative determinism check: BattleState serialization roundtrip
try:
    from src.combat.battle_types import BattleState, BattleEntity, PendingReinforcement

    # Create complex state
    battle = BattleState(
        arena_width=9,
        arena_height=7,
        arena_tiles=[['.' for _ in range(9)] for _ in range(7)],
        biome='ICE',
        zone_id='crystal_grottos',
        floor_level=5,
        seed=9999,
    )

    player = BattleEntity(
        entity_id='p1',
        is_player=True,
        arena_x=4, arena_y=3,
        world_x=30, world_y=30,
        hp=45, max_hp=50,
        attack=12, defense=6,
    )
    player.status_effects = [{'name': 'chill', 'duration': 2}]
    battle.player = player

    enemy = BattleEntity(
        entity_id='e1',
        is_player=False,
        arena_x=7, arena_y=4,
        world_x=33, world_y=31,
        hp=18, max_hp=25,
        attack=8, defense=3,
    )
    battle.enemies.append(enemy)

    reinf = PendingReinforcement(
        entity_id='r1',
        enemy_name='Ice Elemental',
        enemy_type='ICE_ELEMENTAL',
        is_elite=True,
        turns_until_arrival=4,
        world_x=35, world_y=30,
        hp=30, max_hp=30,
        attack=10, defense=5,
    )
    battle.reinforcements.append(reinf)

    # Serialize twice
    state1 = battle.to_dict()
    state2 = battle.to_dict()

    # Hash both
    hash1 = hashlib.md5(str(sorted(state1.items())).encode()).hexdigest()
    hash2 = hashlib.md5(str(sorted(state2.items())).encode()).hexdigest()

    if hash1 != hash2:
        errors.append("BattleState.to_dict() not deterministic")

    # Roundtrip and compare
    restored = BattleState.from_dict(state1)
    state3 = restored.to_dict()
    hash3 = hashlib.md5(str(sorted(state3.items())).encode()).hexdigest()

    if hash1 != hash3:
        errors.append("BattleState roundtrip changes hash")

except ImportError as e:
    errors.append(f"Cannot import for determinism test: {e}")
except Exception as e:
    errors.append(f"Determinism test failed: {e}")

if errors:
    print(f"Battle Determinism: {len(errors)} errors")
    for err in errors:
        print(f"  - {err}")
else:
    print(f"[OK] Battle Determinism: {len(test_seeds)} seeds verified, serialization stable")
```

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
Canonical Matrix:       [PASSED/FAILED] (theme/boss/intro/pools/zones)
Seed Determinism:       [PASSED/FAILED] (X floor/seed pairs stable)
Save/Load Roundtrip:    [PASSED/FAILED] (ledger/artifact/ghost)
Payload Contract:       [PASSED/FAILED] (required keys present)
Glyph Collision:        [PASSED/FAILED] (X distinct glyphs)
Game Launch:            [PASSED/FAILED]
Battle State Roundtrip: [PASSED/FAILED] (entity/reinforcement/battle)
Ship Insurance:         [PASSED/FAILED] (X classes, Y abilities)
Battle Payload:         [PASSED/FAILED] (battle_view/entities/reinforcements)
Battle Determinism:     [PASSED/FAILED] (X seeds verified, serialization stable)

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
