/**
 * Treasure Chest Model
 * A simple wooden treasure chest with metal bands and gold lock
 */

import * as THREE from 'three';
import { createMaterial } from './materials';

export interface TreasureChestOptions {
  scale?: number;
  open?: boolean;
}

export function createTreasureChest(options: TreasureChestOptions = {}): THREE.Group {
  const { scale = 1.0, open = false } = options;

  const group = new THREE.Group();

  // Materials
  const woodMaterial = createMaterial('darkWood');
  const bronzeMaterial = createMaterial('bronze');
  const goldMaterial = createMaterial('gold');
  const ironMaterial = createMaterial('iron');

  // Dimensions
  const w = 0.8 * scale;  // width (X)
  const d = 0.5 * scale;  // depth (Z)
  const h = 0.35 * scale; // base height (Y)
  const lidH = 0.15 * scale; // lid height

  // === BASE BOX ===
  const base = new THREE.Mesh(
    new THREE.BoxGeometry(w, h, d),
    woodMaterial
  );
  base.position.y = h / 2;
  group.add(base);

  // === LID (simple box for now) ===
  const lid = new THREE.Mesh(
    new THREE.BoxGeometry(w, lidH, d),
    woodMaterial
  );

  if (open) {
    // Lid tilted back
    lid.position.set(0, h + lidH / 2 + 0.1 * scale, -d / 2 + 0.05 * scale);
    lid.rotation.x = -Math.PI / 3;
  } else {
    // Lid closed on top
    lid.position.y = h + lidH / 2;
  }
  group.add(lid);

  // === HORIZONTAL BANDS (bronze) ===
  const bandH = 0.04 * scale;
  const bandT = 0.02 * scale;

  // Front band
  const frontBand = new THREE.Mesh(
    new THREE.BoxGeometry(w + 0.01, bandH, bandT),
    bronzeMaterial
  );
  frontBand.position.set(0, h * 0.4, d / 2);
  group.add(frontBand);

  // Back band
  const backBand = frontBand.clone();
  backBand.position.z = -d / 2;
  group.add(backBand);

  // === CORNER BRACKETS (iron) ===
  const bracketSize = 0.05 * scale;
  const bracketGeo = new THREE.BoxGeometry(bracketSize, bracketSize, bracketSize);

  const corners = [
    [-w/2, 0, d/2], [w/2, 0, d/2],
    [-w/2, 0, -d/2], [w/2, 0, -d/2]
  ];
  corners.forEach(([x, y, z]) => {
    const bracket = new THREE.Mesh(bracketGeo, ironMaterial);
    bracket.position.set(x, y + bracketSize/2, z);
    group.add(bracket);
  });

  // === LOCK PLATE (gold) ===
  const lockPlate = new THREE.Mesh(
    new THREE.BoxGeometry(0.1 * scale, 0.08 * scale, 0.015 * scale),
    goldMaterial
  );
  lockPlate.position.set(0, h * 0.7, d / 2 + 0.008 * scale);
  group.add(lockPlate);

  // Keyhole
  const keyhole = new THREE.Mesh(
    new THREE.BoxGeometry(0.02 * scale, 0.04 * scale, 0.02 * scale),
    new THREE.MeshStandardMaterial({ color: 0x111111 })
  );
  keyhole.position.set(0, h * 0.68, d / 2 + 0.015 * scale);
  group.add(keyhole);

  return group;
}

export const TREASURE_CHEST_META = {
  id: 'treasure_chest',
  name: 'Treasure Chest',
  category: 'interactive' as const,
  description: 'A wooden treasure chest with bronze bands and gold lock',
  defaultScale: 1.0,
  boundingBox: { x: 0.8, y: 0.5, z: 0.5 },
  tags: ['chest', 'treasure', 'container', 'loot', 'interactive', 'wood', 'gold'],
};
