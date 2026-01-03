# Roguelike Dungeon Crawler

A terminal-based roguelike game with procedural dungeon generation, exploration, and combat. Features rich visual variety with themed dungeons, diverse enemies, animated combat, equipment system, and enhanced UI.

**Now with full multiplayer stack!** v3.0.0 adds a complete FastAPI backend with user accounts, leaderboards, ghost replays, real-time chat, **plus a React web frontend** with xterm.js game terminal.

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
│   └── combat.py       # Combat calculations
├── world/              # World generation
│   ├── dungeon.py      # BSP dungeon generation
│   └── fov.py          # Field of view
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
│   │   └── achievements.py  # Achievements (v3.1.0)
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
│   │   └── user_achievement.py  # (v3.1.0)
│   ├── schemas/        # Pydantic schemas
│   │   ├── achievement.py  # (v3.1.0)
│   │   └── profile.py      # (v3.1.0)
│   └── services/       # Business logic
│       ├── auth_service.py
│       ├── game_session.py
│       ├── leaderboard_service.py
│       ├── ghost_recorder.py
│       ├── ghost_service.py
│       ├── chat_service.py
│       ├── chat_manager.py
│       ├── achievement_service.py  # (v3.1.0)
│       └── profile_service.py      # (v3.1.0)
├── alembic/            # Database migrations (v3.1.0)
├── Dockerfile
└── requirements.txt

web/                    # Web frontend (v3.0.0+)
├── index.html
├── package.json
├── vite.config.ts
├── tsconfig.json
└── src/
    ├── main.tsx              # App entry point
    ├── App.tsx               # Router setup
    ├── components/
    │   ├── Layout.tsx        # Page layout with nav
    │   ├── GameTerminal.tsx  # xterm.js game renderer
    │   ├── ChatPanel.tsx     # Real-time chat
    │   └── GhostReplayViewer.tsx  # Replay viewer
    ├── contexts/
    │   └── AuthContext.tsx   # JWT auth state
    ├── hooks/
    │   ├── useGameSocket.ts  # Game WebSocket hook
    │   └── useChatSocket.ts  # Chat WebSocket hook
    ├── pages/
    │   ├── Home.tsx
    │   ├── Login.tsx
    │   ├── Register.tsx
    │   ├── Play.tsx          # Game + Chat page
    │   ├── Leaderboard.tsx
    │   ├── Ghosts.tsx        # Ghost list + viewer
    │   ├── Profile.tsx       # Player profiles (v3.1.0)
    │   └── Achievements.tsx  # Achievement browser (v3.1.0)
    ├── services/
    │   └── api.ts            # REST + WebSocket client
    └── types/
        └── index.ts          # TypeScript interfaces
```
