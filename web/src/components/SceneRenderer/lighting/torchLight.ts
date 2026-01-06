/**
 * Torch light rendering with realistic radial glow
 */
import type { FirstPersonTorch } from '../../../hooks/useGameSocket';
import { getProjection, getDepthFade } from '../projection';

export interface TorchRenderParams {
  ctx: CanvasRenderingContext2D;
  torch: FirstPersonTorch;
  canvasWidth: number;
  canvasHeight: number;
  time: number;
  enableAnimations: boolean;
  playerFacingDx: number;
  playerFacingDy: number;
}

/**
 * Calculate the screen position and scale for a torch
 */
function getTorchScreenPosition(
  torch: FirstPersonTorch,
  canvasWidth: number,
  canvasHeight: number
): { x: number; y: number; scale: number } | null {
  const { distance, offset } = torch;

  // Skip torches behind player or too far
  if (distance < 0 || distance > 8) {
    return null;
  }

  // Use projection system
  const projection = getProjection(canvasWidth, canvasHeight, Math.max(0.5, distance), offset);

  // Torch is on wall, so position at wall height
  const x = projection.x;
  const y = projection.wallTop + (projection.wallBottom - projection.wallTop) * 0.35;
  const scale = projection.scale;

  return { x, y, scale };
}

/**
 * Draw a single torch with realistic radial light
 */
export function drawTorch(params: TorchRenderParams): void {
  const { ctx, torch, canvasWidth, canvasHeight, time, enableAnimations } = params;

  const pos = getTorchScreenPosition(torch, canvasWidth, canvasHeight);
  if (!pos) return;

  const { x, y, scale } = pos;
  const depthFade = getDepthFade(torch.distance);

  // Skip if too far
  if (depthFade < 0.1) return;

  ctx.save();

  // Flicker animation - randomized per torch for natural look
  const flicker = enableAnimations
    ? Math.sin(time * 8 + torch.x * 3.14) * 0.15 + 0.85
    : 1.0;
  const flicker2 = enableAnimations
    ? Math.sin(time * 12 + torch.y * 2.71) * 0.1 + 0.9
    : 1.0;

  const intensity = torch.intensity * flicker;
  const glowIntensity = Math.max(0.3, depthFade) * intensity;

  // Use additive blending for light effects
  ctx.globalCompositeOperation = 'lighter';

  // Draw realistic radial light glow (like real fire)
  drawRadialGlow(ctx, x, y, scale, torch.radius, glowIntensity, canvasWidth, canvasHeight);

  // Reset composite mode for torch body
  ctx.globalCompositeOperation = 'source-over';

  // Draw torch bracket and flame
  drawTorchBracket(ctx, x, y, scale, depthFade);
  drawTorchFlame(ctx, x, y, scale, depthFade, flicker, flicker2, enableAnimations, time);

  ctx.restore();
}

/**
 * Draw realistic radial light glow from torch
 * Real torches cast light in all directions with natural falloff
 */
function drawRadialGlow(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  scale: number,
  radius: number,
  intensity: number,
  canvasWidth: number,
  canvasHeight: number
): void {
  // Primary warm glow - large soft light
  const glowRadius = Math.min(canvasWidth, canvasHeight) * 0.35 * scale * (radius / 5);

  const gradient = ctx.createRadialGradient(x, y, 0, x, y, glowRadius);
  gradient.addColorStop(0, `rgba(255, 200, 120, ${0.6 * intensity})`);
  gradient.addColorStop(0.15, `rgba(255, 160, 80, ${0.4 * intensity})`);
  gradient.addColorStop(0.4, `rgba(255, 120, 50, ${0.2 * intensity})`);
  gradient.addColorStop(0.7, `rgba(200, 80, 30, ${0.08 * intensity})`);
  gradient.addColorStop(1, 'rgba(150, 50, 20, 0)');

  ctx.beginPath();
  ctx.arc(x, y, glowRadius, 0, Math.PI * 2);
  ctx.fillStyle = gradient;
  ctx.fill();

  // Secondary inner glow - bright core
  const coreRadius = glowRadius * 0.3;
  const coreGradient = ctx.createRadialGradient(x, y, 0, x, y, coreRadius);
  coreGradient.addColorStop(0, `rgba(255, 240, 200, ${0.5 * intensity})`);
  coreGradient.addColorStop(0.5, `rgba(255, 200, 120, ${0.25 * intensity})`);
  coreGradient.addColorStop(1, 'rgba(255, 150, 80, 0)');

  ctx.beginPath();
  ctx.arc(x, y, coreRadius, 0, Math.PI * 2);
  ctx.fillStyle = coreGradient;
  ctx.fill();
}

/**
 * Draw torch bracket (wall mount)
 */
function drawTorchBracket(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  scale: number,
  depthFade: number
): void {
  const bracketWidth = 6 * scale;
  const bracketHeight = 20 * scale;

  ctx.fillStyle = `rgba(60, 50, 40, ${depthFade})`;
  ctx.fillRect(x - bracketWidth / 2, y, bracketWidth, bracketHeight);

  // Bracket shadow
  ctx.fillStyle = `rgba(30, 25, 20, ${depthFade * 0.5})`;
  ctx.fillRect(x - bracketWidth / 2 - 1, y, 2, bracketHeight);
}

/**
 * Draw torch flame
 */
function drawTorchFlame(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  scale: number,
  depthFade: number,
  flicker: number,
  flicker2: number,
  enableAnimations: boolean,
  time: number
): void {
  const flameWidth = 8 * scale;
  const flameHeight = (12 + (enableAnimations ? Math.sin(time * 10) * 2 : 0)) * scale;

  // Outer flame (orange)
  ctx.fillStyle = `rgba(255, 140, 30, ${flicker * depthFade})`;
  ctx.beginPath();
  ctx.moveTo(x - flameWidth, y);
  ctx.quadraticCurveTo(x - flameWidth * 0.5, y - flameHeight * 0.7, x, y - flameHeight);
  ctx.quadraticCurveTo(x + flameWidth * 0.5, y - flameHeight * 0.7, x + flameWidth, y);
  ctx.closePath();
  ctx.fill();

  // Inner flame (yellow)
  const innerWidth = flameWidth * 0.6;
  const innerHeight = flameHeight * 0.7;
  ctx.fillStyle = `rgba(255, 220, 100, ${flicker2 * depthFade})`;
  ctx.beginPath();
  ctx.moveTo(x - innerWidth, y);
  ctx.quadraticCurveTo(x - innerWidth * 0.5, y - innerHeight * 0.7, x, y - innerHeight);
  ctx.quadraticCurveTo(x + innerWidth * 0.5, y - innerHeight * 0.7, x + innerWidth, y);
  ctx.closePath();
  ctx.fill();

  // Bright core
  ctx.fillStyle = `rgba(255, 255, 200, ${0.8 * depthFade})`;
  ctx.beginPath();
  ctx.arc(x, y - flameHeight * 0.3, 3 * scale, 0, Math.PI * 2);
  ctx.fill();
}

/**
 * Draw all torches in view
 */
export function drawTorches(
  ctx: CanvasRenderingContext2D,
  torches: FirstPersonTorch[],
  canvasWidth: number,
  canvasHeight: number,
  time: number,
  enableAnimations: boolean,
  playerFacingDx: number,
  playerFacingDy: number
): void {
  // Sort by distance (far to near) for proper layering
  const sortedTorches = [...torches].sort((a, b) => b.distance - a.distance);

  for (const torch of sortedTorches) {
    if (torch.is_lit) {
      drawTorch({
        ctx,
        torch,
        canvasWidth,
        canvasHeight,
        time,
        enableAnimations,
        playerFacingDx,
        playerFacingDy,
      });
    }
  }
}

/**
 * Apply lighting data to affect tile brightness
 * Returns a function that can be used to get light level at a position
 */
export function createLightingLookup(
  lighting: Record<string, number> | undefined
): (x: number, y: number) => number {
  if (!lighting || Object.keys(lighting).length === 0) {
    // No lighting data - return base ambient level
    return () => 0.2;
  }

  return (x: number, y: number) => {
    const key = `${x},${y}`;
    const lightLevel = lighting[key];
    if (lightLevel !== undefined) {
      // Combine with ambient (never fully dark)
      return Math.min(1.0, 0.1 + lightLevel);
    }
    // Not directly lit - use ambient
    return 0.15;
  };
}
