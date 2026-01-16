/**
 * IsometricPreview - Isometric 3D room preview for Level Editor
 *
 * Shows the selected room from an overhead isometric perspective,
 * making it much easier to visualize and place objects.
 */

import { useRef, useEffect, useState, useCallback } from 'react';
import * as THREE from 'three';
import type { GeneratedDungeon, Room } from '../../services/editorApi';
import type { PlacedSetPiece } from './types';
import { ZONE_COLORS } from './types';
import { createMaterial, MATERIAL_PRESETS } from '../../models/materials';

// Import model factories
import { createEntranceDoors } from '../../models/entranceDoors';
import { createBossThrone } from '../../models/bossThrone';
import { createPillar } from '../../models/pillar';
import { createStatue } from '../../models/statue';

interface IsometricPreviewProps {
  dungeon: GeneratedDungeon | null;
  selectedRoom: Room | null;
  selectedTile: { x: number; y: number } | null;
  placedSetPieces: PlacedSetPiece[];
  onTileClick?: (x: number, y: number) => void;
}

const TILE_SIZE = 1;
const WALL_HEIGHT = 2;

// Model factory registry
const MODEL_FACTORIES: Record<string, (options?: any) => THREE.Group> = {
  entrance_doors: createEntranceDoors,
  boss_throne: createBossThrone,
  pillar: createPillar,
  collapsed_pillar: (opts) => createPillar({ ...opts, collapsed: true }),
  statue: createStatue,
};

export function IsometricPreview({
  dungeon,
  selectedRoom,
  selectedTile,
  placedSetPieces,
  onTileClick,
}: IsometricPreviewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<{
    scene: THREE.Scene;
    camera: THREE.OrthographicCamera;
    renderer: THREE.WebGLRenderer;
    animationId: number;
    roomGroup: THREE.Group;
    objectsGroup: THREE.Group;
  } | null>(null);

  const [enabled, setEnabled] = useState(false);
  const [zoom, setZoom] = useState(1);

  // Initialize Three.js scene
  useEffect(() => {
    if (!enabled || !containerRef.current) return;

    const container = containerRef.current;
    const width = container.clientWidth || 400;
    const height = container.clientHeight || 300;

    // Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x1a1a2e);

    // Orthographic camera for isometric view
    const aspect = width / height;
    const frustumSize = 15;
    const camera = new THREE.OrthographicCamera(
      -frustumSize * aspect / 2,
      frustumSize * aspect / 2,
      frustumSize / 2,
      -frustumSize / 2,
      0.1,
      1000
    );

    // Isometric camera angle (45 degrees rotated, 35.264 degrees elevation)
    camera.position.set(20, 20, 20);
    camera.lookAt(0, 0, 0);

    // Renderer
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: 'low-power', // Prefer integrated GPU to avoid context issues
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    container.appendChild(renderer.domElement);

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(10, 20, 10);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 1024;
    directionalLight.shadow.mapSize.height = 1024;
    scene.add(directionalLight);

    // Groups for room geometry and placed objects
    const roomGroup = new THREE.Group();
    const objectsGroup = new THREE.Group();
    scene.add(roomGroup);
    scene.add(objectsGroup);

    // Animation loop
    const animate = () => {
      renderer.render(scene, camera);
      sceneRef.current!.animationId = requestAnimationFrame(animate);
    };

    sceneRef.current = {
      scene,
      camera,
      renderer,
      animationId: requestAnimationFrame(animate),
      roomGroup,
      objectsGroup,
    };

    // Cleanup
    return () => {
      cancelAnimationFrame(sceneRef.current?.animationId || 0);
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      renderer.forceContextLoss();
      renderer.dispose();
      sceneRef.current = null;
    };
  }, [enabled]);

  // Update room geometry when room changes
  useEffect(() => {
    if (!sceneRef.current || !dungeon || !selectedRoom) return;

    const { roomGroup, camera } = sceneRef.current;

    // Clear previous geometry
    while (roomGroup.children.length > 0) {
      const child = roomGroup.children[0];
      if (child instanceof THREE.Mesh) {
        child.geometry.dispose();
        if (child.material instanceof THREE.Material) {
          child.material.dispose();
        }
      }
      roomGroup.remove(child);
    }

    // Materials
    const floorMaterial = new THREE.MeshStandardMaterial({
      color: ZONE_COLORS[selectedRoom.zone] ?
        parseInt(ZONE_COLORS[selectedRoom.zone].replace('#', ''), 16) : 0x2d3436,
      roughness: 0.8,
    });
    const wallMaterial = createMaterial('darkStone');

    // Room dimensions
    const { x: roomX, y: roomY, width: roomW, height: roomH } = selectedRoom;

    // Create floor
    const floorGeometry = new THREE.PlaneGeometry(roomW * TILE_SIZE, roomH * TILE_SIZE);
    const floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.rotation.x = -Math.PI / 2;
    floor.position.set(roomW * TILE_SIZE / 2, 0, roomH * TILE_SIZE / 2);
    floor.receiveShadow = true;
    roomGroup.add(floor);

    // Create walls around the room edges
    const wallGeometry = new THREE.BoxGeometry(TILE_SIZE, WALL_HEIGHT, TILE_SIZE * 0.2);

    for (let x = 0; x < roomW; x++) {
      for (let y = 0; y < roomH; y++) {
        const worldX = roomX + x;
        const worldY = roomY + y;
        const tile = dungeon.tiles[worldY]?.[worldX] || '#';

        // Check if this is a wall tile or edge
        if (tile === '#') {
          const wallBox = new THREE.Mesh(
            new THREE.BoxGeometry(TILE_SIZE, WALL_HEIGHT, TILE_SIZE),
            wallMaterial
          );
          wallBox.position.set(
            (x + 0.5) * TILE_SIZE,
            WALL_HEIGHT / 2,
            (y + 0.5) * TILE_SIZE
          );
          wallBox.castShadow = true;
          wallBox.receiveShadow = true;
          roomGroup.add(wallBox);
        }

        // Highlight selected tile
        if (selectedTile && worldX === selectedTile.x && worldY === selectedTile.y) {
          const highlightGeometry = new THREE.PlaneGeometry(TILE_SIZE * 0.9, TILE_SIZE * 0.9);
          const highlightMaterial = new THREE.MeshBasicMaterial({
            color: 0xfbbf24,
            transparent: true,
            opacity: 0.5,
          });
          const highlight = new THREE.Mesh(highlightGeometry, highlightMaterial);
          highlight.rotation.x = -Math.PI / 2;
          highlight.position.set(
            (x + 0.5) * TILE_SIZE,
            0.01,
            (y + 0.5) * TILE_SIZE
          );
          roomGroup.add(highlight);
        }
      }
    }

    // Add grid lines
    const gridHelper = new THREE.GridHelper(
      Math.max(roomW, roomH) * TILE_SIZE,
      Math.max(roomW, roomH),
      0x444444,
      0x333333
    );
    gridHelper.position.set(roomW * TILE_SIZE / 2, 0.02, roomH * TILE_SIZE / 2);
    roomGroup.add(gridHelper);

    // Center camera on room
    const centerX = roomW * TILE_SIZE / 2;
    const centerZ = roomH * TILE_SIZE / 2;
    const maxDim = Math.max(roomW, roomH) * TILE_SIZE;

    camera.position.set(
      centerX + maxDim,
      maxDim * 1.2,
      centerZ + maxDim
    );
    camera.lookAt(centerX, 0, centerZ);

    // Adjust zoom based on room size
    const zoomFactor = 15 / (maxDim + 5);
    camera.zoom = zoomFactor * zoom;
    camera.updateProjectionMatrix();

  }, [dungeon, selectedRoom, selectedTile, zoom]);

  // Update placed objects
  useEffect(() => {
    if (!sceneRef.current || !selectedRoom) return;

    const { objectsGroup } = sceneRef.current;

    // Clear previous objects
    while (objectsGroup.children.length > 0) {
      const child = objectsGroup.children[0];
      objectsGroup.remove(child);
      // Don't dispose - models may share geometry
    }

    // Add placed set pieces
    const { x: roomX, y: roomY } = selectedRoom;

    for (const piece of placedSetPieces) {
      // Check if piece is in this room
      if (
        piece.x >= roomX &&
        piece.x < roomX + selectedRoom.width &&
        piece.y >= roomY &&
        piece.y < roomY + selectedRoom.height
      ) {
        const factory = MODEL_FACTORIES[piece.type];
        if (factory) {
          const model = factory({ scale: piece.scale });
          model.position.set(
            (piece.x - roomX + 0.5) * TILE_SIZE,
            0,
            (piece.y - roomY + 0.5) * TILE_SIZE
          );
          model.rotation.y = (piece.rotation * Math.PI) / 180;
          objectsGroup.add(model);
        } else {
          // Fallback: colored cube for unknown types
          const cubeGeometry = new THREE.BoxGeometry(0.5, 0.5, 0.5);
          const cubeMaterial = new THREE.MeshStandardMaterial({ color: 0xff00ff });
          const cube = new THREE.Mesh(cubeGeometry, cubeMaterial);
          cube.position.set(
            (piece.x - roomX + 0.5) * TILE_SIZE,
            0.25,
            (piece.y - roomY + 0.5) * TILE_SIZE
          );
          objectsGroup.add(cube);
        }
      }
    }
  }, [selectedRoom, placedSetPieces]);

  // Handle zoom with wheel
  const handleWheel = useCallback((e: WheelEvent) => {
    e.preventDefault();
    setZoom(prev => Math.max(0.5, Math.min(3, prev + (e.deltaY > 0 ? -0.1 : 0.1))));
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || !enabled) return;

    container.addEventListener('wheel', handleWheel, { passive: false });
    return () => container.removeEventListener('wheel', handleWheel);
  }, [enabled, handleWheel]);

  // Render toggle when disabled
  if (!enabled) {
    return (
      <div className="isometric-preview-panel">
        <div className="preview-toolbar">
          <span className="preview-title">Room Preview (3D)</span>
          <button className="preview-toggle" onClick={() => setEnabled(true)}>
            Enable 3D
          </button>
        </div>
        <div className="preview-placeholder">
          <p>3D preview disabled to save resources.</p>
          <button onClick={() => setEnabled(true)}>Enable Isometric View</button>
        </div>
      </div>
    );
  }

  if (!selectedRoom) {
    return (
      <div className="isometric-preview-panel">
        <div className="preview-toolbar">
          <span className="preview-title">Room Preview (3D)</span>
          <button className="preview-toggle active" onClick={() => setEnabled(false)}>
            Disable 3D
          </button>
        </div>
        <div className="preview-placeholder">
          Select a room to see isometric preview
        </div>
      </div>
    );
  }

  return (
    <div className="isometric-preview-panel">
      <div className="preview-toolbar">
        <span className="preview-title">Room: {selectedRoom.zone}</span>
        <button className="preview-toggle active" onClick={() => setEnabled(false)}>
          Disable 3D
        </button>
        <div className="zoom-controls">
          <button onClick={() => setZoom(z => Math.max(0.5, z - 0.2))}>-</button>
          <span>{(zoom * 100).toFixed(0)}%</span>
          <button onClick={() => setZoom(z => Math.min(3, z + 0.2))}>+</button>
        </div>
      </div>
      <div className="preview-container" ref={containerRef} />
      <div className="preview-info">
        <span>Room #{selectedRoom.id}</span>
        <span>{selectedRoom.width}x{selectedRoom.height}</span>
        <span style={{ color: ZONE_COLORS[selectedRoom.zone] }}>{selectedRoom.zone}</span>
        <span>Objects: {placedSetPieces.filter(p =>
          p.x >= selectedRoom.x &&
          p.x < selectedRoom.x + selectedRoom.width &&
          p.y >= selectedRoom.y &&
          p.y < selectedRoom.y + selectedRoom.height
        ).length}</span>
      </div>
    </div>
  );
}
