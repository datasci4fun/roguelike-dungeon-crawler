# Roguelike Dungeon Crawler

A browser-based roguelike with procedural dungeons, first-person 3D exploration, tactical combat, and multiplayer features. Built entirely with AI assistance.

**Current Version:** v7.1.0 (Zone Layout Designer)

## Quick Start

### Web Frontend (Recommended)
```bash
# Start all services (backend + frontend)
docker-compose up -d
```
Open http://localhost:5173 | Demo login: `demo` / `DemoPass123`

### Terminal Client (Single Player)
```bash
pip install -r requirements.txt
python main.py
```

## Features Overview

| Category | Highlights |
|----------|------------|
| **Core** | Procedural dungeons (BSP), 8 themed floors, tactical combat, FOV |
| **Exploration** | Interactive walls, puzzles, murals, inscriptions, hidden doors |
| **D&D Combat** | d20 attack rolls, armor class, saving throws, 3D animated dice |
| **Battle** | Three.js tactical arena, smooth animations, floating damage numbers |
| **Characters** | 5 races, 4 classes, STR/DEX/CON/LUCK ability scores |
| **Enemies** | 28 enemy types + 8 spice enemies, 8 unique floor bosses |
| **Items** | Weapons with damage dice, armor, shields, rings, amulets, potions, scrolls |
| **Visuals** | Three.js 3D renderer, biome-specific themes, set pieces |
| **UI** | 3D overlay HUD, minimap, tabbed message panel, character window |
| **Lore** | Codex system with bestiary, locations, environmental storytelling |
| **Multiplayer** | Accounts, leaderboards, ghost replays, achievements, daily challenges |
| **Tools** | Level Editor, 3D asset pipeline (TripoSR), Model Generator |
| **Mobile** | Touch controls, PWA installable |

## Controls

| Key | Action |
|-----|--------|
| WASD/Arrows | Move |
| Q/E | Turn left/right |
| E/Click | Interact with walls |
| I | Inventory |
| J | Lore Codex |
| F | Search for secrets |
| C/M/? | Character/Messages/Help |
| ESC | Game Menu |
| X | Quit |

### Debug Hotkeys (DEV or `?debug=1`)

| Key | Action |
|-----|--------|
| F1-F7 | God mode, kill all, heal, next floor, reveal map, spawn lore, show zones |
| F8 | Toggle wireframe overlay |
| F9 | Toggle occluded entity silhouettes |
| F10 | Copy scene snapshot to clipboard |

## Documentation

| Document | Description |
|----------|-------------|
| [Features](docs/FEATURES.md) | Complete feature list by version |
| [Gameplay](docs/GAMEPLAY.md) | Controls, mechanics, enemies, items |
| [Development](docs/DEVELOPMENT.md) | Setup, building, testing |
| [Architecture](docs/ARCHITECTURE.md) | Project structure, file organization |
| [Changelog](docs/CHANGELOG.md) | Version history |
| [Diagnostics](DIAGNOSTICS.md) | Dev tools, debug hotkeys, troubleshooting |

## Project Files

| File | Purpose |
|------|---------|
| [STATE.md](STATE.md) | Current development state |
| [NEXT_SESSION.md](NEXT_SESSION.md) | Session checkpoint and next steps |
| [ROADMAP_PLAN.md](ROADMAP_PLAN.md) | Development roadmap |
| [WORKFLOW.md](WORKFLOW.md) | Git workflow guidelines |
| [CLAUDE.md](CLAUDE.md) | AI assistant instructions |

## Tech Stack

- **Game Engine**: Python 3.9+ with curses
- **Backend**: FastAPI, PostgreSQL, Redis, WebSocket
- **Frontend**: React 19, TypeScript, Vite, Three.js
- **3D Renderer**: Three.js with biome-themed textures and lighting
- **3D Pipeline**: TripoSR (image-to-3D) in Docker
- **Audio**: Web Audio API (procedural SFX), Suno v4.5 (music)

## Project Stats

| Metric | Value |
|--------|-------|
| Lines of Code | 118,000+ |
| React Components | 55+ |
| Python Modules | 216+ |
| Merged PRs | 80 |
| Database Tables | 167 seeded records |

## Built With AI

v1.0 through v7.1.0 was built entirely with AI assistance over approximately three weeks (Dec 30, 2025 – Jan 17, 2026):

- **Claude Opus 4.5** — Architecture, code, debugging
- **ChatGPT 5.2** — Lore, writing, design
- **Suno v4.5** — Music generation
- **DALL-E 3** — Tileset generation

See the [About page](/about) for the full story.

## Links

- **Repository**: https://github.com/datasci4fun/roguelike-dungeon-crawler
- **Level Editor**: http://localhost:5173/level-editor (when running)
- **API Docs**: http://localhost:8000/docs (when server running)
