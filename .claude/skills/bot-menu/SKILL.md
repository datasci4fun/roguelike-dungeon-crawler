---
name: bot-menu
description: Interactive entry point for Claude Repo Bot. Orchestrates all bot operations with state tracking.
user-invocable: true
triggers: ["/bot-menu", "/bot", "/menu"]
---

# Bot Menu — Orchestrator

## Determinism Markers

```
[D]  = Deterministic (same inputs → same outputs)
[ND] = Non-deterministic (Claude analysis/judgment)
[X]  = External (network)
```

## State Machine Overview

```
                    ┌─────────────┐
                    │  bot-menu   │
                    │ (this skill)│
                    └──────┬──────┘
                           │
        ┌──────────────────┼──────────────────┐
        ▼                  ▼                  ▼
┌───────────────┐  ┌───────────────┐  ┌───────────────┐
│   Discover    │  │     Fix       │  │    Verify     │
│   [ND]        │  │    [ND]       │  │     [D/X]     │
└───────┬───────┘  └───────┬───────┘  └───────────────┘
        │                  │
        ▼                  ▼
┌───────────────┐  ┌───────────────┐
│ Create Issues │  │  Open PRs     │
│     [X]       │  │    [X]        │
└───────────────┘  └───────────────┘
```

## Workflow

### Phase 1: Load State [D]

```bash
# [D] Read last action file
cat .claude/bot-last-action.json 2>/dev/null || echo "{}"
```

Parse and display:
```
Last action: [ACTION]
  Started: [TIMESTAMP]
  Status: [in_progress|success|failed]
  Summary: [SUMMARY]
```

### Phase 2: Safety Checks [D]

| Check | Condition | Warning |
|-------|-----------|---------|
| Stale in_progress | status=in_progress AND started >1hr ago | "Previous run may have crashed" |
| Recent repeat | same action completed <30min ago | "Running again may cause duplicates" |
| Fix warning | action=fix | "This will create PRs" |

### Phase 3: Present Menu [D]

Use `AskUserQuestion` with options:

| Option | Skill | Determinism |
|--------|-------|-------------|
| Discover Issues | `/bot-discover-issues` | [D]→[ND]→[X] |
| Fix Issues | `/bot-fix-issues` | [D]→[ND]→[D]→[X] |
| Run Verification | (direct commands) | [D/X] |
| Triage Issues | `/bot-triage` | [D]→[ND]→[X] |
| View Status | (direct commands) | [D/X] |

### Phase 4: Execute Selected Action

#### Option: Discover Issues

```
Phase 1 [D]: Signal collection
  - git status, TODO scan, compile check, tsc errors, lint errors
Phase 2 [D]: Load config (scan_paths, max_issues)
Phase 3 [ND]: Analyze signals → structured issues JSON
Phase 4 [D]: Validate JSON against schema
Phase 5 [X]: Create GitHub issues (with user confirmation)
```

Execute: Follow `/bot-discover-issues` workflow

#### Option: Fix Issues

```
Phase 1 [X]: Fetch queued issues
Phase 2 [D]: Create branch, read issue
Phase 3 [ND]: Analyze and apply fix
Phase 4 [D]: Validate (scope, size, smoke)
Phase 5 [X]: Push and open PR (with user confirmation)
```

Execute: Follow `/bot-fix-issues` workflow

#### Option: Run Verification

```
All [D/X] - no Claude judgment needed:
  python -m compileall -q src/
  .venv/Scripts/python -m pytest tests/ --tb=short
  cd web && npx tsc -b
  cd web && npm run lint
```

Execute directly, report pass/fail.

#### Option: Triage Issues

```
Phase 1 [X]: Fetch open issues
Phase 2 [ND]: Analyze and assign labels
Phase 3 [X]: Apply labels (with user confirmation)
```

Execute: Follow `/bot-triage` workflow

#### Option: View Status

```
All [X] - network calls:
  gh issue list --label "bot:queued" --json number,title
  gh issue list --label "bot:in-progress" --json number,title
  gh pr list --author "@me" --json number,title,state
```

### Phase 5: Update State [D]

After action completes, write to `.claude/bot-last-action.json`:

```json
{
  "action": "discover|fix|verify|triage|status",
  "started_at": "ISO8601",
  "completed_at": "ISO8601",
  "status": "success|failed|partial",
  "summary": "Human-readable result"
}
```

## Execution Instructions

When `/bot-menu` is invoked:

1. **[D] Read** `.claude/bot-last-action.json`
2. **[D] Display** last action summary with warnings if applicable
3. **[D] Present** menu via `AskUserQuestion`
4. **[D] Write** status "in_progress" to state file
5. **Execute** selected action following its workflow
6. **[D] Write** final status to state file
7. **[D] Display** result summary

## State File Location

`.claude/bot-last-action.json` (gitignored, local state only)
