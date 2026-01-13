# Changelog

All notable changes to this project.

---

## [6.6.0] - 2026-01-13 - Data Persistence Migration

### Added
- **JSON Seed Files**: Game balance data in version-controlled JSON (`data/seeds/`)
  - `enemies.json` (28 enemies), `bosses.json` (8 bosses)
  - `races.json` (5 races), `classes.json` (4 classes)
  - `items.json` (29 items), `themes.json` (8 dungeon themes)
  - `combat.json` (traps, hazards, status effects)
  - `floor_pools.json` (47 floor spawn pools)
- **SQLAlchemy Models**: Database tables for all game constants
  - `game_enemies`, `game_bosses`, `game_races`, `game_classes`
  - `game_items`, `game_themes`, `game_traps`, `game_hazards`
  - `game_status_effects`, `game_floor_pools`
- **Redis Caching Layer**: Cache-aside pattern with 24h TTL
  - `cache_warmer.py` service for startup cache population
  - Cache invalidation on write operations
- **REST API Endpoints**: 11 new endpoints under `/api/game-constants/`
  - `/races`, `/classes`, `/enemies`, `/bosses`, `/items`
  - `/themes`, `/traps`, `/hazards`, `/status-effects`
  - `/floor-pools/{floor}`, `/cache-status`
- **Pydantic Response Schemas**: Full API documentation with typed responses
- **useGameConstants Hook**: React hook for frontend data fetching with 5min cache
- **Database Seeder Script**: `scripts/seed_database.py` populates 141 records

### Changed
- `CharacterCreation.tsx` fetches races/classes from API instead of static imports
- `characterData.ts` reduced to ability descriptions only (removed RACES, CLASSES)

### Fixed
- Circular import in combat module (`battle_actions` ↔ `battle_boss_abilities`)
  - Moved boss ability imports to end of `battle_actions.py`
  - Added `from __future__ import annotations` to `boss_heuristics.py`

### Technical
- `server/app/api/game_constants.py`: FastAPI router with cached endpoints
- `server/app/models/game_constants.py`: SQLAlchemy models for all constant types
- `server/app/schemas/game_constants.py`: Pydantic response schemas
- `server/app/core/cache.py`: Redis cache utility functions
- `web/src/hooks/useGameConstants.ts`: React hook with in-memory caching
- `web/src/services/api.ts`: Added `gameConstantsApi` client

---

## [6.5.1] - 2026-01-12 - Roadmap Complete

### Added
- **FloorDiorama3D Component**: 3D floor preview visualization
- **CharacterPreview3D Component**: Character model preview in creation
- **Daily Challenge Backend**: Models, service, and API for daily runs
- **Ice Slide Mechanic**: Momentum-based movement on ice tiles

### Technical
- PRs #21-24 merged completing all priority roadmap items

---

## [6.4.0] - 2026-01-12 - Frontend Lore Alignment

### Added
- **AtmosphericPage Component**: Reusable wrapper for immersive pages
  - Layered z-index stacking (background, fog, particles, content, CRT, vignette)
  - Parallax backgrounds (landing, entrance, kingdom, underground)
  - Particle systems (dust, embers, mist)
  - CRT scanline overlay with intensity options
- **PhosphorHeader Component**: Animated phosphor text reveals
  - Multiple styles (dramatic, emphasis, normal, whisper)
  - Configurable delays and completion callbacks
- **DungeonPortal3D Component**: Three.js animated dungeon entrance
  - Flickering torch lights, swirling fog, Field glow
- **About Page**: "Built by AI" technical showcase
  - Credits for Claude Opus 4.5, ChatGPT 5.2, Suno v4.5, DALL-E 3
  - Project statistics (50k+ lines, 80+ components, etc.)
  - Quality markers and philosophy sections
- **Features Page**: Game features overview
- **Presentation Page**: 23-slide AI Usage Case Study for Jan 17 share-out
  - Export/print functionality with proper PDF pagination
  - Headers (title + author) and footers (event + page numbers)
  - Title page isolation with page breaks
  - Author: Blixa Markham a.k.a. DataSci4Fun
  - Key concepts: Iterative Divergence Protocol, Contextual Displacement

### Changed
- **Home Page**: Complete redesign with Skyfall Seed lore
  - Rotating lore quotes, floor descriptions, Field narrative
- **Login Page**: "Resume Your Descent" with DungeonPortal3D background
- **Register Page**: "Begin Your Legend" with kingdom parallax
- **CharacterCreation Page**: Race/class lore integration from loreSkyfall.ts
- **Navigation**: Reorganized into Game/Community dropdowns

### Technical
- `web/src/components/AtmosphericPage/` - Atmospheric wrapper
- `web/src/components/PhosphorHeader/` - Text reveal component
- `web/src/components/DungeonPortal3D/` - Three.js portal
- `web/src/data/loreSkyfall.ts` - Centralized lore data
- `web/src/pages/Presentation.tsx` - 950+ line presentation system

---

## [6.3.1] - 2026-01-12 - Battle Polish

### Added
- **Smooth Move Transitions**: Animated entity movement in tactical combat
  - CSS-based slide transitions for all entity moves
  - 200ms duration for responsive feel
- **Floating Damage Numbers**: Visual damage feedback in combat
  - Numbers rise and fade above damaged entities
  - Color-coded: red for damage, green for healing
  - Staggered timing for multiple hits

### Fixed
- **Reinforcement Enemy Symbols**: Correct enemy glyphs now display for spawned reinforcements
- **Exploration Mode Safety**: Enemy attacks disabled when not in battle mode
  - Prevents errant damage during exploration transitions

### Technical
- `web/src/components/BattleRenderer3D.tsx`: Smooth transitions and damage numbers
- `web/src/components/BattleHUD.css`: Animation keyframes for damage display

---

## [6.3.0] - 2026-01-12 - Three.js Battle Renderer

### Added
- **Three.js Battle Visualization**: Full 3D tactical arena rendering
  - WebGL-powered arena view replacing Canvas 2D
  - Camera positioned for isometric tactical overview
  - Entity meshes with health bar overlays
  - Tile-based floor with hazard coloring (lava, ice, poison, water)
- **Battle HUD Overlay**: React-based UI layer on 3D canvas
  - Reinforcement countdown panel
  - Ability buttons with cooldown indicators
  - Turn indicator and action feedback
- **Arena Lighting**: Dynamic lighting for atmosphere
  - Ambient and directional lights
  - Hazard tile glow effects

### Changed
- Battle mode now uses Three.js renderer instead of Canvas 2D
- Improved visual clarity for tactical positioning

### Technical
- `web/src/components/BattleRenderer3D.tsx`: Three.js scene setup (1,200+ lines)
- `web/src/components/BattleHUD.tsx`: Battle UI overlay
- `web/src/components/BattleHUD.css`: HUD styling

---

## [6.2.0] - 2026-01-11 - Tactical Depth

### Added
- **AI Scoring System**: Deterministic action selection for all enemies
  - `enumerate_candidate_actions()` lists legal MOVE/ATTACK/WAIT
  - `score_action()` with numeric scoring weights (kill priority, damage, positioning)
  - `choose_action()` with stable tie-breaking for reproducibility
- **Hazard Intelligence**: Enemies navigate around hazards intelligently
  - BFS/Dijkstra pathfinding with hazard costs (lava 120, poison 55, water 30, ice 18)
  - Enemies exit hazardous tiles, avoid stepping into danger
  - Melee AI pressures player toward hazards (cornering bonus)
  - `player_safe_escape_count()` for tactical positioning
- **Boss Heuristics**: Priority-based signature abilities for 7 boss types
  - Regent: Royal Decree (summon guards), Counterfeit Crown (debuff)
  - Rat King: Summon Swarm, Plague Bite, Burrow (escape when low HP)
  - Spider Queen: Web Trap, Poison Bite, Summon Spiders
  - Frost Giant: Freeze Ground, Ice Blast
  - Arcane Keeper: Teleport (when adjacent), Arcane Bolt
  - Flame Lord: Lava Pool, Inferno, Fire Breath
  - Dragon Emperor: Dragon Fear (round 1), Tail Sweep, Fire Breath
  - Cooldown tracking per ability, fallback to ai_scoring when no rule matches

### Technical
- `src/combat/ai_scoring.py`: Core scoring engine (682 lines)
- `src/combat/boss_heuristics.py`: Boss decision rules (585 lines)
- `src/combat/battle_actions.py`: Boss ability definitions added
- `src/combat/battle_manager.py`: Integration with boss detection and ability execution
- 28 tests covering determinism, hazard avoidance, and boss behaviors

### Key Guarantee
Same seed + same state = same action, always. Boss fights are now learnable.

---

## [6.2.1] - 2026-01-11 - Kiting Heuristics

### Added
- **Ranged AI Kiting**: Kiting/spacing heuristics for ranged enemies
  - Preferred range band (3-5, sweet spot 4)
  - Decisive adjacency penalty (-60) unless killshot
  - Break melee lock bonus (+20) when escaping to dist >= 3
  - Avoids reinforcement entry edges and corners
  - Retreat lane preservation (self-cornering prevention)

### Technical
- `src/combat/ai_kiting.py`: New kiting module (341 lines)
- Applies to `RANGED_KITE` and `ELEMENTAL` AI behaviors
- 13 new tests for kiting determinism and behavior

---

## [6.1.0] - 2026-01-12 - Cinematic Glue

### Added
- **Transition Orchestrator**: Foundation for no-flicker mode changes
  - `TransitionKind` enum: ENGAGE, WIN, FLEE, DEFEAT, BOSS_VICTORY
  - `TransitionState` dataclass with timing, skip support, and serialization
  - Input locking during active transitions
  - Automatic transition ticking in game loop
- **Transition Curtain** (web): Fade-to-black overlay between modes
  - Phase-based animation: fade_in → hold → fade_out
  - Letterbox bars for cinematic transitions (ENGAGE, BOSS_VICTORY)
  - Skip support on Space/Escape/Enter when `can_skip=true`
  - Z-index layered above BattleOverlay, below cutscenes
- **Arena Overview Pan**: Camera pan on battle start
  - Overview phases: zoom_out → pan_enemies → pan_player → settle
  - Hazard tiles (lava, ice, water, poison) highlighted with pulse animation
  - Reinforcement entry edges highlighted when enemies pending
  - Skip with Space/Escape, input locked until complete
  - Duration scales with arena size (9×7: 1.5s, 11×9: 1.8s, 11×11: 2.0s)

### Changed
- Battle transitions now use curtain instead of instant mode switch
- Defeat transition snaps to black immediately (no fade)
- BattleOverlay disabled during overview (buttons + keyboard)

### Technical
- `TransitionState` in `src/core/events.py` with start/skip/end methods
- `Engine.start_transition()`, `tick_transition()`, `is_input_locked()` in `src/core/engine.py`
- `BattleManager` emits transitions on battle start/end
- `TransitionCurtain.tsx` with requestAnimationFrame-based animation
- Camera transform via CSS `scale()` and `translate()` on arena container

---

## [6.0.0] - 2026-01-11 - Tactical Battle Mode

### Added
- **Instanced Tactical Combat**: Exploration remains grid-based; combat transitions to 9x7 tactical arenas
- **Deterministic Battles**: Same seed produces identical arena layouts, reinforcement queues, and spawn positions
- **Arena Templates**: 6 biome-specific templates with hazard placement (lava lanes, ice patches, etc.)
- **Class Ability Kits**: 4 classes with 4 abilities each
  - Warrior: Basic Attack, Power Strike (1.5x, 4cd), Shield Wall (2x def, 3cd), Charge (2 tiles + stun, 5cd)
  - Mage: Basic Attack, Fireball (AOE 3 damage, 4cd), Frost Nova (freeze adjacent, 5cd), Blink (teleport 3, 4cd)
  - Rogue: Basic Attack, Backstab (2x if behind, 3cd), Smoke Bomb (invisible 2 turns, 5cd), Dash (move 2, 2cd)
  - Cleric: Basic Attack, Heal (restore 10 HP, 4cd), Smite (holy 1.5x undead, 3cd), Sanctuary (immune 1 turn, 6cd)
- **Reinforcement System**: Enemies spawn from arena edges over time
  - Countdown visible in UI
  - Arrival accelerated by field pulse intensity (0.9x/0.8x/0.7x for minor/moderate/major)
  - Elite spawns possible on deeper floors
- **Battle Artifacts** (v6.0.5):
  - Duplicate Seal: Duplicates consumable effects in battle
  - Woundglass Shard: Reveals safe tiles and reinforcement ETAs
  - Oathstone: Vow enforcement continues during battle
- **Ghost Battle Effects** (v6.0.5):
  - Champion: +3 temporary HP at battle start
  - Archivist: Reveals safe tiles at battle start
  - Beacon: Points player away from reinforcement entry
- **Web Battle Overlay**:
  - Real-time arena visualization with tile colors
  - Entity positions and HP pips
  - Reinforcement countdown panel
  - Keyboard controls (WASD move, 1-4 abilities, Space wait, Escape flee)
  - Artifact status indicators
- **Game Integrity Tests** (v6.0.5):
  - Battle payload contract validation (arena_tiles, entities, reinforcements)
  - Battle determinism snapshot tests (2 seeds verified)

### Changed
- Combat encounters now transition to instanced arenas instead of bump-to-attack
- Victory save handling now preserves ledger/codex to victories.json before clearing autosave
- UI mode toggles between EXPLORATION and BATTLE

### Technical
- `BattleState`, `BattleEntity`, `PendingReinforcement` types with full serialization
- `BattleManager` handles turn processing, ability execution, reinforcement spawning
- `BattleAction` enum for all combat commands
- Deterministic seeding for arena generation and reinforcement scheduling

### Developer Notes
To reproduce battle determinism for bug reports:
```python
from src.combat.battle_manager import BattleManager
manager = BattleManager(floor_level=3, biome='FOREST', zone_id='canopy_halls', seed=12345)
# Same seed produces identical arena layout and reinforcement queue
```

---

## [5.3.0] - 2026-01-09 - Cinematics V2: Death & Victory Cutscenes

### Added
- **Death Cutscene**: 5-scene cinematic sequence (Fall, YouDied, AbyssClaims, Fate, Prompt)
- **Victory Cutscene**: 3-scene cinematic sequence (Seal, World, Legend)
- **Death Fate Variants**: Random selection (Echo, Hollowed, Silence) locked per death
- **Victory Legacy Variants**: Random selection (Beacon, Champion, Archivist) locked per victory
- **Ghost Lore Panels**: Fate/legacy-specific text on summary screens
- **Death Camera Effect**: 3D renderer slump/roll/pitch animation on death
- **Death Overlays**: Vignette, blood curtain, eyelids closing CSS effects
- **Cinematic SFX**: File-based with procedural fallback
- **Factory Pattern**: createGameOverCutscene() and createVictoryCutscene() for per-game-end randomization
- **FX Cues**: Flash/pressure effects synced to caption line completion

### Changed
- Begin button restricted to intro cutscene only
- Fall scene background transparent for 3D death cam visibility
- Unified voice between cutscene and summary panel text

---

## [5.2.0] - 2026-01-08 - Modular Cutscene Engine

### Added
- **Modular Cutscene Architecture**: Reusable engine for all cinematics
- **Retro CRT Text Reveal**: Phosphor ignition effect per character
- **FX System**: Flash, shake, flicker, pressure effects
- **FX Cues**: Effects tied to caption line completion
- **Scene-Scoped CSS**: Per-scene styling via `.cs-scene-{id}` classes
- **Debug Mode Panel**: Scene iteration tools for development
- **7-Scene Intro Cutscene**: Full narrative with effects

---

## [5.1.0] - 2026-01-07 - Cinematic Intro & Responsive Renderer

### Added
- **Cinematic Intro**: 7 narrative scenes with parallax backgrounds
- **Particle Effects**: Stars, embers, dust, darkness, magic, ash, mist
- **Scene Transitions**: Solid black with no bleed-through
- **Responsive 3D Renderer**: Fills container, adapts to resize

### Fixed
- Scene background transitions now use solid black curtain

---

## [5.0.0] - 2026-01-07 - 3D Movement Animations & Map Memory

### Added
- **Dynamic LOS Render Distance**: View distance based on line-of-sight
- **Smooth Movement Animations**: 2D and 3D renderers
- **Smooth Turn Animations**: Camera rotation interpolation
- **Map Memory**: Explored tiles remain visible (dimmed)
- **Pure Tile-Based 3D**: Geometry from tile data only
- **Parallax Skybox**: Depth effect in 3D view

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

## [4.0.0] - 2025-12-30 - Expanded Gameplay

### Added
- **6 New Enemies**: Necromancer, Demon, Assassin, Fire/Ice/Lightning Elementals
- **Status Effects**: Poison, Burn, Freeze, Stun
- **Traps**: Spike, Fire, Poison, Arrow
- **Hazards**: Lava, Ice, Poison Gas, Deep Water
- **New Equipment**: Shields, Rings, Amulets, Ranged, Throwables, Keys
- **AI Behaviors**: Chase, Ranged Kite, Aggressive, Stealth, Elemental

---

## [3.5.0] - 2025-12-30 - Friends & Social

### Added
- **Friends System**: Search, requests, online status
- **10 New Achievements**: Social Butterfly, Popular, Explorer, etc.
- **Visual Polish**: Level up flash, damage flash, critical pulse

---

## [3.4.0] - 2025-12-30 - Mobile Support

### Added
- **Touch Controls**: D-pad and action buttons
- **PWA Support**: Installable, service worker caching
- **Responsive Layout**: Portrait/landscape modes

---

## [3.3.0] - 2025-12-30 - Spectator Mode

### Added
- **Live Spectating**: Watch other players' games
- **4 Boss Achievements**: Boss Slayer, Kingslayer, etc.
- **Legendary Items**: Dragon Slayer, Dragon Scale Armor

---

## [3.2.0] - 2025-12-30 - Boss Monsters

### Added
- **5 Bosses**: Goblin King, Cave Troll, Lich Lord, Arcane Keeper, Dragon Emperor
- **10 Boss Abilities**: Summon, AOE, ranged, buffs
- **Boss Health Bar**: UI panel for boss HP
- **Guaranteed Loot**: Each boss drops rare items

---

## [3.1.0] - 2025-12-30 - Profiles & Achievements

### Added
- **Player Profiles**: Stats, recent games, showcase
- **20 Achievements**: Combat, Progression, Efficiency, Collection, Special
- **Achievement Browser**: Filter by category, track progress

---

## [3.0.0] - 2025-12-30 - Multiplayer & Web

### Added
- **FastAPI Backend**: REST + WebSocket API
- **User Accounts**: JWT authentication
- **Leaderboards**: Global, daily, weekly rankings
- **Ghost Replays**: Record and watch death runs
- **Real-time Chat**: Global and whisper messages
- **React Frontend**: xterm.js game terminal

---

## [2.2.1] - 2025-12-30

### Fixed
- Lore items display content when read
- Victory screen shows instead of closing
- Save/load for lore items

---

## [2.2.0] - 2025-12-30 - UX & Story

### Added
- **Title Screen**: ASCII art menu
- **Story System**: 12 discoverable lore entries
- **Auto-Save**: Every 50 turns and on level change
- **Tutorial Hints**: Contextual tips
- **Message Log**: Scrollable history (M key)
- **Death Recap**: Final stats and lore progress

---

## [2.1.0] - 2025-12-30 - Equipment & UI

### Added
- **Equipment System**: Weapons and armor with rarity
- **Full-Screen Inventory**: Equipment display
- **Character Screen**: Stats view (C key)
- **Camera System**: Viewport follows player

### Changed
- Major architecture refactor (manager classes)

---

## [2.0.0] - 2025-12-30 - Visual Variety

### Added
- **6 Enemy Types**: Goblin, Skeleton, Orc, Wraith, Troll, Dragon
- **Elite Enemies**: 2x stats variants
- **5 Dungeon Themes**: Stone, Cave, Crypt, Library, Treasury (expanded to 8 in v4.5.0)
- **Combat Animations**: Hit flash, damage numbers
- **Item Rarity Colors**: Common → Legendary

---

## [1.2.0] - 2025-12-30

### Added
- Elite enemies with boosted stats
- Field of View system
- Save/Load with permadeath

---

## [1.1.0] - 2025-12-30

### Added
- XP and leveling system

---

## [1.0.0] - 2025-12-30 - Initial Release

### Added
- Procedural dungeon generation (BSP)
- Bump-to-attack combat
- Basic inventory (10 slots)
- Health/Strength potions, Teleport scrolls
- 5 dungeon levels
