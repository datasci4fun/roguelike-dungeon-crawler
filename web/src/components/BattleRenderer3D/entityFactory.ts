/**
 * BattleRenderer3D Entity Factory
 *
 * Creates entity sprites, 3D models, and HP bars.
 */
import * as THREE from 'three';
import type { BattleEntity } from '../../types';
import { getModelPathForEnemy } from '../../utils/enemyModels';
import { ENTITY_MODEL_SCALE, ENTITY_MODEL_Y_OFFSET } from './constants';
import { modelCache } from './modelLoader';

/**
 * Create name label sprite for entity
 * Shows the display_id (e.g., "Goblin_01") above the entity
 */
export function createNameLabel(entity: BattleEntity, isPlayer: boolean): THREE.Sprite {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 48;
  const ctx = canvas.getContext('2d')!;

  // Get icon based on entity type (matching turn order panel)
  let icon = '👹'; // Default enemy
  if (isPlayer) {
    icon = '⚔';
  } else if (entity.is_boss) {
    icon = '👑';
  } else if (entity.is_elite) {
    icon = '★';
  }

  // Get display text - use display_id if available, otherwise name
  const name = isPlayer ? 'HERO' : (entity.display_id || entity.name || 'Enemy');
  const displayText = `${icon} ${name}`;

  // Determine color based on entity type
  let textColor = '#ff6b6b'; // Default enemy red
  if (isPlayer) {
    textColor = '#4ade80'; // Player green
  } else if (entity.is_boss) {
    textColor = '#ffd700'; // Boss gold
  } else if (entity.is_elite) {
    textColor = '#a855f7'; // Elite purple
  }

  // Draw text with outline for visibility
  ctx.font = 'bold 28px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  // Black outline
  ctx.strokeStyle = '#000000';
  ctx.lineWidth = 4;
  ctx.strokeText(displayText, 128, 24);

  // Colored fill
  ctx.fillStyle = textColor;
  ctx.fillText(displayText, 128, 24);

  const texture = new THREE.CanvasTexture(canvas);
  const material = new THREE.SpriteMaterial({
    map: texture,
    transparent: true,
    depthTest: false,
  });

  const sprite = new THREE.Sprite(material);
  sprite.scale.set(2.0, 0.4, 1);
  sprite.name = 'nameLabel';
  return sprite;
}

/**
 * Create HP bar sprite for entity
 */
export function createHpBar(entity: BattleEntity): THREE.Sprite {
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
  hpSprite.name = 'hpBar';
  return hpSprite;
}

/**
 * Create a sprite with HP bar for entity (fallback when no 3D model)
 */
export function createEntitySprite(
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
  sprite.name = 'entitySprite';
  group.add(sprite);

  // HP bar
  const hpSprite = createHpBar(entity);
  hpSprite.position.y = 1.6;
  group.add(hpSprite);

  // Name label above HP bar
  const nameLabel = createNameLabel(entity, isPlayer);
  nameLabel.position.y = 1.95;
  group.add(nameLabel);

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

  // v6.9: Add active turn highlight ring for enemies (sprite version)
  if (!isPlayer) {
    const turnGlowGeometry = new THREE.RingGeometry(0.7, 0.9, 32);
    const turnGlowMaterial = new THREE.MeshBasicMaterial({
      color: 0xffff00, // Bright yellow
      transparent: true,
      opacity: 0.8,
      side: THREE.DoubleSide,
    });
    const turnGlow = new THREE.Mesh(turnGlowGeometry, turnGlowMaterial);
    turnGlow.rotation.x = -Math.PI / 2;
    turnGlow.position.y = 0.01;
    turnGlow.name = 'activeTurnGlow';
    turnGlow.visible = false; // Hidden until this enemy's turn
    group.add(turnGlow);
  }

  return group;
}

/**
 * Create entity with 3D model (or fallback to sprite)
 * Checks cache for pre-loaded model, uses sprite if not available
 */
export function createEntity3D(
  entity: BattleEntity,
  isPlayer: boolean
): THREE.Group {
  const group = new THREE.Group();

  // Debug logging
  console.log('[BattleRenderer3D] createEntity3D:', {
    entityId: entity.entity_id,
    name: entity.name,
    isPlayer,
    hp: entity.hp
  });

  // For player, always use sprite (first-person perspective)
  if (isPlayer) {
    return createEntitySprite(entity, true);
  }

  // Check if we have a cached model for this enemy
  const modelPath = entity.name ? getModelPathForEnemy(entity.name) : null;
  const cachedModel = modelPath ? modelCache.get(modelPath) : null;

  console.log('[BattleRenderer3D] model lookup:', {
    entityName: entity.name,
    modelPath,
    hasCachedModel: !!cachedModel,
    cacheSize: modelCache.size
  });

  if (cachedModel) {
    // Use 3D model
    const model = cachedModel.clone();
    model.name = 'entityModel';

    // Apply scale and position offset
    model.scale.setScalar(ENTITY_MODEL_SCALE);
    model.position.y = ENTITY_MODEL_Y_OFFSET;

    // Add a wrapper group so we can position the model correctly
    const modelWrapper = new THREE.Group();
    modelWrapper.add(model);
    group.add(modelWrapper);

    // Add subtle idle animation rotation
    modelWrapper.userData.idleRotation = true;

    console.log('[BattleRenderer3D] 3D model added with scale:', ENTITY_MODEL_SCALE, 'y-offset:', ENTITY_MODEL_Y_OFFSET);
  } else {
    // Fall back to sprite
    console.log('[BattleRenderer3D] Using sprite fallback for:', entity.name);
    const spriteGroup = createEntitySprite(entity, false);
    console.log('[BattleRenderer3D] Sprite group created with', spriteGroup.children.length, 'children');
    // Move children from sprite group to this group
    while (spriteGroup.children.length > 0) {
      const child = spriteGroup.children[0];
      spriteGroup.remove(child);
      group.add(child);
    }
    console.log('[BattleRenderer3D] Entity group now has', group.children.length, 'children');
    return group;
  }

  // Add HP bar above 3D model
  const hpSprite = createHpBar(entity);
  hpSprite.position.y = ENTITY_MODEL_SCALE + 0.1; // Above model
  group.add(hpSprite);

  // Add name label above HP bar
  const nameLabel = createNameLabel(entity, false);
  nameLabel.position.y = ENTITY_MODEL_SCALE + 0.45; // Above HP bar
  group.add(nameLabel);

  // Add boss ring for boss enemies
  if (entity.is_boss) {
    const ringGeometry = new THREE.RingGeometry(0.6, 0.75, 32);
    const ringMaterial = new THREE.MeshBasicMaterial({
      color: 0xaa00aa,
      transparent: true,
      opacity: 0.6,
      side: THREE.DoubleSide,
    });
    const ring = new THREE.Mesh(ringGeometry, ringMaterial);
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = 0.02;
    ring.name = 'bossRing';
    group.add(ring);
  }

  // Add elite glow for elite enemies
  if (entity.is_elite && !entity.is_boss) {
    const glowGeometry = new THREE.RingGeometry(0.5, 0.65, 32);
    const glowMaterial = new THREE.MeshBasicMaterial({
      color: 0xff8800,
      transparent: true,
      opacity: 0.5,
      side: THREE.DoubleSide,
    });
    const glow = new THREE.Mesh(glowGeometry, glowMaterial);
    glow.rotation.x = -Math.PI / 2;
    glow.position.y = 0.02;
    glow.name = 'eliteGlow';
    group.add(glow);
  }

  // v6.9: Add active turn highlight ring (hidden by default, shown during enemy's turn)
  const turnGlowGeometry = new THREE.RingGeometry(0.7, 0.9, 32);
  const turnGlowMaterial = new THREE.MeshBasicMaterial({
    color: 0xffff00, // Bright yellow
    transparent: true,
    opacity: 0.8,
    side: THREE.DoubleSide,
  });
  const turnGlow = new THREE.Mesh(turnGlowGeometry, turnGlowMaterial);
  turnGlow.rotation.x = -Math.PI / 2;
  turnGlow.position.y = 0.01;
  turnGlow.name = 'activeTurnGlow';
  turnGlow.visible = false; // Hidden until this enemy's turn
  group.add(turnGlow);

  return group;
}
