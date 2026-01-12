# Skill: collab-codex-claude

## Purpose

Formalize a collaboration workflow where **Claude** handles reasoning, architecture, and validation,
while **OpenAI Codex** handles deterministic implementation, large diffs, and CI-facing changes.

This skill exists to:
- Reduce context loss
- Avoid duplicated or conflicting work
- Ensure CI, local builds, and repo state stay aligned
- Make handoffs explicit and auditable

---

## Roles & Responsibilities

### Claude (Reasoning / Architect)

Claude is responsible for:

- Understanding **current repo state**
- Interpreting user intent and constraints
- Designing **minimal, correct changes**
- Identifying risks, edge cases, and invariants
- Producing:
  - Exact specifications
  - File paths
  - Step-by-step instructions
  - Validation criteria
- Reviewing Codex output for correctness

Claude **must not**:
- Generate large mechanical diffs if Codex can do it
- Guess file layouts without checking
- Run speculative refactors

---

### Codex (Executor / Implementer)

Codex is responsible for:

- Creating branches
- Writing files and diffs exactly as specified
- Adding CI workflows
- Applying repetitive or boilerplate changes
- Running setup scripts and CI-like commands
- Opening PRs

Codex **must not**:
- Invent architecture
- Expand scope beyond the given spec
- Change files not explicitly listed

---

## Standard Handoff Protocol

### Step 1 — Claude prepares the spec

Claude must produce a handoff that includes:

- ✅ Goal (1–2 sentences)
- ✅ Exact file paths to be changed/created
- ✅ Explicit constraints (what NOT to touch)
- ✅ Validation steps that mirror CI
- ✅ “Stop condition” (what success looks like)

**Example:**
> “Add GitHub Actions CI pipeline with 3 jobs. Do not modify application code.”

---

### Step 2 — User delegates to Codex

User sends Codex:

- The spec verbatim
- No extra interpretation
- No partial instructions

Codex executes and proposes changes (branch + PR).

---

### Step 3 — Claude reviews Codex output

Claude verifies:

- Files match spec exactly
- CI passes
- No scope creep
- No regressions
- Docs/state updated if required

Claude either:
- Approves merge
- Or produces a **delta-only correction** for Codex

---

## CI Alignment Rule (Hard Constraint)

Any workflow, script, or validation step:

- MUST be runnable locally
- MUST match CI exactly
- MUST be documented once CI is merged

Claude should always ask:
> “Does this match what CI will do?”

If not — stop and fix.

---

## When to Use This Skill

Use `collab-codex-claude` when:

- Adding CI/CD pipelines
- Adding GitHub Actions
- Making large, mechanical refactors
- Touching infra, workflows, or automation
- Enforcing repo-wide rules

Do **not** use this skill for:
- Experimental rendering work
- One-off debugging
- Exploratory prototyping

---

## Failure Modes This Skill Prevents

- CI added but not documented
- Claude and Codex editing the same files differently
- Codex “helpfully” expanding scope
- Claude running incorrect local commands
- Merged PRs that break main immediately

---

## Canonical Success Signal

This skill is successful when:

- Codex PR merges cleanly
- CI passes on first run
- Local developer workflow matches CI
- Claude session remains context-accurate
- No follow-up “fix CI” commits are needed

---

## Reminder

Claude thinks.
Codex types.
User decides.

Never blur these roles.
