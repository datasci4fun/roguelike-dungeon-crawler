/**
 * BattleOverlay - Tactical battle mode overlay for v6.0.5
 *
 * Displays the battle arena, entities, and UI controls during tactical combat.
 */
import { type BattleState, type BattleEntity } from '../types';
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
  // Could be extended based on enemy type
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

export function BattleOverlay({ battle, onCommand }: BattleOverlayProps) {
  const { arena_tiles, arena_width, arena_height, player, enemies, round, phase, biome } = battle;

  // Calculate canvas size
  const canvasWidth = arena_width * TILE_SIZE;
  const canvasHeight = arena_height * TILE_SIZE;

  // Render tile
  const renderTile = (x: number, y: number) => {
    const tile = arena_tiles[y]?.[x] || ' ';
    const color = getTileColor(tile);

    return (
      <div
        key={`${x}-${y}`}
        className="arena-tile"
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

  return (
    <div className="battle-overlay">
      <div className="battle-header">
        <h2 className="battle-title">TACTICAL COMBAT</h2>
        <div className="battle-info">
          <span className="battle-round">Round {round}</span>
          <span className="battle-phase">{phase.replace('_', ' ')}</span>
          <span className="battle-biome">{biome}</span>
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

        {phase === 'PLAYER_TURN' && (
          <div className="battle-actions">
            <h3>Actions</h3>
            <button onClick={() => onCommand('ATTACK')}>Attack</button>
            <button onClick={() => onCommand('MOVE')}>Move</button>
            <button onClick={() => onCommand('WAIT')}>Wait</button>
            <button onClick={() => onCommand('FLEE')} className="flee-btn">Flee</button>
          </div>
        )}
      </div>
    </div>
  );
}
