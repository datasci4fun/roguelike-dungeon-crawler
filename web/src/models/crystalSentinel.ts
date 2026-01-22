/**
 * Crystal Sentinel Enemy Model
 * Canonical design based on bestiary appearance.
 *
 * Canonical appearance from bestiary:
 * "Humanoid figure of faceted crystal. Glows with inner light. Moves with grinding precision."
 */

import * as THREE from 'three';

export interface CrystalSentinelOptions {
  scale?: number;
}

export function createCrystalSentinel(options: CrystalSentinelOptions = {}): THREE.Group {
  const { scale = 1.0 } = options;

  const group = new THREE.Group();
  const s = scale * 1.2; // Large sentinel

  // === MATERIALS ===
  // Core crystal (canonical - faceted crystal with inner light)
  const coreCrystalMaterial = new THREE.MeshStandardMaterial({
    color: 0xaaddff,
    roughness: 0.05,
    metalness: 0.3,
    emissive: 0x6699cc,
    emissiveIntensity: 1.0,
    transparent: true,
    opacity: 0.85,
  });

  // Outer crystal (translucent)
  const outerCrystalMaterial = new THREE.MeshStandardMaterial({
    color: 0xcceeFF,
    roughness: 0.1,
    metalness: 0.2,
    emissive: 0x88aadd,
    emissiveIntensity: 0.5,
    transparent: true,
    opacity: 0.7,
  });

  // Inner glow (canonical - glows with inner light)
  const glowMaterial = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    roughness: 0.0,
    metalness: 0.0,
    emissive: 0xaaddff,
    emissiveIntensity: 2.0,
  });

  // Prismatic accent (for Prismatic Beam ability)
  const prismaticMaterial = new THREE.MeshStandardMaterial({
    color: 0xffaaff,
    roughness: 0.05,
    metalness: 0.4,
    emissive: 0xdd88dd,
    emissiveIntensity: 0.8,
    transparent: true,
    opacity: 0.75,
  });

  // === HEAD (faceted crystal) ===
  // Main head crystal
  const headCore = new THREE.Mesh(
    new THREE.BoxGeometry(0.1 * s, 0.12 * s, 0.1 * s),
    coreCrystalMaterial
  );
  headCore.position.y = 0.78 * s;
  headCore.rotation.y = 0.785; // 45 degrees for faceted look
  group.add(headCore);

  // Outer head facets
  const headOuter = new THREE.Mesh(
    new THREE.BoxGeometry(0.12 * s, 0.14 * s, 0.12 * s),
    outerCrystalMaterial
  );
  headOuter.position.y = 0.78 * s;
  group.add(headOuter);

  // Inner glow core
  const headGlow = new THREE.Mesh(
    new THREE.SphereGeometry(0.04 * s, 6, 4),
    glowMaterial
  );
  headGlow.position.y = 0.78 * s;
  group.add(headGlow);

  // Eyes (prismatic)
  const eyeGeo = new THREE.BoxGeometry(0.025 * s, 0.015 * s, 0.02 * s);

  const leftEye = new THREE.Mesh(eyeGeo, prismaticMaterial);
  leftEye.position.set(-0.03 * s, 0.8 * s, 0.06 * s);
  group.add(leftEye);

  const rightEye = new THREE.Mesh(eyeGeo, prismaticMaterial);
  rightEye.position.set(0.03 * s, 0.8 * s, 0.06 * s);
  group.add(rightEye);

  // Head crystal spikes
  const spikeGeo = new THREE.BoxGeometry(0.03 * s, 0.08 * s, 0.03 * s);

  const headSpike1 = new THREE.Mesh(spikeGeo, outerCrystalMaterial);
  headSpike1.position.set(-0.04 * s, 0.88 * s, 0);
  headSpike1.rotation.z = 0.3;
  group.add(headSpike1);

  const headSpike2 = new THREE.Mesh(spikeGeo, outerCrystalMaterial);
  headSpike2.position.set(0.04 * s, 0.88 * s, 0);
  headSpike2.rotation.z = -0.3;
  group.add(headSpike2);

  const headSpike3 = new THREE.Mesh(spikeGeo, outerCrystalMaterial);
  headSpike3.position.set(0, 0.9 * s, -0.03 * s);
  group.add(headSpike3);

  // === NECK ===
  const neck = new THREE.Mesh(
    new THREE.BoxGeometry(0.06 * s, 0.06 * s, 0.06 * s),
    coreCrystalMaterial
  );
  neck.position.y = 0.68 * s;
  neck.rotation.y = 0.785;
  group.add(neck);

  // === TORSO (large crystal formation) ===
  // Core
  const torsoCore = new THREE.Mesh(
    new THREE.BoxGeometry(0.14 * s, 0.24 * s, 0.1 * s),
    coreCrystalMaterial
  );
  torsoCore.position.y = 0.5 * s;
  torsoCore.rotation.y = 0.2;
  group.add(torsoCore);

  // Outer layer
  const torsoOuter = new THREE.Mesh(
    new THREE.BoxGeometry(0.2 * s, 0.28 * s, 0.14 * s),
    outerCrystalMaterial
  );
  torsoOuter.position.y = 0.5 * s;
  group.add(torsoOuter);

  // Inner glow
  const torsoGlow = new THREE.Mesh(
    new THREE.SphereGeometry(0.06 * s, 6, 4),
    glowMaterial
  );
  torsoGlow.position.y = 0.5 * s;
  group.add(torsoGlow);

  // Crystal protrusions on torso
  const protrusionGeo = new THREE.BoxGeometry(0.04 * s, 0.1 * s, 0.04 * s);
  const protrusions = [
    { x: -0.1, y: 0.58, z: 0.06, rx: 0, rz: 0.4 },
    { x: 0.12, y: 0.56, z: 0.04, rx: 0, rz: -0.35 },
    { x: -0.08, y: 0.44, z: 0.08, rx: 0.2, rz: 0.3 },
    { x: 0.1, y: 0.42, z: 0.06, rx: 0.15, rz: -0.25 },
    { x: 0, y: 0.56, z: -0.08, rx: -0.3, rz: 0 },
  ];

  protrusions.forEach((p) => {
    const crystal = new THREE.Mesh(protrusionGeo, outerCrystalMaterial);
    crystal.position.set(p.x * s, p.y * s, p.z * s);
    crystal.rotation.x = p.rx;
    crystal.rotation.z = p.rz;
    group.add(crystal);
  });

  // === SHOULDERS (crystal clusters) ===
  const shoulderGeo = new THREE.BoxGeometry(0.1 * s, 0.08 * s, 0.08 * s);

  const leftShoulder = new THREE.Mesh(shoulderGeo, coreCrystalMaterial);
  leftShoulder.position.set(-0.16 * s, 0.6 * s, 0);
  leftShoulder.rotation.y = 0.785;
  group.add(leftShoulder);

  const rightShoulder = new THREE.Mesh(shoulderGeo, coreCrystalMaterial);
  rightShoulder.position.set(0.16 * s, 0.6 * s, 0);
  rightShoulder.rotation.y = 0.785;
  group.add(rightShoulder);

  // Shoulder spikes
  const shoulderSpikeGeo = new THREE.BoxGeometry(0.03 * s, 0.08 * s, 0.03 * s);

  const leftShoulderSpike = new THREE.Mesh(shoulderSpikeGeo, outerCrystalMaterial);
  leftShoulderSpike.position.set(-0.2 * s, 0.66 * s, 0);
  leftShoulderSpike.rotation.z = 0.5;
  group.add(leftShoulderSpike);

  const rightShoulderSpike = new THREE.Mesh(shoulderSpikeGeo, outerCrystalMaterial);
  rightShoulderSpike.position.set(0.2 * s, 0.66 * s, 0);
  rightShoulderSpike.rotation.z = -0.5;
  group.add(rightShoulderSpike);

  // === ARMS ===
  // Upper arms
  const upperArmGeo = new THREE.BoxGeometry(0.07 * s, 0.14 * s, 0.06 * s);

  const leftUpperArm = new THREE.Mesh(upperArmGeo, coreCrystalMaterial);
  leftUpperArm.position.set(-0.18 * s, 0.48 * s, 0);
  leftUpperArm.rotation.y = 0.3;
  group.add(leftUpperArm);

  const rightUpperArm = new THREE.Mesh(upperArmGeo, coreCrystalMaterial);
  rightUpperArm.position.set(0.18 * s, 0.48 * s, 0);
  rightUpperArm.rotation.y = -0.3;
  group.add(rightUpperArm);

  // Lower arms
  const lowerArmGeo = new THREE.BoxGeometry(0.06 * s, 0.14 * s, 0.05 * s);

  const leftLowerArm = new THREE.Mesh(lowerArmGeo, outerCrystalMaterial);
  leftLowerArm.position.set(-0.2 * s, 0.34 * s, 0.02 * s);
  group.add(leftLowerArm);

  const rightLowerArm = new THREE.Mesh(lowerArmGeo, outerCrystalMaterial);
  rightLowerArm.position.set(0.2 * s, 0.34 * s, 0.02 * s);
  group.add(rightLowerArm);

  // Hands (crystal fists for Crystal Slam)
  const handGeo = new THREE.BoxGeometry(0.08 * s, 0.08 * s, 0.06 * s);

  const leftHand = new THREE.Mesh(handGeo, coreCrystalMaterial);
  leftHand.position.set(-0.22 * s, 0.22 * s, 0.03 * s);
  leftHand.rotation.y = 0.785;
  group.add(leftHand);

  const rightHand = new THREE.Mesh(handGeo, coreCrystalMaterial);
  rightHand.position.set(0.22 * s, 0.22 * s, 0.03 * s);
  rightHand.rotation.y = 0.785;
  group.add(rightHand);

  // === LEGS ===
  const upperLegGeo = new THREE.BoxGeometry(0.08 * s, 0.16 * s, 0.07 * s);

  const leftUpperLeg = new THREE.Mesh(upperLegGeo, coreCrystalMaterial);
  leftUpperLeg.position.set(-0.07 * s, 0.28 * s, 0);
  group.add(leftUpperLeg);

  const rightUpperLeg = new THREE.Mesh(upperLegGeo, coreCrystalMaterial);
  rightUpperLeg.position.set(0.07 * s, 0.28 * s, 0);
  group.add(rightUpperLeg);

  // Lower legs
  const lowerLegGeo = new THREE.BoxGeometry(0.07 * s, 0.14 * s, 0.06 * s);

  const leftLowerLeg = new THREE.Mesh(lowerLegGeo, outerCrystalMaterial);
  leftLowerLeg.position.set(-0.07 * s, 0.14 * s, 0);
  group.add(leftLowerLeg);

  const rightLowerLeg = new THREE.Mesh(lowerLegGeo, outerCrystalMaterial);
  rightLowerLeg.position.set(0.07 * s, 0.14 * s, 0);
  group.add(rightLowerLeg);

  // Feet (crystal base)
  const footGeo = new THREE.BoxGeometry(0.08 * s, 0.04 * s, 0.12 * s);

  const leftFoot = new THREE.Mesh(footGeo, coreCrystalMaterial);
  leftFoot.position.set(-0.07 * s, 0.05 * s, 0.02 * s);
  group.add(leftFoot);

  const rightFoot = new THREE.Mesh(footGeo, coreCrystalMaterial);
  rightFoot.position.set(0.07 * s, 0.05 * s, 0.02 * s);
  group.add(rightFoot);

  // === GROUND CRYSTALS (formation) ===
  const groundCrystalGeo = new THREE.BoxGeometry(0.04 * s, 0.1 * s, 0.04 * s);
  const groundCrystals = [
    { x: -0.18, z: 0.08, h: 0.1 },
    { x: 0.16, z: 0.1, h: 0.08 },
    { x: -0.14, z: -0.1, h: 0.06 },
    { x: 0.2, z: -0.06, h: 0.07 },
  ];

  groundCrystals.forEach((gc) => {
    const crystal = new THREE.Mesh(groundCrystalGeo, outerCrystalMaterial);
    crystal.position.set(gc.x * s, gc.h * 0.5 * s, gc.z * s);
    crystal.scale.y = gc.h / 0.1;
    crystal.rotation.z = Math.random() * 0.3 - 0.15;
    group.add(crystal);
  });

  return group;
}

export const CRYSTAL_SENTINEL_META = {
  id: 'crystal-sentinel',
  name: 'Crystal Sentinel',
  category: 'enemy' as const,
  description: 'Humanoid figure of faceted crystal. Glows with inner light. Moves with grinding precision - canonical design',
  defaultScale: 1.0,
  boundingBox: { x: 0.5, y: 1.0, z: 0.4 },
  tags: ['crystal', 'golem', 'enemy', 'construct', 'elemental', 'canonical'],
  enemyName: 'Crystal Sentinel',
};
