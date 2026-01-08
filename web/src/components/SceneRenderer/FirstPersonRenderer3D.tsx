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

interface FirstPersonRenderer3DProps {
  view: FirstPersonView | undefined;
  width?: number;
  height?: number;
  enableAnimations?: boolean;
  settings?: Partial<RenderSettings>;
  debugShowOccluded?: boolean;
  debugShowWireframe?: boolean;
  debugShowWallMarkers?: boolean;
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
  debugShowWallMarkers = false,
}: FirstPersonRenderer3DProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const prevViewRef = useRef<{ rowsJson: string; facing: { dx: number; dy: number } } | null>(null);
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

    // Analyze corridor structure - find consistent wall positions
    // In a corridor, we want continuous side walls regardless of tile x positions
    const CORRIDOR_HALF_WIDTH = TILE_SIZE; // Corridor walls at ±TILE_SIZE

    // Track which depths have walls and front walls
    const depthInfo: {
      depth: number;
      hasLeftWall: boolean;
      hasRightWall: boolean;
      hasFrontWall: boolean;
      frontWallTiles: Array<{ x: number; tile: string }>;
    }[] = [];

    for (let rowIndex = 0; rowIndex < rows.length; rowIndex++) {
      const row = rows[rowIndex];
      if (!row || row.length === 0) continue;

      // Use rowIndex as depth (0 = player position, 1 = one tile ahead, etc.)
      const depth = rowIndex;

      // Determine walls based on offset position relative to center (offset 0)
      // Left wall = any wall at negative offset (to player's left)
      // Right wall = any wall at positive offset (to player's right)
      // Front wall = wall at offset 0 (directly ahead)
      let hasLeftWall = false;
      let hasRightWall = false;
      const frontWallTiles: Array<{ x: number; tile: string }> = [];

      for (const tile of row) {
        const tileChar = tile.tile_actual || tile.tile;
        const tileX = tile.offset ?? 0;

        if (isWallTile(tileChar) || isDoorTile(tileChar)) {
          if (tileX < 0) {
            // Wall to the left of center
            hasLeftWall = true;
          } else if (tileX > 0) {
            // Wall to the right of center
            hasRightWall = true;
          } else {
            // Wall at center (front wall / blocking path)
            frontWallTiles.push({ x: tileX, tile: tileChar });
          }
        }
      }

      depthInfo.push({
        depth,
        hasLeftWall,
        hasRightWall,
        hasFrontWall: frontWallTiles.length > 0,
        frontWallTiles,
      });
    }

    // Player position floor/ceiling is now handled by the main tile loop below

    // Helper to create wall material for corridor walls
    const createCorridorWallMaterial = (isLeftWall: boolean): THREE.MeshStandardMaterial => {
      const baseTex = isLeftWall ? sceneRef.current!.textures.wallLeft : sceneRef.current!.textures.wallRight;
      return new THREE.MeshStandardMaterial({
        map: baseTex,
        color: materials.wall.color,
        roughness: 0.7,
      });
    };

    // Build side walls per-depth (only where walls actually exist)
    // This properly handles corridors opening up to rooms
    for (const info of depthInfo) {
      const z = -(info.depth * TILE_SIZE);

      // Create left wall segment if there's a wall at this depth
      if (info.hasLeftWall) {
        const wallGeom = new THREE.BoxGeometry(TILE_SIZE, WALL_HEIGHT, TILE_SIZE);
        const leftWallMat = createCorridorWallMaterial(true);
        const leftWall = new THREE.Mesh(wallGeom, leftWallMat);
        leftWall.position.set(-CORRIDOR_HALF_WIDTH, WALL_HEIGHT / 2, z);
        geometryGroup.add(leftWall);

        if (debugShowWallMarkers) {
          console.log(`[3D] Left wall segment at depth ${info.depth}, z=${z}`);
        }
      }

      // Create right wall segment if there's a wall at this depth
      if (info.hasRightWall) {
        const wallGeom = new THREE.BoxGeometry(TILE_SIZE, WALL_HEIGHT, TILE_SIZE);
        const rightWallMat = createCorridorWallMaterial(false);
        const rightWall = new THREE.Mesh(wallGeom, rightWallMat);
        rightWall.position.set(CORRIDOR_HALF_WIDTH, WALL_HEIGHT / 2, z);
        geometryGroup.add(rightWall);

        if (debugShowWallMarkers) {
          console.log(`[3D] Right wall segment at depth ${info.depth}, z=${z}`);
        }
      }
    }


    // Add front walls and floor/ceiling tiles
    for (const info of depthInfo) {
      const z = -(info.depth * TILE_SIZE);

      // If there's a front wall at center (x=0), create a full end wall spanning corridor width
      if (info.frontWallTiles.some(t => t.x === 0)) {
        // Create a single wall spanning the full corridor width
        // Width needs to span from left wall inner edge to right wall inner edge
        // Side walls are at ±CORRIDOR_HALF_WIDTH with width TILE_SIZE
        // So inner edges are at ±(CORRIDOR_HALF_WIDTH - TILE_SIZE/2)
        // But we want to connect TO the side walls, so we span full width
        const fullWidth = CORRIDOR_HALF_WIDTH * 2 + TILE_SIZE; // Full width including overlapping with side walls
        const endWallGeom = new THREE.BoxGeometry(fullWidth, WALL_HEIGHT, TILE_SIZE);
        const endWall = new THREE.Mesh(endWallGeom, materials.wall);
        endWall.position.set(0, WALL_HEIGHT / 2, z);
        geometryGroup.add(endWall);

        if (debugShowWallMarkers) {
          const endWallXMin = -fullWidth / 2;
          const endWallXMax = fullWidth / 2;
          const endWallZFront = z + TILE_SIZE / 2;
          const endWallZBack = z - TILE_SIZE / 2;
          console.log(`[3D] End wall at depth ${info.depth}: x from ${endWallXMin} to ${endWallXMax}, z from ${endWallZFront} to ${endWallZBack}`);

          // Check connections
          console.log(`[3D] End wall at depth ${info.depth}, z=${z}`);
        }
      } else {
        // Add individual front wall tiles (walls not at the corridor end)
        for (const frontWall of info.frontWallTiles) {
          const wallGeom = new THREE.BoxGeometry(TILE_SIZE, WALL_HEIGHT, TILE_SIZE);
          const wall = new THREE.Mesh(wallGeom, materials.wall);
          wall.position.set(frontWall.x * TILE_SIZE, WALL_HEIGHT / 2, z);
          geometryGroup.add(wall);
        }
      }
    }

    // Add visual debug markers for wall segments if enabled
    if (debugShowWallMarkers) {
      const markerGeom = new THREE.SphereGeometry(0.1, 8, 8);
      const markers: { pos: [number, number, number]; label: string; color: number }[] = [];

      // Mark each wall segment position
      for (const info of depthInfo) {
        const z = -(info.depth * TILE_SIZE);
        if (info.hasLeftWall) {
          markers.push({ pos: [-CORRIDOR_HALF_WIDTH, WALL_HEIGHT, z], label: `L-d${info.depth}`, color: 0xff0000 });
        }
        if (info.hasRightWall) {
          markers.push({ pos: [CORRIDOR_HALF_WIDTH, WALL_HEIGHT, z], label: `R-d${info.depth}`, color: 0x0000ff });
        }
        if (info.frontWallTiles.length > 0) {
          markers.push({ pos: [0, WALL_HEIGHT, z], label: `F-d${info.depth}`, color: 0xff00ff });
        }
      }

      // Add all markers to scene
      for (const marker of markers) {
        const mat = new THREE.MeshBasicMaterial({ color: marker.color });
        const mesh = new THREE.Mesh(markerGeom, mat);
        mesh.position.set(...marker.pos);
        geometryGroup.add(mesh);
        console.log(`[3D] Marker ${marker.label}: (${marker.pos[0]}, ${marker.pos[1]}, ${marker.pos[2]})`);
      }
    }

    // Always add floor/ceiling at player position (depth 0)
    // This ensures the player always has ground to stand on
    const playerFloorGeom = new THREE.PlaneGeometry(TILE_SIZE, TILE_SIZE);
    const playerFloor = new THREE.Mesh(playerFloorGeom, materials.floor);
    playerFloor.rotation.x = -Math.PI / 2;
    playerFloor.position.set(0, 0, 0);
    geometryGroup.add(playerFloor);

    const playerCeilingGeom = new THREE.PlaneGeometry(TILE_SIZE, TILE_SIZE);
    const playerCeiling = new THREE.Mesh(playerCeilingGeom, materials.ceiling);
    playerCeiling.rotation.x = Math.PI / 2;
    playerCeiling.position.set(0, WALL_HEIGHT, 0);
    geometryGroup.add(playerCeiling);

    // Add floor and ceiling tiles based on actual view data
    // This handles both corridors and open rooms correctly
    for (let rowIndex = 0; rowIndex < rows.length; rowIndex++) {
      const row = rows[rowIndex];
      if (!row || row.length === 0) continue;

      // Use rowIndex as depth (0 = player position, 1 = one tile ahead, etc.)
      const depth = rowIndex;
      const z = -(depth * TILE_SIZE);

      for (const tile of row) {
        const tileChar = tile.tile_actual || tile.tile;
        const tileX = tile.offset ?? tile.x ?? 0;
        const x = tileX * TILE_SIZE;

        // Skip player position center tile (already added above)
        if (depth === 0 && tileX === 0) continue;

        // Create floor/ceiling for walkable tiles (floor, doors, stairs, water)
        // Also create for visible non-wall tiles to fill the corridor
        const isWalkable = isFloorTile(tileChar) || isDoorTile(tileChar) ||
                          tileChar === '=' || tileChar === '>' || tileChar === '<';

        if (isWalkable || (tile.visible && !isWallTile(tileChar) && tile.walkable)) {
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
    // Entity positioning uses same scale for offset and distance
    // Both use TILE_SIZE so 1 offset unit = 1 distance unit in world space
    // This ensures squares appear square when viewed from camera
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
