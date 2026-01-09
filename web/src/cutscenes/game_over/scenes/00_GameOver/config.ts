/**
 * Game Over Scene - Placeholder
 * Shown when player dies in the dungeon
 */

import type { SceneConfig } from '../../../engine/types';

export const scene00GameOver: SceneConfig = {
  meta: {
    id: 'game_over',
    name: 'Game Over',
    duration: 6000,
    fadeIn: 'dramatic',
    fadeOut: 'slow',
  },
  background: {
    type: 'defeat',
    parallax: false,
    animate: true,
  },
  particles: {
    type: 'ash',
    count: 25,
    speed: 'slow',
    opacity: 0.6,
  },
  captions: {
    lines: [
      { text: 'GAME OVER', effect: 'glitch', style: 'dramatic', delay: 500 },
      { text: '', delay: 500 },
      { text: 'The darkness claims another soul...', effect: 'typewriter', style: 'whisper' },
      { text: '', delay: 300 },
      { text: 'Your bones will join the countless others.', effect: 'typewriter' },
    ],
    position: 'center',
    typeSpeed: 45,
  },
  effects: [
    { type: 'flicker', intensity: 'heavy' },
  ],
  effectTimings: [500],
};
