"""Elemental and magic ability handlers.

Contains fire, ice, lightning, dark magic, and ranged spell abilities.
"""
import random
from typing import TYPE_CHECKING, Tuple

from .ability_definitions import BossAbility

if TYPE_CHECKING:
    from .entities import Enemy, Player
    from ..world.dungeon import Dungeon
    from ..managers.entity_manager import EntityManager


def calculate_elemental_damage(
    base_damage: int,
    element_type: str,
    target,
    attacker=None,
) -> Tuple[int, str]:
    """Calculate damage with elemental weaknesses and resistances."""
    from ..core.constants import (
        ElementType, ELEMENT_WEAKNESSES, WEAKNESS_DAMAGE_MULTIPLIER
    )

    damage = base_damage
    message = ""

    resistances = getattr(target, 'resistances', {})
    resistance = resistances.get(element_type, 0.0)

    if resistance >= 1.0:
        return 0, " (Immune!)"
    elif resistance > 0:
        damage = int(damage * (1.0 - resistance))
        message = f" (Resisted {int(resistance * 100)}%)"

    target_element = getattr(target, 'current_element', None)
    if target_element:
        attack_element_map = {
            'fire': ElementType.FIRE,
            'ice': ElementType.ICE,
            'lightning': ElementType.LIGHTNING,
            'dark': ElementType.DARK,
        }
        attack_element = attack_element_map.get(element_type)

        if attack_element:
            weakness = ELEMENT_WEAKNESSES.get(target_element)
            if weakness == attack_element:
                damage = int(damage * WEAKNESS_DAMAGE_MULTIPLIER)
                message = " (Super effective!)"

    return max(1, damage), message


def execute_arcane_bolt(
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


def execute_fire_breath(
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


def execute_dark_bolt(
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


def execute_fire_bolt(
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
        final_damage, element_msg = calculate_elemental_damage(ability.damage, 'fire', player, caster)
        damage = player.take_damage(final_damage)
        burn_msg = player.apply_status_effect(StatusEffectType.BURN, caster.name)
        return True, f"The {caster.name} hurls a fire bolt for {damage} damage{element_msg}! {burn_msg}", damage
    return False, "", 0


def execute_ice_shard(
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
        final_damage, element_msg = calculate_elemental_damage(ability.damage, 'ice', player, caster)
        damage = player.take_damage(final_damage)
        freeze_msg = player.apply_status_effect(StatusEffectType.FREEZE, caster.name)
        return True, f"The {caster.name} launches an ice shard for {damage} damage{element_msg}! {freeze_msg}", damage
    return False, "", 0


def execute_chain_lightning(
    ability: BossAbility,
    caster: 'Enemy',
    player: 'Player',
    dungeon: 'Dungeon',
    entity_manager: 'EntityManager',
) -> Tuple[bool, str, int]:
    """Lightning that can jump to nearby enemies (damages player primarily)."""
    from ..core.constants import StatusEffectType

    distance = abs(player.x - caster.x) + abs(player.y - caster.y)
    if distance <= ability.range:
        final_damage, element_msg = calculate_elemental_damage(ability.damage, 'lightning', player, caster)
        damage = player.take_damage(final_damage)
        msg = f"The {caster.name} unleashes chain lightning for {damage} damage{element_msg}!"

        if random.random() < 0.3:
            stun_msg = player.apply_status_effect(StatusEffectType.STUN, caster.name)
            msg += f" {stun_msg}"

        return True, msg, damage
    return False, "", 0


def execute_ice_blast(
    ability: BossAbility,
    caster: 'Enemy',
    player: 'Player',
    dungeon: 'Dungeon',
    entity_manager: 'EntityManager',
) -> Tuple[bool, str, int]:
    """AOE ice attack that damages and freezes."""
    from ..core.constants import StatusEffectType

    distance = max(abs(player.x - caster.x), abs(player.y - caster.y))
    if distance <= ability.range:
        damage = player.take_damage(ability.damage)
        freeze_msg = player.apply_status_effect(StatusEffectType.FREEZE, caster.name)
        return True, f"The {caster.name} unleashes an ice blast for {damage} damage! {freeze_msg}", damage
    return False, "", 0


def execute_freeze_ground(
    ability: BossAbility,
    caster: 'Enemy',
    player: 'Player',
    dungeon: 'Dungeon',
    entity_manager: 'EntityManager',
) -> Tuple[bool, str, int]:
    """Creates frozen ground that slows the player."""
    from ..core.constants import StatusEffectType

    distance = max(abs(player.x - caster.x), abs(player.y - caster.y))
    if distance <= ability.range + 1:
        slow_msg = player.apply_status_effect(StatusEffectType.SLOW, caster.name)
        return True, f"The {caster.name} freezes the ground! {slow_msg}", 0
    return False, "", 0


def execute_lava_pool(
    ability: BossAbility,
    caster: 'Enemy',
    player: 'Player',
    dungeon: 'Dungeon',
    entity_manager: 'EntityManager',
) -> Tuple[bool, str, int]:
    """Creates a damaging lava pool (deals damage if player is close)."""
    from ..core.constants import StatusEffectType

    distance = max(abs(player.x - caster.x), abs(player.y - caster.y))
    if distance <= ability.range:
        damage = player.take_damage(ability.damage)
        burn_msg = player.apply_status_effect(StatusEffectType.BURN, caster.name)
        return True, f"The {caster.name} creates a pool of molten lava! {damage} damage! {burn_msg}", damage
    return True, f"The {caster.name} creates a pool of molten lava!", 0


def execute_inferno(
    ability: BossAbility,
    caster: 'Enemy',
    player: 'Player',
    dungeon: 'Dungeon',
    entity_manager: 'EntityManager',
) -> Tuple[bool, str, int]:
    """Massive AOE fire attack."""
    from ..core.constants import StatusEffectType

    distance = max(abs(player.x - caster.x), abs(player.y - caster.y))
    if distance <= ability.range:
        damage = player.take_damage(ability.damage)
        burn_msg = player.apply_status_effect(StatusEffectType.BURN, caster.name)
        return True, f"The {caster.name} erupts in an inferno for {damage} damage! {burn_msg}", damage
    return False, "", 0


def execute_counterfeit_crown(
    ability: BossAbility,
    boss: 'Enemy',
    player: 'Player',
    dungeon: 'Dungeon',
    entity_manager: 'EntityManager',
) -> Tuple[bool, str, int]:
    """The Regent's crown flashes with false authority, stunning and damaging nearby."""
    from ..core.constants import StatusEffectType

    distance = max(abs(player.x - boss.x), abs(player.y - boss.y))
    if distance <= ability.range:
        damage = player.take_damage(ability.damage)
        stun_msg = player.apply_status_effect(StatusEffectType.STUN, boss.name)
        return True, f"The Regent's counterfeit crown blazes with stolen authority! {damage} damage! {stun_msg}", damage

    return True, f"The Regent's crown flashes, but you're too far to be affected.", 0
