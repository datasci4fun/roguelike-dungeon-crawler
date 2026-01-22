from __future__ import annotations

import os
from dataclasses import dataclass
from typing import Any, Dict, Optional
import requests

class GitHubError(RuntimeError):
    pass

@dataclass(frozen=True)
class RepoRef:
    base_url: str   # e.g. https://github.com or GHES host
    owner: str
    repo: str

def infer_api_base(base_url: str) -> str:
    # Default to api.github.com for github.com; otherwise GHES commonly exposes /api/v3
    override = os.environ.get("GITHUB_API_BASE_URL")
    if override:
        return override.rstrip("/")
    host = base_url.rstrip("/")
    if host.endswith("github.com"):
        return "https://api.github.com"
    return host + "/api/v3"

class GitHubClient:
    def __init__(self, repo: RepoRef, token: str):
        self.repo = repo
        self.api_base = infer_api_base(repo.base_url)
        self.session = requests.Session()
        self.session.headers.update({
            "Authorization": f"Bearer {token}",
            "Accept": "application/vnd.github+json",
            # Pinning API version is recommended by GitHub; safe default:
            "X-GitHub-Api-Version": "2022-11-28",
            "User-Agent": "claude-repo-bot",
        })

    def _url(self, path: str) -> str:
        if not path.startswith("/"):
            path = "/" + path
        return self.api_base + path

    def request(self, method: str, path: str, *, params: Optional[Dict[str,Any]]=None, json_body: Optional[Dict[str,Any]]=None) -> Any:
        r = self.session.request(method, self._url(path), params=params, json=json_body, timeout=60)
        if r.status_code >= 400:
            raise GitHubError(f"{method} {path} failed: {r.status_code} {r.text}")
        if r.status_code == 204 or not r.text:
            return None
        return r.json()

    def get_json(self, path: str, params: Optional[Dict[str,Any]]=None) -> Any:
        return self.request("GET", path, params=params)

    def post_json(self, path: str, json_body: Dict[str,Any]) -> Any:
        return self.request("POST", path, json_body=json_body)

    def patch_json(self, path: str, json_body: Dict[str,Any]) -> Any:
        return self.request("PATCH", path, json_body=json_body)

    def put_json(self, path: str, json_body: Optional[Dict[str,Any]]=None) -> Any:
        return self.request("PUT", path, json_body=json_body or {})
