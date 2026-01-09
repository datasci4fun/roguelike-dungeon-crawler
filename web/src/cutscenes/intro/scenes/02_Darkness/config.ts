/**
 * Scene 02: The Coming Darkness
 * Catastrophe beat — reality breaks, then the world follows.
 */

import type { SceneConfig } from '../../../engine/types';

export const scene02Darkness: SceneConfig = {
  meta: {
    id: 'darkness',
    name: 'The Coming Darkness',
    duration: 12000, // give the beats time to land
    fadeIn: 'dramatic',
    fadeOut: 'dramatic',
  },

  background: {
    type: 'darkness',
    parallax: true,
    animate: true,
  },

  // A heavy, slow-moving corruption layer.
  particles: {
    type: 'darkness',
    count: 28,
    speed: 'slow',
    opacity: 0.75,
  },

  captions: {
    position: 'center',
    lines: [
      // Title stamp — less luxurious than Kingdom, more ominous
      { text: 'THE COMING DARKNESS', effect: 'fade', style: 'dramatic', delay: 450, duration: 1200 },

      { text: '', delay: 420 },

      // First fracture beat
      { text: 'Then the sun stuttered.', effect: 'fade', style: 'emphasis', delay: 650, duration: 1400 },

      { text: '', delay: 360 },

      // The “wrongness” line (use glitch very sparingly)
      { text: 'A shadow fell that did not belong to any sky—', effect: 'glitch', style: 'normal', delay: 650, duration: 1600 },

      // Corruption spreads
      { text: 'it ate the light and taught the land to rot.', effect: 'fade', style: 'normal', delay: 520, duration: 1700 },

      { text: '', delay: 420 },

      // Impact line: hard, cold, final
      { text: 'The dead rose. The living ran.', effect: 'fade', style: 'whisper', delay: 650, duration: 2200 },
    ],
  },

  // Scripted beats — these line up with the new pacing above.
  effects: [
    // Soft flash on “sun stuttered”
    { type: 'flash', intensity: 'light' },

    // Final verdict hit
    { type: 'flash', intensity: 'heavy' },
    { type: 'shake', intensity: 'heavy' },
  ],

  // Timings are from scene start. With dramatic fade-in, this lands just after captions begin.
  // Tune these visually if needed (debug makes it easy).
  effectTimings: [
    3200, // flash: right as “sun stuttered” appears
    8600, // heavy flash: on “dead rose / living ran”
    8620, // shake: almost simultaneous, slightly after flash
  ],
};
