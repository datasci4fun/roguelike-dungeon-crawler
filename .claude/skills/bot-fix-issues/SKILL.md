---
name: bot-fix-issues
description: Fix queued bot issues by applying minimal diffs and opening PRs.
argument-hint: "[issue-number | 'all']"
user-invocable: true
---

# Fix Issues Workflow

**Arguments:** `$ARGUMENTS` - single issue number or `all`

## Determinism Markers

```
[D]  = Deterministic (same inputs → same outputs)
[ND] = Non-deterministic (Claude analysis/judgment)
[X]  = External (network, flaky tests)
```

## Safety Gates [D]

These are HARD REQUIREMENTS. Abort if any fail:

| Gate | Check | Action on Fail |
|------|-------|----------------|
| Scope | Changed files within `scan_paths` | Abort, mark `bot:blocked` |
| Disallowed | Files not in `disallowed_globs` | Abort, mark `bot:blocked` |
| Size | Changed lines ≤ `max_changed_lines` | Abort, mark `bot:blocked` |
| Binary | No binary files (numstat shows `-`) | Abort, mark `bot:blocked` |
| Smoke | `run_smoke` passes | Abort, mark `bot:blocked` |

## Workflow

### Phase 1: Select Issues [D/X]

```bash
# [X] Fetch queued issues (network)
gh issue list --label "bot:queued" --json number,title,body

# [D] If $ARGUMENTS is a number, filter to that issue
# [D] If $ARGUMENTS is "all", process all queued issues
```

### Phase 2: For Each Issue

#### 2a. Setup [D/X]

```bash
# [D] Read config
cat .claude/bot-config.yml

# [D] Get default branch
default_branch=$(git symbolic-ref refs/remotes/origin/HEAD | sed 's@^refs/remotes/origin/@@')

# [D] Create branch
branch="bot/issue-${number}-${slug}"
git checkout -b "$branch" "origin/$default_branch"

# [X] Mark issue in-progress (network)
gh issue edit $number --add-label "bot:in-progress" --remove-label "bot:queued"
```

#### 2b. Analyze & Fix [ND]

This is the NON-DETERMINISTIC part:

1. **Read issue** - understand what needs fixing
2. **Locate files** - find relevant code
3. **Plan fix** - determine minimal change
4. **Apply edits** - make code changes
5. **Add tests** if feasible

Constraints:
- ONE ticket per commit
- MINIMAL change needed
- If unsure, STOP and mark `bot:blocked`

#### 2c. Validate [D/X]

```bash
# [D] Check what changed
git status --porcelain
git diff --stat

# [D] Validate scope
changed_files=$(git diff --name-only)
# Must be within scan_paths
# Must NOT match disallowed_globs

# [D] Validate size
total_lines=$(git diff --numstat | awk '{sum+=$1+$2} END{print sum}')
# Must be ≤ max_changed_lines

# [X] Run smoke checks (may be flaky)
python -m compileall -q src/
.venv/Scripts/python -m pytest tests/ --tb=no -q
```

#### 2d. Commit & Push [D/X]

```bash
# [D] Stage and commit
git add -A
git commit -m "fix: ${title} (refs #${number})"

# [X] Push branch (network)
git push -u origin "$branch"
```

#### 2e. Open PR [X]

```bash
# [X] Create PR (network)
gh pr create \
  --base "$default_branch" \
  --head "$branch" \
  --title "[bot] ${title}" \
  --body "Fixes #${number}"

# [X] Update issue labels (network)
gh issue edit $number --add-label "bot:pr-open" --remove-label "bot:in-progress"

# [X] Comment on issue (network)
gh issue comment $number --body "PR #${pr_number} opened for this issue."
```

#### 2f. Cleanup [D]

```bash
# [D] Return to default branch
git checkout "$default_branch"
git reset --hard "origin/$default_branch"
```

### Phase 3: Report [D]

Output summary:
```
Fixed: 2 issues
- #12: PR #45 opened (branch: bot/issue-12-fix-login)
- #15: PR #46 opened (branch: bot/issue-15-unused-imports)

Blocked: 1 issue
- #18: Could not determine safe fix (marked bot:blocked)
```

## Execution Instructions

When invoked:

1. **Run Phase 1** - Fetch queued issues
2. **For each issue:**
   - Run 2a (setup)
   - Run 2b (fix - Claude judgment)
   - Run 2c (validate - abort if fails)
   - Run 2d (commit & push)
   - Ask user: "Open PR for issue #N?"
   - Run 2e (open PR)
   - Run 2f (cleanup)
3. **Run Phase 3** - Output summary

## Related Skills

- `/bot-triage` - Label taxonomy and rules
- `/bot-policy` - Safety constraints
- `/bot-verify-and-close` - Post-merge verification
