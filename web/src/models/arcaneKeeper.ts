/**
 * Arcane Keeper Boss Model
 * Canonical design based on bestiary appearance.
 *
 * Canonical appearance from bestiary:
 * "Floating specter in scholar's robes. Multiple phantom arms hold ancient tomes. Eyes glow with arcane light."
 */

import * as THREE from 'three';

export interface ArcaneKeeperOptions {
  scale?: number;
}

export function createArcaneKeeper(options: ArcaneKeeperOptions = {}): THREE.Group {
  const { scale = 1.0 } = options;

  const group = new THREE.Group();
  const s = scale * 1.4; // Boss scale

  // === MATERIALS ===
  // Spectral body (canonical - floating specter)
  const spectralMaterial = new THREE.MeshStandardMaterial({
    color: 0x6677aa,
    roughness: 0.3,
    metalness: 0.1,
    emissive: 0x334466,
    emissiveIntensity: 0.5,
    transparent: true,
    opacity: 0.6,
  });

  // Scholar's robes
  const robeMaterial = new THREE.MeshStandardMaterial({
    color: 0x2a3355,
    roughness: 0.6,
    metalness: 0.0,
    emissive: 0x151a33,
    emissiveIntensity: 0.3,
    transparent: true,
    opacity: 0.8,
  });

  // Phantom arm material (canonical - multiple phantom arms)
  const phantomArmMaterial = new THREE.MeshStandardMaterial({
    color: 0x8899bb,
    roughness: 0.3,
    metalness: 0.0,
    emissive: 0x4455aa,
    emissiveIntensity: 0.6,
    transparent: true,
    opacity: 0.5,
  });

  // Arcane eye glow (canonical - eyes glow with arcane light)
  const eyeMaterial = new THREE.MeshStandardMaterial({
    color: 0x88aaff,
    roughness: 0.0,
    metalness: 0.0,
    emissive: 0x6688ff,
    emissiveIntensity: 2.5,
  });

  // Tome material (canonical - ancient tomes)
  const tomeMaterial = new THREE.MeshStandardMaterial({
    color: 0x443322,
    roughness: 0.8,
    metalness: 0.1,
    emissive: 0x221100,
    emissiveIntensity: 0.3,
  });

  // Page material
  const pageMaterial = new THREE.MeshStandardMaterial({
    color: 0xddddcc,
    roughness: 0.9,
    metalness: 0.0,
    emissive: 0x888877,
    emissiveIntensity: 0.3,
  });

  // Arcane glow
  const arcaneGlowMaterial = new THREE.MeshStandardMaterial({
    color: 0x8888ff,
    roughness: 0.0,
    metalness: 0.0,
    emissive: 0x6666dd,
    emissiveIntensity: 1.5,
    transparent: true,
    opacity: 0.4,
  });

  // === HEAD (hooded) ===
  const hood = new THREE.Mesh(
    new THREE.BoxGeometry(0.14 * s, 0.16 * s, 0.14 * s),
    robeMaterial
  );
  hood.position.y = 0.8 * s;
  group.add(hood);

  // Spectral face inside
  const face = new THREE.Mesh(
    new THREE.BoxGeometry(0.1 * s, 0.12 * s, 0.08 * s),
    spectralMaterial
  );
  face.position.set(0, 0.78 * s, 0.04 * s);
  group.add(face);

  // Glowing arcane eyes (canonical)
  const eyeGeo = new THREE.SphereGeometry(0.025 * s, 8, 6);

  const leftEye = new THREE.Mesh(eyeGeo, eyeMaterial);
  leftEye.position.set(-0.03 * s, 0.8 * s, 0.08 * s);
  group.add(leftEye);

  const rightEye = new THREE.Mesh(eyeGeo, eyeMaterial);
  rightEye.position.set(0.03 * s, 0.8 * s, 0.08 * s);
  group.add(rightEye);

  // Eye glow trails
  const eyeTrailGeo = new THREE.BoxGeometry(0.015 * s, 0.015 * s, 0.04 * s);

  const leftTrail = new THREE.Mesh(eyeTrailGeo, arcaneGlowMaterial);
  leftTrail.position.set(-0.04 * s, 0.81 * s, 0.06 * s);
  group.add(leftTrail);

  const rightTrail = new THREE.Mesh(eyeTrailGeo, arcaneGlowMaterial);
  rightTrail.position.set(0.04 * s, 0.81 * s, 0.06 * s);
  group.add(rightTrail);

  // === TORSO (robes) ===
  const torso = new THREE.Mesh(
    new THREE.BoxGeometry(0.22 * s, 0.3 * s, 0.14 * s),
    robeMaterial
  );
  torso.position.y = 0.55 * s;
  group.add(torso);

  // Spectral body inside
  const innerBody = new THREE.Mesh(
    new THREE.BoxGeometry(0.18 * s, 0.26 * s, 0.1 * s),
    spectralMaterial
  );
  innerBody.position.y = 0.55 * s;
  group.add(innerBody);

  // Robe collar
  const collar = new THREE.Mesh(
    new THREE.BoxGeometry(0.18 * s, 0.04 * s, 0.12 * s),
    robeMaterial
  );
  collar.position.y = 0.7 * s;
  group.add(collar);

  // === MULTIPLE PHANTOM ARMS (canonical - holding tomes) ===
  const createPhantomArm = (x: number, y: number, z: number, rotZ: number, hasTome: boolean) => {
    // Upper arm
    const upperArm = new THREE.Mesh(
      new THREE.BoxGeometry(0.04 * s, 0.14 * s, 0.04 * s),
      phantomArmMaterial
    );
    upperArm.position.set(x * s, y * s, z * s);
    upperArm.rotation.z = rotZ;
    group.add(upperArm);

    // Lower arm
    const lowerY = y - 0.12;
    const lowerX = x + Math.sin(rotZ) * 0.08;
    const lowerArm = new THREE.Mesh(
      new THREE.BoxGeometry(0.035 * s, 0.12 * s, 0.035 * s),
      phantomArmMaterial
    );
    lowerArm.position.set(lowerX * s, lowerY * s, (z + 0.02) * s);
    lowerArm.rotation.z = rotZ * 0.5;
    group.add(lowerArm);

    // Hand
    const handY = lowerY - 0.08;
    const handX = lowerX + Math.sin(rotZ) * 0.04;
    const hand = new THREE.Mesh(
      new THREE.BoxGeometry(0.04 * s, 0.04 * s, 0.03 * s),
      phantomArmMaterial
    );
    hand.position.set(handX * s, handY * s, (z + 0.04) * s);
    group.add(hand);

    // Add tome if specified (canonical - hold ancient tomes)
    if (hasTome) {
      const tome = new THREE.Mesh(
        new THREE.BoxGeometry(0.08 * s, 0.1 * s, 0.03 * s),
        tomeMaterial
      );
      tome.position.set(handX * s, (handY - 0.06) * s, (z + 0.05) * s);
      tome.rotation.z = rotZ * 0.3;
      group.add(tome);

      // Pages
      const pages = new THREE.Mesh(
        new THREE.BoxGeometry(0.07 * s, 0.09 * s, 0.02 * s),
        pageMaterial
      );
      pages.position.set(handX * s, (handY - 0.06) * s, (z + 0.07) * s);
      pages.rotation.z = rotZ * 0.3;
      group.add(pages);

      // Tome glow
      const tomeGlow = new THREE.Mesh(
        new THREE.SphereGeometry(0.06 * s, 6, 4),
        arcaneGlowMaterial
      );
      tomeGlow.position.set(handX * s, (handY - 0.06) * s, (z + 0.06) * s);
      group.add(tomeGlow);
    }
  };

  // Main arms (2)
  createPhantomArm(-0.16, 0.58, 0, 0.25, true);
  createPhantomArm(0.16, 0.58, 0, -0.25, true);

  // Additional phantom arms (4 more - making 6 total)
  createPhantomArm(-0.2, 0.52, 0.04, 0.5, true);
  createPhantomArm(0.2, 0.52, 0.04, -0.5, false);
  createPhantomArm(-0.14, 0.48, -0.04, 0.35, false);
  createPhantomArm(0.14, 0.48, -0.04, -0.35, true);

  // === LOWER ROBES (flowing, spectral) ===
  const lowerRobe = new THREE.Mesh(
    new THREE.BoxGeometry(0.26 * s, 0.28 * s, 0.16 * s),
    robeMaterial
  );
  lowerRobe.position.y = 0.28 * s;
  group.add(lowerRobe);

  // Robe wisps (floating effect)
  const wispGeo = new THREE.BoxGeometry(0.04 * s, 0.12 * s, 0.03 * s);
  const wisps = [
    { x: -0.1, y: 0.14, z: 0.06 },
    { x: 0.08, y: 0.12, z: 0.07 },
    { x: -0.06, y: 0.1, z: -0.05 },
    { x: 0.1, y: 0.16, z: -0.04 },
    { x: 0, y: 0.08, z: 0.08 },
  ];

  wisps.forEach((w) => {
    const wisp = new THREE.Mesh(wispGeo, spectralMaterial);
    wisp.position.set(w.x * s, w.y * s, w.z * s);
    wisp.rotation.z = Math.random() * 0.4 - 0.2;
    group.add(wisp);
  });

  // === FLOATING EFFECT ===
  const floatGlow = new THREE.Mesh(
    new THREE.CylinderGeometry(0.2 * s, 0.25 * s, 0.02 * s, 10),
    arcaneGlowMaterial
  );
  floatGlow.position.y = 0.06 * s;
  group.add(floatGlow);

  // Arcane runes floating around
  const runeGeo = new THREE.BoxGeometry(0.03 * s, 0.03 * s, 0.005 * s);
  const runePositions = [
    { x: -0.25, y: 0.6, z: 0.1 },
    { x: 0.28, y: 0.55, z: 0.08 },
    { x: -0.22, y: 0.45, z: -0.12 },
    { x: 0.24, y: 0.7, z: -0.08 },
    { x: 0, y: 0.85, z: 0.15 },
  ];

  runePositions.forEach((rp) => {
    const rune = new THREE.Mesh(runeGeo, eyeMaterial);
    rune.position.set(rp.x * s, rp.y * s, rp.z * s);
    rune.rotation.y = Math.random() * Math.PI;
    group.add(rune);
  });

  return group;
}

export const ARCANE_KEEPER_META = {
  id: 'arcane-keeper',
  name: 'Arcane Keeper',
  category: 'enemy' as const,
  description: 'Floating specter in scholar\'s robes. Multiple phantom arms hold ancient tomes. Eyes glow with arcane light - canonical design',
  defaultScale: 1.0,
  boundingBox: { x: 0.6, y: 1.0, z: 0.5 },
  tags: ['boss', 'specter', 'magic', 'enemy', 'ghost', 'scholar', 'canonical'],
  enemyName: 'Arcane Keeper',
};
