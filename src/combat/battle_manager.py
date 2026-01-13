"""Battle manager for v6.0 tactical combat mode.

Orchestrates battle flow: start, turn processing, end.
Works with both curses and web clients (client-agnostic).
"""
import random
from typing import TYPE_CHECKING, Optional, Tuple, List, Dict

from .battle_types import (
    BattleState, BattleEntity, BattleOutcome, BattlePhase, PendingReinforcement
)
from .battle_actions import (
    BattleAction, AbilityDef, ActionResult, StatusEffect,
    get_class_abilities, get_valid_move_tiles, get_valid_attack_targets,
    manhattan_distance, create_status_effect, BATTLE_MOVE_RANGE
)
from .arena_templates import pick_template, compile_template, generate_deterministic_seed
from .ai_scoring import (
    choose_action, get_enemy_ai_type, execute_ai_action, CandidateType
)
from .boss_heuristics import get_boss_action_with_fallback, compute_boss_action_hash
from ..core.constants import UIMode, DungeonTheme, LEVEL_THEMES, AIBehavior, BossType
from ..core.events import EventType, EventQueue, TransitionKind

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

    def _get_pulse_amplification(self) -> float:
        """Get current field pulse amplification (v6.0.5).

        Returns amplification multiplier from active field pulse.
        Returns 1.0 if no pulse is active or pulse manager unavailable.
        """
        if hasattr(self.engine, 'field_pulse_manager') and self.engine.field_pulse_manager:
            return self.engine.field_pulse_manager.get_current_amplification()
        return 1.0

    def _is_pulse_active(self) -> bool:
        """Check if a field pulse is currently active (v6.0.5)."""
        if hasattr(self.engine, 'field_pulse_manager') and self.engine.field_pulse_manager:
            return self.engine.field_pulse_manager.is_pulse_active()
        return False

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
        self._check_archivist_reveal(battle)
        self._check_beacon_guidance(battle)

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
            self._apply_victory_results(battle)
            self.engine.add_message("Victory! All enemies defeated.")
            # v6.1: Start appropriate victory transition
            if is_floor_8_boss:
                self.engine.start_transition(TransitionKind.BOSS_VICTORY)
            else:
                self.engine.start_transition(TransitionKind.WIN)
        elif outcome == BattleOutcome.DEFEAT:
            self._apply_defeat_results(battle)
            self.engine.add_message("Defeated in battle...")
            # v6.1: Defeat transition (0ms, death camera handles visuals)
            self.engine.start_transition(TransitionKind.DEFEAT, can_skip=False)
        elif outcome == BattleOutcome.FLEE:
            self._apply_flee_results(battle)
            self.engine.add_message("Escaped from battle!")
            # v6.1: Flee transition
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

        # Only process player input during player turn
        if battle.phase != BattlePhase.PLAYER_TURN:
            return False

        # Check for battle end conditions
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
        """
        Try to move player in direction. If enemy present, attack instead.

        Args:
            dx, dy: Direction to move

        Returns:
            True if action was taken
        """
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
        self.add_noise('move')

        # Check hazards on-step
        self._check_tile_hazards(player, new_x, new_y)

        self._end_player_turn()
        return True

    def _try_basic_attack(self, target_pos: Tuple[int, int] = None) -> bool:
        """
        Try to attack an adjacent enemy.

        If target_pos specified, attack that position.
        Otherwise, attack first adjacent enemy found.
        """
        battle = self.engine.battle
        player = battle.player

        # Get player abilities to find basic attack
        player_class = getattr(self.engine.player, 'player_class', 'WARRIOR')
        if hasattr(player_class, 'name'):
            player_class = player_class.name
        abilities = get_class_abilities(player_class)

        basic_attack = abilities[0]  # First ability is always basic attack

        # Find target
        targets = get_valid_attack_targets(player, battle, basic_attack)

        if not targets:
            self.engine.add_message("No enemies in range.")
            return False

        # If specific target requested, use it
        if target_pos:
            target = battle.get_entity_at(target_pos[0], target_pos[1])
            if target and target in targets:
                return self._execute_attack(player, target, basic_attack.damage_mult)
            else:
                self.engine.add_message("Invalid target.")
                return False

        # Otherwise attack closest
        target = targets[0]
        return self._execute_attack(player, target, basic_attack.damage_mult)

    def _try_use_ability(self, ability_index: int, target_pos: Tuple[int, int] = None) -> bool:
        """
        Try to use a class ability.

        Args:
            ability_index: Index into player's ability list
            target_pos: Optional target position
        """
        battle = self.engine.battle
        player = battle.player

        # Get player abilities
        player_class = getattr(self.engine.player, 'player_class', 'WARRIOR')
        if hasattr(player_class, 'name'):
            player_class = player_class.name
        abilities = get_class_abilities(player_class)

        if ability_index < 0 or ability_index >= len(abilities):
            self.engine.add_message("Invalid ability.")
            return False

        ability = abilities[ability_index]

        # Check cooldown
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

        # If specific target, verify it's valid
        target = None
        if target_pos:
            target = battle.get_entity_at(target_pos[0], target_pos[1])
            if target not in targets:
                self.engine.add_message("Invalid target for ability.")
                return False
        else:
            target = targets[0]

        # Execute ability
        return self._execute_ability(player, target, ability)

    def _execute_attack(self, attacker: BattleEntity, target: BattleEntity, damage_mult: float) -> bool:
        """Execute a basic attack against a target."""
        battle = self.engine.battle

        # Calculate damage
        base_damage = attacker.attack
        defense = target.get_effective_defense()
        damage = max(1, int(base_damage * damage_mult) - defense)

        # Apply damage
        target.hp -= damage

        # Emit damage event
        if self.events:
            self.events.emit(
                EventType.DAMAGE_NUMBER,
                x=target.arena_x,
                y=target.arena_y,
                amount=damage
            )
            self.events.emit(EventType.HIT_FLASH, entity=target)

        # Message
        target_name = "enemy" if not target.is_player else "you"
        if attacker.is_player:
            self.engine.add_message(f"You hit for {damage} damage!")
        else:
            self.engine.add_message(f"Enemy hits you for {damage} damage!")

        # Check death
        if target.hp <= 0:
            self._handle_entity_death(target)

        self.add_noise('attack')
        self._end_player_turn()
        return True

    def _execute_ability(self, caster: BattleEntity, target: BattleEntity, ability: AbilityDef) -> bool:
        """Execute a targeted ability."""
        battle = self.engine.battle

        # Calculate damage if ability does damage
        damage = 0
        damage_mult = ability.damage_mult

        # Smite bonus vs undead
        if ability.action == BattleAction.SMITE:
            if self._is_target_undead(target):
                damage_mult *= 1.5  # 1.5x bonus vs undead
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

        # Apply status effect if any
        if ability.effect and ability.effect_duration > 0:
            effect = create_status_effect(ability.effect, ability.effect_duration)
            if effect:
                target.add_status(effect.to_dict())
                self.engine.add_message(f"{ability.effect.title()} applied!")

        # Handle AoE
        if ability.aoe_radius > 0:
            self._apply_aoe(caster, target.arena_x, target.arena_y, ability)

        # Set cooldown
        if ability.cooldown > 0:
            caster.cooldowns[ability.name] = ability.cooldown

        # Message
        self.engine.add_message(f"Used {ability.name}!" + (f" {damage} damage!" if damage > 0 else ""))

        # Check death
        if target.hp <= 0:
            self._handle_entity_death(target)

        self.add_noise('spell' if ability.cooldown > 0 else 'attack')
        self._end_player_turn()
        return True

    def _is_target_undead(self, target: BattleEntity) -> bool:
        """Check if a battle entity is undead (for Smite bonus)."""
        # Look up the world entity to check its type
        enemy = self._get_enemy_by_id(target.entity_id)
        if enemy and hasattr(enemy, 'enemy_type'):
            # Check if enemy type name suggests undead
            type_name = enemy.enemy_type.name if enemy.enemy_type else ''
            undead_types = {'SKELETON', 'ZOMBIE', 'GHOST', 'WRAITH', 'LICH', 'VAMPIRE'}
            return type_name.upper() in undead_types
        return False

    def _execute_self_buff(self, caster: BattleEntity, ability: AbilityDef) -> bool:
        """Execute a self-targeting buff ability."""
        # Handle Heal specially - restore HP
        if ability.effect == 'heal':
            heal_amount = 10  # Base heal amount
            old_hp = caster.hp
            caster.hp = min(caster.max_hp, caster.hp + heal_amount)
            actual_heal = caster.hp - old_hp
            self.engine.add_message(f"Healed for {actual_heal} HP!")
        # Apply status effect to self
        elif ability.effect and ability.effect_duration > 0:
            effect = create_status_effect(ability.effect, ability.effect_duration)
            if effect:
                caster.add_status(effect.to_dict())
            self.engine.add_message(f"Used {ability.name}!")
        else:
            self.engine.add_message(f"Used {ability.name}!")

        # Set cooldown
        if ability.cooldown > 0:
            caster.cooldowns[ability.name] = ability.cooldown

        self.add_noise('spell')
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
                # Apply reduced damage to secondary targets
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
        # For now, flee always succeeds
        # Could add chance based on enemy count, player speed, etc.
        self.end_battle(BattleOutcome.FLEE)
        return True

    def _try_use_item(self, item_index: int) -> bool:
        """
        Try to use a consumable item in battle (v6.0.5).

        Supports Duplicate Seal - if armed, consumable effect happens twice.

        Args:
            item_index: Index into player's inventory

        Returns:
            True if item was used
        """
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

        # Use the item
        effect_count = 1
        if battle.duplicate_seal_armed:
            effect_count = 2
            battle.duplicate_seal_armed = False
            # Also clear the player flag
            player.duplicate_next_consumable = False
            self.engine.add_message("The Duplicate Seal activates!")

        # Apply effect (typically healing)
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

        # Remove item from inventory (only once, even if duplicated)
        inventory.remove_item(item_index)

        # End turn after using item
        self._end_player_turn()
        return True

    def _use_woundglass_battle(self) -> bool:
        """
        Activate Woundglass Shard in battle (v6.0.5).

        Reveals reinforcement ETAs and highlights safe tiles.

        Returns:
            True if successfully activated
        """
        battle = self.engine.battle

        if battle.woundglass_reveal_active:
            self.engine.add_message("Woundglass vision already active.")
            return False

        # Mark reveal as active
        battle.woundglass_reveal_active = True

        # Find safe tiles (no hazards, far from reinforcement edges)
        safe_tiles = []
        for y in range(battle.arena_height):
            for x in range(battle.arena_width):
                tile = battle.arena_tiles[y][x]
                if tile != '.':  # Only consider floor tiles
                    continue

                # Check distance from all reinforcement edges
                min_edge_dist = float('inf')
                for edge_x, edge_y in battle.reinforcement_edges:
                    dist = manhattan_distance(x, y, edge_x, edge_y)
                    min_edge_dist = min(min_edge_dist, dist)

                # Safe if far from edges (at least 4 tiles away)
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
        self._process_enemy_turns()

        # End of round
        self._process_end_of_round()

        # Check for battle end
        self._check_battle_end()

    def _process_enemy_turns(self) -> None:
        """Process all enemy actions."""
        battle = self.engine.battle
        if battle is None:
            return

        for enemy in battle.get_living_enemies():
            if enemy.hp <= 0:
                continue

            # Simple AI: move toward player and attack if adjacent
            self._enemy_take_turn(enemy)

    def _enemy_take_turn(self, enemy: BattleEntity) -> None:
        """Execute a single enemy's turn using v6.2 AI scoring system."""
        battle = self.engine.battle
        player = battle.player

        if player is None or player.hp <= 0:
            return

        # v6.2: Get AI type for this enemy
        ai_type = get_enemy_ai_type(enemy.entity_id, self.engine)

        # v6.2 Slice 3: Check if this is a boss and use boss heuristics
        boss_type = self._get_boss_type(enemy)
        if boss_type is not None:
            action = get_boss_action_with_fallback(battle, enemy, boss_type, ai_type)
        else:
            # Regular enemy: use standard AI scoring
            action = choose_action(battle, enemy, ai_type)

        # Execute the chosen action
        self._execute_enemy_action(enemy, player, action)

    def _get_boss_type(self, enemy: BattleEntity) -> Optional[BossType]:
        """Get boss type for an enemy entity, or None if not a boss."""
        # Look up the world entity to check if it's a boss
        if not hasattr(self.engine, 'entity_manager'):
            return None

        for world_enemy in self.engine.entity_manager.enemies:
            if str(id(world_enemy)) == enemy.entity_id:
                if getattr(world_enemy, 'is_boss', False):
                    # Get boss type from world enemy
                    return getattr(world_enemy, 'boss_type', None)
        return None

    def _execute_enemy_action(
        self,
        enemy: BattleEntity,
        player: BattleEntity,
        action: 'CandidateAction'
    ) -> None:
        """Execute a chosen enemy action (v6.2 unified action handler)."""
        battle = self.engine.battle

        if action.action_type == CandidateType.ATTACK:
            # Execute attack on player
            self._execute_enemy_attack(enemy, player)

        elif action.action_type == CandidateType.MOVE:
            # Move to chosen tile
            new_x, new_y = execute_ai_action(battle, enemy, action)
            if (new_x, new_y) != (enemy.arena_x, enemy.arena_y):
                enemy.arena_x = new_x
                enemy.arena_y = new_y
                # Check hazards on the new tile
                self._check_tile_hazards(enemy, new_x, new_y)

        elif action.action_type == CandidateType.ABILITY:
            # Execute boss ability
            self._execute_boss_ability(enemy, player, action)

        # WAIT does nothing (enemy skips turn)

    def _execute_boss_ability(
        self,
        boss: BattleEntity,
        player: BattleEntity,
        action: 'CandidateAction'
    ) -> None:
        """Execute a boss's special ability (v6.2 Slice 3)."""
        battle = self.engine.battle
        ability_action = action.battle_action

        if ability_action is None:
            return

        # Set cooldown for the ability
        from .battle_actions import (
            REGENT_ABILITIES, RAT_KING_ABILITIES, SPIDER_QUEEN_ABILITIES,
            FROST_GIANT_ABILITIES, ARCANE_KEEPER_ABILITIES, FLAME_LORD_ABILITIES,
            DRAGON_EMPEROR_ABILITIES, BattleAction
        )

        # Find ability definition to get cooldown
        all_boss_abilities = {
            **REGENT_ABILITIES, **RAT_KING_ABILITIES, **SPIDER_QUEEN_ABILITIES,
            **FROST_GIANT_ABILITIES, **ARCANE_KEEPER_ABILITIES, **FLAME_LORD_ABILITIES,
            **DRAGON_EMPEROR_ABILITIES
        }

        ability_def = all_boss_abilities.get(ability_action)
        if ability_def:
            boss.cooldowns[ability_action.name] = ability_def.cooldown

        # Execute ability effects based on type
        ability_name = ability_action.name

        # Movement abilities (BURROW, TELEPORT)
        if ability_action in {BattleAction.BURROW, BattleAction.TELEPORT}:
            if action.target_pos:
                boss.arena_x, boss.arena_y = action.target_pos
                self.engine.add_message(f"Boss uses {ability_name}!")

        # Summon abilities
        elif ability_action in {
            BattleAction.ROYAL_DECREE, BattleAction.SUMMON_GUARD,
            BattleAction.SUMMON_SWARM, BattleAction.SUMMON_SPIDERS
        }:
            self._boss_summon_minions(boss, ability_action)

        # Damage/debuff abilities
        elif ability_action in {
            BattleAction.PLAGUE_BITE, BattleAction.POISON_BITE,
            BattleAction.FIRE_BREATH, BattleAction.ICE_BLAST,
            BattleAction.ARCANE_BOLT, BattleAction.TAIL_SWEEP
        }:
            self._boss_attack_ability(boss, player, ability_action, ability_def)

        # AoE/control abilities
        elif ability_action in {
            BattleAction.COUNTERFEIT_CROWN, BattleAction.WEB_TRAP,
            BattleAction.DRAGON_FEAR, BattleAction.FREEZE_GROUND,
            BattleAction.INFERNO
        }:
            self._boss_control_ability(boss, player, ability_action, ability_def)

        # Hazard creation
        elif ability_action == BattleAction.LAVA_POOL:
            self._boss_create_hazard(boss, ability_action)

        else:
            self.engine.add_message(f"Boss uses {ability_name}!")

    def _boss_summon_minions(self, boss: BattleEntity, ability: 'BattleAction') -> None:
        """Handle boss summon abilities."""
        from .battle_actions import BattleAction

        summon_count = 1
        if ability == BattleAction.ROYAL_DECREE:
            summon_count = 2
        elif ability == BattleAction.SUMMON_SWARM:
            summon_count = 2

        self.engine.add_message(f"Boss summons reinforcements!")
        # Note: Actual minion spawning would require integration with reinforcement system
        # For now, just log the message

    def _boss_attack_ability(
        self,
        boss: BattleEntity,
        player: BattleEntity,
        ability: 'BattleAction',
        ability_def
    ) -> None:
        """Handle boss attack abilities."""
        if ability_def is None:
            return

        # Calculate damage
        base_damage = boss.attack
        damage_mult = ability_def.damage_mult if ability_def else 1.0
        defense = player.get_effective_defense()
        damage = max(1, int(base_damage * damage_mult) - defense)
        player.hp -= damage

        if self.events:
            self.events.emit(
                EventType.DAMAGE_NUMBER,
                x=player.arena_x,
                y=player.arena_y,
                amount=damage
            )
            self.events.emit(EventType.HIT_FLASH, entity=player)

        self.engine.add_message(f"Boss uses {ability.name} for {damage} damage!")

        # Apply status effect if any
        if ability_def and ability_def.effect:
            effect = create_status_effect(ability_def.effect, ability_def.effect_duration)
            if effect:
                player.add_status(effect.to_dict())
                self.engine.add_message(f"Player is affected by {ability_def.effect}!")

        if player.hp <= 0:
            self._handle_entity_death(player)

    def _boss_control_ability(
        self,
        boss: BattleEntity,
        player: BattleEntity,
        ability: 'BattleAction',
        ability_def
    ) -> None:
        """Handle boss control/debuff abilities."""
        if ability_def is None:
            return

        self.engine.add_message(f"Boss uses {ability.name}!")

        # Apply status effect
        if ability_def.effect:
            effect = create_status_effect(ability_def.effect, ability_def.effect_duration)
            if effect:
                player.add_status(effect.to_dict())
                self.engine.add_message(f"Player is affected by {ability_def.effect}!")

    def _boss_create_hazard(self, boss: BattleEntity, ability: 'BattleAction') -> None:
        """Handle boss hazard creation abilities."""
        battle = self.engine.battle
        self.engine.add_message(f"Boss creates hazardous terrain!")

        # Note: Actual lava tile creation would modify battle.arena_tiles
        # For now, just log the message. Full implementation would:
        # 1. Find tiles near player that don't block all escapes
        # 2. Convert them to lava ('~')

    def _execute_enemy_attack(self, enemy: BattleEntity, player: BattleEntity) -> None:
        """Execute an enemy's attack on the player (v6.2 extracted for clarity)."""
        # v6.0.5: Pulse amplifies enemy damage
        defense = player.get_effective_defense()
        base_damage = max(1, enemy.attack - defense)
        pulse_amp = self._get_pulse_amplification()
        damage = int(base_damage * pulse_amp)
        player.hp -= damage

        if self.events:
            self.events.emit(
                EventType.DAMAGE_NUMBER,
                x=player.arena_x,
                y=player.arena_y,
                amount=damage
            )
            self.events.emit(EventType.HIT_FLASH, entity=player)

        self.engine.add_message(f"Enemy hits you for {damage}!")

        # v6.0.5.5: Check for Champion ghost assist
        self._check_champion_assist(player)

        if player.hp <= 0:
            self._handle_entity_death(player)

    def _enemy_move_toward_player(self, enemy: BattleEntity) -> None:
        """Move enemy one step toward player (legacy fallback, replaced by v6.2 AI)."""
        battle = self.engine.battle
        player = battle.player

        dx = 0
        dy = 0

        if player.arena_x > enemy.arena_x:
            dx = 1
        elif player.arena_x < enemy.arena_x:
            dx = -1

        if player.arena_y > enemy.arena_y:
            dy = 1
        elif player.arena_y < enemy.arena_y:
            dy = -1

        # Try primary direction first
        moves_to_try = []
        if abs(player.arena_x - enemy.arena_x) >= abs(player.arena_y - enemy.arena_y):
            moves_to_try = [(dx, 0), (0, dy), (dx, dy)]
        else:
            moves_to_try = [(0, dy), (dx, 0), (dx, dy)]

        for mx, my in moves_to_try:
            if mx == 0 and my == 0:
                continue

            new_x = enemy.arena_x + mx
            new_y = enemy.arena_y + my

            if battle.is_tile_walkable(new_x, new_y) and battle.get_entity_at(new_x, new_y) is None:
                enemy.arena_x = new_x
                enemy.arena_y = new_y
                return

    def _process_end_of_round(self) -> None:
        """Process end-of-round effects: status ticks, hazards, reinforcements."""
        battle = self.engine.battle
        if battle is None:
            return

        battle.phase = BattlePhase.END_OF_ROUND

        # Tick status effects for all entities
        self._tick_status_effects(battle.player)
        for enemy in battle.enemies:
            self._tick_status_effects(enemy)

        # Tick cooldowns
        self._tick_cooldowns(battle.player)
        for enemy in battle.enemies:
            self._tick_cooldowns(enemy)

        # Tick reinforcements
        spawned = self.tick_reinforcements()

        # Increment turn counter
        battle.turn_number += 1

        # Reset for next turn
        battle.player.has_acted = False
        for enemy in battle.enemies:
            enemy.has_acted = False

        battle.phase = BattlePhase.PLAYER_TURN

    def _tick_status_effects(self, entity: BattleEntity) -> None:
        """Process status effect ticks for an entity."""
        if entity is None or entity.hp <= 0:
            return

        remaining_effects = []

        for effect_dict in entity.status_effects:
            # Apply DOT
            dot = effect_dict.get('damage_per_tick', 0)
            if dot > 0:
                entity.hp -= dot
                if self.events:
                    self.events.emit(
                        EventType.DAMAGE_NUMBER,
                        x=entity.arena_x,
                        y=entity.arena_y,
                        amount=dot
                    )

                name = effect_dict.get('name', 'effect')
                if entity.is_player:
                    self.engine.add_message(f"You take {dot} {name} damage!")

            # Decrement duration
            effect_dict['duration'] = effect_dict.get('duration', 1) - 1

            if effect_dict['duration'] > 0:
                remaining_effects.append(effect_dict)
            else:
                name = effect_dict.get('name', 'effect')
                if entity.is_player:
                    self.engine.add_message(f"{name.title()} wore off.")

        entity.status_effects = remaining_effects

        # Check death from DOT
        if entity.hp <= 0:
            self._handle_entity_death(entity)

    def _tick_cooldowns(self, entity: BattleEntity) -> None:
        """Decrement ability cooldowns for an entity."""
        if entity is None:
            return

        to_remove = []
        for ability_name, turns in entity.cooldowns.items():
            entity.cooldowns[ability_name] = max(0, turns - 1)
            if entity.cooldowns[ability_name] == 0:
                to_remove.append(ability_name)

        for name in to_remove:
            del entity.cooldowns[name]

    def _check_tile_hazards(self, entity: BattleEntity, x: int, y: int) -> None:
        """Check for hazards at tile and apply on-step effects.

        Uses project-canon hazard glyphs:
        - '~' = Lava (immediate damage + BURN DOT)
        - '=' = Ice (FREEZE movement penalty)
        - '≈' = Deep Water (FREEZE movement penalty)
        - '!' = Poison Gas (POISON DOT)
        """
        battle = self.engine.battle
        if battle is None:
            return

        tile = battle.arena_tiles[y][x]

        # Lava (~): immediate damage + burn DOT (v6.0.5: pulse amplifies)
        if tile == '~':
            pulse_amp = self._get_pulse_amplification()
            damage = int(5 * pulse_amp)
            burn_dot = int(3 * pulse_amp)
            entity.hp -= damage
            entity.add_status({
                'name': 'burn',
                'duration': 2,
                'damage_per_tick': burn_dot,
            })
            if entity.is_player:
                self.engine.add_message(f"The lava burns! (-{damage} HP)")

            if self.events:
                self.events.emit(
                    EventType.DAMAGE_NUMBER,
                    x=x, y=y,
                    amount=damage
                )

        # Ice (=): FREEZE movement penalty (slide deferred)
        elif tile == '=':
            entity.add_status({
                'name': 'freeze',
                'duration': 2,
                'speed_mod': 0.5,
            })
            if entity.is_player:
                self.engine.add_message("The ice freezes your movement! (Slowed)")

        # Deep Water (≈): FREEZE movement penalty
        elif tile == '≈':
            entity.add_status({
                'name': 'freeze',
                'duration': 2,
                'speed_mod': 0.5,
            })
            if entity.is_player:
                self.engine.add_message("You wade through deep water. (Slowed)")

        # Poison Gas (!): POISON DOT (v6.0.5: pulse amplifies)
        elif tile == '!':
            pulse_amp = self._get_pulse_amplification()
            poison_dot = int(2 * pulse_amp)
            entity.add_status({
                'name': 'poison',
                'duration': 3,
                'damage_per_tick': poison_dot,
            })
            if entity.is_player:
                self.engine.add_message("You inhale poison gas!")

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

        # Check player death
        if battle.player is None or battle.player.hp <= 0:
            self.end_battle(BattleOutcome.DEFEAT)
            return True

        # Check all enemies dead
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

    def _apply_victory_results(self, battle: BattleState) -> None:
        """
        Apply battle victory results to world state (v6.0.5).

        - Sync player HP from battle
        - Remove defeated enemies from world
        - Award XP for each killed enemy (2x for elites)
        - Increment player kills and ledger stats
        - Drop loot (deterministic where possible)
        - Handle boss victory (route to victory flow if floor 8)
        """
        from ..core.constants import ELITE_XP_MULTIPLIER, BOSS_LOOT, GameState
        from ..items import create_item

        player = self.engine.player

        # Sync player HP
        if battle.player:
            player.health = battle.player.hp

        total_xp = 0
        boss_defeated = None

        # Process each enemy (both initial and reinforcements that joined)
        for battle_enemy in battle.enemies:
            if battle_enemy.hp <= 0:
                # Get world enemy for stats
                world_enemy = self._get_enemy_by_id(battle_enemy.entity_id)

                if world_enemy:
                    # Increment kills
                    player.kills += 1

                    # Track in completion ledger
                    if hasattr(self.engine, 'completion_ledger') and self.engine.completion_ledger:
                        self.engine.completion_ledger.record_kill(
                            is_elite=getattr(world_enemy, 'is_elite', False)
                        )

                    # Award XP
                    base_xp = getattr(world_enemy, 'xp_reward', 10)
                    is_elite = getattr(world_enemy, 'is_elite', False)
                    xp_award = base_xp * ELITE_XP_MULTIPLIER if is_elite else base_xp

                    # Apply Human's Adaptive trait (+10% XP)
                    xp_mult = player.get_xp_multiplier() if hasattr(player, 'get_xp_multiplier') else 1.0
                    xp_award = int(xp_award * xp_mult)
                    total_xp += xp_award

                    # Check if boss
                    if getattr(world_enemy, 'is_boss', False):
                        boss_defeated = world_enemy

                        # Track warden defeat
                        if hasattr(self.engine, 'completion_ledger') and self.engine.completion_ledger:
                            boss_type_name = world_enemy.boss_type.name if world_enemy.boss_type else "UNKNOWN"
                            self.engine.completion_ledger.record_warden_defeated(boss_type_name)

                # Remove from world
                self._remove_enemy_from_world(battle_enemy.entity_id)

        # Award total XP
        if total_xp > 0:
            leveled_up = player.gain_xp(total_xp)
            self.engine.add_message(f"Gained {total_xp} XP!")
            if leveled_up:
                self.engine.add_message(f"LEVEL UP! Now level {player.level}!")

        # Drop boss loot if boss was defeated
        if boss_defeated:
            self._drop_boss_loot(boss_defeated)

            # Check for game victory (floor 8 boss)
            if battle.floor_level >= 8:
                self.engine.add_message("*** THE DRAGON EMPEROR HAS FALLEN! ***")
                # v6.0.5: Preserve ledger/codex before clearing autosave
                self._persist_victory_data()
                from ..data import delete_save
                delete_save()
                self.engine.state = GameState.VICTORY

        # Also remove any reinforcements that arrived and were killed
        # (already handled above since they're added to battle.enemies)

    def _persist_victory_data(self) -> None:
        """Persist ledger and codex data for legacy/ghost system (v6.0.5).

        Called before deleting autosave on victory to preserve:
        - Completion ledger (for legacy calculation)
        - Bestiary entries (for codex)
        - Ghost imprint data (for future runs)
        """
        import json
        import os
        from datetime import datetime

        victory_data = {
            'timestamp': datetime.now().isoformat(),
            'floor_reached': self.engine.current_level,
            'player_level': self.engine.player.level if self.engine.player else 0,
            'turns': self.engine.turn,
        }

        # Include completion ledger if available
        if hasattr(self.engine, 'completion_ledger') and self.engine.completion_ledger:
            victory_data['ledger'] = self.engine.completion_ledger.to_dict()

        # Include bestiary/codex if available
        if hasattr(self.engine, 'story_manager') and self.engine.story_manager:
            if hasattr(self.engine.story_manager, 'get_codex_state'):
                victory_data['codex'] = self.engine.story_manager.get_codex_state()

        # Save to victory file (append to list of victories)
        victory_file = "victories.json"
        victories = []
        if os.path.exists(victory_file):
            try:
                with open(victory_file, 'r') as f:
                    victories = json.load(f)
            except (json.JSONDecodeError, IOError):
                victories = []

        victories.append(victory_data)

        try:
            with open(victory_file, 'w') as f:
                json.dump(victories, f, indent=2)
        except IOError as e:
            # Non-fatal - just log
            print(f"Warning: Could not persist victory data: {e}")

    def _drop_boss_loot(self, boss) -> None:
        """Drop loot from a defeated boss at player's position."""
        from ..core.constants import BOSS_LOOT
        from ..items import create_item

        if not boss or not hasattr(boss, 'boss_type'):
            return

        loot_names = BOSS_LOOT.get(boss.boss_type, [])
        if not loot_names:
            return

        player = self.engine.player
        drop_x, drop_y = player.x, player.y
        dropped_count = 0

        for loot_name in loot_names:
            from ..items import ItemType
            try:
                item_type = ItemType[loot_name]
            except KeyError:
                continue

            # Offset items slightly
            offset_x = dropped_count % 3 - 1
            offset_y = dropped_count // 3
            item = create_item(item_type, drop_x + offset_x, drop_y + offset_y)
            self.engine.entity_manager.add_item(item)
            self.engine.add_message(f"The {boss.name} dropped {item.name}!")
            dropped_count += 1

    def _apply_defeat_results(self, battle: BattleState) -> None:
        """Apply battle defeat results - player dies."""
        from ..core.constants import GameState
        self.engine.player.health = 0
        self.engine.state = GameState.DEAD

    def _apply_flee_results(self, battle: BattleState) -> None:
        """
        Apply flee results - player escapes, enemies remain.

        Flee semantics (v6.0.4):
        - Sync player HP (may have taken damage before fleeing)
        - Push player back from encounter origin so not standing on enemy
        - Enemies remain in world (not removed)
        - Track battles_escaped in ledger
        """
        # Sync player HP
        if battle.player:
            self.engine.player.health = battle.player.hp

        # Push player back from encounter origin
        origin_x, origin_y = battle.encounter_origin
        player = self.engine.player

        # Find a safe tile adjacent to origin (not occupied by enemy)
        safe_pos = self._find_safe_flee_position(origin_x, origin_y)
        if safe_pos:
            player.x, player.y = safe_pos
        # else: player stays at original position (enemies will be adjacent)

        # v6.0.5: Track battles_escaped in completion ledger
        if hasattr(self.engine, 'completion_ledger') and self.engine.completion_ledger:
            self.engine.completion_ledger.record_battle_escaped()

        # v6.0.5.4: Check Oathstone vow violation if fleeing from boss
        self._check_flee_vow_violation(battle)

    def _check_champion_assist(self, player: BattleEntity) -> None:
        """Check if a Champion ghost should provide combat assistance (v6.0.5.5).

        If player's health drops below 30% and there's a Champion ghost
        that hasn't used its assist, grant a small heal.
        """
        # Only trigger when health drops below 30%
        if player.hp >= player.max_hp * 0.3:
            return

        # Check for ghost manager and Champion ghost
        if not hasattr(self.engine, 'ghost_manager') or not self.engine.ghost_manager:
            return

        from ..entities.ghosts import GhostType

        for ghost in self.engine.ghost_manager.ghosts:
            if ghost.ghost_type == GhostType.CHAMPION and not ghost.assist_used:
                # Use the assist
                ghost.assist_used = True
                ghost.triggered = True

                # Grant heal
                heal_amount = 5
                player.hp = min(player.hp + heal_amount, player.max_hp)

                # Also heal the world player entity
                if self.engine.player:
                    # Note: battle player HP will be synced at battle end

                    self.engine.add_message(
                        "A Champion's imprint surges! (+5 HP)"
                    )

                if self.events:
                    self.events.emit(
                        EventType.BUFF_FLASH,
                        entity=player
                    )

                # Only one Champion can assist
                break

    def _check_archivist_reveal(self, battle: BattleState) -> None:
        """Check if an Archivist ghost should reveal battle info (v6.0.5).

        At battle start, Archivist reveals reinforcement edges and safe tiles.
        One-time use per battle.
        """
        if not hasattr(self.engine, 'ghost_manager') or not self.engine.ghost_manager:
            return

        from ..entities.ghosts import GhostType

        for ghost in self.engine.ghost_manager.ghosts:
            if ghost.ghost_type == GhostType.ARCHIVIST and not ghost.triggered:
                ghost.triggered = True

                # Reveal safe tiles (similar to woundglass but automatic)
                safe_tiles = []
                for y in range(battle.arena_height):
                    for x in range(battle.arena_width):
                        tile = battle.arena_tiles[y][x]
                        if tile != '.':
                            continue
                        # Check distance from reinforcement edges
                        min_edge_dist = float('inf')
                        for edge_x, edge_y in battle.reinforcement_edges:
                            dist = manhattan_distance(x, y, edge_x, edge_y)
                            min_edge_dist = min(min_edge_dist, dist)
                        if min_edge_dist >= 3:
                            safe_tiles.append((x, y))

                battle.safe_tiles_revealed = safe_tiles
                self.engine.add_message(
                    "An Archivist's mark reveals the battlefield..."
                )
                break

    def _check_beacon_guidance(self, battle: BattleState) -> None:
        """Check if a Beacon ghost should provide guidance (v6.0.5).

        Points player away from next reinforcement entry.
        """
        if not hasattr(self.engine, 'ghost_manager') or not self.engine.ghost_manager:
            return

        from ..entities.ghosts import GhostType

        for ghost in self.engine.ghost_manager.ghosts:
            if ghost.ghost_type == GhostType.BEACON and not ghost.triggered:
                if not battle.reinforcements:
                    continue

                ghost.triggered = True

                # Find the next reinforcement's entry edge
                next_reinf = min(battle.reinforcements, key=lambda r: r.turns_until_arrival)
                # Find closest edge to that reinforcement's world position
                closest_edge = None
                min_dist = float('inf')
                for edge_x, edge_y in battle.reinforcement_edges:
                    dist = manhattan_distance(
                        edge_x, edge_y,
                        next_reinf.world_x % battle.arena_width,
                        next_reinf.world_y % battle.arena_height
                    )
                    if dist < min_dist:
                        min_dist = dist
                        closest_edge = (edge_x, edge_y)

                if closest_edge:
                    # Calculate direction away from that edge
                    player = battle.player
                    dx = player.arena_x - closest_edge[0]
                    dy = player.arena_y - closest_edge[1]
                    direction = ""
                    if dy < 0:
                        direction += "north"
                    elif dy > 0:
                        direction += "south"
                    if dx < 0:
                        direction += "west"
                    elif dx > 0:
                        direction += "east"
                    if direction:
                        self.engine.add_message(
                            f"A guiding light pulses toward the {direction}..."
                        )
                break

    def _check_flee_vow_violation(self, battle: BattleState) -> None:
        """Check if fleeing from battle breaks an Oathstone vow (v6.0.5.4).

        If player has SLAY_WARDEN vow and flees from a boss fight,
        the vow is broken and penalties apply.
        """
        # Only matters if fleeing from boss
        is_boss_fight = any(
            enemy.entity_id.startswith('boss_') or
            getattr(self._get_enemy_by_id(enemy.entity_id), 'is_boss', False)
            for enemy in battle.enemies
        )
        if not is_boss_fight:
            return

        # Check for Oathstone with SLAY_WARDEN vow
        if hasattr(self.engine, 'artifact_manager') and self.engine.artifact_manager:
            artifact = self.engine.artifact_manager.floor_artifact
            if artifact:
                from ..items.artifacts import ArtifactId, VowType, check_vow_violation
                if artifact.artifact_id == ArtifactId.OATHSTONE:
                    violation_msg = check_vow_violation(artifact, 'flee', self.engine)
                    if violation_msg:
                        self.engine.add_message(violation_msg)

    def _find_safe_flee_position(self, origin_x: int, origin_y: int) -> Optional[Tuple[int, int]]:
        """
        Find a safe position for player to flee to, away from enemies.

        Checks adjacent tiles to origin, preferring tiles away from enemies
        and ensuring tile is walkable and not occupied.
        """
        if not self.engine.dungeon:
            return None

        # Get adjacent tiles
        directions = [(-1, 0), (1, 0), (0, -1), (0, 1), (-1, -1), (-1, 1), (1, -1), (1, 1)]
        candidates = []

        for dx, dy in directions:
            nx, ny = origin_x + dx, origin_y + dy

            # Check walkable
            if not self.engine.dungeon.is_walkable(nx, ny):
                continue

            # Check not occupied by enemy
            occupied = False
            for enemy in self.engine.entity_manager.enemies:
                if enemy.x == nx and enemy.y == ny:
                    occupied = True
                    break

            if not occupied:
                candidates.append((nx, ny))

        # Return first valid candidate (could prioritize by distance from enemies)
        return candidates[0] if candidates else None

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
                symbol=getattr(enemy, 'symbol', ''),
            )
            reinforcements.append(reinforcement)

        # Sort by arrival time (soonest first)
        reinforcements.sort(key=lambda r: r.turns_until_arrival)

        return reinforcements

    def _calculate_arrival_turns(self, distance: int) -> int:
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
        if self._is_pulse_active():
            pulse_amp = self._get_pulse_amplification()
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
