"""World and dungeon theme configuration."""
from .enums import DungeonTheme

# Dungeon configuration
DUNGEON_WIDTH = 80
DUNGEON_HEIGHT = 40
MIN_ROOM_SIZE = 4
MAX_ROOM_SIZE = 10
MAX_BSP_DEPTH = 4
MAX_DUNGEON_LEVELS = 8

# Entity symbols
PLAYER_SYMBOL = '@'
ENEMY_SYMBOL = 'E'

# Dungeon theme visual tiles (8 biomes)
THEME_TILES = {
    DungeonTheme.STONE: {
        'wall': '#',
        'floor': '.',
        'description': 'Stone Dungeon'
    },
    DungeonTheme.ICE: {
        'wall': '▓',
        'floor': '·',
        'description': 'Ice Cavern'
    },
    DungeonTheme.FOREST: {
        'wall': '♣',
        'floor': '"',
        'description': 'Forest Depths'
    },
    DungeonTheme.VOLCANIC: {
        'wall': '▒',
        'floor': ',',
        'description': 'Volcanic Depths'
    },
    DungeonTheme.CRYPT: {
        'wall': '█',
        'floor': ',',
        'description': 'Ancient Crypt'
    },
    DungeonTheme.SEWER: {
        'wall': '▓',
        'floor': '.',
        'description': 'Sewer'
    },
    DungeonTheme.LIBRARY: {
        'wall': '║',
        'floor': '_',
        'description': 'Ancient Library'
    },
    DungeonTheme.CRYSTAL: {
        'wall': '◊',
        'floor': '·',
        'description': 'Crystal Cave'
    },
}

# ASCII fallbacks for theme tiles (when Unicode not supported)
THEME_TILES_ASCII = {
    DungeonTheme.STONE: {'wall': '#', 'floor': '.'},
    DungeonTheme.ICE: {'wall': '#', 'floor': '.'},
    DungeonTheme.FOREST: {'wall': '#', 'floor': '"'},
    DungeonTheme.VOLCANIC: {'wall': '#', 'floor': ','},
    DungeonTheme.CRYPT: {'wall': '#', 'floor': ','},
    DungeonTheme.SEWER: {'wall': '#', 'floor': '.'},
    DungeonTheme.LIBRARY: {'wall': '|', 'floor': '_'},
    DungeonTheme.CRYSTAL: {'wall': '#', 'floor': '.'},
}

# Map dungeon levels to themes (8 levels)
# Canonical order matches LEVEL_BOSS_MAP and STATE.md
LEVEL_THEMES = {
    1: DungeonTheme.STONE,      # Stone Dungeon (Goblin King)
    2: DungeonTheme.SEWER,      # Sewers of Valdris (Rat King)
    3: DungeonTheme.FOREST,     # Forest Depths (Spider Queen)
    4: DungeonTheme.CRYPT,      # Mirror Valdris - ruined palace (Regent)
    5: DungeonTheme.ICE,        # Ice Cavern (Frost Giant)
    6: DungeonTheme.LIBRARY,    # Ancient Library (Arcane Keeper)
    7: DungeonTheme.VOLCANIC,   # Volcanic Depths (Flame Lord)
    8: DungeonTheme.CRYSTAL,    # Crystal Cave (Dragon Emperor)
}

# Decoration characters for each theme
THEME_DECORATIONS = {
    DungeonTheme.STONE: ['Θ', '♪'],   # Pillars, braziers
    DungeonTheme.ICE: ['❄', '◇'],     # Icicles, crystals
    DungeonTheme.FOREST: ['♠', '¥'],  # Trees, mushrooms
    DungeonTheme.VOLCANIC: ['∆', '≡'], # Rocks, vents
    DungeonTheme.CRYPT: ['†', 'Ω'],   # Tombstones, statues
    DungeonTheme.SEWER: ['○', '='],   # Pipes, grates
    DungeonTheme.LIBRARY: ['╤', '║'], # Tables, shelves
    DungeonTheme.CRYSTAL: ['◇', '✦'], # Crystals, gems
}

# ASCII fallbacks for decorations
THEME_DECORATIONS_ASCII = {
    DungeonTheme.STONE: ['O', '^'],   # Pillars, braziers
    DungeonTheme.ICE: ['*', '<'],     # Icicles, crystals
    DungeonTheme.FOREST: ['T', 'm'],  # Trees, mushrooms
    DungeonTheme.VOLCANIC: ['^', '='], # Rocks, vents
    DungeonTheme.CRYPT: ['+', 'O'],   # Tombstones, statues
    DungeonTheme.SEWER: ['o', '='],   # Pipes, grates
    DungeonTheme.LIBRARY: ['=', '|'], # Tables, shelves
    DungeonTheme.CRYSTAL: ['<', '*'], # Crystals, gems
}

# Terrain features (walkable floor variations)
TERRAIN_WATER = '≈'
TERRAIN_WATER_ASCII = '~'
TERRAIN_BLOOD = 'ꕤ'
TERRAIN_BLOOD_ASCII = '%'
TERRAIN_GRASS = '"'
TERRAIN_MOSS = ':'
TERRAIN_LAVA = '~'
TERRAIN_ICE = '='

# Theme-specific terrain features
THEME_TERRAIN = {
    DungeonTheme.STONE: [],                              # No special terrain
    DungeonTheme.ICE: [TERRAIN_ICE],                     # Slippery ice
    DungeonTheme.FOREST: [TERRAIN_WATER, TERRAIN_GRASS], # Water, vegetation
    DungeonTheme.VOLCANIC: [TERRAIN_LAVA],               # Lava pools
    DungeonTheme.CRYPT: [],                              # Blood added on kills
    DungeonTheme.SEWER: [TERRAIN_WATER],                 # Sewer water
    DungeonTheme.LIBRARY: [],                            # Clean floors
    DungeonTheme.CRYSTAL: [],                            # Crystal floors
}

# Theme-specific torch counts (min, max) per level
THEME_TORCH_COUNTS = {
    DungeonTheme.STONE: (6, 10),      # Well-lit stone dungeon
    DungeonTheme.ICE: (2, 4),         # Cold, sparse lighting
    DungeonTheme.FOREST: (3, 5),      # Natural bioluminescence
    DungeonTheme.VOLCANIC: (4, 6),    # Lava glow
    DungeonTheme.CRYPT: (4, 6),       # Dim, atmospheric
    DungeonTheme.SEWER: (2, 4),       # Dark and damp
    DungeonTheme.LIBRARY: (8, 12),    # Bright for reading
    DungeonTheme.CRYSTAL: (8, 12),    # Crystal glow
}

# Default torch light properties
TORCH_DEFAULT_RADIUS = 5
TORCH_DEFAULT_INTENSITY = 1.0
