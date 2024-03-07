import * as THREE from "three";
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import * as TWEEN from "@tweenjs/tween.js";
import getStarfield from "./getStarfield";
import getFresnelMat from "./getFresnelMat";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import * as CANNON from 'cannon';

async function main() {

  // Constants
  const TILT = -23.5 * (Math.PI / 180);
  const SPACE = new THREE.Color(0x000000);
  const SKY = new THREE.Color(0x448ee4);
  const ORBITAL_RADIUS = 15;
  const ORBITAL_SPEED = 0.5;
  const LINE_COUNT = 3000;
  const TARGET_POSITION = { z: 5 - 0.75 };
  const DURATION = 2100;
  const ACCELERATION = 1.5;
  const DEFAULT = new CANNON.Material("default");
  
  // Three.js & Cannon.js
  const world = new CANNON.World();
  const textureLoader = new THREE.TextureLoader();
  const contactMaterail = new CANNON.ContactMaterial(DEFAULT, DEFAULT, {
    friction: 0.1,
    restitution: 0.7,
  });
  world.addContactMaterial(contactMaterail);

  // Global variables
  let earth, moon, sun, stars, galaxy, lines, onEarthSun, cloudModels = [], balloonModel, airplaneModel, lightsMesh, cloudsMesh, glowMesh, ground,
    geom = new THREE.BufferGeometry(),
    earthGroup = new THREE.Group(),
    clock = new THREE.Clock(),
    hasScrolled = false,
    oldElapsedTime = 0;

  // Arrays
  geom.setAttribute(
    "position",
    new THREE.BufferAttribute(new Float32Array(6 * LINE_COUNT), 3)
  );
  geom.setAttribute(
    "velocity",
    new THREE.BufferAttribute(new Float32Array(2 * LINE_COUNT), 1)
  );

  let pos = geom.getAttribute("position");
  let pa = pos.array;
  let vel = geom.getAttribute("velocity");
  let va = vel.array;

  // Scene
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(SPACE);

  // Camera
  const camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );
  camera.position.set(0, 0, 20);

  // Renderer
  const renderer = new THREE.WebGLRenderer({antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);
  
  // Controls
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableZoom = true;
  controls.enablePan = true;
  controls.enableRotate = true;

  // Ambient Light For Space
  const ambientLight = new THREE.AmbientLight(0xffffff, 1.5);
  ambientLight.position.set(10,10,-10);
  scene.add(ambientLight);

  // // Directional Light for Space
  const sunLight = new THREE.DirectionalLight(0xffffff, .5);
  sunLight.position.set(-5, 0.5, 5);
  scene.add(sunLight);

  // Ambient Light on Earth
  const earthLight = new THREE.AmbientLight(0xffffff, 2.1);

  // Directional Light on Earth
  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.6)
  directionalLight.castShadow = true
  directionalLight.shadow.mapSize.set(1024, 1024)
  directionalLight.shadow.camera.far = 15
  directionalLight.shadow.camera.left = - 7
  directionalLight.shadow.camera.top = 7
  directionalLight.shadow.camera.right = 7
  directionalLight.shadow.camera.bottom = - 7
  directionalLight.position.set(5, 5, 5)

  // Load texture helper function
  const loadTexture = (url) => {
    return new Promise((resolve, reject) => {
      const textureLoader = new THREE.TextureLoader();
      textureLoader.load(url, resolve, undefined, reject);
    });
  }

  // Load model helper function
  const loadModel = (url) => {
    return new Promise((resolve, reject) => {
      const loader = new GLTFLoader();
      loader.load(url, resolve, undefined, reject);
    });
  }

  // Create Earth
  const createEarth = async () => {
    const earthGeometry = new THREE.SphereGeometry(1.6, 50, 50);

    const texture = await loadTexture("/earth.jpg");
    const bumpMap = await loadTexture("/earthBump.jpg");
    const normalMap = await loadTexture("/normal.jpg");

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
    earthGroup.rotation.z = TILT;
    earthGroup.scale.set(2.5, 2.5, 2.5);

    const lightMaterial = new THREE.MeshStandardMaterial({
      map: textureLoader.load("/lights.jpg"),
      blending: THREE.AdditiveBlending,
    });
    lightsMesh = new THREE.Mesh(earthGeometry, lightMaterial);

    const cloudMaterial = new THREE.MeshStandardMaterial({
      map: textureLoader.load("/cloudmap.jpg"),
      blending: THREE.NormalBlending,
      transparent: true,
      opacity: 0.25,
      alphaMap: textureLoader.load("/alphamap.jpg"),
    });

    cloudsMesh = new THREE.Mesh(earthGeometry, cloudMaterial);
    cloudsMesh.scale.set(1.01, 1.01, 1.01);

    const glowMaterial = getFresnelMat();
    glowMesh = new THREE.Mesh(earthGeometry, glowMaterial);
    glowMesh.scale.setScalar(1.02);

    earthGroup.add(lightsMesh, cloudsMesh, glowMesh);

    return earthGroup;
  };

  // Create Moon
  const createMoon = async () => {
    const moonGeometry = new THREE.SphereGeometry(0.5, 50, 50);

    const texture = await loadTexture("/moon.jpg");
    const bumpMap = await loadTexture("/moonBump.jpg");
    const normalMap = await loadTexture("/moonNormal.jpg");

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

    return moon;
  };

  // Create Sun
  const createSun = async () => {
    const sunGeometry = new THREE.SphereGeometry(35, 50, 50);

    const texture = await loadTexture("/sun.jpg");
    const bumpMap = await loadTexture("/bumpy.jpg");

    const sunMaterial = new THREE.MeshStandardMaterial({
      map: texture,
      bumpMap: bumpMap,
      bumpScale: 0.9,
      metalness: 0.5,
      roughness: 0.7,
    });

    sun = new THREE.Mesh(sunGeometry, sunMaterial);
    sun.position.set(95, 50, -80);

    return sun;
  };

  // Create Stars
  stars = getStarfield({ numStars: 1500 });
  scene.add(stars);

  // Create Galaxy
  const createGalaxy = () => {
    const galaxyGeometry = new THREE.SphereGeometry(65, 50, 50);
    const galaxyMaterial = new THREE.MeshStandardMaterial({
      color: 0x090808,
      side: THREE.BackSide,
    });

    galaxy = new THREE.Mesh(galaxyGeometry, galaxyMaterial);
    galaxy.position.set(90, 50, -50);

    return galaxy;
  };

  // Create Lines
  function createLines() {

    for (let line_index = 0; line_index < LINE_COUNT; line_index++) {
      let x = Math.random() * 400 - 200;
      let y = Math.random() * 200 - 100;
      let z = Math.random() * 500 - 100;
      let xx = x;
      let yy = y;
      let zz = z;

      pa[6 * line_index] = x;
      pa[6 * line_index + 1] = y;
      pa[6 * line_index + 2] = z;

      pa[6 * line_index + 3] = xx;
      pa[6 * line_index + 4] = yy;
      pa[6 * line_index + 5] = zz;

      va[2 * line_index] = va[2 * line_index + 1] = 0;
    }

    let mat = new THREE.LineBasicMaterial({ color: 0xffffff });
    lines = new THREE.LineSegments(geom, mat);

    return lines;
  }

  // Create Ground
  const createGround = () => {
    const groundGeometry = new THREE.PlaneGeometry(10, 10);
    const groundMaterial = new THREE.MeshStandardMaterial({
      color: "darkgreen",
      metalness: 0.3,
      roughness: 0.4,
      side: THREE.DoubleSide,
    });
    ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = 0;
    ground.receiveShadow = true;

    // Ground physics
    const groundShape = new CANNON.Plane();
    const groundBody = new CANNON.Body({ mass: 0});
    groundBody.addShape(groundShape);
    groundBody.quaternion.setFromAxisAngle(new CANNON.Vec3(-1,0,0), Math.PI / 2)
    world.addBody(groundBody);

    return ground;
  };

  // Create On Earth Sun
  const createOnEarthSun = () => {
    const onEarthSunGeometry = new THREE.SphereGeometry(7, 350, 50);
    const onEarthSunMaterial = new THREE.MeshBasicMaterial({ color: 0xffff00 });
    onEarthSun = new THREE.Mesh(onEarthSunGeometry, onEarthSunMaterial);
    onEarthSun.scale.set(2, 2, 2);
    onEarthSun.position.set(80, 35, -50);
    
    return onEarthSun;
  }

  // Function to animate the moon orbiting the earth
  const moonOrbitEarth = () => {
    const elapsedTime = clock.getElapsedTime();

    if (moon && earth) {
      moon.position.x =
        earth.position.x + Math.cos(elapsedTime * ORBITAL_SPEED) * ORBITAL_RADIUS;
      moon.position.z =
        earth.position.z + Math.sin(elapsedTime * ORBITAL_SPEED) * ORBITAL_RADIUS;
    }
  }

  // Load models
  const loadModels = async () => {
    const cloudModel = await loadModel("/cloud_1.glb");
    const balloonModel = await loadModel("/hot_air_balloon.glb");
    const airplaneModel = await loadModel("/airplane.glb");
    const characterModel = await loadModel("/character_with_clothes.glb");
    characterModel.scene.scale.set(0.1, 0.1, 0.1);
    characterModel.scene.position.set(0, 0, 0);

    return {
      cloudModel,
      balloonModel,
      airplaneModel,
      characterModel,
    };
  };

  // Sphere/ball for physics testing
  const sphereMesh = new THREE.Mesh(
    new THREE.SphereGeometry(0.5),
    new THREE.MeshStandardMaterial({
      color: 0x2031cd,
      roughness: 0.4,
      metalness: 0.3,
    })
  );
  sphereMesh.castShadow = true;
  sphereMesh.position.y = 1;

  // Add physics
  world.gravity.set(0, -9.82, 0);
  const sphereShape = new CANNON.Sphere(0.5);
  const sphereBody = new CANNON.Body({
    mass: 1, 
    position: new CANNON.Vec3(0,100,0),
    shape: sphereShape,
  })
  world.addBody(sphereBody);

  // Add keybinds to move the sphere
 
  const keyStates = {};
 
  document.addEventListener('keydown', (event) => {
    if (event.key.toLowerCase() === ' ') {
        const jumpVelocity = 4.5;
        sphereBody.velocity.y = jumpVelocity;

    }
  });

  // Event listeners for keydown and keyup events
  document.addEventListener('keydown', (event) => {
    keyStates[event.key.toLowerCase()] = true; // Set the state to true when the key is pressed
  });
  
  document.addEventListener('keyup', (event) => {
    keyStates[event.key.toLowerCase()] = false; // Set the state to false when the key is released
  });
  
  // Function to update the sphere's velocity based on pressed keys
  function updateVelocity(body, maxVelocity) {
    let velocityChange = new CANNON.Vec3();
  
    if (keyStates['w']) velocityChange.z -= 1;
    if (keyStates['s']) velocityChange.z += 1;
    if (keyStates['a']) velocityChange.x -= 1;
    if (keyStates['d']) velocityChange.x += 1;
  
    // Normalize the velocity change if necessary to ensure consistent speed in all directions
    if (velocityChange.length() > 0) {
      velocityChange.normalize();
      velocityChange = velocityChange.scale(maxVelocity);
    }
  
    // Update the body's velocity
    body.velocity.x = velocityChange.x;
    body.velocity.z = velocityChange.z;
  }

  // Add test cubes for physics testing
  const cubeGeometry = new THREE.BoxGeometry(1, 1, 1);
  const cubeMaterial = new THREE.MeshStandardMaterial({ color: "red" });

  // First cube
  const cube1 = new THREE.Mesh(cubeGeometry, cubeMaterial);
  cube1.position.set(-2, 0.5, 0);
  scene.add(cube1);

  // Add physics to the first cube
  const cubeShape1 = new CANNON.Box(new CANNON.Vec3(0.5, 0.5, 0.5));
  const cubeBody1 = new CANNON.Body({ mass: 0, shape: cubeShape1 });
  cubeBody1.position.set(cube1.position.x, cube1.position.y, cube1.position.z);
  world.addBody(cubeBody1);

  // Enable collision between the sphere and the first cube
  cubeBody1.addEventListener("collide", (e) => {
    if (e.body === sphereBody) {
      console.log("Collision between sphere and first cube");
    }
  });

  // Second cube
  const cube2 = new THREE.Mesh(cubeGeometry, cubeMaterial);
  cube2.position.set(2, 0.5, 0);
  scene.add(cube2);

  // Add physics to the second cube
  const cubeShape2 = new CANNON.Box(new CANNON.Vec3(0.5, 0.5, 0.5));
  const cubeBody2 = new CANNON.Body({ mass: 0, shape: cubeShape2});
  cubeBody2.position.set(cube2.position.x, cube2.position.y, cube2.position.z);
  world.addBody(cubeBody2);

  // Enable collision between the sphere and the second cube
  cubeBody2.addEventListener("collide", (e) => {
    if (e.body === sphereBody) {
      console.log("Collision between sphere and second cube");
    }
  });

  // Add objects to the scene
  const addObjectsToScene = (objects) => {
    const { cloudModel, balloonModel, airplaneModel, characterModel } = objects;

    // scene.add(cloudModel.scene);

    // for (let i = 0; i < 35; i++) {
    //   const cloudClone = cloudModel.scene.clone();
    //   cloudClone.scale.set(0.65, 0.65, 0.65);
    //   cloudClone.position.set(
    //     Math.random() * 200 - 100,
    //     Math.random() * 12 + 6,
    //     Math.random() * -10 - 10
    //   );
    //   scene.add(cloudClone);
    // }

    // scene.add(balloonModel.scene);
    // scene.add(airplaneModel.scene);

    scene.add(characterModel.scene);
  };

  // Resize handler
  const onWindowResize = () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  };

  const onFirstScroll = () => {
    if (!hasScrolled) {
      hasScrolled = true;
      document.querySelector(".show").classList.remove("show");
      animateCameraToEarth();
      document.body.removeEventListener("scroll", onFirstScroll);
    }
  }

  const models = await loadModels();

  const animateCameraToEarth = () => {

    lines = createLines();
    scene.add(lines);
    ground = createGround();
    onEarthSun = createOnEarthSun();

    setTimeout(() => {
      console.log("hi");
    }, 1000);

    const element = document.querySelector(".space");

    new TWEEN.Tween(camera.position)
      .to(TARGET_POSITION, DURATION * ACCELERATION)
      .easing(TWEEN.Easing.Quadratic.InOut)
      .onUpdate(() => camera.lookAt(earth.position))
      .onComplete(() => {
        scene.background.set(SKY);
        scene.add(ground, onEarthSun, earthLight, sphereMesh, directionalLight);

        scene.remove(sun, earthGroup, moon, stars, galaxy, lines, sunLight, ambientLight);
        camera.position.set(-3, 3, 3)

        // addObjectsToScene(models);

        element.remove();
        document.querySelector(".sidepanel").classList.add("move__up");
      })
      .start();

    function updateTweens() {
      requestAnimationFrame(updateTweens);
      TWEEN.update();
    }
    updateTweens();
  }

  window.addEventListener("scroll", onFirstScroll);

  // Animate the scene
  const animate = () => {
    requestAnimationFrame(animate);
    controls.update();
    const delta = clock.getDelta();
    moonOrbitEarth();
    TWEEN.update();

    const elapsedTime = clock.getElapsedTime();
    const deltaTime = elapsedTime - oldElapsedTime;
    oldElapsedTime = elapsedTime;
    world.step(1/60, deltaTime, 3);
    sphereMesh.position.copy(sphereBody.position);
    sphereMesh.quaternion.copy(sphereBody.quaternion);
    updateVelocity(sphereBody, 5);

    if (earth) {
      earth.rotation.y += 0.2 * delta;
      lightsMesh.rotation.y += 0.2 * delta;
      cloudsMesh.rotation.y += 0.23 * delta;
      glowMesh.rotation.y += 0.2 * delta;
    }

    if (moon) {
      moon.rotation.y += 0.8 * delta;
    }

    if (sun) {
      sun.rotation.z += 0.05 * delta;
    }

    if (stars) {
      stars.rotation.y -= 0.0002;
    }

    if (cloudModels.length > 0) {
      for (let i = 0; i < cloudModels.length; i++) {
        if (cloudModels[i].position.x > 100) {
          cloudModels[i].position.x = -130;
        } else {
          cloudModels[i].position.x += 2 * delta;
        }
      }
    }

    if (lines) {
      for (let line_index = 0; line_index < LINE_COUNT; line_index++) {
        va[2 * line_index] += 0.02;
        va[2 * line_index + 1] += 0.025;

        pa[6 * line_index + 2] += va[2 * line_index];
        pa[6 * line_index + 5] += va[2 * line_index + 1];

        if (pa[6 * line_index + 5] > 200) {
          var z = Math.random() * 200 - 100;
          pa[6 * line_index + 2] = z;
          pa[6 * line_index + 5] = z;
          va[2 * line_index] = 0;
          va[2 * line_index + 1] = 0;
        }
      }
    }

    // updatePhysics(delta);

    pos.needsUpdate = true;
    renderer.render(scene, camera);
  };

  // Initialize the scene
  const init = async () => {
    document.querySelector('.loading__screen').style.display = 'flex';
    const earthGroup = await createEarth();
    const moon = await createMoon();
    const sun = await createSun();
    const galaxy = createGalaxy();

    scene.add(earthGroup);
    scene.add(moon);
    scene.add(sun);
    scene.add(stars);
    scene.add(galaxy);

    window.addEventListener("resize", onWindowResize);
    document.querySelector('.loading__screen').style.display = 'none';
    document.querySelector('.space').style.display = 'block';
    document.querySelector('.sidepanel').style.display = 'block';
    // createCharacterPhysicsBody();
    // addPhysics();
    animate();
  };

  await init();

  }

main().catch(console.error);

// TODO: Add character movement & make the character fall from the top of the screen/sky after the animation is complete

// TODO: Create character in blender

// TODO: Create scene in blender

// const backgroundTexture = textureLoader.load("backgroundtest.jpg");
// const addBackground = () => {
//   backgroundTexture.wrapS = THREE.ClampToEdgeWrapping;
//   backgroundTexture.wrapT = THREE.ClampToEdgeWrapping;
//   backgroundTexture.minFilter = THREE.LinearFilter;

//   let height = 100;

//   const aspectRatio = window.innerWidth / window.innerHeight;
//   const backgroundGeometry = new THREE.PlaneGeometry(
//     200 * aspectRatio,
//     height * aspectRatio
//   );
//   const backgroundMaterial = new THREE.MeshBasicMaterial({
//     map: backgroundTexture,
//   });
//   const backgroundMesh = new THREE.Mesh(backgroundGeometry, backgroundMaterial);
//   backgroundMaterial.map = backgroundTexture;
//   backgroundMaterial.map.minFilter = THREE.LinearFilter;
//   backgroundMaterial.needsUpdate = true;
//   backgroundMesh.position.set(0, 0, -100);
// };

