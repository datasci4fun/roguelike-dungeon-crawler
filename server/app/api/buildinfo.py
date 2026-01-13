"""
Build Info API - Provides build and environment information.

Returns git commit info, dependency versions, and environment details.
"""

import os
import sys
import subprocess
import platform
from datetime import datetime
from typing import Optional
from pathlib import Path

from fastapi import APIRouter, Depends
from pydantic import BaseModel

from ..core.config import settings
from ..api.dbexplorer import require_debug

router = APIRouter(prefix="/api/build", tags=["build-info"])

# Cache git info since it won't change during runtime
_git_info_cache: Optional[dict] = None


class GitInfo(BaseModel):
    """Git repository information."""
    commit_hash: Optional[str] = None
    commit_short: Optional[str] = None
    branch: Optional[str] = None
    author: Optional[str] = None
    author_email: Optional[str] = None
    commit_date: Optional[str] = None
    commit_message: Optional[str] = None
    is_dirty: bool = False
    tags: list[str] = []


class PythonInfo(BaseModel):
    """Python environment information."""
    version: str
    implementation: str
    executable: str
    packages: list[dict]


class EnvironmentInfo(BaseModel):
    """Environment and system information."""
    platform: str
    platform_release: str
    architecture: str
    hostname: str
    working_directory: str
    debug_mode: bool
    environment: str


class BuildInfoResponse(BaseModel):
    """Complete build information response."""
    app_name: str
    app_version: str
    build_timestamp: str
    git: GitInfo
    python: PythonInfo
    environment: EnvironmentInfo


def run_git_command(args: list[str]) -> Optional[str]:
    """Run a git command and return output."""
    try:
        result = subprocess.run(
            ["git"] + args,
            capture_output=True,
            text=True,
            timeout=5,
            cwd=Path(__file__).parent.parent.parent.parent,  # repo root
        )
        if result.returncode == 0:
            return result.stdout.strip()
    except Exception:
        pass
    return None


def get_git_info() -> GitInfo:
    """Gather git repository information."""
    global _git_info_cache

    if _git_info_cache is not None:
        return GitInfo(**_git_info_cache)

    info = GitInfo()

    # Commit hash
    commit_hash = run_git_command(["rev-parse", "HEAD"])
    if commit_hash:
        info.commit_hash = commit_hash
        info.commit_short = commit_hash[:7]

    # Branch name
    branch = run_git_command(["rev-parse", "--abbrev-ref", "HEAD"])
    if branch:
        info.branch = branch

    # Author info
    author = run_git_command(["log", "-1", "--format=%an"])
    if author:
        info.author = author

    author_email = run_git_command(["log", "-1", "--format=%ae"])
    if author_email:
        info.author_email = author_email

    # Commit date
    commit_date = run_git_command(["log", "-1", "--format=%ci"])
    if commit_date:
        info.commit_date = commit_date

    # Commit message
    commit_msg = run_git_command(["log", "-1", "--format=%s"])
    if commit_msg:
        info.commit_message = commit_msg

    # Check if dirty
    status = run_git_command(["status", "--porcelain"])
    info.is_dirty = bool(status)

    # Tags pointing to current commit
    tags = run_git_command(["tag", "--points-at", "HEAD"])
    if tags:
        info.tags = tags.split("\n")

    # Cache the result
    _git_info_cache = info.model_dump()

    return info


def get_python_info() -> PythonInfo:
    """Gather Python environment information."""
    # Get installed packages
    packages = []
    try:
        result = subprocess.run(
            [sys.executable, "-m", "pip", "list", "--format=json"],
            capture_output=True,
            text=True,
            timeout=10,
        )
        if result.returncode == 0:
            import json
            packages = json.loads(result.stdout)
    except Exception:
        pass

    return PythonInfo(
        version=platform.python_version(),
        implementation=platform.python_implementation(),
        executable=sys.executable,
        packages=packages,
    )


def get_environment_info() -> EnvironmentInfo:
    """Gather environment information."""
    return EnvironmentInfo(
        platform=platform.system(),
        platform_release=platform.release(),
        architecture=platform.machine(),
        hostname=platform.node(),
        working_directory=os.getcwd(),
        debug_mode=settings.debug,
        environment="development" if settings.debug else "production",
    )


@router.get("", response_model=BuildInfoResponse)
async def get_build_info(_: None = Depends(require_debug)):
    """
    Get comprehensive build and environment information.

    Only available in debug mode.
    """
    return BuildInfoResponse(
        app_name=settings.app_name,
        app_version=settings.app_version,
        build_timestamp=datetime.utcnow().isoformat() + "Z",
        git=get_git_info(),
        python=get_python_info(),
        environment=get_environment_info(),
    )


@router.get("/git")
async def get_git_only(_: None = Depends(require_debug)):
    """Get only git information."""
    return get_git_info()


@router.get("/packages")
async def get_packages(_: None = Depends(require_debug)):
    """Get installed Python packages."""
    info = get_python_info()
    return {
        "python_version": info.version,
        "package_count": len(info.packages),
        "packages": info.packages,
    }
