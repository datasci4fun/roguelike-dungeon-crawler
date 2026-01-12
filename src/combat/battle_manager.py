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
        if ability.damage_mult > 0:
            base_damage = caster.attack
            defense = target.get_effective_defense()
            damage = max(1, int(base_damage * ability.damage_mult) - defense)
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

    def _execute_self_buff(self, caster: BattleEntity, ability: AbilityDef) -> bool:
        """Execute a self-targeting buff ability."""
        # Apply effect to self
        if ability.effect and ability.effect_duration > 0:
            effect = create_status_effect(ability.effect, ability.effect_duration)
            if effect:
                caster.add_status(effect.to_dict())

        # Set cooldown
        if ability.cooldown > 0:
            caster.cooldowns[ability.name] = ability.cooldown

        self.engine.add_message(f"Used {ability.name}!")
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
        """Execute a single enemy's turn."""
        battle = self.engine.battle
        player = battle.player

        if player is None or player.hp <= 0:
            return

        # Check if adjacent to player (can attack)
        dist = manhattan_distance(
            enemy.arena_x, enemy.arena_y,
            player.arena_x, player.arena_y
        )

        if dist == 1:
            # Attack player
            defense = player.get_effective_defense()
            damage = max(1, enemy.attack - defense)
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

            if player.hp <= 0:
                self._handle_entity_death(player)
        else:
            # Move toward player
            self._enemy_move_toward_player(enemy)

    def _enemy_move_toward_player(self, enemy: BattleEntity) -> None:
        """Move enemy one step toward player."""
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
        """Check for hazards at tile and apply on-step effects."""
        battle = self.engine.battle
        if battle is None:
            return

        tile = battle.arena_tiles[y][x]

        # Water/swamp: slow
        if tile == '~':
            entity.add_status({
                'name': 'wet',
                'duration': 2,
                'speed_mod': 0.5,
            })
            if entity.is_player:
                self.engine.add_message("You wade through water. (Slowed)")

        # Lava: burn
        elif tile == 'L':
            damage = 5
            entity.hp -= damage
            entity.add_status({
                'name': 'burn',
                'duration': 2,
                'damage_per_tick': 3,
            })
            if entity.is_player:
                self.engine.add_message(f"The lava burns! (-{damage} HP)")

            if self.events:
                self.events.emit(
                    EventType.DAMAGE_NUMBER,
                    x=x, y=y,
                    amount=damage
                )

        # Ice: slide (simplified: no action)
        elif tile == 'I':
            if entity.is_player:
                self.engine.add_message("You slide on the ice!")

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
