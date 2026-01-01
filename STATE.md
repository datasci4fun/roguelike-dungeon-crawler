# Project State Checkpoint

**Last Updated:** 2026-01-01
**Branch:** feature/add-fov-save-elites
**Version:** v1.2.0 (Elite Enemies + FOV + Save/Load)

---

## Current Status

The roguelike dungeon crawler is **fully functional** with XP/leveling, elite enemies, field of view (fog of war), and save/load with permadeath.

### Completed Features

**Core Gameplay:**
- ✅ Procedural dungeon generation using Binary Space Partitioning (BSP)
- ✅ 5 progressive dungeon levels with stairs connecting them
- ✅ Bump-to-attack combat system
- ✅ Player character with HP, ATK, and kill tracking
- ✅ Enemy AI with chase behavior (8-tile range)
- ✅ Win condition (reach level 5) and death state

**Inventory System (v1.0.0):**
- ✅ 10-slot inventory with automatic item pickup
- ✅ Health Potions - restore 10 HP
- ✅ Strength Potions - permanently increase ATK by 1
- ✅ Teleport Scrolls - random location teleport
- ✅ Item usage via hotkeys (1-3)
- ✅ Inventory display in UI panel

**XP/Leveling System (v1.1.0):**
- ✅ XP system: 15 XP per enemy kill
- ✅ Linear leveling curve (level × 30 XP required)
- ✅ Stat growth: +10 max HP, +1 ATK per level
- ✅ Full heal on level up
- ✅ Level and XP bar display in UI
- ✅ Player reaches level 6-7 by endgame
- ✅ Guaranteed 2 health potions per level
- ✅ Game is now mathematically winnable

**Elite Enemies (v1.2.0):**
- ✅ 20% elite enemy spawn rate
- ✅ Elites have 2x HP (16) and 2x damage (4)
- ✅ Award 2x XP (30) on kill for faster progression
- ✅ Render in magenta color to distinguish from regular enemies

**Field of View System (v1.2.0):**
- ✅ 8-tile visibility radius using raycasting algorithm
- ✅ Walls block line of sight (fog of war)
- ✅ Unexplored areas remain hidden (black)
- ✅ Explored-but-not-visible areas shown dim (dark gray)
- ✅ Enemies and items only visible within FOV
- ✅ FOV updates automatically after movement/teleport

**Save/Load System (v1.2.0):**
- ✅ Auto-save on quit (Q key)
- ✅ Load prompt on startup if save exists
- ✅ Permadeath: save deleted on death or victory
- ✅ Full game state serialization using pickle
- ✅ Serializes: player stats, inventory, enemies, items, dungeon tiles, FOV data

**Technical:**
- ✅ Clean module separation (dungeon, entities, combat, items, renderer, game)
- ✅ Windows support via windows-curses
- ✅ Color-coded terminal rendering
- ✅ Message log system
- ✅ Game over screen

---

## What Changed (This Session)

**Three Major Roguelike Features (v1.2.0)**

Implemented elite enemies, field of view (fog of war), and save/load with permadeath to add core roguelike mechanics and increase challenge.

**1. Elite Enemies:**
- Added 20% spawn rate for elite enemy variants
- Elites have 2x HP (16), 2x damage (4), award 2x XP (30)
- Render in magenta color for clear visual distinction
- Makes combat more varied and rewards skilled play with faster leveling

**2. Field of View (FOV):**
- Implemented 8-tile visibility radius using raycasting algorithm
- Walls block line of sight (fog of war mechanic)
- Unexplored areas remain hidden (black), explored areas shown dim (dark gray)
- Enemies and items only visible within FOV for classic roguelike feel
- FOV updates automatically after movement, teleport, and level transitions

**3. Save/Load System:**
- Auto-saves game state on quit (Q key)
- Prompts to load or start new game on startup if save exists
- Permadeath: save automatically deleted on death or victory
- Full pickle-based serialization of all game state:
  - Player: position, stats, inventory, level, XP, kills
  - Enemies: position, health, elite status
  - Items: position, type
  - Dungeon: tiles, explored/visible arrays, stairs positions
- All state correctly restored including FOV data

Files Created:
- `src/fov.py` - Raycasting FOV calculation algorithm
- `src/save_load.py` - Pickle serialization utilities

Files Modified:
- `src/constants.py` - Elite and FOV configuration constants
- `src/entities.py` - Added is_elite flag to Enemy class
- `src/game.py` - Elite spawning, FOV updates, full serialization methods
- `src/renderer.py` - Elite colors (magenta), FOV-aware rendering
- `src/dungeon.py` - FOV arrays (explored/visible) and update methods
- `main.py` - Load prompt on startup

---

## What's Next

### Priority 1: Merge and Test
1. **Merge to develop** - Merge feature/add-fov-save-elites to develop branch
2. **Full playtesting** - Test all three new features together
3. **Balance tuning** - Adjust elite spawn rate, FOV radius if needed
4. **Bug fixes** - Fix any issues found during testing

### Priority 2: Polish & Expansion
1. **More item types** - Defense potions, damage scrolls, reveal map scrolls
2. **Enemy variety** - Different enemy types with unique behaviors
3. **Boss encounters** - Special enemies on certain levels
4. **Equipment system** - Weapons and armor that can be found/equipped

### Priority 3: Advanced Systems (Partially Complete)
1. ~~**Field of view (FOV)**~~ - ✅ Completed in v1.2.0
2. **Persistent levels** - Return to previous levels with state preserved
3. ~~**Save/load system**~~ - ✅ Completed in v1.2.0 (with permadeath)
4. **Hunger/food system** - Classic roguelike mechanic

### Priority 4: Quality of Life
1. **Help screen** - In-game controls and tutorial
2. **Score/leaderboard** - Track high scores across runs
3. **Configurable difficulty** - Easy/Normal/Hard modes
4. **More hotkeys** - Drop items, look mode, rest/wait

---

## Known Issues & Bugs

**None currently identified.**

The game compiles cleanly (`py_compile`) and runs without errors.

---

## Testing Checklist (Smoke Test)

When testing changes, verify:
- [ ] Game launches without errors
- [ ] Player can move in all directions (arrows/WASD)
- [ ] Combat works (bump into enemy, see damage messages)
- [ ] Items spawn on ground and can be picked up
- [ ] Items can be used (1-3 keys)
- [ ] Stairs work (descend to next level)
- [ ] Death screen appears when HP reaches 0
- [ ] Win screen appears when reaching level 5
- [ ] Q key quits properly

---

## Architecture Notes

### Module Responsibilities
- `dungeon.py` - Generation, walkability, room/corridor management, FOV arrays
- `entities.py` - Player/Enemy classes, movement, pathfinding, elite variants
- `combat.py` - Attack mechanics, damage calculation, combat messages
- `items.py` - Item classes, inventory system
- `fov.py` - Field of view calculation using raycasting
- `save_load.py` - Game state serialization/deserialization with pickle
- `renderer.py` - Terminal rendering, UI panels, colors (NO game logic)
- `game.py` - Game loop, state machine, turn management, serialization, orchestration
- `constants.py` - All configuration values and enums

### Key Design Patterns
- **Clean separation:** Renderer never contains game logic
- **Factory pattern:** `create_item()` for item instantiation
- **State machine:** GameState enum (PLAYING, DEAD, QUIT)
- **Turn-based:** Player action triggers enemy turn

---

## Development Notes

### Running the Game
```bash
.\.venv\Scripts\python main.py
```

### Quick Health Check
```bash
# Syntax check
.\.venv\Scripts\python -m py_compile src\*.py

# Git status
git status
git log -5 --oneline
```

### Git Workflow Reminder
1. Always branch from `develop`
2. Feature branches: `feature/<short-desc>`
3. Commit frequently with clear messages
4. Merge back to `develop` when complete
5. Only merge to `master` for releases

---

## Session Protocol

**Start of session:**
1. Run `git status` and `git log -10 --oneline --decorate`
2. Run `.\.venv\Scripts\python -m py_compile src\*.py`
3. Read README.md, WORKFLOW.md, this STATE.md
4. Skim game.py, renderer.py, dungeon.py for context

**End of session:**
1. Ensure game compiles and runs
2. Commit all changes
3. Update this STATE.md with:
   - What changed
   - What's next
   - Any new bugs/regressions
