#!/usr/bin/env bash
set -euo pipefail

ROOT="$(git rev-parse --show-toplevel)"
cd "$ROOT"

SKILL_DIR=".claude/skills/model-generator"
TOOLS_DIR="$SKILL_DIR/tools"
OUT_DIR="$(node -e "console.log(require('./$SKILL_DIR/config.json').paths.out_dir)")"
LOG_FILE="$(node -e "console.log(require('./$SKILL_DIR/config.json').paths.log_file)")"
RESULT_FILE="$(node -e "console.log(require('./$SKILL_DIR/config.json').paths.result_file)")"

mkdir -p "$OUT_DIR"
: > "$LOG_FILE"

# Parse args
MODEL_ID=""
MODEL_FILE=""
FACTORY=""
META=""
CATEGORY=""
ENEMY_NAME=""
CREATE_EXPR=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    --model-id) MODEL_ID="$2"; shift 2;;
    --model-file) MODEL_FILE="$2"; shift 2;;
    --factory) FACTORY="$2"; shift 2;;
    --meta) META="$2"; shift 2;;
    --category) CATEGORY="$2"; shift 2;;
    --enemy-name) ENEMY_NAME="$2"; shift 2;;
    --create-expr) CREATE_EXPR="$2"; shift 2;;
    *) echo "Unknown arg: $1" | tee -a "$LOG_FILE"; exit 2;;
  esac
done

if [[ -z "$MODEL_ID" || -z "$MODEL_FILE" || -z "$FACTORY" || -z "$META" ]]; then
  echo "Usage: run.sh --model-id <id> --model-file <path> --factory <createFn> --meta <META_NAME> [--category <cat>] [--enemy-name <name>] [--create-expr \"<expr>\"]" | tee -a "$LOG_FILE"
  exit 2
fi

pushd "$TOOLS_DIR" >/dev/null
if [[ ! -d node_modules ]]; then
  npm ci --silent >> "../out/log.txt" 2>&1 || npm install --silent >> "../out/log.txt" 2>&1
fi
popd >/dev/null

# 1) Analyze repo context (materials, existing ids)
node "$TOOLS_DIR/analyze_repo.mjs" >> "$LOG_FILE" 2>&1

# 2) Register model deterministically
node "$TOOLS_DIR/register_model.mjs" \
  --model-id "$MODEL_ID" \
  --model-file "$MODEL_FILE" \
  --factory "$FACTORY" \
  --meta "$META" \
  ${CATEGORY:+--category "$CATEGORY"} \
  ${ENEMY_NAME:+--enemy-name "$ENEMY_NAME"} \
  ${CREATE_EXPR:+--create-expr "$CREATE_EXPR"} \
  >> "$LOG_FILE" 2>&1

# 3) Validate TS compilation
node "$TOOLS_DIR/validate_tsc.mjs" >> "$LOG_FILE" 2>&1

# The scripts write the JSON result; ensure it exists
if [[ ! -f "$RESULT_FILE" ]]; then
  echo "{\"ok\":false,\"error\":\"result.json not generated\"}" > "$RESULT_FILE"
fi

echo "Wrote: $RESULT_FILE"
echo "Logs:  $LOG_FILE"
