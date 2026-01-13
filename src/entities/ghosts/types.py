"""Ghost type definitions and constants.

This module contains the GhostType enum and related configuration
for the ghost differentiation system.
"""
from enum import Enum, auto
from typing import Dict, List


class GhostType(Enum):
    """Types of ghost manifestations.

    Death Ghosts (from players who died):
    - ECHO: Path loop residue, leads to something meaningful
    - HOLLOWED: Hostile wandering remnant
    - SILENCE: Debuff area marking absence

    Victory Imprints (from players who won):
    - BEACON: Guidance cue toward progression
    - CHAMPION: One-time combat assist (high kills)
    - ARCHIVIST: Knowledge/secret reveal (high lore found)
    """
    # Death ghosts
    ECHO = auto()       # Movement residue, path loop
    HOLLOWED = auto()   # Hostile wandering remnant
    SILENCE = auto()    # Debuff area

    # Victory imprints
    BEACON = auto()     # Guidance cue
    CHAMPION = auto()   # Combat assist
    ARCHIVIST = auto()  # Knowledge reveal


# Zone placements for each ghost type
GHOST_ZONE_BIAS: Dict[GhostType, List[str]] = {
    # Echo: near seams and junction zones
    GhostType.ECHO: [
        'confluence_chambers', 'guard_corridors', 'parade_corridors',
        'geometry_wells', 'maintenance_tunnels', 'root_warrens',
    ],
    # Hollowed: consumption/danger zones
    GhostType.HOLLOWED: [
        'digestion_chambers', 'diseased_pools', 'slag_pits',
        'forbidden_stacks', 'the_nursery', 'ice_tombs',
    ],
    # Silence: lore-heavy/authority zones
    GhostType.SILENCE: [
        'oath_chambers', 'record_vaults', 'seal_chambers',
        'oath_interface', 'throne_hall_ruins',
    ],
    # Beacon: transition points
    GhostType.BEACON: [
        'intake_hall', 'confluence_chambers', 'boss_approach',
        'frozen_galleries', 'reading_halls', 'forge_halls', 'crystal_gardens',
    ],
    # Champion: combat spike zones
    GhostType.CHAMPION: [
        'boss_approach', 'the_nursery', 'colony_heart',
        'crucible_heart', 'execution_chambers',
    ],
    # Archivist: knowledge/authority zones
    GhostType.ARCHIVIST: [
        'record_vaults', 'catalog_chambers', 'seal_drifts',
        'seal_chambers', 'oath_interface', 'indexing_heart',
    ],
}

# Per-floor limits for each ghost type
GHOST_LIMITS: Dict[GhostType, int] = {
    GhostType.ECHO: 2,
    GhostType.HOLLOWED: 2,
    GhostType.SILENCE: 1,
    GhostType.BEACON: 1,
    GhostType.CHAMPION: 1,
    GhostType.ARCHIVIST: 1,
}

# Messages for each ghost type (in-universe, evocative)
# These trigger once per type per floor to avoid spam
GHOST_MESSAGES: Dict[GhostType, str] = {
    GhostType.ECHO: "A faint echo repeats the same steps...",
    GhostType.HOLLOWED: "A hollowed delver turns toward you.",
    GhostType.SILENCE: "Something is missing here.",
    GhostType.BEACON: "A guiding light flickers ahead.",
    GhostType.CHAMPION: "A champion's imprint stands with you.",
    GhostType.ARCHIVIST: "Dust rearranges into a warning.",
}


def victory_legacy_to_ghost_type(legacy_name: str) -> GhostType:
    """Convert VictoryLegacy name to GhostType.

    Args:
        legacy_name: Name of the VictoryLegacy ('BEACON', 'CHAMPION', 'ARCHIVIST')

    Returns:
        Corresponding GhostType, defaults to BEACON if unknown
    """
    mapping = {
        'BEACON': GhostType.BEACON,
        'CHAMPION': GhostType.CHAMPION,
        'ARCHIVIST': GhostType.ARCHIVIST,
    }
    return mapping.get(legacy_name, GhostType.BEACON)
