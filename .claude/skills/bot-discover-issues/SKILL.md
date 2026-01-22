---
name: bot-discover-issues
description: Scan the repo and output structured issues. Separates deterministic signal collection from non-deterministic analysis.
argument-hint: "[optional-scope-path]"
---

# Discover Issues Workflow

**Arguments:** `$ARGUMENTS` (optional path scope). If omitted, use repo's configured scan_paths.

## Workflow with Determinism Markers

```
[D]  = Deterministic (same inputs → same outputs)
[ND] = Non-deterministic (Claude analysis/judgment)
[X]  = External (network, flaky tests)
```

### Phase 1: Signal Collection [D]

Run these commands and capture output. These are deterministic given the same repo state.

```bash
# 1. Git state [D]
git rev-parse HEAD
git rev-parse --abbrev-ref HEAD
git status --porcelain

# 2. TODO/FIXME scan [D]
git grep -n -E "TODO\(|TODO:|FIXME\(|FIXME:" -- . | head -50

# 3. Python compile check [D]
python -m compileall -q src/ 2>&1

# 4. pytest summary [D] (may be [X] if tests are flaky)
.venv/Scripts/python -m pytest tests/ --tb=no -q 2>&1 | tail -10

# 5. TypeScript errors [D]
cd web && npx tsc -b 2>&1 | head -50

# 6. ESLint errors [D]
cd web && npm run lint 2>&1 | grep -E "error|warning" | head -50
```

### Phase 2: Load Configuration [D]

Read `.claude/bot-config.yml` and extract:
- `scan_paths` - directories to analyze
- `max_new_issues_per_run` - cap on issues to create

### Phase 3: Analyze Signals [ND]

This is the NON-DETERMINISTIC part where Claude interprets the signals.

For each potential issue found in signals:
1. Evaluate if it's **actionable** (can be fixed with code changes)
2. Assess **severity**: critical | high | medium | low
3. Categorize **type**: bug | security | performance | refactor | docs | test | ci | deps
4. Gather **evidence** (file paths, line numbers, error messages)
5. Propose **fix strategy**

### Phase 4: Structure Output [D]

Output must conform to `schemas/issues.schema.json`:

```json
{
  "issues": [
    {
      "title": "Short descriptive title",
      "description": "What's wrong and why it matters",
      "type": "bug|security|performance|refactor|docs|test|ci|deps",
      "severity": "critical|high|medium|low",
      "paths": ["file1.ts", "file2.ts"],
      "evidence": ["Error message or symptom 1", "Error message 2"],
      "fix_strategy": "How to fix this issue"
    }
  ]
}
```

### Phase 5: Create/Update Issues [X]

For each issue in output (up to `max_new_issues_per_run`):

```bash
# [D] Generate fingerprint for deduplication
fingerprint = hash(title + type + severity + sorted(paths))

# [X] Check if issue exists (network)
gh issue list --label "bot:reported" --json number,title,body

# [X] Create or update issue (network)
gh issue create --title "..." --body "..." --label "bot:reported,bot:queued,type:$TYPE,sev:$SEV"
```

## Execution Instructions

When invoked:

1. **Run Phase 1** - Execute all signal collection commands, store outputs
2. **Run Phase 2** - Read config file
3. **Run Phase 3** - Analyze signals and identify issues (your judgment here)
4. **Run Phase 4** - Format as JSON
5. **Ask user** before Phase 5 - "Found N issues. Create GitHub issues?"
6. **Run Phase 5** - Create issues via gh CLI (requires `GITHUB_TOKEN=$(gh auth token)`)

## Files

- Schema: `schemas/issues.schema.json`
- Template: `templates/issue_body.md`
- Config: `.claude/bot-config.yml`
