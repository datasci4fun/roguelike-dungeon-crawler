# Diagnostics & Observability Reference

Quick reference for all diagnostic tools available in this repository.

---

## Quick Diagnosis Guide

| Problem Type | Start Here |
|--------------|------------|
| Service down | [System Status](#system-status) |
| Slow responses | [Performance Profiler](#performance-profiler) |
| API errors | [Error Tracker](#error-tracker) |
| Database issues | [Database Explorer](#database-explorer) |
| Cache problems | [Cache Inspector](#cache-inspector) |
| WebSocket issues | [WebSocket Monitor](#websocket-monitor) |
| Auth/session issues | [Session Inspector](#session-inspector) |
| Game data bugs | [/game-integrity skill](#game-integrity) |
| Build/deploy issues | [Build Info](#build-info) |
| Log investigation | [Log Viewer](#log-viewer) |

---

## Web Dev Tools

All accessible at `http://localhost:5173/{path}` when frontend is running.

### System Status
- **Path**: `/system-status`
- **Purpose**: Real-time service health monitoring
- **Features**: Service health indicators, CPU/memory/disk gauges, uptime, latency
- **API**: `GET /api/status`
- **Use when**: Checking if services are up, monitoring resource usage

### Metrics Dashboard
- **Path**: `/metrics`
- **Purpose**: Application performance metrics
- **Features**: Request stats, error rates, response times, per-endpoint metrics (p50/p95/p99)
- **API**: `GET /api/metrics`, `GET /api/metrics/endpoints`, `POST /api/metrics/reset`
- **Use when**: Analyzing overall application performance

### Performance Profiler
- **Path**: `/profiler`
- **Purpose**: Request timing analysis
- **Features**: Request timeline, slow request detection (>500ms), endpoint percentiles
- **API**: `GET /api/profiler/requests`, `GET /api/profiler/stats`, `GET /api/profiler/endpoints`
- **Use when**: Finding slow endpoints, investigating latency issues

### Error Tracker
- **Path**: `/errors`
- **Purpose**: Exception monitoring
- **Features**: Stack traces, severity filtering, error grouping, resolve/unresolve
- **API**: `GET /api/errors`, `GET /api/errors/stats`, `PATCH /api/errors/{id}/resolve`
- **Use when**: Investigating exceptions, tracking error patterns

### Log Viewer
- **Path**: `/logs`
- **Purpose**: Real-time log streaming
- **Features**: WebSocket live logs, level filtering, logger filtering, search, export
- **API**: `GET /api/logs`, `WS /api/logs/stream`
- **Use when**: Debugging runtime behavior, tracing request flow

### Database Explorer
- **Path**: `/db-explorer`
- **Purpose**: Database inspection
- **Features**: Table listing, schema viewer, data browser, read-only SQL queries
- **API**: `GET /api/db/tables`, `GET /api/db/tables/{name}/schema`, `POST /api/db/query`
- **Use when**: Inspecting data, verifying schema, debugging data issues

### Cache Inspector
- **Path**: `/cache-inspector`
- **Purpose**: Redis cache management
- **Features**: Stats, key browser, pattern search, TTL display, bulk delete
- **API**: `GET /api/cache/stats`, `GET /api/cache/keys`, `DELETE /api/cache/keys/{key}`
- **Use when**: Debugging cache issues, clearing stale data

### Session Inspector
- **Path**: `/sessions`
- **Purpose**: User session management
- **Features**: Active sessions, device info, activity timeline, revoke sessions
- **API**: `GET /api/sessions`, `GET /api/sessions/stats`, `DELETE /api/sessions/{id}`
- **Use when**: Debugging auth issues, managing user sessions

### WebSocket Monitor
- **Path**: `/ws-monitor`
- **Purpose**: WebSocket traffic debugging
- **Features**: Connect to game/chat/spectate, message log, send custom messages
- **Endpoints**: `WS /api/game/ws`, `WS /api/chat/ws`, `WS /api/game/spectate/{id}`
- **Use when**: Debugging real-time communication, testing WebSocket events

### API Playground
- **Path**: `/api-playground`
- **Purpose**: Interactive API testing
- **Features**: Request builder, response viewer, history, pre-built templates
- **Use when**: Testing API endpoints manually, exploring API behavior

### Route Explorer
- **Path**: `/routes`
- **Purpose**: View all application routes
- **Features**: Backend API routes, frontend routes, method/tag filtering
- **API**: `GET /api/routes`, `GET /api/routes/frontend`
- **Use when**: Finding endpoints, understanding API structure

### Build Info
- **Path**: `/build`
- **Purpose**: Build and environment information
- **Features**: Git info (commit, branch, tags), Python version, installed packages
- **API**: `GET /api/build`
- **Use when**: Verifying deployment, checking versions

### Codebase Health
- **Path**: `/health`
- **Purpose**: Code quality metrics
- **Features**: File stats, LOC counts, refactoring todos, priority tracking
- **Use when**: Planning refactoring, assessing code quality

### Feature Flags
- **Path**: `/flags`
- **Purpose**: Feature flag management
- **Features**: Toggle features, view flag states
- **API**: `GET /api/flags`, `PATCH /api/flags/{name}`
- **Use when**: Enabling/disabling features

### Environment Config
- **Path**: `/env-config`
- **Purpose**: Environment variable viewer
- **Features**: View non-sensitive config, validate settings
- **API**: `GET /api/config`
- **Use when**: Verifying configuration

### Dependency Viewer
- **Path**: `/dependencies`
- **Purpose**: Project dependency information
- **Features**: Package list, versions, dependency tree
- **API**: `GET /api/dependencies`
- **Use when**: Checking package versions, auditing dependencies

---

## Claude Skills

Trigger these by asking Claude or using the skill name.

### dev-environment
- **Trigger**: "start dev environment", "boot up services", "/dev-environment"
- **Purpose**: Check and start all Docker services
- **Checks**: Docker status, container health, port availability
- **Use when**: Starting development, verifying services are running

### game-integrity
- **Trigger**: "run game integrity", "validate game systems", "/game-integrity"
- **Purpose**: Comprehensive game data validation (21 checks)
- **Validates**:
  - Zone configuration and floor assignment
  - Enemy pools and spawn constraints
  - Encounter messages and lore coverage
  - Ghost system consistency
  - Artifact and vow definitions
  - Save/load roundtrip stability
  - Battle state serialization
  - Class ability definitions
  - Seed determinism
- **Use when**: After changing game data, before releases

### ci-healthcheck
- **Trigger**: "check CI", "preflight", "/ci-healthcheck"
- **Purpose**: Verify CI will pass before pushing
- **Checks**: Git cleanliness, TypeScript build, Python syntax, tests
- **Use when**: Before pushing commits, before PRs

### project-resync
- **Trigger**: "resync project", "sync with remote", "/project-resync"
- **Purpose**: Synchronize with remote repository
- **Use when**: Starting a session, resolving divergence

---

## Command Line Diagnostics

### Python Syntax Check
```bash
.\.venv\Scripts\python -m py_compile src\*.py src\**\*.py
```

### Frontend Type Check
```bash
docker exec roguelike_frontend npm run typecheck
# or locally: cd web && npx tsc --noEmit
```

### Smoke Test
```bash
.\.venv\Scripts\python main.py
# Quick test: move, fight, pick up item, descend stairs, quit
```

### Docker Status
```bash
docker-compose ps
docker-compose logs -f [service]
```

### Python Tests
```bash
.\.venv\Scripts\python -m pytest tests/ -v
```

---

## In-Game Debug Hotkeys

| Key | Action |
|-----|--------|
| F1 | God Mode |
| F2 | Kill All Enemies |
| F3 | Full Heal |
| F4 | Next Floor |
| F5 | Reveal Map |
| F6 | Spawn Lore Item |
| F7 | Show Zone Overlay |

### Frontend Debug Hotkeys (DEV or `?debug=1`)

| Key | Action |
|-----|--------|
| F8 | Toggle wireframe overlay |
| F9 | Toggle occluded entity silhouettes |
| F10 | Copy scene snapshot to clipboard |

---

## API Health Endpoints

Quick health checks via curl or browser:

```bash
# System status
curl http://localhost:8000/api/status

# Basic health
curl http://localhost:8000/health

# Metrics summary
curl http://localhost:8000/api/metrics

# Error stats
curl http://localhost:8000/api/errors/stats

# Cache stats
curl http://localhost:8000/api/cache/stats
```

---

## Diagnostic Flowcharts

### Service Not Responding
1. Check `/system-status` - are all services green?
2. Run `docker-compose ps` - are containers running?
3. Check `/logs` for errors
4. Check `/errors` for exceptions
5. Run `/dev-environment` skill to restart services

### Slow Performance
1. Check `/profiler` - which endpoints are slow?
2. Check `/metrics` - are error rates high?
3. Check `/cache-inspector` - is cache working?
4. Check `/db-explorer` - run slow query analysis
5. Check `/system-status` - resource exhaustion?

### Data Inconsistency
1. Run `/game-integrity` skill - validates all game data
2. Check `/db-explorer` - inspect raw data
3. Check `/cache-inspector` - stale cache?
4. Review recent commits for data changes

### WebSocket Issues
1. Open `/ws-monitor` - can you connect?
2. Check `/logs` for WebSocket errors
3. Check `/sessions` - is session valid?
4. Test with `/api-playground` - does REST work?
