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

echo "=== end signals ==="
