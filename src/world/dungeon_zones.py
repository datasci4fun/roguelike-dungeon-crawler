"""Zone assignment logic for dungeon generation.

Handles assigning zone identities to rooms and placing zone evidence.
"""
import random
from typing import List, Tuple, TYPE_CHECKING

from ..core.constants import TileType
from .zone_config import get_floor_config, FloorZoneConfig
from .zone_layouts import apply_zone_layout
from .zone_evidence import get_evidence_config

if TYPE_CHECKING:
    from .dungeon import Dungeon, Room


def assign_zones(dungeon: 'Dungeon'):
    """Assign zone identities to rooms based on dungeon level.

    Uses data-driven config from zone_config.py.
    Zones drive decorations, spawn bias, and lore drops.

    Assignment order:
    1. Start room gets start_zone
    2. Boss approach rooms (nearest to boss, prefer rooms with 2+ connections)
    3. Required zones (anchors) assigned first by selection rule
    4. Remaining rooms by weighted random eligibility
    """
    if not dungeon.rooms or len(dungeon.rooms) < 3:
        return

    config = get_floor_config(dungeon.level)
    if not config or not config.zones:
        return  # No zone config for this floor

    # Track for debug output
    dungeon._anchor_rooms = {}
    dungeon._approach_rooms = []
    dungeon._zone_warnings = []

    # 1. Assign start room zone
    start_room = dungeon.rooms[0]
    start_room.zone = config.start_zone

    # 2. Assign boss approach zones
    boss_room = dungeon.rooms[-1]
    boss_center = boss_room.center()
    other_rooms = [r for r in dungeon.rooms if r is not start_room and r is not boss_room]

    def dist_to_boss(room: 'Room') -> float:
        cx, cy = room.center()
        bx, by = boss_center
        return ((cx - bx) ** 2 + (cy - by) ** 2) ** 0.5

    # Sort by distance, but prefer larger rooms for boss approach
    other_rooms.sort(key=lambda r: (dist_to_boss(r), -r.area()))

    # Count required zones to ensure we leave enough rooms for them
    num_required_zones = sum(z.required_count for z in config.zones if z.required_count > 0)
    max_approach = max(0, len(other_rooms) - num_required_zones)
    num_approach = min(config.boss_approach_count, max_approach, len(other_rooms))
    for i in range(num_approach):
        other_rooms[i].zone = "boss_approach"
        dungeon._approach_rooms.append(other_rooms[i])

    # 3. Assign required/anchor zones
    remaining = [r for r in other_rooms if r.zone == "generic"]
    map_center = (dungeon.width // 2, dungeon.height // 2)

    for zone_spec in config.zones:
        if zone_spec.required_count > 0:
            # Filter by eligibility if specified
            if zone_spec.eligibility:
                eligible = [r for r in remaining if zone_spec.eligibility(r)]
            else:
                eligible = remaining[:]

            # Fallback: if eligibility too strict, use any remaining room
            if not eligible and remaining:
                dungeon._zone_warnings.append(
                    f"Relaxed eligibility for required zone '{zone_spec.zone_id}'"
                )
                eligible = remaining[:]
            elif not eligible:
                dungeon._zone_warnings.append(
                    f"No rooms available for required zone '{zone_spec.zone_id}'"
                )
                continue

            # Apply selection rule
            if zone_spec.selection_rule == "center":
                eligible.sort(key=lambda r: abs(r.center()[0] - map_center[0]) +
                                             abs(r.center()[1] - map_center[1]))
            elif zone_spec.selection_rule == "largest":
                eligible.sort(key=lambda r: -r.area())
            elif zone_spec.selection_rule == "boss_near":
                eligible.sort(key=dist_to_boss)

            # Assign required count
            rooms_to_assign = min(zone_spec.required_count, len(eligible))
            for i in range(rooms_to_assign):
                eligible[i].zone = zone_spec.zone_id
                if zone_spec.zone_id not in dungeon._anchor_rooms:
                    dungeon._anchor_rooms[zone_spec.zone_id] = []
                dungeon._anchor_rooms[zone_spec.zone_id].append(eligible[i])

            remaining = [r for r in remaining if r.zone == "generic"]

    # 4. Assign remaining rooms by weighted random
    for room in remaining:
        eligible_zones = _get_eligible_zones(room, config)
        if eligible_zones:
            chosen = random.choice(eligible_zones)
            room.zone = chosen
        else:
            room.zone = config.fallback_zone


def _get_eligible_zones(room: 'Room', config: FloorZoneConfig) -> List[str]:
    """Return list of eligible zones for a room based on config, with weights."""
    zones = []

    for zone_spec in config.zones:
        # Skip required zones (already assigned)
        if zone_spec.required_count > 0:
            continue

        # Check eligibility
        if zone_spec.eligibility is None or zone_spec.eligibility(room):
            zones.extend([zone_spec.zone_id] * zone_spec.weight)

    if not zones:
        zones = [config.fallback_zone]

    return zones


def apply_zone_layouts_to_dungeon(dungeon: 'Dungeon'):
    """Apply zone-specific layout modifications to rooms.

    Uses layout registry from zone_layouts.py.
    """
    for room in dungeon.rooms:
        apply_zone_layout(dungeon, room)


def place_zone_evidence(dungeon: 'Dungeon'):
    """Place zone evidence (boss trail tells, lore props).

    Deterministic by seed. Zone-driven placement:
    - boss_approach: 2-3 trail tells + 1 pre-boss lore marker
    - key lore zones: at least 1 evidence prop per room

    Evidence is stored in zone_evidence as (x, y, char, color, type) tuples.

    Density cap: Max evidence per room based on room size to reduce visual noise.
    - Small rooms (<30 tiles): max 2
    - Medium rooms (30-60 tiles): max 3
    - Large rooms (>60 tiles): max 4
    """
    evidence_config = get_evidence_config(dungeon.level)
    if not evidence_config:
        return

    # Track placed positions to avoid overlap
    placed = set()
    # Track evidence count per room for density capping
    room_evidence_count: dict = {}

    def get_room_max_evidence(room: 'Room') -> int:
        """Get max evidence allowed for room based on size."""
        area = room.width * room.height
        if area < 30:
            return 2
        elif area < 60:
            return 3
        else:
            return 4

    def can_place_in_room(room: 'Room') -> bool:
        """Check if room can accept more evidence."""
        room_key = (room.x, room.y)
        current = room_evidence_count.get(room_key, 0)
        return current < get_room_max_evidence(room)

    def record_placement(room: 'Room'):
        """Record that evidence was placed in room."""
        room_key = (room.x, room.y)
        room_evidence_count[room_key] = room_evidence_count.get(room_key, 0) + 1

    # 1. Boss approach rooms: trail tells + pre-boss lore
    approach_rooms = [r for r in dungeon.rooms if r.zone == "boss_approach"]
    for room in approach_rooms:
        room_max = get_room_max_evidence(room)
        room_key = (room.x, room.y)
        current_count = room_evidence_count.get(room_key, 0)

        # Place trail tells (prioritize these for boss_approach)
        trail_tells = evidence_config.get("trail_tells", [])
        if trail_tells and can_place_in_room(room):
            # Cap trail tells based on room capacity
            max_tells = min(2, room_max - current_count)  # Reduced from 2-3 to max 2
            if max_tells > 0:
                num_tells = min(random.randint(1, 2), max_tells)
                placed_count = _place_evidence_in_room(dungeon, room, trail_tells, num_tells, placed, "trail_tell")
                for _ in range(placed_count):
                    record_placement(room)

        # Place 1 pre-boss lore marker (if room has capacity)
        lore_markers = evidence_config.get("lore_markers", [])
        if lore_markers and can_place_in_room(room):
            placed_count = _place_evidence_in_room(dungeon, room, lore_markers, 1, placed, "lore_marker")
            for _ in range(placed_count):
                record_placement(room)

    # 2. Key lore zones: at least 1 evidence prop per room (respecting density cap)
    key_lore_zones = evidence_config.get("key_lore_zones", [])
    evidence_props = evidence_config.get("evidence_props", [])

    for room in dungeon.rooms:
        if room.zone in key_lore_zones and evidence_props and can_place_in_room(room):
            placed_count = _place_evidence_in_room(dungeon, room, evidence_props, 1, placed, "evidence_prop")
            for _ in range(placed_count):
                record_placement(room)


def _place_evidence_in_room(
    dungeon: 'Dungeon',
    room: 'Room',
    evidence_list: List[Tuple[str, int]],
    count: int,
    placed: set,
    evidence_type: str
) -> int:
    """Place evidence items in a room.

    Args:
        dungeon: The dungeon to place evidence in
        room: Room to place evidence in
        evidence_list: List of (char, color_pair) tuples for evidence options
        count: Number of evidence pieces to place
        placed: Set of already-placed positions
        evidence_type: Type label for the evidence

    Returns:
        Number of evidence items actually placed
    """
    attempts = 0
    placed_count = 0
    max_attempts = count * 15

    while placed_count < count and attempts < max_attempts:
        attempts += 1

        # Pick a position inside the room (1 tile from edges)
        x = random.randint(room.x + 1, room.x + room.width - 2)
        y = random.randint(room.y + 1, room.y + room.height - 2)

        # Skip if already placed or not walkable floor
        if (x, y) in placed:
            continue
        if dungeon.tiles[y][x] != TileType.FLOOR:
            continue

        # Skip stairs positions
        if (x, y) == dungeon.stairs_up_pos or (x, y) == dungeon.stairs_down_pos:
            continue

        # Skip existing decorations
        if any(dx == x and dy == y for dx, dy, _, _ in dungeon.decorations):
            continue

        # Pick random evidence from list
        char, color = random.choice(evidence_list)
        dungeon.zone_evidence.append((x, y, char, color, evidence_type))
        placed.add((x, y))
        placed_count += 1

    return placed_count
