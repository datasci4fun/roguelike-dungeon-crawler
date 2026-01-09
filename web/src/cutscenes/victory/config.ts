/**
 * Victory Cutscene Configuration
 */

import type { CutsceneConfig } from '../engine/types';
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
