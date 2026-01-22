/**
 * Rat Enemy Model
 * A small, scurrying rat with beady red eyes and a long tail
 */

import * as THREE from 'three';

export interface RatOptions {
  scale?: number;
}

export function createRat(options: RatOptions = {}): THREE.Group {
  const { scale = 1.0 } = options;

  const group = new THREE.Group();

  // Materials
  const furMaterial = new THREE.MeshStandardMaterial({
    color: 0x5c4033, // Brown fur
    roughness: 0.9,
  });
  const darkFurMaterial = new THREE.MeshStandardMaterial({
    color: 0x3d2817,
    roughness: 0.9,
  });
  const eyeMaterial = new THREE.MeshStandardMaterial({
    color: 0xff0000,
    emissive: 0x660000,
    emissiveIntensity: 0.6,
  });
  const noseMaterial = new THREE.MeshStandardMaterial({
    color: 0xffaaaa, // Pink nose
    roughness: 0.6,
  });
  const earMaterial = new THREE.MeshStandardMaterial({
    color: 0xdda0a0, // Pink inner ear
    roughness: 0.7,
  });
  const tailMaterial = new THREE.MeshStandardMaterial({
    color: 0xd4a6a6, // Pink tail
    roughness: 0.5,
  });

  const s = scale * 0.6; // Rats are small

  // === BODY (elongated) ===
  const body = new THREE.Mesh(
    new THREE.BoxGeometry(0.12 * s, 0.08 * s, 0.2 * s),
    furMaterial
  );
  body.position.set(0, 0.06 * s, 0);
  group.add(body);

  // Belly (slightly lighter, underneath)
  const belly = new THREE.Mesh(
    new THREE.BoxGeometry(0.1 * s, 0.04 * s, 0.16 * s),
    darkFurMaterial
  );
  belly.position.set(0, 0.03 * s, 0);
  group.add(belly);

  // === HEAD ===
  const head = new THREE.Mesh(
    new THREE.BoxGeometry(0.08 * s, 0.07 * s, 0.1 * s),
    furMaterial
  );
  head.position.set(0, 0.07 * s, 0.12 * s);
  group.add(head);

  // Snout (pointed)
  const snout = new THREE.Mesh(
    new THREE.BoxGeometry(0.05 * s, 0.04 * s, 0.06 * s),
    furMaterial
  );
  snout.position.set(0, 0.05 * s, 0.18 * s);
  group.add(snout);

  // Nose
  const nose = new THREE.Mesh(
    new THREE.BoxGeometry(0.025 * s, 0.02 * s, 0.02 * s),
    noseMaterial
  );
  nose.position.set(0, 0.055 * s, 0.21 * s);
  group.add(nose);

  // === EYES (beady red) ===
  const eyeGeo = new THREE.SphereGeometry(0.012 * s, 6, 4);

  const leftEye = new THREE.Mesh(eyeGeo, eyeMaterial);
  leftEye.position.set(-0.03 * s, 0.09 * s, 0.15 * s);
  group.add(leftEye);

  const rightEye = new THREE.Mesh(eyeGeo, eyeMaterial);
  rightEye.position.set(0.03 * s, 0.09 * s, 0.15 * s);
  group.add(rightEye);

  // === EARS ===
  const earGeo = new THREE.BoxGeometry(0.03 * s, 0.035 * s, 0.015 * s);

  const leftEar = new THREE.Mesh(earGeo, earMaterial);
  leftEar.position.set(-0.035 * s, 0.11 * s, 0.1 * s);
  leftEar.rotation.z = -0.3;
  group.add(leftEar);

  const rightEar = new THREE.Mesh(earGeo, earMaterial);
  rightEar.position.set(0.035 * s, 0.11 * s, 0.1 * s);
  rightEar.rotation.z = 0.3;
  group.add(rightEar);

  // === WHISKERS (thin boxes) ===
  const whiskerGeo = new THREE.BoxGeometry(0.06 * s, 0.003 * s, 0.003 * s);
  const whiskerMaterial = new THREE.MeshStandardMaterial({ color: 0x888888 });

  // Left whiskers
  for (let i = 0; i < 3; i++) {
    const whisker = new THREE.Mesh(whiskerGeo, whiskerMaterial);
    whisker.position.set(-0.04 * s, 0.05 * s + i * 0.01 * s, 0.19 * s);
    whisker.rotation.y = 0.3;
    group.add(whisker);
  }

  // Right whiskers
  for (let i = 0; i < 3; i++) {
    const whisker = new THREE.Mesh(whiskerGeo, whiskerMaterial);
    whisker.position.set(0.04 * s, 0.05 * s + i * 0.01 * s, 0.19 * s);
    whisker.rotation.y = -0.3;
    group.add(whisker);
  }

  // === LEGS (4 small legs) ===
  const legGeo = new THREE.BoxGeometry(0.025 * s, 0.04 * s, 0.025 * s);

  // Front left
  const frontLeftLeg = new THREE.Mesh(legGeo, darkFurMaterial);
  frontLeftLeg.position.set(-0.04 * s, 0.02 * s, 0.06 * s);
  group.add(frontLeftLeg);

  // Front right
  const frontRightLeg = new THREE.Mesh(legGeo, darkFurMaterial);
  frontRightLeg.position.set(0.04 * s, 0.02 * s, 0.06 * s);
  group.add(frontRightLeg);

  // Back left
  const backLeftLeg = new THREE.Mesh(legGeo, darkFurMaterial);
  backLeftLeg.position.set(-0.04 * s, 0.02 * s, -0.06 * s);
  group.add(backLeftLeg);

  // Back right
  const backRightLeg = new THREE.Mesh(legGeo, darkFurMaterial);
  backRightLeg.position.set(0.04 * s, 0.02 * s, -0.06 * s);
  group.add(backRightLeg);

  // === TAIL (segmented, curving) ===
  const tailSegments = 6;
  const tailSegGeo = new THREE.BoxGeometry(0.015 * s, 0.015 * s, 0.04 * s);

  for (let i = 0; i < tailSegments; i++) {
    const segment = new THREE.Mesh(tailSegGeo, tailMaterial);
    // Tail curves upward slightly
    const zOff = -0.12 * s - i * 0.035 * s;
    const yOff = 0.04 * s + i * 0.015 * s;
    segment.position.set(0, yOff, zOff);
    segment.rotation.x = -0.2 * i; // Gradual curve
    group.add(segment);
  }

  return group;
}

export const RAT_META = {
  id: 'rat',
  name: 'Rat',
  category: 'enemy' as const,
  description: 'A small, scurrying rat with beady red eyes and a long tail',
  defaultScale: 1.0,
  boundingBox: { x: 0.15, y: 0.12, z: 0.4 },
  tags: ['rat', 'rodent', 'enemy', 'creature', 'small', 'vermin'],
  enemyName: 'Rat',
};
