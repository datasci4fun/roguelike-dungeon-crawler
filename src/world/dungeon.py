"""Dungeon generation using Binary Space Partitioning."""
import random
from dataclasses import dataclass
from typing import List, Tuple

from ..core.constants import (
    TileType, DungeonTheme, RoomType, TrapType, HazardType,
    DUNGEON_WIDTH, DUNGEON_HEIGHT,
    MIN_ROOM_SIZE, MAX_ROOM_SIZE, MAX_BSP_DEPTH,
    LEVEL_THEMES, THEME_TILES, THEME_TILES_ASCII,
    THEME_DECORATIONS, THEME_DECORATIONS_ASCII,
    THEME_TERRAIN, TERRAIN_BLOOD
)
from .traps import Trap, TrapManager
from .hazards import Hazard, HazardManager


@dataclass
class Room:
    """Represents a rectangular room in the dungeon."""
    x: int
    y: int
    width: int
    height: int
    room_type: RoomType = RoomType.NORMAL

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
        if not self.rooms:
            return

        # Get theme-specific decorations
        decorations_chars = THEME_DECORATIONS.get(self.theme, [])
        if not decorations_chars:
            return

        for room in self.rooms:
            room_area = room.area()

            # Special handling for room types
            if room.room_type == RoomType.SHRINE:
                # Shrine: center statue
                center_x, center_y = room.center()
                if self.tiles[center_y][center_x] == TileType.FLOOR:
                    statue_char = decorations_chars[-1] if len(decorations_chars) > 1 else decorations_chars[0]
                    self.decorations.append((center_x, center_y, statue_char, 1))
                num_decorations = 2  # Plus a few around the edges
            elif room.room_type == RoomType.TREASURY:
                # Treasury: lots of loot-themed decorations
                num_decorations = random.randint(6, 10)
            elif room.room_type == RoomType.BOSS_ROOM:
                # Boss room: elaborate decorations + corner pillars
                num_decorations = random.randint(8, 12)
            elif room.room_type == RoomType.LARGE_HALL:
                # Large hall: medium decorations + corner pillars
                num_decorations = random.randint(4, 6)
            else:
                # Normal room: based on size
                if room_area < 30:
                    num_decorations = random.randint(1, 2)
                elif room_area < 60:
                    num_decorations = random.randint(2, 4)
                else:
                    num_decorations = random.randint(4, 6)

            # Add corner pillars for large rooms, large halls, and boss rooms
            if room.room_type in (RoomType.LARGE_HALL, RoomType.BOSS_ROOM) or room_area >= 60:
                if room.width >= 8 and room.height >= 6:
                    pillar_char = decorations_chars[0]  # First decoration is usually pillar/statue
                    # Top-left corner (inner)
                    self.decorations.append((room.x + 1, room.y + 1, pillar_char, 1))
                    # Top-right corner (inner)
                    self.decorations.append((room.x + room.width - 2, room.y + 1, pillar_char, 1))
                    # Bottom-left corner (inner)
                    self.decorations.append((room.x + 1, room.y + room.height - 2, pillar_char, 1))
                    # Bottom-right corner (inner)
                    self.decorations.append((room.x + room.width - 2, room.y + room.height - 2, pillar_char, 1))

            # Place random decorations
            for _ in range(num_decorations):
                # Try to find a good spot
                for attempt in range(10):
                    x = random.randint(room.x + 1, room.x + room.width - 2)
                    y = random.randint(room.y + 1, room.y + room.height - 2)

                    # Check if position is valid
                    if self.tiles[y][x] == TileType.FLOOR:
                        # For shrines, allow center decorations
                        # For others, avoid center
                        center_x, center_y = room.center()
                        if room.room_type == RoomType.SHRINE or abs(x - center_x) > 1 or abs(y - center_y) > 1:
                            # Choose random decoration character
                            deco_char = random.choice(decorations_chars)
                            self.decorations.append((x, y, deco_char, 1))  # color_pair 1 = white
                            break

    def _place_terrain(self):
        """Place terrain features (water, grass, etc.) based on theme."""
        terrain_chars = THEME_TERRAIN.get(self.theme, [])
        if not terrain_chars:
            return

        # Place terrain in some rooms
        num_rooms_with_terrain = max(1, len(self.rooms) // 3)  # ~33% of rooms
        rooms_to_decorate = random.sample(self.rooms, min(num_rooms_with_terrain, len(self.rooms)))

        for room in rooms_to_decorate:
            # Number of terrain features based on room size
            room_area = room.area()
            max_features = max(2, min(8, room_area // 10))  # Ensure at least 2
            num_features = random.randint(2, max_features)

            for _ in range(num_features):
                for attempt in range(10):
                    x = random.randint(room.x + 1, room.x + room.width - 2)
                    y = random.randint(room.y + 1, room.y + room.height - 2)

                    # Check if valid floor tile
                    if self.tiles[y][x] == TileType.FLOOR:
                        # Check not on stairs or decoration
                        if (x, y) != self.stairs_up_pos and (x, y) != self.stairs_down_pos:
                            # Check no decoration at this spot
                            if not any(dx == x and dy == y for dx, dy, _, _ in self.decorations):
                                terrain_char = random.choice(terrain_chars)
                                # Color_pair 5 = cyan (good for water/features)
                                self.terrain_features.append((x, y, terrain_char, 5))
                                break

    def add_blood_stain(self, x: int, y: int):
        """Add a blood stain at the specified location (for when enemies die)."""
        if 0 <= x < self.width and 0 <= y < self.height:
            if self.tiles[y][x] == TileType.FLOOR:
                # Color_pair 3 = red
                self.terrain_features.append((x, y, TERRAIN_BLOOD, 3))

    def is_walkable(self, x: int, y: int) -> bool:
        """Check if a position is walkable."""
        if not (0 <= x < self.width and 0 <= y < self.height):
            return False
        tile = self.tiles[y][x]
        return tile in (TileType.FLOOR, TileType.STAIRS_DOWN, TileType.STAIRS_UP)

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

    def is_blocking_sight(self, x: int, y: int) -> bool:
        """Check if a tile blocks line of sight (walls block, floors don't)."""
        if not (0 <= x < self.width and 0 <= y < self.height):
            return True
        return self.tiles[y][x] == TileType.WALL

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
    # v4.0: Trap and Hazard Generation
    # =========================================================================

    def generate_traps(self, trap_manager: TrapManager, player_x: int, player_y: int):
        """
        Generate traps for this dungeon level.

        Args:
            trap_manager: The TrapManager to add traps to
            player_x, player_y: Player position to avoid placing traps there
        """
        # Number of traps scales with dungeon level (3-6 per level)
        num_traps = 2 + self.level

        # Available trap types based on level
        available_traps = []
        if self.level >= 1:
            available_traps.append(TrapType.SPIKE)
        if self.level >= 2:
            available_traps.append(TrapType.ARROW)
        if self.level >= 3:
            available_traps.append(TrapType.FIRE)
            available_traps.append(TrapType.POISON)

        if not available_traps:
            return

        # Positions to avoid (player, stairs)
        avoid_positions = {(player_x, player_y)}
        if self.stairs_up_pos:
            avoid_positions.add(self.stairs_up_pos)
        if self.stairs_down_pos:
            avoid_positions.add(self.stairs_down_pos)

        placed = 0
        attempts = 0
        max_attempts = num_traps * 20

        while placed < num_traps and attempts < max_attempts:
            attempts += 1

            # Get random floor position
            pos = self.get_random_floor_position()

            # Avoid player and stairs
            if pos in avoid_positions:
                continue

            # Avoid placing too close to player start
            if abs(pos[0] - player_x) <= 3 and abs(pos[1] - player_y) <= 3:
                continue

            # Avoid placing on decorations
            if any(dx == pos[0] and dy == pos[1] for dx, dy, _, _ in self.decorations):
                continue

            # Prefer corridors and doorways for traps
            # (positions with fewer adjacent floor tiles)
            adjacent_floors = sum(
                1 for dx, dy in [(0, 1), (0, -1), (1, 0), (-1, 0)]
                if self.is_walkable(pos[0] + dx, pos[1] + dy)
            )

            # 70% chance for corridor placement (2-3 adjacent floors)
            # 30% chance for room placement
            if adjacent_floors > 3 and random.random() > 0.3:
                continue

            # Create and place trap
            trap_type = random.choice(available_traps)
            trap = Trap(x=pos[0], y=pos[1], trap_type=trap_type)
            trap_manager.add_trap(trap)
            avoid_positions.add(pos)
            placed += 1

    def generate_hazards(self, hazard_manager: HazardManager, player_x: int, player_y: int):
        """
        Generate environmental hazards for this dungeon level.

        Args:
            hazard_manager: The HazardManager to add hazards to
            player_x, player_y: Player position to avoid placing hazards there
        """
        # Hazards based on dungeon theme and level
        hazard_config = self._get_hazard_config()
        if not hazard_config:
            return

        for hazard_type, (min_count, max_count) in hazard_config.items():
            num_hazards = random.randint(min_count, max_count)
            self._place_hazard_zone(hazard_manager, hazard_type, num_hazards, player_x, player_y)

    def _get_hazard_config(self) -> dict:
        """Get hazard configuration based on theme and level."""
        config = {}

        # Ice hazards in crypt (levels 2-3)
        if self.theme == DungeonTheme.CRYPT:
            config[HazardType.ICE] = (2, 4)

        # Lava in deep dungeon (levels 4-5)
        if self.level >= 4:
            config[HazardType.LAVA] = (2, 4)

        # Poison gas can appear anywhere after level 2
        if self.level >= 2:
            if random.random() < 0.3:  # 30% chance
                config[HazardType.POISON_GAS] = (1, 2)

        # Deep water can appear in any theme
        if random.random() < 0.2:  # 20% chance
            config[HazardType.DEEP_WATER] = (3, 6)

        return config

    def _place_hazard_zone(
        self,
        hazard_manager: HazardManager,
        hazard_type: HazardType,
        count: int,
        player_x: int,
        player_y: int
    ):
        """Place a zone of hazards of a specific type."""
        # Choose a random room for the hazard zone
        if not self.rooms:
            return

        # Avoid the room with stairs down for hazards
        valid_rooms = [r for r in self.rooms if r.center() != self.stairs_down_pos]
        if not valid_rooms:
            valid_rooms = self.rooms

        room = random.choice(valid_rooms)

        # Positions to avoid
        avoid_positions = {(player_x, player_y)}
        if self.stairs_up_pos:
            avoid_positions.add(self.stairs_up_pos)
        if self.stairs_down_pos:
            avoid_positions.add(self.stairs_down_pos)

        placed = 0
        attempts = 0
        max_attempts = count * 10

        # Start position for the zone (cluster hazards together)
        start_x = random.randint(room.x + 1, room.x + room.width - 2)
        start_y = random.randint(room.y + 1, room.y + room.height - 2)

        while placed < count and attempts < max_attempts:
            attempts += 1

            # Spread from start position
            offset_x = random.randint(-2, 2)
            offset_y = random.randint(-2, 2)
            pos = (start_x + offset_x, start_y + offset_y)

            # Check bounds
            if not (0 <= pos[0] < self.width and 0 <= pos[1] < self.height):
                continue

            # Must be walkable
            if not self.is_walkable(pos[0], pos[1]):
                continue

            # Avoid player and stairs
            if pos in avoid_positions:
                continue

            # Avoid too close to player
            if abs(pos[0] - player_x) <= 2 and abs(pos[1] - player_y) <= 2:
                continue

            # Check not already a hazard there
            if hazard_manager.has_hazard_at(pos[0], pos[1]):
                continue

            # Create hazard
            intensity = 3 if hazard_type == HazardType.POISON_GAS else 1
            hazard = Hazard(x=pos[0], y=pos[1], hazard_type=hazard_type, intensity=intensity)
            hazard_manager.add_hazard(hazard)
            avoid_positions.add(pos)
            placed += 1
