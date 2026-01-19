/**
 * Rat V2 Enemy Model
 * Canonical design based on bestiary appearance.
 *
 * Canonical appearance from bestiary:
 * "Large gray rat with beady red eyes and matted fur."
 */

import * as THREE from 'three';

export interface RatV2Options {
  scale?: number;
}

export function createRatV2(options: RatV2Options = {}): THREE.Group {
  const { scale = 1.0 } = options;

  const group = new THREE.Group();
  const s = scale * 0.7; // "Large" rat - slightly bigger than v1

  // === MATERIALS ===
  // Gray matted fur (darker, rougher than typical clean fur)
  const mattedFurMaterial = new THREE.MeshStandardMaterial({
    color: 0x5a5a5a, // Gray
    roughness: 1.0, // Very rough for matted appearance
    metalness: 0.0,
  });

  // Darker gray for underbelly and accents
  const darkMattedFurMaterial = new THREE.MeshStandardMaterial({
    color: 0x3a3a3a, // Darker gray
    roughness: 1.0,
    metalness: 0.0,
  });

  // Dirty patches (matted clumps)
  const dirtyFurMaterial = new THREE.MeshStandardMaterial({
    color: 0x4a4540, // Gray-brown dirty
    roughness: 1.0,
    metalness: 0.0,
  });

  // Beady red eyes (canonical)
  const eyeMaterial = new THREE.MeshStandardMaterial({
    color: 0xff0000,
    roughness: 0.2,
    metalness: 0.0,
    emissive: 0x880000,
    emissiveIntensity: 0.8,
  });

  // Pink nose
  const noseMaterial = new THREE.MeshStandardMaterial({
    color: 0xcc8888,
    roughness: 0.6,
    metalness: 0.0,
  });

  // Pink inner ear
  const earMaterial = new THREE.MeshStandardMaterial({
    color: 0xbb8888,
    roughness: 0.7,
    metalness: 0.0,
  });

  // Pink tail (slightly dirty)
  const tailMaterial = new THREE.MeshStandardMaterial({
    color: 0xb09090,
    roughness: 0.6,
    metalness: 0.0,
  });

  // === BODY (large, elongated) ===
  const body = new THREE.Mesh(
    new THREE.BoxGeometry(0.14 * s, 0.1 * s, 0.24 * s),
    mattedFurMaterial
  );
  body.position.set(0, 0.08 * s, 0);
  group.add(body);

  // Belly (darker underneath)
  const belly = new THREE.Mesh(
    new THREE.BoxGeometry(0.12 * s, 0.05 * s, 0.2 * s),
    darkMattedFurMaterial
  );
  belly.position.set(0, 0.04 * s, 0);
  group.add(belly);

  // Matted fur clumps on body (canonical - "matted fur")
  const clumpGeo = new THREE.BoxGeometry(0.03 * s, 0.025 * s, 0.04 * s);
  const furClumps = [
    { x: -0.06, y: 0.12, z: 0.05, ry: 0.3 },
    { x: 0.05, y: 0.13, z: -0.02, ry: -0.2 },
    { x: -0.04, y: 0.11, z: -0.06, ry: 0.5 },
    { x: 0.06, y: 0.12, z: 0.08, ry: -0.4 },
    { x: 0, y: 0.13, z: 0.02, ry: 0.1 },
  ];

  furClumps.forEach((clump) => {
    const mesh = new THREE.Mesh(clumpGeo, dirtyFurMaterial);
    mesh.position.set(clump.x * s, clump.y * s, clump.z * s);
    mesh.rotation.y = clump.ry;
    group.add(mesh);
  });

  // === HEAD ===
  const head = new THREE.Mesh(
    new THREE.BoxGeometry(0.1 * s, 0.08 * s, 0.12 * s),
    mattedFurMaterial
  );
  head.position.set(0, 0.09 * s, 0.15 * s);
  group.add(head);

  // Snout (pointed)
  const snout = new THREE.Mesh(
    new THREE.BoxGeometry(0.06 * s, 0.05 * s, 0.08 * s),
    mattedFurMaterial
  );
  snout.position.set(0, 0.07 * s, 0.22 * s);
  group.add(snout);

  // Nose (pink)
  const nose = new THREE.Mesh(
    new THREE.BoxGeometry(0.03 * s, 0.025 * s, 0.02 * s),
    noseMaterial
  );
  nose.position.set(0, 0.065 * s, 0.26 * s);
  group.add(nose);

  // === EYES (beady red - canonical) ===
  const eyeGeo = new THREE.SphereGeometry(0.015 * s, 6, 4);

  const leftEye = new THREE.Mesh(eyeGeo, eyeMaterial);
  leftEye.position.set(-0.035 * s, 0.11 * s, 0.18 * s);
  group.add(leftEye);

  const rightEye = new THREE.Mesh(eyeGeo, eyeMaterial);
  rightEye.position.set(0.035 * s, 0.11 * s, 0.18 * s);
  group.add(rightEye);

  // === EARS ===
  const earOuterGeo = new THREE.BoxGeometry(0.035 * s, 0.04 * s, 0.018 * s);
  const earInnerGeo = new THREE.BoxGeometry(0.025 * s, 0.03 * s, 0.01 * s);

  // Left ear
  const leftEarOuter = new THREE.Mesh(earOuterGeo, mattedFurMaterial);
  leftEarOuter.position.set(-0.04 * s, 0.14 * s, 0.12 * s);
  leftEarOuter.rotation.z = -0.35;
  group.add(leftEarOuter);

  const leftEarInner = new THREE.Mesh(earInnerGeo, earMaterial);
  leftEarInner.position.set(-0.042 * s, 0.14 * s, 0.125 * s);
  leftEarInner.rotation.z = -0.35;
  group.add(leftEarInner);

  // Right ear
  const rightEarOuter = new THREE.Mesh(earOuterGeo, mattedFurMaterial);
  rightEarOuter.position.set(0.04 * s, 0.14 * s, 0.12 * s);
  rightEarOuter.rotation.z = 0.35;
  group.add(rightEarOuter);

  const rightEarInner = new THREE.Mesh(earInnerGeo, earMaterial);
  rightEarInner.position.set(0.042 * s, 0.14 * s, 0.125 * s);
  rightEarInner.rotation.z = 0.35;
  group.add(rightEarInner);

  // === WHISKERS ===
  const whiskerGeo = new THREE.BoxGeometry(0.07 * s, 0.003 * s, 0.003 * s);
  const whiskerMaterial = new THREE.MeshStandardMaterial({ color: 0x666666 });

  // Left whiskers
  for (let i = 0; i < 3; i++) {
    const whisker = new THREE.Mesh(whiskerGeo, whiskerMaterial);
    whisker.position.set(-0.045 * s, 0.06 * s + i * 0.012 * s, 0.23 * s);
    whisker.rotation.y = 0.35;
    whisker.rotation.z = 0.1 * (i - 1);
    group.add(whisker);
  }

  // Right whiskers
  for (let i = 0; i < 3; i++) {
    const whisker = new THREE.Mesh(whiskerGeo, whiskerMaterial);
    whisker.position.set(0.045 * s, 0.06 * s + i * 0.012 * s, 0.23 * s);
    whisker.rotation.y = -0.35;
    whisker.rotation.z = -0.1 * (i - 1);
    group.add(whisker);
  }

  // === TEETH (visible when attacking - Gnaw ability) ===
  const toothGeo = new THREE.BoxGeometry(0.008 * s, 0.015 * s, 0.008 * s);
  const toothMaterial = new THREE.MeshStandardMaterial({
    color: 0xeeeecc,
    roughness: 0.3,
  });

  const leftTooth = new THREE.Mesh(toothGeo, toothMaterial);
  leftTooth.position.set(-0.012 * s, 0.05 * s, 0.255 * s);
  group.add(leftTooth);

  const rightTooth = new THREE.Mesh(toothGeo, toothMaterial);
  rightTooth.position.set(0.012 * s, 0.05 * s, 0.255 * s);
  group.add(rightTooth);

  // === LEGS (4 legs - hunched posture) ===
  const legGeo = new THREE.BoxGeometry(0.03 * s, 0.05 * s, 0.03 * s);

  // Front left
  const frontLeftLeg = new THREE.Mesh(legGeo, darkMattedFurMaterial);
  frontLeftLeg.position.set(-0.05 * s, 0.025 * s, 0.08 * s);
  group.add(frontLeftLeg);

  // Front right
  const frontRightLeg = new THREE.Mesh(legGeo, darkMattedFurMaterial);
  frontRightLeg.position.set(0.05 * s, 0.025 * s, 0.08 * s);
  group.add(frontRightLeg);

  // Back left (slightly larger hind legs)
  const hindLegGeo = new THREE.BoxGeometry(0.035 * s, 0.055 * s, 0.04 * s);
  const backLeftLeg = new THREE.Mesh(hindLegGeo, darkMattedFurMaterial);
  backLeftLeg.position.set(-0.05 * s, 0.025 * s, -0.08 * s);
  group.add(backLeftLeg);

  // Back right
  const backRightLeg = new THREE.Mesh(hindLegGeo, darkMattedFurMaterial);
  backRightLeg.position.set(0.05 * s, 0.025 * s, -0.08 * s);
  group.add(backRightLeg);

  // === PAWS ===
  const pawGeo = new THREE.BoxGeometry(0.025 * s, 0.01 * s, 0.03 * s);

  const frontLeftPaw = new THREE.Mesh(pawGeo, noseMaterial);
  frontLeftPaw.position.set(-0.05 * s, 0.005 * s, 0.09 * s);
  group.add(frontLeftPaw);

  const frontRightPaw = new THREE.Mesh(pawGeo, noseMaterial);
  frontRightPaw.position.set(0.05 * s, 0.005 * s, 0.09 * s);
  group.add(frontRightPaw);

  const backLeftPaw = new THREE.Mesh(pawGeo, noseMaterial);
  backLeftPaw.position.set(-0.05 * s, 0.005 * s, -0.09 * s);
  group.add(backLeftPaw);

  const backRightPaw = new THREE.Mesh(pawGeo, noseMaterial);
  backRightPaw.position.set(0.05 * s, 0.005 * s, -0.09 * s);
  group.add(backRightPaw);

  // === TAIL (long, segmented, scaly appearance) ===
  const tailSegments = 8;
  const tailSegGeo = new THREE.BoxGeometry(0.018 * s, 0.018 * s, 0.045 * s);

  for (let i = 0; i < tailSegments; i++) {
    const segment = new THREE.Mesh(tailSegGeo, tailMaterial);
    // Tail curves upward and to the side slightly
    const zOff = -0.14 * s - i * 0.04 * s;
    const yOff = 0.05 * s + i * 0.012 * s;
    const xOff = Math.sin(i * 0.3) * 0.01 * s;
    segment.position.set(xOff, yOff, zOff);
    segment.rotation.x = -0.15 * i;
    // Scale down slightly toward tip
    const tapering = 1 - i * 0.08;
    segment.scale.set(tapering, tapering, 1);
    group.add(segment);
  }

  return group;
}

export const RAT_V2_META = {
  id: 'rat-v2',
  name: 'Rat V2',
  category: 'enemy' as const,
  description: 'Large gray rat with beady red eyes and matted fur - canonical design',
  defaultScale: 1.0,
  boundingBox: { x: 0.18, y: 0.15, z: 0.5 },
  tags: ['rat', 'rodent', 'enemy', 'creature', 'small', 'vermin', 'canonical'],
  enemyName: 'Rat',
  version: 2,
  isActive: true,
  baseModelId: 'rat',
};
