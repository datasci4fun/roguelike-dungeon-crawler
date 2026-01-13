"""Ghost behavior processing per turn.

Handles per-tick ghost behaviors including Echo movement,
Beacon guidance, Champion assists, and Archivist reveals.
"""
from typing import TYPE_CHECKING, List, Set

from .types import GhostType
from .ghost import Ghost

if TYPE_CHECKING:
    from ...world import Dungeon
    from ..entities import Player


class GhostBehaviorProcessor:
    """Processes ghost behaviors each turn."""

    def tick(
        self,
        ghosts: List[Ghost],
        player: 'Player',
        dungeon: 'Dungeon',
        messages_shown: Set[GhostType],
        pending_trial_callback
    ) -> List[str]:
        """Process ghost behaviors for this turn.

        Args:
            ghosts: List of ghosts to process
            player: The player entity
            dungeon: The dungeon instance
            messages_shown: Set of ghost types already shown (for anti-spam)
            pending_trial_callback: Callback to set pending trial ghost

        Returns:
            List of messages to display
        """
        messages = []

        for ghost in ghosts:
            if not ghost.active:
                continue

            # Check for player encounter
            distance = abs(ghost.x - player.x) + abs(ghost.y - player.y)

            # Echo: advance path loop
            if ghost.ghost_type == GhostType.ECHO and ghost.path:
                ghost.path.advance()
                new_pos = ghost.path.get_current_position()
                ghost.x, ghost.y = new_pos

                # First encounter (anti-spam: once per type per floor)
                if distance <= 3 and not ghost.encountered:
                    ghost.encountered = True
                    if ghost.ghost_type not in messages_shown:
                        messages_shown.add(ghost.ghost_type)
                        messages.append(ghost.get_message())
                        # Hint at destination type
                        if ghost.path.destination_type == 'lore':
                            messages.append("It seems to lead somewhere significant...")
                        elif ghost.path.destination_type == 'safe_path':
                            messages.append("It traces a safe route forward...")

            # Hollowed: handled by enemy system (spawned as enemy)

            # Silence: show message when entering zone
            if ghost.ghost_type == GhostType.SILENCE:
                if distance <= ghost.radius and not ghost.encountered:
                    ghost.encountered = True
                    if ghost.ghost_type not in messages_shown:
                        messages_shown.add(ghost.ghost_type)
                        messages.append(ghost.get_message())

            # Beacon: show guidance when near
            if ghost.ghost_type == GhostType.BEACON:
                if distance <= 4 and not ghost.triggered:
                    ghost.triggered = True
                    if ghost.ghost_type not in messages_shown:
                        messages_shown.add(ghost.ghost_type)
                        messages.append(ghost.get_message())
                    # Point toward stairs
                    if dungeon.stairs_down_pos:
                        sx, sy = dungeon.stairs_down_pos
                        dx = "east" if sx > player.x else "west" if sx < player.x else ""
                        dy = "south" if sy > player.y else "north" if sy < player.y else ""
                        if dx or dy:
                            direction = f"{dy} {dx}".strip()
                            messages.append(f"The light pulses toward the {direction}...")

            # Champion: assist when health low, OR offer combat trial
            if ghost.ghost_type == GhostType.CHAMPION:
                messages.extend(self._process_champion(
                    ghost, player, dungeon, distance, messages_shown, pending_trial_callback
                ))

            # Archivist: reveal lore/secrets in record zones, otherwise tiles
            if ghost.ghost_type == GhostType.ARCHIVIST:
                messages.extend(self._process_archivist(
                    ghost, player, dungeon, distance, messages_shown
                ))

        return messages

    def _process_champion(
        self,
        ghost: Ghost,
        player: 'Player',
        dungeon: 'Dungeon',
        distance: int,
        messages_shown: Set[GhostType],
        pending_trial_callback
    ) -> List[str]:
        """Process Champion ghost behavior."""
        messages = []

        # Priority 1: HP assist when health is critical or near boss
        should_assist = False
        if player.health < player.max_health * 0.3:
            should_assist = True
        if ghost.zone_id == 'boss_approach' and distance <= 3:
            should_assist = True

        if should_assist and not ghost.assist_used and distance <= 5:
            ghost.assist_used = True
            ghost.triggered = True
            if ghost.ghost_type not in messages_shown:
                messages_shown.add(ghost.ghost_type)
                messages.append(ghost.get_message())
            # Visual cue + buff
            messages.append("A surge of strength flows through you! (+3 HP)")
            player.health = min(player.health + 3, player.max_health + 3)

            # Secondary flourish: archivist_mark reveals nearby tiles
            if ghost.secondary_tag == "archivist_mark" and not ghost.secondary_used:
                ghost.secondary_used = True
                messages.append("An archivist's mark lingers in your wake.")
                for dx in range(-3, 4):
                    for dy in range(-3, 4):
                        rx, ry = player.x + dx, player.y + dy
                        if 0 <= rx < dungeon.width and 0 <= ry < dungeon.height:
                            dungeon.explored[ry][rx] = True

        # Priority 2: Combat trial when healthy and near ghost
        elif distance <= 2 and not ghost.trial_spawned and not ghost.triggered:
            # Player is healthy enough for a trial
            ghost.triggered = True
            if ghost.ghost_type not in messages_shown:
                messages_shown.add(ghost.ghost_type)
                messages.append(ghost.get_message())
            messages.append("The champion offers you a trial of combat...")
            messages.append("Defeat the challenger for a reward!")
            # Mark trial as ready to spawn (actual spawn handled by game engine)
            ghost.trial_spawned = True
            pending_trial_callback(ghost)

        return messages

    def _process_archivist(
        self,
        ghost: Ghost,
        player: 'Player',
        dungeon: 'Dungeon',
        distance: int,
        messages_shown: Set[GhostType]
    ) -> List[str]:
        """Process Archivist ghost behavior."""
        messages = []

        if distance <= 2 and not ghost.triggered:
            ghost.triggered = True
            if ghost.ghost_type not in messages_shown:
                messages_shown.add(ghost.ghost_type)
                messages.append(ghost.get_message())

            # In record/lore zones, reveal more specifically
            lore_zones = ['record_vaults', 'catalog_chambers', 'seal_chambers',
                          'seal_drifts', 'indexing_heart']
            if ghost.zone_id in lore_zones:
                messages.append("Ancient records shimmer into view...")
            else:
                messages.append("Hidden knowledge reveals itself...")

            # Reveal nearby tiles (larger radius in lore zones)
            reveal_radius = 6 if ghost.zone_id in lore_zones else 4
            for dx in range(-reveal_radius, reveal_radius + 1):
                for dy in range(-reveal_radius, reveal_radius + 1):
                    rx, ry = player.x + dx, player.y + dy
                    if 0 <= rx < dungeon.width and 0 <= ry < dungeon.height:
                        dungeon.explored[ry][rx] = True

            # Secondary flourish: champion_edge grants +2 temp HP
            if ghost.secondary_tag == "champion_edge" and not ghost.secondary_used:
                ghost.secondary_used = True
                messages.append("A champion's edge remains.")
                player.health = min(player.health + 2, player.max_health + 2)

        return messages
