"""Ghost spawning and placement logic.

Handles ghost placement during floor initialization,
zone-biased selection, and Echo path generation.
"""
import random
from typing import TYPE_CHECKING, Optional, List, Tuple, Dict

from .types import GhostType, GHOST_ZONE_BIAS, GHOST_LIMITS, victory_legacy_to_ghost_type
from .ghost import Ghost, GhostPath

if TYPE_CHECKING:
    from ...world import Dungeon
    from ...story.completion import VictoryLegacyResult


class GhostSpawner:
    """Handles ghost spawning and placement."""

    # Spawn configuration
    BASE_GHOST_CHANCE = 0.35  # 35% base chance per potential spawn slot
    ECHO_MEANINGFUL_RATE = 0.7  # Echo should lead somewhere useful 70%+ of time

    def initialize_floor(
        self,
        floor: int,
        dungeon: 'Dungeon',
        ghost_data: List[dict] = None,
        seed: int = None,
        victory_legacy: 'VictoryLegacyResult' = None
    ) -> Tuple[List[Ghost], set]:
        """Initialize ghosts for a new floor.

        Args:
            floor: Current floor number
            dungeon: The dungeon instance
            ghost_data: Optional list of ghost recordings to use
            seed: Optional seed for determinism
            victory_legacy: Optional VictoryLegacyResult for derived victory imprints

        Returns:
            Tuple of (ghosts list, silence_positions set)
        """
        actual_seed = seed if seed is not None else floor * 8888
        rng = random.Random(actual_seed)

        ghosts: List[Ghost] = []
        silence_positions: set = set()

        # Determine which ghost types to spawn
        death_types = [GhostType.ECHO, GhostType.HOLLOWED, GhostType.SILENCE]

        # Track spawned counts
        spawned: Dict[GhostType, int] = {gt: 0 for gt in GhostType}

        # Process ghost data if available
        if ghost_data:
            for gd in ghost_data:
                if gd.get('victory'):
                    # Victory ghost -> imprint (use derived legacy if available)
                    if victory_legacy:
                        ghost_type = victory_legacy_to_ghost_type(victory_legacy.primary.name)
                        secondary_tag = victory_legacy.secondary_tag
                    else:
                        # Fallback: random (legacy behavior)
                        ghost_type = rng.choice([GhostType.BEACON, GhostType.CHAMPION, GhostType.ARCHIVIST])
                        secondary_tag = None
                else:
                    # Death ghost -> residue
                    ghost_type = self._select_death_type(rng, gd)
                    secondary_tag = None

                # Check limits
                if spawned[ghost_type] >= GHOST_LIMITS[ghost_type]:
                    continue

                # Try to place
                ghost = self._place_ghost(ghost_type, dungeon, rng, silence_positions, gd)
                if ghost:
                    # Apply secondary tag if this is a victory imprint with hybrid flourish
                    if secondary_tag and gd.get('victory'):
                        ghost.secondary_tag = secondary_tag
                    ghosts.append(ghost)
                    spawned[ghost_type] += 1

        # If no ghost data, spawn some procedurally
        else:
            # Spawn 0-2 death ghosts
            num_death = rng.randint(0, 2)
            for _ in range(num_death):
                ghost_type = rng.choice(death_types)
                if spawned[ghost_type] < GHOST_LIMITS[ghost_type]:
                    if rng.random() < self.BASE_GHOST_CHANCE:
                        ghost = self._place_ghost(ghost_type, dungeon, rng, silence_positions)
                        if ghost:
                            ghosts.append(ghost)
                            spawned[ghost_type] += 1

            # Small chance for victory imprint (derived from legacy if available)
            if rng.random() < 0.15:  # 15% chance
                if victory_legacy:
                    ghost_type = victory_legacy_to_ghost_type(victory_legacy.primary.name)
                    secondary_tag = victory_legacy.secondary_tag
                else:
                    ghost_type = rng.choice([GhostType.BEACON, GhostType.CHAMPION, GhostType.ARCHIVIST])
                    secondary_tag = None

                ghost = self._place_ghost(ghost_type, dungeon, rng, silence_positions)
                if ghost:
                    ghost.secondary_tag = secondary_tag
                    ghosts.append(ghost)

        return ghosts, silence_positions

    def _select_death_type(self, rng: random.Random, ghost_data: dict) -> GhostType:
        """Select death ghost type based on cause of death."""
        cause = ghost_data.get('cause_of_death', '')
        killed_by = ghost_data.get('killed_by', '')

        # Map causes to types
        if 'hazard' in cause.lower() or 'lava' in cause.lower() or 'poison' in cause.lower():
            # Died to environment -> Silence
            return GhostType.SILENCE
        elif killed_by:
            # Killed by enemy -> Hollowed
            return GhostType.HOLLOWED
        else:
            # Default -> Echo
            return GhostType.ECHO

    def _place_ghost(
        self,
        ghost_type: GhostType,
        dungeon: 'Dungeon',
        rng: random.Random,
        silence_positions: set,
        ghost_data: dict = None
    ) -> Optional[Ghost]:
        """Place a ghost of the given type in an appropriate zone.

        Returns:
            Ghost if placed successfully, None otherwise
        """
        bias_zones = GHOST_ZONE_BIAS.get(ghost_type, [])

        # Find valid rooms
        valid_rooms = []
        for room in dungeon.rooms:
            zone = getattr(room, 'zone', 'generic')

            # Check zone bias
            if zone in bias_zones:
                weight = 3.0  # Strong preference
            else:
                weight = 0.5  # Low weight for non-biased

            valid_rooms.append((room, zone, weight))

        if not valid_rooms:
            return None

        # Weighted selection
        total_weight = sum(w for _, _, w in valid_rooms)
        r = rng.random() * total_weight
        cumulative = 0
        selected_room = None
        selected_zone = "generic"

        for room, zone, weight in valid_rooms:
            cumulative += weight
            if r < cumulative:
                selected_room = room
                selected_zone = zone
                break

        if not selected_room:
            selected_room, selected_zone, _ = valid_rooms[0]

        # Find valid position in room
        positions = []
        for x in range(selected_room.x + 1, selected_room.x + selected_room.width - 1):
            for y in range(selected_room.y + 1, selected_room.y + selected_room.height - 1):
                if dungeon.is_walkable(x, y):
                    # Silence: must not be on stairs
                    if ghost_type == GhostType.SILENCE:
                        if (x, y) == dungeon.stairs_down_pos:
                            continue
                        if (x, y) == dungeon.stairs_up_pos:
                            continue
                    positions.append((x, y))

        if not positions:
            return None

        pos = rng.choice(positions)

        # Create ghost
        ghost = Ghost(
            ghost_type=ghost_type,
            x=pos[0],
            y=pos[1],
            zone_id=selected_zone,
            username=ghost_data.get('username', 'Unknown') if ghost_data else 'Delver',
            victory=ghost_data.get('victory', False) if ghost_data else False,
        )

        # Echo: generate meaningful path
        if ghost_type == GhostType.ECHO:
            path = self._generate_echo_path(ghost, dungeon, rng)
            if path:
                ghost.path = path
            else:
                return None  # Don't spawn Echo without meaningful path

        # Silence: track positions for debuff area
        if ghost_type == GhostType.SILENCE:
            for dx in range(-ghost.radius, ghost.radius + 1):
                for dy in range(-ghost.radius, ghost.radius + 1):
                    silence_positions.add((pos[0] + dx, pos[1] + dy))

        return ghost

    def _generate_echo_path(
        self,
        ghost: Ghost,
        dungeon: 'Dungeon',
        rng: random.Random
    ) -> Optional[GhostPath]:
        """Generate a meaningful path for an Echo ghost.

        The path should lead to:
        - A lore zone (record_vaults, seal_drifts, catalog_chambers)
        - A safe route through hazards
        - A secret door location
        """
        start = (ghost.x, ghost.y)
        path_positions = [start]
        destination_type = "lore"

        # Find potential destinations
        destinations = []

        # Lore zones
        lore_zones = ['record_vaults', 'seal_drifts', 'catalog_chambers',
                      'seal_chambers', 'indexing_heart']
        for room in dungeon.rooms:
            zone = getattr(room, 'zone', '')
            if zone in lore_zones and zone != ghost.zone_id:
                center = room.center()
                if dungeon.is_walkable(center[0], center[1]):
                    destinations.append((center, "lore"))

        # Stairs (safe route)
        if dungeon.stairs_down_pos:
            destinations.append((dungeon.stairs_down_pos, "safe_path"))

        if not destinations:
            return None

        # Choose destination
        dest, dest_type = rng.choice(destinations)
        destination_type = dest_type

        # Generate path (simple line with some jitter)
        current = start
        max_steps = rng.randint(8, 20)

        for _ in range(max_steps):
            # Move toward destination
            dx = 1 if dest[0] > current[0] else (-1 if dest[0] < current[0] else 0)
            dy = 1 if dest[1] > current[1] else (-1 if dest[1] < current[1] else 0)

            # Add some jitter
            if rng.random() < 0.3:
                dx = rng.choice([-1, 0, 1])
            if rng.random() < 0.3:
                dy = rng.choice([-1, 0, 1])

            new_x = current[0] + dx
            new_y = current[1] + dy

            if dungeon.is_walkable(new_x, new_y):
                current = (new_x, new_y)
                if current not in path_positions:
                    path_positions.append(current)

            # Reached destination?
            if abs(current[0] - dest[0]) <= 2 and abs(current[1] - dest[1]) <= 2:
                break

        if len(path_positions) < 4:
            return None

        return GhostPath(
            positions=path_positions,
            destination_type=destination_type,
        )
