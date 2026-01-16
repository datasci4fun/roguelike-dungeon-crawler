"""Enemy turn processing for tactical battles (v6.2).

Handles:
- Enemy AI decision making
- Boss ability execution
- Enemy attack resolution
"""
from typing import TYPE_CHECKING, Optional

from .battle_types import BattleState, BattleEntity
from .battle_actions import BattleAction, create_status_effect
from .ai_scoring import choose_action, get_enemy_ai_type, execute_ai_action, CandidateType
from .boss_heuristics import get_boss_action_with_fallback
from .dnd_combat import make_attack_roll, make_damage_roll
from ..core.constants import BossType
from ..core.events import EventType

if TYPE_CHECKING:
    from ..core.engine import GameEngine
    from ..core.events import EventQueue


class EnemyTurnProcessor:
    """Processes enemy turns in tactical battles."""

    def __init__(self, engine: 'GameEngine', events: 'EventQueue' = None):
        self.engine = engine
        self.events = events
        self._hazard_handler = None  # Set by BattleManager

    def set_hazard_handler(self, handler):
        """Set the hazard handler for tile effects."""
        self._hazard_handler = handler

    def get_pulse_amplification(self) -> float:
        """Get current field pulse amplification (v6.0.5)."""
        if hasattr(self.engine, 'field_pulse_manager') and self.engine.field_pulse_manager:
            return self.engine.field_pulse_manager.get_current_amplification()
        return 1.0

    def process_enemy_turns(self, battle: BattleState) -> None:
        """Process all enemy actions with per-enemy turn events (v6.9)."""
        if battle is None:
            return

        living_enemies = battle.get_living_enemies()
        total_enemies = len(living_enemies)

        for idx, enemy in enumerate(living_enemies):
            if enemy.hp <= 0:
                continue

            # v6.9: Emit turn start event for visible turn sequencing
            if self.events is not None:
                self.events.emit(
                    EventType.ENEMY_TURN_START,
                    enemy_id=enemy.entity_id,
                    enemy_name=enemy.name or 'Enemy',
                    turn_index=idx,
                    total_enemies=total_enemies
                )

            self._enemy_take_turn(battle, enemy)

            # v6.9: Emit turn end event
            if self.events is not None:
                self.events.emit(
                    EventType.ENEMY_TURN_END,
                    enemy_id=enemy.entity_id
                )

    def _enemy_take_turn(self, battle: BattleState, enemy: BattleEntity) -> None:
        """Execute a single enemy's turn using v6.2 AI scoring system."""
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
        self._execute_enemy_action(battle, enemy, player, action)

    def _get_boss_type(self, enemy: BattleEntity) -> Optional[BossType]:
        """Get boss type for an enemy entity, or None if not a boss."""
        if not hasattr(self.engine, 'entity_manager'):
            return None

        for world_enemy in self.engine.entity_manager.enemies:
            if str(id(world_enemy)) == enemy.entity_id:
                if getattr(world_enemy, 'is_boss', False):
                    return getattr(world_enemy, 'boss_type', None)
        return None

    def _execute_enemy_action(
        self,
        battle: BattleState,
        enemy: BattleEntity,
        player: BattleEntity,
        action
    ) -> None:
        """Execute a chosen enemy action (v6.2 unified action handler)."""
        if action.action_type == CandidateType.ATTACK:
            # v6.9: Emit attack event before executing
            if self.events is not None:
                self.events.emit(
                    EventType.ENEMY_ATTACK,
                    enemy_id=enemy.entity_id,
                    target_id=player.entity_id,
                    from_x=enemy.arena_x,
                    from_y=enemy.arena_y,
                    to_x=player.arena_x,
                    to_y=player.arena_y
                )
            self._execute_enemy_attack(battle, enemy, player)

        elif action.action_type == CandidateType.MOVE:
            old_x, old_y = enemy.arena_x, enemy.arena_y
            new_x, new_y = execute_ai_action(battle, enemy, action)
            if (new_x, new_y) != (old_x, old_y):
                # v6.9: Emit move event before updating position
                if self.events is not None:
                    self.events.emit(
                        EventType.ENEMY_MOVE,
                        enemy_id=enemy.entity_id,
                        from_x=old_x,
                        from_y=old_y,
                        to_x=new_x,
                        to_y=new_y
                    )
                enemy.arena_x = new_x
                enemy.arena_y = new_y
                # Check hazards on the new tile
                if self._hazard_handler:
                    self._hazard_handler.check_tile_hazards(enemy, new_x, new_y)

        elif action.action_type == CandidateType.ABILITY:
            self._execute_boss_ability(battle, enemy, player, action)

        # WAIT does nothing (enemy skips turn)

    def _execute_enemy_attack(
        self,
        battle: BattleState,
        enemy: BattleEntity,
        player: BattleEntity
    ) -> None:
        """Execute an enemy's attack on the player using D&D dice mechanics."""
        enemy_name = getattr(enemy, 'name', 'Enemy') or 'Enemy'

        # Check if player has ability scores (use D&D combat)
        use_dnd_combat = False
        player_ac = 10

        if self.engine.player and hasattr(self.engine.player, 'ability_scores'):
            if self.engine.player.ability_scores:
                use_dnd_combat = True
                player_ac = getattr(self.engine.player, 'armor_class', 10)

        if use_dnd_combat:
            # D&D-style attack: d20 + attack_bonus vs player AC
            enemy_attack_bonus = getattr(enemy, 'attack_bonus', enemy.attack // 3)
            enemy_damage_dice = getattr(enemy, 'damage_dice', '1d6')

            # Make attack roll
            attack_roll = make_attack_roll(
                attacker_attack_mod=enemy_attack_bonus,
                target_ac=player_ac,
                luck_modifier=0.0,
                proficiency_bonus=0
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
                    target_ac=player_ac,
                    is_hit=attack_roll.is_hit,
                    is_critical=attack_roll.is_critical,
                    is_fumble=attack_roll.is_fumble,
                    luck_applied=attack_roll.luck_applied,
                    attacker_name=enemy_name
                )

            if attack_roll.is_fumble:
                self.engine.add_message(f"{enemy_name} fumbled their attack!")
                return

            if not attack_roll.is_hit:
                self.engine.add_message(
                    f"{enemy_name} missed! ({attack_roll.total} vs AC {player_ac})"
                )
                return

            # Hit! Roll damage
            damage_mod = enemy.attack // 4  # Scale damage modifier with enemy attack
            damage_roll = make_damage_roll(
                weapon_dice=enemy_damage_dice,
                damage_mod=damage_mod,
                is_critical=attack_roll.is_critical,
                luck_modifier=0.0
            )

            # v6.0.5: Pulse amplifies enemy damage
            pulse_amp = self.get_pulse_amplification()
            damage = max(1, int(damage_roll.total * pulse_amp))

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
                    attacker_name=enemy_name
                )

            player.hp -= damage

            if self.events is not None:
                self.events.emit(
                    EventType.DAMAGE_NUMBER,
                    x=player.arena_x,
                    y=player.arena_y,
                    amount=damage
                )
                self.events.emit(EventType.HIT_FLASH, entity=player)

            if attack_roll.is_critical:
                self.engine.add_message(f"CRITICAL! {enemy_name} hits you for {damage}!")
            else:
                self.engine.add_message(f"{enemy_name} hits you for {damage}!")
        else:
            # Fallback: Original simple damage calculation
            defense = player.get_effective_defense()
            base_damage = max(1, enemy.attack - defense)
            pulse_amp = self.get_pulse_amplification()
            damage = int(base_damage * pulse_amp)
            player.hp -= damage

            if self.events is not None:
                self.events.emit(
                    EventType.DAMAGE_NUMBER,
                    x=player.arena_x,
                    y=player.arena_y,
                    amount=damage
                )
                self.events.emit(EventType.HIT_FLASH, entity=player)

            self.engine.add_message(f"Enemy hits you for {damage}!")

        if player.hp <= 0:
            self.engine.add_message("You have fallen in battle!")

    def _execute_boss_ability(
        self,
        battle: BattleState,
        boss: BattleEntity,
        player: BattleEntity,
        action
    ) -> None:
        """Execute a boss's special ability (v6.2 Slice 3)."""
        ability_action = action.battle_action

        if ability_action is None:
            return

        # Set cooldown for the ability
        from .battle_actions import (
            REGENT_ABILITIES, RAT_KING_ABILITIES, SPIDER_QUEEN_ABILITIES,
            FROST_GIANT_ABILITIES, ARCANE_KEEPER_ABILITIES, FLAME_LORD_ABILITIES,
            DRAGON_EMPEROR_ABILITIES
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

    def _boss_summon_minions(self, boss: BattleEntity, ability: BattleAction) -> None:
        """Handle boss summon abilities."""
        summon_count = 1
        if ability == BattleAction.ROYAL_DECREE:
            summon_count = 2
        elif ability == BattleAction.SUMMON_SWARM:
            summon_count = 2

        self.engine.add_message(f"Boss summons reinforcements!")
        # Note: Actual minion spawning would require integration with reinforcement system

    def _boss_attack_ability(
        self,
        boss: BattleEntity,
        player: BattleEntity,
        ability: BattleAction,
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

        if self.events is not None:
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
            self.engine.add_message("You have fallen in battle!")

    def _boss_control_ability(
        self,
        boss: BattleEntity,
        player: BattleEntity,
        ability: BattleAction,
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

    def _boss_create_hazard(self, boss: BattleEntity, ability: BattleAction) -> None:
        """Handle boss hazard creation abilities."""
        self.engine.add_message(f"Boss creates hazardous terrain!")
        # Note: Actual lava tile creation would modify battle.arena_tiles


def move_enemy_toward_player(
    battle: BattleState,
    enemy: BattleEntity,
    player: BattleEntity
) -> None:
    """Move enemy one step toward player (legacy fallback, replaced by v6.2 AI)."""
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
