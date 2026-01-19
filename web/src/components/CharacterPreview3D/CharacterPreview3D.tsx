/**
 * CharacterPreview3D - Interactive 3D character preview for character creation
 *
 * Features:
 * - Race-specific body proportions
 * - Class-specific equipment/symbols
 * - Idle animation (gentle bob and sway)
 * - Drag to rotate
 *
 * Uses the shared player model factory from the model registry.
 */

import { useRef, useEffect, useCallback } from 'react';
import * as THREE from 'three';
import type { RaceId, ClassId } from '../../types';
import { createPlayerCharacter } from '../../models';

export interface CharacterPreview3DProps {
  /** Selected race */
  race: RaceId;
  /** Selected class */
  classId: ClassId;
  /** Height of the container */
  height?: number;
}

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
  const animationIdRef = useRef<number>(0);
  const timeRef = useRef<number>(0);
  const rotationRef = useRef<number>(0);
  const isDraggingRef = useRef<boolean>(false);
  const lastMouseXRef = useRef<number>(0);
  const targetRotationRef = useRef<number>(0);

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

  // Initialize renderer once on mount
  useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    const width = container.clientWidth || 300;
    const containerHeight = height;

    // Clear any existing canvases (handles React Strict Mode)
    while (container.firstChild) {
      container.removeChild(container.firstChild);
    }

    // Scene setup
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x0a0a12, 0.08);
    sceneRef.current = scene;

    // Camera
    const camera = new THREE.PerspectiveCamera(50, width / containerHeight, 0.1, 100);
    camera.position.set(0, 1.5, 4);
    camera.lookAt(0, 1, 0);
    cameraRef.current = camera;

    // Renderer
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true,
        powerPreference: 'low-power',
      });
    } catch (e) {
      console.error('Failed to create WebGL context:', e);
      return;
    }

    renderer.setSize(width, containerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x0a0a12, 0.5);
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

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

    // Cleanup only on unmount
    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationIdRef.current);

      if (rendererRef.current) {
        rendererRef.current.dispose();
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
  }, [height]); // Only recreate renderer if height changes

  // Update character when race or class changes (no renderer recreation)
  useEffect(() => {
    if (!sceneRef.current) return;

    const scene = sceneRef.current;

    // Remove old character
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
    }

    // Create new character using shared model factory
    const character = createPlayerCharacter({ race, classId });
    scene.add(character);
    characterRef.current = character;
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

export default CharacterPreview3D;
