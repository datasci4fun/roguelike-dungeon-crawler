/**
 * SceneRenderer Component Exports
 *
 * Canvas-based layered renderer for the roguelike game.
 */

export { SceneRenderer, default } from './SceneRenderer';
export { FirstPersonRenderer, type RenderSettings, type CorridorInfoEntry } from './FirstPersonRenderer';
export { FirstPersonRenderer3D } from './FirstPersonRenderer3D';
export { BIOMES, getBiome, type BiomeTheme, type BiomeId } from './biomes';
export { useSceneFrame, gameStateToSceneFrame } from './useSceneRenderer';
export { SpriteManager } from './SpriteManager';
export * from './animations';
export {
  RenderLayers,
  PlaceholderColors,
  type SceneFrame,
  type SceneEntity,
  type SceneTile,
  type TileType,
  type EntityKind,
  type StatusEffect,
  type Anchor,
  type LightLevel,
} from './types';
