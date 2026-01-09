/**
 * GameIntro - Wrapper component using the new cutscene engine
 * This replaces the original GameIntro with the modular cutscene system
 */

import { CutscenePlayer, introCutscene } from '../cutscenes';
import { useSoundEffect } from '../hooks/useSoundEffect';
import type { SfxId } from '../config/sfxConfig';

interface GameIntroProps {
  onComplete: () => void;
  onSkip?: () => void;
  onMusicChange?: (trackId: string) => void;
}

export function GameIntro({ onComplete, onSkip, onMusicChange }: GameIntroProps) {
  const { play } = useSoundEffect();

  return (
    <CutscenePlayer
      cutscene={introCutscene}
      autoPlay={true}
      onComplete={onComplete}
      onSkip={onSkip}
      onMusicChange={onMusicChange}
      onSfxPlay={(id, opts) => play(id as SfxId, opts)}
    />
  );
}

// Re-export for backwards compatibility
export default GameIntro;
