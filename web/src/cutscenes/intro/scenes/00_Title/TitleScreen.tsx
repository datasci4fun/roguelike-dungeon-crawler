/**
 * TitleScreen - Specialized component for the ASCII art title display
 */

import { useState, useEffect } from 'react';
import './TitleScreen.scss';

const TITLE_ART = [
  '  ____                        _ _ _        ',
  ' |  _ \\ ___   __ _ _   _  ___| (_) | _____ ',
  ' | |_) / _ \\ / _` | | | |/ _ \\ | | |/ / _ \\',
  ' |  _ < (_) | (_| | |_| |  __/ | |   <  __/',
  ' |_| \\_\\___/ \\__, |\\__,_|\\___|_|_|_|\\_\\___|',
  '             |___/                         ',
];

interface TitleScreenProps {
  isActive: boolean;
}

export function TitleScreen({ isActive }: TitleScreenProps) {
  const [showPrompt, setShowPrompt] = useState(false);
  const [hasBeenActive, setHasBeenActive] = useState(false);

  useEffect(() => {
    if (isActive && !hasBeenActive) setHasBeenActive(true);
  }, [isActive, hasBeenActive]);

  // Re-arm prompt timing each time the scene becomes active
  useEffect(() => {
    if (!isActive) return;

    setShowPrompt(false);
    const timer = setTimeout(() => setShowPrompt(true), 2000);
    return () => clearTimeout(timer);
  }, [isActive]);

  // Keep showing once it's been active (don't hide during fade out)
  if (!hasBeenActive) return null;

  return (
    <div className={`title-screen ${isActive ? 'is-active' : ''}`}>
      <pre className="title-art">{TITLE_ART.join('\n')}</pre>
      <div className="title-subtitle">DUNGEON CRAWLER</div>
      <div className="title-tagline">A Tale of Darkness and Treasure</div>

      {/* Always render to reserve layout; no center-jump */}
      <div className={`title-prompt ${showPrompt ? 'show' : 'hidden'}`}>
        <span className="blink">▶</span> Press SPACE to begin...
      </div>
    </div>
  );
}
