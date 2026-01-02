"""Combat system for the roguelike."""
from typing import Tuple

from .entities import Entity


def attack(attacker: Entity, defender: Entity) -> Tuple[int, bool]:
    """
    Perform an attack from attacker to defender.

    Returns:
        Tuple of (damage_dealt, defender_died)
    """
    damage = attacker.attack_damage
    actual_damage = defender.take_damage(damage)
    defender_died = not defender.is_alive()

    return (actual_damage, defender_died)


def get_combat_message(attacker_name: str, defender_name: str, damage: int, defender_died: bool) -> str:
    """
    Generate a message describing the combat action.

    Args:
        attacker_name: Name of the attacker
        defender_name: Name of the defender
        damage: Damage dealt
        defender_died: Whether the defender died

    Returns:
        A formatted combat message
    """
    if defender_died:
        return f"{attacker_name} killed {defender_name}!"
    else:
        return f"{attacker_name} hit {defender_name} for {damage} damage"
