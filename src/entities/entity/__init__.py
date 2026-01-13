"""Entity package for game entities.

This package contains the core entity classes:
- Entity: Base class with common functionality
- Player: The player character with equipment, abilities, and feats
- Enemy: Enemy entities with AI, bosses, and elemental abilities

Usage:
    from src.entities.entity import Entity, Player, Enemy
"""

from .base import Entity
from .player import Player
from .enemy import Enemy

__all__ = [
    'Entity',
    'Player',
    'Enemy',
]
