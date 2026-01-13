"""World rendering functions for dungeon tiles, terrain, and entities.

Handles rendering of dungeon floors, terrain features, decorations, hazards, traps,
items, enemies, and player within the viewport.
"""
import curses
from typing import List, TYPE_CHECKING

if TYPE_CHECKING:
    from ..world import Dungeon
    from ..world.traps import Trap
    from ..world.hazards import Hazard
    from ..entities import Player, Enemy
    from ..items import Item


def render_dungeon(stdscr, dungeon: 'Dungeon', vp_x: int, vp_y: int, vp_w: int, vp_h: int, use_unicode: bool):
    """Render the dungeon tiles within the viewport."""
    for screen_y in range(vp_h):
        for screen_x in range(vp_w):
            world_x = vp_x + screen_x
            world_y = vp_y + screen_y

            if not (0 <= world_x < dungeon.width and 0 <= world_y < dungeon.height):
                continue

            try:
                if not dungeon.explored[world_y][world_x]:
                    continue

                visual_char = dungeon.get_visual_char(world_x, world_y, use_unicode)

                if dungeon.visible[world_y][world_x]:
                    stdscr.addstr(screen_y, screen_x, visual_char)
                else:
                    if curses.has_colors():
                        stdscr.addstr(screen_y, screen_x, visual_char, curses.color_pair(7))
                    else:
                        stdscr.addstr(screen_y, screen_x, visual_char)
            except curses.error:
                pass


def render_terrain(stdscr, dungeon: 'Dungeon', vp_x: int, vp_y: int, vp_w: int, vp_h: int, is_in_viewport_func, world_to_screen_func):
    """Render terrain features (water, blood, grass) in explored/visible tiles."""
    for world_x, world_y, char, color_pair in dungeon.terrain_features:
        if not (0 <= world_y < dungeon.height and 0 <= world_x < dungeon.width):
            continue

        if not dungeon.explored[world_y][world_x]:
            continue

        if not is_in_viewport_func(world_x, world_y, vp_x, vp_y, vp_w, vp_h):
            continue

        screen_x, screen_y = world_to_screen_func(world_x, world_y, vp_x, vp_y)

        try:
            if dungeon.visible[world_y][world_x]:
                if curses.has_colors():
                    stdscr.addstr(screen_y, screen_x, char, curses.color_pair(color_pair))
                else:
                    stdscr.addstr(screen_y, screen_x, char)
            else:
                if curses.has_colors():
                    stdscr.addstr(screen_y, screen_x, char, curses.color_pair(7))
                else:
                    stdscr.addstr(screen_y, screen_x, char)
        except curses.error:
            pass


def render_zone_evidence(stdscr, dungeon: 'Dungeon', vp_x: int, vp_y: int, vp_w: int, vp_h: int, is_in_viewport_func, world_to_screen_func):
    """Render zone evidence (trail tells, lore markers) in explored/visible tiles."""
    for world_x, world_y, char, color_pair, evidence_type in dungeon.zone_evidence:
        if not (0 <= world_y < dungeon.height and 0 <= world_x < dungeon.width):
            continue

        if not dungeon.explored[world_y][world_x]:
            continue

        if not is_in_viewport_func(world_x, world_y, vp_x, vp_y, vp_w, vp_h):
            continue

        screen_x, screen_y = world_to_screen_func(world_x, world_y, vp_x, vp_y)

        try:
            if dungeon.visible[world_y][world_x]:
                if curses.has_colors():
                    stdscr.addstr(screen_y, screen_x, char, curses.color_pair(color_pair))
                else:
                    stdscr.addstr(screen_y, screen_x, char)
            else:
                if curses.has_colors():
                    stdscr.addstr(screen_y, screen_x, char, curses.color_pair(7))
                else:
                    stdscr.addstr(screen_y, screen_x, char)
        except curses.error:
            pass


def render_hazards(stdscr, hazards: List['Hazard'], dungeon: 'Dungeon', vp_x: int, vp_y: int, vp_w: int, vp_h: int, is_in_viewport_func, world_to_screen_func):
    """Render environmental hazards (lava, ice, poison gas, deep water)."""
    for hazard in hazards:
        world_x, world_y = hazard.x, hazard.y

        if not (0 <= world_y < dungeon.height and 0 <= world_x < dungeon.width):
            continue

        if not dungeon.explored[world_y][world_x]:
            continue

        if not is_in_viewport_func(world_x, world_y, vp_x, vp_y, vp_w, vp_h):
            continue

        screen_x, screen_y = world_to_screen_func(world_x, world_y, vp_x, vp_y)

        try:
            symbol = hazard.symbol
            color_pair = hazard.color

            if dungeon.visible[world_y][world_x]:
                if curses.has_colors():
                    stdscr.addstr(screen_y, screen_x, symbol, curses.color_pair(color_pair))
                else:
                    stdscr.addstr(screen_y, screen_x, symbol)
            else:
                if curses.has_colors():
                    stdscr.addstr(screen_y, screen_x, symbol, curses.color_pair(7))
                else:
                    stdscr.addstr(screen_y, screen_x, symbol)
        except curses.error:
            pass


def render_traps(stdscr, visible_traps: List['Trap'], dungeon: 'Dungeon', vp_x: int, vp_y: int, vp_w: int, vp_h: int, is_in_viewport_func, world_to_screen_func):
    """Render visible (detected) traps."""
    for trap in visible_traps:
        world_x, world_y = trap.x, trap.y

        if not (0 <= world_y < dungeon.height and 0 <= world_x < dungeon.width):
            continue

        if not dungeon.visible[world_y][world_x]:
            continue

        if not is_in_viewport_func(world_x, world_y, vp_x, vp_y, vp_w, vp_h):
            continue

        screen_x, screen_y = world_to_screen_func(world_x, world_y, vp_x, vp_y)

        try:
            symbol = trap.symbol
            if curses.has_colors():
                stdscr.addstr(screen_y, screen_x, symbol, curses.color_pair(3))
            else:
                stdscr.addstr(screen_y, screen_x, symbol)
        except curses.error:
            pass


def render_decorations(stdscr, dungeon: 'Dungeon', vp_x: int, vp_y: int, vp_w: int, vp_h: int, is_in_viewport_func, world_to_screen_func):
    """Render decorations in explored/visible tiles."""
    for world_x, world_y, char, color_pair in dungeon.decorations:
        if not (0 <= world_y < dungeon.height and 0 <= world_x < dungeon.width):
            continue

        if not dungeon.explored[world_y][world_x]:
            continue

        if not is_in_viewport_func(world_x, world_y, vp_x, vp_y, vp_w, vp_h):
            continue

        screen_x, screen_y = world_to_screen_func(world_x, world_y, vp_x, vp_y)

        try:
            if dungeon.visible[world_y][world_x]:
                if curses.has_colors():
                    stdscr.addstr(screen_y, screen_x, char, curses.color_pair(color_pair))
                else:
                    stdscr.addstr(screen_y, screen_x, char)
            else:
                if curses.has_colors():
                    stdscr.addstr(screen_y, screen_x, char, curses.color_pair(7))
                else:
                    stdscr.addstr(screen_y, screen_x, char)
        except curses.error:
            pass


def render_items(stdscr, items: List['Item'], dungeon: 'Dungeon', vp_x: int, vp_y: int, vp_w: int, vp_h: int, is_in_viewport_func, world_to_screen_func):
    """Render all items on the ground (only if visible)."""
    from ..core.constants import ITEM_RARITY_COLORS

    for item in items:
        if not is_in_viewport_func(item.x, item.y, vp_x, vp_y, vp_w, vp_h):
            continue

        if not dungeon.visible[item.y][item.x]:
            continue

        screen_x, screen_y = world_to_screen_func(item.x, item.y, vp_x, vp_y)

        try:
            if curses.has_colors():
                if item.rarity:
                    color_pair = ITEM_RARITY_COLORS[item.rarity]
                else:
                    color_pair = 5
                stdscr.addstr(screen_y, screen_x, item.symbol, curses.color_pair(color_pair))
            else:
                stdscr.addstr(screen_y, screen_x, item.symbol)
        except curses.error:
            pass


def render_enemies(stdscr, enemies: List['Enemy'], dungeon: 'Dungeon', player: 'Player',
                   vp_x: int, vp_y: int, vp_w: int, vp_h: int,
                   is_in_viewport_func, world_to_screen_func,
                   get_element_color_func, is_entity_animated_func):
    """Render all living enemies (only if visible).

    Invisible enemies are hidden unless player is within detection radius (1 tile).
    """
    for enemy in enemies:
        if not enemy.is_alive():
            continue

        if not is_in_viewport_func(enemy.x, enemy.y, vp_x, vp_y, vp_w, vp_h):
            continue

        if not dungeon.visible[enemy.y][enemy.x]:
            continue

        is_invisible = getattr(enemy, 'is_invisible', False)
        show_shimmer = False
        if is_invisible:
            distance = max(abs(enemy.x - player.x), abs(enemy.y - player.y))
            if distance > 1:
                continue
            show_shimmer = True

        screen_x, screen_y = world_to_screen_func(enemy.x, enemy.y, vp_x, vp_y)

        try:
            is_animated = is_entity_animated_func(enemy)

            if curses.has_colors():
                if show_shimmer:
                    color = curses.color_pair(8) | curses.A_DIM
                    stdscr.addstr(screen_y, screen_x, '?', color)
                    continue

                if enemy.is_boss:
                    color = curses.color_pair(6) | curses.A_BOLD
                elif enemy.is_elite:
                    color = curses.color_pair(6)
                else:
                    color = get_element_color_func(enemy)

                if is_animated:
                    color = color | curses.A_REVERSE | curses.A_BOLD

                stdscr.addstr(screen_y, screen_x, enemy.symbol, color)
            else:
                if show_shimmer:
                    stdscr.addstr(screen_y, screen_x, '?', curses.A_DIM)
                    continue

                if enemy.is_boss:
                    symbol = '!'
                elif enemy.is_elite:
                    symbol = '*'
                else:
                    symbol = enemy.symbol
                attr = curses.A_REVERSE if is_animated else curses.A_NORMAL
                stdscr.addstr(screen_y, screen_x, symbol, attr)
        except curses.error:
            pass


def render_player(stdscr, player: 'Player', vp_x: int, vp_y: int, vp_w: int, vp_h: int,
                  is_in_viewport_func, world_to_screen_func, is_entity_animated_func):
    """Render the player."""
    if not is_in_viewport_func(player.x, player.y, vp_x, vp_y, vp_w, vp_h):
        return

    screen_x, screen_y = world_to_screen_func(player.x, player.y, vp_x, vp_y)

    try:
        is_animated = is_entity_animated_func(player)

        if curses.has_colors():
            color = curses.color_pair(2)

            if is_animated:
                color = color | curses.A_REVERSE | curses.A_BOLD

            stdscr.addstr(screen_y, screen_x, player.symbol, color)
        else:
            attr = curses.A_REVERSE if is_animated else curses.A_NORMAL
            stdscr.addstr(screen_y, screen_x, player.symbol, attr)
    except curses.error:
        pass


def render_damage_numbers(stdscr, dungeon: 'Dungeon', vp_x: int, vp_y: int, vp_w: int, vp_h: int,
                          damage_numbers: list, is_in_viewport_func, world_to_screen_func):
    """Render floating damage numbers above entities."""
    for dmg_num in damage_numbers:
        world_x, world_y = dmg_num['x'], dmg_num['y']

        if not (0 <= world_y < dungeon.height and 0 <= world_x < dungeon.width):
            continue
        if not dungeon.visible[world_y][world_x]:
            continue

        if not is_in_viewport_func(world_x, world_y, vp_x, vp_y, vp_w, vp_h):
            continue

        screen_x, screen_y = world_to_screen_func(world_x, world_y, vp_x, vp_y)

        try:
            text = dmg_num['text']
            if curses.has_colors():
                stdscr.addstr(screen_y, screen_x, text, curses.color_pair(3) | curses.A_BOLD)
            else:
                stdscr.addstr(screen_y, screen_x, text, curses.A_BOLD)
        except curses.error:
            pass


def render_direction_indicators(stdscr, dungeon: 'Dungeon', vp_x: int, vp_y: int, vp_w: int, vp_h: int,
                                 direction_indicators: list, is_in_viewport_func, world_to_screen_func):
    """Render attack direction arrows."""
    for indicator in direction_indicators:
        world_x, world_y = indicator['x'], indicator['y']

        if not (0 <= world_y < dungeon.height and 0 <= world_x < dungeon.width):
            continue
        if not dungeon.visible[world_y][world_x]:
            continue

        if not is_in_viewport_func(world_x, world_y, vp_x, vp_y, vp_w, vp_h):
            continue

        screen_x, screen_y = world_to_screen_func(world_x, world_y, vp_x, vp_y)

        try:
            char = indicator['char']
            if curses.has_colors():
                stdscr.addstr(screen_y, screen_x, char, curses.color_pair(2) | curses.A_BOLD)
            else:
                stdscr.addstr(screen_y, screen_x, char, curses.A_BOLD)
        except curses.error:
            pass
