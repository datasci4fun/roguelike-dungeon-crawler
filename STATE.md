# Project State

**Last Updated:** 2026-01-08
**Branch:** master
**Version:** v5.1.0 (Cinematic Intro & Responsive View)

---

## Demo Account

| Field | Value |
|-------|-------|
| **Username** | `demo` |
| **Password** | `DemoPass123` |
| **URL** | http://localhost:5173/login |

---

## Current Version: v5.1.0

### Completed Features (v5.1.0)

| Feature | Status |
|---------|--------|
| Cinematic intro with 7 narrative scenes | ✅ |
| Parallax backgrounds per scene | ✅ |
| Particle effects (stars, embers, dust, darkness) | ✅ |
| Scene transitions with solid black (no bleed) | ✅ |
| "Begin Your Adventure" button on final scene | ✅ |
| 3-second pause at end of each scene | ✅ |
| Responsive 3D/2D renderer (fills container) | ✅ |

### v5.1.0 Changes

**Cinematic Intro (GameIntro.tsx/css):**
- 7 scenes: Title, Kingdom, Darkness, Underground, Depths, Present, Your Story
- Scene-specific CSS backgrounds with parallax layers
- Particle systems: stars, embers, dust, darkness particles
- Fixed fade transitions (content fades, background stays solid black)
- Progressive line reveal with 600ms delays
- 3-second pause at end of each scene before transition
- "Begin Your Adventure" button appears after final scene
- Cinematic letterbox bars and progress indicator dots

**Responsive Renderer (Play.tsx/css):**
- Added ResizeObserver to track scene container size
- 3D/2D renderers now fill 100% of available space
- Removed hardcoded 800x600 dimensions

### v5.0.0 Features

| Feature | Status |
|---------|--------|
| Dynamic LOS-based render distance | ✅ |
| Smooth movement/turn animations (2D & 3D) | ✅ |
| Map memory for explored tiles | ✅ |
| Reworked fog curves (smoother falloff) | ✅ |
| Front wall span fix (no side leaks) | ✅ |
| Pure tile-based 3D geometry | ✅ |
| Shared geometry caching (3D perf) | ✅ |
| Parallax skybox system | ✅ |

### Key Files (v5.1.0)

| File | Purpose |
|------|---------|
| `web/src/components/GameIntro.tsx` | Cinematic intro with scenes |
| `web/src/components/GameIntro.css` | Scene backgrounds and animations |
| `web/src/pages/Play.tsx` | Responsive renderer sizing |
| `web/src/components/SceneRenderer/FirstPersonRenderer.tsx` | 2D canvas renderer |
| `web/src/components/SceneRenderer/FirstPersonRenderer3D.tsx` | Three.js 3D renderer |

---

## Next Version: v5.2.0

| Feature | Description |
|---------|-------------|
| Database saves | Persist game state to PostgreSQL |
| Save on quit | Auto-save when quitting |
| Load saved game | Restore from database |
| Multiple slots | Multiple characters per account |

### Deferred

- Weather effects (rain/dripping)
- Ambient sounds
- 3D tile variants (requires world coordinates in view data)

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
