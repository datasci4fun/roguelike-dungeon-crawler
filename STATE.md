# Project State Checkpoint

**Last Updated:** 2026-01-02
**Branch:** master
**Version:** v3.0.0-backend (Multiplayer Backend Complete)

---

## Current Status

The roguelike dungeon crawler now has a **complete multiplayer backend** ready for web client integration. All 6 phases of the v3.0.0 backend are implemented.

### v3.0.0 Backend (Complete)

| Phase | Feature | Status |
|-------|---------|--------|
| 1 | Docker + Backend Foundation | ✅ Done |
| 2 | JWT Authentication | ✅ Done |
| 3 | WebSocket Game Sessions | ✅ Done |
| 4 | Leaderboards | ✅ Done |
| 5 | Ghost Replay System | ✅ Done |
| 6 | Real-time Chat | ✅ Done |

### Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        Web Frontend (TODO)                       │
│                   React + xterm.js + WebSocket                   │
└──────────────────────────────┬──────────────────────────────────┘
                               │
┌──────────────────────────────▼──────────────────────────────────┐
│                     FastAPI Backend (server/)                    │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐              │
│  │  Auth API   │  │  Game API   │  │  Chat API   │              │
│  │  (JWT)      │  │  (WebSocket)│  │  (WebSocket)│              │
│  └─────────────┘  └─────────────┘  └─────────────┘              │
│  ┌─────────────┐  ┌─────────────┐                               │
│  │ Leaderboard │  │  Ghost API  │                               │
│  │    API      │  │             │                               │
│  └─────────────┘  └─────────────┘                               │
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

## What Changed (v3.0.0-backend)

### Phase 1: Docker + Backend Foundation
- `docker-compose.yml` - PostgreSQL, Redis, FastAPI services
- `server/` directory structure with FastAPI application
- `server/app/main.py` - Application entry with lifespan handling
- `server/app/core/config.py` - Pydantic settings management
- `server/app/core/database.py` - Async SQLAlchemy with PostgreSQL
- Health check endpoints (`/api/health`, `/api/health/ready`)

### Phase 2: JWT Authentication
- `server/app/models/user.py` - User model with bcrypt password hashing
- `server/app/core/security.py` - JWT token creation/validation
- `server/app/services/auth_service.py` - Registration, login logic
- `server/app/api/auth.py` - Auth endpoints:
  - `POST /api/auth/register` - Create account
  - `POST /api/auth/login` - Get JWT token
  - `GET /api/auth/me` - Current user info
  - `POST /api/auth/refresh` - Refresh token

### Phase 3: WebSocket Game Sessions
- `server/app/services/game_session.py` - GameSession management
- `server/app/core/websocket.py` - WebSocket connection manager
- `server/app/api/game.py` - Game WebSocket endpoint:
  - `WS /api/game/ws?token=<jwt>` - Real-time game connection
  - Actions: `new_game`, `command`, `get_state`, `quit`, `ping`
  - Full game state serialization (player, dungeon, enemies, items)

### Phase 4: Leaderboards
- `server/app/models/game_result.py` - GameResult model with scoring
- `server/app/services/leaderboard_service.py` - Leaderboard queries
- `server/app/api/leaderboard.py` - Leaderboard endpoints:
  - `GET /api/leaderboard/top` - All-time top scores
  - `GET /api/leaderboard/weekly` - Weekly top scores
  - `GET /api/leaderboard/daily` - Daily top scores
  - `GET /api/leaderboard/victories` - Top victory runs
  - `GET /api/leaderboard/speedrun` - Fastest victories
  - `GET /api/leaderboard/kills` - Most kills
  - `GET /api/leaderboard/players` - Top players
  - `GET /api/leaderboard/stats` - Global statistics
  - `GET /api/leaderboard/me` - Current user stats
  - `GET /api/leaderboard/me/history` - User game history
- Auto-records game results on quit/disconnect
- Updates user stats (high_score, games_played, victories)

### Phase 5: Ghost Replay System
- `server/app/services/ghost_recorder.py` - Records player actions
  - GhostFrame: turn, position, health, action, combat data
  - GhostData: Complete recording with JSON serialization
- `server/app/services/ghost_service.py` - Ghost queries
- `server/app/api/ghost.py` - Ghost endpoints:
  - `GET /api/ghost/level/{level}` - Ghosts for dungeon level
  - `GET /api/ghost/game/{id}` - Full ghost replay
  - `GET /api/ghost/recent` - Recent death recordings
  - `GET /api/ghost/me` - User's own ghosts
  - `GET /api/ghost/user/{id}` - Another user's ghosts
- Records frames during gameplay, stores with game result

### Phase 6: Real-time Chat
- `server/app/models/chat_message.py` - ChatMessage model
  - Channels: global, system, whisper (DM)
- `server/app/services/chat_service.py` - Message management
  - Rate limiting (10 msg/min)
  - Message length limit (500 chars)
  - Pagination support
- `server/app/services/chat_manager.py` - WebSocket chat manager
  - Real-time broadcast to all users
  - Whisper (private message) support
  - Online user tracking
  - Join/leave notifications
- `server/app/api/chat.py` - Chat endpoints:
  - `GET /api/chat/history` - Global chat history
  - `GET /api/chat/whispers/{user_id}` - DM conversation
  - `GET /api/chat/whispers` - DM inbox
  - `GET /api/chat/online` - Online users
  - `WS /api/chat/ws?token=<jwt>` - Real-time chat

---

## Server Directory Structure

```
server/
├── Dockerfile
├── requirements.txt
└── app/
    ├── main.py              # FastAPI application
    ├── api/                  # API endpoints
    │   ├── auth.py          # Authentication
    │   ├── game.py          # Game WebSocket
    │   ├── leaderboard.py   # Leaderboards
    │   ├── ghost.py         # Ghost replays
    │   └── chat.py          # Real-time chat
    ├── core/                 # Core utilities
    │   ├── config.py        # Settings
    │   ├── database.py      # SQLAlchemy
    │   ├── security.py      # JWT
    │   └── websocket.py     # WS manager
    ├── models/               # Database models
    │   ├── user.py
    │   ├── game_result.py
    │   └── chat_message.py
    ├── schemas/              # Pydantic schemas
    │   ├── user.py
    │   ├── auth.py
    │   ├── leaderboard.py
    │   ├── ghost.py
    │   └── chat.py
    └── services/             # Business logic
        ├── auth_service.py
        ├── game_session.py
        ├── leaderboard_service.py
        ├── ghost_recorder.py
        ├── ghost_service.py
        ├── chat_service.py
        └── chat_manager.py
```

---

## Engine Separation (from v2.2.1)

The game engine remains fully decoupled from terminal rendering:

**Core Components:**
- `src/core/events.py` - Event system for decoupled communication
- `src/core/commands.py` - Platform-agnostic input commands
- `src/core/engine.py` - Pure game engine (no curses dependencies)
- `src/ui/input_adapter.py` - Curses key → Command translation

The server imports `GameEngine` directly and wraps it in `GameSession` for WebSocket communication.

---

## Version History

- **v1.0.0** - Core gameplay + inventory system
- **v1.1.0** - XP/leveling system
- **v1.2.0** - Elite enemies + FOV + save/load
- **v2.0.0** - Complete visual overhaul (4 phases)
- **v2.1.0** - Architecture refactor + equipment + UI screens
- **v2.2.0** - UX improvements + story system + auto-save
- **v2.2.1** - Bug fixes for lore items and victory screen
- **v3.0.0-backend** - Complete multiplayer backend (6 phases)

---

## Quick Reference

### Running Terminal Client
```bash
python main.py
```

### Running Server (Development)
```bash
cd server
pip install -r requirements.txt
uvicorn app.main:app --reload
```

### Running with Docker
```bash
docker-compose up -d
```

### API Documentation
When server is running: `http://localhost:8000/docs`

### Compile Check
```bash
python -m py_compile src/core/engine.py src/core/events.py src/core/commands.py
python -m py_compile server/app/main.py server/app/api/game.py
```

---

## What's Next

### v3.0.0 - Web Frontend (TODO)

The backend is complete. Next steps for the web client:

1. **React Application Setup** - Create React app with TypeScript
2. **Terminal Emulation** - xterm.js for game rendering
3. **WebSocket Integration** - Connect to game and chat endpoints
4. **Authentication UI** - Login/register forms
5. **Leaderboard UI** - Display rankings and stats
6. **Ghost Replay UI** - Watch other players' runs
7. **Chat UI** - Global and whisper chat interface

### Future Enhancements

**Gameplay:**
- More enemy types (Necromancer, Demon)
- Boss encounters
- More equipment variety
- Persistent levels

**Multiplayer:**
- Spectator mode
- Guilds/clans
- Tournaments
- Achievement system

---

## Known Issues

**None currently identified.**

---

## Testing Checklist (v3.0.0-backend)

- [x] Server starts with `uvicorn app.main:app`
- [x] Health check returns 200
- [x] User registration works
- [x] JWT login returns token
- [x] Game WebSocket connects with valid token
- [x] New game creates session
- [x] Commands update game state
- [x] Game state serializes correctly
- [x] Leaderboard records game results
- [x] Ghost data records during gameplay
- [x] Ghost API returns replay data
- [x] Chat WebSocket connects
- [x] Chat messages broadcast to all users
- [x] Whispers reach only recipient
- [x] Rate limiting works on chat
