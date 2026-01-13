# Refactoring Round 3 - Baseline

Generated: 2026-01-13
Starting recommendations: 52
Target: Reduce to ~45 by splitting high-priority core/backend files

## Round 3 Targets (High Priority)

### Python Core (>900 LOC)
| File | LOC | Technique |
|------|-----|-----------|
| renderer.py | 1275 | Extract panel rendering, color management, viewport logic |
| zone_layouts.py | 1273 | Split zone configs by floor/theme |
| engine.py | 1262 | Extract input handling, state management, subsystem init |
| screens.py | 914 | Split by screen type (menu, game, dialog) |

### Backend (>900 LOC)
| File | LOC | Technique |
|------|-----|-----------|
| lore.py | 991 | Split into routes, data, and query logic |

### Deferred to Round 4 (Frontend)
| File | LOC | Area |
|------|-----|------|
| FirstPersonTestPage.tsx | 2003 | frontend |
| BattleRenderer3D.tsx | 1472 | frontend |
| LoreCodex.scss | 1216 | frontend |
| FirstPersonRenderer.tsx | 1182 | frontend |
| FirstPersonRenderer3D.tsx | 1150 | frontend |

## Refactoring Log

| Date | File | Before LOC | After LOC | Changes Made |
|------|------|------------|-----------|--------------|
| 2026-01-13 | renderer.py | 1275 | 1058 | Extracted: animation_manager.py (139), render_colors.py (142) |
| 2026-01-13 | zone_layouts.py | 1273 | 39 | Split by floor: zone_layouts_early.py (511), zone_layouts_late.py (481) |

## Round 3 Progress

**Completed:** 2 of 5 files
**Recommendations:** 52 → 51

**Remaining:**
- engine.py (1262 LOC) - tightly coupled state, needs careful refactoring
- lore.py (991 LOC) - backend API
- screens.py (914 LOC) - lower priority
