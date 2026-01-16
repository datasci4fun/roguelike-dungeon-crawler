/**
 * Standard material presets for 3D models
 * Used by the model library for consistent appearance
 */

import * as THREE from 'three';

export interface MaterialPreset {
  color: number;
  roughness: number;
  metalness: number;
  emissive?: number;
  emissiveIntensity?: number;
}

/**
 * Material presets organized by type
 */
export const MATERIAL_PRESETS: Record<string, MaterialPreset> = {
  // Wood materials
  wood: { color: 0x8b4513, roughness: 0.8, metalness: 0.1 },
  darkWood: { color: 0x2a1a0a, roughness: 0.8, metalness: 0.2 },
  lightWood: { color: 0xdeb887, roughness: 0.75, metalness: 0.05 },
  oldWood: { color: 0x4a3520, roughness: 0.9, metalness: 0.1 },

  // Stone materials
  stone: { color: 0x808080, roughness: 0.9, metalness: 0.0 },
  darkStone: { color: 0x404040, roughness: 0.85, metalness: 0.05 },
  lightStone: { color: 0xc0c0c0, roughness: 0.8, metalness: 0.0 },
  marble: { color: 0xf0f0f0, roughness: 0.3, metalness: 0.1 },
  granite: { color: 0x666666, roughness: 0.7, metalness: 0.1 },

  // Metal materials
  iron: { color: 0x3a3a3a, roughness: 0.4, metalness: 0.8 },
  steel: { color: 0x888888, roughness: 0.3, metalness: 0.8 },
  bronze: { color: 0xcd7f32, roughness: 0.4, metalness: 0.7 },
  gold: { color: 0xffd700, roughness: 0.2, metalness: 0.9 },
  silver: { color: 0xc0c0c0, roughness: 0.25, metalness: 0.85 },
  copper: { color: 0xb87333, roughness: 0.45, metalness: 0.75 },
  rust: { color: 0x8b4513, roughness: 0.8, metalness: 0.4 },

  // Fabric materials
  cloth: { color: 0x8b0000, roughness: 0.95, metalness: 0.0 },
  leather: { color: 0x654321, roughness: 0.8, metalness: 0.05 },
  silk: { color: 0xdaa520, roughness: 0.4, metalness: 0.1 },

  // Special materials
  crystal: { color: 0x87ceeb, roughness: 0.1, metalness: 0.3 },
  gem: { color: 0xff0000, roughness: 0.05, metalness: 0.2 },
  bone: { color: 0xf5f5dc, roughness: 0.7, metalness: 0.0 },
  obsidian: { color: 0x1a1a1a, roughness: 0.15, metalness: 0.2 },

  // Environment materials
  grass: { color: 0x228b22, roughness: 0.9, metalness: 0.0 },
  sand: { color: 0xf4a460, roughness: 0.95, metalness: 0.0 },
  ice: { color: 0xadd8e6, roughness: 0.1, metalness: 0.1 },
  lava: { color: 0xff4500, roughness: 0.6, metalness: 0.2, emissive: 0xff2200, emissiveIntensity: 0.8 },
  water: { color: 0x1e90ff, roughness: 0.1, metalness: 0.2 },
};

/**
 * Create a THREE.MeshStandardMaterial from a preset name
 */
export function createMaterial(presetName: keyof typeof MATERIAL_PRESETS): THREE.MeshStandardMaterial {
  const preset = MATERIAL_PRESETS[presetName];
  if (!preset) {
    console.warn(`Unknown material preset: ${presetName}, using stone`);
    return createMaterial('stone');
  }

  const material = new THREE.MeshStandardMaterial({
    color: preset.color,
    roughness: preset.roughness,
    metalness: preset.metalness,
  });

  if (preset.emissive !== undefined) {
    material.emissive = new THREE.Color(preset.emissive);
    material.emissiveIntensity = preset.emissiveIntensity ?? 0.5;
  }

  return material;
}

/**
 * Create a material with custom color but preset properties
 */
export function createMaterialWithColor(
  presetName: keyof typeof MATERIAL_PRESETS,
  color: number
): THREE.MeshStandardMaterial {
  const preset = MATERIAL_PRESETS[presetName];
  if (!preset) {
    return new THREE.MeshStandardMaterial({ color, roughness: 0.5, metalness: 0.5 });
  }

  return new THREE.MeshStandardMaterial({
    color,
    roughness: preset.roughness,
    metalness: preset.metalness,
  });
}
