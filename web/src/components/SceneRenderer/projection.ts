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
  // Vertical field of view in degrees (matches Three.js camera FOV)
  verticalFOV: 75,
  // Tile size in world units (matches TILE_SIZE in 3D renderer)
  tileSize: 2,
  // Wall height in world units (matches WALL_HEIGHT in 3D renderer)
  wallHeight: 2.5,
  // Camera height in world units (matches CAMERA_HEIGHT in 3D renderer)
  cameraHeight: 1.4,
};

/**
 * Fog/brightness tuning in tile-depth units.
 * Goal: avoid "depth 1 -> 2 instantly dark" banding by delaying and smoothing ramps.
 */
export const FOG_CONFIG = {
  // Brightness fade (used by walls/floor/ceiling via getDepthFade)
  fadeNear: 1.0,     // tiles: start darkening after ~1 tile
  fadeFar: 7.0,      // tiles: reach minFade around here
  nearFade: 0.85,    // brightness multiplier at/near fadeNear (keeps close walls from being too dark)

  // Fog opacity (used by floor overlays + entity overlays via getFogAmount)
  fogNear: 2.0,      // tiles: start fogging after ~2 tiles
  fogFar: 8.0,       // tiles: reach maxFog around here (your renderer depth is 8)
};

function clamp01(t: number): number {
  return Math.max(0, Math.min(1, t));
}

function smoothstep01(t: number): number {
  // cubic Hermite: smooth in/out
  return t * t * (3 - 2 * t);
}

function smoothstep(edge0: number, edge1: number, x: number): number {
  if (edge1 <= edge0) return x >= edge1 ? 1 : 0;
  return smoothstep01(clamp01((x - edge0) / (edge1 - edge0)));
}

/**
 * Calculate perspective projection for a point at given depth
 *
 * Uses true perspective projection matching Three.js camera behavior.
 * Both X and Y projections use the same focal length to maintain aspect ratio.
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
  const { minDepth, verticalFOV, tileSize, wallHeight, cameraHeight } = PROJECTION_CONFIG;

  // Clamp depth to prevent near-plane explosion
  const clampedDepth = Math.max(depth, minDepth);

  // Convert to world units (matches 3D renderer's coordinate system)
  const worldZ = clampedDepth * tileSize;
  const worldX = xOffset * tileSize;

  const horizon = canvasHeight / 2;

  // Calculate focal length from vertical FOV (same formula as Three.js)
  // focalLength = (canvasHeight / 2) / tan(FOV / 2)
  const fovRadians = (verticalFOV * Math.PI) / 180;
  const focalLength = (canvasHeight / 2) / Math.tan(fovRadians / 2);

  // Scale factor for entities/sizing (based on world distance)
  const scale = tileSize / worldZ;

  // True perspective projection for wall top and bottom
  // Wall top is at world y = wallHeight, wall bottom is at y = 0
  // Camera is at y = cameraHeight
  // Screen y = horizon - focalLength * (worldY - cameraHeight) / worldZ
  const wallTop = horizon - focalLength * (wallHeight - cameraHeight) / worldZ;
  const wallBottom = horizon - focalLength * (0 - cameraHeight) / worldZ;

  // True perspective X projection using focal length
  // screenX = centerX + focalLength * worldX / worldZ
  const centerX = canvasWidth / 2;
  const x = centerX + focalLength * worldX / worldZ;

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
  // Smooth ramp instead of steep exponential. Keeps early depths from snapping dark.
  const { fadeNear, fadeFar, nearFade } = FOG_CONFIG;
  const startFade = Math.max(nearFade, minFade);
  const t = smoothstep(fadeNear, fadeFar, depth);
  return startFade - (startFade - minFade) * t;
}

/**
 * Calculate fog amount for a given depth
 * Fog that darkens distant areas but never completely obscures them
 * Walls must always be visible if in FOV - can't have floating torches
 */
export function getFogAmount(depth: number, maxFog: number = 0.6): number {
  // Smooth ramp; starts later and reaches maxFog near your view max depth.
  const { fogNear, fogFar } = FOG_CONFIG;
  const t = smoothstep(fogNear, fogFar, depth);
  return maxFog * t;
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
