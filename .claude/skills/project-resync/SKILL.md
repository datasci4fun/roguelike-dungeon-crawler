---
name: project-resync
description: Synchronizes the current git project with its remote state by fetching branches and tags, checking local divergence, and interactively resolving unpushed or conflicting changes.
---

## Purpose

This Skill is used when the user asks to **resync**, **realign**, or **synchronize** the current project repository.

Examples of trigger phrases:
- “resync current project”
- “make sure this repo is aligned”
- “sync branches and tags”
- “get this repo up to date”
- “check if I’m out of sync”

The goal is to ensure the local working copy accurately reflects the remote repository while **preserving intentional local work**.

---

## Preconditions

Before running this Skill:

1. Confirm the working directory is inside a git repository.
2. Determine the active repository root.
3. Identify:
   - current branch
   - default branch (usually `develop` or `master`)
   - remote name (usually `origin`)

If the repository is not clean, proceed cautiously.

---

## Procedure

### Step 1: Inspect Current State

Run the following checks:

- `git status`
- `git branch --show-current`
- `git remote -v`
- `git log -5 --oneline --decorate`
- `git describe --tags --dirty --always`

Summarize:
- current branch
- whether the working tree is clean
- whether the branch is ahead/behind its upstream
- most recent tag

---

### Step 2: Fetch Remote State (Non-Destructive)

Always fetch before making decisions:

- `git fetch --all`
- `git fetch --tags`

Do **not** pull or reset yet.

---

### Step 3: Detect Divergence

Check for differences between local and remote:

- Compare local branch vs upstream:
  - ahead / behind / diverged
- Detect local commits not present on remote.
- Detect remote commits not present locally.
- Detect untracked or modified files.

---

### Step 4: Interactive Resolution

If **no divergence**:
- Confirm repository is fully synced.
- Stop.

If **local changes exist**, classify them:

#### A) Uncommitted changes
Explain:
- number of files
- approximate scope (small config vs many files)

Ask the user:
> Do you want to keep these changes, discard them, or review diffs?

Offer options:
- stash
- commit
- discard
- inspect diff

#### B) Local commits not pushed
Explain:
- number of commits
- commit messages

Ask:
> Are these commits intentional?

If unclear, show:
- `git log origin/<branch>..HEAD --oneline`

#### C) Remote commits not pulled
Explain:
- how many commits behind
- whether fast-forward is possible

Ask before pulling if not fast-forward.

---

### Step 5: Apply Chosen Sync Strategy

Only proceed after explicit confirmation.

Possible actions:
- fast-forward pull
- rebase
- merge
- reset hard (only if explicitly approved)
- stash → pull → reapply stash

Never destroy commits without confirmation.

---

### Step 6: Final Verification

After changes:

- `git status`
- `git log -5 --oneline --decorate`
- `git describe --tags`

Confirm:
- branch alignment
- tag visibility
- clean working tree (or intentional changes)

---

## Output

End with a concise summary:

- active branch
- sync status
- remaining local changes (if any)
- recommended next step (if applicable)

---

## Safety Rules

- Never run `git reset --hard` or delete branches without explicit user approval.
- Never assume local commits are disposable.
- Always explain what will happen before executing destructive commands.
- Prefer inspection and confirmation over automation when uncertain.

---

## Example Interaction

**User:**  
“resync current project”

**Claude:**  
“Your branch `develop` is 3 commits behind `origin/develop` and has 1 local commit not pushed.  
Would you like to:
1) push your local commit  
2) rebase it on top of origin  
3) inspect the diff  
4) abort”

---

## Scope

This Skill operates on **one repository at a time** and does not modify other projects or global git settings.
