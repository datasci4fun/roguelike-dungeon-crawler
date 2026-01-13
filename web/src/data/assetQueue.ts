/**
 * 3D Asset Generation Queue
 *
 * Defines concept art to generate and tracks generation status.
 * Run: python tools/3d-pipeline/generate_asset.py <source_image> --name <id>
 */

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

// Assets we want to generate for the game
export const ASSET_QUEUE: Asset3D[] = [
  // COMPLETED - Example model
  {
    id: 'robot-golem',
    name: 'Robot Golem',
    category: 'enemy',
    status: 'done',
    priority: 'high',
    sourceImage: 'tools/3d-pipeline/TripoSR/examples/robot.png',
    modelPath: '/assets/models/robot/robot.glb',
    texturePath: '/assets/models/robot/robot_texture.png',
    notes: 'Generated from TripoSR example. 122k vertices, 5.8MB GLB.',
  },

  // High Priority - Core Enemies
  {
    id: 'goblin',
    name: 'Goblin',
    category: 'enemy',
    status: 'queued',
    priority: 'high',
    notes: 'Floor 1 common enemy. Green skin, crude weapon.',
  },
  {
    id: 'skeleton',
    name: 'Skeleton Warrior',
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
    name: 'Giant Rat',
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
