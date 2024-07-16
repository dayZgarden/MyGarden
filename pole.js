import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { Raycaster, Vector2, Plane } from "three";

async function main() {
  // Three.js & Cannon.js
  const textureLoader = new THREE.TextureLoader();
  const clock = new THREE.Clock();

  // Scene
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x000009);

  // Camera
  const camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );
  camera.position.set(0, 0, 20);

  // Renderer
  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);

  // Controls
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableZoom = false;
  controls.enablePan = false;
  controls.enableRotate = false;

  // Ambient Light
  const ambientLight = new THREE.AmbientLight(0xffffff, 1.5);
  ambientLight.position.set(10, 10, -10);
  scene.add(ambientLight);

  // Resize handler
  const onWindowResize = () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  };

// Create Pole
const createPole = () => {
  const poleGeometry = new THREE.CylinderGeometry(1, 1, 20, 32);
  const poleMaterial = new THREE.MeshStandardMaterial({ color: 'blue', wireframe: true });
  const pole = new THREE.Mesh(poleGeometry, poleMaterial);
  scene.add(pole);
  return pole;
};

const pole = createPole();
pole.position.y = 10; 

let scrollPosition = 0;

const updateCameraPosition = () => {
  const angle = scrollPosition * 0.01; 
  const radius = 20; 
  const heightFactor = 0.1;

  camera.position.x = Math.sin(angle) * radius;
  camera.position.z = Math.cos(angle) * radius;
  camera.position.y = 10 + Math.sin(angle * heightFactor) * 5; 

  camera.lookAt(pole.position); 
};

window.addEventListener('scroll', () => {
  scrollPosition = window.scrollY;
  updateCameraPosition();
});
  updateCameraPosition();

  // Animate the scene
  const animate = () => {
    requestAnimationFrame(animate);
    controls.update();
    const delta = clock.getDelta();

    camera.lookAt(pole.position);

    renderer.render(scene, camera);
  };

  // Initialize the scene
  const init = async () => {
    animate();
    window.addEventListener("resize", onWindowResize);
  };

  await init();
}

main().catch(console.error);

// skills | experience | projects | contact
