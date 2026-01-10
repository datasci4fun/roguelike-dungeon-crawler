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


@register_layout(2, "seal_drifts")
def layout_seal_drifts(dungeon: 'Dungeon', room: 'Room'):
    """Create seal drift areas with surface debris accumulation.

    Scattered shallow water patches representing surface runoff deposits.
    """
    from ..core.constants import TileType

    if room.width < 5 or room.height < 5:
        return

    # Scatter 2-3 small debris patches (surface detritus)
    num_patches = random.randint(2, 3)
    for _ in range(num_patches):
        px = random.randint(room.x + 1, room.x + room.width - 2)
        py = random.randint(room.y + 1, room.y + room.height - 2)
        if dungeon.tiles[py][px] == TileType.FLOOR:
            dungeon.tiles[py][px] = TileType.DEEP_WATER


@register_layout(2, "diseased_pools")
def layout_diseased_pools(dungeon: 'Dungeon', room: 'Room'):
    """Create diseased pool areas with stagnant water.

    Larger water patches representing contaminated pools.
    """
    from ..core.constants import TileType

    if room.width < 5 or room.height < 5:
        return

    # Create a central pool of water (2x2 or 3x3)
    cx = room.x + room.width // 2
    cy = room.y + room.height // 2

    pool_size = 2 if room.width < 7 or room.height < 7 else 3

    for dx in range(pool_size):
        for dy in range(pool_size):
            px = cx - pool_size // 2 + dx
            py = cy - pool_size // 2 + dy
            if (room.x + 1 <= px < room.x + room.width - 1 and
                room.y + 1 <= py < room.y + room.height - 1):
                if dungeon.tiles[py][px] == TileType.FLOOR:
                    dungeon.tiles[py][px] = TileType.DEEP_WATER


@register_layout(2, "maintenance_tunnels")
def layout_maintenance_tunnels(dungeon: 'Dungeon', room: 'Room'):
    """Maintenance tunnels - minimal decoration.

    Clean corridors with occasional water drips.
    """
    from ..core.constants import TileType

    # Only add sparse decoration to larger rooms
    if room.width < 6 and room.height < 6:
        return

    # 30% chance for a single water drip patch
    if random.random() < 0.3:
        px = random.randint(room.x + 1, room.x + room.width - 2)
        py = random.randint(room.y + 1, room.y + room.height - 2)
        if dungeon.tiles[py][px] == TileType.FLOOR:
            dungeon.tiles[py][px] = TileType.DEEP_WATER


@register_layout(2, "confluence_chambers")
def layout_confluence_chambers(dungeon: 'Dungeon', room: 'Room'):
    """Confluence chambers - start zone where water flows converge.

    Central water feature with walkable edges.
    """
    from ..core.constants import TileType

    if room.width < 6 or room.height < 6:
        return

    # Central shallow water patch (2x2) to suggest flow convergence
    cx = room.x + room.width // 2
    cy = room.y + room.height // 2

    for dx in range(-1, 1):
        for dy in range(-1, 1):
            px = cx + dx
            py = cy + dy
            if (room.x + 2 <= px < room.x + room.width - 2 and
                room.y + 2 <= py < room.y + room.height - 2):
                if dungeon.tiles[py][px] == TileType.FLOOR:
                    dungeon.tiles[py][px] = TileType.DEEP_WATER


# =============================================================================
# FLOOR 3: Forest Depths Layouts
# =============================================================================

@register_layout(3, "root_warrens")
def layout_root_warrens(dungeon: 'Dungeon', room: 'Room'):
    """Create root warren chokepoints.

    Thin interior partitions that create tactical chokepoints
    while preserving connectivity (2-tile-wide routes).
    """
    from ..core.constants import TileType

    # Need elongated room for meaningful chokepoints
    if room.width < 8 and room.height < 8:
        return

    # Determine orientation based on room shape
    if room.width > room.height:
        # Horizontal room - add vertical partition
        partition_x = room.x + room.width // 2
        # Leave 2-tile gap at top and bottom for passage
        for y in range(room.y + 3, room.y + room.height - 3):
            if random.random() < 0.6:  # 60% fill for organic feel
                dungeon.tiles[y][partition_x] = TileType.WALL
    else:
        # Vertical room - add horizontal partition
        partition_y = room.y + room.height // 2
        for x in range(room.x + 3, room.x + room.width - 3):
            if random.random() < 0.6:
                dungeon.tiles[partition_y][x] = TileType.WALL


@register_layout(3, "canopy_halls")
def layout_canopy_halls(dungeon: 'Dungeon', room: 'Room'):
    """Create canopy hall landmark room.

    Open center, decoration "trunk" positions along edges.
    Optional water pool in corner.
    """
    from ..core.constants import TileType

    if room.width < 8 or room.height < 8:
        return

    # Add small water pool in one corner (underground spring)
    if random.random() < 0.5:
        corner = random.choice(['nw', 'ne', 'sw', 'se'])
        if corner == 'nw':
            px, py = room.x + 1, room.y + 1
        elif corner == 'ne':
            px, py = room.x + room.width - 2, room.y + 1
        elif corner == 'sw':
            px, py = room.x + 1, room.y + room.height - 2
        else:
            px, py = room.x + room.width - 2, room.y + room.height - 2

        # 2x2 water pool
        for dx in range(2):
            for dy in range(2):
                tx, ty = px + dx, py + dy
                if (room.x + 1 <= tx < room.x + room.width - 1 and
                    room.y + 1 <= ty < room.y + room.height - 1):
                    if dungeon.tiles[ty][tx] == TileType.FLOOR:
                        dungeon.tiles[ty][tx] = TileType.DEEP_WATER


@register_layout(3, "webbed_gardens")
def layout_webbed_gardens(dungeon: 'Dungeon', room: 'Room'):
    """Create webbed garden trap room.

    1-3 trap tiles to simulate web traps, ensuring safe route exists.
    """
    from ..core.constants import TileType

    if room.width < 6 or room.height < 6:
        return

    # Place 1-3 visible traps (using TRAP_VISIBLE if available, else skip)
    # For now, we'll use DEEP_WATER as hazard stand-in
    num_traps = random.randint(1, 3)
    for _ in range(num_traps):
        # Place traps away from edges to ensure safe paths exist
        tx = random.randint(room.x + 2, room.x + room.width - 3)
        ty = random.randint(room.y + 2, room.y + room.height - 3)
        if dungeon.tiles[ty][tx] == TileType.FLOOR:
            dungeon.tiles[ty][tx] = TileType.DEEP_WATER


@register_layout(3, "the_nursery")
def layout_the_nursery(dungeon: 'Dungeon', room: 'Room'):
    """Create the_nursery high-danger room.

    Heavy decoration density around edges (egg clusters),
    keep center navigable.
    """
    from ..core.constants import TileType

    if room.width < 8 or room.height < 8:
        return

    # Add scattered hazards around edges (hatch points)
    num_hazards = random.randint(2, 4)
    for _ in range(num_hazards):
        # Place along edges but not blocking entrances
        edge = random.choice(['n', 's', 'e', 'w'])
        if edge == 'n':
            tx = random.randint(room.x + 2, room.x + room.width - 3)
            ty = room.y + 1
        elif edge == 's':
            tx = random.randint(room.x + 2, room.x + room.width - 3)
            ty = room.y + room.height - 2
        elif edge == 'e':
            tx = room.x + room.width - 2
            ty = random.randint(room.y + 2, room.y + room.height - 3)
        else:
            tx = room.x + 1
            ty = random.randint(room.y + 2, room.y + room.height - 3)

        if dungeon.tiles[ty][tx] == TileType.FLOOR:
            dungeon.tiles[ty][tx] = TileType.DEEP_WATER


@register_layout(3, "digestion_chambers")
def layout_digestion_chambers(dungeon: 'Dungeon', room: 'Room'):
    """Create digestion chamber hazard room.

    Patchy hazard areas with guaranteed safe route.
    """
    from ..core.constants import TileType

    if room.width < 6 or room.height < 6:
        return

    # Create a central hazard pool (digestive pit)
    cx = room.x + room.width // 2
    cy = room.y + room.height // 2

    pool_size = 2 if room.width < 8 else 3

    for dx in range(pool_size):
        for dy in range(pool_size):
            px = cx - pool_size // 2 + dx
            py = cy - pool_size // 2 + dy
            if (room.x + 2 <= px < room.x + room.width - 2 and
                room.y + 2 <= py < room.y + room.height - 2):
                if dungeon.tiles[py][px] == TileType.FLOOR:
                    dungeon.tiles[py][px] = TileType.DEEP_WATER


@register_layout(3, "druid_ring")
def layout_druid_ring(dungeon: 'Dungeon', room: 'Room'):
    """Create druid ring anchor room.

    Clear center with decorations arranged in a ring pattern.
    Uses water tiles to mark the ritual ring.
    """
    from ..core.constants import TileType

    if room.width < 8 or room.height < 8:
        return

    cx = room.x + room.width // 2
    cy = room.y + room.height // 2

    # Create a ring of water tiles around center (ritual marking)
    radius = min(room.width, room.height) // 3
    for angle in range(0, 360, 45):  # 8 points around the ring
        import math
        rad = math.radians(angle)
        rx = int(cx + radius * math.cos(rad))
        ry = int(cy + radius * math.sin(rad))
        if (room.x + 1 <= rx < room.x + room.width - 1 and
            room.y + 1 <= ry < room.y + room.height - 1):
            if dungeon.tiles[ry][rx] == TileType.FLOOR:
                dungeon.tiles[ry][rx] = TileType.DEEP_WATER


# =============================================================================
# FLOOR 4: Mirror Valdris Layouts
# =============================================================================

@register_layout(4, "throne_hall_ruins")
def layout_throne_hall_ruins(dungeon: 'Dungeon', room: 'Room'):
    """Create throne hall anchor room.

    Symmetrical layout with focal "throne end" via denser decorations.
    Creates aisle feel with clear central route.
    """
    from ..core.constants import TileType

    if room.width < 10 or room.height < 8:
        return

    # Determine throne end (far end from most likely entrance)
    # Use simple heuristic: throne at top or right depending on orientation
    if room.width > room.height:
        # Horizontal room - throne at right end
        # Place symmetric water markers along the "aisle"
        aisle_y = room.y + room.height // 2
        for x in range(room.x + 2, room.x + room.width - 4, 3):
            # Top and bottom of aisle
            if room.y + 2 < aisle_y - 1:
                dungeon.tiles[aisle_y - 2][x] = TileType.DEEP_WATER
            if aisle_y + 2 < room.y + room.height - 1:
                dungeon.tiles[aisle_y + 2][x] = TileType.DEEP_WATER
    else:
        # Vertical room - throne at bottom
        aisle_x = room.x + room.width // 2
        for y in range(room.y + 2, room.y + room.height - 4, 3):
            if room.x + 2 < aisle_x - 1:
                dungeon.tiles[y][aisle_x - 2] = TileType.DEEP_WATER
            if aisle_x + 2 < room.x + room.width - 1:
                dungeon.tiles[y][aisle_x + 2] = TileType.DEEP_WATER


@register_layout(4, "oath_chambers")
def layout_oath_chambers(dungeon: 'Dungeon', room: 'Room'):
    """Create oath chamber anchor room.

    Ring geometry with clear center (oathstone location).
    """
    from ..core.constants import TileType
    import math

    if room.width < 7 or room.height < 7:
        return

    cx = room.x + room.width // 2
    cy = room.y + room.height // 2

    # Create ring pattern (similar to druid_ring)
    radius = min(room.width, room.height) // 3
    for angle in range(0, 360, 45):
        rad = math.radians(angle)
        rx = int(cx + radius * math.cos(rad))
        ry = int(cy + radius * math.sin(rad))
        if (room.x + 1 <= rx < room.x + room.width - 1 and
            room.y + 1 <= ry < room.y + room.height - 1):
            if dungeon.tiles[ry][rx] == TileType.FLOOR:
                dungeon.tiles[ry][rx] = TileType.DEEP_WATER


@register_layout(4, "courtyard_squares")
def layout_courtyard_squares(dungeon: 'Dungeon', room: 'Room'):
    """Create courtyard plaza room.

    Symmetrical layout with optional central fountain.
    """
    from ..core.constants import TileType

    if room.width < 8 or room.height < 8:
        return

    cx = room.x + room.width // 2
    cy = room.y + room.height // 2

    # 60% chance for central fountain (3x3 water pool)
    if random.random() < 0.6:
        for dx in range(-1, 2):
            for dy in range(-1, 2):
                px = cx + dx
                py = cy + dy
                if (room.x + 2 <= px < room.x + room.width - 2 and
                    room.y + 2 <= py < room.y + room.height - 2):
                    if dungeon.tiles[py][px] == TileType.FLOOR:
                        dungeon.tiles[py][px] = TileType.DEEP_WATER


@register_layout(4, "seal_chambers")
def layout_seal_chambers(dungeon: 'Dungeon', room: 'Room'):
    """Create seal chamber bureaucracy room.

    Workstation clusters implied by corner decorations.
    """
    from ..core.constants import TileType

    if room.width < 6 or room.height < 6:
        return

    # Place "workstation" water patches in corners (wax pools / ink)
    corners = [
        (room.x + 2, room.y + 2),
        (room.x + room.width - 3, room.y + 2),
        (room.x + 2, room.y + room.height - 3),
        (room.x + room.width - 3, room.y + room.height - 3),
    ]
    # Use 2-3 corners
    for x, y in random.sample(corners, min(3, len(corners))):
        if dungeon.tiles[y][x] == TileType.FLOOR:
            dungeon.tiles[y][x] = TileType.DEEP_WATER


@register_layout(4, "record_vaults")
def layout_record_vaults(dungeon: 'Dungeon', room: 'Room'):
    """Create record vault archive room.

    Shelf row feel via partitioned wall stubs.
    """
    from ..core.constants import TileType

    if room.width < 6 or room.height < 6:
        return

    # Create shelf rows (short wall segments)
    if room.width > room.height:
        # Horizontal room - vertical shelves
        for x in range(room.x + 3, room.x + room.width - 3, 4):
            for y in range(room.y + 2, room.y + room.height - 2):
                if random.random() < 0.4:
                    dungeon.tiles[y][x] = TileType.WALL
    else:
        # Vertical room - horizontal shelves
        for y in range(room.y + 3, room.y + room.height - 3, 4):
            for x in range(room.x + 2, room.x + room.width - 2):
                if random.random() < 0.4:
                    dungeon.tiles[y][x] = TileType.WALL


@register_layout(4, "parade_corridors")
def layout_parade_corridors(dungeon: 'Dungeon', room: 'Room'):
    """Create parade corridor with symmetrical markers.

    Regular interval decorations in mirrored pairs.
    """
    from ..core.constants import TileType

    if room.width < 10 and room.height < 10:
        return

    # Place symmetric water markers at regular intervals
    if room.width > room.height:
        # Horizontal corridor
        center_y = room.y + room.height // 2
        for x in range(room.x + 2, room.x + room.width - 2, 4):
            # Mirrored pair
            if center_y - 1 > room.y and center_y + 1 < room.y + room.height - 1:
                if dungeon.tiles[center_y - 1][x] == TileType.FLOOR:
                    dungeon.tiles[center_y - 1][x] = TileType.DEEP_WATER
                if dungeon.tiles[center_y + 1][x] == TileType.FLOOR:
                    dungeon.tiles[center_y + 1][x] = TileType.DEEP_WATER
    else:
        # Vertical corridor
        center_x = room.x + room.width // 2
        for y in range(room.y + 2, room.y + room.height - 2, 4):
            if center_x - 1 > room.x and center_x + 1 < room.x + room.width - 1:
                if dungeon.tiles[y][center_x - 1] == TileType.FLOOR:
                    dungeon.tiles[y][center_x - 1] = TileType.DEEP_WATER
                if dungeon.tiles[y][center_x + 1] == TileType.FLOOR:
                    dungeon.tiles[y][center_x + 1] = TileType.DEEP_WATER


@register_layout(4, "mausoleum_district")
def layout_mausoleum_district(dungeon: 'Dungeon', room: 'Room'):
    """Create mausoleum crypt room.

    Tomb row feel via decoration lines (sparse water markers).
    """
    from ..core.constants import TileType

    if room.width < 6 or room.height < 6:
        return

    # Create tomb rows (sparse water tiles suggesting sarcophagi)
    for y in range(room.y + 2, room.y + room.height - 2, 3):
        for x in range(room.x + 2, room.x + room.width - 2, 3):
            if random.random() < 0.3:
                if dungeon.tiles[y][x] == TileType.FLOOR:
                    dungeon.tiles[y][x] = TileType.DEEP_WATER
