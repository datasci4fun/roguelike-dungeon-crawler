"""
Pydantic models for lore API.

Defines the data structures for lore entries and categories.
"""

from typing import Optional
from pydantic import BaseModel


class LoreEntry(BaseModel):
    """A single lore entry."""
    id: str
    title: str
    subtitle: Optional[str] = None
    content: str
    category: str
    image: Optional[str] = None


class LoreCategory(BaseModel):
    """A lore category with entries."""
    id: str
    name: str
    description: str
    icon: str
    entries: list[LoreEntry]
