/**
 * Perspective projection utilities for first-person rendering
 */

export interface Projection {
  wallTop: number;
  wallBottom: number;
  x: number;
  scale: number;
  horizon: number;
}

/**
 * Calculate perspective projection for a point at given depth
 * @param canvasWidth - Canvas width in pixels
 * @param canvasHeight - Canvas height in pixels
 * @param depth - Distance from viewer (1 = closest)
 * @param xOffset - Horizontal offset (-1 to 1, where 0 is center)
 */
export function getProjection(
  canvasWidth: number,
  canvasHeight: number,
  depth: number,
  xOffset: number = 0
): Projection {
  const fov = 0.8; // Field of view factor
  const horizon = canvasHeight / 2;
  const scale = 1 / (depth * fov + 0.5);

  const wallHeight = canvasHeight * 0.7 * scale;
  const wallTop = horizon - wallHeight / 2;
  const wallBottom = horizon + wallHeight / 2;

  // X position based on offset and depth
  const centerX = canvasWidth / 2;
  const spread = canvasWidth * 0.5 * scale;
  const x = centerX + xOffset * spread;

  return { wallTop, wallBottom, x, scale, horizon };
}

/**
 * Seeded random number generator for consistent textures
 */
export function seededRandom(seed: number): number {
  const x = Math.sin(seed * 12.9898) * 43758.5453;
  return x - Math.floor(x);
}

/**
 * Calculate depth-based fade factor for fog/lighting
 */
export function getDepthFade(depth: number, minFade: number = 0.3): number {
  return Math.max(minFade, 1 - depth * 0.1);
}

/**
 * Calculate fog amount for a given depth
 */
export function getFogAmount(depth: number, maxFog: number = 0.6): number {
  return Math.min(maxFog, depth * 0.08);
}
