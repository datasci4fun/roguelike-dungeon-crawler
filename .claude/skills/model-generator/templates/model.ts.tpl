/**
 * {{MODEL_NAME}} Model
 * {{DESCRIPTION}}
 */

import * as THREE from 'three';
import { createMaterial } from './materials';

export interface {{MODEL_NAME}}Options {
  scale?: number;
  rotation?: number;
}

export function {{FACTORY_NAME}}(options: {{MODEL_NAME}}Options = {}): THREE.Group {
  const { scale = 1.0 } = options;

  const group = new THREE.Group();

  // Materials
  const primaryMaterial = createMaterial('{{PRIMARY_MATERIAL}}');

  // Geometry components
  // TODO: add meshes

  // Example component
  const bodyGeometry = new THREE.BoxGeometry(1 * scale, 1 * scale, 1 * scale);
  const body = new THREE.Mesh(bodyGeometry, primaryMaterial);
  body.position.y = 0.5 * scale;
  group.add(body);

  return group;
}

export const {{META_NAME}} = {
  id: '{{MODEL_ID}}',
  name: '{{DISPLAY_NAME}}',
  category: '{{CATEGORY}}' as const,
  description: '{{DESCRIPTION}}',
  defaultScale: 1.0,
  boundingBox: { x: 1.0, y: 1.0, z: 1.0 },
  tags: {{TAGS_JSON}},
  // Version fields (optional - uncomment if creating versioned model)
  // version: 1,
  // isActive: true,
  // baseModelId: '{{BASE_MODEL_ID}}',
};
