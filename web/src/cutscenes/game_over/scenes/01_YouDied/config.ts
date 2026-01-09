/**
 * Scene 01: You Died
 * The iconic death announcement - Dark Souls inspired
 */

import type { SceneConfig } from '../../../engine/types';

export const scene01YouDied: SceneConfig = {
  meta: {
    id: 'you-died',
    name: 'You Died',
    duration: 5000,
    fadeIn: 'dramatic',
    fadeOut: 'slow',
  },

  background: {
    type: 'defeat',
    parallax: false,
    animate: false,
  },

  particles: {
    type: 'ash',
    count: 20,
    speed: 'slow',
    opacity: 0.4,
  },

  captions: {
    position: 'center',
    lines: [
      { text: 'YOU DIED', effect: 'fade', style: 'death-title', delay: 800, duration: 3500 },
    ],
  },

  effects: [
    { type: 'pressure', intensity: 'heavy' },
  ],
  effectTimings: [1000],
};
