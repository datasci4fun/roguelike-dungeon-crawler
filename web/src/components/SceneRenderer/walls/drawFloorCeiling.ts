/**
 * Draw floor and ceiling segments with perspective
 */
import { getProjection, getDepthFade, getFogAmount } from '../projection';
import { Colors } from '../colors';

/**
 * Draw a floor or ceiling segment between two depths
 */
export function drawFloorSegment(
  ctx: CanvasRenderingContext2D,
  nearDepth: number,
  farDepth: number,
  leftOffset: number,
  rightOffset: number,
  canvasWidth: number,
  canvasHeight: number,
  isFloor: boolean = true
): void {
  const nearLeft = getProjection(canvasWidth, canvasHeight, nearDepth, leftOffset);
  const nearRight = getProjection(canvasWidth, canvasHeight, nearDepth, rightOffset);
  const farLeft = getProjection(canvasWidth, canvasHeight, farDepth, leftOffset);
  const farRight = getProjection(canvasWidth, canvasHeight, farDepth, rightOffset);

  const avgDepth = (nearDepth + farDepth) / 2;
  const depthFade = getDepthFade(avgDepth);

  // Floor is darker, ceiling is lighter
  const baseBrightness = isFloor ? 35 : 25;
  const brightness = Math.floor(baseBrightness * depthFade);

  const yNearLeft = isFloor ? nearLeft.wallBottom : nearLeft.wallTop;
  const yNearRight = isFloor ? nearRight.wallBottom : nearRight.wallTop;
  const yFarLeft = isFloor ? farLeft.wallBottom : farLeft.wallTop;
  const yFarRight = isFloor ? farRight.wallBottom : farRight.wallTop;

  ctx.fillStyle = `rgb(${brightness}, ${brightness}, ${brightness + 10})`;
  ctx.beginPath();
  ctx.moveTo(nearLeft.x, yNearLeft);
  ctx.lineTo(nearRight.x, yNearRight);
  ctx.lineTo(farRight.x, yFarRight);
  ctx.lineTo(farLeft.x, yFarLeft);
  ctx.closePath();
  ctx.fill();

  // Grid lines for floor
  if (isFloor) {
    ctx.strokeStyle = `rgba(60, 60, 80, ${0.2 * depthFade})`;
    ctx.lineWidth = 1;

    // Horizontal line
    ctx.beginPath();
    ctx.moveTo(nearLeft.x, yNearLeft);
    ctx.lineTo(nearRight.x, yNearRight);
    ctx.stroke();
  }

  // Fog
  const fogAmount = getFogAmount(avgDepth, 0.5);
  if (fogAmount > 0) {
    ctx.fillStyle = `rgba(10, 10, 20, ${fogAmount})`;
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
 * Draw the background floor and ceiling gradients
 */
export function drawFloorAndCeiling(
  ctx: CanvasRenderingContext2D,
  canvasWidth: number,
  canvasHeight: number,
  time: number,
  enableAnimations: boolean
): void {
  const horizon = canvasHeight / 2;

  // Ceiling gradient
  const ceilingGrad = ctx.createLinearGradient(0, 0, 0, horizon);
  ceilingGrad.addColorStop(0, Colors.ceilingFar);
  ceilingGrad.addColorStop(1, Colors.ceilingNear);
  ctx.fillStyle = ceilingGrad;
  ctx.fillRect(0, 0, canvasWidth, horizon);

  // Floor gradient
  const floorGrad = ctx.createLinearGradient(0, horizon, 0, canvasHeight);
  floorGrad.addColorStop(0, Colors.floorNear);
  floorGrad.addColorStop(1, Colors.floorFar);
  ctx.fillStyle = floorGrad;
  ctx.fillRect(0, horizon, canvasWidth, horizon);

  // Add perspective floor tiles
  const numLines = 12;
  const centerX = canvasWidth / 2;

  for (let i = 1; i <= numLines; i++) {
    const t = i / numLines;
    const y = horizon + (canvasHeight - horizon) * (1 - Math.pow(1 - t, 2));
    const lineAlpha = 0.15 * (1 - t);

    // Horizontal floor lines
    ctx.strokeStyle = `rgba(60, 60, 80, ${lineAlpha})`;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(canvasWidth, y);
    ctx.stroke();

    // Perspective converging lines on floor
    const spread = canvasWidth * 0.8 * t;
    ctx.strokeStyle = `rgba(60, 60, 80, ${lineAlpha * 0.5})`;
    ctx.beginPath();
    ctx.moveTo(centerX - spread, y);
    ctx.lineTo(centerX, horizon);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(centerX + spread, y);
    ctx.lineTo(centerX, horizon);
    ctx.stroke();
  }

  // Add ceiling lines (subtler)
  for (let i = 1; i <= 8; i++) {
    const t = i / 8;
    const y = horizon * (1 - Math.pow(1 - t, 2));
    const lineAlpha = 0.08 * t;

    ctx.strokeStyle = `rgba(40, 40, 60, ${lineAlpha})`;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(canvasWidth, y);
    ctx.stroke();
  }

  // Ambient light effect in center (subtle)
  if (enableAnimations) {
    const pulse = Math.sin(time * 0.5) * 0.02 + 0.05;
    const ambientGrad = ctx.createRadialGradient(centerX, horizon, 0, centerX, horizon, canvasWidth * 0.6);
    ambientGrad.addColorStop(0, `rgba(100, 100, 140, ${pulse})`);
    ambientGrad.addColorStop(1, 'rgba(100, 100, 140, 0)');
    ctx.fillStyle = ambientGrad;
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);
  }
}
