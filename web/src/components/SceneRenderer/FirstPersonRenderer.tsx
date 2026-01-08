/**
 * FirstPersonRenderer - Canvas-based first-person dungeon view
 *
 * Renders a pseudo-3D view of the dungeon from the player's perspective,
 * showing walls, floor, ceiling, and entities in front of the player.
 */
import { useRef, useEffect, useCallback } from 'react';
import type { FirstPersonView, FirstPersonEntity } from '../../hooks/useGameSocket';
import { Colors } from './colors';
import { getProjection, getFogAmount, PROJECTION_CONFIG } from './projection';
import { drawCorridorWall, drawFloorSegment, drawFrontWall, drawSecretHints } from './walls';
import { drawEnemy, drawItem, drawTrap, renderStairs } from './entities';
import { drawCompass } from './compass';
import { drawDustParticles, drawFogWisps, isWaterTile, drawWaterSegment } from './effects';
import { drawTorches } from './lighting';
import { getBiome, rgbToString, adjustBrightness, type BiomeTheme, type BiomeId } from './biomes';
import { drawFloorGrid, drawCeilingGrid, drawWallWithTexture, useTileSet, type TileRenderContext } from './tiles';

/**
 * Draw floor and ceiling with biome-specific colors
 */
function drawFloorAndCeilingBiome(
  ctx: CanvasRenderingContext2D,
  canvasWidth: number,
  canvasHeight: number,
  time: number,
  enableAnimations: boolean,
  biome: BiomeTheme,
  brightness: number
): void {
  const horizon = canvasHeight / 2;
  const centerX = canvasWidth / 2;

  // Torch flicker (reduced for non-torch biomes)
  const flicker = enableAnimations ? Math.sin(time * 8) * 0.1 + 0.9 : 1;

  // Apply brightness to biome colors
  const floorColor = adjustBrightness(biome.floorColor, brightness);
  const ceilingColor = adjustBrightness(biome.ceilingColor, brightness);
  const lightColor = adjustBrightness(biome.lightColor, brightness);

  // Floor gradient - visible near player, fades to fog
  const floorGrad = ctx.createLinearGradient(0, canvasHeight, 0, horizon);
  floorGrad.addColorStop(0, rgbToString(floorColor, 0.8 * flicker));
  floorGrad.addColorStop(0.3, rgbToString(adjustBrightness(floorColor, 0.6), 0.5 * flicker));
  floorGrad.addColorStop(0.6, rgbToString(adjustBrightness(floorColor, 0.25), 0.3));
  floorGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = floorGrad;
  ctx.fillRect(0, horizon, canvasWidth, horizon);

  // Ceiling gradient - barely visible, mostly dark
  const ceilingGrad = ctx.createLinearGradient(0, horizon, 0, 0);
  ceilingGrad.addColorStop(0, rgbToString(ceilingColor, 0.3 * flicker));
  ceilingGrad.addColorStop(0.3, rgbToString(adjustBrightness(ceilingColor, 0.25), 0.1));
  ceilingGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = ceilingGrad;
  ctx.fillRect(0, 0, canvasWidth, horizon);

  // Ambient light glow on nearby surfaces (uses biome light color)
  const torchGrad = ctx.createRadialGradient(
    centerX, canvasHeight + 20, 0,
    centerX, canvasHeight + 20, canvasHeight * 0.5
  );
  torchGrad.addColorStop(0, rgbToString(lightColor, 0.15 * flicker * brightness));
  torchGrad.addColorStop(0.4, rgbToString(adjustBrightness(lightColor, 0.6), 0.06 * flicker * brightness));
  torchGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = torchGrad;
  ctx.fillRect(0, horizon, canvasWidth, horizon);
}

export interface RenderSettings {
  brightness: number;      // 0.0 - 2.0, default 1.0
  biome: BiomeId;         // Biome theme ID
  fogDensity: number;     // 0.0 - 2.0, default 1.0
  torchIntensity: number; // 0.0 - 2.0, default 1.0
  useTileGrid: boolean;   // Use tile-based floor/ceiling rendering
}

const DEFAULT_SETTINGS: RenderSettings = {
  brightness: 1.0,
  biome: 'dungeon',
  fogDensity: 1.0,
  torchIntensity: 1.0,
  useTileGrid: false,
};

/**
 * Corridor info computed during render - exported for debug snapshots
 */
export interface CorridorInfoEntry {
  depth: number;
  leftWall: boolean;
  rightWall: boolean;
  frontWall: string | null;
  wallPositions: { offset: number; tile: string }[];
  isWater: boolean;
  // Visibility bounds for debugging
  visibleRange?: { min: number; max: number } | null; // null = no visible tiles
}

interface FirstPersonRendererProps {
  view: FirstPersonView | undefined;
  width?: number;
  height?: number;
  enableAnimations?: boolean;
  settings?: Partial<RenderSettings>;
  debugShowOccluded?: boolean; // Show red silhouettes for occluded entities
  debugShowWireframe?: boolean; // Show yellow wireframe for walls/corridors
  // Optional: if provided, used for offset derivation when server omits tile.offset
  playerPos?: { x: number; y: number };
  onCorridorInfo?: (info: CorridorInfoEntry[]) => void; // Callback with derived corridor info for debug
}

// Tile type checks
// Note: '~' is explored-but-not-visible (fog), not a wall - don't block view
const isWallTile = (tile: string) => tile === '#';
const isDoorTile = (tile: string) => tile === 'D' || tile === 'd' || tile === '+';
const isStairsDown = (tile: string) => tile === '>';
const isStairsUp = (tile: string) => tile === '<';

/**
 * Fill zBuffer columns with a depth value
 * Uses same minDepth clamping as projection for consistency.
 * @param zBuffer - The depth buffer array
 * @param startX - Start column (can be fractional, will be clamped)
 * @param endX - End column (can be fractional, will be clamped)
 * @param depth - Depth value to write (only writes if closer than existing)
 */
function fillZBuffer(zBuffer: Float32Array, startX: number, endX: number, depth: number): void {
  const width = zBuffer.length;
  const minCol = Math.max(0, Math.floor(Math.min(startX, endX)));
  const maxCol = Math.min(width - 1, Math.ceil(Math.max(startX, endX)));

  // Clamp depth using same minDepth as projection
  const clampedDepth = Math.max(depth, PROJECTION_CONFIG.minDepth);

  for (let col = minCol; col <= maxCol; col++) {
    if (clampedDepth < zBuffer[col]) {
      zBuffer[col] = clampedDepth;
    }
  }
}

/**
 * Fill zBuffer columns with interpolated depth for side walls
 * Linearly interpolates depth across the screen span for more accurate occlusion.
 * Uses column center sampling (col + 0.5) to reduce edge flicker.
 * @param zBuffer - The depth buffer array
 * @param nearX - Screen X at near depth (closer to viewer)
 * @param farX - Screen X at far depth (further from viewer)
 * @param nearDepth - Depth at near edge
 * @param farDepth - Depth at far edge
 */
function fillZBufferInterpolated(
  zBuffer: Float32Array,
  nearX: number,
  farX: number,
  nearDepth: number,
  farDepth: number
): void {
  const width = zBuffer.length;
  const minX = Math.min(nearX, farX);
  const maxX = Math.max(nearX, farX);
  const minCol = Math.max(0, Math.floor(minX));
  const maxCol = Math.min(width - 1, Math.ceil(maxX));

  // Handle degenerate case where span is too small
  const spanWidth = farX - nearX;
  if (Math.abs(spanWidth) < 0.001) {
    // Fall back to average depth
    const avgDepth = Math.max((nearDepth + farDepth) / 2, PROJECTION_CONFIG.minDepth);
    for (let col = minCol; col <= maxCol; col++) {
      if (avgDepth < zBuffer[col]) {
        zBuffer[col] = avgDepth;
      }
    }
    return;
  }

  for (let col = minCol; col <= maxCol; col++) {
    // Use column center for sampling to reduce edge flicker
    const x = col + 0.5;
    // Interpolation factor based on nearX/farX directly (handles nearX > farX)
    const t = Math.max(0, Math.min(1, (x - nearX) / spanWidth));
    // Linear interpolation: depth = lerp(nearDepth, farDepth, t)
    const interpolatedDepth = nearDepth + (farDepth - nearDepth) * t;
    // Clamp using same minDepth as projection
    const clampedDepth = Math.max(interpolatedDepth, PROJECTION_CONFIG.minDepth);

    if (clampedDepth < zBuffer[col]) {
      zBuffer[col] = clampedDepth;
    }
  }
}

/**
 * Check if an entity is occluded by walls in the zBuffer
 * Uses same minDepth clamping as projection for consistency.
 * @param zBuffer - The depth buffer array
 * @param centerX - Entity center X position
 * @param entityWidth - Entity width in pixels
 * @param entityDepth - Entity distance from viewer (will be clamped to minDepth)
 * @returns true if entity should be drawn (not fully occluded)
 */
function isEntityVisible(zBuffer: Float32Array, centerX: number, entityWidth: number, entityDepth: number): boolean {
  const width = zBuffer.length;
  const halfWidth = entityWidth / 2;
  const startCol = Math.max(0, Math.floor(centerX - halfWidth));
  const endCol = Math.min(width - 1, Math.ceil(centerX + halfWidth));

  // Clamp entity depth using same minDepth as projection
  const clampedEntityDepth = Math.max(entityDepth, PROJECTION_CONFIG.minDepth);

  // Entity is visible if ANY column has depth > entityDepth (entity is closer)
  // Use small epsilon for floating point comparison
  const epsilon = 0.01;
  for (let col = startCol; col <= endCol; col++) {
    if (clampedEntityDepth < zBuffer[col] - epsilon) {
      return true;
    }
  }
  return false;
}

export function FirstPersonRenderer({
  view,
  width = 400,
  height = 300,
  enableAnimations = true,
  settings: userSettings,
  debugShowOccluded = false,
  debugShowWireframe = false,
  playerPos,
  onCorridorInfo,
}: FirstPersonRendererProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);
  const timeRef = useRef<number>(0);

  // Animation state for smooth movement
  const animationState = useRef({
    // Movement animation (depth offset)
    moveProgress: 1,      // 0 = start, 1 = complete
    moveDepthOffset: 0,   // Starting depth offset (animates to 0)
    // Turn animation (horizontal offset)
    turnProgress: 1,      // 0 = start, 1 = complete
    turnXOffset: 0,       // Starting X offset (animates to 0)
    // Head bob
    bobPhase: 0,
    // Previous view state for change detection
    prevRowsJson: '',
    prevFacingDx: 0,
    prevFacingDy: -1,
    // Timing
    lastTime: 0,
  });

  // Animation constants
  const MOVE_DURATION = 0.15; // seconds
  const TURN_DURATION = 0.12; // seconds
  const HEAD_BOB_AMPLITUDE = 3; // pixels
  const HEAD_BOB_FREQUENCY = 12; // Hz

  // Merge user settings with defaults
  const settings: RenderSettings = { ...DEFAULT_SETTINGS, ...userSettings };
  const biome = getBiome(settings.biome);

  // Load tiles for this biome if tile grid is enabled
  const tilesLoaded = useTileSet(settings.biome);

  // Draw a debug silhouette for occluded entities (red ghost outline)
  const drawOccludedSilhouette = useCallback((
    ctx: CanvasRenderingContext2D,
    centerX: number,
    baseY: number,
    entityWidth: number,
    entityHeight: number,
    distance: number,
    symbol: string
  ) => {
    // Draw a red semi-transparent silhouette
    ctx.save();
    ctx.globalAlpha = 0.5;

    // Draw body silhouette (simple rectangle with rounded top)
    ctx.fillStyle = 'rgba(255, 0, 0, 0.4)';
    ctx.strokeStyle = 'rgba(255, 0, 0, 0.8)';
    ctx.lineWidth = 2;

    const bodyTop = baseY - entityHeight;
    ctx.beginPath();
    ctx.ellipse(centerX, bodyTop + entityWidth * 0.4, entityWidth * 0.4, entityWidth * 0.4, 0, Math.PI, 0);
    ctx.lineTo(centerX + entityWidth * 0.3, baseY);
    ctx.lineTo(centerX - entityWidth * 0.3, baseY);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Draw "OCCLUDED" label
    ctx.globalAlpha = 1;
    ctx.fillStyle = '#ff0000';
    ctx.font = `bold ${Math.max(10, entityWidth * 0.4)}px monospace`;
    ctx.textAlign = 'center';
    ctx.fillText('HIDDEN', centerX, bodyTop - 5);
    ctx.fillText(`D=${distance.toFixed(1)}`, centerX, bodyTop - 5 - Math.max(10, entityWidth * 0.4));

    // Draw the entity symbol
    ctx.fillStyle = '#ff6666';
    ctx.font = `bold ${Math.max(14, entityWidth * 0.6)}px monospace`;
    ctx.fillText(symbol, centerX, baseY - entityHeight * 0.4);

    ctx.restore();
  }, []);

  // Draw debug wireframe showing wall boundaries and corridor edges
  const drawDebugWireframe = useCallback((
    ctx: CanvasRenderingContext2D,
    canvasWidth: number,
    canvasHeight: number,
    maxDepth: number,
    corridorInfo: Array<{ leftWall: boolean; rightWall: boolean; frontWall: string | null }>
  ) => {
    ctx.save();

    const horizon = canvasHeight / 2;

    // Draw corridor boundary lines (walls at offset ±1)
    // Yellow for wall edges, cyan for depth markers
    for (let d = 1; d <= Math.min(maxDepth, 8); d++) {
      const depth = d;
      const nextDepth = d + 1;
      const info = corridorInfo[d] || { leftWall: false, rightWall: false, frontWall: null };

      // Get projections for wall edges at this depth
      const leftNear = getProjection(canvasWidth, canvasHeight, depth, -1);
      const leftFar = getProjection(canvasWidth, canvasHeight, nextDepth, -1);
      const rightNear = getProjection(canvasWidth, canvasHeight, depth, 1);
      const rightFar = getProjection(canvasWidth, canvasHeight, nextDepth, 1);

      // Draw left wall edge (yellow if wall exists, dim if not)
      ctx.strokeStyle = info.leftWall ? '#ffff00' : 'rgba(255, 255, 0, 0.2)';
      ctx.lineWidth = info.leftWall ? 2 : 1;
      ctx.setLineDash(info.leftWall ? [] : [4, 4]);
      ctx.beginPath();
      ctx.moveTo(leftNear.x, leftNear.wallTop);
      ctx.lineTo(leftNear.x, leftNear.wallBottom);
      ctx.lineTo(leftFar.x, leftFar.wallBottom);
      ctx.lineTo(leftFar.x, leftFar.wallTop);
      ctx.lineTo(leftNear.x, leftNear.wallTop);
      ctx.stroke();

      // Draw right wall edge
      ctx.strokeStyle = info.rightWall ? '#ffff00' : 'rgba(255, 255, 0, 0.2)';
      ctx.lineWidth = info.rightWall ? 2 : 1;
      ctx.setLineDash(info.rightWall ? [] : [4, 4]);
      ctx.beginPath();
      ctx.moveTo(rightNear.x, rightNear.wallTop);
      ctx.lineTo(rightNear.x, rightNear.wallBottom);
      ctx.lineTo(rightFar.x, rightFar.wallBottom);
      ctx.lineTo(rightFar.x, rightFar.wallTop);
      ctx.lineTo(rightNear.x, rightNear.wallTop);
      ctx.stroke();

      // Draw front wall if present (orange)
      if (info.frontWall) {
        ctx.strokeStyle = '#ff8800';
        ctx.lineWidth = 3;
        ctx.setLineDash([]);
        ctx.beginPath();
        ctx.moveTo(leftNear.x, leftNear.wallTop);
        ctx.lineTo(rightNear.x, rightNear.wallTop);
        ctx.lineTo(rightNear.x, rightNear.wallBottom);
        ctx.lineTo(leftNear.x, leftNear.wallBottom);
        ctx.closePath();
        ctx.stroke();
      }

      // Draw depth label (cyan)
      ctx.fillStyle = '#00ffff';
      ctx.font = '10px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(`D${depth}`, canvasWidth / 2, leftNear.wallTop - 2);

      // Draw horizontal floor line at this depth (cyan, dashed)
      ctx.strokeStyle = 'rgba(0, 255, 255, 0.3)';
      ctx.lineWidth = 1;
      ctx.setLineDash([2, 4]);
      ctx.beginPath();
      ctx.moveTo(leftNear.x, leftNear.wallBottom);
      ctx.lineTo(rightNear.x, rightNear.wallBottom);
      ctx.stroke();
    }

    // Draw center line (green, for reference)
    ctx.strokeStyle = 'rgba(0, 255, 0, 0.4)';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(canvasWidth / 2, 0);
    ctx.lineTo(canvasWidth / 2, canvasHeight);
    ctx.stroke();

    // Draw horizon line (magenta)
    ctx.strokeStyle = 'rgba(255, 0, 255, 0.4)';
    ctx.setLineDash([2, 2]);
    ctx.beginPath();
    ctx.moveTo(0, horizon);
    ctx.lineTo(canvasWidth, horizon);
    ctx.stroke();

    // Draw wall boundary markers at offset ±1 (where z-buffer blocks)
    ctx.fillStyle = '#ffff00';
    ctx.font = 'bold 11px monospace';
    ctx.textAlign = 'left';
    ctx.fillText('← Wall -1', 5, horizon - 5);
    ctx.textAlign = 'right';
    ctx.fillText('Wall +1 →', canvasWidth - 5, horizon - 5);

    ctx.setLineDash([]);
    ctx.restore();
  }, []);

  // Draw an entity (enemy or item) with z-buffer occlusion check
  const renderEntity = useCallback((
    ctx: CanvasRenderingContext2D,
    entity: FirstPersonEntity,
    canvasWidth: number,
    canvasHeight: number,
    time: number,
    zBuffer: Float32Array | null,
    showOccludedDebug: boolean
  ) => {
    const { distance, offset, type, name, symbol, health, max_health, is_elite } = entity;

    // Use projection system for proper floor placement
    const projection = getProjection(canvasWidth, canvasHeight, distance, offset);

    // Entity sits on the floor
    const baseY = projection.wallBottom;
    const scale = projection.scale * 1.5;
    const entityHeight = canvasHeight * 0.35 * scale;
    const entityWidth = entityHeight * 0.5;
    const centerX = projection.x;
    const fogAlpha = getFogAmount(distance);

    // Check z-buffer occlusion (coarse test: is entity behind walls?)
    if (zBuffer && !isEntityVisible(zBuffer, centerX, entityWidth, distance)) {
      if (showOccludedDebug) {
        // Draw debug silhouette instead of hiding
        drawOccludedSilhouette(ctx, centerX, baseY, entityWidth, entityHeight, distance, symbol);
      }
      return; // Entity is fully occluded by walls
    }

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
    } else if (type === 'trap') {
      drawTrap({
        ctx,
        centerX,
        floorY: baseY,
        width: entityWidth * 1.5,
        height: entityHeight * 0.5,
        scale,
        trapType: entity.trap_type || 'spike',
        triggered: entity.triggered || false,
        isActive: entity.is_active !== false,
        distance,
        time,
        enableAnimations,
        fogAlpha,
      });
    }
  }, [enableAnimations, drawOccludedSilhouette]);

  // Main render function
  const render = useCallback((time: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const currentTime = time / 1000; // Convert to seconds
    const deltaTime = animationState.current.lastTime > 0
      ? currentTime - animationState.current.lastTime
      : 0.016;
    animationState.current.lastTime = currentTime;
    timeRef.current = currentTime;

    // Update animation progress
    const anim = animationState.current;
    if (anim.moveProgress < 1) {
      anim.moveProgress += deltaTime / MOVE_DURATION;
      if (anim.moveProgress > 1) anim.moveProgress = 1;
    }
    if (anim.turnProgress < 1) {
      anim.turnProgress += deltaTime / TURN_DURATION;
      if (anim.turnProgress > 1) anim.turnProgress = 1;
    }

    // Update head bob phase during movement
    if (anim.moveProgress < 1 && enableAnimations) {
      anim.bobPhase += deltaTime * HEAD_BOB_FREQUENCY * Math.PI * 2;
    }

    // Ease function (ease out cubic)
    const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);

    // Calculate animated offsets
    const moveEase = easeOut(anim.moveProgress);
    const depthOffset = anim.moveDepthOffset * (1 - moveEase);

    const turnEase = easeOut(anim.turnProgress);
    const xOffset = anim.turnXOffset * (1 - turnEase);

    // Head bob (vertical offset)
    const headBob = anim.moveProgress < 1 && enableAnimations
      ? Math.sin(anim.bobPhase) * HEAD_BOB_AMPLITUDE
      : 0;

    // Clear canvas with biome fog color
    const fogColor = adjustBrightness(biome.fogColor, settings.brightness);
    ctx.fillStyle = rgbToString(fogColor);
    ctx.fillRect(0, 0, width, height);

    // Apply animation transforms (turn offset + head bob + movement zoom)
    ctx.save();
    ctx.translate(xOffset, headBob);

    // Movement zoom effect: when moving forward, start zoomed out and zoom in
    if (depthOffset > 0.001) {
      const scale = 1 / (1 + depthOffset * 0.15);
      const centerX = width / 2;
      const centerY = height / 2;
      ctx.translate(centerX, centerY);
      ctx.scale(scale, scale);
      ctx.translate(-centerX, -centerY);
    }

    // Draw floor and ceiling with perspective and biome colors
    drawFloorAndCeilingBiome(ctx, width, height, timeRef.current, enableAnimations, biome, settings.brightness);

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

    // Create z-buffer for occlusion culling (one depth value per column)
    const zBuffer = new Float32Array(width).fill(Infinity);

    // Analyze the view to find corridor boundaries
    const rows = view.rows;
    const maxDepth = rows.length;

    // --- Derived offset fallback ---
    // Server is expected to send tile.offset (w), but if it is missing or rows are sparse/ragged,
    // derive offset from world coords relative to the row center at depth d.
    // Facing basis:
    //   forward = (dx, dy)
    //   right/perp = (-dy, dx)  (matches server)
    const facing = view.facing;
    const perp_dx = -facing.dy;
    const perp_dy = facing.dx;

    // Infer player position if not provided:
    // Depth 0 row is a lateral slice centered on player (d=0).
    // We find the median tile along the perp axis as the center.
    const inferPlayerPos = (): { x: number; y: number } | null => {
      if (!rows[0] || rows[0].length === 0) return null;
      const r0 = rows[0].filter(t => typeof t.x === 'number' && typeof t.y === 'number');
      if (r0.length === 0) return null;
      const scored = r0
        .map(t => ({ t, s: (t.x * perp_dx + t.y * perp_dy) }))
        .sort((a, b) => a.s - b.s);
      const mid = scored[Math.floor(scored.length / 2)].t;
      return { x: mid.x, y: mid.y };
    };

    const derivedPlayer = playerPos ?? inferPlayerPos();

    const getTileOffset = (tileData: { offset?: number; x: number; y: number }, depth: number): number => {
      if (typeof tileData.offset === 'number') return tileData.offset;
      if (!derivedPlayer) return 0; // safe fallback; prevents "no visible tiles" collapse
      const centerX = derivedPlayer.x + facing.dx * depth;
      const centerY = derivedPlayer.y + facing.dy * depth;
      return (tileData.x - centerX) * perp_dx + (tileData.y - centerY) * perp_dy;
    };


    // Find the corridor configuration at each depth
    // Track: side walls, front walls, and any walls in the row for open room rendering
    const corridorInfo: {
      leftWall: boolean;
      rightWall: boolean;
      hasFloor: boolean;
      frontWall: string | null;
      // For open rooms: track positions of all walls in this row
      wallPositions: { offset: number; tile: string }[];
      // Track hidden secret door positions for visual hints
      secretPositions: { offset: number }[];
      // Track if floor is water for water reflections
      isWater: boolean;
      // Track stairs positions
      stairsPositions: { offset: number; direction: 'down' | 'up' }[];
      // Visible range for debugging
      visibleRange: { min: number; max: number } | null;
    }[] = [];

    for (let d = 0; d < maxDepth; d++) {
      const row = rows[d];
      if (!row || row.length === 0) {
        corridorInfo.push({ leftWall: true, rightWall: true, hasFloor: false, frontWall: '#', wallPositions: [], secretPositions: [], isWater: false, stairsPositions: [], visibleRange: null });
        continue;
      }

      // Use tile.offset field from server (not array index) for correct offset mapping
      // This handles sparse rows where OOB tiles are omitted

      // Find the range of VISIBLE tile offsets in this row
      let minVisOffset = Infinity;
      let maxVisOffset = -Infinity;
      for (const tileData of row) {
        if (tileData.visible) {
          const off = getTileOffset(tileData, d);
          if (off < minVisOffset) minVisOffset = off;
          if (off > maxVisOffset) maxVisOffset = off;
        }
      }

      // If no visible tiles in this row, treat as fog boundary
      if (minVisOffset === Infinity) {
        corridorInfo.push({ leftWall: true, rightWall: true, hasFloor: false, frontWall: null, wallPositions: [], secretPositions: [], isWater: false, stairsPositions: [], visibleRange: null });
        continue;
      }

      // Find center tile (offset === 0)
      const centerTile = row.find(t => getTileOffset(t, d) === 0);
      const centerVisible = centerTile?.visible ?? false;

      // Check if center is blocked (front wall) - ONLY if center is visible
      let frontWall: string | null = null;
      let centerIsWall = false;
      if (centerVisible && centerTile) {
        const centerTileType = centerTile.tile_actual ?? centerTile.tile;
        centerIsWall = isWallTile(centerTileType) || isDoorTile(centerTileType);
        frontWall = centerIsWall ? centerTileType : null;
      }

      // Track wall positions using tile.offset and tile_actual for geometry
      const wallPositions: { offset: number; tile: string }[] = [];
      // Track positions with hidden secrets for visual hints (visible only)
      const secretPositions: { offset: number }[] = [];

      // Scan ALL tiles using tile_actual for geometry decisions
      // Use tile.offset directly (not array index) for correct offset mapping
      for (const tileData of row) {
        const actualTile = tileData.tile_actual ?? tileData.tile;
        const offset = getTileOffset(tileData, d);
        if (isWallTile(actualTile) || isDoorTile(actualTile)) {
          wallPositions.push({ offset, tile: actualTile });
        }

        // Secret hints only for visible tiles
        if (tileData.visible && tileData.has_secret) {
          secretPositions.push({ offset });
        }
      }

      // Determine corridor walls - only walls at offset ±1 block the immediate corridor sides
      // Walls at offset -2 or beyond are visible but don't block the view at offset -1
      const leftWall = wallPositions.some(w => w.offset === -1);
      const rightWall = wallPositions.some(w => w.offset === 1);

      // Check if center tile is water (only if visible and not a wall)
      const isWater = centerVisible && !centerIsWall && isWaterTile(centerTile?.tile || '.');

      // Track stairs positions (only for visible tiles)
      const stairsPositions: { offset: number; direction: 'down' | 'up' }[] = [];
      for (const tileData of row) {
        if (!tileData.visible) continue;

        const tile = tileData.tile;
        const offset = getTileOffset(tileData, d);
        if (isStairsDown(tile)) {
          stairsPositions.push({ offset, direction: 'down' });
        } else if (isStairsUp(tile)) {
          stairsPositions.push({ offset, direction: 'up' });
        }
      }

      corridorInfo.push({
        leftWall,
        rightWall,
        hasFloor: !centerIsWall,
        frontWall,
        wallPositions,
        secretPositions,
        isWater,
        stairsPositions,
        visibleRange: { min: minVisOffset, max: maxVisOffset }, // Visible tile offsets
      });
    }

    // Call debug callback with corridor info (for snapshots)
    if (onCorridorInfo) {
      const exportableInfo: CorridorInfoEntry[] = corridorInfo.map((info, depth) => ({
        depth,
        leftWall: info.leftWall,
        rightWall: info.rightWall,
        frontWall: info.frontWall,
        wallPositions: info.wallPositions,
        isWater: info.isWater,
        visibleRange: info.visibleRange,
      }));
      onCorridorInfo(exportableInfo);
    }

    // Row 0 is tiles beside player (depth 0) - use for immediate side wall detection
    // Row 1+ is tiles in front of player (depth 1+) - use for corridor rendering
    const playerSideInfo = corridorInfo[0]; // Tiles beside player

    // Tile render context for tile-based rendering
    const tileContext: TileRenderContext = {
      ctx,
      canvasWidth: width,
      canvasHeight: height,
      biome,
      brightness: settings.brightness,
      time: timeRef.current,
      enableAnimations,
    };

    // If tile grid mode is enabled, draw the entire floor/ceiling grid first
    if (settings.useTileGrid && tilesLoaded) {
      // Calculate bounds based on what's visible
      const maxVisibleDepth = Math.min(maxDepth, 8);
      const leftBound = -3;
      const rightBound = 3;

      // Draw ceiling grid (from back to front) - start at depth 0 for player position
      drawCeilingGrid(tileContext, 0, maxVisibleDepth, leftBound, rightBound);

      // Draw floor grid (from back to front) - start at depth 0 for player position
      drawFloorGrid(tileContext, 0, maxVisibleDepth, leftBound, rightBound);
    }

    // Pre-calculate visible corridor widths from player forward
    // Corridor walls restrict visibility for SUBSEQUENT depths, not the current depth
    // This ensures walls at the edge of visibility are still drawn
    const visibleWidths: { left: number; right: number }[] = [];
    let cumulativeLeft = playerSideInfo?.leftWall ? -1 : -2;
    let cumulativeRight = playerSideInfo?.rightWall ? 1 : 2;

    for (let d = 0; d < maxDepth; d++) {
      // Store visibility BEFORE applying current depth's corridor walls
      // This allows walls at the edge of visibility to be drawn at this depth
      visibleWidths[d] = { left: cumulativeLeft, right: cumulativeRight };

      const info = corridorInfo[d];
      if (info) {
        // Corridor walls at this depth restrict visibility for SUBSEQUENT depths only
        if (info.leftWall) cumulativeLeft = Math.max(cumulativeLeft, -1);
        if (info.rightWall) cumulativeRight = Math.min(cumulativeRight, 1);
      }
    }

    // Draw from back to front (painter's algorithm)
    // Start from row 1 (depth 1) since row 0 is beside player, not in front
    for (let d = maxDepth - 1; d >= 1; d--) {
      const depth = d;
      const nextDepth = d + 1;
      const info = corridorInfo[d];

      // Get the visible width at this depth (cumulative from player forward)
      const visibleLeft = visibleWidths[d]?.left ?? -2;
      const visibleRight = visibleWidths[d]?.right ?? 2;

      // Use visible width for floor/ceiling so they match the view constraints
      const leftOffset = visibleLeft;
      const rightOffset = visibleRight;

      // Biome options for floor/ceiling/wall rendering
      const renderOptions = { biome, brightness: settings.brightness };

      // Skip floor/ceiling segment drawing if using tile grid mode
      if (!settings.useTileGrid) {
        // Draw ceiling segment
        drawFloorSegment(ctx, depth, nextDepth, leftOffset, rightOffset, width, height, false, renderOptions);

        // Draw floor segment (or water if this is a water tile)
        if (info.isWater) {
          drawWaterSegment(ctx, depth, nextDepth, leftOffset, rightOffset, width, height, timeRef.current, enableAnimations, d);
        } else {
          drawFloorSegment(ctx, depth, nextDepth, leftOffset, rightOffset, width, height, true, renderOptions);
        }
      } else if (info.isWater) {
        // Still draw water even in tile grid mode
        drawWaterSegment(ctx, depth, nextDepth, leftOffset, rightOffset, width, height, timeRef.current, enableAnimations, d);
      }

      // Wall options (same as render options)
      const wallOptions = renderOptions;

      // Draw left corridor wall if there's a wall on the left
      if (info.leftWall) {
        if (settings.useTileGrid && tilesLoaded) {
          drawWallWithTexture(tileContext, 'left', depth, -1, 1);
        } else {
          drawCorridorWall(ctx, 'left', depth, nextDepth, width, height, timeRef.current, enableAnimations, wallOptions);
        }
        // Fill zBuffer for left corridor wall with interpolated depth
        const nearProj = getProjection(width, height, depth, -1);
        const farProj = getProjection(width, height, nextDepth, -1);
        fillZBufferInterpolated(zBuffer, nearProj.x, farProj.x, depth, nextDepth);
      }

      // Draw right corridor wall if there's a wall on the right
      if (info.rightWall) {
        if (settings.useTileGrid && tilesLoaded) {
          drawWallWithTexture(tileContext, 'right', depth, -1, 1);
        } else {
          drawCorridorWall(ctx, 'right', depth, nextDepth, width, height, timeRef.current, enableAnimations, wallOptions);
        }
        // Fill zBuffer for right corridor wall with interpolated depth
        const nearProj = getProjection(width, height, depth, 1);
        const farProj = getProjection(width, height, nextDepth, 1);
        fillZBufferInterpolated(zBuffer, nearProj.x, farProj.x, depth, nextDepth);
      }

      // Draw front wall if this depth is blocked (center blocked)
      // Use VISIBLE width (cumulative from player) so the wall fills the entire view
      if (info.frontWall) {
        if (settings.useTileGrid && tilesLoaded) {
          drawWallWithTexture(tileContext, 'front', depth, visibleLeft, visibleRight);
        } else {
          drawFrontWall(ctx, depth, visibleLeft, visibleRight, width, height, info.frontWall, timeRef.current, enableAnimations, wallOptions);
        }
        // Fill zBuffer for front wall
        const leftProj = getProjection(width, height, depth, visibleLeft);
        const rightProj = getProjection(width, height, depth, visibleRight);
        fillZBuffer(zBuffer, leftProj.x, rightProj.x, depth);
      }
      // Draw walls at positions beyond the corridor edges (offset < -1 or > 1)
      // These are visible only if the cumulative visibility extends that far
      if (info.wallPositions.length > 0) {
        // Get walls on left side that are within visible range and beyond the corridor edge
        const leftSideWalls = info.wallPositions.filter(w => w.offset < -1 && w.offset >= visibleLeft);
        // Get walls on right side that are within visible range and beyond the corridor edge
        const rightSideWalls = info.wallPositions.filter(w => w.offset > 1 && w.offset <= visibleRight);

        // Draw left side wall at leftmost position (only if visible width extends past -1)
        if (visibleLeft < -1 && leftSideWalls.length > 0) {
          const leftMostWall = Math.min(...leftSideWalls.map(w => w.offset));
          const wallTile = leftSideWalls.find(w => w.offset === leftMostWall)?.tile || '#';
          // Draw a partial front wall on the left side
          if (settings.useTileGrid && tilesLoaded) {
            drawWallWithTexture(tileContext, 'front', depth, leftMostWall - 0.5, leftMostWall + 0.5);
          } else {
            drawFrontWall(ctx, depth, leftMostWall - 0.5, leftMostWall + 0.5, width, height, wallTile, timeRef.current, enableAnimations, wallOptions);
          }
          // Fill zBuffer for partial left wall
          const leftProj = getProjection(width, height, depth, leftMostWall - 0.5);
          const rightProj = getProjection(width, height, depth, leftMostWall + 0.5);
          fillZBuffer(zBuffer, leftProj.x, rightProj.x, depth);
        }

        // Draw right side wall at rightmost position (only if visible width extends past +1)
        if (visibleRight > 1 && rightSideWalls.length > 0) {
          const rightMostWall = Math.max(...rightSideWalls.map(w => w.offset));
          const wallTile = rightSideWalls.find(w => w.offset === rightMostWall)?.tile || '#';
          // Draw a partial front wall on the right side
          if (settings.useTileGrid && tilesLoaded) {
            drawWallWithTexture(tileContext, 'front', depth, rightMostWall - 0.5, rightMostWall + 0.5);
          } else {
            drawFrontWall(ctx, depth, rightMostWall - 0.5, rightMostWall + 0.5, width, height, wallTile, timeRef.current, enableAnimations, wallOptions);
          }
          // Fill zBuffer for partial right wall
          const leftProj = getProjection(width, height, depth, rightMostWall - 0.5);
          const rightProj = getProjection(width, height, depth, rightMostWall + 0.5);
          fillZBuffer(zBuffer, leftProj.x, rightProj.x, depth);
        }

        // If there's a continuous wall across the back (all positions are walls), draw full back wall
        if (info.wallPositions.length >= 3 && visibleLeft < -1 && visibleRight > 1) {
          const leftMostWall = Math.min(...info.wallPositions.map(w => w.offset));
          const rightMostWall = Math.max(...info.wallPositions.map(w => w.offset));
          // Check if walls span most of the view
          const row = rows[d];
          const totalTiles = row?.length || 0;
          const wallCount = info.wallPositions.length;
          if (wallCount >= totalTiles * 0.7) {
            // Most of the row is walls - draw a full back wall
            if (settings.useTileGrid && tilesLoaded) {
              drawWallWithTexture(tileContext, 'front', depth, leftMostWall, rightMostWall);
            } else {
              drawFrontWall(ctx, depth, leftMostWall, rightMostWall, width, height, '#', timeRef.current, enableAnimations, wallOptions);
            }
            // Fill zBuffer for full back wall
            const leftProj = getProjection(width, height, depth, leftMostWall);
            const rightProj = getProjection(width, height, depth, rightMostWall);
            fillZBuffer(zBuffer, leftProj.x, rightProj.x, depth);
          }
        }
      }

      // Draw secret hints for hidden secret doors in this row
      if (info.secretPositions.length > 0) {
        for (const secret of info.secretPositions) {
          drawSecretHints({
            ctx,
            depth,
            offset: secret.offset * 0.3,
            canvasWidth: width,
            canvasHeight: height,
            time: timeRef.current,
            enableAnimations,
          });
        }
      }

      // Draw stairs in this row
      if (info.stairsPositions && info.stairsPositions.length > 0) {
        for (const stairs of info.stairsPositions) {
          renderStairs(
            ctx,
            width,
            height,
            depth,
            stairs.offset,
            stairs.direction,
            timeRef.current,
            enableAnimations
          );
        }
      }
    }

    // Draw the immediate area (depth 0 to 1)
    // Use playerSideInfo (row 0) for side walls - these are tiles beside the player
    const nearLeftOffset = playerSideInfo?.leftWall ? -1 : -2;
    const nearRightOffset = playerSideInfo?.rightWall ? 1 : 2;

    // Biome options for immediate area
    const nearRenderOptions = { biome, brightness: settings.brightness };

    // Skip if using tile grid mode (tiles are rendered separately)
    if (!settings.useTileGrid) {
      drawFloorSegment(ctx, 0.3, 1, nearLeftOffset, nearRightOffset, width, height, false, nearRenderOptions); // ceiling
      // Draw floor or water for immediate area
      if (playerSideInfo?.isWater) {
        drawWaterSegment(ctx, 0.3, 1, nearLeftOffset, nearRightOffset, width, height, timeRef.current, enableAnimations, 0);
      } else {
        drawFloorSegment(ctx, 0.3, 1, nearLeftOffset, nearRightOffset, width, height, true, nearRenderOptions);  // floor
      }
    } else if (playerSideInfo?.isWater) {
      // Still draw water even in tile grid mode
      drawWaterSegment(ctx, 0.3, 1, nearLeftOffset, nearRightOffset, width, height, timeRef.current, enableAnimations, 0);
    }

    // Wall options (same as render options)
    const nearWallOptions = nearRenderOptions;

    // Draw immediate side walls based on tiles beside player (not in front)
    if (playerSideInfo?.leftWall) {
      if (settings.useTileGrid && tilesLoaded) {
        // Use endDepth=1 to match the non-tile version (0.3 → 1.0)
        drawWallWithTexture(tileContext, 'left', 0.3, -1, 1, 1);
      } else {
        drawCorridorWall(ctx, 'left', 0.3, 1, width, height, timeRef.current, enableAnimations, nearWallOptions);
      }
      // Fill zBuffer for immediate left wall with interpolated depth
      const nearProj = getProjection(width, height, 0.3, -1);
      const farProj = getProjection(width, height, 1, -1);
      fillZBufferInterpolated(zBuffer, nearProj.x, farProj.x, 0.3, 1);
    }
    if (playerSideInfo?.rightWall) {
      if (settings.useTileGrid && tilesLoaded) {
        // Use endDepth=1 to match the non-tile version (0.3 → 1.0)
        drawWallWithTexture(tileContext, 'right', 0.3, -1, 1, 1);
      } else {
        drawCorridorWall(ctx, 'right', 0.3, 1, width, height, timeRef.current, enableAnimations, nearWallOptions);
      }
      // Fill zBuffer for immediate right wall with interpolated depth
      const nearProj = getProjection(width, height, 0.3, 1);
      const farProj = getProjection(width, height, 1, 1);
      fillZBufferInterpolated(zBuffer, nearProj.x, farProj.x, 0.3, 1);
    }

    // Draw stairs in immediate area (row 0 - beside player)
    if (playerSideInfo?.stairsPositions && playerSideInfo.stairsPositions.length > 0) {
      for (const stairs of playerSideInfo.stairsPositions) {
        renderStairs(
          ctx,
          width,
          height,
          0.5, // Very close depth
          stairs.offset,
          stairs.direction,
          timeRef.current,
          enableAnimations
        );
      }
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

      // Redistribute entities at same distance ONLY if they have the same/similar offsets
      // (i.e., they're stacked on top of each other)
      for (const [, entities] of entitiesByDistance) {
        if (entities.length > 1) {
          // Check if entities already have different offsets (spread > 0.5 means they're intentionally placed)
          const offsets = entities.map(e => e.offset);
          const minOffset = Math.min(...offsets);
          const maxOffset = Math.max(...offsets);
          const spread = maxOffset - minOffset;

          // Only redistribute if entities are clustered together (spread < 0.5)
          if (spread < 0.5) {
            const availableSlots = Math.max(3, Math.floor(7 - entities[0].distance * 0.5));
            const slotWidth = availableSlots > 1 ? 4 / (availableSlots - 1) : 0;

            for (let i = 0; i < entities.length; i++) {
              const slot = i % availableSlots;
              const centerSlot = (availableSlots - 1) / 2;
              entities[i].offset = (slot - centerSlot) * slotWidth * 0.8;
            }
          }
        }
      }

      // Draw all entities (with z-buffer occlusion culling)
      for (const entity of sortedEntities) {
        renderEntity(ctx, entity, width, height, timeRef.current, zBuffer, debugShowOccluded);
      }
    }

    // Draw torches from data (after walls and entities, before atmospheric effects)
    if (view.torches && view.torches.length > 0 && view.facing) {
      drawTorches(
        ctx,
        view.torches,
        width,
        height,
        timeRef.current,
        enableAnimations,
        view.facing.dx,
        view.facing.dy
      );
    }

    // Draw atmospheric effects
    drawFogWisps(ctx, width, height, timeRef.current, enableAnimations);
    drawDustParticles(ctx, width, height, timeRef.current, enableAnimations);

    // Apply biome color tint overlay (subtle)
    if (settings.biome !== 'dungeon') {
      const tintColor = biome.ambientTint;
      ctx.globalCompositeOperation = 'overlay';
      ctx.fillStyle = rgbToString(tintColor, 0.08 * settings.brightness);
      ctx.fillRect(0, 0, width, height);
      ctx.globalCompositeOperation = 'source-over';
    }

    // Draw compass at top center
    const facingDir = view.facing;
    if (facingDir) {
      drawCompass(ctx, width, facingDir.dx, facingDir.dy, timeRef.current, enableAnimations);
    }

    // Draw debug wireframe overlay (on top of everything)
    if (debugShowWireframe) {
      drawDebugWireframe(ctx, width, height, maxDepth, corridorInfo);
    }

    // Restore canvas state (undo animation transforms)
    ctx.restore();

    // Continue animation loop
    if (enableAnimations) {
      animationRef.current = requestAnimationFrame(render);
    }
  }, [view, width, height, enableAnimations, renderEntity, biome, settings, tilesLoaded, debugShowOccluded, debugShowWireframe, drawDebugWireframe, onCorridorInfo]);

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

  // Detect view changes and trigger animations
  useEffect(() => {
    if (!view || !view.rows) return;

    const anim = animationState.current;
    const currentRowsJson = JSON.stringify(view.rows.map(row => row?.map(t => `${t.x},${t.y}`)));
    const { dx, dy } = view.facing;

    // Check for turn (facing changed)
    if (dx !== anim.prevFacingDx || dy !== anim.prevFacingDy) {
      // Calculate turn direction using cross product
      const cross = anim.prevFacingDx * dy - anim.prevFacingDy * dx;

      if (cross !== 0 && enableAnimations) {
        // Start turn animation
        // cross > 0 = turning right, cross < 0 = turning left
        anim.turnProgress = 0;
        anim.turnXOffset = cross > 0 ? width * 0.3 : -width * 0.3;
      }

      anim.prevFacingDx = dx;
      anim.prevFacingDy = dy;
    }
    // Check for movement (rows changed but facing same)
    else if (currentRowsJson !== anim.prevRowsJson && anim.prevRowsJson !== '') {
      if (enableAnimations) {
        // Start movement animation
        anim.moveProgress = 0;
        anim.moveDepthOffset = 1; // One tile depth offset
        anim.bobPhase = 0;
      }
    }

    anim.prevRowsJson = currentRowsJson;
  }, [view, width, enableAnimations]);

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
