# Project State

**Last Updated:** 2026-01-09
**Branch:** develop
**Version:** v5.4.0 (Lore Codex System)

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
