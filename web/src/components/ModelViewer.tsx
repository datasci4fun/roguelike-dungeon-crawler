/**
 * ModelViewer - Simple Three.js GLB/OBJ model viewer
 * Fixed for React 18 StrictMode compatibility
 */

import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

interface ModelViewerProps {
  modelPath: string;
  width?: number;
  height?: number;
  backgroundColor?: string;
}

export function ModelViewer({
  modelPath,
  width = 300,
  height = 300,
  backgroundColor = '#1a1a2e',
}: ModelViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const modelRef = useRef<THREE.Group | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const lightsAddedRef = useRef(false);
  const loadIdRef = useRef(0); // Track which load is current

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
    camera.position.set(3, 3, 3);
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
    controls.autoRotate = true;
    controls.autoRotateSpeed = 2;
    controlsRef.current = controls;

    // Lighting (only add once)
    if (!lightsAddedRef.current) {
      const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
      scene.add(ambientLight);

      const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
      directionalLight.position.set(5, 10, 7);
      scene.add(directionalLight);

      const backLight = new THREE.DirectionalLight(0xffffff, 0.3);
      backLight.position.set(-5, 5, -5);
      scene.add(backLight);

      lightsAddedRef.current = true;
    }

    // Animation loop
    const animate = () => {
      requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    return () => {
      // Don't dispose during StrictMode remount
    };
  }, [width, height, backgroundColor]);

  // Load model when modelPath changes
  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;

    // Increment load ID to invalidate any in-flight loads
    const currentLoadId = ++loadIdRef.current;

    // Remove previous model if exists
    if (modelRef.current) {
      scene.remove(modelRef.current);
      modelRef.current.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.geometry.dispose();
          if (child.material instanceof THREE.Material) {
            child.material.dispose();
          }
        }
      });
      modelRef.current = null;
    }

    // Load new model
    const loader = new GLTFLoader();
    loader.load(
      modelPath,
      (gltf) => {
        // Check if this load is still current (not superseded by a newer load)
        if (currentLoadId !== loadIdRef.current) {
          // Dispose the loaded model since we don't need it
          gltf.scene.traverse((child) => {
            if (child instanceof THREE.Mesh) {
              child.geometry.dispose();
              if (child.material instanceof THREE.Material) {
                child.material.dispose();
              }
            }
          });
          return;
        }

        const model = gltf.scene;

        // Apply materials
        model.traverse((child) => {
          if (child instanceof THREE.Mesh) {
            // Enable vertex colors if present
            if (child.geometry.attributes.color) {
              child.material = new THREE.MeshStandardMaterial({
                vertexColors: true,
                metalness: 0.1,
                roughness: 0.8,
                side: THREE.DoubleSide,
              });
            } else if (child.material) {
              // Ensure double-sided rendering
              (child.material as THREE.Material).side = THREE.DoubleSide;
            }
          }
        });

        // Center and scale model
        const box = new THREE.Box3().setFromObject(model);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.y, size.z);

        if (maxDim > 0) {
          const scale = 2 / maxDim;
          model.scale.setScalar(scale);
          model.position.set(-center.x * scale, -center.y * scale, -center.z * scale);
        }

        scene.add(model);
        modelRef.current = model;
      },
      undefined,
      (error) => {
        console.error('Error loading model:', error);
      }
    );
  }, [modelPath]);

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

export default ModelViewer;
