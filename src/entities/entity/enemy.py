"""Enemy entity class."""
from typing import Tuple

from ...core.constants import ENEMY_CHASE_RANGE
from .base import Entity


class Enemy(Entity):
    """An enemy entity.

    Handles enemy types, elite status, boss configuration,
    AI behavior, and elemental abilities.
    """

    def __init__(self, x: int, y: int, enemy_type=None, is_elite: bool = False):
        from ...core.constants import (
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

        # v4.0 Element cycling attributes (for ELEMENTAL AI)
        self.current_element = self.element  # Start with base element
        self.element_cycle_turns = 0  # Turns until next cycle

        # Level restrictions for spawning
        self.min_level = stats.get('min_level', 1)
        self.max_level = stats.get('max_level', 5)

    def tick_element_cycle(self):
        """Tick the element cycle timer and cycle if needed.

        Returns:
            Tuple of (cycled: bool, new_element: ElementType, message: str)
        """
        from ...core.constants import (
            AIBehavior, ElementType, ELEMENT_CYCLE_TURNS, ELEMENT_CYCLE_ORDER
        )

        # Only ELEMENTAL AI enemies cycle elements
        if self.ai_type != AIBehavior.ELEMENTAL:
            return False, self.current_element, ""

        # Increment cycle counter
        self.element_cycle_turns += 1

        # Check if it's time to cycle
        if self.element_cycle_turns >= ELEMENT_CYCLE_TURNS:
            self.element_cycle_turns = 0

            # Find current position in cycle order
            if self.current_element in ELEMENT_CYCLE_ORDER:
                current_idx = ELEMENT_CYCLE_ORDER.index(self.current_element)
                next_idx = (current_idx + 1) % len(ELEMENT_CYCLE_ORDER)
                new_element = ELEMENT_CYCLE_ORDER[next_idx]
            else:
                # Start cycling from the first element
                new_element = ELEMENT_CYCLE_ORDER[0]

            old_element = self.current_element
            self.current_element = new_element

            # Update resistances based on new element
            self._update_resistances_for_element()

            # Generate cycling message
            element_names = {
                ElementType.FIRE: "FIRE",
                ElementType.ICE: "ICE",
                ElementType.LIGHTNING: "LIGHTNING",
            }
            new_name = element_names.get(new_element, str(new_element.name))
            message = f"The {self.name} shifts... now attuned to {new_name}!"

            return True, new_element, message

        return False, self.current_element, ""

    def _update_resistances_for_element(self):
        """Update resistances based on current element."""
        from ...core.constants import ElementType

        # Clear previous elemental resistances
        element_keys = ['fire', 'ice', 'lightning', 'dark']
        for key in element_keys:
            self.resistances.pop(key, None)

        # Add immunity to current element
        element_resistance_map = {
            ElementType.FIRE: 'fire',
            ElementType.ICE: 'ice',
            ElementType.LIGHTNING: 'lightning',
            ElementType.DARK: 'dark',
        }

        resistance_key = element_resistance_map.get(self.current_element)
        if resistance_key:
            self.resistances[resistance_key] = 1.0  # Immune to current element

    def make_boss(self, boss_type):
        """Configure this enemy as a boss."""
        from ...core.constants import BOSS_STATS

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
        """Process boss turn with ability usage.

        Returns:
            Tuple of (used_ability, message, damage_dealt) or None if normal move
        """
        from ..abilities import execute_ability, BOSS_ABILITIES

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
        from ..abilities import BOSS_ABILITIES, AbilityType

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
        """Calculate a move toward the player using simple pathfinding.

        Returns (dx, dy) for the next move, or (0, 0) if no valid move.
        """
        from ...core.constants import BOSS_CHASE_RANGE

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
