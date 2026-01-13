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
| 2026-01-13 | battle_manager.py | 1219 | 517 | Split using composition: reinforcements.py (398), battle_results.py (429), enemy_turns.py (318), round_processing.py (161) |
| 2026-01-13 | bestiary.py | 1082 | 148 | Split into: bestiary_models.py (51), bestiary_data.py (979) |
| 2026-01-13 | dungeon.py | 1564 | 899 | Extracted: zone_evidence.py (181), feature_generation.py (547) |
| 2026-01-13 | abilities.py | 1142 | 47 | Split into: ability_definitions.py (262), ability_handlers.py (616) |

## Round 2 Summary

**Files Refactored:** 4
**Main File LOC Reduction:** 5,007 → 1,611 (68% reduction)
**New Focused Modules Created:** 9

### LOC Changes by File
| Original File | Before | After | Reduction |
|---------------|--------|-------|-----------|
| battle_manager.py | 1,219 | 517 | 58% |
| bestiary.py | 1,082 | 148 | 86% |
| dungeon.py | 1,564 | 899 | 42% |
| abilities.py | 1,142 | 47 | 96% |
| **Total** | **5,007** | **1,611** | **68%** |

