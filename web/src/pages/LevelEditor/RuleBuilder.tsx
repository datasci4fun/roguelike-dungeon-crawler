/**
 * RuleBuilder - Visual interface for creating placement rules
 *
 * Allows users to design asset placement rules that get applied
 * during procedural dungeon generation.
 */

import { useState, useCallback } from 'react';
import type {
  PlacementRule,
  ZoneLayoutConfig,
  PositionStrategy,
  CountSpec,
  RotationOption,
} from './placementRules';
import {
  createRule,
  applyPreset,
  generatePythonCode,
  PRESET_RULES,
} from './placementRules';
import { MODEL_LIBRARY } from '../../models';
import { CodeModal } from './CodeModal';

interface RuleBuilderProps {
  zoneId: string;
  floor: number;
  onExport: (code: string) => void;
}

const POSITION_OPTIONS: { value: PositionStrategy; label: string; description: string }[] = [
  { value: 'center', label: 'Center', description: 'Place at room center' },
  { value: 'corners', label: 'Corners', description: 'Place in all 4 corners' },
  { value: 'along_north_wall', label: 'North Wall', description: 'Along the north wall' },
  { value: 'along_south_wall', label: 'South Wall', description: 'Along the south wall' },
  { value: 'along_east_wall', label: 'East Wall', description: 'Along the east wall' },
  { value: 'along_west_wall', label: 'West Wall', description: 'Along the west wall' },
  { value: 'along_any_wall', label: 'Any Wall', description: 'Along any wall' },
  { value: 'at_entrances', label: 'Entrances', description: 'At room doorways' },
  { value: 'random_floor', label: 'Random', description: 'Random floor positions' },
  { value: 'perimeter', label: 'Perimeter', description: 'Around room edge' },
];

const COUNT_TYPE_OPTIONS = [
  { value: 'fixed', label: 'Exactly N' },
  { value: 'range', label: 'Range (min-max)' },
  { value: 'density', label: 'Density (1 per N tiles)' },
  { value: 'all', label: 'All positions' },
];

const ROTATION_OPTIONS: { value: RotationOption; label: string }[] = [
  { value: 'fixed', label: 'Fixed angle' },
  { value: 'face_center', label: 'Face room center' },
  { value: 'face_wall', label: 'Face nearest wall' },
  { value: 'random', label: 'Random' },
];

export function RuleBuilder({ zoneId, floor, onExport }: RuleBuilderProps) {
  const [rules, setRules] = useState<PlacementRule[]>([]);
  const [description, setDescription] = useState(`Layout for ${zoneId} zone`);
  const [selectedRuleId, setSelectedRuleId] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);

  const selectedRule = rules.find((r) => r.id === selectedRuleId);

  // Generate the Python code
  const generatedCode = generatePythonCode({
    zoneId,
    floor,
    displayName: zoneId.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
    description,
    rules,
  });

  // Add a new rule
  const handleAddRule = useCallback((assetId: string, assetName: string) => {
    const newRule = createRule(assetId, assetName);
    setRules((prev) => [...prev, newRule]);
    setSelectedRuleId(newRule.id);
  }, []);

  // Update a rule
  const updateRule = useCallback((ruleId: string, updates: Partial<PlacementRule>) => {
    setRules((prev) =>
      prev.map((r) => (r.id === ruleId ? { ...r, ...updates } : r))
    );
  }, []);

  // Delete a rule
  const deleteRule = useCallback((ruleId: string) => {
    setRules((prev) => prev.filter((r) => r.id !== ruleId));
    if (selectedRuleId === ruleId) {
      setSelectedRuleId(null);
    }
  }, [selectedRuleId]);

  // Apply preset to selected rule
  const handleApplyPreset = useCallback((presetKey: string) => {
    if (!selectedRule) return;
    const updated = applyPreset(selectedRule, presetKey);
    updateRule(selectedRule.id, updated);
  }, [selectedRule, updateRule]);

  // Copy code to clipboard
  const handleCopyCode = useCallback(() => {
    navigator.clipboard.writeText(generatedCode);
    onExport(generatedCode);
  }, [generatedCode, onExport]);

  return (
    <div className="rule-builder">
      <div className="rule-builder-header">
        <h3>Placement Rules</h3>
        <div className="zone-info">
          <span>Zone: <strong>{zoneId}</strong></span>
          <span>Floor: <strong>{floor}</strong></span>
        </div>
      </div>

      <div className="rule-builder-description">
        <label>
          Description:
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe this layout..."
          />
        </label>
      </div>

      <div className="rule-builder-content">
        {/* Left: Asset Library */}
        <div className="asset-library">
          <h4>Asset Library</h4>
          <p className="help-text">Click to add placement rule</p>
          <div className="asset-list">
            {MODEL_LIBRARY.map((model) => (
              <button
                key={model.id}
                className="asset-item"
                onClick={() => handleAddRule(model.id, model.name)}
                title={model.description}
              >
                <span className="asset-name">{model.name}</span>
                <span className="asset-category">{model.category}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Center: Rules List */}
        <div className="rules-list">
          <h4>Rules ({rules.length})</h4>
          {rules.length === 0 ? (
            <p className="empty-state">No rules yet. Click an asset to add a rule.</p>
          ) : (
            <div className="rules-items">
              {rules.map((rule, index) => (
                <div
                  key={rule.id}
                  className={`rule-item ${selectedRuleId === rule.id ? 'selected' : ''}`}
                  onClick={() => setSelectedRuleId(rule.id)}
                >
                  <span className="rule-index">{index + 1}</span>
                  <div className="rule-summary">
                    <span className="rule-asset">{rule.assetName}</span>
                    <span className="rule-position">{rule.position}</span>
                    <span className="rule-count">
                      {rule.count.type === 'fixed' && `${rule.count.fixed}x`}
                      {rule.count.type === 'range' && `${rule.count.min}-${rule.count.max}`}
                      {rule.count.type === 'density' && `1/${rule.count.perTiles} tiles`}
                      {rule.count.type === 'all' && 'all'}
                    </span>
                  </div>
                  <button
                    className="rule-delete"
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteRule(rule.id);
                    }}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right: Rule Editor */}
        <div className="rule-editor">
          {selectedRule ? (
            <>
              <h4>Edit Rule: {selectedRule.assetName}</h4>

              {/* Presets */}
              <div className="editor-section">
                <label>Apply Preset:</label>
                <div className="preset-buttons">
                  {Object.keys(PRESET_RULES).map((key) => (
                    <button
                      key={key}
                      className="preset-btn"
                      onClick={() => handleApplyPreset(key)}
                    >
                      {key.replace(/_/g, ' ')}
                    </button>
                  ))}
                </div>
              </div>

              {/* Position */}
              <div className="editor-section">
                <label>Position Strategy:</label>
                <select
                  value={selectedRule.position}
                  onChange={(e) =>
                    updateRule(selectedRule.id, {
                      position: e.target.value as PositionStrategy,
                    })
                  }
                >
                  {POSITION_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label} - {opt.description}
                    </option>
                  ))}
                </select>
              </div>

              {/* Count */}
              <div className="editor-section">
                <label>Count:</label>
                <select
                  value={selectedRule.count.type}
                  onChange={(e) =>
                    updateRule(selectedRule.id, {
                      count: { ...selectedRule.count, type: e.target.value as CountSpec['type'] },
                    })
                  }
                >
                  {COUNT_TYPE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>

                {selectedRule.count.type === 'fixed' && (
                  <input
                    type="number"
                    min={1}
                    max={20}
                    value={selectedRule.count.fixed || 1}
                    onChange={(e) =>
                      updateRule(selectedRule.id, {
                        count: { ...selectedRule.count, fixed: parseInt(e.target.value) },
                      })
                    }
                  />
                )}

                {selectedRule.count.type === 'range' && (
                  <div className="range-inputs">
                    <input
                      type="number"
                      min={0}
                      max={20}
                      value={selectedRule.count.min || 1}
                      onChange={(e) =>
                        updateRule(selectedRule.id, {
                          count: { ...selectedRule.count, min: parseInt(e.target.value) },
                        })
                      }
                    />
                    <span>to</span>
                    <input
                      type="number"
                      min={1}
                      max={20}
                      value={selectedRule.count.max || 3}
                      onChange={(e) =>
                        updateRule(selectedRule.id, {
                          count: { ...selectedRule.count, max: parseInt(e.target.value) },
                        })
                      }
                    />
                  </div>
                )}

                {selectedRule.count.type === 'density' && (
                  <div className="density-input">
                    <span>1 per</span>
                    <input
                      type="number"
                      min={1}
                      max={50}
                      value={selectedRule.count.perTiles || 10}
                      onChange={(e) =>
                        updateRule(selectedRule.id, {
                          count: { ...selectedRule.count, perTiles: parseInt(e.target.value) },
                        })
                      }
                    />
                    <span>tiles</span>
                  </div>
                )}
              </div>

              {/* Rotation */}
              <div className="editor-section">
                <label>Rotation:</label>
                <select
                  value={selectedRule.rotation}
                  onChange={(e) =>
                    updateRule(selectedRule.id, {
                      rotation: e.target.value as RotationOption,
                    })
                  }
                >
                  {ROTATION_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>

                {selectedRule.rotation === 'fixed' && (
                  <select
                    value={selectedRule.rotationValue || 0}
                    onChange={(e) =>
                      updateRule(selectedRule.id, {
                        rotationValue: parseInt(e.target.value),
                      })
                    }
                  >
                    <option value={0}>0°</option>
                    <option value={90}>90°</option>
                    <option value={180}>180°</option>
                    <option value={270}>270°</option>
                  </select>
                )}
              </div>

              {/* Scale */}
              <div className="editor-section">
                <label>Scale: {selectedRule.scale.toFixed(1)}</label>
                <input
                  type="range"
                  min={0.5}
                  max={2}
                  step={0.1}
                  value={selectedRule.scale}
                  onChange={(e) =>
                    updateRule(selectedRule.id, {
                      scale: parseFloat(e.target.value),
                    })
                  }
                />
              </div>

              {/* Spacing */}
              <div className="editor-section">
                <label>Min Spacing: {selectedRule.spacing || 0} tiles</label>
                <input
                  type="range"
                  min={0}
                  max={5}
                  step={1}
                  value={selectedRule.spacing || 0}
                  onChange={(e) =>
                    updateRule(selectedRule.id, {
                      spacing: parseInt(e.target.value),
                    })
                  }
                />
              </div>

              {/* Options */}
              <div className="editor-section">
                <label>
                  <input
                    type="checkbox"
                    checked={selectedRule.avoidEntrances || false}
                    onChange={(e) =>
                      updateRule(selectedRule.id, {
                        avoidEntrances: e.target.checked,
                      })
                    }
                  />
                  Avoid entrances
                </label>
              </div>
            </>
          ) : (
            <div className="no-selection">
              <p>Select a rule to edit</p>
            </div>
          )}
        </div>
      </div>

      {/* Footer Actions */}
      <div className="rule-builder-footer">
        <button
          onClick={() => setShowModal(true)}
          className="preview-btn"
          disabled={rules.length === 0}
        >
          View Python Code
        </button>
        <button
          onClick={handleCopyCode}
          className="export-btn"
          disabled={rules.length === 0}
        >
          Copy to Clipboard
        </button>
      </div>

      {/* Code Modal */}
      {showModal && (
        <CodeModal
          code={generatedCode}
          onClose={() => setShowModal(false)}
          onCopy={handleCopyCode}
        />
      )}
    </div>
  );
}
