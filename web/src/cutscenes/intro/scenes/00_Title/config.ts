/**
 * Scene 00: Title Screen
 * Opening title with ASCII art and atmospheric effects
 */

import type { SceneConfig } from '../../../engine/types';

export const TITLE_ART = [
  '  ____                        _ _ _        ',
  ' |  _ \\ ___   __ _ _   _  ___| (_) | _____ ',
  ' | |_) / _ \\ / _` | | | |/ _ \\ | | |/ / _ \\',
  ' |  _ < (_) | (_| | |_| |  __/ | |   <  __/',
  ' |_| \\_\\___/ \\__, |\\__,_|\\___|_|_|_|\\_\\___|',
  '             |___/                         ',
];

export const scene00Title: SceneConfig = {
  meta: {
    id: 'title',
    name: 'Title Screen',
    duration: 5000,
    fadeIn: 'slow',
    fadeOut: 'slow',
  },
  background: {
    type: 'title',
    parallax: true,
    animate: true,
  },
  particles: {
    type: 'stars',
    count: 50,
    speed: 'slow',
    opacity: 0.8,
  },
  // Title scene uses dedicated TitleScreen component instead of captions
  music: 'intro',
};
