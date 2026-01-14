/**
 * Enemy Model Mapping Utility
 *
 * Maps enemy names from battle state to 3D model paths.
 * Falls back gracefully when models don't exist.
 */

// Known enemy name -> asset_id mappings
// Enemy names from battle state are title-cased, asset IDs are lowercase
const ENEMY_NAME_TO_ASSET: Record<string, string> = {
  // Floor 1 enemies
  'Goblin': 'goblin',
  'Skeleton': 'skeleton',
  'Orc': 'orc',

  // Floor 2 enemies
  'Giant Rat': 'rat',
  'Sewer Slime': 'slime',

  // Floor 3 enemies
  'Giant Spider': 'spider',
  'Forest Sprite': 'sprite',

  // Floor 5 enemies
  'Ice Elemental': 'ice-elemental',
  'Frost Wolf': 'frost-wolf',

  // Bosses
  'Goblin King': 'goblin-king',
  'Rat King': 'rat-king',
  'Spider Queen': 'spider-queen',
  'Frost Giant': 'frost-giant',
  'Dragon Emperor': 'dragon-emperor',

  // Test/example models (always available)
  'Robot Golem': 'robot-golem',
};

// Cache of which models actually exist (populated on first check)
const modelExistsCache = new Map<string, boolean>();

/**
 * Get the asset ID for an enemy name
 */
export function getAssetIdForEnemy(enemyName: string): string | null {
  // Direct lookup
  if (ENEMY_NAME_TO_ASSET[enemyName]) {
    return ENEMY_NAME_TO_ASSET[enemyName];
  }

  // Try lowercase conversion (e.g., "Goblin" -> "goblin")
  const lowercased = enemyName.toLowerCase().replace(/\s+/g, '-');
  return lowercased;
}

/**
 * Get the model path for an enemy
 * Returns null if no model is mapped
 */
export function getModelPathForEnemy(enemyName: string): string | null {
  const assetId = getAssetIdForEnemy(enemyName);
  if (!assetId) return null;

  // Standard path format: /assets/models/{asset_id}/{asset_id}.glb
  return `/assets/models/${assetId}/${assetId}.glb`;
}

/**
 * Check if a model file exists (with caching)
 * Uses HEAD request to avoid downloading the full file
 */
export async function checkModelExists(modelPath: string): Promise<boolean> {
  if (modelExistsCache.has(modelPath)) {
    return modelExistsCache.get(modelPath)!;
  }

  try {
    const response = await fetch(modelPath, { method: 'HEAD' });
    const exists = response.ok;
    modelExistsCache.set(modelPath, exists);
    return exists;
  } catch {
    modelExistsCache.set(modelPath, false);
    return false;
  }
}

/**
 * Get available model paths for a list of enemies
 * Filters to only include models that exist
 */
export async function getAvailableEnemyModels(
  enemyNames: string[]
): Promise<Map<string, string>> {
  const available = new Map<string, string>();

  await Promise.all(
    enemyNames.map(async (name) => {
      const path = getModelPathForEnemy(name);
      if (path && await checkModelExists(path)) {
        available.set(name, path);
      }
    })
  );

  return available;
}

// Pre-defined list of models we know exist (for faster initial render)
export const KNOWN_AVAILABLE_MODELS: Record<string, string> = {
  'Goblin': '/assets/models/goblin/goblin.glb',
  'Robot Golem': '/assets/models/robot/robot.glb',
};
