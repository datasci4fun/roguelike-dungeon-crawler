---
name: bot-fix-issues
description: Solve queued bot issues by applying minimal diffs and preparing a commit per ticket.
argument-hint: "[issue-number | 'all']"
disable-model-invocation: true
allowed-tools: Read, Edit, Grep, Glob, Bash(./scripts/claude-bot/run_smoke.sh:*), Bash(git status:*), Bash(git diff:*), Bash(git grep:*), Bash(git restore:*), Bash(git checkout:*), Bash(git add:*), Bash(git reset:*), Bash(git commit:*)
---

# Fix queued issues

**Arguments:** `$ARGUMENTS` can be a single issue number or `all` (recommended).

## Constraints

- Only address **one ticket per commit**.
- **Minimal change** needed to resolve the ticket.
- Add/adjust tests if feasible.
- Run smoke checks via `./scripts/claude-bot/run_smoke.sh` before committing.
- If you cannot fix safely, stop and request human input; do not guess.

## Output / behavior

- Make code changes only; do **not** merge or close issues directly.
- Leave repo in a state where a separate verify stage can confirm and close.

Supporting docs:
- Bot policy: `/bot-policy`
- Triage rules: `/bot-triage`


- The automation opens a PR per ticket; CI verifies and (optionally) merges.
