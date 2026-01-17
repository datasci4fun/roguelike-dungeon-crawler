/**
 * Skeleton Enemy Model
 * An undead skeleton warrior with a rusty sword
 */

import * as THREE from 'three';
import { createMaterial } from './materials';

export interface SkeletonOptions {
  scale?: number;
  hasSword?: boolean;
}

export function createSkeleton(options: SkeletonOptions = {}): THREE.Group {
  const { scale = 1.0, hasSword = true } = options;

  const group = new THREE.Group();

  // Materials
  const boneMaterial = createMaterial('bone');
  const darkBoneMaterial = new THREE.MeshStandardMaterial({
    color: 0xd4c8a8,
    roughness: 0.8,
  });
  const eyeMaterial = new THREE.MeshStandardMaterial({
    color: 0xff0000,
    emissive: 0x660000,
    emissiveIntensity: 0.5,
  });
  const ironMaterial = createMaterial('iron');

  const s = scale;

  // === SKULL ===
  const skull = new THREE.Mesh(
    new THREE.SphereGeometry(0.1 * s, 8, 6),
    boneMaterial
  );
  skull.position.y = 0.65 * s;
  skull.scale.set(1, 1.1, 0.9);
  group.add(skull);

  // Jaw (smaller box below skull)
  const jaw = new THREE.Mesh(
    new THREE.BoxGeometry(0.08 * s, 0.04 * s, 0.06 * s),
    boneMaterial
  );
  jaw.position.set(0, 0.56 * s, 0.03 * s);
  group.add(jaw);

  // Eye sockets (dark recesses with red glow)
  const eyeSocketGeo = new THREE.SphereGeometry(0.025 * s, 6, 4);

  const leftEye = new THREE.Mesh(eyeSocketGeo, eyeMaterial);
  leftEye.position.set(-0.035 * s, 0.67 * s, 0.07 * s);
  group.add(leftEye);

  const rightEye = new THREE.Mesh(eyeSocketGeo, eyeMaterial);
  rightEye.position.set(0.035 * s, 0.67 * s, 0.07 * s);
  group.add(rightEye);

  // === SPINE (stack of vertebrae) ===
  const vertebraGeo = new THREE.BoxGeometry(0.04 * s, 0.03 * s, 0.04 * s);
  for (let i = 0; i < 6; i++) {
    const vertebra = new THREE.Mesh(vertebraGeo, boneMaterial);
    vertebra.position.set(0, 0.5 * s - i * 0.04 * s, 0);
    group.add(vertebra);
  }

  // === RIBCAGE ===
  const ribGeo = new THREE.BoxGeometry(0.18 * s, 0.02 * s, 0.08 * s);
  for (let i = 0; i < 4; i++) {
    const rib = new THREE.Mesh(ribGeo, darkBoneMaterial);
    rib.position.set(0, 0.48 * s - i * 0.045 * s, 0.02 * s);
    group.add(rib);
  }

  // === SHOULDERS ===
  const shoulderGeo = new THREE.BoxGeometry(0.25 * s, 0.03 * s, 0.04 * s);
  const shoulders = new THREE.Mesh(shoulderGeo, boneMaterial);
  shoulders.position.set(0, 0.52 * s, 0);
  group.add(shoulders);

  // === PELVIS ===
  const pelvis = new THREE.Mesh(
    new THREE.BoxGeometry(0.14 * s, 0.06 * s, 0.06 * s),
    boneMaterial
  );
  pelvis.position.set(0, 0.22 * s, 0);
  group.add(pelvis);

  // === ARMS ===
  const upperArmGeo = new THREE.BoxGeometry(0.03 * s, 0.15 * s, 0.03 * s);
  const lowerArmGeo = new THREE.BoxGeometry(0.025 * s, 0.13 * s, 0.025 * s);

  // Left arm
  const leftUpperArm = new THREE.Mesh(upperArmGeo, boneMaterial);
  leftUpperArm.position.set(-0.15 * s, 0.42 * s, 0);
  leftUpperArm.rotation.z = 0.2;
  group.add(leftUpperArm);

  const leftLowerArm = new THREE.Mesh(lowerArmGeo, boneMaterial);
  leftLowerArm.position.set(-0.17 * s, 0.28 * s, 0);
  leftLowerArm.rotation.z = 0.1;
  group.add(leftLowerArm);

  // Left hand
  const leftHand = new THREE.Mesh(
    new THREE.BoxGeometry(0.04 * s, 0.03 * s, 0.02 * s),
    darkBoneMaterial
  );
  leftHand.position.set(-0.18 * s, 0.2 * s, 0);
  group.add(leftHand);

  // Right arm (holding sword)
  const rightUpperArm = new THREE.Mesh(upperArmGeo, boneMaterial);
  rightUpperArm.position.set(0.15 * s, 0.42 * s, 0);
  rightUpperArm.rotation.z = -0.3;
  group.add(rightUpperArm);

  const rightLowerArm = new THREE.Mesh(lowerArmGeo, boneMaterial);
  rightLowerArm.position.set(0.18 * s, 0.28 * s, 0.02 * s);
  rightLowerArm.rotation.z = -0.4;
  group.add(rightLowerArm);

  // Right hand
  const rightHand = new THREE.Mesh(
    new THREE.BoxGeometry(0.04 * s, 0.03 * s, 0.02 * s),
    darkBoneMaterial
  );
  rightHand.position.set(0.22 * s, 0.2 * s, 0.02 * s);
  group.add(rightHand);

  // === LEGS ===
  const thighGeo = new THREE.BoxGeometry(0.04 * s, 0.14 * s, 0.04 * s);
  const shinGeo = new THREE.BoxGeometry(0.03 * s, 0.12 * s, 0.03 * s);

  // Left leg
  const leftThigh = new THREE.Mesh(thighGeo, boneMaterial);
  leftThigh.position.set(-0.05 * s, 0.12 * s, 0);
  group.add(leftThigh);

  const leftShin = new THREE.Mesh(shinGeo, boneMaterial);
  leftShin.position.set(-0.05 * s, 0.02 * s, 0);
  group.add(leftShin);

  // Right leg
  const rightThigh = new THREE.Mesh(thighGeo, boneMaterial);
  rightThigh.position.set(0.05 * s, 0.12 * s, 0);
  group.add(rightThigh);

  const rightShin = new THREE.Mesh(shinGeo, boneMaterial);
  rightShin.position.set(0.05 * s, 0.02 * s, 0);
  group.add(rightShin);

  // === FEET ===
  const footGeo = new THREE.BoxGeometry(0.04 * s, 0.02 * s, 0.08 * s);

  const leftFoot = new THREE.Mesh(footGeo, darkBoneMaterial);
  leftFoot.position.set(-0.05 * s, 0.01 * s, 0.02 * s);
  group.add(leftFoot);

  const rightFoot = new THREE.Mesh(footGeo, darkBoneMaterial);
  rightFoot.position.set(0.05 * s, 0.01 * s, 0.02 * s);
  group.add(rightFoot);

  // === SWORD ===
  if (hasSword) {
    // Handle
    const handle = new THREE.Mesh(
      new THREE.BoxGeometry(0.02 * s, 0.1 * s, 0.02 * s),
      createMaterial('darkWood')
    );
    handle.position.set(0.26 * s, 0.22 * s, 0.02 * s);
    handle.rotation.z = -0.5;
    group.add(handle);

    // Crossguard
    const crossguard = new THREE.Mesh(
      new THREE.BoxGeometry(0.08 * s, 0.015 * s, 0.02 * s),
      ironMaterial
    );
    crossguard.position.set(0.28 * s, 0.28 * s, 0.02 * s);
    crossguard.rotation.z = -0.5;
    group.add(crossguard);

    // Blade
    const blade = new THREE.Mesh(
      new THREE.BoxGeometry(0.03 * s, 0.25 * s, 0.01 * s),
      ironMaterial
    );
    blade.position.set(0.34 * s, 0.42 * s, 0.02 * s);
    blade.rotation.z = -0.5;
    group.add(blade);
  }

  return group;
}

export const SKELETON_META = {
  id: 'skeleton',
  name: 'Skeleton',
  category: 'enemy' as const,
  description: 'An undead skeleton warrior with glowing red eyes and a rusty sword',
  defaultScale: 1.0,
  boundingBox: { x: 0.4, y: 0.75, z: 0.3 },
  tags: ['skeleton', 'undead', 'enemy', 'creature', 'monster', 'humanoid'],
  enemyName: 'Skeleton',
};
