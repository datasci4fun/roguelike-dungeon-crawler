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

# UI configuration
MESSAGE_LOG_SIZE = 5
STATS_PANEL_WIDTH = 25
