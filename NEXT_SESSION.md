# Next Session

Quick handoff document for AI assistants.

**Last Session:** 2026-01-09
**Version:** v5.3.0
**Branch:** master (clean)

---

## What Was Done

- Death cutscene system (5 scenes, 3 fate variants, death cam, overlays)
- Victory cutscene system (3 scenes, 3 legacy variants)
- Ghost lore panels tied to cutscene fate/legacy variants
- File-based cinematic SFX with procedural fallback
- PR #18 merged, v5.3.0 tagged and released

---

## Current State

```
Branch: master (clean)
Tag: v5.3.0
Remote: origin synced
Local branches: master, develop
```

---

## Testing Checklist (Not Yet Verified)

- [ ] Intro cutscene: Begin button appears only on intro
- [ ] Death cutscene: full sequence, random fate, ghost lore panel
- [ ] Victory cutscene: full sequence, random legacy, lore panel
- [ ] Skip works on both cutscenes (no UI flash)
- [ ] 3D death camera effect triggers (if 3D mode enabled)
- [ ] Audio crossfades correctly on game end

---

## Ready to Work On

### Option 1: Victorious Ghost Behavior (GPT's suggestion)
The UI now sets expectation for different ghost types:
- **Beacon**: Guide ghost (reveals paths)
- **Champion**: Combat trial ghost (challenges player)
- **Archivist**: Secret-keeper ghost (reveals hidden areas)

Would require backend work to spawn ghosts based on `GhostSummary.victory` + legacy type.

### Option 2: Database Saves (v5.4.0 roadmap)
- Persist game state to PostgreSQL
- Save on quit (auto-save)
- Load saved game
- Multiple save slots per account

### Option 3: Deferred Features
- Weather effects (rain/dripping)
- Ambient sounds
- 3D tile variants

---

## Key Locations (Cinematics)

| Purpose | Location |
|---------|----------|
| Cutscene engine | `web/src/cutscenes/engine/` |
| Death scenes | `web/src/cutscenes/game_over/scenes/` |
| Victory scenes | `web/src/cutscenes/victory/scenes/` |
| Death wrapper | `web/src/components/GameOverCutscene.tsx` |
| Victory wrapper | `web/src/components/VictoryCutscene.tsx` |
| Ghost lore panels | `web/src/components/*GhostLore.tsx` |
| Death camera | `web/src/components/SceneRenderer/FirstPersonRenderer3D.tsx` |

---

## Quick Commands

```bash
# Run web frontend
cd web && npm run dev

# Run terminal client
python main.py

# Type check
cd web && yarn tsc --noEmit

# Backend (Docker)
docker-compose up -d
```

---

## Documentation

- [STATE.md](STATE.md) - Current version details
- [docs/CHANGELOG.md](docs/CHANGELOG.md) - Version history
- [docs/](docs/) - Full documentation
