---
name: dev-environment
description: Checks all Docker containers (postgres, redis, backend, frontend) and boots up any services that aren't running for the roguelike project.
---

## Purpose

This Skill prepares the full development environment with a single command. It checks and starts:

1. **Docker services** (PostgreSQL, Redis, FastAPI backend, Vite frontend)

All four services are containerized and managed via docker-compose.

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
- `roguelike_frontend`

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

### Step 4: Final Verification

Run final checks:

```
docker-compose ps
```

Verify all 4 services are up:
- `roguelike_postgres` (healthy)
- `roguelike_redis` (healthy)
- `roguelike_backend` (running)
- `roguelike_frontend` (running)

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

### Frontend build issues
If the frontend container fails to start, it may need to rebuild:
```
docker-compose build frontend
docker-compose up -d frontend
```

---

## Service Details

### Docker Services (docker-compose.yml)

| Container | Image | Port | Purpose |
|-----------|-------|------|---------|
| roguelike_postgres | postgres:16-alpine | 5432 | Database |
| roguelike_redis | redis:7-alpine | 6379 | Cache/PubSub |
| roguelike_backend | ./server | 8000 | FastAPI API |
| roguelike_frontend | ./web | 5173 | Vite React app (with HMR) |

---

## Shutdown Instructions

To stop all services:

```bash
docker-compose down
```

To stop and remove volumes (full reset):

```bash
docker-compose down -v
```

---

## Scope

This Skill operates on the current project only. It does not affect other Docker containers or global system settings.
