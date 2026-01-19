/**
 * Dwarf Cleric Player Model
 *
 * Race: Short and stocky with broad shoulders and thick limbs.
 *       Magnificent braided beard, ruddy weathered skin.
 * Class: Divine healer in blessed gold and cream robes with holy symbol.
 *
 * Canonical data from character guide API.
 */

import * as THREE from 'three';
import { createMaterial } from './materials';

export interface DwarfClericOptions {
  scale?: number;
}

export function createDwarfCleric(options: DwarfClericOptions = {}): THREE.Group {
  const { scale = 1.0 } = options;

  // Dwarf proportions: 0.75x human height, wider/stockier
  const dwarfScale = 0.75 * scale;
  const widthMult = 1.3; // Broader than humans

  const group = new THREE.Group();

  // === Materials ===
  // Skin - ruddy weathered (#c9a87c)
  const skinMaterial = new THREE.MeshStandardMaterial({
    color: 0xc9a87c,
    roughness: 0.8,
  });

  // Robes - gold primary (#ffd700)
  const robeMaterial = new THREE.MeshStandardMaterial({
    color: 0xffd700,
    roughness: 0.7,
  });

  // Robe trim - cream secondary (#f5f5dc)
  const trimMaterial = new THREE.MeshStandardMaterial({
    color: 0xf5f5dc,
    roughness: 0.6,
  });

  // Beard - darker brown
  const beardMaterial = new THREE.MeshStandardMaterial({
    color: 0x5c4033,
    roughness: 0.9,
  });

  // Hair - similar to beard
  const hairMaterial = new THREE.MeshStandardMaterial({
    color: 0x4a3728,
    roughness: 0.9,
  });

  // Eyes - amber (#8866aa actually looks purple, use amber per description)
  const eyeMaterial = new THREE.MeshStandardMaterial({
    color: 0xcc8844,
    emissive: 0x442200,
    emissiveIntensity: 0.3,
  });

  // Holy glow (#ffffaa)
  const holyMaterial = new THREE.MeshStandardMaterial({
    color: 0xffd700,
    emissive: 0xffffaa,
    emissiveIntensity: 0.6,
    transparent: true,
    opacity: 0.9,
  });

  // Metal for holy symbol
  const goldMetal = createMaterial('gold');

  // === Robe - layered design for better silhouette ===

  // Upper chest/shoulders
  const chestGeo = new THREE.BoxGeometry(
    0.5 * widthMult * dwarfScale,
    0.25 * dwarfScale,
    0.35 * widthMult * dwarfScale
  );
  const chest = new THREE.Mesh(chestGeo, robeMaterial);
  chest.position.y = 0.78 * dwarfScale;
  group.add(chest);

  // Mid torso (slightly wider)
  const midGeo = new THREE.BoxGeometry(
    0.48 * widthMult * dwarfScale,
    0.2 * dwarfScale,
    0.32 * widthMult * dwarfScale
  );
  const mid = new THREE.Mesh(midGeo, robeMaterial);
  mid.position.y = 0.58 * dwarfScale;
  group.add(mid);

  // Lower robe - tapered layers for flow
  const lowerGeo1 = new THREE.BoxGeometry(
    0.46 * widthMult * dwarfScale,
    0.15 * dwarfScale,
    0.36 * widthMult * dwarfScale
  );
  const lower1 = new THREE.Mesh(lowerGeo1, robeMaterial);
  lower1.position.y = 0.4 * dwarfScale;
  group.add(lower1);

  const lowerGeo2 = new THREE.BoxGeometry(
    0.5 * widthMult * dwarfScale,
    0.15 * dwarfScale,
    0.4 * widthMult * dwarfScale
  );
  const lower2 = new THREE.Mesh(lowerGeo2, robeMaterial);
  lower2.position.y = 0.25 * dwarfScale;
  group.add(lower2);

  const lowerGeo3 = new THREE.BoxGeometry(
    0.55 * widthMult * dwarfScale,
    0.12 * dwarfScale,
    0.44 * widthMult * dwarfScale
  );
  const lower3 = new THREE.Mesh(lowerGeo3, robeMaterial);
  lower3.position.y = 0.12 * dwarfScale;
  group.add(lower3);

  // === Belt with buckle ===
  const beltGeo = new THREE.BoxGeometry(
    0.52 * widthMult * dwarfScale,
    0.06 * dwarfScale,
    0.38 * widthMult * dwarfScale
  );
  const belt = new THREE.Mesh(beltGeo, trimMaterial);
  belt.position.y = 0.48 * dwarfScale;
  group.add(belt);

  // Belt buckle (gold)
  const buckleGeo = new THREE.BoxGeometry(
    0.08 * dwarfScale,
    0.06 * dwarfScale,
    0.03 * dwarfScale
  );
  const buckle = new THREE.Mesh(buckleGeo, goldMetal);
  buckle.position.set(0, 0.48 * dwarfScale, 0.26 * widthMult * dwarfScale);
  group.add(buckle);

  // === Front robe opening detail (cream trim down center) ===
  const frontTrimGeo = new THREE.BoxGeometry(
    0.06 * dwarfScale,
    0.55 * dwarfScale,
    0.02 * dwarfScale
  );
  const frontTrim = new THREE.Mesh(frontTrimGeo, trimMaterial);
  frontTrim.position.set(0, 0.45 * dwarfScale, 0.24 * widthMult * dwarfScale);
  group.add(frontTrim);

  // === Collar ===
  const collarGeo = new THREE.BoxGeometry(
    0.35 * widthMult * dwarfScale,
    0.08 * dwarfScale,
    0.25 * widthMult * dwarfScale
  );
  const collar = new THREE.Mesh(collarGeo, trimMaterial);
  collar.position.y = 0.92 * dwarfScale;
  group.add(collar);

  // === Head (round, sturdy) ===
  const headGeo = new THREE.SphereGeometry(0.18 * dwarfScale, 12, 10);
  const head = new THREE.Mesh(headGeo, skinMaterial);
  head.position.y = 1.05 * dwarfScale;
  head.scale.set(1.1, 0.95, 1.0); // Slightly wider face
  group.add(head);

  // === Eyes ===
  const eyeGeo = new THREE.SphereGeometry(0.025 * dwarfScale, 8, 6);

  const leftEye = new THREE.Mesh(eyeGeo, eyeMaterial);
  leftEye.position.set(-0.06 * dwarfScale, 1.07 * dwarfScale, 0.14 * dwarfScale);
  group.add(leftEye);

  const rightEye = new THREE.Mesh(eyeGeo, eyeMaterial);
  rightEye.position.set(0.06 * dwarfScale, 1.07 * dwarfScale, 0.14 * dwarfScale);
  group.add(rightEye);

  // === Nose (prominent dwarven nose) ===
  const noseGeo = new THREE.BoxGeometry(
    0.04 * dwarfScale,
    0.05 * dwarfScale,
    0.06 * dwarfScale
  );
  const nose = new THREE.Mesh(noseGeo, skinMaterial);
  nose.position.set(0, 1.02 * dwarfScale, 0.17 * dwarfScale);
  group.add(nose);

  // === Magnificent Braided Beard ===
  // Main beard mass
  const beardGeo = new THREE.BoxGeometry(
    0.2 * dwarfScale,
    0.25 * dwarfScale,
    0.12 * dwarfScale
  );
  const beard = new THREE.Mesh(beardGeo, beardMaterial);
  beard.position.set(0, 0.82 * dwarfScale, 0.12 * dwarfScale);
  group.add(beard);

  // Beard braids (two hanging braids)
  const braidGeo = new THREE.CylinderGeometry(
    0.025 * dwarfScale,
    0.015 * dwarfScale,
    0.2 * dwarfScale,
    6
  );

  const leftBraid = new THREE.Mesh(braidGeo, beardMaterial);
  leftBraid.position.set(-0.06 * dwarfScale, 0.65 * dwarfScale, 0.12 * dwarfScale);
  group.add(leftBraid);

  const rightBraid = new THREE.Mesh(braidGeo, beardMaterial);
  rightBraid.position.set(0.06 * dwarfScale, 0.65 * dwarfScale, 0.12 * dwarfScale);
  group.add(rightBraid);

  // Braid rings (gold adornments)
  const ringGeo = new THREE.TorusGeometry(0.02 * dwarfScale, 0.005 * dwarfScale, 6, 8);

  const leftRing = new THREE.Mesh(ringGeo, goldMetal);
  leftRing.position.set(-0.06 * dwarfScale, 0.6 * dwarfScale, 0.12 * dwarfScale);
  leftRing.rotation.x = Math.PI / 2;
  group.add(leftRing);

  const rightRing = new THREE.Mesh(ringGeo, goldMetal);
  rightRing.position.set(0.06 * dwarfScale, 0.6 * dwarfScale, 0.12 * dwarfScale);
  rightRing.rotation.x = Math.PI / 2;
  group.add(rightRing);

  // === Hair (under hood, visible at sides) ===
  const hairGeo = new THREE.SphereGeometry(0.19 * dwarfScale, 10, 8);
  const hair = new THREE.Mesh(hairGeo, hairMaterial);
  hair.position.y = 1.08 * dwarfScale;
  hair.scale.set(1.05, 0.7, 0.9);
  group.add(hair);

  // === Hood ===
  const hoodGeo = new THREE.SphereGeometry(0.22 * dwarfScale, 10, 8, 0, Math.PI * 2, 0, Math.PI * 0.6);
  const hood = new THREE.Mesh(hoodGeo, robeMaterial);
  hood.position.y = 1.12 * dwarfScale;
  hood.rotation.x = -0.2;
  group.add(hood);

  // Hood trim
  const hoodTrimGeo = new THREE.TorusGeometry(0.18 * dwarfScale, 0.02 * dwarfScale, 6, 16, Math.PI);
  const hoodTrim = new THREE.Mesh(hoodTrimGeo, trimMaterial);
  hoodTrim.position.set(0, 1.02 * dwarfScale, 0.08 * dwarfScale);
  hoodTrim.rotation.x = Math.PI / 2 + 0.3;
  hoodTrim.rotation.z = Math.PI;
  group.add(hoodTrim);

  // === Arms (thick dwarven arms in robe sleeves) ===
  const armGeo = new THREE.CylinderGeometry(
    0.08 * dwarfScale,
    0.1 * dwarfScale,
    0.35 * dwarfScale,
    8
  );

  // Left arm (holding holy symbol)
  const leftArm = new THREE.Mesh(armGeo, robeMaterial);
  leftArm.position.set(-0.35 * dwarfScale, 0.6 * dwarfScale, 0.05 * dwarfScale);
  leftArm.rotation.z = 0.3;
  leftArm.rotation.x = -0.4;
  group.add(leftArm);

  // Left hand
  const handGeo = new THREE.SphereGeometry(0.06 * dwarfScale, 8, 6);
  const leftHand = new THREE.Mesh(handGeo, skinMaterial);
  leftHand.position.set(-0.42 * dwarfScale, 0.42 * dwarfScale, 0.15 * dwarfScale);
  group.add(leftHand);

  // Right arm (raised in blessing/casting)
  const rightArm = new THREE.Mesh(armGeo, robeMaterial);
  rightArm.position.set(0.35 * dwarfScale, 0.7 * dwarfScale, 0);
  rightArm.rotation.z = -0.5;
  rightArm.rotation.x = -0.3;
  group.add(rightArm);

  // Right hand (raised)
  const rightHand = new THREE.Mesh(handGeo, skinMaterial);
  rightHand.position.set(0.48 * dwarfScale, 0.55 * dwarfScale, 0.1 * dwarfScale);
  group.add(rightHand);

  // === Holy Symbol (cross on chain) ===
  // Vertical bar
  const crossVertGeo = new THREE.BoxGeometry(
    0.025 * dwarfScale,
    0.12 * dwarfScale,
    0.015 * dwarfScale
  );
  const crossVert = new THREE.Mesh(crossVertGeo, goldMetal);
  crossVert.position.set(-0.42 * dwarfScale, 0.32 * dwarfScale, 0.18 * dwarfScale);
  group.add(crossVert);

  // Horizontal bar
  const crossHorzGeo = new THREE.BoxGeometry(
    0.08 * dwarfScale,
    0.02 * dwarfScale,
    0.015 * dwarfScale
  );
  const crossHorz = new THREE.Mesh(crossHorzGeo, goldMetal);
  crossHorz.position.set(-0.42 * dwarfScale, 0.35 * dwarfScale, 0.18 * dwarfScale);
  group.add(crossHorz);

  // Holy glow around symbol
  const glowGeo = new THREE.SphereGeometry(0.08 * dwarfScale, 8, 8);
  const holyGlow = new THREE.Mesh(glowGeo, holyMaterial);
  holyGlow.position.set(-0.42 * dwarfScale, 0.32 * dwarfScale, 0.18 * dwarfScale);
  group.add(holyGlow);

  // === Feet (sturdy dwarven boots peeking from robe) ===
  const bootGeo = new THREE.BoxGeometry(
    0.12 * dwarfScale,
    0.08 * dwarfScale,
    0.18 * dwarfScale
  );
  const bootMaterial = createMaterial('leather');

  const leftBoot = new THREE.Mesh(bootGeo, bootMaterial);
  leftBoot.position.set(-0.12 * dwarfScale, 0.04 * dwarfScale, 0.02 * dwarfScale);
  group.add(leftBoot);

  const rightBoot = new THREE.Mesh(bootGeo, bootMaterial);
  rightBoot.position.set(0.12 * dwarfScale, 0.04 * dwarfScale, 0.02 * dwarfScale);
  group.add(rightBoot);

  // === Shoulder pauldrons (trim colored) ===
  const pauldronGeo = new THREE.SphereGeometry(0.1 * dwarfScale, 8, 6, 0, Math.PI);

  const leftPauldron = new THREE.Mesh(pauldronGeo, trimMaterial);
  leftPauldron.position.set(-0.32 * dwarfScale, 0.85 * dwarfScale, 0);
  leftPauldron.rotation.z = -0.3;
  group.add(leftPauldron);

  const rightPauldron = new THREE.Mesh(pauldronGeo, trimMaterial);
  rightPauldron.position.set(0.32 * dwarfScale, 0.85 * dwarfScale, 0);
  rightPauldron.rotation.z = 0.3;
  group.add(rightPauldron);

  return group;
}

export const DWARF_CLERIC_META = {
  id: 'player-dwarf-cleric',
  name: 'Dwarf Cleric',
  category: 'player' as const,
  description: 'Stocky dwarven cleric in golden blessed robes with braided beard and holy symbol. Stone guardian - high defense and healing.',
  defaultScale: 1.0,
  boundingBox: { x: 0.8, y: 1.2, z: 0.6 },
  tags: ['player', 'dwarf', 'cleric', 'healer', 'holy', 'divine'],
};
