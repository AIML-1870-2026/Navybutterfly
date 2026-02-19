# RGB Color Studio — spec.md
## AIML 1870 | RGB Petal Wheel Quest

---

## Overview

A playful, interactive RGB Color Studio built around a **paint mixing metaphor** — but with a twist. While the interface looks and feels like mixing paint on a cartoon artist's palette, the underlying math is *additive RGB light mixing*. The app leans into this contrast as a teaching moment: "This is how a painter thinks — but here's what's actually happening in your pixels." The left panel houses the **Paint Mixer Explorer** with draggable blobs and sliders. The right panel holds the **Palette Generator + Color Theory Coach**, which updates live as you mix.

---

## Layout

Two-panel split layout (side-by-side on desktop, stacked on mobile):

- **Left panel (~55% width):** Paint Mixer Explorer
- **Right panel (~45% width):** Palette Generator + Color Theory Coach, stacked vertically

A sticky header bar runs across the top with the app title ("RGB Color Studio") and a small subtitle: *"Because red + green light ≠ brown."*

---

## Left Panel: Paint Mixer Explorer

### Visual Concept
A large cartoonish artist's palette (the classic kidney/thumbhole shape) rendered in SVG, slightly tilted for personality. Three chunky paint tube illustrations sit above it — one red, one green, one blue — each labeled with its primary color name and current value (0–255).

### Paint Blobs
- Each primary has a draggable paint blob on the palette, rendered as a wobbly/organic circle with a glossy highlight
- Blob **size** scales with the slider value (small at 0, large at 255)
- Blob **opacity** also reflects the value
- Where blobs visually overlap, a CSS `mix-blend-mode: screen` or SVG filter renders the additive blend visually
- Dragging a blob repositions it; the overlap region updates in real time

### Sliders
- Three horizontal sliders beneath the palette, styled as thick rounded tracks with colored thumbs (red/green/blue)
- Each slider is labeled: **R**, **G**, **B**, with the current numeric value shown live
- Moving a slider animates the corresponding blob's size
- Sliders and blobs are bidirectionally linked — dragging a blob toward the center "feels" like adding more paint

### Mixed Result Display
- A large rounded swatch in the bottom-left of the palette shows the final mixed color: `rgb(R, G, B)`
- Beneath it: the hex code in monospace font, with a 📋 **click-to-copy** button that shows a "Copied!" toast on click
- A subtle pulsing glow animation on the swatch that breathes with the dominant primary's color

### The Teaching Callout
A small illustrated speech bubble (from a tiny cartoon scientist character wearing chunky glasses — a nod to the original idea) near the top of the palette says something like:
> *"Paint artists: red + green = brown. But your screen? Red + green = yellow. You're mixing light, not pigment!"*

This updates contextually based on what's being mixed:
- If R ≈ G and B ≈ 0 → "Red + Green light = Yellow! Surprised?"
- If G ≈ B and R ≈ 0 → "Green + Blue = Cyan — the color of tropical water."
- If R = G = B → "Equal R, G, B = Gray (or White at 255). Balanced light."
- etc.

### Animations
- Blobs have a subtle **wobble/jiggle** on drag release (CSS spring animation)
- When a slider snaps to 0, the corresponding blob does a little "deflate" squish
- When a slider hits 255, the blob does a quick "pop" scale-up
- Smooth color transitions (200ms ease) on all swatch/result updates

---

## Right Panel: Palette Generator + Color Theory Coach

### Section 1: Color Theory Coach (top ~35% of right panel)

A card with a dark background and colorful accent. Displays three sub-sections that update live as you mix:

**Hue**
- Plain-language explanation of the current hue based on the two dominant primaries
- Example: *"Your hue is Orange — Red and Green are your dominant channels (R: 255, G: 140). Red wins, with Green pulling it warm."*
- A small arc/wedge on a mini color wheel SVG highlights where the current hue sits

**Saturation / Chroma**
- Explains how "pure" or "washed out" the color is
- Example: *"Saturation is high — your smallest channel (Blue: 12) is very low, so there's almost no white washing it out. This is a vivid, punchy color."*
- Example (low sat): *"Saturation is low — all three channels are close together, which means you're close to gray. Add more contrast between channels for a punchier hue."*

**Value / Lightness**
- Explains brightness
- Example: *"Value is medium — your channels aren't maxed out, so the color feels rich rather than neon-bright."*
- Example: *"Value is very high — at least one channel is near 255 and the others are elevated too, making this a pastel or near-white."*

**The Twist Explainer** (collapsed accordion, always present)
- Title: *"Wait — isn't red + green = brown?"*
- Expands to a short 3-sentence explanation of additive vs. subtractive color mixing with a tiny side-by-side diagram (two colored circles overlapping, labeled "Light" and "Paint")

---

### Section 2: Palette Generator (bottom ~65% of right panel)

**Base Color Display**
- Shows the currently mixed color as the "base" with its hex code
- A "🎲 Randomize" button that randomizes R/G/B sliders with a fun spin animation and updates everything

**Harmony Type Selector**
- A row of pill/chip buttons, one per harmony type:
  - Complementary
  - Analogous
  - Triadic
  - Split-Complementary
  - Tetradic / Square
- Active harmony type is highlighted; clicking switches the palette below

**Palette Swatches**
- A row of color swatches (2–5 depending on harmony type), each:
  - Rendered as a tall rounded rectangle
  - Shows the hex code below in small monospace text
  - Has a 📋 copy button on hover
  - Animates in one-by-one (staggered slide-up) when the harmony type or base color changes
- Below each swatch: the color name (generated via a simple algorithmic color namer — e.g., "Burnt Sienna," "Seafoam," "Dusty Mauve") based on HSL ranges

**Contrast Checker**
- Below the palette: a small grid showing contrast ratios between each palette color pair
- Each cell shows the ratio (e.g., `4.7:1`) and a badge: ✅ AA, ✅ AAA, or ❌ Fail
- Uses WCAG formula: `(L1 + 0.05) / (L2 + 0.05)` with relative luminance `0.2126R + 0.7152G + 0.0722B` (linearized)
- A brief tooltip on hover explains what AA/AAA means

**Color Blindness Simulator**
- A toggle row beneath the contrast checker with 4 modes:
  - 👁️ Normal
  - 🔴 Protanopia (red-blind)
  - 🟢 Deuteranopia (green-blind)
  - 🔵 Tritanopia (blue-blind)
- Selecting a mode applies the appropriate RGB matrix transform to all palette swatches
- A small label beneath: *"Seeing your palette through different eyes."*
- Implemented via known color blindness simulation matrices (LMS color space transforms)

---

## Visual Style

- **Palette:** Bright, saturated, playful — think Procreate meets a children's science kit
- **Background:** Off-white or very light warm gray (`#FDF8F2`), like a sketchbook page
- **Fonts:** A chunky rounded display font for headers (Google Fonts: *Nunito* or *Fredoka One*), monospace for hex codes (*JetBrains Mono* or *Space Mono*)
- **Borders/Cards:** Thick (3px) dark borders (`#1A1A2E`) with slight drop shadows — a playful comic/sticker aesthetic
- **Buttons:** Rounded pill shape, bold colors, slight scale-up on hover, satisfying click feedback
- **The cartoon scientist:** A small SVG character (simple line art, big round glasses) anchored near the teaching callout — just a face + glasses, no complex animation

---

## Technical Notes

- **Split into three files:** `index.html`, `style.css`, `script.js` — linked normally, no build step needed
- SVG for the palette shape and mini color wheel
- CSS custom properties for all theme colors
- `mix-blend-mode: screen` for blob overlap visualization (mimicking additive mixing visually)
- Color math done in JavaScript: RGB → HSL conversion for wheel positioning; HSL → RGB for palette generation
- Color blindness matrices sourced from Machado et al. (2009) — widely available reference
- Contrast ratio per WCAG 2.1 spec
- Clipboard API (`navigator.clipboard.writeText`) for copy-to-clipboard
- No external libraries required (pure vanilla JS + SVG)
- Target: fully functional at 1280px wide; responsive down to 768px (stacked)

---

## File Structure

```
rgb-color-studio/
├── index.html        ← structure and markup only, links to CSS + JS
├── style.css         ← all styling, animations, layout
├── script.js         ← all logic, organized in clear sections:
│                        1. Color math (RGB↔HSL, contrast, blindness matrices)
│                        2. Blob/slider UI interactions
│                        3. Palette generator
│                        4. Color Theory Coach text updates
│                        5. Clipboard + toast
└── README.md         ← brief description + live link
```

---

## Submission

Deploy to GitHub Pages at:
`https://[your-username].github.io/rgb-color-studio/`

Submit the live URL to Canvas.
