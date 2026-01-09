/**
 * Scene 05: The Present Day
 * Grounded dread — keep the entrance background static so it reads “real”.
 */

import type { SceneConfig } from '../../../engine/types';

export const scene05Entrance: SceneConfig = {
  meta: {
    id: 'present',
    name: 'The Present Day',
    duration: 15000,
    fadeIn: 'slow',
    fadeOut: 'slow',
  },

  // Background attempt #2: remove parallax + animation (the source of “weird shapes”).
  background: {
    type: 'entrance',
    parallax: false,
    animate: false,
  },

  particles: {
    type: 'embers',
    count: 22,
    speed: 'slow',
    opacity: 0.38,
  },

  captions: {
    position: 'center',
    lines: [
      { text: 'THE PRESENT DAY', effect: 'fade', style: 'dramatic', delay: 650, duration: 1300 },

      { text: '', delay: 520 },

      { text: 'Now the hillside has split.', effect: 'fade', style: 'normal', delay: 850, duration: 1700 },

      { text: '', delay: 420 },

      { text: 'A mouth of stone exhales air that has never seen the sun.', effect: 'fade', style: 'normal', delay: 900, duration: 2200 },

      { text: '', delay: 520 },

      { text: 'Treasure hunters went first. None returned.', effect: 'fade', style: 'emphasis', delay: 950, duration: 2000 },

      { text: 'Then mercenaries. Then heroes.', effect: 'fade', style: 'normal', delay: 700, duration: 1700 },

      { text: '', delay: 520 },

      { text: 'All swallowed. All silent.', effect: 'fade', style: 'whisper', delay: 950, duration: 2400 },
    ],
  },

  effects: [{ type: 'pressure', intensity: 'light' }],
  effectTimings: [9400],
};
