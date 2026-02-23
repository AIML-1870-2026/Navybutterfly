/* ============================================================
   RGB Color Studio — script.js
   AIML 1870 | Assignment-08
   ============================================================

   Sections:
   1. Color Math (RGB ↔ HSL, contrast, blindness matrices)
   2. Blob / Slider UI Interactions
   3. Palette Generator
   4. Color Theory Coach text updates
   5. Clipboard + Toast
   ============================================================ */

'use strict';

/* ============================================================
   1. COLOR MATH
   ============================================================ */

/** Convert RGB (0-255 each) to HSL (h:0-360, s:0-1, l:0-1) */
function rgbToHsl(r, g, b) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h, s;
  const l = (max + min) / 2;
  const d = max - min;
  if (d === 0) {
    h = 0; s = 0;
  } else {
    s = d / (1 - Math.abs(2 * l - 1));
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }
  return { h: h * 360, s, l };
}

/** Convert HSL (h:0-360, s:0-1, l:0-1) to RGB (0-255 each) */
function hslToRgb(h, s, l) {
  h = ((h % 360) + 360) % 360;
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs((h / 60) % 2 - 1));
  const m = l - c / 2;
  let r = 0, g = 0, b = 0;
  if      (h < 60)  { r = c; g = x; }
  else if (h < 120) { r = x; g = c; }
  else if (h < 180) { g = c; b = x; }
  else if (h < 240) { g = x; b = c; }
  else if (h < 300) { r = x; b = c; }
  else              { r = c; b = x; }
  return {
    r: Math.round((r + m) * 255),
    g: Math.round((g + m) * 255),
    b: Math.round((b + m) * 255)
  };
}

/** Hex string from r,g,b */
function rgbToHex(r, g, b) {
  return '#' + [r, g, b].map(v => v.toString(16).padStart(2, '0')).join('').toUpperCase();
}

/** Parse "#RRGGBB" → {r,g,b} */
function hexToRgb(hex) {
  hex = hex.replace('#', '');
  return {
    r: parseInt(hex.slice(0,2), 16),
    g: parseInt(hex.slice(2,4), 16),
    b: parseInt(hex.slice(4,6), 16)
  };
}

/** WCAG relative luminance (linearised) */
function luminance(r, g, b) {
  const lin = v => {
    v /= 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}

/** WCAG contrast ratio between two RGB triples */
function contrastRatio(r1, g1, b1, r2, g2, b2) {
  const L1 = luminance(r1, g1, b1);
  const L2 = luminance(r2, g2, b2);
  const bright = Math.max(L1, L2);
  const dark   = Math.min(L1, L2);
  return (bright + 0.05) / (dark + 0.05);
}

/**
 * Color blindness simulation matrices (LMS-based, Machado et al. 2009)
 * Each is a 3×3 matrix applied to linearised RGB.
 */
const CB_MATRICES = {
  normal:       [[1,0,0],[0,1,0],[0,0,1]],
  protanopia:   [[0.1121, 0.8853, -0.0005],  [0.1127, 0.8897, -0.0001], [0.0042, -0.0118, 1.0076]],
  deuteranopia: [[0.2990, 0.6670, 0.0340],   [0.2990, 0.6670, 0.0340],  [-0.0140, 0.0270, 0.9870]],
  tritanopia:   [[1.0000, 0.1288, -0.1288],  [-0.0000, 0.8753, 0.1248], [0.0000, 0.2972, 0.7028]]
};

/** Apply a color-blindness matrix to an {r,g,b} object */
function applyMatrix(r, g, b, matrix) {
  const [m0, m1, m2] = matrix;
  return {
    r: Math.max(0, Math.min(255, Math.round(m0[0]*r + m0[1]*g + m0[2]*b))),
    g: Math.max(0, Math.min(255, Math.round(m1[0]*r + m1[1]*g + m1[2]*b))),
    b: Math.max(0, Math.min(255, Math.round(m2[0]*r + m2[1]*g + m2[2]*b)))
  };
}

/**
 * Simple algorithmic color namer using HSL ranges.
 * Returns an evocative name string.
 */
function nameColor(r, g, b) {
  const { h, s, l } = rgbToHsl(r, g, b);
  if (s < 0.08) {
    if (l < 0.15) return 'Pitch Black';
    if (l < 0.35) return 'Charcoal';
    if (l < 0.55) return 'Slate Gray';
    if (l < 0.75) return 'Silver';
    return 'Ghost White';
  }
  if (l < 0.12) return 'Deep Shadow';
  if (l > 0.92) return 'Bright White';
  const hue = h;
  if (hue < 15)  return l > 0.5 ? 'Coral' : 'Brick Red';
  if (hue < 30)  return l > 0.5 ? 'Peach' : 'Burnt Orange';
  if (hue < 45)  return l > 0.5 ? 'Sand' : 'Amber';
  if (hue < 60)  return l > 0.5 ? 'Maize' : 'Golden';
  if (hue < 75)  return s > 0.6 ? 'Chartreuse' : 'Olive';
  if (hue < 120) return l > 0.55 ? 'Seafoam' : 'Forest Green';
  if (hue < 150) return 'Mint';
  if (hue < 180) return 'Teal';
  if (hue < 210) return l > 0.55 ? 'Sky Blue' : 'Cerulean';
  if (hue < 240) return l > 0.55 ? 'Periwinkle' : 'Royal Blue';
  if (hue < 270) return 'Indigo';
  if (hue < 300) return l > 0.55 ? 'Lavender' : 'Violet';
  if (hue < 330) return l > 0.55 ? 'Dusty Mauve' : 'Plum';
  return l > 0.55 ? 'Blush' : 'Crimson';
}

/**
 * Generate palette colors (as {r,g,b} objects) for a given harmony type.
 * Base hue/sat/light come from the current mixed color.
 */
function generatePalette(r, g, b, harmony) {
  const { h, s, l } = rgbToHsl(r, g, b);
  const sat  = Math.max(0.4, s);
  const lit  = l < 0.15 ? 0.45 : l > 0.85 ? 0.55 : l;

  const make = hue => hslToRgb(hue, sat, lit);

  switch (harmony) {
    case 'complementary':
      return [{ r, g, b }, make(h + 180)];

    case 'analogous':
      return [make(h - 30), { r, g, b }, make(h + 30)];

    case 'triadic':
      return [{ r, g, b }, make(h + 120), make(h + 240)];

    case 'split-complementary':
      return [{ r, g, b }, make(h + 150), make(h + 210)];

    case 'tetradic':
      return [{ r, g, b }, make(h + 90), make(h + 180), make(h + 270)];

    default:
      return [{ r, g, b }];
  }
}

/* ============================================================
   2. PAINT SPLATTER / SLIDER / TUBE INTERACTIONS
   ============================================================ */

/* -- State -- */
const state = {
  r: 0, g: 0, b: 0,
  harmony: 'complementary',
  cbMode: 'normal'
};

/* -- DOM References -- */
const sliderR = document.getElementById('slider-r');
const sliderG = document.getElementById('slider-g');
const sliderB = document.getElementById('slider-b');
const valR    = document.getElementById('val-r');
const valG    = document.getElementById('val-g');
const valB    = document.getElementById('val-b');
const tubeR   = document.getElementById('tube-r');
const tubeG   = document.getElementById('tube-g');
const tubeB   = document.getElementById('tube-b');

const resultSwatch = document.getElementById('result-swatch');
const resultRgb    = document.getElementById('result-rgb');
const resultHex    = document.getElementById('result-hex');
const baseSwatch   = document.getElementById('base-swatch');
const baseHex      = document.getElementById('base-hex');
const teachingText = document.getElementById('teaching-text');

/* ── Splatter path shapes (paths centered at 0,0, ~42px radius) ── */
const SPLATTER_PATHS = [
  // Classic 7-point star splat
  "M0,-42 L10,-18 L38,-25 L22,-3 L48,12 L22,16 L30,44 L6,26 L-10,50 L-14,24 L-42,36 L-26,10 L-50,0 L-24,-14 L-35,-38 L-10,-20 Z",
  // Organic drip blob
  "M-8,-40 L8,-44 L28,-34 L38,-12 L44,8 L36,26 L40,48 L22,42 L20,26 L8,44 L-10,48 L-24,36 L-40,22 L-44,4 L-40,-18 L-28,-34 Z",
  // Spiky asymmetric splat
  "M0,-36 L6,-22 L20,-40 L16,-14 L38,-20 L22,-2 L44,4 L24,14 L40,32 L20,20 L16,46 L4,26 L-8,48 L-10,26 L-30,44 L-20,18 L-46,28 L-28,8 L-48,-6 L-26,-18 L-36,-38 L-14,-20 Z",
  // Chunky irregular blob
  "M4,-38 L20,-28 L34,-14 L42,6 L38,26 L26,40 L6,46 L-16,44 L-32,30 L-42,10 L-38,-12 L-26,-30 L-10,-42 Z",
  // Asymmetric drip splat
  "M-4,-36 L10,-42 L24,-28 L36,-8 L44,16 L38,32 L44,52 L28,46 L20,28 L10,46 L-4,50 L-18,40 L-32,22 L-44,4 L-42,-18 L-30,-32 Z",
  // Star with tails
  "M0,-44 L8,-20 L28,-36 L20,-10 L44,-18 L28,2 L50,10 L28,18 L42,34 L18,22 L20,48 L6,28 L-8,50 L-10,28 L-28,44 L-18,22 L-44,32 L-26,12 L-50,6 L-28,-4 L-40,-20 L-16,-12 L-26,-38 L-6,-18 Z"
];

/* ── Splatter storage ── */
const MAX_SPLATTERS = 15;
const splatters     = { r: [], g: [], b: [] };
const SPLAT_CX      = 260;   // horizontal center of palette (avoids thumbhole)
const SPLAT_CY      = 190;   // vertical center of palette
const CHANNEL_COLOR = { r: '#FF0000', g: '#00FF00', b: '#0000FF' };

/**
 * Spawn `count` new splatters for a channel into the SVG.
 * Positions are randomly offset from the palette center.
 */
function addSplatters(channel, count) {
  const arr   = splatters[channel];
  const group = document.getElementById('splatter-group');
  const t     = state[channel] / 255;

  // Evict oldest when at capacity
  while (arr.length >= MAX_SPLATTERS) {
    arr.shift().el.remove();
  }

  for (let i = 0; i < count; i++) {
    const pathData = SPLATTER_PATHS[Math.floor(Math.random() * SPLATTER_PATHS.length)];
    const ox   = (Math.random() - 0.5) * 100;   // ±50 px horizontal spread
    const oy   = (Math.random() - 0.5) *  70;   // ±35 px vertical spread
    const rot  = Math.random() * 360;
    const size = 0.65 + Math.random() * 0.7;    // 0.65–1.35 per-splatter size variation
    const tx   = SPLAT_CX + ox;
    const ty   = SPLAT_CY + oy;

    const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    g.setAttribute('transform',
      `translate(${tx.toFixed(1)},${ty.toFixed(1)}) rotate(${rot.toFixed(1)}) scale(${(t * size).toFixed(3)})`);
    g.dataset.tx   = tx;
    g.dataset.ty   = ty;
    g.dataset.rot  = rot;
    g.dataset.size = size;

    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d',       pathData);
    path.setAttribute('fill',    CHANNEL_COLOR[channel]);
    path.setAttribute('opacity', '0.6');

    g.appendChild(path);
    group.appendChild(g);
    arr.push({ el: g, size });
  }
}

/**
 * Rescale all existing splatters for a channel to the current slider value.
 * Auto-seeds 5 splatters on first non-zero slider move if none exist yet.
 */
function scaleSplatters(channel) {
  const t = state[channel] / 255;
  if (splatters[channel].length === 0 && t > 0) {
    addSplatters(channel, 5);
    return; // addSplatters already wrote the correct scale
  }
  splatters[channel].forEach(sp => {
    sp.el.setAttribute('transform',
      `translate(${parseFloat(sp.el.dataset.tx).toFixed(1)},${parseFloat(sp.el.dataset.ty).toFixed(1)})` +
      ` rotate(${parseFloat(sp.el.dataset.rot).toFixed(1)})` +
      ` scale(${(t * parseFloat(sp.el.dataset.size)).toFixed(3)})`);
  });
}

/* ============================================================
   2b. DRAGGABLE PAINT BLOBS
   ============================================================ */

const paletteSvg    = document.getElementById('palette-svg');
const blobPositions = { r: { x: 185, y: 190 }, g: { x: 325, y: 190 }, b: { x: 255, y: 155 } };
const blobEls       = {};
let   dragState     = null;   // { channel, offsetX, offsetY }

/** Convert a mouse/touch ClientX/Y to SVG coordinate space */
function getSVGPoint(e) {
  const pt = paletteSvg.createSVGPoint();
  if (e.touches) { pt.x = e.touches[0].clientX; pt.y = e.touches[0].clientY; }
  else           { pt.x = e.clientX;             pt.y = e.clientY; }
  return pt.matrixTransform(paletteSvg.getScreenCTM().inverse());
}

/** Build the three draggable blobs and add them to #blob-group */
function createBlobEls() {
  const group  = document.getElementById('blob-group');
  const colors = { r: '#FF0000', g: '#00FF00', b: '#0000FF' };

  ['r', 'g', 'b'].forEach(ch => {
    const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    g.id = `blob-${ch}`;
    g.style.cursor = 'grab';

    // Main blob circle (cx/cy = 0 because the <g> handles translation)
    const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    circle.setAttribute('cx', '0');
    circle.setAttribute('cy', '0');
    circle.setAttribute('r',  '8');
    circle.setAttribute('fill', colors[ch]);

    // Glossy highlight — scales with blob radius in updateBlobAppearance
    const shine = document.createElementNS('http://www.w3.org/2000/svg', 'ellipse');
    shine.setAttribute('cx', '-5');
    shine.setAttribute('cy', '-7');
    shine.setAttribute('rx', '8');
    shine.setAttribute('ry', '5');
    shine.setAttribute('fill', 'rgba(255,255,255,0.38)');
    shine.setAttribute('pointer-events', 'none');

    g.appendChild(circle);
    g.appendChild(shine);
    group.appendChild(g);
    blobEls[ch] = { g, circle, shine };

    setupBlobDrag(g, ch);
  });
}

/** Sync a blob's position, radius, and opacity to the current state */
function updateBlobAppearance(ch) {
  if (!blobEls[ch]) return;
  const t  = state[ch] / 255;
  const r  = 8 + t * 44;            // radius 8 → 52
  const op = 0.08 + t * 0.77;       // opacity 0.08 → 0.85
  const { g, circle, shine } = blobEls[ch];
  const { x, y } = blobPositions[ch];

  g.setAttribute('transform', `translate(${x},${y})`);
  g.setAttribute('opacity', op.toFixed(3));
  circle.setAttribute('r', r.toFixed(1));

  // Keep highlight proportional to blob size
  shine.setAttribute('cx', (-r * 0.28).toFixed(1));
  shine.setAttribute('cy', (-r * 0.30).toFixed(1));
  shine.setAttribute('rx', (r * 0.38).toFixed(1));
  shine.setAttribute('ry', (r * 0.26).toFixed(1));
}

/** Wire mouse + touch drag to a blob <g> element */
function setupBlobDrag(el, ch) {
  el.addEventListener('mousedown',  e => startBlobDrag(e, ch));
  el.addEventListener('touchstart', e => startBlobDrag(e, ch), { passive: false });
}

function startBlobDrag(e, ch) {
  e.preventDefault();
  const pt = getSVGPoint(e);
  dragState = {
    channel: ch,
    offsetX: pt.x - blobPositions[ch].x,
    offsetY: pt.y - blobPositions[ch].y
  };
  blobEls[ch].g.style.cursor = 'grabbing';
}

function onBlobMouseMove(e) {
  if (!dragState) return;
  const pt = getSVGPoint(e);
  const ch = dragState.channel;
  // Clamp to rough palette interior (avoids thumbhole region and edges)
  blobPositions[ch].x = Math.max(80,  Math.min(435, pt.x - dragState.offsetX));
  blobPositions[ch].y = Math.max(65,  Math.min(305, pt.y - dragState.offsetY));
  updateBlobAppearance(ch);
}

function onBlobMouseUp() {
  if (!dragState) return;
  const ch = dragState.channel;
  blobEls[ch].g.style.cursor = 'grab';
  // Jiggle on release
  triggerBlobAnim(blobEls[ch].circle, 'blob-jiggle');
  dragState = null;
}

document.addEventListener('mousemove', onBlobMouseMove);
document.addEventListener('mouseup',   onBlobMouseUp);
document.addEventListener('touchmove',
  e => { if (dragState) { e.preventDefault(); onBlobMouseMove(e); } },
  { passive: false }
);
document.addEventListener('touchend', onBlobMouseUp);

/** Master update — runs every time r/g/b changes */
function updateAll() {
  const { r, g, b } = state;
  const hex = rgbToHex(r, g, b);

  // Slider labels
  valR.textContent = r; tubeR.textContent = r;
  valG.textContent = g; tubeG.textContent = g;
  valB.textContent = b; tubeB.textContent = b;

  // Result swatch + info
  const colorStr = `rgb(${r},${g},${b})`;
  resultSwatch.style.backgroundColor = colorStr;
  resultSwatch.style.boxShadow = `3px 3px 0 #1A1A2E, 0 0 22px ${colorStr}66`;
  resultRgb.textContent = `rgb(${r}, ${g}, ${b})`;
  resultHex.textContent = hex;

  // Base swatch in palette card
  baseSwatch.style.backgroundColor = colorStr;
  baseHex.textContent = hex;

  // Scale splatters to match slider values
  ['r', 'g', 'b'].forEach(ch => scaleSplatters(ch));

  // Sync draggable blob sizes/opacities
  ['r', 'g', 'b'].forEach(ch => updateBlobAppearance(ch));

  // Teaching callout
  updateTeaching(r, g, b);

  // Coach
  updateCoach(r, g, b);

  // Palette
  renderPalette();
}

/** Restart a CSS animation class on an SVG element */
function triggerBlobAnim(el, cls) {
  el.classList.remove('blob-deflate', 'blob-pop', 'blob-jiggle');
  void el.getBoundingClientRect(); // force reflow so animation restarts
  el.classList.add(cls);
  el.addEventListener('animationend', () => el.classList.remove(cls), { once: true });
}

/** Sync sliders → state */
function onSliderInput(channel, val) {
  const prev = state[channel];
  state[channel] = parseInt(val, 10);
  const cur = state[channel];

  // Blob extreme animations
  if (blobEls[channel]) {
    if      (cur === 0   && prev !== 0)   triggerBlobAnim(blobEls[channel].circle, 'blob-deflate');
    else if (cur === 255 && prev !== 255) triggerBlobAnim(blobEls[channel].circle, 'blob-pop');
  }

  updateAll();
}

sliderR.addEventListener('input', () => onSliderInput('r', sliderR.value));
sliderG.addEventListener('input', () => onSliderInput('g', sliderG.value));
sliderB.addEventListener('input', () => onSliderInput('b', sliderB.value));

/* ── Tube click handlers ── */
function onTubeClick(channel) {
  // Bump slider +30, capped at 255
  state[channel] = Math.min(255, state[channel] + 30);
  const slider = channel === 'r' ? sliderR : channel === 'g' ? sliderG : sliderB;
  slider.value = state[channel];

  // Spawn 5 new splatters at the current (post-bump) scale
  addSplatters(channel, 5);

  // Squeeze animation on the tube SVG group
  const animCls = channel === 'b' ? 'tube-squish-v' : 'tube-squish';
  const tubeEl  = document.getElementById(`svg-tube-${channel}`);
  tubeEl.classList.remove('tube-squish', 'tube-squish-v');
  void tubeEl.getBoundingClientRect(); // force reflow to restart animation
  tubeEl.classList.add(animCls);
  tubeEl.addEventListener('animationend', () => tubeEl.classList.remove(animCls), { once: true });

  updateAll();
}

document.getElementById('svg-tube-r').addEventListener('click', () => onTubeClick('r'));
document.getElementById('svg-tube-g').addEventListener('click', () => onTubeClick('g'));
document.getElementById('svg-tube-b').addEventListener('click', () => onTubeClick('b'));

/* ============================================================
   3. PALETTE GENERATOR
   ============================================================ */

let currentPaletteColors = [];

/** Build the mini color wheel SVG */
function buildMiniWheel() {
  const seg = document.getElementById('wheel-segments');
  const cx = 60, cy = 60, r = 48, slices = 36;
  const step = 360 / slices;
  let html = '';
  for (let i = 0; i < slices; i++) {
    const startDeg = i * step - 90;
    const endDeg   = startDeg + step;
    const s1 = startDeg * Math.PI / 180;
    const e1 = endDeg   * Math.PI / 180;
    const x1 = cx + r * Math.cos(s1), y1 = cy + r * Math.sin(s1);
    const x2 = cx + r * Math.cos(e1), y2 = cy + r * Math.sin(e1);
    const inner = 18;
    const ix1 = cx + inner * Math.cos(s1), iy1 = cy + inner * Math.sin(s1);
    const ix2 = cx + inner * Math.cos(e1), iy2 = cy + inner * Math.sin(e1);
    const hue = i * step;
    html += `<path d="M ${ix1} ${iy1} L ${x1} ${y1} A ${r} ${r} 0 0 1 ${x2} ${y2} L ${ix2} ${iy2} A ${inner} ${inner} 0 0 0 ${ix1} ${iy1} Z"
      fill="hsl(${hue},80%,55%)" />`;
  }
  seg.innerHTML = html;
}

/** Rotate the needle on the mini wheel */
function rotateNeedle(hueDeg) {
  const needle = document.getElementById('wheel-needle');
  const cx = 60, cy = 60, len = 40;
  const angle = (hueDeg - 90) * Math.PI / 180;
  needle.setAttribute('x2', (cx + len * Math.cos(angle)).toFixed(2));
  needle.setAttribute('y2', (cy + len * Math.sin(angle)).toFixed(2));
}

/** Render palette swatches with stagger animation */
function renderPalette() {
  const { r, g, b } = state;
  const cbMatrix = CB_MATRICES[state.cbMode];
  const rawColors = generatePalette(r, g, b, state.harmony);

  // Apply CB simulation
  currentPaletteColors = rawColors.map(c => applyMatrix(c.r, c.g, c.b, cbMatrix));

  const container = document.getElementById('palette-swatches');
  container.innerHTML = '';

  currentPaletteColors.forEach((c, i) => {
    const hex  = rgbToHex(c.r, c.g, c.b);
    const name = nameColor(c.r, c.g, c.b);
    const item = document.createElement('div');
    item.className = 'swatch-item';
    item.style.animationDelay = `${i * 60}ms`;

    const rect = document.createElement('div');
    rect.className = 'swatch-rect';
    rect.style.backgroundColor = `#${hex.replace('#','')}`;
    rect.title = hex;
    rect.setAttribute('aria-label', `${name} ${hex}`);

    const copyBtn = document.createElement('button');
    copyBtn.className = 'swatch-copy-btn';
    copyBtn.textContent = '📋';
    copyBtn.setAttribute('aria-label', `Copy ${hex}`);
    copyBtn.addEventListener('click', () => copyToClipboard(hex));
    rect.appendChild(copyBtn);

    const hexLabel = document.createElement('div');
    hexLabel.className = 'swatch-hex';
    hexLabel.textContent = hex;

    const nameLabel = document.createElement('div');
    nameLabel.className = 'swatch-name';
    nameLabel.textContent = name;

    item.append(rect, hexLabel, nameLabel);
    container.appendChild(item);
  });

  renderContrastGrid(rawColors); // contrast uses raw (un-simulated) colors
}

/** Render contrast grid */
function renderContrastGrid(colors) {
  const grid = document.getElementById('contrast-grid');
  grid.innerHTML = '';
  if (colors.length < 2) {
    grid.innerHTML = '<p style="font-size:0.78rem;color:#888;">Need at least 2 colors for contrast check.</p>';
    return;
  }
  for (let i = 0; i < colors.length - 1; i++) {
    for (let j = i + 1; j < colors.length; j++) {
      const c1 = colors[i], c2 = colors[j];
      const ratio = contrastRatio(c1.r, c1.g, c1.b, c2.r, c2.g, c2.b);
      const row = document.createElement('div');
      row.className = 'contrast-row';

      const dot1 = document.createElement('div');
      dot1.className = 'contrast-dot-a';
      dot1.style.backgroundColor = rgbToHex(c1.r, c1.g, c1.b);

      const dot2 = document.createElement('div');
      dot2.className = 'contrast-dot-b';
      dot2.style.backgroundColor = rgbToHex(c2.r, c2.g, c2.b);

      const ratioSpan = document.createElement('span');
      ratioSpan.className = 'contrast-ratio';
      ratioSpan.textContent = `${ratio.toFixed(1)}:1`;

      const badge = document.createElement('span');
      badge.className = 'contrast-badge';
      let badgeText, badgeClass, tip;
      if (ratio >= 7) {
        badgeText = '✅ AAA'; badgeClass = 'badge-aaa';
        tip = 'WCAG AAA: excellent contrast for all text sizes.';
      } else if (ratio >= 4.5) {
        badgeText = '✅ AA'; badgeClass = 'badge-aa';
        tip = 'WCAG AA: passes for normal text (≥4.5:1).';
      } else {
        badgeText = '❌ Fail'; badgeClass = 'badge-fail';
        tip = 'Below WCAG AA threshold (4.5:1). Avoid for body text.';
      }
      badge.classList.add(badgeClass);
      badge.textContent = badgeText;
      badge.title = tip;

      row.append(dot1, dot2, ratioSpan, badge);
      grid.appendChild(row);
    }
  }
}

/* ============================================================
   4. COLOR THEORY COACH TEXT UPDATES
   ============================================================ */

function updateTeaching(r, g, b) {
  const THRESH = 60; // "significant" value
  const near = (a, val, tol = 40) => Math.abs(a - val) <= tol;

  let msg = '';

  const all255 = r >= 250 && g >= 250 && b >= 250;
  const allLow = r < THRESH && g < THRESH && b < THRESH;
  const equal  = Math.abs(r-g) < 30 && Math.abs(g-b) < 30 && Math.abs(r-b) < 30;

  if (allLow) {
    msg = 'Everything at zero? Nothing to mix! Slide some channels up to wake up the palette.';
  } else if (all255) {
    msg = 'All three at 255 = pure white light. Every color channel is screaming at full volume!';
  } else if (equal) {
    msg = 'Equal R, G, B = Gray (or White at 255). Balanced light — all channels singing in unison.';
  } else if (r > 180 && near(g, r) && b < THRESH) {
    msg = 'Red + Green light = Yellow! Painters would get brown. Your pixels know better. 🌟';
  } else if (g > 180 && near(b, g) && r < THRESH) {
    msg = 'Green + Blue = Cyan — the color of tropical water. No pigment needed!';
  } else if (r > 180 && near(b, r) && g < THRESH) {
    msg = 'Red + Blue = Magenta. Printers use cyan, magenta, and yellow — the inverses of RGB light.';
  } else if (r > 200 && g < THRESH && b < THRESH) {
    msg = 'Pure Red light! In paint world this is easy — in light, it means you\'re channeling a laser pointer.';
  } else if (g > 200 && r < THRESH && b < THRESH) {
    msg = 'Pure Green light — ultra-vivid on screen. Human eyes are most sensitive to green wavelengths!';
  } else if (b > 200 && r < THRESH && g < THRESH) {
    msg = 'Pure Blue light! It\'s the most saturated-looking blue you\'ll see, but your eyes are actually least sensitive to it.';
  } else if (r > g && r > b) {
    msg = 'Red is dominant. The more green you add, the warmer (yellower) it gets. The more blue, the pinker.';
  } else if (g > r && g > b) {
    msg = 'Green leads! The background color your eyes are most comfortable with. Add red for yellow, blue for cyan.';
  } else {
    msg = 'Blue dominates — deep and cool. Add red for violet, add green to head toward teal.';
  }

  teachingText.innerHTML = msg;
}

function updateCoach(r, g, b) {
  const { h, s, l } = rgbToHsl(r, g, b);

  // Rotate needle
  rotateNeedle(h);

  // Hue description
  let hueText = '';
  if (r === 0 && g === 0 && b === 0) {
    hueText = 'No hue — black contains no color information. Bring up a channel!';
  } else if (s < 0.08) {
    hueText = 'Achromatic — this is a shade of gray with no dominant hue. All channels are nearly equal.';
  } else {
    const hueName = getHueName(h);
    const dominant = getDominantChannels(r, g, b);
    hueText = `Your hue is <strong>${hueName}</strong> — ${dominant}. (H: ${h.toFixed(0)}°)`;
  }
  document.getElementById('coach-hue').innerHTML = hueText;

  // Saturation
  let satText = '';
  const minCh = Math.min(r, g, b);
  if (s > 0.75) {
    satText = `Saturation is <strong>high</strong> — your smallest channel (${minCh}) is very low, so there's almost no white washing it out. This is a vivid, punchy color.`;
  } else if (s > 0.45) {
    satText = `Saturation is <strong>medium</strong> — the color is readable and clear, but not totally pure. Your channels have some spread.`;
  } else if (s > 0.12) {
    satText = `Saturation is <strong>low</strong> — all three channels are fairly close together. You're trending toward gray. Push channels further apart for a punchier hue.`;
  } else {
    satText = `Saturation is <strong>very low (near gray)</strong> — the channels are nearly balanced. This is almost a neutral tone.`;
  }
  document.getElementById('coach-sat').innerHTML = satText;

  // Value / Lightness
  let valText = '';
  if (l > 0.88) {
    valText = `Value is <strong>very high</strong> — at least one channel is near 255 and the others are elevated too, making this a pastel or near-white.`;
  } else if (l > 0.65) {
    valText = `Value is <strong>high</strong> — bright and airy. Great for backgrounds and UI elements.`;
  } else if (l > 0.40) {
    valText = `Value is <strong>medium</strong> — the channels aren't maxed out, so the color feels rich rather than neon-bright. Strong for text or accents.`;
  } else if (l > 0.18) {
    valText = `Value is <strong>low</strong> — a deep, moody tone. High contrast on light backgrounds.`;
  } else {
    valText = `Value is <strong>very low</strong> — approaching black. This is a near-shadow color.`;
  }
  document.getElementById('coach-val').innerHTML = valText;
}

function getHueName(h) {
  if (h < 15 || h >= 345) return 'Red';
  if (h < 45)  return 'Orange';
  if (h < 70)  return 'Yellow';
  if (h < 150) return 'Green';
  if (h < 185) return 'Cyan';
  if (h < 255) return 'Blue';
  if (h < 285) return 'Indigo';
  if (h < 320) return 'Violet / Purple';
  return 'Magenta / Rose';
}

function getDominantChannels(r, g, b) {
  const sorted = [['Red',r],['Green',g],['Blue',b]].sort((a,b)=>b[1]-a[1]);
  const top = sorted[0], sec = sorted[1];
  if (top[1] > 200 && sec[1] > 100) {
    return `${top[0]} and ${sec[0]} are your dominant channels (R:${r}, G:${g}, B:${b}). ${top[0]} wins, with ${sec[0]} pulling it warm`;
  }
  return `${top[0]} leads (R:${r}, G:${g}, B:${b})`;
}

/* ============================================================
   5. CLIPBOARD + TOAST
   ============================================================ */

const toast = document.getElementById('toast');
let toastTimer;

function copyToClipboard(text) {
  if (navigator.clipboard && window.isSecureContext) {
    navigator.clipboard.writeText(text).then(() => showToast());
  } else {
    // Fallback
    const el = document.createElement('textarea');
    el.value = text;
    el.style.position = 'fixed'; el.style.opacity = '0';
    document.body.appendChild(el);
    el.select();
    document.execCommand('copy');
    document.body.removeChild(el);
    showToast();
  }
}

function showToast() {
  clearTimeout(toastTimer);
  toast.classList.add('show');
  toastTimer = setTimeout(() => toast.classList.remove('show'), 1800);
}

document.getElementById('copy-btn').addEventListener('click', () => {
  copyToClipboard(resultHex.textContent);
});

/* ============================================================
   EVENT WIRING
   ============================================================ */

/* Harmony buttons */
document.querySelectorAll('.harmony-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.harmony-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    state.harmony = btn.dataset.harmony;
    renderPalette();
  });
});

/* Color blindness buttons */
document.querySelectorAll('.cb-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.cb-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    state.cbMode = btn.dataset.mode;
    renderPalette();
  });
});

/* Randomize button */
document.getElementById('randomize-btn').addEventListener('click', () => {
  const btn = document.getElementById('randomize-btn');
  btn.style.transform = 'rotate(360deg)';
  btn.style.transition = 'transform 0.4s ease';
  setTimeout(() => { btn.style.transform = ''; btn.style.transition = ''; }, 400);

  state.r = Math.floor(Math.random() * 256);
  state.g = Math.floor(Math.random() * 256);
  state.b = Math.floor(Math.random() * 256);

  sliderR.value = state.r;
  sliderG.value = state.g;
  sliderB.value = state.b;

  updateAll();
});

/* ============================================================
   INIT
   ============================================================ */

buildMiniWheel();
createBlobEls();
updateAll();
