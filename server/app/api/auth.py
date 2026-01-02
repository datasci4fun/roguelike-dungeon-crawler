"""Authentication API endpoints."""
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.ext.asyncio import AsyncSession

from ..core.database import get_db
from ..core.security import create_access_token, get_current_user
from ..models.user import User
from ..schemas.user import UserCreate, UserResponse, UserLogin
from ..schemas.auth import Token
from ..services.auth_service import AuthService


router = APIRouter(prefix="/auth", tags=["authentication"])


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register(
    user_data: UserCreate,
    db: AsyncSession = Depends(get_db),
):
    """
    Register a new user account.

    - **username**: 3-50 characters, alphanumeric and underscore only
    - **email**: Valid email address
    - **password**: 8-100 characters, must contain uppercase, lowercase, and digit
    - **display_name**: Optional display name (shown on leaderboard)
    """
    auth_service = AuthService(db)

    try:
        user = await auth_service.create_user(user_data)
        return user
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )


@router.post("/login", response_model=Token)
async def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: AsyncSession = Depends(get_db),
):
    """
    Login and get a JWT access token.

    Use the token in the Authorization header: `Bearer <token>`
    """
    auth_service = AuthService(db)

    user = await auth_service.authenticate_user(
        form_data.username,
        form_data.password,
    )

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    access_token = create_access_token(user)
    return Token(access_token=access_token)


@router.post("/login/json", response_model=Token)
async def login_json(
    credentials: UserLogin,
    db: AsyncSession = Depends(get_db),
):
    """
    Login with JSON body (alternative to form-based login).

    Useful for API clients that prefer JSON over form data.
    """
    auth_service = AuthService(db)

    user = await auth_service.authenticate_user(
        credentials.username,
        credentials.password,
    )

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    access_token = create_access_token(user)
    return Token(access_token=access_token)


@router.get("/me", response_model=UserResponse)
async def get_current_user_info(
    current_user: User = Depends(get_current_user),
):
    """
    Get the current authenticated user's information.

    Requires a valid JWT token in the Authorization header.
    """
    return current_user


@router.post("/refresh", response_model=Token)
async def refresh_token(
    current_user: User = Depends(get_current_user),
):
    """
    Refresh the JWT access token.

    Returns a new token with extended expiration.
    """
    access_token = create_access_token(current_user)
    return Token(access_token=access_token)
