"""Game enums - all type definitions."""
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
    BATTLE = auto()     # Tactical battle mode (v6.0)


class DungeonTheme(Enum):
    """Visual themes for dungeon levels (8 biomes).

    Floor-to-theme mapping is in LEVEL_THEMES below.
    """
    STONE = auto()     # Stone Dungeon
    ICE = auto()       # Ice Cavern
    FOREST = auto()    # Forest Depths
    VOLCANIC = auto()  # Volcanic Depths
    CRYPT = auto()     # Mirror Valdris (crypt palette)
    SEWER = auto()     # Sewers of Valdris
    LIBRARY = auto()   # Ancient Library
    CRYSTAL = auto()   # Crystal Cave


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
    # v5.5 thematic floor enemies
    RAT = auto()                # Sewers - common (symbol: 'r')
    PLAGUE_RAT = auto()         # Sewers - diseased (symbol: 'p')
    SPIDERLING = auto()         # Forest - scout (symbol: 'x')
    WEBWEAVER = auto()          # Forest - intelligent (symbol: 'w')
    OATHBOUND_GUARD = auto()    # Mirror Valdris - armored undead (symbol: 'G')
    COURT_SCRIBE = auto()       # Mirror Valdris - spectral (symbol: 'q')
    ANIMATED_TOME = auto()      # Library - knowledge threat (symbol: 't')
    CRYSTAL_SENTINEL = auto()   # Crystal Cave - guardian (symbol: 'C')
    # v6.5 spice enemies (rare variants, 1 per floor)
    SHADE = auto()              # F1 Stone - ghostly prisoner remnant (symbol: 'S')
    BILE_LURKER = auto()        # F2 Sewers - toxic slime creature (symbol: 'B')
    THORNLING = auto()          # F3 Forest - animated thorny plant (symbol: 'h')
    DOPPELGANGER = auto()       # F4 Mirror - mimics player (symbol: '?')
    FROST_WISP = auto()         # F5 Ice - frozen spirit (symbol: 'f')
    INK_PHANTOM = auto()        # F6 Library - living manuscript (symbol: 'i')
    EMBER_SPRITE = auto()       # F7 Volcanic - mischievous fire spirit (symbol: 'e')
    PRISM_WATCHER = auto()      # F8 Crystal - crystalline eye creature (symbol: 'P')


class BossType(Enum):
    """Boss types, one per dungeon level (8 levels).

    Aligned with zone system floor themes:
    1: Stone Dungeon, 2: Sewers, 3: Forest Depths, 4: Mirror Valdris,
    5: Ice Cavern, 6: Ancient Library, 7: Volcanic Depths, 8: Crystal Cave
    """
    GOBLIN_KING = auto()      # Level 1 - Stone Dungeon (prison warden)
    RAT_KING = auto()         # Level 2 - Sewers (plague carrier)
    SPIDER_QUEEN = auto()     # Level 3 - Forest Depths (nature's curse)
    REGENT = auto()           # Level 4 - Mirror Valdris (counterfeit monarch)
    FROST_GIANT = auto()      # Level 5 - Ice Cavern (frozen experiment)
    ARCANE_KEEPER = auto()    # Level 6 - Ancient Library (knowledge guardian)
    FLAME_LORD = auto()       # Level 7 - Volcanic Depths (forge master)
    DRAGON_EMPEROR = auto()   # Level 8 - Crystal Cave (final guardian)


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
    CLERIC = auto()
