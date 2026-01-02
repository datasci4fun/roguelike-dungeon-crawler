# Next Session Handoff

**Last Session:** 2026-01-02
**Current Version:** v2.2.1
**Status:** Stable, all known bugs fixed

---

## v3.0.0 Vision: Online Multiplayer Roguelike

The next major milestone is transforming this single-player terminal game into an **online multiplayer experience**.

### Target Features
1. **User Accounts** - Registration, login, profiles
2. **Global Leaderboards** - High scores across all players
3. **Ghost System** - Dead players' characters appear in other players' games
4. **Cross-Server Chat** - Real-time communication between players
5. **Docker Deployment** - Easy setup and scaling

---

## Architecture Options

### Option A: Web-Based (Recommended for Accessibility)
```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Browser   │────▶│  FastAPI    │────▶│ PostgreSQL  │
│  (React/JS) │◀────│  Backend    │◀────│  Database   │
└─────────────┘     └─────────────┘     └─────────────┘
                           │
                    ┌──────┴──────┐
                    │    Redis    │
                    │ (WebSocket) │
                    └─────────────┘
```
- **Pros:** Accessible anywhere, no install, modern UI possible
- **Cons:** Need to rebuild rendering for web (canvas or xterm.js)
- **Stack:** FastAPI + WebSockets, React or terminal emulator in browser, PostgreSQL, Redis

### Option B: SSH Server (Classic Roguelike Style)
```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│ SSH Client  │────▶│ SSH Server  │────▶│ PostgreSQL  │
│  (Terminal) │◀────│  + Python   │◀────│  Database   │
└─────────────┘     └─────────────┘     └─────────────┘
```
- **Pros:** Keep existing curses code, authentic terminal feel
- **Cons:** Users need SSH client, harder to scale
- **Stack:** Paramiko/AsyncSSH, existing curses code, PostgreSQL

### Option C: Hybrid (API + Terminal Client)
```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  Terminal   │────▶│  FastAPI    │────▶│ PostgreSQL  │
│   Client    │◀────│  Backend    │◀────│  Database   │
└─────────────┘     └─────────────┘     └─────────────┘
```
- **Pros:** Keep terminal aesthetic, modern backend
- **Cons:** Users download client, game logic split client/server
- **Stack:** Python client (curses), FastAPI backend, PostgreSQL

---

## Recommended Tech Stack

| Component | Technology | Purpose |
|-----------|------------|---------|
| Backend | FastAPI (Python) | REST API + WebSocket |
| Database | PostgreSQL | Users, scores, ghosts |
| Cache/PubSub | Redis | Chat, real-time events |
| Frontend | React + xterm.js | Terminal emulator in browser |
| Auth | JWT + bcrypt | Secure authentication |
| Container | Docker Compose | Easy deployment |

---

## Docker Structure

```
roguelike-online/
├── docker-compose.yml
├── backend/
│   ├── Dockerfile
│   ├── requirements.txt
│   └── app/
│       ├── main.py           # FastAPI entry point
│       ├── config.py         # Environment settings
│       ├── database.py       # SQLAlchemy setup
│       ├── auth/
│       │   ├── routes.py     # Login/register endpoints
│       │   ├── models.py     # User model
│       │   └── utils.py      # JWT, password hashing
│       ├── game/
│       │   ├── routes.py     # Game session endpoints
│       │   ├── models.py     # Game state model
│       │   ├── websocket.py  # Real-time game connection
│       │   └── engine/       # Port existing game logic here
│       ├── leaderboard/
│       │   ├── routes.py     # High score endpoints
│       │   └── models.py     # Score model
│       ├── ghosts/
│       │   ├── routes.py     # Ghost spawning logic
│       │   └── models.py     # Ghost model
│       └── chat/
│           ├── routes.py     # Chat endpoints
│           └── websocket.py  # Real-time chat
├── frontend/
│   ├── Dockerfile
│   ├── package.json
│   └── src/
│       ├── App.jsx
│       ├── components/
│       │   ├── Terminal.jsx  # xterm.js wrapper
│       │   ├── Login.jsx
│       │   ├── Leaderboard.jsx
│       │   └── Chat.jsx
│       └── services/
│           └── api.js
├── nginx/
│   ├── Dockerfile
│   └── nginx.conf
└── db/
    └── init.sql
```

---

## Database Schema

```sql
-- Users
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    last_login TIMESTAMP
);

-- High Scores (Leaderboard)
CREATE TABLE scores (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    score INTEGER NOT NULL,
    level_reached INTEGER,
    kills INTEGER,
    lore_found INTEGER,
    turns_taken INTEGER,
    death_cause VARCHAR(255),
    played_at TIMESTAMP DEFAULT NOW()
);

-- Ghosts (dead players that appear in others' games)
CREATE TABLE ghosts (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    username VARCHAR(50),
    player_level INTEGER,
    max_hp INTEGER,
    atk INTEGER,
    equipment JSONB,
    inventory JSONB,
    death_dungeon_level INTEGER,
    death_cause VARCHAR(255),
    death_x INTEGER,
    death_y INTEGER,
    created_at TIMESTAMP DEFAULT NOW(),
    times_encountered INTEGER DEFAULT 0
);

-- Active Game Sessions
CREATE TABLE game_sessions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    game_state JSONB,
    started_at TIMESTAMP DEFAULT NOW(),
    last_activity TIMESTAMP DEFAULT NOW()
);

-- Chat Messages (optional persistence)
CREATE TABLE chat_messages (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    username VARCHAR(50),
    message TEXT,
    channel VARCHAR(50) DEFAULT 'global',
    sent_at TIMESTAMP DEFAULT NOW()
);
```

---

## Implementation Phases

### Phase 1: Docker + Backend Foundation
- [ ] Create project structure
- [ ] Docker Compose with PostgreSQL + Redis
- [ ] FastAPI skeleton with health check
- [ ] SQLAlchemy models
- [ ] Alembic migrations

### Phase 2: Authentication
- [ ] User registration endpoint
- [ ] User login endpoint (JWT)
- [ ] Password hashing (bcrypt)
- [ ] Protected route middleware
- [ ] Basic user profile endpoint

### Phase 3: Port Game Logic
- [ ] Extract game engine from curses rendering
- [ ] Create game state serialization
- [ ] WebSocket game session handler
- [ ] Turn-based command processing
- [ ] Save/load from database

### Phase 4: Leaderboard
- [ ] Submit score on death/victory
- [ ] Get top scores endpoint
- [ ] Get user's scores endpoint
- [ ] Score calculation formula

### Phase 5: Ghost System
- [ ] Save player state on death
- [ ] Query random ghosts for dungeon level
- [ ] Ghost AI behavior (hostile? friendly? just loot?)
- [ ] "Avenge me!" messages from ghosts

### Phase 6: Real-Time Chat
- [ ] WebSocket chat connection
- [ ] Global chat channel
- [ ] System announcements ("Player X reached level 5!")
- [ ] Rate limiting / moderation

### Phase 7: Frontend
- [ ] React app setup
- [ ] xterm.js terminal component
- [ ] Login/register forms
- [ ] Leaderboard display
- [ ] Chat sidebar
- [ ] Responsive design

### Phase 8: Polish & Deploy
- [ ] Nginx reverse proxy
- [ ] SSL/TLS certificates
- [ ] Production Docker config
- [ ] CI/CD pipeline
- [ ] Monitoring/logging

---

## Questions to Decide Before Starting

1. **Architecture?**
   - Web-based (most accessible)
   - SSH server (most authentic)
   - Hybrid (download client)

2. **Ghost behavior?**
   - Hostile enemies (attack player)
   - Friendly NPCs (give hints/items)
   - Gravestones only (loot + message)
   - Mix (random behavior)

3. **Chat scope?**
   - Global only
   - Per-dungeon-level channels
   - Private messages
   - All of the above

4. **Hosting target?**
   - Self-hosted VPS
   - Cloud (AWS/GCP/DigitalOcean)
   - Platform (Railway/Render/Fly.io)

5. **Free or paid?**
   - Completely free
   - Cosmetics (name colors, titles)
   - Premium features

---

## Previous Session Summary

### What We Accomplished (v2.2.x)
1. **Released v2.2.0** - Major UX improvements & story system
   - Title screen with ASCII logo
   - Story intro sequence
   - 12 lore items across 5 levels
   - Confirmation dialogs, message log, auto-save, tutorial hints

2. **Released v2.2.1** - Bug fixes
   - Fixed lore items not displaying content
   - Added victory screen
   - Fixed save/load for lore items

### Current Git State
```
v2.2.1 tag on commit 9d33fcf
master and develop branches synced
```

---

## Quick Reference

### Current Game (v2.2.1)
```bash
cd C:\Users\blixa\claude_test
python main.py
```

### Key Files
- `src/core/game.py` - Main game loop (will be refactored for server)
- `src/core/constants.py` - Game configuration
- `src/managers/` - Game logic managers (portable to backend)

---

## Notes

- Existing game logic in `src/` is well-structured and can be ported
- Manager classes (EntityManager, CombatManager, etc.) are already decoupled
- Main challenge is separating rendering from game logic
- Consider keeping single-player mode alongside online version
