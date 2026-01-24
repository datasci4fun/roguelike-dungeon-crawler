/**
 * Model Library - Registry of all 3D models
 *
 * This module provides a centralized registry for all procedural 3D models
 * that can be used in the game and level editor.
 */

import * as THREE from 'three';

// Import model factories and metadata
// @model-generator:imports:start
import { createAnimatedTome, ANIMATED_TOME_META } from './animatedTome';
import { createArcaneKeeper, ARCANE_KEEPER_META } from './arcaneKeeper';
import { createAssassin, ASSASSIN_META } from './assassin';
import { createBileLurker, BILE_LURKER_META } from './bileLurker';
import { createBossThrone, BOSS_THRONE_META } from './bossThrone';
import { createCourtScribe, COURT_SCRIBE_META } from './courtScribe';
import { createCrystalSentinel, CRYSTAL_SENTINEL_META } from './crystalSentinel';
import { createDemon, DEMON_META } from './demon';
import { createDoppelganger, DOPPELGANGER_META } from './doppelganger';
import { createDragon, DRAGON_META } from './dragon';
import { createDragonEmperor, DRAGON_EMPEROR_META } from './dragonEmperor';
import { createEmberSprite, EMBER_SPRITE_META } from './emberSprite';
import { createEntranceDoors, ENTRANCE_DOORS_META } from './entranceDoors';
import { createFireElemental, FIRE_ELEMENTAL_META } from './fireElemental';
import { createFlameLord, FLAME_LORD_META } from './flameLord';
import { createFrostGiant, FROST_GIANT_META } from './frostGiant';
import { createFrostWisp, FROST_WISP_META } from './frostWisp';
import { createGoblin, GOBLIN_META } from './goblin';
import { createGoblinKing, GOBLIN_KING_META } from './goblinKing';
import { createGoblinKingV2, GOBLIN_KING_V2_META } from './goblinKingV2';
import { createGoblinV2, GOBLIN_V2_META } from './goblinV2';
import { createGoblinV3, GOBLIN_V3_META } from './goblinV3';
import { createGoblinV4, GOBLIN_V4_META } from './goblinV4';
import { createIceElemental, ICE_ELEMENTAL_META } from './iceElemental';
import { createInkPhantom, INK_PHANTOM_META } from './inkPhantom';
import { createLightningElemental, LIGHTNING_ELEMENTAL_META } from './lightningElemental';
import { createNecromancer, NECROMANCER_META } from './necromancer';
import { createOathboundGuard, OATHBOUND_GUARD_META } from './oathboundGuard';
import { createOrc, ORC_META } from './orc';
import { createOrcV2, ORC_V2_META } from './orcV2';
import { createPillar, PILLAR_META } from './pillar';
import { createPlagueRat, PLAGUE_RAT_META } from './plagueRat';
import { createDwarfCleric, DWARF_CLERIC_META } from './playerDwarfCleric';
import { createPrismWatcher, PRISM_WATCHER_META } from './prismWatcher';
import { createRat, RAT_META } from './rat';
import { createRatKing, RAT_KING_META } from './ratKing';
import { createRatKingV2, RAT_KING_V2_META } from './ratKingV2';
import { createRatV2, RAT_V2_META } from './ratV2';
import { createShade, SHADE_META } from './shade';
import { createSkeleton, SKELETON_META } from './skeleton';
import { createSkeletonV2, SKELETON_V2_META } from './skeletonV2';
import { createSpiderQueen, SPIDER_QUEEN_META } from './spiderQueen';
import { createSpiderQueenV2, SPIDER_QUEEN_V2_META } from './spiderQueenV2';
import { createSpiderling, SPIDERLING_META } from './spiderling';
import { createStatue, STATUE_META } from './statue';
import { createTheRegent, THE_REGENT_META } from './theRegent';
import { createThornling, THORNLING_META } from './thornling';
import { createTreasureChest, TREASURE_CHEST_META } from './treasureChest';
import { createTroll, TROLL_META } from './troll';
import { createWardensChair, WARDENS_CHAIR_META } from './wardensChair';
import { createWebweaver, WEBWEAVER_META } from './webweaver';
import { createWraith, WRAITH_META } from './wraith';
// @model-generator:imports:end

// Player character model (manual import - only import what's used locally)
import {
  createPlayerCharacter,
  PLAYER_CHARACTER_META,
  type PlayerModelOptions,
} from './playerCharacter';

// Re-export materials
export * from './materials';

// Re-export individual models
// @model-generator:exports:start
export { createAnimatedTome, ANIMATED_TOME_META } from './animatedTome';
export { createArcaneKeeper, ARCANE_KEEPER_META } from './arcaneKeeper';
export { createAssassin, ASSASSIN_META } from './assassin';
export { createBileLurker, BILE_LURKER_META } from './bileLurker';
export { createBossThrone, BOSS_THRONE_META } from './bossThrone';
export { createCourtScribe, COURT_SCRIBE_META } from './courtScribe';
export { createCrystalSentinel, CRYSTAL_SENTINEL_META } from './crystalSentinel';
export { createDemon, DEMON_META } from './demon';
export { createDoppelganger, DOPPELGANGER_META } from './doppelganger';
export { createDragon, DRAGON_META } from './dragon';
export { createDragonEmperor, DRAGON_EMPEROR_META } from './dragonEmperor';
export { createEmberSprite, EMBER_SPRITE_META } from './emberSprite';
export { createEntranceDoors, ENTRANCE_DOORS_META } from './entranceDoors';
export { createFireElemental, FIRE_ELEMENTAL_META } from './fireElemental';
export { createFlameLord, FLAME_LORD_META } from './flameLord';
export { createFrostGiant, FROST_GIANT_META } from './frostGiant';
export { createFrostWisp, FROST_WISP_META } from './frostWisp';
export { createGoblin, GOBLIN_META } from './goblin';
export { createGoblinKing, GOBLIN_KING_META } from './goblinKing';
export { createGoblinKingV2, GOBLIN_KING_V2_META } from './goblinKingV2';
export { createGoblinV2, GOBLIN_V2_META } from './goblinV2';
export { createGoblinV3, GOBLIN_V3_META } from './goblinV3';
export { createGoblinV4, GOBLIN_V4_META } from './goblinV4';
export { createIceElemental, ICE_ELEMENTAL_META } from './iceElemental';
export { createInkPhantom, INK_PHANTOM_META } from './inkPhantom';
export { createLightningElemental, LIGHTNING_ELEMENTAL_META } from './lightningElemental';
export { createNecromancer, NECROMANCER_META } from './necromancer';
export { createOathboundGuard, OATHBOUND_GUARD_META } from './oathboundGuard';
export { createOrc, ORC_META } from './orc';
export { createOrcV2, ORC_V2_META } from './orcV2';
export { createPillar, PILLAR_META, COLLAPSED_PILLAR_META } from './pillar';
export { createPlagueRat, PLAGUE_RAT_META } from './plagueRat';
export { createDwarfCleric, DWARF_CLERIC_META } from './playerDwarfCleric';
export { createPrismWatcher, PRISM_WATCHER_META } from './prismWatcher';
export { createRat, RAT_META } from './rat';
export { createRatKing, RAT_KING_META } from './ratKing';
export { createRatKingV2, RAT_KING_V2_META } from './ratKingV2';
export { createRatV2, RAT_V2_META } from './ratV2';
export { createShade, SHADE_META } from './shade';
export { createSkeleton, SKELETON_META } from './skeleton';
export { createSkeletonV2, SKELETON_V2_META } from './skeletonV2';
export { createSpiderQueen, SPIDER_QUEEN_META } from './spiderQueen';
export { createSpiderQueenV2, SPIDER_QUEEN_V2_META } from './spiderQueenV2';
export { createSpiderling, SPIDERLING_META } from './spiderling';
export { createStatue, STATUE_META } from './statue';
export { createTheRegent, THE_REGENT_META } from './theRegent';
export { createThornling, THORNLING_META } from './thornling';
export { createTreasureChest, TREASURE_CHEST_META } from './treasureChest';
export { createTroll, TROLL_META } from './troll';
export { createWardensChair, WARDENS_CHAIR_META } from './wardensChair';
export { createWebweaver, WEBWEAVER_META } from './webweaver';
export { createWraith, WRAITH_META } from './wraith';
// @model-generator:exports:end

// Player character exports (manual - not auto-generated)
// Re-export directly to avoid unused import warnings
export {
  createPlayerCharacter,
  PLAYER_CHARACTER_META,
  RACE_CONFIG,
  CLASS_CONFIG,
  PLAYER_RACES,
  PLAYER_CLASSES,
  getRaceDisplayName,
  getClassDisplayName,
  getRaceHeight,
  getClassGlowColor,
  type RaceConfig,
  type ClassConfig,
  type PlayerModelOptions,
} from './playerCharacter';

/**
 * Model category types
 */
export type ModelCategory = 'structure' | 'furniture' | 'decoration' | 'interactive' | 'prop' | 'enemy' | 'player';

/**
 * Model definition interface
 */
export interface ModelDefinition {
  id: string;
  name: string;
  category: ModelCategory;
  description: string;
  defaultScale: number;
  boundingBox: { x: number; y: number; z: number };
  tags: string[];
  create: (options?: Record<string, unknown>) => THREE.Group;
  /** For enemy models: the exact enemy name from battle state (e.g., "Goblin", "Goblin King") */
  enemyName?: string;
  /** Version number (1, 2, 3, etc.) - defaults to 1 if not specified */
  version?: number;
  /** Whether this version is active/used in-game - defaults to true if not specified */
  isActive?: boolean;
  /** Base model ID for grouping versions (e.g., "goblin" groups goblin-v1, goblin-v2) */
  baseModelId?: string;
}

/**
 * The complete model library
 */
export const MODEL_LIBRARY: ModelDefinition[] = [
  // @model-generator:library:start
  {
    ...ANIMATED_TOME_META,
    create: createAnimatedTome,
  },
  {
    ...ARCANE_KEEPER_META,
    create: createArcaneKeeper,
  },
  {
    ...ASSASSIN_META,
    create: createAssassin,
  },
  {
    ...BILE_LURKER_META,
    create: createBileLurker,
  },
  {
    ...BOSS_THRONE_META,
    create: createBossThrone,
  },
  {
    ...COURT_SCRIBE_META,
    create: createCourtScribe,
  },
  {
    ...CRYSTAL_SENTINEL_META,
    create: createCrystalSentinel,
  },
  {
    ...DEMON_META,
    create: createDemon,
  },
  {
    ...DOPPELGANGER_META,
    create: createDoppelganger,
  },
  {
    ...DRAGON_EMPEROR_META,
    create: createDragonEmperor,
  },
  {
    ...DRAGON_META,
    create: createDragon,
  },
  {
    ...DWARF_CLERIC_META,
    create: createDwarfCleric,
  },
  {
    ...EMBER_SPRITE_META,
    create: createEmberSprite,
  },
  {
    ...ENTRANCE_DOORS_META,
    create: createEntranceDoors,
  },
  {
    ...FIRE_ELEMENTAL_META,
    create: createFireElemental,
  },
  {
    ...FLAME_LORD_META,
    create: createFlameLord,
  },
  {
    ...FROST_GIANT_META,
    create: createFrostGiant,
  },
  {
    ...FROST_WISP_META,
    create: createFrostWisp,
  },
  {
    ...GOBLIN_KING_META,
    create: createGoblinKing,
    isActive: false,
  },
  {
    ...GOBLIN_KING_V2_META,
    create: createGoblinKingV2,
    version: 2,
    isActive: true,
    baseModelId: 'goblin-king',
  },
  {
    ...GOBLIN_META,
    create: createGoblin,
    isActive: false,
    baseModelId: 'goblin',
  },
  {
    ...GOBLIN_V2_META,
    create: createGoblinV2,
    version: 2,
    isActive: false,
    baseModelId: 'goblin',
  },
  {
    ...GOBLIN_V3_META,
    create: createGoblinV3,
    version: 3,
    isActive: false,
    baseModelId: 'goblin',
  },
  {
    ...GOBLIN_V4_META,
    create: createGoblinV4,
    version: 4,
    isActive: true,
    baseModelId: 'goblin',
  },
  {
    ...ICE_ELEMENTAL_META,
    create: createIceElemental,
  },
  {
    ...INK_PHANTOM_META,
    create: createInkPhantom,
  },
  {
    ...LIGHTNING_ELEMENTAL_META,
    create: createLightningElemental,
  },
  {
    ...NECROMANCER_META,
    create: createNecromancer,
  },
  {
    ...OATHBOUND_GUARD_META,
    create: createOathboundGuard,
  },
  {
    ...ORC_META,
    create: createOrc,
    isActive: false,
  },
  {
    ...ORC_V2_META,
    create: createOrcV2,
    version: 2,
    isActive: true,
    baseModelId: 'orc',
  },
  {
    ...PILLAR_META,
    create: createPillar,
  },
  {
    ...PLAGUE_RAT_META,
    create: createPlagueRat,
  },
  {
    ...PRISM_WATCHER_META,
    create: createPrismWatcher,
  },
  {
    ...RAT_KING_META,
    create: createRatKing,
    isActive: false,
  },
  {
    ...RAT_KING_V2_META,
    create: createRatKingV2,
    version: 2,
    isActive: true,
    baseModelId: 'rat-king',
  },
  {
    ...RAT_META,
    create: createRat,
    isActive: false,
  },
  {
    ...RAT_V2_META,
    create: createRatV2,
    version: 2,
    isActive: true,
    baseModelId: 'rat',
  },
  {
    ...SHADE_META,
    create: createShade,
  },
  {
    ...SKELETON_META,
    create: createSkeleton,
    isActive: false,
    baseModelId: 'skeleton',
  },
  {
    ...SKELETON_V2_META,
    create: createSkeletonV2,
    version: 2,
    isActive: true,
    baseModelId: 'skeleton',
  },
  {
    ...SPIDERLING_META,
    create: createSpiderling,
  },
  {
    ...SPIDER_QUEEN_META,
    create: createSpiderQueen,
    isActive: false,
  },
  {
    ...SPIDER_QUEEN_V2_META,
    create: createSpiderQueenV2,
    version: 2,
    isActive: true,
    baseModelId: 'spider-queen',
  },
  {
    ...STATUE_META,
    create: createStatue,
  },
  {
    ...THE_REGENT_META,
    create: createTheRegent,
  },
  {
    ...THORNLING_META,
    create: createThornling,
  },
  {
    ...TREASURE_CHEST_META,
    create: createTreasureChest,
  },
  {
    ...TROLL_META,
    create: createTroll,
  },
  {
    ...WARDENS_CHAIR_META,
    create: createWardensChair,
  },
  {
    ...WEBWEAVER_META,
    create: createWebweaver,
  },
  {
    ...WRAITH_META,
    create: createWraith,
  },
// @model-generator:library:end

  // Player character base (manual entry - not auto-generated)
  {
    ...PLAYER_CHARACTER_META,
    create: createPlayerCharacter,
  },

  // ============================================================================
  // All 20 Player Race/Class Combinations for Asset Viewer
  // ============================================================================

  // Human combinations
  {
    id: 'player-human-warrior',
    name: 'Human Warrior',
    category: 'player' as const,
    description: 'Versatile human warrior with sword and shield',
    defaultScale: 1.0,
    boundingBox: { x: 1.4, y: 2.0, z: 0.8 },
    tags: ['player', 'human', 'warrior', 'melee'],
    create: () => createPlayerCharacter({ race: 'HUMAN', classId: 'WARRIOR' }),
  },
  {
    id: 'player-human-mage',
    name: 'Human Mage',
    category: 'player' as const,
    description: 'Adaptable human mage wielding arcane magic',
    defaultScale: 1.0,
    boundingBox: { x: 1.4, y: 2.0, z: 0.8 },
    tags: ['player', 'human', 'mage', 'magic'],
    create: () => createPlayerCharacter({ race: 'HUMAN', classId: 'MAGE' }),
  },
  {
    id: 'player-human-rogue',
    name: 'Human Rogue',
    category: 'player' as const,
    description: 'Cunning human rogue with quick daggers',
    defaultScale: 1.0,
    boundingBox: { x: 1.4, y: 2.0, z: 0.8 },
    tags: ['player', 'human', 'rogue', 'stealth'],
    create: () => createPlayerCharacter({ race: 'HUMAN', classId: 'ROGUE' }),
  },
  {
    id: 'player-human-cleric',
    name: 'Human Cleric',
    category: 'player' as const,
    description: 'Devout human cleric with divine healing',
    defaultScale: 1.0,
    boundingBox: { x: 1.4, y: 2.0, z: 0.8 },
    tags: ['player', 'human', 'cleric', 'healer'],
    create: () => createPlayerCharacter({ race: 'HUMAN', classId: 'CLERIC' }),
  },

  // Elf combinations
  {
    id: 'player-elf-warrior',
    name: 'Elf Warrior',
    category: 'player' as const,
    description: 'Graceful elven warrior with elegant blade',
    defaultScale: 1.0,
    boundingBox: { x: 1.2, y: 2.2, z: 0.7 },
    tags: ['player', 'elf', 'warrior', 'melee'],
    create: () => createPlayerCharacter({ race: 'ELF', classId: 'WARRIOR' }),
  },
  {
    id: 'player-elf-mage',
    name: 'Elf Mage',
    category: 'player' as const,
    description: 'Ancient elven mage with powerful arcane mastery',
    defaultScale: 1.0,
    boundingBox: { x: 1.2, y: 2.2, z: 0.7 },
    tags: ['player', 'elf', 'mage', 'magic'],
    create: () => createPlayerCharacter({ race: 'ELF', classId: 'MAGE' }),
  },
  {
    id: 'player-elf-rogue',
    name: 'Elf Rogue',
    category: 'player' as const,
    description: 'Silent elven rogue moving like shadow',
    defaultScale: 1.0,
    boundingBox: { x: 1.2, y: 2.2, z: 0.7 },
    tags: ['player', 'elf', 'rogue', 'stealth'],
    create: () => createPlayerCharacter({ race: 'ELF', classId: 'ROGUE' }),
  },
  {
    id: 'player-elf-cleric',
    name: 'Elf Cleric',
    category: 'player' as const,
    description: 'Wise elven cleric channeling nature and light',
    defaultScale: 1.0,
    boundingBox: { x: 1.2, y: 2.2, z: 0.7 },
    tags: ['player', 'elf', 'cleric', 'healer'],
    create: () => createPlayerCharacter({ race: 'ELF', classId: 'CLERIC' }),
  },

  // Dwarf combinations
  {
    id: 'player-dwarf-warrior',
    name: 'Dwarf Warrior',
    category: 'player' as const,
    description: 'Stalwart dwarven warrior with axe and shield',
    defaultScale: 1.0,
    boundingBox: { x: 1.6, y: 1.5, z: 0.9 },
    tags: ['player', 'dwarf', 'warrior', 'melee'],
    create: () => createPlayerCharacter({ race: 'DWARF', classId: 'WARRIOR' }),
  },
  {
    id: 'player-dwarf-mage',
    name: 'Dwarf Mage',
    category: 'player' as const,
    description: 'Runesmith dwarf mage with earth magic',
    defaultScale: 1.0,
    boundingBox: { x: 1.6, y: 1.5, z: 0.9 },
    tags: ['player', 'dwarf', 'mage', 'magic'],
    create: () => createPlayerCharacter({ race: 'DWARF', classId: 'MAGE' }),
  },
  {
    id: 'player-dwarf-rogue',
    name: 'Dwarf Rogue',
    category: 'player' as const,
    description: 'Stealthy dwarven rogue from the deep tunnels',
    defaultScale: 1.0,
    boundingBox: { x: 1.6, y: 1.5, z: 0.9 },
    tags: ['player', 'dwarf', 'rogue', 'stealth'],
    create: () => createPlayerCharacter({ race: 'DWARF', classId: 'ROGUE' }),
  },
  {
    id: 'player-dwarf-cleric',
    name: 'Dwarf Cleric',
    category: 'player' as const,
    description: 'Sturdy dwarven cleric with ancestral blessings',
    defaultScale: 1.0,
    boundingBox: { x: 1.6, y: 1.5, z: 0.9 },
    tags: ['player', 'dwarf', 'cleric', 'healer'],
    create: () => createPlayerCharacter({ race: 'DWARF', classId: 'CLERIC' }),
  },

  // Halfling combinations
  {
    id: 'player-halfling-warrior',
    name: 'Halfling Warrior',
    category: 'player' as const,
    description: 'Brave halfling warrior with surprising strength',
    defaultScale: 1.0,
    boundingBox: { x: 1.0, y: 1.2, z: 0.6 },
    tags: ['player', 'halfling', 'warrior', 'melee'],
    create: () => createPlayerCharacter({ race: 'HALFLING', classId: 'WARRIOR' }),
  },
  {
    id: 'player-halfling-mage',
    name: 'Halfling Mage',
    category: 'player' as const,
    description: 'Clever halfling mage with tricky spells',
    defaultScale: 1.0,
    boundingBox: { x: 1.0, y: 1.2, z: 0.6 },
    tags: ['player', 'halfling', 'mage', 'magic'],
    create: () => createPlayerCharacter({ race: 'HALFLING', classId: 'MAGE' }),
  },
  {
    id: 'player-halfling-rogue',
    name: 'Halfling Rogue',
    category: 'player' as const,
    description: 'Nimble halfling rogue with twin daggers',
    defaultScale: 1.0,
    boundingBox: { x: 1.0, y: 1.2, z: 0.6 },
    tags: ['player', 'halfling', 'rogue', 'stealth'],
    create: () => createPlayerCharacter({ race: 'HALFLING', classId: 'ROGUE' }),
  },
  {
    id: 'player-halfling-cleric',
    name: 'Halfling Cleric',
    category: 'player' as const,
    description: 'Kind halfling cleric spreading warmth and healing',
    defaultScale: 1.0,
    boundingBox: { x: 1.0, y: 1.2, z: 0.6 },
    tags: ['player', 'halfling', 'cleric', 'healer'],
    create: () => createPlayerCharacter({ race: 'HALFLING', classId: 'CLERIC' }),
  },

  // Orc combinations
  {
    id: 'player-orc-warrior',
    name: 'Orc Warrior',
    category: 'player' as const,
    description: 'Powerful orc warrior with berserker rage',
    defaultScale: 1.0,
    boundingBox: { x: 1.8, y: 2.3, z: 1.0 },
    tags: ['player', 'orc', 'warrior', 'berserker'],
    create: () => createPlayerCharacter({ race: 'ORC', classId: 'WARRIOR' }),
  },
  {
    id: 'player-orc-mage',
    name: 'Orc Mage',
    category: 'player' as const,
    description: 'Shamanistic orc mage with primal magic',
    defaultScale: 1.0,
    boundingBox: { x: 1.8, y: 2.3, z: 1.0 },
    tags: ['player', 'orc', 'mage', 'magic'],
    create: () => createPlayerCharacter({ race: 'ORC', classId: 'MAGE' }),
  },
  {
    id: 'player-orc-rogue',
    name: 'Orc Rogue',
    category: 'player' as const,
    description: 'Cunning orc rogue striking from the shadows',
    defaultScale: 1.0,
    boundingBox: { x: 1.8, y: 2.3, z: 1.0 },
    tags: ['player', 'orc', 'rogue', 'stealth'],
    create: () => createPlayerCharacter({ race: 'ORC', classId: 'ROGUE' }),
  },
  {
    id: 'player-orc-cleric',
    name: 'Orc Cleric',
    category: 'player' as const,
    description: 'Spiritual orc cleric with ancestral power',
    defaultScale: 1.0,
    boundingBox: { x: 1.8, y: 2.3, z: 1.0 },
    tags: ['player', 'orc', 'cleric', 'healer'],
    create: () => createPlayerCharacter({ race: 'ORC', classId: 'CLERIC' }),
  },
];

/**
 * Get a model definition by ID
 */
export function getModelById(id: string): ModelDefinition | undefined {
  return MODEL_LIBRARY.find((m) => m.id === id);
}

/**
 * Get all models in a category
 */
export function getModelsByCategory(category: ModelCategory): ModelDefinition[] {
  return MODEL_LIBRARY.filter((m) => m.category === category);
}

/**
 * Search models by name, description, or tags
 */
export function searchModels(query: string): ModelDefinition[] {
  const lowerQuery = query.toLowerCase();
  return MODEL_LIBRARY.filter((m) =>
    m.name.toLowerCase().includes(lowerQuery) ||
    m.description.toLowerCase().includes(lowerQuery) ||
    m.tags.some((tag) => tag.toLowerCase().includes(lowerQuery))
  );
}

/**
 * Get all unique categories
 */
export function getCategories(): ModelCategory[] {
  return [...new Set(MODEL_LIBRARY.map((m) => m.category))];
}

/**
 * Get all unique tags
 */
export function getAllTags(): string[] {
  const tags = new Set<string>();
  MODEL_LIBRARY.forEach((m) => m.tags.forEach((t) => tags.add(t)));
  return [...tags].sort();
}

/**
 * Create a model instance by ID
 */
export function createModelById(id: string, options?: Record<string, unknown>): THREE.Group | null {
  const model = getModelById(id);
  if (!model) {
    console.warn(`Unknown model ID: ${id}`);
    return null;
  }
  return model.create(options);
}

/**
 * Get model library statistics
 */
export function getLibraryStats() {
  return {
    totalModels: MODEL_LIBRARY.length,
    byCategory: Object.fromEntries(
      getCategories().map((cat) => [cat, getModelsByCategory(cat).length])
    ),
    totalTags: getAllTags().length,
  };
}

/**
 * Get a procedural enemy model by the enemy name from battle state
 * Returns the active version, or null if no procedural model exists
 */
export function getProceduralEnemyModel(enemyName: string): ModelDefinition | null {
  // Prefer active version, fall back to any version
  const active = MODEL_LIBRARY.find(
    (m) => m.category === 'enemy' && m.enemyName === enemyName && (m.isActive ?? true)
  );
  if (active) return active;

  return MODEL_LIBRARY.find(
    (m) => m.category === 'enemy' && m.enemyName === enemyName
  ) || null;
}

/**
 * Create a procedural enemy model instance by enemy name
 * Returns null if no procedural model exists for this enemy
 */
export function createProceduralEnemy(enemyName: string, options?: Record<string, unknown>): THREE.Group | null {
  const model = getProceduralEnemyModel(enemyName);
  if (!model) return null;
  return model.create(options);
}

/**
 * Get all procedural enemy models
 */
export function getProceduralEnemies(): ModelDefinition[] {
  return MODEL_LIBRARY.filter((m) => m.category === 'enemy');
}

// ============================================================================
// Version Management
// ============================================================================

/**
 * Get the effective version number for a model (defaults to 1)
 */
export function getModelVersion(model: ModelDefinition): number {
  return model.version ?? 1;
}

/**
 * Check if a model is active (defaults to true)
 */
export function isModelActive(model: ModelDefinition): boolean {
  return model.isActive ?? true;
}

/**
 * Get the base model ID for grouping versions
 * If not specified, uses the model's own ID
 */
export function getBaseModelId(model: ModelDefinition): string {
  return model.baseModelId ?? model.id;
}

/**
 * Get all versions of a model by its base ID
 * Returns models sorted by version number (ascending)
 */
export function getModelVersions(baseId: string): ModelDefinition[] {
  return MODEL_LIBRARY
    .filter((m) => getBaseModelId(m) === baseId)
    .sort((a, b) => getModelVersion(a) - getModelVersion(b));
}

/**
 * Get only active models (for game use)
 * This filters out inactive/archived versions
 */
export function getActiveModels(): ModelDefinition[] {
  return MODEL_LIBRARY.filter((m) => isModelActive(m));
}

/**
 * Get the active version of a model by its base ID
 * Returns undefined if no active version exists
 */
export function getActiveVersion(baseId: string): ModelDefinition | undefined {
  return MODEL_LIBRARY.find(
    (m) => getBaseModelId(m) === baseId && isModelActive(m)
  );
}

/**
 * Get all unique base model IDs (for grouping in UI)
 */
export function getUniqueBaseModelIds(): string[] {
  const baseIds = new Set<string>();
  MODEL_LIBRARY.forEach((m) => baseIds.add(getBaseModelId(m)));
  return [...baseIds].sort();
}

/**
 * Get models grouped by their base ID
 * Useful for version selector UI
 */
export function getModelsGroupedByBase(): Map<string, ModelDefinition[]> {
  const groups = new Map<string, ModelDefinition[]>();
  for (const model of MODEL_LIBRARY) {
    const baseId = getBaseModelId(model);
    if (!groups.has(baseId)) {
      groups.set(baseId, []);
    }
    groups.get(baseId)!.push(model);
  }
  // Sort each group by version
  for (const [, models] of groups) {
    models.sort((a, b) => getModelVersion(a) - getModelVersion(b));
  }
  return groups;
}

/**
 * Check if a model has multiple versions
 */
export function hasMultipleVersions(baseId: string): boolean {
  return getModelVersions(baseId).length > 1;
}

/**
 * Get active procedural enemy model by name
 * Only returns the active version
 */
export function getActiveProceduralEnemyModel(enemyName: string): ModelDefinition | null {
  return MODEL_LIBRARY.find(
    (m) => m.category === 'enemy' && m.enemyName === enemyName && isModelActive(m)
  ) || null;
}

// ============================================================================
// Player Model Helpers
// ============================================================================

// Import types for player model creation
import type { RaceId, ClassId } from '../types';

/**
 * Create a procedural player model based on race and class
 * This is the main entry point for creating player 3D models
 */
export function createProceduralPlayer(
  race: RaceId,
  classId: ClassId,
  options?: Omit<PlayerModelOptions, 'race' | 'classId'>
): THREE.Group {
  return createPlayerCharacter({ race, classId, ...options });
}

/**
 * Get the player model definition from the library
 */
export function getPlayerModelDefinition(): ModelDefinition | undefined {
  return MODEL_LIBRARY.find((m) => m.category === 'player');
}

/**
 * Get all player-related models (for UI/editor use)
 */
export function getPlayerModels(): ModelDefinition[] {
  return MODEL_LIBRARY.filter((m) => m.category === 'player');
}
