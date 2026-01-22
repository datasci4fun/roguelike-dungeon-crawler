/**
 * Plague Rat Enemy Model
 * Canonical design based on bestiary appearance.
 *
 * Canonical appearance from bestiary:
 * "Bloated rat with patchy fur and oozing sores. Green foam at its mouth."
 */

import * as THREE from 'three';

export interface PlagueRatOptions {
  scale?: number;
}

export function createPlagueRat(options: PlagueRatOptions = {}): THREE.Group {
  const { scale = 1.0 } = options;

  const group = new THREE.Group();
  const s = scale * 0.7;

  // === MATERIALS ===
  // Sickly gray-brown fur (patchy)
  const sickFurMaterial = new THREE.MeshStandardMaterial({
    color: 0x4a4a40, // Sickly grayish
    roughness: 1.0,
    metalness: 0.0,
  });

  // Exposed skin (where fur is patchy)
  const exposedSkinMaterial = new THREE.MeshStandardMaterial({
    color: 0x8a6060, // Pinkish-gray diseased skin
    roughness: 0.8,
    metalness: 0.0,
  });

  // Oozing sores (yellow-green pus)
  const soreMaterial = new THREE.MeshStandardMaterial({
    color: 0x889944, // Yellow-green
    roughness: 0.4,
    metalness: 0.1,
    emissive: 0x334411,
    emissiveIntensity: 0.3,
  });

  // Green foam at mouth (canonical)
  const foamMaterial = new THREE.MeshStandardMaterial({
    color: 0x66cc66, // Bright sickly green
    roughness: 0.3,
    metalness: 0.0,
    emissive: 0x44aa44,
    emissiveIntensity: 0.5,
    transparent: true,
    opacity: 0.85,
  });

  // Bloodshot eyes
  const eyeMaterial = new THREE.MeshStandardMaterial({
    color: 0xffaa88, // Bloodshot yellow-red
    roughness: 0.2,
    metalness: 0.0,
    emissive: 0x884422,
    emissiveIntensity: 0.4,
  });

  // Pink nose/ears (sickly)
  const sickPinkMaterial = new THREE.MeshStandardMaterial({
    color: 0xaa7777,
    roughness: 0.7,
    metalness: 0.0,
  });

  // Tail (scaly, diseased)
  const tailMaterial = new THREE.MeshStandardMaterial({
    color: 0x887070,
    roughness: 0.6,
    metalness: 0.0,
  });

  // === BODY (bloated - canonical) ===
  // Main bloated body
  const body = new THREE.Mesh(
    new THREE.BoxGeometry(0.18 * s, 0.14 * s, 0.22 * s), // Wider/rounder than normal rat
    sickFurMaterial
  );
  body.position.set(0, 0.1 * s, 0);
  group.add(body);

  // Extra bloating on sides
  const bloatGeo = new THREE.BoxGeometry(0.06 * s, 0.1 * s, 0.14 * s);

  const leftBloat = new THREE.Mesh(bloatGeo, sickFurMaterial);
  leftBloat.position.set(-0.1 * s, 0.09 * s, 0);
  group.add(leftBloat);

  const rightBloat = new THREE.Mesh(bloatGeo, sickFurMaterial);
  rightBloat.position.set(0.1 * s, 0.09 * s, 0);
  group.add(rightBloat);

  // Belly (distended)
  const belly = new THREE.Mesh(
    new THREE.BoxGeometry(0.14 * s, 0.08 * s, 0.18 * s),
    exposedSkinMaterial
  );
  belly.position.set(0, 0.04 * s, 0);
  group.add(belly);

  // === PATCHY FUR (canonical - exposed skin patches) ===
  const patchGeo = new THREE.BoxGeometry(0.04 * s, 0.02 * s, 0.05 * s);
  const furPatches = [
    { x: -0.07, y: 0.15, z: 0.06 },
    { x: 0.08, y: 0.14, z: -0.04 },
    { x: -0.05, y: 0.16, z: -0.05 },
    { x: 0.06, y: 0.15, z: 0.07 },
    { x: 0, y: 0.17, z: 0 },
  ];

  furPatches.forEach((patch) => {
    const mesh = new THREE.Mesh(patchGeo, exposedSkinMaterial);
    mesh.position.set(patch.x * s, patch.y * s, patch.z * s);
    mesh.rotation.y = Math.random() * 0.5;
    group.add(mesh);
  });

  // === OOZING SORES (canonical) ===
  const soreGeo = new THREE.SphereGeometry(0.02 * s, 6, 4);
  const sorePositions = [
    { x: -0.08, y: 0.12, z: 0.08 },
    { x: 0.1, y: 0.11, z: 0.04 },
    { x: -0.06, y: 0.1, z: -0.06 },
    { x: 0.07, y: 0.13, z: -0.08 },
    { x: -0.1, y: 0.09, z: 0 },
    { x: 0.09, y: 0.08, z: 0.06 },
  ];

  sorePositions.forEach((pos) => {
    const sore = new THREE.Mesh(soreGeo, soreMaterial);
    sore.position.set(pos.x * s, pos.y * s, pos.z * s);
    group.add(sore);
  });

  // Pus drips from sores
  const dripGeo = new THREE.BoxGeometry(0.01 * s, 0.03 * s, 0.01 * s);
  const drips = [
    { x: -0.08, y: 0.09, z: 0.08 },
    { x: 0.1, y: 0.08, z: 0.04 },
    { x: 0.07, y: 0.1, z: -0.08 },
  ];

  drips.forEach((drip) => {
    const mesh = new THREE.Mesh(dripGeo, soreMaterial);
    mesh.position.set(drip.x * s, drip.y * s, drip.z * s);
    group.add(mesh);
  });

  // === HEAD ===
  const head = new THREE.Mesh(
    new THREE.BoxGeometry(0.1 * s, 0.09 * s, 0.11 * s),
    sickFurMaterial
  );
  head.position.set(0, 0.1 * s, 0.14 * s);
  group.add(head);

  // Snout
  const snout = new THREE.Mesh(
    new THREE.BoxGeometry(0.06 * s, 0.05 * s, 0.07 * s),
    sickFurMaterial
  );
  snout.position.set(0, 0.08 * s, 0.2 * s);
  group.add(snout);

  // Nose
  const nose = new THREE.Mesh(
    new THREE.BoxGeometry(0.03 * s, 0.025 * s, 0.02 * s),
    sickPinkMaterial
  );
  nose.position.set(0, 0.075 * s, 0.235 * s);
  group.add(nose);

  // === GREEN FOAM AT MOUTH (canonical) ===
  const foamBubbleGeo = new THREE.SphereGeometry(0.012 * s, 6, 4);
  const foamPositions = [
    { x: -0.02, y: 0.055, z: 0.23 },
    { x: 0.015, y: 0.05, z: 0.235 },
    { x: -0.025, y: 0.048, z: 0.225 },
    { x: 0.02, y: 0.058, z: 0.22 },
    { x: 0, y: 0.045, z: 0.24 },
    { x: -0.01, y: 0.042, z: 0.23 },
    { x: 0.025, y: 0.045, z: 0.228 },
  ];

  foamPositions.forEach((pos) => {
    const foam = new THREE.Mesh(foamBubbleGeo, foamMaterial);
    foam.position.set(pos.x * s, pos.y * s, pos.z * s);
    // Vary size slightly
    const foamScale = 0.8 + Math.random() * 0.4;
    foam.scale.setScalar(foamScale);
    group.add(foam);
  });

  // Foam drip
  const foamDripGeo = new THREE.BoxGeometry(0.015 * s, 0.025 * s, 0.01 * s);
  const foamDrip = new THREE.Mesh(foamDripGeo, foamMaterial);
  foamDrip.position.set(0, 0.03 * s, 0.235 * s);
  group.add(foamDrip);

  // === EYES (bloodshot) ===
  const eyeGeo = new THREE.SphereGeometry(0.015 * s, 6, 4);

  const leftEye = new THREE.Mesh(eyeGeo, eyeMaterial);
  leftEye.position.set(-0.035 * s, 0.12 * s, 0.17 * s);
  group.add(leftEye);

  const rightEye = new THREE.Mesh(eyeGeo, eyeMaterial);
  rightEye.position.set(0.035 * s, 0.12 * s, 0.17 * s);
  group.add(rightEye);

  // === EARS (ragged) ===
  const earGeo = new THREE.BoxGeometry(0.03 * s, 0.035 * s, 0.015 * s);

  const leftEar = new THREE.Mesh(earGeo, sickPinkMaterial);
  leftEar.position.set(-0.04 * s, 0.15 * s, 0.12 * s);
  leftEar.rotation.z = -0.4;
  group.add(leftEar);

  const rightEar = new THREE.Mesh(earGeo, sickPinkMaterial);
  rightEar.position.set(0.04 * s, 0.15 * s, 0.12 * s);
  rightEar.rotation.z = 0.4;
  group.add(rightEar);

  // Torn ear edge (ragged from disease)
  const tornGeo = new THREE.BoxGeometry(0.015 * s, 0.01 * s, 0.01 * s);
  const tornEar = new THREE.Mesh(tornGeo, exposedSkinMaterial);
  tornEar.position.set(-0.05 * s, 0.16 * s, 0.12 * s);
  group.add(tornEar);

  // === WHISKERS (sparse) ===
  const whiskerGeo = new THREE.BoxGeometry(0.05 * s, 0.003 * s, 0.003 * s);
  const whiskerMaterial = new THREE.MeshStandardMaterial({ color: 0x555555 });

  // Only a few whiskers (diseased)
  const leftWhisker = new THREE.Mesh(whiskerGeo, whiskerMaterial);
  leftWhisker.position.set(-0.04 * s, 0.065 * s, 0.22 * s);
  leftWhisker.rotation.y = 0.4;
  group.add(leftWhisker);

  const rightWhisker = new THREE.Mesh(whiskerGeo, whiskerMaterial);
  rightWhisker.position.set(0.04 * s, 0.07 * s, 0.22 * s);
  rightWhisker.rotation.y = -0.35;
  group.add(rightWhisker);

  // === TEETH (diseased bite ability) ===
  const toothGeo = new THREE.BoxGeometry(0.01 * s, 0.018 * s, 0.008 * s);
  const toothMaterial = new THREE.MeshStandardMaterial({
    color: 0xcccc99, // Yellowed teeth
    roughness: 0.4,
  });

  const leftTooth = new THREE.Mesh(toothGeo, toothMaterial);
  leftTooth.position.set(-0.015 * s, 0.05 * s, 0.235 * s);
  group.add(leftTooth);

  const rightTooth = new THREE.Mesh(toothGeo, toothMaterial);
  rightTooth.position.set(0.015 * s, 0.05 * s, 0.235 * s);
  group.add(rightTooth);

  // === LEGS (stumpy, diseased) ===
  const legGeo = new THREE.BoxGeometry(0.035 * s, 0.045 * s, 0.035 * s);

  const frontLeftLeg = new THREE.Mesh(legGeo, sickFurMaterial);
  frontLeftLeg.position.set(-0.06 * s, 0.025 * s, 0.07 * s);
  group.add(frontLeftLeg);

  const frontRightLeg = new THREE.Mesh(legGeo, sickFurMaterial);
  frontRightLeg.position.set(0.06 * s, 0.025 * s, 0.07 * s);
  group.add(frontRightLeg);

  const backLeftLeg = new THREE.Mesh(legGeo, sickFurMaterial);
  backLeftLeg.position.set(-0.06 * s, 0.025 * s, -0.07 * s);
  group.add(backLeftLeg);

  const backRightLeg = new THREE.Mesh(legGeo, sickFurMaterial);
  backRightLeg.position.set(0.06 * s, 0.025 * s, -0.07 * s);
  group.add(backRightLeg);

  // === PAWS ===
  const pawGeo = new THREE.BoxGeometry(0.028 * s, 0.01 * s, 0.03 * s);

  const pawPositions = [
    { x: -0.06, z: 0.08 },
    { x: 0.06, z: 0.08 },
    { x: -0.06, z: -0.08 },
    { x: 0.06, z: -0.08 },
  ];

  pawPositions.forEach((pos) => {
    const paw = new THREE.Mesh(pawGeo, sickPinkMaterial);
    paw.position.set(pos.x * s, 0.005 * s, pos.z * s);
    group.add(paw);
  });

  // === TAIL (diseased, scaly) ===
  const tailSegments = 7;
  const tailSegGeo = new THREE.BoxGeometry(0.02 * s, 0.02 * s, 0.04 * s);

  for (let i = 0; i < tailSegments; i++) {
    const segment = new THREE.Mesh(tailSegGeo, tailMaterial);
    const zOff = -0.13 * s - i * 0.035 * s;
    const yOff = 0.06 * s + i * 0.01 * s;
    segment.position.set(0, yOff, zOff);
    segment.rotation.x = -0.12 * i;
    // Tapering
    const tapering = 1 - i * 0.1;
    segment.scale.set(tapering, tapering, 1);
    group.add(segment);
  }

  // Sore on tail
  const tailSore = new THREE.Mesh(soreGeo, soreMaterial);
  tailSore.position.set(0, 0.08 * s, -0.18 * s);
  group.add(tailSore);

  // === GROUND PUDDLE (disease trail) ===
  const puddleMaterial = new THREE.MeshStandardMaterial({
    color: 0x556633,
    roughness: 0.3,
    metalness: 0.1,
    emissive: 0x223311,
    emissiveIntensity: 0.2,
    transparent: true,
    opacity: 0.6,
  });

  const puddle = new THREE.Mesh(
    new THREE.CylinderGeometry(0.08 * s, 0.1 * s, 0.005 * s, 8),
    puddleMaterial
  );
  puddle.position.set(0, 0.003 * s, -0.05 * s);
  group.add(puddle);

  return group;
}

export const PLAGUE_RAT_META = {
  id: 'plague-rat',
  name: 'Plague Rat',
  category: 'enemy' as const,
  description: 'Bloated rat with patchy fur and oozing sores. Green foam at its mouth - canonical design',
  defaultScale: 1.0,
  boundingBox: { x: 0.22, y: 0.18, z: 0.45 },
  tags: ['rat', 'rodent', 'enemy', 'creature', 'diseased', 'plague', 'poison', 'canonical'],
  enemyName: 'Plague Rat',
};
