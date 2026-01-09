/**
 * CutsceneHUD - Progress indicator and controls overlay
 */

import { useCallback, useEffect } from 'react';
import './CutsceneHUD.scss';

interface CutsceneHUDProps {
  totalScenes: number;
  currentSceneIndex: number;
  showProgress?: boolean;
  isLastScene?: boolean;
  introComplete?: boolean;
  onSkip: () => void;
  onAdvance: () => void;
  onBegin?: () => void;
}

export function CutsceneHUD({
  totalScenes,
  currentSceneIndex,
  showProgress = true,
  isLastScene = false,
  introComplete = false,
  onSkip,
  onAdvance,
  onBegin,
}: CutsceneHUDProps) {
  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onSkip();
      } else if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        if (introComplete && onBegin) {
          onBegin();
        } else {
          onAdvance();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onSkip, onAdvance, onBegin, introComplete]);

  const getHintText = () => {
    if (introComplete) {
      return 'Click the button or press ENTER to continue';
    }
    if (isLastScene) {
      return 'The dungeon awaits...';
    }
    return 'Press SPACE to continue';
  };

  return (
    <div className="cutscene-hud">
      {/* Progress indicator */}
      {showProgress && (
        <div className="scene-progress">
          {Array.from({ length: totalScenes }).map((_, i) => (
            <div
              key={i}
              className={`progress-dot ${
                i === currentSceneIndex ? 'active' : ''
              } ${i < currentSceneIndex ? 'complete' : ''}`}
            />
          ))}
        </div>
      )}

      {/* Controls */}
      <div className="hud-controls">
        <span className="control-hint">{getHintText()}</span>
        <button
          className="skip-button"
          onClick={(e) => {
            e.stopPropagation();
            onSkip();
          }}
        >
          Skip Intro (ESC)
        </button>
      </div>

      {/* Cinematic letterbox bars */}
      <div className="cinematic-bar top" />
      <div className="cinematic-bar bottom" />
    </div>
  );
}
