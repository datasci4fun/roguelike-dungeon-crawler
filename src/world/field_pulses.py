"""Field Pulse system for deterministic per-floor environmental events.

The Field is a meta-narrative energy that permeates the dungeon.
Pulses are seeded surges that temporarily amplify zone behaviors
without breaking fairness guarantees.
"""
import random
from dataclasses import dataclass
from enum import Enum, auto
from typing import List, Optional, Tuple


class PulseIntensity(Enum):
    """Intensity levels for field pulses."""
    MINOR = auto()    # Subtle effects
    MODERATE = auto() # Noticeable effects
    MAJOR = auto()    # Significant effects


@dataclass
class FieldPulse:
    """Represents a single field pulse event."""
    turn: int                     # Turn number when pulse triggers
    intensity: PulseIntensity     # How strong the pulse is
    triggered: bool = False       # Whether this pulse has fired

    @property
    def amplification(self) -> float:
        """Get the amplification multiplier for this pulse."""
        return {
            PulseIntensity.MINOR: 1.25,
            PulseIntensity.MODERATE: 1.5,
            PulseIntensity.MAJOR: 2.0,
        }.get(self.intensity, 1.0)

    @property
    def duration(self) -> int:
        """Get how many turns the pulse effect lasts."""
        return {
            PulseIntensity.MINOR: 3,
            PulseIntensity.MODERATE: 5,
            PulseIntensity.MAJOR: 8,
        }.get(self.intensity, 3)


class FieldPulseManager:
    """Manages deterministic field pulses per floor.

    Each floor generates 1-3 pulses at specific turn counts based on
    a seeded RNG. When a pulse triggers, it temporarily amplifies
    zone effects like evidence density, hazard intensity, and spawn rates.

    Usage:
        manager = FieldPulseManager()
        manager.initialize_floor(floor=3, seed=12345)

        # Each turn:
        pulse = manager.check_pulse(turn=current_turn)
        if pulse:
            # Show message, apply effects
            pass

        # Get current amplification:
        amp = manager.get_current_amplification(current_turn)
    """

    # Configuration
    MIN_PULSES_PER_FLOOR = 1
    MAX_PULSES_PER_FLOOR = 3
    MIN_PULSE_TURN = 10       # Earliest turn a pulse can trigger
    MAX_PULSE_TURN = 150      # Latest turn a pulse can trigger
    MIN_PULSE_SPACING = 15    # Minimum turns between pulses

    def __init__(self):
        self.floor = 0
        self.seed = 0
        self.pulses: List[FieldPulse] = []
        self.floor_turn = 0
        self.active_pulse: Optional[FieldPulse] = None
        self.active_pulse_end_turn = 0

    def initialize_floor(self, floor: int, seed: Optional[int] = None):
        """Initialize pulses for a new floor.

        Args:
            floor: The dungeon floor number (1-8)
            seed: Optional seed for determinism. If None, uses floor number.
        """
        self.floor = floor
        self.seed = seed if seed is not None else floor * 1000
        self.pulses = []
        self.floor_turn = 0
        self.active_pulse = None
        self.active_pulse_end_turn = 0

        # Use seeded RNG for deterministic pulse generation
        rng = random.Random(self.seed)

        # Determine number of pulses (deeper floors have more)
        base_pulses = self.MIN_PULSES_PER_FLOOR
        extra_pulse_chance = 0.1 * floor  # 10% per floor for extra pulse
        num_pulses = base_pulses

        for _ in range(self.MAX_PULSES_PER_FLOOR - self.MIN_PULSES_PER_FLOOR):
            if rng.random() < extra_pulse_chance:
                num_pulses += 1

        # Generate pulse turn numbers with spacing
        pulse_turns = self._generate_pulse_turns(rng, num_pulses)

        # Create pulses with intensity based on floor depth
        for turn in pulse_turns:
            intensity = self._determine_intensity(rng, floor)
            self.pulses.append(FieldPulse(turn=turn, intensity=intensity))

        # Sort by turn order
        self.pulses.sort(key=lambda p: p.turn)

    def _generate_pulse_turns(self, rng: random.Random, num_pulses: int) -> List[int]:
        """Generate well-spaced pulse turn numbers."""
        if num_pulses == 0:
            return []

        turns = []
        available_range = self.MAX_PULSE_TURN - self.MIN_PULSE_TURN

        # Divide the range into segments for better distribution
        segment_size = available_range // (num_pulses + 1)

        for i in range(num_pulses):
            segment_start = self.MIN_PULSE_TURN + (i * segment_size)
            segment_end = segment_start + segment_size

            # Add some randomness within segment
            turn = rng.randint(segment_start, min(segment_end, self.MAX_PULSE_TURN))

            # Ensure spacing from previous pulse
            if turns and turn - turns[-1] < self.MIN_PULSE_SPACING:
                turn = turns[-1] + self.MIN_PULSE_SPACING

            if turn <= self.MAX_PULSE_TURN:
                turns.append(turn)

        return turns

    def _determine_intensity(self, rng: random.Random, floor: int) -> PulseIntensity:
        """Determine pulse intensity based on floor and randomness."""
        roll = rng.random()

        # Deeper floors have higher chance of stronger pulses
        major_threshold = 0.05 + (floor * 0.03)  # 8% to 29%
        moderate_threshold = major_threshold + 0.25 + (floor * 0.02)  # 33% to 49%

        if roll < major_threshold:
            return PulseIntensity.MAJOR
        elif roll < moderate_threshold:
            return PulseIntensity.MODERATE
        else:
            return PulseIntensity.MINOR

    def tick(self) -> Optional[FieldPulse]:
        """Advance floor turn counter and check for pulse trigger.

        Returns:
            The pulse that triggered, or None.
        """
        self.floor_turn += 1
        return self.check_pulse(self.floor_turn)

    def check_pulse(self, turn: int) -> Optional[FieldPulse]:
        """Check if a pulse triggers on this turn.

        Args:
            turn: The current floor turn number.

        Returns:
            The pulse that triggered, or None.
        """
        for pulse in self.pulses:
            if not pulse.triggered and pulse.turn == turn:
                pulse.triggered = True
                self.active_pulse = pulse
                self.active_pulse_end_turn = turn + pulse.duration
                return pulse

        # Check if active pulse has expired
        if self.active_pulse and turn >= self.active_pulse_end_turn:
            self.active_pulse = None
            self.active_pulse_end_turn = 0

        return None

    def get_current_amplification(self, turn: Optional[int] = None) -> float:
        """Get the current amplification multiplier.

        Args:
            turn: Turn to check. Uses floor_turn if None.

        Returns:
            Amplification multiplier (1.0 = no amplification).
        """
        if turn is None:
            turn = self.floor_turn

        if self.active_pulse and turn < self.active_pulse_end_turn:
            return self.active_pulse.amplification

        return 1.0

    def is_pulse_active(self, turn: Optional[int] = None) -> bool:
        """Check if a pulse effect is currently active.

        Args:
            turn: Turn to check. Uses floor_turn if None.
        """
        if turn is None:
            turn = self.floor_turn

        return self.active_pulse is not None and turn < self.active_pulse_end_turn

    def get_pulse_info(self) -> dict:
        """Get info about current pulse state for UI/debugging."""
        return {
            "floor": self.floor,
            "floor_turn": self.floor_turn,
            "total_pulses": len(self.pulses),
            "triggered_pulses": sum(1 for p in self.pulses if p.triggered),
            "upcoming_pulses": [p.turn for p in self.pulses if not p.triggered],
            "active_pulse": self.active_pulse is not None,
            "amplification": self.get_current_amplification(),
            "pulse_ends_at": self.active_pulse_end_turn if self.active_pulse else None,
        }

    def get_pulse_message(self, pulse: FieldPulse) -> str:
        """Get the narrative message for a pulse trigger."""
        intensity_messages = {
            PulseIntensity.MINOR: "The Field stirs...",
            PulseIntensity.MODERATE: "The Field surges!",
            PulseIntensity.MAJOR: "THE FIELD ERUPTS!",
        }
        return intensity_messages.get(pulse.intensity, "The Field pulses.")

    def get_state(self) -> dict:
        """Get serializable state for save/load."""
        return {
            "floor": self.floor,
            "seed": self.seed,
            "floor_turn": self.floor_turn,
            "pulses": [
                {
                    "turn": p.turn,
                    "intensity": p.intensity.name,
                    "triggered": p.triggered,
                }
                for p in self.pulses
            ],
            "active_pulse_end_turn": self.active_pulse_end_turn,
        }

    def load_state(self, state: dict):
        """Load state from saved data."""
        self.floor = state.get("floor", 0)
        self.seed = state.get("seed", 0)
        self.floor_turn = state.get("floor_turn", 0)
        self.active_pulse_end_turn = state.get("active_pulse_end_turn", 0)

        self.pulses = []
        for p_data in state.get("pulses", []):
            intensity = PulseIntensity[p_data["intensity"]]
            pulse = FieldPulse(
                turn=p_data["turn"],
                intensity=intensity,
                triggered=p_data["triggered"],
            )
            self.pulses.append(pulse)

            # Restore active pulse reference
            if pulse.triggered and self.floor_turn < self.active_pulse_end_turn:
                # Find the most recently triggered pulse
                if self.active_pulse is None or pulse.turn > self.active_pulse.turn:
                    self.active_pulse = pulse
