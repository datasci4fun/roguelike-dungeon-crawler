# Refactoring Round 1 - Baseline

Generated: 2026-01-13
Total recommendations: 61 → 58 (after refactoring)

## Files to Refactor (snapshot before changes)

### High Priority (>800 LOC)
| File | LOC | Technique |
|------|-----|-----------|
| battle_manager.py | 1219 | Break `BattleManager` into smaller classes using composition pattern |
| bestiary.py | 1082 | 3 `BaseModel` schemas - keep together | Split API routes |
| constants.py | 1043 | Keep 16 related Enums together; consider `enums.py` |
| dungeon.py | 973 | Review file structure and extract cohesive modules |
| game_session.py | 943 | Related by `GameSession` prefix: `GameSession`, `GameSessionManager` |
| abilities.py | 895 | Break down large functions: `calculate_elemental_damage`, `execute_ability` |

### Medium Priority (500-800 LOC)
| File | LOC | Technique |
|------|-----|-----------|
| renderer.py | 750 | Break `Renderer` into smaller classes using composition |
| engine.py | 737 | Break `GameEngine` into smaller classes using composition |
| lore.py | 730 | 2 `BaseModel` schemas - keep together | Split API routes |
| items.py | 710 | 13 subclasses of `Item` | Related by `Ring`/`Amulet` prefix |
| zone_layouts.py | 697 | Group related functions into: `layout_*.py` |
| entities.py | 655 | Base `Entity` with subclasses `Player`, `Enemy` |
| screens.py | 627 | Break down large functions: `render_game_over`, `render_victory_screen` |
| ghosts.py | 557 | Related by `Ghost` prefix: `Ghost`, `GhostPath`, `GhostManager` |
| story_data.py | 546 | Review file structure |

## Refactoring Log

| Date | File | Before LOC | After LOC | Changes Made |
|------|------|------------|-----------|--------------|
| 2026-01-13 | ghosts.py | 557 | 596 (4 files) | Split into package: types.py (58), ghost.py (54), manager.py (460), __init__.py (24) |
| 2026-01-13 | entities.py | 655 | 668 (5 files) | Split into package: base.py (39), player.py (433), enemy.py (188), __init__.py (8), shim (2) |
| 2026-01-13 | items.py | 710 | 768 (8 files) | Split into package: types.py (85), base.py (71), equipment.py (119), accessories.py (133), ranged.py (140), consumables.py (192), factory.py (111), __init__.py (84), shim (2) |

