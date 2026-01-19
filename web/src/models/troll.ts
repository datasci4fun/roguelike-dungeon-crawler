/**
 * Troll Enemy Model
 * Canonical design based on bestiary appearance.
 *
 * Canonical appearance from bestiary:
 * "Towering humanoid with gray warty skin, long arms, and a hunched posture."
 */

import * as THREE from 'three';

export interface TrollOptions {
  scale?: number;
}

export function createTroll(options: TrollOptions = {}): THREE.Group {
  const { scale = 1.0 } = options;

  const group = new THREE.Group();
  const s = scale * 1.5; // Towering humanoid

  // === MATERIALS ===
  // Gray warty skin (canonical)
  const skinMaterial = new THREE.MeshStandardMaterial({
    color: 0x5a5a5a, // Gray
    roughness: 0.9,
    metalness: 0.0,
  });

  const darkSkinMaterial = new THREE.MeshStandardMaterial({
    color: 0x4a4a4a,
    roughness: 0.95,
    metalness: 0.0,
  });

  // Wart material (slightly different shade)
  const wartMaterial = new THREE.MeshStandardMaterial({
    color: 0x4a4a4a,
    roughness: 0.85,
    metalness: 0.0,
  });

  // Small beady eyes
  const eyeMaterial = new THREE.MeshStandardMaterial({
    color: 0xaa4400,
    roughness: 0.4,
    emissive: 0x551100,
    emissiveIntensity: 0.3,
  });

  // Yellowed teeth/nails
  const toothMaterial = new THREE.MeshStandardMaterial({
    color: 0xcccc99,
    roughness: 0.6,
    metalness: 0.0,
  });

  // === HEAD (small relative to body) ===
  const head = new THREE.Mesh(
    new THREE.BoxGeometry(0.14 * s, 0.12 * s, 0.12 * s),
    skinMaterial
  );
  head.position.set(0, 0.72 * s, 0.08 * s); // Forward due to hunch
  group.add(head);

  // Heavy brow
  const brow = new THREE.Mesh(
    new THREE.BoxGeometry(0.15 * s, 0.03 * s, 0.06 * s),
    darkSkinMaterial
  );
  brow.position.set(0, 0.77 * s, 0.12 * s);
  group.add(brow);

  // Small beady eyes (deep set)
  const eyeGeo = new THREE.SphereGeometry(0.015 * s, 6, 4);

  const leftEye = new THREE.Mesh(eyeGeo, eyeMaterial);
  leftEye.position.set(-0.035 * s, 0.74 * s, 0.14 * s);
  group.add(leftEye);

  const rightEye = new THREE.Mesh(eyeGeo, eyeMaterial);
  rightEye.position.set(0.035 * s, 0.74 * s, 0.14 * s);
  group.add(rightEye);

  // Large nose
  const nose = new THREE.Mesh(
    new THREE.BoxGeometry(0.04 * s, 0.05 * s, 0.04 * s),
    darkSkinMaterial
  );
  nose.position.set(0, 0.7 * s, 0.15 * s);
  group.add(nose);

  // Wide jaw
  const jaw = new THREE.Mesh(
    new THREE.BoxGeometry(0.12 * s, 0.05 * s, 0.1 * s),
    skinMaterial
  );
  jaw.position.set(0, 0.65 * s, 0.1 * s);
  group.add(jaw);

  // Underbite with teeth
  const toothGeo = new THREE.BoxGeometry(0.015 * s, 0.025 * s, 0.015 * s);

  const leftTooth = new THREE.Mesh(toothGeo, toothMaterial);
  leftTooth.position.set(-0.03 * s, 0.68 * s, 0.16 * s);
  group.add(leftTooth);

  const rightTooth = new THREE.Mesh(toothGeo, toothMaterial);
  rightTooth.position.set(0.03 * s, 0.68 * s, 0.16 * s);
  group.add(rightTooth);

  // Small ears
  const earGeo = new THREE.BoxGeometry(0.03 * s, 0.05 * s, 0.02 * s);

  const leftEar = new THREE.Mesh(earGeo, skinMaterial);
  leftEar.position.set(-0.08 * s, 0.74 * s, 0.06 * s);
  group.add(leftEar);

  const rightEar = new THREE.Mesh(earGeo, skinMaterial);
  rightEar.position.set(0.08 * s, 0.74 * s, 0.06 * s);
  group.add(rightEar);

  // Head warts
  const headWart1 = new THREE.Mesh(
    new THREE.SphereGeometry(0.015 * s, 4, 4),
    wartMaterial
  );
  headWart1.position.set(-0.05 * s, 0.78 * s, 0.1 * s);
  group.add(headWart1);

  const headWart2 = new THREE.Mesh(
    new THREE.SphereGeometry(0.012 * s, 4, 4),
    wartMaterial
  );
  headWart2.position.set(0.04 * s, 0.76 * s, 0.08 * s);
  group.add(headWart2);

  // === NECK (thick, hunched forward) ===
  const neck = new THREE.Mesh(
    new THREE.BoxGeometry(0.12 * s, 0.08 * s, 0.1 * s),
    skinMaterial
  );
  neck.position.set(0, 0.64 * s, 0.04 * s);
  neck.rotation.x = 0.3; // Hunched
  group.add(neck);

  // === TORSO (massive, hunched) ===
  const torso = new THREE.Mesh(
    new THREE.BoxGeometry(0.35 * s, 0.32 * s, 0.25 * s),
    skinMaterial
  );
  torso.position.set(0, 0.46 * s, 0);
  torso.rotation.x = 0.25; // Hunched posture (canonical)
  group.add(torso);

  // Hunchback
  const hunch = new THREE.Mesh(
    new THREE.SphereGeometry(0.12 * s, 6, 6),
    skinMaterial
  );
  hunch.position.set(0, 0.56 * s, -0.08 * s);
  hunch.scale.set(1.2, 0.8, 1);
  group.add(hunch);

  // Belly
  const belly = new THREE.Mesh(
    new THREE.BoxGeometry(0.28 * s, 0.18 * s, 0.2 * s),
    skinMaterial
  );
  belly.position.set(0, 0.28 * s, 0.04 * s);
  group.add(belly);

  // Torso warts
  const torsoWarts = [
    { x: -0.12, y: 0.5, z: 0.12, r: 0.018 },
    { x: 0.14, y: 0.48, z: 0.1, r: 0.015 },
    { x: -0.08, y: 0.38, z: 0.14, r: 0.02 },
    { x: 0.1, y: 0.32, z: 0.12, r: 0.016 },
    { x: 0, y: 0.52, z: -0.1, r: 0.022 },
  ];

  torsoWarts.forEach((w) => {
    const wart = new THREE.Mesh(
      new THREE.SphereGeometry(w.r * s, 4, 4),
      wartMaterial
    );
    wart.position.set(w.x * s, w.y * s, w.z * s);
    group.add(wart);
  });

  // === SHOULDERS ===
  const shoulderGeo = new THREE.SphereGeometry(0.08 * s, 6, 6);

  const leftShoulder = new THREE.Mesh(shoulderGeo, skinMaterial);
  leftShoulder.position.set(-0.22 * s, 0.52 * s, 0);
  group.add(leftShoulder);

  const rightShoulder = new THREE.Mesh(shoulderGeo, skinMaterial);
  rightShoulder.position.set(0.22 * s, 0.52 * s, 0);
  group.add(rightShoulder);

  // === ARMS (long - canonical) ===
  // Left arm - very long, reaches past knee
  const leftUpperArm = new THREE.Mesh(
    new THREE.BoxGeometry(0.1 * s, 0.22 * s, 0.09 * s),
    skinMaterial
  );
  leftUpperArm.position.set(-0.26 * s, 0.38 * s, 0.02 * s);
  leftUpperArm.rotation.z = 0.15;
  group.add(leftUpperArm);

  const leftLowerArm = new THREE.Mesh(
    new THREE.BoxGeometry(0.08 * s, 0.24 * s, 0.07 * s),
    skinMaterial
  );
  leftLowerArm.position.set(-0.3 * s, 0.16 * s, 0.04 * s);
  leftLowerArm.rotation.z = 0.1;
  group.add(leftLowerArm);

  // Left hand (large for crushing blow)
  const leftHand = new THREE.Mesh(
    new THREE.BoxGeometry(0.1 * s, 0.08 * s, 0.06 * s),
    darkSkinMaterial
  );
  leftHand.position.set(-0.32 * s, 0.02 * s, 0.05 * s);
  group.add(leftHand);

  // Left hand fingers
  const fingerGeo = new THREE.BoxGeometry(0.025 * s, 0.05 * s, 0.025 * s);
  for (let i = 0; i < 4; i++) {
    const finger = new THREE.Mesh(fingerGeo, darkSkinMaterial);
    finger.position.set((-0.28 - i * 0.025) * s, -0.02 * s, 0.06 * s);
    group.add(finger);
  }

  // Left arm warts
  const leftArmWart = new THREE.Mesh(
    new THREE.SphereGeometry(0.015 * s, 4, 4),
    wartMaterial
  );
  leftArmWart.position.set(-0.28 * s, 0.28 * s, 0.06 * s);
  group.add(leftArmWart);

  // Right arm
  const rightUpperArm = new THREE.Mesh(
    new THREE.BoxGeometry(0.1 * s, 0.22 * s, 0.09 * s),
    skinMaterial
  );
  rightUpperArm.position.set(0.26 * s, 0.38 * s, 0.02 * s);
  rightUpperArm.rotation.z = -0.15;
  group.add(rightUpperArm);

  const rightLowerArm = new THREE.Mesh(
    new THREE.BoxGeometry(0.08 * s, 0.24 * s, 0.07 * s),
    skinMaterial
  );
  rightLowerArm.position.set(0.3 * s, 0.16 * s, 0.04 * s);
  rightLowerArm.rotation.z = -0.1;
  group.add(rightLowerArm);

  // Right hand (large)
  const rightHand = new THREE.Mesh(
    new THREE.BoxGeometry(0.1 * s, 0.08 * s, 0.06 * s),
    darkSkinMaterial
  );
  rightHand.position.set(0.32 * s, 0.02 * s, 0.05 * s);
  group.add(rightHand);

  // Right hand fingers
  for (let i = 0; i < 4; i++) {
    const finger = new THREE.Mesh(fingerGeo, darkSkinMaterial);
    finger.position.set((0.28 + i * 0.025) * s, -0.02 * s, 0.06 * s);
    group.add(finger);
  }

  // Right arm warts
  const rightArmWart = new THREE.Mesh(
    new THREE.SphereGeometry(0.018 * s, 4, 4),
    wartMaterial
  );
  rightArmWart.position.set(0.32 * s, 0.22 * s, 0.05 * s);
  group.add(rightArmWart);

  // === LEGS (thick, sturdy) ===
  const thighGeo = new THREE.BoxGeometry(0.12 * s, 0.18 * s, 0.11 * s);
  const shinGeo = new THREE.BoxGeometry(0.1 * s, 0.16 * s, 0.09 * s);

  // Left leg
  const leftThigh = new THREE.Mesh(thighGeo, skinMaterial);
  leftThigh.position.set(-0.1 * s, 0.14 * s, 0);
  group.add(leftThigh);

  const leftShin = new THREE.Mesh(shinGeo, skinMaterial);
  leftShin.position.set(-0.1 * s, -0.02 * s, 0);
  group.add(leftShin);

  // Right leg
  const rightThigh = new THREE.Mesh(thighGeo, skinMaterial);
  rightThigh.position.set(0.1 * s, 0.14 * s, 0);
  group.add(rightThigh);

  const rightShin = new THREE.Mesh(shinGeo, skinMaterial);
  rightShin.position.set(0.1 * s, -0.02 * s, 0);
  group.add(rightShin);

  // Leg warts
  const legWart1 = new THREE.Mesh(
    new THREE.SphereGeometry(0.016 * s, 4, 4),
    wartMaterial
  );
  legWart1.position.set(-0.14 * s, 0.08 * s, 0.05 * s);
  group.add(legWart1);

  const legWart2 = new THREE.Mesh(
    new THREE.SphereGeometry(0.014 * s, 4, 4),
    wartMaterial
  );
  legWart2.position.set(0.12 * s, 0.12 * s, 0.04 * s);
  group.add(legWart2);

  // === FEET (large, flat) ===
  const footGeo = new THREE.BoxGeometry(0.1 * s, 0.04 * s, 0.14 * s);

  const leftFoot = new THREE.Mesh(footGeo, darkSkinMaterial);
  leftFoot.position.set(-0.1 * s, -0.1 * s, 0.03 * s);
  group.add(leftFoot);

  const rightFoot = new THREE.Mesh(footGeo, darkSkinMaterial);
  rightFoot.position.set(0.1 * s, -0.1 * s, 0.03 * s);
  group.add(rightFoot);

  // Toe claws
  const toeClawGeo = new THREE.BoxGeometry(0.02 * s, 0.025 * s, 0.015 * s);

  for (let i = 0; i < 3; i++) {
    const leftClaw = new THREE.Mesh(toeClawGeo, toothMaterial);
    leftClaw.position.set((-0.08 - i * 0.03) * s, -0.1 * s, 0.1 * s);
    group.add(leftClaw);

    const rightClaw = new THREE.Mesh(toeClawGeo, toothMaterial);
    rightClaw.position.set((0.08 + i * 0.03) * s, -0.1 * s, 0.1 * s);
    group.add(rightClaw);
  }

  return group;
}

export const TROLL_META = {
  id: 'troll',
  name: 'Troll',
  category: 'enemy' as const,
  description: 'Towering humanoid with gray warty skin, long arms, and a hunched posture - canonical design',
  defaultScale: 1.0,
  boundingBox: { x: 0.8, y: 1.1, z: 0.5 },
  tags: ['troll', 'enemy', 'creature', 'monster', 'humanoid', 'canonical'],
  enemyName: 'Troll',
};
