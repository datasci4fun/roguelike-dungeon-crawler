/**
 * Cutscene Catalog
 * Central registry for all available cutscenes
 */

import type { CutsceneConfig } from './engine/types';
import { introCutscene } from './intro';
import { victoryCutscene } from './victory';
import { gameOverCutscene } from './game_over';

// Registry of all cutscenes by ID
export const cutsceneCatalog: Record<string, CutsceneConfig> = {
  intro: introCutscene,
  victory: victoryCutscene,
  game_over: gameOverCutscene,
};

// Helper to get a cutscene by ID
export function getCutscene(id: string): CutsceneConfig | undefined {
  return cutsceneCatalog[id];
}

// List all available cutscene IDs
export function listCutscenes(): string[] {
  return Object.keys(cutsceneCatalog);
}

// Direct exports for convenience
export { introCutscene, victoryCutscene, gameOverCutscene };
