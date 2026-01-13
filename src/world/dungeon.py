"""Dungeon generation using Binary Space Partitioning."""
import random
from dataclasses import dataclass
from typing import List, Optional, Tuple

from ..core.constants import (
    TileType, DungeonTheme, RoomType, TrapType, HazardType,
    DUNGEON_WIDTH, DUNGEON_HEIGHT,
    MIN_ROOM_SIZE, MAX_ROOM_SIZE, MAX_BSP_DEPTH,
    LEVEL_THEMES, THEME_TILES, THEME_TILES_ASCII,
    THEME_DECORATIONS, THEME_DECORATIONS_ASCII,
    THEME_TERRAIN, TERRAIN_BLOOD,
    THEME_TORCH_COUNTS, TORCH_DEFAULT_RADIUS, TORCH_DEFAULT_INTENSITY
)
from .traps import Trap, TrapManager
from .hazards import Hazard, HazardManager
from .secrets import SecretDoor, SecretDoorManager
from .torches import Torch, TorchManager
from .zone_config import get_floor_config
from . import feature_generation
from . import dungeon_zones
from . import dungeon_visual


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

        # Visual variety
        self.theme = LEVEL_THEMES.get(level, DungeonTheme.STONE)
        self.decorations = []  # List of (x, y, char, color_pair) tuples
        self.terrain_features = []  # List of (x, y, char, color_pair) for water, blood, etc.
        self.zone_evidence = []  # List of (x, y, char, color_pair, evidence_type) for zone tells

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

        # Classify room types
        self._classify_rooms()

        # Assign zone identities (drives decorations, spawns, lore)
        self._assign_zones()

        # Apply zone-specific layout modifications (interior walls, special tiles)
        self._apply_zone_layouts()

        # Place zone evidence (boss trail tells, lore props)
        self._place_zone_evidence()

        # Place stairs
        self._place_stairs()

        # Place decorations
        self._place_decorations()

        # Place terrain features
        self._place_terrain()

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

    def _classify_rooms(self):
        """Classify rooms into different types based on size and position."""
        if not self.rooms:
            return

        # Sort rooms by area to find largest
        sorted_rooms = sorted(self.rooms, key=lambda r: r.area(), reverse=True)

        # Classify largest room
        largest = sorted_rooms[0]
        if largest.area() >= 80:
            # Very large room
            if self.level == 5:
                largest.room_type = RoomType.BOSS_ROOM
            else:
                largest.room_type = RoomType.LARGE_HALL

        # Classify other rooms
        for i, room in enumerate(self.rooms):
            if room.room_type != RoomType.NORMAL:
                continue  # Already classified

            area = room.area()

            # Large hall (second largest or significantly big)
            if area >= 70:
                room.room_type = RoomType.LARGE_HALL

            # Small to medium rooms get special types
            elif area >= 30:
                # 20% chance for special room types
                rand = random.random()
                if rand < 0.1:
                    room.room_type = RoomType.SHRINE
                elif rand < 0.2:
                    room.room_type = RoomType.TREASURY
                # else: remains NORMAL

    def _assign_zones(self):
        """Assign zone identities to rooms based on dungeon level."""
        dungeon_zones.assign_zones(self)

    def _apply_zone_layouts(self):
        """Apply zone-specific layout modifications to rooms."""
        dungeon_zones.apply_zone_layouts_to_dungeon(self)

    def _place_zone_evidence(self):
        """Place zone evidence (boss trail tells, lore props)."""
        dungeon_zones.place_zone_evidence(self)

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

    def _place_decorations(self):
        """Place decorative objects in rooms based on theme."""
        dungeon_visual.place_decorations(self)

    def _place_terrain(self):
        """Place terrain features (water, grass, etc.) based on theme."""
        dungeon_visual.place_terrain(self)

    def add_blood_stain(self, x: int, y: int):
        """Add a blood stain at the specified location (for when enemies die)."""
        dungeon_visual.add_blood_stain(self, x, y)

    def is_walkable(self, x: int, y: int) -> bool:
        """Check if a position is walkable.

        Includes hazard tiles (LAVA, ICE, DEEP_WATER, POISON_GAS) which are
        walkable but apply effects via the hazard system.
        """
        if not (0 <= x < self.width and 0 <= y < self.height):
            return False
        tile = self.tiles[y][x]
        walkable_tiles = (
            TileType.FLOOR,
            TileType.STAIRS_DOWN,
            TileType.STAIRS_UP,
            # Hazard tiles are walkable but dangerous
            TileType.LAVA,
            TileType.ICE,
            TileType.DEEP_WATER,
            TileType.POISON_GAS,
        )
        return tile in walkable_tiles

    def get_visual_char(self, x: int, y: int, use_unicode: bool = True) -> str:
        """
        Get the visual character for a tile based on the dungeon theme.

        Args:
            x: X coordinate
            y: Y coordinate
            use_unicode: Whether to use Unicode characters (fallback to ASCII if False)

        Returns:
            The character to display for this tile
        """
        if not (0 <= x < self.width and 0 <= y < self.height):
            return ' '

        tile = self.tiles[y][x]

        # Handle special tiles that don't change with theme
        if tile == TileType.STAIRS_DOWN:
            return '>'
        elif tile == TileType.STAIRS_UP:
            return '<'
        elif tile == TileType.EMPTY:
            return ' '

        # Get theme-appropriate tiles
        theme_tiles = THEME_TILES if use_unicode else THEME_TILES_ASCII

        if tile == TileType.WALL:
            return theme_tiles[self.theme]['wall']
        elif tile == TileType.FLOOR:
            return theme_tiles[self.theme]['floor']

        # Fallback to tile's default value
        return tile.value

    def get_random_floor_position(self) -> Tuple[int, int]:
        """Return a random walkable floor position."""
        while True:
            x = random.randint(0, self.width - 1)
            y = random.randint(0, self.height - 1)
            if self.is_walkable(x, y):
                return (x, y)

    def get_room_at(self, x: int, y: int) -> Optional[Room]:
        """Return the Room containing position (x, y), or None if not in a room."""
        for room in self.rooms:
            if (room.x <= x < room.x + room.width and
                room.y <= y < room.y + room.height):
                return room
        return None

    def get_zone_at(self, x: int, y: int) -> str:
        """Return the zone name for position (x, y)."""
        room = self.get_room_at(x, y)
        if room:
            return room.zone
        return "corridor"  # Positions outside rooms are corridors

    def get_zone_summary(self) -> str:
        """Return a debug summary of zone assignments for all rooms."""
        if not self.rooms:
            return "No rooms generated"

        lines = [f"Floor {self.level} Zone Summary ({len(self.rooms)} rooms):"]

        # Warnings first
        if hasattr(self, '_zone_warnings') and self._zone_warnings:
            lines.append("\n[!] WARNINGS:")
            for warning in self._zone_warnings:
                lines.append(f"  {warning}")

        # Zone counts
        zone_counts = {}
        for room in self.rooms:
            zone = room.zone
            zone_counts[zone] = zone_counts.get(zone, 0) + 1

        lines.append("\nZone totals:")
        for zone, count in sorted(zone_counts.items()):
            lines.append(f"  {zone}: {count}")

        # Anchor rooms
        if hasattr(self, '_anchor_rooms') and self._anchor_rooms:
            lines.append("\nAnchor rooms:")
            for zone_id, rooms in self._anchor_rooms.items():
                for room in rooms:
                    lines.append(f"  {zone_id}: ({room.x},{room.y}) {room.width}x{room.height} area={room.area()}")

        # Boss approach rooms
        if hasattr(self, '_approach_rooms') and self._approach_rooms:
            lines.append("\nBoss approach rooms:")
            for room in self._approach_rooms:
                cx, cy = room.center()
                lines.append(f"  ({room.x},{room.y}) {room.width}x{room.height} center=({cx},{cy})")

        # All rooms (detailed)
        lines.append("\nAll rooms:")
        for room in self.rooms:
            lines.append(f"  ({room.x},{room.y}) {room.width}x{room.height} area={room.area()}: {room.zone}")

        return "\n".join(lines)

    def is_blocking_sight(self, x: int, y: int) -> bool:
        """Check if a tile blocks line of sight (walls and closed doors block)."""
        if not (0 <= x < self.width and 0 <= y < self.height):
            return True
        tile = self.tiles[y][x]
        # Walls always block sight
        if tile == TileType.WALL:
            return True
        # Locked/closed doors block sight (open doors don't)
        if tile == TileType.DOOR_LOCKED:
            return True
        return False

    def update_fov(self, center_x: int, center_y: int, vision_bonus: int = 0):
        """
        Update the visible array based on player position.
        Also marks visible tiles as explored.

        Args:
            center_x: Player X position
            center_y: Player Y position
            vision_bonus: Additional vision range (e.g., from Elf's Keen Sight)
        """
        from .fov import calculate_fov
        from ..core.constants import FOV_RADIUS

        # Clear previous visibility
        for y in range(self.height):
            for x in range(self.width):
                self.visible[y][x] = False

        # Calculate new FOV with bonus
        effective_radius = FOV_RADIUS + vision_bonus
        visible_tiles = calculate_fov(
            center_x, center_y, effective_radius,
            self.is_blocking_sight,
            self.width, self.height
        )

        # Update visible and explored arrays
        for x, y in visible_tiles:
            if 0 <= x < self.width and 0 <= y < self.height:
                self.visible[y][x] = True
                self.explored[y][x] = True

    # =========================================================================
    # v4.0+: Feature Generation (delegated to feature_generation module)
    # =========================================================================

    def generate_traps(self, trap_manager: TrapManager, player_x: int, player_y: int):
        """Generate traps for this dungeon level."""
        feature_generation.generate_traps(self, trap_manager, player_x, player_y)

    def generate_hazards(self, hazard_manager: HazardManager, player_x: int, player_y: int):
        """Generate environmental hazards for this dungeon level."""
        feature_generation.generate_hazards(self, hazard_manager, player_x, player_y)

    def generate_secret_doors(self, secret_door_manager: SecretDoorManager, player_x: int, player_y: int):
        """Generate secret doors for this dungeon level."""
        feature_generation.generate_secret_doors(self, secret_door_manager, player_x, player_y)

    def generate_torches(self, torch_manager: TorchManager, player_x: int, player_y: int):
        """Generate torches for this dungeon level."""
        feature_generation.generate_torches(self, torch_manager, player_x, player_y)
