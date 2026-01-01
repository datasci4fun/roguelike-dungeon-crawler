"""Field of View (FOV) calculation using raycasting."""
import math
from typing import Callable, Set, Tuple


def calculate_fov(
    center_x: int,
    center_y: int,
    radius: int,
    is_blocking: Callable[[int, int], bool],
    width: int,
    height: int
) -> Set[Tuple[int, int]]:
    """
    Calculate field of view from a center point using raycasting.

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
