"""Game entities: Player and Enemy classes."""
from dataclasses import dataclass
from typing import Tuple
import math

from .constants import (
    PLAYER_SYMBOL, PLAYER_MAX_HEALTH, PLAYER_ATTACK_DAMAGE,
    ENEMY_SYMBOL, ENEMY_MAX_HEALTH, ENEMY_ATTACK_DAMAGE, ENEMY_CHASE_RANGE
)


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

    def move(self, dx: int, dy: int):
        """Move the player by the given offset."""
        self.x += dx
        self.y += dy


class Enemy(Entity):
    """An enemy entity."""

    def __init__(self, x: int, y: int):
        super().__init__(
            x=x,
            y=y,
            symbol=ENEMY_SYMBOL,
            max_health=ENEMY_MAX_HEALTH,
            health=ENEMY_MAX_HEALTH,
            attack_damage=ENEMY_ATTACK_DAMAGE
        )

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
