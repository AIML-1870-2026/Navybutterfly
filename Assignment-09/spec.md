# Readable — Color Contrast Explorer
## spec.md for Claude Code

---

## Project Overview
A single-page interactive tool for exploring color contrast and readability.
Users adjust background color, text color, and text size via sliders and see
live contrast ratio calculations, WCAG compliance status, and vision simulation.

**File structure:** `index.html`, `style.css`, `script.js`

---

## Aesthetic
**Scientific lab instrument / colorimeter.** Dark, precise, clinical.

- Background: deep charcoal (`#0c0c10`)
- Panels: semi-transparent dark surfaces with subtle light borders
- **All fonts: Space Mono** (Google Fonts) — monospaced throughout, no exceptions
- Color only appears where the user creates it (swatches, preview area)
- Everything else is near-monochrome: off-whites, dimmed golds, dark grays
- Accent color: muted gold/amber (`#c8b87a`) for labels, slider thumbs, active states
- Slider thumbs: small, gold, circular
- Panel borders: `rgba(255,255,255,0.10)`, slightly brighter on hover
- Border radius: subtle — `8px` on panels, `4px` on small elements

---

## Layout
**Two-column dashboard. Controls left, preview right.**

```
┌──────────────────────────────────────────────────────────────┐
│  ◈ READABLE                                       WCAG 2.1   │  ← header
├───────────────────┬──────────────────────────────────────────┤
│                   │                                          │
│  BACKGROUND       │                                          │
│  R ━━━━━━━  255   │      [ large text preview area ]        │
│  G ━━━━━━━  255   │                                          │
│  B ━━━━━━━  255   │      Sample text renders here at        │
│  [swatch]         │      selected size, BG color, FG color  │
│                   │                                          │
│  TEXT COLOR       ├──────────────────────────────────────────┤
│  R ━━━━━━━  000   │  [ stats bar ]                           │
│  G ━━━━━━━  000   │  21.00:1  │ Normal ✓ PASS │ Large ✓ PASS│
│  B ━━━━━━━  000   ├──────────────────────────────────────────┤
│  [swatch]         │  VISION SIMULATION                       │
│                   │  [ Normal ] [ Protanopia ] [ Deuteranopia│
│  TEXT SIZE        │  [ Tritanopia ] [ Monochromacy ]         │
│  ━━━━━━━━━  32px  ├──────────────────────────────────────────┤
│                   │  PRESETS                                  │
│  LUMINANCE        │  [ card ] [ card ] [ card ]              │
│  BG  0.000        │  [ card ] [ card ] [ card ]              │
│  FG  1.000        │                                          │
└───────────────────┴──────────────────────────────────────────┘
```

Left column: fixed width ~300px. Right column: fills remaining space.

---

## Required Features

### 1. Background Color Controls (left panel, top)
- Panel label: `BACKGROUND` in small caps
- Three rows: R, G, B
- Each row: channel letter label | range slider (0–255) | number input field
- Slider and number input stay in sync bidirectionally (update each other live)
- Color swatch below the three rows showing current BG color, ~32×32px, rounded

### 2. Text Color Controls (left panel, middle)
- Same layout as background controls
- Panel label: `TEXT COLOR`
- Color swatch below

### 3. Text Size Control (left panel, below text color)
- Panel label: `TEXT SIZE`
- Single range slider, range 8–72
- Current value displayed as `32px` (monospaced) to the right
- Default: 32

### 4. Luminance Display (left panel, bottom)
- Panel label: `LUMINANCE`
- Two rows: `BG  X.XXX` and `FG  X.XXX`
- Values formatted to 3 decimal places
- Purely informational — explains where contrast ratio comes from

### 5. Text Preview Area (right panel, main)
- Large area with BG color applied as background, FG color as text color
- Font size reflects text size slider
- Sample text (medical/anatomy themed):
  > "The ascending aorta branches into the brachiocephalic trunk, left common carotid, and left subclavian arteries. Cardiac output equals stroke volume multiplied by heart rate."
- Text is centered vertically and horizontally in the area
- Font: Space Mono
- Smooth transitions on color/size changes (`transition: background 0.1s, color 0.1s, font-size 0.1s`)

### 6. Contrast Ratio Calculation (WCAG algorithm)
1. For each channel (0–255), compute linearized value:
   - `c = channel / 255`
   - if `c <= 0.04045`: `c / 12.92`
   - else: `((c + 0.055) / 1.055) ^ 2.4`
2. Relative luminance: `L = 0.2126*R + 0.7152*G + 0.0722*B`
3. Contrast ratio: `(L_lighter + 0.05) / (L_darker + 0.05)`
4. Recalculates on any RGB change

---

## Stats Bar (right panel, below preview)
A single horizontal bar showing three things inline:

| Section | Content |
|---|---|
| Contrast ratio | Large monospaced number: `21.00:1` |
| Normal text | `NORMAL TEXT` label + PASS/FAIL badge |
| Large text | `LARGE TEXT` label + PASS/FAIL badge |

Dividers between sections. Badges:
- PASS: green text, green border, dark green background
- FAIL: red text, red border, dark red background
- Thresholds: normal text = 4.5:1, large text = 3.0:1

---

## Stretch A — Vision Simulation (right panel, below stats bar)
Panel label: `VISION SIMULATION`

Five toggle buttons in a row:
- Normal
- Protanopia
- Deuteranopia
- Tritanopia
- Monochromacy

Active button: gold border + gold text. Inactive: dimmed.

**Implementation:** SVG `<feColorMatrix>` filter applied to the preview area via CSS `filter: url(#filter-name)`.

Define all filters in hidden `<svg>` in the HTML:

| Vision | Matrix (row-major, 4×5) |
|---|---|
| Normal | identity |
| Protanopia | `0.567 0.433 0 0 0 / 0.558 0.442 0 0 0 / 0 0.242 0.758 0 0 / 0 0 0 1 0` |
| Deuteranopia | `0.625 0.375 0 0 0 / 0.7 0.3 0 0 0 / 0 0.3 0.7 0 0 / 0 0 0 1 0` |
| Tritanopia | `0.95 0.05 0 0 0 / 0 0.433 0.567 0 0 / 0 0.475 0.525 0 0 / 0 0 0 1 0` |
| Monochromacy | `0.299 0.587 0.114 0 0 / 0.299 0.587 0.114 0 0 / 0.299 0.587 0.114 0 0 / 0 0 0 1 0` |

**Important:** When a non-normal vision mode is active, lock the RGB sliders and number inputs (disabled/reduced opacity, `cursor: not-allowed`). Show a small note: `"color controls locked during simulation"`. Only apply filter to the preview area, not the swatches or rest of the UI.

---

## Stretch B — WCAG Compliance Badges
Included in the stats bar (described above).

Logic:
- Normal text badge: PASS if contrast ratio ≥ 4.5, else FAIL
- Large text badge: PASS if contrast ratio ≥ 3.0, else FAIL
- Both update live with slider changes

---

## Stretch C — Preset Color Schemes (right panel, bottom)
Panel label: `PRESETS`

Six clickable cards in a 3×2 grid. Each card shows:
- A small split rectangle swatch (left half = BG color, right half = FG color)
- Preset name below in small mono text
- Contrast ratio shown on the card in tiny text

Presets:

| Name | BG | FG |
|---|---|---|
| Classic | `rgb(255,255,255)` | `rgb(0,0,0)` |
| Dark Mode | `rgb(26,26,46)` | `rgb(255,255,255)` |
| Ocean | `rgb(0,119,182)` | `rgb(255,255,255)` |
| Warning | `rgb(255,209,102)` | `rgb(0,0,0)` |
| Danger Zone | `rgb(160,160,160)` | `rgb(128,128,128)` |
| Newsprint | `rgb(245,240,232)` | `rgb(45,45,45)` |

Clicking a card:
1. Resets vision simulation to Normal
2. Loads BG and FG RGB values into all sliders and number inputs
3. Re-renders everything

Card hover: slight brightness lift + gold border.

---

## Default State
- BG: `255, 255, 255` (white)
- FG: `0, 0, 0` (black)
- Text size: `32`
- Vision: Normal

---

## Technical Notes
- No frameworks, no build tools — vanilla HTML/CSS/JS only
- Google Fonts import for Space Mono at top of `style.css`
- All logic in `script.js`, no inline JS in HTML
- Number inputs: hide browser spin arrows via CSS
- Slider inputs: fully custom styled (no browser defaults)
- Responsive: at viewport width ≤ 768px, stack columns vertically
