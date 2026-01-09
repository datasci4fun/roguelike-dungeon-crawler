# Project State

**Last Updated:** 2026-01-09
**Branch:** develop
**Version:** v5.2.0 (Modular Cutscene Engine)

---

## Demo Account

| Field | Value |
|-------|-------|
| **Username** | `demo` |
| **Password** | `DemoPass123` |
| **URL** | http://localhost:5173/login |

---

## Current Version: v5.2.0

### Completed Features (v5.2.0)

| Feature | Status |
|---------|--------|
| Modular cutscene engine architecture | ✅ |
| Retro CRT phosphor text reveal | ✅ |
| Per-character staggered ignition animation | ✅ |
| FX system (flash, shake, flicker, pressure) | ✅ |
| FX cues tied to caption line completion | ✅ |
| Scene-scoped CSS classes for per-scene styling | ✅ |
| Debug mode panel for scene iteration | ✅ |
| 7-scene intro cutscene with effects | ✅ |
| Victory and game_over cutscene stubs | ✅ |

### v5.2.0 Architecture

```
web/src/cutscenes/
├── engine/
│   ├── hooks/          # useCutsceneTimeline, useFxBus
│   ├── layers/         # SceneBackground, Particles, FX, CRT
│   ├── text/           # RetroCaption with phosphor reveal
│   ├── ui/             # CutsceneHUD
│   ├── CutscenePlayer.tsx
│   └── types.ts
├── intro/
│   └── scenes/         # 00_Title through 06_You
├── victory/            # Stub for future
└── game_over/          # Stub for future
```

### Key Features

| Feature | Description |
|---------|-------------|
| Scene transitions | Fade in/visible/out with configurable durations |
| FX cues | Effects triggered on caption line completion |
| Pressure pulse | Screen-wide dramatic darkening effect |
| Transition curtain | Clean scene swaps without UI flashes |
| Scene-scoped CSS | Per-scene styling via `.cs-scene-{id}` classes |
| Debug mode | Set `DEBUG_MODE = true` in CutscenePlayer.tsx |

### Intro Scenes

| Scene | Description | Particles |
|-------|-------------|-----------|
| 00_Title | ASCII art title reveal | none |
| 01_Kingdom | Establishing shot | stars |
| 02_Darkness | The catastrophe | ash |
| 03_Underground | Ancient depths | mist |
| 04_Centuries | Time passage | magic |
| 05_Present | Return to entrance | embers |
| 06_You | Player vow with fxCues | embers |

### Key Files (v5.2.0)

| File | Purpose |
|------|---------|
| `web/src/cutscenes/engine/CutscenePlayer.tsx` | Main orchestrator |
| `web/src/cutscenes/engine/types.ts` | Type definitions |
| `web/src/cutscenes/engine/hooks/useCutsceneTimeline.ts` | Scene progression |
| `web/src/cutscenes/engine/hooks/useFxBus.ts` | FX management |
| `web/src/cutscenes/engine/text/RetroCaption.tsx` | CRT text reveal |
| `web/src/cutscenes/intro/config.ts` | Intro cutscene config |

---

## Previous Versions

### v5.1.0 Features

| Feature | Status |
|---------|--------|
| Cinematic intro with 7 narrative scenes | ✅ |
| Parallax backgrounds per scene | ✅ |
| Particle effects (stars, embers, dust, darkness) | ✅ |
| Scene transitions with solid black (no bleed) | ✅ |
| Responsive 3D/2D renderer (fills container) | ✅ |

### v5.0.0 Features

| Feature | Status |
|---------|--------|
| Dynamic LOS-based render distance | ✅ |
| Smooth movement/turn animations (2D & 3D) | ✅ |
| Map memory for explored tiles | ✅ |
| Pure tile-based 3D geometry | ✅ |
| Parallax skybox system | ✅ |

---

## Next Version: v5.3.0

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
