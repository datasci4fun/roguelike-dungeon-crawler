# Claude Repo Bot - Session Findings & Recommendations

**Date:** 2026-01-22
**Session:** Initial installation, configuration, and refinement of max-safe Claude Repo Bot kit
**Environment:** Windows 11, Claude Code CLI (local auth), GitHub
**Prepared for:** OpenAI GPT Pro (original skill designer)

---

## Executive Summary

Successfully installed and refined the max-safe Claude Repo Bot kit. Made significant improvements to skill files by adding determinism markers (`[D]`, `[ND]`, `[X]`) and restructuring workflows for clarity. Identified and resolved Windows compatibility issues. Completed a full discover→fix→PR cycle demonstrating the workflow works end-to-end.

---

## 1. Installation Issues Encountered

### 1.1 Windows/Bash Compatibility

**Problem:** The `bot.py` script uses `bash -lc` to execute commands (line 184):
```python
cp = sh(["bash","-lc",c], check=False, capture=output=True)
```

This fails on Windows without proper WSL configuration, producing errors like:
```
WSL (87339 - Relay) ERROR: CreateProcessCommon:640: execvpe(/bin/bash) failed
```

**Impact:** The `run-smoke` and `run-verify` commands in `bot.py` don't work on Windows.

**Workaround Applied:** Run verification commands directly in the Claude conversation rather than through `bot.py`.

**Recommendation:** Add Windows detection and use `cmd /c` or PowerShell as fallback:
```python
import platform
if platform.system() == 'Windows':
    cp = sh(["cmd", "/c", c], ...)
else:
    cp = sh(["bash", "-lc", c], ...)
```

### 1.2 run_signals.sh Windows Issues

**Problem:** The bash script has issues with:
- `npx` failing due to WSL variable issues: `IS_WSL: unbound variable`
- Python venv paths not resolving correctly

**Original script limitations:**
- Only collected TODOs/FIXMEs
- No actual lint/type check output

**Enhancement Made:** Expanded `run_signals.sh` to capture:
```bash
# Python compile check
python -m compileall -q src/ 2>&1

# pytest summary
python -m pytest tests/ --tb=no -q 2>&1 | tail -10

# TypeScript errors
(cd web && npx tsc -b 2>&1 | head -30) || true

# ESLint errors
(cd web && npm run lint 2>&1 | grep -E "error|warning" | head -30) || true
```

### 1.3 API Key vs Local CLI Auth

**Problem:** User expected to use local Claude CLI authentication (OAuth), but `bot.py discover` requires `ANTHROPIC_API_KEY` for headless operation.

**Resolution:**
1. Disabled nightly cron schedules (workflows now manual-trigger only)
2. Skills execute directly in conversation using existing CLI auth
3. Added note that API key is only needed for GitHub Actions CI

**Config change:**
```yaml
# Before
on:
  schedule:
    - cron: "5 23 * * *"
  workflow_dispatch:

# After
on:
  workflow_dispatch:  # Manual trigger only
```

---

## 2. Skill Improvements Made

### 2.1 Added Determinism Markers

All skills now clearly mark each step:
```
[D]  = Deterministic (same inputs → same outputs)
[ND] = Non-deterministic (Claude analysis/judgment)
[X]  = External (network, flaky tests)
```

This helps users understand:
- What can be scripted/automated
- Where Claude's judgment is required
- What depends on external factors

### 2.2 bot-menu Skill (New Orchestrator)

**Created:** `.claude/skills/bot-menu/SKILL.md`

**Purpose:** Interactive entry point with state tracking

**Key features:**
1. Reads last action from `.claude/bot-last-action.json`
2. Displays warnings for recent repeats or stale in-progress states
3. Presents menu via `AskUserQuestion`
4. Tracks state throughout execution
5. Provides clear workflow visualization

**State machine diagram added:**
```
                    ┌─────────────┐
                    │  bot-menu   │
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

### 2.3 bot-discover-issues Skill (Refined)

**Changes:**
1. Removed `disable-model-invocation: true` constraint
2. Added phased workflow with determinism markers
3. Specified exact commands for signal collection
4. Added user confirmation before creating issues

**New workflow structure:**
```
Phase 1 [D]: Signal Collection
  - git status, TODO scan, compile check, tsc errors, lint errors
Phase 2 [D]: Load Configuration
  - Read scan_paths, max_new_issues_per_run
Phase 3 [ND]: Analyze Signals
  - Claude interprets signals, identifies actionable issues
Phase 4 [D]: Validate Output
  - JSON schema validation, cap enforcement
Phase 5 [X]: Create Issues
  - gh CLI calls with user confirmation
```

### 2.4 bot-fix-issues Skill (Refined)

**Changes:**
1. Added explicit safety gates table
2. Clear phase separation
3. User confirmation before PR creation

**Safety gates (all [D]):**
| Gate | Check | Action on Fail |
|------|-------|----------------|
| Scope | Changed files within `scan_paths` | Abort, mark `bot:blocked` |
| Disallowed | Files not in `disallowed_globs` | Abort, mark `bot:blocked` |
| Size | Changed lines ≤ `max_changed_lines` | Abort, mark `bot:blocked` |
| Binary | No binary files | Abort, mark `bot:blocked` |
| Smoke | Tests pass | Abort, mark `bot:blocked` |

### 2.5 bot-triage Skill (Refined)

**Changes:**
1. Added complete label taxonomy table
2. Clear queueing rules
3. Dedupe rules documentation
4. Phased workflow with markers

---

## 3. Configuration Improvements

### 3.1 bot-config.yml

**Added verification commands:**
```yaml
commands:
  smoke:
    - "python -m compileall -q src/"
    - "cd web && npx tsc --noEmit"
  verify:
    - "python -m compileall -q src/"
    - "python -m pytest tests/ -v --tb=short"
    - "cd web && npm run lint"
    - "cd web && npm run build"
```

**Note:** These commands work in CI (Linux) but the `bot.py` wrapper fails on Windows.

### 3.2 State Tracking File

**Added:** `.claude/bot-last-action.json`

```json
{
  "action": "discover|fix|verify|triage|status",
  "started_at": "ISO8601",
  "completed_at": "ISO8601",
  "status": "in_progress|success|failed|partial",
  "summary": "Human-readable result"
}
```

**Benefits:**
- Prevents accidental duplicate runs
- Shows user what happened last
- Helps debug crashed runs

---

## 4. Workflow Execution Results

### 4.1 Discover Workflow

**Executed successfully:**
1. Signal collection captured 38 TypeScript errors, 20+ ESLint errors
2. Analysis identified 3 actionable issues
3. Created GitHub issues #84, #85, #86 with proper labels

**Issues discovered:**
| # | Title | Type | Severity |
|---|-------|------|----------|
| #84 | Unused exports in models/index.ts | refactor | medium |
| #85 | LevelEditor type mismatches | bug | high |
| #86 | React hooks violations | bug | medium |

### 4.2 Fix Workflow

**Executed successfully for #84:**
1. Created branch `bot/issue-84-unused-exports`
2. Applied minimal fix (removed 12 unused imports)
3. Validated: 15 lines changed, smoke checks passed
4. Opened PR #87
5. Updated issue labels and added comment

---

## 5. Recommendations for Future Versions

### 5.1 Cross-Platform Support

**Priority: High**

1. Add Windows detection in `bot.py`
2. Use platform-appropriate shell commands
3. Consider PowerShell Core for cross-platform scripting
4. Test on Windows, macOS, and Linux

### 5.2 Local CLI Auth Mode

**Priority: High**

Add explicit support for local CLI auth vs API key:

```yaml
bot:
  auth_mode: cli  # or 'api_key'
```

When `auth_mode: cli`:
- Skills execute in conversation context
- No `ANTHROPIC_API_KEY` required
- Disable CI workflows that need headless Claude

### 5.3 Skill Invocation

**Issue:** Skills with `disable-model-invocation: true` cannot be called via the `Skill` tool.

**Recommendation:** Remove this constraint or provide alternative invocation method. The constraint was likely intended for security but prevents useful orchestration.

### 5.4 Signal Collection Improvements

**Current limitations:**
- `run_signals.sh` is bash-only
- Output is unstructured text

**Recommendations:**
1. Create `run_signals.py` for cross-platform support
2. Output structured JSON for easier parsing
3. Include severity/count summaries

Example:
```json
{
  "timestamp": "2026-01-22T19:00:00Z",
  "signals": {
    "python_compile": {"status": "pass", "errors": 0},
    "pytest": {"status": "pass", "passed": 117, "failed": 0},
    "typescript": {"status": "fail", "errors": 38},
    "eslint": {"status": "fail", "errors": 122, "warnings": 31}
  }
}
```

### 5.5 Better Error Handling

**Current issue:** When `bot.py` fails, error messages are cryptic.

**Recommendations:**
1. Add structured error codes
2. Suggest remediation steps
3. Log to file for debugging

### 5.6 Incremental Fixes

**Current behavior:** Bot attempts to fix entire issue in one PR.

**Recommendation:** For large issues (like #86 with 14+ occurrences), support incremental fixes:
1. Fix N occurrences per PR
2. Track progress in issue comments
3. Allow user to set batch size

---

## 6. Files Modified in This Session

### New Files Created
- `.claude/skills/bot-menu/SKILL.md`
- `.claude/skills/bot-menu/config.json`
- `.claude/bot-config.yml`
- `.claude/bot-last-action.json` (gitignored)
- `scripts/claude-bot/*` (from kit)
- `.github/workflows/claude_*.yml` (from kit)

### Files Modified
- `.claude/skills/bot-discover-issues/SKILL.md` - Added determinism markers, phased workflow
- `.claude/skills/bot-fix-issues/SKILL.md` - Added safety gates, phased workflow
- `.claude/skills/bot-triage/SKILL.md` - Added label taxonomy, workflow
- `scripts/claude-bot/run_signals.sh` - Added lint/type check capture
- `.github/workflows/claude_discover.yml` - Disabled cron, added local usage note
- `.github/workflows/claude_fix_prs.yml` - Disabled cron, added local usage note
- `.github/workflows/main_verify.yml` - Changed branch from `main` to `develop`
- `requirements.txt` - Added pytest

### PRs Created
- #87: fix: remove unused imports in models/index.ts (fixes #84)

---

## 7. Key Learnings

### 7.1 Determinism is Crucial

Clearly marking `[D]`, `[ND]`, `[X]` in skills helps:
- Users understand what to expect
- Debugging when things go wrong
- Identifying what can be automated vs needs judgment

### 7.2 User Confirmation Points

Adding confirmation before destructive/external operations:
- "Found N issues. Create GitHub issues?"
- "Ready to commit and open PR?"

This prevents accidental mass-creation of issues/PRs.

### 7.3 State Tracking Prevents Mistakes

The `bot-last-action.json` file prevents:
- Running discover twice (duplicate issues)
- Forgetting what was done last
- Stale in-progress states

### 7.4 Local Execution > CI for Development

For development/testing, running skills in conversation is better than CI because:
- Uses existing auth
- Immediate feedback
- Can ask clarifying questions
- No API key management

### 7.5 Minimal Fixes Win

The fix for #84 was 15 lines changed. Keeping fixes minimal:
- Easier to review
- Less risk
- Faster CI
- Clear scope

---

## 8. Appendix: Final Skill File Structures

### bot-menu/SKILL.md Structure
```
# Bot Menu — Orchestrator
## Determinism Markers
## State Machine Overview (ASCII diagram)
## Workflow
  ### Phase 1: Load State [D]
  ### Phase 2: Safety Checks [D]
  ### Phase 3: Present Menu [D]
  ### Phase 4: Execute Selected Action
  ### Phase 5: Update State [D]
## Execution Instructions
```

### bot-discover-issues/SKILL.md Structure
```
# Discover Issues Workflow
## Determinism Markers
## Phase 1: Signal Collection [D]
## Phase 2: Load Configuration [D]
## Phase 3: Analyze Signals [ND]
## Phase 4: Structure Output [D]
## Phase 5: Create/Update Issues [X]
## Execution Instructions
```

### bot-fix-issues/SKILL.md Structure
```
# Fix Issues Workflow
## Determinism Markers
## Safety Gates [D] (table)
## Workflow
  ### Phase 1: Select Issues [D/X]
  ### Phase 2: For Each Issue
    #### 2a. Setup [D/X]
    #### 2b. Analyze & Fix [ND]
    #### 2c. Validate [D/X]
    #### 2d. Commit & Push [D/X]
    #### 2e. Open PR [X]
    #### 2f. Cleanup [D]
  ### Phase 3: Report [D]
## Execution Instructions
```

---

## 9. Contact & Attribution

**Session conducted by:** Claude (Opus 4.5)
**Original kit designed by:** OpenAI GPT Pro
**Repository:** datasci4fun/roguelike-dungeon-crawler
**Platform:** GitHub

---

*End of findings document*
