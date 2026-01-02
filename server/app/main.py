"""FastAPI application entry point."""
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .core.config import settings
from .core.database import init_db, close_db
from .api.auth import router as auth_router
from .api.game import router as game_router
from .api.leaderboard import router as leaderboard_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan handler for startup/shutdown."""
    # Startup
    print(f"Starting {settings.app_name} v{settings.app_version}")
    print(f"Debug mode: {settings.debug}")
    print("Initializing database...")
    await init_db()
    print("Database initialized.")
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
