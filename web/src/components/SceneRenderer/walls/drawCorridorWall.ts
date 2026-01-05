/**
 * Draw corridor side walls (perspective walls extending toward viewer)
 */
import { getProjection, seededRandom, getDepthFade, getFogAmount } from '../projection';
import { drawMossCorridor, drawCracksCorridor, drawCobwebsCorridor } from './drawWallDecor';

export function drawCorridorWall(
  ctx: CanvasRenderingContext2D,
  side: 'left' | 'right',
  nearDepth: number,
  farDepth: number,
  canvasWidth: number,
  canvasHeight: number,
  _time: number
): void {
  const xOffset = side === 'left' ? -1 : 1;

  const near = getProjection(canvasWidth, canvasHeight, nearDepth, xOffset);
  const far = getProjection(canvasWidth, canvasHeight, farDepth, xOffset);

  // Side wall is darker on left, lighter on right
  const baseBrightness = side === 'left' ? 50 : 70;
  const avgDepth = (nearDepth + farDepth) / 2;
  const depthFade = getDepthFade(avgDepth);
  const brightness = Math.floor(baseBrightness * depthFade);

  // Draw the wall quad
  ctx.fillStyle = `rgb(${brightness}, ${brightness}, ${brightness + 15})`;
  ctx.beginPath();
  ctx.moveTo(near.x, near.wallTop);
  ctx.lineTo(far.x, far.wallTop);
  ctx.lineTo(far.x, far.wallBottom);
  ctx.lineTo(near.x, near.wallBottom);
  ctx.closePath();
  ctx.fill();

  // Add stone brick texture
  const numBricks = Math.max(2, Math.floor(5 - avgDepth * 0.5));
  const brickHeight = (near.wallBottom - near.wallTop) / numBricks;

  for (let i = 0; i < numBricks; i++) {
    const t = i / numBricks;
    const nearY = near.wallTop + brickHeight * i;
    const farY = far.wallTop + (far.wallBottom - far.wallTop) * t;
    const nearYBottom = near.wallTop + brickHeight * (i + 1);
    const farYBottom = far.wallTop + (far.wallBottom - far.wallTop) * ((i + 1) / numBricks);

    // Brick variation
    const seed = i * 100 + (side === 'left' ? 0 : 500) + Math.floor(nearDepth * 10);
    const variation = seededRandom(seed) * 20 - 10;
    const brickBrightness = brightness + variation;

    ctx.fillStyle = `rgb(${brickBrightness}, ${brickBrightness}, ${brickBrightness + 12})`;
    ctx.beginPath();
    ctx.moveTo(near.x + (side === 'left' ? 2 : -2), nearY + 2);
    ctx.lineTo(far.x + (side === 'left' ? 2 : -2), farY + 2);
    ctx.lineTo(far.x + (side === 'left' ? 2 : -2), farYBottom - 2);
    ctx.lineTo(near.x + (side === 'left' ? 2 : -2), nearYBottom - 2);
    ctx.closePath();
    ctx.fill();

    // Mortar line
    ctx.strokeStyle = `rgba(20, 20, 30, ${0.5 * depthFade})`;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(near.x, nearYBottom);
    ctx.lineTo(far.x, farYBottom);
    ctx.stroke();
  }

  // Edge highlight
  ctx.strokeStyle = side === 'left'
    ? `rgba(0, 0, 0, ${0.3 * depthFade})`
    : `rgba(255, 255, 255, ${0.1 * depthFade})`;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(near.x, near.wallTop);
  ctx.lineTo(near.x, near.wallBottom);
  ctx.stroke();

  // Wall decorations (moss, cracks, cobwebs)
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

  // Fog overlay
  const fogAmount = getFogAmount(avgDepth);
  if (fogAmount > 0) {
    ctx.fillStyle = `rgba(10, 10, 20, ${fogAmount})`;
    ctx.beginPath();
    ctx.moveTo(near.x, near.wallTop);
    ctx.lineTo(far.x, far.wallTop);
    ctx.lineTo(far.x, far.wallBottom);
    ctx.lineTo(near.x, near.wallBottom);
    ctx.closePath();
    ctx.fill();
  }
}
