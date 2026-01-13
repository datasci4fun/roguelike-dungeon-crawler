# Refactoring Round 7 - Baseline

Generated: 2026-01-13
Starting from Round 6 completion
Target: Split remaining Python files over 600 LOC

## Round 7 Targets

### Python Core (non-data files over 600 LOC)
| File | LOC | Technique |
|------|-----|-----------|
| ghosts/manager.py | 710 | Extract ghost behaviors by type |
| ai_scoring.py | 700 | Extract scoring categories |
| player.py | 617 | Extract combat/ability methods |

### Deferred (data-heavy or already refactored)
| File | LOC | Notes |
|------|-----|-------|
| engine.py | 797 | Already refactored in Round 4 |
| artifacts.py | 682 | Data file - DB migration candidate |
| story_data.py | 638 | Data file - DB migration candidate |
| screens.py | 602 | Already refactored in Round 4 |
| game.py | 601 | Core orchestration - tightly coupled |

## Refactoring Log

| Date | File | Before LOC | After LOC | Changes Made |
|------|------|------------|-----------|--------------|
| 2026-01-13 | ghosts/manager.py | 710 | 249 | Extracted ghost_spawning.py (297), ghost_behaviors.py (199), ghost_trials.py (207) |
| 2026-01-13 | ai_scoring.py | 700 | 531 | Extracted ai_scoring_hazards.py (264) |
| 2026-01-13 | player.py | 617 | 568 | Extracted player_feats.py (121) |

## Summary

Round 7 reduced 3 files from 2027 total LOC to 1348 LOC (33% reduction in target files).
Created 5 new focused modules:
- ghost_spawning.py: Ghost placement and Echo path generation
- ghost_behaviors.py: Per-turn behavior processing
- ghost_trials.py: Champion trial system and Hollowed spawning
- ai_scoring_hazards.py: Hazard pathfinding and pressure analysis
- player_feats.py: Feat bonus aggregators
