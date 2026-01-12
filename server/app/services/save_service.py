"""Save service for managing game saves."""
from typing import Optional, List
from sqlalchemy import select, delete
from sqlalchemy.ext.asyncio import AsyncSession

from ..models.game_save import GameSave, MAX_SAVE_SLOTS, CURRENT_SAVE_VERSION
from ..schemas.save import SaveCreate


class SaveService:
    """Service for managing game saves in the database."""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def list_saves(self, user_id: int) -> List[GameSave]:
        """Get all active saves for a user."""
        query = (
            select(GameSave)
            .where(
                GameSave.user_id == user_id,
                GameSave.is_active == True,
            )
            .order_by(GameSave.slot_number)
        )
        result = await self.db.execute(query)
        return list(result.scalars().all())

    async def get_save(self, user_id: int, slot_number: int) -> Optional[GameSave]:
        """Get a specific save by user and slot."""
        if slot_number < 0 or slot_number >= MAX_SAVE_SLOTS:
            return None

        query = select(GameSave).where(
            GameSave.user_id == user_id,
            GameSave.slot_number == slot_number,
            GameSave.is_active == True,
        )
        result = await self.db.execute(query)
        return result.scalar_one_or_none()

    async def create_or_update_save(
        self,
        user_id: int,
        slot_number: int,
        data: SaveCreate,
    ) -> Optional[GameSave]:
        """Create or update a save in the specified slot."""
        if slot_number < 0 or slot_number >= MAX_SAVE_SLOTS:
            return None

        # Check if save exists
        existing = await self.get_save(user_id, slot_number)

        if existing:
            # Update existing save
            existing.save_name = data.save_name
            existing.game_state = data.game_state
            existing.current_level = data.current_level
            existing.player_level = data.player_level
            existing.player_hp = data.player_hp
            existing.player_max_hp = data.player_max_hp
            existing.score = data.score
            existing.turns_played = data.turns_played
            existing.save_version = CURRENT_SAVE_VERSION
            await self.db.commit()
            await self.db.refresh(existing)
            return existing
        else:
            # Create new save
            new_save = GameSave(
                user_id=user_id,
                slot_number=slot_number,
                save_name=data.save_name,
                game_state=data.game_state,
                current_level=data.current_level,
                player_level=data.player_level,
                player_hp=data.player_hp,
                player_max_hp=data.player_max_hp,
                score=data.score,
                turns_played=data.turns_played,
                save_version=CURRENT_SAVE_VERSION,
            )
            self.db.add(new_save)
            await self.db.commit()
            await self.db.refresh(new_save)
            return new_save

    async def delete_save(self, user_id: int, slot_number: int) -> bool:
        """Delete a save (soft delete by setting is_active=False)."""
        save = await self.get_save(user_id, slot_number)
        if not save:
            return False

        save.is_active = False
        await self.db.commit()
        return True

    async def hard_delete_save(self, user_id: int, slot_number: int) -> bool:
        """Permanently delete a save from the database."""
        query = delete(GameSave).where(
            GameSave.user_id == user_id,
            GameSave.slot_number == slot_number,
        )
        result = await self.db.execute(query)
        await self.db.commit()
        return result.rowcount > 0

    async def get_slot_info(self, user_id: int) -> List[dict]:
        """Get info about all save slots (including empty ones)."""
        saves = await self.list_saves(user_id)
        saves_by_slot = {s.slot_number: s for s in saves}

        slot_info = []
        for slot in range(MAX_SAVE_SLOTS):
            save = saves_by_slot.get(slot)
            slot_info.append({
                "slot_number": slot,
                "is_empty": save is None,
                "save": save,
            })
        return slot_info
