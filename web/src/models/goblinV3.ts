/**
 * Goblin Enemy Model v3
 * A goblin shaman with tribal markings, feathers, and a gnarled staff
 */

import * as THREE from 'three';
import { createMaterial } from './materials';

export interface GoblinV3Options {
  scale?: number;
  hasStaff?: boolean;
}

export function createGoblinV3(options: GoblinV3Options = {}): THREE.Group {
  const { scale = 1.0, hasStaff = true } = options;

  const group = new THREE.Group();

  // Custom materials - pale, sickly green for shaman
  const skinMaterial = new THREE.MeshStandardMaterial({
    color: 0x5a8a4f, // Pale green
    roughness: 0.75,
  });
  const darkSkinMaterial = new THREE.MeshStandardMaterial({
    color: 0x3a5a2f,
    roughness: 0.8,
  });
  const eyeMaterial = new THREE.MeshStandardMaterial({
    color: 0x00ff88, // Glowing green eyes (magical)
    emissive: 0x00aa44,
    emissiveIntensity: 0.6,
  });
  const markingMaterial = new THREE.MeshStandardMaterial({
    color: 0x2288ff, // Blue tribal markings
    emissive: 0x1144aa,
    emissiveIntensity: 0.3,
  });
  const clothMaterial = createMaterial('cloth');
  const boneMaterial = createMaterial('bone');
  const woodMaterial = createMaterial('oldWood');

  // Dimensions - slightly taller, thinner build
  const bodyW = 0.22 * scale;
  const bodyH = 0.32 * scale;
  const bodyD = 0.14 * scale;
  const headR = 0.13 * scale;

  // === BODY ===
  const body = new THREE.Mesh(
    new THREE.BoxGeometry(bodyW, bodyH, bodyD),
    skinMaterial
  );
  body.position.y = 0.38 * scale;
  body.rotation.x = 0.15; // Slight hunch
  group.add(body);

  // === TRIBAL MARKING ON CHEST ===
  const chestMarking = new THREE.Mesh(
    new THREE.BoxGeometry(0.08 * scale, 0.12 * scale, 0.01 * scale),
    markingMaterial
  );
  chestMarking.position.set(0, 0.4 * scale, 0.08 * scale);
  group.add(chestMarking);

  // === HEAD ===
  const head = new THREE.Mesh(
    new THREE.SphereGeometry(headR, 8, 6),
    skinMaterial
  );
  head.position.set(0, 0.6 * scale, 0.04 * scale);
  head.scale.set(1, 0.95, 0.9);
  group.add(head);

  // === FACE MARKINGS ===
  const faceMarking1 = new THREE.Mesh(
    new THREE.BoxGeometry(0.02 * scale, 0.06 * scale, 0.01 * scale),
    markingMaterial
  );
  faceMarking1.position.set(-0.06 * scale, 0.58 * scale, 0.12 * scale);
  group.add(faceMarking1);

  const faceMarking2 = new THREE.Mesh(
    new THREE.BoxGeometry(0.02 * scale, 0.06 * scale, 0.01 * scale),
    markingMaterial
  );
  faceMarking2.position.set(0.06 * scale, 0.58 * scale, 0.12 * scale);
  group.add(faceMarking2);

  // === EARS (long, droopy shaman ears) ===
  const earGeo = new THREE.ConeGeometry(0.04 * scale, 0.18 * scale, 4);

  const leftEar = new THREE.Mesh(earGeo, skinMaterial);
  leftEar.position.set(-0.12 * scale, 0.58 * scale, 0);
  leftEar.rotation.z = Math.PI / 2.2;
  leftEar.rotation.x = 0.3; // Droop forward
  group.add(leftEar);

  const rightEar = new THREE.Mesh(earGeo, skinMaterial);
  rightEar.position.set(0.12 * scale, 0.58 * scale, 0);
  rightEar.rotation.z = -Math.PI / 2.2;
  rightEar.rotation.x = 0.3;
  group.add(rightEar);

  // === FEATHERS IN EARS ===
  const featherGeo = new THREE.BoxGeometry(0.01 * scale, 0.1 * scale, 0.02 * scale);

  const leftFeather = new THREE.Mesh(featherGeo, clothMaterial);
  leftFeather.position.set(-0.18 * scale, 0.65 * scale, 0);
  leftFeather.rotation.z = Math.PI / 3;
  group.add(leftFeather);

  const rightFeather = new THREE.Mesh(featherGeo, clothMaterial);
  rightFeather.position.set(0.18 * scale, 0.65 * scale, 0);
  rightFeather.rotation.z = -Math.PI / 3;
  group.add(rightFeather);

  // === EYES (glowing) ===
  const eyeGeo = new THREE.SphereGeometry(0.028 * scale, 6, 4);

  const leftEye = new THREE.Mesh(eyeGeo, eyeMaterial);
  leftEye.position.set(-0.04 * scale, 0.62 * scale, 0.1 * scale);
  group.add(leftEye);

  const rightEye = new THREE.Mesh(eyeGeo, eyeMaterial);
  rightEye.position.set(0.04 * scale, 0.62 * scale, 0.1 * scale);
  group.add(rightEye);

  // === NOSE ===
  const nose = new THREE.Mesh(
    new THREE.BoxGeometry(0.03 * scale, 0.04 * scale, 0.03 * scale),
    darkSkinMaterial
  );
  nose.position.set(0, 0.55 * scale, 0.12 * scale);
  group.add(nose);

  // === ARMS (thinner, longer) ===
  const armGeo = new THREE.BoxGeometry(0.05 * scale, 0.28 * scale, 0.05 * scale);

  const leftArm = new THREE.Mesh(armGeo, skinMaterial);
  leftArm.position.set(-0.16 * scale, 0.32 * scale, 0);
  leftArm.rotation.z = 0.25;
  group.add(leftArm);

  const rightArm = new THREE.Mesh(armGeo, skinMaterial);
  rightArm.position.set(0.16 * scale, 0.32 * scale, 0);
  rightArm.rotation.z = -0.25;
  group.add(rightArm);

  // === HANDS ===
  const handGeo = new THREE.BoxGeometry(0.05 * scale, 0.05 * scale, 0.04 * scale);

  const leftHand = new THREE.Mesh(handGeo, darkSkinMaterial);
  leftHand.position.set(-0.2 * scale, 0.16 * scale, 0);
  group.add(leftHand);

  const rightHand = new THREE.Mesh(handGeo, darkSkinMaterial);
  rightHand.position.set(0.2 * scale, 0.16 * scale, 0);
  group.add(rightHand);

  // === LEGS ===
  const legGeo = new THREE.BoxGeometry(0.065 * scale, 0.18 * scale, 0.055 * scale);

  const leftLeg = new THREE.Mesh(legGeo, skinMaterial);
  leftLeg.position.set(-0.07 * scale, 0.1 * scale, 0);
  group.add(leftLeg);

  const rightLeg = new THREE.Mesh(legGeo, skinMaterial);
  rightLeg.position.set(0.07 * scale, 0.1 * scale, 0);
  group.add(rightLeg);

  // === FEET ===
  const footGeo = new THREE.BoxGeometry(0.06 * scale, 0.03 * scale, 0.1 * scale);

  const leftFoot = new THREE.Mesh(footGeo, darkSkinMaterial);
  leftFoot.position.set(-0.07 * scale, 0.015 * scale, 0.02 * scale);
  group.add(leftFoot);

  const rightFoot = new THREE.Mesh(footGeo, darkSkinMaterial);
  rightFoot.position.set(0.07 * scale, 0.015 * scale, 0.02 * scale);
  group.add(rightFoot);

  // === LOINCLOTH WITH BONE DECORATIONS ===
  const loincloth = new THREE.Mesh(
    new THREE.BoxGeometry(0.18 * scale, 0.12 * scale, 0.02 * scale),
    clothMaterial
  );
  loincloth.position.set(0, 0.2 * scale, 0.07 * scale);
  group.add(loincloth);

  // Bone decoration on belt
  const beltBone = new THREE.Mesh(
    new THREE.CylinderGeometry(0.015 * scale, 0.01 * scale, 0.08 * scale, 6),
    boneMaterial
  );
  beltBone.position.set(-0.08 * scale, 0.22 * scale, 0.08 * scale);
  beltBone.rotation.z = Math.PI / 4;
  group.add(beltBone);

  // === SKULL NECKLACE ===
  const skullGeo = new THREE.SphereGeometry(0.03 * scale, 6, 4);
  const skull = new THREE.Mesh(skullGeo, boneMaterial);
  skull.position.set(0, 0.28 * scale, 0.1 * scale);
  skull.scale.set(1, 0.8, 0.7);
  group.add(skull);

  // === STAFF ===
  if (hasStaff) {
    // Staff shaft
    const staffShaft = new THREE.Mesh(
      new THREE.CylinderGeometry(0.02 * scale, 0.025 * scale, 0.7 * scale, 6),
      woodMaterial
    );
    staffShaft.position.set(0.28 * scale, 0.4 * scale, 0);
    staffShaft.rotation.z = -0.15;
    group.add(staffShaft);

    // Staff head - skull
    const staffSkull = new THREE.Mesh(
      new THREE.SphereGeometry(0.05 * scale, 6, 5),
      boneMaterial
    );
    staffSkull.position.set(0.32 * scale, 0.75 * scale, 0);
    staffSkull.scale.set(1, 0.85, 0.8);
    group.add(staffSkull);

    // Glowing crystal in skull
    const crystal = new THREE.Mesh(
      new THREE.OctahedronGeometry(0.025 * scale),
      new THREE.MeshStandardMaterial({
        color: 0x00ffaa,
        emissive: 0x00ff88,
        emissiveIntensity: 0.8,
        transparent: true,
        opacity: 0.9,
      })
    );
    crystal.position.set(0.32 * scale, 0.78 * scale, 0.03 * scale);
    group.add(crystal);
  }

  return group;
}

export const GOBLIN_V3_META = {
  id: 'goblin-v3',
  name: 'Goblin',
  category: 'enemy' as const,
  description: 'A goblin shaman with tribal markings, feathers, and a gnarled staff - v3 design',
  defaultScale: 1.0,
  boundingBox: { x: 0.5, y: 0.85, z: 0.3 },
  tags: ['goblin', 'enemy', 'creature', 'monster', 'humanoid', 'shaman', 'magic'],
  enemyName: 'Goblin',
  version: 3,
  isActive: true,
  baseModelId: 'goblin',
};
