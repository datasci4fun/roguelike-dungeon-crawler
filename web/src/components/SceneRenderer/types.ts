/**
 * Scene Renderer Types
 *
 * Data structures for the layered canvas-based scene renderer.
 * These types define the contract between game state and visual rendering.
 */

// Tile types matching backend constants
export type TileType =
  | 'floor'
  | 'wall'
  | 'door'
  | 'stairs_down'
  | 'stairs_up'
  | 'water'
  | 'lava'
  | 'ice'
  | 'poison_gas'
  | 'deep_water';

// Entity kinds
export type EntityKind =
  | 'player'
  | 'enemy'
  | 'boss'
  | 'item'
  | 'trap'
  | 'hazard';

// Enemy types for sprite selection
export type EnemyType =
  | 'goblin'
  | 'skeleton'
  | 'orc'
  | 'wraith'
  | 'troll'
  | 'dragon'
  | 'necromancer'
  | 'demon'
  | 'assassin'
  | 'fire_elemental'
  | 'ice_elemental'
  | 'lightning_elemental';

// Boss types
export type BossType =
  | 'goblin_king'
  | 'cave_troll'
  | 'lich_lord'
  | 'arcane_keeper'
  | 'dragon_emperor';

// Item types for sprite selection
export type ItemType =
  | 'health_potion'
  | 'strength_potion'
  | 'teleport_scroll'
  | 'weapon'
  | 'armor'
  | 'shield'
  | 'ring'
  | 'amulet';

// Trap types
export type TrapType = 'spike' | 'fire' | 'poison' | 'arrow';

// Status effects for visual indicators
export type StatusEffect = 'poison' | 'burn' | 'freeze' | 'stun';

/**
 * Anchor point for sprite positioning
 * (0.5, 1.0) = bottom-center (default for actors)
 * (0.5, 0.5) = center (default for tiles/items)
 */
export interface Anchor {
  x: number; // 0-1, where 0=left, 1=right
  y: number; // 0-1, where 0=top, 1=bottom
}

/**
 * A renderable entity in the scene
 */
export interface SceneEntity {
  id: string;
  kind: EntityKind;
  subtype?: string; // enemy type, item type, etc.
  x: number; // grid x
  y: number; // grid y
  z: number; // layer order (higher = in front)
  visible: boolean; // in FOV

  // Visual properties
  spriteUrl?: string; // optional custom sprite
  color?: string; // fallback color for placeholder
  symbol?: string; // ASCII symbol for hybrid view

  // Positioning
  anchor?: Anchor;
  scale?: number; // 1.0 = normal

  // State
  isElite?: boolean;
  isBoss?: boolean;
  health?: number;
  maxHealth?: number;
  statusEffects?: StatusEffect[];
}

/**
 * Tile data for a single cell
 */
export interface SceneTile {
  type: TileType;
  visible: boolean; // currently in FOV
  explored: boolean; // ever seen
  decoration?: string; // optional decoration sprite
  bloodstain?: boolean; // has blood splatter
}

/**
 * Lighting value for a cell (0 = dark, 1 = fully lit)
 */
export type LightLevel = number;

/**
 * Complete scene frame - everything needed to render one frame
 */
export interface SceneFrame {
  // Dimensions
  width: number; // grid width
  height: number; // grid height
  tileSize: number; // pixels per tile

  // Viewport (for large dungeons)
  viewportX: number; // camera offset x
  viewportY: number; // camera offset y
  viewportWidth: number; // visible tiles x
  viewportHeight: number; // visible tiles y

  // Tile data (flattened array, row-major: index = y * width + x)
  tiles: SceneTile[];

  // Entities sorted by z-order
  entities: SceneEntity[];

  // Lighting per cell (same indexing as tiles)
  lighting: LightLevel[];

  // Theme for tile selection (matches biomes.ts keys)
  theme: 'dungeon' | 'ice' | 'forest' | 'lava' | 'crypt' | 'sewer' | 'library' | 'crystal';

  // Current dungeon level
  level: number;
}

/**
 * Render layer constants
 */
export const RenderLayers = {
  TILES: 0,
  DECALS: 1,
  ITEMS: 2,
  TRAPS: 3,
  HAZARDS: 4,
  ACTORS: 5,
  EFFECTS: 6,
  FOG: 7,
  UI: 8,
} as const;

/**
 * Default colors for placeholder rendering
 */
export const PlaceholderColors = {
  // Tiles
  floor: '#3a3a3a',
  wall: '#1a1a1a',
  door: '#8B4513',
  stairs_down: '#FFD700',
  stairs_up: '#C0C0C0',
  water: '#1E90FF',
  lava: '#FF4500',
  ice: '#87CEEB',
  poison_gas: '#9ACD32',
  deep_water: '#000080',

  // Entities
  player: '#00FF00',
  enemy: '#FF0000',
  boss: '#FF00FF',
  item: '#FFFF00',
  trap: '#FFA500',
  hazard: '#FF6347',

  // Enemy types
  goblin: '#90EE90',
  skeleton: '#F5F5DC',
  orc: '#8B0000',
  wraith: '#9370DB',
  troll: '#556B2F',
  dragon: '#FF4500',
  necromancer: '#4B0082',
  demon: '#DC143C',
  assassin: '#2F4F4F',
  fire_elemental: '#FF6347',
  ice_elemental: '#00BFFF',
  lightning_elemental: '#FFD700',

  // Status effects
  poison: '#32CD32',
  burn: '#FF4500',
  freeze: '#00FFFF',
  stun: '#FFFF00',

  // FOV
  unexplored: '#000000',
  explored_not_visible: 'rgba(0, 0, 0, 0.6)',
} as const;

/**
 * Convert game state to SceneFrame
 * This will be implemented in useSceneRenderer hook
 */
export type GameStateToSceneFrame = (gameState: unknown) => SceneFrame;
