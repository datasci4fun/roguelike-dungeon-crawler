/**
 * BattleRenderer3D Constants
 *
 * All configuration values and static data for the battle renderer.
 */
import * as THREE from 'three';

// Arena dimensions
export const TILE_SIZE = 2;
export const WALL_HEIGHT = 2.5;
export const CAMERA_HEIGHT = 1.4;

// Battle fog (extended for visibility during overview)
export const BATTLE_FOG_NEAR = 4;
export const BATTLE_FOG_FAR = 25;

// Entity model scale (adjust to fit arena tiles)
export const ENTITY_MODEL_SCALE = 1.4;
export const ENTITY_MODEL_Y_OFFSET = 0.3;

// Hazard material properties (emissive glow)
export const HAZARD_EMISSIVE: Record<string, number> = {
  '~': 0xff3300, // Lava - orange glow
  '!': 0x44ff44, // Poison - green haze
  '\u2248': 0x3366aa, // Deep water - blue sheen
  '=': 0x88ddff, // Ice - cold tint
};

// Hazard floor colors (these override biome colors for special tiles)
export const HAZARD_FLOOR_COLORS: Record<string, number> = {
  '~': 0x442200, // Lava base
  '!': 0x224422, // Poison base
  '\u2248': 0x223344, // Water base
  '=': 0x445566, // Ice base
};

// Overview phase durations (ms)
export const PHASE_DURATIONS: Record<string, number> = {
  zoom_out: 800,
  pan_enemies: 1200,
  pan_player: 800,
  settle: 400,
};

export const PHASE_ORDER = ['zoom_out', 'pan_enemies', 'pan_player', 'settle', 'complete'] as const;

// Highlight colors for different actions
export const HIGHLIGHT_COLORS = {
  move: 0x44ff44,      // Green - valid movement
  attack: 0xff4444,    // Red - attack range
  ability: 0x4488ff,   // Blue - ability range
  selected: 0xffff44,  // Yellow - currently selected tile
};

// Attack/ability ranges (tiles from player)
export const ACTION_RANGES: Record<string, number> = {
  move: 1,
  attack: 1,
  ability1: 1,
  ability2: 2,
  ability3: 3,
  ability4: 2,
};

// v6.5.1 Performance: Shared geometry cache to avoid recreating geometries
let sharedGeometries: {
  floorPlane: THREE.PlaneGeometry;
  wallBox: THREE.BoxGeometry;
  highlightPlane: THREE.PlaneGeometry;
  telegraphPlane: THREE.PlaneGeometry;
} | null = null;

export function getSharedGeometries() {
  if (!sharedGeometries) {
    sharedGeometries = {
      floorPlane: new THREE.PlaneGeometry(TILE_SIZE, TILE_SIZE),
      wallBox: new THREE.BoxGeometry(TILE_SIZE, WALL_HEIGHT, TILE_SIZE),
      highlightPlane: new THREE.PlaneGeometry(TILE_SIZE * 0.9, TILE_SIZE * 0.9),
      telegraphPlane: new THREE.PlaneGeometry(TILE_SIZE * 0.9, TILE_SIZE * 0.9),
    };
  }
  return sharedGeometries;
}

// Convert RGB array to Three.js color
export function rgbToHex(rgb: [number, number, number]): number {
  return (rgb[0] << 16) | (rgb[1] << 8) | rgb[2];
}
