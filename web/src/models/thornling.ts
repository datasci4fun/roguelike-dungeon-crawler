/**
 * Thornling Enemy Model
 * Canonical design based on bestiary appearance.
 *
 * Canonical appearance from bestiary:
 * "Walking mass of twisted vines and thorns. Rose-like flowers bloom with razor petals."
 */

import * as THREE from 'three';

export interface ThornlingOptions {
  scale?: number;
}

export function createThornling(options: ThornlingOptions = {}): THREE.Group {
  const { scale = 1.0 } = options;

  const group = new THREE.Group();
  const s = scale * 0.9;

  // === MATERIALS ===
  // Vine material (dark green)
  const vineMaterial = new THREE.MeshStandardMaterial({
    color: 0x2a4a2a,
    roughness: 0.8,
    metalness: 0.0,
  });

  // Lighter vine
  const lightVineMaterial = new THREE.MeshStandardMaterial({
    color: 0x3a5a3a,
    roughness: 0.7,
    metalness: 0.0,
  });

  // Thorn material (darker, sharp)
  const thornMaterial = new THREE.MeshStandardMaterial({
    color: 0x1a2a1a,
    roughness: 0.5,
    metalness: 0.1,
  });

  // Rose petal material (canonical - rose-like flowers with razor petals)
  const petalMaterial = new THREE.MeshStandardMaterial({
    color: 0xcc3344,
    roughness: 0.4,
    metalness: 0.1,
    emissive: 0x661122,
    emissiveIntensity: 0.2,
  });

  // Dark petal edges (razor)
  const razorPetalMaterial = new THREE.MeshStandardMaterial({
    color: 0x991122,
    roughness: 0.3,
    metalness: 0.2,
  });

  // Flower center
  const flowerCenterMaterial = new THREE.MeshStandardMaterial({
    color: 0xffcc44,
    roughness: 0.5,
    metalness: 0.0,
    emissive: 0xaa8822,
    emissiveIntensity: 0.3,
  });

  // === MAIN BODY (twisted vine mass) ===
  // Core vine cluster
  const coreVine = new THREE.Mesh(
    new THREE.SphereGeometry(0.12 * s, 8, 6),
    vineMaterial
  );
  coreVine.position.y = 0.4 * s;
  coreVine.scale.set(1, 1.2, 1);
  group.add(coreVine);

  // Twisted vine segments forming body
  const vineSegmentGeo = new THREE.CylinderGeometry(0.03 * s, 0.035 * s, 0.15 * s, 6);
  const vineSegments = [
    { x: -0.08, y: 0.35, z: 0.06, rx: 0.3, rz: 0.4 },
    { x: 0.1, y: 0.38, z: 0.04, rx: -0.2, rz: -0.35 },
    { x: -0.06, y: 0.42, z: -0.08, rx: 0.4, rz: 0.25 },
    { x: 0.08, y: 0.32, z: -0.06, rx: -0.3, rz: -0.2 },
    { x: 0, y: 0.46, z: 0.1, rx: 0.5, rz: 0 },
    { x: -0.1, y: 0.3, z: 0, rx: 0.2, rz: 0.5 },
  ];

  vineSegments.forEach((vs) => {
    const vine = new THREE.Mesh(vineSegmentGeo, lightVineMaterial);
    vine.position.set(vs.x * s, vs.y * s, vs.z * s);
    vine.rotation.x = vs.rx;
    vine.rotation.z = vs.rz;
    group.add(vine);
  });

  // === THORNS (canonical - thorns throughout) ===
  const thornGeo = new THREE.ConeGeometry(0.015 * s, 0.06 * s, 4);
  const thornPositions = [
    { x: -0.12, y: 0.38, z: 0.08, rx: 0.5, rz: 0.8 },
    { x: 0.14, y: 0.42, z: 0.06, rx: 0.3, rz: -0.7 },
    { x: -0.1, y: 0.44, z: -0.1, rx: -0.4, rz: 0.6 },
    { x: 0.1, y: 0.36, z: -0.08, rx: -0.3, rz: -0.5 },
    { x: 0, y: 0.52, z: 0.08, rx: 0.6, rz: 0 },
    { x: -0.08, y: 0.32, z: 0.1, rx: 0.8, rz: 0.4 },
    { x: 0.12, y: 0.48, z: 0, rx: 0.2, rz: -0.6 },
    { x: -0.06, y: 0.4, z: -0.12, rx: -0.5, rz: 0.3 },
    { x: 0.08, y: 0.3, z: 0.06, rx: 0.7, rz: -0.3 },
    { x: -0.14, y: 0.46, z: 0, rx: 0, rz: 0.9 },
  ];

  thornPositions.forEach((tp) => {
    const thorn = new THREE.Mesh(thornGeo, thornMaterial);
    thorn.position.set(tp.x * s, tp.y * s, tp.z * s);
    thorn.rotation.x = tp.rx;
    thorn.rotation.z = tp.rz;
    group.add(thorn);
  });

  // === ROSE-LIKE FLOWERS (canonical - with razor petals) ===
  // Main flower on top
  const createFlower = (x: number, y: number, z: number, flowerScale: number) => {
    // Flower center
    const center = new THREE.Mesh(
      new THREE.SphereGeometry(0.025 * s * flowerScale, 6, 4),
      flowerCenterMaterial
    );
    center.position.set(x * s, y * s, z * s);
    group.add(center);

    // Razor petals around center
    const petalGeo = new THREE.BoxGeometry(0.04 * s * flowerScale, 0.015 * s * flowerScale, 0.02 * s * flowerScale);
    for (let i = 0; i < 6; i++) {
      const angle = (i / 6) * Math.PI * 2;
      const petal = new THREE.Mesh(petalGeo, petalMaterial);
      petal.position.set(
        (x + Math.cos(angle) * 0.04 * flowerScale) * s,
        y * s,
        (z + Math.sin(angle) * 0.04 * flowerScale) * s
      );
      petal.rotation.y = angle;
      petal.rotation.z = 0.3;
      group.add(petal);

      // Razor edge on petal
      const edgeGeo = new THREE.BoxGeometry(0.035 * s * flowerScale, 0.005 * s * flowerScale, 0.015 * s * flowerScale);
      const edge = new THREE.Mesh(edgeGeo, razorPetalMaterial);
      edge.position.set(
        (x + Math.cos(angle) * 0.055 * flowerScale) * s,
        (y - 0.005) * s,
        (z + Math.sin(angle) * 0.055 * flowerScale) * s
      );
      edge.rotation.y = angle;
      group.add(edge);
    }
  };

  // Multiple flowers
  createFlower(0, 0.56, 0.05, 1.0);
  createFlower(-0.1, 0.48, -0.08, 0.8);
  createFlower(0.12, 0.44, 0.02, 0.7);

  // === ARM-LIKE VINE TENDRILS ===
  const armGeo = new THREE.CylinderGeometry(0.025 * s, 0.02 * s, 0.2 * s, 6);

  // Left arm
  const leftArm = new THREE.Mesh(armGeo, vineMaterial);
  leftArm.position.set(-0.16 * s, 0.38 * s, 0.02 * s);
  leftArm.rotation.z = 0.6;
  leftArm.rotation.x = -0.2;
  group.add(leftArm);

  // Left claw (thorn cluster)
  for (let i = 0; i < 3; i++) {
    const claw = new THREE.Mesh(thornGeo, thornMaterial);
    claw.position.set((-0.24 - i * 0.02) * s, 0.3 * s, (0.02 + i * 0.015) * s);
    claw.rotation.z = 0.8 + i * 0.2;
    claw.rotation.x = -0.3 + i * 0.15;
    group.add(claw);
  }

  // Right arm
  const rightArm = new THREE.Mesh(armGeo, vineMaterial);
  rightArm.position.set(0.16 * s, 0.38 * s, 0.02 * s);
  rightArm.rotation.z = -0.6;
  rightArm.rotation.x = -0.2;
  group.add(rightArm);

  // Right claw
  for (let i = 0; i < 3; i++) {
    const claw = new THREE.Mesh(thornGeo, thornMaterial);
    claw.position.set((0.24 + i * 0.02) * s, 0.3 * s, (0.02 + i * 0.015) * s);
    claw.rotation.z = -0.8 - i * 0.2;
    claw.rotation.x = -0.3 + i * 0.15;
    group.add(claw);
  }

  // === LEGS (root-like) ===
  const legGeo = new THREE.CylinderGeometry(0.03 * s, 0.025 * s, 0.18 * s, 6);

  // Front left leg
  const frontLeftLeg = new THREE.Mesh(legGeo, vineMaterial);
  frontLeftLeg.position.set(-0.08 * s, 0.18 * s, 0.1 * s);
  frontLeftLeg.rotation.x = 0.3;
  frontLeftLeg.rotation.z = 0.15;
  group.add(frontLeftLeg);

  // Front right leg
  const frontRightLeg = new THREE.Mesh(legGeo, vineMaterial);
  frontRightLeg.position.set(0.08 * s, 0.18 * s, 0.1 * s);
  frontRightLeg.rotation.x = 0.3;
  frontRightLeg.rotation.z = -0.15;
  group.add(frontRightLeg);

  // Back left leg
  const backLeftLeg = new THREE.Mesh(legGeo, vineMaterial);
  backLeftLeg.position.set(-0.08 * s, 0.18 * s, -0.08 * s);
  backLeftLeg.rotation.x = -0.25;
  backLeftLeg.rotation.z = 0.15;
  group.add(backLeftLeg);

  // Back right leg
  const backRightLeg = new THREE.Mesh(legGeo, vineMaterial);
  backRightLeg.position.set(0.08 * s, 0.18 * s, -0.08 * s);
  backRightLeg.rotation.x = -0.25;
  backRightLeg.rotation.z = -0.15;
  group.add(backRightLeg);

  // Root feet
  const footGeo = new THREE.SphereGeometry(0.03 * s, 6, 4);
  const footPositions = [
    { x: -0.1, z: 0.16 },
    { x: 0.1, z: 0.16 },
    { x: -0.1, z: -0.14 },
    { x: 0.1, z: -0.14 },
  ];

  footPositions.forEach((fp) => {
    const foot = new THREE.Mesh(footGeo, lightVineMaterial);
    foot.position.set(fp.x * s, 0.06 * s, fp.z * s);
    foot.scale.set(1, 0.6, 1.2);
    group.add(foot);
  });

  return group;
}

export const THORNLING_META = {
  id: 'thornling',
  name: 'Thornling',
  category: 'enemy' as const,
  description: 'Walking mass of twisted vines and thorns. Rose-like flowers bloom with razor petals - canonical design',
  defaultScale: 1.0,
  boundingBox: { x: 0.5, y: 0.6, z: 0.4 },
  tags: ['plant', 'nature', 'enemy', 'creature', 'thorn', 'vine', 'canonical'],
  enemyName: 'Thornling',
};
