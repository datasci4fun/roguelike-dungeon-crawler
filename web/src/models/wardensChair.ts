/**
 * Warden's Chair Model
 * Heavy authoritative chair for the Warden's Office zone
 */

import * as THREE from 'three';
import { createMaterial } from './materials';

export interface WardensChairOptions {
  scale?: number;
}

export function createWardensChair(options: WardensChairOptions = {}): THREE.Group {
  const { scale = 1.0 } = options;

  const group = new THREE.Group();

  // Materials
  const darkWoodMaterial = createMaterial('darkWood');
  const ironMaterial = createMaterial('iron');
  const leatherMaterial = createMaterial('leather');

  // Brass for decorative elements
  const brassMaterial = new THREE.MeshStandardMaterial({
    color: 0x8b7333,
    roughness: 0.4,
    metalness: 0.7,
  });

  // === LEGS (4 sturdy legs) ===
  const legGeometry = new THREE.BoxGeometry(0.08 * scale, 0.35 * scale, 0.08 * scale);
  const legPositions = [
    { x: -0.25, z: -0.2 },
    { x: 0.25, z: -0.2 },
    { x: -0.25, z: 0.2 },
    { x: 0.25, z: 0.2 },
  ];

  for (const pos of legPositions) {
    const leg = new THREE.Mesh(legGeometry, darkWoodMaterial);
    leg.position.set(pos.x * scale, 0.175 * scale, pos.z * scale);
    group.add(leg);

    // Iron foot cap
    const footCapGeometry = new THREE.BoxGeometry(0.09 * scale, 0.03 * scale, 0.09 * scale);
    const footCap = new THREE.Mesh(footCapGeometry, ironMaterial);
    footCap.position.set(pos.x * scale, 0.015 * scale, pos.z * scale);
    group.add(footCap);
  }

  // === LEG STRETCHERS (cross braces) ===
  const stretcherGeometry = new THREE.BoxGeometry(0.04 * scale, 0.04 * scale, 0.35 * scale);

  // Side stretchers
  const sideStretcher1 = new THREE.Mesh(stretcherGeometry, darkWoodMaterial);
  sideStretcher1.position.set(-0.25 * scale, 0.12 * scale, 0);
  group.add(sideStretcher1);

  const sideStretcher2 = new THREE.Mesh(stretcherGeometry, darkWoodMaterial);
  sideStretcher2.position.set(0.25 * scale, 0.12 * scale, 0);
  group.add(sideStretcher2);

  // Front/back stretchers
  const frontStretcherGeometry = new THREE.BoxGeometry(0.42 * scale, 0.04 * scale, 0.04 * scale);
  const frontStretcher = new THREE.Mesh(frontStretcherGeometry, darkWoodMaterial);
  frontStretcher.position.set(0, 0.12 * scale, 0.2 * scale);
  group.add(frontStretcher);

  const backStretcher = new THREE.Mesh(frontStretcherGeometry, darkWoodMaterial);
  backStretcher.position.set(0, 0.12 * scale, -0.2 * scale);
  group.add(backStretcher);

  // === SEAT BASE (wooden frame) ===
  const seatFrameGeometry = new THREE.BoxGeometry(0.6 * scale, 0.06 * scale, 0.5 * scale);
  const seatFrame = new THREE.Mesh(seatFrameGeometry, darkWoodMaterial);
  seatFrame.position.set(0, 0.38 * scale, 0);
  group.add(seatFrame);

  // === SEAT CUSHION (leather) ===
  const seatCushionGeometry = new THREE.BoxGeometry(0.52 * scale, 0.08 * scale, 0.42 * scale);
  const seatCushion = new THREE.Mesh(seatCushionGeometry, leatherMaterial);
  seatCushion.position.set(0, 0.45 * scale, 0.02 * scale);
  group.add(seatCushion);

  // Cushion button tufts (4 indentations simulated with small cylinders)
  const tuftGeometry = new THREE.CylinderGeometry(0.02 * scale, 0.02 * scale, 0.01 * scale, 8);
  const tuftPositions = [
    { x: -0.12, z: -0.08 },
    { x: 0.12, z: -0.08 },
    { x: -0.12, z: 0.1 },
    { x: 0.12, z: 0.1 },
  ];
  for (const pos of tuftPositions) {
    const tuft = new THREE.Mesh(tuftGeometry, brassMaterial);
    tuft.position.set(pos.x * scale, 0.495 * scale, pos.z * scale);
    group.add(tuft);
  }

  // === BACKREST FRAME ===
  // Vertical back posts
  const backPostGeometry = new THREE.BoxGeometry(0.08 * scale, 0.7 * scale, 0.06 * scale);
  const backPostLeft = new THREE.Mesh(backPostGeometry, darkWoodMaterial);
  backPostLeft.position.set(-0.26 * scale, 0.76 * scale, -0.22 * scale);
  group.add(backPostLeft);

  const backPostRight = new THREE.Mesh(backPostGeometry, darkWoodMaterial);
  backPostRight.position.set(0.26 * scale, 0.76 * scale, -0.22 * scale);
  group.add(backPostRight);

  // Top rail
  const topRailGeometry = new THREE.BoxGeometry(0.6 * scale, 0.1 * scale, 0.06 * scale);
  const topRail = new THREE.Mesh(topRailGeometry, darkWoodMaterial);
  topRail.position.set(0, 1.06 * scale, -0.22 * scale);
  group.add(topRail);

  // Decorative top cap
  const topCapGeometry = new THREE.BoxGeometry(0.64 * scale, 0.04 * scale, 0.08 * scale);
  const topCap = new THREE.Mesh(topCapGeometry, darkWoodMaterial);
  topCap.position.set(0, 1.13 * scale, -0.22 * scale);
  group.add(topCap);

  // === BACKREST CUSHION (leather) ===
  const backCushionGeometry = new THREE.BoxGeometry(0.44 * scale, 0.55 * scale, 0.05 * scale);
  const backCushion = new THREE.Mesh(backCushionGeometry, leatherMaterial);
  backCushion.position.set(0, 0.76 * scale, -0.17 * scale);
  group.add(backCushion);

  // Back cushion tufts (6 buttons in 2 rows)
  const backTuftPositions = [
    { x: -0.12, y: 0.65 },
    { x: 0, y: 0.65 },
    { x: 0.12, y: 0.65 },
    { x: -0.12, y: 0.87 },
    { x: 0, y: 0.87 },
    { x: 0.12, y: 0.87 },
  ];
  for (const pos of backTuftPositions) {
    const tuft = new THREE.Mesh(tuftGeometry, brassMaterial);
    tuft.position.set(pos.x * scale, pos.y * scale, -0.14 * scale);
    tuft.rotation.x = Math.PI / 2;
    group.add(tuft);
  }

  // === ARMRESTS ===
  // Armrest supports (vertical)
  const armSupportGeometry = new THREE.BoxGeometry(0.06 * scale, 0.22 * scale, 0.06 * scale);

  const armSupportFrontLeft = new THREE.Mesh(armSupportGeometry, darkWoodMaterial);
  armSupportFrontLeft.position.set(-0.28 * scale, 0.52 * scale, 0.12 * scale);
  group.add(armSupportFrontLeft);

  const armSupportFrontRight = new THREE.Mesh(armSupportGeometry, darkWoodMaterial);
  armSupportFrontRight.position.set(0.28 * scale, 0.52 * scale, 0.12 * scale);
  group.add(armSupportFrontRight);

  // Armrest horizontal pieces
  const armrestGeometry = new THREE.BoxGeometry(0.08 * scale, 0.06 * scale, 0.4 * scale);

  const armrestLeft = new THREE.Mesh(armrestGeometry, darkWoodMaterial);
  armrestLeft.position.set(-0.28 * scale, 0.66 * scale, -0.02 * scale);
  group.add(armrestLeft);

  const armrestRight = new THREE.Mesh(armrestGeometry, darkWoodMaterial);
  armrestRight.position.set(0.28 * scale, 0.66 * scale, -0.02 * scale);
  group.add(armrestRight);

  // Armrest iron end caps
  const armCapGeometry = new THREE.BoxGeometry(0.1 * scale, 0.08 * scale, 0.06 * scale);

  const armCapLeft = new THREE.Mesh(armCapGeometry, ironMaterial);
  armCapLeft.position.set(-0.28 * scale, 0.66 * scale, 0.16 * scale);
  group.add(armCapLeft);

  const armCapRight = new THREE.Mesh(armCapGeometry, ironMaterial);
  armCapRight.position.set(0.28 * scale, 0.66 * scale, 0.16 * scale);
  group.add(armCapRight);

  // === IRON CORNER BRACKETS (decorative/reinforcement) ===
  const bracketGeometry = new THREE.BoxGeometry(0.06 * scale, 0.12 * scale, 0.02 * scale);

  // Top corners of backrest
  const bracketTL = new THREE.Mesh(bracketGeometry, ironMaterial);
  bracketTL.position.set(-0.26 * scale, 1.0 * scale, -0.26 * scale);
  group.add(bracketTL);

  const bracketTR = new THREE.Mesh(bracketGeometry, ironMaterial);
  bracketTR.position.set(0.26 * scale, 1.0 * scale, -0.26 * scale);
  group.add(bracketTR);

  // === IRON STUDS ON TOP RAIL ===
  const studGeometry = new THREE.CylinderGeometry(0.015 * scale, 0.015 * scale, 0.02 * scale, 6);
  const studPositions = [-0.2, -0.1, 0, 0.1, 0.2];

  for (const x of studPositions) {
    const stud = new THREE.Mesh(studGeometry, ironMaterial);
    stud.position.set(x * scale, 1.06 * scale, -0.18 * scale);
    stud.rotation.x = Math.PI / 2;
    group.add(stud);
  }

  // === KEY RING HOOK (warden's signature detail) ===
  // Hook base plate
  const hookPlateGeometry = new THREE.BoxGeometry(0.06 * scale, 0.08 * scale, 0.015 * scale);
  const hookPlate = new THREE.Mesh(hookPlateGeometry, ironMaterial);
  hookPlate.position.set(0.28 * scale, 0.55 * scale, -0.25 * scale);
  group.add(hookPlate);

  // Hook ring (small torus)
  const hookRingGeometry = new THREE.TorusGeometry(0.025 * scale, 0.008 * scale, 6, 12);
  const hookRing = new THREE.Mesh(hookRingGeometry, ironMaterial);
  hookRing.position.set(0.28 * scale, 0.5 * scale, -0.26 * scale);
  group.add(hookRing);

  // Small key on the ring (decorative)
  const keyShaftGeometry = new THREE.BoxGeometry(0.01 * scale, 0.05 * scale, 0.005 * scale);
  const keyShaft = new THREE.Mesh(keyShaftGeometry, brassMaterial);
  keyShaft.position.set(0.28 * scale, 0.46 * scale, -0.26 * scale);
  group.add(keyShaft);

  const keyHeadGeometry = new THREE.CylinderGeometry(0.015 * scale, 0.015 * scale, 0.005 * scale, 6);
  const keyHead = new THREE.Mesh(keyHeadGeometry, brassMaterial);
  keyHead.position.set(0.28 * scale, 0.49 * scale, -0.26 * scale);
  keyHead.rotation.x = Math.PI / 2;
  group.add(keyHead);

  return group;
}

export const WARDENS_CHAIR_META = {
  id: 'wardens-chair',
  name: "Warden's Chair",
  category: 'furniture' as const,
  description: 'Heavy authoritative chair for the Warden\'s Office zone',
  defaultScale: 1.0,
  boundingBox: { x: 0.7, y: 1.15, z: 0.55 },
  tags: ['chair', 'furniture', 'warden', 'office', 'prison', 'authority'],
};
