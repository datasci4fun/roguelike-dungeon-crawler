/**
 * Orc Enemy Model
 * A large, brutish orc warrior with tusks and a battle axe
 */

import * as THREE from 'three';
import { createMaterial } from './materials';

export interface OrcOptions {
  scale?: number;
  hasAxe?: boolean;
}

export function createOrc(options: OrcOptions = {}): THREE.Group {
  const { scale = 1.0, hasAxe = true } = options;

  const group = new THREE.Group();

  // Materials
  const skinMaterial = new THREE.MeshStandardMaterial({
    color: 0x5a7a4a, // Orc green
    roughness: 0.75,
  });
  const darkSkinMaterial = new THREE.MeshStandardMaterial({
    color: 0x4a6a3a,
    roughness: 0.8,
  });
  const eyeMaterial = new THREE.MeshStandardMaterial({
    color: 0xff6600,
    emissive: 0x662200,
    emissiveIntensity: 0.3,
  });
  const tuskMaterial = new THREE.MeshStandardMaterial({
    color: 0xfffff0, // Ivory
    roughness: 0.4,
  });
  const leatherMaterial = createMaterial('leather');
  const ironMaterial = createMaterial('iron');

  const s = scale * 1.2; // Orcs are bigger

  // === HEAD ===
  const head = new THREE.Mesh(
    new THREE.SphereGeometry(0.14 * s, 8, 6),
    skinMaterial
  );
  head.position.y = 0.72 * s;
  head.scale.set(1, 0.9, 0.95);
  group.add(head);

  // Brow ridge (makes it look brutish)
  const brow = new THREE.Mesh(
    new THREE.BoxGeometry(0.18 * s, 0.04 * s, 0.1 * s),
    darkSkinMaterial
  );
  brow.position.set(0, 0.78 * s, 0.08 * s);
  group.add(brow);

  // Jaw (strong, jutting)
  const jaw = new THREE.Mesh(
    new THREE.BoxGeometry(0.12 * s, 0.06 * s, 0.1 * s),
    skinMaterial
  );
  jaw.position.set(0, 0.64 * s, 0.06 * s);
  group.add(jaw);

  // Tusks
  const tuskGeo = new THREE.ConeGeometry(0.015 * s, 0.06 * s, 4);

  const leftTusk = new THREE.Mesh(tuskGeo, tuskMaterial);
  leftTusk.position.set(-0.04 * s, 0.66 * s, 0.12 * s);
  leftTusk.rotation.x = -0.3;
  group.add(leftTusk);

  const rightTusk = new THREE.Mesh(tuskGeo, tuskMaterial);
  rightTusk.position.set(0.04 * s, 0.66 * s, 0.12 * s);
  rightTusk.rotation.x = -0.3;
  group.add(rightTusk);

  // Eyes (angry orange)
  const eyeGeo = new THREE.SphereGeometry(0.025 * s, 6, 4);

  const leftEye = new THREE.Mesh(eyeGeo, eyeMaterial);
  leftEye.position.set(-0.05 * s, 0.74 * s, 0.11 * s);
  group.add(leftEye);

  const rightEye = new THREE.Mesh(eyeGeo, eyeMaterial);
  rightEye.position.set(0.05 * s, 0.74 * s, 0.11 * s);
  group.add(rightEye);

  // Ears (pointed, swept back)
  const earGeo = new THREE.ConeGeometry(0.03 * s, 0.08 * s, 4);

  const leftEar = new THREE.Mesh(earGeo, skinMaterial);
  leftEar.position.set(-0.12 * s, 0.74 * s, 0);
  leftEar.rotation.z = Math.PI / 2.5;
  group.add(leftEar);

  const rightEar = new THREE.Mesh(earGeo, skinMaterial);
  rightEar.position.set(0.12 * s, 0.74 * s, 0);
  rightEar.rotation.z = -Math.PI / 2.5;
  group.add(rightEar);

  // === BODY (massive torso) ===
  const torso = new THREE.Mesh(
    new THREE.BoxGeometry(0.35 * s, 0.32 * s, 0.2 * s),
    skinMaterial
  );
  torso.position.y = 0.48 * s;
  group.add(torso);

  // Belly
  const belly = new THREE.Mesh(
    new THREE.BoxGeometry(0.28 * s, 0.15 * s, 0.18 * s),
    skinMaterial
  );
  belly.position.set(0, 0.34 * s, 0.02 * s);
  group.add(belly);

  // === ARMOR ===
  // Leather chest strap
  const chestStrap = new THREE.Mesh(
    new THREE.BoxGeometry(0.36 * s, 0.08 * s, 0.22 * s),
    leatherMaterial
  );
  chestStrap.position.set(0, 0.52 * s, 0);
  group.add(chestStrap);

  // Iron shoulder pad (left only - asymmetric)
  const shoulderPad = new THREE.Mesh(
    new THREE.BoxGeometry(0.12 * s, 0.06 * s, 0.1 * s),
    ironMaterial
  );
  shoulderPad.position.set(-0.22 * s, 0.58 * s, 0);
  shoulderPad.rotation.z = 0.3;
  group.add(shoulderPad);

  // Shoulder spike
  const spike = new THREE.Mesh(
    new THREE.ConeGeometry(0.02 * s, 0.06 * s, 4),
    ironMaterial
  );
  spike.position.set(-0.26 * s, 0.62 * s, 0);
  spike.rotation.z = Math.PI / 2;
  group.add(spike);

  // Belt
  const belt = new THREE.Mesh(
    new THREE.BoxGeometry(0.3 * s, 0.05 * s, 0.2 * s),
    leatherMaterial
  );
  belt.position.set(0, 0.28 * s, 0);
  group.add(belt);

  // Belt buckle
  const buckle = new THREE.Mesh(
    new THREE.BoxGeometry(0.06 * s, 0.04 * s, 0.02 * s),
    ironMaterial
  );
  buckle.position.set(0, 0.28 * s, 0.1 * s);
  group.add(buckle);

  // === ARMS (thick and muscular) ===
  const upperArmGeo = new THREE.BoxGeometry(0.1 * s, 0.18 * s, 0.09 * s);
  const lowerArmGeo = new THREE.BoxGeometry(0.08 * s, 0.16 * s, 0.07 * s);

  // Left arm
  const leftUpperArm = new THREE.Mesh(upperArmGeo, skinMaterial);
  leftUpperArm.position.set(-0.24 * s, 0.46 * s, 0);
  leftUpperArm.rotation.z = 0.2;
  group.add(leftUpperArm);

  const leftLowerArm = new THREE.Mesh(lowerArmGeo, skinMaterial);
  leftLowerArm.position.set(-0.28 * s, 0.3 * s, 0.04 * s);
  group.add(leftLowerArm);

  const leftHand = new THREE.Mesh(
    new THREE.BoxGeometry(0.06 * s, 0.05 * s, 0.04 * s),
    darkSkinMaterial
  );
  leftHand.position.set(-0.28 * s, 0.2 * s, 0.04 * s);
  group.add(leftHand);

  // Right arm
  const rightUpperArm = new THREE.Mesh(upperArmGeo, skinMaterial);
  rightUpperArm.position.set(0.24 * s, 0.46 * s, 0);
  rightUpperArm.rotation.z = -0.2;
  group.add(rightUpperArm);

  const rightLowerArm = new THREE.Mesh(lowerArmGeo, skinMaterial);
  rightLowerArm.position.set(0.28 * s, 0.3 * s, 0.04 * s);
  group.add(rightLowerArm);

  const rightHand = new THREE.Mesh(
    new THREE.BoxGeometry(0.06 * s, 0.05 * s, 0.04 * s),
    darkSkinMaterial
  );
  rightHand.position.set(0.28 * s, 0.2 * s, 0.04 * s);
  group.add(rightHand);

  // === LEGS (sturdy) ===
  const thighGeo = new THREE.BoxGeometry(0.1 * s, 0.16 * s, 0.09 * s);
  const shinGeo = new THREE.BoxGeometry(0.08 * s, 0.14 * s, 0.07 * s);

  // Left leg
  const leftThigh = new THREE.Mesh(thighGeo, skinMaterial);
  leftThigh.position.set(-0.1 * s, 0.16 * s, 0);
  group.add(leftThigh);

  const leftShin = new THREE.Mesh(shinGeo, skinMaterial);
  leftShin.position.set(-0.1 * s, 0.04 * s, 0);
  group.add(leftShin);

  // Right leg
  const rightThigh = new THREE.Mesh(thighGeo, skinMaterial);
  rightThigh.position.set(0.1 * s, 0.16 * s, 0);
  group.add(rightThigh);

  const rightShin = new THREE.Mesh(shinGeo, skinMaterial);
  rightShin.position.set(0.1 * s, 0.04 * s, 0);
  group.add(rightShin);

  // Feet (boots)
  const bootGeo = new THREE.BoxGeometry(0.08 * s, 0.04 * s, 0.12 * s);

  const leftBoot = new THREE.Mesh(bootGeo, leatherMaterial);
  leftBoot.position.set(-0.1 * s, 0.02 * s, 0.02 * s);
  group.add(leftBoot);

  const rightBoot = new THREE.Mesh(bootGeo, leatherMaterial);
  rightBoot.position.set(0.1 * s, 0.02 * s, 0.02 * s);
  group.add(rightBoot);

  // === BATTLE AXE ===
  if (hasAxe) {
    // Axe handle (long)
    const handle = new THREE.Mesh(
      new THREE.BoxGeometry(0.03 * s, 0.55 * s, 0.03 * s),
      createMaterial('darkWood')
    );
    handle.position.set(0.38 * s, 0.4 * s, 0);
    handle.rotation.z = -0.15;
    group.add(handle);

    // Axe head (double-sided)
    const axeHead = new THREE.Mesh(
      new THREE.BoxGeometry(0.18 * s, 0.12 * s, 0.025 * s),
      ironMaterial
    );
    axeHead.position.set(0.42 * s, 0.62 * s, 0);
    axeHead.rotation.z = -0.15;
    group.add(axeHead);

    // Axe blade edges (thinner boxes on sides)
    const bladeEdge = new THREE.BoxGeometry(0.02 * s, 0.14 * s, 0.02 * s);

    const leftBlade = new THREE.Mesh(bladeEdge, ironMaterial);
    leftBlade.position.set(0.34 * s, 0.62 * s, 0);
    leftBlade.rotation.z = -0.15;
    group.add(leftBlade);

    const rightBlade = new THREE.Mesh(bladeEdge, ironMaterial);
    rightBlade.position.set(0.5 * s, 0.62 * s, 0);
    rightBlade.rotation.z = -0.15;
    group.add(rightBlade);
  }

  return group;
}

export const ORC_META = {
  id: 'orc',
  name: 'Orc',
  category: 'enemy' as const,
  description: 'A large, brutish orc warrior with tusks and a battle axe',
  defaultScale: 1.0,
  boundingBox: { x: 0.7, y: 0.9, z: 0.4 },
  tags: ['orc', 'enemy', 'creature', 'monster', 'humanoid', 'warrior'],
  enemyName: 'Orc',
};
