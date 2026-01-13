"""
Lore API - World-building and story content.

Features:
- Lore categories (World, Locations, Characters, Creatures, Artifacts)
- Individual lore entries with rich content
- Discovery tracking (which entries player has found)
- Chapter-based story progression
"""

from typing import Optional
from fastapi import APIRouter, Depends
from pydantic import BaseModel

from ..core.auth import get_current_user_optional
from ..models.user import User

router = APIRouter(prefix="/api/lore", tags=["lore"])


class LoreEntry(BaseModel):
    """A single lore entry."""
    id: str
    title: str
    subtitle: Optional[str] = None
    content: str
    category: str
    image: Optional[str] = None
    discovered: bool = True  # For future: track player discoveries


class LoreCategory(BaseModel):
    """A lore category with entries."""
    id: str
    name: str
    description: str
    icon: str
    entries: list[LoreEntry]


# ============================================================================
# LORE CONTENT - The World of the Sunken Citadel
# ============================================================================

WORLD_LORE = [
    LoreEntry(
        id="origins",
        title="The Sundering",
        subtitle="How the World Broke",
        category="world",
        content="""Long ago, the world was whole. The great empire of Valdris stretched across the
known lands, its towers touching the clouds, its mines delving deep into the earth's bones.
The Valdrian mages had conquered death itself, binding souls to service and bending reality
to their will.

But power breeds hubris. In their arrogance, the Archmages attempted the Ritual of Ascension—
a spell to elevate themselves to godhood. The ritual failed catastrophically. Reality itself
cracked like glass, and the Sundering began.

Mountains rose and fell in moments. The seas boiled and froze. The capital city of Valdris
Prime sank into the earth, swallowed by the very foundations it had been built upon. In its
place remained only the Sunken Citadel—a twisted labyrinth of ruins, descending endlessly
into darkness.

That was three hundred years ago. The surface world has slowly healed, but the Citadel
remains, a wound in the earth that refuses to close. And from its depths, ancient evils
are beginning to stir."""
    ),
    LoreEntry(
        id="citadel",
        title="The Sunken Citadel",
        subtitle="A Wound That Will Not Heal",
        category="world",
        content="""The Sunken Citadel is not merely ruins—it is a living scar upon reality. The
failed Ascension Ritual left the fabric of existence thin here, allowing things from
elsewhere to seep through. Each floor descends deeper into madness, where the laws of
nature hold less and less sway.

Adventurers speak of floors where gravity shifts without warning, where time flows
backwards, where shadows have teeth. The deeper one goes, the stranger things become.
Some say the Citadel has no bottom—that it descends forever into an abyss older than
the world itself.

Yet still they come. Treasure hunters seeking Valdrian gold. Scholars pursuing lost
knowledge. Warriors testing their mettle. The desperate seeking salvation. Most never
return. Those who do are... changed.

The Citadel takes something from everyone who enters. But it also gives. Power. Wealth.
Secrets. The question is always the same: is the price worth paying?"""
    ),
    LoreEntry(
        id="magic",
        title="The Weave Unraveled",
        subtitle="Magic in a Broken World",
        category="world",
        content="""Before the Sundering, magic flowed through the world like blood through veins—
orderly, predictable, controlled. The Valdrian mages had mapped every current, catalogued
every spell, systematized the mystical arts into a precise science.

The Sundering changed everything. The orderly Weave of magic was torn apart, leaving
behind tangled threads of raw power. Modern magic is a dangerous art, more instinct
than science. Spells that once required careful preparation now burst forth unbidden.
Enchantments decay or mutate unpredictably.

Within the Citadel, magic is even more unstable. Ancient Valdrian artifacts still
function, but not always as intended. New forms of sorcery have emerged from the
chaos—wild magic that answers to emotion rather than intellect.

Some say the Weave is slowly repairing itself. Others believe it is dying, and when
the last threads snap, magic will leave the world forever. In the meantime, those
who wield power must do so carefully, lest it consume them."""
    ),
]

LOCATION_LORE = [
    LoreEntry(
        id="entrance",
        title="The Gaping Maw",
        subtitle="Where All Journeys Begin",
        category="locations",
        content="""The main entrance to the Sunken Citadel is called the Gaping Maw—a vast
crack in the earth where the ground simply falls away into darkness. Crude stairs have
been carved into the rock by generations of adventurers, descending into a grand foyer
that was once the palace's main hall.

A small camp has grown around the Maw, populated by merchants, healers, and those who
profit from adventurers' desperation. They call it Hope's End, though most just call it
"the Camp." It's the last taste of sunlight many will ever know.

Strange winds blow up from the depths, carrying whispers in dead languages and the
scent of dust and copper. Old hands say you can tell how deep someone has gone by
how they react to those winds. Newcomers shiver. Veterans don't even notice anymore.

The truly deep delvers, the ones who've seen the bottom floors—they smile when the
wind blows. No one asks them why."""
    ),
    LoreEntry(
        id="upper_halls",
        title="The Upper Halls",
        subtitle="Floors 1-5: The Broken Palace",
        category="locations",
        content="""The first five floors of the Citadel were once the grand palace of Valdris
Prime. Shattered marble columns still line the corridors, and faded tapestries rot on
the walls. This is where most adventurers cut their teeth—and where most of them die.

The Upper Halls are infested with lesser creatures: rats grown large on magical residue,
animated suits of armor still following ancient patrol routes, and the ever-present
Hollow Ones—former adventurers reduced to shambling husks.

Despite the dangers, these floors are well-mapped. Experienced guides can navigate
them blindfolded, and rescue parties regularly venture in to retrieve the bodies of
the fallen. It's almost civilized.

Almost. The Upper Halls still claim dozens of lives each month. They are a reminder
that in the Citadel, even "safe" is relative."""
    ),
    LoreEntry(
        id="depths",
        title="The Writhing Depths",
        subtitle="Floors 6-10: Where Sanity Frays",
        category="locations",
        content="""Below the Upper Halls, the Citadel begins to show its true nature. The
architecture becomes impossible—stairs that lead to their own beginnings, rooms larger
on the inside than the outside, corridors that exist only when observed.

The Writhing Depths earned their name from the walls themselves, which seem to pulse
and shift when no one is looking directly at them. Experienced delvers learn to trust
their peripheral vision more than their direct sight.

Here dwell creatures that have no business existing: amalgamations of flesh and metal,
shadows that hunger, things that wear the faces of lost loved ones. The magical
corruption is so intense that prolonged exposure begins to affect the mind.

Few maps of the Depths exist, and those that do contradict each other. The floors
themselves seem to shift, rearranging when the Citadel "breathes." Navigation is
as much intuition as skill."""
    ),
    LoreEntry(
        id="abyss",
        title="The Lightless Abyss",
        subtitle="Floors 11+: Beyond Knowledge",
        category="locations",
        content="""No reliable accounts exist of floors beyond the tenth. Those few who claim
to have descended further speak in riddles and metaphors, their minds clearly broken
by what they witnessed.

They speak of a place where darkness is not merely absence of light, but a presence
unto itself. Where the dead speak more clearly than the living. Where time has no
meaning and distance is measured in heartbeats.

Some say the Lightless Abyss is where the Valdrian Archmages ended up after their
failed ascension—not dead, but transformed into something beyond mortality. Others
believe it is a gateway to other realms, other realities bleeding through the wounds
left by the Sundering.

The Guild officially discourages exploration beyond the tenth floor. Not because
they fear the death toll—death is accepted in this profession. They fear what might
come back up."""
    ),
]

CHARACTER_LORE = [
    LoreEntry(
        id="guildmaster",
        title="Aldric the Unbroken",
        subtitle="Guildmaster of the Delvers",
        category="characters",
        content="""No one knows how many times Aldric has descended into the Citadel. He stopped
counting at two hundred. What everyone knows is that he always comes back, hence his
title: the Unbroken.

Aldric founded the Delvers' Guild thirty years ago, bringing order to what had been
a chaotic free-for-all. He established the ranking system, the rescue protocols, the
mapping initiatives. Under his leadership, the mortality rate dropped from ninety
percent to merely seventy.

The old warrior is missing his left arm below the elbow—taken by something on the
ninth floor that he refuses to name. His right eye is milky white, blinded by a
curse that no healer could lift. Yet he still ventures into the Citadel once a month,
"to keep my edge," he says.

Rumors persist that Aldric has seen the bottom. That he knows what lies at the heart
of the Citadel. When asked, he simply smiles and changes the subject. That smile
never reaches his eyes."""
    ),
    LoreEntry(
        id="merchant",
        title="Whisper",
        subtitle="The Information Broker",
        category="characters",
        content="""No one knows Whisper's real name, their face, or even their gender—they
appear differently to everyone who meets them. What everyone agrees on is that Whisper
knows everything worth knowing about the Citadel.

Need to know what's lurking on floor seven this week? Whisper can tell you. Looking
for a specific artifact? Whisper knows who found it and what happened to them. Want
to know the safest route to a particular chamber? Whisper has maps that shouldn't exist.

The price is always fair but never comfortable. Whisper deals in secrets, memories,
and occasionally small services. Those who try to cheat Whisper tend to meet unfortunate
ends—not through any violence on Whisper's part, but simply because the Citadel seems
to turn against them.

Some believe Whisper is a fragment of the Citadel itself, given form and purpose.
Others think they're the last Valdrian mage, still alive after three centuries through
means unknown. Whisper, characteristically, refuses to comment."""
    ),
    LoreEntry(
        id="healer",
        title="Sister Morrow",
        subtitle="The Mender of Flesh and Spirit",
        category="characters",
        content="""Sister Morrow runs the infirmary at Hope's End, tending to the broken bodies
and shattered minds that the Citadel spits back out. She never asks for payment,
though donations are accepted. She never turns anyone away, no matter how far gone.

Before the Citadel, Morrow was a battlefield surgeon in the Southern Wars. She saw
things that drove stronger people mad. When the wars ended, she found she couldn't
stop—couldn't return to a peaceful life. The Citadel gave her purpose again.

Her skills border on miraculous. Wounds that should be fatal close under her hands.
Curses that should be permanent fade away. Some whisper that she made a deal with
something in the depths—healing power in exchange for... something.

Morrow never confirms or denies the rumors. She simply works, day after day,
patching together the broken and sending them back in. When asked why, she says
only: "Everyone deserves a second chance. Even if they waste it." """
    ),
]

CREATURE_LORE = [
    LoreEntry(
        id="hollow",
        title="The Hollow Ones",
        subtitle="What Adventurers Become",
        category="creatures",
        content="""The most common danger in the Upper Halls, Hollow Ones are the reanimated
corpses of fallen adventurers. But unlike simple undead, they retain fragments of
their former skills—a Hollow warrior still knows how to swing a sword, a Hollow mage
can still cast corrupted spells.

The transformation occurs when a body is left in the Citadel too long. The ambient
magic seeps in, filling the void left by the departed soul with something else—a
hungry, mindless drive to destroy the living.

What makes Hollows truly unsettling is recognition. Delvers often encounter Hollows
wearing familiar faces—former companions, lost friends, that cheerful newcomer who
was so confident last week. The Citadel is cruel that way.

The Guild maintains lists of the lost, and rescue parties are trained to recognize
the signs of turning. A recovered body buried properly outside the Citadel won't
rise. A body left too long becomes another hazard for those who follow."""
    ),
    LoreEntry(
        id="mimic",
        title="Mimics",
        subtitle="Hunger Wearing Familiar Shapes",
        category="creatures",
        content="""Mimics are perhaps the Citadel's cruelest inhabitants. These shapeshifting
predators can assume the form of virtually any inanimate object—treasure chests,
doors, weapons, even fallen companions.

The creatures evolved—or were created—to exploit adventurer behavior. They know
that delvers can't resist treasure, can't ignore potential loot, can't leave a
chest unopened. They are patient hunters, sometimes waiting months for prey.

Experienced delvers develop rituals: poking everything with a ten-foot pole,
never touching treasure without testing it first, never trusting anything that
seems too good to be true. Even then, mimics claim dozens of victims yearly.

The truly ancient mimics are far more sophisticated. They can mimic entire rooms,
complete with false walls and illusory treasures. By the time a victim realizes
the deception, they're already being digested."""
    ),
    LoreEntry(
        id="shadow",
        title="Shadow Stalkers",
        subtitle="Darkness Given Hunger",
        category="creatures",
        content="""In the Writhing Depths and below, shadows have teeth. Shadow Stalkers are
creatures of pure darkness, existing only where light fails to reach. They cannot
be killed, only driven back—and light sources in the Citadel have a way of failing.

The creatures don't eat flesh—they consume something less tangible. Victims of
Shadow Stalkers are found intact but hollow, their eyes empty, their minds simply...
gone. What remains is technically alive but completely vacant.

Stalkers are drawn to negative emotions: fear, despair, anger. A terrified delver
shines like a beacon to them. The most successful deep delvers cultivate a state
of emotional detachment, denying the Stalkers any purchase.

Some scholars theorize that Shadow Stalkers are fragments of the void that exists
between worlds, drawn into reality by the Sundering. If true, they are not merely
dangerous—they are fundamentally alien, following rules no mortal can comprehend."""
    ),
    LoreEntry(
        id="guardian",
        title="The Eternal Guardians",
        subtitle="Duty Beyond Death",
        category="creatures",
        content="""Not all that remains of Valdris is hostile. The Eternal Guardians were the
elite protectors of the empire, bound by unbreakable oaths to defend specific
locations or treasures. Three centuries later, they still stand watch.

Unlike Hollows, Guardians retain their intelligence and personality. They can
speak, reason, even negotiate. But their oaths supersede everything else—they
cannot allow passage to protected areas, regardless of circumstances.

Some Guardians have gone mad from centuries of isolation. Others have developed
strange philosophies to cope with their endless existence. A few have found
loopholes in their oaths, allowing them to aid those they deem worthy.

The most tragic are those who have forgotten what they guard. They stand before
doors that lead nowhere, protecting treasures that crumbled to dust generations
ago, unable to abandon posts that no longer have meaning."""
    ),
]

ARTIFACT_LORE = [
    LoreEntry(
        id="soulblade",
        title="The Soulblades",
        subtitle="Weapons That Remember",
        category="artifacts",
        content="""Valdrian weaponsmiths created blades that could absorb the essence of their
wielders. Each kill, each battle, each moment of triumph or despair was recorded
in the metal itself. Over time, these Soulblades developed personalities, preferences,
even desires.

A Soulblade grows more powerful as it accumulates experiences, but it also becomes
more demanding. Ancient Soulblades have been known to refuse certain wielders, to
compel specific actions, even to betray users who disappoint them.

The most powerful Soulblades contain the accumulated memories of hundreds of warriors
spanning centuries. Wielding one is less like using a weapon and more like forming
a partnership—or sometimes, surrendering to a possession.

The Citadel contains many Soulblades, abandoned by fallen delvers or lying in
ancient armories. They wait in the darkness, hungry for new wielders, new
experiences, new souls to add to their collection."""
    ),
    LoreEntry(
        id="heartstone",
        title="Heartstones",
        subtitle="Crystallized Life Force",
        category="artifacts",
        content="""Heartstones are crystallized magical energy, condensed from the ambient power
that saturates the Citadel. They form naturally in areas of intense magical
concentration, growing like strange geometric tumors from walls and floors.

Delvers prize Heartstones above almost anything else. The concentrated magic within
can power artifacts, fuel spells, heal wounds, even extend life. A large Heartstone
can make a delver wealthy enough to retire.

But Heartstones are addictive. Those who use them directly—absorbing the magic into
their bodies—find themselves craving more. The magic enhances them but also changes
them, pushing them toward something not quite human.

Long-term Heartstone users develop crystalline growths on their skin, their eyes
take on an inner glow, and their thinking becomes... different. The final stages
of addiction transform users into living crystals, conscious but immobile, forever
hungry for more magic they can never reach."""
    ),
    LoreEntry(
        id="maps",
        title="The Living Maps",
        subtitle="Charts That Know Too Much",
        category="artifacts",
        content="""Among the most sought-after treasures in the Citadel are the Living Maps—
Valdrian cartographic artifacts that update themselves in real-time, showing the
ever-shifting layout of the depths.

These maps are not merely enchanted parchment. They are partially sentient, aware
of their surroundings and capable of limited communication. A Living Map will mark
dangers, highlight treasures, even warn of ambushes—if it likes its owner.

Living Maps have personalities shaped by their history. A map that belonged to
cautious delvers will emphasize safe routes. One carried by treasure hunters will
highlight valuable locations. One that's seen too many owners die may become fatalistic
or even treacherous.

The oldest Living Maps are said to have mapped the entire Citadel, including the
Lightless Abyss. If such maps exist, they would be invaluable—and almost certainly
dangerous. Some knowledge has too high a price."""
    ),
]

# Combine all lore into categories
LORE_CATEGORIES = [
    LoreCategory(
        id="world",
        name="World & History",
        description="The origins of the world and the Sundering that broke it",
        icon="🌍",
        entries=WORLD_LORE,
    ),
    LoreCategory(
        id="locations",
        name="Locations",
        description="The treacherous floors and chambers of the Sunken Citadel",
        icon="🏰",
        entries=LOCATION_LORE,
    ),
    LoreCategory(
        id="characters",
        name="Characters",
        description="The souls who dwell at the Citadel's edge",
        icon="👤",
        entries=CHARACTER_LORE,
    ),
    LoreCategory(
        id="creatures",
        name="Creatures",
        description="The horrors that lurk in the depths",
        icon="👹",
        entries=CREATURE_LORE,
    ),
    LoreCategory(
        id="artifacts",
        name="Artifacts",
        description="Magical items of power and peril",
        icon="✨",
        entries=ARTIFACT_LORE,
    ),
]


@router.get("")
async def get_all_lore():
    """Get all lore categories and entries."""
    return {
        "categories": [cat.model_dump() for cat in LORE_CATEGORIES],
        "total_entries": sum(len(cat.entries) for cat in LORE_CATEGORIES),
    }


@router.get("/categories")
async def get_lore_categories():
    """Get lore category list (without full entries)."""
    return {
        "categories": [
            {
                "id": cat.id,
                "name": cat.name,
                "description": cat.description,
                "icon": cat.icon,
                "entry_count": len(cat.entries),
            }
            for cat in LORE_CATEGORIES
        ]
    }


@router.get("/category/{category_id}")
async def get_lore_category(category_id: str):
    """Get a specific lore category with all entries."""
    for cat in LORE_CATEGORIES:
        if cat.id == category_id:
            return cat.model_dump()
    return {"error": "Category not found"}


@router.get("/entry/{entry_id}")
async def get_lore_entry(entry_id: str):
    """Get a specific lore entry."""
    for cat in LORE_CATEGORIES:
        for entry in cat.entries:
            if entry.id == entry_id:
                return entry.model_dump()
    return {"error": "Entry not found"}


@router.get("/search")
async def search_lore(q: str):
    """Search lore entries by title or content."""
    query = q.lower()
    results = []

    for cat in LORE_CATEGORIES:
        for entry in cat.entries:
            if query in entry.title.lower() or query in entry.content.lower():
                results.append({
                    **entry.model_dump(),
                    "category_name": cat.name,
                })

    return {
        "query": q,
        "results": results,
        "count": len(results),
    }
