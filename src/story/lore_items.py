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
# Evidence entries
EVIDENCE_DUPLICATE_PLAQUES = "evidence_duplicate_plaques"
EVIDENCE_SCRATCH_TALLIES = "evidence_scratch_tallies"

FLOOR_1_LORE_IDS: Set[str] = {
    LORE_JOURNAL_ADVENTURER_1,
    LORE_WARNING_STONE,
    EVIDENCE_DUPLICATE_PLAQUES,
    EVIDENCE_SCRATCH_TALLIES,
}

# =============================================================================
# Floor 2 - Sewers of Valdris (Circulation theme)
# =============================================================================
LORE_SEWER_WORKER = "sewer_worker"
LORE_PLAGUE_WARNING = "plague_warning"
# Evidence entries
EVIDENCE_WAX_SEALS_NESTS = "evidence_wax_seals_nests"
EVIDENCE_DECREE_FRAGMENTS = "evidence_decree_fragments"

FLOOR_2_LORE_IDS: Set[str] = {
    LORE_SEWER_WORKER,
    LORE_PLAGUE_WARNING,
    EVIDENCE_WAX_SEALS_NESTS,
    EVIDENCE_DECREE_FRAGMENTS,
}

# =============================================================================
# Floor 3 - Forest Depths (Nature/spider theme)
# =============================================================================
LORE_DRUID_LOG = "druid_log"
LORE_WEBBED_NOTE = "webbed_note"
# Evidence entries
EVIDENCE_WEB_SIGIL_GEOMETRY = "evidence_web_sigil_geometry"
EVIDENCE_ROOTS_AVOIDING_CROWN = "evidence_roots_avoiding_crown"

FLOOR_3_LORE_IDS: Set[str] = {
    LORE_DRUID_LOG,
    LORE_WEBBED_NOTE,
    EVIDENCE_WEB_SIGIL_GEOMETRY,
    EVIDENCE_ROOTS_AVOIDING_CROWN,
}

# =============================================================================
# Floor 4 - Mirror Valdris (Counterfeit palace theme)
# =============================================================================
LORE_CRYPT_INSCRIPTION = "crypt_inscription"  # Repurposed as Succession Decree
LORE_PRIEST_CONFESSION = "priest_confession"  # Repurposed as Regent's Ledger
# Evidence entries
EVIDENCE_TWO_CORONATIONS_BELL = "evidence_two_coronations_bell"
EVIDENCE_CONTRADICTORY_PLAQUES = "evidence_contradictory_plaques"

FLOOR_4_LORE_IDS: Set[str] = {
    LORE_CRYPT_INSCRIPTION,
    LORE_PRIEST_CONFESSION,
    EVIDENCE_TWO_CORONATIONS_BELL,
    EVIDENCE_CONTRADICTORY_PLAQUES,
}

# =============================================================================
# Floor 5 - Ice Cavern (Stasis theme)
# =============================================================================
LORE_FROZEN_EXPLORER = "frozen_explorer"
LORE_ICE_WARNING = "ice_warning"
# Evidence entries
EVIDENCE_REPEATING_DAY_12 = "evidence_repeating_day_12"
EVIDENCE_THAW_NEVER_COMPLETES = "evidence_thaw_never_completes"

FLOOR_5_LORE_IDS: Set[str] = {
    LORE_FROZEN_EXPLORER,
    LORE_ICE_WARNING,
    EVIDENCE_REPEATING_DAY_12,
    EVIDENCE_THAW_NEVER_COMPLETES,
}

# =============================================================================
# Floor 6 - Ancient Library (Cognition theme)
# =============================================================================
LORE_WIZARD_RESEARCH = "wizard_research"
LORE_HISTORY_VALDRIS = "history_valdris"
# Evidence entries
EVIDENCE_SELF_CATALOGING_SHELVES = "evidence_self_cataloging_shelves"
EVIDENCE_FINAL_VERSION_LABELS = "evidence_final_version_labels"

FLOOR_6_LORE_IDS: Set[str] = {
    LORE_WIZARD_RESEARCH,
    LORE_HISTORY_VALDRIS,
    EVIDENCE_SELF_CATALOGING_SHELVES,
    EVIDENCE_FINAL_VERSION_LABELS,
}

# =============================================================================
# Floor 7 - Volcanic Depths (Transformation theme)
# =============================================================================
LORE_SMITH_JOURNAL = "smith_journal"
LORE_OBSIDIAN_TABLET = "obsidian_tablet"
# Evidence entries
EVIDENCE_MELTED_CREST = "evidence_melted_crest"
EVIDENCE_RUNE_PLATES_STAMPED = "evidence_rune_plates_stamped"

FLOOR_7_LORE_IDS: Set[str] = {
    LORE_SMITH_JOURNAL,
    LORE_OBSIDIAN_TABLET,
    EVIDENCE_MELTED_CREST,
    EVIDENCE_RUNE_PLATES_STAMPED,
}

# =============================================================================
# Floor 8 - Crystal Cave / Dragon's Lair (Integration theme)
# =============================================================================
LORE_DRAGON_PACT = "dragon_pact"
LORE_FINAL_ENTRY = "final_entry"
# Evidence entries
EVIDENCE_MISSING_SIGIL_SEGMENT = "evidence_missing_sigil_segment"
EVIDENCE_DOUBLE_SHADOW_REFRACTION = "evidence_double_shadow_refraction"

FLOOR_8_LORE_IDS: Set[str] = {
    LORE_DRAGON_PACT,
    LORE_FINAL_ENTRY,
    EVIDENCE_MISSING_SIGIL_SEGMENT,
    EVIDENCE_DOUBLE_SHADOW_REFRACTION,
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

# Floor-indexed evidence lore IDs (for zone evidence discovery)
FLOOR_EVIDENCE_IDS = {
    1: [EVIDENCE_DUPLICATE_PLAQUES, EVIDENCE_SCRATCH_TALLIES],
    2: [EVIDENCE_WAX_SEALS_NESTS, EVIDENCE_DECREE_FRAGMENTS],
    3: [EVIDENCE_WEB_SIGIL_GEOMETRY, EVIDENCE_ROOTS_AVOIDING_CROWN],
    4: [EVIDENCE_TWO_CORONATIONS_BELL, EVIDENCE_CONTRADICTORY_PLAQUES],
    5: [EVIDENCE_REPEATING_DAY_12, EVIDENCE_THAW_NEVER_COMPLETES],
    6: [EVIDENCE_SELF_CATALOGING_SHELVES, EVIDENCE_FINAL_VERSION_LABELS],
    7: [EVIDENCE_MELTED_CREST, EVIDENCE_RUNE_PLATES_STAMPED],
    8: [EVIDENCE_MISSING_SIGIL_SEGMENT, EVIDENCE_DOUBLE_SHADOW_REFRACTION],
}


def is_valid_lore_id(lore_id: str) -> bool:
    """Check if a lore ID is valid."""
    return lore_id in ALL_LORE_IDS


def get_lore_ids_for_floor(floor: int) -> Set[str]:
    """Get the set of valid lore IDs for a floor."""
    return FLOOR_LORE_IDS.get(floor, set())


def get_evidence_ids_for_floor(floor: int) -> list:
    """Get the list of evidence lore IDs for a floor (for zone evidence discovery)."""
    return FLOOR_EVIDENCE_IDS.get(floor, [])


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

    # Validate evidence lore IDs
    for floor, evidence_ids in FLOOR_EVIDENCE_IDS.items():
        for lore_id in evidence_ids:
            if lore_id not in ALL_LORE_IDS:
                errors.append(f"Evidence ID '{lore_id}' for floor {floor} not in ALL_LORE_IDS")
            if lore_id not in LORE_ENTRIES:
                errors.append(f"Evidence ID '{lore_id}' for floor {floor} missing from LORE_ENTRIES")
            elif LORE_ENTRIES[lore_id].get("level_hint") != floor:
                errors.append(
                    f"Evidence ID '{lore_id}' has wrong level_hint "
                    f"(expected {floor}, got {LORE_ENTRIES[lore_id].get('level_hint')})"
                )

    return errors


def validate_floor_canon() -> list:
    """Validate that floor themes, bosses, and intros are consistent.

    Checks:
    - LEVEL_THEMES matches LEVEL_BOSS_MAP (boss belongs to correct biome)
    - LEVEL_INTRO_MESSAGES mention the correct biome keywords
    - BOSS_STATS[boss]['level'] matches the floor in LEVEL_BOSS_MAP

    Returns:
        List of validation error messages (empty if valid)
    """
    from ..core.constants import (
        LEVEL_THEMES, LEVEL_BOSS_MAP, BOSS_STATS, DungeonTheme, BossType
    )
    from .story_data import LEVEL_INTRO_MESSAGES

    errors = []

    # Canonical floor-to-theme-to-boss mapping
    # Format: floor -> (expected theme, expected boss, intro keyword)
    CANON = {
        1: (DungeonTheme.STONE, BossType.GOBLIN_KING, "stone"),
        2: (DungeonTheme.SEWER, BossType.RAT_KING, "sewer"),
        3: (DungeonTheme.FOREST, BossType.SPIDER_QUEEN, "forest"),
        4: (DungeonTheme.CRYPT, BossType.REGENT, "mirror"),  # Mirror Valdris uses CRYPT theme
        5: (DungeonTheme.ICE, BossType.FROST_GIANT, "ice"),
        6: (DungeonTheme.LIBRARY, BossType.ARCANE_KEEPER, "library"),
        7: (DungeonTheme.VOLCANIC, BossType.FLAME_LORD, "volcanic"),
        8: (DungeonTheme.CRYSTAL, BossType.DRAGON_EMPEROR, "crystal"),
    }

    for floor, (expected_theme, expected_boss, intro_keyword) in CANON.items():
        # Check theme
        actual_theme = LEVEL_THEMES.get(floor)
        if actual_theme != expected_theme:
            errors.append(
                f"Floor {floor}: LEVEL_THEMES has {actual_theme}, expected {expected_theme}"
            )

        # Check boss in LEVEL_BOSS_MAP
        actual_boss = LEVEL_BOSS_MAP.get(floor)
        if actual_boss != expected_boss:
            errors.append(
                f"Floor {floor}: LEVEL_BOSS_MAP has {actual_boss}, expected {expected_boss}"
            )

        # Check BOSS_STATS level matches floor (prevents drift)
        if actual_boss and actual_boss in BOSS_STATS:
            boss_level = BOSS_STATS[actual_boss].get('level')
            if boss_level != floor:
                errors.append(
                    f"Floor {floor}: BOSS_STATS[{actual_boss.name}]['level'] is {boss_level}, "
                    f"expected {floor}"
                )

        # Check intro message contains expected keyword
        intro = LEVEL_INTRO_MESSAGES.get(floor, "").lower()
        if intro_keyword not in intro:
            errors.append(
                f"Floor {floor}: LEVEL_INTRO_MESSAGES missing keyword '{intro_keyword}'"
            )

    return errors


# Run validation on module import in debug mode
def _debug_validate():
    """Run validation if DEBUG_LORE environment variable is set."""
    import os
    if os.environ.get("DEBUG_LORE"):
        errors = validate_story_data()
        errors.extend(validate_floor_canon())
        if errors:
            for error in errors:
                print(f"[LORE VALIDATION ERROR] {error}")
