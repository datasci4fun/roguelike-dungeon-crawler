# Changelog

All notable changes to this project.

---

## [4.6.0] - 2026-01-06 - Debug Tooling & Rendering Fixes

### Added
- **Debug Hotkeys (F8/F9/F10)**: Gameplay debug tools gated behind DEV or `?debug=1`
  - F8: Toggle wireframe overlay (yellow wall boundaries)
  - F9: Toggle occluded entity silhouettes (red ghosts)
  - F10: Copy scene snapshot to clipboard (JSON)
- **Z-Buffer Occlusion**: Interpolated depth for accurate entity hiding behind walls
- **useDebugRenderer Hook**: localStorage persistence, environment gating
- **DebugToast Component**: Visual feedback for debug actions
- **top_down_window**: Server-side 11x11 grid around player in snapshots
- **visibleRange**: Corridor info includes visibility bounds for debugging

### Fixed
- **corridorInfo Visibility**: Only visible tiles now influence wall geometry
  - Eliminated artifacts from invisible tiles creating fake walls at huge offsets
  - Left/right walls use visible range bounds instead of full row
  - Front wall only set if center tile is visible
- **Side-wall Z-Buffer**: Interpolated depth values for proper occlusion

### Changed
- Test page scenarios fixed to keep entities within corridor bounds (offset < ±1)

---

## [4.5.0] - 2026-01-06 - Biome Theming & Tile Engine

### Added
- **8 Biome Themes**: Dungeon, Ice, Forest, Lava, Crypt, Sewer, Library, Crystal
- **Tile Loading Engine**: Load custom 64x64 PNG tiles from `/tiles/{biome}/`
- **Data-Driven Torch System**: Server-side torch placement with raycasting
- **Wall Decorations**: Procedural moss, cracks, cobwebs
- **Biome Test Page**: Selector dropdown, brightness slider, tile toggle
- **Tile Generation Prompts**: AI image generation prompts for each biome

### Changed
- Wall rendering functions accept biome options
- Test page has unique scenes per biome (not identical corridors)

---

## [4.4.1] - 2026-01-05 - WebSocket Stability

### Fixed
- Duplicate WebSocket connections from React StrictMode
- Chat messages not posting
- Keyboard shortcuts blocking chat input
- Character creation flow (always goes through creation page)

---

## [4.4.0] - 2026-01-04 - Atmosphere & Exploration

### Added
- **Compass HUD**: Medieval-style compass strip showing direction
- **Trap Rendering**: Visual traps with animations (spike, fire, poison, arrow)
- **Secret Door System**: Hidden doors revealed with Search (F key)
- **Atmospheric Effects**: Dust particles and fog wisps

---

## [4.3.0] - 2026-01-03 - Visual Overhaul

### Added
- **Pure Black Darkness**: True dungeon atmosphere
- **Aggressive Fog System**: Exponential falloff
- **FOV Cone Visualization**: Highlighted tiles in view
- **Visual Test Page**: `/first-person-test` with scenarios

### Changed
- Torches now pierce fog (drawn after overlay)
- Darker color palette for walls/floors

---

## [4.2.2] - 2026-01-02 - Turn Commands

### Added
- **Q/E Turn Controls**: Rotate facing without moving
- **X to Quit**: Changed from Q to free it for turning

### Fixed
- First-person view rendering in open rooms

---

## [4.2.1] - 2026-01-02 - Sound Effects

### Added
- **24 Procedural Sounds**: Via Web Audio API
- **Automatic Triggers**: Sounds play on game events
- **Volume Controls**: Respects master/SFX settings

---

## [4.2.0] - 2026-01-01 - Character Creation

### Added
- **5 Races**: Human, Elf, Dwarf, Halfling, Orc
- **3 Classes**: Warrior, Mage, Rogue
- **18 Feats**: Combat, Defense, Utility, Special categories
- **Character HUD**: Race/class/ability display
- **Demo Account**: `demo` / `DemoPass123`

---

## [4.1.0] - 2025-12-30 - Scene Renderer

### Added
- **First-Person 3D View**: Canvas-based dungeon renderer
- **Directional FOV**: View based on player facing
- **9 Enemy Visuals**: Unique styles for each enemy type
- **Entity Animations**: Breathing, bobbing effects
- **Demo Pages**: `/first-person-demo`, `/scene-demo`

---

## [4.0.0] - 2025-12-28 - Expanded Gameplay

### Added
- **6 New Enemies**: Necromancer, Demon, Assassin, Fire/Ice/Lightning Elementals
- **Status Effects**: Poison, Burn, Freeze, Stun
- **Traps**: Spike, Fire, Poison, Arrow
- **Hazards**: Lava, Ice, Poison Gas, Deep Water
- **New Equipment**: Shields, Rings, Amulets, Ranged, Throwables, Keys
- **AI Behaviors**: Chase, Ranged Kite, Aggressive, Stealth, Elemental

---

## [3.5.0] - 2025-12-25 - Friends & Social

### Added
- **Friends System**: Search, requests, online status
- **10 New Achievements**: Social Butterfly, Popular, Explorer, etc.
- **Visual Polish**: Level up flash, damage flash, critical pulse

---

## [3.4.0] - 2025-12-22 - Mobile Support

### Added
- **Touch Controls**: D-pad and action buttons
- **PWA Support**: Installable, service worker caching
- **Responsive Layout**: Portrait/landscape modes

---

## [3.3.0] - 2025-12-20 - Spectator Mode

### Added
- **Live Spectating**: Watch other players' games
- **4 Boss Achievements**: Boss Slayer, Kingslayer, etc.
- **Legendary Items**: Dragon Slayer, Dragon Scale Armor

---

## [3.2.0] - 2025-12-18 - Boss Monsters

### Added
- **5 Bosses**: Goblin King, Cave Troll, Lich Lord, Arcane Keeper, Dragon Emperor
- **10 Boss Abilities**: Summon, AOE, ranged, buffs
- **Boss Health Bar**: UI panel for boss HP
- **Guaranteed Loot**: Each boss drops rare items

---

## [3.1.0] - 2025-12-15 - Profiles & Achievements

### Added
- **Player Profiles**: Stats, recent games, showcase
- **20 Achievements**: Combat, Progression, Efficiency, Collection, Special
- **Achievement Browser**: Filter by category, track progress

---

## [3.0.0] - 2025-12-10 - Multiplayer & Web

### Added
- **FastAPI Backend**: REST + WebSocket API
- **User Accounts**: JWT authentication
- **Leaderboards**: Global, daily, weekly rankings
- **Ghost Replays**: Record and watch death runs
- **Real-time Chat**: Global and whisper messages
- **React Frontend**: xterm.js game terminal

---

## [2.2.1] - 2025-12-08

### Fixed
- Lore items display content when read
- Victory screen shows instead of closing
- Save/load for lore items

---

## [2.2.0] - 2025-12-05 - UX & Story

### Added
- **Title Screen**: ASCII art menu
- **Story System**: 12 discoverable lore entries
- **Auto-Save**: Every 50 turns and on level change
- **Tutorial Hints**: Contextual tips
- **Message Log**: Scrollable history (M key)
- **Death Recap**: Final stats and lore progress

---

## [2.1.0] - 2025-12-01 - Equipment & UI

### Added
- **Equipment System**: Weapons and armor with rarity
- **Full-Screen Inventory**: Equipment display
- **Character Screen**: Stats view (C key)
- **Camera System**: Viewport follows player

### Changed
- Major architecture refactor (manager classes)

---

## [2.0.0] - 2025-11-25 - Visual Variety

### Added
- **6 Enemy Types**: Goblin, Skeleton, Orc, Wraith, Troll, Dragon
- **Elite Enemies**: 2x stats variants
- **5 Dungeon Themes**: Stone, Cave, Crypt, Library, Treasury
- **Combat Animations**: Hit flash, damage numbers
- **Item Rarity Colors**: Common → Legendary

---

## [1.2.0] - 2025-11-15

### Added
- Elite enemies with boosted stats
- Field of View system
- Save/Load with permadeath

---

## [1.1.0] - 2025-11-10

### Added
- XP and leveling system

---

## [1.0.0] - 2025-11-01 - Initial Release

### Added
- Procedural dungeon generation (BSP)
- Bump-to-attack combat
- Basic inventory (10 slots)
- Health/Strength potions, Teleport scrolls
- 5 dungeon levels
