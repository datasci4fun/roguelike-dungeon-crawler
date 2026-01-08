# Project State

**Last Updated:** 2026-01-08
**Branch:** develop
**Version:** v4.8.0 (3D Lighting & Open Room Rendering)

---

## Demo Account

| Field | Value |
|-------|-------|
| **Username** | `demo` |
| **Password** | `DemoPass123` |
| **URL** | http://localhost:5173/login |

---

## Current Version: v4.8.0

### Completed Features (v4.8.0)

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

### Recent Changes (v4.8.0)

**3D Lighting System** - Complete lighting overhaul for atmospheric dungeon rendering:
- Torch light: PointLight with intensity 8, distance 8, decay 2 (physically correct inverse-square falloff)
- Fill light: Blue-tinted PointLight (0x4466aa) at intensity 1.5 to prevent pure black shadows
- Ambient light: Reduced from 0.3 to 0.05 for dark atmosphere by default
- Fog: Range changed from (1, 15) to (2, 8) for visible depth effect
- Flickering: Dual sine wave animation (5Hz + 13Hz) for organic torch effect

**Open Room Rendering** - Fixed 3D renderer to properly display open rooms:
- Now iterates through ALL tiles in view data (not just center x=0)
- Creates floor/ceiling geometry for each walkable tile at correct position
- Properly handles corridors, open rooms, and mixed layouts

**Stable Tile Materials** - Removed variant-based material selection in 3D:
- Variants used relative depth for hash, causing tiles to change when player moved
- Now uses shared materials for all floor/ceiling tiles
- Prevents visual flickering in explore mode

### Key Files (v4.8.0)

| File | Purpose |
|------|---------|
| `web/src/components/SceneRenderer/FirstPersonRenderer3D.tsx` | Three.js 3D renderer with lighting |

### Key Files (v4.7.0)

| File | Purpose |
|------|---------|
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

## Next Version: v4.9.0 (Save System)

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
