"""Ghost manager for spawning and behavior.

This module contains the GhostManager class that handles ghost
spawning, placement, and per-turn behavior processing.
"""
import random
from typing import TYPE_CHECKING, Optional, List, Tuple, Set, Dict

from .types import GhostType, GHOST_ZONE_BIAS, GHOST_LIMITS, victory_legacy_to_ghost_type
from .ghost import Ghost, GhostPath

if TYPE_CHECKING:
    from ...world import Dungeon
    from ..entities import Player
    from ...story.completion import VictoryLegacyResult


class GhostManager:
    """Manages ghost spawning and behavior per floor.

    Ghosts are deterministically placed per seed+floor, with:
    - Zone-biased placement
    - Per-floor limits
    - Meaningful interactions
    """

    # Spawn configuration
    BASE_GHOST_CHANCE = 0.35  # 35% base chance per potential spawn slot
    ECHO_MEANINGFUL_RATE = 0.7  # Echo should lead somewhere useful 70%+ of time

    def __init__(self):
        self.ghosts: List[Ghost] = []
        self.floor = 0
        self.seed = 0
        self._silence_positions: Set[Tuple[int, int]] = set()
        # Anti-spam: track which message types shown this floor
        self._messages_shown: Set[GhostType] = set()
        # Champion trial system
        self._pending_trial_ghost: Optional[Ghost] = None
        self._trial_enemies: Set[int] = set()  # IDs of trial enemies

    def initialize_floor(self, floor: int, dungeon: 'Dungeon',
                         ghost_data: List[dict] = None, seed: int = None,
                         victory_legacy: 'VictoryLegacyResult' = None):
        """Initialize ghosts for a new floor.

        Args:
            floor: Current floor number
            dungeon: The dungeon instance
            ghost_data: Optional list of ghost recordings to use
            seed: Optional seed for determinism
            victory_legacy: Optional VictoryLegacyResult for derived victory imprints
        """
        self.floor = floor
        self.seed = seed if seed is not None else floor * 8888
        self.ghosts.clear()
        self._silence_positions.clear()
        self._messages_shown.clear()  # Reset per-floor message spam guard

        rng = random.Random(self.seed)

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
                ghost = self._place_ghost(ghost_type, dungeon, rng, gd)
                if ghost:
                    # Apply secondary tag if this is a victory imprint with hybrid flourish
                    if secondary_tag and gd.get('victory'):
                        ghost.secondary_tag = secondary_tag
                    self.ghosts.append(ghost)
                    spawned[ghost_type] += 1

        # If no ghost data, spawn some procedurally
        else:
            # Spawn 0-2 death ghosts
            num_death = rng.randint(0, 2)
            for _ in range(num_death):
                ghost_type = rng.choice(death_types)
                if spawned[ghost_type] < GHOST_LIMITS[ghost_type]:
                    if rng.random() < self.BASE_GHOST_CHANCE:
                        ghost = self._place_ghost(ghost_type, dungeon, rng)
                        if ghost:
                            self.ghosts.append(ghost)
                            spawned[ghost_type] += 1

            # Small chance for victory imprint (derived from legacy if available)
            if rng.random() < 0.15:  # 15% chance
                if victory_legacy:
                    ghost_type = victory_legacy_to_ghost_type(victory_legacy.primary.name)
                    secondary_tag = victory_legacy.secondary_tag
                else:
                    ghost_type = rng.choice([GhostType.BEACON, GhostType.CHAMPION, GhostType.ARCHIVIST])
                    secondary_tag = None

                ghost = self._place_ghost(ghost_type, dungeon, rng)
                if ghost:
                    ghost.secondary_tag = secondary_tag
                    self.ghosts.append(ghost)

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

    def _place_ghost(self, ghost_type: GhostType, dungeon: 'Dungeon',
                     rng: random.Random, ghost_data: dict = None) -> Optional[Ghost]:
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
                    self._silence_positions.add((pos[0] + dx, pos[1] + dy))

        return ghost

    def _generate_echo_path(self, ghost: Ghost, dungeon: 'Dungeon',
                            rng: random.Random) -> Optional[GhostPath]:
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

    def tick(self, player: 'Player', dungeon: 'Dungeon') -> List[str]:
        """Process ghost behaviors for this turn.

        Returns:
            List of messages to display
        """
        messages = []

        for ghost in self.ghosts:
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
                    if ghost.ghost_type not in self._messages_shown:
                        self._messages_shown.add(ghost.ghost_type)
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
                    if ghost.ghost_type not in self._messages_shown:
                        self._messages_shown.add(ghost.ghost_type)
                        messages.append(ghost.get_message())

            # Beacon: show guidance when near
            if ghost.ghost_type == GhostType.BEACON:
                if distance <= 4 and not ghost.triggered:
                    ghost.triggered = True
                    if ghost.ghost_type not in self._messages_shown:
                        self._messages_shown.add(ghost.ghost_type)
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
                messages.extend(self._process_champion(ghost, player, dungeon, distance))

            # Archivist: reveal lore/secrets in record zones, otherwise tiles
            if ghost.ghost_type == GhostType.ARCHIVIST:
                messages.extend(self._process_archivist(ghost, player, dungeon, distance))

        return messages

    def _process_champion(self, ghost: Ghost, player: 'Player',
                          dungeon: 'Dungeon', distance: int) -> List[str]:
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
            if ghost.ghost_type not in self._messages_shown:
                self._messages_shown.add(ghost.ghost_type)
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
            if ghost.ghost_type not in self._messages_shown:
                self._messages_shown.add(ghost.ghost_type)
                messages.append(ghost.get_message())
            messages.append("The champion offers you a trial of combat...")
            messages.append("Defeat the challenger for a reward!")
            # Mark trial as ready to spawn (actual spawn handled by game engine)
            ghost.trial_spawned = True
            self._pending_trial_ghost = ghost

        return messages

    def _process_archivist(self, ghost: Ghost, player: 'Player',
                           dungeon: 'Dungeon', distance: int) -> List[str]:
        """Process Archivist ghost behavior."""
        messages = []

        if distance <= 2 and not ghost.triggered:
            ghost.triggered = True
            if ghost.ghost_type not in self._messages_shown:
                self._messages_shown.add(ghost.ghost_type)
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

    def check_silence_debuff(self, x: int, y: int) -> Optional[str]:
        """Check if position is in a Silence zone.

        Returns:
            Debuff message if in Silence, None otherwise
        """
        if (x, y) in self._silence_positions:
            return "Something is missing here."
        return None

    def get_ghost_at(self, x: int, y: int) -> Optional[Ghost]:
        """Get ghost at position (for rendering)."""
        for ghost in self.ghosts:
            if ghost.active and ghost.x == x and ghost.y == y:
                return ghost
        return None

    def get_visible_ghosts(self, player_x: int, player_y: int,
                           view_distance: int = 8) -> List[Ghost]:
        """Get ghosts visible to player."""
        visible = []
        for ghost in self.ghosts:
            if not ghost.active:
                continue
            dist = abs(ghost.x - player_x) + abs(ghost.y - player_y)
            if dist <= view_distance:
                visible.append(ghost)
        return visible

    def spawn_hollowed_enemy(self, dungeon: 'Dungeon', entity_manager) -> bool:
        """Spawn Hollowed ghosts as actual enemies.

        Called after ghost initialization to add Hollowed to enemy list.

        Returns:
            True if any Hollowed were spawned
        """
        from ...core.constants import EnemyType
        from ..entities import Enemy

        spawned_any = False

        for ghost in self.ghosts:
            if ghost.ghost_type != GhostType.HOLLOWED:
                continue

            # Create enemy at ghost position
            enemy = Enemy(ghost.x, ghost.y, enemy_type=EnemyType.SKELETON)
            enemy.name = f"Hollowed {ghost.username[:8]}"
            enemy.is_elite = True  # Slightly tougher

            entity_manager.enemies.append(enemy)
            ghost.active = False  # Ghost converted to enemy
            spawned_any = True

        return spawned_any

    def has_pending_trial(self) -> bool:
        """Check if there's a pending champion trial to spawn."""
        return self._pending_trial_ghost is not None

    def spawn_champion_trial(self, dungeon: 'Dungeon', entity_manager) -> List[str]:
        """Spawn a champion trial enemy if one is pending.

        Creates a challenging elite enemy near the ghost position.
        Defeating it grants bonus rewards.

        Returns:
            List of messages to display
        """
        messages = []

        if not self._pending_trial_ghost:
            return messages

        ghost = self._pending_trial_ghost
        self._pending_trial_ghost = None

        from ...core.constants import EnemyType, FLOOR_ENEMY_POOLS
        from ..entities import Enemy

        # Select a challenging enemy type based on floor
        floor_pool = FLOOR_ENEMY_POOLS.get(self.floor, [])
        if floor_pool:
            # Choose the enemy with highest weight (most thematic)
            enemy_types = [(t, w) for (t, w) in floor_pool]
            enemy_types.sort(key=lambda x: x[1], reverse=True)
            trial_type = enemy_types[0][0]
        else:
            # Fallback to skeleton
            trial_type = EnemyType.SKELETON

        # Find spawn position near ghost (within 3 tiles)
        spawn_pos = None
        for dx in range(-3, 4):
            for dy in range(-3, 4):
                nx, ny = ghost.x + dx, ghost.y + dy
                if dungeon.is_walkable(nx, ny):
                    # Check not occupied by entity
                    occupied = False
                    for enemy in entity_manager.enemies:
                        if enemy.is_alive() and enemy.x == nx and enemy.y == ny:
                            occupied = True
                            break
                    if not occupied:
                        spawn_pos = (nx, ny)
                        break
            if spawn_pos:
                break

        if not spawn_pos:
            messages.append("The trial fades... no space for combat.")
            ghost.trial_completed = True  # Skip trial, no reward
            return messages

        # Create elite trial enemy
        trial_enemy = Enemy(spawn_pos[0], spawn_pos[1], enemy_type=trial_type, is_elite=True)
        trial_enemy.name = "Champion's Challenger"
        trial_enemy.xp_reward = int(trial_enemy.xp_reward * 1.5)  # Bonus XP

        # Track the trial enemy by its id
        trial_id = id(trial_enemy)
        ghost.trial_enemy_id = trial_id
        self._trial_enemies.add(trial_id)

        entity_manager.enemies.append(trial_enemy)
        messages.append(f"A {trial_enemy.name} materializes!")

        return messages

    def check_trial_completion(self, entity_manager, player: 'Player') -> List[str]:
        """Check if any champion trials have been completed.

        Called after combat to check if trial enemies were defeated.

        Returns:
            List of messages to display (including reward messages)
        """
        messages = []

        for ghost in self.ghosts:
            if ghost.ghost_type != GhostType.CHAMPION:
                continue
            if not ghost.trial_spawned or ghost.trial_completed:
                continue
            if ghost.trial_enemy_id is None:
                continue

            # Check if trial enemy is still alive
            trial_alive = False
            for enemy in entity_manager.enemies:
                if id(enemy) == ghost.trial_enemy_id and enemy.is_alive():
                    trial_alive = True
                    break

            if not trial_alive:
                # Trial completed! Grant reward
                ghost.trial_completed = True
                self._trial_enemies.discard(ghost.trial_enemy_id)

                messages.append("You have proven yourself worthy!")
                messages.append("The champion's blessing strengthens you!")

                # Rewards: +5 HP (can exceed max), +10% damage for remainder of floor
                player.health = min(player.health + 5, player.max_health + 5)
                messages.append("  +5 HP restored!")

                # Mark player with temporary damage buff (handled by combat system)
                if not hasattr(player, 'champion_blessing'):
                    player.champion_blessing = 0
                player.champion_blessing = 3  # 3 combats with bonus damage

                messages.append("  Champion's Blessing: +20% damage for next 3 combats!")

        return messages

    def is_trial_enemy(self, enemy) -> bool:
        """Check if an enemy is a champion trial enemy."""
        return id(enemy) in self._trial_enemies

    def get_state(self) -> dict:
        """Get serializable state."""
        return {
            'floor': self.floor,
            'seed': self.seed,
            'ghosts': [
                {
                    'ghost_type': g.ghost_type.name,
                    'x': g.x,
                    'y': g.y,
                    'zone_id': g.zone_id,
                    'username': g.username,
                    'victory': g.victory,
                    'encountered': g.encountered,
                    'triggered': g.triggered,
                    'active': g.active,
                    'assist_used': g.assist_used,
                    'trial_spawned': g.trial_spawned,
                    'trial_completed': g.trial_completed,
                    'secondary_tag': g.secondary_tag,
                    'secondary_used': g.secondary_used,
                    'path_positions': g.path.positions if g.path else None,
                    'path_index': g.path.current_index if g.path else 0,
                    'path_dest': g.path.destination_type if g.path else None,
                }
                for g in self.ghosts
            ],
            'silence_positions': list(self._silence_positions),
            'messages_shown': [gt.name for gt in self._messages_shown],
        }

    def load_state(self, state: dict):
        """Load state from save data."""
        self.floor = state.get('floor', 0)
        self.seed = state.get('seed', 0)
        self._silence_positions = set(
            tuple(p) for p in state.get('silence_positions', [])
        )
        self._messages_shown = set(
            GhostType[name] for name in state.get('messages_shown', [])
        )

        self.ghosts = []
        self._pending_trial_ghost = None
        self._trial_enemies.clear()

        for g_data in state.get('ghosts', []):
            ghost = Ghost(
                ghost_type=GhostType[g_data['ghost_type']],
                x=g_data['x'],
                y=g_data['y'],
                zone_id=g_data.get('zone_id', ''),
                username=g_data.get('username', 'Unknown'),
                victory=g_data.get('victory', False),
                encountered=g_data.get('encountered', False),
                triggered=g_data.get('triggered', False),
                active=g_data.get('active', True),
                assist_used=g_data.get('assist_used', False),
                trial_spawned=g_data.get('trial_spawned', False),
                trial_completed=g_data.get('trial_completed', False),
                secondary_tag=g_data.get('secondary_tag'),
                secondary_used=g_data.get('secondary_used', False),
            )

            # Restore path for Echo
            if g_data.get('path_positions'):
                ghost.path = GhostPath(
                    positions=[tuple(p) for p in g_data['path_positions']],
                    current_index=g_data.get('path_index', 0),
                    destination_type=g_data.get('path_dest', 'lore'),
                )

            self.ghosts.append(ghost)

    def clear(self):
        """Clear ghost state for new floor."""
        self.ghosts.clear()
        self._silence_positions.clear()
        self._messages_shown.clear()
        self._pending_trial_ghost = None
        self._trial_enemies.clear()
