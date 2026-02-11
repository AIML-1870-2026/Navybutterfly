# Julia Set Explorer — Spec Document

## Project Overview
A beginner-friendly, visually stunning Julia Set explorer with a dark cosmic aesthetic. The centerpiece is a side-by-side Mandelbrot-Julia connection view: users click anywhere on the Mandelbrot set and instantly see the corresponding Julia set rendered beside it. The emphasis is on beauty, approachability, and smooth interactions — not dense controls.

## Visual Theme
- **Dark cosmic aesthetic** — deep space background (near-black with subtle star-field or gradient), glowing fractal renders, soft UI elements
- Fonts: clean sans-serif (e.g., Inter or system font stack), light text on dark backgrounds
- UI controls should feel minimal and modern — dark glass/frosted panels, subtle borders, soft glows on hover
- The fractals themselves are the visual hero — everything else stays out of the way

## Layout

### Header
- App title: "Julia Set Explorer" (or a creative name — suggest something cosmic)
- Small subtitle: one-liner explaining what this is (e.g., "Explore infinite fractal worlds by clicking the Mandelbrot set")

### Main View: Side-by-Side Split
- **Left panel: Mandelbrot Set**
  - Renders the full Mandelbrot set
  - Crosshair cursor on hover
  - Click anywhere to select a `c` value
  - Small label showing current `c = a + bi` coordinates
  - A dot or crosshair marker on the clicked point
  - Zoom and pan support (mouse wheel to zoom, click-drag to pan)

- **Right panel: Julia Set**
  - Renders the Julia set corresponding to the selected `c` value
  - Updates in real time (or near-real-time) when a new point is clicked
  - Zoom and pan support (independent from the Mandelbrot panel)
  - Smooth transition/fade when switching between Julia sets

### Controls Bar (below the canvases)

#### Color Palette Selector
Four gorgeous preset palettes, displayed as small gradient preview swatches the user can click:
1. **Nebula** — purples, blues, pinks (default)
2. **Solar Flare** — oranges, reds, golds
3. **Ice/Frost** — whites, light blues, silver
4. **Inferno** — deep reds, oranges, black

All palettes should look stunning against the dark background. Bounded (interior) points render as black or very dark for all palettes.

#### Preset Julia Sets
A row of clickable preset buttons that jump to famous/interesting `c` values. Each button should have a name and automatically update both the Mandelbrot marker and the Julia render:
- **Spiral** (c = -0.75 + 0.11i)
- **Dendrite** (c = i, i.e., 0 + 1i)
- **Douady Rabbit** (c = -0.123 + 0.745i)
- **San Marco** (c = -0.75 + 0i)
- **Starfish** (c = -0.54 + 0.54i)
- **Lightning** (c = -0.1 + 0.8i)
- **Galaxy** (c = 0.285 + 0.01i)

#### Animation / Morph Toggle
- A "Morph" button that, when activated, slowly animates the `c` parameter along a circular or custom path in the complex plane
- The Julia set smoothly morphs as `c` changes — this is the "wow factor" feature
- A speed slider to control how fast the morphing happens
- A stop/pause button to freeze on an interesting frame
- The Mandelbrot crosshair should move along the path as it animates

### Info Panel (collapsible)
- A small "ℹ️ What am I seeing?" button in the corner
- Expands to show a brief, friendly explanation:
  - What the Mandelbrot set is (map of all Julia sets)
  - What the Julia set is (fractal for a specific c value)
  - Why points inside are black (bounded) vs colored (escaped)
  - What the colors mean (escape speed)
- Written in casual, beginner-friendly language — no jargon
- Collapsible so it doesn't clutter the view

## Interaction Behaviors
- **Click on Mandelbrot** → Julia set updates with smooth fade/transition
- **Mouse wheel on either canvas** → zoom in/out centered on cursor
- **Click-drag on either canvas** → pan
- **Click a preset button** → Mandelbrot marker jumps to that point, Julia set updates
- **Click a palette swatch** → both canvases re-render with new colors
- **Toggle morph** → animation begins, c traces a path, Julia morphs continuously
- **Double-click either canvas** → reset zoom to default view

## Technical Requirements
- Single HTML file with embedded CSS and JavaScript (for easy GitHub Pages deployment)
- Use HTML5 `<canvas>` for rendering (two canvases, one per panel)
- Fractal computation should use Web Workers if possible for smooth UI (the main thread shouldn't freeze during renders)
- Target 800×600 or similar resolution per canvas, responsive if possible
- Max iterations: ~200 for default view, can increase for deep zooms
- Smooth color interpolation between iteration bands (not blocky/banded colors)

## Color Palette Definitions (approximate)
These are starting points — the implementation should interpolate smoothly between these anchor colors:

- **Nebula**: black → deep purple → blue → magenta → pink → white
- **Solar Flare**: black → dark red → orange → gold → yellow → white
- **Ice/Frost**: black → dark blue → steel blue → light blue → silver → white
- **Inferno**: black → dark crimson → red → orange → bright orange → yellow

## Stretch Goals (implement if time allows)
- Save/download fractal as PNG image
- Fullscreen mode for the Julia set canvas
- Iteration count display showing render performance
- Smooth zoom animation (animated zoom rather than instant jump)
- Mobile-responsive layout (stack canvases vertically on small screens)

## Deployment
- GitHub Pages at: [username].github.io/julia-explorer
- Single index.html file (or minimal file structure)
