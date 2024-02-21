import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";
import * as TWEEN from "@tweenjs/tween.js";

const TILT = 23.5 * (Math.PI / 180);
const spaceColor = new THREE.Color(0x000000);
const atmosphereColor = new THREE.Color(0x5175A7);

const scene = new THREE.Scene();
scene.background = new THREE.Color(spaceColor);
const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);
camera.position.set(0, 0, 20);
const renderer = new THREE.WebGLRenderer({ alpha: true });
renderer.setSize(window.innerWidth, window.innerHeight);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableZoom = false;
controls.enablePan = false;
controls.enableRotate = false;

renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const ambientLight = new THREE.AmbientLight(0xffffff, 1);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
directionalLight.position.set(0, 3, 5);
scene.add(directionalLight);

let earth;

const earthGeometry = new THREE.SphereGeometry(1.3, 50, 50);
const textureLoader = new THREE.TextureLoader();
textureLoader.load("earth.jpg", (texture) => {
  const bumpMap = textureLoader.load("bumpy.jpg");
  const normalMap = textureLoader.load("normal.jpg");

  const earthMaterial = new THREE.MeshStandardMaterial({
    map: texture,
    bumpMap: bumpMap,
    bumpScale: 0.05,
    normalMap: normalMap,
    metalness: 0.5,
    roughness: 0.7,
  });

  earth = new THREE.Mesh(earthGeometry, earthMaterial);
  earth.rotation.z = TILT;
  earth.position.set(0, 0, 0);
  earth.scale.set(3.5, 3.5, 3.5);
  scene.add(earth);
});

let moon;

const moonGeometry = new THREE.SphereGeometry(0.5, 50, 50);
const textureMoonLoader = new THREE.TextureLoader();
textureMoonLoader.load("moon.jpg", (texture) => {
  const bumpMap = textureMoonLoader.load("moonBump.jpg");
  const normalMap = textureMoonLoader.load("moonNormal.jpg");

  const moonMaterial = new THREE.MeshStandardMaterial({
    map: texture,
    bumpMap: bumpMap,
    bumpScale: 0.05,
    normalMap: normalMap,
    metalness: 0.5,
    roughness: 0.7,
  });

  moon = new THREE.Mesh(moonGeometry, moonMaterial);
  moon.position.set(10, 0, 0);
  moon.scale.set(1.5, 1.5, 1.5);
  scene.add(moon);
});

let sun;

const sunGeometry = new THREE.SphereGeometry(25, 50, 50);
const sunTextureLoader = new THREE.TextureLoader();
sunTextureLoader.load("sun.jpg", (texture) => {
  const bumpMap = textureMoonLoader.load("bumpy.jpg");

  const sunMaterial = new THREE.MeshStandardMaterial({
    map: texture,
    bumpMap: bumpMap,
    bumpScale: 0.9,
    metalness: 0.5,
    roughness: 0.7,
  });

  sun = new THREE.Mesh(sunGeometry, sunMaterial);
  sun.position.set(0, 0, -50);
  scene.add(sun);
});

const orbitalRadius = 15;
const orbitalSpeed = 0.5;

function moonOrbitEarth() {
  const elapsedTime = clock.getElapsedTime();

  if (moon && earth) {
    moon.position.x =
      earth.position.x + Math.cos(elapsedTime * orbitalSpeed) * orbitalRadius;
    moon.position.z =
      earth.position.z + Math.sin(elapsedTime * orbitalSpeed) * orbitalRadius;
  }
}

let stars;

function addStars() {
    const starGeometry = new THREE.SphereGeometry(0.1, 24, 24);
    const starMaterial = new THREE.MeshStandardMaterial({ color: 0xffffff });
  
    stars = [];
  
    for (let i = 0; i < 500; i++) {
      const star = new THREE.Mesh(starGeometry, starMaterial);
      const [x, y, z] = Array(3).fill().map(() => THREE.MathUtils.randFloatSpread(120));
      star.position.set(x, y, z);
      scene.add(star);
      stars.push(star); 
    }
  }

addStars();

let galaxy;

const galaxyGeometry = new THREE.SphereGeometry(100, 50, 50);
const galaxyMaterial = new THREE.MeshStandardMaterial({
color: 0x000000,
side: THREE.BackSide,
});
galaxy = new THREE.Mesh(galaxyGeometry, galaxyMaterial);
scene.add(galaxy);


const earthOrbitalRadius = 60;
const earthOrbitalSpeed = 0.5;

function earthOrbitSun() {
  const elapsedTime = clock.getElapsedTime();
  if (earth && sun) {
    earth.position.x =
      sun.position.x +
      Math.cos(elapsedTime * earthOrbitalSpeed) * earthOrbitalRadius;
    earth.position.z =
      sun.position.z +
      Math.sin(elapsedTime * earthOrbitalSpeed) * earthOrbitalRadius;
  }
}

window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

let hasScrolled = false;

function onFirstScroll() {
  if (!hasScrolled) {
    hasScrolled = true;

    animateCameraToEarth();

    document.body.removeEventListener("scroll", onFirstScroll);
  }
}

function animateCameraToEarth() {
  const targetPosition = { z: 5 };
  const duration = 3500;

  const acceleration = 1.5;
  
  new TWEEN.Tween(camera.position)
    .to(targetPosition, duration * acceleration)
    .easing(TWEEN.Easing.Quadratic.InOut)
    .onUpdate(() => camera.lookAt(earth.position))
    .onComplete(() => {
        scene.background.set(atmosphereColor);
        scene.remove(sun, earth, moon, ...stars, galaxy);
        stars = [];
    })
    .start();

  function updateTweens() {
    requestAnimationFrame(updateTweens);
    TWEEN.update();
  }
  updateTweens();
}

window.addEventListener("scroll", onFirstScroll);

camera.updateProjectionMatrix();

const clock = new THREE.Clock();

const bloomPass = new UnrealBloomPass(
  new THREE.Vector2(window.innerWidth, window.innerHeight),
  1.5,
  0.4,
  0.85
);
bloomPass.threshold = 0.1;
bloomPass.strength = 100;
bloomPass.radius = 35;

const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));
composer.addPass(bloomPass);

function animate() {
  requestAnimationFrame(animate);
  controls.update();
  const delta = clock.getDelta();
  moonOrbitEarth();
  composer.render();
  TWEEN.update();

  if (earth) {
    earth.rotation.y += 0.2 * delta;
  }

  if (moon) {
    moon.rotation.y += 0.8 * delta;
  }

  if (galaxy) {
    galaxy.rotation.x += 0.0005 * delta;
  }

  renderer.render(scene, camera);
}

document.getElementById("app").appendChild(renderer.domElement);
animate();