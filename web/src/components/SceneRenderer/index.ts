/**
 * SceneRenderer Component Exports
 *
 * Canvas-based layered renderer for the roguelike game.
 */

export { SceneRenderer, default } from './SceneRenderer';
export { FirstPersonRenderer } from './FirstPersonRenderer';
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
