"""Zone layouts for floors 5-8 (late game).

Ice Cavern, Ancient Library, Volcanic Depths, Crystal Cave.
"""
import random
from typing import TYPE_CHECKING

from .zone_layouts import register_layout
from .puzzles import create_pressure_plate_puzzle

if TYPE_CHECKING:
    from .dungeon import Dungeon, Room


# =============================================================================
# FLOOR 5: Ice Cavern Layouts
# =============================================================================

@register_layout(5, "frozen_galleries")
def layout_frozen_galleries(dungeon: 'Dungeon', room: 'Room'):
    """Create frozen gallery with ICE lanes and optional pressure plate puzzle."""
    from ..core.constants import TileType
    from ..core.constants.interactive import InteractiveTile, WallFace, InteractiveState

    if room.width < 10 and room.height < 10:
        return

    # Create ice lanes
    if room.width > room.height:
        lane_y = room.y + room.height // 2
        for x in range(room.x + 2, room.x + room.width - 2):
            if dungeon.tiles[lane_y][x] == TileType.FLOOR:
                dungeon.tiles[lane_y][x] = TileType.ICE
    else:
        lane_x = room.x + room.width // 2
        for y in range(room.y + 2, room.y + room.height - 2):
            if dungeon.tiles[y][lane_x] == TileType.FLOOR:
                dungeon.tiles[y][lane_x] = TileType.ICE

    # Only add puzzle to larger rooms (need space for plates + hidden door)
    if room.width < 12 or room.height < 8:
        return

    # Check if we already have puzzles on this floor (limit to 1 per floor)
    if hasattr(dungeon, 'puzzle_manager') and dungeon.puzzle_manager:
        existing = [p for p in dungeon.puzzle_manager.puzzles.values()
                    if p.puzzle_id.startswith("ice_slide")]
        if existing:
            return

    # Create ice slide pressure plate puzzle
    # Place 3 pressure plates at ends of ice lanes
    plate_positions = []
    cx = room.x + room.width // 2
    cy = room.y + room.height // 2

    # Plate at far left of room
    plate1 = (room.x + 2, cy)
    # Plate at far right of room
    plate2 = (room.x + room.width - 3, cy)
    # Plate in center-north
    plate3 = (cx, room.y + 2)

    for pos in [plate1, plate2, plate3]:
        px, py = pos
        if (room.x + 1 <= px < room.x + room.width - 1 and
            room.y + 1 <= py < room.y + room.height - 1):
            if dungeon.tiles[py][px] in (TileType.FLOOR, TileType.ICE):
                plate_positions.append(pos)

    if len(plate_positions) < 3:
        return  # Not enough valid positions

    # Hidden door on south wall, center
    door_x = cx
    door_y = room.y + room.height - 1
    if not (0 <= door_x < dungeon.width and 0 <= door_y < dungeon.height):
        return

    # Create the pressure plate puzzle
    puzzle = create_pressure_plate_puzzle(
        puzzle_id="ice_slide_gallery",
        plate_positions=plate_positions,
        required_plates=plate_positions,  # All plates required
        door_position=(door_x, door_y),
        hint="The frozen floor panels must all feel your weight...",
    )

    # Register puzzle with dungeon's puzzle manager
    if hasattr(dungeon, 'puzzle_manager') and dungeon.puzzle_manager:
        dungeon.puzzle_manager.add_puzzle(puzzle)

    # Add interactive pressure plates
    for i, (px, py) in enumerate(plate_positions):
        # Mark the tile as ice if not already
        dungeon.tiles[py][px] = TileType.ICE

        # Add the interactive pressure plate
        plate = InteractiveTile.pressure_plate(
            target=(door_x, door_y),
            examine_text=f"A pressure plate embedded in the ice. ({i+1}/3)",
            activate_text="The frozen plate sinks with a crystalline click.",
            puzzle_id="ice_slide_gallery",
        )
        dungeon.add_interactive(px, py, plate)

    # Add hidden door
    hidden_door = InteractiveTile.hidden_door(
        wall_face=WallFace.SOUTH,
        examine_text="The ice-covered wall seems thinner here...",
    )
    hidden_door.state = InteractiveState.HIDDEN
    dungeon.add_interactive(door_x, door_y, hidden_door)


@register_layout(5, "ice_tombs")
def layout_ice_tombs(dungeon: 'Dungeon', room: 'Room'):
    """Create ice tomb preservation room."""
    from ..core.constants import TileType

    if room.width < 6 or room.height < 6:
        return

    corners = [
        (room.x + 1, room.y + 1),
        (room.x + room.width - 2, room.y + 1),
        (room.x + 1, room.y + room.height - 2),
        (room.x + room.width - 2, room.y + room.height - 2),
    ]
    for x, y in random.sample(corners, min(2, len(corners))):
        if dungeon.tiles[y][x] == TileType.FLOOR:
            dungeon.tiles[y][x] = TileType.ICE


@register_layout(5, "crystal_grottos")
def layout_crystal_grottos(dungeon: 'Dungeon', room: 'Room'):
    """Create crystal grotto landmark room."""
    from ..core.constants import TileType

    if room.width < 7 or room.height < 7:
        return

    cx = room.x + room.width // 2
    cy = room.y + room.height // 2

    if random.random() < 0.5:
        offsets = [(-1, 0), (1, 0), (0, -1), (0, 1)]
        for dx, dy in offsets:
            px, py = cx + dx, cy + dy
            if (room.x + 1 <= px < room.x + room.width - 1 and
                room.y + 1 <= py < room.y + room.height - 1):
                if dungeon.tiles[py][px] == TileType.FLOOR:
                    dungeon.tiles[py][px] = TileType.ICE


@register_layout(5, "suspended_laboratories")
def layout_suspended_laboratories(dungeon: 'Dungeon', room: 'Room'):
    """Create suspended laboratory frozen research room."""
    from ..core.constants import TileType

    if room.width < 6 or room.height < 6:
        return

    num_patches = random.randint(1, 2)
    for _ in range(num_patches):
        px = random.randint(room.x + 2, room.x + room.width - 3)
        py = random.randint(room.y + 2, room.y + room.height - 3)
        if dungeon.tiles[py][px] == TileType.FLOOR:
            dungeon.tiles[py][px] = TileType.ICE


@register_layout(5, "breathing_chamber")
def layout_breathing_chamber(dungeon: 'Dungeon', room: 'Room'):
    """Create breathing chamber set-piece anchor."""
    from ..core.constants import TileType

    if room.width < 10 or room.height < 8:
        return

    if random.random() < 0.6:
        edge = random.choice(['n', 's'])
        if edge == 'n':
            y = room.y + 1
            for x in range(room.x + 2, room.x + room.width - 2):
                if dungeon.tiles[y][x] == TileType.FLOOR:
                    dungeon.tiles[y][x] = TileType.DEEP_WATER
        else:
            y = room.y + room.height - 2
            for x in range(room.x + 2, room.x + room.width - 2):
                if dungeon.tiles[y][x] == TileType.FLOOR:
                    dungeon.tiles[y][x] = TileType.DEEP_WATER


@register_layout(5, "thaw_fault")
def layout_thaw_fault(dungeon: 'Dungeon', room: 'Room'):
    """Create thaw fault paradox room."""
    from ..core.constants import TileType

    if room.width < 5 or room.height < 5:
        return

    cx = room.x + room.width // 2
    cy = room.y + room.height // 2

    if dungeon.tiles[cy][cx] == TileType.FLOOR:
        dungeon.tiles[cy][cx] = TileType.DEEP_WATER

    for dx, dy in [(-1, 0), (1, 0), (0, -1), (0, 1)]:
        px, py = cx + dx, cy + dy
        if (room.x + 1 <= px < room.x + room.width - 1 and
            room.y + 1 <= py < room.y + room.height - 1):
            if dungeon.tiles[py][px] == TileType.FLOOR:
                dungeon.tiles[py][px] = TileType.ICE


# =============================================================================
# FLOOR 6: Ancient Library Layouts
# =============================================================================

@register_layout(6, "reading_halls")
def layout_reading_halls(dungeon: 'Dungeon', room: 'Room'):
    """Create reading hall with open center."""
    pass


@register_layout(6, "forbidden_stacks")
def layout_forbidden_stacks(dungeon: 'Dungeon', room: 'Room'):
    """Create forbidden stacks with interior partitions."""
    from ..core.constants import TileType

    if room.width < 6 or room.height < 6:
        return

    num_partitions = random.randint(1, 2)
    for _ in range(num_partitions):
        if random.random() < 0.5:
            py = random.randint(room.y + 2, room.y + room.height - 3)
            start_x = random.randint(room.x + 2, room.x + room.width - 4)
            length = min(3, room.x + room.width - 2 - start_x)
            for x in range(start_x, start_x + length):
                if dungeon.tiles[py][x] == TileType.FLOOR:
                    dungeon.tiles[py][x] = TileType.WALL
        else:
            px = random.randint(room.x + 2, room.x + room.width - 3)
            start_y = random.randint(room.y + 2, room.y + room.height - 4)
            length = min(3, room.y + room.height - 2 - start_y)
            for y in range(start_y, start_y + length):
                if dungeon.tiles[y][px] == TileType.FLOOR:
                    dungeon.tiles[y][px] = TileType.WALL


@register_layout(6, "catalog_chambers")
def layout_catalog_chambers(dungeon: 'Dungeon', room: 'Room'):
    """Create catalog chamber with orderly layout."""
    pass


@register_layout(6, "indexing_heart")
def layout_indexing_heart(dungeon: 'Dungeon', room: 'Room'):
    """Create indexing heart anchor room."""
    from ..core.constants import TileType

    if room.width < 8 or room.height < 8:
        return

    cx = room.x + room.width // 2
    cy = room.y + room.height // 2
    radius = min(room.width, room.height) // 3

    offsets = [
        (-radius, 0), (radius, 0), (0, -radius), (0, radius),
        (-radius+1, -radius+1), (radius-1, -radius+1),
        (-radius+1, radius-1), (radius-1, radius-1),
    ]
    for dx, dy in offsets:
        px, py = cx + dx, cy + dy
        if (room.x + 1 <= px < room.x + room.width - 1 and
            room.y + 1 <= py < room.y + room.height - 1):
            if dungeon.tiles[py][px] == TileType.FLOOR:
                if random.random() < 0.4:
                    dungeon.tiles[py][px] = TileType.DEEP_WATER


@register_layout(6, "experiment_archives")
def layout_experiment_archives(dungeon: 'Dungeon', room: 'Room'):
    """Create experiment archives with messy layout."""
    from ..core.constants import TileType

    if room.width < 6 or room.height < 6:
        return

    num_markers = random.randint(1, 2)
    for _ in range(num_markers):
        px = random.randint(room.x + 2, room.x + room.width - 3)
        py = random.randint(room.y + 2, room.y + room.height - 3)
        if dungeon.tiles[py][px] == TileType.FLOOR:
            dungeon.tiles[py][px] = TileType.DEEP_WATER


@register_layout(6, "marginalia_alcoves")
def layout_marginalia_alcoves(dungeon: 'Dungeon', room: 'Room'):
    """Create marginalia alcove nook."""
    pass


@register_layout(6, "boss_approach")
def layout_boss_approach_library(dungeon: 'Dungeon', room: 'Room'):
    """Create library boss approach room."""
    from ..core.constants import TileType

    if room.width < 5 or room.height < 5:
        return

    cx = room.x + room.width // 2
    cy = room.y + room.height // 2

    if random.random() < 0.5:
        if dungeon.tiles[cy][cx - 1] == TileType.FLOOR:
            dungeon.tiles[cy][cx - 1] = TileType.DEEP_WATER


# =============================================================================
# FLOOR 7: Volcanic Depths Layouts
# =============================================================================

@register_layout(7, "forge_halls")
def layout_forge_halls(dungeon: 'Dungeon', room: 'Room'):
    """Create forge hall workshop."""
    from ..core.constants import TileType

    if room.width < 7 or room.height < 7:
        return

    if random.random() < 0.5:
        if room.width > room.height:
            px = room.x + room.width // 3
            py = random.choice([room.y + 2, room.y + room.height - 3])
            if dungeon.tiles[py][px] == TileType.FLOOR:
                dungeon.tiles[py][px] = TileType.WALL
        else:
            px = random.choice([room.x + 2, room.x + room.width - 3])
            py = room.y + room.height // 3
            if dungeon.tiles[py][px] == TileType.FLOOR:
                dungeon.tiles[py][px] = TileType.WALL


@register_layout(7, "magma_channels")
def layout_magma_channels(dungeon: 'Dungeon', room: 'Room'):
    """Create magma channel with central LAVA lane."""
    from ..core.constants import TileType

    if room.width < 4 or room.height < 4:
        return

    if room.width > room.height:
        lane_y = room.y + room.height // 2
        for x in range(room.x + 2, room.x + room.width - 2):
            if dungeon.tiles[lane_y][x] == TileType.FLOOR:
                dungeon.tiles[lane_y][x] = TileType.LAVA
    else:
        lane_x = room.x + room.width // 2
        for y in range(room.y + 2, room.y + room.height - 2):
            if dungeon.tiles[y][lane_x] == TileType.FLOOR:
                dungeon.tiles[y][lane_x] = TileType.LAVA


@register_layout(7, "cooling_chambers")
def layout_cooling_chambers(dungeon: 'Dungeon', room: 'Room'):
    """Create cooling chamber with water troughs."""
    from ..core.constants import TileType

    if room.width < 6 or room.height < 6:
        return

    num_troughs = random.randint(1, 2)
    for _ in range(num_troughs):
        px = random.randint(room.x + 2, room.x + room.width - 3)
        py = random.randint(room.y + 2, room.y + room.height - 3)
        if dungeon.tiles[py][px] == TileType.FLOOR:
            dungeon.tiles[py][px] = TileType.DEEP_WATER


@register_layout(7, "slag_pits")
def layout_slag_pits(dungeon: 'Dungeon', room: 'Room'):
    """Create slag pit hazard pocket."""
    from ..core.constants import TileType

    if room.width < 5 or room.height < 5:
        return

    num_puddles = random.randint(1, 3)
    corners = [
        (room.x + 1, room.y + 1),
        (room.x + room.width - 2, room.y + 1),
        (room.x + 1, room.y + room.height - 2),
        (room.x + room.width - 2, room.y + room.height - 2),
    ]
    for i, (px, py) in enumerate(random.sample(corners, min(num_puddles, len(corners)))):
        if dungeon.tiles[py][px] == TileType.FLOOR:
            dungeon.tiles[py][px] = TileType.LAVA


@register_layout(7, "rune_press")
def layout_rune_press(dungeon: 'Dungeon', room: 'Room'):
    """Create rune press anchor room."""
    from ..core.constants import TileType

    if room.width < 7 or room.height < 7:
        return

    cx = room.x + room.width // 2
    cy = room.y + room.height // 2

    if random.random() < 0.4:
        if dungeon.tiles[cy - 2][cx] == TileType.FLOOR:
            dungeon.tiles[cy - 2][cx] = TileType.WALL
        if dungeon.tiles[cy + 2][cx] == TileType.FLOOR:
            dungeon.tiles[cy + 2][cx] = TileType.WALL


@register_layout(7, "ash_galleries")
def layout_ash_galleries(dungeon: 'Dungeon', room: 'Room'):
    """Create ash gallery with traps."""
    pass


@register_layout(7, "crucible_heart")
def layout_crucible_heart(dungeon: 'Dungeon', room: 'Room'):
    """Create crucible heart anchor set-piece."""
    from ..core.constants import TileType

    if room.width < 8 or room.height < 8:
        return

    for x in range(room.x + 1, room.x + room.width - 1):
        for y in [room.y + 1, room.y + room.height - 2]:
            if random.random() < 0.2:
                if dungeon.tiles[y][x] == TileType.FLOOR:
                    dungeon.tiles[y][x] = TileType.LAVA

    for y in range(room.y + 2, room.y + room.height - 2):
        for x in [room.x + 1, room.x + room.width - 2]:
            if random.random() < 0.2:
                if dungeon.tiles[y][x] == TileType.FLOOR:
                    dungeon.tiles[y][x] = TileType.LAVA


@register_layout(7, "boss_approach")
def layout_boss_approach_volcanic(dungeon: 'Dungeon', room: 'Room'):
    """Create volcanic boss approach room with descent visuals."""
    from ..core.constants import TileType
    from ..core.constants.interactive import TileVisual, SlopeDirection

    if room.width < 5 or room.height < 5:
        return

    # Add lava hazards
    if random.random() < 0.5:
        wall_y = random.choice([room.y + 1, room.y + room.height - 2])
        for x in range(room.x + 2, room.x + room.width - 2, 3):
            if random.random() < 0.3:
                if dungeon.tiles[wall_y][x] == TileType.FLOOR:
                    dungeon.tiles[wall_y][x] = TileType.LAVA

    # v7.0 Sprint 3: Add descent visuals leading to boss area
    # Create a sense of descending toward the boss lair
    cx = room.x + room.width // 2
    cy = room.y + room.height // 2

    # Slope tiles on the approach path
    for dy in range(-2, 3):
        slope_y = cy + dy
        if room.y + 1 < slope_y < room.y + room.height - 2:
            if dungeon.tiles[slope_y][cx] == TileType.FLOOR:
                # Progressive descent toward center
                elevation = -0.1 * abs(dy - 1)
                dungeon.set_tile_visual(
                    cx, slope_y,
                    TileVisual.slope(
                        direction=SlopeDirection.SOUTH if dy < 0 else SlopeDirection.NORTH,
                        amount=0.15,
                        base_elevation=elevation
                    )
                )


# =============================================================================
# FLOOR 8: Crystal Cave Layouts
# =============================================================================

@register_layout(8, "crystal_gardens")
def layout_crystal_gardens(dungeon: 'Dungeon', room: 'Room'):
    """Create crystal garden scenic landmark."""
    pass


@register_layout(8, "geometry_wells")
def layout_geometry_wells(dungeon: 'Dungeon', room: 'Room'):
    """Create geometry well lattice node."""
    pass


@register_layout(8, "seal_chambers")
def layout_seal_chambers_floor8(dungeon: 'Dungeon', room: 'Room'):
    """Create seal chamber with ring motif."""
    from ..core.constants import TileType

    if room.width < 7 or room.height < 7:
        return

    cx = room.x + room.width // 2
    cy = room.y + room.height // 2
    radius = min(room.width, room.height) // 3

    positions = [
        (cx - radius, cy), (cx + radius, cy),
        (cx, cy - radius), (cx, cy + radius),
        (cx - radius + 1, cy - radius + 1),
        (cx + radius - 1, cy - radius + 1),
        (cx - radius + 1, cy + radius - 1),
    ]
    for px, py in positions:
        if (room.x + 1 <= px < room.x + room.width - 1 and
            room.y + 1 <= py < room.y + room.height - 1):
            if dungeon.tiles[py][px] == TileType.FLOOR:
                if random.random() < 0.5:
                    dungeon.tiles[py][px] = TileType.DEEP_WATER


@register_layout(8, "dragons_hoard")
def layout_dragons_hoard(dungeon: 'Dungeon', room: 'Room'):
    """Create dragon's hoard anchor room."""
    pass


@register_layout(8, "vault_antechamber")
def layout_vault_antechamber(dungeon: 'Dungeon', room: 'Room'):
    """Create vault antechamber threshold room."""
    pass


@register_layout(8, "oath_interface")
def layout_oath_interface(dungeon: 'Dungeon', room: 'Room'):
    """Create oath interface anchor room."""
    from ..core.constants import TileType

    if room.width < 7 or room.height < 7:
        return

    cx = room.x + room.width // 2
    cy = room.y + room.height // 2
    radius = min(room.width, room.height) // 3

    offsets = [(-radius, 0), (radius, 0), (0, -radius), (0, radius)]
    for dx, dy in offsets:
        px, py = cx + dx, cy + dy
        if (room.x + 1 <= px < room.x + room.width - 1 and
            room.y + 1 <= py < room.y + room.height - 1):
            if dungeon.tiles[py][px] == TileType.FLOOR:
                dungeon.tiles[py][px] = TileType.DEEP_WATER


@register_layout(8, "boss_approach")
def layout_boss_approach_crystal(dungeon: 'Dungeon', room: 'Room'):
    """Create crystal boss approach room with geometric descent."""
    from ..core.constants import TileType
    from ..core.constants.interactive import TileVisual, SlopeDirection, SetPieceType

    if room.width < 5 or room.height < 5:
        return

    cx = room.x + room.width // 2
    cy = room.y + room.height // 2

    # Add water features
    if random.random() < 0.5:
        offsets = [(-2, 0), (2, 0), (0, -2), (0, 2)]
        for dx, dy in offsets:
            px, py = cx + dx, cy + dy
            if (room.x + 1 <= px < room.x + room.width - 1 and
                room.y + 1 <= py < room.y + room.height - 1):
                if dungeon.tiles[py][px] == TileType.FLOOR:
                    if random.random() < 0.3:
                        dungeon.tiles[py][px] = TileType.DEEP_WATER

    # v7.0 Sprint 3: Add descent toward crystal boss lair
    # Center is lowered, edges slope inward
    if dungeon.tiles[cy][cx] == TileType.FLOOR:
        dungeon.set_tile_visual(
            cx, cy,
            TileVisual.flat(elevation=-0.3)
        )

    # Sloping tiles around center
    for dx, dy in [(-1, 0), (1, 0), (0, -1), (0, 1)]:
        slope_x, slope_y = cx + dx, cy + dy
        if (room.x + 1 <= slope_x < room.x + room.width - 1 and
            room.y + 1 <= slope_y < room.y + room.height - 1):
            if dungeon.tiles[slope_y][slope_x] == TileType.FLOOR:
                # Slope toward center
                if dx < 0:
                    direction = SlopeDirection.EAST
                elif dx > 0:
                    direction = SlopeDirection.WEST
                elif dy < 0:
                    direction = SlopeDirection.SOUTH
                else:
                    direction = SlopeDirection.NORTH
                dungeon.set_tile_visual(
                    slope_x, slope_y,
                    TileVisual.slope(direction=direction, amount=0.2, base_elevation=-0.15)
                )

    # Add boss throne set piece if room is large enough
    if room.width >= 7 and room.height >= 7:
        throne_y = room.y + 2  # North side of room
        if dungeon.tiles[throne_y][cx] == TileType.FLOOR:
            dungeon.set_tile_visual(
                cx, throne_y,
                TileVisual.with_set_piece(
                    piece_type=SetPieceType.BOSS_THRONE,
                    rotation=180,  # Facing south toward entrance
                    scale=1.2
                )
            )
