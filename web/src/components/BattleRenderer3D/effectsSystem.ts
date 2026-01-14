/**
 * BattleRenderer3D Effects System
 *
 * Handles visual effects: damage numbers, particles, camera shake, telegraphs.
 */
import * as THREE from 'three';
import type { DamageNumber, CameraShake, HitParticle, AttackTelegraph } from './types';

// v6.5.1 Performance: Damage number canvas pool for reuse
const DAMAGE_CANVAS_POOL_SIZE = 10;
const damageCanvasPool: HTMLCanvasElement[] = [];

export function getDamageCanvas(): HTMLCanvasElement {
  if (damageCanvasPool.length > 0) {
    return damageCanvasPool.pop()!;
  }
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 64;
  return canvas;
}

export function returnDamageCanvas(canvas: HTMLCanvasElement): void {
  if (damageCanvasPool.length < DAMAGE_CANVAS_POOL_SIZE) {
    // Clear the canvas before returning to pool
    const ctx = canvas.getContext('2d');
    if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
    damageCanvasPool.push(canvas);
  }
}

/**
 * Create a floating damage number sprite
 */
export function createDamageNumber(
  x: number,
  z: number,
  amount: number,
  id: number
): DamageNumber {
  const canvas = getDamageCanvas();
  const ctx = canvas.getContext('2d')!;

  // Clear and draw damage number
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Outline
  ctx.font = 'bold 48px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.strokeStyle = '#000000';
  ctx.lineWidth = 6;
  ctx.strokeText(`${amount}`, 64, 32);

  // Fill (red for damage)
  ctx.fillStyle = '#ff4444';
  ctx.fillText(`${amount}`, 64, 32);

  const texture = new THREE.CanvasTexture(canvas);
  const material = new THREE.SpriteMaterial({
    map: texture,
    transparent: true,
    depthTest: false,
  });

  const sprite = new THREE.Sprite(material);
  sprite.scale.set(1.5, 0.75, 1);
  sprite.position.set(x, 1.5, z);

  return {
    id,
    x,
    z,
    amount,
    createdAt: Date.now(),
    sprite,
    canvas,
  };
}

/**
 * Create hit particle effect
 */
export function createHitParticles(
  x: number,
  y: number,
  z: number
): HitParticle {
  const particleCount = 15;
  const positions = new Float32Array(particleCount * 3);
  const velocities: THREE.Vector3[] = [];

  for (let i = 0; i < particleCount; i++) {
    positions[i * 3] = x;
    positions[i * 3 + 1] = y;
    positions[i * 3 + 2] = z;

    velocities.push(new THREE.Vector3(
      (Math.random() - 0.5) * 2,
      Math.random() * 2,
      (Math.random() - 0.5) * 2
    ));
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

  const material = new THREE.PointsMaterial({
    color: 0xff4444,
    size: 0.1,
    transparent: true,
    opacity: 1,
  });

  const points = new THREE.Points(geometry, material);
  (points.userData as { velocities: THREE.Vector3[] }).velocities = velocities;

  return {
    mesh: points,
    startTime: Date.now(),
    duration: 500,
  };
}

/**
 * Update hit particles animation
 */
export function updateHitParticles(
  particles: HitParticle[],
  effectsGroup: THREE.Group
): HitParticle[] {
  const now = Date.now();
  const activeParticles: HitParticle[] = [];

  for (const particle of particles) {
    const elapsed = now - particle.startTime;
    if (elapsed < particle.duration) {
      // Update particle positions based on velocities
      const positions = particle.mesh.geometry.attributes.position;
      const velocities = (particle.mesh.userData as { velocities: THREE.Vector3[] }).velocities;

      for (let i = 0; i < positions.count; i++) {
        positions.setX(i, positions.getX(i) + velocities[i].x * 0.016);
        positions.setY(i, positions.getY(i) + velocities[i].y * 0.016);
        positions.setZ(i, positions.getZ(i) + velocities[i].z * 0.016);
        velocities[i].y -= 0.1; // Gravity
      }
      positions.needsUpdate = true;

      // Fade out
      const progress = elapsed / particle.duration;
      (particle.mesh.material as THREE.PointsMaterial).opacity = 1 - progress;

      activeParticles.push(particle);
    } else {
      // Remove expired particle
      effectsGroup.remove(particle.mesh);
      particle.mesh.geometry.dispose();
      (particle.mesh.material as THREE.Material).dispose();
    }
  }

  return activeParticles;
}

/**
 * Start camera shake effect
 */
export function startCameraShake(intensity: number = 0.15, decay: number = 0.9): CameraShake {
  return {
    intensity,
    decay,
    startTime: Date.now(),
  };
}

/**
 * Update camera shake and return current offset
 */
export function updateCameraShake(shake: CameraShake | null): { shakeX: number; shakeY: number; shake: CameraShake | null } {
  if (!shake) {
    return { shakeX: 0, shakeY: 0, shake: null };
  }

  const elapsed = Date.now() - shake.startTime;
  const currentIntensity = shake.intensity * Math.pow(shake.decay, elapsed / 16);

  if (currentIntensity < 0.001) {
    return { shakeX: 0, shakeY: 0, shake: null };
  }

  const shakeX = (Math.random() - 0.5) * currentIntensity;
  const shakeY = (Math.random() - 0.5) * currentIntensity;

  return { shakeX, shakeY, shake };
}

/**
 * Update attack telegraphs
 */
export function updateTelegraphs(
  telegraphs: AttackTelegraph[],
  telegraphGroup: THREE.Group
): AttackTelegraph[] {
  const now = Date.now();
  const activeTelegraphs: AttackTelegraph[] = [];

  for (const telegraph of telegraphs) {
    const elapsed = now - telegraph.startTime;
    if (elapsed < telegraph.duration) {
      // Pulse opacity
      const pulse = 0.3 + Math.sin(elapsed * 0.01) * 0.2;
      (telegraph.mesh.material as THREE.MeshBasicMaterial).opacity = pulse;
      activeTelegraphs.push(telegraph);
    } else {
      // Remove expired telegraph
      telegraphGroup.remove(telegraph.mesh);
      (telegraph.mesh.material as THREE.Material).dispose();
    }
  }

  return activeTelegraphs;
}
