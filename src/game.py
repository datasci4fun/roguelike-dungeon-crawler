"""Main game loop and state management."""
import curses
import random
from typing import List, Optional

from .constants import GameState, MAX_DUNGEON_LEVELS
from .dungeon import Dungeon
from .entities import Player, Enemy
from .renderer import Renderer
from .combat import attack, get_combat_message
from .items import Item, ItemType, create_item


class Game:
    """Main game class managing game state and loop."""

    def __init__(self, stdscr):
        self.stdscr = stdscr
        self.state = GameState.PLAYING
        self.renderer = Renderer(stdscr)
        self.messages: List[str] = []
        self.current_level = 1

        # Set up non-blocking input with timeout
        self.stdscr.timeout(100)

        # Generate first dungeon
        self.dungeon = Dungeon(level=self.current_level, has_stairs_up=False)
        self.add_message("Welcome to the dungeon!")
        self.add_message("Find the stairs (>) to descend deeper")

        # Spawn player
        player_pos = self.dungeon.get_random_floor_position()
        self.player = Player(player_pos[0], player_pos[1])
        self.add_message("Use arrow keys or WASD to move")

        # Spawn enemies
        self.enemies: List[Enemy] = []
        self._spawn_enemies()

        # Spawn items
        self.items: List[Item] = []
        self._spawn_items()

    def _spawn_enemies(self):
        """Spawn enemies in random rooms."""
        num_enemies = min(len(self.dungeon.rooms) * 2, 15)  # 2 enemies per room, max 15

        for _ in range(num_enemies):
            pos = self.dungeon.get_random_floor_position()
            # Make sure not too close to player
            if abs(pos[0] - self.player.x) > 5 or abs(pos[1] - self.player.y) > 5:
                enemy = Enemy(pos[0], pos[1])
                self.enemies.append(enemy)

    def _spawn_items(self):
        """Spawn items in random locations."""
        num_items = random.randint(2, 5)  # 2-5 items per level

        for _ in range(num_items):
            pos = self.dungeon.get_random_floor_position()
            # Make sure not on player or stairs
            if (pos[0] != self.player.x or pos[1] != self.player.y):
                # Random item type
                item_type = random.choice(list(ItemType))
                item = create_item(item_type, pos[0], pos[1])
                self.items.append(item)

    def add_message(self, message: str):
        """Add a message to the message log."""
        self.messages.append(message)

    def run(self):
        """Main game loop."""
        while self.state != GameState.QUIT:
            if self.state == GameState.PLAYING:
                self._game_loop()
            elif self.state == GameState.DEAD:
                self._game_over_loop()

    def _game_loop(self):
        """Main playing state loop."""
        # Render
        self.renderer.render(self.dungeon, self.player, self.enemies, self.items, self.messages)

        # Handle input
        key = self.stdscr.getch()
        if key != -1:  # -1 means no key pressed (timeout)
            player_moved = self._handle_input(key)

            # Enemy turn (only if player moved)
            if player_moved:
                self._enemy_turn()

            # Check if player died
            if not self.player.is_alive():
                self.state = GameState.DEAD

    def _handle_input(self, key: int) -> bool:
        """
        Handle player input.

        Returns:
            True if the player took an action (moved or attacked), False otherwise
        """
        # Movement keys
        dx, dy = 0, 0

        if key in (curses.KEY_UP, ord('w'), ord('W')):
            dy = -1
        elif key in (curses.KEY_DOWN, ord('s'), ord('S')):
            dy = 1
        elif key in (curses.KEY_LEFT, ord('a'), ord('A')):
            dx = -1
        elif key in (curses.KEY_RIGHT, ord('d'), ord('D')):
            dx = 1
        elif key in (ord('q'), ord('Q')):
            self.state = GameState.QUIT
            return False

        # Try to move if direction was selected
        if dx != 0 or dy != 0:
            return self._try_move_player(dx, dy)

        return False

    def _try_move_player(self, dx: int, dy: int) -> bool:
        """
        Attempt to move the player. Handle combat if moving into an enemy.

        Returns:
            True if an action was taken (move or attack), False otherwise
        """
        new_x = self.player.x + dx
        new_y = self.player.y + dy

        # Check for enemy at target position
        enemy = self._get_enemy_at(new_x, new_y)
        if enemy:
            # Attack the enemy
            damage, enemy_died = attack(self.player, enemy)
            message = get_combat_message("You", "enemy", damage, enemy_died)
            self.add_message(message)

            if enemy_died:
                self.player.kills += 1

            return True

        # Check if position is walkable
        if self.dungeon.is_walkable(new_x, new_y):
            self.player.move(dx, dy)

            # Check if player stepped on stairs
            self._check_stairs()

            # Check if player stepped on an item
            self._check_item_pickup()

            return True

        return False

    def _enemy_turn(self):
        """Process all enemy turns."""
        for enemy in self.enemies:
            if not enemy.is_alive():
                continue

            # Get move toward player
            dx, dy = enemy.get_move_toward_player(
                self.player.x,
                self.player.y,
                self.dungeon.is_walkable
            )

            if dx == 0 and dy == 0:
                continue

            new_x = enemy.x + dx
            new_y = enemy.y + dy

            # Check if moving into player
            if new_x == self.player.x and new_y == self.player.y:
                # Attack player
                damage, player_died = attack(enemy, self.player)
                message = get_combat_message("Enemy", "you", damage, player_died)
                self.add_message(message)

                if player_died:
                    self.state = GameState.DEAD
            else:
                # Check if another enemy is at target position
                if not self._get_enemy_at(new_x, new_y):
                    enemy.move(dx, dy)

    def _get_enemy_at(self, x: int, y: int) -> Optional[Enemy]:
        """Get the living enemy at the given position, or None."""
        for enemy in self.enemies:
            if enemy.is_alive() and enemy.x == x and enemy.y == y:
                return enemy
        return None

    def _check_stairs(self):
        """Check if player is on stairs and handle level transition."""
        from .constants import TileType

        tile = self.dungeon.tiles[self.player.y][self.player.x]

        if tile == TileType.STAIRS_DOWN:
            if self.current_level >= MAX_DUNGEON_LEVELS:
                self.add_message("You've reached the deepest level!")
                self.add_message("Congratulations! You win!")
                self.state = GameState.QUIT
            else:
                self._descend_level()

    def _check_item_pickup(self):
        """Check if player is standing on an item and pick it up."""
        for item in self.items[:]:  # Use slice to iterate over copy
            if item.x == self.player.x and item.y == self.player.y:
                if self.player.inventory.add_item(item):
                    self.items.remove(item)
                    self.add_message(f"Picked up {item.name}")
                else:
                    self.add_message("Inventory full!")
                break

    def _descend_level(self):
        """Descend to the next dungeon level."""
        self.current_level += 1
        self.add_message(f"You descend to level {self.current_level}...")

        # Generate new dungeon
        has_up = self.current_level > 1
        self.dungeon = Dungeon(level=self.current_level, has_stairs_up=has_up)

        # Place player at stairs up if they exist, otherwise random position
        if self.dungeon.stairs_up_pos:
            self.player.x, self.player.y = self.dungeon.stairs_up_pos
        else:
            player_pos = self.dungeon.get_random_floor_position()
            self.player.x, self.player.y = player_pos

        # Clear old enemies and spawn new ones
        self.enemies.clear()
        self._spawn_enemies()

        # Clear old items and spawn new ones
        self.items.clear()
        self._spawn_items()

        self.add_message("The air grows colder...")

    def _game_over_loop(self):
        """Game over state loop."""
        self.renderer.render_game_over(self.player)
        self.stdscr.timeout(-1)  # Blocking input
        self.stdscr.getch()  # Wait for any key
        self.state = GameState.QUIT
