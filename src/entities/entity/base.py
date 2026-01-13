"""Base entity class for all game entities."""
from dataclasses import dataclass, field
from typing import List, Optional
import math

from ...core.constants import StatusEffectType
from ..status_effects import StatusEffectManager


@dataclass
class Entity:
    """Base class for all game entities.

    Provides common functionality for position, health, damage,
    and status effect management.
    """
    x: int
    y: int
    symbol: str
    max_health: int
    health: int
    attack_damage: int
    status_effects: StatusEffectManager = field(default_factory=StatusEffectManager)

    def is_alive(self) -> bool:
        """Check if entity is still alive."""
        return self.health > 0

    def take_damage(self, damage: int) -> int:
        """Take damage and return actual damage taken."""
        actual_damage = min(damage, self.health)
        self.health -= actual_damage
        return actual_damage

    def distance_to(self, x: int, y: int) -> float:
        """Calculate Euclidean distance to a position."""
        return math.sqrt((self.x - x) ** 2 + (self.y - y) ** 2)

    # Status effect methods
    def apply_status_effect(self, effect_type: StatusEffectType, source: Optional[str] = None) -> str:
        """Apply a status effect to this entity."""
        return self.status_effects.apply_effect(effect_type, source)

    def has_status_effect(self, effect_type: StatusEffectType) -> bool:
        """Check if entity has a specific status effect."""
        return self.status_effects.has_effect(effect_type)

    def process_status_effects(self) -> List[dict]:
        """Process all status effects for one turn. Returns list of results."""
        results = self.status_effects.tick()
        # Apply damage from effects
        for result in results:
            if result['damage'] > 0:
                self.health -= result['damage']
                self.health = max(0, self.health)
        return results

    def is_stunned(self) -> bool:
        """Check if entity is currently stunned."""
        return self.status_effects.is_stunned()

    def get_movement_penalty(self) -> float:
        """Get movement penalty from status effects."""
        return self.status_effects.get_movement_penalty()

    def clear_status_effects(self):
        """Remove all status effects."""
        self.status_effects.clear_all()
