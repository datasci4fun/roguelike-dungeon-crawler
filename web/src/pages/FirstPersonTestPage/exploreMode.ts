/**
 * Explore mode - WASD navigation in a test dungeon
 */
import type { FirstPersonView, FirstPersonTile, FirstPersonEntity } from '../../hooks/useGameSocket';
import { FACING_MAP, type FacingDirection } from './types';

// Explore mode dungeon map (# = wall, . = floor, D = door)
export const EXPLORE_MAP: string[] = [
  '###############',
  '#.....#.......#',
  '#.###.#.#####.#',
  '#.#...#.#...#.#',
  '#.#.###.#.#.#.#',
  '#.#.....#.#...#',
  '#.#######.###.#',
  '#.........#...#',
  '#.#######.#.###',
  '#.#.....#.#...#',
  '#.#.###.#.###.#',
  '#...#.....#...#',
  '###############',
];

export const EXPLORE_START = { x: 1, y: 1 }; // Starting position

// Get tile at map position
export function getMapTile(x: number, y: number): string {
  if (y < 0 || y >= EXPLORE_MAP.length) return '#';
  const row = EXPLORE_MAP[y];
  if (x < 0 || x >= row.length) return '#';
  return row[x];
}

// Check if a position is walkable
export function isWalkable(x: number, y: number): boolean {
  const tile = getMapTile(x, y);
  return tile === '.' || tile === 'D';
}

// Generate first-person view from map position and facing
export function generateExploreView(
  camX: number,
  camY: number,
  facing: FacingDirection
): FirstPersonView {
  const dir = FACING_MAP[facing];
  const rows: FirstPersonTile[][] = [];
  const entities: FirstPersonEntity[] = [];

  // Generate view rows for depths 0-8
  for (let depth = 0; depth <= 8; depth++) {
    const row: FirstPersonTile[] = [];

    // Get world position at this depth
    const worldX = camX + dir.dx * depth;
    const worldY = camY + dir.dy * depth;

    // Sample tiles across the view width (-3 to +3)
    for (let offset = -3; offset <= 3; offset++) {
      // Calculate world position for this offset
      // Offset is perpendicular to facing direction
      let tileX: number, tileY: number;
      if (facing === 'north' || facing === 'south') {
        tileX = worldX + offset * (facing === 'north' ? 1 : -1);
        tileY = worldY;
      } else {
        tileX = worldX;
        tileY = worldY + offset * (facing === 'east' ? 1 : -1);
      }

      const tile = getMapTile(tileX, tileY);
      row.push({
        tile,
        x: offset,
        y: depth,
        visible: true,
        walkable: tile === '.' || tile === 'D',
        has_entity: false,
      });
    }

    rows.push(row);
  }

  return {
    rows,
    entities,
    facing: dir,
    depth: 8,
  };
}
