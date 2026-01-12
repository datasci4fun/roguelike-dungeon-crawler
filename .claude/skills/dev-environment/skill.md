---
name: dev-environment
description: Checks Docker containers and frontend dev server status, boots up any services that aren't running for the roguelike project.
---

## Purpose

This Skill prepares the full development environment with a single command. It checks and starts:

1. **Docker services** (PostgreSQL, Redis, FastAPI backend)
2. **Frontend dev server** (Vite/React)

Examples of trigger phrases:
- "start dev environment"
- "boot up the project"
- "get everything running"
- "dev-environment"
- "spin up services"

---

## Preconditions

Before running this Skill:

1. Confirm Docker Desktop (or Docker daemon) is running
2. Confirm the working directory contains `docker-compose.yml`
3. Confirm `web/` directory exists with `package.json`

---

## Procedure

### Step 1: Check Docker Availability

Run:
```
docker info
```

If Docker is not running, inform the user and stop:
> "Docker is not running. Please start Docker Desktop and try again."

---

### Step 2: Inspect Running Containers

Run:
```
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
```

Identify project containers by name:
- `roguelike_postgres`
- `roguelike_redis`
- `roguelike_backend`

Summarize which are running and which are missing.

---

### Step 3: Start Docker Services (if needed)

If any project containers are not running:

Run:
```
docker-compose up -d
```

Wait for services to become healthy. Check status with:
```
docker-compose ps
```

Report:
- Which services started
- Any errors encountered
- Health check status

---

### Step 4: Check Frontend Dev Server

Check if something is already listening on port 5173 (Vite default):

**Windows:**
```
netstat -ano | findstr :5173
```

**Unix/Mac:**
```
lsof -i :5173
```

If port 5173 is in use, assume frontend is already running.

---

### Step 5: Start Frontend Dev Server (if needed)

If frontend is not running:

Navigate to `web/` directory and start the dev server in the background:

```
cd web && npm run dev
```

**Important:** Run this as a background process so it doesn't block. Use the `run_in_background` parameter.

Wait a few seconds, then verify by checking port 5173 again.

---

### Step 6: Final Verification

Run final checks:

1. `docker-compose ps` - verify all 3 services are up
2. Check port 5173 - verify frontend is accessible

---

## Output

End with a status summary table:

| Service | Status | Port |
|---------|--------|------|
| PostgreSQL | Running | 5432 |
| Redis | Running | 6379 |
| Backend API | Running | 8000 |
| Frontend | Running | 5173 |

Provide access URLs:
- **Frontend:** http://localhost:5173
- **Backend API:** http://localhost:8000
- **API Docs:** http://localhost:8000/docs

---

## Error Handling

### Docker not installed
> "Docker is not installed or not in PATH. Please install Docker Desktop."

### Docker not running
> "Docker daemon is not running. Please start Docker Desktop."

### Port conflicts
If ports 5432, 6379, 8000, or 5173 are in use by other processes:
- Report which port has a conflict
- Ask user if they want to stop the conflicting process

### Missing dependencies
If `web/node_modules` doesn't exist:
```
cd web && npm install
```
Then proceed with `npm run dev`.

---

## Service Details

### Docker Services (docker-compose.yml)

| Container | Image | Port | Purpose |
|-----------|-------|------|---------|
| roguelike_postgres | postgres:16-alpine | 5432 | Database |
| roguelike_redis | redis:7-alpine | 6379 | Cache/PubSub |
| roguelike_backend | ./server | 8000 | FastAPI API |

### Frontend (not containerized)

| Directory | Command | Port | Purpose |
|-----------|---------|------|---------|
| web/ | npm run dev | 5173 | Vite React app |

---

## Shutdown Instructions

To stop all services later:

```bash
# Stop Docker services
docker-compose down

# Frontend will need to be stopped manually (Ctrl+C in its terminal)
# Or find and kill the process on port 5173
```

---

## Scope

This Skill operates on the current project only. It does not affect other Docker containers or global system settings.
