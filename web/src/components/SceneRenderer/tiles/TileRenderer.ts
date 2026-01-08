/**
 * TileRenderer - Draws tiles with perspective projection
 *
 * Handles drawing floor tiles, wall tiles, and ceiling tiles
 * with proper perspective transformation.
 *
 * Uses triangle-based affine texture mapping with quantized slice boundaries
 * to eliminate gaps and jaggedness in 2D canvas rendering.
 */

import { TileManager, type TileType } from './TileManager';
import { getProjection, getDepthFade, getFogAmount } from '../projection';
import type { BiomeTheme } from '../biomes';

export interface TileRenderContext {
  ctx: CanvasRenderingContext2D;
  canvasWidth: number;
  canvasHeight: number;
  biome: BiomeTheme;
  brightness: number;
  time: number;
  enableAnimations: boolean;
}

// ============================================================================
// Triangle-based texture mapping utilities (gap-free, jagged-free)
// ============================================================================

type Point2D = [number, number];

/**
 * Linear interpolation between two 2D points
 */
function lerp2(a: Point2D, b: Point2D, t: number): Point2D {
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
}

/**
 * Draw a textured triangle using affine transform
 * Maps source triangle (in texture space) to destination triangle (in screen space)
 */
function drawTexturedTriangle(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  s0: Point2D, s1: Point2D, s2: Point2D,  // Source triangle (texture coords)
  d0: Point2D, d1: Point2D, d2: Point2D   // Destination triangle (screen coords)
): void {
  const [sx0, sy0] = s0, [sx1, sy1] = s1, [sx2, sy2] = s2;
  const [dx0, dy0] = d0, [dx1, dy1] = d1, [dx2, dy2] = d2;

  const denom =
    sx0 * (sy1 - sy2) +
    sx1 * (sy2 - sy0) +
    sx2 * (sy0 - sy1);

  if (Math.abs(denom) < 1e-12) return;

  const a = (dx0 * (sy1 - sy2) + dx1 * (sy2 - sy0) + dx2 * (sy0 - sy1)) / denom;
  const b = (dy0 * (sy1 - sy2) + dy1 * (sy2 - sy0) + dy2 * (sy0 - sy1)) / denom;
  const c = (dx0 * (sx2 - sx1) + dx1 * (sx0 - sx2) + dx2 * (sx1 - sx0)) / denom;
  const d = (dy0 * (sx2 - sx1) + dy1 * (sx0 - sx2) + dy2 * (sx1 - sx0)) / denom;

  const e =
    (dx0 * (sx1 * sy2 - sx2 * sy1) +
     dx1 * (sx2 * sy0 - sx0 * sy2) +
     dx2 * (sx0 * sy1 - sx1 * sy0)) / denom;

  const f =
    (dy0 * (sx1 * sy2 - sx2 * sy1) +
     dy1 * (sx2 * sy0 - sx0 * sy2) +
     dy2 * (sx0 * sy1 - sx1 * sy0)) / denom;

  ctx.save();

  // Clip to destination triangle
  ctx.beginPath();
  ctx.moveTo(dx0, dy0);
  ctx.lineTo(dx1, dy1);
  ctx.lineTo(dx2, dy2);
  ctx.closePath();
  ctx.clip();

  // Apply affine transform and draw
  ctx.setTransform(a, b, c, d, e, f);
  ctx.drawImage(img, 0, 0);

  ctx.restore();
}

/**
 * Expand a triangle slightly outward from its centroid to prevent AA cracks
 */
function expandTriangle(d0: Point2D, d1: Point2D, d2: Point2D, epsPx: number): [Point2D, Point2D, Point2D] {
  const cx = (d0[0] + d1[0] + d2[0]) / 3;
  const cy = (d0[1] + d1[1] + d2[1]) / 3;

  function push(p: Point2D): Point2D {
    const vx = p[0] - cx, vy = p[1] - cy;
    const len = Math.hypot(vx, vy) || 1;
    return [p[0] + (vx / len) * epsPx, p[1] + (vy / len) * epsPx];
  }

  return [push(d0), push(d1), push(d2)];
}

/**
 * Draw a slice quad (trapezoid) as two triangles with seam-safe expansion
 * The outer clip ensures expanded triangles don't bleed outside the quad
 */
function drawTexturedQuadAsTwoTris(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  srcRect: { x: number; y: number; w: number; h: number },
  pTL: Point2D, pTR: Point2D, pBR: Point2D, pBL: Point2D,
  epsPx: number = 0.75
): void {
  const sx0 = srcRect.x, sy0 = srcRect.y;
  const sx1 = srcRect.x + srcRect.w, sy1 = srcRect.y + srcRect.h;

  // Outer clip to slice quad so expanded triangles never bleed outside
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(pTL[0], pTL[1]);
  ctx.lineTo(pTR[0], pTR[1]);
  ctx.lineTo(pBR[0], pBR[1]);
  ctx.lineTo(pBL[0], pBL[1]);
  ctx.closePath();
  ctx.clip();

  // Triangle 1: TL, TR, BL
  {
    const d0 = pTL, d1 = pTR, d2 = pBL;
    const [e0, e1, e2] = expandTriangle(d0, d1, d2, epsPx);
    drawTexturedTriangle(ctx, img,
      [sx0, sy0], [sx1, sy0], [sx0, sy1],
      e0, e1, e2
    );
  }

  // Triangle 2: BL, TR, BR
  {
    const d0 = pBL, d1 = pTR, d2 = pBR;
    const [e0, e1, e2] = expandTriangle(d0, d1, d2, epsPx);
    drawTexturedTriangle(ctx, img,
      [sx0, sy1], [sx1, sy0], [sx1, sy1],
      e0, e1, e2
    );
  }

  ctx.restore();
}

/**
 * Draw a quad with horizontal slicing (for floor/ceiling tiles)
 * Quantizes Y boundaries to integer pixels and reuses them for adjacent slices
 * Handles both floors (far at top) and ceilings (may have inverted Y)
 */
function drawQuadSlicedHoriz(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  dstTL: Point2D, dstTR: Point2D, dstBR: Point2D, dstBL: Point2D,
  srcRect: { x: number; y: number; w: number; h: number },
  slices: number,
  perspectiveLerp: (t: number) => number
): void {
  // For tiles, TL/TR is far edge, BL/BR is near edge
  // Far edge might be above OR below near edge depending on floor vs ceiling
  const farY = (dstTL[1] + dstTR[1]) / 2;
  const nearY = (dstBL[1] + dstBR[1]) / 2;

  // Determine if we're slicing top-to-bottom or bottom-to-top
  const sliceTopToBottom = farY < nearY;

  const yMin = Math.min(farY, nearY);
  const yMax = Math.max(farY, nearY);
  const H = yMax - yMin;
  if (H <= 0) return;

  const N = Math.max(1, slices);
  const boundary: Array<{ L: Point2D; R: Point2D; sy: number }> = new Array(N + 1);

  for (let i = 0; i <= N; i++) {
    const y = Math.round(yMin + (H * i) / N);  // Quantize to integer device px

    // t goes from 0 (far/top) to 1 (near/bottom) in tile space
    // Convert screen-space position to tile-space t
    let t: number;
    if (sliceTopToBottom) {
      // Far is at top (smaller Y), near is at bottom (larger Y)
      t = (y - yMin) / H;
    } else {
      // Far is at bottom, near is at top - reverse t
      t = 1 - (y - yMin) / H;
    }

    const L = lerp2(dstTL, dstBL, t);
    const R = lerp2(dstTR, dstBR, t);
    L[1] = y; R[1] = y;  // Force exact shared boundary

    // Use perspective-correct texture coordinate
    const texT = perspectiveLerp(t);
    const sy = srcRect.y + srcRect.h * texT;
    boundary[i] = { L, R, sy };
  }

  for (let i = 0; i < N; i++) {
    const b0 = boundary[i], b1 = boundary[i + 1];

    const pTL = b0.L, pTR = b0.R, pBL = b1.L, pBR = b1.R;

    const sy0 = b0.sy, sy1 = b1.sy;
    const sliceSrc = { x: srcRect.x, y: Math.min(sy0, sy1), w: srcRect.w, h: Math.abs(sy1 - sy0) };

    drawTexturedQuadAsTwoTris(ctx, img, sliceSrc, pTL, pTR, pBR, pBL);
  }
}

/**
 * Draw a quad with vertical slicing (for side walls)
 * Quantizes X boundaries to integer pixels and reuses them for adjacent slices
 * Handles both left walls (near on left) and right walls (near on right)
 */
function drawQuadSlicedVert(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  dstTL: Point2D, dstTR: Point2D, dstBR: Point2D, dstBL: Point2D,
  srcRect: { x: number; y: number; w: number; h: number },
  slices: number,
  perspectiveLerp: (t: number) => number,
  flipHorizontal: boolean = false
): void {
  // For walls, TL/BL is near edge, TR/BR is far edge
  // Near edge might be on left OR right depending on wall side
  const nearX = (dstTL[0] + dstBL[0]) / 2;
  const farX = (dstTR[0] + dstBR[0]) / 2;

  // Determine if we're slicing left-to-right or right-to-left
  const sliceLeftToRight = nearX < farX;

  const xMin = Math.min(nearX, farX);
  const xMax = Math.max(nearX, farX);
  const W = xMax - xMin;
  if (W <= 0) return;

  const N = Math.max(1, slices);
  const boundary: Array<{ T: Point2D; B: Point2D; sx: number }> = new Array(N + 1);

  for (let i = 0; i <= N; i++) {
    const x = Math.round(xMin + (W * i) / N);  // Quantize to integer device px

    // t goes from 0 (near) to 1 (far) in wall space
    // Convert screen-space position to wall-space t
    let t: number;
    if (sliceLeftToRight) {
      // Near is on left, far is on right
      t = (x - xMin) / W;
    } else {
      // Near is on right, far is on left - reverse t
      t = 1 - (x - xMin) / W;
    }

    const T = lerp2(dstTL, dstTR, t);
    const B = lerp2(dstBL, dstBR, t);
    T[0] = x; B[0] = x;  // Force exact shared boundary

    // Use perspective-correct texture coordinate
    const texT = perspectiveLerp(t);
    // For flipped textures, read from the opposite side
    const finalTexT = flipHorizontal ? (1 - texT) : texT;
    const sx = srcRect.x + srcRect.w * finalTexT;
    boundary[i] = { T, B, sx };
  }

  for (let i = 0; i < N; i++) {
    const b0 = boundary[i], b1 = boundary[i + 1];

    const pTL = b0.T, pBL = b0.B, pTR = b1.T, pBR = b1.B;

    const sx0 = b0.sx, sx1 = b1.sx;
    const sliceSrc = {
      x: Math.min(sx0, sx1),
      y: srcRect.y,
      w: Math.abs(sx1 - sx0),
      h: srcRect.h
    };

    drawTexturedQuadAsTwoTris(ctx, img, sliceSrc, pTL, pTR, pBR, pBL);
  }
}

/**
 * Project a world position (x, depth) to screen coordinates
 * Returns the four corners of a tile in screen space
 */
export function projectTileCorners(
  canvasWidth: number,
  canvasHeight: number,
  tileX: number,      // Tile X offset from center (-2, -1, 0, 1, 2, etc.)
  tileDepth: number,  // Tile depth (1, 2, 3, etc.)
  isFloor: boolean    // true for floor, false for ceiling
): { topLeft: { x: number; y: number }; topRight: { x: number; y: number }; bottomLeft: { x: number; y: number }; bottomRight: { x: number; y: number } } | null {
  // Near edge of tile (closer to player)
  const nearDepth = tileDepth;
  // Far edge of tile (further from player)
  const farDepth = tileDepth + 1;

  // Left and right edges of tile
  const leftX = tileX;
  const rightX = tileX + 1;

  // Project all four corners
  const nearLeft = getProjection(canvasWidth, canvasHeight, nearDepth, leftX);
  const nearRight = getProjection(canvasWidth, canvasHeight, nearDepth, rightX);
  const farLeft = getProjection(canvasWidth, canvasHeight, farDepth, leftX);
  const farRight = getProjection(canvasWidth, canvasHeight, farDepth, rightX);

  // Get Y coordinates based on floor or ceiling
  const nearLeftY = isFloor ? nearLeft.wallBottom : nearLeft.wallTop;
  const nearRightY = isFloor ? nearRight.wallBottom : nearRight.wallTop;
  const farLeftY = isFloor ? farLeft.wallBottom : farLeft.wallTop;
  const farRightY = isFloor ? farRight.wallBottom : farRight.wallTop;

  return {
    // Bottom edge (near player) - actually rendered at top of quad for floor
    bottomLeft: { x: nearLeft.x, y: nearLeftY },
    bottomRight: { x: nearRight.x, y: nearRightY },
    // Top edge (far from player) - actually rendered at bottom of quad for floor
    topLeft: { x: farLeft.x, y: farLeftY },
    topRight: { x: farRight.x, y: farRightY },
  };
}

/**
 * Draw a single floor or ceiling tile with texture
 */
export function drawTile(
  context: TileRenderContext,
  tileX: number,
  tileDepth: number,
  tileType: TileType,
  isFloor: boolean
): void {
  const { ctx, canvasWidth, canvasHeight, biome, brightness } = context;

  const corners = projectTileCorners(canvasWidth, canvasHeight, tileX, tileDepth, isFloor);
  if (!corners) return;

  const depthFade = getDepthFade(tileDepth + 0.5);
  const fogAmount = getFogAmount(tileDepth + 0.5);

  // Skip if too fogged
  if (fogAmount > 0.95) return;

  // Try to get the tile image (with position-seeded variant selection)
  const tileImage = TileManager.getTileVariant(biome.id, tileType, tileX, tileDepth);

  ctx.save();

  if (tileImage) {
    // Draw textured tile using perspective-correct transform
    // Pass depth values for proper perspective interpolation
    const nearDepth = tileDepth;
    const farDepth = tileDepth + 1;
    drawTexturedQuad(ctx, tileImage, corners, depthFade * brightness, nearDepth, farDepth);
  } else {
    // Fallback: draw solid color quad
    drawColoredQuad(ctx, corners, biome, tileType, isFloor, depthFade * brightness);
  }

  // Apply fog overlay
  if (fogAmount > 0) {
    const fogR = biome.fogColor[0];
    const fogG = biome.fogColor[1];
    const fogB = biome.fogColor[2];
    ctx.fillStyle = `rgba(${fogR}, ${fogG}, ${fogB}, ${fogAmount})`;
    ctx.beginPath();
    ctx.moveTo(corners.bottomLeft.x, corners.bottomLeft.y);
    ctx.lineTo(corners.bottomRight.x, corners.bottomRight.y);
    ctx.lineTo(corners.topRight.x, corners.topRight.y);
    ctx.lineTo(corners.topLeft.x, corners.topLeft.y);
    ctx.closePath();
    ctx.fill();
  }

  ctx.restore();
}

/**
 * Draw a textured quadrilateral with perspective-correct texture mapping
 * Uses triangle-based rendering with quantized slice boundaries for gap-free results
 */
function drawTexturedQuad(
  ctx: CanvasRenderingContext2D,
  image: HTMLImageElement,
  corners: ReturnType<typeof projectTileCorners>,
  brightness: number,
  nearDepth: number = 1,
  farDepth: number = 2
): void {
  if (!corners) return;

  const { topLeft, topRight, bottomLeft, bottomRight } = corners;

  // Clamp depths to prevent division by zero (match projection.ts minDepth)
  const clampedNearDepth = Math.max(nearDepth, 0.3);
  const clampedFarDepth = Math.max(farDepth, 0.3);

  const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

  // Perspective-correct interpolation: converts linear t to perspective-correct t
  // This accounts for the fact that equal screen distances don't equal equal world distances
  const perspectiveLerp = (t: number): number => {
    // Use 1/z interpolation for perspective correction
    const invNear = 1 / clampedNearDepth;
    const invFar = 1 / clampedFarDepth;
    const invZ = lerp(invFar, invNear, t); // Far is at top (t=0), near is at bottom (t=1)
    // Convert back to linear texture coordinate
    return (invZ - invFar) / (invNear - invFar);
  };

  ctx.save();
  ctx.globalAlpha = brightness;

  // Convert corners to Point2D format
  const dstTL: Point2D = [topLeft.x, topLeft.y];
  const dstTR: Point2D = [topRight.x, topRight.y];
  const dstBR: Point2D = [bottomRight.x, bottomRight.y];
  const dstBL: Point2D = [bottomLeft.x, bottomLeft.y];

  // Source rectangle (full image)
  const srcRect = { x: 0, y: 0, w: image.width, h: image.height };

  // Use horizontal slicing with 32 slices
  drawQuadSlicedHoriz(ctx, image, dstTL, dstTR, dstBR, dstBL, srcRect, 32, perspectiveLerp);

  ctx.restore();
}

/**
 * Draw a textured side wall quad with perspective-correct texture mapping
 * Uses triangle-based rendering with quantized slice boundaries for gap-free results
 * corners: [nearTop, farTop, farBottom, nearBottom]
 * @param flipHorizontal - If true, flip texture horizontally (for right walls)
 * @param nearDepth - Depth at near edge
 * @param farDepth - Depth at far edge
 */
function drawTexturedWallQuad(
  ctx: CanvasRenderingContext2D,
  image: HTMLImageElement,
  corners: { x: number; y: number }[],
  brightness: number,
  flipHorizontal: boolean = false,
  nearDepth: number = 1,
  farDepth: number = 2
): void {
  if (corners.length < 4) return;

  const [nearTop, farTop, farBottom, nearBottom] = corners;

  // Clamp depths to prevent division by zero (match projection.ts minDepth)
  const clampedNearDepth = Math.max(nearDepth, 0.3);
  const clampedFarDepth = Math.max(farDepth, 0.3);

  const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

  // Perspective-correct interpolation for texture coordinates
  const perspectiveLerp = (t: number): number => {
    const invNear = 1 / clampedNearDepth;
    const invFar = 1 / clampedFarDepth;
    const invZ = lerp(invNear, invFar, t); // Near is at t=0, far is at t=1
    return (invZ - invNear) / (invFar - invNear);
  };

  ctx.save();
  ctx.globalAlpha = brightness;

  // Convert corners to Point2D format
  // For side walls: near is left edge, far is right edge (in screen space)
  const dstTL: Point2D = [nearTop.x, nearTop.y];
  const dstTR: Point2D = [farTop.x, farTop.y];
  const dstBR: Point2D = [farBottom.x, farBottom.y];
  const dstBL: Point2D = [nearBottom.x, nearBottom.y];

  // Source rectangle (full image)
  const srcRect = { x: 0, y: 0, w: image.width, h: image.height };

  // Use vertical slicing with 24 slices
  drawQuadSlicedVert(ctx, image, dstTL, dstTR, dstBR, dstBL, srcRect, 24, perspectiveLerp, flipHorizontal);

  ctx.restore();
}

/**
 * Draw a colored quadrilateral (fallback when no texture)
 */
function drawColoredQuad(
  ctx: CanvasRenderingContext2D,
  corners: ReturnType<typeof projectTileCorners>,
  biome: BiomeTheme,
  tileType: TileType,
  isFloor: boolean,
  brightness: number
): void {
  if (!corners) return;

  const { topLeft, topRight, bottomLeft, bottomRight } = corners;

  // Get base color from biome
  let baseColor: [number, number, number];
  if (isFloor) {
    baseColor = biome.floorColor;
  } else if (tileType === 'ceiling') {
    baseColor = biome.ceilingColor;
  } else {
    baseColor = biome.wallColor;
  }

  // Apply brightness and light tint
  const lightMix = 0.1;
  const r = Math.floor((baseColor[0] * (1 - lightMix) + biome.lightColor[0] * lightMix) * brightness);
  const g = Math.floor((baseColor[1] * (1 - lightMix) + biome.lightColor[1] * lightMix) * brightness);
  const b = Math.floor((baseColor[2] * (1 - lightMix) + biome.lightColor[2] * lightMix) * brightness);

  ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
  ctx.beginPath();
  ctx.moveTo(bottomLeft.x, bottomLeft.y);
  ctx.lineTo(bottomRight.x, bottomRight.y);
  ctx.lineTo(topRight.x, topRight.y);
  ctx.lineTo(topLeft.x, topLeft.y);
  ctx.closePath();
  ctx.fill();

  // Add subtle grid lines for tile visibility
  ctx.strokeStyle = `rgba(0, 0, 0, ${0.2 * brightness})`;
  ctx.lineWidth = 1;
  ctx.stroke();
}

/**
 * Draw a floor grid of tiles
 */
export function drawFloorGrid(
  context: TileRenderContext,
  startDepth: number,
  endDepth: number,
  leftBound: number,   // Leftmost tile X (-3, -2, etc.)
  rightBound: number,  // Rightmost tile X (2, 3, etc.)
  tileType: TileType = 'floor'
): void {
  // Draw from far to near (painter's algorithm)
  for (let depth = endDepth - 1; depth >= startDepth; depth--) {
    for (let x = leftBound; x < rightBound; x++) {
      drawTile(context, x, depth, tileType, true);
    }
  }
}

/**
 * Draw a ceiling grid of tiles
 */
export function drawCeilingGrid(
  context: TileRenderContext,
  startDepth: number,
  endDepth: number,
  leftBound: number,
  rightBound: number,
  tileType: TileType = 'ceiling'
): void {
  // Draw from far to near
  for (let depth = endDepth - 1; depth >= startDepth; depth--) {
    for (let x = leftBound; x < rightBound; x++) {
      drawTile(context, x, depth, tileType, false);
    }
  }
}

/**
 * Draw a wall segment with texture
 * @param endDepth - For side walls, the far edge depth (defaults to depth + 1)
 */
export function drawWallWithTexture(
  context: TileRenderContext,
  side: 'front' | 'left' | 'right',
  depth: number,
  leftOffset: number,
  rightOffset: number,
  endDepth?: number
): void {
  const { ctx, canvasWidth, canvasHeight, biome, brightness } = context;

  const tileType: TileType = side === 'front' ? 'wall_front' : side === 'left' ? 'wall_left' : 'wall_right';
  // Use leftOffset as x position for variant selection (represents horizontal wall position)
  const tileImage = TileManager.getTileVariant(biome.id, tileType, Math.floor(leftOffset), depth);

  const depthFade = getDepthFade(depth);
  const fogAmount = getFogAmount(depth);

  if (fogAmount > 0.95) return;

  let corners: { x: number; y: number }[];

  if (side === 'front') {
    const left = getProjection(canvasWidth, canvasHeight, depth, leftOffset);
    const right = getProjection(canvasWidth, canvasHeight, depth, rightOffset);
    corners = [
      { x: left.x, y: left.wallTop },
      { x: right.x, y: right.wallTop },
      { x: right.x, y: right.wallBottom },
      { x: left.x, y: left.wallBottom },
    ];
  } else {
    const xOffset = side === 'left' ? -1 : 1;
    const farDepth = endDepth !== undefined ? endDepth : depth + 1;
    const near = getProjection(canvasWidth, canvasHeight, depth, xOffset);
    const far = getProjection(canvasWidth, canvasHeight, farDepth, xOffset);
    corners = [
      { x: near.x, y: near.wallTop },
      { x: far.x, y: far.wallTop },
      { x: far.x, y: far.wallBottom },
      { x: near.x, y: near.wallBottom },
    ];
  }

  ctx.save();

  if (tileImage) {
    if (side === 'front') {
      // Front walls: tile horizontally while preserving texture aspect ratio
      const minX = Math.min(...corners.map(c => c.x));
      const maxX = Math.max(...corners.map(c => c.x));
      const minY = Math.min(...corners.map(c => c.y));
      const maxY = Math.max(...corners.map(c => c.y));

      const wallWidth = maxX - minX;
      const wallHeight = maxY - minY;

      // Calculate tile width based on texture aspect ratio
      // This ensures the texture isn't stretched
      const textureAspect = tileImage.width / tileImage.height;
      const tileWidth = wallHeight * textureAspect;
      const tilesNeeded = Math.ceil(wallWidth / tileWidth);

      // Clip to wall bounds
      ctx.beginPath();
      ctx.moveTo(corners[0].x, corners[0].y);
      for (let i = 1; i < corners.length; i++) {
        ctx.lineTo(corners[i].x, corners[i].y);
      }
      ctx.closePath();
      ctx.clip();

      ctx.globalAlpha = depthFade * brightness;

      // Draw tiled texture - each tile maintains correct aspect ratio
      for (let t = 0; t < tilesNeeded; t++) {
        const tileX = minX + t * tileWidth;
        const tileW = Math.min(tileWidth, maxX - tileX);
        // Use proportional source width if tile is partially visible
        const srcW = (tileW / tileWidth) * tileImage.width;
        ctx.drawImage(tileImage, 0, 0, srcW, tileImage.height, tileX, minY, tileW, wallHeight);
      }
    } else {
      // Side walls: use perspective-correct slicing (like floor tiles)
      // corners: [nearTop, farTop, farBottom, nearBottom]
      // For right walls, flip texture horizontally (wall goes right-to-left on screen)
      const flipHorizontal = side === 'right';
      // Pass depth values for perspective-correct texture mapping
      const wallFarDepth = endDepth !== undefined ? endDepth : depth + 1;
      drawTexturedWallQuad(ctx, tileImage, corners, depthFade * brightness, flipHorizontal, depth, wallFarDepth);
    }
  } else {
    // Fallback: colored quad
    const baseColor = biome.wallColor;
    const lightMix = 0.15 * depthFade;
    const sideFactor = side === 'left' ? 0.7 : 1.0;
    const r = Math.floor((baseColor[0] * (1 - lightMix) + biome.lightColor[0] * lightMix) * depthFade * brightness * sideFactor);
    const g = Math.floor((baseColor[1] * (1 - lightMix) + biome.lightColor[1] * lightMix) * depthFade * brightness * sideFactor);
    const b = Math.floor((baseColor[2] * (1 - lightMix) + biome.lightColor[2] * lightMix) * depthFade * brightness * sideFactor);

    ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
    ctx.beginPath();
    ctx.moveTo(corners[0].x, corners[0].y);
    for (let i = 1; i < corners.length; i++) {
      ctx.lineTo(corners[i].x, corners[i].y);
    }
    ctx.closePath();
    ctx.fill();
  }

  // Apply fog
  if (fogAmount > 0) {
    const fogR = biome.fogColor[0];
    const fogG = biome.fogColor[1];
    const fogB = biome.fogColor[2];
    ctx.fillStyle = `rgba(${fogR}, ${fogG}, ${fogB}, ${fogAmount})`;
    ctx.beginPath();
    ctx.moveTo(corners[0].x, corners[0].y);
    for (let i = 1; i < corners.length; i++) {
      ctx.lineTo(corners[i].x, corners[i].y);
    }
    ctx.closePath();
    ctx.fill();
  }

  ctx.restore();
}
