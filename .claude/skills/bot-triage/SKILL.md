---
name: bot-triage
description: Label taxonomy and triage rules used by the repo bot.
disable-model-invocation: false
user-invocable: true
---

# Bot triage taxonomy

## Type labels
- `type:bug`
- `type:security`
- `type:performance`
- `type:refactor`
- `type:docs`
- `type:test`
- `type:ci`
- `type:deps`

## Severity labels
- `sev:critical`
- `sev:high`
- `sev:medium`
- `sev:low`

## State labels
- `bot:reported`
- `bot:queued`
- `bot:in-progress`
- `bot:fixed-pending-verify`
- `bot:verified`
- `bot:blocked`

## Queueing rules

Queue automatically (`bot:queued`) **only if**:
- fix is low-risk and local
- there is evidence + an expected validation step

Otherwise mark `bot:blocked` with a clear request.

## Dedupe rules

If a newly discovered issue matches an existing fingerprint marker:
- update the existing issue body (append new evidence)
- add a comment with a timestamped update


## PR labels
- `bot:pr-open`
- `bot:ready-to-merge`
- `bot:automerge` (opt-in to allow CI to auto-merge)
