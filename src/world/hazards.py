"""Environmental hazard system for v4.0 dungeon mechanics.

Hazards are terrain features that apply continuous effects to entities.
"""
from dataclasses import dataclass
from typing import TYPE_CHECKING, Optional, List, Set, Tuple
import random

from ..core.constants import HazardType, HAZARD_STATS, StatusEffectType

if TYPE_CHECKING:
    from ..entities.entities import Entity, Player


@dataclass
class Hazard:
    """An environmental hazard tile."""
    x: int
    y: int
    hazard_type: HazardType
    intensity: int = 1  # For spreading hazards

    @property
    def stats(self) -> dict:
        """Get the stats for this hazard type."""
        return HAZARD_STATS[self.hazard_type]

    @property
    def name(self) -> str:
        return self.stats['name']

    @property
    def symbol(self) -> str:
        return self.stats['symbol']

    @property
    def color(self) -> int:
        return self.stats['color']

    def affect_entity(self, entity: 'Entity', amplification: float = 1.0) -> dict:
        """
        Apply hazard effects to an entity standing on it.

        Args:
            entity: The entity affected by the hazard
            amplification: Damage multiplier from field pulses (1.0 = normal)

        Returns:
            dict with 'damage', 'effect', 'message', 'slide_direction', 'drown'
        """
        result = {
            'damage': 0,
            'effect': None,
            'message': '',
            'slide_direction': None,
            'drown': False
        }

        stats = self.stats

        # Apply damage (with amplification)
        base_damage = stats.get('damage_per_turn', 0)
        damage = int(base_damage * amplification)
        if damage > 0:
            actual_damage = entity.take_damage(damage)
            result['damage'] = actual_damage
            # Show amplification in message if active
            if amplification > 1.0:
                result['message'] = f"The {self.name.lower()} SURGES and burns you for {actual_damage} damage!"
            else:
                result['message'] = f"The {self.name.lower()} burns you for {actual_damage} damage!"

        # Apply status effect
        effect = stats.get('effect')
        if effect:
            effect_msg = entity.apply_status_effect(effect, self.name)
            result['effect'] = effect
            if result['message']:
                result['message'] += f" {effect_msg}"
            else:
                result['message'] = effect_msg

        # Check for drowning (deep water)
        if stats.get('drown_chance', 0) > 0:
            hp_threshold = entity.max_health * 0.25
            if entity.health < hp_threshold:
                if random.random() < stats['drown_chance']:
                    result['drown'] = True
                    result['message'] = "You're drowning in the deep water!"

        return result

    def get_slide_direction(self, entry_dx: int, entry_dy: int) -> Tuple[int, int]:
        """
        For ice hazards, calculate slide direction based on entry.

        Args:
            entry_dx, entry_dy: Direction entity entered from

        Returns:
            (dx, dy) slide direction
        """
        if not self.stats.get('causes_slide', False):
            return (0, 0)

        # Continue in the same direction
        return (entry_dx, entry_dy)


class HazardManager:
    """Manages all hazards on a dungeon level."""

    def __init__(self):
        self.hazards: List[Hazard] = []
        self._positions: Set[Tuple[int, int]] = set()
        self.amplification: float = 1.0  # Field pulse amplification

    def add_hazard(self, hazard: Hazard):
        """Add a hazard to the level."""
        self.hazards.append(hazard)
        self._positions.add((hazard.x, hazard.y))

    def get_hazard_at(self, x: int, y: int) -> Optional[Hazard]:
        """Get hazard at position, if any."""
        if (x, y) not in self._positions:
            return None
        for hazard in self.hazards:
            if hazard.x == x and hazard.y == y:
                return hazard
        return None

    def has_hazard_at(self, x: int, y: int) -> bool:
        """Check if there's a hazard at position."""
        return (x, y) in self._positions

    def process_entity_at(self, entity: 'Entity', x: int, y: int) -> Optional[dict]:
        """
        Process hazard effects for entity at position.

        Uses current amplification from field pulses.

        Returns:
            Effect result if hazard present, None otherwise
        """
        hazard = self.get_hazard_at(x, y)
        if hazard:
            return hazard.affect_entity(entity, self.amplification)
        return None

    def set_amplification(self, value: float):
        """Set the hazard damage amplification from field pulses."""
        self.amplification = value

    def tick_spreading(self, is_walkable_func) -> List[Hazard]:
        """
        Process spreading hazards (poison gas).

        Returns:
            List of newly created hazards
        """
        new_hazards = []

        for hazard in self.hazards:
            if hazard.stats.get('spreads', False):
                # Small chance to spread each turn
                if random.random() < 0.1:  # 10% spread chance per turn
                    # Try to spread to adjacent tile
                    directions = [(0, 1), (0, -1), (1, 0), (-1, 0)]
                    random.shuffle(directions)

                    for dx, dy in directions:
                        nx, ny = hazard.x + dx, hazard.y + dy
                        if (is_walkable_func(nx, ny) and
                            not self.has_hazard_at(nx, ny)):
                            new_hazard = Hazard(
                                x=nx,
                                y=ny,
                                hazard_type=hazard.hazard_type,
                                intensity=hazard.intensity - 1
                            )
                            if new_hazard.intensity > 0:
                                new_hazards.append(new_hazard)
                            break

        # Add new hazards
        for hazard in new_hazards:
            self.add_hazard(hazard)

        return new_hazards

    def is_ice_at(self, x: int, y: int) -> bool:
        """Check if there's ice at position."""
        hazard = self.get_hazard_at(x, y)
        return hazard is not None and hazard.hazard_type == HazardType.ICE

    def is_deep_water_at(self, x: int, y: int) -> bool:
        """Check if there's deep water at position."""
        hazard = self.get_hazard_at(x, y)
        return hazard is not None and hazard.hazard_type == HazardType.DEEP_WATER

    def get_movement_cost(self, x: int, y: int) -> int:
        """Get movement cost for position (1 = normal, 2 = slowed)."""
        hazard = self.get_hazard_at(x, y)
        if hazard and hazard.stats.get('slows_movement', False):
            return 2
        return 1

    def clear(self):
        """Remove all hazards and reset amplification."""
        self.hazards.clear()
        self._positions.clear()
        self.amplification = 1.0

    def __len__(self) -> int:
        return len(self.hazards)
