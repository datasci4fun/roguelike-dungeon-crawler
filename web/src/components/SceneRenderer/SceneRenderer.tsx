/**
 * SceneRenderer Component
 *
 * Canvas-based layered renderer for the roguelike game.
 * Supports animations and will support sprite loading.
 */

import React, { useRef, useEffect, useCallback, useState } from 'react';
import type { SceneFrame, SceneEntity, SceneTile } from './types';
import { PlaceholderColors } from './types';
import { applyEntityAnimation, pulse } from './animations';
import './SceneRenderer.css';

interface SceneRendererProps {
  frame: SceneFrame | null;
  className?: string;
  showGrid?: boolean;
  showCoords?: boolean;
  enableAnimations?: boolean;
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
  if (entity.color) return entity.color;

  if (entity.subtype) {
    const subtypeColor = PlaceholderColors[entity.subtype as keyof typeof PlaceholderColors];
    if (subtypeColor) return subtypeColor;
  }

  return PlaceholderColors[entity.kind] || '#FFFFFF';
}

/**
 * Parse color and apply tint
 */
function applyTint(color: string, tintRed: number): string {
  if (tintRed === 0) return color;

  // Parse hex color
  let r = 255, g = 0, b = 0;
  if (color.startsWith('#')) {
    const hex = color.slice(1);
    if (hex.length === 3) {
      r = parseInt(hex[0] + hex[0], 16);
      g = parseInt(hex[1] + hex[1], 16);
      b = parseInt(hex[2] + hex[2], 16);
    } else if (hex.length === 6) {
      r = parseInt(hex.slice(0, 2), 16);
      g = parseInt(hex.slice(2, 4), 16);
      b = parseInt(hex.slice(4, 6), 16);
    }
  }

  // Apply red tint
  r = Math.min(255, r + Math.floor((255 - r) * tintRed));
  g = Math.floor(g * (1 - tintRed * 0.5));
  b = Math.floor(b * (1 - tintRed * 0.5));

  return `rgb(${r}, ${g}, ${b})`;
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
  _lightLevel: number,
  time: number
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

  // Animated stairs indicator
  if (tile.type === 'stairs_down' || tile.type === 'stairs_up') {
    const glowAlpha = pulse(time, 0.6, 1.0, 2);
    ctx.fillStyle = tile.type === 'stairs_down'
      ? `rgba(0, 0, 0, ${glowAlpha})`
      : `rgba(255, 255, 255, ${glowAlpha})`;
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
    ctx.arc(screenX + tileSize / 2, screenY + tileSize / 2, tileSize / 3, 0, Math.PI * 2);
    ctx.fill();
  }
}

/**
 * Draw an entity with animations
 */
function drawEntity(
  ctx: CanvasRenderingContext2D,
  entity: SceneEntity,
  tileSize: number,
  viewportX: number,
  viewportY: number,
  time: number,
  enableAnimations: boolean
): void {
  const screenX = (entity.x - viewportX) * tileSize;
  const screenY = (entity.y - viewportY) * tileSize;

  // Get animation values
  const healthPercent = entity.maxHealth ? entity.health! / entity.maxHealth : 1;
  const anim = enableAnimations
    ? applyEntityAnimation(entity.kind, entity.id, time, healthPercent)
    : { offsetY: 0, scale: 1, alpha: 1, rotation: 0, tintRed: 0 };

  const color = applyTint(getEntityColor(entity), anim.tintRed);
  const anchor = entity.anchor || { x: 0.5, y: 0.5 };
  const baseScale = entity.scale || 1.0;
  const scale = baseScale * anim.scale;

  // Entity size
  const size = tileSize * 0.7 * scale;

  // Calculate position with animation offset
  const drawX = screenX + tileSize * anchor.x - size / 2;
  const drawY = screenY + tileSize * anchor.y - size + anim.offsetY;

  // Apply alpha
  ctx.globalAlpha = anim.alpha;
  ctx.fillStyle = color;

  // Save context for rotation
  if (anim.rotation !== 0) {
    ctx.save();
    ctx.translate(drawX + size / 2, drawY + size / 2);
    ctx.rotate(anim.rotation);
    ctx.translate(-(drawX + size / 2), -(drawY + size / 2));
  }

  // Draw entity shape
  switch (entity.kind) {
    case 'player':
      // Circle with glow effect
      if (enableAnimations) {
        const glowSize = size * pulse(time, 1.0, 1.15, 3);
        ctx.fillStyle = 'rgba(0, 255, 0, 0.2)';
        ctx.beginPath();
        ctx.arc(drawX + size / 2, drawY + size / 2, glowSize / 2, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(drawX + size / 2, drawY + size / 2, size / 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 2;
      ctx.stroke();
      break;

    case 'boss':
      // Diamond with pulsing glow
      if (enableAnimations) {
        const glowSize = size * 1.3;
        ctx.fillStyle = 'rgba(255, 0, 255, 0.15)';
        ctx.beginPath();
        ctx.moveTo(drawX + size / 2, drawY - (glowSize - size) / 2);
        ctx.lineTo(drawX + size + (glowSize - size) / 2, drawY + size / 2);
        ctx.lineTo(drawX + size / 2, drawY + size + (glowSize - size) / 2);
        ctx.lineTo(drawX - (glowSize - size) / 2, drawY + size / 2);
        ctx.closePath();
        ctx.fill();
      }
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.moveTo(drawX + size / 2, drawY);
      ctx.lineTo(drawX + size, drawY + size / 2);
      ctx.lineTo(drawX + size / 2, drawY + size);
      ctx.lineTo(drawX, drawY + size / 2);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#FF00FF';
      ctx.lineWidth = 2;
      ctx.stroke();
      break;

    case 'enemy':
      ctx.beginPath();
      ctx.moveTo(drawX + size / 2, drawY);
      ctx.lineTo(drawX + size, drawY + size);
      ctx.lineTo(drawX, drawY + size);
      ctx.closePath();
      ctx.fill();
      if (entity.isElite) {
        ctx.strokeStyle = '#FFD700';
        ctx.lineWidth = 2;
        ctx.stroke();
      }
      break;

    case 'item':
      // Sparkling item
      const itemSize = size * 0.6;
      const itemX = drawX + (size - itemSize) / 2;
      const itemY = drawY + (size - itemSize) / 2;

      if (enableAnimations) {
        // Draw sparkles
        const sparkleTime = time / 200;
        for (let i = 0; i < 3; i++) {
          const angle = sparkleTime + (i * Math.PI * 2 / 3);
          const dist = itemSize * 0.8;
          const sx = itemX + itemSize / 2 + Math.cos(angle) * dist;
          const sy = itemY + itemSize / 2 + Math.sin(angle) * dist;
          const sparkleAlpha = (Math.sin(sparkleTime * 3 + i) + 1) / 2 * 0.8;
          ctx.fillStyle = `rgba(255, 255, 255, ${sparkleAlpha})`;
          ctx.beginPath();
          ctx.arc(sx, sy, 2, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      ctx.fillStyle = color;
      ctx.fillRect(itemX, itemY, itemSize, itemSize);
      break;

    case 'trap':
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
      ctx.fillStyle = color;
      ctx.globalAlpha = anim.alpha * 0.7;
      ctx.fillRect(screenX, screenY, tileSize, tileSize);
      break;
  }

  // Restore context
  if (anim.rotation !== 0) {
    ctx.restore();
  }
  ctx.globalAlpha = 1.0;

  // Draw health bar
  if (entity.health !== undefined && entity.maxHealth && entity.maxHealth > 0) {
    const healthPct = entity.health / entity.maxHealth;
    const barWidth = tileSize * 0.8;
    const barHeight = 4;
    const barX = screenX + (tileSize - barWidth) / 2;
    const barY = drawY - barHeight - 4;

    // Background
    ctx.fillStyle = '#333';
    ctx.fillRect(barX, barY, barWidth, barHeight);

    // Health with color based on percentage
    let healthColor = '#00FF00';
    if (healthPct <= 0.25) {
      healthColor = enableAnimations ? applyTint('#FF0000', pulse(time, 0, 0.3, 4)) : '#FF0000';
    } else if (healthPct <= 0.5) {
      healthColor = '#FFFF00';
    }
    ctx.fillStyle = healthColor;
    ctx.fillRect(barX, barY, barWidth * healthPct, barHeight);
  }

  // Draw status effect indicators
  if (entity.statusEffects && entity.statusEffects.length > 0) {
    const indicatorSize = 6;
    entity.statusEffects.forEach((effect, i) => {
      const effectAlpha = enableAnimations ? pulse(time + i * 200, 0.6, 1.0, 3) : 1;
      ctx.globalAlpha = effectAlpha;
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
    ctx.globalAlpha = 1.0;
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
  if (lightLevel >= 1.0) return;

  const screenX = x * tileSize;
  const screenY = y * tileSize;

  if (lightLevel === 0) {
    ctx.fillStyle = PlaceholderColors.unexplored;
    ctx.fillRect(screenX, screenY, tileSize, tileSize);
  } else {
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
  time: number,
  showGrid: boolean,
  enableAnimations: boolean
): void {
  const { tileSize, viewportX, viewportY, viewportWidth, viewportHeight } = frame;

  // Clear canvas
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, viewportWidth * tileSize, viewportHeight * tileSize);

  // Draw tiles
  for (let vy = 0; vy < viewportHeight; vy++) {
    for (let vx = 0; vx < viewportWidth; vx++) {
      const worldX = viewportX + vx;
      const worldY = viewportY + vy;

      if (worldX >= frame.width || worldY >= frame.height) continue;

      const tileIndex = worldY * frame.width + worldX;
      const tile = frame.tiles[tileIndex];
      const lightLevel = frame.lighting[tileIndex];

      if (tile && lightLevel > 0) {
        drawTile(ctx, tile, vx, vy, tileSize, lightLevel, time);
      }
    }
  }

  // Draw entities
  frame.entities.forEach((entity) => {
    const vx = entity.x - viewportX;
    const vy = entity.y - viewportY;

    if (vx < 0 || vx >= viewportWidth || vy < 0 || vy >= viewportHeight) {
      return;
    }

    const tileIndex = entity.y * frame.width + entity.x;
    const lightLevel = frame.lighting[tileIndex];

    if (!entity.visible && lightLevel < 1.0) {
      return;
    }

    drawEntity(ctx, entity, tileSize, viewportX, viewportY, time, enableAnimations);
  });

  // Draw fog
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

  // Grid lines
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
  enableAnimations = true,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);
  const [animTime, setAnimTime] = useState(0);

  // Animation loop
  useEffect(() => {
    if (!enableAnimations) return;

    let startTime: number | null = null;

    const animate = (timestamp: number) => {
      if (startTime === null) startTime = timestamp;
      setAnimTime(timestamp - startTime);
      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [enableAnimations]);

  // Render
  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !frame) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = frame.viewportWidth * frame.tileSize;
    const height = frame.viewportHeight * frame.tileSize;

    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
    }

    renderScene(ctx, frame, animTime, showGrid, enableAnimations);

    if (showCoords) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      ctx.fillRect(0, 0, 220, 75);
      ctx.fillStyle = '#FFF';
      ctx.font = '12px monospace';
      ctx.fillText(`Level: ${frame.level} | Theme: ${frame.theme}`, 10, 20);
      ctx.fillText(`Viewport: (${frame.viewportX}, ${frame.viewportY})`, 10, 35);
      ctx.fillText(`Entities: ${frame.entities.length}`, 10, 50);
      ctx.fillText(`Animations: ${enableAnimations ? 'ON' : 'OFF'}`, 10, 65);
    }
  }, [frame, showGrid, showCoords, animTime, enableAnimations]);

  useEffect(() => {
    render();
  }, [render]);

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
