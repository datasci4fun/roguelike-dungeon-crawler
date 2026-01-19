/**
 * Rat King Boss Model
 * Canonical design based on bestiary appearance.
 *
 * Canonical appearance from bestiary:
 * "Mass of intertwined rats sharing a single body. Multiple heads snap and screech. Oozes plague."
 */

import * as THREE from 'three';

export interface RatKingOptions {
  scale?: number;
}

export function createRatKing(options: RatKingOptions = {}): THREE.Group {
  const { scale = 1.0 } = options;

  const group = new THREE.Group();
  const s = scale * 1.3; // Boss scale

  // === MATERIALS ===
  // Matted gray-brown fur
  const furMaterial = new THREE.MeshStandardMaterial({
    color: 0x4a4a42,
    roughness: 1.0,
    metalness: 0.0,
  });

  // Darker fur
  const darkFurMaterial = new THREE.MeshStandardMaterial({
    color: 0x2a2a24,
    roughness: 1.0,
    metalness: 0.0,
  });

  // Plague ooze (canonical - oozes plague)
  const plagueMaterial = new THREE.MeshStandardMaterial({
    color: 0x668844,
    roughness: 0.3,
    metalness: 0.1,
    emissive: 0x334422,
    emissiveIntensity: 0.5,
    transparent: true,
    opacity: 0.8,
  });

  // Red eyes
  const eyeMaterial = new THREE.MeshStandardMaterial({
    color: 0xff2222,
    roughness: 0.2,
    metalness: 0.0,
    emissive: 0xcc0000,
    emissiveIntensity: 1.0,
  });

  // Teeth
  const teethMaterial = new THREE.MeshStandardMaterial({
    color: 0xcccc99,
    roughness: 0.4,
    metalness: 0.1,
  });

  // Tail material
  const tailMaterial = new THREE.MeshStandardMaterial({
    color: 0x8a7a7a,
    roughness: 0.6,
    metalness: 0.0,
  });

  // === MAIN BODY (mass of intertwined rats) ===
  // Central mass
  const centralMass = new THREE.Mesh(
    new THREE.SphereGeometry(0.25 * s, 10, 8),
    furMaterial
  );
  centralMass.position.y = 0.35 * s;
  centralMass.scale.set(1.2, 0.9, 1.1);
  group.add(centralMass);

  // Outer intertwined layer
  const outerMass = new THREE.Mesh(
    new THREE.SphereGeometry(0.3 * s, 10, 8),
    darkFurMaterial
  );
  outerMass.position.y = 0.35 * s;
  outerMass.scale.set(1.3, 0.85, 1.2);
  group.add(outerMass);

  // Individual rat bodies intertwined
  const ratBodyGeo = new THREE.SphereGeometry(0.08 * s, 6, 4);
  const ratBodies = [
    { x: -0.2, y: 0.4, z: 0.15, sx: 1.3, sy: 0.8, sz: 1.1 },
    { x: 0.22, y: 0.38, z: 0.12, sx: 1.2, sy: 0.9, sz: 1.0 },
    { x: -0.18, y: 0.32, z: -0.14, sx: 1.1, sy: 0.85, sz: 1.2 },
    { x: 0.2, y: 0.35, z: -0.16, sx: 1.25, sy: 0.8, sz: 1.0 },
    { x: 0, y: 0.45, z: 0.2, sx: 1.0, sy: 0.9, sz: 1.15 },
    { x: -0.15, y: 0.28, z: 0.08, sx: 1.2, sy: 0.85, sz: 1.1 },
    { x: 0.16, y: 0.3, z: 0.06, sx: 1.15, sy: 0.9, sz: 1.0 },
  ];

  ratBodies.forEach((rb) => {
    const body = new THREE.Mesh(ratBodyGeo, furMaterial);
    body.position.set(rb.x * s, rb.y * s, rb.z * s);
    body.scale.set(rb.sx, rb.sy, rb.sz);
    group.add(body);
  });

  // === MULTIPLE HEADS (canonical - multiple heads snap and screech) ===
  const createRatHead = (x: number, y: number, z: number, headScale: number, rotY: number) => {
    // Head
    const head = new THREE.Mesh(
      new THREE.BoxGeometry(0.06 * s * headScale, 0.05 * s * headScale, 0.08 * s * headScale),
      furMaterial
    );
    head.position.set(x * s, y * s, z * s);
    head.rotation.y = rotY;
    group.add(head);

    // Snout
    const snout = new THREE.Mesh(
      new THREE.BoxGeometry(0.04 * s * headScale, 0.03 * s * headScale, 0.05 * s * headScale),
      furMaterial
    );
    const snoutX = x + Math.sin(rotY) * 0.04 * headScale;
    const snoutZ = z + Math.cos(rotY) * 0.04 * headScale;
    snout.position.set(snoutX * s, (y - 0.01) * s, snoutZ * s);
    snout.rotation.y = rotY;
    group.add(snout);

    // Eyes
    const eyeGeo = new THREE.SphereGeometry(0.012 * s * headScale, 4, 4);
    const eye1 = new THREE.Mesh(eyeGeo, eyeMaterial);
    const eye2 = new THREE.Mesh(eyeGeo, eyeMaterial);
    const eyeOffset = 0.025 * headScale;
    eye1.position.set((x - Math.cos(rotY) * eyeOffset) * s, (y + 0.015) * s, (z + Math.sin(rotY) * eyeOffset) * s);
    eye2.position.set((x + Math.cos(rotY) * eyeOffset) * s, (y + 0.015) * s, (z - Math.sin(rotY) * eyeOffset) * s);
    group.add(eye1);
    group.add(eye2);

    // Teeth
    const toothGeo = new THREE.BoxGeometry(0.008 * s * headScale, 0.015 * s * headScale, 0.006 * s * headScale);
    const toothX = x + Math.sin(rotY) * 0.055 * headScale;
    const toothZ = z + Math.cos(rotY) * 0.055 * headScale;
    const tooth1 = new THREE.Mesh(toothGeo, teethMaterial);
    const tooth2 = new THREE.Mesh(toothGeo, teethMaterial);
    tooth1.position.set((toothX - 0.01) * s, (y - 0.025) * s, toothZ * s);
    tooth2.position.set((toothX + 0.01) * s, (y - 0.025) * s, toothZ * s);
    group.add(tooth1);
    group.add(tooth2);
  };

  // Multiple heads around the mass
  createRatHead(0, 0.52, 0.25, 1.2, 0); // Front main head
  createRatHead(-0.22, 0.48, 0.15, 1.0, -0.6);
  createRatHead(0.24, 0.46, 0.12, 1.0, 0.5);
  createRatHead(-0.18, 0.44, -0.18, 0.9, -2.5);
  createRatHead(0.2, 0.42, -0.2, 0.85, 2.6);
  createRatHead(0, 0.5, -0.22, 0.95, Math.PI);

  // === INTERTWINED TAILS (canonical - intertwined) ===
  const tailSegGeo = new THREE.CylinderGeometry(0.015 * s, 0.012 * s, 0.08 * s, 6);

  // Multiple tails intertwining
  const tailStarts = [
    { x: -0.15, z: -0.2, angle: -0.8 },
    { x: 0.1, z: -0.22, angle: 0.6 },
    { x: 0, z: -0.25, angle: 0 },
    { x: -0.2, z: -0.12, angle: -1.2 },
    { x: 0.18, z: -0.15, angle: 1.0 },
  ];

  tailStarts.forEach((ts) => {
    for (let i = 0; i < 6; i++) {
      const seg = new THREE.Mesh(tailSegGeo, tailMaterial);
      const x = ts.x + Math.sin(ts.angle + i * 0.3) * i * 0.03;
      const z = ts.z - i * 0.04;
      const y = 0.2 - i * 0.02;
      seg.position.set(x * s, y * s, z * s);
      seg.rotation.x = 0.3 + i * 0.1;
      seg.rotation.z = ts.angle + Math.sin(i) * 0.3;
      const taper = 1 - i * 0.1;
      seg.scale.set(taper, 1, taper);
      group.add(seg);
    }
  });

  // === PLAGUE OOZE (canonical - oozes plague) ===
  const oozeGeo = new THREE.SphereGeometry(0.04 * s, 6, 4);
  const oozePositions = [
    { x: -0.25, y: 0.3, z: 0.1 },
    { x: 0.22, y: 0.28, z: 0.15 },
    { x: -0.18, y: 0.25, z: -0.12 },
    { x: 0.2, y: 0.32, z: -0.08 },
    { x: 0, y: 0.22, z: 0.2 },
    { x: -0.12, y: 0.35, z: 0.18 },
  ];

  oozePositions.forEach((op) => {
    const ooze = new THREE.Mesh(oozeGeo, plagueMaterial);
    ooze.position.set(op.x * s, op.y * s, op.z * s);
    ooze.scale.set(1 + Math.random() * 0.3, 0.6, 1 + Math.random() * 0.3);
    group.add(ooze);
  });

  // Plague drips
  const dripGeo = new THREE.BoxGeometry(0.02 * s, 0.06 * s, 0.015 * s);
  const drips = [
    { x: -0.2, y: 0.2, z: 0.12 },
    { x: 0.18, y: 0.18, z: 0.14 },
    { x: -0.15, y: 0.16, z: -0.1 },
    { x: 0.16, y: 0.22, z: -0.06 },
  ];

  drips.forEach((d) => {
    const drip = new THREE.Mesh(dripGeo, plagueMaterial);
    drip.position.set(d.x * s, d.y * s, d.z * s);
    group.add(drip);
  });

  // Plague pool at base
  const plaguePool = new THREE.Mesh(
    new THREE.CylinderGeometry(0.35 * s, 0.4 * s, 0.02 * s, 10),
    new THREE.MeshStandardMaterial({
      color: 0x556633,
      roughness: 0.3,
      metalness: 0.1,
      emissive: 0x223311,
      emissiveIntensity: 0.3,
      transparent: true,
      opacity: 0.6,
    })
  );
  plaguePool.position.y = 0.08 * s;
  group.add(plaguePool);

  // === LEGS (twisted rat legs) ===
  const legGeo = new THREE.BoxGeometry(0.04 * s, 0.12 * s, 0.04 * s);
  const legPositions = [
    { x: -0.2, z: 0.1 },
    { x: 0.2, z: 0.1 },
    { x: -0.22, z: -0.08 },
    { x: 0.22, z: -0.08 },
    { x: -0.12, z: 0.18 },
    { x: 0.12, z: 0.18 },
  ];

  legPositions.forEach((lp) => {
    const leg = new THREE.Mesh(legGeo, darkFurMaterial);
    leg.position.set(lp.x * s, 0.12 * s, lp.z * s);
    leg.rotation.z = lp.x > 0 ? -0.2 : 0.2;
    group.add(leg);
  });

  return group;
}

export const RAT_KING_META = {
  id: 'rat-king',
  name: 'Rat King',
  category: 'enemy' as const,
  description: 'Mass of intertwined rats sharing a single body. Multiple heads snap and screech. Oozes plague - canonical design',
  defaultScale: 1.0,
  boundingBox: { x: 0.8, y: 0.7, z: 0.8 },
  tags: ['boss', 'rat', 'swarm', 'enemy', 'plague', 'poison', 'canonical'],
  enemyName: 'Rat King',
};
