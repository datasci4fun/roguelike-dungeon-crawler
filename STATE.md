# Project State

**Last Updated:** 2026-01-09
**Branch:** master
**Version:** v5.0.0 (First-Person Rendering Overhaul)

---

## Demo Account

| Field | Value |
|-------|-------|
| **Username** | `demo` |
| **Password** | `DemoPass123` |
| **URL** | http://localhost:5173/login |

---

## Current Version: v5.0.0

### Completed Features (v5.0.0)

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

### v5.0.0 Changes

**2D Canvas FirstPersonRenderer:**
- Fixed front wall span to cover full opening (derived from contiguous wall run)
- Gate floor/ceiling rendering behind blocking walls (hasFloor)
- Persistent map memory for explored-but-not-visible tiles (tile_actual for geometry, dim brightness)
- Reworked fog curves in projection.ts with smoother ramps
- Added parallax skybox that shifts with player rotation

**Server First-Person View:**
- Replaced fixed depth=8 with dynamic LOS depth (raycast forward until OOB/blocking)
- Added safety cap, decoupled width scaling from dynamic depth
- Updated entity visibility to use max_distance=depth

**3D Three.js FirstPersonRenderer3D:**
- Pure tile-based geometry (render every wall tile at its offset/depth)
- Floor+ceiling planes for non-wall tiles
- Explored-tile memory with dim materials
- Shared geometry caching (PlaneGeometry, BoxGeometry)
- Safe group clearing that disposes only non-shared resources
- Smooth movement and turn animations

### v4.8.0 Features

| Feature | Status |
|---------|--------|
| 3D torch lighting with falloff | ✅ |
| Blue fill light for shadows | ✅ |
| Atmospheric fog (2-8 tiles) | ✅ |
| Flickering torch animation | ✅ |
| Open room floor/ceiling rendering | ✅ |
| Stable tile materials (no flicker) | ✅ |

### v4.7.0 Features

| Feature | Status |
|---------|--------|
| Three.js 3D first-person renderer | ✅ |
| Triangle-based 2D texture mapping | ✅ |
| Floor/ceiling tile variants | ✅ |
| Wall UV tiling (no stretching) | ✅ |

### Key Files (v5.0.0)

| File | Purpose |
|------|---------|
| `web/src/components/SceneRenderer/FirstPersonRenderer.tsx` | 2D canvas renderer with animations |
| `web/src/components/SceneRenderer/FirstPersonRenderer3D.tsx` | Three.js 3D renderer |
| `web/src/components/SceneRenderer/projection.ts` | Fog curves and perspective math |
| `web/src/components/SceneRenderer/skybox.ts` | Parallax background system |
| `server/app/services/game_session.py` | Dynamic LOS view generation |

---

## Next Version: v5.1.0

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
