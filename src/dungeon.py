"""Dungeon generation using Binary Space Partitioning."""
import random
from dataclasses import dataclass
from typing import List, Tuple

from .constants import (
    TileType, DUNGEON_WIDTH, DUNGEON_HEIGHT,
    MIN_ROOM_SIZE, MAX_ROOM_SIZE, MAX_BSP_DEPTH
)


@dataclass
class Room:
    """Represents a rectangular room in the dungeon."""
    x: int
    y: int
    width: int
    height: int

    def center(self) -> Tuple[int, int]:
        """Return the center coordinates of the room."""
        return (self.x + self.width // 2, self.y + self.height // 2)

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


class Dungeon:
    """Represents the game dungeon with procedural generation."""

    def __init__(self, width: int = DUNGEON_WIDTH, height: int = DUNGEON_HEIGHT, seed: int = None, level: int = 1, has_stairs_up: bool = False):
        self.width = width
        self.height = height
        self.level = level
        self.tiles = [[TileType.WALL for _ in range(width)] for _ in range(height)]
        self.rooms = []
        self.stairs_up_pos = None
        self.stairs_down_pos = None
        self.has_stairs_up = has_stairs_up

        # FOV tracking arrays
        self.explored = [[False for _ in range(width)] for _ in range(height)]
        self.visible = [[False for _ in range(width)] for _ in range(height)]

        if seed is not None:
            random.seed(seed)

        self._generate()

    def _generate(self):
        """Generate the dungeon using BSP algorithm."""
        # Create root BSP node
        root = BSPNode(0, 0, self.width, self.height)

        # Split the space recursively
        self._split_node(root)

        # Create rooms in leaf nodes
        self._create_rooms(root)

        # Get all rooms
        self.rooms = root.get_rooms()

        # Carve out rooms
        for room in self.rooms:
            self._carve_room(room)

        # Connect rooms with corridors
        self._create_corridors(root)

        # Place stairs
        self._place_stairs()

    def _split_node(self, node: BSPNode):
        """Recursively split a BSP node."""
        if node.split():
            self._split_node(node.left_child)
            self._split_node(node.right_child)

    def _create_rooms(self, node: BSPNode):
        """Create rooms in all leaf nodes."""
        if node.left_child is None and node.right_child is None:
            # Leaf node - create a room
            node.create_room()
        else:
            # Internal node - recurse to children
            if node.left_child:
                self._create_rooms(node.left_child)
            if node.right_child:
                self._create_rooms(node.right_child)

    def _carve_room(self, room: Room):
        """Carve out a room in the dungeon tiles."""
        for y in range(room.y, room.y + room.height):
            for x in range(room.x, room.x + room.width):
                if 0 <= x < self.width and 0 <= y < self.height:
                    self.tiles[y][x] = TileType.FLOOR

    def _create_corridors(self, node: BSPNode):
        """Recursively create corridors connecting rooms."""
        if node.left_child and node.right_child:
            # Get a room from each child
            left_rooms = node.left_child.get_rooms()
            right_rooms = node.right_child.get_rooms()

            if left_rooms and right_rooms:
                # Connect centers of random rooms from each side
                left_room = random.choice(left_rooms)
                right_room = random.choice(right_rooms)

                left_center = left_room.center()
                right_center = right_room.center()

                # Create L-shaped corridor
                if random.choice([True, False]):
                    self._carve_horizontal_corridor(left_center[0], right_center[0], left_center[1])
                    self._carve_vertical_corridor(left_center[1], right_center[1], right_center[0])
                else:
                    self._carve_vertical_corridor(left_center[1], right_center[1], left_center[0])
                    self._carve_horizontal_corridor(left_center[0], right_center[0], right_center[1])

            # Recurse to children
            self._create_corridors(node.left_child)
            self._create_corridors(node.right_child)

    def _carve_horizontal_corridor(self, x1: int, x2: int, y: int):
        """Carve a horizontal corridor."""
        for x in range(min(x1, x2), max(x1, x2) + 1):
            if 0 <= x < self.width and 0 <= y < self.height:
                self.tiles[y][x] = TileType.FLOOR

    def _carve_vertical_corridor(self, y1: int, y2: int, x: int):
        """Carve a vertical corridor."""
        for y in range(min(y1, y2), max(y1, y2) + 1):
            if 0 <= x < self.width and 0 <= y < self.height:
                self.tiles[y][x] = TileType.FLOOR

    def _place_stairs(self):
        """Place stairs up and down in the dungeon."""
        if len(self.rooms) < 2:
            return

        # Place stairs up in first room (if not on first level)
        if self.has_stairs_up:
            first_room = self.rooms[0]
            center = first_room.center()
            self.stairs_up_pos = center
            self.tiles[center[1]][center[0]] = TileType.STAIRS_UP

        # Place stairs down in last room
        last_room = self.rooms[-1]
        center = last_room.center()
        self.stairs_down_pos = center
        self.tiles[center[1]][center[0]] = TileType.STAIRS_DOWN

    def is_walkable(self, x: int, y: int) -> bool:
        """Check if a position is walkable."""
        if not (0 <= x < self.width and 0 <= y < self.height):
            return False
        tile = self.tiles[y][x]
        return tile in (TileType.FLOOR, TileType.STAIRS_DOWN, TileType.STAIRS_UP)

    def get_random_floor_position(self) -> Tuple[int, int]:
        """Return a random walkable floor position."""
        while True:
            x = random.randint(0, self.width - 1)
            y = random.randint(0, self.height - 1)
            if self.is_walkable(x, y):
                return (x, y)

    def is_blocking_sight(self, x: int, y: int) -> bool:
        """Check if a tile blocks line of sight (walls block, floors don't)."""
        if not (0 <= x < self.width and 0 <= y < self.height):
            return True
        return self.tiles[y][x] == TileType.WALL

    def update_fov(self, center_x: int, center_y: int):
        """
        Update the visible array based on player position.
        Also marks visible tiles as explored.
        """
        from .fov import calculate_fov
        from .constants import FOV_RADIUS

        # Clear previous visibility
        for y in range(self.height):
            for x in range(self.width):
                self.visible[y][x] = False

        # Calculate new FOV
        visible_tiles = calculate_fov(
            center_x, center_y, FOV_RADIUS,
            self.is_blocking_sight,
            self.width, self.height
        )

        # Update visible and explored arrays
        for x, y in visible_tiles:
            if 0 <= x < self.width and 0 <= y < self.height:
                self.visible[y][x] = True
                self.explored[y][x] = True
