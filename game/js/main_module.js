// Three.js and OrbitControls are already loaded globally via index.html

window.addEventListener('DOMContentLoaded', () => {
  const bgCanvas = document.getElementById('bgCanvas');
  const bctx = bgCanvas.getContext('2d');
  const menu = document.getElementById('menu');
  const startBtn = document.getElementById('startBtn');
  const optionsBtn = document.getElementById('optionsBtn');
  const exitBtn = document.getElementById('exitBtn');
  const options = document.getElementById('options');
  const closeOptions = document.getElementById('closeOptions');
  const volumeSlider = document.getElementById('volume');
  const volLabel = document.getElementById('volLabel');
  const howto = document.getElementById('howto');
  const gameUI = document.getElementById('game-ui');
  const questText = document.getElementById('questText');
  const introText = document.getElementById('introText');

  let audioCtx = null, masterGain = null;

  function setMusicVolume(v) {
    try {
      if (masterGain && audioCtx)
        masterGain.gain.setTargetAtTime(v, audioCtx.currentTime, 0.08);
      volLabel.innerText = Math.round(v * 100) + '%';
      localStorage.setItem('shadowfall_music_volume', Math.round(v * 100));
    } catch (e) {}
  }

  function initAudio() {
    if (audioCtx) return;
    try {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      masterGain = audioCtx.createGain();
      masterGain.gain.value = 0.8;
      masterGain.connect(audioCtx.destination);
      const filter = audioCtx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 900;
      filter.Q.value = 0.7;
      filter.connect(masterGain);

      const base = 38;
      const o1 = audioCtx.createOscillator();
      o1.type = 'sine';
      o1.frequency.value = base;
      const o2 = audioCtx.createOscillator();
      o2.type = 'sine';
      o2.frequency.value = base * 1.004;
      const g1 = audioCtx.createGain();
      g1.gain.value = 0.5;
      const g2 = audioCtx.createGain();
      g2.gain.value = 0.45;
      o1.connect(g1);
      o2.connect(g2);
      g1.connect(filter);
      g2.connect(filter);
      o1.start();
      o2.start();

      const len = audioCtx.sampleRate * 2;
      const buf = audioCtx.createBuffer(1, len, audioCtx.sampleRate);
      const d = buf.getChannelData(0);
      for (let i = 0; i < len; i++) {
        d[i] = (Math.random() * 2 - 1) * 0.002;
      }
      const n = audioCtx.createBufferSource();
      n.buffer = buf;
      n.loop = true;
      const ng = audioCtx.createGain();
      ng.gain.value = 0.05;
      const bp = audioCtx.createBiquadFilter();
      bp.type = 'bandpass';
      bp.frequency.value = 500;
      bp.Q.value = 0.9;
      n.connect(bp);
      bp.connect(ng);
      ng.connect(filter);
      n.start();
    } catch (e) {
      console.warn('Audio init failed', e);
    }
  }

  function resize() {
    bgCanvas.width = innerWidth;
    bgCanvas.height = innerHeight;
  }
  window.addEventListener('resize', resize);
  resize();

  const snow = Array.from({ length: 120 }, () => ({
    x: Math.random() * innerWidth,
    y: Math.random() * innerHeight,
    s: 0.6 + Math.random() * 1.4
  }));

  function drawBackground(t) {
    const w = bgCanvas.width, h = bgCanvas.height;
    const g = bctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, '#0a1016');
    g.addColorStop(1, '#0b0e12');
    bctx.fillStyle = g;
    bctx.fillRect(0, 0, w, h);
    bctx.fillStyle = 'rgba(190,210,230,0.06)';
    bctx.fillRect(0, h * 0.45, w, h * 0.35);

    function layer(scale, col, yoff) {
      bctx.fillStyle = col;
      const step = Math.max(50, 90 * scale);
      for (let x = -step; x < w + step; x += step) {
        const hh = 110 * scale + Math.abs((x % 300) - 150) * 0.03 * scale;
        const tx = x + Math.sin((t * 0.06 + x) * 0.001) * 28 * scale;
        bctx.beginPath();
        bctx.moveTo(tx, h * 0.6 + yoff);
        bctx.lineTo(tx + 28 * scale, h * 0.6 - hh + yoff);
        bctx.lineTo(tx - 28 * scale, h * 0.6 - hh + yoff);
        bctx.closePath();
        bctx.fill();
      }
    }

    layer(1.2, 'rgba(18,28,26,0.12)', -16);
    layer(0.9, 'rgba(10,24,18,0.18)', 6);
    layer(0.6, 'rgba(6,16,14,0.32)', 34);
    bctx.fillStyle = 'rgba(240,245,255,0.75)';
    for (const p of snow) {
      p.y += p.s;
      p.x += Math.sin((t * 0.002) + p.y * 0.01) * 0.2;
      if (p.y > h) {
        p.y = -5;
        p.x = Math.random() * w;
      }
      bctx.fillRect(p.x, p.y, 1.2, 1.2);
    }
  }

  let t = 0;
  function bgLoop() {
    t += 16;
    drawBackground(t);
    requestAnimationFrame(bgLoop);
  }
  requestAnimationFrame(bgLoop);

  // 🎬 Intro fade timing
  setTimeout(() => {
    introText.classList.remove('hidden'); // fade in intro
  }, 300);

  setTimeout(() => {
    introText.classList.add('fade-out'); // begin fading out
  }, 4000);

  setTimeout(() => {
    introText.classList.add('hidden'); // hide after fade
    menu.classList.remove('hidden');   // fade menu in
    initAudio();
  }, 6200);

  optionsBtn.addEventListener('click', () => options.classList.remove('hidden'));
  closeOptions.addEventListener('click', () => options.classList.add('hidden'));
  volumeSlider.addEventListener('input', (e) => setMusicVolume(parseInt(e.target.value, 10) / 100));

  let renderer, scene, camera, player, enemies = [], pendant, keys = {}, last = performance.now();

  function initScene() {
    const container = document.getElementById('game-container');
    container.classList.remove('hidden');
    gameUI.classList.remove('hidden');

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(window.devicePixelRatio || 1);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0x0b0e12, 1);
    container.appendChild(renderer.domElement);

    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0b0e12);
    scene.fog = new THREE.FogExp2(0x0b0e12, 0.00085);

    camera = new THREE.PerspectiveCamera(60, innerWidth / innerHeight, 0.1, 2000);
    camera.position.set(0, 14, 26);

    const hemi = new THREE.HemisphereLight(0xaaaaff, 0x221100, 0.55);
    scene.add(hemi);
    const sun = new THREE.DirectionalLight(0xffeedd, 0.7);
    sun.position.set(50, 80, 20);
    scene.add(sun);

    const g = new THREE.BoxGeometry(300, 2, 300);
    const c = document.createElement('canvas');
    c.width = 512; c.height = 512;
    const cx = c.getContext('2d');
    cx.fillStyle = '#0f1215'; cx.fillRect(0, 0, 512, 512);
    for (let i = 0; i < 3000; i++) {
      cx.fillStyle = 'rgba(30,34,36,' + (Math.random() * 0.05) + ')';
      cx.fillRect(Math.random() * 512, Math.random() * 512, Math.random() * 2 + 1, Math.random() * 2 + 1);
    }
    const tex = new THREE.CanvasTexture(c);
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(8, 8);
    const mat = new THREE.MeshStandardMaterial({ map: tex, color: 0x111215, roughness: 0.96, metalness: 0.02 });
    const ground = new THREE.Mesh(g, mat);
    ground.position.set(0, -1, 0);
    ground.receiveShadow = true;
    scene.add(ground);

    player = new THREE.Mesh(new THREE.BoxGeometry(2.8, 6, 2.4), new THREE.MeshStandardMaterial({ color: 0x2b2c31, metalness: 0.1, roughness: 0.8 }));
    player.position.set(0, 2.2, 0);
    scene.add(player);

    const sphere = new THREE.SphereGeometry(0.8, 24, 24);
    const cm = new THREE.MeshStandardMaterial({ color: 0x550000, emissive: 0x7b0015, emissiveIntensity: 2.3, metalness: 0.1, roughness: 0.6 });
    pendant = new THREE.Mesh(sphere, cm);
    pendant.position.set(18, 1.5, -22);
    scene.add(pendant);

    for (let i = 0; i < 8; i++) {
      const e = new THREE.Mesh(new THREE.BoxGeometry(2.2, 3.2, 2), new THREE.MeshStandardMaterial({ color: 0x7fa147 }));
      e.position.set((Math.random() - 0.5) * 160, 1.6, (Math.random() - 0.5) * 160);
      scene.add(e);
      enemies.push(e);
    }

    window.addEventListener('resize', () => {
      renderer.setSize(innerWidth, innerHeight);
      camera.aspect = innerWidth / innerHeight;
      camera.updateProjectionMatrix();
    });

    window.addEventListener('keydown', (e) => {
      const k = e.key.toLowerCase();
      keys[k] = true;
    });
    window.addEventListener('keyup', (e) => keys[e.key.toLowerCase()] = false);
  }

  function startGame() { initScene(); loop3D(performance.now()); }

  function loop3D(now) {
    const dt = Math.min(40, now - last);
    last = now;
    const speed = 0.015 * dt;
    if (keys['w']) player.position.z -= speed * 10;
    if (keys['s']) player.position.z += speed * 10;
    if (keys['a']) player.position.x -= speed * 10;
    if (keys['d']) player.position.x += speed * 10;

    camera.position.x += (player.position.x - camera.position.x) * 0.04;
    camera.position.z += (player.position.z + 22 - camera.position.z) * 0.04;
    camera.lookAt(player.position.x, player.position.y + 3, player.position.z);

    enemies.forEach((e, i) => {
      e.position.x += Math.sin((now * 0.0002) + i) * 0.02 * dt;
      e.position.z += Math.cos((now * 0.00017) + i) * 0.02 * dt;
    });

    if (keys[' ']) {
      const dx = player.position.x - pendant.position.x;
      const dz = player.position.z - pendant.position.z;
      const dist2 = dx * dx + dz * dz;
      if (dist2 < 6 && pendant.visible) {
        pendant.visible = false;
        questText.textContent = 'Quest Complete';
        questText.classList.remove('hidden');
        questText.classList.add('show');
        setTimeout(() => questText.classList.remove('show'), 1800);
      }
    }

    renderer.render(scene, camera);
    requestAnimationFrame(loop3D);
  }

  exitBtn.addEventListener('click', () => alert('Close the tab to exit.'));
  startBtn.addEventListener('click', () => {
    menu.classList.add('hidden');
    howto.classList.remove('hidden');
  });
  window.addEventListener('keydown', (ev) => {
    if (howto.classList.contains('hidden')) return;
    if (ev.key === 'Enter') {
      howto.classList.add('hidden');
      startGame();
    }
  });

  // Click to unlock audio
  window.addEventListener('pointerdown', function onFirst() {
    initAudio();
    window.removeEventListener('pointerdown', onFirst);
  });
});
