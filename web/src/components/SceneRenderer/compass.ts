/**
 * Compass HUD element for first-person view
 *
 * Renders a medieval-style compass strip at the top of the screen
 * showing cardinal and intercardinal directions.
 */

// Direction data: angle in degrees (0 = North, clockwise)
const DIRECTIONS = [
  { label: 'N', angle: 0, isCardinal: true },
  { label: 'NE', angle: 45, isCardinal: false },
  { label: 'E', angle: 90, isCardinal: true },
  { label: 'SE', angle: 135, isCardinal: false },
  { label: 'S', angle: 180, isCardinal: true },
  { label: 'SW', angle: 225, isCardinal: false },
  { label: 'W', angle: 270, isCardinal: true },
  { label: 'NW', angle: 315, isCardinal: false },
];

/**
 * Convert facing direction to angle in degrees
 */
function facingToAngle(dx: number, dy: number): number {
  // dy < 0 = North (0°), dx > 0 = East (90°), etc.
  if (dy < 0) return 0;   // North
  if (dx > 0) return 90;  // East
  if (dy > 0) return 180; // South
  if (dx < 0) return 270; // West
  return 0;
}

/**
 * Draw a stylized compass strip at the top of the canvas
 */
export function drawCompass(
  ctx: CanvasRenderingContext2D,
  canvasWidth: number,
  facingDx: number,
  facingDy: number,
  time: number,
  enableAnimations: boolean
): void {
  const playerAngle = facingToAngle(facingDx, facingDy);

  // Compass dimensions
  const compassWidth = Math.min(280, canvasWidth * 0.7);
  const compassHeight = 28;
  const compassX = (canvasWidth - compassWidth) / 2;
  const compassY = 8;
  const centerX = canvasWidth / 2;

  // Background - dark metal frame
  ctx.fillStyle = 'rgba(20, 18, 15, 0.85)';
  roundRect(ctx, compassX - 4, compassY - 2, compassWidth + 8, compassHeight + 4, 4);
  ctx.fill();

  // Metal border
  ctx.strokeStyle = 'rgba(80, 70, 55, 0.9)';
  ctx.lineWidth = 2;
  roundRect(ctx, compassX - 4, compassY - 2, compassWidth + 8, compassHeight + 4, 4);
  ctx.stroke();

  // Inner border highlight
  ctx.strokeStyle = 'rgba(120, 100, 70, 0.4)';
  ctx.lineWidth = 1;
  roundRect(ctx, compassX - 2, compassY, compassWidth + 4, compassHeight, 3);
  ctx.stroke();

  // Clip to compass area for direction labels
  ctx.save();
  ctx.beginPath();
  ctx.rect(compassX, compassY, compassWidth, compassHeight);
  ctx.clip();

  // Draw tick marks and direction labels
  // The compass shows a 180° view centered on player facing direction
  const degreesPerPixel = 180 / compassWidth;

  for (const dir of DIRECTIONS) {
    // Calculate relative angle from player's facing
    let relativeAngle = dir.angle - playerAngle;

    // Normalize to -180 to 180
    while (relativeAngle > 180) relativeAngle -= 360;
    while (relativeAngle < -180) relativeAngle += 360;

    // Only draw if within view (-90 to +90 degrees)
    if (relativeAngle >= -90 && relativeAngle <= 90) {
      const xOffset = relativeAngle / degreesPerPixel;
      const x = centerX + xOffset;

      // Distance from center affects opacity
      const distFromCenter = Math.abs(relativeAngle) / 90;
      const alpha = 1 - distFromCenter * 0.6;

      // Tick mark
      const tickHeight = dir.isCardinal ? 8 : 5;
      const tickY = compassY + compassHeight - tickHeight - 2;

      ctx.fillStyle = dir.isCardinal
        ? `rgba(200, 180, 140, ${alpha})`
        : `rgba(140, 120, 90, ${alpha * 0.7})`;
      ctx.fillRect(x - 1, tickY, 2, tickHeight);

      // Direction label
      ctx.font = dir.isCardinal ? 'bold 12px serif' : '10px serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';

      // Cardinal directions get special colors
      if (dir.isCardinal) {
        if (dir.label === 'N') {
          // North is gold/yellow
          ctx.fillStyle = `rgba(255, 215, 100, ${alpha})`;
        } else if (dir.label === 'S') {
          // South is reddish
          ctx.fillStyle = `rgba(200, 120, 100, ${alpha})`;
        } else {
          // East/West are neutral
          ctx.fillStyle = `rgba(200, 190, 170, ${alpha})`;
        }
      } else {
        ctx.fillStyle = `rgba(150, 140, 120, ${alpha * 0.8})`;
      }

      ctx.fillText(dir.label, x, compassY + 3);
    }
  }

  // Also draw intermediate tick marks every 15 degrees
  for (let angle = 0; angle < 360; angle += 15) {
    // Skip cardinal and intercardinal (already drawn)
    if (angle % 45 === 0) continue;

    let relativeAngle = angle - playerAngle;
    while (relativeAngle > 180) relativeAngle -= 360;
    while (relativeAngle < -180) relativeAngle += 360;

    if (relativeAngle >= -90 && relativeAngle <= 90) {
      const xOffset = relativeAngle / degreesPerPixel;
      const x = centerX + xOffset;
      const distFromCenter = Math.abs(relativeAngle) / 90;
      const alpha = (1 - distFromCenter * 0.7) * 0.5;

      ctx.fillStyle = `rgba(100, 90, 70, ${alpha})`;
      ctx.fillRect(x - 0.5, compassY + compassHeight - 4, 1, 3);
    }
  }

  ctx.restore();

  // Center marker (pointing down) - shows exact facing direction
  const markerSize = 6;
  ctx.fillStyle = '#ff9944';
  ctx.beginPath();
  ctx.moveTo(centerX - markerSize, compassY - 1);
  ctx.lineTo(centerX + markerSize, compassY - 1);
  ctx.lineTo(centerX, compassY + markerSize);
  ctx.closePath();
  ctx.fill();

  // Subtle glow on center marker
  if (enableAnimations) {
    const pulse = Math.sin(time * 2) * 0.15 + 0.85;
    ctx.fillStyle = `rgba(255, 153, 68, ${0.3 * pulse})`;
    ctx.beginPath();
    ctx.arc(centerX, compassY + 3, markerSize + 2, 0, Math.PI * 2);
    ctx.fill();
  }

  // Edge shadows for depth
  const edgeShadow = ctx.createLinearGradient(compassX, 0, compassX + 20, 0);
  edgeShadow.addColorStop(0, 'rgba(0, 0, 0, 0.5)');
  edgeShadow.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = edgeShadow;
  ctx.fillRect(compassX, compassY, 20, compassHeight);

  const edgeShadowRight = ctx.createLinearGradient(compassX + compassWidth - 20, 0, compassX + compassWidth, 0);
  edgeShadowRight.addColorStop(0, 'rgba(0, 0, 0, 0)');
  edgeShadowRight.addColorStop(1, 'rgba(0, 0, 0, 0.5)');
  ctx.fillStyle = edgeShadowRight;
  ctx.fillRect(compassX + compassWidth - 20, compassY, 20, compassHeight);
}

/**
 * Helper to draw rounded rectangles
 */
function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number
): void {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}
