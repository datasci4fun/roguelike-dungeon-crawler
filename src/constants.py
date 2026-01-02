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


class EnemyType(Enum):
    """Types of enemies with different stats and appearance."""
    GOBLIN = auto()    # Weak, common (symbol: 'g')
    SKELETON = auto()  # Undead, medium (symbol: 's')
    ORC = auto()       # Strong, common (symbol: 'o')
    WRAITH = auto()    # Fast, rare (symbol: 'W')
    TROLL = auto()     # Very strong, rare (symbol: 'T')
    DRAGON = auto()    # Boss-tier, very rare (symbol: 'D')


class ItemRarity(Enum):
    """Item rarity levels for color coding."""
    COMMON = auto()    # White
    UNCOMMON = auto()  # Cyan
    RARE = auto()      # Blue
    EPIC = auto()      # Magenta


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

# Enemy type configuration
ENEMY_STATS = {
    EnemyType.GOBLIN: {
        'symbol': 'g',
        'name': 'Goblin',
        'hp': 6,
        'damage': 1,
        'xp': 10,
        'weight': 40,  # Spawn weight (higher = more common)
    },
    EnemyType.SKELETON: {
        'symbol': 's',
        'name': 'Skeleton',
        'hp': 8,
        'damage': 2,
        'xp': 15,
        'weight': 30,
    },
    EnemyType.ORC: {
        'symbol': 'o',
        'name': 'Orc',
        'hp': 12,
        'damage': 3,
        'xp': 20,
        'weight': 15,
    },
    EnemyType.WRAITH: {
        'symbol': 'W',
        'name': 'Wraith',
        'hp': 10,
        'damage': 4,
        'xp': 25,
        'weight': 8,
    },
    EnemyType.TROLL: {
        'symbol': 'T',
        'name': 'Troll',
        'hp': 20,
        'damage': 5,
        'xp': 35,
        'weight': 5,
    },
    EnemyType.DRAGON: {
        'symbol': 'D',
        'name': 'Dragon',
        'hp': 50,
        'damage': 10,
        'xp': 100,
        'weight': 2,  # Very rare
    },
}

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

# Item rarity color pairs (matches curses color pair indices)
ITEM_RARITY_COLORS = {
    ItemRarity.COMMON: 1,      # White (color_pair 1)
    ItemRarity.UNCOMMON: 5,    # Cyan (color_pair 5)
    ItemRarity.RARE: 11,       # Blue (color_pair 11, to be added)
    ItemRarity.EPIC: 6,        # Magenta (color_pair 6)
}
