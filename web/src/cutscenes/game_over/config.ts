/**
 * Game Over Cutscene Configuration
 */

import type { CutsceneConfig } from '../engine/types';
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
