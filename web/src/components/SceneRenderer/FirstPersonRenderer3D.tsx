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

// Entity label configuration
const LABEL_FONT_SIZE = 36;
const LABEL_PADDING = 20;
const LABEL_HEIGHT = 64;

/**
 * Create a sprite with text label for entity names
 * Dynamically sizes canvas to fit text, with strong outline for visibility
 */
function createTextSprite(text: string, color: string = '#ffffff'): THREE.Sprite {
  // Create temporary canvas to measure text
  const measureCanvas = document.createElement('canvas');
  const measureCtx = measureCanvas.getContext('2d')!;
  measureCtx.font = `bold ${LABEL_FONT_SIZE}px Arial`;
  const textMetrics = measureCtx.measureText(text);

  // Calculate canvas size based on text width (with padding for outline)
  const textWidth = Math.ceil(textMetrics.width);
  const canvasWidth = Math.max(128, textWidth + LABEL_PADDING * 2);
  const canvasHeight = LABEL_HEIGHT;

  const canvas = document.createElement('canvas');
  canvas.width = canvasWidth;
  canvas.height = canvasHeight;
  const ctx = canvas.getContext('2d')!;

  // Clear canvas
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Draw semi-transparent background pill for better visibility
  const pillHeight = LABEL_FONT_SIZE + 12;
  const pillY = (canvasHeight - pillHeight) / 2;
  ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
  ctx.beginPath();
  ctx.roundRect(4, pillY, canvasWidth - 8, pillHeight, pillHeight / 2);
  ctx.fill();

  // Setup text rendering
  ctx.font = `bold ${LABEL_FONT_SIZE}px Arial`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  // Draw strong outline/stroke for readability against any background
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.9)';
  ctx.lineWidth = 4;
  ctx.lineJoin = 'round';
  ctx.strokeText(text, canvasWidth / 2, canvasHeight / 2);

  // Draw main text
  ctx.fillStyle = color;
  ctx.fillText(text, canvasWidth / 2, canvasHeight / 2);

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;

  const material = new THREE.SpriteMaterial({
    map: texture,
    transparent: true,
    depthTest: false,  // Always render on top
    depthWrite: false, // Don't write to depth buffer
  });

  const sprite = new THREE.Sprite(material);
  // Scale proportionally based on canvas size, making labels larger and more readable
  const aspectRatio = canvasWidth / canvasHeight;
  sprite.scale.set(aspectRatio * 0.8, 0.8, 1);
  return sprite;
}

/**
 * Create a sprite with symbol on a colored background
 */
function createSymbolSprite(symbol: string, bgColor: number): THREE.Sprite {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d')!;

  // Draw circular background
  ctx.beginPath();
  ctx.arc(64, 64, 60, 0, Math.PI * 2);
  ctx.fillStyle = `#${bgColor.toString(16).padStart(6, '0')}`;
  ctx.fill();

  // Draw border
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 4;
  ctx.stroke();

  // Draw symbol
  ctx.font = 'bold 72px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#ffffff';
  ctx.fillText(symbol, 64, 68);

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;

  const material = new THREE.SpriteMaterial({
    map: texture,
    transparent: true,
  });

  const sprite = new THREE.Sprite(material);
  sprite.scale.set(0.8, 0.8, 1);
  return sprite;
}

// Dim explored-but-not-visible geometry (persistent map memory)
const MEMORY_GEOMETRY_BRIGHTNESS = 0.65;

// Animation constants
const MOVE_ANIMATION_DURATION = 0.15; // seconds
const TURN_ANIMATION_DURATION = 0.12; // seconds
const HEAD_BOB_AMPLITUDE = 0.04; // vertical bob amount
const HEAD_BOB_FREQUENCY = 12; // bobs per second during movement

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

interface FieldPulseState {
  active: boolean;
  amplification: number;
  floor_turn: number;
}

interface FirstPersonRenderer3DProps {
  view: FirstPersonView | undefined;
  width?: number;
  height?: number;
  enableAnimations?: boolean;
  settings?: Partial<RenderSettings>;
  debugShowOccluded?: boolean;
  debugShowWireframe?: boolean;
  debugShowWallMarkers?: boolean;
  deathCamActive?: boolean;
  fieldPulse?: FieldPulseState;
}

// Check tile types
const isWallTile = (tile: string) => tile === '#';
const isDoorTile = (tile: string) => tile === 'D' || tile === 'd' || tile === '+';

export function FirstPersonRenderer3D({
  view,
  width = 400,
  height = 300,
  enableAnimations = true,
  settings: userSettings,
  debugShowWallMarkers = false,
  deathCamActive = false,
  fieldPulse,
}: FirstPersonRenderer3DProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const prevViewRef = useRef<{ rowsJson: string; facing: { dx: number; dy: number } } | null>(null);
  const sceneRef = useRef<{
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    renderer: THREE.WebGLRenderer;
    animationId: number;
    geometryGroup: THREE.Group;
    geometries: {
      tilePlane: THREE.PlaneGeometry;
      wallBox: THREE.BoxGeometry;
      entitySpheres: Map<number, THREE.SphereGeometry>; // optional cache by radius
    };
    materials: {
      floor: THREE.MeshStandardMaterial;
      ceiling: THREE.MeshStandardMaterial;
      wall: THREE.MeshStandardMaterial;
      door: THREE.MeshStandardMaterial;
    };
    memoryMaterials: {
      floor: THREE.MeshStandardMaterial;
      ceiling: THREE.MeshStandardMaterial;
      wall: THREE.MeshStandardMaterial;
      door: THREE.MeshStandardMaterial;
    };
    corridorWallMaterials: {
      leftVisible: THREE.MeshStandardMaterial;
      leftMemory: THREE.MeshStandardMaterial;
      rightVisible: THREE.MeshStandardMaterial;
      rightMemory: THREE.MeshStandardMaterial;
    };
    textures: {
      floor: THREE.Texture;
      ceiling: THREE.Texture;
      wallFront: THREE.Texture;
      wallLeft: THREE.Texture;
      wallRight: THREE.Texture;
    };
    // Tile variants for position-based selection
    variants: {
      floor: THREE.Texture[];
      ceiling: THREE.Texture[];
      wallFront: THREE.Texture[];
    };
    // Camera control state - limited look-around (head movement)
    controls: {
      isDragging: boolean;
      lookYaw: number;    // Offset from base facing direction (limited range)
      lookPitch: number;  // Up/down look offset (limited range)
      baseYaw: number;    // Base yaw from character facing direction
    };
    // Animation state
    animation: {
      // Movement animation (camera offset from origin)
      moveProgress: number;      // 0 = start, 1 = complete
      moveOffsetX: number;       // Starting X offset (animates to 0)
      moveOffsetZ: number;       // Starting Z offset (animates to 0)
      // Turn animation
      turnProgress: number;      // 0 = start, 1 = complete
      turnOffsetYaw: number;     // Starting yaw offset (animates to 0)
      // Head bob
      bobPhase: number;          // Continuous phase for head bob
      isMoving: boolean;         // Whether currently in move animation
      // Previous state for change detection
      prevFacingDx: number;
      prevFacingDy: number;
      // Entity animations - track previous positions
      entityPositions: Map<string, { x: number; z: number; targetX: number; targetZ: number; progress: number }>;
      // Death camera animation
      deathCam: {
        active: boolean;
        t: number;
        duration: number;
        startX: number;
        startY: number;
        startZ: number;
        startPitch: number;
        startYaw: number;
        startRoll: number;
        rollDir: 1 | -1;
      };
    };
  } | null>(null);

  const settings: RenderSettings = useMemo(
    () => ({ ...DEFAULT_SETTINGS, ...userSettings }),
    [userSettings]
  );

  const biome = useMemo(() => getBiome(settings.biome), [settings.biome]);

  // Death camera activation tracking
  const prevDeathRef = useRef(false);

  useEffect(() => {
    const rising = deathCamActive && !prevDeathRef.current;
    const falling = !deathCamActive && prevDeathRef.current;
    prevDeathRef.current = deathCamActive;

    if (!sceneRef.current) return;

    const { camera, animation, controls } = sceneRef.current;

    if (rising) {
      // Snapshot current camera pose
      animation.deathCam.active = true;
      animation.deathCam.t = 0;
      animation.deathCam.startX = camera.position.x;
      animation.deathCam.startY = camera.position.y;
      animation.deathCam.startZ = camera.position.z;
      animation.deathCam.startPitch = camera.rotation.x;
      animation.deathCam.startYaw = camera.rotation.y;
      animation.deathCam.startRoll = camera.rotation.z;
      animation.deathCam.rollDir = Math.random() < 0.5 ? -1 : 1;

      // Freeze look input immediately
      controls.isDragging = false;
    }

    if (falling) {
      animation.deathCam.active = false;
      animation.deathCam.t = 0;
    }
  }, [deathCamActive]);

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
    // Fog: starts at 4 tiles, full opacity at 12 tiles (adjustable via fogDensity)
    // Pushed back to prevent immediate darkness in front of player
    scene.fog = new THREE.Fog(bgColor, 4 * TILE_SIZE * settings.fogDensity, 12 * TILE_SIZE * settings.fogDensity);

    // Camera - positioned at player position looking forward (into -Z)
    const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 100);
    camera.position.set(0, CAMERA_HEIGHT, 0); // Player position
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

    // Lighting - some ambient for visibility, strong torch for player illumination
    const ambientLight = new THREE.AmbientLight(
      new THREE.Color(
        biome.lightColor[0] / 255,
        biome.lightColor[1] / 255,
        biome.lightColor[2] / 255
      ),
      0.15 * settings.brightness // Moderate ambient so scene is never pure black
    );
    scene.add(ambientLight);

    // Point light at camera (torch) - high intensity with quadratic falloff
    // Three.js uses physically correct lighting: intensity / distance^2
    // Need high intensity to illuminate nearby surfaces while falling off quickly
    const torchLight = new THREE.PointLight(
      0xffaa55,                    // Warm torch color
      8 * settings.torchIntensity, // High intensity for visibility
      8,                           // Max distance (falls off to ~0 at this distance)
      2                            // Decay exponent (2 = physically correct inverse square)
    );
    torchLight.position.copy(camera.position);
    scene.add(torchLight);

    // Secondary fill light to prevent pure black in shadows
    const fillLight = new THREE.PointLight(
      0x4466aa,                    // Cool blue fill
      1.5 * settings.torchIntensity,
      6,
      2
    );
    fillLight.position.copy(camera.position);
    fillLight.position.y += 0.5;  // Slightly above camera
    scene.add(fillLight);

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

    // Try to load a texture, return null if it doesn't exist
    const tryLoadTexture = (path: string): Promise<THREE.Texture | null> => {
      return new Promise((resolve) => {
        const tex = new THREE.Texture();
        const img = new Image();
        img.onload = () => {
          tex.image = img;
          tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
          tex.magFilter = THREE.NearestFilter;
          tex.minFilter = THREE.NearestMipMapLinearFilter;
          tex.needsUpdate = true;
          resolve(tex);
        };
        img.onerror = () => resolve(null);
        img.src = path;
      });
    };

    // Load tile variants (floor_var1.png, floor_var2.png, etc.)
    const loadVariants = async (tileType: string): Promise<THREE.Texture[]> => {
      const variants: THREE.Texture[] = [loadTexture(`${basePath}/${tileType}.png`)];
      for (let i = 1; i <= 10; i++) {
        const varTex = await tryLoadTexture(`${basePath}/${tileType}_var${i}.png`);
        if (varTex) {
          variants.push(varTex);
        } else {
          break;
        }
      }
      if (variants.length > 1) {
        console.log(`[3D] Loaded ${variants.length} variants for ${tileType}`);
      }
      return variants;
    };

    const textures = {
      floor: loadTexture(`${basePath}/floor.png`),
      ceiling: loadTexture(`${basePath}/ceiling.png`),
      wallFront: loadTexture(`${basePath}/wall_front.png`),
      wallLeft: loadTexture(`${basePath}/wall_left.png`),
      wallRight: loadTexture(`${basePath}/wall_right.png`),
    };

    // Trigger async variant loading for caching (results not awaited here)
    void loadVariants('floor');
    void loadVariants('ceiling');
    void loadVariants('wall_front');

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

    // Dim “memory” versions of the core materials (explored-but-not-visible tiles)
    const memoryMaterials = {
      floor: materials.floor.clone(),
      ceiling: materials.ceiling.clone(),
      wall: materials.wall.clone(),
      door: materials.door.clone(),
    };
    memoryMaterials.floor.color.copy(materials.floor.color).multiplyScalar(MEMORY_GEOMETRY_BRIGHTNESS);
    memoryMaterials.ceiling.color.copy(materials.ceiling.color).multiplyScalar(MEMORY_GEOMETRY_BRIGHTNESS);
    memoryMaterials.wall.color.copy(materials.wall.color).multiplyScalar(MEMORY_GEOMETRY_BRIGHTNESS);
    memoryMaterials.door.color.copy(materials.door.color).multiplyScalar(MEMORY_GEOMETRY_BRIGHTNESS);

    // Corridor wall materials (left/right textures) with visible + memory variants
    const corridorWallMaterials = {
      leftVisible: new THREE.MeshStandardMaterial({
        map: textures.wallLeft,
        color: materials.wall.color.clone(),
        roughness: 0.7,
      }),
      leftMemory: new THREE.MeshStandardMaterial({
        map: textures.wallLeft,
        color: materials.wall.color.clone().multiplyScalar(MEMORY_GEOMETRY_BRIGHTNESS),
        roughness: 0.7,
      }),
      rightVisible: new THREE.MeshStandardMaterial({
        map: textures.wallRight,
        color: materials.wall.color.clone(),
        roughness: 0.7,
      }),
      rightMemory: new THREE.MeshStandardMaterial({
        map: textures.wallRight,
        color: materials.wall.color.clone().multiplyScalar(MEMORY_GEOMETRY_BRIGHTNESS),
        roughness: 0.7,
      }),
    };

    // --- Shared geometry cache (PERF) ---
    // Reuse these for every tile Mesh. Do NOT dispose per-mesh; dispose once on scene teardown.
    const geometries = {
      tilePlane: new THREE.PlaneGeometry(TILE_SIZE, TILE_SIZE),
      wallBox: new THREE.BoxGeometry(TILE_SIZE, WALL_HEIGHT, TILE_SIZE),
      entitySpheres: new Map<number, THREE.SphereGeometry>(),
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
      geometries,
      materials,
      memoryMaterials,
      corridorWallMaterials,
      textures,
      variants: {
        floor: [textures.floor],
        ceiling: [textures.ceiling],
        wallFront: [textures.wallFront],
      },
      controls: {
        isDragging: false,
        lookYaw: 0,
        lookPitch: 0,
        baseYaw: 0,
      },
      animation: {
        moveProgress: 1,
        moveOffsetX: 0,
        moveOffsetZ: 0,
        turnProgress: 1,
        turnOffsetYaw: 0,
        bobPhase: 0,
        isMoving: false,
        prevFacingDx: 0,
        prevFacingDy: -1, // Default facing north
        entityPositions: new Map(),
        deathCam: {
          active: false,
          t: 0,
          duration: 3.6,
          startX: 0,
          startY: CAMERA_HEIGHT,
          startZ: 0,
          startPitch: 0,
          startYaw: 0,
          startRoll: 0,
          rollDir: -1 as 1 | -1,
        },
      },
    };

    // Note: Variants are loaded but not currently used in 3D mode
    // to avoid tile flickering when the view changes (relative depth shifts)

    // Animation loop
    let time = 0;
    let lastTime = performance.now();
    const animate = () => {
      if (!sceneRef.current) return;

      const now = performance.now();
      const deltaTime = (now - lastTime) / 1000; // Convert to seconds
      lastTime = now;
      time += deltaTime;

      const { controls, animation } = sceneRef.current;
      const death = animation.deathCam;

      // Death camera override - completely takes over camera when active
      if (death.active) {
        death.t += deltaTime;
        const p = Math.min(1, death.t / death.duration);

        // Easing functions
        const easeIn = p * p;
        const easeOut = 1 - Math.pow(1 - p, 3);

        // Target values (tune these for feel)
        const groundY = 0.25;                              // Near floor
        const rollTarget = death.rollDir * -0.24;          // ~-14deg
        const pitchTarget = death.startPitch + 0.75;       // ~43deg looking down
        const driftX = death.rollDir * 0.10;
        const driftZ = 0.12;

        // Add a tiny dying wobble
        const wobble = Math.sin(p * Math.PI * 3) * (1 - p) * 0.03;

        const x = death.startX + driftX * easeOut;
        const y = death.startY + (groundY - death.startY) * easeIn;
        const z = death.startZ + driftZ * easeOut;

        const pitch = death.startPitch + (pitchTarget - death.startPitch) * easeOut + wobble;
        const yaw = death.startYaw; // Freeze yaw at moment of death
        const roll = death.startRoll + (rollTarget - death.startRoll) * easeOut;

        camera.position.set(x, y, z);
        camera.rotation.set(pitch, yaw, roll, 'YXZ');

        // Update torch light position
        torchLight.position.copy(camera.position);
        fillLight.position.copy(camera.position);
        fillLight.position.y += 0.5;

        renderer.render(scene, camera);
        sceneRef.current.animationId = requestAnimationFrame(animate);
        return;
      }

      // Update movement animation
      if (animation.moveProgress < 1) {
        animation.moveProgress += deltaTime / MOVE_ANIMATION_DURATION;
        if (animation.moveProgress > 1) animation.moveProgress = 1;
        animation.isMoving = animation.moveProgress < 1;
      }

      // Update turn animation
      if (animation.turnProgress < 1) {
        animation.turnProgress += deltaTime / TURN_ANIMATION_DURATION;
        if (animation.turnProgress > 1) animation.turnProgress = 1;
      }

      // Update head bob phase (continuous when moving)
      if (animation.isMoving || animation.moveProgress < 1) {
        animation.bobPhase += deltaTime * HEAD_BOB_FREQUENCY * Math.PI * 2;
      }

      // Ease function for smooth animation (ease out cubic)
      const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);

      // Calculate animated camera offset
      const moveEase = easeOut(animation.moveProgress);
      const animatedOffsetX = animation.moveOffsetX * (1 - moveEase);
      const animatedOffsetZ = animation.moveOffsetZ * (1 - moveEase);

      // Calculate animated turn offset
      const turnEase = easeOut(animation.turnProgress);
      const animatedTurnYaw = animation.turnOffsetYaw * (1 - turnEase);

      // Calculate head bob (only when moving)
      let headBob = 0;
      if (animation.moveProgress < 1 && enableAnimations) {
        headBob = Math.sin(animation.bobPhase) * HEAD_BOB_AMPLITUDE;
      }

      // Apply camera rotation: base facing + look offset + turn animation
      const totalYaw = controls.baseYaw + controls.lookYaw + animatedTurnYaw;
      camera.rotation.set(controls.lookPitch, totalYaw, 0, 'YXZ');

      // Camera position with movement animation and head bob
      camera.position.set(
        animatedOffsetX,
        CAMERA_HEIGHT + headBob,
        animatedOffsetZ
      );

      // Update torch light position to follow camera
      torchLight.position.copy(camera.position);
      fillLight.position.copy(camera.position);
      fillLight.position.y += 0.5;

      // Subtle torch flicker
      if (enableAnimations) {
        const flicker = 0.85 + Math.sin(time * 5) * 0.1 + Math.sin(time * 13) * 0.05;
        torchLight.intensity = 8 * settings.torchIntensity * flicker;
        fillLight.intensity = 1.5 * settings.torchIntensity * flicker;
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
      Object.values(memoryMaterials).forEach(m => m.dispose());
      Object.values(corridorWallMaterials).forEach(m => m.dispose());
      Object.values(textures).forEach(t => t.dispose());

      // Dispose shared geometries ONCE
      geometries.tilePlane.dispose();
      geometries.wallBox.dispose();
      for (const g of geometries.entitySpheres.values()) g.dispose();

      if (containerRef.current?.contains(renderer.domElement)) {
        containerRef.current.removeChild(renderer.domElement);
      }
      sceneRef.current = null;
    };
  }, [width, height, settings.biome, settings.brightness, settings.fogDensity, settings.torchIntensity, enableAnimations, biome]);

  // Update geometry when view changes
  useEffect(() => {
    if (!sceneRef.current || !view) return;

    const { geometryGroup, materials, memoryMaterials, geometries, corridorWallMaterials } = sceneRef.current;

    // Clear previous geometry (SAFE disposal):
    // - Shared geometries (tilePlane, wallBox, cached entity spheres) must NOT be disposed per mesh.
    // - Shared materials (materials/memoryMaterials/corridorWallMaterials) must NOT be disposed per mesh.
    const sharedGeoms = new Set<THREE.BufferGeometry>([
      geometries.tilePlane,
      geometries.wallBox,
      ...geometries.entitySpheres.values(),
    ]);
    const sharedMats = new Set<THREE.Material>([
      materials.floor, materials.ceiling, materials.wall, materials.door,
      memoryMaterials.floor, memoryMaterials.ceiling, memoryMaterials.wall, memoryMaterials.door,
      ...Object.values(corridorWallMaterials),
    ]);

    for (const child of [...geometryGroup.children]) {
      if (child instanceof THREE.Mesh) {
        const geom = child.geometry as THREE.BufferGeometry | undefined;
        if (geom && !sharedGeoms.has(geom)) geom.dispose();

        const mats = Array.isArray(child.material) ? child.material : [child.material];
        for (const m of mats) {
          if (m && !sharedMats.has(m)) m.dispose();
        }
      }
      geometryGroup.remove(child);
    }

    const rows = view.rows;
    if (!rows || rows.length === 0) return;

    // PURE TILE-BASED GEOMETRY:
    // Render every wall/door tile as a cube at its offset, and every non-wall tile as floor+ceiling.
    // This removes corridor heuristics and guarantees the 3D view matches server tile data.


    // Check if room has a ceiling (open-air rooms like courtyards don't)
    const hasCeiling = view.room_has_ceiling !== false;

    // Always add floor/ceiling at player position (depth 0)
    // This ensures the player always has ground to stand on
    const playerFloor = new THREE.Mesh(geometries.tilePlane, materials.floor);

    playerFloor.rotation.x = -Math.PI / 2;
    playerFloor.position.set(0, 0, 0);
    geometryGroup.add(playerFloor);

    // Only add ceiling if room has one (skip for open-air zones like courtyards)
    if (hasCeiling) {
      const playerCeiling = new THREE.Mesh(geometries.tilePlane, materials.ceiling);

      playerCeiling.rotation.x = Math.PI / 2;
      playerCeiling.position.set(0, WALL_HEIGHT, 0);
      geometryGroup.add(playerCeiling);
    } else {
      // Open-air room: add sky plane using skybox override or biome palette
      const skyBiomeId = view.room_skybox_override || settings.biome;
      const skyBiome = getBiome(skyBiomeId);

      // Create gradient sky using biome ambient tint + fog color
      const skyGeometry = new THREE.PlaneGeometry(100, 100);

      // Mix ambient tint (bright) with fog color (dark) for sky gradient feel
      const skyR = Math.min(255, skyBiome.ambientTint[0] * 0.6 + 40);
      const skyG = Math.min(255, skyBiome.ambientTint[1] * 0.6 + 40);
      const skyB = Math.min(255, skyBiome.ambientTint[2] * 0.6 + 60);

      const skyMaterial = new THREE.MeshBasicMaterial({
        color: new THREE.Color(skyR / 255, skyG / 255, skyB / 255),
        side: THREE.DoubleSide,
      });
      const skyPlane = new THREE.Mesh(skyGeometry, skyMaterial);
      skyPlane.rotation.x = Math.PI / 2;
      skyPlane.position.set(0, WALL_HEIGHT * 4, 0); // High above
      geometryGroup.add(skyPlane);

      // Add horizon glow plane (lower, uses light color)
      const horizonGeometry = new THREE.PlaneGeometry(120, 40);
      const horizonR = skyBiome.lightColor[0] * 0.3;
      const horizonG = skyBiome.lightColor[1] * 0.3;
      const horizonB = skyBiome.lightColor[2] * 0.3;
      const horizonMaterial = new THREE.MeshBasicMaterial({
        color: new THREE.Color(horizonR / 255, horizonG / 255, horizonB / 255),
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.4,
      });
      const horizonPlane = new THREE.Mesh(horizonGeometry, horizonMaterial);
      horizonPlane.rotation.x = Math.PI / 2 - 0.1; // Slight tilt
      horizonPlane.position.set(0, WALL_HEIGHT * 2.5, -30); // At horizon
      geometryGroup.add(horizonPlane);
    }

    // Add geometry based on actual view data (visible + explored memory)
    for (let rowIndex = 0; rowIndex < rows.length; rowIndex++) {
      const row = rows[rowIndex];
      if (!row || row.length === 0) continue;

      // Use rowIndex as depth (0 = player position, 1 = one tile ahead, etc.)
      const depth = rowIndex;
      const z = -(depth * TILE_SIZE);

      for (const tile of row) {
        const tileChar = tile.tile_actual || tile.tile;
        // tile.offset is camera-space lateral offset. Never fall back to world tile.x here.
        const tileX = tile.offset ?? 0;
        const x = tileX * TILE_SIZE;
        const isVisible = tile.visible === true;

        // Skip player position center tile (already added above)
        if (depth === 0 && tileX === 0) continue;

        // Walls/doors become cubes
        if (isWallTile(tileChar) || isDoorTile(tileChar)) {
          const wallMat = isDoorTile(tileChar)
            ? (isVisible ? materials.door : memoryMaterials.door)
            : (isVisible ? materials.wall : memoryMaterials.wall);
          const wall = new THREE.Mesh(geometries.wallBox, wallMat);
          wall.position.set(x, WALL_HEIGHT / 2, z);
          geometryGroup.add(wall);

          if (debugShowWallMarkers) {
            console.log(`[3D] Wall ${tileChar} at depth=${depth} offset=${tileX} (x=${x}, z=${z}) visible=${isVisible}`);
          }
          continue;
        }

        // Non-wall tiles get floor + ceiling (including explored memory)
        const floorMat = isVisible ? materials.floor : memoryMaterials.floor;

        const floor = new THREE.Mesh(geometries.tilePlane, floorMat);
        floor.rotation.x = -Math.PI / 2;
        floor.position.set(x, 0, z);
        geometryGroup.add(floor);

        // Only add ceiling if room has one (skip for open-air zones)
        if (hasCeiling) {
          const ceilMat = isVisible ? materials.ceiling : memoryMaterials.ceiling;
          const ceiling = new THREE.Mesh(geometries.tilePlane, ceilMat);
          ceiling.rotation.x = Math.PI / 2;
          ceiling.position.set(x, WALL_HEIGHT, z);
          geometryGroup.add(ceiling);
        }
      }
    }

    // Add entities as symbol sprites with name labels
    // Entity positioning uses same scale for offset and distance
    // Both use TILE_SIZE so 1 offset unit = 1 distance unit in world space

    // Performance: Limit entity labels to manage render cost
    const LABEL_CULL_DISTANCE = 6;  // Don't show labels beyond this distance
    const SPRITE_CULL_DISTANCE = 10; // Don't show sprites beyond this distance
    const MAX_LABELS = 8;  // Max labels to render (closest entities first)

    // Sort entities by distance for priority culling
    const sortedEntities = [...view.entities].sort((a, b) => a.distance - b.distance);
    let labelsRendered = 0;

    for (const entity of sortedEntities) {
      // Skip entities beyond sprite cull distance
      if (entity.distance > SPRITE_CULL_DISTANCE) continue;

      const x = entity.offset * TILE_SIZE;
      const z = -entity.distance * TILE_SIZE;
      const y = entity.type === 'item' ? 0.3 : CAMERA_HEIGHT * 0.8;

      // Determine color based on entity type
      let color = 0xffffff;
      let labelColor = '#ffffff';
      if (entity.type === 'enemy') {
        color = entity.is_elite ? 0xff4444 : 0xff8844;
        labelColor = entity.is_elite ? '#ff6666' : '#ffaa66';
      } else if (entity.type === 'item') {
        color = 0xffff44;
        labelColor = '#ffff88';
      } else if (entity.type === 'trap') {
        color = 0x44ff44;
        labelColor = '#88ff88';
      }

      // Create symbol sprite (replaces plain sphere)
      const symbolSprite = createSymbolSprite(entity.symbol || '?', color);
      symbolSprite.position.set(x, y, z);
      geometryGroup.add(symbolSprite);

      // Create name label hovering above the entity (with distance/count limits)
      // Labels are expensive - only render for close entities
      if (entity.name && entity.distance <= LABEL_CULL_DISTANCE && labelsRendered < MAX_LABELS) {
        const nameLabel = createTextSprite(entity.name, labelColor);
        // Position label well above entity to avoid overlap with sprite
        // Items are lower, so need less offset; enemies/NPCs need more clearance
        const labelOffset = entity.type === 'item' ? 0.6 : 1.1;
        nameLabel.position.set(x, y + labelOffset, z);
        geometryGroup.add(nameLabel);
        labelsRendered++;
      }
    }

  }, [view, debugShowWallMarkers]);

  // Handle turn animations when facing direction changes
  useEffect(() => {
    if (!sceneRef.current || !view) return;

    const { controls, animation } = sceneRef.current;
    const { dx, dy } = view.facing;

    // Check if facing direction changed (turn)
    if (dx !== animation.prevFacingDx || dy !== animation.prevFacingDy) {
      // Determine turn direction
      // Cross product to determine if turn is clockwise or counter-clockwise
      const cross = animation.prevFacingDx * dy - animation.prevFacingDy * dx;

      if (cross !== 0 && enableAnimations) {
        // Start turn animation
        // cross > 0 = turning right (clockwise), cross < 0 = turning left
        animation.turnProgress = 0;
        animation.turnOffsetYaw = cross > 0 ? Math.PI / 2 : -Math.PI / 2;
      }

      // Update previous facing
      animation.prevFacingDx = dx;
      animation.prevFacingDy = dy;
    }

    // Reset look offsets when player turns
    controls.baseYaw = 0;
    controls.lookYaw = 0;
    controls.lookPitch = 0;
  }, [view?.facing, enableAnimations]);

  // Handle movement animations when view changes (but facing stays same)
  useEffect(() => {
    if (!sceneRef.current || !view || !view.rows) return;

    const { animation } = sceneRef.current;
    const currentRowsJson = JSON.stringify(view.rows.map(row => row?.map(t => `${t.x},${t.y}`)));
    const currentFacing = view.facing;

    // Check if this is a real view change (not initial load)
    if (prevViewRef.current) {
      const facingSame =
        currentFacing.dx === prevViewRef.current.facing.dx &&
        currentFacing.dy === prevViewRef.current.facing.dy;
      const rowsChanged = currentRowsJson !== prevViewRef.current.rowsJson;

      // If facing is same but rows changed, it's a movement
      if (facingSame && rowsChanged && enableAnimations) {
        // Determine movement direction by checking how the view shifted
        // Since geometry is view-relative, we animate camera FROM offset TO origin
        // Forward movement: camera starts behind (positive Z) and moves to 0
        // Backward movement: camera starts ahead (negative Z) and moves to 0
        // Strafe: similar for X axis

        // For simplicity, assume forward movement when rows change
        // A more sophisticated detection could compare specific tile positions
        animation.moveProgress = 0;
        animation.moveOffsetZ = TILE_SIZE; // Start behind, animate forward
        animation.moveOffsetX = 0;
        animation.isMoving = true;
        animation.bobPhase = 0; // Reset bob phase for clean animation
      }
    }

    // Update previous view reference
    prevViewRef.current = {
      rowsJson: currentRowsJson,
      facing: { dx: currentFacing.dx, dy: currentFacing.dy },
    };
  }, [view, enableAnimations]);

  // Mouse event handlers for limited look-around (head movement)
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (!sceneRef.current) return;
    // Allow both left-click and right-click for looking around
    if (e.button === 0 || e.button === 2) {
      sceneRef.current.controls.isDragging = true;
      e.preventDefault();
    }
  }, []);

  const handleMouseUp = useCallback(() => {
    if (!sceneRef.current) return;
    sceneRef.current.controls.isDragging = false;
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!sceneRef.current) return;
    if (!sceneRef.current.controls.isDragging) return;

    const sensitivity = 0.003;
    const { controls } = sceneRef.current;

    // Limited look-around range (head movement without turning body)
    const MAX_LOOK_YAW = Math.PI / 6;    // ±30 degrees left/right
    const MAX_LOOK_PITCH = Math.PI / 9;  // ±20 degrees up/down

    // Update look offsets
    controls.lookYaw -= e.movementX * sensitivity;
    controls.lookPitch -= e.movementY * sensitivity;

    // Clamp to limited range (can only look a bit to each side)
    controls.lookYaw = Math.max(-MAX_LOOK_YAW, Math.min(MAX_LOOK_YAW, controls.lookYaw));
    controls.lookPitch = Math.max(-MAX_LOOK_PITCH, Math.min(MAX_LOOK_PITCH, controls.lookPitch));

    // Note: actual camera rotation is applied in the animation loop
  }, []);

  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault(); // Prevent context menu on right-click
  }, []);

  // Calculate pulse overlay opacity based on amplification
  const pulseOverlayOpacity = fieldPulse?.active
    ? Math.min(0.15, (fieldPulse.amplification - 1.0) * 0.15)
    : 0;

  return (
    <div
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
    >
      {/* Three.js canvas container - isolated from React reconciliation */}
      <div
        ref={containerRef}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
        }}
      />
      {/* Field Pulse visual overlay */}
      {fieldPulse?.active && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: `radial-gradient(ellipse at center, transparent 30%, rgba(180, 80, 40, ${pulseOverlayOpacity}) 100%)`,
            pointerEvents: 'none',
            animation: 'fieldPulse 2s ease-in-out infinite',
            zIndex: 10,
          }}
        />
      )}
      <style>{`
        @keyframes fieldPulse {
          0%, 100% { opacity: 0.7; }
          50% { opacity: 1.0; }
        }
      `}</style>
    </div>
  );
}

export default FirstPersonRenderer3D;
