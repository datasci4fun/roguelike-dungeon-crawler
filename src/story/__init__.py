"""Story and narrative system for the roguelike."""
from .story_data import (
    LEVEL_INTRO_MESSAGES,
    LORE_ENTRIES,
    ENEMY_ENCOUNTER_MESSAGES,
    get_lore_entry,
    get_level_intro,
    get_enemy_encounter_message,
    get_lore_entries_for_level
)
from .story_manager import StoryManager

__all__ = [
    'LEVEL_INTRO_MESSAGES',
    'LORE_ENTRIES',
    'ENEMY_ENCOUNTER_MESSAGES',
    'get_lore_entry',
    'get_level_intro',
    'get_enemy_encounter_message',
    'get_lore_entries_for_level',
    'StoryManager'
]
