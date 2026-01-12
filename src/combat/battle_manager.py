"""Battle manager for v6.0 tactical combat mode.

Orchestrates battle flow: start, turn processing, end.
Works with both curses and web clients (client-agnostic).
"""
import random
from typing import TYPE_CHECKING, Optional, Tuple, List

from .battle_types import BattleState, BattleEntity, BattleOutcome, Reinforcement
from ..core.constants import UIMode, DungeonTheme, LEVEL_THEMES
from ..core.events import EventType, EventQueue

if TYPE_CHECKING:
    from ..core.engine import GameEngine


# Default arena size for v6.0.1 skeleton
DEFAULT_ARENA_WIDTH = 9
DEFAULT_ARENA_HEIGHT = 7


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
        seed: Optional[int] = None
    ) -> BattleState:
        """
        Start a new tactical battle.

        Args:
            enemy_ids: List of enemy entity IDs to include in battle
            trigger_x, trigger_y: World position where battle was triggered
            seed: Optional seed for deterministic arena generation

        Returns:
            The created BattleState
        """
        # Determine biome from current floor
        floor_level = self.engine.current_level
        theme = LEVEL_THEMES.get(floor_level, DungeonTheme.STONE)
        biome = theme.name

        # Generate seed if not provided (for determinism)
        if seed is None:
            seed = random.randint(0, 2**31 - 1)

        # Create arena (v6.0.1: simple rectangular arena, templates in v6.0.2)
        arena_tiles = self._generate_stub_arena(DEFAULT_ARENA_WIDTH, DEFAULT_ARENA_HEIGHT, seed)

        # Create battle state
        battle = BattleState(
            arena_width=DEFAULT_ARENA_WIDTH,
            arena_height=DEFAULT_ARENA_HEIGHT,
            arena_tiles=arena_tiles,
            biome=biome,
            zone_id=None,  # Zone detection in v6.0.2
            floor_level=floor_level,
            seed=seed,
        )

        # Place player in arena (center-bottom)
        player = self.engine.player
        player_arena_x = DEFAULT_ARENA_WIDTH // 2
        player_arena_y = DEFAULT_ARENA_HEIGHT - 2

        battle.player = BattleEntity(
            entity_id='player',
            is_player=True,
            arena_x=player_arena_x,
            arena_y=player_arena_y,
            world_x=player.x,
            world_y=player.y,
            hp=player.health,
            max_hp=player.max_health,
            attack=player.attack_damage,
            defense=player.defense,
        )

        # Place enemies in arena (top half)
        for i, enemy_id in enumerate(enemy_ids):
            enemy = self._get_enemy_by_id(enemy_id)
            if enemy is None:
                continue

            # Simple placement: spread across top of arena
            enemy_arena_x = (i + 1) * DEFAULT_ARENA_WIDTH // (len(enemy_ids) + 1)
            enemy_arena_y = 1

            battle_enemy = BattleEntity(
                entity_id=enemy_id,
                is_player=False,
                arena_x=enemy_arena_x,
                arena_y=enemy_arena_y,
                world_x=enemy.x,
                world_y=enemy.y,
                hp=enemy.health,
                max_hp=enemy.max_health,
                attack=enemy.attack_damage,
                defense=getattr(enemy, 'defense', 0),
            )
            battle.enemies.append(battle_enemy)

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
            )

        self.engine.add_message(f"Battle started! ({len(battle.enemies)} enemies)")

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

    def _generate_stub_arena(self, width: int, height: int, seed: int) -> List[List[str]]:
        """
        Generate a simple rectangular arena (v6.0.1 stub).

        Full template-based generation in v6.0.2.
        """
        # Simple arena: walls around edges, floor inside
        arena = []
        for y in range(height):
            row = []
            for x in range(width):
                if x == 0 or x == width - 1 or y == 0 or y == height - 1:
                    row.append('#')  # Wall
                else:
                    row.append('.')  # Floor
            arena.append(row)
        return arena

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
