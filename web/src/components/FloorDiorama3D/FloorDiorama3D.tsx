/**
 * FloorDiorama3D - Isometric cross-section visualization of all 8 dungeon floors
 *
 * Features:
 * - 8 stacked platform layers with biome-specific colors
 * - Floating boss symbols above each floor
 * - Slow rotation animation
 * - Parallax response to scroll
 * - Particle effects per biome
 */

import { useRef, useEffect } from 'react';
import * as THREE from 'three';

export interface FloorDiorama3DProps {
  /** Enable scroll-based parallax effect */
  enableParallax?: boolean;
  /** Height of the container */
  height?: number;
}

// Floor configuration with biome mapping
const FLOORS = [
  { floor: 1, name: 'Stone Dungeon', biome: 'dungeon', boss: 'K', bossName: 'Goblin King' },
  { floor: 2, name: 'Sewers', biome: 'sewer', boss: 'r', bossName: 'Rat King' },
  { floor: 3, name: 'Forest Depths', biome: 'forest', boss: 'S', bossName: 'Spider Queen' },
  { floor: 4, name: 'Mirror Valdris', biome: 'crypt', boss: 'R', bossName: 'The Regent' },
  { floor: 5, name: 'Ice Cavern', biome: 'ice', boss: 'F', bossName: 'Frost Giant' },
  { floor: 6, name: 'Ancient Library', biome: 'library', boss: 'A', bossName: 'Arcane Keeper' },
  { floor: 7, name: 'Volcanic Depths', biome: 'lava', boss: '\u03A6', bossName: 'Flame Lord' },
  { floor: 8, name: 'Crystal Cave', biome: 'crystal', boss: 'E', bossName: 'Dragon Emperor' },
];

// Biome color palette (RGB 0-1 for Three.js)
const BIOME_COLORS: Record<string, { platform: number; glow: number; accent: number }> = {
  dungeon: { platform: 0x3a3a4a, glow: 0xff9944, accent: 0xff6600 },
  sewer: { platform: 0x324032, glow: 0x66aa66, accent: 0x44cc44 },
  forest: { platform: 0x2a3a22, glow: 0x88dd66, accent: 0x66ff44 },
  crypt: { platform: 0x3a3040, glow: 0xaa88dd, accent: 0x9966ff },
  ice: { platform: 0x405060, glow: 0x88ccff, accent: 0x44aaff },
  library: { platform: 0x4a3a2a, glow: 0xffcc88, accent: 0xffaa44 },
  lava: { platform: 0x4a2a1a, glow: 0xff6644, accent: 0xff4422 },
  crystal: { platform: 0x3a3a50, glow: 0xcc88ff, accent: 0xaa66ff },
};

export function FloorDiorama3D({
  enableParallax = true,
  height = 500,
}: FloorDiorama3DProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const animationIdRef = useRef<number>(0);
  const timeRef = useRef<number>(0);
  const scrollOffsetRef = useRef<number>(0);
  const platformsRef = useRef<THREE.Group[]>([]);
  const bossSpritesRef = useRef<THREE.Sprite[]>([]);
  const glowLightsRef = useRef<THREE.PointLight[]>([]);

  useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    const width = container.clientWidth || 800;
    const containerHeight = height;

    // Scene setup
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x0a0a12, 0.025);
    sceneRef.current = scene;

    // Camera - isometric-ish perspective
    const camera = new THREE.PerspectiveCamera(45, width / containerHeight, 0.1, 100);
    camera.position.set(12, 10, 12);
    camera.lookAt(0, 2, 0);
    cameraRef.current = camera;

    // Renderer
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
    });
    renderer.setSize(width, containerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x0a0a12, 1);
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Ambient light
    const ambient = new THREE.AmbientLight(0x222233, 0.4);
    scene.add(ambient);

    // Directional light from above
    const dirLight = new THREE.DirectionalLight(0xffffff, 0.3);
    dirLight.position.set(5, 10, 5);
    scene.add(dirLight);

    // Create floor platforms (bottom to top)
    const platformSpacing = 1.8;
    const platformSize = 4;
    const platformThickness = 0.3;

    FLOORS.forEach((floorData, index) => {
      const colors = BIOME_COLORS[floorData.biome];
      const yPos = index * platformSpacing;

      const group = new THREE.Group();

      // Main platform
      const platformGeom = new THREE.BoxGeometry(
        platformSize,
        platformThickness,
        platformSize
      );
      const platformMat = new THREE.MeshStandardMaterial({
        color: colors.platform,
        roughness: 0.7,
        metalness: 0.2,
      });
      const platform = new THREE.Mesh(platformGeom, platformMat);
      platform.position.y = yPos;
      group.add(platform);

      // Edge glow
      const edgeGeom = new THREE.BoxGeometry(
        platformSize + 0.1,
        0.05,
        platformSize + 0.1
      );
      const edgeMat = new THREE.MeshBasicMaterial({
        color: colors.glow,
        transparent: true,
        opacity: 0.4,
      });
      const edge = new THREE.Mesh(edgeGeom, edgeMat);
      edge.position.y = yPos + platformThickness / 2 + 0.03;
      group.add(edge);

      // Platform light
      const light = new THREE.PointLight(colors.glow, 0.5, 4);
      light.position.set(0, yPos + 1, 0);
      group.add(light);
      glowLightsRef.current.push(light);

      // Decorative pillars at corners
      const pillarGeom = new THREE.CylinderGeometry(0.1, 0.15, 0.5, 6);
      const pillarMat = new THREE.MeshStandardMaterial({
        color: colors.platform,
        roughness: 0.6,
        metalness: 0.3,
      });

      const pillarPositions = [
        [-platformSize / 2 + 0.3, -platformSize / 2 + 0.3],
        [platformSize / 2 - 0.3, -platformSize / 2 + 0.3],
        [-platformSize / 2 + 0.3, platformSize / 2 - 0.3],
        [platformSize / 2 - 0.3, platformSize / 2 - 0.3],
      ];

      pillarPositions.forEach(([x, z]) => {
        const pillar = new THREE.Mesh(pillarGeom, pillarMat);
        pillar.position.set(x, yPos + platformThickness / 2 + 0.25, z);
        group.add(pillar);
      });

      // Boss symbol sprite
      const bossSprite = createBossSprite(floorData.boss, colors.accent);
      bossSprite.position.set(0, yPos + 1.2, 0);
      bossSprite.scale.set(0.6, 0.6, 1);
      group.add(bossSprite);
      bossSpritesRef.current.push(bossSprite);

      scene.add(group);
      platformsRef.current.push(group);
    });

    // Connecting beams between floors
    const beamMat = new THREE.MeshBasicMaterial({
      color: 0x333344,
      transparent: true,
      opacity: 0.3,
    });

    for (let i = 0; i < FLOORS.length - 1; i++) {
      const beamGeom = new THREE.CylinderGeometry(0.05, 0.05, platformSpacing - platformThickness);
      const beam = new THREE.Mesh(beamGeom, beamMat);
      beam.position.set(0, i * platformSpacing + platformSpacing / 2 + platformThickness / 2, 0);
      scene.add(beam);
    }

    // Scroll handler for parallax
    function handleScroll() {
      if (!enableParallax) return;
      const rect = container.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const scrollProgress = 1 - (rect.top + rect.height / 2) / viewportHeight;
      scrollOffsetRef.current = Math.max(-1, Math.min(1, scrollProgress));
    }

    // Animation loop
    let lastTime = performance.now();

    function animate() {
      const currentTime = performance.now();
      const delta = (currentTime - lastTime) / 1000;
      lastTime = currentTime;
      timeRef.current += delta;
      const t = timeRef.current;

      // Rotate camera slowly around the diorama
      if (cameraRef.current) {
        const radius = 16;
        const rotationSpeed = 0.1;
        const angle = t * rotationSpeed;

        // Apply parallax tilt based on scroll
        const baseCameraY = 10 + scrollOffsetRef.current * 4;

        cameraRef.current.position.x = Math.sin(angle) * radius;
        cameraRef.current.position.z = Math.cos(angle) * radius;
        cameraRef.current.position.y = baseCameraY;
        cameraRef.current.lookAt(0, 5, 0);
      }

      // Animate boss sprites (gentle bob)
      bossSpritesRef.current.forEach((sprite, i) => {
        const baseY = i * platformSpacing + 1.2;
        sprite.position.y = baseY + Math.sin(t * 2 + i * 0.5) * 0.1;
      });

      // Animate glow lights (subtle pulse)
      glowLightsRef.current.forEach((light, i) => {
        light.intensity = 0.4 + Math.sin(t * 1.5 + i * 0.3) * 0.15;
      });

      if (rendererRef.current && sceneRef.current && cameraRef.current) {
        rendererRef.current.render(sceneRef.current, cameraRef.current);
      }

      animationIdRef.current = requestAnimationFrame(animate);
    }

    animate();

    // Handle resize
    function handleResize() {
      if (!containerRef.current || !cameraRef.current || !rendererRef.current) return;
      const w = containerRef.current.clientWidth;
      cameraRef.current.aspect = w / containerHeight;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(w, containerHeight);
    }

    window.addEventListener('resize', handleResize);
    window.addEventListener('scroll', handleScroll, { passive: true });

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('scroll', handleScroll);
      cancelAnimationFrame(animationIdRef.current);

      if (rendererRef.current && containerRef.current) {
        containerRef.current.removeChild(rendererRef.current.domElement);
        rendererRef.current.dispose();
      }

      scene.traverse((obj) => {
        if (obj instanceof THREE.Mesh) {
          obj.geometry.dispose();
          if (Array.isArray(obj.material)) {
            obj.material.forEach((m) => m.dispose());
          } else {
            obj.material.dispose();
          }
        }
      });

      platformsRef.current = [];
      bossSpritesRef.current = [];
      glowLightsRef.current = [];
    };
  }, [enableParallax, height]);

  return (
    <div
      ref={containerRef}
      style={{
        width: '100%',
        height: `${height}px`,
        position: 'relative',
        borderRadius: '8px',
        overflow: 'hidden',
      }}
    />
  );
}

/**
 * Create a sprite with boss symbol text
 */
function createBossSprite(symbol: string, color: number): THREE.Sprite {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d')!;

  // Glow background
  const gradient = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
  const hexColor = '#' + color.toString(16).padStart(6, '0');
  gradient.addColorStop(0, hexColor + 'cc');
  gradient.addColorStop(0.5, hexColor + '44');
  gradient.addColorStop(1, hexColor + '00');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 128, 128);

  // Boss symbol
  ctx.font = 'bold 64px monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#ffffff';
  ctx.shadowColor = hexColor;
  ctx.shadowBlur = 10;
  ctx.fillText(symbol, 64, 64);

  const texture = new THREE.CanvasTexture(canvas);
  const material = new THREE.SpriteMaterial({
    map: texture,
    transparent: true,
    blending: THREE.AdditiveBlending,
  });

  return new THREE.Sprite(material);
}

export default FloorDiorama3D;
