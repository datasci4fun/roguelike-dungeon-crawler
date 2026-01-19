/**
 * Dragon Emperor Boss Model
 * Canonical design based on bestiary appearance.
 *
 * Canonical appearance from bestiary:
 * "Massive dragon with crystalline scales. Wings span the entire chamber. Eyes hold ancient intelligence."
 */

import * as THREE from 'three';

export interface DragonEmperorOptions {
  scale?: number;
}

export function createDragonEmperor(options: DragonEmperorOptions = {}): THREE.Group {
  const { scale = 1.0 } = options;

  const group = new THREE.Group();
  const s = scale * 2.0; // Massive final boss

  // === MATERIALS ===
  // Crystalline scales (canonical - crystalline scales)
  const crystalScaleMaterial = new THREE.MeshStandardMaterial({
    color: 0x6688aa,
    roughness: 0.1,
    metalness: 0.6,
    emissive: 0x334455,
    emissiveIntensity: 0.4,
  });

  // Deep crystal (inner glow)
  const deepCrystalMaterial = new THREE.MeshStandardMaterial({
    color: 0x88aacc,
    roughness: 0.05,
    metalness: 0.7,
    emissive: 0x4466aa,
    emissiveIntensity: 0.6,
    transparent: true,
    opacity: 0.9,
  });

  // Crystal highlights
  const crystalHighlightMaterial = new THREE.MeshStandardMaterial({
    color: 0xaaccee,
    roughness: 0.0,
    metalness: 0.8,
    emissive: 0x6699dd,
    emissiveIntensity: 0.8,
    transparent: true,
    opacity: 0.7,
  });

  // Underbelly (lighter crystal)
  const underbellyMaterial = new THREE.MeshStandardMaterial({
    color: 0x99bbdd,
    roughness: 0.15,
    metalness: 0.5,
    emissive: 0x557799,
    emissiveIntensity: 0.3,
  });

  // Ancient eyes (canonical - hold ancient intelligence)
  const eyeMaterial = new THREE.MeshStandardMaterial({
    color: 0xffdd88,
    roughness: 0.0,
    metalness: 0.1,
    emissive: 0xddaa44,
    emissiveIntensity: 2.5,
  });

  // Eye pupil (intelligent, slit-like)
  const pupilMaterial = new THREE.MeshStandardMaterial({
    color: 0x222222,
    roughness: 0.8,
    metalness: 0.0,
  });

  // Horn material
  const hornMaterial = new THREE.MeshStandardMaterial({
    color: 0x556677,
    roughness: 0.2,
    metalness: 0.4,
    emissive: 0x223344,
    emissiveIntensity: 0.2,
  });

  // Wing membrane (crystalline, translucent)
  const wingMembraneMaterial = new THREE.MeshStandardMaterial({
    color: 0x7799bb,
    roughness: 0.1,
    metalness: 0.3,
    emissive: 0x446688,
    emissiveIntensity: 0.5,
    transparent: true,
    opacity: 0.6,
    side: THREE.DoubleSide,
  });

  // Claw material
  const clawMaterial = new THREE.MeshStandardMaterial({
    color: 0x445566,
    roughness: 0.2,
    metalness: 0.5,
    emissive: 0x223344,
    emissiveIntensity: 0.3,
  });

  // === HEAD (massive, draconic) ===
  const headBase = new THREE.Mesh(
    new THREE.BoxGeometry(0.16 * s, 0.14 * s, 0.22 * s),
    crystalScaleMaterial
  );
  headBase.position.set(0, 0.75 * s, 0.35 * s);
  headBase.rotation.x = 0.2;
  group.add(headBase);

  // Snout
  const snout = new THREE.Mesh(
    new THREE.BoxGeometry(0.1 * s, 0.08 * s, 0.16 * s),
    crystalScaleMaterial
  );
  snout.position.set(0, 0.72 * s, 0.52 * s);
  snout.rotation.x = 0.1;
  group.add(snout);

  // Lower jaw
  const lowerJaw = new THREE.Mesh(
    new THREE.BoxGeometry(0.08 * s, 0.04 * s, 0.14 * s),
    underbellyMaterial
  );
  lowerJaw.position.set(0, 0.66 * s, 0.48 * s);
  group.add(lowerJaw);

  // Nostrils
  const nostrilGeo = new THREE.SphereGeometry(0.015 * s, 6, 4);
  const leftNostril = new THREE.Mesh(nostrilGeo, deepCrystalMaterial);
  leftNostril.position.set(-0.025 * s, 0.74 * s, 0.6 * s);
  group.add(leftNostril);

  const rightNostril = new THREE.Mesh(nostrilGeo, deepCrystalMaterial);
  rightNostril.position.set(0.025 * s, 0.74 * s, 0.6 * s);
  group.add(rightNostril);

  // === EYES (canonical - ancient intelligence) ===
  const eyeGeo = new THREE.SphereGeometry(0.035 * s, 10, 8);

  const leftEye = new THREE.Mesh(eyeGeo, eyeMaterial);
  leftEye.position.set(-0.07 * s, 0.78 * s, 0.42 * s);
  group.add(leftEye);

  const rightEye = new THREE.Mesh(eyeGeo, eyeMaterial);
  rightEye.position.set(0.07 * s, 0.78 * s, 0.42 * s);
  group.add(rightEye);

  // Slit pupils (ancient, intelligent look)
  const pupilGeo = new THREE.BoxGeometry(0.008 * s, 0.04 * s, 0.01 * s);

  const leftPupil = new THREE.Mesh(pupilGeo, pupilMaterial);
  leftPupil.position.set(-0.07 * s, 0.78 * s, 0.46 * s);
  group.add(leftPupil);

  const rightPupil = new THREE.Mesh(pupilGeo, pupilMaterial);
  rightPupil.position.set(0.07 * s, 0.78 * s, 0.46 * s);
  group.add(rightPupil);

  // Eye ridges (brow)
  const browGeo = new THREE.BoxGeometry(0.06 * s, 0.02 * s, 0.04 * s);

  const leftBrow = new THREE.Mesh(browGeo, crystalScaleMaterial);
  leftBrow.position.set(-0.06 * s, 0.82 * s, 0.4 * s);
  leftBrow.rotation.z = 0.2;
  group.add(leftBrow);

  const rightBrow = new THREE.Mesh(browGeo, crystalScaleMaterial);
  rightBrow.position.set(0.06 * s, 0.82 * s, 0.4 * s);
  rightBrow.rotation.z = -0.2;
  group.add(rightBrow);

  // === HORNS (crown-like, crystalline) ===
  const hornGeo = new THREE.ConeGeometry(0.025 * s, 0.18 * s, 5);

  // Main horns (swept back)
  const leftHorn = new THREE.Mesh(hornGeo, hornMaterial);
  leftHorn.position.set(-0.08 * s, 0.88 * s, 0.28 * s);
  leftHorn.rotation.x = -0.6;
  leftHorn.rotation.z = 0.3;
  group.add(leftHorn);

  const rightHorn = new THREE.Mesh(hornGeo, hornMaterial);
  rightHorn.position.set(0.08 * s, 0.88 * s, 0.28 * s);
  rightHorn.rotation.x = -0.6;
  rightHorn.rotation.z = -0.3;
  group.add(rightHorn);

  // Secondary horns
  const smallHornGeo = new THREE.ConeGeometry(0.015 * s, 0.1 * s, 4);

  const leftSmallHorn = new THREE.Mesh(smallHornGeo, hornMaterial);
  leftSmallHorn.position.set(-0.1 * s, 0.82 * s, 0.32 * s);
  leftSmallHorn.rotation.x = -0.4;
  leftSmallHorn.rotation.z = 0.5;
  group.add(leftSmallHorn);

  const rightSmallHorn = new THREE.Mesh(smallHornGeo, hornMaterial);
  rightSmallHorn.position.set(0.1 * s, 0.82 * s, 0.32 * s);
  rightSmallHorn.rotation.x = -0.4;
  rightSmallHorn.rotation.z = -0.5;
  group.add(rightSmallHorn);

  // === NECK (long, serpentine) ===
  const neckGeo = new THREE.CylinderGeometry(0.08 * s, 0.1 * s, 0.2 * s, 8);
  const neck = new THREE.Mesh(neckGeo, crystalScaleMaterial);
  neck.position.set(0, 0.68 * s, 0.2 * s);
  neck.rotation.x = 0.6;
  group.add(neck);

  // Neck scales
  const neckScaleGeo = new THREE.BoxGeometry(0.12 * s, 0.03 * s, 0.08 * s);
  const neckScales = [
    { y: 0.72, z: 0.24 },
    { y: 0.68, z: 0.18 },
    { y: 0.64, z: 0.12 },
  ];

  neckScales.forEach((ns) => {
    const neckScale = new THREE.Mesh(neckScaleGeo, deepCrystalMaterial);
    neckScale.position.set(0, ns.y * s, ns.z * s);
    neckScale.rotation.x = 0.3;
    group.add(neckScale);
  });

  // === TORSO (massive, crystal-armored) ===
  const torso = new THREE.Mesh(
    new THREE.BoxGeometry(0.36 * s, 0.32 * s, 0.4 * s),
    crystalScaleMaterial
  );
  torso.position.y = 0.5 * s;
  group.add(torso);

  // Chest plates (crystalline armor)
  const chestPlateGeo = new THREE.BoxGeometry(0.14 * s, 0.12 * s, 0.05 * s);
  const chestPlates = [
    { x: -0.08, y: 0.54, z: 0.22 },
    { x: 0.08, y: 0.54, z: 0.22 },
    { x: 0, y: 0.46, z: 0.23 },
  ];

  chestPlates.forEach((cp) => {
    const plate = new THREE.Mesh(chestPlateGeo, deepCrystalMaterial);
    plate.position.set(cp.x * s, cp.y * s, cp.z * s);
    group.add(plate);
  });

  // Underbelly
  const belly = new THREE.Mesh(
    new THREE.BoxGeometry(0.28 * s, 0.26 * s, 0.3 * s),
    underbellyMaterial
  );
  belly.position.set(0, 0.48 * s, 0.02 * s);
  group.add(belly);

  // Back spines
  const spineGeo = new THREE.ConeGeometry(0.02 * s, 0.1 * s, 4);
  for (let i = 0; i < 6; i++) {
    const spine = new THREE.Mesh(spineGeo, hornMaterial);
    spine.position.set(0, 0.68 * s, (0.1 - i * 0.12) * s);
    spine.rotation.x = -0.3;
    const height = 0.08 + Math.sin(i * 0.5) * 0.04;
    spine.scale.y = height / 0.1;
    group.add(spine);
  }

  // === WINGS (canonical - span the entire chamber) ===
  const createWing = (side: number) => {
    const wingGroup = new THREE.Group();

    // Wing arm (bone structure)
    const wingArm = new THREE.Mesh(
      new THREE.BoxGeometry(0.04 * s, 0.5 * s, 0.04 * s),
      crystalScaleMaterial
    );
    wingArm.position.set(0, 0.25 * s, 0);
    wingArm.rotation.z = side * 0.8;
    wingGroup.add(wingArm);

    // Wing fingers (3 main spars)
    const fingerGeo = new THREE.BoxGeometry(0.025 * s, 0.4 * s, 0.02 * s);
    const fingers = [
      { angle: 0.3, length: 0.4 },
      { angle: 0.6, length: 0.35 },
      { angle: 0.9, length: 0.28 },
    ];

    fingers.forEach((f, i) => {
      const finger = new THREE.Mesh(fingerGeo, crystalScaleMaterial);
      finger.scale.y = f.length / 0.4;
      finger.position.set(
        Math.cos(side * f.angle) * 0.3 * s,
        Math.sin(side * f.angle) * 0.3 * s + 0.15 * s,
        0.02 * i * s
      );
      finger.rotation.z = side * (0.8 + f.angle * 0.5);
      wingGroup.add(finger);
    });

    // Wing membrane (translucent crystal)
    const membraneShape = new THREE.Shape();
    membraneShape.moveTo(0, 0);
    membraneShape.lineTo(0.45 * s * side, 0.35 * s);
    membraneShape.lineTo(0.5 * s * side, 0.15 * s);
    membraneShape.lineTo(0.4 * s * side, -0.05 * s);
    membraneShape.lineTo(0.2 * s * side, -0.1 * s);
    membraneShape.lineTo(0, 0);

    const membraneGeo = new THREE.ShapeGeometry(membraneShape);
    const membrane = new THREE.Mesh(membraneGeo, wingMembraneMaterial);
    membrane.position.set(0, 0.1 * s, 0.01 * s);
    wingGroup.add(membrane);

    // Wing crystals (decorative)
    const wingCrystalGeo = new THREE.BoxGeometry(0.03 * s, 0.06 * s, 0.02 * s);
    const wingCrystals = [
      { x: 0.2, y: 0.2 },
      { x: 0.35, y: 0.15 },
      { x: 0.25, y: 0.05 },
    ];

    wingCrystals.forEach((wc) => {
      const crystal = new THREE.Mesh(wingCrystalGeo, crystalHighlightMaterial);
      crystal.position.set(wc.x * s * side, wc.y * s, 0.02 * s);
      crystal.rotation.z = Math.random() * 0.3;
      wingGroup.add(crystal);
    });

    wingGroup.position.set(side * 0.18 * s, 0.6 * s, -0.1 * s);
    return wingGroup;
  };

  const leftWing = createWing(-1);
  group.add(leftWing);

  const rightWing = createWing(1);
  group.add(rightWing);

  // === FRONT LEGS ===
  const createLeg = (x: number, isFront: boolean) => {
    const legY = isFront ? 0.32 : 0.28;
    const legZ = isFront ? 0.12 : -0.12;

    // Upper leg
    const upperLeg = new THREE.Mesh(
      new THREE.BoxGeometry(0.08 * s, 0.18 * s, 0.08 * s),
      crystalScaleMaterial
    );
    upperLeg.position.set(x * s, legY * s, legZ * s);
    group.add(upperLeg);

    // Lower leg
    const lowerLeg = new THREE.Mesh(
      new THREE.BoxGeometry(0.06 * s, 0.16 * s, 0.06 * s),
      deepCrystalMaterial
    );
    lowerLeg.position.set(x * s, (legY - 0.14) * s, (legZ + 0.02) * s);
    group.add(lowerLeg);

    // Foot
    const foot = new THREE.Mesh(
      new THREE.BoxGeometry(0.08 * s, 0.04 * s, 0.1 * s),
      crystalScaleMaterial
    );
    foot.position.set(x * s, (legY - 0.24) * s, (legZ + 0.04) * s);
    group.add(foot);

    // Claws
    const clawGeo = new THREE.ConeGeometry(0.012 * s, 0.05 * s, 4);
    for (let c = 0; c < 3; c++) {
      const claw = new THREE.Mesh(clawGeo, clawMaterial);
      claw.position.set(
        (x + (c - 1) * 0.025) * s,
        (legY - 0.26) * s,
        (legZ + 0.08) * s
      );
      claw.rotation.x = Math.PI * 0.6;
      group.add(claw);
    }
  };

  // Four legs
  createLeg(-0.14, true);
  createLeg(0.14, true);
  createLeg(-0.12, false);
  createLeg(0.12, false);

  // === TAIL (long, crystal-tipped) ===
  const tailSegments = [
    { y: 0.4, z: -0.25, w: 0.12, h: 0.1 },
    { y: 0.35, z: -0.38, w: 0.1, h: 0.08 },
    { y: 0.32, z: -0.5, w: 0.08, h: 0.06 },
    { y: 0.3, z: -0.6, w: 0.06, h: 0.05 },
    { y: 0.28, z: -0.68, w: 0.04, h: 0.04 },
  ];

  tailSegments.forEach((ts) => {
    const segment = new THREE.Mesh(
      new THREE.BoxGeometry(ts.w * s, ts.h * s, 0.12 * s),
      crystalScaleMaterial
    );
    segment.position.set(0, ts.y * s, ts.z * s);
    group.add(segment);
  });

  // Tail crystal tip
  const tailTip = new THREE.Mesh(
    new THREE.BoxGeometry(0.06 * s, 0.08 * s, 0.08 * s),
    crystalHighlightMaterial
  );
  tailTip.position.set(0, 0.28 * s, -0.76 * s);
  tailTip.rotation.x = 0.785;
  group.add(tailTip);

  // Tail spines
  const tailSpineGeo = new THREE.ConeGeometry(0.015 * s, 0.06 * s, 4);
  for (let i = 0; i < 4; i++) {
    const tailSpine = new THREE.Mesh(tailSpineGeo, hornMaterial);
    tailSpine.position.set(0, 0.42 * s, (-0.3 - i * 0.12) * s);
    tailSpine.rotation.x = -0.2;
    group.add(tailSpine);
  }

  // === CRYSTAL HOARD BASE (canonical - Crystal Hoard) ===
  const hoardBase = new THREE.Mesh(
    new THREE.CylinderGeometry(0.5 * s, 0.6 * s, 0.04 * s, 12),
    new THREE.MeshStandardMaterial({
      color: 0x88aacc,
      roughness: 0.1,
      metalness: 0.5,
      emissive: 0x446688,
      emissiveIntensity: 0.3,
      transparent: true,
      opacity: 0.6,
    })
  );
  hoardBase.position.y = 0.02 * s;
  group.add(hoardBase);

  // Scattered crystals
  const scatteredCrystalGeo = new THREE.BoxGeometry(0.04 * s, 0.08 * s, 0.04 * s);
  const scatteredCrystals = [
    { x: -0.35, z: 0.2, h: 0.08, rot: 0.3 },
    { x: 0.4, z: 0.15, h: 0.1, rot: -0.2 },
    { x: -0.3, z: -0.25, h: 0.06, rot: 0.4 },
    { x: 0.35, z: -0.2, h: 0.09, rot: -0.3 },
    { x: 0.1, z: 0.4, h: 0.07, rot: 0.1 },
    { x: -0.15, z: 0.38, h: 0.08, rot: -0.15 },
    { x: 0.42, z: 0, h: 0.1, rot: 0.25 },
    { x: -0.4, z: 0.05, h: 0.09, rot: -0.2 },
  ];

  scatteredCrystals.forEach((sc) => {
    const crystal = new THREE.Mesh(scatteredCrystalGeo, crystalHighlightMaterial);
    crystal.position.set(sc.x * s, sc.h * 0.5 * s, sc.z * s);
    crystal.scale.y = sc.h / 0.08;
    crystal.rotation.z = sc.rot;
    crystal.rotation.x = Math.random() * 0.2;
    group.add(crystal);
  });

  return group;
}

export const DRAGON_EMPEROR_META = {
  id: 'dragon-emperor',
  name: 'Dragon Emperor',
  category: 'enemy' as const,
  description: 'Massive dragon with crystalline scales. Wings span the entire chamber. Eyes hold ancient intelligence - canonical design',
  defaultScale: 1.0,
  boundingBox: { x: 1.2, y: 1.0, z: 1.6 },
  tags: ['boss', 'dragon', 'crystal', 'enemy', 'final-boss', 'canonical'],
  enemyName: 'Dragon Emperor',
};
