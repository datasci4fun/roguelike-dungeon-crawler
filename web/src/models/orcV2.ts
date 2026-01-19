/**
 * Orc Enemy Model v2
 * Canonical design based on bestiary appearance.
 *
 * Canonical appearance from bestiary:
 * "Large muscular humanoid with gray-green skin, tusks, and crude armor."
 */

import * as THREE from 'three';
import { createMaterial } from './materials';

export interface OrcV2Options {
  scale?: number;
  hasWeapon?: boolean;
}

export function createOrcV2(options: OrcV2Options = {}): THREE.Group {
  const { scale = 1.0, hasWeapon = true } = options;

  const group = new THREE.Group();
  const s = scale * 1.25; // Large humanoid

  // === MATERIALS ===
  // Gray-green skin (canonical - more gray than v1)
  const skinMaterial = new THREE.MeshStandardMaterial({
    color: 0x5a6a5a, // Gray-green
    roughness: 0.8,
    metalness: 0.0,
  });

  const darkSkinMaterial = new THREE.MeshStandardMaterial({
    color: 0x4a5a4a,
    roughness: 0.85,
    metalness: 0.0,
  });

  // Angry eyes
  const eyeMaterial = new THREE.MeshStandardMaterial({
    color: 0xcc4400,
    roughness: 0.3,
    emissive: 0x661100,
    emissiveIntensity: 0.4,
  });

  // Ivory tusks
  const tuskMaterial = new THREE.MeshStandardMaterial({
    color: 0xf5f0e0,
    roughness: 0.4,
    metalness: 0.0,
  });

  // Crude armor materials
  const crudeIronMaterial = new THREE.MeshStandardMaterial({
    color: 0x3a3a3a,
    roughness: 0.7,
    metalness: 0.5,
  });

  const leatherMaterial = createMaterial('leather');
  const rustMaterial = createMaterial('rust');

  // === HEAD ===
  // Broad, brutish head
  const head = new THREE.Mesh(
    new THREE.BoxGeometry(0.16 * s, 0.14 * s, 0.14 * s),
    skinMaterial
  );
  head.position.y = 0.74 * s;
  group.add(head);

  // Heavy brow ridge
  const brow = new THREE.Mesh(
    new THREE.BoxGeometry(0.18 * s, 0.04 * s, 0.08 * s),
    darkSkinMaterial
  );
  brow.position.set(0, 0.8 * s, 0.05 * s);
  group.add(brow);

  // Strong jaw
  const jaw = new THREE.Mesh(
    new THREE.BoxGeometry(0.14 * s, 0.05 * s, 0.1 * s),
    skinMaterial
  );
  jaw.position.set(0, 0.66 * s, 0.04 * s);
  group.add(jaw);

  // Tusks - prominent lower tusks
  const tuskGeo = new THREE.BoxGeometry(0.02 * s, 0.06 * s, 0.02 * s);

  const leftTusk = new THREE.Mesh(tuskGeo, tuskMaterial);
  leftTusk.position.set(-0.045 * s, 0.7 * s, 0.1 * s);
  leftTusk.rotation.x = -0.2;
  leftTusk.rotation.z = 0.15;
  group.add(leftTusk);

  const rightTusk = new THREE.Mesh(tuskGeo, tuskMaterial);
  rightTusk.position.set(0.045 * s, 0.7 * s, 0.1 * s);
  rightTusk.rotation.x = -0.2;
  rightTusk.rotation.z = -0.15;
  group.add(rightTusk);

  // Eyes - deep set, angry
  const eyeGeo = new THREE.SphereGeometry(0.02 * s, 6, 4);

  const leftEye = new THREE.Mesh(eyeGeo, eyeMaterial);
  leftEye.position.set(-0.045 * s, 0.76 * s, 0.08 * s);
  group.add(leftEye);

  const rightEye = new THREE.Mesh(eyeGeo, eyeMaterial);
  rightEye.position.set(0.045 * s, 0.76 * s, 0.08 * s);
  group.add(rightEye);

  // Pointed ears
  const earGeo = new THREE.BoxGeometry(0.03 * s, 0.06 * s, 0.02 * s);

  const leftEar = new THREE.Mesh(earGeo, skinMaterial);
  leftEar.position.set(-0.1 * s, 0.76 * s, 0);
  leftEar.rotation.z = 0.5;
  group.add(leftEar);

  const rightEar = new THREE.Mesh(earGeo, skinMaterial);
  rightEar.position.set(0.1 * s, 0.76 * s, 0);
  rightEar.rotation.z = -0.5;
  group.add(rightEar);

  // === NECK ===
  const neck = new THREE.Mesh(
    new THREE.BoxGeometry(0.1 * s, 0.06 * s, 0.08 * s),
    skinMaterial
  );
  neck.position.set(0, 0.64 * s, 0);
  group.add(neck);

  // === TORSO (large, muscular) ===
  const torso = new THREE.Mesh(
    new THREE.BoxGeometry(0.32 * s, 0.28 * s, 0.18 * s),
    skinMaterial
  );
  torso.position.y = 0.48 * s;
  group.add(torso);

  // Chest muscles
  const chestGeo = new THREE.BoxGeometry(0.12 * s, 0.1 * s, 0.04 * s);

  const leftChest = new THREE.Mesh(chestGeo, skinMaterial);
  leftChest.position.set(-0.08 * s, 0.54 * s, 0.1 * s);
  group.add(leftChest);

  const rightChest = new THREE.Mesh(chestGeo, skinMaterial);
  rightChest.position.set(0.08 * s, 0.54 * s, 0.1 * s);
  group.add(rightChest);

  // Belly
  const belly = new THREE.Mesh(
    new THREE.BoxGeometry(0.26 * s, 0.12 * s, 0.16 * s),
    skinMaterial
  );
  belly.position.set(0, 0.34 * s, 0.02 * s);
  group.add(belly);

  // === CRUDE ARMOR ===
  // Mismatched shoulder plates
  const leftShoulderPlate = new THREE.Mesh(
    new THREE.BoxGeometry(0.12 * s, 0.05 * s, 0.1 * s),
    crudeIronMaterial
  );
  leftShoulderPlate.position.set(-0.2 * s, 0.6 * s, 0);
  leftShoulderPlate.rotation.z = 0.3;
  group.add(leftShoulderPlate);

  // Right shoulder has scrappy leather instead
  const rightShoulderPad = new THREE.Mesh(
    new THREE.BoxGeometry(0.1 * s, 0.04 * s, 0.08 * s),
    leatherMaterial
  );
  rightShoulderPad.position.set(0.2 * s, 0.58 * s, 0);
  rightShoulderPad.rotation.z = -0.25;
  group.add(rightShoulderPad);

  // Crude chest guard (dented, partial)
  const chestGuard = new THREE.Mesh(
    new THREE.BoxGeometry(0.2 * s, 0.12 * s, 0.04 * s),
    rustMaterial
  );
  chestGuard.position.set(-0.04 * s, 0.5 * s, 0.12 * s);
  chestGuard.rotation.z = 0.05;
  group.add(chestGuard);

  // Leather straps holding armor
  const strapGeo = new THREE.BoxGeometry(0.03 * s, 0.2 * s, 0.02 * s);

  const leftStrap = new THREE.Mesh(strapGeo, leatherMaterial);
  leftStrap.position.set(-0.1 * s, 0.5 * s, 0.13 * s);
  leftStrap.rotation.z = 0.15;
  group.add(leftStrap);

  const rightStrap = new THREE.Mesh(strapGeo, leatherMaterial);
  rightStrap.position.set(0.08 * s, 0.5 * s, 0.13 * s);
  rightStrap.rotation.z = -0.1;
  group.add(rightStrap);

  // Belt with crude buckle
  const belt = new THREE.Mesh(
    new THREE.BoxGeometry(0.28 * s, 0.05 * s, 0.18 * s),
    leatherMaterial
  );
  belt.position.set(0, 0.28 * s, 0);
  group.add(belt);

  const buckle = new THREE.Mesh(
    new THREE.BoxGeometry(0.05 * s, 0.04 * s, 0.02 * s),
    crudeIronMaterial
  );
  buckle.position.set(0, 0.28 * s, 0.1 * s);
  group.add(buckle);

  // === ARMS (thick, muscular) ===
  // Left arm
  const leftUpperArm = new THREE.Mesh(
    new THREE.BoxGeometry(0.1 * s, 0.16 * s, 0.09 * s),
    skinMaterial
  );
  leftUpperArm.position.set(-0.22 * s, 0.48 * s, 0);
  leftUpperArm.rotation.z = 0.15;
  group.add(leftUpperArm);

  const leftForearm = new THREE.Mesh(
    new THREE.BoxGeometry(0.08 * s, 0.14 * s, 0.07 * s),
    skinMaterial
  );
  leftForearm.position.set(-0.26 * s, 0.32 * s, 0.02 * s);
  group.add(leftForearm);

  // Left wrist guard (crude)
  const leftWristGuard = new THREE.Mesh(
    new THREE.BoxGeometry(0.09 * s, 0.05 * s, 0.08 * s),
    leatherMaterial
  );
  leftWristGuard.position.set(-0.26 * s, 0.28 * s, 0.02 * s);
  group.add(leftWristGuard);

  const leftHand = new THREE.Mesh(
    new THREE.BoxGeometry(0.06 * s, 0.06 * s, 0.04 * s),
    darkSkinMaterial
  );
  leftHand.position.set(-0.26 * s, 0.22 * s, 0.02 * s);
  group.add(leftHand);

  // Right arm (weapon arm)
  const rightUpperArm = new THREE.Mesh(
    new THREE.BoxGeometry(0.1 * s, 0.16 * s, 0.09 * s),
    skinMaterial
  );
  rightUpperArm.position.set(0.22 * s, 0.48 * s, 0);
  rightUpperArm.rotation.z = -0.2;
  group.add(rightUpperArm);

  const rightForearm = new THREE.Mesh(
    new THREE.BoxGeometry(0.08 * s, 0.14 * s, 0.07 * s),
    skinMaterial
  );
  rightForearm.position.set(0.28 * s, 0.34 * s, 0.04 * s);
  rightForearm.rotation.z = -0.15;
  group.add(rightForearm);

  const rightHand = new THREE.Mesh(
    new THREE.BoxGeometry(0.06 * s, 0.06 * s, 0.04 * s),
    darkSkinMaterial
  );
  rightHand.position.set(0.32 * s, 0.24 * s, 0.06 * s);
  group.add(rightHand);

  // === LEGS (sturdy) ===
  // Left leg
  const leftThigh = new THREE.Mesh(
    new THREE.BoxGeometry(0.1 * s, 0.14 * s, 0.09 * s),
    skinMaterial
  );
  leftThigh.position.set(-0.1 * s, 0.18 * s, 0);
  group.add(leftThigh);

  const leftShin = new THREE.Mesh(
    new THREE.BoxGeometry(0.08 * s, 0.12 * s, 0.07 * s),
    skinMaterial
  );
  leftShin.position.set(-0.1 * s, 0.06 * s, 0);
  group.add(leftShin);

  // Right leg
  const rightThigh = new THREE.Mesh(
    new THREE.BoxGeometry(0.1 * s, 0.14 * s, 0.09 * s),
    skinMaterial
  );
  rightThigh.position.set(0.1 * s, 0.18 * s, 0);
  group.add(rightThigh);

  const rightShin = new THREE.Mesh(
    new THREE.BoxGeometry(0.08 * s, 0.12 * s, 0.07 * s),
    skinMaterial
  );
  rightShin.position.set(0.1 * s, 0.06 * s, 0);
  group.add(rightShin);

  // Crude boots (mismatched)
  const leftBoot = new THREE.Mesh(
    new THREE.BoxGeometry(0.08 * s, 0.05 * s, 0.12 * s),
    leatherMaterial
  );
  leftBoot.position.set(-0.1 * s, 0.01 * s, 0.02 * s);
  group.add(leftBoot);

  const rightBoot = new THREE.Mesh(
    new THREE.BoxGeometry(0.09 * s, 0.04 * s, 0.11 * s),
    createMaterial('darkWood') // Different material - crude/mismatched
  );
  rightBoot.position.set(0.1 * s, 0.01 * s, 0.02 * s);
  group.add(rightBoot);

  // === WEAPON (crude club/mace) ===
  if (hasWeapon) {
    // Heavy wooden handle
    const handle = new THREE.Mesh(
      new THREE.BoxGeometry(0.04 * s, 0.4 * s, 0.04 * s),
      createMaterial('oldWood')
    );
    handle.position.set(0.38 * s, 0.38 * s, 0.08 * s);
    handle.rotation.z = -0.2;
    group.add(handle);

    // Crude mace head (iron wrapped)
    const maceHead = new THREE.Mesh(
      new THREE.BoxGeometry(0.1 * s, 0.1 * s, 0.1 * s),
      crudeIronMaterial
    );
    maceHead.position.set(0.44 * s, 0.56 * s, 0.1 * s);
    maceHead.rotation.z = -0.2;
    maceHead.rotation.y = 0.4;
    group.add(maceHead);

    // Iron bands on mace
    const bandGeo = new THREE.BoxGeometry(0.12 * s, 0.02 * s, 0.02 * s);

    const band1 = new THREE.Mesh(bandGeo, rustMaterial);
    band1.position.set(0.44 * s, 0.54 * s, 0.14 * s);
    band1.rotation.z = -0.2;
    group.add(band1);

    const band2 = new THREE.Mesh(bandGeo, rustMaterial);
    band2.position.set(0.44 * s, 0.58 * s, 0.14 * s);
    band2.rotation.z = -0.2;
    group.add(band2);
  }

  return group;
}

export const ORC_V2_META = {
  id: 'orc-v2',
  name: 'Orc v2',
  category: 'enemy' as const,
  description: 'Large muscular humanoid with gray-green skin, tusks, and crude armor - canonical design',
  defaultScale: 1.0,
  boundingBox: { x: 0.8, y: 0.95, z: 0.4 },
  tags: ['orc', 'enemy', 'creature', 'monster', 'humanoid', 'warrior', 'canonical'],
  enemyName: 'Orc',
  version: 2,
  isActive: true,
  baseModelId: 'orc',
};
