"""Reinforcement system for tactical battles (v6.0.3).

Handles:
- Snapshotting nearby enemies at battle start
- Calculating arrival times based on distance
- Spawning reinforcements during battle
- Pulse amplification effects on timing
"""
import random
from typing import TYPE_CHECKING, Optional, Tuple, List, Dict

from .battle_types import BattleState, BattleEntity, PendingReinforcement
from .battle_actions import manhattan_distance

if TYPE_CHECKING:
    from ..core.engine import GameEngine
    from ..core.events import EventQueue


# Reinforcement cap by encounter size (v6.0.3)
# solo=1 enemy, small=2-3, medium=4-5, boss=boss encounter
REINFORCEMENT_CAPS = {
    'solo': 1,
    'small': 2,
    'medium': 3,
    'boss': 4,
}

# Minimum turns before reinforcement arrives (never turn 0)
MIN_ARRIVAL_TURNS = 2

# Base distance factor for arrival time calculation
DISTANCE_TO_TURNS_FACTOR = 0.5  # turns = distance * factor + MIN_ARRIVAL_TURNS

# Detection radius for nearby enemies (Manhattan distance)
REINFORCEMENT_DETECTION_RADIUS = 8

# Noise weights for actions (affects reinforcement countdown in future)
NOISE_WEIGHTS = {
    'attack': 1.0,
    'move': 0.2,
    'spell': 1.5,
    'item': 0.3,
}


class ReinforcementManager:
    """Manages reinforcement spawning during battles."""

    def __init__(self, engine: 'GameEngine', events: 'EventQueue' = None):
        self.engine = engine
        self.events = events

    def get_pulse_amplification(self) -> float:
        """Get current field pulse amplification (v6.0.5).

        Returns amplification multiplier from active field pulse.
        Returns 1.0 if no pulse is active or pulse manager unavailable.
        """
        if hasattr(self.engine, 'field_pulse_manager') and self.engine.field_pulse_manager:
            return self.engine.field_pulse_manager.get_current_amplification()
        return 1.0

    def is_pulse_active(self) -> bool:
        """Check if a field pulse is currently active (v6.0.5)."""
        if hasattr(self.engine, 'field_pulse_manager') and self.engine.field_pulse_manager:
            return self.engine.field_pulse_manager.is_pulse_active()
        return False

    def get_reinforcement_cap(self, enemy_count: int, is_boss: bool) -> int:
        """
        Get the reinforcement cap based on encounter size.

        Args:
            enemy_count: Number of enemies in initial engagement
            is_boss: Whether this is a boss fight

        Returns:
            Maximum number of reinforcements allowed
        """
        if is_boss:
            return REINFORCEMENT_CAPS['boss']
        elif enemy_count == 1:
            return REINFORCEMENT_CAPS['solo']
        elif enemy_count <= 3:
            return REINFORCEMENT_CAPS['small']
        else:
            return REINFORCEMENT_CAPS['medium']

    def snapshot_nearby_reinforcements(
        self,
        battle: BattleState,
        engaged_enemy_ids: set,
        origin_x: int,
        origin_y: int,
        rng: random.Random
    ) -> List[PendingReinforcement]:
        """
        Snapshot nearby enemies as pending reinforcements at battle start.

        Args:
            battle: The battle state being created
            engaged_enemy_ids: Set of enemy IDs already in battle
            origin_x, origin_y: World position where battle started
            rng: Random number generator for determinism

        Returns:
            List of PendingReinforcement sorted by arrival time
        """
        reinforcements = []

        for enemy in self.engine.entity_manager.enemies:
            enemy_id = str(id(enemy))

            # Skip enemies already in battle
            if enemy_id in engaged_enemy_ids:
                continue

            # Skip dead enemies
            if not enemy.is_alive():
                continue

            # Skip bosses (they don't reinforce)
            if getattr(enemy, 'is_boss', False):
                continue

            # Check Manhattan distance
            distance = abs(enemy.x - origin_x) + abs(enemy.y - origin_y)
            if distance > REINFORCEMENT_DETECTION_RADIUS:
                continue

            # Check cap
            if len(reinforcements) >= battle.max_reinforcements:
                break

            # Calculate arrival time based on distance
            arrival_turns = self.calculate_arrival_turns(distance)

            # Get enemy type name for grouping
            enemy_type_name = enemy.enemy_type.name if enemy.enemy_type else 'UNKNOWN'

            reinforcement = PendingReinforcement(
                entity_id=enemy_id,
                enemy_name=enemy.name,
                enemy_type=enemy_type_name,
                is_elite=getattr(enemy, 'is_elite', False),
                turns_until_arrival=arrival_turns,
                world_x=enemy.x,
                world_y=enemy.y,
                hp=enemy.health,
                max_hp=enemy.max_health,
                attack=enemy.attack_damage,
                defense=getattr(enemy, 'defense', 0),
                symbol=getattr(enemy, 'symbol', ''),
            )
            reinforcements.append(reinforcement)

        # Sort by arrival time (soonest first)
        reinforcements.sort(key=lambda r: r.turns_until_arrival)

        return reinforcements

    def calculate_arrival_turns(self, distance: int) -> int:
        """
        Calculate arrival turns based on Manhattan distance.

        v6.0.5: When pulse is active, reinforcements arrive faster.
        - MINOR pulse: 0.9x time
        - MODERATE pulse: 0.8x time
        - MAJOR pulse: 0.7x time

        Args:
            distance: Manhattan distance from encounter origin

        Returns:
            Number of turns until arrival (minimum MIN_ARRIVAL_TURNS)
        """
        # Base calculation: distance * factor + minimum
        turns = int(distance * DISTANCE_TO_TURNS_FACTOR) + MIN_ARRIVAL_TURNS

        # v6.0.5: Apply pulse acceleration if active
        if self.is_pulse_active():
            pulse_amp = self.get_pulse_amplification()
            # Convert amplification to speed multiplier (higher amp = faster arrival)
            # 1.25 -> 0.9, 1.5 -> 0.8, 2.0 -> 0.7
            if pulse_amp >= 2.0:
                speed_mult = 0.7
            elif pulse_amp >= 1.5:
                speed_mult = 0.8
            elif pulse_amp >= 1.25:
                speed_mult = 0.9
            else:
                speed_mult = 1.0
            turns = int(turns * speed_mult)

        # Ensure minimum
        return max(turns, MIN_ARRIVAL_TURNS)

    def tick_reinforcements(self, battle: BattleState) -> List[BattleEntity]:
        """
        Process reinforcement countdowns and spawn arrivals.

        Called at end of each battle turn. Decrements all timers,
        spawns reinforcements that reach 0, and removes them from queue.

        Returns:
            List of BattleEntity that just spawned
        """
        if battle is None:
            return []

        spawned = []
        still_pending = []

        for reinforcement in battle.reinforcements:
            # Decrement timer
            reinforcement.turns_until_arrival -= 1

            if reinforcement.turns_until_arrival <= 0:
                # Time to spawn!
                spawn_pos = self._get_closest_edge_spawn(
                    battle=battle,
                    world_x=reinforcement.world_x,
                    world_y=reinforcement.world_y
                )

                if spawn_pos:
                    # Create battle entity
                    battle_enemy = BattleEntity(
                        entity_id=reinforcement.entity_id,
                        is_player=False,
                        arena_x=spawn_pos[0],
                        arena_y=spawn_pos[1],
                        world_x=reinforcement.world_x,
                        world_y=reinforcement.world_y,
                        hp=reinforcement.hp,
                        max_hp=reinforcement.max_hp,
                        attack=reinforcement.attack,
                        defense=reinforcement.defense,
                        name=reinforcement.enemy_name,
                        symbol=reinforcement.symbol,
                        is_elite=reinforcement.is_elite,
                        is_boss=False,  # Reinforcements are not bosses
                    )
                    battle.enemies.append(battle_enemy)
                    battle.reinforcements_spawned += 1
                    spawned.append(battle_enemy)

                    # v6.0.5: Register in bestiary and ledger
                    if hasattr(self.engine, 'story_manager') and self.engine.story_manager:
                        self.engine.story_manager.encounter_enemy(reinforcement.enemy_name)
                    if hasattr(self.engine, 'completion_ledger') and self.engine.completion_ledger:
                        self.engine.completion_ledger.record_reinforcement(
                            reinforcement.enemy_name,
                            is_elite=reinforcement.is_elite
                        )

                    # Message
                    elite_str = " (Elite)" if reinforcement.is_elite else ""
                    self.engine.add_message(
                        f"{reinforcement.enemy_name}{elite_str} joins the battle!"
                    )
            else:
                # Still waiting
                still_pending.append(reinforcement)

        # Update queue with remaining reinforcements
        battle.reinforcements = still_pending

        return spawned

    def _get_closest_edge_spawn(
        self,
        battle: BattleState,
        world_x: int,
        world_y: int
    ) -> Optional[Tuple[int, int]]:
        """
        Get spawn position on arena edge closest to enemy's world position.

        Uses direction from encounter origin to determine entry side,
        then finds nearest walkable tile on that edge.

        Args:
            battle: Current battle state
            world_x, world_y: Enemy's world position

        Returns:
            (arena_x, arena_y) spawn position, or None if no valid spot
        """
        origin_x, origin_y = battle.encounter_origin

        # Determine entry direction based on world position relative to origin
        dx = world_x - origin_x
        dy = world_y - origin_y

        # Determine primary edge based on direction
        # Priority: largest delta determines edge
        edges_priority = []

        if abs(dx) >= abs(dy):
            if dx > 0:
                edges_priority = ['east', 'north', 'south', 'west']
            else:
                edges_priority = ['west', 'north', 'south', 'east']
        else:
            if dy > 0:
                edges_priority = ['south', 'east', 'west', 'north']
            else:
                edges_priority = ['north', 'east', 'west', 'south']

        # Get edge tiles for each direction
        edge_tiles = {
            'north': [(x, 1) for x in range(1, battle.arena_width - 1)],
            'south': [(x, battle.arena_height - 2) for x in range(1, battle.arena_width - 1)],
            'west': [(1, y) for y in range(1, battle.arena_height - 1)],
            'east': [(battle.arena_width - 2, y) for y in range(1, battle.arena_height - 1)],
        }

        # Try each edge in priority order
        for edge_name in edges_priority:
            tiles = edge_tiles[edge_name]

            # Find valid spawn tile (walkable and unoccupied)
            valid_tiles = []
            for tx, ty in tiles:
                if self._is_valid_spawn_tile(battle, tx, ty):
                    valid_tiles.append((tx, ty))

            if valid_tiles:
                # Pick center of valid tiles for predictability
                return valid_tiles[len(valid_tiles) // 2]

        # No valid spawn found
        return None

    def _is_valid_spawn_tile(self, battle: BattleState, x: int, y: int) -> bool:
        """Check if a tile is valid for spawning (walkable + unoccupied)."""
        # Check walkable
        if not battle.is_tile_walkable(x, y):
            return False

        # Check not occupied
        if battle.get_entity_at(x, y) is not None:
            return False

        return True

    def add_noise(self, battle: BattleState, action_type: str) -> None:
        """
        Add noise from a player action (affects reinforcement timing).

        Args:
            battle: Current battle state
            action_type: Type of action ('attack', 'move', 'spell', 'item')
        """
        if battle is None:
            return

        weight = NOISE_WEIGHTS.get(action_type, 0.0)
        battle.outside_time += weight
        battle.noise_level = min(battle.noise_level + weight * 0.5, 10.0)

    def get_reinforcement_summary(self, battle: BattleState) -> List[Dict]:
        """
        Get grouped reinforcement summary for UI display.

        Returns list of dicts:
        [
            {'type': 'Rat', 'count': 2, 'turns': 3, 'has_elite': False},
            {'type': 'Plague Rat', 'count': 1, 'turns': 5, 'has_elite': True},
        ]
        Sorted by soonest arrival.
        """
        if battle is None or not battle.reinforcements:
            return []

        # Group by (enemy_type, turns_until_arrival)
        groups: Dict[Tuple[str, int], Dict] = {}

        for r in battle.reinforcements:
            key = (r.enemy_name, r.turns_until_arrival)
            if key not in groups:
                groups[key] = {
                    'type': r.enemy_name,
                    'count': 0,
                    'turns': r.turns_until_arrival,
                    'has_elite': False,
                }
            groups[key]['count'] += 1
            if r.is_elite:
                groups[key]['has_elite'] = True

        # Convert to list and sort by turns
        result = list(groups.values())
        result.sort(key=lambda g: (g['turns'], g['type']))

        return result
