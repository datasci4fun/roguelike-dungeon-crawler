/**
 * Perspective projection utilities for first-person rendering
 *
 * Coordinate system:
 * - xOffset: camera-space lateral offset in tile units (-1 = left wall, +1 = right wall)
 * - depth:   forward distance (z-axis), where 1 = one tile ahead
 * - scale:   visual sizing factor for callers (entities, UI); NOT the raw depth inverse
 *
 * Projection math:
 * - screenX = centerX + focalX * (xOffset / z)
 * - scale = calibration / z
 *
 * This ensures entities at the same depth maintain consistent lateral spacing
 * regardless of their offset from center.
 */

export interface Projection {
  wallTop: number;
  wallBottom: number;
  x: number;
  scale: number;
  horizon: number;
}

/**
 * Calibration constants for perspective projection.
 * Adjust these to tune visual appearance without changing projection math.
 * Exported so z-buffer and other systems can use consistent values.
 */
export const PROJECTION_CONFIG = {
  // Minimum depth to prevent near-plane explosion (z = max(depth, minDepth))
  minDepth: 0.3,
  // Scale calibration: at depth=1, scale ≈ 0.77 (matches previous visual size)
  scaleCalibration: 0.77,
  // Horizontal focal length factor (relative to canvas width)
  // 0.5 = ~90° FOV feel; reduce for narrower FOV
  focalXFactor: 0.5,
  // Wall height factor (relative to canvas height)
  wallHeightFactor: 0.7,
};

/**
 * Calculate perspective projection for a point at given depth
 *
 * Uses true perspective: screenX = centerX + focalX * (camX / z)
 * This ensures consistent spacing for entities at the same depth.
 *
 * @param canvasWidth - Canvas width in pixels
 * @param canvasHeight - Canvas height in pixels
 * @param depth - Distance from viewer (1 = one tile ahead)
 * @param xOffset - Horizontal offset in tile units (e.g., -2 to +2 for tiles left/right of center)
 */
export function getProjection(
  canvasWidth: number,
  canvasHeight: number,
  depth: number,
  xOffset: number = 0
): Projection {
  const { minDepth, scaleCalibration, focalXFactor, wallHeightFactor } = PROJECTION_CONFIG;

  // Clamp depth to prevent near-plane explosion
  const z = Math.max(depth, minDepth);

  const horizon = canvasHeight / 2;

  // Scale factor using true perspective (1/z) with calibration constant
  const scale = scaleCalibration / z;

  // Wall height: perspective-scaled
  const wallHeight = canvasHeight * wallHeightFactor * scale;
  const wallTop = horizon - wallHeight / 2;
  const wallBottom = horizon + wallHeight / 2;

  // True perspective X projection: screenX = centerX + focalX * (camX / z)
  const centerX = canvasWidth / 2;
  const focalX = canvasWidth * focalXFactor;
  const x = centerX + focalX * (xOffset / z);

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
 * Simulates torch light falloff - bright near player, dimmer at distance
 * Minimum ensures walls are always at least somewhat visible
 */
export function getDepthFade(depth: number, minFade: number = 0.25): number {
  // Exponential falloff with higher minimum so distant walls stay visible
  // depth 1: ~0.6, depth 2: ~0.36, depth 3+: ~0.25 minimum
  const falloff = Math.pow(0.6, depth);
  return Math.max(minFade, falloff);
}

/**
 * Calculate fog amount for a given depth
 * Fog that darkens distant areas but never completely obscures them
 * Walls must always be visible if in FOV - can't have floating torches
 */
export function getFogAmount(depth: number, maxFog: number = 0.6): number {
  // Fog increases with distance but caps at 60% so walls remain clearly visible
  // depth 1: ~0.35, depth 2: ~0.58, depth 3+: capped at 0.60
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
