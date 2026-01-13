"""Round processing for tactical battles.

Handles:
- Status effect ticks (DOT, debuffs)
- Cooldown management
- Tile hazard effects
"""
from typing import TYPE_CHECKING

from .battle_types import BattleState, BattleEntity
from ..core.events import EventType

if TYPE_CHECKING:
    from ..core.engine import GameEngine
    from ..core.events import EventQueue


class RoundProcessor:
    """Processes end-of-round effects in tactical battles."""

    def __init__(self, engine: 'GameEngine', events: 'EventQueue' = None):
        self.engine = engine
        self.events = events

    def get_pulse_amplification(self) -> float:
        """Get current field pulse amplification (v6.0.5)."""
        if hasattr(self.engine, 'field_pulse_manager') and self.engine.field_pulse_manager:
            return self.engine.field_pulse_manager.get_current_amplification()
        return 1.0

    def tick_status_effects(self, entity: BattleEntity) -> None:
        """Process status effect ticks for an entity."""
        if entity is None or entity.hp <= 0:
            return

        remaining_effects = []

        for effect_dict in entity.status_effects:
            # Apply DOT
            dot = effect_dict.get('damage_per_tick', 0)
            if dot > 0:
                entity.hp -= dot
                if self.events:
                    self.events.emit(
                        EventType.DAMAGE_NUMBER,
                        x=entity.arena_x,
                        y=entity.arena_y,
                        amount=dot
                    )

                name = effect_dict.get('name', 'effect')
                if entity.is_player:
                    self.engine.add_message(f"You take {dot} {name} damage!")

            # Decrement duration
            effect_dict['duration'] = effect_dict.get('duration', 1) - 1

            if effect_dict['duration'] > 0:
                remaining_effects.append(effect_dict)
            else:
                name = effect_dict.get('name', 'effect')
                if entity.is_player:
                    self.engine.add_message(f"{name.title()} wore off.")

        entity.status_effects = remaining_effects

        # Check death from DOT
        if entity.hp <= 0:
            if entity.is_player:
                self.engine.add_message("You have fallen in battle!")
            else:
                self.engine.add_message("Enemy defeated!")

                if self.events:
                    self.events.emit(
                        EventType.DEATH_FLASH,
                        x=entity.arena_x,
                        y=entity.arena_y
                    )

    def tick_cooldowns(self, entity: BattleEntity) -> None:
        """Decrement ability cooldowns for an entity."""
        if entity is None:
            return

        to_remove = []
        for ability_name, turns in entity.cooldowns.items():
            entity.cooldowns[ability_name] = max(0, turns - 1)
            if entity.cooldowns[ability_name] == 0:
                to_remove.append(ability_name)

        for name in to_remove:
            del entity.cooldowns[name]

    def check_tile_hazards(self, entity: BattleEntity, x: int, y: int) -> None:
        """Check for hazards at tile and apply on-step effects.

        Uses project-canon hazard glyphs:
        - '~' = Lava (immediate damage + BURN DOT)
        - '=' = Ice (FREEZE movement penalty)
        - '~' = Deep Water (FREEZE movement penalty)
        - '!' = Poison Gas (POISON DOT)
        """
        battle = self.engine.battle
        if battle is None:
            return

        tile = battle.arena_tiles[y][x]

        # Lava (~): immediate damage + burn DOT (v6.0.5: pulse amplifies)
        if tile == '~':
            pulse_amp = self.get_pulse_amplification()
            damage = int(5 * pulse_amp)
            burn_dot = int(3 * pulse_amp)
            entity.hp -= damage
            entity.add_status({
                'name': 'burn',
                'duration': 2,
                'damage_per_tick': burn_dot,
            })
            if entity.is_player:
                self.engine.add_message(f"The lava burns! (-{damage} HP)")

            if self.events:
                self.events.emit(
                    EventType.DAMAGE_NUMBER,
                    x=x, y=y,
                    amount=damage
                )

        # Ice (=): FREEZE movement penalty (slide deferred)
        elif tile == '=':
            entity.add_status({
                'name': 'freeze',
                'duration': 2,
                'speed_mod': 0.5,
            })
            if entity.is_player:
                self.engine.add_message("The ice freezes your movement! (Slowed)")

        # Deep Water: FREEZE movement penalty (using different check)
        elif tile == '\u2248':  # '≈' unicode
            entity.add_status({
                'name': 'freeze',
                'duration': 2,
                'speed_mod': 0.5,
            })
            if entity.is_player:
                self.engine.add_message("You wade through deep water. (Slowed)")

        # Poison Gas (!): POISON DOT (v6.0.5: pulse amplifies)
        elif tile == '!':
            pulse_amp = self.get_pulse_amplification()
            poison_dot = int(2 * pulse_amp)
            entity.add_status({
                'name': 'poison',
                'duration': 3,
                'damage_per_tick': poison_dot,
            })
            if entity.is_player:
                self.engine.add_message("You inhale poison gas!")
