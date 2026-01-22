from __future__ import annotations

import os, re, subprocess, json, hashlib
from dataclasses import dataclass
from pathlib import Path
from typing import Dict, Any, Optional, Tuple

def die(msg: str) -> None:
    raise SystemExit(msg)

def sh(cmd: list[str], *, cwd: Optional[str]=None, env: Optional[Dict[str,str]]=None, check: bool=True, capture: bool=True) -> subprocess.CompletedProcess:
    return subprocess.run(cmd, cwd=cwd, env=env, check=check,
                          text=True, capture_output=capture)

def repo_root() -> Path:
    cp = sh(["git", "rev-parse", "--show-toplevel"])
    return Path(cp.stdout.strip())

def parse_git_remote(url: str) -> Tuple[str,str,str]:
    # returns (base_url, owner, repo)
    # Supports:
    # - https://host/owner/repo(.git)
    # - http://host/owner/repo(.git)
    # - ssh://git@host/owner/repo(.git)
    # - git@host:owner/repo(.git)
    u = url.strip()

    # normalize ssh scp-like to ssh://
    m = re.match(r"^(?P<user>[^@]+)@(?P<host>[^:]+):(?P<path>.+)$", u)
    if m:
        host = m.group("host")
        path = m.group("path")
        base = f"https://{host}"
        parts = path.split("/")
        if len(parts) < 2:
            raise ValueError(f"Cannot parse remote: {url}")
        owner, repo = parts[0], parts[1]
        repo = repo[:-4] if repo.endswith(".git") else repo
        return base, owner, repo

    m = re.match(r"^(?P<scheme>https?)://(?P<host>[^/]+)/(?P<owner>[^/]+)/(?P<repo>[^/]+?)(?:\.git)?$", u)
    if m:
        base = f"{m.group('scheme')}://{m.group('host')}"
        owner = m.group("owner")
        repo = m.group("repo")
        repo = repo[:-4] if repo.endswith(".git") else repo
        return base, owner, repo

    m = re.match(r"^ssh://(?:(?P<user>[^@]+)@)?(?P<host>[^/]+)/(?P<owner>[^/]+)/(?P<repo>[^/]+?)(?:\.git)?$", u)
    if m:
        base = f"https://{m.group('host')}"  # default; override via env if needed
        owner = m.group("owner")
        repo = m.group("repo")
        repo = repo[:-4] if repo.endswith(".git") else repo
        return base, owner, repo

    raise ValueError(f"Unsupported git remote URL format: {url}")

def fingerprint_issue(title: str, typ: str, severity: str, paths: list[str]) -> str:
    payload = {"title": title.strip().lower(), "type": typ, "severity": severity, "paths": sorted([p.strip() for p in paths])}
    h = hashlib.sha1(json.dumps(payload, sort_keys=True).encode("utf-8")).hexdigest()
    return h

FINGERPRINT_RE = re.compile(r"<!--\s*claude-bot:fingerprint:\s*([a-f0-9]{40})\s*-->")

def extract_fingerprint(body: str) -> Optional[str]:
    m = FINGERPRINT_RE.search(body or "")
    return m.group(1) if m else None

def ensure_git_identity() -> None:
    # Ensure commits succeed in CI.
    try:
        sh(["git","config","user.email"], check=True)
    except Exception:
        sh(["git","config","user.email","claude-bot@local"], check=True)
    try:
        sh(["git","config","user.name"], check=True)
    except Exception:
        sh(["git","config","user.name","claude-bot"], check=True)

def set_push_remote_with_token(base_url: str, owner: str, repo: str, username: str, token: str) -> None:
    # Use basic auth with PAT: https://user:token@host/owner/repo.git
    host = re.sub(r"^https?://", "", base_url.rstrip("/"))
    remote = f"https://{username}:{token}@{host}/{owner}/{repo}.git"
    sh(["git","remote","set-url","origin",remote], check=True)
