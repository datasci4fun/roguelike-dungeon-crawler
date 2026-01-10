"""Narrative content and story data for the roguelike."""
from typing import Dict, List, Optional, Tuple


# Level intro messages - shown when entering each dungeon level
LEVEL_INTRO_MESSAGES: Dict[int, str] = {
    1: "You descend into the Stone Dungeon. Ancient torches flicker with unnatural light.",
    2: "A biting cold grips you as you enter the Ice Cavern. Frost clings to every surface.",
    3: "Roots and vines consume the walls. You have entered the Forest Depths, where nature claims all.",
    4: "Heat radiates from below. The Volcanic Depths glow with rivers of molten rock.",
    5: "A chill runs down your spine as you step into the Ancient Crypt. The dead do not rest here.",
    6: "The stench hits you first. The Sewers of Valdris stretch endlessly into darkness.",
    7: "Dust motes dance in pale light. You have found the Ancient Library. Knowledge... and danger.",
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

    # Level 2 - Ice Cavern lore
    "frozen_explorer": {
        "title": "Frozen Explorer's Journal",
        "content": [
            "Day 12: The cold is unnatural. My torch barely helps.",
            "I found a giant frozen solid in the ice. Still breathing.",
            "The Frost Giant was sealed here. Someone is waking it.",
        ],
        "level_hint": 2,
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

    # Level 4 - Volcanic Depths lore
    "smith_journal": {
        "title": "Master Smith's Journal",
        "content": [
            "We built our forge above the magma flows. The heat was perfect.",
            "Then the Flame Lord emerged from the depths. Fire given form.",
            "Our greatest weapons could not harm him. He melted them all.",
        ],
        "level_hint": 4,
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
        "level_hint": 4,
        "item_type": "scroll",
        "category": "artifacts",
    },

    # Level 5 - Ancient Crypt lore
    "crypt_inscription": {
        "title": "Tomb Inscription",
        "content": [
            "Here lies the Royal Guard of Valdris.",
            "In death as in life, they serve the crown.",
            "May they rise again when the kingdom calls.",
            "",
            "The kingdom called. They rose. They did not stop.",
        ],
        "level_hint": 5,
        "item_type": "scroll",
        "category": "creatures",
    },
    "priest_confession": {
        "title": "Priest's Confession",
        "content": [
            "Forgive me. The ritual was meant to protect us.",
            "When the Darkness came, we raised the dead to fight it.",
            "But the dead cannot tell friend from foe.",
            "We sealed the crypt, but the magic... it spreads.",
        ],
        "level_hint": 5,
        "item_type": "book",
        "category": "characters",
    },

    # Level 6 - Sewer lore
    "sewer_worker": {
        "title": "Sewer Worker's Note",
        "content": [
            "The rats have been acting strange. Organized.",
            "I saw them carrying food to the deep tunnels. Thousands of them.",
            "There's something down there commanding them. Something big.",
        ],
        "level_hint": 6,
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
        "level_hint": 6,
        "item_type": "scroll",
        "category": "locations",
    },

    # Level 7 - Ancient Library lore
    "wizard_research": {
        "title": "Arcane Research Notes",
        "content": [
            "Experiment 47: The artifact responds to blood.",
            "Experiment 52: It grows stronger. It speaks to me in dreams.",
            "Experiment 61: I understand now. It was never a weapon.",
            "It was a prison. And we have been feeding the prisoner.",
        ],
        "level_hint": 7,
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
        "level_hint": 7,
        "item_type": "book",
        "category": "history",
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
