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
 * Simulates torch light falloff - bright near player, pitch black at distance
 */
export function getDepthFade(depth: number, minFade: number = 0.08): number {
  // Aggressive exponential falloff - darkness dominates
  // Light barely reaches beyond 3-4 tiles
  const falloff = Math.pow(0.6, depth);
  return Math.max(minFade, falloff);
}

/**
 * Calculate fog amount for a given depth
 * Pure black fog that swallows everything at distance
 */
export function getFogAmount(depth: number, maxFog: number = 1.0): number {
  // Aggressive fog - pitch black by depth 4-5
  // depth 1: ~0.35, depth 2: ~0.58, depth 3: ~0.73, depth 4: ~0.83, depth 5+: ~0.9+
  const fog = 1 - Math.pow(0.65, depth);
  return Math.min(maxFog, fog);
}

/**
 * Calculate torch light intensity at a given position
 * @param depth - Distance from viewer
 * @param torchDepth - Depth where torch is located
 * @param torchOffset - Horizontal offset of torch (-1 to 1)
 * @param viewOffset - Horizontal offset of the point being lit
 */
export function getTorchLight(
  depth: number,
  torchDepth: number,
  torchOffset: number = 0,
  viewOffset: number = 0
): number {
  // Distance from torch
  const dz = depth - torchDepth;
  const dx = viewOffset - torchOffset;
  const distance = Math.sqrt(dz * dz + dx * dx);

  // Light falloff with distance (inverse square-ish)
  const intensity = Math.max(0, 1 - distance * 0.4);
  return intensity * intensity; // Square for softer falloff
}
