/**
 * Fate Variant: Echo
 * The soul becomes a wandering echo, repeating its final moments
 */

import type { SceneConfig } from '../../../engine/types';

export const scene03FateEcho: SceneConfig = {
  meta: {
    id: 'fate-echo',
    name: 'Fate: Echo',
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
    type: 'embers',
    count: 12,
    speed: 'slow',
    opacity: 0.25,
  },

  captions: {
    position: 'center',
    lines: [
      { text: 'But the abyss does not forget.', effect: 'fade', style: 'death-whisper', delay: 600, duration: 2000 },
      { text: '', delay: 400 },
      { text: 'Your final moments echo through the stone.', effect: 'fade', style: 'death-claim', delay: 700, duration: 2400 },
      { text: '', delay: 300 },
      { text: 'A ghost now walks where you once stood.', effect: 'fade', style: 'death-whisper', delay: 600, duration: 2200 },
    ],
  },

  effects: [
    { type: 'flicker', intensity: 'light' },
  ],
  effectTimings: [2000],
};
