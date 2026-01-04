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
    if (isLeftEdge || colIdx === 0) {
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

  // Draw an entity (enemy or item)
  const drawEntity = useCallback((
    ctx: CanvasRenderingContext2D,
    entity: FirstPersonEntity,
    canvasWidth: number,
    canvasHeight: number,
    time: number
  ) => {
    const { distance, offset, type, name, symbol, health, max_health, is_elite } = entity;

    // Calculate screen position based on distance and offset
    const scale = Math.max(0.2, 1 - (distance - 1) * 0.12);
    const entityHeight = canvasHeight * 0.4 * scale;
    const entityWidth = entityHeight * 0.6;

    // Center position
    const centerX = canvasWidth / 2 + (offset * canvasWidth * 0.1 * scale);
    const baseY = canvasHeight / 2 + canvasHeight * 0.15 * scale;

    // Animation
    let bobY = 0;
    if (enableAnimations) {
      bobY = Math.sin(time * 2 + distance) * 3 * scale;
    }

    const y = baseY - entityHeight + bobY;

    // Draw entity based on type
    if (type === 'enemy') {
      // Enemy body
      ctx.fillStyle = is_elite ? Colors.enemyElite : Colors.enemy;
      ctx.beginPath();
      ctx.ellipse(centerX, y + entityHeight * 0.6, entityWidth / 2, entityHeight / 2, 0, 0, Math.PI * 2);
      ctx.fill();

      // Enemy head
      ctx.beginPath();
      ctx.arc(centerX, y + entityHeight * 0.25, entityWidth * 0.35, 0, Math.PI * 2);
      ctx.fill();

      // Eyes (menacing)
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.arc(centerX - entityWidth * 0.12, y + entityHeight * 0.22, entityWidth * 0.08, 0, Math.PI * 2);
      ctx.arc(centerX + entityWidth * 0.12, y + entityHeight * 0.22, entityWidth * 0.08, 0, Math.PI * 2);
      ctx.fill();

      // Pupils
      ctx.fillStyle = '#000';
      ctx.beginPath();
      ctx.arc(centerX - entityWidth * 0.1, y + entityHeight * 0.22, entityWidth * 0.04, 0, Math.PI * 2);
      ctx.arc(centerX + entityWidth * 0.1, y + entityHeight * 0.22, entityWidth * 0.04, 0, Math.PI * 2);
      ctx.fill();

      // Health bar (only if close enough)
      if (distance <= 4 && health !== undefined && max_health !== undefined) {
        const barWidth = entityWidth;
        const barHeight = 6 * scale;
        const barX = centerX - barWidth / 2;
        const barY = y - barHeight - 5;

        // Background
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(barX, barY, barWidth, barHeight);

        // Health fill
        const healthPercent = health / max_health;
        ctx.fillStyle = healthPercent > 0.5 ? '#50fa7b' : healthPercent > 0.25 ? '#ffb86c' : '#ff5555';
        ctx.fillRect(barX, barY, barWidth * healthPercent, barHeight);

        // Border
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 1;
        ctx.strokeRect(barX, barY, barWidth, barHeight);
      }

      // Name label (close enemies)
      if (distance <= 3) {
        ctx.fillStyle = '#fff';
        ctx.font = `${Math.floor(12 * scale)}px monospace`;
        ctx.textAlign = 'center';
        ctx.fillText(name, centerX, y - 15);
      }
    } else if (type === 'item') {
      // Item glow
      if (enableAnimations) {
        const glow = Math.sin(time * 3) * 0.2 + 0.5;
        ctx.fillStyle = `rgba(241, 250, 140, ${glow})`;
        ctx.beginPath();
        ctx.arc(centerX, y + entityHeight * 0.5, entityWidth * 0.6, 0, Math.PI * 2);
        ctx.fill();
      }

      // Item shape (simple treasure/item look)
      ctx.fillStyle = Colors.item;
      ctx.beginPath();
      ctx.arc(centerX, y + entityHeight * 0.5, entityWidth * 0.4, 0, Math.PI * 2);
      ctx.fill();

      // Symbol on item
      ctx.fillStyle = '#000';
      ctx.font = `bold ${Math.floor(14 * scale)}px monospace`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(symbol, centerX, y + entityHeight * 0.5);
    }
  }, [enableAnimations]);

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

    // Draw walls from back to front (painter's algorithm)
    const rows = view.rows;

    for (let rowIdx = rows.length - 1; rowIdx >= 0; rowIdx--) {
      const row = rows[rowIdx];
      const distance = rowIdx + 1;
      const wallHeight = (height * 0.8) / (distance * 0.5 + 0.5);

      const rowWidth = row.length;
      const segmentWidth = width / rowWidth;

      // Track wall edges for 3D effect
      let prevWasWall = false;

      for (let colIdx = 0; colIdx < row.length; colIdx++) {
        const tile = row[colIdx];
        const x = colIdx * segmentWidth;
        const currentIsWall = isWall(tile.tile) || isDoor(tile.tile);
        const nextTile = row[colIdx + 1];
        const nextIsWall = nextTile ? (isWall(nextTile.tile) || isDoor(nextTile.tile)) : false;

        // Determine if this is an edge
        const isLeftEdge = currentIsWall && !prevWasWall;
        const isRightEdge = currentIsWall && !nextIsWall;

        if (currentIsWall) {
          drawWall(
            ctx,
            x,
            wallHeight,
            distance,
            tile.tile,
            width,
            height,
            segmentWidth,
            timeRef.current,
            colIdx,
            isLeftEdge,
            isRightEdge
          );
        } else if (isStairsUp(tile.tile) || isStairsDown(tile.tile)) {
          // Draw stairs indicator on floor
          drawWall(
            ctx,
            x,
            wallHeight * 0.3,
            distance,
            tile.tile,
            width,
            height,
            segmentWidth,
            timeRef.current,
            colIdx,
            false,
            false
          );
        }

        prevWasWall = currentIsWall;
      }
    }

    // Draw entities (sorted by distance, far to near)
    if (view.entities && view.entities.length > 0) {
      const sortedEntities = [...view.entities].sort((a, b) => b.distance - a.distance);
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
  }, [view, width, height, enableAnimations, drawFloorAndCeiling, drawWall, drawEntity, isWall, isDoor, isStairsUp, isStairsDown]);

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
