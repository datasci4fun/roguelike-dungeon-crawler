"""Ghost system package.

This package provides the ghost differentiation system for meaningful
ghost encounters in the dungeon.

Death Ghosts (from players who died):
- Echo: Path loop residue, leads to something meaningful
- Hollowed: Hostile wandering remnant
- Silence: Debuff area marking absence

Victory Imprints (from players who won):
- Beacon: Guidance cue toward progression
- Champion: One-time combat assist
- Archivist: Knowledge/secret reveal

Usage:
    from src.entities.ghosts import GhostType, Ghost, GhostManager
"""

# Re-export all public symbols for backwards compatibility
from .types import (
    GhostType,
    GHOST_ZONE_BIAS,
    GHOST_LIMITS,
    GHOST_MESSAGES,
    victory_legacy_to_ghost_type,
)

from .ghost import (
    Ghost,
    GhostPath,
)

from .manager import (
    GhostManager,
)

__all__ = [
    # Types and constants
    'GhostType',
    'GHOST_ZONE_BIAS',
    'GHOST_LIMITS',
    'GHOST_MESSAGES',
    'victory_legacy_to_ghost_type',
    # Dataclasses
    'Ghost',
    'GhostPath',
    # Manager
    'GhostManager',
]
