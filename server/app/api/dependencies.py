"""
Dependency Viewer API - View project dependencies.

Features:
- Python dependencies from requirements.txt
- Frontend dependencies from package.json
- Categorized by type (production, dev, etc.)
- Version information and descriptions
"""

import json
import re
from pathlib import Path
from typing import Optional

from fastapi import APIRouter, Depends
from pydantic import BaseModel

from ..api.dbexplorer import require_debug

router = APIRouter(prefix="/api/dependencies", tags=["dependencies"])

# Project root paths
SERVER_ROOT = Path(__file__).parent.parent.parent
PROJECT_ROOT = SERVER_ROOT.parent
WEB_ROOT = PROJECT_ROOT / "web"


class Dependency(BaseModel):
    """A project dependency."""
    name: str
    version: str
    required_version: Optional[str] = None
    category: str
    description: Optional[str] = None
    homepage: Optional[str] = None
    is_dev: bool = False


class DependencyStats(BaseModel):
    """Dependency statistics."""
    python_total: int
    python_categories: dict[str, int]
    frontend_total: int
    frontend_prod: int
    frontend_dev: int


# Python package descriptions
PYTHON_DESCRIPTIONS = {
    "fastapi": "Modern, fast web framework for building APIs",
    "uvicorn": "Lightning-fast ASGI server",
    "python-multipart": "Streaming multipart parser for Python",
    "sqlalchemy": "Python SQL toolkit and ORM",
    "asyncpg": "Fast PostgreSQL client library for Python/asyncio",
    "alembic": "Database migration tool for SQLAlchemy",
    "redis": "Python client for Redis",
    "python-jose": "JavaScript Object Signing and Encryption (JOSE)",
    "passlib": "Comprehensive password hashing framework",
    "bcrypt": "Modern password hashing library",
    "pydantic": "Data validation using Python type hints",
    "pydantic-settings": "Settings management with Pydantic",
    "email-validator": "Email syntax and deliverability validation",
    "websockets": "Library for building WebSocket servers and clients",
    "psutil": "Cross-platform process and system monitoring",
    "python-dotenv": "Read key-value pairs from .env file",
}

# Python package homepages
PYTHON_HOMEPAGES = {
    "fastapi": "https://fastapi.tiangolo.com/",
    "uvicorn": "https://www.uvicorn.org/",
    "sqlalchemy": "https://www.sqlalchemy.org/",
    "alembic": "https://alembic.sqlalchemy.org/",
    "redis": "https://redis.io/",
    "pydantic": "https://docs.pydantic.dev/",
    "websockets": "https://websockets.readthedocs.io/",
    "psutil": "https://psutil.readthedocs.io/",
}

# Frontend package descriptions
FRONTEND_DESCRIPTIONS = {
    "react": "A JavaScript library for building user interfaces",
    "react-dom": "React package for working with the DOM",
    "react-router-dom": "Declarative routing for React web applications",
    "three": "JavaScript 3D library",
    "howler": "Audio library for the modern web",
    "@xterm/xterm": "Terminal emulator for the web",
    "@xterm/addon-fit": "Xterm.js addon to fit terminal to container",
    "@xterm/addon-web-links": "Xterm.js addon for clickable web links",
    "vite": "Next generation frontend tooling",
    "typescript": "TypeScript language",
    "eslint": "Pluggable JavaScript linter",
    "sass": "Mature, stable CSS extension language",
}

# Frontend package homepages
FRONTEND_HOMEPAGES = {
    "react": "https://react.dev/",
    "react-router-dom": "https://reactrouter.com/",
    "three": "https://threejs.org/",
    "howler": "https://howlerjs.com/",
    "vite": "https://vitejs.dev/",
    "typescript": "https://www.typescriptlang.org/",
    "eslint": "https://eslint.org/",
}


def parse_requirements_txt() -> list[Dependency]:
    """Parse Python dependencies from requirements.txt."""
    requirements_path = SERVER_ROOT / "requirements.txt"
    deps = []
    current_category = "General"

    if not requirements_path.exists():
        return deps

    content = requirements_path.read_text()

    for line in content.split("\n"):
        line = line.strip()

        # Skip empty lines
        if not line:
            continue

        # Category comment
        if line.startswith("#"):
            category = line.lstrip("#").strip()
            if category:
                current_category = category
            continue

        # Parse package line
        # Handle formats: package==version, package[extras]==version, package>=version
        match = re.match(r'^([a-zA-Z0-9_-]+)(?:\[[^\]]+\])?(?:([=<>!]+)(.+))?', line)
        if match:
            name = match.group(1)
            version = match.group(3) if match.group(3) else "any"

            deps.append(Dependency(
                name=name,
                version=version,
                required_version=version,
                category=current_category,
                description=PYTHON_DESCRIPTIONS.get(name),
                homepage=PYTHON_HOMEPAGES.get(name),
                is_dev="Development" in current_category or "dev" in current_category.lower(),
            ))

    return deps


def parse_package_json() -> list[Dependency]:
    """Parse frontend dependencies from package.json."""
    package_path = WEB_ROOT / "package.json"
    deps = []

    if not package_path.exists():
        return deps

    try:
        content = json.loads(package_path.read_text())
    except json.JSONDecodeError:
        return deps

    # Production dependencies
    for name, version in content.get("dependencies", {}).items():
        clean_version = version.lstrip("^~>=<")
        clean_name = name.lstrip("@").replace("/", "-")

        deps.append(Dependency(
            name=name,
            version=clean_version,
            required_version=version,
            category="Production",
            description=FRONTEND_DESCRIPTIONS.get(name) or FRONTEND_DESCRIPTIONS.get(clean_name),
            homepage=FRONTEND_HOMEPAGES.get(name) or FRONTEND_HOMEPAGES.get(clean_name),
            is_dev=False,
        ))

    # Dev dependencies
    for name, version in content.get("devDependencies", {}).items():
        clean_version = version.lstrip("^~>=<")
        clean_name = name.lstrip("@").replace("/", "-")

        deps.append(Dependency(
            name=name,
            version=clean_version,
            required_version=version,
            category="Development",
            description=FRONTEND_DESCRIPTIONS.get(name) or FRONTEND_DESCRIPTIONS.get(clean_name),
            homepage=FRONTEND_HOMEPAGES.get(name) or FRONTEND_HOMEPAGES.get(clean_name),
            is_dev=True,
        ))

    return deps


@router.get("")
async def get_all_dependencies(_: None = Depends(require_debug)):
    """Get all project dependencies."""
    python_deps = parse_requirements_txt()
    frontend_deps = parse_package_json()

    return {
        "python": [d.model_dump() for d in python_deps],
        "frontend": [d.model_dump() for d in frontend_deps],
        "python_count": len(python_deps),
        "frontend_count": len(frontend_deps),
    }


@router.get("/python")
async def get_python_dependencies(_: None = Depends(require_debug)):
    """Get Python dependencies from requirements.txt."""
    deps = parse_requirements_txt()

    # Group by category
    by_category: dict[str, list] = {}
    for dep in deps:
        if dep.category not in by_category:
            by_category[dep.category] = []
        by_category[dep.category].append(dep.model_dump())

    return {
        "dependencies": [d.model_dump() for d in deps],
        "by_category": by_category,
        "total": len(deps),
        "categories": list(by_category.keys()),
    }


@router.get("/frontend")
async def get_frontend_dependencies(_: None = Depends(require_debug)):
    """Get frontend dependencies from package.json."""
    deps = parse_package_json()

    prod = [d.model_dump() for d in deps if not d.is_dev]
    dev = [d.model_dump() for d in deps if d.is_dev]

    return {
        "dependencies": [d.model_dump() for d in deps],
        "production": prod,
        "development": dev,
        "total": len(deps),
        "prod_count": len(prod),
        "dev_count": len(dev),
    }


@router.get("/stats")
async def get_dependency_stats(_: None = Depends(require_debug)):
    """Get dependency statistics."""
    python_deps = parse_requirements_txt()
    frontend_deps = parse_package_json()

    # Python categories
    python_cats: dict[str, int] = {}
    for dep in python_deps:
        python_cats[dep.category] = python_cats.get(dep.category, 0) + 1

    frontend_prod = sum(1 for d in frontend_deps if not d.is_dev)
    frontend_dev = sum(1 for d in frontend_deps if d.is_dev)

    return DependencyStats(
        python_total=len(python_deps),
        python_categories=python_cats,
        frontend_total=len(frontend_deps),
        frontend_prod=frontend_prod,
        frontend_dev=frontend_dev,
    )


@router.get("/search")
async def search_dependencies(
    q: str,
    _: None = Depends(require_debug),
):
    """Search dependencies by name."""
    python_deps = parse_requirements_txt()
    frontend_deps = parse_package_json()

    q_lower = q.lower()

    python_matches = [
        d.model_dump() for d in python_deps
        if q_lower in d.name.lower()
    ]

    frontend_matches = [
        d.model_dump() for d in frontend_deps
        if q_lower in d.name.lower()
    ]

    return {
        "query": q,
        "python": python_matches,
        "frontend": frontend_matches,
        "total": len(python_matches) + len(frontend_matches),
    }


@router.get("/files")
async def get_dependency_files(_: None = Depends(require_debug)):
    """Get raw dependency file contents."""
    result = {}

    # requirements.txt
    requirements_path = SERVER_ROOT / "requirements.txt"
    if requirements_path.exists():
        result["requirements_txt"] = {
            "path": str(requirements_path),
            "content": requirements_path.read_text(),
            "exists": True,
        }
    else:
        result["requirements_txt"] = {"exists": False}

    # package.json
    package_path = WEB_ROOT / "package.json"
    if package_path.exists():
        result["package_json"] = {
            "path": str(package_path),
            "content": package_path.read_text(),
            "exists": True,
        }
    else:
        result["package_json"] = {"exists": False}

    return result
