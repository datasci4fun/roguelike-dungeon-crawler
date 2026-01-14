/**
 * BattleRenderer3D Arena Builder
 *
 * Builds the 3D arena geometry including floor, walls, ceiling, and grid.
 */
import * as THREE from 'three';
import type { BattleState } from '../../types';
import type { BiomeTheme } from '../SceneRenderer/biomes';
import { TILE_SIZE, WALL_HEIGHT, HAZARD_EMISSIVE, HAZARD_FLOOR_COLORS, rgbToHex } from './constants';

/**
 * Add glowing effect for lava tiles
 */
function addLavaGlow(scene: THREE.Scene, x: number, z: number) {
  const glowGeometry = new THREE.PlaneGeometry(TILE_SIZE * 0.8, TILE_SIZE * 0.8);
  const glowMaterial = new THREE.MeshBasicMaterial({
    color: 0xff4400,
    transparent: true,
    opacity: 0.4,
  });

  const glow = new THREE.Mesh(glowGeometry, glowMaterial);
  glow.rotation.x = -Math.PI / 2;
  glow.position.set(x, 0.05, z);
  scene.add(glow);
}

/**
 * Build the arena geometry from battle tiles
 * Creates a complete dungeon room with surrounding walls and ceiling
 * Uses biome theme for consistent visuals with exploration mode
 */
export function buildArena(scene: THREE.Scene, battle: BattleState, biome: BiomeTheme) {
  const { arena_tiles, arena_width, arena_height } = battle;

  // Extend the environment beyond arena bounds for immersion
  const PADDING = 3; // Extra tiles around arena
  const CEILING_HEIGHT = 3.5;

  // Materials using biome colors
  const floorColor = rgbToHex(biome.floorColor);
  const wallColor = rgbToHex(biome.wallColor);
  const wallHighlight = rgbToHex(biome.wallHighlight);
  const ceilingColor = rgbToHex(biome.ceilingColor);
  const lightColor = rgbToHex(biome.lightColor);

  const stoneMaterial = new THREE.MeshLambertMaterial({ color: floorColor });
  const wallMaterial = new THREE.MeshLambertMaterial({ color: wallColor });
  const wallHighlightMaterial = new THREE.MeshLambertMaterial({ color: wallHighlight });
  const ceilingMaterial = new THREE.MeshLambertMaterial({ color: ceilingColor });

  // Build extended floor (stone tiles beyond arena)
  for (let y = -PADDING; y < arena_height + PADDING; y++) {
    for (let x = -PADDING; x < arena_width + PADDING; x++) {
      const worldX = (x - arena_width / 2) * TILE_SIZE;
      const worldZ = (y - arena_height / 2) * TILE_SIZE;

      // Check if inside arena bounds
      const inArena = x >= 0 && x < arena_width && y >= 0 && y < arena_height;

      if (inArena) {
        // Arena tile
        const tile = arena_tiles[y]?.[x] || '.';

        if (tile === '#') {
          // Wall inside arena - use highlight color for variety
          const wallGeometry = new THREE.BoxGeometry(TILE_SIZE, WALL_HEIGHT, TILE_SIZE);
          const wall = new THREE.Mesh(wallGeometry, wallHighlightMaterial);
          wall.position.set(worldX, WALL_HEIGHT / 2, worldZ);
          scene.add(wall);
        } else {
          // Floor tile
          const floorGeometry = new THREE.PlaneGeometry(TILE_SIZE, TILE_SIZE);
          const isHazard = tile in HAZARD_EMISSIVE;

          // Use hazard color if hazard tile, otherwise biome floor color
          const tileColor = isHazard ? (HAZARD_FLOOR_COLORS[tile] || floorColor) : floorColor;

          const floorMat = new THREE.MeshLambertMaterial({
            color: tileColor,
            emissive: isHazard ? HAZARD_EMISSIVE[tile] : 0x000000,
            emissiveIntensity: isHazard ? 0.5 : 0,
          });

          const floor = new THREE.Mesh(floorGeometry, floorMat);
          floor.rotation.x = -Math.PI / 2;
          floor.position.set(worldX, 0, worldZ);
          scene.add(floor);

          // Add hazard glow for lava
          if (tile === '~') {
            addLavaGlow(scene, worldX, worldZ);
          }
        }
      } else {
        // Outside arena - create surrounding dungeon structure
        const isEdge = x === -PADDING || x === arena_width + PADDING - 1 ||
                       y === -PADDING || y === arena_height + PADDING - 1;

        if (isEdge) {
          // Outer wall
          const wallGeometry = new THREE.BoxGeometry(TILE_SIZE, CEILING_HEIGHT, TILE_SIZE);
          const wall = new THREE.Mesh(wallGeometry, wallMaterial);
          wall.position.set(worldX, CEILING_HEIGHT / 2, worldZ);
          scene.add(wall);
        } else {
          // Stone floor outside arena
          const floorGeometry = new THREE.PlaneGeometry(TILE_SIZE, TILE_SIZE);
          const floor = new THREE.Mesh(floorGeometry, stoneMaterial);
          floor.rotation.x = -Math.PI / 2;
          floor.position.set(worldX, 0, worldZ);
          scene.add(floor);
        }
      }
    }
  }

  // Add ceiling over the entire area
  const ceilingWidth = (arena_width + PADDING * 2) * TILE_SIZE;
  const ceilingDepth = (arena_height + PADDING * 2) * TILE_SIZE;
  const ceilingGeometry = new THREE.PlaneGeometry(ceilingWidth, ceilingDepth);
  const ceiling = new THREE.Mesh(ceilingGeometry, ceilingMaterial);
  ceiling.rotation.x = Math.PI / 2;
  ceiling.position.set(0, CEILING_HEIGHT, 0);
  scene.add(ceiling);

  // Add some torches/lights around the arena for atmosphere (using biome light color)
  const torchPositions = [
    [-arena_width / 2 - 1, -arena_height / 2 - 1],
    [arena_width / 2 + 1, -arena_height / 2 - 1],
    [-arena_width / 2 - 1, arena_height / 2 + 1],
    [arena_width / 2 + 1, arena_height / 2 + 1],
  ];

  for (const [tx, tz] of torchPositions) {
    const torchLight = new THREE.PointLight(lightColor, 0.8, 12);
    torchLight.position.set(tx * TILE_SIZE, 2, tz * TILE_SIZE);
    scene.add(torchLight);

    // Torch visual (simple glowing sphere with biome color)
    const torchGeometry = new THREE.SphereGeometry(0.15, 8, 8);
    const torchMat = new THREE.MeshBasicMaterial({ color: lightColor });
    const torch = new THREE.Mesh(torchGeometry, torchMat);
    torch.position.set(tx * TILE_SIZE, 2, tz * TILE_SIZE);
    scene.add(torch);
  }
}

/**
 * Build grid overlay showing tile boundaries
 * Grid lines are drawn AROUND each tile (at tile edges, not centers)
 */
export function buildGridOverlay(group: THREE.Group, battle: BattleState) {
  const { arena_width, arena_height } = battle;

  const gridMaterial = new THREE.LineBasicMaterial({
    color: 0xffffff,
    transparent: true,
    opacity: 0.2,
  });

  // Half tile offset so grid lines are at tile EDGES, not centers
  const halfTile = TILE_SIZE / 2;

  // Horizontal lines (along X axis)
  for (let y = 0; y <= arena_height; y++) {
    // Grid line at the EDGE between tiles y-1 and y
    const worldZ = (y - arena_height / 2) * TILE_SIZE - halfTile;
    const startX = (-arena_width / 2) * TILE_SIZE - halfTile;
    const endX = (arena_width / 2) * TILE_SIZE - halfTile;

    const geometry = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(startX, 0.02, worldZ),
      new THREE.Vector3(endX, 0.02, worldZ),
    ]);
    const line = new THREE.Line(geometry, gridMaterial);
    group.add(line);
  }

  // Vertical lines (along Z axis)
  for (let x = 0; x <= arena_width; x++) {
    const worldX = (x - arena_width / 2) * TILE_SIZE - halfTile;
    const startZ = (-arena_height / 2) * TILE_SIZE - halfTile;
    const endZ = (arena_height / 2) * TILE_SIZE - halfTile;

    const geometry = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(worldX, 0.02, startZ),
      new THREE.Vector3(worldX, 0.02, endZ),
    ]);
    const line = new THREE.Line(geometry, gridMaterial);
    group.add(line);
  }
}
