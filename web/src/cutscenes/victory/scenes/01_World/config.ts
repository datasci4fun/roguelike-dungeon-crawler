/**
 * Scene 01: The World Above
 * Relief with uncanny carryover - something follows
 */

import type { SceneConfig } from '../../../engine/types';

export const scene01World: SceneConfig = {
  meta: {
    id: 'victory_world',
    name: 'The World Above',
    duration: 11000,
    fadeIn: 'slow',
    fadeOut: 'slow',
  },

  background: {
    type: 'victory',
    parallax: true,
    animate: true,
  },

  particles: {
    type: 'magic',
    count: 20,
    speed: 'slow',
    opacity: 0.5,
  },

  captions: {
    position: 'center',
    lines: [
      { text: 'THE WORLD ABOVE', effect: 'fade', style: 'dramatic', delay: 700, duration: 2000 },
      { text: '', delay: 500 },
      { text: 'The air tastes brighter than you remember.', effect: 'fade', delay: 400, duration: 2000 },
      { text: 'Wind moves like a blessing across your skin.', effect: 'fade', delay: 400, duration: 2000 },
      { text: '', delay: 500 },
      { text: 'Behind you, the mountain holds its breath.', effect: 'fade', delay: 400, duration: 2000 },
      { text: 'And yet… something follows in your shadow.', effect: 'fade', style: 'emphasis', delay: 500, duration: 2200 },
      { text: '', delay: 400 },
      { text: 'Not a monster.', effect: 'fade', style: 'whisper', delay: 400, duration: 1400 },
      { text: 'A memory.', effect: 'fade', style: 'whisper', delay: 500, duration: 1600 },
    ],
  },

  fxCues: [
    {
      onText: 'something follows in your shadow.',
      match: 'includes',
      events: [
        { type: 'pressure', intensity: 'light' },
      ],
    },
  ],
};
