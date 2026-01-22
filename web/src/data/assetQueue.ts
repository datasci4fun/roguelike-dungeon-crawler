/**
 * 3D Asset Generation Queue
 *
 * Assets are now stored in the database. This file provides:
 * - Type definitions for assets
 * - API functions to fetch from database
 * - Fallback static data for development without database
 *
 * Run: python tools/3d-pipeline/generate_asset.py <source_image> --name <id>
 */

const API_BASE = 'http://localhost:8000';

export interface Asset3D {
  id: string;
  name: string;
  category: 'enemy' | 'boss' | 'item' | 'prop' | 'character';
  status: 'queued' | 'generating' | 'done' | 'error';
  sourceImage?: string; // Path to concept art
  modelPath?: string; // Path to generated GLB/OBJ
  texturePath?: string; // Path to texture
  notes?: string;
  priority: 'high' | 'medium' | 'low';
}

// API response type (matches database schema)
export interface Asset3DResponse {
  asset_id: string;
  name: string;
  category: 'enemy' | 'boss' | 'item' | 'prop' | 'character';
  status: 'queued' | 'generating' | 'done' | 'error';
  priority: 'high' | 'medium' | 'low';
  source_image?: string;
  model_path?: string;
  texture_path?: string;
  notes?: string;
  vertex_count?: number;
  file_size_bytes?: number;
  created_at: string;
  updated_at: string;
}

// Convert API response to Asset3D format
function responseToAsset(r: Asset3DResponse): Asset3D {
  return {
    id: r.asset_id,
    name: r.name,
    category: r.category,
    status: r.status,
    priority: r.priority,
    sourceImage: r.source_image,
    modelPath: r.model_path,
    texturePath: r.texture_path,
    notes: r.notes,
  };
}

// Fetch assets from database API
export async function fetchAssetsFromAPI(): Promise<Asset3D[]> {
  try {
    const response = await fetch(`${API_BASE}/api/assets3d`);
    if (response.ok) {
      const data: Asset3DResponse[] = await response.json();
      return data.map(responseToAsset);
    }
  } catch (err) {
    console.warn('Failed to fetch assets from API, using static fallback');
  }
  return ASSET_QUEUE;
}

// Fetch asset stats from API
export async function fetchAssetStatsFromAPI() {
  try {
    const response = await fetch(`${API_BASE}/api/assets3d/stats`);
    if (response.ok) {
      return await response.json();
    }
  } catch (err) {
    console.warn('Failed to fetch asset stats from API');
  }
  return getAssetStats();
}

// Assets we want to generate for the game
export const ASSET_QUEUE: Asset3D[] = [
  // TEST - pygltflib triangle (spec-compliant)
  {
    id: 'test-triangle',
    name: 'Test Triangle (pygltflib)',
    category: 'prop',
    status: 'done',
    priority: 'high',
    modelPath: '/assets/models/test-triangle.glb',
    notes: 'Simple triangle created with pygltflib - spec compliant.',
  },

  // TEST - pygltflib cube (spec-compliant)
  {
    id: 'pygltf-cube',
    name: 'Test Cube (pygltflib)',
    category: 'prop',
    status: 'done',
    priority: 'high',
    modelPath: '/assets/models/pygltf-cube.glb',
    notes: 'Green cube created with pygltflib - spec compliant.',
  },

  // TEST - trimesh cube (for comparison)
  {
    id: 'test-cube',
    name: 'Test Cube (trimesh)',
    category: 'prop',
    status: 'done',
    priority: 'high',
    modelPath: '/assets/models/test-cube.glb',
    notes: 'Simple 8-vertex cube exported by trimesh.',
  },

  // COMPLETED - Example model
  {
    id: 'robot-golem',
    name: 'Robot Golem',
    category: 'enemy',
    status: 'done',
    priority: 'high',
    sourceImage: 'tools/3d-pipeline/TripoSR/examples/robot.png',
    modelPath: '/assets/models/robot/robot.glb',
    notes: 'Generated from TripoSR example. 122k vertices, 3MB GLB with vertex colors.',
  },

  // High Priority - Core Enemies
  {
    id: 'goblin',
    name: 'Goblin',
    category: 'enemy',
    status: 'done',
    priority: 'high',
    sourceImage: 'concept_art/goblin.png',
    modelPath: '/assets/models/goblin/goblin.glb',
    notes: 'Floor 1 common enemy. Generated from OpenGameArt concept.',
  },
  {
    id: 'skeleton',
    name: 'Skeleton',
    category: 'enemy',
    status: 'queued',
    priority: 'high',
    notes: 'Classic undead. Sword and shield.',
  },
  {
    id: 'slime',
    name: 'Slime',
    category: 'enemy',
    status: 'queued',
    priority: 'high',
    notes: 'Translucent green blob. Simple geometry.',
  },
  {
    id: 'rat',
    name: 'Rat',
    category: 'enemy',
    status: 'queued',
    priority: 'high',
    notes: 'Sewer enemy. Brown fur, red eyes.',
  },
  {
    id: 'spider',
    name: 'Giant Spider',
    category: 'enemy',
    status: 'queued',
    priority: 'high',
    notes: 'Forest enemy. 8 legs, hairy.',
  },

  // Medium Priority - Bosses
  {
    id: 'goblin-king',
    name: 'Goblin King',
    category: 'boss',
    status: 'queued',
    priority: 'medium',
    notes: 'Floor 1 boss. Large goblin with crown.',
  },
  {
    id: 'rat-king',
    name: 'Rat King',
    category: 'boss',
    status: 'queued',
    priority: 'medium',
    notes: 'Floor 2 boss. Multiple rats merged.',
  },
  {
    id: 'spider-queen',
    name: 'Spider Queen',
    category: 'boss',
    status: 'queued',
    priority: 'medium',
    notes: 'Floor 3 boss. Giant spider with egg sac.',
  },
  {
    id: 'frost-giant',
    name: 'Frost Giant',
    category: 'boss',
    status: 'queued',
    priority: 'medium',
    notes: 'Floor 5 boss. Blue skin, ice armor.',
  },
  {
    id: 'dragon-emperor',
    name: 'Dragon Emperor',
    category: 'boss',
    status: 'queued',
    priority: 'medium',
    notes: 'Final boss. Massive dragon.',
  },

  // Items
  {
    id: 'health-potion',
    name: 'Health Potion',
    category: 'item',
    status: 'queued',
    priority: 'low',
    notes: 'Red liquid in glass bottle.',
  },
  {
    id: 'mana-potion',
    name: 'Mana Potion',
    category: 'item',
    status: 'queued',
    priority: 'low',
    notes: 'Blue liquid in glass bottle.',
  },
  {
    id: 'chest',
    name: 'Treasure Chest',
    category: 'prop',
    status: 'queued',
    priority: 'low',
    notes: 'Wooden chest with gold trim.',
  },
  {
    id: 'sword',
    name: 'Iron Sword',
    category: 'item',
    status: 'queued',
    priority: 'low',
    notes: 'Basic sword. Metal blade, leather grip.',
  },
  {
    id: 'shield',
    name: 'Wooden Shield',
    category: 'item',
    status: 'queued',
    priority: 'low',
    notes: 'Round wooden shield.',
  },

  // Props
  {
    id: 'torch',
    name: 'Wall Torch',
    category: 'prop',
    status: 'queued',
    priority: 'low',
    notes: 'Flaming torch on wall bracket.',
  },
  {
    id: 'barrel',
    name: 'Barrel',
    category: 'prop',
    status: 'queued',
    priority: 'low',
    notes: 'Wooden barrel. Dungeon decoration.',
  },
  {
    id: 'crate',
    name: 'Wooden Crate',
    category: 'prop',
    status: 'queued',
    priority: 'low',
    notes: 'Simple wooden crate.',
  },

  // Characters
  {
    id: 'warrior',
    name: 'Warrior',
    category: 'character',
    status: 'queued',
    priority: 'medium',
    notes: 'Player class. Heavy armor, sword.',
  },
  {
    id: 'mage',
    name: 'Mage',
    category: 'character',
    status: 'queued',
    priority: 'medium',
    notes: 'Player class. Robes, staff.',
  },
  {
    id: 'rogue',
    name: 'Rogue',
    category: 'character',
    status: 'queued',
    priority: 'medium',
    notes: 'Player class. Light armor, daggers.',
  },
  {
    id: 'cleric',
    name: 'Cleric',
    category: 'character',
    status: 'queued',
    priority: 'medium',
    notes: 'Player class. Holy robes, mace.',
  },
];

// Get assets by category
export function getAssetsByCategory(category: Asset3D['category']): Asset3D[] {
  return ASSET_QUEUE.filter(a => a.category === category);
}

// Get assets by status
export function getAssetsByStatus(status: Asset3D['status']): Asset3D[] {
  return ASSET_QUEUE.filter(a => a.status === status);
}

// Get queued assets by priority
export function getQueuedByPriority(): Asset3D[] {
  const priorityOrder = { high: 0, medium: 1, low: 2 };
  return ASSET_QUEUE
    .filter(a => a.status === 'queued')
    .sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
}

// Summary stats
export function getAssetStats() {
  const total = ASSET_QUEUE.length;
  const done = ASSET_QUEUE.filter(a => a.status === 'done').length;
  const queued = ASSET_QUEUE.filter(a => a.status === 'queued').length;
  const generating = ASSET_QUEUE.filter(a => a.status === 'generating').length;

  return { total, done, queued, generating, progress: Math.round((done / total) * 100) };
}
