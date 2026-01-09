/**
 * Scene 04: Centuries Pass
 * Time erodes meaning. Something in the deep learns your names.
 */

import type { SceneConfig } from '../../../engine/types';

export const scene04Depths: SceneConfig = {
  meta: {
    id: 'depths',
    name: 'Centuries Pass',
    duration: 14000,
    fadeIn: 'dramatic',
    fadeOut: 'dramatic',
  },

  background: {
    type: 'depths',
    parallax: true,
    animate: true,
  },

  particles: {
    type: 'mist',
    count: 12,
    speed: 'slow',
    opacity: 0.30,
  },

  captions: {
    position: 'center',
    lines: [
      { text: 'CENTURIES PASS', effect: 'fade', style: 'dramatic', delay: 600, duration: 1200 },

      { text: '', delay: 520 },

      { text: 'Generations learned to live without wind.', effect: 'fade', style: 'normal', delay: 800, duration: 1700 },

      { text: '', delay: 380 },

      { text: 'The world above became a story told to children.', effect: 'fade', style: 'whisper', delay: 750, duration: 1600 },

      { text: 'The seals began to weaken.', effect: 'fade', style: 'emphasis', delay: 650, duration: 1400 },

      { text: '', delay: 520 },

      { text: 'And deep beneath the halls… something remembered.', effect: 'flicker', style: 'emphasis', delay: 900, duration: 2400 },
    ],
  },

  effects: [
    { type: 'pressure', intensity: 'medium' },
  ],
  effectTimings: [
    10800, // right before the final line reveals (~11.0s)
  ],
};
