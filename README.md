# Roguelike Dungeon Crawler

A terminal-based roguelike with procedural dungeons, first-person 3D view, multiplayer backend, and React web frontend.

**Current Version:** v4.6.0 (Debug Tooling & Rendering Fixes)

## Quick Start

### Web Frontend (Recommended)
```bash
# Start backend (requires Docker)
docker-compose up -d

# Start frontend
cd web && npm install && npm run dev
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
| **Core** | Procedural dungeons (BSP), 5 themed levels, bump-to-attack combat, FOV |
| **Characters** | 5 races, 3 classes, 18 feats, level-up progression |
| **Enemies** | 12 enemy types + 5 bosses with unique abilities and AI |
| **Items** | Weapons, armor, shields, rings, amulets, potions, scrolls |
| **Visuals** | First-person 3D renderer, 8 biome themes, torch lighting |
| **Multiplayer** | Accounts, leaderboards, ghost replays, real-time chat |
| **Mobile** | Touch controls, PWA installable |

## Controls

| Key | Action |
|-----|--------|
| WASD/Arrows | Move |
| Q/E | Turn left/right |
| I | Inventory |
| F | Search for secrets |
| C/M/? | Character/Messages/Help |
| X | Quit |

### Debug Hotkeys (DEV or `?debug=1`)

| Key | Action |
|-----|--------|
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
| [Visuals](docs/VISUALS.md) | Screenshots and visual guide |

## Project Files

| File | Purpose |
|------|---------|
| [STATE.md](STATE.md) | Current development state |
| [WORKFLOW.md](WORKFLOW.md) | Git workflow guidelines |
| [CLAUDE.md](CLAUDE.md) | AI assistant instructions |

## Tech Stack

- **Game Engine**: Python 3.9+ with curses
- **Backend**: FastAPI, PostgreSQL, Redis, WebSocket
- **Frontend**: React 19, TypeScript, Vite, xterm.js
- **3D Renderer**: Canvas 2D with perspective projection

## Links

- **Repository**: https://github.com/datasci4fun/roguelike-dungeon-crawler
- **API Docs**: http://localhost:8000/docs (when server running)
- **Test Page**: http://localhost:5173/first-person-test
