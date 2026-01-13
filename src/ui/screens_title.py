"""Title and intro screen rendering."""
import curses

from .ui_utils import draw_screen_border


def render_title_screen(stdscr, has_save: bool = False, use_unicode: bool = False):
    """Render the title screen with game logo and menu options."""
    stdscr.clear()
    max_y, max_x = stdscr.getmaxyx()

    # ASCII art game title
    title_art = [
        "  ____                        _ _ _        ",
        " |  _ \\ ___   __ _ _   _  ___| (_) | _____ ",
        " | |_) / _ \\ / _` | | | |/ _ \\ | | |/ / _ \\",
        " |  _ < (_) | (_| | |_| |  __/ | |   <  __/",
        " |_| \\_\\___/ \\__, |\\__,_|\\___|_|_|_|\\_\\___|",
        "             |___/                         ",
        "",
        "     D U N G E O N   C R A W L E R",
    ]

    subtitle = "A Terminal Adventure"

    try:
        # Draw border
        draw_screen_border(stdscr, use_unicode)

        # Center and draw title art
        start_y = max(3, (max_y - len(title_art) - 12) // 2)
        for i, line in enumerate(title_art):
            x = max(2, (max_x - len(line)) // 2)
            if start_y + i < max_y - 1:
                if curses.has_colors():
                    stdscr.addstr(start_y + i, x, line, curses.color_pair(2) | curses.A_BOLD)
                else:
                    stdscr.addstr(start_y + i, x, line, curses.A_BOLD)

        # Subtitle
        sub_y = start_y + len(title_art) + 1
        sub_x = max(2, (max_x - len(subtitle)) // 2)
        if sub_y < max_y - 1:
            if curses.has_colors():
                stdscr.addstr(sub_y, sub_x, subtitle, curses.color_pair(5))
            else:
                stdscr.addstr(sub_y, sub_x, subtitle)

        # Menu options
        menu_y = sub_y + 3
        menu_items = [
            ("[N]", "ew Game", True),
            ("[C]", "ontinue", has_save),
            ("[H]", "elp", True),
            ("[Q]", "uit", True),
        ]

        for i, (key, label, enabled) in enumerate(menu_items):
            if not enabled:
                continue
            item_text = key + label
            item_x = max(2, (max_x - len(item_text)) // 2)
            if menu_y + i < max_y - 2:
                if curses.has_colors():
                    # Highlight the key
                    if enabled:
                        stdscr.addstr(menu_y + i, item_x, key, curses.color_pair(2) | curses.A_BOLD)
                        stdscr.addstr(menu_y + i, item_x + len(key), label, curses.color_pair(1))
                    else:
                        stdscr.addstr(menu_y + i, item_x, item_text, curses.color_pair(7))
                else:
                    stdscr.addstr(menu_y + i, item_x, item_text)

        # Version info at bottom
        version = "v2.2.0"
        ver_x = max_x - len(version) - 3
        ver_y = max_y - 3
        if ver_y > 0 and ver_x > 0:
            if curses.has_colors():
                stdscr.addstr(ver_y, ver_x, version, curses.color_pair(7))
            else:
                stdscr.addstr(ver_y, ver_x, version)

    except curses.error:
        pass

    stdscr.refresh()


def render_intro_screen(stdscr, page: int = 0, use_unicode: bool = False):
    """Render the story intro/prologue screen."""
    stdscr.clear()
    max_y, max_x = stdscr.getmaxyx()

    # Prologue text - can be multi-page
    prologue_pages = [
        [
            "Long ago, the kingdom of Valdris flourished above these depths.",
            "",
            "When the Darkness came, the people fled underground,",
            "sealing themselves in with their treasures and their dead.",
            "",
            "Centuries passed. The seals weakened.",
            "",
            "Now, something stirs below...",
        ],
        [
            "You are an adventurer, drawn by rumors of gold and glory.",
            "",
            "The entrance to the ancient dungeons has been rediscovered,",
            "a gaping maw in the hillside that breathes cold, stale air.",
            "",
            "Many have entered. None have returned.",
            "",
            "But you are different. You must be.",
            "",
            "Steel your nerves. Ready your blade.",
            "",
            "The depths await.",
        ],
    ]

    # Ensure page is valid
    page = max(0, min(page, len(prologue_pages) - 1))
    current_page = prologue_pages[page]

    try:
        # Draw border
        draw_screen_border(stdscr, use_unicode)

        # Title
        title = "~ PROLOGUE ~"
        title_x = max(2, (max_x - len(title)) // 2)
        if curses.has_colors():
            stdscr.addstr(2, title_x, title, curses.color_pair(2) | curses.A_BOLD)
        else:
            stdscr.addstr(2, title_x, title, curses.A_BOLD)

        # Calculate content area
        start_y = max(5, (max_y - len(current_page)) // 2 - 2)

        # Draw prologue text
        for i, line in enumerate(current_page):
            if start_y + i >= max_y - 4:
                break
            x = max(4, (max_x - len(line)) // 2)
            if curses.has_colors():
                stdscr.addstr(start_y + i, x, line, curses.color_pair(1))
            else:
                stdscr.addstr(start_y + i, x, line)

        # Navigation hint
        if page < len(prologue_pages) - 1:
            hint = "Press SPACE or ENTER to continue, ESC to skip"
        else:
            hint = "Press any key to begin your adventure..."

        hint_x = max(2, (max_x - len(hint)) // 2)
        hint_y = max_y - 4
        if hint_y > 0:
            if curses.has_colors():
                stdscr.addstr(hint_y, hint_x, hint, curses.color_pair(7))
            else:
                stdscr.addstr(hint_y, hint_x, hint)

        # Page indicator
        page_text = f"Page {page + 1} of {len(prologue_pages)}"
        page_x = max_x - len(page_text) - 3
        if page_x > 0:
            if curses.has_colors():
                stdscr.addstr(hint_y, page_x, page_text, curses.color_pair(7))
            else:
                stdscr.addstr(hint_y, page_x, page_text)

    except curses.error:
        pass

    stdscr.refresh()

    # Return total number of pages for navigation
    return len(prologue_pages)
