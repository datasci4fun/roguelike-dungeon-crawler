"""Shared UI utility functions for rendering."""
import curses
from typing import Tuple

from ..core.constants import (
    BOX_TL, BOX_TR, BOX_BL, BOX_BR, BOX_H, BOX_V,
    BOX_TL_ASCII, BOX_TR_ASCII, BOX_BL_ASCII, BOX_BR_ASCII,
    BOX_H_ASCII, BOX_V_ASCII
)


def get_box_chars(use_unicode: bool = True) -> Tuple[str, str, str, str, str, str]:
    """
    Get box-drawing characters based on terminal capability.

    Returns:
        Tuple of (h_char, v_char, tl, tr, bl, br)
    """
    if use_unicode:
        return (BOX_H, BOX_V, BOX_TL, BOX_TR, BOX_BL, BOX_BR)
    else:
        return (BOX_H_ASCII, BOX_V_ASCII, BOX_TL_ASCII, BOX_TR_ASCII, BOX_BL_ASCII, BOX_BR_ASCII)


def smart_truncate(text: str, max_length: int) -> str:
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

    if max_length <= 3:
        return text[:max_length]

    truncate_at = max_length - 3
    last_space = text[:truncate_at].rfind(' ')

    if last_space > 0 and last_space > truncate_at // 2:
        return text[:last_space] + "..."
    else:
        return text[:truncate_at] + "..."


def render_bar(current: int, max_val: int, width: int) -> str:
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

    if curses.has_colors():
        return '█' * filled + '░' * (width - filled)
    else:
        return '#' * filled + '-' * (width - filled)


def draw_screen_border(stdscr, use_unicode: bool = True):
    """Draw a border around the entire screen."""
    max_y, max_x = stdscr.getmaxyx()
    h_char, v_char, tl, tr, bl, br = get_box_chars(use_unicode)

    try:
        stdscr.addch(0, 0, tl)
        stdscr.addch(0, max_x - 2, tr)
        stdscr.addch(max_y - 2, 0, bl)
        stdscr.addch(max_y - 2, max_x - 2, br)

        for x in range(1, max_x - 2):
            stdscr.addch(0, x, h_char)
            stdscr.addch(max_y - 2, x, h_char)

        for y in range(1, max_y - 2):
            stdscr.addch(y, 0, v_char)
            stdscr.addch(y, max_x - 2, v_char)
    except curses.error:
        pass


def draw_title(stdscr, title: str, use_color: bool = True):
    """Draw a centered title at the top of the screen."""
    max_y, max_x = stdscr.getmaxyx()
    title_x = (max_x - len(title)) // 2

    try:
        if use_color and curses.has_colors():
            stdscr.addstr(0, title_x, title, curses.color_pair(2) | curses.A_BOLD)
        else:
            stdscr.addstr(0, title_x, title, curses.A_BOLD)
    except curses.error:
        pass


def draw_controls(stdscr, controls: str):
    """Draw controls hint at the bottom of the screen."""
    max_y, max_x = stdscr.getmaxyx()
    controls_y = max_y - 4
    controls_x = (max_x - len(controls)) // 2

    try:
        if curses.has_colors():
            stdscr.addstr(controls_y, controls_x, controls, curses.color_pair(7))
        else:
            stdscr.addstr(controls_y, controls_x, controls)
    except curses.error:
        pass
