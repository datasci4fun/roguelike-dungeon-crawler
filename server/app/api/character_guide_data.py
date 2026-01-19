"""
Character Guide data - races, classes, and combinations.

Rich descriptions and lore for the character creation guide.
"""
from .character_guide_models import (
    Race, PlayerClass, RacialTrait, ClassAbility,
    StatModifier, RaceClassCombination
)

# ============================================================================
# RACES
# ============================================================================

RACES: list[Race] = [
    Race(
        id="HUMAN",
        name="Human",
        description="Balanced and adaptable, humans are the most versatile of all races.",
        appearance="Medium build with varied skin tones ranging from pale to dark. Hair colors span black, brown, blonde, and red. Average height around 5'8\" to 6'.",
        lore="Humans are the most numerous race in the realm, known for their ambition and adaptability. They founded the great cities and have produced heroes of every calling. Their short lifespans drive them to achieve greatness quickly.",
        stat_modifiers=StatModifier(health=0, attack=0, defense=0),
        base_height=1.8,
        racial_trait=RacialTrait(
            name="Adaptive",
            description="Humans learn quickly and adapt to any situation.",
            effect="+10% XP gain, +1 starting feat"
        ),
        icon="👤",
        skin_color="#d4a574",
        eye_color="#4488cc",
    ),
    Race(
        id="ELF",
        name="Elf",
        description="Agile and perceptive, elves are natural hunters and archers.",
        appearance="Tall and slender with pointed ears and angular features. Skin is pale with an almost luminescent quality. Eyes are large and often green or silver. Hair is typically long, ranging from silver to black.",
        lore="The eldest of the mortal races, elves have watched civilizations rise and fall. They are deeply connected to nature and magic, preferring forests and ancient places. Their long lives grant them patience but also a certain detachment from the urgency of other races.",
        stat_modifiers=StatModifier(health=-2, attack=1, defense=0),
        base_height=2.0,
        racial_trait=RacialTrait(
            name="Keen Sight",
            description="Elven eyes can pierce the deepest shadows.",
            effect="+2 vision range"
        ),
        icon="🧝",
        skin_color="#e8d4b8",
        eye_color="#88dd88",
    ),
    Race(
        id="DWARF",
        name="Dwarf",
        description="Sturdy and resilient, dwarves are born warriors and craftsmen.",
        appearance="Short and stocky with broad shoulders and thick limbs. Skin is ruddy and weathered. All dwarves sport magnificent beards, often braided and adorned. Eyes are typically brown or amber.",
        lore="Dwarves carved their first homes deep within mountains before humans learned to walk. They are master smiths and miners, their halls filled with treasures of their own making. Stubborn and proud, they hold grudges for generations but their loyalty, once earned, is unshakeable.",
        stat_modifiers=StatModifier(health=4, attack=-1, defense=2),
        base_height=1.3,
        racial_trait=RacialTrait(
            name="Poison Resistance",
            description="Dwarven constitution laughs at toxins.",
            effect="50% poison resistance"
        ),
        icon="⛏️",
        skin_color="#c9a87c",
        eye_color="#8866aa",
    ),
    Race(
        id="HALFLING",
        name="Halfling",
        description="Lucky and nimble, halflings rely on wit over strength.",
        appearance="Small and slight, barely reaching 3 feet tall. Round faces with rosy cheeks and curly hair, usually brown or auburn. Large, expressive eyes and pointed ears smaller than elves. Notably large, hairy feet.",
        lore="Halflings are wanderers and homebodies in equal measure. They value comfort, good food, and better company. Despite their small stature, they possess an uncanny knack for avoiding danger and finding fortune where others find only peril.",
        stat_modifiers=StatModifier(health=-4, attack=0, defense=0),
        base_height=1.0,
        racial_trait=RacialTrait(
            name="Lucky",
            description="Fortune favors the small.",
            effect="15% dodge chance"
        ),
        icon="🍀",
        skin_color="#dec4a4",
        eye_color="#886633",
    ),
    Race(
        id="ORC",
        name="Orc",
        description="Powerful but reckless, orcs are fearsome in battle.",
        appearance="Large and muscular with green to gray skin. Prominent lower tusks jut from their jaws. Small, deep-set eyes glow red or yellow. Coarse black hair, often worn in topknots or braids. Stand over 6 feet tall.",
        lore="Once feared as mindless raiders, orcs have since forged their own civilization. They value strength and honor in combat above all else. An orc's rage is legendary, but so is their loyalty to those who prove themselves worthy allies.",
        stat_modifiers=StatModifier(health=6, attack=2, defense=-1),
        base_height=2.1,
        racial_trait=RacialTrait(
            name="Rage",
            description="When wounded, an orc becomes truly dangerous.",
            effect="+50% damage when below 25% HP"
        ),
        icon="👹",
        skin_color="#5a8a5a",
        eye_color="#cc4444",
    ),
]

# ============================================================================
# CLASSES
# ============================================================================

CLASSES: list[PlayerClass] = [
    PlayerClass(
        id="WARRIOR",
        name="Warrior",
        description="Master of melee combat, the warrior excels at direct confrontation.",
        playstyle="Get in close and hit hard. Use Power Strike to burst down tough enemies and Shield Wall to survive dangerous situations. Your high health pool lets you trade blows favorably.",
        lore="Warriors are the backbone of any army, trained from youth in the arts of sword and shield. They are found wherever conflict arises, from city guards to legendary champions. A warrior's strength comes not from magic, but from discipline, training, and sheer determination.",
        stat_modifiers=StatModifier(health=5, attack=1, defense=1),
        abilities=[
            ClassAbility(
                name="Power Strike",
                description="A devastating overhead blow that deals double damage.",
                ability_type="active",
                damage=6,
                effect="2x damage",
                cooldown=3,
            ),
            ClassAbility(
                name="Shield Wall",
                description="Raise your shield to block all incoming damage.",
                ability_type="active",
                effect="Block all damage for 2 turns",
                cooldown=5,
            ),
            ClassAbility(
                name="Combat Mastery",
                description="Years of training grant increased melee effectiveness.",
                ability_type="passive",
                effect="+15% melee damage",
            ),
        ],
        starting_equipment="Iron sword and wooden shield",
        equipment_type="sword_shield",
        icon="⚔️",
        primary_color="#8b4513",
        secondary_color="#696969",
        glow_color="#ffaa44",
    ),
    PlayerClass(
        id="MAGE",
        name="Mage",
        description="Wielder of arcane power, mages command devastating magical attacks.",
        playstyle="Keep your distance and rain destruction from afar. Fireball hits hard at range while Frost Nova helps when enemies get too close. Your Mana Shield provides some protection, but avoid prolonged melee combat.",
        lore="Mages spend years studying the arcane arts in ancient towers and forbidden libraries. They learn to bend reality itself, channeling raw magical energy into destructive spells. Though physically frail, a mage's power can level armies.",
        stat_modifiers=StatModifier(health=-3, attack=-1, defense=0),
        abilities=[
            ClassAbility(
                name="Fireball",
                description="Hurl a ball of fire at a distant enemy.",
                ability_type="active",
                damage=8,
                effect="Burns target for 2 additional damage over 2 turns",
                cooldown=2,
            ),
            ClassAbility(
                name="Frost Nova",
                description="Release a wave of freezing cold around you.",
                ability_type="active",
                damage=4,
                effect="Freezes nearby enemies for 1 turn",
                cooldown=4,
            ),
            ClassAbility(
                name="Mana Shield",
                description="Arcane energy absorbs a portion of incoming damage.",
                ability_type="passive",
                effect="25% damage reduction",
            ),
        ],
        starting_equipment="Gnarled staff with glowing orb",
        equipment_type="staff",
        icon="🔮",
        primary_color="#4a2a7a",
        secondary_color="#8844cc",
        glow_color="#aa66ff",
    ),
    PlayerClass(
        id="ROGUE",
        name="Rogue",
        description="Silent and deadly, rogues strike from the shadows.",
        playstyle="Position yourself carefully for Backstab's massive damage bonus. Use Smoke Bomb to escape when overwhelmed or to set up another devastating strike. Your Critical Strike passive means every hit could be lethal.",
        lore="Rogues operate in the spaces between law and chaos, using stealth and cunning where others rely on strength. They are assassins, thieves, and spies - though many put their skills to heroic use. Never underestimate the one who strikes from shadows.",
        stat_modifiers=StatModifier(health=0, attack=2, defense=-1),
        abilities=[
            ClassAbility(
                name="Backstab",
                description="Strike a vulnerable enemy for triple damage.",
                ability_type="active",
                damage=9,
                effect="3x damage from behind or against unaware enemies",
                cooldown=3,
            ),
            ClassAbility(
                name="Smoke Bomb",
                description="Vanish in a cloud of smoke.",
                ability_type="active",
                effect="Become invisible for 3 turns",
                cooldown=5,
            ),
            ClassAbility(
                name="Critical Strike",
                description="Training allows for precise, devastating blows.",
                ability_type="passive",
                effect="20% chance for double damage on any attack",
            ),
        ],
        starting_equipment="Twin daggers and hooded cloak",
        equipment_type="daggers",
        icon="🗡️",
        primary_color="#2a2a2a",
        secondary_color="#444444",
        glow_color="#44aa44",
    ),
    PlayerClass(
        id="CLERIC",
        name="Cleric",
        description="Divine light in darkness, clerics heal and smite in equal measure.",
        playstyle="Balance offense and support. Heal keeps you alive through tough fights while Smite deals extra damage to the undead horrors that fill the dungeon. Divine Protection helps you survive mistakes.",
        lore="Clerics are servants of the divine, channeling holy power through prayer and faith. They stand against the forces of darkness, healing the wounded and smiting the wicked. In the depths of the dungeon, their light is a beacon of hope.",
        stat_modifiers=StatModifier(health=2, attack=0, defense=1),
        abilities=[
            ClassAbility(
                name="Heal",
                description="Channel divine energy to restore health.",
                ability_type="active",
                effect="Restore 10 HP",
                cooldown=3,
            ),
            ClassAbility(
                name="Smite",
                description="Strike with holy wrath.",
                ability_type="active",
                damage=6,
                effect="Deals 2x damage to undead",
                cooldown=2,
            ),
            ClassAbility(
                name="Divine Protection",
                description="The gods watch over their faithful.",
                ability_type="passive",
                effect="20% damage reduction",
            ),
        ],
        starting_equipment="Holy symbol and blessed robes",
        equipment_type="holy",
        icon="✝️",
        primary_color="#ffd700",
        secondary_color="#f5f5dc",
        glow_color="#ffffaa",
    ),
]

# ============================================================================
# RACE/CLASS COMBINATIONS
# ============================================================================

# Generate all 20 combinations with synergy notes
def _generate_combinations() -> list[RaceClassCombination]:
    """Generate all race/class combinations with combined stats."""
    combinations = []

    synergy_notes = {
        ("HUMAN", "WARRIOR"): "The classic hero. Balanced stats and extra feat make for a flexible fighter.",
        ("HUMAN", "MAGE"): "Adaptive learning helps master arcane arts quickly.",
        ("HUMAN", "ROGUE"): "Jack of all trades. Extra feat can enhance stealth or combat.",
        ("HUMAN", "CLERIC"): "Versatile support. XP bonus helps reach higher level spells faster.",
        ("ELF", "WARRIOR"): "Finesse fighter. Keen Sight helps spot enemies before they spot you.",
        ("ELF", "MAGE"): "Natural affinity for magic. Extended vision aids spell targeting.",
        ("ELF", "ROGUE"): "Perfect scout. Enhanced perception and natural agility excel in shadows.",
        ("ELF", "CLERIC"): "Serene healer. Long-lived wisdom guides divine channeling.",
        ("DWARF", "WARRIOR"): "Immovable object. Incredible durability makes you a living fortress.",
        ("DWARF", "MAGE"): "Unconventional but surprisingly durable for a spellcaster.",
        ("DWARF", "ROGUE"): "Unusual choice. Poison resistance helps survive trapped chests.",
        ("DWARF", "CLERIC"): "Stone guardian. High defense and healing make you nearly unkillable.",
        ("HALFLING", "WARRIOR"): "Underestimated fighter. Luck helps you survive against the odds.",
        ("HALFLING", "MAGE"): "Tricky spellcaster. Dodge chance compensates for low health.",
        ("HALFLING", "ROGUE"): "Born infiltrator. Small size and luck make you hard to catch.",
        ("HALFLING", "CLERIC"): "Lucky healer. Fortune smiles on the faithful.",
        ("ORC", "WARRIOR"): "Unstoppable berserker. Rage turns low health into a death sentence for enemies.",
        ("ORC", "MAGE"): "Battle mage. High health pool lets you cast even in melee range.",
        ("ORC", "ROGUE"): "Brutal assassin. When Rage triggers, backstabs become lethal.",
        ("ORC", "CLERIC"): "War priest. Smite with fury, heal when rage subsides.",
    }

    races_by_id = {r.id: r for r in RACES}
    classes_by_id = {c.id: c for c in CLASSES}

    for race in RACES:
        for player_class in CLASSES:
            race_mods = race.stat_modifiers
            class_mods = player_class.stat_modifiers

            combined = StatModifier(
                health=race_mods.health + class_mods.health,
                attack=race_mods.attack + class_mods.attack,
                defense=race_mods.defense + class_mods.defense,
            )

            combinations.append(RaceClassCombination(
                race_id=race.id,
                class_id=player_class.id,
                display_name=f"{race.name} {player_class.name}",
                combined_stats=combined,
                synergy_notes=synergy_notes.get((race.id, player_class.id)),
            ))

    return combinations


COMBINATIONS: list[RaceClassCombination] = _generate_combinations()

# ============================================================================
# LOOKUP HELPERS
# ============================================================================

RACES_BY_ID: dict[str, Race] = {r.id: r for r in RACES}
CLASSES_BY_ID: dict[str, PlayerClass] = {c.id: c for c in CLASSES}


def get_race(race_id: str) -> Race | None:
    """Get race by ID."""
    return RACES_BY_ID.get(race_id)


def get_class(class_id: str) -> PlayerClass | None:
    """Get class by ID."""
    return CLASSES_BY_ID.get(class_id)


def get_combination(race_id: str, class_id: str) -> RaceClassCombination | None:
    """Get a specific race/class combination."""
    for combo in COMBINATIONS:
        if combo.race_id == race_id and combo.class_id == class_id:
            return combo
    return None
