/**
 * StatusHUD - Overlay indicators for Field Pulse, Artifacts, and Oathstone Vows
 */
import type { PlayerArtifact, VowType } from '../hooks/useGameSocket';
import './StatusHUD.css';

interface FieldPulse {
  active: boolean;
  amplification: number;
  floor_turn: number;
}

interface StatusHUDProps {
  fieldPulse?: FieldPulse;
  artifacts?: PlayerArtifact[];
}

// Vow display names
const VOW_NAMES: Record<VowType, string> = {
  VOW_ABSTINENCE: 'Abstinence',
  VOW_PROGRESS: 'Progress',
  VOW_CONFRONTATION: 'Confrontation',
};

// Vow descriptions
const VOW_DESCRIPTIONS: Record<VowType, string> = {
  VOW_ABSTINENCE: 'No potions this floor',
  VOW_PROGRESS: 'No revisiting rooms',
  VOW_CONFRONTATION: 'Defeat boss without fleeing',
};

// Pulse intensity labels
function getPulseIntensity(amplification: number): { label: string; className: string } {
  if (amplification >= 2.0) return { label: 'MAJOR', className: 'pulse-major' };
  if (amplification >= 1.5) return { label: 'MODERATE', className: 'pulse-moderate' };
  if (amplification >= 1.25) return { label: 'MINOR', className: 'pulse-minor' };
  return { label: '', className: '' };
}

export function StatusHUD({ fieldPulse, artifacts = [] }: StatusHUDProps) {
  const hasActiveIndicators = fieldPulse?.active || artifacts.length > 0;

  if (!hasActiveIndicators) {
    return null;
  }

  // Find oathstone with active vow
  const oathstone = artifacts.find(a => a.id === 'OATHSTONE' && a.active_vow);

  // Find duplicate seal (check if armed)
  const duplicateSeal = artifacts.find(a => a.id === 'DUPLICATE_SEAL');
  const sealArmed = duplicateSeal && !duplicateSeal.used && duplicateSeal.charges > 0;

  // Find woundglass shard
  const woundglass = artifacts.find(a => a.id === 'WOUNDGLASS_SHARD');

  return (
    <div className="status-hud">
      {/* Field Pulse Indicator */}
      {fieldPulse?.active && (
        <div className={`status-indicator field-pulse ${getPulseIntensity(fieldPulse.amplification).className}`}>
          <div className="indicator-icon pulse-icon">
            <span className="pulse-wave"></span>
          </div>
          <div className="indicator-content">
            <span className="indicator-label">Field Pulse</span>
            <span className="indicator-value">
              {getPulseIntensity(fieldPulse.amplification).label} ({fieldPulse.amplification.toFixed(2)}x)
            </span>
          </div>
        </div>
      )}

      {/* Oathstone Vow Indicator */}
      {oathstone?.active_vow && (
        <div className={`status-indicator vow-indicator ${oathstone.vow_broken ? 'vow-broken' : 'vow-active'}`}>
          <div className="indicator-icon vow-icon">
            {oathstone.vow_broken ? '!' : oathstone.symbol}
          </div>
          <div className="indicator-content">
            <span className="indicator-label">
              Vow of {VOW_NAMES[oathstone.active_vow]}
              {oathstone.vow_broken && ' (BROKEN)'}
            </span>
            <span className="indicator-value vow-description">
              {VOW_DESCRIPTIONS[oathstone.active_vow]}
            </span>
          </div>
        </div>
      )}

      {/* Duplicate Seal Indicator */}
      {duplicateSeal && (
        <div className={`status-indicator artifact-indicator ${sealArmed ? 'seal-armed' : 'seal-used'}`}>
          <div className="indicator-icon artifact-icon">
            {duplicateSeal.symbol}
          </div>
          <div className="indicator-content">
            <span className="indicator-label">Duplicate Seal</span>
            <span className="indicator-value">
              {sealArmed ? 'ARMED - Next consumable duplicated' : 'Used'}
            </span>
          </div>
        </div>
      )}

      {/* Woundglass Shard Indicator */}
      {woundglass && !woundglass.used && (
        <div className="status-indicator artifact-indicator woundglass">
          <div className="indicator-icon artifact-icon">
            {woundglass.symbol}
          </div>
          <div className="indicator-content">
            <span className="indicator-label">Woundglass Shard</span>
            <span className="indicator-value">
              {woundglass.charges > 0 ? `${woundglass.charges} charge` : 'Depleted'}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
