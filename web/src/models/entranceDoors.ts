/**
 * Entrance Doors Model
 * Massive double doors with iron bands and ring handles
 */

import * as THREE from 'three';
import { createMaterial } from './materials';

export interface EntranceDoorsOptions {
  scale?: number;
  rotation?: number;
  doorColor?: number;
  metalColor?: number;
}

export function createEntranceDoors(options: EntranceDoorsOptions = {}): THREE.Group {
  const {
    scale = 1.0,
    doorColor,
    metalColor,
  } = options;

  const TILE_SIZE = 1.0;
  const WALL_HEIGHT = 2.5;

  const group = new THREE.Group();

  // Door frame/panel material
  const frameMaterial = doorColor
    ? new THREE.MeshStandardMaterial({ color: doorColor, roughness: 0.8, metalness: 0.2 })
    : createMaterial('darkWood');

  // Iron band material
  const bandMaterial = metalColor
    ? new THREE.MeshStandardMaterial({ color: metalColor, roughness: 0.4, metalness: 0.8 })
    : createMaterial('iron');

  // Left door panel
  const doorGeometry = new THREE.BoxGeometry(
    TILE_SIZE * 0.45 * scale,
    WALL_HEIGHT * 0.9 * scale,
    0.1
  );
  const leftDoor = new THREE.Mesh(doorGeometry, frameMaterial);
  leftDoor.position.set(-TILE_SIZE * 0.25 * scale, WALL_HEIGHT * 0.45 * scale, 0);
  group.add(leftDoor);

  // Right door panel
  const rightDoor = new THREE.Mesh(doorGeometry, frameMaterial);
  rightDoor.position.set(TILE_SIZE * 0.25 * scale, WALL_HEIGHT * 0.45 * scale, 0);
  group.add(rightDoor);

  // Iron bands across doors
  const bandGeometry = new THREE.BoxGeometry(TILE_SIZE * 0.9 * scale, 0.1, 0.15);
  for (let i = 0; i < 3; i++) {
    const band = new THREE.Mesh(bandGeometry, bandMaterial);
    band.position.set(0, (0.3 + i * 0.8) * WALL_HEIGHT * scale, 0.05);
    group.add(band);
  }

  // Large ring handles
  const ringGeometry = new THREE.TorusGeometry(0.1 * scale, 0.02 * scale, 8, 16);

  const leftRing = new THREE.Mesh(ringGeometry, bandMaterial);
  leftRing.position.set(-TILE_SIZE * 0.15 * scale, WALL_HEIGHT * 0.4 * scale, 0.1);
  leftRing.rotation.x = Math.PI / 2;
  group.add(leftRing);

  const rightRing = new THREE.Mesh(ringGeometry, bandMaterial);
  rightRing.position.set(TILE_SIZE * 0.15 * scale, WALL_HEIGHT * 0.4 * scale, 0.1);
  rightRing.rotation.x = Math.PI / 2;
  group.add(rightRing);

  return group;
}

export const ENTRANCE_DOORS_META = {
  id: 'entrance_doors',
  name: 'Entrance Doors',
  category: 'structure' as const,
  description: 'Massive double doors with iron bands and ring handles',
  defaultScale: 1.0,
  boundingBox: { x: 1.0, y: 2.5, z: 0.15 },
  tags: ['door', 'entrance', 'barrier'],
};
