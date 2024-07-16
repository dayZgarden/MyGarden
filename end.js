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

  // Raycaster and Mouse Vector
  const raycaster = new Raycaster();
  const mouse = new Vector2();
  let hotAirBalloon;
  const targetPosition = new THREE.Vector3();
  const plane = new Plane(new THREE.Vector3(0, 0, 1), 0); // Plane parallel to the camera

  // Load hot air balloon
  const loader = new GLTFLoader();
  loader.load("hot_air_balloon.glb", (gltf) => {
    hotAirBalloon = gltf.scene;
    scene.add(hotAirBalloon);
    hotAirBalloon.position.set(0, 0, 0); // Initialize the position
    hotAirBalloon.scale.set(0.3, 0.3, 0.3); // Scale the hot air balloon
  });

   // Create clickable sections
   const createClickableSection = (name, position) => {
    const material = new THREE.MeshStandardMaterial({ color: 0xffff00, opacity: 0.3, transparent: true });
    const geometry = new THREE.PlaneGeometry(5, 5);
    const plane = new THREE.Mesh(geometry, material);
    plane.position.copy(position);
    plane.name = name;
    scene.add(plane);
    return plane;
  };

  const sections = {
    skills: createClickableSection('skills', new THREE.Vector3(-10, 10, 0)),
    experience: createClickableSection('experience', new THREE.Vector3(10, 10, 0)),
    projects: createClickableSection('projects', new THREE.Vector3(-10, -10, 0)),
    contact: createClickableSection('contact', new THREE.Vector3(10, -10, 0)),
  };

  // Mouse move event listener
  window.addEventListener("mousemove", (event) => {
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    // Update the raycaster with the current mouse coordinates
    raycaster.setFromCamera(mouse, camera);

    // Calculate the intersection of the ray with the plane
    const intersects = raycaster.ray.intersectPlane(plane, targetPosition);
  });

    // Click event listener
    window.addEventListener('click', (event) => {
        mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
        raycaster.setFromCamera(mouse, camera);
        const intersects = raycaster.intersectObjects(Object.values(sections));
    
        if (intersects.length > 0) {
          const section = intersects[0].object.name;
          handleSectionClick(section);
        }
      });

      const handleSectionClick = (section) => {
        switch (section) {
          case 'skills':
            alert("Navigating to Skills Section");
            break;
          case 'experience':
            alert("Navigating to Experience Section");
            break;
          case 'projects':
            alert("Navigating to Projects Section");
            break;
          case 'contact':
            alert("Navigating to Contact Section");
            break;
          default:
            break;
        }
      };

  // Resize handler
  const onWindowResize = () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  };

  // Animate the scene
  const animate = () => {
    requestAnimationFrame(animate);
    controls.update();
    const delta = clock.getDelta();
    const lerpFactor = 0.01; // Controls the smoothness, 0.05 for smooth follow

    if (hotAirBalloon) {
      // Interpolate the position of the hot air balloon
      hotAirBalloon.position.lerp(targetPosition, lerpFactor);
    }

    renderer.render(scene, camera);
  };

  // Initialize the scene
  const init = async () => {
    animate();
    window.addEventListener("resize", onWindowResize);
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("click", onClick);
  };

  await init();
}

main().catch(console.error);

// skills | experience | projects | contact
