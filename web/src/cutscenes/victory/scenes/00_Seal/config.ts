/**
 * Scene 00: The Last Seal
 * Sacred, heavy victory - the abyss is made to sleep
 */

import type { SceneConfig } from '../../../engine/types';

export const scene00Seal: SceneConfig = {
  meta: {
    id: 'victory_seal',
    name: 'The Last Seal',
    duration: 12000,
    fadeIn: 'dramatic',
    fadeOut: 'slow',
  },

  background: {
    type: 'victory',
    parallax: true,
    animate: true,
  },

  particles: {
    type: 'magic',
    count: 25,
    speed: 'slow',
    opacity: 0.6,
  },

  captions: {
    position: 'center',
    lines: [
      { text: 'THE LAST SEAL', effect: 'fade', style: 'dramatic', delay: 800, duration: 2200 },
      { text: '', delay: 500 },
      { text: 'It is quiet—', effect: 'fade', delay: 400, duration: 1600 },
      { text: 'not peace, but the absence of hunger.', effect: 'fade', delay: 300, duration: 1800 },
      { text: '', delay: 500 },
      { text: 'Stone remembers the words that bound it.', effect: 'fade', delay: 400, duration: 2000 },
      { text: 'The dark recoils… and folds back into itself.', effect: 'fade', delay: 400, duration: 2200 },
      { text: '', delay: 500 },
      { text: 'You did not end the abyss.', effect: 'fade', style: 'emphasis', delay: 500, duration: 1800 },
      { text: 'You made it sleep.', effect: 'fade', style: 'dramatic', delay: 600, duration: 2000 },
    ],
  },

  fxCues: [
    {
      onText: 'THE LAST SEAL',
      match: 'exact',
      events: [
        { type: 'flash', intensity: 'medium' },
        { type: 'pressure', intensity: 'medium' },
      ],
    },
    {
      onText: 'You made it sleep.',
      match: 'exact',
      events: [
        { type: 'pressure', intensity: 'medium' },
      ],
    },
  ],
};
