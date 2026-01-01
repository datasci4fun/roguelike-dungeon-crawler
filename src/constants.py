"""Game constants and configuration."""
from enum import Enum, auto


class TileType(Enum):
    """Types of tiles in the dungeon."""
    WALL = '#'
    FLOOR = '.'
    EMPTY = ' '
    STAIRS_DOWN = '>'
    STAIRS_UP = '<'


class GameState(Enum):
    """Possible game states."""
    PLAYING = auto()
    DEAD = auto()
    QUIT = auto()


class DungeonTheme(Enum):
    """Visual themes for dungeon levels."""
    STONE = auto()    # Classic stone dungeon
    CAVE = auto()     # Natural cave
    CRYPT = auto()    # Undead tomb
    LIBRARY = auto()  # Ancient library
    TREASURY = auto() # Treasure vault


class RoomType(Enum):
    """Types of rooms with different characteristics."""
    NORMAL = auto()      # Standard room
    LARGE_HALL = auto()  # 2x size room with pillars
    TREASURY = auto()    # Filled with loot
    SHRINE = auto()      # Center statue, guaranteed item
    BOSS_ROOM = auto()   # Largest room, special decorations


# Dungeon configuration
DUNGEON_WIDTH = 80
DUNGEON_HEIGHT = 40
MIN_ROOM_SIZE = 4
MAX_ROOM_SIZE = 10
MAX_BSP_DEPTH = 4
MAX_DUNGEON_LEVELS = 5

# Entity symbols
PLAYER_SYMBOL = '@'
ENEMY_SYMBOL = 'E'

# Combat configuration
PLAYER_MAX_HEALTH = 20
PLAYER_ATTACK_DAMAGE = 3

ENEMY_MAX_HEALTH = 8
ENEMY_ATTACK_DAMAGE = 2
ENEMY_CHASE_RANGE = 8

# Elite enemy configuration
ELITE_SPAWN_RATE = 0.2          # 20% chance for elite enemy
ELITE_HP_MULTIPLIER = 2         # Elites have 2x HP (16)
ELITE_DAMAGE_MULTIPLIER = 2     # Elites deal 2x damage (4)
ELITE_XP_MULTIPLIER = 2         # Elites award 2x XP (30)
ELITE_SYMBOL = 'E'              # Same visual symbol, but different color

# XP and Leveling configuration
XP_PER_KILL = 15                # XP awarded per enemy kill
XP_BASE_REQUIREMENT = 30        # Level 1→2 requires 30 XP (formula: level × 30)
MAX_PLAYER_LEVEL = 10           # Maximum player level

# Stat growth per level
HP_GAIN_PER_LEVEL = 10         # Max HP increase per level
ATK_GAIN_PER_LEVEL = 1         # Attack damage increase per level

# FOV configuration
FOV_RADIUS = 8                  # Player can see 8 tiles in all directions
FOV_LIGHT_WALLS = True          # Whether walls block light

# UI configuration
MESSAGE_LOG_SIZE = 5
STATS_PANEL_WIDTH = 25
BAR_WIDTH = 12  # Width of visual health/XP bars

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

# Dungeon theme visual tiles
THEME_TILES = {
    DungeonTheme.STONE: {
        'wall': '#',
        'floor': '.',
        'description': 'Stone Dungeon'
    },
    DungeonTheme.CAVE: {
        'wall': '█',
        'floor': '·',
        'description': 'Natural Cave'
    },
    DungeonTheme.CRYPT: {
        'wall': '▓',
        'floor': ',',
        'description': 'Ancient Crypt'
    },
    DungeonTheme.LIBRARY: {
        'wall': '║',
        'floor': '_',
        'description': 'Forgotten Library'
    },
    DungeonTheme.TREASURY: {
        'wall': '╬',
        'floor': '·',
        'description': 'Treasure Vault'
    },
}

# ASCII fallbacks for theme tiles (when Unicode not supported)
THEME_TILES_ASCII = {
    DungeonTheme.STONE: {'wall': '#', 'floor': '.'},
    DungeonTheme.CAVE: {'wall': '#', 'floor': '.'},
    DungeonTheme.CRYPT: {'wall': '#', 'floor': ','},
    DungeonTheme.LIBRARY: {'wall': '|', 'floor': '_'},
    DungeonTheme.TREASURY: {'wall': '+', 'floor': '.'},
}

# Map dungeon levels to themes
LEVEL_THEMES = {
    1: DungeonTheme.STONE,
    2: DungeonTheme.CAVE,
    3: DungeonTheme.CRYPT,
    4: DungeonTheme.LIBRARY,
    5: DungeonTheme.TREASURY,
}

# Decoration characters for each theme
THEME_DECORATIONS = {
    DungeonTheme.STONE: ['Θ', '♪'],  # Pillars, braziers
    DungeonTheme.CAVE: ['*', '"'],    # Rubble, moss
    DungeonTheme.CRYPT: ['†', 'Ω'],   # Tombstones, statues
    DungeonTheme.LIBRARY: ['╤', '║'], # Tables, shelves
    DungeonTheme.TREASURY: ['ß', 'Ω'], # Barrels, statues
}

# ASCII fallbacks for decorations
THEME_DECORATIONS_ASCII = {
    DungeonTheme.STONE: ['O', '^'],   # Pillars, braziers
    DungeonTheme.CAVE: ['*', '"'],    # Rubble, moss
    DungeonTheme.CRYPT: ['+', 'O'],   # Tombstones, statues
    DungeonTheme.LIBRARY: ['=', '|'], # Tables, shelves
    DungeonTheme.TREASURY: ['$', 'O'], # Barrels, statues
}

# Terrain features (walkable floor variations)
TERRAIN_WATER = '≈'
TERRAIN_WATER_ASCII = '~'
TERRAIN_BLOOD = 'ꕤ'
TERRAIN_BLOOD_ASCII = '%'
TERRAIN_GRASS = '"'
TERRAIN_MOSS = ':'

# Theme-specific terrain features
THEME_TERRAIN = {
    DungeonTheme.STONE: [],  # No special terrain
    DungeonTheme.CAVE: [TERRAIN_WATER, TERRAIN_GRASS],  # Water pools, moss
    DungeonTheme.CRYPT: [],  # Blood added dynamically when enemies die
    DungeonTheme.LIBRARY: [],  # No special terrain
    DungeonTheme.TREASURY: [TERRAIN_WATER],  # Water features
}
