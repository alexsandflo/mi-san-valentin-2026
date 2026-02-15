// =============================================
//  MI SAN VALENTÍN — Experiencia Final
//  Lee la configuración del hash URL y genera
//  la pregunta personalizada + galaxia 3D
// =============================================

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

// =============================================
//  1. CARGAR CONFIGURACIÓN DESDE URL
// =============================================

function loadConfig() {
  // Intentar cargar desde URL hash
  const hash = window.location.hash;
  if (hash && hash.includes('cfg=')) {
    try {
      const encoded = hash.split('cfg=')[1];
      const json = window.LZString.decompressFromEncodedURIComponent(encoded);
      if (json) {
        const config = JSON.parse(json);
        // Guardar en localStorage como respaldo
        localStorage.setItem('valentine_config', json);
        return {
          name: config.n || '',
          date: config.d || '',
          phrases: config.p || ['Te amo ❤️'],
          photos: config.i || [],
          youtubeId: config.yt || '',
          musicFile: config.m || '',
        };
      }
    } catch (err) {
      console.error('Error al cargar config desde URL:', err);
    }
  }

  // Fallback 1: Cargar desde archivo config.js (Persistente y recomendado para móviles)
  if (window.VALENTINE_CONFIG) {
    const config = window.VALENTINE_CONFIG;
    return {
      name: config.n || '',
      date: config.d || '',
      phrases: config.p || ['Te amo ❤️'],
      photos: config.i || [],
      youtubeId: config.yt || '',
      musicFile: config.m || '',
    };
  }

  // Fallback 2: intentar cargar de localStorage (mismo navegador)
  try {
    const stored = localStorage.getItem('valentine_config');
    if (stored) {
      const config = JSON.parse(stored);
      return {
        name: config.n || '',
        date: config.d || '',
        phrases: config.p || ['Te amo ❤️'],
        photos: config.i || [],
        youtubeId: config.yt || '',
        musicFile: config.m || '',
      };
    }
  } catch (err) {
    console.error('Error al cargar config desde localStorage:', err);
  }

  return null;
}

const CONFIG = loadConfig();

// =============================================
//  2. INICIALIZACIÓN DE LA PÁGINA
// =============================================

function init() {
  if (!CONFIG) {
    // No hay configuración → mostrar mensaje
    document.getElementById('landing').style.display = 'none';
    document.getElementById('no-config').classList.remove('hidden');
    return;
  }

  // Personalizar el título con el nombre
  const titleEl = document.getElementById('main-title');
  if (CONFIG.name) {
    titleEl.innerHTML = `${CONFIG.name},<br>¿Quieres ser mi<br><span class="highlight">San Valentín</span> ?`;
  }

  // Countdown en vivo (Días, Horas, Minutos, Segundos)
  if (CONFIG.date) {
    const section = document.getElementById('countdown-section');
    section.classList.remove('hidden');

    function updateCountdown() {
      const anniv = new Date(CONFIG.date + 'T00:00:00');
      const now = new Date();
      let diff = Math.abs(now - anniv);

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      diff -= days * (1000 * 60 * 60 * 24);
      const hours = Math.floor(diff / (1000 * 60 * 60));
      diff -= hours * (1000 * 60 * 60);
      const mins = Math.floor(diff / (1000 * 60));
      diff -= mins * (1000 * 60);
      const secs = Math.floor(diff / 1000);

      document.getElementById('cd-days').textContent = days;
      document.getElementById('cd-hours').textContent = String(hours).padStart(2, '0');
      document.getElementById('cd-mins').textContent = String(mins).padStart(2, '0');
      document.getElementById('cd-secs').textContent = String(secs).padStart(2, '0');
    }

    updateCountdown();
    setInterval(updateCountdown, 1000);
  }

  // Personalizar título de la galaxia
  const galaxyTitle = document.getElementById('galaxy-title-text');
  galaxyTitle.textContent = `✨ La Galaxia de ${CONFIG.name} ✨`;

  // Cargar música si hay archivo configurado
  if (CONFIG.musicFile) {
    loadMusicPlayer(CONFIG.musicFile);
  }

  // Iniciar experiencia
  createFloatingHearts();
  setupTransition();
}

// =============================================
//  3. CORAZONES FLOTANTES (Landing Page)
// =============================================

function createFloatingHearts() {
  const container = document.getElementById('hearts-container');
  const heartChars = ['❤', '💕', '♥', '💗', '💖', '✨', '💘'];
  const colors = ['#e91e63', '#f48fb1', '#fce4ec', '#ff4081', '#c2185b', '#ffd54f', '#ce93d8', '#ff80ab'];

  function spawnHeart() {
    const el = document.createElement('div');
    el.classList.add('heart');
    el.textContent = heartChars[Math.floor(Math.random() * heartChars.length)];
    el.style.left = Math.random() * 100 + '%';
    el.style.fontSize = (Math.random() * 22 + 10) + 'px';
    el.style.color = colors[Math.floor(Math.random() * colors.length)];
    el.style.animationDuration = (Math.random() * 7 + 5) + 's';
    el.style.animationDelay = (Math.random() * 1) + 's';
    container.appendChild(el);
    setTimeout(() => el.remove(), 14000);
  }

  for (let i = 0; i < 25; i++) setTimeout(() => spawnHeart(), i * 150);
  setInterval(spawnHeart, 350);
}

// =============================================
//  4. TRANSICIÓN Landing → Galaxy
// =============================================

function setupTransition() {
  const yesBtn = document.getElementById('yes-btn');
  const landing = document.getElementById('landing');
  const galaxy = document.getElementById('galaxy');
  const overlay = document.getElementById('transition-overlay');

  yesBtn.addEventListener('click', () => {
    // 1. Feedback visual inmediato
    yesBtn.classList.add('clicked'); // Clase opcional para efecto visual

    // Evitar doble clic, pero asegurar que no bloquee si algo falla antes
    yesBtn.disabled = true;

    // 2. Vibración (feature detect y catch simple)
    try { if (navigator.vibrate) navigator.vibrate([100, 50, 200]); } catch (e) { }

    // 3. Intentar música (CRÍTICO: en try-catch para no romper el flujo)
    try {
      if (window._valentineStartMusic) {
        window._valentineStartMusic();
      }
    } catch (err) {
      console.warn('Advertencia: Audio autoplay falló, pero continuamos.', err);
    }

    // 4. Iniciar Transición (Independiente del audio)
    overlay.classList.add('active');

    // Usar requestAnimationFrame para asegurar que el UI se actualice antes de bloquear
    requestAnimationFrame(() => {
      setTimeout(() => {
        // Ocultar landing y mostrar galaxia
        landing.classList.add('fade-out');
        landing.style.pointerEvents = 'none'; // Asegurar que no estorbe

        galaxy.classList.remove('hidden');

        // Asegurar que Three.js inicie
        try {
          initGalaxy();
        } catch (err) {
          console.error('Error iniciando galaxia:', err);
          // Fallback de emergencia por si Three.js falla: mostrar mensaje o fondo simple
          alert('Tu universo se está cargando... si tarda, recarga la página ✨');
        }

        // Limpieza de transición
        setTimeout(() => {
          overlay.classList.remove('active');
          setTimeout(() => { landing.style.display = 'none'; }, 600);
        }, 1000);
      }, 800); // Reducido ligeramente tiempo de espera para sensación más rápida
    });
  });
}

// =============================================
//  5. THREE.JS — GALAXIA DE AMOR (MEJORADA)
// =============================================

let scene, camera, renderer, controls;
let centralHeart, heartGlow, heartNameSprite;
const photoGroups = [];
const quoteSprites = [];
const shootingStars = [];
const flyingHearts = [];
let starSizes, starBaseSizes;

/* ----- Textura circular para partículas ----- */
function createParticleTexture(r, g, b) {
  const c = document.createElement('canvas');
  c.width = 64; c.height = 64;
  const ctx = c.getContext('2d');
  const grad = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
  grad.addColorStop(0, `rgba(${r},${g},${b},1)`);
  grad.addColorStop(0.25, `rgba(${r},${g},${b},0.6)`);
  grad.addColorStop(0.6, `rgba(${r},${g},${b},0.15)`);
  grad.addColorStop(1, `rgba(${r},${g},${b},0)`);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 64, 64);
  return new THREE.CanvasTexture(c);
}

/* ----- Textura sparkle (brillo en cruz) ----- */
function createSparkleTexture() {
  const c = document.createElement('canvas');
  c.width = 64; c.height = 64;
  const ctx = c.getContext('2d');
  const grad = ctx.createRadialGradient(32, 32, 0, 32, 32, 28);
  grad.addColorStop(0, 'rgba(255,255,255,1)');
  grad.addColorStop(0.15, 'rgba(255,230,200,0.7)');
  grad.addColorStop(0.5, 'rgba(255,200,150,0.15)');
  grad.addColorStop(1, 'rgba(255,200,150,0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 64, 64);
  ctx.strokeStyle = 'rgba(255,255,255,0.3)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(32, 6); ctx.lineTo(32, 58);
  ctx.moveTo(6, 32); ctx.lineTo(58, 32);
  ctx.stroke();
  return new THREE.CanvasTexture(c);
}

/* ----- Forma de corazón (punta abajo) ----- */
function createHeartShape(s) {
  const shape = new THREE.Shape();
  // Dibuja corazón con lóbulos arriba y punta abajo
  shape.moveTo(0, -s * 1.5);  // punta inferior
  shape.bezierCurveTo(-s, -s * 0.75, -s * 1.7, -s * 0.15, -s * 1.7, s * 0.5);
  shape.bezierCurveTo(-s * 1.7, s * 1.25, -s * 0.5, s * 1.25, 0, s * 0.5);
  shape.bezierCurveTo(s * 0.5, s * 1.25, s * 1.7, s * 1.25, s * 1.7, s * 0.5);
  shape.bezierCurveTo(s * 1.7, -s * 0.15, s, -s * 0.75, 0, -s * 1.5);
  return shape;
}

/* ----- Textura de estrella fugaz (cometa con cola) ----- */
function createShootingStarTexture() {
  const c = document.createElement('canvas');
  c.width = 256; c.height = 32;
  const ctx = c.getContext('2d');

  // Cola con gradiente
  const grad = ctx.createLinearGradient(0, 16, 256, 16);
  grad.addColorStop(0, 'rgba(255,255,255,0)');
  grad.addColorStop(0.5, 'rgba(255,250,220,0.15)');
  grad.addColorStop(0.8, 'rgba(255,250,200,0.5)');
  grad.addColorStop(0.95, 'rgba(255,255,240,0.9)');
  grad.addColorStop(1, 'rgba(255,255,255,1)');
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.moveTo(0, 12);
  ctx.lineTo(240, 6);
  ctx.lineTo(256, 16);
  ctx.lineTo(240, 26);
  ctx.lineTo(0, 20);
  ctx.fill();

  // Cabeza brillante
  const head = ctx.createRadialGradient(250, 16, 0, 250, 16, 12);
  head.addColorStop(0, 'rgba(255,255,255,1)');
  head.addColorStop(0.5, 'rgba(255,250,200,0.6)');
  head.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = head;
  ctx.fillRect(238, 4, 18, 28);

  return new THREE.CanvasTexture(c);
}

function initGalaxy() {
  const canvas = document.getElementById('galaxy-canvas');
  const isMobile = window.innerWidth < 768;

  scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x050010, 0.004);

  camera = new THREE.PerspectiveCamera(65, window.innerWidth / window.innerHeight, 0.1, 1500);
  camera.position.set(0, isMobile ? 6 : 8, isMobile ? 28 : 35);

  renderer = new THREE.WebGLRenderer({ canvas, antialias: !isMobile, alpha: false });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.3;
  renderer.setClearColor(0x020008);

  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  controls.minDistance = 5;
  controls.maxDistance = 150;
  controls.autoRotate = true;
  controls.autoRotateSpeed = isMobile ? 0.2 : 0.4;
  controls.enablePan = true;
  controls.rotateSpeed = isMobile ? 0.8 : 0.5;
  controls.enableZoom = true;
  controls.zoomSpeed = isMobile ? 1.2 : 0.8;
  controls.panSpeed = isMobile ? 0.8 : 0.4;
  controls.minPolarAngle = 0;           // Permite mirar desde arriba
  controls.maxPolarAngle = Math.PI;     // Permite mirar desde abajo
  controls.touches = { ONE: THREE.TOUCH.ROTATE, TWO: THREE.TOUCH.DOLLY_PAN };
  controls.target.set(0, 0, 0);
  controls.mouseButtons = { LEFT: THREE.MOUSE.ROTATE, MIDDLE: THREE.MOUSE.PAN, RIGHT: THREE.MOUSE.PAN };

  // Pausar auto-rotación al interactuar, reanudar después
  renderer.domElement.addEventListener('pointerdown', () => { controls.autoRotate = false; });
  renderer.domElement.addEventListener('pointerup', () => {
    setTimeout(() => { controls.autoRotate = true; }, 5000);
  });

  buildStarField(isMobile);
  buildNebula(isMobile);
  buildSpiralRings(isMobile);
  buildStarDust(isMobile);
  buildCentralHeartMesh();
  buildHeartOrbitRing();
  buildPhotoFrames(isMobile);
  buildQuoteSprites();
  buildShootingStars(isMobile);
  buildFlyingHeartsEmoji(isMobile);
  buildLights();

  window.addEventListener('resize', onWindowResize);
  animate();
}

// --------------- ESTRELLAS CON PARPADEO ---------------
function buildStarField(isMobile) {
  const count = isMobile ? 4000 : 10000;
  const geo = new THREE.BufferGeometry();
  const pos = new Float32Array(count * 3);
  const sizes = new Float32Array(count);
  const baseSzArr = new Float32Array(count);
  for (let i = 0; i < count; i++) {
    const i3 = i * 3;
    const r = 40 + Math.random() * 300;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    pos[i3] = r * Math.sin(phi) * Math.cos(theta);
    pos[i3 + 1] = r * Math.sin(phi) * Math.sin(theta);
    pos[i3 + 2] = r * Math.cos(phi);
    const s = 0.3 + Math.random() * 1.2;
    sizes[i] = s; baseSzArr[i] = s;
  }
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
  starSizes = sizes; starBaseSizes = baseSzArr;
  const mat = new THREE.PointsMaterial({
    size: 0.8, map: createParticleTexture(255, 255, 255),
    transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending,
    depthWrite: false, sizeAttenuation: true,
  });
  scene.add(new THREE.Points(geo, mat));
  scene.userData.starField = scene.children[scene.children.length - 1];
}

// --------------- NEBULOSA MULTI-CAPA ---------------
function buildNebula(isMobile) {
  const layers = [
    { count: isMobile ? 300 : 800, radius: 50, opacity: 0.08, size: 8, flat: 0.25 },
    { count: isMobile ? 200 : 500, radius: 35, opacity: 0.15, size: 6, flat: 0.3 },
    { count: isMobile ? 100 : 300, radius: 22, opacity: 0.22, size: 4.5, flat: 0.4 },
  ];
  const palette = [
    new THREE.Color(0xe91e63), new THREE.Color(0x9c27b0), new THREE.Color(0x673ab7),
    new THREE.Color(0xf48fb1), new THREE.Color(0xff4081), new THREE.Color(0xce93d8), new THREE.Color(0x7c4dff),
  ];
  scene.userData.nebulae = [];
  layers.forEach((layer) => {
    const geo = new THREE.BufferGeometry();
    const pos = new Float32Array(layer.count * 3);
    const col = new Float32Array(layer.count * 3);
    for (let i = 0; i < layer.count; i++) {
      const i3 = i * 3;
      const r = 5 + Math.random() * layer.radius;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      pos[i3] = r * Math.sin(phi) * Math.cos(theta);
      pos[i3 + 1] = (r * Math.sin(phi) * Math.sin(theta)) * layer.flat;
      pos[i3 + 2] = r * Math.cos(phi);
      const c = palette[Math.floor(Math.random() * palette.length)];
      col[i3] = c.r; col[i3 + 1] = c.g; col[i3 + 2] = c.b;
    }
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
    const mat = new THREE.PointsMaterial({
      size: layer.size, map: createParticleTexture(255, 120, 200), vertexColors: true,
      transparent: true, opacity: layer.opacity, blending: THREE.AdditiveBlending,
      depthWrite: false, sizeAttenuation: true,
    });
    const neb = new THREE.Points(geo, mat);
    scene.add(neb);
    scene.userData.nebulae.push(neb);
  });
}

// --------------- BRAZOS ESPIRALES DE GALAXIA ---------------
function buildSpiralRings(isMobile) {
  const armCount = 3;
  const ptsPerArm = isMobile ? 200 : 500;
  const total = armCount * ptsPerArm;
  const geo = new THREE.BufferGeometry();
  const pos = new Float32Array(total * 3);
  const col = new Float32Array(total * 3);
  const armColors = [new THREE.Color(0xff4081), new THREE.Color(0xffd54f), new THREE.Color(0xce93d8)];
  for (let arm = 0; arm < armCount; arm++) {
    const offset = (arm / armCount) * Math.PI * 2;
    const ac = armColors[arm];
    for (let i = 0; i < ptsPerArm; i++) {
      const idx = (arm * ptsPerArm + i) * 3;
      const t = i / ptsPerArm;
      const r = 8 + t * 42;
      const angle = offset + t * Math.PI * 3;
      const spread = (0.5 + t * 2) * (Math.random() - 0.5);
      pos[idx] = Math.cos(angle) * r + spread;
      pos[idx + 1] = (Math.random() - 0.5) * 2 * (1 - t * 0.5);
      pos[idx + 2] = Math.sin(angle) * r + spread;
      col[idx] = ac.r; col[idx + 1] = ac.g; col[idx + 2] = ac.b;
    }
  }
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
  const mat = new THREE.PointsMaterial({
    size: 1.2, vertexColors: true, map: createParticleTexture(255, 180, 220),
    transparent: true, opacity: 0.35, blending: THREE.AdditiveBlending,
    depthWrite: false, sizeAttenuation: true,
  });
  const spiral = new THREE.Points(geo, mat);
  scene.add(spiral);
  scene.userData.spiral = spiral;
}

// --------------- POLVO ESTELAR CÁLIDO ---------------
function buildStarDust(isMobile) {
  const count = isMobile ? 150 : 400;
  const geo = new THREE.BufferGeometry();
  const pos = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const i3 = i * 3;
    const r = 6 + Math.random() * 35;
    const theta = Math.random() * Math.PI * 2;
    pos[i3] = Math.cos(theta) * r;
    pos[i3 + 1] = (Math.random() - 0.5) * 15;
    pos[i3 + 2] = Math.sin(theta) * r;
  }
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const mat = new THREE.PointsMaterial({
    size: 1.5, map: createSparkleTexture(), transparent: true, opacity: 0.5,
    blending: THREE.AdditiveBlending, depthWrite: false, sizeAttenuation: true, color: 0xffd54f,
  });
  const dust = new THREE.Points(geo, mat);
  scene.add(dust);
  scene.userData.starDust = dust;
}

// --------------- CORAZÓN 3D CENTRAL ---------------
function buildCentralHeartMesh() {
  const shape = createHeartShape(3);
  const geo = new THREE.ExtrudeGeometry(shape, {
    depth: 2, bevelEnabled: true, bevelSegments: 5, bevelSize: 0.5, bevelThickness: 0.5,
  });
  geo.center();
  centralHeart = new THREE.Mesh(geo, new THREE.MeshPhongMaterial({
    color: 0xe91e63, emissive: 0xc2185b, emissiveIntensity: 0.5,
    specular: 0xffd54f, shininess: 100, transparent: true, opacity: 0.95,
  }));
  scene.add(centralHeart);

  // Halo 1 — cercano
  const glowGeo = new THREE.ExtrudeGeometry(shape, {
    depth: 0.2, bevelEnabled: true, bevelSize: 1.5, bevelThickness: 0.6, bevelSegments: 3,
  });
  glowGeo.center();
  heartGlow = new THREE.Mesh(glowGeo, new THREE.MeshBasicMaterial({
    color: 0xff4081, transparent: true, opacity: 0.1, side: THREE.BackSide,
  }));
  heartGlow.scale.set(1.5, 1.5, 1.5);
  scene.add(heartGlow);

  // Halo 2 — lejano púrpura
  const glow2 = new THREE.Mesh(glowGeo.clone(), new THREE.MeshBasicMaterial({
    color: 0x9c27b0, transparent: true, opacity: 0.04, side: THREE.BackSide,
  }));
  glow2.scale.set(2.2, 2.2, 2.2);
  scene.add(glow2);
  scene.userData.heartGlow2 = glow2;

  // Nombre sobre el corazón
  const nc = document.createElement('canvas');
  nc.width = 512; nc.height = 160;
  const nctx = nc.getContext('2d');
  nctx.clearRect(0, 0, 512, 160);
  nctx.shadowColor = '#ffd54f'; nctx.shadowBlur = 20;
  nctx.font = 'bold 38px Pacifico, cursive';
  nctx.textAlign = 'center'; nctx.textBaseline = 'middle';
  nctx.fillStyle = '#ffd54f';
  nctx.fillText('Te Amo mi Niña Bonita', 256, 80);
  nctx.shadowBlur = 0; nctx.fillStyle = '#ffffff';
  nctx.fillText('Te Amo mi Niña Bonita', 256, 80);

  heartNameSprite = new THREE.Sprite(new THREE.SpriteMaterial({
    map: new THREE.CanvasTexture(nc), transparent: true, depthTest: false,
  }));
  heartNameSprite.scale.set(8, 2.5, 1);
  heartNameSprite.position.set(0, 0.3, 1.2);
  centralHeart.add(heartNameSprite);
}

// --------------- ANILLO DE MINI CORAZONES ---------------
function buildHeartOrbitRing() {
  const count = 12;
  const emojis = ['❤️', '💕', '💗', '💖', '💘', '💝'];
  scene.userData.heartRing = [];
  for (let i = 0; i < count; i++) {
    const cvs = document.createElement('canvas');
    cvs.width = 48; cvs.height = 48;
    const ctx = cvs.getContext('2d');
    ctx.font = '36px serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(emojis[i % emojis.length], 24, 26);
    const sprite = new THREE.Sprite(new THREE.SpriteMaterial({
      map: new THREE.CanvasTexture(cvs), transparent: true, opacity: 0.7, depthWrite: false,
    }));
    sprite.scale.set(0.8, 0.8, 1);
    const angle = (i / count) * Math.PI * 2;
    sprite.position.set(Math.cos(angle) * 6, Math.sin(angle * 0.5) * 1.5, Math.sin(angle) * 6);
    sprite.userData = { angle, radius: 6, speed: 0.015 };
    scene.userData.heartRing.push(sprite);
    scene.add(sprite);
  }
}

// --------------- ESTRELLAS FUGACES ---------------
let shootingStarTexture;

function buildShootingStars(isMobile) {
  shootingStarTexture = createShootingStarTexture();
  const count = isMobile ? 5 : 8;
  for (let i = 0; i < count; i++) createShootingStarSprite();
}

function createShootingStarSprite() {
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({
    map: shootingStarTexture, transparent: true, opacity: 0,
    blending: THREE.AdditiveBlending, depthWrite: false,
  }));
  sprite.scale.set(14, 0.7, 1);
  resetShootingStar(sprite);
  scene.add(sprite);
  shootingStars.push(sprite);
}

function resetShootingStar(star) {
  const side = Math.random() > 0.5 ? 1 : -1;
  star.position.set(side * (50 + Math.random() * 60), 20 + Math.random() * 50, -60 + Math.random() * 120);
  const dirX = -side * (0.4 + Math.random() * 0.3);
  const dirY = -(0.15 + Math.random() * 0.2);
  star.material.rotation = Math.atan2(dirY, dirX);
  star.userData = {
    speed: 0.35 + Math.random() * 0.3, dirX, dirY,
    life: 0, maxLife: 150 + Math.random() * 200, delay: Math.floor(Math.random() * 400),
  };
  star.material.opacity = 0;
}

// --------------- CORAZONES EMOJI VOLANDO ---------------
function buildFlyingHeartsEmoji(isMobile) {
  const count = isMobile ? 10 : 18;
  const emojis = ['❤️', '💕', '💗', '💖', '💘', '♥️', '💝', '✨', '🌟', '💫'];
  for (let i = 0; i < count; i++) {
    const cvs = document.createElement('canvas');
    cvs.width = 64; cvs.height = 64;
    const ctx = cvs.getContext('2d');
    ctx.font = '48px serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(emojis[i % emojis.length], 32, 36);
    const sprite = new THREE.Sprite(new THREE.SpriteMaterial({
      map: new THREE.CanvasTexture(cvs), transparent: true, opacity: 0.7, depthWrite: false,
    }));
    const r = 22 + Math.random() * 55;
    const theta = Math.random() * Math.PI * 2;
    const y = (Math.random() - 0.5) * 30;
    sprite.position.set(Math.cos(theta) * r, y, Math.sin(theta) * r);
    sprite.scale.set(1.5 + Math.random() * 0.8, 1.5 + Math.random() * 0.8, 1);
    sprite.userData = {
      angle: theta, radius: r, yBase: y,
      speed: 0.015 + Math.random() * 0.03,
      bobSpeed: 0.3 + Math.random() * 0.5, bobAmp: 0.5 + Math.random() * 1.5,
    };
    flyingHearts.push(sprite);
    scene.add(sprite);
  }
}

// --------------- MARCOS DE FOTOS (DISTRIBUCIÓN EN ANILLOS) ---------------
function buildPhotoFrames(isMobile) {
  const photos = CONFIG.photos;
  if (!photos || photos.length === 0) return;
  const total = photos.length;

  // Definir anillos concéntricos con diferentes radios, alturas y velocidades
  // Cada anillo tiene suficiente espacio para que las fotos no se tapen
  const rings = isMobile ? [
    { radius: 14, y: 0,    speed: 0.05,  maxPhotos: 4 },
    { radius: 22, y: 3,    speed: 0.035, maxPhotos: 5 },
    { radius: 30, y: -2,   speed: 0.025, maxPhotos: 6 },
    { radius: 38, y: 1.5,  speed: 0.018, maxPhotos: 7 },
    { radius: 46, y: -3,   speed: 0.012, maxPhotos: 8 },
  ] : [
    { radius: 16, y: 0,    speed: 0.06,  maxPhotos: 4 },
    { radius: 24, y: 3,    speed: 0.04,  maxPhotos: 5 },
    { radius: 32, y: -2,   speed: 0.03,  maxPhotos: 6 },
    { radius: 40, y: 2,    speed: 0.02,  maxPhotos: 7 },
    { radius: 48, y: -3,   speed: 0.015, maxPhotos: 8 },
  ];

  // Fotos un poco más pequeñas en móvil para evitar solapamiento
  const size = isMobile ? 3.8 : 4;
  const border = 0.3;

  // Distribuir fotos entre los anillos
  let photoIdx = 0;

  // Calcular cuántas fotos van en cada anillo proporcionalmente
  const photosPerRing = [];
  let remaining = total;
  for (let r = 0; r < rings.length && remaining > 0; r++) {
    const count = Math.min(rings[r].maxPhotos, remaining);
    photosPerRing.push(count);
    remaining -= count;
    if (remaining <= 0) break;
  }
  // Si sobran fotos, repartirlas entre los anillos existentes
  while (remaining > 0) {
    for (let r = 0; r < photosPerRing.length && remaining > 0; r++) {
      photosPerRing[r]++;
      remaining--;
    }
  }

  photoIdx = 0;
  for (let r = 0; r < photosPerRing.length; r++) {
    const ring = rings[r];
    const countInRing = photosPerRing[r];
    const angleOffset = r * 0.5; // Desfase entre anillos para no alinear

    for (let i = 0; i < countInRing; i++) {
      if (photoIdx >= total) break;
      const dataUrl = photos[photoIdx];

      const texture = new THREE.TextureLoader().load(dataUrl);
      texture.colorSpace = THREE.SRGBColorSpace;

      const frame = new THREE.Mesh(
        new THREE.PlaneGeometry(size + border * 2, size + border * 2),
        new THREE.MeshBasicMaterial({ color: 0xffd54f, side: THREE.DoubleSide })
      );
      const inner = new THREE.Mesh(
        new THREE.PlaneGeometry(size + border, size + border),
        new THREE.MeshBasicMaterial({ color: 0x0d0020, side: THREE.DoubleSide })
      );
      inner.position.z = 0.005;
      const photo = new THREE.Mesh(
        new THREE.PlaneGeometry(size, size),
        new THREE.MeshBasicMaterial({ map: texture, side: THREE.DoubleSide, transparent: true })
      );
      photo.position.z = 0.01;

      // Emoji debajo
      const lc = document.createElement('canvas');
      lc.width = 256; lc.height = 80;
      const lctx = lc.getContext('2d');
      lctx.font = '48px serif'; lctx.textAlign = 'center';
      lctx.fillText('💕', 128, 50);
      const label = new THREE.Sprite(new THREE.SpriteMaterial({
        map: new THREE.CanvasTexture(lc), transparent: true, opacity: 0.85,
      }));
      label.scale.set(2, 0.7, 1);
      label.position.set(0, -(size / 2 + 1), 0);

      const group = new THREE.Group();
      group.add(frame); group.add(inner); group.add(photo); group.add(label);

      // Ángulo equidistante dentro del anillo + desfase por anillo
      const angle = angleOffset + (i / countInRing) * Math.PI * 2;
      // Variación vertical para evitar línea plana
      const yVariation = (i % 3 === 0) ? 0 : (i % 3 === 1) ? 1.8 : -1.8;
      const yOff = ring.y + yVariation;

      group.position.set(
        Math.cos(angle) * ring.radius,
        yOff,
        Math.sin(angle) * ring.radius
      );
      group.rotation.y = -angle + Math.PI;

      group.userData = {
        angle,
        orbitRadius: ring.radius,
        speed: ring.speed,
        bobSpeed: 0.2 + Math.random() * 0.3,
        bobAmp: 0.1 + Math.random() * 0.15,
        yBase: yOff,
      };
      photoGroups.push(group);
      scene.add(group);
      photoIdx++;
    }
  }
}

// --------------- FRASES CON FONDO GLASS ---------------
function buildQuoteSprites() {
  const phrases = CONFIG.phrases;
  if (!phrases || phrases.length === 0) return;
  const total = phrases.length;

  phrases.forEach((quote, idx) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = 800; canvas.height = 160;
    ctx.clearRect(0, 0, 800, 160);

    // Fondo glass semitransparente con bordes redondeados
    ctx.fillStyle = 'rgba(20, 5, 40, 0.5)';
    ctx.beginPath();
    ctx.moveTo(40, 20); ctx.lineTo(760, 20);
    ctx.quadraticCurveTo(780, 20, 780, 40);
    ctx.lineTo(780, 120); ctx.quadraticCurveTo(780, 140, 760, 140);
    ctx.lineTo(40, 140); ctx.quadraticCurveTo(20, 140, 20, 120);
    ctx.lineTo(20, 40); ctx.quadraticCurveTo(20, 20, 40, 20);
    ctx.fill();
    // Borde rosa
    ctx.strokeStyle = 'rgba(233, 30, 99, 0.35)'; ctx.lineWidth = 2; ctx.stroke();

    // Texto con glow
    ctx.shadowColor = '#e91e63'; ctx.shadowBlur = 15;
    ctx.font = 'bold 36px "Segoe UI Emoji", "Apple Color Emoji", Pacifico, cursive';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillStyle = '#ffffff';
    ctx.fillText(quote, 400, 80);

    const sprite = new THREE.Sprite(new THREE.SpriteMaterial({
      map: new THREE.CanvasTexture(canvas), transparent: true, opacity: 0.9, depthWrite: false,
    }));
    sprite.scale.set(12, 2.5, 1);

    const angle = (idx / total) * Math.PI * 2 + Math.PI / total;
    const radius = 25 + (idx % 2) * 6;
    const height = (idx % 2 === 0) ? 5 : -3;
    sprite.position.set(Math.cos(angle) * radius, height, Math.sin(angle) * radius);
    sprite.userData = { angle, radius, speed: 0.025, yBase: height, bobSpeed: 0.2 + Math.random() * 0.2 };
    quoteSprites.push(sprite);
    scene.add(sprite);
  });
}

// --------------- LUCES MEJORADAS ---------------
function buildLights() {
  scene.add(new THREE.AmbientLight(0x332244, 0.7));
  const p1 = new THREE.PointLight(0xe91e63, 5, 70); p1.position.set(0, 5, 5); scene.add(p1);
  const p2 = new THREE.PointLight(0xffd54f, 3, 55); p2.position.set(12, -5, 12); scene.add(p2);
  const p3 = new THREE.PointLight(0x9c27b0, 2.5, 50); p3.position.set(-10, 8, -10); scene.add(p3);
  const p4 = new THREE.PointLight(0x4a148c, 1.5, 80); p4.position.set(0, -15, -20); scene.add(p4);
  scene.userData.mainLight = p1;
}

// =============================================
//  6. LOOP DE ANIMACIÓN
// =============================================

function animate() {
  requestAnimationFrame(animate);
  const t = performance.now() * 0.001;

  // Estrellas giran + parpadeo (twinkle)
  const sf = scene.userData.starField;
  if (sf) {
    sf.rotation.y += 0.00015; sf.rotation.x += 0.00003;
    if (starSizes && starBaseSizes) {
      for (let i = 0, l = starSizes.length; i < l; i++) {
        starSizes[i] = starBaseSizes[i] * (0.6 + 0.4 * Math.sin(t * (1 + (i % 5) * 0.5) + i));
      }
      sf.geometry.attributes.size.needsUpdate = true;
    }
  }

  // Nebulosas multi-capa giran
  const nebs = scene.userData.nebulae;
  if (nebs) { nebs.forEach((n, i) => { n.rotation.y += 0.0003 * (i + 1); }); }

  // Espiral rota
  const spiral = scene.userData.spiral;
  if (spiral) { spiral.rotation.y += 0.0006; }

  // Polvo estelar rota al revés
  const dust = scene.userData.starDust;
  if (dust) { dust.rotation.y -= 0.0004; }

  // Corazón late
  if (centralHeart) {
    const beat = 1 + Math.sin(t * 2.5) * 0.1 + Math.sin(t * 5) * 0.03;
    centralHeart.scale.set(beat, beat, beat);
    centralHeart.rotation.y = Math.sin(t * 0.3) * 0.15;
  }

  if (heartGlow) {
    const gs = 1.5 + Math.sin(t * 2.5) * 0.2;
    heartGlow.scale.set(gs, gs, gs);
    heartGlow.material.opacity = 0.06 + Math.sin(t * 2.5) * 0.05;
  }

  const hg2 = scene.userData.heartGlow2;
  if (hg2) {
    const gs2 = 2.2 + Math.sin(t * 1.5) * 0.3;
    hg2.scale.set(gs2, gs2, gs2);
    hg2.material.opacity = 0.03 + Math.sin(t * 1.5) * 0.02;
  }

  if (heartNameSprite) {
    heartNameSprite.material.opacity = 0.85 + Math.sin(t * 2) * 0.15;
  }

  // Anillo de mini corazones orbita
  const heartRing = scene.userData.heartRing;
  if (heartRing) {
    heartRing.forEach((h) => {
      h.userData.angle += h.userData.speed;
      h.position.x = Math.cos(h.userData.angle) * h.userData.radius;
      h.position.z = Math.sin(h.userData.angle) * h.userData.radius;
      h.position.y = Math.sin(h.userData.angle * 2 + t) * 1.5;
    });
  }

  // Luz principal pulsa con el corazón
  const ml = scene.userData.mainLight;
  if (ml) { ml.intensity = 4 + Math.sin(t * 2.5) * 1.5; }

  // Fotos orbitan — SIEMPRE miran hacia la cámara (billboard)
  photoGroups.forEach((g) => {
    const d = g.userData;
    d.angle += d.speed * 0.004;
    g.position.x = Math.cos(d.angle) * d.orbitRadius;
    g.position.z = Math.sin(d.angle) * d.orbitRadius;
    g.position.y = d.yBase + Math.sin(t * d.bobSpeed) * d.bobAmp;
    // Billboard: las fotos siempre miran a la cámara
    g.lookAt(camera.position);
  });

  // Frases orbitan
  quoteSprites.forEach((s) => {
    const d = s.userData;
    d.angle += d.speed * 0.003;
    s.position.x = Math.cos(d.angle) * d.radius;
    s.position.z = Math.sin(d.angle) * d.radius;
    s.position.y = d.yBase + Math.sin(t * d.bobSpeed) * 0.5;
  });

  // Estrellas fugaces
  shootingStars.forEach((star) => {
    const d = star.userData;
    if (d.delay > 0) { d.delay--; return; }
    d.life++;
    if (d.life > d.maxLife) { resetShootingStar(star); return; }
    const progress = d.life / d.maxLife;
    if (progress < 0.15) star.material.opacity = progress / 0.15 * 0.7;
    else if (progress > 0.6) star.material.opacity = (1 - progress) / 0.4 * 0.7;
    else star.material.opacity = 0.7;
    star.position.x += d.dirX * d.speed;
    star.position.y += d.dirY * d.speed;
  });

  // Corazones volando
  flyingHearts.forEach((h) => {
    const d = h.userData;
    d.angle += d.speed * 0.012;
    h.position.x = Math.cos(d.angle) * d.radius;
    h.position.z = Math.sin(d.angle) * d.radius;
    h.position.y = d.yBase + Math.sin(t * d.bobSpeed) * d.bobAmp;
  });

  // OrbitControls maneja el zoom nativamente — sin interferencia
  controls.update();
  renderer.render(scene, camera);
}

// =============================================
//  7. RESIZE
// =============================================

function onWindowResize() {
  if (!camera || !renderer) return;
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

// =============================================
//  8. REPRODUCTOR DE MÚSICA MP3
// =============================================

let audioPlayer = null;

function loadMusicPlayer(filename) {
  // Cargar audio
  audioPlayer = new Audio(filename);
  audioPlayer.loop = true;
  audioPlayer.volume = 0.7;
  audioPlayer.preload = 'auto';

  // Mostrar botón inmediatamente si hay música configurada
  const btn = document.getElementById('music-toggle');
  if (btn) {
    btn.classList.remove('hidden');
    setupMusicButton();
  }

  audioPlayer.addEventListener('error', (e) => {
    console.warn('Error cargando audio:', filename, e);
  });
}

function setupMusicButton() {
  const btn = document.getElementById('music-toggle');
  let playing = false;

  btn.addEventListener('click', () => {
    if (!audioPlayer) return;

    if (playing) {
      audioPlayer.pause();
      btn.classList.remove('playing');
      playing = false;
    } else {
      audioPlayer.play().catch(() => { });
      btn.classList.add('playing');
      playing = true;
    }
  });

  // Auto-play al entrar a la galaxia
  window._valentineStartMusic = () => {
    if (audioPlayer && !playing) {
      audioPlayer.play().then(() => {
        btn.classList.add('playing');
        playing = true;
      }).catch(() => {
        // Navegador bloquea autoplay — el usuario puede dar click al botón
      });
    }
  };
}

// =============================================
//  9. INICIO
// =============================================

init();
