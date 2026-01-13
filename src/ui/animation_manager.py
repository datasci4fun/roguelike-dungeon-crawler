"""Animation management for the terminal renderer.

Handles hit flashes, damage numbers, direction indicators, and death effects.
"""
import time
from typing import Any, Dict, List


class AnimationManager:
    """Manages visual animations for combat feedback."""

    def __init__(self):
        self.animations: List[Dict[str, Any]] = []  # Entity hit animations
        self.damage_numbers: List[Dict[str, Any]] = []  # Floating damage numbers
        self.direction_indicators: List[Dict[str, Any]] = []  # Attack direction arrows
        self.corpses: List[Dict[str, Any]] = []  # Temporary corpse animations

    def add_hit_animation(self, entity: Any, duration: float = 0.15):
        """
        Add a hit flash animation to an entity.

        Args:
            entity: The entity that was hit (Player or Enemy)
            duration: How long the flash lasts (seconds)
        """
        self.animations.append({
            'entity': entity,
            'effect': 'hit',
            'start_time': time.time(),
            'duration': duration
        })

    def add_damage_number(self, x: int, y: int, damage: int, duration: float = 0.5):
        """
        Add a floating damage number above a position.

        Args:
            x: X coordinate
            y: Y coordinate
            damage: Amount of damage to display
            duration: How long the number floats (seconds)
        """
        self.damage_numbers.append({
            'x': x,
            'y': y - 1,  # Display above the entity
            'text': f"-{damage}",
            'start_time': time.time(),
            'duration': duration
        })

    def add_direction_indicator(self, from_x: int, from_y: int, to_x: int, to_y: int, duration: float = 0.1):
        """
        Add an attack direction arrow from attacker to target.

        Args:
            from_x, from_y: Attacker position
            to_x, to_y: Target position
            duration: How long the arrow shows (seconds)
        """
        # Calculate direction
        dx = to_x - from_x
        dy = to_y - from_y

        # Determine arrow character
        if dx == 0 and dy < 0:
            arrow = '↑'
        elif dx == 0 and dy > 0:
            arrow = '↓'
        elif dx < 0 and dy == 0:
            arrow = '←'
        elif dx > 0 and dy == 0:
            arrow = '→'
        elif dx > 0 and dy < 0:
            arrow = '↗'
        elif dx > 0 and dy > 0:
            arrow = '↘'
        elif dx < 0 and dy > 0:
            arrow = '↙'
        elif dx < 0 and dy < 0:
            arrow = '↖'
        else:
            arrow = '·'  # Fallback for same position

        # Place arrow between attacker and target
        arrow_x = from_x + (1 if dx > 0 else -1 if dx < 0 else 0)
        arrow_y = from_y + (1 if dy > 0 else -1 if dy < 0 else 0)

        self.direction_indicators.append({
            'x': arrow_x,
            'y': arrow_y,
            'char': arrow,
            'start_time': time.time(),
            'duration': duration
        })

    def add_death_flash(self, x: int, y: int, duration: float = 0.2):
        """
        Add a brief death flash where an enemy died.

        Args:
            x, y: Position where entity died
            duration: How long the flash lasts (seconds)
        """
        self.corpses.append({
            'x': x,
            'y': y,
            'char': '%',
            'start_time': time.time(),
            'duration': duration,
            'phase': 'flash'
        })

    def cleanup_expired(self):
        """Remove expired animations."""
        current_time = time.time()

        self.animations = [
            anim for anim in self.animations
            if current_time - anim['start_time'] < anim['duration']
        ]

        self.damage_numbers = [
            num for num in self.damage_numbers
            if current_time - num['start_time'] < num['duration']
        ]

        self.direction_indicators = [
            ind for ind in self.direction_indicators
            if current_time - ind['start_time'] < ind['duration']
        ]

        self.corpses = [
            corpse for corpse in self.corpses
            if current_time - corpse['start_time'] < corpse['duration']
        ]

    def is_entity_animated(self, entity: Any) -> bool:
        """Check if an entity has an active hit animation."""
        return any(anim['entity'] == entity for anim in self.animations)
