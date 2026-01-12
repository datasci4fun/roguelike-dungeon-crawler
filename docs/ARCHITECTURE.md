# Architecture

Project structure and system organization.

---

## Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                     Web Frontend (web/)                          │
│              React 19 + xterm.js + WebSocket                     │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐              │
│  │ GameTerminal│  │  ChatPanel  │  │ GhostReplay │              │
│  │  (xterm.js) │  │  (realtime) │  │   Viewer    │              │
│  └─────────────┘  └─────────────┘  └─────────────┘              │
└──────────────────────────────┬──────────────────────────────────┘
                               │
┌──────────────────────────────▼──────────────────────────────────┐
│                     FastAPI Backend (server/)                    │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐              │
│  │  Auth API   │  │  Game API   │  │  Chat API   │              │
│  │  (JWT)      │  │  (WebSocket)│  │  (WebSocket)│              │
│  └─────────────┘  └─────────────┘  └─────────────┘              │
│                          │                                       │
│              ┌───────────▼───────────┐                          │
│              │    GameEngine (pure)   │                          │
│              │    No curses deps      │                          │
│              └───────────────────────┘                          │
└──────────────────────────────┬──────────────────────────────────┘
                               │
┌──────────────────────────────▼──────────────────────────────────┐
│                         Data Layer                               │
│         PostgreSQL (users, games, chat) + Redis (sessions)       │
└─────────────────────────────────────────────────────────────────┘
```

---

## Directory Structure

### Game Engine (src/)

```
src/
├── core/                   # Game loop and state
│   ├── engine.py           # Pure game engine (no curses)
│   ├── game.py             # Terminal client wrapper
│   ├── commands.py         # Input command abstraction
│   ├── constants.py        # Enums, stats, configs
│   ├── events.py           # Event system
│   └── messages.py         # Message log system
│
├── managers/               # System managers
│   ├── input_handler.py    # Input processing
│   ├── entity_manager.py   # Entity spawning
│   ├── combat_manager.py   # Combat resolution
│   ├── level_manager.py    # Level transitions
│   └── serialization.py    # State serialization
│
├── entities/               # Game entities
│   ├── entities.py         # Player, Enemy classes
│   ├── abilities.py        # Boss + enemy abilities
│   ├── player_abilities.py # Class abilities
│   ├── feats.py            # Feat definitions
│   ├── combat.py           # Damage calculations
│   ├── status_effects.py   # Poison, burn, freeze, stun
│   └── ai_behaviors.py     # Enemy AI dispatch
│
├── world/                  # World generation
│   ├── dungeon.py          # BSP dungeon generation
│   ├── fov.py              # Field of view
│   ├── traps.py            # Trap mechanics
│   ├── hazards.py          # Environmental hazards
│   ├── secrets.py          # Secret door system
│   └── torches.py          # Torch placement/lighting
│
├── items/                  # Item system
│   └── items.py            # Items, inventory, equipment
│
├── ui/                     # Terminal rendering
│   ├── renderer.py         # Main game rendering
│   ├── screens.py          # Full-screen UIs
│   ├── ui_utils.py         # Shared UI utilities
│   └── input_adapter.py    # Curses → Command translation
│
├── story/                  # Narrative system
│   ├── story_data.py       # Lore entries
│   └── story_manager.py    # Story progress
│
└── data/                   # Persistence
    └── save_load.py        # Save/load system
```

### Backend (server/)

```
server/
├── app/
│   ├── main.py             # FastAPI app entry
│   ├── api/                # REST & WebSocket endpoints
│   │   ├── auth.py         # Authentication
│   │   ├── game.py         # Game WebSocket
│   │   ├── leaderboard.py  # Rankings
│   │   ├── ghost.py        # Ghost replays
│   │   ├── chat.py         # Real-time chat
│   │   ├── profile.py      # Player profiles
│   │   ├── achievements.py # Achievements
│   │   └── friends.py      # Friends system
│   │
│   ├── config/             # Configuration
│   │   └── achievements.py # Achievement definitions
│   │
│   ├── core/               # Core utilities
│   │   ├── config.py       # Settings
│   │   ├── database.py     # SQLAlchemy setup
│   │   ├── security.py     # JWT auth
│   │   └── websocket.py    # WS helpers
│   │
│   ├── models/             # Database models
│   │   ├── user.py
│   │   ├── game_result.py
│   │   ├── chat_message.py
│   │   ├── user_achievement.py
│   │   └── friendship.py
│   │
│   ├── schemas/            # Pydantic schemas
│   │   ├── achievement.py
│   │   ├── profile.py
│   │   └── friend.py
│   │
│   └── services/           # Business logic
│       ├── auth_service.py
│       ├── game_session.py
│       ├── leaderboard_service.py
│       ├── ghost_recorder.py
│       ├── ghost_service.py
│       ├── chat_service.py
│       ├── achievement_service.py
│       ├── profile_service.py
│       └── friend_service.py
│
├── alembic/                # Database migrations
├── Dockerfile
└── requirements.txt
```

### Frontend (web/)

```
web/
├── public/
│   ├── manifest.json       # PWA manifest
│   ├── sw.js               # Service worker
│   └── tiles/              # Custom tile images
│       ├── README.md
│       ├── PROMPTS.md
│       └── {biome}/        # Per-biome tiles
│
└── src/
    ├── main.tsx            # App entry
    ├── App.tsx             # Router
    │
    ├── components/
    │   ├── Layout.tsx      # Page layout
    │   ├── GameTerminal.tsx    # xterm.js renderer
    │   ├── ChatPanel.tsx       # Real-time chat
    │   ├── TouchControls.tsx   # Mobile controls
    │   ├── CharacterHUD.tsx    # Race/class display
    │   ├── FeatSelector.tsx    # Feat selection
    │   ├── GhostReplayViewer.tsx
    │   │
    │   ├── SceneRenderer/      # First-person 3D (exploration)
    │   │   ├── FirstPersonRenderer.tsx
    │   │   ├── biomes.ts       # 8 biome themes
    │   │   ├── projection.ts   # Perspective math
    │   │   ├── compass.ts      # Compass HUD
    │   │   ├── walls/          # Wall rendering
    │   │   ├── entities/       # Enemy/item rendering
    │   │   ├── effects/        # Particles, water
    │   │   ├── lighting/       # Torch lights
    │   │   └── tiles/          # Tile loading system
    │   │
    │   ├── BattleRenderer3D.tsx  # Three.js tactical arena (v6.3.0)
    │   ├── BattleHUD.tsx         # Battle UI overlay
    │   ├── BattleHUD.css         # Battle UI styles
    │   ├── BattleOverlay.tsx     # Turn controls/ability buttons
    │   │
    ├── contexts/
    │   ├── AuthContext.tsx     # JWT state
    │   └── GameContext.tsx     # Shared WebSocket
    │
    ├── hooks/
    │   ├── useGameSocket.ts    # Game WebSocket
    │   ├── useChatSocket.ts    # Chat WebSocket
    │   ├── useSoundEffect.ts   # Web Audio SFX
    │   └── useSfxGameEvents.ts # Auto SFX triggers
    │
    ├── pages/
    │   ├── Home.tsx
    │   ├── Login.tsx / Register.tsx
    │   ├── Play.tsx
    │   ├── CharacterCreation.tsx
    │   ├── Leaderboard.tsx
    │   ├── Ghosts.tsx
    │   ├── Profile.tsx
    │   ├── Achievements.tsx
    │   ├── Spectate.tsx
    │   ├── Friends.tsx
    │   └── FirstPersonTestPage.tsx
    │
    ├── config/
    │   └── sfxConfig.ts        # Sound definitions
    │
    ├── data/
    │   └── characterData.ts    # Race/class data
    │
    ├── services/
    │   └── api.ts              # API client
    │
    └── types/
        └── index.ts            # TypeScript types
```

---

## Key Design Patterns

### Game Engine Separation
- `engine.py` is pure Python with no curses dependencies
- Allows same engine to run in terminal or server
- Commands abstracted via `CommandType` enum

### Manager Pattern
- Each system has its own manager class
- `CombatManager`, `EntityManager`, `LevelManager`
- Reduces coupling between systems

### WebSocket State Sync
- Server maintains authoritative game state
- Client sends commands, receives full state
- Spectators receive same state broadcasts

### Tile System
- `TileManager` singleton loads tiles on demand
- Falls back to biome colors if tiles missing
- React hook (`useTileSet`) for async loading

### Biome Theming
- 8 themes defined in `biomes.ts`
- Each theme has full color palette
- Rendering functions accept biome parameter

### Three.js Battle Renderer (v6.3.0)
- `BattleRenderer3D.tsx` renders tactical arena via WebGL
- Isometric camera for tactical overview
- Entity meshes with health bar overlays
- Hazard tiles (lava, ice, poison, water) with glow effects
- Smooth move transitions and floating damage numbers (v6.3.1)
- React overlay (`BattleHUD.tsx`) for ability buttons and turn UI
