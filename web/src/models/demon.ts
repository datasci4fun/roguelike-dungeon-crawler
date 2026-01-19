/**
 * Demon Enemy Model
 * Canonical design based on bestiary appearance.
 *
 * Canonical appearance from bestiary:
 * "Red-skinned humanoid with horns, clawed hands, and flames dancing across their body."
 */

import * as THREE from 'three';

export interface DemonOptions {
  scale?: number;
}

export function createDemon(options: DemonOptions = {}): THREE.Group {
  const { scale = 1.0 } = options;

  const group = new THREE.Group();
  const s = scale * 1.3; // Large, imposing

  // === MATERIALS ===
  // Red skin (canonical)
  const skinMaterial = new THREE.MeshStandardMaterial({
    color: 0xaa2222,
    roughness: 0.6,
    metalness: 0.1,
  });

  const darkSkinMaterial = new THREE.MeshStandardMaterial({
    color: 0x771111,
    roughness: 0.7,
    metalness: 0.1,
  });

  // Glowing eyes
  const eyeMaterial = new THREE.MeshStandardMaterial({
    color: 0xffaa00,
    roughness: 0.2,
    metalness: 0.0,
    emissive: 0xff6600,
    emissiveIntensity: 1.5,
  });

  // Black horns
  const hornMaterial = new THREE.MeshStandardMaterial({
    color: 0x1a1a1a,
    roughness: 0.4,
    metalness: 0.3,
  });

  // Claws
  const clawMaterial = new THREE.MeshStandardMaterial({
    color: 0x111111,
    roughness: 0.3,
    metalness: 0.4,
  });

  // Flames (canonical - "flames dancing across their body")
  const flameMaterial = new THREE.MeshStandardMaterial({
    color: 0xff4400,
    roughness: 0.3,
    metalness: 0.0,
    emissive: 0xff2200,
    emissiveIntensity: 1.2,
    transparent: true,
    opacity: 0.9,
  });

  const flameCoreMaterial = new THREE.MeshStandardMaterial({
    color: 0xffaa00,
    roughness: 0.2,
    metalness: 0.0,
    emissive: 0xffcc00,
    emissiveIntensity: 1.5,
  });

  // === HEAD ===
  const head = new THREE.Mesh(
    new THREE.BoxGeometry(0.12 * s, 0.14 * s, 0.12 * s),
    skinMaterial
  );
  head.position.y = 0.74 * s;
  group.add(head);

  // Brow ridge (menacing)
  const brow = new THREE.Mesh(
    new THREE.BoxGeometry(0.14 * s, 0.03 * s, 0.08 * s),
    darkSkinMaterial
  );
  brow.position.set(0, 0.8 * s, 0.04 * s);
  group.add(brow);

  // Glowing eyes
  const eyeGeo = new THREE.SphereGeometry(0.022 * s, 6, 4);

  const leftEye = new THREE.Mesh(eyeGeo, eyeMaterial);
  leftEye.position.set(-0.035 * s, 0.76 * s, 0.07 * s);
  group.add(leftEye);

  const rightEye = new THREE.Mesh(eyeGeo, eyeMaterial);
  rightEye.position.set(0.035 * s, 0.76 * s, 0.07 * s);
  group.add(rightEye);

  // Sharp teeth
  const teethGeo = new THREE.BoxGeometry(0.08 * s, 0.015 * s, 0.02 * s);
  const teeth = new THREE.Mesh(teethGeo, new THREE.MeshStandardMaterial({
    color: 0xffffee,
    roughness: 0.4,
  }));
  teeth.position.set(0, 0.69 * s, 0.07 * s);
  group.add(teeth);

  // Horns (canonical)
  const hornGeo = new THREE.BoxGeometry(0.03 * s, 0.12 * s, 0.03 * s);

  const leftHorn = new THREE.Mesh(hornGeo, hornMaterial);
  leftHorn.position.set(-0.06 * s, 0.86 * s, 0);
  leftHorn.rotation.x = -0.3;
  leftHorn.rotation.z = -0.25;
  group.add(leftHorn);

  const leftHornTip = new THREE.Mesh(
    new THREE.BoxGeometry(0.02 * s, 0.06 * s, 0.02 * s),
    hornMaterial
  );
  leftHornTip.position.set(-0.08 * s, 0.94 * s, -0.03 * s);
  leftHornTip.rotation.x = -0.4;
  leftHornTip.rotation.z = -0.3;
  group.add(leftHornTip);

  const rightHorn = new THREE.Mesh(hornGeo, hornMaterial);
  rightHorn.position.set(0.06 * s, 0.86 * s, 0);
  rightHorn.rotation.x = -0.3;
  rightHorn.rotation.z = 0.25;
  group.add(rightHorn);

  const rightHornTip = new THREE.Mesh(
    new THREE.BoxGeometry(0.02 * s, 0.06 * s, 0.02 * s),
    hornMaterial
  );
  rightHornTip.position.set(0.08 * s, 0.94 * s, -0.03 * s);
  rightHornTip.rotation.x = -0.4;
  rightHornTip.rotation.z = 0.3;
  group.add(rightHornTip);

  // === NECK ===
  const neck = new THREE.Mesh(
    new THREE.BoxGeometry(0.08 * s, 0.06 * s, 0.07 * s),
    skinMaterial
  );
  neck.position.set(0, 0.64 * s, 0);
  group.add(neck);

  // === TORSO (muscular) ===
  const torso = new THREE.Mesh(
    new THREE.BoxGeometry(0.28 * s, 0.28 * s, 0.16 * s),
    skinMaterial
  );
  torso.position.y = 0.46 * s;
  group.add(torso);

  // Chest muscles
  const chestGeo = new THREE.BoxGeometry(0.1 * s, 0.1 * s, 0.04 * s);

  const leftChest = new THREE.Mesh(chestGeo, skinMaterial);
  leftChest.position.set(-0.07 * s, 0.52 * s, 0.09 * s);
  group.add(leftChest);

  const rightChest = new THREE.Mesh(chestGeo, skinMaterial);
  rightChest.position.set(0.07 * s, 0.52 * s, 0.09 * s);
  group.add(rightChest);

  // Abdomen
  const abdomen = new THREE.Mesh(
    new THREE.BoxGeometry(0.22 * s, 0.1 * s, 0.12 * s),
    darkSkinMaterial
  );
  abdomen.position.set(0, 0.34 * s, 0.02 * s);
  group.add(abdomen);

  // === SHOULDERS ===
  const shoulderGeo = new THREE.SphereGeometry(0.07 * s, 6, 6);

  const leftShoulder = new THREE.Mesh(shoulderGeo, skinMaterial);
  leftShoulder.position.set(-0.18 * s, 0.56 * s, 0);
  group.add(leftShoulder);

  const rightShoulder = new THREE.Mesh(shoulderGeo, skinMaterial);
  rightShoulder.position.set(0.18 * s, 0.56 * s, 0);
  group.add(rightShoulder);

  // === ARMS ===
  const upperArmGeo = new THREE.BoxGeometry(0.08 * s, 0.18 * s, 0.07 * s);
  const lowerArmGeo = new THREE.BoxGeometry(0.07 * s, 0.16 * s, 0.06 * s);

  // Left arm
  const leftUpperArm = new THREE.Mesh(upperArmGeo, skinMaterial);
  leftUpperArm.position.set(-0.2 * s, 0.44 * s, 0);
  leftUpperArm.rotation.z = 0.2;
  group.add(leftUpperArm);

  const leftLowerArm = new THREE.Mesh(lowerArmGeo, skinMaterial);
  leftLowerArm.position.set(-0.24 * s, 0.28 * s, 0.02 * s);
  leftLowerArm.rotation.z = 0.15;
  group.add(leftLowerArm);

  // Left clawed hand (canonical)
  const leftHand = new THREE.Mesh(
    new THREE.BoxGeometry(0.06 * s, 0.05 * s, 0.04 * s),
    darkSkinMaterial
  );
  leftHand.position.set(-0.26 * s, 0.18 * s, 0.03 * s);
  group.add(leftHand);

  // Left claws
  const clawGeo = new THREE.BoxGeometry(0.01 * s, 0.04 * s, 0.01 * s);
  for (let i = 0; i < 4; i++) {
    const claw = new THREE.Mesh(clawGeo, clawMaterial);
    claw.position.set((-0.24 - i * 0.015) * s, 0.14 * s, 0.04 * s);
    claw.rotation.x = -0.3;
    group.add(claw);
  }

  // Right arm
  const rightUpperArm = new THREE.Mesh(upperArmGeo, skinMaterial);
  rightUpperArm.position.set(0.2 * s, 0.44 * s, 0);
  rightUpperArm.rotation.z = -0.2;
  group.add(rightUpperArm);

  const rightLowerArm = new THREE.Mesh(lowerArmGeo, skinMaterial);
  rightLowerArm.position.set(0.24 * s, 0.28 * s, 0.02 * s);
  rightLowerArm.rotation.z = -0.15;
  group.add(rightLowerArm);

  // Right clawed hand
  const rightHand = new THREE.Mesh(
    new THREE.BoxGeometry(0.06 * s, 0.05 * s, 0.04 * s),
    darkSkinMaterial
  );
  rightHand.position.set(0.26 * s, 0.18 * s, 0.03 * s);
  group.add(rightHand);

  // Right claws
  for (let i = 0; i < 4; i++) {
    const claw = new THREE.Mesh(clawGeo, clawMaterial);
    claw.position.set((0.24 + i * 0.015) * s, 0.14 * s, 0.04 * s);
    claw.rotation.x = -0.3;
    group.add(claw);
  }

  // === LEGS ===
  const thighGeo = new THREE.BoxGeometry(0.1 * s, 0.16 * s, 0.09 * s);
  const shinGeo = new THREE.BoxGeometry(0.08 * s, 0.14 * s, 0.07 * s);

  // Left leg
  const leftThigh = new THREE.Mesh(thighGeo, skinMaterial);
  leftThigh.position.set(-0.08 * s, 0.2 * s, 0);
  group.add(leftThigh);

  const leftShin = new THREE.Mesh(shinGeo, skinMaterial);
  leftShin.position.set(-0.08 * s, 0.06 * s, 0);
  group.add(leftShin);

  // Right leg
  const rightThigh = new THREE.Mesh(thighGeo, skinMaterial);
  rightThigh.position.set(0.08 * s, 0.2 * s, 0);
  group.add(rightThigh);

  const rightShin = new THREE.Mesh(shinGeo, skinMaterial);
  rightShin.position.set(0.08 * s, 0.06 * s, 0);
  group.add(rightShin);

  // Clawed feet
  const footGeo = new THREE.BoxGeometry(0.07 * s, 0.03 * s, 0.1 * s);

  const leftFoot = new THREE.Mesh(footGeo, darkSkinMaterial);
  leftFoot.position.set(-0.08 * s, -0.01 * s, 0.02 * s);
  group.add(leftFoot);

  const rightFoot = new THREE.Mesh(footGeo, darkSkinMaterial);
  rightFoot.position.set(0.08 * s, -0.01 * s, 0.02 * s);
  group.add(rightFoot);

  // Toe claws
  const toeClawGeo = new THREE.BoxGeometry(0.012 * s, 0.025 * s, 0.012 * s);
  for (let i = 0; i < 3; i++) {
    const leftToeClaw = new THREE.Mesh(toeClawGeo, clawMaterial);
    leftToeClaw.position.set((-0.065 - i * 0.02) * s, -0.02 * s, 0.08 * s);
    group.add(leftToeClaw);

    const rightToeClaw = new THREE.Mesh(toeClawGeo, clawMaterial);
    rightToeClaw.position.set((0.065 + i * 0.02) * s, -0.02 * s, 0.08 * s);
    group.add(rightToeClaw);
  }

  // === TAIL ===
  const tailSegments = [
    { w: 0.05, y: 0.28, z: -0.1 },
    { w: 0.04, y: 0.24, z: -0.18 },
    { w: 0.03, y: 0.2, z: -0.26 },
    { w: 0.025, y: 0.18, z: -0.32 },
  ];

  tailSegments.forEach((seg) => {
    const tailSeg = new THREE.Mesh(
      new THREE.BoxGeometry(seg.w * s, seg.w * s, 0.08 * s),
      darkSkinMaterial
    );
    tailSeg.position.set(0, seg.y * s, seg.z * s);
    group.add(tailSeg);
  });

  // Tail tip (pointed)
  const tailTip = new THREE.Mesh(
    new THREE.BoxGeometry(0.04 * s, 0.04 * s, 0.04 * s),
    darkSkinMaterial
  );
  tailTip.position.set(0, 0.16 * s, -0.38 * s);
  tailTip.rotation.z = Math.PI / 4;
  group.add(tailTip);

  // === FLAMES (canonical - "flames dancing across their body") ===
  const flameGeo = new THREE.BoxGeometry(0.03 * s, 0.06 * s, 0.02 * s);
  const flameCoreGeo = new THREE.BoxGeometry(0.02 * s, 0.04 * s, 0.015 * s);

  const flamePositions = [
    // Shoulders
    { x: -0.2, y: 0.62, z: 0.02 },
    { x: 0.2, y: 0.64, z: 0 },
    // Back
    { x: -0.08, y: 0.5, z: -0.1 },
    { x: 0.06, y: 0.48, z: -0.1 },
    { x: 0, y: 0.54, z: -0.1 },
    // Arms
    { x: -0.22, y: 0.36, z: 0.04 },
    { x: 0.24, y: 0.34, z: 0.02 },
    // Head
    { x: -0.04, y: 0.84, z: -0.04 },
    { x: 0.04, y: 0.82, z: -0.04 },
  ];

  flamePositions.forEach((pos, idx) => {
    const flame = new THREE.Mesh(flameGeo, flameMaterial);
    flame.position.set(pos.x * s, pos.y * s, pos.z * s);
    flame.rotation.x = -0.2 + (idx % 3) * 0.1;
    flame.rotation.z = (idx % 2 === 0 ? 0.1 : -0.1);
    group.add(flame);

    const flameCore = new THREE.Mesh(flameCoreGeo, flameCoreMaterial);
    flameCore.position.set(pos.x * s, (pos.y - 0.01) * s, (pos.z + 0.01) * s);
    group.add(flameCore);
  });

  // Larger flames on hands (Fire Strike ability)
  const handFlameGeo = new THREE.BoxGeometry(0.04 * s, 0.08 * s, 0.03 * s);

  const leftHandFlame = new THREE.Mesh(handFlameGeo, flameMaterial);
  leftHandFlame.position.set(-0.26 * s, 0.22 * s, 0.06 * s);
  group.add(leftHandFlame);

  const leftHandFlameCore = new THREE.Mesh(
    new THREE.BoxGeometry(0.025 * s, 0.05 * s, 0.02 * s),
    flameCoreMaterial
  );
  leftHandFlameCore.position.set(-0.26 * s, 0.2 * s, 0.07 * s);
  group.add(leftHandFlameCore);

  const rightHandFlame = new THREE.Mesh(handFlameGeo, flameMaterial);
  rightHandFlame.position.set(0.26 * s, 0.22 * s, 0.06 * s);
  group.add(rightHandFlame);

  const rightHandFlameCore = new THREE.Mesh(
    new THREE.BoxGeometry(0.025 * s, 0.05 * s, 0.02 * s),
    flameCoreMaterial
  );
  rightHandFlameCore.position.set(0.26 * s, 0.2 * s, 0.07 * s);
  group.add(rightHandFlameCore);

  return group;
}

export const DEMON_META = {
  id: 'demon',
  name: 'Demon',
  category: 'enemy' as const,
  description: 'Red-skinned humanoid with horns, clawed hands, and flames dancing across their body - canonical design',
  defaultScale: 1.0,
  boundingBox: { x: 0.6, y: 1.0, z: 0.5 },
  tags: ['demon', 'fire', 'enemy', 'creature', 'monster', 'humanoid', 'canonical'],
  enemyName: 'Demon',
};
