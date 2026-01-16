# Project State

**Last Updated:** 2026-01-16
**Branch:** develop
**Version:** v7.0.0 (Immersive Exploration System)

---

## Current Status: v7.0.0 - Immersive Exploration System

Complete interactive exploration system with wall interactions, puzzles, visual depth, and environmental storytelling.

### v7.0 Exploration System (PR #78)

| Component | Description | Status |
|-----------|-------------|--------|
| **Interactive Tiles** | Switch, lever, mural, inscription, pressure plate, hidden door | ✅ Complete |
| **Puzzle System** | Multi-element puzzles with state tracking | ✅ Complete |
| **Visual Depth** | Elevation, slopes, set pieces (entrance doors, boss throne) | ✅ Complete |
| **Lore Discovery** | LorePopup for mural/inscription examination | ✅ Complete |
| **Environmental Clues** | Hints and warnings on all 8 floors | ✅ Complete |
| **Interaction SFX** | 7 procedural sounds for interactions | ✅ Complete |
| **Puzzle Achievements** | PUZZLE_SOLVER, PUZZLE_MASTER flags | ✅ Complete |

### New v7.0 Files

| File | Purpose |
|------|---------|
| `src/core/constants/interactive.py` | InteractiveTile, TileVisual, enums |
| `src/world/puzzles.py` | PuzzleManager and puzzle types |
| `web/src/components/LorePopup.tsx` | Lore discovery popup |
| `web/src/components/LorePopup.css` | Lore popup styling |

### Puzzle Locations

| Floor | Zone | Puzzle Type |
|-------|------|-------------|
| 1 | wardens_office | Switch sequence (3 switches) |
| 5 | frozen_galleries | Pressure plates (3 plates) |

### Environmental Clues by Floor

| Floor | Zone | Clue Type |
|-------|------|-----------|
| 1 | cell_blocks | Prisoner tally marks |
| 2 | waste_channels | Bloodstain warnings |
| 3 | druid_ring | Broken weapon (boss hint) |
| 4 | record_vaults | Faded maps (secret rooms) |
| 5 | ice_tombs | Frozen corpse (survival tips) |
| 6 | forbidden_stacks | Forbidden knowledge riddles |
| 7 | forge_halls | Fire creature warnings |
| 8 | vault_antechamber | Final boss hints |

---

## Previous Version: v6.12.0 - D&D Combat System

Full D&D-style ability scores, dice rolling, and combat mechanics integrated throughout the game.

### D&D System (PRs #74-77)

| Component | Description | Status |
|-----------|-------------|--------|
| **Dice Roller** | Core dice module with LUCK influence | ✅ Complete |
| **Ability Scores** | STR, DEX, CON, LUCK system | ✅ Complete |
| **D&D Combat** | Attack rolls vs AC, damage dice, saves | ✅ Complete |
| **3D Dice** | Animated CSS 3D dice (d4-d20) | ✅ Complete |
| **DiceRollHUD** | Battle dice display overlay | ✅ Complete |
| **DEX Initiative** | d20 + DEX mod for turn order | ✅ Complete |
| **Proficiency Bonus** | Level-scaling: 2 + (level-1)//4 | ✅ Complete |
| **Saving Throws** | DEX/CON saves for traps and hazards | ✅ Complete |
| **Status Effect Saves** | CON saves vs poison, burn, freeze, stun | ✅ Complete |

### UI Migration (PRs #71-73)

| Component | Description | Status |
|-----------|-------------|--------|
| **StatsHUD** | Player vitals overlay (HP, gold, level) | ✅ Complete |
| **GameMessagesPanel** | Tabbed message log in 3D view | ✅ Complete |
| **Minimap** | Dungeon overview in corner | ✅ Complete |
| **CharacterWindow** | Equipment, inventory, journal tabs | ✅ Complete |
| **HelpWindow** | Controls reference overlay | ✅ Complete |
| **Terminal Toggle** | Hide/show terminal with Tab | ✅ Complete |

---

### 3D Asset Pipeline (Completed)

| Component | Description | Status |
|-----------|-------------|--------|
| Docker container | TripoSR + PyTorch CPU in isolated environment | ✅ Complete |
| Container worker | Polls job queue, runs inference, exports GLB | ✅ Complete |
| Job queue API | Create jobs, upload images, check status | ✅ Complete |
| JobsPanel UI | Real-time progress monitoring | ✅ Complete |
| JobsContext | Global React state for job management | ✅ Complete |
| AssetViewer | Upload concept art, preview generated models | ✅ Complete |

### New 3D Pipeline Files

| File | Purpose |
|------|---------|
| `tools/3d-pipeline/Dockerfile` | Docker image with TripoSR dependencies |
| `tools/3d-pipeline/container_worker.py` | Job processing worker |
| `server/app/api/assets.py` | REST API for job queue |
| `web/src/components/JobsPanel.tsx` | Job progress UI |
| `web/src/contexts/JobsContext.tsx` | Job state management |
| `web/src/contexts/AssetsContext.tsx` | Asset state management |

### Database Tables

| Table | Records | Description |
|-------|---------|-------------|
| asset_3d | 26 | Asset definitions (enemies, bosses, items, props, characters) |
| generation_job | * | Job history with FK to asset_3d |

### New API Endpoints (3D Assets)

| Endpoint | Description |
|----------|-------------|
| `GET /api/assets3d` | List all assets |
| `GET /api/assets3d/{id}` | Get asset with job history |
| `POST /api/assets3d` | Create asset |
| `PATCH /api/assets3d/{id}` | Update asset |
| `GET /api/assets3d/stats` | Queue statistics |
| `GET /api/assets3d/jobs` | List jobs |
| `POST /api/assets3d/jobs` | Create job |
| `PATCH /api/assets3d/jobs/{id}` | Update job (worker) |

### Usage

```bash
# Start 3D worker container
docker compose up 3d-worker

# Upload concept art via Asset Viewer page
# Worker automatically processes pending jobs
# GLB models output to web/public/assets/models/<asset>/
```

---

### Data Persistence Migration (Completed)

| Phase | Task | Status |
|-------|------|--------|
| 1 | JSON seed files (`data/seeds/`) | ✅ Complete |
| 2 | SQLAlchemy models for game constants | ✅ Complete |
| 3 | Database seeder script | ✅ Complete |
| 4 | Redis caching layer (cache-aside pattern) | ✅ Complete |
| 5 | REST API endpoints with Pydantic schemas | ✅ Complete |
| 6 | Frontend API integration | ✅ Complete |
| 7 | Remove static TS data files | ✅ Partial |
| 8 | Cache invalidation on writes | ✅ Complete |

### New API Endpoints

| Endpoint | Description |
|----------|-------------|
| `/api/game-constants/races` | Playable races (5) |
| `/api/game-constants/classes` | Playable classes (4) |
| `/api/game-constants/enemies` | Enemy definitions (28) |
| `/api/game-constants/bosses` | Boss definitions (8) |
| `/api/game-constants/items` | Item definitions (29) |
| `/api/game-constants/themes` | Dungeon themes (8) |
| `/api/game-constants/traps` | Trap types (4) |
| `/api/game-constants/hazards` | Hazard types (4) |
| `/api/game-constants/status-effects` | Status effects (4) |
| `/api/game-constants/floor-pools/{floor}` | Enemy spawn pools (47) |
| `/api/game-constants/cache-status` | Cache health |

### Seeded Data Summary

| Table | Records |
|-------|---------|
| game_enemies | 28 |
| game_bosses | 8 |
| game_races | 5 |
| game_classes | 4 |
| game_themes | 8 |
| game_traps | 4 |
| game_hazards | 4 |
| game_status_effects | 4 |
| game_items | 29 |
| game_floor_pools | 47 |
| asset_3d | 26 |
| **Total** | **167** |

---

## Recent Changes

### v7.0.0 (2026-01-16) - Immersive Exploration System (PR #78)
- New: Interactive tile system (switch, lever, mural, inscription, pressure plate, hidden door)
- New: PuzzleManager with switch sequence and pressure plate puzzle types
- New: TileVisual system with elevation, slopes, and set pieces
- New: LorePopup component for mural/inscription discovery
- New: Environmental clue inscriptions across all 8 floors
- New: 7 procedural sound effects for interactions
- New: PUZZLE_SOLVER and PUZZLE_MASTER achievement flags
- New: Entrance doors set piece in intake_hall
- New: Boss throne set piece in crystal boss approach
- New: Descent visuals in Floor 7 and 8 boss approach rooms

### v6.12.0 (2026-01-16) - D&D System Enhancements (PR #77)
- New: DEX-based initiative (d20 + DEX mod) with DICE_ROLL events
- New: Level-based proficiency bonus: 2 + (level-1)//4 (D&D 5e formula)
- New: Hazard saving throws (DEX for lava/ice, CON for poison gas/water)
- New: Status effect CON saves to resist poison, burn, freeze, stun
- New: AbilityCheck dataclass and make_ability_check() function

### v6.11.0 (2026-01-16) - D&D Integration (PR #76)
- New: Alembic migration 005 for D&D columns on enemies
- New: All 28 enemies have armor_class, attack_bonus, damage_dice
- New: DEX saving throws for trap damage reduction
- New: Weapon damage dice used in combat (daggers use DEX)
- Changed: seed_database.py updated with D&D column mappers

### v6.10.0 (2026-01-16) - D&D Dice Events (PRs #74-75)
- New: Dice rolling module with LUCK-influenced rerolls
- New: AbilityScores dataclass (STR, DEX, CON, LUCK)
- New: D&D combat: attack rolls, damage rolls, saving throws
- New: DICE_ROLL event type for frontend visualization
- New: Dice3D component with CSS 3D transforms
- New: DiceRollHUD overlay showing attack/damage/save results
- New: StatRoller for character creation

### v6.9.5 (2026-01-16) - UI Migration (PR #73)
- New: StatsHUD component for player vitals
- New: GameMessagesPanel with tabbed message filtering
- New: Minimap component showing dungeon overview
- New: HelpWindow with controls reference
- New: Terminal toggle with Tab key
- Changed: Terminal elements moved to 3D overlay

### v6.9.2 (2026-01-15) - CharacterWindow & Combat Polish (PRs #70-71)
- New: CharacterWindow with equipment, inventory, journal tabs
- New: Enemy attack bump animation
- Fix: Battle event bugs and state synchronization

### v6.9.0 (2026-01-14) - 3D Asset Database Storage
- New: SQLAlchemy models for asset_3d and generation_job tables
- New: Pydantic schemas for 3D asset API validation
- New: REST API at `/api/assets3d/*` for CRUD operations
- New: AssetsContext for frontend global asset state
- New: Seed data with 26 asset definitions from assetQueue.ts
- Changed: JobsContext now uses database-backed API with fallback
- Changed: assetQueue.ts provides API functions with static fallback
- Maintained: JSON file sync for Docker worker backward compatibility

### v6.8.0 (2026-01-14) - 3D Asset Generation Pipeline
- New: Docker container for TripoSR ML inference (CPU-based)
- New: Job queue system with JSON file storage
- New: `container_worker.py` processes concept art to GLB models
- New: `JobsPanel` component for real-time progress monitoring
- New: `JobsContext` for global job state management
- New: Asset upload and generation workflow in AssetViewer
- Generated: `goblin.glb` (1.3MB, 32K vertices) from concept art

### v6.7.0 (2026-01-13) - Data Persistence Migration
- New: JSON seed files in `data/seeds/` for game balance versioning
- New: SQLAlchemy models for all game constants
- New: Redis cache layer with 24h TTL for game constants
- New: `useGameConstants` React hook for frontend data fetching
- New: Pydantic response schemas for API documentation
- Fix: Circular import in combat module (battle_actions ↔ battle_boss_abilities)
- Changed: CharacterCreation.tsx fetches from API instead of static imports
- Changed: characterData.ts reduced to ability descriptions only

### v6.5.1 (2026-01-12) - Roadmap Complete
- PRs #21-24: All priority items implemented
- New: FloorDiorama3D, CharacterPreview3D components
- New: Daily challenge backend (models, service, API)
- New: Ice slide mechanic enabled

### v6.4.0 (2026-01-12) - Frontend Lore Alignment
- AtmosphericPage, PhosphorHeader, DungeonPortal3D components
- Redesigned Home, Login, Register, CharacterCreation pages
- New About page (AI attribution), Presentation page (case study)
- Skyfall Seed lore integration throughout

---

## Architecture Overview

### Backend (Python/FastAPI)
```
server/app/
├── api/           # REST endpoints (game_constants.py, assets.py, asset3d.py)
├── core/          # Config, database, security, cache.py
├── models/        # SQLAlchemy models (game_constants.py, asset3d.py)
├── schemas/       # Pydantic schemas (game_constants.py, asset3d.py)
└── services/      # Business logic (incl. cache_warmer.py)
```

### 3D Asset Pipeline
```
tools/3d-pipeline/
├── Dockerfile           # TripoSR + PyTorch CPU environment
├── container_worker.py  # Job processor (runs in Docker)
├── job_worker.py        # Alternative standalone worker
└── TripoSR/             # ML model code (external)

jobs/                    # Job queue (JSON files)
concept_art/             # Source images for generation
web/public/assets/models/<asset>/  # Generated GLB outputs
```

### Data Layer
```
data/seeds/        # JSON seed files (version-tracked)
├── enemies.json   # 28 enemy definitions
├── bosses.json    # 8 boss definitions
├── races.json     # 5 race definitions
├── classes.json   # 4 class definitions
├── items.json     # 29 item definitions
├── themes.json    # 8 dungeon themes
├── combat.json    # traps, hazards, status effects
└── assets3d.json  # 26 3D asset definitions
```

### Cache Architecture
```
PostgreSQL (source of truth)
    ↓ (cache-aside pattern)
Redis (24h TTL for game constants)
    ↓
FastAPI (serves cached data)
    ↓
React Frontend (useGameConstants hook)
```

### Frontend (React/TypeScript)
```
web/src/
├── components/    # UI components (JobsPanel, ModelViewer, etc.)
├── contexts/      # React contexts (JobsContext, AssetsContext)
├── hooks/         # Custom hooks (incl. useGameConstants.ts)
├── pages/         # Route pages (AssetViewer, etc.)
├── services/      # API client (gameConstantsApi)
└── data/          # Static data + API wrappers (assetQueue.ts)
```

### Game Engine (Python)
```
src/
├── core/          # Engine, events, commands
│   └── constants/ # InteractiveTile, TileVisual (v7.0)
├── combat/        # Battle system, AI
├── entities/      # Player, enemies, items
├── managers/      # Entity, level, combat managers
├── story/         # Lore, completion tracking
└── world/         # Dungeon generation, zones, puzzles (v7.0)
```

---

## Key Systems

### Zone System (8 Floors)
| Floor | Theme | Boss | Biome |
|-------|-------|------|-------|
| 1 | Stone Dungeon | Goblin King | dungeon |
| 2 | Sewers | Rat King | sewer |
| 3 | Forest Depths | Spider Queen | forest |
| 4 | Mirror Valdris | The Regent | crypt |
| 5 | Ice Cavern | Frost Giant | ice |
| 6 | Ancient Library | Arcane Keeper | library |
| 7 | Volcanic Depths | Flame Lord | lava |
| 8 | Crystal Cave | Dragon Emperor | crystal |

### Ghost System
**Death Ghosts:** Echo (ε), Hollowed (H), Silence (Ø)
**Victory Imprints:** Beacon (✧), Champion (†), Archivist (§)

### Artifacts
- Duplicate Seal: Duplicates next consumable
- Woundglass Shard: Reveals path to stairs
- Oathstone: Choose vow for rewards

---

## Quick Reference

### Commands
```bash
# Start all services (Docker)
docker compose up -d

# Start 3D asset worker
docker compose up 3d-worker

# Rebuild 3D worker after changes
docker compose build 3d-worker && docker compose up -d 3d-worker

# Rebuild backend after code changes
docker compose build backend && docker compose up -d backend

# Seed database with game constants
python scripts/seed_database.py --verbose

# Check cache status
curl http://localhost:8000/api/game-constants/cache-status

# Terminal client
python main.py

# Type check frontend
cd web && npx tsc --noEmit
```

### Demo Account
- **Username:** demo
- **Password:** DemoPass123
- **URL:** http://localhost:5173/login

### Dev Cheats (F1-F7)
| Key | Effect |
|-----|--------|
| F1 | God Mode |
| F2 | Kill All |
| F3 | Heal |
| F4 | Next Floor |
| F5 | Reveal Map |
| F6 | Spawn Lore |
| F7 | Show Zones |

---

## Documentation

- [DATA_PERSISTENCE_MODEL.md](docs/DATA_PERSISTENCE_MODEL.md) - Cache architecture
- [FEATURES.md](docs/FEATURES.md) - Complete feature list
- [GAMEPLAY.md](docs/GAMEPLAY.md) - Controls and mechanics
- [DEVELOPMENT.md](docs/DEVELOPMENT.md) - Setup and building
- [ARCHITECTURE.md](docs/ARCHITECTURE.md) - Project structure
- [CHANGELOG.md](docs/CHANGELOG.md) - Version history
- [LORE_COMPENDIUM.md](docs/LORE_COMPENDIUM.md) - Skyfall Seed lore
