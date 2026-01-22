---
name: bot-triage
description: Label taxonomy and triage rules used by the repo bot. Review and prioritize open issues.
user-invocable: true
---

# Triage Workflow

## Determinism Markers

```
[D]  = Deterministic (same inputs → same outputs)
[ND] = Non-deterministic (Claude analysis/judgment)
[X]  = External (network)
```

## Label Taxonomy [D]

### State Labels (mutually exclusive progression)
| Label | Meaning |
|-------|---------|
| `bot:reported` | Issue created/tracked by bot |
| `bot:queued` | Ready for bot to attempt fix |
| `bot:in-progress` | Bot is actively working on fix |
| `bot:pr-open` | PR exists for this issue |
| `bot:ready-to-merge` | PR passed CI, awaiting merge |
| `bot:verified` | Issue fixed and closed |
| `bot:blocked` | Bot cannot fix (needs human) |

### Type Labels
| Label | Description |
|-------|-------------|
| `type:bug` | Incorrect behavior |
| `type:security` | Security vulnerability |
| `type:performance` | Performance issue |
| `type:refactor` | Code quality / maintainability |
| `type:docs` | Documentation issue |
| `type:test` | Missing or broken tests |
| `type:ci` | CI/CD pipeline issue |
| `type:deps` | Dependency issue |

### Severity Labels
| Label | Priority | Description |
|-------|----------|-------------|
| `sev:critical` | P0 | System down, data loss, security breach |
| `sev:high` | P1 | Major feature broken, no workaround |
| `sev:medium` | P2 | Feature degraded, workaround exists |
| `sev:low` | P3 | Minor issue, cosmetic, nice-to-have |

## Queueing Rules [D]

Queue automatically (`bot:queued`) **only if**:
- Fix is low-risk and local (single file or small scope)
- There is clear evidence + expected validation step
- No human decision required (architecture, API design, etc.)

Otherwise mark `bot:blocked` with explanation.

## Dedupe Rules [D]

If newly discovered issue matches existing fingerprint:
- Update existing issue body (append new evidence)
- Add comment with timestamped update
- Do NOT create duplicate issue

## Triage Workflow

### Phase 1: Fetch Open Issues [X]

```bash
# Get all open issues (network call)
gh issue list --state open --json number,title,body,labels,createdAt
```

### Phase 2: Analyze Each Issue [ND]

For each issue without complete labels:

1. **Read issue title and body**
2. **Determine type** based on content:
   - Mentions "crash", "error", "fails" → likely `type:bug`
   - Mentions "slow", "timeout", "memory" → likely `type:performance`
   - Mentions "unsafe", "injection", "auth" → likely `type:security`
   - Mentions "unused", "dead code", "cleanup" → likely `type:refactor`
3. **Determine severity** based on impact:
   - Affects all users, data integrity → `sev:critical`
   - Blocks major functionality → `sev:high`
   - Degraded experience → `sev:medium`
   - Minor annoyance → `sev:low`
4. **Check if actionable** for bot:
   - Clear fix path, low risk? → add `bot:queued`
   - Needs human decision? → add `bot:blocked`

### Phase 3: Apply Labels [X]

```bash
# Add labels to issue (network call)
gh issue edit <number> --add-label "type:bug,sev:medium,bot:queued"
```

### Phase 4: Report Summary [D]

Output triage summary:
```
Triaged: 5 issues
- #12: type:bug, sev:high → bot:queued
- #15: type:refactor, sev:low → bot:queued
- #18: type:security, sev:critical → bot:blocked (needs human review)
```

## Execution Instructions

When invoked:

1. **Run Phase 1** - Fetch open issues via `gh issue list`
2. **Run Phase 2** - Analyze each issue (Claude judgment)
3. **Ask user** - "Apply these labels? [list changes]"
4. **Run Phase 3** - Apply labels via `gh issue edit`
5. **Run Phase 4** - Output summary
