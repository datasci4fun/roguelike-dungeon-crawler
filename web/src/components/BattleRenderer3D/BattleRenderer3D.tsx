/**
 * BattleRenderer3D - Three.js battle renderer
 *
 * Renders tactical battle arena in 3D view.
 * v6.9: Refactored into modular components.
 */
import { useRef, useEffect, useCallback, useState } from 'react';
import * as THREE from 'three';
import { getBiome } from '../SceneRenderer/biomes';

// Import from local modules
import {
  TILE_SIZE,
  BATTLE_FOG_NEAR,
  BATTLE_FOG_FAR,
  PHASE_DURATIONS,
  PHASE_ORDER,
  getSharedGeometries,
  rgbToHex,
} from './constants';
import type {
  OverviewPhase,
  TileCoord,
  EntityAnimState,
  DamageNumber,
  CameraShake,
  HitParticle,
  AttackTelegraph,
  BattleRenderer3DProps,
  EnemyTurnState,
} from './types';
import { preloadBattleModels } from './modelLoader';
import { buildArena, buildGridOverlay } from './arenaBuilder';
import { updateEntities } from './entityUpdater';
import { updateCamera } from './cameraController';
import { updateHighlights } from './highlightSystem';
import {
  createDamageNumber,
  returnDamageCanvas,
  createHitParticles,
  updateHitParticles,
  updateCameraShake,
  startCameraShake,
  updateTelegraphs,
} from './effectsSystem';

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

  // Smooth camera movement
  const cameraCurrentX = useRef(0);
  const cameraCurrentZ = useRef(0);
  const cameraTargetX = useRef(0);
  const cameraTargetZ = useRef(0);
  const cameraInitialized = useRef(false);

  // Entity animation tracking
  const entityAnimRef = useRef<Map<string, EntityAnimState>>(new Map());

  // Battle state ref for animation loop
  const battleRef = useRef(battle);

  // Damage number tracking
  const damageNumbersRef = useRef<DamageNumber[]>([]);
  const damageNumberIdRef = useRef<number>(0);
  const damageGroupRef = useRef<THREE.Group | null>(null);

  // Visual effects tracking
  const cameraShakeRef = useRef<CameraShake | null>(null);
  const hitParticlesRef = useRef<HitParticle[]>([]);
  const effectsGroupRef = useRef<THREE.Group | null>(null);
  const telegraphsRef = useRef<AttackTelegraph[]>([]);
  const telegraphGroupRef = useRef<THREE.Group | null>(null);

  // Animation loop state refs
  const overviewPhaseRef = useRef<OverviewPhase>('zoom_out');
  const phaseStartTimeRef = useRef<number>(Date.now());
  const overviewCompleteRef = useRef<boolean>(false);
  const onOverviewCompleteRef = useRef(onOverviewComplete);

  // Track if 3D models have been loaded
  const modelsLoadedRef = useRef(false);

  // Turn-based combat state
  const [turnPhase, setTurnPhase] = useState<'player' | 'enemy' | 'end_of_round'>('player');
  const [currentEnemyTurn, setCurrentEnemyTurn] = useState<EnemyTurnState | null>(null);
  const currentEnemyTurnRef = useRef<string | null>(null);
  const turnQueueRef = useRef<Array<{ type: string; data: Record<string, unknown> }>>([]);
  const processingTurnRef = useRef(false);
  const [turnQueueTrigger, setTurnQueueTrigger] = useState(0);

  // Keep callback ref updated
  useEffect(() => {
    onOverviewCompleteRef.current = onOverviewComplete;
  }, [onOverviewComplete]);

  // Keep current enemy turn ref updated
  useEffect(() => {
    currentEnemyTurnRef.current = currentEnemyTurn?.enemyId ?? null;
  }, [currentEnemyTurn]);

  // Keep battle ref updated
  useEffect(() => {
    battleRef.current = battle;
  }, [battle]);

  // Preload 3D models
  useEffect(() => {
    if (battle.enemies.length === 0) return;

    preloadBattleModels(battle.enemies).then(() => {
      modelsLoadedRef.current = true;
      if (entityGroupRef.current && battleRef.current) {
        const showPlayer = overviewPhaseRef.current !== 'complete';
        updateEntities(entityGroupRef.current, battleRef.current, showPlayer, entityAnimRef.current);
      }
    });
  }, [battle.enemies]);

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

    const biome = getBiome(battle.biome || 'dungeon');
    const fogColor = rgbToHex(biome.fogColor);
    const ambientTint = rgbToHex(biome.ambientTint);
    const lightColor = rgbToHex(biome.lightColor);

    // Scene
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

    // Lighting
    const ambientLight = new THREE.AmbientLight(ambientTint, 0.6);
    scene.add(ambientLight);

    const pointLight = new THREE.PointLight(lightColor, 1.5, 30);
    pointLight.position.set(0, 8, 0);
    scene.add(pointLight);

    const fillLight = new THREE.DirectionalLight(ambientTint, 0.3);
    fillLight.position.set(-5, 10, 5);
    scene.add(fillLight);

    // Build arena
    buildArena(scene, battle, biome);

    // Grid overlay
    const gridGroup = new THREE.Group();
    scene.add(gridGroup);
    gridGroupRef.current = gridGroup;
    buildGridOverlay(gridGroup, battle);

    // Highlight group
    const highlightGroup = new THREE.Group();
    scene.add(highlightGroup);
    highlightGroupRef.current = highlightGroup;

    // Hover highlight
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

    // Entity group
    const entityGroup = new THREE.Group();
    scene.add(entityGroup);
    entityGroupRef.current = entityGroup;

    // Damage number group
    const damageGroup = new THREE.Group();
    scene.add(damageGroup);
    damageGroupRef.current = damageGroup;

    // Effects group
    const effectsGroup = new THREE.Group();
    scene.add(effectsGroup);
    effectsGroupRef.current = effectsGroup;

    // Telegraph group
    const telegraphGroup = new THREE.Group();
    scene.add(telegraphGroup);
    telegraphGroupRef.current = telegraphGroup;

    // Initial entity placement
    updateEntities(entityGroup, battle, true, entityAnimRef.current);

    let lastPhase: OverviewPhase = 'zoom_out';

    // Animation loop
    const animate = () => {
      animationIdRef.current = requestAnimationFrame(animate);

      const now = Date.now();
      const phase = overviewPhaseRef.current;
      const phaseStart = phaseStartTimeRef.current;
      const elapsed = now - phaseStart;

      // Phase transition
      if (phase !== 'complete') {
        const duration = PHASE_DURATIONS[phase] || 500;
        if (elapsed >= duration) {
          const currentIndex = PHASE_ORDER.indexOf(phase);
          const nextPhase = PHASE_ORDER[currentIndex + 1] || 'complete';
          overviewPhaseRef.current = nextPhase;
          phaseStartTimeRef.current = now;

          if (nextPhase === 'complete' && !overviewCompleteRef.current) {
            overviewCompleteRef.current = true;
            onOverviewCompleteRef.current?.();
            updateEntities(entityGroup, battleRef.current, true, entityAnimRef.current);
          }
        }
      }

      if (phase === 'complete' && lastPhase !== 'complete') {
        updateEntities(entityGroup, battleRef.current, true, entityAnimRef.current);
      }
      lastPhase = phase;

      // Entity position lerping
      const lerpSpeed = 0.08;
      const activeEnemyId = currentEnemyTurnRef.current;

      entityAnimRef.current.forEach((anim, entityId) => {
        const dx = anim.targetX - anim.currentX;
        const dz = anim.targetZ - anim.currentZ;
        const dist = Math.sqrt(dx * dx + dz * dz);

        if (dist > 0.01) {
          anim.currentX += dx * lerpSpeed;
          anim.currentZ += dz * lerpSpeed;
          anim.sprite.position.set(anim.currentX, 0, anim.currentZ);
        } else if (dist > 0) {
          anim.currentX = anim.targetX;
          anim.currentZ = anim.targetZ;
          anim.sprite.position.set(anim.currentX, 0, anim.currentZ);
        }

        const isActiveTurn = activeEnemyId !== null && entityId === activeEnemyId;

        // Animate rings and glows
        anim.sprite.traverse((child) => {
          if (child instanceof THREE.Mesh && child.name === 'bossRing') {
            const pulse = 0.4 + Math.sin(now * 0.003) * 0.2;
            (child.material as THREE.MeshBasicMaterial).opacity = pulse;
            const scale = 1 + Math.sin(now * 0.002) * 0.1;
            child.scale.set(scale, scale, 1);
          }
          if (child instanceof THREE.Mesh && child.name === 'eliteGlow') {
            const pulse = 0.3 + Math.sin(now * 0.004) * 0.2;
            (child.material as THREE.MeshBasicMaterial).opacity = pulse;
          }
          if (child instanceof THREE.Mesh && child.name === 'activeTurnGlow') {
            if (isActiveTurn) {
              const pulse = 0.6 + Math.sin(now * 0.008) * 0.3;
              (child.material as THREE.MeshBasicMaterial).opacity = pulse;
              child.visible = true;
            } else {
              child.visible = false;
            }
          }
          if (child instanceof THREE.Group && child.userData.idleRotation) {
            const currentBattle = battleRef.current;
            if (currentBattle.player) {
              const playerX = (currentBattle.player.arena_x - currentBattle.arena_width / 2) * TILE_SIZE;
              const playerZ = (currentBattle.player.arena_y - currentBattle.arena_height / 2) * TILE_SIZE;
              const angleToPlayer = Math.atan2(playerX - anim.currentX, playerZ - anim.currentZ);
              child.rotation.y = angleToPlayer + Math.sin(now * 0.002) * 0.1;
            }
          }
        });
      });

      // Damage numbers animation
      const DAMAGE_DURATION = 1200;
      const DAMAGE_FLOAT_SPEED = 0.002;
      const activeDamage: DamageNumber[] = [];

      for (const dmg of damageNumbersRef.current) {
        const dmgElapsed = now - dmg.createdAt;
        if (dmgElapsed < DAMAGE_DURATION) {
          dmg.sprite.position.y = 1.5 + dmgElapsed * DAMAGE_FLOAT_SPEED;
          const fadeProgress = dmgElapsed / DAMAGE_DURATION;
          dmg.sprite.material.opacity = 1 - fadeProgress * fadeProgress;
          activeDamage.push(dmg);
        } else {
          damageGroup.remove(dmg.sprite);
          dmg.sprite.material.map?.dispose();
          dmg.sprite.material.dispose();
          returnDamageCanvas(dmg.canvas);
        }
      }
      damageNumbersRef.current = activeDamage;

      // Hit particles
      hitParticlesRef.current = updateHitParticles(hitParticlesRef.current, effectsGroup);

      // Camera shake
      const shakeResult = updateCameraShake(cameraShakeRef.current);
      cameraShakeRef.current = shakeResult.shake;

      // Telegraphs
      telegraphsRef.current = updateTelegraphs(telegraphsRef.current, telegraphGroup);

      // Smooth camera position
      if (!cameraInitialized.current && battleRef.current.player) {
        const px = (battleRef.current.player.arena_x - battleRef.current.arena_width / 2) * TILE_SIZE;
        const pz = (battleRef.current.player.arena_y - battleRef.current.arena_height / 2) * TILE_SIZE;
        cameraCurrentX.current = px;
        cameraCurrentZ.current = pz;
        cameraTargetX.current = px;
        cameraTargetZ.current = pz;
        cameraInitialized.current = true;
      }

      if (battleRef.current.player && phase === 'complete') {
        const px = (battleRef.current.player.arena_x - battleRef.current.arena_width / 2) * TILE_SIZE;
        const pz = (battleRef.current.player.arena_y - battleRef.current.arena_height / 2) * TILE_SIZE;
        cameraTargetX.current = px;
        cameraTargetZ.current = pz;
      }

      const camLerpSpeed = 0.1;
      cameraCurrentX.current += (cameraTargetX.current - cameraCurrentX.current) * camLerpSpeed;
      cameraCurrentZ.current += (cameraTargetZ.current - cameraCurrentZ.current) * camLerpSpeed;

      // Update camera
      updateCamera(
        camera,
        battleRef.current,
        phase,
        phaseStart,
        cameraYawRef.current,
        cameraPitchRef.current,
        shakeResult.shakeX,
        shakeResult.shakeY,
        cameraCurrentX.current,
        cameraCurrentZ.current
      );

      renderer.render(scene, camera);
    };

    animate();

    // Window resize handler
    const handleResize = () => {
      if (!containerRef.current) return;
      const w = containerRef.current.clientWidth;
      const h = containerRef.current.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationIdRef.current);
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update entities when battle state changes
  useEffect(() => {
    if (entityGroupRef.current && battle) {
      updateEntities(entityGroupRef.current, battle, true, entityAnimRef.current);
    }
  }, [battle.player?.hp, battle.player?.arena_x, battle.player?.arena_y, battle.enemies]);

  // Update highlights when selected action changes
  useEffect(() => {
    if (highlightGroupRef.current && battle) {
      const isComplete = overviewCompleteRef.current;
      updateHighlights(highlightGroupRef.current, battle, selectedAction, isComplete);
    }
  }, [selectedAction, battle.player?.arena_x, battle.player?.arena_y, battle.enemies, battle]);

  // Process DAMAGE_NUMBER events
  useEffect(() => {
    if (!events || !damageGroupRef.current) return;

    const { arena_width, arena_height } = battle;

    for (const event of events) {
      if (event.type === 'DAMAGE_NUMBER') {
        const x = ((event.data.x as number) - arena_width / 2) * TILE_SIZE;
        const z = ((event.data.y as number) - arena_height / 2) * TILE_SIZE;
        const amount = event.data.amount as number;

        const dmg = createDamageNumber(x, z, amount, damageNumberIdRef.current++);
        damageGroupRef.current.add(dmg.sprite);
        damageNumbersRef.current.push(dmg);
      }

      if (event.type === 'HIT_FLASH') {
        cameraShakeRef.current = startCameraShake(0.1, 0.92);

        if (effectsGroupRef.current) {
          const entityData = event.data.entity as { arena_x?: number; arena_y?: number } | undefined;
          if (entityData?.arena_x !== undefined && entityData?.arena_y !== undefined) {
            const px = (entityData.arena_x - arena_width / 2) * TILE_SIZE;
            const pz = (entityData.arena_y - arena_height / 2) * TILE_SIZE;
            const particle = createHitParticles(px, 1, pz);
            effectsGroupRef.current.add(particle.mesh);
            hitParticlesRef.current.push(particle);
          }
        }
      }

      if (event.type === 'ENEMY_ATTACK' && telegraphGroupRef.current) {
        const toX = event.data.to_x as number;
        const toY = event.data.to_y as number;
        const worldX = (toX - arena_width / 2) * TILE_SIZE;
        const worldZ = (toY - arena_height / 2) * TILE_SIZE;

        const sharedGeo = getSharedGeometries();
        const telegraphMaterial = new THREE.MeshBasicMaterial({
          color: 0xff0000,
          transparent: true,
          opacity: 0.3,
          side: THREE.DoubleSide,
        });

        const telegraph = new THREE.Mesh(sharedGeo.telegraphPlane, telegraphMaterial);
        telegraph.rotation.x = -Math.PI / 2;
        telegraph.position.set(worldX, 0.05, worldZ);
        telegraphGroupRef.current.add(telegraph);

        telegraphsRef.current.push({
          mesh: telegraph,
          startTime: Date.now(),
          duration: 800,
        });
      }
    }
  }, [events, battle.arena_width, battle.arena_height]);

  // Process turn events
  useEffect(() => {
    if (!events) return;

    const turnEvents = events.filter(e =>
      e.type === 'ENEMY_TURN_START' ||
      e.type === 'ENEMY_TURN_END' ||
      e.type === 'PLAYER_TURN_START' ||
      e.type === 'PLAYER_TURN_END'
    );

    if (turnEvents.length > 0) {
      turnQueueRef.current.push(...turnEvents);
      setTurnQueueTrigger(t => t + 1);
    }
  }, [events]);

  // Process turn queue
  useEffect(() => {
    if (processingTurnRef.current || turnQueueRef.current.length === 0) return;

    const processNextTurn = () => {
      const event = turnQueueRef.current[0];
      if (!event) {
        processingTurnRef.current = false;
        return;
      }

      processingTurnRef.current = true;
      turnQueueRef.current = turnQueueRef.current.slice(1);

      if (event.type === 'PLAYER_TURN_START') {
        setTurnPhase('player');
        setCurrentEnemyTurn(null);
        processingTurnRef.current = false;
        setTimeout(processNextTurn, 100);
      } else if (event.type === 'PLAYER_TURN_END') {
        setTurnPhase('enemy');
        processingTurnRef.current = false;
        setTimeout(processNextTurn, 100);
      } else if (event.type === 'ENEMY_TURN_START') {
        setCurrentEnemyTurn({
          enemyId: event.data.enemy_id as string,
          enemyName: event.data.enemy_name as string,
          turnIndex: event.data.turn_index as number,
          totalEnemies: event.data.total_enemies as number,
        });
        processingTurnRef.current = false;
        setTimeout(processNextTurn, 100);
      } else if (event.type === 'ENEMY_TURN_END') {
        setTimeout(() => {
          processingTurnRef.current = false;
          processNextTurn();
        }, 600);
      }
    };

    processNextTurn();
  }, [turnQueueTrigger]);

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

  // Tile coordinate conversion
  const screenToTile = useCallback((clientX: number, clientY: number): TileCoord | null => {
    if (!containerRef.current || !cameraRef.current || !sceneRef.current) return null;

    const rect = containerRef.current.getBoundingClientRect();
    mouseRef.current.x = ((clientX - rect.left) / rect.width) * 2 - 1;
    mouseRef.current.y = -((clientY - rect.top) / rect.height) * 2 + 1;

    raycasterRef.current.setFromCamera(mouseRef.current, cameraRef.current);

    const floorPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
    const intersectPoint = new THREE.Vector3();

    if (raycasterRef.current.ray.intersectPlane(floorPlane, intersectPoint)) {
      const { arena_width, arena_height } = battle;
      const tileX = Math.floor(intersectPoint.x / TILE_SIZE + arena_width / 2);
      const tileY = Math.floor(intersectPoint.z / TILE_SIZE + arena_height / 2);

      if (tileX >= 0 && tileX < arena_width && tileY >= 0 && tileY < arena_height) {
        return { x: tileX, y: tileY };
      }
    }
    return null;
  }, [battle]);

  // Mouse interaction handlers
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleMouseDown = (e: MouseEvent) => {
      if (e.button === 2) {
        isDraggingRef.current = true;
        lastMouseRef.current = { x: e.clientX, y: e.clientY };
      }
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (isDraggingRef.current && overviewCompleteRef.current) {
        const dx = e.clientX - lastMouseRef.current.x;
        const dy = e.clientY - lastMouseRef.current.y;

        cameraYawRef.current += dx * 0.005;
        cameraPitchRef.current = Math.max(-0.5, Math.min(0.5, cameraPitchRef.current - dy * 0.005));

        lastMouseRef.current = { x: e.clientX, y: e.clientY };
      }

      const tile = screenToTile(e.clientX, e.clientY);
      if (hoverHighlightRef.current) {
        if (tile) {
          const worldX = (tile.x - battle.arena_width / 2) * TILE_SIZE;
          const worldZ = (tile.y - battle.arena_height / 2) * TILE_SIZE;
          hoverHighlightRef.current.position.set(worldX, 0.04, worldZ);
          hoverHighlightRef.current.visible = true;
        } else {
          hoverHighlightRef.current.visible = false;
        }
      }
      onTileHover?.(tile);
    };

    const handleMouseUp = () => {
      isDraggingRef.current = false;
    };

    const handleClick = (e: MouseEvent) => {
      if (!overviewCompleteRef.current) {
        skipOverview();
        return;
      }

      const tile = screenToTile(e.clientX, e.clientY);
      if (tile && onTileClick) {
        const hasEnemy = battle.enemies.some(
          enemy => enemy.hp > 0 && enemy.arena_x === tile.x && enemy.arena_y === tile.y
        );
        onTileClick(tile, hasEnemy);
      }
    };

    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
    };

    container.addEventListener('mousedown', handleMouseDown);
    container.addEventListener('mousemove', handleMouseMove);
    container.addEventListener('click', handleClick);
    container.addEventListener('contextmenu', handleContextMenu);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      container.removeEventListener('mousedown', handleMouseDown);
      container.removeEventListener('mousemove', handleMouseMove);
      container.removeEventListener('click', handleClick);
      container.removeEventListener('contextmenu', handleContextMenu);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [battle, selectedAction, screenToTile, onTileClick, onTileHover, skipOverview]);

  return (
    <>
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
      {/* Turn indicator overlay */}
      {overviewCompleteRef.current && (
        <div
          className="turn-indicator"
          style={{
            position: 'absolute',
            top: '20px',
            left: '50%',
            transform: 'translateX(-50%)',
            padding: '8px 24px',
            backgroundColor: turnPhase === 'player' ? 'rgba(68, 68, 255, 0.8)' : 'rgba(255, 68, 68, 0.8)',
            color: 'white',
            fontSize: '18px',
            fontWeight: 'bold',
            fontFamily: 'monospace',
            borderRadius: '4px',
            border: '2px solid rgba(255, 255, 255, 0.6)',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.5)',
            zIndex: 100,
            pointerEvents: 'none',
            transition: 'background-color 0.3s ease',
          }}
        >
          {turnPhase === 'player' ? (
            'YOUR TURN'
          ) : currentEnemyTurn ? (
            `${currentEnemyTurn.enemyName}'s Turn (${currentEnemyTurn.turnIndex + 1}/${currentEnemyTurn.totalEnemies})`
          ) : (
            'ENEMY TURN'
          )}
        </div>
      )}
    </>
  );
}

export default BattleRenderer3D;
