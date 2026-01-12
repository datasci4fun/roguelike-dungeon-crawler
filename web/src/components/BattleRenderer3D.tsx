/**
 * BattleRenderer3D - Three.js first-person battle renderer
 *
 * Renders tactical battle arena in first-person 3D view.
 * Intentionally harder to read than isometric - claustrophobic combat feel.
 *
 * v6.3: Replaces DOM grid rendering with immersive 3D.
 */
import { useRef, useEffect, useCallback, useState } from 'react';
import * as THREE from 'three';
import type { BattleState, BattleEntity } from '../types';

// Arena dimensions
const TILE_SIZE = 2;
const WALL_HEIGHT = 2.5;
const CAMERA_HEIGHT = 1.4;

// Battle fog (tight visibility for tension)
const BATTLE_FOG_NEAR = 2;
const BATTLE_FOG_FAR = 12;

// Hazard material properties
const HAZARD_EMISSIVE: Record<string, number> = {
  '~': 0xff3300, // Lava - orange glow
  '!': 0x44ff44, // Poison - green haze
  '\u2248': 0x3366aa, // Deep water - blue sheen
  '=': 0x88ddff, // Ice - cold tint
};

const FLOOR_COLORS: Record<string, number> = {
  '.': 0x2a2a3a, // Stone floor
  '#': 0x444455, // Wall
  '~': 0x331100, // Lava base
  '!': 0x113311, // Poison base
  '\u2248': 0x112233, // Water base
  '=': 0x334455, // Ice base
  '+': 0x4a3520, // Door
  ' ': 0x0a0a0a, // Void
};

interface BattleRenderer3DProps {
  battle: BattleState;
  onOverviewComplete?: () => void;
}

interface OverviewState {
  phase: 'idle' | 'zoom_out' | 'pan_enemies' | 'pan_player' | 'settle' | 'complete';
  startTime: number;
  skipped: boolean;
}

/**
 * Create a sprite with HP bar for entity
 */
function createEntitySprite(
  entity: BattleEntity,
  isPlayer: boolean
): THREE.Group {
  const group = new THREE.Group();

  // Create symbol sprite
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d')!;

  // Background circle
  const bgColor = isPlayer ? '#4444ff' : '#ff4444';
  ctx.beginPath();
  ctx.arc(64, 64, 56, 0, Math.PI * 2);
  ctx.fillStyle = bgColor;
  ctx.fill();
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 4;
  ctx.stroke();

  // Symbol
  ctx.font = 'bold 64px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#ffffff';
  ctx.fillText(isPlayer ? '@' : 'E', 64, 64);

  const texture = new THREE.CanvasTexture(canvas);
  const material = new THREE.SpriteMaterial({
    map: texture,
    transparent: true,
    depthTest: true,
  });

  const sprite = new THREE.Sprite(material);
  sprite.scale.set(1.2, 1.2, 1);
  sprite.position.y = 0.8;
  group.add(sprite);

  // HP bar
  const hpCanvas = document.createElement('canvas');
  hpCanvas.width = 128;
  hpCanvas.height = 24;
  const hpCtx = hpCanvas.getContext('2d')!;

  const hpPercent = Math.max(0, entity.hp / entity.max_hp);
  const hpColor = hpPercent > 0.6 ? '#44ff44' : hpPercent > 0.3 ? '#ffff44' : '#ff4444';

  // Background
  hpCtx.fillStyle = '#000000';
  hpCtx.fillRect(0, 0, 128, 24);

  // HP fill
  hpCtx.fillStyle = hpColor;
  hpCtx.fillRect(2, 2, 124 * hpPercent, 20);

  // Border
  hpCtx.strokeStyle = '#ffffff';
  hpCtx.lineWidth = 2;
  hpCtx.strokeRect(1, 1, 126, 22);

  const hpTexture = new THREE.CanvasTexture(hpCanvas);
  const hpMaterial = new THREE.SpriteMaterial({
    map: hpTexture,
    transparent: true,
    depthTest: false,
  });

  const hpSprite = new THREE.Sprite(hpMaterial);
  hpSprite.scale.set(1.5, 0.3, 1);
  hpSprite.position.y = 1.6;
  group.add(hpSprite);

  return group;
}

export function BattleRenderer3D({ battle, onOverviewComplete }: BattleRenderer3DProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const entityGroupRef = useRef<THREE.Group | null>(null);
  const animationIdRef = useRef<number>(0);

  const [overviewState, setOverviewState] = useState<OverviewState>({
    phase: 'zoom_out',
    startTime: Date.now(),
    skipped: false,
  });

  // Initialize Three.js scene
  useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight;

    // Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0a0a);
    scene.fog = new THREE.Fog(0x0a0a0a, BATTLE_FOG_NEAR, BATTLE_FOG_FAR);
    sceneRef.current = scene;

    // Camera
    const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 100);
    cameraRef.current = camera;

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Lighting
    const ambientLight = new THREE.AmbientLight(0x404040, 0.5);
    scene.add(ambientLight);

    const pointLight = new THREE.PointLight(0xffffff, 1, 20);
    pointLight.position.set(0, 3, 0);
    scene.add(pointLight);

    // Build arena geometry
    buildArena(scene, battle);

    // Entity group for easy updates
    const entityGroup = new THREE.Group();
    scene.add(entityGroup);
    entityGroupRef.current = entityGroup;

    // Initial entity placement
    updateEntities(entityGroup, battle);

    // Animation loop
    const animate = () => {
      animationIdRef.current = requestAnimationFrame(animate);

      // Update camera based on overview phase
      updateCamera(camera, battle, overviewState);

      renderer.render(scene, camera);
    };
    animate();

    // Cleanup
    return () => {
      cancelAnimationFrame(animationIdRef.current);
      renderer.dispose();
      container.removeChild(renderer.domElement);
    };
  }, []);

  // Update entities when battle state changes
  useEffect(() => {
    if (entityGroupRef.current && battle) {
      updateEntities(entityGroupRef.current, battle);
    }
  }, [battle]);

  // Handle overview phases
  useEffect(() => {
    if (overviewState.skipped || overviewState.phase === 'complete') {
      return;
    }

    const elapsed = Date.now() - overviewState.startTime;
    const phaseDurations = {
      zoom_out: 800,
      pan_enemies: 1200,
      pan_player: 800,
      settle: 400,
    };

    const duration = phaseDurations[overviewState.phase as keyof typeof phaseDurations] || 500;

    if (elapsed >= duration) {
      const nextPhase = {
        zoom_out: 'pan_enemies',
        pan_enemies: 'pan_player',
        pan_player: 'settle',
        settle: 'complete',
      }[overviewState.phase] as OverviewState['phase'];

      if (nextPhase === 'complete') {
        onOverviewComplete?.();
      }

      setOverviewState({
        phase: nextPhase,
        startTime: Date.now(),
        skipped: false,
      });
    }
  }, [overviewState]);

  // Skip overview on keypress
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.key === ' ' || e.key === 'Escape') && overviewState.phase !== 'complete') {
        setOverviewState({
          phase: 'complete',
          startTime: Date.now(),
          skipped: true,
        });
        onOverviewComplete?.();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [overviewState.phase, onOverviewComplete]);

  return (
    <div
      ref={containerRef}
      className="battle-renderer-3d"
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: 100,
      }}
    />
  );
}

/**
 * Build the arena geometry from battle tiles
 */
function buildArena(scene: THREE.Scene, battle: BattleState) {
  const { arena_tiles, arena_width, arena_height } = battle;

  // Create floor and wall geometry
  for (let y = 0; y < arena_height; y++) {
    for (let x = 0; x < arena_width; x++) {
      const tile = arena_tiles[y]?.[x] || '.';
      const worldX = (x - arena_width / 2) * TILE_SIZE;
      const worldZ = (y - arena_height / 2) * TILE_SIZE;

      if (tile === '#') {
        // Wall
        const wallGeometry = new THREE.BoxGeometry(TILE_SIZE, WALL_HEIGHT, TILE_SIZE);
        const wallMaterial = new THREE.MeshLambertMaterial({
          color: FLOOR_COLORS['#'],
        });
        const wall = new THREE.Mesh(wallGeometry, wallMaterial);
        wall.position.set(worldX, WALL_HEIGHT / 2, worldZ);
        scene.add(wall);
      } else {
        // Floor tile
        const floorGeometry = new THREE.PlaneGeometry(TILE_SIZE, TILE_SIZE);
        const isHazard = tile in HAZARD_EMISSIVE;

        const floorMaterial = new THREE.MeshLambertMaterial({
          color: FLOOR_COLORS[tile] || FLOOR_COLORS['.'],
          emissive: isHazard ? HAZARD_EMISSIVE[tile] : 0x000000,
          emissiveIntensity: isHazard ? 0.5 : 0,
        });

        const floor = new THREE.Mesh(floorGeometry, floorMaterial);
        floor.rotation.x = -Math.PI / 2;
        floor.position.set(worldX, 0, worldZ);
        scene.add(floor);

        // Add hazard particle effect for lava
        if (tile === '~') {
          addLavaGlow(scene, worldX, worldZ);
        }
      }
    }
  }
}

/**
 * Add glowing effect for lava tiles
 */
function addLavaGlow(scene: THREE.Scene, x: number, z: number) {
  const glowGeometry = new THREE.PlaneGeometry(TILE_SIZE * 0.8, TILE_SIZE * 0.8);
  const glowMaterial = new THREE.MeshBasicMaterial({
    color: 0xff4400,
    transparent: true,
    opacity: 0.4,
  });

  const glow = new THREE.Mesh(glowGeometry, glowMaterial);
  glow.rotation.x = -Math.PI / 2;
  glow.position.set(x, 0.05, z);
  scene.add(glow);
}

/**
 * Update entity sprites based on current battle state
 */
function updateEntities(group: THREE.Group, battle: BattleState) {
  // Clear existing entities
  while (group.children.length > 0) {
    group.remove(group.children[0]);
  }

  const { arena_width, arena_height } = battle;

  // Add player
  if (battle.player) {
    const playerSprite = createEntitySprite(battle.player as BattleEntity, true);
    const px = (battle.player.arena_x - arena_width / 2) * TILE_SIZE;
    const pz = (battle.player.arena_y - arena_height / 2) * TILE_SIZE;
    playerSprite.position.set(px, 0, pz);
    group.add(playerSprite);
  }

  // Add enemies
  for (const enemy of battle.enemies) {
    if (enemy.hp > 0) {
      const enemySprite = createEntitySprite(enemy, false);
      const ex = (enemy.arena_x - arena_width / 2) * TILE_SIZE;
      const ez = (enemy.arena_y - arena_height / 2) * TILE_SIZE;
      enemySprite.position.set(ex, 0, ez);
      group.add(enemySprite);
    }
  }
}

/**
 * Update camera position based on overview phase
 */
function updateCamera(
  camera: THREE.PerspectiveCamera,
  battle: BattleState,
  overviewState: OverviewState
) {
  const { arena_width, arena_height } = battle;
  const centerX = 0;
  const centerZ = 0;

  const elapsed = Date.now() - overviewState.startTime;
  const { phase, skipped } = overviewState;

  if (skipped || phase === 'complete' || phase === 'idle') {
    // First-person at player position
    if (battle.player) {
      const px = (battle.player.arena_x - arena_width / 2) * TILE_SIZE;
      const pz = (battle.player.arena_y - arena_height / 2) * TILE_SIZE;
      camera.position.set(px, CAMERA_HEIGHT, pz + 0.5);
      camera.lookAt(px, CAMERA_HEIGHT, pz - 5);
    }
    return;
  }

  // Overview phases
  const phaseDurations: Record<string, number> = {
    zoom_out: 800,
    pan_enemies: 1200,
    pan_player: 800,
    settle: 400,
  };

  const duration = phaseDurations[phase] || 500;
  const t = Math.min(1, elapsed / duration);
  const eased = easeInOutCubic(t);

  switch (phase) {
    case 'zoom_out':
      // Start from player, zoom out and up
      if (battle.player) {
        const px = (battle.player.arena_x - arena_width / 2) * TILE_SIZE;
        const pz = (battle.player.arena_y - arena_height / 2) * TILE_SIZE;
        const height = CAMERA_HEIGHT + eased * 8;
        const pullBack = eased * 6;
        camera.position.set(px, height, pz + pullBack);
        camera.lookAt(centerX, 0, centerZ);
      }
      break;

    case 'pan_enemies':
      // Pan to show enemy spawn area (top of arena)
      const enemyZ = (-arena_height / 2 + 2) * TILE_SIZE;
      camera.position.set(centerX, 8, centerZ + 3);
      camera.lookAt(centerX, 0, enemyZ);
      break;

    case 'pan_player':
      // Pan back to player area
      if (battle.player) {
        const px = (battle.player.arena_x - arena_width / 2) * TILE_SIZE;
        const pz = (battle.player.arena_y - arena_height / 2) * TILE_SIZE;
        camera.position.set(px, 6 - eased * 4, pz + 4 - eased * 3);
        camera.lookAt(px, 0, pz);
      }
      break;

    case 'settle':
      // Settle into first-person
      if (battle.player) {
        const px = (battle.player.arena_x - arena_width / 2) * TILE_SIZE;
        const pz = (battle.player.arena_y - arena_height / 2) * TILE_SIZE;
        const height = 2 + (CAMERA_HEIGHT - 2) * eased;
        camera.position.set(px, height, pz + 1 - eased * 0.5);
        camera.lookAt(px, CAMERA_HEIGHT, pz - 5);
      }
      break;
  }
}

function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

export default BattleRenderer3D;
