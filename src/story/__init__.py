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
from .lore_items import (
    ALL_LORE_IDS,
    FLOOR_LORE_IDS,
    is_valid_lore_id,
    get_lore_ids_for_floor,
    validate_lore_id,
    validate_story_data,
)
from .completion import (
    EndingId,
    VictoryLegacy,
    CompletionLedger,
    VictoryLegacyResult,
    derive_victory_legacy,
    resolve_ending,
    debug_print_completion_ledger,
    COMBAT_HIGH_THRESHOLD,
    LORE_HIGH_THRESHOLD,
    SECONDARY_MESSAGES,
    SECONDARY_EFFECTS,
)

__all__ = [
    'LEVEL_INTRO_MESSAGES',
    'LORE_ENTRIES',
    'ENEMY_ENCOUNTER_MESSAGES',
    'get_lore_entry',
    'get_level_intro',
    'get_enemy_encounter_message',
    'get_lore_entries_for_level',
    'StoryManager',
    # Lore validation
    'ALL_LORE_IDS',
    'FLOOR_LORE_IDS',
    'is_valid_lore_id',
    'get_lore_ids_for_floor',
    'validate_lore_id',
    'validate_story_data',
    # Completion tracking and endings
    'EndingId',
    'VictoryLegacy',
    'CompletionLedger',
    'VictoryLegacyResult',
    'derive_victory_legacy',
    'resolve_ending',
    'debug_print_completion_ledger',
    'COMBAT_HIGH_THRESHOLD',
    'LORE_HIGH_THRESHOLD',
    'SECONDARY_MESSAGES',
    'SECONDARY_EFFECTS',
]
