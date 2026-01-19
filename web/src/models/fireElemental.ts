/**
 * Fire Elemental Enemy Model
 * Canonical design based on bestiary appearance.
 *
 * Canonical appearance from bestiary:
 * "Humanoid shape composed entirely of roaring flames. Leaves scorch marks wherever it moves."
 */

import * as THREE from 'three';
import { createMaterial } from './materials';

export interface FireElementalOptions {
  scale?: number;
}

export function createFireElemental(options: FireElementalOptions = {}): THREE.Group {
  const { scale = 1.0 } = options;

  const group = new THREE.Group();
  const s = scale * 1.1;

  // === MATERIALS ===
  // Core flame (hottest - white/yellow)
  const coreFireMaterial = new THREE.MeshStandardMaterial({
    color: 0xffffaa,
    roughness: 0.2,
    metalness: 0.0,
    emissive: 0xffdd66,
    emissiveIntensity: 2.0,
    transparent: true,
    opacity: 0.95,
  });

  // Inner flame (hot - orange)
  const innerFireMaterial = new THREE.MeshStandardMaterial({
    color: 0xff8800,
    roughness: 0.3,
    metalness: 0.0,
    emissive: 0xff6600,
    emissiveIntensity: 1.5,
    transparent: true,
    opacity: 0.9,
  });

  // Outer flame (cooler - red/orange)
  const outerFireMaterial = new THREE.MeshStandardMaterial({
    color: 0xff4400,
    roughness: 0.4,
    metalness: 0.0,
    emissive: 0xff2200,
    emissiveIntensity: 1.2,
    transparent: true,
    opacity: 0.8,
  });

  // Edge flame (coolest - dark red)
  const edgeFireMaterial = new THREE.MeshStandardMaterial({
    color: 0xcc2200,
    roughness: 0.5,
    metalness: 0.0,
    emissive: 0xaa1100,
    emissiveIntensity: 0.8,
    transparent: true,
    opacity: 0.7,
  });

  // Ember/char material (for base)
  const emberMaterial = new THREE.MeshStandardMaterial({
    color: 0x331100,
    roughness: 0.8,
    metalness: 0.1,
    emissive: 0x441100,
    emissiveIntensity: 0.4,
  });

  // === HEAD (flame shape) ===
  // Core
  const headCore = new THREE.Mesh(
    new THREE.SphereGeometry(0.08 * s, 6, 6),
    coreFireMaterial
  );
  headCore.position.y = 0.7 * s;
  group.add(headCore);

  // Inner layer
  const headInner = new THREE.Mesh(
    new THREE.SphereGeometry(0.1 * s, 6, 6),
    innerFireMaterial
  );
  headInner.position.y = 0.7 * s;
  headInner.scale.set(1, 1.2, 1);
  group.add(headInner);

  // Outer flames
  const headOuter = new THREE.Mesh(
    new THREE.SphereGeometry(0.12 * s, 6, 6),
    outerFireMaterial
  );
  headOuter.position.y = 0.72 * s;
  headOuter.scale.set(1, 1.3, 0.9);
  group.add(headOuter);

  // Flame tendrils rising from head
  const headFlameGeo = new THREE.BoxGeometry(0.04 * s, 0.12 * s, 0.03 * s);

  const headFlame1 = new THREE.Mesh(headFlameGeo, outerFireMaterial);
  headFlame1.position.set(-0.04 * s, 0.82 * s, 0);
  headFlame1.rotation.z = 0.2;
  group.add(headFlame1);

  const headFlame2 = new THREE.Mesh(headFlameGeo, innerFireMaterial);
  headFlame2.position.set(0.03 * s, 0.84 * s, 0.02 * s);
  headFlame2.rotation.z = -0.15;
  group.add(headFlame2);

  const headFlame3 = new THREE.Mesh(headFlameGeo, outerFireMaterial);
  headFlame3.position.set(0, 0.86 * s, -0.03 * s);
  group.add(headFlame3);

  // Eyes (intense white-hot cores)
  const eyeGeo = new THREE.SphereGeometry(0.025 * s, 6, 4);

  const leftEye = new THREE.Mesh(eyeGeo, coreFireMaterial);
  leftEye.position.set(-0.04 * s, 0.72 * s, 0.08 * s);
  group.add(leftEye);

  const rightEye = new THREE.Mesh(eyeGeo, coreFireMaterial);
  rightEye.position.set(0.04 * s, 0.72 * s, 0.08 * s);
  group.add(rightEye);

  // === TORSO (flame body) ===
  // Core
  const torsoCore = new THREE.Mesh(
    new THREE.BoxGeometry(0.12 * s, 0.22 * s, 0.1 * s),
    coreFireMaterial
  );
  torsoCore.position.y = 0.48 * s;
  group.add(torsoCore);

  // Inner layer
  const torsoInner = new THREE.Mesh(
    new THREE.BoxGeometry(0.18 * s, 0.26 * s, 0.14 * s),
    innerFireMaterial
  );
  torsoInner.position.y = 0.48 * s;
  group.add(torsoInner);

  // Outer layer
  const torsoOuter = new THREE.Mesh(
    new THREE.BoxGeometry(0.22 * s, 0.28 * s, 0.16 * s),
    outerFireMaterial
  );
  torsoOuter.position.y = 0.48 * s;
  group.add(torsoOuter);

  // Flame wisps on torso
  const wispGeo = new THREE.BoxGeometry(0.05 * s, 0.1 * s, 0.03 * s);
  const wispPositions = [
    { x: -0.12, y: 0.56, z: 0.06, rz: 0.3 },
    { x: 0.14, y: 0.54, z: 0.04, rz: -0.25 },
    { x: -0.1, y: 0.42, z: 0.08, rz: 0.2 },
    { x: 0.11, y: 0.44, z: 0.06, rz: -0.15 },
    { x: 0, y: 0.58, z: -0.1, rz: 0 },
  ];

  wispPositions.forEach((pos) => {
    const wisp = new THREE.Mesh(wispGeo, edgeFireMaterial);
    wisp.position.set(pos.x * s, pos.y * s, pos.z * s);
    wisp.rotation.z = pos.rz;
    group.add(wisp);
  });

  // === ARMS (flame tendrils) ===
  // Left arm
  const leftUpperArm = new THREE.Mesh(
    new THREE.BoxGeometry(0.08 * s, 0.16 * s, 0.07 * s),
    innerFireMaterial
  );
  leftUpperArm.position.set(-0.16 * s, 0.5 * s, 0);
  leftUpperArm.rotation.z = 0.3;
  group.add(leftUpperArm);

  const leftLowerArm = new THREE.Mesh(
    new THREE.BoxGeometry(0.06 * s, 0.14 * s, 0.05 * s),
    outerFireMaterial
  );
  leftLowerArm.position.set(-0.22 * s, 0.36 * s, 0.02 * s);
  leftLowerArm.rotation.z = 0.2;
  group.add(leftLowerArm);

  // Left hand flames
  const leftHand = new THREE.Mesh(
    new THREE.SphereGeometry(0.05 * s, 6, 6),
    innerFireMaterial
  );
  leftHand.position.set(-0.26 * s, 0.26 * s, 0.03 * s);
  group.add(leftHand);

  // Left hand flame tendrils (fingers)
  const fingerGeo = new THREE.BoxGeometry(0.02 * s, 0.06 * s, 0.02 * s);
  for (let i = 0; i < 4; i++) {
    const finger = new THREE.Mesh(fingerGeo, outerFireMaterial);
    finger.position.set((-0.24 - i * 0.02) * s, 0.2 * s, 0.04 * s);
    finger.rotation.z = 0.1 * i;
    group.add(finger);
  }

  // Right arm
  const rightUpperArm = new THREE.Mesh(
    new THREE.BoxGeometry(0.08 * s, 0.16 * s, 0.07 * s),
    innerFireMaterial
  );
  rightUpperArm.position.set(0.16 * s, 0.5 * s, 0);
  rightUpperArm.rotation.z = -0.3;
  group.add(rightUpperArm);

  const rightLowerArm = new THREE.Mesh(
    new THREE.BoxGeometry(0.06 * s, 0.14 * s, 0.05 * s),
    outerFireMaterial
  );
  rightLowerArm.position.set(0.22 * s, 0.36 * s, 0.02 * s);
  rightLowerArm.rotation.z = -0.2;
  group.add(rightLowerArm);

  // Right hand flames
  const rightHand = new THREE.Mesh(
    new THREE.SphereGeometry(0.05 * s, 6, 6),
    innerFireMaterial
  );
  rightHand.position.set(0.26 * s, 0.26 * s, 0.03 * s);
  group.add(rightHand);

  // Right hand flame tendrils
  for (let i = 0; i < 4; i++) {
    const finger = new THREE.Mesh(fingerGeo, outerFireMaterial);
    finger.position.set((0.24 + i * 0.02) * s, 0.2 * s, 0.04 * s);
    finger.rotation.z = -0.1 * i;
    group.add(finger);
  }

  // === LOWER BODY (fading flame pillar) ===
  // Inner pillar
  const lowerInner = new THREE.Mesh(
    new THREE.BoxGeometry(0.14 * s, 0.2 * s, 0.12 * s),
    innerFireMaterial
  );
  lowerInner.position.y = 0.26 * s;
  group.add(lowerInner);

  // Outer pillar
  const lowerOuter = new THREE.Mesh(
    new THREE.BoxGeometry(0.18 * s, 0.22 * s, 0.14 * s),
    outerFireMaterial
  );
  lowerOuter.position.y = 0.26 * s;
  group.add(lowerOuter);

  // Edge flames
  const lowerEdge = new THREE.Mesh(
    new THREE.BoxGeometry(0.22 * s, 0.18 * s, 0.16 * s),
    edgeFireMaterial
  );
  lowerEdge.position.y = 0.2 * s;
  group.add(lowerEdge);

  // === BASE (scorch/ember pool) ===
  // Charred base
  const baseChar = new THREE.Mesh(
    new THREE.CylinderGeometry(0.18 * s, 0.22 * s, 0.04 * s, 8),
    emberMaterial
  );
  baseChar.position.y = 0.08 * s;
  group.add(baseChar);

  // Glowing ember ring
  const emberRing = new THREE.Mesh(
    new THREE.CylinderGeometry(0.2 * s, 0.25 * s, 0.02 * s, 8),
    new THREE.MeshStandardMaterial({
      color: 0xff4400,
      roughness: 0.6,
      metalness: 0.0,
      emissive: 0xff2200,
      emissiveIntensity: 0.6,
      transparent: true,
      opacity: 0.7,
    })
  );
  emberRing.position.y = 0.05 * s;
  group.add(emberRing);

  // Scorch marks (flat dark areas)
  const scorchGeo = new THREE.CylinderGeometry(0.28 * s, 0.3 * s, 0.01 * s, 8);
  const scorch = new THREE.Mesh(scorchGeo, new THREE.MeshStandardMaterial({
    color: 0x1a0a00,
    roughness: 0.95,
    metalness: 0.0,
  }));
  scorch.position.y = 0.02 * s;
  group.add(scorch);

  // === RISING FLAMES (ambient fire effect) ===
  const risingFlameGeo = new THREE.BoxGeometry(0.03 * s, 0.08 * s, 0.02 * s);
  const risingPositions = [
    { x: -0.08, y: 0.14, z: 0.1 },
    { x: 0.1, y: 0.12, z: 0.08 },
    { x: 0.06, y: 0.16, z: -0.08 },
    { x: -0.1, y: 0.13, z: -0.06 },
  ];

  risingPositions.forEach((pos) => {
    const flame = new THREE.Mesh(risingFlameGeo, edgeFireMaterial);
    flame.position.set(pos.x * s, pos.y * s, pos.z * s);
    group.add(flame);
  });

  return group;
}

export const FIRE_ELEMENTAL_META = {
  id: 'fire-elemental',
  name: 'Fire Elemental',
  category: 'enemy' as const,
  description: 'Humanoid shape composed entirely of roaring flames. Leaves scorch marks wherever it moves - canonical design',
  defaultScale: 1.0,
  boundingBox: { x: 0.6, y: 0.9, z: 0.4 },
  tags: ['elemental', 'fire', 'enemy', 'creature', 'monster', 'canonical'],
  enemyName: 'Fire Elemental',
};
