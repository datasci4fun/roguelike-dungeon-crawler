"""Boss configuration data."""
from .enums import BossType

# Boss configuration (8 bosses for 8 levels)
BOSS_STATS = {
    BossType.GOBLIN_KING: {
        'symbol': 'K',
        'name': 'Goblin King',
        'hp': 50,
        'damage': 5,
        'xp': 200,
        'level': 1,  # Stone Dungeon
        'abilities': ['summon_goblins', 'war_cry'],
        'description': 'A crowned goblin wielding a bloodied mace',
    },
    BossType.FROST_GIANT: {
        'symbol': 'F',
        'name': 'Frost Giant',
        'hp': 80,
        'damage': 12,
        'xp': 300,
        'level': 5,  # Ice Cavern
        'abilities': ['ice_blast', 'freeze_ground'],
        'description': 'A towering giant encased in eternal ice',
    },
    BossType.SPIDER_QUEEN: {
        'symbol': 'S',
        'name': 'Spider Queen',
        'hp': 70,
        'damage': 10,
        'xp': 400,
        'level': 3,  # Forest Depths
        'abilities': ['web_trap', 'poison_bite', 'summon_spiders'],
        'description': 'A massive arachnid matriarch dripping with venom',
    },
    BossType.FLAME_LORD: {
        'symbol': 'Φ',
        'name': 'Flame Lord',
        'hp': 100,
        'damage': 15,
        'xp': 500,
        'level': 7,  # Volcanic Depths
        'abilities': ['fire_breath', 'lava_pool', 'inferno'],
        'description': 'A being of pure fire born from the volcanic depths',
    },
    BossType.REGENT: {
        'symbol': 'R',
        'name': 'The Regent',
        'hp': 95,
        'damage': 13,
        'xp': 550,
        'level': 4,  # Mirror Valdris
        'abilities': ['royal_decree', 'summon_guard', 'counterfeit_crown'],
        'description': 'A monarch who never was, wearing a crown of stolen memories',
    },
    BossType.RAT_KING: {
        'symbol': 'r',  # Lowercase to distinguish from Goblin King's 'K'
        'name': 'Rat King',
        'hp': 65,
        'damage': 9,
        'xp': 200,
        'level': 2,  # Sewers
        'abilities': ['summon_swarm', 'plague_bite', 'burrow'],
        'description': 'A grotesque fusion of rats bound by diseased flesh',
    },
    BossType.ARCANE_KEEPER: {
        'symbol': 'A',
        'name': 'Arcane Keeper',
        'hp': 80,
        'damage': 14,
        'xp': 800,
        'level': 6,  # Ancient Library
        'abilities': ['arcane_bolt', 'teleport'],
        'description': 'A spectral guardian of forbidden knowledge',
    },
    BossType.DRAGON_EMPEROR: {
        'symbol': 'E',
        'name': 'Dragon Emperor',
        'hp': 200,
        'damage': 20,
        'xp': 1500,
        'level': 8,  # Crystal Cave
        'abilities': ['fire_breath', 'tail_sweep', 'dragon_fear'],
        'description': 'The ancient dragon lord guarding the ultimate treasure',
    },
}

# Map dungeon levels to boss types (8 levels)
# Aligned with zone system: Stone, Sewers, Forest, Valdris, Ice, Library, Volcanic, Crystal
LEVEL_BOSS_MAP = {
    1: BossType.GOBLIN_KING,      # Stone Dungeon (prison warden)
    2: BossType.RAT_KING,         # Sewers (plague carrier)
    3: BossType.SPIDER_QUEEN,     # Forest Depths (nature's curse)
    4: BossType.REGENT,           # Mirror Valdris (counterfeit monarch)
    5: BossType.FROST_GIANT,      # Ice Cavern (frozen experiment)
    6: BossType.ARCANE_KEEPER,    # Ancient Library (knowledge guardian)
    7: BossType.FLAME_LORD,       # Volcanic Depths (forge master)
    8: BossType.DRAGON_EMPEROR,   # Crystal Cave (dragon's hoard)
}

# Boss loot tables (guaranteed drops)
BOSS_LOOT = {
    BossType.GOBLIN_KING: ['iron_sword', 'chain_mail'],
    BossType.RAT_KING: ['plague_blade', 'rat_king_crown'],
    BossType.SPIDER_QUEEN: ['spider_silk_armor', 'venom_dagger'],
    BossType.REGENT: ['royal_scepter', 'counterfeit_crown'],
    BossType.FROST_GIANT: ['frost_axe', 'ice_shield'],
    BossType.ARCANE_KEEPER: ['teleport_scroll', 'teleport_scroll', 'strength_potion'],
    BossType.FLAME_LORD: ['flame_sword', 'fire_resist_ring'],
    BossType.DRAGON_EMPEROR: ['dragon_slayer', 'dragon_scale'],
}

# Boss chase range (larger than normal enemies)
BOSS_CHASE_RANGE = 12
