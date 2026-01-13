"""Visual decoration and terrain placement for dungeons.

Handles placing decorations, terrain features, and blood stains.
"""
import random
from typing import TYPE_CHECKING

from ..core.constants import (
    TileType, RoomType,
    THEME_DECORATIONS, THEME_TERRAIN, TERRAIN_BLOOD
)

if TYPE_CHECKING:
    from .dungeon import Dungeon


def place_decorations(dungeon: 'Dungeon'):
    """Place decorative objects in rooms based on theme."""
    if not dungeon.rooms:
        return

    # Get theme-specific decorations
    decorations_chars = THEME_DECORATIONS.get(dungeon.theme, [])
    if not decorations_chars:
        return

    for room in dungeon.rooms:
        room_area = room.area()

        # Special handling for room types
        if room.room_type == RoomType.SHRINE:
            # Shrine: center statue
            center_x, center_y = room.center()
            if dungeon.tiles[center_y][center_x] == TileType.FLOOR:
                statue_char = decorations_chars[-1] if len(decorations_chars) > 1 else decorations_chars[0]
                dungeon.decorations.append((center_x, center_y, statue_char, 1))
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
                dungeon.decorations.append((room.x + 1, room.y + 1, pillar_char, 1))
                # Top-right corner (inner)
                dungeon.decorations.append((room.x + room.width - 2, room.y + 1, pillar_char, 1))
                # Bottom-left corner (inner)
                dungeon.decorations.append((room.x + 1, room.y + room.height - 2, pillar_char, 1))
                # Bottom-right corner (inner)
                dungeon.decorations.append((room.x + room.width - 2, room.y + room.height - 2, pillar_char, 1))

        # Place random decorations
        for _ in range(num_decorations):
            # Try to find a good spot
            for attempt in range(10):
                x = random.randint(room.x + 1, room.x + room.width - 2)
                y = random.randint(room.y + 1, room.y + room.height - 2)

                # Check if position is valid
                if dungeon.tiles[y][x] == TileType.FLOOR:
                    # For shrines, allow center decorations
                    # For others, avoid center
                    center_x, center_y = room.center()
                    if room.room_type == RoomType.SHRINE or abs(x - center_x) > 1 or abs(y - center_y) > 1:
                        # Choose random decoration character
                        deco_char = random.choice(decorations_chars)
                        dungeon.decorations.append((x, y, deco_char, 1))  # color_pair 1 = white
                        break


def place_terrain(dungeon: 'Dungeon'):
    """Place terrain features (water, grass, etc.) based on theme."""
    terrain_chars = THEME_TERRAIN.get(dungeon.theme, [])
    if not terrain_chars:
        return

    # Place terrain in some rooms
    num_rooms_with_terrain = max(1, len(dungeon.rooms) // 3)  # ~33% of rooms
    rooms_to_decorate = random.sample(dungeon.rooms, min(num_rooms_with_terrain, len(dungeon.rooms)))

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
                if dungeon.tiles[y][x] == TileType.FLOOR:
                    # Check not on stairs or decoration
                    if (x, y) != dungeon.stairs_up_pos and (x, y) != dungeon.stairs_down_pos:
                        # Check no decoration at this spot
                        if not any(dx == x and dy == y for dx, dy, _, _ in dungeon.decorations):
                            terrain_char = random.choice(terrain_chars)
                            # Color_pair 5 = cyan (good for water/features)
                            dungeon.terrain_features.append((x, y, terrain_char, 5))
                            break


def add_blood_stain(dungeon: 'Dungeon', x: int, y: int):
    """Add a blood stain at the specified location (for when enemies die)."""
    if 0 <= x < dungeon.width and 0 <= y < dungeon.height:
        if dungeon.tiles[y][x] == TileType.FLOOR:
            # Color_pair 3 = red
            dungeon.terrain_features.append((x, y, TERRAIN_BLOOD, 3))
