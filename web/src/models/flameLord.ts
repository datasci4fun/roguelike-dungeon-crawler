/**
 * Flame Lord Boss Model
 * Canonical design based on bestiary appearance.
 *
 * Canonical appearance from bestiary:
 * "Towering humanoid of magma and flame. Crown of fire. Molten rock flows where blood should be."
 */

import * as THREE from 'three';

export interface FlameLordOptions {
  scale?: number;
}

export function createFlameLord(options: FlameLordOptions = {}): THREE.Group {
  const { scale = 1.0 } = options;

  const group = new THREE.Group();
  const s = scale * 1.6; // Towering boss

  // === MATERIALS ===
  // Core magma (brightest)
  const coreMagmaMaterial = new THREE.MeshStandardMaterial({
    color: 0xffcc44,
    roughness: 0.2,
    metalness: 0.0,
    emissive: 0xffaa22,
    emissiveIntensity: 2.5,
  });

  // Inner magma
  const innerMagmaMaterial = new THREE.MeshStandardMaterial({
    color: 0xff8833,
    roughness: 0.3,
    metalness: 0.0,
    emissive: 0xee6622,
    emissiveIntensity: 2.0,
  });

  // Outer magma
  const outerMagmaMaterial = new THREE.MeshStandardMaterial({
    color: 0xcc4422,
    roughness: 0.4,
    metalness: 0.1,
    emissive: 0xaa3311,
    emissiveIntensity: 1.5,
  });

  // Cooled rock (canonical - molten rock)
  const rockMaterial = new THREE.MeshStandardMaterial({
    color: 0x332222,
    roughness: 0.8,
    metalness: 0.1,
    emissive: 0x221111,
    emissiveIntensity: 0.3,
  });

  // Molten veins (canonical - molten rock flows)
  const veinMaterial = new THREE.MeshStandardMaterial({
    color: 0xff6633,
    roughness: 0.2,
    metalness: 0.0,
    emissive: 0xee4422,
    emissiveIntensity: 1.8,
  });

  // Fire crown (canonical - crown of fire)
  const fireCrownMaterial = new THREE.MeshStandardMaterial({
    color: 0xffdd66,
    roughness: 0.1,
    metalness: 0.0,
    emissive: 0xffcc44,
    emissiveIntensity: 3.0,
  });

  // Eyes
  const eyeMaterial = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    roughness: 0.0,
    metalness: 0.0,
    emissive: 0xffffaa,
    emissiveIntensity: 3.0,
  });

  // === HEAD ===
  const head = new THREE.Mesh(
    new THREE.BoxGeometry(0.14 * s, 0.16 * s, 0.12 * s),
    rockMaterial
  );
  head.position.y = 0.88 * s;
  group.add(head);

  // Magma face
  const faceGlow = new THREE.Mesh(
    new THREE.BoxGeometry(0.12 * s, 0.14 * s, 0.06 * s),
    outerMagmaMaterial
  );
  faceGlow.position.set(0, 0.88 * s, 0.04 * s);
  group.add(faceGlow);

  // Burning eyes
  const eyeGeo = new THREE.SphereGeometry(0.025 * s, 6, 4);

  const leftEye = new THREE.Mesh(eyeGeo, eyeMaterial);
  leftEye.position.set(-0.04 * s, 0.9 * s, 0.08 * s);
  group.add(leftEye);

  const rightEye = new THREE.Mesh(eyeGeo, eyeMaterial);
  rightEye.position.set(0.04 * s, 0.9 * s, 0.08 * s);
  group.add(rightEye);

  // === CROWN OF FIRE (canonical) ===
  const crownBase = new THREE.Mesh(
    new THREE.CylinderGeometry(0.08 * s, 0.07 * s, 0.03 * s, 8),
    innerMagmaMaterial
  );
  crownBase.position.y = 0.98 * s;
  group.add(crownBase);

  // Fire spires (flames forming crown)
  const flameGeo = new THREE.BoxGeometry(0.025 * s, 0.12 * s, 0.02 * s);
  for (let i = 0; i < 8; i++) {
    const angle = (i / 8) * Math.PI * 2;
    const flame = new THREE.Mesh(flameGeo, fireCrownMaterial);
    flame.position.set(
      Math.cos(angle) * 0.07 * s,
      1.04 * s,
      Math.sin(angle) * 0.07 * s
    );
    flame.rotation.z = Math.cos(angle) * 0.3;
    flame.rotation.x = Math.sin(angle) * 0.3;
    const height = 0.8 + Math.random() * 0.4;
    flame.scale.y = height;
    group.add(flame);
  }

  // Crown glow
  const crownGlow = new THREE.Mesh(
    new THREE.SphereGeometry(0.12 * s, 8, 6),
    new THREE.MeshStandardMaterial({
      color: 0xffdd88,
      emissive: 0xffcc66,
      emissiveIntensity: 2.0,
      transparent: true,
      opacity: 0.4,
    })
  );
  crownGlow.position.y = 1.02 * s;
  crownGlow.scale.set(1, 0.8, 1);
  group.add(crownGlow);

  // === TORSO (massive, rocky with molten veins) ===
  const torso = new THREE.Mesh(
    new THREE.BoxGeometry(0.3 * s, 0.36 * s, 0.2 * s),
    rockMaterial
  );
  torso.position.y = 0.6 * s;
  group.add(torso);

  // Molten core visible
  const torsoCore = new THREE.Mesh(
    new THREE.BoxGeometry(0.24 * s, 0.3 * s, 0.14 * s),
    innerMagmaMaterial
  );
  torsoCore.position.y = 0.6 * s;
  group.add(torsoCore);

  // Molten veins on surface (canonical)
  const veinGeo = new THREE.BoxGeometry(0.02 * s, 0.15 * s, 0.015 * s);
  const veins = [
    { x: -0.12, y: 0.65, z: 0.11, rz: 0.3 },
    { x: 0.14, y: 0.62, z: 0.1, rz: -0.25 },
    { x: -0.1, y: 0.55, z: 0.11, rz: 0.4 },
    { x: 0.1, y: 0.58, z: 0.11, rz: -0.35 },
    { x: -0.08, y: 0.7, z: 0.1, rz: 0.2 },
    { x: 0.08, y: 0.68, z: 0.1, rz: -0.15 },
  ];

  veins.forEach((v) => {
    const vein = new THREE.Mesh(veinGeo, veinMaterial);
    vein.position.set(v.x * s, v.y * s, v.z * s);
    vein.rotation.z = v.rz;
    group.add(vein);
  });

  // === SHOULDERS (volcanic) ===
  const shoulderGeo = new THREE.SphereGeometry(0.1 * s, 8, 6);

  const leftShoulder = new THREE.Mesh(shoulderGeo, rockMaterial);
  leftShoulder.position.set(-0.22 * s, 0.74 * s, 0);
  group.add(leftShoulder);

  const rightShoulder = new THREE.Mesh(shoulderGeo, rockMaterial);
  rightShoulder.position.set(0.22 * s, 0.74 * s, 0);
  group.add(rightShoulder);

  // Shoulder flames
  const shoulderFlameGeo = new THREE.BoxGeometry(0.03 * s, 0.08 * s, 0.02 * s);

  const leftFlame = new THREE.Mesh(shoulderFlameGeo, fireCrownMaterial);
  leftFlame.position.set(-0.28 * s, 0.82 * s, 0);
  leftFlame.rotation.z = 0.4;
  group.add(leftFlame);

  const rightFlame = new THREE.Mesh(shoulderFlameGeo, fireCrownMaterial);
  rightFlame.position.set(0.28 * s, 0.82 * s, 0);
  rightFlame.rotation.z = -0.4;
  group.add(rightFlame);

  // === ARMS (rock and magma) ===
  const upperArmGeo = new THREE.BoxGeometry(0.1 * s, 0.22 * s, 0.1 * s);

  const leftUpperArm = new THREE.Mesh(upperArmGeo, rockMaterial);
  leftUpperArm.position.set(-0.26 * s, 0.56 * s, 0);
  group.add(leftUpperArm);

  const rightUpperArm = new THREE.Mesh(upperArmGeo, rockMaterial);
  rightUpperArm.position.set(0.26 * s, 0.56 * s, 0);
  group.add(rightUpperArm);

  // Lower arms (more magma)
  const lowerArmGeo = new THREE.BoxGeometry(0.09 * s, 0.2 * s, 0.09 * s);

  const leftLowerArm = new THREE.Mesh(lowerArmGeo, outerMagmaMaterial);
  leftLowerArm.position.set(-0.28 * s, 0.38 * s, 0.02 * s);
  group.add(leftLowerArm);

  const rightLowerArm = new THREE.Mesh(lowerArmGeo, outerMagmaMaterial);
  rightLowerArm.position.set(0.28 * s, 0.38 * s, 0.02 * s);
  group.add(rightLowerArm);

  // Molten fists
  const fistGeo = new THREE.BoxGeometry(0.1 * s, 0.1 * s, 0.08 * s);

  const leftFist = new THREE.Mesh(fistGeo, innerMagmaMaterial);
  leftFist.position.set(-0.3 * s, 0.24 * s, 0.03 * s);
  group.add(leftFist);

  const rightFist = new THREE.Mesh(fistGeo, innerMagmaMaterial);
  rightFist.position.set(0.3 * s, 0.24 * s, 0.03 * s);
  group.add(rightFist);

  // === LOWER BODY ===
  const hips = new THREE.Mesh(
    new THREE.BoxGeometry(0.26 * s, 0.14 * s, 0.18 * s),
    rockMaterial
  );
  hips.position.y = 0.36 * s;
  group.add(hips);

  // === LEGS ===
  const upperLegGeo = new THREE.BoxGeometry(0.1 * s, 0.2 * s, 0.1 * s);

  const leftUpperLeg = new THREE.Mesh(upperLegGeo, rockMaterial);
  leftUpperLeg.position.set(-0.08 * s, 0.2 * s, 0);
  group.add(leftUpperLeg);

  const rightUpperLeg = new THREE.Mesh(upperLegGeo, rockMaterial);
  rightUpperLeg.position.set(0.08 * s, 0.2 * s, 0);
  group.add(rightUpperLeg);

  // Lower legs with magma
  const lowerLegGeo = new THREE.BoxGeometry(0.09 * s, 0.18 * s, 0.09 * s);

  const leftLowerLeg = new THREE.Mesh(lowerLegGeo, outerMagmaMaterial);
  leftLowerLeg.position.set(-0.08 * s, 0.06 * s, 0);
  group.add(leftLowerLeg);

  const rightLowerLeg = new THREE.Mesh(lowerLegGeo, outerMagmaMaterial);
  rightLowerLeg.position.set(0.08 * s, 0.06 * s, 0);
  group.add(rightLowerLeg);

  // === LAVA POOL AT BASE (Lava Pool ability) ===
  const lavaPool = new THREE.Mesh(
    new THREE.CylinderGeometry(0.4 * s, 0.5 * s, 0.02 * s, 12),
    new THREE.MeshStandardMaterial({
      color: 0xff6633,
      roughness: 0.3,
      metalness: 0.1,
      emissive: 0xee4422,
      emissiveIntensity: 1.5,
    })
  );
  lavaPool.position.y = 0.01 * s;
  group.add(lavaPool);

  // Lava bubbles
  const bubbleGeo = new THREE.SphereGeometry(0.03 * s, 6, 4);
  const bubbles = [
    { x: -0.25, z: 0.15 },
    { x: 0.3, z: 0.1 },
    { x: -0.2, z: -0.2 },
    { x: 0.18, z: -0.25 },
    { x: 0, z: 0.3 },
  ];

  bubbles.forEach((b) => {
    const bubble = new THREE.Mesh(bubbleGeo, coreMagmaMaterial);
    bubble.position.set(b.x * s, 0.04 * s, b.z * s);
    group.add(bubble);
  });

  return group;
}

export const FLAME_LORD_META = {
  id: 'flame-lord',
  name: 'Flame Lord',
  category: 'enemy' as const,
  description: 'Towering humanoid of magma and flame. Crown of fire. Molten rock flows where blood should be - canonical design',
  defaultScale: 1.0,
  boundingBox: { x: 0.7, y: 1.2, z: 0.5 },
  tags: ['boss', 'fire', 'magma', 'enemy', 'elemental', 'flame', 'canonical'],
  enemyName: 'Flame Lord',
};
