/**
 * Scene 00: Fall
 * The moment of death - sudden, disorienting, final
 */

import type { SceneConfig } from '../../../engine/types';

export const scene00Fall: SceneConfig = {
  meta: {
    id: 'fall',
    name: 'The Fall',
    duration: 4000,
    fadeIn: 'fast',
    fadeOut: 'dramatic',
  },

  background: {
    type: 'defeat',
    parallax: false,
    animate: true,
  },

  particles: {
    type: 'ash',
    count: 40,
    speed: 'fast',
    opacity: 0.5,
  },

  captions: {
    position: 'center',
    lines: [
      { text: 'Your vision blurs.', effect: 'fade', style: 'normal', delay: 300, duration: 1200 },
      { text: '', delay: 200 },
      { text: 'The ground rushes up to meet you.', effect: 'fade', style: 'whisper', delay: 400, duration: 1500 },
    ],
  },

  effects: [
    { type: 'shake', intensity: 'heavy' },
    { type: 'pressure', intensity: 'medium' },
  ],
  effectTimings: [200, 800],
};
