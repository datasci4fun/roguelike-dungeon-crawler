---
name: redundancy-audit
description: Deterministically detects redundancy (exact dupes, token clones, AST subtree clones) in Python + TypeScript repos and outputs a ranked JSON report with file spans. Use when asked to find duplication, redundancy, copy/paste, clones, or refactor opportunities.
---

You are running inside a git repository using Claude Code. This Skill provides a deterministic redundancy analysis pipeline for Python + TypeScript.

Hard constraints:
- Deterministic: no embeddings/LLMs for detection, no fuzzy similarity. Only exact matches under explicit normalization rules.
- Programmatic: run the bundled scripts; do not “eyeball” similarity.
- Output must be reproducible given the same repo state and tool versions.

When invoked:
1. Confirm repository root: `git rev-parse --show-toplevel`
2. Run the Skill driver:
   - `bash .claude/skills/redundancy-audit/run.sh`
3. Summarize results from:
   - `.claude/skills/redundancy-audit/out/report.json`
   - Provide:
     - Top 10 clone clusters by estimated savings
     - Paths + line ranges per occurrence
     - Notes on whether they are Type-1 (format/comment only) or Type-2 (identifier/literal normalized)
4. If report is empty or tiny, suggest lowering thresholds in `config.json`.

Rules for interacting with the repo:
- Never modify tracked files.
- Write outputs only under `.claude/skills/redundancy-audit/out/`.
- Skip generated/vendor directories per config.
- If dependencies are missing, install only in the Skill folder (local node_modules), never at repo root.

Artifacts:
- `out/report.json` is canonical.
- Optional: produce `out/report.md` and `out/report.html` if asked.
