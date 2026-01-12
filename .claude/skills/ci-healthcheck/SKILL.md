---
name: ci-healthcheck
description: Checks CI/CD status and local readiness by running lint/typecheck/build/tests, verifying git cleanliness, and summarizing what will fail in CI before pushing.
---

## Purpose
Use when the user asks to “check CI”, “preflight before PR”, “make sure CI will pass”, or “verify pipeline readiness”.

## Procedure

### Step 1: Repo + git sanity
Run:
- `git rev-parse --show-toplevel`
- `git status -sb`
- `git log -3 --oneline --decorate`
- `git fetch --all --tags --prune`

If working tree is dirty:
- Show `git diff --stat`
- Ask user whether to (a) continue, (b) stash, or (c) commit before running checks.

### Step 2: Web frontend checks
From `web/`:
- `npm install` (only if `node_modules` missing or lockfile changed)
- `npx tsc --noEmit`
- `npm run build`

If tests exist:
- `npm test` or `npm run test` (only if defined)

### Step 3: Python/server checks
If server exists in `server/`:
- `pip install -r server/requirements.txt` (only if missing deps)
- run lightweight import/syntax checks (repo-specific):
  - `python -m py_compile ...` (use the project’s documented commands)

### Step 4: Docker compose smoke (optional)
If project uses compose:
- `docker-compose config` (validate compose file)
- Optionally `docker-compose up -d` only if user explicitly asks

### Step 5: Summarize results
Produce:
- ✅/❌ for each check
- actionable failures (file + command to reproduce)
- recommended next step: commit/push/open PR

## Safety rules
- Don’t run destructive commands (`rm`, `reset --hard`, pruning volumes) without explicit approval.
- Don’t install global tools; prefer project-local installs.

## Output format
- Git status summary
- Checks run (list)
- Failures with exact commands
- “Ready for PR: yes/no”
