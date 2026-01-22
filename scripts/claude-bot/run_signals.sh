#!/usr/bin/env bash
set -euo pipefail

echo "=== claude-bot signals ==="
echo "date: $(date -u +%Y-%m-%dT%H:%M:%SZ)"
echo "git HEAD: $(git rev-parse HEAD 2>/dev/null || true)"
echo "git branch: $(git rev-parse --abbrev-ref HEAD 2>/dev/null || true)"
echo "git status:"
git status --porcelain=v1 || true
echo

# Optional quick lint hints (cheap):
if command -v git >/dev/null; then
  echo "Top TODO/FIXME hits (first 50):"
  git grep -n -E "TODO\(|TODO:|FIXME\(|FIXME:" -- . || true | head -n 50 || true
  echo
fi

# Python compile check
echo "=== Python compile check ==="
python -m compileall -q src/ 2>&1 || true
echo

# Python tests (quick summary)
echo "=== pytest summary ==="
if command -v pytest >/dev/null || [ -f ".venv/Scripts/pytest" ] || [ -f ".venv/bin/pytest" ]; then
  python -m pytest tests/ --tb=no -q 2>&1 | tail -5 || true
fi
echo

# TypeScript check (if web/ exists)
if [ -d "web" ]; then
  echo "=== TypeScript errors (first 30) ==="
  (cd web && npx tsc --noEmit 2>&1 | head -30) || true
  echo

  echo "=== ESLint errors (first 30) ==="
  (cd web && npm run lint 2>&1 | grep -E "error|warning" | head -30) || true
  echo
fi

echo "=== end signals ==="
