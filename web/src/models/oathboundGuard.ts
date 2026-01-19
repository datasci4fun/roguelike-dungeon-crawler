/**
 * Oathbound Guard Enemy Model
 * Canonical design based on bestiary appearance.
 *
 * Canonical appearance from bestiary:
 * "Ghostly knight in ornate armor. Carries a spectral halberd. Eyes burn with cold fire."
 */

import * as THREE from 'three';

export interface OathboundGuardOptions {
  scale?: number;
}

export function createOathboundGuard(options: OathboundGuardOptions = {}): THREE.Group {
  const { scale = 1.0 } = options;

  const group = new THREE.Group();
  const s = scale * 1.1;

  // === MATERIALS ===
  // Ghostly spectral material (canonical - ghostly)
  const spectralMaterial = new THREE.MeshStandardMaterial({
    color: 0x8899aa,
    roughness: 0.3,
    metalness: 0.2,
    emissive: 0x445566,
    emissiveIntensity: 0.4,
    transparent: true,
    opacity: 0.7,
  });

  // Ornate armor material (canonical - ornate)
  const armorMaterial = new THREE.MeshStandardMaterial({
    color: 0x667788,
    roughness: 0.2,
    metalness: 0.6,
    emissive: 0x334455,
    emissiveIntensity: 0.3,
    transparent: true,
    opacity: 0.8,
  });

  // Gold trim for ornate details
  const goldTrimMaterial = new THREE.MeshStandardMaterial({
    color: 0xccaa66,
    roughness: 0.2,
    metalness: 0.8,
    emissive: 0x665533,
    emissiveIntensity: 0.3,
    transparent: true,
    opacity: 0.85,
  });

  // Cold fire eyes (canonical)
  const coldFireMaterial = new THREE.MeshStandardMaterial({
    color: 0x66ccff,
    roughness: 0.1,
    metalness: 0.0,
    emissive: 0x44aaff,
    emissiveIntensity: 2.0,
  });

  // Spectral halberd material
  const halberdMaterial = new THREE.MeshStandardMaterial({
    color: 0x99aacc,
    roughness: 0.15,
    metalness: 0.7,
    emissive: 0x4466aa,
    emissiveIntensity: 0.6,
    transparent: true,
    opacity: 0.75,
  });

  // === HELMET (ornate with plume) ===
  const helmet = new THREE.Mesh(
    new THREE.BoxGeometry(0.12 * s, 0.14 * s, 0.12 * s),
    armorMaterial
  );
  helmet.position.y = 0.78 * s;
  group.add(helmet);

  // Helmet visor
  const visor = new THREE.Mesh(
    new THREE.BoxGeometry(0.1 * s, 0.06 * s, 0.04 * s),
    armorMaterial
  );
  visor.position.set(0, 0.74 * s, 0.07 * s);
  group.add(visor);

  // Ornate crest on helmet
  const crest = new THREE.Mesh(
    new THREE.BoxGeometry(0.02 * s, 0.1 * s, 0.1 * s),
    goldTrimMaterial
  );
  crest.position.set(0, 0.88 * s, 0);
  group.add(crest);

  // Cold fire eyes (canonical - "Eyes burn with cold fire")
  const eyeGeo = new THREE.SphereGeometry(0.02 * s, 6, 4);

  const leftEye = new THREE.Mesh(eyeGeo, coldFireMaterial);
  leftEye.position.set(-0.03 * s, 0.76 * s, 0.08 * s);
  group.add(leftEye);

  const rightEye = new THREE.Mesh(eyeGeo, coldFireMaterial);
  rightEye.position.set(0.03 * s, 0.76 * s, 0.08 * s);
  group.add(rightEye);

  // Eye glow wisps
  const wispGeo = new THREE.BoxGeometry(0.01 * s, 0.01 * s, 0.03 * s);
  const wispMaterial = new THREE.MeshStandardMaterial({
    color: 0x88ddff,
    emissive: 0x66bbff,
    emissiveIntensity: 1.5,
    transparent: true,
    opacity: 0.6,
  });

  const leftWisp = new THREE.Mesh(wispGeo, wispMaterial);
  leftWisp.position.set(-0.04 * s, 0.77 * s, 0.06 * s);
  group.add(leftWisp);

  const rightWisp = new THREE.Mesh(wispGeo, wispMaterial);
  rightWisp.position.set(0.04 * s, 0.77 * s, 0.06 * s);
  group.add(rightWisp);

  // === NECK/GORGET ===
  const gorget = new THREE.Mesh(
    new THREE.CylinderGeometry(0.06 * s, 0.07 * s, 0.06 * s, 8),
    armorMaterial
  );
  gorget.position.y = 0.68 * s;
  group.add(gorget);

  // === PAULDRONS (ornate shoulder armor) ===
  const pauldronGeo = new THREE.BoxGeometry(0.1 * s, 0.08 * s, 0.1 * s);

  const leftPauldron = new THREE.Mesh(pauldronGeo, armorMaterial);
  leftPauldron.position.set(-0.14 * s, 0.62 * s, 0);
  leftPauldron.rotation.z = -0.3;
  group.add(leftPauldron);

  const rightPauldron = new THREE.Mesh(pauldronGeo, armorMaterial);
  rightPauldron.position.set(0.14 * s, 0.62 * s, 0);
  rightPauldron.rotation.z = 0.3;
  group.add(rightPauldron);

  // Pauldron gold trim
  const trimGeo = new THREE.BoxGeometry(0.08 * s, 0.015 * s, 0.08 * s);

  const leftTrim = new THREE.Mesh(trimGeo, goldTrimMaterial);
  leftTrim.position.set(-0.14 * s, 0.66 * s, 0);
  group.add(leftTrim);

  const rightTrim = new THREE.Mesh(trimGeo, goldTrimMaterial);
  rightTrim.position.set(0.14 * s, 0.66 * s, 0);
  group.add(rightTrim);

  // === TORSO (ornate breastplate) ===
  const breastplate = new THREE.Mesh(
    new THREE.BoxGeometry(0.2 * s, 0.24 * s, 0.12 * s),
    armorMaterial
  );
  breastplate.position.y = 0.5 * s;
  group.add(breastplate);

  // Spectral body underneath
  const spectralTorso = new THREE.Mesh(
    new THREE.BoxGeometry(0.16 * s, 0.22 * s, 0.1 * s),
    spectralMaterial
  );
  spectralTorso.position.y = 0.5 * s;
  group.add(spectralTorso);

  // Ornate chest emblem
  const emblem = new THREE.Mesh(
    new THREE.BoxGeometry(0.08 * s, 0.08 * s, 0.02 * s),
    goldTrimMaterial
  );
  emblem.position.set(0, 0.52 * s, 0.07 * s);
  emblem.rotation.z = 0.785;
  group.add(emblem);

  // === ARMS ===
  // Upper arms
  const upperArmGeo = new THREE.BoxGeometry(0.06 * s, 0.14 * s, 0.06 * s);

  const leftUpperArm = new THREE.Mesh(upperArmGeo, armorMaterial);
  leftUpperArm.position.set(-0.16 * s, 0.5 * s, 0);
  group.add(leftUpperArm);

  const rightUpperArm = new THREE.Mesh(upperArmGeo, armorMaterial);
  rightUpperArm.position.set(0.16 * s, 0.5 * s, 0);
  group.add(rightUpperArm);

  // Gauntlets
  const gauntletGeo = new THREE.BoxGeometry(0.055 * s, 0.12 * s, 0.055 * s);

  const leftGauntlet = new THREE.Mesh(gauntletGeo, armorMaterial);
  leftGauntlet.position.set(-0.16 * s, 0.36 * s, 0.02 * s);
  group.add(leftGauntlet);

  const rightGauntlet = new THREE.Mesh(gauntletGeo, armorMaterial);
  rightGauntlet.position.set(0.16 * s, 0.36 * s, 0.02 * s);
  group.add(rightGauntlet);

  // === LEGS ===
  const legArmorGeo = new THREE.BoxGeometry(0.08 * s, 0.2 * s, 0.08 * s);

  const leftLeg = new THREE.Mesh(legArmorGeo, armorMaterial);
  leftLeg.position.set(-0.06 * s, 0.24 * s, 0);
  group.add(leftLeg);

  const rightLeg = new THREE.Mesh(legArmorGeo, armorMaterial);
  rightLeg.position.set(0.06 * s, 0.24 * s, 0);
  group.add(rightLeg);

  // Sabatons (foot armor)
  const sabatonGeo = new THREE.BoxGeometry(0.07 * s, 0.04 * s, 0.12 * s);

  const leftSabaton = new THREE.Mesh(sabatonGeo, armorMaterial);
  leftSabaton.position.set(-0.06 * s, 0.1 * s, 0.02 * s);
  group.add(leftSabaton);

  const rightSabaton = new THREE.Mesh(sabatonGeo, armorMaterial);
  rightSabaton.position.set(0.06 * s, 0.1 * s, 0.02 * s);
  group.add(rightSabaton);

  // === SPECTRAL HALBERD (canonical) ===
  // Shaft
  const shaftGeo = new THREE.CylinderGeometry(0.015 * s, 0.015 * s, 0.9 * s, 6);
  const shaft = new THREE.Mesh(shaftGeo, halberdMaterial);
  shaft.position.set(0.25 * s, 0.5 * s, 0);
  group.add(shaft);

  // Axe blade
  const bladeGeo = new THREE.BoxGeometry(0.12 * s, 0.18 * s, 0.02 * s);
  const blade = new THREE.Mesh(bladeGeo, halberdMaterial);
  blade.position.set(0.32 * s, 0.88 * s, 0);
  group.add(blade);

  // Spike top
  const spikeGeo = new THREE.BoxGeometry(0.02 * s, 0.1 * s, 0.02 * s);
  const spike = new THREE.Mesh(spikeGeo, halberdMaterial);
  spike.position.set(0.25 * s, 1.0 * s, 0);
  group.add(spike);

  // Back hook
  const hookGeo = new THREE.BoxGeometry(0.06 * s, 0.04 * s, 0.015 * s);
  const hook = new THREE.Mesh(hookGeo, halberdMaterial);
  hook.position.set(0.2 * s, 0.85 * s, 0);
  group.add(hook);

  // === SPECTRAL WISPS (ghostly effect) ===
  const ghostWispGeo = new THREE.BoxGeometry(0.03 * s, 0.08 * s, 0.02 * s);
  const ghostWispMaterial = new THREE.MeshStandardMaterial({
    color: 0x99aacc,
    emissive: 0x6688aa,
    emissiveIntensity: 0.5,
    transparent: true,
    opacity: 0.4,
  });

  const wispPositions = [
    { x: -0.1, y: 0.3, z: 0.08 },
    { x: 0.08, y: 0.25, z: -0.06 },
    { x: -0.05, y: 0.15, z: -0.08 },
    { x: 0.12, y: 0.4, z: 0.05 },
  ];

  wispPositions.forEach((pos) => {
    const wisp = new THREE.Mesh(ghostWispGeo, ghostWispMaterial);
    wisp.position.set(pos.x * s, pos.y * s, pos.z * s);
    wisp.rotation.z = Math.random() * 0.5 - 0.25;
    group.add(wisp);
  });

  return group;
}

export const OATHBOUND_GUARD_META = {
  id: 'oathbound-guard',
  name: 'Oathbound Guard',
  category: 'enemy' as const,
  description: 'Ghostly knight in ornate armor. Carries a spectral halberd. Eyes burn with cold fire - canonical design',
  defaultScale: 1.0,
  boundingBox: { x: 0.5, y: 1.0, z: 0.3 },
  tags: ['ghost', 'knight', 'undead', 'enemy', 'spectral', 'armor', 'canonical'],
  enemyName: 'Oathbound Guard',
};
