# Development Guide

Setup, building, and testing instructions.

---

## Prerequisites

- Python 3.9+
- Node.js 18+
- Docker (for multiplayer backend)

---

## Terminal Client (Single Player)

### Setup
```bash
# Create virtual environment
python -m venv .venv

# Activate (Windows)
.\.venv\Scripts\activate

# Activate (Unix)
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

### Run
```bash
python main.py
```

### Syntax Check
```bash
python -m py_compile src/*.py src/**/*.py
```

---

## Multiplayer Backend

### Option 1: Docker (Recommended)
```bash
docker-compose up -d
```
This starts PostgreSQL, Redis, and FastAPI server.

### Option 2: Local Development
```bash
cd server
pip install -r requirements.txt
uvicorn app.main:app --reload
```

### API Documentation
When server is running: http://localhost:8000/docs

### Database Migrations
```bash
cd server
alembic upgrade head
```

---

## Web Frontend

### Setup
```bash
cd web
npm install
```

### Development Server
```bash
npm run dev
```
Access at http://localhost:5173

### Production Build
```bash
npm run build
```

### Type Check
```bash
npm run typecheck
# or
npx tsc --noEmit
```

### Mobile Testing
```bash
# Expose on network
npm run dev -- --host
```
Open the Network URL on your mobile device.

---

## Demo Account

For quick testing without registration:

| Field | Value |
|-------|-------|
| Username | `demo` |
| Password | `DemoPass123` |

Auto-created on server startup. Click "Try Demo" on login page.

---

## Test Pages

| URL | Purpose |
|-----|---------|
| `/first-person-test` | Visual renderer test with scenarios |
| `/first-person-demo` | Basic 3D view demo |
| `/scene-demo` | Top-down scene test |

---

## Project Commands

### Game Engine
```bash
# Run terminal client
python main.py

# Syntax check
python -m py_compile src/*.py

# Run with seed (debugging)
python main.py --seed 12345
```

### Backend
```bash
# Start server
uvicorn app.main:app --reload

# Run migrations
alembic upgrade head

# Create migration
alembic revision --autogenerate -m "description"
```

### Frontend
```bash
# Development
npm run dev

# Build
npm run build

# Preview build
npm run preview

# Type check
npx tsc --noEmit
```

### Docker
```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down

# Rebuild
docker-compose up -d --build
```

---

## Environment Variables

### Backend (.env)
```env
DATABASE_URL=postgresql://user:pass@localhost:5432/roguelike
REDIS_URL=redis://localhost:6379
SECRET_KEY=your-secret-key
```

### Frontend
```env
VITE_API_URL=http://localhost:8000
VITE_WS_URL=ws://localhost:8000
```

---

## Adding Custom Tiles

1. Create 64x64 PNG images
2. Place in `web/public/tiles/{biome}/`
3. Tile names: `floor.png`, `ceiling.png`, `wall_front.png`, etc.
4. Enable "Use Tile Grid" in test page

See `web/public/tiles/README.md` for details.
See `web/public/tiles/PROMPTS.md` for AI generation prompts.

---

## Troubleshooting

### Terminal rendering issues
- Use Windows Terminal instead of cmd.exe
- Check terminal size (minimum 80x24)

### WebSocket connection fails
- Ensure backend is running
- Check CORS settings
- Verify WebSocket URL

### Docker issues
- Check port availability (5432, 6379, 8000)
- Run `docker-compose down` then `up -d`

### Type errors
- Run `npx tsc --noEmit` to see all errors
- Check for missing dependencies
