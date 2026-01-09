/**
 * Scene 06: Your Story Begins
 * Vow scene — effects are synced to line reveal completion via fxCues.
 */

import type { SceneConfig } from '../../../engine/types';

export const scene06You: SceneConfig = {
  meta: {
    id: 'you',
    name: 'Your Story Begins',
    duration: 18000,
    fadeIn: 'dramatic',
    fadeOut: 'dramatic',
  },

  background: {
    type: 'entrance',
    parallax: true,
    animate: true,
  },

  particles: {
    type: 'embers',
    count: 34,
    speed: 'slow',
    opacity: 0.75,
  },

  captions: {
    position: 'center',
    lines: [
      { text: 'YOUR STORY BEGINS', effect: 'fade', style: 'dramatic', delay: 650, duration: 1400 },

      { text: '', delay: 520 },

      { text: 'And now you stand before the ancient gate.', effect: 'fade', style: 'normal', delay: 900, duration: 1700 },

      { text: '', delay: 420 },

      { text: 'Gold. Glory. Redemption.', effect: 'fade', style: 'emphasis', delay: 800, duration: 1500 },
      { text: 'Call it what you like—', effect: 'fade', style: 'whisper', delay: 650, duration: 1200 },

      { text: '', delay: 520 },

      { text: 'Down there, only one thing matters.', effect: 'fade', style: 'normal', delay: 900, duration: 1500 },

      { text: 'Only survival.', effect: 'fade', style: 'dramatic', delay: 650, duration: 1400 },

      { text: '', delay: 600 },

      { text: 'Steel your nerves.', effect: 'fade', style: 'emphasis', delay: 700, duration: 1100 },
      { text: 'Ready your blade.', effect: 'fade', style: 'emphasis', delay: 600, duration: 1100 },
      { text: 'Light your torch.', effect: 'fade', style: 'emphasis', delay: 600, duration: 1200 },

      { text: '', delay: 650 },

      { text: 'The dungeon awaits.', effect: 'fade', style: 'emphasis', delay: 950, duration: 2200 },
    ],
  },

  // NEW: effect cues synced to line reveal completion
  fxCues: [
    {
      onText: 'Only survival.',
      match: 'exact',
      events: [
        { type: 'pressure', intensity: 'medium' },
        { type: 'flash', intensity: 'medium' },
        { type: 'shake', intensity: 'light' },
      ],
    },
    {
      onText: 'The dungeon awaits.',
      match: 'prefix',
      events: [
        { type: 'pressure', intensity: 'heavy' },
        { type: 'flash', intensity: 'heavy' },
      ],
    },
  ],
};
