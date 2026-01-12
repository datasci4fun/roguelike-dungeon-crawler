/**
 * BattleRenderer3D - Three.js first-person battle renderer
 *
 * Renders tactical battle arena in first-person 3D view.
 * Intentionally harder to read than isometric - claustrophobic combat feel.
 *
 * v6.3: Replaces DOM grid rendering with immersive 3D.
 */
import { useRef, useEffect, useCallback } from 'react';
import * as THREE from 'three';
import type { BattleState, BattleEntity } from '../types';
import { getBiome, type BiomeTheme } from './SceneRenderer/biomes';

// Arena dimensions
const TILE_SIZE = 2;
const WALL_HEIGHT = 2.5;
const CAMERA_HEIGHT = 1.4;

// Battle fog (extended for visibility during overview)
const BATTLE_FOG_NEAR = 4;
const BATTLE_FOG_FAR = 25;

// Hazard material properties
const HAZARD_EMISSIVE: Record<string, number> = {
  '~': 0xff3300, // Lava - orange glow
  '!': 0x44ff44, // Poison - green haze
  '\u2248': 0x3366aa, // Deep water - blue sheen
  '=': 0x88ddff, // Ice - cold tint
};

// Convert RGB array to Three.js color
function rgbToHex(rgb: [number, number, number]): number {
  return (rgb[0] << 16) | (rgb[1] << 8) | rgb[2];
}

// Hazard floor colors (these override biome colors for special tiles)
const HAZARD_FLOOR_COLORS: Record<string, number> = {
  '~': 0x442200, // Lava base
  '!': 0x224422, // Poison base
  '\u2248': 0x223344, // Water base
  '=': 0x445566, // Ice base
};

// Overview phase durations (ms)
const PHASE_DURATIONS: Record<string, number> = {
  zoom_out: 800,
  pan_enemies: 1200,
  pan_player: 800,
  settle: 400,
};

const PHASE_ORDER = ['zoom_out', 'pan_enemies', 'pan_player', 'settle', 'complete'] as const;
type OverviewPhase = typeof PHASE_ORDER[number];

interface TileCoord {
  x: number;
  y: number;
}

interface GameEvent {
  type: string;
  data: Record<string, unknown>;
}

interface DamageNumber {
  id: number;
  x: number;
  z: number;
  amount: number;
  createdAt: number;
  sprite: THREE.Sprite;
}

// v6.5 Battle Polish: Camera shake effect
interface CameraShake {
  intensity: number;    // Current shake intensity (0-1)
  decay: number;        // How fast shake decays per frame
  startTime: number;    // When shake started
}

// v6.5 Battle Polish: Hit particle effect
interface HitParticle {
  mesh: THREE.Points;
  startTime: number;
  duration: number;
}

// v6.5 Battle Polish: Attack telegraph (danger zone indicator)
interface AttackTelegraph {
  mesh: THREE.Mesh;
  startTime: number;
  duration: number;
}

interface BattleRenderer3DProps {
  battle: BattleState;
  onOverviewComplete?: () => void;
  selectedAction?: 'move' | 'attack' | 'ability1' | 'ability2' | 'ability3' | 'ability4' | null;
  onTileClick?: (tile: TileCoord, hasEnemy: boolean) => void;
  onTileHover?: (tile: TileCoord | null) => void;
  events?: GameEvent[];
}

// Highlight colors for different actions
const HIGHLIGHT_COLORS = {
  move: 0x44ff44,      // Green - valid movement
  attack: 0xff4444,    // Red - attack range
  ability: 0x4488ff,   // Blue - ability range
  selected: 0xffff44,  // Yellow - currently selected tile
};

// Attack/ability ranges (tiles from player)
const ACTION_RANGES: Record<string, number> = {
  move: 1,
  attack: 1,
  ability1: 1,
  ability2: 2,
  ability3: 3,
  ability4: 2,
};

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

  // Background circle - different colors for player vs different enemy types
  let bgColor = '#ff4444'; // Default enemy red
  if (isPlayer) {
    bgColor = '#4444ff'; // Player blue
  } else if (entity.is_elite) {
    bgColor = '#ff8800'; // Elite orange
  } else if (entity.is_boss) {
    bgColor = '#aa00aa'; // Boss purple
  }

  ctx.beginPath();
  ctx.arc(64, 64, 56, 0, Math.PI * 2);
  ctx.fillStyle = bgColor;
  ctx.fill();
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 4;
  ctx.stroke();

  // Symbol - use entity's actual symbol or fallback
  const symbol = isPlayer ? '@' : (entity.symbol || entity.name?.charAt(0) || 'E');
  ctx.font = 'bold 64px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#ffffff';
  ctx.fillText(symbol, 64, 64);

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

  // v6.5 Battle Polish: Add glowing aura ring for boss enemies
  if (entity.is_boss && !isPlayer) {
    const ringGeometry = new THREE.RingGeometry(0.8, 1.0, 32);
    const ringMaterial = new THREE.MeshBasicMaterial({
      color: 0xaa00aa,
      transparent: true,
      opacity: 0.6,
      side: THREE.DoubleSide,
    });
    const ring = new THREE.Mesh(ringGeometry, ringMaterial);
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = 0.02;
    ring.name = 'bossRing'; // Tag for animation
    group.add(ring);
  }

  return group;
}

export function BattleRenderer3D({ battle, onOverviewComplete, selectedAction, onTileClick, onTileHover, events }: BattleRenderer3DProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const entityGroupRef = useRef<THREE.Group | null>(null);
  const highlightGroupRef = useRef<THREE.Group | null>(null);
  const hoverHighlightRef = useRef<THREE.Mesh | null>(null);
  const gridGroupRef = useRef<THREE.Group | null>(null);
  const animationIdRef = useRef<number>(0);
  const raycasterRef = useRef<THREE.Raycaster>(new THREE.Raycaster());
  const mouseRef = useRef<THREE.Vector2>(new THREE.Vector2());

  // Camera control state
  const isDraggingRef = useRef(false);
  const lastMouseRef = useRef({ x: 0, y: 0 });
  const cameraYawRef = useRef(0);
  const cameraPitchRef = useRef(0);

  // Entity animation tracking for smooth transitions (type defined at module level)
  const entityAnimRef = useRef<Map<string, EntityAnimState>>(new Map());

  // Damage number tracking for floating damage text
  const damageNumbersRef = useRef<DamageNumber[]>([]);
  const damageNumberIdRef = useRef<number>(0);
  const damageGroupRef = useRef<THREE.Group | null>(null);

  // v6.5 Battle Polish: Visual effects tracking
  const cameraShakeRef = useRef<CameraShake | null>(null);
  const hitParticlesRef = useRef<HitParticle[]>([]);
  const effectsGroupRef = useRef<THREE.Group | null>(null);
  const telegraphsRef = useRef<AttackTelegraph[]>([]);
  const telegraphGroupRef = useRef<THREE.Group | null>(null);

  // Use refs for animation loop state (avoids stale closure)
  const overviewPhaseRef = useRef<OverviewPhase>('zoom_out');
  const phaseStartTimeRef = useRef<number>(Date.now());
  const overviewCompleteRef = useRef<boolean>(false);
  const onOverviewCompleteRef = useRef(onOverviewComplete);

  // Keep callback ref updated
  useEffect(() => {
    onOverviewCompleteRef.current = onOverviewComplete;
  }, [onOverviewComplete]);

  // Skip overview handler
  const skipOverview = useCallback(() => {
    if (!overviewCompleteRef.current) {
      overviewPhaseRef.current = 'complete';
      overviewCompleteRef.current = true;
      onOverviewCompleteRef.current?.();
    }
  }, []);

  // Initialize Three.js scene
  useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    const width = container.clientWidth || 800;
    const height = container.clientHeight || 600;

    // Get biome theme from battle
    const biome = getBiome(battle.biome || 'dungeon');
    const fogColor = rgbToHex(biome.fogColor);
    const ambientTint = rgbToHex(biome.ambientTint);
    const lightColor = rgbToHex(biome.lightColor);

    // Scene with biome-based fog
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(fogColor);
    scene.fog = new THREE.Fog(fogColor, BATTLE_FOG_NEAR, BATTLE_FOG_FAR);
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

    // Lighting with biome ambient tint
    const ambientLight = new THREE.AmbientLight(ambientTint, 0.6);
    scene.add(ambientLight);

    // Central overhead light with biome color
    const pointLight = new THREE.PointLight(lightColor, 1.5, 30);
    pointLight.position.set(0, 8, 0);
    scene.add(pointLight);

    // Additional fill light (slightly tinted by biome)
    const fillLight = new THREE.DirectionalLight(ambientTint, 0.3);
    fillLight.position.set(-5, 10, 5);
    scene.add(fillLight);

    // Build arena geometry with biome theme
    buildArena(scene, battle, biome);

    // Grid overlay group (always visible, shows tile boundaries)
    const gridGroup = new THREE.Group();
    scene.add(gridGroup);
    gridGroupRef.current = gridGroup;
    buildGridOverlay(gridGroup, battle);

    // Highlight group for action ranges (above grid)
    const highlightGroup = new THREE.Group();
    scene.add(highlightGroup);
    highlightGroupRef.current = highlightGroup;

    // Hover highlight (single tile under mouse)
    const hoverGeometry = new THREE.PlaneGeometry(TILE_SIZE * 0.95, TILE_SIZE * 0.95);
    const hoverMaterial = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.3,
      side: THREE.DoubleSide,
    });
    const hoverHighlight = new THREE.Mesh(hoverGeometry, hoverMaterial);
    hoverHighlight.rotation.x = -Math.PI / 2;
    hoverHighlight.position.y = 0.04;
    hoverHighlight.visible = false;
    scene.add(hoverHighlight);
    hoverHighlightRef.current = hoverHighlight;

    // Entity group for easy updates
    const entityGroup = new THREE.Group();
    scene.add(entityGroup);
    entityGroupRef.current = entityGroup;

    // Damage number group (always rendered on top of entities)
    const damageGroup = new THREE.Group();
    scene.add(damageGroup);
    damageGroupRef.current = damageGroup;

    // v6.5 Battle Polish: Effects group for particles
    const effectsGroup = new THREE.Group();
    scene.add(effectsGroup);
    effectsGroupRef.current = effectsGroup;

    // v6.5 Battle Polish: Telegraph group for attack warnings
    const telegraphGroup = new THREE.Group();
    scene.add(telegraphGroup);
    telegraphGroupRef.current = telegraphGroup;

    // Initial entity placement (show player during overview)
    updateEntities(entityGroup, battle, true);

    // Track last phase to detect transitions
    let lastPhase: OverviewPhase = 'zoom_out';

    // Animation loop with phase management
    const animate = () => {
      animationIdRef.current = requestAnimationFrame(animate);

      const now = Date.now();
      const phase = overviewPhaseRef.current;
      const phaseStart = phaseStartTimeRef.current;
      const elapsed = now - phaseStart;

      // Check for phase transition
      if (phase !== 'complete') {
        const duration = PHASE_DURATIONS[phase] || 500;
        if (elapsed >= duration) {
          // Move to next phase
          const currentIndex = PHASE_ORDER.indexOf(phase);
          const nextPhase = PHASE_ORDER[currentIndex + 1] || 'complete';
          overviewPhaseRef.current = nextPhase;
          phaseStartTimeRef.current = now;

          if (nextPhase === 'complete' && !overviewCompleteRef.current) {
            overviewCompleteRef.current = true;
            onOverviewCompleteRef.current?.();
            // Hide player sprite when entering first-person
            updateEntities(entityGroup, battle, false);
          }
        }
      }

      // If phase changed to complete (e.g., via skip), update entities
      if (phase === 'complete' && lastPhase !== 'complete') {
        updateEntities(entityGroup, battle, false);
      }
      lastPhase = phase;

      // Lerp entity positions for smooth transitions
      const lerpSpeed = 0.15; // How fast entities move (0-1)
      entityAnimRef.current.forEach((anim) => {
        // Calculate distance to target
        const dx = anim.targetX - anim.currentX;
        const dz = anim.targetZ - anim.currentZ;
        const dist = Math.sqrt(dx * dx + dz * dz);

        // Only lerp if not at target (threshold to avoid jitter)
        if (dist > 0.01) {
          anim.currentX += dx * lerpSpeed;
          anim.currentZ += dz * lerpSpeed;
          anim.sprite.position.set(anim.currentX, 0, anim.currentZ);
        } else if (dist > 0) {
          // Snap to target when close enough
          anim.currentX = anim.targetX;
          anim.currentZ = anim.targetZ;
          anim.sprite.position.set(anim.currentX, 0, anim.currentZ);
        }

        // v6.5 Battle Polish: Animate boss ring pulse
        anim.sprite.traverse((child) => {
          if (child instanceof THREE.Mesh && child.name === 'bossRing') {
            const pulse = 0.4 + Math.sin(now * 0.003) * 0.2;
            (child.material as THREE.MeshBasicMaterial).opacity = pulse;
            const scale = 1 + Math.sin(now * 0.002) * 0.1;
            child.scale.set(scale, scale, 1);
          }
        });
      });

      // Animate damage numbers (float up, fade out, cleanup)
      const DAMAGE_DURATION = 1200; // ms
      const DAMAGE_FLOAT_SPEED = 0.002; // units per ms
      const activeDamage: DamageNumber[] = [];

      for (const dmg of damageNumbersRef.current) {
        const elapsed = now - dmg.createdAt;
        if (elapsed < DAMAGE_DURATION) {
          // Still active - update position and opacity
          dmg.sprite.position.y = 1.5 + elapsed * DAMAGE_FLOAT_SPEED;
          const fadeProgress = elapsed / DAMAGE_DURATION;
          dmg.sprite.material.opacity = 1 - fadeProgress * fadeProgress; // Ease out
          activeDamage.push(dmg);
        } else {
          // Expired - remove from scene
          damageGroup.remove(dmg.sprite);
          dmg.sprite.material.map?.dispose();
          dmg.sprite.material.dispose();
        }
      }
      damageNumbersRef.current = activeDamage;

      // v6.5 Battle Polish: Animate hit particles
      const PARTICLE_DURATION = 600; // ms
      const activeParticles: HitParticle[] = [];
      for (const particle of hitParticlesRef.current) {
        const elapsed = now - particle.startTime;
        if (elapsed < particle.duration) {
          // Expand particles outward and fade
          const progress = elapsed / particle.duration;
          const scale = 1 + progress * 2;
          particle.mesh.scale.set(scale, scale, scale);
          (particle.mesh.material as THREE.PointsMaterial).opacity = 1 - progress;
          activeParticles.push(particle);
        } else {
          // Cleanup expired particle
          effectsGroup.remove(particle.mesh);
          particle.mesh.geometry.dispose();
          (particle.mesh.material as THREE.PointsMaterial).dispose();
        }
      }
      hitParticlesRef.current = activeParticles;

      // v6.5 Battle Polish: Animate attack telegraphs
      const activeTelegraphs: AttackTelegraph[] = [];
      for (const telegraph of telegraphsRef.current) {
        const elapsed = now - telegraph.startTime;
        if (elapsed < telegraph.duration) {
          // Pulse telegraph opacity
          const progress = elapsed / telegraph.duration;
          const pulse = Math.sin(progress * Math.PI * 4) * 0.2 + 0.3;
          (telegraph.mesh.material as THREE.MeshBasicMaterial).opacity = pulse;
          activeTelegraphs.push(telegraph);
        } else {
          // Cleanup expired telegraph
          telegraphGroup.remove(telegraph.mesh);
          telegraph.mesh.geometry.dispose();
          (telegraph.mesh.material as THREE.MeshBasicMaterial).dispose();
        }
      }
      telegraphsRef.current = activeTelegraphs;

      // v6.5 Battle Polish: Apply camera shake
      let shakeOffsetX = 0;
      let shakeOffsetY = 0;
      if (cameraShakeRef.current) {
        const shake = cameraShakeRef.current;
        const elapsed = now - shake.startTime;
        const SHAKE_DURATION = 300; // ms
        if (elapsed < SHAKE_DURATION) {
          const progress = elapsed / SHAKE_DURATION;
          const currentIntensity = shake.intensity * (1 - progress);
          shakeOffsetX = (Math.random() - 0.5) * currentIntensity * 0.3;
          shakeOffsetY = (Math.random() - 0.5) * currentIntensity * 0.15;
        } else {
          cameraShakeRef.current = null;
        }
      }

      // Update camera with mouse look values
      updateCamera(
        camera,
        battle,
        overviewPhaseRef.current,
        phaseStartTimeRef.current,
        cameraYawRef.current,
        cameraPitchRef.current,
        shakeOffsetX,
        shakeOffsetY
      );

      renderer.render(scene, camera);
    };
    animate();

    // Cleanup
    return () => {
      cancelAnimationFrame(animationIdRef.current);
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [battle]);

  // Update entities when battle state changes (uses animation map for smooth transitions)
  useEffect(() => {
    if (entityGroupRef.current && battle) {
      // Only show player sprite during overview, not in first-person
      const showPlayer = overviewPhaseRef.current !== 'complete';
      updateEntities(entityGroupRef.current, battle, showPlayer, entityAnimRef.current);
    }
  }, [battle.player?.hp, battle.player?.arena_x, battle.player?.arena_y, battle.enemies]);

  // Update highlights when selected action changes
  useEffect(() => {
    if (highlightGroupRef.current && battle) {
      const isComplete = overviewCompleteRef.current;
      updateHighlights(highlightGroupRef.current, battle, selectedAction, isComplete);
    }
  }, [selectedAction, battle.player?.arena_x, battle.player?.arena_y, battle.enemies]);

  // Process DAMAGE_NUMBER events to create floating damage text
  useEffect(() => {
    if (!events || !damageGroupRef.current) return;

    const { arena_width, arena_height } = battle;

    for (const event of events) {
      if (event.type === 'DAMAGE_NUMBER') {
        const arenaX = event.data.x as number;
        const arenaY = event.data.y as number;
        const amount = event.data.amount as number;

        if (arenaX === undefined || arenaY === undefined || amount === undefined) continue;

        // Convert arena coords to world coords
        const worldX = (arenaX - arena_width / 2) * TILE_SIZE;
        const worldZ = (arenaY - arena_height / 2) * TILE_SIZE;

        // Create damage number sprite
        const canvas = document.createElement('canvas');
        canvas.width = 128;
        canvas.height = 64;
        const ctx = canvas.getContext('2d')!;

        // Clear background
        ctx.clearRect(0, 0, 128, 64);

        // Draw damage number with outline
        const text = amount.toString();
        ctx.font = 'bold 48px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        // Black outline
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 6;
        ctx.strokeText(text, 64, 32);

        // Red fill for damage
        ctx.fillStyle = '#ff4444';
        ctx.fillText(text, 64, 32);

        const texture = new THREE.CanvasTexture(canvas);
        const material = new THREE.SpriteMaterial({
          map: texture,
          transparent: true,
          depthTest: false,
        });

        const sprite = new THREE.Sprite(material);
        sprite.scale.set(1.5, 0.75, 1);
        sprite.position.set(worldX, 1.5, worldZ);

        damageGroupRef.current.add(sprite);

        const dmgNumber: DamageNumber = {
          id: damageNumberIdRef.current++,
          x: worldX,
          z: worldZ,
          amount,
          createdAt: Date.now(),
          sprite,
        };

        damageNumbersRef.current.push(dmgNumber);

        // v6.5 Battle Polish: Trigger camera shake on damage
        // Intensity scales with damage amount (capped at 1.0)
        const shakeIntensity = Math.min(1.0, amount / 20);
        cameraShakeRef.current = {
          intensity: shakeIntensity,
          decay: 0.9,
          startTime: Date.now(),
        };

        // v6.5 Battle Polish: Create hit particle burst
        if (effectsGroupRef.current) {
          const particleCount = Math.min(20, amount * 2);
          const positions = new Float32Array(particleCount * 3);

          for (let i = 0; i < particleCount; i++) {
            // Spread particles in a sphere around hit location
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.random() * Math.PI;
            const r = 0.3;
            positions[i * 3] = worldX + r * Math.sin(phi) * Math.cos(theta);
            positions[i * 3 + 1] = 1.0 + r * Math.cos(phi);
            positions[i * 3 + 2] = worldZ + r * Math.sin(phi) * Math.sin(theta);
          }

          const geometry = new THREE.BufferGeometry();
          geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

          const particleMaterial = new THREE.PointsMaterial({
            color: 0xff4444,
            size: 0.15,
            transparent: true,
            opacity: 1.0,
            depthTest: true,
          });

          const particles = new THREE.Points(geometry, particleMaterial);
          effectsGroupRef.current.add(particles);

          hitParticlesRef.current.push({
            mesh: particles,
            startTime: Date.now(),
            duration: 600,
          });
        }
      }
    }
  }, [events, battle.arena_width, battle.arena_height]);

  // v6.5 Battle Polish: Process ENEMY_TELEGRAPH events for attack warnings
  useEffect(() => {
    if (!events || !telegraphGroupRef.current) return;

    const { arena_width, arena_height } = battle;

    for (const event of events) {
      if (event.type === 'ENEMY_TELEGRAPH') {
        const targetX = event.data.x as number;
        const targetY = event.data.y as number;
        const attackType = (event.data.attack_type as string) || 'melee';

        if (targetX === undefined || targetY === undefined) continue;

        // Convert arena coords to world coords
        const worldX = (targetX - arena_width / 2) * TILE_SIZE;
        const worldZ = (targetY - arena_height / 2) * TILE_SIZE;

        // Create danger zone indicator
        const geometry = new THREE.PlaneGeometry(TILE_SIZE * 0.9, TILE_SIZE * 0.9);
        const material = new THREE.MeshBasicMaterial({
          color: attackType === 'ranged' ? 0xff8800 : 0xff4444,
          transparent: true,
          opacity: 0.4,
          side: THREE.DoubleSide,
        });

        const telegraph = new THREE.Mesh(geometry, material);
        telegraph.rotation.x = -Math.PI / 2;
        telegraph.position.set(worldX, 0.02, worldZ); // Just above floor

        telegraphGroupRef.current.add(telegraph);

        telegraphsRef.current.push({
          mesh: telegraph,
          startTime: Date.now(),
          duration: 800, // Show for 800ms
        });
      }
    }
  }, [events, battle.arena_width, battle.arena_height]);

  // Skip overview on keypress
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === ' ' || e.key === 'Escape') {
        skipOverview();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [skipOverview]);

  // Convert screen coordinates to tile coordinates
  const screenToTile = useCallback((clientX: number, clientY: number): TileCoord | null => {
    if (!containerRef.current || !cameraRef.current || !sceneRef.current) return null;

    const rect = containerRef.current.getBoundingClientRect();
    mouseRef.current.x = ((clientX - rect.left) / rect.width) * 2 - 1;
    mouseRef.current.y = -((clientY - rect.top) / rect.height) * 2 + 1;

    raycasterRef.current.setFromCamera(mouseRef.current, cameraRef.current);

    // Create a plane at floor level for intersection
    const floorPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
    const intersectPoint = new THREE.Vector3();

    if (raycasterRef.current.ray.intersectPlane(floorPlane, intersectPoint)) {
      // Convert world position to tile coordinates
      // Add 0.5 before flooring to properly handle tile centers
      // Tiles are centered at (tileX - arena_width/2) * TILE_SIZE
      const tileX = Math.floor(intersectPoint.x / TILE_SIZE + 0.5 + battle.arena_width / 2);
      const tileY = Math.floor(intersectPoint.z / TILE_SIZE + 0.5 + battle.arena_height / 2);

      // Check if within arena bounds
      if (tileX >= 0 && tileX < battle.arena_width && tileY >= 0 && tileY < battle.arena_height) {
        return { x: tileX, y: tileY };
      }
    }
    return null;
  }, [battle.arena_width, battle.arena_height]);

  // Mouse event handlers
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleMouseDown = (e: MouseEvent) => {
      if (e.button === 2 || (e.button === 0 && e.shiftKey)) {
        // Right click or shift+left click to start camera drag
        isDraggingRef.current = true;
        lastMouseRef.current = { x: e.clientX, y: e.clientY };
        container.style.cursor = 'grabbing';
        e.preventDefault();
      }
    };

    const handleMouseUp = (_e: MouseEvent) => {
      if (isDraggingRef.current) {
        isDraggingRef.current = false;
        container.style.cursor = 'default';
      }
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (isDraggingRef.current && overviewCompleteRef.current) {
        // Camera rotation while dragging
        const deltaX = e.clientX - lastMouseRef.current.x;
        const deltaY = e.clientY - lastMouseRef.current.y;

        cameraYawRef.current -= deltaX * 0.005;
        cameraPitchRef.current = Math.max(-0.5, Math.min(0.5, cameraPitchRef.current - deltaY * 0.005));

        lastMouseRef.current = { x: e.clientX, y: e.clientY };
      } else if (overviewCompleteRef.current) {
        // Hover detection
        const tile = screenToTile(e.clientX, e.clientY);

        if (tile && hoverHighlightRef.current) {
          const worldX = (tile.x - battle.arena_width / 2) * TILE_SIZE;
          const worldZ = (tile.y - battle.arena_height / 2) * TILE_SIZE;

          // Check if tile is a wall
          const tileChar = battle.arena_tiles[tile.y]?.[tile.x] || '.';
          if (tileChar !== '#') {
            hoverHighlightRef.current.position.x = worldX;
            hoverHighlightRef.current.position.z = worldZ;
            hoverHighlightRef.current.visible = true;

            // Update cursor based on context
            const hasEnemy = battle.enemies.some(
              en => en.hp > 0 && en.arena_x === tile.x && en.arena_y === tile.y
            );
            const isPlayer = battle.player?.arena_x === tile.x && battle.player?.arena_y === tile.y;

            if (isPlayer) {
              container.style.cursor = 'default';
            } else if (hasEnemy && (selectedAction === 'attack' || selectedAction?.startsWith('ability'))) {
              container.style.cursor = 'crosshair';
            } else if (selectedAction === 'move') {
              const dx = Math.abs(tile.x - (battle.player?.arena_x || 0));
              const dy = Math.abs(tile.y - (battle.player?.arena_y || 0));
              container.style.cursor = (dx + dy === 1) ? 'pointer' : 'not-allowed';
            } else {
              container.style.cursor = 'pointer';
            }

            onTileHover?.(tile);
          } else {
            hoverHighlightRef.current.visible = false;
            container.style.cursor = 'not-allowed';
            onTileHover?.(null);
          }
        } else {
          if (hoverHighlightRef.current) {
            hoverHighlightRef.current.visible = false;
          }
          container.style.cursor = 'default';
          onTileHover?.(null);
        }
      }
    };

    const handleClick = (e: MouseEvent) => {
      if (e.button !== 0 || isDraggingRef.current || !overviewCompleteRef.current) return;

      const tile = screenToTile(e.clientX, e.clientY);
      if (tile) {
        const tileChar = battle.arena_tiles[tile.y]?.[tile.x] || '.';
        if (tileChar !== '#') {
          const hasEnemy = battle.enemies.some(
            en => en.hp > 0 && en.arena_x === tile.x && en.arena_y === tile.y
          );
          onTileClick?.(tile, hasEnemy);
        }
      }
    };

    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault(); // Prevent context menu
    };

    container.addEventListener('mousedown', handleMouseDown);
    container.addEventListener('mouseup', handleMouseUp);
    container.addEventListener('mousemove', handleMouseMove);
    container.addEventListener('click', handleClick);
    container.addEventListener('contextmenu', handleContextMenu);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      container.removeEventListener('mousedown', handleMouseDown);
      container.removeEventListener('mouseup', handleMouseUp);
      container.removeEventListener('mousemove', handleMouseMove);
      container.removeEventListener('click', handleClick);
      container.removeEventListener('contextmenu', handleContextMenu);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [battle, selectedAction, screenToTile, onTileClick, onTileHover]);

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
      }}
    />
  );
}

/**
 * Build the arena geometry from battle tiles
 * Creates a complete dungeon room with surrounding walls and ceiling
 * Uses biome theme for consistent visuals with exploration mode
 */
function buildArena(scene: THREE.Scene, battle: BattleState, biome: BiomeTheme) {
  const { arena_tiles, arena_width, arena_height } = battle;

  // Extend the environment beyond arena bounds for immersion
  const PADDING = 3; // Extra tiles around arena
  const CEILING_HEIGHT = 3.5;

  // Materials using biome colors
  const floorColor = rgbToHex(biome.floorColor);
  const wallColor = rgbToHex(biome.wallColor);
  const wallHighlight = rgbToHex(biome.wallHighlight);
  const ceilingColor = rgbToHex(biome.ceilingColor);
  const lightColor = rgbToHex(biome.lightColor);

  const stoneMaterial = new THREE.MeshLambertMaterial({ color: floorColor });
  const wallMaterial = new THREE.MeshLambertMaterial({ color: wallColor });
  const wallHighlightMaterial = new THREE.MeshLambertMaterial({ color: wallHighlight });
  const ceilingMaterial = new THREE.MeshLambertMaterial({ color: ceilingColor });

  // Build extended floor (stone tiles beyond arena)
  for (let y = -PADDING; y < arena_height + PADDING; y++) {
    for (let x = -PADDING; x < arena_width + PADDING; x++) {
      const worldX = (x - arena_width / 2) * TILE_SIZE;
      const worldZ = (y - arena_height / 2) * TILE_SIZE;

      // Check if inside arena bounds
      const inArena = x >= 0 && x < arena_width && y >= 0 && y < arena_height;

      if (inArena) {
        // Arena tile
        const tile = arena_tiles[y]?.[x] || '.';

        if (tile === '#') {
          // Wall inside arena - use highlight color for variety
          const wallGeometry = new THREE.BoxGeometry(TILE_SIZE, WALL_HEIGHT, TILE_SIZE);
          const wall = new THREE.Mesh(wallGeometry, wallHighlightMaterial);
          wall.position.set(worldX, WALL_HEIGHT / 2, worldZ);
          scene.add(wall);
        } else {
          // Floor tile
          const floorGeometry = new THREE.PlaneGeometry(TILE_SIZE, TILE_SIZE);
          const isHazard = tile in HAZARD_EMISSIVE;

          // Use hazard color if hazard tile, otherwise biome floor color
          const tileColor = isHazard ? (HAZARD_FLOOR_COLORS[tile] || floorColor) : floorColor;

          const floorMat = new THREE.MeshLambertMaterial({
            color: tileColor,
            emissive: isHazard ? HAZARD_EMISSIVE[tile] : 0x000000,
            emissiveIntensity: isHazard ? 0.5 : 0,
          });

          const floor = new THREE.Mesh(floorGeometry, floorMat);
          floor.rotation.x = -Math.PI / 2;
          floor.position.set(worldX, 0, worldZ);
          scene.add(floor);

          // Add hazard glow for lava
          if (tile === '~') {
            addLavaGlow(scene, worldX, worldZ);
          }
        }
      } else {
        // Outside arena - create surrounding dungeon structure
        const isEdge = x === -PADDING || x === arena_width + PADDING - 1 ||
                       y === -PADDING || y === arena_height + PADDING - 1;

        if (isEdge) {
          // Outer wall
          const wallGeometry = new THREE.BoxGeometry(TILE_SIZE, CEILING_HEIGHT, TILE_SIZE);
          const wall = new THREE.Mesh(wallGeometry, wallMaterial);
          wall.position.set(worldX, CEILING_HEIGHT / 2, worldZ);
          scene.add(wall);
        } else {
          // Stone floor outside arena
          const floorGeometry = new THREE.PlaneGeometry(TILE_SIZE, TILE_SIZE);
          const floor = new THREE.Mesh(floorGeometry, stoneMaterial);
          floor.rotation.x = -Math.PI / 2;
          floor.position.set(worldX, 0, worldZ);
          scene.add(floor);
        }
      }
    }
  }

  // Add ceiling over the entire area
  const ceilingWidth = (arena_width + PADDING * 2) * TILE_SIZE;
  const ceilingDepth = (arena_height + PADDING * 2) * TILE_SIZE;
  const ceilingGeometry = new THREE.PlaneGeometry(ceilingWidth, ceilingDepth);
  const ceiling = new THREE.Mesh(ceilingGeometry, ceilingMaterial);
  ceiling.rotation.x = Math.PI / 2;
  ceiling.position.set(0, CEILING_HEIGHT, 0);
  scene.add(ceiling);

  // Add some torches/lights around the arena for atmosphere (using biome light color)
  const torchPositions = [
    [-arena_width / 2 - 1, -arena_height / 2 - 1],
    [arena_width / 2 + 1, -arena_height / 2 - 1],
    [-arena_width / 2 - 1, arena_height / 2 + 1],
    [arena_width / 2 + 1, arena_height / 2 + 1],
  ];

  for (const [tx, tz] of torchPositions) {
    const torchLight = new THREE.PointLight(lightColor, 0.8, 12);
    torchLight.position.set(tx * TILE_SIZE, 2, tz * TILE_SIZE);
    scene.add(torchLight);

    // Torch visual (simple glowing sphere with biome color)
    const torchGeometry = new THREE.SphereGeometry(0.15, 8, 8);
    const torchMat = new THREE.MeshBasicMaterial({ color: lightColor });
    const torch = new THREE.Mesh(torchGeometry, torchMat);
    torch.position.set(tx * TILE_SIZE, 2, tz * TILE_SIZE);
    scene.add(torch);
  }
}

/**
 * Build grid overlay showing tile boundaries
 * Grid lines are drawn AROUND each tile (at tile edges, not centers)
 */
function buildGridOverlay(group: THREE.Group, battle: BattleState) {
  const { arena_width, arena_height } = battle;

  const gridMaterial = new THREE.LineBasicMaterial({
    color: 0xffffff,
    transparent: true,
    opacity: 0.2,
  });

  // Half tile offset so grid lines are at tile EDGES, not centers
  const halfTile = TILE_SIZE / 2;

  // Horizontal lines (along X axis)
  for (let y = 0; y <= arena_height; y++) {
    // Grid line at the EDGE between tiles y-1 and y
    const worldZ = (y - arena_height / 2) * TILE_SIZE - halfTile;
    const startX = (-arena_width / 2) * TILE_SIZE - halfTile;
    const endX = (arena_width / 2) * TILE_SIZE - halfTile;

    const geometry = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(startX, 0.02, worldZ),
      new THREE.Vector3(endX, 0.02, worldZ),
    ]);
    const line = new THREE.Line(geometry, gridMaterial);
    group.add(line);
  }

  // Vertical lines (along Z axis)
  for (let x = 0; x <= arena_width; x++) {
    const worldX = (x - arena_width / 2) * TILE_SIZE - halfTile;
    const startZ = (-arena_height / 2) * TILE_SIZE - halfTile;
    const endZ = (arena_height / 2) * TILE_SIZE - halfTile;

    const geometry = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(worldX, 0.02, startZ),
      new THREE.Vector3(worldX, 0.02, endZ),
    ]);
    const line = new THREE.Line(geometry, gridMaterial);
    group.add(line);
  }
}

/**
 * Update highlight tiles based on selected action and player position
 */
function updateHighlights(
  group: THREE.Group,
  battle: BattleState,
  selectedAction: string | null | undefined,
  overviewComplete: boolean
) {
  // Clear existing highlights
  while (group.children.length > 0) {
    const child = group.children[0];
    group.remove(child);
    if (child instanceof THREE.Mesh) {
      child.geometry.dispose();
      (child.material as THREE.Material).dispose();
    }
  }

  // Don't show highlights during overview or if no action selected
  if (!overviewComplete || !selectedAction || !battle.player) {
    return;
  }

  const { arena_width, arena_height, arena_tiles } = battle;
  const playerX = battle.player.arena_x;
  const playerY = battle.player.arena_y;

  const range = ACTION_RANGES[selectedAction] || 1;
  const isAttack = selectedAction === 'attack';
  const isAbility = selectedAction.startsWith('ability');
  const highlightColor = isAttack ? HIGHLIGHT_COLORS.attack :
                         isAbility ? HIGHLIGHT_COLORS.ability :
                         HIGHLIGHT_COLORS.move;

  // Find tiles within range
  for (let dy = -range; dy <= range; dy++) {
    for (let dx = -range; dx <= range; dx++) {
      // Skip player's own tile for movement
      if (dx === 0 && dy === 0 && selectedAction === 'move') continue;

      const tx = playerX + dx;
      const ty = playerY + dy;

      // Check bounds
      if (tx < 0 || tx >= arena_width || ty < 0 || ty >= arena_height) continue;

      // Check if tile is walkable (not a wall)
      const tile = arena_tiles[ty]?.[tx] || '.';
      if (tile === '#') continue;

      // For movement, check Manhattan distance = 1
      if (selectedAction === 'move' && (Math.abs(dx) + Math.abs(dy)) !== 1) continue;

      // For attacks/abilities, check if enemy is present
      if (isAttack || isAbility) {
        const hasEnemy = battle.enemies.some(
          e => e.hp > 0 && e.arena_x === tx && e.arena_y === ty
        );
        // Only highlight tiles with enemies for attacks
        if (isAttack && !hasEnemy) continue;
      }

      // Create highlight plane
      const worldX = (tx - arena_width / 2) * TILE_SIZE;
      const worldZ = (ty - arena_height / 2) * TILE_SIZE;

      const highlightGeometry = new THREE.PlaneGeometry(TILE_SIZE * 0.9, TILE_SIZE * 0.9);
      const highlightMaterial = new THREE.MeshBasicMaterial({
        color: highlightColor,
        transparent: true,
        opacity: 0.4,
        side: THREE.DoubleSide,
      });

      const highlight = new THREE.Mesh(highlightGeometry, highlightMaterial);
      highlight.rotation.x = -Math.PI / 2;
      highlight.position.set(worldX, 0.03, worldZ);
      group.add(highlight);
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

// Entity animation state interface (used by component)
interface EntityAnimState {
  sprite: THREE.Group;
  currentX: number;
  currentZ: number;
  targetX: number;
  targetZ: number;
  lastHp: number;
}

/**
 * Update entity sprites based on current battle state
 * Supports smooth transitions by updating target positions
 * Note: Player sprite is NOT rendered in first-person view (we ARE the player)
 */
function updateEntities(
  group: THREE.Group,
  battle: BattleState,
  showPlayer: boolean = false,
  animMap?: Map<string, EntityAnimState>
) {
  const { arena_width, arena_height } = battle;

  // If no animation map provided, fall back to simple mode (clear and recreate)
  if (!animMap) {
    // Clear existing entities
    while (group.children.length > 0) {
      const child = group.children[0];
      group.remove(child);
      child.traverse((obj) => {
        if (obj instanceof THREE.Sprite) {
          obj.material.map?.dispose();
          obj.material.dispose();
        }
      });
    }

    // Only add player during overview (showPlayer = true)
    if (showPlayer && battle.player) {
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
    return;
  }

  // Smart mode: update targets and handle sprite lifecycle
  const currentIds = new Set<string>();

  // Handle player
  const playerId = 'player';
  if (showPlayer && battle.player) {
    currentIds.add(playerId);
    const px = (battle.player.arena_x - arena_width / 2) * TILE_SIZE;
    const pz = (battle.player.arena_y - arena_height / 2) * TILE_SIZE;

    const existing = animMap.get(playerId);
    if (existing) {
      // Update target position
      existing.targetX = px;
      existing.targetZ = pz;
      // Recreate sprite if HP changed
      if (existing.lastHp !== battle.player.hp) {
        group.remove(existing.sprite);
        existing.sprite.traverse((obj) => {
          if (obj instanceof THREE.Sprite) {
            obj.material.map?.dispose();
            obj.material.dispose();
          }
        });
        const newSprite = createEntitySprite(battle.player as BattleEntity, true);
        newSprite.position.set(existing.currentX, 0, existing.currentZ);
        group.add(newSprite);
        existing.sprite = newSprite;
        existing.lastHp = battle.player.hp;
      }
    } else {
      // New entity - create sprite at target position
      const sprite = createEntitySprite(battle.player as BattleEntity, true);
      sprite.position.set(px, 0, pz);
      group.add(sprite);
      animMap.set(playerId, {
        sprite,
        currentX: px,
        currentZ: pz,
        targetX: px,
        targetZ: pz,
        lastHp: battle.player.hp,
      });
    }
  }

  // Handle enemies
  for (const enemy of battle.enemies) {
    if (enemy.hp > 0) {
      const enemyId = enemy.entity_id;
      currentIds.add(enemyId);
      const ex = (enemy.arena_x - arena_width / 2) * TILE_SIZE;
      const ez = (enemy.arena_y - arena_height / 2) * TILE_SIZE;

      const existing = animMap.get(enemyId);
      if (existing) {
        // Update target position
        existing.targetX = ex;
        existing.targetZ = ez;
        // Recreate sprite if HP changed
        if (existing.lastHp !== enemy.hp) {
          group.remove(existing.sprite);
          existing.sprite.traverse((obj) => {
            if (obj instanceof THREE.Sprite) {
              obj.material.map?.dispose();
              obj.material.dispose();
            }
          });
          const newSprite = createEntitySprite(enemy, false);
          newSprite.position.set(existing.currentX, 0, existing.currentZ);
          group.add(newSprite);
          existing.sprite = newSprite;
          existing.lastHp = enemy.hp;
        }
      } else {
        // New entity - create sprite at target position
        const sprite = createEntitySprite(enemy, false);
        sprite.position.set(ex, 0, ez);
        group.add(sprite);
        animMap.set(enemyId, {
          sprite,
          currentX: ex,
          currentZ: ez,
          targetX: ex,
          targetZ: ez,
          lastHp: enemy.hp,
        });
      }
    }
  }

  // Remove entities that are no longer present
  const entriesToRemove: string[] = [];
  animMap.forEach((anim, id) => {
    if (!currentIds.has(id)) {
      group.remove(anim.sprite);
      anim.sprite.traverse((obj) => {
        if (obj instanceof THREE.Sprite) {
          obj.material.map?.dispose();
          obj.material.dispose();
        }
      });
      entriesToRemove.push(id);
    }
  });
  entriesToRemove.forEach(id => animMap.delete(id));
}

/**
 * Update camera position based on overview phase
 * v6.5: Added shakeX/shakeY for camera shake effect
 */
function updateCamera(
  camera: THREE.PerspectiveCamera,
  battle: BattleState,
  phase: OverviewPhase,
  phaseStartTime: number,
  yaw: number = 0,
  pitch: number = 0,
  shakeX: number = 0,
  shakeY: number = 0
) {
  const { arena_width, arena_height } = battle;
  const centerX = 0;
  const centerZ = 0;

  const elapsed = Date.now() - phaseStartTime;

  if (phase === 'complete') {
    // First-person at player position with mouse look
    if (battle.player) {
      const px = (battle.player.arena_x - arena_width / 2) * TILE_SIZE;
      const pz = (battle.player.arena_y - arena_height / 2) * TILE_SIZE;

      // v6.5: Apply camera shake offset
      camera.position.set(px + shakeX, CAMERA_HEIGHT + shakeY, pz);

      // Apply yaw (horizontal rotation) and pitch (vertical rotation)
      const lookDistance = 5;
      const lookX = px + Math.sin(yaw) * lookDistance;
      const lookY = CAMERA_HEIGHT + pitch * lookDistance;
      const lookZ = pz - Math.cos(yaw) * lookDistance;

      camera.lookAt(lookX, lookY, lookZ);
    }
    return;
  }

  // Overview phases
  const duration = PHASE_DURATIONS[phase] || 500;
  const t = Math.min(1, elapsed / duration);
  const eased = easeInOutCubic(t);

  switch (phase) {
    case 'zoom_out':
      // Start from player, zoom out and up
      if (battle.player) {
        const px = (battle.player.arena_x - arena_width / 2) * TILE_SIZE;
        const pz = (battle.player.arena_y - arena_height / 2) * TILE_SIZE;
        const height = CAMERA_HEIGHT + eased * 10;
        const pullBack = eased * 8;
        camera.position.set(px, height, pz + pullBack);
        camera.lookAt(centerX, 0, centerZ);
      }
      break;

    case 'pan_enemies':
      // Pan to show enemy spawn area (top of arena)
      {
        const enemyZ = (-arena_height / 2 + 2) * TILE_SIZE;
        camera.position.set(centerX, 10, centerZ + 5);
        camera.lookAt(centerX, 0, enemyZ);
      }
      break;

    case 'pan_player':
      // Pan back to player area
      if (battle.player) {
        const px = (battle.player.arena_x - arena_width / 2) * TILE_SIZE;
        const pz = (battle.player.arena_y - arena_height / 2) * TILE_SIZE;
        camera.position.set(px, 8 - eased * 5, pz + 5 - eased * 3);
        camera.lookAt(px, 0, pz);
      }
      break;

    case 'settle':
      // Settle into first-person
      if (battle.player) {
        const px = (battle.player.arena_x - arena_width / 2) * TILE_SIZE;
        const pz = (battle.player.arena_y - arena_height / 2) * TILE_SIZE;
        const height = 3 + (CAMERA_HEIGHT - 3) * eased;
        camera.position.set(px, height, pz + 2 - eased * 1.5);
        camera.lookAt(px, CAMERA_HEIGHT, pz - 5);
      }
      break;
  }
}

function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

export default BattleRenderer3D;
