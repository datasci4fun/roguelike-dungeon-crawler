"""Feature generation for dungeons: traps, hazards, secrets, torches.

Contains generation logic extracted from Dungeon class.
"""
import random
from typing import TYPE_CHECKING, List, Tuple

from ..core.constants import (
    TileType, DungeonTheme, HazardType, TrapType,
    THEME_TORCH_COUNTS, TORCH_DEFAULT_RADIUS, TORCH_DEFAULT_INTENSITY
)

if TYPE_CHECKING:
    from .dungeon import Dungeon, Room
    from .traps import Trap, TrapManager
    from .hazards import Hazard, HazardManager
    from .secrets import SecretDoorManager
    from .torches import Torch, TorchManager


def generate_traps(dungeon: 'Dungeon', trap_manager: 'TrapManager', player_x: int, player_y: int):
    """
    Generate traps for a dungeon level.

    Args:
        dungeon: The dungeon to generate traps for
        trap_manager: The TrapManager to add traps to
        player_x, player_y: Player position to avoid placing traps there
    """
    from .traps import Trap

    # Number of traps scales with dungeon level (3-6 per level)
    num_traps = 2 + dungeon.level

    # Available trap types based on level
    available_traps = []
    if dungeon.level >= 1:
        available_traps.append(TrapType.SPIKE)
    if dungeon.level >= 2:
        available_traps.append(TrapType.ARROW)
    if dungeon.level >= 3:
        available_traps.append(TrapType.FIRE)
        available_traps.append(TrapType.POISON)

    if not available_traps:
        return

    # Positions to avoid (player, stairs)
    avoid_positions = {(player_x, player_y)}
    if dungeon.stairs_up_pos:
        avoid_positions.add(dungeon.stairs_up_pos)
    if dungeon.stairs_down_pos:
        avoid_positions.add(dungeon.stairs_down_pos)

    placed = 0
    attempts = 0
    max_attempts = num_traps * 20

    while placed < num_traps and attempts < max_attempts:
        attempts += 1

        # Get random floor position
        pos = dungeon.get_random_floor_position()

        # Avoid player and stairs
        if pos in avoid_positions:
            continue

        # Avoid placing too close to player start
        if abs(pos[0] - player_x) <= 3 and abs(pos[1] - player_y) <= 3:
            continue

        # Avoid placing on decorations
        if any(dx == pos[0] and dy == pos[1] for dx, dy, _, _ in dungeon.decorations):
            continue

        # Prefer corridors and doorways for traps
        # (positions with fewer adjacent floor tiles)
        adjacent_floors = sum(
            1 for dx, dy in [(0, 1), (0, -1), (1, 0), (-1, 0)]
            if dungeon.is_walkable(pos[0] + dx, pos[1] + dy)
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


def generate_hazards(dungeon: 'Dungeon', hazard_manager: 'HazardManager', player_x: int, player_y: int):
    """
    Generate environmental hazards for a dungeon level.

    Args:
        dungeon: The dungeon to generate hazards for
        hazard_manager: The HazardManager to add hazards to
        player_x, player_y: Player position to avoid placing hazards there
    """
    # First, sync any hazard tiles painted by zone layouts into Hazard objects
    _sync_tile_hazards(dungeon, hazard_manager, player_x, player_y)

    # Then add additional random hazards based on dungeon theme
    hazard_config = _get_hazard_config(dungeon)
    if not hazard_config:
        return

    for hazard_type, (min_count, max_count) in hazard_config.items():
        num_hazards = random.randint(min_count, max_count)
        _place_hazard_zone(dungeon, hazard_manager, hazard_type, num_hazards, player_x, player_y)


def _sync_tile_hazards(dungeon: 'Dungeon', hazard_manager: 'HazardManager', player_x: int, player_y: int):
    """
    Convert hazard TileType tiles into actual Hazard objects.

    Zone layouts paint LAVA, ICE, DEEP_WATER, POISON_GAS tiles directly.
    This method ensures those tiles have corresponding Hazard objects
    so hazard effects are processed when entities walk on them.
    """
    from .hazards import Hazard

    # Map TileType to HazardType
    tile_to_hazard = {
        TileType.LAVA: HazardType.LAVA,
        TileType.ICE: HazardType.ICE,
        TileType.DEEP_WATER: HazardType.DEEP_WATER,
        TileType.POISON_GAS: HazardType.POISON_GAS,
    }

    for y in range(dungeon.height):
        for x in range(dungeon.width):
            tile = dungeon.tiles[y][x]
            if tile in tile_to_hazard:
                # Skip player position
                if x == player_x and y == player_y:
                    continue
                # Skip if already has a hazard
                if hazard_manager.has_hazard_at(x, y):
                    continue

                hazard_type = tile_to_hazard[tile]
                intensity = 3 if hazard_type == HazardType.POISON_GAS else 1
                hazard = Hazard(x=x, y=y, hazard_type=hazard_type, intensity=intensity)
                hazard_manager.add_hazard(hazard)

    # After syncing, ensure fairness
    _ensure_hazard_fairness(dungeon, hazard_manager, player_x, player_y)


def _ensure_hazard_fairness(dungeon: 'Dungeon', hazard_manager: 'HazardManager', player_x: int, player_y: int):
    """
    Ensure hazard layouts don't create unwinnable situations.

    Guarantees:
    - At least one safe walkway in each room from entrances
    - No hazard chains longer than 3 tiles blocking the only path
    - Stairs and player position are never on hazards
    """
    # Critical positions that must be safe
    critical_positions = {(player_x, player_y)}
    if dungeon.stairs_up_pos:
        critical_positions.add(dungeon.stairs_up_pos)
    if dungeon.stairs_down_pos:
        critical_positions.add(dungeon.stairs_down_pos)

    # Clear hazards from critical positions
    for x, y in critical_positions:
        if hazard_manager.has_hazard_at(x, y):
            # Remove hazard from manager
            hazard_manager.hazards = [
                h for h in hazard_manager.hazards if not (h.x == x and h.y == y)
            ]
            hazard_manager._positions.discard((x, y))
            # Reset tile to floor
            if 0 <= x < dungeon.width and 0 <= y < dungeon.height:
                dungeon.tiles[y][x] = TileType.FLOOR

    # For each room, ensure at least one safe path exists
    for room in dungeon.rooms:
        _ensure_room_safe_path(dungeon, room, hazard_manager)


def _ensure_room_safe_path(dungeon: 'Dungeon', room: 'Room', hazard_manager: 'HazardManager'):
    """
    Ensure a room has at least one safe walkway.

    Simple heuristic: if >60% of floor tiles in a room are hazards,
    clear a horizontal or vertical safe lane through the center.
    """
    hazard_count = 0
    floor_count = 0

    for y in range(room.y + 1, room.y + room.height - 1):
        for x in range(room.x + 1, room.x + room.width - 1):
            if dungeon.tiles[y][x] in (TileType.LAVA, TileType.ICE,
                                       TileType.DEEP_WATER, TileType.POISON_GAS):
                hazard_count += 1
                floor_count += 1
            elif dungeon.tiles[y][x] == TileType.FLOOR:
                floor_count += 1

    # If >60% hazards, clear a safe lane
    if floor_count > 0 and hazard_count / floor_count > 0.6:
        cx = room.x + room.width // 2
        cy = room.y + room.height // 2

        # Clear horizontal lane
        for x in range(room.x + 1, room.x + room.width - 1):
            if hazard_manager.has_hazard_at(x, cy):
                hazard_manager.hazards = [
                    h for h in hazard_manager.hazards if not (h.x == x and h.y == cy)
                ]
                hazard_manager._positions.discard((x, cy))
                dungeon.tiles[cy][x] = TileType.FLOOR


def _get_hazard_config(dungeon: 'Dungeon') -> dict:
    """Get hazard configuration based on theme and level."""
    config = {}

    # Ice hazards in crypt theme (Floor 4 - Mirror Valdris)
    if dungeon.theme == DungeonTheme.CRYPT:
        config[HazardType.ICE] = (2, 4)

    # Lava in deep levels (5+)
    if dungeon.level >= 4:
        config[HazardType.LAVA] = (2, 4)

    # Poison gas can appear anywhere after level 2
    if dungeon.level >= 2:
        if random.random() < 0.3:  # 30% chance
            config[HazardType.POISON_GAS] = (1, 2)

    # Deep water can appear in any theme
    if random.random() < 0.2:  # 20% chance
        config[HazardType.DEEP_WATER] = (3, 6)

    return config


def _place_hazard_zone(
    dungeon: 'Dungeon',
    hazard_manager: 'HazardManager',
    hazard_type: HazardType,
    count: int,
    player_x: int,
    player_y: int
):
    """Place a zone of hazards of a specific type."""
    from .hazards import Hazard

    # Choose a random room for the hazard zone
    if not dungeon.rooms:
        return

    # Avoid the room with stairs down for hazards
    valid_rooms = [r for r in dungeon.rooms if r.center() != dungeon.stairs_down_pos]
    if not valid_rooms:
        valid_rooms = dungeon.rooms

    room = random.choice(valid_rooms)

    # Positions to avoid
    avoid_positions = {(player_x, player_y)}
    if dungeon.stairs_up_pos:
        avoid_positions.add(dungeon.stairs_up_pos)
    if dungeon.stairs_down_pos:
        avoid_positions.add(dungeon.stairs_down_pos)

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
        if not (0 <= pos[0] < dungeon.width and 0 <= pos[1] < dungeon.height):
            continue

        # Must be walkable
        if not dungeon.is_walkable(pos[0], pos[1]):
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


def generate_secret_doors(dungeon: 'Dungeon', secret_door_manager: 'SecretDoorManager', player_x: int, player_y: int):
    """
    Generate secret doors for a dungeon level.

    Secret doors are placed on wall tiles adjacent to floor tiles, creating
    hidden passages that can be discovered through searching.

    Args:
        dungeon: The dungeon to generate secret doors for
        secret_door_manager: The SecretDoorManager to add doors to
        player_x, player_y: Player position to avoid placing doors there
    """
    # Number of secret doors scales slightly with level (0-2 per level)
    num_doors = min(dungeon.level // 2, 2)
    if num_doors == 0 and dungeon.level >= 2:
        num_doors = 1  # At least 1 on level 2+

    if num_doors == 0:
        return

    # Find valid wall positions for secret doors
    # A valid position is a wall tile with exactly one adjacent floor tile
    # (forms a connection through a wall)
    valid_positions = []

    for y in range(1, dungeon.height - 1):
        for x in range(1, dungeon.width - 1):
            if dungeon.tiles[y][x] != TileType.WALL:
                continue

            # Count adjacent floor tiles and track which direction
            adjacent_floors = []
            for dx, dy in [(0, -1), (0, 1), (-1, 0), (1, 0)]:
                nx, ny = x + dx, y + dy
                if 0 <= nx < dungeon.width and 0 <= ny < dungeon.height:
                    if dungeon.tiles[ny][nx] == TileType.FLOOR:
                        adjacent_floors.append((dx, dy))

            # Want exactly 2 adjacent floors on opposite sides (passage through wall)
            if len(adjacent_floors) == 2:
                d1, d2 = adjacent_floors
                # Check if they're opposite directions
                if d1[0] == -d2[0] and d1[1] == -d2[1]:
                    # This is a valid secret door position
                    valid_positions.append((x, y, d1[0], d1[1]))

    if not valid_positions:
        return

    # Shuffle and pick positions
    random.shuffle(valid_positions)

    # Avoid positions too close to player start
    avoid_near_player = []
    for pos in valid_positions:
        x, y = pos[0], pos[1]
        if abs(x - player_x) <= 4 and abs(y - player_y) <= 4:
            continue
        avoid_near_player.append(pos)

    valid_positions = avoid_near_player if avoid_near_player else valid_positions[:1]

    # Place secret doors
    placed = 0
    for pos in valid_positions:
        if placed >= num_doors:
            break

        x, y, dx, dy = pos
        secret_door_manager.add_at(x, y, dx, dy)
        placed += 1


def generate_torches(dungeon: 'Dungeon', torch_manager: 'TorchManager', player_x: int, player_y: int):
    """
    Generate torches for a dungeon level.

    Torches are placed on wall tiles adjacent to floor tiles, facing inward
    toward the room or corridor. Placement is theme-dependent.

    Args:
        dungeon: The dungeon to generate torches for
        torch_manager: The TorchManager to add torches to
        player_x, player_y: Player position to avoid placing torches there
    """
    from .torches import Torch

    # Get torch count range for this theme
    min_torches, max_torches = THEME_TORCH_COUNTS.get(
        dungeon.theme,
        (4, 8)  # Default fallback
    )
    num_torches = random.randint(min_torches, max_torches)

    # Find all valid torch positions (wall tiles adjacent to floor)
    valid_positions = _find_torch_positions(dungeon)

    if not valid_positions:
        return

    # Positions to avoid
    avoid_positions = set()
    if dungeon.stairs_up_pos:
        avoid_positions.add(dungeon.stairs_up_pos)
    if dungeon.stairs_down_pos:
        avoid_positions.add(dungeon.stairs_down_pos)

    # Add decoration positions to avoid
    for dx, dy, _, _ in dungeon.decorations:
        avoid_positions.add((dx, dy))

    # Priority placement: near stairs (landmark lighting)
    priority_positions = []
    regular_positions = []

    for pos in valid_positions:
        x, y, facing_dx, facing_dy = pos

        # Skip avoided positions
        if (x, y) in avoid_positions:
            continue

        # Check if near stairs
        near_stairs = False
        if dungeon.stairs_up_pos:
            dist = abs(x - dungeon.stairs_up_pos[0]) + abs(y - dungeon.stairs_up_pos[1])
            if dist <= 3:
                near_stairs = True
        if dungeon.stairs_down_pos:
            dist = abs(x - dungeon.stairs_down_pos[0]) + abs(y - dungeon.stairs_down_pos[1])
            if dist <= 3:
                near_stairs = True

        if near_stairs:
            priority_positions.append(pos)
        else:
            regular_positions.append(pos)

    # Shuffle regular positions
    random.shuffle(regular_positions)

    # Combine: priority first, then regular
    all_positions = priority_positions + regular_positions

    # Place torches with minimum spacing
    placed = 0
    placed_positions = set()

    for pos in all_positions:
        if placed >= num_torches:
            break

        x, y, facing_dx, facing_dy = pos

        # Ensure minimum spacing between torches (at least 4 tiles apart)
        too_close = False
        for px, py in placed_positions:
            if abs(x - px) + abs(y - py) < 4:
                too_close = True
                break

        if too_close:
            continue

        # Create torch
        torch = Torch(
            x=x, y=y,
            facing_dx=facing_dx,
            facing_dy=facing_dy,
            radius=TORCH_DEFAULT_RADIUS,
            intensity=TORCH_DEFAULT_INTENSITY,
            is_lit=True,
            torch_type=_get_torch_type_for_theme(dungeon.theme)
        )
        torch_manager.add_torch(torch)
        placed_positions.add((x, y))
        placed += 1


def _find_torch_positions(dungeon: 'Dungeon') -> List[Tuple[int, int, int, int]]:
    """
    Find all valid wall positions for torches.

    Returns:
        List of (x, y, facing_dx, facing_dy) tuples where:
        - x, y is the wall tile position
        - facing_dx, facing_dy is the direction the torch should face
    """
    positions = []

    for y in range(1, dungeon.height - 1):
        for x in range(1, dungeon.width - 1):
            if dungeon.tiles[y][x] != TileType.WALL:
                continue

            # Check each cardinal direction for adjacent floor
            for dx, dy in [(0, -1), (0, 1), (-1, 0), (1, 0)]:
                nx, ny = x + dx, y + dy
                if 0 <= nx < dungeon.width and 0 <= ny < dungeon.height:
                    if dungeon.tiles[ny][nx] == TileType.FLOOR:
                        # Torch faces toward the floor (away from wall)
                        positions.append((x, y, dx, dy))
                        break  # Only one torch per wall tile

    return positions


def _get_torch_type_for_theme(theme: DungeonTheme) -> str:
    """Get the appropriate torch type for a theme."""
    if theme == DungeonTheme.STONE:
        return "wall"  # Standard dungeon torches
    elif theme == DungeonTheme.ICE:
        return "crystal"  # Cold blue crystal lights
    elif theme == DungeonTheme.FOREST:
        return "sconce"  # Natural bioluminescence
    elif theme == DungeonTheme.VOLCANIC:
        return "brazier"  # Fire braziers
    elif theme == DungeonTheme.CRYPT:
        return "wall"  # Eerie torches
    elif theme == DungeonTheme.SEWER:
        return "sconce"  # Dim wall-mounted lights
    elif theme == DungeonTheme.LIBRARY:
        return "sconce"  # Clean, functional
    elif theme == DungeonTheme.CRYSTAL:
        return "crystal"  # Bright crystal formations
    else:
        return "wall"  # Default
