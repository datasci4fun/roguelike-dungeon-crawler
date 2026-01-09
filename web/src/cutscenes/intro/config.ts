/**
 * Intro Cutscene Configuration
 * Combines all intro scenes into the complete intro sequence
 */

import type { CutsceneConfig } from '../engine/types';
import { scene00Title } from './scenes/00_Title/config';
import { scene01Kingdom } from './scenes/01_Kingdom/config';
import { scene02Darkness } from './scenes/02_Darkness/config';
import { scene03Underground } from './scenes/03_Underground/config';
import { scene04Depths } from './scenes/04_Centuries/config';
import { scene05Entrance } from './scenes/05_Present/config';
import { scene06You } from './scenes/06_You/config';

export const introCutscene: CutsceneConfig = {
  id: 'intro',
  name: 'The Descent Begins',
  scenes: [
    scene00Title,
    scene01Kingdom,
    scene02Darkness,
    scene03Underground,
    scene04Depths,
    scene05Entrance,
    scene06You,
  ],
  music: 'intro',
  skippable: true,
  showProgress: true,
  crtEffect: true,
};
