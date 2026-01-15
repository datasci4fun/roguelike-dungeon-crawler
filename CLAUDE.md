# CLAUDE.md — Roguelike Dungeon Crawler (claude_test)

## Project intent
Terminal roguelike in Python using curses, with procedural dungeon generation (BSP), exploration, and bump-to-attack combat.
Repo already contains core systems (dungeon gen, renderer, enemies, items, levels). Focus now is stability + polish, not scaffolding.

## Source of truth
- Gameplay/features: README.md (aspirational but mostly implemented)
- Git workflow: WORKFLOW.md
- UI migration plan: **[PLAN_UI_MIGRATION.md](PLAN_UI_MIGRATION.md)** - Major UI overhaul to move terminal elements into 3D view
- If PLAN.md exists, treat it as guidance; do not delete working features to "match the plan" unless asked.

## How to run (Windows)
From repo root:
1) Create venv: `python -m venv .venv`
2) Install deps: `.\.venv\Scripts\pip install -r requirements.txt`
3) Run: `.\.venv\Scripts\python main.py`

## Quick health checks
- Syntax/type sanity: `.\.venv\Scripts\python -m py_compile src\*.py`
- Smoke run: `.\.venv\Scripts\python main.py` (move, fight, pick up item, descend stairs, quit)

## Codebase health data
Regenerate after refactoring to update the web dashboard:
```
.venv/Scripts/python.exe scripts/generate_codebase_health.py
```
**Note:** Use forward slashes in the path (Windows bash quirk). Output goes to `web/src/data/codebaseHealthData.ts`.

## Diagnostics & observability
See **[DIAGNOSTICS.md](DIAGNOSTICS.md)** for the full diagnostic toolkit:
- 14 web dev tools (System Status, Metrics, Profiler, Error Tracker, Log Viewer, etc.)
- Backend API endpoints for monitoring
- Claude skills: `/dev-environment`, `/game-integrity`, `/ci-healthcheck`
- In-game debug hotkeys (F1-F7) and frontend debug keys (F8-F10)
- Diagnostic flowcharts for common issues

## Environment constraints
- curses on Windows via `windows-curses` (requirements.txt already includes it).
- Prefer Windows Terminal. If rendering issues appear, assume terminal size and color support first.

## Coding rules
- Make the smallest change that solves the problem; avoid broad refactors unless explicitly requested.
- Keep logic deterministic where useful: allow a seed for dungeon generation when debugging.
- Keep modules separated:
  - dungeon.py: generation + walkability + utilities
  - entities.py/combat.py: entity + damage rules
  - items.py: item effects + inventory
  - renderer.py: drawing only (no game logic)
  - game.py: orchestration/state machine

## Python version
Repo currently runs on the user's machine. Assume Python >= 3.9 in practice.
If asked to support 3.7/3.8, remove `list[T]` annotations and use `typing.List`/`typing.Optional` to restore compatibility.

## Git workflow
- Work off `develop` using feature branches:
  - `git checkout develop && git pull`
  - `git checkout -b feature/<short-desc>`
- Each work chunk ends with:
  - compile check + quick run
  - one clean commit message describing behavior change
- Keep commits focused. Prefer multiple small commits over one giant one.

## Session protocol (how to keep "state" current)
At the start of EVERY session:
1) Run:
   - `git status`
   - `git log -10 --oneline --decorate`
   - `.\.venv\Scripts\python -m py_compile src\*.py`
2) Read (or skim if unchanged):
   - README.md
   - WORKFLOW.md
   - src/game.py (game loop + transitions)
   - src/renderer.py (UI constraints)
   - src/dungeon.py (generation + walkability)
3) Produce:
   - Current capability summary (bullets)
   - Top 3 next tasks (ranked)
   - 60–90 minute execution plan with concrete file edits

At the end of EVERY session:
1) Ensure it still runs (`python main.py`) and compiles (`py_compile`).
2) Commit changes.
3) Update a durable checkpoint file in the repo (create if missing): STATE.md
   - what changed
   - what’s next
   - any known bugs/regressions

## Definition of done for a change
- Compiles (`py_compile`) and game launches.
- No obvious UI breakage (panel + dungeon render ok).
- Any new behavior is visible in-game (or logged to message panel).
- STATE.md updated if behavior or goals changed.

## PR creation template
Use `PR_BODY_TEMPLATE.md` in repo root when creating GitHub PRs:
- `gh pr create --base develop --title "..." --body-file PR_BODY_TEMPLATE.md`
Avoid heredocs in commands.
