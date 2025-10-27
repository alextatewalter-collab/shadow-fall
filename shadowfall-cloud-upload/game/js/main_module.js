diff --git a/shadowfall-cloud-upload/game/js/main_module.js b/shadowfall-cloud-upload/game/js/main_module.js
new file mode 100644
index 0000000000000000000000000000000000000000..f69315a711f76233684352e6f2a2f44d03a82043
--- /dev/null
+++ b/shadowfall-cloud-upload/game/js/main_module.js
@@ -0,0 +1,809 @@
+// === Shadowfall: Pixel RPG Scene (Enhanced Edition) ===
+import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js";
+
+// === DOM + UI References ===
+const canvas = document.getElementById("bgCanvas");
+const pressStartScreen = document.getElementById("pressStartScreen");
+const pressStartText = document.getElementById("press-start");
+const menu = document.getElementById("menu");
+const startBtn = document.getElementById("startBtn");
+const optionsBtn = document.getElementById("optionsBtn");
+const exitBtn = document.getElementById("exitBtn");
+const gameUI = document.getElementById("game-ui");
+const questText = document.getElementById("questText");
+const shardCountElem = document.getElementById("shardCount");
+const statusEffectElem = document.getElementById("statusEffect");
+const coordinatesElem = document.getElementById("coordinates");
+const healthContainer = document.getElementById("health");
+
+let questTimeout = null;
+let questComplete = false;
+
+const pressedKeys = new Set();
+let gameStarted = false;
+let isPaused = true;
+
+const movementKeys = new Set(["KeyW", "KeyA", "KeyS", "KeyD"]);
+
+const maxHealth = 5;
+let health = maxHealth;
+let collectedShards = 0;
+let totalShards = 0;
+
+// === UI Helpers ===
+function showQuestMessage(text, duration = 3200) {
+  if (!questText) return;
+  questText.textContent = text;
+  questText.classList.add("show");
+  if (questTimeout) {
+    clearTimeout(questTimeout);
+  }
+  questTimeout = setTimeout(() => {
+    questText.classList.remove("show");
+  }, duration);
+}
+
+function updateShardUI() {
+  if (shardCountElem) {
+    shardCountElem.textContent = `${collectedShards} / ${totalShards}`;
+  }
+}
+
+function updateCoordinates() {
+  if (!coordinatesElem) return;
+  coordinatesElem.textContent = `X ${playerGroup.position.x.toFixed(1)} · Z ${playerGroup.position.z.toFixed(1)}`;
+}
+
+function renderHearts() {
+  if (!healthContainer) return;
+  healthContainer.innerHTML = "";
+  for (let i = 0; i < maxHealth; i += 1) {
+    const heart = document.createElement("span");
+    heart.className = `heart${i < health ? "" : " empty"}`;
+    heart.textContent = "\u2665";
+    healthContainer.appendChild(heart);
+  }
+}
+
+function updateStatus(distanceToFire, sprinting) {
+  if (!statusEffectElem) return;
+  let status = "Status: Fog Chill";
+  if (focusPulse > 0.3) {
+    status = "Status: Focusing";
+  } else if (sprinting) {
+    status = "Status: Sprinting";
+  } else if (distanceToFire < 2.1) {
+    status = "Status: Warmth";
+  }
+  statusEffectElem.textContent = status;
+}
+
+renderHearts();
+updateShardUI();
+if (questText) {
+  questText.classList.remove("show");
+  questText.textContent = "";
+}
+
+// Blinking prompt
+if (pressStartText) {
+  let blink = false;
+  setInterval(() => {
+    pressStartText.style.opacity = blink ? 0.18 : 1;
+    blink = !blink;
+  }, 620);
+}
+
+// === Renderer ===
+const renderer = new THREE.WebGLRenderer({
+  canvas,
+  antialias: false
+});
+renderer.setSize(window.innerWidth, window.innerHeight);
+renderer.setPixelRatio(Math.min(2, window.devicePixelRatio));
+renderer.shadowMap.enabled = true;
+renderer.shadowMap.type = THREE.PCFSoftShadowMap;
+renderer.outputColorSpace = THREE.SRGBColorSpace;
+renderer.toneMappingExposure = 1.05;
+
+// === Scene & Camera ===
+const scene = new THREE.Scene();
+scene.background = new THREE.Color(0x06090c);
+scene.fog = new THREE.FogExp2(0x06090c, 0.045);
+const fogColor = scene.fog.color;
+const backgroundColor = scene.background;
+
+const camera = new THREE.PerspectiveCamera(
+  70,
+  window.innerWidth / window.innerHeight,
+  0.1,
+  120
+);
+const cameraBaseOffset = new THREE.Vector3(-2.2, 4.4, 6.5);
+const cameraOffset = new THREE.Vector3();
+const desiredCameraPos = new THREE.Vector3();
+const cameraLookTarget = new THREE.Vector3();
+const upAxis = new THREE.Vector3(0, 1, 0);
+camera.position.set(-2.2, 4.4, 6.5);
+
+// === Lights ===
+const ambientLight = new THREE.AmbientLight(0x9bb1c6, 0.45);
+scene.add(ambientLight);
+
+const moonLight = new THREE.DirectionalLight(0x7a8bbd, 0.75);
+moonLight.position.set(-6, 10, 4);
+moonLight.castShadow = true;
+moonLight.shadow.mapSize.set(1024, 1024);
+moonLight.shadow.camera.near = 1;
+moonLight.shadow.camera.far = 40;
+moonLight.shadow.camera.left = -18;
+moonLight.shadow.camera.right = 18;
+moonLight.shadow.camera.top = 18;
+moonLight.shadow.camera.bottom = -18;
+scene.add(moonLight);
+
+const hemiLight = new THREE.HemisphereLight(0x324d64, 0x111218, 0.5);
+scene.add(hemiLight);
+
+// === Campfire ===
+const campfirePosition = new THREE.Vector3(-2.2, 0, -1.2);
+const campfire = new THREE.Group();
+
+const campfireBase = new THREE.Mesh(
+  new THREE.CylinderGeometry(0.65, 0.75, 0.25, 6),
+  new THREE.MeshStandardMaterial({ color: 0x2f2018, roughness: 0.9 })
+);
+campfireBase.position.y = 0.12;
+campfireBase.receiveShadow = true;
+campfire.add(campfireBase);
+
+const logMaterial = new THREE.MeshStandardMaterial({ color: 0x4a2f20, roughness: 0.85 });
+const logA = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.2, 1.1), logMaterial);
+logA.position.y = 0.25;
+logA.rotation.y = Math.PI / 4;
+campfire.add(logA);
+const logB = logA.clone();
+logB.rotation.y = -Math.PI / 4;
+campfire.add(logB);
+
+const flame = new THREE.Mesh(
+  new THREE.ConeGeometry(0.45, 1.1, 6),
+  new THREE.MeshStandardMaterial({
+    color: 0xffa860,
+    emissive: 0xff7518,
+    emissiveIntensity: 1,
+    roughness: 0.4
+  })
+);
+flame.position.y = 0.95;
+campfire.add(flame);
+
+const campfireLight = new THREE.PointLight(0xff8334, 3.1, 14, 1.4);
+campfireLight.position.y = 1.2;
+campfire.add(campfireLight);
+
+const emberCount = 40;
+const emberGeometry = new THREE.BufferGeometry();
+const emberPositions = new Float32Array(emberCount * 3);
+const emberSpeeds = new Float32Array(emberCount);
+for (let i = 0; i < emberCount; i += 1) {
+  const idx = i * 3;
+  emberPositions[idx] = (Math.random() - 0.5) * 0.4;
+  emberPositions[idx + 1] = Math.random() * 0.6;
+  emberPositions[idx + 2] = (Math.random() - 0.5) * 0.4;
+  emberSpeeds[i] = 0.8 + Math.random() * 0.6;
+}
+emberGeometry.setAttribute("position", new THREE.BufferAttribute(emberPositions, 3));
+const emberMaterial = new THREE.PointsMaterial({
+  color: 0xffc46b,
+  size: 0.12,
+  transparent: true,
+  opacity: 0.85,
+  blending: THREE.AdditiveBlending,
+  depthWrite: false
+});
+const embers = new THREE.Points(emberGeometry, emberMaterial);
+embers.position.y = 0.3;
+campfire.add(embers);
+
+campfire.position.copy(campfirePosition);
+scene.add(campfire);
+
+// === Ground ===
+const textureLoader = new THREE.TextureLoader();
+const groundTexture = textureLoader.load("https://i.imgur.com/EYdR7dy.png");
+groundTexture.magFilter = THREE.NearestFilter;
+groundTexture.minFilter = THREE.NearestFilter;
+groundTexture.wrapS = groundTexture.wrapT = THREE.RepeatWrapping;
+groundTexture.repeat.set(18, 18);
+
+const ground = new THREE.Mesh(
+  new THREE.PlaneGeometry(80, 80),
+  new THREE.MeshStandardMaterial({
+    map: groundTexture,
+    color: 0xa0a0a0,
+    roughness: 1,
+    metalness: 0
+  })
+);
+ground.rotation.x = -Math.PI / 2;
+ground.receiveShadow = true;
+scene.add(ground);
+
+// === Trees ===
+const trees = [];
+const trunkMaterial = new THREE.MeshStandardMaterial({ color: 0x3d2b1f, roughness: 0.9 });
+const canopyMaterial = new THREE.MeshStandardMaterial({
+  color: 0x2a4f2b,
+  roughness: 0.6,
+  emissive: 0x0d1f14,
+  emissiveIntensity: 0.3
+});
+
+function createTree(x, z) {
+  const tree = new THREE.Group();
+  const scale = 0.8 + Math.random() * 0.6;
+
+  const trunk = new THREE.Mesh(new THREE.BoxGeometry(0.35, 1.4, 0.35), trunkMaterial);
+  trunk.position.y = 0.7;
+  trunk.castShadow = true;
+  trunk.receiveShadow = true;
+  tree.add(trunk);
+
+  const canopy = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.2, 1.2), canopyMaterial.clone());
+  canopy.position.y = 1.6;
+  canopy.castShadow = true;
+  tree.add(canopy);
+
+  tree.position.set(x, 0, z);
+  tree.scale.setScalar(scale);
+  scene.add(tree);
+
+  trees.push({ group: tree, canopy, swayOffset: Math.random() * Math.PI * 2 });
+}
+
+let createdTrees = 0;
+while (createdTrees < 55) {
+  const radius = 5 + Math.random() * 18;
+  const angle = Math.random() * Math.PI * 2;
+  const x = Math.cos(angle) * radius;
+  const z = Math.sin(angle) * radius;
+  if (Math.hypot(x - campfirePosition.x, z - campfirePosition.z) < 3.2) continue;
+  createTree(x, z);
+  createdTrees += 1;
+}
+
+// === Fireflies ===
+const fireflyCount = 90;
+const fireflyBase = new Float32Array(fireflyCount * 3);
+const fireflyPositions = new Float32Array(fireflyCount * 3);
+const fireflyOffsets = new Float32Array(fireflyCount);
+for (let i = 0; i < fireflyCount; i += 1) {
+  const idx = i * 3;
+  const radius = 4 + Math.random() * 18;
+  const angle = Math.random() * Math.PI * 2;
+  fireflyBase[idx] = Math.cos(angle) * radius;
+  fireflyBase[idx + 1] = 1.2 + Math.random() * 2.8;
+  fireflyBase[idx + 2] = Math.sin(angle) * radius;
+  fireflyPositions[idx] = fireflyBase[idx];
+  fireflyPositions[idx + 1] = fireflyBase[idx + 1];
+  fireflyPositions[idx + 2] = fireflyBase[idx + 2];
+  fireflyOffsets[i] = Math.random() * Math.PI * 2;
+}
+const fireflyGeometry = new THREE.BufferGeometry();
+fireflyGeometry.setAttribute("position", new THREE.BufferAttribute(fireflyPositions, 3));
+const fireflyMaterial = new THREE.PointsMaterial({
+  color: 0x7fcaff,
+  size: 0.1,
+  transparent: true,
+  opacity: 0.85,
+  blending: THREE.AdditiveBlending,
+  depthWrite: false
+});
+const fireflies = new THREE.Points(fireflyGeometry, fireflyMaterial);
+scene.add(fireflies);
+
+// === Player ===
+const playerGroup = new THREE.Group();
+scene.add(playerGroup);
+
+const body = new THREE.Mesh(
+  new THREE.BoxGeometry(0.6, 0.9, 0.6),
+  new THREE.MeshStandardMaterial({ color: 0x5860c8, roughness: 0.35, metalness: 0.15 })
+);
+body.position.y = 0.45;
+body.castShadow = true;
+playerGroup.add(body);
+
+const hood = new THREE.Mesh(
+  new THREE.ConeGeometry(0.55, 0.7, 4),
+  new THREE.MeshStandardMaterial({ color: 0x23243a, roughness: 0.25 })
+);
+hood.position.y = 1.05;
+hood.rotation.y = Math.PI / 4;
+hood.castShadow = true;
+playerGroup.add(hood);
+
+const visor = new THREE.Mesh(
+  new THREE.BoxGeometry(0.4, 0.2, 0.4),
+  new THREE.MeshStandardMaterial({ color: 0x1b1c2f, emissive: 0x0b1b4f, emissiveIntensity: 0.8 })
+);
+visor.position.set(0, 0.85, 0.25);
+playerGroup.add(visor);
+
+const swordPivot = new THREE.Group();
+swordPivot.position.set(0.35, 0.55, 0);
+playerGroup.add(swordPivot);
+
+const sword = new THREE.Mesh(
+  new THREE.BoxGeometry(0.12, 0.6, 0.16),
+  new THREE.MeshStandardMaterial({ color: 0xd5d7ff, emissive: 0x4d66ff, emissiveIntensity: 0.4, roughness: 0.2 })
+);
+sword.position.y = 0.3;
+swordPivot.add(sword);
+
+const swordIdleRotation = -Math.PI / 8;
+swordPivot.rotation.z = swordIdleRotation;
+
+const playerGlow = new THREE.PointLight(0x3b6dff, 0.7, 7, 1.6);
+playerGlow.position.set(0, 0.9, 0);
+playerGroup.add(playerGlow);
+
+const velocity = new THREE.Vector3();
+const movementVector = new THREE.Vector3();
+const tmpVector = new THREE.Vector3();
+let desiredHeading = 0;
+let focusPulse = 0;
+let regenTimer = 0;
+const walkSpeed = 3.6;
+const sprintMultiplier = 1.6;
+const worldRadius = 22;
+
+function respawnAtCampfire() {
+  playerGroup.position.set(campfirePosition.x + 1.4, 0, campfirePosition.z - 0.6);
+  desiredHeading = Math.atan2(-1.4, 0.6);
+  playerGroup.rotation.y = desiredHeading;
+  velocity.set(0, 0, 0);
+}
+
+respawnAtCampfire();
+
+// === Sentinel ===
+const sentinel = new THREE.Group();
+const sentinelBody = new THREE.Mesh(
+  new THREE.ConeGeometry(0.8, 1.6, 4),
+  new THREE.MeshStandardMaterial({ color: 0x612135, emissive: 0x2f0a12, emissiveIntensity: 0.9, roughness: 0.5 })
+);
+sentinelBody.rotation.x = Math.PI;
+sentinelBody.castShadow = true;
+sentinel.add(sentinelBody);
+
+const sentinelEye = new THREE.Mesh(
+  new THREE.SphereGeometry(0.22, 16, 16),
+  new THREE.MeshStandardMaterial({ color: 0xff4565, emissive: 0xff1233, emissiveIntensity: 1.3 })
+);
+sentinelEye.position.y = 0.35;
+sentinel.add(sentinelEye);
+
+const sentinelLight = new THREE.PointLight(0xff2048, 2.4, 7, 1.4);
+sentinelLight.position.y = 0.9;
+sentinel.add(sentinelLight);
+
+sentinel.position.set(6, 0, -4);
+scene.add(sentinel);
+
+let sentinelAngle = Math.random() * Math.PI * 2;
+const sentinelRadius = 9.5;
+let sentinelDamageCooldown = 0;
+
+// === Shards ===
+const shards = [];
+const shardGeometry = new THREE.IcosahedronGeometry(0.25, 0);
+const shardMaterial = new THREE.MeshStandardMaterial({
+  color: 0x6dc8ff,
+  emissive: 0x1b4bff,
+  emissiveIntensity: 0.7,
+  metalness: 0.3,
+  roughness: 0.25
+});
+
+for (let i = 0; i < 6; i += 1) {
+  let placed = false;
+  let attempts = 0;
+  while (!placed && attempts < 15) {
+    attempts += 1;
+    const radius = 4 + Math.random() * 14;
+    const angle = Math.random() * Math.PI * 2;
+    const x = Math.cos(angle) * radius;
+    const z = Math.sin(angle) * radius;
+    if (Math.hypot(x - campfirePosition.x, z - campfirePosition.z) < 2.6) continue;
+    const mesh = new THREE.Mesh(shardGeometry, shardMaterial.clone());
+    mesh.position.set(x, 0.35, z);
+    mesh.castShadow = true;
+    scene.add(mesh);
+    shards.push({
+      mesh,
+      collected: false,
+      initialPosition: new THREE.Vector3(x, 0.35, z),
+      bobOffset: Math.random() * Math.PI * 2
+    });
+    placed = true;
+  }
+}
+
+totalShards = shards.length;
+updateShardUI();
+
+function collectShard(shard) {
+  if (shard.collected) return;
+  shard.collected = true;
+  collectedShards += 1;
+  updateShardUI();
+  showQuestMessage(`Shard ${collectedShards}/${totalShards} recovered.`);
+  scene.remove(shard.mesh);
+  if (collectedShards === totalShards) {
+    questComplete = true;
+    showQuestMessage("All shards found! Return to the campfire.", 3600);
+  }
+}
+
+function resetShards() {
+  collectedShards = 0;
+  questComplete = false;
+  for (const shard of shards) {
+    shard.collected = false;
+    shard.mesh.position.copy(shard.initialPosition);
+    scene.add(shard.mesh);
+  }
+  updateShardUI();
+}
+
+// === Timing ===
+const clock = new THREE.Clock();
+let globalTime = 0;
+let dayProgress = Math.random();
+const daySkyColor = new THREE.Color(0x14243a);
+const nightSkyColor = new THREE.Color(0x050608);
+const dayFogColor = new THREE.Color(0x162027);
+const nightFogColor = new THREE.Color(0x050609);
+
+// === Update Helpers ===
+function updateDayNight(delta) {
+  dayProgress = (dayProgress + delta * 0.025) % 1;
+  const daylight = Math.max(0, Math.sin(dayProgress * Math.PI));
+  const nightFactor = 1 - daylight;
+
+  ambientLight.intensity = 0.25 + daylight * 0.7;
+  hemiLight.intensity = 0.2 + daylight * 0.5;
+  moonLight.intensity = 0.2 + nightFactor * 0.9;
+
+  scene.fog.density = 0.03 + nightFactor * 0.035;
+
+  backgroundColor.lerpColors(nightSkyColor, daySkyColor, daylight);
+  fogColor.lerpColors(nightFogColor, dayFogColor, daylight);
+
+  const flicker = Math.sin(globalTime * 6.0) * 0.25 + Math.sin(globalTime * 13.4) * 0.15;
+  campfireLight.intensity = 2.3 + flicker;
+  flame.scale.y = 1 + Math.sin(globalTime * 5.2) * 0.1;
+  const lateral = 1 + Math.sin(globalTime * 7.4) * 0.05;
+  flame.scale.x = lateral;
+  flame.scale.z = lateral;
+}
+
+function updateTrees() {
+  for (const tree of trees) {
+    tree.canopy.rotation.z = Math.sin(globalTime * 0.4 + tree.swayOffset) * 0.05;
+  }
+}
+
+function updateFireflies() {
+  const positions = fireflyGeometry.attributes.position.array;
+  for (let i = 0; i < fireflyCount; i += 1) {
+    const idx = i * 3;
+    const offset = fireflyOffsets[i];
+    positions[idx] = fireflyBase[idx] + Math.sin(globalTime * 0.35 + offset) * 0.6;
+    positions[idx + 1] = fireflyBase[idx + 1] + Math.sin(globalTime * 0.8 + offset) * 0.4;
+    positions[idx + 2] = fireflyBase[idx + 2] + Math.cos(globalTime * 0.35 + offset) * 0.6;
+  }
+  fireflyGeometry.attributes.position.needsUpdate = true;
+}
+
+function updateEmbers(delta) {
+  const positions = emberGeometry.attributes.position.array;
+  for (let i = 0; i < emberCount; i += 1) {
+    const idx = i * 3;
+    positions[idx] += Math.sin(globalTime * 5 + i) * 0.01 * delta * 60;
+    positions[idx + 2] += Math.cos(globalTime * 4.2 + i) * 0.01 * delta * 60;
+    positions[idx + 1] += emberSpeeds[i] * delta;
+    if (positions[idx + 1] > 2.4) {
+      positions[idx] = (Math.random() - 0.5) * 0.4;
+      positions[idx + 1] = 0.3;
+      positions[idx + 2] = (Math.random() - 0.5) * 0.4;
+    }
+  }
+  emberGeometry.attributes.position.needsUpdate = true;
+}
+
+function updateShards(delta, activeDelta) {
+  for (const shard of shards) {
+    if (shard.collected) continue;
+    shard.mesh.rotation.y += delta * 1.2;
+    shard.mesh.position.y = 0.35 + Math.sin(globalTime * 3 + shard.bobOffset) * 0.1;
+    if (activeDelta > 0 && playerGroup.position.distanceTo(shard.mesh.position) < 0.75) {
+      collectShard(shard);
+    }
+  }
+}
+
+function updateSentinel(delta, activeDelta) {
+  sentinelAngle += delta * 0.35;
+  const radius = questComplete ? sentinelRadius + 1.2 : sentinelRadius;
+  sentinel.position.set(
+    Math.cos(sentinelAngle) * radius,
+    Math.sin(globalTime * 1.5) * 0.05,
+    Math.sin(sentinelAngle) * radius
+  );
+  sentinel.rotation.y = Math.atan2(
+    playerGroup.position.x - sentinel.position.x,
+    playerGroup.position.z - sentinel.position.z
+  );
+  sentinelBody.rotation.z = Math.sin(globalTime * 2.4) * 0.15;
+
+  if (activeDelta > 0) {
+    if (sentinelDamageCooldown > 0) {
+      sentinelDamageCooldown = Math.max(0, sentinelDamageCooldown - activeDelta);
+    }
+    const dist = sentinel.position.distanceTo(playerGroup.position);
+    if (dist < 1.2 && sentinelDamageCooldown <= 0) {
+      damagePlayer(1);
+      sentinelDamageCooldown = 1.7;
+    }
+  }
+}
+
+function updateCamera(delta) {
+  cameraOffset.copy(cameraBaseOffset).applyAxisAngle(upAxis, playerGroup.rotation.y * 0.4);
+  desiredCameraPos.copy(playerGroup.position).add(cameraOffset);
+  const smoothing = 1 - Math.exp(-delta * 3);
+  camera.position.lerp(desiredCameraPos, smoothing);
+  cameraLookTarget.copy(playerGroup.position);
+  cameraLookTarget.y += 1.15;
+  camera.lookAt(cameraLookTarget);
+}
+
+function lerpAngle(a, b, t) {
+  const twoPi = Math.PI * 2;
+  const delta = ((b - a + Math.PI) % twoPi) - Math.PI;
+  return a + delta * t;
+}
+
+function updateMovement(delta) {
+  if (!gameStarted) {
+    velocity.lerp(tmpVector.set(0, 0, 0), Math.min(1, delta * 10));
+    return;
+  }
+
+  movementVector.set(0, 0, 0);
+  if (pressedKeys.has("KeyW")) movementVector.z -= 1;
+  if (pressedKeys.has("KeyS")) movementVector.z += 1;
+  if (pressedKeys.has("KeyA")) movementVector.x -= 1;
+  if (pressedKeys.has("KeyD")) movementVector.x += 1;
+
+  const moving = movementVector.lengthSq() > 0;
+  const sprinting = (pressedKeys.has("ShiftLeft") || pressedKeys.has("ShiftRight")) && moving;
+  let speed = walkSpeed;
+  if (sprinting) {
+    speed *= sprintMultiplier;
+  }
+
+  if (moving) {
+    movementVector.normalize().multiplyScalar(speed);
+    desiredHeading = Math.atan2(movementVector.x, movementVector.z);
+  }
+
+  tmpVector.set(0, 0, 0);
+  velocity.lerp(moving ? movementVector : tmpVector, Math.min(1, delta * 8));
+  if (!moving) {
+    velocity.multiplyScalar(Math.max(0, 1 - delta * 6));
+  }
+
+  playerGroup.position.x += velocity.x * delta;
+  playerGroup.position.z += velocity.z * delta;
+
+  playerGroup.rotation.y = lerpAngle(playerGroup.rotation.y, desiredHeading, Math.min(1, delta * 8));
+
+  const distanceFromCenter = Math.hypot(playerGroup.position.x, playerGroup.position.z);
+  if (distanceFromCenter > worldRadius) {
+    const ratio = worldRadius / distanceFromCenter;
+    playerGroup.position.x *= ratio;
+    playerGroup.position.z *= ratio;
+    velocity.multiplyScalar(0.4);
+  }
+
+  playerGroup.position.y = 0;
+
+  const distanceToFire = playerGroup.position.distanceTo(campfirePosition);
+  if (distanceToFire < 2.2 && health < maxHealth) {
+    regenTimer += delta;
+    if (regenTimer >= 2.5) {
+      health = Math.min(maxHealth, health + 1);
+      renderHearts();
+      showQuestMessage("The campfire mends your wounds.", 2000);
+      regenTimer = 0;
+    }
+  } else {
+    regenTimer = 0;
+  }
+}
+
+function damagePlayer(amount) {
+  if (!gameStarted) return;
+  health = Math.max(0, health - amount);
+  renderHearts();
+  if (health <= 0) {
+    showQuestMessage("The sentinel overwhelms you. The fire pulls you back.", 4200);
+    health = maxHealth;
+    renderHearts();
+    resetShards();
+    respawnAtCampfire();
+    return;
+  }
+  showQuestMessage("The sentinel strikes! Seek warmth.", 2400);
+}
+
+// === Game Loop ===
+function animate() {
+  requestAnimationFrame(animate);
+  const delta = Math.min(clock.getDelta(), 0.1);
+  globalTime += delta;
+  const gameplayDelta = isPaused ? 0 : delta;
+
+  updateDayNight(delta);
+  updateTrees();
+  updateFireflies();
+  updateEmbers(delta);
+  updateShards(delta, gameplayDelta);
+  updateSentinel(delta, gameplayDelta);
+
+  if (gameplayDelta > 0) {
+    updateMovement(gameplayDelta);
+  }
+
+  updateCamera(delta);
+
+  if (focusPulse > 0) {
+    focusPulse = Math.max(0, focusPulse - delta * 1.5);
+    const pulse = Math.sin((1 - focusPulse) * Math.PI);
+    playerGlow.intensity = 0.8 + pulse * 1.6;
+    swordPivot.rotation.z = swordIdleRotation - pulse * 0.8;
+  } else {
+    playerGlow.intensity = THREE.MathUtils.lerp(playerGlow.intensity, 0.8, delta * 1.5);
+    swordPivot.rotation.z = THREE.MathUtils.lerp(swordPivot.rotation.z, swordIdleRotation, delta * 5);
+  }
+
+  const distanceToFire = playerGroup.position.distanceTo(campfirePosition);
+  const sprinting = (pressedKeys.has("ShiftLeft") || pressedKeys.has("ShiftRight")) && velocity.lengthSq() > 0.05;
+  updateStatus(distanceToFire, sprinting);
+  if (questComplete && distanceToFire < 1.8) {
+    questComplete = false;
+    showQuestMessage("The fire surges! Shadowfall is calm... for now.", 4200);
+  }
+  updateCoordinates();
+
+  renderer.render(scene, camera);
+}
+animate();
+
+// === Interaction Helpers ===
+function openMenu() {
+  if (!menu) return;
+  menu.classList.remove("hidden");
+  isPaused = true;
+  pressedKeys.clear();
+  velocity.set(0, 0, 0);
+}
+
+function closeMenu() {
+  if (!menu) return;
+  menu.classList.add("hidden");
+  if (gameStarted) {
+    isPaused = false;
+  }
+}
+
+function toggleMenu() {
+  if (!menu) return;
+  if (menu.classList.contains("hidden")) {
+    openMenu();
+  } else {
+    closeMenu();
+  }
+}
+
+function startGame() {
+  const wasRunning = gameStarted;
+  gameStarted = true;
+  if (pressStartScreen) {
+    pressStartScreen.classList.add("hidden");
+  }
+  if (gameUI) {
+    gameUI.classList.remove("hidden");
+  }
+  closeMenu();
+  if (!wasRunning) {
+    resetShards();
+    health = maxHealth;
+    renderHearts();
+    respawnAtCampfire();
+    showQuestMessage("Collect the astral shards hidden in the mist.");
+  } else {
+    showQuestMessage("Back to the hunt.", 1800);
+  }
+}
+
+// === Event Listeners ===
+if (startBtn) {
+  startBtn.addEventListener("click", () => {
+    startGame();
+  });
+}
+
+if (optionsBtn) {
+  optionsBtn.addEventListener("click", () => {
+    showQuestMessage("Audio & key remapping coming soon. Warmth heals you near the fire.", 3600);
+  });
+}
+
+if (exitBtn) {
+  exitBtn.addEventListener("click", () => {
+    window.location.reload();
+  });
+}
+
+window.addEventListener("keydown", (event) => {
+  if (event.repeat) return;
+
+  if (event.code === "Enter") {
+    if (!gameStarted && pressStartScreen && !pressStartScreen.classList.contains("hidden")) {
+      pressStartScreen.classList.add("hidden");
+      openMenu();
+      return;
+    }
+  }
+
+  if (event.code === "Escape" && gameStarted) {
+    toggleMenu();
+    return;
+  }
+
+  if (!gameStarted || isPaused) return;
+
+  if (event.code === "Space") {
+    focusPulse = 1;
+    showQuestMessage("You attune to the whispers in the fog.", 2000);
+    event.preventDefault();
+  }
+
+  if (movementKeys.has(event.code) || event.code === "ShiftLeft" || event.code === "ShiftRight") {
+    pressedKeys.add(event.code);
+    event.preventDefault();
+  }
+});
+
+window.addEventListener("keyup", (event) => {
+  if (movementKeys.has(event.code) || event.code === "ShiftLeft" || event.code === "ShiftRight") {
+    pressedKeys.delete(event.code);
+  }
+});
+
+window.addEventListener("blur", () => {
+  pressedKeys.clear();
+});
+
+window.addEventListener("resize", () => {
+  const width = window.innerWidth;
+  const height = window.innerHeight;
+  camera.aspect = width / height;
+  camera.updateProjectionMatrix();
+  renderer.setSize(width, height);
+});
