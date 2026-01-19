#!/usr/bin/env bash
set -euo pipefail

ROOT="$(git rev-parse --show-toplevel)"
cd "$ROOT"

SKILL_DIR=".claude/skills/redundancy-audit"
OUT_DIR="$SKILL_DIR/out"
TMP_DIR="$OUT_DIR/tmp"

mkdir -p "$OUT_DIR" "$TMP_DIR"

# Node deps local to skill
pushd "$SKILL_DIR/ts" >/dev/null
if [ ! -d node_modules ]; then
  npm install --silent
fi
popd >/dev/null

# Run analyzers
npm --prefix "$SKILL_DIR/ts" run -s analyze -- "$SKILL_DIR/config.json"
python3 "$SKILL_DIR/py/py_analyze.py" "$SKILL_DIR/config.json"

# Cluster + report
node "$SKILL_DIR/ts/winnow_cluster.mjs" "$SKILL_DIR/config.json"

echo "Wrote: $OUT_DIR/report.json"
