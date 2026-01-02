"""Authentication service - handles user registration and login."""
from datetime import datetime
from typing import Optional

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from ..models.user import User
from ..schemas.user import UserCreate


class AuthService:
    """Service for authentication operations."""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_user_by_username(self, username: str) -> Optional[User]:
        """Get a user by username."""
        result = await self.db.execute(
            select(User).where(User.username == username.lower())
        )
        return result.scalar_one_or_none()

    async def get_user_by_email(self, email: str) -> Optional[User]:
        """Get a user by email."""
        result = await self.db.execute(
            select(User).where(User.email == email.lower())
        )
        return result.scalar_one_or_none()

    async def get_user_by_id(self, user_id: int) -> Optional[User]:
        """Get a user by ID."""
        result = await self.db.execute(
            select(User).where(User.id == user_id)
        )
        return result.scalar_one_or_none()

    async def create_user(self, user_data: UserCreate) -> User:
        """
        Create a new user.

        Args:
            user_data: User registration data

        Returns:
            The created User object

        Raises:
            ValueError: If username or email already exists
        """
        # Check if username exists
        existing = await self.get_user_by_username(user_data.username)
        if existing:
            raise ValueError("Username already registered")

        # Check if email exists
        existing = await self.get_user_by_email(user_data.email)
        if existing:
            raise ValueError("Email already registered")

        # Create user
        user = User(
            username=user_data.username.lower(),
            email=user_data.email.lower(),
            hashed_password=User.hash_password(user_data.password),
            display_name=user_data.display_name,
        )

        self.db.add(user)
        await self.db.flush()
        await self.db.refresh(user)

        return user

    async def authenticate_user(
        self, username: str, password: str
    ) -> Optional[User]:
        """
        Authenticate a user by username/password.

        Args:
            username: The username
            password: The plain text password

        Returns:
            The User if authentication succeeds, None otherwise
        """
        user = await self.get_user_by_username(username)
        if not user:
            return None
        if not user.verify_password(password):
            return None
        if not user.is_active:
            return None

        # Update last login
        user.last_login = datetime.utcnow()
        await self.db.flush()

        return user

    async def update_user_stats(
        self,
        user: User,
        score: int = 0,
        kills: int = 0,
        level: int = 0,
        victory: bool = False,
        death: bool = False,
    ):
        """
        Update user statistics after a game.

        Args:
            user: The user to update
            score: Score achieved this game
            kills: Kills achieved this game
            level: Max level reached this game
            victory: Whether the player won
            death: Whether the player died
        """
        user.games_played += 1
        user.total_kills += kills

        if score > user.high_score:
            user.high_score = score

        if level > user.max_level_reached:
            user.max_level_reached = level

        if victory:
            user.victories += 1

        if death:
            user.total_deaths += 1

        await self.db.flush()
