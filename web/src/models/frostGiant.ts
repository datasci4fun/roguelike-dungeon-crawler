/**
 * Frost Giant Boss Model
 * Canonical design based on bestiary appearance.
 *
 * Canonical appearance from bestiary:
 * "Twenty-foot humanoid of ice and frozen flesh. Beard of icicles. Eyes like frozen lakes."
 */

import * as THREE from 'three';

export interface FrostGiantOptions {
  scale?: number;
}

export function createFrostGiant(options: FrostGiantOptions = {}): THREE.Group {
  const { scale = 1.0 } = options;

  const group = new THREE.Group();
  const s = scale * 1.8; // Very large boss (twenty-foot)

  // === MATERIALS ===
  // Frozen flesh (canonical - ice and frozen flesh)
  const frozenFleshMaterial = new THREE.MeshStandardMaterial({
    color: 0x7799aa,
    roughness: 0.5,
    metalness: 0.1,
    emissive: 0x334455,
    emissiveIntensity: 0.2,
  });

  // Ice material
  const iceMaterial = new THREE.MeshStandardMaterial({
    color: 0xaaddff,
    roughness: 0.1,
    metalness: 0.2,
    emissive: 0x6699cc,
    emissiveIntensity: 0.4,
    transparent: true,
    opacity: 0.85,
  });

  // Deep ice
  const deepIceMaterial = new THREE.MeshStandardMaterial({
    color: 0x88bbdd,
    roughness: 0.15,
    metalness: 0.3,
    emissive: 0x5588aa,
    emissiveIntensity: 0.3,
    transparent: true,
    opacity: 0.9,
  });

  // Icicle material (canonical - beard of icicles)
  const icicleMaterial = new THREE.MeshStandardMaterial({
    color: 0xcceeFF,
    roughness: 0.05,
    metalness: 0.3,
    emissive: 0x88aacc,
    emissiveIntensity: 0.5,
    transparent: true,
    opacity: 0.8,
  });

  // Eyes (canonical - eyes like frozen lakes)
  const eyeMaterial = new THREE.MeshStandardMaterial({
    color: 0xaaddff,
    roughness: 0.0,
    metalness: 0.1,
    emissive: 0x88ccff,
    emissiveIntensity: 1.5,
  });

  // === HEAD ===
  const head = new THREE.Mesh(
    new THREE.BoxGeometry(0.14 * s, 0.16 * s, 0.12 * s),
    frozenFleshMaterial
  );
  head.position.y = 0.88 * s;
  group.add(head);

  // Brow ridge
  const brow = new THREE.Mesh(
    new THREE.BoxGeometry(0.12 * s, 0.03 * s, 0.08 * s),
    deepIceMaterial
  );
  brow.position.set(0, 0.94 * s, 0.05 * s);
  group.add(brow);

  // Eyes (canonical - like frozen lakes)
  const eyeGeo = new THREE.SphereGeometry(0.025 * s, 8, 6);

  const leftEye = new THREE.Mesh(eyeGeo, eyeMaterial);
  leftEye.position.set(-0.04 * s, 0.9 * s, 0.07 * s);
  group.add(leftEye);

  const rightEye = new THREE.Mesh(eyeGeo, eyeMaterial);
  rightEye.position.set(0.04 * s, 0.9 * s, 0.07 * s);
  group.add(rightEye);

  // Deep eye glow (frozen lake depth)
  const eyeDepthGeo = new THREE.SphereGeometry(0.015 * s, 6, 4);
  const eyeDepthMaterial = new THREE.MeshStandardMaterial({
    color: 0x4488aa,
    emissive: 0x336688,
    emissiveIntensity: 0.8,
  });

  const leftEyeDepth = new THREE.Mesh(eyeDepthGeo, eyeDepthMaterial);
  leftEyeDepth.position.set(-0.04 * s, 0.9 * s, 0.065 * s);
  group.add(leftEyeDepth);

  const rightEyeDepth = new THREE.Mesh(eyeDepthGeo, eyeDepthMaterial);
  rightEyeDepth.position.set(0.04 * s, 0.9 * s, 0.065 * s);
  group.add(rightEyeDepth);

  // === BEARD OF ICICLES (canonical) ===
  const icicleGeo = new THREE.ConeGeometry(0.015 * s, 0.1 * s, 4);
  const beardIcicles = [
    { x: -0.05, y: 0.78, z: 0.06, h: 0.1 },
    { x: -0.025, y: 0.76, z: 0.07, h: 0.12 },
    { x: 0, y: 0.75, z: 0.08, h: 0.14 },
    { x: 0.025, y: 0.76, z: 0.07, h: 0.12 },
    { x: 0.05, y: 0.78, z: 0.06, h: 0.1 },
    { x: -0.04, y: 0.72, z: 0.065, h: 0.08 },
    { x: 0.04, y: 0.72, z: 0.065, h: 0.08 },
    { x: -0.015, y: 0.7, z: 0.075, h: 0.1 },
    { x: 0.015, y: 0.7, z: 0.075, h: 0.1 },
  ];

  beardIcicles.forEach((bi) => {
    const icicle = new THREE.Mesh(
      new THREE.ConeGeometry(0.012 * s, bi.h * s, 4),
      icicleMaterial
    );
    icicle.position.set(bi.x * s, bi.y * s, bi.z * s);
    icicle.rotation.x = Math.PI;
    group.add(icicle);
  });

  // === NECK ===
  const neck = new THREE.Mesh(
    new THREE.CylinderGeometry(0.06 * s, 0.08 * s, 0.1 * s, 8),
    frozenFleshMaterial
  );
  neck.position.y = 0.76 * s;
  group.add(neck);

  // === TORSO (massive) ===
  const torso = new THREE.Mesh(
    new THREE.BoxGeometry(0.28 * s, 0.34 * s, 0.18 * s),
    frozenFleshMaterial
  );
  torso.position.y = 0.54 * s;
  group.add(torso);

  // Ice plates on torso
  const platGeo = new THREE.BoxGeometry(0.1 * s, 0.12 * s, 0.03 * s);
  const plates = [
    { x: -0.1, y: 0.58, z: 0.1 },
    { x: 0.1, y: 0.56, z: 0.1 },
    { x: -0.08, y: 0.46, z: 0.1 },
    { x: 0.08, y: 0.48, z: 0.1 },
  ];

  plates.forEach((p) => {
    const plate = new THREE.Mesh(platGeo, iceMaterial);
    plate.position.set(p.x * s, p.y * s, p.z * s);
    group.add(plate);
  });

  // === SHOULDERS (massive) ===
  const shoulderGeo = new THREE.SphereGeometry(0.1 * s, 8, 6);

  const leftShoulder = new THREE.Mesh(shoulderGeo, frozenFleshMaterial);
  leftShoulder.position.set(-0.2 * s, 0.68 * s, 0);
  group.add(leftShoulder);

  const rightShoulder = new THREE.Mesh(shoulderGeo, frozenFleshMaterial);
  rightShoulder.position.set(0.2 * s, 0.68 * s, 0);
  group.add(rightShoulder);

  // Shoulder ice spikes
  const spikeGeo = new THREE.ConeGeometry(0.02 * s, 0.08 * s, 4);

  const leftSpike = new THREE.Mesh(spikeGeo, icicleMaterial);
  leftSpike.position.set(-0.26 * s, 0.74 * s, 0);
  leftSpike.rotation.z = 0.5;
  group.add(leftSpike);

  const rightSpike = new THREE.Mesh(spikeGeo, icicleMaterial);
  rightSpike.position.set(0.26 * s, 0.74 * s, 0);
  rightSpike.rotation.z = -0.5;
  group.add(rightSpike);

  // === ARMS (massive) ===
  const upperArmGeo = new THREE.BoxGeometry(0.1 * s, 0.22 * s, 0.1 * s);

  const leftUpperArm = new THREE.Mesh(upperArmGeo, frozenFleshMaterial);
  leftUpperArm.position.set(-0.24 * s, 0.52 * s, 0);
  group.add(leftUpperArm);

  const rightUpperArm = new THREE.Mesh(upperArmGeo, frozenFleshMaterial);
  rightUpperArm.position.set(0.24 * s, 0.52 * s, 0);
  group.add(rightUpperArm);

  // Lower arms
  const lowerArmGeo = new THREE.BoxGeometry(0.09 * s, 0.2 * s, 0.09 * s);

  const leftLowerArm = new THREE.Mesh(lowerArmGeo, deepIceMaterial);
  leftLowerArm.position.set(-0.26 * s, 0.34 * s, 0.02 * s);
  group.add(leftLowerArm);

  const rightLowerArm = new THREE.Mesh(lowerArmGeo, deepIceMaterial);
  rightLowerArm.position.set(0.26 * s, 0.34 * s, 0.02 * s);
  group.add(rightLowerArm);

  // Frozen fists (for Frozen Fist attack)
  const fistGeo = new THREE.BoxGeometry(0.1 * s, 0.1 * s, 0.08 * s);

  const leftFist = new THREE.Mesh(fistGeo, iceMaterial);
  leftFist.position.set(-0.28 * s, 0.2 * s, 0.03 * s);
  group.add(leftFist);

  const rightFist = new THREE.Mesh(fistGeo, iceMaterial);
  rightFist.position.set(0.28 * s, 0.2 * s, 0.03 * s);
  group.add(rightFist);

  // === LOWER BODY ===
  const hips = new THREE.Mesh(
    new THREE.BoxGeometry(0.24 * s, 0.14 * s, 0.16 * s),
    frozenFleshMaterial
  );
  hips.position.y = 0.32 * s;
  group.add(hips);

  // === LEGS (massive) ===
  const upperLegGeo = new THREE.BoxGeometry(0.1 * s, 0.2 * s, 0.1 * s);

  const leftUpperLeg = new THREE.Mesh(upperLegGeo, frozenFleshMaterial);
  leftUpperLeg.position.set(-0.08 * s, 0.18 * s, 0);
  group.add(leftUpperLeg);

  const rightUpperLeg = new THREE.Mesh(upperLegGeo, frozenFleshMaterial);
  rightUpperLeg.position.set(0.08 * s, 0.18 * s, 0);
  group.add(rightUpperLeg);

  // Lower legs
  const lowerLegGeo = new THREE.BoxGeometry(0.09 * s, 0.18 * s, 0.09 * s);

  const leftLowerLeg = new THREE.Mesh(lowerLegGeo, deepIceMaterial);
  leftLowerLeg.position.set(-0.08 * s, 0.05 * s, 0);
  group.add(leftLowerLeg);

  const rightLowerLeg = new THREE.Mesh(lowerLegGeo, deepIceMaterial);
  rightLowerLeg.position.set(0.08 * s, 0.05 * s, 0);
  group.add(rightLowerLeg);

  // === ICE GROUND EFFECT (Freeze Ground ability) ===
  const iceGround = new THREE.Mesh(
    new THREE.CylinderGeometry(0.4 * s, 0.5 * s, 0.02 * s, 12),
    new THREE.MeshStandardMaterial({
      color: 0xaaddff,
      roughness: 0.1,
      metalness: 0.2,
      emissive: 0x6699cc,
      emissiveIntensity: 0.4,
      transparent: true,
      opacity: 0.5,
    })
  );
  iceGround.position.y = 0.01 * s;
  group.add(iceGround);

  // Ice crystals around base
  const groundCrystalGeo = new THREE.BoxGeometry(0.04 * s, 0.12 * s, 0.04 * s);
  const groundCrystals = [
    { x: -0.3, z: 0.15, h: 0.12 },
    { x: 0.32, z: 0.1, h: 0.1 },
    { x: -0.25, z: -0.2, h: 0.08 },
    { x: 0.28, z: -0.18, h: 0.1 },
    { x: 0, z: 0.35, h: 0.09 },
    { x: -0.35, z: -0.05, h: 0.11 },
  ];

  groundCrystals.forEach((gc) => {
    const crystal = new THREE.Mesh(groundCrystalGeo, icicleMaterial);
    crystal.position.set(gc.x * s, gc.h * 0.5 * s, gc.z * s);
    crystal.scale.y = gc.h / 0.12;
    crystal.rotation.z = Math.random() * 0.3 - 0.15;
    group.add(crystal);
  });

  return group;
}

export const FROST_GIANT_META = {
  id: 'frost-giant',
  name: 'Frost Giant',
  category: 'enemy' as const,
  description: 'Twenty-foot humanoid of ice and frozen flesh. Beard of icicles. Eyes like frozen lakes - canonical design',
  defaultScale: 1.0,
  boundingBox: { x: 0.7, y: 1.1, z: 0.5 },
  tags: ['boss', 'giant', 'ice', 'enemy', 'frost', 'elemental', 'canonical'],
  enemyName: 'Frost Giant',
};
