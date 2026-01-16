/**
 * Pillar Model
 * A stone pillar/column for structural decoration
 */

import * as THREE from 'three';
import { createMaterial } from './materials';

export interface PillarOptions {
  scale?: number;
  rotation?: number;
  height?: number;
  stoneColor?: number;
  collapsed?: boolean;
}

export function createPillar(options: PillarOptions = {}): THREE.Group {
  const {
    scale = 1.0,
    height = 2.5,
    stoneColor,
    collapsed = false,
  } = options;

  const group = new THREE.Group();

  const pillarMaterial = stoneColor
    ? new THREE.MeshStandardMaterial({ color: stoneColor, roughness: 0.7, metalness: 0.1 })
    : createMaterial('granite');

  if (collapsed) {
    // Collapsed pillar - broken pieces
    const baseGeometry = new THREE.CylinderGeometry(
      0.18 * scale,
      0.2 * scale,
      0.5 * scale,
      8
    );
    const base = new THREE.Mesh(baseGeometry, pillarMaterial);
    base.position.set(0, 0.25 * scale, 0);
    group.add(base);

    // Fallen section
    const fallenGeometry = new THREE.CylinderGeometry(
      0.15 * scale,
      0.18 * scale,
      1.2 * scale,
      8
    );
    const fallen = new THREE.Mesh(fallenGeometry, pillarMaterial);
    fallen.position.set(0.4 * scale, 0.15 * scale, 0.2 * scale);
    fallen.rotation.z = Math.PI / 2.5;
    group.add(fallen);

    // Rubble pieces
    const rubbleGeometry = new THREE.BoxGeometry(0.15 * scale, 0.1 * scale, 0.12 * scale);
    for (let i = 0; i < 3; i++) {
      const rubble = new THREE.Mesh(rubbleGeometry, pillarMaterial);
      rubble.position.set(
        (Math.random() - 0.5) * 0.6 * scale,
        0.05 * scale,
        (Math.random() - 0.5) * 0.6 * scale
      );
      rubble.rotation.set(
        Math.random() * 0.5,
        Math.random() * Math.PI * 2,
        Math.random() * 0.5
      );
      group.add(rubble);
    }
  } else {
    // Standing pillar with base and capital
    const actualHeight = height * scale;

    // Base (wider at bottom)
    const baseGeometry = new THREE.CylinderGeometry(
      0.18 * scale,
      0.22 * scale,
      0.15 * scale,
      8
    );
    const base = new THREE.Mesh(baseGeometry, pillarMaterial);
    base.position.set(0, 0.075 * scale, 0);
    group.add(base);

    // Main shaft
    const shaftGeometry = new THREE.CylinderGeometry(
      0.15 * scale,
      0.18 * scale,
      actualHeight - 0.3 * scale,
      8
    );
    const shaft = new THREE.Mesh(shaftGeometry, pillarMaterial);
    shaft.position.set(0, actualHeight / 2, 0);
    group.add(shaft);

    // Capital (top decoration)
    const capitalGeometry = new THREE.CylinderGeometry(
      0.22 * scale,
      0.15 * scale,
      0.15 * scale,
      8
    );
    const capital = new THREE.Mesh(capitalGeometry, pillarMaterial);
    capital.position.set(0, actualHeight - 0.075 * scale, 0);
    group.add(capital);
  }

  return group;
}

export const PILLAR_META = {
  id: 'pillar',
  name: 'Stone Pillar',
  category: 'structure' as const,
  description: 'A stone pillar/column for structural decoration',
  defaultScale: 1.0,
  boundingBox: { x: 0.44, y: 2.5, z: 0.44 },
  tags: ['pillar', 'column', 'stone', 'structure'],
};

export const COLLAPSED_PILLAR_META = {
  id: 'collapsed_pillar',
  name: 'Collapsed Pillar',
  category: 'structure' as const,
  description: 'A broken pillar with rubble',
  defaultScale: 1.0,
  boundingBox: { x: 1.0, y: 0.5, z: 0.6 },
  tags: ['pillar', 'rubble', 'ruins', 'structure'],
};
