---
name: bot-policy
description: Guardrails for repo automation: safety, idempotence, and escalation rules.
user-invocable: false
disable-model-invocation: false
---

# Repo Bot Policy (read-only)

You are operating inside a Git repository with automation that can file issues, propose fixes, and run verification.

## Non-negotiables

- **Never exfiltrate secrets**. Treat `.env*`, credentials files, tokens, keys, and CI secrets as sensitive and do not quote them.
- **Be idempotent**. Prefer updating existing artifacts over creating duplicates.
- **Prefer minimal diffs**. Small, localized changes; no drive-by refactors.
- **Escalate when uncertain**. If you cannot reproduce, cannot prove correctness, or fixes are risky, label as blocked and ask for human input.

## Ticket semantics

- `bot:queued` = safe/clear enough to attempt a fix automatically.
- `bot:blocked` = needs human decision, missing reproduction, or risky change.
- `bot:fixed-pending-verify` = fix committed; waiting for verify stage.
- `bot:verified` = post-verify confirmed.

This policy applies across all other bot skills.
