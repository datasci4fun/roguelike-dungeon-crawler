/**
 * Lightning Elemental Enemy Model
 * Canonical design based on bestiary appearance.
 *
 * Canonical appearance from bestiary:
 * "Flickering humanoid of blue-white lightning. Constantly discharging sparks."
 */

import * as THREE from 'three';

export interface LightningElementalOptions {
  scale?: number;
}

export function createLightningElemental(options: LightningElementalOptions = {}): THREE.Group {
  const { scale = 1.0 } = options;

  const group = new THREE.Group();
  const s = scale * 1.1;

  // === MATERIALS ===
  // Core lightning (bright white)
  const coreMaterial = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    roughness: 0.1,
    metalness: 0.0,
    emissive: 0xffffff,
    emissiveIntensity: 2.5,
  });

  // Inner lightning (blue-white)
  const innerMaterial = new THREE.MeshStandardMaterial({
    color: 0xccddff,
    roughness: 0.15,
    metalness: 0.0,
    emissive: 0x88aaff,
    emissiveIntensity: 2.0,
    transparent: true,
    opacity: 0.9,
  });

  // Outer lightning (blue)
  const outerMaterial = new THREE.MeshStandardMaterial({
    color: 0x6688ff,
    roughness: 0.2,
    metalness: 0.0,
    emissive: 0x4466dd,
    emissiveIntensity: 1.5,
    transparent: true,
    opacity: 0.8,
  });

  // Edge glow (purple-blue)
  const edgeMaterial = new THREE.MeshStandardMaterial({
    color: 0x4455cc,
    roughness: 0.3,
    metalness: 0.0,
    emissive: 0x3344aa,
    emissiveIntensity: 1.0,
    transparent: true,
    opacity: 0.6,
  });

  // Spark material (bright)
  const sparkMaterial = new THREE.MeshStandardMaterial({
    color: 0xeeffff,
    roughness: 0.1,
    metalness: 0.0,
    emissive: 0xaaddff,
    emissiveIntensity: 2.0,
  });

  // Ground charge material
  const groundChargeMaterial = new THREE.MeshStandardMaterial({
    color: 0x5566aa,
    roughness: 0.4,
    metalness: 0.1,
    emissive: 0x3344aa,
    emissiveIntensity: 0.6,
    transparent: true,
    opacity: 0.5,
  });

  // === HEAD (electric sphere) ===
  const headCore = new THREE.Mesh(
    new THREE.SphereGeometry(0.06 * s, 6, 6),
    coreMaterial
  );
  headCore.position.y = 0.72 * s;
  group.add(headCore);

  const headInner = new THREE.Mesh(
    new THREE.SphereGeometry(0.08 * s, 6, 6),
    innerMaterial
  );
  headInner.position.y = 0.72 * s;
  group.add(headInner);

  const headOuter = new THREE.Mesh(
    new THREE.SphereGeometry(0.1 * s, 6, 6),
    outerMaterial
  );
  headOuter.position.y = 0.72 * s;
  group.add(headOuter);

  // Eyes (intense white)
  const eyeGeo = new THREE.SphereGeometry(0.02 * s, 4, 4);

  const leftEye = new THREE.Mesh(eyeGeo, coreMaterial);
  leftEye.position.set(-0.03 * s, 0.74 * s, 0.07 * s);
  group.add(leftEye);

  const rightEye = new THREE.Mesh(eyeGeo, coreMaterial);
  rightEye.position.set(0.03 * s, 0.74 * s, 0.07 * s);
  group.add(rightEye);

  // Lightning arcs from head (canonical - "flickering")
  const headArcGeo = new THREE.BoxGeometry(0.015 * s, 0.1 * s, 0.01 * s);

  const headArc1 = new THREE.Mesh(headArcGeo, innerMaterial);
  headArc1.position.set(-0.06 * s, 0.82 * s, 0);
  headArc1.rotation.z = 0.5;
  group.add(headArc1);

  const headArc2 = new THREE.Mesh(headArcGeo, innerMaterial);
  headArc2.position.set(0.05 * s, 0.84 * s, 0.02 * s);
  headArc2.rotation.z = -0.4;
  group.add(headArc2);

  const headArc3 = new THREE.Mesh(headArcGeo, outerMaterial);
  headArc3.position.set(0, 0.86 * s, -0.04 * s);
  headArc3.rotation.z = 0.1;
  group.add(headArc3);

  // === TORSO (electric body) ===
  // Core
  const torsoCore = new THREE.Mesh(
    new THREE.BoxGeometry(0.08 * s, 0.2 * s, 0.06 * s),
    coreMaterial
  );
  torsoCore.position.y = 0.52 * s;
  group.add(torsoCore);

  // Inner layer
  const torsoInner = new THREE.Mesh(
    new THREE.BoxGeometry(0.14 * s, 0.24 * s, 0.1 * s),
    innerMaterial
  );
  torsoInner.position.y = 0.52 * s;
  group.add(torsoInner);

  // Outer layer
  const torsoOuter = new THREE.Mesh(
    new THREE.BoxGeometry(0.18 * s, 0.26 * s, 0.12 * s),
    outerMaterial
  );
  torsoOuter.position.y = 0.52 * s;
  group.add(torsoOuter);

  // Lightning streaks across torso
  const streakGeo = new THREE.BoxGeometry(0.02 * s, 0.08 * s, 0.01 * s);
  const streaks = [
    { x: -0.08, y: 0.56, z: 0.07, rz: 0.6 },
    { x: 0.1, y: 0.54, z: 0.06, rz: -0.5 },
    { x: -0.06, y: 0.46, z: 0.07, rz: 0.4 },
    { x: 0.08, y: 0.48, z: 0.06, rz: -0.3 },
  ];

  streaks.forEach((streak) => {
    const s1 = new THREE.Mesh(streakGeo, sparkMaterial);
    s1.position.set(streak.x * s, streak.y * s, streak.z * s);
    s1.rotation.z = streak.rz;
    group.add(s1);
  });

  // === ARMS (lightning tendrils) ===
  // Left arm
  const leftUpperArm = new THREE.Mesh(
    new THREE.BoxGeometry(0.05 * s, 0.14 * s, 0.04 * s),
    innerMaterial
  );
  leftUpperArm.position.set(-0.12 * s, 0.52 * s, 0);
  leftUpperArm.rotation.z = 0.35;
  group.add(leftUpperArm);

  const leftLowerArm = new THREE.Mesh(
    new THREE.BoxGeometry(0.04 * s, 0.14 * s, 0.035 * s),
    outerMaterial
  );
  leftLowerArm.position.set(-0.18 * s, 0.38 * s, 0.02 * s);
  leftLowerArm.rotation.z = 0.25;
  group.add(leftLowerArm);

  // Left hand (electric ball)
  const leftHand = new THREE.Mesh(
    new THREE.SphereGeometry(0.04 * s, 6, 6),
    innerMaterial
  );
  leftHand.position.set(-0.22 * s, 0.26 * s, 0.03 * s);
  group.add(leftHand);

  // Left hand sparks
  const sparkGeo = new THREE.BoxGeometry(0.012 * s, 0.04 * s, 0.01 * s);
  for (let i = 0; i < 4; i++) {
    const spark = new THREE.Mesh(sparkGeo, sparkMaterial);
    spark.position.set(
      (-0.21 - i * 0.015) * s,
      (0.22 + (i % 2) * 0.02) * s,
      0.04 * s
    );
    spark.rotation.z = 0.3 * (i - 1.5);
    group.add(spark);
  }

  // Right arm
  const rightUpperArm = new THREE.Mesh(
    new THREE.BoxGeometry(0.05 * s, 0.14 * s, 0.04 * s),
    innerMaterial
  );
  rightUpperArm.position.set(0.12 * s, 0.52 * s, 0);
  rightUpperArm.rotation.z = -0.35;
  group.add(rightUpperArm);

  const rightLowerArm = new THREE.Mesh(
    new THREE.BoxGeometry(0.04 * s, 0.14 * s, 0.035 * s),
    outerMaterial
  );
  rightLowerArm.position.set(0.18 * s, 0.38 * s, 0.02 * s);
  rightLowerArm.rotation.z = -0.25;
  group.add(rightLowerArm);

  // Right hand
  const rightHand = new THREE.Mesh(
    new THREE.SphereGeometry(0.04 * s, 6, 6),
    innerMaterial
  );
  rightHand.position.set(0.22 * s, 0.26 * s, 0.03 * s);
  group.add(rightHand);

  // Right hand sparks
  for (let i = 0; i < 4; i++) {
    const spark = new THREE.Mesh(sparkGeo, sparkMaterial);
    spark.position.set(
      (0.21 + i * 0.015) * s,
      (0.22 + (i % 2) * 0.02) * s,
      0.04 * s
    );
    spark.rotation.z = -0.3 * (i - 1.5);
    group.add(spark);
  }

  // === LOWER BODY (dissipating lightning) ===
  const lowerCore = new THREE.Mesh(
    new THREE.BoxGeometry(0.1 * s, 0.18 * s, 0.08 * s),
    innerMaterial
  );
  lowerCore.position.y = 0.3 * s;
  group.add(lowerCore);

  const lowerOuter = new THREE.Mesh(
    new THREE.BoxGeometry(0.14 * s, 0.2 * s, 0.1 * s),
    outerMaterial
  );
  lowerOuter.position.y = 0.3 * s;
  group.add(lowerOuter);

  const lowerEdge = new THREE.Mesh(
    new THREE.BoxGeometry(0.16 * s, 0.16 * s, 0.12 * s),
    edgeMaterial
  );
  lowerEdge.position.y = 0.24 * s;
  group.add(lowerEdge);

  // === SPARKS (canonical - "Constantly discharging sparks") ===
  // Sparks around body
  const flyingSparkGeo = new THREE.BoxGeometry(0.015 * s, 0.03 * s, 0.01 * s);
  const sparkPositions = [
    { x: -0.14, y: 0.6, z: 0.1, rz: 0.8 },
    { x: 0.16, y: 0.58, z: 0.08, rz: -0.6 },
    { x: -0.1, y: 0.44, z: 0.12, rz: 0.5 },
    { x: 0.12, y: 0.46, z: 0.1, rz: -0.4 },
    { x: -0.08, y: 0.72, z: 0.1, rz: 1.0 },
    { x: 0.1, y: 0.7, z: 0.08, rz: -0.9 },
    { x: 0, y: 0.78, z: 0.08, rz: 0.2 },
    { x: -0.16, y: 0.34, z: 0.06, rz: 0.7 },
    { x: 0.18, y: 0.32, z: 0.04, rz: -0.8 },
  ];

  sparkPositions.forEach((pos) => {
    const spark = new THREE.Mesh(flyingSparkGeo, sparkMaterial);
    spark.position.set(pos.x * s, pos.y * s, pos.z * s);
    spark.rotation.z = pos.rz;
    group.add(spark);
  });

  // === GROUND DISCHARGE (static field) ===
  // Electric ground ring
  const groundRing1 = new THREE.Mesh(
    new THREE.CylinderGeometry(0.15 * s, 0.2 * s, 0.02 * s, 8),
    groundChargeMaterial
  );
  groundRing1.position.y = 0.12 * s;
  group.add(groundRing1);

  const groundRing2 = new THREE.Mesh(
    new THREE.CylinderGeometry(0.22 * s, 0.28 * s, 0.015 * s, 8),
    groundChargeMaterial
  );
  groundRing2.position.y = 0.08 * s;
  group.add(groundRing2);

  // Ground sparks (arcing outward)
  const groundSparkGeo = new THREE.BoxGeometry(0.02 * s, 0.01 * s, 0.08 * s);
  const groundSparks = [
    { x: 0.12, z: 0.12, ry: 0.8 },
    { x: -0.14, z: 0.1, ry: -0.6 },
    { x: 0.08, z: -0.15, ry: 2.2 },
    { x: -0.1, z: -0.12, ry: -2.4 },
    { x: 0.16, z: -0.04, ry: 1.4 },
    { x: -0.15, z: 0.02, ry: -1.6 },
  ];

  groundSparks.forEach((pos) => {
    const spark = new THREE.Mesh(groundSparkGeo, sparkMaterial);
    spark.position.set(pos.x * s, 0.06 * s, pos.z * s);
    spark.rotation.y = pos.ry;
    group.add(spark);
  });

  // Central base
  const base = new THREE.Mesh(
    new THREE.CylinderGeometry(0.1 * s, 0.12 * s, 0.04 * s, 8),
    innerMaterial
  );
  base.position.y = 0.14 * s;
  group.add(base);

  return group;
}

export const LIGHTNING_ELEMENTAL_META = {
  id: 'lightning-elemental',
  name: 'Lightning Elemental',
  category: 'enemy' as const,
  description: 'Flickering humanoid of blue-white lightning. Constantly discharging sparks - canonical design',
  defaultScale: 1.0,
  boundingBox: { x: 0.6, y: 0.9, z: 0.6 },
  tags: ['elemental', 'lightning', 'electric', 'enemy', 'creature', 'monster', 'canonical'],
  enemyName: 'Lightning Elemental',
};
