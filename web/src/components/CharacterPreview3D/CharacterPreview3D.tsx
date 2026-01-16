/**
 * CharacterPreview3D - Interactive 3D character preview for character creation
 *
 * Features:
 * - Race-specific body proportions
 * - Class-specific equipment/symbols
 * - Idle animation (gentle bob and sway)
 * - Drag to rotate
 */

import { useRef, useEffect, useCallback } from 'react';
import * as THREE from 'three';
import type { RaceId, ClassId } from '../../types';

export interface CharacterPreview3DProps {
  /** Selected race */
  race: RaceId;
  /** Selected class */
  classId: ClassId;
  /** Height of the container */
  height?: number;
}

// Race body configurations
const RACE_CONFIG: Record<RaceId, {
  height: number;
  width: number;
  headSize: number;
  skinColor: number;
  eyeColor: number;
}> = {
  HUMAN: {
    height: 1.8,
    width: 0.5,
    headSize: 0.35,
    skinColor: 0xd4a574,
    eyeColor: 0x4488cc,
  },
  ELF: {
    height: 2.0,
    width: 0.4,
    headSize: 0.32,
    skinColor: 0xe8d4b8,
    eyeColor: 0x88dd88,
  },
  DWARF: {
    height: 1.3,
    width: 0.65,
    headSize: 0.4,
    skinColor: 0xc9a87c,
    eyeColor: 0x8866aa,
  },
  HALFLING: {
    height: 1.0,
    width: 0.35,
    headSize: 0.35,
    skinColor: 0xdec4a4,
    eyeColor: 0x886633,
  },
  ORC: {
    height: 2.1,
    width: 0.7,
    headSize: 0.42,
    skinColor: 0x5a8a5a,
    eyeColor: 0xcc4444,
  },
};

// Class equipment/color configurations
const CLASS_CONFIG: Record<ClassId, {
  primaryColor: number;
  secondaryColor: number;
  glowColor: number;
  equipment: 'sword_shield' | 'staff' | 'daggers' | 'holy';
}> = {
  WARRIOR: {
    primaryColor: 0x8b4513,
    secondaryColor: 0x696969,
    glowColor: 0xffaa44,
    equipment: 'sword_shield',
  },
  MAGE: {
    primaryColor: 0x4a2a7a,
    secondaryColor: 0x8844cc,
    glowColor: 0xaa66ff,
    equipment: 'staff',
  },
  ROGUE: {
    primaryColor: 0x2a2a2a,
    secondaryColor: 0x444444,
    glowColor: 0x44aa44,
    equipment: 'daggers',
  },
  CLERIC: {
    primaryColor: 0xffd700,
    secondaryColor: 0xf5f5dc,
    glowColor: 0xffffaa,
    equipment: 'holy',
  },
};

export function CharacterPreview3D({
  race,
  classId,
  height = 300,
}: CharacterPreview3DProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const characterRef = useRef<THREE.Group | null>(null);
  const groundRef = useRef<THREE.Mesh | null>(null);
  const animationIdRef = useRef<number>(0);
  const timeRef = useRef<number>(0);
  const rotationRef = useRef<number>(0);
  const isDraggingRef = useRef<boolean>(false);
  const lastMouseXRef = useRef<number>(0);
  const targetRotationRef = useRef<number>(0);
  const initializedRef = useRef<boolean>(false);
  const webglErrorRef = useRef<boolean>(false);

  // Handle mouse drag for rotation
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    isDraggingRef.current = true;
    lastMouseXRef.current = e.clientX;
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDraggingRef.current) return;
    const deltaX = e.clientX - lastMouseXRef.current;
    targetRotationRef.current += deltaX * 0.01;
    lastMouseXRef.current = e.clientX;
  }, []);

  const handleMouseUp = useCallback(() => {
    isDraggingRef.current = false;
  }, []);

  // Touch support
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    isDraggingRef.current = true;
    lastMouseXRef.current = e.touches[0].clientX;
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isDraggingRef.current) return;
    const deltaX = e.touches[0].clientX - lastMouseXRef.current;
    targetRotationRef.current += deltaX * 0.01;
    lastMouseXRef.current = e.touches[0].clientX;
  }, []);

  const handleTouchEnd = useCallback(() => {
    isDraggingRef.current = false;
  }, []);

  // Initialize WebGL renderer once on mount
  useEffect(() => {
    if (!containerRef.current || initializedRef.current || webglErrorRef.current) return;

    const container = containerRef.current;
    const width = container.clientWidth || 300;
    const containerHeight = height;

    // Scene setup
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x0a0a12, 0.08);
    sceneRef.current = scene;

    // Camera
    const camera = new THREE.PerspectiveCamera(50, width / containerHeight, 0.1, 100);
    camera.position.set(0, 1.5, 4);
    camera.lookAt(0, 1, 0);
    cameraRef.current = camera;

    // Renderer - wrap in try-catch for WebGL context errors
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true,
        powerPreference: 'low-power', // Reduce GPU load
      });
    } catch (e) {
      console.error('Failed to create WebGL context:', e);
      webglErrorRef.current = true;
      return;
    }

    renderer.setSize(width, containerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x0a0a12, 0.5);
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Handle WebGL context loss
    renderer.domElement.addEventListener('webglcontextlost', (e) => {
      e.preventDefault();
      console.warn('WebGL context lost');
      cancelAnimationFrame(animationIdRef.current);
    });

    renderer.domElement.addEventListener('webglcontextrestored', () => {
      console.log('WebGL context restored');
      animate();
    });

    // Lights
    const ambient = new THREE.AmbientLight(0x333344, 0.5);
    scene.add(ambient);

    const mainLight = new THREE.DirectionalLight(0xffffff, 0.8);
    mainLight.position.set(2, 4, 3);
    scene.add(mainLight);

    // Ground plane
    const groundGeom = new THREE.CircleGeometry(2, 32);
    const groundMat = new THREE.MeshStandardMaterial({
      color: 0x222233,
      roughness: 0.9,
    });
    const ground = new THREE.Mesh(groundGeom, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = 0;
    scene.add(ground);
    groundRef.current = ground;

    initializedRef.current = true;

    // Animation loop
    let lastTime = performance.now();

    function animate() {
      const currentTime = performance.now();
      const delta = (currentTime - lastTime) / 1000;
      lastTime = currentTime;
      timeRef.current += delta;
      const t = timeRef.current;

      // Smooth rotation toward target
      rotationRef.current += (targetRotationRef.current - rotationRef.current) * 0.1;

      if (characterRef.current) {
        // Apply rotation
        characterRef.current.rotation.y = rotationRef.current;

        // Idle bob animation
        characterRef.current.position.y = Math.sin(t * 2) * 0.03;

        // Slight sway
        characterRef.current.rotation.z = Math.sin(t * 1.5) * 0.02;
      }

      if (rendererRef.current && sceneRef.current && cameraRef.current) {
        rendererRef.current.render(sceneRef.current, cameraRef.current);
      }

      animationIdRef.current = requestAnimationFrame(animate);
    }

    animate();

    // Handle resize
    function handleResize() {
      if (!containerRef.current || !cameraRef.current || !rendererRef.current) return;
      const w = containerRef.current.clientWidth;
      cameraRef.current.aspect = w / containerHeight;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(w, containerHeight);
    }

    window.addEventListener('resize', handleResize);

    // Cleanup on unmount only
    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationIdRef.current);
      initializedRef.current = false;

      if (rendererRef.current) {
        rendererRef.current.dispose();
        if (containerRef.current && rendererRef.current.domElement.parentNode) {
          containerRef.current.removeChild(rendererRef.current.domElement);
        }
        rendererRef.current = null;
      }

      if (sceneRef.current) {
        sceneRef.current.traverse((obj) => {
          if (obj instanceof THREE.Mesh) {
            obj.geometry.dispose();
            if (Array.isArray(obj.material)) {
              obj.material.forEach((m) => m.dispose());
            } else {
              obj.material.dispose();
            }
          }
        });
        sceneRef.current = null;
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [height]); // Only reinitialize if height changes

  // Update character when race or class changes (without recreating renderer)
  useEffect(() => {
    // Wait for scene to be initialized by the first effect
    if (!sceneRef.current || !initializedRef.current) {
      // If not ready yet, try again after a short delay
      const timer = setTimeout(() => {
        if (sceneRef.current && initializedRef.current) {
          updateCharacter();
        }
      }, 100);
      return () => clearTimeout(timer);
    }

    updateCharacter();

    function updateCharacter() {
      const scene = sceneRef.current;
      if (!scene) return;

      // Remove old character if it exists
      if (characterRef.current) {
        scene.remove(characterRef.current);
        characterRef.current.traverse((obj) => {
          if (obj instanceof THREE.Mesh) {
            obj.geometry.dispose();
            if (Array.isArray(obj.material)) {
              obj.material.forEach((m) => m.dispose());
            } else {
              obj.material.dispose();
            }
          }
        });
        characterRef.current = null;
      }

      // Create new character with current race and class
      const character = createCharacter(race, classId);
      scene.add(character);
      characterRef.current = character;
    }
  }, [race, classId]);

  return (
    <div
      ref={containerRef}
      style={{
        width: '100%',
        height: `${height}px`,
        position: 'relative',
        cursor: 'grab',
        borderRadius: '8px',
        overflow: 'hidden',
      }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    />
  );
}

/**
 * Create a character mesh based on race and class
 */
function createCharacter(race: RaceId, classId: ClassId): THREE.Group {
  const raceConfig = RACE_CONFIG[race];
  const classConfig = CLASS_CONFIG[classId];

  const group = new THREE.Group();

  // Body materials
  const skinMat = new THREE.MeshStandardMaterial({
    color: raceConfig.skinColor,
    roughness: 0.7,
  });

  const clothMat = new THREE.MeshStandardMaterial({
    color: classConfig.primaryColor,
    roughness: 0.6,
  });

  const accentMat = new THREE.MeshStandardMaterial({
    color: classConfig.secondaryColor,
    roughness: 0.5,
    metalness: 0.3,
  });

  // Torso
  const torsoHeight = raceConfig.height * 0.4;
  const torsoGeom = new THREE.BoxGeometry(
    raceConfig.width,
    torsoHeight,
    raceConfig.width * 0.6
  );
  const torso = new THREE.Mesh(torsoGeom, clothMat);
  torso.position.y = raceConfig.height * 0.5;
  group.add(torso);

  // Head
  const headGeom = new THREE.SphereGeometry(raceConfig.headSize, 16, 12);
  const head = new THREE.Mesh(headGeom, skinMat);
  head.position.y = raceConfig.height * 0.75 + raceConfig.headSize;
  group.add(head);

  // Eyes
  const eyeGeom = new THREE.SphereGeometry(raceConfig.headSize * 0.15, 8, 8);
  const eyeMat = new THREE.MeshBasicMaterial({ color: raceConfig.eyeColor });

  const leftEye = new THREE.Mesh(eyeGeom, eyeMat);
  leftEye.position.set(
    -raceConfig.headSize * 0.3,
    raceConfig.height * 0.75 + raceConfig.headSize * 1.1,
    raceConfig.headSize * 0.7
  );
  group.add(leftEye);

  const rightEye = new THREE.Mesh(eyeGeom, eyeMat);
  rightEye.position.set(
    raceConfig.headSize * 0.3,
    raceConfig.height * 0.75 + raceConfig.headSize * 1.1,
    raceConfig.headSize * 0.7
  );
  group.add(rightEye);

  // Arms
  const armGeom = new THREE.CylinderGeometry(
    raceConfig.width * 0.15,
    raceConfig.width * 0.12,
    raceConfig.height * 0.35
  );

  const leftArm = new THREE.Mesh(armGeom, skinMat);
  leftArm.position.set(
    -raceConfig.width * 0.6,
    raceConfig.height * 0.5,
    0
  );
  leftArm.rotation.z = 0.2;
  group.add(leftArm);

  const rightArm = new THREE.Mesh(armGeom, skinMat);
  rightArm.position.set(
    raceConfig.width * 0.6,
    raceConfig.height * 0.5,
    0
  );
  rightArm.rotation.z = -0.2;
  group.add(rightArm);

  // Legs
  const legGeom = new THREE.CylinderGeometry(
    raceConfig.width * 0.18,
    raceConfig.width * 0.15,
    raceConfig.height * 0.35
  );

  const leftLeg = new THREE.Mesh(legGeom, clothMat);
  leftLeg.position.set(
    -raceConfig.width * 0.25,
    raceConfig.height * 0.17,
    0
  );
  group.add(leftLeg);

  const rightLeg = new THREE.Mesh(legGeom, clothMat);
  rightLeg.position.set(
    raceConfig.width * 0.25,
    raceConfig.height * 0.17,
    0
  );
  group.add(rightLeg);

  // Race-specific features
  if (race === 'ELF') {
    // Pointed ears
    const earGeom = new THREE.ConeGeometry(0.08, 0.2, 4);
    const leftEar = new THREE.Mesh(earGeom, skinMat);
    leftEar.position.set(
      -raceConfig.headSize * 0.9,
      raceConfig.height * 0.75 + raceConfig.headSize,
      0
    );
    leftEar.rotation.z = Math.PI / 4;
    group.add(leftEar);

    const rightEar = new THREE.Mesh(earGeom, skinMat);
    rightEar.position.set(
      raceConfig.headSize * 0.9,
      raceConfig.height * 0.75 + raceConfig.headSize,
      0
    );
    rightEar.rotation.z = -Math.PI / 4;
    group.add(rightEar);
  }

  if (race === 'ORC') {
    // Tusks
    const tuskGeom = new THREE.ConeGeometry(0.04, 0.15, 4);
    const tuskMat = new THREE.MeshStandardMaterial({ color: 0xeeeedd });

    const leftTusk = new THREE.Mesh(tuskGeom, tuskMat);
    leftTusk.position.set(
      -raceConfig.headSize * 0.4,
      raceConfig.height * 0.75 + raceConfig.headSize * 0.5,
      raceConfig.headSize * 0.7
    );
    leftTusk.rotation.x = Math.PI;
    group.add(leftTusk);

    const rightTusk = new THREE.Mesh(tuskGeom, tuskMat);
    rightTusk.position.set(
      raceConfig.headSize * 0.4,
      raceConfig.height * 0.75 + raceConfig.headSize * 0.5,
      raceConfig.headSize * 0.7
    );
    rightTusk.rotation.x = Math.PI;
    group.add(rightTusk);
  }

  if (race === 'DWARF') {
    // Beard
    const beardGeom = new THREE.BoxGeometry(0.3, 0.25, 0.15);
    const beardMat = new THREE.MeshStandardMaterial({ color: 0x8b4513 });
    const beard = new THREE.Mesh(beardGeom, beardMat);
    beard.position.set(
      0,
      raceConfig.height * 0.75 + raceConfig.headSize * 0.3,
      raceConfig.headSize * 0.6
    );
    group.add(beard);
  }

  // Class equipment
  addClassEquipment(group, raceConfig.height, classConfig, accentMat);

  // Glow effect (aura)
  const auraGeom = new THREE.RingGeometry(0.6, 0.8, 32);
  const auraMat = new THREE.MeshBasicMaterial({
    color: classConfig.glowColor,
    transparent: true,
    opacity: 0.3,
    side: THREE.DoubleSide,
  });
  const aura = new THREE.Mesh(auraGeom, auraMat);
  aura.rotation.x = -Math.PI / 2;
  aura.position.y = 0.01;
  group.add(aura);

  return group;
}

/**
 * Add class-specific equipment to character
 */
function addClassEquipment(
  group: THREE.Group,
  characterHeight: number,
  classConfig: typeof CLASS_CONFIG[ClassId],
  accentMat: THREE.MeshStandardMaterial
) {
  const metalMat = new THREE.MeshStandardMaterial({
    color: 0x888888,
    roughness: 0.3,
    metalness: 0.8,
  });

  const woodMat = new THREE.MeshStandardMaterial({
    color: 0x8b4513,
    roughness: 0.8,
  });

  const glowMat = new THREE.MeshBasicMaterial({
    color: classConfig.glowColor,
    transparent: true,
    opacity: 0.8,
  });

  switch (classConfig.equipment) {
    case 'sword_shield': {
      // Sword
      const bladeGeom = new THREE.BoxGeometry(0.06, 0.6, 0.02);
      const blade = new THREE.Mesh(bladeGeom, metalMat);
      blade.position.set(0.7, characterHeight * 0.45, 0);
      blade.rotation.z = -0.3;
      group.add(blade);

      const hiltGeom = new THREE.BoxGeometry(0.2, 0.06, 0.04);
      const hilt = new THREE.Mesh(hiltGeom, woodMat);
      hilt.position.set(0.6, characterHeight * 0.35, 0);
      hilt.rotation.z = -0.3;
      group.add(hilt);

      // Shield
      const shieldGeom = new THREE.CircleGeometry(0.25, 6);
      const shield = new THREE.Mesh(shieldGeom, accentMat);
      shield.position.set(-0.55, characterHeight * 0.5, 0.15);
      shield.rotation.y = 0.3;
      group.add(shield);
      break;
    }

    case 'staff': {
      // Staff
      const staffGeom = new THREE.CylinderGeometry(0.03, 0.04, 1.5, 8);
      const staff = new THREE.Mesh(staffGeom, woodMat);
      staff.position.set(0.5, characterHeight * 0.55, 0);
      staff.rotation.z = -0.15;
      group.add(staff);

      // Orb at top
      const orbGeom = new THREE.SphereGeometry(0.1, 16, 12);
      const orb = new THREE.Mesh(orbGeom, glowMat);
      orb.position.set(0.4, characterHeight * 0.55 + 0.8, 0);
      group.add(orb);
      break;
    }

    case 'daggers': {
      // Left dagger
      const daggerGeom = new THREE.ConeGeometry(0.03, 0.3, 4);
      const dagger1 = new THREE.Mesh(daggerGeom, metalMat);
      dagger1.position.set(0.5, characterHeight * 0.4, 0.1);
      dagger1.rotation.z = -0.5;
      group.add(dagger1);

      // Right dagger
      const dagger2 = new THREE.Mesh(daggerGeom, metalMat);
      dagger2.position.set(-0.5, characterHeight * 0.4, 0.1);
      dagger2.rotation.z = 0.5;
      group.add(dagger2);

      // Hood/cloak
      const hoodGeom = new THREE.ConeGeometry(0.22, 0.25, 8);
      const hoodMat = new THREE.MeshStandardMaterial({ color: 0x222222 });
      const hood = new THREE.Mesh(hoodGeom, hoodMat);
      hood.position.set(0, characterHeight * 0.85, -0.05);
      group.add(hood);
      break;
    }

    case 'holy': {
      // Holy symbol (floating above)
      const crossVGeom = new THREE.BoxGeometry(0.05, 0.25, 0.02);
      const crossHGeom = new THREE.BoxGeometry(0.15, 0.05, 0.02);
      const crossV = new THREE.Mesh(crossVGeom, glowMat);
      const crossH = new THREE.Mesh(crossHGeom, glowMat);
      crossV.position.set(0, characterHeight + 0.3, 0.3);
      crossH.position.set(0, characterHeight + 0.35, 0.3);
      group.add(crossV);
      group.add(crossH);

      // Halo
      const haloGeom = new THREE.TorusGeometry(0.2, 0.02, 8, 32);
      const halo = new THREE.Mesh(haloGeom, glowMat);
      halo.position.set(0, characterHeight * 0.9 + 0.3, 0);
      halo.rotation.x = Math.PI / 2;
      group.add(halo);
      break;
    }
  }
}

export default CharacterPreview3D;
