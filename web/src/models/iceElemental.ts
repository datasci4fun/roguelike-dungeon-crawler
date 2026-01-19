/**
 * Ice Elemental Enemy Model
 * Canonical design based on bestiary appearance.
 *
 * Canonical appearance from bestiary:
 * "Crystalline humanoid form of blue ice. Frost radiates outward in visible waves."
 */

import * as THREE from 'three';
import { createMaterial } from './materials';

export interface IceElementalOptions {
  scale?: number;
}

export function createIceElemental(options: IceElementalOptions = {}): THREE.Group {
  const { scale = 1.0 } = options;

  const group = new THREE.Group();
  const s = scale * 1.1;

  // === MATERIALS ===
  // Core ice (deep blue, slightly glowing)
  const coreIceMaterial = new THREE.MeshStandardMaterial({
    color: 0x4488cc,
    roughness: 0.1,
    metalness: 0.2,
    emissive: 0x224466,
    emissiveIntensity: 0.4,
    transparent: true,
    opacity: 0.9,
  });

  // Crystal ice (light blue, translucent)
  const crystalMaterial = new THREE.MeshStandardMaterial({
    color: 0x88ccff,
    roughness: 0.05,
    metalness: 0.3,
    emissive: 0x4488aa,
    emissiveIntensity: 0.3,
    transparent: true,
    opacity: 0.8,
  });

  // Surface ice (white-blue frost)
  const frostMaterial = new THREE.MeshStandardMaterial({
    color: 0xcceeff,
    roughness: 0.3,
    metalness: 0.1,
    emissive: 0x88aacc,
    emissiveIntensity: 0.2,
    transparent: true,
    opacity: 0.85,
  });

  // Glowing eyes
  const eyeMaterial = new THREE.MeshStandardMaterial({
    color: 0xaaeeff,
    roughness: 0.1,
    metalness: 0.0,
    emissive: 0x66ccff,
    emissiveIntensity: 1.5,
  });

  // Frost wave material (very translucent)
  const frostWaveMaterial = new THREE.MeshStandardMaterial({
    color: 0xccffff,
    roughness: 0.2,
    metalness: 0.0,
    emissive: 0x88ddff,
    emissiveIntensity: 0.3,
    transparent: true,
    opacity: 0.4,
  });

  // Snow/frost ground
  const snowMaterial = new THREE.MeshStandardMaterial({
    color: 0xeeffff,
    roughness: 0.8,
    metalness: 0.0,
  });

  // === HEAD (crystalline) ===
  // Core
  const headCore = new THREE.Mesh(
    new THREE.BoxGeometry(0.1 * s, 0.12 * s, 0.1 * s),
    coreIceMaterial
  );
  headCore.position.y = 0.72 * s;
  group.add(headCore);

  // Crystal facets on head
  const headCrystal1 = new THREE.Mesh(
    new THREE.BoxGeometry(0.06 * s, 0.08 * s, 0.06 * s),
    crystalMaterial
  );
  headCrystal1.position.set(-0.05 * s, 0.78 * s, 0.03 * s);
  headCrystal1.rotation.y = 0.4;
  headCrystal1.rotation.z = 0.3;
  group.add(headCrystal1);

  const headCrystal2 = new THREE.Mesh(
    new THREE.BoxGeometry(0.05 * s, 0.1 * s, 0.05 * s),
    crystalMaterial
  );
  headCrystal2.position.set(0.04 * s, 0.8 * s, -0.02 * s);
  headCrystal2.rotation.y = -0.3;
  headCrystal2.rotation.z = -0.25;
  group.add(headCrystal2);

  const headCrystal3 = new THREE.Mesh(
    new THREE.BoxGeometry(0.04 * s, 0.07 * s, 0.04 * s),
    crystalMaterial
  );
  headCrystal3.position.set(0, 0.82 * s, 0.04 * s);
  headCrystal3.rotation.x = -0.2;
  group.add(headCrystal3);

  // Glowing eyes
  const eyeGeo = new THREE.SphereGeometry(0.02 * s, 6, 4);

  const leftEye = new THREE.Mesh(eyeGeo, eyeMaterial);
  leftEye.position.set(-0.03 * s, 0.74 * s, 0.06 * s);
  group.add(leftEye);

  const rightEye = new THREE.Mesh(eyeGeo, eyeMaterial);
  rightEye.position.set(0.03 * s, 0.74 * s, 0.06 * s);
  group.add(rightEye);

  // === TORSO (crystalline form) ===
  // Core body
  const torsoCore = new THREE.Mesh(
    new THREE.BoxGeometry(0.16 * s, 0.24 * s, 0.12 * s),
    coreIceMaterial
  );
  torsoCore.position.y = 0.5 * s;
  group.add(torsoCore);

  // Outer crystalline layer
  const torsoOuter = new THREE.Mesh(
    new THREE.BoxGeometry(0.2 * s, 0.26 * s, 0.14 * s),
    crystalMaterial
  );
  torsoOuter.position.y = 0.5 * s;
  group.add(torsoOuter);

  // Crystal protrusions on torso
  const crystalSpikes = [
    { x: -0.1, y: 0.58, z: 0.06, rx: 0, ry: 0.3, rz: 0.4, h: 0.08 },
    { x: 0.12, y: 0.56, z: 0.04, rx: 0, ry: -0.2, rz: -0.35, h: 0.07 },
    { x: -0.08, y: 0.44, z: 0.08, rx: 0.2, ry: 0, rz: 0.3, h: 0.06 },
    { x: 0.1, y: 0.46, z: 0.06, rx: 0.1, ry: 0, rz: -0.25, h: 0.065 },
    { x: 0, y: 0.54, z: -0.08, rx: -0.3, ry: 0, rz: 0, h: 0.09 },
  ];

  crystalSpikes.forEach((spike) => {
    const crystal = new THREE.Mesh(
      new THREE.BoxGeometry(0.03 * s, spike.h * s, 0.03 * s),
      frostMaterial
    );
    crystal.position.set(spike.x * s, spike.y * s, spike.z * s);
    crystal.rotation.set(spike.rx, spike.ry, spike.rz);
    group.add(crystal);
  });

  // === SHOULDERS ===
  const shoulderGeo = new THREE.BoxGeometry(0.08 * s, 0.08 * s, 0.08 * s);

  const leftShoulder = new THREE.Mesh(shoulderGeo, crystalMaterial);
  leftShoulder.position.set(-0.14 * s, 0.58 * s, 0);
  leftShoulder.rotation.y = 0.4;
  group.add(leftShoulder);

  const rightShoulder = new THREE.Mesh(shoulderGeo, crystalMaterial);
  rightShoulder.position.set(0.14 * s, 0.58 * s, 0);
  rightShoulder.rotation.y = -0.4;
  group.add(rightShoulder);

  // === ARMS (crystalline) ===
  // Left arm
  const leftUpperArm = new THREE.Mesh(
    new THREE.BoxGeometry(0.06 * s, 0.14 * s, 0.05 * s),
    coreIceMaterial
  );
  leftUpperArm.position.set(-0.16 * s, 0.48 * s, 0);
  leftUpperArm.rotation.z = 0.2;
  group.add(leftUpperArm);

  const leftLowerArm = new THREE.Mesh(
    new THREE.BoxGeometry(0.05 * s, 0.14 * s, 0.045 * s),
    crystalMaterial
  );
  leftLowerArm.position.set(-0.2 * s, 0.34 * s, 0.02 * s);
  leftLowerArm.rotation.z = 0.15;
  group.add(leftLowerArm);

  // Left hand (crystal cluster)
  const leftHand = new THREE.Mesh(
    new THREE.BoxGeometry(0.05 * s, 0.06 * s, 0.04 * s),
    frostMaterial
  );
  leftHand.position.set(-0.22 * s, 0.24 * s, 0.03 * s);
  group.add(leftHand);

  // Ice shard fingers
  const fingerGeo = new THREE.BoxGeometry(0.015 * s, 0.05 * s, 0.015 * s);
  for (let i = 0; i < 4; i++) {
    const finger = new THREE.Mesh(fingerGeo, frostMaterial);
    finger.position.set((-0.21 - i * 0.015) * s, 0.18 * s, 0.04 * s);
    finger.rotation.z = 0.1 * i;
    finger.rotation.x = -0.2;
    group.add(finger);
  }

  // Right arm
  const rightUpperArm = new THREE.Mesh(
    new THREE.BoxGeometry(0.06 * s, 0.14 * s, 0.05 * s),
    coreIceMaterial
  );
  rightUpperArm.position.set(0.16 * s, 0.48 * s, 0);
  rightUpperArm.rotation.z = -0.2;
  group.add(rightUpperArm);

  const rightLowerArm = new THREE.Mesh(
    new THREE.BoxGeometry(0.05 * s, 0.14 * s, 0.045 * s),
    crystalMaterial
  );
  rightLowerArm.position.set(0.2 * s, 0.34 * s, 0.02 * s);
  rightLowerArm.rotation.z = -0.15;
  group.add(rightLowerArm);

  // Right hand
  const rightHand = new THREE.Mesh(
    new THREE.BoxGeometry(0.05 * s, 0.06 * s, 0.04 * s),
    frostMaterial
  );
  rightHand.position.set(0.22 * s, 0.24 * s, 0.03 * s);
  group.add(rightHand);

  // Right fingers
  for (let i = 0; i < 4; i++) {
    const finger = new THREE.Mesh(fingerGeo, frostMaterial);
    finger.position.set((0.21 + i * 0.015) * s, 0.18 * s, 0.04 * s);
    finger.rotation.z = -0.1 * i;
    finger.rotation.x = -0.2;
    group.add(finger);
  }

  // === LOWER BODY (ice pillar) ===
  const lowerCore = new THREE.Mesh(
    new THREE.BoxGeometry(0.14 * s, 0.2 * s, 0.1 * s),
    coreIceMaterial
  );
  lowerCore.position.y = 0.26 * s;
  group.add(lowerCore);

  const lowerOuter = new THREE.Mesh(
    new THREE.BoxGeometry(0.16 * s, 0.22 * s, 0.12 * s),
    crystalMaterial
  );
  lowerOuter.position.y = 0.26 * s;
  group.add(lowerOuter);

  // === FROST WAVES (canonical - "Frost radiates outward in visible waves") ===
  const waveGeo = new THREE.CylinderGeometry(0.2 * s, 0.25 * s, 0.02 * s, 8);

  const frostWave1 = new THREE.Mesh(waveGeo, frostWaveMaterial);
  frostWave1.position.y = 0.15 * s;
  group.add(frostWave1);

  const frostWave2 = new THREE.Mesh(
    new THREE.CylinderGeometry(0.28 * s, 0.35 * s, 0.015 * s, 8),
    frostWaveMaterial
  );
  frostWave2.position.y = 0.1 * s;
  group.add(frostWave2);

  const frostWave3 = new THREE.Mesh(
    new THREE.CylinderGeometry(0.38 * s, 0.45 * s, 0.01 * s, 8),
    frostWaveMaterial
  );
  frostWave3.position.y = 0.06 * s;
  group.add(frostWave3);

  // === BASE (frozen ground) ===
  const iceBase = new THREE.Mesh(
    new THREE.CylinderGeometry(0.15 * s, 0.18 * s, 0.06 * s, 8),
    coreIceMaterial
  );
  iceBase.position.y = 0.12 * s;
  group.add(iceBase);

  // Snow/frost ground
  const snowBase = new THREE.Mesh(
    new THREE.CylinderGeometry(0.22 * s, 0.28 * s, 0.02 * s, 8),
    snowMaterial
  );
  snowBase.position.y = 0.04 * s;
  group.add(snowBase);

  // Small ice crystals around base
  const smallCrystalGeo = new THREE.BoxGeometry(0.025 * s, 0.06 * s, 0.025 * s);
  const crystalPositions = [
    { x: 0.15, z: 0.08, ry: 0.5 },
    { x: -0.12, z: 0.1, ry: -0.3 },
    { x: 0.08, z: -0.14, ry: 0.8 },
    { x: -0.16, z: -0.06, ry: -0.6 },
    { x: 0.18, z: -0.04, ry: 0.2 },
    { x: -0.06, z: 0.16, ry: -0.9 },
  ];

  crystalPositions.forEach((pos) => {
    const crystal = new THREE.Mesh(smallCrystalGeo, frostMaterial);
    crystal.position.set(pos.x * s, 0.08 * s, pos.z * s);
    crystal.rotation.y = pos.ry;
    crystal.rotation.z = 0.2;
    group.add(crystal);
  });

  return group;
}

export const ICE_ELEMENTAL_META = {
  id: 'ice-elemental',
  name: 'Ice Elemental',
  category: 'enemy' as const,
  description: 'Crystalline humanoid form of blue ice. Frost radiates outward in visible waves - canonical design',
  defaultScale: 1.0,
  boundingBox: { x: 0.9, y: 0.9, z: 0.9 },
  tags: ['elemental', 'ice', 'frost', 'enemy', 'creature', 'monster', 'canonical'],
  enemyName: 'Ice Elemental',
};
