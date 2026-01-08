/**
 * GameOver - Cinematic death and victory overlay screens.
 * Shows narrative epilogue, run statistics, and play again prompt.
 */
import { useState, useEffect, useCallback } from 'react';
import './GameOver.css';

interface PlayerStats {
  level: number;
  kills: number;
  maxHealth?: number;
  gold?: number;
  dungeonLevel?: number;
}

interface GameOverProps {
  type: 'death' | 'victory';
  stats: PlayerStats;
  onPlayAgain: () => void;
  onMusicChange?: (trackId: string) => void;
}

const DEATH_NARRATIVE = [
  'The darkness claims another soul...',
  '',
  'Your journey ends here, in the cold depths',
  'of the forgotten dungeon.',
  '',
  'Perhaps another adventurer will succeed',
  'where you have fallen.',
];

const VICTORY_NARRATIVE = [
  'Against all odds, you have triumphed!',
  '',
  'The ancient evil has been vanquished,',
  'and the kingdom of Valdris can rest at last.',
  '',
  'Songs will be sung of your bravery.',
  'Your legend will echo through the ages.',
];

export function GameOver({ type, stats, onPlayAgain, onMusicChange }: GameOverProps) {
  const [fadeIn, setFadeIn] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [showPrompt, setShowPrompt] = useState(false);

  const isDeath = type === 'death';
  const narrative = isDeath ? DEATH_NARRATIVE : VICTORY_NARRATIVE;

  // Trigger music change on mount
  useEffect(() => {
    onMusicChange?.(type);
  }, [type, onMusicChange]);

  // Staged fade-in animations
  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];

    timers.push(setTimeout(() => setFadeIn(true), 50));
    timers.push(setTimeout(() => setShowStats(true), 1500));
    timers.push(setTimeout(() => setShowPrompt(true), 2500));

    return () => timers.forEach(clearTimeout);
  }, []);

  // Keyboard handler
  useEffect(() => {
    if (!showPrompt) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        onPlayAgain();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showPrompt, onPlayAgain]);

  const handleClick = useCallback(() => {
    if (showPrompt) {
      onPlayAgain();
    }
  }, [showPrompt, onPlayAgain]);

  return (
    <div
      className={`game-over ${type} ${fadeIn ? 'fade-in' : ''}`}
      onClick={handleClick}
    >
      <div className="game-over-content">
        {/* Title */}
        <div className="game-over-title">
          {isDeath ? (
            <>
              <div className="title-icon death-icon">&#x2620;</div>
              <h1>YOU HAVE FALLEN</h1>
            </>
          ) : (
            <>
              <div className="title-icon victory-icon">&#x2605;</div>
              <h1>VICTORY</h1>
            </>
          )}
        </div>

        {/* Narrative */}
        <div className="game-over-narrative">
          {narrative.map((line, i) => (
            <p key={i} className={line === '' ? 'empty-line' : ''}>
              {line}
            </p>
          ))}
        </div>

        {/* Stats */}
        <div className={`game-over-stats ${showStats ? 'visible' : ''}`}>
          <h2>~ Your Journey ~</h2>
          <div className="stats-grid">
            <div className="stat-item">
              <span className="stat-label">Character Level</span>
              <span className="stat-value">{stats.level}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Enemies Slain</span>
              <span className="stat-value">{stats.kills}</span>
            </div>
            {stats.dungeonLevel && (
              <div className="stat-item">
                <span className="stat-label">Dungeon Depth</span>
                <span className="stat-value">Floor {stats.dungeonLevel}</span>
              </div>
            )}
          </div>
        </div>

        {/* Play Again Prompt */}
        <div className={`game-over-prompt ${showPrompt ? 'visible' : ''}`}>
          <p>Press SPACE or ENTER to play again</p>
          <button className="play-again-button" onClick={onPlayAgain}>
            New Adventure
          </button>
        </div>
      </div>

      {/* Ambient effects */}
      <div className={`ambient-overlay ${type}`} />
    </div>
  );
}
