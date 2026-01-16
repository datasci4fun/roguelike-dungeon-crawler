"""Battle manager for v6.0 tactical combat mode.

Orchestrates battle flow: start, turn processing, end.
Works with both curses and web clients (client-agnostic).

Delegates to specialized modules:
- reinforcements.py: Reinforcement spawning system
- battle_results.py: Victory/defeat handling, ghost assists
- enemy_turns.py: Enemy AI execution
- round_processing.py: Status effects, hazards
- battle_player_actions.py: Player action execution
"""
import random
from typing import TYPE_CHECKING, Optional, Tuple, List, Dict

from .battle_types import (
    BattleState, BattleEntity, BattleOutcome, BattlePhase
)
from .arena_templates import pick_template, compile_template, generate_deterministic_seed
from .reinforcements import ReinforcementManager
from .battle_results import BattleResultHandler, GhostAssistHandler
from .enemy_turns import EnemyTurnProcessor
from .round_processing import RoundProcessor
from .battle_player_actions import PlayerActionHandler
from ..core.constants import UIMode, DungeonTheme, LEVEL_THEMES
from ..core.events import EventType, EventQueue, TransitionKind
from ..core.dice import calculate_ability_modifier, roll_d20

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

    Uses composition to delegate to specialized handlers.
    """

    def __init__(self, engine: 'GameEngine', event_queue: EventQueue = None):
        self.engine = engine
        self.events = event_queue

        # Delegate to specialized handlers
        self._reinforcement_mgr = ReinforcementManager(engine, event_queue)
        self._result_handler = BattleResultHandler(engine, event_queue)
        self._ghost_handler = GhostAssistHandler(engine, event_queue)
        self._enemy_processor = EnemyTurnProcessor(engine, event_queue)
        self._round_processor = RoundProcessor(engine, event_queue)
        self._player_actions = PlayerActionHandler(engine, event_queue)

        # Wire up cross-references
        self._enemy_processor.set_hazard_handler(self._round_processor)
        self._player_actions.set_managers(self._reinforcement_mgr, self._round_processor)

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
                zone_id=None,
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
            zone_id=None,
            floor_level=floor_level,
            seed=seed,
        )

        # Place player in arena using spawn region
        player = self.engine.player
        player_spawns = compiled['player_spawn']
        if player_spawns:
            px, py = player_spawns[len(player_spawns) // 2]
        else:
            px = compiled['width'] // 2
            py = compiled['height'] - 2

        # v6.12: Roll player initiative with DEX modifier (d20 + DEX mod)
        player_dex_mod = 0
        player_luck_mod = 0.0
        if hasattr(player, 'ability_scores') and player.ability_scores:
            player_dex_mod = calculate_ability_modifier(player.ability_scores.dexterity)
            player_luck_mod = (player.ability_scores.luck - 10) / 20.0

        # Roll d20 for initiative with LUCK influence
        init_roll = roll_d20(player_luck_mod)
        player_initiative = init_roll.rolls[0] + player_dex_mod

        # Emit DICE_ROLL event for initiative
        if self.events is not None:
            self.events.emit(
                EventType.DICE_ROLL,
                roll_type='initiative',
                dice_notation='1d20',
                rolls=init_roll.rolls,
                modifier=player_dex_mod,
                total=player_initiative,
                luck_applied=init_roll.luck_applied,
                entity_name='Hero'
            )

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
            display_id='Hero',
            initiative=player_initiative,
        )

        # v6.11: Track enemy name counts for display_id generation
        enemy_name_counts: Dict[str, int] = {}

        # Place enemies in arena using spawn region
        enemy_spawns = compiled['enemy_spawn']
        for i, enemy_id in enumerate(enemy_ids):
            enemy = self._get_enemy_by_id(enemy_id)
            if enemy is None:
                continue

            if enemy_spawns and i < len(enemy_spawns):
                ex, ey = enemy_spawns[i]
            else:
                ex = (i + 1) * compiled['width'] // (len(enemy_ids) + 1)
                ey = 1

            # v6.11: Generate unique display_id (e.g., "Goblin_01", "Rat_02")
            enemy_name = getattr(enemy, 'name', 'Enemy') or 'Enemy'
            name_key = enemy_name.lower().replace(' ', '_')
            enemy_name_counts[name_key] = enemy_name_counts.get(name_key, 0) + 1
            display_id = f"{enemy_name}_{enemy_name_counts[name_key]:02d}"

            # v6.12: Roll enemy initiative with DEX modifier (d20 + DEX mod)
            enemy_dex_mod = 0
            if hasattr(enemy, 'ability_scores') and enemy.ability_scores:
                enemy_dex_mod = calculate_ability_modifier(enemy.ability_scores.dexterity)
            elif hasattr(enemy, 'dex_score'):
                # Fallback to dex_score attribute if no ability_scores
                enemy_dex_mod = calculate_ability_modifier(getattr(enemy, 'dex_score', 10))

            enemy_init_roll = roll_d20(0.0)  # Enemies don't get LUCK bonus
            enemy_initiative = enemy_init_roll.rolls[0] + enemy_dex_mod

            # Elite/boss bonus to initiative
            if getattr(enemy, 'is_elite', False):
                enemy_initiative += 5
            if getattr(enemy, 'is_boss', False):
                enemy_initiative += 10

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
                name=getattr(enemy, 'name', ''),
                symbol=getattr(enemy, 'symbol', ''),
                is_elite=getattr(enemy, 'is_elite', False),
                is_boss=getattr(enemy, 'is_boss', False),
                display_id=display_id,
                initiative=enemy_initiative,
            )
            battle.enemies.append(battle_enemy)

            # v6.0.5: Register in bestiary on first encounter
            if hasattr(self.engine, 'story_manager') and self.engine.story_manager:
                self.engine.story_manager.encounter_enemy(enemy.name)

        # Store reinforcement edges for v6.0.3
        battle.reinforcement_edges = compiled.get('reinforcement_edges', [])
        battle.encounter_origin = (trigger_x, trigger_y)

        # v6.0.3: Set reinforcement cap and snapshot nearby reinforcements
        battle.max_reinforcements = self._reinforcement_mgr.get_reinforcement_cap(
            enemy_count=len(enemy_ids),
            is_boss=is_boss
        )
        battle.reinforcements = self._reinforcement_mgr.snapshot_nearby_reinforcements(
            battle=battle,
            engaged_enemy_ids=set(enemy_ids),
            origin_x=trigger_x,
            origin_y=trigger_y,
            rng=rng
        )

        # v6.0.5: Sync artifact state from player
        battle.duplicate_seal_armed = getattr(player, 'duplicate_next_consumable', False)

        # v6.11: Calculate turn order based on initiative
        battle.calculate_turn_order()

        # Store battle state in engine
        self.engine.battle = battle

        # v6.1: Start engage transition before switching UI mode
        self.engine.start_transition(TransitionKind.ENGAGE)
        self.engine.ui_mode = UIMode.BATTLE

        # Emit battle start event
        if self.events is not None:
            self.events.emit(
                EventType.BATTLE_START,
                biome=biome,
                floor=floor_level,
                enemy_count=len(battle.enemies),
                is_boss=is_boss,
                template_description=compiled.get('description', ''),
                reinforcement_count=len(battle.reinforcements),
            )

        # v6.0.5: Check for ghost assists at battle start
        self._ghost_handler.check_archivist_reveal(battle)
        self._ghost_handler.check_beacon_guidance(battle)

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

        # v6.1: Determine transition kind based on outcome
        is_floor_8_boss = battle.floor_level == 8 and getattr(battle, 'is_boss_battle', False)

        # Sync battle results back to world state
        if outcome == BattleOutcome.VICTORY:
            self._result_handler.apply_victory_results(battle)
            self.engine.add_message("Victory! All enemies defeated.")
            if is_floor_8_boss:
                self.engine.start_transition(TransitionKind.BOSS_VICTORY)
            else:
                self.engine.start_transition(TransitionKind.WIN)
        elif outcome == BattleOutcome.DEFEAT:
            self._result_handler.apply_defeat_results(battle)
            self.engine.add_message("Defeated in battle...")
            self.engine.start_transition(TransitionKind.DEFEAT, can_skip=False)
        elif outcome == BattleOutcome.FLEE:
            self._result_handler.apply_flee_results(battle)
            self.engine.add_message("Escaped from battle!")
            self.engine.start_transition(TransitionKind.FLEE)

        # Emit battle end event
        if self.events is not None:
            self.events.emit(
                EventType.BATTLE_END,
                outcome=outcome.name,
                turns=battle.turn_number,
            )

        # Clear battle state and return to game
        self.engine.battle = None
        self.engine.ui_mode = UIMode.GAME

    def process_battle_command(self, command_type: str, target_pos: Tuple[int, int] = None) -> bool:
        """
        Process a command during battle mode (v6.0.4).

        Handles player turn actions. When player acts, processes enemy turns,
        then end-of-round tick.

        Args:
            command_type: The type of command issued
            target_pos: Optional target position for move/attack

        Returns:
            True if command was processed
        """
        battle = self.engine.battle
        if battle is None:
            return False

        if battle.phase != BattlePhase.PLAYER_TURN:
            return False

        if self._check_battle_end():
            return True

        player = battle.player
        if player is None or player.hp <= 0:
            self.end_battle(BattleOutcome.DEFEAT)
            return True

        # Handle movement commands (v6.11: movement doesn't end turn)
        if command_type == 'MOVE_UP':
            return self._try_player_move(0, -1, end_turn=False)
        elif command_type == 'MOVE_DOWN':
            return self._try_player_move(0, 1, end_turn=False)
        elif command_type == 'MOVE_LEFT':
            return self._try_player_move(-1, 0, end_turn=False)
        elif command_type == 'MOVE_RIGHT':
            return self._try_player_move(1, 0, end_turn=False)

        # Handle explicit end turn (v6.11)
        elif command_type == 'END_TURN':
            self.engine.add_message("Turn ended.")
            self._end_player_turn()
            return True

        # Handle wait/defend (v6.11: does NOT end turn - player must use END_TURN)
        elif command_type in ('WAIT', 'CONFIRM'):
            self.engine.add_message("You brace for attacks. (+2 Defense this round)")
            # Apply temporary defense buff
            battle.player.add_status({'name': 'defending', 'duration': 1, 'defense_bonus': 2})
            return True

        # Handle flee attempt
        elif command_type in ('CANCEL', 'QUIT', 'FLEE'):
            return self._try_flee()

        # Handle ability selection (1-4 keys)
        elif command_type.startswith('ABILITY_'):
            try:
                ability_index = int(command_type.split('_')[1]) - 1
                return self._try_use_ability(ability_index, target_pos)
            except (ValueError, IndexError):
                return False

        # Handle attack command
        elif command_type == 'ATTACK':
            return self._try_basic_attack(target_pos)

        # v6.0.5: Handle item use
        elif command_type.startswith('USE_ITEM_'):
            try:
                item_index = int(command_type.split('_')[2])
                return self._try_use_item(item_index)
            except (ValueError, IndexError):
                return False

        # v6.0.5: Handle Woundglass activation
        elif command_type == 'USE_WOUNDGLASS':
            return self._use_woundglass_battle()

        return False

    def _try_player_move(self, dx: int, dy: int, end_turn: bool = True) -> bool:
        """Try to move player in direction. If enemy present, attack instead.

        Args:
            dx, dy: Direction to move
            end_turn: Whether to end turn after action (v6.11: False for movement)
        """
        battle = self.engine.battle
        # v6.11: Pass end_turn_callback only if we should end the turn
        end_turn_cb = self._end_player_turn if end_turn else None
        return self._player_actions.try_player_move(
            battle, dx, dy, end_turn_cb, self._handle_entity_death
        )

    def _try_basic_attack(self, target_pos: Tuple[int, int] = None) -> bool:
        """Try to attack an adjacent enemy. (v6.11: does NOT end turn)"""
        battle = self.engine.battle
        return self._player_actions.try_basic_attack(
            battle, target_pos, None, self._handle_entity_death
        )

    def _try_use_ability(self, ability_index: int, target_pos: Tuple[int, int] = None) -> bool:
        """Try to use a class ability. (v6.11: does NOT end turn)"""
        battle = self.engine.battle
        return self._player_actions.try_use_ability(
            battle, ability_index, target_pos, None, self._handle_entity_death
        )

    def _try_flee(self) -> bool:
        """Attempt to flee from battle."""
        self.end_battle(BattleOutcome.FLEE)
        return True

    def _try_use_item(self, item_index: int) -> bool:
        """Try to use a consumable item in battle. (v6.11: does NOT end turn)"""
        battle = self.engine.battle
        return self._player_actions.try_use_item(battle, item_index, None)

    def _use_woundglass_battle(self) -> bool:
        """Activate Woundglass Shard in battle."""
        battle = self.engine.battle
        return self._player_actions.use_woundglass(battle)

    def _end_player_turn(self) -> None:
        """End player turn and start enemy phase."""
        battle = self.engine.battle
        if battle is None:
            return

        # v6.9: Emit player turn end event
        if self.events is not None:
            self.events.emit(EventType.PLAYER_TURN_END)

        battle.player.has_acted = True
        battle.phase = BattlePhase.ENEMY_TURN

        # Process enemy turns
        self._enemy_processor.process_enemy_turns(battle)

        # End of round
        self._process_end_of_round()

        # Check for battle end
        self._check_battle_end()

    def _process_end_of_round(self) -> None:
        """Process end-of-round effects: status ticks, hazards, reinforcements."""
        battle = self.engine.battle
        if battle is None:
            return

        battle.phase = BattlePhase.END_OF_ROUND

        # Tick status effects for all entities
        self._round_processor.tick_status_effects(battle.player)
        for enemy in battle.enemies:
            self._round_processor.tick_status_effects(enemy)

        # Tick cooldowns
        self._round_processor.tick_cooldowns(battle.player)
        for enemy in battle.enemies:
            self._round_processor.tick_cooldowns(enemy)

        # Tick reinforcements
        self._reinforcement_mgr.tick_reinforcements(battle)

        # Check for champion assist if player took damage
        self._ghost_handler.check_champion_assist(battle.player)

        # Increment turn counter
        battle.turn_number += 1

        # Reset for next turn
        battle.player.has_acted = False
        for enemy in battle.enemies:
            enemy.has_acted = False

        battle.phase = BattlePhase.PLAYER_TURN

        # v6.9: Emit player turn start event
        if self.events is not None:
            self.events.emit(EventType.PLAYER_TURN_START)

    def _handle_entity_death(self, entity: BattleEntity) -> None:
        """Handle entity death in battle."""
        if entity.is_player:
            self.engine.add_message("You have fallen in battle!")
        else:
            self.engine.add_message("Enemy defeated!")

            if self.events is not None:
                self.events.emit(
                    EventType.DEATH_FLASH,
                    x=entity.arena_x,
                    y=entity.arena_y
                )

    def _check_battle_end(self) -> bool:
        """Check if battle should end and handle accordingly."""
        battle = self.engine.battle
        if battle is None:
            return True

        if battle.player is None or battle.player.hp <= 0:
            self.end_battle(BattleOutcome.DEFEAT)
            return True

        if not battle.get_living_enemies() and not battle.reinforcements:
            self.end_battle(BattleOutcome.VICTORY)
            return True

        return False

    def _get_enemy_by_id(self, enemy_id: str):
        """Get enemy entity by ID from entity manager."""
        for enemy in self.engine.entity_manager.enemies:
            if id(enemy) == int(enemy_id):
                return enemy
        return None

    # Public API for reinforcement summary (used by UI)
    def get_reinforcement_summary(self) -> List[Dict]:
        """Get grouped reinforcement summary for UI display."""
        return self._reinforcement_mgr.get_reinforcement_summary(self.engine.battle)

    # Backwards compatibility: expose tick_reinforcements
    def tick_reinforcements(self) -> List[BattleEntity]:
        """Process reinforcement countdowns and spawn arrivals."""
        battle = self.engine.battle
        return self._reinforcement_mgr.tick_reinforcements(battle) if battle else []

    # Backwards compatibility: expose add_noise
    def add_noise(self, action_type: str) -> None:
        """Add noise from a player action."""
        battle = self.engine.battle
        if battle:
            self._reinforcement_mgr.add_noise(battle, action_type)
