/**
 * TileRenderer - Draws tiles with perspective projection
 *
 * Handles drawing floor tiles, wall tiles, and ceiling tiles
 * with proper perspective transformation.
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
    // Draw textured tile using perspective transform
    drawTexturedQuad(ctx, tileImage, corners, depthFade * brightness);
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
 * Draw a textured quadrilateral with perspective
 * Uses canvas 2D transforms to approximate perspective texture mapping
 */
function drawTexturedQuad(
  ctx: CanvasRenderingContext2D,
  image: HTMLImageElement,
  corners: ReturnType<typeof projectTileCorners>,
  brightness: number
): void {
  if (!corners) return;

  const { topLeft, topRight, bottomLeft, bottomRight } = corners;

  // Canvas2D can't do true perspective texture mapping.
  // Approximate it by slicing the quad into many thin horizontal strips in texture space.
  // Each strip is clipped to a trapezoid and the corresponding slice of the texture is drawn into it.

  const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

  // More slices = less distortion, more cost. 24–48 is a good range.
  const slices = 32;

  ctx.save();
  ctx.globalAlpha = brightness;

  // We map texture V from 0..1 along the quad from FAR (top*) to NEAR (bottom*).
  // For each slice band [t0,t1], compute the four corners by interpolating
  // between top and bottom edges.
  for (let i = 0; i < slices; i++) {
    const t0 = i / slices;
    const t1 = (i + 1) / slices;

    // Interpolate left edge
    const xL0 = lerp(topLeft.x, bottomLeft.x, t0);
    const yL0 = lerp(topLeft.y, bottomLeft.y, t0);
    const xL1 = lerp(topLeft.x, bottomLeft.x, t1);
    const yL1 = lerp(topLeft.y, bottomLeft.y, t1);

    // Interpolate right edge
    const xR0 = lerp(topRight.x, bottomRight.x, t0);
    const yR0 = lerp(topRight.y, bottomRight.y, t0);
    const xR1 = lerp(topRight.x, bottomRight.x, t1);
    const yR1 = lerp(topRight.y, bottomRight.y, t1);

    // Clip to the trapezoid for this slice
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(xL0, yL0);
    ctx.lineTo(xR0, yR0);
    ctx.lineTo(xR1, yR1);
    ctx.lineTo(xL1, yL1);
    ctx.closePath();
    ctx.clip();

    // Destination bounding box for the slice (cheap drawImage target)
    const minX = Math.min(xL0, xR0, xL1, xR1);
    const maxX = Math.max(xL0, xR0, xL1, xR1);
    const minY = Math.min(yL0, yR0, yL1, yR1);
    const maxY = Math.max(yL0, yR0, yL1, yR1);

    const dw = Math.max(1, maxX - minX);
    const dh = Math.max(1, maxY - minY);

    // Source slice in texture space
    const sx = 0;
    const sy = Math.floor(t0 * image.height);
    const sw = image.width;
    const sh = Math.max(1, Math.floor((t1 - t0) * image.height));

    ctx.drawImage(image, sx, sy, sw, sh, minX, minY, dw, dh);
    ctx.restore();
  }

  ctx.restore();
}

/**
 * Draw a textured side wall quad with perspective correction
 * Uses horizontal slicing to properly map texture from near (wide) to far (narrow)
 * corners: [nearTop, farTop, farBottom, nearBottom]
 * @param flipHorizontal - If true, flip texture horizontally (for right walls)
 */
function drawTexturedWallQuad(
  ctx: CanvasRenderingContext2D,
  image: HTMLImageElement,
  corners: { x: number; y: number }[],
  brightness: number,
  flipHorizontal: boolean = false
): void {
  if (corners.length < 4) return;

  const [nearTop, farTop, farBottom, nearBottom] = corners;

  const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

  // Slice horizontally from near edge to far edge
  const slices = 24;

  ctx.save();
  ctx.globalAlpha = brightness;

  for (let i = 0; i < slices; i++) {
    const t0 = i / slices;
    const t1 = (i + 1) / slices;

    // Interpolate top edge (from nearTop to farTop)
    const xT0 = lerp(nearTop.x, farTop.x, t0);
    const yT0 = lerp(nearTop.y, farTop.y, t0);
    const xT1 = lerp(nearTop.x, farTop.x, t1);
    const yT1 = lerp(nearTop.y, farTop.y, t1);

    // Interpolate bottom edge (from nearBottom to farBottom)
    const xB0 = lerp(nearBottom.x, farBottom.x, t0);
    const yB0 = lerp(nearBottom.y, farBottom.y, t0);
    const xB1 = lerp(nearBottom.x, farBottom.x, t1);
    const yB1 = lerp(nearBottom.y, farBottom.y, t1);

    // Clip to this vertical strip
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(xT0, yT0);
    ctx.lineTo(xT1, yT1);
    ctx.lineTo(xB1, yB1);
    ctx.lineTo(xB0, yB0);
    ctx.closePath();
    ctx.clip();

    // Destination bounding box
    const minX = Math.min(xT0, xT1, xB0, xB1);
    const maxX = Math.max(xT0, xT1, xB0, xB1);
    const minY = Math.min(yT0, yT1, yB0, yB1);
    const maxY = Math.max(yT0, yT1, yB0, yB1);

    const dw = Math.max(1, maxX - minX);
    const dh = Math.max(1, maxY - minY);

    // Source slice in texture space (horizontal slice)
    // For flipped textures, read from the opposite side
    const texT0 = flipHorizontal ? (1 - t1) : t0;
    const texT1 = flipHorizontal ? (1 - t0) : t1;
    const sx = Math.floor(Math.min(texT0, texT1) * image.width);
    const sy = 0;
    const sw = Math.max(1, Math.floor(Math.abs(texT1 - texT0) * image.width));
    const sh = image.height;

    ctx.drawImage(image, sx, sy, sw, sh, minX, minY, dw, dh);
    ctx.restore();
  }

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
 */
export function drawWallWithTexture(
  context: TileRenderContext,
  side: 'front' | 'left' | 'right',
  depth: number,
  leftOffset: number,
  rightOffset: number
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
    const near = getProjection(canvasWidth, canvasHeight, depth, xOffset);
    const far = getProjection(canvasWidth, canvasHeight, depth + 1, xOffset);
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
      // Front walls: tile horizontally to maintain aspect ratio
      const minX = Math.min(...corners.map(c => c.x));
      const maxX = Math.max(...corners.map(c => c.x));
      const minY = Math.min(...corners.map(c => c.y));
      const maxY = Math.max(...corners.map(c => c.y));

      const wallWidth = maxX - minX;
      const wallHeight = maxY - minY;

      // Calculate tile size to maintain square aspect ratio
      // Use wall height as the base (one tile = one wall height)
      const tileSize = wallHeight;
      const tilesNeeded = Math.ceil(wallWidth / tileSize);

      // Clip to wall bounds
      ctx.beginPath();
      ctx.moveTo(corners[0].x, corners[0].y);
      for (let i = 1; i < corners.length; i++) {
        ctx.lineTo(corners[i].x, corners[i].y);
      }
      ctx.closePath();
      ctx.clip();

      ctx.globalAlpha = depthFade * brightness;

      // Draw tiled texture
      for (let t = 0; t < tilesNeeded; t++) {
        const tileX = minX + t * tileSize;
        const tileW = Math.min(tileSize, maxX - tileX);
        // Use proportional source width if tile is partially visible
        const srcW = (tileW / tileSize) * tileImage.width;
        ctx.drawImage(tileImage, 0, 0, srcW, tileImage.height, tileX, minY, tileW, wallHeight);
      }
    } else {
      // Side walls: use perspective-correct slicing (like floor tiles)
      // corners: [nearTop, farTop, farBottom, nearBottom]
      // For right walls, flip texture horizontally (wall goes right-to-left on screen)
      const flipHorizontal = side === 'right';
      drawTexturedWallQuad(ctx, tileImage, corners, depthFade * brightness, flipHorizontal);
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
