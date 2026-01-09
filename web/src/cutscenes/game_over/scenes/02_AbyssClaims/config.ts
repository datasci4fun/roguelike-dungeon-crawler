/**
 * Scene 02: The Abyss Claims
 * The darkness begins to consume the fallen soul
 */

import type { SceneConfig } from '../../../engine/types';

export const scene02AbyssClaims: SceneConfig = {
  meta: {
    id: 'abyss-claims',
    name: 'The Abyss Claims',
    duration: 6000,
    fadeIn: 'slow',
    fadeOut: 'slow',
  },

  background: {
    type: 'defeat',
    parallax: false,
    animate: true,
  },

  particles: {
    type: 'ash',
    count: 15,
    speed: 'slow',
    opacity: 0.3,
  },

  captions: {
    position: 'center',
    lines: [
      { text: 'The abyss claims what is owed.', effect: 'fade', style: 'death-claim', delay: 600, duration: 2200 },
      { text: '', delay: 400 },
      { text: 'Your body grows cold.', effect: 'fade', style: 'death-whisper', delay: 500, duration: 1800 },
      { text: 'Your soul begins to drift...', effect: 'fade', style: 'death-whisper', delay: 600, duration: 1800 },
    ],
  },

  effects: [
    { type: 'pressure', intensity: 'light' },
    { type: 'flicker', intensity: 'light' },
  ],
  effectTimings: [1500, 3500],
};
