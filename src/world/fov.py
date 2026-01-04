"""Field of View (FOV) calculation using raycasting."""
import math
from typing import Callable, Set, Tuple, Optional


def calculate_fov(
    center_x: int,
    center_y: int,
    radius: int,
    is_blocking: Callable[[int, int], bool],
    width: int,
    height: int
) -> Set[Tuple[int, int]]:
    """
    Calculate field of view from a center point using raycasting (360 degrees).

    Args:
        center_x, center_y: Center position
        radius: View radius
        is_blocking: Function that returns True if a tile blocks vision
        width, height: Bounds of the map

    Returns:
        Set of (x, y) tuples that are visible
    """
    visible = {(center_x, center_y)}  # Center is always visible

    # Cast rays in 360 degrees
    num_rays = radius * 8  # More rays = smoother FOV
    for i in range(num_rays):
        angle = 2 * math.pi * i / num_rays

        # Calculate ray direction
        dx = math.cos(angle)
        dy = math.sin(angle)

        # Cast ray
        cast_ray(center_x, center_y, dx, dy, radius, is_blocking, width, height, visible)

    return visible


def calculate_directional_fov(
    center_x: int,
    center_y: int,
    radius: int,
    is_blocking: Callable[[int, int], bool],
    width: int,
    height: int,
    facing: Tuple[int, int],
    fov_angle: float = 90.0
) -> Set[Tuple[int, int]]:
    """
    Calculate directional field of view as a cone in the facing direction.

    Args:
        center_x, center_y: Center position
        radius: View radius
        is_blocking: Function that returns True if a tile blocks vision
        width, height: Bounds of the map
        facing: Direction tuple (dx, dy) where player is facing
        fov_angle: Field of view angle in degrees (default 90)

    Returns:
        Set of (x, y) tuples that are visible
    """
    visible = {(center_x, center_y)}  # Center is always visible

    # Calculate facing angle
    facing_dx, facing_dy = facing
    if facing_dx == 0 and facing_dy == 0:
        # Default to south if no facing direction
        facing_dx, facing_dy = 0, 1

    facing_angle = math.atan2(facing_dy, facing_dx)

    # Convert FOV angle to radians (half on each side)
    half_fov = math.radians(fov_angle / 2)

    # Also add a small rear awareness (peripheral vision behind)
    rear_radius = max(1, radius // 3)  # See 1/3 distance behind

    # Cast rays within the FOV cone
    num_rays = radius * 8
    for i in range(num_rays):
        # Calculate ray angle
        ray_angle = 2 * math.pi * i / num_rays

        # Check if ray is within FOV cone
        angle_diff = abs(_normalize_angle(ray_angle - facing_angle))

        if angle_diff <= half_fov:
            # Within forward FOV - use full radius
            dx = math.cos(ray_angle)
            dy = math.sin(ray_angle)
            cast_ray(center_x, center_y, dx, dy, radius, is_blocking, width, height, visible)
        elif angle_diff >= math.pi - math.radians(45):
            # Peripheral rear vision - limited radius
            dx = math.cos(ray_angle)
            dy = math.sin(ray_angle)
            cast_ray(center_x, center_y, dx, dy, rear_radius, is_blocking, width, height, visible)

    return visible


def _normalize_angle(angle: float) -> float:
    """Normalize angle to [-pi, pi] range."""
    while angle > math.pi:
        angle -= 2 * math.pi
    while angle < -math.pi:
        angle += 2 * math.pi
    return angle


def get_tiles_in_front(
    center_x: int,
    center_y: int,
    facing: Tuple[int, int],
    depth: int,
    width_tiles: int,
    is_blocking: Callable[[int, int], bool],
    map_width: int,
    map_height: int
) -> list:
    """
    Get tiles in front of the player for first-person rendering.

    Returns a list of rows, where each row is a list of tile info dicts.
    Row 0 is closest to player, increasing rows are further away.

    Args:
        center_x, center_y: Player position
        facing: Direction tuple (dx, dy) where player is facing
        depth: How many tiles deep to look
        width_tiles: How many tiles wide at max depth
        is_blocking: Function that returns True if a tile blocks vision
        map_width, map_height: Map bounds

    Returns:
        List of rows, each containing tile positions and blocking info
    """
    facing_dx, facing_dy = facing
    if facing_dx == 0 and facing_dy == 0:
        facing_dx, facing_dy = 0, 1

    rows = []

    # Calculate perpendicular direction for width
    perp_dx = -facing_dy
    perp_dy = facing_dx

    for d in range(1, depth + 1):
        row = []
        # Calculate center of this row
        row_center_x = center_x + facing_dx * d
        row_center_y = center_y + facing_dy * d

        # Width at this depth (increases with distance for perspective)
        half_width = (width_tiles * d) // (depth * 2) + 1

        for w in range(-half_width, half_width + 1):
            tile_x = row_center_x + perp_dx * w
            tile_y = row_center_y + perp_dy * w

            # Check bounds
            in_bounds = 0 <= tile_x < map_width and 0 <= tile_y < map_height
            blocking = is_blocking(tile_x, tile_y) if in_bounds else True

            row.append({
                'x': tile_x,
                'y': tile_y,
                'distance': d,
                'offset': w,
                'in_bounds': in_bounds,
                'blocking': blocking
            })

        rows.append(row)

    return rows


def cast_ray(
    start_x: int,
    start_y: int,
    dx: float,
    dy: float,
    max_distance: int,
    is_blocking: Callable[[int, int], bool],
    width: int,
    height: int,
    visible: Set[Tuple[int, int]]
):
    """Cast a single ray and mark visible tiles."""
    x, y = float(start_x), float(start_y)

    for _ in range(max_distance):
        x += dx
        y += dy

        tile_x = int(round(x))
        tile_y = int(round(y))

        # Check bounds
        if not (0 <= tile_x < width and 0 <= tile_y < height):
            break

        visible.add((tile_x, tile_y))

        # Stop if hit a blocking tile
        if is_blocking(tile_x, tile_y):
            break
