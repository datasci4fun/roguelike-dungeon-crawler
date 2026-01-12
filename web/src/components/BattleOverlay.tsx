/**
 * BattleOverlay - Tactical battle mode overlay for v6.0.5
 *
 * Displays the battle arena, entities, and UI controls during tactical combat.
 * Includes reinforcement tracking, keyboard controls, and artifact status.
 */
import { useEffect, useCallback } from 'react';
import { type BattleState, type BattleEntity, type BattleReinforcement } from '../types';
import './BattleOverlay.css';

interface BattleOverlayProps {
  battle: BattleState;
  onCommand: (command: string) => void;
}

// Tile rendering configuration
const TILE_SIZE = 32;

const TILE_COLORS: Record<string, string> = {
  '.': '#2a2a3a', // Floor
  '#': '#444455', // Wall
  '~': '#ff6633', // Lava
  '=': '#aaddff', // Ice
  '\u2248': '#3366aa', // Deep water (approx symbol)
  '!': '#88ff88', // Poison gas
  '+': '#8b4513', // Door
  ' ': '#1a1a2a', // Empty/void
};

function getTileColor(tile: string): string {
  return TILE_COLORS[tile] || TILE_COLORS['.'];
}

function getEntitySymbol(entity: BattleEntity): string {
  if (entity.is_player) return '@';
  return 'E';
}

function getEntityColor(entity: BattleEntity): string {
  if (entity.is_player) return '#ffff00';
  return '#ff4444';
}

function HealthBar({ current, max }: { current: number; max: number }) {
  const percentage = Math.max(0, Math.min(100, (current / max) * 100));
  const color = percentage > 60 ? '#44ff44' : percentage > 30 ? '#ffff44' : '#ff4444';

  return (
    <div className="health-bar">
      <div
        className="health-bar-fill"
        style={{ width: `${percentage}%`, backgroundColor: color }}
      />
      <span className="health-bar-text">{current}/{max}</span>
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

export function BattleOverlay({ battle, onCommand }: BattleOverlayProps) {
  const {
    arena_tiles, arena_width, arena_height, player, enemies,
    reinforcements = [], round, phase, biome,
    duplicate_seal_armed, woundglass_reveal_active, safe_tiles_revealed = []
  } = battle;

  // Keyboard controls
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
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
  }, [phase, onCommand]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // Calculate canvas size
  const canvasWidth = arena_width * TILE_SIZE;
  const canvasHeight = arena_height * TILE_SIZE;

  // Check if tile is safe (revealed by woundglass/archivist)
  const isSafeTile = (x: number, y: number) => {
    return safe_tiles_revealed.some(([sx, sy]) => sx === x && sy === y);
  };

  // Render tile
  const renderTile = (x: number, y: number) => {
    const tile = arena_tiles[y]?.[x] || ' ';
    let color = getTileColor(tile);
    const isSafe = isSafeTile(x, y);

    return (
      <div
        key={`${x}-${y}`}
        className={`arena-tile ${isSafe ? 'safe-tile' : ''}`}
        style={{
          left: x * TILE_SIZE,
          top: y * TILE_SIZE,
          width: TILE_SIZE,
          height: TILE_SIZE,
          backgroundColor: color,
        }}
      />
    );
  };

  // Render entity
  const renderEntity = (entity: BattleEntity) => {
    const symbol = getEntitySymbol(entity);
    const color = getEntityColor(entity);

    return (
      <div
        key={entity.entity_id}
        className="arena-entity"
        style={{
          left: entity.arena_x * TILE_SIZE,
          top: entity.arena_y * TILE_SIZE,
          width: TILE_SIZE,
          height: TILE_SIZE,
          color,
        }}
      >
        <span className="entity-symbol">{symbol}</span>
        {entity.hp < entity.max_hp && (
          <div className="entity-hp-pip" style={{
            width: `${(entity.hp / entity.max_hp) * 100}%`,
            backgroundColor: entity.is_player ? '#44ff44' : '#ff4444',
          }} />
        )}
      </div>
    );
  };

  // Build tiles grid
  const tiles = [];
  for (let y = 0; y < arena_height; y++) {
    for (let x = 0; x < arena_width; x++) {
      tiles.push(renderTile(x, y));
    }
  }

  // All entities
  const allEntities = [player, ...enemies.filter(e => e.hp > 0)];

  // Group reinforcements for display
  const reinforcementGroups = groupReinforcements(reinforcements);

  return (
    <div className="battle-overlay">
      <div className="battle-header">
        <h2 className="battle-title">TACTICAL COMBAT</h2>
        <div className="battle-info">
          <span className="battle-round">Round {round}</span>
          <span className="battle-phase">{phase.replace('_', ' ')}</span>
          <span className="battle-biome">{biome}</span>
        </div>
        {/* Artifact status indicators */}
        <div className="battle-artifacts">
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

      <div className="battle-arena-container">
        <div
          className="battle-arena"
          style={{ width: canvasWidth, height: canvasHeight }}
        >
          {tiles}
          {allEntities.map(renderEntity)}
        </div>
      </div>

      <div className="battle-sidebar">
        <div className="player-status">
          <h3>Player</h3>
          <HealthBar current={player.hp} max={player.max_hp} />
          <div className="stat-row">
            <span>ATK: {player.attack}</span>
            <span>DEF: {player.defense}</span>
          </div>
          {player.status_effects.length > 0 && (
            <div className="status-effects">
              {player.status_effects.map((effect, i) => (
                <span key={i} className="status-effect">{effect}</span>
              ))}
            </div>
          )}
        </div>

        <div className="enemies-status">
          <h3>Enemies ({enemies.filter(e => e.hp > 0).length})</h3>
          {enemies.filter(e => e.hp > 0).map((enemy, i) => (
            <div key={enemy.entity_id} className="enemy-status">
              <span className="enemy-name">Enemy {i + 1}</span>
              <HealthBar current={enemy.hp} max={enemy.max_hp} />
            </div>
          ))}
        </div>

        {/* Reinforcements panel */}
        {reinforcementGroups.length > 0 && (
          <div className="reinforcements-status">
            <h3>Incoming ({reinforcements.length})</h3>
            {reinforcementGroups.map((group, i) => (
              <div key={i} className={`reinforcement-row ${group.isElite ? 'elite' : ''}`}>
                <span className="reinforcement-name">
                  {group.name} {group.count > 1 ? `x${group.count}` : ''}
                  {group.isElite && <span className="elite-marker">*</span>}
                </span>
                <span className="reinforcement-turns">{group.turns} turns</span>
              </div>
            ))}
          </div>
        )}

        {phase === 'PLAYER_TURN' && (
          <div className="battle-actions">
            <h3>Actions</h3>
            <div className="action-hint">WASD to move, 1-4 for abilities</div>
            <button onClick={() => onCommand('ATTACK')}>Attack (1)</button>
            <button onClick={() => onCommand('ABILITY_2')}>Special (2)</button>
            <button onClick={() => onCommand('WAIT')}>Wait (Space)</button>
            <button onClick={() => onCommand('FLEE')} className="flee-btn">Flee (Esc)</button>
          </div>
        )}
      </div>
    </div>
  );
}
