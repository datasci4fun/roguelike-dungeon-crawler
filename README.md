# Roguelike Dungeon Crawler

A terminal-based roguelike game with procedural dungeon generation, exploration, and combat. Features rich visual variety with themed dungeons, diverse enemies, animated combat, equipment system, and enhanced UI.

## Features

### Core Gameplay
- **Procedural Generation**: Each dungeon is randomly generated using Binary Space Partitioning (BSP)
- **5 Themed Dungeon Levels**: Stone Dungeon, Cave, Crypt, Library, Treasury - each with unique visuals
- **Inventory System**: 10-slot inventory with automatic pickup for health potions, strength potions, and teleport scrolls
- **Equipment System**: Find and equip weapons (+ATK) and armor (+DEF) with rarity-based stats
- **Exploration**: Field of view system with fog of war - discover rooms, corridors, and secrets
- **Combat**: Bump-to-attack combat with animated feedback (hit flashes, damage numbers, direction indicators)
- **XP & Leveling**: Gain experience from defeating enemies, level up to increase HP and ATK
- **Camera System**: Viewport follows player through large dungeons

### Visual Variety (v2.0.0)
- **6 Enemy Types**: Goblins (g), Skeletons (s), Orcs (o), Wraiths (W), Trolls (T), Dragons (D)
- **Elite Enemies**: Uppercase symbols (G, S, O) with 2x HP, damage, and XP rewards
- **Weighted Spawning**: Common enemies frequent, rare enemies (Dragons) scarce
- **Dungeon Decorations**: Pillars, statues, furniture, braziers - varies by theme
- **Terrain Features**: Water, grass, blood stains (persist where enemies die)
- **Item Rarity Colors**: Common (white), Uncommon (cyan), Rare (blue), Epic (magenta)

### Enhanced UI (v2.1.0)
- **Full-Screen Inventory**: Dedicated inventory management screen with equipment display
- **Character Screen**: View detailed stats, equipment, and progress
- **Help Screen**: In-game controls reference
- **Visual Bars**: Health and XP displayed as progress bars with dynamic colors
- **Panel Borders**: Box-drawing characters for clean UI layout (ASCII fallback for cmd.exe)
- **Color-Coded Messages**: Combat (red), healing (green), level-ups (yellow)
- **Status Indicators**: [WOUNDED], [CRITICAL], [STRONG] based on player state
- **Real-Time Minimap**: 5x5 dungeon overview with room/enemy/item counts
- **Combat Animations**: Hit flashes, floating damage numbers, attack direction arrows, death animations

### Technical Features
- **Save/Load System**: Full game state persistence with permadeath option
- **11 Color Pairs**: Rich color palette for diverse visuals
- **FOV Integration**: All visual elements respect field of view
- **Modular Architecture**: Clean separation with manager classes and organized folder structure
- **Windows Compatible**: Proper Unicode detection with ASCII fallbacks for cmd.exe

## Installation

1. Install dependencies:
```bash
pip install -r requirements.txt
```

## How to Play

Run the game:
```bash
python main.py
```

### Controls

- **Arrow Keys** or **WASD**: Move your character (@)
- **I**: Open full-screen inventory (equip/use/drop items)
- **C**: Open character stats screen
- **?**: Open help screen
- **1-3**: Quick-use items from sidebar
- **>**: Descend stairs (when standing on >)
- **Q**: Save and quit game

### Inventory Controls (when open)
- **Arrow Keys**: Navigate items
- **E** or **Enter**: Equip/use selected item
- **D**: Drop selected item
- **I**, **Q**, or **ESC**: Close inventory

### Gameplay

- Explore procedurally generated themed dungeons with unique visuals per level
- Find the stairs down (>) to descend to deeper levels
- Collect color-coded items to help you survive:
  - **Health Potions** (!): Restore 10 HP (Common - white)
  - **Strength Potions** (!): Permanently increase attack damage (Uncommon - cyan)
  - **Teleport Scrolls** (?): Instantly move to a random location (Uncommon - cyan)
- Face 6 enemy types with varying difficulty:
  - **Goblins** (g): Weak but common (6 HP, 1 DMG, 10 XP)
  - **Skeletons** (s): Basic undead (8 HP, 2 DMG, 15 XP)
  - **Orcs** (o): Tough warriors (12 HP, 3 DMG, 20 XP)
  - **Wraiths** (W): Dangerous spirits (10 HP, 4 DMG, 25 XP)
  - **Trolls** (T): Powerful brutes (20 HP, 5 DMG, 35 XP)
  - **Dragons** (D): Rare bosses (50 HP, 10 DMG, 100 XP)
- Elite enemies (uppercase symbols) have double stats and rewards
- Combat features visual feedback: hit flashes, damage numbers, direction arrows
- Blood stains mark where enemies fell
- Level up by defeating enemies to gain +10 max HP and +1 ATK
- Reach level 5 to win the game!
- Manage your health carefully - death is permanent

### Stats & UI

- **Level**: Current dungeon level (1-5) with unique theme per level
- **HP**: Visual progress bar with dynamic colors (green/yellow/red)
- **XP**: Visual progress bar showing experience to next level
- **ATK**: Your attack damage (increases with level and strength potions)
- **Kills**: Number of enemies defeated
- **Inventory**: Shows up to 3 items (capacity: 10) with rarity colors
- **Minimap**: 5x5 real-time dungeon overview
- **Status**: Active effects like [WOUNDED], [CRITICAL], [STRONG]
- **Messages**: Color-coded combat log (recent 5 messages)

## Technical Details

- **Language**: Python 3.9+
- **UI**: curses library with 11 color pairs for rich terminal rendering
- **Generation Algorithm**: Binary Space Partitioning (BSP) for guaranteed connected dungeons
- **FOV System**: Raycasting-based field of view with fog of war
- **Animation System**: Time-based animations with automatic cleanup
- **Save System**: Pickle-based full state serialization with permadeath

### Project Structure

```
src/
├── core/           # Game loop and constants
│   ├── game.py     # Main game orchestration
│   └── constants.py
├── managers/       # System managers
│   ├── input_handler.py
│   ├── entity_manager.py
│   ├── combat_manager.py
│   ├── level_manager.py
│   └── serialization.py
├── entities/       # Game entities
│   ├── entities.py # Player, Enemy classes
│   └── combat.py   # Combat calculations
├── world/          # World generation
│   ├── dungeon.py  # BSP dungeon generation
│   └── fov.py      # Field of view
├── items/          # Item system
│   └── items.py    # Items, inventory, equipment
├── ui/             # Rendering
│   ├── renderer.py # Main game rendering
│   ├── screens.py  # Full-screen UIs
│   └── ui_utils.py # Shared UI utilities
└── data/           # Persistence
    └── save_load.py
```
