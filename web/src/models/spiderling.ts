/**
 * Spiderling Enemy Model
 * Canonical design based on bestiary appearance.
 *
 * Canonical appearance from bestiary:
 * "Cat-sized spider with dark green carapace and eight gleaming eyes."
 */

import * as THREE from 'three';

export interface SpiderlingOptions {
  scale?: number;
}

export function createSpiderling(options: SpiderlingOptions = {}): THREE.Group {
  const { scale = 1.0 } = options;

  const group = new THREE.Group();
  const s = scale * 0.5; // Cat-sized (small)

  // === MATERIALS ===
  // Dark green carapace (canonical)
  const carapaceMaterial = new THREE.MeshStandardMaterial({
    color: 0x2a4a2a, // Dark green
    roughness: 0.3,
    metalness: 0.2,
  });

  // Lighter underbelly
  const underbellyMaterial = new THREE.MeshStandardMaterial({
    color: 0x3a5a3a,
    roughness: 0.5,
    metalness: 0.1,
  });

  // Gleaming eyes (canonical)
  const eyeMaterial = new THREE.MeshStandardMaterial({
    color: 0x88ff88,
    roughness: 0.1,
    metalness: 0.3,
    emissive: 0x44aa44,
    emissiveIntensity: 0.8,
  });

  // Leg material
  const legMaterial = new THREE.MeshStandardMaterial({
    color: 0x1a3a1a,
    roughness: 0.4,
    metalness: 0.1,
  });

  // Fang material
  const fangMaterial = new THREE.MeshStandardMaterial({
    color: 0x111111,
    roughness: 0.2,
    metalness: 0.3,
  });

  // === ABDOMEN (rear body) ===
  const abdomen = new THREE.Mesh(
    new THREE.SphereGeometry(0.12 * s, 8, 6),
    carapaceMaterial
  );
  abdomen.position.set(0, 0.1 * s, -0.1 * s);
  abdomen.scale.set(1, 0.8, 1.2);
  group.add(abdomen);

  // Abdomen markings
  const markingGeo = new THREE.BoxGeometry(0.04 * s, 0.02 * s, 0.06 * s);
  const marking1 = new THREE.Mesh(markingGeo, underbellyMaterial);
  marking1.position.set(0, 0.16 * s, -0.1 * s);
  group.add(marking1);

  // === CEPHALOTHORAX (front body) ===
  const cephalothorax = new THREE.Mesh(
    new THREE.SphereGeometry(0.08 * s, 8, 6),
    carapaceMaterial
  );
  cephalothorax.position.set(0, 0.1 * s, 0.08 * s);
  cephalothorax.scale.set(1, 0.7, 1);
  group.add(cephalothorax);

  // === EIGHT GLEAMING EYES (canonical) ===
  const eyeGeo = new THREE.SphereGeometry(0.015 * s, 6, 4);
  const smallEyeGeo = new THREE.SphereGeometry(0.01 * s, 6, 4);

  // Front row (4 eyes)
  const eyePositions = [
    { x: -0.035, y: 0.13, z: 0.14, size: 'large' },
    { x: -0.015, y: 0.14, z: 0.15, size: 'large' },
    { x: 0.015, y: 0.14, z: 0.15, size: 'large' },
    { x: 0.035, y: 0.13, z: 0.14, size: 'large' },
    // Back row (4 smaller eyes)
    { x: -0.04, y: 0.15, z: 0.1, size: 'small' },
    { x: -0.02, y: 0.16, z: 0.11, size: 'small' },
    { x: 0.02, y: 0.16, z: 0.11, size: 'small' },
    { x: 0.04, y: 0.15, z: 0.1, size: 'small' },
  ];

  eyePositions.forEach((pos) => {
    const geo = pos.size === 'large' ? eyeGeo : smallEyeGeo;
    const eye = new THREE.Mesh(geo, eyeMaterial);
    eye.position.set(pos.x * s, pos.y * s, pos.z * s);
    group.add(eye);
  });

  // === FANGS (chelicerae) ===
  const fangGeo = new THREE.BoxGeometry(0.015 * s, 0.03 * s, 0.015 * s);

  const leftFang = new THREE.Mesh(fangGeo, fangMaterial);
  leftFang.position.set(-0.02 * s, 0.06 * s, 0.15 * s);
  leftFang.rotation.x = 0.3;
  group.add(leftFang);

  const rightFang = new THREE.Mesh(fangGeo, fangMaterial);
  rightFang.position.set(0.02 * s, 0.06 * s, 0.15 * s);
  rightFang.rotation.x = 0.3;
  group.add(rightFang);

  // === EIGHT LEGS ===
  const legSegmentGeo = new THREE.BoxGeometry(0.015 * s, 0.08 * s, 0.015 * s);
  const legTipGeo = new THREE.BoxGeometry(0.012 * s, 0.06 * s, 0.012 * s);

  // Leg positions (4 per side, front to back)
  const legConfigs = [
    { x: 0.06, z: 0.1, angle: 0.6, spread: 0.8 },
    { x: 0.07, z: 0.04, angle: 0.3, spread: 1.0 },
    { x: 0.07, z: -0.02, angle: -0.2, spread: 1.0 },
    { x: 0.06, z: -0.08, angle: -0.5, spread: 0.9 },
  ];

  legConfigs.forEach((config) => {
    // Right leg
    const rightUpper = new THREE.Mesh(legSegmentGeo, legMaterial);
    rightUpper.position.set(config.x * s, 0.12 * s, config.z * s);
    rightUpper.rotation.z = -0.8;
    rightUpper.rotation.y = config.angle;
    group.add(rightUpper);

    const rightLower = new THREE.Mesh(legTipGeo, legMaterial);
    rightLower.position.set((config.x + 0.06) * config.spread * s, 0.04 * s, config.z * s);
    rightLower.rotation.z = 0.4;
    rightLower.rotation.y = config.angle;
    group.add(rightLower);

    // Left leg (mirrored)
    const leftUpper = new THREE.Mesh(legSegmentGeo, legMaterial);
    leftUpper.position.set(-config.x * s, 0.12 * s, config.z * s);
    leftUpper.rotation.z = 0.8;
    leftUpper.rotation.y = -config.angle;
    group.add(leftUpper);

    const leftLower = new THREE.Mesh(legTipGeo, legMaterial);
    leftLower.position.set((-config.x - 0.06) * config.spread * s, 0.04 * s, config.z * s);
    leftLower.rotation.z = -0.4;
    leftLower.rotation.y = -config.angle;
    group.add(leftLower);
  });

  // === PEDIPALPS (small front appendages) ===
  const palpGeo = new THREE.BoxGeometry(0.01 * s, 0.025 * s, 0.01 * s);

  const leftPalp = new THREE.Mesh(palpGeo, legMaterial);
  leftPalp.position.set(-0.03 * s, 0.08 * s, 0.13 * s);
  leftPalp.rotation.z = 0.4;
  group.add(leftPalp);

  const rightPalp = new THREE.Mesh(palpGeo, legMaterial);
  rightPalp.position.set(0.03 * s, 0.08 * s, 0.13 * s);
  rightPalp.rotation.z = -0.4;
  group.add(rightPalp);

  return group;
}

export const SPIDERLING_META = {
  id: 'spiderling',
  name: 'Spiderling',
  category: 'enemy' as const,
  description: 'Cat-sized spider with dark green carapace and eight gleaming eyes - canonical design',
  defaultScale: 1.0,
  boundingBox: { x: 0.3, y: 0.2, z: 0.35 },
  tags: ['spider', 'arachnid', 'enemy', 'creature', 'small', 'poison', 'canonical'],
  enemyName: 'Spiderling',
};
