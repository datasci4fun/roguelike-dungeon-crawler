/**
 * Victory Scene - Placeholder
 * Shown when player completes the dungeon
 */

import type { SceneConfig } from '../../../engine/types';

export const scene00Victory: SceneConfig = {
  meta: {
    id: 'victory',
    name: 'Victory',
    duration: 8000,
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
    count: 30,
    speed: 'slow',
    opacity: 0.8,
  },
  captions: {
    lines: [
      { text: 'VICTORY', effect: 'fade', style: 'dramatic', delay: 500 },
      { text: '', delay: 500 },
      { text: 'You have conquered the depths.', effect: 'typewriter' },
      { text: '', delay: 200 },
      { text: 'The darkness recedes before your might.', effect: 'typewriter' },
      { text: '', delay: 300 },
      { text: 'A hero emerges from the shadows...', effect: 'typewriter', style: 'emphasis' },
    ],
    position: 'center',
    typeSpeed: 40,
  },
  effects: [
    { type: 'flash', intensity: 'medium' },
  ],
  effectTimings: [1000],
};
