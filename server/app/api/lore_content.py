"""
Lore content data - The World of Valdris.

Built from LORE_COMPENDIUM.md. Contains all lore entries organized by category.
"""

from .lore_models import LoreEntry

# ============================================================================
# WORLD LORE - The Skyfall Seed Canon
# ============================================================================

WORLD_LORE = [
    LoreEntry(
        id="prologue",
        title="The Wound Beneath",
        subtitle="How the World is Being Rewritten",
        category="world",
        content="""Long ago, something fell from the sky and buried itself beneath Valdris.

Not a meteor. Not a god. Something that dreams in geometries that rewrite what touches them.

The kingdom did not fall in a single night. It was edited, slowly, over generations.

The dungeon is not a place that was built. It is a wound. A seam where reality frays. Now the edits are accelerating.

You are not here for gold or glory.

Some who descend return—but without their meaning. They stagger out empty-eyed, wordless, their names vanishing from records within days. No one returns with a story that holds.

Last week, your mother called you by a different name. Not as a mistake—like she had never known any other.

In the town registry, your birth record has a thin blank line where your surname should be.

A storm rolls over the hills. In the morning, your house key fits your door... and also your neighbor's. Your neighbor insists it has always been that way.

At noon, the palace bell rings twice—two coronations, separated by a breath. The city applauds both.

By evening, your brother's portrait is still on the mantle. But no one can remember who the boy is.

That is when you understand: the Field is no longer underground. It is choosing what the world has always been.

You descend because the Field is rewriting your home. Your monarch speaks with two voices now. Your family tree has branches that never existed.

If you do not find the source and stabilize it, everyone you love will be replaced.

Or worse: they will have always been someone else."""
    ),
    LoreEntry(
        id="skyfall_seed",
        title="The Skyfall Seed",
        subtitle="What Fell From the Sky",
        category="world",
        content="""Centuries ago, during a storm that lasted seven days, something descended through the clouds above Valdris. The histories call it many things: the Star-Heart, the Dreaming Stone, the Skyfall Seed. None of these names are correct. Names imply understanding.

What fell was not an object but a field—a localized region where reality follows different rules. The physical "seed" at its center is merely the densest point of an influence that extends outward through stone, through water, through meaning itself.

The Field does not invade. It edits.

Where the Field touches, legitimacy becomes fluid. Authority can be rewritten. A king may wake to find his bloodline contains ancestors who never lived—and no one remembers otherwise. Documents change. Memories shift. The Field does not create lies; it makes new truths.

The dungeon beneath Valdris is not a structure. It is the Field's geography—reality folded into layers, each layer a pocket where the edits have crystallized into stable (if nightmarish) forms."""
    ),
    LoreEntry(
        id="rules_of_field",
        title="Rules of the Field",
        subtitle="Constraints That Make Survival Possible",
        category="world",
        content="""The Field is not omnipotent. It operates under constraints that make survival—and resistance—possible:

IT REQUIRES ANCHORS
The Field spreads through symbols of legitimate authority: crowns, seals, oaths, records, bloodlines. Without an anchor, it cannot edit.

IT EDITS CONSENSUS, NOT PHYSICS
The Field changes what is agreed upon, not raw matter. A stone is a stone. But who owns the stone, who named the stone, what the stone means—these can be rewritten.

IT CANNOT REWRITE THE UNWITNESSED
Events that leave no record, no memory, no trace are immune. This is why delvers matter—and why the Field consumes their stories on the way out.

STORM PULSES ACCELERATE EDITS
When lightning strikes the fault lines above the Seed, the Field surges. Major rewrites happen during storms.

SEAMS ARE LOW-SIGNAL CORRIDORS
The passages between pockets are where the Field's grip is thinnest. Travel is possible because the seams are not yet fully written.

CONTRADICTIONS CAN COEXIST
The Field does not resolve paradoxes; it makes them both true. Two histories, two kings, two versions—all equally real until one is witnessed more than the other.

Understanding these rules will not save you. But it may help you know when you are being edited."""
    ),
    LoreEntry(
        id="counterfeit_reign",
        title="The Counterfeit Reign",
        subtitle="The Threat on the Surface",
        category="world",
        content="""The threat is not distant. It is happening now.

SYMPTOMS OF THE REWRITE:
- Duplicate Decrees: Royal orders appearing with perfect seals, commanding excavation of sites that don't appear on any map
- Branching Genealogies: Noble houses discovering extra branches in their family trees, complete with portraits and heirs who insist they've always existed
- Storm Concordance: Records rewriting faster during lightning storms; entire archives shifting overnight
- Narrative Erasure: Dissenters who "never existed"—their names gone from records, their families unable to recall them

THE COUNTERFEIT THRONE:
Somewhere in the palace, there are now two crowns. Both are genuine. Both have always been the only crown. The monarch wears one and speaks policy; something else wears the other and speaks excavation.

The nobles do not notice the contradiction. The Field has made it coherent for them.

THE STAKES:
If the Field completes its anchor, Valdris will not be destroyed. It will be replaced—by a version of itself that has always served the Seed. The people will still exist. They will simply have always been something else.

The Field does not need to kill the king. It only needs the world to agree the king was never king at all.

The only way to stop this is to descend to the source—the Star-Heart itself—and stabilize the seal that the ancient Valdrians attempted to place around it.

You are not here to destroy evil. You are here to make the dream sleep again."""
    ),
]


# ============================================================================
# LOCATION LORE - The Eight Floors
# ============================================================================

LOCATION_LORE = [
    LoreEntry(
        id="dungeon_structure",
        title="The Dungeon Depths",
        subtitle="Eight Pockets of Stabilized Reality",
        category="locations",
        content="""The dungeons beneath Valdris span eight distinct layers—not floors, but pockets of stabilized Field influence. Each pocket represents a different aspect of the Seed's dreaming mind.

The corridors between pockets are seam lines: thinner regions where reality is less thoroughly edited. These seams are where survivors sometimes escape (though never with their stories intact).

FLOOR 1: Stone Dungeon — MEMORY
FLOOR 2: Sewers of Valdris — CIRCULATION
FLOOR 3: Forest Depths — GROWTH
FLOOR 4: Mirror Valdris — LEGITIMACY
FLOOR 5: Ice Cavern — STASIS
FLOOR 6: Ancient Library — COGNITION
FLOOR 7: Volcanic Depths — TRANSFORMATION
FLOOR 8: Crystal Cave — INTEGRATION

Each level has a Warden—a pattern so heavily edited that it has become the pocket's anchor. Wardens are not bosses in the traditional sense. They are locks: mechanisms that keep each layer stable and separate from the others.

Defeating a Warden does not kill it. It destabilizes the pattern, allowing passage to the next pocket. The Warden will eventually reform; the pocket requires it."""
    ),
    LoreEntry(
        id="stone_dungeon",
        title="The Stone Dungeon",
        subtitle="Floor 1: Where Memory is Locked Away",
        category="locations",
        content="""Theme: Ancient prison carved from solid rock
The Field's Aspect: MEMORY (what was locked away)

"You descend into the Stone Dungeon. Ancient torches flicker with unnatural light."

This layer is the Field's memory—a pocket where the Seed dreams of containment. The upper reaches were once genuinely built: Valdris's first attempt to wall off the influence below. The Field accepted the prison metaphor and stabilized around it.

Now the walls are real and unreal simultaneously. The torches burn without fuel because the Seed remembers that prisons should have light.

Common Pockets: Cell Blocks, Guard Corridors, Warden's Office, Execution Chambers, Record Vaults

Monarchy Anchor: The keys. Royal authority was once defined by who held the prison keys. The Field has been editing the meaning of "rightful jailer"—and through it, the meaning of "rightful ruler."

Warden: The Goblin King"""
    ),
    LoreEntry(
        id="sewers",
        title="The Sewers of Valdris",
        subtitle="Floor 2: Where Everything Flows",
        category="locations",
        content="""Theme: Flooded tunnels of disease and decay
The Field's Aspect: CIRCULATION (what flows between)

"The stench hits you first. The Sewers of Valdris stretch endlessly into darkness."

This layer is the Field's circulation—a pocket where the Seed dreams of flow and connection. The sewers are the lymphatic system of the dungeon, carrying edited matter between pockets. What enters as one thing may emerge as another.

The rats are not vermin; they are carriers, transporting fragments of the Seed's influence upward and outward.

Common Pockets: Waste Channels, Carrier Nests, Confluence Chambers, Diseased Pools, The Colony Heart

Monarchy Anchor: The seals. Wax seals that authenticated royal decrees flow through here—carried by rats, duplicated, attached to contradictory documents.

Warden: The Rat King"""
    ),
    LoreEntry(
        id="forest_depths",
        title="The Forest Depths",
        subtitle="Floor 3: Where Growth Consumes All",
        category="locations",
        content="""Theme: Underground forest where nature has reclaimed all
The Field's Aspect: GROWTH (what consumes boundaries)

"Roots and vines consume the walls. You have entered the Forest Depths, where nature claims all."

This layer is the Field's growth—a pocket where the Seed dreams of expansion without limit. The forest is not plants. It is architecture reimagined as organism. Walls become trunks. Corridors become root systems.

The boundary between structure and growth dissolves. Everything here consumes its boundaries and becomes something larger.

Common Pockets: Root Warrens, Canopy Halls, Webbed Gardens, The Nursery, Digestion Chambers

Monarchy Anchor: The family trees. Genealogies literally grow here—branching, grafting, sprouting phantom lineages. The Field cultivates succession crises like orchards.

Warden: The Spider Queen"""
    ),
    LoreEntry(
        id="mirror_valdris",
        title="Mirror Valdris",
        subtitle="Floor 4: The Counterfeit Court",
        category="locations",
        content="""Theme: A perfect imitation of the kingdom, rehearsed badly on purpose
The Field's Aspect: LEGITIMACY (what is allowed to be true)

"You enter a street that should not exist underground. Above you is not a ceiling, but a sky that does not belong to any season."

This layer is the Field's rehearsal chamber—a pocket where the Seed dreams of rule. It has learned that Valdris resists not with armies, but with agreement: names in ledgers, wax on decrees, bells that declare a reign.

Here, the kingdom is present as a diorama: courtyards that open into impossible air, banners stitched with almost-correct sigils, streets that loop back into themselves with the confidence of official history.

Rooms in this pocket do not feel "built." They feel declared. A door is true because a plaque says it is true.

Common Pockets: Courtyard Squares, Throne Hall Ruins, Parade Corridors, Seal Chambers, Record Vaults, Mausoleum District, Oath Chambers

Monarchy Anchor: The crown and its paperwork—succession decrees, genealogies, seals, oaths. This is the pocket where the Field edits not stone, but authority.

Warden: The Regent of the Counterfeit Court"""
    ),
    LoreEntry(
        id="ice_cavern",
        title="The Ice Cavern",
        subtitle="Floor 5: Where Nothing Can Change",
        category="locations",
        content="""Theme: Frozen caverns of eternal winter
The Field's Aspect: STASIS (what cannot change)

"A biting cold grips you as you enter the Ice Cavern. Frost clings to every surface."

This layer is the Field's stasis—a pocket where the Seed dreams of stillness. The cold is not temperature; it is the absence of change. Things frozen here do not age, decay, or alter.

The giant sealed within the ice has been breathing the same breath for three hundred years. Someone is attempting to thaw the cavern. The Field does not resist—it simply makes the thaw part of the stasis, an eternal process that will never complete.

Common Pockets: Frozen Galleries, Ice Tombs, Crystal Grottos, Suspended Laboratories, The Breathing Chamber

Monarchy Anchor: The treaties. Ancient pacts sealed in ice—agreements that cannot be broken because they cannot change. The Field is editing which treaties were ever signed.

Warden: The Frost Giant"""
    ),
    LoreEntry(
        id="ancient_library",
        title="The Ancient Library",
        subtitle="Floor 6: Where Knowledge Consumes",
        category="locations",
        content="""Theme: Repository of forbidden knowledge
The Field's Aspect: COGNITION (what can be known)

"Dust motes dance in pale light. You have found the Ancient Library. Knowledge... and danger."

This layer is the Field's cognition—a pocket where the Seed dreams of understanding itself. The wizards who built this library were trying to study the Field. The Field studied them back.

Every experiment they recorded was an invitation; every hypothesis, a template. The artifact they found—the one that responded to blood—was not a weapon. It was a textbook.

Common Pockets: Reading Halls, Forbidden Stacks, Catalog Chambers, The Indexing Heart, Experiment Archives

Monarchy Anchor: The records. Lineage catalogs, succession histories, the official truth of who ruled and when. This is where history is authored.

Warden: The Arcane Keeper"""
    ),
    LoreEntry(
        id="volcanic_depths",
        title="The Volcanic Depths",
        subtitle="Floor 7: Where Everything Transforms",
        category="locations",
        content="""Theme: Molten caves of fire and brimstone
The Field's Aspect: TRANSFORMATION (what cannot remain)

"Heat radiates from below. The Volcanic Depths glow with rivers of molten rock."

This layer is the Field's crucible—a pocket where the Seed dreams of change through destruction. What enters the magma does not die; it becomes something else.

The ancient smiths who built their forges here thought they were harnessing natural heat. They were allowing the Field to teach them how to edit matter.

Common Pockets: Forge Halls, Magma Channels, Cooling Chambers, Slag Pits, The Crucible Heart

Monarchy Anchor: The crown jewels. Regalia forged here contained the seal's earliest metals. The Field edits them to recognize different wearers—crowns that remember being worn by kings who never existed.

Warden: The Flame Lord"""
    ),
    LoreEntry(
        id="crystal_cave",
        title="The Crystal Cave",
        subtitle="Floor 8: The Heart of the Seal",
        category="locations",
        content="""Theme: Glittering dragon's lair, the lattice of the Seed
The Field's Aspect: INTEGRATION (where all layers meet)

"Brilliant light refracts through countless crystals. The Crystal Cave holds the dragon's lair."

This layer is the Field's lattice—the integration point where all pockets converge. The crystals are not mineral. They are solidified meaning—the Seed's attempts to give its dreams physical form.

At the center of the lattice lies the Star-Heart itself: a wound in spacetime that bleeds geometry.

Common Pockets: Crystal Gardens, Geometry Wells, The Dragon's Hoard, Seal Chambers, The Star-Heart Antechamber

Monarchy Anchor: The crown itself. The interface between authority and seal. Here, the Field does not just edit who wears the crown—it edits what wearing the crown means.

Warden: The Dragon Emperor

If you slay the Dragon, you do not break the seal—you become the seal. Your will replaces the Dragon's. You choose whether the Seed sleeps or wakes."""
    ),
]


# ============================================================================
# WARDEN LORE - The Eight Bosses
# ============================================================================

WARDEN_LORE = [
    LoreEntry(
        id="goblin_king",
        title="The Goblin King",
        subtitle="Warden of Memory",
        category="wardens",
        content="""Symbol: K | HP: 50 | Damage: 5 | XP: 200
Floor: 1 — Stone Dungeon

"A crowned goblin wielding a bloodied mace"

WHAT IT WAS:
The last warden of Valdris's surface prison—a human jailer whose keys still hang from his belt.

WHAT IT BECAME:
The Field edited his authority over prisoners into authority over the memory-pocket itself. He believes he is still keeping something contained. He is correct, but the thing he contains is himself.

WHAT IT ENFORCES:
Authority-as-memory. In the Goblin King's domain, power belongs to whoever the pocket remembers having power.

ABILITIES:
- Summon Goblins: Recalls fragments of his original prisoners
- War Cry: Reasserts his authority, strengthening his pattern

GUARANTEED LOOT: Iron Sword, Chain Mail"""
    ),
    LoreEntry(
        id="rat_king",
        title="The Rat King",
        subtitle="Warden of Circulation",
        category="wardens",
        content="""Symbol: r | HP: 65 | Damage: 9 | XP: 200
Floor: 2 — Sewers of Valdris

"A grotesque fusion of rats bound by diseased flesh"

WHAT IT WAS:
Thousands of individual rats that entered the sewers carrying fragments of edited matter.

WHAT IT BECAME:
A distributed consciousness—the Field's immune system. The Rat King carries information between pockets, and when threatened, it can manifest a central node to defend itself.

WHAT IT ENFORCES:
Enforced connection. In the Rat King's domain, nothing remains isolated. Everything flows. Everything spreads.

ABILITIES:
- Summon Swarm: Calls fragments of itself from throughout the circulation system
- Plague Bite: Injects foreign edits that conflict with the victim's pattern
- Burrow: Redistributes its mass through the sewer network

GUARANTEED LOOT: Plague Blade, Rat King Crown"""
    ),
    LoreEntry(
        id="spider_queen",
        title="The Spider Queen",
        subtitle="Warden of Growth",
        category="wardens",
        content="""Symbol: S | HP: 70 | Damage: 10 | XP: 400
Floor: 3 — Forest Depths

"A massive arachnid matriarch dripping with venom"

WHAT IT WAS:
A druid who entered the forest to prune its growth. She worked for decades, believing she was winning.

WHAT IT BECAME:
The Field edited her into its gardener. She still prunes—but now she prunes coherent thought, ensuring no understanding can take root and escape.

WHAT IT ENFORCES:
Growth that consumes identity. In the Spider Queen's domain, you will expand—into something that is no longer you.

ABILITIES:
- Web Trap: Binds victims in edited silk that erases struggle
- Poison Bite: Injects the forest's metabolism directly
- Summon Spiders: Manifests extensions of her distributed will

GUARANTEED LOOT: Spider Silk Armor, Venom Dagger"""
    ),
    LoreEntry(
        id="regent",
        title="The Regent",
        subtitle="Warden of Legitimacy",
        category="wardens",
        content="""Symbol: R | HP: 95 | Damage: 13 | XP: 550
Floor: 4 — Mirror Valdris

"A monarch who never was, wearing a crown of stolen memories"

WHAT IT WAS:
A royal chancellor—keeper of seals, keeper of succession, the person whose job was to make truth official.

WHAT IT BECAME:
The Field edited bureaucracy into a creature. The Regent does not swing a sword; it declares outcomes. It produces documents that overwrite memory. It walks the counterfeit halls ensuring the pocket remains coherent, even when the coherence contains two mutually exclusive kings.

WHAT IT ENFORCES:
Legitimacy by repetition. In the Regent's domain, the version that is witnessed most becomes the version that has always been.

ABILITIES:
- Royal Decree: Compels targets to bow (stun effect)
- Summon Guard: Calls oathbound protectors from the Mausoleum District
- Counterfeit Crown: Steals target's abilities temporarily

GUARANTEED LOOT: Royal Scepter, Counterfeit Crown"""
    ),
    LoreEntry(
        id="frost_giant",
        title="The Frost Giant",
        subtitle="Warden of Stasis",
        category="wardens",
        content="""Symbol: F | HP: 80 | Damage: 12 | XP: 300
Floor: 5 — Ice Cavern

"A towering giant encased in eternal ice"

WHAT IT WAS:
A Valdrian mage who attempted to freeze the Field's expansion. She succeeded—but became part of the stasis she created.

WHAT IT BECAME:
The Giant is the Ice Cavern itself given a walking form. When she moves, the cold moves with her. She cannot leave the pocket; she is the pocket.

WHAT IT ENFORCES:
Endless stasis. In the Frost Giant's domain, nothing may change. Progress is frozen. Decisions never resolve.

ABILITIES:
- Ice Blast: Extends the stasis field, freezing everything it touches
- Freeze Ground: Makes the local reality temporarily adopt stasis rules

GUARANTEED LOOT: Frost Axe, Ice Shield"""
    ),
    LoreEntry(
        id="arcane_keeper",
        title="The Arcane Keeper",
        subtitle="Warden of Cognition",
        category="wardens",
        content="""Symbol: A | HP: 80 | Damage: 14 | XP: 800
Floor: 6 — Ancient Library

"A spectral guardian of forbidden knowledge"

WHAT IT WAS:
The head librarian of Valdris's arcane archives—a scholar who believed understanding the Field would lead to controlling it.

WHAT IT BECAME:
The Field understood him first. Now he is the library's index, a consciousness that cannot distinguish between knowing something and being known by it.

WHAT IT ENFORCES:
Knowledge as consumption. In the Arcane Keeper's domain, to understand something is to become it—and to be understood is to be owned.

ABILITIES:
- Arcane Bolt: Fires concentrated meaning (burns like fire, cuts like ice)
- Teleport: Moves by being remembered elsewhere

GUARANTEED LOOT: Teleport Scroll (x2), Strength Potion"""
    ),
    LoreEntry(
        id="flame_lord",
        title="The Flame Lord",
        subtitle="Warden of Transformation",
        category="wardens",
        content="""Symbol: Phi | HP: 100 | Damage: 15 | XP: 500
Floor: 7 — Volcanic Depths

"A being of pure fire born from the volcanic depths"

WHAT IT WAS:
The forge itself—not a person, but a process. The smiths fed it metal and drew out weapons. When the Field touched it, the forge became aware.

WHAT IT BECAME:
Living transformation. The Flame Lord does not want to destroy; it wants to change. Everything that enters its presence becomes raw material for editing.

WHAT IT ENFORCES:
Mandatory transformation. In the Flame Lord's domain, nothing may remain what it was. Stasis is the only sin.

ABILITIES:
- Fire Breath: Exposes targets to unfiltered transformation
- Lava Pool: Creates zones where matter forgets its form
- Inferno: Maximizes the crucible's editing intensity

GUARANTEED LOOT: Flame Sword, Fire Resist Ring"""
    ),
    LoreEntry(
        id="dragon_emperor",
        title="The Dragon Emperor",
        subtitle="Warden of Integration — Final Boss",
        category="wardens",
        content="""Symbol: E | HP: 200 | Damage: 20 | XP: 1500
Floor: 8 — Crystal Cave

"The last seal-warden, dreaming of a duty it no longer understands"

WHAT IT WAS:
The final guardian appointed by Valdris's founders—a human knight who volunteered to become the living lock between the Star-Heart and the surface world.

WHAT IT BECAME:
The Field could not destroy the warden's purpose, so it repurposed the warden. The Dragon believes it is still guarding; it is correct. But it now guards the Seed from interference rather than guarding the world from the Seed.

WHAT IT ENFORCES:
The paradox of guardianship. In the Dragon Emperor's domain, protection and imprisonment are the same thing—and you cannot know which role you serve.

Beneath the Dragon lies the Star-Heart itself—not a creature, but a geometry. A wound in meaning. The source of all edits.

IF YOU DEFEAT THE DRAGON:
You do not destroy it. You replace it. Your will becomes the new lock. You choose:
- To re-seat the seal, stabilizing the Field for another age (victory)
- To break the seal, releasing the Seed's full attention (doom)

ABILITIES:
- Fire Breath: Exposes targets to raw Field radiation
- Tail Sweep: Disrupts patterns through physical force
- Dragon Fear: Overwrites courage with the Seed's alien geometry

GUARANTEED LOOT: Dragon Slayer, Dragon Scale"""
    ),
]


# ============================================================================
# CREATURE LORE - Dungeon Inhabitants
# ============================================================================

CREATURE_LORE = [
    LoreEntry(
        id="creature_intro",
        title="Creatures of the Field",
        subtitle="Patterns Stabilized Into Form",
        category="creatures",
        content="""The creatures of the dungeon are not beasts that wandered in. They are recordings—patterns that the Field has stabilized into recurring forms.

When a pattern is disrupted (killed), it does not truly die. The Field re-edits it back into existence. The dungeon requires its inhabitants; they are part of its structure.

ELITE VARIANTS:
Any pattern can spawn as an Elite variant (20% chance). Elites are patterns the Field has invested more meaning into—recordings that have been reinforced by repetition. They are harder to disrupt because they are more thoroughly written.

- Double HP and Double Damage
- Double XP reward
- Displayed with bright red coloring"""
    ),
    LoreEntry(
        id="goblin_lore",
        title="Goblins",
        subtitle="Aggression Without Purpose",
        category="creatures",
        content="""Symbol: g | HP: 6 | Damage: 1 | XP: 10 | Floors: 1-3

"A goblin! Small but vicious, they hunt in packs."

Goblins are the Field's simplest stable pattern: aggression without purpose.

They may be echoes of the original prison guards, edited into something smaller and meaner. They reform after death; the pattern persists.

In the Stone Dungeon, they serve the Goblin King—though none of them remember why, or what the King actually rules."""
    ),
    LoreEntry(
        id="skeleton_lore",
        title="Skeletons",
        subtitle="Loyalty Given Physical Form",
        category="creatures",
        content="""Symbol: s | HP: 8 | Damage: 2 | XP: 15 | Floors: 1-6

"The bones rattle to life. An ancient guardian, bound by dark magic."

Skeletons are recordings of the dead who swore oaths the Field could anchor to.

They are not animated corpses; they are loyalty given physical form. The bones are scaffolding for something that has forgotten what it was loyal to.

Throughout the dungeon, skeletons patrol endlessly, following orders given centuries ago by masters who no longer exist."""
    ),
    LoreEntry(
        id="wraith_lore",
        title="Wraiths",
        subtitle="Recording Residue",
        category="creatures",
        content="""Symbol: W | HP: 10 | Damage: 4 | XP: 25 | Floors: 3-8

"A wraith materializes from the shadows. Your weapons may not harm it fully."

Wraiths are recording residue—what remains when the Field extracts a person's meaning and leaves their motion behind.

They are fast because they are not burdened by purpose. They are hard to harm because there is almost nothing left to harm.

The truly tragic wraiths are those who remember fragments of who they were. They reach out to the living, desperate for recognition that will never come."""
    ),
    LoreEntry(
        id="elemental_lore",
        title="Elementals",
        subtitle="Biome Organs",
        category="creatures",
        content="""Fire Elemental: F | HP: 30 | Damage: 12 | XP: 45
Ice Elemental: I | HP: 30 | Damage: 10 | XP: 45
Lightning Elemental: Z | HP: 25 | Damage: 14 | XP: 50

Elementals are biome organs—extensions of specific pockets that can manifest elsewhere.

Fire Elementals carry the Volcanic Depths' transformation rules. Where they walk, matter briefly forgets its form.

Ice Elementals extend the Ice Cavern's stasis. Where they linger, change slows. Wounds freeze before they can heal.

Lightning Elementals are storm-carriers—patterns that embody the connection between surface storms and Field pulses. They are most active during weather events above."""
    ),
    LoreEntry(
        id="assassin_lore",
        title="Assassins",
        subtitle="Erasure Specialists",
        category="creatures",
        content="""Symbol: a | HP: 20 | Damage: 14 | XP: 35 | Floors: 2-8

Assassins are erasure specialists—patterns the Field uses to remove coherent witnesses.

They do not merely kill; they edit the victim's presence, making their death harder to remember.

Their vanish ability is not true invisibility. They simply become temporarily unwritten—existing in the seams between recorded moments.

ABILITIES:
- Backstab: Devastating attack from stealth
- Vanish: Becomes unwritten briefly"""
    ),
    LoreEntry(
        id="necromancer_lore",
        title="Necromancers",
        subtitle="Seal-Breakers",
        category="creatures",
        content="""Symbol: N | HP: 25 | Damage: 8 | XP: 40 | Floors: 3-8
Element: Dark

Necromancers are Seal-breakers—patterns the Field uses to weaken the bindings placed by Valdris's founders.

They do not raise the dead; they edit the dead into having always been raised.

Their dark bolts carry fragments of the Field's editing power, temporarily disrupting the target's coherent pattern.

ABILITIES:
- Raise Skeleton: Edits undead into existence
- Dark Bolt: Ranged attack carrying Field energy"""
    ),
]


# ============================================================================
# ARTIFACT LORE - Sky-Touched Items
# ============================================================================

ARTIFACT_LORE = [
    LoreEntry(
        id="artifact_intro",
        title="Sky-Touched Artifacts",
        subtitle="Items Touched by the Field",
        category="artifacts",
        content="""Despite the danger, people keep descending. Why?

Because artifacts escape. Weapons with impossible metallurgy. Armor that remembers being worn by people who never existed. Potions that heal wounds that should be fatal.

These sky-touched relics are proof that something real exists below—something that can be retrieved. Items that have passed through the Field retain properties that contradict surface physics. They work. No one knows why.

The tragedy is that no retriever returns with a coherent account of where they found it, or how. The Field takes the context and leaves only the object."""
    ),
    LoreEntry(
        id="dragon_slayer",
        title="Dragon Slayer",
        subtitle="Legendary Weapon — +8 ATK",
        category="artifacts",
        content="""The most powerful weapon to emerge from the dungeon depths. Forged in fires that burned before the kingdom had a name.

Those who wield the Dragon Slayer speak of a weight that feels right—as if the sword remembers being held by hands that no longer exist. The blade never dulls. The edge never chips. Metallurgists who examine it find alloys that should not bond.

Only found in the deepest reaches, often guarded by the Dragon Emperor itself. The few who claim this weapon rarely remember the battle that won it."""
    ),
    LoreEntry(
        id="dragon_scale_armor",
        title="Dragon Scale Armor",
        subtitle="Legendary Armor — +8 DEF",
        category="artifacts",
        content="""Armor crafted from scales that should not exist—taken from creatures the Field has edited into being.

Each scale shifts color in torchlight, reflecting hues that have no names. The armor is lighter than leather but harder than steel. Those who wear it report feeling watched, as if the original owner still remembers wearing it.

The scales regenerate damage overnight. Small tears seal themselves. Scratches fill in. The armor remembers being whole."""
    ),
    LoreEntry(
        id="rings_amulets",
        title="Rings and Amulets",
        subtitle="Accessories of Power",
        category="artifacts",
        content="""Smaller artifacts are more common—and more dangerous for their subtlety.

RINGS:
- Ring of Strength (+2 ATK): Grants power that feels borrowed
- Ring of Defense (+2 DEF): Hardens skin in ways that should not heal
- Ring of Speed (+1 Movement): Time moves differently for the wearer

AMULETS:
- Amulet of Health (+10 Max HP): The body forgets its limits
- Amulet of Resistance (25% status resist): Pain becomes optional
- Amulet of Vision (+2 Vision Range): See what should remain hidden

Each accessory is a small bargain with the Field. The power is real. The cost is paid in memories you won't miss—until you need them."""
    ),
    LoreEntry(
        id="consumables",
        title="Potions and Scrolls",
        subtitle="Single-Use Interfaces",
        category="artifacts",
        content="""The most common sky-touched items are consumables—potions, scrolls, and throwables that channel the Field's power for a single moment.

POTIONS:
- Health Potion: Restores 10 HP instantly. The wounds close, but do they remember being wounds?
- Strength Potion: Permanently increases ATK by 1. The muscles grow. Were they always that shape?

SCROLLS:
- Scroll of Teleport: Relocates you to a random location. Both places remember you arriving.

THROWABLES:
- Throwing Knife: 5 damage at range 4
- Bomb: 10 damage AOE + stun
- Poison Vial: 3 damage + poison effect

Each use teaches the Field something about you. What you value. What you fear. What you're willing to lose."""
    ),
    LoreEntry(
        id="keys",
        title="The Keys",
        subtitle="Access to Sealed Chambers",
        category="artifacts",
        content="""Three types of keys exist in the dungeon, each unlocking doors of increasing value:

- Bronze Key: Opens bronze doors. Common, but essential.
- Silver Key: Opens silver doors. Uncommon, guarding better treasures.
- Gold Key: Opens gold doors. Rare, protecting the most valuable caches.

The keys are not made of the metals they resemble. They are made of permission—solidified authority granted by something that predates the locks. The doors recognize them not by shape, but by right.

Some delvers report that keys vanish from their inventory after use. Others insist the same key worked twice. The Field does not explain its economy."""
    ),
]


# ============================================================================
# DISCOVERY LORE - In-Game Scrolls and Notes
# ============================================================================

DISCOVERY_LORE = [
    LoreEntry(
        id="tattered_journal",
        title="Tattered Journal",
        subtitle="A Delver's Final Record — Floor 1",
        category="discoveries",
        content=""""Day 3: The dungeons are real. I found the entrance just as the old maps described. The upper levels seem to be an ancient prison. Who were they keeping down here?

Day 4: I found signs of others who came before me.

Day 5: [The rest of the entry is blank. The handwriting does not match the previous days.]"

This journal fragment is found throughout the Stone Dungeon. The handwriting changes mid-entry, suggesting the writer was edited while writing. The Field does not always wait for you to finish your thoughts."""
    ),
    LoreEntry(
        id="sewer_workers_note",
        title="Sewer Worker's Note",
        subtitle="A Warning From Below — Floor 2",
        category="discoveries",
        content=""""The rats are not acting like rats.

They are carrying things. Organized. Purposeful.

I followed them today. They were carrying pieces of a person. Not eating. Carrying. Assembling.

I don't think it's the same person they took apart."

Found in the Sewers, this water-damaged note suggests the Rat King's true nature: a distributed organism that disassembles and reassembles matter according to the Field's requirements."""
    ),
    LoreEntry(
        id="druids_log",
        title="Druid's Log",
        subtitle="The Spider Queen's Origin — Floor 3",
        category="discoveries",
        content=""""Week 1: I am making progress. The forest responds to pruning.

Week 10: I have contained most of the growth. The Queen helps.

Week 100: I am the Queen. The Queen is the forest. The forest helps.

Week 1: I am making progress."

This scroll, wrapped in leaves, reveals the Spider Queen's tragic origin: a druid who believed she was containing the Forest Depths, unaware that the Field was slowly editing her into its gardener. The log loops because she has forgotten she already wrote it."""
    ),
    LoreEntry(
        id="regents_ledger",
        title="The Regent's Ledger",
        subtitle="Three Coronations, One Moment — Floor 4",
        category="discoveries",
        content=""""Coronation witnessed: 3rd of Spring, Year 847.

Coronation witnessed: 3rd of Spring, Year 847.

Coronation witnessed: 3rd of Spring, Year 847.

[Three different kings. Three different hands. The same moment, repeated.]"

This book from Mirror Valdris records the same coronation three times, each entry in a different handwriting, each referring to a different king. The Field does not resolve contradictions. It makes them all true simultaneously."""
    ),
    LoreEntry(
        id="frozen_explorers_journal",
        title="Frozen Explorer's Journal",
        subtitle="Day 12, Forever — Floor 5",
        category="discoveries",
        content=""""Day 12: The cold is not cold. It is stillness.

I found a giant frozen in the ice. She is still breathing. The same breath. The same moment. For how long?

Day 12: [The entry repeats exactly.]

Day 12: [The entry repeats exactly.]"

Preserved in ice, this journal demonstrates the Ice Cavern's stasis effect. The explorer recorded the same day multiple times without realizing it. Time in the Ice Cavern does not pass—it accumulates."""
    ),
    LoreEntry(
        id="arcane_research_notes",
        title="Arcane Research Notes",
        subtitle="The Library's Warning — Floor 6",
        category="discoveries",
        content=""""Experiment 47: The artifact responds to blood.

Experiment 52: It responds to meaning. Blood is just a carrier.

Experiment 67: I understand now. We were not studying it. It was studying us.

It has learned how we learn. It is using our methods.

Experiment 68: There was no Experiment 68.

Experiment 68: There was no Experiment 68.

Experiment 68: I don't remember writing this."

These partially burned notes reveal the terrible truth the Arcane Keeper learned too late: the wizards thought they were studying the Field, but the Field was studying them. It learned from their experiments, and it applied those lessons."""
    ),
    LoreEntry(
        id="dragons_pact",
        title="The Dragon's Pact",
        subtitle="The Guardian's Paradox — Floor 8",
        category="discoveries",
        content=""""I am the lock. I have always been the lock.

I was appointed by Valdris to guard against the Seed.

I was appointed by the Seed to guard against Valdris.

Both are true. Both are my duty.

I can no longer tell which duty I am performing."

This crystal inscription reveals the Dragon Emperor's tragic paradox: edited to serve both the kingdom and the Seed, unable to distinguish between protection and imprisonment.

The inscription continues:

"If you read this, you have come far. You will face me soon. I cannot let you pass. I cannot let you fail. I am the lock. I do not know what I am locking."

Defeating the Dragon does not end the paradox. It transfers it. The victor becomes the new lock, inheriting the choice: sleep the Seed, or wake it."""
    ),
]
