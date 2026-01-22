/**
 * Dragon Enemy Model
 * Canonical design based on bestiary appearance.
 *
 * Canonical appearance from bestiary:
 * "Massive scaled reptile with wings and glowing eyes. Flames lick between its teeth."
 */

import * as THREE from 'three';

export interface DragonOptions {
  scale?: number;
}

export function createDragon(options: DragonOptions = {}): THREE.Group {
  const { scale = 1.0 } = options;

  const group = new THREE.Group();
  const s = scale * 1.8; // Massive creature

  // === MATERIALS ===
  // Dark red/crimson scales (fire resistance)
  const scaleMaterial = new THREE.MeshStandardMaterial({
    color: 0x8b1a1a,
    roughness: 0.4,
    metalness: 0.3,
  });

  const darkScaleMaterial = new THREE.MeshStandardMaterial({
    color: 0x5a1010,
    roughness: 0.5,
    metalness: 0.2,
  });

  // Underbelly (lighter)
  const bellyMaterial = new THREE.MeshStandardMaterial({
    color: 0xaa6633,
    roughness: 0.6,
    metalness: 0.1,
  });

  // Glowing eyes (canonical)
  const eyeMaterial = new THREE.MeshStandardMaterial({
    color: 0xffaa00,
    roughness: 0.2,
    metalness: 0.0,
    emissive: 0xff6600,
    emissiveIntensity: 1.5,
  });

  // Wing membrane
  const wingMaterial = new THREE.MeshStandardMaterial({
    color: 0x6a2020,
    roughness: 0.7,
    metalness: 0.1,
    transparent: true,
    opacity: 0.85,
  });

  // Flame material (for mouth flames)
  const flameMaterial = new THREE.MeshStandardMaterial({
    color: 0xff4400,
    roughness: 0.3,
    metalness: 0.0,
    emissive: 0xff2200,
    emissiveIntensity: 1.2,
  });

  // Teeth/claws
  const toothMaterial = new THREE.MeshStandardMaterial({
    color: 0xfffff0,
    roughness: 0.4,
    metalness: 0.1,
  });

  // Horns
  const hornMaterial = new THREE.MeshStandardMaterial({
    color: 0x2a2a2a,
    roughness: 0.5,
    metalness: 0.2,
  });

  // === HEAD ===
  // Long reptilian snout
  const skull = new THREE.Mesh(
    new THREE.BoxGeometry(0.14 * s, 0.1 * s, 0.18 * s),
    scaleMaterial
  );
  skull.position.set(0, 0.62 * s, 0.22 * s);
  group.add(skull);

  const snout = new THREE.Mesh(
    new THREE.BoxGeometry(0.1 * s, 0.07 * s, 0.14 * s),
    scaleMaterial
  );
  snout.position.set(0, 0.58 * s, 0.36 * s);
  group.add(snout);

  // Upper jaw ridge
  const jawRidge = new THREE.Mesh(
    new THREE.BoxGeometry(0.08 * s, 0.03 * s, 0.12 * s),
    darkScaleMaterial
  );
  jawRidge.position.set(0, 0.62 * s, 0.38 * s);
  group.add(jawRidge);

  // Lower jaw
  const lowerJaw = new THREE.Mesh(
    new THREE.BoxGeometry(0.08 * s, 0.04 * s, 0.16 * s),
    scaleMaterial
  );
  lowerJaw.position.set(0, 0.52 * s, 0.32 * s);
  group.add(lowerJaw);

  // Glowing eyes (canonical)
  const eyeGeo = new THREE.SphereGeometry(0.025 * s, 6, 6);

  const leftEye = new THREE.Mesh(eyeGeo, eyeMaterial);
  leftEye.position.set(-0.055 * s, 0.64 * s, 0.28 * s);
  group.add(leftEye);

  const rightEye = new THREE.Mesh(eyeGeo, eyeMaterial);
  rightEye.position.set(0.055 * s, 0.64 * s, 0.28 * s);
  group.add(rightEye);

  // Nostrils
  const nostrilGeo = new THREE.BoxGeometry(0.015 * s, 0.015 * s, 0.02 * s);

  const leftNostril = new THREE.Mesh(nostrilGeo, darkScaleMaterial);
  leftNostril.position.set(-0.025 * s, 0.6 * s, 0.44 * s);
  group.add(leftNostril);

  const rightNostril = new THREE.Mesh(nostrilGeo, darkScaleMaterial);
  rightNostril.position.set(0.025 * s, 0.6 * s, 0.44 * s);
  group.add(rightNostril);

  // Teeth (upper)
  const toothGeo = new THREE.BoxGeometry(0.012 * s, 0.025 * s, 0.012 * s);
  for (let i = 0; i < 5; i++) {
    const leftTooth = new THREE.Mesh(toothGeo, toothMaterial);
    leftTooth.position.set(-0.03 * s, 0.545 * s, (0.28 + i * 0.035) * s);
    group.add(leftTooth);

    const rightTooth = new THREE.Mesh(toothGeo, toothMaterial);
    rightTooth.position.set(0.03 * s, 0.545 * s, (0.28 + i * 0.035) * s);
    group.add(rightTooth);
  }

  // Flames between teeth (canonical - "Flames lick between its teeth")
  const flameGeo = new THREE.BoxGeometry(0.015 * s, 0.02 * s, 0.015 * s);
  const flames = [
    { x: -0.015, y: 0.54, z: 0.32 },
    { x: 0.015, y: 0.535, z: 0.35 },
    { x: 0, y: 0.54, z: 0.38 },
    { x: -0.02, y: 0.535, z: 0.4 },
    { x: 0.02, y: 0.54, z: 0.36 },
  ];
  flames.forEach((f) => {
    const flame = new THREE.Mesh(flameGeo, flameMaterial);
    flame.position.set(f.x * s, f.y * s, f.z * s);
    group.add(flame);
  });

  // Horns
  const hornGeo = new THREE.BoxGeometry(0.025 * s, 0.08 * s, 0.025 * s);

  const leftHorn = new THREE.Mesh(hornGeo, hornMaterial);
  leftHorn.position.set(-0.06 * s, 0.7 * s, 0.16 * s);
  leftHorn.rotation.x = -0.4;
  leftHorn.rotation.z = -0.2;
  group.add(leftHorn);

  const rightHorn = new THREE.Mesh(hornGeo, hornMaterial);
  rightHorn.position.set(0.06 * s, 0.7 * s, 0.16 * s);
  rightHorn.rotation.x = -0.4;
  rightHorn.rotation.z = 0.2;
  group.add(rightHorn);

  // Head spines
  const spineGeo = new THREE.BoxGeometry(0.015 * s, 0.04 * s, 0.02 * s);
  for (let i = 0; i < 4; i++) {
    const spine = new THREE.Mesh(spineGeo, darkScaleMaterial);
    spine.position.set(0, 0.68 * s, (0.12 - i * 0.04) * s);
    spine.rotation.x = -0.3;
    group.add(spine);
  }

  // === NECK ===
  const neckGeo = new THREE.BoxGeometry(0.12 * s, 0.1 * s, 0.14 * s);

  const neck1 = new THREE.Mesh(neckGeo, scaleMaterial);
  neck1.position.set(0, 0.56 * s, 0.08 * s);
  neck1.rotation.x = 0.3;
  group.add(neck1);

  const neck2 = new THREE.Mesh(neckGeo, scaleMaterial);
  neck2.position.set(0, 0.48 * s, -0.02 * s);
  neck2.rotation.x = 0.2;
  group.add(neck2);

  // Neck spines
  for (let i = 0; i < 3; i++) {
    const neckSpine = new THREE.Mesh(spineGeo, darkScaleMaterial);
    neckSpine.position.set(0, 0.58 * s - i * 0.06 * s, 0.02 * s - i * 0.05 * s);
    neckSpine.rotation.x = -0.4;
    group.add(neckSpine);
  }

  // === BODY ===
  const body = new THREE.Mesh(
    new THREE.BoxGeometry(0.28 * s, 0.22 * s, 0.35 * s),
    scaleMaterial
  );
  body.position.set(0, 0.36 * s, -0.18 * s);
  group.add(body);

  // Underbelly
  const belly = new THREE.Mesh(
    new THREE.BoxGeometry(0.2 * s, 0.1 * s, 0.3 * s),
    bellyMaterial
  );
  belly.position.set(0, 0.26 * s, -0.16 * s);
  group.add(belly);

  // Back spines
  for (let i = 0; i < 6; i++) {
    const backSpine = new THREE.Mesh(
      new THREE.BoxGeometry(0.02 * s, 0.05 * s, 0.025 * s),
      darkScaleMaterial
    );
    backSpine.position.set(0, 0.48 * s, (-0.05 - i * 0.055) * s);
    backSpine.rotation.x = -0.3;
    group.add(backSpine);
  }

  // === WINGS (canonical) ===
  // Wing arms
  const wingArmGeo = new THREE.BoxGeometry(0.04 * s, 0.03 * s, 0.25 * s);

  // Left wing
  const leftWingArm = new THREE.Mesh(wingArmGeo, darkScaleMaterial);
  leftWingArm.position.set(-0.18 * s, 0.44 * s, -0.1 * s);
  leftWingArm.rotation.y = 0.8;
  leftWingArm.rotation.z = 0.3;
  group.add(leftWingArm);

  // Left wing membrane
  const leftWingMembrane = new THREE.Mesh(
    new THREE.BoxGeometry(0.25 * s, 0.02 * s, 0.2 * s),
    wingMaterial
  );
  leftWingMembrane.position.set(-0.32 * s, 0.42 * s, -0.15 * s);
  leftWingMembrane.rotation.y = 0.4;
  leftWingMembrane.rotation.z = 0.2;
  group.add(leftWingMembrane);

  // Left wing fingers
  for (let i = 0; i < 3; i++) {
    const wingFinger = new THREE.Mesh(
      new THREE.BoxGeometry(0.02 * s, 0.015 * s, 0.15 * s),
      darkScaleMaterial
    );
    wingFinger.position.set((-0.25 - i * 0.08) * s, 0.43 * s, (-0.08 - i * 0.04) * s);
    wingFinger.rotation.y = 0.5 + i * 0.15;
    group.add(wingFinger);
  }

  // Right wing
  const rightWingArm = new THREE.Mesh(wingArmGeo, darkScaleMaterial);
  rightWingArm.position.set(0.18 * s, 0.44 * s, -0.1 * s);
  rightWingArm.rotation.y = -0.8;
  rightWingArm.rotation.z = -0.3;
  group.add(rightWingArm);

  // Right wing membrane
  const rightWingMembrane = new THREE.Mesh(
    new THREE.BoxGeometry(0.25 * s, 0.02 * s, 0.2 * s),
    wingMaterial
  );
  rightWingMembrane.position.set(0.32 * s, 0.42 * s, -0.15 * s);
  rightWingMembrane.rotation.y = -0.4;
  rightWingMembrane.rotation.z = -0.2;
  group.add(rightWingMembrane);

  // Right wing fingers
  for (let i = 0; i < 3; i++) {
    const wingFinger = new THREE.Mesh(
      new THREE.BoxGeometry(0.02 * s, 0.015 * s, 0.15 * s),
      darkScaleMaterial
    );
    wingFinger.position.set((0.25 + i * 0.08) * s, 0.43 * s, (-0.08 - i * 0.04) * s);
    wingFinger.rotation.y = -0.5 - i * 0.15;
    group.add(wingFinger);
  }

  // === FRONT LEGS ===
  const legGeo = new THREE.BoxGeometry(0.07 * s, 0.14 * s, 0.06 * s);
  const clawGeo = new THREE.BoxGeometry(0.015 * s, 0.04 * s, 0.03 * s);

  // Left front leg
  const leftFrontLeg = new THREE.Mesh(legGeo, scaleMaterial);
  leftFrontLeg.position.set(-0.12 * s, 0.2 * s, 0.02 * s);
  group.add(leftFrontLeg);

  const leftFrontFoot = new THREE.Mesh(
    new THREE.BoxGeometry(0.06 * s, 0.03 * s, 0.08 * s),
    darkScaleMaterial
  );
  leftFrontFoot.position.set(-0.12 * s, 0.12 * s, 0.05 * s);
  group.add(leftFrontFoot);

  // Left front claws
  for (let i = 0; i < 3; i++) {
    const claw = new THREE.Mesh(clawGeo, toothMaterial);
    claw.position.set((-0.1 - i * 0.02) * s, 0.1 * s, 0.1 * s);
    claw.rotation.x = -0.4;
    group.add(claw);
  }

  // Right front leg
  const rightFrontLeg = new THREE.Mesh(legGeo, scaleMaterial);
  rightFrontLeg.position.set(0.12 * s, 0.2 * s, 0.02 * s);
  group.add(rightFrontLeg);

  const rightFrontFoot = new THREE.Mesh(
    new THREE.BoxGeometry(0.06 * s, 0.03 * s, 0.08 * s),
    darkScaleMaterial
  );
  rightFrontFoot.position.set(0.12 * s, 0.12 * s, 0.05 * s);
  group.add(rightFrontFoot);

  // Right front claws
  for (let i = 0; i < 3; i++) {
    const claw = new THREE.Mesh(clawGeo, toothMaterial);
    claw.position.set((0.1 + i * 0.02) * s, 0.1 * s, 0.1 * s);
    claw.rotation.x = -0.4;
    group.add(claw);
  }

  // === BACK LEGS ===
  const backLegGeo = new THREE.BoxGeometry(0.08 * s, 0.16 * s, 0.08 * s);

  // Left back leg
  const leftBackLeg = new THREE.Mesh(backLegGeo, scaleMaterial);
  leftBackLeg.position.set(-0.1 * s, 0.18 * s, -0.32 * s);
  group.add(leftBackLeg);

  const leftBackFoot = new THREE.Mesh(
    new THREE.BoxGeometry(0.07 * s, 0.03 * s, 0.1 * s),
    darkScaleMaterial
  );
  leftBackFoot.position.set(-0.1 * s, 0.1 * s, -0.28 * s);
  group.add(leftBackFoot);

  // Left back claws
  for (let i = 0; i < 3; i++) {
    const claw = new THREE.Mesh(clawGeo, toothMaterial);
    claw.position.set((-0.08 - i * 0.02) * s, 0.08 * s, -0.22 * s);
    claw.rotation.x = -0.4;
    group.add(claw);
  }

  // Right back leg
  const rightBackLeg = new THREE.Mesh(backLegGeo, scaleMaterial);
  rightBackLeg.position.set(0.1 * s, 0.18 * s, -0.32 * s);
  group.add(rightBackLeg);

  const rightBackFoot = new THREE.Mesh(
    new THREE.BoxGeometry(0.07 * s, 0.03 * s, 0.1 * s),
    darkScaleMaterial
  );
  rightBackFoot.position.set(0.1 * s, 0.1 * s, -0.28 * s);
  group.add(rightBackFoot);

  // Right back claws
  for (let i = 0; i < 3; i++) {
    const claw = new THREE.Mesh(clawGeo, toothMaterial);
    claw.position.set((0.08 + i * 0.02) * s, 0.08 * s, -0.22 * s);
    claw.rotation.x = -0.4;
    group.add(claw);
  }

  // === TAIL ===
  const tailSegments = [
    { w: 0.1, h: 0.08, d: 0.12, y: 0.32, z: -0.42 },
    { w: 0.08, h: 0.07, d: 0.12, y: 0.3, z: -0.54 },
    { w: 0.06, h: 0.06, d: 0.12, y: 0.28, z: -0.65 },
    { w: 0.05, h: 0.05, d: 0.1, y: 0.26, z: -0.74 },
    { w: 0.04, h: 0.04, d: 0.08, y: 0.24, z: -0.82 },
  ];

  tailSegments.forEach((seg) => {
    const tailSeg = new THREE.Mesh(
      new THREE.BoxGeometry(seg.w * s, seg.h * s, seg.d * s),
      scaleMaterial
    );
    tailSeg.position.set(0, seg.y * s, seg.z * s);
    group.add(tailSeg);
  });

  // Tail spines
  for (let i = 0; i < 4; i++) {
    const tailSpine = new THREE.Mesh(
      new THREE.BoxGeometry(0.015 * s, 0.035 * s, 0.02 * s),
      darkScaleMaterial
    );
    tailSpine.position.set(0, 0.34 * s - i * 0.02 * s, (-0.48 - i * 0.1) * s);
    tailSpine.rotation.x = -0.4;
    group.add(tailSpine);
  }

  // Tail tip (spade)
  const tailTip = new THREE.Mesh(
    new THREE.BoxGeometry(0.06 * s, 0.04 * s, 0.06 * s),
    darkScaleMaterial
  );
  tailTip.position.set(0, 0.22 * s, -0.88 * s);
  tailTip.rotation.z = Math.PI / 4;
  group.add(tailTip);

  return group;
}

export const DRAGON_META = {
  id: 'dragon',
  name: 'Dragon',
  category: 'enemy' as const,
  description: 'Massive scaled reptile with wings and glowing eyes. Flames lick between its teeth - canonical design',
  defaultScale: 1.0,
  boundingBox: { x: 1.2, y: 0.9, z: 1.8 },
  tags: ['dragon', 'boss', 'enemy', 'creature', 'monster', 'fire', 'flying', 'canonical'],
  enemyName: 'Dragon',
};
