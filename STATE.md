# Project State

**Last Updated:** 2026-01-10
**Branch:** feature/zone-system
**Version:** v5.4.0 (Lore Codex System)

---

## In Progress: Zone System (Data-Driven)

**Branch:** `feature/zone-system`
**Commit:** Pending - Floor 2 correctness pass completed

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

### Zone Assignment Guarantees

- **Required zones always appear** (eligibility relaxed if needed)
- **Boss approach count is adaptive** (reduced if not enough rooms)
- **Validation harness** catches regressions across 20 seeds

### Next Steps

- Implement Floors 3-8 configs
- Add zone-specific decoration patterns
- Wire has_ceiling/skybox_override for open-air rooms (Mirror Valdris)

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
