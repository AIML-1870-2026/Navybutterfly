/* ===================================================
   RGB Color Studio — script.js
   Vanilla JS only, no libraries
   =================================================== */

// ── Constants ──────────────────────────────────────
const CIRCLE_RADIUS = 180;
const MAX_PALETTE   = 5;

// ── DOM ────────────────────────────────────────────
const canvas        = document.getElementById('mixCanvas');
const ctx           = canvas.getContext('2d', { willReadFrequently: true });
const canvasWrap    = document.getElementById('canvasWrap');
const eyedropEl     = document.getElementById('eyedropPreview');
const paletteSlots  = document.getElementById('paletteSlots');
const suggList      = document.getElementById('suggestionsList');
const suggEmpty     = document.getElementById('suggestionsEmpty');
const addColorBtn   = document.getElementById('addColorBtn');
const pickWarning   = document.getElementById('pickWarning');
const resetBtn      = document.getElementById('resetBtn');
const btnLight      = document.getElementById('btnLight');
const btnPaint      = document.getElementById('btnPaint');
const sliders       = [0,1,2].map(i => document.getElementById(`slider${i}`));
const pcts          = [0,1,2].map(i => document.getElementById(`pct${i}`));
const labels        = [0,1,2].map(i => document.getElementById(`label${i}`));

// ── State ──────────────────────────────────────────
const state = {
  mode: 'light',         // 'light' | 'paint'
  palette: [],           // array of hex strings
  circles: null,         // set in initCircles()
  intensities: [0.5, 0.5, 0.5],
  drag: null,            // { index, offsetX, offsetY } — color circle drag
  eyePos: { x: 0, y: 0 }, // canvas-space coords of the sampler circle
  eyeDrag: false,        // is the sampler circle being dragged?
  eyeColor: null,        // hex color currently under sampler
};

// Circle definitions per mode — positions shared
const LIGHT_CIRCLES = [
  { r: 255, g: 0,   b: 0   },  // Red
  { r: 0,   g: 255, b: 0   },  // Green
  { r: 0,   g: 0,   b: 255 },  // Blue
];
const PAINT_CIRCLES = [
  { r: 0,   g: 255, b: 255 },  // Cyan
  { r: 255, g: 0,   b: 255 },  // Magenta
  { r: 255, g: 255, b: 0   },  // Yellow
];

const LIGHT_LABELS = ['RED', 'GREEN', 'BLUE'];
const PAINT_LABELS = ['CYAN', 'MAGENTA', 'YELLOW'];

// ── Canvas sizing ──────────────────────────────────
function resizeCanvas() {
  const rect = canvasWrap.getBoundingClientRect();
  canvas.width  = Math.round(rect.width);
  canvas.height = Math.round(rect.height);
  // Re-clamp circle positions after resize
  if (state.circles) {
    state.circles.forEach(c => {
      c.x = Math.max(0, Math.min(canvas.width,  c.x));
      c.y = Math.max(0, Math.min(canvas.height, c.y));
    });
  }
  // Re-clamp eyedrop position
  state.eyePos.x = Math.max(0, Math.min(canvas.width,  state.eyePos.x));
  state.eyePos.y = Math.max(0, Math.min(canvas.height, state.eyePos.y));
}

// ── Default triangle positions ─────────────────────
function defaultPositions() {
  const cx = canvas.width  / 2;
  const cy = canvas.height / 2;
  const spread = Math.min(canvas.width, canvas.height) * 0.22;
  return [
    { x: cx,              y: cy - spread * 1.1 },   // top
    { x: cx - spread,     y: cy + spread * 0.7 },   // bottom-left
    { x: cx + spread,     y: cy + spread * 0.7 },   // bottom-right
  ];
}

function initCircles() {
  const pos = defaultPositions();
  state.circles = pos.map(p => ({ x: p.x, y: p.y }));
}

function initEyedrop() {
  // Place sampler in top-right area, away from the default circle triangle
  state.eyePos.x = canvas.width  * 0.78;
  state.eyePos.y = canvas.height * 0.18;
  positionEyedropEl();
  eyedropEl.style.display = 'block';
}

// ── Draw loop ──────────────────────────────────────
function draw() {
  requestAnimationFrame(draw);

  const w = canvas.width, h = canvas.height;
  const isLight = state.mode === 'light';

  // Background
  ctx.globalCompositeOperation = 'source-over';
  ctx.fillStyle = isLight ? '#000000' : '#ffffff';
  ctx.fillRect(0, 0, w, h);

  const circles = isLight ? LIGHT_CIRCLES : PAINT_CIRCLES;
  const compositeOp = isLight ? 'screen' : 'multiply';

  // Paint mode boost: slider 0→1 maps to 0→2× effective intensity
  // so slider at 0.5 = old "100%", slider at 1.0 = double pass (much stronger)
  const PAINT_BOOST = 2.0;

  state.circles.forEach((pos, i) => {
    const col = circles[i];
    const intensity = state.intensities[i];

    if (isLight) {
      // Outer glow halo
      ctx.globalCompositeOperation = 'screen';
      const halo = ctx.createRadialGradient(pos.x, pos.y, 0, pos.x, pos.y, CIRCLE_RADIUS * 1.6);
      halo.addColorStop(0, `rgba(${col.r}, ${col.g}, ${col.b}, ${intensity * 0.12})`);
      halo.addColorStop(1, `rgba(${col.r}, ${col.g}, ${col.b}, 0)`);
      ctx.fillStyle = halo;
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, CIRCLE_RADIUS * 1.6, 0, Math.PI * 2);
      ctx.fill();

      // Single main circle pass for light mode
      ctx.globalCompositeOperation = compositeOp;
      const grad = ctx.createRadialGradient(pos.x, pos.y, 0, pos.x, pos.y, CIRCLE_RADIUS);
      grad.addColorStop(0, `rgba(${col.r}, ${col.g}, ${col.b}, ${intensity})`);
      grad.addColorStop(1, `rgba(${col.r}, ${col.g}, ${col.b}, 0)`);
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, CIRCLE_RADIUS, 0, Math.PI * 2);
      ctx.fill();
    } else {
      // Paint mode: multi-pass to allow intensity > 100% effective strength
      const scaled    = intensity * PAINT_BOOST;
      const fullPasses = Math.floor(scaled);
      const remainder  = scaled - fullPasses;

      const drawPass = (alpha) => {
        ctx.globalCompositeOperation = compositeOp;
        const grad = ctx.createRadialGradient(pos.x, pos.y, 0, pos.x, pos.y, CIRCLE_RADIUS);
        grad.addColorStop(0, `rgba(${col.r}, ${col.g}, ${col.b}, ${alpha})`);
        grad.addColorStop(1, `rgba(${col.r}, ${col.g}, ${col.b}, 0)`);
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, CIRCLE_RADIUS, 0, Math.PI * 2);
        ctx.fill();
      };

      for (let p = 0; p < fullPasses; p++) drawPass(1.0);
      if (remainder > 0.001) drawPass(remainder);
    }
  });

  ctx.globalCompositeOperation = 'source-over';

  // Sample the color under the eyedrop circle after each frame
  sampleEyedropColor();
}

// ── Hit testing ────────────────────────────────────
function hitTest(x, y) {
  // Test in reverse order so topmost circle wins
  for (let i = state.circles.length - 1; i >= 0; i--) {
    const c = state.circles[i];
    const dx = x - c.x, dy = y - c.y;
    if (dx * dx + dy * dy <= CIRCLE_RADIUS * CIRCLE_RADIUS) return i;
  }
  return -1;
}

// ── Canvas pointer coords ──────────────────────────
function canvasCoords(e) {
  const rect = canvas.getBoundingClientRect();
  const src  = e.touches ? e.touches[0] : e;
  return {
    x: (src.clientX - rect.left) * (canvas.width  / rect.width),
    y: (src.clientY - rect.top)  * (canvas.height / rect.height),
  };
}

// ── Drag ───────────────────────────────────────────
canvas.addEventListener('mousedown', e => {
  const { x, y } = canvasCoords(e);
  const idx = hitTest(x, y);
  if (idx !== -1) {
    state.drag = { index: idx, offsetX: x - state.circles[idx].x, offsetY: y - state.circles[idx].y };
  }
});

canvas.addEventListener('mousemove', e => {
  if (!state.drag) return;
  const { x, y } = canvasCoords(e);
  const idx = state.drag.index;
  state.circles[idx].x = Math.max(0, Math.min(canvas.width,  x - state.drag.offsetX));
  state.circles[idx].y = Math.max(0, Math.min(canvas.height, y - state.drag.offsetY));
});

canvas.addEventListener('mouseup', () => { state.drag = null; });
canvas.addEventListener('mouseleave', () => { state.drag = null; });

// Touch
canvas.addEventListener('touchstart', e => {
  e.preventDefault();
  const { x, y } = canvasCoords(e);
  const idx = hitTest(x, y);
  if (idx !== -1) {
    state.drag = { index: idx, offsetX: x - state.circles[idx].x, offsetY: y - state.circles[idx].y };
  }
}, { passive: false });

canvas.addEventListener('touchmove', e => {
  e.preventDefault();
  const { x, y } = canvasCoords(e);
  if (!state.drag) return;
  const idx = state.drag.index;
  state.circles[idx].x = Math.max(0, Math.min(canvas.width,  x - state.drag.offsetX));
  state.circles[idx].y = Math.max(0, Math.min(canvas.height, y - state.drag.offsetY));
}, { passive: false });

canvas.addEventListener('touchend', () => { state.drag = null; });

// ── Eyedropper sampler (draggable object) ──────────

// Convert canvas-space coords → CSS px within canvasWrap and position the div
function positionEyedropEl() {
  const rect = canvas.getBoundingClientRect();
  const scaleX = rect.width  / canvas.width;
  const scaleY = rect.height / canvas.height;
  eyedropEl.style.left = (state.eyePos.x * scaleX) + 'px';
  eyedropEl.style.top  = (state.eyePos.y * scaleY) + 'px';
}

// Read the canvas pixel under the sampler center (called every rAF frame)
function sampleEyedropColor() {
  const px = Math.floor(state.eyePos.x);
  const py = Math.floor(state.eyePos.y);
  if (px < 0 || py < 0 || px >= canvas.width || py >= canvas.height) return;
  const data = ctx.getImageData(px, py, 1, 1).data;
  const hex  = rgbToHex(data[0], data[1], data[2]);
  state.eyeColor = hex;
  eyedropEl.style.backgroundColor = hex;
  eyedropEl.style.color = hex; // drives currentColor in the CSS animation
}

// Start dragging the sampler circle
eyedropEl.addEventListener('mousedown', e => {
  e.preventDefault();
  e.stopPropagation(); // don't start a color-circle drag underneath
  state.eyeDrag = true;
});

eyedropEl.addEventListener('touchstart', e => {
  e.preventDefault();
  e.stopPropagation();
  state.eyeDrag = true;
}, { passive: false });

// Track eyedrop drag at document level so it doesn't break when cursor moves fast
document.addEventListener('mousemove', e => {
  if (!state.eyeDrag) return;
  const rect = canvas.getBoundingClientRect();
  state.eyePos.x = Math.max(0, Math.min(canvas.width,
    (e.clientX - rect.left) * (canvas.width  / rect.width)));
  state.eyePos.y = Math.max(0, Math.min(canvas.height,
    (e.clientY - rect.top)  * (canvas.height / rect.height)));
  positionEyedropEl();
});

document.addEventListener('touchmove', e => {
  if (!state.eyeDrag) return;
  const touch = e.touches[0];
  const rect  = canvas.getBoundingClientRect();
  state.eyePos.x = Math.max(0, Math.min(canvas.width,
    (touch.clientX - rect.left) * (canvas.width  / rect.width)));
  state.eyePos.y = Math.max(0, Math.min(canvas.height,
    (touch.clientY - rect.top)  * (canvas.height / rect.height)));
  positionEyedropEl();
}, { passive: false });

document.addEventListener('mouseup',  () => { state.eyeDrag = false; });
document.addEventListener('touchend', () => { state.eyeDrag = false; });

// ADD COLOR — push whatever color is currently under the sampler into the palette
addColorBtn.addEventListener('click', () => {
  if (!state.eyeColor) return;
  addToPalette(state.eyeColor);
});

// ── Mode switch ────────────────────────────────────
function setMode(mode) {
  state.mode = mode;
  document.body.classList.toggle('paint', mode === 'paint');

  btnLight.classList.toggle('active', mode === 'light');
  btnPaint.classList.toggle('active', mode === 'paint');

  const lbls = mode === 'light' ? LIGHT_LABELS : PAINT_LABELS;
  labels.forEach((el, i) => el.textContent = lbls[i]);
}

btnLight.addEventListener('click', () => setMode('light'));
btnPaint.addEventListener('click', () => setMode('paint'));

// ── Intensity sliders ──────────────────────────────
sliders.forEach((sl, i) => {
  sl.addEventListener('input', () => {
    state.intensities[i] = parseFloat(sl.value);
    pcts[i].textContent = Math.round(sl.value * 100) + '%';
  });
});

resetBtn.addEventListener('click', () => {
  state.intensities = [0.5, 0.5, 0.5];
  sliders.forEach((sl, i) => {
    sl.value = 0.5;
    pcts[i].textContent = '50%';
  });
  resetBtn.classList.add('flash');
  resetBtn.addEventListener('animationend', () => resetBtn.classList.remove('flash'), { once: true });
});

// ── Palette ────────────────────────────────────────
function addToPalette(hex) {
  if (state.palette.length >= MAX_PALETTE) {
    showWarning('PALETTE FULL — REMOVE A COLOR FIRST');
    return;
  }
  state.palette.push(hex);
  renderPalette();
  renderSuggestions();
}

function removeFromPalette(index) {
  const swatches = paletteSlots.querySelectorAll('.palette-swatch');
  const sw = swatches[index];
  if (sw) {
    sw.classList.add('removing');
    sw.addEventListener('animationend', () => {
      state.palette.splice(index, 1);
      renderPalette();
      renderSuggestions();
    }, { once: true });
  }
}

function renderPalette() {
  paletteSlots.innerHTML = '';
  for (let i = 0; i < MAX_PALETTE; i++) {
    if (i < state.palette.length) {
      const hex = state.palette[i];
      const sw = document.createElement('div');
      sw.className = 'palette-swatch';
      sw.style.backgroundColor = hex;
      sw.title = `Click to reverse-engineer ${hex}`;

      const span = document.createElement('span');
      span.className = 'swatch-hex';
      span.textContent = hex.toUpperCase();
      span.style.color = autoContrastColor(hex);

      const removeEl = document.createElement('button');
      removeEl.className = 'swatch-remove';
      removeEl.textContent = '×';
      removeEl.setAttribute('aria-label', `Remove ${hex}`);
      removeEl.addEventListener('click', e => {
        e.stopPropagation();
        removeFromPalette(i);
      });

      sw.appendChild(span);
      sw.appendChild(removeEl);
      sw.addEventListener('click', () => reverseMode(hex));
      paletteSlots.appendChild(sw);
    } else {
      const slot = document.createElement('div');
      slot.className = 'palette-slot';
      const txt = document.createElement('span');
      txt.className = 'slot-empty-text';
      txt.textContent = 'PICK A COLOR';
      slot.appendChild(txt);
      paletteSlots.appendChild(slot);
    }
  }
}

function showWarning(msg) {
  pickWarning.textContent = msg;
  pickWarning.style.opacity = '1';
  clearTimeout(pickWarning._t);
  pickWarning._t = setTimeout(() => {
    pickWarning.style.opacity = '0';
    setTimeout(() => { pickWarning.textContent = ''; }, 300);
  }, 2000);
}

// ── Reverse Mode ───────────────────────────────────
function reverseMode(hex) {
  // Reset circle positions
  const pos = defaultPositions();
  state.circles = pos.map(p => ({ x: p.x, y: p.y }));

  // Approximate intensities from the hex color
  const [r, g, b] = hexToRgb(hex);
  const isLight = state.mode === 'light';

  if (isLight) {
    // R, G, B channels → intensities
    state.intensities[0] = Math.max(0.05, r / 255);
    state.intensities[1] = Math.max(0.05, g / 255);
    state.intensities[2] = Math.max(0.05, b / 255);
  } else {
    // CMY: C = 1 - R/255, M = 1 - G/255, Y = 1 - B/255
    state.intensities[0] = Math.max(0.05, 1 - r / 255);
    state.intensities[1] = Math.max(0.05, 1 - g / 255);
    state.intensities[2] = Math.max(0.05, 1 - b / 255);
  }

  sliders.forEach((sl, i) => {
    sl.value = state.intensities[i];
    pcts[i].textContent = Math.round(state.intensities[i] * 100) + '%';
  });

  // Move sampler to canvas center so it sits over the overlap point
  state.eyePos.x = canvas.width  / 2;
  state.eyePos.y = canvas.height / 2;
  positionEyedropEl();
}

// ── Suggestions ────────────────────────────────────
function renderSuggestions() {
  if (state.palette.length === 0) {
    suggList.innerHTML = '';
    const p = document.createElement('p');
    p.className = 'suggestions-empty';
    p.id = 'suggestionsEmpty';
    p.textContent = 'ADD A COLOR TO SEE SUGGESTIONS';
    suggList.appendChild(p);
    return;
  }

  const baseHex = state.palette[state.palette.length - 1];
  const [r, g, b] = hexToRgb(baseHex);
  const [h, s, l] = rgbToHsl(r, g, b);

  const rows = [
    {
      label: 'COMPLEMENTARY',
      colors: [hslToHex((h + 180) % 360, s, l)],
    },
    {
      label: 'ANALOGOUS',
      colors: [-30, -15, 15, 30].map(o => hslToHex((h + o + 360) % 360, s, l)),
    },
    {
      label: 'TRIADIC',
      colors: [120, 240].map(o => hslToHex((h + o) % 360, s, l)),
    },
    {
      label: 'SPLIT-COMP',
      colors: [150, 210].map(o => hslToHex((h + o) % 360, s, l)),
    },
    {
      label: 'TETRADIC',
      colors: [90, 180, 270].map(o => hslToHex((h + o) % 360, s, l)),
    },
    {
      label: 'MONOCHROMATIC',
      colors: [0.2, 0.4, 0.6, 0.8].map(lt => hslToHex(h, s, lt)),
    },
    {
      label: 'WARM / COOL',
      colors: [
        hslToHex((h + 20 + 360) % 360, Math.min(s + 0.1, 1), l),  // warm → toward red/yellow
        hslToHex((h + 200) % 360,       Math.min(s + 0.1, 1), l),  // cool → toward blue
      ],
    },
  ];

  suggList.innerHTML = '';
  rows.forEach(row => {
    const rowEl = document.createElement('div');
    rowEl.className = 'suggestion-row';

    const lbl = document.createElement('div');
    lbl.className = 'suggestion-label';
    lbl.textContent = row.label;
    rowEl.appendChild(lbl);

    const chips = document.createElement('div');
    chips.className = 'suggestion-chips';
    row.colors.forEach(hex => {
      const chip = document.createElement('div');
      chip.className = 'chip';
      chip.style.backgroundColor = hex;
      chip.title = hex;
      chip.addEventListener('click', () => {
        if (state.palette.length >= MAX_PALETTE) {
          showWarning('PALETTE FULL — REMOVE A COLOR FIRST');
          return;
        }
        chip.classList.add('added');
        chip.addEventListener('animationend', () => chip.classList.remove('added'), { once: true });
        addToPalette(hex);
      });
      chips.appendChild(chip);
    });
    rowEl.appendChild(chips);
    suggList.appendChild(rowEl);
  });
}

// ── Color math helpers ─────────────────────────────
function rgbToHex(r, g, b) {
  return '#' + [r, g, b].map(v => Math.max(0, Math.min(255, v)).toString(16).padStart(2, '0').toUpperCase()).join('');
}

function hexToRgb(hex) {
  const m = hex.replace('#', '').match(/.{2}/g);
  return m.map(x => parseInt(x, 16));
}

function rgbToHsl(r, g, b) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }
  return [h * 360, s, l];
}

function hslToRgb(h, s, l) {
  h = ((h % 360) + 360) % 360 / 360;
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  const hue2rgb = (p, q, t) => {
    if (t < 0) t += 1; if (t > 1) t -= 1;
    if (t < 1/6) return p + (q - p) * 6 * t;
    if (t < 1/2) return q;
    if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
    return p;
  };
  return [
    Math.round(hue2rgb(p, q, h + 1/3) * 255),
    Math.round(hue2rgb(p, q, h)       * 255),
    Math.round(hue2rgb(p, q, h - 1/3) * 255),
  ];
}

function hslToHex(h, s, l) {
  return rgbToHex(...hslToRgb(h, s, l));
}

function autoContrastColor(hex) {
  const [r, g, b] = hexToRgb(hex);
  return (0.299 * r + 0.587 * g + 0.114 * b) > 128 ? '#000000' : '#ffffff';
}

// ── Window resize ──────────────────────────────────
const resizeObserver = new ResizeObserver(() => {
  resizeCanvas();
});
resizeObserver.observe(canvasWrap);

// ── Init ───────────────────────────────────────────
resizeCanvas();
initCircles();
initEyedrop();
renderPalette();
renderSuggestions();
draw();
