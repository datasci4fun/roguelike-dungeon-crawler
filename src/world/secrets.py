"""Secret door system for hidden passages.

Secret doors look like walls but can be discovered through searching.
Once revealed, they become passable.
"""
from dataclasses import dataclass
from typing import Optional, List, Tuple
import random


@dataclass
class SecretDoor:
    """A hidden door disguised as a wall."""
    x: int
    y: int
    hidden: bool = True
    # Direction the door leads (for visual hints)
    dx: int = 0  # -1 = west, 1 = east
    dy: int = 0  # -1 = north, 1 = south

    @property
    def symbol(self) -> str:
        """Get display symbol based on visibility."""
        if self.hidden:
            return '#'  # Looks like wall when hidden
        return 'S'  # Revealed secret passage

    @property
    def symbol_hidden(self) -> str:
        return '#'

    @property
    def symbol_revealed(self) -> str:
        return 'S'

    @property
    def name(self) -> str:
        return "Secret Door"

    @property
    def is_passable(self) -> bool:
        """Can entities walk through this door?"""
        return not self.hidden

    def reveal(self) -> bool:
        """
        Reveal this secret door.

        Returns:
            True if door was hidden and is now revealed
        """
        if self.hidden:
            self.hidden = False
            return True
        return False

    def detect(self, perception: int = 10) -> bool:
        """
        Attempt to detect a hidden secret door.

        Args:
            perception: Detection skill/modifier (higher = better chance)

        Returns:
            True if door was detected and revealed
        """
        if not self.hidden:
            return False  # Already visible

        # Base DC 15 for secret doors, harder than traps
        detection_dc = 15
        roll = random.randint(1, 20) + perception

        if roll >= detection_dc:
            self.hidden = False
            return True
        return False


class SecretDoorManager:
    """Manages all secret doors on a dungeon level."""

    def __init__(self):
        self.doors: List[SecretDoor] = []

    def add_door(self, door: SecretDoor):
        """Add a secret door to the level."""
        self.doors.append(door)

    def add_at(self, x: int, y: int, dx: int = 0, dy: int = 0) -> SecretDoor:
        """Create and add a secret door at position."""
        door = SecretDoor(x=x, y=y, dx=dx, dy=dy)
        self.doors.append(door)
        return door

    def get_door_at(self, x: int, y: int) -> Optional[SecretDoor]:
        """Get secret door at position, if any."""
        for door in self.doors:
            if door.x == x and door.y == y:
                return door
        return None

    def is_secret_wall(self, x: int, y: int) -> bool:
        """Check if position has a hidden secret door (looks like wall)."""
        door = self.get_door_at(x, y)
        return door is not None and door.hidden

    def is_revealed_door(self, x: int, y: int) -> bool:
        """Check if position has a revealed secret door (passable)."""
        door = self.get_door_at(x, y)
        return door is not None and not door.hidden

    def can_pass(self, x: int, y: int) -> bool:
        """Check if position is passable (has revealed secret door)."""
        door = self.get_door_at(x, y)
        if door is None:
            return False  # No door here
        return door.is_passable

    def search_nearby(self, x: int, y: int, perception: int = 10, radius: int = 1) -> List[SecretDoor]:
        """
        Search for hidden secret doors near a position.

        Returns:
            List of doors that were detected
        """
        detected = []
        for door in self.doors:
            if door.hidden:
                # Check Manhattan distance
                dist = abs(door.x - x) + abs(door.y - y)
                if dist <= radius:
                    if door.detect(perception):
                        detected.append(door)
        return detected

    def get_hidden_doors(self) -> List[SecretDoor]:
        """Get all hidden secret doors."""
        return [door for door in self.doors if door.hidden]

    def get_revealed_doors(self) -> List[SecretDoor]:
        """Get all revealed secret doors."""
        return [door for door in self.doors if not door.hidden]

    def get_all_positions(self) -> List[Tuple[int, int]]:
        """Get positions of all secret doors (for dungeon generation)."""
        return [(door.x, door.y) for door in self.doors]

    def clear(self):
        """Remove all secret doors."""
        self.doors.clear()

    def __len__(self) -> int:
        return len(self.doors)
