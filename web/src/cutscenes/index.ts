/**
 * Cutscenes Module
 * Main entry point for the cutscene system
 */

// Engine exports
export * from './engine';

// Catalog
export { cutsceneCatalog, getCutscene, listCutscenes } from './catalog';

// Individual cutscenes
export { introCutscene } from './intro';
export { victoryCutscene, createVictoryCutscene } from './victory';
export { gameOverCutscene, createGameOverCutscene } from './game_over';
