/**
 * Court Scribe Enemy Model
 * Canonical design based on bestiary appearance.
 *
 * Canonical appearance from bestiary:
 * "Translucent figure in scholar's robes. Carries floating quill and tome."
 */

import * as THREE from 'three';

export interface CourtScribeOptions {
  scale?: number;
}

export function createCourtScribe(options: CourtScribeOptions = {}): THREE.Group {
  const { scale = 1.0 } = options;

  const group = new THREE.Group();
  const s = scale * 1.0;

  // === MATERIALS ===
  // Translucent spectral body (canonical - translucent figure)
  const spectralMaterial = new THREE.MeshStandardMaterial({
    color: 0x99aacc,
    roughness: 0.3,
    metalness: 0.1,
    emissive: 0x556688,
    emissiveIntensity: 0.4,
    transparent: true,
    opacity: 0.5,
  });

  // Scholar's robe material
  const robeMaterial = new THREE.MeshStandardMaterial({
    color: 0x445566,
    roughness: 0.6,
    metalness: 0.0,
    emissive: 0x223344,
    emissiveIntensity: 0.3,
    transparent: true,
    opacity: 0.7,
  });

  // Robe trim (darker)
  const trimMaterial = new THREE.MeshStandardMaterial({
    color: 0x2a3344,
    roughness: 0.5,
    metalness: 0.1,
    transparent: true,
    opacity: 0.75,
  });

  // Eyes (glowing)
  const eyeMaterial = new THREE.MeshStandardMaterial({
    color: 0xaaccff,
    roughness: 0.1,
    metalness: 0.0,
    emissive: 0x88aaff,
    emissiveIntensity: 1.5,
  });

  // Floating tome material
  const tomeMaterial = new THREE.MeshStandardMaterial({
    color: 0x554433,
    roughness: 0.7,
    metalness: 0.1,
    emissive: 0x332211,
    emissiveIntensity: 0.4,
  });

  // Tome pages
  const pageMaterial = new THREE.MeshStandardMaterial({
    color: 0xeeeedd,
    roughness: 0.8,
    metalness: 0.0,
    emissive: 0x888877,
    emissiveIntensity: 0.3,
  });

  // Ink/quill material
  const inkMaterial = new THREE.MeshStandardMaterial({
    color: 0x111133,
    roughness: 0.2,
    metalness: 0.3,
    emissive: 0x222255,
    emissiveIntensity: 0.5,
  });

  // Quill feather
  const featherMaterial = new THREE.MeshStandardMaterial({
    color: 0xccccff,
    roughness: 0.4,
    metalness: 0.0,
    emissive: 0x8888cc,
    emissiveIntensity: 0.4,
  });

  // === HEAD (hooded) ===
  const hood = new THREE.Mesh(
    new THREE.BoxGeometry(0.12 * s, 0.14 * s, 0.12 * s),
    robeMaterial
  );
  hood.position.y = 0.72 * s;
  group.add(hood);

  // Hood opening (darker)
  const hoodOpening = new THREE.Mesh(
    new THREE.BoxGeometry(0.08 * s, 0.1 * s, 0.04 * s),
    trimMaterial
  );
  hoodOpening.position.set(0, 0.7 * s, 0.06 * s);
  group.add(hoodOpening);

  // Spectral face inside hood
  const face = new THREE.Mesh(
    new THREE.BoxGeometry(0.08 * s, 0.1 * s, 0.06 * s),
    spectralMaterial
  );
  face.position.set(0, 0.7 * s, 0.04 * s);
  group.add(face);

  // Glowing eyes
  const eyeGeo = new THREE.SphereGeometry(0.015 * s, 6, 4);

  const leftEye = new THREE.Mesh(eyeGeo, eyeMaterial);
  leftEye.position.set(-0.025 * s, 0.72 * s, 0.08 * s);
  group.add(leftEye);

  const rightEye = new THREE.Mesh(eyeGeo, eyeMaterial);
  rightEye.position.set(0.025 * s, 0.72 * s, 0.08 * s);
  group.add(rightEye);

  // === TORSO (scholar's robes) ===
  const torso = new THREE.Mesh(
    new THREE.BoxGeometry(0.18 * s, 0.26 * s, 0.12 * s),
    robeMaterial
  );
  torso.position.y = 0.5 * s;
  group.add(torso);

  // Spectral body inside
  const innerBody = new THREE.Mesh(
    new THREE.BoxGeometry(0.14 * s, 0.22 * s, 0.08 * s),
    spectralMaterial
  );
  innerBody.position.y = 0.5 * s;
  group.add(innerBody);

  // Robe collar
  const collar = new THREE.Mesh(
    new THREE.BoxGeometry(0.16 * s, 0.04 * s, 0.1 * s),
    trimMaterial
  );
  collar.position.y = 0.64 * s;
  group.add(collar);

  // === ARMS (in sleeves) ===
  const sleeveGeo = new THREE.BoxGeometry(0.06 * s, 0.18 * s, 0.06 * s);

  // Left arm (holding position for tome)
  const leftSleeve = new THREE.Mesh(sleeveGeo, robeMaterial);
  leftSleeve.position.set(-0.14 * s, 0.46 * s, 0.04 * s);
  leftSleeve.rotation.x = -0.3;
  leftSleeve.rotation.z = 0.2;
  group.add(leftSleeve);

  // Right arm (gesturing)
  const rightSleeve = new THREE.Mesh(sleeveGeo, robeMaterial);
  rightSleeve.position.set(0.14 * s, 0.5 * s, 0.06 * s);
  rightSleeve.rotation.x = -0.5;
  rightSleeve.rotation.z = -0.3;
  group.add(rightSleeve);

  // Spectral hands
  const handGeo = new THREE.BoxGeometry(0.04 * s, 0.05 * s, 0.03 * s);

  const leftHand = new THREE.Mesh(handGeo, spectralMaterial);
  leftHand.position.set(-0.16 * s, 0.36 * s, 0.1 * s);
  group.add(leftHand);

  const rightHand = new THREE.Mesh(handGeo, spectralMaterial);
  rightHand.position.set(0.18 * s, 0.4 * s, 0.14 * s);
  group.add(rightHand);

  // === LOWER ROBES (flowing) ===
  const lowerRobe = new THREE.Mesh(
    new THREE.BoxGeometry(0.22 * s, 0.28 * s, 0.14 * s),
    robeMaterial
  );
  lowerRobe.position.y = 0.22 * s;
  group.add(lowerRobe);

  // Robe bottom (wider, flowing)
  const robeBottom = new THREE.Mesh(
    new THREE.BoxGeometry(0.26 * s, 0.08 * s, 0.16 * s),
    robeMaterial
  );
  robeBottom.position.y = 0.1 * s;
  group.add(robeBottom);

  // Spectral wisps at bottom (floating)
  const wispGeo = new THREE.BoxGeometry(0.04 * s, 0.06 * s, 0.02 * s);
  const wispPositions = [
    { x: -0.1, z: 0.06 },
    { x: 0.08, z: 0.08 },
    { x: -0.06, z: -0.06 },
    { x: 0.1, z: -0.04 },
  ];

  wispPositions.forEach((pos) => {
    const wisp = new THREE.Mesh(wispGeo, spectralMaterial);
    wisp.position.set(pos.x * s, 0.04 * s, pos.z * s);
    group.add(wisp);
  });

  // === FLOATING TOME (canonical) ===
  // Book cover
  const tomeBody = new THREE.Mesh(
    new THREE.BoxGeometry(0.12 * s, 0.15 * s, 0.04 * s),
    tomeMaterial
  );
  tomeBody.position.set(-0.22 * s, 0.45 * s, 0.15 * s);
  tomeBody.rotation.y = 0.3;
  tomeBody.rotation.x = -0.2;
  group.add(tomeBody);

  // Pages
  const pages = new THREE.Mesh(
    new THREE.BoxGeometry(0.1 * s, 0.13 * s, 0.03 * s),
    pageMaterial
  );
  pages.position.set(-0.22 * s, 0.45 * s, 0.17 * s);
  pages.rotation.y = 0.3;
  pages.rotation.x = -0.2;
  group.add(pages);

  // Tome spine
  const spine = new THREE.Mesh(
    new THREE.BoxGeometry(0.02 * s, 0.15 * s, 0.04 * s),
    trimMaterial
  );
  spine.position.set(-0.28 * s, 0.45 * s, 0.14 * s);
  spine.rotation.y = 0.3;
  group.add(spine);

  // Magical glow around tome
  const tomeGlow = new THREE.Mesh(
    new THREE.SphereGeometry(0.1 * s, 6, 4),
    new THREE.MeshStandardMaterial({
      color: 0x8899bb,
      emissive: 0x6677aa,
      emissiveIntensity: 0.4,
      transparent: true,
      opacity: 0.25,
    })
  );
  tomeGlow.position.set(-0.22 * s, 0.45 * s, 0.16 * s);
  group.add(tomeGlow);

  // === FLOATING QUILL (canonical) ===
  // Quill shaft
  const quillShaft = new THREE.Mesh(
    new THREE.CylinderGeometry(0.005 * s, 0.003 * s, 0.12 * s, 6),
    inkMaterial
  );
  quillShaft.position.set(0.22 * s, 0.5 * s, 0.18 * s);
  quillShaft.rotation.z = -0.5;
  quillShaft.rotation.x = -0.3;
  group.add(quillShaft);

  // Quill feather
  const feather = new THREE.Mesh(
    new THREE.BoxGeometry(0.03 * s, 0.08 * s, 0.01 * s),
    featherMaterial
  );
  feather.position.set(0.26 * s, 0.55 * s, 0.16 * s);
  feather.rotation.z = -0.5;
  group.add(feather);

  // Ink drip from quill
  const inkDrip = new THREE.Mesh(
    new THREE.SphereGeometry(0.01 * s, 4, 4),
    inkMaterial
  );
  inkDrip.position.set(0.18 * s, 0.44 * s, 0.2 * s);
  group.add(inkDrip);

  // Quill glow
  const quillGlow = new THREE.Mesh(
    new THREE.SphereGeometry(0.04 * s, 6, 4),
    new THREE.MeshStandardMaterial({
      color: 0x9999cc,
      emissive: 0x7777aa,
      emissiveIntensity: 0.5,
      transparent: true,
      opacity: 0.3,
    })
  );
  quillGlow.position.set(0.22 * s, 0.5 * s, 0.18 * s);
  group.add(quillGlow);

  return group;
}

export const COURT_SCRIBE_META = {
  id: 'court-scribe',
  name: 'Court Scribe',
  category: 'enemy' as const,
  description: 'Translucent figure in scholar\'s robes. Carries floating quill and tome - canonical design',
  defaultScale: 1.0,
  boundingBox: { x: 0.5, y: 0.8, z: 0.4 },
  tags: ['ghost', 'scholar', 'undead', 'enemy', 'spectral', 'magic', 'canonical'],
  enemyName: 'Court Scribe',
};
