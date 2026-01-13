"""Game result screen rendering (death, victory)."""
import curses

from ..entities import Player


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


def render_victory_screen(stdscr, player: Player, victory_info: dict = None):
    """
    Render the victory screen when player wins the game.

    Args:
        stdscr: The curses screen
        player: The player object
        victory_info: Optional dict with 'lore_found', 'lore_total'
    """
    stdscr.clear()
    max_y, max_x = stdscr.getmaxyx()

    # Victory info
    lore_found = victory_info.get('lore_found', 0) if victory_info else 0
    lore_total = victory_info.get('lore_total', 0) if victory_info else 0

    # Build messages - green and yellow theme for victory
    messages = [
        ("", 0, False),
        ("* * * * * * * * * * * * * * *", 4, True),  # Green
        ("*                           *", 4, True),
        ("*        VICTORY!           *", 2, True),  # Yellow, bold
        ("*                           *", 4, True),
        ("*   You conquered the       *", 4, True),
        ("*      dungeon!             *", 4, True),
        ("*                           *", 4, True),
        ("* * * * * * * * * * * * * * *", 4, True),
        ("", 0, False),
        ("", 0, False),
    ]

    # Stats section
    messages.append(("--- Final Statistics ---", 2, True))  # Yellow
    messages.append(("", 0, False))
    messages.append((f"Character Level: {player.level}", 1, False))
    messages.append((f"Enemies Defeated: {player.kills}", 1, False))
    messages.append((f"Max HP: {player.max_health}  |  ATK: {player.attack_damage}", 1, False))

    # Lore progress
    if lore_total > 0:
        lore_pct = int((lore_found / lore_total) * 100)
        messages.append(("", 0, False))
        messages.append((f"Lore Discovered: {lore_found}/{lore_total} ({lore_pct}%)", 6, False))  # Magenta
        if lore_found == lore_total:
            messages.append(("You uncovered all the secrets of Valdris!", 2, True))

    messages.append(("", 0, False))
    messages.append(("", 0, False))
    messages.append(("The darkness has been vanquished.", 5, False))  # Cyan
    messages.append(("Your legend will be remembered forever.", 5, False))
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
