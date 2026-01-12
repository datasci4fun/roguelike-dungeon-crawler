"""Curses input adapter - translates curses key codes to abstract commands.

This adapter handles the platform-specific translation from curses keyboard
input to the abstract Command system used by the game engine.
"""
import curses
from typing import Optional

from ..core.commands import Command, CommandType


class CursesInputAdapter:
    """
    Translates curses key codes to abstract Commands.

    This allows the game logic to work with platform-agnostic commands
    while the terminal interface handles the curses-specific input.
    """

    # Key mappings for different game contexts
    # These can be customized for key rebinding

    GAME_KEYS = {
        # Movement - Arrow keys
        curses.KEY_UP: CommandType.MOVE_UP,
        curses.KEY_DOWN: CommandType.MOVE_DOWN,
        curses.KEY_LEFT: CommandType.MOVE_LEFT,
        curses.KEY_RIGHT: CommandType.MOVE_RIGHT,
        # Movement - WASD
        ord('w'): CommandType.MOVE_UP,
        ord('W'): CommandType.MOVE_UP,
        ord('s'): CommandType.MOVE_DOWN,
        ord('S'): CommandType.MOVE_DOWN,
        ord('a'): CommandType.MOVE_LEFT,
        ord('A'): CommandType.MOVE_LEFT,
        ord('d'): CommandType.MOVE_RIGHT,
        ord('D'): CommandType.MOVE_RIGHT,
        # Quick item slots
        ord('1'): CommandType.USE_ITEM_1,
        ord('2'): CommandType.USE_ITEM_2,
        ord('3'): CommandType.USE_ITEM_3,
        # UI screens
        ord('i'): CommandType.OPEN_INVENTORY,
        ord('I'): CommandType.OPEN_INVENTORY,
        ord('c'): CommandType.OPEN_CHARACTER,
        ord('C'): CommandType.OPEN_CHARACTER,
        ord('?'): CommandType.OPEN_HELP,
        ord('m'): CommandType.OPEN_MESSAGE_LOG,
        ord('M'): CommandType.OPEN_MESSAGE_LOG,
        # Actions
        ord('q'): CommandType.QUIT,
        ord('Q'): CommandType.QUIT,
        ord('>'): CommandType.DESCEND,
    }

    INVENTORY_KEYS = {
        # Navigation
        curses.KEY_UP: CommandType.INVENTORY_UP,
        curses.KEY_DOWN: CommandType.INVENTORY_DOWN,
        ord('w'): CommandType.INVENTORY_UP,
        ord('W'): CommandType.INVENTORY_UP,
        ord('k'): CommandType.INVENTORY_UP,
        ord('s'): CommandType.INVENTORY_DOWN,
        ord('S'): CommandType.INVENTORY_DOWN,
        ord('j'): CommandType.INVENTORY_DOWN,
        # Actions
        ord('u'): CommandType.INVENTORY_USE,
        ord('U'): CommandType.INVENTORY_USE,
        ord('\n'): CommandType.INVENTORY_USE,
        curses.KEY_ENTER: CommandType.INVENTORY_USE,
        ord('e'): CommandType.INVENTORY_EQUIP,
        ord('E'): CommandType.INVENTORY_EQUIP,
        ord('d'): CommandType.INVENTORY_DROP,
        ord('D'): CommandType.INVENTORY_DROP,
        ord('r'): CommandType.INVENTORY_READ,
        ord('R'): CommandType.INVENTORY_READ,
        # Close
        ord('i'): CommandType.CLOSE_SCREEN,
        ord('I'): CommandType.CLOSE_SCREEN,
        ord('q'): CommandType.CLOSE_SCREEN,
        ord('Q'): CommandType.CLOSE_SCREEN,
        27: CommandType.CLOSE_SCREEN,  # ESC
    }

    DIALOG_KEYS = {
        ord('y'): CommandType.CONFIRM,
        ord('Y'): CommandType.CONFIRM,
        ord('n'): CommandType.CANCEL,
        ord('N'): CommandType.CANCEL,
        27: CommandType.CANCEL,  # ESC
    }

    MESSAGE_LOG_KEYS = {
        # Scrolling
        curses.KEY_UP: CommandType.SCROLL_UP,
        ord('k'): CommandType.SCROLL_UP,
        ord('K'): CommandType.SCROLL_UP,
        ord('w'): CommandType.SCROLL_UP,
        ord('W'): CommandType.SCROLL_UP,
        curses.KEY_DOWN: CommandType.SCROLL_DOWN,
        ord('j'): CommandType.SCROLL_DOWN,
        ord('J'): CommandType.SCROLL_DOWN,
        ord('s'): CommandType.SCROLL_DOWN,
        ord('S'): CommandType.SCROLL_DOWN,
        curses.KEY_PPAGE: CommandType.PAGE_UP,
        curses.KEY_NPAGE: CommandType.PAGE_DOWN,
        # Close
        ord('q'): CommandType.CLOSE_SCREEN,
        ord('Q'): CommandType.CLOSE_SCREEN,
        ord('m'): CommandType.CLOSE_SCREEN,
        ord('M'): CommandType.CLOSE_SCREEN,
        27: CommandType.CLOSE_SCREEN,  # ESC
    }

    TITLE_KEYS = {
        ord('n'): CommandType.NEW_GAME,
        ord('N'): CommandType.NEW_GAME,
        ord('c'): CommandType.CONTINUE_GAME,
        ord('C'): CommandType.CONTINUE_GAME,
        ord('h'): CommandType.OPEN_HELP,
        ord('H'): CommandType.OPEN_HELP,
        ord('q'): CommandType.QUIT,
        ord('Q'): CommandType.QUIT,
    }

    INTRO_KEYS = {
        ord(' '): CommandType.MENU_SELECT,  # Space to continue
        ord('\n'): CommandType.MENU_SELECT,  # Enter to continue
        curses.KEY_ENTER: CommandType.MENU_SELECT,
        27: CommandType.SKIP,  # ESC to skip
    }

    CLOSE_SCREEN_KEYS = {
        # Any key closes character/help screen
        # Handled specially - any key except -1 closes
    }

    # v6.0: Battle mode keys
    BATTLE_KEYS = {
        # Movement (for arena positioning)
        curses.KEY_UP: CommandType.MOVE_UP,
        curses.KEY_DOWN: CommandType.MOVE_DOWN,
        curses.KEY_LEFT: CommandType.MOVE_LEFT,
        curses.KEY_RIGHT: CommandType.MOVE_RIGHT,
        ord('w'): CommandType.MOVE_UP,
        ord('W'): CommandType.MOVE_UP,
        ord('s'): CommandType.MOVE_DOWN,
        ord('S'): CommandType.MOVE_DOWN,
        ord('a'): CommandType.MOVE_LEFT,
        ord('A'): CommandType.MOVE_LEFT,
        ord('d'): CommandType.MOVE_RIGHT,
        ord('D'): CommandType.MOVE_RIGHT,
        # Confirm/wait
        ord(' '): CommandType.CONFIRM,
        ord('\n'): CommandType.CONFIRM,
        curses.KEY_ENTER: CommandType.CONFIRM,
        ord('.'): CommandType.CONFIRM,  # Wait key
        # Cancel/flee
        ord('q'): CommandType.CANCEL,
        ord('Q'): CommandType.CANCEL,
        27: CommandType.CANCEL,  # ESC
    }

    # v6.0.4: Ability keys (handled specially in translate_battle)
    BATTLE_ABILITY_KEYS = {
        ord('1'): 'ABILITY_1',
        ord('2'): 'ABILITY_2',
        ord('3'): 'ABILITY_3',
        ord('4'): 'ABILITY_4',
    }

    def translate_game(self, key: int) -> Command:
        """Translate a key press during normal gameplay."""
        if key == -1:
            return Command.none()

        cmd_type = self.GAME_KEYS.get(key)
        if cmd_type:
            return Command(cmd_type)
        return Command.none()

    def translate_inventory(self, key: int) -> Command:
        """Translate a key press in inventory screen."""
        if key == -1:
            return Command.none()

        cmd_type = self.INVENTORY_KEYS.get(key)
        if cmd_type:
            return Command(cmd_type)
        return Command.none()

    def translate_dialog(self, key: int) -> Command:
        """Translate a key press in dialog."""
        if key == -1:
            return Command.none()

        cmd_type = self.DIALOG_KEYS.get(key)
        if cmd_type:
            return Command(cmd_type)
        return Command.none()

    def translate_message_log(self, key: int) -> Command:
        """Translate a key press in message log screen."""
        if key == -1:
            return Command.none()

        cmd_type = self.MESSAGE_LOG_KEYS.get(key)
        if cmd_type:
            return Command(cmd_type)
        return Command.none()

    def translate_title(self, key: int) -> Command:
        """Translate a key press on title screen."""
        if key == -1:
            return Command.none()

        cmd_type = self.TITLE_KEYS.get(key)
        if cmd_type:
            return Command(cmd_type)
        return Command.none()

    def translate_intro(self, key: int) -> Command:
        """Translate a key press during intro sequence."""
        if key == -1:
            return Command.none()

        cmd_type = self.INTRO_KEYS.get(key)
        if cmd_type:
            return Command(cmd_type)

        # Any other key on last page acts as continue
        return Command(CommandType.ANY_KEY)

    def translate_any_key(self, key: int) -> Command:
        """Translate for 'press any key' prompts."""
        if key == -1:
            return Command.none()
        return Command(CommandType.ANY_KEY)

    def translate_close_screen(self, key: int) -> Command:
        """Translate for screens that close on any key."""
        if key == -1:
            return Command.none()
        return Command(CommandType.CLOSE_SCREEN)

    def translate_battle(self, key: int) -> Command:
        """Translate a key press during tactical battle mode (v6.0.4)."""
        if key == -1:
            return Command.none()

        # Check for ability keys (1-4)
        ability_cmd = self.BATTLE_ABILITY_KEYS.get(key)
        if ability_cmd:
            # Return special command with ability info in data
            return Command(CommandType.CONFIRM, data={'ability': ability_cmd})

        cmd_type = self.BATTLE_KEYS.get(key)
        if cmd_type:
            return Command(cmd_type)

        # Unknown key - no action
        return Command.none()
