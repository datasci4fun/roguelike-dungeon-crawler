"""Status effects system for v4.0.

Handles poison, burn, freeze, stun and other status effects.
"""
from dataclasses import dataclass, field
from typing import List, Optional, TYPE_CHECKING

from src.core.constants import StatusEffectType, STATUS_EFFECT_STATS

if TYPE_CHECKING:
    from src.entities.entities import Entity


@dataclass
class StatusEffect:
    """A status effect applied to an entity."""
    effect_type: StatusEffectType
    duration: int  # Remaining turns
    stacks: int = 1  # Current stack count
    source: Optional[str] = None  # What caused this effect

    @property
    def stats(self) -> dict:
        """Get the stats for this effect type."""
        return STATUS_EFFECT_STATS[self.effect_type]

    @property
    def name(self) -> str:
        return self.stats['name']

    @property
    def damage_per_turn(self) -> int:
        """Damage dealt per turn, scaled by stacks if applicable."""
        base_damage = self.stats['damage_per_turn']
        if self.stats['stacking'] == 'intensity':
            return base_damage * self.stacks
        return base_damage

    @property
    def is_expired(self) -> bool:
        return self.duration <= 0


class StatusEffectManager:
    """Manages status effects for an entity."""

    def __init__(self):
        self.effects: List[StatusEffect] = []

    def apply_effect(self, effect_type: StatusEffectType, source: Optional[str] = None) -> str:
        """Apply a status effect with proper stacking rules.

        Returns a message describing what happened.
        """
        stats = STATUS_EFFECT_STATS[effect_type]
        stacking = stats['stacking']
        max_stacks = stats['max_stacks']
        base_duration = stats['duration']

        # Check if effect already exists
        existing = self.get_effect(effect_type)

        if existing:
            if stacking == 'intensity':
                # Increase stack count up to max
                if existing.stacks < max_stacks:
                    existing.stacks += 1
                    existing.duration = base_duration  # Reset duration
                    return f"{stats['name']} intensifies! (Stack {existing.stacks})"
                else:
                    existing.duration = base_duration  # Just refresh
                    return f"{stats['name']} refreshed (max stacks)"
            elif stacking == 'refresh':
                # Just refresh duration
                existing.duration = base_duration
                return f"{stats['name']} refreshed"
            else:  # 'none' - no stacking
                return f"Already affected by {stats['name']}"
        else:
            # Apply new effect
            new_effect = StatusEffect(
                effect_type=effect_type,
                duration=base_duration,
                stacks=1,
                source=source
            )
            self.effects.append(new_effect)
            return stats['message']

    def get_effect(self, effect_type: StatusEffectType) -> Optional[StatusEffect]:
        """Get an active effect by type."""
        for effect in self.effects:
            if effect.effect_type == effect_type:
                return effect
        return None

    def has_effect(self, effect_type: StatusEffectType) -> bool:
        """Check if entity has a specific effect."""
        return self.get_effect(effect_type) is not None

    def remove_effect(self, effect_type: StatusEffectType) -> bool:
        """Remove a specific effect. Returns True if removed."""
        for i, effect in enumerate(self.effects):
            if effect.effect_type == effect_type:
                self.effects.pop(i)
                return True
        return False

    def clear_all(self):
        """Remove all status effects."""
        self.effects.clear()

    def tick(self) -> List[dict]:
        """Process all effects for one turn.

        Returns a list of effect results with damage and messages.
        """
        results = []
        expired = []

        for effect in self.effects:
            result = {
                'effect_type': effect.effect_type,
                'damage': 0,
                'message': '',
                'skip_turn': False,
            }

            stats = effect.stats

            # Apply damage
            if effect.damage_per_turn > 0:
                result['damage'] = effect.damage_per_turn
                result['message'] = f"Took {effect.damage_per_turn} {effect.name.lower()} damage"

            # Check for turn skip (stun)
            if stats.get('skip_turn', False):
                result['skip_turn'] = True
                result['message'] = "Stunned and cannot act!"

            # Decrement duration
            effect.duration -= 1

            if effect.is_expired:
                expired.append(effect)
                if not result['message']:
                    result['message'] = f"{effect.name} wore off"

            results.append(result)

        # Remove expired effects
        for effect in expired:
            self.effects.remove(effect)

        return results

    def get_movement_penalty(self) -> float:
        """Get total movement penalty from effects (0.0 to 1.0)."""
        penalty = 0.0
        for effect in self.effects:
            penalty += effect.stats.get('movement_penalty', 0.0)
        return min(penalty, 1.0)  # Cap at 100% penalty

    def is_stunned(self) -> bool:
        """Check if entity is currently stunned."""
        return self.has_effect(StatusEffectType.STUN)

    def is_frozen(self) -> bool:
        """Check if entity is currently frozen."""
        return self.has_effect(StatusEffectType.FREEZE)

    def get_active_effect_names(self) -> List[str]:
        """Get list of active effect names for display."""
        return [effect.name for effect in self.effects]

    def __len__(self) -> int:
        return len(self.effects)

    def __bool__(self) -> bool:
        return len(self.effects) > 0
