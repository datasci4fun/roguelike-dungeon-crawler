# Project State

**Last Updated:** 2026-01-07
**Branch:** develop
**Version:** v4.7.0+ (3D Renderer & Triangle-Based 2D)

---

## Demo Account

| Field | Value |
|-------|-------|
| **Username** | `demo` |
| **Password** | `DemoPass123` |
| **URL** | http://localhost:5173/login |

---

## Current Version: v4.7.0

### Completed Features (v4.7.0)

| Feature | Status |
|---------|--------|
| Three.js 3D first-person renderer | ✅ |
| Triangle-based 2D texture mapping | ✅ |
| Floor/ceiling tile variants | ✅ |
| Wall UV tiling (no stretching) | ✅ |
| Depth 0 floor/ceiling tiles | ✅ |
| Bidirectional slice rendering | ✅ |
| Debug wall markers (3D) | ✅ |
| Gap-free canvas rendering | ✅ |

### v4.6.0 Features

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
| OOB tile placeholder fix + offset field | ✅ |

### Recent Changes (v4.7.0)

**Three.js 3D Renderer** - New `FirstPersonRenderer3D.tsx` provides hardware-accelerated
3D rendering with proper perspective, lighting, and camera controls. Supports WASD
movement, mouse look, and torch lighting with flicker effects.

**Triangle-Based 2D Texture Mapping** - Replaced rectangle-based slice rendering with
affine triangle mapping. Each slice is now a true trapezoid (2 triangles) with:
- Quantized integer pixel boundaries (N+1 boundaries → N slices)
- Expanded triangles with outer quad clip to prevent AA cracks
- Perspective-correct texture interpolation

**Floor/Ceiling Tile Variants** - Both 2D and 3D renderers now support texture variants
(`floor_var1.png`, `floor_var2.png`, etc.) with position-seeded selection for variety.

**Wall UV Tiling** - 3D walls now tile textures correctly using UV manipulation instead
of texture.repeat, preventing compounding/stretching in long corridors.

**Depth 0 Tiles** - Fixed floor/ceiling rendering at player position (depth 0) in both
renderers. Added depth clamping to 0.3 to prevent division by zero in perspective math.

**Bidirectional Slicing** - `drawQuadSlicedHoriz` and `drawQuadSlicedVert` now handle
both directions (top-to-bottom/bottom-to-top, left-to-right/right-to-left) for proper
ceiling and right-wall rendering.

**Immediate Wall Angle Fix** - Added `endDepth` parameter to `drawWallWithTexture` so
immediate side walls (depth 0.3→1.0) render at correct angles in tile mode.

### Key Files (v4.7.0)

| File | Purpose |
|------|---------|
| `web/src/components/SceneRenderer/FirstPersonRenderer3D.tsx` | Three.js 3D renderer |
| `web/src/components/SceneRenderer/tiles/TileRenderer.ts` | Triangle-based 2D texture mapping |
| `web/src/components/SceneRenderer/tiles/TileManager.ts` | Tile variant loading |
| `web/src/pages/FirstPersonTestPage.tsx` | Test page with 2D/3D toggle |
| `web/src/components/SceneRenderer/DebugScene3D.tsx` | 3D debug visualization |

### Key Files (v4.6.0)

| File | Purpose |
|------|---------|
| `web/src/hooks/useDebugRenderer.ts` | Debug state management |
| `web/src/components/DebugToast.tsx` | Debug feedback UI |
| `web/src/components/SceneRenderer/FirstPersonRenderer.tsx` | 2D canvas renderer |
| `server/app/services/game_session.py` | top_down_window generation |

---

## Next Version: v4.8.0 (Save System)

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
