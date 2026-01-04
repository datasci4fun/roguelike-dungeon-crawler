/**
 * FirstPersonRenderer - Canvas-based first-person dungeon view
 *
 * Renders a pseudo-3D view of the dungeon from the player's perspective,
 * showing walls, floor, ceiling, and entities in front of the player.
 */
import { useRef, useEffect, useCallback } from 'react';
import type { FirstPersonView, FirstPersonEntity } from '../../hooks/useGameSocket';

interface FirstPersonRendererProps {
  view: FirstPersonView | undefined;
  width?: number;
  height?: number;
  enableAnimations?: boolean;
}

// Color palette for the renderer
const Colors = {
  // Sky/ceiling gradient
  ceilingNear: '#1a1a2e',
  ceilingFar: '#0a0a14',

  // Floor gradient
  floorNear: '#2a2a3e',
  floorFar: '#1a1a28',

  // Walls by tile type
  wall: '#5a5a6e',
  wallDark: '#3a3a4e',
  wallLight: '#6a6a7e',
  wallHighlight: '#7a7a8e',

  // Stone colors for texture
  stone1: '#4a4a5a',
  stone2: '#555565',
  stone3: '#454555',
  mortar: '#3a3a4a',

  // Door
  door: '#8b4513',
  doorFrame: '#654321',
  doorHighlight: '#a55a23',

  // Stairs
  stairsUp: '#50fa7b',
  stairsDown: '#ff79c6',

  // Fog/darkness
  fog: 'rgba(10, 10, 20, 0.8)',
  darkness: '#0a0a14',

  // Entity colors
  enemy: '#ff5555',
  enemyElite: '#ffb86c',
  item: '#f1fa8c',

  // Floor tiles
  floor: '#252535',
  explored: '#1a1a28',

  // Torch light
  torchLight: '#ffaa44',
  torchGlow: 'rgba(255, 170, 68, 0.15)',
};

export function FirstPersonRenderer({
  view,
  width = 400,
  height = 300,
  enableAnimations = true,
}: FirstPersonRendererProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);
  const timeRef = useRef<number>(0);

  // Map tile characters to wall/floor types
  const isWall = useCallback((tile: string) => {
    return tile === '#' || tile === '+' || tile === '~';
  }, []);

  const isStairsUp = useCallback((tile: string) => {
    return tile === '<';
  }, []);

  const isStairsDown = useCallback((tile: string) => {
    return tile === '>';
  }, []);

  const isDoor = useCallback((tile: string) => {
    return tile === 'D' || tile === 'd';
  }, []);

  // Seeded random for consistent stone patterns
  const seededRandom = useCallback((seed: number) => {
    const x = Math.sin(seed * 12.9898) * 43758.5453;
    return x - Math.floor(x);
  }, []);

  // Draw a wall segment with perspective and depth
  const drawWall = useCallback((
    ctx: CanvasRenderingContext2D,
    x: number,
    wallHeight: number,
    distance: number,
    tile: string,
    _canvasWidth: number,
    canvasHeight: number,
    segmentWidth: number,
    time: number,
    colIdx: number = 0,
    isLeftEdge: boolean = false,
    isRightEdge: boolean = false
  ) => {
    const wallTop = (canvasHeight - wallHeight) / 2;
    const wallBottom = (canvasHeight + wallHeight) / 2;

    // Distance-based shading (fog effect)
    const shadeFactor = Math.max(0.25, 1 - distance * 0.09);
    const fogFactor = Math.min(0.7, distance * 0.08);

    // Determine wall type colors
    let baseColor = Colors.wall;
    let darkColor = Colors.wallDark;
    let lightColor = Colors.wallLight;

    if (isDoor(tile)) {
      baseColor = Colors.door;
      darkColor = Colors.doorFrame;
      lightColor = Colors.doorHighlight;
    } else if (isStairsUp(tile)) {
      baseColor = Colors.stairsUp;
      darkColor = '#30da5b';
      lightColor = '#70ff9b';
    } else if (isStairsDown(tile)) {
      baseColor = Colors.stairsDown;
      darkColor = '#df59a6';
      lightColor = '#ff99d6';
    }

    // Parse base color
    const parseColor = (color: string) => ({
      r: parseInt(color.slice(1, 3), 16),
      g: parseInt(color.slice(3, 5), 16),
      b: parseInt(color.slice(5, 7), 16),
    });

    const base = parseColor(baseColor);
    const dark = parseColor(darkColor);
    const light = parseColor(lightColor);

    // Apply distance shading
    const shadeColor = (c: { r: number; g: number; b: number }) => ({
      r: Math.floor(c.r * shadeFactor),
      g: Math.floor(c.g * shadeFactor),
      b: Math.floor(c.b * shadeFactor),
    });

    const shadedBase = shadeColor(base);
    const shadedDark = shadeColor(dark);
    const shadedLight = shadeColor(light);

    // Create vertical gradient for wall face (lighter at top, darker at bottom)
    const wallGradient = ctx.createLinearGradient(x, wallTop, x, wallBottom);
    wallGradient.addColorStop(0, `rgb(${shadedLight.r}, ${shadedLight.g}, ${shadedLight.b})`);
    wallGradient.addColorStop(0.3, `rgb(${shadedBase.r}, ${shadedBase.g}, ${shadedBase.b})`);
    wallGradient.addColorStop(1, `rgb(${shadedDark.r}, ${shadedDark.g}, ${shadedDark.b})`);

    // Draw main wall face
    ctx.fillStyle = wallGradient;
    ctx.fillRect(x, wallTop, segmentWidth + 1, wallHeight);

    // Draw stone/brick texture for regular walls
    if (!isDoor(tile) && !isStairsUp(tile) && !isStairsDown(tile)) {
      const brickRows = Math.max(2, Math.floor(6 - distance * 0.5));
      const brickHeight = wallHeight / brickRows;
      const brickCols = Math.max(1, Math.floor(3 - distance * 0.3));
      const brickWidth = segmentWidth / brickCols;
      const mortarWidth = Math.max(1, 2 - distance * 0.2);

      // Draw individual stones
      for (let row = 0; row < brickRows; row++) {
        const rowOffset = (row % 2) * (brickWidth / 2); // Stagger rows
        const brickY = wallTop + row * brickHeight;

        for (let col = 0; col < brickCols + 1; col++) {
          const brickX = x + col * brickWidth - rowOffset;

          // Skip if brick is outside segment
          if (brickX + brickWidth < x || brickX > x + segmentWidth) continue;

          // Seed based on position for consistent randomness
          const seed = (colIdx * 100 + row * 10 + col) * distance;
          const variation = seededRandom(seed);

          // Stone color variation
          const stoneShade = 0.85 + variation * 0.3;
          const stoneR = Math.floor(shadedBase.r * stoneShade);
          const stoneG = Math.floor(shadedBase.g * stoneShade);
          const stoneB = Math.floor(shadedBase.b * stoneShade);

          // Draw stone with inset effect
          const inset = mortarWidth;
          const stoneTop = brickY + inset;
          const stoneLeft = Math.max(x, brickX + inset);
          const stoneRight = Math.min(x + segmentWidth, brickX + brickWidth - inset);
          const stoneBottom = brickY + brickHeight - inset;

          if (stoneRight > stoneLeft && stoneBottom > stoneTop) {
            // Stone face with slight gradient
            const stoneGrad = ctx.createLinearGradient(stoneLeft, stoneTop, stoneLeft, stoneBottom);
            stoneGrad.addColorStop(0, `rgb(${Math.min(255, stoneR + 15)}, ${Math.min(255, stoneG + 15)}, ${Math.min(255, stoneB + 15)})`);
            stoneGrad.addColorStop(1, `rgb(${stoneR}, ${stoneG}, ${stoneB})`);
            ctx.fillStyle = stoneGrad;
            ctx.fillRect(stoneLeft, stoneTop, stoneRight - stoneLeft, stoneBottom - stoneTop);

            // Top highlight edge
            ctx.fillStyle = `rgba(255, 255, 255, ${0.1 * shadeFactor})`;
            ctx.fillRect(stoneLeft, stoneTop, stoneRight - stoneLeft, 1);

            // Left highlight edge
            ctx.fillRect(stoneLeft, stoneTop, 1, stoneBottom - stoneTop);

            // Bottom shadow edge
            ctx.fillStyle = `rgba(0, 0, 0, ${0.2 * shadeFactor})`;
            ctx.fillRect(stoneLeft, stoneBottom - 1, stoneRight - stoneLeft, 1);

            // Right shadow edge
            ctx.fillRect(stoneRight - 1, stoneTop, 1, stoneBottom - stoneTop);
          }
        }

        // Mortar line (horizontal)
        ctx.fillStyle = `rgba(30, 30, 40, ${0.5 * shadeFactor})`;
        ctx.fillRect(x, brickY, segmentWidth, mortarWidth);
      }
    }

    // Door specific details
    if (isDoor(tile)) {
      const doorInset = segmentWidth * 0.1;
      const doorTop = wallTop + wallHeight * 0.05;
      const doorBottom = wallBottom;
      const doorLeft = x + doorInset;
      const doorRight = x + segmentWidth - doorInset;

      // Door frame (dark border)
      ctx.fillStyle = `rgb(${shadedDark.r}, ${shadedDark.g}, ${shadedDark.b})`;
      ctx.fillRect(doorLeft - 3, doorTop, 3, doorBottom - doorTop);
      ctx.fillRect(doorRight, doorTop, 3, doorBottom - doorTop);
      ctx.fillRect(doorLeft - 3, doorTop - 3, doorRight - doorLeft + 6, 3);

      // Door panels
      const panelHeight = (doorBottom - doorTop) * 0.35;
      const panelWidth = (doorRight - doorLeft) * 0.35;
      const panelGap = (doorRight - doorLeft) * 0.1;

      ctx.fillStyle = `rgba(0, 0, 0, ${0.3 * shadeFactor})`;
      // Top left panel
      ctx.fillRect(doorLeft + panelGap, doorTop + panelGap, panelWidth, panelHeight);
      // Top right panel
      ctx.fillRect(doorRight - panelGap - panelWidth, doorTop + panelGap, panelWidth, panelHeight);
      // Bottom left panel
      ctx.fillRect(doorLeft + panelGap, doorBottom - panelGap - panelHeight, panelWidth, panelHeight);
      // Bottom right panel
      ctx.fillRect(doorRight - panelGap - panelWidth, doorBottom - panelGap - panelHeight, panelWidth, panelHeight);

      // Door handle
      const handleY = (doorTop + doorBottom) / 2;
      const handleX = doorRight - segmentWidth * 0.2;
      ctx.fillStyle = `rgb(${Math.min(255, shadedLight.r + 40)}, ${Math.min(255, shadedLight.g + 30)}, ${shadedLight.b})`;
      ctx.beginPath();
      ctx.arc(handleX, handleY, Math.max(2, segmentWidth * 0.05), 0, Math.PI * 2);
      ctx.fill();
    }

    // 3D edge effects for wall sides
    const edgeWidth = Math.max(2, segmentWidth * 0.08);

    // Left edge (darker - shadow side)
    if (isLeftEdge) {
      const leftEdgeGrad = ctx.createLinearGradient(x, wallTop, x + edgeWidth, wallTop);
      leftEdgeGrad.addColorStop(0, `rgba(0, 0, 0, ${0.5 * shadeFactor})`);
      leftEdgeGrad.addColorStop(1, `rgba(0, 0, 0, 0)`);
      ctx.fillStyle = leftEdgeGrad;
      ctx.fillRect(x, wallTop, edgeWidth, wallHeight);
    }

    // Right edge (lighter - lit side)
    if (isRightEdge) {
      const rightEdgeGrad = ctx.createLinearGradient(x + segmentWidth - edgeWidth, wallTop, x + segmentWidth, wallTop);
      rightEdgeGrad.addColorStop(0, `rgba(0, 0, 0, 0)`);
      rightEdgeGrad.addColorStop(1, `rgba(0, 0, 0, ${0.4 * shadeFactor})`);
      ctx.fillStyle = rightEdgeGrad;
      ctx.fillRect(x + segmentWidth - edgeWidth, wallTop, edgeWidth, wallHeight);
    }

    // Top edge shadow (ceiling junction)
    const topShadowHeight = Math.max(3, wallHeight * 0.05);
    const topShadowGrad = ctx.createLinearGradient(x, wallTop, x, wallTop + topShadowHeight);
    topShadowGrad.addColorStop(0, `rgba(0, 0, 0, ${0.4 * shadeFactor})`);
    topShadowGrad.addColorStop(1, `rgba(0, 0, 0, 0)`);
    ctx.fillStyle = topShadowGrad;
    ctx.fillRect(x, wallTop, segmentWidth, topShadowHeight);

    // Bottom edge shadow (floor junction)
    const bottomShadowHeight = Math.max(4, wallHeight * 0.08);
    const bottomShadowGrad = ctx.createLinearGradient(x, wallBottom - bottomShadowHeight, x, wallBottom);
    bottomShadowGrad.addColorStop(0, `rgba(0, 0, 0, 0)`);
    bottomShadowGrad.addColorStop(1, `rgba(0, 0, 0, ${0.5 * shadeFactor})`);
    ctx.fillStyle = bottomShadowGrad;
    ctx.fillRect(x, wallBottom - bottomShadowHeight, segmentWidth, bottomShadowHeight);

    // Torch light effect (every few segments, closer walls only)
    if (distance <= 4 && colIdx % 3 === 1 && !isDoor(tile) && !isStairsUp(tile) && !isStairsDown(tile)) {
      const torchY = wallTop + wallHeight * 0.3;
      const torchX = x + segmentWidth / 2;
      const torchRadius = wallHeight * 0.4;

      // Flickering glow
      const flicker = enableAnimations ? Math.sin(time * 8 + colIdx) * 0.15 + 0.85 : 1;

      // Radial glow on wall
      const torchGrad = ctx.createRadialGradient(torchX, torchY, 0, torchX, torchY, torchRadius);
      torchGrad.addColorStop(0, `rgba(255, 170, 68, ${0.25 * flicker * shadeFactor})`);
      torchGrad.addColorStop(0.5, `rgba(255, 100, 30, ${0.1 * flicker * shadeFactor})`);
      torchGrad.addColorStop(1, `rgba(255, 50, 0, 0)`);
      ctx.fillStyle = torchGrad;
      ctx.fillRect(x, wallTop, segmentWidth, wallHeight);

      // Torch bracket
      ctx.fillStyle = `rgb(60, 50, 40)`;
      ctx.fillRect(torchX - 2, torchY - 5, 4, 15);

      // Flame
      if (enableAnimations) {
        const flameHeight = 8 + Math.sin(time * 12 + colIdx * 2) * 3;
        const flameGrad = ctx.createLinearGradient(torchX, torchY - flameHeight, torchX, torchY);
        flameGrad.addColorStop(0, `rgba(255, 255, 100, ${flicker})`);
        flameGrad.addColorStop(0.3, `rgba(255, 150, 50, ${flicker})`);
        flameGrad.addColorStop(1, `rgba(255, 50, 0, 0)`);
        ctx.fillStyle = flameGrad;
        ctx.beginPath();
        ctx.moveTo(torchX - 4, torchY);
        ctx.quadraticCurveTo(torchX - 2, torchY - flameHeight * 0.7, torchX, torchY - flameHeight);
        ctx.quadraticCurveTo(torchX + 2, torchY - flameHeight * 0.7, torchX + 4, torchY);
        ctx.fill();
      }
    }

    // Distance fog overlay
    if (fogFactor > 0) {
      ctx.fillStyle = `rgba(10, 10, 20, ${fogFactor})`;
      ctx.fillRect(x, wallTop, segmentWidth + 1, wallHeight);
    }
  }, [isDoor, isStairsUp, isStairsDown, enableAnimations, seededRandom]);

  // Calculate perspective projection for a point at given depth
  const getProjection = useCallback((
    canvasWidth: number,
    canvasHeight: number,
    depth: number,
    xOffset: number = 0  // -1 to 1, where 0 is center
  ) => {
    // Perspective projection
    const fov = 0.8; // Field of view factor
    const horizon = canvasHeight / 2;
    const scale = 1 / (depth * fov + 0.5);

    const wallHeight = canvasHeight * 0.7 * scale;
    const wallTop = horizon - wallHeight / 2;
    const wallBottom = horizon + wallHeight / 2;

    // X position based on offset and depth
    const centerX = canvasWidth / 2;
    const spread = canvasWidth * 0.5 * scale;
    const x = centerX + xOffset * spread;

    return { wallTop, wallBottom, x, scale, horizon };
  }, []);

  // Draw a corridor segment (side wall connecting two depths)
  const drawCorridorWall = useCallback((
    ctx: CanvasRenderingContext2D,
    side: 'left' | 'right',
    nearDepth: number,
    farDepth: number,
    canvasWidth: number,
    canvasHeight: number,
    _time: number
  ) => {
    const xOffset = side === 'left' ? -1 : 1;

    const near = getProjection(canvasWidth, canvasHeight, nearDepth, xOffset);
    const far = getProjection(canvasWidth, canvasHeight, farDepth, xOffset);

    // Side wall is darker on left, lighter on right
    const baseBrightness = side === 'left' ? 50 : 70;
    const avgDepth = (nearDepth + farDepth) / 2;
    const depthFade = Math.max(0.3, 1 - avgDepth * 0.1);
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

    // Fog overlay
    const fogAmount = Math.min(0.6, avgDepth * 0.08);
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
  }, [getProjection, seededRandom]);

  // Draw floor segment between two depths
  const drawFloorSegment = useCallback((
    ctx: CanvasRenderingContext2D,
    nearDepth: number,
    farDepth: number,
    leftOffset: number,
    rightOffset: number,
    canvasWidth: number,
    canvasHeight: number,
    isFloor: boolean = true
  ) => {
    const nearLeft = getProjection(canvasWidth, canvasHeight, nearDepth, leftOffset);
    const nearRight = getProjection(canvasWidth, canvasHeight, nearDepth, rightOffset);
    const farLeft = getProjection(canvasWidth, canvasHeight, farDepth, leftOffset);
    const farRight = getProjection(canvasWidth, canvasHeight, farDepth, rightOffset);

    const avgDepth = (nearDepth + farDepth) / 2;
    const depthFade = Math.max(0.3, 1 - avgDepth * 0.1);

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
    const fogAmount = Math.min(0.5, avgDepth * 0.07);
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
  }, [getProjection]);

  // Draw front-facing wall at a specific depth
  const drawFrontWall = useCallback((
    ctx: CanvasRenderingContext2D,
    depth: number,
    leftOffset: number,
    rightOffset: number,
    canvasWidth: number,
    canvasHeight: number,
    tile: string,
    time: number
  ) => {
    const left = getProjection(canvasWidth, canvasHeight, depth, leftOffset);
    const right = getProjection(canvasWidth, canvasHeight, depth, rightOffset);

    const depthFade = Math.max(0.3, 1 - depth * 0.1);
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
      const doorWidth = wallWidth * 0.6;
      const doorHeight = wallHeight * 0.85;
      const doorX = left.x + (wallWidth - doorWidth) / 2;
      const doorY = left.wallBottom - doorHeight;

      ctx.fillStyle = `rgb(${80 * depthFade}, ${50 * depthFade}, ${30 * depthFade})`;
      ctx.fillRect(doorX, doorY, doorWidth, doorHeight);

      // Door frame
      ctx.strokeStyle = `rgb(${50 * depthFade}, ${30 * depthFade}, ${20 * depthFade})`;
      ctx.lineWidth = 3;
      ctx.strokeRect(doorX, doorY, doorWidth, doorHeight);

      // Door handle
      ctx.fillStyle = '#ffd700';
      ctx.beginPath();
      ctx.arc(doorX + doorWidth * 0.8, doorY + doorHeight * 0.5, 4, 0, Math.PI * 2);
      ctx.fill();
    }

    // Torch on walls (closer only)
    if (depth <= 4 && tile === '#' && wallWidth > 40) {
      const torchX = (left.x + right.x) / 2;
      const torchY = left.wallTop + wallHeight * 0.3;

      // Torch glow
      const flicker = enableAnimations ? Math.sin(time * 8) * 0.15 + 0.85 : 1;
      const glowGrad = ctx.createRadialGradient(torchX, torchY, 0, torchX, torchY, wallHeight * 0.4);
      glowGrad.addColorStop(0, `rgba(255, 150, 50, ${0.3 * flicker * depthFade})`);
      glowGrad.addColorStop(1, 'rgba(255, 100, 30, 0)');
      ctx.fillStyle = glowGrad;
      ctx.fillRect(left.x, left.wallTop, wallWidth, wallHeight);

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

    // Fog overlay
    const fogAmount = Math.min(0.6, depth * 0.08);
    if (fogAmount > 0) {
      ctx.fillStyle = `rgba(10, 10, 20, ${fogAmount})`;
      ctx.fillRect(left.x, left.wallTop, wallWidth, wallHeight);
    }
  }, [getProjection, seededRandom, enableAnimations]);

  // Draw floor and ceiling with perspective depth
  const drawFloorAndCeiling = useCallback((
    ctx: CanvasRenderingContext2D,
    canvasWidth: number,
    canvasHeight: number,
    time: number
  ) => {
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
  }, [enableAnimations]);

  // Get enemy color scheme based on symbol/name
  const getEnemyColors = useCallback((symbol: string, name: string, isElite: boolean) => {
    const lowerName = name.toLowerCase();
    const lowerSymbol = symbol.toLowerCase();

    // Base colors for different enemy types
    if (lowerSymbol === 'g' || lowerName.includes('goblin')) {
      return { primary: '#4a7c4e', secondary: '#2d4d2f', accent: '#8bc34a', eye: '#ffeb3b' };
    } else if (lowerSymbol === 'o' || lowerName.includes('orc')) {
      return { primary: '#5d8a5d', secondary: '#3d5a3d', accent: '#7cb342', eye: '#ff5722' };
    } else if (lowerSymbol === 's' || lowerName.includes('skeleton')) {
      return { primary: '#e0e0e0', secondary: '#9e9e9e', accent: '#ffffff', eye: '#ff1744' };
    } else if (lowerSymbol === 'r' || lowerName.includes('rat')) {
      return { primary: '#8d6e63', secondary: '#5d4037', accent: '#a1887f', eye: '#ff5252' };
    } else if (lowerSymbol === 'b' || lowerName.includes('bat')) {
      return { primary: '#37474f', secondary: '#263238', accent: '#546e7a', eye: '#ff1744' };
    } else if (lowerSymbol === 'd' || lowerName.includes('demon')) {
      return { primary: '#b71c1c', secondary: '#7f0000', accent: '#ff5252', eye: '#ffeb3b' };
    } else if (lowerSymbol === 'z' || lowerName.includes('zombie')) {
      return { primary: '#558b2f', secondary: '#33691e', accent: '#8bc34a', eye: '#fff176' };
    } else if (lowerSymbol === 't' || lowerName.includes('troll')) {
      return { primary: '#6d4c41', secondary: '#4e342e', accent: '#8d6e63', eye: '#ffc107' };
    } else if (lowerName.includes('boss') || lowerName.includes('dragon')) {
      return { primary: '#4a148c', secondary: '#311b92', accent: '#7c4dff', eye: '#ff1744' };
    }

    // Default/elite colors
    if (isElite) {
      return { primary: '#ff8f00', secondary: '#ff6f00', accent: '#ffc107', eye: '#ffffff' };
    }
    return { primary: '#c62828', secondary: '#8e0000', accent: '#ff5252', eye: '#ffeb3b' };
  }, []);

  // Get item color and shape based on symbol
  const getItemStyle = useCallback((symbol: string, name: string) => {
    const lowerName = name.toLowerCase();

    if (symbol === '!' || lowerName.includes('potion')) {
      if (lowerName.includes('health')) {
        return { color: '#ff5252', glowColor: 'rgba(255, 82, 82, 0.5)', shape: 'potion' };
      } else if (lowerName.includes('mana')) {
        return { color: '#448aff', glowColor: 'rgba(68, 138, 255, 0.5)', shape: 'potion' };
      } else if (lowerName.includes('strength')) {
        return { color: '#ff9800', glowColor: 'rgba(255, 152, 0, 0.5)', shape: 'potion' };
      }
      return { color: '#e040fb', glowColor: 'rgba(224, 64, 251, 0.5)', shape: 'potion' };
    } else if (symbol === '?' || lowerName.includes('scroll')) {
      return { color: '#fff9c4', glowColor: 'rgba(255, 249, 196, 0.5)', shape: 'scroll' };
    } else if (symbol === '/' || symbol === '|' || lowerName.includes('sword') || lowerName.includes('weapon')) {
      return { color: '#b0bec5', glowColor: 'rgba(176, 190, 197, 0.5)', shape: 'weapon' };
    } else if (symbol === ']' || symbol === '[' || lowerName.includes('armor') || lowerName.includes('shield')) {
      return { color: '#78909c', glowColor: 'rgba(120, 144, 156, 0.5)', shape: 'armor' };
    } else if (symbol === '=' || lowerName.includes('ring') || lowerName.includes('amulet')) {
      return { color: '#ffd700', glowColor: 'rgba(255, 215, 0, 0.5)', shape: 'ring' };
    } else if (symbol === '%' || lowerName.includes('food') || lowerName.includes('ration')) {
      return { color: '#8d6e63', glowColor: 'rgba(141, 110, 99, 0.5)', shape: 'food' };
    } else if (symbol === '$' || lowerName.includes('gold') || lowerName.includes('coin')) {
      return { color: '#ffd700', glowColor: 'rgba(255, 215, 0, 0.6)', shape: 'gold' };
    } else if (symbol === '*' || lowerName.includes('key')) {
      return { color: '#ffab00', glowColor: 'rgba(255, 171, 0, 0.5)', shape: 'key' };
    }

    // Default
    return { color: '#f1fa8c', glowColor: 'rgba(241, 250, 140, 0.5)', shape: 'default' };
  }, []);

  // Draw an entity (enemy or item)
  const drawEntity = useCallback((
    ctx: CanvasRenderingContext2D,
    entity: FirstPersonEntity,
    canvasWidth: number,
    canvasHeight: number,
    time: number
  ) => {
    const { distance, offset, type, name, symbol, health, max_health, is_elite } = entity;

    // Use projection system for proper floor placement
    const projection = getProjection(canvasWidth, canvasHeight, distance, offset * 0.3);

    // Entity sits on the floor
    const baseY = projection.wallBottom;
    const scale = projection.scale * 1.5;
    const entityHeight = canvasHeight * 0.35 * scale;
    const entityWidth = entityHeight * 0.5;
    const centerX = projection.x;

    // Distance-based opacity for fog effect
    const fogAlpha = Math.min(0.6, distance * 0.08);

    // Animation values
    let bobY = 0;
    let breathe = 1;
    let sway = 0;
    if (enableAnimations) {
      bobY = Math.sin(time * 2.5 + distance + offset) * 4 * scale;
      breathe = 1 + Math.sin(time * 3 + offset) * 0.05;
      sway = Math.sin(time * 1.5 + offset * 2) * 2 * scale;
    }

    const y = baseY - entityHeight + bobY;

    // Draw entity based on type
    if (type === 'enemy') {
      const colors = getEnemyColors(symbol, name, is_elite || false);

      // Ground shadow
      ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
      ctx.beginPath();
      ctx.ellipse(centerX, baseY + 5, entityWidth * 0.6, entityHeight * 0.1, 0, 0, Math.PI * 2);
      ctx.fill();

      // Elite aura/glow
      if (is_elite) {
        const auraSize = entityHeight * 0.8;
        const auraPulse = enableAnimations ? Math.sin(time * 4) * 0.2 + 0.6 : 0.6;
        const auraGrad = ctx.createRadialGradient(centerX, y + entityHeight * 0.5, 0, centerX, y + entityHeight * 0.5, auraSize);
        auraGrad.addColorStop(0, `rgba(255, 215, 0, ${auraPulse * 0.3})`);
        auraGrad.addColorStop(0.5, `rgba(255, 140, 0, ${auraPulse * 0.15})`);
        auraGrad.addColorStop(1, 'rgba(255, 100, 0, 0)');
        ctx.fillStyle = auraGrad;
        ctx.beginPath();
        ctx.arc(centerX, y + entityHeight * 0.5, auraSize, 0, Math.PI * 2);
        ctx.fill();
      }

      // Body - darker base layer for depth
      ctx.fillStyle = colors.secondary;
      ctx.beginPath();
      ctx.ellipse(centerX + 2, y + entityHeight * 0.62, entityWidth * 0.42 * breathe, entityHeight * 0.38, 0, 0, Math.PI * 2);
      ctx.fill();

      // Body - main shape
      const bodyGrad = ctx.createRadialGradient(
        centerX - entityWidth * 0.15, y + entityHeight * 0.5,
        0,
        centerX, y + entityHeight * 0.6,
        entityWidth * 0.5
      );
      bodyGrad.addColorStop(0, colors.accent);
      bodyGrad.addColorStop(0.5, colors.primary);
      bodyGrad.addColorStop(1, colors.secondary);
      ctx.fillStyle = bodyGrad;
      ctx.beginPath();
      ctx.ellipse(centerX + sway * 0.3, y + entityHeight * 0.6, entityWidth * 0.4 * breathe, entityHeight * 0.36, 0, 0, Math.PI * 2);
      ctx.fill();

      // Arms/appendages
      ctx.fillStyle = colors.primary;
      // Left arm
      ctx.beginPath();
      ctx.ellipse(centerX - entityWidth * 0.45, y + entityHeight * 0.55, entityWidth * 0.12, entityHeight * 0.2, -0.3 + sway * 0.05, 0, Math.PI * 2);
      ctx.fill();
      // Right arm
      ctx.beginPath();
      ctx.ellipse(centerX + entityWidth * 0.45, y + entityHeight * 0.55, entityWidth * 0.12, entityHeight * 0.2, 0.3 - sway * 0.05, 0, Math.PI * 2);
      ctx.fill();

      // Head - shadow
      ctx.fillStyle = colors.secondary;
      ctx.beginPath();
      ctx.arc(centerX + 2 + sway * 0.5, y + entityHeight * 0.27, entityWidth * 0.32, 0, Math.PI * 2);
      ctx.fill();

      // Head - main
      const headGrad = ctx.createRadialGradient(
        centerX - entityWidth * 0.1, y + entityHeight * 0.2,
        0,
        centerX + sway * 0.5, y + entityHeight * 0.25,
        entityWidth * 0.35
      );
      headGrad.addColorStop(0, colors.accent);
      headGrad.addColorStop(0.6, colors.primary);
      headGrad.addColorStop(1, colors.secondary);
      ctx.fillStyle = headGrad;
      ctx.beginPath();
      ctx.arc(centerX + sway * 0.5, y + entityHeight * 0.25, entityWidth * 0.3, 0, Math.PI * 2);
      ctx.fill();

      // Eyes - glowing effect
      const eyeGlow = enableAnimations ? Math.sin(time * 5 + offset) * 0.3 + 0.7 : 1;
      const eyeY = y + entityHeight * 0.23;
      const eyeSpacing = entityWidth * 0.15;
      const eyeSize = entityWidth * 0.1;

      // Eye glow
      const eyeGlowGrad = ctx.createRadialGradient(centerX, eyeY, 0, centerX, eyeY, eyeSize * 3);
      eyeGlowGrad.addColorStop(0, `rgba(255, 100, 100, ${0.3 * eyeGlow})`);
      eyeGlowGrad.addColorStop(1, 'rgba(255, 100, 100, 0)');
      ctx.fillStyle = eyeGlowGrad;
      ctx.fillRect(centerX - eyeSize * 3, eyeY - eyeSize * 2, eyeSize * 6, eyeSize * 4);

      // Left eye
      ctx.fillStyle = colors.eye;
      ctx.shadowColor = colors.eye;
      ctx.shadowBlur = 8 * scale * eyeGlow;
      ctx.beginPath();
      ctx.ellipse(centerX - eyeSpacing + sway * 0.3, eyeY, eyeSize, eyeSize * 0.7, 0, 0, Math.PI * 2);
      ctx.fill();

      // Right eye
      ctx.beginPath();
      ctx.ellipse(centerX + eyeSpacing + sway * 0.3, eyeY, eyeSize, eyeSize * 0.7, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      // Pupils (tracking player)
      ctx.fillStyle = '#000';
      const pupilOffset = Math.sin(time * 0.5) * eyeSize * 0.2;
      ctx.beginPath();
      ctx.arc(centerX - eyeSpacing + pupilOffset + sway * 0.3, eyeY, eyeSize * 0.4, 0, Math.PI * 2);
      ctx.arc(centerX + eyeSpacing + pupilOffset + sway * 0.3, eyeY, eyeSize * 0.4, 0, Math.PI * 2);
      ctx.fill();

      // Elite crown
      if (is_elite) {
        const crownY = y + entityHeight * 0.02;
        const crownWidth = entityWidth * 0.4;
        const crownHeight = entityHeight * 0.12;

        // Crown glow
        ctx.shadowColor = '#ffd700';
        ctx.shadowBlur = 10 * scale;

        // Crown base
        ctx.fillStyle = '#ffd700';
        ctx.beginPath();
        ctx.moveTo(centerX - crownWidth, crownY + crownHeight);
        ctx.lineTo(centerX - crownWidth * 0.8, crownY);
        ctx.lineTo(centerX - crownWidth * 0.4, crownY + crownHeight * 0.5);
        ctx.lineTo(centerX, crownY - crownHeight * 0.3);
        ctx.lineTo(centerX + crownWidth * 0.4, crownY + crownHeight * 0.5);
        ctx.lineTo(centerX + crownWidth * 0.8, crownY);
        ctx.lineTo(centerX + crownWidth, crownY + crownHeight);
        ctx.closePath();
        ctx.fill();

        // Crown gems
        ctx.fillStyle = '#ff1744';
        ctx.beginPath();
        ctx.arc(centerX, crownY + crownHeight * 0.3, crownHeight * 0.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      // Mouth/teeth for close enemies
      if (distance <= 3) {
        const mouthY = y + entityHeight * 0.32;
        ctx.fillStyle = '#1a1a1a';
        ctx.beginPath();
        ctx.ellipse(centerX + sway * 0.3, mouthY, entityWidth * 0.15, entityHeight * 0.04, 0, 0, Math.PI);
        ctx.fill();

        // Teeth
        ctx.fillStyle = '#fff';
        const teethCount = 4;
        const teethWidth = entityWidth * 0.06;
        for (let i = 0; i < teethCount; i++) {
          const tx = centerX - entityWidth * 0.1 + i * teethWidth + sway * 0.3;
          ctx.beginPath();
          ctx.moveTo(tx, mouthY - entityHeight * 0.015);
          ctx.lineTo(tx + teethWidth * 0.5, mouthY + entityHeight * 0.025);
          ctx.lineTo(tx + teethWidth, mouthY - entityHeight * 0.015);
          ctx.fill();
        }
      }

      // Health bar (only if close enough)
      if (distance <= 5 && health !== undefined && max_health !== undefined) {
        const barWidth = entityWidth * 1.2;
        const barHeight = 8 * scale;
        const barX = centerX - barWidth / 2;
        const barY = y - barHeight - 10 * scale;

        // Bar background with border
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(barX - 2, barY - 2, barWidth + 4, barHeight + 4);

        // Health fill with gradient
        const healthPercent = health / max_health;
        const healthColor = healthPercent > 0.5 ? '#50fa7b' : healthPercent > 0.25 ? '#ffb86c' : '#ff5555';
        const healthGrad = ctx.createLinearGradient(barX, barY, barX, barY + barHeight);
        healthGrad.addColorStop(0, healthColor);
        healthGrad.addColorStop(1, colors.secondary);
        ctx.fillStyle = healthGrad;
        ctx.fillRect(barX, barY, barWidth * healthPercent, barHeight);

        // Health bar shine
        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.fillRect(barX, barY, barWidth * healthPercent, barHeight * 0.4);

        // Border
        ctx.strokeStyle = healthColor;
        ctx.lineWidth = 1;
        ctx.strokeRect(barX, barY, barWidth, barHeight);
      }

      // Name label (close enemies)
      if (distance <= 3) {
        const labelY = y - 25 * scale;
        ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
        ctx.fillRect(centerX - entityWidth * 0.8, labelY - 10, entityWidth * 1.6, 16);

        ctx.fillStyle = is_elite ? '#ffd700' : '#fff';
        ctx.font = `bold ${Math.floor(11 * scale)}px monospace`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(is_elite ? `★ ${name}` : name, centerX, labelY - 2);
      }

      // Distance fog overlay
      if (fogAlpha > 0) {
        ctx.fillStyle = `rgba(10, 10, 20, ${fogAlpha * 0.5})`;
        ctx.beginPath();
        ctx.ellipse(centerX, y + entityHeight * 0.5, entityWidth * 0.6, entityHeight * 0.5, 0, 0, Math.PI * 2);
        ctx.fill();
      }

    } else if (type === 'item') {
      const itemStyle = getItemStyle(symbol, name);
      const itemY = y + entityHeight * 0.5;

      // Floating animation
      const floatY = enableAnimations ? Math.sin(time * 3 + offset * 2) * 5 * scale : 0;

      // Ground shadow
      const shadowScale = 1 - floatY / (20 * scale);
      ctx.fillStyle = `rgba(0, 0, 0, ${0.3 * shadowScale})`;
      ctx.beginPath();
      ctx.ellipse(centerX, baseY + 5, entityWidth * 0.4 * shadowScale, entityHeight * 0.08, 0, 0, Math.PI * 2);
      ctx.fill();

      // Item glow
      const glowPulse = enableAnimations ? Math.sin(time * 4 + offset) * 0.3 + 0.7 : 0.7;
      const glowGrad = ctx.createRadialGradient(centerX, itemY - floatY, 0, centerX, itemY - floatY, entityWidth * 0.8);
      glowGrad.addColorStop(0, itemStyle.glowColor.replace('0.5', String(0.4 * glowPulse)));
      glowGrad.addColorStop(0.5, itemStyle.glowColor.replace('0.5', String(0.15 * glowPulse)));
      glowGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = glowGrad;
      ctx.beginPath();
      ctx.arc(centerX, itemY - floatY, entityWidth * 0.8, 0, Math.PI * 2);
      ctx.fill();

      // Draw item based on shape
      if (itemStyle.shape === 'potion') {
        // Potion bottle
        const bottleWidth = entityWidth * 0.35;
        const bottleHeight = entityHeight * 0.4;
        const bottleY = itemY - floatY;

        // Bottle body
        ctx.fillStyle = itemStyle.color;
        ctx.beginPath();
        ctx.moveTo(centerX - bottleWidth * 0.3, bottleY - bottleHeight * 0.2);
        ctx.quadraticCurveTo(centerX - bottleWidth * 0.5, bottleY, centerX - bottleWidth * 0.4, bottleY + bottleHeight * 0.4);
        ctx.quadraticCurveTo(centerX, bottleY + bottleHeight * 0.5, centerX + bottleWidth * 0.4, bottleY + bottleHeight * 0.4);
        ctx.quadraticCurveTo(centerX + bottleWidth * 0.5, bottleY, centerX + bottleWidth * 0.3, bottleY - bottleHeight * 0.2);
        ctx.closePath();
        ctx.fill();

        // Bottle neck
        ctx.fillStyle = '#666';
        ctx.fillRect(centerX - bottleWidth * 0.15, bottleY - bottleHeight * 0.4, bottleWidth * 0.3, bottleHeight * 0.25);

        // Cork
        ctx.fillStyle = '#8d6e63';
        ctx.fillRect(centerX - bottleWidth * 0.12, bottleY - bottleHeight * 0.5, bottleWidth * 0.24, bottleHeight * 0.12);

        // Liquid shine
        ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.beginPath();
        ctx.ellipse(centerX - bottleWidth * 0.15, bottleY + bottleHeight * 0.1, bottleWidth * 0.1, bottleHeight * 0.15, -0.3, 0, Math.PI * 2);
        ctx.fill();

        // Bubbles (animated)
        if (enableAnimations) {
          ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
          for (let i = 0; i < 3; i++) {
            const bubbleY = bottleY + bottleHeight * 0.2 - ((time * 30 + i * 20) % 40) * scale * 0.5;
            const bubbleX = centerX + Math.sin(time * 2 + i) * bottleWidth * 0.2;
            ctx.beginPath();
            ctx.arc(bubbleX, bubbleY, 2 * scale, 0, Math.PI * 2);
            ctx.fill();
          }
        }

      } else if (itemStyle.shape === 'scroll') {
        // Scroll
        const scrollWidth = entityWidth * 0.5;
        const scrollHeight = entityHeight * 0.35;
        const scrollY = itemY - floatY;

        // Scroll body
        ctx.fillStyle = itemStyle.color;
        ctx.fillRect(centerX - scrollWidth * 0.4, scrollY - scrollHeight * 0.3, scrollWidth * 0.8, scrollHeight * 0.6);

        // Scroll ends
        ctx.fillStyle = '#d4a574';
        ctx.beginPath();
        ctx.ellipse(centerX - scrollWidth * 0.4, scrollY, scrollWidth * 0.1, scrollHeight * 0.35, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(centerX + scrollWidth * 0.4, scrollY, scrollWidth * 0.1, scrollHeight * 0.35, 0, 0, Math.PI * 2);
        ctx.fill();

        // Magic runes (animated glow)
        if (enableAnimations) {
          const runeGlow = Math.sin(time * 3) * 0.3 + 0.7;
          ctx.fillStyle = `rgba(100, 200, 255, ${runeGlow})`;
          ctx.font = `${Math.floor(8 * scale)}px serif`;
          ctx.textAlign = 'center';
          ctx.fillText('✧ ⚝ ✧', centerX, scrollY);
        }

      } else if (itemStyle.shape === 'weapon') {
        // Sword
        const swordLength = entityHeight * 0.5;
        const swordY = itemY - floatY;

        // Blade
        ctx.fillStyle = '#b0bec5';
        ctx.beginPath();
        ctx.moveTo(centerX, swordY - swordLength * 0.5);
        ctx.lineTo(centerX - entityWidth * 0.08, swordY + swordLength * 0.2);
        ctx.lineTo(centerX + entityWidth * 0.08, swordY + swordLength * 0.2);
        ctx.closePath();
        ctx.fill();

        // Blade shine
        ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.beginPath();
        ctx.moveTo(centerX, swordY - swordLength * 0.45);
        ctx.lineTo(centerX - entityWidth * 0.02, swordY + swordLength * 0.15);
        ctx.lineTo(centerX + entityWidth * 0.02, swordY + swordLength * 0.15);
        ctx.closePath();
        ctx.fill();

        // Guard
        ctx.fillStyle = '#ffd700';
        ctx.fillRect(centerX - entityWidth * 0.2, swordY + swordLength * 0.15, entityWidth * 0.4, swordLength * 0.08);

        // Handle
        ctx.fillStyle = '#5d4037';
        ctx.fillRect(centerX - entityWidth * 0.06, swordY + swordLength * 0.2, entityWidth * 0.12, swordLength * 0.25);

        // Pommel
        ctx.fillStyle = '#ffd700';
        ctx.beginPath();
        ctx.arc(centerX, swordY + swordLength * 0.48, entityWidth * 0.08, 0, Math.PI * 2);
        ctx.fill();

      } else if (itemStyle.shape === 'gold') {
        // Gold coins
        const coinSize = entityWidth * 0.25;
        const coinY = itemY - floatY;

        // Stack of coins
        for (let i = 0; i < 3; i++) {
          const cx = centerX + (i - 1) * coinSize * 0.6;
          const cy = coinY + (2 - i) * coinSize * 0.3;

          // Coin shadow
          ctx.fillStyle = '#b8860b';
          ctx.beginPath();
          ctx.ellipse(cx, cy + 2, coinSize, coinSize * 0.4, 0, 0, Math.PI * 2);
          ctx.fill();

          // Coin face
          ctx.fillStyle = '#ffd700';
          ctx.beginPath();
          ctx.ellipse(cx, cy, coinSize, coinSize * 0.4, 0, 0, Math.PI * 2);
          ctx.fill();

          // Coin shine
          ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
          ctx.beginPath();
          ctx.ellipse(cx - coinSize * 0.2, cy - coinSize * 0.1, coinSize * 0.3, coinSize * 0.15, -0.3, 0, Math.PI * 2);
          ctx.fill();
        }

        // Sparkles
        if (enableAnimations) {
          const sparkleTime = time * 5;
          ctx.fillStyle = '#fff';
          for (let i = 0; i < 4; i++) {
            const sparklePhase = (sparkleTime + i * 1.5) % 6;
            if (sparklePhase < 1) {
              const sx = centerX + Math.cos(i * 1.5) * coinSize * 1.5;
              const sy = coinY + Math.sin(i * 1.5) * coinSize;
              const sparkleSize = (1 - sparklePhase) * 3 * scale;
              ctx.beginPath();
              ctx.arc(sx, sy, sparkleSize, 0, Math.PI * 2);
              ctx.fill();
            }
          }
        }

      } else {
        // Default item (glowing orb)
        const orbY = itemY - floatY;
        const orbSize = entityWidth * 0.35;

        // Outer glow
        ctx.fillStyle = itemStyle.color;
        ctx.shadowColor = itemStyle.color;
        ctx.shadowBlur = 15 * scale * glowPulse;
        ctx.beginPath();
        ctx.arc(centerX, orbY, orbSize, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;

        // Inner shine
        ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
        ctx.beginPath();
        ctx.arc(centerX - orbSize * 0.3, orbY - orbSize * 0.3, orbSize * 0.3, 0, Math.PI * 2);
        ctx.fill();

        // Symbol
        ctx.fillStyle = '#000';
        ctx.font = `bold ${Math.floor(14 * scale)}px monospace`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(symbol, centerX, orbY);
      }

      // Sparkle particles
      if (enableAnimations) {
        const particleCount = 5;
        for (let i = 0; i < particleCount; i++) {
          const angle = (time * 0.5 + i * (Math.PI * 2 / particleCount)) % (Math.PI * 2);
          const radius = entityWidth * 0.5 + Math.sin(time * 3 + i) * entityWidth * 0.2;
          const px = centerX + Math.cos(angle) * radius;
          const py = itemY - floatY + Math.sin(angle) * radius * 0.5;
          const particleAlpha = Math.sin(time * 4 + i * 2) * 0.3 + 0.4;

          ctx.fillStyle = `rgba(255, 255, 255, ${particleAlpha})`;
          ctx.beginPath();
          ctx.arc(px, py, 2 * scale, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // Item name on hover/close
      if (distance <= 2) {
        const labelY = itemY - floatY - entityHeight * 0.4;
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        const textWidth = ctx.measureText(name).width + 10;
        ctx.fillRect(centerX - textWidth / 2, labelY - 8, textWidth, 16);

        ctx.fillStyle = itemStyle.color;
        ctx.font = `${Math.floor(10 * scale)}px monospace`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(name, centerX, labelY);
      }

      // Distance fog
      if (fogAlpha > 0) {
        ctx.fillStyle = `rgba(10, 10, 20, ${fogAlpha * 0.4})`;
        ctx.beginPath();
        ctx.arc(centerX, itemY - floatY, entityWidth * 0.5, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }, [enableAnimations, getEnemyColors, getItemStyle, getProjection]);

  // Main render function
  const render = useCallback((time: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    timeRef.current = time / 1000; // Convert to seconds

    // Clear canvas
    ctx.fillStyle = Colors.darkness;
    ctx.fillRect(0, 0, width, height);

    // Draw floor and ceiling with perspective
    drawFloorAndCeiling(ctx, width, height, timeRef.current);

    if (!view || !view.rows || view.rows.length === 0) {
      // No view data - draw fog
      ctx.fillStyle = Colors.fog;
      ctx.fillRect(0, 0, width, height);

      // "No signal" text
      ctx.fillStyle = '#8be9fd';
      ctx.font = '16px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('Waiting for game data...', width / 2, height / 2);
      return;
    }

    // Analyze the view to find corridor boundaries
    const rows = view.rows;
    const maxDepth = rows.length;

    // Find the corridor width at each depth (where walls are on each side)
    const corridorInfo: { leftWall: boolean; rightWall: boolean; hasFloor: boolean; frontWall: string | null }[] = [];

    for (let d = 0; d < maxDepth; d++) {
      const row = rows[d];
      if (!row || row.length === 0) {
        corridorInfo.push({ leftWall: true, rightWall: true, hasFloor: false, frontWall: '#' });
        continue;
      }

      const centerIdx = Math.floor(row.length / 2);
      const centerTile = row[centerIdx];

      // Check if center is blocked (front wall)
      const centerIsWall = isWall(centerTile?.tile || '#') || isDoor(centerTile?.tile || '');
      const frontWall = centerIsWall ? (centerTile?.tile || '#') : null;

      // Check for walls on left and right of the walkable path
      let leftWall = true;
      let rightWall = true;

      // Find edges of walkable area
      for (let i = 0; i < row.length; i++) {
        if (!isWall(row[i].tile) && !isDoor(row[i].tile)) {
          if (i === 0) leftWall = false;
          if (i === row.length - 1) rightWall = false;
        }
      }

      corridorInfo.push({
        leftWall,
        rightWall,
        hasFloor: !centerIsWall,
        frontWall
      });
    }

    // Draw from back to front (painter's algorithm)
    for (let d = maxDepth - 1; d >= 0; d--) {
      const depth = d + 1;
      const nextDepth = d + 2;
      const info = corridorInfo[d];

      // Draw ceiling segment
      drawFloorSegment(ctx, depth, nextDepth, -1, 1, width, height, false);

      // Draw floor segment
      drawFloorSegment(ctx, depth, nextDepth, -1, 1, width, height, true);

      // Draw left corridor wall if there's a wall on the left
      if (info.leftWall) {
        drawCorridorWall(ctx, 'left', depth, nextDepth, width, height, timeRef.current);
      }

      // Draw right corridor wall if there's a wall on the right
      if (info.rightWall) {
        drawCorridorWall(ctx, 'right', depth, nextDepth, width, height, timeRef.current);
      }

      // Draw front wall if this depth is blocked
      if (info.frontWall) {
        drawFrontWall(ctx, depth, -1, 1, width, height, info.frontWall, timeRef.current);
      }
    }

    // Draw the immediate area (depth 0 to 1)
    drawFloorSegment(ctx, 0.3, 1, -1, 1, width, height, false); // ceiling
    drawFloorSegment(ctx, 0.3, 1, -1, 1, width, height, true);  // floor
    if (corridorInfo[0]?.leftWall) {
      drawCorridorWall(ctx, 'left', 0.3, 1, width, height, timeRef.current);
    }
    if (corridorInfo[0]?.rightWall) {
      drawCorridorWall(ctx, 'right', 0.3, 1, width, height, timeRef.current);
    }

    // Draw entities (sorted by distance, far to near)
    if (view.entities && view.entities.length > 0) {
      // Clone entities so we can modify offsets
      const sortedEntities = [...view.entities]
        .map(e => ({ ...e }))
        .sort((a, b) => b.distance - a.distance);

      // Group entities by distance to distribute them horizontally
      const entitiesByDistance = new Map<number, FirstPersonEntity[]>();
      for (const entity of sortedEntities) {
        const dist = entity.distance;
        if (!entitiesByDistance.has(dist)) {
          entitiesByDistance.set(dist, []);
        }
        entitiesByDistance.get(dist)!.push(entity);
      }

      // Redistribute entities at same distance to avoid overlap
      for (const [distance, entities] of entitiesByDistance) {
        if (entities.length > 1) {
          // Calculate available width at this distance (narrower as you get closer)
          const availableSlots = Math.max(3, Math.floor(7 - distance * 0.5));
          const slotWidth = availableSlots > 1 ? 4 / (availableSlots - 1) : 0;

          // Distribute entities evenly across available slots
          for (let i = 0; i < entities.length; i++) {
            const slot = i % availableSlots;
            const centerSlot = (availableSlots - 1) / 2;
            entities[i].offset = (slot - centerSlot) * slotWidth * 0.8;
          }
        }
      }

      // Draw all entities
      for (const entity of sortedEntities) {
        drawEntity(ctx, entity, width, height, timeRef.current);
      }
    }

    // Draw direction indicator
    const facing = view.facing;
    if (facing) {
      ctx.fillStyle = '#8be9fd';
      ctx.font = '12px monospace';
      ctx.textAlign = 'right';
      let dirText = 'Facing: ';
      if (facing.dy < 0) dirText += 'North';
      else if (facing.dy > 0) dirText += 'South';
      else if (facing.dx < 0) dirText += 'West';
      else if (facing.dx > 0) dirText += 'East';
      ctx.fillText(dirText, width - 10, 20);
    }

    // Continue animation loop
    if (enableAnimations) {
      animationRef.current = requestAnimationFrame(render);
    }
  }, [view, width, height, enableAnimations, drawFloorAndCeiling, drawFloorSegment, drawCorridorWall, drawFrontWall, drawEntity, isWall, isDoor]);

  // Start/stop animation loop
  useEffect(() => {
    if (enableAnimations) {
      animationRef.current = requestAnimationFrame(render);
    } else {
      render(0);
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [enableAnimations, render]);

  // Re-render when view changes (without animations)
  useEffect(() => {
    if (!enableAnimations) {
      render(0);
    }
  }, [view, enableAnimations, render]);

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      style={{
        display: 'block',
        background: Colors.darkness,
      }}
    />
  );
}

export default FirstPersonRenderer;
