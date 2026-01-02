# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

---

## [2.2.1] - 2026-01-02

### Fixed
- **Lore Items**: Now properly display full content when read from inventory
- **Victory Screen**: Game shows celebratory victory screen when completing all 5 levels instead of closing
- **Save/Load**: Fixed serialization for lore items (scrolls and books)
- **ItemType**: Corrected BOOK_LORE to BOOK enum reference

---

## [2.2.0] - 2026-01-02

### Added
- **Title Screen**: ASCII art logo with New Game/Continue/Help/Quit menu
- **Story Intro**: Paginated prologue sequence with game lore
- **Story System**: 12 discoverable lore entries (scrolls and books) across 5 levels
- **Readable Items**: Lore scrolls and books with full-screen reading view
- **Confirmation Dialogs**: Safety prompts for quit and dropping rare items
- **Message Log Screen**: Full scrollable message history (M key)
- **Message Categories**: Combat, Item, System, Story, Level with color coding
- **Death Recap**: Shows attacker, damage dealt, final stats, lore progress
- **Auto-Save System**: Saves every 50 turns and on level transitions
- **Tutorial Hints**: Contextual tips on first combat, item pickup, stairs, level up
- **Level Intro Messages**: Thematic descriptions when entering each dungeon level
- **Enemy Encounter Messages**: Lore text on first meeting each enemy type

### Changed
- Game now starts at title screen instead of directly in dungeon
- Message system upgraded from simple strings to categorized GameMessage objects
- Quit action now shows confirmation dialog

---

## [2.1.0] - 2025-12-XX

### Added
- **Equipment System**: Weapons (+ATK) and Armor (+DEF) with rarity
- **Full-Screen Inventory**: Dedicated inventory management with equipment display
- **Character Screen**: Detailed stats and equipment view (C key)
- **Help Screen**: In-game controls reference (? key)
- **Camera System**: Viewport follows player in large dungeons

### Changed
- Major architecture refactor: organized into subfolders (core, managers, entities, etc.)
- Game.py reduced from ~680 lines to ~200 lines via manager extraction
- Renderer split into renderer.py, screens.py, and ui_utils.py

### Fixed
- Windows cmd.exe rendering issues (off-by-one errors, Unicode compatibility)
- Panel borders no longer overlap message area

---

## [2.0.0] - 2025-12-XX

### Added
- **6 Enemy Types**: Goblins, Skeletons, Orcs, Wraiths, Trolls, Dragons
- **Elite Enemies**: Uppercase variants with 2x HP, damage, and XP
- **5 Dungeon Themes**: Stone, Cave, Crypt, Library, Treasury
- **Dungeon Decorations**: Pillars, statues, furniture per theme
- **Terrain Features**: Water, grass, blood stains
- **Combat Animations**: Hit flashes, damage numbers, direction arrows
- **Item Rarity Colors**: Common, Uncommon, Rare, Epic
- **Visual Health/XP Bars**: Dynamic color progress bars
- **Real-Time Minimap**: 5x5 dungeon overview
- **Status Indicators**: [WOUNDED], [CRITICAL], [STRONG]

---

## [1.2.0] - 2025-XX-XX

### Added
- Elite enemies with boosted stats
- Field of View (FOV) system with fog of war
- Save/Load system with permadeath

---

## [1.1.0] - 2025-XX-XX

### Added
- XP and leveling system
- Level-up stat bonuses (+HP, +ATK)

---

## [1.0.0] - 2025-XX-XX

### Added
- Initial release
- Procedural dungeon generation (BSP algorithm)
- Player movement and bump-to-attack combat
- Basic inventory system (10 slots)
- Health Potions, Strength Potions, Teleport Scrolls
- 5 dungeon levels with win condition
- Basic enemy AI with chase behavior
