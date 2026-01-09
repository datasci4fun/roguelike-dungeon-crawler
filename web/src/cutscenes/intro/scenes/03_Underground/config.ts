/**
 * Scene 03: The Descent
 * Survivors retreating underground — the bargain: stone over sky.
 */

import type { SceneConfig } from '../../../engine/types';

export const scene03Underground: SceneConfig = {
  meta: {
    id: 'underground',
    name: 'The Descent',
    duration: 14000, // slow, heavy, ritual pacing
    fadeIn: 'slow',
    fadeOut: 'slow',
  },

  background: {
    type: 'underground',
    parallax: true,
    animate: true,
  },

  // Cave dust / torch haze: more particles, softer opacity
  particles: {
    type: 'dust',
    count: 34,
    speed: 'slow',
    opacity: 0.22,
  },

  captions: {
    position: 'center',
    lines: [
      { text: 'THE DESCENT', effect: 'fade', style: 'dramatic', delay: 650, duration: 1400 },

      { text: '', delay: 520 },

      { text: 'They went below—trading daylight for stone.', effect: 'fade', style: 'normal', delay: 900, duration: 2200 },

      { text: '', delay: 420 },

      // This is the “doors closing” moment.
      { text: 'They sealed the entrances with ancient craft,', effect: 'fade', style: 'emphasis', delay: 900, duration: 2000 },

      { text: 'and locked their names and riches in the dark.', effect: 'fade', style: 'normal', delay: 700, duration: 2000 },

      { text: '', delay: 520 },

      { text: 'There, they waited… and listened.', effect: 'fade', style: 'whisper', delay: 950, duration: 2600 },
    ],
  },

  // Optional: a single micro-shake as the seal “thuds” into place.
  // If you don’t want ANY shake in this scene, delete effects + timings.
  effects: [{ type: 'shake', intensity: 'light' }],
  effectTimings: [6100], // lands during "sealed the entrances..."
};
