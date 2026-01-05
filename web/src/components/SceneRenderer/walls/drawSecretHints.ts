/**
 * Draw subtle visual hints for hidden secret doors
 *
 * Shows faint cracks in walls that contain secret passages
 */
import { getProjection, getFogAmount } from '../projection';

interface SecretHintParams {
  ctx: CanvasRenderingContext2D;
  depth: number;
  offset: number;
  canvasWidth: number;
  canvasHeight: number;
  time: number;
  enableAnimations: boolean;
}

/**
 * Draw crack hints on a wall tile that contains a secret door
 */
export function drawSecretHints({
  ctx,
  depth,
  offset,
  canvasWidth,
  canvasHeight,
  time,
  enableAnimations,
}: SecretHintParams): void {
  // Don't draw hints at far distances
  if (depth > 4) return;

  const projection = getProjection(canvasWidth, canvasHeight, depth, offset);
  const fogAmount = getFogAmount(depth);

  // Hints fade with distance
  const visibility = (1 - fogAmount) * 0.6;
  if (visibility < 0.1) return;

  ctx.save();

  const wallLeft = projection.x - 15 * projection.scale;
  const wallRight = projection.x + 15 * projection.scale;
  const wallTop = projection.wallTop;
  const wallBottom = projection.wallBottom;
  const wallWidth = wallRight - wallLeft;
  const wallHeight = wallBottom - wallTop;

  // Subtle crack pattern
  ctx.strokeStyle = `rgba(30, 30, 25, ${visibility})`;
  ctx.lineWidth = Math.max(1, 2 * projection.scale);

  // Main vertical crack (door outline hint)
  const crackX = projection.x + wallWidth * 0.1;
  const crackTop = wallTop + wallHeight * 0.1;
  const crackBottom = wallBottom - wallHeight * 0.05;

  ctx.beginPath();
  ctx.moveTo(crackX, crackTop);
  // Jagged line down
  for (let y = crackTop; y < crackBottom; y += wallHeight * 0.1) {
    const wobble = (Math.sin(y * 0.1 + time * 0.5) * 2) * projection.scale;
    ctx.lineTo(crackX + wobble, y);
  }
  ctx.lineTo(crackX, crackBottom);
  ctx.stroke();

  // Small horizontal crack at top (door frame hint)
  ctx.beginPath();
  ctx.moveTo(crackX - wallWidth * 0.2, crackTop + wallHeight * 0.02);
  ctx.lineTo(crackX + wallWidth * 0.3, crackTop);
  ctx.stroke();

  // Dust particles near crack (very subtle)
  if (enableAnimations && depth <= 2) {
    const particleAlpha = visibility * 0.3;
    ctx.fillStyle = `rgba(100, 90, 80, ${particleAlpha})`;

    for (let i = 0; i < 3; i++) {
      const particlePhase = (time * 0.5 + i * 0.3) % 1;
      const px = crackX + Math.sin(i * 2.5) * 5 * projection.scale;
      const py = crackTop + particlePhase * wallHeight * 0.3;
      const size = Math.max(1, 1.5 * projection.scale * (1 - particlePhase));

      ctx.beginPath();
      ctx.arc(px, py, size, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  ctx.restore();
}
