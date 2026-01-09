/**
 * Fate Scenes - Random death fate variants
 */

export { scene03FateEcho } from './echo';
export { scene03FateHollowed } from './hollowed';
export { scene03FateSilence } from './silence';

import { scene03FateEcho } from './echo';
import { scene03FateHollowed } from './hollowed';
import { scene03FateSilence } from './silence';
import type { SceneConfig } from '../../../engine/types';

export const fateScenes: SceneConfig[] = [
  scene03FateEcho,
  scene03FateHollowed,
  scene03FateSilence,
];

/**
 * Get a random fate scene
 */
export function getRandomFate(): SceneConfig {
  const index = Math.floor(Math.random() * fateScenes.length);
  return fateScenes[index];
}
