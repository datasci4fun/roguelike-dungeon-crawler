/**
 * Player Character Model - Procedural 3D player model generator
 *
 * Creates player characters based on race and class selection.
 * Follows the same registry pattern as enemy models.
 */

import * as THREE from 'three';
import type { RaceId, ClassId } from '../types';

// ============================================================================
// Race Configurations
// ============================================================================

export interface RaceConfig {
  height: number;
  width: number;
  headSize: number;
  skinColor: number;
  eyeColor: number;
}

export const RACE_CONFIG: Record<RaceId, RaceConfig> = {
  HUMAN: {
    height: 1.8,
    width: 0.5,
    headSize: 0.35,
    skinColor: 0xd4a574,
    eyeColor: 0x4488cc,
  },
  ELF: {
    height: 2.0,
    width: 0.4,
    headSize: 0.32,
    skinColor: 0xe8d4b8,
    eyeColor: 0x88dd88,
  },
  DWARF: {
    height: 1.3,
    width: 0.65,
    headSize: 0.4,
    skinColor: 0xc9a87c,
    eyeColor: 0x8866aa,
  },
  HALFLING: {
    height: 1.0,
    width: 0.35,
    headSize: 0.35,
    skinColor: 0xdec4a4,
    eyeColor: 0x886633,
  },
  ORC: {
    height: 2.1,
    width: 0.7,
    headSize: 0.42,
    skinColor: 0x5a8a5a,
    eyeColor: 0xcc4444,
  },
};

// ============================================================================
// Class Configurations
// ============================================================================

export type EquipmentType = 'sword_shield' | 'staff' | 'daggers' | 'holy';

export interface ClassConfig {
  primaryColor: number;
  secondaryColor: number;
  glowColor: number;
  equipment: EquipmentType;
}

export const CLASS_CONFIG: Record<ClassId, ClassConfig> = {
  WARRIOR: {
    primaryColor: 0x8b4513,
    secondaryColor: 0x696969,
    glowColor: 0xffaa44,
    equipment: 'sword_shield',
  },
  MAGE: {
    primaryColor: 0x4a2a7a,
    secondaryColor: 0x8844cc,
    glowColor: 0xaa66ff,
    equipment: 'staff',
  },
  ROGUE: {
    primaryColor: 0x2a2a2a,
    secondaryColor: 0x444444,
    glowColor: 0x44aa44,
    equipment: 'daggers',
  },
  CLERIC: {
    primaryColor: 0xffd700,
    secondaryColor: 0xf5f5dc,
    glowColor: 0xffffaa,
    equipment: 'holy',
  },
};

// ============================================================================
// Model Creation Options
// ============================================================================

export interface PlayerModelOptions {
  race?: RaceId;
  classId?: ClassId;
  includeAura?: boolean;
}

// ============================================================================
// Equipment Builder
// ============================================================================

function addClassEquipment(
  group: THREE.Group,
  characterHeight: number,
  classConfig: ClassConfig
): void {
  const metalMat = new THREE.MeshStandardMaterial({
    color: 0x888888,
    roughness: 0.3,
    metalness: 0.8,
  });

  const woodMat = new THREE.MeshStandardMaterial({
    color: 0x8b4513,
    roughness: 0.8,
  });

  const accentMat = new THREE.MeshStandardMaterial({
    color: classConfig.secondaryColor,
    roughness: 0.5,
    metalness: 0.3,
  });

  const glowMat = new THREE.MeshBasicMaterial({
    color: classConfig.glowColor,
    transparent: true,
    opacity: 0.8,
  });

  switch (classConfig.equipment) {
    case 'sword_shield': {
      // Sword
      const bladeGeom = new THREE.BoxGeometry(0.06, 0.6, 0.02);
      const blade = new THREE.Mesh(bladeGeom, metalMat);
      blade.position.set(0.7, characterHeight * 0.45, 0);
      blade.rotation.z = -0.3;
      group.add(blade);

      const hiltGeom = new THREE.BoxGeometry(0.2, 0.06, 0.04);
      const hilt = new THREE.Mesh(hiltGeom, woodMat);
      hilt.position.set(0.6, characterHeight * 0.35, 0);
      hilt.rotation.z = -0.3;
      group.add(hilt);

      // Shield
      const shieldGeom = new THREE.CircleGeometry(0.25, 6);
      const shield = new THREE.Mesh(shieldGeom, accentMat);
      shield.position.set(-0.55, characterHeight * 0.5, 0.15);
      shield.rotation.y = 0.3;
      group.add(shield);
      break;
    }

    case 'staff': {
      // Staff
      const staffGeom = new THREE.CylinderGeometry(0.03, 0.04, 1.5, 8);
      const staff = new THREE.Mesh(staffGeom, woodMat);
      staff.position.set(0.5, characterHeight * 0.55, 0);
      staff.rotation.z = -0.15;
      group.add(staff);

      // Orb at top
      const orbGeom = new THREE.SphereGeometry(0.1, 16, 12);
      const orb = new THREE.Mesh(orbGeom, glowMat);
      orb.position.set(0.4, characterHeight * 0.55 + 0.8, 0);
      group.add(orb);
      break;
    }

    case 'daggers': {
      // Left dagger
      const daggerGeom = new THREE.ConeGeometry(0.03, 0.3, 4);
      const dagger1 = new THREE.Mesh(daggerGeom, metalMat);
      dagger1.position.set(0.5, characterHeight * 0.4, 0.1);
      dagger1.rotation.z = -0.5;
      group.add(dagger1);

      // Right dagger
      const dagger2 = new THREE.Mesh(daggerGeom, metalMat);
      dagger2.position.set(-0.5, characterHeight * 0.4, 0.1);
      dagger2.rotation.z = 0.5;
      group.add(dagger2);

      // Hood/cloak
      const hoodGeom = new THREE.ConeGeometry(0.22, 0.25, 8);
      const hoodMat = new THREE.MeshStandardMaterial({ color: 0x222222 });
      const hood = new THREE.Mesh(hoodGeom, hoodMat);
      hood.position.set(0, characterHeight * 0.85, -0.05);
      group.add(hood);
      break;
    }

    case 'holy': {
      // Holy symbol (floating above)
      const crossVGeom = new THREE.BoxGeometry(0.05, 0.25, 0.02);
      const crossHGeom = new THREE.BoxGeometry(0.15, 0.05, 0.02);
      const crossV = new THREE.Mesh(crossVGeom, glowMat);
      const crossH = new THREE.Mesh(crossHGeom, glowMat);
      crossV.position.set(0, characterHeight + 0.3, 0.3);
      crossH.position.set(0, characterHeight + 0.35, 0.3);
      group.add(crossV);
      group.add(crossH);

      // Halo
      const haloGeom = new THREE.TorusGeometry(0.2, 0.02, 8, 32);
      const halo = new THREE.Mesh(haloGeom, glowMat);
      halo.position.set(0, characterHeight * 0.9 + 0.3, 0);
      halo.rotation.x = Math.PI / 2;
      group.add(halo);
      break;
    }
  }
}

// ============================================================================
// Race Features Builder
// ============================================================================

function addRaceFeatures(
  group: THREE.Group,
  race: RaceId,
  raceConfig: RaceConfig,
  skinMat: THREE.MeshStandardMaterial
): void {
  if (race === 'ELF') {
    // Pointed ears
    const earGeom = new THREE.ConeGeometry(0.08, 0.2, 4);
    const leftEar = new THREE.Mesh(earGeom, skinMat);
    leftEar.position.set(
      -raceConfig.headSize * 0.9,
      raceConfig.height * 0.75 + raceConfig.headSize,
      0
    );
    leftEar.rotation.z = Math.PI / 4;
    group.add(leftEar);

    const rightEar = new THREE.Mesh(earGeom, skinMat);
    rightEar.position.set(
      raceConfig.headSize * 0.9,
      raceConfig.height * 0.75 + raceConfig.headSize,
      0
    );
    rightEar.rotation.z = -Math.PI / 4;
    group.add(rightEar);
  }

  if (race === 'ORC') {
    // Tusks
    const tuskGeom = new THREE.ConeGeometry(0.04, 0.15, 4);
    const tuskMat = new THREE.MeshStandardMaterial({ color: 0xeeeedd });

    const leftTusk = new THREE.Mesh(tuskGeom, tuskMat);
    leftTusk.position.set(
      -raceConfig.headSize * 0.4,
      raceConfig.height * 0.75 + raceConfig.headSize * 0.5,
      raceConfig.headSize * 0.7
    );
    leftTusk.rotation.x = Math.PI;
    group.add(leftTusk);

    const rightTusk = new THREE.Mesh(tuskGeom, tuskMat);
    rightTusk.position.set(
      raceConfig.headSize * 0.4,
      raceConfig.height * 0.75 + raceConfig.headSize * 0.5,
      raceConfig.headSize * 0.7
    );
    rightTusk.rotation.x = Math.PI;
    group.add(rightTusk);
  }

  if (race === 'DWARF') {
    // Beard
    const beardGeom = new THREE.BoxGeometry(0.3, 0.25, 0.15);
    const beardMat = new THREE.MeshStandardMaterial({ color: 0x8b4513 });
    const beard = new THREE.Mesh(beardGeom, beardMat);
    beard.position.set(
      0,
      raceConfig.height * 0.75 + raceConfig.headSize * 0.3,
      raceConfig.headSize * 0.6
    );
    group.add(beard);
  }
}

// ============================================================================
// Main Model Factory
// ============================================================================

/**
 * Create a player character model based on race and class
 */
export function createPlayerCharacter(options?: PlayerModelOptions): THREE.Group {
  const race = options?.race ?? 'HUMAN';
  const classId = options?.classId ?? 'WARRIOR';
  const includeAura = options?.includeAura ?? true;

  const raceConfig = RACE_CONFIG[race];
  const classConfig = CLASS_CONFIG[classId];

  const group = new THREE.Group();
  group.name = `player_${race}_${classId}`;

  // Body materials
  const skinMat = new THREE.MeshStandardMaterial({
    color: raceConfig.skinColor,
    roughness: 0.7,
  });

  const clothMat = new THREE.MeshStandardMaterial({
    color: classConfig.primaryColor,
    roughness: 0.6,
  });

  // Torso
  const torsoHeight = raceConfig.height * 0.4;
  const torsoGeom = new THREE.BoxGeometry(
    raceConfig.width,
    torsoHeight,
    raceConfig.width * 0.6
  );
  const torso = new THREE.Mesh(torsoGeom, clothMat);
  torso.position.y = raceConfig.height * 0.5;
  group.add(torso);

  // Head
  const headGeom = new THREE.SphereGeometry(raceConfig.headSize, 16, 12);
  const head = new THREE.Mesh(headGeom, skinMat);
  head.position.y = raceConfig.height * 0.75 + raceConfig.headSize;
  group.add(head);

  // Eyes
  const eyeGeom = new THREE.SphereGeometry(raceConfig.headSize * 0.15, 8, 8);
  const eyeMat = new THREE.MeshBasicMaterial({ color: raceConfig.eyeColor });

  const leftEye = new THREE.Mesh(eyeGeom, eyeMat);
  leftEye.position.set(
    -raceConfig.headSize * 0.3,
    raceConfig.height * 0.75 + raceConfig.headSize * 1.1,
    raceConfig.headSize * 0.7
  );
  group.add(leftEye);

  const rightEye = new THREE.Mesh(eyeGeom, eyeMat);
  rightEye.position.set(
    raceConfig.headSize * 0.3,
    raceConfig.height * 0.75 + raceConfig.headSize * 1.1,
    raceConfig.headSize * 0.7
  );
  group.add(rightEye);

  // Arms
  const armGeom = new THREE.CylinderGeometry(
    raceConfig.width * 0.15,
    raceConfig.width * 0.12,
    raceConfig.height * 0.35
  );

  const leftArm = new THREE.Mesh(armGeom, skinMat);
  leftArm.position.set(-raceConfig.width * 0.6, raceConfig.height * 0.5, 0);
  leftArm.rotation.z = 0.2;
  group.add(leftArm);

  const rightArm = new THREE.Mesh(armGeom, skinMat);
  rightArm.position.set(raceConfig.width * 0.6, raceConfig.height * 0.5, 0);
  rightArm.rotation.z = -0.2;
  group.add(rightArm);

  // Legs
  const legGeom = new THREE.CylinderGeometry(
    raceConfig.width * 0.18,
    raceConfig.width * 0.15,
    raceConfig.height * 0.35
  );

  const leftLeg = new THREE.Mesh(legGeom, clothMat);
  leftLeg.position.set(-raceConfig.width * 0.25, raceConfig.height * 0.17, 0);
  group.add(leftLeg);

  const rightLeg = new THREE.Mesh(legGeom, clothMat);
  rightLeg.position.set(raceConfig.width * 0.25, raceConfig.height * 0.17, 0);
  group.add(rightLeg);

  // Add race-specific features
  addRaceFeatures(group, race, raceConfig, skinMat);

  // Add class equipment
  addClassEquipment(group, raceConfig.height, classConfig);

  // Glow effect (aura)
  if (includeAura) {
    const auraGeom = new THREE.RingGeometry(0.6, 0.8, 32);
    const auraMat = new THREE.MeshBasicMaterial({
      color: classConfig.glowColor,
      transparent: true,
      opacity: 0.3,
      side: THREE.DoubleSide,
    });
    const aura = new THREE.Mesh(auraGeom, auraMat);
    aura.rotation.x = -Math.PI / 2;
    aura.position.y = 0.01;
    aura.name = 'playerAura';
    group.add(aura);
  }

  return group;
}

// ============================================================================
// Model Metadata (following enemy model pattern)
// ============================================================================

export const PLAYER_CHARACTER_META = {
  id: 'player-character',
  name: 'Player Character',
  category: 'player' as const,
  description: 'Procedural player character with race and class customization',
  defaultScale: 1.0,
  boundingBox: { x: 1.4, y: 2.5, z: 0.8 },
  tags: ['player', 'character', 'humanoid', 'playable'],
};

// ============================================================================
// Convenience Exports for Each Race/Class Combination
// ============================================================================

// All available races
export const PLAYER_RACES: RaceId[] = ['HUMAN', 'ELF', 'DWARF', 'HALFLING', 'ORC'];

// All available classes
export const PLAYER_CLASSES: ClassId[] = ['WARRIOR', 'MAGE', 'ROGUE', 'CLERIC'];

/**
 * Get the display name for a race
 */
export function getRaceDisplayName(race: RaceId): string {
  const names: Record<RaceId, string> = {
    HUMAN: 'Human',
    ELF: 'Elf',
    DWARF: 'Dwarf',
    HALFLING: 'Halfling',
    ORC: 'Orc',
  };
  return names[race];
}

/**
 * Get the display name for a class
 */
export function getClassDisplayName(classId: ClassId): string {
  const names: Record<ClassId, string> = {
    WARRIOR: 'Warrior',
    MAGE: 'Mage',
    ROGUE: 'Rogue',
    CLERIC: 'Cleric',
  };
  return names[classId];
}

/**
 * Get the model height for a race (useful for camera/positioning)
 */
export function getRaceHeight(race: RaceId): number {
  return RACE_CONFIG[race].height;
}

/**
 * Get the class glow color (useful for effects)
 */
export function getClassGlowColor(classId: ClassId): number {
  return CLASS_CONFIG[classId].glowColor;
}
