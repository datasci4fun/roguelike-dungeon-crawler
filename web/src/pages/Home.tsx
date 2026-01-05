import { useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useAudioManager } from '../hooks';
import './Home.css';

export function Home() {
  const { isAuthenticated } = useAuth();
  const { playMusic, isUnlocked, unlockAudio } = useAudioManager();

  // Unlock audio and start menu music on first user interaction
  const handleInteraction = useCallback(() => {
    if (!isUnlocked) {
      unlockAudio();
    }
  }, [isUnlocked, unlockAudio]);

  // Play menu music once unlocked
  useEffect(() => {
    if (isUnlocked) {
      playMusic('menu');
    }
  }, [isUnlocked, playMusic]);

  return (
    <div className="home" onClick={handleInteraction}>
      <div className="hero">
        <h1>Roguelike Dungeon Crawler</h1>
        <p className="tagline">
          Explore procedurally generated dungeons, battle fierce enemies, and
          compete for the highest score.
        </p>
        {!isUnlocked && (
          <p className="audio-hint">Click anywhere to enable music</p>
        )}
        <div className="hero-actions">
          {isAuthenticated ? (
            <Link to="/character-creation" className="btn btn-primary btn-large">
              Play Now
            </Link>
          ) : (
            <>
              <Link to="/register" className="btn btn-primary btn-large">
                Get Started
              </Link>
              <Link to="/login" className="btn btn-secondary btn-large">
                Login
              </Link>
            </>
          )}
        </div>
      </div>

      <div className="features">
        <div className="feature">
          <h3>Procedural Dungeons</h3>
          <p>
            Every run is unique with BSP-generated dungeons, random enemy
            placement, and varied item drops.
          </p>
        </div>
        <div className="feature">
          <h3>Ghost Replays</h3>
          <p>
            Watch replays of other players' runs and learn from the best
            dungeon crawlers.
          </p>
        </div>
        <div className="feature">
          <h3>Leaderboards</h3>
          <p>
            Compete for the highest score, fastest victory, or most kills
            across multiple categories.
          </p>
        </div>
        <div className="feature">
          <h3>Real-time Chat</h3>
          <p>
            Connect with other players, share strategies, and celebrate
            victories together.
          </p>
        </div>
      </div>
    </div>
  );
}
