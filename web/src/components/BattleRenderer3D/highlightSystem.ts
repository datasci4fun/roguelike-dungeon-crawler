/**
 * BattleRenderer3D Highlight System
 *
 * Manages tile highlights for actions (move, attack, abilities).
 */
import * as THREE from 'three';
import type { BattleState } from '../../types';
import { TILE_SIZE, HIGHLIGHT_COLORS, ACTION_RANGES, getSharedGeometries } from './constants';

/**
 * Update highlight tiles based on selected action and player position
 */
export function updateHighlights(
  group: THREE.Group,
  battle: BattleState,
  selectedAction: string | null | undefined,
  overviewComplete: boolean
) {
  // v6.5.1 Performance: Clear existing highlights (only dispose materials, not shared geometry)
  while (group.children.length > 0) {
    const child = group.children[0];
    group.remove(child);
    if (child instanceof THREE.Mesh) {
      // Don't dispose geometry - it's shared
      (child.material as THREE.Material).dispose();
    }
  }

  // Don't show highlights during overview or if no action selected
  if (!overviewComplete || !selectedAction || !battle.player) {
    return;
  }

  const { arena_width, arena_height, arena_tiles } = battle;
  const playerX = battle.player.arena_x;
  const playerY = battle.player.arena_y;

  const range = ACTION_RANGES[selectedAction] || 1;
  const isAttack = selectedAction === 'attack';
  const isAbility = selectedAction.startsWith('ability');
  const highlightColor = isAttack ? HIGHLIGHT_COLORS.attack :
                         isAbility ? HIGHLIGHT_COLORS.ability :
                         HIGHLIGHT_COLORS.move;

  // v6.5.1 Performance: Get shared geometry for all highlights
  const sharedGeo = getSharedGeometries();

  // Find tiles within range
  for (let dy = -range; dy <= range; dy++) {
    for (let dx = -range; dx <= range; dx++) {
      // Skip player's own tile for movement
      if (dx === 0 && dy === 0 && selectedAction === 'move') continue;

      const tx = playerX + dx;
      const ty = playerY + dy;

      // Check bounds
      if (tx < 0 || tx >= arena_width || ty < 0 || ty >= arena_height) continue;

      // Check if tile is walkable (not a wall)
      const tile = arena_tiles[ty]?.[tx] || '.';
      if (tile === '#') continue;

      // For movement, check Manhattan distance = 1
      if (selectedAction === 'move' && (Math.abs(dx) + Math.abs(dy)) !== 1) continue;

      // For attacks/abilities, check if enemy is present
      if (isAttack || isAbility) {
        const hasEnemy = battle.enemies.some(
          e => e.hp > 0 && e.arena_x === tx && e.arena_y === ty
        );
        // Only highlight tiles with enemies for attacks
        if (isAttack && !hasEnemy) continue;
      }

      // Create highlight plane using shared geometry
      const worldX = (tx - arena_width / 2) * TILE_SIZE;
      const worldZ = (ty - arena_height / 2) * TILE_SIZE;

      const highlightMaterial = new THREE.MeshBasicMaterial({
        color: highlightColor,
        transparent: true,
        opacity: 0.4,
        side: THREE.DoubleSide,
      });

      const highlight = new THREE.Mesh(sharedGeo.highlightPlane, highlightMaterial);
      highlight.rotation.x = -Math.PI / 2;
      highlight.position.set(worldX, 0.03, worldZ);
      group.add(highlight);
    }
  }
}
