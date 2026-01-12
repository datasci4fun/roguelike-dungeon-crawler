"""FastAPI application entry point."""
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .core.config import settings
from .core.database import init_db, close_db, async_session_maker
from .services.auth_service import AuthService
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

    yield
    # Shutdown
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
    TODO: Add database and Redis connectivity checks.
    """
    return {
        "status": "ready",
        "database": "not_configured",
        "redis": "not_configured",
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
