# Project State

**Last Updated:** 2026-01-09
**Branch:** develop
**Version:** v5.3.0 (Cinematics V2 - Death & Victory Cutscenes)

---

## Demo Account

| Field | Value |
|-------|-------|
| **Username** | `demo` |
| **Password** | `DemoPass123` |
| **URL** | http://localhost:5173/login |

---

## Current Version: v5.3.0

### Completed Features (v5.3.0)

| Feature | Status |
|---------|--------|
| Death cutscene (5-scene cinematic sequence) | ✅ |
| Victory cutscene (3-scene cinematic sequence) | ✅ |
| Random death fate variants (Echo, Hollowed, Silence) | ✅ |
| Random victory legacy variants (Beacon, Champion, Archivist) | ✅ |
| Ghost lore panels on summary screens | ✅ |
| Death camera effect in 3D renderer | ✅ |
| Death overlays (vignette, blood curtain, eyelids) | ✅ |
| File-based cinematic SFX with procedural fallback | ✅ |
| Factory pattern for cutscene creation (useState) | ✅ |
| FX cues synced to caption line completion | ✅ |

### v5.3.0 Architecture

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
├── victory/
│   └── scenes/         # 00_Seal, 01_World, 02_Legend (+ legacy variants)
└── game_over/
    └── scenes/         # 00_Fall, 01_YouDied, 02_AbyssClaims, 03_Fate (variants), 04_Prompt
```

### Death Cutscene Scenes

| Scene | Description | FX |
|-------|-------------|-----|
| 00_Fall | Camera slumps, world fades | Death cam (3D), overlays |
| 01_YouDied | "YOU DIED" title reveal | Flash, pressure |
| 02_AbyssClaims | Narrative transition | Flicker |
| 03_Fate | Random variant (Echo/Hollowed/Silence) | Per-variant FX |
| 04_Prompt | "Press any key" prompt | None |

### Victory Cutscene Scenes

| Scene | Description | FX |
|-------|-------------|-----|
| 00_Seal | "THE LAST SEAL" - abyss made to sleep | Flash, pressure |
| 01_World | "THE WORLD ABOVE" - return to surface | Light pressure |
| 02_Legend | Random legacy variant + final motif | Heavy flash/pressure |

### Ghost Lore Panels

| Type | Variants | Summary Panel |
|------|----------|---------------|
| Death | Echo, Hollowed, Silence | GameOverGhostLore |
| Victory | Beacon, Champion, Archivist | VictoryGhostLore |

### Key Files (v5.3.0)

| File | Purpose |
|------|---------|
| `web/src/components/GameOverCutscene.tsx` | Death cutscene wrapper |
| `web/src/components/VictoryCutscene.tsx` | Victory cutscene wrapper |
| `web/src/components/GameOverGhostLore.tsx` | Death fate lore panel |
| `web/src/components/VictoryGhostLore.tsx` | Victory legacy lore panel |
| `web/src/cutscenes/game_over/config.ts` | createGameOverCutscene factory |
| `web/src/cutscenes/victory/config.ts` | createVictoryCutscene factory |
| `web/src/components/SceneRenderer/FirstPersonRenderer3D.tsx` | Death camera effect |

---

## Previous Versions

### v5.2.0 Features

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

## Next Version: v5.4.0

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
- Victorious ghost behavior (beacon/champion/archivist AI)

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
