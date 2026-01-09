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
import { drawSkybox } from './skybox';

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
 * Simplified: only tracks walls at offsets -1, 0, +1 (matching 3D renderer)
 */
export interface CorridorInfoEntry {
  depth: number;
  leftWall: boolean;
  rightWall: boolean;
  frontWall: string | null;
  isWater: boolean;
}

interface FirstPersonRendererProps {
  view: FirstPersonView | undefined;
  width?: number;
  height?: number;
  enableAnimations?: boolean;
  settings?: Partial<RenderSettings>;
  debugShowOccluded?: boolean; // Show red silhouettes for occluded entities
  debugShowWireframe?: boolean; // Show yellow wireframe for walls/corridors
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
    for (let d = 1; d <= Math.max(0, maxDepth - 1); d++) {
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

      // Draw front wall if present (orange) — match renderer span (prev-depth opening)
      if (info.frontWall) {
        const prevInfo = corridorInfo[Math.max(0, depth - 1)] || { leftWall: false, rightWall: false, frontWall: null };
        const frontLeft = prevInfo.leftWall ? -1 : -2;
        const frontRight = prevInfo.rightWall ? 1 : 2;
        const frontL = getProjection(canvasWidth, canvasHeight, depth, frontLeft);
        const frontR = getProjection(canvasWidth, canvasHeight, depth, frontRight);

        ctx.strokeStyle = '#ff8800';
        ctx.lineWidth = 3;
        ctx.setLineDash([]);
        ctx.beginPath();
        ctx.moveTo(frontL.x, frontL.wallTop);
        ctx.lineTo(frontR.x, frontR.wallTop);
        ctx.lineTo(frontR.x, frontR.wallBottom);
        ctx.lineTo(frontL.x, frontL.wallBottom);
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

    // Draw parallax skybox (distant background)
    // Shows through gaps in the dungeon and creates depth illusion
    if (view?.facing) {
      // Calculate extra parallax offset during turn animation
      // Skybox moves slower than foreground (inverted direction)
      const skyboxParallaxOffset = xOffset * 0.5;
      drawSkybox(ctx, {
        biome: settings.biome,
        facingDx: view.facing.dx,
        facingDy: view.facing.dy,
        canvasWidth: width,
        canvasHeight: height,
        brightness: settings.brightness,
        extraParallaxOffset: skyboxParallaxOffset,
      });
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

    // Simple offset getter - trust server's offset field directly
    const getOffset = (tile: { offset?: number }) => tile.offset ?? 0;

    // Find the corridor configuration at each depth
    // Simplified: only check walls at offsets -1, 0, +1 (matching 3D renderer approach)
    const corridorInfo: {
      leftWall: boolean;
      rightWall: boolean;
      hasFloor: boolean;
      frontWall: string | null;
      // If center is blocked, span of the contiguous wall-run that includes offset 0.
      // (Used to draw far/room end-walls wider than just -1..+1)
      frontSpan: { left: number; right: number } | null;
      // Visibility flags (true = currently visible in LOS, false = memory/explored)
      leftWallVisible: boolean;
      rightWallVisible: boolean;
      frontWallVisible: boolean;
      floorVisible: boolean;
      // Track hidden secret door positions for visual hints
      secretPositions: { offset: number }[];
      // Track if floor is water for water reflections
      isWater: boolean;
      // Track stairs positions
      stairsPositions: { offset: number; direction: 'down' | 'up' }[];
    }[] = [];

    for (let d = 0; d < maxDepth; d++) {
      const row = rows[d];
      if (!row || row.length === 0) {
        // Empty row means no tile data - treat as fog boundary (no walls rendered)
        corridorInfo.push({
          leftWall: false,
          rightWall: false,
          hasFloor: false,
          frontWall: null,
          frontSpan: null,
          leftWallVisible: false,
          rightWallVisible: false,
          frontWallVisible: false,
          floorVisible: false,
          secretPositions: [],
          isWater: false,
          stairsPositions: [],
        });
        continue;
      }

      // Simple wall detection: check only offsets -1, 0, +1
      let leftWall = false;
      let rightWall = false;
      let frontWall: string | null = null;
      let centerIsWall = false;
      let centerTile: typeof row[0] | undefined;
      let leftWallVisible = false;
      let rightWallVisible = false;
      let frontWallVisible = false;
      let floorVisible = false;
      const secretPositions: { offset: number }[] = [];
      const stairsPositions: { offset: number; direction: 'down' | 'up' }[] = [];
      // Track visible wall/door offsets so we can expand the front wall span when center is blocked
      const wallOffsets = new Set<number>();

      for (const tile of row) {
        // IMPORTANT: Don't skip explored-but-not-visible tiles.
        // They contain tile_actual for persistent geometry memory.
        const isVisible = tile.visible === true;

        const offset = getOffset(tile);
        const tileChar = tile.tile_actual ?? tile.tile;

        // Check for walls at corridor positions
        if (isWallTile(tileChar) || isDoorTile(tileChar)) {
          wallOffsets.add(offset);
          if (offset === -1) leftWall = true;
          else if (offset === 1) rightWall = true;
          else if (offset === 0) {
            frontWall = tileChar;
            centerIsWall = true;
          }
          if (offset === -1 && isVisible) leftWallVisible = true;
          if (offset === 1 && isVisible) rightWallVisible = true;
          if (offset === 0 && isVisible) frontWallVisible = true;
        }

        // Track center tile for water/floor detection
        if (offset === 0) {
          centerTile = tile;
          if (isVisible) floorVisible = true;
        }

        // Secret hints
        // Keep hints LOS-only (don’t leak hints through memory fog)
        if (isVisible && tile.has_secret) {
          secretPositions.push({ offset });
        }

        // Stairs
        // Use tile_actual so stairs remain as discovered geometry under fog
        if (isStairsDown(tileChar)) {
          stairsPositions.push({ offset, direction: 'down' });
        } else if (isStairsUp(tileChar)) {
          stairsPositions.push({ offset, direction: 'up' });
        }
      }

      // Check if center tile is water
      const centerChar = centerTile ? (centerTile.tile_actual ?? centerTile.tile) : '';
      const isWater = centerTile && !centerIsWall && isWaterTile(centerChar);

      // If center is blocked, compute how wide the *actual* contiguous wall run is at this depth.
      // This fixes cases where the far wall is wider than the corridor (-5..+5 etc) but we only drew -1..+1.
      let frontSpan: { left: number; right: number } | null = null;
      if (frontWall) {
        let left = 0;
        let right = 0;
        while (wallOffsets.has(left - 1)) left -= 1;
        while (wallOffsets.has(right + 1)) right += 1;
        frontSpan = { left, right };
      }

      corridorInfo.push({
        leftWall,
        rightWall,
        hasFloor: !centerIsWall,
        frontWall,
        frontSpan,
        leftWallVisible,
        rightWallVisible,
        frontWallVisible,
        floorVisible,
        secretPositions,
        isWater: isWater || false,
        stairsPositions,
      });
    }

    // Call debug callback with corridor info (for snapshots)
    if (onCorridorInfo) {
      const exportableInfo: CorridorInfoEntry[] = corridorInfo.map((info, depth) => ({
        depth,
        leftWall: info.leftWall,
        rightWall: info.rightWall,
        frontWall: info.frontWall,
        isWater: info.isWater,
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

    // How bright explored-but-not-visible geometry stays (static map memory).
    // 1.0 = same as visible, lower = dimmer “remembered” geometry.
    const MEMORY_GEOMETRY_BRIGHTNESS = 0.65;

    // If tile grid mode is enabled, draw the entire floor/ceiling grid first
    if (settings.useTileGrid && tilesLoaded) {
      // Render whatever the server sent (no hard-coded 8)
      const maxVisibleDepth = Math.max(0, maxDepth - 1);

      // Expand bounds to cover the offsets actually present in view.rows
      let leftBound = 0;
      let rightBound = 0;
      for (const row of rows) {
        if (!row) continue;
        for (const t of row) {
          const o = getOffset(t);
          if (o < leftBound) leftBound = o;
          if (o > rightBound) rightBound = o;
        }
      }
      // Safety clamp (optional): prevents huge grids if depth is very large
      const MAX_GRID_HALF_WIDTH = 25;
      leftBound = Math.max(leftBound, -MAX_GRID_HALF_WIDTH);
      rightBound = Math.min(rightBound, MAX_GRID_HALF_WIDTH);

      // Draw ceiling grid (from back to front) - start at depth 0 for player position
      drawCeilingGrid(tileContext, 0, maxVisibleDepth, leftBound, rightBound);

      // Draw floor grid (from back to front) - start at depth 0 for player position
      drawFloorGrid(tileContext, 0, maxVisibleDepth, leftBound, rightBound);
    }

    // Draw from back to front (painter's algorithm)
    // Start from row 1 (depth 1) since row 0 is beside player, not in front
    for (let d = maxDepth - 1; d >= 1; d--) {
      const depth = d;
      const nextDepth = d + 1;
      const info = corridorInfo[d];

      // Simplified: floor/ceiling width based on current depth's walls only
      // If there's a wall at ±1, floor/ceiling stops there; otherwise extends to ±2
      const leftOffset = info.leftWall ? -1 : -2;
      const rightOffset = info.rightWall ? 1 : 2;

      // Floor/ceiling should persist as “known geometry” even when not currently visible.
      const floorBrightness =
        settings.brightness * (info.floorVisible ? 1 : MEMORY_GEOMETRY_BRIGHTNESS);
      const renderOptions = { biome, brightness: floorBrightness };

      // Only draw floor/ceiling when this slice actually has floor (center isn't blocked).
      if (info.hasFloor) {
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
      }

      // Walls persist as “known geometry” too, but dim if not currently visible.
      const leftWallOptions = {
        biome,
        brightness: settings.brightness * (info.leftWallVisible ? 1 : MEMORY_GEOMETRY_BRIGHTNESS),
      };
      const rightWallOptions = {
        biome,
        brightness: settings.brightness * (info.rightWallVisible ? 1 : MEMORY_GEOMETRY_BRIGHTNESS),
      };
      const frontWallOptions = {
        biome,
        brightness: settings.brightness * (info.frontWallVisible ? 1 : MEMORY_GEOMETRY_BRIGHTNESS),
      };

      // Draw left corridor wall if there's a wall on the left
      if (info.leftWall) {
        if (settings.useTileGrid && tilesLoaded) {
          drawWallWithTexture({ ...tileContext, brightness: leftWallOptions.brightness }, 'left', depth, -1, 1);
        } else {
          drawCorridorWall(ctx, 'left', depth, nextDepth, width, height, timeRef.current, enableAnimations, leftWallOptions);
        }
        // Fill zBuffer for left corridor wall with interpolated depth
        const nearProj = getProjection(width, height, depth, -1);
        const farProj = getProjection(width, height, nextDepth, -1);
        fillZBufferInterpolated(zBuffer, nearProj.x, farProj.x, depth, nextDepth);
      }

      // Draw right corridor wall if there's a wall on the right
      if (info.rightWall) {
        if (settings.useTileGrid && tilesLoaded) {
          drawWallWithTexture({ ...tileContext, brightness: rightWallOptions.brightness }, 'right', depth, -1, 1);
        } else {
          drawCorridorWall(ctx, 'right', depth, nextDepth, width, height, timeRef.current, enableAnimations, rightWallOptions);
        }
        // Fill zBuffer for right corridor wall with interpolated depth
        const nearProj = getProjection(width, height, depth, 1);
        const farProj = getProjection(width, height, nextDepth, 1);
        fillZBufferInterpolated(zBuffer, nearProj.x, farProj.x, depth, nextDepth);
      }

      // Draw front wall if this depth is blocked (center blocked)
      if (info.frontWall) {
        const span = info.frontSpan;
        // For textured/tile-grid walls, keep integer offsets so we draw discrete tiles.
        // For non-tile mode, expand to half-tile edges so a 1-tile wall has non-zero width.
        const drawLeft =
          (settings.useTileGrid && tilesLoaded)
            ? (span ? span.left : -1)
            : (span ? span.left - 0.5 : -1);
        const drawRight =
          (settings.useTileGrid && tilesLoaded)
            ? (span ? span.right : 1)
            : (span ? span.right + 0.5 : 1); 

        if (settings.useTileGrid && tilesLoaded) {
          drawWallWithTexture({ ...tileContext, brightness: frontWallOptions.brightness }, 'front', depth, drawLeft, drawRight);
        } else {
          drawFrontWall(ctx, depth, drawLeft, drawRight, width, height, info.frontWall, timeRef.current, enableAnimations, frontWallOptions);
        }
        // Fill zBuffer for front wall
        // Always use half-tile edges for z-buffer coverage (prevents “1-column wall” when span is a single tile)
        const zLeft = span ? span.left - 0.5 : drawLeft;
        const zRight = span ? span.right + 0.5 : drawRight;
        const leftProj = getProjection(width, height, depth, zLeft);
        const rightProj = getProjection(width, height, depth, zRight);
        fillZBuffer(zBuffer, leftProj.x, rightProj.x, depth);
      }
      // Note: Partial wall heuristics (walls at offsets beyond ±1) removed
      // Simplified renderer only renders walls at offsets -1, 0, +1 (matching 3D renderer)

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
    const nearWallOptions = {
      biome,
      brightness: settings.brightness * (playerSideInfo?.floorVisible ? 1 : 0.65),
    };

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
