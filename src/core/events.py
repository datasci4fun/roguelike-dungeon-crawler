"""Event system for decoupling game logic from rendering.

The game engine emits events, which are consumed by the renderer (or any other
subscriber like a web client, logger, etc.)
"""
from dataclasses import dataclass, field
from enum import Enum, auto
from typing import List, Any, Optional
import time


class TransitionKind(Enum):
    """Types of transitions between game modes (v6.1)."""
    ENGAGE = auto()       # Exploration -> Battle start
    WIN = auto()          # Battle victory -> Exploration
    FLEE = auto()         # Battle flee -> Exploration
    DEFEAT = auto()       # Battle defeat -> Death cutscene
    BOSS_VICTORY = auto() # Floor 8 boss -> Victory cutscene


# Default transition durations (milliseconds)
TRANSITION_DURATIONS = {
    TransitionKind.ENGAGE: 600,
    TransitionKind.WIN: 400,
    TransitionKind.FLEE: 300,
    TransitionKind.DEFEAT: 0,      # Death camera handles it
    TransitionKind.BOSS_VICTORY: 800,
}


@dataclass
class TransitionState:
    """Current transition state (v6.1).

    When active=True, input is locked except for skip (if can_skip).
    """
    active: bool = False
    kind: Optional[TransitionKind] = None
    started_at: float = 0.0       # time.time() when started
    duration_ms: int = 0          # Total duration in ms
    can_skip: bool = True         # Whether user can skip with any key

    def start(self, kind: TransitionKind, duration_ms: int = None, can_skip: bool = True):
        """Start a transition."""
        self.active = True
        self.kind = kind
        self.started_at = time.time()
        self.duration_ms = duration_ms if duration_ms is not None else TRANSITION_DURATIONS.get(kind, 500)
        self.can_skip = can_skip

    def elapsed_ms(self) -> int:
        """Get milliseconds elapsed since transition started."""
        if not self.active:
            return 0
        return int((time.time() - self.started_at) * 1000)

    def is_complete(self) -> bool:
        """Check if transition duration has elapsed."""
        return self.elapsed_ms() >= self.duration_ms

    def skip(self):
        """Skip the current transition (if allowed)."""
        if self.can_skip:
            self.end()

    def end(self):
        """End the current transition."""
        self.active = False
        self.kind = None
        self.started_at = 0.0
        self.duration_ms = 0
        self.can_skip = True

    def to_dict(self) -> dict:
        """Serialize for API/frontend."""
        return {
            "active": self.active,
            "kind": self.kind.name if self.kind else None,
            "elapsed_ms": self.elapsed_ms(),
            "duration_ms": self.duration_ms,
            "can_skip": self.can_skip,
        }

    @classmethod
    def from_dict(cls, data: dict) -> 'TransitionState':
        """Deserialize from saved state."""
        state = cls()
        if data.get("active"):
            kind_name = data.get("kind")
            if kind_name:
                state.kind = TransitionKind[kind_name]
            state.active = True
            state.duration_ms = data.get("duration_ms", 500)
            state.can_skip = data.get("can_skip", True)
            # Restore timing - assume we're resuming mid-transition
            elapsed = data.get("elapsed_ms", 0)
            state.started_at = time.time() - (elapsed / 1000.0)
        return state


class EventType(Enum):
    """Types of events the game engine can emit."""
    # Combat events
    ATTACK = auto()          # Entity attacked another
    DAMAGE = auto()          # Entity took damage
    KILL = auto()            # Entity was killed
    DEATH = auto()           # Player died

    # Animation events (for renderer)
    HIT_FLASH = auto()       # Flash an entity (took damage)
    BUFF_FLASH = auto()      # Flash an entity (received buff/heal) (v6.0.5)
    DAMAGE_NUMBER = auto()   # Show floating damage number
    DIRECTION_ARROW = auto() # Show attack direction indicator
    DEATH_FLASH = auto()     # Flash at death location

    # World events
    BLOOD_STAIN = auto()     # Add blood stain to dungeon
    ITEM_PICKUP = auto()     # Item was picked up
    ITEM_DROP = auto()       # Item was dropped

    # Player events
    PLAYER_MOVE = auto()     # Player moved
    LEVEL_UP = auto()        # Player leveled up
    XP_GAIN = auto()         # Player gained XP

    # Level events
    LEVEL_TRANSITION = auto() # Descending/ascending stairs
    VICTORY = auto()          # Player won the game

    # UI events
    MESSAGE = auto()         # Add message to log
    STATE_CHANGE = auto()    # Game state changed
    UI_MODE_CHANGE = auto()  # UI mode changed

    # Environmental events
    FIELD_PULSE = auto()     # Field surge event triggered

    # Battle mode events (v6.0)
    BATTLE_START = auto()    # Entered tactical battle mode
    BATTLE_END = auto()      # Exited battle mode (victory/defeat/flee)

    # Battle turn events (v6.9 - visible turn-based combat)
    ENEMY_TURN_START = auto()  # Enemy turn started (enemy_id, enemy_name, turn_index, total_enemies)
    ENEMY_TURN_END = auto()    # Enemy turn ended (enemy_id)
    ENEMY_MOVE = auto()        # Enemy moved (enemy_id, from_x, from_y, to_x, to_y)
    ENEMY_ATTACK = auto()      # Enemy attacked (enemy_id, target_id, damage)
    PLAYER_TURN_START = auto() # Player turn started
    PLAYER_TURN_END = auto()   # Player turn ended

    # Transition events (v6.1)
    TRANSITION_START = auto()  # Transition began (kind in data)
    TRANSITION_END = auto()    # Transition completed or skipped


@dataclass
class GameEvent:
    """Base event class with type and optional data."""
    type: EventType
    data: dict = field(default_factory=dict)

    def __repr__(self):
        return f"GameEvent({self.type.name}, {self.data})"


class EventQueue:
    """
    Collects events during a game tick for later processing.

    Usage:
        queue = EventQueue()
        queue.emit(EventType.DAMAGE, x=10, y=5, amount=3)

        for event in queue.flush():
            handle_event(event)
    """

    def __init__(self):
        self._events: List[GameEvent] = []

    def emit(self, event_type: EventType, **data) -> GameEvent:
        """
        Emit an event to the queue.

        Args:
            event_type: The type of event
            **data: Event-specific data as keyword arguments

        Returns:
            The created event
        """
        event = GameEvent(type=event_type, data=data)
        self._events.append(event)
        return event

    def emit_message(self, text: str, category: str = "SYSTEM",
                     importance: str = "NORMAL"):
        """Convenience method for emitting message events."""
        self.emit(EventType.MESSAGE,
                  text=text,
                  category=category,
                  importance=importance)

    def emit_hit(self, entity: Any, damage: int, attacker: Any = None):
        """Convenience method for hit events with animation."""
        self.emit(EventType.HIT_FLASH, entity=entity)
        if hasattr(entity, 'x') and hasattr(entity, 'y'):
            self.emit(EventType.DAMAGE_NUMBER,
                      x=entity.x, y=entity.y, amount=damage)

    def emit_attack(self, attacker: Any, target: Any, damage: int,
                    target_killed: bool = False):
        """Convenience method for attack sequence events."""
        # Direction indicator from attacker to target
        if hasattr(attacker, 'x') and hasattr(target, 'x'):
            self.emit(EventType.DIRECTION_ARROW,
                      from_x=attacker.x, from_y=attacker.y,
                      to_x=target.x, to_y=target.y)

        # Damage number on target
        if hasattr(target, 'x'):
            self.emit(EventType.DAMAGE_NUMBER,
                      x=target.x, y=target.y, amount=damage)

        if target_killed:
            # Death flash and blood stain
            if hasattr(target, 'x'):
                self.emit(EventType.DEATH_FLASH, x=target.x, y=target.y)
                self.emit(EventType.BLOOD_STAIN, x=target.x, y=target.y)
        else:
            # Hit flash on surviving target
            self.emit(EventType.HIT_FLASH, entity=target)

    def flush(self) -> List[GameEvent]:
        """
        Get all pending events and clear the queue.

        Returns:
            List of all events since last flush
        """
        events = self._events
        self._events = []
        return events

    def peek(self) -> List[GameEvent]:
        """Get all pending events without clearing the queue."""
        return self._events.copy()

    def clear(self):
        """Clear all pending events without processing."""
        self._events = []

    def __len__(self) -> int:
        return len(self._events)

    def __bool__(self) -> bool:
        return len(self._events) > 0


# Global event queue instance (can be replaced with dependency injection later)
_global_queue: Optional[EventQueue] = None


def get_event_queue() -> EventQueue:
    """Get the global event queue instance."""
    global _global_queue
    if _global_queue is None:
        _global_queue = EventQueue()
    return _global_queue


def reset_event_queue():
    """Reset the global event queue (useful for testing)."""
    global _global_queue
    _global_queue = EventQueue()
