"""Environment processing mixin for GameEngine.

Handles traps, hazards, ice sliding, status effects, field pulses,
and zone evidence discovery.

Integrates D&D-style saving throws for traps (v6.10).
"""

from .messages import MessageCategory, MessageImportance
from .events import EventType


class EnvironmentMixin:
    """Mixin providing environment processing methods for GameEngine."""

    def _process_traps(self):
        """Process traps at player's current position.

        Uses D&D-style DEX saving throws when player has ability scores.
        Emits DICE_ROLL events for frontend dice visualization.
        """
        if not self.player:
            return

        # Get trap at position first to get its name
        trap = self.trap_manager.get_trap_at(self.player.x, self.player.y)
        if not trap or not trap.is_active:
            return

        result = trap.trigger(self.player)
        if result:
            # Emit DICE_ROLL event for saving throw if one was made
            saving_throw = result.get('saving_throw')
            if saving_throw and hasattr(self, 'event_queue') and self.event_queue:
                self.event_queue.emit(
                    EventType.DICE_ROLL,
                    roll_type='saving_throw',
                    dice_notation='1d20',
                    rolls=[saving_throw.d20_roll],
                    modifier=saving_throw.ability_mod,
                    total=saving_throw.total,
                    target_dc=saving_throw.dc,
                    is_success=saving_throw.success,
                    is_natural_20=saving_throw.is_natural_20,
                    is_natural_1=saving_throw.is_natural_1,
                    luck_applied=saving_throw.luck_applied,
                    ability=saving_throw.ability,
                    source=trap.name
                )

            if result.get('message'):
                self.add_message(result['message'])

            # Track damage for death recap
            if result.get('damage', 0) > 0:
                trap_name = trap.name if trap and hasattr(trap, 'name') and trap.name else "trap"
                self.last_attacker_name = f"a {trap_name}"
                self.last_damage_taken = result['damage']

        # Tick all trap cooldowns
        self.trap_manager.tick_all()

    def _process_hazards(self) -> bool:
        """Process hazards at player's current position.

        Returns:
            True if player is on slow terrain (deep water), False otherwise.
        """
        if not self.player:
            return False

        result = self.hazard_manager.process_entity_at(
            self.player, self.player.x, self.player.y
        )
        if result:
            if result.get('message'):
                self.add_message(result['message'])

            # Handle drowning
            if result.get('drown'):
                self.last_attacker_name = "deep water"
                self.last_damage_taken = self.player.health
                self.player.health = 0
            elif result.get('damage', 0) > 0:
                self.last_attacker_name = "environmental hazard"
                self.last_damage_taken = result['damage']

        # Check if on slow terrain (deep water costs 2 turns)
        move_cost = self.hazard_manager.get_movement_cost(
            self.player.x, self.player.y
        )
        if move_cost > 1:
            self.add_message("You wade through deep water...")
            return True
        return False

    def _process_ice_slide(self, dx: int, dy: int):
        """Handle ice slide mechanic when player steps on ice.

        v6.5.1 low-01: When stepping onto ice, player slides in
        their movement direction until hitting a wall, non-ice tile,
        or enemy.

        Args:
            dx, dy: The movement direction that brought player here
        """
        if not self.player or not self.dungeon:
            return

        # Check if standing on ice that causes sliding
        if not self.hazard_manager.is_ice_at(self.player.x, self.player.y):
            return

        hazard = self.hazard_manager.get_hazard_at(self.player.x, self.player.y)
        if not hazard or not hazard.stats.get('causes_slide', False):
            return

        # No slide if no movement direction
        if dx == 0 and dy == 0:
            return

        slide_count = 0
        max_slides = 20  # Safety limit to prevent infinite loops

        self.add_message("You slide across the ice!")

        while slide_count < max_slides:
            next_x = self.player.x + dx
            next_y = self.player.y + dy

            # Check if next tile is walkable
            if not self.dungeon.is_walkable(next_x, next_y):
                # Hit a wall - stop sliding
                self.add_message("You slam into the wall!")
                break

            # Check for enemy at next position
            enemy = self.entity_manager.get_enemy_at(next_x, next_y)
            if enemy:
                # Collide with enemy - stop sliding, deal minor damage to both
                self.add_message(f"You crash into the {enemy.name}!")
                # Small collision damage
                collision_damage = 2
                enemy.health -= collision_damage
                self.player.health -= collision_damage
                self.last_attacker_name = "ice collision"
                self.last_damage_taken = collision_damage
                break

            # Move to next position
            self.player.x = next_x
            self.player.y = next_y
            slide_count += 1

            # Update FOV after each slide step
            self.dungeon.update_fov(self.player.x, self.player.y)

            # Check if still on ice
            if not self.hazard_manager.is_ice_at(self.player.x, self.player.y):
                # Reached non-ice tile - stop sliding
                self.add_message("You regain your footing.")
                break

            # Process traps at each slide position
            self._process_traps()

            # Check for items
            self.entity_manager.check_item_pickup(self.player)

        if slide_count >= max_slides:
            # Safety: shouldn't happen with properly designed maps
            self.add_message("You finally stop sliding.")

    def _process_player_status_effects(self):
        """Process player's active status effects."""
        if not self.player:
            return

        effect_results = self.player.process_status_effects()
        for result in effect_results:
            if result.get('message'):
                self.add_message(result['message'])

            if result.get('damage', 0) > 0:
                self.last_attacker_name = result.get('source', 'status effect')
                self.last_damage_taken = result['damage']

    def _process_field_pulse(self):
        """Process field pulse events on this turn.

        Field pulses are seeded environmental events that temporarily
        amplify zone behaviors. When a pulse triggers, it shows a
        narrative message and applies amplification effects.

        Micro-events trigger once per floor during the first pulse,
        providing narrative moments and safe beneficial effects.
        """
        from .events import EventType

        pulse = self.field_pulse_manager.tick()

        if pulse:
            # Show pulse message
            message = self.field_pulse_manager.get_pulse_message(pulse)
            self.add_message(message, MessageCategory.SYSTEM, MessageImportance.IMPORTANT)

            # Emit visual event for frontend
            self.event_queue.emit(
                EventType.FIELD_PULSE,
                intensity=pulse.intensity.name.lower(),
                amplification=pulse.amplification,
                duration=pulse.duration,
            )

            # Find which pulse index this is
            pulse_index = -1
            for i, p in enumerate(self.field_pulse_manager.pulses):
                if p is pulse:
                    pulse_index = i
                    break

            # Check for micro-event trigger
            if self.field_pulse_manager.should_trigger_micro_event(pulse_index):
                self.field_pulse_manager.trigger_micro_event(self)

        # Update hazard amplification based on current pulse state
        current_amp = self.field_pulse_manager.get_current_amplification()
        self.hazard_manager.set_amplification(current_amp)

    def _process_zone_evidence(self):
        """Check if player stepped on zone evidence and trigger lore discovery.

        Zone evidence tiles (boss trail tells, lore markers, evidence props) are
        visual indicators placed in rooms. When the player walks onto one, they
        discover evidence lore specific to that floor.
        """
        if not self.dungeon or not self.player:
            return

        px, py = self.player.x, self.player.y

        # Check if player is on any zone evidence tile
        evidence_at_pos = None
        evidence_index = None
        for i, (ex, ey, char, color, evidence_type) in enumerate(self.dungeon.zone_evidence):
            if ex == px and ey == py:
                evidence_at_pos = (ex, ey, char, color, evidence_type)
                evidence_index = i
                break

        if not evidence_at_pos:
            return

        _, _, char, _, evidence_type = evidence_at_pos

        # Always remove evidence when stepped on (one-time interaction)
        if evidence_index is not None:
            self.dungeon.zone_evidence.pop(evidence_index)

        # Get evidence-specific lore IDs for current floor
        from ..story.lore_items import get_evidence_ids_for_floor
        evidence_lore_ids = get_evidence_ids_for_floor(self.current_level)

        if not evidence_lore_ids:
            return

        # Find first undiscovered evidence lore for this floor
        lore_to_discover = None
        for lore_id in evidence_lore_ids:
            if not self.story_manager.has_discovered_lore(lore_id):
                lore_to_discover = lore_id
                break

        # Discover lore if any undiscovered for this floor
        if lore_to_discover:
            if self.story_manager.discover_lore(lore_to_discover):
                # Get the lore title for the message
                from ..story.story_data import LORE_ENTRIES
                lore_entry = LORE_ENTRIES.get(lore_to_discover, {})
                lore_title = lore_entry.get('title', 'something')

                # Show discovery message based on evidence type
                if evidence_type == "trail_tell":
                    self.add_message(
                        f"You notice signs of passage... (discovered: {lore_title})",
                        MessageCategory.SYSTEM, MessageImportance.IMPORTANT
                    )
                elif evidence_type == "lore_marker":
                    self.add_message(
                        f"You examine ancient markings... (discovered: {lore_title})",
                        MessageCategory.SYSTEM, MessageImportance.IMPORTANT
                    )
                else:  # evidence_prop
                    self.add_message(
                        f"You find evidence of the past... (discovered: {lore_title})",
                        MessageCategory.SYSTEM, MessageImportance.IMPORTANT
                    )
