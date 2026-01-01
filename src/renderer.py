"""Terminal rendering using curses."""
import curses
import time
from typing import List, Tuple, Dict, Any

from .constants import (
    STATS_PANEL_WIDTH, MESSAGE_LOG_SIZE, BAR_WIDTH,
    BOX_TL, BOX_TR, BOX_BL, BOX_BR, BOX_H, BOX_V, BOX_LEFT, BOX_RIGHT,
    BOX_TL_ASCII, BOX_TR_ASCII, BOX_BL_ASCII, BOX_BR_ASCII,
    BOX_H_ASCII, BOX_V_ASCII, BOX_LEFT_ASCII, BOX_RIGHT_ASCII
)
from .dungeon import Dungeon
from .entities import Player, Enemy
from .items import Item


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

        # Initialize color pairs if available
        if curses.has_colors():
            curses.init_pair(1, curses.COLOR_WHITE, curses.COLOR_BLACK)  # Default
            curses.init_pair(2, curses.COLOR_YELLOW, curses.COLOR_BLACK)  # Player
            curses.init_pair(3, curses.COLOR_RED, curses.COLOR_BLACK)     # Enemy
            curses.init_pair(4, curses.COLOR_GREEN, curses.COLOR_BLACK)   # Health
            curses.init_pair(5, curses.COLOR_CYAN, curses.COLOR_BLACK)    # Items
            curses.init_pair(6, curses.COLOR_MAGENTA, curses.COLOR_BLACK) # Elite Enemy
            curses.init_pair(7, 8, curses.COLOR_BLACK)                    # Dim (dark gray)
            # Bright colors for messages (will use BOLD attribute for brightness)
            curses.init_pair(8, curses.COLOR_RED, curses.COLOR_BLACK)     # Bright red (combat kill)
            curses.init_pair(9, curses.COLOR_YELLOW, curses.COLOR_BLACK)  # Bright yellow (level up)
            curses.init_pair(10, curses.COLOR_GREEN, curses.COLOR_BLACK)  # Bright green (healing)

    def render(self, dungeon: Dungeon, player: Player, enemies: List[Enemy], items: List[Item], messages: List[str]):
        """Render the entire game state."""
        # Clean up expired animations
        self._cleanup_animations()

        self.stdscr.clear()

        # Render dungeon
        self._render_dungeon(dungeon)

        # Render terrain features (water, blood, grass)
        self._render_terrain(dungeon)

        # Render decorations (after dungeon, before entities)
        self._render_decorations(dungeon)

        # Render items (before enemies and player) - only visible
        self._render_items(items, dungeon)

        # Render enemies - only visible
        self._render_enemies(enemies, dungeon)

        # Render player (always on top)
        self._render_player(player)

        # Render damage numbers (above entities)
        self._render_damage_numbers(dungeon)

        # Render attack direction indicators
        self._render_direction_indicators(dungeon)

        # Render UI panel
        self._render_ui_panel(player, dungeon, enemies, items, messages)

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

    def _render_dungeon(self, dungeon: Dungeon):
        """Render the dungeon tiles."""
        max_y, max_x = self.stdscr.getmaxyx()
        use_unicode = curses.has_colors()  # Proxy for Unicode support

        for y in range(min(dungeon.height, max_y)):
            for x in range(min(dungeon.width, max_x - STATS_PANEL_WIDTH)):
                try:
                    # Only render explored tiles
                    if not dungeon.explored[y][x]:
                        continue  # Unexplored tiles are not rendered (remain black)

                    # Get themed visual character
                    visual_char = dungeon.get_visual_char(x, y, use_unicode)

                    # Visible tiles render normally, explored-but-not-visible render dim
                    if dungeon.visible[y][x]:
                        self.stdscr.addch(y, x, visual_char)
                    else:
                        # Dim rendering for explored but not visible
                        if curses.has_colors():
                            self.stdscr.addch(y, x, visual_char, curses.color_pair(7))
                        else:
                            self.stdscr.addch(y, x, visual_char)
                except curses.error:
                    # Ignore errors from trying to write to bottom-right corner
                    pass

    def _render_terrain(self, dungeon: Dungeon):
        """Render terrain features (water, blood, grass) in explored/visible tiles."""
        max_y, max_x = self.stdscr.getmaxyx()

        for x, y, char, color_pair in dungeon.terrain_features:
            # Only render terrain in explored tiles
            if not (0 <= y < dungeon.height and 0 <= x < dungeon.width):
                continue

            if not dungeon.explored[y][x]:
                continue

            # Only render if within screen bounds
            if not (0 <= y < max_y and 0 <= x < max_x - STATS_PANEL_WIDTH):
                continue

            try:
                # Render dim if not visible
                if dungeon.visible[y][x]:
                    if curses.has_colors():
                        self.stdscr.addch(y, x, char, curses.color_pair(color_pair))
                    else:
                        self.stdscr.addch(y, x, char)
                else:
                    # Dim rendering for explored but not visible
                    if curses.has_colors():
                        self.stdscr.addch(y, x, char, curses.color_pair(7))
                    else:
                        self.stdscr.addch(y, x, char)
            except curses.error:
                pass

    def _render_decorations(self, dungeon: Dungeon):
        """Render decorations in explored/visible tiles."""
        max_y, max_x = self.stdscr.getmaxyx()

        for x, y, char, color_pair in dungeon.decorations:
            # Only render decorations in explored and visible tiles
            if not (0 <= y < dungeon.height and 0 <= x < dungeon.width):
                continue

            if not dungeon.explored[y][x]:
                continue

            # Only render if within screen bounds
            if not (0 <= y < max_y and 0 <= x < max_x - STATS_PANEL_WIDTH):
                continue

            try:
                # Render dim if not visible
                if dungeon.visible[y][x]:
                    if curses.has_colors():
                        self.stdscr.addch(y, x, char, curses.color_pair(color_pair))
                    else:
                        self.stdscr.addch(y, x, char)
                else:
                    # Dim rendering for explored but not visible
                    if curses.has_colors():
                        self.stdscr.addch(y, x, char, curses.color_pair(7))
                    else:
                        self.stdscr.addch(y, x, char)
            except curses.error:
                pass

    def _render_items(self, items: List[Item], dungeon: Dungeon):
        """Render all items on the ground (only if visible)."""
        max_y, max_x = self.stdscr.getmaxyx()

        for item in items:
            if 0 <= item.y < max_y and 0 <= item.x < max_x - STATS_PANEL_WIDTH:
                # Only render items in visible tiles
                if not dungeon.visible[item.y][item.x]:
                    continue

                try:
                    if curses.has_colors():
                        self.stdscr.addch(item.y, item.x, item.symbol, curses.color_pair(5))
                    else:
                        self.stdscr.addch(item.y, item.x, item.symbol)
                except curses.error:
                    pass

    def _render_enemies(self, enemies: List[Enemy], dungeon: Dungeon):
        """Render all living enemies (only if visible)."""
        max_y, max_x = self.stdscr.getmaxyx()

        for enemy in enemies:
            if enemy.is_alive() and 0 <= enemy.y < max_y and 0 <= enemy.x < max_x - STATS_PANEL_WIDTH:
                # Only render enemies in visible tiles
                if not dungeon.visible[enemy.y][enemy.x]:
                    continue
                try:
                    # Check if enemy has active hit animation
                    is_animated = any(anim['entity'] == enemy for anim in self.animations)

                    if curses.has_colors():
                        # Elites render in magenta, regular enemies in red
                        color = curses.color_pair(6) if enemy.is_elite else curses.color_pair(3)

                        # Apply hit animation: flash with reverse video and bold
                        if is_animated:
                            color = color | curses.A_REVERSE | curses.A_BOLD

                        self.stdscr.addch(enemy.y, enemy.x, enemy.symbol, color)
                    else:
                        # No color: use '*' for elite, 'E' for regular
                        symbol = '*' if enemy.is_elite else enemy.symbol
                        # Flash with reverse video
                        attr = curses.A_REVERSE if is_animated else curses.A_NORMAL
                        self.stdscr.addch(enemy.y, enemy.x, symbol, attr)
                except curses.error:
                    pass

    def _render_player(self, player: Player):
        """Render the player."""
        max_y, max_x = self.stdscr.getmaxyx()

        if 0 <= player.y < max_y and 0 <= player.x < max_x - STATS_PANEL_WIDTH:
            try:
                # Check if player has active hit animation
                is_animated = any(anim['entity'] == player for anim in self.animations)

                if curses.has_colors():
                    color = curses.color_pair(2)  # Yellow for player

                    # Apply hit animation: flash with reverse video and bold
                    if is_animated:
                        color = color | curses.A_REVERSE | curses.A_BOLD

                    self.stdscr.addch(player.y, player.x, player.symbol, color)
                else:
                    # Flash with reverse video
                    attr = curses.A_REVERSE if is_animated else curses.A_NORMAL
                    self.stdscr.addch(player.y, player.x, player.symbol, attr)
            except curses.error:
                pass

    def _render_damage_numbers(self, dungeon: Dungeon):
        """Render floating damage numbers above entities."""
        max_y, max_x = self.stdscr.getmaxyx()

        for dmg_num in self.damage_numbers:
            x, y = dmg_num['x'], dmg_num['y']

            # Only render if position is visible and in bounds
            if 0 <= y < dungeon.height and 0 <= x < dungeon.width:
                if not dungeon.visible[y][x]:
                    continue

                if 0 <= y < max_y and 0 <= x < max_x - STATS_PANEL_WIDTH:
                    try:
                        text = dmg_num['text']
                        # Render damage numbers in red
                        if curses.has_colors():
                            self.stdscr.addstr(y, x, text, curses.color_pair(3) | curses.A_BOLD)
                        else:
                            self.stdscr.addstr(y, x, text, curses.A_BOLD)
                    except curses.error:
                        pass

    def _render_direction_indicators(self, dungeon: Dungeon):
        """Render attack direction arrows."""
        max_y, max_x = self.stdscr.getmaxyx()

        for indicator in self.direction_indicators:
            x, y = indicator['x'], indicator['y']

            # Only render if position is visible and in bounds
            if 0 <= y < dungeon.height and 0 <= x < dungeon.width:
                if not dungeon.visible[y][x]:
                    continue

                if 0 <= y < max_y and 0 <= x < max_x - STATS_PANEL_WIDTH:
                    try:
                        char = indicator['char']
                        # Render arrow in yellow (bright)
                        if curses.has_colors():
                            self.stdscr.addch(y, x, char, curses.color_pair(2) | curses.A_BOLD)
                        else:
                            self.stdscr.addch(y, x, char, curses.A_BOLD)
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
            self.stdscr.addch(y, x, left_char)
            for i in range(1, width - 1):
                self.stdscr.addch(y, x + i, fill_char)
            self.stdscr.addch(y, x + width - 1, right_char)
        except curses.error:
            pass

    def _draw_vertical_border(self, y: int, x: int, char: str):
        """Draw a single vertical border character."""
        try:
            self.stdscr.addch(y, x, char)
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
                    dungeon_x = int((mx / minimap_size) * dungeon.width)
                    dungeon_y = int((my / minimap_size) * dungeon.height)

                    # Determine what to show in this cell
                    cell_char = ' '

                    # Check if player is in this cell
                    player_cell_x = int((player.x / dungeon.width) * minimap_size)
                    player_cell_y = int((player.y / dungeon.height) * minimap_size)

                    if mx == player_cell_x and my == player_cell_y:
                        cell_char = '@'
                    else:
                        # Check for enemies in this cell
                        enemy_found = False
                        for enemy in enemies:
                            if not enemy.is_alive():
                                continue
                            enemy_cell_x = int((enemy.x / dungeon.width) * minimap_size)
                            enemy_cell_y = int((enemy.y / dungeon.height) * minimap_size)
                            if mx == enemy_cell_x and my == enemy_cell_y:
                                cell_char = 'E'
                                enemy_found = True
                                break

                        # Check if this is a room or wall
                        if not enemy_found:
                            if dungeon.is_walkable(dungeon_x, dungeon_y):
                                cell_char = '·'  # Floor
                            else:
                                cell_char = '█'  # Wall

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
        from .constants import PLAYER_ATTACK_DAMAGE, ATK_GAIN_PER_LEVEL

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
        if "picked up" in msg_lower:
            return curses.color_pair(5)

        # Default (white)
        return curses.color_pair(1)

    def _render_ui_panel(self, player: Player, dungeon: Dungeon, enemies: List[Enemy],
                         items: List[Item], messages: List[str]):
        """Render the UI panel on the right side."""
        max_y, max_x = self.stdscr.getmaxyx()
        panel_x = max_x - STATS_PANEL_WIDTH

        if panel_x < 0:
            return  # Not enough space for panel

        # Choose border characters based on terminal capability
        use_unicode = curses.has_colors()  # Proxy for Unicode support
        h_char = BOX_H if use_unicode else BOX_H_ASCII
        v_char = BOX_V if use_unicode else BOX_V_ASCII
        tl = BOX_TL if use_unicode else BOX_TL_ASCII
        tr = BOX_TR if use_unicode else BOX_TR_ASCII
        left_t = BOX_LEFT if use_unicode else BOX_LEFT_ASCII
        right_t = BOX_RIGHT if use_unicode else BOX_RIGHT_ASCII

        try:
            # Top border
            self._draw_horizontal_border(0, panel_x, STATS_PANEL_WIDTH, tl, tr, h_char)

            # Draw vertical borders for all rows
            for y in range(1, min(max_y, max_y - 1)):
                self._draw_vertical_border(y, panel_x, v_char)
                self._draw_vertical_border(y, panel_x + STATS_PANEL_WIDTH - 1, v_char)

            # Title
            self.stdscr.addstr(1, panel_x + 2, "  DUNGEON")
            self.stdscr.addstr(2, panel_x + 2, f" Level: {dungeon.level}")

            # Section divider after title
            self._draw_horizontal_border(3, panel_x, STATS_PANEL_WIDTH, left_t, right_t, h_char)

            # Player stats
            self.stdscr.addstr(4, panel_x + 2, f"PLAYER (Level {player.level})")

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

            health_str = f"HP: {health_bar} {player.health}/{player.max_health}"
            self.stdscr.addstr(5, panel_x + 2, health_str, health_color)

            self.stdscr.addstr(6, panel_x + 2, f"ATK: {player.attack_damage}")
            self.stdscr.addstr(7, panel_x + 2, f"Kills: {player.kills}")

            # XP bar
            xp_in_level = player.xp - (player.xp_to_next_level - player.level * 30)
            xp_needed = player.level * 30
            xp_bar = self._render_bar(xp_in_level, xp_needed, BAR_WIDTH)
            xp_str = f"XP: {xp_bar} {xp_in_level}/{xp_needed}"
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
            self.stdscr.addstr(10, panel_x + 2, f"Pos: ({player.x},{player.y})")

            # Section divider before minimap
            self._draw_horizontal_border(11, panel_x, STATS_PANEL_WIDTH, left_t, right_t, h_char)

            # Minimap
            self._render_minimap(12, panel_x + 2, dungeon, player, enemies, items, max_y)

            # Section divider before inventory
            self._draw_horizontal_border(19, panel_x, STATS_PANEL_WIDTH, left_t, right_t, h_char)

            # Inventory
            self.stdscr.addstr(20, panel_x + 2, f"INVENTORY ({len(player.inventory.items)}/10)")
            for i, item in enumerate(player.inventory.items[:3]):  # Show first 3 items
                item_y = 21 + i
                if item_y < max_y:
                    item_str = f"{i+1}. {item.name[:15]}"
                    self.stdscr.addstr(item_y, panel_x + 2, item_str)

            # Section divider before messages
            self._draw_horizontal_border(24, panel_x, STATS_PANEL_WIDTH, left_t, right_t, h_char)

            # Message log
            self.stdscr.addstr(25, panel_x + 2, "MESSAGES")
            for i, message in enumerate(messages[-MESSAGE_LOG_SIZE:]):
                msg_y = 26 + i
                if msg_y < max_y:
                    # Truncate message if too long
                    display_msg = message[:STATS_PANEL_WIDTH - 4]
                    # Apply color coding based on message content
                    color = self._get_message_color(message)
                    self.stdscr.addstr(msg_y, panel_x + 2, display_msg, color)

            # Controls
            controls_y = max_y - 9
            if controls_y > 27:
                self.stdscr.addstr(controls_y, panel_x + 2, "CONTROLS")
                self.stdscr.addstr(controls_y + 1, panel_x + 2, "Arrow/WASD: Move")
                self.stdscr.addstr(controls_y + 2, panel_x + 2, "1-3: Use item")
                self.stdscr.addstr(controls_y + 3, panel_x + 2, "Q: Quit")

        except curses.error:
            # Ignore errors from terminal being too small
            pass

    def render_game_over(self, player: Player):
        """Render the game over screen."""
        self.stdscr.clear()
        max_y, max_x = self.stdscr.getmaxyx()

        messages = [
            "YOU DIED",
            "",
            f"Final Level: {player.level}",
            f"Enemies Defeated: {player.kills}",
            "",
            "Press any key to exit..."
        ]

        start_y = max_y // 2 - len(messages) // 2

        for i, message in enumerate(messages):
            x = max_x // 2 - len(message) // 2
            y = start_y + i
            if 0 <= y < max_y and 0 <= x < max_x:
                try:
                    self.stdscr.addstr(y, x, message)
                except curses.error:
                    pass

        self.stdscr.refresh()
