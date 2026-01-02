"""UI modules - rendering and screens."""
from .renderer import Renderer
from .input_adapter import CursesInputAdapter
from .screens import (
    render_game_over,
    render_victory_screen,
    render_inventory_screen,
    render_character_screen,
    render_help_screen,
    render_title_screen,
    render_intro_screen,
    render_reading_screen,
    render_dialog,
    render_message_log_screen
)
from .ui_utils import (
    get_box_chars, smart_truncate, render_bar,
    draw_screen_border, draw_title, draw_controls
)

__all__ = [
    'Renderer', 'CursesInputAdapter',
    'render_game_over', 'render_victory_screen', 'render_inventory_screen',
    'render_character_screen', 'render_help_screen',
    'render_title_screen', 'render_intro_screen', 'render_reading_screen',
    'render_dialog', 'render_message_log_screen',
    'get_box_chars', 'smart_truncate', 'render_bar',
    'draw_screen_border', 'draw_title', 'draw_controls'
]
