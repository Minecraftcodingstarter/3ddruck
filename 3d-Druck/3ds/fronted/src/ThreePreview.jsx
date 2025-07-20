import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

export default function ThreePreview({ modelUrl, onModelLoaded }) {
  const containerRef = useRef();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [viewerHeight, setViewerHeight] = useState(400); // Default height

  // Store refs to dispose properly
  const rendererRef = useRef();
  const controlsRef = useRef();
  const sceneRef = useRef();
  const animationIdRef = useRef();
  const modelObjectRef = useRef(null); // To keep track of the current model in the scene
  const gridHelperRef = useRef(null); // Ref for the grid helper

  useEffect(() => {
    // Clear any previous errors or loading states when modelUrl changes
    setError(null);
    setLoading(false);

    // Cleanup old renderer & canvas if exist
    if (rendererRef.current) {
      console.log("ThreePreview: Cleaning up previous scene.");
      cancelAnimationFrame(animationIdRef.current);
      controlsRef.current?.dispose();
      rendererRef.current.dispose();
      if (containerRef.current && containerRef.current.contains(rendererRef.current.domElement)) {
        containerRef.current.removeChild(rendererRef.current.domElement);
      }
      sceneRef.current = null;
      controlsRef.current = null;
      rendererRef.current = null;
      modelObjectRef.current = null;
      if (gridHelperRef.current) { // Dispose existing grid if present
        gridHelperRef.current.dispose();
        gridHelperRef.current = null;
      }
    }

    const width = containerRef.current.clientWidth;
    const height = viewerHeight;

    // Setup scene, camera, renderer
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000000); // Black background for better model visibility
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
    camera.position.z = 5; // Initial camera position

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    containerRef.current.appendChild(renderer.domElement);
    renderer.domElement.style.borderRadius = '16px';
    renderer.domElement.style.display = 'block';
    rendererRef.current = renderer;

    // Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.25;
    controls.screenSpacePanning = false;
    controls.maxPolarAngle = Math.PI / 2;
    controlsRef.current = controls;

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7); // Soft white light
    scene.add(ambientLight);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
    directionalLight.position.set(0, 10, 5);
    scene.add(directionalLight);
    const pointLight = new THREE.PointLight(0xffffff, 0.3);
    pointLight.position.set(5, 5, 5);
    scene.add(pointLight);

    // Add Grid Helper initially
    const size = 10;
    const divisions = 10;
    const gridHelper = new THREE.GridHelper(size, divisions, 0x444444, 0x888888); // Grey lines
    gridHelper.material.opacity = 0.5;
    gridHelper.material.transparent = true;
    scene.add(gridHelper);
    gridHelperRef.current = gridHelper;


    // Frame object function
    function frameObject(object) {
      const box = new THREE.Box3().setFromObject(object);
      const size = box.getSize(new THREE.Vector3());
      const center = box.getCenter(new THREE.Vector3());

      object.position.sub(center); // Center the object

      const maxDim = Math.max(size.x, size.y, size.z);
      const fov = camera.fov * (Math.PI / 180);
      const cameraZ = (maxDim / 2) / Math.tan(fov / 2) * 1.5; // Adjust camera distance based on object size

      camera.position.set(0, 0, cameraZ);
      camera.near = cameraZ / 100;
      camera.far = cameraZ * 100;
      camera.updateProjectionMatrix();

      controls.target.set(0, 0, 0); // Look at the center of the object
      controls.update();

      // Adjust viewer height based on model dimensions for better fit
      const newCalculatedHeight = size.y * 80 + 200; // Example calculation
      setViewerHeight(Math.max(300, Math.min(newCalculatedHeight, 700))); // Clamp height between 300px and 700px

      // Notify parent component about model dimensions
      if (onModelLoaded) {
        onModelLoaded(size);
      }
    }

    // Load model
    const cleanedUrl = modelUrl.split('?')[0];
    const ext = cleanedUrl.split('.').pop().toLowerCase();
    console.log(`ThreePreview: Attempting to load model from: ${modelUrl} (Type: ${ext})`);

    const onModelLoad = (object) => {
      console.log("ThreePreview: Model loaded successfully.");
      if (modelObjectRef.current) {
        scene.remove(modelObjectRef.current);
        disposeHierarchy(modelObjectRef.current);
      }
      modelObjectRef.current = object;
      scene.add(object);

      // Remove the grid helper when a model is loaded
      if (gridHelperRef.current) {
        scene.remove(gridHelperRef.current);
        gridHelperRef.current.dispose(); // Dispose its resources
        gridHelperRef.current = null;
      }

      frameObject(object);
      setLoading(false); // End loading state
      setError(null); // Clear any previous error
    };

    const onError = (errorEvent) => {
      console.error(`ThreePreview: Error loading ${ext.toUpperCase()}-model:`, errorEvent);
      setError(`Fehler beim Laden des Modells: ${errorEvent.message || 'Unbekannter Fehler'}. Bitte versuchen Sie es erneut oder wählen Sie eine andere Datei.`);
      setLoading(false); // End loading state

      // If there's an error, ensure the grid is visible again if it was removed
      if (!gridHelperRef.current) {
        const size = 10;
        const divisions = 10;
        const newGridHelper = new THREE.GridHelper(size, divisions, 0x444444, 0x888888);
        newGridHelper.material.opacity = 0.5;
        newGridHelper.material.transparent = true;
        scene.add(newGridHelper);
        gridHelperRef.current = newGridHelper;
      }
    };

    if (!modelUrl) {
        // If no modelUrl, just display the grid and placeholder
        setLoading(false);
        setError(null);
        // Ensure the grid is present if no model is loaded
        if (!gridHelperRef.current) {
            const size = 10;
            const divisions = 10;
            const newGridHelper = new THREE.GridHelper(size, divisions, 0x444444, 0x888888);
            newGridHelper.material.opacity = 0.5;
            newGridHelper.material.transparent = true;
            scene.add(newGridHelper);
            gridHelperRef.current = newGridHelper;
        }
        return; // Exit here, no model to load
    }

    setLoading(true); // Start loading state if modelUrl exists

    let loader;
    if (ext === 'obj') {
      loader = new OBJLoader();
      loader.load(modelUrl, onModelLoad, undefined, onError);
    } else if (ext === 'fbx') {
      loader = new FBXLoader();
      loader.load(modelUrl, onModelLoad, undefined, onError);
    } else if (ext === 'glb' || ext === 'gltf') {
      loader = new GLTFLoader();
      loader.load(modelUrl, (gltf) => onModelLoad(gltf.scene), undefined, onError);
    } else {
      setError('Nicht unterstütztes Dateiformat. Bitte laden Sie GLB, GLTF, OBJ oder FBX hoch.');
      setLoading(false);
      console.error(`ThreePreview: Unsupported file format: ${ext}`);
      return;
    }

    // Animation loop
    function animate() {
      animationIdRef.current = requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    }
    animate();

    // Handle window resize
    const handleResize = () => {
      const newWidth = containerRef.current.clientWidth;
      const newHeight = containerRef.current.clientHeight;

      camera.aspect = newWidth / newHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(newWidth, newHeight);
    };

    window.addEventListener('resize', handleResize);

    // Cleanup on unmount or modelUrl change
    return () => {
      console.log("ThreePreview: Running cleanup function.");
      cancelAnimationFrame(animationIdRef.current);
      window.removeEventListener('resize', handleResize);

      if (modelObjectRef.current) {
        scene.remove(modelObjectRef.current);
        disposeHierarchy(modelObjectRef.current);
        modelObjectRef.current = null;
      }
      if (gridHelperRef.current) { // Dispose grid on cleanup
        scene.remove(gridHelperRef.current);
        gridHelperRef.current.dispose();
        gridHelperRef.current = null;
      }

      if (controlsRef.current) controlsRef.current.dispose();
      if (rendererRef.current) rendererRef.current.dispose();

      if (
        containerRef.current &&
        rendererRef.current?.domElement &&
        containerRef.current.contains(rendererRef.current.domElement)
      ) {
        containerRef.current.removeChild(rendererRef.current.domElement);
      }

      sceneRef.current = null;
      controlsRef.current = null;
      rendererRef.current = null;
    };
  }, [modelUrl, viewerHeight, onModelLoaded]);

  // Dispose helper
  function disposeHierarchy(node) {
    node.traverse((child) => {
      if (child.geometry) child.geometry.dispose();
      if (child.material) {
        if (Array.isArray(child.material)) {
          child.material.forEach(cleanMaterial);
        } else {
          cleanMaterial(child.material);
        }
      }
    });
  }

  function cleanMaterial(material) {
    if (!material) return;
    if (typeof material.dispose === 'function') material.dispose();
    for (const key in material) {
      const value = material[key];
      if (value && typeof value === 'object' && typeof value.dispose === 'function') {
        value.dispose();
      }
    }
  }

  return (
    <div
      onClick={(e) => e.stopPropagation()}
      onPointerDown={(e) => e.stopPropagation()}
      onPointerUp={(e) => e.stopPropagation()}
      ref={containerRef}
      style={{
        border: '1px solid #ccc',
        borderRadius: '12px',
        width: '100%',
        height: `${viewerHeight}px`,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#000',
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      {loading && (
        <div style={{ color: 'white', fontSize: '1.2rem', zIndex: 10, position: 'absolute' }}>
          ⏳ Lade 3D-Modell...
        </div>
      )}
      {error && (
        <div style={{ color: '#ff4d4d', fontSize: '1rem', textAlign: 'center', padding: '1rem', zIndex: 10, position: 'absolute' }}>
          {error}
        </div>
      )}
      {!modelUrl && !loading && !error && (
        <div style={{ color: '#aaa', fontSize: '1.2rem', zIndex: 10, position: 'absolute' }}>
          Wählen Sie ein Modell zum Bearbeiten
        </div>
      )}
    </div>
  );
}
