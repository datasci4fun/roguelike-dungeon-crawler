/**
 * Bile Lurker Enemy Model
 * Canonical design based on bestiary appearance.
 *
 * Canonical appearance from bestiary:
 * "Amorphous blob of greenish-yellow ooze. Bubbles constantly release noxious fumes."
 */

import * as THREE from 'three';

export interface BileLurkerOptions {
  scale?: number;
}

export function createBileLurker(options: BileLurkerOptions = {}): THREE.Group {
  const { scale = 1.0 } = options;

  const group = new THREE.Group();
  const s = scale * 0.9;

  // === MATERIALS ===
  // Core ooze (canonical - greenish-yellow)
  const coreOozeMaterial = new THREE.MeshStandardMaterial({
    color: 0x889922,
    roughness: 0.2,
    metalness: 0.1,
    emissive: 0x445511,
    emissiveIntensity: 0.4,
    transparent: true,
    opacity: 0.85,
  });

  // Outer ooze (lighter, more translucent)
  const outerOozeMaterial = new THREE.MeshStandardMaterial({
    color: 0xaacc44,
    roughness: 0.15,
    metalness: 0.05,
    emissive: 0x556622,
    emissiveIntensity: 0.3,
    transparent: true,
    opacity: 0.7,
  });

  // Bubble material
  const bubbleMaterial = new THREE.MeshStandardMaterial({
    color: 0xccdd66,
    roughness: 0.1,
    metalness: 0.0,
    emissive: 0x889944,
    emissiveIntensity: 0.5,
    transparent: true,
    opacity: 0.6,
  });

  // Darker bile chunks
  const darkBileMaterial = new THREE.MeshStandardMaterial({
    color: 0x667711,
    roughness: 0.3,
    metalness: 0.1,
    transparent: true,
    opacity: 0.9,
  });

  // Toxic fumes (canonical - noxious fumes)
  const fumeMaterial = new THREE.MeshStandardMaterial({
    color: 0xbbcc55,
    roughness: 0.1,
    metalness: 0.0,
    emissive: 0x889933,
    emissiveIntensity: 0.6,
    transparent: true,
    opacity: 0.3,
  });

  // Eyes (if any visible)
  const eyeMaterial = new THREE.MeshStandardMaterial({
    color: 0xff4444,
    roughness: 0.2,
    metalness: 0.0,
    emissive: 0xaa2222,
    emissiveIntensity: 1.0,
  });

  // === MAIN BLOB BODY (amorphous) ===
  // Core mass
  const coreBlob = new THREE.Mesh(
    new THREE.SphereGeometry(0.2 * s, 10, 8),
    coreOozeMaterial
  );
  coreBlob.position.y = 0.18 * s;
  coreBlob.scale.set(1.2, 0.7, 1.1);
  group.add(coreBlob);

  // Outer blob layer
  const outerBlob = new THREE.Mesh(
    new THREE.SphereGeometry(0.24 * s, 10, 8),
    outerOozeMaterial
  );
  outerBlob.position.y = 0.16 * s;
  outerBlob.scale.set(1.3, 0.65, 1.2);
  group.add(outerBlob);

  // Amorphous protrusions (pseudopods)
  const protrusionGeo = new THREE.SphereGeometry(0.08 * s, 6, 4);
  const protrusions = [
    { x: -0.2, y: 0.12, z: 0.1, sx: 1.2, sy: 0.8, sz: 1.0 },
    { x: 0.18, y: 0.14, z: 0.12, sx: 1.0, sy: 0.9, sz: 1.1 },
    { x: -0.15, y: 0.1, z: -0.14, sx: 1.1, sy: 0.7, sz: 1.0 },
    { x: 0.2, y: 0.08, z: -0.1, sx: 0.9, sy: 0.8, sz: 1.2 },
    { x: 0, y: 0.2, z: 0.18, sx: 1.0, sy: 1.0, sz: 0.8 },
    { x: -0.08, y: 0.22, z: -0.12, sx: 0.8, sy: 1.1, sz: 0.9 },
  ];

  protrusions.forEach((p) => {
    const blob = new THREE.Mesh(protrusionGeo, coreOozeMaterial);
    blob.position.set(p.x * s, p.y * s, p.z * s);
    blob.scale.set(p.sx, p.sy, p.sz);
    group.add(blob);
  });

  // Spreading base (pooling ooze)
  const basePool = new THREE.Mesh(
    new THREE.CylinderGeometry(0.3 * s, 0.35 * s, 0.04 * s, 10),
    outerOozeMaterial
  );
  basePool.position.y = 0.02 * s;
  group.add(basePool);

  // Toxic trail drips
  const dripGeo = new THREE.SphereGeometry(0.03 * s, 4, 4);
  const drips = [
    { x: -0.3, z: 0.15 },
    { x: 0.28, z: -0.12 },
    { x: -0.25, z: -0.2 },
    { x: 0.32, z: 0.08 },
  ];

  drips.forEach((d) => {
    const drip = new THREE.Mesh(dripGeo, darkBileMaterial);
    drip.position.set(d.x * s, 0.015 * s, d.z * s);
    drip.scale.set(1, 0.5, 1);
    group.add(drip);
  });

  // === BUBBLES (canonical - bubbles constantly release fumes) ===
  const bubbleGeo = new THREE.SphereGeometry(0.025 * s, 6, 4);
  const bubblePositions = [
    { x: -0.08, y: 0.28, z: 0.12 },
    { x: 0.1, y: 0.26, z: 0.08 },
    { x: -0.12, y: 0.22, z: -0.06 },
    { x: 0.06, y: 0.3, z: -0.1 },
    { x: 0, y: 0.32, z: 0.06 },
    { x: -0.05, y: 0.24, z: 0.14 },
    { x: 0.14, y: 0.2, z: 0.04 },
    { x: -0.1, y: 0.18, z: 0.1 },
  ];

  bubblePositions.forEach((b) => {
    const bubble = new THREE.Mesh(bubbleGeo, bubbleMaterial);
    bubble.position.set(b.x * s, b.y * s, b.z * s);
    const bubbleScale = 0.7 + Math.random() * 0.6;
    bubble.scale.setScalar(bubbleScale);
    group.add(bubble);
  });

  // Larger bubbles about to pop
  const largeBubbleGeo = new THREE.SphereGeometry(0.04 * s, 6, 4);
  const largeBubbles = [
    { x: 0.05, y: 0.28, z: 0.1 },
    { x: -0.1, y: 0.26, z: -0.04 },
  ];

  largeBubbles.forEach((b) => {
    const bubble = new THREE.Mesh(largeBubbleGeo, bubbleMaterial);
    bubble.position.set(b.x * s, b.y * s, b.z * s);
    group.add(bubble);
  });

  // === NOXIOUS FUMES (canonical) ===
  const fumeGeo = new THREE.SphereGeometry(0.05 * s, 6, 4);
  const fumes = [
    { x: -0.06, y: 0.38, z: 0.08 },
    { x: 0.08, y: 0.4, z: 0.04 },
    { x: -0.04, y: 0.44, z: -0.02 },
    { x: 0.02, y: 0.36, z: 0.1 },
    { x: -0.1, y: 0.42, z: 0.02 },
  ];

  fumes.forEach((f) => {
    const fume = new THREE.Mesh(fumeGeo, fumeMaterial);
    fume.position.set(f.x * s, f.y * s, f.z * s);
    const fumeScale = 0.6 + Math.random() * 0.8;
    fume.scale.setScalar(fumeScale);
    group.add(fume);
  });

  // Rising fume wisps
  const fumeWispGeo = new THREE.BoxGeometry(0.02 * s, 0.06 * s, 0.015 * s);
  const fumeWisps = [
    { x: 0, y: 0.48, z: 0.06 },
    { x: -0.08, y: 0.5, z: 0 },
    { x: 0.06, y: 0.46, z: -0.04 },
  ];

  fumeWisps.forEach((fw) => {
    const wisp = new THREE.Mesh(fumeWispGeo, fumeMaterial);
    wisp.position.set(fw.x * s, fw.y * s, fw.z * s);
    wisp.rotation.z = Math.random() * 0.4 - 0.2;
    group.add(wisp);
  });

  // === EYES (lurking within the ooze) ===
  const eyeGeo = new THREE.SphereGeometry(0.02 * s, 6, 4);

  const eye1 = new THREE.Mesh(eyeGeo, eyeMaterial);
  eye1.position.set(-0.06 * s, 0.22 * s, 0.16 * s);
  group.add(eye1);

  const eye2 = new THREE.Mesh(eyeGeo, eyeMaterial);
  eye2.position.set(0.08 * s, 0.2 * s, 0.14 * s);
  group.add(eye2);

  // === DARK CHUNKS (debris/undigested matter) ===
  const chunkGeo = new THREE.BoxGeometry(0.03 * s, 0.025 * s, 0.03 * s);
  const chunks = [
    { x: -0.12, y: 0.14, z: 0.06 },
    { x: 0.1, y: 0.12, z: -0.08 },
    { x: -0.06, y: 0.16, z: -0.1 },
    { x: 0.14, y: 0.1, z: 0.04 },
  ];

  chunks.forEach((c) => {
    const chunk = new THREE.Mesh(chunkGeo, darkBileMaterial);
    chunk.position.set(c.x * s, c.y * s, c.z * s);
    chunk.rotation.set(Math.random(), Math.random(), Math.random());
    group.add(chunk);
  });

  return group;
}

export const BILE_LURKER_META = {
  id: 'bile-lurker',
  name: 'Bile Lurker',
  category: 'enemy' as const,
  description: 'Amorphous blob of greenish-yellow ooze. Bubbles constantly release noxious fumes - canonical design',
  defaultScale: 1.0,
  boundingBox: { x: 0.7, y: 0.5, z: 0.7 },
  tags: ['ooze', 'slime', 'enemy', 'creature', 'poison', 'acid', 'canonical'],
  enemyName: 'Bile Lurker',
};
