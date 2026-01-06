/**
 * Water reflection effects for first-person dungeon view
 * Renders animated water with ripples and reflections
 */
import { getProjection, getDepthFade, getFogAmount, seededRandom } from '../projection';

interface WaterBounds {
  nearLeft: { x: number; wallBottom: number };
  nearRight: { x: number; wallBottom: number };
  farLeft: { x: number; wallBottom: number };
  farRight: { x: number; wallBottom: number };
}

/**
 * Check if a tile character represents water
 */
export function isWaterTile(tile: string): boolean {
  // ≈ = deep water, ~ can be shallow water (but also fog in some contexts)
  // = is also used for water (ASCII-friendly alternative)
  return tile === '≈' || tile === '~' || tile === '=';
}

/**
 * Draw animated water surface with reflections
 */
export function drawWaterSurface(
  ctx: CanvasRenderingContext2D,
  bounds: WaterBounds,
  depth: number,
  time: number,
  enableAnimations: boolean,
  seed: number = 0
): void {
  const depthFade = getDepthFade(depth);
  const fogAmount = getFogAmount(depth);

  // Skip if too far/fogged out
  if (fogAmount > 0.9) return;

  const { nearLeft, nearRight, farLeft, farRight } = bounds;

  // Dark, murky water base color
  const baseBrightness = 15 * depthFade;
  const blueShift = 25 * depthFade;

  // Animated ripple offset
  const rippleTime = enableAnimations ? time : 0;
  const ripplePhase = rippleTime * 2 + seed * 0.1;

  // Draw base water color (dark blue-green)
  ctx.fillStyle = `rgb(${Math.floor(baseBrightness)}, ${Math.floor(baseBrightness + 5)}, ${Math.floor(baseBrightness + blueShift)})`;
  ctx.beginPath();
  ctx.moveTo(nearLeft.x, nearLeft.wallBottom);
  ctx.lineTo(nearRight.x, nearRight.wallBottom);
  ctx.lineTo(farRight.x, farRight.wallBottom);
  ctx.lineTo(farLeft.x, farLeft.wallBottom);
  ctx.closePath();
  ctx.fill();

  // Draw ripple lines
  if (depthFade > 0.2) {
    const numRipples = Math.max(2, Math.floor(4 * depthFade));

    for (let i = 0; i < numRipples; i++) {
      const t = (i + 0.5) / numRipples;
      const rippleY = nearLeft.wallBottom + (farLeft.wallBottom - nearLeft.wallBottom) * t;
      const rippleYRight = nearRight.wallBottom + (farRight.wallBottom - nearRight.wallBottom) * t;

      // Animated wave offset
      const waveOffset = enableAnimations
        ? Math.sin(ripplePhase + i * 0.8) * 2 * depthFade
        : 0;

      // Interpolate X positions
      const leftX = nearLeft.x + (farLeft.x - nearLeft.x) * t;
      const rightX = nearRight.x + (farRight.x - nearRight.x) * t;

      // Light reflection line
      const reflectionAlpha = 0.3 * depthFade * (1 - fogAmount);
      ctx.strokeStyle = `rgba(100, 150, 200, ${reflectionAlpha})`;
      ctx.lineWidth = Math.max(1, 2 * depthFade);
      ctx.beginPath();
      ctx.moveTo(leftX, rippleY + waveOffset);
      ctx.lineTo(rightX, rippleYRight + waveOffset);
      ctx.stroke();

      // Dark shadow line below
      ctx.strokeStyle = `rgba(0, 20, 40, ${reflectionAlpha * 0.5})`;
      ctx.beginPath();
      ctx.moveTo(leftX, rippleY + waveOffset + 2);
      ctx.lineTo(rightX, rippleYRight + waveOffset + 2);
      ctx.stroke();
    }
  }

  // Add shimmer highlights (random sparkles)
  if (depthFade > 0.3 && enableAnimations) {
    const numSparkles = Math.floor(3 * depthFade);

    for (let i = 0; i < numSparkles; i++) {
      const sparkleRng = seededRandom(seed + i * 100 + Math.floor(time * 3));
      const t = sparkleRng;
      const w = seededRandom(seed + i * 200 + Math.floor(time * 3)) - 0.5;

      const sparkleX = nearLeft.x + (farLeft.x - nearLeft.x) * t +
                       (nearRight.x - nearLeft.x + (farRight.x - farLeft.x - nearRight.x + nearLeft.x) * t) * (0.5 + w * 0.5);
      const sparkleY = nearLeft.wallBottom + (farLeft.wallBottom - nearLeft.wallBottom) * t;

      // Flickering sparkle
      const sparkleAlpha = (0.4 + Math.sin(time * 10 + i * 2) * 0.3) * depthFade * (1 - fogAmount);
      const sparkleSize = Math.max(1, 3 * depthFade);

      ctx.fillStyle = `rgba(180, 220, 255, ${sparkleAlpha})`;
      ctx.beginPath();
      ctx.arc(sparkleX, sparkleY, sparkleSize, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Torch reflection (warm glow on nearby water)
  if (depth < 3) {
    const glowIntensity = (1 - depth / 3) * 0.2 * depthFade;
    const centerX = (nearLeft.x + nearRight.x) / 2;
    const centerY = (nearLeft.wallBottom + nearRight.wallBottom) / 2;
    const glowRadius = Math.abs(nearRight.x - nearLeft.x) * 0.4;

    const torchFlicker = enableAnimations ? Math.sin(time * 8) * 0.15 + 0.85 : 1;
    const torchGlow = ctx.createRadialGradient(
      centerX, centerY, 0,
      centerX, centerY, glowRadius
    );
    torchGlow.addColorStop(0, `rgba(255, 140, 50, ${glowIntensity * torchFlicker})`);
    torchGlow.addColorStop(0.5, `rgba(200, 100, 30, ${glowIntensity * 0.3 * torchFlicker})`);
    torchGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');

    ctx.fillStyle = torchGlow;
    ctx.beginPath();
    ctx.moveTo(nearLeft.x, nearLeft.wallBottom);
    ctx.lineTo(nearRight.x, nearRight.wallBottom);
    ctx.lineTo(farRight.x, farRight.wallBottom);
    ctx.lineTo(farLeft.x, farLeft.wallBottom);
    ctx.closePath();
    ctx.fill();
  }

  // Apply fog overlay
  if (fogAmount > 0) {
    ctx.fillStyle = `rgba(0, 0, 0, ${fogAmount})`;
    ctx.beginPath();
    ctx.moveTo(nearLeft.x, nearLeft.wallBottom);
    ctx.lineTo(nearRight.x, nearRight.wallBottom);
    ctx.lineTo(farRight.x, farRight.wallBottom);
    ctx.lineTo(farLeft.x, farLeft.wallBottom);
    ctx.closePath();
    ctx.fill();
  }
}

/**
 * Draw water segment at a specific depth for corridor floor
 */
export function drawWaterSegment(
  ctx: CanvasRenderingContext2D,
  nearDepth: number,
  farDepth: number,
  leftOffset: number,
  rightOffset: number,
  canvasWidth: number,
  canvasHeight: number,
  time: number,
  enableAnimations: boolean,
  seed: number = 0
): void {
  const nearLeft = getProjection(canvasWidth, canvasHeight, nearDepth, leftOffset);
  const nearRight = getProjection(canvasWidth, canvasHeight, nearDepth, rightOffset);
  const farLeft = getProjection(canvasWidth, canvasHeight, farDepth, leftOffset);
  const farRight = getProjection(canvasWidth, canvasHeight, farDepth, rightOffset);

  const avgDepth = (nearDepth + farDepth) / 2;

  const bounds: WaterBounds = {
    nearLeft: { x: nearLeft.x, wallBottom: nearLeft.wallBottom },
    nearRight: { x: nearRight.x, wallBottom: nearRight.wallBottom },
    farLeft: { x: farLeft.x, wallBottom: farLeft.wallBottom },
    farRight: { x: farRight.x, wallBottom: farRight.wallBottom },
  };

  drawWaterSurface(ctx, bounds, avgDepth, time, enableAnimations, seed);
}
