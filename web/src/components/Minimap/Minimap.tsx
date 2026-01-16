/**
 * Minimap - Stylized minimap in bottom-right showing explored areas,
 * player position, enemies, items, and dungeon features
 */
import { useMemo } from 'react';
import './Minimap.css';

interface FacingDirection {
  dx: number;
  dy: number;
}

interface MinimapProps {
  tiles: string[][];
  playerFacing: FacingDirection;
  dungeonLevel: number;
  isCollapsed?: boolean;
  onToggle?: () => void;
}

// Tile type detection and styling
interface TileStyle {
  className: string;
  color: string;
  symbol?: string;
}

function getTileStyle(char: string): TileStyle {
  switch (char) {
    // Walls
    case '#':
      return { className: 'tile-wall', color: '#374151' };

    // Floor
    case '.':
      return { className: 'tile-floor', color: '#4b5563' };

    // Player
    case '@':
      return { className: 'tile-player', color: '#fbbf24', symbol: '@' };

    // Stairs down
    case '>':
      return { className: 'tile-stairs-down', color: '#3b82f6', symbol: '>' };

    // Stairs up
    case '<':
      return { className: 'tile-stairs-up', color: '#60a5fa', symbol: '<' };

    // Doors
    case '+':
    case '/':
      return { className: 'tile-door', color: '#92400e', symbol: '+' };

    // Items (various symbols used for items)
    case '!':  // Potions
      return { className: 'tile-item', color: '#f472b6', symbol: '!' };
    case '?':  // Scrolls
      return { className: 'tile-item', color: '#c4b5fd', symbol: '?' };
    case ')':  // Weapons
      return { className: 'tile-item', color: '#fbbf24', symbol: ')' };
    case '[':  // Armor
      return { className: 'tile-item', color: '#6ee7b7', symbol: '[' };
    case '=':  // Rings
      return { className: 'tile-item', color: '#fcd34d', symbol: '=' };
    case '"':  // Amulets
      return { className: 'tile-item', color: '#f9a8d4', symbol: '"' };
    case '$':  // Gold
      return { className: 'tile-gold', color: '#fcd34d', symbol: '$' };
    case '*':  // Artifacts/special items
      return { className: 'tile-artifact', color: '#a78bfa', symbol: '*' };

    // Traps
    case '^':
      return { className: 'tile-trap', color: '#f87171', symbol: '^' };

    // Secrets/hidden
    case '%':
      return { className: 'tile-secret', color: '#818cf8', symbol: '%' };

    // Torches
    case '&':
      return { className: 'tile-torch', color: '#fb923c', symbol: '&' };

    // Fog/unexplored
    case ' ':
    case '~':
      return { className: 'tile-fog', color: '#1f2937' };

    // Default - likely enemies (letters like 'G', 'O', 'S', etc.)
    default:
      // Check if it's a letter (enemy)
      if (/[A-Za-z]/.test(char)) {
        return { className: 'tile-enemy', color: '#ef4444', symbol: char };
      }
      // Unknown tile
      return { className: 'tile-unknown', color: '#374151' };
  }
}

// Get facing direction arrow
function getFacingArrow(facing: FacingDirection): string {
  const { dx, dy } = facing;
  if (dy < 0) return '▲'; // North
  if (dy > 0) return '▼'; // South
  if (dx > 0) return '▶'; // East
  if (dx < 0) return '◀'; // West
  return '●'; // No direction
}

// Get compass direction name
function getCompassDirection(facing: FacingDirection): string {
  const { dx, dy } = facing;
  if (dy < 0) return 'N';
  if (dy > 0) return 'S';
  if (dx > 0) return 'E';
  if (dx < 0) return 'W';
  return '';
}

export function Minimap({
  tiles,
  playerFacing,
  dungeonLevel,
  isCollapsed = false,
  onToggle,
}: MinimapProps) {
  // Find player position in grid (should be center at 5,5 for 11x11)
  const playerPos = useMemo(() => {
    for (let y = 0; y < tiles.length; y++) {
      for (let x = 0; x < (tiles[y]?.length || 0); x++) {
        if (tiles[y][x] === '@') {
          return { x, y };
        }
      }
    }
    // Default to center
    return { x: 5, y: 5 };
  }, [tiles]);

  if (isCollapsed) {
    return (
      <div className="minimap collapsed" onClick={onToggle}>
        <div className="minimap-collapsed-indicator">
          <span className="minimap-icon">🗺</span>
          <span className="minimap-level">F{dungeonLevel}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="minimap" role="region" aria-label={`Minimap - Floor ${dungeonLevel}`}>
      {/* Header with level and compass */}
      <div className="minimap-header">
        <span className="minimap-level-label">Floor {dungeonLevel}</span>
        <div className="minimap-compass">
          <span className="compass-direction">{getCompassDirection(playerFacing)}</span>
          <span className="compass-arrow">{getFacingArrow(playerFacing)}</span>
        </div>
        {onToggle && (
          <button
            className="minimap-collapse-btn"
            onClick={onToggle}
            aria-label="Collapse minimap"
          >
            −
          </button>
        )}
      </div>

      {/* Tile Grid */}
      <div className="minimap-grid" role="img" aria-label="Dungeon map">
        {tiles.map((row, y) => (
          <div key={y} className="minimap-row">
            {row.map((char, x) => {
              const style = getTileStyle(char);
              const isPlayer = x === playerPos.x && y === playerPos.y;

              return (
                <div
                  key={`${x}-${y}`}
                  className={`minimap-tile ${style.className} ${isPlayer ? 'is-player' : ''}`}
                  style={{ backgroundColor: style.color }}
                  title={style.symbol || char}
                >
                  {style.symbol && (
                    <span className="tile-symbol">{style.symbol}</span>
                  )}
                  {isPlayer && (
                    <span className="player-facing">{getFacingArrow(playerFacing)}</span>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {/* Legend (minimal) */}
      <div className="minimap-legend">
        <span className="legend-item"><span className="legend-dot enemy"></span>Enemy</span>
        <span className="legend-item"><span className="legend-dot item"></span>Item</span>
        <span className="legend-item"><span className="legend-dot stairs"></span>Stairs</span>
      </div>
    </div>
  );
}
