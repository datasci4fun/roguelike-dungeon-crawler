# Refactoring Round 2 - Baseline

Generated: 2026-01-13
Starting recommendations: 57
Target: Reduce to ~50 by splitting high-priority core files

## Round 2 Targets (High Priority Core Files)

### Python Core (>800 LOC)
| File | LOC | Technique |
|------|-----|-----------|
| battle_manager.py | 1219 | Break `BattleManager` into composition: phases, reinforcements, rewards |
| bestiary.py | 1082 | Keep 3 `BaseModel` schemas together, split API routes |
| dungeon.py | 973 | Extract `Room`, `BSPNode` to separate modules |
| abilities.py | 895 | Split by category: elemental, boss, status effects |

### Medium Priority (deferred to Round 3)
| File | LOC | Area |
|------|-----|------|
| renderer.py | 750 | core |
| engine.py | 737 | core |
| lore.py | 730 | backend |
| zone_layouts.py | 697 | core |
| screens.py | 627 | core |
| story_data.py | 546 | core |
| manager.py | 526 | backend |

### Frontend (deferred to Round 3)
| File | LOC | Technique |
|------|-----|-----------|
| changelogData.ts | 1482 | Extract by version range |
| roadmapData.ts | 1178 | Extract interfaces to types.ts |
| BattleRenderer3D.tsx | 1080 | Extract hooks, utilities |
| LoreCodex.scss | 1007 | Split by component prefix |

## Refactoring Log

| Date | File | Before LOC | After LOC | Changes Made |
|------|------|------------|-----------|--------------|
| 2026-01-13 | battle_manager.py | 1219 | 517 + 1306 (5 files) | Split using composition: reinforcements.py (398), battle_results.py (429), enemy_turns.py (318), round_processing.py (161) |

