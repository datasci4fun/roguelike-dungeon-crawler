"""Combat mechanics configuration - elements, traps, hazards, status effects."""
from .enums import ElementType, TrapType, HazardType, StatusEffectType

# Element cycling configuration
ELEMENT_CYCLE_TURNS = 5  # Turns between element changes
ELEMENT_CYCLE_ORDER = [ElementType.FIRE, ElementType.ICE, ElementType.LIGHTNING]

# Element weaknesses (attacker element -> defender weakness)
# If attacking with an element that the defender is weak to, deal bonus damage
ELEMENT_WEAKNESSES = {
    ElementType.FIRE: ElementType.ICE,       # Fire is weak to Ice
    ElementType.ICE: ElementType.FIRE,       # Ice is weak to Fire
    ElementType.LIGHTNING: ElementType.DARK, # Lightning is weak to Dark
    ElementType.DARK: ElementType.LIGHTNING, # Dark is weak to Lightning
}

# Damage multiplier when hitting weakness
WEAKNESS_DAMAGE_MULTIPLIER = 1.5

# Element colors for visual indicators (curses color pair indices)
ELEMENT_COLORS = {
    ElementType.NONE: 7,       # White
    ElementType.FIRE: 3,       # Red
    ElementType.ICE: 8,        # Cyan
    ElementType.LIGHTNING: 4,  # Yellow
    ElementType.DARK: 6,       # Magenta
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
        'causes_slide': True,  # v6.5.1 low-01: Ice slide mechanic enabled
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
