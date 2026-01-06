/**
 * FirstPersonTestPage - Visual test page for first-person renderer
 *
 * Provides mock scenarios and parameter controls to test rendering
 * without needing to play the actual game.
 */
import { useState, useCallback } from 'react';
import { FirstPersonRenderer, type RenderSettings } from '../components/SceneRenderer/FirstPersonRenderer';
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
  useTileGrid: false,
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
      // Add some items in the water
      entities.push(
        { type: 'item', name: 'Sunken Gold', symbol: '*', distance: 2, offset: 0, x: 0, y: 2 },
        { type: 'item', name: 'Lost Potion', symbol: '!', distance: 3, offset: -1, x: -1, y: 3 },
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

export function FirstPersonTestPage() {
  const [selectedScenario, setSelectedScenario] = useState<ScenarioId>('corridor');
  const [params, setParams] = useState<CustomParams>(DEFAULT_PARAMS);
  const [showModal, setShowModal] = useState(false);
  const [tempParams, setTempParams] = useState<CustomParams>(DEFAULT_PARAMS);

  const mockView = generateMockView(selectedScenario, params);

  const handleScenarioClick = useCallback((scenarioId: ScenarioId) => {
    setSelectedScenario(scenarioId);
    if (scenarioId === 'custom') {
      setShowModal(true);
      setTempParams(params);
    }
  }, [params]);

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
        </aside>

        {/* Renderer Preview */}
        <main className="fp-test-preview">
          <div className="preview-container">
            <div className="preview-label">
              {SCENARIOS.find(s => s.id === selectedScenario)?.name || 'Custom'}
            </div>
            <div className="renderer-wrapper" style={{ width: params.canvasWidth, height: params.canvasHeight }}>
              <FirstPersonRenderer
                view={mockView}
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
