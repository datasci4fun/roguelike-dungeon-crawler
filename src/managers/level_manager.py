"""Level transitions and dungeon lifecycle."""
from typing import TYPE_CHECKING

from ..core.constants import GameState, TileType, MAX_DUNGEON_LEVELS
from ..world import Dungeon

if TYPE_CHECKING:
    from ..core.game import Game


class LevelManager:
    """Manages level transitions and dungeon lifecycle."""

    def __init__(self, game: 'Game'):
        self.game = game

    def check_stairs(self):
        """Check if player is on stairs and handle level transition."""
        player = self.game.player
        tile = self.game.dungeon.tiles[player.y][player.x]

        if tile == TileType.STAIRS_DOWN:
            # Show stairs hint on first encounter
            self.game.show_hint("first_stairs")

            if self.game.current_level >= MAX_DUNGEON_LEVELS:
                self._handle_victory()
            else:
                self._descend_level()

    def _handle_victory(self):
        """Handle player reaching the final level."""
        from ..data import delete_save
        delete_save()
        self.game.add_message("You've reached the deepest level!")
        self.game.add_message("Congratulations! You win!")
        self.game.state = GameState.VICTORY

    def _descend_level(self):
        """Descend to the next dungeon level."""
        self.game.current_level += 1
        self.game.max_level_reached = max(self.game.max_level_reached, self.game.current_level)
        self.game.add_message(f"You descend to level {self.game.current_level}...")

        # Generate new dungeon
        has_up = self.game.current_level > 1
        self.game.dungeon = Dungeon(level=self.game.current_level, has_stairs_up=has_up)

        # Place player at stairs up if they exist, otherwise random position
        if self.game.dungeon.stairs_up_pos:
            self.game.player.x, self.game.player.y = self.game.dungeon.stairs_up_pos
        else:
            player_pos = self.game.dungeon.get_random_floor_position()
            self.game.player.x, self.game.player.y = player_pos

        # Update FOV for new level
        self.game.dungeon.update_fov(self.game.player.x, self.game.player.y)

        # Spawn new entities
        self.game.entity_manager.spawn_enemies(self.game.dungeon, self.game.player)
        self.game.entity_manager.spawn_items(self.game.dungeon, self.game.player)

        self.game.add_message("The air grows colder...")

        # Auto-save on level transition
        self.game.save_manager.auto_save()
        self.game.add_message("Game saved.")

    def initialize_level(self, level: int = 1):
        """Initialize a new game level."""
        self.game.current_level = level

        # Generate dungeon
        has_up = level > 1
        self.game.dungeon = Dungeon(level=level, has_stairs_up=has_up)

        # Spawn player at random position
        player_pos = self.game.dungeon.get_random_floor_position()
        self.game.player.x, self.game.player.y = player_pos

        # Initialize FOV
        self.game.dungeon.update_fov(self.game.player.x, self.game.player.y)

        # Spawn entities
        self.game.entity_manager.spawn_enemies(self.game.dungeon, self.game.player)
        self.game.entity_manager.spawn_items(self.game.dungeon, self.game.player)
