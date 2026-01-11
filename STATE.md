# Project State

**Last Updated:** 2026-01-10
**Branch:** feature/zone-system
**Version:** v5.4.0 (Lore Codex System)

---

## Completed: Zone System (Data-Driven) - All 8 Floors

**Branch:** `feature/zone-system`
**Status:** All 8 floors implemented and validated (20/20 seeds each)

### Zone System Architecture

Data-driven zone assignment with modular layout decorators:

| File | Purpose |
|------|---------|
| `zone_config.py` | FloorZoneConfig dataclass, eligibility predicates, per-floor configs |
| `zone_layouts.py` | Layout decorator registry, ZONE_LAYOUTS[(floor, zone_id)] pattern |
| `zone_validation.py` | Validation harness for testing zone assignment across seeds |
| `dungeon.py` | Config-driven _assign_zones(), enhanced get_zone_summary() |
| `entity_manager.py` | Zone-aware spawns and lore with per-floor configs |

### Adding a New Floor

1. Add `FLOOR_N_CONFIG` to `zone_config.py` with zone specs
2. Add layout handlers to `zone_layouts.py` with `@register_layout(N, "zone_id")`
3. Add spawn modifiers to `entity_manager._apply_zone_weights()`
4. Add lore config to `entity_manager._get_floorN_lore_config()`
5. Run validation: `python -c "from src.world.zone_validation import validate_floor; validate_floor(N)"`

### Implemented Floors

**Floor 1 - Stone Dungeon:**
| Zone | Rule | Special |
|------|------|---------|
| intake_hall | Start room | 0% elite |
| wardens_office | Required (center) | 100% lore |
| record_vaults | Required (center, 5x5+) | 60% lore |
| cell_blocks | 8x6+ | Interior walls, goblins x1.5 |
| guard_corridors | Elongated | Skeletons x1.4 |
| execution_chambers | 7x7+ | Skeletons x1.2 |
| boss_approach | Near boss (adaptive) | Goblins x2.0, guaranteed lore |

**Floor 2 - Sewers (Canonical zones):**
| Zone | Rule | Special |
|------|------|---------|
| confluence_chambers | Start room | Central water feature |
| colony_heart | Required (largest) | Debris pools, 100% lore |
| seal_drifts | Required (center, 5x5+) | 70% lore, surface-doc biased |
| carrier_nests | Required (4x4+) | Debris patches, rat bias |
| waste_channels | Elongated | DEEP_WATER lanes |
| maintenance_tunnels | Any room | Sparse decoration |
| diseased_pools | 5x5+ | Central water pool |
| boss_approach | Near boss (adaptive) | Guaranteed lore |

**Floor 3 - Forest Depths (Canonical zones):**
| Zone | Rule | Special |
|------|------|---------|
| root_warrens | Start room, weighted high | Chokepoint partitions |
| druid_ring | Required (center, 8x8+) | Ritual ring, 100% lore |
| nursery | Required (largest, 8x8+) | High danger, edge hazards |
| canopy_halls | 8x8+ landmark | Optional water pool |
| webbed_gardens | 6x6+ | Scattered hazards (traps) |
| digestion_chambers | 6x6+ | Central hazard pool |
| boss_approach | Near boss (adaptive) | Spider bias x2, guaranteed lore |

**Floor 4 - Mirror Valdris (Canonical zones):**
| Zone | Rule | Special |
|------|------|---------|
| courtyard_squares | Start room, 8x8+ | Optional fountain |
| throne_hall_ruins | Required (largest, 10x8+) | Symmetric aisle markers |
| oath_chambers | Required (center, 7x7+) | Ring geometry, 100% lore |
| seal_chambers | High-weight (5x5+) | Corner workstations, 75% lore |
| record_vaults | High-weight (5x5+) | Shelf rows, 75% lore |
| mausoleum_district | 5x5+ | Tomb row pattern, skeleton x2 |
| parade_corridors | Elongated fallback | Symmetric markers |
| boss_approach | Near boss (adaptive) | Skeleton x1.6, guaranteed lore |

**Floor 5 - Ice Cavern (Canonical zones):**
| Zone | Rule | Special |
|------|------|---------|
| frozen_galleries | Start room, elongated | ICE lanes, skeleton x1.5 |
| breathing_chamber | Required (largest, 10x8+) | Edge condensation |
| suspended_laboratories | Required (center, 6x6+) | ICE patches, 100% lore |
| thaw_fault | Required (5x5+) | ICE + DEEP_WATER paradox |
| ice_tombs | 6x6+ | Corner ICE patches, skeleton x1.8 |
| crystal_grottos | 7x7+ | Optional ICE ring |
| boss_approach | Near boss (adaptive) | Skeleton x1.8, guaranteed lore |

**Floor 6 - Ancient Library (Canonical zones):**
| Zone | Rule | Special |
|------|------|---------|
| reading_halls | Start room, 7x7+ | Open center, lower density |
| indexing_heart | Required (center, 8x8+) | Ring markers, 100% lore |
| catalog_chambers | Required (center, 6x6+) | 75% lore |
| forbidden_stacks | 6x6+ fallback | Interior wall partitions |
| marginalia_alcoves | 4x4+ | Small nooks, 60% lore |
| experiment_archives | 6x6+ | Volatile markers |
| boss_approach | Near boss (adaptive) | Skeleton x1.5, guaranteed lore |

**Floor 7 - Volcanic Depths (Canonical zones):**
| Zone | Rule | Special |
|------|------|---------|
| forge_halls | Start room, 7x7+ | Work lane stubs |
| crucible_heart | Required (largest, 8x8+) | Edge LAVA ring, 100% lore |
| rune_press | Required (center, 7x7+) | Frame stubs, 60% lore |
| magma_channels | Elongated | Central LAVA lane |
| ash_galleries | Any room fallback | Trap-ready (future) |
| cooling_chambers | 6x6+ | DEEP_WATER troughs |
| slag_pits | 5x5+ | Corner LAVA puddles |
| boss_approach | Near boss (adaptive) | LAVA offerings, guaranteed lore |

**Floor 8 - Crystal Cave (Canonical zones):**
| Zone | Rule | Special |
|------|------|---------|
| crystal_gardens | Start room/fallback, 7x7+ | Scenic landmark |
| dragons_hoard | Required (largest, 8x8+) | 100% lore, higher danger |
| oath_interface | Required (center, 7x7+) | Binding circle, 85% lore |
| vault_antechamber | High-weight (8x8+) | Threshold room, 75% lore |
| seal_chambers | 7x7+ | Ring with gap (failing seal) |
| geometry_wells | 6x6+ | Lattice nodes |
| boss_approach | Near boss (adaptive) | Scorch orbit marks, guaranteed lore |

### Zone Assignment Guarantees

- **Required zones always appear** (eligibility relaxed if needed)
- **Boss approach count is adaptive** (reduced if not enough rooms)
- **Validation harness** catches regressions across 20 seeds
- **All 8 floors validated** with 20/20 seeds passing

### Hazard Tile Effects

Zone layouts paint hazard tiles that now have gameplay effects:

| Tile Type | Effect |
|-----------|--------|
| LAVA | 5 damage/turn + burn status |
| POISON_GAS | Applies poison effect, spreads each turn |
| DEEP_WATER | Costs 2 turns to cross (enemies get extra action), drown risk at <25% HP |
| ICE | Cosmetic for now (slide mechanic deferred) |

**Implementation:**
- `dungeon._sync_tile_hazards()` converts TileType tiles to Hazard objects
- `is_walkable()` now includes hazard tiles (walkable but dangerous)
- `engine._process_hazards()` returns slow terrain flag for deep water penalty

### Hazard Fairness Guarantees

- `dungeon._ensure_hazard_fairness()` runs after hazard sync
- Clears hazards from critical positions (player, stairs)
- `_ensure_room_safe_path()` prevents >60% hazard density in rooms
- Safe lane carved through center if needed

### Zone Evidence System

Visual "tells" placed in zones to guide player toward boss and lore:

| Evidence Type | Location | Purpose |
|---------------|----------|---------|
| trail_tells | boss_approach (2-3 per room) | Blood, drag marks, residue - hints at boss |
| lore_markers | boss_approach (1 per room) | Document scraps, warning signs |
| evidence_props | key lore zones | Zone-themed objects (shackles, documents) |

**All 8 Floor Evidence Configs:**
- Floor 1 (Stone): Blood drips, shackles, key fragments
- Floor 2 (Sewers): Rat droppings, slime trails, debris
- Floor 3 (Forest): Bone fragments, webbing, egg sacs
- Floor 4 (Valdris): Blood, ash, ghostly residue, seal fragments
- Floor 5 (Ice): Ice crystals, frost marks, frozen specimens
- Floor 6 (Library): Ink drops, page scraps, arcane residue
- Floor 7 (Volcanic): Slag drips, ember marks, forged runes
- Floor 8 (Crystal): Crystal shards, gold dust, dragon scales

**Implementation:**
- `dungeon._place_zone_evidence()` places evidence post-layout
- `dungeon._get_evidence_config()` returns floor-specific evidence lists
- Evidence rendered via `renderer._render_zone_evidence()`

### Centralized Lore IDs

All lore IDs now defined in `src/story/lore_items.py`:

```python
from src.story import validate_lore_id, validate_story_data

# Validate single ID
validate_lore_id("journal_adventurer_1")

# Validate all story_data.py entries
errors = validate_story_data()
```

Benefits:
- Catches typos at import time
- Floor-indexed lookup: `FLOOR_LORE_IDS[floor]`
- Consistency check between lore_items.py and story_data.py

### Per-Room Ceiling/Skybox System

Backend sends room ceiling state in FirstPersonView:

| Field | Type | Description |
|-------|------|-------------|
| zone_id | string | Current room's zone ID (e.g., "courtyard_squares") |
| room_has_ceiling | bool | False for open-air rooms, true by default |
| room_skybox_override | string? | Biome ID for skybox palette (null = use fog color) |

**Currently enabled:**
- Floor 4 `courtyard_squares` → open ceiling with pale blue sky

**Implementation:**
- `game_session._serialize_first_person_view()` adds ceiling fields
- `FirstPersonRenderer3D.tsx` skips ceiling geometry when `room_has_ceiling=false`
- Simple sky plane added for open-air rooms

### Boss Roster (Aligned with Lore)

| Floor | Boss | Theme |
|-------|------|-------|
| 1 | Goblin King | Stone Dungeon (prison warden) |
| 2 | Rat King | Sewers (plague carrier) |
| 3 | Spider Queen | Forest Depths (nature's curse) |
| 4 | **The Regent** | Mirror Valdris (counterfeit monarch) |
| 5 | Frost Giant | Ice Cavern (frozen experiment) |
| 6 | Arcane Keeper | Ancient Library (knowledge guardian) |
| 7 | Flame Lord | Volcanic Depths (forge master) |
| 8 | Dragon Emperor | Crystal Cave (dragon's hoard) |

**Note:** LICH_LORD removed from active warden rotation (no longer matches floor themes).

### Future Enhancements

- Add zone-specific decoration patterns
- Add new enemy types (fire elementals, wraiths, dragon fragments)
- Implement ice sliding mechanic

---

## Recently Completed: Lore Compendium

**Branch:** `feature/lore-compendium-v2`
**Commit:** `0a19be1` - docs: enhance zone specs with detailed implementation requirements

### New Lore Canon: The Skyfall Seed

Complete world lore rewrite introducing the Skyfall Seed mythos (1326 lines):

| Section | Description |
|---------|-------------|
| **Prologue: The Wound Beneath** | Reality-editing threat, no coherent survivors return |
| **The Skyfall Seed** | What Fell, The Field, narrative substitution mechanics |
| **The Counterfeit Reign** | Monarchy rewrite threat driving player motivation |
| **Dungeon Depths** | All 8 levels as Field pockets/aspects |
| **Bestiary** | Field-consistent enemy descriptions |
| **Wardens** | 8 bosses with "What It Was / What It Became" backstories |
| **Echoes & Imprints** | Ghost mechanics (death) and victory legacy types |
| **Discoverable Lore** | Contradictory historical records showing Field edits |
| **Victory & Death** | Cinematics matching new canon |
| **Terminology** | Field, Pocket, Seam, Warden, Echo, Imprint definitions |

### Key Concepts

- **The Field**: Reality-editing influence that spreads via narrative substitution
- **Pockets**: Crystallized layers of edited reality (dungeon levels)
- **Seams**: Thin corridors between pockets where Field grip is weaker
- **Wardens**: Former beings transformed into living locks sealing the Seed
- **Echoes**: Ghostly patterns left by death (Echo, Hollowed, Silence)
- **Imprints**: Victory legacies burned into reality (Beacon, Champion, Archivist)

---

## Demo Account

| Field | Value |
|-------|-------|
| **Username** | `demo` |
| **Password** | `DemoPass123` |
| **URL** | http://localhost:5173/login |

---

## Current Version: v5.4.0

### Completed Features (v5.4.0)

| Feature | Status |
|---------|--------|
| Immersive Lore Codex system (replaces journal button) | ✅ |
| Category-based organization (History, Characters, Creatures, Locations, Artifacts) | ✅ |
| ScrollPresentation with unroll animation | ✅ |
| BookPresentation with page-turn effect | ✅ |
| CreaturePresentation with animated Canvas 2D portraits | ✅ |
| LocationPresentation with animated biome previews | ✅ |
| Bestiary auto-discovery on first combat | ✅ |
| Location auto-discovery on level visits | ✅ |
| Fantasy grimoire aesthetic (amber/parchment styling) | ✅ |
| Story manager state persistence in save/load | ✅ |

### v5.4.0 Architecture

```
web/src/components/LoreCodex/
├── components/
│   ├── CodexSidebar.tsx        # Category navigation
│   ├── CodexEntryList.tsx      # Entry list for selected category
│   ├── CodexReader.tsx         # Routes to presentation components
│   ├── ScrollPresentation.tsx  # Animated scroll unroll
│   ├── BookPresentation.tsx    # Book with page turns
│   ├── CreaturePresentation.tsx # Canvas 2D enemy portrait + stats
│   └── LocationPresentation.tsx # Biome preview + level info
├── hooks/
│   └── useCodexState.ts        # Category/entry selection state
├── utils/
│   └── phosphorText.tsx        # Character-by-character reveal
├── LoreCodex.tsx               # Main container
├── LoreCodex.scss              # All styles (~1200 lines)
├── types.ts                    # LoreEntry, CreatureEntry, LocationEntry
└── index.ts                    # Exports
```

### Creature Bestiary Features

| Feature | Description |
|---------|-------------|
| Animated portrait | Canvas 2D rendering with bob, breathe, sway animations |
| Stats grid | HP (red), ATK (orange), XP (green), Level Range |
| Boss badge | "BOSS" label + crown rendering for boss creatures |
| Abilities list | Formatted ability names for bosses |
| Resistances | Element-colored resistance tags |
| First encounter text | Italic quote from ENEMY_ENCOUNTER_MESSAGES |

### Location Codex Features

| Feature | Description |
|---------|-------------|
| Biome preview | Animated Canvas with theme-specific visuals |
| Level badge | "Level N" overlay on preview |
| Intro message | LEVEL_INTRO_MESSAGES text |
| Boss section | Guardian name + symbol if level has boss |
| Creatures list | All enemies that spawn on this level |

### Discovery System

| Trigger | Method | Data Source |
|---------|--------|-------------|
| Combat (first attack) | `story_manager.encounter_enemy()` | combat_manager.py |
| Game start | `story_manager.visit_level(1)` | engine.py |
| Level descent | `story_manager.visit_level(n)` | level_manager.py |

### Key Files (v5.4.0)

| File | Purpose |
|------|---------|
| `src/story/story_manager.py` | get_bestiary_entries(), get_location_entries() |
| `src/managers/combat_manager.py` | encounter_enemy() call on attack |
| `src/managers/level_manager.py` | visit_level() call on descent |
| `src/managers/serialization.py` | story_manager save/load |
| `server/app/services/game_session.py` | Combines all entry types for frontend |
| `web/src/hooks/useGameSocket.ts` | Extended LoreEntry types |
| `web/src/pages/Play.tsx` | LoreCodex integration (J key) |

---

## Previous Versions

### v5.3.0 Features

| Feature | Status |
|---------|--------|
| Death cutscene (5-scene cinematic sequence) | ✅ |
| Victory cutscene (3-scene cinematic sequence) | ✅ |
| Random death fate variants (Echo, Hollowed, Silence) | ✅ |
| Random victory legacy variants (Beacon, Champion, Archivist) | ✅ |
| Ghost lore panels on summary screens | ✅ |
| Death camera effect in 3D renderer | ✅ |
| Death overlays (vignette, blood curtain, eyelids) | ✅ |
| File-based cinematic SFX with procedural fallback | ✅ |
| Factory pattern for cutscene creation (useState) | ✅ |
| FX cues synced to caption line completion | ✅ |

### v5.2.0 Features

| Feature | Status |
|---------|--------|
| Modular cutscene engine architecture | ✅ |
| Retro CRT phosphor text reveal | ✅ |
| Per-character staggered ignition animation | ✅ |
| FX system (flash, shake, flicker, pressure) | ✅ |
| FX cues tied to caption line completion | ✅ |
| Scene-scoped CSS classes for per-scene styling | ✅ |
| Debug mode panel for scene iteration | ✅ |
| 7-scene intro cutscene with effects | ✅ |

### v5.1.0 Features

| Feature | Status |
|---------|--------|
| Cinematic intro with 7 narrative scenes | ✅ |
| Parallax backgrounds per scene | ✅ |
| Particle effects (stars, embers, dust, darkness) | ✅ |
| Scene transitions with solid black (no bleed) | ✅ |
| Responsive 3D/2D renderer (fills container) | ✅ |

### v5.0.0 Features

| Feature | Status |
|---------|--------|
| Dynamic LOS-based render distance | ✅ |
| Smooth movement/turn animations (2D & 3D) | ✅ |
| Map memory for explored tiles | ✅ |
| Pure tile-based 3D geometry | ✅ |
| Parallax skybox system | ✅ |

---

## Next Version: v5.5.0

| Feature | Description |
|---------|-------------|
| Database saves | Persist game state to PostgreSQL |
| Save on quit | Auto-save when quitting |
| Load saved game | Restore from database |
| Multiple slots | Multiple characters per account |
| Character/Artifact/History presentations | Remaining codex category layouts |

### Deferred

- Weather effects (rain/dripping)
- Ambient sounds
- 3D tile variants (requires world coordinates in view data)
- Victorious ghost behavior (beacon/champion/archivist AI)

---

## Quick Commands

```bash
# Terminal client
python main.py

# Web frontend
cd web && npm run dev

# Backend (Docker)
docker-compose up -d

# Type check
cd web && npx tsc --noEmit
```

---

## Documentation

See [docs/](docs/) folder:
- [FEATURES.md](docs/FEATURES.md) - Complete feature list
- [GAMEPLAY.md](docs/GAMEPLAY.md) - Controls and mechanics
- [DEVELOPMENT.md](docs/DEVELOPMENT.md) - Setup and building
- [ARCHITECTURE.md](docs/ARCHITECTURE.md) - Project structure
- [CHANGELOG.md](docs/CHANGELOG.md) - Version history
