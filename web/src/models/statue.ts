/**
 * Statue Model
 * A humanoid statue for decoration
 */

import * as THREE from 'three';
import { createMaterial } from './materials';

export interface StatueOptions {
  scale?: number;
  rotation?: number;
  stoneColor?: number;
  hasWeapon?: boolean;
  hasShield?: boolean;
}

export function createStatue(options: StatueOptions = {}): THREE.Group {
  const {
    scale = 1.0,
    stoneColor,
    hasWeapon = false,
    hasShield = false,
  } = options;

  const group = new THREE.Group();

  const statueMaterial = stoneColor
    ? new THREE.MeshStandardMaterial({ color: stoneColor, roughness: 0.5, metalness: 0.2 })
    : createMaterial('stone');

  // Pedestal
  const pedestalGeometry = new THREE.BoxGeometry(0.4 * scale, 0.1 * scale, 0.4 * scale);
  const pedestal = new THREE.Mesh(pedestalGeometry, statueMaterial);
  pedestal.position.set(0, 0.05 * scale, 0);
  group.add(pedestal);

  // Legs
  const legGeometry = new THREE.CylinderGeometry(0.06 * scale, 0.07 * scale, 0.4 * scale, 6);

  const leftLeg = new THREE.Mesh(legGeometry, statueMaterial);
  leftLeg.position.set(-0.08 * scale, 0.3 * scale, 0);
  group.add(leftLeg);

  const rightLeg = new THREE.Mesh(legGeometry, statueMaterial);
  rightLeg.position.set(0.08 * scale, 0.3 * scale, 0);
  group.add(rightLeg);

  // Body/torso
  const bodyGeometry = new THREE.BoxGeometry(0.3 * scale, 0.5 * scale, 0.2 * scale);
  const body = new THREE.Mesh(bodyGeometry, statueMaterial);
  body.position.set(0, 0.75 * scale, 0);
  group.add(body);

  // Arms
  const armGeometry = new THREE.CylinderGeometry(0.04 * scale, 0.05 * scale, 0.35 * scale, 6);

  const leftArm = new THREE.Mesh(armGeometry, statueMaterial);
  leftArm.position.set(-0.2 * scale, 0.7 * scale, 0);
  leftArm.rotation.z = 0.3;
  group.add(leftArm);

  const rightArm = new THREE.Mesh(armGeometry, statueMaterial);
  rightArm.position.set(0.2 * scale, 0.7 * scale, 0);
  rightArm.rotation.z = -0.3;
  group.add(rightArm);

  // Head
  const headGeometry = new THREE.SphereGeometry(0.12 * scale, 8, 8);
  const head = new THREE.Mesh(headGeometry, statueMaterial);
  head.position.set(0, 1.12 * scale, 0);
  group.add(head);

  // Optional weapon (sword)
  if (hasWeapon) {
    const bladeGeometry = new THREE.BoxGeometry(0.03 * scale, 0.5 * scale, 0.01 * scale);
    const blade = new THREE.Mesh(bladeGeometry, statueMaterial);
    blade.position.set(0.28 * scale, 0.8 * scale, 0);
    blade.rotation.z = -0.5;
    group.add(blade);

    const hiltGeometry = new THREE.BoxGeometry(0.08 * scale, 0.03 * scale, 0.03 * scale);
    const hilt = new THREE.Mesh(hiltGeometry, statueMaterial);
    hilt.position.set(0.22 * scale, 0.58 * scale, 0);
    hilt.rotation.z = -0.5;
    group.add(hilt);
  }

  // Optional shield
  if (hasShield) {
    const shieldGeometry = new THREE.BoxGeometry(0.02 * scale, 0.25 * scale, 0.18 * scale);
    const shield = new THREE.Mesh(shieldGeometry, statueMaterial);
    shield.position.set(-0.25 * scale, 0.7 * scale, 0.05 * scale);
    shield.rotation.y = 0.2;
    group.add(shield);
  }

  return group;
}

export const STATUE_META = {
  id: 'statue',
  name: 'Humanoid Statue',
  category: 'decoration' as const,
  description: 'A humanoid statue for decoration',
  defaultScale: 1.0,
  boundingBox: { x: 0.4, y: 1.25, z: 0.4 },
  tags: ['statue', 'stone', 'decoration', 'humanoid'],
};
