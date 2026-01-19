/**
 * Animated Tome Enemy Model
 * Canonical design based on bestiary appearance.
 *
 * Canonical appearance from bestiary:
 * "Large leather-bound book floating in the air. Pages flutter menacingly. Teeth line the spine."
 */

import * as THREE from 'three';

export interface AnimatedTomeOptions {
  scale?: number;
}

export function createAnimatedTome(options: AnimatedTomeOptions = {}): THREE.Group {
  const { scale = 1.0 } = options;

  const group = new THREE.Group();
  const s = scale * 0.8;

  // === MATERIALS ===
  // Leather cover (canonical - leather-bound)
  const leatherMaterial = new THREE.MeshStandardMaterial({
    color: 0x553322,
    roughness: 0.8,
    metalness: 0.1,
  });

  // Darker leather for spine
  const spineMaterial = new THREE.MeshStandardMaterial({
    color: 0x331a0a,
    roughness: 0.7,
    metalness: 0.1,
  });

  // Page material
  const pageMaterial = new THREE.MeshStandardMaterial({
    color: 0xeeeedd,
    roughness: 0.9,
    metalness: 0.0,
  });

  // Aged/yellowed pages
  const agedPageMaterial = new THREE.MeshStandardMaterial({
    color: 0xddccaa,
    roughness: 0.85,
    metalness: 0.0,
  });

  // Teeth material (canonical - teeth line the spine)
  const teethMaterial = new THREE.MeshStandardMaterial({
    color: 0xffffee,
    roughness: 0.3,
    metalness: 0.1,
  });

  // Eye material (magical awareness)
  const eyeMaterial = new THREE.MeshStandardMaterial({
    color: 0xff4444,
    roughness: 0.1,
    metalness: 0.0,
    emissive: 0xcc2222,
    emissiveIntensity: 1.2,
  });

  // Metal clasp/decoration
  const metalMaterial = new THREE.MeshStandardMaterial({
    color: 0x886633,
    roughness: 0.3,
    metalness: 0.7,
  });

  // Magical glow
  const glowMaterial = new THREE.MeshStandardMaterial({
    color: 0x8866aa,
    roughness: 0.2,
    metalness: 0.0,
    emissive: 0x6644aa,
    emissiveIntensity: 0.6,
    transparent: true,
    opacity: 0.4,
  });

  // === BOOK BODY (open, floating) ===
  // Front cover (tilted open)
  const frontCover = new THREE.Mesh(
    new THREE.BoxGeometry(0.25 * s, 0.32 * s, 0.02 * s),
    leatherMaterial
  );
  frontCover.position.set(-0.1 * s, 0.4 * s, 0);
  frontCover.rotation.y = 0.4;
  group.add(frontCover);

  // Back cover
  const backCover = new THREE.Mesh(
    new THREE.BoxGeometry(0.25 * s, 0.32 * s, 0.02 * s),
    leatherMaterial
  );
  backCover.position.set(0.1 * s, 0.4 * s, 0);
  backCover.rotation.y = -0.4;
  group.add(backCover);

  // === SPINE WITH TEETH (canonical) ===
  const spine = new THREE.Mesh(
    new THREE.BoxGeometry(0.04 * s, 0.32 * s, 0.08 * s),
    spineMaterial
  );
  spine.position.set(0, 0.4 * s, 0);
  group.add(spine);

  // Teeth along spine (canonical - "Teeth line the spine")
  const toothGeo = new THREE.BoxGeometry(0.015 * s, 0.025 * s, 0.02 * s);
  const numTeeth = 10;

  for (let i = 0; i < numTeeth; i++) {
    const yOffset = 0.28 + (i / numTeeth) * 0.24;

    // Top teeth
    const topTooth = new THREE.Mesh(toothGeo, teethMaterial);
    topTooth.position.set(0, yOffset * s, 0.05 * s);
    topTooth.rotation.x = 0.3;
    group.add(topTooth);

    // Bottom teeth
    const bottomTooth = new THREE.Mesh(toothGeo, teethMaterial);
    bottomTooth.position.set(0, yOffset * s, -0.05 * s);
    bottomTooth.rotation.x = -0.3;
    group.add(bottomTooth);
  }

  // Larger fangs at corners
  const fangGeo = new THREE.BoxGeometry(0.02 * s, 0.04 * s, 0.025 * s);

  const topFang1 = new THREE.Mesh(fangGeo, teethMaterial);
  topFang1.position.set(0, 0.54 * s, 0.055 * s);
  topFang1.rotation.x = 0.4;
  group.add(topFang1);

  const topFang2 = new THREE.Mesh(fangGeo, teethMaterial);
  topFang2.position.set(0, 0.26 * s, 0.055 * s);
  topFang2.rotation.x = 0.4;
  group.add(topFang2);

  const bottomFang1 = new THREE.Mesh(fangGeo, teethMaterial);
  bottomFang1.position.set(0, 0.54 * s, -0.055 * s);
  bottomFang1.rotation.x = -0.4;
  group.add(bottomFang1);

  const bottomFang2 = new THREE.Mesh(fangGeo, teethMaterial);
  bottomFang2.position.set(0, 0.26 * s, -0.055 * s);
  bottomFang2.rotation.x = -0.4;
  group.add(bottomFang2);

  // === PAGES (flutter menacingly - canonical) ===
  // Main page block
  const pageBlock = new THREE.Mesh(
    new THREE.BoxGeometry(0.2 * s, 0.28 * s, 0.06 * s),
    pageMaterial
  );
  pageBlock.position.set(0, 0.4 * s, 0);
  group.add(pageBlock);

  // Fluttering pages (several angled pages)
  const pageGeo = new THREE.BoxGeometry(0.18 * s, 0.26 * s, 0.003 * s);

  const flutterPages = [
    { x: -0.08, rot: 0.3, mat: pageMaterial },
    { x: -0.05, rot: 0.15, mat: agedPageMaterial },
    { x: 0.05, rot: -0.15, mat: pageMaterial },
    { x: 0.08, rot: -0.3, mat: agedPageMaterial },
  ];

  flutterPages.forEach((page) => {
    const p = new THREE.Mesh(pageGeo, page.mat);
    p.position.set(page.x * s, 0.4 * s, 0);
    p.rotation.y = page.rot;
    group.add(p);
  });

  // Flying loose pages (paper projectiles hint)
  const loosePageGeo = new THREE.BoxGeometry(0.06 * s, 0.08 * s, 0.002 * s);
  const loosePages = [
    { x: -0.2, y: 0.5, z: 0.1, ry: 0.5, rz: 0.2 },
    { x: 0.18, y: 0.35, z: 0.12, ry: -0.4, rz: -0.3 },
    { x: -0.15, y: 0.28, z: -0.08, ry: 0.3, rz: 0.4 },
  ];

  loosePages.forEach((lp) => {
    const page = new THREE.Mesh(loosePageGeo, agedPageMaterial);
    page.position.set(lp.x * s, lp.y * s, lp.z * s);
    page.rotation.y = lp.ry;
    page.rotation.z = lp.rz;
    group.add(page);
  });

  // === EYES (menacing awareness) ===
  const eyeGeo = new THREE.SphereGeometry(0.025 * s, 6, 4);

  // Eye on front cover
  const frontEye = new THREE.Mesh(eyeGeo, eyeMaterial);
  frontEye.position.set(-0.12 * s, 0.45 * s, 0.04 * s);
  group.add(frontEye);

  // Eye on back cover
  const backEye = new THREE.Mesh(eyeGeo, eyeMaterial);
  backEye.position.set(0.12 * s, 0.45 * s, -0.04 * s);
  group.add(backEye);

  // === DECORATIVE METAL CLASPS ===
  const claspGeo = new THREE.BoxGeometry(0.04 * s, 0.04 * s, 0.015 * s);

  const clasp1 = new THREE.Mesh(claspGeo, metalMaterial);
  clasp1.position.set(-0.18 * s, 0.35 * s, 0.02 * s);
  clasp1.rotation.y = 0.4;
  group.add(clasp1);

  const clasp2 = new THREE.Mesh(claspGeo, metalMaterial);
  clasp2.position.set(-0.18 * s, 0.45 * s, 0.02 * s);
  clasp2.rotation.y = 0.4;
  group.add(clasp2);

  // Corner reinforcements
  const cornerGeo = new THREE.BoxGeometry(0.03 * s, 0.03 * s, 0.025 * s);
  const corners = [
    { x: -0.2, y: 0.55 },
    { x: -0.2, y: 0.25 },
    { x: 0.2, y: 0.55 },
    { x: 0.2, y: 0.25 },
  ];

  corners.forEach((corner) => {
    const c = new THREE.Mesh(cornerGeo, metalMaterial);
    c.position.set(corner.x * s, corner.y * s, 0);
    group.add(c);
  });

  // === MAGICAL FLOATING EFFECT ===
  // Glow beneath book
  const floatGlow = new THREE.Mesh(
    new THREE.CylinderGeometry(0.15 * s, 0.2 * s, 0.02 * s, 8),
    glowMaterial
  );
  floatGlow.position.y = 0.2 * s;
  group.add(floatGlow);

  // Magic particles around book
  const particleGeo = new THREE.SphereGeometry(0.015 * s, 4, 4);
  const particlePositions = [
    { x: -0.25, y: 0.5, z: 0.1 },
    { x: 0.22, y: 0.38, z: -0.08 },
    { x: -0.18, y: 0.3, z: -0.12 },
    { x: 0.15, y: 0.55, z: 0.08 },
  ];

  particlePositions.forEach((pos) => {
    const particle = new THREE.Mesh(particleGeo, glowMaterial);
    particle.position.set(pos.x * s, pos.y * s, pos.z * s);
    group.add(particle);
  });

  return group;
}

export const ANIMATED_TOME_META = {
  id: 'animated-tome',
  name: 'Animated Tome',
  category: 'enemy' as const,
  description: 'Large leather-bound book floating in the air. Pages flutter menacingly. Teeth line the spine - canonical design',
  defaultScale: 1.0,
  boundingBox: { x: 0.5, y: 0.6, z: 0.3 },
  tags: ['book', 'magic', 'enemy', 'creature', 'animated', 'mimic', 'canonical'],
  enemyName: 'Animated Tome',
};
