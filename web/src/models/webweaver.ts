/**
 * Webweaver Enemy Model
 * Canonical design based on bestiary appearance.
 *
 * Canonical appearance from bestiary:
 * "Large spider with intricate patterns on its back. Spinnerets glow faintly."
 */

import * as THREE from 'three';

export interface WebweaverOptions {
  scale?: number;
}

export function createWebweaver(options: WebweaverOptions = {}): THREE.Group {
  const { scale = 1.0 } = options;

  const group = new THREE.Group();
  const s = scale * 0.8; // Large spider

  // === MATERIALS ===
  // Dark carapace
  const carapaceMaterial = new THREE.MeshStandardMaterial({
    color: 0x2a2a3a, // Dark purple-gray
    roughness: 0.3,
    metalness: 0.2,
  });

  // Pattern material (lighter for intricate patterns)
  const patternMaterial = new THREE.MeshStandardMaterial({
    color: 0x6a5a7a, // Light purple
    roughness: 0.4,
    metalness: 0.1,
    emissive: 0x2a1a3a,
    emissiveIntensity: 0.2,
  });

  // Glowing spinnerets (canonical)
  const spinneretMaterial = new THREE.MeshStandardMaterial({
    color: 0xaaccff,
    roughness: 0.2,
    metalness: 0.1,
    emissive: 0x6688cc,
    emissiveIntensity: 1.0,
  });

  // Eyes
  const eyeMaterial = new THREE.MeshStandardMaterial({
    color: 0xccaaff,
    roughness: 0.1,
    metalness: 0.2,
    emissive: 0x8866aa,
    emissiveIntensity: 0.6,
  });

  // Leg material
  const legMaterial = new THREE.MeshStandardMaterial({
    color: 0x1a1a2a,
    roughness: 0.4,
    metalness: 0.1,
  });

  // Fang material
  const fangMaterial = new THREE.MeshStandardMaterial({
    color: 0x111122,
    roughness: 0.2,
    metalness: 0.4,
  });

  // === ABDOMEN (large, patterned) ===
  const abdomen = new THREE.Mesh(
    new THREE.SphereGeometry(0.18 * s, 10, 8),
    carapaceMaterial
  );
  abdomen.position.set(0, 0.14 * s, -0.15 * s);
  abdomen.scale.set(1, 0.85, 1.3);
  group.add(abdomen);

  // === INTRICATE PATTERNS ON BACK (canonical) ===
  // Central pattern
  const centralPatternGeo = new THREE.BoxGeometry(0.06 * s, 0.02 * s, 0.12 * s);
  const centralPattern = new THREE.Mesh(centralPatternGeo, patternMaterial);
  centralPattern.position.set(0, 0.22 * s, -0.15 * s);
  group.add(centralPattern);

  // Side pattern stripes
  const stripeGeo = new THREE.BoxGeometry(0.03 * s, 0.015 * s, 0.08 * s);
  const stripePositions = [
    { x: -0.08, z: -0.12 },
    { x: 0.08, z: -0.12 },
    { x: -0.1, z: -0.18 },
    { x: 0.1, z: -0.18 },
  ];

  stripePositions.forEach((pos) => {
    const stripe = new THREE.Mesh(stripeGeo, patternMaterial);
    stripe.position.set(pos.x * s, 0.2 * s, pos.z * s);
    stripe.rotation.y = pos.x > 0 ? -0.3 : 0.3;
    group.add(stripe);
  });

  // Diamond patterns
  const diamondGeo = new THREE.BoxGeometry(0.04 * s, 0.015 * s, 0.04 * s);
  const diamondPositions = [
    { x: 0, z: -0.08 },
    { x: -0.06, z: -0.15 },
    { x: 0.06, z: -0.15 },
    { x: 0, z: -0.22 },
  ];

  diamondPositions.forEach((pos) => {
    const diamond = new THREE.Mesh(diamondGeo, patternMaterial);
    diamond.position.set(pos.x * s, 0.21 * s, pos.z * s);
    diamond.rotation.y = 0.785; // 45 degrees
    group.add(diamond);
  });

  // === GLOWING SPINNERETS (canonical) ===
  const spinneretGeo = new THREE.CylinderGeometry(0.02 * s, 0.015 * s, 0.05 * s, 6);

  const spinneret1 = new THREE.Mesh(spinneretGeo, spinneretMaterial);
  spinneret1.position.set(-0.03 * s, 0.1 * s, -0.32 * s);
  spinneret1.rotation.x = -0.4;
  group.add(spinneret1);

  const spinneret2 = new THREE.Mesh(spinneretGeo, spinneretMaterial);
  spinneret2.position.set(0.03 * s, 0.1 * s, -0.32 * s);
  spinneret2.rotation.x = -0.4;
  group.add(spinneret2);

  const spinneret3 = new THREE.Mesh(spinneretGeo, spinneretMaterial);
  spinneret3.position.set(0, 0.08 * s, -0.34 * s);
  spinneret3.rotation.x = -0.5;
  group.add(spinneret3);

  // Spinneret glow halo
  const glowGeo = new THREE.SphereGeometry(0.04 * s, 6, 4);
  const glowMaterial = new THREE.MeshStandardMaterial({
    color: 0xaaccff,
    roughness: 0.1,
    metalness: 0.0,
    emissive: 0x6688cc,
    emissiveIntensity: 0.5,
    transparent: true,
    opacity: 0.4,
  });

  const glow = new THREE.Mesh(glowGeo, glowMaterial);
  glow.position.set(0, 0.1 * s, -0.33 * s);
  group.add(glow);

  // === CEPHALOTHORAX (front body) ===
  const cephalothorax = new THREE.Mesh(
    new THREE.SphereGeometry(0.1 * s, 8, 6),
    carapaceMaterial
  );
  cephalothorax.position.set(0, 0.12 * s, 0.1 * s);
  cephalothorax.scale.set(1, 0.7, 1);
  group.add(cephalothorax);

  // === EIGHT EYES ===
  const eyeGeo = new THREE.SphereGeometry(0.018 * s, 6, 4);
  const smallEyeGeo = new THREE.SphereGeometry(0.012 * s, 6, 4);

  const eyePositions = [
    { x: -0.04, y: 0.15, z: 0.17, size: 'large' },
    { x: -0.015, y: 0.16, z: 0.18, size: 'large' },
    { x: 0.015, y: 0.16, z: 0.18, size: 'large' },
    { x: 0.04, y: 0.15, z: 0.17, size: 'large' },
    { x: -0.045, y: 0.17, z: 0.12, size: 'small' },
    { x: -0.02, y: 0.18, z: 0.13, size: 'small' },
    { x: 0.02, y: 0.18, z: 0.13, size: 'small' },
    { x: 0.045, y: 0.17, z: 0.12, size: 'small' },
  ];

  eyePositions.forEach((pos) => {
    const geo = pos.size === 'large' ? eyeGeo : smallEyeGeo;
    const eye = new THREE.Mesh(geo, eyeMaterial);
    eye.position.set(pos.x * s, pos.y * s, pos.z * s);
    group.add(eye);
  });

  // === FANGS ===
  const fangGeo = new THREE.BoxGeometry(0.02 * s, 0.04 * s, 0.018 * s);

  const leftFang = new THREE.Mesh(fangGeo, fangMaterial);
  leftFang.position.set(-0.025 * s, 0.06 * s, 0.18 * s);
  leftFang.rotation.x = 0.4;
  group.add(leftFang);

  const rightFang = new THREE.Mesh(fangGeo, fangMaterial);
  rightFang.position.set(0.025 * s, 0.06 * s, 0.18 * s);
  rightFang.rotation.x = 0.4;
  group.add(rightFang);

  // === EIGHT LEGS (longer than spiderling) ===
  const legSegmentGeo = new THREE.BoxGeometry(0.02 * s, 0.12 * s, 0.02 * s);
  const legTipGeo = new THREE.BoxGeometry(0.015 * s, 0.1 * s, 0.015 * s);

  const legConfigs = [
    { x: 0.08, z: 0.12, angle: 0.7, spread: 0.9 },
    { x: 0.1, z: 0.04, angle: 0.3, spread: 1.1 },
    { x: 0.1, z: -0.04, angle: -0.2, spread: 1.1 },
    { x: 0.08, z: -0.12, angle: -0.6, spread: 1.0 },
  ];

  legConfigs.forEach((config) => {
    // Right leg
    const rightUpper = new THREE.Mesh(legSegmentGeo, legMaterial);
    rightUpper.position.set(config.x * s, 0.14 * s, config.z * s);
    rightUpper.rotation.z = -0.7;
    rightUpper.rotation.y = config.angle;
    group.add(rightUpper);

    const rightLower = new THREE.Mesh(legTipGeo, legMaterial);
    rightLower.position.set((config.x + 0.1) * config.spread * s, 0.04 * s, config.z * s);
    rightLower.rotation.z = 0.5;
    rightLower.rotation.y = config.angle;
    group.add(rightLower);

    // Left leg
    const leftUpper = new THREE.Mesh(legSegmentGeo, legMaterial);
    leftUpper.position.set(-config.x * s, 0.14 * s, config.z * s);
    leftUpper.rotation.z = 0.7;
    leftUpper.rotation.y = -config.angle;
    group.add(leftUpper);

    const leftLower = new THREE.Mesh(legTipGeo, legMaterial);
    leftLower.position.set((-config.x - 0.1) * config.spread * s, 0.04 * s, config.z * s);
    leftLower.rotation.z = -0.5;
    leftLower.rotation.y = -config.angle;
    group.add(leftLower);
  });

  // === PEDIPALPS ===
  const palpGeo = new THREE.BoxGeometry(0.015 * s, 0.035 * s, 0.015 * s);

  const leftPalp = new THREE.Mesh(palpGeo, legMaterial);
  leftPalp.position.set(-0.04 * s, 0.1 * s, 0.16 * s);
  leftPalp.rotation.z = 0.4;
  group.add(leftPalp);

  const rightPalp = new THREE.Mesh(palpGeo, legMaterial);
  rightPalp.position.set(0.04 * s, 0.1 * s, 0.16 * s);
  rightPalp.rotation.z = -0.4;
  group.add(rightPalp);

  // === WEB SILK STRANDS (showing it weaves webs) ===
  const silkMaterial = new THREE.MeshStandardMaterial({
    color: 0xcccccc,
    roughness: 0.2,
    metalness: 0.0,
    transparent: true,
    opacity: 0.6,
  });

  const silkGeo = new THREE.BoxGeometry(0.005 * s, 0.005 * s, 0.15 * s);

  const silk1 = new THREE.Mesh(silkGeo, silkMaterial);
  silk1.position.set(0, 0.06 * s, -0.4 * s);
  group.add(silk1);

  const silk2 = new THREE.Mesh(silkGeo, silkMaterial);
  silk2.position.set(-0.03 * s, 0.08 * s, -0.38 * s);
  silk2.rotation.y = 0.2;
  group.add(silk2);

  return group;
}

export const WEBWEAVER_META = {
  id: 'webweaver',
  name: 'Webweaver',
  category: 'enemy' as const,
  description: 'Large spider with intricate patterns on its back. Spinnerets glow faintly - canonical design',
  defaultScale: 1.0,
  boundingBox: { x: 0.5, y: 0.25, z: 0.6 },
  tags: ['spider', 'arachnid', 'enemy', 'creature', 'web', 'poison', 'canonical'],
  enemyName: 'Webweaver',
};
