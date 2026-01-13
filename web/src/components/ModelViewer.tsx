/**
 * ModelViewer - Simple Three.js GLB/OBJ model viewer
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
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const animationRef = useRef<number>(0);

  useEffect(() => {
    if (!containerRef.current) return;

    // Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(backgroundColor);
    sceneRef.current = scene;

    // Camera
    const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 1000);
    camera.position.set(2, 2, 3);
    cameraRef.current = camera;

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.autoRotate = true;
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

    // Load model
    const loader = new GLTFLoader();
    loader.load(
      modelPath,
      (gltf) => {
        const model = gltf.scene;

        // Ensure materials are visible
        model.traverse((child) => {
          if (child instanceof THREE.Mesh) {
            // Enable vertex colors if present
            if (child.geometry.attributes.color) {
              child.material = new THREE.MeshStandardMaterial({
                vertexColors: true,
                metalness: 0.1,
                roughness: 0.8,
              });
            }
            // Ensure double-sided rendering
            if (child.material) {
              (child.material as THREE.Material).side = THREE.DoubleSide;
            }
          }
        });

        // Center and scale model
        const box = new THREE.Box3().setFromObject(model);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.y, size.z);
        const scale = 2 / maxDim;

        model.scale.setScalar(scale);
        model.position.sub(center.multiplyScalar(scale));

        console.log('Model loaded:', modelPath, 'Scale:', scale);
        scene.add(model);
      },
      (progress) => {
        console.log('Loading progress:', (progress.loaded / progress.total * 100).toFixed(1) + '%');
      },
      (error) => {
        console.error('Error loading model:', error);
      }
    );

    // Animation loop
    const animate = () => {
      animationRef.current = requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    // Cleanup
    return () => {
      cancelAnimationFrame(animationRef.current);
      controls.dispose();
      renderer.dispose();
      if (containerRef.current && renderer.domElement) {
        containerRef.current.removeChild(renderer.domElement);
      }
    };
  }, [modelPath, width, height, backgroundColor]);

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
