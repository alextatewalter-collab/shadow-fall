// main_module.js — Shadowfall pixel edition

// ✅ Import THREE and OrbitControls from CDN instead of "three"
import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js";
import { OrbitControls } from "https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/controls/OrbitControls.js";

// === Scene Setup ===
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ canvas: document.getElementById("bgCanvas"), antialias: false });

// ✅ Pixelated render settings
renderer.setPixelRatio(1); // No smoothing
renderer.domElement.style.imageRendering = "pixelated"; // CSS-level pixelation
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setClearColor(0x0b0e12); // dark gray background
document.body.appendChild(renderer.domElement);

// === Lighting ===
const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
directionalLight.position.set(1, 1, 1);
scene.add(directionalLight);

// === Pixelated Cube ===
const geometry = new THREE.BoxGeometry(1, 1, 1);
const material = new THREE.MeshStandardMaterial({
  color: 0x666666,
  roughness: 1,
  metalness: 0
});
const cube = new THREE.Mesh(geometry, material);
scene.add(cube);

camera.position.z = 3;

// === Controls ===
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.enableZoom = false;

// === Animate ===
function animate() {
  requestAnimationFrame(animate);
  cube.rotation.x += 0.01;
  cube.rotation.y += 0.015;
  controls.update();
  renderer.render(scene, camera);
}

animate();

// === Handle Resize ===
window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
