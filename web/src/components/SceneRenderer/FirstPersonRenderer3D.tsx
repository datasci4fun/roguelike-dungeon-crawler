/**
 * FirstPersonRenderer3D - Three.js-based first-person renderer
 *
 * Drop-in replacement for FirstPersonRenderer that uses real 3D
 * instead of Canvas 2D perspective tricks.
 *
 * Accepts the same props as FirstPersonRenderer for easy swapping.
 */

import { useRef, useEffect, useMemo, useCallback } from 'react';
import * as THREE from 'three';
import type { FirstPersonView } from '../../hooks/useGameSocket';
import { getBiome, type BiomeId } from './biomes';

const TILE_SIZE = 2;
const WALL_HEIGHT = 2.5;
const CAMERA_HEIGHT = 1.4;

interface RenderSettings {
  biome: BiomeId;
  brightness: number;
  fogDensity: number;
  torchIntensity: number;
  useTileGrid: boolean;
}

const DEFAULT_SETTINGS: RenderSettings = {
  biome: 'dungeon',
  brightness: 1.0,
  fogDensity: 1.0,
  torchIntensity: 1.0,
  useTileGrid: true,
};

interface FirstPersonRenderer3DProps {
  view: FirstPersonView | undefined;
  width?: number;
  height?: number;
  enableAnimations?: boolean;
  settings?: Partial<RenderSettings>;
  debugShowOccluded?: boolean;
  debugShowWireframe?: boolean;
}

// Check tile types
const isWallTile = (tile: string) => tile === '#';
const isDoorTile = (tile: string) => tile === 'D' || tile === 'd' || tile === '+';
const isFloorTile = (tile: string) => tile === '.' || tile === '>' || tile === '<';

export function FirstPersonRenderer3D({
  view,
  width = 400,
  height = 300,
  enableAnimations = true,
  settings: userSettings,
}: FirstPersonRenderer3DProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<{
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    renderer: THREE.WebGLRenderer;
    animationId: number;
    geometryGroup: THREE.Group;
    materials: {
      floor: THREE.MeshStandardMaterial;
      ceiling: THREE.MeshStandardMaterial;
      wall: THREE.MeshStandardMaterial;
      door: THREE.MeshStandardMaterial;
    };
    textures: {
      floor: THREE.Texture;
      ceiling: THREE.Texture;
      wallFront: THREE.Texture;
      wallLeft: THREE.Texture;
      wallRight: THREE.Texture;
    };
    // Camera control state
    controls: {
      isDragging: boolean;
      yaw: number;
      pitch: number;
      keys: Set<string>;
    };
  } | null>(null);

  const settings: RenderSettings = useMemo(
    () => ({ ...DEFAULT_SETTINGS, ...userSettings }),
    [userSettings]
  );

  const biome = useMemo(() => getBiome(settings.biome), [settings.biome]);

  // Initialize Three.js scene
  useEffect(() => {
    if (!containerRef.current) return;

    // Scene
    const scene = new THREE.Scene();
    const bgColor = new THREE.Color(
      biome.fogColor[0] / 255,
      biome.fogColor[1] / 255,
      biome.fogColor[2] / 255
    );
    scene.background = bgColor;
    scene.fog = new THREE.Fog(bgColor, 1, 15 * settings.fogDensity);

    // Camera - positioned at origin looking forward (into -Z)
    const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 100);
    camera.position.set(0, CAMERA_HEIGHT, 1); // Start at z=1, looking into -Z
    camera.rotation.set(0, 0, 0); // Face forward (default is -Z)

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;

    // Clear any existing canvas first
    while (containerRef.current.firstChild) {
      containerRef.current.removeChild(containerRef.current.firstChild);
    }
    containerRef.current.appendChild(renderer.domElement);

    // Lighting
    const ambientLight = new THREE.AmbientLight(
      new THREE.Color(
        biome.lightColor[0] / 255,
        biome.lightColor[1] / 255,
        biome.lightColor[2] / 255
      ),
      0.3 * settings.brightness
    );
    scene.add(ambientLight);

    // Point light at camera (torch)
    const torchLight = new THREE.PointLight(0xffaa55, settings.torchIntensity, 12);
    torchLight.position.copy(camera.position);
    scene.add(torchLight);

    // Load textures
    const textureLoader = new THREE.TextureLoader();
    const basePath = `/tiles/${settings.biome}`;

    const loadTexture = (path: string): THREE.Texture => {
      const tex = textureLoader.load(path);
      tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
      tex.magFilter = THREE.NearestFilter;
      tex.minFilter = THREE.NearestMipMapLinearFilter;
      return tex;
    };

    const textures = {
      floor: loadTexture(`${basePath}/floor.png`),
      ceiling: loadTexture(`${basePath}/ceiling.png`),
      wallFront: loadTexture(`${basePath}/wall_front.png`),
      wallLeft: loadTexture(`${basePath}/wall_left.png`),
      wallRight: loadTexture(`${basePath}/wall_right.png`),
    };

    // Materials
    const floorColor = new THREE.Color(
      biome.floorColor[0] / 255,
      biome.floorColor[1] / 255,
      biome.floorColor[2] / 255
    );
    const wallColor = new THREE.Color(
      biome.wallColor[0] / 255,
      biome.wallColor[1] / 255,
      biome.wallColor[2] / 255
    );
    const ceilingColor = new THREE.Color(
      biome.ceilingColor[0] / 255,
      biome.ceilingColor[1] / 255,
      biome.ceilingColor[2] / 255
    );

    const materials = {
      floor: new THREE.MeshStandardMaterial({
        map: textures.floor,
        color: floorColor,
        roughness: 0.8,
      }),
      ceiling: new THREE.MeshStandardMaterial({
        map: textures.ceiling,
        color: ceilingColor,
        roughness: 0.9,
      }),
      wall: new THREE.MeshStandardMaterial({
        map: textures.wallFront,
        color: wallColor,
        roughness: 0.7,
      }),
      door: new THREE.MeshStandardMaterial({
        color: 0x8b4513,
        roughness: 0.6,
      }),
    };

    // Group for dynamic geometry
    const geometryGroup = new THREE.Group();
    scene.add(geometryGroup);

    sceneRef.current = {
      scene,
      camera,
      renderer,
      animationId: 0,
      geometryGroup,
      materials,
      textures,
      controls: {
        isDragging: false,
        yaw: 0,
        pitch: 0,
        keys: new Set(),
      },
    };

    // Animation loop
    let time = 0;
    const animate = () => {
      if (!sceneRef.current) return;

      time += 0.016;

      // Handle keyboard movement
      const { controls } = sceneRef.current;
      const speed = 0.1;

      // Get forward and right vectors based on camera rotation
      const forward = new THREE.Vector3(0, 0, -1);
      forward.applyQuaternion(camera.quaternion);
      forward.y = 0;
      forward.normalize();

      const right = new THREE.Vector3(1, 0, 0);
      right.applyQuaternion(camera.quaternion);
      right.y = 0;
      right.normalize();

      if (controls.keys.has('w') || controls.keys.has('arrowup')) {
        camera.position.addScaledVector(forward, speed);
      }
      if (controls.keys.has('s') || controls.keys.has('arrowdown')) {
        camera.position.addScaledVector(forward, -speed);
      }
      if (controls.keys.has('a') || controls.keys.has('arrowleft')) {
        camera.position.addScaledVector(right, -speed);
      }
      if (controls.keys.has('d') || controls.keys.has('arrowright')) {
        camera.position.addScaledVector(right, speed);
      }
      if (controls.keys.has('e') || controls.keys.has(' ')) {
        camera.position.y += speed;
      }
      if (controls.keys.has('q') || controls.keys.has('shift')) {
        camera.position.y -= speed;
      }

      // Update torch light position
      torchLight.position.copy(camera.position);

      // Subtle torch flicker
      if (enableAnimations) {
        torchLight.intensity = settings.torchIntensity * (0.9 + Math.sin(time * 5) * 0.1);
      }

      renderer.render(scene, camera);
      sceneRef.current.animationId = requestAnimationFrame(animate);
    };

    sceneRef.current.animationId = requestAnimationFrame(animate);

    // Cleanup
    return () => {
      cancelAnimationFrame(sceneRef.current?.animationId || 0);
      renderer.dispose();
      Object.values(materials).forEach(m => m.dispose());
      Object.values(textures).forEach(t => t.dispose());
      if (containerRef.current?.contains(renderer.domElement)) {
        containerRef.current.removeChild(renderer.domElement);
      }
      sceneRef.current = null;
    };
  }, [width, height, settings.biome, settings.brightness, settings.fogDensity, settings.torchIntensity, enableAnimations, biome]);

  // Update geometry when view changes
  useEffect(() => {
    if (!sceneRef.current || !view) return;

    const { geometryGroup, materials } = sceneRef.current;

    // Clear previous geometry
    while (geometryGroup.children.length > 0) {
      const child = geometryGroup.children[0];
      if (child instanceof THREE.Mesh) {
        child.geometry.dispose();
      }
      geometryGroup.remove(child);
    }

    const rows = view.rows;
    if (!rows || rows.length === 0) return;

    // Add floor at player position (depth 0)
    const playerFloor = new THREE.PlaneGeometry(TILE_SIZE * 3, TILE_SIZE);
    const playerFloorMesh = new THREE.Mesh(playerFloor, materials.floor);
    playerFloorMesh.rotation.x = -Math.PI / 2;
    playerFloorMesh.position.set(0, 0, 0);
    geometryGroup.add(playerFloorMesh);

    // Build geometry from view data
    // Each row is at a different depth (z coordinate)
    // Each tile in a row has an offset (x coordinate)
    for (let rowIndex = 0; rowIndex < rows.length; rowIndex++) {
      const row = rows[rowIndex];
      if (!row) continue;

      // Use tile.y for depth if available, otherwise use row index
      // Depth starts at 1 (just in front of player)
      const depth = row[0]?.y ?? (rowIndex + 1);
      const z = -(depth * TILE_SIZE);

      for (const tile of row) {
        const tileChar = tile.tile_actual || tile.tile;
        // x is the lateral offset from center (-2, -1, 0, 1, 2)
        const lateralOffset = tile.offset ?? tile.x ?? 0;
        const x = lateralOffset * TILE_SIZE;

        if (isWallTile(tileChar)) {
          // Wall block
          const wallGeom = new THREE.BoxGeometry(TILE_SIZE, WALL_HEIGHT, TILE_SIZE);
          const wall = new THREE.Mesh(wallGeom, materials.wall);
          wall.position.set(x, WALL_HEIGHT / 2, z);
          geometryGroup.add(wall);
        } else if (isDoorTile(tileChar)) {
          // Door (thinner wall)
          const doorGeom = new THREE.BoxGeometry(TILE_SIZE, WALL_HEIGHT, 0.3);
          const door = new THREE.Mesh(doorGeom, materials.door);
          door.position.set(x, WALL_HEIGHT / 2, z);
          geometryGroup.add(door);

          // Floor under door
          const floorGeom = new THREE.PlaneGeometry(TILE_SIZE, TILE_SIZE);
          const floor = new THREE.Mesh(floorGeom, materials.floor);
          floor.rotation.x = -Math.PI / 2;
          floor.position.set(x, 0, z);
          geometryGroup.add(floor);
        } else if (isFloorTile(tileChar) || tile.walkable) {
          // Floor tile
          const floorGeom = new THREE.PlaneGeometry(TILE_SIZE, TILE_SIZE);
          const floor = new THREE.Mesh(floorGeom, materials.floor);
          floor.rotation.x = -Math.PI / 2;
          floor.position.set(x, 0, z);
          geometryGroup.add(floor);

          // Ceiling tile
          const ceilingGeom = new THREE.PlaneGeometry(TILE_SIZE, TILE_SIZE);
          const ceiling = new THREE.Mesh(ceilingGeom, materials.ceiling);
          ceiling.rotation.x = Math.PI / 2;
          ceiling.position.set(x, WALL_HEIGHT, z);
          geometryGroup.add(ceiling);
        }
      }
    }

    // Add entities as simple billboards/sprites
    for (const entity of view.entities) {
      const x = entity.offset * TILE_SIZE;
      const z = -entity.distance * TILE_SIZE;
      const y = entity.type === 'item' ? 0.3 : CAMERA_HEIGHT * 0.8;

      // Create a simple colored sphere for now
      let color = 0xffffff;
      let size = 0.3;
      if (entity.type === 'enemy') {
        color = entity.is_elite ? 0xff4444 : 0xff8844;
        size = 0.5;
      } else if (entity.type === 'item') {
        color = 0xffff44;
        size = 0.25;
      } else if (entity.type === 'trap') {
        color = 0x44ff44;
        size = 0.2;
      }

      const entityGeom = new THREE.SphereGeometry(size, 8, 8);
      const entityMat = new THREE.MeshStandardMaterial({
        color,
        emissive: color,
        emissiveIntensity: 0.3,
      });
      const entityMesh = new THREE.Mesh(entityGeom, entityMat);
      entityMesh.position.set(x, y, z);
      geometryGroup.add(entityMesh);
    }

  }, [view]);

  // Update camera based on facing direction
  useEffect(() => {
    if (!sceneRef.current || !view) return;

    const { camera } = sceneRef.current;

    // Reset camera to origin
    camera.position.set(0, CAMERA_HEIGHT, 0);

    // Set rotation based on facing
    const { dx, dy } = view.facing;
    if (dx === 0 && dy === -1) {
      // North - looking into -Z
      camera.rotation.set(0, 0, 0);
    } else if (dx === 0 && dy === 1) {
      // South - looking into +Z
      camera.rotation.set(0, Math.PI, 0);
    } else if (dx === 1 && dy === 0) {
      // East - looking into +X
      camera.rotation.set(0, -Math.PI / 2, 0);
    } else if (dx === -1 && dy === 0) {
      // West - looking into -X
      camera.rotation.set(0, Math.PI / 2, 0);
    }
  }, [view?.facing]);

  // Keyboard event handlers
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!sceneRef.current) return;
      sceneRef.current.controls.keys.add(e.key.toLowerCase());
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (!sceneRef.current) return;
      sceneRef.current.controls.keys.delete(e.key.toLowerCase());
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // Mouse event handlers for camera rotation
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (!sceneRef.current) return;
    if (e.button === 2) { // Right click
      sceneRef.current.controls.isDragging = true;
      e.preventDefault();
    }
  }, []);

  const handleMouseUp = useCallback((e: React.MouseEvent) => {
    if (!sceneRef.current) return;
    if (e.button === 2) {
      sceneRef.current.controls.isDragging = false;
    }
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!sceneRef.current) return;
    if (!sceneRef.current.controls.isDragging) return;

    const sensitivity = 0.003;
    const { camera, controls } = sceneRef.current;

    // Update yaw and pitch
    controls.yaw -= e.movementX * sensitivity;
    controls.pitch -= e.movementY * sensitivity;

    // Clamp pitch to prevent flipping
    controls.pitch = Math.max(-Math.PI / 2 + 0.1, Math.min(Math.PI / 2 - 0.1, controls.pitch));

    // Apply rotation using Euler angles
    camera.rotation.set(controls.pitch, controls.yaw, 0, 'YXZ');
  }, []);

  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault(); // Prevent context menu on right-click
  }, []);

  return (
    <div
      ref={containerRef}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseUp}
      onContextMenu={handleContextMenu}
      tabIndex={0}
      style={{
        width,
        height,
        position: 'relative',
        borderRadius: '4px',
        overflow: 'hidden',
        cursor: 'grab',
        outline: 'none',
      }}
    />
  );
}

export default FirstPersonRenderer3D;
