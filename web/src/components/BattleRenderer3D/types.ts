/**
 * BattleRenderer3D Types
 *
 * All type definitions for the battle renderer.
 */
import * as THREE from 'three';
import type { BattleState } from '../../types';
import { PHASE_ORDER } from './constants';

export type OverviewPhase = typeof PHASE_ORDER[number];

export interface TileCoord {
  x: number;
  y: number;
}

export interface GameEvent {
  type: string;
  data: Record<string, unknown>;
}

export interface DamageNumber {
  id: number;
  x: number;
  z: number;
  amount: number;
  createdAt: number;
  sprite: THREE.Sprite;
  canvas: HTMLCanvasElement;
}

// v6.5 Battle Polish: Camera shake effect
export interface CameraShake {
  intensity: number;    // Current shake intensity (0-1)
  decay: number;        // How fast shake decays per frame
  startTime: number;    // When shake started
}

// v6.5 Battle Polish: Hit particle effect
export interface HitParticle {
  mesh: THREE.Points;
  startTime: number;
  duration: number;
}

// v6.5 Battle Polish: Attack telegraph (danger zone indicator)
export interface AttackTelegraph {
  mesh: THREE.Mesh;
  startTime: number;
  duration: number;
}

// Entity animation state for smooth transitions
export interface EntityAnimState {
  sprite: THREE.Group;
  currentX: number;
  currentZ: number;
  targetX: number;
  targetZ: number;
  lastHp: number;
}

// Component props
export interface BattleRenderer3DProps {
  battle: BattleState;
  onOverviewComplete?: () => void;
  selectedAction?: 'move' | 'attack' | 'ability1' | 'ability2' | 'ability3' | 'ability4' | null;
  onTileClick?: (tile: TileCoord, hasEnemy: boolean) => void;
  onTileHover?: (tile: TileCoord | null) => void;
  events?: GameEvent[];
}

// Turn state for visible turn-based combat
export interface EnemyTurnState {
  enemyId: string;
  enemyName: string;
  turnIndex: number;
  totalEnemies: number;
}
