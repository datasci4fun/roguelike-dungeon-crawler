---
name: ci-add-github-actions
description: Creates or updates a GitHub Actions CI workflow for web+server projects (Node/TypeScript + Python/FastAPI), including caching, artifact-free builds, and PR gating.
---

## Purpose
Use when the user asks to “set up CI”, “add GitHub Actions”, “make a pipeline”, “run checks on PR”, or “add lint/typecheck/build in CI”.

## Assumptions (project-typical)
- Web: `web/` with Node + TypeScript + Vite
- Server: `server/` with Python requirements
- Repo prefers PR checks on `develop`

If structure differs, detect and adapt.

## Procedure

### Step 1: Detect project layout + commands
Inspect:
- `web/package.json` scripts (typecheck/build/test)
- root docs for recommended checks
- `server/requirements.txt` existence
- Python version expectations (>=3.9 per docs)

Record the exact commands to run in CI:
- Web: `npm ci`, `npx tsc --noEmit`, `npm run build`
- Server: `pip install -r server/requirements.txt`, optional `python -m py_compile ...`

### Step 2: Create CI workflow file
Create `.github/workflows/ci.yml` with:
- Trigger: `pull_request` + `push` to `develop` (and optionally `master`)
- Jobs:
  1) `web` job (Node 18+):
     - checkout
     - setup-node with cache
     - `npm ci` in `web/`
     - `npx tsc --noEmit`
     - `npm run build`
  2) `server` job (Python 3.9+):
     - checkout
     - setup-python
     - pip cache
     - `pip install -r server/requirements.txt`
     - run minimal checks (py_compile or pytest if exists)

Prefer matrix only if valuable.

### Step 3: Optimize caching + speed
- Node cache: `cache: npm` and `cache-dependency-path: web/package-lock.json` (or lockfile used)
- Python cache: pip cache via `actions/setup-python` + `pip cache dir`

### Step 4: Add PR gating advice (non-code)
Recommend enabling branch protection for `develop`:
- require CI checks
- block direct pushes
Do not modify repo settings automatically.

### Step 5: Validate locally + commit
Ask user before writing files.
After writing, recommend:
- `git status`
- commit message: `ci: add GitHub Actions pipeline`
- open PR

## Safety rules
- Don’t add secret-dependent steps without explicit user request.
- Don’t deploy; this skill is for build/test verification only.

## Output format
- Files created/updated
- Exact CI commands
- Notes on branch protection settings to turn on
