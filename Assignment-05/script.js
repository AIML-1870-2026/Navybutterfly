// === Configuration ===
const GRID = 256;
const CANVAS = 512;
const DU = 0.2097;
const DV = 0.105;
const DT = 1.0;
const BRUSH_RADIUS = 16;
const STEPS_PER_FRAME = 8;

// === Presets ===
const PRESETS = {
  leopard: { f: 0.035, k: 0.065, biome: 'jungle', desc: 'Leopard spots emerge from simple chemical rules' },
  zebra:   { f: 0.035, k: 0.060, biome: 'savannah', desc: 'Classic stripe patterns found in African wildlife' },
  coral:   { f: 0.039, k: 0.058, biome: 'underwater', desc: 'Brain coral textures from the ocean depths' },
  giraffe: { f: 0.029, k: 0.057, biome: 'sunset', desc: 'Giraffe patch patterns across the savannah' },
  maze:    { f: 0.029, k: 0.057, biome: 'desert', desc: 'Self-organizing maze patterns' },
  mitosis: { f: 0.014, k: 0.054, biome: 'microscopic', desc: 'Cellular division patterns at microscopic scale' },
};

// === Color Schemes ===
// v typically ranges 0..~0.5 in Gray-Scott; we scale to 0..1 for color mapping
function normalizeV(val) {
  return Math.min(1, Math.max(0, val * 2.5));
}

const COLOR_SCHEMES = {
  natural: (v) => {
    const t = normalizeV(v);
    return [
      Math.floor(220 - 170 * t),
      Math.floor(190 - 155 * t),
      Math.floor(120 - 95 * t),
    ];
  },
  ocean: (v) => {
    const t = normalizeV(v);
    return [
      Math.floor(15 + 30 * t),
      Math.floor(200 - 130 * t),
      Math.floor(255 - 100 * t),
    ];
  },
  thermal: (v) => {
    const t = normalizeV(v);
    if (t < 0.25) {
      const s = t / 0.25;
      return [Math.floor(20 + 80 * s), Math.floor(5 + 5 * s), Math.floor(80 + 60 * s)];
    } else if (t < 0.5) {
      const s = (t - 0.25) / 0.25;
      return [Math.floor(100 + 140 * s), Math.floor(10 + 20 * s), Math.floor(140 - 100 * s)];
    } else if (t < 0.75) {
      const s = (t - 0.5) / 0.25;
      return [Math.floor(240 + 15 * s), Math.floor(30 + 190 * s), Math.floor(40 - 30 * s)];
    } else {
      const s = (t - 0.75) / 0.25;
      return [255, Math.floor(220 + 35 * s), Math.floor(10 + 245 * s)];
    }
  },
};

// === State ===
let u = new Float32Array(GRID * GRID);
let v = new Float32Array(GRID * GRID);
let uNext = new Float32Array(GRID * GRID);
let vNext = new Float32Array(GRID * GRID);

let currentPreset = 'leopard';
let currentColor = 'natural';
let currentF = 0.035;
let currentK = 0.065;
let paused = false;
let animId = null;

// === DOM ===
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
ctx.imageSmoothingEnabled = true;

// Offscreen canvas at simulation resolution for putImageData
const offscreen = document.createElement('canvas');
offscreen.width = GRID;
offscreen.height = GRID;
const offCtx = offscreen.getContext('2d');
const imageData = offCtx.createImageData(GRID, GRID);
const descEl = document.getElementById('preset-description');
const bgCurrent = document.getElementById('biome-bg');
const bgNext = document.getElementById('biome-bg-next');
const btnPause = document.getElementById('btn-pause');
const paramCanvas = document.getElementById('param-space');
const paramCtx = paramCanvas.getContext('2d');
const sliderF = document.getElementById('slider-f');
const sliderK = document.getElementById('slider-k');
const valueF = document.getElementById('value-f');
const valueK = document.getElementById('value-k');

// === Parameter Space ===
const F_MIN = 0, F_MAX = 0.08;
const K_MIN = 0.045, K_MAX = 0.07;

function drawParamSpace() {
  const w = paramCanvas.width;
  const h = paramCanvas.height;
  const imgData = paramCtx.createImageData(w, h);
  const d = imgData.data;

  // Color-coded background based on approximate Gray-Scott regions
  for (let py = 0; py < h; py++) {
    for (let px = 0; px < w; px++) {
      const f = F_MIN + (px / w) * (F_MAX - F_MIN);
      const k = K_MIN + (py / h) * (K_MAX - K_MIN);
      const idx = (py * w + px) * 4;

      // Approximate region coloring based on f/k ratio
      const ratio = f / (k + 0.001);
      const stability = Math.min(1, Math.max(0, (f + k - 0.06) * 20));

      let r, g, b;
      if (f < 0.02) {
        // Waves/mitosis region - purple
        r = 50 + stability * 30;
        g = 20 + stability * 15;
        b = 80 + stability * 30;
      } else if (ratio > 0.55) {
        // Spots region - warm
        r = 70 + ratio * 50;
        g = 50 + stability * 30;
        b = 30;
      } else if (ratio > 0.45) {
        // Stripes region - teal
        r = 20;
        g = 60 + ratio * 40;
        b = 70 + stability * 20;
      } else {
        // Maze/coral region - blue-green
        r = 25;
        g = 45 + ratio * 30;
        b = 55 + stability * 25;
      }

      d[idx] = r;
      d[idx + 1] = g;
      d[idx + 2] = b;
      d[idx + 3] = 255;
    }
  }

  paramCtx.putImageData(imgData, 0, 0);

  // Region labels
  paramCtx.font = '10px system-ui';
  paramCtx.fillStyle = 'rgba(255,255,255,0.3)';
  paramCtx.fillText('Waves', 20, 80);
  paramCtx.fillText('Spots', 220, 50);
  paramCtx.fillText('Stripes', 140, 120);
  paramCtx.fillText('Maze', 100, 170);

  // Preset dots
  paramCtx.fillStyle = 'rgba(255,255,255,0.5)';
  for (const key of Object.keys(PRESETS)) {
    const p = PRESETS[key];
    const px = ((p.f - F_MIN) / (F_MAX - F_MIN)) * w;
    const py = ((p.k - K_MIN) / (K_MAX - K_MIN)) * h;
    paramCtx.beginPath();
    paramCtx.arc(px, py, 3, 0, Math.PI * 2);
    paramCtx.fill();
  }

  // Current position marker
  const cx = ((currentF - F_MIN) / (F_MAX - F_MIN)) * w;
  const cy = ((currentK - K_MIN) / (K_MAX - K_MIN)) * h;
  paramCtx.strokeStyle = '#fff';
  paramCtx.lineWidth = 2;
  paramCtx.beginPath();
  paramCtx.arc(cx, cy, 7, 0, Math.PI * 2);
  paramCtx.stroke();
  paramCtx.beginPath();
  paramCtx.moveTo(cx - 11, cy);
  paramCtx.lineTo(cx + 11, cy);
  paramCtx.moveTo(cx, cy - 11);
  paramCtx.lineTo(cx, cy + 11);
  paramCtx.strokeStyle = 'rgba(255,255,255,0.4)';
  paramCtx.lineWidth = 1;
  paramCtx.stroke();
}

// Click on parameter space
paramCanvas.addEventListener('click', (e) => {
  const rect = paramCanvas.getBoundingClientRect();
  const scaleX = paramCanvas.width / rect.width;
  const scaleY = paramCanvas.height / rect.height;
  const px = (e.clientX - rect.left) * scaleX;
  const py = (e.clientY - rect.top) * scaleY;

  currentF = Math.max(F_MIN, Math.min(F_MAX, F_MIN + (px / paramCanvas.width) * (F_MAX - F_MIN)));
  currentK = Math.max(K_MIN, Math.min(K_MAX, K_MIN + (py / paramCanvas.height) * (K_MAX - K_MIN)));

  // Deselect presets
  document.querySelectorAll('.preset-btn').forEach((b) => b.classList.remove('active'));
  descEl.textContent = `Custom: F=${currentF.toFixed(3)}, K=${currentK.toFixed(3)}`;

  updateSliders();
  drawParamSpace();
  initGrid();
});

// === Slider Controls ===
let sliderDebounce = null;

function updateSliders() {
  sliderF.value = currentF;
  sliderK.value = currentK;
  valueF.textContent = currentF.toFixed(3);
  valueK.textContent = currentK.toFixed(3);
}

function onSliderInput() {
  currentF = parseFloat(sliderF.value);
  currentK = parseFloat(sliderK.value);
  valueF.textContent = currentF.toFixed(3);
  valueK.textContent = currentK.toFixed(3);

  // Deselect presets
  document.querySelectorAll('.preset-btn').forEach((b) => b.classList.remove('active'));
  descEl.textContent = `Custom: F=${currentF.toFixed(3)}, K=${currentK.toFixed(3)}`;

  drawParamSpace();

  clearTimeout(sliderDebounce);
  sliderDebounce = setTimeout(() => initGrid(), 200);
}

sliderF.addEventListener('input', onSliderInput);
sliderK.addEventListener('input', onSliderInput);

// === Save Image ===
document.getElementById('btn-save').addEventListener('click', () => {
  const link = document.createElement('a');
  link.download = `turing-${currentPreset}-${Date.now()}.png`;
  link.href = canvas.toDataURL('image/png');
  link.click();
});

// === Initialization ===
function initGrid() {
  u.fill(1);
  v.fill(0);
  // Seed random patches of chemical v
  const numSeeds = 20 + Math.floor(Math.random() * 15);
  for (let s = 0; s < numSeeds; s++) {
    const cx = Math.floor(Math.random() * GRID);
    const cy = Math.floor(Math.random() * GRID);
    const r = 3 + Math.floor(Math.random() * 4);
    for (let dy = -r; dy <= r; dy++) {
      for (let dx = -r; dx <= r; dx++) {
        if (dx * dx + dy * dy <= r * r) {
          const x = (cx + dx + GRID) % GRID;
          const y = (cy + dy + GRID) % GRID;
          const idx = y * GRID + x;
          u[idx] = 0.5;
          v[idx] = 0.25;
        }
      }
    }
  }
}

// === Simulation Step ===
function step() {
  const f = currentF, k = currentK;

  for (let y = 0; y < GRID; y++) {
    const yUp = ((y - 1) + GRID) % GRID;
    const yDn = (y + 1) % GRID;

    for (let x = 0; x < GRID; x++) {
      const xLt = ((x - 1) + GRID) % GRID;
      const xRt = (x + 1) % GRID;

      const idx = y * GRID + x;

      const uVal = u[idx];
      const vVal = v[idx];

      // Laplacian (5-point stencil)
      const lapU = u[yUp * GRID + x] + u[yDn * GRID + x]
                 + u[y * GRID + xLt] + u[y * GRID + xRt]
                 - 4 * uVal;
      const lapV = v[yUp * GRID + x] + v[yDn * GRID + x]
                 + v[y * GRID + xLt] + v[y * GRID + xRt]
                 - 4 * vVal;

      const uvv = uVal * vVal * vVal;

      uNext[idx] = uVal + DT * (DU * lapU - uvv + f * (1 - uVal));
      vNext[idx] = vVal + DT * (DV * lapV + uvv - (f + k) * vVal);
    }
  }

  // Swap buffers
  [u, uNext] = [uNext, u];
  [v, vNext] = [vNext, v];
}

// === Rendering ===
function render() {
  const colorFn = COLOR_SCHEMES[currentColor];
  const data = imageData.data;

  for (let i = 0; i < GRID * GRID; i++) {
    const val = v[i];
    const [r, g, b] = colorFn(val);
    const p = i * 4;
    data[p] = r;
    data[p + 1] = g;
    data[p + 2] = b;
    data[p + 3] = 255;
  }

  offCtx.putImageData(imageData, 0, 0);
  ctx.drawImage(offscreen, 0, 0, GRID, GRID, 0, 0, CANVAS, CANVAS);
}

// === Animation Loop ===
function loop() {
  if (!paused) {
    for (let i = 0; i < STEPS_PER_FRAME; i++) {
      step();
    }
    render();
  }
  animId = requestAnimationFrame(loop);
}

// === Background Transitions ===
function setBiome(biome) {
  const biomeClass = 'biome-' + biome;

  // If already showing the same biome, skip
  if (bgCurrent.classList.contains(biomeClass)) return;

  // Setup next bg behind current
  bgNext.className = 'biome-bg ' + biomeClass;
  bgNext.style.opacity = '0';

  // Force reflow
  bgNext.offsetHeight;

  // Fade next in, current out
  bgNext.style.transition = 'opacity 0.6s ease';
  bgNext.style.opacity = '0.4';
  bgCurrent.style.transition = 'opacity 0.6s ease';
  bgCurrent.style.opacity = '0';

  setTimeout(() => {
    bgCurrent.className = 'biome-bg ' + biomeClass;
    bgCurrent.style.transition = 'none';
    bgCurrent.style.opacity = '0.4';
    bgNext.style.transition = 'none';
    bgNext.style.opacity = '0';
  }, 620);
}

// === Canvas Interaction ===
let isDrawing = false;

function disturbAt(canvasX, canvasY) {
  const gx = Math.floor((canvasX / CANVAS) * GRID);
  const gy = Math.floor((canvasY / CANVAS) * GRID);

  for (let dy = -BRUSH_RADIUS; dy <= BRUSH_RADIUS; dy++) {
    for (let dx = -BRUSH_RADIUS; dx <= BRUSH_RADIUS; dx++) {
      if (dx * dx + dy * dy <= BRUSH_RADIUS * BRUSH_RADIUS) {
        const x = (gx + dx + GRID) % GRID;
        const y = (gy + dy + GRID) % GRID;
        const idx = y * GRID + x;
        u[idx] = 0.5;
        v[idx] = 0.25;
      }
    }
  }
}

function getCanvasPos(e) {
  const rect = canvas.getBoundingClientRect();
  const scaleX = CANVAS / rect.width;
  const scaleY = CANVAS / rect.height;
  return {
    x: (e.clientX - rect.left) * scaleX,
    y: (e.clientY - rect.top) * scaleY,
  };
}

canvas.addEventListener('mousedown', (e) => {
  isDrawing = true;
  const pos = getCanvasPos(e);
  disturbAt(pos.x, pos.y);
});

canvas.addEventListener('mousemove', (e) => {
  if (!isDrawing) return;
  const pos = getCanvasPos(e);
  disturbAt(pos.x, pos.y);
});

canvas.addEventListener('mouseup', () => { isDrawing = false; });
canvas.addEventListener('mouseleave', () => { isDrawing = false; });

// Touch support
canvas.addEventListener('touchstart', (e) => {
  e.preventDefault();
  isDrawing = true;
  const touch = e.touches[0];
  const pos = getCanvasPos(touch);
  disturbAt(pos.x, pos.y);
}, { passive: false });

canvas.addEventListener('touchmove', (e) => {
  e.preventDefault();
  if (!isDrawing) return;
  const touch = e.touches[0];
  const pos = getCanvasPos(touch);
  disturbAt(pos.x, pos.y);
}, { passive: false });

canvas.addEventListener('touchend', () => { isDrawing = false; });

// === Preset Buttons ===
document.querySelectorAll('.preset-btn').forEach((btn) => {
  btn.addEventListener('click', () => {
    const preset = btn.dataset.preset;

    currentPreset = preset;
    currentF = PRESETS[preset].f;
    currentK = PRESETS[preset].k;
    descEl.textContent = PRESETS[preset].desc;

    // Update active state
    document.querySelectorAll('.preset-btn').forEach((b) => b.classList.remove('active'));
    btn.classList.add('active');

    // Sync controls
    updateSliders();
    drawParamSpace();

    // Change biome
    setBiome(PRESETS[preset].biome);

    // Reset simulation
    initGrid();
  });
});

// === Color Scheme Buttons ===
document.querySelectorAll('.color-btn').forEach((btn) => {
  btn.addEventListener('click', () => {
    const color = btn.dataset.color;
    currentColor = color;

    document.querySelectorAll('.color-btn').forEach((b) => b.classList.remove('active'));
    btn.classList.add('active');
  });
});

// === Action Buttons ===
document.getElementById('btn-reset').addEventListener('click', () => {
  initGrid();
});

btnPause.addEventListener('click', () => {
  paused = !paused;
  btnPause.textContent = paused ? 'Play' : 'Pause';
});

// === Start ===
drawParamSpace();
initGrid();
loop();
