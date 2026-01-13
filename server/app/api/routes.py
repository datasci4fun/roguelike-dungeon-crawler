"""
Route Explorer API - View all application routes.

Features:
- List all FastAPI routes with methods and paths
- Route details (parameters, response types, tags)
- Group by tag/router
- Search functionality
"""

from typing import Optional

from fastapi import APIRouter, Depends, Request
from pydantic import BaseModel

from ..api.dbexplorer import require_debug

router = APIRouter(prefix="/api/routes", tags=["routes"])


class RouteInfo(BaseModel):
    """Information about an API route."""
    path: str
    method: str
    name: Optional[str] = None
    summary: Optional[str] = None
    description: Optional[str] = None
    tags: list[str] = []
    parameters: list[dict] = []
    deprecated: bool = False


class RouteStats(BaseModel):
    """Route statistics."""
    total_routes: int
    by_method: dict[str, int]
    by_tag: dict[str, int]
    deprecated_count: int


# Frontend routes (manually defined since we can't introspect React Router)
FRONTEND_ROUTES = [
    {"path": "/", "name": "Home", "description": "Landing page"},
    {"path": "/features", "name": "Features", "description": "Game features overview"},
    {"path": "/about", "name": "About", "description": "About the project"},
    {"path": "/login", "name": "Login", "description": "User login page"},
    {"path": "/register", "name": "Register", "description": "User registration"},
    {"path": "/play", "name": "Play", "description": "Main game interface", "auth_required": True},
    {"path": "/character-creation", "name": "Character Creation", "description": "Create new character"},
    {"path": "/play-scene", "name": "Play Scene", "description": "3D game scene"},
    {"path": "/scene-demo", "name": "Scene Demo", "description": "3D scene demonstration"},
    {"path": "/first-person-demo", "name": "First Person Demo", "description": "First person view demo"},
    {"path": "/first-person-test", "name": "First Person Test", "description": "First person testing"},
    {"path": "/debug-3d", "name": "Debug 3D", "description": "3D debugging tools"},
    {"path": "/spectate", "name": "Spectate", "description": "Watch other players"},
    {"path": "/leaderboard", "name": "Leaderboard", "description": "High scores"},
    {"path": "/ghosts", "name": "Ghosts", "description": "Ghost replays"},
    {"path": "/profile", "name": "Profile", "description": "User profile"},
    {"path": "/profile/:userId", "name": "User Profile", "description": "View other user profiles"},
    {"path": "/achievements", "name": "Achievements", "description": "Achievement tracking"},
    {"path": "/friends", "name": "Friends", "description": "Friends list", "auth_required": True},
    {"path": "/presentation", "name": "Presentation", "description": "Project case study"},
    {"path": "/roadmap", "name": "Roadmap", "description": "Development roadmap"},
    {"path": "/codebase-health", "name": "Codebase Health", "description": "Code statistics"},
    {"path": "/changelog", "name": "Changelog", "description": "Patch notes"},
    {"path": "/lore", "name": "Lore & Story", "description": "World-building and backstory"},
    {"path": "/db-explorer", "name": "DB Explorer", "description": "Database browser", "dev_tool": True},
    {"path": "/cache-inspector", "name": "Cache Inspector", "description": "Cache viewer", "dev_tool": True},
    {"path": "/audio-jukebox", "name": "Audio Jukebox", "description": "Sound testing", "dev_tool": True},
    {"path": "/system-status", "name": "System Status", "description": "Service health", "dev_tool": True},
    {"path": "/api-playground", "name": "API Playground", "description": "API testing", "dev_tool": True},
    {"path": "/ws-monitor", "name": "WS Monitor", "description": "WebSocket monitor", "dev_tool": True},
    {"path": "/build-info", "name": "Build Info", "description": "Build details", "dev_tool": True},
    {"path": "/log-viewer", "name": "Log Viewer", "description": "Application logs", "dev_tool": True},
    {"path": "/error-tracker", "name": "Error Tracker", "description": "Error monitoring", "dev_tool": True},
    {"path": "/profiler", "name": "Profiler", "description": "Performance profiling", "dev_tool": True},
    {"path": "/session-inspector", "name": "Sessions", "description": "Session management", "dev_tool": True},
    {"path": "/feature-flags", "name": "Feature Flags", "description": "Feature toggles", "dev_tool": True},
    {"path": "/env-config", "name": "Env Config", "description": "Configuration viewer", "dev_tool": True},
    {"path": "/dependencies", "name": "Dependencies", "description": "Package dependencies", "dev_tool": True},
    {"path": "/routes", "name": "Route Explorer", "description": "API routes viewer", "dev_tool": True},
    {"path": "/metrics", "name": "Metrics Dashboard", "description": "Performance metrics", "dev_tool": True},
]


def get_all_routes(app) -> list[RouteInfo]:
    """Extract all routes from the FastAPI application."""
    routes = []

    for route in app.routes:
        # Skip non-API routes
        if not hasattr(route, 'methods'):
            continue

        path = route.path
        methods = list(route.methods - {'HEAD', 'OPTIONS'})

        for method in methods:
            # Get route info
            name = route.name if hasattr(route, 'name') else None
            summary = None
            description = None
            tags = []
            deprecated = False
            parameters = []

            # Extract from endpoint if available
            if hasattr(route, 'endpoint'):
                endpoint = route.endpoint
                if hasattr(endpoint, '__doc__') and endpoint.__doc__:
                    description = endpoint.__doc__.strip()

            # Extract tags from route
            if hasattr(route, 'tags'):
                tags = list(route.tags) if route.tags else []

            # Extract path parameters
            if hasattr(route, 'param_convertors'):
                for param_name, convertor in route.param_convertors.items():
                    parameters.append({
                        "name": param_name,
                        "in": "path",
                        "type": convertor.__class__.__name__.replace('Convertor', '').lower(),
                    })

            routes.append(RouteInfo(
                path=path,
                method=method,
                name=name,
                summary=summary,
                description=description,
                tags=tags,
                parameters=parameters,
                deprecated=deprecated,
            ))

    # Sort by path, then method
    routes.sort(key=lambda r: (r.path, r.method))

    return routes


@router.get("")
async def get_routes(
    request: Request,
    _: None = Depends(require_debug),
    tag: Optional[str] = None,
    method: Optional[str] = None,
    search: Optional[str] = None,
):
    """Get all API routes."""
    app = request.app
    routes = get_all_routes(app)

    # Filter by tag
    if tag:
        routes = [r for r in routes if tag in r.tags]

    # Filter by method
    if method:
        routes = [r for r in routes if r.method.upper() == method.upper()]

    # Search
    if search:
        search_lower = search.lower()
        routes = [
            r for r in routes
            if search_lower in r.path.lower()
            or (r.name and search_lower in r.name.lower())
            or (r.description and search_lower in r.description.lower())
        ]

    return {
        "routes": [r.model_dump() for r in routes],
        "total": len(routes),
    }


@router.get("/stats")
async def get_route_stats(
    request: Request,
    _: None = Depends(require_debug),
):
    """Get route statistics."""
    app = request.app
    routes = get_all_routes(app)

    by_method: dict[str, int] = {}
    by_tag: dict[str, int] = {}
    deprecated_count = 0

    for route in routes:
        # Count by method
        by_method[route.method] = by_method.get(route.method, 0) + 1

        # Count by tag
        for tag in route.tags:
            by_tag[tag] = by_tag.get(tag, 0) + 1

        # Count deprecated
        if route.deprecated:
            deprecated_count += 1

    return RouteStats(
        total_routes=len(routes),
        by_method=by_method,
        by_tag=by_tag,
        deprecated_count=deprecated_count,
    )


@router.get("/tags")
async def get_route_tags(
    request: Request,
    _: None = Depends(require_debug),
):
    """Get all unique route tags."""
    app = request.app
    routes = get_all_routes(app)

    tags = set()
    for route in routes:
        tags.update(route.tags)

    return {
        "tags": sorted(tags),
        "total": len(tags),
    }


@router.get("/frontend")
async def get_frontend_routes(
    _: None = Depends(require_debug),
    search: Optional[str] = None,
    dev_tools: Optional[bool] = None,
):
    """Get frontend routes."""
    routes = FRONTEND_ROUTES.copy()

    # Filter dev tools
    if dev_tools is not None:
        routes = [r for r in routes if r.get("dev_tool", False) == dev_tools]

    # Search
    if search:
        search_lower = search.lower()
        routes = [
            r for r in routes
            if search_lower in r["path"].lower()
            or search_lower in r["name"].lower()
            or search_lower in r.get("description", "").lower()
        ]

    return {
        "routes": routes,
        "total": len(routes),
        "dev_tools_count": sum(1 for r in FRONTEND_ROUTES if r.get("dev_tool")),
    }


@router.get("/grouped")
async def get_routes_grouped(
    request: Request,
    _: None = Depends(require_debug),
):
    """Get routes grouped by tag."""
    app = request.app
    routes = get_all_routes(app)

    grouped: dict[str, list] = {"untagged": []}

    for route in routes:
        if route.tags:
            for tag in route.tags:
                if tag not in grouped:
                    grouped[tag] = []
                grouped[tag].append(route.model_dump())
        else:
            grouped["untagged"].append(route.model_dump())

    # Remove empty untagged
    if not grouped["untagged"]:
        del grouped["untagged"]

    return {
        "grouped": grouped,
        "tags": list(grouped.keys()),
    }


@router.get("/methods")
async def get_route_methods(
    request: Request,
    _: None = Depends(require_debug),
):
    """Get routes grouped by HTTP method."""
    app = request.app
    routes = get_all_routes(app)

    by_method: dict[str, list] = {}

    for route in routes:
        if route.method not in by_method:
            by_method[route.method] = []
        by_method[route.method].append(route.model_dump())

    return {
        "by_method": by_method,
        "methods": list(by_method.keys()),
    }
