/**
 * Color palette for first-person renderer
 * Dark dungeon aesthetic with torch lighting
 */

export const Colors = {
  // Sky/ceiling gradient - very dark, barely visible
  ceilingNear: '#1a1a2e',
  ceilingFar: '#0a0a18',

  // Floor gradient - dark stone
  floorNear: '#2a2a3e',
  floorFar: '#0f0f1a',

  // Walls by tile type - muted, dark
  wall: '#4a4a5e',
  wallDark: '#2a2a3e',
  wallLight: '#5a5a6e',
  wallHighlight: '#6a6a7e',

  // Stone colors for texture - darker
  stone1: '#3a3a4a',
  stone2: '#454555',
  stone3: '#353545',
  mortar: '#2a2a3a',

  // Door
  door: '#6b3510',
  doorFrame: '#4a2815',
  doorHighlight: '#8b4520',

  // Stairs
  stairsUp: '#40da6b',
  stairsDown: '#df69b6',

  // Fog/darkness - true black fog
  fog: 'rgba(0, 0, 0, 0.9)',
  darkness: '#000000',

  // Ambient darkness overlay
  ambientDark: 'rgba(0, 0, 8, 0.85)',

  // Entity colors
  enemy: '#ff5555',
  enemyElite: '#ffb86c',
  item: '#f1fa8c',

  // Floor tiles
  floor: '#1a1a2a',
  explored: '#0f0f18',

  // Torch light - warm orange glow
  torchLight: '#ff9933',
  torchGlow: 'rgba(255, 150, 50, 0.25)',
  torchFlicker: 'rgba(255, 120, 30, 0.3)',

  // Player's torch - carried light source
  playerLight: 'rgba(255, 180, 80, 0.4)',
  playerLightCore: 'rgba(255, 200, 100, 0.6)',
} as const;

export type ColorKey = keyof typeof Colors;
