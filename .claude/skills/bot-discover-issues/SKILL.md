---
name: bot-discover-issues
description: Scan the repo (or a scope) and output a structured list of actionable issues to file as tickets.
argument-hint: "[optional-scope-path]"
disable-model-invocation: true
allowed-tools: Read, Grep, Glob, Bash(./scripts/claude-bot/run_signals.sh:*)
---

# Discover issues in a repo scope

**Arguments:** `$ARGUMENTS` (optional path scope). If omitted, use the repo's configured scan paths.

## Goal

Produce a JSON object that matches `schemas/issues.schema.json` containing an array of issues.

## Requirements

For each issue:
- Must be **actionable**
- Must include **evidence** (file paths + lines / symbols / concrete symptoms)
- Must propose a **specific fix strategy**
- Must be categorized:
  - `type`: bug|security|performance|refactor|docs|test|ci|deps
  - `severity`: critical|high|medium|low

## Process

1. Run signals collection:
   - `./scripts/claude-bot/run_signals.sh`
2. Inspect the configured scan paths (or `$ARGUMENTS` scope).
3. Identify issues across:
   - correctness, security, data races, error handling
   - tests and CI reliability
   - performance footguns
   - maintainability / complexity hot spots
4. Output issues in schema form.

## Supporting files

- Schema: `schemas/issues.schema.json`
- Issue body template: `templates/issue_body.md`
