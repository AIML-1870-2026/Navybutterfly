/* ===================================================
   RGB Petal Wheel Explorer — script.js
   Vanilla JS, no libraries
   =================================================== */

// ── State ──────────────────────────────────────────
const state = {
  r: 255,
  g: 128,
  b: 0,
  primaries: new Set(['r', 'g']),   // two active primaries
  constrained: 'b',
  harmony: 'complement',
  hueOffset: 0,
  accessibilityOpen: false,
  activeTab: 'contrast',
};

// ── DOM refs ───────────────────────────────────────
const sliders   = { r: id('slider-r'), g: id('slider-g'), b: id('slider-b') };
const vals      = { r: id('val-r'),    g: id('val-g'),    b: id('val-b')    };
const tags      = { r: id('tag-r'),    g: id('tag-g'),    b: id('tag-b')    };
const btns      = { r: id('btn-r'),    g: id('btn-g'),    b: id('btn-b')    };
const preview   = id('colorPreview');
const hexLabel  = id('previewHex');
const rgbLabel  = id('previewRGB');
const copyBtn   = id('copyHexBtn');
const copyLabel = id('copyLabel');
const marker    = id('wheelMarker');
const paletteEl = id('paletteSwatches');
const randomBtn = id('randomizeBtn');
const uiCard    = id('uiCard');
const uiHeading = id('uiHeading');
const uiBody    = id('uiBody');
const uiBtn     = id('uiBtn');
const toolbarToggle  = id('toolbarToggle');
const toolbarContent = id('toolbarContent');
const fgInput   = id('fgColor');
const bgInput   = id('bgColor');
const fgSwatch  = id('fgSwatch');
const bgSwatch  = id('bgSwatch');
const swapBtn   = id('swapColorsBtn');
const contrastRatio = id('contrastRatio');
const wcagBadges    = id('wcagBadges');
const cbSimGrid     = id('cbSimGrid');

function id(s) { return document.getElementById(s); }

// ── Color math ─────────────────────────────────────

function rgbToHsl(r, g, b) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h, s, l = (max + min) / 2;
  if (max === min) {
    h = s = 0;
  } else {
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
  h = ((h % 360) + 360) % 360;
  h /= 360;
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  const hue2rgb = (p, q, t) => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
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

function rgbToHex(r, g, b) {
  return '#' + [r, g, b].map(v => v.toString(16).padStart(2, '0').toUpperCase()).join('');
}

function hexToRgb(hex) {
  const m = hex.replace('#', '').match(/.{2}/g);
  if (!m || m.length < 3) return null;
  return m.slice(0, 3).map(x => parseInt(x, 16));
}

function relativeLuminance(r, g, b) {
  const lin = v => {
    v /= 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}

function contrastRatioCalc(r1, g1, b1, r2, g2, b2) {
  const L1 = relativeLuminance(r1, g1, b1);
  const L2 = relativeLuminance(r2, g2, b2);
  const [bright, dark] = L1 > L2 ? [L1, L2] : [L2, L1];
  return (bright + 0.05) / (dark + 0.05);
}

// Color blindness simulation matrices
const CB_MATRICES = {
  protanopia:   [[0.567, 0.433, 0], [0.558, 0.442, 0], [0, 0.242, 0.758]],
  deuteranopia: [[0.625, 0.375, 0], [0.700, 0.300, 0], [0, 0.300, 0.700]],
  tritanopia:   [[0.950, 0.050, 0], [0, 0.433, 0.567], [0, 0.475, 0.525]],
};

function simulateCB(r, g, b, type) {
  const m = CB_MATRICES[type];
  return [
    Math.round(Math.min(255, m[0][0]*r + m[0][1]*g + m[0][2]*b)),
    Math.round(Math.min(255, m[1][0]*r + m[1][1]*g + m[1][2]*b)),
    Math.round(Math.min(255, m[2][0]*r + m[2][1]*g + m[2][2]*b)),
  ];
}

// ── Harmony calculations ────────────────────────────

function generateHarmony(r, g, b, type, hueOffset) {
  const [h, s, l] = rgbToHsl(r, g, b);
  const baseHue = (h + hueOffset) % 360;
  const sat = s > 0 ? s : 0.75;
  const lit = l > 0.05 && l < 0.95 ? l : 0.5;

  const makeColor = (hue) => {
    const [cr, cg, cb] = hslToRgb(hue, sat, lit);
    return { r: cr, g: cg, b: cb, hex: rgbToHex(cr, cg, cb) };
  };

  switch (type) {
    case 'complement':
      return [makeColor(baseHue), makeColor(baseHue + 180)];
    case 'analogous':
      return [-30, -15, 0, 15, 30].map(o => makeColor(baseHue + o));
    case 'triadic':
      return [0, 120, 240].map(o => makeColor(baseHue + o));
    case 'split-comp':
      return [makeColor(baseHue), makeColor(baseHue + 150), makeColor(baseHue + 210)];
    case 'tetradic':
      return [0, 90, 180, 270].map(o => makeColor(baseHue + o));
    default:
      return [makeColor(baseHue)];
  }
}

// ── Wheel marker position ───────────────────────────

function updateMarker(r, g, b) {
  const [h, s] = rgbToHsl(r, g, b);
  const angleRad = (h - 90) * (Math.PI / 180);
  // radius: 0 (center) → ~90px (near tip)
  const radius = s * 85;
  const cx = 160 + radius * Math.cos(angleRad);
  const cy = 160 + radius * Math.sin(angleRad);
  marker.setAttribute('cx', cx.toFixed(2));
  marker.setAttribute('cy', cy.toFixed(2));
  marker.setAttribute('r', s < 0.1 ? '5' : '8');
}

// ── Constrained slider enforcement ─────────────────

function updateConstrainedSlider() {
  const primaries = [...state.primaries];
  const p1 = sliders[primaries[0]];
  const p2 = sliders[primaries[1]];
  const con = sliders[state.constrained];

  const maxVal = Math.min(parseInt(p1.value), parseInt(p2.value));
  con.max = maxVal;
  if (parseInt(con.value) > maxVal) {
    con.value = maxVal;
    state[state.constrained] = maxVal;
    vals[state.constrained].textContent = maxVal;
  }
}

function applyConstrainedUI() {
  ['r', 'g', 'b'].forEach(ch => {
    const isConstrained = ch === state.constrained;
    sliders[ch].classList.toggle('constrained', isConstrained);
    sliders[ch].disabled = isConstrained;
    tags[ch].textContent = isConstrained ? 'CONSTRAINED 🔒' : '';
  });
}

// ── Main render ─────────────────────────────────────

function render() {
  const { r, g, b } = state;
  const hex = rgbToHex(r, g, b);

  // Update preview
  preview.style.backgroundColor = hex;
  preview.style.color = hex;  // drives breatheGlow currentColor
  hexLabel.textContent = `HEX ${hex}`;
  rgbLabel.textContent = `RGB(${r}, ${g}, ${b})`;

  // Update slider display values
  vals.r.textContent = r;
  vals.g.textContent = g;
  vals.b.textContent = b;
  sliders.r.value = r;
  sliders.g.value = g;
  sliders.b.value = b;

  // Update wheel marker
  updateMarker(r, g, b);

  // Update palette
  renderPalette();

  // Update contrast if toolbar open
  if (state.accessibilityOpen) {
    syncContrastFromMixed();
    renderContrast();
    renderCBSim();
  }
}

// ── Palette rendering ───────────────────────────────

function renderPalette() {
  const colors = generateHarmony(state.r, state.g, state.b, state.harmony, state.hueOffset);
  paletteEl.innerHTML = '';
  colors.forEach(c => {
    const swatch = document.createElement('div');
    swatch.className = 'swatch';
    swatch.style.backgroundColor = c.hex;

    const hexSpan = document.createElement('div');
    hexSpan.className = 'swatch-hex';
    hexSpan.textContent = c.hex;

    const check = document.createElement('div');
    check.className = 'swatch-check';
    check.textContent = '✓';

    swatch.appendChild(check);
    swatch.appendChild(hexSpan);

    swatch.addEventListener('click', () => {
      navigator.clipboard.writeText(c.hex).catch(() => {});
      swatch.classList.add('flash');
      setTimeout(() => swatch.classList.remove('flash'), 600);
    });

    paletteEl.appendChild(swatch);
  });

  // Update UI preview mockup with first 3 colors
  if (colors.length >= 2) {
    const bg = colors[0].hex;
    const accent = colors[1 % colors.length].hex;
    const text = colors[Math.min(2, colors.length - 1)].hex;
    uiCard.style.backgroundColor = bg;
    uiCard.style.borderColor = accent + '66';
    uiHeading.style.color = accent;
    uiBody.style.color = text;
    uiBtn.style.backgroundColor = accent;
    uiBtn.style.color = bg;
  }
}

// ── Contrast checker ───────────────────────────────

function syncContrastFromMixed() {
  const hex = rgbToHex(state.r, state.g, state.b);
  const [h, s, l] = rgbToHsl(state.r, state.g, state.b);
  const compHex = rgbToHex(...hslToRgb((h + 180) % 360, s > 0 ? s : 0.75, l > 0.05 ? l : 0.5));

  // only auto-sync if user hasn't manually typed
  if (!fgInput.dataset.manual) fgInput.value = hex;
  if (!bgInput.dataset.manual) bgInput.value = compHex;

  updateWellSwatches();
}

function updateWellSwatches() {
  fgSwatch.style.backgroundColor = fgInput.value;
  bgSwatch.style.backgroundColor = bgInput.value;
}

function renderContrast() {
  const fg = hexToRgb(fgInput.value);
  const bg = hexToRgb(bgInput.value);
  if (!fg || !bg) return;

  const ratio = contrastRatioCalc(...fg, ...bg);
  contrastRatio.textContent = ratio.toFixed(2) + ' : 1';

  const badges = [
    { label: 'AA Normal',  pass: ratio >= 4.5 },
    { label: 'AA Large',   pass: ratio >= 3   },
    { label: 'AAA Normal', pass: ratio >= 7   },
    { label: 'AAA Large',  pass: ratio >= 4.5 },
  ];

  wcagBadges.innerHTML = badges.map(b =>
    `<span class="wcag-badge ${b.pass ? 'pass' : 'fail'}">${b.label} ${b.pass ? '✓' : '✗'}</span>`
  ).join('');
}

function renderCBSim() {
  const colors = generateHarmony(state.r, state.g, state.b, state.harmony, state.hueOffset);
  const modes = [
    { key: 'normal',      label: 'NORMAL',      desc: 'Standard trichromatic vision — baseline for comparison.' },
    { key: 'protanopia',  label: 'PROTANOPIA',  desc: 'Reduced sensitivity to red wavelengths — affects ~1% of males.' },
    { key: 'deuteranopia',label: 'DEUTERANOPIA',desc: 'Reduced sensitivity to green wavelengths — most common form, ~6% of males.' },
    { key: 'tritanopia',  label: 'TRITANOPIA',  desc: 'Reduced sensitivity to blue wavelengths — rare, ~0.01% of population.' },
  ];

  cbSimGrid.innerHTML = modes.map(mode => {
    const swatches = colors.map(c => {
      const [sr, sg, sb] = mode.key === 'normal' ? [c.r, c.g, c.b] : simulateCB(c.r, c.g, c.b, mode.key);
      return `<div class="cbsim-swatch" style="background-color:${rgbToHex(sr,sg,sb)}"></div>`;
    }).join('');
    return `
      <div class="cbsim-row">
        <div class="cbsim-label">${mode.label}</div>
        <div class="cbsim-desc">${mode.desc}</div>
        <div class="cbsim-swatches">${swatches}</div>
      </div>`;
  }).join('');
}

// ── Event: Primary selector buttons ────────────────

Object.entries(btns).forEach(([ch, btn]) => {
  btn.addEventListener('click', () => {
    const isActive = state.primaries.has(ch);

    if (isActive) {
      // Must keep exactly 2 active — reject if only 2 remain
      if (state.primaries.size <= 2) {
        btn.classList.add('flicker');
        btn.addEventListener('animationend', () => btn.classList.remove('flicker'), { once: true });
        return;
      }
      state.primaries.delete(ch);
    } else {
      state.primaries.add(ch);
      // If now more than 2, remove the one that wasn't just clicked (the constrained one)
      if (state.primaries.size > 2) {
        state.primaries.delete(state.constrained);
      }
    }

    // Determine new constrained channel
    state.constrained = ['r','g','b'].find(c => !state.primaries.has(c));

    // Update button states
    ['r','g','b'].forEach(c => {
      const active = state.primaries.has(c);
      btns[c].classList.toggle('active', active);
      btns[c].setAttribute('aria-pressed', active);
    });

    applyConstrainedUI();
    updateConstrainedSlider();

    state.r = parseInt(sliders.r.value);
    state.g = parseInt(sliders.g.value);
    state.b = parseInt(sliders.b.value);
    render();
  });
});

// ── Event: Sliders ─────────────────────────────────

['r','g','b'].forEach(ch => {
  sliders[ch].addEventListener('input', () => {
    state[ch] = parseInt(sliders[ch].value);
    vals[ch].textContent = state[ch];

    if (state.primaries.has(ch)) {
      updateConstrainedSlider();
      state[state.constrained] = parseInt(sliders[state.constrained].value);
      vals[state.constrained].textContent = state[state.constrained];
    }

    render();
  });
});

// ── Event: Copy hex ────────────────────────────────

copyBtn.addEventListener('click', () => {
  const hex = rgbToHex(state.r, state.g, state.b);
  navigator.clipboard.writeText(hex).catch(() => {});
  copyBtn.classList.add('copied');
  copyLabel.textContent = 'COPIED!';
  setTimeout(() => {
    copyBtn.classList.remove('copied');
    copyLabel.textContent = 'COPY';
  }, 1500);
});

// ── Event: Harmony buttons ─────────────────────────

document.querySelectorAll('.harmony-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.harmony-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    state.harmony = btn.dataset.harmony;
    renderPalette();
    if (state.accessibilityOpen && state.activeTab === 'colorblind') renderCBSim();
  });
});

// ── Event: Randomize ───────────────────────────────

randomBtn.addEventListener('click', () => {
  state.hueOffset = Math.random() * 360;
  renderPalette();
  if (state.accessibilityOpen && state.activeTab === 'colorblind') renderCBSim();
});

// ── Event: Accessibility toolbar toggle ────────────

toolbarToggle.addEventListener('click', () => {
  state.accessibilityOpen = !state.accessibilityOpen;
  toolbarToggle.setAttribute('aria-expanded', state.accessibilityOpen);
  toolbarContent.hidden = !state.accessibilityOpen;
  toolbarToggle.textContent = (state.accessibilityOpen ? '▲' : '▼') + ' ACCESSIBILITY TOOLS';
  if (state.accessibilityOpen) {
    syncContrastFromMixed();
    renderContrast();
    renderCBSim();
  }
});

// ── Event: Toolbar tabs ────────────────────────────

document.querySelectorAll('.tab-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.tab-btn').forEach(b => {
      b.classList.remove('active');
      b.setAttribute('aria-selected', 'false');
    });
    btn.classList.add('active');
    btn.setAttribute('aria-selected', 'true');
    state.activeTab = btn.dataset.tab;

    document.querySelectorAll('.tab-panel').forEach(p => {
      p.classList.remove('active');
      p.hidden = true;
    });
    const panel = id(`tab-${state.activeTab}`);
    panel.classList.add('active');
    panel.hidden = false;

    if (state.activeTab === 'contrast') renderContrast();
    if (state.activeTab === 'colorblind') renderCBSim();
  });
});

// ── Event: Contrast well inputs ────────────────────

[fgInput, bgInput].forEach(input => {
  input.addEventListener('input', () => {
    input.dataset.manual = '1';
    updateWellSwatches();
    if (input.value.length === 7) renderContrast();
  });
  input.addEventListener('blur', () => {
    // reset manual flag after a delay so future mixed-color changes still sync
    setTimeout(() => delete input.dataset.manual, 3000);
    renderContrast();
  });
});

swapBtn.addEventListener('click', () => {
  const tmp = fgInput.value;
  fgInput.value = bgInput.value;
  bgInput.value = tmp;
  updateWellSwatches();
  renderContrast();
});

// ── Init ────────────────────────────────────────────

applyConstrainedUI();
updateConstrainedSlider();
render();
