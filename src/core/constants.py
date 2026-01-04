"""Game constants and configuration."""
from enum import Enum, auto


class TileType(Enum):
    """Types of tiles in the dungeon."""
    WALL = '#'
    FLOOR = '.'
    EMPTY = ' '
    STAIRS_DOWN = '>'
    STAIRS_UP = '<'
    # v4.0 new tiles
    BREAKABLE_WALL = '░'   # Can be broken to reveal secret rooms
    DOOR_LOCKED = '+'      # Requires key to open
    DOOR_UNLOCKED = '/'    # Open door
    TRAP_HIDDEN = '.'      # Hidden trap (looks like floor)
    TRAP_VISIBLE = '^'     # Revealed trap
    LAVA = '~'             # Lava hazard
    ICE = '='              # Ice hazard
    POISON_GAS = '!'       # Poison gas hazard
    DEEP_WATER = '≈'       # Deep water hazard


class GameState(Enum):
    """Possible game states."""
    TITLE = auto()      # Title screen
    INTRO = auto()      # Story intro/prologue
    PLAYING = auto()
    DEAD = auto()
    VICTORY = auto()    # Player won the game
    QUIT = auto()


class UIMode(Enum):
    """UI screen modes (what screen is currently displayed)."""
    GAME = auto()       # Normal gameplay view
    INVENTORY = auto()  # Full-screen inventory
    CHARACTER = auto()  # Character stats screen
    HELP = auto()       # Help screen
    TITLE_MENU = auto() # Title screen menu
    READING = auto()    # Reading a lore item (scroll/book)
    DIALOG = auto()     # Confirmation dialog
    MESSAGE_LOG = auto() # Full message history screen


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
    # v4.0 new enemies
    NECROMANCER = auto()        # Ranged caster, summons undead (symbol: 'N')
    DEMON = auto()              # Aggressive melee, fire attacks (symbol: 'Δ')
    ASSASSIN = auto()           # Stealth enemy, backstab (symbol: 'a')
    FIRE_ELEMENTAL = auto()     # Fire element (symbol: 'F')
    ICE_ELEMENTAL = auto()      # Ice element (symbol: 'I')
    LIGHTNING_ELEMENTAL = auto() # Lightning element (symbol: 'Z')


class BossType(Enum):
    """Boss types, one per dungeon level."""
    GOBLIN_KING = auto()      # Level 1 - Stone Dungeon
    CAVE_TROLL = auto()       # Level 2 - Cave
    LICH_LORD = auto()        # Level 3 - Crypt
    ARCANE_KEEPER = auto()    # Level 4 - Library
    DRAGON_EMPEROR = auto()   # Level 5 - Treasury


class ItemRarity(Enum):
    """Item rarity levels for color coding."""
    COMMON = auto()    # White
    UNCOMMON = auto()  # Cyan
    RARE = auto()      # Blue
    EPIC = auto()      # Magenta
    LEGENDARY = auto() # Yellow/Gold


class EquipmentSlot(Enum):
    """Equipment slots for the player."""
    WEAPON = auto()
    ARMOR = auto()
    # v4.0 new slots
    OFF_HAND = auto()   # Shields
    RING = auto()       # Rings
    AMULET = auto()     # Amulets


class AIBehavior(Enum):
    """AI behavior types for enemies."""
    CHASE = auto()       # Standard pathfinding to player
    RANGED_KITE = auto() # Maintain distance, use ranged abilities
    AGGRESSIVE = auto()  # Rush player, ability spam
    STEALTH = auto()     # Invisibility, ambush attacks
    ELEMENTAL = auto()   # Element-based tactics


class StatusEffectType(Enum):
    """Types of status effects."""
    POISON = auto()   # DOT, stacks intensity
    BURN = auto()     # DOT, refreshes duration
    FREEZE = auto()   # Movement penalty
    STUN = auto()     # Skip turn


class TrapType(Enum):
    """Types of dungeon traps."""
    SPIKE = auto()    # Physical damage
    FIRE = auto()     # Fire damage + burn
    POISON = auto()   # Poison damage + poison effect
    ARROW = auto()    # Ranged physical damage


class HazardType(Enum):
    """Types of environmental hazards."""
    LAVA = auto()        # Continuous fire damage
    ICE = auto()         # Sliding movement
    POISON_GAS = auto()  # Poison effect, spreads
    DEEP_WATER = auto()  # Movement penalty, can drown


class ElementType(Enum):
    """Elemental types for enemies and effects."""
    NONE = auto()
    FIRE = auto()
    ICE = auto()
    LIGHTNING = auto()
    DARK = auto()  # For necromancer


class Race(Enum):
    """Player races with distinct stat modifiers and traits."""
    HUMAN = auto()
    ELF = auto()
    DWARF = auto()
    HALFLING = auto()
    ORC = auto()


class PlayerClass(Enum):
    """Player classes with abilities and stat modifiers."""
    WARRIOR = auto()
    MAGE = auto()
    ROGUE = auto()


# Race stat modifiers and special traits
RACE_STATS = {
    Race.HUMAN: {
        'name': 'Human',
        'description': 'Balanced and adaptable',
        'hp_modifier': 0,
        'atk_modifier': 0,
        'def_modifier': 0,
        'trait': 'adaptive',
        'trait_name': 'Adaptive',
        'trait_description': '+10% XP gain, +1 starting feat',
        'starts_with_feat': True,  # Humans choose 1 feat at character creation
    },
    Race.ELF: {
        'name': 'Elf',
        'description': 'Agile and perceptive',
        'hp_modifier': -2,
        'atk_modifier': 1,
        'def_modifier': 0,
        'trait': 'keen_sight',
        'trait_name': 'Keen Sight',
        'trait_description': '+2 vision range',
    },
    Race.DWARF: {
        'name': 'Dwarf',
        'description': 'Sturdy and resilient',
        'hp_modifier': 4,
        'atk_modifier': -1,
        'def_modifier': 2,
        'trait': 'poison_resist',
        'trait_name': 'Poison Resistance',
        'trait_description': '50% poison resistance',
    },
    Race.HALFLING: {
        'name': 'Halfling',
        'description': 'Lucky and nimble',
        'hp_modifier': -4,
        'atk_modifier': 0,
        'def_modifier': 0,
        'trait': 'lucky',
        'trait_name': 'Lucky',
        'trait_description': '15% dodge chance',
    },
    Race.ORC: {
        'name': 'Orc',
        'description': 'Powerful but reckless',
        'hp_modifier': 6,
        'atk_modifier': 2,
        'def_modifier': -1,
        'trait': 'rage',
        'trait_name': 'Rage',
        'trait_description': '+50% damage below 25% HP',
    },
}

# Class stat modifiers and abilities
CLASS_STATS = {
    PlayerClass.WARRIOR: {
        'name': 'Warrior',
        'description': 'Master of melee combat',
        'hp_modifier': 5,
        'atk_modifier': 1,
        'def_modifier': 1,
        'active_abilities': ['power_strike', 'shield_wall'],
        'passive_abilities': ['combat_mastery'],
    },
    PlayerClass.MAGE: {
        'name': 'Mage',
        'description': 'Wielder of arcane power',
        'hp_modifier': -3,
        'atk_modifier': -1,
        'def_modifier': 0,
        'active_abilities': ['fireball', 'frost_nova'],
        'passive_abilities': ['mana_shield'],
    },
    PlayerClass.ROGUE: {
        'name': 'Rogue',
        'description': 'Silent and deadly',
        'hp_modifier': 0,
        'atk_modifier': 2,
        'def_modifier': -1,
        'active_abilities': ['backstab', 'smoke_bomb'],
        'passive_abilities': ['critical_strike'],
    },
}


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
    # v4.0 new enemies
    EnemyType.NECROMANCER: {
        'symbol': 'N',
        'name': 'Necromancer',
        'hp': 25,
        'damage': 8,
        'xp': 40,
        'weight': 10,
        'min_level': 3,  # Only spawns on levels 3+
        'max_level': 5,
        'ai_type': AIBehavior.RANGED_KITE,
        'element': ElementType.DARK,
        'abilities': ['raise_skeleton', 'dark_bolt'],
    },
    EnemyType.DEMON: {
        'symbol': 'Δ',
        'name': 'Demon',
        'hp': 45,
        'damage': 16,
        'xp': 60,
        'weight': 6,
        'min_level': 4,
        'max_level': 5,
        'ai_type': AIBehavior.AGGRESSIVE,
        'element': ElementType.FIRE,
        'abilities': ['fire_strike'],
        'resistances': {'fire': 0.5},  # 50% fire resistance
    },
    EnemyType.ASSASSIN: {
        'symbol': 'a',
        'name': 'Assassin',
        'hp': 20,
        'damage': 14,
        'xp': 35,
        'weight': 12,
        'min_level': 2,
        'max_level': 5,
        'ai_type': AIBehavior.STEALTH,
        'abilities': ['backstab', 'vanish'],
    },
    EnemyType.FIRE_ELEMENTAL: {
        'symbol': 'F',
        'name': 'Fire Elemental',
        'hp': 30,
        'damage': 12,
        'xp': 45,
        'weight': 8,
        'min_level': 3,
        'max_level': 5,
        'ai_type': AIBehavior.ELEMENTAL,
        'element': ElementType.FIRE,
        'abilities': ['fire_bolt'],
        'resistances': {'fire': 1.0},  # Immune to fire
    },
    EnemyType.ICE_ELEMENTAL: {
        'symbol': 'I',
        'name': 'Ice Elemental',
        'hp': 30,
        'damage': 10,
        'xp': 45,
        'weight': 8,
        'min_level': 3,
        'max_level': 5,
        'ai_type': AIBehavior.ELEMENTAL,
        'element': ElementType.ICE,
        'abilities': ['ice_shard'],
        'resistances': {'ice': 1.0},  # Immune to ice
    },
    EnemyType.LIGHTNING_ELEMENTAL: {
        'symbol': 'Z',
        'name': 'Lightning Elemental',
        'hp': 25,
        'damage': 14,
        'xp': 50,
        'weight': 6,
        'min_level': 4,
        'max_level': 5,
        'ai_type': AIBehavior.ELEMENTAL,
        'element': ElementType.LIGHTNING,
        'abilities': ['chain_lightning'],
        'resistances': {'lightning': 1.0},  # Immune to lightning
    },
}

# Boss configuration
BOSS_STATS = {
    BossType.GOBLIN_KING: {
        'symbol': 'K',
        'name': 'Goblin King',
        'hp': 50,
        'damage': 5,
        'xp': 200,
        'level': 1,
        'abilities': ['summon_goblins', 'war_cry'],
        'description': 'A crowned goblin wielding a bloodied mace',
    },
    BossType.CAVE_TROLL: {
        'symbol': 'T',
        'name': 'Cave Troll',
        'hp': 80,
        'damage': 8,
        'xp': 300,
        'level': 2,
        'abilities': ['ground_slam', 'regenerate'],
        'description': 'A massive troll with stone-like skin',
    },
    BossType.LICH_LORD: {
        'symbol': 'L',
        'name': 'Lich Lord',
        'hp': 70,
        'damage': 10,
        'xp': 400,
        'level': 3,
        'abilities': ['raise_dead', 'life_drain'],
        'description': 'An ancient undead sorcerer crackling with dark energy',
    },
    BossType.ARCANE_KEEPER: {
        'symbol': 'A',
        'name': 'Arcane Keeper',
        'hp': 60,
        'damage': 12,
        'xp': 500,
        'level': 4,
        'abilities': ['arcane_bolt', 'teleport'],
        'description': 'A spectral guardian of forbidden knowledge',
    },
    BossType.DRAGON_EMPEROR: {
        'symbol': 'E',
        'name': 'Dragon Emperor',
        'hp': 150,
        'damage': 15,
        'xp': 1000,
        'level': 5,
        'abilities': ['fire_breath', 'tail_sweep'],
        'description': 'The ancient dragon lord guarding the ultimate treasure',
    },
}

# Map dungeon levels to boss types
LEVEL_BOSS_MAP = {
    1: BossType.GOBLIN_KING,
    2: BossType.CAVE_TROLL,
    3: BossType.LICH_LORD,
    4: BossType.ARCANE_KEEPER,
    5: BossType.DRAGON_EMPEROR,
}

# Boss loot tables (guaranteed drops)
BOSS_LOOT = {
    BossType.GOBLIN_KING: ['iron_sword', 'chain_mail'],
    BossType.CAVE_TROLL: ['battle_axe', 'strength_potion', 'strength_potion'],
    BossType.LICH_LORD: ['plate_armor', 'health_potion', 'health_potion'],
    BossType.ARCANE_KEEPER: ['teleport_scroll', 'teleport_scroll', 'strength_potion'],
    BossType.DRAGON_EMPEROR: ['dragon_slayer', 'dragon_scale'],
}

# Boss chase range (larger than normal enemies)
BOSS_CHASE_RANGE = 12

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
    ItemRarity.LEGENDARY: 2,   # Yellow/Gold (color_pair 2)
}

# v4.0 Trap configuration
TRAP_STATS = {
    TrapType.SPIKE: {
        'name': 'Spike Trap',
        'symbol_hidden': '.',
        'symbol_visible': '^',
        'damage_min': 5,
        'damage_max': 10,
        'cooldown': 3,  # Turns before trap resets
        'effect': None,
        'detection_dc': 12,  # Difficulty to detect
    },
    TrapType.FIRE: {
        'name': 'Fire Trap',
        'symbol_hidden': '.',
        'symbol_visible': '^',
        'damage_min': 3,
        'damage_max': 3,
        'cooldown': 5,
        'effect': StatusEffectType.BURN,
        'detection_dc': 14,
    },
    TrapType.POISON: {
        'name': 'Poison Trap',
        'symbol_hidden': '.',
        'symbol_visible': '^',
        'damage_min': 2,
        'damage_max': 2,
        'cooldown': 4,
        'effect': StatusEffectType.POISON,
        'detection_dc': 16,
    },
    TrapType.ARROW: {
        'name': 'Arrow Trap',
        'symbol_hidden': '.',
        'symbol_visible': '^',
        'damage_min': 8,
        'damage_max': 8,
        'cooldown': 2,
        'effect': None,
        'detection_dc': 10,
    },
}

# v4.0 Hazard configuration
HAZARD_STATS = {
    HazardType.LAVA: {
        'name': 'Lava',
        'symbol': '~',
        'damage_per_turn': 5,
        'effect': StatusEffectType.BURN,
        'blocks_movement': False,
        'color': 2,  # Yellow/Orange
    },
    HazardType.ICE: {
        'name': 'Ice',
        'symbol': '=',
        'damage_per_turn': 0,
        'effect': None,
        'blocks_movement': False,
        'causes_slide': True,  # Player slides when walking on ice
        'color': 5,  # Cyan
    },
    HazardType.POISON_GAS: {
        'name': 'Poison Gas',
        'symbol': '!',
        'damage_per_turn': 0,
        'effect': StatusEffectType.POISON,
        'blocks_movement': False,
        'spreads': True,  # Gas can spread each turn
        'color': 3,  # Green
    },
    HazardType.DEEP_WATER: {
        'name': 'Deep Water',
        'symbol': '≈',
        'damage_per_turn': 0,
        'effect': None,
        'blocks_movement': False,
        'slows_movement': True,  # Takes 2 turns to cross
        'drown_chance': 0.1,  # 10% chance per turn if HP < 25%
        'color': 4,  # Blue
    },
}

# v4.0 Status effect configuration
STATUS_EFFECT_STATS = {
    StatusEffectType.POISON: {
        'name': 'Poison',
        'damage_per_turn': 2,
        'duration': 5,
        'max_stacks': 3,  # Can stack up to 3x damage
        'stacking': 'intensity',  # Stacks increase damage
        'color': 3,  # Green
        'message': 'You feel sick from the poison!',
    },
    StatusEffectType.BURN: {
        'name': 'Burning',
        'damage_per_turn': 3,
        'duration': 3,
        'max_stacks': 1,
        'stacking': 'refresh',  # Refreshes duration instead of stacking
        'color': 2,  # Yellow/Red
        'message': 'You are burning!',
    },
    StatusEffectType.FREEZE: {
        'name': 'Frozen',
        'damage_per_turn': 0,
        'duration': 3,
        'max_stacks': 1,
        'stacking': 'none',  # Cannot stack
        'movement_penalty': 0.5,  # 50% slower movement
        'color': 5,  # Cyan
        'message': 'You are frozen and moving slowly!',
    },
    StatusEffectType.STUN: {
        'name': 'Stunned',
        'damage_per_turn': 0,
        'duration': 1,
        'max_stacks': 1,
        'stacking': 'none',
        'skip_turn': True,  # Entity skips their turn
        'color': 2,  # Yellow
        'message': 'You are stunned and cannot act!',
    },
}

# v4.0 Dungeon generation config
TRAPS_PER_LEVEL = (3, 6)  # Min, max traps per dungeon level
SECRET_ROOMS_PER_LEVEL = (0, 2)  # Min, max secret rooms per level
LOCKED_DOORS_PER_LEVEL = (1, 3)  # Min, max locked doors per level
