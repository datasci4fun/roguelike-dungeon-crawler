"""
Level Editor API - Dungeon generation and zone configuration endpoints.

Provides tools for the Level Editor dev page:
- Generate dungeons with specific seeds for deterministic replay
- View and edit zone configurations
- Export configurations as Python code
"""

import sys
import os
import random
from typing import List, Dict, Optional, Any
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field

from ..api.dbexplorer import require_debug

# Add game source parent to path for importing engine as a package
# In Docker: /app (parent of game_src), Local: ../../../.. (parent of src)
game_parent_paths = [
    "/app",  # Docker: game_src is mounted here
    os.path.join(os.path.dirname(__file__), "..", "..", "..", ".."),  # Local dev
]
for path in game_parent_paths:
    abs_path = os.path.abspath(path)
    if os.path.exists(abs_path) and abs_path not in sys.path:
        sys.path.insert(0, abs_path)

# Try to import game modules
GAME_MODULES_AVAILABLE = False
Dungeon = None
get_floor_config = None
FLOOR_ZONE_CONFIGS = None

try:
    # Docker: src is mounted as game_src
    from game_src.world.dungeon import Dungeon
    from game_src.world.zone_config import get_floor_config, FLOOR_ZONE_CONFIGS
    from game_src.core.constants import DungeonTheme, LEVEL_THEMES, THEME_TILES
    from game_src.core.constants.interactive import SetPieceType
    GAME_MODULES_AVAILABLE = True
except ImportError:
    try:
        # Local: use src directly
        from src.world.dungeon import Dungeon
        from src.world.zone_config import get_floor_config, FLOOR_ZONE_CONFIGS
        from src.core.constants import DungeonTheme, LEVEL_THEMES, THEME_TILES
        from src.core.constants.interactive import SetPieceType
        GAME_MODULES_AVAILABLE = True
    except ImportError as e:
        print(f"Warning: Could not import game modules for editor: {e}")

router = APIRouter(prefix="/api/editor", tags=["editor"])


# =============================================================================
# Pydantic Models
# =============================================================================

class RoomModel(BaseModel):
    """Serialized room data."""
    id: int
    x: int
    y: int
    width: int
    height: int
    zone: str
    room_type: str


class InteractiveTileModel(BaseModel):
    """Serialized interactive tile data."""
    x: int
    y: int
    type: str
    subtype: Optional[str] = None
    wall_face: Optional[str] = None
    examine_text: Optional[str] = None
    state: Optional[str] = None


class TileVisualModel(BaseModel):
    """Serialized tile visual data."""
    x: int
    y: int
    elevation: Optional[float] = None
    slope_direction: Optional[str] = None
    set_piece_type: Optional[str] = None
    set_piece_rotation: Optional[float] = None
    set_piece_scale: Optional[float] = None


class ZoneSpecModel(BaseModel):
    """Serialized zone specification."""
    zone_id: str
    weight: int = 1
    required_count: int = 0
    selection_rule: str = ""
    eligibility_description: Optional[str] = None


class FloorZoneConfigModel(BaseModel):
    """Serialized floor zone configuration."""
    floor_level: int
    start_zone: str
    boss_approach_count: int
    fallback_zone: str
    zones: List[ZoneSpecModel]


class GeneratedDungeonResponse(BaseModel):
    """Response containing a generated dungeon for the editor."""
    seed: int
    floor: int
    width: int
    height: int
    tiles: List[List[str]]
    rooms: List[RoomModel]
    zone_config: FloorZoneConfigModel
    interactives: List[InteractiveTileModel]
    tile_visuals: List[TileVisualModel]
    zone_summary: str
    generated_at: str


class ZoneConfigsResponse(BaseModel):
    """Response containing all floor zone configurations."""
    configs: Dict[int, FloorZoneConfigModel]


class SetPieceInstance(BaseModel):
    """A set piece placed in the level."""
    x: int
    y: int
    type: str
    rotation: float = 0
    scale: float = 1.0


class EditorExportRequest(BaseModel):
    """Request to export editor state as Python code."""
    floor: int
    seed: int
    zone_name: str = "custom_zone"
    set_pieces: List[SetPieceInstance] = Field(default_factory=list)
    zone_overrides: Dict[int, str] = Field(default_factory=dict)


class ExportPythonResponse(BaseModel):
    """Response containing exported Python code."""
    code: str
    filename: str


# =============================================================================
# Helper Functions
# =============================================================================

def serialize_room(room, room_id: int) -> RoomModel:
    """Serialize a Room object to a Pydantic model."""
    return RoomModel(
        id=room_id,
        x=room.x,
        y=room.y,
        width=room.width,
        height=room.height,
        zone=room.zone,
        room_type=room.room_type.name if hasattr(room.room_type, 'name') else str(room.room_type),
    )


def serialize_interactive(x: int, y: int, interactive) -> InteractiveTileModel:
    """Serialize an InteractiveTile to a Pydantic model."""
    return InteractiveTileModel(
        x=x,
        y=y,
        type=interactive.type.name if hasattr(interactive.type, 'name') else str(interactive.type),
        subtype=interactive.subtype if hasattr(interactive, 'subtype') else None,
        wall_face=interactive.wall_face.name if hasattr(interactive, 'wall_face') and interactive.wall_face else None,
        examine_text=interactive.examine_text if hasattr(interactive, 'examine_text') else None,
        state=interactive.state if hasattr(interactive, 'state') else None,
    )


def serialize_tile_visual(x: int, y: int, visual) -> TileVisualModel:
    """Serialize a TileVisual to a Pydantic model."""
    return TileVisualModel(
        x=x,
        y=y,
        elevation=visual.elevation if hasattr(visual, 'elevation') else None,
        slope_direction=visual.slope_direction.name if hasattr(visual, 'slope_direction') and visual.slope_direction else None,
        set_piece_type=visual.set_piece_type.name if hasattr(visual, 'set_piece_type') and visual.set_piece_type else None,
        set_piece_rotation=visual.set_piece_rotation if hasattr(visual, 'set_piece_rotation') else None,
        set_piece_scale=visual.set_piece_scale if hasattr(visual, 'set_piece_scale') else None,
    )


def get_eligibility_description(eligibility_func) -> Optional[str]:
    """Get a human-readable description of an eligibility function."""
    if eligibility_func is None:
        return "Any room eligible"

    # Try to extract info from closure
    if hasattr(eligibility_func, '__closure__') and eligibility_func.__closure__:
        cells = eligibility_func.__closure__
        if len(cells) >= 2:
            try:
                min_w = cells[0].cell_contents
                min_h = cells[1].cell_contents
                if eligibility_func.__name__ == 'check':
                    # Could be min_size or elongated
                    return f"Size constraint: {min_w}x{min_h}"
            except (AttributeError, IndexError):
                pass

    # Fallback to function name
    if hasattr(eligibility_func, '__name__'):
        if eligibility_func.__name__ == 'any_room':
            return "Any room eligible"
        return f"Custom: {eligibility_func.__name__}"

    return "Custom eligibility rule"


def serialize_zone_spec(spec) -> ZoneSpecModel:
    """Serialize a ZoneSpec to a Pydantic model."""
    return ZoneSpecModel(
        zone_id=spec.zone_id,
        weight=spec.weight,
        required_count=spec.required_count,
        selection_rule=spec.selection_rule,
        eligibility_description=get_eligibility_description(spec.eligibility),
    )


def serialize_floor_config(config) -> FloorZoneConfigModel:
    """Serialize a FloorZoneConfig to a Pydantic model."""
    return FloorZoneConfigModel(
        floor_level=config.floor_level,
        start_zone=config.start_zone,
        boss_approach_count=config.boss_approach_count,
        fallback_zone=config.fallback_zone,
        zones=[serialize_zone_spec(z) for z in config.zones],
    )


# =============================================================================
# API Endpoints
# =============================================================================

@router.get("/generate", response_model=GeneratedDungeonResponse)
async def generate_dungeon(
    floor: int = Query(1, ge=1, le=8, description="Floor level (1-8)"),
    seed: Optional[int] = Query(None, description="Random seed for deterministic generation"),
    _: None = Depends(require_debug),
):
    """
    Generate a dungeon and return its full structure for the editor.

    - Use a specific seed for reproducible results
    - Returns tiles, rooms, zones, interactives, and visual data
    """
    if not GAME_MODULES_AVAILABLE:
        raise HTTPException(status_code=500, detail="Game modules not available")

    # Use provided seed or generate one
    if seed is None:
        seed = random.randint(0, 2**31 - 1)

    # Generate dungeon
    try:
        dungeon = Dungeon(level=floor, seed=seed)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Dungeon generation failed: {e}")

    # Serialize tiles
    tiles = [[tile.value if hasattr(tile, 'value') else str(tile) for tile in row] for row in dungeon.tiles]

    # Serialize rooms
    rooms = [serialize_room(room, i) for i, room in enumerate(dungeon.rooms)]

    # Serialize interactives
    interactives = [
        serialize_interactive(x, y, interactive)
        for (x, y), interactive in dungeon.interactive_tiles.items()
    ]

    # Serialize tile visuals
    tile_visuals = [
        serialize_tile_visual(x, y, visual)
        for (x, y), visual in dungeon.tile_visuals.items()
    ]

    # Get zone config
    floor_config = get_floor_config(floor)
    if floor_config:
        zone_config = serialize_floor_config(floor_config)
    else:
        # Fallback config
        zone_config = FloorZoneConfigModel(
            floor_level=floor,
            start_zone="generic",
            boss_approach_count=2,
            fallback_zone="generic",
            zones=[],
        )

    # Get zone summary
    zone_summary = dungeon.get_zone_summary() if hasattr(dungeon, 'get_zone_summary') else ""

    return GeneratedDungeonResponse(
        seed=seed,
        floor=floor,
        width=dungeon.width,
        height=dungeon.height,
        tiles=tiles,
        rooms=rooms,
        zone_config=zone_config,
        interactives=interactives,
        tile_visuals=tile_visuals,
        zone_summary=zone_summary,
        generated_at=datetime.utcnow().isoformat() + "Z",
    )


@router.get("/zone-configs", response_model=ZoneConfigsResponse)
async def get_zone_configs(_: None = Depends(require_debug)):
    """
    Get zone configurations for all floors.

    Returns the zone specs, eligibility rules, and weights for each floor.
    """
    if not GAME_MODULES_AVAILABLE:
        raise HTTPException(status_code=500, detail="Game modules not available")

    configs = {
        floor: serialize_floor_config(config)
        for floor, config in FLOOR_ZONE_CONFIGS.items()
    }

    return ZoneConfigsResponse(configs=configs)


@router.get("/zones/{floor}")
async def get_floor_zones(
    floor: int,
    _: None = Depends(require_debug),
):
    """
    Get zone configuration for a specific floor.
    """
    if not GAME_MODULES_AVAILABLE:
        raise HTTPException(status_code=500, detail="Game modules not available")

    config = get_floor_config(floor)
    if not config:
        raise HTTPException(status_code=404, detail=f"No zone configuration for floor {floor}")

    return serialize_floor_config(config)


@router.post("/export/python", response_model=ExportPythonResponse)
async def export_as_python(
    request: EditorExportRequest,
    _: None = Depends(require_debug),
):
    """
    Export level editor state as Python zone layout code.

    Generates code that can be added to zone_layouts_*.py files.
    """
    lines = [
        f"@register_layout({request.floor}, \"{request.zone_name}\")",
        f"def layout_{request.zone_name}(dungeon: 'Dungeon', room: 'Room'):",
        f'    """Generated from Level Editor - seed {request.seed}"""',
    ]

    if not request.set_pieces:
        lines.append("    pass  # No set pieces placed")
    else:
        lines.append("    from ..core.constants import SetPieceType, TileVisual")
        lines.append("")

        for piece in request.set_pieces:
            piece_type = piece.type.upper()
            lines.append(f"    # {piece.type} at ({piece.x}, {piece.y})")
            lines.append(f"    dungeon.set_tile_visual({piece.x}, {piece.y}, TileVisual.with_set_piece(")
            lines.append(f"        piece_type=SetPieceType.{piece_type},")
            if piece.rotation != 0:
                lines.append(f"        rotation={piece.rotation},")
            if piece.scale != 1.0:
                lines.append(f"        scale={piece.scale},")
            lines.append("    ))")
            lines.append("")

    code = "\n".join(lines)
    filename = f"zone_layout_{request.zone_name}_floor{request.floor}.py"

    return ExportPythonResponse(code=code, filename=filename)


@router.get("/set-piece-types")
async def get_set_piece_types(_: None = Depends(require_debug)):
    """
    Get available set piece types.
    """
    if not GAME_MODULES_AVAILABLE:
        raise HTTPException(status_code=500, detail="Game modules not available")

    types = [
        {"id": t.name, "value": t.value}
        for t in SetPieceType
        if t.name != "NONE"
    ]

    return {"types": types}


@router.get("/themes")
async def get_dungeon_themes(_: None = Depends(require_debug)):
    """
    Get dungeon themes and their tile mappings.
    """
    if not GAME_MODULES_AVAILABLE:
        raise HTTPException(status_code=500, detail="Game modules not available")

    themes = {
        floor: theme.name
        for floor, theme in LEVEL_THEMES.items()
    }

    theme_tiles = {
        theme.name: tiles
        for theme, tiles in THEME_TILES.items()
    }

    return {
        "level_themes": themes,
        "theme_tiles": theme_tiles,
    }
