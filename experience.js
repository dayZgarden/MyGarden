import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import * as TWEEN from "@tweenjs/tween.js";
import getStarfield from "./getStarfield";
import getFresnelMat from "./getFresnelMat";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { TextGeometry } from "three/examples/jsm/geometries/TextGeometry.js";
import { FontLoader } from 'three/examples/jsm/loaders/FontLoader.js';


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

  // Three.js & Cannon.js
  const textureLoader = new THREE.TextureLoader();

  // Global variables
  let earth,
    moon,
    sun,
    stars,
    galaxy,
    lines,
    cloudModels = [],
    balloonModel,
    airplaneModel,
    lightsMesh,
    cloudsMesh,
    glowMesh,
    ground,
    tree,
    sun2,
    cloudModel,
    grass,
    geom = new THREE.BufferGeometry(),
    earthGroup = new THREE.Group(),
    clock = new THREE.Clock(),
    hasScrolled = false,
    oldElapsedTime = 0,
    tweenComplete = false,
    cloudGroup = new THREE.Group();

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
  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);

  // Controls
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableZoom = false;
  controls.enablePan = true;
  controls.enableRotate = true;

  // Ambient Light For Space
  const ambientLight = new THREE.AmbientLight(0xffffff, 1.5);
  ambientLight.position.set(10, 10, -10);
  scene.add(ambientLight);

  // // Directional Light for Space
  const sunLight = new THREE.DirectionalLight(0xffffff, 0.5);
  sunLight.position.set(-5, 0.5, 5);
  scene.add(sunLight);

  // Ambient Light on Earth
  const earthLight = new THREE.AmbientLight(0xffffff, 2.1);

  // Directional Light on Earth
  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.6);
  directionalLight.castShadow = true;
  directionalLight.shadow.mapSize.set(1024, 1024);
  directionalLight.shadow.camera.far = 15;
  directionalLight.shadow.camera.left = -7;
  directionalLight.shadow.camera.top = 7;
  directionalLight.shadow.camera.right = 7;
  directionalLight.shadow.camera.bottom = -7;
  directionalLight.position.set(5, 5, 5);

  // Load texture helper function
  const loadTexture = (url) => {
    return new Promise((resolve, reject) => {
      const textureLoader = new THREE.TextureLoader();
      textureLoader.load(url, resolve, undefined, reject);
    });
  };

  // Load model helper function
  const loadModel = (url) => {
    return new Promise((resolve, reject) => {
      const loader = new GLTFLoader();
      loader.load(url, resolve, undefined, reject);
    });
  };

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
    const groundLength = 500;
    const groundWidth = 500;
    const groundThickness = 0.5;

    const groundGeometry = new THREE.BoxGeometry(
      groundLength,
      groundThickness,
      groundWidth
    );
    const groundMaterial = new THREE.MeshStandardMaterial({
      color: 0x101f01,
      metalness: 0.3,
      roughness: 0.4,
      side: THREE.DoubleSide,
    });

    ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.position.y = -300;
    ground.receiveShadow = true;

    return ground;
  };

  // Function to animate the moon orbiting the earth
  const moonOrbitEarth = () => {
    const elapsedTime = clock.getElapsedTime();

    if (moon && earth) {
      moon.position.x =
        earth.position.x +
        Math.cos(elapsedTime * ORBITAL_SPEED) * ORBITAL_RADIUS;
      moon.position.z =
        earth.position.z +
        Math.sin(elapsedTime * ORBITAL_SPEED) * ORBITAL_RADIUS;
    }
  };

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
  };

  const models = await loadModels();

  // Load tree
  const loader = new GLTFLoader();
  loader.load("tree.00.glb", (gltf) => {
    tree = gltf.scene;
    tree.scale.set(40, 45, 40);
    tree.rotation.y = -0.5 * Math.PI;
    tree.position.y = -300;
  });

  const vertexShader = `
  varying vec3 vNormal;
  void main() {
    vNormal = normalize(normalMatrix * normal);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
  `;
  
  const fragmentShader = `
  uniform vec3 color;
  varying vec3 vNormal;
  void main() {
    vec3 modifiedColor = color; // Use a single uniform color
    gl_FragColor = vec4(modifiedColor, 1.0);
  }
  `;
  
  // Updated uniforms
  const uniforms = {
    color: { type: 'vec3', value: new THREE.Color(0xffff00) },
  };

  const sunMaterial = new THREE.ShaderMaterial({
    vertexShader,
    fragmentShader,
    uniforms,
  });

  // Create on earth sun
  const sunGeometry = new THREE.SphereGeometry(70, 25, 25);
  sun2 = new THREE.Mesh(sunGeometry, sunMaterial);
  sun2.position.set(-50, 90, -200);

  const grassGroup = new THREE.Group();

  loader.load("grass2.glb", (gltf) => {
    grass = gltf.scene;
    grass.scale.set(3, 3, 3);
    grass.position.y = -300;

    const groundWidth = 500;
    const groundLength = 500;
    const grassSpacing = 55; // Increase the spacing between grass clones

    for (let x = -groundWidth / 2; x < groundWidth / 2; x += grassSpacing) {
      for (let z = -groundLength / 2; z < groundLength / 2; z += grassSpacing) {
        const grassClone = grass.clone();
        grassClone.position.set(x, -300, z);
        grassGroup.add(grassClone);
      }
    }
  });

  // Create clouds
  function createCloudDome() {
    const cloudCount = 120;
    const radius = 200;
    for (let i = 0; i < cloudCount; i++) {
      const cloudClone = cloudModel.clone();
      const angle = Math.random() * Math.PI * 2;
      const distance = Math.random() * radius;
      const height = Math.random() * 240 - 10;
      const scale = Math.random() * 2 + 0.5;

      cloudClone.position.set(
        Math.cos(angle) * distance,
        height,
        Math.sin(angle) * distance
      );

      cloudClone.scale.set(scale, scale, scale);
      cloudClone.lookAt(0, 0, 0);
      cloudGroup.add(cloudClone);
    }
  }

  loader.load("cloud_1.glb", (gltf) => {
    cloudModel = gltf.scene;
    cloudModel.scale.set(0.65, 0.65, 0.65);
    cloudModel.traverse((node) => {
      if (node.isMesh) {
        node.material.transparent = true;
        node.material.opacity = 0.8;
      }
    });
    createCloudDome();
  });

  // Load Airplane Glb and save it to a variable
  loader.load("airplane.glb", (gltf) => {
    airplaneModel = gltf.scene;
    airplaneModel.scale.set(3, 3, 3);
    airplaneModel.position.set(0, 0, 0);
    airplaneModel.rotation.y = Math.PI
  }); 

  // Load textures for overlay
  const overlayTextures = [
    textureLoader.load("/Perplexed.JPG"),
    textureLoader.load("/P1.JPG"),
    textureLoader.load("/Nutrify.JPG"),
    textureLoader.load("/sdc.JPG"),
    textureLoader.load("/port1.JPG"),
    textureLoader.load("/port2.JPG"),
    textureLoader.load("/googleclone.JPG"),
    textureLoader.load("/hulu.JPG"),
    textureLoader.load("/twitter.JPG"),
    textureLoader.load("/library.JPG"),
    textureLoader.load("/skybackground.jpg"),
    textureLoader.load("/skybackground.jpg"),
  ];

// Create box geometry
const boxGeometry = new THREE.BoxGeometry(45, 40, 2);

// Create overlay planes
const planes = [];
const positions = [
  [-100, -80, -20, Math.PI / 2.2],
  [-95, -90, 30, Math.PI / -2.5],
  [-65, -100, 75, Math.PI / -4],
  [-25, -110, 105, Math.PI / -7.5],

  [70, -175, -70, Math.PI / -4],
  [105, -155, 10, Math.PI / 2],
  [90, -145, 60, Math.PI / 3],
  [55, -130, 95, Math.PI / 7],

  [25, -190, -100, Math.PI / -8.5],
  [-30, -200, -105, .25],
  // [-15, -210, -110, Math.PI / -0.25],
  // [-55, -220, -100, Math.PI / 5.5],
];

// Manually set text positions and rotations
const textPositions = [
  [-95, -75, -35, -Math.PI / 2],  // Perplexed
  [-95, -85, 15, Math.PI / -2.5],   // Player One
  [-67, -98, 70, Math.PI / -4],     // Nutrify
  [-30, -110, 105, Math.PI / -7.5], // Machine Learning Car

  [108, -175, -65, Math.PI / 1.35],    // Three.js Portfolio
  [130, -155, 20, Math.PI / 2],     // Portfolio
  [105, -142, 75, Math.PI / 3],      // Google Clone
  [60, -130, 110, Math.PI / 7],     // Hulu Clone

  [68, -188, -100, Math.PI / 1.15],  // Twitter Clone
  [-10, -200, -115, Math.PI / .95],           // Readora
];

// Project names
const projectNames = [
  "Perplexed",
  "Player One",
  "Nutrify",
  "ML Car",
  "3D Portfolio",
  "Portfolio",
  "Google Clone",
  "Hulu Clone",
  "Twitter Clone",
  "Readora"
];

const projectNameColors = [
  0xffffff, // Perplexed
  0xffffff, // Player One
  0x000000, // Nutrify
  0xffffff, // Machine Learning Car
  0xffffff, // Three.js Portfolio
  0xffffff, // Portfolio
  0x000000, // Google Clone
  0xffffff, // Hulu Clone
  0x000000, // Twitter Clone
  0x000000, // Readora
]

 // Project URLs
 const projectUrls = [
  "https://day-ztrivia.vercel.app/",         // Perplexed
  "https://day-zgamer.vercel.app/",         // Player One
  "https://day-ztracker-react.vercel.app/",           // Nutrify
  "https://self-driving-car-zkah.vercel.app/",             // ML Car
  "https://first-three-js.vercel.app/",       // 3D Portfolio
  "https://zyadalkurdi.com/",         // Portfolio
  "https://day-z-search.vercel.app/",       // Google Clone
  "https://hulu-cloned-mu.vercel.app/",         // Hulu Clone
  "https://twitter-clone-steel-one.vercel.app/",      // Twitter Clone
  "https://react-bookstore-zeta.vercel.app/"            // Readora
];

positions.forEach((pos, index) => {
  const overlayMaterial = new THREE.MeshBasicMaterial({
    map: overlayTextures[index],
    transparent: true,
    opacity: 0.9,
  });

  const plane = new THREE.Mesh(boxGeometry, overlayMaterial);
  plane.position.set(pos[0], pos[1], pos[2]);
  plane.rotation.y = pos[3];

  // Attach the project URL to the plane's userData
  plane.userData.projectUrl = projectUrls[index];

  scene.add(plane);
  planes.push(plane);

});

const textMeshes = [];

const fontLoader = new FontLoader();
fontLoader.load('/optimer_bold.typeface.json', function (font) {

  // Create text geometry and material for each project
  projectNames.forEach((name, index) => {
    const textGeometry = new TextGeometry(name, {
      font: font,
      size: 5,
      height: 0.25,
      curveSegments: 12,
      bevelEnabled: false,
    });

    const textMaterial = new THREE.MeshBasicMaterial({ 
      // color: projectNameColors[index],
      transparent: true,
      opacity: 0.9,
    });
    const textMesh = new THREE.Mesh(textGeometry, textMaterial);

    // Center the text geometry relative to its bounding box
    textGeometry.computeBoundingBox();
    const boundingBox = textGeometry.boundingBox;
    const textWidth = boundingBox.max.x - boundingBox.min.x;
    const textHeight = boundingBox.max.y - boundingBox.min.y;

    // Set text position and rotation manually based on the textPositions array
    const textPos = textPositions[index];
    textMesh.position.set(
      textPos[0] - textWidth / 2, 
      textPos[1] - textHeight / 2, 
      textPos[2]
    );
    textMesh.rotation.y = textPos[3];

    // Initially hide the text
    textMesh.visible = false;
    textMeshes.push(textMesh); // Store the text mesh

    // Add the text mesh to the scene
    scene.add(textMesh);
  });
});


  const particlesGeometry = new THREE.BufferGeometry();
  const particlesCount = 5000;

  const posArray = new Float32Array(particlesCount * 3);
  for (let i = 0; i < particlesCount * 3; i++) {
    posArray[i] = (Math.random() - 0.5) * 1000;
  }

  particlesGeometry.setAttribute(
    "position",
    new THREE.BufferAttribute(posArray, 3)
  );

  const particlesMaterial = new THREE.PointsMaterial({
    size: 0.5,
    color: 0xffffff,
  });

  const particles = new THREE.Points(particlesGeometry, particlesMaterial);

  let scrollPosition = 0;

  function addHtmlContent() {
    const newContent = document.createElement('div');
    newContent.classList.add('additional-content');
    newContent.innerHTML = `
      <h2>Welcome to the Experience Section!</h2>
    `;
  
    // Append the new content to the body or a specific section of your HTML
    document.body.appendChild(newContent);
  }

  window.addEventListener("scroll", () => {
      scrollPosition = window.scrollY;
  });

//   let previousScrollPosition = 0;
//   let isAnimating = false;
  
//   window.addEventListener("scroll", () => {
//       scrollPosition = window.scrollY;
  
//       // Detect if user is scrolling down or up
//       const isScrollingDown = scrollPosition > previousScrollPosition;
//       previousScrollPosition = scrollPosition;
  
//       // Trigger animation when scrolling down
//       if (isScrollingDown && scrollPosition >= 6000 && !tweenComplete) {
//           animateCameraToEarth();
//       }
  
//       // Trigger reverse animation when scrolling back up
//       if (!isScrollingDown && scrollPosition < 6000 && tweenComplete) {
//           reverseCameraAnimation();
//       }
//   });

//   const reverseCameraAnimation = () => {
//     if (isAnimating) return;  // Prevents overlapping tweens
//     isAnimating = true;
//     lines = createLines();
//     scene.add(lines);
//     const element = document.querySelector(".space");

//     new TWEEN.Tween(camera.position)
//         .to({ x: 0, y: 0, z: 20 }, DURATION * ACCELERATION)
//         .easing(TWEEN.Easing.Quadratic.InOut)
//         .onUpdate(() => camera.lookAt(new THREE.Vector3(0, 0, 20)))  // Point the camera to the origin or desired object
//         .onComplete(() => {
//             // Restore original scene objects, add back space elements, etc.
//             scene.add(sun, earthGroup, moon, stars, galaxy, sunLight, ambientLight);
//             scene.remove(ground, earthLight, directionalLight, tree, grassGroup, particles);
//             document.querySelector(".sidepanel").classList.remove("move__up");
//             document.querySelector(".ScrollableContent").style.display = "none";
//             scene.background = new THREE.Color(SPACE);
//             element.style.display = "block";
//             scene.remove(lines);

//             tweenComplete = false;  // Reset the tween complete flag
//             isAnimating = false;  // Allow future animations
//         })
//         .start();

//     function updateTweens() {
//         requestAnimationFrame(updateTweens);
//         TWEEN.update();
//     }
//     updateTweens();
// };

  const animateCameraToEarth = () => {
    lines = createLines();
    scene.add(lines);
    ground = createGround();

    setTimeout(() => {
      console.log("hi");
    }, 1000);

    const element = document.querySelector(".space");

    new TWEEN.Tween(camera.position)
      .to(TARGET_POSITION, DURATION * ACCELERATION)
      .easing(TWEEN.Easing.Quadratic.InOut)
      .onUpdate(() => camera.lookAt(earth.position))
      .onComplete(() => {
      // Raycaster and Mouse Vector
      const raycaster = new THREE.Raycaster();
      const mouse = new THREE.Vector2();

      // Hover effect variables
      let INTERSECTED = null;
      let CLICKED = null;

      // Tweening function
      const tweenScale = (object, to, duration) => {
        new TWEEN.Tween(object.scale)
          .to({ x: to, y: to, z: to }, duration)
          .easing(TWEEN.Easing.Elastic.Out)
          .start();
      };

      // Handle hover and scaling animation
      window.addEventListener("mousemove", (event) => {
        mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

        raycaster.setFromCamera(mouse, camera);
        const intersects = raycaster.intersectObjects(planes);

        if (intersects.length > 0) {
          if (INTERSECTED != intersects[0].object) {
            if (INTERSECTED && INTERSECTED !== CLICKED) {
              tweenScale(INTERSECTED, 1, 1500);
            }

            INTERSECTED = intersects[0].object;
            if (INTERSECTED !== CLICKED) {
              tweenScale(INTERSECTED, 1.1, 1500);
            }

            // Show the corresponding text on hover
            const index = planes.indexOf(INTERSECTED);
            if (textMeshes[index]) {
              textMeshes[index].visible = true;
            }
            document.body.style.cursor = "pointer";
          }
        } else {
          if (INTERSECTED && INTERSECTED !== CLICKED) {
            tweenScale(INTERSECTED, 1, 5000);
            const index = planes.indexOf(INTERSECTED);
            if (textMeshes[index]) {
              textMeshes[index].visible = false;
            }
            INTERSECTED = null;
          }
          document.body.style.cursor = "auto";
        }
      });

    // Handle clicks to open project URL
  window.addEventListener("click", () => {
    if (INTERSECTED) {
      const projectUrl = INTERSECTED.userData.projectUrl;
      if (projectUrl) {
        window.open(projectUrl, "_blank"); // Open the project in a new tab
      }
    }
  });


  window.addEventListener("scroll", () => {
    scrollPosition = window.scrollY;

    if (
      scrollPosition >= 6000 &&
      !document.querySelector(".additional-content")
    ) {
      addHtmlContent();
    }
  });

        scene.add(
          ground,
          earthLight,
          directionalLight,
          tree,
          grassGroup,
          particles,
        );

        scene.remove(
          sun,
          earthGroup,
          moon,
          stars,
          galaxy,
          lines,
          sunLight,
          ambientLight
        );
        camera.position.set(-3, 3, 3);

        element.style.display = "none";
        document.querySelector(".sidepanel").classList.add("move__up");
        document.querySelector(".ScrollableContent").style.display = "block";

        tweenComplete = true;
      })
      .start();

    function updateTweens() {
      requestAnimationFrame(updateTweens);
      TWEEN.update();
    }
    updateTweens();
  };

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

    if (tweenComplete) {
      camera.position.y = -scrollPosition * 0.05;

      if (scrollPosition >= 6000 && scrollPosition <= 6200) {
      } else if (scrollPosition >= 6200) {
        camera.position.y = -500;
        scene.background = new THREE.Color(0x29160f);
        camera.lookAt(0, -20000, 0);
      } else {
        // scene.background = new THREE.Color(0x448ee4);

        const canvas = document.createElement("canvas");
        canvas.width = 512;
        canvas.height = 512;
        const context = canvas.getContext("2d");

        // Create gradient
        const gradient = context.createLinearGradient(0, 0, 0, 512);
        gradient.addColorStop(0, "#B1B1B1"); // White at the top
        gradient.addColorStop(1, "#4F6EDB"); // Purple at the bottom

        context.fillStyle = gradient;
        context.fillRect(0, 0, 512, 512);

        const texture = new THREE.CanvasTexture(canvas);
        scene.background = texture;
        // cameras y position goes down the tree as the user scrolls

        // the cameras x and z should go around the tree counter clockwise maintaining the same radius around the tree
        camera.position.x = 150 * Math.cos(-scrollPosition * 0.002);
        camera.position.z = 150 * Math.sin(-scrollPosition * 0.002);
        camera.lookAt(0, -0.05 * scrollPosition, 0);
      }

      cloudGroup.children.forEach((cloud) => {
        cloud.position.x += delta * 2; // Move clouds horizontally
        if (cloud.position.x > 100) {
          // Reset position when out of view
          cloud.position.x = -100;
        }
      });
    }

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

    pos.needsUpdate = true;
    renderer.render(scene, camera);
  };

  const loadingScreen = document.querySelector(".loading__screen__container");
  const loadingText = document.querySelector(
    ".loading__screen__container__text"
  );

  const updateLoadingScreen = (progress) => {
    const size = 21.5 * progress;
    loadingScreen.style.height = `${size}px`;
    loadingScreen.style.width = `${size}px`;

    if (progress >= 30) {
      loadingText.style.color = "white";
    }
  };

  let progress = 0;
  const interval = setInterval(() => {
    if (progress < 100) {
      progress += 2.25;
      updateLoadingScreen(progress);
    } else {
      clearInterval(interval);
    }
  }, 50);

  updateLoadingScreen();

  // Initialize the scene
  const init = async () => {
    document.querySelector(".loading__screen").style.display = "flex";
    const earthGroup = await createEarth();
    const moon = await createMoon();
    const sun = await createSun();
    const galaxy = createGalaxy();

    scene.add(earthGroup);
    scene.add(moon);
    scene.add(sun);
    scene.add(stars);
    scene.add(galaxy);

    setTimeout(() => {
      document.querySelector(".loading__screen").style.display = "none";
      document.querySelector(".space").style.display = "block";
      document.querySelector(".sidepanel").style.display = "block";
    }, 5000);

    animate();
    window.addEventListener("resize", onWindowResize);
  };

  await init();
}

main().catch(console.error);

/*
  TODO: Enhance loading screen
        Make a cool three.js navigation where it has cool effects on hover of each one and it takes up the whole screen
        Enhance the projects section, make them have better hover effects and maybe use post processing
        Complete projects section by allow the user to click on them for a more detailed view and hyperlink
        Add work experience section in the ground following the tree

*/