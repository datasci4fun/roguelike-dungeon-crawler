from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
from typing import List
import yaml

@dataclass
class BotLabels:
    reported: str
    queued: str
    in_progress: str
    pr_open: str
    ready_to_merge: str
    verified: str
    blocked: str
    automerge: str

@dataclass
class BotConfig:
    default_branch: str
    scan_paths: List[str]
    max_new_issues_per_run: int
    commands_smoke: List[str]
    commands_verify: List[str]
    labels: BotLabels

def load_config(repo_root: Path) -> BotConfig:
    cfg_path = repo_root / ".claude" / "bot-config.yml"
    if not cfg_path.exists():
        example = repo_root / ".claude" / "bot-config.example.yml"
        raise FileNotFoundError(f"Missing {cfg_path}. Copy from {example} and edit.")

    raw = yaml.safe_load(cfg_path.read_text(encoding="utf-8")) or {}
    bot = raw.get("bot", {}) or {}

    labels_raw = bot.get("labels", {}) or {}
    labels = BotLabels(
        reported=labels_raw.get("reported","bot:reported"),
        queued=labels_raw.get("queued","bot:queued"),
        in_progress=labels_raw.get("in_progress","bot:in-progress"),
        pr_open=labels_raw.get("pr_open","bot:pr-open"),
        ready_to_merge=labels_raw.get("ready_to_merge","bot:ready-to-merge"),
        verified=labels_raw.get("verified","bot:verified"),
        blocked=labels_raw.get("blocked","bot:blocked"),
        automerge=labels_raw.get("automerge","bot:automerge"),
    )

    commands = bot.get("commands", {}) or {}
    return BotConfig(
        default_branch=bot.get("default_branch","main"),
        scan_paths=list(bot.get("scan_paths", ["src"]) or ["src"]),
        max_new_issues_per_run=int(bot.get("max_new_issues_per_run", 20)),
        commands_smoke=list(commands.get("smoke", []) or []),
        commands_verify=list(commands.get("verify", []) or []),
        labels=labels,
    )
