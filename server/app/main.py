"""FastAPI application entry point."""
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .core.config import settings
from .core.database import init_db, close_db, async_session_maker
from .core.redis import close_redis
from .core.cache import cache
from .services.auth_service import AuthService
from .services.cache_warmer import warm_game_constants_cache
from .api.auth import router as auth_router
from .api.game import router as game_router
from .api.leaderboard import router as leaderboard_router
from .api.ghost import router as ghost_router
from .api.chat import router as chat_router
from .api.achievements import router as achievements_router
from .api.profile import router as profile_router
from .api.friends import router as friends_router
from .api.saves import router as saves_router
from .api.daily import router as daily_router
from .api.dbexplorer import router as dbexplorer_router
from .api.cache import router as cache_router
from .api.status import router as status_router
from .api.buildinfo import router as buildinfo_router
from .api.logs import router as logs_router
from .api.errors import router as errors_router, capture_error
from .api.profiler import router as profiler_router, ProfilingMiddleware
from .api.sessions import router as sessions_router
from .api.flags import router as flags_router
from .api.config import router as config_router
from .api.dependencies import router as dependencies_router
from .api.routes import router as routes_router
from .api.metrics import router as metrics_router, MetricsMiddleware
from .api.lore import router as lore_router
from .api.bestiary import router as bestiary_router
from .api.character_guide import router as character_guide_router
from .api.items import router as items_router
from .api.gameguide import router as gameguide_router
from .api.game_constants import router as game_constants_router
from .api.assets import router as assets_router
from .api.asset3d import router as asset3d_router
from .api.editor import router as editor_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan handler for startup/shutdown."""
    # Startup
    print(f"Starting {settings.app_name} v{settings.app_version}")
    print(f"Debug mode: {settings.debug}")
    print("Initializing database...")
    await init_db()
    print("Database initialized.")

    # Seed demo account
    print("Ensuring demo account exists...")
    async with async_session_maker() as db:
        auth_service = AuthService(db)
        await auth_service.ensure_demo_account()
        await db.commit()
    print("Demo account ready (username: demo, password: DemoPass123)")

    # Warm game constants cache from database
    print("Warming game constants cache...")
    try:
        cache_result = await warm_game_constants_cache(skip_if_populated=True)
        if cache_result.get("status") == "skipped":
            print("Cache already populated - skipped warming")
        else:
            total = sum(v for k, v in cache_result.items() if isinstance(v, int))
            print(f"Cache warmed with {total} records")
    except Exception as e:
        print(f"Cache warming failed (non-fatal): {e}")

    yield
    # Shutdown
    print("Closing Redis connections...")
    await close_redis()
    print("Closing database connections...")
    await close_db()
    print("Shutting down...")


def create_app() -> FastAPI:
    """Create and configure the FastAPI application."""
    app = FastAPI(
        title=settings.app_name,
        version=settings.app_version,
        description="Online multiplayer roguelike dungeon crawler",
        lifespan=lifespan,
    )

    # CORS middleware
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Performance profiling middleware (debug mode only)
    if settings.debug:
        app.add_middleware(ProfilingMiddleware, enabled=True)
        app.add_middleware(MetricsMiddleware)

    # Include routers
    app.include_router(health_router, prefix="/api", tags=["health"])
    app.include_router(auth_router, prefix="/api")
    app.include_router(game_router, prefix="/api")
    app.include_router(leaderboard_router)
    app.include_router(ghost_router)
    app.include_router(chat_router)
    app.include_router(achievements_router)
    app.include_router(profile_router)
    app.include_router(friends_router)
    app.include_router(saves_router)
    app.include_router(daily_router, prefix="/api")
    app.include_router(dbexplorer_router, tags=["dev-tools"])
    app.include_router(cache_router, tags=["dev-tools"])
    app.include_router(status_router, tags=["dev-tools"])
    app.include_router(buildinfo_router, tags=["dev-tools"])
    app.include_router(logs_router, tags=["dev-tools"])
    app.include_router(errors_router, tags=["dev-tools"])
    app.include_router(profiler_router, tags=["dev-tools"])
    app.include_router(sessions_router, tags=["dev-tools"])
    app.include_router(flags_router, tags=["dev-tools"])
    app.include_router(config_router, tags=["dev-tools"])
    app.include_router(dependencies_router, tags=["dev-tools"])
    app.include_router(routes_router, tags=["dev-tools"])
    app.include_router(metrics_router, tags=["dev-tools"])
    app.include_router(lore_router, tags=["content"])
    app.include_router(bestiary_router, tags=["content"])
    app.include_router(character_guide_router, tags=["content"])
    app.include_router(items_router, tags=["content"])
    app.include_router(gameguide_router, tags=["content"])
    app.include_router(game_constants_router, tags=["game-constants"])
    app.include_router(assets_router, tags=["dev-tools"])
    app.include_router(asset3d_router, tags=["dev-tools"])
    app.include_router(editor_router, tags=["dev-tools"])

    # Add exception handler to capture errors (only in debug mode)
    if settings.debug:
        @app.exception_handler(Exception)
        async def global_exception_handler(request, exc):
            from fastapi.responses import JSONResponse
            # Capture error for the error tracker
            capture_error(exc, request)
            # Re-raise for normal handling
            return JSONResponse(
                status_code=500,
                content={"detail": "Internal server error"}
            )

    return app


# Health check router
from fastapi import APIRouter

health_router = APIRouter()


@health_router.get("/health")
async def health_check():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "app": settings.app_name,
        "version": settings.app_version,
    }


@health_router.get("/health/ready")
async def readiness_check():
    """
    Readiness check - verifies all dependencies are available.
    """
    from .core.database import engine
    from .core.redis import get_redis

    db_status = "healthy"
    redis_status = "healthy"
    errors = []

    # Check database
    try:
        from sqlalchemy import text
        async with engine.connect() as conn:
            await conn.execute(text("SELECT 1"))
    except Exception as e:
        db_status = "unhealthy"
        errors.append(f"database: {str(e)}")

    # Check Redis
    try:
        redis = await get_redis()
        await redis.ping()
    except Exception as e:
        redis_status = "unhealthy"
        errors.append(f"redis: {str(e)}")

    overall_status = "ready" if not errors else "not_ready"

    return {
        "status": overall_status,
        "database": db_status,
        "redis": redis_status,
        "errors": errors if errors else None,
    }


# Create app instance
app = create_app()


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "app.main:app",
        host=settings.host,
        port=settings.port,
        reload=settings.debug,
    )
