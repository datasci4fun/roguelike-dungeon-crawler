"""Zone configuration for data-driven zone assignment.

Each floor defines its zones with:
- eligibility: predicate function (room) -> bool
- weight: relative spawn weight (higher = more likely)
- required: zones that must appear exactly N times (anchors)
- fallback: default zone when nothing else fits
"""
from dataclasses import dataclass, field
from typing import Callable, Dict, List, Optional, Tuple, TYPE_CHECKING

if TYPE_CHECKING:
    from .dungeon import Room


@dataclass
class ZoneSpec:
    """Specification for a single zone type."""
    zone_id: str
    weight: int = 1
    # Eligibility predicate: (room) -> bool
    eligibility: Callable[['Room'], bool] = None
    # If set, this is a required zone (anchor) that appears exactly N times
    required_count: int = 0
    # Selection rule for required zones: "center" (mid-map), "boss_near" (near boss)
    selection_rule: str = ""


@dataclass
class FloorZoneConfig:
    """Zone configuration for an entire floor."""
    floor_level: int
    zones: List[ZoneSpec] = field(default_factory=list)
    # Special zone assignments
    start_zone: str = "generic"  # Zone for start room
    boss_approach_count: int = 2  # Number of boss approach rooms
    fallback_zone: str = "generic"  # Default when no zone fits


# Eligibility predicates
def min_size(min_w: int, min_h: int) -> Callable[['Room'], bool]:
    """Room must be at least min_w x min_h (or transposed)."""
    def check(room: 'Room') -> bool:
        return ((room.width >= min_w and room.height >= min_h) or
                (room.width >= min_h and room.height >= min_w))
    return check


def elongated(min_long: int, max_short: int) -> Callable[['Room'], bool]:
    """Room is elongated (corridor-like)."""
    def check(room: 'Room') -> bool:
        return ((room.width >= min_long and room.height <= max_short) or
                (room.height >= min_long and room.width <= max_short))
    return check


def any_room(room: 'Room') -> bool:
    """Any room is eligible."""
    return True


# =============================================================================
# FLOOR 1: Stone Dungeon (MEMORY)
# =============================================================================
FLOOR_1_CONFIG = FloorZoneConfig(
    floor_level=1,
    start_zone="intake_hall",
    boss_approach_count=2,
    fallback_zone="cell_blocks",
    zones=[
        # Anchor zones (required)
        ZoneSpec(
            zone_id="wardens_office",
            required_count=1,
            selection_rule="center",
        ),
        # Regular zones (weighted random)
        ZoneSpec(
            zone_id="cell_blocks",
            weight=4,
            eligibility=min_size(10, 8),
        ),
        ZoneSpec(
            zone_id="guard_corridors",
            weight=2,
            eligibility=elongated(10, 4),
        ),
        ZoneSpec(
            zone_id="record_vaults",
            weight=2,
            eligibility=min_size(6, 6),
        ),
        ZoneSpec(
            zone_id="execution_chambers",
            weight=1,
            eligibility=min_size(8, 8),
        ),
    ],
)


# =============================================================================
# FLOOR 2: Sewers (THRESHOLD)
# =============================================================================
FLOOR_2_CONFIG = FloorZoneConfig(
    floor_level=2,
    start_zone="overflow_junction",
    boss_approach_count=2,
    fallback_zone="waste_channels",
    zones=[
        # Anchor zones
        ZoneSpec(
            zone_id="colony_heart",
            required_count=1,
            selection_rule="center",
        ),
        # Regular zones
        ZoneSpec(
            zone_id="waste_channels",
            weight=4,
            eligibility=elongated(8, 5),
        ),
        ZoneSpec(
            zone_id="seal_drifts",
            weight=2,
            eligibility=min_size(6, 6),
        ),
        ZoneSpec(
            zone_id="carrier_nests",
            weight=3,
            eligibility=min_size(5, 5),
        ),
        ZoneSpec(
            zone_id="drip_galleries",
            weight=2,
            eligibility=min_size(7, 7),
        ),
    ],
)


# =============================================================================
# FLOORS 3-8: Placeholder configs (to be filled in)
# =============================================================================
FLOOR_3_CONFIG = FloorZoneConfig(floor_level=3, start_zone="generic", fallback_zone="generic")
FLOOR_4_CONFIG = FloorZoneConfig(floor_level=4, start_zone="generic", fallback_zone="generic")
FLOOR_5_CONFIG = FloorZoneConfig(floor_level=5, start_zone="generic", fallback_zone="generic")
FLOOR_6_CONFIG = FloorZoneConfig(floor_level=6, start_zone="generic", fallback_zone="generic")
FLOOR_7_CONFIG = FloorZoneConfig(floor_level=7, start_zone="generic", fallback_zone="generic")
FLOOR_8_CONFIG = FloorZoneConfig(floor_level=8, start_zone="generic", fallback_zone="generic")


# Floor config lookup
FLOOR_ZONE_CONFIGS: Dict[int, FloorZoneConfig] = {
    1: FLOOR_1_CONFIG,
    2: FLOOR_2_CONFIG,
    3: FLOOR_3_CONFIG,
    4: FLOOR_4_CONFIG,
    5: FLOOR_5_CONFIG,
    6: FLOOR_6_CONFIG,
    7: FLOOR_7_CONFIG,
    8: FLOOR_8_CONFIG,
}


def get_floor_config(level: int) -> Optional[FloorZoneConfig]:
    """Get zone configuration for a floor level."""
    return FLOOR_ZONE_CONFIGS.get(level)
