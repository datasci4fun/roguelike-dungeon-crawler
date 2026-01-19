/**
 * Doppelganger Enemy Model
 * Canonical design based on bestiary appearance.
 *
 * Canonical appearance from bestiary:
 * "In true form: featureless gray humanoid. Can perfectly copy any creature it has seen."
 */

import * as THREE from 'three';

export interface DoppelgangerOptions {
  scale?: number;
}

export function createDoppelganger(options: DoppelgangerOptions = {}): THREE.Group {
  const { scale = 1.0 } = options;

  const group = new THREE.Group();
  const s = scale * 1.0;

  // === MATERIALS ===
  // Featureless gray body (canonical - featureless gray humanoid)
  const grayMaterial = new THREE.MeshStandardMaterial({
    color: 0x666677,
    roughness: 0.6,
    metalness: 0.1,
  });

  // Slightly darker gray for depth
  const darkGrayMaterial = new THREE.MeshStandardMaterial({
    color: 0x555566,
    roughness: 0.5,
    metalness: 0.1,
  });

  // Shifting surface effect (mimicry ability)
  const shiftMaterial = new THREE.MeshStandardMaterial({
    color: 0x777788,
    roughness: 0.4,
    metalness: 0.2,
    emissive: 0x222233,
    emissiveIntensity: 0.2,
  });

  // Eyes (the only feature - subtle)
  const eyeMaterial = new THREE.MeshStandardMaterial({
    color: 0x111111,
    roughness: 0.1,
    metalness: 0.3,
    emissive: 0x333344,
    emissiveIntensity: 0.3,
  });

  // === HEAD (smooth, featureless) ===
  const head = new THREE.Mesh(
    new THREE.SphereGeometry(0.1 * s, 10, 8),
    grayMaterial
  );
  head.position.y = 0.75 * s;
  head.scale.set(1, 1.1, 0.95);
  group.add(head);

  // Subtle eye indentations (almost featureless)
  const eyeIndentGeo = new THREE.SphereGeometry(0.015 * s, 6, 4);

  const leftEyeIndent = new THREE.Mesh(eyeIndentGeo, eyeMaterial);
  leftEyeIndent.position.set(-0.03 * s, 0.77 * s, 0.08 * s);
  group.add(leftEyeIndent);

  const rightEyeIndent = new THREE.Mesh(eyeIndentGeo, eyeMaterial);
  rightEyeIndent.position.set(0.03 * s, 0.77 * s, 0.08 * s);
  group.add(rightEyeIndent);

  // === NECK ===
  const neck = new THREE.Mesh(
    new THREE.CylinderGeometry(0.04 * s, 0.05 * s, 0.08 * s, 8),
    grayMaterial
  );
  neck.position.y = 0.64 * s;
  group.add(neck);

  // === TORSO (smooth humanoid) ===
  const torso = new THREE.Mesh(
    new THREE.BoxGeometry(0.18 * s, 0.26 * s, 0.1 * s),
    grayMaterial
  );
  torso.position.y = 0.48 * s;
  group.add(torso);

  // Shifting surface patches (showing mimicry ability)
  const shiftPatchGeo = new THREE.BoxGeometry(0.06 * s, 0.08 * s, 0.02 * s);
  const patches = [
    { x: -0.06, y: 0.52, z: 0.06 },
    { x: 0.07, y: 0.48, z: 0.055 },
    { x: -0.04, y: 0.42, z: 0.055 },
  ];

  patches.forEach((p) => {
    const patch = new THREE.Mesh(shiftPatchGeo, shiftMaterial);
    patch.position.set(p.x * s, p.y * s, p.z * s);
    group.add(patch);
  });

  // === SHOULDERS ===
  const shoulderGeo = new THREE.SphereGeometry(0.05 * s, 8, 6);

  const leftShoulder = new THREE.Mesh(shoulderGeo, grayMaterial);
  leftShoulder.position.set(-0.12 * s, 0.58 * s, 0);
  group.add(leftShoulder);

  const rightShoulder = new THREE.Mesh(shoulderGeo, grayMaterial);
  rightShoulder.position.set(0.12 * s, 0.58 * s, 0);
  group.add(rightShoulder);

  // === ARMS (smooth, featureless) ===
  const upperArmGeo = new THREE.CylinderGeometry(0.035 * s, 0.04 * s, 0.16 * s, 8);

  const leftUpperArm = new THREE.Mesh(upperArmGeo, grayMaterial);
  leftUpperArm.position.set(-0.14 * s, 0.48 * s, 0);
  leftUpperArm.rotation.z = 0.15;
  group.add(leftUpperArm);

  const rightUpperArm = new THREE.Mesh(upperArmGeo, grayMaterial);
  rightUpperArm.position.set(0.14 * s, 0.48 * s, 0);
  rightUpperArm.rotation.z = -0.15;
  group.add(rightUpperArm);

  // Lower arms
  const lowerArmGeo = new THREE.CylinderGeometry(0.03 * s, 0.035 * s, 0.14 * s, 8);

  const leftLowerArm = new THREE.Mesh(lowerArmGeo, darkGrayMaterial);
  leftLowerArm.position.set(-0.16 * s, 0.34 * s, 0.02 * s);
  group.add(leftLowerArm);

  const rightLowerArm = new THREE.Mesh(lowerArmGeo, darkGrayMaterial);
  rightLowerArm.position.set(0.16 * s, 0.34 * s, 0.02 * s);
  group.add(rightLowerArm);

  // Hands (smooth, no fingers)
  const handGeo = new THREE.SphereGeometry(0.035 * s, 8, 6);

  const leftHand = new THREE.Mesh(handGeo, grayMaterial);
  leftHand.position.set(-0.17 * s, 0.24 * s, 0.03 * s);
  leftHand.scale.set(0.9, 1.1, 0.7);
  group.add(leftHand);

  const rightHand = new THREE.Mesh(handGeo, grayMaterial);
  rightHand.position.set(0.17 * s, 0.24 * s, 0.03 * s);
  rightHand.scale.set(0.9, 1.1, 0.7);
  group.add(rightHand);

  // === LOWER BODY ===
  const hips = new THREE.Mesh(
    new THREE.BoxGeometry(0.16 * s, 0.1 * s, 0.1 * s),
    grayMaterial
  );
  hips.position.y = 0.32 * s;
  group.add(hips);

  // === LEGS (smooth, featureless) ===
  const upperLegGeo = new THREE.CylinderGeometry(0.045 * s, 0.04 * s, 0.18 * s, 8);

  const leftUpperLeg = new THREE.Mesh(upperLegGeo, grayMaterial);
  leftUpperLeg.position.set(-0.05 * s, 0.2 * s, 0);
  group.add(leftUpperLeg);

  const rightUpperLeg = new THREE.Mesh(upperLegGeo, grayMaterial);
  rightUpperLeg.position.set(0.05 * s, 0.2 * s, 0);
  group.add(rightUpperLeg);

  // Lower legs
  const lowerLegGeo = new THREE.CylinderGeometry(0.035 * s, 0.04 * s, 0.16 * s, 8);

  const leftLowerLeg = new THREE.Mesh(lowerLegGeo, darkGrayMaterial);
  leftLowerLeg.position.set(-0.05 * s, 0.08 * s, 0);
  group.add(leftLowerLeg);

  const rightLowerLeg = new THREE.Mesh(lowerLegGeo, darkGrayMaterial);
  rightLowerLeg.position.set(0.05 * s, 0.08 * s, 0);
  group.add(rightLowerLeg);

  // Feet (smooth blobs)
  const footGeo = new THREE.BoxGeometry(0.05 * s, 0.03 * s, 0.08 * s);

  const leftFoot = new THREE.Mesh(footGeo, grayMaterial);
  leftFoot.position.set(-0.05 * s, 0.015 * s, 0.01 * s);
  group.add(leftFoot);

  const rightFoot = new THREE.Mesh(footGeo, grayMaterial);
  rightFoot.position.set(0.05 * s, 0.015 * s, 0.01 * s);
  group.add(rightFoot);

  // === MIMICRY EFFECT (subtle shifting surface) ===
  const rippleGeo = new THREE.TorusGeometry(0.06 * s, 0.01 * s, 4, 12);
  const rippleMaterial = new THREE.MeshStandardMaterial({
    color: 0x8888aa,
    roughness: 0.3,
    metalness: 0.2,
    transparent: true,
    opacity: 0.4,
  });

  const ripple1 = new THREE.Mesh(rippleGeo, rippleMaterial);
  ripple1.position.set(-0.04 * s, 0.5 * s, 0.06 * s);
  ripple1.rotation.x = Math.PI / 2;
  ripple1.rotation.z = 0.3;
  group.add(ripple1);

  const ripple2 = new THREE.Mesh(rippleGeo, rippleMaterial);
  ripple2.position.set(0.06 * s, 0.44 * s, 0.055 * s);
  ripple2.rotation.x = Math.PI / 2;
  ripple2.rotation.z = -0.2;
  group.add(ripple2);

  return group;
}

export const DOPPELGANGER_META = {
  id: 'doppelganger',
  name: 'Doppelganger',
  category: 'enemy' as const,
  description: 'In true form: featureless gray humanoid. Can perfectly copy any creature it has seen - canonical design',
  defaultScale: 1.0,
  boundingBox: { x: 0.4, y: 0.85, z: 0.25 },
  tags: ['shapeshifter', 'mimic', 'enemy', 'creature', 'humanoid', 'stealth', 'canonical'],
  enemyName: 'Doppelganger',
};
