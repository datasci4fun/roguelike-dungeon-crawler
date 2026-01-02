"""Terminal client for the game engine.

The Game class wraps the GameEngine and handles all curses-specific
input/output, acting as a terminal client for the platform-agnostic engine.
"""
import curses
from typing import List

from .constants import GameState, UIMode
from .engine import GameEngine
from .events import EventType
from ..ui import Renderer, CursesInputAdapter
from ..ui.screens import (
    render_title_screen, render_intro_screen, render_reading_screen,
    render_dialog, render_message_log_screen, render_victory_screen
)
from ..data import save_exists


class Game:
    """
    Terminal client that wraps GameEngine with curses I/O.

    This class handles:
    - curses screen management
    - Input translation (keys -> commands)
    - Event processing (events -> renderer)
    - Rendering delegation

    All game logic is delegated to the GameEngine.
    """

    def __init__(self, stdscr):
        self.stdscr = stdscr

        # Initialize the game engine (all game logic lives here)
        self.engine = GameEngine()

        # Initialize renderer
        self.renderer = Renderer(stdscr)

        # Initialize input adapter
        self.input_adapter = CursesInputAdapter()

        # Set up non-blocking input with timeout
        self.stdscr.timeout(100)

    # =========================================================================
    # Property Proxies to Engine (for backward compatibility)
    # =========================================================================

    @property
    def state(self) -> GameState:
        return self.engine.state

    @state.setter
    def state(self, value: GameState):
        self.engine.state = value

    @property
    def ui_mode(self) -> UIMode:
        return self.engine.ui_mode

    @ui_mode.setter
    def ui_mode(self, value: UIMode):
        self.engine.ui_mode = value

    @property
    def player(self):
        return self.engine.player

    @property
    def dungeon(self):
        return self.engine.dungeon

    @property
    def message_log(self):
        return self.engine.message_log

    @property
    def messages(self) -> List[str]:
        return self.engine.messages

    @property
    def entity_manager(self):
        return self.engine.entity_manager

    @property
    def enemies(self) -> List:
        return self.engine.enemies

    @property
    def items(self) -> List:
        return self.engine.items

    @property
    def story_manager(self):
        return self.engine.story_manager

    @property
    def combat_manager(self):
        return self.engine.combat_manager

    @property
    def level_manager(self):
        return self.engine.level_manager

    @property
    def save_manager(self):
        return self.engine.save_manager

    @property
    def current_level(self):
        return self.engine.current_level

    @current_level.setter
    def current_level(self, value):
        self.engine.current_level = value

    @property
    def selected_item_index(self):
        return self.engine.selected_item_index

    @selected_item_index.setter
    def selected_item_index(self, value):
        self.engine.selected_item_index = value

    @property
    def last_attacker_name(self):
        return self.engine.last_attacker_name

    @last_attacker_name.setter
    def last_attacker_name(self, value):
        self.engine.last_attacker_name = value

    @property
    def last_damage_taken(self):
        return self.engine.last_damage_taken

    @last_damage_taken.setter
    def last_damage_taken(self, value):
        self.engine.last_damage_taken = value

    @property
    def max_level_reached(self):
        return self.engine.max_level_reached

    @max_level_reached.setter
    def max_level_reached(self, value):
        self.engine.max_level_reached = value

    @property
    def turns_since_save(self):
        return self.engine.turns_since_save

    @turns_since_save.setter
    def turns_since_save(self, value):
        self.engine.turns_since_save = value

    @property
    def event_queue(self):
        return self.engine.event_queue

    # =========================================================================
    # Method Proxies to Engine
    # =========================================================================

    def add_message(self, message, category=None, importance=None):
        """Proxy to engine.add_message."""
        if category is None and importance is None:
            self.engine.add_message(message)
        elif importance is None:
            self.engine.add_message(message, category)
        else:
            self.engine.add_message(message, category, importance)

    def show_hint(self, hint_id: str) -> bool:
        """Proxy to engine.show_hint."""
        return self.engine.show_hint(hint_id)

    def show_dialog(self, title: str, message: str, callback):
        """Proxy to engine.show_dialog."""
        self.engine.show_dialog(title, message, callback)

    def use_item(self, item_index: int) -> bool:
        """Proxy to engine.use_item."""
        return self.engine.use_item(item_index)

    def save_game_state(self) -> bool:
        """Save game state."""
        return self.engine.save_game()

    def load_game_state(self, game_state: dict) -> bool:
        """Load game state (delegates to save_manager)."""
        return self.engine.save_manager.load_game_state(game_state)

    # =========================================================================
    # Main Game Loop
    # =========================================================================

    def run(self):
        """Main game loop."""
        while self.engine.state != GameState.QUIT:
            if self.engine.state == GameState.TITLE:
                self._title_loop()
            elif self.engine.state == GameState.INTRO:
                self._intro_loop()
            elif self.engine.state == GameState.PLAYING:
                self._game_loop()
            elif self.engine.state == GameState.DEAD:
                self._game_over_loop()
            elif self.engine.state == GameState.VICTORY:
                self._victory_loop()

    # =========================================================================
    # Event Processing
    # =========================================================================

    def _process_events(self):
        """Process events from the engine and dispatch to renderer."""
        for event in self.engine.flush_events():
            if event.type == EventType.HIT_FLASH:
                entity = event.data.get('entity')
                if entity:
                    self.renderer.add_hit_animation(entity)

            elif event.type == EventType.DAMAGE_NUMBER:
                x = event.data.get('x')
                y = event.data.get('y')
                amount = event.data.get('amount', 0)
                if x is not None and y is not None:
                    self.renderer.add_damage_number(x, y, amount)

            elif event.type == EventType.DIRECTION_ARROW:
                from_x = event.data.get('from_x')
                from_y = event.data.get('from_y')
                to_x = event.data.get('to_x')
                to_y = event.data.get('to_y')
                if all(v is not None for v in [from_x, from_y, to_x, to_y]):
                    self.renderer.add_direction_indicator(from_x, from_y, to_x, to_y)

            elif event.type == EventType.DEATH_FLASH:
                x = event.data.get('x')
                y = event.data.get('y')
                if x is not None and y is not None:
                    self.renderer.add_death_flash(x, y)

            elif event.type == EventType.BLOOD_STAIN:
                x = event.data.get('x')
                y = event.data.get('y')
                if x is not None and y is not None and self.engine.dungeon:
                    self.engine.dungeon.add_blood_stain(x, y)

    # =========================================================================
    # State-Specific Loops
    # =========================================================================

    def _title_loop(self):
        """Handle the title screen."""
        has_save = save_exists()
        use_unicode = self.renderer.use_unicode

        render_title_screen(self.stdscr, has_save, use_unicode)

        key = self.stdscr.getch()
        command = self.input_adapter.translate_title(key)
        action = self.engine.process_title_command(command, has_save)

        if action == 'new_game':
            self.engine.intro_page = 0
            self.engine.state = GameState.INTRO
        elif action == 'continue':
            if self.engine.load_game():
                pass  # State already set by load_game
            else:
                self.engine.add_message("Failed to load save!")
                self.engine.start_new_game()
        elif action == 'help':
            self.renderer.render_help_screen()
            self.stdscr.timeout(-1)
            self.stdscr.getch()
            self.stdscr.timeout(100)
        elif action == 'quit':
            self.engine.state = GameState.QUIT

    def _intro_loop(self):
        """Handle the intro/prologue screen."""
        use_unicode = self.renderer.use_unicode

        self.engine.intro_total_pages = render_intro_screen(
            self.stdscr, self.engine.intro_page, use_unicode
        )

        key = self.stdscr.getch()
        command = self.input_adapter.translate_intro(key)
        new_page, should_skip = self.engine.process_intro_command(command)

        if should_skip:
            self.engine.start_new_game()

    def _game_loop(self):
        """Main playing state loop."""
        # Handle different UI modes
        if self.engine.ui_mode == UIMode.INVENTORY:
            self._inventory_loop()
            return
        elif self.engine.ui_mode == UIMode.CHARACTER:
            self._character_loop()
            return
        elif self.engine.ui_mode == UIMode.HELP:
            self._help_loop()
            return
        elif self.engine.ui_mode == UIMode.READING:
            self._reading_loop()
            return
        elif self.engine.ui_mode == UIMode.DIALOG:
            self._dialog_loop()
            return
        elif self.engine.ui_mode == UIMode.MESSAGE_LOG:
            self._message_log_loop()
            return

        # Process any pending events from previous tick
        self._process_events()

        # Normal game rendering
        self.renderer.render(
            self.engine.dungeon,
            self.engine.player,
            self.engine.enemies,
            self.engine.items,
            self.engine.messages
        )

        # Handle input
        key = self.stdscr.getch()
        command = self.input_adapter.translate_game(key)
        self.engine.process_game_command(command)

        # Process events generated this tick
        self._process_events()

    def _inventory_loop(self):
        """Handle the full-screen inventory UI."""
        self.renderer.render_inventory_screen(
            self.engine.player,
            self.engine.selected_item_index,
            self.engine.dungeon.level
        )

        key = self.stdscr.getch()
        command = self.input_adapter.translate_inventory(key)
        self.engine.process_inventory_command(command)

    def _character_loop(self):
        """Handle the character stats screen UI."""
        self.renderer.render_character_screen(
            self.engine.player,
            self.engine.dungeon.level
        )

        key = self.stdscr.getch()
        command = self.input_adapter.translate_close_screen(key)
        self.engine.process_character_command(command)

    def _help_loop(self):
        """Handle the help screen UI."""
        self.renderer.render_help_screen()

        key = self.stdscr.getch()
        command = self.input_adapter.translate_close_screen(key)
        self.engine.process_help_command(command)

    def _reading_loop(self):
        """Handle the lore reading screen UI."""
        use_unicode = self.renderer.use_unicode
        render_reading_screen(
            self.stdscr,
            self.engine.reading_title,
            self.engine.reading_content,
            use_unicode
        )

        key = self.stdscr.getch()
        command = self.input_adapter.translate_close_screen(key)
        self.engine.process_reading_command(command)

    def _dialog_loop(self):
        """Handle the confirmation dialog UI."""
        use_unicode = self.renderer.use_unicode

        # Render the game behind the dialog first
        self.renderer.render(
            self.engine.dungeon,
            self.engine.player,
            self.engine.enemies,
            self.engine.items,
            self.engine.messages
        )

        # Render dialog on top
        render_dialog(
            self.stdscr,
            self.engine.dialog_title,
            self.engine.dialog_message,
            use_unicode=use_unicode
        )

        key = self.stdscr.getch()
        command = self.input_adapter.translate_dialog(key)
        self.engine.process_dialog_command(command)

    def _message_log_loop(self):
        """Handle the message log screen UI."""
        use_unicode = self.renderer.use_unicode
        render_message_log_screen(
            self.stdscr,
            self.engine.message_log,
            use_unicode
        )

        key = self.stdscr.getch()
        command = self.input_adapter.translate_message_log(key)
        max_y, _ = self.stdscr.getmaxyx()
        visible_lines = max_y - 7
        self.engine.process_message_log_command(command, visible_lines)

    def _game_over_loop(self):
        """Game over state loop."""
        death_info = self.engine.get_death_info()
        self.renderer.render_game_over(self.engine.player, death_info)

        self.stdscr.timeout(-1)
        self.stdscr.getch()
        self.stdscr.timeout(100)

        # Return to title screen
        self.engine.state = GameState.TITLE
        self.engine.message_log.clear()

    def _victory_loop(self):
        """Victory state loop."""
        victory_info = self.engine.get_victory_info()
        render_victory_screen(self.stdscr, self.engine.player, victory_info)

        self.stdscr.timeout(-1)
        self.stdscr.getch()
        self.stdscr.timeout(100)

        # Return to title screen
        self.engine.state = GameState.TITLE
        self.engine.message_log.clear()
