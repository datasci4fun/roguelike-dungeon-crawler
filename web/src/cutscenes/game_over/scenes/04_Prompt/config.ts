/**
 * Scene 04: Prompt
 * Final scene - prompts player to continue or quit
 */

import type { SceneConfig } from '../../../engine/types';

export const scene04Prompt: SceneConfig = {
  meta: {
    id: 'prompt',
    name: 'Continue?',
    duration: 8000,
    fadeIn: 'slow',
    fadeOut: 'fast',
  },

  background: {
    type: 'defeat',
    parallax: false,
    animate: false,
  },

  particles: {
    type: 'dust',
    count: 5,
    speed: 'slow',
    opacity: 0.1,
  },

  captions: {
    position: 'center',
    lines: [
      { text: '', delay: 800 },
      { text: 'Will you rise again?', effect: 'fade', style: 'emphasis', delay: 600, duration: 2500 },
      { text: '', delay: 400 },
      { text: 'Or will you let the darkness win?', effect: 'fade', style: 'death-whisper', delay: 500, duration: 2200 },
    ],
  },
};
