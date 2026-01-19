/**
 * Necromancer Enemy Model
 * Canonical design based on bestiary appearance.
 *
 * Canonical appearance from bestiary:
 * "Robed figure with pale skin and glowing purple eyes. Carries a staff topped with a skull."
 */

import * as THREE from 'three';
import { createMaterial } from './materials';

export interface NecromancerOptions {
  scale?: number;
}

export function createNecromancer(options: NecromancerOptions = {}): THREE.Group {
  const { scale = 1.0 } = options;

  const group = new THREE.Group();
  const s = scale;

  // === MATERIALS ===
  // Pale skin (canonical)
  const skinMaterial = new THREE.MeshStandardMaterial({
    color: 0xc8c0b0,
    roughness: 0.7,
    metalness: 0.0,
  });

  // Dark robes
  const robeMaterial = new THREE.MeshStandardMaterial({
    color: 0x1a1a2a,
    roughness: 0.9,
    metalness: 0.0,
  });

  const robeAccentMaterial = new THREE.MeshStandardMaterial({
    color: 0x2a1a3a,
    roughness: 0.85,
    metalness: 0.1,
  });

  // Glowing purple eyes (canonical)
  const eyeMaterial = new THREE.MeshStandardMaterial({
    color: 0xaa44ff,
    roughness: 0.2,
    metalness: 0.0,
    emissive: 0x8822cc,
    emissiveIntensity: 1.5,
  });

  // Staff wood
  const staffMaterial = createMaterial('darkWood');

  // Skull on staff
  const skullMaterial = createMaterial('bone');

  // Dark energy glow
  const darkEnergyMaterial = new THREE.MeshStandardMaterial({
    color: 0x6622aa,
    roughness: 0.3,
    metalness: 0.0,
    emissive: 0x4411aa,
    emissiveIntensity: 0.8,
    transparent: true,
    opacity: 0.7,
  });

  // === HEAD ===
  const head = new THREE.Mesh(
    new THREE.BoxGeometry(0.1 * s, 0.12 * s, 0.1 * s),
    skinMaterial
  );
  head.position.y = 0.72 * s;
  group.add(head);

  // Sunken cheeks (gaunt appearance)
  const cheekGeo = new THREE.BoxGeometry(0.02 * s, 0.04 * s, 0.02 * s);

  const leftCheek = new THREE.Mesh(cheekGeo, new THREE.MeshStandardMaterial({
    color: 0x9a9080,
    roughness: 0.8,
  }));
  leftCheek.position.set(-0.04 * s, 0.7 * s, 0.04 * s);
  group.add(leftCheek);

  const rightCheek = leftCheek.clone();
  rightCheek.position.set(0.04 * s, 0.7 * s, 0.04 * s);
  group.add(rightCheek);

  // Glowing purple eyes (canonical)
  const eyeGeo = new THREE.SphereGeometry(0.018 * s, 6, 4);

  const leftEye = new THREE.Mesh(eyeGeo, eyeMaterial);
  leftEye.position.set(-0.028 * s, 0.74 * s, 0.05 * s);
  group.add(leftEye);

  const rightEye = new THREE.Mesh(eyeGeo, eyeMaterial);
  rightEye.position.set(0.028 * s, 0.74 * s, 0.05 * s);
  group.add(rightEye);

  // Hood
  const hood = new THREE.Mesh(
    new THREE.BoxGeometry(0.14 * s, 0.14 * s, 0.12 * s),
    robeMaterial
  );
  hood.position.set(0, 0.74 * s, -0.01 * s);
  group.add(hood);

  // Hood peak
  const hoodPeak = new THREE.Mesh(
    new THREE.BoxGeometry(0.1 * s, 0.06 * s, 0.08 * s),
    robeMaterial
  );
  hoodPeak.position.set(0, 0.82 * s, 0.02 * s);
  group.add(hoodPeak);

  // Hood shadow over face
  const hoodBrim = new THREE.Mesh(
    new THREE.BoxGeometry(0.12 * s, 0.02 * s, 0.06 * s),
    robeMaterial
  );
  hoodBrim.position.set(0, 0.78 * s, 0.06 * s);
  group.add(hoodBrim);

  // === TORSO (robed) ===
  const torso = new THREE.Mesh(
    new THREE.BoxGeometry(0.18 * s, 0.24 * s, 0.12 * s),
    robeMaterial
  );
  torso.position.y = 0.52 * s;
  group.add(torso);

  // Robe collar
  const collar = new THREE.Mesh(
    new THREE.BoxGeometry(0.16 * s, 0.04 * s, 0.1 * s),
    robeAccentMaterial
  );
  collar.position.set(0, 0.64 * s, 0.02 * s);
  group.add(collar);

  // Robe trim (dark purple accent)
  const trimGeo = new THREE.BoxGeometry(0.19 * s, 0.02 * s, 0.13 * s);

  const upperTrim = new THREE.Mesh(trimGeo, robeAccentMaterial);
  upperTrim.position.set(0, 0.58 * s, 0);
  group.add(upperTrim);

  const lowerTrim = new THREE.Mesh(trimGeo, robeAccentMaterial);
  lowerTrim.position.set(0, 0.46 * s, 0);
  group.add(lowerTrim);

  // === ROBE SKIRT ===
  const robeSkirt = new THREE.Mesh(
    new THREE.BoxGeometry(0.22 * s, 0.32 * s, 0.16 * s),
    robeMaterial
  );
  robeSkirt.position.y = 0.24 * s;
  group.add(robeSkirt);

  // Robe bottom flare
  const robeBottom = new THREE.Mesh(
    new THREE.BoxGeometry(0.26 * s, 0.08 * s, 0.18 * s),
    robeMaterial
  );
  robeBottom.position.y = 0.08 * s;
  group.add(robeBottom);

  // Robe splits (front)
  const robeSplitGeo = new THREE.BoxGeometry(0.01 * s, 0.2 * s, 0.02 * s);

  const leftSplit = new THREE.Mesh(robeSplitGeo, robeAccentMaterial);
  leftSplit.position.set(-0.06 * s, 0.18 * s, 0.08 * s);
  group.add(leftSplit);

  const rightSplit = new THREE.Mesh(robeSplitGeo, robeAccentMaterial);
  rightSplit.position.set(0.06 * s, 0.18 * s, 0.08 * s);
  group.add(rightSplit);

  // === ARMS ===
  // Left arm (at side)
  const leftSleeve = new THREE.Mesh(
    new THREE.BoxGeometry(0.08 * s, 0.2 * s, 0.08 * s),
    robeMaterial
  );
  leftSleeve.position.set(-0.14 * s, 0.46 * s, 0);
  leftSleeve.rotation.z = 0.15;
  group.add(leftSleeve);

  const leftHand = new THREE.Mesh(
    new THREE.BoxGeometry(0.04 * s, 0.05 * s, 0.03 * s),
    skinMaterial
  );
  leftHand.position.set(-0.16 * s, 0.34 * s, 0);
  group.add(leftHand);

  // Right arm (holding staff)
  const rightSleeve = new THREE.Mesh(
    new THREE.BoxGeometry(0.08 * s, 0.18 * s, 0.08 * s),
    robeMaterial
  );
  rightSleeve.position.set(0.14 * s, 0.48 * s, 0.04 * s);
  rightSleeve.rotation.z = -0.2;
  rightSleeve.rotation.x = -0.15;
  group.add(rightSleeve);

  const rightHand = new THREE.Mesh(
    new THREE.BoxGeometry(0.04 * s, 0.05 * s, 0.03 * s),
    skinMaterial
  );
  rightHand.position.set(0.18 * s, 0.38 * s, 0.08 * s);
  group.add(rightHand);

  // === STAFF WITH SKULL (canonical) ===
  // Staff shaft
  const staffShaft = new THREE.Mesh(
    new THREE.CylinderGeometry(0.015 * s, 0.018 * s, 0.7 * s, 6),
    staffMaterial
  );
  staffShaft.position.set(0.22 * s, 0.45 * s, 0.1 * s);
  staffShaft.rotation.x = 0.1;
  staffShaft.rotation.z = -0.15;
  group.add(staffShaft);

  // Staff skull (canonical - "staff topped with a skull")
  const staffSkull = new THREE.Mesh(
    new THREE.SphereGeometry(0.045 * s, 6, 5),
    skullMaterial
  );
  staffSkull.position.set(0.26 * s, 0.78 * s, 0.14 * s);
  staffSkull.scale.set(1, 1.1, 0.9);
  group.add(staffSkull);

  // Skull jaw
  const skullJaw = new THREE.Mesh(
    new THREE.BoxGeometry(0.04 * s, 0.02 * s, 0.03 * s),
    skullMaterial
  );
  skullJaw.position.set(0.26 * s, 0.73 * s, 0.16 * s);
  group.add(skullJaw);

  // Skull eye sockets (glowing)
  const skullEyeGeo = new THREE.SphereGeometry(0.012 * s, 4, 4);

  const skullLeftEye = new THREE.Mesh(skullEyeGeo, darkEnergyMaterial);
  skullLeftEye.position.set(0.245 * s, 0.79 * s, 0.175 * s);
  group.add(skullLeftEye);

  const skullRightEye = new THREE.Mesh(skullEyeGeo, darkEnergyMaterial);
  skullRightEye.position.set(0.275 * s, 0.79 * s, 0.175 * s);
  group.add(skullRightEye);

  // Dark energy aura around skull
  const skullAura = new THREE.Mesh(
    new THREE.SphereGeometry(0.06 * s, 6, 6),
    darkEnergyMaterial
  );
  skullAura.position.set(0.26 * s, 0.78 * s, 0.14 * s);
  group.add(skullAura);

  // Staff base (iron cap)
  const staffBase = new THREE.Mesh(
    new THREE.CylinderGeometry(0.02 * s, 0.015 * s, 0.04 * s, 6),
    createMaterial('iron')
  );
  staffBase.position.set(0.18 * s, 0.12 * s, 0.06 * s);
  staffBase.rotation.x = 0.1;
  staffBase.rotation.z = -0.15;
  group.add(staffBase);

  // === BELT ===
  const belt = new THREE.Mesh(
    new THREE.BoxGeometry(0.2 * s, 0.04 * s, 0.14 * s),
    robeAccentMaterial
  );
  belt.position.set(0, 0.4 * s, 0);
  group.add(belt);

  // Belt buckle (skull motif)
  const beltBuckle = new THREE.Mesh(
    new THREE.BoxGeometry(0.04 * s, 0.035 * s, 0.02 * s),
    createMaterial('silver')
  );
  beltBuckle.position.set(0, 0.4 * s, 0.08 * s);
  group.add(beltBuckle);

  // === FEET (barely visible under robe) ===
  const footGeo = new THREE.BoxGeometry(0.05 * s, 0.02 * s, 0.08 * s);

  const leftFoot = new THREE.Mesh(footGeo, robeMaterial);
  leftFoot.position.set(-0.06 * s, 0.03 * s, 0.02 * s);
  group.add(leftFoot);

  const rightFoot = new THREE.Mesh(footGeo, robeMaterial);
  rightFoot.position.set(0.06 * s, 0.03 * s, 0.02 * s);
  group.add(rightFoot);

  // === DARK ENERGY WISPS (around hands) ===
  const wispGeo = new THREE.SphereGeometry(0.02 * s, 4, 4);

  const leftWisp1 = new THREE.Mesh(wispGeo, darkEnergyMaterial);
  leftWisp1.position.set(-0.18 * s, 0.32 * s, 0.02 * s);
  group.add(leftWisp1);

  const leftWisp2 = new THREE.Mesh(wispGeo, darkEnergyMaterial);
  leftWisp2.position.set(-0.14 * s, 0.3 * s, -0.02 * s);
  group.add(leftWisp2);

  return group;
}

export const NECROMANCER_META = {
  id: 'necromancer',
  name: 'Necromancer',
  category: 'enemy' as const,
  description: 'Robed figure with pale skin and glowing purple eyes. Carries a staff topped with a skull - canonical design',
  defaultScale: 1.0,
  boundingBox: { x: 0.5, y: 0.85, z: 0.3 },
  tags: ['necromancer', 'mage', 'undead', 'enemy', 'creature', 'humanoid', 'dark', 'canonical'],
  enemyName: 'Necromancer',
};
