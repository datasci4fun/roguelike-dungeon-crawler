# Project State

**Last Updated:** 2026-01-06
**Branch:** master
**Version:** v4.5.0 (Biome Theming & Tile Engine)

---

## Demo Account

| Field | Value |
|-------|-------|
| **Username** | `demo` |
| **Password** | `DemoPass123` |
| **URL** | http://localhost:5173/login |

---

## Current Version: v4.5.0

### Completed Features

| Feature | Status |
|---------|--------|
| Wall decorations (moss, cracks, cobwebs) | ✅ |
| 8 biome themes with color palettes | ✅ |
| Tile loading engine for custom PNGs | ✅ |
| Data-driven torch lighting | ✅ |
| FOV cone filtering | ✅ |
| Relative movement (WASD to facing) | ✅ |
| Water reflections | ✅ |
| Stairs rendering | ✅ |
| Secret door system | ✅ |
| Compass HUD | ✅ |
| Trap rendering | ✅ |

### Key Files (v4.5.0)

| File | Purpose |
|------|---------|
| `web/src/components/SceneRenderer/biomes.ts` | 8 biome theme definitions |
| `web/src/components/SceneRenderer/tiles/` | Tile loading system |
| `src/world/torches.py` | Server-side torch placement |
| `web/public/tiles/` | Custom tile directories |

---

## Next Version: v4.6.0 (Save System)

| Feature | Description |
|---------|-------------|
| Database saves | Persist game state to PostgreSQL |
| Save on quit | Auto-save when quitting |
| Load saved game | Restore from database |
| Multiple slots | Multiple characters per account |

### Deferred

- Weather effects (rain/dripping)
- Ambient sounds

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
