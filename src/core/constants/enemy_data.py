"""Enemy configuration data."""
from .enums import EnemyType, AIBehavior, ElementType

# Elite enemy configuration
ELITE_SPAWN_RATE = 0.2          # 20% chance for elite enemy
ELITE_HP_MULTIPLIER = 2         # Elites have 2x HP (16)
ELITE_DAMAGE_MULTIPLIER = 2     # Elites deal 2x damage (4)
ELITE_XP_MULTIPLIER = 2         # Elites award 2x XP (30)
ELITE_SYMBOL = 'E'              # Same visual symbol, but different color

# Enemy type configuration
ENEMY_STATS = {
    # Base enemies with proper level restrictions
    EnemyType.GOBLIN: {
        'symbol': 'g',
        'name': 'Goblin',
        'hp': 6,
        'damage': 1,
        'xp': 10,
        'weight': 40,
        'min_level': 1,
        'max_level': 3,  # Early floors only
    },
    EnemyType.SKELETON: {
        'symbol': 's',
        'name': 'Skeleton',
        'hp': 8,
        'damage': 2,
        'xp': 15,
        'weight': 30,
        'min_level': 1,
        'max_level': 6,  # Common undead throughout
    },
    EnemyType.ORC: {
        'symbol': 'o',
        'name': 'Orc',
        'hp': 12,
        'damage': 3,
        'xp': 20,
        'weight': 15,
        'min_level': 2,
        'max_level': 5,  # Mid floors
    },
    EnemyType.WRAITH: {
        'symbol': 'W',
        'name': 'Wraith',
        'hp': 10,
        'damage': 4,
        'xp': 25,
        'weight': 8,
        'min_level': 3,
        'max_level': 8,  # Mid to late floors
    },
    EnemyType.TROLL: {
        'symbol': 'T',
        'name': 'Troll',
        'hp': 20,
        'damage': 5,
        'xp': 35,
        'weight': 5,
        'min_level': 5,
        'max_level': 8,  # Late floors only
    },
    EnemyType.DRAGON: {
        'symbol': 'D',
        'name': 'Dragon',
        'hp': 50,
        'damage': 10,
        'xp': 100,
        'weight': 2,
        'min_level': 8,
        'max_level': 8,  # Final floor only
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
        'max_level': 8,
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
        'max_level': 8,
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
        'max_level': 8,
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
        'max_level': 8,
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
        'max_level': 8,
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
        'max_level': 8,
        'ai_type': AIBehavior.ELEMENTAL,
        'element': ElementType.LIGHTNING,
        'abilities': ['chain_lightning'],
        'resistances': {'lightning': 1.0},  # Immune to lightning
    },
    # v5.5 thematic floor enemies
    EnemyType.RAT: {
        'symbol': 'r',
        'name': 'Rat',
        'hp': 5,
        'damage': 1,
        'xp': 8,
        'weight': 40,
        'min_level': 2,
        'max_level': 3,  # Sewers + Forest
        'ai_type': AIBehavior.AGGRESSIVE,
    },
    EnemyType.PLAGUE_RAT: {
        'symbol': 'p',
        'name': 'Plague Rat',
        'hp': 7,
        'damage': 2,
        'xp': 12,
        'weight': 22,
        'min_level': 2,
        'max_level': 4,  # Sewers + Forest + Valdris
        'ai_type': AIBehavior.AGGRESSIVE,
        'resistances': {'poison': 0.5},
    },
    EnemyType.SPIDERLING: {
        'symbol': 'x',
        'name': 'Spiderling',
        'hp': 6,
        'damage': 2,
        'xp': 12,
        'weight': 36,
        'min_level': 3,
        'max_level': 4,  # Forest + Valdris
        'ai_type': AIBehavior.AGGRESSIVE,
    },
    EnemyType.WEBWEAVER: {
        'symbol': 'w',
        'name': 'Webweaver',
        'hp': 9,
        'damage': 3,
        'xp': 18,
        'weight': 18,
        'min_level': 3,
        'max_level': 5,  # Forest + Valdris + Ice
        'ai_type': AIBehavior.CHASE,
    },
    EnemyType.OATHBOUND_GUARD: {
        'symbol': 'G',
        'name': 'Oathbound Guard',
        'hp': 16,
        'damage': 5,
        'xp': 35,
        'weight': 16,
        'min_level': 4,
        'max_level': 6,  # Valdris + Ice + Library
        'ai_type': AIBehavior.CHASE,
        'element': ElementType.DARK,
        'resistances': {'poison': 0.25},
    },
    EnemyType.COURT_SCRIBE: {
        'symbol': 'q',
        'name': 'Court Scribe',
        'hp': 10,
        'damage': 4,
        'xp': 28,
        'weight': 14,
        'min_level': 4,
        'max_level': 6,  # Valdris + Ice + Library
        'ai_type': AIBehavior.RANGED_KITE,
    },
    EnemyType.ANIMATED_TOME: {
        'symbol': 't',
        'name': 'Animated Tome',
        'hp': 14,
        'damage': 5,
        'xp': 40,
        'weight': 16,
        'min_level': 6,
        'max_level': 7,  # Library + Volcanic
        'ai_type': AIBehavior.AGGRESSIVE,
        'element': ElementType.DARK,
        'resistances': {'poison': 0.5},
    },
    EnemyType.CRYSTAL_SENTINEL: {
        'symbol': 'C',
        'name': 'Crystal Sentinel',
        'hp': 22,
        'damage': 8,
        'xp': 70,
        'weight': 14,
        'min_level': 8,
        'max_level': 8,  # Crystal Cave only
        'ai_type': AIBehavior.CHASE,
        'element': ElementType.LIGHTNING,
        'resistances': {'ice': 0.25, 'fire': 0.25},
    },
    # v6.5 spice enemies (rare variants, 1 per floor at 5-10% spawn rate)
    EnemyType.SHADE: {
        'symbol': 'S',
        'name': 'Shade',
        'hp': 5,
        'damage': 3,
        'xp': 20,
        'weight': 8,
        'min_level': 1,
        'max_level': 1,
        'ai_type': AIBehavior.STEALTH,
        'element': ElementType.DARK,
        'resistances': {'physical': 0.5},  # Partially incorporeal
    },
    EnemyType.BILE_LURKER: {
        'symbol': 'B',
        'name': 'Bile Lurker',
        'hp': 12,
        'damage': 2,
        'xp': 22,
        'weight': 8,
        'min_level': 2,
        'max_level': 2,
        'ai_type': AIBehavior.AGGRESSIVE,
        'abilities': ['poison_spit'],
        'resistances': {'poison': 1.0},  # Immune to poison
    },
    EnemyType.THORNLING: {
        'symbol': 'h',
        'name': 'Thornling',
        'hp': 8,
        'damage': 4,
        'xp': 25,
        'weight': 8,
        'min_level': 3,
        'max_level': 3,
        'ai_type': AIBehavior.CHASE,
        'abilities': ['thorn_burst'],  # Damages attacker on hit
    },
    EnemyType.DOPPELGANGER: {
        'symbol': '?',
        'name': 'Doppelganger',
        'hp': 15,
        'damage': 5,
        'xp': 40,
        'weight': 6,
        'min_level': 4,
        'max_level': 4,
        'ai_type': AIBehavior.CHASE,
        'element': ElementType.DARK,
    },
    EnemyType.FROST_WISP: {
        'symbol': 'f',
        'name': 'Frost Wisp',
        'hp': 6,
        'damage': 6,
        'xp': 35,
        'weight': 8,
        'min_level': 5,
        'max_level': 5,
        'ai_type': AIBehavior.RANGED_KITE,
        'element': ElementType.ICE,
        'abilities': ['ice_shard'],
        'resistances': {'ice': 1.0, 'fire': -0.5},  # Immune ice, weak fire
    },
    EnemyType.INK_PHANTOM: {
        'symbol': 'i',
        'name': 'Ink Phantom',
        'hp': 10,
        'damage': 7,
        'xp': 45,
        'weight': 8,
        'min_level': 6,
        'max_level': 6,
        'ai_type': AIBehavior.STEALTH,
        'element': ElementType.DARK,
        'abilities': ['vanish'],
    },
    EnemyType.EMBER_SPRITE: {
        'symbol': 'e',
        'name': 'Ember Sprite',
        'hp': 8,
        'damage': 8,
        'xp': 50,
        'weight': 8,
        'min_level': 7,
        'max_level': 7,
        'ai_type': AIBehavior.RANGED_KITE,
        'element': ElementType.FIRE,
        'abilities': ['fire_bolt'],
        'resistances': {'fire': 1.0, 'ice': -0.5},  # Immune fire, weak ice
    },
    EnemyType.PRISM_WATCHER: {
        'symbol': 'P',
        'name': 'Prism Watcher',
        'hp': 18,
        'damage': 9,
        'xp': 65,
        'weight': 6,
        'min_level': 8,
        'max_level': 8,
        'ai_type': AIBehavior.ELEMENTAL,
        'element': ElementType.LIGHTNING,
        'abilities': ['chain_lightning'],
        'resistances': {'lightning': 0.75},
    },
}

# Floor-by-floor enemy rosters (canonical, theme-first)
# Spawn system uses these pools first, then applies zone weighting.
FLOOR_ENEMY_POOLS = {
    # 1 — Stone Dungeon (MEMORY)
    1: [
        (EnemyType.GOBLIN, 50),
        (EnemyType.SKELETON, 28),
        (EnemyType.ORC, 10),
        (EnemyType.WRAITH, 5),
        (EnemyType.SHADE, 7),             # Spice: ghostly prisoner remnant
    ],

    # 2 — Sewers (CIRCULATION)
    2: [
        (EnemyType.RAT, 42),
        (EnemyType.PLAGUE_RAT, 23),
        (EnemyType.ORC, 13),
        (EnemyType.ASSASSIN, 10),
        (EnemyType.SKELETON, 5),
        (EnemyType.BILE_LURKER, 7),       # Spice: toxic slime creature
    ],

    # 3 — Forest Depths (GROWTH)
    3: [
        (EnemyType.SPIDERLING, 42),
        (EnemyType.WEBWEAVER, 23),
        (EnemyType.RAT, 10),              # strays / carriers
        (EnemyType.ASSASSIN, 10),         # erasure specialist intrusion
        (EnemyType.WRAITH, 8),
        (EnemyType.THORNLING, 7),         # Spice: animated thorny plant
    ],

    # 4 — Mirror Valdris (LEGITIMACY)
    4: [
        (EnemyType.OATHBOUND_GUARD, 32),
        (EnemyType.SKELETON, 23),
        (EnemyType.COURT_SCRIBE, 15),
        (EnemyType.ASSASSIN, 13),
        (EnemyType.WRAITH, 10),
        (EnemyType.DOPPELGANGER, 7),      # Spice: mimics player
    ],

    # 5 — Ice Cavern (STASIS)
    5: [
        (EnemyType.ICE_ELEMENTAL, 28),
        (EnemyType.SKELETON, 18),
        (EnemyType.WRAITH, 18),
        (EnemyType.OATHBOUND_GUARD, 13),  # oath-dead bleed through
        (EnemyType.TROLL, 15),
        (EnemyType.FROST_WISP, 8),        # Spice: frozen spirit
    ],

    # 6 — Ancient Library (COGNITION)
    6: [
        (EnemyType.ANIMATED_TOME, 28),
        (EnemyType.NECROMANCER, 23),
        (EnemyType.COURT_SCRIBE, 15),     # records made hostile
        (EnemyType.ASSASSIN, 13),
        (EnemyType.WRAITH, 13),
        (EnemyType.INK_PHANTOM, 8),       # Spice: living manuscript
    ],

    # 7 — Volcanic Depths (TRANSFORMATION)
    7: [
        (EnemyType.FIRE_ELEMENTAL, 28),
        (EnemyType.DEMON, 18),
        (EnemyType.TROLL, 18),
        (EnemyType.NECROMANCER, 15),
        (EnemyType.ANIMATED_TOME, 13),    # burned knowledge walking
        (EnemyType.EMBER_SPRITE, 8),      # Spice: mischievous fire spirit
    ],

    # 8 — Crystal Cave (INTEGRATION)
    # Dragon weight reduced to 8 for "fair-spicy" - still dangerous but not run-ending
    8: [
        (EnemyType.CRYSTAL_SENTINEL, 34),  # Primary threat
        (EnemyType.LIGHTNING_ELEMENTAL, 18),
        (EnemyType.DRAGON, 8),             # Rare but terrifying
        (EnemyType.DEMON, 15),
        (EnemyType.WRAITH, 18),
        (EnemyType.PRISM_WATCHER, 7),     # Spice: crystalline eye creature
    ],
}
