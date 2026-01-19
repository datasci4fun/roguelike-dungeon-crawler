/**
 * The Regent Boss Model
 * Canonical design based on bestiary appearance.
 *
 * Canonical appearance from bestiary:
 * "Regal figure in ornate robes. Face constantly shifts between different rulers. Crown glows with stolen power."
 */

import * as THREE from 'three';

export interface TheRegentOptions {
  scale?: number;
}

export function createTheRegent(options: TheRegentOptions = {}): THREE.Group {
  const { scale = 1.0 } = options;

  const group = new THREE.Group();
  const s = scale * 1.3; // Boss scale

  // === MATERIALS ===
  // Ornate robe (royal purple)
  const robeMaterial = new THREE.MeshStandardMaterial({
    color: 0x3a2255,
    roughness: 0.5,
    metalness: 0.1,
    emissive: 0x1a1133,
    emissiveIntensity: 0.2,
  });

  // Robe trim (gold)
  const goldTrimMaterial = new THREE.MeshStandardMaterial({
    color: 0xddaa44,
    roughness: 0.2,
    metalness: 0.8,
    emissive: 0x886622,
    emissiveIntensity: 0.3,
  });

  // Shifting face (canonical - face constantly shifts)
  const faceMaterial = new THREE.MeshStandardMaterial({
    color: 0x998877,
    roughness: 0.4,
    metalness: 0.1,
    emissive: 0x443322,
    emissiveIntensity: 0.3,
  });

  // Ghostly underlayer
  const ghostMaterial = new THREE.MeshStandardMaterial({
    color: 0x7788aa,
    roughness: 0.3,
    metalness: 0.0,
    emissive: 0x445566,
    emissiveIntensity: 0.4,
    transparent: true,
    opacity: 0.6,
  });

  // Crown (canonical - glows with stolen power)
  const crownMaterial = new THREE.MeshStandardMaterial({
    color: 0xffcc44,
    roughness: 0.1,
    metalness: 0.9,
    emissive: 0xddaa22,
    emissiveIntensity: 1.5,
  });

  // Crown glow
  const crownGlowMaterial = new THREE.MeshStandardMaterial({
    color: 0xffddaa,
    roughness: 0.0,
    metalness: 0.0,
    emissive: 0xffcc88,
    emissiveIntensity: 2.0,
    transparent: true,
    opacity: 0.5,
  });

  // Eyes (glowing with power)
  const eyeMaterial = new THREE.MeshStandardMaterial({
    color: 0xffaa44,
    roughness: 0.1,
    metalness: 0.0,
    emissive: 0xdd8822,
    emissiveIntensity: 2.0,
  });

  // Scepter material
  const scepterMaterial = new THREE.MeshStandardMaterial({
    color: 0x444455,
    roughness: 0.3,
    metalness: 0.7,
  });

  // === HEAD (shifting faces) ===
  const head = new THREE.Mesh(
    new THREE.BoxGeometry(0.12 * s, 0.14 * s, 0.1 * s),
    faceMaterial
  );
  head.position.y = 0.82 * s;
  group.add(head);

  // Shifting face layers (canonical)
  const faceLayer1 = new THREE.Mesh(
    new THREE.BoxGeometry(0.1 * s, 0.12 * s, 0.02 * s),
    ghostMaterial
  );
  faceLayer1.position.set(-0.02 * s, 0.83 * s, 0.06 * s);
  faceLayer1.rotation.y = -0.1;
  group.add(faceLayer1);

  const faceLayer2 = new THREE.Mesh(
    new THREE.BoxGeometry(0.1 * s, 0.12 * s, 0.02 * s),
    ghostMaterial
  );
  faceLayer2.position.set(0.02 * s, 0.81 * s, 0.065 * s);
  faceLayer2.rotation.y = 0.1;
  group.add(faceLayer2);

  // Glowing eyes
  const eyeGeo = new THREE.SphereGeometry(0.02 * s, 6, 4);

  const leftEye = new THREE.Mesh(eyeGeo, eyeMaterial);
  leftEye.position.set(-0.035 * s, 0.84 * s, 0.06 * s);
  group.add(leftEye);

  const rightEye = new THREE.Mesh(eyeGeo, eyeMaterial);
  rightEye.position.set(0.035 * s, 0.84 * s, 0.06 * s);
  group.add(rightEye);

  // === CROWN (canonical - glows with stolen power) ===
  // Crown base
  const crownBase = new THREE.Mesh(
    new THREE.CylinderGeometry(0.08 * s, 0.07 * s, 0.04 * s, 8),
    crownMaterial
  );
  crownBase.position.y = 0.92 * s;
  group.add(crownBase);

  // Crown points
  const pointGeo = new THREE.BoxGeometry(0.02 * s, 0.06 * s, 0.02 * s);
  for (let i = 0; i < 8; i++) {
    const angle = (i / 8) * Math.PI * 2;
    const point = new THREE.Mesh(pointGeo, crownMaterial);
    point.position.set(
      Math.cos(angle) * 0.065 * s,
      0.96 * s,
      Math.sin(angle) * 0.065 * s
    );
    point.rotation.z = Math.cos(angle) * 0.2;
    point.rotation.x = Math.sin(angle) * 0.2;
    group.add(point);
  }

  // Crown glow effect
  const crownGlow = new THREE.Mesh(
    new THREE.SphereGeometry(0.12 * s, 8, 6),
    crownGlowMaterial
  );
  crownGlow.position.y = 0.94 * s;
  crownGlow.scale.set(1, 0.6, 1);
  group.add(crownGlow);

  // Jewels in crown
  const jewelGeo = new THREE.SphereGeometry(0.015 * s, 6, 4);
  const jewelMaterial = new THREE.MeshStandardMaterial({
    color: 0xff4444,
    emissive: 0xcc2222,
    emissiveIntensity: 1.0,
  });

  for (let i = 0; i < 4; i++) {
    const angle = (i / 4) * Math.PI * 2;
    const jewel = new THREE.Mesh(jewelGeo, jewelMaterial);
    jewel.position.set(
      Math.cos(angle) * 0.075 * s,
      0.94 * s,
      Math.sin(angle) * 0.075 * s
    );
    group.add(jewel);
  }

  // === NECK ===
  const neck = new THREE.Mesh(
    new THREE.CylinderGeometry(0.04 * s, 0.05 * s, 0.08 * s, 8),
    ghostMaterial
  );
  neck.position.y = 0.72 * s;
  group.add(neck);

  // === TORSO (ornate robes) ===
  const torso = new THREE.Mesh(
    new THREE.BoxGeometry(0.22 * s, 0.3 * s, 0.14 * s),
    robeMaterial
  );
  torso.position.y = 0.52 * s;
  group.add(torso);

  // Ghostly body inside
  const innerBody = new THREE.Mesh(
    new THREE.BoxGeometry(0.18 * s, 0.26 * s, 0.1 * s),
    ghostMaterial
  );
  innerBody.position.y = 0.52 * s;
  group.add(innerBody);

  // Ornate collar
  const collar = new THREE.Mesh(
    new THREE.BoxGeometry(0.2 * s, 0.05 * s, 0.12 * s),
    goldTrimMaterial
  );
  collar.position.y = 0.68 * s;
  group.add(collar);

  // Gold trim on robe
  const trimGeo = new THREE.BoxGeometry(0.04 * s, 0.28 * s, 0.02 * s);
  const leftTrim = new THREE.Mesh(trimGeo, goldTrimMaterial);
  leftTrim.position.set(-0.08 * s, 0.52 * s, 0.08 * s);
  group.add(leftTrim);

  const rightTrim = new THREE.Mesh(trimGeo, goldTrimMaterial);
  rightTrim.position.set(0.08 * s, 0.52 * s, 0.08 * s);
  group.add(rightTrim);

  // Central emblem
  const emblem = new THREE.Mesh(
    new THREE.BoxGeometry(0.08 * s, 0.08 * s, 0.02 * s),
    goldTrimMaterial
  );
  emblem.position.set(0, 0.54 * s, 0.08 * s);
  emblem.rotation.z = 0.785;
  group.add(emblem);

  // === SHOULDERS (pauldrons) ===
  const pauldronGeo = new THREE.BoxGeometry(0.1 * s, 0.08 * s, 0.08 * s);

  const leftPauldron = new THREE.Mesh(pauldronGeo, robeMaterial);
  leftPauldron.position.set(-0.16 * s, 0.64 * s, 0);
  group.add(leftPauldron);

  const rightPauldron = new THREE.Mesh(pauldronGeo, robeMaterial);
  rightPauldron.position.set(0.16 * s, 0.64 * s, 0);
  group.add(rightPauldron);

  // === ARMS ===
  const armGeo = new THREE.BoxGeometry(0.06 * s, 0.2 * s, 0.06 * s);

  const leftArm = new THREE.Mesh(armGeo, robeMaterial);
  leftArm.position.set(-0.18 * s, 0.48 * s, 0);
  group.add(leftArm);

  const rightArm = new THREE.Mesh(armGeo, robeMaterial);
  rightArm.position.set(0.18 * s, 0.48 * s, 0);
  rightArm.rotation.x = -0.4;
  group.add(rightArm);

  // Hands (ghostly)
  const handGeo = new THREE.BoxGeometry(0.05 * s, 0.06 * s, 0.04 * s);

  const leftHand = new THREE.Mesh(handGeo, ghostMaterial);
  leftHand.position.set(-0.2 * s, 0.34 * s, 0.02 * s);
  group.add(leftHand);

  const rightHand = new THREE.Mesh(handGeo, ghostMaterial);
  rightHand.position.set(0.22 * s, 0.38 * s, 0.12 * s);
  group.add(rightHand);

  // === SCEPTER (Royal Strike weapon) ===
  // Shaft
  const shaft = new THREE.Mesh(
    new THREE.CylinderGeometry(0.015 * s, 0.015 * s, 0.6 * s, 6),
    scepterMaterial
  );
  shaft.position.set(0.24 * s, 0.5 * s, 0.15 * s);
  shaft.rotation.x = -0.3;
  group.add(shaft);

  // Scepter head (orb)
  const scepterHead = new THREE.Mesh(
    new THREE.SphereGeometry(0.04 * s, 8, 6),
    crownMaterial
  );
  scepterHead.position.set(0.28 * s, 0.78 * s, 0.08 * s);
  group.add(scepterHead);

  // Scepter glow
  const scepterGlow = new THREE.Mesh(
    new THREE.SphereGeometry(0.06 * s, 6, 4),
    crownGlowMaterial
  );
  scepterGlow.position.set(0.28 * s, 0.78 * s, 0.08 * s);
  group.add(scepterGlow);

  // === LOWER ROBES (flowing) ===
  const lowerRobe = new THREE.Mesh(
    new THREE.BoxGeometry(0.28 * s, 0.32 * s, 0.18 * s),
    robeMaterial
  );
  lowerRobe.position.y = 0.22 * s;
  group.add(lowerRobe);

  // Robe bottom (wider)
  const robeBottom = new THREE.Mesh(
    new THREE.BoxGeometry(0.34 * s, 0.1 * s, 0.22 * s),
    robeMaterial
  );
  robeBottom.position.y = 0.08 * s;
  group.add(robeBottom);

  // Gold hem
  const hemGeo = new THREE.BoxGeometry(0.32 * s, 0.02 * s, 0.2 * s);
  const hem = new THREE.Mesh(hemGeo, goldTrimMaterial);
  hem.position.y = 0.04 * s;
  group.add(hem);

  return group;
}

export const THE_REGENT_META = {
  id: 'the-regent',
  name: 'The Regent',
  category: 'enemy' as const,
  description: 'Regal figure in ornate robes. Face constantly shifts between different rulers. Crown glows with stolen power - canonical design',
  defaultScale: 1.0,
  boundingBox: { x: 0.5, y: 1.1, z: 0.4 },
  tags: ['boss', 'ghost', 'royal', 'enemy', 'undead', 'magic', 'canonical'],
  enemyName: 'The Regent',
};
