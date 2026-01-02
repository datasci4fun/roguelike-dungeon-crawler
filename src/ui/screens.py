"""Full-screen UI rendering (inventory, character, help, game over)."""
import curses

from ..core.constants import ITEM_RARITY_COLORS
from ..entities import Player
from .ui_utils import (
    get_box_chars, smart_truncate, render_bar,
    draw_screen_border, draw_title, draw_controls
)


def render_game_over(stdscr, player: Player, death_info: dict = None):
    """
    Render the enhanced game over screen with death recap.

    Args:
        stdscr: The curses screen
        player: The player object
        death_info: Optional dict with 'attacker', 'damage', 'max_level', 'lore_found', 'lore_total'
    """
    stdscr.clear()
    max_y, max_x = stdscr.getmaxyx()

    # Death recap info
    attacker = death_info.get('attacker', 'Unknown') if death_info else 'Unknown'
    damage = death_info.get('damage', 0) if death_info else 0
    max_level = death_info.get('max_level', 1) if death_info else 1
    lore_found = death_info.get('lore_found', 0) if death_info else 0
    lore_total = death_info.get('lore_total', 0) if death_info else 0

    # Build messages
    messages = [
        ("YOU DIED", 3, True),  # Red, bold
        ("", 0, False),
    ]

    # Death cause
    if attacker and attacker != 'Unknown':
        messages.append((f"Slain by: {attacker}", 3, False))
        if damage > 0:
            messages.append((f"Final blow: {damage} damage", 7, False))
    messages.append(("", 0, False))

    # Stats section
    messages.append(("--- Final Stats ---", 2, True))  # Yellow, bold
    messages.append((f"Character Level: {player.level}", 1, False))
    messages.append((f"Deepest Floor: {max_level}", 1, False))
    messages.append((f"Enemies Defeated: {player.kills}", 1, False))

    # Lore progress
    if lore_total > 0:
        lore_pct = int((lore_found / lore_total) * 100)
        messages.append((f"Lore Discovered: {lore_found}/{lore_total} ({lore_pct}%)", 6, False))

    messages.append(("", 0, False))
    messages.append(("Press any key to return to title...", 7, False))

    # Calculate starting position
    start_y = max(2, max_y // 2 - len(messages) // 2)

    for i, (message, color, bold) in enumerate(messages):
        x = max(0, max_x // 2 - len(message) // 2)
        y = start_y + i
        if 0 <= y < max_y - 1 and 0 <= x < max_x:
            try:
                attr = curses.A_NORMAL
                if curses.has_colors() and color > 0:
                    attr = curses.color_pair(color)
                if bold:
                    attr |= curses.A_BOLD
                stdscr.addstr(y, x, message, attr)
            except curses.error:
                pass

    stdscr.refresh()


def render_inventory_screen(stdscr, player: Player, selected_index: int, dungeon_level: int, use_unicode: bool = False):
    """Render the full-screen inventory management screen."""
    stdscr.clear()
    max_y, max_x = stdscr.getmaxyx()

    try:
        # Draw border and title
        draw_screen_border(stdscr, use_unicode)
        draw_title(stdscr, " INVENTORY ")

        # Inventory capacity
        capacity_str = f"Capacity: {len(player.inventory.items)}/{player.inventory.max_size}"
        stdscr.addstr(2, 3, capacity_str)

        # Column headers
        stdscr.addstr(4, 3, "ITEM", curses.A_BOLD if curses.has_colors() else curses.A_NORMAL)
        stdscr.addstr(4, 35, "TYPE", curses.A_BOLD if curses.has_colors() else curses.A_NORMAL)
        stdscr.addstr(4, 50, "DESCRIPTION", curses.A_BOLD if curses.has_colors() else curses.A_NORMAL)

        # Divider line
        h_char = "─" if use_unicode else "-"
        stdscr.addstr(5, 3, h_char * (max_x - 8))

        # Item list
        inventory = player.inventory
        if inventory.is_empty():
            empty_msg = "Your inventory is empty. Pick up items by walking over them."
            stdscr.addstr(7, 3, empty_msg)
        else:
            for i, item in enumerate(inventory.items):
                y = 6 + i
                if y >= max_y - 5:
                    break

                # Selection indicator
                if i == selected_index:
                    indicator = "► " if use_unicode else "> "
                    if curses.has_colors():
                        stdscr.addstr(y, 2, indicator, curses.color_pair(2) | curses.A_BOLD)
                    else:
                        stdscr.addstr(y, 2, indicator, curses.A_BOLD)

                # Item name with rarity color
                name_str = f"{item.symbol} {item.name}"
                if curses.has_colors() and item.rarity:
                    color_pair = ITEM_RARITY_COLORS.get(item.rarity, 1)
                    stdscr.addstr(y, 4, name_str, curses.color_pair(color_pair))
                else:
                    stdscr.addstr(y, 4, name_str)

                # Item type
                type_str = item.item_type.name.replace("_", " ").title()
                stdscr.addstr(y, 35, type_str[:12])

                # Description
                desc_str = item.description[:max_x - 55] if len(item.description) > max_x - 55 else item.description
                stdscr.addstr(y, 50, desc_str)

        # Selected item details (if any)
        if not inventory.is_empty() and 0 <= selected_index < len(inventory.items):
            item = inventory.items[selected_index]
            details_y = max_y - 8

            stdscr.addstr(details_y, 3, h_char * (max_x - 8))
            stdscr.addstr(details_y + 1, 3, "SELECTED: ", curses.A_BOLD)

            if curses.has_colors() and item.rarity:
                color_pair = ITEM_RARITY_COLORS.get(item.rarity, 1)
                stdscr.addstr(details_y + 1, 13, item.name, curses.color_pair(color_pair) | curses.A_BOLD)
            else:
                stdscr.addstr(details_y + 1, 13, item.name, curses.A_BOLD)

            stdscr.addstr(details_y + 2, 3, f"Effect: {item.description}")

        # Equipment section
        equip_y = max_y - 12
        stdscr.addstr(equip_y, 3, h_char * (max_x - 8))
        stdscr.addstr(equip_y + 1, 3, "EQUIPMENT", curses.A_BOLD)

        # Weapon slot
        weapon_str = "Weapon: "
        if player.equipped_weapon:
            weapon_name = f"{player.equipped_weapon.name} (+{player.equipped_weapon.attack_bonus} ATK)"
            if curses.has_colors() and player.equipped_weapon.rarity:
                color_pair = ITEM_RARITY_COLORS.get(player.equipped_weapon.rarity, 1)
                stdscr.addstr(equip_y + 2, 3, weapon_str)
                stdscr.addstr(equip_y + 2, 3 + len(weapon_str), weapon_name, curses.color_pair(color_pair))
            else:
                stdscr.addstr(equip_y + 2, 3, weapon_str + weapon_name)
        else:
            stdscr.addstr(equip_y + 2, 3, weapon_str + "(none)")

        # Armor slot
        armor_str = "Armor:  "
        if player.equipped_armor:
            armor_name = f"{player.equipped_armor.name} (+{player.equipped_armor.defense_bonus} DEF)"
            if curses.has_colors() and player.equipped_armor.rarity:
                color_pair = ITEM_RARITY_COLORS.get(player.equipped_armor.rarity, 1)
                stdscr.addstr(equip_y + 3, 3, armor_str)
                stdscr.addstr(equip_y + 3, 3 + len(armor_str), armor_name, curses.color_pair(color_pair))
            else:
                stdscr.addstr(equip_y + 3, 3, armor_str + armor_name)
        else:
            stdscr.addstr(equip_y + 3, 3, armor_str + "(none)")

        # Controls
        draw_controls(stdscr, "[↑/↓] Select  [E/Enter] Equip/Use  [D] Drop  [I/Q/ESC] Close")

    except curses.error:
        pass

    stdscr.refresh()


def render_character_screen(stdscr, player: Player, dungeon_level: int, use_unicode: bool = False):
    """Render the full-screen character stats screen."""
    stdscr.clear()
    max_y, max_x = stdscr.getmaxyx()
    h_char = "═" if use_unicode else "="

    try:
        # Draw border and title
        draw_screen_border(stdscr, use_unicode)
        draw_title(stdscr, " CHARACTER ")

        # Character name/symbol
        stdscr.addstr(3, 5, "ADVENTURER", curses.A_BOLD)
        if curses.has_colors():
            stdscr.addstr(3, 17, f" {player.symbol}", curses.color_pair(2) | curses.A_BOLD)

        # Stats section headers
        stdscr.addstr(5, 5, h_char * 30)
        stdscr.addstr(6, 5, "STATS", curses.A_BOLD)
        stdscr.addstr(5, 40, h_char * 30)
        stdscr.addstr(6, 40, "PROGRESS", curses.A_BOLD)

        # Left column - Combat stats
        y = 8
        stdscr.addstr(y, 5, f"Level:        {player.level}")
        y += 1

        # Health with bar
        health_pct = player.health / player.max_health if player.max_health > 0 else 0
        health_bar = render_bar(player.health, player.max_health, 15)
        health_color = curses.color_pair(4) if health_pct > 0.5 else (curses.color_pair(2) if health_pct > 0.25 else curses.color_pair(3))
        stdscr.addstr(y, 5, f"Health:       ")
        if curses.has_colors():
            stdscr.addstr(y, 19, health_bar, health_color)
        else:
            stdscr.addstr(y, 19, health_bar)
        stdscr.addstr(y, 35, f"{player.health}/{player.max_health}")
        y += 1

        stdscr.addstr(y, 5, f"Attack:       {player.attack_damage}")
        y += 1
        stdscr.addstr(y, 5, f"Defense:      {player.defense}")
        y += 2

        stdscr.addstr(y, 5, f"Position:     ({player.x}, {player.y})")
        y += 1
        stdscr.addstr(y, 5, f"Dungeon Lv:   {dungeon_level}")

        # Right column - Progress stats
        y = 8
        stdscr.addstr(y, 40, f"Kills:        {player.kills}")
        y += 1

        # XP with bar
        xp_in_level = player.xp - (player.xp_to_next_level - player.level * 30)
        xp_needed = player.level * 30
        xp_bar = render_bar(xp_in_level, xp_needed, 15)
        stdscr.addstr(y, 40, f"Experience:   ")
        if curses.has_colors():
            stdscr.addstr(y, 54, xp_bar, curses.color_pair(5))
        else:
            stdscr.addstr(y, 54, xp_bar)
        stdscr.addstr(y, 70, f"{xp_in_level}/{xp_needed}")
        y += 1

        stdscr.addstr(y, 40, f"Total XP:     {player.xp}")
        y += 1
        stdscr.addstr(y, 40, f"Next Level:   {player.xp_to_next_level} XP")

        # Equipment section
        y = 17
        stdscr.addstr(y, 5, h_char * 65)
        y += 1
        stdscr.addstr(y, 5, "EQUIPMENT", curses.A_BOLD)
        y += 1

        # Weapon slot
        weapon_str = "Weapon: "
        if player.equipped_weapon:
            weapon_name = f"{player.equipped_weapon.name} (+{player.equipped_weapon.attack_bonus} ATK)"
            stdscr.addstr(y, 5, weapon_str + weapon_name)
        else:
            stdscr.addstr(y, 5, weapon_str + "(none)")
        y += 1

        # Armor slot
        armor_str = "Armor:  "
        if player.equipped_armor:
            armor_name = f"{player.equipped_armor.name} (+{player.equipped_armor.defense_bonus} DEF)"
            stdscr.addstr(y, 5, armor_str + armor_name)
        else:
            stdscr.addstr(y, 5, armor_str + "(none)")
        y += 2

        # Inventory summary
        stdscr.addstr(y, 5, h_char * 65)
        y += 1
        stdscr.addstr(y, 5, "INVENTORY", curses.A_BOLD)
        y += 1
        stdscr.addstr(y, 5, f"Items: {len(player.inventory.items)}/{player.inventory.max_size}")

        # Controls
        draw_controls(stdscr, "Press any key to close")

    except curses.error:
        pass

    stdscr.refresh()


def render_help_screen(stdscr, use_unicode: bool = False):
    """Render the help screen with controls and game info."""
    stdscr.clear()
    max_y, max_x = stdscr.getmaxyx()

    try:
        # Draw border and title
        draw_screen_border(stdscr, use_unicode)
        draw_title(stdscr, " HELP ")

        y = 3

        # Movement section
        stdscr.addstr(y, 5, "MOVEMENT", curses.A_BOLD)
        y += 1
        stdscr.addstr(y, 5, "Arrow Keys / WASD    Move in direction")
        y += 1
        stdscr.addstr(y, 5, "Bump into enemy      Attack")
        y += 2

        # Screens section
        stdscr.addstr(y, 5, "SCREENS", curses.A_BOLD)
        y += 1
        stdscr.addstr(y, 5, "I                    Open Inventory")
        y += 1
        stdscr.addstr(y, 5, "C                    Character Stats")
        y += 1
        stdscr.addstr(y, 5, "?                    This Help Screen")
        y += 2

        # Items section
        stdscr.addstr(y, 5, "ITEMS", curses.A_BOLD)
        y += 1
        stdscr.addstr(y, 5, "1-3                  Quick use item (from sidebar)")
        y += 1
        stdscr.addstr(y, 5, "Walk over item       Auto pickup")
        y += 2

        # Game section
        stdscr.addstr(y, 5, "GAME", curses.A_BOLD)
        y += 1
        stdscr.addstr(y, 5, ">                    Stairs down (descend)")
        y += 1
        stdscr.addstr(y, 5, "Q                    Save and Quit")
        y += 2

        # Symbols section
        stdscr.addstr(y, 5, "SYMBOLS", curses.A_BOLD)
        y += 1
        if curses.has_colors():
            stdscr.addstr(y, 5, "@", curses.color_pair(2))
            stdscr.addstr(y, 7, "You")
            stdscr.addstr(y, 20, "g s o", curses.color_pair(3))
            stdscr.addstr(y, 26, "Enemies (goblin, skeleton, orc)")
        else:
            stdscr.addstr(y, 5, "@ You     g s o Enemies")
        y += 1
        if curses.has_colors():
            stdscr.addstr(y, 5, "!", curses.color_pair(5))
            stdscr.addstr(y, 7, "Potion")
            stdscr.addstr(y, 20, "?", curses.color_pair(5))
            stdscr.addstr(y, 22, "Scroll")
            stdscr.addstr(y, 35, ">", curses.color_pair(1))
            stdscr.addstr(y, 37, "Stairs down")
        else:
            stdscr.addstr(y, 5, "! Potion  ? Scroll  > Stairs")

        # Controls
        draw_controls(stdscr, "Press any key to close")

    except curses.error:
        pass

    stdscr.refresh()


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


def render_reading_screen(stdscr, title: str, content: list, use_unicode: bool = False):
    """
    Render a full-screen reading view for lore items.

    Args:
        stdscr: The curses screen
        title: Title of the lore item
        content: List of paragraphs/lines to display
        use_unicode: Whether to use Unicode box drawing characters
    """
    stdscr.clear()
    max_y, max_x = stdscr.getmaxyx()

    try:
        # Draw border
        draw_screen_border(stdscr, use_unicode)

        # Title
        display_title = f"~ {title} ~"
        title_x = max(2, (max_x - len(display_title)) // 2)
        if curses.has_colors():
            stdscr.addstr(2, title_x, display_title, curses.color_pair(2) | curses.A_BOLD)
        else:
            stdscr.addstr(2, title_x, display_title, curses.A_BOLD)

        # Decorative line under title
        line_width = min(len(display_title) + 4, max_x - 6)
        line_x = max(2, (max_x - line_width) // 2)
        line_char = '-' * line_width
        if 3 < max_y - 4:
            if curses.has_colors():
                stdscr.addstr(3, line_x, line_char, curses.color_pair(7))
            else:
                stdscr.addstr(3, line_x, line_char)

        # Content area
        content_start_y = 5
        content_width = max_x - 8  # Leave margin on sides

        # Word-wrap and display content
        wrapped_lines = []
        for paragraph in content:
            if not paragraph:  # Empty line (paragraph break)
                wrapped_lines.append("")
            else:
                # Simple word wrap
                words = paragraph.split()
                current_line = ""
                for word in words:
                    if len(current_line) + len(word) + 1 <= content_width:
                        if current_line:
                            current_line += " " + word
                        else:
                            current_line = word
                    else:
                        if current_line:
                            wrapped_lines.append(current_line)
                        current_line = word
                if current_line:
                    wrapped_lines.append(current_line)

        # Display wrapped content
        for i, line in enumerate(wrapped_lines):
            y = content_start_y + i
            if y >= max_y - 4:
                # Show "more" indicator if content is cut off
                if curses.has_colors():
                    stdscr.addstr(max_y - 5, max_x - 12, "[...]", curses.color_pair(7))
                break
            x = max(4, (max_x - len(line)) // 2)
            if curses.has_colors():
                stdscr.addstr(y, x, line, curses.color_pair(1))
            else:
                stdscr.addstr(y, x, line)

        # Controls hint at bottom
        hint = "Press any key to close"
        hint_x = max(2, (max_x - len(hint)) // 2)
        hint_y = max_y - 3
        if hint_y > 0:
            if curses.has_colors():
                stdscr.addstr(hint_y, hint_x, hint, curses.color_pair(7))
            else:
                stdscr.addstr(hint_y, hint_x, hint)

    except curses.error:
        pass

    stdscr.refresh()


def render_dialog(stdscr, title: str, message: str, options: list = None,
                  use_unicode: bool = False):
    """
    Render a centered confirmation dialog box.

    Args:
        stdscr: The curses screen
        title: Dialog title (e.g., "Confirm")
        message: The question/message to display
        options: List of option tuples [(key, label), ...] e.g., [('Y', 'Yes'), ('N', 'No')]
                 Defaults to Yes/No if not provided
        use_unicode: Whether to use Unicode box drawing characters
    """
    if options is None:
        options = [('Y', 'Yes'), ('N', 'No')]

    max_y, max_x = stdscr.getmaxyx()

    # Calculate dialog dimensions
    min_width = 30
    content_width = max(len(title) + 4, len(message) + 4, min_width)
    options_text = "  ".join([f"[{key}] {label}" for key, label in options])
    content_width = max(content_width, len(options_text) + 4)
    dialog_width = min(content_width, max_x - 4)
    dialog_height = 7  # Border + title + blank + message + blank + options + border

    # Center the dialog
    start_x = (max_x - dialog_width) // 2
    start_y = (max_y - dialog_height) // 2

    # Get box drawing characters
    h_char, v_char, tl, tr, bl, br = get_box_chars(use_unicode)

    try:
        # Draw dialog box
        # Top border
        stdscr.addstr(start_y, start_x, tl + h_char * (dialog_width - 2) + tr)

        # Middle rows (fill with spaces)
        for row in range(1, dialog_height - 1):
            stdscr.addstr(start_y + row, start_x, v_char + ' ' * (dialog_width - 2) + v_char)

        # Bottom border
        stdscr.addstr(start_y + dialog_height - 1, start_x, bl + h_char * (dialog_width - 2) + br)

        # Title (centered, bold)
        title_x = start_x + (dialog_width - len(title)) // 2
        if curses.has_colors():
            stdscr.addstr(start_y + 1, title_x, title, curses.color_pair(2) | curses.A_BOLD)
        else:
            stdscr.addstr(start_y + 1, title_x, title, curses.A_BOLD)

        # Message (centered)
        # Word wrap if needed
        inner_width = dialog_width - 4
        if len(message) <= inner_width:
            msg_lines = [message]
        else:
            # Simple word wrap
            words = message.split()
            msg_lines = []
            current_line = ""
            for word in words:
                if len(current_line) + len(word) + 1 <= inner_width:
                    current_line = current_line + " " + word if current_line else word
                else:
                    if current_line:
                        msg_lines.append(current_line)
                    current_line = word
            if current_line:
                msg_lines.append(current_line)

        msg_start_y = start_y + 3
        for i, line in enumerate(msg_lines):
            if msg_start_y + i < start_y + dialog_height - 2:
                msg_x = start_x + (dialog_width - len(line)) // 2
                if curses.has_colors():
                    stdscr.addstr(msg_start_y + i, msg_x, line, curses.color_pair(1))
                else:
                    stdscr.addstr(msg_start_y + i, msg_x, line)

        # Options (centered at bottom)
        options_y = start_y + dialog_height - 2
        options_x = start_x + (dialog_width - len(options_text)) // 2

        # Draw each option with highlighted key
        current_x = options_x
        for key, label in options:
            key_text = f"[{key}]"
            if curses.has_colors():
                stdscr.addstr(options_y, current_x, key_text, curses.color_pair(2) | curses.A_BOLD)
                stdscr.addstr(options_y, current_x + len(key_text), f" {label}", curses.color_pair(1))
            else:
                stdscr.addstr(options_y, current_x, key_text, curses.A_BOLD)
                stdscr.addstr(options_y, current_x + len(key_text), f" {label}")
            current_x += len(key_text) + len(label) + 3  # +3 for space and separator

    except curses.error:
        pass

    stdscr.refresh()


def render_message_log_screen(stdscr, message_log, use_unicode: bool = False):
    """
    Render the full message history screen.

    Args:
        stdscr: The curses screen
        message_log: The MessageLog object containing all messages
        use_unicode: Whether to use Unicode box drawing characters
    """
    from ..core.messages import MessageCategory, MessageImportance

    stdscr.clear()
    max_y, max_x = stdscr.getmaxyx()

    try:
        # Draw border
        draw_screen_border(stdscr, use_unicode)

        # Title
        title = "~ Message Log ~"
        draw_title(stdscr, title)

        # Get all messages
        all_messages = message_log.get_all()
        visible_lines = max_y - 7  # Leave room for border, title, controls

        # Calculate scroll range
        total_messages = len(all_messages)
        scroll_offset = message_log.scroll_offset

        # Display messages
        content_start_y = 3
        content_width = max_x - 6

        if not all_messages:
            # No messages
            no_msg = "No messages yet."
            msg_x = (max_x - len(no_msg)) // 2
            if curses.has_colors():
                stdscr.addstr(content_start_y + 2, msg_x, no_msg, curses.color_pair(7))
            else:
                stdscr.addstr(content_start_y + 2, msg_x, no_msg)
        else:
            # Show messages from scroll_offset
            display_messages = all_messages[scroll_offset:scroll_offset + visible_lines]

            for i, msg in enumerate(display_messages):
                y = content_start_y + i
                if y >= max_y - 4:
                    break

                # Truncate message if too long
                text = msg.text
                if len(text) > content_width:
                    text = text[:content_width - 3] + "..."

                # Choose color based on category/importance
                color_pair = 1  # Default white
                if curses.has_colors():
                    if msg.importance == MessageImportance.CRITICAL:
                        color_pair = 3  # Red
                    elif msg.importance == MessageImportance.IMPORTANT:
                        color_pair = 2  # Yellow
                    elif msg.category == MessageCategory.COMBAT:
                        color_pair = 3  # Red for combat
                    elif msg.category == MessageCategory.ITEM:
                        color_pair = 5  # Cyan for items
                    elif msg.category == MessageCategory.STORY:
                        color_pair = 6  # Magenta for story

                x = 3
                if curses.has_colors():
                    stdscr.addstr(y, x, text, curses.color_pair(color_pair))
                else:
                    stdscr.addstr(y, x, text)

            # Scroll indicator
            if total_messages > visible_lines:
                scroll_info = f"[{scroll_offset + 1}-{min(scroll_offset + visible_lines, total_messages)}/{total_messages}]"
                scroll_x = max_x - len(scroll_info) - 3
                if curses.has_colors():
                    stdscr.addstr(2, scroll_x, scroll_info, curses.color_pair(7))
                else:
                    stdscr.addstr(2, scroll_x, scroll_info)

        # Controls hint at bottom
        controls = "Up/Down: Scroll | Q/ESC: Close"
        draw_controls(stdscr, controls)

    except curses.error:
        pass

    stdscr.refresh()
