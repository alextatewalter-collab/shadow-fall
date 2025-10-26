// === Shadowfall: Pixel RPG Scene ===
// ✅ Fixed imports — now uses full CDN paths
import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js";
import { OrbitControls } from "https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/controls/OrbitControls.js";

// === Setup Scene ===
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0a0c0e);

// === Camera ===
const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);
camera.position.set(0, 2, 5);

// === Renderer ===
const renderer = new THREE.WebGLRenderer({ antialias: false, canvas: document.getElementById("bgCanvas") });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
renderer.outputColorSpace = THREE.SRGBColorSpace;

// === Lighting ===
const ambientLight = new THREE.AmbientLight(0x404040, 1.6);
scene.add(ambientLight);

const torchLight = new THREE.PointLight(0xff8844, 2, 15);
torchLight.position.set(0, 3, 2);
scene.add(torchLight);

// === Pixelated Forest Floor ===
const groundTexture = new THREE.TextureLoader().load(
  "https://i.imgur.com/EYdR7dy.png"
);
groundTexture.magFilter = THREE.NearestFilter;
groundTexture.minFilter = THREE.NearestFilter;
groundTexture.wrapS = groundTexture.wrapT = THREE.RepeatWrapping;
groundTexture.repeat.set(10, 10);

const ground = new THREE.Mesh(
  new THREE.PlaneGeometry(50, 50),
  new THREE.MeshStandardMaterial({ map: groundTexture })
);
ground.rotation.x = -Math.PI / 2;
scene.add(ground);

// === Misty Fog ===
scene.fog = new THREE.FogExp2(0x0b0f0f, 0.08);

// === Pixel Trees (blocks with green tops) ===
function createTree(x, z) {
  const trunk = new THREE.Mesh(
    new THREE.BoxGeometry(0.3, 1.2, 0.3),
    new THREE.MeshStandardMaterial({ color: 0x3d2b1f })
  );
  const leaves = new THREE.Mesh(
    new THREE.BoxGeometry(1.2, 1.2, 1.2),
    new THREE.MeshStandardMaterial({ color: 0x2a4f2b })
  );
  trunk.position.set(x, 0.6, z);
  leaves.position.set(x, 1.6, z);
  scene.add(trunk);
  scene.add(leaves);
}

// === Add a small grove of pixel trees ===
for (let i = 0; i < 20; i++) {
  createTree(
    (Math.random() - 0.5) * 20,
    (Math.random() - 0.5) * 20
  );
}

// === Player cube ===
const player = new THREE.Mesh(
  new THREE.BoxGeometry(0.6, 1, 0.6),
  new THREE.MeshStandardMaterial({ color: 0x8888ff })
);
player.position.y = 0.5;
scene.add(player);

// === Controls ===
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.enablePan = false;
controls.maxDistance = 15;
controls.minDistance = 2;

// === Animate ===
function animate() {
  requestAnimationFrame(animate);

  // Subtle light flicker
  torchLight.intensity = 1.8 + Math.sin(Date.now() * 0.01) * 0.3;

  controls.update();
  renderer.render(scene, camera);
}
animate();

// === Resize Handler ===
window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
