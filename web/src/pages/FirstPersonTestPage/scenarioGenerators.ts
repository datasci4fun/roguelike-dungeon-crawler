/**
 * Scenario generation functions for test page
 */
import type { BiomeId } from '../../components/SceneRenderer/biomes';
import type { FirstPersonView, FirstPersonTile, FirstPersonEntity } from '../../hooks/useGameSocket';
import { generateRow, generateWaterRow, generateCavernRow } from './tileUtils';
import { FACING_MAP, type ScenarioId, type CustomParams, type FacingDirection } from './types';

// Generate unique scenes for each biome
export function generateBiomeScene(biomeId: BiomeId): FirstPersonView {
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
export function generateMockView(scenarioId: ScenarioId, params: CustomParams): FirstPersonView {
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

    case 'projection_test':
      // Projection/aspect ratio test with markers at known positions
      // Open corridor (no walls) to see markers clearly
      for (let d = 0; d <= 6; d++) {
        rows.push(generateRow(d, false, false, '.'));
      }

      // === SQUARE TEST ===
      // Place 4 markers forming a square in world space at depth 2:
      entities.push(
        { type: 'item', name: 'SQ-Top', symbol: '▲', distance: 1.5, offset: 0, x: 0, y: 1 },
        { type: 'item', name: 'SQ-Bot', symbol: '▼', distance: 2.5, offset: 0, x: 0, y: 2 },
        { type: 'item', name: 'SQ-Left', symbol: '◄', distance: 2, offset: -0.5, x: -1, y: 2 },
        { type: 'item', name: 'SQ-Right', symbol: '►', distance: 2, offset: 0.5, x: 1, y: 2 },
      );

      // === HORIZONTAL SPACING TEST ===
      [-1, -0.5, 0, 0.5, 1].forEach((offset, i) => {
        entities.push({
          type: 'item',
          name: `H${i}`,
          symbol: '●',
          distance: 3,
          offset: offset,
          x: Math.round(offset),
          y: 3,
        });
      });

      // === DEPTH SPACING TEST ===
      [1, 2, 3, 4, 5].forEach((depth) => {
        entities.push({
          type: 'item',
          name: `D${depth}`,
          symbol: '◆',
          distance: depth,
          offset: 0,
          x: 0,
          y: depth,
        });
      });

      // === CORNER MARKERS ===
      entities.push(
        { type: 'item', name: 'C1-L', symbol: '○', distance: 1, offset: -1, x: -1, y: 1 },
        { type: 'item', name: 'C1-R', symbol: '○', distance: 1, offset: 1, x: 1, y: 1 },
      );
      entities.push(
        { type: 'item', name: 'C4-L', symbol: '○', distance: 4, offset: -1, x: -1, y: 4 },
        { type: 'item', name: 'C4-R', symbol: '○', distance: 4, offset: 1, x: 1, y: 4 },
      );
      break;

    case 'occlusion_front':
      // Front wall at depth 2, enemies at depths 1, 3, 4
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
      for (let d = 0; d <= 6; d++) {
        rows.push(generateRow(d, true, true, '.'));
      }
      entities.push(
        { type: 'enemy', name: 'Center D2', symbol: 'g', distance: 2, offset: 0, x: 0, y: 2, health: 10, max_health: 10, is_elite: false },
        { type: 'item', name: 'Left D2', symbol: '!', distance: 2, offset: -0.7, x: -1, y: 2 },
        { type: 'item', name: 'Near Left D3', symbol: '*', distance: 3, offset: -0.8, x: -1, y: 3 },
        { type: 'item', name: 'Right D2', symbol: '?', distance: 2, offset: 0.7, x: 1, y: 2 },
        { type: 'item', name: 'Near Right D3', symbol: ')', distance: 3, offset: 0.8, x: 1, y: 3 },
        { type: 'enemy', name: 'Deep Center', symbol: 'T', distance: 5, offset: 0, x: 0, y: 5, health: 20, max_health: 20, is_elite: true },
      );
      break;

    case 'occlusion_edge_peek':
      // Test wall edge visibility: left wall ends at depth 3
      for (let d = 0; d <= 6; d++) {
        const hasLeftWall = d <= 3;
        rows.push(generateRow(d, hasLeftWall, false, '.'));
      }
      entities.push(
        { type: 'enemy', name: 'Open Right D2', symbol: 'g', distance: 2, offset: 0.6, x: 1, y: 2, health: 10, max_health: 10, is_elite: false },
        { type: 'item', name: 'Center D2', symbol: '!', distance: 2, offset: 0, x: 0, y: 2 },
        { type: 'item', name: 'Near Wall D3', symbol: '*', distance: 3, offset: -0.7, x: -1, y: 3 },
        { type: 'enemy', name: 'Past Wall D5', symbol: 'T', distance: 5, offset: -0.6, x: -1, y: 5, health: 15, max_health: 15, is_elite: false },
      );
      break;

    case 'occlusion_wall_bounds':
      // Test that entities BEYOND wall boundaries are correctly hidden
      for (let d = 0; d <= 6; d++) {
        rows.push(generateRow(d, true, true, '.'));
      }
      entities.push(
        { type: 'enemy', name: 'Center (visible)', symbol: 'g', distance: 2, offset: 0, x: 0, y: 2, health: 10, max_health: 10, is_elite: false },
        { type: 'item', name: 'Left Inside (visible)', symbol: '!', distance: 2, offset: -0.7, x: -1, y: 2 },
        { type: 'enemy', name: 'Left Beyond (HIDDEN)', symbol: 'X', distance: 3, offset: -1.3, x: -2, y: 3, health: 10, max_health: 10, is_elite: true },
        { type: 'item', name: 'Right Inside (visible)', symbol: '?', distance: 2, offset: 0.7, x: 1, y: 2 },
        { type: 'enemy', name: 'Right Beyond (HIDDEN)', symbol: 'X', distance: 3, offset: 1.3, x: 2, y: 3, health: 10, max_health: 10, is_elite: true },
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
 */
export function transformViewForFacing(view: FirstPersonView, facing: FacingDirection): FirstPersonView {
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
      transformedRows = [];
      for (let d = 0; d <= 6; d++) {
        transformedRows.push(generateRow(d, false, true, '.'));
      }
    }
  } else if (facing === 'west') {
    // 90° left: Looking at what was your left side
    const hadLeftWall = originalWallConfig.some(c => c.leftWall);

    if (hadLeftWall) {
      // You're facing a wall - generate a dead end view
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
