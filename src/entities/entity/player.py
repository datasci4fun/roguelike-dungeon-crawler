"""Player entity class.

Delegates to:
- player_feats.py: Feat bonus aggregators
"""
from typing import List, Optional

from ...core.constants import (
    PLAYER_SYMBOL, PLAYER_MAX_HEALTH, PLAYER_ATTACK_DAMAGE,
    Race, PlayerClass, RACE_STATS, CLASS_STATS
)
from ...items import Inventory
from ..player_abilities import (
    PlayerAbility, AbilityCategory, get_abilities_for_class, PLAYER_ABILITIES
)
from ..feats import Feat, FEATS, get_feat, get_available_feats, should_gain_feat_at_level, FEAT_LEVELS
from ..ability_scores import (
    AbilityScores, create_ability_scores, roll_ability_scores,
    get_hit_die, get_primary_stat
)
from . import player_feats
from .base import Entity


class Player(Entity):
    """The player character.

    Handles race/class stats, equipment, abilities, feats, and leveling.
    Now includes D&D-style ability scores (STR, DEX, CON, LUCK).
    """

    def __init__(self, x: int, y: int, race: Race = None, player_class: PlayerClass = None,
                 ability_scores: AbilityScores = None):
        # Initialize or generate ability scores
        if ability_scores:
            self.ability_scores = ability_scores
        elif race and player_class:
            # Generate ability scores with race/class modifiers
            self.ability_scores = create_ability_scores(
                race.name if hasattr(race, 'name') else str(race),
                player_class.name if hasattr(player_class, 'name') else str(player_class)
            )
        else:
            # Default ability scores for backward compatibility
            self.ability_scores = AbilityScores()

        # Calculate stats from race + class + ability scores
        if race and player_class:
            race_stats = RACE_STATS[race]
            class_stats = CLASS_STATS[player_class]

            # Base stats + race + class modifiers
            base_hp = 20
            base_atk = 3
            base_def = 0

            # Apply CON modifier to HP (each point = +1 HP per level, minimum +1 at level 1)
            con_hp_bonus = max(1, self.ability_scores.con_mod)

            max_hp = base_hp + race_stats['hp_modifier'] + class_stats['hp_modifier'] + con_hp_bonus

            # Apply STR modifier to base attack
            attack = base_atk + race_stats['atk_modifier'] + class_stats['atk_modifier'] + self.ability_scores.str_mod

            # Apply DEX modifier to defense (dodge/AC contribution)
            defense = max(0, base_def + race_stats['def_modifier'] + class_stats['def_modifier'] + self.ability_scores.dex_mod)
        else:
            # Default stats for backward compatibility
            max_hp = PLAYER_MAX_HEALTH
            attack = PLAYER_ATTACK_DAMAGE
            defense = 0

        super().__init__(
            x=x,
            y=y,
            symbol=PLAYER_SYMBOL,
            max_health=max_hp,
            health=max_hp,
            attack_damage=attack
        )

        # Store race and class
        self.race = race
        self.player_class = player_class

        # Race trait
        if race:
            race_stats = RACE_STATS[race]
            self.race_trait = race_stats['trait']
            self.race_trait_name = race_stats['trait_name']
            self.race_trait_description = race_stats['trait_description']
        else:
            self.race_trait = None
            self.race_trait_name = None
            self.race_trait_description = None

        # Class abilities
        if player_class:
            class_stats = CLASS_STATS[player_class]
            self.abilities = get_abilities_for_class(
                class_stats['active_abilities'],
                class_stats['passive_abilities']
            )
            self.active_abilities = class_stats['active_abilities']
            self.passive_abilities = class_stats['passive_abilities']
            self.ability_cooldowns = {ability_id: 0 for ability_id in self.active_abilities}
        else:
            self.abilities = {}
            self.active_abilities = []
            self.passive_abilities = []
            self.ability_cooldowns = {}

        self.base_attack = attack  # Base attack without equipment
        self.base_defense = defense  # Base defense from race/class
        self.kills = 0
        self.inventory = Inventory(max_size=10)

        # Facing direction for directional FOV (dx, dy)
        # (0, -1) = North, (0, 1) = South, (1, 0) = East, (-1, 0) = West
        self.facing = (0, 1)  # Default: facing south (down)

        # Equipment slots (None = nothing equipped)
        self.equipped_weapon = None
        self.equipped_armor = None
        self.defense = defense  # Defense reduces incoming damage (starts with base)

        # v4.0 New equipment slots
        self.equipped_off_hand = None  # Shield
        self.equipped_ring = None      # Ring
        self.equipped_amulet = None    # Amulet
        self.block_chance = 0.0        # Shield block chance

        # XP and leveling
        self.level = 1
        self.xp = 0
        self.xp_to_next_level = self._calculate_xp_for_next_level()

        # Feat system
        self.feats: List[str] = []  # List of acquired feat IDs
        self.pending_feat_selection = False  # True when player needs to select a feat

        # Human trait: starts with 1 feat of choice
        if race and RACE_STATS[race].get('starts_with_feat', False):
            self.pending_feat_selection = True

        # v5.5: Artifact system (Sky-Touched Artifacts)
        self.artifacts: List = []  # Max 2 artifacts
        self.duplicate_next_consumable = False  # Set by Duplicate Seal
        self.guaranteed_rare_from_boss = False  # Set by Oathstone vow

    def _calculate_xp_for_next_level(self) -> int:
        """Calculate XP required to reach next level."""
        from ...core.constants import XP_BASE_REQUIREMENT
        return self.level * XP_BASE_REQUIREMENT

    def gain_xp(self, amount: int) -> bool:
        """Gain XP and check for level up.

        Returns:
            True if player leveled up, False otherwise
        """
        from ...core.constants import MAX_PLAYER_LEVEL, HP_GAIN_PER_LEVEL, ATK_GAIN_PER_LEVEL

        self.xp += amount

        # Check for level up
        if self.xp >= self.xp_to_next_level and self.level < MAX_PLAYER_LEVEL:
            self.level += 1

            # Increase stats and heal to full
            hp_bonus = HP_GAIN_PER_LEVEL

            # Apply Second Wind feat bonus (+3 HP on level up)
            if self.has_feat('second_wind'):
                hp_bonus += 3

            self.max_health += hp_bonus
            self.health = self.max_health  # Full heal on level up
            self.attack_damage += ATK_GAIN_PER_LEVEL

            # Check if this level grants a feat
            if should_gain_feat_at_level(self.level):
                self.pending_feat_selection = True

            # Calculate next level requirement
            self.xp_to_next_level = self._calculate_xp_for_next_level()

            return True

        return False

    def move(self, dx: int, dy: int):
        """Move the player by the given offset."""
        self.x += dx
        self.y += dy

    # ========== Equipment Methods ==========

    def equip(self, item) -> str:
        """Equip a weapon or armor item.

        Returns a message describing what happened.
        """
        from ...core.constants import EquipmentSlot
        from ...items import Weapon, Armor

        if not item.is_equippable():
            return f"Cannot equip {item.name}!"

        old_item = None
        message = ""

        if item.equip_slot == EquipmentSlot.WEAPON:
            old_item = self.equipped_weapon
            self.equipped_weapon = item
            # Update attack damage (ranged weapons use damage, melee use attack_bonus)
            if hasattr(item, 'is_ranged') and item.is_ranged:
                self.attack_damage = self.base_attack  # Ranged uses separate damage
            else:
                self.attack_damage = self.base_attack + getattr(item, 'attack_bonus', 0)
            message = f"Equipped {item.name}"
        elif item.equip_slot == EquipmentSlot.ARMOR:
            old_item = self.equipped_armor
            self.equipped_armor = item
            # Update defense
            self._recalculate_defense()
            message = f"Equipped {item.name} (+{item.defense_bonus} DEF)"
        elif item.equip_slot == EquipmentSlot.OFF_HAND:
            old_item = self.equipped_off_hand
            self.equipped_off_hand = item
            self._recalculate_defense()
            self.block_chance = getattr(item, 'block_chance', 0.0)
            message = f"Equipped {item.name} (+{item.defense_bonus} DEF, {int(item.block_chance * 100)}% block)"
        elif item.equip_slot == EquipmentSlot.RING:
            old_item = self.equipped_ring
            self.equipped_ring = item
            self._apply_ring_bonuses()
            message = f"Equipped {item.name}"
        elif item.equip_slot == EquipmentSlot.AMULET:
            old_item = self.equipped_amulet
            self.equipped_amulet = item
            self._apply_amulet_effect()
            message = f"Equipped {item.name}"

        # Remove equipped item from inventory
        if item in self.inventory.items:
            self.inventory.items.remove(item)

        # Add old item back to inventory if there was one
        if old_item is not None:
            self.inventory.add_item(old_item)
            message += f", unequipped {old_item.name}"

        return message

    def _recalculate_defense(self):
        """Recalculate total defense from base + armor and shield."""
        self.defense = self.base_defense  # Start with base defense from race/class
        if self.equipped_armor:
            self.defense += self.equipped_armor.defense_bonus
        if self.equipped_off_hand:
            self.defense += getattr(self.equipped_off_hand, 'defense_bonus', 0)
        # Ring defense bonus
        if self.equipped_ring:
            self.defense += self.equipped_ring.stat_bonuses.get('defense', 0)

    def _apply_ring_bonuses(self):
        """Apply stat bonuses from equipped ring."""
        self._recalculate_defense()
        if self.equipped_ring:
            # Attack bonus
            atk_bonus = self.equipped_ring.stat_bonuses.get('attack', 0)
            self.attack_damage = self.base_attack + atk_bonus
            if self.equipped_weapon and hasattr(self.equipped_weapon, 'attack_bonus'):
                self.attack_damage += self.equipped_weapon.attack_bonus

    def _apply_amulet_effect(self):
        """Apply passive effect from equipped amulet."""
        if self.equipped_amulet:
            if self.equipped_amulet.effect == 'max_health':
                # This would be handled separately when taking damage
                pass

    def unequip(self, slot) -> str:
        """Unequip item from a slot and add it to inventory.

        Returns a message describing what happened.
        """
        from ...core.constants import EquipmentSlot

        if slot == EquipmentSlot.WEAPON:
            if self.equipped_weapon is None:
                return "No weapon equipped!"
            if self.inventory.is_full():
                return "Inventory full, cannot unequip!"
            item = self.equipped_weapon
            self.equipped_weapon = None
            self.attack_damage = self.base_attack
            self._apply_ring_bonuses()  # Reapply ring bonuses
            self.inventory.add_item(item)
            return f"Unequipped {item.name}"
        elif slot == EquipmentSlot.ARMOR:
            if self.equipped_armor is None:
                return "No armor equipped!"
            if self.inventory.is_full():
                return "Inventory full, cannot unequip!"
            item = self.equipped_armor
            self.equipped_armor = None
            self._recalculate_defense()
            self.inventory.add_item(item)
            return f"Unequipped {item.name}"
        elif slot == EquipmentSlot.OFF_HAND:
            if self.equipped_off_hand is None:
                return "No off-hand item equipped!"
            if self.inventory.is_full():
                return "Inventory full, cannot unequip!"
            item = self.equipped_off_hand
            self.equipped_off_hand = None
            self._recalculate_defense()
            self.block_chance = 0.0
            self.inventory.add_item(item)
            return f"Unequipped {item.name}"
        elif slot == EquipmentSlot.RING:
            if self.equipped_ring is None:
                return "No ring equipped!"
            if self.inventory.is_full():
                return "Inventory full, cannot unequip!"
            item = self.equipped_ring
            self.equipped_ring = None
            self._recalculate_defense()
            self._apply_ring_bonuses()
            self.inventory.add_item(item)
            return f"Unequipped {item.name}"
        elif slot == EquipmentSlot.AMULET:
            if self.equipped_amulet is None:
                return "No amulet equipped!"
            if self.inventory.is_full():
                return "Inventory full, cannot unequip!"
            item = self.equipped_amulet
            self.equipped_amulet = None
            self.inventory.add_item(item)
            return f"Unequipped {item.name}"

        return "Invalid equipment slot!"

    def take_damage(self, damage: int) -> int:
        """Take damage reduced by defense and return actual damage taken."""
        # God mode check (dev/testing cheat)
        if getattr(self, 'god_mode', False):
            return 0
        reduced_damage = max(1, damage - self.defense)  # Always take at least 1 damage
        actual_damage = min(reduced_damage, self.health)
        self.health -= actual_damage
        return actual_damage

    # ========== Ability Methods ==========

    def tick_cooldowns(self):
        """Tick down all ability cooldowns by 1 turn."""
        for ability_id in self.ability_cooldowns:
            if self.ability_cooldowns[ability_id] > 0:
                self.ability_cooldowns[ability_id] -= 1

    def can_use_ability(self, ability_id: str) -> bool:
        """Check if an ability is ready to use."""
        if ability_id not in self.abilities:
            return False
        ability = self.abilities[ability_id]
        if ability.category == AbilityCategory.PASSIVE:
            return False  # Passives can't be "used"
        return self.ability_cooldowns.get(ability_id, 0) <= 0

    def use_ability(self, ability_id: str) -> bool:
        """Mark an ability as used and set its cooldown. Returns True if successful."""
        if not self.can_use_ability(ability_id):
            return False
        ability = self.abilities[ability_id]
        self.ability_cooldowns[ability_id] = ability.cooldown
        return True

    def get_ability_info(self) -> list:
        """Get serializable info about player's abilities for frontend."""
        ability_list = []
        for ability_id in self.active_abilities:
            ability = self.abilities.get(ability_id)
            if ability:
                ability_list.append({
                    'id': ability_id,
                    'name': ability.name,
                    'description': ability.description,
                    'cooldown': ability.cooldown,
                    'cooldown_remaining': self.ability_cooldowns.get(ability_id, 0),
                    'is_ready': self.ability_cooldowns.get(ability_id, 0) <= 0,
                    'target_type': ability.target_type.name,
                    'range': ability.range,
                })
        return ability_list

    def get_passive_info(self) -> list:
        """Get serializable info about player's passive abilities."""
        passive_list = []
        for ability_id in self.passive_abilities:
            ability = self.abilities.get(ability_id)
            if ability:
                passive_list.append({
                    'id': ability_id,
                    'name': ability.name,
                    'description': ability.description,
                    'bonus': ability.passive_bonus,
                })
        return passive_list

    # ========== Race Trait Methods ==========

    def get_xp_multiplier(self) -> float:
        """Get XP multiplier from race trait + feats."""
        multiplier = 1.0
        # Human's Adaptive trait gives +10%
        if self.race_trait == 'adaptive':
            multiplier += 0.10
        # Add feat XP bonus
        multiplier += self.get_xp_feat_bonus()
        return multiplier

    def get_vision_bonus(self) -> int:
        """Get vision range bonus from race trait + feats."""
        bonus = 0
        # Elf's Keen Sight gives +2
        if self.race_trait == 'keen_sight':
            bonus += 2
        # Add feat vision bonus
        bonus += self.get_vision_feat_bonus()
        return bonus

    def get_dodge_chance(self) -> float:
        """Get dodge chance from race trait + feats."""
        chance = 0.0
        # Halfling's Lucky gives 15%
        if self.race_trait == 'lucky':
            chance += 0.15
        # Add feat dodge bonus
        chance += self.get_total_dodge_bonus()
        return min(chance, 0.50)  # Cap at 50%

    def get_poison_resistance(self) -> float:
        """Get poison resistance (Dwarf's Poison Resist gives 50%)."""
        if self.race_trait == 'poison_resist':
            return 0.50
        return 0.0

    def get_rage_multiplier(self) -> float:
        """Get damage multiplier from Orc's Rage (50% bonus when below 25% HP)."""
        if self.race_trait == 'rage':
            if self.health <= self.max_health * 0.25:
                return 1.50
        return 1.0

    # ========== Class Passive Methods ==========

    def get_melee_damage_bonus(self) -> float:
        """Get melee damage bonus from Combat Mastery passive."""
        if 'combat_mastery' in self.passive_abilities:
            return PLAYER_ABILITIES['combat_mastery'].passive_bonus
        return 0.0

    def get_damage_reduction(self) -> float:
        """Get damage reduction from class passive + feats."""
        reduction = 0.0
        # Mage's Mana Shield passive
        if 'mana_shield' in self.passive_abilities:
            reduction += PLAYER_ABILITIES['mana_shield'].passive_bonus
        # Add feat resistance
        reduction += self.get_total_resistance()
        return min(reduction, 0.75)  # Cap at 75%

    def get_crit_chance(self) -> float:
        """Get critical strike chance from class passive + feats."""
        chance = 0.0
        # Rogue's Critical Strike passive
        if 'critical_strike' in self.passive_abilities:
            chance += PLAYER_ABILITIES['critical_strike'].passive_bonus
        # Add feat crit bonus
        chance += self.get_total_crit_bonus()
        return min(chance, 0.75)  # Cap at 75%

    # ========== Feat Methods ==========

    def has_feat(self, feat_id: str) -> bool:
        """Check if player has a specific feat."""
        return feat_id in self.feats

    def add_feat(self, feat_id: str) -> bool:
        """Add a feat to the player and apply its stat bonuses.

        Returns:
            True if feat was added, False if already owned or invalid
        """
        if feat_id in self.feats:
            return False

        feat = get_feat(feat_id)
        if not feat:
            return False

        self.feats.append(feat_id)

        # Apply permanent stat bonuses
        if feat.hp_bonus != 0:
            self.max_health += feat.hp_bonus
            self.health = min(self.health + max(0, feat.hp_bonus), self.max_health)
        if feat.atk_bonus != 0:
            self.base_attack += feat.atk_bonus
            self.attack_damage += feat.atk_bonus
        if feat.def_bonus != 0:
            self.base_defense += feat.def_bonus
            self._recalculate_defense()

        # Clear pending selection
        self.pending_feat_selection = False

        return True

    def get_feat_info(self) -> list:
        """Get serializable info about player's feats."""
        feat_list = []
        for feat_id in self.feats:
            feat = get_feat(feat_id)
            if feat:
                feat_list.append({
                    'id': feat_id,
                    'name': feat.name,
                    'description': feat.description,
                    'category': feat.category.name,
                })
        return feat_list

    def get_available_feats_info(self) -> list:
        """Get serializable info about feats available for selection."""
        available = get_available_feats(self.feats)
        return [
            {
                'id': f.id,
                'name': f.name,
                'description': f.description,
                'category': f.category.name,
            }
            for f in available
        ]

    # ========== Feat Bonus Aggregators (delegated to player_feats) ==========

    def get_total_damage_multiplier(self) -> float:
        """Get total damage multiplier from all feats."""
        return player_feats.get_total_damage_multiplier(self.feats)

    def get_total_crit_bonus(self) -> float:
        """Get total crit bonus from feats."""
        return player_feats.get_total_crit_bonus(self.feats)

    def get_total_dodge_bonus(self) -> float:
        """Get total dodge bonus from feats."""
        return player_feats.get_total_dodge_bonus(self.feats)

    def get_total_block_bonus(self) -> float:
        """Get total block bonus from feats."""
        return player_feats.get_total_block_bonus(self.feats)

    def get_total_resistance(self) -> float:
        """Get total damage resistance from feats."""
        return player_feats.get_total_resistance(self.feats)

    def get_life_steal(self) -> float:
        """Get life steal percentage from feats."""
        return player_feats.get_life_steal(self.feats)

    def get_thorns_damage(self) -> float:
        """Get thorns damage percentage from feats."""
        return player_feats.get_thorns_damage(self.feats)

    def get_xp_feat_bonus(self) -> float:
        """Get XP bonus from feats (not race trait)."""
        return player_feats.get_xp_feat_bonus(self.feats)

    def get_vision_feat_bonus(self) -> int:
        """Get vision bonus from feats."""
        return player_feats.get_vision_feat_bonus(self.feats)

    def get_heal_bonus(self) -> float:
        """Get healing effectiveness bonus from feats."""
        return player_feats.get_heal_bonus(self.feats)

    def has_first_strike(self) -> bool:
        """Check if player has first strike feat."""
        return player_feats.has_first_strike(self.feats)

    # ========== Ability Score Methods ==========

    def get_str_mod(self) -> int:
        """Get Strength modifier."""
        return self.ability_scores.str_mod

    def get_dex_mod(self) -> int:
        """Get Dexterity modifier."""
        return self.ability_scores.dex_mod

    def get_con_mod(self) -> int:
        """Get Constitution modifier."""
        return self.ability_scores.con_mod

    def get_luck_mod(self) -> int:
        """Get Luck modifier."""
        return self.ability_scores.luck_mod

    @property
    def armor_class(self) -> int:
        """Calculate armor class (AC).

        Base AC = 10 + DEX modifier + armor bonus + shield bonus
        """
        base_ac = 10 + self.ability_scores.dex_mod

        # Add armor bonus
        if self.equipped_armor:
            base_ac += getattr(self.equipped_armor, 'armor_class_bonus', 0)

        # Add shield bonus
        if self.equipped_off_hand:
            base_ac += getattr(self.equipped_off_hand, 'shield_ac_bonus', 0)

        return base_ac

    def get_attack_modifier(self) -> int:
        """Get attack roll modifier based on weapon type.

        Melee weapons use STR, ranged weapons use DEX.
        """
        if self.equipped_weapon and getattr(self.equipped_weapon, 'is_ranged', False):
            return self.ability_scores.dex_mod
        return self.ability_scores.str_mod

    def get_damage_modifier(self) -> int:
        """Get damage roll modifier based on weapon type.

        Melee weapons use STR, ranged weapons use DEX.
        """
        if self.equipped_weapon and getattr(self.equipped_weapon, 'is_ranged', False):
            return self.ability_scores.dex_mod
        return self.ability_scores.str_mod

    def get_ability_scores_info(self) -> dict:
        """Get serializable info about player's ability scores for frontend."""
        return self.ability_scores.to_dict()
