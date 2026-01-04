"""Combat system for the roguelike."""
import random
from typing import Tuple, Optional

from .entities import Entity, Player


def calculate_player_attack_damage(player: Player, base_damage: int) -> Tuple[int, bool, str]:
    """
    Calculate final attack damage for player with passives, traits, and feats.

    Returns:
        Tuple of (final_damage, was_critical, bonus_message)
    """
    damage = float(base_damage)
    was_critical = False
    bonus_message = ""

    # Apply combat mastery passive (+15% melee damage for warriors)
    melee_bonus = player.get_melee_damage_bonus() if hasattr(player, 'get_melee_damage_bonus') else 0
    if melee_bonus > 0:
        damage *= (1 + melee_bonus)

    # Apply feat damage multiplier (weapon_master, berserker, etc.)
    feat_mult = player.get_total_damage_multiplier() if hasattr(player, 'get_total_damage_multiplier') else 1.0
    if feat_mult > 1.0:
        damage *= feat_mult

    # Apply rage trait (+50% damage when below 25% HP for orcs)
    rage_mult = player.get_rage_multiplier() if hasattr(player, 'get_rage_multiplier') else 1.0
    if rage_mult > 1.0:
        damage *= rage_mult
        bonus_message = "RAGE! "

    # Apply critical strike passive (20% chance for 2x damage for rogues) + feat crit bonus
    crit_chance = player.get_crit_chance() if hasattr(player, 'get_crit_chance') else 0
    if crit_chance > 0 and random.random() < crit_chance:
        damage *= 2.0
        was_critical = True
        bonus_message += "CRITICAL! "

    return (int(damage), was_critical, bonus_message)


def calculate_player_defense(player: Player, incoming_damage: int) -> Tuple[int, bool, str]:
    """
    Calculate damage taken by player after passives and traits.

    Returns:
        Tuple of (final_damage, was_dodged, defense_message)
    """
    damage = float(incoming_damage)
    was_dodged = False
    defense_message = ""

    # Apply lucky trait (15% dodge for halflings)
    dodge_chance = player.get_dodge_chance() if hasattr(player, 'get_dodge_chance') else 0
    if dodge_chance > 0 and random.random() < dodge_chance:
        was_dodged = True
        return (0, True, "Dodged! ")

    # Apply mana shield passive (25% damage reduction for mages)
    damage_reduction = player.get_damage_reduction() if hasattr(player, 'get_damage_reduction') else 0
    if damage_reduction > 0:
        damage *= (1 - damage_reduction)
        defense_message = "Mana shield absorbed some damage. "

    return (int(damage), was_dodged, defense_message)


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


def player_attack(player: Player, enemy: Entity) -> Tuple[int, bool, str]:
    """
    Handle player attacking an enemy with ability bonuses and feats.

    Returns:
        Tuple of (damage_dealt, enemy_died, bonus_message)
    """
    base_damage = player.attack_damage
    final_damage, was_critical, bonus_message = calculate_player_attack_damage(player, base_damage)

    actual_damage = enemy.take_damage(final_damage)
    enemy_died = not enemy.is_alive()

    # Apply life steal feat (heal % of damage dealt)
    life_steal = player.get_life_steal() if hasattr(player, 'get_life_steal') else 0
    if life_steal > 0 and actual_damage > 0:
        heal_amount = int(actual_damage * life_steal)
        if heal_amount > 0:
            player.health = min(player.health + heal_amount, player.max_health)
            bonus_message += f"Leech +{heal_amount}HP! "

    return (actual_damage, enemy_died, bonus_message)


def enemy_attack_player(enemy: Entity, player: Player) -> Tuple[int, bool, str, int]:
    """
    Handle enemy attacking the player with defense bonuses and feat effects.

    Returns:
        Tuple of (damage_dealt, player_died, defense_message, thorns_damage)
    """
    base_damage = enemy.attack_damage

    # Calculate defense (dodge, mana shield, feat resistance, etc.)
    final_damage, was_dodged, defense_message = calculate_player_defense(player, base_damage)

    if was_dodged:
        return (0, False, defense_message, 0)

    # Apply armor reduction
    actual_damage = player.take_damage(final_damage)
    player_died = not player.is_alive()

    # Apply thorns damage (reflect % of melee damage back)
    thorns_damage = 0
    thorns_pct = player.get_thorns_damage() if hasattr(player, 'get_thorns_damage') else 0
    if thorns_pct > 0 and actual_damage > 0:
        thorns_damage = int(actual_damage * thorns_pct)
        if thorns_damage > 0:
            enemy.take_damage(thorns_damage)
            defense_message += f"Thorns {thorns_damage}! "

    return (actual_damage, player_died, defense_message, thorns_damage)


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
