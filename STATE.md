# Project State

**Last Updated:** 2026-01-12
**Branch:** master
**Version:** v6.5.1 (Roadmap Complete)

---

## Current Status: v6.5.1 - Roadmap Complete

All implementation roadmap items completed. Only research/exploratory items remain.

### Completed Roadmap Summary

| Priority | Items | Status |
|----------|-------|--------|
| Critical | crit-01, crit-02 | ✅ Complete |
| High | high-01 through high-06 | ✅ Complete |
| Medium | med-01 through med-07 | ✅ Complete |
| Low | low-01 through low-06 | ✅ Complete |

### Key Features by Priority

**Critical:**
- Ghost victory behaviors (Beacon, Champion, Archivist)

**High:**
- Database save system (PostgreSQL, multiple slots)
- Stealth AI (sneak attacks, backstab, noise)
- Elemental AI (fire/ice/poison behaviors)
- Field pulse micro-events
- React error boundaries

**Medium:**
- Stats dashboard, social features, settings persistence
- Keyboard navigation, screen reader accessibility
- Secret ending hooks (SecretFlag, SecretProgress)

**Low:**
- ICE slide mechanic (Floor 5)
- Floor Diorama 3D (Home page visualization)
- Character Preview 3D (creation screen)
- Daily challenges API (seeded runs, leaderboards, streaks)
- Achievement system (33 achievements)
- Spectator mode (WebSocket streaming)

### Remaining: Research Items

| ID | Title | Effort |
|----|-------|--------|
| res-01 | 3D Asset Pipeline (AI-generated models) | Epic |
| res-02 | Mobile Performance Optimization | Large |
| res-03 | WebGPU Migration | Epic |
| res-04 | Procedural Music | Large |

---

## Version History

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

### v6.3.1 (2026-01-12) - Battle Polish
- Smooth entity movement transitions (lerp)
- Floating damage numbers
- Enemy bump → battle initiation fix
- Reinforcement symbol display fix

### v6.3 (2026-01-12) - Three.js Battle Renderer
- First-person 3D tactical combat
- Cinematic overview phase
- Mouse-based tile selection
- Contained overlay system

### v6.2.1 (2026-01-11) - Kiting Heuristics
- Ranged AI maintains preferred distance (3-5 tiles)
- Edge/corner avoidance, retreat lane preservation

### v6.2.0 (2026-01-11) - Tactical Depth
- Deterministic AI scoring system
- Hazard-aware pathfinding with costs
- Boss-specific heuristics (7 bosses)

### v6.1.0 (2026-01-12) - Cinematic Glue
- Transition orchestrator (ENGAGE, WIN, FLEE, DEFEAT, BOSS_VICTORY)
- TransitionCurtain with letterbox bars
- Arena overview pan

### v6.0.0 (2026-01-11) - Tactical Battle Mode
- 9x7 tactical arenas with biome templates
- 4 class ability kits
- Reinforcement spawning system
- Field pulse integration

---

## Architecture Overview

### Backend (Python/FastAPI)
```
server/app/
├── api/           # REST endpoints
├── core/          # Config, database, security
├── models/        # SQLAlchemy models
├── schemas/       # Pydantic schemas
└── services/      # Business logic
```

### Frontend (React/TypeScript)
```
web/src/
├── components/    # UI components
├── contexts/      # React contexts
├── hooks/         # Custom hooks
├── pages/         # Route pages
└── data/          # Static data
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

### Completion Tracking
- Floors cleared (8 total)
- Wardens defeated (8 bosses)
- Lore discovered (32 entries)
- Artifacts collected (3 total)
- Evidence found (16 items)

---

## Quick Reference

### Commands
```bash
# Terminal client
python main.py

# Web frontend
cd web && npm run dev

# Backend (Docker)
docker-compose up -d

# Type check
cd web && npx tsc --noEmit

# Python tests
.venv/Scripts/python -m pytest tests/ -v
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

- [FEATURES.md](docs/FEATURES.md) - Complete feature list
- [GAMEPLAY.md](docs/GAMEPLAY.md) - Controls and mechanics
- [DEVELOPMENT.md](docs/DEVELOPMENT.md) - Setup and building
- [ARCHITECTURE.md](docs/ARCHITECTURE.md) - Project structure
- [CHANGELOG.md](docs/CHANGELOG.md) - Version history
- [LORE_COMPENDIUM.md](docs/LORE_COMPENDIUM.md) - Skyfall Seed lore
