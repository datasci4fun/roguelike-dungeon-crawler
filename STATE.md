# Project State

**Last Updated:** 2026-01-14
**Branch:** develop
**Version:** v6.8.0 (3D Asset Pipeline)

---

## Current Status: v6.8.0 - 3D Asset Generation Pipeline

TripoSR-based image-to-3D model generation for game assets.

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
| **Total** | **141** |

---

## Recent Changes

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
├── api/           # REST endpoints (incl. game_constants.py, assets.py)
├── core/          # Config, database, security, cache.py
├── models/        # SQLAlchemy models (incl. game_constants.py)
├── schemas/       # Pydantic schemas (incl. game_constants.py)
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
└── combat.json    # traps, hazards, status effects
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
├── components/    # UI components
├── contexts/      # React contexts
├── hooks/         # Custom hooks (incl. useGameConstants.ts)
├── pages/         # Route pages
├── services/      # API client (gameConstantsApi)
└── data/          # Static data (reduced - abilities only)
```

### Game Engine (Python)
```
src/
├── core/          # Engine, events, commands
├── combat/        # Battle system, AI
├── entities/      # Player, enemies, items
├── managers/      # Entity, level, combat managers
├── story/         # Lore, completion tracking
└── world/         # Dungeon generation, zones
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
