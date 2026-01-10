"""Zone configuration for data-driven zone assignment.

Each floor defines its zones with:
- eligibility: predicate function (room) -> bool
- weight: relative spawn weight (higher = more likely)
- required_count: zones that must appear exactly N times (0 = not required)
- selection_rule: how to pick rooms for required zones
- fallback: default zone when nothing else fits
"""
from dataclasses import dataclass, field
from typing import Callable, Dict, List, Optional, TYPE_CHECKING

if TYPE_CHECKING:
    from .dungeon import Room


@dataclass
class ZoneSpec:
    """Specification for a single zone type."""
    zone_id: str
    weight: int = 1
    # Eligibility predicate: (room) -> bool. None = any room eligible.
    eligibility: Callable[['Room'], bool] = None
    # If > 0, this zone must appear exactly N times (assigned first)
    required_count: int = 0
    # Selection rule for required zones:
    #   "center" = prefer mid-map rooms
    #   "largest" = prefer largest rooms by area
    #   "boss_near" = prefer rooms near boss
    selection_rule: str = ""


@dataclass
class FloorZoneConfig:
    """Zone configuration for an entire floor."""
    floor_level: int
    zones: List[ZoneSpec] = field(default_factory=list)
    # Zone for start room (player spawn)
    start_zone: str = "generic"
    # Number of boss approach rooms (1-3)
    boss_approach_count: int = 2
    # Default zone when no eligibility matches
    fallback_zone: str = "generic"


# =============================================================================
# Eligibility predicates
# =============================================================================

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
# Canonical zones: cell_blocks, guard_corridors, wardens_office,
#                  execution_chambers, record_vaults, intake_hall, boss_approach
# =============================================================================
FLOOR_1_CONFIG = FloorZoneConfig(
    floor_level=1,
    start_zone="intake_hall",
    boss_approach_count=2,
    fallback_zone="cell_blocks",
    zones=[
        # Required anchor zone
        ZoneSpec(
            zone_id="wardens_office",
            required_count=1,
            selection_rule="center",
        ),
        # Required zone for lore concentration
        ZoneSpec(
            zone_id="record_vaults",
            required_count=1,
            selection_rule="center",
            eligibility=min_size(5, 5),
        ),
        # Weighted zones
        ZoneSpec(
            zone_id="cell_blocks",
            weight=4,
            eligibility=min_size(8, 6),
        ),
        ZoneSpec(
            zone_id="guard_corridors",
            weight=2,
            eligibility=elongated(8, 5),
        ),
        ZoneSpec(
            zone_id="execution_chambers",
            weight=1,
            eligibility=min_size(7, 7),
        ),
    ],
)


# =============================================================================
# FLOOR 2: Sewers of Valdris (CIRCULATION)
# Canonical zones: waste_channels, carrier_nests, confluence_chambers,
#                  maintenance_tunnels, diseased_pools, seal_drifts,
#                  colony_heart, boss_approach
# =============================================================================
FLOOR_2_CONFIG = FloorZoneConfig(
    floor_level=2,
    start_zone="confluence_chambers",  # Canonical start zone
    boss_approach_count=2,
    fallback_zone="maintenance_tunnels",  # Safe fallback
    zones=[
        # Anchor zone - must pick largest room for set-piece feel
        ZoneSpec(
            zone_id="colony_heart",
            required_count=1,
            selection_rule="largest",
        ),
        # Required zone for lore/surface docs
        ZoneSpec(
            zone_id="seal_drifts",
            required_count=1,
            selection_rule="center",
            eligibility=min_size(5, 5),
        ),
        # Required zone for rat clustering
        ZoneSpec(
            zone_id="carrier_nests",
            required_count=1,
            eligibility=min_size(4, 4),
        ),
        # Weighted zones
        ZoneSpec(
            zone_id="waste_channels",
            weight=3,
            eligibility=elongated(6, 5),
        ),
        ZoneSpec(
            zone_id="maintenance_tunnels",
            weight=2,
            eligibility=any_room,  # Fallback-friendly
        ),
        ZoneSpec(
            zone_id="diseased_pools",
            weight=1,
            eligibility=min_size(5, 5),
        ),
    ],
)


# =============================================================================
# FLOOR 3: Forest Depths (GROWTH)
# Canonical zones: root_warrens, canopy_halls, webbed_gardens, the_nursery,
#                  digestion_chambers, druid_ring, boss_approach
# =============================================================================
FLOOR_3_CONFIG = FloorZoneConfig(
    floor_level=3,
    start_zone="root_warrens",  # Branching entry point
    boss_approach_count=2,
    fallback_zone="root_warrens",  # Most common zone type
    zones=[
        # Anchor zone - ritual landmark with guaranteed lore
        ZoneSpec(
            zone_id="druid_ring",
            required_count=1,
            selection_rule="center",  # Mid-map, away from start/boss
            eligibility=min_size(8, 8),
        ),
        # Anchor zone - high-danger spawn pocket
        ZoneSpec(
            zone_id="the_nursery",
            required_count=1,
            selection_rule="largest",  # Largest room far from start
            eligibility=min_size(8, 8),
        ),
        # Weighted zones
        ZoneSpec(
            zone_id="root_warrens",
            weight=4,  # Weighted high per docs
            eligibility=elongated(8, 4),
        ),
        ZoneSpec(
            zone_id="canopy_halls",
            weight=2,
            eligibility=min_size(8, 8),
        ),
        ZoneSpec(
            zone_id="webbed_gardens",
            weight=2,
            eligibility=min_size(6, 6),
        ),
        ZoneSpec(
            zone_id="digestion_chambers",
            weight=1,
            eligibility=min_size(6, 6),
        ),
    ],
)


# =============================================================================
# FLOOR 4: Mirror Valdris (LEGITIMACY)
# Canonical zones: courtyard_squares, throne_hall_ruins, parade_corridors,
#                  seal_chambers, record_vaults, mausoleum_district,
#                  oath_chambers, boss_approach
# =============================================================================
FLOOR_4_CONFIG = FloorZoneConfig(
    floor_level=4,
    start_zone="courtyard_squares",  # Public plaza entry
    boss_approach_count=2,
    fallback_zone="parade_corridors",  # Symmetry corridors as fallback
    zones=[
        # Anchor zone - throne hall set-piece
        ZoneSpec(
            zone_id="throne_hall_ruins",
            required_count=1,
            selection_rule="largest",  # Largest hall
            eligibility=min_size(10, 8),
        ),
        # Anchor zone - oath interface with guaranteed lore
        ZoneSpec(
            zone_id="oath_chambers",
            required_count=1,
            selection_rule="center",  # Mid-map, ritual space
            eligibility=min_size(7, 7),
        ),
        # High-priority lore zones (weighted high, not strictly required)
        ZoneSpec(
            zone_id="seal_chambers",
            weight=4,  # Bureaucracy lore hub
            eligibility=min_size(5, 5),
        ),
        ZoneSpec(
            zone_id="record_vaults",
            weight=4,  # Archive lore hub
            eligibility=min_size(5, 5),
        ),
        # Weighted zones
        ZoneSpec(
            zone_id="parade_corridors",
            weight=2,  # Connector corridors
            eligibility=elongated(10, 4),
        ),
        ZoneSpec(
            zone_id="courtyard_squares",
            weight=2,
            eligibility=min_size(8, 8),
        ),
        ZoneSpec(
            zone_id="mausoleum_district",
            weight=3,  # Undead bias zone
            eligibility=min_size(5, 5),
        ),
    ],
)


# =============================================================================
# FLOORS 5-8: Placeholder configs (to be implemented)
# =============================================================================
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
