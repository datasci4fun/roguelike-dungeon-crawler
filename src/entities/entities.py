"""Backwards compatibility shim for entity imports.

This module re-exports Entity, Player, and Enemy from the new
src.entities.entity package to maintain backwards compatibility
with existing imports like:
    from .entities import Entity, Player, Enemy

New code should import from src.entities.entity directly:
    from .entity import Entity, Player, Enemy
"""

from .entity import Entity, Player, Enemy

__all__ = ['Entity', 'Player', 'Enemy']
