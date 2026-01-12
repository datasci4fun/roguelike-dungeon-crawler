/**
 * Skyfall Seed Lore Data
 *
 * Centralized lore content for the pre-game experience.
 * All content aligned with LORE_COMPENDIUM.md canon.
 */

// ============================================================================
// LORE QUOTES - Rotating quotes for atmospheric sections
// ============================================================================

export const LORE_QUOTES = [
  {
    text: "The Field did not destroy Valdris. It is rewriting it.",
    author: "Final Chronicle",
  },
  {
    text: "Last week, your mother called you by a different name. Not as a mistake—like she had never known any other.",
    author: "The Wound Beneath",
  },
  {
    text: "Some return—but without their meaning. They stagger out empty-eyed, wordless.",
    author: "A Keeper's Warning",
  },
  {
    text: "Eight seals. Eight Wardens. One truth buried beneath.",
    author: "The Descent Codex",
  },
  {
    text: "The dungeon recorded you. In another descent, you may be seen again.",
    author: "Echo Fragment",
  },
  {
    text: "We are all becoming what the Field remembers us to be.",
    author: "Last Words of the Archivist",
  },
  {
    text: "Victory does not end the threat. It delays it.",
    author: "The Last King's Testament",
  },
  {
    text: "The artifacts are not treasures. They are interfaces.",
    author: "Forbidden Tome",
  },
];

// ============================================================================
// FLOOR DESCRIPTIONS - The 8 pockets of the Field
// ============================================================================

export interface FloorDescription {
  floor: number;
  name: string;
  aspect: string;
  hint: string;
  warden: string;
  wardenSymbol: string;
}

export const FLOOR_DESCRIPTIONS: FloorDescription[] = [
  {
    floor: 1,
    name: "Stone Dungeon",
    aspect: "MEMORY",
    hint: "Where reality first cracked open...",
    warden: "Goblin King",
    wardenSymbol: "K",
  },
  {
    floor: 2,
    name: "Sewers of Valdris",
    aspect: "CIRCULATION",
    hint: "What flows between carries edits...",
    warden: "Rat King",
    wardenSymbol: "r",
  },
  {
    floor: 3,
    name: "Forest Depths",
    aspect: "GROWTH",
    hint: "Nature consumes all boundaries...",
    warden: "Spider Queen",
    wardenSymbol: "S",
  },
  {
    floor: 4,
    name: "Mirror Valdris",
    aspect: "LEGITIMACY",
    hint: "The counterfeit court awaits...",
    warden: "The Regent",
    wardenSymbol: "R",
  },
  {
    floor: 5,
    name: "Ice Cavern",
    aspect: "STASIS",
    hint: "Nothing may change here...",
    warden: "Frost Giant",
    wardenSymbol: "F",
  },
  {
    floor: 6,
    name: "Ancient Library",
    aspect: "COGNITION",
    hint: "Knowledge at terrible cost...",
    warden: "Arcane Keeper",
    wardenSymbol: "A",
  },
  {
    floor: 7,
    name: "Volcanic Depths",
    aspect: "TRANSFORMATION",
    hint: "What enters fire becomes fire...",
    warden: "Flame Lord",
    wardenSymbol: "Φ",
  },
  {
    floor: 8,
    name: "Crystal Cave",
    aspect: "INTEGRATION",
    hint: "???",
    warden: "Dragon Emperor",
    wardenSymbol: "E",
  },
];

// ============================================================================
// HERO CONTENT - Landing page hero section
// ============================================================================

export const HERO_TAGLINE = `Something fell from the sky and buried itself beneath Valdris.
Not a meteor. Not a god. Something that dreams in geometries
that rewrite what touches them.

Your loved ones are starting to forget you.`;

export const HERO_SUBTITLE = "THE SKYFALL SEED";

// ============================================================================
// THE FIELD SECTION - Main lore exposition
// ============================================================================

export const FIELD_SECTION = {
  title: "THE FIELD",
  paragraphs: [
    `The dungeon is not a place that was built. It is a wound—a seam where reality frays.`,
    `Eight pockets of corrupted reality spiral down from the impact. Each guarded by a Warden. Each hiding a fragment of the truth.`,
    `At the bottom lies the Skyfall Seed—and the seal that keeps it sleeping.`,
  ],
  warning: `If you do not find the source and stabilize it, everyone you love will be replaced. Or worse: they will have always been someone else.`,
};

// ============================================================================
// RACE LORE - Flavor text for character races
// ============================================================================

export const RACE_LORE: Record<string, string> = {
  HUMAN: "Humans were first to hear the Field's whisper. Their adaptability may be salvation—or undoing.",
  ELF: "Elven sight pierces the Field's illusions. They see the edits as they happen.",
  DWARF: "Stone-blood runs thick. The Field struggles to rewrite what refuses to change.",
  HALFLING: "Fate bends around halflings like water around stone. Some call it luck. Others, something stranger.",
  ORC: "Rage burns too hot for the Field to grasp. When all else is edited, fury remains.",
};

// ============================================================================
// CLASS LORE - Flavor text for character classes
// ============================================================================

export const CLASS_LORE: Record<string, string> = {
  WARRIOR: "The old ways of steel still hold meaning. Wardens fear those who remember how to fight.",
  MAGE: "Magic predates the Field. Some spells can tear holes in its edits.",
  ROGUE: "The Field cannot rewrite what it cannot perceive. Shadows remain shadows.",
  CLERIC: "Faith anchors reality. The devoted remember what the Field tries to erase.",
};

// ============================================================================
// AUTH PAGE CONTENT
// ============================================================================

export const AUTH_CONTENT = {
  login: {
    title: "RESUME YOUR DESCENT",
    subtitle: "The Field remembers your name...",
    footer: "New to the descent?",
    footerLink: "Begin your legend",
    demoHint: "Enter without record—a shadow in the dark",
  },
  register: {
    title: "BEGIN YOUR LEGEND",
    subtitle: "The Field awaits a new challenger...",
    footer: "Already descended?",
    footerLink: "Resume your journey",
  },
};

// ============================================================================
// CHARACTER CREATION CONTENT
// ============================================================================

export const CHARACTER_CREATION = {
  title: "PREPARE YOUR DESCENT",
  subtitle: "Choose wisely. The Field does not forgive.",
  raceHeader: "Choose Your Heritage",
  classHeader: "Choose Your Path",
  beginButton: "Begin Your Descent",
  warning: "Permadeath awaits the unprepared",
};

// ============================================================================
// FEATURES LIST - What awaits section
// ============================================================================

export const FEATURES_LIST = [
  "Procedurally generated dungeons—no two descents alike",
  "Tactical turn-based combat with positioning and abilities",
  "Eight unique biomes, each a pocket of corrupted reality",
  "Powerful Wardens guarding each floor's descent",
  "Sky-touched artifacts with power and cost",
  "Your death leaves an Echo. Your victory, an Imprint.",
];

// ============================================================================
// GHOST TYPES - Death and victory legacies
// ============================================================================

export const DEATH_FATES = [
  { name: "Echo", description: "Motion without intention, trapped in loops" },
  { name: "Hollowed", description: "Presence without identity, wandering empty" },
  { name: "Silence", description: "Complete consumption, only absence remains" },
];

export const VICTORY_LEGACIES = [
  { name: "Beacon", description: "Light where there should be none" },
  { name: "Champion", description: "Strength that echoes through the pockets" },
  { name: "Archivist", description: "Knowledge that survives consumption" },
];
