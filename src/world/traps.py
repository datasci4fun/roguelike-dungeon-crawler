"""Trap system for v4.0 dungeon mechanics.

Traps can be hidden or visible, triggered by entities, and reset after cooldown.
"""
from dataclasses import dataclass
from typing import TYPE_CHECKING, Optional, List
import random

from ..core.constants import TrapType, TRAP_STATS, StatusEffectType

if TYPE_CHECKING:
    from ..entities.entities import Entity, Player


@dataclass
class Trap:
    """A dungeon trap."""
    x: int
    y: int
    trap_type: TrapType
    hidden: bool = True
    triggered: bool = False
    cooldown_remaining: int = 0

    @property
    def stats(self) -> dict:
        """Get the stats for this trap type."""
        return TRAP_STATS[self.trap_type]

    @property
    def name(self) -> str:
        return self.stats['name']

    @property
    def symbol(self) -> str:
        """Get the display symbol based on visibility."""
        if self.hidden:
            return self.stats['symbol_hidden']
        return self.stats['symbol_visible']

    @property
    def is_active(self) -> bool:
        """Check if trap can be triggered."""
        return not self.triggered and self.cooldown_remaining <= 0

    def detect(self, perception: int = 10) -> bool:
        """
        Attempt to detect a hidden trap.

        Args:
            perception: Detection skill/modifier (higher = better chance)

        Returns:
            True if trap was detected and revealed
        """
        if not self.hidden:
            return False  # Already visible

        detection_dc = self.stats['detection_dc']
        roll = random.randint(1, 20) + perception

        if roll >= detection_dc:
            self.hidden = False
            return True
        return False

    def trigger(self, entity: 'Entity') -> dict:
        """
        Trigger the trap on an entity.

        Returns:
            dict with 'damage', 'effect', 'message'
        """
        if not self.is_active:
            return {'damage': 0, 'effect': None, 'message': ''}

        self.triggered = True
        self.cooldown_remaining = self.stats['cooldown']

        # Reveal trap when triggered
        self.hidden = False

        # Calculate damage
        damage_min = self.stats['damage_min']
        damage_max = self.stats['damage_max']
        damage = random.randint(damage_min, damage_max)

        # Apply damage
        actual_damage = entity.take_damage(damage)

        # Apply status effect if any
        effect = self.stats['effect']
        effect_msg = ''
        if effect:
            effect_msg = entity.apply_status_effect(effect, self.name)

        message = f"Triggered {self.name}! Took {actual_damage} damage."
        if effect_msg:
            message += f" {effect_msg}"

        return {
            'damage': actual_damage,
            'effect': effect,
            'message': message
        }

    def tick(self):
        """Process one turn for this trap (cooldown)."""
        if self.cooldown_remaining > 0:
            self.cooldown_remaining -= 1
            if self.cooldown_remaining <= 0:
                self.triggered = False  # Trap resets


class TrapManager:
    """Manages all traps on a dungeon level."""

    def __init__(self):
        self.traps: List[Trap] = []

    def add_trap(self, trap: Trap):
        """Add a trap to the level."""
        self.traps.append(trap)

    def get_trap_at(self, x: int, y: int) -> Optional[Trap]:
        """Get trap at position, if any."""
        for trap in self.traps:
            if trap.x == x and trap.y == y:
                return trap
        return None

    def check_and_trigger(self, entity: 'Entity', x: int, y: int) -> Optional[dict]:
        """
        Check for trap at position and trigger if present.

        Returns:
            Result dict if trap triggered, None otherwise
        """
        trap = self.get_trap_at(x, y)
        if trap and trap.is_active:
            return trap.trigger(entity)
        return None

    def tick_all(self):
        """Process one turn for all traps."""
        for trap in self.traps:
            trap.tick()

    def detect_nearby(self, x: int, y: int, perception: int = 10, radius: int = 2) -> List[Trap]:
        """
        Attempt to detect hidden traps near a position.

        Returns:
            List of traps that were detected
        """
        detected = []
        for trap in self.traps:
            if trap.hidden:
                dist = abs(trap.x - x) + abs(trap.y - y)
                if dist <= radius:
                    if trap.detect(perception):
                        detected.append(trap)
        return detected

    def get_visible_traps(self) -> List[Trap]:
        """Get all visible (non-hidden) traps."""
        return [trap for trap in self.traps if not trap.hidden]

    def clear(self):
        """Remove all traps."""
        self.traps.clear()

    def __len__(self) -> int:
        return len(self.traps)
