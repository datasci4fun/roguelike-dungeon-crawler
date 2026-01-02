"""Main game loop and state management."""
import curses
from typing import List

from .constants import GameState, UIMode
from ..world import Dungeon
from ..entities import Player
from ..ui import Renderer
from ..ui.screens import render_title_screen, render_intro_screen, render_reading_screen, render_dialog
from ..items import Item, ItemType, ScrollTeleport
from ..data import save_exists
from ..story import StoryManager

# Import managers
from ..managers import (
    InputHandler, EntityManager, CombatManager,
    LevelManager, SaveManager
)


class Game:
    """Main game class coordinating all game systems."""

    def __init__(self, stdscr):
        self.stdscr = stdscr
        self.state = GameState.TITLE
        self.ui_mode = UIMode.GAME
        self.renderer = Renderer(stdscr)
        self.messages: List[str] = []
        self.current_level = 1

        # Inventory screen state
        self.selected_item_index = 0

        # Title/intro screen state
        self.intro_page = 0
        self.intro_total_pages = 2  # Default, updated when intro renders

        # Reading screen state
        self.reading_title = ""
        self.reading_content = []

        # Dialog state
        self.dialog_title = ""
        self.dialog_message = ""
        self.dialog_callback = None  # Function to call with dialog result

        # Set up non-blocking input with timeout
        self.stdscr.timeout(100)

        # Initialize managers
        self.entity_manager = EntityManager()
        self.input_handler = InputHandler(self)
        self.combat_manager = CombatManager(self)
        self.level_manager = LevelManager(self)
        self.save_manager = SaveManager(self)
        self.story_manager = StoryManager()

        # Game world initialized on new game or continue
        self.dungeon = None
        self.player = None

    def _initialize_new_game(self):
        """Set up a new game."""
        # Generate first dungeon
        self.dungeon = Dungeon(level=self.current_level, has_stairs_up=False)

        # Spawn player
        player_pos = self.dungeon.get_random_floor_position()
        self.player = Player(player_pos[0], player_pos[1])

        # Initialize FOV
        self.dungeon.update_fov(self.player.x, self.player.y)

        # Spawn entities
        self.entity_manager.spawn_enemies(self.dungeon, self.player)
        self.entity_manager.spawn_items(self.dungeon, self.player)

        # Welcome messages
        self.add_message("Welcome to the dungeon!")
        self.add_message("Find the stairs (>) to descend deeper")
        self.add_message("Use arrow keys or WASD to move")

    def add_message(self, message: str):
        """Add a message to the message log."""
        self.messages.append(message)

    def run(self):
        """Main game loop."""
        while self.state != GameState.QUIT:
            if self.state == GameState.TITLE:
                self._title_loop()
            elif self.state == GameState.INTRO:
                self._intro_loop()
            elif self.state == GameState.PLAYING:
                self._game_loop()
            elif self.state == GameState.DEAD:
                self._game_over_loop()

    def _title_loop(self):
        """Handle the title screen."""
        has_save = save_exists()
        use_unicode = self.renderer.use_unicode

        render_title_screen(self.stdscr, has_save, use_unicode)

        key = self.stdscr.getch()
        if key != -1:
            action = self.input_handler.handle_title_input(key, has_save)

            if action == 'new_game':
                self.intro_page = 0
                self.state = GameState.INTRO
            elif action == 'continue':
                # Load saved game
                if self.save_manager.load_game():
                    self.state = GameState.PLAYING
                else:
                    self.add_message("Failed to load save!")
                    self._initialize_new_game()
                    self.state = GameState.PLAYING
            elif action == 'help':
                # Show help screen from title
                self.renderer.render_help_screen()
                self.stdscr.timeout(-1)  # Blocking for help
                self.stdscr.getch()
                self.stdscr.timeout(100)  # Restore timeout
            elif action == 'quit':
                self.state = GameState.QUIT

    def _intro_loop(self):
        """Handle the intro/prologue screen."""
        use_unicode = self.renderer.use_unicode

        self.intro_total_pages = render_intro_screen(
            self.stdscr, self.intro_page, use_unicode
        )

        key = self.stdscr.getch()
        if key != -1:
            new_page, should_skip = self.input_handler.handle_intro_input(
                key, self.intro_page, self.intro_total_pages
            )

            self.intro_page = new_page

            if should_skip:
                # Start new game
                self._initialize_new_game()
                self.state = GameState.PLAYING

    def _game_loop(self):
        """Main playing state loop."""
        # Handle different UI modes
        if self.ui_mode == UIMode.INVENTORY:
            self._inventory_loop()
            return
        elif self.ui_mode == UIMode.CHARACTER:
            self._character_loop()
            return
        elif self.ui_mode == UIMode.HELP:
            self._help_loop()
            return
        elif self.ui_mode == UIMode.READING:
            self._reading_loop()
            return
        elif self.ui_mode == UIMode.DIALOG:
            self._dialog_loop()
            return

        # Normal game rendering
        self.renderer.render(
            self.dungeon,
            self.player,
            self.entity_manager.enemies,
            self.entity_manager.items,
            self.messages
        )

        # Handle input
        key = self.stdscr.getch()
        if key != -1:
            player_moved = self.input_handler.handle_game_input(key)

            # Enemy turn (only if player moved)
            if player_moved:
                self.combat_manager.process_enemy_turns()

            # Check if player died
            if not self.player.is_alive():
                from ..data import delete_save
                delete_save()
                self.state = GameState.DEAD

    def _inventory_loop(self):
        """Handle the full-screen inventory UI."""
        self.renderer.render_inventory_screen(
            self.player,
            self.selected_item_index,
            self.dungeon.level
        )

        key = self.stdscr.getch()
        self.input_handler.handle_inventory_input(key)

    def _character_loop(self):
        """Handle the character stats screen UI."""
        self.renderer.render_character_screen(self.player, self.dungeon.level)

        key = self.stdscr.getch()
        self.input_handler.handle_character_input(key)

    def _help_loop(self):
        """Handle the help screen UI."""
        self.renderer.render_help_screen()

        key = self.stdscr.getch()
        self.input_handler.handle_help_input(key)

    def _reading_loop(self):
        """Handle the lore reading screen UI."""
        use_unicode = self.renderer.use_unicode
        render_reading_screen(
            self.stdscr,
            self.reading_title,
            self.reading_content,
            use_unicode
        )

        key = self.stdscr.getch()
        self.input_handler.handle_reading_input(key)

    def _dialog_loop(self):
        """Handle the confirmation dialog UI."""
        use_unicode = self.renderer.use_unicode

        # Render the game behind the dialog first
        self.renderer.render(
            self.dungeon,
            self.player,
            self.entity_manager.enemies,
            self.entity_manager.items,
            self.messages
        )

        # Render dialog on top
        render_dialog(
            self.stdscr,
            self.dialog_title,
            self.dialog_message,
            use_unicode=use_unicode
        )

        key = self.stdscr.getch()
        result = self.input_handler.handle_dialog_input(key)

        if result is not None and self.dialog_callback:
            self.dialog_callback(result)
            self.dialog_callback = None

    def show_dialog(self, title: str, message: str, callback):
        """
        Show a confirmation dialog.

        Args:
            title: Dialog title
            message: Dialog message/question
            callback: Function to call with True (confirmed) or False (cancelled)
        """
        self.dialog_title = title
        self.dialog_message = message
        self.dialog_callback = callback
        self.ui_mode = UIMode.DIALOG

    def _game_over_loop(self):
        """Game over state loop."""
        self.renderer.render_game_over(self.player)
        self.stdscr.timeout(-1)  # Blocking input
        self.stdscr.getch()
        self.stdscr.timeout(100)  # Restore timeout
        # Return to title screen instead of quitting
        self.state = GameState.TITLE
        self.messages.clear()  # Clear messages for new game

    def use_item(self, item_index: int) -> bool:
        """
        Use an item from the inventory.

        Returns:
            True if item was used, False otherwise
        """
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
            new_pos = self.dungeon.get_random_floor_position()
            self.player.x, self.player.y = new_pos
            self.dungeon.update_fov(self.player.x, self.player.y)

        # Remove item from inventory
        self.player.inventory.remove_item(item_index)

        return True

    # Legacy methods for save/load compatibility

    def save_game_state(self) -> bool:
        """Save game state (delegates to save_manager)."""
        return self.save_manager.save_game()

    def load_game_state(self, game_state: dict) -> bool:
        """Load game state (delegates to save_manager)."""
        return self.save_manager.load_game_state(game_state)

    # Property aliases for manager collections (for compatibility)

    @property
    def enemies(self) -> List:
        """Alias for entity_manager.enemies."""
        return self.entity_manager.enemies

    @property
    def items(self) -> List:
        """Alias for entity_manager.items."""
        return self.entity_manager.items
