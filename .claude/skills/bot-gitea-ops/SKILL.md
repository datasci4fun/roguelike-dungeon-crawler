---
name: bot-gitea-ops
description: Reference for how the bot interacts with Gitea (labels, issues, secrets, comments).
disable-model-invocation: false
user-invocable: true
---

# Gitea Ops Reference

The automation scripts use the Gitea REST API to:
- create/update labels
- create/update issues
- add comments
- set repository Actions secrets

See `scripts/claude-bot/bot.py` and `scripts/claude-bot/gitea_client.py` for implementation.
