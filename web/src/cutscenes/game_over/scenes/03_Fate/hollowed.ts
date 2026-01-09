/**
 * Fate Variant: Hollowed
 * The soul is hollowed out, becoming a mindless shade
 */

import type { SceneConfig } from '../../../engine/types';

export const scene03FateHollowed: SceneConfig = {
  meta: {
    id: 'fate-hollowed',
    name: 'Fate: Hollowed',
    duration: 7000,
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
    count: 10,
    speed: 'slow',
    opacity: 0.2,
  },

  captions: {
    position: 'center',
    lines: [
      { text: 'The darkness hollows what remains.', effect: 'fade', style: 'death-whisper', delay: 600, duration: 2000 },
      { text: '', delay: 400 },
      { text: 'Your purpose fades. Your name... forgotten.', effect: 'fade', style: 'death-claim', delay: 700, duration: 2400 },
      { text: '', delay: 300 },
      { text: 'Only hunger endures.', effect: 'fade', style: 'death-whisper', delay: 600, duration: 2200 },
    ],
  },

  effects: [
    { type: 'pressure', intensity: 'light' },
  ],
  effectTimings: [1800],
};
