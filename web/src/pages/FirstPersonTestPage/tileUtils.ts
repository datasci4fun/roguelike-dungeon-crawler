/**
 * Tile generation utilities for test scenarios
 */
import type { FirstPersonTile } from '../../hooks/useGameSocket';

// Generate mock tile data
export function generateTile(tile: string, x: number, y: number, visible: boolean = true): FirstPersonTile {
  return {
    tile,
    x,
    y,
    visible,
    walkable: tile === '.' || tile === '>' || tile === '<',
    has_entity: false,
  };
}

// Generate a row of tiles
export function generateRow(
  depth: number,
  leftWall: boolean,
  rightWall: boolean,
  centerTile: string = '.',
  floorTile: string = '.'
): FirstPersonTile[] {
  const width = Math.max(3, Math.floor(depth * 1.5) + 1);
  const halfWidth = Math.floor(width / 2);
  const row: FirstPersonTile[] = [];

  for (let i = -halfWidth; i <= halfWidth; i++) {
    let tile = floorTile;
    if (i === -halfWidth && leftWall) tile = '#';
    else if (i === halfWidth && rightWall) tile = '#';
    else if (i === 0 && centerTile !== '.') tile = centerTile;

    row.push(generateTile(tile, i, depth));
  }

  return row;
}

// Generate a water row (uses '=' for water tiles)
export function generateWaterRow(
  depth: number,
  leftWall: boolean,
  rightWall: boolean
): FirstPersonTile[] {
  return generateRow(depth, leftWall, rightWall, '=', '=');
}

// Generate an open cavern row (no side walls, wider)
export function generateCavernRow(depth: number, floorTile: string = '.'): FirstPersonTile[] {
  const width = Math.max(5, Math.floor(depth * 2) + 3);
  const halfWidth = Math.floor(width / 2);
  const row: FirstPersonTile[] = [];
  for (let i = -halfWidth; i <= halfWidth; i++) {
    row.push(generateTile(floorTile, i, depth));
  }
  return row;
}
