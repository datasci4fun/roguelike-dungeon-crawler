"""Player feat system and bonus aggregators.

Contains functions to calculate cumulative bonuses from feats.
"""
from typing import List

from ..feats import get_feat


def has_feat(feats: List[str], feat_id: str) -> bool:
    """Check if player has a specific feat."""
    return feat_id in feats


def get_total_damage_multiplier(feats: List[str]) -> float:
    """Get total damage multiplier from all feats."""
    multiplier = 1.0
    for feat_id in feats:
        feat = get_feat(feat_id)
        if feat and feat.damage_multiplier > 0:
            multiplier *= (1 + feat.damage_multiplier)
    return multiplier


def get_total_crit_bonus(feats: List[str]) -> float:
    """Get total crit bonus from feats."""
    bonus = 0.0
    for feat_id in feats:
        feat = get_feat(feat_id)
        if feat:
            bonus += feat.crit_bonus
    return bonus


def get_total_dodge_bonus(feats: List[str]) -> float:
    """Get total dodge bonus from feats."""
    bonus = 0.0
    for feat_id in feats:
        feat = get_feat(feat_id)
        if feat:
            bonus += feat.dodge_bonus
    return bonus


def get_total_block_bonus(feats: List[str]) -> float:
    """Get total block bonus from feats."""
    bonus = 0.0
    for feat_id in feats:
        feat = get_feat(feat_id)
        if feat:
            bonus += feat.block_bonus
    return bonus


def get_total_resistance(feats: List[str]) -> float:
    """Get total damage resistance from feats."""
    resistance = 0.0
    for feat_id in feats:
        feat = get_feat(feat_id)
        if feat:
            resistance += feat.resistance_all
    return min(resistance, 0.75)  # Cap at 75%


def get_life_steal(feats: List[str]) -> float:
    """Get life steal percentage from feats."""
    steal = 0.0
    for feat_id in feats:
        feat = get_feat(feat_id)
        if feat:
            steal += feat.life_steal
    return steal


def get_thorns_damage(feats: List[str]) -> float:
    """Get thorns damage percentage from feats."""
    thorns = 0.0
    for feat_id in feats:
        feat = get_feat(feat_id)
        if feat:
            thorns += feat.thorns
    return thorns


def get_xp_feat_bonus(feats: List[str]) -> float:
    """Get XP bonus from feats (not race trait)."""
    bonus = 0.0
    for feat_id in feats:
        feat = get_feat(feat_id)
        if feat:
            bonus += feat.xp_bonus
    return bonus


def get_vision_feat_bonus(feats: List[str]) -> int:
    """Get vision bonus from feats."""
    bonus = 0
    for feat_id in feats:
        feat = get_feat(feat_id)
        if feat:
            bonus += feat.vision_bonus
    return bonus


def get_heal_bonus(feats: List[str]) -> float:
    """Get healing effectiveness bonus from feats."""
    bonus = 0.0
    for feat_id in feats:
        feat = get_feat(feat_id)
        if feat:
            bonus += feat.heal_bonus
    return bonus


def has_first_strike(feats: List[str]) -> bool:
    """Check if player has first strike feat."""
    for feat_id in feats:
        feat = get_feat(feat_id)
        if feat and feat.first_strike:
            return True
    return False
