/**
 * Draw corridor side walls (perspective walls extending toward viewer)
 */
import { getProjection, seededRandom, getDepthFade, getFogAmount } from '../projection';

/**
 * Draw a wall-mounted torch on a side wall
 * Light sources stay bright - only the glow on surrounding walls fades with distance
 */
function drawSideWallTorch(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  scale: number,
  depthFade: number,
  time: number,
  enableAnimations: boolean,
  side: 'left' | 'right'
): void {
  const flicker = enableAnimations ? Math.sin(time * 8) * 0.15 + 0.85 : 1;

  // Glow on wall - this fades with distance (it illuminates the wall)
  const glowRadius = 40 * scale;
  const glowGrad = ctx.createRadialGradient(x, y, 0, x, y, glowRadius);
  glowGrad.addColorStop(0, `rgba(255, 160, 60, ${0.5 * flicker * depthFade})`);
  glowGrad.addColorStop(0.4, `rgba(255, 120, 40, ${0.3 * flicker * depthFade})`);
  glowGrad.addColorStop(1, 'rgba(255, 80, 20, 0)');
  ctx.fillStyle = glowGrad;
  ctx.beginPath();
  ctx.arc(x, y, glowRadius, 0, Math.PI * 2);
  ctx.fill();

  // Bracket - fades into darkness
  const bracketW = Math.max(2, 4 * scale);
  const bracketH = Math.max(3, 10 * scale);
  const offsetX = side === 'left' ? bracketW : -bracketW * 2;
  ctx.fillStyle = `rgb(${Math.floor(40 * depthFade)}, ${Math.floor(35 * depthFade)}, ${Math.floor(30 * depthFade)})`;
  ctx.fillRect(x + offsetX, y, bracketW, bracketH);

  // Flame - STAYS BRIGHT regardless of distance (it's the light source!)
  const flameW = Math.max(2, 8 * scale);
  const flameH = Math.max(3, (10 + (enableAnimations ? Math.sin(time * 10) * 2 : 0)) * scale);
  const flameX = x + offsetX + bracketW / 2;

  ctx.fillStyle = `rgba(255, 140, 30, ${flicker})`;
  ctx.beginPath();
  ctx.moveTo(flameX - flameW / 2, y);
  ctx.quadraticCurveTo(flameX, y - flameH, flameX + flameW / 2, y);
  ctx.fill();

  // Core - STAYS BRIGHT, pierces the darkness
  ctx.fillStyle = `rgba(255, 220, 100, ${flicker})`;
  ctx.beginPath();
  ctx.arc(flameX, y - flameH * 0.3, Math.max(1, 2 * scale), 0, Math.PI * 2);
  ctx.fill();
}

export function drawCorridorWall(
  ctx: CanvasRenderingContext2D,
  side: 'left' | 'right',
  nearDepth: number,
  farDepth: number,
  canvasWidth: number,
  canvasHeight: number,
  time: number,
  enableAnimations: boolean = true
): void {
  const xOffset = side === 'left' ? -1 : 1;

  const near = getProjection(canvasWidth, canvasHeight, nearDepth, xOffset);
  const far = getProjection(canvasWidth, canvasHeight, farDepth, xOffset);

  // Darker base - walls emerge from darkness
  // Left wall is darker (shadow side), right wall slightly lighter (torch side)
  const baseBrightness = side === 'left' ? 35 : 50;
  const avgDepth = (nearDepth + farDepth) / 2;
  const depthFade = getDepthFade(avgDepth);
  const brightness = Math.floor(baseBrightness * depthFade);
  // Warm torch tint
  const warmth = Math.floor(10 * depthFade);

  // Draw the wall quad with warm stone color
  ctx.fillStyle = `rgb(${brightness + warmth}, ${brightness + Math.floor(warmth * 0.6)}, ${brightness})`;
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
      const variation = seededRandom(seed) * 15 - 7;
      const brickBrightness = brightness + variation;

      ctx.fillStyle = `rgb(${brickBrightness + warmth}, ${brickBrightness + Math.floor(warmth * 0.6)}, ${brickBrightness})`;
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

  // Black fog overlay - pure darkness at distance
  // Applied BEFORE torches so light sources punch through
  const fogAmount = getFogAmount(avgDepth);
  if (fogAmount > 0) {
    ctx.fillStyle = `rgba(0, 0, 0, ${fogAmount})`;
    ctx.beginPath();
    ctx.moveTo(near.x, near.wallTop);
    ctx.lineTo(far.x, far.wallTop);
    ctx.lineTo(far.x, far.wallBottom);
    ctx.lineTo(near.x, near.wallBottom);
    ctx.closePath();
    ctx.fill();
  }

  // Add torch at regular intervals for depth reference
  // Torches appear every ~2 depth units on side walls
  // Drawn AFTER fog so they illuminate through darkness
  const torchDepth = Math.round(avgDepth);
  if (torchDepth >= 1 && torchDepth <= 5 && torchDepth % 2 === 1) {
    // Interpolate position along the wall
    const t = 0.5; // Middle of this wall segment
    const torchX = near.x + (far.x - near.x) * t;
    const torchY = near.wallTop + (near.wallBottom - near.wallTop) * 0.35;
    const torchScale = Math.max(0.3, 1 / (avgDepth * 0.5 + 0.5));

    drawSideWallTorch(ctx, torchX, torchY, torchScale, depthFade, time, enableAnimations, side);
  }
}
