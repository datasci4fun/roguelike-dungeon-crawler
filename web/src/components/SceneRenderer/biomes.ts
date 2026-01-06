/**
 * Biome theme definitions for different dungeon environments
 * Each biome has its own color palette and ambient settings
 */

export interface BiomeTheme {
  id: string;
  name: string;
  // Base colors (RGB values 0-255)
  floorColor: [number, number, number];
  ceilingColor: [number, number, number];
  wallColor: [number, number, number];
  wallHighlight: [number, number, number];
  // Ambient light color tint
  ambientTint: [number, number, number];
  // Fog color
  fogColor: [number, number, number];
  // Torch/light color
  lightColor: [number, number, number];
  // Special effects
  hasParticles: 'dust' | 'snow' | 'spores' | 'embers' | 'none';
  particleColor: [number, number, number];
}

export const BIOMES: Record<string, BiomeTheme> = {
  dungeon: {
    id: 'dungeon',
    name: 'Stone Dungeon',
    floorColor: [40, 35, 30],
    ceilingColor: [20, 18, 15],
    wallColor: [74, 74, 94],
    wallHighlight: [90, 90, 110],
    ambientTint: [255, 140, 50],
    fogColor: [0, 0, 0],
    lightColor: [255, 150, 80],
    hasParticles: 'dust',
    particleColor: [180, 170, 150],
  },

  ice: {
    id: 'ice',
    name: 'Ice Cavern',
    floorColor: [40, 50, 60],
    ceilingColor: [20, 30, 40],
    wallColor: [80, 100, 130],
    wallHighlight: [120, 150, 180],
    ambientTint: [100, 180, 255],
    fogColor: [20, 40, 60],
    lightColor: [150, 200, 255],
    hasParticles: 'snow',
    particleColor: [220, 240, 255],
  },

  forest: {
    id: 'forest',
    name: 'Forest Depths',
    floorColor: [30, 40, 25],
    ceilingColor: [15, 25, 10],
    wallColor: [50, 70, 45],
    wallHighlight: [70, 100, 60],
    ambientTint: [100, 200, 80],
    fogColor: [10, 20, 5],
    lightColor: [150, 255, 100],
    hasParticles: 'spores',
    particleColor: [150, 255, 100],
  },

  lava: {
    id: 'lava',
    name: 'Volcanic Depths',
    floorColor: [50, 25, 15],
    ceilingColor: [30, 15, 10],
    wallColor: [80, 40, 30],
    wallHighlight: [120, 60, 40],
    ambientTint: [255, 80, 20],
    fogColor: [30, 10, 0],
    lightColor: [255, 100, 30],
    hasParticles: 'embers',
    particleColor: [255, 150, 50],
  },

  crypt: {
    id: 'crypt',
    name: 'Ancient Crypt',
    floorColor: [35, 30, 35],
    ceilingColor: [18, 15, 20],
    wallColor: [60, 55, 70],
    wallHighlight: [80, 75, 95],
    ambientTint: [150, 100, 200],
    fogColor: [10, 5, 15],
    lightColor: [180, 150, 255],
    hasParticles: 'dust',
    particleColor: [150, 130, 180],
  },

  sewer: {
    id: 'sewer',
    name: 'Sewer',
    floorColor: [30, 35, 30],
    ceilingColor: [15, 20, 15],
    wallColor: [50, 60, 50],
    wallHighlight: [70, 85, 70],
    ambientTint: [100, 150, 100],
    fogColor: [10, 15, 10],
    lightColor: [150, 200, 150],
    hasParticles: 'none',
    particleColor: [0, 0, 0],
  },

  library: {
    id: 'library',
    name: 'Ancient Library',
    floorColor: [45, 35, 25],
    ceilingColor: [25, 20, 15],
    wallColor: [90, 70, 50],
    wallHighlight: [120, 95, 70],
    ambientTint: [255, 200, 100],
    fogColor: [15, 10, 5],
    lightColor: [255, 220, 150],
    hasParticles: 'dust',
    particleColor: [200, 180, 140],
  },

  crystal: {
    id: 'crystal',
    name: 'Crystal Cave',
    floorColor: [35, 35, 50],
    ceilingColor: [20, 20, 35],
    wallColor: [70, 70, 110],
    wallHighlight: [100, 100, 160],
    ambientTint: [180, 150, 255],
    fogColor: [15, 10, 25],
    lightColor: [200, 180, 255],
    hasParticles: 'dust',
    particleColor: [200, 200, 255],
  },
};

export type BiomeId = keyof typeof BIOMES;

/**
 * Get a biome theme by ID, with fallback to dungeon
 */
export function getBiome(id: string): BiomeTheme {
  return BIOMES[id] || BIOMES.dungeon;
}

/**
 * Apply brightness adjustment to RGB color
 */
export function adjustBrightness(
  color: [number, number, number],
  brightness: number
): [number, number, number] {
  return [
    Math.min(255, Math.max(0, Math.floor(color[0] * brightness))),
    Math.min(255, Math.max(0, Math.floor(color[1] * brightness))),
    Math.min(255, Math.max(0, Math.floor(color[2] * brightness))),
  ];
}

/**
 * Mix two colors with a ratio (0 = all color1, 1 = all color2)
 */
export function mixColors(
  color1: [number, number, number],
  color2: [number, number, number],
  ratio: number
): [number, number, number] {
  const r = 1 - ratio;
  return [
    Math.floor(color1[0] * r + color2[0] * ratio),
    Math.floor(color1[1] * r + color2[1] * ratio),
    Math.floor(color1[2] * r + color2[2] * ratio),
  ];
}

/**
 * Convert RGB array to CSS color string
 */
export function rgbToString(color: [number, number, number], alpha: number = 1): string {
  if (alpha < 1) {
    return `rgba(${color[0]}, ${color[1]}, ${color[2]}, ${alpha})`;
  }
  return `rgb(${color[0]}, ${color[1]}, ${color[2]})`;
}
