/**
 * Goblin King Boss Model v2
 * Canonical design based on bestiary appearance.
 *
 * Canonical appearance from bestiary:
 * "Larger goblin wearing a crude iron crown. Carries a bloodstained mace and wears trophy bones."
 */

import * as THREE from 'three';
import { createMaterial } from './materials';

export interface GoblinKingV2Options {
  scale?: number;
}

export function createGoblinKingV2(options: GoblinKingV2Options = {}): THREE.Group {
  const { scale = 1.0 } = options;

  const group = new THREE.Group();
  const s = scale * 1.3; // Boss scale (larger goblin)

  // === MATERIALS ===
  // Goblin skin
  const skinMaterial = new THREE.MeshStandardMaterial({
    color: 0x4a7a3a,
    roughness: 0.75,
  });

  const darkSkinMaterial = new THREE.MeshStandardMaterial({
    color: 0x3a5a2a,
    roughness: 0.8,
  });

  // Menacing eyes
  const eyeMaterial = new THREE.MeshStandardMaterial({
    color: 0xff6600,
    emissive: 0xaa3300,
    emissiveIntensity: 0.6,
  });

  // Crude iron (canonical - crude iron crown)
  const ironMaterial = createMaterial('iron');
  const rustMaterial = new THREE.MeshStandardMaterial({
    color: 0x5a4030,
    roughness: 0.9,
    metalness: 0.3,
  });

  // Blood-stained material (canonical - bloodstained mace)
  const bloodMaterial = new THREE.MeshStandardMaterial({
    color: 0x8b0000,
    roughness: 0.6,
    metalness: 0.1,
    emissive: 0x330000,
    emissiveIntensity: 0.2,
  });

  // Trophy bones (canonical - wears trophy bones)
  const boneMaterial = createMaterial('bone');

  // Leather straps
  const leatherMaterial = createMaterial('leather');

  // Wood for mace handle
  const woodMaterial = createMaterial('darkWood');

  // === HEAD (larger than regular goblin) ===
  const head = new THREE.Mesh(
    new THREE.BoxGeometry(0.16 * s, 0.14 * s, 0.12 * s),
    skinMaterial
  );
  head.position.y = 0.72 * s;
  group.add(head);

  // Brow ridge (more pronounced, aggressive)
  const brow = new THREE.Mesh(
    new THREE.BoxGeometry(0.14 * s, 0.03 * s, 0.06 * s),
    darkSkinMaterial
  );
  brow.position.set(0, 0.78 * s, 0.04 * s);
  group.add(brow);

  // Menacing eyes
  const eyeGeo = new THREE.SphereGeometry(0.025 * s, 6, 4);

  const leftEye = new THREE.Mesh(eyeGeo, eyeMaterial);
  leftEye.position.set(-0.045 * s, 0.74 * s, 0.07 * s);
  group.add(leftEye);

  const rightEye = new THREE.Mesh(eyeGeo, eyeMaterial);
  rightEye.position.set(0.045 * s, 0.74 * s, 0.07 * s);
  group.add(rightEye);

  // Large warty nose
  const nose = new THREE.Mesh(
    new THREE.BoxGeometry(0.05 * s, 0.06 * s, 0.05 * s),
    darkSkinMaterial
  );
  nose.position.set(0, 0.68 * s, 0.08 * s);
  group.add(nose);

  // Pointed ears
  const earGeo = new THREE.BoxGeometry(0.04 * s, 0.12 * s, 0.03 * s);

  const leftEar = new THREE.Mesh(earGeo, skinMaterial);
  leftEar.position.set(-0.1 * s, 0.74 * s, 0);
  leftEar.rotation.z = 0.5;
  group.add(leftEar);

  const rightEar = new THREE.Mesh(earGeo, skinMaterial);
  rightEar.position.set(0.1 * s, 0.74 * s, 0);
  rightEar.rotation.z = -0.5;
  group.add(rightEar);

  // === CRUDE IRON CROWN (canonical) ===
  // Rough iron band
  const crownBand = new THREE.Mesh(
    new THREE.BoxGeometry(0.18 * s, 0.04 * s, 0.14 * s),
    ironMaterial
  );
  crownBand.position.set(0, 0.82 * s, 0);
  group.add(crownBand);

  // Crude uneven points (not perfect like gold crown)
  const crownPointGeo = new THREE.BoxGeometry(0.025 * s, 0.06 * s, 0.02 * s);
  const crownPoints = [
    { x: -0.07, y: 0.87, h: 0.06, rot: 0.1 },
    { x: -0.035, y: 0.88, h: 0.07, rot: -0.05 },
    { x: 0, y: 0.89, h: 0.08, rot: 0.08 },
    { x: 0.035, y: 0.87, h: 0.065, rot: -0.1 },
    { x: 0.07, y: 0.86, h: 0.055, rot: 0.05 },
  ];

  crownPoints.forEach((cp) => {
    const point = new THREE.Mesh(crownPointGeo, cp.x < 0 ? ironMaterial : rustMaterial);
    point.position.set(cp.x * s, cp.y * s, 0.05 * s);
    point.scale.y = cp.h / 0.06;
    point.rotation.z = cp.rot;
    group.add(point);
  });

  // Rust patches on crown
  const rustPatch = new THREE.Mesh(
    new THREE.BoxGeometry(0.04 * s, 0.02 * s, 0.015 * s),
    rustMaterial
  );
  rustPatch.position.set(-0.05 * s, 0.83 * s, 0.08 * s);
  group.add(rustPatch);

  // === TORSO (muscular, larger) ===
  const torso = new THREE.Mesh(
    new THREE.BoxGeometry(0.28 * s, 0.3 * s, 0.18 * s),
    skinMaterial
  );
  torso.position.y = 0.48 * s;
  group.add(torso);

  // Belly (well-fed king)
  const belly = new THREE.Mesh(
    new THREE.BoxGeometry(0.22 * s, 0.16 * s, 0.12 * s),
    skinMaterial
  );
  belly.position.set(0, 0.36 * s, 0.06 * s);
  group.add(belly);

  // === TROPHY BONES (canonical - wears trophy bones) ===
  // Skull trophy on chest
  const skullTrophy = new THREE.Mesh(
    new THREE.BoxGeometry(0.08 * s, 0.08 * s, 0.05 * s),
    boneMaterial
  );
  skullTrophy.position.set(0, 0.54 * s, 0.1 * s);
  group.add(skullTrophy);

  // Skull eye sockets
  const socketGeo = new THREE.BoxGeometry(0.02 * s, 0.02 * s, 0.02 * s);
  const socketMat = new THREE.MeshStandardMaterial({ color: 0x111111 });

  const leftSocket = new THREE.Mesh(socketGeo, socketMat);
  leftSocket.position.set(-0.02 * s, 0.56 * s, 0.13 * s);
  group.add(leftSocket);

  const rightSocket = new THREE.Mesh(socketGeo, socketMat);
  rightSocket.position.set(0.02 * s, 0.56 * s, 0.13 * s);
  group.add(rightSocket);

  // Bone necklace
  const boneBeadGeo = new THREE.CylinderGeometry(0.015 * s, 0.015 * s, 0.04 * s, 6);
  const necklaceBones = [
    { x: -0.1, y: 0.62, z: 0.08 },
    { x: -0.06, y: 0.64, z: 0.1 },
    { x: 0.06, y: 0.64, z: 0.1 },
    { x: 0.1, y: 0.62, z: 0.08 },
  ];

  necklaceBones.forEach((nb) => {
    const bone = new THREE.Mesh(boneBeadGeo, boneMaterial);
    bone.position.set(nb.x * s, nb.y * s, nb.z * s);
    bone.rotation.z = Math.PI / 2;
    group.add(bone);
  });

  // Bone shoulder decoration (left)
  const shoulderBone = new THREE.Mesh(
    new THREE.BoxGeometry(0.03 * s, 0.12 * s, 0.03 * s),
    boneMaterial
  );
  shoulderBone.position.set(-0.18 * s, 0.58 * s, 0);
  shoulderBone.rotation.z = 0.3;
  group.add(shoulderBone);

  // Bone hip decoration
  const hipBone = new THREE.Mesh(
    new THREE.BoxGeometry(0.1 * s, 0.03 * s, 0.03 * s),
    boneMaterial
  );
  hipBone.position.set(0.08 * s, 0.32 * s, 0.08 * s);
  group.add(hipBone);

  // Finger bones hanging from belt
  const fingerBoneGeo = new THREE.BoxGeometry(0.01 * s, 0.04 * s, 0.01 * s);
  for (let i = 0; i < 4; i++) {
    const fingerBone = new THREE.Mesh(fingerBoneGeo, boneMaterial);
    fingerBone.position.set((-0.06 + i * 0.04) * s, 0.28 * s, 0.1 * s);
    group.add(fingerBone);
  }

  // === LEATHER STRAPS ===
  const strapGeo = new THREE.BoxGeometry(0.04 * s, 0.3 * s, 0.02 * s);
  const chestStrap = new THREE.Mesh(strapGeo, leatherMaterial);
  chestStrap.position.set(-0.06 * s, 0.48 * s, 0.1 * s);
  chestStrap.rotation.z = 0.3;
  group.add(chestStrap);

  // Belt
  const belt = new THREE.Mesh(
    new THREE.BoxGeometry(0.26 * s, 0.04 * s, 0.02 * s),
    leatherMaterial
  );
  belt.position.set(0, 0.32 * s, 0.1 * s);
  group.add(belt);

  // Belt buckle (iron)
  const buckle = new THREE.Mesh(
    new THREE.BoxGeometry(0.05 * s, 0.05 * s, 0.015 * s),
    ironMaterial
  );
  buckle.position.set(0, 0.32 * s, 0.12 * s);
  group.add(buckle);

  // === ARMS (muscular) ===
  const upperArmGeo = new THREE.BoxGeometry(0.08 * s, 0.16 * s, 0.08 * s);

  const leftUpperArm = new THREE.Mesh(upperArmGeo, skinMaterial);
  leftUpperArm.position.set(-0.2 * s, 0.5 * s, 0);
  group.add(leftUpperArm);

  const rightUpperArm = new THREE.Mesh(upperArmGeo, skinMaterial);
  rightUpperArm.position.set(0.2 * s, 0.5 * s, 0);
  group.add(rightUpperArm);

  // Lower arms
  const lowerArmGeo = new THREE.BoxGeometry(0.07 * s, 0.14 * s, 0.07 * s);

  const leftLowerArm = new THREE.Mesh(lowerArmGeo, skinMaterial);
  leftLowerArm.position.set(-0.22 * s, 0.36 * s, 0.04 * s);
  group.add(leftLowerArm);

  const rightLowerArm = new THREE.Mesh(lowerArmGeo, skinMaterial);
  rightLowerArm.position.set(0.24 * s, 0.38 * s, 0.06 * s);
  rightLowerArm.rotation.x = -0.4;
  group.add(rightLowerArm);

  // Hands
  const handGeo = new THREE.BoxGeometry(0.06 * s, 0.06 * s, 0.05 * s);

  const leftHand = new THREE.Mesh(handGeo, darkSkinMaterial);
  leftHand.position.set(-0.24 * s, 0.26 * s, 0.06 * s);
  group.add(leftHand);

  const rightHand = new THREE.Mesh(handGeo, darkSkinMaterial);
  rightHand.position.set(0.28 * s, 0.3 * s, 0.14 * s);
  group.add(rightHand);

  // === BLOODSTAINED MACE (canonical) ===
  // Mace handle (dark wood)
  const maceHandle = new THREE.Mesh(
    new THREE.BoxGeometry(0.035 * s, 0.4 * s, 0.035 * s),
    woodMaterial
  );
  maceHandle.position.set(0.32 * s, 0.48 * s, 0.16 * s);
  maceHandle.rotation.x = -0.3;
  maceHandle.rotation.z = -0.15;
  group.add(maceHandle);

  // Mace head (iron with blood)
  const maceHead = new THREE.Mesh(
    new THREE.BoxGeometry(0.1 * s, 0.12 * s, 0.1 * s),
    ironMaterial
  );
  maceHead.position.set(0.36 * s, 0.66 * s, 0.1 * s);
  maceHead.rotation.x = -0.3;
  group.add(maceHead);

  // Mace spikes
  const spikeGeo = new THREE.BoxGeometry(0.025 * s, 0.05 * s, 0.025 * s);
  const spikePositions = [
    { x: 0.32, y: 0.68, z: 0.06 },
    { x: 0.4, y: 0.68, z: 0.06 },
    { x: 0.36, y: 0.68, z: 0.02 },
    { x: 0.36, y: 0.68, z: 0.14 },
    { x: 0.36, y: 0.74, z: 0.1 },
  ];

  spikePositions.forEach((sp) => {
    const spike = new THREE.Mesh(spikeGeo, ironMaterial);
    spike.position.set(sp.x * s, sp.y * s, sp.z * s);
    group.add(spike);
  });

  // Blood stains on mace
  const bloodGeo = new THREE.BoxGeometry(0.04 * s, 0.06 * s, 0.02 * s);
  const bloodStains = [
    { x: 0.34, y: 0.64, z: 0.16 },
    { x: 0.38, y: 0.7, z: 0.08 },
    { x: 0.33, y: 0.72, z: 0.12 },
  ];

  bloodStains.forEach((bs) => {
    const blood = new THREE.Mesh(bloodGeo, bloodMaterial);
    blood.position.set(bs.x * s, bs.y * s, bs.z * s);
    blood.rotation.set(Math.random() * 0.3, Math.random() * 0.3, Math.random() * 0.3);
    group.add(blood);
  });

  // Blood drip
  const dripGeo = new THREE.BoxGeometry(0.015 * s, 0.04 * s, 0.015 * s);
  const drip = new THREE.Mesh(dripGeo, bloodMaterial);
  drip.position.set(0.36 * s, 0.58 * s, 0.14 * s);
  group.add(drip);

  // === LEGS (stout) ===
  const legGeo = new THREE.BoxGeometry(0.09 * s, 0.2 * s, 0.08 * s);

  const leftLeg = new THREE.Mesh(legGeo, skinMaterial);
  leftLeg.position.set(-0.08 * s, 0.14 * s, 0);
  group.add(leftLeg);

  const rightLeg = new THREE.Mesh(legGeo, skinMaterial);
  rightLeg.position.set(0.08 * s, 0.14 * s, 0);
  group.add(rightLeg);

  // Feet
  const footGeo = new THREE.BoxGeometry(0.08 * s, 0.04 * s, 0.1 * s);

  const leftFoot = new THREE.Mesh(footGeo, darkSkinMaterial);
  leftFoot.position.set(-0.08 * s, 0.02 * s, 0.02 * s);
  group.add(leftFoot);

  const rightFoot = new THREE.Mesh(footGeo, darkSkinMaterial);
  rightFoot.position.set(0.08 * s, 0.02 * s, 0.02 * s);
  group.add(rightFoot);

  // === LOINCLOTH ===
  const loincloth = new THREE.Mesh(
    new THREE.BoxGeometry(0.2 * s, 0.12 * s, 0.02 * s),
    leatherMaterial
  );
  loincloth.position.set(0, 0.24 * s, 0.1 * s);
  group.add(loincloth);

  return group;
}

export const GOBLIN_KING_V2_META = {
  id: 'goblin-king-v2',
  name: 'Goblin King',
  category: 'enemy' as const,
  description: 'Larger goblin wearing a crude iron crown. Carries a bloodstained mace and wears trophy bones - canonical design',
  defaultScale: 1.0,
  boundingBox: { x: 0.7, y: 0.95, z: 0.5 },
  tags: ['boss', 'goblin', 'enemy', 'king', 'canonical'],
  enemyName: 'Goblin King',
  version: 2,
  isActive: true,
  baseModelId: 'goblin-king',
};
