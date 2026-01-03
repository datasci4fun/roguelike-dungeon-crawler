import { useState, useEffect, useCallback } from 'react';
import './AchievementToast.css';

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  points: number;
}

interface AchievementToastProps {
  achievements: Achievement[];
  onDismiss: () => void;
}

const RARITY_LABELS: Record<string, string> = {
  common: 'Common',
  rare: 'Rare',
  epic: 'Epic',
  legendary: 'Legendary',
};

const ICON_MAP: Record<string, string> = {
  sword: '\u2694\uFE0F',
  skull: '\uD83D\uDC80',
  dragon: '\uD83D\uDC09',
  explosion: '\uD83D\uDCA5',
  crown: '\uD83D\uDC51',
  trophy: '\uD83C\uDFC6',
  medal: '\uD83C\uDF96\uFE0F',
  stairs: '\uD83E\uDE9C',
  star: '\u2B50',
  calendar: '\uD83D\uDCC5',
  lightning: '\u26A1',
  shield: '\uD83D\uDEE1\uFE0F',
  flask: '\uD83E\uDDEA',
  sparkle: '\u2728',
  bag: '\uD83C\uDF92',
  potion: '\uD83E\uDDF4',
  chest: '\uD83D\uDCE6',
  door: '\uD83D\uDEAA',
  heart: '\u2764\uFE0F',
  coins: '\uD83E\uDE99',
};

function getIcon(iconName: string): string {
  return ICON_MAP[iconName] || '\uD83C\uDFC5';
}

export function AchievementToast({ achievements, onDismiss }: AchievementToastProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(true);
  const [isExiting, setIsExiting] = useState(false);

  const currentAchievement = achievements[currentIndex];

  const handleNext = useCallback(() => {
    if (currentIndex < achievements.length - 1) {
      setIsExiting(true);
      setTimeout(() => {
        setCurrentIndex((prev) => prev + 1);
        setIsExiting(false);
      }, 300);
    } else {
      setIsExiting(true);
      setTimeout(() => {
        setIsVisible(false);
        onDismiss();
      }, 300);
    }
  }, [currentIndex, achievements.length, onDismiss]);

  // Auto-advance after 5 seconds
  useEffect(() => {
    const timer = setTimeout(handleNext, 5000);
    return () => clearTimeout(timer);
  }, [currentIndex, handleNext]);

  // Handle click to advance
  const handleClick = () => {
    handleNext();
  };

  // Handle keyboard
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'Escape') {
        handleNext();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleNext]);

  if (!isVisible || !currentAchievement) {
    return null;
  }

  return (
    <div className="achievement-toast-overlay" onClick={handleClick}>
      <div className={`achievement-toast ${currentAchievement.rarity} ${isExiting ? 'exiting' : ''}`}>
        <div className="toast-header">
          <span className="toast-label">Achievement Unlocked!</span>
          {achievements.length > 1 && (
            <span className="toast-counter">
              {currentIndex + 1} / {achievements.length}
            </span>
          )}
        </div>

        <div className="toast-content">
          <div className="toast-icon">{getIcon(currentAchievement.icon)}</div>
          <div className="toast-info">
            <h3 className="toast-name">{currentAchievement.name}</h3>
            <p className="toast-description">{currentAchievement.description}</p>
            <div className="toast-meta">
              <span className={`toast-rarity ${currentAchievement.rarity}`}>
                {RARITY_LABELS[currentAchievement.rarity]}
              </span>
              <span className="toast-points">+{currentAchievement.points} pts</span>
            </div>
          </div>
        </div>

        <div className="toast-footer">
          <span className="toast-hint">
            {currentIndex < achievements.length - 1 ? 'Click or press Enter for next' : 'Click or press Enter to close'}
          </span>
        </div>
      </div>
    </div>
  );
}
