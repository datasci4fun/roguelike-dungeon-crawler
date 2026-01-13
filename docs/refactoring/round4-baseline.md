# Refactoring Round 4 - Baseline

Generated: 2026-01-13
Starting recommendations: 51
Target: Reduce to ~45 by splitting remaining Python files

## Round 4 Targets

### Python Core/Backend (carried from Round 3)
| File | LOC | Technique |
|------|-----|-----------|
| engine.py | 1262 | Extract environment processing, movement handling |
| lore.py | 991 | Split into routes, queries, and data modules |
| screens.py | 914 | Split by screen type |

### Deferred (Frontend - lower priority)
| File | LOC | Area |
|------|-----|------|
| FirstPersonTestPage.tsx | 2003 | frontend |
| BattleRenderer3D.tsx | 1472 | frontend |
| LoreCodex.scss | 1216 | frontend |
| FirstPersonRenderer.tsx | 1182 | frontend |

## Refactoring Log

| Date | File | Before LOC | After LOC | Changes Made |
|------|------|------------|-----------|--------------|
| 2026-01-13 | lore.py | 991 | 136 | Extracted lore_models.py (27 LOC), lore_content.py (876 LOC data) |
| 2026-01-13 | engine.py | 1262 | 797 | Extracted engine_environment.py (271 LOC), engine_ui_commands.py (229 LOC) |
| 2026-01-13 | screens.py | 914 | 602 | Extracted screens_title.py (181 LOC), screens_results.py (143 LOC) |
