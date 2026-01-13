"""Color and status indicator utilities for the renderer.

Provides color pair selection based on game state.
"""
import curses
import time
from typing import List, Tuple, TYPE_CHECKING

if TYPE_CHECKING:
    from ..entities import Player, Enemy


def get_element_color(enemy: 'Enemy') -> int:
    """Get the curses color pair for an enemy based on their current element."""
    from ..core.constants import ElementType, ELEMENT_COLORS

    # Get current element (for cycling elemental enemies)
    current_element = getattr(enemy, 'current_element', None)
    if current_element is None:
        current_element = getattr(enemy, 'element', ElementType.NONE)

    # Map element to color pair
    color_pair = ELEMENT_COLORS.get(current_element, 3)  # Default to red (color pair 3)
    return curses.color_pair(color_pair)


def get_status_indicators(player: 'Player') -> List[Tuple[str, int]]:
    """
    Get status indicators for the player based on their current state.

    Returns:
        List of (status_text, color_pair) tuples
    """
    from ..core.constants import PLAYER_ATTACK_DAMAGE, ATK_GAIN_PER_LEVEL, StatusEffectType

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
    expected_attack = PLAYER_ATTACK_DAMAGE + (player.level - 1) * ATK_GAIN_PER_LEVEL
    if player.attack_damage > expected_attack:
        if curses.has_colors():
            indicators.append(("[STRONG]", curses.color_pair(4) | curses.A_BOLD))
        else:
            indicators.append(("[STRONG]", curses.A_BOLD))

    # Status effects
    if hasattr(player, 'status_effects') and player.status_effects:
        for effect in player.status_effects.effects:
            if effect.effect_type == StatusEffectType.POISON:
                if curses.has_colors():
                    indicators.append(("[POISON]", curses.color_pair(4)))
                else:
                    indicators.append(("[POISON]", curses.A_NORMAL))
            elif effect.effect_type == StatusEffectType.BURN:
                if curses.has_colors():
                    indicators.append(("[BURN]", curses.color_pair(3)))
                else:
                    indicators.append(("[BURN]", curses.A_NORMAL))
            elif effect.effect_type == StatusEffectType.FREEZE:
                if curses.has_colors():
                    indicators.append(("[FREEZE]", curses.color_pair(5)))
                else:
                    indicators.append(("[FREEZE]", curses.A_NORMAL))
            elif effect.effect_type == StatusEffectType.STUN:
                if curses.has_colors():
                    indicators.append(("[STUN]", curses.color_pair(2)))
                else:
                    indicators.append(("[STUN]", curses.A_NORMAL))

    return indicators


def get_message_color(message: str) -> int:
    """
    Determine the color pair and attributes for a message based on its content.

    Returns:
        Color pair with optional BOLD attribute
    """
    if not curses.has_colors():
        return curses.A_NORMAL

    msg_lower = message.lower()

    # Boss defeat messages (bright magenta + bold)
    if "defeated" in msg_lower and ("***" in message or "boss" in msg_lower):
        return curses.color_pair(6) | curses.A_BOLD

    # Boss ability messages (magenta)
    boss_keywords = [
        "summons", "slams", "breathes", "drains", "fires", "sweeps",
        "war cry", "regenerates", "raises", "teleports"
    ]
    if any(word in msg_lower for word in boss_keywords):
        return curses.color_pair(6)

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
    if "picked up" in msg_lower or "dropped" in msg_lower:
        return curses.color_pair(5)

    # Boss presence messages (magenta)
    if "powerful presence" in msg_lower or "awaits" in msg_lower:
        return curses.color_pair(6)

    # Default (white)
    return curses.color_pair(1)
