"""Arena templates for v6.0 tactical battle mode.

Templates are data-driven definitions of battle arenas, keyed by
(DungeonTheme, bucket) where bucket is 'default' or 'boss'.

Arena sizes:
- Regular: 9x7
- Boss: 11x9

Tile legend:
- '.' = FLOOR (walkable)
- '#' = WALL (blocking)
- 'O' = OBSTACLE (blocking, destructible in future)
- '~' = LAVA hazard
- '=' = ICE hazard
- '!' = POISON_GAS hazard
- '≈' = DEEP_WATER hazard
- 'P' = Player spawn region (compile to '.')
- 'E' = Enemy spawn region (compile to '.')
- 'R' = Reinforcement entry edge (compile to '.')

Templates define layout + spawn regions. compile_template() converts
spawn markers to floor tiles and returns spawn coordinates.
"""
import random
from dataclasses import dataclass, field
from typing import Dict, List, Tuple, Optional, Any
from enum import Enum

from ..core.constants import DungeonTheme


# Arena dimensions
REGULAR_ARENA_WIDTH = 9
REGULAR_ARENA_HEIGHT = 7
BOSS_ARENA_WIDTH = 11
BOSS_ARENA_HEIGHT = 9


class ArenaBucket(Enum):
    """Arena template categories."""
    DEFAULT = "default"
    BOSS = "boss"


@dataclass
class ArenaTemplate:
    """
    A template for generating battle arenas.

    Attributes:
        width: Arena width in tiles
        height: Arena height in tiles
        layout: 2D list of tile characters
        player_spawn: List of (x, y) coordinates for player spawn region
        enemy_spawn: List of (x, y) coordinates for enemy spawn region
        reinforcement_edges: List of (x, y) coordinates where reinforcements enter
        hazard_density: Probability of adding random hazards (0.0-1.0)
        description: Human-readable description
    """
    width: int
    height: int
    layout: List[str]
    player_spawn: List[Tuple[int, int]] = field(default_factory=list)
    enemy_spawn: List[Tuple[int, int]] = field(default_factory=list)
    reinforcement_edges: List[Tuple[int, int]] = field(default_factory=list)
    hazard_density: float = 0.0
    description: str = ""


# =============================================================================
# Template Definitions - Regular Arenas (9x7)
# =============================================================================

# Stone Dungeon (Floor 1) - Basic rectangular arena
STONE_DEFAULT = ArenaTemplate(
    width=9, height=7,
    layout=[
        "#########",
        "#EE.E.EE#",
        "#.......#",
        "#...O...#",
        "#.......#",
        "#..PPP..#",
        "#########",
    ],
    description="Stone dungeon - basic training arena",
)

# Sewers (Floor 2) - Water channels
SEWER_DEFAULT = ArenaTemplate(
    width=9, height=7,
    layout=[
        "#########",
        "#EE.≈.EE#",
        "#..≈≈≈..#",
        "#.≈...≈.#",
        "#..≈≈≈..#",
        "#PP.≈.PP#",
        "#########",
    ],
    hazard_density=0.1,
    description="Sewer arena - water channels slow movement",
)

# Forest Depths (Floor 3) - Tree obstacles
FOREST_DEFAULT = ArenaTemplate(
    width=9, height=7,
    layout=[
        "#########",
        "#E.O.O.E#",
        "#.O...O.#",
        "#...O...#",
        "#.O...O.#",
        "#P.O.O.P#",
        "#########",
    ],
    description="Forest arena - scattered tree obstacles",
)

# Mirror Valdris / Crypt (Floor 4) - Pillared hall
CRYPT_DEFAULT = ArenaTemplate(
    width=9, height=7,
    layout=[
        "#########",
        "#E.O.O.E#",
        "#.......#",
        "#.O...O.#",
        "#.......#",
        "#P.O.O.P#",
        "#########",
    ],
    description="Crypt arena - pillared memorial hall",
)

# Ice Cavern (Floor 5) - Ice patches
ICE_DEFAULT = ArenaTemplate(
    width=9, height=7,
    layout=[
        "#########",
        "#EE===EE#",
        "#.=...=.#",
        "#...O...#",
        "#.=...=.#",
        "#PP===PP#",
        "#########",
    ],
    hazard_density=0.15,
    description="Ice cavern arena - slippery ice patches",
)

# Ancient Library (Floor 6) - Bookshelf corridors
LIBRARY_DEFAULT = ArenaTemplate(
    width=9, height=7,
    layout=[
        "#########",
        "#E.#.#.E#",
        "#.......#",
        "#.#...#.#",
        "#.......#",
        "#P.#.#.P#",
        "#########",
    ],
    description="Library arena - bookshelf maze",
)

# Volcanic Depths (Floor 7) - Lava pools
VOLCANIC_DEFAULT = ArenaTemplate(
    width=9, height=7,
    layout=[
        "#########",
        "#EE.~.EE#",
        "#..~~~..#",
        "#.~...~.#",
        "#..~~~..#",
        "#PP.~.PP#",
        "#########",
    ],
    hazard_density=0.2,
    description="Volcanic arena - deadly lava pools",
)

# Crystal Cave (Floor 8) - Crystal formations
CRYSTAL_DEFAULT = ArenaTemplate(
    width=9, height=7,
    layout=[
        "#########",
        "#E.OOO.E#",
        "#.O...O.#",
        "#O.....O#",
        "#.O...O.#",
        "#P.OOO.P#",
        "#########",
    ],
    description="Crystal cave arena - crystal formations",
)


# =============================================================================
# Template Definitions - Boss Arenas (11x9)
# =============================================================================

# Goblin King (Floor 1) - Throne room
STONE_BOSS = ArenaTemplate(
    width=11, height=9,
    layout=[
        "###########",
        "#....E....#",
        "#.O.....O.#",
        "#....O....#",
        "#.........#",
        "#.O.....O.#",
        "#.........#",
        "#...PPP...#",
        "###########",
    ],
    description="Goblin King's throne room",
)

# Rat King (Floor 2) - Flooded chamber
SEWER_BOSS = ArenaTemplate(
    width=11, height=9,
    layout=[
        "###########",
        "#≈≈..E..≈≈#",
        "#≈.......≈#",
        "#...≈≈≈...#",
        "#.≈.....≈.#",
        "#...≈≈≈...#",
        "#≈.......≈#",
        "#≈≈.PPP.≈≈#",
        "###########",
    ],
    hazard_density=0.15,
    description="Rat King's flooded lair",
)

# Spider Queen (Floor 3) - Web-covered den
FOREST_BOSS = ArenaTemplate(
    width=11, height=9,
    layout=[
        "###########",
        "#O...E...O#",
        "#.O.....O.#",
        "#..O...O..#",
        "#.........#",
        "#..O...O..#",
        "#.O.....O.#",
        "#O..PPP..O#",
        "###########",
    ],
    description="Spider Queen's web-covered den",
)

# The Regent (Floor 4) - Mirrored throne
CRYPT_BOSS = ArenaTemplate(
    width=11, height=9,
    layout=[
        "###########",
        "#..O.E.O..#",
        "#.O.....O.#",
        "#O.......O#",
        "#....O....#",
        "#O.......O#",
        "#.O.....O.#",
        "#..O.P.O..#",
        "###########",
    ],
    description="The Regent's mirrored throne room",
)

# Frost Giant (Floor 5) - Frozen arena
ICE_BOSS = ArenaTemplate(
    width=11, height=9,
    layout=[
        "###########",
        "#===.E.===#",
        "#=.......=#",
        "#...===...#",
        "#.=.....=.#",
        "#...===...#",
        "#=.......=#",
        "#===PPP===#",
        "###########",
    ],
    hazard_density=0.2,
    description="Frost Giant's frozen arena",
)

# Arcane Keeper (Floor 6) - Circular library
LIBRARY_BOSS = ArenaTemplate(
    width=11, height=9,
    layout=[
        "###########",
        "#.#..E..#.#",
        "#...#.#...#",
        "#.#.....#.#",
        "#....O....#",
        "#.#.....#.#",
        "#...#.#...#",
        "#.#.PPP.#.#",
        "###########",
    ],
    description="Arcane Keeper's circular library",
)

# Flame Lord (Floor 7) - Lava-ringed platform
VOLCANIC_BOSS = ArenaTemplate(
    width=11, height=9,
    layout=[
        "###########",
        "#~~~.E.~~~#",
        "#~.......~#",
        "#~..~~~..~#",
        "#...~.~...#",
        "#~..~~~..~#",
        "#~.......~#",
        "#~~~PPP~~~#",
        "###########",
    ],
    hazard_density=0.25,
    description="Flame Lord's lava platform",
)

# Dragon Emperor (Floor 8) - Crystal throne (11x11 for final boss)
CRYSTAL_BOSS = ArenaTemplate(
    width=11, height=11,
    layout=[
        "###########",
        "#O..O.O..O#",
        "#....E....#",
        "#.O.....O.#",
        "#..O...O..#",
        "#.........#",
        "#..O...O..#",
        "#.O.....O.#",
        "#.........#",
        "#O..PPP..O#",
        "###########",
    ],
    description="Dragon Emperor's crystal throne",
)


# =============================================================================
# Template Registry
# =============================================================================

TEMPLATES: Dict[Tuple[DungeonTheme, ArenaBucket], ArenaTemplate] = {
    # Regular arenas
    (DungeonTheme.STONE, ArenaBucket.DEFAULT): STONE_DEFAULT,
    (DungeonTheme.SEWER, ArenaBucket.DEFAULT): SEWER_DEFAULT,
    (DungeonTheme.FOREST, ArenaBucket.DEFAULT): FOREST_DEFAULT,
    (DungeonTheme.CRYPT, ArenaBucket.DEFAULT): CRYPT_DEFAULT,
    (DungeonTheme.ICE, ArenaBucket.DEFAULT): ICE_DEFAULT,
    (DungeonTheme.LIBRARY, ArenaBucket.DEFAULT): LIBRARY_DEFAULT,
    (DungeonTheme.VOLCANIC, ArenaBucket.DEFAULT): VOLCANIC_DEFAULT,
    (DungeonTheme.CRYSTAL, ArenaBucket.DEFAULT): CRYSTAL_DEFAULT,

    # Boss arenas
    (DungeonTheme.STONE, ArenaBucket.BOSS): STONE_BOSS,
    (DungeonTheme.SEWER, ArenaBucket.BOSS): SEWER_BOSS,
    (DungeonTheme.FOREST, ArenaBucket.BOSS): FOREST_BOSS,
    (DungeonTheme.CRYPT, ArenaBucket.BOSS): CRYPT_BOSS,
    (DungeonTheme.ICE, ArenaBucket.BOSS): ICE_BOSS,
    (DungeonTheme.LIBRARY, ArenaBucket.BOSS): LIBRARY_BOSS,
    (DungeonTheme.VOLCANIC, ArenaBucket.BOSS): VOLCANIC_BOSS,
    (DungeonTheme.CRYSTAL, ArenaBucket.BOSS): CRYSTAL_BOSS,
}


# =============================================================================
# Helper Functions
# =============================================================================

def pick_template(
    theme: DungeonTheme,
    zone_id: Optional[str],
    is_boss: bool,
    rng: random.Random = None
) -> ArenaTemplate:
    """
    Select an arena template based on context.

    Args:
        theme: Current dungeon theme/biome
        zone_id: Optional zone override (for future zone-specific arenas)
        is_boss: Whether this is a boss encounter
        rng: Random number generator (for future template variants)

    Returns:
        Selected ArenaTemplate
    """
    bucket = ArenaBucket.BOSS if is_boss else ArenaBucket.DEFAULT

    # Future: Check for zone-specific override
    # if zone_id and (theme, zone_id) in ZONE_TEMPLATES:
    #     return ZONE_TEMPLATES[(theme, zone_id)]

    template = TEMPLATES.get((theme, bucket))

    # Fallback to STONE if theme not found
    if template is None:
        template = TEMPLATES.get((DungeonTheme.STONE, bucket))

    # Ultimate fallback
    if template is None:
        template = STONE_DEFAULT

    return template


def compile_template(
    template: ArenaTemplate,
    rng: random.Random = None,
    seed: int = None
) -> Dict[str, Any]:
    """
    Compile a template into concrete arena data.

    Converts spawn markers (P, E, R) to floor tiles and extracts
    spawn coordinates.

    Args:
        template: The ArenaTemplate to compile
        rng: Random number generator for hazard placement
        seed: Seed for deterministic generation

    Returns:
        Dict with:
        - 'tiles': 2D list of tile characters (spawn markers → '.')
        - 'width': Arena width
        - 'height': Arena height
        - 'player_spawn': List of (x, y) for player placement
        - 'enemy_spawn': List of (x, y) for enemy placement
        - 'reinforcement_edges': List of (x, y) for reinforcement entry
    """
    if rng is None:
        rng = random.Random(seed)

    tiles = []
    player_spawn = []
    enemy_spawn = []
    reinforcement_edges = []

    for y, row in enumerate(template.layout):
        tile_row = []
        for x, char in enumerate(row):
            if char == 'P':
                # Player spawn region
                tile_row.append('.')
                player_spawn.append((x, y))
            elif char == 'E':
                # Enemy spawn region
                tile_row.append('.')
                enemy_spawn.append((x, y))
            elif char == 'R':
                # Reinforcement entry edge
                tile_row.append('.')
                reinforcement_edges.append((x, y))
            else:
                tile_row.append(char)
        tiles.append(tile_row)

    # Add reinforcement edges along arena borders (excluding corners)
    # These are the tiles just inside the walls where reinforcements can spawn
    if not reinforcement_edges:
        # Top edge (excluding corners)
        for x in range(2, template.width - 2):
            if tiles[1][x] == '.':
                reinforcement_edges.append((x, 1))
        # Left and right edges
        for y in range(2, template.height - 2):
            if tiles[y][1] == '.':
                reinforcement_edges.append((1, y))
            if tiles[y][template.width - 2] == '.':
                reinforcement_edges.append((template.width - 2, y))

    return {
        'tiles': tiles,
        'width': template.width,
        'height': template.height,
        'player_spawn': player_spawn,
        'enemy_spawn': enemy_spawn,
        'reinforcement_edges': reinforcement_edges,
        'hazard_density': template.hazard_density,
        'description': template.description,
    }


def generate_deterministic_seed(
    dungeon_seed: int,
    floor: int,
    zone_id: Optional[str],
    encounter_index: int,
    enemy_signature: str
) -> int:
    """
    Generate a deterministic seed for arena generation.

    Ensures the same encounter always generates the same arena.

    Args:
        dungeon_seed: The dungeon's master seed
        floor: Current floor number
        zone_id: Zone identifier (or empty string)
        encounter_index: Nth encounter on this floor
        enemy_signature: String identifying enemies involved

    Returns:
        Deterministic seed integer
    """
    # Combine all factors into a reproducible hash
    seed_str = f"{dungeon_seed}:{floor}:{zone_id or ''}:{encounter_index}:{enemy_signature}"
    return hash(seed_str) & 0x7FFFFFFF  # Ensure positive 32-bit int
