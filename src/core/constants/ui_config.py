"""UI configuration constants."""
from .enums import ItemRarity

# FOV configuration
FOV_RADIUS = 8                  # Player can see 8 tiles in all directions
FOV_LIGHT_WALLS = True          # Whether walls block light

# Auto-save configuration
AUTO_SAVE_INTERVAL = 50  # Auto-save every N player turns

# UI configuration
MESSAGE_LOG_SIZE = 5
MESSAGE_AREA_HEIGHT = 7  # Height of bottom message area (1 border + 1 header + 5 messages)
SHORTCUT_BAR_HEIGHT = 1  # Single line for shortcut keys between dungeon and messages
STATS_PANEL_WIDTH = 25
BAR_WIDTH = 8  # Width of visual health/XP bars (must fit in panel: HP: + bar + space + ###/### = 4+8+1+7=20 < 21)

# Box-drawing characters for panel borders
BOX_TL = '╔'  # Top-left corner
BOX_TR = '╗'  # Top-right corner
BOX_BL = '╚'  # Bottom-left corner
BOX_BR = '╝'  # Bottom-right corner
BOX_H = '═'   # Horizontal line
BOX_V = '║'   # Vertical line
BOX_LEFT = '╠'  # Left T-junction
BOX_RIGHT = '╣'  # Right T-junction

# ASCII fallbacks for terminals without Unicode support
BOX_TL_ASCII = '+'
BOX_TR_ASCII = '+'
BOX_BL_ASCII = '+'
BOX_BR_ASCII = '+'
BOX_H_ASCII = '-'
BOX_V_ASCII = '|'
BOX_LEFT_ASCII = '+'
BOX_RIGHT_ASCII = '+'

# Item rarity color pairs (matches curses color pair indices)
ITEM_RARITY_COLORS = {
    ItemRarity.COMMON: 1,      # White (color_pair 1)
    ItemRarity.UNCOMMON: 5,    # Cyan (color_pair 5)
    ItemRarity.RARE: 11,       # Blue (color_pair 11, to be added)
    ItemRarity.EPIC: 6,        # Magenta (color_pair 6)
    ItemRarity.LEGENDARY: 2,   # Yellow/Gold (color_pair 2)
}
