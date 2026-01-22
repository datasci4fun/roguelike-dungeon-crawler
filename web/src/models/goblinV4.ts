/**
 * Goblin Enemy Model v4
 * Canonical design based on bestiary appearance.
 *
 * Canonical appearance from bestiary:
 * "Small green-skinned humanoid with pointed ears and sharp teeth. Wears crude leather scraps."
 */

import * as THREE from 'three';
import { createMaterial } from './materials';

export interface GoblinV4Options {
  scale?: number;
}

export function createGoblinV4(options: GoblinV4Options = {}): THREE.Group {
  const { scale = 1.0 } = options;

  const group = new THREE.Group();
  const s = scale * 0.8; // Small humanoid

  // === MATERIALS ===
  // Green skin (canonical)
  const skinMaterial = new THREE.MeshStandardMaterial({
    color: 0x4a8a3a, // Bright goblin green
    roughness: 0.8,
    metalness: 0.0,
  });

  const darkSkinMaterial = new THREE.MeshStandardMaterial({
    color: 0x3a6a2a,
    roughness: 0.85,
    metalness: 0.0,
  });

  // Beady yellow eyes
  const eyeMaterial = new THREE.MeshStandardMaterial({
    color: 0xffdd00,
    roughness: 0.3,
    emissive: 0xaa8800,
    emissiveIntensity: 0.4,
  });

  // Sharp teeth
  const toothMaterial = new THREE.MeshStandardMaterial({
    color: 0xffffee,
    roughness: 0.5,
    metalness: 0.0,
  });

  // Crude leather scraps
  const leatherMaterial = createMaterial('leather');

  // === HEAD ===
  // Large head relative to body (goblin proportions)
  const head = new THREE.Mesh(
    new THREE.BoxGeometry(0.12 * s, 0.1 * s, 0.1 * s),
    skinMaterial
  );
  head.position.y = 0.52 * s;
  group.add(head);

  // Bulbous forehead
  const forehead = new THREE.Mesh(
    new THREE.SphereGeometry(0.06 * s, 6, 4),
    skinMaterial
  );
  forehead.position.set(0, 0.56 * s, 0.02 * s);
  forehead.scale.set(1.2, 0.8, 0.9);
  group.add(forehead);

  // Pointed ears (canonical)
  const earGeo = new THREE.BoxGeometry(0.025 * s, 0.08 * s, 0.015 * s);

  const leftEar = new THREE.Mesh(earGeo, skinMaterial);
  leftEar.position.set(-0.08 * s, 0.54 * s, 0);
  leftEar.rotation.z = 0.6;
  leftEar.rotation.y = -0.2;
  group.add(leftEar);

  const rightEar = new THREE.Mesh(earGeo, skinMaterial);
  rightEar.position.set(0.08 * s, 0.54 * s, 0);
  rightEar.rotation.z = -0.6;
  rightEar.rotation.y = 0.2;
  group.add(rightEar);

  // Ear tips
  const earTipGeo = new THREE.BoxGeometry(0.015 * s, 0.03 * s, 0.01 * s);

  const leftEarTip = new THREE.Mesh(earTipGeo, darkSkinMaterial);
  leftEarTip.position.set(-0.11 * s, 0.58 * s, 0);
  leftEarTip.rotation.z = 0.7;
  group.add(leftEarTip);

  const rightEarTip = new THREE.Mesh(earTipGeo, darkSkinMaterial);
  rightEarTip.position.set(0.11 * s, 0.58 * s, 0);
  rightEarTip.rotation.z = -0.7;
  group.add(rightEarTip);

  // Large beady eyes
  const eyeGeo = new THREE.SphereGeometry(0.022 * s, 6, 4);

  const leftEye = new THREE.Mesh(eyeGeo, eyeMaterial);
  leftEye.position.set(-0.035 * s, 0.54 * s, 0.06 * s);
  group.add(leftEye);

  const rightEye = new THREE.Mesh(eyeGeo, eyeMaterial);
  rightEye.position.set(0.035 * s, 0.54 * s, 0.06 * s);
  group.add(rightEye);

  // Long pointy nose
  const nose = new THREE.Mesh(
    new THREE.BoxGeometry(0.025 * s, 0.03 * s, 0.04 * s),
    darkSkinMaterial
  );
  nose.position.set(0, 0.5 * s, 0.07 * s);
  group.add(nose);

  // Wide mouth
  const mouth = new THREE.Mesh(
    new THREE.BoxGeometry(0.06 * s, 0.015 * s, 0.02 * s),
    new THREE.MeshStandardMaterial({ color: 0x2a1a1a, roughness: 0.9 })
  );
  mouth.position.set(0, 0.46 * s, 0.06 * s);
  group.add(mouth);

  // Sharp teeth (canonical) - jagged and visible
  const toothGeo = new THREE.BoxGeometry(0.008 * s, 0.015 * s, 0.008 * s);

  // Upper teeth
  for (let i = 0; i < 4; i++) {
    const tooth = new THREE.Mesh(toothGeo, toothMaterial);
    tooth.position.set((-0.02 + i * 0.013) * s, 0.455 * s, 0.065 * s);
    tooth.rotation.x = 0.1;
    group.add(tooth);
  }

  // Lower fangs (larger, more prominent)
  const fangGeo = new THREE.BoxGeometry(0.01 * s, 0.02 * s, 0.01 * s);

  const leftFang = new THREE.Mesh(fangGeo, toothMaterial);
  leftFang.position.set(-0.02 * s, 0.45 * s, 0.065 * s);
  group.add(leftFang);

  const rightFang = new THREE.Mesh(fangGeo, toothMaterial);
  rightFang.position.set(0.02 * s, 0.45 * s, 0.065 * s);
  group.add(rightFang);

  // === TORSO (small, wiry) ===
  const torso = new THREE.Mesh(
    new THREE.BoxGeometry(0.14 * s, 0.16 * s, 0.1 * s),
    skinMaterial
  );
  torso.position.y = 0.36 * s;
  torso.rotation.x = 0.15; // Slightly hunched
  group.add(torso);

  // Ribs visible (skinny)
  const ribGeo = new THREE.BoxGeometry(0.12 * s, 0.01 * s, 0.08 * s);
  for (let i = 0; i < 3; i++) {
    const rib = new THREE.Mesh(ribGeo, darkSkinMaterial);
    rib.position.set(0, (0.38 - i * 0.04) * s, 0.04 * s);
    group.add(rib);
  }

  // Pot belly
  const belly = new THREE.Mesh(
    new THREE.SphereGeometry(0.06 * s, 6, 4),
    skinMaterial
  );
  belly.position.set(0, 0.3 * s, 0.04 * s);
  belly.scale.set(1, 0.8, 0.9);
  group.add(belly);

  // === CRUDE LEATHER SCRAPS (canonical) ===
  // Ragged loincloth
  const loincloth = new THREE.Mesh(
    new THREE.BoxGeometry(0.1 * s, 0.06 * s, 0.08 * s),
    leatherMaterial
  );
  loincloth.position.set(0, 0.24 * s, 0.02 * s);
  group.add(loincloth);

  // Front flap
  const frontFlap = new THREE.Mesh(
    new THREE.BoxGeometry(0.06 * s, 0.08 * s, 0.015 * s),
    leatherMaterial
  );
  frontFlap.position.set(0, 0.2 * s, 0.05 * s);
  frontFlap.rotation.x = 0.2;
  group.add(frontFlap);

  // Shoulder strap (one side only - scrappy)
  const shoulderStrap = new THREE.Mesh(
    new THREE.BoxGeometry(0.025 * s, 0.18 * s, 0.015 * s),
    leatherMaterial
  );
  shoulderStrap.position.set(-0.05 * s, 0.38 * s, 0.05 * s);
  shoulderStrap.rotation.z = 0.3;
  group.add(shoulderStrap);

  // Scrap on arm
  const armScrap = new THREE.Mesh(
    new THREE.BoxGeometry(0.04 * s, 0.03 * s, 0.035 * s),
    leatherMaterial
  );
  armScrap.position.set(0.12 * s, 0.34 * s, 0);
  group.add(armScrap);

  // === ARMS (thin, wiry) ===
  const upperArmGeo = new THREE.BoxGeometry(0.04 * s, 0.1 * s, 0.035 * s);
  const lowerArmGeo = new THREE.BoxGeometry(0.035 * s, 0.1 * s, 0.03 * s);

  // Left arm
  const leftUpperArm = new THREE.Mesh(upperArmGeo, skinMaterial);
  leftUpperArm.position.set(-0.1 * s, 0.36 * s, 0);
  leftUpperArm.rotation.z = 0.3;
  group.add(leftUpperArm);

  const leftLowerArm = new THREE.Mesh(lowerArmGeo, skinMaterial);
  leftLowerArm.position.set(-0.14 * s, 0.26 * s, 0.02 * s);
  leftLowerArm.rotation.z = 0.2;
  group.add(leftLowerArm);

  // Left hand with claws
  const leftHand = new THREE.Mesh(
    new THREE.BoxGeometry(0.035 * s, 0.03 * s, 0.025 * s),
    darkSkinMaterial
  );
  leftHand.position.set(-0.16 * s, 0.2 * s, 0.03 * s);
  group.add(leftHand);

  // Left claws
  const clawGeo = new THREE.BoxGeometry(0.006 * s, 0.02 * s, 0.006 * s);
  for (let i = 0; i < 3; i++) {
    const claw = new THREE.Mesh(clawGeo, toothMaterial);
    claw.position.set((-0.155 - i * 0.012) * s, 0.185 * s, 0.035 * s);
    claw.rotation.x = -0.3;
    group.add(claw);
  }

  // Right arm
  const rightUpperArm = new THREE.Mesh(upperArmGeo, skinMaterial);
  rightUpperArm.position.set(0.1 * s, 0.36 * s, 0);
  rightUpperArm.rotation.z = -0.25;
  group.add(rightUpperArm);

  const rightLowerArm = new THREE.Mesh(lowerArmGeo, skinMaterial);
  rightLowerArm.position.set(0.14 * s, 0.26 * s, 0.02 * s);
  rightLowerArm.rotation.z = -0.15;
  group.add(rightLowerArm);

  // Right hand with claws
  const rightHand = new THREE.Mesh(
    new THREE.BoxGeometry(0.035 * s, 0.03 * s, 0.025 * s),
    darkSkinMaterial
  );
  rightHand.position.set(0.16 * s, 0.2 * s, 0.03 * s);
  group.add(rightHand);

  // Right claws
  for (let i = 0; i < 3; i++) {
    const claw = new THREE.Mesh(clawGeo, toothMaterial);
    claw.position.set((0.155 + i * 0.012) * s, 0.185 * s, 0.035 * s);
    claw.rotation.x = -0.3;
    group.add(claw);
  }

  // === LEGS (short, bowed) ===
  const thighGeo = new THREE.BoxGeometry(0.045 * s, 0.1 * s, 0.04 * s);
  const shinGeo = new THREE.BoxGeometry(0.035 * s, 0.08 * s, 0.035 * s);

  // Left leg
  const leftThigh = new THREE.Mesh(thighGeo, skinMaterial);
  leftThigh.position.set(-0.05 * s, 0.18 * s, 0);
  leftThigh.rotation.z = 0.1; // Bowed
  group.add(leftThigh);

  const leftShin = new THREE.Mesh(shinGeo, skinMaterial);
  leftShin.position.set(-0.06 * s, 0.08 * s, 0);
  leftShin.rotation.z = -0.1;
  group.add(leftShin);

  // Right leg
  const rightThigh = new THREE.Mesh(thighGeo, skinMaterial);
  rightThigh.position.set(0.05 * s, 0.18 * s, 0);
  rightThigh.rotation.z = -0.1; // Bowed
  group.add(rightThigh);

  const rightShin = new THREE.Mesh(shinGeo, skinMaterial);
  rightShin.position.set(0.06 * s, 0.08 * s, 0);
  rightShin.rotation.z = 0.1;
  group.add(rightShin);

  // Feet (large, clawed)
  const footGeo = new THREE.BoxGeometry(0.04 * s, 0.02 * s, 0.07 * s);

  const leftFoot = new THREE.Mesh(footGeo, darkSkinMaterial);
  leftFoot.position.set(-0.055 * s, 0.025 * s, 0.015 * s);
  group.add(leftFoot);

  const rightFoot = new THREE.Mesh(footGeo, darkSkinMaterial);
  rightFoot.position.set(0.055 * s, 0.025 * s, 0.015 * s);
  group.add(rightFoot);

  // Toe claws
  const toeClawGeo = new THREE.BoxGeometry(0.008 * s, 0.015 * s, 0.008 * s);

  for (let i = 0; i < 3; i++) {
    const leftToeClaw = new THREE.Mesh(toeClawGeo, toothMaterial);
    leftToeClaw.position.set((-0.045 - i * 0.012) * s, 0.02 * s, 0.05 * s);
    group.add(leftToeClaw);

    const rightToeClaw = new THREE.Mesh(toeClawGeo, toothMaterial);
    rightToeClaw.position.set((0.045 + i * 0.012) * s, 0.02 * s, 0.05 * s);
    group.add(rightToeClaw);
  }

  return group;
}

export const GOBLIN_V4_META = {
  id: 'goblin-v4',
  name: 'Goblin v4',
  category: 'enemy' as const,
  description: 'Small green-skinned humanoid with pointed ears and sharp teeth, wearing crude leather scraps - canonical design',
  defaultScale: 1.0,
  boundingBox: { x: 0.4, y: 0.55, z: 0.25 },
  tags: ['goblin', 'enemy', 'creature', 'monster', 'humanoid', 'canonical'],
  enemyName: 'Goblin',
  version: 4,
  isActive: true,
  baseModelId: 'goblin',
};
