"""Game entities: Player and Enemy classes."""
from dataclasses import dataclass, field
from typing import Tuple, List, Optional, Dict
import math

from ..core.constants import (
    PLAYER_SYMBOL, PLAYER_MAX_HEALTH, PLAYER_ATTACK_DAMAGE,
    ENEMY_SYMBOL, ENEMY_MAX_HEALTH, ENEMY_ATTACK_DAMAGE, ENEMY_CHASE_RANGE,
    StatusEffectType, Race, PlayerClass, RACE_STATS, CLASS_STATS
)
from ..items import Inventory
from .status_effects import StatusEffectManager
from .player_abilities import (
    PlayerAbility, AbilityCategory, get_abilities_for_class, PLAYER_ABILITIES
)
from .feats import Feat, FEATS, get_feat, get_available_feats, should_gain_feat_at_level, FEAT_LEVELS


@dataclass
class Entity:
    """Base class for all game entities."""
    x: int
    y: int
    symbol: str
    max_health: int
    health: int
    attack_damage: int
    status_effects: StatusEffectManager = field(default_factory=StatusEffectManager)

    def is_alive(self) -> bool:
        """Check if entity is still alive."""
        return self.health > 0

    def take_damage(self, damage: int) -> int:
        """Take damage and return actual damage taken."""
        actual_damage = min(damage, self.health)
        self.health -= actual_damage
        return actual_damage

    def distance_to(self, x: int, y: int) -> float:
        """Calculate Euclidean distance to a position."""
        return math.sqrt((self.x - x) ** 2 + (self.y - y) ** 2)

    # v4.0 Status effect methods
    def apply_status_effect(self, effect_type: StatusEffectType, source: Optional[str] = None) -> str:
        """Apply a status effect to this entity."""
        return self.status_effects.apply_effect(effect_type, source)

    def has_status_effect(self, effect_type: StatusEffectType) -> bool:
        """Check if entity has a specific status effect."""
        return self.status_effects.has_effect(effect_type)

    def process_status_effects(self) -> List[dict]:
        """Process all status effects for one turn. Returns list of results."""
        results = self.status_effects.tick()
        # Apply damage from effects
        for result in results:
            if result['damage'] > 0:
                self.health -= result['damage']
                self.health = max(0, self.health)
        return results

    def is_stunned(self) -> bool:
        """Check if entity is currently stunned."""
        return self.status_effects.is_stunned()

    def get_movement_penalty(self) -> float:
        """Get movement penalty from status effects."""
        return self.status_effects.get_movement_penalty()

    def clear_status_effects(self):
        """Remove all status effects."""
        self.status_effects.clear_all()


class Player(Entity):
    """The player character."""

    def __init__(self, x: int, y: int, race: Race = None, player_class: PlayerClass = None):
        # Calculate stats from race + class, or use defaults
        if race and player_class:
            race_stats = RACE_STATS[race]
            class_stats = CLASS_STATS[player_class]

            # Base stats + race + class modifiers
            base_hp = 20
            base_atk = 3
            base_def = 0

            max_hp = base_hp + race_stats['hp_modifier'] + class_stats['hp_modifier']
            attack = base_atk + race_stats['atk_modifier'] + class_stats['atk_modifier']
            defense = max(0, base_def + race_stats['def_modifier'] + class_stats['def_modifier'])
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

    def _calculate_xp_for_next_level(self) -> int:
        """Calculate XP required to reach next level."""
        from ..core.constants import XP_BASE_REQUIREMENT
        return self.level * XP_BASE_REQUIREMENT

    def gain_xp(self, amount: int) -> bool:
        """
        Gain XP and check for level up.

        Returns:
            True if player leveled up, False otherwise
        """
        from ..core.constants import MAX_PLAYER_LEVEL, HP_GAIN_PER_LEVEL, ATK_GAIN_PER_LEVEL

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

    def equip(self, item) -> str:
        """
        Equip a weapon or armor item.
        Returns a message describing what happened.
        """
        from ..core.constants import EquipmentSlot
        from ..items import Weapon, Armor

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
        """
        Unequip item from a slot and add it to inventory.
        Returns a message describing what happened.
        """
        from ..core.constants import EquipmentSlot

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
        """
        Add a feat to the player and apply its stat bonuses.

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

    # ========== Feat Bonus Aggregators ==========

    def get_total_damage_multiplier(self) -> float:
        """Get total damage multiplier from all feats."""
        multiplier = 1.0
        for feat_id in self.feats:
            feat = get_feat(feat_id)
            if feat and feat.damage_multiplier > 0:
                multiplier *= (1 + feat.damage_multiplier)
        return multiplier

    def get_total_crit_bonus(self) -> float:
        """Get total crit bonus from feats."""
        bonus = 0.0
        for feat_id in self.feats:
            feat = get_feat(feat_id)
            if feat:
                bonus += feat.crit_bonus
        return bonus

    def get_total_dodge_bonus(self) -> float:
        """Get total dodge bonus from feats."""
        bonus = 0.0
        for feat_id in self.feats:
            feat = get_feat(feat_id)
            if feat:
                bonus += feat.dodge_bonus
        return bonus

    def get_total_block_bonus(self) -> float:
        """Get total block bonus from feats."""
        bonus = 0.0
        for feat_id in self.feats:
            feat = get_feat(feat_id)
            if feat:
                bonus += feat.block_bonus
        return bonus

    def get_total_resistance(self) -> float:
        """Get total damage resistance from feats."""
        resistance = 0.0
        for feat_id in self.feats:
            feat = get_feat(feat_id)
            if feat:
                resistance += feat.resistance_all
        return min(resistance, 0.75)  # Cap at 75%

    def get_life_steal(self) -> float:
        """Get life steal percentage from feats."""
        steal = 0.0
        for feat_id in self.feats:
            feat = get_feat(feat_id)
            if feat:
                steal += feat.life_steal
        return steal

    def get_thorns_damage(self) -> float:
        """Get thorns damage percentage from feats."""
        thorns = 0.0
        for feat_id in self.feats:
            feat = get_feat(feat_id)
            if feat:
                thorns += feat.thorns
        return thorns

    def get_xp_feat_bonus(self) -> float:
        """Get XP bonus from feats (not race trait)."""
        bonus = 0.0
        for feat_id in self.feats:
            feat = get_feat(feat_id)
            if feat:
                bonus += feat.xp_bonus
        return bonus

    def get_vision_feat_bonus(self) -> int:
        """Get vision bonus from feats."""
        bonus = 0
        for feat_id in self.feats:
            feat = get_feat(feat_id)
            if feat:
                bonus += feat.vision_bonus
        return bonus

    def get_heal_bonus(self) -> float:
        """Get healing effectiveness bonus from feats."""
        bonus = 0.0
        for feat_id in self.feats:
            feat = get_feat(feat_id)
            if feat:
                bonus += feat.heal_bonus
        return bonus

    def has_first_strike(self) -> bool:
        """Check if player has first strike feat."""
        for feat_id in self.feats:
            feat = get_feat(feat_id)
            if feat and feat.first_strike:
                return True
        return False


class Enemy(Entity):
    """An enemy entity."""

    def __init__(self, x: int, y: int, enemy_type=None, is_elite: bool = False):
        from ..core.constants import (
            ELITE_HP_MULTIPLIER, ELITE_DAMAGE_MULTIPLIER,
            ENEMY_STATS, EnemyType, AIBehavior, ElementType
        )

        # Default to SKELETON if no type specified (for backward compatibility)
        if enemy_type is None:
            enemy_type = EnemyType.SKELETON

        # Get base stats from enemy type
        stats = ENEMY_STATS[enemy_type]
        base_hp = stats['hp']
        base_damage = stats['damage']
        base_symbol = stats['symbol']

        # Apply elite multipliers
        hp = base_hp * ELITE_HP_MULTIPLIER if is_elite else base_hp
        damage = base_damage * ELITE_DAMAGE_MULTIPLIER if is_elite else base_damage

        # Elite enemies use uppercase symbols
        if is_elite:
            symbol = base_symbol.upper()
        else:
            symbol = base_symbol

        super().__init__(
            x=x,
            y=y,
            symbol=symbol,
            max_health=hp,
            health=hp,
            attack_damage=damage
        )
        self.is_elite = is_elite
        self.enemy_type = enemy_type
        self.xp_reward = stats['xp']  # Base XP reward (elite multiplier applied at kill time)
        self.name = stats['name']  # Enemy name for messages

        # Boss attributes (set by make_boss())
        self.is_boss = False
        self.boss_type = None
        self.buff_turns = {}  # Active buffs with remaining turns
        self.base_attack_damage = damage  # Store base for buff calculations
        self.buffed_damage = None  # Damage when buffed

        # v4.0 AI and ability attributes
        self.ai_type = stats.get('ai_type', AIBehavior.CHASE)
        self.abilities = stats.get('abilities', [])
        self.ability_cooldowns = {a: 0 for a in self.abilities}
        self.element = stats.get('element', ElementType.NONE)
        self.resistances = stats.get('resistances', {})

        # v4.0 Stealth attributes
        self.is_invisible = False

        # Level restrictions for spawning
        self.min_level = stats.get('min_level', 1)
        self.max_level = stats.get('max_level', 5)

    def make_boss(self, boss_type):
        """Configure this enemy as a boss."""
        from ..core.constants import BOSS_STATS

        stats = BOSS_STATS[boss_type]
        self.is_boss = True
        self.boss_type = boss_type
        self.symbol = stats['symbol']
        self.name = stats['name']
        self.max_health = stats['hp']
        self.health = stats['hp']
        self.attack_damage = stats['damage']
        self.base_attack_damage = stats['damage']
        self.xp_reward = stats['xp']
        self.abilities = stats['abilities']
        self.ability_cooldowns = {a: 0 for a in self.abilities}
        self.is_elite = False  # Bosses aren't elite
        self.enemy_type = None  # Bosses don't use enemy types

    def process_boss_turn(self, player, dungeon, entity_manager):
        """
        Process boss turn with ability usage.

        Returns:
            Tuple of (used_ability, message, damage_dealt) or None if normal move
        """
        from .abilities import execute_ability, BOSS_ABILITIES

        # Tick down cooldowns
        for ability in list(self.ability_cooldowns.keys()):
            if self.ability_cooldowns[ability] > 0:
                self.ability_cooldowns[ability] -= 1

        # Tick down buffs
        expired_buffs = []
        for buff, turns in list(self.buff_turns.items()):
            self.buff_turns[buff] -= 1
            if self.buff_turns[buff] <= 0:
                expired_buffs.append(buff)

        # Remove expired buffs
        for buff in expired_buffs:
            del self.buff_turns[buff]
            if buff == 'war_cry':
                self.buffed_damage = None  # Remove damage buff

        # Try to use abilities
        for ability_name in self.abilities:
            if self._should_use_ability(ability_name, player):
                success, message, damage = execute_ability(
                    ability_name, self, player, dungeon, entity_manager
                )
                if success:
                    # Set cooldown
                    ability = BOSS_ABILITIES[ability_name]
                    self.ability_cooldowns[ability_name] = ability.cooldown
                    return (True, message, damage)

        # No ability used, do normal move
        return None

    def _should_use_ability(self, ability_name: str, player) -> bool:
        """Determine if boss should use an ability."""
        from .abilities import BOSS_ABILITIES, AbilityType

        # Check if ability is on cooldown
        if self.ability_cooldowns.get(ability_name, 0) > 0:
            return False

        ability = BOSS_ABILITIES.get(ability_name)
        if not ability:
            return False

        distance = self.distance_to(player.x, player.y)

        # Regenerate only when low HP
        if ability_name == 'regenerate':
            return self.health < self.max_health // 2

        # Summon abilities: use when player is close but not adjacent
        if ability.ability_type == AbilityType.SUMMON:
            return 2 <= distance <= 5

        # Buff abilities: use when player is approaching
        if ability.ability_type == AbilityType.BUFF:
            return distance <= 4 and ability_name not in self.buff_turns

        # Ranged/AOE abilities: use when in range
        if ability.ability_type in (AbilityType.RANGED, AbilityType.AOE_ATTACK):
            return distance <= ability.range + 1

        # Teleport: use when low HP and player is close
        if ability_name == 'teleport':
            return self.health < self.max_health // 3 and distance <= 2

        # Life drain: use when in range
        if ability_name == 'life_drain':
            return distance <= ability.range

        return False

    @property
    def effective_damage(self) -> int:
        """Get current attack damage including buffs."""
        if self.buffed_damage is not None:
            return self.buffed_damage
        return self.attack_damage

    def get_move_toward_player(self, player_x: int, player_y: int, is_walkable_func) -> Tuple[int, int]:
        """
        Calculate a move toward the player using simple pathfinding.
        Returns (dx, dy) for the next move, or (0, 0) if no valid move.
        """
        from ..core.constants import BOSS_CHASE_RANGE

        # Check if player is in chase range (bosses have larger range)
        chase_range = BOSS_CHASE_RANGE if self.is_boss else ENEMY_CHASE_RANGE
        distance = self.distance_to(player_x, player_y)
        if distance > chase_range:
            return (0, 0)

        # Try to move toward player
        dx = 0
        dy = 0

        if player_x > self.x:
            dx = 1
        elif player_x < self.x:
            dx = -1

        if player_y > self.y:
            dy = 1
        elif player_y < self.y:
            dy = -1

        # Try to move on both axes
        if dx != 0 and dy != 0:
            # Try diagonal direction that gets closer
            if is_walkable_func(self.x + dx, self.y + dy):
                return (dx, dy)
            # Try just horizontal
            elif is_walkable_func(self.x + dx, self.y):
                return (dx, 0)
            # Try just vertical
            elif is_walkable_func(self.x, self.y + dy):
                return (0, dy)
        elif dx != 0:
            # Only horizontal movement needed
            if is_walkable_func(self.x + dx, self.y):
                return (dx, 0)
        elif dy != 0:
            # Only vertical movement needed
            if is_walkable_func(self.x, self.y + dy):
                return (0, dy)

        return (0, 0)

    def move(self, dx: int, dy: int):
        """Move the enemy by the given offset."""
        self.x += dx
        self.y += dy
