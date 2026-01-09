/**
 * GameIntro - Wrapper component using the new cutscene engine
 * This replaces the original GameIntro with the modular cutscene system
 */

import { CutscenePlayer, introCutscene } from '../cutscenes';

interface GameIntroProps {
  onComplete: () => void;
  onSkip?: () => void;
  onMusicChange?: (trackId: string) => void;
}

export function GameIntro({ onComplete, onSkip, onMusicChange }: GameIntroProps) {
  return (
    <CutscenePlayer
      cutscene={introCutscene}
      autoPlay={true}
      onComplete={onComplete}
      onSkip={onSkip}
      onMusicChange={onMusicChange}
    />
  );
}

// Re-export for backwards compatibility
export default GameIntro;
