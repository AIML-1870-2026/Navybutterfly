(() => {
  'use strict';

  // ── State ──────────────────────────────────────────────
  const state = {
    bg: { r: 255, g: 255, b: 255 },
    fg: { r: 0,   g: 0,   b: 0   },
    size: 32,
    vision: 'normal',
  };

  // ── Presets ────────────────────────────────────────────
  const PRESETS = [
    { name: 'Classic',     bg: [255,255,255], fg: [0,0,0]       },
    { name: 'Dark Mode',   bg: [26,26,46],    fg: [255,255,255] },
    { name: 'Ocean',       bg: [0,119,182],   fg: [255,255,255] },
    { name: 'Warning',     bg: [255,209,102], fg: [0,0,0]       },
    { name: 'Danger Zone', bg: [160,160,160], fg: [128,128,128] },
    { name: 'Newsprint',   bg: [245,240,232], fg: [45,45,45]    },
  ];

  // ── Element refs ───────────────────────────────────────
  const els = {
    bgR:   { slider: q('#bg-r-slider'), num: q('#bg-r-num') },
    bgG:   { slider: q('#bg-g-slider'), num: q('#bg-g-num') },
    bgB:   { slider: q('#bg-b-slider'), num: q('#bg-b-num') },
    fgR:   { slider: q('#fg-r-slider'), num: q('#fg-r-num') },
    fgG:   { slider: q('#fg-g-slider'), num: q('#fg-g-num') },
    fgB:   { slider: q('#fg-b-slider'), num: q('#fg-b-num') },
    bgSwatch:     q('#bg-swatch'),
    fgSwatch:     q('#fg-swatch'),
    sizeSlider:   q('#size-slider'),
    sizeReadout:  q('#size-readout'),
    previewArea:       q('#preview-area'),
    previewFilterTarget: q('#preview-filter-target'),
    previewText:       q('#preview-text'),
    lumBg:        q('#lum-bg'),
    lumFg:        q('#lum-fg'),
    contrastRatio:q('#contrast-ratio'),
    badgeNormal:  q('#badge-normal'),
    badgeLarge:   q('#badge-large'),
    visionBtns:   qa('.vision-btn'),
    lockNote:     q('#sim-lock-note'),
    presetsGrid:  q('#presets-grid'),
  };

  function q(sel)  { return document.querySelector(sel); }
  function qa(sel) { return document.querySelectorAll(sel); }

  // ── WCAG luminance ─────────────────────────────────────
  function linearize(c) {
    const v = c / 255;
    return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  }

  function relativeLuminance({ r, g, b }) {
    return 0.2126 * linearize(r) + 0.7152 * linearize(g) + 0.0722 * linearize(b);
  }

  function contrastRatio(l1, l2) {
    const lighter = Math.max(l1, l2);
    const darker  = Math.min(l1, l2);
    return (lighter + 0.05) / (darker + 0.05);
  }

  // ── Render ─────────────────────────────────────────────
  function render() {
    const { bg, fg, size } = state;

    // Swatches
    els.bgSwatch.style.background = `rgb(${bg.r},${bg.g},${bg.b})`;
    els.fgSwatch.style.background = `rgb(${fg.r},${fg.g},${fg.b})`;

    // Preview area
    els.previewFilterTarget.style.background = `rgb(${bg.r},${bg.g},${bg.b})`;
    els.previewText.style.color = `rgb(${fg.r},${fg.g},${fg.b})`;
    els.previewText.style.fontSize = `${size}px`;

    // Luminance
    const lBg = relativeLuminance(bg);
    const lFg = relativeLuminance(fg);
    els.lumBg.textContent = lBg.toFixed(3);
    els.lumFg.textContent = lFg.toFixed(3);

    // Contrast
    const ratio = contrastRatio(lBg, lFg);
    els.contrastRatio.textContent = ratio.toFixed(2) + ':1';

    // Badges
    const isLargeText = state.size >= 24;
    setBadge(els.badgeNormal, ratio >= 4.5);
    setBadge(els.badgeLarge,  isLargeText ? ratio >= 3.0 : ratio >= 4.5);

    // Vision filter on preview area
    const filterName = state.vision === 'normal' ? 'none' : `url(#filter-${state.vision})`;
    els.previewFilterTarget.style.filter = filterName;
  }

  function setBadge(el, pass) {
    el.textContent = pass ? 'PASS' : 'FAIL';
    el.className = 'badge ' + (pass ? 'pass' : 'fail');
  }

  // ── Sync sliders + number inputs ───────────────────────
  function bindChannel(sliderEl, numEl, colorObj, channel) {
    sliderEl.addEventListener('input', () => {
      const v = clamp(parseInt(sliderEl.value, 10));
      colorObj[channel] = v;
      numEl.value = v;
      render();
    });

    numEl.addEventListener('input', () => {
      if (numEl.value === '') return;
      const parsed = parseInt(numEl.value, 10);
      if (isNaN(parsed)) return;
      const v = clamp(parsed);
      colorObj[channel] = v;
      sliderEl.value = v;
      render();
    });

    numEl.addEventListener('blur', () => {
      const v = clamp(parseInt(numEl.value, 10) || 0);
      numEl.value = v;
      colorObj[channel] = v;
      sliderEl.value = v;
      render();
    });
  }

  function clamp(v) { return Math.max(0, Math.min(255, isNaN(v) ? 0 : v)); }

  // ── Text size ──────────────────────────────────────────
  els.sizeSlider.addEventListener('input', () => {
    state.size = parseInt(els.sizeSlider.value, 10);
    els.sizeReadout.textContent = state.size + 'px';
    render();
  });

  // ── Vision simulation ──────────────────────────────────
  els.visionBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      state.vision = btn.dataset.filter;
      els.visionBtns.forEach(b => b.classList.toggle('active', b === btn));
      const locked = state.vision !== 'normal';
      setControlsLocked(locked);
      render();
    });
  });

  function setControlsLocked(locked) {
    const colorInputs = document.querySelectorAll(
      '#panel-bg input, #panel-fg input'
    );
    colorInputs.forEach(inp => {
      inp.disabled = locked;
    });
    els.lockNote.style.display = locked ? 'block' : 'none';
  }

  // ── Presets ────────────────────────────────────────────
  function buildPresets() {
    PRESETS.forEach(preset => {
      const bgColor = { r: preset.bg[0], g: preset.bg[1], b: preset.bg[2] };
      const fgColor = { r: preset.fg[0], g: preset.fg[1], b: preset.fg[2] };
      const lBg = relativeLuminance(bgColor);
      const lFg = relativeLuminance(fgColor);
      const ratio = contrastRatio(lBg, lFg).toFixed(2);

      const card = document.createElement('div');
      card.className = 'preset-card';
      card.innerHTML = `
        <div class="preset-swatch">
          <div class="preset-swatch-half" style="background:rgb(${preset.bg.join(',')})"></div>
          <div class="preset-swatch-half" style="background:rgb(${preset.fg.join(',')})"></div>
        </div>
        <div class="preset-name">${preset.name}</div>
        <div class="preset-ratio">${ratio}:1</div>
      `;

      card.addEventListener('click', () => {
        // Reset vision to normal
        state.vision = 'normal';
        els.visionBtns.forEach(b => b.classList.toggle('active', b.dataset.filter === 'normal'));
        setControlsLocked(false);

        // Apply colors
        applyColor('bg', preset.bg[0], preset.bg[1], preset.bg[2]);
        applyColor('fg', preset.fg[0], preset.fg[1], preset.fg[2]);
        render();
      });

      els.presetsGrid.appendChild(card);
    });
  }

  function applyColor(which, r, g, b) {
    const obj  = state[which];
    const rows = which === 'bg'
      ? [els.bgR, els.bgG, els.bgB]
      : [els.fgR, els.fgG, els.fgB];
    const vals = [r, g, b];
    const channels = ['r', 'g', 'b'];

    channels.forEach((ch, i) => {
      obj[ch] = vals[i];
      rows[i].slider.value = vals[i];
      rows[i].num.value    = vals[i];
    });
  }

  // ── Wire up channel bindings ───────────────────────────
  bindChannel(els.bgR.slider, els.bgR.num, state.bg, 'r');
  bindChannel(els.bgG.slider, els.bgG.num, state.bg, 'g');
  bindChannel(els.bgB.slider, els.bgB.num, state.bg, 'b');
  bindChannel(els.fgR.slider, els.fgR.num, state.fg, 'r');
  bindChannel(els.fgG.slider, els.fgG.num, state.fg, 'g');
  bindChannel(els.fgB.slider, els.fgB.num, state.fg, 'b');

  // ── Init ───────────────────────────────────────────────
  buildPresets();
  render();

})();
