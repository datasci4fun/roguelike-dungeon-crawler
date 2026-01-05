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
  // Darker base - walls emerge from darkness
  const baseBrightness = 45;
  const brightness = Math.floor(baseBrightness * depthFade);
  // Warm tint from torch
  const warmth = Math.floor(12 * depthFade);

  // Main wall - warm lit stone
  const gradient = ctx.createLinearGradient(left.x, left.wallTop, left.x, left.wallBottom);
  gradient.addColorStop(0, `rgb(${brightness + warmth + 10}, ${brightness + Math.floor(warmth * 0.7) + 8}, ${brightness + 5})`);
  gradient.addColorStop(0.5, `rgb(${brightness + warmth}, ${brightness + Math.floor(warmth * 0.7)}, ${brightness})`);
  gradient.addColorStop(1, `rgb(${Math.max(0, brightness + warmth - 8)}, ${Math.max(0, brightness - 5)}, ${Math.max(0, brightness - 8)})`);

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

  // Black fog overlay - pure darkness at distance
  // Applied BEFORE torches so light sources punch through
  const fogAmount = getFogAmount(depth);
  if (fogAmount > 0) {
    ctx.fillStyle = `rgba(0, 0, 0, ${fogAmount})`;
    ctx.fillRect(left.x, left.wallTop, wallWidth, wallHeight);
  }

  // Torch on walls - drawn AFTER fog so they illuminate through darkness
  if (depth <= 6 && tile === '#' && wallWidth > 20) {
    drawTorch(ctx, left.x, right.x, left.wallTop, wallHeight, depthFade, time, enableAnimations, depth, canvasHeight);
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
  enableAnimations: boolean,
  depth: number = 2,
  canvasHeight: number = 300
): void {
  const torchX = (leftX + rightX) / 2;
  const torchY = wallTop + wallHeight * 0.3;
  const wallWidth = rightX - leftX;

  // Scale factor based on depth - closer = bigger
  const scale = Math.max(0.3, 1 / (depth * 0.5 + 0.5));

  // Flicker animation
  const flicker = enableAnimations ? Math.sin(time * 8 + depth) * 0.15 + 0.85 : 1;
  const flicker2 = enableAnimations ? Math.sin(time * 12 + depth * 2) * 0.1 + 0.9 : 1;

  // Large ambient glow - lights up the wall around the torch
  // This fades with distance (depthFade) as it illuminates the wall
  const ambientRadius = wallHeight * 0.8 * scale;
  const ambientGrad = ctx.createRadialGradient(torchX, torchY, 0, torchX, torchY, ambientRadius);
  ambientGrad.addColorStop(0, `rgba(255, 180, 80, ${0.6 * flicker * depthFade})`);
  ambientGrad.addColorStop(0.3, `rgba(255, 140, 50, ${0.4 * flicker * depthFade})`);
  ambientGrad.addColorStop(0.6, `rgba(255, 100, 30, ${0.2 * flicker * depthFade})`);
  ambientGrad.addColorStop(1, 'rgba(255, 80, 20, 0)');
  ctx.fillStyle = ambientGrad;
  ctx.fillRect(leftX - ambientRadius, wallTop - ambientRadius * 0.3, wallWidth + ambientRadius * 2, wallHeight + ambientRadius * 0.5);

  // Floor light pool - warm light cast down onto the floor
  // Also fades with distance
  const floorY = wallTop + wallHeight;
  const poolWidth = wallWidth * 0.6 * scale;
  const poolHeight = canvasHeight * 0.15 * scale;
  const floorGrad = ctx.createRadialGradient(
    torchX, floorY + poolHeight * 0.3, 0,
    torchX, floorY + poolHeight * 0.3, poolWidth
  );
  floorGrad.addColorStop(0, `rgba(255, 160, 60, ${0.3 * flicker * depthFade})`);
  floorGrad.addColorStop(0.5, `rgba(255, 120, 40, ${0.15 * flicker * depthFade})`);
  floorGrad.addColorStop(1, 'rgba(255, 80, 20, 0)');
  ctx.fillStyle = floorGrad;
  ctx.fillRect(torchX - poolWidth, floorY, poolWidth * 2, poolHeight);

  // Torch bracket - scaled with distance, fades into darkness
  const bracketWidth = Math.max(2, 6 * scale);
  const bracketHeight = Math.max(4, 15 * scale);
  ctx.fillStyle = `rgb(${Math.floor(50 * depthFade)}, ${Math.floor(45 * depthFade)}, ${Math.floor(40 * depthFade)})`;
  ctx.fillRect(torchX - bracketWidth / 2, torchY, bracketWidth, bracketHeight);

  // Flame - scaled with distance but STAYS BRIGHT (no depthFade on flame itself)
  // Light sources don't dim - they're the source of light!
  const flameWidth = Math.max(3, 12 * scale);
  const flameHeight = Math.max(4, (14 + (enableAnimations ? Math.sin(time * 12) * 4 : 0)) * scale);

  // Outer flame (orange) - full brightness
  ctx.fillStyle = `rgba(255, 140, 30, ${flicker})`;
  ctx.beginPath();
  ctx.moveTo(torchX - flameWidth * 0.6, torchY);
  ctx.quadraticCurveTo(torchX - flameWidth * 0.3, torchY - flameHeight * 0.6, torchX, torchY - flameHeight);
  ctx.quadraticCurveTo(torchX + flameWidth * 0.3, torchY - flameHeight * 0.6, torchX + flameWidth * 0.6, torchY);
  ctx.fill();

  // Inner flame (yellow/white core) - full brightness
  const innerFlameH = flameHeight * 0.7 * flicker2;
  ctx.fillStyle = `rgba(255, 220, 100, ${flicker2})`;
  ctx.beginPath();
  ctx.moveTo(torchX - flameWidth * 0.25, torchY);
  ctx.quadraticCurveTo(torchX, torchY - innerFlameH, torchX + flameWidth * 0.25, torchY);
  ctx.fill();

  // Bright core point - always visible, pierces darkness
  const coreSize = Math.max(1, 3 * scale);
  ctx.fillStyle = `rgba(255, 255, 200, ${flicker})`;
  ctx.beginPath();
  ctx.arc(torchX, torchY - flameHeight * 0.3, coreSize, 0, Math.PI * 2);
  ctx.fill();

  // Sparks (only for close torches) - these can fade slightly
  if (enableAnimations && depth <= 3 && scale > 0.5) {
    const numSparks = Math.floor(3 * scale);
    for (let i = 0; i < numSparks; i++) {
      const sparkTime = (time * 3 + i * 1.5) % 1;
      const sparkX = torchX + Math.sin(time * 5 + i * 2) * flameWidth * 0.4;
      const sparkY = torchY - flameHeight * sparkTime - flameHeight * 0.2;
      const sparkAlpha = (1 - sparkTime) * 0.9;
      const sparkSize = Math.max(0.5, 1.5 * scale * (1 - sparkTime));

      ctx.fillStyle = `rgba(255, 200, 50, ${sparkAlpha})`;
      ctx.beginPath();
      ctx.arc(sparkX, sparkY, sparkSize, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}
