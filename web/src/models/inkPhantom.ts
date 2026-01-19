/**
 * Ink Phantom Enemy Model
 * Canonical design based on bestiary appearance.
 *
 * Canonical appearance from bestiary:
 * "Humanoid shape of flowing black ink. Words and symbols constantly form and dissolve on its surface."
 */

import * as THREE from 'three';

export interface InkPhantomOptions {
  scale?: number;
}

export function createInkPhantom(options: InkPhantomOptions = {}): THREE.Group {
  const { scale = 1.0 } = options;

  const group = new THREE.Group();
  const s = scale * 1.0;

  // === MATERIALS ===
  // Black ink body (canonical - flowing black ink)
  const inkMaterial = new THREE.MeshStandardMaterial({
    color: 0x0a0a12,
    roughness: 0.2,
    metalness: 0.3,
    emissive: 0x050508,
    emissiveIntensity: 0.2,
  });

  // Flowing ink (slightly glossy)
  const flowingInkMaterial = new THREE.MeshStandardMaterial({
    color: 0x111120,
    roughness: 0.15,
    metalness: 0.4,
    transparent: true,
    opacity: 0.85,
  });

  // Glowing symbols (canonical - words and symbols form on surface)
  const symbolMaterial = new THREE.MeshStandardMaterial({
    color: 0x4444aa,
    roughness: 0.1,
    metalness: 0.0,
    emissive: 0x3333aa,
    emissiveIntensity: 1.5,
  });

  // Eyes (piercing through ink)
  const eyeMaterial = new THREE.MeshStandardMaterial({
    color: 0x6666ff,
    roughness: 0.1,
    metalness: 0.0,
    emissive: 0x4444dd,
    emissiveIntensity: 2.0,
  });

  // === HEAD (flowing ink shape) ===
  const head = new THREE.Mesh(
    new THREE.SphereGeometry(0.1 * s, 8, 6),
    inkMaterial
  );
  head.position.y = 0.72 * s;
  head.scale.set(1, 1.15, 0.9);
  group.add(head);

  // Flowing ink drips from head
  const dripGeo = new THREE.BoxGeometry(0.02 * s, 0.08 * s, 0.015 * s);
  const headDrips = [
    { x: -0.06, y: 0.64, z: 0.04 },
    { x: 0.05, y: 0.62, z: 0.05 },
    { x: -0.04, y: 0.66, z: -0.06 },
  ];

  headDrips.forEach((d) => {
    const drip = new THREE.Mesh(dripGeo, flowingInkMaterial);
    drip.position.set(d.x * s, d.y * s, d.z * s);
    group.add(drip);
  });

  // Piercing eyes
  const eyeGeo = new THREE.SphereGeometry(0.02 * s, 6, 4);

  const leftEye = new THREE.Mesh(eyeGeo, eyeMaterial);
  leftEye.position.set(-0.035 * s, 0.74 * s, 0.07 * s);
  group.add(leftEye);

  const rightEye = new THREE.Mesh(eyeGeo, eyeMaterial);
  rightEye.position.set(0.035 * s, 0.74 * s, 0.07 * s);
  group.add(rightEye);

  // === TORSO (flowing humanoid shape) ===
  const torso = new THREE.Mesh(
    new THREE.BoxGeometry(0.18 * s, 0.26 * s, 0.1 * s),
    inkMaterial
  );
  torso.position.y = 0.5 * s;
  group.add(torso);

  // Flowing ink layer
  const torsoFlow = new THREE.Mesh(
    new THREE.BoxGeometry(0.2 * s, 0.28 * s, 0.12 * s),
    flowingInkMaterial
  );
  torsoFlow.position.y = 0.5 * s;
  group.add(torsoFlow);

  // === SYMBOLS ON SURFACE (canonical) ===
  const symbolGeo = new THREE.BoxGeometry(0.03 * s, 0.03 * s, 0.005 * s);
  const lineGeo = new THREE.BoxGeometry(0.04 * s, 0.008 * s, 0.005 * s);

  // Various glowing symbols
  const symbols = [
    { x: -0.06, y: 0.54, z: 0.07, type: 'square' },
    { x: 0.05, y: 0.48, z: 0.065, type: 'line' },
    { x: -0.04, y: 0.42, z: 0.07, type: 'line' },
    { x: 0.07, y: 0.56, z: 0.06, type: 'square' },
    { x: -0.08, y: 0.5, z: 0.065, type: 'line' },
    { x: 0, y: 0.52, z: 0.075, type: 'square' },
  ];

  symbols.forEach((sym) => {
    const geo = sym.type === 'square' ? symbolGeo : lineGeo;
    const symbol = new THREE.Mesh(geo, symbolMaterial);
    symbol.position.set(sym.x * s, sym.y * s, sym.z * s);
    symbol.rotation.z = Math.random() * 0.5;
    group.add(symbol);
  });

  // === ARMS (ink tendrils) ===
  const armGeo = new THREE.BoxGeometry(0.05 * s, 0.18 * s, 0.04 * s);

  const leftArm = new THREE.Mesh(armGeo, inkMaterial);
  leftArm.position.set(-0.14 * s, 0.48 * s, 0);
  leftArm.rotation.z = 0.2;
  group.add(leftArm);

  const rightArm = new THREE.Mesh(armGeo, inkMaterial);
  rightArm.position.set(0.14 * s, 0.48 * s, 0);
  rightArm.rotation.z = -0.2;
  group.add(rightArm);

  // Ink tendril fingers (for Ink Lash ability)
  const tendrilGeo = new THREE.BoxGeometry(0.015 * s, 0.1 * s, 0.01 * s);

  for (let i = 0; i < 4; i++) {
    // Left tendrils
    const leftTendril = new THREE.Mesh(tendrilGeo, flowingInkMaterial);
    leftTendril.position.set((-0.16 - i * 0.015) * s, 0.34 * s, (i * 0.02) * s);
    leftTendril.rotation.z = 0.3 + i * 0.1;
    group.add(leftTendril);

    // Right tendrils
    const rightTendril = new THREE.Mesh(tendrilGeo, flowingInkMaterial);
    rightTendril.position.set((0.16 + i * 0.015) * s, 0.34 * s, (i * 0.02) * s);
    rightTendril.rotation.z = -0.3 - i * 0.1;
    group.add(rightTendril);
  }

  // === LOWER BODY (dissolving into ink) ===
  const lowerBody = new THREE.Mesh(
    new THREE.BoxGeometry(0.14 * s, 0.2 * s, 0.1 * s),
    inkMaterial
  );
  lowerBody.position.y = 0.28 * s;
  group.add(lowerBody);

  // Dripping/dissolving bottom
  const dissolveGeo = new THREE.BoxGeometry(0.03 * s, 0.12 * s, 0.025 * s);
  const dissolves = [
    { x: -0.05, z: 0.03 },
    { x: 0.04, z: 0.04 },
    { x: -0.02, z: -0.04 },
    { x: 0.06, z: -0.02 },
    { x: 0, z: 0.05 },
  ];

  dissolves.forEach((d) => {
    const dissolve = new THREE.Mesh(dissolveGeo, flowingInkMaterial);
    dissolve.position.set(d.x * s, 0.14 * s, d.z * s);
    group.add(dissolve);
  });

  // Ink pool at base
  const poolMaterial = new THREE.MeshStandardMaterial({
    color: 0x080810,
    roughness: 0.15,
    metalness: 0.3,
    transparent: true,
    opacity: 0.7,
  });

  const inkPool = new THREE.Mesh(
    new THREE.CylinderGeometry(0.18 * s, 0.22 * s, 0.02 * s, 10),
    poolMaterial
  );
  inkPool.position.y = 0.06 * s;
  group.add(inkPool);

  // === FLOATING INK DROPLETS ===
  const dropletGeo = new THREE.SphereGeometry(0.015 * s, 6, 4);
  const droplets = [
    { x: -0.15, y: 0.6 },
    { x: 0.12, y: 0.55 },
    { x: -0.1, y: 0.42 },
    { x: 0.14, y: 0.38 },
  ];

  droplets.forEach((dp) => {
    const droplet = new THREE.Mesh(dropletGeo, inkMaterial);
    droplet.position.set(dp.x * s, dp.y * s, 0.08 * s);
    group.add(droplet);
  });

  return group;
}

export const INK_PHANTOM_META = {
  id: 'ink-phantom',
  name: 'Ink Phantom',
  category: 'enemy' as const,
  description: 'Humanoid shape of flowing black ink. Words and symbols constantly form and dissolve on its surface - canonical design',
  defaultScale: 1.0,
  boundingBox: { x: 0.4, y: 0.8, z: 0.3 },
  tags: ['phantom', 'ink', 'shadow', 'enemy', 'stealth', 'magic', 'canonical'],
  enemyName: 'Ink Phantom',
};
