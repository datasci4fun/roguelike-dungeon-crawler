/**
 * FirstPersonTestPage - Visual test page for first-person renderer
 *
 * Provides mock scenarios and parameter controls to test rendering
 * without needing to play the actual game.
 *
 * Delegates to:
 * - FirstPersonTestPage/types.ts: Type definitions and constants
 * - FirstPersonTestPage/tileUtils.ts: Tile generation utilities
 * - FirstPersonTestPage/exploreMode.ts: WASD navigation mode
 * - FirstPersonTestPage/scenarioGenerators.ts: Mock view generation
 */
import { useState, useCallback, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FirstPersonRenderer } from '../components/SceneRenderer/FirstPersonRenderer';
import { FirstPersonRenderer3D } from '../components/SceneRenderer/FirstPersonRenderer3D';
import { BIOMES, type BiomeId } from '../components/SceneRenderer/biomes';
import type { FirstPersonView } from '../hooks/useGameSocket';
import './FirstPersonTestPage.css';

// Extracted modules
import {
  SCENARIOS,
  FACING_MAP,
  DEFAULT_PARAMS,
  type ScenarioId,
  type CustomParams,
  type FacingDirection,
} from './FirstPersonTestPage/types';
import { generateRow, generateWaterRow } from './FirstPersonTestPage/tileUtils';
import { EXPLORE_MAP, EXPLORE_START, isWalkable, generateExploreView } from './FirstPersonTestPage/exploreMode';
import { generateBiomeScene, generateMockView, transformViewForFacing } from './FirstPersonTestPage/scenarioGenerators';

// Re-export for backwards compatibility
export type { ScenarioId, CustomParams, FacingDirection } from './FirstPersonTestPage/types';

export function FirstPersonTestPage() {
  const [selectedScenario, setSelectedScenario] = useState<ScenarioId>('corridor');
  const [params, setParams] = useState<CustomParams>(DEFAULT_PARAMS);
  const [showModal, setShowModal] = useState(false);
  const [tempParams, setTempParams] = useState<CustomParams>(DEFAULT_PARAMS);
  // Override view for when user clicks a comparison thumbnail
  const [overrideView, setOverrideView] = useState<{ view: FirstPersonView; label: string } | null>(null);

  // Explore mode camera state
  const [camX, setCamX] = useState(EXPLORE_START.x);
  const [camY, setCamY] = useState(EXPLORE_START.y);
  const [camFacing, setCamFacing] = useState<FacingDirection>('south');

  // Keyboard controls for explore mode
  useEffect(() => {
    if (selectedScenario !== 'explore') return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      const dir = FACING_MAP[camFacing];

      switch (e.key.toLowerCase()) {
        case 'w':
        case 'arrowup': {
          // Move forward
          const newX = camX + dir.dx;
          const newY = camY + dir.dy;
          if (isWalkable(newX, newY)) {
            setCamX(newX);
            setCamY(newY);
          }
          e.preventDefault();
          break;
        }
        case 's':
        case 'arrowdown': {
          // Move backward
          const newX = camX - dir.dx;
          const newY = camY - dir.dy;
          if (isWalkable(newX, newY)) {
            setCamX(newX);
            setCamY(newY);
          }
          e.preventDefault();
          break;
        }
        case 'a':
        case 'arrowleft': {
          // Turn left
          const turns: FacingDirection[] = ['north', 'west', 'south', 'east'];
          const idx = turns.indexOf(camFacing);
          setCamFacing(turns[(idx + 1) % 4]);
          e.preventDefault();
          break;
        }
        case 'd':
        case 'arrowright': {
          // Turn right
          const turns: FacingDirection[] = ['north', 'east', 'south', 'west'];
          const idx = turns.indexOf(camFacing);
          setCamFacing(turns[(idx + 1) % 4]);
          e.preventDefault();
          break;
        }
        case 'q': {
          // Strafe left
          const leftDir = { north: -1, south: 1, east: 0, west: 0 }[camFacing];
          const leftDirY = { north: 0, south: 0, east: -1, west: 1 }[camFacing];
          const newX = camX + leftDir;
          const newY = camY + leftDirY;
          if (isWalkable(newX, newY)) {
            setCamX(newX);
            setCamY(newY);
          }
          e.preventDefault();
          break;
        }
        case 'e': {
          // Strafe right
          const rightDir = { north: 1, south: -1, east: 0, west: 0 }[camFacing];
          const rightDirY = { north: 0, south: 0, east: 1, west: -1 }[camFacing];
          const newX = camX + rightDir;
          const newY = camY + rightDirY;
          if (isWalkable(newX, newY)) {
            setCamX(newX);
            setCamY(newY);
          }
          e.preventDefault();
          break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedScenario, camX, camY, camFacing]);

  // Generate view based on scenario
  const mockView = selectedScenario === 'explore'
    ? generateExploreView(camX, camY, camFacing)
    : generateMockView(selectedScenario, params);

  // Use override view if set, otherwise use the scenario's default view
  const baseView = overrideView?.view ?? mockView;

  // Transform view based on facing direction (simulate rotation) - skip for explore mode
  const transformedView = selectedScenario === 'explore'
    ? baseView
    : transformViewForFacing(baseView, params.facing);

  const activeView: FirstPersonView = {
    ...transformedView,
    facing: selectedScenario === 'explore' ? FACING_MAP[camFacing] : FACING_MAP[params.facing],
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
        <Link to="/debug-3d" style={{ color: '#88f', marginTop: '5px', display: 'inline-block' }}>
          Open 3D Debug View (free-fly camera) &rarr;
        </Link>
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
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={params.debugShowWallMarkers}
                onChange={(e) => setParams({ ...params, debugShowWallMarkers: e.target.checked })}
              />
              Show Wall Markers (3D)
            </label>
            <p className="tile-grid-hint">
              Colored spheres at wall corners, console logs geometry
            </p>
          </div>

          {/* Renderer Selection */}
          <div className="tile-grid-toggle">
            <h3>Renderer</h3>
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={params.use3DRenderer}
                onChange={(e) => setParams({ ...params, use3DRenderer: e.target.checked })}
              />
              Use Three.js 3D Renderer
            </label>
            <p className="tile-grid-hint">
              True 3D rendering instead of Canvas 2D
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
              {params.use3DRenderer ? (
                <FirstPersonRenderer3D
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
                  debugShowWallMarkers={params.debugShowWallMarkers}
                />
              ) : (
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
              )}
            </div>
            <div className="preview-info">
              <span>Rows: {mockView.rows.length}</span>
              <span>Entities: {mockView.entities.length}</span>
              <span>Facing: {selectedScenario === 'explore' ? camFacing.charAt(0).toUpperCase() + camFacing.slice(1) : params.facing.charAt(0).toUpperCase() + params.facing.slice(1)}</span>
              {selectedScenario === 'explore' && <span>Pos: ({camX}, {camY})</span>}
            </div>
          </div>

          {/* Explore mode controls and mini-map */}
          {selectedScenario === 'explore' && (
            <div className="torch-comparison">
              <h3>Explore Mode</h3>
              <div className="explore-controls">
                <div className="controls-hint">
                  <p><strong>Controls:</strong></p>
                  <p>W/↑ - Move forward</p>
                  <p>S/↓ - Move backward</p>
                  <p>A/← - Turn left</p>
                  <p>D/→ - Turn right</p>
                  <p>Q - Strafe left</p>
                  <p>E - Strafe right</p>
                </div>
                <div className="mini-map">
                  <p><strong>Map:</strong></p>
                  <pre style={{ fontFamily: 'monospace', fontSize: '12px', lineHeight: '1.2' }}>
                    {EXPLORE_MAP.map((row, y) => (
                      <div key={y}>
                        {row.split('').map((cell, x) => {
                          const isPlayer = x === camX && y === camY;
                          const playerChar = { north: '↑', south: '↓', east: '→', west: '←' }[camFacing];
                          return (
                            <span
                              key={x}
                              style={{
                                color: isPlayer ? '#0f0' : cell === '#' ? '#666' : '#fff',
                                fontWeight: isPlayer ? 'bold' : 'normal',
                              }}
                            >
                              {isPlayer ? playerChar : cell}
                            </span>
                          );
                        })}
                      </div>
                    ))}
                  </pre>
                </div>
              </div>
              <button
                className="btn-secondary"
                onClick={() => {
                  setCamX(EXPLORE_START.x);
                  setCamY(EXPLORE_START.y);
                  setCamFacing('south');
                }}
                style={{ marginTop: '10px' }}
              >
                Reset Position
              </button>
            </div>
          )}

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
