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
