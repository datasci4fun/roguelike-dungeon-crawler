/**
 * Goblin King Boss Model
 * A large, imposing goblin ruler with crown, cape, and royal scepter
 */

import * as THREE from 'three';
import { createMaterial } from './materials';

export interface GoblinKingOptions {
  scale?: number;
}

export function createGoblinKing(options: GoblinKingOptions = {}): THREE.Group {
  const { scale = 1.0 } = options;

  const group = new THREE.Group();

  // Custom materials
  const skinMaterial = new THREE.MeshStandardMaterial({
    color: 0x3d6b32, // Darker goblin green
    roughness: 0.75,
  });
  const darkSkinMaterial = new THREE.MeshStandardMaterial({
    color: 0x2d4b22,
    roughness: 0.8,
  });
  const eyeMaterial = new THREE.MeshStandardMaterial({
    color: 0xff4400, // Orange-red eyes (more menacing)
    emissive: 0x882200,
    emissiveIntensity: 0.5,
  });
  const goldMaterial = createMaterial('gold');
  const clothMaterial = createMaterial('cloth'); // Red
  const bronzeMaterial = createMaterial('bronze');
  const ironMaterial = createMaterial('iron');

  // Base dimensions (larger than regular goblin)
  const s = scale * 1.4; // Boss scale multiplier

  // === BODY (muscular torso) ===
  const body = new THREE.Mesh(
    new THREE.BoxGeometry(0.35 * s, 0.4 * s, 0.22 * s),
    skinMaterial
  );
  body.position.y = 0.45 * s;
  body.rotation.x = 0.15;
  group.add(body);

  // === BELLY (slight paunch - he's well fed) ===
  const belly = new THREE.Mesh(
    new THREE.BoxGeometry(0.28 * s, 0.2 * s, 0.18 * s),
    skinMaterial
  );
  belly.position.set(0, 0.32 * s, 0.08 * s);
  group.add(belly);

  // === HEAD (larger) ===
  const head = new THREE.Mesh(
    new THREE.SphereGeometry(0.16 * s, 10, 8),
    skinMaterial
  );
  head.position.set(0, 0.72 * s, 0.05 * s);
  head.scale.set(1.1, 0.95, 0.9);
  group.add(head);

  // === CROWN (gold with points) ===
  // Crown base
  const crownBase = new THREE.Mesh(
    new THREE.BoxGeometry(0.22 * s, 0.06 * s, 0.18 * s),
    goldMaterial
  );
  crownBase.position.set(0, 0.85 * s, 0.03 * s);
  group.add(crownBase);

  // Crown points (5 triangular spikes)
  const pointGeo = new THREE.ConeGeometry(0.025 * s, 0.08 * s, 4);
  const pointPositions = [-0.08, -0.04, 0, 0.04, 0.08];
  pointPositions.forEach((xOff) => {
    const point = new THREE.Mesh(pointGeo, goldMaterial);
    point.position.set(xOff * s, 0.92 * s, 0.03 * s);
    group.add(point);
  });

  // Crown gems (red boxes on front)
  const gemMaterial = new THREE.MeshStandardMaterial({
    color: 0xcc0000,
    emissive: 0x440000,
    emissiveIntensity: 0.3,
  });
  const gemGeo = new THREE.BoxGeometry(0.025 * s, 0.025 * s, 0.015 * s);
  [-0.06, 0, 0.06].forEach((xOff) => {
    const gem = new THREE.Mesh(gemGeo, gemMaterial);
    gem.position.set(xOff * s, 0.85 * s, 0.12 * s);
    group.add(gem);
  });

  // === EARS (larger, more regal) ===
  const earGeo = new THREE.ConeGeometry(0.05 * s, 0.15 * s, 4);

  const leftEar = new THREE.Mesh(earGeo, skinMaterial);
  leftEar.position.set(-0.14 * s, 0.75 * s, 0);
  leftEar.rotation.z = Math.PI / 3;
  group.add(leftEar);

  const rightEar = new THREE.Mesh(earGeo, skinMaterial);
  rightEar.position.set(0.14 * s, 0.75 * s, 0);
  rightEar.rotation.z = -Math.PI / 3;
  group.add(rightEar);

  // Ear rings (gold)
  const earRingGeo = new THREE.TorusGeometry(0.02 * s, 0.005 * s, 4, 8);
  const leftRing = new THREE.Mesh(earRingGeo, goldMaterial);
  leftRing.position.set(-0.16 * s, 0.68 * s, 0.02 * s);
  group.add(leftRing);

  const rightRing = new THREE.Mesh(earRingGeo, goldMaterial);
  rightRing.position.set(0.16 * s, 0.68 * s, 0.02 * s);
  group.add(rightRing);

  // === EYES (larger, more menacing) ===
  const eyeGeo = new THREE.SphereGeometry(0.035 * s, 6, 4);

  const leftEye = new THREE.Mesh(eyeGeo, eyeMaterial);
  leftEye.position.set(-0.055 * s, 0.74 * s, 0.13 * s);
  group.add(leftEye);

  const rightEye = new THREE.Mesh(eyeGeo, eyeMaterial);
  rightEye.position.set(0.055 * s, 0.74 * s, 0.13 * s);
  group.add(rightEye);

  // === NOSE ===
  const nose = new THREE.Mesh(
    new THREE.BoxGeometry(0.04 * s, 0.05 * s, 0.04 * s),
    darkSkinMaterial
  );
  nose.position.set(0, 0.68 * s, 0.15 * s);
  group.add(nose);

  // === SHOULDER PAULDRONS (bronze) ===
  const pauldronGeo = new THREE.BoxGeometry(0.12 * s, 0.08 * s, 0.1 * s);

  const leftPauldron = new THREE.Mesh(pauldronGeo, bronzeMaterial);
  leftPauldron.position.set(-0.22 * s, 0.58 * s, 0);
  leftPauldron.rotation.z = 0.3;
  group.add(leftPauldron);

  const rightPauldron = new THREE.Mesh(pauldronGeo, bronzeMaterial);
  rightPauldron.position.set(0.22 * s, 0.58 * s, 0);
  rightPauldron.rotation.z = -0.3;
  group.add(rightPauldron);

  // Pauldron spikes
  const spikeGeo = new THREE.ConeGeometry(0.02 * s, 0.06 * s, 4);
  const leftSpike = new THREE.Mesh(spikeGeo, ironMaterial);
  leftSpike.position.set(-0.26 * s, 0.62 * s, 0);
  leftSpike.rotation.z = Math.PI / 2;
  group.add(leftSpike);

  const rightSpike = new THREE.Mesh(spikeGeo, ironMaterial);
  rightSpike.position.set(0.26 * s, 0.62 * s, 0);
  rightSpike.rotation.z = -Math.PI / 2;
  group.add(rightSpike);

  // === CAPE (behind body) ===
  const cape = new THREE.Mesh(
    new THREE.BoxGeometry(0.4 * s, 0.5 * s, 0.03 * s),
    clothMaterial
  );
  cape.position.set(0, 0.4 * s, -0.12 * s);
  cape.rotation.x = 0.1;
  group.add(cape);

  // Cape clasp (gold)
  const clasp = new THREE.Mesh(
    new THREE.BoxGeometry(0.06 * s, 0.04 * s, 0.02 * s),
    goldMaterial
  );
  clasp.position.set(0, 0.62 * s, 0.1 * s);
  group.add(clasp);

  // === ARMS (thicker) ===
  const armGeo = new THREE.BoxGeometry(0.08 * s, 0.28 * s, 0.07 * s);

  const leftArm = new THREE.Mesh(armGeo, skinMaterial);
  leftArm.position.set(-0.24 * s, 0.38 * s, 0);
  leftArm.rotation.z = 0.25;
  group.add(leftArm);

  const rightArm = new THREE.Mesh(armGeo, skinMaterial);
  rightArm.position.set(0.24 * s, 0.38 * s, 0);
  rightArm.rotation.z = -0.25;
  group.add(rightArm);

  // === HANDS ===
  const handGeo = new THREE.BoxGeometry(0.06 * s, 0.06 * s, 0.05 * s);

  const leftHand = new THREE.Mesh(handGeo, darkSkinMaterial);
  leftHand.position.set(-0.28 * s, 0.22 * s, 0);
  group.add(leftHand);

  const rightHand = new THREE.Mesh(handGeo, darkSkinMaterial);
  rightHand.position.set(0.28 * s, 0.22 * s, 0);
  group.add(rightHand);

  // === LEGS (stout) ===
  const legGeo = new THREE.BoxGeometry(0.1 * s, 0.22 * s, 0.08 * s);

  const leftLeg = new THREE.Mesh(legGeo, skinMaterial);
  leftLeg.position.set(-0.1 * s, 0.12 * s, 0);
  group.add(leftLeg);

  const rightLeg = new THREE.Mesh(legGeo, skinMaterial);
  rightLeg.position.set(0.1 * s, 0.12 * s, 0);
  group.add(rightLeg);

  // === FEET ===
  const footGeo = new THREE.BoxGeometry(0.08 * s, 0.04 * s, 0.12 * s);

  const leftFoot = new THREE.Mesh(footGeo, darkSkinMaterial);
  leftFoot.position.set(-0.1 * s, 0.02 * s, 0.02 * s);
  group.add(leftFoot);

  const rightFoot = new THREE.Mesh(footGeo, darkSkinMaterial);
  rightFoot.position.set(0.1 * s, 0.02 * s, 0.02 * s);
  group.add(rightFoot);

  // === ROYAL LOINCLOTH (with gold trim) ===
  const loincloth = new THREE.Mesh(
    new THREE.BoxGeometry(0.28 * s, 0.14 * s, 0.025 * s),
    clothMaterial
  );
  loincloth.position.set(0, 0.26 * s, 0.1 * s);
  group.add(loincloth);

  // Gold trim on loincloth
  const trimGeo = new THREE.BoxGeometry(0.28 * s, 0.02 * s, 0.03 * s);
  const topTrim = new THREE.Mesh(trimGeo, goldMaterial);
  topTrim.position.set(0, 0.32 * s, 0.1 * s);
  group.add(topTrim);

  const bottomTrim = new THREE.Mesh(trimGeo, goldMaterial);
  bottomTrim.position.set(0, 0.2 * s, 0.1 * s);
  group.add(bottomTrim);

  // === ROYAL SCEPTER (in right hand) ===
  // Scepter shaft
  const shaftGeo = new THREE.BoxGeometry(0.04 * s, 0.5 * s, 0.04 * s);
  const shaft = new THREE.Mesh(shaftGeo, goldMaterial);
  shaft.position.set(0.35 * s, 0.4 * s, 0);
  shaft.rotation.z = -0.3;
  group.add(shaft);

  // Scepter orb (top)
  const orb = new THREE.Mesh(
    new THREE.SphereGeometry(0.06 * s, 8, 6),
    new THREE.MeshStandardMaterial({
      color: 0x8800ff,
      emissive: 0x440088,
      emissiveIntensity: 0.4,
    })
  );
  orb.position.set(0.42 * s, 0.62 * s, 0);
  group.add(orb);

  // Scepter crown (around orb)
  const scepterCrownGeo = new THREE.BoxGeometry(0.08 * s, 0.04 * s, 0.08 * s);
  const scepterCrown = new THREE.Mesh(scepterCrownGeo, goldMaterial);
  scepterCrown.position.set(0.42 * s, 0.56 * s, 0);
  group.add(scepterCrown);

  return group;
}

export const GOBLIN_KING_META = {
  id: 'goblin_king',
  name: 'Goblin King',
  category: 'enemy' as const,
  description: 'The imposing Goblin King boss with crown, cape, and royal scepter',
  defaultScale: 1.0,
  boundingBox: { x: 0.8, y: 1.0, z: 0.5 },
  tags: ['goblin', 'king', 'boss', 'enemy', 'creature', 'monster', 'humanoid', 'royal'],
  // Maps to Floor 1 boss in battle
  enemyName: 'Goblin King',
};
