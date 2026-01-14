/**
 * BattleRenderer3D Camera Controller
 *
 * Handles camera positioning for overview phases and first-person gameplay.
 */
import * as THREE from 'three';
import type { BattleState } from '../../types';
import { TILE_SIZE, CAMERA_HEIGHT, PHASE_DURATIONS } from './constants';
import type { OverviewPhase } from './types';

/**
 * Easing function for smooth camera transitions
 */
export function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

/**
 * Update camera position based on overview phase
 * v6.5: Added shakeX/shakeY for camera shake effect
 * v6.9: Added lerped camera position for smooth player movement
 */
export function updateCamera(
  camera: THREE.PerspectiveCamera,
  battle: BattleState,
  phase: OverviewPhase,
  phaseStartTime: number,
  yaw: number = 0,
  pitch: number = 0,
  shakeX: number = 0,
  shakeY: number = 0,
  lerpedX?: number,
  lerpedZ?: number
) {
  const { arena_width, arena_height } = battle;
  const centerX = 0;
  const centerZ = 0;

  const elapsed = Date.now() - phaseStartTime;

  if (phase === 'complete') {
    // First-person at player position with mouse look
    if (battle.player) {
      // Use lerped position if provided, otherwise calculate directly
      const px = lerpedX ?? (battle.player.arena_x - arena_width / 2) * TILE_SIZE;
      const pz = lerpedZ ?? (battle.player.arena_y - arena_height / 2) * TILE_SIZE;

      // v6.5: Apply camera shake offset
      camera.position.set(px + shakeX, CAMERA_HEIGHT + shakeY, pz);

      // Apply yaw (horizontal rotation) and pitch (vertical rotation)
      const lookDistance = 5;
      const lookX = px + Math.sin(yaw) * lookDistance;
      const lookY = CAMERA_HEIGHT + pitch * lookDistance;
      const lookZ = pz - Math.cos(yaw) * lookDistance;

      camera.lookAt(lookX, lookY, lookZ);
    }
    return;
  }

  // Overview phases
  const duration = PHASE_DURATIONS[phase] || 500;
  const t = Math.min(1, elapsed / duration);
  const eased = easeInOutCubic(t);

  switch (phase) {
    case 'zoom_out':
      // Start from player, zoom out and up
      if (battle.player) {
        const px = (battle.player.arena_x - arena_width / 2) * TILE_SIZE;
        const pz = (battle.player.arena_y - arena_height / 2) * TILE_SIZE;
        const height = CAMERA_HEIGHT + eased * 10;
        const pullBack = eased * 8;
        camera.position.set(px, height, pz + pullBack);
        camera.lookAt(centerX, 0, centerZ);
      }
      break;

    case 'pan_enemies':
      // Pan to show enemy spawn area (top of arena)
      {
        const enemyZ = (-arena_height / 2 + 2) * TILE_SIZE;
        camera.position.set(centerX, 10, centerZ + 5);
        camera.lookAt(centerX, 0, enemyZ);
      }
      break;

    case 'pan_player':
      // Pan back to player area
      if (battle.player) {
        const px = (battle.player.arena_x - arena_width / 2) * TILE_SIZE;
        const pz = (battle.player.arena_y - arena_height / 2) * TILE_SIZE;
        camera.position.set(px, 8 - eased * 5, pz + 5 - eased * 3);
        camera.lookAt(px, 0, pz);
      }
      break;

    case 'settle':
      // Settle into first-person
      if (battle.player) {
        const px = (battle.player.arena_x - arena_width / 2) * TILE_SIZE;
        const pz = (battle.player.arena_y - arena_height / 2) * TILE_SIZE;
        const height = 3 + (CAMERA_HEIGHT - 3) * eased;
        camera.position.set(px, height, pz + 2 - eased * 1.5);
        camera.lookAt(px, CAMERA_HEIGHT, pz - 5);
      }
      break;
  }
}
