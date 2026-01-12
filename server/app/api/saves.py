"""Game saves API endpoints."""
from fastapi import APIRouter, Depends, HTTPException, Path
from sqlalchemy.ext.asyncio import AsyncSession

from ..core.database import get_db
from ..core.security import get_current_user
from ..models.user import User
from ..models.game_save import MAX_SAVE_SLOTS
from ..services.save_service import SaveService
from ..schemas.save import (
    SaveCreate,
    SaveMetadata,
    SaveResponse,
    SaveListResponse,
    SaveSlotInfo,
)

router = APIRouter(prefix="/api/saves", tags=["saves"])


@router.get("", response_model=SaveListResponse)
async def list_saves(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """List all saves for the current user."""
    service = SaveService(db)
    saves = await service.list_saves(current_user.id)
    return SaveListResponse(
        saves=[SaveMetadata.model_validate(s) for s in saves],
        max_slots=MAX_SAVE_SLOTS,
    )


@router.get("/slots")
async def get_all_slots(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get information about all save slots (including empty ones)."""
    service = SaveService(db)
    slot_info = await service.get_slot_info(current_user.id)

    # Convert saves to metadata schemas
    result = []
    for slot in slot_info:
        save_meta = None
        if slot["save"]:
            save_meta = SaveMetadata.model_validate(slot["save"])
        result.append(SaveSlotInfo(
            slot_number=slot["slot_number"],
            is_empty=slot["is_empty"],
            save=save_meta,
        ))
    return result


@router.get("/{slot}", response_model=SaveResponse)
async def get_save(
    slot: int = Path(..., ge=0, lt=MAX_SAVE_SLOTS, description="Save slot number"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get a specific save by slot number."""
    service = SaveService(db)
    save = await service.get_save(current_user.id, slot)

    if not save:
        raise HTTPException(
            status_code=404,
            detail=f"No save found in slot {slot}",
        )

    return SaveResponse.model_validate(save)


@router.post("/{slot}", response_model=SaveResponse)
async def create_or_update_save(
    data: SaveCreate,
    slot: int = Path(..., ge=0, lt=MAX_SAVE_SLOTS, description="Save slot number"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Create or update a save in the specified slot."""
    service = SaveService(db)
    save = await service.create_or_update_save(current_user.id, slot, data)

    if not save:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid slot number: {slot}",
        )

    return SaveResponse.model_validate(save)


@router.delete("/{slot}")
async def delete_save(
    slot: int = Path(..., ge=0, lt=MAX_SAVE_SLOTS, description="Save slot number"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Delete a save from the specified slot."""
    service = SaveService(db)
    deleted = await service.delete_save(current_user.id, slot)

    if not deleted:
        raise HTTPException(
            status_code=404,
            detail=f"No save found in slot {slot}",
        )

    return {"message": f"Save in slot {slot} deleted successfully"}
