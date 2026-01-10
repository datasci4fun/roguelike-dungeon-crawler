"""Zone layout decorators registry.

Layout decorators modify room geometry based on zone type.
Each decorator takes (dungeon, room) and modifies tiles in-place.
"""
import random
from typing import Callable, Dict, Tuple, TYPE_CHECKING

if TYPE_CHECKING:
    from .dungeon import Dungeon, Room

# Registry: (floor_level, zone_id) -> layout_handler
# Handler signature: (dungeon, room) -> None
ZONE_LAYOUTS: Dict[Tuple[int, str], Callable[['Dungeon', 'Room'], None]] = {}


def register_layout(floor: int, zone_id: str):
    """Decorator to register a zone layout handler."""
    def decorator(func: Callable[['Dungeon', 'Room'], None]):
        ZONE_LAYOUTS[(floor, zone_id)] = func
        return func
    return decorator


def apply_zone_layout(dungeon: 'Dungeon', room: 'Room'):
    """Apply the appropriate layout decorator for a room's zone."""
    key = (dungeon.level, room.zone)
    handler = ZONE_LAYOUTS.get(key)
    if handler:
        handler(dungeon, room)


# =============================================================================
# FLOOR 1: Stone Dungeon Layouts
# =============================================================================

@register_layout(1, "cell_blocks")
def layout_cell_blocks(dungeon: 'Dungeon', room: 'Room'):
    """Create prison cells with interior walls and doors.

    Creates 2x3 cells along the sides with a central corridor.
    ~30% of cell doors are DOOR_LOCKED, rest are DOOR_UNLOCKED.
    """
    from ..core.constants import TileType

    # Minimum room size for cell layout
    if room.width < 8 or room.height < 6:
        return

    corridor_width = 2
    cell_height = 3

    # Number of cells that fit on each side
    num_cells_vertical = (room.height - 2) // cell_height

    # Central corridor position
    corridor_start_x = room.x + (room.width // 2) - (corridor_width // 2)

    # Build cells on left side
    left_wall_x = corridor_start_x - 1
    for i in range(num_cells_vertical):
        cell_y = room.y + 1 + (i * cell_height)

        if cell_y + cell_height > room.y + room.height - 1:
            break

        # Cell back wall
        for cy in range(cell_y, min(cell_y + cell_height, room.y + room.height - 1)):
            if left_wall_x >= room.x + 1 and left_wall_x < room.x + room.width - 1:
                dungeon.tiles[cy][left_wall_x] = TileType.WALL

        # Cell door
        door_y = cell_y + cell_height // 2
        if door_y < room.y + room.height - 1 and left_wall_x >= room.x:
            if random.random() < 0.3:
                dungeon.tiles[door_y][left_wall_x] = TileType.DOOR_LOCKED
            else:
                dungeon.tiles[door_y][left_wall_x] = TileType.DOOR_UNLOCKED

        # Horizontal cell dividers
        if i < num_cells_vertical - 1:
            divider_y = cell_y + cell_height
            if divider_y < room.y + room.height - 1:
                for dx in range(room.x + 1, left_wall_x):
                    if dx < room.x + room.width - 1:
                        dungeon.tiles[divider_y][dx] = TileType.WALL

    # Build cells on right side (mirror)
    right_wall_x = corridor_start_x + corridor_width
    for i in range(num_cells_vertical):
        cell_y = room.y + 1 + (i * cell_height)

        if cell_y + cell_height > room.y + room.height - 1:
            break

        # Cell back wall
        for cy in range(cell_y, min(cell_y + cell_height, room.y + room.height - 1)):
            if right_wall_x >= room.x + 1 and right_wall_x < room.x + room.width - 1:
                dungeon.tiles[cy][right_wall_x] = TileType.WALL

        # Cell door
        door_y = cell_y + cell_height // 2
        if door_y < room.y + room.height - 1 and right_wall_x < room.x + room.width:
            if random.random() < 0.3:
                dungeon.tiles[door_y][right_wall_x] = TileType.DOOR_LOCKED
            else:
                dungeon.tiles[door_y][right_wall_x] = TileType.DOOR_UNLOCKED

        # Horizontal cell dividers
        if i < num_cells_vertical - 1:
            divider_y = cell_y + cell_height
            if divider_y < room.y + room.height - 1:
                for dx in range(right_wall_x + 1, room.x + room.width - 1):
                    dungeon.tiles[divider_y][dx] = TileType.WALL


# =============================================================================
# FLOOR 2: Sewer Layouts
# =============================================================================

@register_layout(2, "waste_channels")
def layout_waste_channels(dungeon: 'Dungeon', room: 'Room'):
    """Create water channel lanes with walkways.

    Paints a DEEP_WATER lane through the room with safe walkway paths.
    Guarantees at least one safe route from each entrance.
    """
    from ..core.constants import TileType

    # Need elongated room for channel
    if room.width < 6 and room.height < 6:
        return

    # Determine channel orientation based on room shape
    if room.width > room.height:
        # Horizontal channel
        channel_y = room.y + room.height // 2
        # Leave 1-tile walkways on top and bottom edges
        for x in range(room.x + 1, room.x + room.width - 1):
            # Paint channel, but preserve floor at edges for walkways
            if channel_y > room.y + 1 and channel_y < room.y + room.height - 2:
                dungeon.tiles[channel_y][x] = TileType.DEEP_WATER
                # Optional second row of water for wider channels
                if room.height >= 6 and random.random() < 0.5:
                    if channel_y + 1 < room.y + room.height - 2:
                        dungeon.tiles[channel_y + 1][x] = TileType.DEEP_WATER
    else:
        # Vertical channel
        channel_x = room.x + room.width // 2
        for y in range(room.y + 1, room.y + room.height - 1):
            if channel_x > room.x + 1 and channel_x < room.x + room.width - 2:
                dungeon.tiles[y][channel_x] = TileType.DEEP_WATER
                if room.width >= 6 and random.random() < 0.5:
                    if channel_x + 1 < room.x + room.width - 2:
                        dungeon.tiles[y][channel_x + 1] = TileType.DEEP_WATER


@register_layout(2, "colony_heart")
def layout_colony_heart(dungeon: 'Dungeon', room: 'Room'):
    """Create the Colony Heart anchor room.

    Central nest structure with debris rings. No hazards that block movement.
    """
    from ..core.constants import TileType

    if room.width < 7 or room.height < 7:
        return

    # Create a "nest ring" using shallow water patches at corners
    # This suggests debris/waste accumulation without blocking
    cx, cy = room.center()

    # Small water patches in corners (debris pools)
    corners = [
        (room.x + 1, room.y + 1),
        (room.x + room.width - 2, room.y + 1),
        (room.x + 1, room.y + room.height - 2),
        (room.x + room.width - 2, room.y + room.height - 2),
    ]
    for x, y in corners:
        if dungeon.tiles[y][x] == TileType.FLOOR:
            dungeon.tiles[y][x] = TileType.DEEP_WATER


@register_layout(2, "carrier_nests")
def layout_carrier_nests(dungeon: 'Dungeon', room: 'Room'):
    """Create carrier nest areas.

    Small debris patches suggesting rat nesting areas.
    """
    from ..core.constants import TileType

    if room.width < 5 or room.height < 5:
        return

    # Add 1-2 small water patches as debris/waste
    num_patches = random.randint(1, 2)
    for _ in range(num_patches):
        px = random.randint(room.x + 1, room.x + room.width - 2)
        py = random.randint(room.y + 1, room.y + room.height - 2)
        if dungeon.tiles[py][px] == TileType.FLOOR:
            dungeon.tiles[py][px] = TileType.DEEP_WATER
