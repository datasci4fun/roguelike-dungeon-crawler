/**
 * Spider Queen Boss Model v2
 * Canonical design based on bestiary appearance.
 *
 * Canonical appearance from bestiary:
 * "Elephant-sized spider with iridescent carapace. Egg sac pulses on her abdomen. Eight eyes gleam with malice."
 */

import * as THREE from 'three';

export interface SpiderQueenV2Options {
  scale?: number;
}

export function createSpiderQueenV2(options: SpiderQueenV2Options = {}): THREE.Group {
  const { scale = 1.0 } = options;

  const group = new THREE.Group();
  const s = scale * 1.8; // Elephant-sized boss

  // === MATERIALS ===
  // Iridescent carapace (canonical - shimmering purple-green)
  const carapaceMaterial = new THREE.MeshStandardMaterial({
    color: 0x2a2a3a,
    roughness: 0.15,
    metalness: 0.7,
    emissive: 0x1a0a2a,
    emissiveIntensity: 0.3,
  });

  // Iridescent highlight (purple shimmer)
  const iridescentPurpleMaterial = new THREE.MeshStandardMaterial({
    color: 0x4a3a6a,
    roughness: 0.1,
    metalness: 0.8,
    emissive: 0x2a1a4a,
    emissiveIntensity: 0.4,
  });

  // Iridescent highlight (green shimmer)
  const iridescentGreenMaterial = new THREE.MeshStandardMaterial({
    color: 0x2a4a3a,
    roughness: 0.1,
    metalness: 0.8,
    emissive: 0x1a3a2a,
    emissiveIntensity: 0.4,
  });

  // Dark chitin for joints
  const darkChitinMaterial = new THREE.MeshStandardMaterial({
    color: 0x1a1a1a,
    roughness: 0.5,
    metalness: 0.3,
  });

  // Malicious gleaming eyes (canonical)
  const eyeMaterial = new THREE.MeshStandardMaterial({
    color: 0xff4444,
    roughness: 0.0,
    metalness: 0.2,
    emissive: 0xdd2222,
    emissiveIntensity: 2.0,
  });

  // Eye reflection
  const eyeReflectMaterial = new THREE.MeshStandardMaterial({
    color: 0xffaaaa,
    roughness: 0.0,
    metalness: 0.0,
    emissive: 0xff6666,
    emissiveIntensity: 1.5,
  });

  // Egg sac (canonical - pulses)
  const eggSacMaterial = new THREE.MeshStandardMaterial({
    color: 0xeeddcc,
    roughness: 0.4,
    metalness: 0.0,
    emissive: 0x554433,
    emissiveIntensity: 0.3,
    transparent: true,
    opacity: 0.85,
  });

  // Eggs inside
  const eggMaterial = new THREE.MeshStandardMaterial({
    color: 0xffffee,
    roughness: 0.3,
    metalness: 0.0,
    emissive: 0x666655,
    emissiveIntensity: 0.2,
  });

  // Fang material
  const fangMaterial = new THREE.MeshStandardMaterial({
    color: 0x222222,
    roughness: 0.2,
    metalness: 0.4,
    emissive: 0x111111,
    emissiveIntensity: 0.1,
  });

  // Venom drip
  const venomMaterial = new THREE.MeshStandardMaterial({
    color: 0x88ff44,
    roughness: 0.1,
    metalness: 0.0,
    emissive: 0x44aa22,
    emissiveIntensity: 0.8,
    transparent: true,
    opacity: 0.7,
  });

  // === ABDOMEN (massive, with iridescent plates) ===
  // Main abdomen body
  const abdomen = new THREE.Mesh(
    new THREE.BoxGeometry(0.5 * s, 0.4 * s, 0.7 * s),
    carapaceMaterial
  );
  abdomen.position.set(0, 0.38 * s, -0.35 * s);
  group.add(abdomen);

  // Abdomen top plate (iridescent)
  const abdomenTop = new THREE.Mesh(
    new THREE.BoxGeometry(0.45 * s, 0.1 * s, 0.6 * s),
    iridescentPurpleMaterial
  );
  abdomenTop.position.set(0, 0.55 * s, -0.35 * s);
  group.add(abdomenTop);

  // Abdomen side plates
  const sidePlateGeo = new THREE.BoxGeometry(0.08 * s, 0.25 * s, 0.5 * s);

  const leftPlate = new THREE.Mesh(sidePlateGeo, iridescentGreenMaterial);
  leftPlate.position.set(-0.26 * s, 0.42 * s, -0.35 * s);
  leftPlate.rotation.z = 0.2;
  group.add(leftPlate);

  const rightPlate = new THREE.Mesh(sidePlateGeo, iridescentGreenMaterial);
  rightPlate.position.set(0.26 * s, 0.42 * s, -0.35 * s);
  rightPlate.rotation.z = -0.2;
  group.add(rightPlate);

  // Abdomen segments (ridged appearance)
  const segmentGeo = new THREE.BoxGeometry(0.4 * s, 0.06 * s, 0.08 * s);
  for (let i = 0; i < 4; i++) {
    const segment = new THREE.Mesh(segmentGeo, i % 2 === 0 ? iridescentPurpleMaterial : iridescentGreenMaterial);
    segment.position.set(0, 0.5 * s, (-0.1 - i * 0.15) * s);
    group.add(segment);
  }

  // Spinnerets (back of abdomen)
  const spinneretGeo = new THREE.BoxGeometry(0.06 * s, 0.06 * s, 0.1 * s);
  const spinnerets = [
    { x: -0.08, y: 0.32 },
    { x: 0, y: 0.3 },
    { x: 0.08, y: 0.32 },
  ];
  spinnerets.forEach((sp) => {
    const spinneret = new THREE.Mesh(spinneretGeo, darkChitinMaterial);
    spinneret.position.set(sp.x * s, sp.y * s, -0.72 * s);
    group.add(spinneret);
  });

  // === CEPHALOTHORAX (front body) ===
  const cephalothorax = new THREE.Mesh(
    new THREE.BoxGeometry(0.35 * s, 0.25 * s, 0.35 * s),
    carapaceMaterial
  );
  cephalothorax.position.set(0, 0.35 * s, 0.15 * s);
  group.add(cephalothorax);

  // Cephalothorax top (iridescent shield)
  const cephTop = new THREE.Mesh(
    new THREE.BoxGeometry(0.3 * s, 0.08 * s, 0.3 * s),
    iridescentPurpleMaterial
  );
  cephTop.position.set(0, 0.48 * s, 0.15 * s);
  group.add(cephTop);

  // === HEAD ===
  const head = new THREE.Mesh(
    new THREE.BoxGeometry(0.2 * s, 0.16 * s, 0.18 * s),
    carapaceMaterial
  );
  head.position.set(0, 0.38 * s, 0.4 * s);
  group.add(head);

  // Head plate
  const headPlate = new THREE.Mesh(
    new THREE.BoxGeometry(0.18 * s, 0.06 * s, 0.15 * s),
    iridescentGreenMaterial
  );
  headPlate.position.set(0, 0.46 * s, 0.42 * s);
  group.add(headPlate);

  // === EIGHT GLEAMING MALICIOUS EYES (canonical) ===
  // Main eyes (large, front-facing)
  const mainEyeGeo = new THREE.SphereGeometry(0.04 * s, 8, 6);

  const leftMainEye = new THREE.Mesh(mainEyeGeo, eyeMaterial);
  leftMainEye.position.set(-0.055 * s, 0.42 * s, 0.48 * s);
  group.add(leftMainEye);

  const rightMainEye = new THREE.Mesh(mainEyeGeo, eyeMaterial);
  rightMainEye.position.set(0.055 * s, 0.42 * s, 0.48 * s);
  group.add(rightMainEye);

  // Eye gleam highlights
  const gleamGeo = new THREE.SphereGeometry(0.015 * s, 4, 4);

  const leftGleam = new THREE.Mesh(gleamGeo, eyeReflectMaterial);
  leftGleam.position.set(-0.045 * s, 0.44 * s, 0.5 * s);
  group.add(leftGleam);

  const rightGleam = new THREE.Mesh(gleamGeo, eyeReflectMaterial);
  rightGleam.position.set(0.065 * s, 0.44 * s, 0.5 * s);
  group.add(rightGleam);

  // Secondary eyes (medium, lateral)
  const secondEyeGeo = new THREE.SphereGeometry(0.028 * s, 6, 5);
  const secondaryEyes = [
    { x: -0.09, y: 0.4, z: 0.45 },
    { x: 0.09, y: 0.4, z: 0.45 },
    { x: -0.1, y: 0.44, z: 0.42 },
    { x: 0.1, y: 0.44, z: 0.42 },
  ];

  secondaryEyes.forEach((e) => {
    const eye = new THREE.Mesh(secondEyeGeo, eyeMaterial);
    eye.position.set(e.x * s, e.y * s, e.z * s);
    group.add(eye);
  });

  // Tertiary eyes (small, top)
  const smallEyeGeo = new THREE.SphereGeometry(0.018 * s, 5, 4);
  const smallEyes = [
    { x: -0.04, y: 0.47, z: 0.44 },
    { x: 0.04, y: 0.47, z: 0.44 },
  ];

  smallEyes.forEach((e) => {
    const eye = new THREE.Mesh(smallEyeGeo, eyeMaterial);
    eye.position.set(e.x * s, e.y * s, e.z * s);
    group.add(eye);
  });

  // === CHELICERAE (fangs) ===
  const cheliceraGeo = new THREE.BoxGeometry(0.06 * s, 0.1 * s, 0.08 * s);

  const leftChelicera = new THREE.Mesh(cheliceraGeo, darkChitinMaterial);
  leftChelicera.position.set(-0.05 * s, 0.32 * s, 0.48 * s);
  group.add(leftChelicera);

  const rightChelicera = new THREE.Mesh(cheliceraGeo, darkChitinMaterial);
  rightChelicera.position.set(0.05 * s, 0.32 * s, 0.48 * s);
  group.add(rightChelicera);

  // Fangs (curved)
  const fangGeo = new THREE.BoxGeometry(0.025 * s, 0.12 * s, 0.02 * s);

  const leftFang = new THREE.Mesh(fangGeo, fangMaterial);
  leftFang.position.set(-0.04 * s, 0.24 * s, 0.52 * s);
  leftFang.rotation.x = 0.4;
  leftFang.rotation.z = 0.2;
  group.add(leftFang);

  const rightFang = new THREE.Mesh(fangGeo, fangMaterial);
  rightFang.position.set(0.04 * s, 0.24 * s, 0.52 * s);
  rightFang.rotation.x = 0.4;
  rightFang.rotation.z = -0.2;
  group.add(rightFang);

  // Venom drips from fangs
  const venomDripGeo = new THREE.BoxGeometry(0.015 * s, 0.04 * s, 0.01 * s);

  const leftVenom = new THREE.Mesh(venomDripGeo, venomMaterial);
  leftVenom.position.set(-0.035 * s, 0.16 * s, 0.54 * s);
  group.add(leftVenom);

  const rightVenom = new THREE.Mesh(venomDripGeo, venomMaterial);
  rightVenom.position.set(0.035 * s, 0.17 * s, 0.54 * s);
  group.add(rightVenom);

  // Pedipalps (sensory appendages)
  const pedipalpGeo = new THREE.BoxGeometry(0.03 * s, 0.08 * s, 0.04 * s);

  const leftPedipalp = new THREE.Mesh(pedipalpGeo, darkChitinMaterial);
  leftPedipalp.position.set(-0.1 * s, 0.3 * s, 0.45 * s);
  leftPedipalp.rotation.x = 0.5;
  leftPedipalp.rotation.z = 0.3;
  group.add(leftPedipalp);

  const rightPedipalp = new THREE.Mesh(pedipalpGeo, darkChitinMaterial);
  rightPedipalp.position.set(0.1 * s, 0.3 * s, 0.45 * s);
  rightPedipalp.rotation.x = 0.5;
  rightPedipalp.rotation.z = -0.3;
  group.add(rightPedipalp);

  // === LEGS (8 legs, articulated) ===
  const createLeg = (baseX: number, baseZ: number, angleY: number, legLength: number) => {
    const side = baseX > 0 ? 1 : -1;

    // Coxa (hip joint)
    const coxa = new THREE.Mesh(
      new THREE.BoxGeometry(0.06 * s, 0.06 * s, 0.08 * s),
      darkChitinMaterial
    );
    coxa.position.set(baseX * s, 0.35 * s, baseZ * s);
    coxa.rotation.y = angleY;
    group.add(coxa);

    // Femur (upper leg - goes up and out)
    const femur = new THREE.Mesh(
      new THREE.BoxGeometry(0.04 * s, 0.25 * s * legLength, 0.04 * s),
      carapaceMaterial
    );
    const femurX = baseX + side * 0.12 * legLength;
    femur.position.set(femurX * s, 0.48 * s, baseZ * s);
    femur.rotation.z = side * -0.7;
    femur.rotation.y = angleY * 0.5;
    group.add(femur);

    // Patella (knee)
    const patella = new THREE.Mesh(
      new THREE.BoxGeometry(0.05 * s, 0.05 * s, 0.05 * s),
      iridescentPurpleMaterial
    );
    const patellaX = baseX + side * 0.22 * legLength;
    patella.position.set(patellaX * s, 0.58 * s, baseZ * s);
    group.add(patella);

    // Tibia (lower leg - goes down)
    const tibia = new THREE.Mesh(
      new THREE.BoxGeometry(0.035 * s, 0.3 * s * legLength, 0.035 * s),
      carapaceMaterial
    );
    const tibiaX = baseX + side * 0.35 * legLength;
    tibia.position.set(tibiaX * s, 0.38 * s, baseZ * s);
    tibia.rotation.z = side * 0.5;
    tibia.rotation.y = angleY * 0.3;
    group.add(tibia);

    // Tarsus (foot)
    const tarsus = new THREE.Mesh(
      new THREE.BoxGeometry(0.03 * s, 0.15 * s * legLength, 0.025 * s),
      darkChitinMaterial
    );
    const tarsusX = baseX + side * 0.42 * legLength;
    tarsus.position.set(tarsusX * s, 0.12 * s, baseZ * s);
    tarsus.rotation.z = side * 1.0;
    group.add(tarsus);

    // Claw
    const claw = new THREE.Mesh(
      new THREE.BoxGeometry(0.025 * s, 0.04 * s, 0.02 * s),
      fangMaterial
    );
    const clawX = baseX + side * 0.48 * legLength;
    claw.position.set(clawX * s, 0.02 * s, baseZ * s);
    group.add(claw);
  };

  // Front legs (shorter, forward)
  createLeg(-0.18, 0.28, -0.4, 0.85);
  createLeg(0.18, 0.28, 0.4, 0.85);

  // Front-mid legs (longest)
  createLeg(-0.22, 0.12, -0.8, 1.0);
  createLeg(0.22, 0.12, 0.8, 1.0);

  // Back-mid legs
  createLeg(-0.22, -0.05, -1.2, 0.95);
  createLeg(0.22, -0.05, 1.2, 0.95);

  // Back legs (angled backward)
  createLeg(-0.18, -0.18, -1.6, 0.9);
  createLeg(0.18, -0.18, 1.6, 0.9);

  // === EGG SAC (canonical - pulses on abdomen) ===
  // Main egg sac
  const eggSac = new THREE.Mesh(
    new THREE.BoxGeometry(0.28 * s, 0.3 * s, 0.25 * s),
    eggSacMaterial
  );
  eggSac.position.set(0, 0.18 * s, -0.5 * s);
  group.add(eggSac);

  // Egg sac bottom (rounded)
  const eggSacBottom = new THREE.Mesh(
    new THREE.BoxGeometry(0.24 * s, 0.12 * s, 0.2 * s),
    eggSacMaterial
  );
  eggSacBottom.position.set(0, 0.06 * s, -0.5 * s);
  group.add(eggSacBottom);

  // Silk attachment to abdomen
  const silkGeo = new THREE.BoxGeometry(0.1 * s, 0.08 * s, 0.08 * s);
  const silk = new THREE.Mesh(silkGeo, eggSacMaterial);
  silk.position.set(0, 0.3 * s, -0.45 * s);
  group.add(silk);

  // Visible eggs inside (bumps showing through)
  const eggGeo = new THREE.SphereGeometry(0.04 * s, 6, 5);
  const eggPositions = [
    { x: 0.06, y: 0.2, z: -0.45 },
    { x: -0.08, y: 0.18, z: -0.48 },
    { x: 0.02, y: 0.12, z: -0.52 },
    { x: -0.04, y: 0.22, z: -0.55 },
    { x: 0.07, y: 0.1, z: -0.48 },
    { x: -0.06, y: 0.08, z: -0.5 },
    { x: 0, y: 0.15, z: -0.58 },
    { x: 0.04, y: 0.06, z: -0.54 },
  ];

  eggPositions.forEach((ep) => {
    const egg = new THREE.Mesh(eggGeo, eggMaterial);
    egg.position.set(ep.x * s, ep.y * s, ep.z * s);
    group.add(egg);
  });

  // Pulsing glow effect around egg sac
  const pulseGlow = new THREE.Mesh(
    new THREE.BoxGeometry(0.32 * s, 0.35 * s, 0.3 * s),
    new THREE.MeshStandardMaterial({
      color: 0xffeecc,
      roughness: 0.5,
      metalness: 0.0,
      emissive: 0x664422,
      emissiveIntensity: 0.4,
      transparent: true,
      opacity: 0.25,
    })
  );
  pulseGlow.position.set(0, 0.16 * s, -0.5 * s);
  group.add(pulseGlow);

  return group;
}

export const SPIDER_QUEEN_V2_META = {
  id: 'spider-queen-v2',
  name: 'Spider Queen',
  category: 'enemy' as const,
  description: 'Elephant-sized spider with iridescent carapace. Egg sac pulses on her abdomen. Eight eyes gleam with malice - canonical design',
  defaultScale: 1.0,
  boundingBox: { x: 1.8, y: 0.8, z: 1.6 },
  tags: ['boss', 'spider', 'enemy', 'arachnid', 'canonical'],
  enemyName: 'Spider Queen',
  version: 2,
  isActive: true,
  baseModelId: 'spider-queen',
};
