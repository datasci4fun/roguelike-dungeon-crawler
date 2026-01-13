/**
 * FirstPersonTestPage type definitions
 */
import type { BiomeId } from '../../components/SceneRenderer/biomes';

// Scenario presets
export type ScenarioId =
  | 'explore'
  | 'corridor'
  | 'open_room'
  | 'dead_end'
  | 'left_wall_only'
  | 'right_wall_only'
  | 'torch_depths'
  | 'door_ahead'
  | 'enemy_distances'
  | 'items_scattered'
  | 'compass_test'
  | 'traps_test'
  | 'water_test'
  | 'offset_test'
  | 'offset_grid'
  | 'projection_test'
  | 'occlusion_front'
  | 'occlusion_side'
  | 'occlusion_edge_peek'
  | 'occlusion_wall_bounds'
  | 'biome_compare'
  | 'custom';

export interface ScenarioConfig {
  id: ScenarioId;
  name: string;
  description: string;
}

// Facing directions
export type FacingDirection = 'north' | 'east' | 'south' | 'west';

export const FACING_MAP: Record<FacingDirection, { dx: number; dy: number }> = {
  north: { dx: 0, dy: -1 },
  east: { dx: 1, dy: 0 },
  south: { dx: 0, dy: 1 },
  west: { dx: -1, dy: 0 },
};

// Custom parameters
export interface CustomParams {
  maxDepth: number;
  leftWall: boolean;
  rightWall: boolean;
  frontWallDepth: number | null;
  frontWallType: '#' | 'D' | null;
  enemyDepths: number[];
  itemDepths: number[];
  canvasWidth: number;
  canvasHeight: number;
  enableAnimations: boolean;
  facing: FacingDirection;
  // Offset test params
  testOffset: number;
  testDepth: number;
  // Biome/brightness settings
  biome: BiomeId;
  brightness: number;
  fogDensity: number;
  torchIntensity: number;
  useTileGrid: boolean;
  // Debug settings
  debugShowOccluded: boolean;
  debugShowWireframe: boolean;
  debugShowWallMarkers: boolean;
  // Renderer selection
  use3DRenderer: boolean;
}

export const DEFAULT_PARAMS: CustomParams = {
  maxDepth: 8,
  leftWall: true,
  rightWall: true,
  frontWallDepth: null,
  frontWallType: '#',
  enemyDepths: [],
  itemDepths: [],
  canvasWidth: 800,
  canvasHeight: 600,
  enableAnimations: true,
  facing: 'north',
  testOffset: 0,
  testDepth: 2,
  // Biome/brightness defaults
  biome: 'dungeon',
  brightness: 1.0,
  fogDensity: 1.0,
  torchIntensity: 1.0,
  useTileGrid: true,
  // Debug defaults
  debugShowOccluded: false,
  debugShowWireframe: false,
  debugShowWallMarkers: false,
  // Renderer defaults
  use3DRenderer: false,
};

export const SCENARIOS: ScenarioConfig[] = [
  { id: 'explore', name: 'Explore (WASD)', description: 'Navigate a dungeon with keyboard' },
  { id: 'corridor', name: 'Corridor', description: 'Walls on both sides, open ahead' },
  { id: 'open_room', name: 'Open Room', description: 'No side walls, open space' },
  { id: 'dead_end', name: 'Dead End', description: 'Front wall at depth 3' },
  { id: 'left_wall_only', name: 'Left Wall Only', description: 'Wall on left, open on right' },
  { id: 'right_wall_only', name: 'Right Wall Only', description: 'Wall on right, open on left' },
  { id: 'torch_depths', name: 'Torch at Depths', description: 'Front walls with torches at 1,2,3,4,5' },
  { id: 'door_ahead', name: 'Door Ahead', description: 'Door at depth 2' },
  { id: 'enemy_distances', name: 'Enemies at Distances', description: 'Enemies at depths 1,2,3,4' },
  { id: 'items_scattered', name: 'Items Scattered', description: 'Various items at different depths' },
  { id: 'compass_test', name: 'Compass Test', description: 'View compass in all 4 directions' },
  { id: 'traps_test', name: 'Traps', description: 'All 4 trap types at different depths' },
  { id: 'water_test', name: 'Water', description: 'Water tiles with reflections' },
  { id: 'offset_test', name: 'Offset Test', description: 'Test item offsets at various depths' },
  { id: 'offset_grid', name: 'Offset Grid', description: 'Grid of items at depth/offset combos' },
  { id: 'projection_test', name: 'Projection Test', description: 'Markers at known positions to verify aspect ratio' },
  { id: 'occlusion_front', name: 'Occlusion: Front', description: 'Entity behind front wall (should hide)' },
  { id: 'occlusion_side', name: 'Occlusion: Side', description: 'Entities near side walls' },
  { id: 'occlusion_edge_peek', name: 'Occlusion: Edge Peek', description: 'Wall ends mid-corridor (all visible)' },
  { id: 'occlusion_wall_bounds', name: 'Occlusion: Wall Bounds', description: 'Entities beyond wall edges (should hide)' },
  { id: 'biome_compare', name: 'Biomes', description: 'Compare all biome themes side by side' },
  { id: 'custom', name: 'Custom', description: 'Configure your own scene' },
];
