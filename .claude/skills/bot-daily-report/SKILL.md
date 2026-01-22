---
name: bot-daily-report
description: Summarize today's bot activity (issues created, fixes committed, verifies).
disable-model-invocation: true
allowed-tools: Bash(git log:*), Read
---

# Daily report

Generate a concise report of:
- issues created/updated today
- issues fixed (commits)
- verify status

Use this to post a daily status update (optional).
