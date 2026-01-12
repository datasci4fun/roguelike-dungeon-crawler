"""Battle manager for v6.0 tactical combat mode.

Orchestrates battle flow: start, turn processing, end.
Works with both curses and web clients (client-agnostic).
"""
import random
from typing import TYPE_CHECKING, Optional, Tuple, List

from .battle_types import BattleState, BattleEntity, BattleOutcome, Reinforcement
from .arena_templates import pick_template, compile_template, generate_deterministic_seed
from ..core.constants import UIMode, DungeonTheme, LEVEL_THEMES
from ..core.events import EventType, EventQueue

if TYPE_CHECKING:
    from ..core.engine import GameEngine


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
            )

        boss_str = " (BOSS)" if is_boss else ""
        self.engine.add_message(f"Battle started{boss_str}! ({len(battle.enemies)} enemies)")

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
