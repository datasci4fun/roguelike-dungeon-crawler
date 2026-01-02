"""Narrative content and story data for the roguelike."""
from typing import Dict, List, Optional, Tuple


# Level intro messages - shown when entering each dungeon level
LEVEL_INTRO_MESSAGES: Dict[int, str] = {
    1: "You descend into the Stone Dungeon. Ancient torches flicker with unnatural light.",
    2: "The air grows damp as you enter the Natural Caves. Water drips from unseen heights.",
    3: "A chill runs down your spine as you step into the Ancient Crypt. The dead do not rest here.",
    4: "Dust motes dance in pale light. You have found the Forgotten Library.",
    5: "Gold glimmers in the darkness. You have reached the Treasure Vault. Something guards it.",
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
    },

    # Level 2 - Cave lore
    "journal_adventurer_2": {
        "title": "Water-Stained Pages",
        "content": [
            "Day 7: The caves are natural, but something shaped them further.",
            "I found tool marks on the walls. The people of Valdris dug deeper.",
            "What were they searching for? Or hiding from?",
        ],
        "level_hint": 2,
        "item_type": "scroll",
    },
    "miner_note": {
        "title": "Miner's Note",
        "content": [
            "We broke through to something today. A tomb, older than Valdris itself.",
            "Foreman says to keep digging. The king wants what's inside.",
            "I don't like the sounds coming from below.",
        ],
        "level_hint": 2,
        "item_type": "scroll",
    },

    # Level 3 - Crypt lore
    "crypt_inscription": {
        "title": "Tomb Inscription",
        "content": [
            "Here lies the Royal Guard of Valdris.",
            "In death as in life, they serve the crown.",
            "May they rise again when the kingdom calls.",
            "",
            "The kingdom called. They rose. They did not stop.",
        ],
        "level_hint": 3,
        "item_type": "scroll",
    },
    "priest_confession": {
        "title": "Priest's Confession",
        "content": [
            "Forgive me. The ritual was meant to protect us.",
            "When the Darkness came, we raised the dead to fight it.",
            "But the dead cannot tell friend from foe.",
            "We sealed the crypt, but the magic... it spreads.",
        ],
        "level_hint": 3,
        "item_type": "book",
    },

    # Level 4 - Library lore
    "wizard_research": {
        "title": "Arcane Research Notes",
        "content": [
            "Experiment 47: The artifact responds to blood.",
            "Experiment 52: It grows stronger. It speaks to me in dreams.",
            "Experiment 61: I understand now. It was never a weapon.",
            "It was a prison. And we have been feeding the prisoner.",
        ],
        "level_hint": 4,
        "item_type": "book",
    },
    "history_valdris": {
        "title": "History of Valdris",
        "content": [
            "In the Age of Light, Valdris stood as beacon of civilization.",
            "The kingdom's prosperity came from the mines beneath the city.",
            "But the miners dug too deep, and found something sleeping.",
            "The Darkness woke, and Valdris fell in a single night.",
        ],
        "level_hint": 4,
        "item_type": "book",
    },

    # Level 5 - Treasury lore
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
        "level_hint": 5,
        "item_type": "scroll",
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
        "level_hint": 5,
        "item_type": "book",
    },
}


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
