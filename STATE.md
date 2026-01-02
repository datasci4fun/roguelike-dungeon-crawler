# Project State Checkpoint

**Last Updated:** 2026-01-02
**Branch:** develop
**Version:** v3.0.0 (Full Stack Complete)

---

## Current Status

The roguelike dungeon crawler now has a **complete multiplayer stack**: backend server with WebSocket game sessions, real-time chat, leaderboards, and ghost replays, plus a **full React web frontend** with xterm.js game terminal.

### v3.0.0 Web Frontend (Complete)

| Component | Status |
|-----------|--------|
| React + TypeScript + Vite scaffold | ✅ Done |
| Routing (Home, Login, Register, Play, Leaderboard, Ghosts) | ✅ Done |
| AuthContext + JWT token management | ✅ Done |
| API client (auth, leaderboard, ghost, chat) | ✅ Done |
| xterm.js Game Terminal | ✅ Done |
| WebSocket game connection | ✅ Done |
| Keyboard input mapping | ✅ Done |
| Game state rendering | ✅ Done |
| Real-time Chat UI | ✅ Done |
| Ghost Replay Viewer | ✅ Done |

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
│                     Web Frontend (web/)                          │
│              React 19 + xterm.js + WebSocket                     │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐              │
│  │ GameTerminal│  │  ChatPanel  │  │ GhostReplay │              │
│  │  (xterm.js) │  │  (realtime) │  │   Viewer    │              │
│  └─────────────┘  └─────────────┘  └─────────────┘              │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐              │
│  │ Auth Pages  │  │ Leaderboard │  │   Ghosts    │              │
│  │ Login/Reg   │  │   Rankings  │  │    List     │              │
│  └─────────────┘  └─────────────┘  └─────────────┘              │
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

## What Changed (v3.0.0)

### Web Frontend Scaffold
- `web/` - React 19 + TypeScript + Vite
- `web/src/pages/` - Home, Login, Register, Play, Leaderboard, Ghosts
- `web/src/contexts/AuthContext.tsx` - JWT auth state management
- `web/src/services/api.ts` - Full API client for all endpoints
- `web/src/types/index.ts` - TypeScript interfaces

### xterm.js Game Terminal
- `web/src/components/GameTerminal.tsx` - xterm.js game renderer
  - ANSI color rendering for dungeon, enemies, items
  - Viewport rendering around player position
  - Stats bar (HP, ATK, DEF, XP, kills)
  - Message log with color-coded messages
  - Death and victory screens
  - Inventory and dialog UI modes
- `web/src/hooks/useGameSocket.ts` - WebSocket connection hook
  - Connection lifecycle management
  - Game state type definitions
  - Command sending (new_game, command, quit)

### Real-time Chat UI
- `web/src/components/ChatPanel.tsx` - Chat panel component
  - Real-time message display
  - Online users list
  - Click-to-whisper functionality
  - System messages (join/leave)
  - Collapsible panel design
- `web/src/hooks/useChatSocket.ts` - Chat WebSocket hook
  - Global and whisper message support
  - Online user tracking
  - Connection management

### Ghost Replay Viewer
- `web/src/components/GhostReplayViewer.tsx` - Replay viewer
  - Playback controls (play, pause, step, speed)
  - Timeline scrubber
  - Mini-map with player trail
  - Frame-by-frame stats display
  - Combat damage indicators
  - Keyboard shortcuts

---

## Web Frontend Structure

```
web/
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
    │   └── Ghosts.tsx        # Ghost list + viewer
    ├── services/
    │   └── api.ts            # REST + WebSocket client
    └── types/
        └── index.ts          # TypeScript interfaces
```

---

## Keyboard Controls

### Game Terminal (Web)
| Key | Action |
|-----|--------|
| WASD / Arrows | Move |
| I | Open inventory |
| C | Character screen |
| M | Message log |
| ? | Help screen |
| 1-3 | Quick use items |
| > | Descend stairs |
| Q | Quit game |
| E/Enter | Use/equip (in inventory) |
| D | Drop (in inventory) |
| Y/N | Dialog confirm/cancel |

### Ghost Replay Viewer
| Key | Action |
|-----|--------|
| Space | Play/Pause |
| ← / → | Step back/forward |
| Home / End | Jump to start/end |
| Esc | Close viewer |

---

## Quick Reference

### Running Web Frontend (Development)
```bash
cd web
npm install
npm run dev
```
Access at `http://localhost:5173`

### Running Server (Development)
```bash
cd server
pip install -r requirements.txt
uvicorn app.main:app --reload
```
API at `http://localhost:8000`

### Running Terminal Client (Single Player)
```bash
python main.py
```

### Running with Docker (Full Stack)
```bash
docker-compose up -d
```

### Build Web Frontend
```bash
cd web
npm run build
```

---

## Testing Checklist (v3.0.0)

### Backend
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

### Frontend
- [x] Web app builds without errors
- [x] Login/Register pages work
- [x] Play page connects to WebSocket
- [x] New game starts correctly
- [x] Movement commands work
- [x] Game state renders in terminal
- [x] Inventory screen works
- [x] Death/victory screens display
- [x] Leaderboard page loads data
- [x] Ghosts page loads data
- [x] Chat UI works
- [x] Whisper messages work
- [x] Ghost replay playback works
- [x] Playback controls function correctly

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
- **v3.0.0** - Full stack with React web frontend

---

## What's Next

### Future Enhancements

**Gameplay:**
- More enemy types (Necromancer, Demon)
- Boss encounters
- More equipment variety
- Achievements system

**Multiplayer:**
- Spectator mode
- Guilds/clans
- Tournaments
- Player profiles

**Polish:**
- Mobile responsiveness improvements
- Sound effects
- Better animations
- Localization

---

## Known Issues

**None currently identified.**
