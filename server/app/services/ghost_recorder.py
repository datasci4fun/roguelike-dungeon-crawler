"""Ghost recorder for capturing player gameplay for replay."""
import json
from dataclasses import dataclass, field, asdict
from typing import List, Optional, Any
from datetime import datetime


@dataclass
class GhostFrame:
    """A single frame of ghost data representing player state at a point in time."""
    turn: int
    x: int
    y: int
    health: int
    max_health: int
    level: int  # Player level
    dungeon_level: int
    action: str  # The action taken (MOVE_UP, ATTACK, etc.)
    target_x: Optional[int] = None  # For attacks, position of target
    target_y: Optional[int] = None
    damage_dealt: Optional[int] = None
    damage_taken: Optional[int] = None
    message: Optional[str] = None  # Any message from this turn

    def to_dict(self) -> dict:
        """Convert frame to dictionary for JSON serialization."""
        return {k: v for k, v in asdict(self).items() if v is not None}


@dataclass
class GhostData:
    """Complete ghost recording for a game session."""
    user_id: int
    username: str
    started_at: str
    ended_at: Optional[str] = None
    victory: bool = False
    cause_of_death: Optional[str] = None
    killed_by: Optional[str] = None
    final_level: int = 1
    final_score: int = 0
    total_turns: int = 0
    frames: List[GhostFrame] = field(default_factory=list)

    # Dungeon seed for deterministic replay (if available)
    dungeon_seed: Optional[int] = None

    def to_json(self) -> str:
        """Serialize ghost data to JSON string."""
        data = {
            "user_id": self.user_id,
            "username": self.username,
            "started_at": self.started_at,
            "ended_at": self.ended_at,
            "victory": self.victory,
            "cause_of_death": self.cause_of_death,
            "killed_by": self.killed_by,
            "final_level": self.final_level,
            "final_score": self.final_score,
            "total_turns": self.total_turns,
            "dungeon_seed": self.dungeon_seed,
            "frames": [f.to_dict() for f in self.frames],
        }
        return json.dumps(data)

    @classmethod
    def from_json(cls, json_str: str) -> 'GhostData':
        """Deserialize ghost data from JSON string."""
        data = json.loads(json_str)
        frames = [GhostFrame(**f) for f in data.pop("frames", [])]
        return cls(**data, frames=frames)


class GhostRecorder:
    """
    Records player actions during gameplay for ghost replay.

    The recorder captures snapshots of player state at each turn,
    which can later be replayed to show how other players navigated
    the dungeon.
    """

    # Maximum frames to record (prevent memory issues on long runs)
    MAX_FRAMES = 10000

    # Record every N turns (1 = every turn, 2 = every other turn, etc.)
    RECORD_INTERVAL = 1

    def __init__(self, user_id: int, username: str, dungeon_seed: Optional[int] = None):
        """
        Initialize the ghost recorder.

        Args:
            user_id: The player's user ID
            username: The player's username
            dungeon_seed: Optional seed for dungeon generation
        """
        self.ghost_data = GhostData(
            user_id=user_id,
            username=username,
            started_at=datetime.utcnow().isoformat(),
            dungeon_seed=dungeon_seed,
        )
        self._turn_count = 0
        self._last_recorded_turn = -1

    def record_frame(
        self,
        player: Any,
        dungeon_level: int,
        action: str,
        target_x: Optional[int] = None,
        target_y: Optional[int] = None,
        damage_dealt: Optional[int] = None,
        damage_taken: Optional[int] = None,
        message: Optional[str] = None,
    ):
        """
        Record a frame of player state.

        Args:
            player: The player entity
            dungeon_level: Current dungeon level
            action: The action taken this turn
            target_x: X position of attack target (if any)
            target_y: Y position of attack target (if any)
            damage_dealt: Damage dealt this turn (if any)
            damage_taken: Damage taken this turn (if any)
            message: Any message from this turn
        """
        self._turn_count += 1

        # Check if we should record this turn
        if self._turn_count - self._last_recorded_turn < self.RECORD_INTERVAL:
            return

        # Check max frames
        if len(self.ghost_data.frames) >= self.MAX_FRAMES:
            return

        # Create and add frame
        frame = GhostFrame(
            turn=self._turn_count,
            x=player.x,
            y=player.y,
            health=player.health,
            max_health=player.max_health,
            level=player.level,
            dungeon_level=dungeon_level,
            action=action,
            target_x=target_x,
            target_y=target_y,
            damage_dealt=damage_dealt,
            damage_taken=damage_taken,
            message=message,
        )

        self.ghost_data.frames.append(frame)
        self._last_recorded_turn = self._turn_count

    def record_death(
        self,
        cause: str,
        killed_by: Optional[str] = None,
        final_level: int = 1,
        final_score: int = 0,
    ):
        """
        Record player death information.

        Args:
            cause: Cause of death
            killed_by: Name of enemy that killed the player
            final_level: Final dungeon level reached
            final_score: Final score
        """
        self.ghost_data.ended_at = datetime.utcnow().isoformat()
        self.ghost_data.victory = False
        self.ghost_data.cause_of_death = cause
        self.ghost_data.killed_by = killed_by
        self.ghost_data.final_level = final_level
        self.ghost_data.final_score = final_score
        self.ghost_data.total_turns = self._turn_count

    def record_victory(self, final_level: int = 5, final_score: int = 0):
        """
        Record player victory.

        Args:
            final_level: Final dungeon level
            final_score: Final score
        """
        self.ghost_data.ended_at = datetime.utcnow().isoformat()
        self.ghost_data.victory = True
        self.ghost_data.final_level = final_level
        self.ghost_data.final_score = final_score
        self.ghost_data.total_turns = self._turn_count

    def finalize(self) -> str:
        """
        Finalize recording and return JSON string.

        Returns:
            JSON string of ghost data
        """
        if not self.ghost_data.ended_at:
            self.ghost_data.ended_at = datetime.utcnow().isoformat()
        self.ghost_data.total_turns = self._turn_count
        return self.ghost_data.to_json()

    def get_frames_for_level(self, dungeon_level: int) -> List[GhostFrame]:
        """
        Get all frames for a specific dungeon level.

        Args:
            dungeon_level: The dungeon level to filter by

        Returns:
            List of frames for that level
        """
        return [f for f in self.ghost_data.frames if f.dungeon_level == dungeon_level]

    @property
    def frame_count(self) -> int:
        """Get the number of recorded frames."""
        return len(self.ghost_data.frames)

    @property
    def turn_count(self) -> int:
        """Get the total turn count."""
        return self._turn_count
