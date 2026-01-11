"""Centralized lore item IDs with validation.

This module defines all valid lore IDs and provides validation to catch
typos and ensure lore references are consistent across the codebase.

IMPORTANT: The floor assignments here must match the level_hint values
in story_data.py. Check that file when adding new lore.
"""
from typing import Set, Optional


# =============================================================================
# Floor 1 - Stone Dungeon (Prison theme)
# =============================================================================
LORE_JOURNAL_ADVENTURER_1 = "journal_adventurer_1"
LORE_WARNING_STONE = "warning_stone"

FLOOR_1_LORE_IDS: Set[str] = {
    LORE_JOURNAL_ADVENTURER_1,
    LORE_WARNING_STONE,
}

# =============================================================================
# Floor 2 - Ice Cavern (level_hint=2 in story_data)
# =============================================================================
LORE_FROZEN_EXPLORER = "frozen_explorer"
LORE_ICE_WARNING = "ice_warning"

FLOOR_2_LORE_IDS: Set[str] = {
    LORE_FROZEN_EXPLORER,
    LORE_ICE_WARNING,
}

# =============================================================================
# Floor 3 - Forest Depths (Nature/spider theme)
# =============================================================================
LORE_DRUID_LOG = "druid_log"
LORE_WEBBED_NOTE = "webbed_note"

FLOOR_3_LORE_IDS: Set[str] = {
    LORE_DRUID_LOG,
    LORE_WEBBED_NOTE,
}

# =============================================================================
# Floor 4 - Volcanic Depths (level_hint=4 in story_data)
# =============================================================================
LORE_SMITH_JOURNAL = "smith_journal"
LORE_OBSIDIAN_TABLET = "obsidian_tablet"

FLOOR_4_LORE_IDS: Set[str] = {
    LORE_SMITH_JOURNAL,
    LORE_OBSIDIAN_TABLET,
}

# =============================================================================
# Floor 5 - Ancient Crypt (level_hint=5 in story_data)
# =============================================================================
LORE_CRYPT_INSCRIPTION = "crypt_inscription"
LORE_PRIEST_CONFESSION = "priest_confession"

FLOOR_5_LORE_IDS: Set[str] = {
    LORE_CRYPT_INSCRIPTION,
    LORE_PRIEST_CONFESSION,
}

# =============================================================================
# Floor 6 - Sewers (level_hint=6 in story_data)
# =============================================================================
LORE_SEWER_WORKER = "sewer_worker"
LORE_PLAGUE_WARNING = "plague_warning"

FLOOR_6_LORE_IDS: Set[str] = {
    LORE_SEWER_WORKER,
    LORE_PLAGUE_WARNING,
}

# =============================================================================
# Floor 7 - Ancient Library (level_hint=7 in story_data)
# =============================================================================
LORE_WIZARD_RESEARCH = "wizard_research"
LORE_HISTORY_VALDRIS = "history_valdris"

FLOOR_7_LORE_IDS: Set[str] = {
    LORE_WIZARD_RESEARCH,
    LORE_HISTORY_VALDRIS,
}

# =============================================================================
# Floor 8 - Crystal Cave / Dragon's Lair
# =============================================================================
LORE_DRAGON_PACT = "dragon_pact"
LORE_FINAL_ENTRY = "final_entry"

FLOOR_8_LORE_IDS: Set[str] = {
    LORE_DRAGON_PACT,
    LORE_FINAL_ENTRY,
}

# =============================================================================
# Combined set of all valid lore IDs
# =============================================================================
ALL_LORE_IDS: Set[str] = (
    FLOOR_1_LORE_IDS |
    FLOOR_2_LORE_IDS |
    FLOOR_3_LORE_IDS |
    FLOOR_4_LORE_IDS |
    FLOOR_5_LORE_IDS |
    FLOOR_6_LORE_IDS |
    FLOOR_7_LORE_IDS |
    FLOOR_8_LORE_IDS
)

# Floor-indexed lore IDs (matches level_hint in story_data.py)
FLOOR_LORE_IDS = {
    1: FLOOR_1_LORE_IDS,
    2: FLOOR_2_LORE_IDS,
    3: FLOOR_3_LORE_IDS,
    4: FLOOR_4_LORE_IDS,
    5: FLOOR_5_LORE_IDS,
    6: FLOOR_6_LORE_IDS,
    7: FLOOR_7_LORE_IDS,
    8: FLOOR_8_LORE_IDS,
}


def is_valid_lore_id(lore_id: str) -> bool:
    """Check if a lore ID is valid."""
    return lore_id in ALL_LORE_IDS


def get_lore_ids_for_floor(floor: int) -> Set[str]:
    """Get the set of valid lore IDs for a floor."""
    return FLOOR_LORE_IDS.get(floor, set())


def validate_lore_id(lore_id: str, context: Optional[str] = None) -> str:
    """Validate a lore ID and return it, or raise ValueError if invalid.

    Args:
        lore_id: The lore ID to validate
        context: Optional context string for error messages

    Returns:
        The validated lore ID

    Raises:
        ValueError: If the lore ID is not valid
    """
    if lore_id not in ALL_LORE_IDS:
        ctx = f" (in {context})" if context else ""
        valid_ids = ", ".join(sorted(ALL_LORE_IDS))
        raise ValueError(
            f"Invalid lore ID '{lore_id}'{ctx}. "
            f"Valid IDs are: {valid_ids}"
        )
    return lore_id


def validate_story_data() -> list:
    """Validate that all lore entries in story_data.py have valid IDs.

    Returns:
        List of validation error messages (empty if valid)
    """
    from .story_data import LORE_ENTRIES

    errors = []

    # Check for unknown IDs in LORE_ENTRIES
    for lore_id in LORE_ENTRIES.keys():
        if lore_id not in ALL_LORE_IDS:
            errors.append(f"Unknown lore ID in LORE_ENTRIES: '{lore_id}'")

    # Check for missing IDs (defined in lore_items but not in story_data)
    for lore_id in ALL_LORE_IDS:
        if lore_id not in LORE_ENTRIES:
            errors.append(f"Lore ID defined but missing from LORE_ENTRIES: '{lore_id}'")

    # Check floor hints match expected floor assignments
    for lore_id, entry in LORE_ENTRIES.items():
        level_hint = entry.get("level_hint")
        if level_hint and lore_id in ALL_LORE_IDS:
            floor_ids = FLOOR_LORE_IDS.get(level_hint, set())
            if lore_id not in floor_ids:
                errors.append(
                    f"Lore '{lore_id}' has level_hint={level_hint} but is assigned to floor "
                    f"{[f for f, ids in FLOOR_LORE_IDS.items() if lore_id in ids]}"
                )

    return errors


# Run validation on module import in debug mode
def _debug_validate():
    """Run validation if DEBUG_LORE environment variable is set."""
    import os
    if os.environ.get("DEBUG_LORE"):
        errors = validate_story_data()
        if errors:
            for error in errors:
                print(f"[LORE VALIDATION ERROR] {error}")
