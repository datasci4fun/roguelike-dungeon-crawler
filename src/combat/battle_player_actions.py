"""Player action execution for tactical battles.

Handles player movement, attacks, abilities, and item use during battle.
"""
from typing import TYPE_CHECKING, Tuple, Optional

from .battle_types import BattleState, BattleEntity, BattleOutcome
from .battle_actions import (
    AbilityDef, BattleAction,
    get_class_abilities, get_valid_attack_targets,
    manhattan_distance, create_status_effect
)
from .dnd_combat import make_attack_roll, make_damage_roll, calculate_proficiency_bonus, WEAPON_DAMAGE_DICE
from ..core.events import EventType

if TYPE_CHECKING:
    from ..core.engine import GameEngine
    from ..core.events import EventQueue


class PlayerActionHandler:
    """Handles player actions during battle."""

    def __init__(self, engine: 'GameEngine', event_queue: 'EventQueue' = None):
        self.engine = engine
        self.events = event_queue
        self._reinforcement_mgr = None
        self._round_processor = None

    def set_managers(self, reinforcement_mgr, round_processor):
        """Wire up manager dependencies."""
        self._reinforcement_mgr = reinforcement_mgr
        self._round_processor = round_processor

    def try_player_move(self, battle: BattleState, dx: int, dy: int,
                        end_turn_callback, entity_death_callback) -> bool:
        """Try to move player in direction. If enemy present, attack instead.

        Args:
            battle: Current battle state
            dx, dy: Direction delta
            end_turn_callback: Called to end turn (can be None for no auto-end)
            entity_death_callback: Called when entity dies

        v6.11: end_turn_callback can be None to allow movement without ending turn.
        """
        player = battle.player

        new_x = player.arena_x + dx
        new_y = player.arena_y + dy

        # v6.11: Check for enemy at target - DON'T auto-attack, just block
        target = battle.get_entity_at(new_x, new_y)
        if target and not target.is_player and target.hp > 0:
            self.engine.add_message("Can't move into enemy! Use ATTACK command.")
            return False

        if not battle.is_tile_walkable(new_x, new_y):
            self.engine.add_message("Can't move there.")
            return False

        if battle.get_entity_at(new_x, new_y) is not None:
            self.engine.add_message("Space is occupied.")
            return False

        player.arena_x = new_x
        player.arena_y = new_y

        if self._reinforcement_mgr:
            self._reinforcement_mgr.add_noise(battle, 'move')

        if self._round_processor:
            self._round_processor.check_tile_hazards(player, new_x, new_y)

        # v6.11: Only end turn if callback provided
        if end_turn_callback:
            end_turn_callback()
        return True

    def try_basic_attack(self, battle: BattleState, target_pos: Tuple[int, int],
                         end_turn_callback, entity_death_callback) -> bool:
        """Try to attack an adjacent enemy."""
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
                return self.execute_attack(battle, player, target, basic_attack.damage_mult,
                                           end_turn_callback, entity_death_callback)
            else:
                self.engine.add_message("Invalid target.")
                return False

        target = targets[0]
        return self.execute_attack(battle, player, target, basic_attack.damage_mult,
                                   end_turn_callback, entity_death_callback)

    def try_use_ability(self, battle: BattleState, ability_index: int,
                        target_pos: Tuple[int, int],
                        end_turn_callback, entity_death_callback) -> bool:
        """Try to use a class ability."""
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

        if ability.self_buff:
            return self.execute_self_buff(battle, player, ability, end_turn_callback)

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

        return self.execute_ability(battle, player, target, ability,
                                    end_turn_callback, entity_death_callback)

    def execute_attack(self, battle: BattleState, attacker: BattleEntity,
                       target: BattleEntity, damage_mult: float,
                       end_turn_callback, entity_death_callback) -> bool:
        """Execute a basic attack against a target using D&D dice mechanics."""
        # Get attacker name for messages
        attacker_name = "You" if attacker.is_player else getattr(attacker, 'name', 'Enemy')

        # Check if we should use D&D dice combat (player has ability scores)
        use_dnd_combat = False
        attack_mod = 0
        damage_mod = 0
        luck_mod = 0.0
        weapon_dice = "1d6"

        if attacker.is_player and self.engine.player:
            player = self.engine.player
            if hasattr(player, 'ability_scores') and player.ability_scores:
                use_dnd_combat = True
                luck_mod = player.get_luck_mod() * 0.05  # 5% per luck point above 10

                # Get weapon and determine stat used
                weapon = getattr(player, 'equipped_weapon', None)
                if weapon:
                    # Use weapon's damage dice if available
                    weapon_dice = getattr(weapon, 'damage_dice', None) or "1d6"

                    # Check stat_used for finesse weapons
                    stat_used = getattr(weapon, 'stat_used', 'STR')
                    if stat_used == "DEX":
                        attack_mod = player.ability_scores.dex_mod
                        damage_mod = player.ability_scores.dex_mod
                    else:
                        attack_mod = player.ability_scores.str_mod
                        damage_mod = player.ability_scores.str_mod
                else:
                    # Unarmed attack (fist)
                    weapon_dice = "1d4"
                    attack_mod = player.ability_scores.str_mod
                    damage_mod = player.ability_scores.str_mod

        if use_dnd_combat:
            # D&D-style attack: d20 + modifier vs AC
            target_ac = getattr(target, 'armor_class', 10 + target.get_effective_defense())

            # Calculate proficiency bonus based on player level
            player_level = getattr(player, 'level', 1)
            prof_bonus = calculate_proficiency_bonus(player_level)

            # Make attack roll
            attack_roll = make_attack_roll(
                attacker_attack_mod=attack_mod,
                target_ac=target_ac,
                luck_modifier=luck_mod,
                proficiency_bonus=prof_bonus
            )

            # Emit DICE_ROLL event for attack
            if self.events is not None:
                self.events.emit(
                    EventType.DICE_ROLL,
                    roll_type='attack',
                    dice_notation='1d20',
                    rolls=[attack_roll.d20_roll],
                    modifier=attack_roll.modifier,
                    total=attack_roll.total,
                    target_ac=target_ac,
                    is_hit=attack_roll.is_hit,
                    is_critical=attack_roll.is_critical,
                    is_fumble=attack_roll.is_fumble,
                    luck_applied=attack_roll.luck_applied,
                    attacker_name=attacker_name
                )

            if attack_roll.is_fumble:
                self.engine.add_message(f"{attacker_name} fumbled! (Natural 1)")
                if end_turn_callback:
                    end_turn_callback()
                return True

            if not attack_roll.is_hit:
                self.engine.add_message(
                    f"{attacker_name} missed! ({attack_roll.total} vs AC {target_ac})"
                )
                if end_turn_callback:
                    end_turn_callback()
                return True

            # Hit! Roll damage
            damage_roll = make_damage_roll(
                weapon_dice=weapon_dice,
                damage_mod=damage_mod,
                is_critical=attack_roll.is_critical,
                luck_modifier=luck_mod
            )

            # Apply damage multiplier from ability
            damage = max(1, int(damage_roll.total * damage_mult))

            # Emit DICE_ROLL event for damage
            if self.events is not None:
                self.events.emit(
                    EventType.DICE_ROLL,
                    roll_type='damage',
                    dice_notation=damage_roll.dice_notation,
                    rolls=damage_roll.dice_rolls,
                    modifier=damage_roll.modifier,
                    total=damage,
                    is_critical=damage_roll.is_critical,
                    luck_applied=damage_roll.luck_applied,
                    attacker_name=attacker_name
                )

            target.hp -= damage

            if self.events is not None:
                self.events.emit(
                    EventType.DAMAGE_NUMBER,
                    x=target.arena_x,
                    y=target.arena_y,
                    amount=damage
                )
                self.events.emit(EventType.HIT_FLASH, entity=target)

            if attack_roll.is_critical:
                self.engine.add_message(f"CRITICAL HIT! {attacker_name} deals {damage} damage!")
            else:
                self.engine.add_message(f"{attacker_name} hit for {damage} damage!")
        else:
            # Fallback: Original simple damage calculation
            base_damage = attacker.attack
            defense = target.get_effective_defense()
            damage = max(1, int(base_damage * damage_mult) - defense)

            target.hp -= damage

            if self.events is not None:
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
            entity_death_callback(target)

        if self._reinforcement_mgr:
            self._reinforcement_mgr.add_noise(battle, 'attack')

        # v6.11: Only end turn if callback provided
        if end_turn_callback:
            end_turn_callback()
        return True

    def execute_ability(self, battle: BattleState, caster: BattleEntity,
                        target: BattleEntity, ability: AbilityDef,
                        end_turn_callback, entity_death_callback) -> bool:
        """Execute a targeted ability."""
        damage = 0
        damage_mult = ability.damage_mult

        if ability.action == BattleAction.SMITE:
            if self._is_target_undead(target):
                damage_mult *= 1.5
                self.engine.add_message("Smite is effective against undead!")

        if damage_mult > 0:
            base_damage = caster.attack
            defense = target.get_effective_defense()
            damage = max(1, int(base_damage * damage_mult) - defense)
            target.hp -= damage

            if self.events is not None:
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
            self._apply_aoe(battle, caster, target.arena_x, target.arena_y, ability,
                           entity_death_callback)

        if ability.cooldown > 0:
            caster.cooldowns[ability.name] = ability.cooldown

        self.engine.add_message(f"Used {ability.name}!" + (f" {damage} damage!" if damage > 0 else ""))

        if target.hp <= 0:
            entity_death_callback(target)

        noise_type = 'spell' if ability.cooldown > 0 else 'attack'
        if self._reinforcement_mgr:
            self._reinforcement_mgr.add_noise(battle, noise_type)

        # v6.11: Only end turn if callback provided
        if end_turn_callback:
            end_turn_callback()
        return True

    def execute_self_buff(self, battle: BattleState, caster: BattleEntity,
                          ability: AbilityDef, end_turn_callback) -> bool:
        """Execute a self-targeting buff ability."""
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

        if self._reinforcement_mgr:
            self._reinforcement_mgr.add_noise(battle, 'spell')

        # v6.11: Only end turn if callback provided
        if end_turn_callback:
            end_turn_callback()
        return True

    def _apply_aoe(self, battle: BattleState, caster: BattleEntity,
                   center_x: int, center_y: int, ability: AbilityDef,
                   entity_death_callback) -> None:
        """Apply AoE damage/effects around a center point."""
        for enemy in battle.enemies:
            if enemy.hp <= 0:
                continue

            dist = manhattan_distance(center_x, center_y, enemy.arena_x, enemy.arena_y)
            if dist > 0 and dist <= ability.aoe_radius:
                aoe_damage = max(1, int(caster.attack * ability.damage_mult * 0.5))
                enemy.hp -= aoe_damage

                if self.events is not None:
                    self.events.emit(
                        EventType.DAMAGE_NUMBER,
                        x=enemy.arena_x,
                        y=enemy.arena_y,
                        amount=aoe_damage
                    )

                if enemy.hp <= 0:
                    entity_death_callback(enemy)

    def _is_target_undead(self, target: BattleEntity) -> bool:
        """Check if a battle entity is undead (for Smite bonus)."""
        enemy = self._get_enemy_by_id(target.entity_id)
        if enemy and hasattr(enemy, 'enemy_type'):
            type_name = enemy.enemy_type.name if enemy.enemy_type else ''
            undead_types = {'SKELETON', 'ZOMBIE', 'GHOST', 'WRAITH', 'LICH', 'VAMPIRE'}
            return type_name.upper() in undead_types
        return False

    def _get_enemy_by_id(self, enemy_id: str):
        """Get enemy entity by ID from entity manager."""
        for enemy in self.engine.entity_manager.enemies:
            if id(enemy) == int(enemy_id):
                return enemy
        return None

    def try_use_item(self, battle: BattleState, item_index: int,
                     end_turn_callback) -> bool:
        """Try to use a consumable item in battle."""
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

                if self.events is not None:
                    self.events.emit(
                        EventType.BUFF_FLASH,
                        entity=battle.player
                    )

        inventory.remove_item(item_index)
        # v6.11: Only end turn if callback provided
        if end_turn_callback:
            end_turn_callback()
        return True

    def use_woundglass(self, battle: BattleState) -> bool:
        """Activate Woundglass Shard in battle."""
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
