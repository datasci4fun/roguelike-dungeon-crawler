/**
 * Rat King Boss Model v2
 * Canonical design based on bestiary appearance.
 *
 * Canonical appearance from bestiary:
 * "Mass of intertwined rats sharing a single body. Multiple heads snap and screech. Oozes plague."
 *
 * The Rat King is a legendary creature - multiple rats whose tails have become
 * tangled and fused together, forcing them to move as one horrific mass.
 */

import * as THREE from 'three';

export interface RatKingV2Options {
  scale?: number;
}

export function createRatKingV2(options: RatKingV2Options = {}): THREE.Group {
  const { scale = 1.0 } = options;

  const group = new THREE.Group();
  const s = scale * 1.2; // Boss scale

  // === MATERIALS ===
  // Gray-brown matted fur
  const furMaterial = new THREE.MeshStandardMaterial({
    color: 0x5a5550,
    roughness: 0.95,
    metalness: 0.0,
  });

  // Darker fur variant
  const darkFurMaterial = new THREE.MeshStandardMaterial({
    color: 0x3a3530,
    roughness: 1.0,
    metalness: 0.0,
  });

  // Pink skin (ears, tails, paws)
  const skinMaterial = new THREE.MeshStandardMaterial({
    color: 0xb8a090,
    roughness: 0.7,
    metalness: 0.0,
  });

  // Plague ooze (canonical - oozes plague)
  const plagueMaterial = new THREE.MeshStandardMaterial({
    color: 0x7a9944,
    roughness: 0.2,
    metalness: 0.1,
    emissive: 0x445522,
    emissiveIntensity: 0.6,
    transparent: true,
    opacity: 0.75,
  });

  // Angry red eyes
  const eyeMaterial = new THREE.MeshStandardMaterial({
    color: 0xff3333,
    roughness: 0.1,
    metalness: 0.0,
    emissive: 0xdd1111,
    emissiveIntensity: 1.2,
  });

  // Yellow teeth
  const teethMaterial = new THREE.MeshStandardMaterial({
    color: 0xddcc88,
    roughness: 0.4,
    metalness: 0.1,
  });

  // Helper function to create a single rat facing outward
  const createRat = (
    baseX: number,
    baseY: number,
    baseZ: number,
    rotY: number,
    ratScale: number,
    isScreeching: boolean
  ) => {
    const rs = ratScale;
    const cosR = Math.cos(rotY);
    const sinR = Math.sin(rotY);

    // Rat body (elongated box, not sphere)
    const body = new THREE.Mesh(
      new THREE.BoxGeometry(0.08 * s * rs, 0.06 * s * rs, 0.14 * s * rs),
      furMaterial
    );
    body.position.set(baseX * s, baseY * s, baseZ * s);
    body.rotation.y = rotY;
    group.add(body);

    // Haunches (back of rat, slightly raised)
    const haunches = new THREE.Mesh(
      new THREE.BoxGeometry(0.07 * s * rs, 0.055 * s * rs, 0.06 * s * rs),
      darkFurMaterial
    );
    const haunchX = baseX - sinR * 0.05 * rs;
    const haunchZ = baseZ - cosR * 0.05 * rs;
    haunches.position.set(haunchX * s, (baseY + 0.01) * s, haunchZ * s);
    haunches.rotation.y = rotY;
    group.add(haunches);

    // Head (box-shaped rat head)
    const headX = baseX + sinR * 0.08 * rs;
    const headZ = baseZ + cosR * 0.08 * rs;
    const headY = baseY + 0.02;
    const head = new THREE.Mesh(
      new THREE.BoxGeometry(0.055 * s * rs, 0.045 * s * rs, 0.06 * s * rs),
      furMaterial
    );
    head.position.set(headX * s, headY * s, headZ * s);
    head.rotation.y = rotY;
    // Tilt head up if screeching
    if (isScreeching) {
      head.rotation.x = -0.3;
    }
    group.add(head);

    // Snout (pointed)
    const snoutX = baseX + sinR * 0.12 * rs;
    const snoutZ = baseZ + cosR * 0.12 * rs;
    const snoutY = headY - 0.01;
    const snout = new THREE.Mesh(
      new THREE.BoxGeometry(0.035 * s * rs, 0.03 * s * rs, 0.045 * s * rs),
      furMaterial
    );
    snout.position.set(snoutX * s, snoutY * s, snoutZ * s);
    snout.rotation.y = rotY;
    group.add(snout);

    // Nose
    const noseX = baseX + sinR * 0.145 * rs;
    const noseZ = baseZ + cosR * 0.145 * rs;
    const nose = new THREE.Mesh(
      new THREE.BoxGeometry(0.018 * s * rs, 0.015 * s * rs, 0.015 * s * rs),
      skinMaterial
    );
    nose.position.set(noseX * s, snoutY * s, noseZ * s);
    group.add(nose);

    // Eyes (beady, red, glowing)
    const eyeGeo = new THREE.SphereGeometry(0.012 * s * rs, 6, 4);
    const eyeOffset = 0.022 * rs;
    const eyeForward = 0.09 * rs;

    const leftEyeX = baseX + sinR * eyeForward - cosR * eyeOffset;
    const leftEyeZ = baseZ + cosR * eyeForward + sinR * eyeOffset;
    const leftEye = new THREE.Mesh(eyeGeo, eyeMaterial);
    leftEye.position.set(leftEyeX * s, (headY + 0.015) * s, leftEyeZ * s);
    group.add(leftEye);

    const rightEyeX = baseX + sinR * eyeForward + cosR * eyeOffset;
    const rightEyeZ = baseZ + cosR * eyeForward - sinR * eyeOffset;
    const rightEye = new THREE.Mesh(eyeGeo, eyeMaterial);
    rightEye.position.set(rightEyeX * s, (headY + 0.015) * s, rightEyeZ * s);
    group.add(rightEye);

    // Ears (rounded boxes)
    const earGeo = new THREE.BoxGeometry(0.025 * s * rs, 0.03 * s * rs, 0.015 * s * rs);
    const earY = headY + 0.03;
    const earBack = 0.06 * rs;

    const leftEarX = baseX + sinR * earBack - cosR * 0.03 * rs;
    const leftEarZ = baseZ + cosR * earBack + sinR * 0.03 * rs;
    const leftEar = new THREE.Mesh(earGeo, skinMaterial);
    leftEar.position.set(leftEarX * s, earY * s, leftEarZ * s);
    leftEar.rotation.y = rotY;
    leftEar.rotation.z = -0.3;
    group.add(leftEar);

    const rightEarX = baseX + sinR * earBack + cosR * 0.03 * rs;
    const rightEarZ = baseZ + cosR * earBack - sinR * 0.03 * rs;
    const rightEar = new THREE.Mesh(earGeo, skinMaterial);
    rightEar.position.set(rightEarX * s, earY * s, rightEarZ * s);
    rightEar.rotation.y = rotY;
    rightEar.rotation.z = 0.3;
    group.add(rightEar);

    // Teeth (visible if screeching)
    if (isScreeching) {
      const toothGeo = new THREE.BoxGeometry(0.008 * s * rs, 0.018 * s * rs, 0.006 * s * rs);
      const toothY = snoutY - 0.02;
      const toothForward = 0.14 * rs;

      const tooth1X = baseX + sinR * toothForward - cosR * 0.008;
      const tooth1Z = baseZ + cosR * toothForward + sinR * 0.008;
      const tooth1 = new THREE.Mesh(toothGeo, teethMaterial);
      tooth1.position.set(tooth1X * s, toothY * s, tooth1Z * s);
      group.add(tooth1);

      const tooth2X = baseX + sinR * toothForward + cosR * 0.008;
      const tooth2Z = baseZ + cosR * toothForward - sinR * 0.008;
      const tooth2 = new THREE.Mesh(toothGeo, teethMaterial);
      tooth2.position.set(tooth2X * s, toothY * s, tooth2Z * s);
      group.add(tooth2);
    }

    // Front paws
    const pawGeo = new THREE.BoxGeometry(0.02 * s * rs, 0.015 * s * rs, 0.025 * s * rs);
    const pawY = baseY - 0.03;
    const pawForward = 0.06 * rs;

    const leftPawX = baseX + sinR * pawForward - cosR * 0.03 * rs;
    const leftPawZ = baseZ + cosR * pawForward + sinR * 0.03 * rs;
    const leftPaw = new THREE.Mesh(pawGeo, skinMaterial);
    leftPaw.position.set(leftPawX * s, pawY * s, leftPawZ * s);
    group.add(leftPaw);

    const rightPawX = baseX + sinR * pawForward + cosR * 0.03 * rs;
    const rightPawZ = baseZ + cosR * pawForward - sinR * 0.03 * rs;
    const rightPaw = new THREE.Mesh(pawGeo, skinMaterial);
    rightPaw.position.set(rightPawX * s, pawY * s, rightPawZ * s);
    group.add(rightPaw);

    // Return tail start position (back of rat) for tangling
    return {
      tailX: baseX - sinR * 0.08 * rs,
      tailZ: baseZ - cosR * 0.08 * rs,
      tailY: baseY,
      angle: rotY + Math.PI, // Tail points backward
    };
  };

  // === CREATE MULTIPLE RATS IN A RADIAL PATTERN ===
  // The rats face outward with tails meeting in the center
  const rats = [
    { x: 0, z: 0.22, rot: 0, scale: 1.0, screech: true },           // Front
    { x: 0.19, z: 0.11, rot: Math.PI / 3, scale: 0.95, screech: false },
    { x: 0.19, z: -0.11, rot: (2 * Math.PI) / 3, scale: 0.9, screech: true },
    { x: 0, z: -0.22, rot: Math.PI, scale: 1.0, screech: false },   // Back
    { x: -0.19, z: -0.11, rot: (-2 * Math.PI) / 3, scale: 0.95, screech: true },
    { x: -0.19, z: 0.11, rot: -Math.PI / 3, scale: 0.9, screech: false },
  ];

  const tailStarts: { tailX: number; tailZ: number; tailY: number; angle: number }[] = [];

  rats.forEach((rat) => {
    const tailInfo = createRat(rat.x, 0.28, rat.z, rat.rot, rat.scale, rat.screech);
    tailStarts.push(tailInfo);
  });

  // === INTERTWINED TAILS IN CENTER (the defining feature of a Rat King) ===
  // Tails meet and tangle in the middle
  const tailSegGeo = new THREE.CylinderGeometry(0.012 * s, 0.008 * s, 0.06 * s, 6);

  tailStarts.forEach((ts, idx) => {
    // Each tail curves toward center and intertwines
    for (let i = 0; i < 5; i++) {
      const progress = i / 4;
      // Spiral toward center
      const spiralAngle = ts.angle + progress * 1.5 + idx * 0.3;
      const distFromCenter = 0.08 * (1 - progress * 0.9);

      const segX = Math.sin(spiralAngle) * distFromCenter;
      const segZ = Math.cos(spiralAngle) * distFromCenter;
      const segY = ts.tailY - 0.08 - i * 0.02 + Math.sin(i + idx) * 0.02;

      const seg = new THREE.Mesh(tailSegGeo, skinMaterial);
      seg.position.set(segX * s, segY * s, segZ * s);
      seg.rotation.x = 0.4 + progress * 0.5;
      seg.rotation.z = spiralAngle + Math.PI / 2;

      const taper = 1 - i * 0.12;
      seg.scale.set(taper, 1, taper);
      group.add(seg);
    }
  });

  // Central tail knot (the tangled mass in the middle)
  const knotGeo = new THREE.BoxGeometry(0.08 * s, 0.06 * s, 0.08 * s);
  const knot = new THREE.Mesh(knotGeo, skinMaterial);
  knot.position.set(0, 0.12 * s, 0);
  knot.rotation.y = 0.3;
  group.add(knot);

  // Extra tail tangles around knot
  const tangleGeo = new THREE.CylinderGeometry(0.01 * s, 0.008 * s, 0.05 * s, 5);
  for (let i = 0; i < 8; i++) {
    const angle = (i / 8) * Math.PI * 2;
    const tangle = new THREE.Mesh(tangleGeo, skinMaterial);
    tangle.position.set(
      Math.cos(angle) * 0.04 * s,
      (0.1 + Math.sin(i) * 0.02) * s,
      Math.sin(angle) * 0.04 * s
    );
    tangle.rotation.x = Math.PI / 2 + Math.random() * 0.5;
    tangle.rotation.z = angle;
    group.add(tangle);
  }

  // === PLAGUE OOZE (canonical - oozes plague) ===
  // Dripping from the mass
  const oozeGeo = new THREE.BoxGeometry(0.03 * s, 0.05 * s, 0.025 * s);
  const oozePositions = [
    { x: -0.15, y: 0.22, z: 0.12 },
    { x: 0.18, y: 0.2, z: 0.08 },
    { x: -0.12, y: 0.18, z: -0.14 },
    { x: 0.14, y: 0.24, z: -0.1 },
    { x: 0.08, y: 0.16, z: 0.16 },
    { x: -0.08, y: 0.14, z: -0.08 },
    { x: 0, y: 0.1, z: 0.04 },
    { x: 0, y: 0.08, z: -0.05 },
  ];

  oozePositions.forEach((op) => {
    const ooze = new THREE.Mesh(oozeGeo, plagueMaterial);
    ooze.position.set(op.x * s, op.y * s, op.z * s);
    ooze.rotation.z = Math.random() * 0.3 - 0.15;
    group.add(ooze);
  });

  // Plague drips hanging down
  const dripGeo = new THREE.BoxGeometry(0.015 * s, 0.04 * s, 0.012 * s);
  for (let i = 0; i < 6; i++) {
    const angle = (i / 6) * Math.PI * 2;
    const drip = new THREE.Mesh(dripGeo, plagueMaterial);
    drip.position.set(
      Math.cos(angle) * 0.2 * s,
      0.08 * s,
      Math.sin(angle) * 0.2 * s
    );
    group.add(drip);
  }

  // Plague puddle at base
  const plaguePool = new THREE.Mesh(
    new THREE.CylinderGeometry(0.32 * s, 0.38 * s, 0.015 * s, 12),
    new THREE.MeshStandardMaterial({
      color: 0x667744,
      roughness: 0.2,
      metalness: 0.1,
      emissive: 0x334422,
      emissiveIntensity: 0.4,
      transparent: true,
      opacity: 0.65,
    })
  );
  plaguePool.position.y = 0.01 * s;
  group.add(plaguePool);

  // Small plague bubbles
  const bubbleGeo = new THREE.SphereGeometry(0.02 * s, 5, 4);
  const bubbles = [
    { x: -0.2, z: 0.15 },
    { x: 0.22, z: 0.08 },
    { x: -0.15, z: -0.18 },
    { x: 0.18, z: -0.12 },
    { x: 0.05, z: 0.25 },
  ];

  bubbles.forEach((b) => {
    const bubble = new THREE.Mesh(bubbleGeo, plagueMaterial);
    bubble.position.set(b.x * s, 0.03 * s, b.z * s);
    group.add(bubble);
  });

  return group;
}

export const RAT_KING_V2_META = {
  id: 'rat-king-v2',
  name: 'Rat King',
  category: 'enemy' as const,
  description: 'Mass of intertwined rats sharing a single body. Multiple heads snap and screech. Oozes plague - canonical design v2',
  defaultScale: 1.0,
  boundingBox: { x: 0.7, y: 0.5, z: 0.7 },
  tags: ['boss', 'rat', 'swarm', 'enemy', 'plague', 'poison', 'canonical'],
  enemyName: 'Rat King',
  version: 2,
  isActive: true,
  baseModelId: 'rat-king',
};
