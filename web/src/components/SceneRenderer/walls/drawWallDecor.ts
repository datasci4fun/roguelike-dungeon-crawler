/**
 * Wall decoration functions for visual variety
 * Adds moss, cracks, and cobwebs to dungeon walls
 */
import { seededRandom, getDepthFade } from '../projection';

interface WallBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface CorridorWallBounds {
  nearX: number;
  farX: number;
  nearTop: number;
  nearBottom: number;
  farTop: number;
  farBottom: number;
}

/**
 * Draw moss patches on a rectangular wall area
 */
export function drawMoss(
  ctx: CanvasRenderingContext2D,
  bounds: WallBounds,
  depth: number,
  seed: number
): void {
  const depthFade = getDepthFade(depth);
  const numPatches = Math.floor(seededRandom(seed) * 3) + 1;

  for (let i = 0; i < numPatches; i++) {
    const patchSeed = seed + i * 100;

    // Moss tends to grow on lower parts of walls
    const x = bounds.x + seededRandom(patchSeed) * bounds.width;
    const y = bounds.y + bounds.height * 0.5 + seededRandom(patchSeed + 1) * bounds.height * 0.45;
    const radius = (5 + seededRandom(patchSeed + 2) * 10) * depthFade;

    if (radius < 2) continue;

    // Create irregular moss shape with multiple overlapping circles
    const mossGreen = Math.floor(60 + seededRandom(patchSeed + 3) * 30);
    ctx.fillStyle = `rgba(30, ${mossGreen}, 20, ${0.4 * depthFade})`;

    // Main patch
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();

    // Secondary smaller patches around main
    for (let j = 0; j < 3; j++) {
      const offsetX = (seededRandom(patchSeed + 10 + j) - 0.5) * radius * 1.5;
      const offsetY = (seededRandom(patchSeed + 20 + j) - 0.5) * radius;
      const subRadius = radius * (0.3 + seededRandom(patchSeed + 30 + j) * 0.4);

      ctx.beginPath();
      ctx.arc(x + offsetX, y + offsetY, subRadius, 0, Math.PI * 2);
      ctx.fill();
    }

    // Darker spots within moss
    ctx.fillStyle = `rgba(20, ${mossGreen - 20}, 15, ${0.3 * depthFade})`;
    ctx.beginPath();
    ctx.arc(x + radius * 0.2, y + radius * 0.1, radius * 0.4, 0, Math.PI * 2);
    ctx.fill();
  }
}

/**
 * Draw moss on a corridor (perspective) wall
 */
export function drawMossCorridor(
  ctx: CanvasRenderingContext2D,
  bounds: CorridorWallBounds,
  side: 'left' | 'right',
  depth: number,
  seed: number
): void {
  const depthFade = getDepthFade(depth);
  const numPatches = Math.floor(seededRandom(seed) * 2) + 1;

  for (let i = 0; i < numPatches; i++) {
    const patchSeed = seed + i * 100;

    // Position along the wall (0 = near, 1 = far)
    const t = 0.3 + seededRandom(patchSeed) * 0.6;

    // Interpolate position based on perspective
    const x = bounds.nearX + (bounds.farX - bounds.nearX) * t;
    const wallTop = bounds.nearTop + (bounds.farTop - bounds.nearTop) * t;
    const wallBottom = bounds.nearBottom + (bounds.farBottom - bounds.nearBottom) * t;
    const wallHeight = wallBottom - wallTop;

    // Moss in lower half
    const y = wallTop + wallHeight * (0.6 + seededRandom(patchSeed + 1) * 0.35);
    const localScale = 1 - t * 0.5; // Smaller patches farther away
    const radius = (4 + seededRandom(patchSeed + 2) * 8) * depthFade * localScale;

    if (radius < 1.5) continue;

    const mossGreen = Math.floor(55 + seededRandom(patchSeed + 3) * 35);
    ctx.fillStyle = `rgba(25, ${mossGreen}, 18, ${0.35 * depthFade})`;

    // Offset from wall edge
    const edgeOffset = side === 'left' ? 3 : -3;

    ctx.beginPath();
    ctx.arc(x + edgeOffset, y, radius, 0, Math.PI * 2);
    ctx.fill();

    // Secondary patches
    for (let j = 0; j < 2; j++) {
      const offsetX = (seededRandom(patchSeed + 10 + j) - 0.5) * radius;
      const offsetY = (seededRandom(patchSeed + 20 + j) - 0.3) * radius;
      const subRadius = radius * (0.4 + seededRandom(patchSeed + 30 + j) * 0.3);

      ctx.beginPath();
      ctx.arc(x + edgeOffset + offsetX, y + offsetY, subRadius, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

/**
 * Draw cracks on a rectangular wall area
 */
export function drawCracks(
  ctx: CanvasRenderingContext2D,
  bounds: WallBounds,
  depth: number,
  seed: number
): void {
  const depthFade = getDepthFade(depth);
  const numCracks = Math.floor(seededRandom(seed) * 2) + 1;

  ctx.strokeStyle = `rgba(15, 15, 20, ${0.5 * depthFade})`;
  ctx.lineWidth = 1;

  for (let i = 0; i < numCracks; i++) {
    const crackSeed = seed + i * 200;

    // Start point
    const startX = bounds.x + seededRandom(crackSeed) * bounds.width;
    const startY = bounds.y + seededRandom(crackSeed + 1) * bounds.height;

    // Draw jagged crack line
    ctx.beginPath();
    ctx.moveTo(startX, startY);

    let x = startX;
    let y = startY;
    const segments = 3 + Math.floor(seededRandom(crackSeed + 2) * 4);
    const direction = seededRandom(crackSeed + 3) > 0.5 ? 1 : -1;

    for (let s = 0; s < segments; s++) {
      // Mostly downward with horizontal jitter
      x += (seededRandom(crackSeed + 10 + s) - 0.5) * 8;
      y += (3 + seededRandom(crackSeed + 20 + s) * 6) * direction;

      // Keep within bounds
      x = Math.max(bounds.x, Math.min(bounds.x + bounds.width, x));
      y = Math.max(bounds.y, Math.min(bounds.y + bounds.height, y));

      ctx.lineTo(x, y);
    }

    ctx.stroke();

    // Add branching crack
    if (seededRandom(crackSeed + 50) > 0.5) {
      const branchX = startX + (x - startX) * 0.4;
      const branchY = startY + (y - startY) * 0.4;

      ctx.beginPath();
      ctx.moveTo(branchX, branchY);
      ctx.lineTo(
        branchX + (seededRandom(crackSeed + 60) - 0.5) * 15,
        branchY + seededRandom(crackSeed + 61) * 10 * direction
      );
      ctx.stroke();
    }
  }
}

/**
 * Draw cracks on a corridor (perspective) wall
 */
export function drawCracksCorridor(
  ctx: CanvasRenderingContext2D,
  bounds: CorridorWallBounds,
  side: 'left' | 'right',
  depth: number,
  seed: number
): void {
  const depthFade = getDepthFade(depth);

  // Only draw if random check passes (not every wall has cracks)
  if (seededRandom(seed) > 0.4) return;

  ctx.strokeStyle = `rgba(15, 15, 20, ${0.45 * depthFade})`;
  ctx.lineWidth = 1;

  const crackSeed = seed + 300;

  // Position along the wall
  const t = 0.2 + seededRandom(crackSeed) * 0.6;

  // Interpolate position
  const x = bounds.nearX + (bounds.farX - bounds.nearX) * t;
  const wallTop = bounds.nearTop + (bounds.farTop - bounds.nearTop) * t;
  const wallBottom = bounds.nearBottom + (bounds.farBottom - bounds.nearBottom) * t;
  const wallHeight = wallBottom - wallTop;

  const startY = wallTop + seededRandom(crackSeed + 1) * wallHeight * 0.5;
  const edgeOffset = side === 'left' ? 4 : -4;

  ctx.beginPath();
  ctx.moveTo(x + edgeOffset, startY);

  let currentX = x + edgeOffset;
  let currentY = startY;
  const segments = 2 + Math.floor(seededRandom(crackSeed + 2) * 3);

  for (let s = 0; s < segments; s++) {
    currentX += (seededRandom(crackSeed + 10 + s) - 0.5) * 4;
    currentY += 4 + seededRandom(crackSeed + 20 + s) * 8;

    currentY = Math.min(wallBottom - 2, currentY);
    ctx.lineTo(currentX, currentY);
  }

  ctx.stroke();
}

/**
 * Draw cobwebs in corners of a rectangular wall
 */
export function drawCobwebs(
  ctx: CanvasRenderingContext2D,
  bounds: WallBounds,
  depth: number,
  seed: number,
  corners: ('topLeft' | 'topRight' | 'bottomLeft' | 'bottomRight')[] = ['topLeft', 'topRight']
): void {
  const depthFade = getDepthFade(depth);

  // Only draw if random check passes
  if (seededRandom(seed) > 0.35) return;

  ctx.strokeStyle = `rgba(180, 180, 190, ${0.25 * depthFade})`;
  ctx.lineWidth = 0.5;

  for (const corner of corners) {
    const webSeed = seed + (corner === 'topLeft' ? 0 : corner === 'topRight' ? 100 : corner === 'bottomLeft' ? 200 : 300);

    // Only some corners have webs
    if (seededRandom(webSeed) > 0.5) continue;

    let anchorX: number, anchorY: number;
    let dirX: number, dirY: number;

    switch (corner) {
      case 'topLeft':
        anchorX = bounds.x;
        anchorY = bounds.y;
        dirX = 1;
        dirY = 1;
        break;
      case 'topRight':
        anchorX = bounds.x + bounds.width;
        anchorY = bounds.y;
        dirX = -1;
        dirY = 1;
        break;
      case 'bottomLeft':
        anchorX = bounds.x;
        anchorY = bounds.y + bounds.height;
        dirX = 1;
        dirY = -1;
        break;
      case 'bottomRight':
        anchorX = bounds.x + bounds.width;
        anchorY = bounds.y + bounds.height;
        dirX = -1;
        dirY = -1;
        break;
    }

    const webSize = (15 + seededRandom(webSeed + 1) * 20) * depthFade;

    // Draw radial lines
    const numRays = 5 + Math.floor(seededRandom(webSeed + 2) * 3);
    const rays: { endX: number; endY: number }[] = [];

    for (let r = 0; r < numRays; r++) {
      const angle = (r / numRays) * Math.PI * 0.5;
      const rayLen = webSize * (0.7 + seededRandom(webSeed + 10 + r) * 0.3);
      const endX = anchorX + Math.cos(angle) * rayLen * dirX;
      const endY = anchorY + Math.sin(angle) * rayLen * dirY;

      rays.push({ endX, endY });

      ctx.beginPath();
      ctx.moveTo(anchorX, anchorY);
      ctx.lineTo(endX, endY);
      ctx.stroke();
    }

    // Draw concentric arcs connecting rays
    const numArcs = 2 + Math.floor(seededRandom(webSeed + 3) * 2);
    for (let a = 1; a <= numArcs; a++) {
      const arcT = a / (numArcs + 1);

      ctx.beginPath();
      for (let r = 0; r < rays.length; r++) {
        const ray = rays[r];
        const px = anchorX + (ray.endX - anchorX) * arcT;
        const py = anchorY + (ray.endY - anchorY) * arcT;

        if (r === 0) {
          ctx.moveTo(px, py);
        } else {
          ctx.lineTo(px, py);
        }
      }
      ctx.stroke();
    }
  }
}

/**
 * Draw cobwebs on corridor wall corners
 */
export function drawCobwebsCorridor(
  ctx: CanvasRenderingContext2D,
  bounds: CorridorWallBounds,
  side: 'left' | 'right',
  depth: number,
  seed: number
): void {
  const depthFade = getDepthFade(depth);

  // Only draw if random check passes
  if (seededRandom(seed + 400) > 0.3) return;

  ctx.strokeStyle = `rgba(170, 170, 180, ${0.2 * depthFade})`;
  ctx.lineWidth = 0.5;

  // Draw web in upper corner (near end)
  const webSeed = seed + 500;
  const webSize = (10 + seededRandom(webSeed) * 12) * depthFade;

  const anchorX = bounds.nearX;
  const anchorY = bounds.nearTop;
  const dirX = side === 'left' ? 1 : -1;
  const dirY = 1;

  // Radial lines
  const numRays = 4 + Math.floor(seededRandom(webSeed + 1) * 2);
  const rays: { endX: number; endY: number }[] = [];

  for (let r = 0; r < numRays; r++) {
    const angle = (r / numRays) * Math.PI * 0.4;
    const rayLen = webSize * (0.6 + seededRandom(webSeed + 10 + r) * 0.4);
    const endX = anchorX + Math.cos(angle) * rayLen * dirX;
    const endY = anchorY + Math.sin(angle) * rayLen * dirY;

    rays.push({ endX, endY });

    ctx.beginPath();
    ctx.moveTo(anchorX, anchorY);
    ctx.lineTo(endX, endY);
    ctx.stroke();
  }

  // Connecting arcs
  ctx.beginPath();
  const arcT = 0.6;
  for (let r = 0; r < rays.length; r++) {
    const ray = rays[r];
    const px = anchorX + (ray.endX - anchorX) * arcT;
    const py = anchorY + (ray.endY - anchorY) * arcT;

    if (r === 0) {
      ctx.moveTo(px, py);
    } else {
      ctx.lineTo(px, py);
    }
  }
  ctx.stroke();
}
