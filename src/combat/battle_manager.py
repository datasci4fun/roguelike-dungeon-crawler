"""Battle manager for v6.0 tactical combat mode.

Orchestrates battle flow: start, turn processing, end.
Works with both curses and web clients (client-agnostic).
"""
import random
from typing import TYPE_CHECKING, Optional, Tuple, List, Dict

from .battle_types import BattleState, BattleEntity, BattleOutcome, PendingReinforcement
from .arena_templates import pick_template, compile_template, generate_deterministic_seed
from ..core.constants import UIMode, DungeonTheme, LEVEL_THEMES
from ..core.events import EventType, EventQueue

if TYPE_CHECKING:
    from ..core.engine import GameEngine


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


class BattleManager:
    """
    Manages tactical battle mode.

    Responsibilities:
    - Create BattleState from exploration context
    - Process battle turns
    - Handle battle end and return to exploration
    - Emit events for renderers to consume
    """

    def __init__(self, engine: 'GameEngine', event_queue: EventQueue = None):
        self.engine = engine
        self.events = event_queue

    def start_battle(
        self,
        enemy_ids: List[str],
        trigger_x: int,
        trigger_y: int,
        seed: Optional[int] = None,
        is_boss: bool = False
    ) -> BattleState:
        """
        Start a new tactical battle.

        Args:
            enemy_ids: List of enemy entity IDs to include in battle
            trigger_x, trigger_y: World position where battle was triggered
            seed: Optional seed for deterministic arena generation
            is_boss: Whether this is a boss encounter

        Returns:
            The created BattleState
        """
        # Determine biome from current floor
        floor_level = self.engine.current_level
        theme = LEVEL_THEMES.get(floor_level, DungeonTheme.STONE)
        biome = theme.name

        # Check if any enemy is a boss
        for enemy_id in enemy_ids:
            enemy = self._get_enemy_by_id(enemy_id)
            if enemy and getattr(enemy, 'is_boss', False):
                is_boss = True
                break

        # Generate deterministic seed
        dungeon_seed = getattr(self.engine.dungeon, 'seed', 0) if self.engine.dungeon else 0
        encounter_index = len([e for e in self.engine.entity_manager.enemies if not e.is_alive()])
        enemy_signature = ",".join(sorted(enemy_ids))

        if seed is None:
            seed = generate_deterministic_seed(
                dungeon_seed=dungeon_seed,
                floor=floor_level,
                zone_id=None,  # Zone detection in future
                encounter_index=encounter_index,
                enemy_signature=enemy_signature
            )

        rng = random.Random(seed)

        # v6.0.2: Use template system
        template = pick_template(theme, zone_id=None, is_boss=is_boss, rng=rng)
        compiled = compile_template(template, rng=rng, seed=seed)

        # Create battle state
        battle = BattleState(
            arena_width=compiled['width'],
            arena_height=compiled['height'],
            arena_tiles=compiled['tiles'],
            biome=biome,
            zone_id=None,  # Zone detection in future
            floor_level=floor_level,
            seed=seed,
        )

        # Place player in arena using spawn region
        player = self.engine.player
        player_spawns = compiled['player_spawn']
        if player_spawns:
            # Pick center of player spawn region
            px, py = player_spawns[len(player_spawns) // 2]
        else:
            # Fallback: center-bottom
            px = compiled['width'] // 2
            py = compiled['height'] - 2

        battle.player = BattleEntity(
            entity_id='player',
            is_player=True,
            arena_x=px,
            arena_y=py,
            world_x=player.x,
            world_y=player.y,
            hp=player.health,
            max_hp=player.max_health,
            attack=player.attack_damage,
            defense=player.defense,
        )

        # Place enemies in arena using spawn region
        enemy_spawns = compiled['enemy_spawn']
        for i, enemy_id in enumerate(enemy_ids):
            enemy = self._get_enemy_by_id(enemy_id)
            if enemy is None:
                continue

            # Use spawn region or distribute across top
            if enemy_spawns and i < len(enemy_spawns):
                ex, ey = enemy_spawns[i]
            else:
                # Fallback: spread across top
                ex = (i + 1) * compiled['width'] // (len(enemy_ids) + 1)
                ey = 1

            battle_enemy = BattleEntity(
                entity_id=enemy_id,
                is_player=False,
                arena_x=ex,
                arena_y=ey,
                world_x=enemy.x,
                world_y=enemy.y,
                hp=enemy.health,
                max_hp=enemy.max_health,
                attack=enemy.attack_damage,
                defense=getattr(enemy, 'defense', 0),
            )
            battle.enemies.append(battle_enemy)

        # Store reinforcement edges for v6.0.3
        battle.reinforcement_edges = compiled.get('reinforcement_edges', [])

        # v6.0.3: Store encounter origin for edge selection
        battle.encounter_origin = (trigger_x, trigger_y)

        # v6.0.3: Set reinforcement cap based on encounter size
        battle.max_reinforcements = self._get_reinforcement_cap(
            enemy_count=len(enemy_ids),
            is_boss=is_boss
        )

        # v6.0.3: Snapshot nearby enemies as pending reinforcements
        battle.reinforcements = self._snapshot_nearby_reinforcements(
            battle=battle,
            engaged_enemy_ids=set(enemy_ids),
            origin_x=trigger_x,
            origin_y=trigger_y,
            rng=rng
        )

        # Store battle state in engine
        self.engine.battle = battle
        self.engine.ui_mode = UIMode.BATTLE

        # Emit battle start event
        if self.events:
            self.events.emit(
                EventType.BATTLE_START,
                biome=biome,
                floor=floor_level,
                enemy_count=len(battle.enemies),
                is_boss=is_boss,
                template_description=compiled.get('description', ''),
                reinforcement_count=len(battle.reinforcements),
            )

        boss_str = " (BOSS)" if is_boss else ""
        reinf_str = f", {len(battle.reinforcements)} incoming" if battle.reinforcements else ""
        self.engine.add_message(f"Battle started{boss_str}! ({len(battle.enemies)} enemies{reinf_str})")

        return battle

    def end_battle(self, outcome: BattleOutcome) -> None:
        """
        End the current battle and return to exploration.

        Args:
            outcome: How the battle ended (VICTORY, DEFEAT, FLEE)
        """
        battle = self.engine.battle
        if battle is None:
            return

        battle.outcome = outcome

        # Sync battle results back to world state
        if outcome == BattleOutcome.VICTORY:
            self._apply_victory_results(battle)
            self.engine.add_message("Victory! All enemies defeated.")
        elif outcome == BattleOutcome.DEFEAT:
            self._apply_defeat_results(battle)
            self.engine.add_message("Defeated in battle...")
        elif outcome == BattleOutcome.FLEE:
            self._apply_flee_results(battle)
            self.engine.add_message("Escaped from battle!")

        # Emit battle end event
        if self.events:
            self.events.emit(
                EventType.BATTLE_END,
                outcome=outcome.name,
                turns=battle.turn_number,
            )

        # Clear battle state and return to game
        self.engine.battle = None
        self.engine.ui_mode = UIMode.GAME

    def process_battle_command(self, command_type: str) -> bool:
        """
        Process a command during battle mode.

        v6.0.1 stub: any command ends battle with victory.
        Full battle logic in v6.0.4.

        Args:
            command_type: The type of command issued

        Returns:
            True if command was processed
        """
        battle = self.engine.battle
        if battle is None:
            return False

        # v6.0.1 STUB: Any action immediately wins the battle
        # This allows testing the mode switch without full combat logic
        if command_type in ('CONFIRM', 'MOVE_UP', 'MOVE_DOWN', 'MOVE_LEFT', 'MOVE_RIGHT', 'ANY_KEY'):
            self.end_battle(BattleOutcome.VICTORY)
            return True

        # ESC or Q returns to exploration (flee stub)
        if command_type in ('CANCEL', 'QUIT'):
            self.end_battle(BattleOutcome.FLEE)
            return True

        return False

    def _get_enemy_by_id(self, enemy_id: str):
        """Get enemy entity by ID from entity manager."""
        for enemy in self.engine.entity_manager.enemies:
            if id(enemy) == int(enemy_id):
                return enemy
        return None

    def _apply_victory_results(self, battle: BattleState) -> None:
        """
        Apply battle victory results to world state.

        - Sync player HP from battle
        - Remove defeated enemies from world
        - Award XP (handled separately for now)
        """
        # Sync player HP
        if battle.player:
            self.engine.player.health = battle.player.hp

        # Remove defeated enemies from world
        for battle_enemy in battle.enemies:
            if battle_enemy.hp <= 0:
                self._remove_enemy_from_world(battle_enemy.entity_id)

    def _apply_defeat_results(self, battle: BattleState) -> None:
        """Apply battle defeat results - player dies."""
        from ..core.constants import GameState
        self.engine.player.health = 0
        self.engine.state = GameState.DEAD

    def _apply_flee_results(self, battle: BattleState) -> None:
        """Apply flee results - player escapes, enemies remain."""
        # Sync player HP (may have taken damage before fleeing)
        if battle.player:
            self.engine.player.health = battle.player.hp

    def _remove_enemy_from_world(self, enemy_id: str) -> None:
        """Remove an enemy from the world after battle defeat."""
        enemies = self.engine.entity_manager.enemies
        for i, enemy in enumerate(enemies):
            if id(enemy) == int(enemy_id):
                enemies.pop(i)
                break

    # =========================================================================
    # Reinforcement System (v6.0.3)
    # =========================================================================

    def _get_reinforcement_cap(self, enemy_count: int, is_boss: bool) -> int:
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

    def _snapshot_nearby_reinforcements(
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
            arrival_turns = self._calculate_arrival_turns(distance)

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
            )
            reinforcements.append(reinforcement)

        # Sort by arrival time (soonest first)
        reinforcements.sort(key=lambda r: r.turns_until_arrival)

        return reinforcements

    def _calculate_arrival_turns(self, distance: int) -> int:
        """
        Calculate arrival turns based on Manhattan distance.

        Args:
            distance: Manhattan distance from encounter origin

        Returns:
            Number of turns until arrival (minimum MIN_ARRIVAL_TURNS)
        """
        # Base calculation: distance * factor + minimum
        turns = int(distance * DISTANCE_TO_TURNS_FACTOR) + MIN_ARRIVAL_TURNS

        # Ensure minimum
        return max(turns, MIN_ARRIVAL_TURNS)

    def tick_reinforcements(self) -> List[BattleEntity]:
        """
        Process reinforcement countdowns and spawn arrivals.

        Called at end of each battle turn. Decrements all timers,
        spawns reinforcements that reach 0, and removes them from queue.

        Returns:
            List of BattleEntity that just spawned
        """
        battle = self.engine.battle
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
                    )
                    battle.enemies.append(battle_enemy)
                    battle.reinforcements_spawned += 1
                    spawned.append(battle_enemy)

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

    def add_noise(self, action_type: str) -> None:
        """
        Add noise from a player action (affects reinforcement timing).

        Args:
            action_type: Type of action ('attack', 'move', 'spell', 'item')
        """
        battle = self.engine.battle
        if battle is None:
            return

        weight = NOISE_WEIGHTS.get(action_type, 0.0)
        battle.outside_time += weight
        battle.noise_level = min(battle.noise_level + weight * 0.5, 10.0)

    def get_reinforcement_summary(self) -> List[Dict]:
        """
        Get grouped reinforcement summary for UI display.

        Returns list of dicts:
        [
            {'type': 'Rat', 'count': 2, 'turns': 3, 'has_elite': False},
            {'type': 'Plague Rat', 'count': 1, 'turns': 5, 'has_elite': True},
        ]
        Sorted by soonest arrival.
        """
        battle = self.engine.battle
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
