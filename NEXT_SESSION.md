# Next Session - UI Migration to 3D View

## Session Date: 2026-01-15

## Current Session Completed

### CharacterWindow Enhancements
- **Redesigned styling** - Traditional RPG parchment/stone aesthetic with fixed sizing
- **Inventory tab integration** - Moved inventory from separate window into CharacterWindow tab
- **Equipment tab** - Full equipment management with 5 slots (Weapon, Off-Hand, Armor, Ring, Amulet)
- **Journal tab** - Lore summary with progress bar, category breakdown, recent discoveries
- **Unequip functionality** - Backend commands for unequipping items from Character screen

### LoreCodex Integration
- **Moved inside 3D scene container** - Now renders as overlay within scene-wrapper
- **Position changed** - From `position: fixed` to `position: absolute`
- **Integrated with CharacterWindow** - Journal tab shows lore summary with button to open full Codex

### Inventory Click Selection Fix
- **Added INVENTORY_SELECT command** - Direct selection by index instead of looped navigation
- **Updated sendCommand** - Now accepts optional data parameter for commands with payloads
- **Fixed in both contexts** - GameContext.tsx and useGameSocket.ts updated

**Files Modified:**
- `web/src/components/CharacterWindow.tsx` - Major updates, all tabs functional
- `web/src/components/CharacterWindow.css` - Equipment and Journal tab styles
- `web/src/components/LoreCodex/LoreCodex.scss` - Position fix for scene container
- `web/src/pages/Play.tsx` - LoreCodex moved inside scene-wrapper, new props
- `web/src/contexts/GameContext.tsx` - sendCommand with data support
- `web/src/hooks/useGameSocket.ts` - sendCommand with data support
- `src/core/commands.py` - INVENTORY_SELECT, UNEQUIP_* commands
- `src/core/engine_ui_commands.py` - Handlers for new commands
- `server/app/services/game_session/manager.py` - Command routing fixes
- `server/app/services/game_session/manager_serialization.py` - Equipment serialization

---

## Next Major Task: UI Migration

### Reference Document
**See [PLAN_UI_MIGRATION.md](PLAN_UI_MIGRATION.md)** for the complete implementation plan.

### Goal
Move all terminal UI elements into the 3D first-person view to eventually hide the terminal panel entirely.

### Implementation Order

| Phase | Component | Location | Status |
|-------|-----------|----------|--------|
| 1 | **StatsHUD** | Top-left of 3D view | Not started |
| 2 | **ChatPanel** | Bottom-left, tabbed messages | Not started |
| 3 | **Minimap** | Bottom-right, tile grid | Not started |
| 4 | **HelpWindow** | Modal window | Not started |
| 5 | **GameMenu** | Modal with save/load | Not started |
| 6 | **Terminal Toggle** | Hide terminal option | Not started |

### Phase 1: StatsHUD
**First component to build** - Displays player vitals in top-left:
- Level with class name
- HP bar (color-coded by health %)
- XP bar (progress to next level)
- ATK, DEF, Kills stats with icons
- Low health warning effects

**Data available**: `gameState.player` has all required stats

### Phase 5 Backend Work
Save/Load system requires new endpoints:
- `POST /api/game/save`
- `GET /api/game/saves`
- `POST /api/game/load/{save_id}`

---

## Quick Start

```bash
# Start backend server
cd server && .venv/Scripts/python -m uvicorn app.main:app --reload --port 8000

# Start frontend dev server
cd web && npm run dev

# Or use docker-compose
docker-compose up -d
```

---

## Testing Current Changes

1. **CharacterWindow** - Press C, verify all 5 tabs work
2. **Inventory in CharacterWindow** - Press C then tab 3, or press I directly
3. **Click selection** - Click items in inventory list, should select immediately
4. **Equipment tab** - Press C then tab 4, see equipped items, test Unequip button
5. **Journal tab** - Press C then tab 5, see lore progress and categories
6. **LoreCodex** - Press J, should render inside 3D view area (not full screen)

---

## Architecture Notes

### Current Component Hierarchy (3D View)
```
Play.tsx
└── scene-wrapper (position: relative)
    ├── FirstPersonRenderer3D / BattleRenderer3D
    ├── CharacterHUD (top-right area)
    ├── StatusHUD (field pulse, artifacts)
    ├── CharacterWindow (modal, centered)
    ├── LoreCodex (modal, centered)
    └── TransitionCurtain / Cutscenes
```

### Target Component Hierarchy (After Migration)
```
Play.tsx
└── scene-wrapper (position: relative)
    ├── FirstPersonRenderer3D / BattleRenderer3D
    ├── StatsHUD (NEW - top-left)
    ├── CharacterHUD (existing - top-right)
    ├── StatusHUD (existing)
    ├── Minimap (NEW - bottom-right)
    ├── ChatPanel (NEW - bottom-left)
    ├── CharacterWindow (modal)
    ├── LoreCodex (modal)
    ├── HelpWindow (NEW - modal)
    ├── GameMenu (NEW - modal)
    └── TransitionCurtain / Cutscenes
```

---

## Known Issues

None currently blocking. All implemented features working correctly.

---

## Git Status

Branch: `feature/camera-perspective-toggle`

Uncommitted changes from this session - should commit before starting UI migration work.
