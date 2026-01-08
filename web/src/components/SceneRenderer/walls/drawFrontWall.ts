/**
 * Draw front-facing walls that block the corridor
 */
import { getProjection, seededRandom, getDepthFade } from '../projection';
import { drawMoss, drawCracks, drawCobwebs } from './drawWallDecor';
import type { BiomeTheme } from '../biomes';

export interface FrontWallOptions {
  biome?: BiomeTheme;
  brightness?: number;
}

export function drawFrontWall(
  ctx: CanvasRenderingContext2D,
  depth: number,
  leftOffset: number,
  rightOffset: number,
  canvasWidth: number,
  canvasHeight: number,
  tile: string,
  _time: number,
  _enableAnimations: boolean,
  options: FrontWallOptions = {}
): void {
  const left = getProjection(canvasWidth, canvasHeight, depth, leftOffset);
  const right = getProjection(canvasWidth, canvasHeight, depth, rightOffset);

  const depthFade = getDepthFade(depth);

  // Use biome colors if provided, otherwise use defaults
  const biome = options.biome;
  const globalBrightness = options.brightness ?? 1.0;

  // Wall base color from biome or default warm stone
  let wallR: number, wallG: number, wallB: number;
  let highlightR: number, highlightG: number, highlightB: number;
  let lightR: number, lightG: number, lightB: number;

  if (biome) {
    wallR = biome.wallColor[0];
    wallG = biome.wallColor[1];
    wallB = biome.wallColor[2];
    highlightR = biome.wallHighlight[0];
    highlightG = biome.wallHighlight[1];
    highlightB = biome.wallHighlight[2];
    lightR = biome.lightColor[0];
    lightG = biome.lightColor[1];
    lightB = biome.lightColor[2];
  } else {
    // Default dungeon colors
    wallR = 74; wallG = 74; wallB = 94;
    highlightR = 90; highlightG = 90; highlightB = 110;
    lightR = 255; lightG = 150; lightB = 80;
  }

  const brightness = depthFade * globalBrightness;

  // Calculate final wall color with light tint
  const lightMix = 0.18 * depthFade; // How much light color affects wall
  const finalR = Math.floor((wallR * (1 - lightMix) + lightR * lightMix) * brightness);
  const finalG = Math.floor((wallG * (1 - lightMix) + lightG * lightMix) * brightness);
  const finalB = Math.floor((wallB * (1 - lightMix) + lightB * lightMix) * brightness);

  // Highlight colors for gradient
  const highR = Math.floor((highlightR * (1 - lightMix) + lightR * lightMix) * brightness);
  const highG = Math.floor((highlightG * (1 - lightMix) + lightG * lightMix) * brightness);
  const highB = Math.floor((highlightB * (1 - lightMix) + lightB * lightMix) * brightness);

  // Main wall with gradient
  const gradient = ctx.createLinearGradient(left.x, left.wallTop, left.x, left.wallBottom);
  gradient.addColorStop(0, `rgb(${highR}, ${highG}, ${highB})`);
  gradient.addColorStop(0.5, `rgb(${finalR}, ${finalG}, ${finalB})`);
  gradient.addColorStop(1, `rgb(${Math.floor(finalR * 0.8)}, ${Math.floor(finalG * 0.8)}, ${Math.floor(finalB * 0.8)})`);

  ctx.fillStyle = gradient;
  ctx.fillRect(left.x, left.wallTop, right.x - left.x, left.wallBottom - left.wallTop);

  // Stone texture - simple horizontal mortar lines for cleaner look
  const wallWidth = right.x - left.x;
  const wallHeight = left.wallBottom - left.wallTop;

  // Only draw texture if wall is visible enough
  if (depthFade > 0.15 && wallHeight > 20) {
    // Simple horizontal stone rows - cleaner than full brick grid
    const numRows = Math.max(2, Math.min(5, Math.floor(wallHeight / 40)));
    const rowHeight = wallHeight / numRows;

    for (let row = 0; row < numRows; row++) {
      const y = left.wallTop + row * rowHeight;

      // Subtle stone variation per row
      const seed = row + Math.floor(depth * 100);
      const variation = (seededRandom(seed) * 0.2 - 0.1); // +/- 10% variation
      const stoneR = Math.floor(finalR * (1 + variation));
      const stoneG = Math.floor(finalG * (1 + variation));
      const stoneB = Math.floor(finalB * (1 + variation));

      ctx.fillStyle = `rgb(${stoneR}, ${stoneG}, ${stoneB})`;
      ctx.fillRect(left.x + 1, y + 2, wallWidth - 2, rowHeight - 3);

      // Mortar line between rows
      if (row > 0) {
        ctx.fillStyle = `rgba(0, 0, 0, ${0.5 * depthFade})`;
        ctx.fillRect(left.x, y - 1, wallWidth, 2);
      }
    }
  }

  // Wall decorations (moss, cracks, cobwebs)
  const decorSeed = Math.floor(depth * 1000) + Math.floor(leftOffset * 100);
  const wallBounds = {
    x: left.x,
    y: left.wallTop,
    width: wallWidth,
    height: wallHeight,
  };

  // Moss on lower parts of walls (not on doors)
  if (tile !== 'D' && tile !== 'd' && seededRandom(decorSeed + 1) > 0.55) {
    drawMoss(ctx, wallBounds, depth, decorSeed + 100);
  }

  // Cracks on some walls
  if (seededRandom(decorSeed + 2) > 0.6) {
    drawCracks(ctx, wallBounds, depth, decorSeed + 200);
  }

  // Cobwebs in upper corners
  if (seededRandom(decorSeed + 3) > 0.65) {
    drawCobwebs(ctx, wallBounds, depth, decorSeed + 300, ['topLeft', 'topRight']);
  }

  // Door handling
  if (tile === 'D' || tile === 'd') {
    drawDoor(ctx, left.x, left.wallTop, wallWidth, wallHeight, depthFade);
  }

  // Note: Fog is now blended into wall color via depthFade, not overlaid
  // This keeps walls fully opaque while still fading them into darkness at distance

  // Note: Torches are now data-driven and rendered separately by torchLight.ts
}

function drawDoor(
  ctx: CanvasRenderingContext2D,
  wallX: number,
  wallTop: number,
  wallWidth: number,
  wallHeight: number,
  depthFade: number
): void {
  const doorWidth = wallWidth * 0.6;
  const doorHeight = wallHeight * 0.85;
  const doorX = wallX + (wallWidth - doorWidth) / 2;
  const doorY = wallTop + wallHeight - doorHeight;

  ctx.fillStyle = `rgb(${Math.floor(80 * depthFade)}, ${Math.floor(50 * depthFade)}, ${Math.floor(30 * depthFade)})`;
  ctx.fillRect(doorX, doorY, doorWidth, doorHeight);

  // Door frame
  ctx.strokeStyle = `rgb(${Math.floor(50 * depthFade)}, ${Math.floor(30 * depthFade)}, ${Math.floor(20 * depthFade)})`;
  ctx.lineWidth = 3;
  ctx.strokeRect(doorX, doorY, doorWidth, doorHeight);

  // Door handle
  ctx.fillStyle = '#ffd700';
  ctx.beginPath();
  ctx.arc(doorX + doorWidth * 0.8, doorY + doorHeight * 0.5, 4, 0, Math.PI * 2);
  ctx.fill();
}
