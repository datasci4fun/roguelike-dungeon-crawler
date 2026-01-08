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
    };

    // Note: Variants are loaded but not currently used in 3D mode
    // to avoid tile flickering when the view changes (relative depth shifts)

    // Animation loop
    let time = 0;
    const animate = () => {
      if (!sceneRef.current) return;

      time += 0.016;

      const { controls } = sceneRef.current;

      // Apply camera rotation: base facing + limited look offset
      const totalYaw = controls.baseYaw + controls.lookYaw;
      camera.rotation.set(controls.lookPitch, totalYaw, 0, 'YXZ');

      // Camera stays fixed at player position (grid-based movement only)
      camera.position.set(0, CAMERA_HEIGHT, 0);

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

      // Find leftmost and rightmost walls, and any center walls
      let hasLeftWall = false;
      let hasRightWall = false;
      const frontWallTiles: Array<{ x: number; tile: string }> = [];

      for (const tile of row) {
        const tileChar = tile.tile_actual || tile.tile;
        const tileX = tile.offset ?? tile.x ?? 0;

        if (isWallTile(tileChar)) {
          // Leftmost tile in row is left wall
          if (tileX === Math.min(...row.map(t => t.offset ?? t.x ?? 0))) {
            hasLeftWall = true;
          }
          // Rightmost tile in row is right wall
          else if (tileX === Math.max(...row.map(t => t.offset ?? t.x ?? 0))) {
            hasRightWall = true;
          }
          // Center walls are front walls
          else {
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

    // Build continuous side walls
    // Find the depth range where we have continuous side walls
    let leftWallEndDepth = 0;
    let rightWallEndDepth = 0;

    for (const info of depthInfo) {
      if (info.hasLeftWall) leftWallEndDepth = Math.max(leftWallEndDepth, info.depth);
      if (info.hasRightWall) rightWallEndDepth = Math.max(rightWallEndDepth, info.depth);
    }

    // Helper to create wall material for corridor walls (uses UV tiling, not texture repeat)
    const createCorridorWallMaterial = (isLeftWall: boolean): THREE.MeshStandardMaterial => {
      const baseTex = isLeftWall ? sceneRef.current!.textures.wallLeft : sceneRef.current!.textures.wallRight;
      // Textures already have RepeatWrapping set from loadTexture
      return new THREE.MeshStandardMaterial({
        map: baseTex,
        color: materials.wall.color,
        roughness: 0.7,
      });
    };

    // Create left wall as a single elongated box from depth 0 to end
    let leftWallZStart = 0, leftWallZEnd = 0;
    if (leftWallEndDepth > 0) {
      const wallLength = leftWallEndDepth * TILE_SIZE + TILE_SIZE;
      const lengthTiles = wallLength / TILE_SIZE;

      // Create geometry with proper UV tiling for the inner face
      const wallGeom = new THREE.BoxGeometry(TILE_SIZE, WALL_HEIGHT, wallLength);

      // Manually adjust UVs for proper tiling - BoxGeometry face order: +X, -X, +Y, -Y, +Z, -Z
      // Each face has 4 vertices (2 triangles = 6 indices, but 4 unique verts)
      // For +X face (inner face of left wall): vertices 0-3, UVs should tile along Z and Y
      const uvs = wallGeom.attributes.uv.array as Float32Array;
      // +X face vertices are indices 0-3 (first 4 vertices in position array for +X face)
      // UV layout for +X: U maps to -Z, V maps to +Y
      // We want U to repeat 'lengthTiles' times, V to repeat based on height
      const heightTiles = WALL_HEIGHT / TILE_SIZE;
      // Face +X (indices 0-7 in uv array = 4 vertices * 2 components)
      uvs[0] = lengthTiles; uvs[1] = heightTiles;  // top-right
      uvs[2] = 0;           uvs[3] = heightTiles;  // top-left
      uvs[4] = lengthTiles; uvs[5] = 0;            // bottom-right
      uvs[6] = 0;           uvs[7] = 0;            // bottom-left
      wallGeom.attributes.uv.needsUpdate = true;

      const leftWallMat = createCorridorWallMaterial(true);
      const leftWall = new THREE.Mesh(wallGeom, leftWallMat);
      const zCenter = -(wallLength / 2 - TILE_SIZE / 2);
      leftWall.position.set(-CORRIDOR_HALF_WIDTH, WALL_HEIGHT / 2, zCenter);
      geometryGroup.add(leftWall);

      leftWallZStart = zCenter + wallLength / 2;
      leftWallZEnd = zCenter - wallLength / 2;

      if (debugShowWallMarkers) {
        console.log(`[3D] Left wall: x=${-CORRIDOR_HALF_WIDTH}, z from ${leftWallZStart.toFixed(2)} to ${leftWallZEnd.toFixed(2)}, length=${wallLength}, tiles=${lengthTiles}`);
      }
    }

    // Create right wall as a single elongated box
    let rightWallZStart = 0, rightWallZEnd = 0;
    if (rightWallEndDepth > 0) {
      const wallLength = rightWallEndDepth * TILE_SIZE + TILE_SIZE;
      const lengthTiles = wallLength / TILE_SIZE;

      const wallGeom = new THREE.BoxGeometry(TILE_SIZE, WALL_HEIGHT, wallLength);

      // For -X face (inner face of right wall): vertices 4-7 (indices 8-15 in uv array)
      const uvs = wallGeom.attributes.uv.array as Float32Array;
      const heightTiles = WALL_HEIGHT / TILE_SIZE;
      // Face -X (indices 8-15 in uv array)
      uvs[8] = 0;           uvs[9] = heightTiles;   // top-left
      uvs[10] = lengthTiles; uvs[11] = heightTiles; // top-right
      uvs[12] = 0;           uvs[13] = 0;           // bottom-left
      uvs[14] = lengthTiles; uvs[15] = 0;           // bottom-right
      wallGeom.attributes.uv.needsUpdate = true;

      const rightWallMat = createCorridorWallMaterial(false);
      const rightWall = new THREE.Mesh(wallGeom, rightWallMat);
      const zCenter = -(wallLength / 2 - TILE_SIZE / 2);
      rightWall.position.set(CORRIDOR_HALF_WIDTH, WALL_HEIGHT / 2, zCenter);
      geometryGroup.add(rightWall);

      rightWallZStart = zCenter + wallLength / 2;
      rightWallZEnd = zCenter - wallLength / 2;

      if (debugShowWallMarkers) {
        console.log(`[3D] Right wall: x=${CORRIDOR_HALF_WIDTH}, z from ${rightWallZStart.toFixed(2)} to ${rightWallZEnd.toFixed(2)}, length=${wallLength}, tiles=${lengthTiles}`);
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
          const leftSideWallInnerX = -CORRIDOR_HALF_WIDTH + TILE_SIZE / 2;
          const rightSideWallInnerX = CORRIDOR_HALF_WIDTH - TILE_SIZE / 2;
          console.log(`[3D] Connection check: Left side wall inner edge=${leftSideWallInnerX}, End wall left edge=${endWallXMin}`);
          console.log(`[3D] Connection check: Right side wall inner edge=${rightSideWallInnerX}, End wall right edge=${endWallXMax}`);
          console.log(`[3D] Connection check: Side walls end at z=${leftWallZEnd.toFixed(2)}, End wall front face at z=${endWallZFront}`);
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

    // Add visual debug markers at wall corners if enabled
    if (debugShowWallMarkers) {
      const markerGeom = new THREE.SphereGeometry(0.1, 8, 8);

      // Create markers for important corner positions
      const markers: { pos: [number, number, number]; label: string; color: number }[] = [];

      // Left wall corners (if exists)
      if (leftWallEndDepth > 0) {
        const leftX = -CORRIDOR_HALF_WIDTH;
        // Near corner (front of left wall)
        markers.push({ pos: [leftX - TILE_SIZE/2, WALL_HEIGHT, leftWallZStart], label: 'L-near-outer', color: 0xff0000 });
        markers.push({ pos: [leftX + TILE_SIZE/2, WALL_HEIGHT, leftWallZStart], label: 'L-near-inner', color: 0xff8800 });
        // Far corner (back of left wall)
        markers.push({ pos: [leftX - TILE_SIZE/2, WALL_HEIGHT, leftWallZEnd], label: 'L-far-outer', color: 0x00ff00 });
        markers.push({ pos: [leftX + TILE_SIZE/2, WALL_HEIGHT, leftWallZEnd], label: 'L-far-inner', color: 0x88ff00 });
      }

      // Right wall corners (if exists)
      if (rightWallEndDepth > 0) {
        const rightX = CORRIDOR_HALF_WIDTH;
        markers.push({ pos: [rightX - TILE_SIZE/2, WALL_HEIGHT, rightWallZStart], label: 'R-near-inner', color: 0x0088ff });
        markers.push({ pos: [rightX + TILE_SIZE/2, WALL_HEIGHT, rightWallZStart], label: 'R-near-outer', color: 0x0000ff });
        markers.push({ pos: [rightX - TILE_SIZE/2, WALL_HEIGHT, rightWallZEnd], label: 'R-far-inner', color: 0x00ffff });
        markers.push({ pos: [rightX + TILE_SIZE/2, WALL_HEIGHT, rightWallZEnd], label: 'R-far-outer', color: 0x00ff88 });
      }

      // End wall corners (find the depth with center wall)
      const endWallInfo = depthInfo.find(d => d.frontWallTiles.some(t => t.x === 0));
      if (endWallInfo) {
        const endZ = -(endWallInfo.depth * TILE_SIZE);
        const fullWidth = CORRIDOR_HALF_WIDTH * 2 + TILE_SIZE;
        markers.push({ pos: [-fullWidth/2, WALL_HEIGHT, endZ + TILE_SIZE/2], label: 'End-L-front', color: 0xff00ff });
        markers.push({ pos: [fullWidth/2, WALL_HEIGHT, endZ + TILE_SIZE/2], label: 'End-R-front', color: 0xff00ff });
        markers.push({ pos: [-fullWidth/2, WALL_HEIGHT, endZ - TILE_SIZE/2], label: 'End-L-back', color: 0x8800ff });
        markers.push({ pos: [fullWidth/2, WALL_HEIGHT, endZ - TILE_SIZE/2], label: 'End-R-back', color: 0x8800ff });
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

  // Reset look offsets when character facing changes
  // Note: Camera always looks down -Z because view.rows is in view-relative space
  // (depth 0 = player position, depth 1 = one tile ahead in facing direction, etc.)
  useEffect(() => {
    if (!sceneRef.current || !view) return;

    const { controls } = sceneRef.current;

    // Camera always faces forward (-Z) - geometry is already view-relative
    // Just reset look offsets when player turns
    controls.baseYaw = 0;
    controls.lookYaw = 0;
    controls.lookPitch = 0;
  }, [view?.facing]);

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
