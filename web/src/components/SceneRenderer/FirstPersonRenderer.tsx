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
  wall: '#4a4a5e',
  wallShaded: '#3a3a4e',
  wallHighlight: '#5a5a6e',

  // Door
  door: '#8b4513',
  doorFrame: '#654321',

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

  // Draw a wall segment with perspective
  const drawWall = useCallback((
    ctx: CanvasRenderingContext2D,
    x: number,
    wallHeight: number,
    distance: number,
    tile: string,
    _canvasWidth: number,
    canvasHeight: number,
    segmentWidth: number,
    time: number
  ) => {
    const wallTop = (canvasHeight - wallHeight) / 2;
    const wallBottom = (canvasHeight + wallHeight) / 2;

    // Base wall color with distance shading
    const shadeFactor = Math.max(0.3, 1 - distance * 0.1);
    let baseColor = Colors.wall;

    if (isDoor(tile)) {
      baseColor = Colors.door;
    } else if (isStairsUp(tile)) {
      baseColor = Colors.stairsUp;
    } else if (isStairsDown(tile)) {
      baseColor = Colors.stairsDown;
    }

    // Apply shading
    const r = parseInt(baseColor.slice(1, 3), 16);
    const g = parseInt(baseColor.slice(3, 5), 16);
    const b = parseInt(baseColor.slice(5, 7), 16);

    const shadedR = Math.floor(r * shadeFactor);
    const shadedG = Math.floor(g * shadeFactor);
    const shadedB = Math.floor(b * shadeFactor);

    // Draw wall face
    ctx.fillStyle = `rgb(${shadedR}, ${shadedG}, ${shadedB})`;
    ctx.fillRect(x, wallTop, segmentWidth + 1, wallHeight);

    // Add edge lines for depth
    ctx.strokeStyle = `rgba(0, 0, 0, ${0.3 * shadeFactor})`;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x, wallTop);
    ctx.lineTo(x, wallBottom);
    ctx.stroke();

    // Add brick/stone texture for walls (optional subtle effect)
    if (!isDoor(tile) && !isStairsUp(tile) && !isStairsDown(tile)) {
      ctx.strokeStyle = `rgba(255, 255, 255, ${0.05 * shadeFactor})`;
      const brickHeight = wallHeight / 4;
      for (let i = 1; i < 4; i++) {
        const y = wallTop + i * brickHeight;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + segmentWidth, y);
        ctx.stroke();
      }
    }

    // Draw torch/light flicker effect for doors
    if (isDoor(tile) && enableAnimations) {
      const flicker = Math.sin(time * 5) * 0.1 + 0.9;
      ctx.fillStyle = `rgba(255, 200, 100, ${0.1 * flicker})`;
      ctx.fillRect(x, wallTop, segmentWidth, wallHeight);
    }
  }, [isDoor, isStairsUp, isStairsDown, enableAnimations]);

  // Draw floor and ceiling
  const drawFloorAndCeiling = useCallback((
    ctx: CanvasRenderingContext2D,
    canvasWidth: number,
    canvasHeight: number
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

    // Draw floor and ceiling
    drawFloorAndCeiling(ctx, width, height);

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

      for (let colIdx = 0; colIdx < row.length; colIdx++) {
        const tile = row[colIdx];
        const x = colIdx * segmentWidth;

        if (isWall(tile.tile) || isDoor(tile.tile)) {
          drawWall(
            ctx,
            x,
            wallHeight,
            distance,
            tile.tile,
            width,
            height,
            segmentWidth,
            timeRef.current
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
            timeRef.current
          );
        }
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
