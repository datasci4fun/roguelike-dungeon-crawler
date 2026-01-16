"""Zone layouts for floors 1-4 (early game).

Stone Dungeon, Sewers, Forest Depths, Mirror Valdris.
"""
import random
from typing import TYPE_CHECKING

from .zone_layouts import register_layout

if TYPE_CHECKING:
    from .dungeon import Dungeon, Room


# =============================================================================
# FLOOR 1: Stone Dungeon Layouts
# =============================================================================

@register_layout(1, "cell_blocks")
def layout_cell_blocks(dungeon: 'Dungeon', room: 'Room'):
    """Create prison cells with interior walls and doors."""
    from ..core.constants import TileType

    if room.width < 8 or room.height < 6:
        return

    corridor_width = 2
    cell_height = 3
    num_cells_vertical = (room.height - 2) // cell_height
    corridor_start_x = room.x + (room.width // 2) - (corridor_width // 2)

    # Build cells on left side
    left_wall_x = corridor_start_x - 1
    for i in range(num_cells_vertical):
        cell_y = room.y + 1 + (i * cell_height)
        if cell_y + cell_height > room.y + room.height - 1:
            break

        for cy in range(cell_y, min(cell_y + cell_height, room.y + room.height - 1)):
            if left_wall_x >= room.x + 1 and left_wall_x < room.x + room.width - 1:
                dungeon.tiles[cy][left_wall_x] = TileType.WALL

        door_y = cell_y + cell_height // 2
        if door_y < room.y + room.height - 1 and left_wall_x >= room.x:
            if random.random() < 0.3:
                dungeon.tiles[door_y][left_wall_x] = TileType.DOOR_LOCKED
            else:
                dungeon.tiles[door_y][left_wall_x] = TileType.DOOR_UNLOCKED

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

        for cy in range(cell_y, min(cell_y + cell_height, room.y + room.height - 1)):
            if right_wall_x >= room.x + 1 and right_wall_x < room.x + room.width - 1:
                dungeon.tiles[cy][right_wall_x] = TileType.WALL

        door_y = cell_y + cell_height // 2
        if door_y < room.y + room.height - 1 and right_wall_x < room.x + room.width:
            if random.random() < 0.3:
                dungeon.tiles[door_y][right_wall_x] = TileType.DOOR_LOCKED
            else:
                dungeon.tiles[door_y][right_wall_x] = TileType.DOOR_UNLOCKED

        if i < num_cells_vertical - 1:
            divider_y = cell_y + cell_height
            if divider_y < room.y + room.height - 1:
                for dx in range(right_wall_x + 1, room.x + room.width - 1):
                    dungeon.tiles[divider_y][dx] = TileType.WALL


@register_layout(1, "wardens_office")
def layout_wardens_office(dungeon: 'Dungeon', room: 'Room'):
    """Create the Warden's Office with a switch sequence puzzle.

    Features:
    - Desk/cabinet area (wall protrusion)
    - 3 switches that must be activated in sequence
    - Hidden door that opens when puzzle is solved
    """
    from ..core.constants import TileType, InteractiveTile, WallFace
    from .puzzles import create_switch_sequence_puzzle

    if room.width < 8 or room.height < 6:
        return

    # Create a small alcove/desk area on one wall
    alcove_x = room.x + room.width - 3
    alcove_y = room.y + 1
    for y in range(alcove_y, min(alcove_y + 2, room.y + room.height - 1)):
        if alcove_x < room.x + room.width - 1:
            dungeon.tiles[y][alcove_x] = TileType.WALL

    # Place 3 switches on the south wall (room.y + room.height - 1 is outer wall)
    # Switches go on north-facing walls visible from inside
    switch_wall_y = room.y + room.height - 1
    switch_positions = []

    switch_x_positions = [
        room.x + 2,
        room.x + room.width // 2,
        room.x + room.width - 3,
    ]

    for i, sx in enumerate(switch_x_positions):
        if 0 <= sx < dungeon.width and 0 <= switch_wall_y < dungeon.height:
            if dungeon.tiles[switch_wall_y][sx] == TileType.WALL:
                switch_positions.append((sx, switch_wall_y))
                switch = InteractiveTile.switch(
                    target=None,  # Target will be set by puzzle
                    wall_face=WallFace.NORTH,
                    examine_text=f"An old lever marked with {['I', 'II', 'III'][i]}.",
                    activate_text="Click.",
                    puzzle_id="wardens_secret",
                )
                dungeon.add_interactive(sx, switch_wall_y, switch)

    # Place hidden door on east wall
    door_x = room.x + room.width - 1
    door_y = room.y + room.height // 2

    if 0 <= door_x < dungeon.width and 0 <= door_y < dungeon.height:
        if dungeon.tiles[door_y][door_x] == TileType.WALL:
            hidden_door = InteractiveTile.hidden_door(
                wall_face=WallFace.WEST,
                examine_text="The wall here has faint scratches...",
            )
            dungeon.add_interactive(door_x, door_y, hidden_door)

            # Create the puzzle
            if len(switch_positions) >= 2:
                puzzle = create_switch_sequence_puzzle(
                    puzzle_id="wardens_secret",
                    switch_positions=switch_positions,
                    door_position=(door_x, door_y),
                    hint="The numbers must mean something...",
                )
                # Add puzzle to dungeon's puzzle manager (will be wired in engine)
                if hasattr(dungeon, '_pending_puzzles'):
                    dungeon._pending_puzzles.append(puzzle)
                else:
                    dungeon._pending_puzzles = [puzzle]


@register_layout(1, "intake_hall")
def layout_intake_hall(dungeon: 'Dungeon', room: 'Room'):
    """Create the Intake Hall - player's starting area.

    Features:
    - Open layout for easy navigation
    - Mural on wall with lore
    - Visual marker for "entrance" behind player
    """
    from ..core.constants import TileType, InteractiveTile, WallFace

    if room.width < 6 or room.height < 5:
        return

    # Add a mural on the north wall
    mural_x = room.x + room.width // 2
    mural_y = room.y  # North wall

    if 0 <= mural_x < dungeon.width and 0 <= mural_y < dungeon.height:
        if dungeon.tiles[mural_y][mural_x] == TileType.WALL:
            mural = InteractiveTile.mural(
                lore_id="LORE_FIRST_EXPEDITION",
                wall_face=WallFace.SOUTH,
                examine_text="A faded fresco shows armored figures descending stone stairs. "
                            "Their faces are worn away, but determination shows in their posture.",
            )
            dungeon.add_interactive(mural_x, mural_y, mural)


# =============================================================================
# FLOOR 2: Sewer Layouts
# =============================================================================

@register_layout(2, "waste_channels")
def layout_waste_channels(dungeon: 'Dungeon', room: 'Room'):
    """Create water channel lanes with walkways."""
    from ..core.constants import TileType

    if room.width < 6 and room.height < 6:
        return

    if room.width > room.height:
        channel_y = room.y + room.height // 2
        for x in range(room.x + 1, room.x + room.width - 1):
            if channel_y > room.y + 1 and channel_y < room.y + room.height - 2:
                dungeon.tiles[channel_y][x] = TileType.DEEP_WATER
                if room.height >= 6 and random.random() < 0.5:
                    if channel_y + 1 < room.y + room.height - 2:
                        dungeon.tiles[channel_y + 1][x] = TileType.DEEP_WATER
    else:
        channel_x = room.x + room.width // 2
        for y in range(room.y + 1, room.y + room.height - 1):
            if channel_x > room.x + 1 and channel_x < room.x + room.width - 2:
                dungeon.tiles[y][channel_x] = TileType.DEEP_WATER
                if room.width >= 6 and random.random() < 0.5:
                    if channel_x + 1 < room.x + room.width - 2:
                        dungeon.tiles[y][channel_x + 1] = TileType.DEEP_WATER


@register_layout(2, "colony_heart")
def layout_colony_heart(dungeon: 'Dungeon', room: 'Room'):
    """Create the Colony Heart anchor room."""
    from ..core.constants import TileType

    if room.width < 7 or room.height < 7:
        return

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
    """Create carrier nest areas."""
    from ..core.constants import TileType

    if room.width < 5 or room.height < 5:
        return

    num_patches = random.randint(1, 2)
    for _ in range(num_patches):
        px = random.randint(room.x + 1, room.x + room.width - 2)
        py = random.randint(room.y + 1, room.y + room.height - 2)
        if dungeon.tiles[py][px] == TileType.FLOOR:
            dungeon.tiles[py][px] = TileType.DEEP_WATER


@register_layout(2, "seal_drifts")
def layout_seal_drifts(dungeon: 'Dungeon', room: 'Room'):
    """Create seal drift areas."""
    from ..core.constants import TileType

    if room.width < 5 or room.height < 5:
        return

    num_patches = random.randint(2, 3)
    for _ in range(num_patches):
        px = random.randint(room.x + 1, room.x + room.width - 2)
        py = random.randint(room.y + 1, room.y + room.height - 2)
        if dungeon.tiles[py][px] == TileType.FLOOR:
            dungeon.tiles[py][px] = TileType.DEEP_WATER


@register_layout(2, "diseased_pools")
def layout_diseased_pools(dungeon: 'Dungeon', room: 'Room'):
    """Create diseased pool areas."""
    from ..core.constants import TileType

    if room.width < 5 or room.height < 5:
        return

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
    """Maintenance tunnels - minimal decoration."""
    from ..core.constants import TileType

    if room.width < 6 and room.height < 6:
        return

    if random.random() < 0.3:
        px = random.randint(room.x + 1, room.x + room.width - 2)
        py = random.randint(room.y + 1, room.y + room.height - 2)
        if dungeon.tiles[py][px] == TileType.FLOOR:
            dungeon.tiles[py][px] = TileType.DEEP_WATER


@register_layout(2, "confluence_chambers")
def layout_confluence_chambers(dungeon: 'Dungeon', room: 'Room'):
    """Confluence chambers - start zone."""
    from ..core.constants import TileType

    if room.width < 6 or room.height < 6:
        return

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
    """Create root warren chokepoints."""
    from ..core.constants import TileType

    if room.width < 8 and room.height < 8:
        return

    if room.width > room.height:
        partition_x = room.x + room.width // 2
        for y in range(room.y + 3, room.y + room.height - 3):
            if random.random() < 0.6:
                dungeon.tiles[y][partition_x] = TileType.WALL
    else:
        partition_y = room.y + room.height // 2
        for x in range(room.x + 3, room.x + room.width - 3):
            if random.random() < 0.6:
                dungeon.tiles[partition_y][x] = TileType.WALL


@register_layout(3, "canopy_halls")
def layout_canopy_halls(dungeon: 'Dungeon', room: 'Room'):
    """Create canopy hall landmark room."""
    from ..core.constants import TileType

    if room.width < 8 or room.height < 8:
        return

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

        for dx in range(2):
            for dy in range(2):
                tx, ty = px + dx, py + dy
                if (room.x + 1 <= tx < room.x + room.width - 1 and
                    room.y + 1 <= ty < room.y + room.height - 1):
                    if dungeon.tiles[ty][tx] == TileType.FLOOR:
                        dungeon.tiles[ty][tx] = TileType.DEEP_WATER


@register_layout(3, "webbed_gardens")
def layout_webbed_gardens(dungeon: 'Dungeon', room: 'Room'):
    """Create webbed garden trap room."""
    from ..core.constants import TileType

    if room.width < 6 or room.height < 6:
        return

    num_traps = random.randint(1, 3)
    for _ in range(num_traps):
        tx = random.randint(room.x + 2, room.x + room.width - 3)
        ty = random.randint(room.y + 2, room.y + room.height - 3)
        if dungeon.tiles[ty][tx] == TileType.FLOOR:
            dungeon.tiles[ty][tx] = TileType.DEEP_WATER


@register_layout(3, "the_nursery")
def layout_the_nursery(dungeon: 'Dungeon', room: 'Room'):
    """Create the_nursery high-danger room."""
    from ..core.constants import TileType

    if room.width < 8 or room.height < 8:
        return

    num_hazards = random.randint(2, 4)
    for _ in range(num_hazards):
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
    """Create digestion chamber hazard room."""
    from ..core.constants import TileType

    if room.width < 6 or room.height < 6:
        return

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
    """Create druid ring anchor room."""
    from ..core.constants import TileType
    import math

    if room.width < 8 or room.height < 8:
        return

    cx = room.x + room.width // 2
    cy = room.y + room.height // 2
    radius = min(room.width, room.height) // 3

    for angle in range(0, 360, 45):
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
    """Create throne hall anchor room."""
    from ..core.constants import TileType

    if room.width < 10 or room.height < 8:
        return

    if room.width > room.height:
        aisle_y = room.y + room.height // 2
        for x in range(room.x + 2, room.x + room.width - 4, 3):
            if room.y + 2 < aisle_y - 1:
                dungeon.tiles[aisle_y - 2][x] = TileType.DEEP_WATER
            if aisle_y + 2 < room.y + room.height - 1:
                dungeon.tiles[aisle_y + 2][x] = TileType.DEEP_WATER
    else:
        aisle_x = room.x + room.width // 2
        for y in range(room.y + 2, room.y + room.height - 4, 3):
            if room.x + 2 < aisle_x - 1:
                dungeon.tiles[y][aisle_x - 2] = TileType.DEEP_WATER
            if aisle_x + 2 < room.x + room.width - 1:
                dungeon.tiles[y][aisle_x + 2] = TileType.DEEP_WATER


@register_layout(4, "oath_chambers")
def layout_oath_chambers(dungeon: 'Dungeon', room: 'Room'):
    """Create oath chamber anchor room."""
    from ..core.constants import TileType
    import math

    if room.width < 7 or room.height < 7:
        return

    cx = room.x + room.width // 2
    cy = room.y + room.height // 2
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
    """Create courtyard plaza room."""
    from ..core.constants import TileType

    if room.width < 8 or room.height < 8:
        return

    cx = room.x + room.width // 2
    cy = room.y + room.height // 2

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
    """Create seal chamber bureaucracy room."""
    from ..core.constants import TileType

    if room.width < 6 or room.height < 6:
        return

    corners = [
        (room.x + 2, room.y + 2),
        (room.x + room.width - 3, room.y + 2),
        (room.x + 2, room.y + room.height - 3),
        (room.x + room.width - 3, room.y + room.height - 3),
    ]
    for x, y in random.sample(corners, min(3, len(corners))):
        if dungeon.tiles[y][x] == TileType.FLOOR:
            dungeon.tiles[y][x] = TileType.DEEP_WATER


@register_layout(4, "record_vaults")
def layout_record_vaults(dungeon: 'Dungeon', room: 'Room'):
    """Create record vault archive room."""
    from ..core.constants import TileType

    if room.width < 6 or room.height < 6:
        return

    if room.width > room.height:
        for x in range(room.x + 3, room.x + room.width - 3, 4):
            for y in range(room.y + 2, room.y + room.height - 2):
                if random.random() < 0.4:
                    dungeon.tiles[y][x] = TileType.WALL
    else:
        for y in range(room.y + 3, room.y + room.height - 3, 4):
            for x in range(room.x + 2, room.x + room.width - 2):
                if random.random() < 0.4:
                    dungeon.tiles[y][x] = TileType.WALL


@register_layout(4, "parade_corridors")
def layout_parade_corridors(dungeon: 'Dungeon', room: 'Room'):
    """Create parade corridor with symmetrical markers."""
    from ..core.constants import TileType

    if room.width < 10 and room.height < 10:
        return

    if room.width > room.height:
        center_y = room.y + room.height // 2
        for x in range(room.x + 2, room.x + room.width - 2, 4):
            if center_y - 1 > room.y and center_y + 1 < room.y + room.height - 1:
                if dungeon.tiles[center_y - 1][x] == TileType.FLOOR:
                    dungeon.tiles[center_y - 1][x] = TileType.DEEP_WATER
                if dungeon.tiles[center_y + 1][x] == TileType.FLOOR:
                    dungeon.tiles[center_y + 1][x] = TileType.DEEP_WATER
    else:
        center_x = room.x + room.width // 2
        for y in range(room.y + 2, room.y + room.height - 2, 4):
            if center_x - 1 > room.x and center_x + 1 < room.x + room.width - 1:
                if dungeon.tiles[y][center_x - 1] == TileType.FLOOR:
                    dungeon.tiles[y][center_x - 1] = TileType.DEEP_WATER
                if dungeon.tiles[y][center_x + 1] == TileType.FLOOR:
                    dungeon.tiles[y][center_x + 1] = TileType.DEEP_WATER


@register_layout(4, "mausoleum_district")
def layout_mausoleum_district(dungeon: 'Dungeon', room: 'Room'):
    """Create mausoleum crypt room."""
    from ..core.constants import TileType

    if room.width < 6 or room.height < 6:
        return

    for y in range(room.y + 2, room.y + room.height - 2, 3):
        for x in range(room.x + 2, room.x + room.width - 2, 3):
            if random.random() < 0.3:
                if dungeon.tiles[y][x] == TileType.FLOOR:
                    dungeon.tiles[y][x] = TileType.DEEP_WATER
