/**
 * PlayScene Page
 *
 * Experimental canvas-based scene renderer for the roguelike game.
 * Uses the same game WebSocket as the terminal-based Play page.
 */

import { useEffect, useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useGameSocket } from '../hooks/useGameSocket';
import { SceneRenderer, useSceneFrame } from '../components/SceneRenderer';
import './PlayScene.css';

// Viewport configuration
const VIEWPORT_WIDTH = 20;
const VIEWPORT_HEIGHT = 15;
const TILE_SIZE = 32;

export function PlayScene() {
  const { isAuthenticated, isLoading, token } = useAuth();
  const navigate = useNavigate();
  const [showDebug, setShowDebug] = useState(false);
  const [showGrid, setShowGrid] = useState(false);

  // Game WebSocket
  const {
    status: gameStatus,
    gameState,
    error: gameError,
    connect: connectGame,
    disconnect: disconnectGame,
    sendCommand,
    newGame,
    quit,
  } = useGameSocket(token);

  // Transform game state to scene frame
  const sceneFrame = useSceneFrame(
    gameState,
    VIEWPORT_WIDTH,
    VIEWPORT_HEIGHT,
    TILE_SIZE
  );

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, isLoading, navigate]);

  // Connect to game server when authenticated
  useEffect(() => {
    if (isAuthenticated && token && gameStatus === 'disconnected') {
      connectGame();
    }
  }, [isAuthenticated, token, gameStatus, connectGame]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnectGame();
    };
  }, [disconnectGame]);

  // Handle keyboard input
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in an input
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      // Debug toggles
      if (e.key === 'F1') {
        e.preventDefault();
        setShowDebug((prev) => !prev);
        return;
      }
      if (e.key === 'F2') {
        e.preventDefault();
        setShowGrid((prev) => !prev);
        return;
      }

      // Game state specific handling
      if (gameState?.game_state === 'DEAD' || gameState?.game_state === 'VICTORY') {
        if (e.key === 'Enter' || e.key === ' ') {
          newGame();
          return;
        }
      }

      // Movement commands
      let command: string | null = null;
      switch (e.key) {
        case 'ArrowUp':
        case 'w':
        case 'k':
          command = 'MOVE_NORTH';
          break;
        case 'ArrowDown':
        case 's':
        case 'j':
          command = 'MOVE_SOUTH';
          break;
        case 'ArrowLeft':
        case 'a':
        case 'h':
          command = 'MOVE_WEST';
          break;
        case 'ArrowRight':
        case 'd':
        case 'l':
          command = 'MOVE_EAST';
          break;
        case 'y':
          command = 'MOVE_NW';
          break;
        case 'u':
          command = 'MOVE_NE';
          break;
        case 'b':
          command = 'MOVE_SW';
          break;
        case 'n':
          command = 'MOVE_SE';
          break;
        case '.':
        case ' ':
          command = 'WAIT';
          break;
        case '>':
          command = 'DESCEND';
          break;
        case '<':
          command = 'ASCEND';
          break;
        case 'g':
        case ',':
          command = 'PICKUP';
          break;
        case 'i':
          command = 'INVENTORY';
          break;
        case 'c':
          command = 'CHARACTER';
          break;
        case 'Escape':
          command = 'CANCEL';
          break;
        case 'q':
          if (e.ctrlKey) {
            quit();
            return;
          }
          break;
      }

      if (command) {
        e.preventDefault();
        sendCommand(command);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameState, sendCommand, newGame, quit]);

  // Handle new game
  const handleNewGame = useCallback(() => {
    newGame();
  }, [newGame]);

  if (isLoading) {
    return (
      <div className="play-scene play-scene--loading">
        <div className="loading">Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="play-scene">
      <div className="play-scene__header">
        <h1>Scene View (Experimental)</h1>
        <div className="play-scene__controls">
          <label>
            <input
              type="checkbox"
              checked={showDebug}
              onChange={(e) => setShowDebug(e.target.checked)}
            />
            Debug Info (F1)
          </label>
          <label>
            <input
              type="checkbox"
              checked={showGrid}
              onChange={(e) => setShowGrid(e.target.checked)}
            />
            Show Grid (F2)
          </label>
          <button onClick={() => navigate('/play')} className="btn-secondary">
            Switch to Terminal
          </button>
        </div>
      </div>

      <div className="play-scene__content">
        {gameError && (
          <div className="play-scene__error">
            <span className="error-icon">!</span>
            <span>{gameError}</span>
            <button onClick={connectGame} className="btn-retry">
              Retry
            </button>
          </div>
        )}

        <div className="play-scene__renderer">
          <SceneRenderer
            frame={sceneFrame}
            showGrid={showGrid}
            showCoords={showDebug}
            className="play-scene__canvas"
          />
        </div>

        {/* HUD overlay */}
        {gameState && gameState.player && (
          <div className="play-scene__hud">
            <div className="hud-section hud-player">
              <div className="hud-title">Player</div>
              <div className="hud-stat">
                HP: {gameState.player.health}/{gameState.player.max_health}
              </div>
              <div className="hud-stat">Level: {gameState.player.level}</div>
              <div className="hud-stat">ATK: {gameState.player.attack}</div>
              <div className="hud-stat">DEF: {gameState.player.defense}</div>
            </div>

            {gameState.dungeon && (
              <div className="hud-section hud-dungeon">
                <div className="hud-title">Dungeon</div>
                <div className="hud-stat">Floor: {gameState.dungeon.level}</div>
                <div className="hud-stat">Turn: {gameState.turn}</div>
              </div>
            )}

            <div className="hud-section hud-status">
              <div className="hud-title">Status</div>
              <div className={`connection-status ${gameStatus}`}>
                {gameStatus === 'connected' ? 'Connected' : 'Disconnected'}
              </div>
            </div>
          </div>
        )}

        {/* Game over overlay */}
        {gameState?.game_state === 'DEAD' && (
          <div className="play-scene__overlay play-scene__overlay--death">
            <div className="overlay-content">
              <h2>You Died</h2>
              <p>Press Enter to play again</p>
              <button onClick={handleNewGame} className="btn-primary">
                New Game
              </button>
            </div>
          </div>
        )}

        {gameState?.game_state === 'VICTORY' && (
          <div className="play-scene__overlay play-scene__overlay--victory">
            <div className="overlay-content">
              <h2>Victory!</h2>
              <p>You have conquered the dungeon!</p>
              <button onClick={handleNewGame} className="btn-primary">
                Play Again
              </button>
            </div>
          </div>
        )}

        {/* Messages panel */}
        {gameState?.messages && gameState.messages.length > 0 && (
          <div className="play-scene__messages">
            {gameState.messages.slice(-5).map((msg, i) => (
              <div key={i} className="message">
                {msg}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="play-scene__footer">
        <div className="controls-hint">
          <span>Move: WASD/Arrows/HJKL</span>
          <span>Wait: .</span>
          <span>Stairs: &gt;/&lt;</span>
          <span>Pickup: G</span>
          <span>Inventory: I</span>
        </div>
      </div>
    </div>
  );
}
