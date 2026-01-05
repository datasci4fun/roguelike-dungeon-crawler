/**
 * FirstPersonRenderer - Canvas-based first-person dungeon view
 *
 * Renders a pseudo-3D view of the dungeon from the player's perspective,
 * showing walls, floor, ceiling, and entities in front of the player.
 */
import { useRef, useEffect, useCallback } from 'react';
import type { FirstPersonView, FirstPersonEntity } from '../../hooks/useGameSocket';
import { Colors } from './colors';
import { getProjection, getFogAmount } from './projection';
import { drawCorridorWall, drawFloorSegment, drawFloorAndCeiling, drawFrontWall } from './walls';
import { drawEnemy, drawItem } from './entities';

interface FirstPersonRendererProps {
  view: FirstPersonView | undefined;
  width?: number;
  height?: number;
  enableAnimations?: boolean;
}

// Tile type checks
const isWallTile = (tile: string) => tile === '#' || tile === '+' || tile === '~';
const isDoorTile = (tile: string) => tile === 'D' || tile === 'd';

export function FirstPersonRenderer({
  view,
  width = 400,
  height = 300,
  enableAnimations = true,
}: FirstPersonRendererProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);
  const timeRef = useRef<number>(0);

  // Draw an entity (enemy or item)
  const renderEntity = useCallback((
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
    const fogAlpha = getFogAmount(distance);

    if (type === 'enemy') {
      drawEnemy({
        ctx,
        centerX,
        baseY,
        entityWidth,
        entityHeight,
        scale,
        name,
        symbol,
        distance,
        health,
        maxHealth: max_health,
        isElite: is_elite || false,
        time,
        enableAnimations,
        fogAlpha,
      });
    } else if (type === 'item') {
      drawItem({
        ctx,
        centerX,
        baseY,
        entityWidth,
        entityHeight,
        scale,
        name,
        symbol,
        distance,
        time,
        enableAnimations,
        fogAlpha,
      });
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
    drawFloorAndCeiling(ctx, width, height, timeRef.current, enableAnimations);

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

    // Find the corridor configuration at each depth
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
      // Only treat as wall if we have valid tile data that's actually a wall
      const centerTileType = centerTile?.tile || '.';  // Default to floor, not wall
      const centerIsWall = isWallTile(centerTileType) || isDoorTile(centerTileType);
      const frontWall = centerIsWall ? centerTileType : null;

      // Check for walls on left and right edges
      // A wall exists if the edge tile is an actual wall tile
      let leftWall = false;
      let rightWall = false;

      if (row.length > 0) {
        const leftTile = row[0].tile;
        const rightTile = row[row.length - 1].tile;

        // Left wall exists if leftmost tile is a wall
        leftWall = isWallTile(leftTile) || isDoorTile(leftTile);
        // Right wall exists if rightmost tile is a wall
        rightWall = isWallTile(rightTile) || isDoorTile(rightTile);
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
        drawFrontWall(ctx, depth, -1, 1, width, height, info.frontWall, timeRef.current, enableAnimations);
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
          const availableSlots = Math.max(3, Math.floor(7 - distance * 0.5));
          const slotWidth = availableSlots > 1 ? 4 / (availableSlots - 1) : 0;

          for (let i = 0; i < entities.length; i++) {
            const slot = i % availableSlots;
            const centerSlot = (availableSlots - 1) / 2;
            entities[i].offset = (slot - centerSlot) * slotWidth * 0.8;
          }
        }
      }

      // Draw all entities
      for (const entity of sortedEntities) {
        renderEntity(ctx, entity, width, height, timeRef.current);
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
  }, [view, width, height, enableAnimations, renderEntity]);

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
