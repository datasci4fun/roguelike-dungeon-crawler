"""Summoning ability handlers for bosses and elite enemies.

Contains all abilities that spawn minions or allies.
"""
import random
from typing import TYPE_CHECKING, Tuple

from .ability_definitions import BossAbility

if TYPE_CHECKING:
    from .entities import Enemy, Player
    from ..world.dungeon import Dungeon
    from ..managers.entity_manager import EntityManager


def execute_summon_goblins(
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


def execute_raise_dead(
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


def execute_raise_skeleton(
    ability: BossAbility,
    caster: 'Enemy',
    player: 'Player',
    dungeon: 'Dungeon',
    entity_manager: 'EntityManager',
) -> Tuple[bool, str, int]:
    """Summon a single skeleton minion."""
    from .entities import Enemy
    from ..core.constants import EnemyType

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


def execute_summon_spiders(
    ability: BossAbility,
    caster: 'Enemy',
    player: 'Player',
    dungeon: 'Dungeon',
    entity_manager: 'EntityManager',
) -> Tuple[bool, str, int]:
    """Summons spider minions."""
    from .entities import Enemy
    from ..core.constants import EnemyType

    num_spiders = random.randint(2, 3)
    spawned = 0

    for _ in range(num_spiders):
        for dx in range(-2, 3):
            for dy in range(-2, 3):
                if dx == 0 and dy == 0:
                    continue
                nx, ny = caster.x + dx, caster.y + dy
                if (dungeon.is_walkable(nx, ny) and
                    not entity_manager.get_enemy_at(nx, ny) and
                    (nx != player.x or ny != player.y)):
                    spider = Enemy(nx, ny, enemy_type=EnemyType.GOBLIN, is_elite=False)
                    spider.name = "Spider"
                    spider.symbol = 's'
                    entity_manager.enemies.append(spider)
                    spawned += 1
                    break
            if spawned >= num_spiders:
                break

    if spawned > 0:
        return True, f"The {caster.name} summons {spawned} spiders!", 0
    return False, "", 0


def execute_summon_swarm(
    ability: BossAbility,
    caster: 'Enemy',
    player: 'Player',
    dungeon: 'Dungeon',
    entity_manager: 'EntityManager',
) -> Tuple[bool, str, int]:
    """Summons a swarm of rat minions."""
    from .entities import Enemy
    from ..core.constants import EnemyType

    num_rats = random.randint(3, 5)
    spawned = 0

    for _ in range(num_rats):
        for dx in range(-2, 3):
            for dy in range(-2, 3):
                if dx == 0 and dy == 0:
                    continue
                nx, ny = caster.x + dx, caster.y + dy
                if (dungeon.is_walkable(nx, ny) and
                    not entity_manager.get_enemy_at(nx, ny) and
                    (nx != player.x or ny != player.y)):
                    rat = Enemy(nx, ny, enemy_type=EnemyType.GOBLIN, is_elite=False)
                    rat.name = "Rat"
                    rat.symbol = 'r'
                    rat.health = rat.health // 2
                    rat.max_health = rat.health
                    entity_manager.enemies.append(rat)
                    spawned += 1
                    break
            if spawned >= num_rats:
                break

    if spawned > 0:
        return True, f"The {caster.name} summons a swarm of {spawned} rats!", 0
    return False, "", 0


def execute_royal_decree(
    ability: BossAbility,
    boss: 'Enemy',
    player: 'Player',
    dungeon: 'Dungeon',
    entity_manager: 'EntityManager',
) -> Tuple[bool, str, int]:
    """Issues a decree that summons oath-bound guards from the corners."""
    from .entities import Enemy
    from ..core.constants import EnemyType

    current_room = dungeon.get_room_at(boss.x, boss.y)
    if not current_room:
        return False, "", 0

    corners = [
        (current_room.x + 1, current_room.y + 1),
        (current_room.x + current_room.width - 2, current_room.y + 1),
        (current_room.x + 1, current_room.y + current_room.height - 2),
        (current_room.x + current_room.width - 2, current_room.y + current_room.height - 2),
    ]

    num_guards = random.randint(1, 2)
    spawned = 0
    random.shuffle(corners)

    for cx, cy in corners:
        if spawned >= num_guards:
            break
        if (dungeon.is_walkable(cx, cy) and
            not entity_manager.get_enemy_at(cx, cy) and
            (cx != player.x or cy != player.y)):
            guard = Enemy(cx, cy, enemy_type=EnemyType.SKELETON, is_elite=False)
            guard.name = "Oath-Bound Guard"
            guard.symbol = 'G'
            entity_manager.enemies.append(guard)
            spawned += 1

    if spawned > 0:
        decree_messages = [
            "By royal decree, guards have always stood here!",
            "The Regent rewrites reality - guards materialize!",
            "It was always thus - guards appear from the corners!",
        ]
        return True, f"The Regent issues a decree: '{random.choice(decree_messages)}' ({spawned} guards summoned)", 0

    return False, "", 0


def execute_summon_guard(
    ability: BossAbility,
    boss: 'Enemy',
    player: 'Player',
    dungeon: 'Dungeon',
    entity_manager: 'EntityManager',
) -> Tuple[bool, str, int]:
    """Summons a single oath-bound skeleton guard near the Regent."""
    from .entities import Enemy
    from ..core.constants import EnemyType

    for dx in range(-2, 3):
        for dy in range(-2, 3):
            if dx == 0 and dy == 0:
                continue
            nx, ny = boss.x + dx, boss.y + dy
            if (dungeon.is_walkable(nx, ny) and
                not entity_manager.get_enemy_at(nx, ny) and
                (nx != player.x or ny != player.y)):
                guard = Enemy(nx, ny, enemy_type=EnemyType.SKELETON, is_elite=False)
                guard.name = "Oath-Bound Guard"
                guard.symbol = 'G'
                entity_manager.enemies.append(guard)
                return True, f"The {boss.name} summons an oath-bound guard!", 0

    return False, "", 0
