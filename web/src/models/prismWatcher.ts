/**
 * Prism Watcher Enemy Model
 * Canonical design based on bestiary appearance.
 *
 * Canonical appearance from bestiary:
 * "Floating crystal orb with a single massive eye. Smaller eyes orbit around it. Crackles with electricity."
 */

import * as THREE from 'three';

export interface PrismWatcherOptions {
  scale?: number;
}

export function createPrismWatcher(options: PrismWatcherOptions = {}): THREE.Group {
  const { scale = 1.0 } = options;

  const group = new THREE.Group();
  const s = scale * 0.9;

  // === MATERIALS ===
  // Crystal orb (canonical - crystal orb)
  const crystalMaterial = new THREE.MeshStandardMaterial({
    color: 0xaaddff,
    roughness: 0.05,
    metalness: 0.3,
    emissive: 0x6699cc,
    emissiveIntensity: 0.5,
    transparent: true,
    opacity: 0.8,
  });

  // Inner crystal
  const innerCrystalMaterial = new THREE.MeshStandardMaterial({
    color: 0xcceeFF,
    roughness: 0.1,
    metalness: 0.2,
    emissive: 0x88aadd,
    emissiveIntensity: 0.8,
    transparent: true,
    opacity: 0.9,
  });

  // Main eye (canonical - single massive eye)
  const mainEyeMaterial = new THREE.MeshStandardMaterial({
    color: 0xffff88,
    roughness: 0.1,
    metalness: 0.0,
    emissive: 0xddcc44,
    emissiveIntensity: 1.5,
  });

  // Pupil
  const pupilMaterial = new THREE.MeshStandardMaterial({
    color: 0x111133,
    roughness: 0.1,
    metalness: 0.2,
    emissive: 0x222255,
    emissiveIntensity: 0.3,
  });

  // Smaller orbiting eyes (canonical)
  const smallEyeMaterial = new THREE.MeshStandardMaterial({
    color: 0xffdd66,
    roughness: 0.15,
    metalness: 0.0,
    emissive: 0xccaa44,
    emissiveIntensity: 1.2,
  });

  // Electricity material (canonical - crackles with electricity)
  const electricMaterial = new THREE.MeshStandardMaterial({
    color: 0xaaddff,
    roughness: 0.1,
    metalness: 0.0,
    emissive: 0x88ccff,
    emissiveIntensity: 2.0,
  });

  // === MAIN CRYSTAL ORB ===
  // Outer crystal shell
  const outerOrb = new THREE.Mesh(
    new THREE.SphereGeometry(0.2 * s, 12, 10),
    crystalMaterial
  );
  outerOrb.position.y = 0.4 * s;
  group.add(outerOrb);

  // Inner crystal core
  const innerOrb = new THREE.Mesh(
    new THREE.SphereGeometry(0.15 * s, 10, 8),
    innerCrystalMaterial
  );
  innerOrb.position.y = 0.4 * s;
  group.add(innerOrb);

  // Crystal facets (for prismatic effect)
  const facetGeo = new THREE.BoxGeometry(0.08 * s, 0.08 * s, 0.02 * s);
  const facetPositions = [
    { x: 0.15, y: 0.45, z: 0.1, ry: 0.4 },
    { x: -0.16, y: 0.42, z: 0.08, ry: -0.3 },
    { x: 0.12, y: 0.35, z: -0.12, ry: 2.2 },
    { x: -0.1, y: 0.48, z: -0.14, ry: -2.0 },
    { x: 0, y: 0.55, z: 0.12, ry: 0 },
  ];

  facetPositions.forEach((fp) => {
    const facet = new THREE.Mesh(facetGeo, crystalMaterial);
    facet.position.set(fp.x * s, fp.y * s, fp.z * s);
    facet.rotation.y = fp.ry;
    facet.lookAt(0, 0.4 * s, 0);
    group.add(facet);
  });

  // === MASSIVE CENTRAL EYE (canonical) ===
  // Eye white/iris
  const mainEye = new THREE.Mesh(
    new THREE.SphereGeometry(0.1 * s, 10, 8),
    mainEyeMaterial
  );
  mainEye.position.set(0, 0.4 * s, 0.12 * s);
  mainEye.scale.set(1, 1, 0.6);
  group.add(mainEye);

  // Pupil
  const pupil = new THREE.Mesh(
    new THREE.SphereGeometry(0.04 * s, 8, 6),
    pupilMaterial
  );
  pupil.position.set(0, 0.4 * s, 0.16 * s);
  group.add(pupil);

  // Eye glow
  const eyeGlow = new THREE.Mesh(
    new THREE.SphereGeometry(0.12 * s, 8, 6),
    new THREE.MeshStandardMaterial({
      color: 0xffffaa,
      emissive: 0xddcc66,
      emissiveIntensity: 0.6,
      transparent: true,
      opacity: 0.3,
    })
  );
  eyeGlow.position.set(0, 0.4 * s, 0.1 * s);
  eyeGlow.scale.set(1, 1, 0.5);
  group.add(eyeGlow);

  // === ORBITING SMALLER EYES (canonical) ===
  const smallEyeGeo = new THREE.SphereGeometry(0.03 * s, 6, 4);
  const smallPupilGeo = new THREE.SphereGeometry(0.012 * s, 4, 4);

  const orbitEyes = [
    { angle: 0, dist: 0.28, height: 0.45 },
    { angle: Math.PI * 0.5, dist: 0.26, height: 0.38 },
    { angle: Math.PI, dist: 0.27, height: 0.42 },
    { angle: Math.PI * 1.5, dist: 0.25, height: 0.35 },
    { angle: Math.PI * 0.25, dist: 0.3, height: 0.5 },
    { angle: Math.PI * 1.25, dist: 0.29, height: 0.32 },
  ];

  orbitEyes.forEach((oe) => {
    const x = Math.cos(oe.angle) * oe.dist;
    const z = Math.sin(oe.angle) * oe.dist;

    // Small eye
    const eye = new THREE.Mesh(smallEyeGeo, smallEyeMaterial);
    eye.position.set(x * s, oe.height * s, z * s);
    group.add(eye);

    // Small pupil (looking outward)
    const pupilSmall = new THREE.Mesh(smallPupilGeo, pupilMaterial);
    pupilSmall.position.set((x + Math.cos(oe.angle) * 0.02) * s, oe.height * s, (z + Math.sin(oe.angle) * 0.02) * s);
    group.add(pupilSmall);
  });

  // === ELECTRICITY ARCS (canonical - crackles with electricity) ===
  const arcGeo = new THREE.BoxGeometry(0.015 * s, 0.12 * s, 0.01 * s);
  const electricArcs = [
    { x: -0.18, y: 0.5, z: 0.1, rz: 0.5 },
    { x: 0.2, y: 0.45, z: 0.08, rz: -0.4 },
    { x: -0.15, y: 0.32, z: -0.12, rz: 0.6 },
    { x: 0.16, y: 0.35, z: -0.1, rz: -0.3 },
    { x: 0, y: 0.58, z: 0.14, rz: 0.2 },
    { x: -0.1, y: 0.28, z: 0.15, rz: 0.7 },
    { x: 0.12, y: 0.52, z: -0.14, rz: -0.5 },
  ];

  electricArcs.forEach((ea) => {
    const arc = new THREE.Mesh(arcGeo, electricMaterial);
    arc.position.set(ea.x * s, ea.y * s, ea.z * s);
    arc.rotation.z = ea.rz;
    arc.rotation.y = Math.random();
    group.add(arc);
  });

  // Electric sparks
  const sparkGeo = new THREE.SphereGeometry(0.015 * s, 4, 4);
  const sparks = [
    { x: -0.22, y: 0.48 },
    { x: 0.24, y: 0.42 },
    { x: -0.18, y: 0.55 },
    { x: 0.2, y: 0.3 },
  ];

  sparks.forEach((sp) => {
    const spark = new THREE.Mesh(sparkGeo, electricMaterial);
    spark.position.set(sp.x * s, sp.y * s, 0.06 * s);
    group.add(spark);
  });

  // === FLOATING EFFECT (rings) ===
  const floatRing = new THREE.Mesh(
    new THREE.TorusGeometry(0.22 * s, 0.015 * s, 6, 16),
    new THREE.MeshStandardMaterial({
      color: 0xaaccff,
      emissive: 0x6699cc,
      emissiveIntensity: 0.6,
      transparent: true,
      opacity: 0.4,
    })
  );
  floatRing.position.y = 0.2 * s;
  floatRing.rotation.x = Math.PI / 2;
  group.add(floatRing);

  const floatRing2 = new THREE.Mesh(
    new THREE.TorusGeometry(0.18 * s, 0.01 * s, 6, 16),
    new THREE.MeshStandardMaterial({
      color: 0x99bbee,
      emissive: 0x5588aa,
      emissiveIntensity: 0.4,
      transparent: true,
      opacity: 0.3,
    })
  );
  floatRing2.position.y = 0.15 * s;
  floatRing2.rotation.x = Math.PI / 2;
  floatRing2.rotation.z = 0.5;
  group.add(floatRing2);

  return group;
}

export const PRISM_WATCHER_META = {
  id: 'prism-watcher',
  name: 'Prism Watcher',
  category: 'enemy' as const,
  description: 'Floating crystal orb with a single massive eye. Smaller eyes orbit around it. Crackles with electricity - canonical design',
  defaultScale: 1.0,
  boundingBox: { x: 0.6, y: 0.7, z: 0.6 },
  tags: ['beholder', 'eye', 'crystal', 'enemy', 'elemental', 'lightning', 'canonical'],
  enemyName: 'Prism Watcher',
};
