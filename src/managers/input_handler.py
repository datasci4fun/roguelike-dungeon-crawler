"""Input handling for game controls."""
from typing import TYPE_CHECKING, Tuple, Optional

from ..core.constants import GameState, UIMode
from ..core.commands import (
    Command, CommandType,
    MOVEMENT_COMMANDS, ITEM_COMMANDS,
    get_movement_delta, get_item_index
)

if TYPE_CHECKING:
    from ..core.game import Game


class InputHandler:
    """Handles all command processing (platform-agnostic)."""

    def __init__(self, game: 'Game'):
        self.game = game
        # Pending drop state for confirmation dialogs
        self._pending_drop_item = None
        self._pending_drop_index = None

    def handle_game_command(self, command: Command) -> bool:
        """
        Handle a command during normal gameplay.

        Args:
            command: The command to process

        Returns:
            True if the player took an action (moved or attacked), False otherwise
        """
        cmd_type = command.type

        # Movement commands
        if cmd_type in MOVEMENT_COMMANDS:
            dx, dy = get_movement_delta(cmd_type)
            return self.game.combat_manager.try_move_or_attack(dx, dy)

        # Item use commands
        if cmd_type in ITEM_COMMANDS:
            item_index = get_item_index(cmd_type)
            if item_index >= 0:
                return self.game.use_item(item_index)
            return False

        # UI screen commands
        if cmd_type == CommandType.OPEN_INVENTORY:
            self.game.ui_mode = UIMode.INVENTORY
            self.game.selected_item_index = 0
            return False

        if cmd_type == CommandType.OPEN_CHARACTER:
            self.game.ui_mode = UIMode.CHARACTER
            return False

        if cmd_type == CommandType.OPEN_HELP:
            self.game.ui_mode = UIMode.HELP
            return False

        if cmd_type == CommandType.OPEN_MESSAGE_LOG:
            self.game.message_log.reset_scroll()
            self.game.ui_mode = UIMode.MESSAGE_LOG
            return False

        if cmd_type == CommandType.QUIT:
            self.game.show_dialog(
                "Quit Game",
                "Save and quit?",
                self._handle_quit_confirm
            )
            return False

        return False

    def handle_inventory_command(self, command: Command):
        """Handle a command while in the inventory screen."""
        cmd_type = command.type
        inventory = self.game.player.inventory

        if cmd_type == CommandType.CLOSE_SCREEN:
            self.game.ui_mode = UIMode.GAME

        elif cmd_type == CommandType.INVENTORY_UP:
            if len(inventory.items) > 0:
                self.game.selected_item_index = (self.game.selected_item_index - 1) % len(inventory.items)

        elif cmd_type == CommandType.INVENTORY_DOWN:
            if len(inventory.items) > 0:
                self.game.selected_item_index = (self.game.selected_item_index + 1) % len(inventory.items)

        elif cmd_type == CommandType.INVENTORY_USE:
            self._use_or_equip_selected_item()

        elif cmd_type == CommandType.INVENTORY_EQUIP:
            self._equip_selected_item()

        elif cmd_type == CommandType.INVENTORY_DROP:
            self._drop_selected_item()

        elif cmd_type == CommandType.INVENTORY_READ:
            self._read_selected_item()

    def handle_character_command(self, command: Command):
        """Handle a command while in the character screen."""
        if command.type == CommandType.CLOSE_SCREEN:
            self.game.ui_mode = UIMode.GAME

    def handle_help_command(self, command: Command):
        """Handle a command while in the help screen."""
        if command.type == CommandType.CLOSE_SCREEN:
            self.game.ui_mode = UIMode.GAME

    def handle_reading_command(self, command: Command):
        """Handle a command while in the reading screen."""
        if command.type == CommandType.CLOSE_SCREEN:
            self.game.ui_mode = UIMode.GAME

    def handle_dialog_command(self, command: Command) -> Optional[bool]:
        """
        Handle a command while a dialog is displayed.

        Returns:
            True if confirmed, False if cancelled, None if no decision yet
        """
        if command.type == CommandType.CONFIRM:
            self.game.ui_mode = UIMode.GAME
            return True

        if command.type == CommandType.CANCEL:
            self.game.ui_mode = UIMode.GAME
            return False

        return None  # No valid response yet

    def handle_message_log_command(self, command: Command, visible_lines: int = 20):
        """
        Handle a command while in the message log screen.

        Args:
            command: The command to process
            visible_lines: Number of visible lines for scrolling calculations
        """
        cmd_type = command.type

        if cmd_type == CommandType.CLOSE_SCREEN:
            self.game.ui_mode = UIMode.GAME

        elif cmd_type == CommandType.SCROLL_UP:
            self.game.message_log.scroll_up()

        elif cmd_type == CommandType.SCROLL_DOWN:
            self.game.message_log.scroll_down(visible_lines=visible_lines)

        elif cmd_type == CommandType.PAGE_UP:
            self.game.message_log.scroll_up(visible_lines)

        elif cmd_type == CommandType.PAGE_DOWN:
            self.game.message_log.scroll_down(visible_lines, visible_lines)

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
        from ..core.constants import ItemRarity
        inventory = self.game.player.inventory
        if 0 <= self.game.selected_item_index < len(inventory.items):
            item = inventory.get_item(self.game.selected_item_index)
            if not item:
                return

            # Check if item is rare or epic - show confirmation
            if item.rarity in (ItemRarity.RARE, ItemRarity.EPIC):
                self._pending_drop_item = item
                self._pending_drop_index = self.game.selected_item_index
                rarity_name = "rare" if item.rarity == ItemRarity.RARE else "epic"
                self.game.show_dialog(
                    "Drop Item",
                    f"Drop {item.name}? It's {rarity_name}!",
                    self._handle_drop_confirm
                )
            else:
                # Common/uncommon items drop immediately
                item = inventory.remove_item(self.game.selected_item_index)
                item.x = self.game.player.x
                item.y = self.game.player.y
                self.game.items.append(item)
                self.game.add_message(f"Dropped {item.name}")
                self._adjust_selection_after_removal()

    def _read_selected_item(self):
        """Read the currently selected item if it's a lore item."""
        from ..items import LoreScroll, LoreBook
        inventory = self.game.player.inventory
        if 0 <= self.game.selected_item_index < len(inventory.items):
            item = inventory.get_item(self.game.selected_item_index)
            if isinstance(item, (LoreScroll, LoreBook)):
                # Store reading content and switch to reading mode
                self.game.reading_title, self.game.reading_content = item.get_text()
                self.game.ui_mode = UIMode.READING
                # Mark lore as discovered
                if hasattr(self.game, 'story_manager'):
                    self.game.story_manager.discover_lore(item.lore_id)
            else:
                self.game.add_message("This item cannot be read.")

    def _adjust_selection_after_removal(self):
        """Adjust the selection index after an item is removed from inventory."""
        inventory = self.game.player.inventory
        if self.game.selected_item_index >= len(inventory.items):
            self.game.selected_item_index = max(0, len(inventory.items) - 1)

    def _handle_quit_confirm(self, confirmed: bool):
        """Handle quit confirmation dialog result."""
        if confirmed:
            if self.game.save_manager.save_game():
                self.game.add_message("Game saved!")
            self.game.state = GameState.QUIT

    def _handle_drop_confirm(self, confirmed: bool):
        """Handle drop rare item confirmation dialog result."""
        if confirmed and self._pending_drop_item is not None:
            inventory = self.game.player.inventory
            item = inventory.remove_item(self._pending_drop_index)
            item.x = self.game.player.x
            item.y = self.game.player.y
            self.game.items.append(item)
            self.game.add_message(f"Dropped {item.name}")
            self._adjust_selection_after_removal()
        self._pending_drop_item = None
        self._pending_drop_index = None

    def handle_title_command(self, command: Command, has_save: bool) -> Optional[str]:
        """
        Handle a command on the title screen.

        Args:
            command: The command to process
            has_save: Whether a save file exists

        Returns:
            'new_game' - Start new game
            'continue' - Load saved game
            'help' - Show help screen
            'quit' - Quit game
            None - No action
        """
        cmd_type = command.type

        if cmd_type == CommandType.NEW_GAME:
            return 'new_game'
        elif cmd_type == CommandType.CONTINUE_GAME and has_save:
            return 'continue'
        elif cmd_type == CommandType.OPEN_HELP:
            return 'help'
        elif cmd_type == CommandType.QUIT:
            return 'quit'

        return None

    def handle_intro_command(self, command: Command, current_page: int, total_pages: int) -> Tuple[int, bool]:
        """
        Handle a command on the intro/prologue screen.

        Args:
            command: The command to process
            current_page: Current page number
            total_pages: Total number of pages

        Returns:
            Tuple of (new_page, should_skip):
            - new_page: The page to display next
            - should_skip: True if player wants to skip intro entirely
        """
        cmd_type = command.type

        # Skip on ESC
        if cmd_type == CommandType.SKIP:
            return current_page, True

        # Continue on Space/Enter
        if cmd_type == CommandType.MENU_SELECT:
            if current_page < total_pages - 1:
                return current_page + 1, False
            else:
                return current_page, True  # Last page, proceed to game

        # Any other key on last page proceeds
        if cmd_type == CommandType.ANY_KEY and current_page >= total_pages - 1:
            return current_page, True

        return current_page, False
