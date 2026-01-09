/**
 * Fate Variant: Silence
 * The soul dissolves into the eternal silence of the abyss
 */

import type { SceneConfig } from '../../../engine/types';

export const scene03FateSilence: SceneConfig = {
  meta: {
    id: 'fate-silence',
    name: 'Fate: Silence',
    duration: 7000,
    fadeIn: 'slow',
    fadeOut: 'slow',
  },

  background: {
    type: 'defeat',
    parallax: false,
    animate: false,
  },

  particles: {
    type: 'dust',
    count: 8,
    speed: 'slow',
    opacity: 0.15,
  },

  captions: {
    position: 'center',
    lines: [
      { text: 'The silence takes you.', effect: 'fade', style: 'death-whisper', delay: 800, duration: 2000 },
      { text: '', delay: 500 },
      { text: 'No voice. No thought. No pain.', effect: 'fade', style: 'death-claim', delay: 700, duration: 2400 },
      { text: '', delay: 400 },
      { text: 'You become the dark itself.', effect: 'fade', style: 'death-whisper', delay: 600, duration: 2200 },
    ],
  },

  effects: [
    { type: 'pressure', intensity: 'medium' },
  ],
  effectTimings: [2500],
};
