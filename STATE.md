# Project State

**Last Updated:** 2026-01-06
**Branch:** master
**Version:** v4.6.0 (Debug Tooling & Rendering Fixes)

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
