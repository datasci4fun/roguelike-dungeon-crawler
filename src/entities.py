"""Game entities: Player and Enemy classes."""
from dataclasses import dataclass
from typing import Tuple
import math

from .constants import (
    PLAYER_SYMBOL, PLAYER_MAX_HEALTH, PLAYER_ATTACK_DAMAGE,
    ENEMY_SYMBOL, ENEMY_MAX_HEALTH, ENEMY_ATTACK_DAMAGE, ENEMY_CHASE_RANGE
)
from .items import Inventory


@dataclass
class Entity:
    """Base class for all game entities."""
    x: int
    y: int
    symbol: str
    max_health: int
    health: int
    attack_damage: int

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


class Player(Entity):
    """The player character."""

    def __init__(self, x: int, y: int):
        super().__init__(
            x=x,
            y=y,
            symbol=PLAYER_SYMBOL,
            max_health=PLAYER_MAX_HEALTH,
            health=PLAYER_MAX_HEALTH,
            attack_damage=PLAYER_ATTACK_DAMAGE
        )
        self.kills = 0
        self.inventory = Inventory(max_size=10)

        # XP and leveling
        self.level = 1
        self.xp = 0
        self.xp_to_next_level = self._calculate_xp_for_next_level()

    def _calculate_xp_for_next_level(self) -> int:
        """Calculate XP required to reach next level."""
        from .constants import XP_BASE_REQUIREMENT
        return self.level * XP_BASE_REQUIREMENT

    def gain_xp(self, amount: int) -> bool:
        """
        Gain XP and check for level up.

        Returns:
            True if player leveled up, False otherwise
        """
        from .constants import MAX_PLAYER_LEVEL, HP_GAIN_PER_LEVEL, ATK_GAIN_PER_LEVEL

        self.xp += amount

        # Check for level up
        if self.xp >= self.xp_to_next_level and self.level < MAX_PLAYER_LEVEL:
            self.level += 1

            # Increase stats and heal to full
            self.max_health += HP_GAIN_PER_LEVEL
            self.health = self.max_health  # Full heal on level up
            self.attack_damage += ATK_GAIN_PER_LEVEL

            # Calculate next level requirement
            self.xp_to_next_level = self._calculate_xp_for_next_level()

            return True

        return False

    def move(self, dx: int, dy: int):
        """Move the player by the given offset."""
        self.x += dx
        self.y += dy


class Enemy(Entity):
    """An enemy entity."""

    def __init__(self, x: int, y: int, is_elite: bool = False):
        from .constants import (
            ELITE_HP_MULTIPLIER, ELITE_DAMAGE_MULTIPLIER, ELITE_SYMBOL
        )

        # Calculate elite stats
        hp = ENEMY_MAX_HEALTH * ELITE_HP_MULTIPLIER if is_elite else ENEMY_MAX_HEALTH
        damage = ENEMY_ATTACK_DAMAGE * ELITE_DAMAGE_MULTIPLIER if is_elite else ENEMY_ATTACK_DAMAGE

        super().__init__(
            x=x,
            y=y,
            symbol=ELITE_SYMBOL if is_elite else ENEMY_SYMBOL,
            max_health=hp,
            health=hp,
            attack_damage=damage
        )
        self.is_elite = is_elite

    def get_move_toward_player(self, player_x: int, player_y: int, is_walkable_func) -> Tuple[int, int]:
        """
        Calculate a move toward the player using simple pathfinding.
        Returns (dx, dy) for the next move, or (0, 0) if no valid move.
        """
        # Check if player is in chase range
        distance = self.distance_to(player_x, player_y)
        if distance > ENEMY_CHASE_RANGE:
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
