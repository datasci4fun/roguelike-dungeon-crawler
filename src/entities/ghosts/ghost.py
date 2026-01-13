"""Ghost entity dataclasses.

This module contains the Ghost and GhostPath dataclasses that represent
ghost manifestations in the dungeon.
"""
from dataclasses import dataclass
from typing import Optional, List, Tuple

from .types import GhostType, GHOST_MESSAGES


@dataclass
class GhostPath:
    """Path data for Echo ghosts.

    Echo ghosts follow a predetermined path that leads to
    meaningful locations (lore zones, safe routes, secrets).
    """
    positions: List[Tuple[int, int]]
    current_index: int = 0
    destination_type: str = "lore"  # lore, safe_path, secret

    def get_current_position(self) -> Tuple[int, int]:
        """Get the current position in the path loop."""
        return self.positions[self.current_index]

    def advance(self):
        """Move to the next position in the path loop."""
        self.current_index = (self.current_index + 1) % len(self.positions)


@dataclass
class Ghost:
    """A ghost manifestation on the dungeon floor.

    Ghosts are remnants of player runs that provide various effects:
    - Death ghosts (Echo, Hollowed, Silence) from failed runs
    - Victory imprints (Beacon, Champion, Archivist) from successful runs

    Attributes:
        ghost_type: The type of ghost manifestation
        x, y: Position in the dungeon
        zone_id: The zone where this ghost spawned
        username: Source player's username
        victory: Whether this is from a victory run
        encountered: Player has seen this ghost
        triggered: Effect has activated
        active: Still present on floor
    """
    ghost_type: GhostType
    x: int
    y: int
    zone_id: str = ""

    # Source info (from ghost recording)
    username: str = "Unknown"
    victory: bool = False

    # State
    encountered: bool = False  # Player has seen this ghost
    triggered: bool = False    # Effect has activated
    active: bool = True        # Still present on floor

    # Echo-specific
    path: Optional[GhostPath] = None

    # Silence-specific
    radius: int = 2            # Debuff area radius

    # Champion-specific
    assist_used: bool = False
    trial_spawned: bool = False       # Combat trial spawned
    trial_enemy_id: Optional[int] = None  # ID of spawned trial enemy
    trial_completed: bool = False     # Trial enemy was defeated

    # Secondary flourish (for hybrid legacy)
    secondary_tag: Optional[str] = None  # "archivist_mark" or "champion_edge"
    secondary_used: bool = False

    @property
    def symbol(self) -> str:
        """Get display symbol for this ghost.

        Glyphs chosen to avoid collisions with:
        - TileType: ~ (lava), + (door), @ (player), ? (ambiguous)
        - Enemy symbols: various letters
        """
        return {
            GhostType.ECHO: 'ε',      # Greek epsilon - "echo" resonance
            GhostType.HOLLOWED: 'H',  # Keep - no conflict
            GhostType.SILENCE: 'Ø',   # Null/void - perfect for absence
            GhostType.BEACON: '✧',    # Sparkle variant - guidance light
            GhostType.CHAMPION: '†',  # Cross/defender - combat assist
            GhostType.ARCHIVIST: '§', # Section sign - documents/records
        }.get(self.ghost_type, '?')

    @property
    def name(self) -> str:
        """Get display name for this ghost."""
        base_names = {
            GhostType.ECHO: "Echo",
            GhostType.HOLLOWED: f"Hollowed {self.username[:8]}",
            GhostType.SILENCE: "Silence",
            GhostType.BEACON: "Beacon",
            GhostType.CHAMPION: "Champion's Imprint",
            GhostType.ARCHIVIST: "Archivist's Mark",
        }
        return base_names.get(self.ghost_type, "Ghost")

    def get_message(self) -> str:
        """Get encounter message for this ghost."""
        return GHOST_MESSAGES.get(self.ghost_type, "You sense a presence...")
