/**
 * Skeleton Enemy Model v2
 * Canonical design based on bestiary appearance.
 *
 * Canonical appearance from bestiary:
 * "Animated human skeleton with glowing eye sockets. May carry rusted weapons."
 */

import * as THREE from 'three';
import { createMaterial } from './materials';

export interface SkeletonV2Options {
  scale?: number;
  hasWeapon?: boolean;
}

export function createSkeletonV2(options: SkeletonV2Options = {}): THREE.Group {
  const { scale = 1.0, hasWeapon = true } = options;

  const group = new THREE.Group();
  const s = scale;

  // === MATERIALS ===
  const boneMaterial = createMaterial('bone');
  const rustMaterial = createMaterial('rust');
  const darkWoodMaterial = createMaterial('darkWood');

  // Glowing eye sockets - eerie yellow-orange glow
  const eyeMaterial = new THREE.MeshStandardMaterial({
    color: 0xffaa00,
    roughness: 0.2,
    metalness: 0.0,
    emissive: 0xff6600,
    emissiveIntensity: 1.2,
  });

  // Darker bone for recessed areas
  const darkBoneMaterial = new THREE.MeshStandardMaterial({
    color: 0xc8c0a8,
    roughness: 0.8,
    metalness: 0.0,
  });

  // === SKULL ===
  const skull = new THREE.Mesh(
    new THREE.SphereGeometry(0.1 * s, 8, 6),
    boneMaterial
  );
  skull.position.y = 0.68 * s;
  skull.scale.set(1, 1.1, 0.95);
  group.add(skull);

  // Brow ridge
  const browRidge = new THREE.Mesh(
    new THREE.BoxGeometry(0.12 * s, 0.025 * s, 0.06 * s),
    boneMaterial
  );
  browRidge.position.set(0, 0.72 * s, 0.06 * s);
  group.add(browRidge);

  // Jaw bone
  const jaw = new THREE.Mesh(
    new THREE.BoxGeometry(0.08 * s, 0.035 * s, 0.055 * s),
    boneMaterial
  );
  jaw.position.set(0, 0.58 * s, 0.025 * s);
  group.add(jaw);

  // Teeth (upper)
  const teethGeo = new THREE.BoxGeometry(0.06 * s, 0.015 * s, 0.02 * s);
  const upperTeeth = new THREE.Mesh(teethGeo, darkBoneMaterial);
  upperTeeth.position.set(0, 0.615 * s, 0.065 * s);
  group.add(upperTeeth);

  // Teeth (lower)
  const lowerTeeth = new THREE.Mesh(teethGeo, darkBoneMaterial);
  lowerTeeth.position.set(0, 0.595 * s, 0.055 * s);
  group.add(lowerTeeth);

  // Eye sockets - glowing
  const eyeSocketGeo = new THREE.SphereGeometry(0.022 * s, 6, 4);

  const leftEye = new THREE.Mesh(eyeSocketGeo, eyeMaterial);
  leftEye.position.set(-0.035 * s, 0.7 * s, 0.075 * s);
  group.add(leftEye);

  const rightEye = new THREE.Mesh(eyeSocketGeo, eyeMaterial);
  rightEye.position.set(0.035 * s, 0.7 * s, 0.075 * s);
  group.add(rightEye);

  // Nasal cavity
  const nasalCavity = new THREE.Mesh(
    new THREE.BoxGeometry(0.025 * s, 0.03 * s, 0.015 * s),
    new THREE.MeshStandardMaterial({ color: 0x2a2a2a, roughness: 0.9 })
  );
  nasalCavity.position.set(0, 0.66 * s, 0.08 * s);
  group.add(nasalCavity);

  // === SPINE ===
  const vertebraGeo = new THREE.CylinderGeometry(0.025 * s, 0.025 * s, 0.025 * s, 6);
  for (let i = 0; i < 7; i++) {
    const vertebra = new THREE.Mesh(vertebraGeo, boneMaterial);
    vertebra.position.set(0, 0.52 * s - i * 0.035 * s, 0);
    group.add(vertebra);
  }

  // === RIBCAGE ===
  // Sternum
  const sternum = new THREE.Mesh(
    new THREE.BoxGeometry(0.03 * s, 0.15 * s, 0.02 * s),
    boneMaterial
  );
  sternum.position.set(0, 0.42 * s, 0.05 * s);
  group.add(sternum);

  // Ribs - curved appearance using boxes
  for (let i = 0; i < 5; i++) {
    const ribWidth = 0.14 * s - i * 0.015 * s;
    const ribY = 0.5 * s - i * 0.035 * s;

    // Left rib
    const leftRib = new THREE.Mesh(
      new THREE.BoxGeometry(ribWidth * 0.5, 0.015 * s, 0.04 * s),
      darkBoneMaterial
    );
    leftRib.position.set(-ribWidth * 0.25, ribY, 0.03 * s);
    leftRib.rotation.z = 0.15;
    group.add(leftRib);

    // Right rib
    const rightRib = new THREE.Mesh(
      new THREE.BoxGeometry(ribWidth * 0.5, 0.015 * s, 0.04 * s),
      darkBoneMaterial
    );
    rightRib.position.set(ribWidth * 0.25, ribY, 0.03 * s);
    rightRib.rotation.z = -0.15;
    group.add(rightRib);
  }

  // === SHOULDERS ===
  // Clavicles
  const clavicleGeo = new THREE.BoxGeometry(0.1 * s, 0.02 * s, 0.025 * s);

  const leftClavicle = new THREE.Mesh(clavicleGeo, boneMaterial);
  leftClavicle.position.set(-0.06 * s, 0.54 * s, 0.02 * s);
  leftClavicle.rotation.z = 0.2;
  group.add(leftClavicle);

  const rightClavicle = new THREE.Mesh(clavicleGeo, boneMaterial);
  rightClavicle.position.set(0.06 * s, 0.54 * s, 0.02 * s);
  rightClavicle.rotation.z = -0.2;
  group.add(rightClavicle);

  // Scapulae (shoulder blades)
  const scapulaGeo = new THREE.BoxGeometry(0.06 * s, 0.08 * s, 0.015 * s);

  const leftScapula = new THREE.Mesh(scapulaGeo, darkBoneMaterial);
  leftScapula.position.set(-0.1 * s, 0.48 * s, -0.03 * s);
  group.add(leftScapula);

  const rightScapula = new THREE.Mesh(scapulaGeo, darkBoneMaterial);
  rightScapula.position.set(0.1 * s, 0.48 * s, -0.03 * s);
  group.add(rightScapula);

  // === PELVIS ===
  const pelvis = new THREE.Mesh(
    new THREE.BoxGeometry(0.14 * s, 0.06 * s, 0.06 * s),
    boneMaterial
  );
  pelvis.position.set(0, 0.22 * s, 0);
  group.add(pelvis);

  // Hip bones
  const hipGeo = new THREE.BoxGeometry(0.04 * s, 0.08 * s, 0.03 * s);

  const leftHip = new THREE.Mesh(hipGeo, darkBoneMaterial);
  leftHip.position.set(-0.06 * s, 0.24 * s, 0.02 * s);
  leftHip.rotation.z = 0.2;
  group.add(leftHip);

  const rightHip = new THREE.Mesh(hipGeo, darkBoneMaterial);
  rightHip.position.set(0.06 * s, 0.24 * s, 0.02 * s);
  rightHip.rotation.z = -0.2;
  group.add(rightHip);

  // === LEFT ARM ===
  // Humerus
  const leftHumerus = new THREE.Mesh(
    new THREE.BoxGeometry(0.03 * s, 0.14 * s, 0.03 * s),
    boneMaterial
  );
  leftHumerus.position.set(-0.14 * s, 0.44 * s, 0);
  leftHumerus.rotation.z = 0.15;
  group.add(leftHumerus);

  // Radius/Ulna
  const leftForearm = new THREE.Mesh(
    new THREE.BoxGeometry(0.025 * s, 0.12 * s, 0.025 * s),
    boneMaterial
  );
  leftForearm.position.set(-0.16 * s, 0.3 * s, 0);
  leftForearm.rotation.z = 0.1;
  group.add(leftForearm);

  // Left hand
  const leftHand = new THREE.Mesh(
    new THREE.BoxGeometry(0.035 * s, 0.04 * s, 0.015 * s),
    darkBoneMaterial
  );
  leftHand.position.set(-0.17 * s, 0.22 * s, 0);
  group.add(leftHand);

  // Left fingers
  const fingerGeo = new THREE.BoxGeometry(0.008 * s, 0.025 * s, 0.008 * s);
  for (let i = 0; i < 4; i++) {
    const finger = new THREE.Mesh(fingerGeo, darkBoneMaterial);
    finger.position.set((-0.16 - i * 0.01) * s, 0.19 * s, 0);
    group.add(finger);
  }

  // === RIGHT ARM (weapon arm) ===
  // Humerus - raised for weapon
  const rightHumerus = new THREE.Mesh(
    new THREE.BoxGeometry(0.03 * s, 0.14 * s, 0.03 * s),
    boneMaterial
  );
  rightHumerus.position.set(0.14 * s, 0.44 * s, 0.02 * s);
  rightHumerus.rotation.z = -0.3;
  group.add(rightHumerus);

  // Forearm - angled forward
  const rightForearm = new THREE.Mesh(
    new THREE.BoxGeometry(0.025 * s, 0.12 * s, 0.025 * s),
    boneMaterial
  );
  rightForearm.position.set(0.18 * s, 0.32 * s, 0.04 * s);
  rightForearm.rotation.z = -0.4;
  rightForearm.rotation.x = -0.3;
  group.add(rightForearm);

  // Right hand (gripping weapon)
  const rightHand = new THREE.Mesh(
    new THREE.BoxGeometry(0.035 * s, 0.04 * s, 0.02 * s),
    darkBoneMaterial
  );
  rightHand.position.set(0.22 * s, 0.24 * s, 0.06 * s);
  rightHand.rotation.z = -0.3;
  group.add(rightHand);

  // === LEGS ===
  // Femurs
  const femurGeo = new THREE.BoxGeometry(0.035 * s, 0.16 * s, 0.035 * s);

  const leftFemur = new THREE.Mesh(femurGeo, boneMaterial);
  leftFemur.position.set(-0.05 * s, 0.12 * s, 0);
  group.add(leftFemur);

  const rightFemur = new THREE.Mesh(femurGeo, boneMaterial);
  rightFemur.position.set(0.05 * s, 0.12 * s, 0);
  group.add(rightFemur);

  // Tibia/Fibula
  const tibiaGeo = new THREE.BoxGeometry(0.028 * s, 0.14 * s, 0.028 * s);

  const leftTibia = new THREE.Mesh(tibiaGeo, boneMaterial);
  leftTibia.position.set(-0.05 * s, -0.02 * s, 0);
  group.add(leftTibia);

  const rightTibia = new THREE.Mesh(tibiaGeo, boneMaterial);
  rightTibia.position.set(0.05 * s, -0.02 * s, 0);
  group.add(rightTibia);

  // Feet
  const footGeo = new THREE.BoxGeometry(0.04 * s, 0.015 * s, 0.08 * s);

  const leftFoot = new THREE.Mesh(footGeo, darkBoneMaterial);
  leftFoot.position.set(-0.05 * s, -0.09 * s, 0.02 * s);
  group.add(leftFoot);

  const rightFoot = new THREE.Mesh(footGeo, darkBoneMaterial);
  rightFoot.position.set(0.05 * s, -0.09 * s, 0.02 * s);
  group.add(rightFoot);

  // === RUSTED WEAPON ===
  if (hasWeapon) {
    // Sword handle (worn wood)
    const handle = new THREE.Mesh(
      new THREE.CylinderGeometry(0.012 * s, 0.012 * s, 0.1 * s, 6),
      darkWoodMaterial
    );
    handle.position.set(0.24 * s, 0.18 * s, 0.08 * s);
    handle.rotation.z = -0.6;
    handle.rotation.x = -0.2;
    group.add(handle);

    // Crossguard (rusted)
    const crossguard = new THREE.Mesh(
      new THREE.BoxGeometry(0.08 * s, 0.015 * s, 0.02 * s),
      rustMaterial
    );
    crossguard.position.set(0.27 * s, 0.24 * s, 0.1 * s);
    crossguard.rotation.z = -0.6;
    group.add(crossguard);

    // Blade (rusted, pitted)
    const blade = new THREE.Mesh(
      new THREE.BoxGeometry(0.035 * s, 0.28 * s, 0.012 * s),
      rustMaterial
    );
    blade.position.set(0.36 * s, 0.4 * s, 0.12 * s);
    blade.rotation.z = -0.6;
    blade.rotation.x = -0.1;
    group.add(blade);

    // Blade tip (tapered)
    const bladeTip = new THREE.Mesh(
      new THREE.BoxGeometry(0.025 * s, 0.05 * s, 0.01 * s),
      rustMaterial
    );
    bladeTip.position.set(0.42 * s, 0.54 * s, 0.13 * s);
    bladeTip.rotation.z = -0.6;
    group.add(bladeTip);
  }

  return group;
}

export const SKELETON_V2_META = {
  id: 'skeleton-v2',
  name: 'Skeleton v2',
  category: 'enemy' as const,
  description: 'Animated human skeleton with glowing eye sockets and rusted weapon - canonical design',
  defaultScale: 1.0,
  boundingBox: { x: 0.5, y: 0.8, z: 0.3 },
  tags: ['skeleton', 'undead', 'enemy', 'creature', 'monster', 'humanoid', 'canonical'],
  enemyName: 'Skeleton',
  version: 2,
  isActive: true,
  baseModelId: 'skeleton',
};
