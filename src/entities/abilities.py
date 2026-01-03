"""Boss ability system for special attacks and effects."""
from dataclasses import dataclass
from enum import Enum, auto
from typing import TYPE_CHECKING, List, Tuple, Optional, Callable
import random

if TYPE_CHECKING:
    from .entities import Enemy, Player
    from ..world.dungeon import Dungeon
    from ..managers.entity_manager import EntityManager


class AbilityType(Enum):
    """Types of boss abilities."""
    AOE_ATTACK = auto()      # Damage in radius
    SUMMON = auto()          # Spawn minions
    BUFF = auto()            # Self-buff (rage, regenerate)
    RANGED = auto()          # Ranged attack
    SPECIAL = auto()         # Unique mechanics (teleport, drain)


@dataclass
class BossAbility:
    """Definition of a boss ability."""
    name: str
    ability_type: AbilityType
    cooldown: int           # Turns between uses
    damage: int             # Damage if applicable (negative = heal)
    range: int              # 0 = self, 1+ = tiles from boss
    description: str


# All boss abilities
BOSS_ABILITIES = {
    # Goblin King abilities
    'summon_goblins': BossAbility(
        name='Summon Goblins',
        ability_type=AbilityType.SUMMON,
        cooldown=5,
        damage=0,
        range=0,
        description='Summons 2-3 goblin minions',
    ),
    'war_cry': BossAbility(
        name='War Cry',
        ability_type=AbilityType.BUFF,
        cooldown=8,
        damage=0,
        range=0,
        description='Increases damage by 50% for 3 turns',
    ),

    # Cave Troll abilities
    'ground_slam': BossAbility(
        name='Ground Slam',
        ability_type=AbilityType.AOE_ATTACK,
        cooldown=4,
        damage=8,
        range=2,
        description='Slams the ground, damaging all nearby',
    ),
    'regenerate': BossAbility(
        name='Regenerate',
        ability_type=AbilityType.BUFF,
        cooldown=0,  # Passive, always active when low
        damage=-5,   # Heals 5 HP
        range=0,
        description='Regenerates health when below 50%',
    ),

    # Lich Lord abilities
    'raise_dead': BossAbility(
        name='Raise Dead',
        ability_type=AbilityType.SUMMON,
        cooldown=6,
        damage=0,
        range=0,
        description='Raises 2 skeleton minions',
    ),
    'life_drain': BossAbility(
        name='Life Drain',
        ability_type=AbilityType.SPECIAL,
        cooldown=3,
        damage=6,
        range=3,
        description='Drains life from the player, healing self',
    ),

    # Arcane Keeper abilities
    'arcane_bolt': BossAbility(
        name='Arcane Bolt',
        ability_type=AbilityType.RANGED,
        cooldown=2,
        damage=8,
        range=5,
        description='Fires a bolt of arcane energy',
    ),
    'teleport': BossAbility(
        name='Teleport',
        ability_type=AbilityType.SPECIAL,
        cooldown=5,
        damage=0,
        range=0,
        description='Teleports to a random location',
    ),

    # Dragon Emperor abilities
    'fire_breath': BossAbility(
        name='Fire Breath',
        ability_type=AbilityType.AOE_ATTACK,
        cooldown=4,
        damage=12,
        range=3,
        description='Breathes fire in a cone',
    ),
    'tail_sweep': BossAbility(
        name='Tail Sweep',
        ability_type=AbilityType.AOE_ATTACK,
        cooldown=3,
        damage=10,
        range=1,
        description='Sweeps tail, hitting all adjacent',
    ),

    # v4.0 New enemy abilities
    'raise_skeleton': BossAbility(
        name='Raise Skeleton',
        ability_type=AbilityType.SUMMON,
        cooldown=6,
        damage=0,
        range=0,
        description='Raises a skeleton minion',
    ),
    'dark_bolt': BossAbility(
        name='Dark Bolt',
        ability_type=AbilityType.RANGED,
        cooldown=2,
        damage=6,
        range=5,
        description='Fires a bolt of dark energy',
    ),
    'fire_strike': BossAbility(
        name='Fire Strike',
        ability_type=AbilityType.SPECIAL,
        cooldown=3,
        damage=10,
        range=1,
        description='Melee attack that applies burn',
    ),
    'backstab': BossAbility(
        name='Backstab',
        ability_type=AbilityType.SPECIAL,
        cooldown=0,  # Always available from stealth
        damage=0,  # 3x normal damage
        range=1,
        description='3x damage when attacking from stealth',
    ),
    'vanish': BossAbility(
        name='Vanish',
        ability_type=AbilityType.SPECIAL,
        cooldown=5,
        damage=0,
        range=0,
        description='Become invisible',
    ),
    'fire_bolt': BossAbility(
        name='Fire Bolt',
        ability_type=AbilityType.RANGED,
        cooldown=2,
        damage=8,
        range=4,
        description='Ranged fire attack that applies burn',
    ),
    'ice_shard': BossAbility(
        name='Ice Shard',
        ability_type=AbilityType.RANGED,
        cooldown=2,
        damage=6,
        range=4,
        description='Ranged ice attack that applies freeze',
    ),
    'chain_lightning': BossAbility(
        name='Chain Lightning',
        ability_type=AbilityType.SPECIAL,
        cooldown=4,
        damage=5,
        range=5,
        description='Lightning that can jump to nearby targets',
    ),
}


def execute_ability(
    ability_name: str,
    boss: 'Enemy',
    player: 'Player',
    dungeon: 'Dungeon',
    entity_manager: 'EntityManager',
) -> Tuple[bool, str, int]:
    """
    Execute a boss ability.

    Returns:
        Tuple of (success, message, damage_dealt)
    """
    ability = BOSS_ABILITIES.get(ability_name)
    if not ability:
        return False, "", 0

    # Dispatch to specific ability handler
    handlers = {
        'summon_goblins': _execute_summon_goblins,
        'war_cry': _execute_war_cry,
        'ground_slam': _execute_ground_slam,
        'regenerate': _execute_regenerate,
        'raise_dead': _execute_raise_dead,
        'life_drain': _execute_life_drain,
        'arcane_bolt': _execute_arcane_bolt,
        'teleport': _execute_teleport,
        'fire_breath': _execute_fire_breath,
        'tail_sweep': _execute_tail_sweep,
        # v4.0 new abilities
        'raise_skeleton': _execute_raise_skeleton,
        'dark_bolt': _execute_dark_bolt,
        'fire_strike': _execute_fire_strike,
        'backstab': _execute_backstab,
        'vanish': _execute_vanish,
        'fire_bolt': _execute_fire_bolt,
        'ice_shard': _execute_ice_shard,
        'chain_lightning': _execute_chain_lightning,
    }

    handler = handlers.get(ability_name)
    if handler:
        return handler(ability, boss, player, dungeon, entity_manager)

    return False, "", 0


def _execute_summon_goblins(
    ability: BossAbility,
    boss: 'Enemy',
    player: 'Player',
    dungeon: 'Dungeon',
    entity_manager: 'EntityManager',
) -> Tuple[bool, str, int]:
    """Summon 2-3 goblin minions near the boss."""
    from .entities import Enemy
    from ..core.constants import EnemyType

    num_goblins = random.randint(2, 3)
    spawned = 0

    # Find valid spawn positions adjacent to boss
    for _ in range(num_goblins):
        for dx in range(-2, 3):
            for dy in range(-2, 3):
                if dx == 0 and dy == 0:
                    continue
                nx, ny = boss.x + dx, boss.y + dy
                if (dungeon.is_walkable(nx, ny) and
                    not entity_manager.get_enemy_at(nx, ny) and
                    (nx != player.x or ny != player.y)):
                    goblin = Enemy(nx, ny, enemy_type=EnemyType.GOBLIN, is_elite=False)
                    entity_manager.enemies.append(goblin)
                    spawned += 1
                    break
            else:
                continue
            break

    if spawned > 0:
        return True, f"The {boss.name} summons {spawned} goblins!", 0
    return False, "", 0


def _execute_war_cry(
    ability: BossAbility,
    boss: 'Enemy',
    player: 'Player',
    dungeon: 'Dungeon',
    entity_manager: 'EntityManager',
) -> Tuple[bool, str, int]:
    """Buff boss damage for 3 turns."""
    boss.buff_turns['war_cry'] = 3
    boss.buffed_damage = int(boss.base_attack_damage * 1.5)
    return True, f"The {boss.name} lets out a terrifying war cry! (+50% damage)", 0


def _execute_ground_slam(
    ability: BossAbility,
    boss: 'Enemy',
    player: 'Player',
    dungeon: 'Dungeon',
    entity_manager: 'EntityManager',
) -> Tuple[bool, str, int]:
    """AOE attack hitting all within range."""
    distance = abs(player.x - boss.x) + abs(player.y - boss.y)
    if distance <= ability.range:
        damage = player.take_damage(ability.damage)
        return True, f"The {boss.name} slams the ground! You take {damage} damage!", damage
    return True, f"The {boss.name} slams the ground, but you're out of range!", 0


def _execute_regenerate(
    ability: BossAbility,
    boss: 'Enemy',
    player: 'Player',
    dungeon: 'Dungeon',
    entity_manager: 'EntityManager',
) -> Tuple[bool, str, int]:
    """Heal when below 50% HP."""
    if boss.health < boss.max_health // 2:
        heal_amount = min(-ability.damage, boss.max_health - boss.health)
        boss.health += heal_amount
        return True, f"The {boss.name} regenerates {heal_amount} health!", 0
    return False, "", 0


def _execute_raise_dead(
    ability: BossAbility,
    boss: 'Enemy',
    player: 'Player',
    dungeon: 'Dungeon',
    entity_manager: 'EntityManager',
) -> Tuple[bool, str, int]:
    """Summon 2 skeleton minions."""
    from .entities import Enemy
    from ..core.constants import EnemyType

    spawned = 0
    for _ in range(2):
        for dx in range(-2, 3):
            for dy in range(-2, 3):
                if dx == 0 and dy == 0:
                    continue
                nx, ny = boss.x + dx, boss.y + dy
                if (dungeon.is_walkable(nx, ny) and
                    not entity_manager.get_enemy_at(nx, ny) and
                    (nx != player.x or ny != player.y)):
                    skeleton = Enemy(nx, ny, enemy_type=EnemyType.SKELETON, is_elite=False)
                    entity_manager.enemies.append(skeleton)
                    spawned += 1
                    break
            else:
                continue
            break

    if spawned > 0:
        return True, f"The {boss.name} raises {spawned} skeletons from the dead!", 0
    return False, "", 0


def _execute_life_drain(
    ability: BossAbility,
    boss: 'Enemy',
    player: 'Player',
    dungeon: 'Dungeon',
    entity_manager: 'EntityManager',
) -> Tuple[bool, str, int]:
    """Drain life from player, healing self."""
    distance = abs(player.x - boss.x) + abs(player.y - boss.y)
    if distance <= ability.range:
        damage = player.take_damage(ability.damage)
        heal = min(damage, boss.max_health - boss.health)
        boss.health += heal
        return True, f"The {boss.name} drains your life for {damage} damage, healing {heal}!", damage
    return False, "", 0


def _execute_arcane_bolt(
    ability: BossAbility,
    boss: 'Enemy',
    player: 'Player',
    dungeon: 'Dungeon',
    entity_manager: 'EntityManager',
) -> Tuple[bool, str, int]:
    """Ranged attack."""
    distance = abs(player.x - boss.x) + abs(player.y - boss.y)
    if distance <= ability.range:
        damage = player.take_damage(ability.damage)
        return True, f"The {boss.name} fires an arcane bolt for {damage} damage!", damage
    return False, "", 0


def _execute_teleport(
    ability: BossAbility,
    boss: 'Enemy',
    player: 'Player',
    dungeon: 'Dungeon',
    entity_manager: 'EntityManager',
) -> Tuple[bool, str, int]:
    """Teleport to a random location."""
    # Try to find a valid teleport location
    for _ in range(50):
        x, y = dungeon.get_random_floor_position()
        if (dungeon.is_walkable(x, y) and
            not entity_manager.get_enemy_at(x, y) and
            (x != player.x or y != player.y)):
            boss.x = x
            boss.y = y
            return True, f"The {boss.name} vanishes and reappears elsewhere!", 0
    return False, "", 0


def _execute_fire_breath(
    ability: BossAbility,
    boss: 'Enemy',
    player: 'Player',
    dungeon: 'Dungeon',
    entity_manager: 'EntityManager',
) -> Tuple[bool, str, int]:
    """Cone AOE attack toward player."""
    distance = abs(player.x - boss.x) + abs(player.y - boss.y)
    if distance <= ability.range:
        damage = player.take_damage(ability.damage)
        return True, f"The {boss.name} breathes fire for {damage} damage!", damage
    return True, f"The {boss.name} breathes fire, but you dodge!", 0


def _execute_tail_sweep(
    ability: BossAbility,
    boss: 'Enemy',
    player: 'Player',
    dungeon: 'Dungeon',
    entity_manager: 'EntityManager',
) -> Tuple[bool, str, int]:
    """Melee AOE hitting all adjacent."""
    distance = max(abs(player.x - boss.x), abs(player.y - boss.y))
    if distance <= ability.range:
        damage = player.take_damage(ability.damage)
        return True, f"The {boss.name} sweeps its tail for {damage} damage!", damage
    return False, "", 0


# v4.0 New ability handlers

def _execute_raise_skeleton(
    ability: BossAbility,
    caster: 'Enemy',
    player: 'Player',
    dungeon: 'Dungeon',
    entity_manager: 'EntityManager',
) -> Tuple[bool, str, int]:
    """Summon a single skeleton minion."""
    from .entities import Enemy
    from ..core.constants import EnemyType

    # Find a valid spawn position near the caster
    for dx in range(-2, 3):
        for dy in range(-2, 3):
            if dx == 0 and dy == 0:
                continue
            nx, ny = caster.x + dx, caster.y + dy
            if (dungeon.is_walkable(nx, ny) and
                not entity_manager.get_enemy_at(nx, ny) and
                (nx != player.x or ny != player.y)):
                skeleton = Enemy(nx, ny, enemy_type=EnemyType.SKELETON, is_elite=False)
                entity_manager.enemies.append(skeleton)
                return True, f"The {caster.name} raises a skeleton from the shadows!", 0

    return False, "", 0


def _execute_dark_bolt(
    ability: BossAbility,
    caster: 'Enemy',
    player: 'Player',
    dungeon: 'Dungeon',
    entity_manager: 'EntityManager',
) -> Tuple[bool, str, int]:
    """Ranged dark magic attack."""
    distance = abs(player.x - caster.x) + abs(player.y - caster.y)
    if distance <= ability.range:
        damage = player.take_damage(ability.damage)
        return True, f"The {caster.name} fires a dark bolt for {damage} damage!", damage
    return False, "", 0


def _execute_fire_strike(
    ability: BossAbility,
    caster: 'Enemy',
    player: 'Player',
    dungeon: 'Dungeon',
    entity_manager: 'EntityManager',
) -> Tuple[bool, str, int]:
    """Melee attack that applies burn status."""
    from ..core.constants import StatusEffectType

    distance = max(abs(player.x - caster.x), abs(player.y - caster.y))
    if distance <= ability.range:
        damage = player.take_damage(ability.damage)
        burn_msg = player.apply_status_effect(StatusEffectType.BURN, caster.name)
        return True, f"The {caster.name} strikes with fire for {damage} damage! {burn_msg}", damage
    return False, "", 0


def _execute_backstab(
    ability: BossAbility,
    caster: 'Enemy',
    player: 'Player',
    dungeon: 'Dungeon',
    entity_manager: 'EntityManager',
) -> Tuple[bool, str, int]:
    """3x damage attack from stealth."""
    distance = max(abs(player.x - caster.x), abs(player.y - caster.y))
    if distance <= ability.range:
        # Check if caster is invisible (stealthed)
        is_stealthed = getattr(caster, 'is_invisible', False)
        multiplier = 3 if is_stealthed else 1
        base_damage = caster.attack_damage * multiplier
        damage = player.take_damage(base_damage)

        # Break stealth after attacking
        if is_stealthed:
            caster.is_invisible = False
            return True, f"The {caster.name} backstabs you for {damage} critical damage!", damage

        return True, f"The {caster.name} strikes for {damage} damage!", damage
    return False, "", 0


def _execute_vanish(
    ability: BossAbility,
    caster: 'Enemy',
    player: 'Player',
    dungeon: 'Dungeon',
    entity_manager: 'EntityManager',
) -> Tuple[bool, str, int]:
    """Enter invisibility."""
    caster.is_invisible = True
    return True, f"The {caster.name} vanishes into the shadows!", 0


def _execute_fire_bolt(
    ability: BossAbility,
    caster: 'Enemy',
    player: 'Player',
    dungeon: 'Dungeon',
    entity_manager: 'EntityManager',
) -> Tuple[bool, str, int]:
    """Ranged fire attack that applies burn."""
    from ..core.constants import StatusEffectType

    distance = abs(player.x - caster.x) + abs(player.y - caster.y)
    if distance <= ability.range:
        damage = player.take_damage(ability.damage)
        burn_msg = player.apply_status_effect(StatusEffectType.BURN, caster.name)
        return True, f"The {caster.name} hurls a fire bolt for {damage} damage! {burn_msg}", damage
    return False, "", 0


def _execute_ice_shard(
    ability: BossAbility,
    caster: 'Enemy',
    player: 'Player',
    dungeon: 'Dungeon',
    entity_manager: 'EntityManager',
) -> Tuple[bool, str, int]:
    """Ranged ice attack that applies freeze."""
    from ..core.constants import StatusEffectType

    distance = abs(player.x - caster.x) + abs(player.y - caster.y)
    if distance <= ability.range:
        damage = player.take_damage(ability.damage)
        freeze_msg = player.apply_status_effect(StatusEffectType.FREEZE, caster.name)
        return True, f"The {caster.name} launches an ice shard for {damage} damage! {freeze_msg}", damage
    return False, "", 0


def _execute_chain_lightning(
    ability: BossAbility,
    caster: 'Enemy',
    player: 'Player',
    dungeon: 'Dungeon',
    entity_manager: 'EntityManager',
) -> Tuple[bool, str, int]:
    """Lightning that can jump to nearby enemies (damages player primarily)."""
    distance = abs(player.x - caster.x) + abs(player.y - caster.y)
    if distance <= ability.range:
        damage = player.take_damage(ability.damage)
        msg = f"The {caster.name} unleashes chain lightning for {damage} damage!"

        # Lightning can stun
        from ..core.constants import StatusEffectType
        if random.random() < 0.3:  # 30% chance to stun
            stun_msg = player.apply_status_effect(StatusEffectType.STUN, caster.name)
            msg += f" {stun_msg}"

        return True, msg, damage
    return False, "", 0
