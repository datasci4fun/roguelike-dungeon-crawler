# Data Persistence Model

This document outlines the current and proposed data persistence architecture for the roguelike dungeon crawler.

## Current Data Persistence Model

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              CURRENT STATE                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌──────────────────────┐     ┌──────────────────────┐                      │
│  │    POSTGRESQL        │     │   PYTHON FILES       │                      │
│  │   (User Data)        │     │   (Game Constants)   │                      │
│  ├──────────────────────┤     ├──────────────────────┤                      │
│  │ • Users              │     │ • 28 Enemy stats     │                      │
│  │ • GameSaves (JSON)   │     │ • 8 Boss configs     │                      │
│  │ • GameResults        │     │ • 5 Race/4 Class     │                      │
│  │ • DailyChallenges    │     │ • 23 Item types      │                      │
│  │ • Achievements       │     │ • 8 Dungeon themes   │                      │
│  │ • Chat/Friends       │     │ • Combat formulas    │                      │
│  │ • CodebaseHealth     │     │ • 16 Enums           │                      │
│  └──────────────────────┘     └──────────────────────┘                      │
│           │                            │                                     │
│           │                            │  (imported at startup)              │
│           ▼                            ▼                                     │
│  ┌─────────────────────────────────────────────────────┐                    │
│  │              FASTAPI SERVER (Runtime)               │                    │
│  │  • Queries DB per request                           │                    │
│  │  • Constants loaded in memory                       │                    │
│  │  • No caching layer                                 │                    │
│  └─────────────────────────────────────────────────────┘                    │
│           │                                                                  │
│           │                                                                  │
│  ┌────────┴────────┐     ┌──────────────────────┐                           │
│  │     REDIS       │     │   TYPESCRIPT FILES   │                           │
│  │   (Unused)      │     │   (Frontend Data)    │                           │
│  ├─────────────────┤     ├──────────────────────┤                           │
│  │ • Configured    │     │ • characterData.ts   │  ◄── DUPLICATED           │
│  │ • Not utilized  │     │ • roadmapData.ts     │      from Python          │
│  │                 │     │ • changelogData.ts   │                           │
│  │                 │     │ • codebaseHealth.ts  │  ◄── Auto-generated       │
│  └─────────────────┘     │ • bestiary (API)     │                           │
│                          └──────────────────────┘                           │
│                                                                              │
│  PROBLEMS:                                                                   │
│  ❌ No caching - every DB query hits PostgreSQL                             │
│  ❌ Data duplication between Python and TypeScript                          │
│  ❌ Game constants require code deploy to change                            │
│  ❌ Large static files bundled into frontend                                │
│  ❌ No versioning for game balance changes                                  │
│  ❌ Redis sitting idle                                                      │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Proposed Data Persistence Model

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                            PROPOSED STATE                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│                    ┌─────────────────────────────────┐                      │
│                    │         POSTGRESQL              │                      │
│                    │      (Source of Truth)          │                      │
│                    ├─────────────────────────────────┤                      │
│                    │                                 │                      │
│  USER DATA         │ • Users, Sessions, Auth        │  (Write-heavy)       │
│  (Transactional)   │ • GameSaves, GameResults       │                      │
│                    │ • Achievements (progress)      │                      │
│                    │ • Chat, Friends, Daily         │                      │
│                    │                                 │                      │
│  GAME CONSTANTS    │ • Enemies, Bosses, Items       │  (Read-heavy)        │
│  (Reference)       │ • Races, Classes, Abilities    │  Version-tracked     │
│                    │ • Themes, Tiles, Combat        │  via seed files      │
│                    │                                 │                      │
│  ANALYTICS         │ • CodebaseHealth               │  (Generated)         │
│                    │ • Metrics, Logs                │                      │
│                    └─────────────────────────────────┘                      │
│                                   │                                          │
│                                   │ (write-through)                          │
│                                   ▼                                          │
│                    ┌─────────────────────────────────┐                      │
│                    │           REDIS                 │                      │
│                    │      (Caching Layer)            │                      │
│                    ├─────────────────────────────────┤                      │
│  HOT CACHE         │ • Active game sessions         │  TTL: 1 hour         │
│  (Per-User)        │ • User profiles                │  Invalidate on write │
│                    │ • Leaderboard (top 100)        │                      │
│                    │                                 │                      │
│  WARM CACHE        │ • All enemy/boss stats         │  TTL: 24 hours       │
│  (Global)          │ • Item definitions             │  Invalidate on seed  │
│                    │ • Theme configurations         │                      │
│                    │                                 │                      │
│  COMPUTED CACHE    │ • Aggregated stats             │  TTL: 5 min          │
│                    │ • Daily leaderboards           │                      │
│                    └─────────────────────────────────┘                      │
│                                   │                                          │
│                                   ▼                                          │
│                    ┌─────────────────────────────────┐                      │
│                    │        FASTAPI SERVER           │                      │
│                    ├─────────────────────────────────┤                      │
│                    │  Cache-Aside Pattern:           │                      │
│                    │  1. Check Redis                 │                      │
│                    │  2. If miss → Query Postgres    │                      │
│                    │  3. Populate Redis              │                      │
│                    │  4. Return data                 │                      │
│                    └─────────────────────────────────┘                      │
│                                   │                                          │
│                                   ▼                                          │
│                    ┌─────────────────────────────────┐                      │
│                    │      REACT FRONTEND             │                      │
│                    ├─────────────────────────────────┤                      │
│                    │  • Fetches ALL data via API     │                      │
│                    │  • React Query for caching      │                      │
│                    │  • No static data files         │                      │
│                    │  • Smaller bundle size          │                      │
│                    └─────────────────────────────────┘                      │
│                                                                              │
│                    ┌─────────────────────────────────┐                      │
│                    │       GIT (Version Control)     │                      │
│                    ├─────────────────────────────────┤                      │
│                    │  data/seeds/                    │                      │
│                    │  ├── enemies.json               │  Game balance        │
│                    │  ├── bosses.json                │  changes tracked     │
│                    │  ├── items.json                 │  in git, synced      │
│                    │  ├── races.json                 │  to DB on deploy     │
│                    │  ├── classes.json               │                      │
│                    │  └── themes.json                │                      │
│                    │                                 │                      │
│                    │  scripts/seed_database.py       │  Idempotent loader   │
│                    └─────────────────────────────────┘                      │
│                                                                              │
│  BENEFITS:                                                                   │
│  ✅ Redis caches hot data - reduces DB load 90%+                            │
│  ✅ Single source of truth (PostgreSQL)                                     │
│  ✅ Game constants in JSON - easy to review/version                         │
│  ✅ Frontend bundle smaller - data loaded on demand                         │
│  ✅ Balance changes don't require frontend deploy                           │
│  ✅ Cache invalidation on data changes                                      │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Data Flow by Operation

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         READ OPERATIONS                                      │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  GET /api/enemies                                                            │
│  ┌─────────┐    ┌─────────┐    ┌─────────┐                                  │
│  │ Request │───▶│  Redis  │───▶│  Return │  (Cache HIT - 1ms)               │
│  └─────────┘    └─────────┘    └─────────┘                                  │
│                      │                                                       │
│                      │ (miss)                                                │
│                      ▼                                                       │
│                 ┌─────────┐    ┌─────────┐    ┌─────────┐                   │
│                 │Postgres │───▶│ Populate│───▶│  Return │  (Cache MISS)     │
│                 │  Query  │    │  Redis  │    │         │  (5-10ms)         │
│                 └─────────┘    └─────────┘    └─────────┘                   │
│                                                                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                         WRITE OPERATIONS                                     │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  POST /api/game/save                                                         │
│  ┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐                   │
│  │ Request │───▶│Postgres │───▶│Invalidate───▶│  Return │                   │
│  └─────────┘    │  Write  │    │  Redis  │    └─────────┘                   │
│                 └─────────┘    └─────────┘                                  │
│                                                                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                      SEED OPERATIONS (Deploy)                                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  python scripts/seed_database.py                                             │
│  ┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐                   │
│  │  JSON   │───▶│Postgres │───▶│  Flush  │───▶│  Done   │                   │
│  │  Seeds  │    │  Upsert │    │  Redis  │    │         │                   │
│  └─────────┘    └─────────┘    └─────────┘    └─────────┘                   │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Cache Key Structure

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         REDIS KEY PATTERNS                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  GLOBAL GAME DATA (Long TTL - 24h)                                          │
│  ─────────────────────────────────                                          │
│  game:enemies              → Hash of all enemy stats                        │
│  game:enemies:{id}         → Single enemy (if needed)                       │
│  game:bosses               → Hash of all boss stats                         │
│  game:items                → Hash of all item definitions                   │
│  game:races                → Hash of race definitions                       │
│  game:classes              → Hash of class definitions                      │
│  game:themes               → Hash of theme configurations                   │
│  game:version              → Current seed version (for invalidation)        │
│                                                                              │
│  USER DATA (Medium TTL - 1h)                                                │
│  ─────────────────────────                                                  │
│  user:{id}:profile         → User profile data                              │
│  user:{id}:achievements    → User's unlocked achievements                   │
│  user:{id}:saves           → User's save slot metadata                      │
│  session:{token}           → Active session data                            │
│                                                                              │
│  COMPUTED/AGGREGATES (Short TTL - 5min)                                     │
│  ─────────────────────────────────────                                      │
│  leaderboard:global        → Top 100 all-time                               │
│  leaderboard:daily:{date}  → Daily challenge leaderboard                    │
│  stats:codebase            → Codebase health summary                        │
│  stats:active_users        → Current active user count                      │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Current Data Inventory

### PostgreSQL (server/app/models/)

| Model | Purpose | Write Frequency |
|-------|---------|-----------------|
| `User` | Account credentials, leaderboard stats | Medium |
| `GameSave` | In-progress game states (3 slots/user) | High |
| `GameResult` | Completed game records, ghost data | Medium |
| `DailyChallenge` | Daily challenge metadata | Daily |
| `DailyChallengeResult` | User's daily attempts | Medium |
| `UserAchievement` | Unlocked achievements | Low |
| `Friendship` | Social connections | Low |
| `ChatMessage` | Chat history | High |
| `CodebaseFileStats` | File metrics | On-demand |
| `CodebaseRefactorTodo` | Refactor suggestions | On-demand |
| `CodebaseScanMeta` | Scan metadata | On-demand |

### Python Constants (src/core/constants/)

| File | Data | Records |
|------|------|---------|
| `enums.py` | 16 game enumerations | ~150 values |
| `enemy_data.py` | Enemy stats, floor pools | 28 enemies |
| `boss_data.py` | Boss stats, loot tables | 8 bosses |
| `player_data.py` | Race/class stats, XP curves | 5 races, 4 classes |
| `world_data.py` | Themes, tiles, decorations | 8 themes |
| `combat_data.py` | Elements, traps, hazards | ~20 configs |
| `ui_config.py` | Panel sizes, box drawing | ~30 constants |

### Server API Data (server/app/api/)

| File | Data | Records |
|------|------|---------|
| `bestiary_data.py` | Full creature definitions | 62 creatures |
| `lore_content.py` | Lore/story content | Variable |

### TypeScript Data (web/src/data/)

| File | Data | Status |
|------|------|--------|
| `characterData.ts` | Race/class definitions | Duplicated from Python |
| `roadmapData.ts` | Development roadmap | Manual |
| `changelogData.ts` | Version history | Auto-generated |
| `codebaseHealthData.ts` | File metrics | Auto-generated |

---

## Migration Phases

| Phase | Task | Effort | Status |
|-------|------|--------|--------|
| **1** | Create JSON seed files from Python constants | Medium | Not Started |
| **2** | Create DB models for game constants | Small | Not Started |
| **3** | Create seed loader script | Small | Not Started |
| **4** | Add Redis caching layer to existing endpoints | Medium | Not Started |
| **5** | Create API endpoints for game constants | Medium | Not Started |
| **6** | Update frontend to fetch from API | Large | Not Started |
| **7** | Remove static TS data files | Small | Not Started |
| **8** | Add cache invalidation on writes | Small | Not Started |

---

## Phase 1: Seed Files to Create

```
data/
└── seeds/
    ├── enemies.json       # 28 enemy definitions
    ├── bosses.json        # 8 boss definitions
    ├── items.json         # 23 item types
    ├── races.json         # 5 race definitions
    ├── classes.json       # 4 class definitions
    ├── themes.json        # 8 dungeon themes
    ├── traps.json         # 4 trap types
    ├── hazards.json       # 4 hazard types
    ├── elements.json      # Element relationships
    └── achievements.json  # Achievement definitions
```

Each seed file should include:
- `version`: Semantic version for tracking changes
- `updated_at`: Timestamp of last modification
- `data`: Array of records

Example structure:
```json
{
  "version": "1.0.0",
  "updated_at": "2026-01-13T00:00:00Z",
  "data": [...]
}
```
