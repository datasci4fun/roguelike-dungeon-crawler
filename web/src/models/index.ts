/**
 * Model Library - Registry of all 3D models
 *
 * This module provides a centralized registry for all procedural 3D models
 * that can be used in the game and level editor.
 */

import * as THREE from 'three';

// Import model factories and metadata
import { createEntranceDoors, ENTRANCE_DOORS_META } from './entranceDoors';
import { createBossThrone, BOSS_THRONE_META } from './bossThrone';
import { createPillar, createPillar as createCollapsedPillar, PILLAR_META, COLLAPSED_PILLAR_META } from './pillar';
import { createStatue, STATUE_META } from './statue';
import { createTreasureChest, TREASURE_CHEST_META } from './treasureChest';
import { createGoblin, GOBLIN_META } from './goblin';
import { createGoblinKing, GOBLIN_KING_META } from './goblinKing';
import { createSkeleton, SKELETON_META } from './skeleton';
import { createOrc, ORC_META } from './orc';
import { createRat, RAT_META } from './rat';
import { createSpiderQueen, SPIDER_QUEEN_META } from './spiderQueen';
import { createWardensChair, WARDENS_CHAIR_META } from './wardensChair';

// Re-export materials
export * from './materials';

// Re-export individual models
export { createEntranceDoors, ENTRANCE_DOORS_META } from './entranceDoors';
export { createBossThrone, BOSS_THRONE_META } from './bossThrone';
export { createPillar, PILLAR_META, COLLAPSED_PILLAR_META } from './pillar';
export { createStatue, STATUE_META } from './statue';
export { createTreasureChest, TREASURE_CHEST_META } from './treasureChest';
export { createGoblin, GOBLIN_META } from './goblin';
export { createGoblinKing, GOBLIN_KING_META } from './goblinKing';
export { createSkeleton, SKELETON_META } from './skeleton';
export { createOrc, ORC_META } from './orc';
export { createRat, RAT_META } from './rat';
export { createSpiderQueen, SPIDER_QUEEN_META } from './spiderQueen';
export { createWardensChair, WARDENS_CHAIR_META } from './wardensChair';

/**
 * Model category types
 */
export type ModelCategory = 'structure' | 'furniture' | 'decoration' | 'interactive' | 'prop' | 'enemy';

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
}

/**
 * The complete model library
 */
export const MODEL_LIBRARY: ModelDefinition[] = [
  {
    ...ENTRANCE_DOORS_META,
    create: createEntranceDoors,
  },
  {
    ...BOSS_THRONE_META,
    create: createBossThrone,
  },
  {
    ...PILLAR_META,
    create: createPillar,
  },
  {
    ...COLLAPSED_PILLAR_META,
    create: (options) => createCollapsedPillar({ ...options, collapsed: true }),
  },
  {
    ...STATUE_META,
    create: createStatue,
  },
  {
    ...TREASURE_CHEST_META,
    create: createTreasureChest,
  },
  {
    ...GOBLIN_META,
    create: createGoblin,
  },
  {
    ...GOBLIN_KING_META,
    create: createGoblinKing,
  },
  {
    ...SKELETON_META,
    create: createSkeleton,
  },
  {
    ...ORC_META,
    create: createOrc,
  },
  {
    ...RAT_META,
    create: createRat,
  },
  {
    ...SPIDER_QUEEN_META,
    create: createSpiderQueen,
  },
  {
    ...WARDENS_CHAIR_META,
    create: createWardensChair,
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
 * Returns null if no procedural model exists for this enemy
 */
export function getProceduralEnemyModel(enemyName: string): ModelDefinition | null {
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
