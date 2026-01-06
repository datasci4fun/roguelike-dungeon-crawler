/**
 * Draw stairs (up or down) in the first-person view
 */
import { getProjection, getDepthFade, getFogAmount } from '../projection';

interface DrawStairsParams {
  ctx: CanvasRenderingContext2D;
  centerX: number;
  floorY: number;
  width: number;
  height: number;
  scale: number;
  direction: 'down' | 'up';
  distance: number;
  time: number;
  enableAnimations: boolean;
  fogAlpha: number;
}

/**
 * Draw stairs leading down or up
 */
export function drawStairs({
  ctx,
  centerX,
  floorY,
  width,
  height,
  scale,
  direction,
  distance,
  time: _time,
  enableAnimations: _enableAnimations,
  fogAlpha,
}: DrawStairsParams): void {
  const depthFade = getDepthFade(distance);

  // Skip if too fogged out
  if (fogAlpha > 0.9) return;

  const stairWidth = width * 0.8;
  const stairDepth = height * 0.6;
  const numSteps = 4;
  const stepHeight = stairDepth / numSteps;
  const stepWidth = stairWidth;

  // Starting position
  const startX = centerX - stairWidth / 2;
  const startY = floorY - height * 0.1;

  ctx.save();

  // Draw the stair opening (dark hole for down, lighter area for up)
  if (direction === 'down') {
    // Dark opening
    const gradient = ctx.createLinearGradient(startX, startY, startX, startY + stairDepth);
    gradient.addColorStop(0, `rgba(20, 15, 10, ${0.8 * depthFade})`);
    gradient.addColorStop(1, `rgba(0, 0, 0, ${0.95 * depthFade})`);
    ctx.fillStyle = gradient;
  } else {
    // Lighter opening for stairs up
    const gradient = ctx.createLinearGradient(startX, startY + stairDepth, startX, startY);
    gradient.addColorStop(0, `rgba(40, 35, 30, ${0.8 * depthFade})`);
    gradient.addColorStop(1, `rgba(80, 70, 60, ${0.6 * depthFade})`);
    ctx.fillStyle = gradient;
  }

  // Draw the stair opening trapezoid
  ctx.beginPath();
  ctx.moveTo(startX, startY);
  ctx.lineTo(startX + stairWidth, startY);
  ctx.lineTo(startX + stairWidth * 0.8, startY + stairDepth);
  ctx.lineTo(startX + stairWidth * 0.2, startY + stairDepth);
  ctx.closePath();
  ctx.fill();

  // Draw individual steps
  for (let i = 0; i < numSteps; i++) {
    const stepY = startY + stepHeight * i;
    const stepScale = 1 - (i * 0.15); // Steps get narrower as they go down
    const currentStepWidth = stepWidth * stepScale;
    const stepX = centerX - currentStepWidth / 2;

    // Step top surface
    const brightness = direction === 'down'
      ? Math.floor(50 * depthFade * (1 - i * 0.2))
      : Math.floor(70 * depthFade * (1 - i * 0.15));

    ctx.fillStyle = `rgb(${brightness + 10}, ${brightness + 5}, ${brightness})`;
    ctx.fillRect(stepX, stepY, currentStepWidth, stepHeight * 0.3);

    // Step front face (darker)
    ctx.fillStyle = `rgb(${Math.floor(brightness * 0.6)}, ${Math.floor(brightness * 0.55)}, ${Math.floor(brightness * 0.5)})`;
    ctx.fillRect(stepX, stepY + stepHeight * 0.3, currentStepWidth, stepHeight * 0.7);

    // Step edge highlight
    ctx.strokeStyle = `rgba(100, 90, 80, ${0.3 * depthFade})`;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(stepX, stepY);
    ctx.lineTo(stepX + currentStepWidth, stepY);
    ctx.stroke();
  }

  // Add direction indicator arrow
  const arrowY = startY + stairDepth * 0.5;
  const arrowSize = Math.max(8, 15 * scale);

  ctx.fillStyle = `rgba(200, 180, 100, ${0.7 * depthFade})`;
  ctx.beginPath();
  if (direction === 'down') {
    // Down arrow
    ctx.moveTo(centerX, arrowY + arrowSize);
    ctx.lineTo(centerX - arrowSize * 0.6, arrowY);
    ctx.lineTo(centerX + arrowSize * 0.6, arrowY);
  } else {
    // Up arrow
    ctx.moveTo(centerX, arrowY - arrowSize);
    ctx.lineTo(centerX - arrowSize * 0.6, arrowY);
    ctx.lineTo(centerX + arrowSize * 0.6, arrowY);
  }
  ctx.closePath();
  ctx.fill();

  // Apply fog
  if (fogAlpha > 0) {
    ctx.fillStyle = `rgba(0, 0, 0, ${fogAlpha * 0.5})`;
    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.lineTo(startX + stairWidth, startY);
    ctx.lineTo(startX + stairWidth * 0.8, startY + stairDepth);
    ctx.lineTo(startX + stairWidth * 0.2, startY + stairDepth);
    ctx.closePath();
    ctx.fill();
  }

  ctx.restore();
}

/**
 * Render stairs at a position in the first-person view
 */
export function renderStairs(
  ctx: CanvasRenderingContext2D,
  canvasWidth: number,
  canvasHeight: number,
  distance: number,
  offset: number,
  direction: 'down' | 'up',
  time: number,
  enableAnimations: boolean
): void {
  const projection = getProjection(canvasWidth, canvasHeight, distance, offset);
  const fogAlpha = getFogAmount(distance);

  const baseY = projection.wallBottom;
  const scale = projection.scale * 1.5;
  const stairHeight = canvasHeight * 0.25 * scale;
  const stairWidth = stairHeight * 1.2;

  drawStairs({
    ctx,
    centerX: projection.x,
    floorY: baseY,
    width: stairWidth,
    height: stairHeight,
    scale,
    direction,
    distance,
    time,
    enableAnimations,
    fogAlpha,
  });
}
