/**
 * Goblin Enemy Model
 * A small, hunched goblin creature with pointed ears and menacing eyes
 */

import * as THREE from 'three';
import { createMaterial } from './materials';

export interface GoblinOptions {
  scale?: number;
  hasWeapon?: boolean;
}

export function createGoblin(options: GoblinOptions = {}): THREE.Group {
  const { scale = 1.0, hasWeapon = true } = options;

  const group = new THREE.Group();

  // Custom materials
  const skinMaterial = new THREE.MeshStandardMaterial({
    color: 0x4a7c3f, // Goblin green
    roughness: 0.8,
  });
  const darkSkinMaterial = new THREE.MeshStandardMaterial({
    color: 0x3a5c2f,
    roughness: 0.85,
  });
  const eyeMaterial = new THREE.MeshStandardMaterial({
    color: 0xffcc00, // Yellow eyes
    emissive: 0x664400,
    emissiveIntensity: 0.3,
  });
  const clothMaterial = createMaterial('leather');
  const boneMaterial = createMaterial('bone');

  // Dimensions
  const bodyW = 0.25 * scale;
  const bodyH = 0.3 * scale;
  const bodyD = 0.15 * scale;
  const headR = 0.12 * scale;

  // === BODY (hunched torso) ===
  const body = new THREE.Mesh(
    new THREE.BoxGeometry(bodyW, bodyH, bodyD),
    skinMaterial
  );
  body.position.y = 0.35 * scale;
  body.rotation.x = 0.2; // Slight forward hunch
  group.add(body);

  // === HEAD ===
  const head = new THREE.Mesh(
    new THREE.SphereGeometry(headR, 8, 6),
    skinMaterial
  );
  head.position.set(0, 0.55 * scale, 0.05 * scale);
  head.scale.set(1, 0.9, 0.85); // Slightly squashed
  group.add(head);

  // === EARS (pointed cones) ===
  const earGeo = new THREE.ConeGeometry(0.04 * scale, 0.12 * scale, 4);

  const leftEar = new THREE.Mesh(earGeo, skinMaterial);
  leftEar.position.set(-0.1 * scale, 0.58 * scale, 0);
  leftEar.rotation.z = Math.PI / 3;
  group.add(leftEar);

  const rightEar = new THREE.Mesh(earGeo, skinMaterial);
  rightEar.position.set(0.1 * scale, 0.58 * scale, 0);
  rightEar.rotation.z = -Math.PI / 3;
  group.add(rightEar);

  // === EYES ===
  const eyeGeo = new THREE.SphereGeometry(0.025 * scale, 6, 4);

  const leftEye = new THREE.Mesh(eyeGeo, eyeMaterial);
  leftEye.position.set(-0.04 * scale, 0.57 * scale, 0.1 * scale);
  group.add(leftEye);

  const rightEye = new THREE.Mesh(eyeGeo, eyeMaterial);
  rightEye.position.set(0.04 * scale, 0.57 * scale, 0.1 * scale);
  group.add(rightEye);

  // === NOSE (small box) ===
  const nose = new THREE.Mesh(
    new THREE.BoxGeometry(0.03 * scale, 0.04 * scale, 0.03 * scale),
    darkSkinMaterial
  );
  nose.position.set(0, 0.52 * scale, 0.12 * scale);
  group.add(nose);

  // === ARMS ===
  const armGeo = new THREE.BoxGeometry(0.06 * scale, 0.25 * scale, 0.05 * scale);

  const leftArm = new THREE.Mesh(armGeo, skinMaterial);
  leftArm.position.set(-0.18 * scale, 0.32 * scale, 0);
  leftArm.rotation.z = 0.3;
  group.add(leftArm);

  const rightArm = new THREE.Mesh(armGeo, skinMaterial);
  rightArm.position.set(0.18 * scale, 0.32 * scale, 0);
  rightArm.rotation.z = -0.3;
  group.add(rightArm);

  // === HANDS (small boxes) ===
  const handGeo = new THREE.BoxGeometry(0.05 * scale, 0.05 * scale, 0.04 * scale);

  const leftHand = new THREE.Mesh(handGeo, darkSkinMaterial);
  leftHand.position.set(-0.22 * scale, 0.18 * scale, 0);
  group.add(leftHand);

  const rightHand = new THREE.Mesh(handGeo, darkSkinMaterial);
  rightHand.position.set(0.22 * scale, 0.18 * scale, 0);
  group.add(rightHand);

  // === LEGS ===
  const legGeo = new THREE.BoxGeometry(0.07 * scale, 0.18 * scale, 0.06 * scale);

  const leftLeg = new THREE.Mesh(legGeo, skinMaterial);
  leftLeg.position.set(-0.08 * scale, 0.1 * scale, 0);
  group.add(leftLeg);

  const rightLeg = new THREE.Mesh(legGeo, skinMaterial);
  rightLeg.position.set(0.08 * scale, 0.1 * scale, 0);
  group.add(rightLeg);

  // === FEET (flat boxes) ===
  const footGeo = new THREE.BoxGeometry(0.06 * scale, 0.03 * scale, 0.1 * scale);

  const leftFoot = new THREE.Mesh(footGeo, darkSkinMaterial);
  leftFoot.position.set(-0.08 * scale, 0.015 * scale, 0.02 * scale);
  group.add(leftFoot);

  const rightFoot = new THREE.Mesh(footGeo, darkSkinMaterial);
  rightFoot.position.set(0.08 * scale, 0.015 * scale, 0.02 * scale);
  group.add(rightFoot);

  // === LOINCLOTH ===
  const loincloth = new THREE.Mesh(
    new THREE.BoxGeometry(0.2 * scale, 0.1 * scale, 0.02 * scale),
    clothMaterial
  );
  loincloth.position.set(0, 0.22 * scale, 0.08 * scale);
  group.add(loincloth);

  // === WEAPON (simple club) ===
  if (hasWeapon) {
    const clubHandle = new THREE.Mesh(
      new THREE.BoxGeometry(0.03 * scale, 0.2 * scale, 0.03 * scale),
      createMaterial('darkWood')
    );
    clubHandle.position.set(0.28 * scale, 0.25 * scale, 0);
    clubHandle.rotation.z = -0.5;
    group.add(clubHandle);

    const clubHead = new THREE.Mesh(
      new THREE.BoxGeometry(0.08 * scale, 0.1 * scale, 0.07 * scale),
      boneMaterial
    );
    clubHead.position.set(0.33 * scale, 0.35 * scale, 0);
    clubHead.rotation.z = -0.5;
    group.add(clubHead);
  }

  return group;
}

export const GOBLIN_META = {
  id: 'goblin',
  name: 'Goblin',
  category: 'enemy' as const,
  description: 'A small, hunched goblin enemy with pointed ears and a club',
  defaultScale: 1.0,
  boundingBox: { x: 0.5, y: 0.7, z: 0.3 },
  tags: ['goblin', 'enemy', 'creature', 'monster', 'humanoid'],
  // Maps to EnemyType.GOBLIN in battle
  enemyName: 'Goblin',
};
