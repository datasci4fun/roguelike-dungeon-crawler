"""First-person view and visibility helpers for game state serialization."""
from typing import List
import math


def is_visible(engine, x: int, y: int) -> bool:
    """Check if a position is visible to the player."""
    if not engine.dungeon:
        return False
    if 0 <= x < engine.dungeon.width and 0 <= y < engine.dungeon.height:
        return engine.dungeon.visible[y][x]
    return False


def is_in_fov_cone(player_x: int, player_y: int, target_x: int, target_y: int,
                   facing_dx: int, facing_dy: int, max_distance: int = 8) -> bool:
    """
    Check if a target position is within the player's FOV cone.
    Uses a ~120 degree cone (60 degrees on each side of facing direction).
    """
    # Calculate relative position
    rel_x = target_x - player_x
    rel_y = target_y - player_y

    # Check distance
    distance = math.sqrt(rel_x * rel_x + rel_y * rel_y)
    if distance > max_distance or distance == 0:
        return distance == 0  # Player's own position is always "visible"

    # Normalize direction to target
    dir_x = rel_x / distance
    dir_y = rel_y / distance

    # Dot product with facing direction
    dot = dir_x * facing_dx + dir_y * facing_dy

    # cos(60°) = 0.5 for a 120° cone (60° on each side)
    cone_threshold = 0.5

    return dot >= cone_threshold


def has_line_of_sight(dungeon, start_x: int, start_y: int, end_x: int, end_y: int) -> bool:
    """
    Check if there's a clear line of sight between two points.
    Uses Bresenham's line algorithm to trace the path.
    Returns True if no walls block the view (the end tile itself can be a wall - we can see walls).
    """
    dx = abs(end_x - start_x)
    dy = abs(end_y - start_y)
    sx = 1 if start_x < end_x else -1
    sy = 1 if start_y < end_y else -1
    err = dx - dy

    x, y = start_x, start_y

    while True:
        # If we reached the destination, line of sight is clear
        if x == end_x and y == end_y:
            return True

        # Check if current position blocks sight (walls block, but we can see the wall itself)
        if (x != start_x or y != start_y):  # Don't check start position
            if dungeon.is_blocking_sight(x, y):
                # We hit a wall before reaching destination
                # But if this IS the destination, we can see it
                if x == end_x and y == end_y:
                    return True
                return False

        # Move to next cell
        e2 = 2 * err
        if e2 > -dy:
            err -= dy
            x += sx
        if e2 < dx:
            err += dx
            y += sy


def serialize_visible_tiles(engine) -> List[List[str]]:
    """Serialize visible dungeon tiles around the player."""
    if not engine.dungeon or not engine.player:
        return []

    # Send a viewport around the player (e.g., 40x20)
    viewport_w, viewport_h = 40, 20
    px, py = engine.player.x, engine.player.y

    tiles = []
    for dy in range(-viewport_h // 2, viewport_h // 2 + 1):
        row = []
        for dx in range(-viewport_w // 2, viewport_w // 2 + 1):
            x, y = px + dx, py + dy
            if 0 <= x < engine.dungeon.width and 0 <= y < engine.dungeon.height:
                if engine.dungeon.visible[y][x]:
                    tile = engine.dungeon.tiles[y][x]
                    row.append(tile.value if hasattr(tile, 'value') else str(tile))
                elif engine.dungeon.explored[y][x]:
                    row.append("~")  # Explored but not visible
                else:
                    row.append(" ")  # Unexplored
            else:
                row.append(" ")  # Out of bounds
        tiles.append(row)

    return tiles


def serialize_first_person_view(engine, facing: tuple) -> dict:
    """
    Serialize tiles and entities in front of the player for first-person rendering.

    Args:
        engine: The game engine
        facing: Player facing direction (dx, dy)

    Returns:
        Dictionary with rows of tiles and entities in front of player
    """
    if not engine.dungeon or not engine.player:
        return {"rows": [], "entities": []}

    player = engine.player
    dungeon = engine.dungeon
    facing_dx, facing_dy = facing

    # Calculate perpendicular direction for width
    perp_dx = -facing_dy
    perp_dy = facing_dx

    # View parameters
    # Render as far as we can see straight ahead (until OOB or blocking tile),
    # instead of a fixed arbitrary distance.
    max_depth = 0
    step = 1
    while True:
        cx = player.x + facing_dx * step
        cy = player.y + facing_dy * step
        if not (0 <= cx < dungeon.width and 0 <= cy < dungeon.height):
            break
        max_depth = step
        # Stop AFTER including the blocking tile (we can see the wall itself).
        if dungeon.is_blocking_sight(cx, cy):
            break
        step += 1

    # Safety cap (keeps payload bounded on larger maps; still "all LOS" for typical dungeon sizes)
    MAX_FP_DEPTH = max(dungeon.width, dungeon.height)
    depth = min(max_depth, MAX_FP_DEPTH)

    # Width scaling tuned for the original depth=8 look (keeps framing consistent even if depth grows)
    REFERENCE_DEPTH = 8
    base_width = 9
    MAX_HALF_WIDTH = 25

    rows = []
    entities_in_view = []

    # Start from depth 0 (tiles beside player) for accurate side wall detection
    for d in range(0, depth + 1):
        row = []
        # Calculate center of this row
        row_center_x = player.x + facing_dx * d
        row_center_y = player.y + facing_dy * d

        # Width at this depth (perspective)
        # IMPORTANT: do NOT divide by "depth" (which is now dynamic),
        # or the view gets unnaturally narrow as depth increases.
        half_width = (base_width * d) // REFERENCE_DEPTH + 1
        if half_width > MAX_HALF_WIDTH:
            half_width = MAX_HALF_WIDTH

        for w in range(-half_width, half_width + 1):
            tile_x = row_center_x + perp_dx * w
            tile_y = row_center_y + perp_dy * w

            # Check bounds and visibility
            in_bounds = 0 <= tile_x < dungeon.width and 0 <= tile_y < dungeon.height

            # Check line of sight - walls should block visibility of tiles behind them
            has_los = in_bounds and has_line_of_sight(dungeon, player.x, player.y, tile_x, tile_y)

            if in_bounds and has_los:
                tile = dungeon.tiles[tile_y][tile_x]
                tile_char = tile.value if hasattr(tile, 'value') else str(tile)

                # Check for entity at this position
                # Only include entities at depth > 0 (in front of player, not beside)
                # Depth 0 is used for side wall detection only
                entity_here = None

                # Check for enemy (only in front, not beside, and within FOV cone)
                if engine.entity_manager and d > 0:
                    for enemy in engine.entity_manager.enemies:
                        if enemy is None:
                            continue
                        try:
                            if (enemy.is_alive() and enemy.x == tile_x and enemy.y == tile_y and
                                is_in_fov_cone(player.x, player.y, tile_x, tile_y, facing_dx, facing_dy, max_distance=depth)):
                                entity_here = {
                                    "type": "enemy",
                                    "name": enemy.name if hasattr(enemy, 'name') and enemy.name else "enemy",
                                    "symbol": enemy.symbol if hasattr(enemy, 'symbol') and enemy.symbol else "?",
                                    "health": enemy.health if hasattr(enemy, 'health') else 0,
                                    "max_health": enemy.max_health if hasattr(enemy, 'max_health') else 0,
                                    "is_elite": getattr(enemy, 'is_elite', False),
                                    "distance": d,
                                    "offset": w,
                                    "x": tile_x,
                                    "y": tile_y,
                                }
                                entities_in_view.append(entity_here)
                                break
                        except (AttributeError, TypeError):
                            continue  # Skip malformed enemy

                    # Check for item (within FOV cone)
                    if not entity_here:
                        for item in engine.entity_manager.items:
                            if item is None:
                                continue
                            try:
                                if (item.x == tile_x and item.y == tile_y and
                                    is_in_fov_cone(player.x, player.y, tile_x, tile_y, facing_dx, facing_dy, max_distance=depth)):
                                    entity_here = {
                                        "type": "item",
                                        "name": item.name if hasattr(item, 'name') and item.name else "item",
                                        "symbol": getattr(item, 'symbol', '?'),
                                        "distance": d,
                                        "offset": w,
                                        "x": tile_x,
                                        "y": tile_y,
                                    }
                                    entities_in_view.append(entity_here)
                                    break
                            except (AttributeError, TypeError):
                                continue  # Skip malformed item

                # Check for visible trap (only in front, not beside, within FOV cone)
                if d > 0 and engine.trap_manager:
                    trap = engine.trap_manager.get_trap_at(tile_x, tile_y)
                    if (trap and not trap.hidden and trap.trap_type and
                        hasattr(trap.trap_type, 'name') and
                        is_in_fov_cone(player.x, player.y, tile_x, tile_y, facing_dx, facing_dy, max_distance=depth)):
                        try:
                            trap_type_name = trap.trap_type.name.lower() if trap.trap_type else "spike"
                            trap_name = trap.name if hasattr(trap, 'name') and trap.name else "trap"
                            trap_symbol = trap.symbol if hasattr(trap, 'symbol') and trap.symbol else "^"
                            trap_entity = {
                                "type": "trap",
                                "name": trap_name,
                                "symbol": trap_symbol,
                                "trap_type": trap_type_name,
                                "triggered": trap.triggered if hasattr(trap, 'triggered') else False,
                                "is_active": trap.is_active if hasattr(trap, 'is_active') else True,
                                "distance": d,
                                "offset": w,
                                "x": tile_x,
                                "y": tile_y,
                            }
                            entities_in_view.append(trap_entity)
                        except (AttributeError, TypeError):
                            pass  # Skip malformed trap

                # Check for hidden secret door (for visual hints)
                has_secret = False
                if engine.secret_door_manager:
                    secret_door = engine.secret_door_manager.get_door_at(tile_x, tile_y)
                    if secret_door and secret_door.hidden:
                        has_secret = True

                # v7.0: Check for interactive element at this tile
                interactive_data = None
                interactive = dungeon.get_interactive_at(tile_x, tile_y)
                if interactive and interactive.is_visible():
                    interactive_data = interactive.to_dict()

                tile_data = {
                    "tile": tile_char,
                    "tile_actual": tile_char,  # Same as tile when visible
                    "offset": w,  # Lateral offset from center (-left, +right)
                    "x": tile_x,
                    "y": tile_y,
                    "visible": True,
                    "walkable": dungeon.is_walkable(tile_x, tile_y),
                    "has_entity": entity_here is not None,
                    "has_secret": has_secret,
                }

                # Add interactive data if present (v7.0)
                if interactive_data:
                    tile_data["interactive"] = interactive_data

                row.append(tile_data)
            elif in_bounds and dungeon.explored[tile_y][tile_x]:
                # Get actual tile for geometry even though display shows fog
                actual_tile = dungeon.tiles[tile_y][tile_x]
                actual_char = actual_tile.value if hasattr(actual_tile, 'value') else str(actual_tile)
                row.append({
                    "tile": "~",  # Display: explored but not visible (fog)
                    "tile_actual": actual_char,  # Geometry: real map tile
                    "offset": w,  # Lateral offset from center (-left, +right)
                    "x": tile_x,
                    "y": tile_y,
                    "visible": False,
                    "walkable": dungeon.is_walkable(tile_x, tile_y),
                    "has_entity": False,
                })
            else:
                # OOB or unexplored: skip to avoid corrupting offset mapping
                # Renderer uses tile.offset field instead of array index
                continue

        rows.append(row)

    # Serialize torches in view
    torches_in_view = []
    if hasattr(engine, 'torch_manager') and engine.torch_manager:
        for torch in engine.torch_manager.torches:
            if not torch.is_lit:
                continue

            # Check if torch is in FOV cone
            if not is_in_fov_cone(player.x, player.y, torch.x, torch.y, facing_dx, facing_dy, max_distance=depth):
                continue

            # Check line of sight to torch
            if not has_line_of_sight(dungeon, player.x, player.y, torch.x, torch.y):
                continue

            # Calculate relative position
            rel_x = torch.x - player.x
            rel_y = torch.y - player.y

            # Distance along facing direction
            distance = rel_x * facing_dx + rel_y * facing_dy

            # Offset perpendicular to facing
            offset = rel_x * perp_dx + rel_y * perp_dy

            torches_in_view.append({
                "x": torch.x,
                "y": torch.y,
                "distance": distance,
                "offset": offset,
                "facing_dx": torch.facing_dx,
                "facing_dy": torch.facing_dy,
                "intensity": torch.intensity,
                "radius": torch.radius,
                "is_lit": torch.is_lit,
                "torch_type": torch.torch_type,
            })

    # Calculate lighting data for visible tiles
    lighting = {}
    if hasattr(engine, 'torch_manager') and engine.torch_manager and len(engine.torch_manager.torches) > 0:
        # Get entity positions that block light
        blocker_positions = set()
        blocker_positions.add((player.x, player.y))
        if hasattr(engine, 'entity_manager') and engine.entity_manager:
            for enemy in engine.entity_manager.enemies:
                if enemy.is_alive():
                    blocker_positions.add((enemy.x, enemy.y))

        # Calculate lighting
        lit_tiles = engine.torch_manager.calculate_lighting(dungeon, blocker_positions)

        # Only include tiles in our view
        for row in rows:
            for tile_data in row:
                tx, ty = tile_data.get("x", -1), tile_data.get("y", -1)
                if tx >= 0 and ty >= 0:
                    light_level = lit_tiles.get((tx, ty), 0.0)
                    if light_level > 0.05:  # Only include meaningfully lit tiles
                        lighting[f"{tx},{ty}"] = round(light_level, 2)

    # Generate 11x11 top-down window around player for debug visualization
    top_down_window = []
    window_radius = 5  # 5 in each direction = 11x11
    for dy in range(-window_radius, window_radius + 1):
        row_tiles = []
        for dx in range(-window_radius, window_radius + 1):
            wx = player.x + dx
            wy = player.y + dy
            if 0 <= wx < dungeon.width and 0 <= wy < dungeon.height:
                tile = dungeon.tiles[wy][wx]
                tile_char = tile.value if hasattr(tile, 'value') else str(tile)
                # Mark player position
                if dx == 0 and dy == 0:
                    tile_char = '@'
                # Mark enemies
                elif engine.entity_manager:
                    for enemy in engine.entity_manager.enemies:
                        if enemy and enemy.is_alive() and enemy.x == wx and enemy.y == wy:
                            tile_char = enemy.symbol if hasattr(enemy, 'symbol') else 'E'
                            break
                    # Mark items
                    if tile_char not in ['@', 'E']:
                        for item in engine.entity_manager.items:
                            if item and item.x == wx and item.y == wy:
                                tile_char = item.symbol if hasattr(item, 'symbol') else '!'
                                break
                row_tiles.append(tile_char)
            else:
                row_tiles.append(' ')  # Out of bounds
        top_down_window.append(row_tiles)

    # Get current room info for ceiling/skybox override
    current_room = dungeon.get_room_at(player.x, player.y)
    zone_id = current_room.zone if current_room else "corridor"

    # Determine ceiling state and skybox override based on floor/zone
    room_has_ceiling = True
    room_skybox_override = None

    # =================================================================
    # OUTDOOR FLOORS: Inverted ceiling logic
    # Corridors = open-air pathways (no ceiling, sky visible)
    # Rooms = buildings (have ceilings), except outdoor plazas
    # =================================================================
    outdoor_floors = {
        4: "crypt",   # Mirror Valdris - ruined outdoor kingdom
    }

    # Outdoor plazas/courtyards in outdoor floors (rooms without ceilings)
    outdoor_plazas = {
        (4, "courtyard_squares"),   # Open plazas
        (4, "throne_hall_ruins"),   # Ruined throne, exposed to sky
    }

    # =================================================================
    # STANDARD FLOORS: Traditional open-air zones (rooms only)
    # =================================================================
    open_air_zones = {
        # Floor 3: Forest - open canopy areas
        (3, "canopy_halls"): "forest",

        # Floor 5: Ice Cavern - some open frozen areas
        (5, "crystal_grottos"): "ice",
        (5, "thaw_fault"): "ice",

        # Floor 7: Volcanic Depths - open caldera/lava areas
        (7, "crucible_heart"): "lava",
        (7, "slag_pits"): "lava",

        # Floor 8: Crystal Cave - dragon's domain
        (8, "dragons_hoard"): "crystal",
    }

    zone_key = (dungeon.level, zone_id)

    # Check if this is an outdoor floor with inverted logic
    if dungeon.level in outdoor_floors:
        skybox = outdoor_floors[dungeon.level]
        if zone_id == "corridor":
            # Corridors are open-air pathways in outdoor floors
            room_has_ceiling = False
            room_skybox_override = skybox
        elif zone_key in outdoor_plazas:
            # Specific outdoor rooms (courtyards, ruins) are also open
            room_has_ceiling = False
            room_skybox_override = skybox
        # else: rooms are buildings with ceilings (default True)
    elif zone_key in open_air_zones:
        # Traditional open-air zone on standard floors
        room_has_ceiling = False
        room_skybox_override = open_air_zones[zone_key]

    return {
        "rows": rows,
        "entities": entities_in_view,
        "torches": torches_in_view,
        "lighting": lighting,
        "facing": {"dx": facing_dx, "dy": facing_dy},
        "depth": depth,
        "top_down_window": top_down_window,
        # Room ceiling/skybox info for 3D renderer
        "zone_id": zone_id,
        "room_has_ceiling": room_has_ceiling,
        "room_skybox_override": room_skybox_override,
    }
