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

        # Initialize FOV
        self.dungeon.update_fov(self.player.x, self.player.y)

        # Spawn enemies
        self.enemies: List[Enemy] = []
        self._spawn_enemies()

        # Spawn items
        self.items: List[Item] = []
        self._spawn_items()

    def _spawn_enemies(self):
        """Spawn enemies in random rooms."""
        from .constants import ELITE_SPAWN_RATE

        num_enemies = min(len(self.dungeon.rooms) * 2, 15)  # 2 enemies per room, max 15

        for _ in range(num_enemies):
            pos = self.dungeon.get_random_floor_position()
            # Make sure not too close to player
            if abs(pos[0] - self.player.x) > 5 or abs(pos[1] - self.player.y) > 5:
                # 20% chance to spawn elite enemy
                is_elite = random.random() < ELITE_SPAWN_RATE
                enemy = Enemy(pos[0], pos[1], is_elite=is_elite)
                self.enemies.append(enemy)

    def _spawn_items(self):
        """Spawn items in random locations."""
        # GUARANTEED: 2 health potions per level for survivability
        for _ in range(2):
            pos = self.dungeon.get_random_floor_position()
            # Make sure not on player or stairs
            if (pos[0] != self.player.x or pos[1] != self.player.y):
                item = create_item(ItemType.HEALTH_POTION, pos[0], pos[1])
                self.items.append(item)

        # RANDOM: 0-3 additional random items (can be any type)
        num_random_items = random.randint(0, 3)
        for _ in range(num_random_items):
            pos = self.dungeon.get_random_floor_position()
            # Make sure not on player or stairs
            if (pos[0] != self.player.x or pos[1] != self.player.y):
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
                # Permadeath: delete save on death
                from .save_load import delete_save
                delete_save()
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
        elif key in (ord('1'), ord('2'), ord('3')):
            # Use item from inventory
            item_index = int(chr(key)) - 1
            return self._use_item(item_index)
        elif key in (ord('q'), ord('Q')):
            # Save game on quit
            if self.save_game_state():
                self.add_message("Game saved!")
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

                # Award XP (2x for elites) and check for level up
                from .constants import XP_PER_KILL, ELITE_XP_MULTIPLIER
                xp_award = XP_PER_KILL * ELITE_XP_MULTIPLIER if enemy.is_elite else XP_PER_KILL
                leveled_up = self.player.gain_xp(xp_award)

                if leveled_up:
                    self.add_message(f"LEVEL UP! You are now level {self.player.level}!")
                    self.add_message(f"HP: {self.player.max_health}, ATK: {self.player.attack_damage}")

            return True

        # Check if position is walkable
        if self.dungeon.is_walkable(new_x, new_y):
            self.player.move(dx, dy)

            # Update FOV after movement
            self.dungeon.update_fov(self.player.x, self.player.y)

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
                # Permadeath: delete save on win
                from .save_load import delete_save
                delete_save()
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

    def _use_item(self, item_index: int) -> bool:
        """
        Use an item from the inventory.

        Returns:
            True if item was used, False otherwise
        """
        from .items import ItemType, ScrollTeleport

        if item_index < 0 or item_index >= len(self.player.inventory.items):
            return False

        item = self.player.inventory.get_item(item_index)
        if not item:
            return False

        # Use the item
        message = item.use(self.player)
        self.add_message(message)

        # Handle special item effects
        if isinstance(item, ScrollTeleport):
            # Teleport player to random location
            new_pos = self.dungeon.get_random_floor_position()
            self.player.x, self.player.y = new_pos
            # Update FOV after teleport
            self.dungeon.update_fov(self.player.x, self.player.y)

        # Remove item from inventory
        self.player.inventory.remove_item(item_index)

        return True

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

        # Update FOV for new level
        self.dungeon.update_fov(self.player.x, self.player.y)

        # Clear old enemies and spawn new ones
        self.enemies.clear()
        self._spawn_enemies()

        # Clear old items and spawn new ones
        self.items.clear()
        self._spawn_items()

        self.add_message("The air grows colder...")

    def save_game_state(self) -> bool:
        """
        Save the current game state to disk.

        Returns:
            True if save succeeded, False otherwise
        """
        from .save_load import save_game

        game_state = {
            'current_level': self.current_level,
            'messages': self.messages,
            'player': self._serialize_player(self.player),
            'enemies': [self._serialize_enemy(e) for e in self.enemies],
            'items': [self._serialize_item(i) for i in self.items],
            'dungeon': self._serialize_dungeon(self.dungeon)
        }

        return save_game(game_state)

    def load_game_state(self, game_state: dict) -> bool:
        """
        Load game state from a dictionary.

        Args:
            game_state: Dictionary containing serialized game state

        Returns:
            True if load succeeded, False otherwise
        """
        try:
            self.current_level = game_state['current_level']
            self.messages = game_state['messages']
            self.player = self._deserialize_player(game_state['player'])
            self.enemies = [self._deserialize_enemy(e) for e in game_state['enemies']]
            self.items = [self._deserialize_item(i) for i in game_state['items']]
            self.dungeon = self._deserialize_dungeon(game_state['dungeon'])

            # Update FOV after loading
            self.dungeon.update_fov(self.player.x, self.player.y)

            return True
        except Exception as e:
            print(f"Error loading game state: {e}")
            return False

    def _serialize_player(self, player: Player) -> dict:
        """Serialize player to dictionary."""
        return {
            'x': player.x,
            'y': player.y,
            'health': player.health,
            'max_health': player.max_health,
            'attack_damage': player.attack_damage,
            'level': player.level,
            'xp': player.xp,
            'xp_to_next_level': player.xp_to_next_level,
            'kills': player.kills,
            'inventory': [self._serialize_item(item) for item in player.inventory.items]
        }

    def _deserialize_player(self, data: dict) -> Player:
        """Deserialize player from dictionary."""
        player = Player(data['x'], data['y'])
        player.health = data['health']
        player.max_health = data['max_health']
        player.attack_damage = data['attack_damage']
        player.level = data['level']
        player.xp = data['xp']
        player.xp_to_next_level = data['xp_to_next_level']
        player.kills = data['kills']

        # Restore inventory
        player.inventory.items = [self._deserialize_item(item_data) for item_data in data['inventory']]

        return player

    def _serialize_enemy(self, enemy: Enemy) -> dict:
        """Serialize enemy to dictionary."""
        return {
            'x': enemy.x,
            'y': enemy.y,
            'health': enemy.health,
            'max_health': enemy.max_health,
            'attack_damage': enemy.attack_damage,
            'is_elite': enemy.is_elite
        }

    def _deserialize_enemy(self, data: dict) -> Enemy:
        """Deserialize enemy from dictionary."""
        enemy = Enemy(data['x'], data['y'], is_elite=data['is_elite'])
        enemy.health = data['health']
        enemy.max_health = data['max_health']
        enemy.attack_damage = data['attack_damage']
        return enemy

    def _serialize_item(self, item: Item) -> dict:
        """Serialize item to dictionary."""
        from .items import ItemType

        # Get the item type name
        item_type_name = None
        for item_type in ItemType:
            if item.name == create_item(item_type, 0, 0).name:
                item_type_name = item_type.name
                break

        return {
            'x': item.x,
            'y': item.y,
            'item_type': item_type_name,
            'name': item.name,
            'symbol': item.symbol
        }

    def _deserialize_item(self, data: dict) -> Item:
        """Deserialize item from dictionary."""
        from .items import ItemType

        # Recreate item from type
        item_type = ItemType[data['item_type']]
        return create_item(item_type, data['x'], data['y'])

    def _serialize_dungeon(self, dungeon: Dungeon) -> dict:
        """Serialize dungeon to dictionary."""
        from .constants import TileType

        # Convert TileType enum values to strings for serialization
        tiles = [[tile.value for tile in row] for row in dungeon.tiles]

        return {
            'width': dungeon.width,
            'height': dungeon.height,
            'level': dungeon.level,
            'tiles': tiles,
            'explored': dungeon.explored,
            'visible': dungeon.visible,
            'stairs_up_pos': dungeon.stairs_up_pos,
            'stairs_down_pos': dungeon.stairs_down_pos,
            'has_stairs_up': dungeon.has_stairs_up
        }

    def _deserialize_dungeon(self, data: dict) -> Dungeon:
        """Deserialize dungeon from dictionary."""
        from .constants import TileType

        # Create empty dungeon (will override its generated content)
        dungeon = Dungeon(width=data['width'], height=data['height'], level=data['level'], has_stairs_up=data['has_stairs_up'])

        # Restore tiles by converting chars back to TileType enums
        dungeon.tiles = []
        for row in data['tiles']:
            tile_row = []
            for tile_char in row:
                # Find matching TileType for this character
                for tile_type in TileType:
                    if tile_type.value == tile_char:
                        tile_row.append(tile_type)
                        break
            dungeon.tiles.append(tile_row)

        dungeon.explored = data['explored']
        dungeon.visible = data['visible']
        dungeon.stairs_up_pos = data['stairs_up_pos']
        dungeon.stairs_down_pos = data['stairs_down_pos']

        # Note: We don't restore rooms list as it's not needed for gameplay after generation

        return dungeon

    def _game_over_loop(self):
        """Game over state loop."""
        self.renderer.render_game_over(self.player)
        self.stdscr.timeout(-1)  # Blocking input
        self.stdscr.getch()  # Wait for any key
        self.state = GameState.QUIT
