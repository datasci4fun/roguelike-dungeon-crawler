# Roguelike Dungeon Crawler

A browser-based roguelike with procedural dungeons, first-person 3D exploration, tactical combat, and multiplayer features. Built entirely with AI assistance.

**Current Version:** v6.4.0 (Frontend Lore Alignment)

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
| **Core** | Procedural dungeons (BSP), multiple themed floors, tactical combat, FOV |
| **Battle** | Three.js tactical arena, smooth animations, floating damage numbers |
| **Characters** | Multiple races and classes, feats, level-up progression |
| **Enemies** | Varied enemy types per floor, unique bosses with signature abilities |
| **Items** | Weapons, armor, shields, rings, amulets, potions, scrolls, artifacts |
| **Visuals** | Three.js 3D renderer, biome-specific themes, cinematic cutscenes |
| **Lore** | Codex system with bestiary, locations, scrolls, books |
| **Multiplayer** | Accounts, leaderboards, ghost replays, real-time chat |
| **Mobile** | Touch controls, PWA installable |

## Controls

| Key | Action |
|-----|--------|
| WASD/Arrows | Move |
| Q/E | Turn left/right |
| I | Inventory |
| J | Lore Codex |
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
- **Backend**: FastAPI, SQLite, WebSocket
- **Frontend**: React 19, TypeScript, Vite, Three.js
- **3D Renderer**: Three.js with biome-themed textures and lighting
- **Audio**: Web Audio API (procedural SFX), Suno v4.5 (music)

## Built With AI

This project was built entirely with AI assistance in approximately two weeks:

- **Claude Opus 4.5** — Architecture, code, debugging
- **ChatGPT 5.2** — Lore, writing, design
- **Suno v4.5** — Music generation
- **DALL-E 3** — Tileset generation

See the [About page](/about) for the full story.

## Links

- **Repository**: https://github.com/datasci4fun/roguelike-dungeon-crawler
- **API Docs**: http://localhost:8000/docs (when server running)
