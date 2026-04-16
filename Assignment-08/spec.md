# spec.md — RGB Color Studio
## AIML 1870 | Code Quest: The Secret Life of Pixels

---

## Overview

A synthwave-aesthetic interactive RGB Color Studio. The main canvas is an immersive mixing playground where the user drags colored light sources (Light mode) or paint blobs (Paint mode) around a canvas, watches additive or subtractive color mixing happen in real time via blend modes, samples colors with a live eyedropper, and builds a palette in a right-side panel. Generated palette suggestions populate below the user's picked colors. Switching between Light and Paint mode keeps circle positions intact so the user can directly compare additive vs. subtractive mixing.

---

## File Structure

```
index.html
style.css
script.js
```

No build tools. No frameworks. Vanilla HTML/CSS/JS only.
Deployment: GitHub Pages (AIML-1870-2026 org, NavyButterfly repo, Assignment-08 folder)

---

## Visual Style

**Theme:** Retro synthwave — near-black background (`#0a0010`), neon accents (magenta `#ff00cc`, cyan `#00ffee`, yellow `#ffe600`), deep purple midtones.

**Background:** Subtle CSS perspective grid lines in dark purple. Very faint CRT scanline overlay (repeating linear-gradient, 2px tall, 1px gap, ~2% opacity).

**Typography:**
- Display / headings: `Orbitron` (Google Font)
- Body / labels / hex codes: `Share Tech Mono` (Google Font)

**Glow effects:** Neon `text-shadow` and `box-shadow` on interactive elements. Each circle glows its own color. The eyedropper preview circle pulses with a CSS breathing glow.

**Borders/Cards:** 1px semi-transparent neon borders, `border-radius: 4px`, dark semi-transparent backgrounds with `backdrop-filter: blur(8px)`.

---

## Layout

```
┌──────────────────────────────────────────────────────────┐
│  ✦ RGB COLOR STUDIO         [LIGHT MODE] [PAINT MODE]    │
├────────────────────────────────────┬─────────────────────┤
│                                    │  PALETTE SIDEBAR    │
│         MIXING CANVAS              │                     │
│   (draggable circles, black or     │  [Color boxes x5]   │
│    white background depending      │  each with hex +    │
│    on mode)                        │  × remove button    │
│                                    │                     │
│                                    │  ── SUGGESTIONS ──  │
│                                    │  [Complementary]    │
│                                    │  [Analogous]        │
│                                    │  [Triadic]          │
│                                    │  [Split-Comp]       │
│                                    │  [Tetradic]         │
│                                    │  [Monochromatic]    │
│                                    │  [Warm/Cool]        │
├────────────────────────────────────┴─────────────────────┤
│  INTENSITY SLIDERS: [RED ░░░] [GREEN ░░░] [BLUE ░░░]     │
│  [RESET INTENSITIES]    [🔍 PICK COLOR — live preview]   │
└──────────────────────────────────────────────────────────┘
```

---

## Mode Toggle

Two buttons in the header: **LIGHT MODE** and **PAINT MODE**. Active mode button glows brightly; inactive is dimmed.

### Light Mode (Additive)
- Canvas background: **black**
- Three draggable circles: **Red**, **Green**, **Blue**
- Canvas 2D `globalCompositeOperation = 'screen'` — overlaps brighten correctly:
  - Red + Green = Yellow
  - Green + Blue = Cyan
  - Red + Blue = Magenta
  - R + G + B = White
- Circle fill colors: `rgba(255, 0, 0, intensity)`, `rgba(0, 255, 0, intensity)`, `rgba(0, 0, 255, intensity)`

### Paint Mode (Subtractive)
- Canvas background: **white**
- Three draggable circles: **Cyan**, **Magenta**, **Yellow**
- Canvas 2D `globalCompositeOperation = 'multiply'` — overlaps darken correctly:
  - Cyan + Magenta = Blue
  - Magenta + Yellow = Red
  - Yellow + Cyan = Green
  - C + M + Y = near Black
- Circle fill colors: `rgba(0, 255, 255, intensity)`, `rgba(255, 0, 255, intensity)`, `rgba(255, 255, 0, intensity)`

### Mode Switch Behavior
- Circle positions are **preserved** when switching modes — circles stay exactly where the user left them
- Palette is **preserved** — colors not cleared on mode switch
- Intensities are **preserved**
- Background and composite operation update instantly
- Brief fade transition on the canvas background (0.4s ease) signals the mode change

---

## Mixing Canvas

- A `<canvas>` element taking up the left ~70% of the screen, full height below the header
- Redrawn every frame via `requestAnimationFrame`
- Each frame: clear to background color, then draw each circle using radial gradients + the appropriate `globalCompositeOperation`
- Each circle is large (~180px radius default), with a soft radial gradient (fully opaque center → transparent edge) to give a natural light/paint bleed feel
- In Light mode: circles also get a subtle outer glow halo (drawn as a larger, very low opacity circle before the main one)
- In Paint mode: no glow halo — paint blobs have a clean soft edge
- Circles start in a default triangle arrangement that produces visible overlaps at center
- **Drag behavior:** `mousedown` on a circle begins drag; `mousemove` updates position; `mouseup` ends drag. Hit-testing uses distance from circle center. Circles clamped to canvas bounds. Touch events (`touchstart`, `touchmove`, `touchend`) also supported.

---

## Intensity Sliders

Three sliders in the bottom toolbar, one per circle. Controls the intensity/opacity of that circle (range: `0.05` to `1.0`, step `0.01`).

- Each slider track styled as a gradient from near-transparent → the circle's full color
- Numeric percentage readout beside each (e.g., `87%`)
- Changing a slider updates the circle's intensity and triggers a canvas redraw
- **RESET button:** Snaps all three intensities back to `1.0`. Brief neon flash animation on the button on click.
- Slider labels use the mode-appropriate color names:
  - Light mode: RED / GREEN / BLUE
  - Paint mode: CYAN / MAGENTA / YELLOW
  - Labels update instantly on mode switch

---

## Eyedropper / Color Picker

### Activation
- **PICK COLOR** button in the bottom toolbar toggles picker mode
- When active: button glows, cursor changes to crosshair

### Live Preview
- A small glowing circle (~32px diameter) tracks the mouse cursor in real time
- Its fill color updates every `mousemove` by sampling the canvas pixel under the cursor via `ctx.getImageData(x, y, 1, 1)`
- The preview circle pulses with a CSS `@keyframes` breathing glow in whatever color it's displaying
- The preview circle is an absolutely-positioned `<div>` overlaid on the canvas, pointer-events none

### Picking
- On `click` while picker is active:
  - If palette has < 5 colors: add the sampled color to the palette, deactivate picker mode, animate the new swatch into the sidebar
  - If palette is full: show inline warning near the button — `"PALETTE FULL — REMOVE A COLOR FIRST"` in neon red, fades after 2s. Do not add color.

---

## Palette Sidebar (Right Panel)

### User's Palette (top section)

- Up to 5 color boxes displayed vertically
- Each box: ~100% sidebar width, ~60px tall, rounded rectangle
- Shows: color as background fill + hex code centered in `Share Tech Mono` (auto-contrast text: white or black based on luminance) + small **×** button top-right corner
- **× button:** removes color with a smooth `max-height` + `opacity` shrink-out animation (~250ms)
- **Clicking a color box:** triggers Reverse Mode (see below)
- Empty slots: dashed-border placeholder with faint `"PICK A COLOR"` text

### Palette Suggestions (bottom section)

- Appears once user has ≥ 1 color; uses most recently added color as base
- Separated from user palette by a neon divider line labeled `— SUGGESTIONS —`
- Seven rows, each with a label and 2–5 small color chips (~28px square):

| Row | Label | Colors |
|---|---|---|
| 1 | COMPLEMENTARY | 1 color, 180° opposite |
| 2 | ANALOGOUS | 4 colors, ±15° and ±30° |
| 3 | TRIADIC | 2 colors, 120° and 240° |
| 4 | SPLIT-COMP | 2 colors, 150° and 210° |
| 5 | TETRADIC | 3 colors, 90°, 180°, 270° |
| 6 | MONOCHROMATIC | 4 colors, same hue, 20/40/60/80% lightness |
| 7 | WARM/COOL | 1 warm (+20° toward red), 1 cool (+20° toward blue) |

- Clicking any chip: adds it to user palette (if not full), same add animation
- Empty palette state: placeholder `"ADD A COLOR TO SEE SUGGESTIONS"`
- Suggestions update whenever the most recently added palette color changes

---

## Reverse Mode (Clicking a Palette Color)

When user clicks an existing color box:
1. Convert hex → HSL to extract hue/saturation/lightness
2. Reset circles to default triangle positions
3. Set intensity sliders to values that approximate that color at the canvas center overlap point
4. Position the eyedropper preview circle at the canvas center, showing that color
5. User can drag circles or tweak intensities to edit from there

Note: exact reconstruction is approximate — the goal is a good starting point for manual refinement.

---

## Technical Notes

### Canvas Rendering
- Single `<canvas>` element for the mixing area
- `requestAnimationFrame` loop redraws every frame
- Each circle drawn as a radial gradient:
  ```js
  const grad = ctx.createRadialGradient(x, y, 0, x, y, radius);
  grad.addColorStop(0, `rgba(r, g, b, ${intensity})`);
  grad.addColorStop(1, `rgba(r, g, b, 0)`);
  ctx.globalCompositeOperation = mode === 'light' ? 'screen' : 'multiply';
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fill();
  ```
- Reset `globalCompositeOperation` to `'source-over'` for UI overlays
- Eyedropper samples via `ctx.getImageData(Math.floor(x), Math.floor(y), 1, 1).data`

### Color Math
- RGB ↔ HSL conversion helpers in `script.js`
- Hex ↔ RGB helpers
- All suggestion math done in HSL space (rotate hue, adjust lightness)
- Auto-contrast text: if `0.299*R + 0.587*G + 0.114*B > 128` → black text, else white

### Fonts
`<link>` in `index.html`: `Orbitron`, `Share Tech Mono` from Google Fonts

### CSS Custom Properties
```css
:root {
  --bg: #0a0010;
  --neon-magenta: #ff00cc;
  --neon-cyan: #00ffee;
  --neon-yellow: #ffe600;
  --neon-white: #e8e0ff;
  --panel-bg: rgba(10, 0, 30, 0.75);
  --border: rgba(180, 0, 255, 0.3);
  --glow-sm: 0 0 8px;
  --glow-md: 0 0 16px;
  --glow-lg: 0 0 32px;
}
```

### Slider Label Sync
On mode switch, update slider label text content:
- Light mode: labels → `RED`, `GREEN`, `BLUE`
- Paint mode: labels → `CYAN`, `MAGENTA`, `YELLOW`
