/**
 * Goblin Enemy Model v2
 * An armored goblin warrior with a rusty blade - more menacing appearance
 */

import * as THREE from 'three';
import { createMaterial } from './materials';

export interface GoblinV2Options {
  scale?: number;
  hasWeapon?: boolean;
}

export function createGoblinV2(options: GoblinV2Options = {}): THREE.Group {
  const { scale = 1.0, hasWeapon = true } = options;

  const group = new THREE.Group();

  // Custom materials - darker, more sickly green
  const skinMaterial = new THREE.MeshStandardMaterial({
    color: 0x3d6b35, // Darker goblin green
    roughness: 0.85,
  });
  const darkSkinMaterial = new THREE.MeshStandardMaterial({
    color: 0x2d4b25,
    roughness: 0.9,
  });
  const eyeMaterial = new THREE.MeshStandardMaterial({
    color: 0xff4400, // Orange-red eyes (more menacing)
    emissive: 0x882200,
    emissiveIntensity: 0.5,
  });
  const armorMaterial = createMaterial('rust');
  const clothMaterial = createMaterial('leather');

  // Dimensions - stockier build
  const bodyW = 0.28 * scale;
  const bodyH = 0.32 * scale;
  const bodyD = 0.18 * scale;
  const headR = 0.13 * scale;

  // === BODY (hunched torso) ===
  const body = new THREE.Mesh(
    new THREE.BoxGeometry(bodyW, bodyH, bodyD),
    skinMaterial
  );
  body.position.y = 0.35 * scale;
  body.rotation.x = 0.25; // More hunched
  group.add(body);

  // === CHEST ARMOR ===
  const chestArmor = new THREE.Mesh(
    new THREE.BoxGeometry(bodyW * 1.1, bodyH * 0.7, bodyD * 0.3),
    armorMaterial
  );
  chestArmor.position.set(0, 0.38 * scale, 0.08 * scale);
  chestArmor.rotation.x = 0.25;
  group.add(chestArmor);

  // === HEAD ===
  const head = new THREE.Mesh(
    new THREE.SphereGeometry(headR, 8, 6),
    skinMaterial
  );
  head.position.set(0, 0.58 * scale, 0.06 * scale);
  head.scale.set(1.1, 0.85, 0.9); // Wider, flatter head
  group.add(head);

  // === EARS (longer, more pointed) ===
  const earGeo = new THREE.ConeGeometry(0.035 * scale, 0.16 * scale, 4);

  const leftEar = new THREE.Mesh(earGeo, skinMaterial);
  leftEar.position.set(-0.12 * scale, 0.62 * scale, 0);
  leftEar.rotation.z = Math.PI / 2.5;
  group.add(leftEar);

  const rightEar = new THREE.Mesh(earGeo, skinMaterial);
  rightEar.position.set(0.12 * scale, 0.62 * scale, 0);
  rightEar.rotation.z = -Math.PI / 2.5;
  group.add(rightEar);

  // === EYES (bigger, angrier) ===
  const eyeGeo = new THREE.SphereGeometry(0.03 * scale, 6, 4);

  const leftEye = new THREE.Mesh(eyeGeo, eyeMaterial);
  leftEye.position.set(-0.045 * scale, 0.6 * scale, 0.11 * scale);
  group.add(leftEye);

  const rightEye = new THREE.Mesh(eyeGeo, eyeMaterial);
  rightEye.position.set(0.045 * scale, 0.6 * scale, 0.11 * scale);
  group.add(rightEye);

  // === BROW RIDGE (angry look) ===
  const browRidge = new THREE.Mesh(
    new THREE.BoxGeometry(0.12 * scale, 0.02 * scale, 0.03 * scale),
    darkSkinMaterial
  );
  browRidge.position.set(0, 0.64 * scale, 0.1 * scale);
  browRidge.rotation.x = 0.3;
  group.add(browRidge);

  // === NOSE (bigger, wartier) ===
  const nose = new THREE.Mesh(
    new THREE.BoxGeometry(0.04 * scale, 0.05 * scale, 0.04 * scale),
    darkSkinMaterial
  );
  nose.position.set(0, 0.54 * scale, 0.13 * scale);
  group.add(nose);

  // === ARMS (thicker) ===
  const armGeo = new THREE.BoxGeometry(0.07 * scale, 0.26 * scale, 0.06 * scale);

  const leftArm = new THREE.Mesh(armGeo, skinMaterial);
  leftArm.position.set(-0.2 * scale, 0.32 * scale, 0);
  leftArm.rotation.z = 0.35;
  group.add(leftArm);

  const rightArm = new THREE.Mesh(armGeo, skinMaterial);
  rightArm.position.set(0.2 * scale, 0.32 * scale, 0);
  rightArm.rotation.z = -0.35;
  group.add(rightArm);

  // === SHOULDER PADS ===
  const shoulderGeo = new THREE.BoxGeometry(0.1 * scale, 0.06 * scale, 0.08 * scale);

  const leftShoulder = new THREE.Mesh(shoulderGeo, armorMaterial);
  leftShoulder.position.set(-0.18 * scale, 0.48 * scale, 0);
  leftShoulder.rotation.z = 0.3;
  group.add(leftShoulder);

  const rightShoulder = new THREE.Mesh(shoulderGeo, armorMaterial);
  rightShoulder.position.set(0.18 * scale, 0.48 * scale, 0);
  rightShoulder.rotation.z = -0.3;
  group.add(rightShoulder);

  // === HANDS ===
  const handGeo = new THREE.BoxGeometry(0.055 * scale, 0.055 * scale, 0.045 * scale);

  const leftHand = new THREE.Mesh(handGeo, darkSkinMaterial);
  leftHand.position.set(-0.25 * scale, 0.16 * scale, 0);
  group.add(leftHand);

  const rightHand = new THREE.Mesh(handGeo, darkSkinMaterial);
  rightHand.position.set(0.25 * scale, 0.16 * scale, 0);
  group.add(rightHand);

  // === LEGS ===
  const legGeo = new THREE.BoxGeometry(0.08 * scale, 0.18 * scale, 0.07 * scale);

  const leftLeg = new THREE.Mesh(legGeo, skinMaterial);
  leftLeg.position.set(-0.09 * scale, 0.1 * scale, 0);
  group.add(leftLeg);

  const rightLeg = new THREE.Mesh(legGeo, skinMaterial);
  rightLeg.position.set(0.09 * scale, 0.1 * scale, 0);
  group.add(rightLeg);

  // === FEET ===
  const footGeo = new THREE.BoxGeometry(0.07 * scale, 0.035 * scale, 0.11 * scale);

  const leftFoot = new THREE.Mesh(footGeo, darkSkinMaterial);
  leftFoot.position.set(-0.09 * scale, 0.017 * scale, 0.02 * scale);
  group.add(leftFoot);

  const rightFoot = new THREE.Mesh(footGeo, darkSkinMaterial);
  rightFoot.position.set(0.09 * scale, 0.017 * scale, 0.02 * scale);
  group.add(rightFoot);

  // === BELT ===
  const belt = new THREE.Mesh(
    new THREE.BoxGeometry(0.28 * scale, 0.04 * scale, 0.16 * scale),
    clothMaterial
  );
  belt.position.set(0, 0.22 * scale, 0);
  group.add(belt);

  // === WEAPON (rusty blade) ===
  if (hasWeapon) {
    // Blade handle
    const handle = new THREE.Mesh(
      new THREE.BoxGeometry(0.025 * scale, 0.12 * scale, 0.025 * scale),
      createMaterial('darkWood')
    );
    handle.position.set(0.32 * scale, 0.22 * scale, 0);
    handle.rotation.z = -0.6;
    group.add(handle);

    // Blade
    const blade = new THREE.Mesh(
      new THREE.BoxGeometry(0.02 * scale, 0.2 * scale, 0.06 * scale),
      armorMaterial
    );
    blade.position.set(0.38 * scale, 0.35 * scale, 0);
    blade.rotation.z = -0.6;
    group.add(blade);

    // Blade tip (tapered)
    const bladeTip = new THREE.Mesh(
      new THREE.ConeGeometry(0.03 * scale, 0.08 * scale, 4),
      armorMaterial
    );
    bladeTip.position.set(0.42 * scale, 0.46 * scale, 0);
    bladeTip.rotation.z = -0.6 - Math.PI / 2;
    group.add(bladeTip);
  }

  return group;
}

export const GOBLIN_V2_META = {
  id: 'goblin-v2',
  name: 'Goblin',
  category: 'enemy' as const,
  description: 'An armored goblin warrior with rusty blade - v2 design',
  defaultScale: 1.0,
  boundingBox: { x: 0.55, y: 0.75, z: 0.35 },
  tags: ['goblin', 'enemy', 'creature', 'monster', 'humanoid', 'armored'],
  enemyName: 'Goblin',
  // Version fields
  version: 2,
  isActive: true,
  baseModelId: 'goblin',
};
