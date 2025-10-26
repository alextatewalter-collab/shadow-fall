// === SHADOWFALL — RETRO RPG EDITION ===
// Three.js and OrbitControls loaded via index.html

import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js";
import { OrbitControls } from "https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/controls/OrbitControls.js";

window.addEventListener("DOMContentLoaded", () => {
  const menu = document.getElementById("menu");
  const startBtn = document.getElementById("startBtn");
  const howto = document.getElementById("howto");
  const gameUI = document.getElementById("game-ui");
  const questText = document.getElementById("questText");
  const introText = document.getElementById("introText");

  let renderer, scene, camera, player, enemies = [], pendant, keys = {}, last = performance.now();

  // === Retro setup ===
  function initScene() {
    const container = document.getElementById("game-container");
    container.classList.remove("hidden");
    gameUI.classList.remove("hidden");

    // Renderer — pixelated look
    renderer = new THREE.WebGLRenderer({ antialias: false });
    renderer.setPixelRatio(0.5); // chunkier pixels
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0x0b0e12, 1);
    renderer.domElement.style.imageRendering = "pixelated";
    container.appendChild(renderer.domElement);

    // Scene setup
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0b0e12);
    scene.fog = new THREE.FogExp2(0x0b0e12, 0.002);

    // Camera
    camera = new THREE.PerspectiveCamera(65, innerWidth / innerHeight, 0.1, 2000);
    camera.position.set(0, 10, 25);

    // Lights — hard-edged like old 3D RPGs
    const keyLight = new THREE.DirectionalLight(0xffffff, 0.7);
    keyLight.position.set(40, 80, 20);
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0x8888aa, 0.3);
    fillLight.position.set(-30, 20, -40);
    scene.add(fillLight);

    // === Ground — pixel stone pattern ===
    const canvas = document.createElement("canvas");
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext("2d");
    for (let y = 0; y < 64; y++) {
      for (let x = 0; x < 64; x++) {
        const shade = Math.floor(30 + Math.random() * 50);
        ctx.fillStyle = `rgb(${shade},${shade},${shade})`;
        ctx.fillRect(x, y, 1, 1);
      }
    }
    const tex = new THREE.CanvasTexture(canvas);
    tex.magFilter = THREE.NearestFilter;
    tex.minFilter = THREE.NearestFilter;
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(30, 30);

    const groundMat = new THREE.MeshStandardMaterial({
      map: tex,
      roughness: 1,
      metalness: 0
    });
    const ground = new THREE.Mesh(new THREE.BoxGeometry(300, 2, 300), groundMat);
    ground.position.y = -1;
    scene.add(ground);

    // === Player — chunky voxel hero ===
    const playerGeo = new THREE.BoxGeometry(3, 6, 3);
    const playerMat = new THREE.MeshStandardMaterial({
      color: 0x3b3c3f,
      roughness: 1,
      metalness: 0
    });
    player = new THREE.Mesh(playerGeo, playerMat);
    player.position.set(0, 3, 0);
    scene.add(player);

    // === Pendant — glowing red orb (quest goal) ===
    const pendantGeo = new THREE.SphereGeometry(0.8, 8, 8);
    const pendantMat = new THREE.MeshStandardMaterial({
      color: 0x550000,
      emissive: 0xaa0000,
      emissiveIntensity: 2,
      roughness: 1
    });
    pendant = new THREE.Mesh(pendantGeo, pendantMat);
    pendant.position.set(18, 1.5, -22);
    scene.add(pendant);

    // === Enemies — little voxel monsters ===
    for (let i = 0; i < 8; i++) {
      const enemyGeo = new THREE.BoxGeometry(2.5, 2.5, 2.5);
      const enemyMat = new THREE.MeshStandardMaterial({
        color: 0x64854a,
        roughness: 1,
        metalness: 0
      });
      const enemy = new THREE.Mesh(enemyGeo, enemyMat);
      enemy.position.set((Math.random() - 0.5) * 160, 1.2, (Math.random() - 0.5) * 160);
      scene.add(enemy);
      enemies.push(enemy);
    }

    // Resize handling
    window.addEventListener("resize", () => {
      renderer.setSize(innerWidth, innerHeight);
      camera.aspect = innerWidth / innerHeight;
      camera.updateProjectionMatrix();
    });

    // Keyboard controls
    window.addEventListener("keydown", (e) => keys[e.key.toLowerCase()] = true);
    window.addEventListener("keyup", (e) => keys[e.key.toLowerCase()] = false);
  }

  // === Game loop ===
  function startGame() {
    initScene();
    last = performance.now();
    loop(performance.now());
  }

  function loop(now) {
    const dt = Math.min(40, now - last);
    last = now;
    const speed = 0.015 * dt;

    if (keys["w"]) player.position.z -= speed * 10;
    if (keys["s"]) player.position.z += speed * 10;
    if (keys["a"]) player.position.x -= speed * 10;
    if (keys["d"]) player.position.x += speed * 10;

    camera.position.x += (player.position.x - camera.position.x) * 0.05;
    camera.position.z += (player.position.z + 25 - camera.position.z) * 0.05;
    camera.lookAt(player.position.x, player.position.y + 3, player.position.z);

    // Simple enemy motion
    enemies.forEach((e, i) => {
      e.position.x += Math.sin((now * 0.0002) + i) * 0.03 * dt;
      e.position.z += Math.cos((now * 0.00017) + i) * 0.03 * dt;
    });

    // Quest detection
    if (keys[" "]) {
      const dx = player.position.x - pendant.position.x;
      const dz = player.position.z - pendant.position.z;
      const dist2 = dx * dx + dz * dz;
      if (dist2 < 6 && pendant.visible) {
        pendant.visible = false;
        questText.textContent = "Quest Complete!";
        questText.classList.remove("hidden");
        questText.classList.add("show");
        setTimeout(() => questText.classList.remove("show"), 1800);
      }
    }

    renderer.render(scene, camera);
    requestAnimationFrame(loop);
  }

  // === Menu logic ===
  startBtn.addEventListener("click", () => {
    menu.classList.add("hidden");
    startGame();
  });
});

