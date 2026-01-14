/**
 * BattleRenderer3D Model Loader
 *
 * Handles loading and caching of 3D GLB models for entities.
 */
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import type { BattleEntity } from '../../types';
import { getModelPathForEnemy } from '../../utils/enemyModels';
import { ENTITY_MODEL_SCALE, ENTITY_MODEL_Y_OFFSET } from './constants';

// 3D Model cache - stores loaded GLB models for reuse
export const modelCache = new Map<string, THREE.Group>();
const modelLoadingPromises = new Map<string, Promise<THREE.Group | null>>();
const gltfLoader = new GLTFLoader();

/**
 * Load a 3D model with caching
 * Returns null if model doesn't exist or fails to load
 */
export async function loadEntityModel(modelPath: string): Promise<THREE.Group | null> {
  // Check cache first
  if (modelCache.has(modelPath)) {
    return modelCache.get(modelPath)!.clone();
  }

  // Check if already loading
  if (modelLoadingPromises.has(modelPath)) {
    const cached = await modelLoadingPromises.get(modelPath);
    return cached ? cached.clone() : null;
  }

  // Start loading
  const loadPromise = new Promise<THREE.Group | null>((resolve) => {
    gltfLoader.load(
      modelPath,
      (gltf) => {
        const model = gltf.scene;

        // Apply materials for vertex colors (TripoSR models use vertex colors)
        model.traverse((child) => {
          if (child instanceof THREE.Mesh) {
            if (child.geometry.attributes.color) {
              child.material = new THREE.MeshStandardMaterial({
                vertexColors: true,
                metalness: 0.1,
                roughness: 0.8,
                side: THREE.DoubleSide,
              });
            } else if (child.material) {
              (child.material as THREE.Material).side = THREE.DoubleSide;
            }
          }
        });

        // Center and scale model to fit arena tile
        const box = new THREE.Box3().setFromObject(model);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.y, size.z);

        if (maxDim > 0) {
          const scale = ENTITY_MODEL_SCALE / maxDim;
          model.scale.setScalar(scale);
          // Center horizontally, place on ground
          model.position.set(
            -center.x * scale,
            -box.min.y * scale + ENTITY_MODEL_Y_OFFSET,
            -center.z * scale
          );
          // Fix model orientation (TripoSR models may have Z-up)
          model.rotation.x = -Math.PI / 2; // Stand upright
          model.rotation.z = 0; // Face the player
        }

        // Cache the original for future clones
        modelCache.set(modelPath, model.clone());
        resolve(model);
      },
      undefined,
      () => {
        // Model failed to load - cache null to avoid retrying
        resolve(null);
      }
    );
  });

  modelLoadingPromises.set(modelPath, loadPromise);
  return loadPromise;
}

/**
 * Preload models for enemies in the battle
 */
export async function preloadBattleModels(enemies: BattleEntity[]): Promise<void> {
  const uniqueNames = new Set(enemies.map(e => e.name).filter((n): n is string => !!n));
  const loadPromises: Promise<unknown>[] = [];

  for (const name of uniqueNames) {
    const modelPath = getModelPathForEnemy(name);
    if (modelPath && !modelCache.has(modelPath)) {
      loadPromises.push(loadEntityModel(modelPath));
    }
  }

  await Promise.all(loadPromises);
}
