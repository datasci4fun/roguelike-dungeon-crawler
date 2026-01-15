"""UI command processing mixin for GameEngine.

Handles inventory, character, help, reading, dialog, message log,
battle, title, and intro screen command processing.
"""

from typing import Optional, Tuple

from .constants import UIMode, ItemRarity, EquipmentSlot
from .commands import Command, CommandType


class UICommandsMixin:
    """Mixin providing UI command processing methods for GameEngine."""

    # =========================================================================
    # Inventory Commands
    # =========================================================================

    def process_inventory_command(self, command: Command):
        """Process a command while in inventory screen."""
        from ..items import LoreScroll, LoreBook

        cmd_type = command.type
        inventory = self.player.inventory

        if cmd_type == CommandType.CLOSE_SCREEN:
            self.ui_mode = UIMode.GAME

        elif cmd_type == CommandType.INVENTORY_UP:
            if len(inventory.items) > 0:
                self.selected_item_index = (self.selected_item_index - 1) % len(inventory.items)

        elif cmd_type == CommandType.INVENTORY_DOWN:
            if len(inventory.items) > 0:
                self.selected_item_index = (self.selected_item_index + 1) % len(inventory.items)

        elif cmd_type == CommandType.INVENTORY_USE:
            self._use_or_equip_selected_item()

        elif cmd_type == CommandType.INVENTORY_EQUIP:
            self._equip_selected_item()

        elif cmd_type == CommandType.INVENTORY_DROP:
            self._drop_selected_item()

        elif cmd_type == CommandType.INVENTORY_READ:
            self._read_selected_item()

        elif cmd_type == CommandType.INVENTORY_SELECT:
            # Select item by index (from click)
            if command.data and 'index' in command.data:
                index = command.data['index']
                if 0 <= index < len(inventory.items):
                    self.selected_item_index = index

    def _use_or_equip_selected_item(self):
        """Use or equip the currently selected inventory item."""
        inventory = self.player.inventory
        if 0 <= self.selected_item_index < len(inventory.items):
            item = inventory.get_item(self.selected_item_index)
            if item and item.is_equippable():
                message = self.player.equip(item)
                self.add_message(message)
                self._adjust_selection_after_removal()
            elif self.use_item(self.selected_item_index):
                self._adjust_selection_after_removal()

    def _equip_selected_item(self):
        """Equip the currently selected inventory item."""
        inventory = self.player.inventory
        if 0 <= self.selected_item_index < len(inventory.items):
            item = inventory.get_item(self.selected_item_index)
            if item and item.is_equippable():
                message = self.player.equip(item)
                self.add_message(message)
                self._adjust_selection_after_removal()
            else:
                self.add_message("Cannot equip this item!")

    def _drop_selected_item(self):
        """Drop the currently selected inventory item."""
        inventory = self.player.inventory
        if 0 <= self.selected_item_index < len(inventory.items):
            item = inventory.get_item(self.selected_item_index)
            if not item:
                return

            # Check if item is rare or epic - show confirmation
            if item.rarity in (ItemRarity.RARE, ItemRarity.EPIC):
                self._pending_drop_item = item
                self._pending_drop_index = self.selected_item_index
                rarity_name = "rare" if item.rarity == ItemRarity.RARE else "epic"
                self.show_dialog(
                    "Drop Item",
                    f"Drop {item.name}? It's {rarity_name}!",
                    self._handle_drop_confirm
                )
            else:
                # Common/uncommon items drop immediately
                item = inventory.remove_item(self.selected_item_index)
                item.x = self.player.x
                item.y = self.player.y
                self.entity_manager.items.append(item)
                self.add_message(f"Dropped {item.name}")
                self._adjust_selection_after_removal()

    def _read_selected_item(self):
        """Read the currently selected item if it's a lore item."""
        from ..items import LoreScroll, LoreBook

        inventory = self.player.inventory
        if 0 <= self.selected_item_index < len(inventory.items):
            item = inventory.get_item(self.selected_item_index)
            if isinstance(item, (LoreScroll, LoreBook)):
                self.reading_title, self.reading_content = item.get_text()
                self.ui_mode = UIMode.READING
                self.story_manager.discover_lore(item.lore_id)
            else:
                self.add_message("This item cannot be read.")

    def _adjust_selection_after_removal(self):
        """Adjust selection index after item removal."""
        inventory = self.player.inventory
        if self.selected_item_index >= len(inventory.items):
            self.selected_item_index = max(0, len(inventory.items) - 1)

    # =========================================================================
    # Other UI Mode Commands
    # =========================================================================

    def process_character_command(self, command: Command):
        """Process a command in character screen."""
        cmd_type = command.type

        if cmd_type == CommandType.CLOSE_SCREEN:
            self.ui_mode = UIMode.GAME

        # Equipment unequip commands
        elif cmd_type == CommandType.UNEQUIP_WEAPON:
            message = self.player.unequip(EquipmentSlot.WEAPON)
            self.add_message(message)

        elif cmd_type == CommandType.UNEQUIP_ARMOR:
            message = self.player.unequip(EquipmentSlot.ARMOR)
            self.add_message(message)

        elif cmd_type == CommandType.UNEQUIP_OFF_HAND:
            message = self.player.unequip(EquipmentSlot.OFF_HAND)
            self.add_message(message)

        elif cmd_type == CommandType.UNEQUIP_RING:
            message = self.player.unequip(EquipmentSlot.RING)
            self.add_message(message)

        elif cmd_type == CommandType.UNEQUIP_AMULET:
            message = self.player.unequip(EquipmentSlot.AMULET)
            self.add_message(message)

        # Inventory commands (for Inventory tab in CharacterWindow)
        elif cmd_type == CommandType.INVENTORY_UP:
            inventory = self.player.inventory
            if len(inventory.items) > 0:
                self.selected_item_index = (self.selected_item_index - 1) % len(inventory.items)

        elif cmd_type == CommandType.INVENTORY_DOWN:
            inventory = self.player.inventory
            if len(inventory.items) > 0:
                self.selected_item_index = (self.selected_item_index + 1) % len(inventory.items)

        elif cmd_type == CommandType.INVENTORY_SELECT:
            if command.data and 'index' in command.data:
                index = command.data['index']
                inventory = self.player.inventory
                if 0 <= index < len(inventory.items):
                    self.selected_item_index = index

        elif cmd_type == CommandType.INVENTORY_USE:
            self._use_or_equip_selected_item()

        elif cmd_type == CommandType.INVENTORY_DROP:
            self._drop_selected_item()

        elif cmd_type == CommandType.INVENTORY_READ:
            self._read_selected_item()

    def process_help_command(self, command: Command):
        """Process a command in help screen."""
        if command.type == CommandType.CLOSE_SCREEN:
            self.ui_mode = UIMode.GAME

    def process_reading_command(self, command: Command):
        """Process a command in reading screen."""
        if command.type == CommandType.CLOSE_SCREEN:
            self.ui_mode = UIMode.GAME

    def process_dialog_command(self, command: Command) -> Optional[bool]:
        """Process a command in dialog. Returns True/False/None."""
        if command.type == CommandType.CONFIRM:
            self.ui_mode = UIMode.GAME
            if self.dialog_callback:
                self.dialog_callback(True)
                self.dialog_callback = None
            return True

        if command.type == CommandType.CANCEL:
            self.ui_mode = UIMode.GAME
            if self.dialog_callback:
                self.dialog_callback(False)
                self.dialog_callback = None
            return False

        return None

    def process_message_log_command(self, command: Command, visible_lines: int = 20):
        """Process a command in message log screen."""
        cmd_type = command.type

        if cmd_type == CommandType.CLOSE_SCREEN:
            self.ui_mode = UIMode.GAME

        elif cmd_type == CommandType.SCROLL_UP:
            self.message_log.scroll_up()

        elif cmd_type == CommandType.SCROLL_DOWN:
            self.message_log.scroll_down(visible_lines=visible_lines)

        elif cmd_type == CommandType.PAGE_UP:
            self.message_log.scroll_up(visible_lines)

        elif cmd_type == CommandType.PAGE_DOWN:
            self.message_log.scroll_down(visible_lines, visible_lines)

    def process_battle_command(self, command: Command) -> bool:
        """
        Process a command during tactical battle mode (v6.0.4).

        Handles movement, abilities, and battle actions.

        Returns:
            True if command was processed
        """
        # Check for ability command (passed via command.data)
        if command.data and 'ability' in command.data:
            ability_cmd = command.data['ability']
            return self.battle_manager.process_battle_command(ability_cmd)

        return self.battle_manager.process_battle_command(command.type.name)

    # =========================================================================
    # Title/Intro Commands
    # =========================================================================

    def process_title_command(self, command: Command, has_save: bool) -> Optional[str]:
        """Process a command on title screen. Returns action string or None."""
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

    def process_intro_command(self, command: Command) -> Tuple[int, bool]:
        """Process a command during intro. Returns (new_page, should_skip)."""
        cmd_type = command.type

        if cmd_type == CommandType.SKIP:
            return self.intro_page, True

        if cmd_type == CommandType.MENU_SELECT:
            if self.intro_page < self.intro_total_pages - 1:
                self.intro_page += 1
                return self.intro_page, False
            else:
                return self.intro_page, True

        if cmd_type == CommandType.ANY_KEY and self.intro_page >= self.intro_total_pages - 1:
            return self.intro_page, True

        return self.intro_page, False
