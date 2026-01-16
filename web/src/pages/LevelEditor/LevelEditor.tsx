/**
 * LevelEditor - Visual dungeon editor dev page
 *
 * Features:
 * - Generate dungeons with specific seeds
 * - View and edit zone configurations
 * - Place set pieces
 * - 3D preview of selected area
 * - Export configurations
 */

import { useState, useEffect, useCallback } from 'react';
import {
  generateDungeon,
  getZoneConfigs,
  getSetPieceTypes,
  exportAsPython,
  type GeneratedDungeon,
  type FloorZoneConfig,
  type SetPieceType,
  type Room,
} from '../../services/editorApi';
import { MapCanvas } from './MapCanvas';
import { Preview3D } from './Preview3D';
import { ZONE_COLORS, type PlacedSetPiece } from './types';
import './LevelEditor.css';

export function LevelEditor() {
  // Generation controls
  const [floor, setFloor] = useState(1);
  const [seedInput, setSeedInput] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  // Generated dungeon data
  const [dungeon, setDungeon] = useState<GeneratedDungeon | null>(null);
  const [zoneConfigs, setZoneConfigs] = useState<Record<number, FloorZoneConfig>>({});
  const [setPieceTypes, setSetPieceTypes] = useState<SetPieceType[]>([]);

  // Selection state
  const [selectedRoom, setSelectedRoom] = useState<number | null>(null);
  const [selectedTile, setSelectedTile] = useState<{ x: number; y: number } | null>(null);
  const [hoveredRoom, setHoveredRoom] = useState<number | null>(null);
  const [hoveredTile, setHoveredTile] = useState<{ x: number; y: number } | null>(null);

  // Placed set pieces
  const [placedSetPieces, setPlacedSetPieces] = useState<PlacedSetPiece[]>([]);
  const [selectedSetPieceType, setSelectedSetPieceType] = useState<string | null>(null);

  // UI state
  const [activeTab, setActiveTab] = useState<'zones' | 'setpieces' | 'export'>('zones');
  const [error, setError] = useState<string | null>(null);
  const [exportedCode, setExportedCode] = useState<string | null>(null);

  // Load initial data
  useEffect(() => {
    const loadData = async () => {
      try {
        const [configs, types] = await Promise.all([
          getZoneConfigs(),
          getSetPieceTypes(),
        ]);
        setZoneConfigs(configs);
        setSetPieceTypes(types);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load data');
      }
    };
    loadData();
  }, []);

  // Generate dungeon
  const handleGenerate = useCallback(async () => {
    setIsGenerating(true);
    setError(null);
    try {
      const seed = seedInput ? parseInt(seedInput) : undefined;
      const result = await generateDungeon(floor, seed);
      setDungeon(result);
      setSeedInput(String(result.seed));
      setSelectedRoom(null);
      setSelectedTile(null);
      setPlacedSetPieces([]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Generation failed');
    } finally {
      setIsGenerating(false);
    }
  }, [floor, seedInput]);

  // Generate on initial load
  useEffect(() => {
    handleGenerate();
  }, []);

  // Handle room selection
  const handleRoomClick = useCallback((roomId: number) => {
    setSelectedRoom(roomId);
  }, []);

  // Handle tile selection
  const handleTileClick = useCallback((x: number, y: number) => {
    setSelectedTile({ x, y });

    // If placing a set piece, add it
    if (selectedSetPieceType) {
      const id = `${selectedSetPieceType}-${x}-${y}-${Date.now()}`;
      setPlacedSetPieces((prev) => [
        ...prev,
        { id, x, y, type: selectedSetPieceType, rotation: 0, scale: 1 },
      ]);
    }
  }, [selectedSetPieceType]);

  // Handle export
  const handleExport = useCallback(async () => {
    if (!dungeon) return;
    try {
      const result = await exportAsPython(
        dungeon.floor,
        dungeon.seed,
        'custom_zone',
        placedSetPieces.map((p) => ({
          x: p.x,
          y: p.y,
          type: p.type,
          rotation: p.rotation,
          scale: p.scale,
        }))
      );
      setExportedCode(result.code);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Export failed');
    }
  }, [dungeon, placedSetPieces]);

  // Get selected room data
  const selectedRoomData = dungeon?.rooms.find((r) => r.id === selectedRoom);
  const currentZoneConfig = zoneConfigs[floor];

  return (
    <div className="level-editor">
      <div className="editor-header">
        <h1>Level Editor</h1>
        <div className="generation-controls">
          <label>
            Floor:
            <select value={floor} onChange={(e) => setFloor(Number(e.target.value))}>
              {[1, 2, 3, 4, 5, 6, 7, 8].map((f) => (
                <option key={f} value={f}>
                  Floor {f}
                </option>
              ))}
            </select>
          </label>
          <label>
            Seed:
            <input
              type="text"
              value={seedInput}
              onChange={(e) => setSeedInput(e.target.value)}
              placeholder="Random"
            />
          </label>
          <button onClick={handleGenerate} disabled={isGenerating} className="generate-btn">
            {isGenerating ? 'Generating...' : 'Generate'}
          </button>
        </div>
      </div>

      {error && <div className="editor-error">{error}</div>}

      <div className="editor-main">
        {/* Left Panel - Controls */}
        <div className="editor-panel editor-left-panel">
          <div className="panel-tabs">
            <button
              className={activeTab === 'zones' ? 'active' : ''}
              onClick={() => setActiveTab('zones')}
            >
              Zones
            </button>
            <button
              className={activeTab === 'setpieces' ? 'active' : ''}
              onClick={() => setActiveTab('setpieces')}
            >
              Set Pieces
            </button>
            <button
              className={activeTab === 'export' ? 'active' : ''}
              onClick={() => setActiveTab('export')}
            >
              Export
            </button>
          </div>

          <div className="panel-content">
            {/* Zones Tab */}
            {activeTab === 'zones' && currentZoneConfig && (
              <div className="zones-panel">
                <h3>Floor {floor} Zones</h3>
                <div className="zone-info">
                  <div><strong>Start Zone:</strong> {currentZoneConfig.startZone}</div>
                  <div><strong>Fallback:</strong> {currentZoneConfig.fallbackZone}</div>
                  <div><strong>Boss Approach:</strong> {currentZoneConfig.bossApproachCount}</div>
                </div>
                <div className="zone-list">
                  {currentZoneConfig.zones.map((zone) => (
                    <div key={zone.zoneId} className="zone-item">
                      <div
                        className="zone-color"
                        style={{ backgroundColor: ZONE_COLORS[zone.zoneId] || '#6b7280' }}
                      />
                      <div className="zone-details">
                        <div className="zone-name">{zone.zoneId}</div>
                        <div className="zone-meta">
                          {zone.requiredCount > 0 ? (
                            <span className="required">Required ({zone.requiredCount})</span>
                          ) : (
                            <span>Weight: {zone.weight}</span>
                          )}
                          {zone.selectionRule && (
                            <span className="selection-rule">{zone.selectionRule}</span>
                          )}
                        </div>
                        {zone.eligibilityDescription && (
                          <div className="zone-eligibility">{zone.eligibilityDescription}</div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Set Pieces Tab */}
            {activeTab === 'setpieces' && (
              <div className="setpieces-panel">
                <h3>Set Pieces</h3>
                <p className="help-text">Click a type, then click on the map to place.</p>
                <div className="setpiece-list">
                  {setPieceTypes.map((type) => (
                    <button
                      key={type.id}
                      className={`setpiece-btn ${selectedSetPieceType === type.id ? 'selected' : ''}`}
                      onClick={() =>
                        setSelectedSetPieceType(selectedSetPieceType === type.id ? null : type.id)
                      }
                    >
                      {type.id}
                    </button>
                  ))}
                </div>
                {placedSetPieces.length > 0 && (
                  <>
                    <h4>Placed ({placedSetPieces.length})</h4>
                    <div className="placed-list">
                      {placedSetPieces.map((piece) => (
                        <div key={piece.id} className="placed-item">
                          <span>
                            {piece.type} @ ({piece.x}, {piece.y})
                          </span>
                          <button
                            onClick={() =>
                              setPlacedSetPieces((prev) =>
                                prev.filter((p) => p.id !== piece.id)
                              )
                            }
                          >
                            X
                          </button>
                        </div>
                      ))}
                    </div>
                    <button
                      className="clear-btn"
                      onClick={() => setPlacedSetPieces([])}
                    >
                      Clear All
                    </button>
                  </>
                )}
              </div>
            )}

            {/* Export Tab */}
            {activeTab === 'export' && (
              <div className="export-panel">
                <h3>Export</h3>
                <button onClick={handleExport} className="export-btn">
                  Export as Python
                </button>
                {exportedCode && (
                  <div className="exported-code">
                    <pre>{exportedCode}</pre>
                    <button
                      onClick={() => navigator.clipboard.writeText(exportedCode)}
                    >
                      Copy to Clipboard
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Center - Map Canvas */}
        <div className="editor-center">
          <MapCanvas
            dungeon={dungeon}
            selectedRoom={selectedRoom}
            selectedTile={selectedTile}
            hoveredRoom={hoveredRoom}
            placedSetPieces={placedSetPieces}
            onRoomClick={handleRoomClick}
            onTileClick={handleTileClick}
            onRoomHover={setHoveredRoom}
            onTileHover={(x, y) => setHoveredTile({ x, y })}
          />
        </div>

        {/* Right Panel - 3D Preview + Selection Info */}
        <div className="editor-panel editor-right-panel">
          {/* 3D Preview */}
          <Preview3D
            dungeon={dungeon}
            selectedTile={selectedTile}
            selectedRoom={selectedRoomData || null}
          />

          <h3>Selection Info</h3>

          {/* Tile Info */}
          {selectedTile && dungeon && (
            <div className="info-section">
              <h4>Tile</h4>
              <div className="info-grid">
                <span>Position:</span>
                <span>({selectedTile.x}, {selectedTile.y})</span>
                <span>Type:</span>
                <span>{dungeon.tiles[selectedTile.y]?.[selectedTile.x] || '?'}</span>
              </div>
            </div>
          )}

          {/* Room Info */}
          {selectedRoomData && (
            <div className="info-section">
              <h4>Room #{selectedRoomData.id}</h4>
              <div className="info-grid">
                <span>Position:</span>
                <span>({selectedRoomData.x}, {selectedRoomData.y})</span>
                <span>Size:</span>
                <span>{selectedRoomData.width} x {selectedRoomData.height}</span>
                <span>Area:</span>
                <span>{selectedRoomData.width * selectedRoomData.height}</span>
                <span>Zone:</span>
                <span style={{ color: ZONE_COLORS[selectedRoomData.zone] }}>
                  {selectedRoomData.zone}
                </span>
                <span>Type:</span>
                <span>{selectedRoomData.roomType}</span>
              </div>
            </div>
          )}

          {/* Hover Info */}
          {hoveredTile && dungeon && (
            <div className="info-section hover-info">
              <h4>Hover</h4>
              <div className="info-grid">
                <span>Position:</span>
                <span>({hoveredTile.x}, {hoveredTile.y})</span>
              </div>
            </div>
          )}

          {/* Dungeon Summary */}
          {dungeon && (
            <div className="info-section">
              <h4>Dungeon</h4>
              <div className="info-grid">
                <span>Seed:</span>
                <span>{dungeon.seed}</span>
                <span>Size:</span>
                <span>{dungeon.width} x {dungeon.height}</span>
                <span>Rooms:</span>
                <span>{dungeon.rooms.length}</span>
                <span>Interactives:</span>
                <span>{dungeon.interactives.length}</span>
                <span>Visuals:</span>
                <span>{dungeon.tileVisuals.length}</span>
              </div>
            </div>
          )}

          {/* Zone Summary */}
          {dungeon && (
            <div className="info-section zone-summary">
              <h4>Zone Summary</h4>
              <pre className="zone-summary-text">{dungeon.zoneSummary}</pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
