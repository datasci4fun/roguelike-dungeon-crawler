/**
 * FirstPersonTestPage - Visual test page for first-person renderer
 *
 * Provides mock scenarios and parameter controls to test rendering
 * without needing to play the actual game.
 */
import { useState, useCallback } from 'react';
import { FirstPersonRenderer } from '../components/SceneRenderer/FirstPersonRenderer';
import { BIOMES, type BiomeId } from '../components/SceneRenderer/biomes';
import type { FirstPersonView, FirstPersonTile, FirstPersonEntity } from '../hooks/useGameSocket';
import './FirstPersonTestPage.css';

// Scenario presets
type ScenarioId =
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
  | 'occlusion_front'
  | 'occlusion_side'
  | 'occlusion_edge_peek'
  | 'occlusion_wall_bounds'
  | 'biome_compare'
  | 'custom';

interface ScenarioConfig {
  id: ScenarioId;
  name: string;
  description: string;
}

const SCENARIOS: ScenarioConfig[] = [
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
  { id: 'occlusion_front', name: 'Occlusion: Front', description: 'Entity behind front wall (should hide)' },
  { id: 'occlusion_side', name: 'Occlusion: Side', description: 'Entities near side walls' },
  { id: 'occlusion_edge_peek', name: 'Occlusion: Edge Peek', description: 'Wall ends mid-corridor (all visible)' },
  { id: 'occlusion_wall_bounds', name: 'Occlusion: Wall Bounds', description: 'Entities beyond wall edges (should hide)' },
  { id: 'biome_compare', name: 'Biomes', description: 'Compare all biome themes side by side' },
  { id: 'custom', name: 'Custom', description: 'Configure your own scene' },
];

// Facing directions
type FacingDirection = 'north' | 'east' | 'south' | 'west';

const FACING_MAP: Record<FacingDirection, { dx: number; dy: number }> = {
  north: { dx: 0, dy: -1 },
  east: { dx: 1, dy: 0 },
  south: { dx: 0, dy: 1 },
  west: { dx: -1, dy: 0 },
};

// Custom parameters
interface CustomParams {
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
}

const DEFAULT_PARAMS: CustomParams = {
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
};

// Generate mock tile data
function generateTile(tile: string, x: number, y: number, visible: boolean = true): FirstPersonTile {
  return {
    tile,
    x,
    y,
    visible,
    walkable: tile === '.' || tile === '>' || tile === '<',
    has_entity: false,
  };
}

// Generate a row of tiles
function generateRow(
  depth: number,
  leftWall: boolean,
  rightWall: boolean,
  centerTile: string = '.',
  floorTile: string = '.'
): FirstPersonTile[] {
  const width = Math.max(3, Math.floor(depth * 1.5) + 1);
  const halfWidth = Math.floor(width / 2);
  const row: FirstPersonTile[] = [];

  for (let i = -halfWidth; i <= halfWidth; i++) {
    let tile = floorTile;
    if (i === -halfWidth && leftWall) tile = '#';
    else if (i === halfWidth && rightWall) tile = '#';
    else if (i === 0 && centerTile !== '.') tile = centerTile;

    row.push(generateTile(tile, i, depth));
  }

  return row;
}

// Generate a water row (uses '=' for water tiles)
function generateWaterRow(
  depth: number,
  leftWall: boolean,
  rightWall: boolean
): FirstPersonTile[] {
  return generateRow(depth, leftWall, rightWall, '=', '=');
}

// Generate an open cavern row (no side walls, wider)
function generateCavernRow(depth: number, floorTile: string = '.'): FirstPersonTile[] {
  const width = Math.max(5, Math.floor(depth * 2) + 3);
  const halfWidth = Math.floor(width / 2);
  const row: FirstPersonTile[] = [];
  for (let i = -halfWidth; i <= halfWidth; i++) {
    row.push(generateTile(floorTile, i, depth));
  }
  return row;
}

// Generate unique scenes for each biome
function generateBiomeScene(biomeId: BiomeId): FirstPersonView {
  const rows: FirstPersonTile[][] = [];
  const entities: FirstPersonEntity[] = [];

  switch (biomeId) {
    case 'dungeon':
      // Classic dungeon: corridor leading to a door
      for (let d = 0; d <= 5; d++) {
        const centerTile = d === 4 ? 'D' : '.';
        rows.push(generateRow(d, true, true, centerTile));
      }
      // Skeleton guard
      entities.push({
        type: 'enemy', name: 'Skeleton', symbol: 's',
        distance: 2, offset: 0.3, x: 0, y: 2,
        health: 8, max_health: 10, is_elite: false,
      });
      // Gold on floor
      entities.push({
        type: 'item', name: 'Gold', symbol: '*',
        distance: 1, offset: -0.5, x: -1, y: 1,
      });
      break;

    case 'ice':
      // Ice cavern: open frozen cave with icy lake
      rows.push(generateCavernRow(0));
      rows.push(generateWaterRow(1, false, false)); // Frozen lake
      rows.push(generateWaterRow(2, false, false));
      rows.push(generateCavernRow(3));
      rows.push(generateCavernRow(4));
      rows.push(generateCavernRow(5));
      // Ice elemental
      entities.push({
        type: 'enemy', name: 'Ice Elemental', symbol: 'E',
        distance: 3, offset: 0, x: 0, y: 3,
        health: 15, max_health: 15, is_elite: true,
      });
      // Frozen treasure
      entities.push({
        type: 'item', name: 'Frozen Gem', symbol: '*',
        distance: 4, offset: 1, x: 1, y: 4,
      });
      break;

    case 'forest':
      // Forest clearing: open space with trees (walls) scattered
      for (let d = 0; d <= 6; d++) {
        // Irregular tree placement
        const leftTree = d === 1 || d === 3 || d === 5;
        const rightTree = d === 2 || d === 4;
        rows.push(generateRow(d, leftTree, rightTree, '.'));
      }
      // Wolf pack
      entities.push({
        type: 'enemy', name: 'Wolf', symbol: 'w',
        distance: 2, offset: -0.5, x: -1, y: 2,
        health: 6, max_health: 8, is_elite: false,
      });
      entities.push({
        type: 'enemy', name: 'Wolf', symbol: 'w',
        distance: 2, offset: 0.5, x: 1, y: 2,
        health: 8, max_health: 8, is_elite: false,
      });
      // Herbs
      entities.push({
        type: 'item', name: 'Healing Herbs', symbol: '!',
        distance: 3, offset: 0, x: 0, y: 3,
      });
      break;

    case 'lava':
      // Volcanic bridge: narrow path over lava
      rows.push(generateRow(0, true, true, '.'));
      rows.push(generateRow(1, false, false, '.')); // Open lava pit sides
      rows.push(generateRow(2, false, false, '.'));
      rows.push(generateRow(3, false, false, '.'));
      rows.push(generateRow(4, true, true, '.')); // Back to solid ground
      rows.push(generateRow(5, true, true, '.'));
      // Fire trap
      entities.push({
        type: 'trap', name: 'Fire Trap', symbol: '^',
        distance: 2, offset: 0, x: 0, y: 2,
        trap_type: 'fire', triggered: false, is_active: true,
      });
      // Fire demon
      entities.push({
        type: 'enemy', name: 'Fire Demon', symbol: 'D',
        distance: 4, offset: 0, x: 0, y: 4,
        health: 20, max_health: 20, is_elite: true,
      });
      break;

    case 'crypt':
      // Ancient crypt: narrow tomb with stairs down
      for (let d = 0; d <= 5; d++) {
        const centerTile = d === 5 ? '>' : '.';
        rows.push(generateRow(d, true, true, centerTile));
      }
      // Undead enemies
      entities.push({
        type: 'enemy', name: 'Wraith', symbol: 'W',
        distance: 2, offset: 0, x: 0, y: 2,
        health: 12, max_health: 12, is_elite: false,
      });
      entities.push({
        type: 'enemy', name: 'Zombie', symbol: 'z',
        distance: 3, offset: -0.8, x: -1, y: 3,
        health: 5, max_health: 10, is_elite: false,
      });
      // Ancient artifact
      entities.push({
        type: 'item', name: 'Ancient Amulet', symbol: '"',
        distance: 4, offset: 0.5, x: 1, y: 4,
      });
      break;

    case 'sewer':
      // Sewer tunnels: water channel in center
      rows.push(generateRow(0, true, true, '.'));
      rows.push(generateWaterRow(1, true, true));
      rows.push(generateWaterRow(2, true, true));
      rows.push(generateWaterRow(3, true, true));
      rows.push(generateRow(4, true, true, '.'));
      rows.push(generateRow(5, true, true, '.'));
      // Giant rat
      entities.push({
        type: 'enemy', name: 'Giant Rat', symbol: 'r',
        distance: 1, offset: 0.6, x: 1, y: 1,
        health: 4, max_health: 6, is_elite: false,
      });
      // Slime
      entities.push({
        type: 'enemy', name: 'Slime', symbol: 'j',
        distance: 3, offset: -0.3, x: 0, y: 3,
        health: 8, max_health: 8, is_elite: false,
      });
      // Dropped potion
      entities.push({
        type: 'item', name: 'Murky Potion', symbol: '!',
        distance: 2, offset: 0, x: 0, y: 2,
      });
      break;

    case 'library':
      // Ancient library: bookshelves as walls, open reading area
      rows.push(generateRow(0, true, true, '.'));
      rows.push(generateRow(1, true, false, '.')); // Left bookshelf only
      rows.push(generateRow(2, false, true, '.')); // Right bookshelf only
      rows.push(generateRow(3, true, true, '.')); // Both sides
      rows.push(generateRow(4, false, false, '.')); // Open reading area
      rows.push(generateRow(5, true, true, '#')); // Back wall
      // Animated book enemy
      entities.push({
        type: 'enemy', name: 'Living Tome', symbol: 'B',
        distance: 2, offset: 0, x: 0, y: 2,
        health: 6, max_health: 6, is_elite: false,
      });
      // Scrolls and books
      entities.push({
        type: 'item', name: 'Spell Scroll', symbol: '?',
        distance: 1, offset: -0.5, x: -1, y: 1,
      });
      entities.push({
        type: 'item', name: 'Ancient Tome', symbol: '+',
        distance: 3, offset: 0.8, x: 1, y: 3,
      });
      break;

    case 'crystal':
      // Crystal cave: wide open cavern with gems
      for (let d = 0; d <= 6; d++) {
        rows.push(generateCavernRow(d));
      }
      // Crystal golem
      entities.push({
        type: 'enemy', name: 'Crystal Golem', symbol: 'G',
        distance: 3, offset: 0, x: 0, y: 3,
        health: 25, max_health: 25, is_elite: true,
      });
      // Scattered gems
      entities.push({
        type: 'item', name: 'Ruby', symbol: '*',
        distance: 1, offset: -1, x: -1, y: 1,
      });
      entities.push({
        type: 'item', name: 'Sapphire', symbol: '*',
        distance: 2, offset: 1.2, x: 1, y: 2,
      });
      entities.push({
        type: 'item', name: 'Emerald', symbol: '*',
        distance: 4, offset: -0.5, x: 0, y: 4,
      });
      break;

    default:
      // Fallback: simple corridor
      for (let d = 0; d <= 5; d++) {
        rows.push(generateRow(d, true, true, '.'));
      }
  }

  return {
    rows,
    entities,
    facing: { dx: 0, dy: -1 },
    depth: rows.length,
  };
}

// Generate mock first-person view for a scenario
function generateMockView(scenarioId: ScenarioId, params: CustomParams): FirstPersonView {
  const rows: FirstPersonTile[][] = [];
  const entities: FirstPersonEntity[] = [];
  const maxDepth = params.maxDepth;

  switch (scenarioId) {
    case 'corridor':
      for (let d = 0; d <= maxDepth; d++) {
        rows.push(generateRow(d, true, true, '.'));
      }
      break;

    case 'open_room':
      for (let d = 0; d <= maxDepth; d++) {
        rows.push(generateRow(d, false, false, '.'));
      }
      break;

    case 'dead_end':
      for (let d = 0; d <= 3; d++) {
        const centerTile = d === 3 ? '#' : '.';
        rows.push(generateRow(d, true, true, centerTile));
      }
      break;

    case 'left_wall_only':
      for (let d = 0; d <= maxDepth; d++) {
        rows.push(generateRow(d, true, false, '.'));
      }
      break;

    case 'right_wall_only':
      for (let d = 0; d <= maxDepth; d++) {
        rows.push(generateRow(d, false, true, '.'));
      }
      break;

    case 'torch_depths':
      // Create front walls at depths 2, 3, 4, 5, 6 to show torch scaling
      for (let d = 0; d <= 6; d++) {
        const centerTile = d >= 2 ? '#' : '.';
        rows.push(generateRow(d, true, true, centerTile));
      }
      break;

    case 'door_ahead':
      for (let d = 0; d <= 3; d++) {
        const centerTile = d === 2 ? 'D' : '.';
        rows.push(generateRow(d, true, true, centerTile));
      }
      break;

    case 'enemy_distances':
      for (let d = 0; d <= maxDepth; d++) {
        rows.push(generateRow(d, true, true, '.'));
      }
      // Add enemies at depths 1, 2, 3, 4
      [1, 2, 3, 4].forEach((depth, i) => {
        entities.push({
          type: 'enemy',
          name: `Goblin ${depth}`,
          symbol: 'g',
          distance: depth,
          offset: 0,
          x: 0,
          y: depth,
          health: 10,
          max_health: 10,
          is_elite: i === 3, // Last one is elite
        });
      });
      break;

    case 'items_scattered':
      for (let d = 0; d <= maxDepth; d++) {
        rows.push(generateRow(d, true, true, '.'));
      }
      // Add items at various depths and offsets
      entities.push(
        { type: 'item', name: 'Health Potion', symbol: '!', distance: 1, offset: -0.5, x: -1, y: 1 },
        { type: 'item', name: 'Gold', symbol: '*', distance: 2, offset: 0.5, x: 1, y: 2 },
        { type: 'item', name: 'Sword', symbol: ')', distance: 3, offset: 0, x: 0, y: 3 },
        { type: 'item', name: 'Scroll', symbol: '?', distance: 4, offset: -0.3, x: -1, y: 4 },
      );
      break;

    case 'compass_test':
      // Simple corridor for compass testing - facing is controlled by params
      for (let d = 0; d <= 5; d++) {
        rows.push(generateRow(d, true, true, '.'));
      }
      break;

    case 'traps_test':
      for (let d = 0; d <= 6; d++) {
        rows.push(generateRow(d, true, true, '.'));
      }
      // Add all 4 trap types at different depths
      const trapTypes: Array<'spike' | 'fire' | 'poison' | 'arrow'> = ['spike', 'fire', 'poison', 'arrow'];
      trapTypes.forEach((trapType, i) => {
        entities.push({
          type: 'trap',
          name: `${trapType.charAt(0).toUpperCase() + trapType.slice(1)} Trap`,
          symbol: '^',
          distance: i + 1,
          offset: 0,
          x: 0,
          y: i + 1,
          trap_type: trapType,
          triggered: false,
          is_active: true,
        });
      });
      break;

    case 'water_test':
      // First row normal, then water, then normal again
      rows.push(generateRow(0, true, true, '.'));
      for (let d = 1; d <= 4; d++) {
        rows.push(generateWaterRow(d, true, true));
      }
      for (let d = 5; d <= maxDepth; d++) {
        rows.push(generateRow(d, true, true, '.'));
      }
      // Add some items in the water (within corridor bounds)
      entities.push(
        { type: 'item', name: 'Sunken Gold', symbol: '*', distance: 2, offset: 0, x: 0, y: 2 },
        { type: 'item', name: 'Lost Potion', symbol: '!', distance: 3, offset: -0.6, x: -1, y: 3 },
      );
      break;

    case 'offset_test':
      // Create corridor
      for (let d = 0; d <= maxDepth; d++) {
        rows.push(generateRow(d, true, true, '.'));
      }
      // Add items at different offsets at the test depth
      // Use params.testOffset and params.testDepth for the main test item
      entities.push({
        type: 'item',
        name: 'Test Item',
        symbol: '!',
        distance: params.testDepth,
        offset: params.testOffset,
        x: Math.round(params.testOffset),
        y: params.testDepth,
      });
      // Add reference items at offset 0 at different depths for comparison
      [1, 2, 3, 4, 5].forEach((depth) => {
        // Skip if this would overlap with test item
        if (depth === params.testDepth && params.testOffset === 0) return;
        entities.push({
          type: 'item',
          name: `D${depth}`,
          symbol: '*',
          distance: depth,
          offset: 0,
          x: 0,
          y: depth,
        });
      });
      break;

    case 'offset_grid':
      // Create wide corridor for offset testing
      for (let d = 0; d <= 6; d++) {
        rows.push(generateRow(d, true, true, '.'));
      }
      // Create grid of items at various depth/offset combinations
      // Depths: 1, 2, 3, 4 | Offsets: -0.8, -0.4, 0, 0.4, 0.8 (within wall bounds ±1)
      const offsets = [-0.8, -0.4, 0, 0.4, 0.8];
      const depths = [1, 2, 3, 4];
      depths.forEach((depth) => {
        offsets.forEach((offset, i) => {
          entities.push({
            type: 'item',
            name: `D${depth}O${offset}`,
            symbol: ['!', '*', '?', ')', '+'][i % 5],
            distance: depth,
            offset: offset,
            x: Math.round(offset),
            y: depth,
          });
        });
      });
      break;

    case 'occlusion_front':
      // Front wall at depth 2, enemies at depths 1, 3, 4
      // Enemy at depth 3 should be HIDDEN (behind wall)
      // Enemies at depths 1 and 4 should be VISIBLE
      for (let d = 0; d <= 5; d++) {
        const centerTile = d === 2 ? '#' : '.';
        rows.push(generateRow(d, true, true, centerTile));
      }
      entities.push(
        { type: 'enemy', name: 'Visible (D1)', symbol: 'g', distance: 1, offset: 0, x: 0, y: 1, health: 10, max_health: 10, is_elite: false },
        { type: 'enemy', name: 'HIDDEN (D3)', symbol: 'g', distance: 3, offset: 0, x: 0, y: 3, health: 10, max_health: 10, is_elite: true },
        { type: 'enemy', name: 'HIDDEN (D4)', symbol: 'g', distance: 4, offset: 0, x: 0, y: 4, health: 10, max_health: 10, is_elite: false },
      );
      break;

    case 'occlusion_side':
      // Corridor with entities at various offsets near side walls
      // All entities should be VISIBLE (within corridor bounds ±0.9)
      // Tests that entities near walls but inside corridor render correctly
      for (let d = 0; d <= 6; d++) {
        rows.push(generateRow(d, true, true, '.'));
      }
      // Entities at different offsets - all within corridor bounds (walls at ±1)
      entities.push(
        // Center entities (should always be visible)
        { type: 'enemy', name: 'Center D2', symbol: 'g', distance: 2, offset: 0, x: 0, y: 2, health: 10, max_health: 10, is_elite: false },
        // Left-side entities (near left wall but inside corridor)
        { type: 'item', name: 'Left D2', symbol: '!', distance: 2, offset: -0.7, x: -1, y: 2 },
        { type: 'item', name: 'Near Left D3', symbol: '*', distance: 3, offset: -0.8, x: -1, y: 3 },
        // Right-side entities (near right wall but inside corridor)
        { type: 'item', name: 'Right D2', symbol: '?', distance: 2, offset: 0.7, x: 1, y: 2 },
        { type: 'item', name: 'Near Right D3', symbol: ')', distance: 3, offset: 0.8, x: 1, y: 3 },
        // Deep entities
        { type: 'enemy', name: 'Deep Center', symbol: 'T', distance: 5, offset: 0, x: 0, y: 5, health: 20, max_health: 20, is_elite: true },
      );
      break;

    case 'occlusion_edge_peek':
      // Test wall edge visibility: left wall ends at depth 3
      // Entities at depth <= 3 near left wall may be occluded
      // Entities at depth > 3 where wall ends should be visible
      for (let d = 0; d <= 6; d++) {
        // Left wall only for depths 0-3, then open corridor
        const hasLeftWall = d <= 3;
        rows.push(generateRow(d, hasLeftWall, false, '.'));
      }
      entities.push(
        // Right side (no wall) - should always be visible
        { type: 'enemy', name: 'Open Right D2', symbol: 'g', distance: 2, offset: 0.6, x: 1, y: 2, health: 10, max_health: 10, is_elite: false },
        // Center - should be visible
        { type: 'item', name: 'Center D2', symbol: '!', distance: 2, offset: 0, x: 0, y: 2 },
        // Near left wall (inside corridor) - should be visible
        { type: 'item', name: 'Near Wall D3', symbol: '*', distance: 3, offset: -0.7, x: -1, y: 3 },
        // Deep left where wall ended - should be visible (wall stops at depth 3)
        { type: 'enemy', name: 'Past Wall D5', symbol: 'T', distance: 5, offset: -0.6, x: -1, y: 5, health: 15, max_health: 15, is_elite: false },
      );
      break;

    case 'occlusion_wall_bounds':
      // Test that entities BEYOND wall boundaries are correctly hidden
      // Walls are at offset ±1, entities at ±1.2 should be occluded
      for (let d = 0; d <= 6; d++) {
        rows.push(generateRow(d, true, true, '.'));
      }
      entities.push(
        // Center - VISIBLE (inside corridor)
        { type: 'enemy', name: 'Center (visible)', symbol: 'g', distance: 2, offset: 0, x: 0, y: 2, health: 10, max_health: 10, is_elite: false },
        // Left side inside corridor - VISIBLE
        { type: 'item', name: 'Left Inside (visible)', symbol: '!', distance: 2, offset: -0.7, x: -1, y: 2 },
        // Left side BEYOND wall - HIDDEN (offset -1.3 is past wall at -1)
        { type: 'enemy', name: 'Left Beyond (HIDDEN)', symbol: 'X', distance: 3, offset: -1.3, x: -2, y: 3, health: 10, max_health: 10, is_elite: true },
        // Right side inside corridor - VISIBLE
        { type: 'item', name: 'Right Inside (visible)', symbol: '?', distance: 2, offset: 0.7, x: 1, y: 2 },
        // Right side BEYOND wall - HIDDEN (offset 1.3 is past wall at 1)
        { type: 'enemy', name: 'Right Beyond (HIDDEN)', symbol: 'X', distance: 3, offset: 1.3, x: 2, y: 3, health: 10, max_health: 10, is_elite: true },
        // Deep center - VISIBLE
        { type: 'enemy', name: 'Deep Center (visible)', symbol: 'T', distance: 5, offset: 0, x: 0, y: 5, health: 20, max_health: 20, is_elite: false },
      );
      break;

    case 'custom':
    default:
      for (let d = 0; d <= params.maxDepth; d++) {
        let centerTile = '.';
        if (params.frontWallDepth !== null && d === params.frontWallDepth) {
          centerTile = params.frontWallType || '#';
        }
        rows.push(generateRow(d, params.leftWall, params.rightWall, centerTile));
      }
      // Add enemies at specified depths
      params.enemyDepths.forEach((depth, i) => {
        entities.push({
          type: 'enemy',
          name: `Enemy ${i + 1}`,
          symbol: ['g', 's', 'o', 'T'][i % 4],
          distance: depth,
          offset: (i % 3 - 1) * 0.5,
          x: i % 3 - 1,
          y: depth,
          health: 10,
          max_health: 10,
          is_elite: false,
        });
      });
      // Add items at specified depths
      params.itemDepths.forEach((depth, i) => {
        entities.push({
          type: 'item',
          name: `Item ${i + 1}`,
          symbol: ['!', '*', ')', '?'][i % 4],
          distance: depth,
          offset: ((i + 1) % 3 - 1) * 0.5,
          x: (i + 1) % 3 - 1,
          y: depth,
        });
      });
      break;
  }

  const facingDir = FACING_MAP[params.facing];
  return {
    rows,
    entities,
    facing: facingDir,
    depth: maxDepth,
  };
}

/**
 * Transform a view based on facing direction using proper rotation math
 * Treats (offset, depth) as 2D coordinates and applies rotation:
 * - North (0°): no transform
 * - East (90° right): (offset, depth) → (-depth, offset)
 * - South (180°): (offset, depth) → (-offset, -depth) - entity behind camera
 * - West (90° left): (offset, depth) → (depth, -offset)
 *
 * Entities with resulting negative depth are behind the camera and filtered out.
 * Walls are regenerated to show the appropriate view for each direction.
 */
function transformViewForFacing(view: FirstPersonView, facing: FacingDirection): FirstPersonView {
  if (facing === 'north') {
    return view; // No transform needed
  }

  // Transform entities using 2D rotation
  const transformedEntities = view.entities
    .map(entity => {
      const offset = entity.offset;
      const depth = entity.distance;

      let newOffset: number;
      let newDepth: number;

      switch (facing) {
        case 'east':
          // Rotate 90° right: entity ahead moves to your left
          newOffset = -depth;
          newDepth = offset;
          break;
        case 'south':
          // Rotate 180°: entity ahead is now behind
          newOffset = -offset;
          newDepth = -depth;
          break;
        case 'west':
          // Rotate 90° left: entity ahead moves to your right
          newOffset = depth;
          newDepth = -offset;
          break;
        default:
          newOffset = offset;
          newDepth = depth;
      }

      return { ...entity, offset: newOffset, distance: newDepth };
    })
    // Filter out entities behind camera (negative depth) or too close
    .filter(entity => entity.distance > 0.5);

  // Analyze original wall configuration
  const originalWallConfig = view.rows.map(row => {
    if (row.length === 0) return { leftWall: false, rightWall: false };
    const leftTile = row[0]?.tile || '.';
    const rightTile = row[row.length - 1]?.tile || '.';
    return {
      leftWall: leftTile === '#' || leftTile === 'D',
      rightWall: rightTile === '#' || rightTile === 'D',
    };
  });

  // Generate new wall rows based on facing direction
  let transformedRows: FirstPersonTile[][];

  if (facing === 'south') {
    // 180° rotation: swap left/right walls, looking back down corridor
    transformedRows = view.rows.map((_row, d) => {
      const config = originalWallConfig[d];
      // Swap left and right
      return generateRow(d, config.rightWall, config.leftWall, '.');
    });
  } else if (facing === 'east') {
    // 90° right: Looking at what was your right side
    // Original corridor is to your left, original right wall is now in front
    // Check if there was a right wall - if so, it's now a front wall
    const hadRightWall = originalWallConfig.some(c => c.rightWall);

    if (hadRightWall) {
      // You're facing a wall - generate a dead end view
      transformedRows = [];
      for (let d = 0; d <= 3; d++) {
        const centerTile = d === 1 ? '#' : '.';
        transformedRows.push(generateRow(d, false, false, centerTile));
      }
    } else {
      // No right wall - you see open space extending to the right
      // The original left wall is now behind you
      // Generate an open corridor view
      transformedRows = [];
      for (let d = 0; d <= 6; d++) {
        // Looking perpendicular - might see the back wall of the corridor
        transformedRows.push(generateRow(d, false, true, '.'));
      }
    }
  } else if (facing === 'west') {
    // 90° left: Looking at what was your left side
    // Original corridor is to your right, original left wall is now in front
    const hadLeftWall = originalWallConfig.some(c => c.leftWall);

    if (hadLeftWall) {
      // You're facing a wall - generate a dead end view
      // The wall is right in front of you
      transformedRows = [];
      for (let d = 0; d <= 3; d++) {
        const centerTile = d === 1 ? '#' : '.';
        transformedRows.push(generateRow(d, false, false, centerTile));
      }
    } else {
      // No left wall - you see open space extending to the left
      transformedRows = [];
      for (let d = 0; d <= 6; d++) {
        transformedRows.push(generateRow(d, true, false, '.'));
      }
    }
  } else {
    transformedRows = view.rows;
  }

  return {
    ...view,
    rows: transformedRows,
    entities: transformedEntities,
  };
}

export function FirstPersonTestPage() {
  const [selectedScenario, setSelectedScenario] = useState<ScenarioId>('corridor');
  const [params, setParams] = useState<CustomParams>(DEFAULT_PARAMS);
  const [showModal, setShowModal] = useState(false);
  const [tempParams, setTempParams] = useState<CustomParams>(DEFAULT_PARAMS);
  // Override view for when user clicks a comparison thumbnail
  const [overrideView, setOverrideView] = useState<{ view: FirstPersonView; label: string } | null>(null);

  const mockView = generateMockView(selectedScenario, params);
  // Use override view if set, otherwise use the scenario's default view
  const baseView = overrideView?.view ?? mockView;

  // Transform view based on facing direction (simulate rotation)
  // North = default, South = mirror horizontally, East/West = swap walls
  const transformedView = transformViewForFacing(baseView, params.facing);
  const activeView: FirstPersonView = {
    ...transformedView,
    facing: FACING_MAP[params.facing],
  };

  const handleScenarioClick = useCallback((scenarioId: ScenarioId) => {
    setSelectedScenario(scenarioId);
    setOverrideView(null); // Clear any selected thumbnail
    if (scenarioId === 'custom') {
      setShowModal(true);
      setTempParams(params);
    }
  }, [params]);

  // Click handler for comparison thumbnails
  const selectThumbnail = useCallback((view: FirstPersonView, label: string) => {
    setOverrideView({ view, label });
  }, []);

  const openCustomize = useCallback(() => {
    setTempParams(params);
    setShowModal(true);
  }, [params]);

  const applyParams = useCallback(() => {
    setParams(tempParams);
    setSelectedScenario('custom');
    setShowModal(false);
  }, [tempParams]);

  const resetParams = useCallback(() => {
    setTempParams(DEFAULT_PARAMS);
  }, []);

  return (
    <div className="fp-test-page">
      <header className="fp-test-header">
        <h1>First-Person Renderer Test</h1>
        <p>Select a scenario or customize parameters to test rendering</p>
      </header>

      <div className="fp-test-content">
        {/* Scenario Menu */}
        <aside className="fp-test-menu">
          <h2>Scenarios</h2>
          <ul className="scenario-list">
            {SCENARIOS.map((scenario) => (
              <li key={scenario.id}>
                <button
                  className={`scenario-btn ${selectedScenario === scenario.id ? 'active' : ''}`}
                  onClick={() => handleScenarioClick(scenario.id)}
                >
                  <span className="scenario-name">{scenario.name}</span>
                  <span className="scenario-desc">{scenario.description}</span>
                </button>
              </li>
            ))}
          </ul>

          <div className="menu-actions">
            <button className="customize-btn" onClick={openCustomize}>
              Customize Parameters
            </button>
          </div>

          <div className="current-params">
            <h3>Current Settings</h3>
            <ul>
              <li>Canvas: {params.canvasWidth}x{params.canvasHeight}</li>
              <li>Max Depth: {params.maxDepth}</li>
              <li>Animations: {params.enableAnimations ? 'On' : 'Off'}</li>
              <li>Left Wall: {params.leftWall ? 'Yes' : 'No'}</li>
              <li>Right Wall: {params.rightWall ? 'Yes' : 'No'}</li>
              <li>Facing: {params.facing.charAt(0).toUpperCase() + params.facing.slice(1)}</li>
            </ul>
          </div>

          {/* Quick facing selector */}
          <div className="facing-selector">
            <h3>Facing Direction</h3>
            <div className="facing-buttons">
              {(['north', 'east', 'south', 'west'] as FacingDirection[]).map((dir) => (
                <button
                  key={dir}
                  className={`facing-btn ${params.facing === dir ? 'active' : ''}`}
                  onClick={() => setParams({ ...params, facing: dir })}
                >
                  {dir === 'north' ? 'N' : dir === 'east' ? 'E' : dir === 'south' ? 'S' : 'W'}
                </button>
              ))}
            </div>
          </div>

          {/* Biome selector */}
          <div className="biome-selector">
            <h3>Biome Theme</h3>
            <select
              className="biome-select"
              value={params.biome}
              onChange={(e) => setParams({ ...params, biome: e.target.value as BiomeId })}
            >
              {Object.values(BIOMES).map((biome) => (
                <option key={biome.id} value={biome.id}>
                  {biome.name}
                </option>
              ))}
            </select>
          </div>

          {/* Brightness controls */}
          <div className="brightness-controls">
            <h3>Lighting</h3>
            <div className="brightness-slider">
              <label>
                Brightness: <strong>{params.brightness.toFixed(1)}</strong>
                <input
                  type="range"
                  min={0.2}
                  max={2.0}
                  step={0.1}
                  value={params.brightness}
                  onChange={(e) => setParams({ ...params, brightness: Number(e.target.value) })}
                />
              </label>
            </div>
          </div>

          {/* Tile Grid toggle */}
          <div className="tile-grid-toggle">
            <h3>Rendering</h3>
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={params.useTileGrid}
                onChange={(e) => setParams({ ...params, useTileGrid: e.target.checked })}
              />
              Use Tile Grid
            </label>
            <p className="tile-grid-hint">
              Renders floor/ceiling as individual tiles (add images to /tiles/{params.biome}/)
            </p>
          </div>

          {/* Debug toggle */}
          <div className="tile-grid-toggle">
            <h3>Debug</h3>
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={params.debugShowOccluded}
                onChange={(e) => setParams({ ...params, debugShowOccluded: e.target.checked })}
              />
              Show Occluded Entities
            </label>
            <p className="tile-grid-hint">
              Red silhouettes for entities hidden by z-buffer
            </p>
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={params.debugShowWireframe}
                onChange={(e) => setParams({ ...params, debugShowWireframe: e.target.checked })}
              />
              Show Wall Wireframe
            </label>
            <p className="tile-grid-hint">
              Yellow edges show wall boundaries (offset ±1)
            </p>
          </div>
        </aside>

        {/* Renderer Preview */}
        <main className="fp-test-preview">
          <div className="preview-container">
            <div className="preview-label">
              {overrideView
                ? <><span className="selected-thumb">{overrideView.label}</span> <button className="clear-selection" onClick={() => setOverrideView(null)}>✕ Clear</button></>
                : (SCENARIOS.find(s => s.id === selectedScenario)?.name || 'Custom')
              }
            </div>
            <div className="renderer-wrapper" style={{ width: params.canvasWidth, height: params.canvasHeight }}>
              <FirstPersonRenderer
                view={activeView}
                width={params.canvasWidth}
                height={params.canvasHeight}
                enableAnimations={params.enableAnimations}
                settings={{
                  biome: params.biome,
                  brightness: params.brightness,
                  fogDensity: params.fogDensity,
                  torchIntensity: params.torchIntensity,
                  useTileGrid: params.useTileGrid,
                }}
                debugShowOccluded={params.debugShowOccluded}
                debugShowWireframe={params.debugShowWireframe}
              />
            </div>
            <div className="preview-info">
              <span>Rows: {mockView.rows.length}</span>
              <span>Entities: {mockView.entities.length}</span>
              <span>Facing: {params.facing.charAt(0).toUpperCase() + params.facing.slice(1)}</span>
            </div>
          </div>

          {/* Compass comparison for all 4 directions */}
          {selectedScenario === 'compass_test' && (
            <div className="torch-comparison">
              <h3>Compass in All Directions</h3>
              <div className="torch-grid">
                {(['north', 'east', 'south', 'west'] as FacingDirection[]).map((dir) => {
                  const compassView: FirstPersonView = {
                    rows: Array.from({ length: 5 }, (_, d) =>
                      generateRow(d, true, true, '.')
                    ),
                    entities: [],
                    facing: FACING_MAP[dir],
                    depth: 5,
                  };
                  return (
                    <div key={dir} className="torch-sample">
                      <div className="torch-label">{dir.charAt(0).toUpperCase() + dir.slice(1)}</div>
                      <FirstPersonRenderer
                        view={compassView}
                        width={200}
                        height={160}
                        enableAnimations={params.enableAnimations}
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Multi-view comparison for torch depths */}
          {selectedScenario === 'torch_depths' && (
            <div className="torch-comparison">
              <h3>Torch Scale Comparison</h3>
              <div className="torch-grid">
                {[2, 3, 4, 5].map((depth) => {
                  const singleWallView: FirstPersonView = {
                    rows: Array.from({ length: depth + 1 }, (_, d) =>
                      generateRow(d, true, true, d === depth ? '#' : '.')
                    ),
                    entities: [],
                    facing: { dx: 0, dy: -1 },
                    depth: depth,
                  };
                  return (
                    <div key={depth} className="torch-sample">
                      <div className="torch-label">Depth {depth}</div>
                      <FirstPersonRenderer
                        view={singleWallView}
                        width={200}
                        height={160}
                        enableAnimations={params.enableAnimations}
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Trap type comparison */}
          {selectedScenario === 'traps_test' && (
            <div className="torch-comparison">
              <h3>Trap Types Comparison</h3>
              <div className="torch-grid">
                {(['spike', 'fire', 'poison', 'arrow'] as const).map((trapType) => {
                  const trapView: FirstPersonView = {
                    rows: Array.from({ length: 4 }, (_, d) =>
                      generateRow(d, true, true, '.')
                    ),
                    entities: [{
                      type: 'trap',
                      name: `${trapType.charAt(0).toUpperCase() + trapType.slice(1)} Trap`,
                      symbol: '^',
                      distance: 2,
                      offset: 0,
                      x: 0,
                      y: 2,
                      trap_type: trapType,
                      triggered: false,
                      is_active: true,
                    }],
                    facing: { dx: 0, dy: -1 },
                    depth: 4,
                  };
                  return (
                    <div key={trapType} className="torch-sample">
                      <div className="torch-label">{trapType.charAt(0).toUpperCase() + trapType.slice(1)}</div>
                      <FirstPersonRenderer
                        view={trapView}
                        width={200}
                        height={160}
                        enableAnimations={params.enableAnimations}
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Water comparison at different depths */}
          {selectedScenario === 'water_test' && (
            <div className="torch-comparison">
              <h3>Water at Different Depths</h3>
              <div className="torch-grid">
                {[1, 2, 3, 4].map((waterStart) => {
                  const waterView: FirstPersonView = {
                    rows: Array.from({ length: 6 }, (_, d) => {
                      if (d >= waterStart && d < waterStart + 2) {
                        return generateWaterRow(d, true, true);
                      }
                      return generateRow(d, true, true, '.');
                    }),
                    entities: [],
                    facing: { dx: 0, dy: -1 },
                    depth: 6,
                  };
                  return (
                    <div key={waterStart} className="torch-sample">
                      <div className="torch-label">Water at {waterStart}-{waterStart + 1}</div>
                      <FirstPersonRenderer
                        view={waterView}
                        width={200}
                        height={160}
                        enableAnimations={params.enableAnimations}
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Offset test controls */}
          {selectedScenario === 'offset_test' && (
            <div className="torch-comparison">
              <h3>Offset Testing Controls</h3>
              <div className="offset-controls">
                <div className="offset-slider">
                  <label>
                    Offset: <strong>{params.testOffset.toFixed(1)}</strong>
                    <input
                      type="range"
                      min={-3}
                      max={3}
                      step={0.1}
                      value={params.testOffset}
                      onChange={(e) => setParams({ ...params, testOffset: Number(e.target.value) })}
                    />
                  </label>
                </div>
                <div className="offset-slider">
                  <label>
                    Depth: <strong>{params.testDepth}</strong>
                    <input
                      type="range"
                      min={1}
                      max={6}
                      step={1}
                      value={params.testDepth}
                      onChange={(e) => setParams({ ...params, testDepth: Number(e.target.value) })}
                    />
                  </label>
                </div>
              </div>
              <h4>Single Item at Different Offsets</h4>
              <div className="torch-grid">
                {[-2, -1, 0, 1, 2].map((off) => {
                  const offsetView: FirstPersonView = {
                    rows: Array.from({ length: 6 }, (_, d) =>
                      generateRow(d, true, true, '.')
                    ),
                    entities: [{
                      type: 'item' as const,
                      name: `Off ${off}`,
                      symbol: '*',
                      distance: 2,
                      offset: off,
                      x: off,
                      y: 2,
                    }],
                    facing: { dx: 0, dy: -1 },
                    depth: 6,
                  };
                  return (
                    <div key={off} className="torch-sample">
                      <div className="torch-label">Offset {off}</div>
                      <FirstPersonRenderer
                        view={offsetView}
                        width={150}
                        height={120}
                        enableAnimations={params.enableAnimations}
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Offset Grid comparison */}
          {selectedScenario === 'offset_grid' && (
            <div className="torch-comparison">
              <h3>Offset Grid - Items at Each Depth/Offset Combo</h3>
              <p className="scenario-hint">
                Each row is a different depth (1-4). Each column is a different offset (-1.5 to +1.5).
                Items should maintain consistent lateral spacing at each depth. Click any thumbnail to view larger.
              </p>
              <div className="torch-grid">
                {[1, 2, 3, 4].map((depth) => {
                  const label = `Depth ${depth}`;
                  const gridView: FirstPersonView = {
                    rows: Array.from({ length: 6 }, (_, d) =>
                      generateRow(d, true, true, '.')
                    ),
                    entities: [-1.5, -0.75, 0, 0.75, 1.5].map((offset, i) => ({
                      type: 'item' as const,
                      name: `O${offset}`,
                      symbol: ['!', '*', '?', ')', '+'][i % 5],
                      distance: depth,
                      offset: offset,
                      x: Math.round(offset),
                      y: depth,
                    })),
                    facing: { dx: 0, dy: -1 },
                    depth: 6,
                  };
                  const isSelected = overrideView?.label === label;
                  return (
                    <div
                      key={depth}
                      className={`torch-sample clickable ${isSelected ? 'selected' : ''}`}
                      onClick={() => selectThumbnail(gridView, label)}
                    >
                      <div className="torch-label">{label}</div>
                      <FirstPersonRenderer
                        view={gridView}
                        width={200}
                        height={160}
                        enableAnimations={params.enableAnimations}
                        settings={{ biome: params.biome, brightness: params.brightness }}
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Occlusion Front comparison */}
          {selectedScenario === 'occlusion_front' && (
            <div className="torch-comparison">
              <h3>Front Wall Occlusion Test</h3>
              <p className="scenario-hint">
                <strong>Wall at depth 2.</strong> Enemy at D1 should be VISIBLE.
                Enemies at D3 and D4 should be HIDDEN (behind wall). Click any thumbnail to view larger.
              </p>
              <div className="torch-grid">
                {[
                  { wallDepth: 2, entityDepth: 1, label: 'Entity D1 (visible)' },
                  { wallDepth: 2, entityDepth: 3, label: 'Entity D3 (hidden)' },
                  { wallDepth: 3, entityDepth: 2, label: 'Wall D3, Entity D2 (visible)' },
                  { wallDepth: 3, entityDepth: 4, label: 'Wall D3, Entity D4 (hidden)' },
                ].map(({ wallDepth, entityDepth, label }, i) => {
                  const occlusionView: FirstPersonView = {
                    rows: Array.from({ length: 6 }, (_, d) =>
                      generateRow(d, true, true, d === wallDepth ? '#' : '.')
                    ),
                    entities: [{
                      type: 'enemy' as const,
                      name: 'Test',
                      symbol: 'g',
                      distance: entityDepth,
                      offset: 0,
                      x: 0,
                      y: entityDepth,
                      health: 10,
                      max_health: 10,
                      is_elite: entityDepth > wallDepth,
                    }],
                    facing: { dx: 0, dy: -1 },
                    depth: 6,
                  };
                  const isSelected = overrideView?.label === label;
                  return (
                    <div
                      key={i}
                      className={`torch-sample clickable ${isSelected ? 'selected' : ''}`}
                      onClick={() => selectThumbnail(occlusionView, label)}
                    >
                      <div className="torch-label">{label}</div>
                      <FirstPersonRenderer
                        view={occlusionView}
                        width={200}
                        height={160}
                        enableAnimations={params.enableAnimations}
                        settings={{ biome: params.biome, brightness: params.brightness }}
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Occlusion Side comparison */}
          {selectedScenario === 'occlusion_side' && (
            <div className="torch-comparison">
              <h3>Side Wall Occlusion Test</h3>
              <p className="scenario-hint">
                Entities at various lateral offsets. Center entities always visible.
                Entities near wall edges test z-buffer interpolation accuracy. Click any thumbnail to view larger.
              </p>
              <div className="torch-grid">
                {[
                  { offset: 0, label: 'Center (offset 0)' },
                  { offset: -0.8, label: 'Left (offset -0.8)' },
                  { offset: 0.8, label: 'Right (offset +0.8)' },
                  { offset: -1.2, label: 'Far Left (-1.2)' },
                  { offset: 1.2, label: 'Far Right (+1.2)' },
                ].map(({ offset, label }, i) => {
                  const sideView: FirstPersonView = {
                    rows: Array.from({ length: 6 }, (_, d) =>
                      generateRow(d, true, true, '.')
                    ),
                    entities: [{
                      type: 'item' as const,
                      name: 'Test',
                      symbol: '*',
                      distance: 2,
                      offset: offset,
                      x: Math.round(offset),
                      y: 2,
                    }],
                    facing: { dx: 0, dy: -1 },
                    depth: 6,
                  };
                  const isSelected = overrideView?.label === label;
                  return (
                    <div
                      key={i}
                      className={`torch-sample clickable ${isSelected ? 'selected' : ''}`}
                      onClick={() => selectThumbnail(sideView, label)}
                    >
                      <div className="torch-label">{label}</div>
                      <FirstPersonRenderer
                        view={sideView}
                        width={150}
                        height={120}
                        enableAnimations={params.enableAnimations}
                        settings={{ biome: params.biome, brightness: params.brightness }}
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Occlusion Edge Peek comparison */}
          {selectedScenario === 'occlusion_edge_peek' && (
            <div className="torch-comparison">
              <h3>Edge Peek Occlusion Test</h3>
              <p className="scenario-hint">
                Left wall only (depths 0-3). Test entities at wall edge.
                Use facing buttons to rotate view and test edge interpolation. Click any thumbnail to view larger.
              </p>
              <div className="torch-grid">
                {[
                  { offset: 1.0, depth: 2, wallEnd: 3, label: 'Open Right D2' },
                  { offset: -0.5, depth: 2, wallEnd: 3, label: 'Wall Edge D2' },
                  { offset: -1.0, depth: 2, wallEnd: 3, label: 'Behind Wall D2' },
                  { offset: -1.0, depth: 5, wallEnd: 3, label: 'Past Wall D5' },
                ].map(({ offset, depth, wallEnd, label }, i) => {
                  const edgeView: FirstPersonView = {
                    rows: Array.from({ length: 7 }, (_, d) =>
                      generateRow(d, d <= wallEnd, false, '.')
                    ),
                    entities: [{
                      type: 'item' as const,
                      name: 'Test',
                      symbol: '*',
                      distance: depth,
                      offset: offset,
                      x: Math.round(offset),
                      y: depth,
                    }],
                    facing: { dx: 0, dy: -1 },
                    depth: 7,
                  };
                  const isSelected = overrideView?.label === label;
                  return (
                    <div
                      key={i}
                      className={`torch-sample clickable ${isSelected ? 'selected' : ''}`}
                      onClick={() => selectThumbnail(edgeView, label)}
                    >
                      <div className="torch-label">{label}</div>
                      <FirstPersonRenderer
                        view={edgeView}
                        width={150}
                        height={120}
                        enableAnimations={params.enableAnimations}
                        settings={{ biome: params.biome, brightness: params.brightness }}
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Biome comparison grid */}
          {selectedScenario === 'biome_compare' && (
            <div className="torch-comparison">
              <h3>All Biome Themes - Unique Scenes</h3>
              <div className="torch-grid biome-grid">
                {Object.values(BIOMES).map((biomeTheme) => {
                  const biomeView = generateBiomeScene(biomeTheme.id as BiomeId);
                  return (
                    <div key={biomeTheme.id} className="torch-sample biome-sample">
                      <div className="torch-label">{biomeTheme.name}</div>
                      <FirstPersonRenderer
                        view={biomeView}
                        width={240}
                        height={180}
                        enableAnimations={params.enableAnimations}
                        settings={{
                          biome: biomeTheme.id as BiomeId,
                          brightness: params.brightness,
                          fogDensity: 1.0,
                          torchIntensity: 1.0,
                        }}
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Customization Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Customize Scene Parameters</h2>

            <div className="param-group">
              <h3>Canvas Size</h3>
              <label>
                Width:
                <input
                  type="number"
                  min={200}
                  max={1200}
                  value={tempParams.canvasWidth}
                  onChange={(e) => setTempParams({ ...tempParams, canvasWidth: Number(e.target.value) })}
                />
              </label>
              <label>
                Height:
                <input
                  type="number"
                  min={150}
                  max={900}
                  value={tempParams.canvasHeight}
                  onChange={(e) => setTempParams({ ...tempParams, canvasHeight: Number(e.target.value) })}
                />
              </label>
            </div>

            <div className="param-group">
              <h3>Scene Geometry</h3>
              <label>
                Max Depth:
                <input
                  type="range"
                  min={3}
                  max={12}
                  value={tempParams.maxDepth}
                  onChange={(e) => setTempParams({ ...tempParams, maxDepth: Number(e.target.value) })}
                />
                <span>{tempParams.maxDepth}</span>
              </label>
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={tempParams.leftWall}
                  onChange={(e) => setTempParams({ ...tempParams, leftWall: e.target.checked })}
                />
                Left Wall
              </label>
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={tempParams.rightWall}
                  onChange={(e) => setTempParams({ ...tempParams, rightWall: e.target.checked })}
                />
                Right Wall
              </label>
            </div>

            <div className="param-group">
              <h3>Front Wall</h3>
              <label>
                Depth (0 = none):
                <input
                  type="number"
                  min={0}
                  max={tempParams.maxDepth}
                  value={tempParams.frontWallDepth || 0}
                  onChange={(e) => setTempParams({
                    ...tempParams,
                    frontWallDepth: Number(e.target.value) || null
                  })}
                />
              </label>
              <label>
                Type:
                <select
                  value={tempParams.frontWallType || '#'}
                  onChange={(e) => setTempParams({
                    ...tempParams,
                    frontWallType: e.target.value as '#' | 'D'
                  })}
                >
                  <option value="#">Wall (#)</option>
                  <option value="D">Door (D)</option>
                </select>
              </label>
            </div>

            <div className="param-group">
              <h3>Entities</h3>
              <label>
                Enemy Depths (comma-separated):
                <input
                  type="text"
                  placeholder="1,2,3"
                  value={tempParams.enemyDepths.join(',')}
                  onChange={(e) => setTempParams({
                    ...tempParams,
                    enemyDepths: e.target.value.split(',').map(Number).filter(n => !isNaN(n) && n > 0)
                  })}
                />
              </label>
              <label>
                Item Depths (comma-separated):
                <input
                  type="text"
                  placeholder="1,2,3"
                  value={tempParams.itemDepths.join(',')}
                  onChange={(e) => setTempParams({
                    ...tempParams,
                    itemDepths: e.target.value.split(',').map(Number).filter(n => !isNaN(n) && n > 0)
                  })}
                />
              </label>
            </div>

            <div className="param-group">
              <h3>Rendering</h3>
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={tempParams.enableAnimations}
                  onChange={(e) => setTempParams({ ...tempParams, enableAnimations: e.target.checked })}
                />
                Enable Animations
              </label>
            </div>

            <div className="modal-actions">
              <button className="btn-secondary" onClick={resetParams}>Reset to Defaults</button>
              <button className="btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="btn-primary" onClick={applyParams}>Apply</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default FirstPersonTestPage;
