"""Binary Space Partitioning structures for dungeon generation.

Contains the Room dataclass and BSPNode class used during procedural
dungeon generation.
"""
import random
from dataclasses import dataclass
from typing import List, Tuple

from ..core.constants import (
    RoomType,
    MIN_ROOM_SIZE, MAX_ROOM_SIZE, MAX_BSP_DEPTH,
)


@dataclass
class Room:
    """Represents a rectangular room in the dungeon."""
    x: int
    y: int
    width: int
    height: int
    room_type: RoomType = RoomType.NORMAL
    zone: str = "generic"

    def center(self) -> Tuple[int, int]:
        """Return the center coordinates of the room."""
        return (self.x + self.width // 2, self.y + self.height // 2)

    def area(self) -> int:
        """Return the area of the room."""
        return self.width * self.height

    def intersects(self, other: 'Room') -> bool:
        """Check if this room intersects with another room."""
        return (self.x < other.x + other.width and
                self.x + self.width > other.x and
                self.y < other.y + other.height and
                self.y + self.height > other.y)


class BSPNode:
    """Node in the Binary Space Partitioning tree."""

    def __init__(self, x: int, y: int, width: int, height: int, depth: int = 0):
        self.x = x
        self.y = y
        self.width = width
        self.height = height
        self.depth = depth
        self.left_child = None
        self.right_child = None
        self.room = None

    def split(self) -> bool:
        """Split this node into two children."""
        # Stop splitting if we've reached max depth or node is too small
        if self.depth >= MAX_BSP_DEPTH:
            return False

        # Need at least MIN_ROOM_SIZE * 2 + 2 to split (room on each side + 2 for split space)
        if self.width <= MIN_ROOM_SIZE * 2 or self.height <= MIN_ROOM_SIZE * 2:
            return False

        # Determine split orientation based on available space
        can_split_horizontally = self.height > MIN_ROOM_SIZE * 2
        can_split_vertically = self.width > MIN_ROOM_SIZE * 2

        if not can_split_horizontally and not can_split_vertically:
            return False

        # Choose split direction
        if can_split_horizontally and not can_split_vertically:
            split_horizontally = True
        elif can_split_vertically and not can_split_horizontally:
            split_horizontally = False
        else:
            split_horizontally = random.choice([True, False])

        # Determine split position
        if split_horizontally:
            max_split = self.height - MIN_ROOM_SIZE
            if max_split <= MIN_ROOM_SIZE:
                return False
            split_pos = random.randint(MIN_ROOM_SIZE, max_split)

            self.left_child = BSPNode(self.x, self.y, self.width, split_pos, self.depth + 1)
            self.right_child = BSPNode(self.x, self.y + split_pos,
                                      self.width, self.height - split_pos, self.depth + 1)
        else:
            max_split = self.width - MIN_ROOM_SIZE
            if max_split <= MIN_ROOM_SIZE:
                return False
            split_pos = random.randint(MIN_ROOM_SIZE, max_split)

            self.left_child = BSPNode(self.x, self.y, split_pos, self.height, self.depth + 1)
            self.right_child = BSPNode(self.x + split_pos, self.y,
                                      self.width - split_pos, self.height, self.depth + 1)

        return True

    def create_room(self):
        """Create a room within this node's boundaries."""
        # Ensure the node is large enough for a room with margins
        max_room_width = max(MIN_ROOM_SIZE, min(MAX_ROOM_SIZE, self.width - 2))
        max_room_height = max(MIN_ROOM_SIZE, min(MAX_ROOM_SIZE, self.height - 2))

        # If node is too small, fill entire node with room
        if max_room_width < MIN_ROOM_SIZE:
            room_width = self.width
            room_x = self.x
        else:
            room_width = random.randint(MIN_ROOM_SIZE, max_room_width)
            max_x_offset = max(0, self.width - room_width - 1)
            room_x = self.x + (random.randint(0, max_x_offset) if max_x_offset > 0 else 0)

        if max_room_height < MIN_ROOM_SIZE:
            room_height = self.height
            room_y = self.y
        else:
            room_height = random.randint(MIN_ROOM_SIZE, max_room_height)
            max_y_offset = max(0, self.height - room_height - 1)
            room_y = self.y + (random.randint(0, max_y_offset) if max_y_offset > 0 else 0)

        self.room = Room(room_x, room_y, room_width, room_height)

    def get_rooms(self) -> List[Room]:
        """Recursively collect all rooms from this node and its children."""
        if self.room:
            return [self.room]

        rooms = []
        if self.left_child:
            rooms.extend(self.left_child.get_rooms())
        if self.right_child:
            rooms.extend(self.right_child.get_rooms())

        return rooms
