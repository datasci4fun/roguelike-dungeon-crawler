/**
 * Color palette for first-person renderer
 */

export const Colors = {
  // Sky/ceiling gradient
  ceilingNear: '#1a1a2e',
  ceilingFar: '#0a0a14',

  // Floor gradient
  floorNear: '#2a2a3e',
  floorFar: '#1a1a28',

  // Walls by tile type
  wall: '#5a5a6e',
  wallDark: '#3a3a4e',
  wallLight: '#6a6a7e',
  wallHighlight: '#7a7a8e',

  // Stone colors for texture
  stone1: '#4a4a5a',
  stone2: '#555565',
  stone3: '#454555',
  mortar: '#3a3a4a',

  // Door
  door: '#8b4513',
  doorFrame: '#654321',
  doorHighlight: '#a55a23',

  // Stairs
  stairsUp: '#50fa7b',
  stairsDown: '#ff79c6',

  // Fog/darkness
  fog: 'rgba(10, 10, 20, 0.8)',
  darkness: '#0a0a14',

  // Entity colors
  enemy: '#ff5555',
  enemyElite: '#ffb86c',
  item: '#f1fa8c',

  // Floor tiles
  floor: '#252535',
  explored: '#1a1a28',

  // Torch light
  torchLight: '#ffaa44',
  torchGlow: 'rgba(255, 170, 68, 0.15)',
} as const;

export type ColorKey = keyof typeof Colors;
