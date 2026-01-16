"""Puzzle system for v7.0 Immersive Exploration.

Puzzles are multi-element interactions that require solving to unlock rewards.
Each puzzle tracks its state and checks for completion when tiles are interacted with.
"""
from dataclasses import dataclass, field
from enum import Enum, auto
from typing import Optional, Callable, TYPE_CHECKING

if TYPE_CHECKING:
    from .dungeon import Dungeon


class PuzzleType(Enum):
    """Types of puzzles available."""
    SWITCH_SEQUENCE = auto()    # Activate switches in correct order
    PRESSURE_PLATES = auto()    # Stand on all plates simultaneously (or sequence)
    LEVER_PATTERN = auto()      # Set levers to correct pattern
    INSCRIPTION_RIDDLE = auto() # Read clue, interact with answer elsewhere


class PuzzleRewardType(Enum):
    """Types of rewards for completing puzzles."""
    OPEN_DOOR = auto()          # Opens a hidden door/passage
    SPAWN_LOOT = auto()         # Spawns treasure chest or items
    UNLOCK_SHORTCUT = auto()    # Opens a shortcut path
    REVEAL_SECRET = auto()      # Reveals hidden area on map
    LORE_UNLOCK = auto()        # Unlocks lore entry


@dataclass
class PuzzleReward:
    """Reward for completing a puzzle."""
    reward_type: PuzzleRewardType
    target_pos: Optional[tuple[int, int]] = None  # For doors/shortcuts
    loot_table: Optional[str] = None               # For loot spawns
    lore_id: Optional[str] = None                  # For lore unlocks
    message: str = "You solved the puzzle!"


@dataclass
class Puzzle:
    """A puzzle that spans multiple interactive tiles.

    Attributes:
        puzzle_id: Unique identifier
        puzzle_type: Type of puzzle mechanic
        tiles: List of tile positions involved in the puzzle
        solution: Dict describing the solved state
        reward: What happens when solved
        current_state: Current state of puzzle elements
        solved: Whether the puzzle has been solved
        hint_text: Optional hint shown when examining puzzle elements
    """
    puzzle_id: str
    puzzle_type: PuzzleType
    tiles: list[tuple[int, int]]
    solution: dict
    reward: PuzzleReward
    current_state: dict = field(default_factory=dict)
    solved: bool = False
    hint_text: str = ""

    def check_solved(self) -> bool:
        """Check if puzzle is solved based on current state vs solution."""
        if self.solved:
            return True

        if self.puzzle_type == PuzzleType.SWITCH_SEQUENCE:
            # All switches must be activated in order
            sequence = self.current_state.get('sequence', [])
            expected = self.solution.get('sequence', [])
            return sequence == expected

        elif self.puzzle_type == PuzzleType.PRESSURE_PLATES:
            # All plates must be pressed (or in correct pattern)
            pressed = self.current_state.get('pressed', set())
            required = set(self.solution.get('required', []))
            return pressed == required

        elif self.puzzle_type == PuzzleType.LEVER_PATTERN:
            # All levers must be in correct positions
            positions = self.current_state.get('positions', {})
            expected = self.solution.get('pattern', {})
            return positions == expected

        return False

    def reset(self):
        """Reset puzzle state."""
        self.current_state = {}
        self.solved = False


class PuzzleManager:
    """Manages all puzzles in the dungeon.

    Tracks puzzle state, checks for completion, and triggers rewards.
    """

    def __init__(self):
        self.puzzles: dict[str, Puzzle] = {}
        self.tile_to_puzzle: dict[tuple[int, int], str] = {}  # Maps tile pos -> puzzle_id

    def clear(self):
        """Clear all puzzles (called on level transition)."""
        self.puzzles.clear()
        self.tile_to_puzzle.clear()

    def add_puzzle(self, puzzle: Puzzle):
        """Register a puzzle."""
        self.puzzles[puzzle.puzzle_id] = puzzle
        for tile_pos in puzzle.tiles:
            self.tile_to_puzzle[tile_pos] = puzzle.puzzle_id

    def get_puzzle(self, puzzle_id: str) -> Optional[Puzzle]:
        """Get a puzzle by ID."""
        return self.puzzles.get(puzzle_id)

    def get_puzzle_at(self, x: int, y: int) -> Optional[Puzzle]:
        """Get the puzzle that includes tile at (x, y)."""
        puzzle_id = self.tile_to_puzzle.get((x, y))
        if puzzle_id:
            return self.puzzles.get(puzzle_id)
        return None

    def on_switch_activated(self, x: int, y: int) -> Optional[dict]:
        """Handle switch activation at position.

        Returns dict with 'solved' and 'message' if puzzle state changed.
        """
        puzzle = self.get_puzzle_at(x, y)
        if not puzzle or puzzle.solved:
            return None

        if puzzle.puzzle_type == PuzzleType.SWITCH_SEQUENCE:
            # Add to sequence
            sequence = puzzle.current_state.setdefault('sequence', [])
            sequence.append((x, y))

            # Check if correct so far
            expected = puzzle.solution.get('sequence', [])
            if sequence != expected[:len(sequence)]:
                # Wrong sequence - reset
                puzzle.reset()
                return {'solved': False, 'message': "The switches reset..."}

            if puzzle.check_solved():
                puzzle.solved = True
                return {
                    'solved': True,
                    'message': puzzle.reward.message,
                    'reward': puzzle.reward
                }
            else:
                return {'solved': False, 'message': f"Click. ({len(sequence)}/{len(expected)})"}

        return None

    def on_lever_toggled(self, x: int, y: int, is_active: bool) -> Optional[dict]:
        """Handle lever toggle at position.

        Returns dict with 'solved' and 'message' if puzzle state changed.
        """
        puzzle = self.get_puzzle_at(x, y)
        if not puzzle or puzzle.solved:
            return None

        if puzzle.puzzle_type == PuzzleType.LEVER_PATTERN:
            positions = puzzle.current_state.setdefault('positions', {})
            positions[(x, y)] = is_active

            if puzzle.check_solved():
                puzzle.solved = True
                return {
                    'solved': True,
                    'message': puzzle.reward.message,
                    'reward': puzzle.reward
                }
            else:
                # Count correct positions
                expected = puzzle.solution.get('pattern', {})
                correct = sum(1 for pos, state in positions.items()
                            if expected.get(pos) == state)
                return {'solved': False, 'message': f"Clunk. ({correct}/{len(expected)} correct)"}

        return None

    def on_pressure_plate_step(self, x: int, y: int, stepped_on: bool) -> Optional[dict]:
        """Handle pressure plate step at position.

        Returns dict with 'solved' and 'message' if puzzle state changed.
        """
        puzzle = self.get_puzzle_at(x, y)
        if not puzzle or puzzle.solved:
            return None

        if puzzle.puzzle_type == PuzzleType.PRESSURE_PLATES:
            pressed = puzzle.current_state.setdefault('pressed', set())
            if stepped_on:
                pressed.add((x, y))
            else:
                pressed.discard((x, y))

            if puzzle.check_solved():
                puzzle.solved = True
                return {
                    'solved': True,
                    'message': puzzle.reward.message,
                    'reward': puzzle.reward
                }
            else:
                required = set(puzzle.solution.get('required', []))
                return {'solved': False, 'message': f"The plate sinks. ({len(pressed)}/{len(required)} active)"}

        return None

    def apply_reward(self, reward: PuzzleReward, dungeon: 'Dungeon') -> list[str]:
        """Apply puzzle reward to the dungeon.

        Returns list of messages to display.
        """
        from ..core.constants import TileType, InteractiveState

        messages = [reward.message]

        if reward.reward_type == PuzzleRewardType.OPEN_DOOR:
            if reward.target_pos:
                tx, ty = reward.target_pos
                # Change wall to floor
                if 0 <= tx < dungeon.width and 0 <= ty < dungeon.height:
                    dungeon.tiles[ty][tx] = TileType.FLOOR
                    # Update interactive tile state if exists
                    interactive = dungeon.get_interactive_at(tx, ty)
                    if interactive:
                        interactive.state = InteractiveState.ACTIVE
                    messages.append("A hidden passage opens!")

        elif reward.reward_type == PuzzleRewardType.REVEAL_SECRET:
            if reward.target_pos:
                tx, ty = reward.target_pos
                # Reveal hidden interactive
                interactive = dungeon.get_interactive_at(tx, ty)
                if interactive:
                    interactive.reveal()
                    messages.append("Something hidden is revealed...")

        elif reward.reward_type == PuzzleRewardType.LORE_UNLOCK:
            if reward.lore_id:
                messages.append(f"You sense ancient knowledge awakening...")
                # Lore unlock handled by story_manager

        return messages

    def get_hint_for_tile(self, x: int, y: int) -> Optional[str]:
        """Get hint text for a puzzle tile."""
        puzzle = self.get_puzzle_at(x, y)
        if puzzle and puzzle.hint_text:
            return puzzle.hint_text
        return None


# Factory functions for common puzzle types

def create_switch_sequence_puzzle(
    puzzle_id: str,
    switch_positions: list[tuple[int, int]],
    door_position: tuple[int, int],
    hint: str = "The switches must be activated in the correct order..."
) -> Puzzle:
    """Create a switch sequence puzzle.

    Args:
        puzzle_id: Unique puzzle identifier
        switch_positions: List of (x, y) positions in correct activation order
        door_position: Position of door to open on completion
        hint: Hint text shown when examining switches
    """
    return Puzzle(
        puzzle_id=puzzle_id,
        puzzle_type=PuzzleType.SWITCH_SEQUENCE,
        tiles=switch_positions,
        solution={'sequence': switch_positions},
        reward=PuzzleReward(
            reward_type=PuzzleRewardType.OPEN_DOOR,
            target_pos=door_position,
            message="The switches click into place. A door grinds open!"
        ),
        hint_text=hint,
    )


def create_lever_pattern_puzzle(
    puzzle_id: str,
    lever_positions: list[tuple[int, int]],
    pattern: dict[tuple[int, int], bool],
    door_position: tuple[int, int],
    hint: str = "The levers must form a specific pattern..."
) -> Puzzle:
    """Create a lever pattern puzzle.

    Args:
        puzzle_id: Unique puzzle identifier
        lever_positions: List of all lever positions
        pattern: Dict mapping position -> required state (True = active)
        door_position: Position of door to open on completion
        hint: Hint text
    """
    return Puzzle(
        puzzle_id=puzzle_id,
        puzzle_type=PuzzleType.LEVER_PATTERN,
        tiles=lever_positions,
        solution={'pattern': pattern},
        reward=PuzzleReward(
            reward_type=PuzzleRewardType.OPEN_DOOR,
            target_pos=door_position,
            message="The levers lock into position. Machinery groans to life!"
        ),
        hint_text=hint,
    )


def create_pressure_plate_puzzle(
    puzzle_id: str,
    plate_positions: list[tuple[int, int]],
    required_plates: list[tuple[int, int]],
    door_position: tuple[int, int],
    hint: str = "Weight must be applied to certain tiles..."
) -> Puzzle:
    """Create a pressure plate puzzle.

    Args:
        puzzle_id: Unique puzzle identifier
        plate_positions: List of all pressure plate positions
        required_plates: Subset that must be pressed simultaneously
        door_position: Position of door to open on completion
        hint: Hint text
    """
    return Puzzle(
        puzzle_id=puzzle_id,
        puzzle_type=PuzzleType.PRESSURE_PLATES,
        tiles=plate_positions,
        solution={'required': required_plates},
        reward=PuzzleReward(
            reward_type=PuzzleRewardType.OPEN_DOOR,
            target_pos=door_position,
            message="All the plates sink. You hear stone grinding!"
        ),
        hint_text=hint,
    )
