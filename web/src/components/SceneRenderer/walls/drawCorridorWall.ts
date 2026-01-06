/**
 * Draw corridor side walls (perspective walls extending toward viewer)
 */
import { getProjection, seededRandom, getDepthFade, getFogAmount } from '../projection';
import { drawMossCorridor, drawCracksCorridor, drawCobwebsCorridor } from './drawWallDecor';
import type { BiomeTheme } from '../biomes';

// Note: Torches are now data-driven and rendered separately by torchLight.ts

export interface CorridorWallOptions {
  biome?: BiomeTheme;
  brightness?: number;
}

export function drawCorridorWall(
  ctx: CanvasRenderingContext2D,
  side: 'left' | 'right',
  nearDepth: number,
  farDepth: number,
  canvasWidth: number,
  canvasHeight: number,
  _time: number,
  _enableAnimations: boolean = true,
  options: CorridorWallOptions = {}
): void {
  const xOffset = side === 'left' ? -1 : 1;

  const near = getProjection(canvasWidth, canvasHeight, nearDepth, xOffset);
  const far = getProjection(canvasWidth, canvasHeight, farDepth, xOffset);

  const avgDepth = (nearDepth + farDepth) / 2;
  const depthFade = getDepthFade(avgDepth);

  // Use biome colors if provided, otherwise use defaults
  const biome = options.biome;
  const globalBrightness = options.brightness ?? 1.0;

  // Wall base color from biome or default warm stone
  let wallR: number, wallG: number, wallB: number;
  let lightR: number, lightG: number, lightB: number;
  let fogR: number, fogG: number, fogB: number;

  if (biome) {
    wallR = biome.wallColor[0];
    wallG = biome.wallColor[1];
    wallB = biome.wallColor[2];
    lightR = biome.lightColor[0];
    lightG = biome.lightColor[1];
    lightB = biome.lightColor[2];
    fogR = biome.fogColor[0];
    fogG = biome.fogColor[1];
    fogB = biome.fogColor[2];
  } else {
    // Default dungeon colors
    wallR = 74; wallG = 74; wallB = 94;
    lightR = 255; lightG = 150; lightB = 80;
    fogR = 0; fogG = 0; fogB = 0;
  }

  // Left wall is darker (shadow side), right wall slightly lighter (torch side)
  const sideFactor = side === 'left' ? 0.7 : 1.0;
  const brightness = depthFade * globalBrightness * sideFactor;

  // Calculate final wall color with light tint
  const lightMix = 0.15 * depthFade; // How much light color affects wall
  const finalR = Math.floor((wallR * (1 - lightMix) + lightR * lightMix) * brightness);
  const finalG = Math.floor((wallG * (1 - lightMix) + lightG * lightMix) * brightness);
  const finalB = Math.floor((wallB * (1 - lightMix) + lightB * lightMix) * brightness);

  // Draw the wall quad with biome-appropriate color
  ctx.fillStyle = `rgb(${finalR}, ${finalG}, ${finalB})`;
  ctx.beginPath();
  ctx.moveTo(near.x, near.wallTop);
  ctx.lineTo(far.x, far.wallTop);
  ctx.lineTo(far.x, far.wallBottom);
  ctx.lineTo(near.x, near.wallBottom);
  ctx.closePath();
  ctx.fill();

  // Add stone brick texture (only if visible enough)
  if (depthFade > 0.2) {
    const numBricks = Math.max(2, Math.floor(4 - avgDepth * 0.5));
    const brickHeight = (near.wallBottom - near.wallTop) / numBricks;

    for (let i = 0; i < numBricks; i++) {
      const t = i / numBricks;
      const nearY = near.wallTop + brickHeight * i;
      const farY = far.wallTop + (far.wallBottom - far.wallTop) * t;
      const nearYBottom = near.wallTop + brickHeight * (i + 1);
      const farYBottom = far.wallTop + (far.wallBottom - far.wallTop) * ((i + 1) / numBricks);

      // Brick variation
      const seed = i * 100 + (side === 'left' ? 0 : 500) + Math.floor(nearDepth * 10);
      const variation = (seededRandom(seed) * 0.3 - 0.15); // +/- 15% variation
      const brickR = Math.floor(finalR * (1 + variation));
      const brickG = Math.floor(finalG * (1 + variation));
      const brickB = Math.floor(finalB * (1 + variation));

      ctx.fillStyle = `rgb(${brickR}, ${brickG}, ${brickB})`;
      ctx.beginPath();
      ctx.moveTo(near.x + (side === 'left' ? 2 : -2), nearY + 2);
      ctx.lineTo(far.x + (side === 'left' ? 2 : -2), farY + 2);
      ctx.lineTo(far.x + (side === 'left' ? 2 : -2), farYBottom - 2);
      ctx.lineTo(near.x + (side === 'left' ? 2 : -2), nearYBottom - 2);
      ctx.closePath();
      ctx.fill();

      // Dark mortar line
      ctx.strokeStyle = `rgba(0, 0, 0, ${0.4 * depthFade})`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(near.x, nearYBottom);
      ctx.lineTo(far.x, farYBottom);
      ctx.stroke();
    }
  }

  // Edge shadow (deep black)
  ctx.strokeStyle = `rgba(0, 0, 0, ${0.5 * depthFade})`;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(near.x, near.wallTop);
  ctx.lineTo(near.x, near.wallBottom);
  ctx.stroke();

  // Wall decorations (moss, cracks, cobwebs) - drawn before fog
  const decorSeed = Math.floor(nearDepth * 1000) + (side === 'left' ? 0 : 5000);
  const corridorBounds = {
    nearX: near.x,
    farX: far.x,
    nearTop: near.wallTop,
    nearBottom: near.wallBottom,
    farTop: far.wallTop,
    farBottom: far.wallBottom,
  };

  // Moss on lower parts of walls
  if (seededRandom(decorSeed + 1) > 0.6) {
    drawMossCorridor(ctx, corridorBounds, side, avgDepth, decorSeed + 100);
  }

  // Cracks on some walls
  if (seededRandom(decorSeed + 2) > 0.65) {
    drawCracksCorridor(ctx, corridorBounds, side, avgDepth, decorSeed + 200);
  }

  // Cobwebs in upper corners
  if (seededRandom(decorSeed + 3) > 0.7) {
    drawCobwebsCorridor(ctx, corridorBounds, side, avgDepth, decorSeed + 300);
  }

  // Fog overlay using biome fog color
  const fogAmount = getFogAmount(avgDepth);
  if (fogAmount > 0) {
    ctx.fillStyle = `rgba(${fogR}, ${fogG}, ${fogB}, ${fogAmount})`;
    ctx.beginPath();
    ctx.moveTo(near.x, near.wallTop);
    ctx.lineTo(far.x, far.wallTop);
    ctx.lineTo(far.x, far.wallBottom);
    ctx.lineTo(near.x, near.wallBottom);
    ctx.closePath();
    ctx.fill();
  }

  // Note: Torches are now data-driven and rendered separately by torchLight.ts
}
