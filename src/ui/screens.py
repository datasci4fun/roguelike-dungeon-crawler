"""Full-screen UI rendering (inventory, character, help, game over)."""
import curses

from ..core.constants import ITEM_RARITY_COLORS
from ..entities import Player
from .ui_utils import (
    get_box_chars, smart_truncate, render_bar,
    draw_screen_border, draw_title, draw_controls
)


def render_game_over(stdscr, player: Player):
    """Render the game over screen."""
    stdscr.clear()
    max_y, max_x = stdscr.getmaxyx()

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
                stdscr.addstr(y, x, message)
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
