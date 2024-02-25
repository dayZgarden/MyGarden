import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import * as TWEEN from "@tweenjs/tween.js";
import getStarfield from "./getStarfield";
import getFresnelMat from "./getFresnelMat";
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import * as dat from 'dat.gui';


const TILT = -23.5 * (Math.PI / 180);
const spaceColor = new THREE.Color(0x000000);
const atmosphereColor = new THREE.Color(0x448EE4);

const scene = new THREE.Scene();
scene.background = new THREE.Color(spaceColor);
const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);
camera.position.set(0, 0, 20);
const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true});
renderer.setSize(window.innerWidth, window.innerHeight);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableZoom = true;
controls.enablePan = true;
controls.enableRotate = true;

renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const ambientLight = new THREE.AmbientLight(0xffffff, .5);
scene.add(ambientLight);

const sunLight = new THREE.DirectionalLight(0xffffff, 2);
sunLight.position.set(-2, 0.5, 5);
scene.add(sunLight);

let earth;
const earthGroup = new THREE.Group();

const earthGeometry = new THREE.SphereGeometry(1.6, 50, 50);
const textureLoader = new THREE.TextureLoader();
textureLoader.load("earth.jpg", (texture) => {
  const bumpMap = textureLoader.load("earthBump.jpg");
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
  earthGroup.add(earth);
});

scene.add(earthGroup);
earthGroup.rotation.z = TILT;
earthGroup.scale.set(2.5, 2.5, 2.5);

const lightMaterial = new THREE.MeshStandardMaterial({
  map: textureLoader.load("lights.jpg"),
  blending: THREE.AdditiveBlending,

});
const lightMesh = new THREE.Mesh(earthGeometry, lightMaterial);

const cloudMaterial = new THREE.MeshStandardMaterial({
  map: textureLoader.load("cloudmap.jpg"),
  blending: THREE.NormalBlending,
  transparent: true,
  opacity: 0.25,
  alphaMap: textureLoader.load('alphamap.jpg'),
});

const cloudMesh = new THREE.Mesh(earthGeometry, cloudMaterial);
cloudMesh.scale.set(1.01, 1.01, 1.01);

const fresnelMat = getFresnelMat();
const glowMesh = new THREE.Mesh(earthGeometry, fresnelMat);
glowMesh.scale.setScalar(1.02);

earthGroup.add(lightMesh, cloudMesh, glowMesh);

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

const sunGeometry = new THREE.SphereGeometry(35, 50, 50);
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
  sun.position.set(95, 50, -80);
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

let stars = getStarfield({ numStars: 1000 })
scene.add(stars)

let LINE_COUNT = 3000;
let geom = new THREE.BufferGeometry();
geom.setAttribute("position", new THREE.BufferAttribute(new Float32Array(6*LINE_COUNT), 3));
geom.setAttribute("velocity", new THREE.BufferAttribute(new Float32Array(2*LINE_COUNT), 1));
let pos = geom.getAttribute("position");
let pa = pos.array;
let vel = geom.getAttribute("velocity");
let va = vel.array;

for (let line_index= 0; line_index < LINE_COUNT; line_index++) {
  var x = Math.random() * 400 - 200;
  var y = Math.random() * 200 - 100;
  var z = Math.random() * 500 - 100;
  var xx = x;
  var yy = y;
  var zz = z;

  pa[6*line_index] = x;
  pa[6*line_index+1] = y;
  pa[6*line_index+2] = z;

  pa[6*line_index+3] = xx;
  pa[6*line_index+4] = yy;
  pa[6*line_index+5] = zz;

  va[2*line_index] = va[2*line_index+1]= 0;
}
let mat = new THREE.LineBasicMaterial({color: 0xffffff});
let lines = new THREE.LineSegments(geom, mat);

let galaxy;

const galaxyGeometry = new THREE.SphereGeometry(65, 50, 50);
const galaxyMaterial = new THREE.MeshStandardMaterial({
color: 0x000000,
side: THREE.BackSide,
});
galaxy = new THREE.Mesh(galaxyGeometry, galaxyMaterial);
galaxy.position.set(90, 50, -50);
scene.add(galaxy);

window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

let hasScrolled = false;

function onFirstScroll() {
  if (!hasScrolled) {
    hasScrolled = true;
    document.querySelector('.show').classList.remove('show');
    animateCameraToEarth();
    document.body.removeEventListener("scroll", onFirstScroll);
  }
}

const gui = new dat.GUI();

let cloudModels = []; 
const loader = new GLTFLoader();
loader.load('cloud_1.glb', (gltf) => {
  const originalCloud = gltf.scene;

  for (let i = 0; i < 5; i++) { 
    const cloudClone = originalCloud.clone();

    if (i === 0) {
      cloudClone.position.set(-130, 13, 0);
    }
    if (i === 1) {
      cloudClone.position.set(-90, 2, 3);
    }
    if (i === 2) {
      cloudClone.position.set(-50, 11, 5);
    }
    if (i === 3) {
      cloudClone.position.set(-10, 7, 2);
    }
    if (i === 4) {
      cloudClone.position.set(40, 3, 7);
    }
    
    cloudModels.push(cloudClone);
  }
});

function animateCameraToEarth() {
  const targetPosition = { z: 5- .75 };
  const duration = 2100;
  const acceleration = 1.5;

  scene.add(lines);

  setTimeout(() => {
    console.log('hi')
  }, 1000)

  const treeGeometry = new THREE.CylinderGeometry(0.1, 0.1, 1, 32);
  const treeMaterial = new THREE.MeshBasicMaterial({ color: 0x228B22 });
  const tree = new THREE.Mesh(treeGeometry, treeMaterial);
  const onEarthSunGeometry = new THREE.CircleGeometry(10, 32);
  const onEarthSunMaterial = new THREE.MeshBasicMaterial({ color: 0xffff00 });
  const onEarthSun = new THREE.Mesh(onEarthSunGeometry, onEarthSunMaterial);
  onEarthSun.scale.set(3, 3, 3);
  onEarthSun.position.set(60, 25, -50);

  const sunFolder = gui.addFolder('Sun'); 
  sunFolder.add(onEarthSun.position, 'x', -30, 30).name('X Position').listen();
  sunFolder.add(onEarthSun.position, 'y', -30, 30).name('Y Position').listen();
  sunFolder.add(onEarthSun.position, 'z', -30, 30).name('Z Position').listen();
  sunFolder.open();

  const element = document.querySelector('.space');

  new TWEEN.Tween(camera.position)
    .to(targetPosition, duration * acceleration)
    .easing(TWEEN.Easing.Quadratic.InOut)
    .onUpdate(() => camera.lookAt(earth.position))
    .onComplete(() => {
        scene.background.set(atmosphereColor);
        scene.remove(sun, earthGroup, moon, stars, galaxy, lines);
        element.remove();
        scene.add(onEarthSun);
        for (let i = 0; i < cloudModels.length; i++) {
          scene.add(cloudModels[i]);
        }
    })
    .start();

  function updateTweens() {
    requestAnimationFrame(updateTweens);
    TWEEN.update();
  }
  updateTweens();
}

// white effect of like clouds moving out of the way 
// 2d landing on earth
// then 3d tree with projects
// garden end with skills as flowers
// contact form as a bird flying away
// 3d model of me

window.addEventListener("scroll", onFirstScroll);

camera.updateProjectionMatrix();

const clock = new THREE.Clock();

function animate() {
  controls.update();
  const delta = clock.getDelta();
  moonOrbitEarth();
  TWEEN.update();


  if (earth) {
    earth.rotation.y += 0.2 * delta;
    lightMesh.rotation.y += 0.2 * delta;
    cloudMesh.rotation.y += 0.23 * delta;
    glowMesh.rotation.y += 0.2 * delta;
  }

  if (moon) {
    moon.rotation.y += 0.8 * delta;
  }

  if (sun) {
    sun.rotation.z += 0.05 * delta;
  } 

  if (stars) {
    stars.rotation.y -= 0.0002
  }

  if (cloudModels.length > 0) {

    for (let i = 0; i < cloudModels.length; i++) {
      if (cloudModels[i].position.x > 80) {
        cloudModels[i].position.x = -130;
      }
      else {
        cloudModels[i].position.x += 5 * delta;
      }
    }
  }

  if (lines){

    for (let line_index= 0; line_index < LINE_COUNT; line_index++) {
      va[2*line_index] += 0.02; //bump up the velocity by the acceleration amount
      va[2*line_index+1] += 0.025;
  
      pa[6*line_index+2] += va[2*line_index];    
      pa[6*line_index+5] += va[2*line_index+1];  
  
      if(pa[6*line_index+5] > 200) {
          var z= Math.random() * 200 - 100;
          pa[6*line_index+2] = z;
          pa[6*line_index+5] = z;
          va[2*line_index] = 0;
          va[2*line_index+1] = 0;
      }
    }
  }
  pos.needsUpdate = true;
  renderer.render(scene, camera);
  requestAnimationFrame(animate);

}

document.getElementById("app").appendChild(renderer.domElement);
animate();
