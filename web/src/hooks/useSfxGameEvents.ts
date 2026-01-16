/**
 * Hook that triggers sound effects based on game state changes.
 * Compares previous and current state to detect events.
 */

import { useEffect, useRef } from 'react';
import { useSoundEffect } from './useSoundEffect';
import type { FullGameState } from './useGameSocket';

interface PrevState {
  health: number;
  level: number;
  xp: number;
  dungeonLevel: number;
  enemyCount: number;
  itemCount: number;
  gold: number;
  inventoryCount: number;
  gameState: string;
  uiMode: string;
}

export function useSfxGameEvents(gameState: FullGameState | null) {
  const { play } = useSoundEffect();
  const prevStateRef = useRef<PrevState | null>(null);

  useEffect(() => {
    if (!gameState?.player) {
      prevStateRef.current = null;
      return;
    }

    const { player, dungeon, enemies, items } = gameState;
    const currentState: PrevState = {
      health: player.health,
      level: player.level,
      xp: player.xp,
      dungeonLevel: dungeon?.level ?? 1,
      enemyCount: enemies?.length ?? 0,
      itemCount: items?.length ?? 0,
      gold: (player as { gold?: number }).gold ?? 0,
      inventoryCount: gameState.inventory?.items?.length ?? 0,
      gameState: gameState.game_state,
      uiMode: gameState.ui_mode ?? 'GAME',
    };

    const prev = prevStateRef.current;

    if (prev) {
      // Level up
      if (currentState.level > prev.level) {
        play('level_up');
      }
      // XP gain (without level up)
      else if (currentState.xp > prev.xp) {
        // Small sound for XP gain (covered by other events usually)
      }

      // Player took damage
      if (currentState.health < prev.health) {
        play('player_hurt');
      }
      // Player healed (potion)
      else if (currentState.health > prev.health && currentState.level === prev.level) {
        play('potion_drink');
      }

      // Enemy killed (enemy count decreased)
      if (currentState.enemyCount < prev.enemyCount) {
        play('enemy_death');
      }

      // Descended stairs
      if (currentState.dungeonLevel > prev.dungeonLevel) {
        play('stairs_descend');
      }

      // Gold picked up
      if (currentState.gold > prev.gold) {
        play('gold_pickup');
      }

      // Item picked up (inventory increased)
      if (currentState.inventoryCount > prev.inventoryCount) {
        play('item_pickup');
      }

      // Item on ground picked up (ground items decreased, not from enemy death)
      if (currentState.itemCount < prev.itemCount && currentState.enemyCount === prev.enemyCount) {
        // Already covered by inventory increase
      }

      // UI mode changes
      if (currentState.uiMode !== prev.uiMode) {
        if (currentState.uiMode === 'INVENTORY') {
          play('menu_select');
        } else if (prev.uiMode === 'INVENTORY' && currentState.uiMode === 'GAME') {
          play('menu_back');
        }
      }

      // Game state changes
      if (currentState.gameState !== prev.gameState) {
        if (currentState.gameState === 'VICTORY') {
          play('level_up'); // Victory fanfare
        } else if (currentState.gameState === 'DEAD') {
          play('player_hurt');
        }
      }
    }

    prevStateRef.current = currentState;
  }, [gameState, play]);
}

// Simple hook to play UI sounds on command
export function useSfxCommands() {
  const { play } = useSoundEffect();

  return {
    playMove: () => play('footstep'),
    playBump: () => play('bump_wall'),
    playAttackHit: () => play('attack_hit'),
    playAttackMiss: () => play('attack_miss'),
    playMenuSelect: () => play('menu_select'),
    playMenuConfirm: () => play('menu_confirm'),
    playMenuBack: () => play('menu_back'),
    playAbilityUse: () => play('ability_use'),
    playFeatUnlock: () => play('feat_unlock'),
    // Interaction sounds (v7.0)
    playSwitchFlip: () => play('switch_flip'),
    playLeverPull: () => play('lever_pull'),
    playMuralExamine: () => play('mural_examine'),
    playInscriptionRead: () => play('inscription_read'),
    playPuzzleSolve: () => play('puzzle_solve'),
    playPressurePlate: () => play('pressure_plate'),
    playHiddenDoorReveal: () => play('hidden_door_reveal'),
    playDoorOpen: () => play('door_open'),
  };
}
