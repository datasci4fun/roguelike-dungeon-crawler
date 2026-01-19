/**
 * Shade Enemy Model
 * Canonical design based on bestiary appearance.
 *
 * Canonical appearance from bestiary:
 * "Wispy humanoid shadow with hollow eyes. Chains still dangle from translucent wrists."
 */

import * as THREE from 'three';

export interface ShadeOptions {
  scale?: number;
}

export function createShade(options: ShadeOptions = {}): THREE.Group {
  const { scale = 1.0 } = options;

  const group = new THREE.Group();
  const s = scale * 1.0;

  // === MATERIALS ===
  // Shadow body (canonical - wispy humanoid shadow)
  const shadowMaterial = new THREE.MeshStandardMaterial({
    color: 0x111122,
    roughness: 0.8,
    metalness: 0.0,
    emissive: 0x050510,
    emissiveIntensity: 0.3,
    transparent: true,
    opacity: 0.5,
  });

  // Darker shadow core
  const darkShadowMaterial = new THREE.MeshStandardMaterial({
    color: 0x0a0a15,
    roughness: 0.9,
    metalness: 0.0,
    transparent: true,
    opacity: 0.6,
  });

  // Wispy edges
  const wispMaterial = new THREE.MeshStandardMaterial({
    color: 0x1a1a2a,
    roughness: 0.7,
    metalness: 0.0,
    emissive: 0x0a0a15,
    emissiveIntensity: 0.2,
    transparent: true,
    opacity: 0.35,
  });

  // Hollow eyes (canonical - with faint glow)
  const eyeMaterial = new THREE.MeshStandardMaterial({
    color: 0x333355,
    roughness: 0.1,
    metalness: 0.0,
    emissive: 0x222244,
    emissiveIntensity: 0.8,
  });

  // Chain material (canonical - chains dangle from wrists)
  const chainMaterial = new THREE.MeshStandardMaterial({
    color: 0x444455,
    roughness: 0.4,
    metalness: 0.6,
    transparent: true,
    opacity: 0.7,
  });

  // === HEAD (wispy) ===
  const head = new THREE.Mesh(
    new THREE.SphereGeometry(0.1 * s, 8, 6),
    shadowMaterial
  );
  head.position.y = 0.72 * s;
  head.scale.set(1, 1.1, 0.9);
  group.add(head);

  // Hollow eye sockets (canonical - hollow eyes)
  const eyeSocketGeo = new THREE.SphereGeometry(0.025 * s, 6, 4);

  const leftEyeSocket = new THREE.Mesh(eyeSocketGeo, darkShadowMaterial);
  leftEyeSocket.position.set(-0.035 * s, 0.74 * s, 0.07 * s);
  group.add(leftEyeSocket);

  const rightEyeSocket = new THREE.Mesh(eyeSocketGeo, darkShadowMaterial);
  rightEyeSocket.position.set(0.035 * s, 0.74 * s, 0.07 * s);
  group.add(rightEyeSocket);

  // Faint eye glow inside sockets
  const eyeGlowGeo = new THREE.SphereGeometry(0.012 * s, 4, 4);

  const leftEyeGlow = new THREE.Mesh(eyeGlowGeo, eyeMaterial);
  leftEyeGlow.position.set(-0.035 * s, 0.74 * s, 0.065 * s);
  group.add(leftEyeGlow);

  const rightEyeGlow = new THREE.Mesh(eyeGlowGeo, eyeMaterial);
  rightEyeGlow.position.set(0.035 * s, 0.74 * s, 0.065 * s);
  group.add(rightEyeGlow);

  // Wispy head tendrils
  const headWispGeo = new THREE.BoxGeometry(0.02 * s, 0.08 * s, 0.015 * s);
  const headWisps = [
    { x: -0.06, y: 0.78, z: 0 },
    { x: 0.05, y: 0.8, z: -0.02 },
    { x: 0, y: 0.82, z: -0.04 },
    { x: -0.04, y: 0.76, z: -0.06 },
  ];

  headWisps.forEach((w) => {
    const wisp = new THREE.Mesh(headWispGeo, wispMaterial);
    wisp.position.set(w.x * s, w.y * s, w.z * s);
    wisp.rotation.z = Math.random() * 0.4 - 0.2;
    group.add(wisp);
  });

  // === TORSO (wispy, less defined) ===
  const torsoCore = new THREE.Mesh(
    new THREE.BoxGeometry(0.14 * s, 0.22 * s, 0.08 * s),
    darkShadowMaterial
  );
  torsoCore.position.y = 0.52 * s;
  group.add(torsoCore);

  const torsoOuter = new THREE.Mesh(
    new THREE.BoxGeometry(0.18 * s, 0.26 * s, 0.1 * s),
    shadowMaterial
  );
  torsoOuter.position.y = 0.52 * s;
  group.add(torsoOuter);

  // Wispy tendrils from torso
  const torsoWispGeo = new THREE.BoxGeometry(0.03 * s, 0.1 * s, 0.02 * s);
  const torsoWisps = [
    { x: -0.1, y: 0.5, z: 0.06, rz: 0.3 },
    { x: 0.08, y: 0.48, z: 0.05, rz: -0.25 },
    { x: -0.06, y: 0.44, z: -0.06, rz: 0.2 },
    { x: 0.1, y: 0.55, z: -0.04, rz: -0.35 },
  ];

  torsoWisps.forEach((w) => {
    const wisp = new THREE.Mesh(torsoWispGeo, wispMaterial);
    wisp.position.set(w.x * s, w.y * s, w.z * s);
    wisp.rotation.z = w.rz;
    group.add(wisp);
  });

  // === ARMS (wispy with chains at wrists) ===
  const armGeo = new THREE.BoxGeometry(0.05 * s, 0.18 * s, 0.04 * s);

  const leftArm = new THREE.Mesh(armGeo, shadowMaterial);
  leftArm.position.set(-0.14 * s, 0.48 * s, 0);
  leftArm.rotation.z = 0.15;
  group.add(leftArm);

  const rightArm = new THREE.Mesh(armGeo, shadowMaterial);
  rightArm.position.set(0.14 * s, 0.48 * s, 0);
  rightArm.rotation.z = -0.15;
  group.add(rightArm);

  // Wispy hands
  const handGeo = new THREE.BoxGeometry(0.04 * s, 0.06 * s, 0.03 * s);

  const leftHand = new THREE.Mesh(handGeo, wispMaterial);
  leftHand.position.set(-0.17 * s, 0.36 * s, 0.02 * s);
  group.add(leftHand);

  const rightHand = new THREE.Mesh(handGeo, wispMaterial);
  rightHand.position.set(0.17 * s, 0.36 * s, 0.02 * s);
  group.add(rightHand);

  // === CHAINS AT WRISTS (canonical) ===
  const chainLinkGeo = new THREE.TorusGeometry(0.015 * s, 0.004 * s, 4, 6);

  // Left wrist chains
  for (let i = 0; i < 5; i++) {
    const link = new THREE.Mesh(chainLinkGeo, chainMaterial);
    link.position.set(-0.18 * s, (0.32 - i * 0.04) * s, 0.02 * s);
    link.rotation.x = i % 2 === 0 ? 0 : Math.PI / 2;
    link.rotation.z = Math.random() * 0.3;
    group.add(link);
  }

  // Right wrist chains
  for (let i = 0; i < 5; i++) {
    const link = new THREE.Mesh(chainLinkGeo, chainMaterial);
    link.position.set(0.18 * s, (0.32 - i * 0.04) * s, 0.02 * s);
    link.rotation.x = i % 2 === 0 ? 0 : Math.PI / 2;
    link.rotation.z = Math.random() * 0.3;
    group.add(link);
  }

  // Chain shackle at wrists
  const shackleGeo = new THREE.TorusGeometry(0.025 * s, 0.006 * s, 6, 8);

  const leftShackle = new THREE.Mesh(shackleGeo, chainMaterial);
  leftShackle.position.set(-0.17 * s, 0.34 * s, 0.02 * s);
  leftShackle.rotation.x = Math.PI / 2;
  group.add(leftShackle);

  const rightShackle = new THREE.Mesh(shackleGeo, chainMaterial);
  rightShackle.position.set(0.17 * s, 0.34 * s, 0.02 * s);
  rightShackle.rotation.x = Math.PI / 2;
  group.add(rightShackle);

  // === LOWER BODY (fading into wisps) ===
  const lowerBody = new THREE.Mesh(
    new THREE.BoxGeometry(0.12 * s, 0.18 * s, 0.08 * s),
    shadowMaterial
  );
  lowerBody.position.y = 0.32 * s;
  group.add(lowerBody);

  // Fading wisps at bottom (no defined legs)
  const fadeWispGeo = new THREE.BoxGeometry(0.04 * s, 0.12 * s, 0.03 * s);
  const fadeWisps = [
    { x: -0.06, z: 0.03 },
    { x: 0.04, z: 0.04 },
    { x: -0.02, z: -0.03 },
    { x: 0.06, z: -0.02 },
    { x: 0, z: 0.05 },
  ];

  fadeWisps.forEach((w) => {
    const wisp = new THREE.Mesh(fadeWispGeo, wispMaterial);
    wisp.position.set(w.x * s, 0.18 * s, w.z * s);
    wisp.rotation.z = Math.random() * 0.4 - 0.2;
    group.add(wisp);
  });

  // Ground shadow pool
  const shadowPool = new THREE.Mesh(
    new THREE.CylinderGeometry(0.15 * s, 0.2 * s, 0.01 * s, 8),
    new THREE.MeshStandardMaterial({
      color: 0x050510,
      roughness: 0.9,
      metalness: 0.0,
      transparent: true,
      opacity: 0.4,
    })
  );
  shadowPool.position.y = 0.08 * s;
  group.add(shadowPool);

  return group;
}

export const SHADE_META = {
  id: 'shade',
  name: 'Shade',
  category: 'enemy' as const,
  description: 'Wispy humanoid shadow with hollow eyes. Chains still dangle from translucent wrists - canonical design',
  defaultScale: 1.0,
  boundingBox: { x: 0.4, y: 0.85, z: 0.3 },
  tags: ['shadow', 'ghost', 'undead', 'enemy', 'spectral', 'stealth', 'canonical'],
  enemyName: 'Shade',
};
