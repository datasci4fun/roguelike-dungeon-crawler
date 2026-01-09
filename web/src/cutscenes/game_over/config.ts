/**
 * Game Over Cutscene Configuration
 * Full cinematic death sequence with random fate variant
 */

import type { CutsceneConfig } from '../engine/types';
import { scene00Fall } from './scenes/00_Fall/config';
import { scene01YouDied } from './scenes/01_YouDied/config';
import { scene02AbyssClaims } from './scenes/02_AbyssClaims/config';
import { getRandomFate } from './scenes/03_Fate';
import { scene04Prompt } from './scenes/04_Prompt/config';

// Legacy export for backwards compatibility
import { scene00GameOver } from './scenes/00_GameOver/config';
export const gameOverCutscene: CutsceneConfig = {
  id: 'game_over',
  name: 'Game Over',
  scenes: [scene00GameOver],
  music: 'game_over',
  skippable: true,
  showProgress: false,
  crtEffect: true,
};

/**
 * Create a new game over cutscene with a random fate
 * Call this each time the player dies for variety
 */
export function createGameOverCutscene(): CutsceneConfig {
  const fateScene = getRandomFate();

  return {
    id: 'game_over',
    name: 'Game Over',
    scenes: [
      scene00Fall,
      scene01YouDied,
      scene02AbyssClaims,
      fateScene,
      scene04Prompt,
    ],
    music: 'game_over',
    skippable: true,
    showProgress: false,
    crtEffect: true,
  };
}
