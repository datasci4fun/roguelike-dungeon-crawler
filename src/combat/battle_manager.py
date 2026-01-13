"""Battle manager for v6.0 tactical combat mode.

Orchestrates battle flow: start, turn processing, end.
Works with both curses and web clients (client-agnostic).

Delegates to specialized modules:
- reinforcements.py: Reinforcement spawning system
- battle_results.py: Victory/defeat handling, ghost assists
- enemy_turns.py: Enemy AI execution
- round_processing.py: Status effects, hazards
"""
import random
from typing import TYPE_CHECKING, Optional, Tuple, List, Dict

from .battle_types import (
    BattleState, BattleEntity, BattleOutcome, BattlePhase
)
from .battle_actions import (
    BattleAction, AbilityDef, StatusEffect,
    get_class_abilities, get_valid_attack_targets,
    manhattan_distance, create_status_effect, BATTLE_MOVE_RANGE
)
from .arena_templates import pick_template, compile_template, generate_deterministic_seed
from .reinforcements import ReinforcementManager
from .battle_results import BattleResultHandler, GhostAssistHandler
from .enemy_turns import EnemyTurnProcessor
from .round_processing import RoundProcessor
from ..core.constants import UIMode, DungeonTheme, LEVEL_THEMES
from ..core.events import EventType, EventQueue, TransitionKind

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

        # Wire up cross-references
        self._enemy_processor.set_hazard_handler(self._round_processor)

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

            if enemy_spawns and i < len(enemy_spawns):
                ex, ey = enemy_spawns[i]
            else:
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
                name=getattr(enemy, 'name', ''),
                symbol=getattr(enemy, 'symbol', ''),
                is_elite=getattr(enemy, 'is_elite', False),
                is_boss=getattr(enemy, 'is_boss', False),
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

        # Store battle state in engine
        self.engine.battle = battle

        # v6.1: Start engage transition before switching UI mode
        self.engine.start_transition(TransitionKind.ENGAGE)
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
        if self.events:
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

        # Handle movement commands
        if command_type == 'MOVE_UP':
            return self._try_player_move(0, -1)
        elif command_type == 'MOVE_DOWN':
            return self._try_player_move(0, 1)
        elif command_type == 'MOVE_LEFT':
            return self._try_player_move(-1, 0)
        elif command_type == 'MOVE_RIGHT':
            return self._try_player_move(1, 0)

        # Handle wait/pass turn
        elif command_type in ('WAIT', 'CONFIRM'):
            self.engine.add_message("You wait...")
            self._end_player_turn()
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

    def _try_player_move(self, dx: int, dy: int) -> bool:
        """Try to move player in direction. If enemy present, attack instead."""
        battle = self.engine.battle
        player = battle.player

        new_x = player.arena_x + dx
        new_y = player.arena_y + dy

        # Check for enemy at target (bump attack)
        target = battle.get_entity_at(new_x, new_y)
        if target and not target.is_player and target.hp > 0:
            return self._execute_attack(player, target, damage_mult=1.0)

        # Check if valid move
        if not battle.is_tile_walkable(new_x, new_y):
            self.engine.add_message("Can't move there.")
            return False

        if battle.get_entity_at(new_x, new_y) is not None:
            self.engine.add_message("Space is occupied.")
            return False

        # Execute move
        player.arena_x = new_x
        player.arena_y = new_y
        self._reinforcement_mgr.add_noise(battle, 'move')

        # Check hazards on-step
        self._round_processor.check_tile_hazards(player, new_x, new_y)

        self._end_player_turn()
        return True

    def _try_basic_attack(self, target_pos: Tuple[int, int] = None) -> bool:
        """Try to attack an adjacent enemy."""
        battle = self.engine.battle
        player = battle.player

        player_class = getattr(self.engine.player, 'player_class', 'WARRIOR')
        if hasattr(player_class, 'name'):
            player_class = player_class.name
        abilities = get_class_abilities(player_class)

        basic_attack = abilities[0]
        targets = get_valid_attack_targets(player, battle, basic_attack)

        if not targets:
            self.engine.add_message("No enemies in range.")
            return False

        if target_pos:
            target = battle.get_entity_at(target_pos[0], target_pos[1])
            if target and target in targets:
                return self._execute_attack(player, target, basic_attack.damage_mult)
            else:
                self.engine.add_message("Invalid target.")
                return False

        target = targets[0]
        return self._execute_attack(player, target, basic_attack.damage_mult)

    def _try_use_ability(self, ability_index: int, target_pos: Tuple[int, int] = None) -> bool:
        """Try to use a class ability."""
        battle = self.engine.battle
        player = battle.player

        player_class = getattr(self.engine.player, 'player_class', 'WARRIOR')
        if hasattr(player_class, 'name'):
            player_class = player_class.name
        abilities = get_class_abilities(player_class)

        if ability_index < 0 or ability_index >= len(abilities):
            self.engine.add_message("Invalid ability.")
            return False

        ability = abilities[ability_index]

        if player.cooldowns.get(ability.name, 0) > 0:
            self.engine.add_message(f"{ability.name} on cooldown ({player.cooldowns[ability.name]} turns).")
            return False

        # Self-buff abilities
        if ability.self_buff:
            return self._execute_self_buff(player, ability)

        # Targeted abilities
        targets = get_valid_attack_targets(player, battle, ability)
        if not targets:
            self.engine.add_message(f"No valid targets for {ability.name}.")
            return False

        target = None
        if target_pos:
            target = battle.get_entity_at(target_pos[0], target_pos[1])
            if target not in targets:
                self.engine.add_message("Invalid target for ability.")
                return False
        else:
            target = targets[0]

        return self._execute_ability(player, target, ability)

    def _execute_attack(self, attacker: BattleEntity, target: BattleEntity, damage_mult: float) -> bool:
        """Execute a basic attack against a target."""
        battle = self.engine.battle

        base_damage = attacker.attack
        defense = target.get_effective_defense()
        damage = max(1, int(base_damage * damage_mult) - defense)

        target.hp -= damage

        if self.events:
            self.events.emit(
                EventType.DAMAGE_NUMBER,
                x=target.arena_x,
                y=target.arena_y,
                amount=damage
            )
            self.events.emit(EventType.HIT_FLASH, entity=target)

        if attacker.is_player:
            self.engine.add_message(f"You hit for {damage} damage!")
        else:
            self.engine.add_message(f"Enemy hits you for {damage} damage!")

        if target.hp <= 0:
            self._handle_entity_death(target)

        self._reinforcement_mgr.add_noise(battle, 'attack')
        self._end_player_turn()
        return True

    def _execute_ability(self, caster: BattleEntity, target: BattleEntity, ability: AbilityDef) -> bool:
        """Execute a targeted ability."""
        battle = self.engine.battle

        damage = 0
        damage_mult = ability.damage_mult

        # Smite bonus vs undead
        if ability.action == BattleAction.SMITE:
            if self._is_target_undead(target):
                damage_mult *= 1.5
                self.engine.add_message("Smite is effective against undead!")

        if damage_mult > 0:
            base_damage = caster.attack
            defense = target.get_effective_defense()
            damage = max(1, int(base_damage * damage_mult) - defense)
            target.hp -= damage

            if self.events:
                self.events.emit(
                    EventType.DAMAGE_NUMBER,
                    x=target.arena_x,
                    y=target.arena_y,
                    amount=damage
                )

        if ability.effect and ability.effect_duration > 0:
            effect = create_status_effect(ability.effect, ability.effect_duration)
            if effect:
                target.add_status(effect.to_dict())
                self.engine.add_message(f"{ability.effect.title()} applied!")

        if ability.aoe_radius > 0:
            self._apply_aoe(caster, target.arena_x, target.arena_y, ability)

        if ability.cooldown > 0:
            caster.cooldowns[ability.name] = ability.cooldown

        self.engine.add_message(f"Used {ability.name}!" + (f" {damage} damage!" if damage > 0 else ""))

        if target.hp <= 0:
            self._handle_entity_death(target)

        noise_type = 'spell' if ability.cooldown > 0 else 'attack'
        self._reinforcement_mgr.add_noise(battle, noise_type)
        self._end_player_turn()
        return True

    def _is_target_undead(self, target: BattleEntity) -> bool:
        """Check if a battle entity is undead (for Smite bonus)."""
        enemy = self._get_enemy_by_id(target.entity_id)
        if enemy and hasattr(enemy, 'enemy_type'):
            type_name = enemy.enemy_type.name if enemy.enemy_type else ''
            undead_types = {'SKELETON', 'ZOMBIE', 'GHOST', 'WRAITH', 'LICH', 'VAMPIRE'}
            return type_name.upper() in undead_types
        return False

    def _execute_self_buff(self, caster: BattleEntity, ability: AbilityDef) -> bool:
        """Execute a self-targeting buff ability."""
        battle = self.engine.battle

        if ability.effect == 'heal':
            heal_amount = 10
            old_hp = caster.hp
            caster.hp = min(caster.max_hp, caster.hp + heal_amount)
            actual_heal = caster.hp - old_hp
            self.engine.add_message(f"Healed for {actual_heal} HP!")
        elif ability.effect and ability.effect_duration > 0:
            effect = create_status_effect(ability.effect, ability.effect_duration)
            if effect:
                caster.add_status(effect.to_dict())
            self.engine.add_message(f"Used {ability.name}!")
        else:
            self.engine.add_message(f"Used {ability.name}!")

        if ability.cooldown > 0:
            caster.cooldowns[ability.name] = ability.cooldown

        self._reinforcement_mgr.add_noise(battle, 'spell')
        self._end_player_turn()
        return True

    def _apply_aoe(self, caster: BattleEntity, center_x: int, center_y: int, ability: AbilityDef) -> None:
        """Apply AoE damage/effects around a center point."""
        battle = self.engine.battle

        for enemy in battle.enemies:
            if enemy.hp <= 0:
                continue

            dist = manhattan_distance(center_x, center_y, enemy.arena_x, enemy.arena_y)
            if dist > 0 and dist <= ability.aoe_radius:
                aoe_damage = max(1, int(caster.attack * ability.damage_mult * 0.5))
                enemy.hp -= aoe_damage

                if self.events:
                    self.events.emit(
                        EventType.DAMAGE_NUMBER,
                        x=enemy.arena_x,
                        y=enemy.arena_y,
                        amount=aoe_damage
                    )

                if enemy.hp <= 0:
                    self._handle_entity_death(enemy)

    def _try_flee(self) -> bool:
        """Attempt to flee from battle."""
        self.end_battle(BattleOutcome.FLEE)
        return True

    def _try_use_item(self, item_index: int) -> bool:
        """Try to use a consumable item in battle (v6.0.5)."""
        battle = self.engine.battle
        player = self.engine.player

        if not player or not hasattr(player, 'inventory') or player.inventory is None:
            return False

        inventory = player.inventory
        if item_index < 0 or item_index >= len(inventory.items):
            self.engine.add_message("Invalid item selection.")
            return False

        item = inventory.get_item(item_index)
        if not getattr(item, 'is_consumable', False):
            self.engine.add_message("That item can't be used in battle.")
            return False

        effect_count = 1
        if battle.duplicate_seal_armed:
            effect_count = 2
            battle.duplicate_seal_armed = False
            player.duplicate_next_consumable = False
            self.engine.add_message("The Duplicate Seal activates!")

        for i in range(effect_count):
            if hasattr(item, 'heal_amount') and item.heal_amount > 0:
                heal = item.heal_amount
                battle.player.hp = min(battle.player.hp + heal, battle.player.max_hp)
                self.engine.add_message(f"Used {item.name}! (+{heal} HP)")

                if self.events:
                    self.events.emit(
                        EventType.BUFF_FLASH,
                        entity=battle.player
                    )

        inventory.remove_item(item_index)
        self._end_player_turn()
        return True

    def _use_woundglass_battle(self) -> bool:
        """Activate Woundglass Shard in battle (v6.0.5)."""
        battle = self.engine.battle

        if battle.woundglass_reveal_active:
            self.engine.add_message("Woundglass vision already active.")
            return False

        battle.woundglass_reveal_active = True

        safe_tiles = []
        for y in range(battle.arena_height):
            for x in range(battle.arena_width):
                tile = battle.arena_tiles[y][x]
                if tile != '.':
                    continue

                min_edge_dist = float('inf')
                for edge_x, edge_y in battle.reinforcement_edges:
                    dist = manhattan_distance(x, y, edge_x, edge_y)
                    min_edge_dist = min(min_edge_dist, dist)

                if min_edge_dist >= 4:
                    safe_tiles.append((x, y))

        battle.safe_tiles_revealed = safe_tiles

        self.engine.add_message(
            f"The Woundglass reveals {len(battle.reinforcements)} incoming reinforcements "
            f"and {len(safe_tiles)} safe tiles."
        )

        return True

    def _end_player_turn(self) -> None:
        """End player turn and start enemy phase."""
        battle = self.engine.battle
        if battle is None:
            return

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

    def _handle_entity_death(self, entity: BattleEntity) -> None:
        """Handle entity death in battle."""
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
