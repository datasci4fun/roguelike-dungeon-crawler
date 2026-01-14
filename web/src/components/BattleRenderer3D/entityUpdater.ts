/**
 * BattleRenderer3D Entity Updater
 *
 * Updates entity positions and handles entity lifecycle.
 */
import * as THREE from 'three';
import type { BattleState, BattleEntity } from '../../types';
import { getModelPathForEnemy } from '../../utils/enemyModels';
import { TILE_SIZE } from './constants';
import type { EntityAnimState } from './types';
import { createEntitySprite, createEntity3D } from './entityFactory';
import { modelCache } from './modelLoader';

/**
 * Update entity sprites based on current battle state
 * Supports smooth transitions by updating target positions
 */
export function updateEntities(
  group: THREE.Group,
  battle: BattleState,
  showPlayer: boolean = false,
  animMap?: Map<string, EntityAnimState>
) {
  const { arena_width, arena_height } = battle;

  // Debug logging
  console.log('[BattleRenderer3D] updateEntities called:', {
    showPlayer,
    enemyCount: battle.enemies.length,
    hasAnimMap: !!animMap,
    groupChildCount: group.children.length,
    enemies: battle.enemies.map(e => ({ id: e.entity_id, name: e.name, hp: e.hp, x: e.arena_x, y: e.arena_y }))
  });

  // If no animation map provided, fall back to simple mode (clear and recreate)
  if (!animMap) {
    // Clear existing entities
    while (group.children.length > 0) {
      const child = group.children[0];
      group.remove(child);
      child.traverse((obj) => {
        if (obj instanceof THREE.Sprite) {
          obj.material.map?.dispose();
          obj.material.dispose();
        }
      });
    }

    // Only add player during overview (showPlayer = true)
    if (showPlayer && battle.player) {
      const playerSprite = createEntitySprite(battle.player as BattleEntity, true);
      const px = (battle.player.arena_x - arena_width / 2) * TILE_SIZE;
      const pz = (battle.player.arena_y - arena_height / 2) * TILE_SIZE;
      playerSprite.position.set(px, 0, pz);
      group.add(playerSprite);
    }

    // Add enemies (use 3D models if available)
    for (const enemy of battle.enemies) {
      if (enemy.hp > 0) {
        const enemyEntity = createEntity3D(enemy, false);
        const ex = (enemy.arena_x - arena_width / 2) * TILE_SIZE;
        const ez = (enemy.arena_y - arena_height / 2) * TILE_SIZE;
        enemyEntity.position.set(ex, 0, ez);
        group.add(enemyEntity);
      }
    }
    return;
  }

  // Smart mode: update targets and handle sprite lifecycle
  const currentIds = new Set<string>();

  // Handle player
  const playerId = 'player';
  if (showPlayer && battle.player) {
    currentIds.add(playerId);
    const px = (battle.player.arena_x - arena_width / 2) * TILE_SIZE;
    const pz = (battle.player.arena_y - arena_height / 2) * TILE_SIZE;

    const existing = animMap.get(playerId);
    if (existing) {
      // Update target position
      existing.targetX = px;
      existing.targetZ = pz;
      // Recreate sprite if HP changed
      if (existing.lastHp !== battle.player.hp) {
        group.remove(existing.sprite);
        existing.sprite.traverse((obj) => {
          if (obj instanceof THREE.Sprite) {
            obj.material.map?.dispose();
            obj.material.dispose();
          }
        });
        const newSprite = createEntitySprite(battle.player as BattleEntity, true);
        newSprite.position.set(existing.currentX, 0, existing.currentZ);
        group.add(newSprite);
        existing.sprite = newSprite;
        existing.lastHp = battle.player.hp;
      }
    } else {
      // New entity - create sprite at target position
      const sprite = createEntitySprite(battle.player as BattleEntity, true);
      sprite.position.set(px, 0, pz);
      group.add(sprite);
      animMap.set(playerId, {
        sprite,
        currentX: px,
        currentZ: pz,
        targetX: px,
        targetZ: pz,
        lastHp: battle.player.hp,
      });
    }
  }

  // Handle enemies
  for (const enemy of battle.enemies) {
    if (enemy.hp > 0) {
      const enemyId = enemy.entity_id;
      currentIds.add(enemyId);
      const ex = (enemy.arena_x - arena_width / 2) * TILE_SIZE;
      const ez = (enemy.arena_y - arena_height / 2) * TILE_SIZE;

      const existing = animMap.get(enemyId);
      if (existing) {
        // Update target position
        existing.targetX = ex;
        existing.targetZ = ez;

        // Check if we need to recreate: HP changed OR model now available but using sprite
        const modelPath = enemy.name ? getModelPathForEnemy(enemy.name) : null;
        const modelNowAvailable = modelPath && modelCache.has(modelPath);
        let hasModel = false;
        existing.sprite.traverse((child) => {
          if (child.name === 'entityModel') hasModel = true;
        });
        const needsModelUpgrade = modelNowAvailable && !hasModel;

        if (existing.lastHp !== enemy.hp || needsModelUpgrade) {
          group.remove(existing.sprite);
          existing.sprite.traverse((obj) => {
            if (obj instanceof THREE.Sprite) {
              obj.material.map?.dispose();
              obj.material.dispose();
            }
          });
          const newEntity = createEntity3D(enemy, false);
          newEntity.position.set(existing.currentX, 0, existing.currentZ);
          group.add(newEntity);
          existing.sprite = newEntity;
          existing.lastHp = enemy.hp;
          if (needsModelUpgrade) {
            console.log('[BattleRenderer3D] Upgraded entity to 3D model:', enemy.name);
          }
        }
      } else {
        // New entity - create at target position (use 3D model if available)
        const entity = createEntity3D(enemy, false);
        entity.position.set(ex, 0, ez);
        group.add(entity);
        animMap.set(enemyId, {
          sprite: entity,
          currentX: ex,
          currentZ: ez,
          targetX: ex,
          targetZ: ez,
          lastHp: enemy.hp,
        });
      }
    }
  }

  // Remove entities that are no longer present
  const entriesToRemove: string[] = [];
  animMap.forEach((anim, id) => {
    if (!currentIds.has(id)) {
      group.remove(anim.sprite);
      anim.sprite.traverse((obj) => {
        if (obj instanceof THREE.Sprite) {
          obj.material.map?.dispose();
          obj.material.dispose();
        }
      });
      entriesToRemove.push(id);
    }
  });
  entriesToRemove.forEach(id => animMap.delete(id));
}
