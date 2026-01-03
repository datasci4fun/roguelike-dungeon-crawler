"""Terminal rendering using curses."""
import curses
import os
import sys
import time
from typing import List, Tuple, Dict, Any

from ..core.constants import (
    STATS_PANEL_WIDTH, MESSAGE_LOG_SIZE, MESSAGE_AREA_HEIGHT, SHORTCUT_BAR_HEIGHT, BAR_WIDTH,
    BOX_TL, BOX_TR, BOX_BL, BOX_BR, BOX_H, BOX_V, BOX_LEFT, BOX_RIGHT,
    BOX_TL_ASCII, BOX_TR_ASCII, BOX_BL_ASCII, BOX_BR_ASCII,
    BOX_H_ASCII, BOX_V_ASCII, BOX_LEFT_ASCII, BOX_RIGHT_ASCII
)
from ..world import Dungeon
from ..world.traps import Trap
from ..world.hazards import Hazard
from ..entities import Player, Enemy
from ..items import Item


class Renderer:
    """Handles all terminal rendering using curses."""

    def __init__(self, stdscr):
        self.stdscr = stdscr
        curses.curs_set(0)  # Hide cursor
        self.stdscr.clear()

        # Animation tracking
        self.animations: List[Dict[str, Any]] = []  # Entity hit animations
        self.damage_numbers: List[Dict[str, Any]] = []  # Floating damage numbers
        self.direction_indicators: List[Dict[str, Any]] = []  # Attack direction arrows
        self.corpses: List[Dict[str, Any]] = []  # Temporary corpse animations (flash on death)

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
        self._cleanup_animations()

        self.stdscr.clear()

        # Calculate viewport centered on player
        vp_x, vp_y, vp_w, vp_h = self._calculate_viewport(player, dungeon)

        # Render dungeon
        self._render_dungeon(dungeon, vp_x, vp_y, vp_w, vp_h)

        # Render terrain features (water, blood, grass)
        self._render_terrain(dungeon, vp_x, vp_y, vp_w, vp_h)

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

        # Render enemies - only visible
        self._render_enemies(enemies, dungeon, vp_x, vp_y, vp_w, vp_h)

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

    # Public animation methods (called by game.py)

    def add_hit_animation(self, entity: Any, duration: float = 0.15):
        """
        Add a hit flash animation to an entity.

        Args:
            entity: The entity that was hit (Player or Enemy)
            duration: How long the flash lasts (seconds)
        """
        self.animations.append({
            'entity': entity,
            'effect': 'hit',
            'start_time': time.time(),
            'duration': duration
        })

    def add_damage_number(self, x: int, y: int, damage: int, duration: float = 0.5):
        """
        Add a floating damage number above a position.

        Args:
            x: X coordinate
            y: Y coordinate
            damage: Amount of damage to display
            duration: How long the number floats (seconds)
        """
        self.damage_numbers.append({
            'x': x,
            'y': y - 1,  # Display above the entity
            'text': f"-{damage}",
            'start_time': time.time(),
            'duration': duration
        })

    def add_direction_indicator(self, from_x: int, from_y: int, to_x: int, to_y: int, duration: float = 0.1):
        """
        Add an attack direction arrow from attacker to target.

        Args:
            from_x, from_y: Attacker position
            to_x, to_y: Target position
            duration: How long the arrow shows (seconds)
        """
        # Calculate direction
        dx = to_x - from_x
        dy = to_y - from_y

        # Determine arrow character
        if dx == 0 and dy < 0:
            arrow = '↑'
        elif dx == 0 and dy > 0:
            arrow = '↓'
        elif dx < 0 and dy == 0:
            arrow = '←'
        elif dx > 0 and dy == 0:
            arrow = '→'
        elif dx > 0 and dy < 0:
            arrow = '↗'
        elif dx > 0 and dy > 0:
            arrow = '↘'
        elif dx < 0 and dy > 0:
            arrow = '↙'
        elif dx < 0 and dy < 0:
            arrow = '↖'
        else:
            arrow = '·'  # Fallback for same position

        # Place arrow between attacker and target
        arrow_x = from_x + (1 if dx > 0 else -1 if dx < 0 else 0)
        arrow_y = from_y + (1 if dy > 0 else -1 if dy < 0 else 0)

        self.direction_indicators.append({
            'x': arrow_x,
            'y': arrow_y,
            'char': arrow,
            'start_time': time.time(),
            'duration': duration
        })

    def add_death_flash(self, x: int, y: int, duration: float = 0.2):
        """
        Add a brief death flash where an enemy died (will be replaced by corpse).

        Args:
            x, y: Position where entity died
            duration: How long the flash lasts (seconds)
        """
        self.corpses.append({
            'x': x,
            'y': y,
            'char': '%',
            'start_time': time.time(),
            'duration': duration,
            'phase': 'flash'  # 'flash' = bright, will transition to permanent corpse in dungeon
        })

    def _cleanup_animations(self):
        """Remove expired animations."""
        current_time = time.time()

        # Remove expired hit animations
        self.animations = [anim for anim in self.animations
                          if current_time - anim['start_time'] < anim['duration']]

        # Remove expired damage numbers
        self.damage_numbers = [num for num in self.damage_numbers
                              if current_time - num['start_time'] < num['duration']]

        # Remove expired direction indicators
        self.direction_indicators = [ind for ind in self.direction_indicators
                                    if current_time - ind['start_time'] < ind['duration']]

        # Remove expired corpse flashes
        self.corpses = [corpse for corpse in self.corpses
                       if current_time - corpse['start_time'] < corpse['duration']]

    def _render_dungeon(self, dungeon: Dungeon, vp_x: int, vp_y: int, vp_w: int, vp_h: int):
        """Render the dungeon tiles within the viewport."""
        use_unicode = self.use_unicode

        # Iterate over viewport area and render corresponding dungeon tiles
        for screen_y in range(vp_h):
            for screen_x in range(vp_w):
                # Convert screen coordinates to world coordinates
                world_x = vp_x + screen_x
                world_y = vp_y + screen_y

                # Skip if outside dungeon bounds
                if not (0 <= world_x < dungeon.width and 0 <= world_y < dungeon.height):
                    continue

                try:
                    # Only render explored tiles
                    if not dungeon.explored[world_y][world_x]:
                        continue  # Unexplored tiles are not rendered (remain black)

                    # Get themed visual character
                    visual_char = dungeon.get_visual_char(world_x, world_y, use_unicode)

                    # Visible tiles render normally, explored-but-not-visible render dim
                    # Use addstr for Unicode compatibility on Windows
                    if dungeon.visible[world_y][world_x]:
                        self.stdscr.addstr(screen_y, screen_x, visual_char)
                    else:
                        # Dim rendering for explored but not visible
                        if curses.has_colors():
                            self.stdscr.addstr(screen_y, screen_x, visual_char, curses.color_pair(7))
                        else:
                            self.stdscr.addstr(screen_y, screen_x, visual_char)
                except curses.error:
                    # Ignore errors from trying to write to bottom-right corner
                    pass

    def _render_terrain(self, dungeon: Dungeon, vp_x: int, vp_y: int, vp_w: int, vp_h: int):
        """Render terrain features (water, blood, grass) in explored/visible tiles."""
        for world_x, world_y, char, color_pair in dungeon.terrain_features:
            # Only render terrain in explored tiles
            if not (0 <= world_y < dungeon.height and 0 <= world_x < dungeon.width):
                continue

            if not dungeon.explored[world_y][world_x]:
                continue

            # Check if in viewport
            if not self._is_in_viewport(world_x, world_y, vp_x, vp_y, vp_w, vp_h):
                continue

            screen_x, screen_y = self._world_to_screen(world_x, world_y, vp_x, vp_y)

            try:
                # Render dim if not visible (use addstr for Unicode compatibility)
                if dungeon.visible[world_y][world_x]:
                    if curses.has_colors():
                        self.stdscr.addstr(screen_y, screen_x, char, curses.color_pair(color_pair))
                    else:
                        self.stdscr.addstr(screen_y, screen_x, char)
                else:
                    # Dim rendering for explored but not visible
                    if curses.has_colors():
                        self.stdscr.addstr(screen_y, screen_x, char, curses.color_pair(7))
                    else:
                        self.stdscr.addstr(screen_y, screen_x, char)
            except curses.error:
                pass

    def _render_hazards(self, hazards: List[Hazard], dungeon: Dungeon, vp_x: int, vp_y: int, vp_w: int, vp_h: int):
        """Render environmental hazards (lava, ice, poison gas, deep water)."""
        for hazard in hazards:
            world_x, world_y = hazard.x, hazard.y

            # Only render in explored tiles
            if not (0 <= world_y < dungeon.height and 0 <= world_x < dungeon.width):
                continue

            if not dungeon.explored[world_y][world_x]:
                continue

            # Check if in viewport
            if not self._is_in_viewport(world_x, world_y, vp_x, vp_y, vp_w, vp_h):
                continue

            screen_x, screen_y = self._world_to_screen(world_x, world_y, vp_x, vp_y)

            try:
                symbol = hazard.symbol
                color_pair = hazard.color

                # Render dim if not visible
                if dungeon.visible[world_y][world_x]:
                    if curses.has_colors():
                        self.stdscr.addstr(screen_y, screen_x, symbol, curses.color_pair(color_pair))
                    else:
                        self.stdscr.addstr(screen_y, screen_x, symbol)
                else:
                    # Dim rendering for explored but not visible
                    if curses.has_colors():
                        self.stdscr.addstr(screen_y, screen_x, symbol, curses.color_pair(7))
                    else:
                        self.stdscr.addstr(screen_y, screen_x, symbol)
            except curses.error:
                pass

    def _render_traps(self, visible_traps: List[Trap], dungeon: Dungeon, vp_x: int, vp_y: int, vp_w: int, vp_h: int):
        """Render visible (detected) traps."""
        for trap in visible_traps:
            world_x, world_y = trap.x, trap.y

            # Only render in visible tiles
            if not (0 <= world_y < dungeon.height and 0 <= world_x < dungeon.width):
                continue

            if not dungeon.visible[world_y][world_x]:
                continue

            # Check if in viewport
            if not self._is_in_viewport(world_x, world_y, vp_x, vp_y, vp_w, vp_h):
                continue

            screen_x, screen_y = self._world_to_screen(world_x, world_y, vp_x, vp_y)

            try:
                symbol = trap.symbol  # Gets visible symbol since trap is not hidden
                # Traps render in red (dangerous)
                if curses.has_colors():
                    self.stdscr.addstr(screen_y, screen_x, symbol, curses.color_pair(3))
                else:
                    self.stdscr.addstr(screen_y, screen_x, symbol)
            except curses.error:
                pass

    def _render_decorations(self, dungeon: Dungeon, vp_x: int, vp_y: int, vp_w: int, vp_h: int):
        """Render decorations in explored/visible tiles."""
        for world_x, world_y, char, color_pair in dungeon.decorations:
            # Only render decorations in explored tiles
            if not (0 <= world_y < dungeon.height and 0 <= world_x < dungeon.width):
                continue

            if not dungeon.explored[world_y][world_x]:
                continue

            # Check if in viewport
            if not self._is_in_viewport(world_x, world_y, vp_x, vp_y, vp_w, vp_h):
                continue

            screen_x, screen_y = self._world_to_screen(world_x, world_y, vp_x, vp_y)

            try:
                # Render dim if not visible (use addstr for Unicode compatibility)
                if dungeon.visible[world_y][world_x]:
                    if curses.has_colors():
                        self.stdscr.addstr(screen_y, screen_x, char, curses.color_pair(color_pair))
                    else:
                        self.stdscr.addstr(screen_y, screen_x, char)
                else:
                    # Dim rendering for explored but not visible
                    if curses.has_colors():
                        self.stdscr.addstr(screen_y, screen_x, char, curses.color_pair(7))
                    else:
                        self.stdscr.addstr(screen_y, screen_x, char)
            except curses.error:
                pass

    def _render_items(self, items: List[Item], dungeon: Dungeon, vp_x: int, vp_y: int, vp_w: int, vp_h: int):
        """Render all items on the ground (only if visible)."""
        from ..core.constants import ITEM_RARITY_COLORS

        for item in items:
            # Check if in viewport
            if not self._is_in_viewport(item.x, item.y, vp_x, vp_y, vp_w, vp_h):
                continue

            # Only render items in visible tiles
            if not dungeon.visible[item.y][item.x]:
                continue

            screen_x, screen_y = self._world_to_screen(item.x, item.y, vp_x, vp_y)

            try:
                if curses.has_colors():
                    # Use rarity color if available, default to cyan (5)
                    if item.rarity:
                        color_pair = ITEM_RARITY_COLORS[item.rarity]
                    else:
                        color_pair = 5  # Default to cyan
                    self.stdscr.addstr(screen_y, screen_x, item.symbol, curses.color_pair(color_pair))
                else:
                    self.stdscr.addstr(screen_y, screen_x, item.symbol)
            except curses.error:
                pass

    def _render_enemies(self, enemies: List[Enemy], dungeon: Dungeon, vp_x: int, vp_y: int, vp_w: int, vp_h: int):
        """Render all living enemies (only if visible)."""
        for enemy in enemies:
            if not enemy.is_alive():
                continue

            # Check if in viewport
            if not self._is_in_viewport(enemy.x, enemy.y, vp_x, vp_y, vp_w, vp_h):
                continue

            # Only render enemies in visible tiles
            if not dungeon.visible[enemy.y][enemy.x]:
                continue

            screen_x, screen_y = self._world_to_screen(enemy.x, enemy.y, vp_x, vp_y)

            try:
                # Check if enemy has active hit animation
                is_animated = any(anim['entity'] == enemy for anim in self.animations)

                if curses.has_colors():
                    # Bosses render in bright magenta with bold
                    # Elites render in magenta, regular enemies in red
                    if enemy.is_boss:
                        color = curses.color_pair(6) | curses.A_BOLD
                    elif enemy.is_elite:
                        color = curses.color_pair(6)
                    else:
                        color = curses.color_pair(3)

                    # Apply hit animation: flash with reverse video and bold
                    if is_animated:
                        color = color | curses.A_REVERSE | curses.A_BOLD

                    self.stdscr.addstr(screen_y, screen_x, enemy.symbol, color)
                else:
                    # No color: use '!' for boss, '*' for elite, symbol for regular
                    if enemy.is_boss:
                        symbol = '!'
                    elif enemy.is_elite:
                        symbol = '*'
                    else:
                        symbol = enemy.symbol
                    # Flash with reverse video
                    attr = curses.A_REVERSE if is_animated else curses.A_NORMAL
                    self.stdscr.addstr(screen_y, screen_x, symbol, attr)
            except curses.error:
                pass

    def _render_player(self, player: Player, vp_x: int, vp_y: int, vp_w: int, vp_h: int):
        """Render the player."""
        # Check if in viewport (player should always be, but check anyway)
        if not self._is_in_viewport(player.x, player.y, vp_x, vp_y, vp_w, vp_h):
            return

        screen_x, screen_y = self._world_to_screen(player.x, player.y, vp_x, vp_y)

        try:
            # Check if player has active hit animation
            is_animated = any(anim['entity'] == player for anim in self.animations)

            if curses.has_colors():
                color = curses.color_pair(2)  # Yellow for player

                # Apply hit animation: flash with reverse video and bold
                if is_animated:
                    color = color | curses.A_REVERSE | curses.A_BOLD

                self.stdscr.addstr(screen_y, screen_x, player.symbol, color)
            else:
                # Flash with reverse video
                attr = curses.A_REVERSE if is_animated else curses.A_NORMAL
                self.stdscr.addstr(screen_y, screen_x, player.symbol, attr)
        except curses.error:
            pass

    def _render_damage_numbers(self, dungeon: Dungeon, vp_x: int, vp_y: int, vp_w: int, vp_h: int):
        """Render floating damage numbers above entities."""
        for dmg_num in self.damage_numbers:
            world_x, world_y = dmg_num['x'], dmg_num['y']

            # Only render if position is visible and in bounds
            if not (0 <= world_y < dungeon.height and 0 <= world_x < dungeon.width):
                continue
            if not dungeon.visible[world_y][world_x]:
                continue

            # Check if in viewport
            if not self._is_in_viewport(world_x, world_y, vp_x, vp_y, vp_w, vp_h):
                continue

            screen_x, screen_y = self._world_to_screen(world_x, world_y, vp_x, vp_y)

            try:
                text = dmg_num['text']
                # Render damage numbers in red
                if curses.has_colors():
                    self.stdscr.addstr(screen_y, screen_x, text, curses.color_pair(3) | curses.A_BOLD)
                else:
                    self.stdscr.addstr(screen_y, screen_x, text, curses.A_BOLD)
            except curses.error:
                pass

    def _render_direction_indicators(self, dungeon: Dungeon, vp_x: int, vp_y: int, vp_w: int, vp_h: int):
        """Render attack direction arrows."""
        for indicator in self.direction_indicators:
            world_x, world_y = indicator['x'], indicator['y']

            # Only render if position is visible and in bounds
            if not (0 <= world_y < dungeon.height and 0 <= world_x < dungeon.width):
                continue
            if not dungeon.visible[world_y][world_x]:
                continue

            # Check if in viewport
            if not self._is_in_viewport(world_x, world_y, vp_x, vp_y, vp_w, vp_h):
                continue

            screen_x, screen_y = self._world_to_screen(world_x, world_y, vp_x, vp_y)

            try:
                char = indicator['char']
                # Render arrow in yellow (bright) - use addstr for Unicode compatibility
                if curses.has_colors():
                    self.stdscr.addstr(screen_y, screen_x, char, curses.color_pair(2) | curses.A_BOLD)
                else:
                    self.stdscr.addstr(screen_y, screen_x, char, curses.A_BOLD)
            except curses.error:
                pass

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

    def _render_bar(self, current: int, max_val: int, width: int) -> str:
        """
        Generate a visual bar representation.

        Args:
            current: Current value
            max_val: Maximum value
            width: Width of the bar in characters

        Returns:
            String representation of the bar using filled/empty characters
        """
        if max_val <= 0:
            return '░' * width

        filled = int((current / max_val) * width)
        filled = max(0, min(width, filled))

        # Use block characters for visual bars
        if curses.has_colors():
            return '█' * filled + '░' * (width - filled)
        else:
            # ASCII fallback for no-color terminals
            return '#' * filled + '-' * (width - filled)

    def _draw_horizontal_border(self, y: int, x: int, width: int, left_char: str, right_char: str, fill_char: str):
        """Draw a horizontal border line."""
        try:
            # Use addstr instead of addch for Unicode compatibility on Windows
            self.stdscr.addstr(y, x, left_char)
            for i in range(1, width - 1):
                self.stdscr.addstr(y, x + i, fill_char)
            self.stdscr.addstr(y, x + width - 1, right_char)
        except curses.error:
            pass

    def _draw_vertical_border(self, y: int, x: int, char: str):
        """Draw a single vertical border character."""
        try:
            # Use addstr instead of addch for Unicode compatibility on Windows
            self.stdscr.addstr(y, x, char)
        except curses.error:
            pass

    def _render_minimap(self, y_start: int, x_start: int, dungeon: Dungeon, player: Player,
                        enemies: List[Enemy], items: List[Item], max_y: int):
        """
        Render a small minimap showing the dungeon layout.

        Args:
            y_start: Starting Y position for minimap
            x_start: Starting X position for minimap
            dungeon: The dungeon to map
            player: Player entity
            enemies: List of enemies
            items: List of items
            max_y: Maximum Y coordinate
        """
        try:
            minimap_size = 5

            # Draw minimap border
            minimap_border = "┌─────┐"
            if y_start < max_y:
                self.stdscr.addstr(y_start, x_start, minimap_border)

            # Render minimap content (scaled down dungeon)
            for my in range(minimap_size):
                if y_start + my + 1 >= max_y:
                    break

                # Draw left border
                self.stdscr.addstr(y_start + my + 1, x_start, "│")

                # Render minimap cells
                for mx in range(minimap_size):
                    # Scale minimap coordinates to dungeon coordinates
                    # Check a region of the dungeon for this minimap cell
                    region_x_start = int((mx / minimap_size) * dungeon.width)
                    region_x_end = int(((mx + 1) / minimap_size) * dungeon.width)
                    region_y_start = int((my / minimap_size) * dungeon.height)
                    region_y_end = int(((my + 1) / minimap_size) * dungeon.height)

                    # Check if any part of this region has been explored
                    explored_count = 0
                    total_tiles = 0
                    for dy in range(region_y_start, min(region_y_end, dungeon.height)):
                        for dx in range(region_x_start, min(region_x_end, dungeon.width)):
                            total_tiles += 1
                            if dungeon.explored[dy][dx]:
                                explored_count += 1

                    # Determine what to show in this cell
                    cell_char = ' '  # Unexplored = blank

                    # Check if player is in this cell
                    player_cell_x = int((player.x / dungeon.width) * minimap_size)
                    player_cell_y = int((player.y / dungeon.height) * minimap_size)

                    if mx == player_cell_x and my == player_cell_y:
                        cell_char = '@'
                    elif explored_count > 0:
                        # Show explored areas as filled blocks
                        # Density of exploration determines the character
                        explore_ratio = explored_count / total_tiles if total_tiles > 0 else 0
                        if explore_ratio > 0.7:
                            cell_char = '█'  # Heavily explored
                        elif explore_ratio > 0.3:
                            cell_char = '▓'  # Partially explored
                        else:
                            cell_char = '░'  # Lightly explored

                    self.stdscr.addstr(y_start + my + 1, x_start + 1 + mx, cell_char)

                # Draw right border
                self.stdscr.addstr(y_start + my + 1, x_start + minimap_size + 1, "│")

            # Draw bottom border
            if y_start + minimap_size + 1 < max_y:
                self.stdscr.addstr(y_start + minimap_size + 1, x_start, "└─────┘")

            # Display stats next to minimap
            living_enemies = sum(1 for e in enemies if e.is_alive())
            if y_start + 1 < max_y:
                stats_x = x_start + 8
                self.stdscr.addstr(y_start + 1, stats_x, f"Rooms: {len(dungeon.rooms)}")
            if y_start + 2 < max_y:
                self.stdscr.addstr(y_start + 2, stats_x, f"Enemies: {living_enemies}")
            if y_start + 3 < max_y:
                self.stdscr.addstr(y_start + 3, stats_x, f"Items: {len(items)}")

        except curses.error:
            # Ignore errors from terminal being too small
            pass

    def _get_status_indicators(self, player: Player) -> List[Tuple[str, int]]:
        """
        Get status indicators for the player based on their current state.

        Returns:
            List of (status_text, color_pair) tuples
        """
        import time
        from ..core.constants import PLAYER_ATTACK_DAMAGE, ATK_GAIN_PER_LEVEL, StatusEffectType

        indicators = []

        # Health-based status
        health_pct = player.health / player.max_health if player.max_health > 0 else 0

        if health_pct <= 0.25:
            # Critical: flashing red
            if curses.has_colors():
                # Flash on/off every 0.5 seconds
                if int(time.time() * 2) % 2 == 0:
                    indicators.append(("[CRITICAL]", curses.color_pair(3) | curses.A_BOLD | curses.A_REVERSE))
                else:
                    indicators.append(("[CRITICAL]", curses.color_pair(3) | curses.A_BOLD))
            else:
                indicators.append(("[CRITICAL]", curses.A_BOLD))
        elif health_pct <= 0.5:
            # Wounded: yellow
            if curses.has_colors():
                indicators.append(("[WOUNDED]", curses.color_pair(2)))
            else:
                indicators.append(("[WOUNDED]", curses.A_NORMAL))

        # Attack boost status (from strength potions)
        # Expected attack = base + (level - 1) * gain_per_level
        expected_attack = PLAYER_ATTACK_DAMAGE + (player.level - 1) * ATK_GAIN_PER_LEVEL
        if player.attack_damage > expected_attack:
            # Player has used strength potions
            if curses.has_colors():
                indicators.append(("[STRONG]", curses.color_pair(4) | curses.A_BOLD))
            else:
                indicators.append(("[STRONG]", curses.A_BOLD))

        # v4.0: Status effects
        if hasattr(player, 'status_effects') and player.status_effects:
            for effect in player.status_effects.effects:
                if effect.effect_type == StatusEffectType.POISON:
                    if curses.has_colors():
                        indicators.append(("[POISON]", curses.color_pair(4)))  # Green
                    else:
                        indicators.append(("[POISON]", curses.A_NORMAL))
                elif effect.effect_type == StatusEffectType.BURN:
                    if curses.has_colors():
                        indicators.append(("[BURN]", curses.color_pair(3)))  # Red
                    else:
                        indicators.append(("[BURN]", curses.A_NORMAL))
                elif effect.effect_type == StatusEffectType.FREEZE:
                    if curses.has_colors():
                        indicators.append(("[FREEZE]", curses.color_pair(5)))  # Cyan
                    else:
                        indicators.append(("[FREEZE]", curses.A_NORMAL))
                elif effect.effect_type == StatusEffectType.STUN:
                    if curses.has_colors():
                        indicators.append(("[STUN]", curses.color_pair(2)))  # Yellow
                    else:
                        indicators.append(("[STUN]", curses.A_NORMAL))

        return indicators

    def _get_message_color(self, message: str) -> int:
        """
        Determine the color pair and attributes for a message based on its content.

        Returns:
            Color pair with optional BOLD attribute
        """
        if not curses.has_colors():
            return curses.A_NORMAL

        msg_lower = message.lower()

        # Boss defeat messages (bright magenta + bold)
        if "defeated" in msg_lower and ("***" in message or "boss" in msg_lower):
            return curses.color_pair(6) | curses.A_BOLD

        # Boss ability messages (magenta)
        if any(word in msg_lower for word in ["summons", "slams", "breathes", "drains", "fires", "sweeps", "war cry", "regenerates", "raises", "teleports"]):
            return curses.color_pair(6)

        # Combat kill messages (bright red + bold)
        if "killed" in msg_lower:
            return curses.color_pair(8) | curses.A_BOLD

        # Level up messages (bright yellow + bold)
        if "level up" in msg_lower or "level:" in msg_lower and "player" not in msg_lower:
            return curses.color_pair(9) | curses.A_BOLD

        # Healing messages (bright green)
        if "healed" in msg_lower or "restored" in msg_lower:
            return curses.color_pair(10) | curses.A_BOLD

        # Combat damage messages (red)
        if "hit" in msg_lower or "damage" in msg_lower:
            return curses.color_pair(3)

        # Item pickup messages (cyan)
        if "picked up" in msg_lower or "dropped" in msg_lower:
            return curses.color_pair(5)

        # Boss presence messages (magenta)
        if "powerful presence" in msg_lower or "awaits" in msg_lower:
            return curses.color_pair(6)

        # Default (white)
        return curses.color_pair(1)

    def _render_ui_panel(self, player: Player, dungeon: Dungeon, enemies: List[Enemy],
                         items: List[Item]):
        """Render the UI panel on the right side (stats, minimap, inventory, controls)."""
        max_y, max_x = self.stdscr.getmaxyx()
        panel_x = max_x - STATS_PANEL_WIDTH

        if panel_x < 0:
            return  # Not enough space for panel

        # Choose border characters based on terminal capability
        use_unicode = self.use_unicode
        h_char = BOX_H if use_unicode else BOX_H_ASCII
        v_char = BOX_V if use_unicode else BOX_V_ASCII
        tl = BOX_TL if use_unicode else BOX_TL_ASCII
        tr = BOX_TR if use_unicode else BOX_TR_ASCII
        left_t = BOX_LEFT if use_unicode else BOX_LEFT_ASCII
        right_t = BOX_RIGHT if use_unicode else BOX_RIGHT_ASCII

        try:
            # Top border
            self._draw_horizontal_border(0, panel_x, STATS_PANEL_WIDTH, tl, tr, h_char)

            # Calculate where message area starts (don't draw panel borders there)
            msg_area_start = max_y - MESSAGE_AREA_HEIGHT - 1

            # Draw vertical borders only in panel region (stop before message area)
            for y in range(1, msg_area_start):
                self._draw_vertical_border(y, panel_x, v_char)
                self._draw_vertical_border(y, panel_x + STATS_PANEL_WIDTH - 1, v_char)

            # Calculate max content width (panel width minus borders and padding)
            content_width = STATS_PANEL_WIDTH - 4  # 2 for borders, 2 for padding

            # Title
            self.stdscr.addstr(1, panel_x + 2, "  DUNGEON"[:content_width])
            self.stdscr.addstr(2, panel_x + 2, f" Level: {dungeon.level}"[:content_width])

            # Section divider after title
            self._draw_horizontal_border(3, panel_x, STATS_PANEL_WIDTH, left_t, right_t, h_char)

            # Player stats
            self.stdscr.addstr(4, panel_x + 2, f"PLAYER (Lv {player.level})"[:content_width])

            # Health bar with dynamic coloring
            health_bar = self._render_bar(player.health, player.max_health, BAR_WIDTH)
            health_pct = player.health / player.max_health if player.max_health > 0 else 0

            # Choose color based on health percentage
            if curses.has_colors():
                if health_pct > 0.5:
                    health_color = curses.color_pair(4)  # Green - healthy
                elif health_pct > 0.25:
                    health_color = curses.color_pair(2)  # Yellow - wounded
                else:
                    health_color = curses.color_pair(3)  # Red - critical
            else:
                health_color = curses.A_NORMAL

            health_str = f"HP:{health_bar} {player.health}/{player.max_health}"[:content_width]
            self.stdscr.addstr(5, panel_x + 2, health_str, health_color)

            self.stdscr.addstr(6, panel_x + 2, f"ATK: {player.attack_damage}  DEF: {player.defense}"[:content_width])
            self.stdscr.addstr(7, panel_x + 2, f"Kills: {player.kills}"[:content_width])

            # XP bar
            xp_in_level = player.xp - (player.xp_to_next_level - player.level * 30)
            xp_needed = player.level * 30
            xp_bar = self._render_bar(xp_in_level, xp_needed, BAR_WIDTH)
            xp_str = f"XP:{xp_bar} {xp_in_level}/{xp_needed}"[:content_width]
            if curses.has_colors():
                self.stdscr.addstr(8, panel_x + 2, xp_str, curses.color_pair(5))  # Cyan for XP
            else:
                self.stdscr.addstr(8, panel_x + 2, xp_str)

            # Status indicators
            status_indicators = self._get_status_indicators(player)
            if status_indicators:
                status_str = " ".join([indicator[0] for indicator in status_indicators])
                # Render each indicator with its own color
                x_offset = panel_x + 2
                for indicator_text, indicator_color in status_indicators:
                    self.stdscr.addstr(9, x_offset, indicator_text, indicator_color)
                    x_offset += len(indicator_text) + 1  # +1 for space

            # Position (for debugging/exploration feel)
            self.stdscr.addstr(10, panel_x + 2, f"Pos: ({player.x},{player.y})"[:content_width])

            # Boss health bar (if boss is alive on this level)
            boss = next((e for e in enemies if e.is_boss and e.is_alive()), None)
            if boss:
                # Section divider before boss
                self._draw_horizontal_border(11, panel_x, STATS_PANEL_WIDTH, left_t, right_t, h_char)

                # Boss name (truncated if needed)
                boss_name = self._smart_truncate(boss.name, content_width)
                if curses.has_colors():
                    self.stdscr.addstr(12, panel_x + 2, boss_name, curses.color_pair(6) | curses.A_BOLD)
                else:
                    self.stdscr.addstr(12, panel_x + 2, boss_name, curses.A_BOLD)

                # Boss health bar
                boss_health_bar = self._render_bar(boss.health, boss.max_health, BAR_WIDTH)
                boss_health_str = f"HP:{boss_health_bar} {boss.health}/{boss.max_health}"[:content_width]
                if curses.has_colors():
                    self.stdscr.addstr(13, panel_x + 2, boss_health_str, curses.color_pair(3))  # Red for boss HP
                else:
                    self.stdscr.addstr(13, panel_x + 2, boss_health_str)

                # Section divider before minimap (shifted down)
                self._draw_horizontal_border(14, panel_x, STATS_PANEL_WIDTH, left_t, right_t, h_char)

                # Minimap position shifts down when boss is shown
                self._render_minimap(15, panel_x + 2, dungeon, player, enemies, items, max_y)

                # Section divider before inventory (shifted down)
                self._draw_horizontal_border(22, panel_x, STATS_PANEL_WIDTH, left_t, right_t, h_char)

                # Inventory (shifted down)
                inv_header = f"INVENTORY ({len(player.inventory.items)}/10)"[:content_width]
                self.stdscr.addstr(23, panel_x + 2, inv_header)
                for i, item in enumerate(player.inventory.items[:3]):  # Show first 3 items
                    item_y = 24 + i
                    if item_y < max_y:
                        max_item_name_len = content_width - 3
                        truncated_name = self._smart_truncate(item.name, max_item_name_len)
                        item_str = f"{i+1}. {truncated_name}"[:content_width]
                        self.stdscr.addstr(item_y, panel_x + 2, item_str)

                # Section divider before controls (shifted down)
                self._draw_horizontal_border(27, panel_x, STATS_PANEL_WIDTH, left_t, right_t, h_char)

                # Controls (shifted down)
                self.stdscr.addstr(28, panel_x + 2, "CONTROLS"[:content_width])
                self.stdscr.addstr(29, panel_x + 2, "WASD/Arrows: Move"[:content_width])
                self.stdscr.addstr(30, panel_x + 2, "1-3: Use item"[:content_width])
                self.stdscr.addstr(31, panel_x + 2, "Q: Quit"[:content_width])
                return  # Exit early, already rendered with boss bar

            # Section divider before minimap
            self._draw_horizontal_border(11, panel_x, STATS_PANEL_WIDTH, left_t, right_t, h_char)

            # Minimap
            self._render_minimap(12, panel_x + 2, dungeon, player, enemies, items, max_y)

            # Section divider before inventory
            self._draw_horizontal_border(19, panel_x, STATS_PANEL_WIDTH, left_t, right_t, h_char)

            # Inventory
            inv_header = f"INVENTORY ({len(player.inventory.items)}/10)"[:content_width]
            self.stdscr.addstr(20, panel_x + 2, inv_header)
            for i, item in enumerate(player.inventory.items[:3]):  # Show first 3 items
                item_y = 21 + i
                if item_y < max_y:
                    # Smart truncate item name to fit panel (reserve 3 chars for "N. ")
                    max_item_name_len = content_width - 3  # -3 for "N. "
                    truncated_name = self._smart_truncate(item.name, max_item_name_len)
                    item_str = f"{i+1}. {truncated_name}"[:content_width]
                    self.stdscr.addstr(item_y, panel_x + 2, item_str)

            # Section divider before controls
            self._draw_horizontal_border(24, panel_x, STATS_PANEL_WIDTH, left_t, right_t, h_char)

            # Controls
            self.stdscr.addstr(25, panel_x + 2, "CONTROLS"[:content_width])
            self.stdscr.addstr(26, panel_x + 2, "WASD/Arrows: Move"[:content_width])
            self.stdscr.addstr(27, panel_x + 2, "1-3: Use item"[:content_width])
            self.stdscr.addstr(28, panel_x + 2, "Q: Quit"[:content_width])

        except curses.error:
            # Ignore errors from terminal being too small
            pass

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
