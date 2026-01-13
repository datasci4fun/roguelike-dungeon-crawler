"""
Item Compendium API - Complete item database.

Built from actual game data in src/items/items.py.
Features:
- Item categories (Weapons, Armor, Shields, Accessories, Consumables, Keys)
- Stats (damage, defense, effects)
- Rarity tiers with colors
- Where to find items
"""

from typing import Optional
from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter(prefix="/api/items", tags=["items"])


class ItemEntry(BaseModel):
    """An item compendium entry."""
    id: str
    name: str
    category: str  # "weapon", "armor", "shield", "ring", "amulet", "consumable", "throwable", "key"
    subcategory: Optional[str] = None  # "melee", "ranged" for weapons
    description: str
    effect: str  # What it does
    rarity: str  # "common", "uncommon", "rare", "legendary"
    symbol: str
    stats: dict  # Flexible stats like {"attack": 3} or {"damage": 5, "range": 4}
    found_in: str  # Where to find it
    lore: Optional[str] = None


class CategoryInfo(BaseModel):
    """Category metadata."""
    id: str
    name: str
    description: str
    icon: str
    color: str
    count: int


# Rarity colors (matching frontend)
RARITY_COLORS = {
    "common": "#9ca3af",     # Gray
    "uncommon": "#22d3ee",   # Cyan
    "rare": "#3b82f6",       # Blue
    "epic": "#a855f7",       # Purple (not used yet)
    "legendary": "#fbbf24",  # Gold
}

# ============================================================================
# ITEM DATA (from src/items/items.py)
# ============================================================================

ITEMS: list[ItemEntry] = [
    # === MELEE WEAPONS ===
    ItemEntry(
        id="dagger",
        name="Dagger",
        category="weapon",
        subcategory="melee",
        description="A small but reliable blade. The most basic weapon for any adventurer.",
        effect="+1 ATK",
        rarity="common",
        symbol="/",
        stats={"attack_bonus": 1},
        found_in="Common drop on floors 1-3",
        lore="Simple steel, honestly forged. The Field has not touched these blades—yet."
    ),
    ItemEntry(
        id="iron_sword",
        name="Iron Sword",
        category="weapon",
        subcategory="melee",
        description="A well-balanced sword of quality iron. Standard armament for trained warriors.",
        effect="+3 ATK",
        rarity="uncommon",
        symbol="/",
        stats={"attack_bonus": 3},
        found_in="Found on floors 2-5, dropped by Orcs and Guards",
        lore="Military-grade steel, forged in Valdris before the edits began. Each blade remembers its maker's name—though the maker may not."
    ),
    ItemEntry(
        id="battle_axe",
        name="Battle Axe",
        category="weapon",
        subcategory="melee",
        description="A heavy two-handed axe capable of cleaving through armor. Slow but devastating.",
        effect="+5 ATK",
        rarity="rare",
        symbol="/",
        stats={"attack_bonus": 5},
        found_in="Rare drop on floors 4-7, found in treasure rooms",
        lore="Dwarven craftsmanship, edges that never dull. The metal came from deep beneath the mountains—close enough to the Field to carry its mark."
    ),
    ItemEntry(
        id="dragon_slayer",
        name="Dragon Slayer",
        category="weapon",
        subcategory="melee",
        description="A legendary blade forged to slay dragons. Its edge burns with inner fire.",
        effect="+8 ATK",
        rarity="legendary",
        symbol="/",
        stats={"attack_bonus": 8},
        found_in="Dropped only by the Dragon Emperor on floor 8",
        lore="The most powerful weapon to emerge from the dungeon depths. Forged in fires that burned before the kingdom had a name. Metallurgists who examine it find alloys that should not bond."
    ),

    # === RANGED WEAPONS ===
    ItemEntry(
        id="shortbow",
        name="Shortbow",
        category="weapon",
        subcategory="ranged",
        description="A compact bow suitable for close-quarters combat. Quick to draw but limited range.",
        effect="3 DMG, Range 4",
        rarity="common",
        symbol="}",
        stats={"damage": 3, "range": 4},
        found_in="Common drop on floors 1-4",
        lore="Hunting bows repurposed for dungeon delving. The string hums when enemies are near."
    ),
    ItemEntry(
        id="longbow",
        name="Longbow",
        category="weapon",
        subcategory="ranged",
        description="A full-sized bow with excellent range. Requires strength to draw effectively.",
        effect="5 DMG, Range 6",
        rarity="uncommon",
        symbol="}",
        stats={"damage": 5, "range": 6},
        found_in="Found on floors 3-6, dropped by Assassins",
        lore="Elven design, adapted for human hands. The wood remembers growing toward a sun that may have been different."
    ),
    ItemEntry(
        id="crossbow",
        name="Crossbow",
        category="weapon",
        subcategory="ranged",
        description="A mechanical bow with tremendous stopping power. Slow to reload but deadly accurate.",
        effect="7 DMG, Range 5",
        rarity="rare",
        symbol="}",
        stats={"damage": 7, "range": 5},
        found_in="Rare drop on floors 5-8, found in treasure rooms",
        lore="Precision engineering from the Ancient Library. The trigger mechanism contains gears that shouldn't fit but do."
    ),

    # === ARMOR ===
    ItemEntry(
        id="leather_armor",
        name="Leather Armor",
        category="armor",
        description="Light armor made from treated animal hides. Offers basic protection without hindering movement.",
        effect="+1 DEF",
        rarity="common",
        symbol="[",
        stats={"defense_bonus": 1},
        found_in="Common drop on floors 1-3",
        lore="Cured hide, simply made. Protection against claws and teeth—less effective against the Field's edits."
    ),
    ItemEntry(
        id="chain_mail",
        name="Chain Mail",
        category="armor",
        description="Interlocking metal rings providing solid protection. The standard of professional soldiers.",
        effect="+3 DEF",
        rarity="uncommon",
        symbol="[",
        stats={"defense_bonus": 3},
        found_in="Found on floors 2-5, dropped by Guards and Orcs",
        lore="Thousands of rings, each one hand-fitted. The craftsman's patience is woven into the metal."
    ),
    ItemEntry(
        id="plate_armor",
        name="Plate Armor",
        category="armor",
        description="Full plate armor offering maximum protection. Heavy but nearly impenetrable.",
        effect="+5 DEF",
        rarity="rare",
        symbol="[",
        stats={"defense_bonus": 5},
        found_in="Rare drop on floors 4-7, found in treasure rooms",
        lore="Knight's armor from the old kingdom. The sigils have been scratched away—no one remembers which house they represented."
    ),
    ItemEntry(
        id="dragon_scale_armor",
        name="Dragon Scale Armor",
        category="armor",
        description="Legendary armor crafted from dragon scales. Lighter than steel yet harder than diamond.",
        effect="+8 DEF",
        rarity="legendary",
        symbol="[",
        stats={"defense_bonus": 8},
        found_in="Dropped only by the Dragon Emperor on floor 8",
        lore="Armor crafted from scales that should not exist. Each scale shifts color in torchlight. The armor remembers being worn by people who never existed."
    ),

    # === SHIELDS ===
    ItemEntry(
        id="wooden_shield",
        name="Wooden Shield",
        category="shield",
        description="A simple wooden shield. Offers basic blocking capability.",
        effect="+1 DEF, 10% Block",
        rarity="common",
        symbol=")",
        stats={"defense_bonus": 1, "block_chance": 10},
        found_in="Common drop on floors 1-3",
        lore="Oak planks bound with iron. Simple, reliable, forgettable."
    ),
    ItemEntry(
        id="iron_shield",
        name="Iron Shield",
        category="shield",
        description="A sturdy iron shield with reinforced edges. Reliable protection in close combat.",
        effect="+2 DEF, 15% Block",
        rarity="uncommon",
        symbol=")",
        stats={"defense_bonus": 2, "block_chance": 15},
        found_in="Found on floors 2-5, dropped by Guards",
        lore="Military issue, stamped with serial numbers that don't match any army's records."
    ),
    ItemEntry(
        id="tower_shield",
        name="Tower Shield",
        category="shield",
        description="A massive shield that can cover the entire body. Excellent for defensive fighting.",
        effect="+4 DEF, 25% Block",
        rarity="rare",
        symbol=")",
        stats={"defense_bonus": 4, "block_chance": 25},
        found_in="Rare drop on floors 4-7, found in treasure rooms",
        lore="Siege equipment repurposed for dungeon crawling. The scratches on its face tell stories of battles that may never have happened."
    ),

    # === RINGS ===
    ItemEntry(
        id="ring_of_strength",
        name="Ring of Strength",
        category="ring",
        description="A gold ring inscribed with runes of power. Grants the wearer enhanced strength.",
        effect="+2 ATK",
        rarity="uncommon",
        symbol="o",
        stats={"attack": 2},
        found_in="Found on floors 3-6, rare treasure room drop",
        lore="Power that feels borrowed. The ring knows who should be wearing it—and it isn't you."
    ),
    ItemEntry(
        id="ring_of_defense",
        name="Ring of Defense",
        category="ring",
        description="A silver ring that shimmers with protective magic. Toughens the wearer's body.",
        effect="+2 DEF",
        rarity="uncommon",
        symbol="o",
        stats={"defense": 2},
        found_in="Found on floors 3-6, rare treasure room drop",
        lore="Skin hardens in ways that should not heal. The protection is real. The cost is memories you won't miss—until you need them."
    ),
    ItemEntry(
        id="ring_of_speed",
        name="Ring of Speed",
        category="ring",
        description="A platinum ring that hums with kinetic energy. Quickens the wearer's movements.",
        effect="+1 Move Speed",
        rarity="rare",
        symbol="o",
        stats={"speed": 1},
        found_in="Rare drop on floors 5-8, boss reward",
        lore="Time moves differently for the wearer. Moments stretch. Others seem to slow. The ring does not explain the mechanism."
    ),

    # === AMULETS ===
    ItemEntry(
        id="amulet_of_health",
        name="Amulet of Health",
        category="amulet",
        description="A ruby amulet that pulses with vitality. Strengthens the wearer's life force.",
        effect="+10 Max HP",
        rarity="uncommon",
        symbol="&",
        stats={"max_health": 10},
        found_in="Found on floors 3-6, rare treasure room drop",
        lore="The body forgets its limits. Wounds that should kill merely wound. The amulet remembers what you should be."
    ),
    ItemEntry(
        id="amulet_of_resistance",
        name="Amulet of Resistance",
        category="amulet",
        description="An opal amulet that glows faintly. Protects against harmful status effects.",
        effect="25% Status Resist",
        rarity="rare",
        symbol="&",
        stats={"resistance": 25},
        found_in="Rare drop on floors 5-8, boss reward",
        lore="Pain becomes optional. Poison slides off. Fire hesitates. The amulet bargains with reality on your behalf."
    ),
    ItemEntry(
        id="amulet_of_vision",
        name="Amulet of Vision",
        category="amulet",
        description="An emerald amulet that gleams with inner light. Extends the wearer's sight.",
        effect="+2 Vision Range",
        rarity="uncommon",
        symbol="&",
        stats={"vision": 2},
        found_in="Found on floors 4-7, dropped by Necromancers",
        lore="See what should remain hidden. The darkness parts reluctantly. Sometimes, it shows you things it shouldn't."
    ),

    # === CONSUMABLES ===
    ItemEntry(
        id="health_potion",
        name="Health Potion",
        category="consumable",
        description="A red potion that restores vitality. The most common healing item in the dungeon.",
        effect="Restores 10 HP",
        rarity="common",
        symbol="!",
        stats={"heal": 10},
        found_in="Common drop throughout all floors",
        lore="The wounds close, but do they remember being wounds? Healing potions are the most trusted sky-touched items. They work. No one asks how."
    ),
    ItemEntry(
        id="strength_potion",
        name="Strength Potion",
        category="consumable",
        description="An orange potion that permanently enhances muscle density. Highly prized by warriors.",
        effect="Permanently +1 ATK",
        rarity="uncommon",
        symbol="!",
        stats={"permanent_attack": 1},
        found_in="Uncommon drop on floors 3-8, boss reward",
        lore="The muscles grow. Were they always that shape? Strength potions rewrite the body. The old physique is gone—edited away."
    ),
    ItemEntry(
        id="scroll_of_teleport",
        name="Scroll of Teleport",
        category="consumable",
        description="A magical scroll that teleports the reader to a random location on the current floor.",
        effect="Random teleport",
        rarity="uncommon",
        symbol="?",
        stats={"teleport": True},
        found_in="Uncommon drop on floors 2-8, dropped by Arcane Keeper",
        lore="Both places remember you arriving. The scroll does not explain how you can be in two places at once—it simply ensures you are."
    ),

    # === THROWABLES ===
    ItemEntry(
        id="throwing_knife",
        name="Throwing Knife",
        category="throwable",
        description="A balanced knife designed for throwing. Single use but reliable damage.",
        effect="5 DMG, Range 4",
        rarity="common",
        symbol="*",
        stats={"damage": 5, "range": 4},
        found_in="Common drop throughout all floors",
        lore="Steel that remembers being thrown. Each knife knows where it wants to go."
    ),
    ItemEntry(
        id="bomb",
        name="Bomb",
        category="throwable",
        description="An explosive device that damages all creatures in an area. Handle with care.",
        effect="10 DMG AOE + Stun, Range 3",
        rarity="uncommon",
        symbol="*",
        stats={"damage": 10, "range": 3, "effect": "stun", "aoe": True},
        found_in="Uncommon drop on floors 3-8, found in treasure rooms",
        lore="Fire contained in a shell. The explosion happens in several realities at once—that's why it stuns."
    ),
    ItemEntry(
        id="poison_vial",
        name="Poison Vial",
        category="throwable",
        description="A glass vial of concentrated toxin. Breaks on impact, poisoning the target.",
        effect="3 DMG + Poison, Range 4",
        rarity="uncommon",
        symbol="*",
        stats={"damage": 3, "range": 4, "effect": "poison"},
        found_in="Uncommon drop on floors 2-8, dropped by Assassins",
        lore="Distilled from creatures that shouldn't exist. The poison works on systems that have no biology."
    ),

    # === KEYS ===
    ItemEntry(
        id="bronze_key",
        name="Bronze Key",
        category="key",
        description="A simple bronze key. Opens bronze-locked doors found in the upper dungeon.",
        effect="Opens bronze doors",
        rarity="common",
        symbol="k",
        stats={"key_level": 1},
        found_in="Common drop on floors 1-3, found near locked doors",
        lore="Permission made solid. The door recognizes right, not shape."
    ),
    ItemEntry(
        id="silver_key",
        name="Silver Key",
        category="key",
        description="An ornate silver key. Opens silver-locked doors guarding better treasures.",
        effect="Opens silver doors",
        rarity="uncommon",
        symbol="k",
        stats={"key_level": 2},
        found_in="Uncommon drop on floors 3-6, guarded by elite enemies",
        lore="Authority crystallized. The silver remembers who commissioned the door—even if no one else does."
    ),
    ItemEntry(
        id="gold_key",
        name="Gold Key",
        category="key",
        description="A magnificent gold key. Opens gold-locked doors protecting the most valuable caches.",
        effect="Opens gold doors",
        rarity="rare",
        symbol="k",
        stats={"key_level": 3},
        found_in="Rare drop on floors 5-8, boss reward",
        lore="Sovereignty in metal form. The gold key opens doors that were never meant to open—and closes some that should stay shut."
    ),
]

# Category definitions
CATEGORIES = [
    CategoryInfo(
        id="weapon",
        name="Weapons",
        description="Melee and ranged weapons for dealing damage",
        icon="⚔️",
        color="#ef4444",
        count=len([i for i in ITEMS if i.category == "weapon"])
    ),
    CategoryInfo(
        id="armor",
        name="Armor",
        description="Body armor for protection against attacks",
        icon="🛡️",
        color="#3b82f6",
        count=len([i for i in ITEMS if i.category == "armor"])
    ),
    CategoryInfo(
        id="shield",
        name="Shields",
        description="Off-hand equipment for blocking attacks",
        icon="🔰",
        color="#22c55e",
        count=len([i for i in ITEMS if i.category == "shield"])
    ),
    CategoryInfo(
        id="ring",
        name="Rings",
        description="Magical rings providing passive bonuses",
        icon="💍",
        color="#a855f7",
        count=len([i for i in ITEMS if i.category == "ring"])
    ),
    CategoryInfo(
        id="amulet",
        name="Amulets",
        description="Enchanted necklaces with powerful effects",
        icon="📿",
        color="#f59e0b",
        count=len([i for i in ITEMS if i.category == "amulet"])
    ),
    CategoryInfo(
        id="consumable",
        name="Consumables",
        description="Single-use items like potions and scrolls",
        icon="🧪",
        color="#ec4899",
        count=len([i for i in ITEMS if i.category == "consumable"])
    ),
    CategoryInfo(
        id="throwable",
        name="Throwables",
        description="Items that can be thrown at enemies",
        icon="💣",
        color="#f97316",
        count=len([i for i in ITEMS if i.category == "throwable"])
    ),
    CategoryInfo(
        id="key",
        name="Keys",
        description="Keys for unlocking sealed doors",
        icon="🗝️",
        color="#6b7280",
        count=len([i for i in ITEMS if i.category == "key"])
    ),
]


@router.get("")
async def get_items():
    """Get all items in the compendium."""
    return {"items": ITEMS, "total": len(ITEMS)}


@router.get("/categories")
async def get_categories():
    """Get item categories with counts."""
    return {"categories": CATEGORIES}


@router.get("/category/{category_id}")
async def get_items_by_category(category_id: str):
    """Get items filtered by category."""
    filtered = [i for i in ITEMS if i.category == category_id]
    return {"items": filtered, "total": len(filtered)}


@router.get("/rarity/{rarity}")
async def get_items_by_rarity(rarity: str):
    """Get items filtered by rarity."""
    filtered = [i for i in ITEMS if i.rarity == rarity]
    return {"items": filtered, "total": len(filtered)}


@router.get("/{item_id}")
async def get_item(item_id: str):
    """Get a specific item by ID."""
    for item in ITEMS:
        if item.id == item_id:
            return item
    return {"error": "Item not found"}
