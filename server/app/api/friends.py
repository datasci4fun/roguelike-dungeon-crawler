"""Friends API endpoints."""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession

from ..core.database import get_db
from ..core.security import get_current_user
from ..models.user import User
from ..services.friend_service import FriendService
from ..schemas.friend import (
    FriendsListResponse,
    FriendRequestsResponse,
    PlayerSearchResponse,
    FriendActionResponse,
)

router = APIRouter(prefix="/api/friends", tags=["friends"])


@router.get("", response_model=FriendsListResponse)
async def get_friends(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get current user's friends list."""
    service = FriendService(db)
    friends = await service.get_friends(current_user.id)

    return FriendsListResponse(friends=friends, total=len(friends))


@router.get("/requests", response_model=FriendRequestsResponse)
async def get_friend_requests(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get pending friend requests (incoming and outgoing)."""
    service = FriendService(db)
    requests = await service.get_pending_requests(current_user.id)

    return requests


@router.get("/search", response_model=PlayerSearchResponse)
async def search_players(
    q: str = Query(..., min_length=1, max_length=50, description="Search query"),
    limit: int = Query(20, ge=1, le=50, description="Max results"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Search for players by username or display name."""
    service = FriendService(db)
    results = await service.search_players(q, current_user.id, limit)

    return PlayerSearchResponse(results=results, total=len(results))


@router.post("/request/{user_id}", response_model=FriendActionResponse)
async def send_friend_request(
    user_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Send a friend request to another user."""
    service = FriendService(db)
    success, message = await service.send_friend_request(current_user.id, user_id)

    if not success:
        raise HTTPException(status_code=400, detail=message)

    return FriendActionResponse(success=success, message=message)


@router.post("/accept/{user_id}", response_model=FriendActionResponse)
async def accept_friend_request(
    user_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Accept a friend request from another user."""
    service = FriendService(db)
    success, message = await service.accept_friend_request(current_user.id, user_id)

    if not success:
        raise HTTPException(status_code=400, detail=message)

    return FriendActionResponse(success=success, message=message)


@router.post("/reject/{user_id}", response_model=FriendActionResponse)
async def reject_friend_request(
    user_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Reject a friend request from another user."""
    service = FriendService(db)
    success, message = await service.reject_friend_request(current_user.id, user_id)

    if not success:
        raise HTTPException(status_code=400, detail=message)

    return FriendActionResponse(success=success, message=message)


@router.delete("/{user_id}", response_model=FriendActionResponse)
async def remove_friend(
    user_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Remove a friend or cancel a pending request."""
    service = FriendService(db)
    success, message = await service.remove_friend(current_user.id, user_id)

    if not success:
        raise HTTPException(status_code=400, detail=message)

    return FriendActionResponse(success=success, message=message)
