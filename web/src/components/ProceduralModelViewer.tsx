/**
 * ProceduralModelViewer - Three.js viewer for procedural models from MODEL_LIBRARY
 */

import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

interface ProceduralModelViewerProps {
  /** Factory function that creates the Three.js Group */
  createModel: (options?: Record<string, unknown>) => THREE.Group;
  /** Unique identifier for the model (used for change detection) */
  modelId?: string;
  /** Options to pass to the factory */
  modelOptions?: Record<string, unknown>;
  width?: number;
  height?: number;
  backgroundColor?: string;
  /** Auto-rotate the model */
  autoRotate?: boolean;
}

export function ProceduralModelViewer({
  createModel,
  modelId,
  modelOptions = {},
  width = 300,
  height = 300,
  backgroundColor = '#1a1a2e',
  autoRotate = true,
}: ProceduralModelViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const modelRef = useRef<THREE.Group | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const animationIdRef = useRef<number>(0);
  const lastModelIdRef = useRef<string | null>(null);

  // Initialize renderer once
  useEffect(() => {
    if (!containerRef.current) return;
    if (rendererRef.current) return;

    const container = containerRef.current;

    // Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(backgroundColor);
    sceneRef.current = scene;

    // Camera
    const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 1000);
    camera.position.set(2, 2, 2);
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.autoRotate = autoRotate;
    controls.autoRotateSpeed = 2;
    controlsRef.current = controls;

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(5, 10, 7);
    scene.add(directionalLight);

    const backLight = new THREE.DirectionalLight(0xffffff, 0.3);
    backLight.position.set(-5, 5, -5);
    scene.add(backLight);

    // Ground plane for context
    const groundGeometry = new THREE.PlaneGeometry(4, 4);
    const groundMaterial = new THREE.MeshStandardMaterial({
      color: 0x333333,
      roughness: 0.9,
      metalness: 0.1,
    });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.01;
    ground.receiveShadow = true;
    scene.add(ground);

    // Animation loop
    const animate = () => {
      animationIdRef.current = requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    return () => {
      cancelAnimationFrame(animationIdRef.current);
      renderer.dispose();
      container.removeChild(renderer.domElement);
      rendererRef.current = null;
      sceneRef.current = null;
      cameraRef.current = null;
      controlsRef.current = null;
      modelRef.current = null;
      lastModelIdRef.current = null;
    };
  }, [width, height, backgroundColor, autoRotate]);

  // Create/update model when modelId changes
  useEffect(() => {
    const scene = sceneRef.current;
    const camera = cameraRef.current;
    const controls = controlsRef.current;
    if (!scene || !camera || !controls) return;

    // Skip if same model
    const currentId = modelId || 'default';
    if (lastModelIdRef.current === currentId) {
      return;
    }
    lastModelIdRef.current = currentId;

    // Remove previous model if exists
    if (modelRef.current) {
      scene.remove(modelRef.current);
      modelRef.current.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.geometry.dispose();
          if (Array.isArray(child.material)) {
            child.material.forEach((m) => m.dispose());
          } else if (child.material) {
            child.material.dispose();
          }
        }
      });
      modelRef.current = null;
    }

    // Create the model
    try {
      const model = createModel(modelOptions);

      // Center horizontally and place bottom on ground (y=0)
      const box = new THREE.Box3().setFromObject(model);
      const center = box.getCenter(new THREE.Vector3());
      const size = box.getSize(new THREE.Vector3());
      const maxDim = Math.max(size.x, size.y, size.z);

      if (maxDim > 0) {
        const normalizedScale = 1.5 / maxDim;
        model.scale.setScalar(normalizedScale);

        // Position: center X/Z, but place bottom of model at y=0
        const bottomY = box.min.y * normalizedScale;
        model.position.set(
          -center.x * normalizedScale,
          -bottomY,  // This puts the bottom at y=0
          -center.z * normalizedScale
        );
      }

      scene.add(model);
      modelRef.current = model;

      // Set initial camera position - look at model center height
      const modelHeight = size.y * (1.5 / maxDim); // Scaled height
      const distance = Math.max(2, maxDim * 1.5);
      camera.position.set(distance, distance * 0.8, distance);
      controls.target.set(0, modelHeight / 2, 0); // Look at vertical center of model
      controls.update();
    } catch (error) {
      console.error('Error creating procedural model:', error);
    }
  }, [modelId, createModel, modelOptions]);

  return (
    <div
      ref={containerRef}
      style={{
        width,
        height,
        borderRadius: '8px',
        overflow: 'hidden',
      }}
    />
  );
}

export default ProceduralModelViewer;
