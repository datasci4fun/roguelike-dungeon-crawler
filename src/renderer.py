"""Terminal rendering using curses."""
import curses
from typing import List

from .constants import STATS_PANEL_WIDTH, MESSAGE_LOG_SIZE
from .dungeon import Dungeon
from .entities import Player, Enemy
from .items import Item


class Renderer:
    """Handles all terminal rendering using curses."""

    def __init__(self, stdscr):
        self.stdscr = stdscr
        curses.curs_set(0)  # Hide cursor
        self.stdscr.clear()

        # Initialize color pairs if available
        if curses.has_colors():
            curses.init_pair(1, curses.COLOR_WHITE, curses.COLOR_BLACK)  # Default
            curses.init_pair(2, curses.COLOR_YELLOW, curses.COLOR_BLACK)  # Player
            curses.init_pair(3, curses.COLOR_RED, curses.COLOR_BLACK)     # Enemy
            curses.init_pair(4, curses.COLOR_GREEN, curses.COLOR_BLACK)   # Health
            curses.init_pair(5, curses.COLOR_CYAN, curses.COLOR_BLACK)    # Items
            curses.init_pair(6, curses.COLOR_MAGENTA, curses.COLOR_BLACK) # Elite Enemy
            curses.init_pair(7, 8, curses.COLOR_BLACK)                    # Dim (dark gray)

    def render(self, dungeon: Dungeon, player: Player, enemies: List[Enemy], items: List[Item], messages: List[str]):
        """Render the entire game state."""
        self.stdscr.clear()

        # Render dungeon
        self._render_dungeon(dungeon)

        # Render items (before enemies and player) - only visible
        self._render_items(items, dungeon)

        # Render enemies - only visible
        self._render_enemies(enemies, dungeon)

        # Render player (always on top)
        self._render_player(player)

        # Render UI panel
        self._render_ui_panel(player, dungeon, messages)

        self.stdscr.refresh()

    def _render_dungeon(self, dungeon: Dungeon):
        """Render the dungeon tiles."""
        max_y, max_x = self.stdscr.getmaxyx()

        for y in range(min(dungeon.height, max_y)):
            for x in range(min(dungeon.width, max_x - STATS_PANEL_WIDTH)):
                try:
                    tile = dungeon.tiles[y][x]

                    # Only render explored tiles
                    if not dungeon.explored[y][x]:
                        continue  # Unexplored tiles are not rendered (remain black)

                    # Visible tiles render normally, explored-but-not-visible render dim
                    if dungeon.visible[y][x]:
                        self.stdscr.addch(y, x, tile.value)
                    else:
                        # Dim rendering for explored but not visible
                        if curses.has_colors():
                            self.stdscr.addch(y, x, tile.value, curses.color_pair(7))
                        else:
                            self.stdscr.addch(y, x, tile.value)
                except curses.error:
                    # Ignore errors from trying to write to bottom-right corner
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
                    if curses.has_colors():
                        # Elites render in magenta, regular enemies in red
                        color = curses.color_pair(6) if enemy.is_elite else curses.color_pair(3)
                        self.stdscr.addch(enemy.y, enemy.x, enemy.symbol, color)
                    else:
                        # No color: use '*' for elite, 'E' for regular
                        symbol = '*' if enemy.is_elite else enemy.symbol
                        self.stdscr.addch(enemy.y, enemy.x, symbol)
                except curses.error:
                    pass

    def _render_player(self, player: Player):
        """Render the player."""
        max_y, max_x = self.stdscr.getmaxyx()

        if 0 <= player.y < max_y and 0 <= player.x < max_x - STATS_PANEL_WIDTH:
            try:
                if curses.has_colors():
                    self.stdscr.addch(player.y, player.x, player.symbol, curses.color_pair(2))
                else:
                    self.stdscr.addch(player.y, player.x, player.symbol)
            except curses.error:
                pass

    def _render_ui_panel(self, player: Player, dungeon: Dungeon, messages: List[str]):
        """Render the UI panel on the right side."""
        max_y, max_x = self.stdscr.getmaxyx()
        panel_x = max_x - STATS_PANEL_WIDTH

        if panel_x < 0:
            return  # Not enough space for panel

        try:
            # Title
            self.stdscr.addstr(0, panel_x + 2, "=== DUNGEON ===")
            self.stdscr.addstr(1, panel_x + 2, f"Level: {dungeon.level}")

            # Player stats
            self.stdscr.addstr(3, panel_x + 2, f"PLAYER (Level {player.level})")

            health_str = f"HP: {player.health}/{player.max_health}"
            if curses.has_colors():
                self.stdscr.addstr(4, panel_x + 2, health_str, curses.color_pair(4))
            else:
                self.stdscr.addstr(4, panel_x + 2, health_str)

            self.stdscr.addstr(5, panel_x + 2, f"ATK: {player.attack_damage}")
            self.stdscr.addstr(6, panel_x + 2, f"Kills: {player.kills}")

            # XP bar
            xp_in_level = player.xp - (player.xp_to_next_level - player.level * 30)
            xp_needed = player.level * 30
            xp_str = f"XP: {xp_in_level}/{xp_needed}"
            self.stdscr.addstr(7, panel_x + 2, xp_str)

            # Position (for debugging/exploration feel)
            self.stdscr.addstr(9, panel_x + 2, f"Pos: ({player.x},{player.y})")

            # Inventory
            self.stdscr.addstr(11, panel_x + 2, f"INVENTORY ({len(player.inventory.items)}/10)")
            for i, item in enumerate(player.inventory.items[:3]):  # Show first 3 items
                item_y = 12 + i
                if item_y < max_y:
                    item_str = f"{i+1}. {item.name[:15]}"
                    self.stdscr.addstr(item_y, panel_x + 2, item_str)

            # Message log
            self.stdscr.addstr(16, panel_x + 2, "MESSAGES")
            for i, message in enumerate(messages[-MESSAGE_LOG_SIZE:]):
                msg_y = 17 + i
                if msg_y < max_y:
                    # Truncate message if too long
                    display_msg = message[:STATS_PANEL_WIDTH - 4]
                    self.stdscr.addstr(msg_y, panel_x + 2, display_msg)

            # Controls
            controls_y = max_y - 9
            if controls_y > 18:
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
