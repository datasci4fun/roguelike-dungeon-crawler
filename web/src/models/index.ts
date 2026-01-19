/**
 * Model Library - Registry of all 3D models
 *
 * This module provides a centralized registry for all procedural 3D models
 * that can be used in the game and level editor.
 */

import * as THREE from 'three';

// Import model factories and metadata
// @model-generator:imports:start
import { createBossThrone, BOSS_THRONE_META } from './bossThrone';
import { createEntranceDoors, ENTRANCE_DOORS_META } from './entranceDoors';
import { createGoblin, GOBLIN_META } from './goblin';
import { createGoblinKing, GOBLIN_KING_META } from './goblinKing';
import { createGoblinV2, GOBLIN_V2_META } from './goblinV2';
import { createGoblinV3, GOBLIN_V3_META } from './goblinV3';
import { createOrc, ORC_META } from './orc';
import { createPillar, PILLAR_META, COLLAPSED_PILLAR_META } from './pillar';
import { createRat, RAT_META } from './rat';
import { createSkeleton, SKELETON_META } from './skeleton';
import { createSpiderQueen, SPIDER_QUEEN_META } from './spiderQueen';
import { createStatue, STATUE_META } from './statue';
import { createTreasureChest, TREASURE_CHEST_META } from './treasureChest';
import { createWardensChair, WARDENS_CHAIR_META } from './wardensChair';
// @model-generator:imports:end

// Re-export materials
export * from './materials';

// Re-export individual models
// @model-generator:exports:start
export { createBossThrone, BOSS_THRONE_META } from './bossThrone';
export { createEntranceDoors, ENTRANCE_DOORS_META } from './entranceDoors';
export { createGoblin, GOBLIN_META } from './goblin';
export { createGoblinKing, GOBLIN_KING_META } from './goblinKing';
export { createGoblinV2, GOBLIN_V2_META } from './goblinV2';
export { createGoblinV3, GOBLIN_V3_META } from './goblinV3';
export { createOrc, ORC_META } from './orc';
export { createPillar, PILLAR_META, COLLAPSED_PILLAR_META } from './pillar';
export { createRat, RAT_META } from './rat';
export { createSkeleton, SKELETON_META } from './skeleton';
export { createSpiderQueen, SPIDER_QUEEN_META } from './spiderQueen';
export { createStatue, STATUE_META } from './statue';
export { createTreasureChest, TREASURE_CHEST_META } from './treasureChest';
export { createWardensChair, WARDENS_CHAIR_META } from './wardensChair';
// @model-generator:exports:end

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
    ...BOSS_THRONE_META,
    create: createBossThrone,
  },
  {
    ...ENTRANCE_DOORS_META,
    create: createEntranceDoors,
  },
  {
    ...GOBLIN_KING_META,
    create: createGoblinKing,
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
    isActive: true,
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
    ...ORC_META,
    create: createOrc,
  },
  {
    ...PILLAR_META,
    create: createPillar,
  },
  {
    ...RAT_META,
    create: createRat,
  },
  {
    ...SKELETON_META,
    create: createSkeleton,
  },
  {
    ...SPIDER_QUEEN_META,
    create: createSpiderQueen,
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
    ...WARDENS_CHAIR_META,
    create: createWardensChair,
  },
// @model-generator:library:end
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
