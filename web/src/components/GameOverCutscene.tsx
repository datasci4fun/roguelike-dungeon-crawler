/**
 * GameOverCutscene - Death cutscene wrapper using the cutscene engine
 * Shows cinematic death sequence before the stats summary
 */

import { useState, useEffect, useMemo } from 'react';
import { CutscenePlayer, createGameOverCutscene } from '../cutscenes';
import { useCinematicSfx } from '../hooks/useCinematicSfx';
import type { CutsceneConfig } from '../cutscenes/engine/types';

export type DeathFateId = 'fate-echo' | 'fate-hollowed' | 'fate-silence' | 'unknown';

interface GameOverCutsceneProps {
  onComplete: () => void;
  onSkip?: () => void;
  onMusicChange?: (trackId: string) => void;
  onFateSelected?: (fate: DeathFateId) => void;
}

function extractFateId(cutscene: CutsceneConfig): DeathFateId {
  // Find the fate scene by id
  const fateIds = new Set(['fate-echo', 'fate-hollowed', 'fate-silence']);
  const fate = cutscene.scenes.find((s) => fateIds.has(s.meta.id))?.meta.id;
  return (fate as DeathFateId) ?? 'unknown';
}

export function GameOverCutscene({ onComplete, onSkip, onMusicChange, onFateSelected }: GameOverCutsceneProps) {
  const { play, preloadAll } = useCinematicSfx();

  // Create cutscene ONCE on mount - random fate is locked in
  const [cutscene] = useState<CutsceneConfig>(() => createGameOverCutscene());

  const fateId = useMemo(() => extractFateId(cutscene), [cutscene]);

  // Preload cinematic SFX
  useEffect(() => {
    preloadAll();
  }, [preloadAll]);

  // Let the summary UI know which fate variant was selected
  useEffect(() => {
    onFateSelected?.(fateId);
  }, [fateId, onFateSelected]);

  return (
    <CutscenePlayer
      cutscene={cutscene}
      autoPlay={true}
      onComplete={onComplete}
      onSkip={onSkip}
      onMusicChange={onMusicChange}
      onSfxPlay={play}
    />
  );
}

export default GameOverCutscene;
