/**
 * Draw floor and ceiling segments with perspective
 */
import { getProjection, getDepthFade, getFogAmount } from '../projection';
import type { BiomeTheme } from '../biomes';

export interface FloorSegmentOptions {
  biome?: BiomeTheme;
  brightness?: number;
}

/**
 * Draw a floor or ceiling segment between two depths
 * Segments fade to pure black at distance
 */
export function drawFloorSegment(
  ctx: CanvasRenderingContext2D,
  nearDepth: number,
  farDepth: number,
  leftOffset: number,
  rightOffset: number,
  canvasWidth: number,
  canvasHeight: number,
  isFloor: boolean = true,
  options: FloorSegmentOptions = {}
): void {
  const nearLeft = getProjection(canvasWidth, canvasHeight, nearDepth, leftOffset);
  const nearRight = getProjection(canvasWidth, canvasHeight, nearDepth, rightOffset);
  const farLeft = getProjection(canvasWidth, canvasHeight, farDepth, leftOffset);
  const farRight = getProjection(canvasWidth, canvasHeight, farDepth, rightOffset);

  const avgDepth = (nearDepth + farDepth) / 2;
  const depthFade = getDepthFade(avgDepth);

  // Use biome colors if provided
  const biome = options.biome;
  const globalBrightness = options.brightness ?? 1.0;

  let baseR: number, baseG: number, baseB: number;
  let lightR: number, lightG: number, lightB: number;
  let fogR: number, fogG: number, fogB: number;

  if (biome) {
    if (isFloor) {
      baseR = biome.floorColor[0];
      baseG = biome.floorColor[1];
      baseB = biome.floorColor[2];
    } else {
      baseR = biome.ceilingColor[0];
      baseG = biome.ceilingColor[1];
      baseB = biome.ceilingColor[2];
    }
    lightR = biome.lightColor[0];
    lightG = biome.lightColor[1];
    lightB = biome.lightColor[2];
    fogR = biome.fogColor[0];
    fogG = biome.fogColor[1];
    fogB = biome.fogColor[2];
  } else {
    // Default dungeon colors
    baseR = isFloor ? 40 : 20;
    baseG = isFloor ? 35 : 18;
    baseB = isFloor ? 30 : 15;
    lightR = 255; lightG = 150; lightB = 80;
    fogR = 0; fogG = 0; fogB = 0;
  }

  const brightness = depthFade * globalBrightness;

  // Mix floor/ceiling color with light tint
  const lightMix = 0.12 * depthFade;
  const finalR = Math.floor((baseR * (1 - lightMix) + lightR * lightMix) * brightness);
  const finalG = Math.floor((baseG * (1 - lightMix) + lightG * lightMix) * brightness);
  const finalB = Math.floor((baseB * (1 - lightMix) + lightB * lightMix) * brightness);

  const yNearLeft = isFloor ? nearLeft.wallBottom : nearLeft.wallTop;
  const yNearRight = isFloor ? nearRight.wallBottom : nearRight.wallTop;
  const yFarLeft = isFloor ? farLeft.wallBottom : farLeft.wallTop;
  const yFarRight = isFloor ? farRight.wallBottom : farRight.wallTop;

  ctx.fillStyle = `rgb(${finalR}, ${finalG}, ${finalB})`;
  ctx.beginPath();
  ctx.moveTo(nearLeft.x, yNearLeft);
  ctx.lineTo(nearRight.x, yNearRight);
  ctx.lineTo(farRight.x, yFarRight);
  ctx.lineTo(farLeft.x, yFarLeft);
  ctx.closePath();
  ctx.fill();

  // Fog overlay using biome fog color
  const fogAmount = getFogAmount(avgDepth);
  if (fogAmount > 0) {
    ctx.fillStyle = `rgba(${fogR}, ${fogG}, ${fogB}, ${fogAmount})`;
    ctx.beginPath();
    ctx.moveTo(nearLeft.x, yNearLeft);
    ctx.lineTo(nearRight.x, yNearRight);
    ctx.lineTo(farRight.x, yFarRight);
    ctx.lineTo(farLeft.x, yFarLeft);
    ctx.closePath();
    ctx.fill();
  }
}

/**
 * Draw the background - pure black dungeon with torch-lit area near player
 */
export function drawFloorAndCeiling(
  ctx: CanvasRenderingContext2D,
  canvasWidth: number,
  canvasHeight: number,
  time: number,
  enableAnimations: boolean
): void {
  const horizon = canvasHeight / 2;
  const centerX = canvasWidth / 2;

  // Everything starts as pure black
  ctx.fillStyle = '#000000';
  ctx.fillRect(0, 0, canvasWidth, canvasHeight);

  // Torch flicker
  const flicker = enableAnimations ? Math.sin(time * 8) * 0.1 + 0.9 : 1;

  // Only illuminate area near the player (bottom of screen)
  // This creates a small pool of light in the darkness

  // Floor - only visible near player, fades to black
  const floorGrad = ctx.createLinearGradient(0, canvasHeight, 0, horizon);
  floorGrad.addColorStop(0, `rgba(40, 35, 30, ${0.8 * flicker})`);  // Lit floor near player
  floorGrad.addColorStop(0.3, `rgba(25, 22, 18, ${0.5 * flicker})`);
  floorGrad.addColorStop(0.6, 'rgba(10, 8, 5, 0.3)');
  floorGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');  // Black at horizon
  ctx.fillStyle = floorGrad;
  ctx.fillRect(0, horizon, canvasWidth, horizon);

  // Ceiling - barely visible, mostly black
  const ceilingGrad = ctx.createLinearGradient(0, horizon, 0, 0);
  ceilingGrad.addColorStop(0, `rgba(20, 18, 15, ${0.3 * flicker})`);
  ceilingGrad.addColorStop(0.3, 'rgba(5, 4, 3, 0.1)');
  ceilingGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = ceilingGrad;
  ctx.fillRect(0, 0, canvasWidth, horizon);

  // Subtle warm torch glow on nearby surfaces
  const torchGrad = ctx.createRadialGradient(
    centerX, canvasHeight + 20, 0,
    centerX, canvasHeight + 20, canvasHeight * 0.5
  );
  torchGrad.addColorStop(0, `rgba(255, 140, 50, ${0.15 * flicker})`);
  torchGrad.addColorStop(0.4, `rgba(200, 100, 30, ${0.06 * flicker})`);
  torchGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = torchGrad;
  ctx.fillRect(0, horizon, canvasWidth, horizon);
}
