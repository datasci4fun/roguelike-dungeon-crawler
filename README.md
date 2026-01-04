# Roguelike Dungeon Crawler

A terminal-based roguelike game with procedural dungeon generation, exploration, and combat. Features rich visual variety with themed dungeons, diverse enemies, animated combat, equipment system, and enhanced UI.

**Now with full multiplayer stack!** v3.0.0 adds a complete FastAPI backend with user accounts, leaderboards, ghost replays, real-time chat, **plus a React web frontend** with xterm.js game terminal.

**v3.2.0 adds Boss Monsters!** Each dungeon level now features a unique boss with special abilities and guaranteed loot drops.

**v3.3.0 adds Spectator Mode!** Watch other players' live games in real-time, plus new boss achievements and legendary items.

**v3.4.0 adds Mobile Support!** Play on your phone with touch controls, responsive layout, and installable PWA.

**v3.5.0 adds Friends & Social!** Search for players, send friend requests, and track your social connections. Plus 10 new achievements and visual polish.

**v4.0.0 adds Expanded Gameplay!** 6 new enemy types with unique AI behaviors, 4 status effects, traps and environmental hazards, plus new equipment types (shields, rings, amulets).

**v4.1.0 adds Scene Renderer!** First-person 3D dungeon view with directional FOV, perspective rendering, and animated entities. Toggle between terminal and 3D view on the Play page.

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
- **Item Rarity Colors**: Common (white), Uncommon (cyan), Rare (blue), Epic (magenta), Legendary (yellow)

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

### UX & Story System (v2.2.x)
- **Title Screen**: ASCII art logo with New Game/Continue/Help/Quit menu
- **Story Intro**: Paginated prologue sequence setting up the game's lore
- **Readable Lore Items**: Scrolls and books with discoverable story content per level
- **Confirmation Dialogs**: Safety prompts for quit and dropping rare items
- **Message Log (M key)**: Scrollable history of all game messages with category colors
- **Death Recap Screen**: Shows killer, damage, final stats, and lore discovery progress
- **Victory Screen**: Celebratory display with final stats when completing the game
- **Auto-Save System**: Automatic saves every 50 turns and on level transitions
- **Tutorial Hints**: Contextual tips on first combat, item pickup, stairs, and more

### Technical Features
- **Save/Load System**: Full game state persistence with permadeath option
- **11 Color Pairs**: Rich color palette for diverse visuals
- **FOV Integration**: All visual elements respect field of view
- **Modular Architecture**: Clean separation with manager classes and organized folder structure
- **Windows Compatible**: Proper Unicode detection with ASCII fallbacks for cmd.exe

### Multiplayer Backend (v3.0.0)
- **User Accounts**: Registration, JWT authentication, profile stats
- **Leaderboards**: Global rankings, daily/weekly scores, speedruns, kill counts
- **Ghost System**: Watch replays of other players' death runs
- **Real-time Chat**: Global chat and private whispers via WebSocket
- **Game Sessions**: Play via WebSocket with full state synchronization
- **Docker Support**: One-command deployment with PostgreSQL and Redis

### Web Frontend (v3.0.0)
- **React + TypeScript**: Modern frontend with Vite build system
- **xterm.js Game Terminal**: Full terminal emulation in the browser with ANSI color rendering
- **Real-time Chat UI**: Side panel with global chat and click-to-whisper
- **Ghost Replay Viewer**: Watch death runs with playback controls, timeline scrubber, and mini-map
- **Leaderboard Pages**: Browse rankings, player stats, and game history
- **JWT Authentication**: Secure login/register with token management

### Player Profiles & Achievements (v3.1.0)
- **Player Profiles**: View stats (games played, wins, kills, score), recent games, achievement showcase
- **Public Profiles**: View other players' profiles by clicking usernames
- **Achievement System**: 20 achievements across 5 categories
  - **Combat**: First Blood, Monster Slayer, Dragon Slayer, Overkill, Elite Hunter
  - **Progression**: First Victory, Champion, Deep Delver, Max Level, Dedicated
  - **Efficiency**: Speedrunner, Untouchable (Legendary!), No Potions, Flawless Level
  - **Collection**: Collector, Potion Master, Hoarder
  - **Special**: Welcome, Comeback, High Roller
- **Rarity Tiers**: Common, Rare, Epic, Legendary with point values
- **Achievement Browser**: Filter by category, track progress, view unlock dates

### Boss Monster System (v3.2.0)
- **5 Unique Bosses**: One boss per dungeon level, each with distinct abilities
  - **Level 1 - Goblin King** (K): Summons goblin minions, War Cry buff (+50% damage)
  - **Level 2 - Cave Troll** (T): Ground Slam AOE attack, Regenerates when low HP
  - **Level 3 - Lich Lord** (L): Raises skeleton minions, Life Drain (damages you, heals itself)
  - **Level 4 - Arcane Keeper** (A): Arcane Bolt ranged attack, Teleports when low HP
  - **Level 5 - Dragon Emperor** (E): Fire Breath cone AOE, Tail Sweep melee AOE
- **Boss Abilities**: 10 unique abilities with cooldowns and intelligent AI
- **Guaranteed Loot**: Each boss drops rare equipment on death
- **Boss Health Bar**: UI panel shows boss name and HP when boss is alive on the level
- **Visual Distinction**: Bosses render in bright magenta with bold styling

### Spectator Mode (v3.3.0)
- **Watch Live Games**: Browse active games and spectate other players in real-time
- **Real-time Updates**: See every move, combat, and item pickup as it happens
- **Spectator View**: GameTerminal with [SPECTATING] indicator, read-only mode
- **Active Games List**: View player name, level, turn count, and spectator count
- **WebSocket Streaming**: Low-latency state broadcasting to all spectators

### Boss Achievements & Legendary Items (v3.3.0)
- **4 New Boss Achievements** (24 total):
  - **Boss Slayer** (Common): Defeat your first boss
  - **Kingslayer** (Rare): Defeat the Goblin King
  - **Dragon Emperor Slain** (Epic): Defeat the final boss
  - **Dungeon Master** (Legendary): Defeat all 5 bosses in one run
- **Legendary Item Tier**: New highest rarity tier (yellow/gold)
- **Dragon Slayer** (Weapon): +8 ATK, dropped by Dragon Emperor
- **Dragon Scale Armor** (Armor): +8 DEF, dropped by Dragon Emperor

### Mobile Support (v3.4.0)
- **Touch Controls**: D-pad for movement, action buttons for inventory/items/stairs
- **Adaptive Layout**: Supports both portrait and landscape orientations
- **UI Mode Awareness**: Controls adapt to current screen (game, inventory, dialog, message log)
- **Mobile Chat**: Hidden by default with floating toggle button and unread badge
- **PWA Installable**: Add to home screen for app-like experience on iOS and Android
- **Service Worker**: Caches static assets for faster loading
- **Responsive Design**: Optimized for touch devices with `pointer: coarse` media queries

### Friends & Social System (v3.5.0)
- **Player Search**: Find other players by username or display name
- **Friend Requests**: Send, accept, or reject friend requests
- **Friends List**: View friends with online status indicators
- **Online Status**: See which friends are currently playing
- **Quick Actions**: View friend profiles, spectate online friends, remove friends
- **Social Achievements**: Unlock achievements for making friends

### New Achievements (v3.5.0)
Expanded from 24 to 34 total achievements:
- **Social Butterfly** (Common): Add your first friend
- **Popular** (Rare): Have 10 friends
- **Explorer** (Common): Visit all 5 dungeon levels in one run
- **Treasure Hunter** (Rare): Collect 100+ gold in a single run
- **Survivor** (Rare): Win with less than 5 HP remaining
- **Pacifist** (Epic): Win with 5 or fewer kills
- **One Shot** (Rare): Deal 50+ damage in a single hit
- **Genocide** (Epic): Kill 50+ enemies in a single run
- **Speed Demon** (Epic): Win in under 300 turns
- **Completionist** (Legendary, Hidden): Unlock all other achievements

### Visual Polish (v3.5.0)
- **Level Up Flash**: Gold radial flash effect when gaining a level
- **XP Gain Flash**: Subtle green flash when gaining experience
- **Damage Flash**: Red screen flash when taking damage
- **Critical Health Pulse**: Pulsing red glow when HP below 20%
- **Victory Glow**: Celebratory green glow on victory screen

### Expanded Gameplay (v4.0.0)

#### New Enemy Types (6)
- **Necromancer** (N): Ranged kiter AI, raises skeleton minions and fires dark bolts (Level 3+)
- **Demon** (D): Aggressive rusher AI, devastating fire strikes with burn effect (Level 4+)
- **Assassin** (a): Stealth AI, vanishes and backstabs for triple damage (Level 2+)
- **Fire Elemental** (F): Elemental AI, ranged fire bolts that burn (Level 3+)
- **Ice Elemental** (I): Elemental AI, ice shards that freeze (Level 3+)
- **Lightning Elemental** (L): Elemental AI, chain lightning hits multiple targets (Level 4+)

#### Status Effects System
- **Poison**: 2 damage/turn for 5 turns, stacks intensity up to 3x
- **Burn**: 3 damage/turn for 3 turns, refreshes duration on reapplication
- **Freeze**: Slows movement by 50% for 3 turns, no stacking
- **Stun**: Skip next turn, no stacking

#### Dungeon Traps
- **Spike Trap** (^): 5-10 damage, 3 turn cooldown
- **Fire Trap** (~): 3-6 damage + Burn effect, 5 turn cooldown
- **Poison Trap** (~): 2-4 damage + Poison effect, 4 turn cooldown
- **Arrow Trap** (>): 6-10 damage, directional, 2 turn cooldown
- Traps are hidden until detected or triggered, prefer corridor placement

#### Environmental Hazards
- **Lava** (~): 5 damage/turn + Burn effect, appears on deeper levels
- **Ice** (=): Causes sliding movement, appears in Crypt theme
- **Poison Gas** (*): Applies Poison, spreads over time
- **Deep Water** (~): Slows movement, drowning risk when low HP

#### New Equipment Types
- **Shields** (Off-hand): Wooden Shield, Iron Shield, Tower Shield - adds defense and block chance
- **Rings** (Ring slot): Ring of Strength (+ATK), Ring of Defense (+DEF), Ring of Speed
- **Amulets** (Amulet slot): Amulet of Health (+HP), Amulet of Resistance, Amulet of Vision
- **Ranged Weapons**: Shortbow, Longbow, Crossbow - attack from distance
- **Throwables**: Throwing Knife, Bomb (AOE), Poison Vial - single-use items
- **Keys**: Bronze, Silver, Gold - unlock matching locked doors

#### AI Behavior System
- **Chase**: Standard pathfinding toward player (existing enemies)
- **Ranged Kite**: Maintains distance, uses ranged abilities (Necromancer)
- **Aggressive**: Rushes player, spams abilities when in range (Demon)
- **Stealth**: Enters invisibility, ambushes with backstab (Assassin)
- **Elemental**: Element-based tactics with resistances (Elementals)

#### Combat Enhancements
- **Shield Blocking**: Equipped shields provide chance to completely block attacks
- **Status Effect Processing**: Effects tick each turn for both player and enemies
- **Stun Mechanics**: Stunned entities skip their turn
- **Enemy Level Restrictions**: New enemies only spawn on appropriate dungeon levels

### Scene Renderer (v4.1.0)

#### First-Person 3D View
- **Directional FOV**: View changes based on player facing direction (N/S/E/W)
- **Perspective Projection**: Proper 3D depth with walls receding into distance
- **Corridor Rendering**: Side walls connect seamlessly between depth levels
- **Floor & Ceiling**: Gradient backgrounds with perspective grid lines
- **Distance Fog**: Entities and walls fade with depth for atmosphere

#### Entity Rendering
- **9 Enemy Types**: Unique visual styles for Rat, Bat, Goblin, Skeleton, Orc, Troll, Wraith, Dragon, Demon
- **Elite Variants**: Glowing effects distinguish elite enemies
- **Item Rendering**: Distinct visuals for potions, scrolls, weapons, armor, gold
- **Animations**: Breathing/bobbing effects for living entities

#### Visual Effects
- **Torch Lighting**: Flickering flame animations on walls
- **Stone Brick Textures**: Procedural wall texturing with mortar lines
- **Door Rendering**: Wooden doors with handles on passable tiles

#### Integration
- **Play Page Toggle**: Checkbox to show/hide first-person view alongside terminal
- **Demo Pages**: `/first-person-demo`, `/scene-demo`, `/play-scene` for testing
- **Real-time Sync**: 3D view updates with every game action

## Installation

### Terminal Client (Single Player)

1. Install dependencies:
```bash
pip install -r requirements.txt
```

2. Run the game:
```bash
python main.py
```

### Multiplayer Server

#### Option 1: Docker (Recommended)
```bash
docker-compose up -d
```
This starts PostgreSQL, Redis, and the FastAPI server.

#### Option 2: Local Development
```bash
cd server
pip install -r requirements.txt
uvicorn app.main:app --reload
```

The API documentation is available at `http://localhost:8000/docs` when the server is running.

### Web Frontend

```bash
cd web
npm install
npm run dev
```

Access at `http://localhost:5173`. Requires the backend server to be running.

#### Mobile Access (v3.4.0)
To play on your phone or tablet:

```bash
cd web
npm run dev -- --host
```

This exposes the server on your local network. Look for output like:
```
Local:   http://localhost:5173/
Network: http://192.168.x.x:5173/
```

Open the **Network** URL on your mobile device (must be on same WiFi).

**Testing in browser:** Press F12 → Toggle Device Toolbar (Ctrl+Shift+M) → Select phone preset → Refresh.

**Install as App:** On your phone, use "Add to Home Screen" from the browser menu for an app-like experience.

#### Production Build
```bash
cd web
npm run build
```

## How to Play

### Controls

- **Arrow Keys** or **WASD**: Move your character (@)
- **I**: Open full-screen inventory (equip/use/drop items)
- **C**: Open character stats screen
- **M**: Open message log (scrollable history)
- **?**: Open help screen
- **1-3**: Quick-use items from sidebar
- **>**: Descend stairs (when standing on >)
- **Q**: Save and quit game (with confirmation)

### Inventory Controls (when open)
- **Arrow Keys**: Navigate items
- **E** or **Enter**: Equip/use selected item
- **D**: Drop selected item
- **I**, **Q**, or **ESC**: Close inventory

### Web Browser Controls
Same controls work in the web terminal. Additional:
- **Y/N**: Confirm/cancel dialogs

### Ghost Replay Viewer Controls
- **Space**: Play/Pause
- **← / →**: Step backward/forward
- **Home / End**: Jump to start/end
- **Esc**: Close viewer

### Mobile Touch Controls (v3.4.0)
On touch devices, an on-screen control overlay appears:
- **D-Pad** (left side): Tap arrows to move in 4 directions
- **Action Buttons** (right side):
  - **I**: Open inventory
  - **>**: Descend stairs
  - **1/2/3**: Quick-use items
  - **Q**: Quit/menu
- Controls automatically adapt based on current screen (inventory shows Use/Drop/Read/Close buttons, dialogs show Yes/No)

### Gameplay

- Explore procedurally generated themed dungeons with unique visuals per level
- Find the stairs down (>) to descend to deeper levels
- Collect color-coded items to help you survive:
  - **Health Potions** (!): Restore 10 HP (Common - white)
  - **Strength Potions** (!): Permanently increase attack damage (Uncommon - cyan)
  - **Teleport Scrolls** (?): Instantly move to a random location (Uncommon - cyan)
  - **Lore Scrolls/Books** (?): Discover the story of Valdris (read from inventory)
- Face 6 enemy types with varying difficulty:
  - **Goblins** (g): Weak but common (6 HP, 1 DMG, 10 XP)
  - **Skeletons** (s): Basic undead (8 HP, 2 DMG, 15 XP)
  - **Orcs** (o): Tough warriors (12 HP, 3 DMG, 20 XP)
  - **Wraiths** (W): Dangerous spirits (10 HP, 4 DMG, 25 XP)
  - **Trolls** (T): Powerful brutes (20 HP, 5 DMG, 35 XP)
  - **Dragons** (D): Rare encounters (50 HP, 10 DMG, 100 XP)
- Elite enemies (uppercase symbols) have double stats and rewards
- **Boss monsters** guard each level with special abilities and guaranteed loot drops
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
src/                    # Game client
├── core/               # Game loop and engine
│   ├── game.py         # Terminal client wrapper
│   ├── engine.py       # Pure game engine (no curses)
│   ├── events.py       # Event system
│   ├── commands.py     # Input command abstraction
│   ├── constants.py
│   └── messages.py     # Message log system
├── managers/           # System managers
│   ├── input_handler.py
│   ├── entity_manager.py
│   ├── combat_manager.py
│   ├── level_manager.py
│   └── serialization.py
├── entities/           # Game entities
│   ├── entities.py     # Player, Enemy classes
│   ├── abilities.py    # Boss + enemy abilities (v3.2.0, v4.0.0)
│   ├── combat.py       # Combat calculations
│   ├── status_effects.py  # Status effect system (v4.0.0)
│   └── ai_behaviors.py    # Enemy AI dispatch (v4.0.0)
├── world/              # World generation
│   ├── dungeon.py      # BSP dungeon generation
│   ├── fov.py          # Field of view
│   ├── traps.py        # Trap mechanics (v4.0.0)
│   └── hazards.py      # Environmental hazards (v4.0.0)
├── items/              # Item system
│   └── items.py        # Items, inventory, equipment
├── ui/                 # Rendering
│   ├── renderer.py     # Main game rendering
│   ├── screens.py      # Full-screen UIs
│   ├── ui_utils.py     # Shared UI utilities
│   └── input_adapter.py # Curses → Command translation
├── story/              # Narrative system
│   ├── story_data.py   # Lore entries, hints, level intros
│   └── story_manager.py # Story progress tracking
└── data/               # Persistence
    └── save_load.py

server/                 # Multiplayer backend (v3.0.0+)
├── app/
│   ├── api/            # REST & WebSocket endpoints
│   │   ├── auth.py     # Authentication
│   │   ├── game.py     # Game WebSocket
│   │   ├── leaderboard.py
│   │   ├── ghost.py    # Ghost replays
│   │   ├── chat.py     # Real-time chat
│   │   ├── profile.py  # Player profiles (v3.1.0)
│   │   ├── achievements.py  # Achievements (v3.1.0)
│   │   └── friends.py       # Friends system (v3.5.0)
│   ├── config/         # Configuration (v3.1.0)
│   │   └── achievements.py  # Achievement definitions
│   ├── core/           # Core utilities
│   │   ├── config.py   # Settings
│   │   ├── database.py # SQLAlchemy
│   │   ├── security.py # JWT auth
│   │   └── websocket.py
│   ├── models/         # Database models
│   │   ├── user.py
│   │   ├── game_result.py
│   │   ├── chat_message.py
│   │   ├── user_achievement.py  # (v3.1.0)
│   │   └── friendship.py        # (v3.5.0)
│   ├── schemas/        # Pydantic schemas
│   │   ├── achievement.py  # (v3.1.0)
│   │   ├── profile.py      # (v3.1.0)
│   │   └── friend.py       # (v3.5.0)
│   └── services/       # Business logic
│       ├── auth_service.py
│       ├── game_session.py
│       ├── leaderboard_service.py
│       ├── ghost_recorder.py
│       ├── ghost_service.py
│       ├── chat_service.py
│       ├── chat_manager.py
│       ├── achievement_service.py  # (v3.1.0)
│       ├── profile_service.py      # (v3.1.0)
│       └── friend_service.py       # (v3.5.0)
├── alembic/            # Database migrations (v3.1.0)
├── Dockerfile
└── requirements.txt

web/                    # Web frontend (v3.0.0+)
├── index.html          # PWA meta tags (v3.4.0)
├── package.json
├── vite.config.ts
├── tsconfig.json
├── public/
│   ├── manifest.json   # PWA manifest (v3.4.0)
│   ├── icon.svg        # App icon (v3.4.0)
│   └── sw.js           # Service worker (v3.4.0)
└── src/
    ├── main.tsx              # App entry point
    ├── App.tsx               # Router setup
    ├── components/
    │   ├── Layout.tsx        # Page layout with nav
    │   ├── GameTerminal.tsx  # xterm.js game renderer
    │   ├── ChatPanel.tsx     # Real-time chat
    │   ├── TouchControls.tsx # Mobile touch controls (v3.4.0)
    │   ├── GhostReplayViewer.tsx  # Replay viewer
    │   └── SceneRenderer/    # First-person 3D view (v4.1.0)
    │       ├── FirstPersonRenderer.tsx  # Main canvas component
    │       ├── projection.ts    # Perspective math utilities
    │       ├── colors.ts        # Color palette
    │       ├── walls/           # Wall rendering (corridor, floor, front)
    │       └── entities/        # Enemy and item rendering
    ├── contexts/
    │   └── AuthContext.tsx   # JWT auth state
    ├── hooks/
    │   ├── useGameSocket.ts  # Game WebSocket hook
    │   └── useChatSocket.ts  # Chat WebSocket hook
    ├── pages/
    │   ├── Home.tsx
    │   ├── Login.tsx
    │   ├── Register.tsx
    │   ├── Play.tsx          # Game + Chat page (mobile layout v3.4.0)
    │   ├── Leaderboard.tsx
    │   ├── Ghosts.tsx        # Ghost list + viewer
    │   ├── Profile.tsx       # Player profiles (v3.1.0)
    │   ├── Achievements.tsx  # Achievement browser (v3.1.0)
    │   ├── Spectate.tsx      # Live game spectator (v3.3.0)
    │   ├── Friends.tsx       # Friends system (v3.5.0)
    │   ├── FirstPersonDemo.tsx  # Scene renderer test (v4.1.0)
    │   ├── SceneDemo.tsx     # Top-down scene test (v4.1.0)
    │   └── PlayScene.tsx     # Alternative play page (v4.1.0)
    ├── services/
    │   └── api.ts            # REST + WebSocket client
    └── types/
        └── index.ts          # TypeScript interfaces
```
