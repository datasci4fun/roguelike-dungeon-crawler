/**
 * useSceneRenderer Hook
 *
 * Transforms game state from WebSocket into SceneFrame format
 * for the canvas-based scene renderer.
 */

import { useMemo } from 'react';
import type { SceneFrame, SceneTile, TileType } from './types';
import { RenderLayers } from './types';
import type { FullGameState } from '../../hooks/useGameSocket';

// Default tile size in pixels
const DEFAULT_TILE_SIZE = 32;

// Map backend tile characters to TileType
function mapTileType(char: string): TileType {
  switch (char) {
    case '#':
      return 'wall';
    case '.':
      return 'floor';
    case '+':
      return 'door';
    case '>':
      return 'stairs_down';
    case '<':
      return 'stairs_up';
    case '~':
      return 'water';
    default:
      return 'floor';
  }
}

/**
 * Transform game state into a renderable SceneFrame
 */
export function gameStateToSceneFrame(
  gameState: FullGameState | null,
  viewportWidth: number = 20,
  viewportHeight: number = 15,
  tileSize: number = DEFAULT_TILE_SIZE
): SceneFrame | null {
  if (!gameState?.dungeon || !gameState?.player) {
    return null;
  }

  const { dungeon, player, enemies = [], items = [] } = gameState;
  const { width, height } = dungeon;

  // Calculate viewport centered on player
  const halfVpW = Math.floor(viewportWidth / 2);
  const halfVpH = Math.floor(viewportHeight / 2);
  const viewportX = Math.max(0, Math.min(width - viewportWidth, player.x - halfVpW));
  const viewportY = Math.max(0, Math.min(height - viewportHeight, player.y - halfVpH));

  // Build tiles array
  // Note: Current game state doesn't include visibility data, so we treat all tiles as visible
  const tiles: SceneTile[] = [];
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const char = dungeon.tiles[y]?.[x] ?? '.';
      tiles.push({
        type: mapTileType(char),
        visible: true, // TODO: add FOV when backend supports it
        explored: true,
        bloodstain: false,
      });
    }
  }

  // Build entities array
  const entities: SceneFrame['entities'] = [];

  // Add player
  entities.push({
    id: 'player',
    kind: 'player',
    x: player.x,
    y: player.y,
    z: RenderLayers.ACTORS,
    visible: true,
    color: '#00FF00',
    symbol: '@',
    health: player.health,
    maxHealth: player.max_health,
    anchor: { x: 0.5, y: 1.0 },
  });

  // Add enemies
  enemies.forEach((enemy, index) => {
    entities.push({
      id: `enemy-${index}`,
      kind: enemy.is_elite ? 'boss' : 'enemy',
      x: enemy.x,
      y: enemy.y,
      z: enemy.is_elite ? RenderLayers.ACTORS + 1 : RenderLayers.ACTORS,
      visible: true,
      symbol: enemy.symbol || 'e',
      isElite: enemy.is_elite,
      health: enemy.health,
      maxHealth: enemy.max_health,
      anchor: { x: 0.5, y: 1.0 },
    });
  });

  // Add items
  items.forEach((item, index) => {
    entities.push({
      id: `item-${index}`,
      kind: 'item',
      x: item.x,
      y: item.y,
      z: RenderLayers.ITEMS,
      visible: true,
      symbol: item.symbol || '!',
      anchor: { x: 0.5, y: 0.5 },
    });
  });

  // Sort entities by z-order, then y (for painter's algorithm), then x
  entities.sort((a, b) => {
    if (a.z !== b.z) return a.z - b.z;
    if (a.y !== b.y) return a.y - b.y;
    return a.x - b.x;
  });

  // Build lighting array (1.0 for all - no FOV data in current state)
  const lighting: number[] = tiles.map(() => 1.0);

  return {
    width,
    height,
    tileSize,
    viewportX,
    viewportY,
    viewportWidth,
    viewportHeight,
    tiles,
    entities,
    lighting,
    theme: 'dungeon', // Default theme, backend doesn't provide this yet
    level: dungeon.level,
  };
}

/**
 * React hook to transform game state into SceneFrame
 */
export function useSceneFrame(
  gameState: FullGameState | null,
  viewportWidth?: number,
  viewportHeight?: number,
  tileSize?: number
): SceneFrame | null {
  return useMemo(
    () => gameStateToSceneFrame(gameState, viewportWidth, viewportHeight, tileSize),
    [gameState, viewportWidth, viewportHeight, tileSize]
  );
}
