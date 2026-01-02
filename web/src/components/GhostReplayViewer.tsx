/**
 * GhostReplayViewer - Displays ghost replay with playback controls.
 */
import { useState, useEffect, useCallback, useRef } from 'react';
import type { GhostFrame, GhostDetail } from '../types';
import './GhostReplayViewer.css';

interface GhostReplayViewerProps {
  ghost: GhostDetail;
  onClose: () => void;
}

// Action display names
const ACTION_NAMES: Record<string, string> = {
  MOVE_UP: '↑ Move Up',
  MOVE_DOWN: '↓ Move Down',
  MOVE_LEFT: '← Move Left',
  MOVE_RIGHT: '→ Move Right',
  USE_ITEM_1: '🧪 Use Item 1',
  USE_ITEM_2: '🧪 Use Item 2',
  USE_ITEM_3: '🧪 Use Item 3',
  DESCEND: '⬇ Descend Stairs',
  OPEN_INVENTORY: '📦 Open Inventory',
};

// Playback speeds (ms per frame)
const SPEEDS = [
  { label: '0.5x', ms: 1000 },
  { label: '1x', ms: 500 },
  { label: '2x', ms: 250 },
  { label: '4x', ms: 125 },
];

export function GhostReplayViewer({ ghost, onClose }: GhostReplayViewerProps) {
  const [currentFrameIndex, setCurrentFrameIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speedIndex, setSpeedIndex] = useState(1); // Default 1x
  const intervalRef = useRef<number | null>(null);

  const frames = ghost.frames;
  const currentFrame = frames[currentFrameIndex];
  const totalFrames = frames.length;

  // Playback control
  useEffect(() => {
    if (isPlaying && currentFrameIndex < totalFrames - 1) {
      intervalRef.current = window.setInterval(() => {
        setCurrentFrameIndex((prev) => {
          if (prev >= totalFrames - 1) {
            setIsPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, SPEEDS[speedIndex].ms);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isPlaying, speedIndex, totalFrames, currentFrameIndex]);

  // Stop at end
  useEffect(() => {
    if (currentFrameIndex >= totalFrames - 1) {
      setIsPlaying(false);
    }
  }, [currentFrameIndex, totalFrames]);

  const togglePlay = useCallback(() => {
    if (currentFrameIndex >= totalFrames - 1) {
      // Restart from beginning
      setCurrentFrameIndex(0);
      setIsPlaying(true);
    } else {
      setIsPlaying((prev) => !prev);
    }
  }, [currentFrameIndex, totalFrames]);

  const stepForward = useCallback(() => {
    setIsPlaying(false);
    setCurrentFrameIndex((prev) => Math.min(totalFrames - 1, prev + 1));
  }, [totalFrames]);

  const stepBackward = useCallback(() => {
    setIsPlaying(false);
    setCurrentFrameIndex((prev) => Math.max(0, prev - 1));
  }, []);

  const goToStart = useCallback(() => {
    setIsPlaying(false);
    setCurrentFrameIndex(0);
  }, []);

  const goToEnd = useCallback(() => {
    setIsPlaying(false);
    setCurrentFrameIndex(totalFrames - 1);
  }, [totalFrames]);

  const cycleSpeed = useCallback(() => {
    setSpeedIndex((prev) => (prev + 1) % SPEEDS.length);
  }, []);

  const handleSliderChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setIsPlaying(false);
    setCurrentFrameIndex(parseInt(e.target.value, 10));
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case ' ':
          e.preventDefault();
          togglePlay();
          break;
        case 'ArrowRight':
          e.preventDefault();
          stepForward();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          stepBackward();
          break;
        case 'Home':
          e.preventDefault();
          goToStart();
          break;
        case 'End':
          e.preventDefault();
          goToEnd();
          break;
        case 'Escape':
          e.preventDefault();
          onClose();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [togglePlay, stepForward, stepBackward, goToStart, goToEnd, onClose]);

  if (!currentFrame) {
    return (
      <div className="ghost-viewer">
        <div className="ghost-viewer-header">
          <h2>No frames available</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>
      </div>
    );
  }

  return (
    <div className="ghost-viewer-overlay" onClick={onClose}>
      <div className="ghost-viewer" onClick={(e) => e.stopPropagation()}>
        <div className="ghost-viewer-header">
          <div className="ghost-info">
            <h2>{ghost.username}'s Run</h2>
            <span className={`result-badge ${ghost.victory ? 'victory' : 'death'}`}>
              {ghost.victory ? 'Victory' : ghost.killed_by ? `Killed by ${ghost.killed_by}` : 'Death'}
            </span>
          </div>
          <button className="close-btn" onClick={onClose} title="Close (Esc)">×</button>
        </div>

        <div className="ghost-viewer-content">
          <div className="replay-display">
            <GhostFrameDisplay frame={currentFrame} frames={frames} currentIndex={currentFrameIndex} />
          </div>

          <div className="replay-sidebar">
            <div className="frame-info">
              <h3>Turn {currentFrame.turn}</h3>
              <div className="frame-stats">
                <div className="stat-row">
                  <span className="stat-label">Dungeon Level</span>
                  <span className="stat-value">{currentFrame.dungeon_level}</span>
                </div>
                <div className="stat-row">
                  <span className="stat-label">Player Level</span>
                  <span className="stat-value">{currentFrame.level}</span>
                </div>
                <div className="stat-row">
                  <span className="stat-label">Health</span>
                  <span className="stat-value health">
                    {currentFrame.health} / {currentFrame.max_health}
                  </span>
                </div>
                <div className="stat-row">
                  <span className="stat-label">Position</span>
                  <span className="stat-value">({currentFrame.x}, {currentFrame.y})</span>
                </div>
              </div>

              <div className="action-display">
                <span className="action-label">Action</span>
                <span className="action-value">
                  {ACTION_NAMES[currentFrame.action] || currentFrame.action}
                </span>
              </div>

              {currentFrame.damage_dealt && (
                <div className="combat-info dealt">
                  Dealt {currentFrame.damage_dealt} damage
                </div>
              )}

              {currentFrame.damage_taken && (
                <div className="combat-info taken">
                  Took {currentFrame.damage_taken} damage
                </div>
              )}

              {currentFrame.message && (
                <div className="frame-message">
                  "{currentFrame.message}"
                </div>
              )}
            </div>

            <div className="run-summary">
              <h4>Run Summary</h4>
              <div className="summary-stats">
                <div>Final Level: {ghost.final_level}</div>
                <div>Total Turns: {ghost.total_turns}</div>
                <div>Score: {ghost.final_score.toLocaleString()}</div>
              </div>
            </div>
          </div>
        </div>

        <div className="playback-controls">
          <div className="control-buttons">
            <button onClick={goToStart} title="Go to start (Home)" className="control-btn">
              ⏮
            </button>
            <button onClick={stepBackward} title="Step back (←)" className="control-btn">
              ⏪
            </button>
            <button onClick={togglePlay} title="Play/Pause (Space)" className="control-btn play-btn">
              {isPlaying ? '⏸' : currentFrameIndex >= totalFrames - 1 ? '↺' : '▶'}
            </button>
            <button onClick={stepForward} title="Step forward (→)" className="control-btn">
              ⏩
            </button>
            <button onClick={goToEnd} title="Go to end (End)" className="control-btn">
              ⏭
            </button>
            <button onClick={cycleSpeed} className="speed-btn" title="Change speed">
              {SPEEDS[speedIndex].label}
            </button>
          </div>

          <div className="timeline">
            <span className="frame-counter">
              {currentFrameIndex + 1} / {totalFrames}
            </span>
            <input
              type="range"
              min="0"
              max={totalFrames - 1}
              value={currentFrameIndex}
              onChange={handleSliderChange}
              className="timeline-slider"
            />
            <span className="turn-counter">
              Turn {currentFrame.turn}
            </span>
          </div>
        </div>

        <div className="keyboard-hints">
          <span>Space: Play/Pause</span>
          <span>←/→: Step</span>
          <span>Home/End: Jump</span>
          <span>Esc: Close</span>
        </div>
      </div>
    </div>
  );
}

// Sub-component to display the ghost frame visually
interface GhostFrameDisplayProps {
  frame: GhostFrame;
  frames: GhostFrame[];
  currentIndex: number;
}

function GhostFrameDisplay({ frame, frames, currentIndex }: GhostFrameDisplayProps) {
  // Create a simple path visualization showing recent movement
  const TRAIL_LENGTH = 10;
  const VIEW_SIZE = 15; // 15x15 grid centered on player

  // Get recent positions for trail
  const recentFrames = frames.slice(Math.max(0, currentIndex - TRAIL_LENGTH), currentIndex + 1);

  // Create grid
  const grid: string[][] = [];
  for (let y = 0; y < VIEW_SIZE; y++) {
    grid[y] = [];
    for (let x = 0; x < VIEW_SIZE; x++) {
      grid[y][x] = '·';
    }
  }

  // Center offset
  const centerX = Math.floor(VIEW_SIZE / 2);
  const centerY = Math.floor(VIEW_SIZE / 2);

  // Draw trail
  recentFrames.forEach((f, i) => {
    const relX = f.x - frame.x + centerX;
    const relY = f.y - frame.y + centerY;

    if (relX >= 0 && relX < VIEW_SIZE && relY >= 0 && relY < VIEW_SIZE) {
      if (i === recentFrames.length - 1) {
        // Current position
        grid[relY][relX] = '@';
      } else {
        // Trail
        const intensity = Math.floor((i / recentFrames.length) * 3);
        grid[relY][relX] = ['░', '▒', '▓'][intensity] || '░';
      }
    }
  });

  // Mark attack target if present
  if (frame.target_x !== undefined && frame.target_y !== undefined) {
    const relX = frame.target_x - frame.x + centerX;
    const relY = frame.target_y - frame.y + centerY;
    if (relX >= 0 && relX < VIEW_SIZE && relY >= 0 && relY < VIEW_SIZE && grid[relY][relX] !== '@') {
      grid[relY][relX] = '×';
    }
  }

  // Health bar
  const healthPercent = frame.max_health > 0 ? frame.health / frame.max_health : 0;
  const healthBarWidth = 20;
  const healthFilled = Math.floor(healthPercent * healthBarWidth);
  const healthBar = '█'.repeat(healthFilled) + '░'.repeat(healthBarWidth - healthFilled);
  const healthColor = healthPercent > 0.5 ? 'health-high' : healthPercent > 0.25 ? 'health-med' : 'health-low';

  return (
    <div className="frame-display">
      <div className="mini-map">
        {grid.map((row, y) => (
          <div key={y} className="map-row">
            {row.map((cell, x) => (
              <span
                key={x}
                className={`map-cell ${cell === '@' ? 'player' : cell === '×' ? 'target' : cell !== '·' ? 'trail' : ''}`}
              >
                {cell}
              </span>
            ))}
          </div>
        ))}
      </div>

      <div className="health-display">
        <span className="health-label">HP</span>
        <span className={`health-bar ${healthColor}`}>{healthBar}</span>
        <span className="health-text">{frame.health}/{frame.max_health}</span>
      </div>

      <div className="level-indicator">
        <span className="dungeon-level">Dungeon Lv.{frame.dungeon_level}</span>
        <span className="player-level">Player Lv.{frame.level}</span>
      </div>
    </div>
  );
}
