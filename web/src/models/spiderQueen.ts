/**
 * Spider Queen Boss Model
 * Floor 3 boss - Giant spider with egg sac and crown
 */

import * as THREE from 'three';
import { createMaterial, MATERIAL_PRESETS } from './materials';

export interface SpiderQueenOptions {
  scale?: number;
}

export function createSpiderQueen(options: SpiderQueenOptions = {}): THREE.Group {
  const { scale = 1.0 } = options;

  // Boss scale multiplier
  const bossScale = scale * 1.5;

  const group = new THREE.Group();

  // Materials
  const chitinMaterial = new THREE.MeshStandardMaterial({
    color: 0x1a1a1a,
    roughness: 0.4,
    metalness: 0.2,
  });

  const darkChitinMaterial = new THREE.MeshStandardMaterial({
    color: 0x0a0a0a,
    roughness: 0.3,
    metalness: 0.3,
  });

  const markingMaterial = new THREE.MeshStandardMaterial({
    color: 0x8b0000, // Dark red markings
    roughness: 0.5,
    metalness: 0.1,
  });

  const eyeMaterial = new THREE.MeshStandardMaterial({
    color: 0xff0000,
    emissive: 0xff0000,
    emissiveIntensity: 0.8,
    roughness: 0.2,
  });

  const eggSacMaterial = new THREE.MeshStandardMaterial({
    color: 0xf5f5dc, // Beige/cream
    roughness: 0.6,
    metalness: 0.0,
    transparent: true,
    opacity: 0.85,
  });

  const goldMaterial = createMaterial('gold');
  const boneMaterial = createMaterial('bone');

  // === ABDOMEN (large rear body section) ===
  const abdomenGeometry = new THREE.SphereGeometry(0.5 * bossScale, 12, 10);
  const abdomen = new THREE.Mesh(abdomenGeometry, chitinMaterial);
  abdomen.position.set(0, 0.5 * bossScale, -0.4 * bossScale);
  abdomen.scale.set(1, 0.8, 1.3); // Elongated egg shape
  group.add(abdomen);

  // Abdomen markings (hourglass pattern)
  const markingGeometry = new THREE.SphereGeometry(0.15 * bossScale, 8, 6);
  const marking1 = new THREE.Mesh(markingGeometry, markingMaterial);
  marking1.position.set(0, 0.65 * bossScale, -0.3 * bossScale);
  marking1.scale.set(1, 0.5, 0.3);
  group.add(marking1);

  const marking2 = new THREE.Mesh(markingGeometry, markingMaterial);
  marking2.position.set(0, 0.55 * bossScale, -0.5 * bossScale);
  marking2.scale.set(0.8, 0.4, 0.3);
  group.add(marking2);

  // === CEPHALOTHORAX (front body section) ===
  const cephalothoraxGeometry = new THREE.SphereGeometry(0.3 * bossScale, 10, 8);
  const cephalothorax = new THREE.Mesh(cephalothoraxGeometry, darkChitinMaterial);
  cephalothorax.position.set(0, 0.4 * bossScale, 0.25 * bossScale);
  cephalothorax.scale.set(1, 0.7, 1.2);
  group.add(cephalothorax);

  // === HEAD ===
  const headGeometry = new THREE.SphereGeometry(0.18 * bossScale, 8, 6);
  const head = new THREE.Mesh(headGeometry, darkChitinMaterial);
  head.position.set(0, 0.45 * bossScale, 0.5 * bossScale);
  head.scale.set(1, 0.8, 0.9);
  group.add(head);

  // === EYES (8 eyes - spider arrangement) ===
  const eyeGeometry = new THREE.SphereGeometry(0.035 * bossScale, 6, 6);

  // Large front eyes (2)
  const frontEyePositions = [
    { x: -0.06, y: 0.5, z: 0.62 },
    { x: 0.06, y: 0.5, z: 0.62 },
  ];
  for (const pos of frontEyePositions) {
    const eye = new THREE.Mesh(eyeGeometry, eyeMaterial);
    eye.position.set(pos.x * bossScale, pos.y * bossScale, pos.z * bossScale);
    eye.scale.setScalar(1.2);
    group.add(eye);
  }

  // Medium side eyes (4)
  const smallEyeGeometry = new THREE.SphereGeometry(0.025 * bossScale, 6, 6);
  const sideEyePositions = [
    { x: -0.1, y: 0.48, z: 0.58 },
    { x: 0.1, y: 0.48, z: 0.58 },
    { x: -0.12, y: 0.52, z: 0.55 },
    { x: 0.12, y: 0.52, z: 0.55 },
  ];
  for (const pos of sideEyePositions) {
    const eye = new THREE.Mesh(smallEyeGeometry, eyeMaterial);
    eye.position.set(pos.x * bossScale, pos.y * bossScale, pos.z * bossScale);
    group.add(eye);
  }

  // Small top eyes (2)
  const tinyEyeGeometry = new THREE.SphereGeometry(0.018 * bossScale, 6, 6);
  const topEyePositions = [
    { x: -0.04, y: 0.55, z: 0.52 },
    { x: 0.04, y: 0.55, z: 0.52 },
  ];
  for (const pos of topEyePositions) {
    const eye = new THREE.Mesh(tinyEyeGeometry, eyeMaterial);
    eye.position.set(pos.x * bossScale, pos.y * bossScale, pos.z * bossScale);
    group.add(eye);
  }

  // === MANDIBLES (chelicerae) ===
  const mandibleGeometry = new THREE.ConeGeometry(0.04 * bossScale, 0.12 * bossScale, 6);
  const mandiblePositions = [
    { x: -0.06, rot: 0.3 },
    { x: 0.06, rot: -0.3 },
  ];
  for (const pos of mandiblePositions) {
    const mandible = new THREE.Mesh(mandibleGeometry, darkChitinMaterial);
    mandible.position.set(pos.x * bossScale, 0.38 * bossScale, 0.6 * bossScale);
    mandible.rotation.x = Math.PI * 0.7;
    mandible.rotation.z = pos.rot;
    group.add(mandible);

    // Fang tip
    const fangGeometry = new THREE.ConeGeometry(0.015 * bossScale, 0.05 * bossScale, 4);
    const fang = new THREE.Mesh(fangGeometry, boneMaterial);
    fang.position.set(pos.x * bossScale, 0.32 * bossScale, 0.65 * bossScale);
    fang.rotation.x = Math.PI * 0.8;
    fang.rotation.z = pos.rot * 0.5;
    group.add(fang);
  }

  // === PEDIPALPS (small front appendages) ===
  const pedipalpGeometry = new THREE.CylinderGeometry(0.02 * bossScale, 0.015 * bossScale, 0.1 * bossScale, 6);
  const pedipalpPositions = [
    { x: -0.1, z: 0.55 },
    { x: 0.1, z: 0.55 },
  ];
  for (const pos of pedipalpPositions) {
    const pedipalp = new THREE.Mesh(pedipalpGeometry, chitinMaterial);
    pedipalp.position.set(pos.x * bossScale, 0.35 * bossScale, pos.z * bossScale);
    pedipalp.rotation.x = Math.PI * 0.4;
    pedipalp.rotation.z = pos.x > 0 ? -0.3 : 0.3;
    group.add(pedipalp);
  }

  // === LEGS (8 legs with 3 segments each) ===
  const legSegmentGeometry = new THREE.CylinderGeometry(0.025 * bossScale, 0.02 * bossScale, 0.35 * bossScale, 6);
  const legMidGeometry = new THREE.CylinderGeometry(0.02 * bossScale, 0.015 * bossScale, 0.4 * bossScale, 6);
  const legTipGeometry = new THREE.CylinderGeometry(0.015 * bossScale, 0.008 * bossScale, 0.3 * bossScale, 6);

  // Leg attachment points on cephalothorax (4 pairs)
  const legConfigs = [
    // Front legs
    { x: -0.2, z: 0.35, angleY: -0.6, spread: 0.8 },
    { x: 0.2, z: 0.35, angleY: 0.6, spread: 0.8 },
    // Front-mid legs
    { x: -0.25, z: 0.2, angleY: -0.9, spread: 0.9 },
    { x: 0.25, z: 0.2, angleY: 0.9, spread: 0.9 },
    // Back-mid legs
    { x: -0.25, z: 0.05, angleY: -1.2, spread: 1.0 },
    { x: 0.25, z: 0.05, angleY: 1.2, spread: 1.0 },
    // Back legs
    { x: -0.2, z: -0.1, angleY: -1.5, spread: 1.1 },
    { x: 0.2, z: -0.1, angleY: 1.5, spread: 1.1 },
  ];

  for (const config of legConfigs) {
    const legGroup = new THREE.Group();

    // Coxa (first segment - goes up and out)
    const coxa = new THREE.Mesh(legSegmentGeometry, chitinMaterial);
    coxa.position.set(0, 0.15 * bossScale, 0);
    coxa.rotation.z = config.x > 0 ? -0.8 : 0.8;
    legGroup.add(coxa);

    // Femur (second segment - goes out and down)
    const femur = new THREE.Mesh(legMidGeometry, chitinMaterial);
    const femurOffset = config.x > 0 ? 0.25 : -0.25;
    femur.position.set(femurOffset * bossScale, 0.35 * bossScale, 0);
    femur.rotation.z = config.x > 0 ? 0.5 : -0.5;
    legGroup.add(femur);

    // Tibia/Tarsus (third segment - goes down to ground)
    const tibia = new THREE.Mesh(legTipGeometry, chitinMaterial);
    const tibiaOffset = config.x > 0 ? 0.4 : -0.4;
    tibia.position.set(tibiaOffset * bossScale * config.spread, 0.15 * bossScale, 0);
    tibia.rotation.z = config.x > 0 ? 1.2 : -1.2;
    legGroup.add(tibia);

    // Position the leg group
    legGroup.position.set(
      config.x * bossScale,
      0.4 * bossScale,
      config.z * bossScale
    );
    legGroup.rotation.y = config.angleY;

    group.add(legGroup);
  }

  // === EGG SAC (hanging from abdomen) ===
  const eggSacGeometry = new THREE.SphereGeometry(0.25 * bossScale, 10, 8);
  const eggSac = new THREE.Mesh(eggSacGeometry, eggSacMaterial);
  eggSac.position.set(0, 0.2 * bossScale, -0.6 * bossScale);
  eggSac.scale.set(1, 1.2, 1);
  group.add(eggSac);

  // Silk thread connecting egg sac
  const silkGeometry = new THREE.CylinderGeometry(0.01 * bossScale, 0.015 * bossScale, 0.15 * bossScale, 6);
  const silkMaterial = new THREE.MeshStandardMaterial({
    color: 0xcccccc,
    roughness: 0.3,
    transparent: true,
    opacity: 0.7,
  });
  const silk = new THREE.Mesh(silkGeometry, silkMaterial);
  silk.position.set(0, 0.35 * bossScale, -0.55 * bossScale);
  group.add(silk);

  // Eggs visible inside sac (bumps)
  const eggBumpGeometry = new THREE.SphereGeometry(0.06 * bossScale, 6, 6);
  const eggBumpPositions = [
    { x: 0.08, y: 0.18, z: -0.55 },
    { x: -0.1, y: 0.22, z: -0.58 },
    { x: 0.05, y: 0.28, z: -0.62 },
    { x: -0.05, y: 0.15, z: -0.65 },
    { x: 0.1, y: 0.25, z: -0.68 },
  ];
  for (const pos of eggBumpPositions) {
    const bump = new THREE.Mesh(eggBumpGeometry, eggSacMaterial);
    bump.position.set(pos.x * bossScale, pos.y * bossScale, pos.z * bossScale);
    group.add(bump);
  }

  // === CROWN (spider queen marker) ===
  // Crown base
  const crownBaseGeometry = new THREE.TorusGeometry(0.12 * bossScale, 0.015 * bossScale, 6, 16);
  const crownBase = new THREE.Mesh(crownBaseGeometry, goldMaterial);
  crownBase.position.set(0, 0.6 * bossScale, 0.48 * bossScale);
  crownBase.rotation.x = Math.PI * 0.3;
  group.add(crownBase);

  // Crown points (spider leg-shaped)
  const crownPointGeometry = new THREE.ConeGeometry(0.02 * bossScale, 0.08 * bossScale, 4);
  const crownPointPositions = [
    { x: 0, angle: 0 },
    { x: -0.08, angle: -0.4 },
    { x: 0.08, angle: 0.4 },
    { x: -0.1, angle: -0.7 },
    { x: 0.1, angle: 0.7 },
  ];
  for (const pos of crownPointPositions) {
    const point = new THREE.Mesh(crownPointGeometry, goldMaterial);
    point.position.set(
      pos.x * bossScale,
      0.68 * bossScale,
      (0.48 + Math.abs(pos.x) * 0.3) * bossScale
    );
    point.rotation.x = Math.PI * 0.2;
    point.rotation.z = pos.angle;
    group.add(point);
  }

  // Crown jewel (red gem)
  const jewelGeometry = new THREE.OctahedronGeometry(0.03 * bossScale);
  const jewelMaterial = new THREE.MeshStandardMaterial({
    color: 0xff0000,
    emissive: 0x660000,
    emissiveIntensity: 0.5,
    roughness: 0.1,
    metalness: 0.3,
  });
  const jewel = new THREE.Mesh(jewelGeometry, jewelMaterial);
  jewel.position.set(0, 0.72 * bossScale, 0.48 * bossScale);
  group.add(jewel);

  return group;
}

export const SPIDER_QUEEN_META = {
  id: 'spider-queen',
  name: 'Spider Queen',
  category: 'enemy' as const,
  description: 'Floor 3 boss - Giant spider with egg sac and crown',
  defaultScale: 1.5,
  boundingBox: { x: 1.8, y: 1.2, z: 2.0 },
  tags: ['boss', 'spider', 'enemy', 'floor3', 'arachnid'],
  enemyName: 'Spider Queen',
};
