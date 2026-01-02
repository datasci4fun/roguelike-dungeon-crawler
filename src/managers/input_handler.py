"""Input handling for game controls."""
import curses
from typing import TYPE_CHECKING, Tuple, Optional

from ..core.constants import GameState, UIMode

if TYPE_CHECKING:
    from ..core.game import Game


class InputHandler:
    """Handles all keyboard input processing."""

    def __init__(self, game: 'Game'):
        self.game = game

    def handle_game_input(self, key: int) -> bool:
        """
        Handle player input during normal gameplay.

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
            # Use item from inventory (quick slots)
            item_index = int(chr(key)) - 1
            return self.game.use_item(item_index)
        elif key in (ord('i'), ord('I')):
            # Open inventory screen
            self.game.ui_mode = UIMode.INVENTORY
            self.game.selected_item_index = 0
            return False
        elif key in (ord('c'), ord('C')):
            # Open character screen
            self.game.ui_mode = UIMode.CHARACTER
            return False
        elif key == ord('?'):
            # Open help screen
            self.game.ui_mode = UIMode.HELP
            return False
        elif key in (ord('q'), ord('Q')):
            # Save and quit
            if self.game.save_manager.save_game():
                self.game.add_message("Game saved!")
            self.game.state = GameState.QUIT
            return False

        # Try to move if direction was selected
        if dx != 0 or dy != 0:
            return self.game.combat_manager.try_move_or_attack(dx, dy)

        return False

    def handle_inventory_input(self, key: int):
        """Handle input while in the inventory screen."""
        if key == -1:
            return

        inventory = self.game.player.inventory

        if key in (ord('i'), ord('I'), ord('q'), ord('Q'), 27):  # I, Q, or ESC to close
            self.game.ui_mode = UIMode.GAME
        elif key in (curses.KEY_UP, ord('w'), ord('W'), ord('k')):
            # Move selection up
            if len(inventory.items) > 0:
                self.game.selected_item_index = (self.game.selected_item_index - 1) % len(inventory.items)
        elif key in (curses.KEY_DOWN, ord('s'), ord('S'), ord('j')):
            # Move selection down
            if len(inventory.items) > 0:
                self.game.selected_item_index = (self.game.selected_item_index + 1) % len(inventory.items)
        elif key in (ord('u'), ord('U'), ord('\n'), curses.KEY_ENTER):
            # Use/equip selected item
            self._use_or_equip_selected_item()
        elif key in (ord('e'), ord('E')):
            # Equip selected item (explicit equip key)
            self._equip_selected_item()
        elif key in (ord('d'), ord('D')):
            # Drop selected item
            self._drop_selected_item()

    def handle_character_input(self, key: int):
        """Handle input while in the character screen."""
        if key != -1:
            self.game.ui_mode = UIMode.GAME

    def handle_help_input(self, key: int):
        """Handle input while in the help screen."""
        if key != -1:
            self.game.ui_mode = UIMode.GAME

    def _use_or_equip_selected_item(self):
        """Use or equip the currently selected inventory item."""
        inventory = self.game.player.inventory
        if 0 <= self.game.selected_item_index < len(inventory.items):
            item = inventory.get_item(self.game.selected_item_index)
            if item and item.is_equippable():
                message = self.game.player.equip(item)
                self.game.add_message(message)
                self._adjust_selection_after_removal()
            elif self.game.use_item(self.game.selected_item_index):
                self._adjust_selection_after_removal()

    def _equip_selected_item(self):
        """Equip the currently selected inventory item."""
        inventory = self.game.player.inventory
        if 0 <= self.game.selected_item_index < len(inventory.items):
            item = inventory.get_item(self.game.selected_item_index)
            if item and item.is_equippable():
                message = self.game.player.equip(item)
                self.game.add_message(message)
                self._adjust_selection_after_removal()
            else:
                self.game.add_message("Cannot equip this item!")

    def _drop_selected_item(self):
        """Drop the currently selected inventory item."""
        inventory = self.game.player.inventory
        if 0 <= self.game.selected_item_index < len(inventory.items):
            item = inventory.remove_item(self.game.selected_item_index)
            item.x = self.game.player.x
            item.y = self.game.player.y
            self.game.items.append(item)
            self.game.add_message(f"Dropped {item.name}")
            self._adjust_selection_after_removal()

    def _adjust_selection_after_removal(self):
        """Adjust the selection index after an item is removed from inventory."""
        inventory = self.game.player.inventory
        if self.game.selected_item_index >= len(inventory.items):
            self.game.selected_item_index = max(0, len(inventory.items) - 1)

    def handle_title_input(self, key: int, has_save: bool) -> Optional[str]:
        """
        Handle input on the title screen.

        Returns:
            'new_game' - Start new game
            'continue' - Load saved game
            'help' - Show help screen
            'quit' - Quit game
            None - No action
        """
        if key == -1:
            return None

        if key in (ord('n'), ord('N')):
            return 'new_game'
        elif key in (ord('c'), ord('C')) and has_save:
            return 'continue'
        elif key in (ord('h'), ord('H')):
            return 'help'
        elif key in (ord('q'), ord('Q')):
            return 'quit'

        return None

    def handle_intro_input(self, key: int, current_page: int, total_pages: int) -> Tuple[int, bool]:
        """
        Handle input on the intro/prologue screen.

        Returns:
            Tuple of (new_page, should_skip):
            - new_page: The page to display next
            - should_skip: True if player wants to skip intro entirely
        """
        if key == -1:
            return current_page, False

        # ESC to skip
        if key == 27:
            return current_page, True

        # Space or Enter to continue
        if key in (ord(' '), ord('\n'), curses.KEY_ENTER):
            if current_page < total_pages - 1:
                return current_page + 1, False
            else:
                return current_page, True  # Last page, proceed to game

        # Any other key on last page proceeds
        if current_page >= total_pages - 1:
            return current_page, True

        return current_page, False
