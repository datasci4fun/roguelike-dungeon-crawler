/**
 * LevelEditor - Zone Layout Rule Designer
 *
 * A tool for designing placement rules that get applied during
 * procedural dungeon generation. NOT a manual tile editor.
 *
 * Features:
 * - Generate sample dungeons with specific seeds
 * - View zone configurations and room layouts
 * - Design placement rules for assets
 * - Export rules as Python zone_layout code
 */

import { useState, useEffect, useCallback } from 'react';
import {
  generateDungeon,
  getZoneConfigs,
  getSetPieceTypes,
  type GeneratedDungeon,
  type FloorZoneConfig,
  type SetPieceType,
  type Room,
} from '../../services/editorApi';
import { MapCanvas } from './MapCanvas';
import { RuleBuilder } from './RuleBuilder';
import { ZONE_COLORS } from './types';
import './LevelEditor.css';

export function LevelEditor() {
  // Generation controls
  const [floor, setFloor] = useState(1);
  const [seedInput, setSeedInput] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  // Generated dungeon data
  const [dungeon, setDungeon] = useState<GeneratedDungeon | null>(null);
  const [zoneConfigs, setZoneConfigs] = useState<Record<number, FloorZoneConfig>>({});

  // Selection state
  const [selectedRoom, setSelectedRoom] = useState<number | null>(null);
  const [selectedTile, setSelectedTile] = useState<{ x: number; y: number } | null>(null);
  const [hoveredTile, setHoveredTile] = useState<{ x: number; y: number } | null>(null);

  // UI state
  const [activeTab, setActiveTab] = useState<'zones' | 'rules'>('rules');
  const [error, setError] = useState<string | null>(null);
  const [exportedCode, setExportedCode] = useState<string | null>(null);

  // Load initial data
  useEffect(() => {
    const loadData = async () => {
      try {
        const configs = await getZoneConfigs();
        setZoneConfigs(configs);
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
    // Find room containing this tile
    if (dungeon) {
      const room = dungeon.rooms.find(
        (r) => x >= r.x && x < r.x + r.width && y >= r.y && y < r.y + r.height
      );
      if (room) {
        setSelectedRoom(room.id);
      }
    }
  }, [dungeon]);

  // Handle export
  const handleExport = useCallback((code: string) => {
    setExportedCode(code);
    navigator.clipboard.writeText(code);
    // Show feedback
    alert('Code copied to clipboard!');
  }, []);

  // Get selected room data
  const selectedRoomData = dungeon?.rooms.find((r) => r.id === selectedRoom);
  const currentZoneConfig = zoneConfigs[floor];
  const selectedZoneId = selectedRoomData?.zone || currentZoneConfig?.startZone || 'generic';

  return (
    <div className="level-editor">
      <div className="editor-header">
        <h1>Zone Layout Designer</h1>
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
            {isGenerating ? 'Generating...' : 'Generate Sample'}
          </button>
        </div>
      </div>

      {error && <div className="editor-error">{error}</div>}

      <div className="editor-main">
        {/* Left Panel - Zone Info */}
        <div className="editor-panel editor-left-panel">
          <div className="panel-tabs">
            <button
              className={activeTab === 'zones' ? 'active' : ''}
              onClick={() => setActiveTab('zones')}
            >
              Zones
            </button>
            <button
              className={activeTab === 'rules' ? 'active' : ''}
              onClick={() => setActiveTab('rules')}
            >
              Info
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
                    <div
                      key={zone.zoneId}
                      className={`zone-item ${selectedZoneId === zone.zoneId ? 'selected' : ''}`}
                      onClick={() => {
                        // Find first room with this zone
                        const room = dungeon?.rooms.find((r) => r.zone === zone.zoneId);
                        if (room) {
                          setSelectedRoom(room.id);
                        }
                      }}
                    >
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
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Info Tab */}
            {activeTab === 'rules' && (
              <div className="info-panel">
                <h3>How It Works</h3>
                <div className="help-content">
                  <p>
                    This tool lets you design <strong>placement rules</strong> for
                    assets that get applied during procedural generation.
                  </p>
                  <p>
                    <strong>1.</strong> Select a zone from the list or click a room on the map
                  </p>
                  <p>
                    <strong>2.</strong> Use the Rule Builder to add placement rules
                  </p>
                  <p>
                    <strong>3.</strong> Rules define WHERE and HOW MANY assets to place
                  </p>
                  <p>
                    <strong>4.</strong> Export as Python code to add to zone_layouts.py
                  </p>
                  <h4>Position Strategies</h4>
                  <ul>
                    <li><strong>Center</strong> - Place at room center</li>
                    <li><strong>Corners</strong> - Place in all 4 corners</li>
                    <li><strong>Walls</strong> - Along specific or any wall</li>
                    <li><strong>Entrances</strong> - At room doorways</li>
                    <li><strong>Random</strong> - Random floor positions</li>
                  </ul>
                </div>
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
            hoveredRoom={null}
            placedSetPieces={[]}
            onRoomClick={handleRoomClick}
            onTileClick={handleTileClick}
            onRoomHover={() => {}}
            onTileHover={(x, y) => setHoveredTile({ x, y })}
          />
          {/* Room info overlay */}
          {selectedRoomData && (
            <div className="room-info-overlay">
              <span>Room #{selectedRoomData.id}</span>
              <span>{selectedRoomData.width}x{selectedRoomData.height}</span>
              <span style={{ color: ZONE_COLORS[selectedRoomData.zone] }}>
                {selectedRoomData.zone}
              </span>
            </div>
          )}
        </div>

        {/* Right Panel - Rule Builder */}
        <div className="editor-panel editor-right-panel rule-builder-panel">
          <RuleBuilder
            zoneId={selectedZoneId}
            floor={floor}
            onExport={handleExport}
          />
        </div>
      </div>
    </div>
  );
}
