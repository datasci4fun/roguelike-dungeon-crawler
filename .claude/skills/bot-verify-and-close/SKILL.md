---
name: bot-verify-and-close
description: Run verification commands and close issues whose fixes survived verification.
disable-model-invocation: true
allowed-tools: Bash(./scripts/claude-bot/run_verify.sh:*), Bash(git log:*), Read
---

# Verify and close

## Goal

- Run repo verification (`./scripts/claude-bot/run_verify.sh`).
- If verification passes:
  - Close issues labeled `bot:fixed-pending-verify`
  - Apply `bot:verified`
- If verification fails:
  - Do not close issues
  - Add a comment with failure summary and next steps

This should be run by CI after the fix stage.
