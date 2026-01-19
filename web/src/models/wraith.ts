/**
 * Wraith Enemy Model
 * A translucent ghostly figure in tattered robes with a face twisted in eternal anguish.
 *
 * Canonical appearance from bestiary:
 * "Translucent ghostly figure in tattered robes. Face twisted in eternal anguish."
 */

import * as THREE from 'three';

export interface WraithOptions {
  scale?: number;
}

export function createWraith(options: WraithOptions = {}): THREE.Group {
  const { scale = 1.0 } = options;

  const group = new THREE.Group();
  const s = scale;

  // === MATERIALS ===
  // Ghostly translucent material for the ethereal body
  const ghostMaterial = new THREE.MeshStandardMaterial({
    color: 0x4a6a7a,
    roughness: 0.3,
    metalness: 0.1,
    transparent: true,
    opacity: 0.6,
    emissive: 0x1a2a3a,
    emissiveIntensity: 0.3,
  });

  // Darker material for the tattered robe
  const robeMaterial = new THREE.MeshStandardMaterial({
    color: 0x1a1a2a,
    roughness: 0.9,
    metalness: 0.0,
    transparent: true,
    opacity: 0.7,
    emissive: 0x0a0a1a,
    emissiveIntensity: 0.2,
  });

  // Glowing eyes - anguished and spectral
  const eyeMaterial = new THREE.MeshStandardMaterial({
    color: 0x88ddff,
    roughness: 0.1,
    metalness: 0.0,
    emissive: 0x44aaff,
    emissiveIntensity: 1.5,
  });

  // Inner glow for the core
  const coreMaterial = new THREE.MeshStandardMaterial({
    color: 0x6688aa,
    roughness: 0.2,
    metalness: 0.0,
    transparent: true,
    opacity: 0.4,
    emissive: 0x3366aa,
    emissiveIntensity: 0.5,
  });

  // === HEAD / FACE ===
  // Distorted skull-like head
  const head = new THREE.Mesh(
    new THREE.SphereGeometry(0.1 * s, 8, 6),
    ghostMaterial
  );
  head.position.y = 0.7 * s;
  head.scale.set(1, 1.2, 0.9); // Elongated, anguished shape
  group.add(head);

  // Sunken cheeks - creating hollow appearance
  const leftCheek = new THREE.Mesh(
    new THREE.SphereGeometry(0.03 * s, 6, 4),
    new THREE.MeshStandardMaterial({
      color: 0x2a3a4a,
      roughness: 0.5,
      transparent: true,
      opacity: 0.8,
    })
  );
  leftCheek.position.set(-0.05 * s, 0.68 * s, 0.06 * s);
  leftCheek.scale.set(1, 1.5, 0.5);
  group.add(leftCheek);

  const rightCheek = leftCheek.clone();
  rightCheek.position.set(0.05 * s, 0.68 * s, 0.06 * s);
  group.add(rightCheek);

  // Anguished eyes - glowing intensely
  const eyeGeo = new THREE.SphereGeometry(0.025 * s, 6, 4);

  const leftEye = new THREE.Mesh(eyeGeo, eyeMaterial);
  leftEye.position.set(-0.035 * s, 0.72 * s, 0.07 * s);
  group.add(leftEye);

  const rightEye = new THREE.Mesh(eyeGeo, eyeMaterial);
  rightEye.position.set(0.035 * s, 0.72 * s, 0.07 * s);
  group.add(rightEye);

  // Open mouth - eternal scream
  const mouth = new THREE.Mesh(
    new THREE.BoxGeometry(0.04 * s, 0.03 * s, 0.02 * s),
    new THREE.MeshStandardMaterial({
      color: 0x0a0a1a,
      roughness: 0.9,
    })
  );
  mouth.position.set(0, 0.63 * s, 0.08 * s);
  group.add(mouth);

  // === TORSO / CORE ===
  // Ethereal upper body - fading into robes
  const torso = new THREE.Mesh(
    new THREE.CylinderGeometry(0.08 * s, 0.12 * s, 0.2 * s, 8),
    ghostMaterial
  );
  torso.position.y = 0.52 * s;
  group.add(torso);

  // Inner spectral core
  const core = new THREE.Mesh(
    new THREE.SphereGeometry(0.06 * s, 8, 6),
    coreMaterial
  );
  core.position.y = 0.5 * s;
  group.add(core);

  // === TATTERED ROBES ===
  // Main robe body - flowing downward
  const robeMain = new THREE.Mesh(
    new THREE.CylinderGeometry(0.05 * s, 0.2 * s, 0.45 * s, 8),
    robeMaterial
  );
  robeMain.position.y = 0.22 * s;
  group.add(robeMain);

  // Tattered robe strips - hanging irregularly
  const stripGeo = new THREE.BoxGeometry(0.03 * s, 0.15 * s, 0.01 * s);
  const strips = [
    { x: -0.12, z: 0.08, ry: 0.2 },
    { x: 0.14, z: 0.05, ry: -0.3 },
    { x: -0.08, z: -0.1, ry: 0.1 },
    { x: 0.1, z: -0.08, ry: -0.15 },
    { x: 0, z: 0.15, ry: 0 },
    { x: -0.15, z: 0, ry: 0.4 },
  ];

  strips.forEach((pos) => {
    const strip = new THREE.Mesh(stripGeo, robeMaterial);
    strip.position.set(pos.x * s, 0.05 * s, pos.z * s);
    strip.rotation.y = pos.ry;
    strip.rotation.x = 0.1 + Math.random() * 0.2;
    group.add(strip);
  });

  // === ARMS ===
  // Spectral arms reaching out
  const armMaterial = ghostMaterial.clone();
  armMaterial.opacity = 0.5;

  // Left arm - reaching forward
  const leftUpperArm = new THREE.Mesh(
    new THREE.CylinderGeometry(0.025 * s, 0.02 * s, 0.15 * s, 6),
    armMaterial
  );
  leftUpperArm.position.set(-0.12 * s, 0.5 * s, 0.05 * s);
  leftUpperArm.rotation.z = 0.8;
  leftUpperArm.rotation.x = -0.3;
  group.add(leftUpperArm);

  const leftLowerArm = new THREE.Mesh(
    new THREE.CylinderGeometry(0.02 * s, 0.015 * s, 0.12 * s, 6),
    armMaterial
  );
  leftLowerArm.position.set(-0.2 * s, 0.45 * s, 0.12 * s);
  leftLowerArm.rotation.z = 0.6;
  leftLowerArm.rotation.x = -0.5;
  group.add(leftLowerArm);

  // Left spectral hand
  const handMaterial = ghostMaterial.clone();
  handMaterial.emissiveIntensity = 0.5;

  const leftHand = new THREE.Mesh(
    new THREE.BoxGeometry(0.04 * s, 0.025 * s, 0.02 * s),
    handMaterial
  );
  leftHand.position.set(-0.26 * s, 0.4 * s, 0.18 * s);
  leftHand.rotation.z = 0.4;
  group.add(leftHand);

  // Left fingers - clawing gesture
  const fingerGeo = new THREE.BoxGeometry(0.008 * s, 0.03 * s, 0.008 * s);
  for (let i = 0; i < 4; i++) {
    const finger = new THREE.Mesh(fingerGeo, handMaterial);
    finger.position.set(
      (-0.28 - i * 0.012) * s,
      0.38 * s,
      (0.2 + i * 0.01) * s
    );
    finger.rotation.x = -0.3;
    group.add(finger);
  }

  // Right arm - raised menacingly
  const rightUpperArm = new THREE.Mesh(
    new THREE.CylinderGeometry(0.025 * s, 0.02 * s, 0.15 * s, 6),
    armMaterial
  );
  rightUpperArm.position.set(0.12 * s, 0.52 * s, 0.02 * s);
  rightUpperArm.rotation.z = -0.6;
  rightUpperArm.rotation.x = -0.2;
  group.add(rightUpperArm);

  const rightLowerArm = new THREE.Mesh(
    new THREE.CylinderGeometry(0.02 * s, 0.015 * s, 0.12 * s, 6),
    armMaterial
  );
  rightLowerArm.position.set(0.18 * s, 0.48 * s, 0.08 * s);
  rightLowerArm.rotation.z = -0.5;
  rightLowerArm.rotation.x = -0.4;
  group.add(rightLowerArm);

  // Right spectral hand
  const rightHand = new THREE.Mesh(
    new THREE.BoxGeometry(0.04 * s, 0.025 * s, 0.02 * s),
    handMaterial
  );
  rightHand.position.set(0.24 * s, 0.42 * s, 0.14 * s);
  rightHand.rotation.z = -0.3;
  group.add(rightHand);

  // Right fingers
  for (let i = 0; i < 4; i++) {
    const finger = new THREE.Mesh(fingerGeo, handMaterial);
    finger.position.set(
      (0.26 + i * 0.012) * s,
      0.4 * s,
      (0.16 + i * 0.01) * s
    );
    finger.rotation.x = -0.3;
    group.add(finger);
  }

  // === WISPY TRAILS ===
  // Ethereal trails fading below
  const trailMaterial = new THREE.MeshStandardMaterial({
    color: 0x3a5a6a,
    roughness: 0.3,
    transparent: true,
    opacity: 0.3,
    emissive: 0x1a3a4a,
    emissiveIntensity: 0.2,
  });

  const trailGeo = new THREE.ConeGeometry(0.08 * s, 0.2 * s, 6);
  const trail = new THREE.Mesh(trailGeo, trailMaterial);
  trail.position.y = -0.05 * s;
  trail.rotation.x = Math.PI; // Point downward
  group.add(trail);

  // Additional wispy elements
  const wispGeo = new THREE.BoxGeometry(0.02 * s, 0.1 * s, 0.02 * s);
  const wisps = [
    { x: -0.06, y: 0, z: 0.04 },
    { x: 0.08, y: 0.02, z: -0.03 },
    { x: 0, y: -0.02, z: -0.06 },
  ];

  wisps.forEach((pos) => {
    const wisp = new THREE.Mesh(wispGeo, trailMaterial);
    wisp.position.set(pos.x * s, pos.y * s, pos.z * s);
    wisp.rotation.x = 0.2;
    wisp.rotation.z = Math.random() * 0.4 - 0.2;
    group.add(wisp);
  });

  return group;
}

export const WRAITH_META = {
  id: 'wraith',
  name: 'Wraith',
  category: 'enemy' as const,
  description: 'A translucent ghostly figure in tattered robes with a face twisted in eternal anguish',
  defaultScale: 1.0,
  boundingBox: { x: 0.6, y: 0.8, z: 0.4 },
  tags: ['wraith', 'ghost', 'undead', 'enemy', 'creature', 'spectral', 'ethereal'],
  enemyName: 'Wraith',
};
