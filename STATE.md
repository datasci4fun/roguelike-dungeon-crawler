# Project State

**Last Updated:** 2026-01-06
**Branch:** develop
**Version:** v4.6.0+ (Corridor Wall Fix)

---

## Demo Account

| Field | Value |
|-------|-------|
| **Username** | `demo` |
| **Password** | `DemoPass123` |
| **URL** | http://localhost:5173/login |

---

## Current Version: v4.6.0

### Completed Features

| Feature | Status |
|---------|--------|
| Debug hotkeys (F8/F9/F10) | ✅ |
| Z-buffer occlusion for entities | ✅ |
| corridorInfo visibility fix | ✅ |
| top_down_window in snapshots | ✅ |
| useDebugRenderer hook | ✅ |
| DebugToast component | ✅ |
| Test page occlusion scenarios | ✅ |
| Corridor wall canonical offset fix | ✅ |
| tile_actual for fogged wall geometry | ✅ |

### Recent Bugfixes (post v4.6.0)

**Yellow rectangles in open rooms** - Fixed `leftWall`/`rightWall` detection
to use canonical offsets ±1 instead of visible range edges. Open rooms with
walls at offsets like -2/+3 no longer trigger corridor boundary rendering.

**Gap on left wall at depth 3** - Server now sends `tile_actual` (real map char)
alongside `tile` (display char). Fogged walls (`tile: "~"` but `tile_actual: "#"`)
are now correctly identified for geometry. Fixes missing corridor boundaries
when walls are explored-but-not-visible.

### Key Files (v4.6.0)

| File | Purpose |
|------|---------|
| `web/src/hooks/useDebugRenderer.ts` | Debug state management |
| `web/src/components/DebugToast.tsx` | Debug feedback UI |
| `web/src/components/SceneRenderer/FirstPersonRenderer.tsx` | Visibility-based corridorInfo |
| `server/app/services/game_session.py` | top_down_window generation |

---

## Next Version: v4.7.0 (Save System)

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
