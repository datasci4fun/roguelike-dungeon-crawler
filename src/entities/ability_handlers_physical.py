"""Physical and melee ability handlers.

Contains melee attacks, AOE slams, status-inflicting bites, and utility abilities.
"""
import random
from typing import TYPE_CHECKING, Tuple

from .ability_definitions import BossAbility

if TYPE_CHECKING:
    from .entities import Enemy, Player
    from ..world.dungeon import Dungeon
    from ..managers.entity_manager import EntityManager


def execute_war_cry(
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


def execute_ground_slam(
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


def execute_regenerate(
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


def execute_life_drain(
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


def execute_teleport(
    ability: BossAbility,
    boss: 'Enemy',
    player: 'Player',
    dungeon: 'Dungeon',
    entity_manager: 'EntityManager',
) -> Tuple[bool, str, int]:
    """Teleport to a random location."""
    for _ in range(50):
        x, y = dungeon.get_random_floor_position()
        if (dungeon.is_walkable(x, y) and
            not entity_manager.get_enemy_at(x, y) and
            (x != player.x or y != player.y)):
            boss.x = x
            boss.y = y
            return True, f"The {boss.name} vanishes and reappears elsewhere!", 0
    return False, "", 0


def execute_tail_sweep(
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


def execute_fire_strike(
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


def execute_backstab(
    ability: BossAbility,
    caster: 'Enemy',
    player: 'Player',
    dungeon: 'Dungeon',
    entity_manager: 'EntityManager',
) -> Tuple[bool, str, int]:
    """3x damage attack from stealth."""
    distance = max(abs(player.x - caster.x), abs(player.y - caster.y))
    if distance <= ability.range:
        is_stealthed = getattr(caster, 'is_invisible', False)
        multiplier = 3 if is_stealthed else 1
        base_damage = caster.attack_damage * multiplier
        damage = player.take_damage(base_damage)

        if is_stealthed:
            caster.is_invisible = False
            return True, f"The {caster.name} backstabs you for {damage} critical damage!", damage

        return True, f"The {caster.name} strikes for {damage} damage!", damage
    return False, "", 0


def execute_vanish(
    ability: BossAbility,
    caster: 'Enemy',
    player: 'Player',
    dungeon: 'Dungeon',
    entity_manager: 'EntityManager',
) -> Tuple[bool, str, int]:
    """Enter invisibility."""
    caster.is_invisible = True
    return True, f"The {caster.name} vanishes into the shadows!", 0


def execute_web_trap(
    ability: BossAbility,
    caster: 'Enemy',
    player: 'Player',
    dungeon: 'Dungeon',
    entity_manager: 'EntityManager',
) -> Tuple[bool, str, int]:
    """Immobilizes the player with sticky webs."""
    from ..core.constants import StatusEffectType

    distance = abs(player.x - caster.x) + abs(player.y - caster.y)
    if distance <= ability.range:
        stun_msg = player.apply_status_effect(StatusEffectType.STUN, caster.name)
        return True, f"The {caster.name} shoots sticky webbing! {stun_msg}", 0
    return False, "", 0


def execute_poison_bite(
    ability: BossAbility,
    caster: 'Enemy',
    player: 'Player',
    dungeon: 'Dungeon',
    entity_manager: 'EntityManager',
) -> Tuple[bool, str, int]:
    """Melee attack that poisons the target."""
    from ..core.constants import StatusEffectType

    distance = max(abs(player.x - caster.x), abs(player.y - caster.y))
    if distance <= ability.range:
        damage = player.take_damage(ability.damage)
        poison_msg = player.apply_status_effect(StatusEffectType.POISON, caster.name)
        return True, f"The {caster.name} bites with venomous fangs for {damage} damage! {poison_msg}", damage
    return False, "", 0


def execute_plague_bite(
    ability: BossAbility,
    caster: 'Enemy',
    player: 'Player',
    dungeon: 'Dungeon',
    entity_manager: 'EntityManager',
) -> Tuple[bool, str, int]:
    """Diseased bite that poisons and weakens."""
    from ..core.constants import StatusEffectType

    distance = max(abs(player.x - caster.x), abs(player.y - caster.y))
    if distance <= ability.range:
        damage = player.take_damage(ability.damage)
        poison_msg = player.apply_status_effect(StatusEffectType.POISON, caster.name)
        weak_msg = player.apply_status_effect(StatusEffectType.WEAK, caster.name)
        return True, f"The {caster.name} delivers a plague-ridden bite for {damage} damage! {poison_msg} {weak_msg}", damage
    return False, "", 0


def execute_burrow(
    ability: BossAbility,
    caster: 'Enemy',
    player: 'Player',
    dungeon: 'Dungeon',
    entity_manager: 'EntityManager',
) -> Tuple[bool, str, int]:
    """Burrows underground and repositions."""
    for _ in range(10):
        dx = random.randint(-3, 3)
        dy = random.randint(-3, 3)
        nx, ny = player.x + dx, player.y + dy
        if (dungeon.is_walkable(nx, ny) and
            not entity_manager.get_enemy_at(nx, ny) and
            (nx != player.x or ny != player.y)):
            caster.x = nx
            caster.y = ny
            return True, f"The {caster.name} burrows underground and emerges nearby!", 0

    return False, "", 0
