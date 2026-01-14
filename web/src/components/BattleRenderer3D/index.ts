/**
 * BattleRenderer3D Module
 *
 * 3D battle arena renderer using Three.js
 */

// Main component
export { default as BattleRenderer3D } from './BattleRenderer3D';

// Types (for external use)
export type {
  BattleRenderer3DProps,
  GameEvent,
  OverviewPhase,
} from './types';

// Utilities that might be needed externally
export { preloadBattleModels } from './modelLoader';
