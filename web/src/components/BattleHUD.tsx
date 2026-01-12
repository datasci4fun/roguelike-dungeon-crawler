/**
 * BattleHUD - Tactical battle HUD overlay for v6.3
 *
 * Displays battle UI controls without the arena grid (now handled by BattleRenderer3D).
 * Includes phase/round info, HP summaries, ability buttons, reinforcement countdown.
 */
import { useEffect, useCallback, useState } from 'react';
import { type BattleState, type BattleReinforcement } from '../types';
import './BattleHUD.css';

interface BattleHUDProps {
  battle: BattleState;
  onCommand: (command: string) => void;
  overviewComplete: boolean;
}

function HealthBar({ current, max, label }: { current: number; max: number; label?: string }) {
  const percentage = Math.max(0, Math.min(100, (current / max) * 100));
  const color = percentage > 60 ? '#44ff44' : percentage > 30 ? '#ffff44' : '#ff4444';

  return (
    <div className="hud-health-bar">
      {label && <span className="health-label">{label}</span>}
      <div className="health-bar-track">
        <div
          className="health-bar-fill"
          style={{ width: `${percentage}%`, backgroundColor: color }}
        />
        <span className="health-bar-text">{current}/{max}</span>
      </div>
    </div>
  );
}

// Group reinforcements by type and turns
function groupReinforcements(reinforcements: BattleReinforcement[]) {
  const groups: Record<string, { count: number; turns: number; isElite: boolean }> = {};

  for (const r of reinforcements) {
    const key = `${r.enemy_name}-${r.turns_until_arrival}`;
    if (!groups[key]) {
      groups[key] = { count: 0, turns: r.turns_until_arrival, isElite: r.is_elite };
    }
    groups[key].count++;
  }

  return Object.entries(groups)
    .map(([key, data]) => ({
      name: key.split('-')[0],
      ...data,
    }))
    .sort((a, b) => a.turns - b.turns);
}

export function BattleHUD({ battle, onCommand, overviewComplete }: BattleHUDProps) {
  const {
    player, enemies,
    reinforcements = [], round, phase, biome,
    duplicate_seal_armed, woundglass_reveal_active
  } = battle;

  // Keyboard controls (only active after overview is done)
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!overviewComplete) return;
    if (phase !== 'PLAYER_TURN') return;

    switch (e.key.toLowerCase()) {
      case 'w':
      case 'arrowup':
        onCommand('MOVE_UP');
        break;
      case 's':
      case 'arrowdown':
        onCommand('MOVE_DOWN');
        break;
      case 'a':
      case 'arrowleft':
        onCommand('MOVE_LEFT');
        break;
      case 'd':
      case 'arrowright':
        onCommand('MOVE_RIGHT');
        break;
      case '1':
        onCommand('ABILITY_1');
        break;
      case '2':
        onCommand('ABILITY_2');
        break;
      case '3':
        onCommand('ABILITY_3');
        break;
      case '4':
        onCommand('ABILITY_4');
        break;
      case ' ':
      case 'enter':
        onCommand('WAIT');
        break;
      case 'escape':
        onCommand('FLEE');
        break;
    }
  }, [phase, onCommand, overviewComplete]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // Group reinforcements for display
  const reinforcementGroups = groupReinforcements(reinforcements);
  const livingEnemies = enemies.filter(e => e.hp > 0);

  return (
    <div className="battle-hud">
      {/* Top bar - phase info */}
      <div className="hud-top-bar">
        <div className="hud-phase-info">
          <span className="hud-biome">{biome}</span>
          <span className="hud-round">Round {round}</span>
          <span className="hud-phase">{phase.replace('_', ' ')}</span>
        </div>
        {/* Artifact status indicators */}
        <div className="hud-artifacts">
          {duplicate_seal_armed && (
            <span className="artifact-indicator seal-armed" title="Duplicate Seal Armed">
              &amp;
            </span>
          )}
          {woundglass_reveal_active && (
            <span className="artifact-indicator woundglass-active" title="Woundglass Active">
              %
            </span>
          )}
        </div>
      </div>

      {/* Left panel - Player status */}
      <div className="hud-left-panel">
        <div className="hud-player-status">
          <span className="hud-section-title">PLAYER</span>
          <HealthBar current={player.hp} max={player.max_hp} />
          <div className="hud-stats">
            <span>ATK {player.attack}</span>
            <span>DEF {player.defense}</span>
          </div>
          {player.status_effects && player.status_effects.length > 0 && (
            <div className="hud-status-effects">
              {player.status_effects.map((effect, i) => (
                <span key={i} className="status-effect-badge">{effect}</span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Right panel - Enemies + Reinforcements */}
      <div className="hud-right-panel">
        <div className="hud-enemies-status">
          <span className="hud-section-title">ENEMIES ({livingEnemies.length})</span>
          {livingEnemies.slice(0, 4).map((enemy, i) => (
            <HealthBar
              key={enemy.entity_id}
              current={enemy.hp}
              max={enemy.max_hp}
              label={`E${i + 1}`}
            />
          ))}
          {livingEnemies.length > 4 && (
            <span className="hud-more">+{livingEnemies.length - 4} more</span>
          )}
        </div>

        {/* Reinforcements countdown */}
        {reinforcementGroups.length > 0 && (
          <div className="hud-reinforcements">
            <span className="hud-section-title warning">INCOMING</span>
            {reinforcementGroups.slice(0, 3).map((group, i) => (
              <div key={i} className={`reinforcement-entry ${group.isElite ? 'elite' : ''}`}>
                <span className="reinforcement-name">
                  {group.name} {group.count > 1 && `x${group.count}`}
                  {group.isElite && <span className="elite-star">*</span>}
                </span>
                <span className="reinforcement-timer">{group.turns}T</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Bottom bar - Actions */}
      {phase === 'PLAYER_TURN' && overviewComplete && (
        <div className="hud-bottom-bar">
          <div className="hud-actions">
            <button className="hud-action-btn" onClick={() => onCommand('ATTACK')}>
              <span className="key">1</span> Attack
            </button>
            <button className="hud-action-btn" onClick={() => onCommand('ABILITY_2')}>
              <span className="key">2</span> Special
            </button>
            <button className="hud-action-btn" onClick={() => onCommand('WAIT')}>
              <span className="key">SPC</span> Wait
            </button>
            <button className="hud-action-btn flee" onClick={() => onCommand('FLEE')}>
              <span className="key">ESC</span> Flee
            </button>
          </div>
          <div className="hud-move-hint">WASD to move</div>
        </div>
      )}

      {/* Waiting indicator */}
      {phase !== 'PLAYER_TURN' && (
        <div className="hud-waiting">
          <span className="waiting-text">Enemy Turn...</span>
        </div>
      )}
    </div>
  );
}

export default BattleHUD;
