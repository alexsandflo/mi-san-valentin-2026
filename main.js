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

  // Fallback: intentar cargar de localStorage (mismo navegador)
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
    yesBtn.disabled = true;
    yesBtn.style.pointerEvents = 'none';

    // Vibración en móvil
    if (navigator.vibrate) navigator.vibrate([100, 50, 200]);

    // intentamos reproducir el audio de inmediato para "desbloquearlo" en móviles
    // ya que el clic cuenta como interacción del usuario
    if (window._valentineStartMusic) {
       window._valentineStartMusic();
    }

    overlay.classList.add('active');

    setTimeout(() => {
      landing.classList.add('fade-out');
      galaxy.classList.remove('hidden');
      initGalaxy();

      setTimeout(() => {
        overlay.classList.remove('active');
        setTimeout(() => { landing.style.display = 'none'; }, 600);
      }, 1000);
    }, 1200);
  });
}

// =============================================
//  5. THREE.JS — GALAXIA DE AMOR
// =============================================

let scene, camera, renderer, controls;
let centralHeart, heartGlow, heartNameSprite;
const photoGroups = [];
const quoteSprites = [];
const shootingStars = [];
const flyingHearts = [];

/* ----- Textura circular para partículas (evita cuadrados) ----- */
function createParticleTexture(r, g, b) {
  const c = document.createElement('canvas');
  c.width = 64; c.height = 64;
  const ctx = c.getContext('2d');
  const grad = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
  grad.addColorStop(0, `rgba(${r},${g},${b},1)`);
  grad.addColorStop(0.35, `rgba(${r},${g},${b},0.5)`);
  grad.addColorStop(1, `rgba(${r},${g},${b},0)`);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 64, 64);
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
  scene.fog = new THREE.FogExp2(0x050010, 0.005);

  camera = new THREE.PerspectiveCamera(65, window.innerWidth / window.innerHeight, 0.1, 1500);
  camera.position.set(0, 5, 30);

  renderer = new THREE.WebGLRenderer({ canvas, antialias: !isMobile, alpha: false });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.2;
  renderer.setClearColor(0x020008);

  // Controles — zoom custom suave
  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.1;
  controls.minDistance = 8;
  controls.maxDistance = 120;
  controls.autoRotate = true;
  controls.autoRotateSpeed = 0.5;
  controls.enablePan = true;
  controls.rotateSpeed = 0.4;
  controls.enableZoom = false;       // DESACTIVAR zoom nativo
  controls.panSpeed = 0.4;
  controls.touches = { ONE: THREE.TOUCH.ROTATE, TWO: THREE.TOUCH.DOLLY_PAN };
  controls.target.set(0, 0, 0);
  controls.mouseButtons = {
    LEFT: THREE.MOUSE.ROTATE,
    MIDDLE: THREE.MOUSE.PAN,
    RIGHT: THREE.MOUSE.PAN,
  };

  // === ZOOM SUAVE PERSONALIZADO ===
  let targetZoomDistance = camera.position.length(); // distancia actual

  renderer.domElement.addEventListener('wheel', (e) => {
    e.preventDefault();
    const zoomFactor = e.deltaY > 0 ? 1.05 : 0.95; // 5% por scroll step
    targetZoomDistance = Math.max(
      controls.minDistance,
      Math.min(controls.maxDistance, targetZoomDistance * zoomFactor)
    );
  }, { passive: false });

  // Touch pinch para móvil
  let lastTouchDist = 0;
  renderer.domElement.addEventListener('touchstart', (e) => {
    if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      lastTouchDist = Math.sqrt(dx * dx + dy * dy);
    }
  }, { passive: true });
  renderer.domElement.addEventListener('touchmove', (e) => {
    if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (lastTouchDist > 0) {
        const scale = lastTouchDist / dist;
        targetZoomDistance = Math.max(
          controls.minDistance,
          Math.min(controls.maxDistance, targetZoomDistance * (1 + (scale - 1) * 0.3))
        );
      }
      lastTouchDist = dist;
    }
  }, { passive: true });

  // Guardar referencia para el animate loop
  scene.userData.targetZoomDistance = targetZoomDistance;
  scene.userData.getTargetZoom = () => targetZoomDistance;
  scene.userData.setTargetZoom = (v) => { targetZoomDistance = v; };

  // Detener autoRotate al interactuar
  renderer.domElement.addEventListener('pointerdown', () => { controls.autoRotate = false; });
  renderer.domElement.addEventListener('pointerup', () => {
    setTimeout(() => { controls.autoRotate = true; }, 3000);
  });

  buildStarField(isMobile);
  buildNebula(isMobile);
  buildCentralHeartMesh();
  buildPhotoFrames();
  buildQuoteSprites();
  buildShootingStars(isMobile);
  buildFlyingHeartsEmoji(isMobile);
  buildLights();

  window.addEventListener('resize', onWindowResize);
  animate();
}

// --------------- ESTRELLAS ---------------
function buildStarField(isMobile) {
  const count = isMobile ? 3000 : 8000;
  const geo = new THREE.BufferGeometry();
  const pos = new Float32Array(count * 3);

  for (let i = 0; i < count; i++) {
    const i3 = i * 3;
    const r = 40 + Math.random() * 250;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    pos[i3] = r * Math.sin(phi) * Math.cos(theta);
    pos[i3 + 1] = r * Math.sin(phi) * Math.sin(theta);
    pos[i3 + 2] = r * Math.cos(phi);
  }

  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));

  const mat = new THREE.PointsMaterial({
    size: 0.8,
    map: createParticleTexture(255, 255, 255),
    transparent: true,
    opacity: 0.9,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    sizeAttenuation: true,
  });

  const stars = new THREE.Points(geo, mat);
  scene.add(stars);
  scene.userData.starField = stars;
}

// --------------- NEBULOSA ---------------
function buildNebula(isMobile) {
  const count = isMobile ? 200 : 500;
  const geo = new THREE.BufferGeometry();
  const pos = new Float32Array(count * 3);
  const col = new Float32Array(count * 3);

  const palette = [
    new THREE.Color(0xe91e63), new THREE.Color(0x9c27b0),
    new THREE.Color(0x673ab7), new THREE.Color(0xf48fb1), new THREE.Color(0xff4081),
  ];

  for (let i = 0; i < count; i++) {
    const i3 = i * 3;
    const r = 12 + Math.random() * 50;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    pos[i3] = r * Math.sin(phi) * Math.cos(theta);
    pos[i3 + 1] = (r * Math.sin(phi) * Math.sin(theta)) * 0.3;
    pos[i3 + 2] = r * Math.cos(phi);

    const c = palette[Math.floor(Math.random() * palette.length)];
    col[i3] = c.r; col[i3 + 1] = c.g; col[i3 + 2] = c.b;
  }

  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('color', new THREE.BufferAttribute(col, 3));

  const mat = new THREE.PointsMaterial({
    size: 5,
    map: createParticleTexture(255, 120, 180),
    vertexColors: true,
    transparent: true,
    opacity: 0.12,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    sizeAttenuation: true,
  });

  const nebula = new THREE.Points(geo, mat);
  scene.add(nebula);
  scene.userData.nebula = nebula;
}

// --------------- CORAZÓN 3D CENTRAL CON NOMBRE ---------------
function buildCentralHeartMesh() {
  const shape = createHeartShape(3);

  // Corazón principal — sin rotación, shape ya está correcto
  const geo = new THREE.ExtrudeGeometry(shape, {
    depth: 2,
    bevelEnabled: true,
    bevelSegments: 4,
    bevelSize: 0.4,
    bevelThickness: 0.4,
  });
  geo.center();

  const material = new THREE.MeshPhongMaterial({
    color: 0xe91e63,
    emissive: 0xc2185b,
    emissiveIntensity: 0.4,
    specular: 0xffd54f,
    shininess: 80,
    transparent: true,
    opacity: 0.92,
  });

  centralHeart = new THREE.Mesh(geo, material);
  scene.add(centralHeart);

  // Halo de brillo exterior
  const glowGeo = new THREE.ExtrudeGeometry(shape, {
    depth: 0.2, bevelEnabled: true, bevelSize: 1.2, bevelThickness: 0.5, bevelSegments: 3,
  });
  glowGeo.center();
  heartGlow = new THREE.Mesh(glowGeo, new THREE.MeshBasicMaterial({
    color: 0xff4081, transparent: true, opacity: 0.07, side: THREE.BackSide,
  }));
  heartGlow.scale.set(1.4, 1.4, 1.4);
  scene.add(heartGlow);

  // Nombre ESCRITO en el corazón (como hijo del corazón)
  const nc = document.createElement('canvas');
  nc.width = 512; nc.height = 160;
  const nctx = nc.getContext('2d');
  nctx.clearRect(0, 0, nc.width, nc.height);
  // Glow
  nctx.shadowColor = '#ffffff';
  nctx.shadowBlur = 15;
  nctx.font = 'bold 56px Pacifico, cursive';
  nctx.textAlign = 'center';
  nctx.textBaseline = 'middle';
  nctx.fillStyle = '#ffd54f';
  nctx.fillText(CONFIG.name, 256, 80);
  nctx.shadowBlur = 0;
  nctx.fillText(CONFIG.name, 256, 80);

  heartNameSprite = new THREE.Sprite(new THREE.SpriteMaterial({
    map: new THREE.CanvasTexture(nc),
    transparent: true,
    depthTest: false,
  }));
  heartNameSprite.scale.set(7, 2.2, 1);
  heartNameSprite.position.set(0, 0.3, 1.2);  // sobre la cara frontal
  centralHeart.add(heartNameSprite);  // hijo del corazón, se mueve con él
}

// --------------- ESTRELLAS FUGACES (sprites tipo cometa) ---------------
let shootingStarTexture;

function buildShootingStars(isMobile) {
  shootingStarTexture = createShootingStarTexture();
  const count = isMobile ? 4 : 7;
  for (let i = 0; i < count; i++) {
    createShootingStarSprite();
  }
}

function createShootingStarSprite() {
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({
    map: shootingStarTexture,
    transparent: true,
    opacity: 0,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    rotation: 0,
  }));
  sprite.scale.set(12, 0.6, 1);
  resetShootingStar(sprite);
  scene.add(sprite);
  shootingStars.push(sprite);
}

function resetShootingStar(star) {
  const side = Math.random() > 0.5 ? 1 : -1;
  const z = -60 + Math.random() * 120;
  star.position.set(
    side * (50 + Math.random() * 60),
    20 + Math.random() * 50,
    z
  );
  const dirX = -side * (0.4 + Math.random() * 0.3);
  const dirY = -(0.15 + Math.random() * 0.2);
  // Rotación para que apunte en su dirección de movimiento
  const angle = Math.atan2(dirY, dirX);
  star.material.rotation = angle;
  star.userData = {
    speed: 0.3 + Math.random() * 0.3,
    dirX, dirY,
    life: 0,
    maxLife: 150 + Math.random() * 200,
    delay: Math.floor(Math.random() * 400),
  };
  star.material.opacity = 0;
}

// --------------- CORAZONES EMOJI VOLANDO ---------------
function buildFlyingHeartsEmoji(isMobile) {
  const count = isMobile ? 8 : 15;
  const emojis = ['❤️', '💕', '💗', '💖', '💘', '♥️', '💝', '✨'];

  for (let i = 0; i < count; i++) {
    const cvs = document.createElement('canvas');
    cvs.width = 64; cvs.height = 64;
    const ctx = cvs.getContext('2d');
    ctx.font = '48px serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(emojis[i % emojis.length], 32, 36);

    const sprite = new THREE.Sprite(new THREE.SpriteMaterial({
      map: new THREE.CanvasTexture(cvs),
      transparent: true,
      opacity: 0.65,
      depthWrite: false,
    }));

    const r = 20 + Math.random() * 55;
    const theta = Math.random() * Math.PI * 2;
    const y = (Math.random() - 0.5) * 35;

    sprite.position.set(Math.cos(theta) * r, y, Math.sin(theta) * r);
    sprite.scale.set(1.5 + Math.random(), 1.5 + Math.random(), 1);

    sprite.userData = {
      angle: theta, radius: r, yBase: y,
      speed: 0.02 + Math.random() * 0.04,
      bobSpeed: 0.3 + Math.random() * 0.5,
      bobAmp: 0.5 + Math.random() * 1.5,
    };

    flyingHearts.push(sprite);
    scene.add(sprite);
  }
}

// --------------- MARCOS DE FOTOS ---------------
function buildPhotoFrames() {
  const photos = CONFIG.photos;
  if (!photos || photos.length === 0) return;

  photos.forEach((dataUrl, idx) => {
    const texture = new THREE.TextureLoader().load(dataUrl);
    texture.colorSpace = THREE.SRGBColorSpace;

    const size = 3.5;
    const border = 0.3;

    const frame = new THREE.Mesh(
      new THREE.PlaneGeometry(size + border * 2, size + border * 2),
      new THREE.MeshBasicMaterial({ color: 0xffd54f, side: THREE.DoubleSide })
    );

    const inner = new THREE.Mesh(
      new THREE.PlaneGeometry(size + border, size + border),
      new THREE.MeshBasicMaterial({ color: 0x1a0a2e, side: THREE.DoubleSide })
    );
    inner.position.z = 0.005;

    const photo = new THREE.Mesh(
      new THREE.PlaneGeometry(size, size),
      new THREE.MeshBasicMaterial({ map: texture, side: THREE.DoubleSide, transparent: true })
    );
    photo.position.z = 0.01;

    const lc = document.createElement('canvas');
    lc.width = 128; lc.height = 64;
    const lctx = lc.getContext('2d');
    lctx.font = '40px serif';
    lctx.textAlign = 'center';
    lctx.fillText('💕', 64, 45);
    const label = new THREE.Sprite(new THREE.SpriteMaterial({
      map: new THREE.CanvasTexture(lc), transparent: true, opacity: 0.8,
    }));
    label.scale.set(1.5, 0.75, 1);
    label.position.set(0, -(size / 2 + 0.8), 0);

    const group = new THREE.Group();
    group.add(frame); group.add(inner); group.add(photo); group.add(label);

    const angle = (idx / photos.length) * Math.PI * 2;
    const orbitR = 14 + (idx % 3) * 4;
    const yOff = (Math.random() - 0.5) * 10;

    group.position.set(Math.cos(angle) * orbitR, yOff, Math.sin(angle) * orbitR);
    group.rotation.y = -angle + Math.PI;

    group.userData = {
      angle, orbitRadius: orbitR, speed: 0.08 + Math.random() * 0.06,
      bobSpeed: 0.4 + Math.random() * 0.4, bobAmp: 0.25 + Math.random() * 0.3, yBase: yOff,
    };

    photoGroups.push(group);
    scene.add(group);
  });
}

// --------------- SPRITES DE FRASES ---------------
function buildQuoteSprites() {
  const phrases = CONFIG.phrases;
  if (!phrases || phrases.length === 0) return;

  phrases.forEach((quote, idx) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = 640; canvas.height = 128;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.shadowColor = '#e91e63';
    ctx.shadowBlur = 18;
    ctx.font = 'bold 36px "Segoe UI Emoji", "Apple Color Emoji", "Noto Color Emoji", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#ffffff';
    ctx.fillText(quote, canvas.width / 2, canvas.height / 2);

    const sprite = new THREE.Sprite(new THREE.SpriteMaterial({
      map: new THREE.CanvasTexture(canvas), transparent: true, opacity: 0.8,
      blending: THREE.AdditiveBlending, depthWrite: false,
    }));
    sprite.scale.set(10, 2, 1);

    const angle = (idx / phrases.length) * Math.PI * 2 + 0.3;
    const radius = 22 + Math.random() * 10;
    const height = (Math.random() - 0.5) * 18;

    sprite.position.set(Math.cos(angle) * radius, height, Math.sin(angle) * radius);
    sprite.userData = {
      angle, radius, speed: 0.03 + Math.random() * 0.04,
      yBase: height, bobSpeed: 0.25 + Math.random() * 0.3,
    };

    quoteSprites.push(sprite);
    scene.add(sprite);
  });
}

// --------------- LUCES ---------------
function buildLights() {
  scene.add(new THREE.AmbientLight(0x332244, 0.6));

  const p1 = new THREE.PointLight(0xe91e63, 4, 60);
  p1.position.set(0, 5, 5);
  scene.add(p1);

  const p2 = new THREE.PointLight(0xffd54f, 2.5, 50);
  p2.position.set(12, -5, 12);
  scene.add(p2);

  const p3 = new THREE.PointLight(0x9c27b0, 2, 45);
  p3.position.set(-10, 8, -10);
  scene.add(p3);
}

// =============================================
//  6. LOOP DE ANIMACIÓN
// =============================================

function animate() {
  requestAnimationFrame(animate);
  const t = performance.now() * 0.001;

  // Estrellas giran
  const sf = scene.userData.starField;
  if (sf) { sf.rotation.y += 0.0002; sf.rotation.x += 0.00005; }

  // Nebulosa gira
  const neb = scene.userData.nebula;
  if (neb) { neb.rotation.y += 0.0004; }

  // Corazón late (doble pulso realista)
  if (centralHeart) {
    const beat = 1 + Math.sin(t * 2.5) * 0.1 + Math.sin(t * 5) * 0.03;
    centralHeart.scale.set(beat, beat, beat);
    centralHeart.rotation.y = Math.sin(t * 0.3) * 0.15;
  }

  if (heartGlow) {
    const gs = 1.4 + Math.sin(t * 2.5) * 0.15;
    heartGlow.scale.set(gs, gs, gs);
    heartGlow.material.opacity = 0.05 + Math.sin(t * 2.5) * 0.04;
  }

  if (heartNameSprite) {
    heartNameSprite.material.opacity = 0.85 + Math.sin(t * 2) * 0.15;
  }

  // Fotos orbitan
  photoGroups.forEach((g) => {
    const d = g.userData;
    d.angle += d.speed * 0.004;
    g.position.x = Math.cos(d.angle) * d.orbitRadius;
    g.position.z = Math.sin(d.angle) * d.orbitRadius;
    g.position.y = d.yBase + Math.sin(t * d.bobSpeed) * d.bobAmp;
    g.rotation.y = -d.angle + Math.PI;
  });

  // Frases orbitan
  quoteSprites.forEach((s) => {
    const d = s.userData;
    d.angle += d.speed * 0.003;
    s.position.x = Math.cos(d.angle) * d.radius;
    s.position.z = Math.sin(d.angle) * d.radius;
    s.position.y = d.yBase + Math.sin(t * d.bobSpeed) * 0.6;
  });

  // Estrellas fugaces (movimiento suave tipo cometa)
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

  // Zoom suave interpolado (lerp)
  if (scene.userData.getTargetZoom) {
    const target = scene.userData.getTargetZoom();
    const dir = camera.position.clone().sub(controls.target).normalize();
    const currentDist = camera.position.distanceTo(controls.target);
    const newDist = currentDist + (target - currentDist) * 0.05; // lerp 5% por frame
    camera.position.copy(controls.target).add(dir.multiplyScalar(newDist));
  }

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
    // Opcional: Ocultar botón si falla
    // if(btn) btn.classList.add('hidden'); 
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