"""Core game module - game loop and constants."""
from .game import Game
from .engine import GameEngine
from .messages import GameMessage, MessageCategory, MessageImportance, MessageLog
from .events import (
    EventType, GameEvent, EventQueue,
    get_event_queue, reset_event_queue
)
from .commands import (
    Command, CommandType,
    MOVEMENT_COMMANDS, ITEM_COMMANDS, UI_OPEN_COMMANDS,
    INVENTORY_COMMANDS, SCROLL_COMMANDS,
    get_movement_delta, get_item_index
)
from .constants import (
    TileType, GameState, UIMode, DungeonTheme, RoomType, EnemyType,
    ItemRarity, EquipmentSlot,
    DUNGEON_WIDTH, DUNGEON_HEIGHT, MIN_ROOM_SIZE, MAX_ROOM_SIZE,
    MAX_BSP_DEPTH, MAX_DUNGEON_LEVELS,
    PLAYER_SYMBOL, ENEMY_SYMBOL,
    PLAYER_MAX_HEALTH, PLAYER_ATTACK_DAMAGE,
    ENEMY_MAX_HEALTH, ENEMY_ATTACK_DAMAGE, ENEMY_CHASE_RANGE,
    ELITE_SPAWN_RATE, ELITE_HP_MULTIPLIER, ELITE_DAMAGE_MULTIPLIER,
    ELITE_XP_MULTIPLIER, ELITE_SYMBOL, ENEMY_STATS,
    XP_PER_KILL, XP_BASE_REQUIREMENT, MAX_PLAYER_LEVEL,
    HP_GAIN_PER_LEVEL, ATK_GAIN_PER_LEVEL,
    FOV_RADIUS, FOV_LIGHT_WALLS,
    MESSAGE_LOG_SIZE, MESSAGE_AREA_HEIGHT, SHORTCUT_BAR_HEIGHT,
    STATS_PANEL_WIDTH, BAR_WIDTH,
    BOX_TL, BOX_TR, BOX_BL, BOX_BR, BOX_H, BOX_V, BOX_LEFT, BOX_RIGHT,
    BOX_TL_ASCII, BOX_TR_ASCII, BOX_BL_ASCII, BOX_BR_ASCII,
    BOX_H_ASCII, BOX_V_ASCII, BOX_LEFT_ASCII, BOX_RIGHT_ASCII,
    THEME_TILES, THEME_TILES_ASCII, LEVEL_THEMES,
    THEME_DECORATIONS, THEME_DECORATIONS_ASCII,
    TERRAIN_WATER, TERRAIN_WATER_ASCII, TERRAIN_BLOOD, TERRAIN_BLOOD_ASCII,
    TERRAIN_GRASS, TERRAIN_MOSS, THEME_TERRAIN,
    ITEM_RARITY_COLORS
)

__all__ = [
    'Game', 'TileType', 'GameState', 'UIMode', 'DungeonTheme', 'RoomType', 'EnemyType',
    'EventType', 'GameEvent', 'EventQueue', 'get_event_queue', 'reset_event_queue',
    'Command', 'CommandType', 'get_movement_delta', 'get_item_index'
]
