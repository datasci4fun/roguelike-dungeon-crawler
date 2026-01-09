/**
 * VictoryCutscene - Victory cutscene wrapper using the cutscene engine
 * Shows cinematic victory sequence before the stats summary
 */

import { useState, useEffect, useMemo } from 'react';
import { CutscenePlayer, createVictoryCutscene } from '../cutscenes';
import { useCinematicSfx } from '../hooks/useCinematicSfx';
import type { CutsceneConfig } from '../cutscenes/engine/types';

export type VictoryLegacyId = 'legacy-beacon' | 'legacy-champion' | 'legacy-archivist' | 'unknown';

interface VictoryCutsceneProps {
  onComplete: () => void;
  onSkip?: () => void;
  onMusicChange?: (trackId: string) => void;
  onLegacySelected?: (legacy: VictoryLegacyId) => void;
}

function extractLegacyId(cutscene: CutsceneConfig): VictoryLegacyId {
  // Find the legend scene by id prefix
  const legendScene = cutscene.scenes.find((s) => s.meta.id.startsWith('victory_legend_'));
  if (!legendScene) return 'unknown';

  // Extract legacy id from scene id (e.g., "victory_legend_legacy-beacon" -> "legacy-beacon")
  const match = legendScene.meta.id.match(/victory_legend_(legacy-\w+)/);
  if (match) {
    return match[1] as VictoryLegacyId;
  }
  return 'unknown';
}

export function VictoryCutscene({ onComplete, onSkip, onMusicChange, onLegacySelected }: VictoryCutsceneProps) {
  const { play, preloadAll } = useCinematicSfx();

  // Create cutscene ONCE on mount - random legacy is locked in
  const [cutscene] = useState<CutsceneConfig>(() => createVictoryCutscene());

  const legacyId = useMemo(() => extractLegacyId(cutscene), [cutscene]);

  // Preload cinematic SFX
  useEffect(() => {
    preloadAll();
  }, [preloadAll]);

  // Let the summary UI know which legacy variant was selected
  useEffect(() => {
    onLegacySelected?.(legacyId);
  }, [legacyId, onLegacySelected]);

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

export default VictoryCutscene;
