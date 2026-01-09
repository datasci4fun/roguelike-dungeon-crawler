/**
 * Scene 02: Your Legend Is Written (base)
 * Coronation + ghost mechanic hook
 * Note: Legacy variant lines are inserted by the factory function
 */

import type { SceneConfig, CaptionLine } from '../../../engine/types';

// Base lines before legacy variant insertion point
export const legendLinesStart: CaptionLine[] = [
  { text: 'YOUR LEGEND IS WRITTEN', effect: 'fade', style: 'dramatic', delay: 800, duration: 2200 },
  { text: '', delay: 500 },
  { text: 'Songs will be sung in Valdris—', effect: 'fade', delay: 400, duration: 1800 },
  { text: 'but songs are not how the dungeon remembers.', effect: 'fade', delay: 400, duration: 2000 },
  { text: '', delay: 500 },
  { text: 'It remembers in echoes.', effect: 'fade', delay: 400, duration: 1600 },
  { text: 'It remembers in footsteps.', effect: 'fade', delay: 400, duration: 1600 },
  { text: '', delay: 500 },
  { text: 'You did not leave alone.', effect: 'fade', style: 'emphasis', delay: 500, duration: 1800 },
  { text: 'The dungeon recorded you.', effect: 'fade', style: 'dramatic', delay: 600, duration: 2000 },
];

// Lines after legacy variant (the final motif)
export const legendLinesEnd: CaptionLine[] = [
  { text: '', delay: 500 },
  { text: 'In another descent, you may be seen again.', effect: 'fade', style: 'whisper', delay: 700, duration: 2400 },
];

// Base scene config (without legacy variant - factory will build complete version)
export const scene02LegendBase: Omit<SceneConfig, 'captions'> & { captions: Omit<SceneConfig['captions'], 'lines'> } = {
  meta: {
    id: 'victory_legend',
    name: 'Your Legend Is Written',
    duration: 16000,
    fadeIn: 'slow',
    fadeOut: 'dramatic',
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
    opacity: 0.7,
  },

  captions: {
    position: 'center',
  },

  fxCues: [
    {
      onText: 'The dungeon recorded you.',
      match: 'exact',
      events: [
        { type: 'flash', intensity: 'heavy' },
        { type: 'pressure', intensity: 'heavy' },
      ],
    },
  ],
};
