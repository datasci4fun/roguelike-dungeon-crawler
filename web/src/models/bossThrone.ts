/**
 * Boss Throne Model
 * An ornate throne fit for a dungeon boss
 */

import * as THREE from 'three';
import { createMaterial } from './materials';

export interface BossThroneOptions {
  scale?: number;
  rotation?: number;
  woodColor?: number;
  accentColor?: number;
}

export function createBossThrone(options: BossThroneOptions = {}): THREE.Group {
  const { scale = 1.0, woodColor, accentColor } = options;

  const group = new THREE.Group();

  // Main throne material
  const throneMaterial = woodColor
    ? new THREE.MeshStandardMaterial({ color: woodColor, roughness: 0.6, metalness: 0.3 })
    : new THREE.MeshStandardMaterial({ color: 0x4a2a0a, roughness: 0.6, metalness: 0.3 });

  // Accent material for decorations
  const accentMaterial = accentColor
    ? new THREE.MeshStandardMaterial({ color: accentColor, roughness: 0.3, metalness: 0.7 })
    : createMaterial('gold');

  // Seat
  const seatGeometry = new THREE.BoxGeometry(0.6 * scale, 0.4 * scale, 0.5 * scale);
  const seat = new THREE.Mesh(seatGeometry, throneMaterial);
  seat.position.set(0, 0.3 * scale, 0);
  group.add(seat);

  // Back
  const backGeometry = new THREE.BoxGeometry(0.6 * scale, 1.2 * scale, 0.1 * scale);
  const back = new THREE.Mesh(backGeometry, throneMaterial);
  back.position.set(0, 0.9 * scale, -0.2 * scale);
  group.add(back);

  // Armrests
  const armrestGeometry = new THREE.BoxGeometry(0.1 * scale, 0.3 * scale, 0.4 * scale);

  const leftArmrest = new THREE.Mesh(armrestGeometry, throneMaterial);
  leftArmrest.position.set(-0.35 * scale, 0.45 * scale, 0.05 * scale);
  group.add(leftArmrest);

  const rightArmrest = new THREE.Mesh(armrestGeometry, throneMaterial);
  rightArmrest.position.set(0.35 * scale, 0.45 * scale, 0.05 * scale);
  group.add(rightArmrest);

  // Crown ornament on back
  const crownGeometry = new THREE.ConeGeometry(0.08 * scale, 0.2 * scale, 5);
  for (let i = 0; i < 5; i++) {
    const spike = new THREE.Mesh(crownGeometry, accentMaterial);
    const angle = (i - 2) * 0.15;
    spike.position.set(angle * scale, 1.6 * scale, -0.2 * scale);
    group.add(spike);
  }

  return group;
}

export const BOSS_THRONE_META = {
  id: 'boss_throne',
  name: 'Boss Throne',
  category: 'furniture' as const,
  description: 'An ornate throne fit for a dungeon boss',
  defaultScale: 1.0,
  boundingBox: { x: 0.8, y: 1.8, z: 0.5 },
  tags: ['throne', 'boss', 'furniture', 'seat'],
};
