"""Combat orchestration and damage flow."""
import random
from typing import TYPE_CHECKING, Optional

from ..entities import attack, get_combat_message
from ..entities.ai_behaviors import get_ai_action, tick_enemy_cooldowns
from ..core.constants import GameState, ELITE_XP_MULTIPLIER, BOSS_LOOT, AIBehavior
from ..core.events import EventType, EventQueue
from ..items import ItemType, create_item

if TYPE_CHECKING:
    from ..core.game import Game


# Mapping from boss loot strings to ItemTypes
LOOT_TYPE_MAP = {
    'iron_sword': ItemType.WEAPON_SWORD,
    'chain_mail': ItemType.ARMOR_CHAIN,
    'battle_axe': ItemType.WEAPON_AXE,
    'strength_potion': ItemType.STRENGTH_POTION,
    'plate_armor': ItemType.ARMOR_PLATE,
    'health_potion': ItemType.HEALTH_POTION,
    'teleport_scroll': ItemType.SCROLL_TELEPORT,
    'dragon_slayer': ItemType.WEAPON_DRAGON_SLAYER,  # Legendary weapon (+8 ATK)
    'dragon_scale': ItemType.ARMOR_DRAGON_SCALE,     # Legendary armor (+8 DEF)
}


class CombatManager:
    """Orchestrates combat between entities."""

    def __init__(self, game: 'Game', event_queue: EventQueue = None):
        self.game = game
        self.events = event_queue

    def try_move_or_attack(self, dx: int, dy: int) -> bool:
        """
        Attempt to move the player. Handle combat if moving into an enemy.

        Returns:
            True if an action was taken (move or attack), False otherwise
        """
        player = self.game.player
        new_x = player.x + dx
        new_y = player.y + dy

        # Check for enemy at target position
        enemy = self.game.entity_manager.get_enemy_at(new_x, new_y)
        if enemy:
            # Update facing direction when attacking
            player.facing = (dx, dy)
            self._player_attack_enemy(enemy)
            return True

        # Check if position is walkable
        if self.game.dungeon.is_walkable(new_x, new_y):
            # Update facing direction before moving
            player.facing = (dx, dy)

            player.move(dx, dy)

            # Update FOV after movement
            self.game.dungeon.update_fov(player.x, player.y)

            # Check for level transitions and item pickups
            self.game.level_manager.check_stairs()
            picked_item = self.game.entity_manager.check_item_pickup(player, self.game.add_message)

            # Show tutorial hints for item pickup
            if picked_item:
                self.game.show_hint("first_item")
                self.game.show_hint("inventory_hint")
                # Check if it's a lore item
                if hasattr(picked_item, 'lore_id'):
                    self.game.show_hint("first_lore")

            return True

        return False

    def _player_attack_enemy(self, enemy):
        """Handle player attacking an enemy."""
        player = self.game.player

        # Show combat hint on first attack
        self.game.show_hint("first_combat")

        # Show elite hint on first elite encounter
        if enemy.is_elite:
            self.game.show_hint("first_elite")

        # Show boss hint on first boss encounter
        if enemy.is_boss:
            self.game.show_hint("first_boss")

        damage, enemy_died = attack(player, enemy)

        # Use enemy name (with "Elite" prefix for elites, boss uses full name)
        if enemy.is_boss:
            enemy_name = f"The {enemy.name}"
        elif enemy.is_elite:
            enemy_name = f"Elite {enemy.name}"
        else:
            enemy_name = enemy.name
        message = get_combat_message("You", enemy_name, damage, enemy_died)
        self.game.add_message(message)

        # Emit combat events (renderer will consume these)
        if self.events is not None:
            self.events.emit_attack(player, enemy, damage, enemy_died)

        if enemy_died:
            player.kills += 1

            # Add blood stain to dungeon (world state change)
            self.game.dungeon.add_blood_stain(enemy.x, enemy.y)

            # Handle boss death specially
            if enemy.is_boss:
                self._handle_boss_death(enemy)
            else:
                # Award XP (2x for elites) and check for level up
                xp_award = enemy.xp_reward * ELITE_XP_MULTIPLIER if enemy.is_elite else enemy.xp_reward
                leveled_up = player.gain_xp(xp_award)

                if leveled_up:
                    self.game.add_message(f"LEVEL UP! You are now level {player.level}!")
                    self.game.add_message(f"HP: {player.max_health}, ATK: {player.attack_damage}")
                    self.game.show_hint("first_level_up")

    def _handle_boss_death(self, boss):
        """Handle boss death: XP, loot drops, and messages."""
        player = self.game.player

        # Victory message
        self.game.add_message(f"*** The {boss.name} has been defeated! ***")

        # Award XP (bosses have large XP built into BOSS_STATS)
        xp_award = boss.xp_reward
        self.game.add_message(f"You gained {xp_award} XP!")
        leveled_up = player.gain_xp(xp_award)

        if leveled_up:
            self.game.add_message(f"LEVEL UP! You are now level {player.level}!")
            self.game.add_message(f"HP: {player.max_health}, ATK: {player.attack_damage}")
            self.game.show_hint("first_level_up")

        # Drop guaranteed loot
        self._drop_boss_loot(boss)

        # Mark boss as defeated
        self.game.entity_manager.boss_defeated = True
        self.game.entity_manager.boss = None

    def _drop_boss_loot(self, boss):
        """Drop guaranteed loot from boss."""
        loot_names = BOSS_LOOT.get(boss.boss_type, [])

        if not loot_names:
            return

        # Drop items at boss position (spread around slightly)
        drop_x, drop_y = boss.x, boss.y
        dropped_count = 0

        for loot_name in loot_names:
            item_type = LOOT_TYPE_MAP.get(loot_name)
            if item_type:
                # Offset items slightly so they don't all stack
                offset_x = dropped_count % 3 - 1
                offset_y = dropped_count // 3
                item = create_item(item_type, drop_x + offset_x, drop_y + offset_y)
                self.game.entity_manager.add_item(item)
                self.game.add_message(f"The {boss.name} dropped {item.name}!")
                dropped_count += 1

    def process_enemy_turns(self):
        """Process all enemy turns."""
        for enemy in self.game.entity_manager.enemies:
            if not enemy.is_alive():
                continue

            # v4.0: Process status effects first
            effect_results = enemy.process_status_effects()
            for result in effect_results:
                if result.get('message'):
                    enemy_name = self._get_enemy_name(enemy)
                    self.game.add_message(f"{enemy_name}: {result['message']}")

            # Check if enemy died from status effects
            if not enemy.is_alive():
                self.game.player.kills += 1
                self.game.add_message(f"{self._get_enemy_name(enemy)} succumbed to their wounds!")
                continue

            # v4.0: Check if stunned (skip turn)
            if enemy.is_stunned():
                self.game.add_message(f"{self._get_enemy_name(enemy)} is stunned!")
                continue

            # Tick ability cooldowns
            tick_enemy_cooldowns(enemy)

            # Boss enemies use their own turn processing
            if enemy.is_boss:
                ability_result = enemy.process_boss_turn(
                    self.game.player,
                    self.game.dungeon,
                    self.game.entity_manager
                )
                if ability_result:
                    # Ability was used
                    used_ability, message, damage = ability_result
                    self.game.add_message(message)

                    # Check if player died from ability damage
                    if damage > 0 and not self.game.player.is_alive():
                        self.game.last_attacker_name = f"The {enemy.name}"
                        self.game.last_damage_taken = damage
                        self.game.state = GameState.DEAD
                        return

                    continue  # Boss used ability, skip normal movement
            else:
                # v4.0: Use AI behavior system for non-boss enemies
                move, ability_used, ability_message = get_ai_action(
                    enemy,
                    self.game.player,
                    self.game.dungeon,
                    self.game.entity_manager
                )

                # Handle ability usage
                if ability_used and ability_message:
                    self.game.add_message(ability_message)

                    # Check if player died from ability damage
                    if not self.game.player.is_alive():
                        self.game.last_attacker_name = self._get_enemy_name(enemy)
                        self.game.last_damage_taken = 0  # Damage tracked by ability
                        self.game.state = GameState.DEAD
                        return

                # Apply movement from AI
                if move:
                    dx, dy = move
                    if dx != 0 or dy != 0:
                        new_x = enemy.x + dx
                        new_y = enemy.y + dy

                        # Check if moving into player
                        if new_x == self.game.player.x and new_y == self.game.player.y:
                            self._enemy_attack_player(enemy)
                        else:
                            # Check if another enemy is at target position
                            if not self.game.entity_manager.get_enemy_at(new_x, new_y):
                                enemy.move(dx, dy)
                continue

            # Fallback for bosses that didn't use ability - standard movement
            dx, dy = enemy.get_move_toward_player(
                self.game.player.x,
                self.game.player.y,
                self.game.dungeon.is_walkable
            )

            if dx == 0 and dy == 0:
                continue

            new_x = enemy.x + dx
            new_y = enemy.y + dy

            # Check if moving into player
            if new_x == self.game.player.x and new_y == self.game.player.y:
                self._enemy_attack_player(enemy)
            else:
                # Check if another enemy is at target position
                if not self.game.entity_manager.get_enemy_at(new_x, new_y):
                    enemy.move(dx, dy)

    def _get_enemy_name(self, enemy) -> str:
        """Get display name for an enemy."""
        if enemy.is_boss:
            return f"The {enemy.name}"
        elif enemy.is_elite:
            return f"Elite {enemy.name}"
        return enemy.name

    def _enemy_attack_player(self, enemy):
        """Handle an enemy attacking the player."""
        player = self.game.player

        # Use enemy name (with "Elite" prefix for elites, "The" for bosses)
        if enemy.is_boss:
            enemy_name = f"The {enemy.name}"
        elif enemy.is_elite:
            enemy_name = f"Elite {enemy.name}"
        else:
            enemy_name = enemy.name

        # v4.0: Check for shield block
        if player.block_chance > 0 and random.random() < player.block_chance:
            self.game.add_message(f"You block {enemy_name}'s attack with your shield!")
            # Emit blocked event (no damage)
            if self.events is not None:
                self.events.emit_attack(enemy, player, 0, False)
            return

        # Use effective_damage for bosses (may have buffs)
        if enemy.is_boss:
            actual_damage = enemy.effective_damage
            damage = player.take_damage(actual_damage)
            player_died = not player.is_alive()
        else:
            damage, player_died = attack(enemy, player)

        message = get_combat_message(enemy_name, "you", damage, player_died)
        self.game.add_message(message)

        # Track damage for death recap
        self.game.last_attacker_name = enemy_name
        self.game.last_damage_taken = damage

        # Emit combat events (renderer will consume these)
        if self.events is not None:
            self.events.emit_attack(enemy, player, damage, player_died)

        if player_died:
            self.game.state = GameState.DEAD
