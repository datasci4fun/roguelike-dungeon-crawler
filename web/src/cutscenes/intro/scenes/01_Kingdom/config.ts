/**
 * Scene 01: The Kingdom of Valdris
 * Golden-age establishing beat — calm, luminous, stable.
 */

import type { SceneConfig } from '../../../engine/types';

export const scene01Kingdom: SceneConfig = {
  meta: {
    id: 'kingdom',
    name: 'The Kingdom of Valdris',
    duration: 15000, // enough time for all caption beats + holds
    fadeIn: 'slow',
    fadeOut: 'slow',
  },

  background: {
    type: 'kingdom',
    parallax: true,
    animate: true,
  },

  particles: {
    type: 'dust',
    count: 28,
    speed: 'slow',
    opacity: 0.28,
  },

  captions: {
    position: 'center',
    lines: [
      { text: 'THE KINGDOM OF VALDRIS', effect: 'fade', style: 'dramatic', delay: 650, duration: 1500 },

      { text: '', delay: 600 },

      { text: 'Before the world broke, Valdris crowned the mountain in dawnfire.', effect: 'fade', style: 'normal', delay: 900, duration: 2600 },

      { text: '', delay: 500 },

      { text: 'Its banners cut the wind. Its bells named the hours.', effect: 'fade', style: 'normal', delay: 900, duration: 2200 },

      { text: 'Gold flowed. Oaths held.', effect: 'fade', style: 'emphasis', delay: 700, duration: 1900 },

      { text: '', delay: 600 },

      { text: 'And for a time… the light still answered when called.', effect: 'fade', style: 'whisper', delay: 900, duration: 2700 },
    ],
  },
};
