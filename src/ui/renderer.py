"""Terminal rendering using curses."""
import curses
import os
import sys
from typing import List, Tuple, Dict, Any

from ..core.constants import (
    STATS_PANEL_WIDTH, MESSAGE_LOG_SIZE, MESSAGE_AREA_HEIGHT, SHORTCUT_BAR_HEIGHT,
    BOX_TL, BOX_TR, BOX_BL, BOX_BR, BOX_H, BOX_V,
    BOX_TL_ASCII, BOX_TR_ASCII, BOX_BL_ASCII, BOX_BR_ASCII,
    BOX_H_ASCII, BOX_V_ASCII
)
from ..world import Dungeon
from ..world.traps import Trap
from ..world.hazards import Hazard
from ..entities import Player, Enemy
from ..items import Item
from .animation_manager import AnimationManager
from .render_colors import get_element_color, get_message_color
from . import renderer_world
from . import renderer_ui_panel


class Renderer:
    """Handles all terminal rendering using curses."""

    def __init__(self, stdscr):
        self.stdscr = stdscr
        curses.curs_set(0)  # Hide cursor
        self.stdscr.clear()

        # Animation manager handles all visual effects
        self._anim_mgr = AnimationManager()

        # Detect Unicode support - be conservative on Windows
        self.use_unicode = self._detect_unicode_support()

        # Initialize color pairs if available
        if curses.has_colors():
            curses.init_pair(1, curses.COLOR_WHITE, curses.COLOR_BLACK)  # Default
            curses.init_pair(2, curses.COLOR_YELLOW, curses.COLOR_BLACK)  # Player
            curses.init_pair(3, curses.COLOR_RED, curses.COLOR_BLACK)     # Enemy
            curses.init_pair(4, curses.COLOR_GREEN, curses.COLOR_BLACK)   # Health
            curses.init_pair(5, curses.COLOR_CYAN, curses.COLOR_BLACK)    # Items (uncommon)
            curses.init_pair(6, curses.COLOR_MAGENTA, curses.COLOR_BLACK) # Elite Enemy / Epic items
            curses.init_pair(7, 8, curses.COLOR_BLACK)                    # Dim (dark gray)
            # Bright colors for messages (will use BOLD attribute for brightness)
            curses.init_pair(8, curses.COLOR_RED, curses.COLOR_BLACK)     # Bright red (combat kill)
            curses.init_pair(9, curses.COLOR_YELLOW, curses.COLOR_BLACK)  # Bright yellow (level up)
            curses.init_pair(10, curses.COLOR_GREEN, curses.COLOR_BLACK)  # Bright green (healing)
            curses.init_pair(11, curses.COLOR_BLUE, curses.COLOR_BLACK)   # Blue (rare items)

    def _detect_unicode_support(self) -> bool:
        """
        Detect if the terminal properly supports Unicode box-drawing characters.
        Be conservative - default to ASCII on Windows to avoid rendering issues.
        """
        # On Windows, Unicode support in curses is unreliable
        if sys.platform == 'win32':
            # Check if running in Windows Terminal (supports Unicode well)
            # or legacy console (often has issues)
            wt_session = os.environ.get('WT_SESSION')
            if wt_session:
                # Windows Terminal - likely supports Unicode
                return True
            # Legacy console or unknown - use ASCII to be safe
            return False

        # On Unix-like systems, check locale
        import locale
        try:
            encoding = locale.getpreferredencoding()
            return 'utf' in encoding.lower()
        except Exception:
            return False

    def _calculate_viewport(self, player: Player, dungeon: Dungeon) -> Tuple[int, int, int, int]:
        """
        Calculate the viewport (camera) position centered on the player.

        Returns:
            Tuple of (viewport_x, viewport_y, viewport_width, viewport_height)
            viewport_x/y are the top-left corner of the visible area in world coordinates
        """
        max_y, max_x = self.stdscr.getmaxyx()

        # Available space for dungeon (screen minus UI panel, shortcut bar, and message area)
        viewport_width = max_x - STATS_PANEL_WIDTH - 1
        viewport_height = max_y - SHORTCUT_BAR_HEIGHT - MESSAGE_AREA_HEIGHT - 1  # Leave room for shortcut bar and messages

        # Center viewport on player
        viewport_x = player.x - viewport_width // 2
        viewport_y = player.y - viewport_height // 2

        # Clamp viewport to dungeon bounds
        viewport_x = max(0, min(viewport_x, dungeon.width - viewport_width))
        viewport_y = max(0, min(viewport_y, dungeon.height - viewport_height))

        # Handle case where dungeon is smaller than viewport
        if dungeon.width < viewport_width:
            viewport_x = 0
        if dungeon.height < viewport_height:
            viewport_y = 0

        return (viewport_x, viewport_y, viewport_width, viewport_height)

    def _world_to_screen(self, world_x: int, world_y: int, viewport_x: int, viewport_y: int) -> Tuple[int, int]:
        """Convert world coordinates to screen coordinates."""
        return (world_x - viewport_x, world_y - viewport_y)

    def _is_in_viewport(self, world_x: int, world_y: int, viewport_x: int, viewport_y: int,
                        viewport_width: int, viewport_height: int) -> bool:
        """Check if a world position is within the current viewport."""
        screen_x = world_x - viewport_x
        screen_y = world_y - viewport_y
        return 0 <= screen_x < viewport_width and 0 <= screen_y < viewport_height

    def _get_element_color(self, enemy) -> int:
        """Get the curses color pair for an enemy based on their current element."""
        return get_element_color(enemy)

    def _smart_truncate(self, text: str, max_length: int) -> str:
        """
        Truncate text intelligently, respecting word boundaries.

        Args:
            text: The text to truncate
            max_length: Maximum length of output

        Returns:
            Truncated text with ellipsis if needed
        """
        if len(text) <= max_length:
            return text

        # If we need to truncate, try to break at a word boundary
        if max_length <= 3:
            return text[:max_length]

        # Reserve 3 chars for "..."
        truncate_at = max_length - 3

        # Find the last space before the truncation point
        last_space = text[:truncate_at].rfind(' ')

        if last_space > 0 and last_space > truncate_at // 2:
            # Found a good break point (not too early)
            return text[:last_space] + "..."
        else:
            # No good break point, just hard truncate
            return text[:truncate_at] + "..."

    def render(self, dungeon: Dungeon, player: Player, enemies: List[Enemy], items: List[Item], messages: List[str],
                visible_traps: List[Trap] = None, hazards: List[Hazard] = None):
        """Render the entire game state."""
        # Clean up expired animations
        self._anim_mgr.cleanup_expired()

        self.stdscr.clear()

        # Calculate viewport centered on player
        vp_x, vp_y, vp_w, vp_h = self._calculate_viewport(player, dungeon)

        # Render dungeon
        self._render_dungeon(dungeon, vp_x, vp_y, vp_w, vp_h)

        # Render terrain features (water, blood, grass)
        self._render_terrain(dungeon, vp_x, vp_y, vp_w, vp_h)

        # Render zone evidence (trail tells, lore markers)
        self._render_zone_evidence(dungeon, vp_x, vp_y, vp_w, vp_h)

        # v4.0: Render hazards (lava, ice, poison gas, deep water)
        if hazards:
            self._render_hazards(hazards, dungeon, vp_x, vp_y, vp_w, vp_h)

        # Render decorations (after dungeon, before entities)
        self._render_decorations(dungeon, vp_x, vp_y, vp_w, vp_h)

        # v4.0: Render visible traps (before items/enemies)
        if visible_traps:
            self._render_traps(visible_traps, dungeon, vp_x, vp_y, vp_w, vp_h)

        # Render items (before enemies and player) - only visible
        self._render_items(items, dungeon, vp_x, vp_y, vp_w, vp_h)

        # Render enemies - only visible (pass player for stealth detection)
        self._render_enemies(enemies, dungeon, player, vp_x, vp_y, vp_w, vp_h)

        # Render player (always on top)
        self._render_player(player, vp_x, vp_y, vp_w, vp_h)

        # Render damage numbers (above entities)
        self._render_damage_numbers(dungeon, vp_x, vp_y, vp_w, vp_h)

        # Render attack direction indicators
        self._render_direction_indicators(dungeon, vp_x, vp_y, vp_w, vp_h)

        # Render UI panel (sidebar)
        self._render_ui_panel(player, dungeon, enemies, items)

        # Render shortcut bar between dungeon and messages
        self._render_shortcut_bar(vp_h)

        # Render message log at bottom of screen
        self._render_bottom_messages(messages, vp_h)

        self.stdscr.refresh()

    # Public animation methods (delegate to AnimationManager)

    def add_hit_animation(self, entity: Any, duration: float = 0.15):
        """Add a hit flash animation to an entity."""
        self._anim_mgr.add_hit_animation(entity, duration)

    def add_damage_number(self, x: int, y: int, damage: int, duration: float = 0.5):
        """Add a floating damage number above a position."""
        self._anim_mgr.add_damage_number(x, y, damage, duration)

    def add_direction_indicator(self, from_x: int, from_y: int, to_x: int, to_y: int, duration: float = 0.1):
        """Add an attack direction arrow from attacker to target."""
        self._anim_mgr.add_direction_indicator(from_x, from_y, to_x, to_y, duration)

    def add_death_flash(self, x: int, y: int, duration: float = 0.2):
        """Add a brief death flash where an enemy died."""
        self._anim_mgr.add_death_flash(x, y, duration)

    def _render_dungeon(self, dungeon: Dungeon, vp_x: int, vp_y: int, vp_w: int, vp_h: int):
        """Render the dungeon tiles within the viewport."""
        renderer_world.render_dungeon(self.stdscr, dungeon, vp_x, vp_y, vp_w, vp_h, self.use_unicode)

    def _render_terrain(self, dungeon: Dungeon, vp_x: int, vp_y: int, vp_w: int, vp_h: int):
        """Render terrain features (water, blood, grass) in explored/visible tiles."""
        renderer_world.render_terrain(self.stdscr, dungeon, vp_x, vp_y, vp_w, vp_h,
                                       self._is_in_viewport, self._world_to_screen)

    def _render_zone_evidence(self, dungeon: Dungeon, vp_x: int, vp_y: int, vp_w: int, vp_h: int):
        """Render zone evidence (trail tells, lore markers) in explored/visible tiles."""
        renderer_world.render_zone_evidence(self.stdscr, dungeon, vp_x, vp_y, vp_w, vp_h,
                                             self._is_in_viewport, self._world_to_screen)

    def _render_hazards(self, hazards: List[Hazard], dungeon: Dungeon, vp_x: int, vp_y: int, vp_w: int, vp_h: int):
        """Render environmental hazards (lava, ice, poison gas, deep water)."""
        renderer_world.render_hazards(self.stdscr, hazards, dungeon, vp_x, vp_y, vp_w, vp_h,
                                       self._is_in_viewport, self._world_to_screen)

    def _render_traps(self, visible_traps: List[Trap], dungeon: Dungeon, vp_x: int, vp_y: int, vp_w: int, vp_h: int):
        """Render visible (detected) traps."""
        renderer_world.render_traps(self.stdscr, visible_traps, dungeon, vp_x, vp_y, vp_w, vp_h,
                                     self._is_in_viewport, self._world_to_screen)

    def _render_decorations(self, dungeon: Dungeon, vp_x: int, vp_y: int, vp_w: int, vp_h: int):
        """Render decorations in explored/visible tiles."""
        renderer_world.render_decorations(self.stdscr, dungeon, vp_x, vp_y, vp_w, vp_h,
                                           self._is_in_viewport, self._world_to_screen)

    def _render_items(self, items: List[Item], dungeon: Dungeon, vp_x: int, vp_y: int, vp_w: int, vp_h: int):
        """Render all items on the ground (only if visible)."""
        renderer_world.render_items(self.stdscr, items, dungeon, vp_x, vp_y, vp_w, vp_h,
                                     self._is_in_viewport, self._world_to_screen)

    def _render_enemies(self, enemies: List[Enemy], dungeon: Dungeon, player: Player, vp_x: int, vp_y: int, vp_w: int, vp_h: int):
        """Render all living enemies (only if visible)."""
        renderer_world.render_enemies(self.stdscr, enemies, dungeon, player, vp_x, vp_y, vp_w, vp_h,
                                       self._is_in_viewport, self._world_to_screen,
                                       self._get_element_color, self._anim_mgr.is_entity_animated)

    def _render_player(self, player: Player, vp_x: int, vp_y: int, vp_w: int, vp_h: int):
        """Render the player."""
        renderer_world.render_player(self.stdscr, player, vp_x, vp_y, vp_w, vp_h,
                                      self._is_in_viewport, self._world_to_screen,
                                      self._anim_mgr.is_entity_animated)

    def _render_damage_numbers(self, dungeon: Dungeon, vp_x: int, vp_y: int, vp_w: int, vp_h: int):
        """Render floating damage numbers above entities."""
        renderer_world.render_damage_numbers(self.stdscr, dungeon, vp_x, vp_y, vp_w, vp_h,
                                              self._anim_mgr.damage_numbers,
                                              self._is_in_viewport, self._world_to_screen)

    def _render_direction_indicators(self, dungeon: Dungeon, vp_x: int, vp_y: int, vp_w: int, vp_h: int):
        """Render attack direction arrows."""
        renderer_world.render_direction_indicators(self.stdscr, dungeon, vp_x, vp_y, vp_w, vp_h,
                                                    self._anim_mgr.direction_indicators,
                                                    self._is_in_viewport, self._world_to_screen)

    def _render_shortcut_bar(self, viewport_height: int):
        """Render the shortcut key bar between dungeon and messages."""
        max_y, max_x = self.stdscr.getmaxyx()

        # Shortcut bar is right below the viewport
        bar_y = viewport_height
        bar_width = max_x - STATS_PANEL_WIDTH

        try:
            # Build shortcut string with highlighted keys
            shortcuts = [
                ("[I]", "nventory"),
                ("[C]", "haracter"),
                ("[?]", " Help"),
                ("[Q]", "uit"),
            ]

            # Render shortcuts centered in the bar
            shortcut_str = "  ".join(f"{key}{label}" for key, label in shortcuts)
            start_x = (bar_width - len(shortcut_str)) // 2
            if start_x < 1:
                start_x = 1

            # Clear the bar area first (full width to prevent panel border bleed-through)
            self.stdscr.addstr(bar_y, 0, " " * bar_width)

            # Render each shortcut with highlighted key
            x_pos = start_x
            for key, label in shortcuts:
                if x_pos + len(key) + len(label) >= bar_width:
                    break

                # Render the key in yellow/bold
                if curses.has_colors():
                    self.stdscr.addstr(bar_y, x_pos, key, curses.color_pair(2) | curses.A_BOLD)
                else:
                    self.stdscr.addstr(bar_y, x_pos, key, curses.A_BOLD)
                x_pos += len(key)

                # Render the label normally
                self.stdscr.addstr(bar_y, x_pos, label)
                x_pos += len(label) + 2  # +2 for spacing between shortcuts

        except curses.error:
            pass

    def _render_bottom_messages(self, messages: List[str], viewport_height: int):
        """Render the message log at the bottom of the screen."""
        max_y, max_x = self.stdscr.getmaxyx()

        # Message area starts below the viewport and shortcut bar
        msg_area_y = viewport_height + SHORTCUT_BAR_HEIGHT

        # Choose border characters based on terminal capability
        use_unicode = self.use_unicode
        h_char = BOX_H if use_unicode else BOX_H_ASCII
        v_char = BOX_V if use_unicode else BOX_V_ASCII
        tl = BOX_TL if use_unicode else BOX_TL_ASCII
        tr = BOX_TR if use_unicode else BOX_TR_ASCII
        bl = BOX_BL if use_unicode else BOX_BL_ASCII
        br = BOX_BR if use_unicode else BOX_BR_ASCII

        # Width spans from left edge to before the stats panel
        msg_width = max_x - STATS_PANEL_WIDTH

        try:
            # Draw top border of message area (use addstr for Unicode compatibility)
            self.stdscr.addstr(msg_area_y, 0, tl)
            for x in range(1, msg_width - 1):
                self.stdscr.addstr(msg_area_y, x, h_char)
            self.stdscr.addstr(msg_area_y, msg_width - 1, tr)

            # Draw message content area with borders
            for i in range(MESSAGE_LOG_SIZE + 1):  # +1 for header
                row_y = msg_area_y + 1 + i
                if row_y >= max_y:
                    break

                # Left border
                self.stdscr.addstr(row_y, 0, v_char)
                # Right border
                self.stdscr.addstr(row_y, msg_width - 1, v_char)

            # Draw bottom border
            bottom_y = msg_area_y + MESSAGE_LOG_SIZE + 2
            if bottom_y < max_y:
                self.stdscr.addstr(bottom_y, 0, bl)
                for x in range(1, msg_width - 1):
                    self.stdscr.addstr(bottom_y, x, h_char)
                self.stdscr.addstr(bottom_y, msg_width - 1, br)

            # Draw header
            header_y = msg_area_y + 1
            if header_y < max_y:
                header = " MESSAGES "
                self.stdscr.addstr(header_y, 2, header)

            # Draw messages
            content_width = msg_width - 4  # Account for borders and padding
            for i, message in enumerate(messages[-MESSAGE_LOG_SIZE:]):
                msg_y = msg_area_y + 2 + i
                if msg_y >= max_y - 1:
                    break

                # Truncate message if too long
                display_msg = self._smart_truncate(message, content_width)

                # Apply color coding based on message content
                color = self._get_message_color(message)
                self.stdscr.addstr(msg_y, 2, display_msg, color)

        except curses.error:
            pass

    def _get_message_color(self, message: str) -> int:
        """Determine the color pair and attributes for a message based on its content."""
        return get_message_color(message)

    def _render_ui_panel(self, player: Player, dungeon: Dungeon, enemies: List[Enemy],
                         items: List[Item]):
        """Render the UI panel on the right side (stats, minimap, inventory, controls)."""
        renderer_ui_panel.render_ui_panel(self.stdscr, player, dungeon, enemies, items,
                                           self.use_unicode, self._smart_truncate)

    def render_game_over(self, player: Player, death_info: dict = None):
        """Render the game over screen with death recap."""
        from .screens import render_game_over
        render_game_over(self.stdscr, player, death_info)

    def render_inventory_screen(self, player: Player, selected_index: int, dungeon_level: int):
        """Render the full-screen inventory management screen."""
        from .screens import render_inventory_screen
        render_inventory_screen(self.stdscr, player, selected_index, dungeon_level, self.use_unicode)

    def render_character_screen(self, player: Player, dungeon_level: int):
        """Render the full-screen character stats screen."""
        from .screens import render_character_screen
        render_character_screen(self.stdscr, player, dungeon_level, self.use_unicode)

    def render_help_screen(self):
        """Render the help screen with controls and game info."""
        from .screens import render_help_screen
        render_help_screen(self.stdscr, self.use_unicode)
