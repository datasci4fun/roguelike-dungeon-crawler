/**
 * Draw front-facing walls that block the corridor
 */
import { getProjection, seededRandom, getDepthFade, getFogAmount } from '../projection';

export function drawFrontWall(
  ctx: CanvasRenderingContext2D,
  depth: number,
  leftOffset: number,
  rightOffset: number,
  canvasWidth: number,
  canvasHeight: number,
  tile: string,
  time: number,
  enableAnimations: boolean
): void {
  const left = getProjection(canvasWidth, canvasHeight, depth, leftOffset);
  const right = getProjection(canvasWidth, canvasHeight, depth, rightOffset);

  const depthFade = getDepthFade(depth);
  const baseBrightness = 60;
  const brightness = Math.floor(baseBrightness * depthFade);

  // Main wall
  const gradient = ctx.createLinearGradient(left.x, left.wallTop, left.x, left.wallBottom);
  gradient.addColorStop(0, `rgb(${brightness + 15}, ${brightness + 15}, ${brightness + 25})`);
  gradient.addColorStop(0.5, `rgb(${brightness}, ${brightness}, ${brightness + 10})`);
  gradient.addColorStop(1, `rgb(${brightness - 10}, ${brightness - 10}, ${brightness})`);

  ctx.fillStyle = gradient;
  ctx.fillRect(left.x, left.wallTop, right.x - left.x, left.wallBottom - left.wallTop);

  // Stone texture
  const wallWidth = right.x - left.x;
  const wallHeight = left.wallBottom - left.wallTop;
  const brickRows = Math.max(2, Math.floor(4 - depth * 0.3));
  const brickCols = Math.max(1, Math.floor(wallWidth / 30));
  const brickH = wallHeight / brickRows;
  const brickW = wallWidth / brickCols;

  for (let row = 0; row < brickRows; row++) {
    const rowOffset = (row % 2) * (brickW / 2);
    for (let col = 0; col < brickCols + 1; col++) {
      const bx = left.x + col * brickW - rowOffset;
      const by = left.wallTop + row * brickH;

      if (bx < left.x || bx + brickW > right.x) continue;

      const seed = row * 10 + col + Math.floor(depth * 100);
      const variation = seededRandom(seed) * 15 - 7;
      const stoneBrightness = brightness + variation;

      ctx.fillStyle = `rgb(${stoneBrightness}, ${stoneBrightness}, ${stoneBrightness + 8})`;
      ctx.fillRect(bx + 2, by + 2, brickW - 4, brickH - 4);
    }

    // Mortar line
    ctx.fillStyle = `rgba(20, 20, 30, ${0.4 * depthFade})`;
    ctx.fillRect(left.x, left.wallTop + (row + 1) * brickH - 1, wallWidth, 2);
  }

  // Door handling
  if (tile === 'D' || tile === 'd') {
    drawDoor(ctx, left.x, left.wallTop, wallWidth, wallHeight, depthFade);
  }

  // Torch on walls (closer only)
  if (depth <= 4 && tile === '#' && wallWidth > 40) {
    drawTorch(ctx, left.x, right.x, left.wallTop, wallHeight, depthFade, time, enableAnimations);
  }

  // Fog overlay
  const fogAmount = getFogAmount(depth);
  if (fogAmount > 0) {
    ctx.fillStyle = `rgba(10, 10, 20, ${fogAmount})`;
    ctx.fillRect(left.x, left.wallTop, wallWidth, wallHeight);
  }
}

function drawDoor(
  ctx: CanvasRenderingContext2D,
  wallX: number,
  wallTop: number,
  wallWidth: number,
  wallHeight: number,
  depthFade: number
): void {
  const doorWidth = wallWidth * 0.6;
  const doorHeight = wallHeight * 0.85;
  const doorX = wallX + (wallWidth - doorWidth) / 2;
  const doorY = wallTop + wallHeight - doorHeight;

  ctx.fillStyle = `rgb(${Math.floor(80 * depthFade)}, ${Math.floor(50 * depthFade)}, ${Math.floor(30 * depthFade)})`;
  ctx.fillRect(doorX, doorY, doorWidth, doorHeight);

  // Door frame
  ctx.strokeStyle = `rgb(${Math.floor(50 * depthFade)}, ${Math.floor(30 * depthFade)}, ${Math.floor(20 * depthFade)})`;
  ctx.lineWidth = 3;
  ctx.strokeRect(doorX, doorY, doorWidth, doorHeight);

  // Door handle
  ctx.fillStyle = '#ffd700';
  ctx.beginPath();
  ctx.arc(doorX + doorWidth * 0.8, doorY + doorHeight * 0.5, 4, 0, Math.PI * 2);
  ctx.fill();
}

function drawTorch(
  ctx: CanvasRenderingContext2D,
  leftX: number,
  rightX: number,
  wallTop: number,
  wallHeight: number,
  depthFade: number,
  time: number,
  enableAnimations: boolean
): void {
  const torchX = (leftX + rightX) / 2;
  const torchY = wallTop + wallHeight * 0.3;
  const wallWidth = rightX - leftX;

  // Torch glow
  const flicker = enableAnimations ? Math.sin(time * 8) * 0.15 + 0.85 : 1;
  const glowGrad = ctx.createRadialGradient(torchX, torchY, 0, torchX, torchY, wallHeight * 0.4);
  glowGrad.addColorStop(0, `rgba(255, 150, 50, ${0.3 * flicker * depthFade})`);
  glowGrad.addColorStop(1, 'rgba(255, 100, 30, 0)');
  ctx.fillStyle = glowGrad;
  ctx.fillRect(leftX, wallTop, wallWidth, wallHeight);

  // Torch bracket
  ctx.fillStyle = '#3a3a3a';
  ctx.fillRect(torchX - 3, torchY, 6, 15);

  // Flame
  if (enableAnimations) {
    const flameH = 10 + Math.sin(time * 12) * 3;
    ctx.fillStyle = `rgba(255, 200, 50, ${flicker})`;
    ctx.beginPath();
    ctx.moveTo(torchX - 5, torchY);
    ctx.quadraticCurveTo(torchX, torchY - flameH, torchX + 5, torchY);
    ctx.fill();
  }
}
