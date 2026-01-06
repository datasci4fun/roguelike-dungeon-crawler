"""Torch system for data-driven dungeon lighting.

Torches are placed during dungeon generation and cast directional light
that can be blocked by walls and entities.
"""
from dataclasses import dataclass, field
from typing import TYPE_CHECKING, Optional, List, Set, Tuple, Dict
import math

if TYPE_CHECKING:
    from .dungeon import Dungeon


@dataclass
class Torch:
    """A wall-mounted torch that casts directional light."""
    x: int
    y: int
    # Direction torch faces (which way it casts light)
    # Values: -1, 0, or 1 for each axis
    facing_dx: int = 0
    facing_dy: int = 0
    # Light properties
    radius: int = 5  # Light radius in tiles
    intensity: float = 1.0  # Base brightness (0.0-1.0)
    is_lit: bool = True  # Can be extinguished
    # Visual type for rendering variety
    torch_type: str = "wall"  # "wall", "sconce", "brazier"

    @property
    def symbol(self) -> str:
        """Display symbol for the torch."""
        if self.torch_type == "brazier":
            return "*"
        return "T"

    @property
    def facing_angle(self) -> float:
        """Get the facing direction as an angle in radians."""
        if self.facing_dx == 0 and self.facing_dy == 0:
            return 0.0  # Omnidirectional
        return math.atan2(self.facing_dy, self.facing_dx)

    @property
    def is_directional(self) -> bool:
        """Check if torch casts directional light vs omnidirectional."""
        return self.facing_dx != 0 or self.facing_dy != 0


class TorchManager:
    """Manages all torches on a dungeon level."""

    def __init__(self):
        self.torches: List[Torch] = []
        self._positions: Set[Tuple[int, int]] = set()  # Fast position lookup
        # Cached lighting data
        self._lit_tiles: Dict[Tuple[int, int], float] = {}
        self._dirty: bool = True  # Needs recalculation

    def add_torch(self, torch: Torch) -> None:
        """Add a torch to the level."""
        self.torches.append(torch)
        self._positions.add((torch.x, torch.y))
        self._dirty = True

    def get_torch_at(self, x: int, y: int) -> Optional[Torch]:
        """Get torch at position, if any."""
        if (x, y) not in self._positions:
            return None
        for torch in self.torches:
            if torch.x == x and torch.y == y:
                return torch
        return None

    def has_torch_at(self, x: int, y: int) -> bool:
        """Quick check if position has a torch."""
        return (x, y) in self._positions

    def get_torches_in_range(self, x: int, y: int, radius: int) -> List[Torch]:
        """Get all torches within radius of a position."""
        result = []
        for torch in self.torches:
            dist = abs(torch.x - x) + abs(torch.y - y)
            if dist <= radius:
                result.append(torch)
        return result

    def is_tile_lit(self, x: int, y: int) -> bool:
        """Check if a tile is illuminated by any torch."""
        return (x, y) in self._lit_tiles and self._lit_tiles[(x, y)] > 0.1

    def get_light_level(self, x: int, y: int) -> float:
        """Get the light intensity at a tile (0.0-1.0)."""
        return self._lit_tiles.get((x, y), 0.0)

    def mark_dirty(self) -> None:
        """Mark lighting as needing recalculation."""
        self._dirty = True

    def calculate_lighting(
        self,
        dungeon: 'Dungeon',
        blocker_positions: Set[Tuple[int, int]] = None
    ) -> Dict[Tuple[int, int], float]:
        """
        Calculate lighting from all torches.

        Args:
            dungeon: The dungeon for wall collision
            blocker_positions: Set of (x,y) positions that block light (entities)

        Returns:
            Dict mapping (x,y) -> light intensity (0.0-1.0)
        """
        if blocker_positions is None:
            blocker_positions = set()

        combined_light: Dict[Tuple[int, int], float] = {}

        for torch in self.torches:
            if not torch.is_lit:
                continue

            torch_light = self._calculate_single_torch(
                torch, dungeon, blocker_positions
            )

            # Combine light from multiple torches (additive, capped at 1.0)
            for pos, intensity in torch_light.items():
                current = combined_light.get(pos, 0.0)
                combined_light[pos] = min(1.0, current + intensity)

        self._lit_tiles = combined_light
        self._dirty = False
        return combined_light

    def _calculate_single_torch(
        self,
        torch: Torch,
        dungeon: 'Dungeon',
        blockers: Set[Tuple[int, int]]
    ) -> Dict[Tuple[int, int], float]:
        """Calculate light from a single torch using raycasting."""
        lit_tiles: Dict[Tuple[int, int], float] = {}

        # The torch itself is always lit
        lit_tiles[(torch.x, torch.y)] = torch.intensity

        if torch.is_directional:
            # Cast rays in a cone (120 degrees = 60 on each side)
            base_angle = torch.facing_angle
            cone_half_angle = math.pi / 3  # 60 degrees

            # Cast rays every 5 degrees within the cone
            num_rays = 25
            for i in range(num_rays):
                angle = base_angle - cone_half_angle + (2 * cone_half_angle * i / (num_rays - 1))
                self._cast_ray(
                    torch.x, torch.y, angle, torch.radius,
                    torch.intensity, dungeon, blockers, lit_tiles
                )
        else:
            # Omnidirectional - cast rays in all directions
            num_rays = 36  # Every 10 degrees
            for i in range(num_rays):
                angle = 2 * math.pi * i / num_rays
                self._cast_ray(
                    torch.x, torch.y, angle, torch.radius,
                    torch.intensity, dungeon, blockers, lit_tiles
                )

        return lit_tiles

    def _cast_ray(
        self,
        start_x: int,
        start_y: int,
        angle: float,
        max_distance: int,
        base_intensity: float,
        dungeon: 'Dungeon',
        blockers: Set[Tuple[int, int]],
        lit_tiles: Dict[Tuple[int, int], float]
    ) -> None:
        """Cast a single light ray, accumulating lit tiles."""
        dx = math.cos(angle)
        dy = math.sin(angle)

        x, y = float(start_x), float(start_y)
        current_intensity = base_intensity

        for distance in range(1, max_distance + 1):
            x += dx
            y += dy
            tile_x, tile_y = int(round(x)), int(round(y))

            # Bounds check
            if not (0 <= tile_x < dungeon.width and 0 <= tile_y < dungeon.height):
                break

            # Wall blocks light completely
            if dungeon.is_blocking_sight(tile_x, tile_y):
                # Light the wall tile itself, then stop
                falloff = 1.0 / (1.0 + distance * 0.3)
                intensity = current_intensity * falloff
                current = lit_tiles.get((tile_x, tile_y), 0.0)
                lit_tiles[(tile_x, tile_y)] = min(1.0, current + intensity)
                break

            # Calculate intensity with distance falloff
            falloff = 1.0 / (1.0 + distance * 0.3)
            intensity = current_intensity * falloff

            # Accumulate light
            current = lit_tiles.get((tile_x, tile_y), 0.0)
            lit_tiles[(tile_x, tile_y)] = min(1.0, current + intensity)

            # Entity blocks partially - creates shadow behind
            if (tile_x, tile_y) in blockers:
                current_intensity *= 0.3  # 70% blocked

    def get_lit_tiles(self) -> Dict[Tuple[int, int], float]:
        """Get the cached lit tiles dict."""
        return self._lit_tiles

    def clear(self) -> None:
        """Remove all torches."""
        self.torches.clear()
        self._positions.clear()
        self._lit_tiles.clear()
        self._dirty = True

    def __len__(self) -> int:
        return len(self.torches)

    def __iter__(self):
        return iter(self.torches)
