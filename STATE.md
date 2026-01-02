# Project State Checkpoint

**Last Updated:** 2026-01-02
**Branch:** develop
**Version:** v2.1.0 (Architecture Refactor + Equipment System)

---

## Current Status

The roguelike dungeon crawler has been **significantly refactored** with a new modular architecture, equipment system, full-screen UI screens, and rendering bug fixes for Windows cmd.exe compatibility.

### Version History

- **v1.0.0** - Core gameplay + inventory system
- **v1.1.0** - XP/leveling system
- **v1.2.0** - Elite enemies + FOV + save/load
- **v2.0.0** - Complete visual overhaul (4 phases)
- **v2.1.0** - Architecture refactor + equipment system + UI screens + Windows fixes

---

## What Changed (v2.1.0)

### Major Refactoring

**1. Folder Structure Reorganization**
Moved from flat `src/*.py` to organized subfolders:

```
src/
├── core/           # Game loop and constants
│   ├── __init__.py
│   ├── game.py     # Main game orchestration (~200 lines, down from ~680)
│   └── constants.py
├── managers/       # System managers (NEW)
│   ├── __init__.py
│   ├── input_handler.py    # Keyboard input processing
│   ├── entity_manager.py   # Entity spawning and queries
│   ├── combat_manager.py   # Combat orchestration
│   ├── level_manager.py    # Level transitions
│   └── serialization.py    # Save/load serialization
├── entities/       # Game entities
│   ├── __init__.py
│   ├── entities.py # Player, Enemy classes
│   └── combat.py   # Combat calculations
├── world/          # World generation
│   ├── __init__.py
│   ├── dungeon.py  # BSP dungeon generation
│   └── fov.py      # Field of view
├── items/          # Item system
│   ├── __init__.py
│   └── items.py    # Items, inventory, equipment
├── ui/             # Rendering
│   ├── __init__.py
│   ├── renderer.py # Main game rendering (~1000 lines, down from ~1400)
│   ├── screens.py  # Full-screen UIs (NEW)
│   └── ui_utils.py # Shared UI utilities (NEW)
└── data/           # Persistence
    ├── __init__.py
    └── save_load.py
```

**2. Manager Classes**
Extracted orchestration logic from game.py into focused managers:
- `InputHandler` - Processes keyboard input for all game states
- `EntityManager` - Spawns and queries enemies/items
- `CombatManager` - Handles combat resolution and animations
- `LevelManager` - Manages level transitions and dungeon generation
- `SaveManager` - Handles serialization/deserialization

**3. UI Module Split**
Split renderer.py into focused modules:
- `renderer.py` - Main game rendering
- `screens.py` - Full-screen inventory, character, help screens
- `ui_utils.py` - Shared utilities (box chars, bars, borders)

### New Features

**Equipment System**
- Weapons with attack bonus (+ATK)
- Armor with defense bonus (+DEF)
- Equipment slots on Player class
- Equip/unequip via inventory screen
- Equipment persists in save files
- Equipment spawns in dungeons with rarity

**Full-Screen UI Screens**
- **Inventory Screen (I key)**: Browse items, equip/use/drop, view equipment
- **Character Screen (C key)**: View stats, equipment, progress
- **Help Screen (? key)**: Controls reference

**Camera System**
- Viewport follows player through large dungeons
- Smooth scrolling when player moves
- Dungeon can be larger than screen

### Bug Fixes

**Windows cmd.exe Rendering**
- Fixed off-by-one error in shortcut bar clearing
- Fixed panel vertical borders overlapping message area
- Added proper Unicode detection (WT_SESSION check for Windows Terminal)
- Changed `addch` to `addstr` for Unicode compatibility
- ASCII fallbacks work correctly on legacy consoles

---

## Completed Features

**Core Gameplay:**
- ✅ Procedural dungeon generation (BSP)
- ✅ 5 progressive dungeon levels with themed visuals
- ✅ Bump-to-attack combat system
- ✅ Player with HP, ATK, DEF, XP, leveling
- ✅ Equipment system (weapons, armor)
- ✅ Enemy AI with chase behavior
- ✅ Win condition and death state
- ✅ Camera/viewport system

**Inventory & Items:**
- ✅ 10-slot inventory with auto-pickup
- ✅ Health Potions, Strength Potions, Teleport Scrolls
- ✅ Weapons and Armor with rarity
- ✅ Item rarity color coding
- ✅ Full-screen inventory management

**UI/Screens:**
- ✅ Full-screen inventory screen
- ✅ Full-screen character screen
- ✅ Full-screen help screen
- ✅ Visual health/XP bars
- ✅ Dynamic HP bar coloring
- ✅ Box-drawing borders (with ASCII fallback)
- ✅ Color-coded messages
- ✅ Status indicators
- ✅ Real-time minimap

**Enemy Variety:**
- ✅ 6 enemy types with unique stats
- ✅ Elite variants (2x stats)
- ✅ Weighted spawning
- ✅ Combat animations

**Technical:**
- ✅ Modular folder structure
- ✅ Manager classes for clean separation
- ✅ Windows cmd.exe compatibility
- ✅ Save/load system
- ✅ FOV with fog of war

---

## Architecture Notes

### Module Responsibilities

**Core:**
- `game.py` - Thin orchestrator, wires up managers, runs game loop
- `constants.py` - All configuration values, enums, stats

**Managers:**
- `input_handler.py` - Keyboard input → actions
- `entity_manager.py` - Spawn/query entities
- `combat_manager.py` - Combat resolution + animations
- `level_manager.py` - Level transitions + dungeon gen
- `serialization.py` - State serialization

**Entities:**
- `entities.py` - Player, Enemy, Inventory classes
- `combat.py` - Damage calculation formulas

**World:**
- `dungeon.py` - BSP generation, themes, decorations
- `fov.py` - Raycasting FOV

**Items:**
- `items.py` - Item classes, equipment, scrolls, potions

**UI:**
- `renderer.py` - Main game rendering (NO game logic)
- `screens.py` - Full-screen UIs
- `ui_utils.py` - Shared drawing utilities

**Data:**
- `save_load.py` - Pickle-based persistence

### Key Design Patterns
- **Manager pattern**: Focused managers for each system
- **Clean separation**: UI never contains game logic
- **Time-based animations**: Auto-cleanup system
- **Weighted spawning**: Probability distribution
- **Theme system**: Data-driven visuals
- **State machine**: GameState + UIMode enums

---

## Quick Reference

### Running the Game
```bash
python main.py
```

### Compile Check
```bash
python -m py_compile src/core/game.py src/ui/renderer.py
```

### Git Status
```bash
git status
git log -10 --oneline --graph
```

---

## Known Issues

**None currently identified.**

All rendering issues on Windows cmd.exe have been resolved.

---

## What's Next (Future Enhancements)

- More enemy types (Necromancer, Demon)
- More equipment variety
- Boss encounters
- Persistent levels (return to previous)
- Score/leaderboard tracking
- Configurable difficulty

---

## Testing Checklist

When testing changes, verify:
- [ ] Game launches without errors
- [ ] Player can move (arrows/WASD)
- [ ] Combat works with animations
- [ ] I key opens inventory screen
- [ ] C key opens character screen
- [ ] ? key opens help screen
- [ ] Equipment can be equipped/unequipped
- [ ] Different enemy types spawn
- [ ] Items have correct colors
- [ ] Each level has unique theme
- [ ] UI renders cleanly (no stray lines)
- [ ] Save/load works
- [ ] Q key saves and quits
