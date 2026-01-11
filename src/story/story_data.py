"""Narrative content and story data for the roguelike."""
from typing import Dict, List, Optional, Tuple


# Level intro messages - shown when entering each dungeon level
# Canonical order: Stone, Sewers, Forest, Mirror Valdris, Ice, Library, Volcanic, Crystal
LEVEL_INTRO_MESSAGES: Dict[int, str] = {
    1: "You descend into the Stone Dungeon. Ancient torches flicker with unnatural light.",
    2: "The stench hits you first. The Sewers of Valdris stretch endlessly into darkness.",
    3: "Roots and vines consume the walls. You have entered the Forest Depths, where nature claims all.",
    4: "Familiar architecture, yet wrong. Mirror Valdris—a palace rebuilt from memory, imperfectly.",
    5: "A biting cold grips you as you enter the Ice Cavern. Frost clings to every surface.",
    6: "Dust motes dance in pale light. You have found the Ancient Library. Knowledge... and danger.",
    7: "Heat radiates from below. The Volcanic Depths glow with rivers of molten rock.",
    8: "Brilliant light refracts through countless crystals. The Crystal Cave holds the dragon's lair.",
}


# Enemy first encounter messages - shown first time player sees each enemy type
ENEMY_ENCOUNTER_MESSAGES: Dict[str, str] = {
    'Goblin': "A goblin! Small but vicious, they hunt in packs.",
    'Skeleton': "The bones rattle to life. An ancient guardian, bound by dark magic.",
    'Orc': "A brutish orc blocks your path. These warriors know no fear.",
    'Wraith': "A wraith materializes from the shadows. Your weapons may not harm it fully.",
    'Troll': "The ground shakes. A troll emerges, its regeneration legendary.",
    'Dragon': "Ancient scales gleam in the darkness. You have found the dragon.",
}


# Lore entries - discoverable story content from scrolls and books
# Each entry has: id, title, content (list of paragraphs), level_hint (where it spawns)
LORE_ENTRIES: Dict[str, Dict] = {
    # Level 1 - Stone Dungeon lore
    "journal_adventurer_1": {
        "title": "Tattered Journal",
        "content": [
            "Day 3: The dungeons are real. I found the entrance just as the old maps described.",
            "The upper levels seem to be an ancient prison. Who were they keeping down here?",
            "I've found signs of others who came before me. None made it back.",
        ],
        "level_hint": 1,
        "item_type": "scroll",
        "category": "characters",
    },
    "warning_stone": {
        "title": "Carved Warning",
        "content": [
            "TURN BACK",
            "THE DEPTHS HOLD ONLY DEATH",
            "WE SEALED THEM FOR A REASON",
            "- Last Warden of Valdris",
        ],
        "level_hint": 1,
        "item_type": "scroll",
        "category": "locations",
    },

    # Level 2 - Sewers of Valdris lore
    "sewer_worker": {
        "title": "Sewer Worker's Note",
        "content": [
            "The rats have been acting strange. Organized.",
            "I saw them carrying food to the deep tunnels. Thousands of them.",
            "There's something down there commanding them. Something big.",
        ],
        "level_hint": 2,
        "item_type": "scroll",
        "category": "characters",
    },
    "plague_warning": {
        "title": "Health Warden's Warning",
        "content": [
            "SEWERS CONDEMNED BY ORDER OF THE CROWN",
            "The Rat King has been sighted. All workers evacuated.",
            "Disease spreads from below. Burn anything that emerges.",
        ],
        "level_hint": 2,
        "item_type": "scroll",
        "category": "locations",
    },

    # Level 3 - Forest Depths lore
    "druid_log": {
        "title": "Druid's Log",
        "content": [
            "The forest has grown wild since we abandoned the upper levels.",
            "Nature reclaims what was taken. The Spider Queen has made her nest.",
            "We thought we could contain her. We were wrong.",
        ],
        "level_hint": 3,
        "item_type": "scroll",
        "category": "creatures",
    },
    "webbed_note": {
        "title": "Note Wrapped in Silk",
        "content": [
            "If you can read this, run.",
            "The spiders are everywhere. Their queen watches.",
            "She was once human. The forest changed her.",
        ],
        "level_hint": 3,
        "item_type": "scroll",
        "category": "locations",
    },

    # Level 4 - Mirror Valdris (counterfeit palace) lore
    "crypt_inscription": {
        "title": "Succession Decree",
        "content": [
            "By right of blood and the blessing of the Eight Seals,",
            "I, Regent Malachar, do claim the throne of Valdris.",
            "Let none question my legitimacy.",
            "",
            "The decree is signed. But the seal... the seal is wrong.",
        ],
        "level_hint": 4,
        "item_type": "scroll",
        "category": "history",
    },
    "priest_confession": {
        "title": "Regent's Ledger",
        "content": [
            "Day 1: The king is dead. Long live... me.",
            "Day 4: The court accepted the coronation. They had no choice.",
            "Day 12: They're starting to notice the inconsistencies.",
            "Day 12: I will make them forget. Again.",
        ],
        "level_hint": 4,
        "item_type": "book",
        "category": "characters",
    },

    # Level 5 - Ice Cavern lore
    "frozen_explorer": {
        "title": "Frozen Explorer's Journal",
        "content": [
            "Day 12: The cold is unnatural. My torch barely helps.",
            "I found a giant frozen solid in the ice. Still breathing.",
            "The Frost Giant was sealed here. Someone is waking it.",
        ],
        "level_hint": 5,
        "item_type": "scroll",
        "category": "characters",
    },
    "ice_warning": {
        "title": "Warning Carved in Ice",
        "content": [
            "BEWARE THE THAW",
            "THE GIANT SLEEPS IN FROZEN SLUMBER",
            "DO NOT MELT THE ICE",
        ],
        "level_hint": 5,
        "item_type": "scroll",
        "category": "locations",
    },

    # Level 6 - Ancient Library lore
    "wizard_research": {
        "title": "Arcane Research Notes",
        "content": [
            "Experiment 47: The artifact responds to blood.",
            "Experiment 52: It grows stronger. It speaks to me in dreams.",
            "Experiment 61: I understand now. It was never a weapon.",
            "It was a prison. And we have been feeding the prisoner.",
        ],
        "level_hint": 6,
        "item_type": "book",
        "category": "artifacts",
    },
    "history_valdris": {
        "title": "History of Valdris",
        "content": [
            "In the Age of Light, Valdris stood as beacon of civilization.",
            "The kingdom's prosperity came from the mines beneath the city.",
            "But the miners dug too deep, and found something sleeping.",
            "The Darkness woke, and Valdris fell in a single night.",
        ],
        "level_hint": 6,
        "item_type": "book",
        "category": "history",
    },

    # Level 7 - Volcanic Depths lore
    "smith_journal": {
        "title": "Master Smith's Journal",
        "content": [
            "We built our forge above the magma flows. The heat was perfect.",
            "Then the Flame Lord emerged from the depths. Fire given form.",
            "Our greatest weapons could not harm him. He melted them all.",
        ],
        "level_hint": 7,
        "item_type": "scroll",
        "category": "artifacts",
    },
    "obsidian_tablet": {
        "title": "Obsidian Tablet",
        "content": [
            "THE FLAME LORD WAS BORN OF VALDRIS' GREED",
            "THEY DUG TOO DEEP FOR GOLD AND GEMS",
            "AND WOKE THE FIRE THAT NEVER DIES",
        ],
        "level_hint": 7,
        "item_type": "scroll",
        "category": "artifacts",
    },

    # Level 8 - Crystal Cave / Dragon's Lair lore
    "dragon_pact": {
        "title": "The Dragon's Pact",
        "content": [
            "To the Last King of Valdris:",
            "I will guard your treasures for eternity.",
            "In return, you will feed me your enemies.",
            "When the enemies run out, our pact is void.",
            "",
            "The enemies ran out long ago. I hunger.",
        ],
        "level_hint": 8,
        "item_type": "scroll",
        "category": "history",
    },
    "final_entry": {
        "title": "The Last King's Testament",
        "content": [
            "To whoever reads this: You have come far.",
            "The dragon guards more than gold. Beneath the vault lies the Darkness itself.",
            "We could not destroy it. We could only contain it.",
            "If you slay the dragon, the seal breaks.",
            "If you flee, it remains. The choice is yours.",
            "",
            "- Aldric, Last King of Valdris",
        ],
        "level_hint": 8,
        "item_type": "book",
        "category": "history",
    },

    # =========================================================================
    # Environmental Evidence Entries (discovered via zone evidence props)
    # Canonical floor order: Stone, Sewers, Forest, Mirror Valdris, Ice, Library, Volcanic, Crystal
    # =========================================================================

    # Floor 1 - Stone Dungeon evidence
    "evidence_duplicate_plaques": {
        "title": "Duplicate Plaques",
        "content": [
            "Two identical bronze plaques hang on opposite walls.",
            "Both read: 'Cell Block A - Warden Theron, Year 847.'",
            "But the script differs subtly. One curves left. One curves right.",
            "As if written by the same hand... in a mirror.",
        ],
        "level_hint": 1,
        "item_type": "evidence",
        "category": "history",
    },
    "evidence_scratch_tallies": {
        "title": "Scratch Tallies",
        "content": [
            "Scratch marks cover the cell walls. Prisoner tallies, counting days.",
            "But the numbers don't add up. Day 1... Day 2... Day 1... Day 2...",
            "The same sequence, repeated hundreds of times.",
            "Someone lived the same two days. Over and over.",
        ],
        "level_hint": 1,
        "item_type": "evidence",
        "category": "history",
    },

    # Floor 2 - Sewers evidence
    "evidence_wax_seals_nests": {
        "title": "Wax Seals in Rat Nests",
        "content": [
            "Rat nests line the sewer alcoves, built from debris.",
            "Inside each: royal wax seals, gnawed but intact.",
            "The rats collected them. Hundreds of identical seals.",
            "All dated the same day. The day Valdris fell.",
        ],
        "level_hint": 2,
        "item_type": "evidence",
        "category": "history",
    },
    "evidence_decree_fragments": {
        "title": "Decree Fragments",
        "content": [
            "Torn parchment caught in the grate. A royal decree.",
            "'By order of King Aldric... the prisoner shall be...'",
            "The rest dissolved in the muck. But there are more fragments.",
            "The same decree. Torn the same way. In every grate.",
        ],
        "level_hint": 2,
        "item_type": "evidence",
        "category": "history",
    },

    # Floor 3 - Forest Depths evidence
    "evidence_web_sigil_geometry": {
        "title": "Web Sigil Geometry",
        "content": [
            "The spider webs form patterns. Too regular for instinct.",
            "Each web contains the same sigil, woven in silk.",
            "The symbol matches nothing in the archives.",
            "Yet it feels familiar. Like a word you cannot quite remember.",
        ],
        "level_hint": 3,
        "item_type": "evidence",
        "category": "history",
    },
    "evidence_roots_avoiding_crown": {
        "title": "Roots Avoiding Crown",
        "content": [
            "The roots twist through everything. Stone, metal, bone.",
            "But here, a perfect circle. A clearing in the growth.",
            "At its center: a faded mosaic. A crown with eight points.",
            "The forest consumes all. Except the crown. Why?",
        ],
        "level_hint": 3,
        "item_type": "evidence",
        "category": "history",
    },

    # Floor 4 - Mirror Valdris (counterfeit palace) evidence
    "evidence_two_coronations_bell": {
        "title": "Two Coronations Bell",
        "content": [
            "A cracked bronze bell hangs in the throne room alcove.",
            "The inscription reads: 'For the coronation of King Aldric.'",
            "But there are two dates. Two coronations.",
            "The same king. Crowned twice. In the same year.",
        ],
        "level_hint": 4,
        "item_type": "evidence",
        "category": "history",
    },
    "evidence_contradictory_plaques": {
        "title": "Contradictory Door Plaques",
        "content": [
            "Two doors, side by side. Each bears a plaque.",
            "'Royal Treasury - SEALED by order of King Aldric.'",
            "'Royal Treasury - OPENED by order of King Aldric.'",
            "Same handwriting. Same seal. Same date.",
        ],
        "level_hint": 4,
        "item_type": "evidence",
        "category": "history",
    },

    # Floor 5 - Ice Cavern evidence
    "evidence_repeating_day_12": {
        "title": "Repeating 'Day 12'",
        "content": [
            "Ice-encased expedition logs, preserved perfectly.",
            "Every single one ends: 'Day 12 of the Seventh Moon.'",
            "Dozens of explorers. All stopped writing the same day.",
            "The ink froze mid-sentence. Every time.",
        ],
        "level_hint": 5,
        "item_type": "evidence",
        "category": "history",
    },
    "evidence_thaw_never_completes": {
        "title": "Thaw That Never Completes",
        "content": [
            "Icicles hang from the cavern ceiling, perpetually dripping.",
            "The same drop falls. Freezes. Falls. Freezes.",
            "You watch it cycle three times before moving on.",
            "Time stutters here. Catching on something cold.",
        ],
        "level_hint": 5,
        "item_type": "evidence",
        "category": "history",
    },

    # Floor 6 - Ancient Library evidence
    "evidence_self_cataloging_shelves": {
        "title": "Self-Cataloging Index",
        "content": [
            "The card catalog drawers are meticulously organized.",
            "Each card reads: 'Cataloged by Archivist Thenn.'",
            "But the handwriting changes mid-entry on some cards.",
            "The same name. Different hands. Dozens of them.",
        ],
        "level_hint": 6,
        "item_type": "evidence",
        "category": "history",
    },
    "evidence_final_version_labels": {
        "title": "'Final Version' Labels",
        "content": [
            "Book spines stamped 'FINAL VERSION - DO NOT COPY.'",
            "Inside: histories of Valdris. All slightly different.",
            "Each claims to be the definitive record.",
            "But the histories contradict each other. And confirm each other.",
        ],
        "level_hint": 6,
        "item_type": "evidence",
        "category": "history",
    },

    # Floor 7 - Volcanic Depths evidence
    "evidence_melted_crest": {
        "title": "Melted Crest",
        "content": [
            "A royal crest, cast in iron, hangs above the forge.",
            "Half-melted, dripping frozen metal tears.",
            "The heat here should have destroyed it entirely.",
            "Yet it hangs. Mid-melt. Refusing to finish.",
        ],
        "level_hint": 7,
        "item_type": "evidence",
        "category": "history",
    },
    "evidence_rune_plates_stamped": {
        "title": "Rune Plates Stamped",
        "content": [
            "Forge-pressed rune plates line the passage walls.",
            "Each stamped: 'Verified by Forgemaster Kael.'",
            "But the verification dates span three centuries.",
            "The same stamp. The same man. Impossible.",
        ],
        "level_hint": 7,
        "item_type": "evidence",
        "category": "history",
    },

    # Floor 8 - Crystal Cave evidence
    "evidence_missing_sigil_segment": {
        "title": "Missing Sigil Segment",
        "content": [
            "A massive binding circle, carved into the crystal floor.",
            "Seven segments, each inscribed with power words.",
            "The eighth segment is blank. Scratched clean.",
            "Someone erased it. Recently. The crystal dust still settles.",
        ],
        "level_hint": 8,
        "item_type": "evidence",
        "category": "history",
    },
    "evidence_double_shadow_refraction": {
        "title": "Double Shadow Refraction",
        "content": [
            "Light bends strangely through the crystals here.",
            "Your shadow splits. Two of you, walking in parallel.",
            "But your other shadow moves... differently.",
            "A half-second ahead. Or behind. You cannot tell which.",
        ],
        "level_hint": 8,
        "item_type": "evidence",
        "category": "history",
    },
}


# Tutorial hints - contextual tips shown on first occurrence of an action
# Key: hint_id, Value: hint message text
TUTORIAL_HINTS: Dict[str, str] = {
    "first_move": "Tip: Use WASD or Arrow keys to move around.",
    "first_enemy_seen": "Tip: Walk into enemies to attack them.",
    "first_item": "Tip: Walk over items to pick them up automatically.",
    "first_combat": "Tip: Watch your HP! Use potions (I key) to heal.",
    "first_level_up": "Tip: Leveling up increases your max HP and attack damage.",
    "first_stairs": "Tip: Step on stairs (>) and move to descend deeper.",
    "inventory_hint": "Tip: Press I for inventory, C for character stats, M for message log.",
    "first_elite": "Tip: Elite enemies (bright red) are tougher but give more XP!",
    "first_lore": "Tip: Lore items reveal the story. Read them from your inventory.",
    "first_boss": "Tip: BOSS FIGHT! These powerful foes have special abilities and drop rare loot!",
}


def get_tutorial_hint(hint_id: str) -> Optional[str]:
    """Get a tutorial hint message by ID."""
    return TUTORIAL_HINTS.get(hint_id)


def get_level_intro(level: int) -> Optional[str]:
    """Get the intro message for a dungeon level."""
    return LEVEL_INTRO_MESSAGES.get(level)


def get_enemy_encounter_message(enemy_name: str) -> Optional[str]:
    """Get the first encounter message for an enemy type."""
    return ENEMY_ENCOUNTER_MESSAGES.get(enemy_name)


def get_lore_entry(entry_id: str) -> Optional[Dict]:
    """Get a lore entry by its ID."""
    return LORE_ENTRIES.get(entry_id)


def get_lore_entries_for_level(level: int) -> List[Tuple[str, Dict]]:
    """Get all lore entries that can spawn on a given level."""
    entries = []
    for entry_id, entry in LORE_ENTRIES.items():
        if entry.get("level_hint") == level:
            entries.append((entry_id, entry))
    return entries
