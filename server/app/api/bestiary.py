"""
Bestiary API - Creature and enemy database.

Features:
- Creature categories (Common, Elite, Boss, etc.)
- Stats (health, damage, speed)
- Floor ranges and spawn locations
- Abilities and attack patterns
- Loot drops and weaknesses
"""

from typing import Optional
from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter(prefix="/api/bestiary", tags=["bestiary"])


class Ability(BaseModel):
    """A creature ability or attack."""
    name: str
    description: str
    damage: Optional[int] = None
    effect: Optional[str] = None


class LootDrop(BaseModel):
    """A potential loot drop."""
    item: str
    chance: str  # "Common", "Rare", "Very Rare"


class Creature(BaseModel):
    """A bestiary creature entry."""
    id: str
    name: str
    title: Optional[str] = None
    category: str  # "common", "elite", "miniboss", "boss", "unique"
    description: str
    appearance: str
    behavior: str
    floors: str  # e.g., "1-5", "6-10", "All"

    # Stats
    health: int
    damage: int
    speed: str  # "Slow", "Normal", "Fast", "Very Fast"

    # Combat
    abilities: list[Ability]
    weaknesses: list[str]
    resistances: list[str]

    # Rewards
    experience: int
    loot: list[LootDrop]

    # Visual
    icon: str
    threat_level: int  # 1-5 skulls


# ============================================================================
# BESTIARY DATA
# ============================================================================

CREATURES: list[Creature] = [
    # === COMMON ENEMIES (Floors 1-5) ===
    Creature(
        id="hollow_walker",
        name="Hollow Walker",
        category="common",
        description="The animated remains of fallen adventurers, still wearing their rusted armor and clutching broken weapons. Their empty eyes glow with a faint, hungry light.",
        appearance="Shambling humanoid corpse in tattered armor. Pale, desiccated skin stretched over bones. Glowing pinpoints where eyes should be.",
        behavior="Patrols set paths mindlessly. Attacks any living creature on sight. Will pursue until target is lost or destroyed.",
        floors="1-5",
        health=30,
        damage=8,
        speed="Slow",
        abilities=[
            Ability(name="Rusted Strike", description="A clumsy swing with a corroded weapon", damage=8),
            Ability(name="Hollow Grasp", description="Grabs and holds the target briefly", effect="Immobilize 1s"),
        ],
        weaknesses=["Fire", "Holy"],
        resistances=["Poison", "Cold"],
        experience=15,
        loot=[
            LootDrop(item="Rusted Coin", chance="Common"),
            LootDrop(item="Tattered Cloth", chance="Common"),
            LootDrop(item="Hollow Essence", chance="Rare"),
        ],
        icon="💀",
        threat_level=1,
    ),
    Creature(
        id="dungeon_rat",
        name="Dungeon Rat",
        category="common",
        description="Rats grown large and aggressive from feeding on magical residue. They hunt in packs and show disturbing cunning.",
        appearance="Dog-sized rat with matted fur and glowing eyes. Elongated teeth drip with infectious saliva.",
        behavior="Swarms in groups of 3-5. Flanks prey and attacks from multiple angles. Retreats when pack is reduced below 2.",
        floors="1-3",
        health=15,
        damage=5,
        speed="Fast",
        abilities=[
            Ability(name="Gnaw", description="Rapid biting attack", damage=5),
            Ability(name="Pack Tactics", description="Gains bonus damage when allies are nearby", effect="+2 damage per nearby rat"),
            Ability(name="Disease Bite", description="Chance to inflict infection", effect="Poison 3s"),
        ],
        weaknesses=["Fire", "Area attacks"],
        resistances=["Poison"],
        experience=8,
        loot=[
            LootDrop(item="Rat Tail", chance="Common"),
            LootDrop(item="Diseased Fang", chance="Rare"),
        ],
        icon="🐀",
        threat_level=1,
    ),
    Creature(
        id="animated_armor",
        name="Animated Armor",
        category="common",
        description="Empty suits of Valdrian armor, still following patrol routes programmed centuries ago. They attack with mechanical precision.",
        appearance="Complete set of ornate plate armor floating without a wearer. Joints creak and grind. Visor reveals only darkness within.",
        behavior="Follows predetermined patrol routes. Challenges intruders with archaic phrases before attacking. Returns to patrol if target flees zone.",
        floors="2-5",
        health=50,
        damage=12,
        speed="Slow",
        abilities=[
            Ability(name="Heavy Swing", description="Powerful overhead attack", damage=15),
            Ability(name="Shield Bash", description="Knocks target back", damage=8, effect="Knockback"),
            Ability(name="Defensive Stance", description="Reduces incoming damage temporarily", effect="50% damage reduction 3s"),
        ],
        weaknesses=["Lightning", "Rust attacks"],
        resistances=["Poison", "Psychic", "Piercing"],
        experience=25,
        loot=[
            LootDrop(item="Armor Scraps", chance="Common"),
            LootDrop(item="Valdrian Steel Shard", chance="Rare"),
            LootDrop(item="Animation Core", chance="Very Rare"),
        ],
        icon="🛡️",
        threat_level=2,
    ),
    Creature(
        id="tomb_spider",
        name="Tomb Spider",
        category="common",
        description="Pale spiders that weave webs of crystallized magic. Their bite drains more than blood.",
        appearance="Cat-sized spider with translucent carapace. Internal organs glow faintly. Webs shimmer with captured magical energy.",
        behavior="Creates web traps in chokepoints. Waits in ceiling corners. Drops on unsuspecting prey.",
        floors="1-5",
        health=20,
        damage=6,
        speed="Fast",
        abilities=[
            Ability(name="Venomous Bite", description="Injects paralyzing venom", damage=6, effect="Slow 2s"),
            Ability(name="Web Shot", description="Fires sticky web at range", effect="Root 2s"),
            Ability(name="Mana Drain", description="Drains magical energy on hit", effect="-10 Mana"),
        ],
        weaknesses=["Fire", "Crushing"],
        resistances=["Poison"],
        experience=12,
        loot=[
            LootDrop(item="Spider Silk", chance="Common"),
            LootDrop(item="Venom Gland", chance="Rare"),
            LootDrop(item="Crystallized Web", chance="Very Rare"),
        ],
        icon="🕷️",
        threat_level=1,
    ),

    # === ELITE ENEMIES ===
    Creature(
        id="bone_knight",
        name="Bone Knight",
        category="elite",
        description="The elite warriors of ancient Valdris, their loyalty outlasting their flesh. They retain their combat training and tactical awareness.",
        appearance="Skeleton in blackened plate armor. Blue flames burn in eye sockets. Wields ancient weapons with obvious skill.",
        behavior="Commands nearby undead. Uses tactical formations. Retreats to regroup if overwhelmed.",
        floors="3-7",
        health=120,
        damage=20,
        speed="Normal",
        abilities=[
            Ability(name="Cleaving Strike", description="Wide arc attack hitting multiple targets", damage=18),
            Ability(name="Rally Undead", description="Empowers nearby undead allies", effect="Nearby undead +25% damage"),
            Ability(name="Death's Challenge", description="Forces target to engage", effect="Taunt 3s"),
            Ability(name="Bone Shield", description="Creates shield from nearby bones", effect="Block next attack"),
        ],
        weaknesses=["Holy", "Blunt weapons"],
        resistances=["Cold", "Piercing", "Poison"],
        experience=75,
        loot=[
            LootDrop(item="Knight's Sigil", chance="Common"),
            LootDrop(item="Blackened Steel", chance="Rare"),
            LootDrop(item="Soul Fragment", chance="Rare"),
            LootDrop(item="Knight's Oath Ring", chance="Very Rare"),
        ],
        icon="⚔️",
        threat_level=3,
    ),
    Creature(
        id="mimic",
        name="Mimic",
        category="elite",
        description="Shapeshifting predators that take the form of treasure chests and other objects. By the time victims realize their mistake, it's usually too late.",
        appearance="In true form: amorphous mass of teeth and tentacles. Disguised: perfect imitation of a treasure chest, door, or valuable item.",
        behavior="Waits motionlessly for prey to approach. Reveals true form when touched or attacked. Extremely aggressive once revealed.",
        floors="2-10",
        health=100,
        damage=25,
        speed="Normal",
        abilities=[
            Ability(name="Crushing Maw", description="Massive bite attack", damage=25),
            Ability(name="Sticky Tongue", description="Pulls target into melee range", effect="Pull + Root 1s"),
            Ability(name="Digest", description="Ongoing damage while grappled", damage=10, effect="Per second while grabbed"),
            Ability(name="Perfect Disguise", description="Undetectable until interaction", effect="Stealth"),
        ],
        weaknesses=["Fire", "Acid"],
        resistances=["Physical"],
        experience=80,
        loot=[
            LootDrop(item="Mimic Tooth", chance="Common"),
            LootDrop(item="False Gold", chance="Common"),
            LootDrop(item="Shapeshifter Essence", chance="Rare"),
            LootDrop(item="Mimic's Tongue", chance="Very Rare"),
        ],
        icon="📦",
        threat_level=3,
    ),
    Creature(
        id="shadow_stalker",
        name="Shadow Stalker",
        category="elite",
        description="Creatures of pure darkness that exist in the spaces between light. They feed on fear and consume the minds of their victims.",
        appearance="Vaguely humanoid shape of absolute darkness. No features except hollow white eyes. Edges blur and shift constantly.",
        behavior="Hunts those experiencing fear. Can only be seen in peripheral vision. Retreats from strong light sources.",
        floors="6-10",
        health=80,
        damage=15,
        speed="Very Fast",
        abilities=[
            Ability(name="Shadow Touch", description="Phasing attack that ignores armor", damage=15),
            Ability(name="Terrorize", description="Inflicts supernatural fear", effect="Fear 3s"),
            Ability(name="Shadow Step", description="Teleports between shadows", effect="Teleport"),
            Ability(name="Mind Feed", description="Drains sanity on successful fear", effect="-10 Sanity"),
        ],
        weaknesses=["Light", "Holy", "Fire"],
        resistances=["Physical", "Cold", "Poison"],
        experience=90,
        loot=[
            LootDrop(item="Shadow Essence", chance="Rare"),
            LootDrop(item="Void Crystal", chance="Rare"),
            LootDrop(item="Cloak of Shadows", chance="Very Rare"),
        ],
        icon="👁️",
        threat_level=4,
    ),

    # === MINIBOSSES ===
    Creature(
        id="the_warden",
        name="The Warden",
        title="Guardian of the Third Lock",
        category="miniboss",
        description="An Eternal Guardian who has stood watch over the entrance to the lower floors for three centuries. Unlike others, it remembers everything—and everyone.",
        appearance="Massive suit of golden armor, twice human height. Wielding a greatsword longer than a man. Eyes burn with blue-white flame.",
        behavior="Challenges all who approach the stairway. Can be reasoned with briefly. Once combat begins, fights without mercy.",
        floors="5",
        health=500,
        damage=40,
        speed="Normal",
        abilities=[
            Ability(name="Judgment Strike", description="Devastating overhead blow", damage=50),
            Ability(name="Guardian's Oath", description="Cannot be moved or knocked back", effect="Immunity to displacement"),
            Ability(name="Seal the Path", description="Creates barrier preventing retreat", effect="Arena sealed 30s"),
            Ability(name="Remember the Fallen", description="Gains power from deaths on this floor", effect="+5% damage per adventurer death this session"),
        ],
        weaknesses=["Lightning", "Exploiting oath loopholes"],
        resistances=["Physical", "Magic"],
        experience=300,
        loot=[
            LootDrop(item="Warden's Key Fragment", chance="Common"),
            LootDrop(item="Golden Armor Plate", chance="Rare"),
            LootDrop(item="Oath-Bound Blade", chance="Very Rare"),
        ],
        icon="⚜️",
        threat_level=4,
    ),
    Creature(
        id="brood_mother",
        name="The Brood Mother",
        title="Queen of the Web",
        category="miniboss",
        description="A Tomb Spider grown to monstrous proportions, mother to all the spiders infesting the upper halls. Her web spans entire chambers.",
        appearance="Elephant-sized spider with a bulbous abdomen pulsing with eggs. Crown of eyes covers her head. Legs end in blade-like points.",
        behavior="Rarely moves from central web. Summons offspring constantly. Protects egg sacs aggressively.",
        floors="4",
        health=400,
        damage=30,
        speed="Slow",
        abilities=[
            Ability(name="Impaling Leg", description="Strikes with sharpened limb", damage=35),
            Ability(name="Summon Brood", description="Spawns 3-5 Tomb Spiders", effect="Every 20s"),
            Ability(name="Web Tomb", description="Encases target in web cocoon", effect="Stun 5s, damage over time"),
            Ability(name="Mana Feast", description="Drains magic from all nearby targets", effect="AoE mana drain"),
        ],
        weaknesses=["Fire", "Destroying egg sacs"],
        resistances=["Poison", "Web immunity"],
        experience=250,
        loot=[
            LootDrop(item="Brood Silk", chance="Common"),
            LootDrop(item="Spider Queen Fang", chance="Rare"),
            LootDrop(item="Egg of the Brood", chance="Very Rare"),
        ],
        icon="🕸️",
        threat_level=4,
    ),

    # === BOSSES ===
    Creature(
        id="the_hollow_king",
        name="The Hollow King",
        title="First of the Fallen",
        category="boss",
        description="The first adventurer to die in the Citadel, transformed into something far worse than a simple Hollow. He rules the undead of the upper floors from his throne of bones.",
        appearance="Regal skeleton in crown of corroded gold. Royal robes hang in tatters. Sits on throne made of adventurer bones. Carries scepter that pulses with necromantic energy.",
        behavior="Summons minions before engaging. Commands undead tactically. Becomes more aggressive as health drops.",
        floors="5 (Boss Arena)",
        health=800,
        damage=35,
        speed="Normal",
        abilities=[
            Ability(name="Royal Decree", description="Commands all undead to attack target", effect="Focus fire"),
            Ability(name="Crown of Command", description="Raises fallen enemies as Hollows", effect="Resurrect slain enemies"),
            Ability(name="Death's Embrace", description="Life-draining beam attack", damage=25, effect="Heals for damage dealt"),
            Ability(name="Bone Throne", description="Summons bone spikes from floor", damage=40, effect="AoE"),
            Ability(name="Undying Majesty", description="Resurrects once at 30% health", effect="One-time revival"),
        ],
        weaknesses=["Holy", "Destroying the crown"],
        resistances=["Cold", "Poison", "Necrotic"],
        experience=500,
        loot=[
            LootDrop(item="Crown of the Hollow King", chance="Common"),
            LootDrop(item="Royal Bone", chance="Rare"),
            LootDrop(item="Scepter of Dominion", chance="Very Rare"),
            LootDrop(item="Key to the Depths", chance="Common"),
        ],
        icon="👑",
        threat_level=5,
    ),
    Creature(
        id="the_amalgam",
        name="The Amalgam",
        title="A Thousand Screaming Voices",
        category="boss",
        description="When too many die in one place, their essence can merge into something new. The Amalgam is made of hundreds of failed adventurers, fused into one nightmare.",
        appearance="Writhing mass of body parts. Faces emerge and sink back into the flesh. Dozens of arms reach in all directions. Constant wet, grinding sounds.",
        behavior="Moves erratically. Attacks with random limbs. Absorbs corpses to heal. Each face speaks different warnings.",
        floors="8 (Boss Arena)",
        health=1200,
        damage=30,
        speed="Slow",
        abilities=[
            Ability(name="Flailing Assault", description="Attacks multiple times randomly", damage=20, effect="3-6 hits"),
            Ability(name="Absorb", description="Consumes corpses to restore health", effect="Heal 100 per corpse"),
            Ability(name="Voices of the Lost", description="Psychic scream from all faces", damage=15, effect="AoE Fear"),
            Ability(name="Split Form", description="Separates into smaller amalgams at 50% HP", effect="Splits into 3 mini-bosses"),
            Ability(name="Reform", description="Mini-bosses recombine if not killed quickly", effect="Full heal if all 3 reunite"),
        ],
        weaknesses=["Fire", "Holy", "Killing splits quickly"],
        resistances=["Physical", "Psychic"],
        experience=800,
        loot=[
            LootDrop(item="Amalgam Flesh", chance="Common"),
            LootDrop(item="Fused Soul Crystal", chance="Rare"),
            LootDrop(item="Ring of the Lost", chance="Very Rare"),
            LootDrop(item="Fragment of Identity", chance="Very Rare"),
        ],
        icon="🫀",
        threat_level=5,
    ),

    # === UNIQUE CREATURES ===
    Creature(
        id="the_merchant",
        name="???",
        title="The Helpful Stranger",
        category="unique",
        description="A figure that appears in the strangest places, offering valuable items for... unusual prices. Some say it's a demon, others a god. No one knows for certain.",
        appearance="Shifts constantly. Sometimes a cloaked figure, sometimes a child, sometimes a beast. The only constant is the knowing smile.",
        behavior="Never hostile. Offers trades. Prices are always personal. Disappears if attacked, but remembers.",
        floors="Any",
        health=999,
        damage=0,
        speed="Normal",
        abilities=[
            Ability(name="Inventory of Wonders", description="Sells unique items", effect="Shop"),
            Ability(name="Fair Trade", description="Trades items, memories, or services", effect="Barter"),
            Ability(name="Vanish", description="Disappears if threatened", effect="Immune to damage"),
            Ability(name="Remember", description="Remembers how you treat it across runs", effect="Persistent reputation"),
        ],
        weaknesses=["None known"],
        resistances=["All"],
        experience=0,
        loot=[],
        icon="❓",
        threat_level=0,
    ),
]

# Category info
CATEGORIES = {
    "common": {"name": "Common", "description": "Frequently encountered enemies", "color": "#6b7280"},
    "elite": {"name": "Elite", "description": "Dangerous foes requiring caution", "color": "#3b82f6"},
    "miniboss": {"name": "Mini-Boss", "description": "Powerful guardians of key locations", "color": "#a855f7"},
    "boss": {"name": "Boss", "description": "The rulers of each domain", "color": "#f59e0b"},
    "unique": {"name": "Unique", "description": "One-of-a-kind encounters", "color": "#22c55e"},
}


@router.get("")
async def get_all_creatures():
    """Get all bestiary entries."""
    return {
        "creatures": [c.model_dump() for c in CREATURES],
        "total": len(CREATURES),
        "categories": CATEGORIES,
    }


@router.get("/categories")
async def get_categories():
    """Get creature categories."""
    category_counts = {}
    for creature in CREATURES:
        cat = creature.category
        category_counts[cat] = category_counts.get(cat, 0) + 1

    return {
        "categories": [
            {
                "id": cat_id,
                **cat_info,
                "count": category_counts.get(cat_id, 0),
            }
            for cat_id, cat_info in CATEGORIES.items()
        ]
    }


@router.get("/category/{category_id}")
async def get_creatures_by_category(category_id: str):
    """Get creatures in a specific category."""
    creatures = [c for c in CREATURES if c.category == category_id]
    return {
        "category": CATEGORIES.get(category_id),
        "creatures": [c.model_dump() for c in creatures],
        "count": len(creatures),
    }


@router.get("/creature/{creature_id}")
async def get_creature(creature_id: str):
    """Get a specific creature."""
    for creature in CREATURES:
        if creature.id == creature_id:
            return creature.model_dump()
    return {"error": "Creature not found"}


@router.get("/search")
async def search_creatures(q: str):
    """Search creatures by name or description."""
    query = q.lower()
    results = [
        c for c in CREATURES
        if query in c.name.lower()
        or query in c.description.lower()
        or (c.title and query in c.title.lower())
    ]
    return {
        "query": q,
        "results": [c.model_dump() for c in results],
        "count": len(results),
    }


@router.get("/floors/{floor}")
async def get_creatures_by_floor(floor: int):
    """Get creatures that appear on a specific floor."""
    results = []
    for creature in CREATURES:
        floor_range = creature.floors
        if floor_range == "Any" or floor_range == "All":
            results.append(creature)
        elif "-" in floor_range:
            # Handle ranges like "1-5"
            parts = floor_range.replace(" (Boss Arena)", "").split("-")
            try:
                min_floor, max_floor = int(parts[0]), int(parts[1])
                if min_floor <= floor <= max_floor:
                    results.append(creature)
            except ValueError:
                pass
        else:
            # Single floor
            try:
                if int(floor_range.replace(" (Boss Arena)", "")) == floor:
                    results.append(creature)
            except ValueError:
                pass

    return {
        "floor": floor,
        "creatures": [c.model_dump() for c in results],
        "count": len(results),
    }


@router.get("/stats")
async def get_bestiary_stats():
    """Get bestiary statistics."""
    category_counts = {}
    total_health = 0
    max_damage = 0

    for creature in CREATURES:
        cat = creature.category
        category_counts[cat] = category_counts.get(cat, 0) + 1
        total_health += creature.health
        if creature.damage > max_damage:
            max_damage = creature.damage

    return {
        "total_creatures": len(CREATURES),
        "by_category": category_counts,
        "average_health": total_health // len(CREATURES) if CREATURES else 0,
        "max_damage": max_damage,
    }
