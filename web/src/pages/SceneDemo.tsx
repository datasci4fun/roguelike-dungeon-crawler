/**
 * SceneDemo Page
 *
 * Demo page with mock data to test the SceneRenderer without backend.
 */

import { useState, useCallback } from 'react';
import { SceneRenderer, gameStateToSceneFrame } from '../components/SceneRenderer';
import type { FullGameState } from '../hooks/useGameSocket';
import './PlayScene.css';

// Mock dungeon tiles (20x15)
const MOCK_TILES: string[][] = [];
for (let y = 0; y < 15; y++) {
  const row: string[] = [];
  for (let x = 0; x < 20; x++) {
    if (y === 0 || y === 14 || x === 0 || x === 19) {
      row.push('#'); // Wall border
    } else if (y === 7 && x > 5 && x < 15) {
      row.push('#'); // Internal wall
    } else if (y === 7 && x === 10) {
      row.push('+'); // Door
    } else if (y === 12 && x === 15) {
      row.push('>'); // Stairs down
    } else if (y === 2 && x === 3) {
      row.push('<'); // Stairs up
    } else {
      row.push('.'); // Floor
    }
  }
  MOCK_TILES.push(row);
}

// Create mock game state
function createMockGameState(playerX: number, playerY: number): FullGameState {
  return {
    type: 'game_state',
    session_id: 'demo-session',
    game_state: 'PLAYING',
    ui_mode: 'GAME',
    turn: 42,
    player: {
      x: playerX,
      y: playerY,
      health: 75,
      max_health: 100,
      attack: 12,
      defense: 5,
      level: 3,
      xp: 150,
      xp_to_level: 300,
      kills: 7,
    },
    dungeon: {
      level: 2,
      width: 20,
      height: 15,
      tiles: MOCK_TILES,
    },
    enemies: [
      { x: 5, y: 3, name: 'Goblin', health: 10, max_health: 15, is_elite: false, symbol: 'g' },
      { x: 15, y: 5, name: 'Orc', health: 25, max_health: 30, is_elite: false, symbol: 'O' },
      { x: 10, y: 10, name: 'Troll', health: 50, max_health: 50, is_elite: true, symbol: 'T' },
    ],
    items: [
      { x: 3, y: 5, name: 'Health Potion', symbol: '!' },
      { x: 12, y: 3, name: 'Gold', symbol: '$' },
      { x: 8, y: 11, name: 'Sword', symbol: '/' },
    ],
    messages: [
      'Welcome to the dungeon!',
      'You see a goblin nearby.',
      'There is a potion on the ground.',
    ],
  };
}

export function SceneDemo() {
  const [playerPos, setPlayerPos] = useState({ x: 10, y: 5 });
  const [showGrid, setShowGrid] = useState(false);
  const [showDebug, setShowDebug] = useState(true);
  const [enableAnimations, setEnableAnimations] = useState(true);

  // Create mock game state with current player position
  const mockGameState = createMockGameState(playerPos.x, playerPos.y);
  const sceneFrame = gameStateToSceneFrame(mockGameState, 20, 15, 32);

  // Handle keyboard movement
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    const moves: Record<string, { dx: number; dy: number }> = {
      ArrowUp: { dx: 0, dy: -1 },
      ArrowDown: { dx: 0, dy: 1 },
      ArrowLeft: { dx: -1, dy: 0 },
      ArrowRight: { dx: 1, dy: 0 },
      w: { dx: 0, dy: -1 },
      s: { dx: 0, dy: 1 },
      a: { dx: -1, dy: 0 },
      d: { dx: 1, dy: 0 },
    };

    const move = moves[e.key];
    if (move) {
      e.preventDefault();
      setPlayerPos((pos) => {
        const newX = pos.x + move.dx;
        const newY = pos.y + move.dy;
        // Check bounds and walls
        if (
          newX >= 1 &&
          newX < 19 &&
          newY >= 1 &&
          newY < 14 &&
          MOCK_TILES[newY][newX] !== '#'
        ) {
          return { x: newX, y: newY };
        }
        return pos;
      });
    }
  }, []);

  return (
    <div className="play-scene" tabIndex={0} onKeyDown={handleKeyDown}>
      <div className="play-scene__header">
        <h1>Scene Renderer Demo (Mock Data)</h1>
        <div className="play-scene__controls">
          <label>
            <input
              type="checkbox"
              checked={showDebug}
              onChange={(e) => setShowDebug(e.target.checked)}
            />
            Debug Info
          </label>
          <label>
            <input
              type="checkbox"
              checked={showGrid}
              onChange={(e) => setShowGrid(e.target.checked)}
            />
            Show Grid
          </label>
          <label>
            <input
              type="checkbox"
              checked={enableAnimations}
              onChange={(e) => setEnableAnimations(e.target.checked)}
            />
            Animations
          </label>
        </div>
      </div>

      <div className="play-scene__content">
        <div className="play-scene__renderer" style={{ outline: 'none' }}>
          <SceneRenderer
            frame={sceneFrame}
            showGrid={showGrid}
            showCoords={showDebug}
            enableAnimations={enableAnimations}
            className="play-scene__canvas"
          />
        </div>

        {/* HUD overlay */}
        <div className="play-scene__hud">
          <div className="hud-section hud-player">
            <div className="hud-title">Player</div>
            <div className="hud-stat">HP: 75/100</div>
            <div className="hud-stat">Level: 3</div>
            <div className="hud-stat">ATK: 12</div>
            <div className="hud-stat">DEF: 5</div>
          </div>

          <div className="hud-section hud-dungeon">
            <div className="hud-title">Dungeon</div>
            <div className="hud-stat">Floor: 2</div>
            <div className="hud-stat">Turn: 42</div>
          </div>

          <div className="hud-section hud-legend">
            <div className="hud-title">Legend</div>
            <div className="hud-stat" style={{ color: '#00FF00' }}>Green Circle = Player</div>
            <div className="hud-stat" style={{ color: '#FF0000' }}>Red Triangle = Enemy</div>
            <div className="hud-stat" style={{ color: '#FF00FF' }}>Pink Diamond = Elite</div>
            <div className="hud-stat" style={{ color: '#FFFF00' }}>Yellow Square = Item</div>
          </div>
        </div>

        {/* Messages panel */}
        <div className="play-scene__messages">
          <div className="message">Welcome to the dungeon!</div>
          <div className="message">You see a goblin nearby.</div>
          <div className="message">There is a potion on the ground.</div>
          <div className="message" style={{ color: '#4a9eff' }}>Use WASD or Arrow keys to move</div>
        </div>
      </div>

      <div className="play-scene__footer">
        <div className="controls-hint">
          <span>Move: WASD / Arrow Keys</span>
          <span>Click canvas first to focus</span>
        </div>
      </div>
    </div>
  );
}
