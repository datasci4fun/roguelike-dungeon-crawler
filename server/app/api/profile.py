"""Profile API endpoints."""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from ..core.database import get_db
from ..core.security import get_current_user
from ..models.user import User
from ..services.profile_service import ProfileService
from ..schemas.profile import ProfileResponse, PublicProfileResponse

router = APIRouter(prefix="/api/profile", tags=["profile"])


@router.get("/me", response_model=ProfileResponse)
async def get_my_profile(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get current user's full profile."""
    service = ProfileService(db)
    profile = await service.get_full_profile(current_user.id)

    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")

    return profile


@router.get("/{user_id}", response_model=PublicProfileResponse)
async def get_user_profile(
    user_id: int,
    db: AsyncSession = Depends(get_db),
):
    """Get a user's public profile."""
    service = ProfileService(db)
    profile = await service.get_public_profile(user_id)

    if not profile:
        raise HTTPException(status_code=404, detail="User not found")

    return profile


@router.get("/username/{username}", response_model=PublicProfileResponse)
async def get_profile_by_username(
    username: str,
    db: AsyncSession = Depends(get_db),
):
    """Get a user's public profile by username."""
    service = ProfileService(db)
    profile = await service.get_profile_by_username(username)

    if not profile:
        raise HTTPException(status_code=404, detail="User not found")

    return profile
