/**
 * Assassin Enemy Model
 * Canonical design based on bestiary appearance.
 *
 * Canonical appearance from bestiary:
 * "Lithe figure in dark leather, face hidden behind a mask. Dual-wields curved daggers."
 */

import * as THREE from 'three';
import { createMaterial } from './materials';

export interface AssassinOptions {
  scale?: number;
}

export function createAssassin(options: AssassinOptions = {}): THREE.Group {
  const { scale = 1.0 } = options;

  const group = new THREE.Group();
  const s = scale;

  // === MATERIALS ===
  // Dark leather (canonical)
  const leatherMaterial = createMaterial('leather');

  const darkLeatherMaterial = new THREE.MeshStandardMaterial({
    color: 0x1a1a1a,
    roughness: 0.75,
    metalness: 0.1,
  });

  // Skin (minimal exposure)
  const skinMaterial = new THREE.MeshStandardMaterial({
    color: 0x8a7a6a,
    roughness: 0.8,
    metalness: 0.0,
  });

  // Mask (canonical - "face hidden behind a mask")
  const maskMaterial = new THREE.MeshStandardMaterial({
    color: 0x2a2a2a,
    roughness: 0.5,
    metalness: 0.2,
  });

  // Eyes visible through mask
  const eyeMaterial = new THREE.MeshStandardMaterial({
    color: 0x444444,
    roughness: 0.4,
    metalness: 0.0,
  });

  // Steel daggers
  const steelMaterial = createMaterial('steel');

  // === HEAD ===
  const head = new THREE.Mesh(
    new THREE.BoxGeometry(0.09 * s, 0.11 * s, 0.09 * s),
    skinMaterial
  );
  head.position.y = 0.7 * s;
  group.add(head);

  // Mask (canonical - covers face)
  const mask = new THREE.Mesh(
    new THREE.BoxGeometry(0.1 * s, 0.08 * s, 0.05 * s),
    maskMaterial
  );
  mask.position.set(0, 0.68 * s, 0.04 * s);
  group.add(mask);

  // Eye slits in mask
  const eyeSlitGeo = new THREE.BoxGeometry(0.025 * s, 0.01 * s, 0.01 * s);

  const leftEyeSlit = new THREE.Mesh(eyeSlitGeo, eyeMaterial);
  leftEyeSlit.position.set(-0.025 * s, 0.7 * s, 0.07 * s);
  group.add(leftEyeSlit);

  const rightEyeSlit = new THREE.Mesh(eyeSlitGeo, eyeMaterial);
  rightEyeSlit.position.set(0.025 * s, 0.7 * s, 0.07 * s);
  group.add(rightEyeSlit);

  // Hood
  const hood = new THREE.Mesh(
    new THREE.BoxGeometry(0.12 * s, 0.1 * s, 0.11 * s),
    darkLeatherMaterial
  );
  hood.position.set(0, 0.72 * s, -0.01 * s);
  group.add(hood);

  // Hood peak
  const hoodPeak = new THREE.Mesh(
    new THREE.BoxGeometry(0.08 * s, 0.04 * s, 0.06 * s),
    darkLeatherMaterial
  );
  hoodPeak.position.set(0, 0.78 * s, 0.03 * s);
  group.add(hoodPeak);

  // === TORSO (lithe - canonical) ===
  const torso = new THREE.Mesh(
    new THREE.BoxGeometry(0.14 * s, 0.2 * s, 0.08 * s),
    darkLeatherMaterial
  );
  torso.position.y = 0.52 * s;
  group.add(torso);

  // Leather chest piece
  const chestPiece = new THREE.Mesh(
    new THREE.BoxGeometry(0.15 * s, 0.16 * s, 0.09 * s),
    leatherMaterial
  );
  chestPiece.position.set(0, 0.52 * s, 0.005 * s);
  group.add(chestPiece);

  // Bandolier (diagonal strap)
  const bandolier = new THREE.Mesh(
    new THREE.BoxGeometry(0.02 * s, 0.22 * s, 0.02 * s),
    leatherMaterial
  );
  bandolier.position.set(-0.04 * s, 0.52 * s, 0.05 * s);
  bandolier.rotation.z = 0.4;
  group.add(bandolier);

  // Small pouches on belt
  const pouchGeo = new THREE.BoxGeometry(0.025 * s, 0.03 * s, 0.02 * s);

  const pouch1 = new THREE.Mesh(pouchGeo, leatherMaterial);
  pouch1.position.set(-0.06 * s, 0.42 * s, 0.05 * s);
  group.add(pouch1);

  const pouch2 = new THREE.Mesh(pouchGeo, leatherMaterial);
  pouch2.position.set(0.06 * s, 0.42 * s, 0.05 * s);
  group.add(pouch2);

  // Belt
  const belt = new THREE.Mesh(
    new THREE.BoxGeometry(0.16 * s, 0.03 * s, 0.1 * s),
    leatherMaterial
  );
  belt.position.set(0, 0.42 * s, 0);
  group.add(belt);

  // Belt buckle
  const buckle = new THREE.Mesh(
    new THREE.BoxGeometry(0.025 * s, 0.025 * s, 0.01 * s),
    steelMaterial
  );
  buckle.position.set(0, 0.42 * s, 0.055 * s);
  group.add(buckle);

  // === LEGS (lithe) ===
  const thighGeo = new THREE.BoxGeometry(0.05 * s, 0.14 * s, 0.05 * s);
  const shinGeo = new THREE.BoxGeometry(0.04 * s, 0.14 * s, 0.04 * s);

  // Left leg
  const leftThigh = new THREE.Mesh(thighGeo, darkLeatherMaterial);
  leftThigh.position.set(-0.04 * s, 0.32 * s, 0);
  group.add(leftThigh);

  const leftShin = new THREE.Mesh(shinGeo, darkLeatherMaterial);
  leftShin.position.set(-0.04 * s, 0.18 * s, 0);
  group.add(leftShin);

  // Right leg
  const rightThigh = new THREE.Mesh(thighGeo, darkLeatherMaterial);
  rightThigh.position.set(0.04 * s, 0.32 * s, 0);
  group.add(rightThigh);

  const rightShin = new THREE.Mesh(shinGeo, darkLeatherMaterial);
  rightShin.position.set(0.04 * s, 0.18 * s, 0);
  group.add(rightShin);

  // Boots
  const bootGeo = new THREE.BoxGeometry(0.045 * s, 0.08 * s, 0.07 * s);

  const leftBoot = new THREE.Mesh(bootGeo, leatherMaterial);
  leftBoot.position.set(-0.04 * s, 0.08 * s, 0.01 * s);
  group.add(leftBoot);

  const rightBoot = new THREE.Mesh(bootGeo, leatherMaterial);
  rightBoot.position.set(0.04 * s, 0.08 * s, 0.01 * s);
  group.add(rightBoot);

  // Boot soles
  const soleGeo = new THREE.BoxGeometry(0.045 * s, 0.015 * s, 0.075 * s);

  const leftSole = new THREE.Mesh(soleGeo, darkLeatherMaterial);
  leftSole.position.set(-0.04 * s, 0.035 * s, 0.015 * s);
  group.add(leftSole);

  const rightSole = new THREE.Mesh(soleGeo, darkLeatherMaterial);
  rightSole.position.set(0.04 * s, 0.035 * s, 0.015 * s);
  group.add(rightSole);

  // === ARMS ===
  const upperArmGeo = new THREE.BoxGeometry(0.04 * s, 0.12 * s, 0.04 * s);
  const lowerArmGeo = new THREE.BoxGeometry(0.035 * s, 0.12 * s, 0.035 * s);

  // Left arm (holding dagger forward)
  const leftUpperArm = new THREE.Mesh(upperArmGeo, darkLeatherMaterial);
  leftUpperArm.position.set(-0.1 * s, 0.54 * s, 0.02 * s);
  leftUpperArm.rotation.z = 0.3;
  leftUpperArm.rotation.x = -0.3;
  group.add(leftUpperArm);

  const leftLowerArm = new THREE.Mesh(lowerArmGeo, darkLeatherMaterial);
  leftLowerArm.position.set(-0.14 * s, 0.44 * s, 0.08 * s);
  leftLowerArm.rotation.z = 0.2;
  leftLowerArm.rotation.x = -0.5;
  group.add(leftLowerArm);

  // Left glove
  const leftGlove = new THREE.Mesh(
    new THREE.BoxGeometry(0.035 * s, 0.04 * s, 0.03 * s),
    leatherMaterial
  );
  leftGlove.position.set(-0.16 * s, 0.36 * s, 0.14 * s);
  group.add(leftGlove);

  // Right arm (dagger ready)
  const rightUpperArm = new THREE.Mesh(upperArmGeo, darkLeatherMaterial);
  rightUpperArm.position.set(0.1 * s, 0.54 * s, 0);
  rightUpperArm.rotation.z = -0.25;
  rightUpperArm.rotation.x = -0.2;
  group.add(rightUpperArm);

  const rightLowerArm = new THREE.Mesh(lowerArmGeo, darkLeatherMaterial);
  rightLowerArm.position.set(0.14 * s, 0.44 * s, 0.06 * s);
  rightLowerArm.rotation.z = -0.15;
  rightLowerArm.rotation.x = -0.4;
  group.add(rightLowerArm);

  // Right glove
  const rightGlove = new THREE.Mesh(
    new THREE.BoxGeometry(0.035 * s, 0.04 * s, 0.03 * s),
    leatherMaterial
  );
  rightGlove.position.set(0.16 * s, 0.36 * s, 0.12 * s);
  group.add(rightGlove);

  // === DAGGERS (canonical - "Dual-wields curved daggers") ===
  // Left dagger
  const leftDaggerHandle = new THREE.Mesh(
    new THREE.BoxGeometry(0.015 * s, 0.06 * s, 0.015 * s),
    createMaterial('darkWood')
  );
  leftDaggerHandle.position.set(-0.17 * s, 0.34 * s, 0.18 * s);
  leftDaggerHandle.rotation.x = -0.8;
  leftDaggerHandle.rotation.z = 0.1;
  group.add(leftDaggerHandle);

  // Left dagger guard
  const leftDaggerGuard = new THREE.Mesh(
    new THREE.BoxGeometry(0.03 * s, 0.01 * s, 0.015 * s),
    steelMaterial
  );
  leftDaggerGuard.position.set(-0.17 * s, 0.36 * s, 0.21 * s);
  leftDaggerGuard.rotation.x = -0.8;
  group.add(leftDaggerGuard);

  // Left dagger blade (curved)
  const leftBlade = new THREE.Mesh(
    new THREE.BoxGeometry(0.015 * s, 0.14 * s, 0.008 * s),
    steelMaterial
  );
  leftBlade.position.set(-0.17 * s, 0.4 * s, 0.28 * s);
  leftBlade.rotation.x = -0.7;
  leftBlade.rotation.z = 0.15; // Slight curve effect
  group.add(leftBlade);

  // Left blade tip
  const leftBladeTip = new THREE.Mesh(
    new THREE.BoxGeometry(0.01 * s, 0.04 * s, 0.006 * s),
    steelMaterial
  );
  leftBladeTip.position.set(-0.165 * s, 0.44 * s, 0.34 * s);
  leftBladeTip.rotation.x = -0.6;
  leftBladeTip.rotation.z = 0.25;
  group.add(leftBladeTip);

  // Right dagger
  const rightDaggerHandle = new THREE.Mesh(
    new THREE.BoxGeometry(0.015 * s, 0.06 * s, 0.015 * s),
    createMaterial('darkWood')
  );
  rightDaggerHandle.position.set(0.17 * s, 0.34 * s, 0.16 * s);
  rightDaggerHandle.rotation.x = -0.7;
  rightDaggerHandle.rotation.z = -0.1;
  group.add(rightDaggerHandle);

  // Right dagger guard
  const rightDaggerGuard = new THREE.Mesh(
    new THREE.BoxGeometry(0.03 * s, 0.01 * s, 0.015 * s),
    steelMaterial
  );
  rightDaggerGuard.position.set(0.17 * s, 0.36 * s, 0.19 * s);
  rightDaggerGuard.rotation.x = -0.7;
  group.add(rightDaggerGuard);

  // Right dagger blade (curved)
  const rightBlade = new THREE.Mesh(
    new THREE.BoxGeometry(0.015 * s, 0.14 * s, 0.008 * s),
    steelMaterial
  );
  rightBlade.position.set(0.17 * s, 0.4 * s, 0.26 * s);
  rightBlade.rotation.x = -0.6;
  rightBlade.rotation.z = -0.15; // Slight curve effect
  group.add(rightBlade);

  // Right blade tip
  const rightBladeTip = new THREE.Mesh(
    new THREE.BoxGeometry(0.01 * s, 0.04 * s, 0.006 * s),
    steelMaterial
  );
  rightBladeTip.position.set(0.165 * s, 0.44 * s, 0.32 * s);
  rightBladeTip.rotation.x = -0.5;
  rightBladeTip.rotation.z = -0.25;
  group.add(rightBladeTip);

  // === CLOAK (flowing behind) ===
  const cloak = new THREE.Mesh(
    new THREE.BoxGeometry(0.16 * s, 0.35 * s, 0.03 * s),
    darkLeatherMaterial
  );
  cloak.position.set(0, 0.45 * s, -0.06 * s);
  cloak.rotation.x = 0.15;
  group.add(cloak);

  // Cloak bottom (tattered effect)
  const cloakBottom = new THREE.Mesh(
    new THREE.BoxGeometry(0.18 * s, 0.08 * s, 0.025 * s),
    darkLeatherMaterial
  );
  cloakBottom.position.set(0, 0.26 * s, -0.08 * s);
  cloakBottom.rotation.x = 0.2;
  group.add(cloakBottom);

  return group;
}

export const ASSASSIN_META = {
  id: 'assassin',
  name: 'Assassin',
  category: 'enemy' as const,
  description: 'Lithe figure in dark leather, face hidden behind a mask. Dual-wields curved daggers - canonical design',
  defaultScale: 1.0,
  boundingBox: { x: 0.4, y: 0.8, z: 0.4 },
  tags: ['assassin', 'rogue', 'stealth', 'enemy', 'creature', 'humanoid', 'canonical'],
  enemyName: 'Assassin',
};
