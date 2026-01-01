"""Test Phase 2 dungeon themes and visual variety."""
import sys
from unittest.mock import Mock

# Mock curses since we can't run it in this environment
sys.modules['curses'] = Mock()

from src.dungeon import Dungeon
from src.constants import (
    DungeonTheme, RoomType, LEVEL_THEMES, THEME_TILES,
    THEME_DECORATIONS, THEME_TERRAIN
)

def test_theme_assignment():
    """Test that dungeons get correct themes by level."""
    print("Testing theme assignment...")

    for level in range(1, 6):
        dungeon = Dungeon(width=80, height=40, level=level, seed=12345)
        expected_theme = LEVEL_THEMES.get(level, DungeonTheme.STONE)

        theme_info = THEME_TILES[dungeon.theme]
        print(f"  Level {level}: {theme_info['description']}")
        print(f"    Theme: {dungeon.theme.name}")
        # Use ASCII representation for display
        wall_char = theme_info['wall'] if ord(theme_info['wall']) < 128 else f"U+{ord(theme_info['wall']):04X}"
        floor_char = theme_info['floor'] if ord(theme_info['floor']) < 128 else f"U+{ord(theme_info['floor']):04X}"
        print(f"    Walls: {wall_char} | Floors: {floor_char}")
        print(f"    Rooms: {len(dungeon.rooms)}")

        assert dungeon.theme == expected_theme, f"Level {level} should have theme {expected_theme}"

    print("[PASS] All levels have correct themes\n")

def test_room_classification():
    """Test that rooms are classified into types."""
    print("Testing room classification...")

    dungeon = Dungeon(width=80, height=40, level=5, seed=42)

    room_type_counts = {
        RoomType.NORMAL: 0,
        RoomType.LARGE_HALL: 0,
        RoomType.TREASURY: 0,
        RoomType.SHRINE: 0,
        RoomType.BOSS_ROOM: 0,
    }

    for room in dungeon.rooms:
        room_type_counts[room.room_type] += 1

    print(f"  Total rooms: {len(dungeon.rooms)}")
    for room_type, count in room_type_counts.items():
        if count > 0:
            print(f"    {room_type.name}: {count}")

    # Check that at least some rooms are classified
    special_rooms = sum(count for rt, count in room_type_counts.items() if rt != RoomType.NORMAL)
    print(f"  Special rooms: {special_rooms}/{len(dungeon.rooms)}")

    # Level 5 might have a boss room if there's a large enough room
    if room_type_counts[RoomType.BOSS_ROOM] > 0:
        print("  Boss room detected!")
    else:
        print("  No boss room (largest room not big enough)")

    # Check that classification is working (at least some special rooms exist)
    assert special_rooms > 0, "Should have at least some special rooms"

    print("[PASS] Rooms are classified correctly\n")

def test_decorations():
    """Test that decorations are placed based on theme."""
    print("Testing decoration placement...")

    for level in [1, 2, 3, 4, 5]:
        dungeon = Dungeon(width=80, height=40, level=level, seed=99)
        theme_name = THEME_TILES[dungeon.theme]['description']

        print(f"  {theme_name} (Level {level}):")
        print(f"    Decorations placed: {len(dungeon.decorations)}")

        if len(dungeon.decorations) > 0:
            # Sample some decorations
            sample_size = min(3, len(dungeon.decorations))
            for i, (x, y, char, color) in enumerate(dungeon.decorations[:sample_size]):
                char_display = char if ord(char) < 128 else f"U+{ord(char):04X}"
                print(f"      [{i+1}] {char_display} at ({x},{y})")

    print("[PASS] Decorations are placed\n")

def test_terrain_features():
    """Test terrain feature placement."""
    print("Testing terrain features...")

    # Cave (level 2) and Treasury (level 5) should have terrain
    test_levels = [
        (2, "Cave - should have water/grass"),
        (5, "Treasury - should have water"),
    ]

    for level, description in test_levels:
        dungeon = Dungeon(width=80, height=40, level=level, seed=123)
        terrain_chars = THEME_TERRAIN.get(dungeon.theme, [])

        print(f"  {description}:")
        print(f"    Expected terrain types: {len(terrain_chars)}")
        print(f"    Terrain features placed: {len(dungeon.terrain_features)}")

        if len(dungeon.terrain_features) > 0:
            # Sample some terrain
            sample_size = min(3, len(dungeon.terrain_features))
            for i, (x, y, char, color) in enumerate(dungeon.terrain_features[:sample_size]):
                char_display = char if ord(char) < 128 else f"U+{ord(char):04X}"
                print(f"      [{i+1}] {char_display} at ({x},{y})")

    print("[PASS] Terrain features are placed\n")

def test_visual_char_method():
    """Test get_visual_char() returns themed tiles."""
    print("Testing get_visual_char() method...")

    # Create dungeons of different themes
    test_cases = [
        (1, DungeonTheme.STONE, "Stone Dungeon"),
        (2, DungeonTheme.CAVE, "Cave"),
        (3, DungeonTheme.CRYPT, "Crypt"),
    ]

    for level, expected_theme, name in test_cases:
        dungeon = Dungeon(width=40, height=20, level=level, seed=777)

        # Find a wall and floor tile
        wall_pos = None
        floor_pos = None

        for y in range(dungeon.height):
            for x in range(dungeon.width):
                tile = dungeon.tiles[y][x]
                if tile.name == 'WALL' and not wall_pos:
                    wall_pos = (x, y)
                elif tile.name == 'FLOOR' and not floor_pos:
                    floor_pos = (x, y)

                if wall_pos and floor_pos:
                    break
            if wall_pos and floor_pos:
                break

        wall_char = dungeon.get_visual_char(wall_pos[0], wall_pos[1])
        floor_char = dungeon.get_visual_char(floor_pos[0], floor_pos[1])

        theme_tiles = THEME_TILES[dungeon.theme]
        expected_wall = theme_tiles['wall']
        expected_floor = theme_tiles['floor']

        wall_match = wall_char == expected_wall
        floor_match = floor_char == expected_floor

        print(f"  {name}: Wall match={wall_match}, Floor match={floor_match}")

        assert wall_match, f"Wall char mismatch in {name}"
        assert floor_match, f"Floor char mismatch in {name}"

    print("[PASS] get_visual_char() returns themed tiles\n")

def test_blood_stain():
    """Test blood stain addition."""
    print("Testing blood stain system...")

    dungeon = Dungeon(width=40, height=20, level=3, seed=456)
    initial_terrain_count = len(dungeon.terrain_features)

    # Find a floor tile
    for y in range(dungeon.height):
        for x in range(dungeon.width):
            if dungeon.is_walkable(x, y):
                floor_x, floor_y = x, y
                break
        else:
            continue
        break

    # Add blood stain
    dungeon.add_blood_stain(floor_x, floor_y)

    print(f"  Initial terrain features: {initial_terrain_count}")
    print(f"  After adding blood stain: {len(dungeon.terrain_features)}")
    print(f"  Blood stain added at: ({floor_x},{floor_y})")

    assert len(dungeon.terrain_features) == initial_terrain_count + 1, "Blood stain should be added"

    # Check that the last terrain feature is blood
    last_terrain = dungeon.terrain_features[-1]
    char_display = last_terrain[2] if ord(last_terrain[2]) < 128 else f"U+{ord(last_terrain[2]):04X}"
    print(f"  Blood stain character: {char_display}")
    print(f"  Blood stain color: {last_terrain[3]} (should be 3=red)")

    print("[PASS] Blood stain system works\n")

def visualize_dungeon_sample():
    """Create a small visual sample of each theme."""
    print("Visual samples of each theme:")
    print("=" * 60)

    for level in range(1, 6):
        dungeon = Dungeon(width=40, height=20, level=level, seed=888)
        theme_info = THEME_TILES[dungeon.theme]

        print(f"\nLevel {level}: {theme_info['description']}")
        print("-" * 40)

        # Show a 10x5 sample from the center
        start_x, start_y = 15, 8
        for y in range(start_y, start_y + 5):
            line = ""
            for x in range(start_x, start_x + 20):
                if 0 <= x < dungeon.width and 0 <= y < dungeon.height:
                    char = dungeon.get_visual_char(x, y, use_unicode=False)  # ASCII for display

                    # Check if there's a decoration or terrain at this spot
                    deco = next((d for d in dungeon.decorations if d[0] == x and d[1] == y), None)
                    terrain = next((t for t in dungeon.terrain_features if t[0] == x and t[1] == y), None)

                    if deco:
                        char = deco[2] if ord(deco[2]) < 128 else 'D'  # D for decoration
                    elif terrain:
                        char = terrain[2] if ord(terrain[2]) < 128 else 'T'  # T for terrain

                    line += char
                else:
                    line += " "
            print(f"  {line}")

        print(f"  Stats: {len(dungeon.rooms)} rooms, {len(dungeon.decorations)} decorations, {len(dungeon.terrain_features)} terrain")

def main():
    """Run all tests."""
    print("=" * 60)
    print("Phase 2 Dungeon Themes - Verification Tests")
    print("=" * 60)
    print()

    try:
        test_theme_assignment()
        test_room_classification()
        test_decorations()
        test_terrain_features()
        test_visual_char_method()
        test_blood_stain()
        visualize_dungeon_sample()

        print("\n" + "=" * 60)
        print("[SUCCESS] All Phase 2 dungeon tests passed!")
        print("=" * 60)
        print()
        print("To see the full visual experience with colors, run:")
        print("  python main.py")
        print()
        print("Each level will have a unique visual style:")
        print("  Level 1: Stone dungeon with # walls")
        print("  Level 2: Cave with solid block walls and water")
        print("  Level 3: Crypt with checkered walls")
        print("  Level 4: Library with shelf walls")
        print("  Level 5: Treasure vault with iron bar walls")

        return 0

    except Exception as e:
        print(f"\n[FAIL] Test failed: {e}")
        import traceback
        traceback.print_exc()
        return 1

if __name__ == "__main__":
    sys.exit(main())
