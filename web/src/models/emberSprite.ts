/**
 * Ember Sprite Enemy Model
 * Canonical design based on bestiary appearance.
 *
 * Canonical appearance from bestiary:
 * "Tiny humanoid of dancing flames. Leaves trails of embers and giggles constantly."
 */

import * as THREE from 'three';

export interface EmberSpriteOptions {
  scale?: number;
}

export function createEmberSprite(options: EmberSpriteOptions = {}): THREE.Group {
  const { scale = 1.0 } = options;

  const group = new THREE.Group();
  const s = scale * 0.5; // Tiny

  // === MATERIALS ===
  // Core flame (bright)
  const coreFlame = new THREE.MeshStandardMaterial({
    color: 0xffff88,
    roughness: 0.1,
    metalness: 0.0,
    emissive: 0xffcc44,
    emissiveIntensity: 2.5,
  });

  // Inner flame (orange)
  const innerFlame = new THREE.MeshStandardMaterial({
    color: 0xffaa44,
    roughness: 0.2,
    metalness: 0.0,
    emissive: 0xff8822,
    emissiveIntensity: 2.0,
    transparent: true,
    opacity: 0.9,
  });

  // Outer flame (red-orange)
  const outerFlame = new THREE.MeshStandardMaterial({
    color: 0xff6622,
    roughness: 0.3,
    metalness: 0.0,
    emissive: 0xcc4411,
    emissiveIntensity: 1.5,
    transparent: true,
    opacity: 0.8,
  });

  // Edge flame (dark red)
  const edgeFlame = new THREE.MeshStandardMaterial({
    color: 0xcc3311,
    roughness: 0.4,
    metalness: 0.0,
    emissive: 0x882200,
    emissiveIntensity: 1.0,
    transparent: true,
    opacity: 0.6,
  });

  // Eyes (bright white-yellow)
  const eyeMaterial = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    roughness: 0.0,
    metalness: 0.0,
    emissive: 0xffffaa,
    emissiveIntensity: 3.0,
  });

  // Ember material (canonical - trails of embers)
  const emberMaterial = new THREE.MeshStandardMaterial({
    color: 0xff8844,
    roughness: 0.2,
    metalness: 0.0,
    emissive: 0xcc4422,
    emissiveIntensity: 1.5,
  });

  // === HEAD (flame sphere) ===
  const headCore = new THREE.Mesh(
    new THREE.SphereGeometry(0.08 * s, 8, 6),
    coreFlame
  );
  headCore.position.y = 0.6 * s;
  group.add(headCore);

  const headInner = new THREE.Mesh(
    new THREE.SphereGeometry(0.1 * s, 8, 6),
    innerFlame
  );
  headInner.position.y = 0.6 * s;
  group.add(headInner);

  const headOuter = new THREE.Mesh(
    new THREE.SphereGeometry(0.12 * s, 8, 6),
    outerFlame
  );
  headOuter.position.y = 0.6 * s;
  group.add(headOuter);

  // Flame wisps on head
  const headWispGeo = new THREE.BoxGeometry(0.03 * s, 0.1 * s, 0.02 * s);
  const headWisps = [
    { x: -0.06, y: 0.7, z: 0 },
    { x: 0.05, y: 0.72, z: 0.02 },
    { x: 0, y: 0.74, z: -0.04 },
    { x: -0.04, y: 0.68, z: 0.04 },
  ];

  headWisps.forEach((w) => {
    const wisp = new THREE.Mesh(headWispGeo, edgeFlame);
    wisp.position.set(w.x * s, w.y * s, w.z * s);
    wisp.rotation.z = Math.random() * 0.4 - 0.2;
    group.add(wisp);
  });

  // Bright eyes
  const eyeGeo = new THREE.SphereGeometry(0.02 * s, 6, 4);

  const leftEye = new THREE.Mesh(eyeGeo, eyeMaterial);
  leftEye.position.set(-0.04 * s, 0.62 * s, 0.08 * s);
  group.add(leftEye);

  const rightEye = new THREE.Mesh(eyeGeo, eyeMaterial);
  rightEye.position.set(0.04 * s, 0.62 * s, 0.08 * s);
  group.add(rightEye);

  // === BODY (small flame humanoid) ===
  // Core
  const bodyCore = new THREE.Mesh(
    new THREE.BoxGeometry(0.08 * s, 0.14 * s, 0.06 * s),
    coreFlame
  );
  bodyCore.position.y = 0.42 * s;
  group.add(bodyCore);

  // Inner flame
  const bodyInner = new THREE.Mesh(
    new THREE.BoxGeometry(0.12 * s, 0.18 * s, 0.08 * s),
    innerFlame
  );
  bodyInner.position.y = 0.42 * s;
  group.add(bodyInner);

  // Outer flame
  const bodyOuter = new THREE.Mesh(
    new THREE.BoxGeometry(0.14 * s, 0.2 * s, 0.1 * s),
    outerFlame
  );
  bodyOuter.position.y = 0.42 * s;
  group.add(bodyOuter);

  // === ARMS (tiny flame limbs) ===
  const armGeo = new THREE.BoxGeometry(0.04 * s, 0.12 * s, 0.03 * s);

  const leftArm = new THREE.Mesh(armGeo, innerFlame);
  leftArm.position.set(-0.1 * s, 0.44 * s, 0);
  leftArm.rotation.z = 0.4;
  group.add(leftArm);

  const rightArm = new THREE.Mesh(armGeo, innerFlame);
  rightArm.position.set(0.1 * s, 0.44 * s, 0);
  rightArm.rotation.z = -0.4;
  group.add(rightArm);

  // Flame hands
  const handGeo = new THREE.SphereGeometry(0.03 * s, 6, 4);

  const leftHand = new THREE.Mesh(handGeo, coreFlame);
  leftHand.position.set(-0.14 * s, 0.36 * s, 0.02 * s);
  group.add(leftHand);

  const rightHand = new THREE.Mesh(handGeo, coreFlame);
  rightHand.position.set(0.14 * s, 0.36 * s, 0.02 * s);
  group.add(rightHand);

  // === LOWER BODY (flames tapering down) ===
  const lowerCore = new THREE.Mesh(
    new THREE.BoxGeometry(0.1 * s, 0.12 * s, 0.08 * s),
    innerFlame
  );
  lowerCore.position.y = 0.28 * s;
  group.add(lowerCore);

  const lowerOuter = new THREE.Mesh(
    new THREE.BoxGeometry(0.12 * s, 0.14 * s, 0.1 * s),
    outerFlame
  );
  lowerOuter.position.y = 0.28 * s;
  group.add(lowerOuter);

  // Flame trail below (dancing flames)
  const trailGeo = new THREE.BoxGeometry(0.04 * s, 0.08 * s, 0.03 * s);
  const trails = [
    { x: -0.04, y: 0.16, z: 0.02 },
    { x: 0.03, y: 0.14, z: 0.03 },
    { x: -0.02, y: 0.12, z: -0.02 },
    { x: 0.05, y: 0.18, z: -0.01 },
  ];

  trails.forEach((t) => {
    const trail = new THREE.Mesh(trailGeo, edgeFlame);
    trail.position.set(t.x * s, t.y * s, t.z * s);
    trail.rotation.z = Math.random() * 0.5 - 0.25;
    group.add(trail);
  });

  // === EMBER TRAIL (canonical - leaves trails of embers) ===
  const emberGeo = new THREE.SphereGeometry(0.015 * s, 4, 4);
  const emberPositions = [
    { x: -0.08, y: 0.08, z: 0.06 },
    { x: 0.1, y: 0.06, z: 0.04 },
    { x: -0.06, y: 0.04, z: -0.05 },
    { x: 0.04, y: 0.02, z: 0.08 },
    { x: -0.12, y: 0.1, z: -0.02 },
    { x: 0.08, y: 0.12, z: -0.06 },
    // Trailing behind
    { x: -0.02, y: 0.06, z: -0.12 },
    { x: 0.04, y: 0.04, z: -0.16 },
    { x: -0.06, y: 0.02, z: -0.2 },
  ];

  emberPositions.forEach((e) => {
    const ember = new THREE.Mesh(emberGeo, emberMaterial);
    ember.position.set(e.x * s, e.y * s, e.z * s);
    const emberScale = 0.5 + Math.random() * 0.6;
    ember.scale.setScalar(emberScale);
    group.add(ember);
  });

  // === HEAT DISTORTION RING ===
  const heatRing = new THREE.Mesh(
    new THREE.TorusGeometry(0.12 * s, 0.01 * s, 4, 12),
    new THREE.MeshStandardMaterial({
      color: 0xff8844,
      emissive: 0xcc4422,
      emissiveIntensity: 0.8,
      transparent: true,
      opacity: 0.3,
    })
  );
  heatRing.position.y = 0.4 * s;
  heatRing.rotation.x = Math.PI / 2;
  group.add(heatRing);

  return group;
}

export const EMBER_SPRITE_META = {
  id: 'ember-sprite',
  name: 'Ember Sprite',
  category: 'enemy' as const,
  description: 'Tiny humanoid of dancing flames. Leaves trails of embers and giggles constantly - canonical design',
  defaultScale: 1.0,
  boundingBox: { x: 0.3, y: 0.5, z: 0.3 },
  tags: ['fire', 'sprite', 'elemental', 'enemy', 'flame', 'tiny', 'canonical'],
  enemyName: 'Ember Sprite',
};
