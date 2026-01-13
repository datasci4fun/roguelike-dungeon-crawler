"""UI panel rendering for stats, minimap, inventory, and controls.

Handles the right-side panel with player stats, boss health, minimap,
inventory preview, and control hints.
"""
import curses
from typing import List, TYPE_CHECKING

from ..core.constants import (
    STATS_PANEL_WIDTH, BAR_WIDTH,
    BOX_H, BOX_V, BOX_TL, BOX_TR, BOX_LEFT, BOX_RIGHT,
    BOX_H_ASCII, BOX_V_ASCII, BOX_TL_ASCII, BOX_TR_ASCII,
    BOX_LEFT_ASCII, BOX_RIGHT_ASCII, MESSAGE_AREA_HEIGHT
)
from .render_colors import get_status_indicators

if TYPE_CHECKING:
    from ..world import Dungeon
    from ..entities import Player, Enemy
    from ..items import Item


def render_bar(current: int, max_val: int, width: int) -> str:
    """Generate a visual bar representation."""
    if max_val <= 0:
        return '░' * width

    filled = int((current / max_val) * width)
    filled = max(0, min(width, filled))

    if curses.has_colors():
        return '█' * filled + '░' * (width - filled)
    else:
        return '#' * filled + '-' * (width - filled)


def draw_horizontal_border(stdscr, y: int, x: int, width: int, left_char: str, right_char: str, fill_char: str):
    """Draw a horizontal border line."""
    try:
        stdscr.addstr(y, x, left_char)
        for i in range(1, width - 1):
            stdscr.addstr(y, x + i, fill_char)
        stdscr.addstr(y, x + width - 1, right_char)
    except curses.error:
        pass


def draw_vertical_border(stdscr, y: int, x: int, char: str):
    """Draw a single vertical border character."""
    try:
        stdscr.addstr(y, x, char)
    except curses.error:
        pass


def render_minimap(stdscr, y_start: int, x_start: int, dungeon: 'Dungeon', player: 'Player',
                   enemies: List['Enemy'], items: List['Item'], max_y: int):
    """Render a small minimap showing the dungeon layout."""
    try:
        minimap_size = 5

        minimap_border = "┌─────┐"
        if y_start < max_y:
            stdscr.addstr(y_start, x_start, minimap_border)

        for my in range(minimap_size):
            if y_start + my + 1 >= max_y:
                break

            stdscr.addstr(y_start + my + 1, x_start, "│")

            for mx in range(minimap_size):
                region_x_start = int((mx / minimap_size) * dungeon.width)
                region_x_end = int(((mx + 1) / minimap_size) * dungeon.width)
                region_y_start = int((my / minimap_size) * dungeon.height)
                region_y_end = int(((my + 1) / minimap_size) * dungeon.height)

                explored_count = 0
                total_tiles = 0
                for dy in range(region_y_start, min(region_y_end, dungeon.height)):
                    for dx in range(region_x_start, min(region_x_end, dungeon.width)):
                        total_tiles += 1
                        if dungeon.explored[dy][dx]:
                            explored_count += 1

                cell_char = ' '

                player_cell_x = int((player.x / dungeon.width) * minimap_size)
                player_cell_y = int((player.y / dungeon.height) * minimap_size)

                if mx == player_cell_x and my == player_cell_y:
                    cell_char = '@'
                elif explored_count > 0:
                    explore_ratio = explored_count / total_tiles if total_tiles > 0 else 0
                    if explore_ratio > 0.7:
                        cell_char = '█'
                    elif explore_ratio > 0.3:
                        cell_char = '▓'
                    else:
                        cell_char = '░'

                stdscr.addstr(y_start + my + 1, x_start + 1 + mx, cell_char)

            stdscr.addstr(y_start + my + 1, x_start + minimap_size + 1, "│")

        if y_start + minimap_size + 1 < max_y:
            stdscr.addstr(y_start + minimap_size + 1, x_start, "└─────┘")

        living_enemies = sum(1 for e in enemies if e.is_alive())
        if y_start + 1 < max_y:
            stats_x = x_start + 8
            stdscr.addstr(y_start + 1, stats_x, f"Rooms: {len(dungeon.rooms)}")
        if y_start + 2 < max_y:
            stdscr.addstr(y_start + 2, stats_x, f"Enemies: {living_enemies}")
        if y_start + 3 < max_y:
            stdscr.addstr(y_start + 3, stats_x, f"Items: {len(items)}")

    except curses.error:
        pass


def render_ui_panel(stdscr, player: 'Player', dungeon: 'Dungeon', enemies: List['Enemy'],
                    items: List['Item'], use_unicode: bool, smart_truncate_func):
    """Render the UI panel on the right side (stats, minimap, inventory, controls)."""
    max_y, max_x = stdscr.getmaxyx()
    panel_x = max_x - STATS_PANEL_WIDTH

    if panel_x < 0:
        return

    h_char = BOX_H if use_unicode else BOX_H_ASCII
    v_char = BOX_V if use_unicode else BOX_V_ASCII
    tl = BOX_TL if use_unicode else BOX_TL_ASCII
    tr = BOX_TR if use_unicode else BOX_TR_ASCII
    left_t = BOX_LEFT if use_unicode else BOX_LEFT_ASCII
    right_t = BOX_RIGHT if use_unicode else BOX_RIGHT_ASCII

    try:
        draw_horizontal_border(stdscr, 0, panel_x, STATS_PANEL_WIDTH, tl, tr, h_char)

        msg_area_start = max_y - MESSAGE_AREA_HEIGHT - 1

        for y in range(1, msg_area_start):
            draw_vertical_border(stdscr, y, panel_x, v_char)
            draw_vertical_border(stdscr, y, panel_x + STATS_PANEL_WIDTH - 1, v_char)

        content_width = STATS_PANEL_WIDTH - 4

        stdscr.addstr(1, panel_x + 2, "  DUNGEON"[:content_width])
        stdscr.addstr(2, panel_x + 2, f" Level: {dungeon.level}"[:content_width])

        draw_horizontal_border(stdscr, 3, panel_x, STATS_PANEL_WIDTH, left_t, right_t, h_char)

        stdscr.addstr(4, panel_x + 2, f"PLAYER (Lv {player.level})"[:content_width])

        health_bar = render_bar(player.health, player.max_health, BAR_WIDTH)
        health_pct = player.health / player.max_health if player.max_health > 0 else 0

        if curses.has_colors():
            if health_pct > 0.5:
                health_color = curses.color_pair(4)
            elif health_pct > 0.25:
                health_color = curses.color_pair(2)
            else:
                health_color = curses.color_pair(3)
        else:
            health_color = curses.A_NORMAL

        health_str = f"HP:{health_bar} {player.health}/{player.max_health}"[:content_width]
        stdscr.addstr(5, panel_x + 2, health_str, health_color)

        stdscr.addstr(6, panel_x + 2, f"ATK: {player.attack_damage}  DEF: {player.defense}"[:content_width])
        stdscr.addstr(7, panel_x + 2, f"Kills: {player.kills}"[:content_width])

        xp_in_level = player.xp - (player.xp_to_next_level - player.level * 30)
        xp_needed = player.level * 30
        xp_bar = render_bar(xp_in_level, xp_needed, BAR_WIDTH)
        xp_str = f"XP:{xp_bar} {xp_in_level}/{xp_needed}"[:content_width]
        if curses.has_colors():
            stdscr.addstr(8, panel_x + 2, xp_str, curses.color_pair(5))
        else:
            stdscr.addstr(8, panel_x + 2, xp_str)

        status_indicators = get_status_indicators(player)
        if status_indicators:
            x_offset = panel_x + 2
            for indicator_text, indicator_color in status_indicators:
                stdscr.addstr(9, x_offset, indicator_text, indicator_color)
                x_offset += len(indicator_text) + 1

        stdscr.addstr(10, panel_x + 2, f"Pos: ({player.x},{player.y})"[:content_width])

        boss = next((e for e in enemies if e.is_boss and e.is_alive()), None)
        if boss:
            draw_horizontal_border(stdscr, 11, panel_x, STATS_PANEL_WIDTH, left_t, right_t, h_char)

            boss_name = smart_truncate_func(boss.name, content_width)
            if curses.has_colors():
                stdscr.addstr(12, panel_x + 2, boss_name, curses.color_pair(6) | curses.A_BOLD)
            else:
                stdscr.addstr(12, panel_x + 2, boss_name, curses.A_BOLD)

            boss_health_bar = render_bar(boss.health, boss.max_health, BAR_WIDTH)
            boss_health_str = f"HP:{boss_health_bar} {boss.health}/{boss.max_health}"[:content_width]
            if curses.has_colors():
                stdscr.addstr(13, panel_x + 2, boss_health_str, curses.color_pair(3))
            else:
                stdscr.addstr(13, panel_x + 2, boss_health_str)

            draw_horizontal_border(stdscr, 14, panel_x, STATS_PANEL_WIDTH, left_t, right_t, h_char)

            render_minimap(stdscr, 15, panel_x + 2, dungeon, player, enemies, items, max_y)

            draw_horizontal_border(stdscr, 22, panel_x, STATS_PANEL_WIDTH, left_t, right_t, h_char)

            inv_header = f"INVENTORY ({len(player.inventory.items)}/10)"[:content_width]
            stdscr.addstr(23, panel_x + 2, inv_header)
            for i, item in enumerate(player.inventory.items[:3]):
                item_y = 24 + i
                if item_y < max_y:
                    max_item_name_len = content_width - 3
                    truncated_name = smart_truncate_func(item.name, max_item_name_len)
                    item_str = f"{i+1}. {truncated_name}"[:content_width]
                    stdscr.addstr(item_y, panel_x + 2, item_str)

            draw_horizontal_border(stdscr, 27, panel_x, STATS_PANEL_WIDTH, left_t, right_t, h_char)

            stdscr.addstr(28, panel_x + 2, "CONTROLS"[:content_width])
            stdscr.addstr(29, panel_x + 2, "WASD/Arrows: Move"[:content_width])
            stdscr.addstr(30, panel_x + 2, "1-3: Use item"[:content_width])
            stdscr.addstr(31, panel_x + 2, "Q: Quit"[:content_width])
            return

        draw_horizontal_border(stdscr, 11, panel_x, STATS_PANEL_WIDTH, left_t, right_t, h_char)

        render_minimap(stdscr, 12, panel_x + 2, dungeon, player, enemies, items, max_y)

        draw_horizontal_border(stdscr, 19, panel_x, STATS_PANEL_WIDTH, left_t, right_t, h_char)

        inv_header = f"INVENTORY ({len(player.inventory.items)}/10)"[:content_width]
        stdscr.addstr(20, panel_x + 2, inv_header)
        for i, item in enumerate(player.inventory.items[:3]):
            item_y = 21 + i
            if item_y < max_y:
                max_item_name_len = content_width - 3
                truncated_name = smart_truncate_func(item.name, max_item_name_len)
                item_str = f"{i+1}. {truncated_name}"[:content_width]
                stdscr.addstr(item_y, panel_x + 2, item_str)

        draw_horizontal_border(stdscr, 24, panel_x, STATS_PANEL_WIDTH, left_t, right_t, h_char)

        stdscr.addstr(25, panel_x + 2, "CONTROLS"[:content_width])
        stdscr.addstr(26, panel_x + 2, "WASD/Arrows: Move"[:content_width])
        stdscr.addstr(27, panel_x + 2, "1-3: Use item"[:content_width])
        stdscr.addstr(28, panel_x + 2, "Q: Quit"[:content_width])

    except curses.error:
        pass
