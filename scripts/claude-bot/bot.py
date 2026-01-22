#!/usr/bin/env python3
from __future__ import annotations

import argparse, json, os, sys, datetime, fnmatch, re
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

from config import load_config, BotConfig
from github_client import GitHubClient, RepoRef, GitHubError
from utils import (
    repo_root, sh, die, parse_git_remote, fingerprint_issue, extract_fingerprint,
    ensure_git_identity
)
from claude_runner import run_claude, ClaudeError

# -------------------------
# Labels used by the bot
# -------------------------

LABEL_SETS = {
    # state machine
    "bot:reported": "2f81f7",
    "bot:queued": "0e8a16",
    "bot:in-progress": "fbca04",
    "bot:pr-open": "cfd3d7",
    "bot:ready-to-merge": "0e8a16",
    "bot:verified": "1d76db",
    "bot:blocked": "b60205",
    "bot:automerge": "5319e7",

    # types
    "type:bug": "d73a4a",
    "type:security": "b60205",
    "type:performance": "1d76db",
    "type:refactor": "cfd3d7",
    "type:docs": "0075ca",
    "type:test": "a2eeef",
    "type:ci": "5319e7",
    "type:deps": "0366d6",

    # severities
    "sev:critical": "b60205",
    "sev:high": "d93f0b",
    "sev:medium": "fbca04",
    "sev:low": "0e8a16",
}

TYPE_TO_LABEL = {
    "bug": "type:bug",
    "security": "type:security",
    "performance": "type:performance",
    "refactor": "type:refactor",
    "docs": "type:docs",
    "test": "type:test",
    "ci": "type:ci",
    "deps": "type:deps",
}
SEV_TO_LABEL = {
    "critical": "sev:critical",
    "high": "sev:high",
    "medium": "sev:medium",
    "low": "sev:low",
}

CLOSE_ISSUE_RE = re.compile(r"(?i)\bfixes\s+#(\d+)\b|\bcloses\s+#(\d+)\b|\bresolves\s+#(\d+)\b")

# -------------------------
# Helpers
# -------------------------

def infer_repo_ref(args_owner: Optional[str], args_repo: Optional[str], args_base_url: Optional[str]) -> RepoRef:
    base_url = args_base_url or os.environ.get("GITHUB_BASE_URL")  # web base (https://github.com or GHES host)
    owner = args_owner or os.environ.get("GITHUB_OWNER")
    repo = args_repo or os.environ.get("GITHUB_REPO")

    if base_url and owner and repo:
        return RepoRef(base_url=base_url, owner=owner, repo=repo)

    # infer from git remote
    remote = sh(["git","remote","get-url","origin"]).stdout.strip()
    base, o, r = parse_git_remote(remote)
    return RepoRef(base_url=base_url or base, owner=owner or o, repo=repo or r)

def require_token(token: Optional[str]) -> str:
    t = token or os.environ.get("GITHUB_TOKEN")
    if not t:
        die("Missing GitHub token. In GitHub Actions, GITHUB_TOKEN is provided automatically. Otherwise set GITHUB_TOKEN.")
    return t

def ensure_labels(client: GitHubClient) -> None:
    # List labels; create missing.
    existing = client.get_json(f"/repos/{client.repo.owner}/{client.repo.repo}/labels", params={"per_page": 100, "page": 1}) or []
    have = {l["name"] for l in existing}
    for name, color in LABEL_SETS.items():
        if name in have:
            continue
        try:
            client.post_json(f"/repos/{client.repo.owner}/{client.repo.repo}/labels", {"name": name, "color": color})
            print(f"Created label: {name}")
        except Exception as e:
            print(f"Warn: could not create label {name}: {e}")

def list_issues(client: GitHubClient, *, state: str="open", labels: Optional[List[str]]=None, limit: int=100) -> List[Dict[str,Any]]:
    out: List[Dict[str,Any]] = []
    page = 1
    while True:
        params: Dict[str,Any] = {"state": state, "per_page": limit, "page": page}
        if labels:
            params["labels"] = ",".join(labels)
        batch = client.get_json(f"/repos/{client.repo.owner}/{client.repo.repo}/issues", params=params) or []
        # GitHub issues endpoint returns PRs too; filter by missing 'pull_request' key.
        batch = [i for i in batch if "pull_request" not in i]
        if not batch:
            break
        out.extend(batch)
        page += 1
    return out

def list_pull_requests(client: GitHubClient, *, state: str="open", limit: int=100) -> List[Dict[str,Any]]:
    out: List[Dict[str,Any]] = []
    page = 1
    while True:
        params: Dict[str,Any] = {"state": state, "per_page": limit, "page": page}
        batch = client.get_json(f"/repos/{client.repo.owner}/{client.repo.repo}/pulls", params=params) or []
        if not batch:
            break
        out.extend(batch)
        page += 1
    return out

def get_pull_request(client: GitHubClient, pr_number: int) -> Dict[str,Any]:
    return client.get_json(f"/repos/{client.repo.owner}/{client.repo.repo}/pulls/{pr_number}")

def get_issue(client: GitHubClient, number: int) -> Dict[str,Any]:
    return client.get_json(f"/repos/{client.repo.owner}/{client.repo.repo}/issues/{number}")

def create_pull_request(client: GitHubClient, *, head: str, base: str, title: str, body: str) -> Dict[str,Any]:
    return client.post_json(f"/repos/{client.repo.owner}/{client.repo.repo}/pulls", {"head": head, "base": base, "title": title, "body": body})

def merge_pull_request(client: GitHubClient, pr_number: int, *, merge_method: str, sha: Optional[str]=None) -> Dict[str,Any]:
    body: Dict[str,Any] = {"merge_method": merge_method}
    if sha:
        body["sha"] = sha
    return client.put_json(f"/repos/{client.repo.owner}/{client.repo.repo}/pulls/{pr_number}/merge", body)

def comment_issue(client: GitHubClient, issue_number: int, body: str) -> None:
    client.post_json(f"/repos/{client.repo.owner}/{client.repo.repo}/issues/{issue_number}/comments", {"body": body})

def patch_issue(client: GitHubClient, issue_number: int, *, title: Optional[str]=None, body: Optional[str]=None, labels: Optional[List[str]]=None) -> None:
    payload: Dict[str,Any] = {}
    if title is not None:
        payload["title"] = title
    if body is not None:
        payload["body"] = body
    if labels is not None:
        payload["labels"] = labels
    if payload:
        client.patch_json(f"/repos/{client.repo.owner}/{client.repo.repo}/issues/{issue_number}", payload)

def create_or_update_issue(client: GitHubClient, *, title: str, body: str, labels: List[str], fingerprint: str) -> Tuple[int, bool]:
    # Dedupe within open bot:reported issues by fingerprint marker in body
    existing = list_issues(client, state="open", labels=["bot:reported"])
    for iss in existing:
        fp = extract_fingerprint(iss.get("body") or "")
        if fp == fingerprint:
            num = int(iss["number"])
            patch_issue(client, num, title=title, body=body, labels=labels)
            comment_issue(client, num, f"claude-bot update: fingerprint `{fingerprint}` refreshed at {datetime.datetime.utcnow().isoformat()}Z")
            return num, False

    created = client.post_json(f"/repos/{client.repo.owner}/{client.repo.repo}/issues", {"title": title, "body": body, "labels": labels})
    return int(created["number"]), True

# -------------------------
# Commands: run smoke/verify
# -------------------------

def run_commands(kind: str, cfg: BotConfig) -> int:
    cmds = cfg.commands_smoke if kind == "smoke" else cfg.commands_verify
    if cmds:
        print(f"Running configured {kind} commands:")
        for c in cmds:
            print(f"  $ {c}")
            cp = sh(["bash","-lc",c], check=False, capture=True)
            sys.stdout.write(cp.stdout)
            sys.stderr.write(cp.stderr)
            if cp.returncode != 0:
                print(f"{kind} failed: {c} (rc={cp.returncode})")
                return cp.returncode
        return 0

    print(f"No configured {kind} commands; attempting autodetect.")
    candidates: List[str] = []
    rr = repo_root()
    if (rr/"package.json").exists():
        candidates.append("npm test")
    if (rr/"pyproject.toml").exists() or (rr/"pytest.ini").exists() or (rr/"setup.py").exists():
        candidates.append("pytest -q")
    if (rr/"go.mod").exists():
        candidates.append("go test ./...")
    if (rr/"Cargo.toml").exists():
        candidates.append("cargo test")
    if (rr/"Makefile").exists():
        candidates.append("make test")
    if kind == "smoke":
        candidates = candidates[:1] if candidates else []

    if not candidates:
        print(f"No autodetected {kind} commands. Treating as success.")
        return 0

    for c in candidates:
        print(f"  $ {c}")
        cp = sh(["bash","-lc",c], check=False, capture=True)
        sys.stdout.write(cp.stdout)
        sys.stderr.write(cp.stderr)
        if cp.returncode != 0:
            print(f"{kind} failed: {c} (rc={cp.returncode})")
            return cp.returncode
    return 0

# -------------------------
# Discovery
# -------------------------

def load_issue_schema(rr: Path) -> Dict[str,Any]:
    schema_path = rr/".claude/skills/bot-discover-issues/schemas/issues.schema.json"
    return json.loads(schema_path.read_text(encoding="utf-8"))

def build_discover_prompt(cfg: BotConfig) -> str:
    scan = ", ".join(cfg.scan_paths)
    return f'''You are a repository analysis agent.

Analyze ONLY these scan paths: {scan}.

1) Run ./scripts/claude-bot/run_signals.sh and consider its output.
2) Inspect the code in the scan paths.
3) Output a JSON object matching the provided JSON schema under key "issues".

Hard constraints:
- Each issue must include evidence (file paths + concrete facts).
- Prefer fewer, higher-signal issues (max {cfg.max_new_issues_per_run}).
- Avoid trivial style-only nits unless they create real defects.
'''

def cmd_discover(args: argparse.Namespace) -> None:
    rr = repo_root()
    cfg = load_config(rr)
    repo = infer_repo_ref(args.owner, args.repo, args.base_url)
    token = require_token(args.token)
    client = GitHubClient(repo, token=token)
    ensure_labels(client)

    schema = load_issue_schema(rr)
    allowed = "Read,Grep,Glob,Bash(./scripts/claude-bot/run_signals.sh:*)"
    prompt = build_discover_prompt(cfg)

    try:
        res = run_claude(prompt, allowed_tools=allowed, json_schema=schema, max_turns=int(args.max_turns))
        structured = res.get("structured_output") or {}
        issues = structured.get("issues") or []
    except ClaudeError as e:
        die(str(e))

    if not isinstance(issues, list):
        die(f"Claude returned unexpected issues payload: {type(issues)}")

    issues = issues[: cfg.max_new_issues_per_run]
    template_path = rr/".claude/skills/bot-discover-issues/templates/issue_body.md"
    template = template_path.read_text(encoding="utf-8")

    created, updated = 0, 0
    for it in issues:
        title = it["title"].strip()
        typ = it["type"]
        sev = it["severity"]
        paths = it.get("paths") or []
        fp = fingerprint_issue(title, typ, sev, paths)

        evidence = "\n".join([f"- {e}" for e in (it.get("evidence") or [])])
        repro = "\n".join([f"- {e}" for e in (it.get("repro") or [])]) or "- (none provided)"
        body = template
        body = body.replace("{{FINGERPRINT}}", fp)
        body = body.replace("{{SUMMARY}}", it["description"].strip())
        body = body.replace("{{EVIDENCE}}", evidence)
        body = body.replace("{{SUGGESTED_FIX}}", it["suggested_fix"].strip())
        body = body.replace("{{REPRO}}", repro)
        body = body.replace("{{TYPE}}", typ)
        body = body.replace("{{SEVERITY}}", sev)
        body = body.replace("{{CONFIDENCE}}", str(it.get("confidence", 0.5)))
        body = body.replace("{{PATHS}}", ", ".join(paths) if paths else "(none)")

        labels = [
            "bot:reported",
            "bot:queued",
            TYPE_TO_LABEL.get(typ, "type:bug"),
            SEV_TO_LABEL.get(sev, "sev:medium"),
        ]
        num, was_created = create_or_update_issue(client, title=title, body=body, labels=labels, fingerprint=fp)
        if was_created:
            created += 1
            print(f"Created issue #{num}: {title}")
        else:
            updated += 1
            print(f"Updated issue #{num}: {title}")

    print(json.dumps({"created": created, "updated": updated, "total": len(issues)}, indent=2))

# -------------------------
# Fix -> PR
# -------------------------

def infer_type_from_labels(issue: Dict[str,Any]) -> str:
    labs = [l.get("name","") for l in (issue.get("labels") or [])]
    for t, lab in TYPE_TO_LABEL.items():
        if lab in labs:
            return t
    return "bug"

def infer_sev_label(issue: Dict[str,Any]) -> str:
    labs = [l.get("name","") for l in (issue.get("labels") or [])]
    for lab in SEV_TO_LABEL.values():
        if lab in labs:
            return lab
    return "sev:medium"

def extract_type_sev_labels(issue: Dict[str,Any]) -> List[str]:
    labs = [l.get("name","") for l in (issue.get("labels") or [])]
    keep: List[str] = []
    for n in labs:
        if n.startswith("type:") or n.startswith("sev:"):
            keep.append(n)
    out: List[str] = []
    for n in keep:
        if n not in out:
            out.append(n)
    return out

def slugify(s: str, max_len: int=32) -> str:
    s = s.lower()
    s = re.sub(r"[^a-z0-9]+", "-", s).strip("-")
    return s[:max_len] if len(s) > max_len else s

def _load_yaml_cfg(rr: Path) -> Dict[str,Any]:
    import yaml
    return yaml.safe_load((rr/".claude/bot-config.yml").read_text(encoding="utf-8")) or {}

def _safety_cfg(rr: Path) -> Tuple[int, List[str]]:
    raw = _load_yaml_cfg(rr)
    safety = ((raw.get("bot", {}) or {}).get("safety", {}) or {})
    max_lines = int(safety.get("max_changed_lines", 400))
    globs = list(safety.get("disallowed_globs", []) or [])
    return max_lines, globs

def _pr_cfg(rr: Path) -> Dict[str,Any]:
    raw = _load_yaml_cfg(rr)
    return ((raw.get("bot", {}) or {}).get("pr", {}) or {})

def is_disallowed(path: str, disallowed_globs: List[str]) -> bool:
    for g in disallowed_globs:
        if fnmatch.fnmatch(path, g):
            return True
    return False

def paths_within_allowed(scan_paths: List[str], changed_files: List[str]) -> Tuple[bool, str]:
    allowed = [p.rstrip("/") + "/" for p in scan_paths]
    for f in changed_files:
        f2 = f[2:] if f.startswith("./") else f
        if any(f2 == p.rstrip("/") for p in scan_paths):
            continue
        if any(f2.startswith(pref) for pref in allowed):
            continue
        return False, f"Changed file outside allowed scan_paths: {f2}"
    return True, ""

def compute_changed_lines(numstat_lines: List[str]) -> Tuple[int, Optional[str]]:
    total = 0
    for line in numstat_lines:
        parts = line.split("\t")
        if len(parts) < 3:
            continue
        a, d, path = parts[0], parts[1], parts[2]
        if a == "-" or d == "-":
            return total, f"Binary or non-text diff detected for {path} (numstat has '-')"
        try:
            total += int(a) + int(d)
        except ValueError:
            pass
    return total, None

def find_existing_pr_for_branch(client: GitHubClient, head_branch: str) -> Optional[Dict[str,Any]]:
    prs = list_pull_requests(client, state="open")
    for pr in prs:
        head = ((pr.get("head") or {}).get("ref")) or ""
        if head == head_branch:
            return pr
    return None

def cmd_fix(args: argparse.Namespace) -> None:
    rr = repo_root()
    cfg = load_config(rr)
    repo = infer_repo_ref(args.owner, args.repo, args.base_url)
    token = require_token(args.token)
    client = GitHubClient(repo, token=token)
    ensure_labels(client)

    issues = list_issues(client, state="open", labels=[cfg.labels.queued])
    if args.issue != "all":
        target = int(args.issue)
        issues = [i for i in issues if int(i["number"]) == target]

    if not issues:
        print("No queued issues to fix.")
        return

    ensure_git_identity()

    default_branch = cfg.default_branch
    sh(["git","fetch","origin",default_branch], check=False)
    sh(["git","checkout",default_branch], check=True)
    sh(["git","reset","--hard",f"origin/{default_branch}"], check=False)

    max_changed_lines, disallowed_globs = _safety_cfg(rr)

    allowed_tools = "Read,Edit,Grep,Glob,Bash(./scripts/claude-bot/run_smoke.sh:*),Bash(git diff:*),Bash(git status:*),Bash(git restore:*),Bash(git checkout:*),Bash(git add:*),Bash(git reset:*),Bash(git grep:*)"

    opened: List[Dict[str,Any]] = []

    for iss in issues:
        num = int(iss["number"])
        full = get_issue(client, num)
        title = full.get("title","").strip()
        body = full.get("body","")

        print(f"--- Fixing issue #{num}: {title}")

        typ = infer_type_from_labels(full)
        sev_label = infer_sev_label(full)

        patch_issue(client, num, labels=[
            cfg.labels.reported,
            cfg.labels.in_progress,
            TYPE_TO_LABEL.get(typ, "type:bug"),
            sev_label,
        ])

        branch = f"bot/issue-{num}-{slugify(title)}"
        sh(["git","checkout","-B",branch,f"origin/{default_branch}"], check=True)

        prompt = f'''You are an autonomous coding agent.

Task: Fix GitHub issue #{num}: {title}

Issue body:
{body}

Rules:
- Make the minimal safe code changes to resolve the issue.
- Do NOT commit, do NOT push, do NOT open/merge PRs, do NOT close the issue.
- Run: ./scripts/claude-bot/run_smoke.sh (must pass).
- If you cannot fix safely, stop and explain what blocks you.
'''

        try:
            _ = run_claude(prompt, allowed_tools=allowed_tools, json_schema=None, max_turns=int(args.max_turns))
        except ClaudeError as e:
            comment_issue(client, num, f"claude-bot failed while attempting fix:\n\n```\n{e}\n```")
            patch_issue(client, num, labels=[cfg.labels.reported, cfg.labels.blocked] + extract_type_sev_labels(full))
            sh(["git","checkout",default_branch], check=False)
            sh(["git","reset","--hard",f"origin/{default_branch}"], check=False)
            continue

        st = sh(["git","status","--porcelain"]).stdout.strip()
        if not st:
            comment_issue(client, num, "claude-bot: no working tree changes produced. Marking as blocked.")
            patch_issue(client, num, labels=[cfg.labels.reported, cfg.labels.blocked] + extract_type_sev_labels(full))
            sh(["git","checkout",default_branch], check=False)
            sh(["git","reset","--hard",f"origin/{default_branch}"], check=False)
            continue

        rc = run_commands("smoke", cfg)
        if rc != 0:
            comment_issue(client, num, f"claude-bot: smoke checks failed (rc={rc}). Marking as blocked.")
            patch_issue(client, num, labels=[cfg.labels.reported, cfg.labels.blocked] + extract_type_sev_labels(full))
            sh(["git","reset","--hard",f"origin/{default_branch}"], check=False)
            sh(["git","checkout",default_branch], check=False)
            continue

        changed_files = [ln.strip() for ln in sh(["git","diff","--name-only"]).stdout.splitlines() if ln.strip()]
        ok, msg = paths_within_allowed(cfg.scan_paths, changed_files)
        if not ok:
            comment_issue(client, num, f"claude-bot: refusing PR. {msg}")
            patch_issue(client, num, labels=[cfg.labels.reported, cfg.labels.blocked] + extract_type_sev_labels(full))
            sh(["git","reset","--hard",f"origin/{default_branch}"], check=False)
            sh(["git","checkout",default_branch], check=False)
            continue

        blocked = False
        for f in changed_files:
            if is_disallowed(f, disallowed_globs):
                comment_issue(client, num, f"claude-bot: refusing PR. Diff touches disallowed path: `{f}`")
                patch_issue(client, num, labels=[cfg.labels.reported, cfg.labels.blocked] + extract_type_sev_labels(full))
                sh(["git","reset","--hard",f"origin/{default_branch}"], check=False)
                sh(["git","checkout",default_branch], check=False)
                blocked = True
                break
        if blocked:
            continue

        numstat = [ln for ln in sh(["git","diff","--numstat"]).stdout.splitlines() if ln.strip()]
        total_lines, err = compute_changed_lines(numstat)
        if err:
            comment_issue(client, num, f"claude-bot: refusing PR. {err}")
            patch_issue(client, num, labels=[cfg.labels.reported, cfg.labels.blocked] + extract_type_sev_labels(full))
            sh(["git","reset","--hard",f"origin/{default_branch}"], check=False)
            sh(["git","checkout",default_branch], check=False)
            continue
        if total_lines > max_changed_lines:
            comment_issue(client, num, f"claude-bot: refusing PR. Diff too large: {total_lines} changed lines > {max_changed_lines} cap.")
            patch_issue(client, num, labels=[cfg.labels.reported, cfg.labels.blocked] + extract_type_sev_labels(full))
            sh(["git","reset","--hard",f"origin/{default_branch}"], check=False)
            sh(["git","checkout",default_branch], check=False)
            continue

        sh(["git","add","-A"], check=True)
        commit_msg = f"fix: {title} (refs #{num})"
        sh(["git","commit","-m",commit_msg], check=True)
        sha = sh(["git","rev-parse","HEAD"]).stdout.strip()
        print(f"Committed {sha} on {branch} for issue #{num}")

        push = sh(["git","push","-u","origin",branch], check=False)
        if push.returncode != 0:
            comment_issue(client, num, f"claude-bot: commit {sha} created but push failed. Manual intervention required.")
            patch_issue(client, num, labels=[cfg.labels.reported, cfg.labels.blocked] + extract_type_sev_labels(full))
            sh(["git","checkout",default_branch], check=False)
            sh(["git","reset","--hard",f"origin/{default_branch}"], check=False)
            continue

        existing_pr = find_existing_pr_for_branch(client, branch)
        pr = None
        if existing_pr:
            pr = existing_pr
            pr_num = int(pr["number"])
        else:
            pr_body = f'''<!-- claude-bot:issue:{num} -->
{title}

Fix commit: {sha}

Fixes #{num}
'''
            try:
                pr = create_pull_request(client, head=branch, base=default_branch, title=f"[bot] {title}", body=pr_body)
                pr_num = int(pr["number"])
            except GitHubError as e:
                pr2 = find_existing_pr_for_branch(client, branch)
                if pr2:
                    pr = pr2
                    pr_num = int(pr["number"])
                else:
                    comment_issue(client, num, f"claude-bot: failed to create PR for branch `{branch}`.\n\n```\n{e}\n```")
                    patch_issue(client, num, labels=[cfg.labels.reported, cfg.labels.blocked] + extract_type_sev_labels(full))
                    sh(["git","checkout",default_branch], check=False)
                    sh(["git","reset","--hard",f"origin/{default_branch}"], check=False)
                    continue

        pr_url = pr.get("html_url") or ""
        comment_issue(client, num, f"<!-- claude-bot:pr:{pr_num} -->\nclaude-bot: opened PR #{pr_num} for `{branch}`.\n\n{pr_url}")
        patch_issue(client, num, labels=[cfg.labels.reported, cfg.labels.pr_open] + extract_type_sev_labels(full))

        opened.append({"issue": num, "branch": branch, "commit": sha, "pr": pr_num, "url": pr_url})

        sh(["git","checkout",default_branch], check=False)
        sh(["git","reset","--hard",f"origin/{default_branch}"], check=False)

    print(json.dumps({"opened_prs": opened, "count": len(opened)}, indent=2))

# -------------------------
# PR CI Finalize: mark ready / auto-merge
# -------------------------

def parse_issue_number_from_pr(pr: Dict[str,Any]) -> Optional[int]:
    body = pr.get("body") or ""
    m = re.search(r"<!--\s*claude-bot:issue:(\d+)\s*-->", body)
    if m:
        return int(m.group(1))
    m2 = CLOSE_ISSUE_RE.search(body)
    if m2:
        for g in m2.groups():
            if g:
                return int(g)
    return None

def pr_has_label(client: GitHubClient, pr_number: int, label_name: str) -> bool:
    # Labels for PRs are managed via the issues API on GitHub.
    issue = get_issue(client, pr_number)
    labs = issue.get("labels") or []
    return any((l.get("name") == label_name) for l in labs)

def cmd_pr_ci_success(args: argparse.Namespace) -> None:
    rr = repo_root()
    cfg = load_config(rr)
    pr_cfg = _pr_cfg(rr)

    repo = infer_repo_ref(args.owner, args.repo, args.base_url)
    token = require_token(args.token)
    client = GitHubClient(repo, token=token)
    ensure_labels(client)

    pr_number = int(args.pr_number)
    pr = get_pull_request(client, pr_number)
    issue_number = parse_issue_number_from_pr(pr)

    if issue_number:
        try:
            issue_obj = get_issue(client, issue_number)
            keep = extract_type_sev_labels(issue_obj)
            patch_issue(client, issue_number, labels=[cfg.labels.reported, cfg.labels.ready_to_merge] + keep)
            comment_issue(client, issue_number, f"claude-bot: PR #{pr_number} CI passed. Marked ready-to-merge.")
        except Exception as e:
            print(f"Warn: failed to update issue labels/comments: {e}")

    auto_merge = bool(pr_cfg.get("auto_merge_on_ci", False))
    require_label = bool(pr_cfg.get("require_automerge_label", True))
    automerge_label = cfg.labels.automerge
    merge_style = str(pr_cfg.get("merge_style","squash"))

    if not auto_merge:
        print("auto_merge_on_ci is false; not merging.")
        return
    if require_label and not pr_has_label(client, pr_number, automerge_label):
        print(f"PR missing required label {automerge_label}; not merging.")
        return

    # Safety: require head sha match at merge time.
    head_sha = ((pr.get("head") or {}).get("sha")) or None

    try:
        res = merge_pull_request(client, pr_number, merge_method=merge_style, sha=head_sha)
        print(f"Merged PR #{pr_number} (method={merge_style}) -> {res}")
        if issue_number:
            issue_obj2 = get_issue(client, issue_number)
            keep2 = extract_type_sev_labels(issue_obj2)
            patch_issue(client, issue_number, labels=[cfg.labels.verified] + keep2)
            comment_issue(client, issue_number, f"claude-bot: merged PR #{pr_number}. Issue should close via closing keywords in PR body.")
    except Exception as e:
        print(f"Auto-merge failed: {e}")
        if issue_number:
            issue_obj3 = get_issue(client, issue_number)
            keep3 = extract_type_sev_labels(issue_obj3)
            comment_issue(client, issue_number, f"claude-bot: auto-merge failed for PR #{pr_number}.\n\n```\n{e}\n```")
            patch_issue(client, issue_number, labels=[cfg.labels.reported, cfg.labels.blocked] + keep3)

# -------------------------
# Main
# -------------------------

def cmd_infer(args: argparse.Namespace) -> None:
    repo = infer_repo_ref(args.owner, args.repo, args.base_url)
    print(json.dumps({"base_url": repo.base_url, "owner": repo.owner, "repo": repo.repo}, indent=2))

def main() -> None:
    ap = argparse.ArgumentParser(prog="bot.py")
    ap.add_argument("--owner")
    ap.add_argument("--repo")
    ap.add_argument("--base-url", dest="base_url")
    ap.add_argument("--token")

    sub = ap.add_subparsers(dest="cmd", required=True)

    p = sub.add_parser("infer")
    p.set_defaults(fn=cmd_infer)

    p = sub.add_parser("run-smoke")
    p.set_defaults(fn=lambda args: sys.exit(run_commands("smoke", load_config(repo_root()))))

    p = sub.add_parser("run-verify")
    p.set_defaults(fn=lambda args: sys.exit(run_commands("verify", load_config(repo_root()))))

    p = sub.add_parser("discover")
    p.add_argument("--max-turns", default="8")
    p.set_defaults(fn=cmd_discover)

    p = sub.add_parser("fix")
    p.add_argument("issue", help="issue number or 'all'")
    p.add_argument("--max-turns", default="10")
    p.set_defaults(fn=cmd_fix)

    p = sub.add_parser("pr-ci-success")
    p.add_argument("pr_number", help="pull request number")
    p.set_defaults(fn=cmd_pr_ci_success)

    args = ap.parse_args()
    args.fn(args)

if __name__ == "__main__":
    main()
