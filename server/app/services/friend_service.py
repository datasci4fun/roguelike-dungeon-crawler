"""Friend service for managing player social connections."""
from typing import Optional, List, Set
from sqlalchemy import select, or_, and_, func
from sqlalchemy.ext.asyncio import AsyncSession

from ..models.user import User
from ..models.friendship import Friendship, FriendshipStatus
from .chat_manager import chat_manager


class FriendService:
    """Service for managing friend connections."""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def search_players(
        self,
        query: str,
        current_user_id: int,
        limit: int = 20
    ) -> List[dict]:
        """
        Search for players by username or display name.

        Args:
            query: Search query string
            current_user_id: ID of the searching user (excluded from results)
            limit: Maximum results to return

        Returns:
            List of player search results
        """
        search_pattern = f"%{query}%"

        # Get users matching the query
        user_query = (
            select(User)
            .where(
                User.id != current_user_id,
                User.is_active == True,
                or_(
                    User.username.ilike(search_pattern),
                    User.display_name.ilike(search_pattern),
                )
            )
            .order_by(User.high_score.desc())
            .limit(limit)
        )

        result = await self.db.execute(user_query)
        users = result.scalars().all()

        if not users:
            return []

        # Get friendship status for these users
        user_ids = [u.id for u in users]
        friend_ids = await self._get_friend_ids(current_user_id)
        pending_ids = await self._get_pending_request_ids(current_user_id)
        online_ids = set(chat_manager.get_online_user_ids())

        results = []
        for user in users:
            results.append({
                "user_id": user.id,
                "username": user.username,
                "display_name": user.display_name,
                "high_score": user.high_score,
                "victories": user.victories,
                "games_played": user.games_played,
                "is_friend": user.id in friend_ids,
                "is_pending": user.id in pending_ids,
                "is_online": user.id in online_ids,
            })

        return results

    async def get_friends(self, user_id: int) -> List[dict]:
        """
        Get list of accepted friends for a user.

        Args:
            user_id: User's ID

        Returns:
            List of friend information with online status
        """
        # Get friendships where user is either the requester or the friend
        query = (
            select(Friendship, User)
            .join(
                User,
                or_(
                    and_(Friendship.user_id == user_id, Friendship.friend_id == User.id),
                    and_(Friendship.friend_id == user_id, Friendship.user_id == User.id),
                )
            )
            .where(
                Friendship.status == FriendshipStatus.ACCEPTED,
                or_(
                    Friendship.user_id == user_id,
                    Friendship.friend_id == user_id,
                )
            )
        )

        result = await self.db.execute(query)
        rows = result.all()

        online_ids = set(chat_manager.get_online_user_ids())

        friends = []
        for friendship, user in rows:
            friends.append({
                "user_id": user.id,
                "username": user.username,
                "display_name": user.display_name,
                "high_score": user.high_score,
                "victories": user.victories,
                "is_online": user.id in online_ids,
                "since": friendship.updated_at,
            })

        # Sort by online status first, then by username
        friends.sort(key=lambda f: (not f["is_online"], f["username"].lower()))

        return friends

    async def get_pending_requests(self, user_id: int) -> dict:
        """
        Get pending friend requests for a user.

        Args:
            user_id: User's ID

        Returns:
            Dict with incoming and outgoing requests
        """
        # Incoming requests (where user is the friend_id)
        incoming_query = (
            select(Friendship, User)
            .join(User, Friendship.user_id == User.id)
            .where(
                Friendship.friend_id == user_id,
                Friendship.status == FriendshipStatus.PENDING,
            )
            .order_by(Friendship.created_at.desc())
        )

        # Outgoing requests (where user is the user_id)
        outgoing_query = (
            select(Friendship, User)
            .join(User, Friendship.friend_id == User.id)
            .where(
                Friendship.user_id == user_id,
                Friendship.status == FriendshipStatus.PENDING,
            )
            .order_by(Friendship.created_at.desc())
        )

        incoming_result = await self.db.execute(incoming_query)
        outgoing_result = await self.db.execute(outgoing_query)

        incoming = []
        for friendship, user in incoming_result.all():
            incoming.append({
                "id": friendship.id,
                "user_id": user.id,
                "username": user.username,
                "display_name": user.display_name,
                "high_score": user.high_score,
                "created_at": friendship.created_at,
            })

        outgoing = []
        for friendship, user in outgoing_result.all():
            outgoing.append({
                "id": friendship.id,
                "user_id": user.id,
                "username": user.username,
                "display_name": user.display_name,
                "high_score": user.high_score,
                "created_at": friendship.created_at,
            })

        return {"incoming": incoming, "outgoing": outgoing}

    async def send_friend_request(
        self,
        user_id: int,
        friend_id: int
    ) -> tuple[bool, str]:
        """
        Send a friend request.

        Args:
            user_id: Requester's user ID
            friend_id: Target user's ID

        Returns:
            Tuple of (success, message)
        """
        if user_id == friend_id:
            return False, "Cannot send friend request to yourself"

        # Check if target user exists
        user_query = select(User).where(User.id == friend_id, User.is_active == True)
        user_result = await self.db.execute(user_query)
        if not user_result.scalar_one_or_none():
            return False, "User not found"

        # Check for existing friendship in either direction
        existing_query = select(Friendship).where(
            or_(
                and_(Friendship.user_id == user_id, Friendship.friend_id == friend_id),
                and_(Friendship.user_id == friend_id, Friendship.friend_id == user_id),
            )
        )
        existing_result = await self.db.execute(existing_query)
        existing = existing_result.scalar_one_or_none()

        if existing:
            if existing.status == FriendshipStatus.ACCEPTED:
                return False, "Already friends"
            elif existing.status == FriendshipStatus.PENDING:
                # If they sent us a request, accept it
                if existing.user_id == friend_id:
                    existing.status = FriendshipStatus.ACCEPTED
                    await self.db.commit()
                    return True, "Friend request accepted"
                return False, "Friend request already pending"
            elif existing.status == FriendshipStatus.BLOCKED:
                return False, "Cannot send friend request"

        # Create new friend request
        friendship = Friendship(
            user_id=user_id,
            friend_id=friend_id,
            status=FriendshipStatus.PENDING,
        )
        self.db.add(friendship)
        await self.db.commit()

        return True, "Friend request sent"

    async def accept_friend_request(
        self,
        user_id: int,
        requester_id: int
    ) -> tuple[bool, str]:
        """
        Accept a friend request.

        Args:
            user_id: User accepting the request
            requester_id: User who sent the request

        Returns:
            Tuple of (success, message)
        """
        # Find the pending request
        query = select(Friendship).where(
            Friendship.user_id == requester_id,
            Friendship.friend_id == user_id,
            Friendship.status == FriendshipStatus.PENDING,
        )
        result = await self.db.execute(query)
        friendship = result.scalar_one_or_none()

        if not friendship:
            return False, "Friend request not found"

        friendship.status = FriendshipStatus.ACCEPTED
        await self.db.commit()

        return True, "Friend request accepted"

    async def reject_friend_request(
        self,
        user_id: int,
        requester_id: int
    ) -> tuple[bool, str]:
        """
        Reject a friend request.

        Args:
            user_id: User rejecting the request
            requester_id: User who sent the request

        Returns:
            Tuple of (success, message)
        """
        # Find the pending request
        query = select(Friendship).where(
            Friendship.user_id == requester_id,
            Friendship.friend_id == user_id,
            Friendship.status == FriendshipStatus.PENDING,
        )
        result = await self.db.execute(query)
        friendship = result.scalar_one_or_none()

        if not friendship:
            return False, "Friend request not found"

        await self.db.delete(friendship)
        await self.db.commit()

        return True, "Friend request rejected"

    async def remove_friend(
        self,
        user_id: int,
        friend_id: int
    ) -> tuple[bool, str]:
        """
        Remove a friend or cancel a pending request.

        Args:
            user_id: User removing the friend
            friend_id: Friend to remove

        Returns:
            Tuple of (success, message)
        """
        # Find the friendship in either direction
        query = select(Friendship).where(
            or_(
                and_(Friendship.user_id == user_id, Friendship.friend_id == friend_id),
                and_(Friendship.user_id == friend_id, Friendship.friend_id == user_id),
            ),
            Friendship.status != FriendshipStatus.BLOCKED,
        )
        result = await self.db.execute(query)
        friendship = result.scalar_one_or_none()

        if not friendship:
            return False, "Friendship not found"

        await self.db.delete(friendship)
        await self.db.commit()

        return True, "Friend removed"

    async def get_friend_count(self, user_id: int) -> int:
        """Get the number of accepted friends for a user."""
        query = select(func.count(Friendship.id)).where(
            Friendship.status == FriendshipStatus.ACCEPTED,
            or_(
                Friendship.user_id == user_id,
                Friendship.friend_id == user_id,
            )
        )
        result = await self.db.execute(query)
        return result.scalar_one()

    async def _get_friend_ids(self, user_id: int) -> Set[int]:
        """Get set of friend user IDs."""
        query = select(Friendship).where(
            Friendship.status == FriendshipStatus.ACCEPTED,
            or_(
                Friendship.user_id == user_id,
                Friendship.friend_id == user_id,
            )
        )
        result = await self.db.execute(query)
        friendships = result.scalars().all()

        friend_ids = set()
        for f in friendships:
            if f.user_id == user_id:
                friend_ids.add(f.friend_id)
            else:
                friend_ids.add(f.user_id)

        return friend_ids

    async def _get_pending_request_ids(self, user_id: int) -> Set[int]:
        """Get set of user IDs with pending requests (sent or received)."""
        query = select(Friendship).where(
            Friendship.status == FriendshipStatus.PENDING,
            or_(
                Friendship.user_id == user_id,
                Friendship.friend_id == user_id,
            )
        )
        result = await self.db.execute(query)
        friendships = result.scalars().all()

        pending_ids = set()
        for f in friendships:
            if f.user_id == user_id:
                pending_ids.add(f.friend_id)
            else:
                pending_ids.add(f.user_id)

        return pending_ids
