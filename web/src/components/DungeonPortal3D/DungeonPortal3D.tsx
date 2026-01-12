/**
 * DungeonPortal3D - Animated 3D dungeon entrance for auth pages
 *
 * Features:
 * - Stone archway with torches
 * - Flickering torch lights
 * - Swirling fog/mist in portal
 * - Field glow emanating from center
 * - Floating dust particles
 * - Subtle camera drift
 */

import { useRef, useEffect } from 'react';
import * as THREE from 'three';

export interface DungeonPortal3DProps {
  /** Variant affects lighting/mood */
  variant?: 'entrance' | 'return' | 'descent';
  /** Custom Field glow color */
  glowColor?: string;
  /** Opacity for overlay blending */
  opacity?: number;
}

// Color palette
const COLORS = {
  stone: 0x3a3a4a,
  stoneDark: 0x252530,
  torchFlame: 0xff6600,
  torchGlow: 0xff4400,
  fieldGreen: 0x4ade80,
  fieldPurple: 0x8b5cf6,
  fogDark: 0x0a0a12,
  dust: 0xaaaaaa,
};

export function DungeonPortal3D({
  variant = 'entrance',
  glowColor,
  opacity = 1,
}: DungeonPortal3DProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const animationIdRef = useRef<number>(0);
  const timeRef = useRef<number>(0);

  // Animated elements refs
  const torchLightsRef = useRef<THREE.PointLight[]>([]);
  const portalGlowRef = useRef<THREE.Mesh | null>(null);
  const dustParticlesRef = useRef<THREE.Points | null>(null);
  const fogPlaneRef = useRef<THREE.Mesh | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    const width = container.clientWidth || 800;
    const height = container.clientHeight || 600;

    // Determine glow color based on variant
    const portalGlowColor = glowColor
      ? new THREE.Color(glowColor)
      : variant === 'descent'
        ? new THREE.Color(COLORS.fieldPurple)
        : new THREE.Color(COLORS.fieldGreen);

    // Scene setup
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(COLORS.fogDark, 0.08);
    sceneRef.current = scene;

    // Camera
    const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 100);
    camera.position.set(0, 1.6, 6);
    camera.lookAt(0, 1.5, 0);
    cameraRef.current = camera;

    // Renderer
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(COLORS.fogDark, opacity);
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Ambient light (very dim)
    const ambient = new THREE.AmbientLight(0x111122, 0.3);
    scene.add(ambient);

    // Ground plane
    const groundGeom = new THREE.PlaneGeometry(20, 20);
    const groundMat = new THREE.MeshStandardMaterial({
      color: COLORS.stoneDark,
      roughness: 0.9,
      metalness: 0.1,
    });
    const ground = new THREE.Mesh(groundGeom, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = 0;
    scene.add(ground);

    // Create stone archway
    createArchway(scene);

    // Torches with flickering lights
    const leftTorch = createTorch();
    leftTorch.position.set(-2.2, 1.5, 0.5);
    scene.add(leftTorch);

    const rightTorch = createTorch();
    rightTorch.position.set(2.2, 1.5, 0.5);
    scene.add(rightTorch);

    // Torch point lights
    const leftLight = new THREE.PointLight(COLORS.torchGlow, 1.5, 8);
    leftLight.position.set(-2.2, 2.2, 0.5);
    scene.add(leftLight);

    const rightLight = new THREE.PointLight(COLORS.torchGlow, 1.5, 8);
    rightLight.position.set(2.2, 2.2, 0.5);
    scene.add(rightLight);

    torchLightsRef.current = [leftLight, rightLight];

    // Portal glow (center of archway)
    const portalGlowGeom = new THREE.PlaneGeometry(3, 4);
    const portalGlowMat = new THREE.MeshBasicMaterial({
      color: portalGlowColor,
      transparent: true,
      opacity: 0.15,
      side: THREE.DoubleSide,
    });
    const portalGlow = new THREE.Mesh(portalGlowGeom, portalGlowMat);
    portalGlow.position.set(0, 2, -0.5);
    scene.add(portalGlow);
    portalGlowRef.current = portalGlow;

    // Swirling fog inside portal
    const fogGeom = new THREE.PlaneGeometry(3.5, 4.5);
    const fogMat = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uColor: { value: portalGlowColor },
      },
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform float uTime;
        uniform vec3 uColor;
        varying vec2 vUv;

        float noise(vec2 p) {
          return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
        }

        void main() {
          vec2 center = vUv - 0.5;
          float dist = length(center);

          // Swirling effect
          float angle = atan(center.y, center.x) + uTime * 0.5;
          float swirl = sin(angle * 3.0 + dist * 10.0 - uTime * 2.0) * 0.5 + 0.5;

          // Radial gradient
          float radial = 1.0 - smoothstep(0.2, 0.5, dist);

          // Noise for variation
          float n = noise(vUv * 10.0 + uTime * 0.3);

          float alpha = radial * swirl * 0.4 * (0.7 + n * 0.3);

          gl_FragColor = vec4(uColor, alpha);
        }
      `,
      transparent: true,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    const fogPlane = new THREE.Mesh(fogGeom, fogMat);
    fogPlane.position.set(0, 2, -0.3);
    scene.add(fogPlane);
    fogPlaneRef.current = fogPlane;

    // Floating dust particles
    const dustCount = 200;
    const dustPositions = new Float32Array(dustCount * 3);
    for (let i = 0; i < dustCount; i++) {
      dustPositions[i * 3] = (Math.random() - 0.5) * 12;
      dustPositions[i * 3 + 1] = Math.random() * 5;
      dustPositions[i * 3 + 2] = (Math.random() - 0.5) * 8;
    }

    const dustGeom = new THREE.BufferGeometry();
    dustGeom.setAttribute('position', new THREE.BufferAttribute(dustPositions, 3));

    const dustMat = new THREE.PointsMaterial({
      color: COLORS.dust,
      size: 0.03,
      transparent: true,
      opacity: 0.4,
      sizeAttenuation: true,
    });

    const dustParticles = new THREE.Points(dustGeom, dustMat);
    scene.add(dustParticles);
    dustParticlesRef.current = dustParticles;

    // Animation loop
    let lastTime = performance.now();

    function animate() {
      const currentTime = performance.now();
      const delta = (currentTime - lastTime) / 1000;
      lastTime = currentTime;
      timeRef.current += delta;
      const t = timeRef.current;

      // Torch flicker
      torchLightsRef.current.forEach((light, i) => {
        const flicker = 1 + Math.sin(t * 15 + i * 2) * 0.1 +
                        Math.sin(t * 23 + i * 3) * 0.05 +
                        Math.random() * 0.05;
        light.intensity = 1.5 * flicker;
      });

      // Portal glow pulse
      if (portalGlowRef.current) {
        const pulse = 0.12 + Math.sin(t * 1.5) * 0.03;
        (portalGlowRef.current.material as THREE.MeshBasicMaterial).opacity = pulse;
      }

      // Update fog shader time
      if (fogPlaneRef.current) {
        const mat = fogPlaneRef.current.material as THREE.ShaderMaterial;
        mat.uniforms.uTime.value = t;
      }

      // Animate dust particles
      if (dustParticlesRef.current) {
        const positions = dustParticlesRef.current.geometry.attributes.position.array as Float32Array;
        for (let i = 0; i < positions.length / 3; i++) {
          positions[i * 3 + 1] += delta * 0.1; // Rise slowly
          if (positions[i * 3 + 1] > 5) {
            positions[i * 3 + 1] = 0;
          }
          // Slight horizontal drift
          positions[i * 3] += Math.sin(t + i) * delta * 0.02;
        }
        dustParticlesRef.current.geometry.attributes.position.needsUpdate = true;
      }

      // Subtle camera drift
      if (cameraRef.current) {
        cameraRef.current.position.x = Math.sin(t * 0.2) * 0.15;
        cameraRef.current.position.y = 1.6 + Math.sin(t * 0.3) * 0.05;
        cameraRef.current.lookAt(0, 1.5, 0);
      }

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
      const h = containerRef.current.clientHeight;
      cameraRef.current.aspect = w / h;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(w, h);
    }

    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationIdRef.current);
      if (rendererRef.current && containerRef.current) {
        containerRef.current.removeChild(rendererRef.current.domElement);
        rendererRef.current.dispose();
      }
      scene.traverse((obj) => {
        if (obj instanceof THREE.Mesh) {
          obj.geometry.dispose();
          if (Array.isArray(obj.material)) {
            obj.material.forEach(m => m.dispose());
          } else {
            obj.material.dispose();
          }
        }
      });
    };
  }, [variant, glowColor, opacity]);

  return (
    <div
      ref={containerRef}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: 0,
      }}
    />
  );
}

/**
 * Create stone archway geometry
 */
function createArchway(scene: THREE.Scene) {
  const stoneMat = new THREE.MeshStandardMaterial({
    color: COLORS.stone,
    roughness: 0.85,
    metalness: 0.1,
  });

  // Left pillar
  const pillarGeom = new THREE.BoxGeometry(0.8, 4, 0.8);
  const leftPillar = new THREE.Mesh(pillarGeom, stoneMat);
  leftPillar.position.set(-2, 2, 0);
  scene.add(leftPillar);

  // Right pillar
  const rightPillar = new THREE.Mesh(pillarGeom, stoneMat);
  rightPillar.position.set(2, 2, 0);
  scene.add(rightPillar);

  // Arch top (simple box for now)
  const archTopGeom = new THREE.BoxGeometry(5.6, 0.6, 0.8);
  const archTop = new THREE.Mesh(archTopGeom, stoneMat);
  archTop.position.set(0, 4.3, 0);
  scene.add(archTop);

  // Decorative keystone
  const keystoneGeom = new THREE.BoxGeometry(0.8, 0.8, 0.9);
  const keystone = new THREE.Mesh(keystoneGeom, stoneMat);
  keystone.position.set(0, 4.6, 0);
  scene.add(keystone);

  // Stone details on pillars
  const capGeom = new THREE.BoxGeometry(1, 0.3, 1);
  const leftCap = new THREE.Mesh(capGeom, stoneMat);
  leftCap.position.set(-2, 4.15, 0);
  scene.add(leftCap);

  const rightCap = new THREE.Mesh(capGeom, stoneMat);
  rightCap.position.set(2, 4.15, 0);
  scene.add(rightCap);
}

/**
 * Create a torch holder
 */
function createTorch(): THREE.Group {
  const group = new THREE.Group();

  // Bracket
  const bracketMat = new THREE.MeshStandardMaterial({
    color: 0x444444,
    roughness: 0.6,
    metalness: 0.4,
  });
  const bracketGeom = new THREE.BoxGeometry(0.1, 0.4, 0.1);
  const bracket = new THREE.Mesh(bracketGeom, bracketMat);
  group.add(bracket);

  // Torch body
  const torchGeom = new THREE.CylinderGeometry(0.06, 0.08, 0.5, 8);
  const torchMat = new THREE.MeshStandardMaterial({
    color: 0x3a2a1a,
    roughness: 0.9,
  });
  const torch = new THREE.Mesh(torchGeom, torchMat);
  torch.position.y = 0.35;
  group.add(torch);

  // Flame glow (simple sprite)
  const flameCanvas = document.createElement('canvas');
  flameCanvas.width = 64;
  flameCanvas.height = 64;
  const ctx = flameCanvas.getContext('2d')!;

  const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
  gradient.addColorStop(0, 'rgba(255, 200, 50, 1)');
  gradient.addColorStop(0.4, 'rgba(255, 100, 0, 0.8)');
  gradient.addColorStop(1, 'rgba(255, 50, 0, 0)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 64, 64);

  const flameTexture = new THREE.CanvasTexture(flameCanvas);
  const flameMat = new THREE.SpriteMaterial({
    map: flameTexture,
    transparent: true,
    blending: THREE.AdditiveBlending,
  });
  const flame = new THREE.Sprite(flameMat);
  flame.scale.set(0.4, 0.5, 1);
  flame.position.y = 0.7;
  group.add(flame);

  return group;
}

export default DungeonPortal3D;
