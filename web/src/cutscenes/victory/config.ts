/**
 * Victory Cutscene Configuration
 * Full cinematic victory sequence with random legacy variant
 */

import type { CutsceneConfig, SceneConfig, CaptionLine, FxCue } from '../engine/types';
import { scene00Seal } from './scenes/00_Seal/config';
import { scene01World } from './scenes/01_World/config';
import { scene02LegendBase, legendLinesStart, legendLinesEnd } from './scenes/02_Legend/config';
import { getRandomLegacy, type LegacyVariant } from './scenes/02_Legend';

// Legacy export for backwards compatibility (placeholder scene)
import { scene00Victory } from './scenes/00_Victory/config';
export const victoryCutscene: CutsceneConfig = {
  id: 'victory',
  name: 'Victory',
  scenes: [scene00Victory],
  music: 'victory',
  skippable: true,
  showProgress: false,
  crtEffect: true,
};

/**
 * Build the final legend scene with a specific legacy variant
 */
function buildLegendScene(legacy: LegacyVariant): SceneConfig {
  const lines: CaptionLine[] = [
    ...legendLinesStart,
    ...legacy.lines,
    ...legendLinesEnd,
  ];

  return {
    meta: {
      ...scene02LegendBase.meta,
      // Override id to include legacy variant
      id: `victory_legend_${legacy.id}`,
    },
    background: scene02LegendBase.background,
    particles: scene02LegendBase.particles,
    captions: {
      ...scene02LegendBase.captions,
      lines,
    },
    fxCues: scene02LegendBase.fxCues as FxCue[],
  };
}

/**
 * Create a new victory cutscene with a random legacy variant
 * Call this once when the player wins; the legacy is locked for that instance
 */
export function createVictoryCutscene(rng: () => number = Math.random): CutsceneConfig {
  const legacy = getRandomLegacy(rng);
  const legendScene = buildLegendScene(legacy);

  return {
    id: 'victory',
    name: 'Victory',
    scenes: [
      scene00Seal,
      scene01World,
      legendScene,
    ],
    music: 'victory',
    skippable: true,
    showProgress: false,
    crtEffect: true,
  };
}

// Export legacy IDs for extraction in wrapper component
export { legacyBeaconId, legacyChampionId, legacyArchivistId } from './scenes/02_Legend';
