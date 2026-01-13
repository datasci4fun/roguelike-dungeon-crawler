"""Battle actions and class kits for v6.0.4 tactical combat.

Defines the action system for battle mode:
- BattleAction enum for all possible actions
- Ability definitions per class
- Action resolution logic

Delegates to:
- battle_boss_abilities.py: Boss ability definitions
"""
from dataclasses import dataclass, field
from enum import Enum, auto
from typing import List, Optional, Dict, Any, Tuple, TYPE_CHECKING

if TYPE_CHECKING:
    from .battle_types import BattleState, BattleEntity


class BattleAction(Enum):
    """All possible battle actions."""
    # Universal
    MOVE = auto()           # Move to adjacent tile
    BASIC_ATTACK = auto()   # Basic melee/ranged attack
    WAIT = auto()           # Skip turn (end action)
    FLEE = auto()           # Attempt to flee battle
    USE_ITEM = auto()       # Use consumable item (v6.0.5)

    # Warrior abilities
    POWER_STRIKE = auto()   # Heavy damage, single target
    SHIELD_WALL = auto()    # Defensive stance, reduces damage taken

    # Mage abilities
    FIREBALL = auto()       # Ranged AoE damage
    FROST_NOVA = auto()     # AoE slow/freeze around self

    # Rogue abilities
    BACKSTAB = auto()       # Bonus damage from behind/stealth
    SMOKE_BOMB = auto()     # Create smoke, brief invisibility

    # Cleric abilities (if class exists)
    HEAL = auto()           # Restore HP to self or ally
    SMITE = auto()          # Holy damage, bonus vs undead

    # v6.2: Boss abilities - Regent (LEGITIMACY)
    ROYAL_DECREE = auto()      # Summon 1-2 oathbound guards
    SUMMON_GUARD = auto()      # Summon 1 guard
    COUNTERFEIT_CROWN = auto() # Stun/debuff player

    # v6.2: Boss abilities - Rat King (CIRCULATION)
    SUMMON_SWARM = auto()      # Summon rat minions
    PLAGUE_BITE = auto()       # Poison attack
    BURROW = auto()            # Reposition to safe tile

    # v6.2: Boss abilities - Spider Queen (GROWTH)
    WEB_TRAP = auto()          # Apply slow/freeze effect
    POISON_BITE = auto()       # Poison melee attack
    SUMMON_SPIDERS = auto()    # Summon spider minions

    # v6.2: Boss abilities - Frost Giant (STASIS)
    FREEZE_GROUND = auto()     # AoE freeze / create ice tiles
    ICE_BLAST = auto()         # Ranged AoE freeze

    # v6.2: Boss abilities - Arcane Keeper (COGNITION)
    ARCANE_BOLT = auto()       # Ranged magic attack
    TELEPORT = auto()          # Reposition to optimal tile

    # v6.2: Boss abilities - Flame Lord (TRANSFORMATION)
    LAVA_POOL = auto()         # Create lava hazard tiles
    INFERNO = auto()           # AoE burn around self
    FIRE_BREATH = auto()       # Cone/line fire attack

    # v6.2: Boss abilities - Dragon Emperor (INTEGRATION)
    DRAGON_FEAR = auto()       # AoE stun/debuff
    TAIL_SWEEP = auto()        # Multi-tile melee attack


@dataclass
class AbilityDef:
    """Definition of a battle ability."""
    action: BattleAction
    name: str
    description: str
    cooldown: int = 0           # Turns before can use again
    range: int = 1              # 0 = self, 1 = adjacent, 2+ = ranged
    damage_mult: float = 1.0    # Multiplier on base attack
    aoe_radius: int = 0         # 0 = single target
    effect: str = ""            # Special effect name (e.g., "burn", "slow")
    effect_duration: int = 0    # Turns the effect lasts
    self_buff: bool = False     # True if targets self


# Movement range in battle
BATTLE_MOVE_RANGE = 3

# Class ability definitions
WARRIOR_ABILITIES: List[AbilityDef] = [
    AbilityDef(
        action=BattleAction.BASIC_ATTACK,
        name="Attack",
        description="Basic melee attack",
        range=1,
        damage_mult=1.0,
    ),
    AbilityDef(
        action=BattleAction.POWER_STRIKE,
        name="Power Strike",
        description="Heavy blow dealing 1.5x damage",
        cooldown=2,
        range=1,
        damage_mult=1.5,
    ),
    AbilityDef(
        action=BattleAction.SHIELD_WALL,
        name="Shield Wall",
        description="Defensive stance, take 50% damage for 2 turns",
        cooldown=4,
        range=0,
        self_buff=True,
        effect="shield_wall",
        effect_duration=2,
    ),
]

MAGE_ABILITIES: List[AbilityDef] = [
    AbilityDef(
        action=BattleAction.BASIC_ATTACK,
        name="Staff Strike",
        description="Basic ranged attack",
        range=3,
        damage_mult=0.8,
    ),
    AbilityDef(
        action=BattleAction.FIREBALL,
        name="Fireball",
        description="Ranged fire attack, AoE burn",
        cooldown=3,
        range=4,
        damage_mult=1.2,
        aoe_radius=1,
        effect="burn",
        effect_duration=2,
    ),
    AbilityDef(
        action=BattleAction.FROST_NOVA,
        name="Frost Nova",
        description="Freeze enemies around you",
        cooldown=4,
        range=0,
        damage_mult=0.5,
        aoe_radius=2,
        effect="freeze",
        effect_duration=2,
    ),
]

ROGUE_ABILITIES: List[AbilityDef] = [
    AbilityDef(
        action=BattleAction.BASIC_ATTACK,
        name="Attack",
        description="Quick melee attack",
        range=1,
        damage_mult=0.9,
    ),
    AbilityDef(
        action=BattleAction.BACKSTAB,
        name="Backstab",
        description="2x damage from behind or while hidden",
        cooldown=2,
        range=1,
        damage_mult=2.0,  # Conditional - requires positioning
    ),
    AbilityDef(
        action=BattleAction.SMOKE_BOMB,
        name="Smoke Bomb",
        description="Become hidden for 2 turns",
        cooldown=5,
        range=0,
        self_buff=True,
        effect="hidden",
        effect_duration=2,
    ),
]

CLERIC_ABILITIES: List[AbilityDef] = [
    AbilityDef(
        action=BattleAction.BASIC_ATTACK,
        name="Holy Strike",
        description="Blessed melee attack",
        range=1,
        damage_mult=0.9,
    ),
    AbilityDef(
        action=BattleAction.HEAL,
        name="Heal",
        description="Restore 10 HP to self",
        cooldown=3,
        range=0,
        damage_mult=0,  # No damage, healing handled specially
        self_buff=True,
        effect="heal",  # Special effect handled in battle_manager
        effect_duration=0,
    ),
    AbilityDef(
        action=BattleAction.SMITE,
        name="Smite",
        description="Holy damage, 1.5x vs undead",
        cooldown=2,
        range=1,
        damage_mult=1.2,  # Base damage, bonus vs undead handled in battle_manager
    ),
]

# Default abilities for classes without specific kit
DEFAULT_ABILITIES: List[AbilityDef] = [
    AbilityDef(
        action=BattleAction.BASIC_ATTACK,
        name="Attack",
        description="Basic attack",
        range=1,
        damage_mult=1.0,
    ),
]


def get_class_abilities(player_class: str) -> List[AbilityDef]:
    """Get abilities for a player class."""
    class_map = {
        'WARRIOR': WARRIOR_ABILITIES,
        'MAGE': MAGE_ABILITIES,
        'ROGUE': ROGUE_ABILITIES,
        'CLERIC': CLERIC_ABILITIES,
    }
    return class_map.get(player_class.upper(), DEFAULT_ABILITIES)


@dataclass
class ActionResult:
    """Result of executing a battle action."""
    success: bool
    message: str
    damage_dealt: int = 0
    targets_hit: List[str] = field(default_factory=list)  # Entity IDs
    effect_applied: str = ""
    ended_turn: bool = True  # Whether this action ends the actor's turn


@dataclass
class StatusEffect:
    """A status effect on an entity."""
    name: str                   # Effect identifier (burn, slow, etc.)
    duration: int               # Remaining turns
    damage_per_tick: int = 0    # DOT damage at end of round
    defense_mod: float = 1.0    # Multiplier on defense (shield_wall = 2.0)
    speed_mod: float = 1.0      # Multiplier on movement (slow = 0.5)
    is_hidden: bool = False     # True if entity is invisible

    def to_dict(self) -> Dict[str, Any]:
        return {
            'name': self.name,
            'duration': self.duration,
            'damage_per_tick': self.damage_per_tick,
            'defense_mod': self.defense_mod,
            'speed_mod': self.speed_mod,
            'is_hidden': self.is_hidden,
        }

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'StatusEffect':
        return cls(
            name=data['name'],
            duration=data['duration'],
            damage_per_tick=data.get('damage_per_tick', 0),
            defense_mod=data.get('defense_mod', 1.0),
            speed_mod=data.get('speed_mod', 1.0),
            is_hidden=data.get('is_hidden', False),
        )


# Status effect templates
# Maps to core StatusEffectType names for consistency
STATUS_EFFECTS = {
    'burn': lambda: StatusEffect(name='burn', duration=2, damage_per_tick=3),
    'poison': lambda: StatusEffect(name='poison', duration=3, damage_per_tick=2),
    'freeze': lambda: StatusEffect(name='freeze', duration=2, speed_mod=0.5),
    'stun': lambda: StatusEffect(name='stun', duration=1, speed_mod=0.0),  # Can't move
    'shield_wall': lambda: StatusEffect(name='shield_wall', duration=2, defense_mod=2.0),
    'hidden': lambda: StatusEffect(name='hidden', duration=2, is_hidden=True),
    'heal': lambda: StatusEffect(name='heal', duration=0),  # Instant effect, handled specially
}


def create_status_effect(name: str, duration: int = None) -> Optional[StatusEffect]:
    """Create a status effect by name."""
    if name not in STATUS_EFFECTS:
        return None
    effect = STATUS_EFFECTS[name]()
    if duration is not None:
        effect.duration = duration
    return effect


def manhattan_distance(x1: int, y1: int, x2: int, y2: int) -> int:
    """Calculate Manhattan distance between two points."""
    return abs(x1 - x2) + abs(y1 - y2)


def get_tiles_in_range(
    center_x: int,
    center_y: int,
    radius: int,
    battle: 'BattleState'
) -> List[Tuple[int, int]]:
    """Get all tiles within radius of center (Manhattan distance)."""
    tiles = []
    for y in range(battle.arena_height):
        for x in range(battle.arena_width):
            if manhattan_distance(center_x, center_y, x, y) <= radius:
                tiles.append((x, y))
    return tiles


def get_valid_move_tiles(
    entity: 'BattleEntity',
    battle: 'BattleState',
    max_range: int = BATTLE_MOVE_RANGE
) -> List[Tuple[int, int]]:
    """Get all tiles an entity can move to."""
    valid = []

    # Check speed modifier from status effects
    speed_mod = 1.0
    for effect_name in entity.status_effects:
        effect = create_status_effect(effect_name)
        if effect:
            speed_mod *= effect.speed_mod

    # Adjust range based on speed
    effective_range = max(1, int(max_range * speed_mod))

    for dy in range(-effective_range, effective_range + 1):
        for dx in range(-effective_range, effective_range + 1):
            if dx == 0 and dy == 0:
                continue

            nx, ny = entity.arena_x + dx, entity.arena_y + dy

            # Check Manhattan distance
            if manhattan_distance(entity.arena_x, entity.arena_y, nx, ny) > effective_range:
                continue

            # Check bounds and walkability
            if not battle.is_tile_walkable(nx, ny):
                continue

            # Check not occupied
            if battle.get_entity_at(nx, ny) is not None:
                continue

            valid.append((nx, ny))

    return valid


def get_valid_attack_targets(
    attacker: 'BattleEntity',
    battle: 'BattleState',
    ability: AbilityDef
) -> List['BattleEntity']:
    """Get all valid targets for an attack ability."""
    targets = []

    # Self-buff abilities target self
    if ability.self_buff:
        return [attacker]

    # Get potential targets based on attacker type
    if attacker.is_player:
        potential = battle.get_living_enemies()
    else:
        potential = [battle.player] if battle.player and battle.player.hp > 0 else []

    for target in potential:
        dist = manhattan_distance(
            attacker.arena_x, attacker.arena_y,
            target.arena_x, target.arena_y
        )
        if dist <= ability.range:
            targets.append(target)

    return targets


# Re-export boss abilities for backwards compatibility
# NOTE: Import at end of file to avoid circular import
from .battle_boss_abilities import (  # noqa: E402
    REGENT_ABILITIES,
    RAT_KING_ABILITIES,
    SPIDER_QUEEN_ABILITIES,
    FROST_GIANT_ABILITIES,
    ARCANE_KEEPER_ABILITIES,
    FLAME_LORD_ABILITIES,
    DRAGON_EMPEROR_ABILITIES,
    get_boss_abilities,
)
