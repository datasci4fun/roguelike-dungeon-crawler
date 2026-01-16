"""Interactive tile types for exploration puzzles and environmental interaction.

v7.0 Immersive Exploration System
"""
from dataclasses import dataclass
from enum import Enum, auto
from typing import Optional


class InteractiveType(Enum):
    """Types of interactive elements in the dungeon."""
    NONE = auto()
    SWITCH = auto()           # Activates something elsewhere (door, passage)
    HIDDEN_DOOR = auto()      # Reveals passage when activated
    MURAL = auto()            # Displays lore when examined
    LEVER = auto()            # Toggles state (on/off), can be part of puzzle
    PRESSURE_PLATE = auto()   # Auto-triggers when stepped on
    INSCRIPTION = auto()      # Readable text/clue on wall or floor
    LOCKED_DOOR = auto()      # Requires key or puzzle solution
    SECRET_SWITCH = auto()    # Hidden switch (must be found first)


class InteractiveState(Enum):
    """States an interactive element can be in."""
    HIDDEN = auto()      # Not yet discovered (for secrets)
    INACTIVE = auto()    # Visible but not activated
    ACTIVE = auto()      # Currently activated (switch on, lever pulled)
    LOCKED = auto()      # Requires something to interact
    DISABLED = auto()    # Permanently deactivated


class WallFace(Enum):
    """Which face of a wall tile the interactive element is on."""
    NORTH = auto()  # Facing south (player sees it from south)
    SOUTH = auto()  # Facing north
    EAST = auto()   # Facing west
    WEST = auto()   # Facing east
    FLOOR = auto()  # On the ground (pressure plates, inscriptions)
    CEILING = auto() # On the ceiling (rare, for visual interest)


@dataclass
class InteractiveTile:
    """An interactive element attached to a tile.

    Attributes:
        interactive_type: What kind of interaction this is
        state: Current state of the interactive element
        wall_face: Which direction the element faces
        target: Position this element affects (for switches/levers)
        lore_id: Lore entry to unlock when examined (for murals/inscriptions)
        puzzle_id: ID of puzzle this belongs to (for multi-part puzzles)
        examine_text: Short description shown on hover/examine
        activate_text: Message shown when activated
        required_item: Item needed to interact (for locked elements)
    """
    interactive_type: InteractiveType
    state: InteractiveState = InteractiveState.INACTIVE
    wall_face: WallFace = WallFace.NORTH
    target: Optional[tuple[int, int]] = None
    lore_id: Optional[str] = None
    puzzle_id: Optional[str] = None
    examine_text: str = ""
    activate_text: str = ""
    required_item: Optional[str] = None

    def can_interact(self) -> bool:
        """Check if this element can currently be interacted with."""
        if self.state == InteractiveState.HIDDEN:
            return False
        if self.state == InteractiveState.DISABLED:
            return False
        if self.state == InteractiveState.LOCKED and self.required_item:
            return False  # Caller should check if player has item
        return True

    def is_visible(self) -> bool:
        """Check if this element is visible to the player."""
        return self.state != InteractiveState.HIDDEN

    def toggle(self) -> bool:
        """Toggle between active and inactive states.

        Returns:
            True if state changed, False otherwise
        """
        if self.state == InteractiveState.ACTIVE:
            self.state = InteractiveState.INACTIVE
            return True
        elif self.state == InteractiveState.INACTIVE:
            self.state = InteractiveState.ACTIVE
            return True
        return False

    def reveal(self) -> bool:
        """Reveal a hidden interactive element.

        Returns:
            True if was hidden and is now revealed
        """
        if self.state == InteractiveState.HIDDEN:
            self.state = InteractiveState.INACTIVE
            return True
        return False

    def to_dict(self) -> dict:
        """Serialize to dictionary for API/WebSocket transmission."""
        return {
            "type": self.interactive_type.name.lower(),
            "state": self.state.name.lower(),
            "wall_face": self.wall_face.name.lower(),
            "target": self.target,
            "lore_id": self.lore_id,
            "puzzle_id": self.puzzle_id,
            "examine_text": self.examine_text,
            "can_interact": self.can_interact(),
        }

    @classmethod
    def switch(
        cls,
        target: tuple[int, int],
        wall_face: WallFace = WallFace.NORTH,
        examine_text: str = "An old switch mounted on the wall.",
        activate_text: str = "You hear a distant click.",
        puzzle_id: Optional[str] = None,
    ) -> "InteractiveTile":
        """Factory for creating a switch."""
        return cls(
            interactive_type=InteractiveType.SWITCH,
            wall_face=wall_face,
            target=target,
            examine_text=examine_text,
            activate_text=activate_text,
            puzzle_id=puzzle_id,
        )

    @classmethod
    def hidden_door(
        cls,
        wall_face: WallFace = WallFace.NORTH,
        examine_text: str = "A section of wall that looks slightly different.",
    ) -> "InteractiveTile":
        """Factory for creating a hidden door."""
        return cls(
            interactive_type=InteractiveType.HIDDEN_DOOR,
            state=InteractiveState.HIDDEN,
            wall_face=wall_face,
            examine_text=examine_text,
            activate_text="The wall slides open, revealing a hidden passage!",
        )

    @classmethod
    def mural(
        cls,
        lore_id: str,
        wall_face: WallFace = WallFace.NORTH,
        examine_text: str = "A faded mural depicting ancient events.",
    ) -> "InteractiveTile":
        """Factory for creating a lore mural."""
        return cls(
            interactive_type=InteractiveType.MURAL,
            wall_face=wall_face,
            lore_id=lore_id,
            examine_text=examine_text,
        )

    @classmethod
    def inscription(
        cls,
        lore_id: str,
        examine_text: str = "Faded writing carved into the stone.",
        wall_face: WallFace = WallFace.FLOOR,
    ) -> "InteractiveTile":
        """Factory for creating a readable inscription."""
        return cls(
            interactive_type=InteractiveType.INSCRIPTION,
            wall_face=wall_face,
            lore_id=lore_id,
            examine_text=examine_text,
        )

    @classmethod
    def pressure_plate(
        cls,
        target: tuple[int, int],
        examine_text: str = "A stone tile that sits slightly lower than the others.",
        activate_text: str = "The plate sinks under your weight.",
        puzzle_id: Optional[str] = None,
    ) -> "InteractiveTile":
        """Factory for creating a pressure plate."""
        return cls(
            interactive_type=InteractiveType.PRESSURE_PLATE,
            wall_face=WallFace.FLOOR,
            target=target,
            examine_text=examine_text,
            activate_text=activate_text,
            puzzle_id=puzzle_id,
        )

    @classmethod
    def lever(
        cls,
        target: tuple[int, int],
        wall_face: WallFace = WallFace.NORTH,
        examine_text: str = "A rusty lever protrudes from the wall.",
        puzzle_id: Optional[str] = None,
    ) -> "InteractiveTile":
        """Factory for creating a lever."""
        return cls(
            interactive_type=InteractiveType.LEVER,
            wall_face=wall_face,
            target=target,
            examine_text=examine_text,
            activate_text="The lever grinds into a new position.",
            puzzle_id=puzzle_id,
        )


# =============================================================================
# Visual Elevation System (v7.0 Sprint 3)
# =============================================================================

class SlopeDirection(Enum):
    """Direction a slope descends toward."""
    NONE = auto()    # Flat tile
    NORTH = auto()   # Slopes down toward north
    SOUTH = auto()   # Slopes down toward south
    EAST = auto()    # Slopes down toward east
    WEST = auto()    # Slopes down toward west


class SetPieceType(Enum):
    """Types of 3D set pieces that can be placed in rooms."""
    NONE = auto()
    ENTRANCE_DOORS = auto()      # Massive doors behind player at start
    BOSS_THRONE = auto()         # Throne/altar in boss rooms
    STATUE = auto()              # Decorative statue
    FOUNTAIN = auto()            # Water fountain centerpiece
    ALTAR = auto()               # Sacrificial/prayer altar
    PILLAR = auto()              # Structural pillar
    COLLAPSED_PILLAR = auto()    # Broken pillar (debris)
    STAIRCASE_DOWN = auto()      # Visual staircase leading down
    ARCHWAY = auto()             # Decorative archway


@dataclass
class TileVisual:
    """Visual properties for a tile beyond basic type.

    Used to add visual depth like slopes, elevation changes, and set pieces
    without affecting gameplay/pathfinding.

    Attributes:
        elevation: Height offset from base (0.0 = ground, -1.0 = descended)
        slope_direction: Direction the tile slopes toward
        slope_amount: Steepness of slope (0.0-1.0, default 0.3)
        set_piece: Optional 3D set piece at this location
        set_piece_rotation: Rotation in degrees (0, 90, 180, 270)
        set_piece_scale: Scale multiplier for set piece
    """
    elevation: float = 0.0
    slope_direction: SlopeDirection = SlopeDirection.NONE
    slope_amount: float = 0.3
    set_piece: SetPieceType = SetPieceType.NONE
    set_piece_rotation: int = 0
    set_piece_scale: float = 1.0

    @classmethod
    def flat(cls, elevation: float = 0.0) -> "TileVisual":
        """Create a flat tile at given elevation."""
        return cls(elevation=elevation)

    @classmethod
    def slope(
        cls,
        direction: SlopeDirection,
        amount: float = 0.3,
        base_elevation: float = 0.0
    ) -> "TileVisual":
        """Create a sloped tile."""
        return cls(
            elevation=base_elevation,
            slope_direction=direction,
            slope_amount=amount
        )

    @classmethod
    def with_set_piece(
        cls,
        piece_type: SetPieceType,
        rotation: int = 0,
        scale: float = 1.0,
        elevation: float = 0.0
    ) -> "TileVisual":
        """Create a tile with a set piece."""
        return cls(
            elevation=elevation,
            set_piece=piece_type,
            set_piece_rotation=rotation,
            set_piece_scale=scale
        )
