"""Combat orchestration and damage flow."""
from typing import TYPE_CHECKING

from ..entities import attack, get_combat_message
from ..core.constants import GameState, ELITE_XP_MULTIPLIER

if TYPE_CHECKING:
    from ..core.game import Game


class CombatManager:
    """Orchestrates combat between entities."""

    def __init__(self, game: 'Game'):
        self.game = game

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
            self._player_attack_enemy(enemy)
            return True

        # Check if position is walkable
        if self.game.dungeon.is_walkable(new_x, new_y):
            player.move(dx, dy)

            # Update FOV after movement
            self.game.dungeon.update_fov(player.x, player.y)

            # Check for level transitions and item pickups
            self.game.level_manager.check_stairs()
            self.game.entity_manager.check_item_pickup(player, self.game.add_message)

            return True

        return False

    def _player_attack_enemy(self, enemy):
        """Handle player attacking an enemy."""
        player = self.game.player
        renderer = self.game.renderer

        damage, enemy_died = attack(player, enemy)

        # Use enemy name (with "Elite" prefix for elites)
        enemy_name = f"Elite {enemy.name}" if enemy.is_elite else enemy.name
        message = get_combat_message("You", enemy_name, damage, enemy_died)
        self.game.add_message(message)

        # Combat feedback animations
        renderer.add_direction_indicator(player.x, player.y, enemy.x, enemy.y)
        renderer.add_damage_number(enemy.x, enemy.y, damage)

        if enemy_died:
            player.kills += 1

            # Death animations
            renderer.add_death_flash(enemy.x, enemy.y)
            self.game.dungeon.add_blood_stain(enemy.x, enemy.y)

            # Award XP (2x for elites) and check for level up
            xp_award = enemy.xp_reward * ELITE_XP_MULTIPLIER if enemy.is_elite else enemy.xp_reward
            leveled_up = player.gain_xp(xp_award)

            if leveled_up:
                self.game.add_message(f"LEVEL UP! You are now level {player.level}!")
                self.game.add_message(f"HP: {player.max_health}, ATK: {player.attack_damage}")
        else:
            # Hit animation for surviving enemy
            renderer.add_hit_animation(enemy)

    def process_enemy_turns(self):
        """Process all enemy turns."""
        for enemy in self.game.entity_manager.enemies:
            if not enemy.is_alive():
                continue

            # Get move toward player
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

    def _enemy_attack_player(self, enemy):
        """Handle an enemy attacking the player."""
        player = self.game.player
        renderer = self.game.renderer

        damage, player_died = attack(enemy, player)

        # Use enemy name (with "Elite" prefix for elites)
        enemy_name = f"Elite {enemy.name}" if enemy.is_elite else enemy.name
        message = get_combat_message(enemy_name, "you", damage, player_died)
        self.game.add_message(message)

        # Combat feedback animations
        renderer.add_direction_indicator(enemy.x, enemy.y, player.x, player.y)
        renderer.add_damage_number(player.x, player.y, damage)

        if player_died:
            self.game.state = GameState.DEAD
        else:
            # Hit animation for surviving player
            renderer.add_hit_animation(player)
