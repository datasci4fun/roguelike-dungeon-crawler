/**
 * Frost Wisp Enemy Model
 * Canonical design based on bestiary appearance.
 *
 * Canonical appearance from bestiary:
 * "Small glowing orb of pale blue light surrounded by swirling snowflakes."
 */

import * as THREE from 'three';

export interface FrostWispOptions {
  scale?: number;
}

export function createFrostWisp(options: FrostWispOptions = {}): THREE.Group {
  const { scale = 1.0 } = options;

  const group = new THREE.Group();
  const s = scale * 0.6; // Small wisp

  // === MATERIALS ===
  // Core light (canonical - pale blue light)
  const coreMaterial = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    roughness: 0.0,
    metalness: 0.0,
    emissive: 0xccddff,
    emissiveIntensity: 2.5,
  });

  // Inner glow
  const innerGlowMaterial = new THREE.MeshStandardMaterial({
    color: 0xaaccff,
    roughness: 0.1,
    metalness: 0.0,
    emissive: 0x88aaff,
    emissiveIntensity: 2.0,
    transparent: true,
    opacity: 0.9,
  });

  // Outer glow (pale blue)
  const outerGlowMaterial = new THREE.MeshStandardMaterial({
    color: 0x88bbff,
    roughness: 0.2,
    metalness: 0.0,
    emissive: 0x6699dd,
    emissiveIntensity: 1.2,
    transparent: true,
    opacity: 0.6,
  });

  // Halo glow
  const haloMaterial = new THREE.MeshStandardMaterial({
    color: 0x99ccff,
    roughness: 0.1,
    metalness: 0.0,
    emissive: 0x6699cc,
    emissiveIntensity: 0.8,
    transparent: true,
    opacity: 0.35,
  });

  // Snowflake material (canonical - swirling snowflakes)
  const snowflakeMaterial = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    roughness: 0.3,
    metalness: 0.1,
    emissive: 0xaabbcc,
    emissiveIntensity: 0.5,
  });

  // Ice crystal material
  const iceMaterial = new THREE.MeshStandardMaterial({
    color: 0xccddff,
    roughness: 0.1,
    metalness: 0.2,
    emissive: 0x88aacc,
    emissiveIntensity: 0.4,
    transparent: true,
    opacity: 0.75,
  });

  // === CORE ORB (canonical - glowing orb) ===
  // Bright core
  const core = new THREE.Mesh(
    new THREE.SphereGeometry(0.06 * s, 10, 8),
    coreMaterial
  );
  core.position.y = 0.4 * s;
  group.add(core);

  // Inner glow layer
  const innerGlow = new THREE.Mesh(
    new THREE.SphereGeometry(0.09 * s, 10, 8),
    innerGlowMaterial
  );
  innerGlow.position.y = 0.4 * s;
  group.add(innerGlow);

  // Outer glow layer
  const outerGlow = new THREE.Mesh(
    new THREE.SphereGeometry(0.12 * s, 10, 8),
    outerGlowMaterial
  );
  outerGlow.position.y = 0.4 * s;
  group.add(outerGlow);

  // Halo effect
  const halo = new THREE.Mesh(
    new THREE.SphereGeometry(0.16 * s, 10, 8),
    haloMaterial
  );
  halo.position.y = 0.4 * s;
  group.add(halo);

  // === SWIRLING SNOWFLAKES (canonical) ===
  // Simple snowflake shape (6-pointed star using boxes)
  const createSnowflake = (x: number, y: number, z: number, flakeScale: number, rotation: number) => {
    const armGeo = new THREE.BoxGeometry(0.04 * s * flakeScale, 0.006 * s * flakeScale, 0.006 * s * flakeScale);

    for (let i = 0; i < 3; i++) {
      const arm = new THREE.Mesh(armGeo, snowflakeMaterial);
      arm.position.set(x * s, y * s, z * s);
      arm.rotation.y = rotation + (i / 3) * Math.PI;
      group.add(arm);
    }
  };

  // Snowflakes at various positions around the orb
  const snowflakePositions = [
    { x: -0.18, y: 0.45, z: 0.1, scale: 1.0, rot: 0 },
    { x: 0.2, y: 0.42, z: 0.08, scale: 0.8, rot: 0.5 },
    { x: -0.15, y: 0.35, z: -0.12, scale: 0.9, rot: 0.3 },
    { x: 0.16, y: 0.48, z: -0.1, scale: 0.7, rot: 0.7 },
    { x: 0, y: 0.55, z: 0.15, scale: 0.85, rot: 0.2 },
    { x: -0.12, y: 0.52, z: 0.14, scale: 0.6, rot: 0.8 },
    { x: 0.14, y: 0.32, z: 0.12, scale: 0.75, rot: 0.4 },
    { x: -0.08, y: 0.28, z: -0.14, scale: 0.65, rot: 0.6 },
    { x: 0.1, y: 0.38, z: -0.16, scale: 0.55, rot: 0.1 },
    { x: -0.2, y: 0.38, z: -0.04, scale: 0.7, rot: 0.9 },
  ];

  snowflakePositions.forEach((sf) => {
    createSnowflake(sf.x, sf.y, sf.z, sf.scale, sf.rot);
  });

  // === TRAILING ICE CRYSTALS ===
  const crystalGeo = new THREE.BoxGeometry(0.015 * s, 0.04 * s, 0.015 * s);
  const crystalPositions = [
    { x: -0.1, y: 0.25, z: 0.08, rz: 0.3 },
    { x: 0.12, y: 0.22, z: 0.06, rz: -0.25 },
    { x: -0.08, y: 0.2, z: -0.1, rz: 0.4 },
    { x: 0.06, y: 0.18, z: -0.08, rz: -0.35 },
    { x: 0, y: 0.15, z: 0.1, rz: 0.1 },
  ];

  crystalPositions.forEach((cp) => {
    const crystal = new THREE.Mesh(crystalGeo, iceMaterial);
    crystal.position.set(cp.x * s, cp.y * s, cp.z * s);
    crystal.rotation.z = cp.rz;
    group.add(crystal);
  });

  // === FROST AURA RING (for Frost Aura ability) ===
  const auraRing = new THREE.Mesh(
    new THREE.TorusGeometry(0.22 * s, 0.015 * s, 6, 16),
    new THREE.MeshStandardMaterial({
      color: 0xaaccff,
      roughness: 0.2,
      metalness: 0.1,
      emissive: 0x6699cc,
      emissiveIntensity: 0.6,
      transparent: true,
      opacity: 0.4,
    })
  );
  auraRing.position.y = 0.4 * s;
  auraRing.rotation.x = Math.PI / 2;
  group.add(auraRing);

  // Secondary aura ring
  const auraRing2 = new THREE.Mesh(
    new THREE.TorusGeometry(0.28 * s, 0.01 * s, 6, 16),
    new THREE.MeshStandardMaterial({
      color: 0x99bbee,
      roughness: 0.2,
      metalness: 0.1,
      emissive: 0x5588aa,
      emissiveIntensity: 0.4,
      transparent: true,
      opacity: 0.25,
    })
  );
  auraRing2.position.y = 0.4 * s;
  auraRing2.rotation.x = Math.PI / 2;
  auraRing2.rotation.z = 0.5;
  group.add(auraRing2);

  // === LIGHT WISPS (trailing energy) ===
  const wispTrailGeo = new THREE.SphereGeometry(0.02 * s, 6, 4);
  const trailPositions = [
    { x: 0, y: 0.25, z: 0, opacity: 0.6 },
    { x: -0.02, y: 0.18, z: 0.02, opacity: 0.4 },
    { x: 0.01, y: 0.12, z: -0.01, opacity: 0.25 },
  ];

  trailPositions.forEach((tp) => {
    const trail = new THREE.Mesh(
      wispTrailGeo,
      new THREE.MeshStandardMaterial({
        color: 0xaaccff,
        emissive: 0x88aadd,
        emissiveIntensity: 1.0,
        transparent: true,
        opacity: tp.opacity,
      })
    );
    trail.position.set(tp.x * s, tp.y * s, tp.z * s);
    group.add(trail);
  });

  return group;
}

export const FROST_WISP_META = {
  id: 'frost-wisp',
  name: 'Frost Wisp',
  category: 'enemy' as const,
  description: 'Small glowing orb of pale blue light surrounded by swirling snowflakes - canonical design',
  defaultScale: 1.0,
  boundingBox: { x: 0.4, y: 0.5, z: 0.4 },
  tags: ['wisp', 'ice', 'frost', 'enemy', 'elemental', 'magic', 'canonical'],
  enemyName: 'Frost Wisp',
};
