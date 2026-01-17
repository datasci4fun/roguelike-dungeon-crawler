/**
 * DebugScene3D - Three.js-based 3D debug view for tile inspection
 *
 * Provides free-form camera control to inspect tiles from any angle.
 * Use WASD to move, mouse to look around.
 */

import { useRef, useEffect, useCallback } from 'react';
import * as THREE from 'three';

// Dungeon map for the debug scene
const DEBUG_MAP: string[] = [
  '###############',
  '#.....#.......#',
  '#.###.#.#####.#',
  '#.#...#.#...#.#',
  '#.#.###.#.#.#.#',
  '#.#.....#.#...#',
  '#.#######.###.#',
  '#.........#...#',
  '#.#######.#.###',
  '#.#.....#.#...#',
  '#.#.###.#.###.#',
  '#...#.....#...#',
  '###############',
];

const TILE_SIZE = 2; // World units per tile
const WALL_HEIGHT = 2.5;

interface DebugScene3DProps {
  width?: number;
  height?: number;
  biome?: string;
}

export function DebugScene3D({
  width = 800,
  height = 600,
  biome = 'dungeon',
}: DebugScene3DProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<{
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    renderer: THREE.WebGLRenderer;
    animationId: number;
    keys: Set<string>;
    mouseState: { locked: boolean; yaw: number; pitch: number };
  } | null>(null);

  // Initialize Three.js scene
  useEffect(() => {
    if (!containerRef.current) return;

    // Scene setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x1a1a2e);

    // Camera
    const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 100);
    camera.position.set(3, 1.5, 3); // Start inside the dungeon
    camera.rotation.order = 'YXZ';

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    containerRef.current.appendChild(renderer.domElement);

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    scene.add(ambientLight);

    const pointLight = new THREE.PointLight(0xffaa55, 1, 20);
    pointLight.position.copy(camera.position);
    scene.add(pointLight);

    // Load textures
    const textureLoader = new THREE.TextureLoader();
    const basePath = `/tiles/${biome}`;

    const floorTexture = textureLoader.load(`${basePath}/floor.png`);
    floorTexture.wrapS = floorTexture.wrapT = THREE.RepeatWrapping;

    const ceilingTexture = textureLoader.load(`${basePath}/ceiling.png`);
    ceilingTexture.wrapS = ceilingTexture.wrapT = THREE.RepeatWrapping;

    const wallTexture = textureLoader.load(`${basePath}/wall_front.png`);
    wallTexture.wrapS = wallTexture.wrapT = THREE.RepeatWrapping;

    // Materials
    const floorMaterial = new THREE.MeshStandardMaterial({
      map: floorTexture,
      roughness: 0.8,
    });
    const ceilingMaterial = new THREE.MeshStandardMaterial({
      map: ceilingTexture,
      roughness: 0.9,
    });
    const wallMaterial = new THREE.MeshStandardMaterial({
      map: wallTexture,
      roughness: 0.7,
    });

    // Build dungeon geometry
    const mapHeight = DEBUG_MAP.length;
    const mapWidth = DEBUG_MAP[0].length;

    for (let z = 0; z < mapHeight; z++) {
      for (let x = 0; x < mapWidth; x++) {
        const tile = DEBUG_MAP[z][x];
        const worldX = x * TILE_SIZE;
        const worldZ = z * TILE_SIZE;

        if (tile === '.') {
          // Floor
          const floorGeom = new THREE.PlaneGeometry(TILE_SIZE, TILE_SIZE);
          const floor = new THREE.Mesh(floorGeom, floorMaterial);
          floor.rotation.x = -Math.PI / 2;
          floor.position.set(worldX + TILE_SIZE / 2, 0, worldZ + TILE_SIZE / 2);
          scene.add(floor);

          // Ceiling
          const ceilingGeom = new THREE.PlaneGeometry(TILE_SIZE, TILE_SIZE);
          const ceiling = new THREE.Mesh(ceilingGeom, ceilingMaterial);
          ceiling.rotation.x = Math.PI / 2;
          ceiling.position.set(worldX + TILE_SIZE / 2, WALL_HEIGHT, worldZ + TILE_SIZE / 2);
          scene.add(ceiling);
        } else if (tile === '#') {
          // Wall block (all 4 sides + top)
          const wallGeom = new THREE.BoxGeometry(TILE_SIZE, WALL_HEIGHT, TILE_SIZE);
          const wall = new THREE.Mesh(wallGeom, wallMaterial);
          wall.position.set(worldX + TILE_SIZE / 2, WALL_HEIGHT / 2, worldZ + TILE_SIZE / 2);
          scene.add(wall);
        }
      }
    }

    // Input state
    const keys = new Set<string>();
    const mouseState = { locked: false, yaw: 0, pitch: 0 };

    // Store refs
    sceneRef.current = {
      scene,
      camera,
      renderer,
      animationId: 0,
      keys,
      mouseState,
    };

    // Animation loop
    const clock = new THREE.Clock();
    const animate = () => {
      const delta = clock.getDelta();
      const speed = 5 * delta;

      // Camera movement
      const forward = new THREE.Vector3();
      camera.getWorldDirection(forward);
      forward.y = 0;
      forward.normalize();

      const right = new THREE.Vector3();
      right.crossVectors(forward, new THREE.Vector3(0, 1, 0)).normalize();

      if (keys.has('w') || keys.has('arrowup')) {
        camera.position.addScaledVector(forward, speed);
      }
      if (keys.has('s') || keys.has('arrowdown')) {
        camera.position.addScaledVector(forward, -speed);
      }
      if (keys.has('a') || keys.has('arrowleft')) {
        camera.position.addScaledVector(right, -speed);
      }
      if (keys.has('d') || keys.has('arrowright')) {
        camera.position.addScaledVector(right, speed);
      }
      if (keys.has(' ') || keys.has('e')) {
        camera.position.y += speed;
      }
      if (keys.has('shift') || keys.has('q')) {
        camera.position.y -= speed;
      }

      // Update point light to follow camera
      pointLight.position.copy(camera.position);

      renderer.render(scene, camera);
      sceneRef.current!.animationId = requestAnimationFrame(animate);
    };

    sceneRef.current.animationId = requestAnimationFrame(animate);

    // Cleanup
    return () => {
      cancelAnimationFrame(sceneRef.current?.animationId || 0);

      // Dispose all scene objects (geometries and materials)
      scene.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.geometry.dispose();
          if (Array.isArray(child.material)) {
            child.material.forEach((m) => m.dispose());
          } else if (child.material) {
            child.material.dispose();
          }
        }
      });

      // Dispose textures
      floorTexture.dispose();
      ceilingTexture.dispose();
      wallTexture.dispose();

      // Remove canvas from DOM
      if (containerRef.current?.contains(renderer.domElement)) {
        containerRef.current.removeChild(renderer.domElement);
      }

      // Force WebGL context release and dispose renderer
      renderer.forceContextLoss();
      renderer.dispose();
      sceneRef.current = null;
    };
  }, [width, height, biome]);

  // Keyboard handlers
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!sceneRef.current) return;
      sceneRef.current.keys.add(e.key.toLowerCase());
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (!sceneRef.current) return;
      sceneRef.current.keys.delete(e.key.toLowerCase());
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // Mouse look handlers
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (!sceneRef.current) return;
    if (e.button === 0) {
      sceneRef.current.mouseState.locked = true;
      (e.target as HTMLElement).requestPointerLock?.();
    }
  }, []);

  const handleMouseUp = useCallback(() => {
    if (!sceneRef.current) return;
    sceneRef.current.mouseState.locked = false;
    document.exitPointerLock?.();
  }, []);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!sceneRef.current) return;
      if (!sceneRef.current.mouseState.locked && document.pointerLockElement !== containerRef.current?.querySelector('canvas')) return;

      const sensitivity = 0.002;
      const { camera } = sceneRef.current;

      // Yaw (left/right)
      camera.rotation.y -= e.movementX * sensitivity;

      // Pitch (up/down) with clamping
      camera.rotation.x -= e.movementY * sensitivity;
      camera.rotation.x = Math.max(-Math.PI / 2 + 0.1, Math.min(Math.PI / 2 - 0.1, camera.rotation.x));
    };

    document.addEventListener('mousemove', handleMouseMove);
    return () => document.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <div style={{ position: 'relative' }}>
      <div
        ref={containerRef}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onContextMenu={(e) => e.preventDefault()}
        style={{ cursor: 'crosshair' }}
      />
      <div
        style={{
          position: 'absolute',
          top: 10,
          left: 10,
          background: 'rgba(0,0,0,0.7)',
          color: '#fff',
          padding: '10px',
          borderRadius: '5px',
          fontSize: '12px',
          pointerEvents: 'none',
        }}
      >
        <strong>3D Debug View</strong>
        <br />
        Click + drag to look around
        <br />
        WASD - Move
        <br />
        E/Space - Up | Q/Shift - Down
      </div>
    </div>
  );
}

export default DebugScene3D;
