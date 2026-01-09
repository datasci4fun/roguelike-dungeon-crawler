/**
 * GameIntro - Wrapper component using the new cutscene engine
 * This replaces the original GameIntro with the modular cutscene system
 */

import { useEffect } from 'react';
import { CutscenePlayer, introCutscene } from '../cutscenes';
import { useCinematicSfx } from '../hooks/useCinematicSfx';

interface GameIntroProps {
  onComplete: () => void;
  onSkip?: () => void;
  onMusicChange?: (trackId: string) => void;
}

export function GameIntro({ onComplete, onSkip, onMusicChange }: GameIntroProps) {
  const { play, preloadAll } = useCinematicSfx();

  // Preload cinematic SFX so file-based audio is ready before first FX triggers
  useEffect(() => {
    preloadAll();
  }, [preloadAll]);

  return (
    <CutscenePlayer
      cutscene={introCutscene}
      autoPlay={true}
      onComplete={onComplete}
      onSkip={onSkip}
      onMusicChange={onMusicChange}
      onSfxPlay={play}
    />
  );
}

// Re-export for backwards compatibility
export default GameIntro;
