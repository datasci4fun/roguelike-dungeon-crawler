/**
 * SceneRenderer Component
 *
 * Canvas-based layered renderer for the roguelike game.
 * Renders game state as colored placeholders (sprites to be added later).
 */

import React, { useRef, useEffect, useCallback } from 'react';
import type { SceneFrame, SceneEntity, SceneTile } from './types';
import { PlaceholderColors } from './types';
import './SceneRenderer.css';

interface SceneRendererProps {
  frame: SceneFrame | null;
  className?: string;
  showGrid?: boolean; // Debug: show grid lines
  showCoords?: boolean; // Debug: show coordinates
}

/**
 * Get placeholder color for a tile type
 */
function getTileColor(tile: SceneTile): string {
  return PlaceholderColors[tile.type] || PlaceholderColors.floor;
}

/**
 * Get placeholder color for an entity
 */
function getEntityColor(entity: SceneEntity): string {
  // Use explicit color if provided
  if (entity.color) return entity.color;

  // Check subtype first (more specific)
  if (entity.subtype) {
    const subtypeColor = PlaceholderColors[entity.subtype as keyof typeof PlaceholderColors];
    if (subtypeColor) return subtypeColor;
  }

  // Fall back to kind
  return PlaceholderColors[entity.kind] || '#FFFFFF';
}

/**
 * Draw a single tile
 */
function drawTile(
  ctx: CanvasRenderingContext2D,
  tile: SceneTile,
  x: number,
  y: number,
  tileSize: number,
  _lightLevel: number
): void {
  const screenX = x * tileSize;
  const screenY = y * tileSize;

  // Base tile color
  const baseColor = getTileColor(tile);
  ctx.fillStyle = baseColor;
  ctx.fillRect(screenX, screenY, tileSize, tileSize);

  // Add subtle border for walls
  if (tile.type === 'wall') {
    ctx.strokeStyle = '#2a2a2a';
    ctx.lineWidth = 1;
    ctx.strokeRect(screenX + 0.5, screenY + 0.5, tileSize - 1, tileSize - 1);
  }

  // Add decoration indicator for special tiles
  if (tile.type === 'stairs_down' || tile.type === 'stairs_up') {
    ctx.fillStyle = tile.type === 'stairs_down' ? '#000' : '#fff';
    ctx.font = `${tileSize * 0.6}px monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(
      tile.type === 'stairs_down' ? '>' : '<',
      screenX + tileSize / 2,
      screenY + tileSize / 2
    );
  }

  // Add bloodstain
  if (tile.bloodstain) {
    ctx.fillStyle = 'rgba(139, 0, 0, 0.4)';
    ctx.beginPath();
    ctx.arc(
      screenX + tileSize / 2,
      screenY + tileSize / 2,
      tileSize / 3,
      0,
      Math.PI * 2
    );
    ctx.fill();
  }
}

/**
 * Draw an entity as a colored shape
 */
function drawEntity(
  ctx: CanvasRenderingContext2D,
  entity: SceneEntity,
  tileSize: number,
  viewportX: number,
  viewportY: number
): void {
  const screenX = (entity.x - viewportX) * tileSize;
  const screenY = (entity.y - viewportY) * tileSize;

  const color = getEntityColor(entity);
  const anchor = entity.anchor || { x: 0.5, y: 0.5 };
  const scale = entity.scale || 1.0;

  // Entity size (slightly smaller than tile)
  const size = tileSize * 0.7 * scale;

  // Calculate position based on anchor
  const drawX = screenX + tileSize * anchor.x - size / 2;
  const drawY = screenY + tileSize * anchor.y - size;

  ctx.fillStyle = color;

  // Different shapes for different entity kinds
  switch (entity.kind) {
    case 'player':
      // Circle for player
      ctx.beginPath();
      ctx.arc(drawX + size / 2, drawY + size / 2, size / 2, 0, Math.PI * 2);
      ctx.fill();
      // White outline
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 2;
      ctx.stroke();
      break;

    case 'boss':
      // Large diamond for boss
      ctx.beginPath();
      ctx.moveTo(drawX + size / 2, drawY);
      ctx.lineTo(drawX + size, drawY + size / 2);
      ctx.lineTo(drawX + size / 2, drawY + size);
      ctx.lineTo(drawX, drawY + size / 2);
      ctx.closePath();
      ctx.fill();
      // Magenta outline
      ctx.strokeStyle = '#FF00FF';
      ctx.lineWidth = 2;
      ctx.stroke();
      break;

    case 'enemy':
      // Triangle for enemies
      ctx.beginPath();
      ctx.moveTo(drawX + size / 2, drawY);
      ctx.lineTo(drawX + size, drawY + size);
      ctx.lineTo(drawX, drawY + size);
      ctx.closePath();
      ctx.fill();
      // Elite enemies get a border
      if (entity.isElite) {
        ctx.strokeStyle = '#FFD700';
        ctx.lineWidth = 2;
        ctx.stroke();
      }
      break;

    case 'item':
      // Small square for items
      const itemSize = size * 0.6;
      const itemX = drawX + (size - itemSize) / 2;
      const itemY = drawY + (size - itemSize) / 2;
      ctx.fillRect(itemX, itemY, itemSize, itemSize);
      break;

    case 'trap':
      // X shape for traps
      ctx.strokeStyle = color;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(drawX, drawY);
      ctx.lineTo(drawX + size, drawY + size);
      ctx.moveTo(drawX + size, drawY);
      ctx.lineTo(drawX, drawY + size);
      ctx.stroke();
      break;

    case 'hazard':
      // Wavy line for hazards
      ctx.fillStyle = color;
      ctx.globalAlpha = 0.7;
      ctx.fillRect(screenX, screenY, tileSize, tileSize);
      ctx.globalAlpha = 1.0;
      break;
  }

  // Draw health bar for entities with health
  if (entity.health !== undefined && entity.maxHealth && entity.maxHealth > 0) {
    const healthPct = entity.health / entity.maxHealth;
    const barWidth = tileSize * 0.8;
    const barHeight = 4;
    const barX = screenX + (tileSize - barWidth) / 2;
    const barY = drawY - barHeight - 2;

    // Background
    ctx.fillStyle = '#333';
    ctx.fillRect(barX, barY, barWidth, barHeight);

    // Health
    ctx.fillStyle = healthPct > 0.5 ? '#00FF00' : healthPct > 0.25 ? '#FFFF00' : '#FF0000';
    ctx.fillRect(barX, barY, barWidth * healthPct, barHeight);
  }

  // Draw status effect indicators
  if (entity.statusEffects && entity.statusEffects.length > 0) {
    const indicatorSize = 6;
    entity.statusEffects.forEach((effect, i) => {
      ctx.fillStyle = PlaceholderColors[effect];
      ctx.beginPath();
      ctx.arc(
        screenX + tileSize - indicatorSize - i * (indicatorSize + 2),
        screenY + indicatorSize,
        indicatorSize / 2,
        0,
        Math.PI * 2
      );
      ctx.fill();
    });
  }
}

/**
 * Apply fog of war overlay
 */
function drawFog(
  ctx: CanvasRenderingContext2D,
  _tile: SceneTile,
  lightLevel: number,
  x: number,
  y: number,
  tileSize: number
): void {
  if (lightLevel >= 1.0) return; // Fully visible, no fog

  const screenX = x * tileSize;
  const screenY = y * tileSize;

  if (lightLevel === 0) {
    // Completely unexplored - solid black
    ctx.fillStyle = PlaceholderColors.unexplored;
    ctx.fillRect(screenX, screenY, tileSize, tileSize);
  } else {
    // Explored but not visible - semi-transparent overlay
    ctx.fillStyle = PlaceholderColors.explored_not_visible;
    ctx.fillRect(screenX, screenY, tileSize, tileSize);
  }
}

/**
 * Main render function
 */
function renderScene(
  ctx: CanvasRenderingContext2D,
  frame: SceneFrame,
  showGrid: boolean = false
): void {
  const { tileSize, viewportX, viewportY, viewportWidth, viewportHeight } = frame;

  // Clear canvas
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, viewportWidth * tileSize, viewportHeight * tileSize);

  // Layer 0: Draw tiles
  for (let vy = 0; vy < viewportHeight; vy++) {
    for (let vx = 0; vx < viewportWidth; vx++) {
      const worldX = viewportX + vx;
      const worldY = viewportY + vy;

      if (worldX >= frame.width || worldY >= frame.height) continue;

      const tileIndex = worldY * frame.width + worldX;
      const tile = frame.tiles[tileIndex];
      const lightLevel = frame.lighting[tileIndex];

      if (tile && lightLevel > 0) {
        drawTile(ctx, tile, vx, vy, tileSize, lightLevel);
      }
    }
  }

  // Layers 1-5: Draw entities (already sorted by z-order)
  frame.entities.forEach((entity) => {
    // Check if entity is in viewport
    const vx = entity.x - viewportX;
    const vy = entity.y - viewportY;

    if (vx < 0 || vx >= viewportWidth || vy < 0 || vy >= viewportHeight) {
      return;
    }

    // Check visibility
    const tileIndex = entity.y * frame.width + entity.x;
    const lightLevel = frame.lighting[tileIndex];

    if (!entity.visible && lightLevel < 1.0) {
      return;
    }

    drawEntity(ctx, entity, tileSize, viewportX, viewportY);
  });

  // Layer 7: Draw fog of war
  for (let vy = 0; vy < viewportHeight; vy++) {
    for (let vx = 0; vx < viewportWidth; vx++) {
      const worldX = viewportX + vx;
      const worldY = viewportY + vy;

      if (worldX >= frame.width || worldY >= frame.height) continue;

      const tileIndex = worldY * frame.width + worldX;
      const tile = frame.tiles[tileIndex];
      const lightLevel = frame.lighting[tileIndex];

      if (tile) {
        drawFog(ctx, tile, lightLevel, vx, vy, tileSize);
      }
    }
  }

  // Debug: Grid lines
  if (showGrid) {
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.lineWidth = 1;

    for (let x = 0; x <= viewportWidth; x++) {
      ctx.beginPath();
      ctx.moveTo(x * tileSize, 0);
      ctx.lineTo(x * tileSize, viewportHeight * tileSize);
      ctx.stroke();
    }

    for (let y = 0; y <= viewportHeight; y++) {
      ctx.beginPath();
      ctx.moveTo(0, y * tileSize);
      ctx.lineTo(viewportWidth * tileSize, y * tileSize);
      ctx.stroke();
    }
  }
}

/**
 * SceneRenderer Component
 */
export const SceneRenderer: React.FC<SceneRendererProps> = ({
  frame,
  className = '',
  showGrid = false,
  showCoords = false,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Render loop
  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !frame) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    const width = frame.viewportWidth * frame.tileSize;
    const height = frame.viewportHeight * frame.tileSize;

    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
    }

    // Render the scene
    renderScene(ctx, frame, showGrid);

    // Debug: Show coordinates
    if (showCoords && frame) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      ctx.fillRect(0, 0, 200, 60);
      ctx.fillStyle = '#FFF';
      ctx.font = '12px monospace';
      ctx.fillText(`Level: ${frame.level} | Theme: ${frame.theme}`, 10, 20);
      ctx.fillText(`Viewport: (${frame.viewportX}, ${frame.viewportY})`, 10, 35);
      ctx.fillText(`Entities: ${frame.entities.length}`, 10, 50);
    }
  }, [frame, showGrid, showCoords]);

  // Re-render when frame changes
  useEffect(() => {
    render();
  }, [render]);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => render();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [render]);

  if (!frame) {
    return (
      <div className={`scene-renderer scene-renderer--loading ${className}`}>
        <div className="scene-renderer__loading-text">Loading scene...</div>
      </div>
    );
  }

  return (
    <div className={`scene-renderer ${className}`}>
      <canvas
        ref={canvasRef}
        className="scene-renderer__canvas"
        width={frame.viewportWidth * frame.tileSize}
        height={frame.viewportHeight * frame.tileSize}
      />
    </div>
  );
};

export default SceneRenderer;
