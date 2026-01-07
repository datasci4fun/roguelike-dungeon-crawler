---
name: ci-release-gate
description: Adds a release gate workflow so tags/releases only happen from clean, passing builds; optionally validates changelog/version consistency before allowing a release.
---

## Purpose
Use when the user asks to “make releases safer”, “add release gate”, “ensure tags only from passing CI”, or “validate changelog/version”.

## Procedure

### Step 1: Define the release trigger
Use one of:
- tag push: `push: tags: ['v*']`
- manual: `workflow_dispatch` with `version` input

Default: tag push `v*`.

### Step 2: Implement release-check workflow
Create `.github/workflows/release-check.yml`:
- Trigger: tags `v*`
- Jobs: reuse the same checks as CI (web build + server checks)
- If any job fails: workflow fails (release should not proceed)

### Step 3: Add version/changelog consistency checks (optional)
If repo has `docs/CHANGELOG.md` and `README.md` version line:
- Ensure the tag version exists in changelog header
- Ensure README “Current Version” matches tag (if desired)
These checks should be non-destructive and fail with a clear message.

### Step 4: Recommend release process
Explain recommended flow:
- merge to `master`
- tag `vX.Y.Z`
- CI runs release-check
- only after pass: create GitHub release notes

Do not automate GitHub release creation unless user requests.

## Safety rules
- Never create tags or releases automatically without explicit user instruction.
- Never rewrite tags.

## Output format
- Workflow file created
- Trigger behavior explained
- How to test with a dry-run tag (locally)
