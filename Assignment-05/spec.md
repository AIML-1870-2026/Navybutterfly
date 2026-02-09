# Turing Patterns Explorer - Specification

## Project Overview
An interactive Turing Patterns (reaction-diffusion) explorer with biome-themed backgrounds that change based on the selected pattern preset. The application should be visually striking while remaining clean and functional.

## Core Concept
Each pattern preset represents a natural organism/pattern and displays against an appropriate biome background, creating an immersive educational experience that connects the mathematics to the natural world.

## Pattern Presets & Biomes

### 1. Leopard Spots
- **Parameters:** F=0.035, K=0.065
- **Background:** Jungle (lush green foliage, tropical leaves)
- **Description:** "Leopard spots emerge from simple chemical rules"

### 2. Zebra Stripes
- **Parameters:** F=0.035, K=0.060
- **Background:** Savannah (golden grasslands, acacia trees silhouette)
- **Description:** "Classic stripe patterns found in African wildlife"

### 3. Coral Pattern
- **Parameters:** F=0.039, K=0.058
- **Background:** Underwater reef (blue ocean depths, coral silhouettes)
- **Description:** "Brain coral textures from the ocean depths"

### 4. Giraffe Patches
- **Parameters:** F=0.029, K=0.057
- **Background:** African savannah (warm sunset tones, scattered trees)
- **Description:** "Giraffe patch patterns across the savannah"

### 5. Maze/Labyrinth
- **Parameters:** F=0.029, K=0.057
- **Background:** Desert landscape (sand dunes, warm earth tones)
- **Description:** "Self-organizing maze patterns"

### 6. Mitosis/Waves
- **Parameters:** F=0.014, K=0.054
- **Background:** Microscopic/cellular (abstract blue-purple gradient)
- **Description:** "Cellular division patterns at microscopic scale"

## User Interface Layout

### Canvas Area
- **Size:** 512x512 pixels simulation canvas
- **Position:** Centered on page
- **Styling:** 
  - Subtle drop shadow or soft glow effect
  - Slightly elevated appearance over background
  - Optional: Very subtle border (1px, low opacity)

### Background System
- **Implementation:** Full-page background image that changes with preset
- **Transition:** Smooth cross-fade (0.6 second duration)
- **Opacity:** Backgrounds at ~40% opacity, blurred slightly for depth
- **Fallback:** Solid color gradient if images unavailable

### Control Panel
- **Position:** Below or to the right of canvas
- **Layout:** Clean, modern button arrangement
- **Sections:**
  1. **Pattern Presets** (6 buttons in 2 rows of 3)
  2. **Color Schemes** (3 buttons)
  3. **Simulation Controls** (Reset, Pause/Play)

## Color Schemes

### 1. Natural (default)
- Warm earth tones: browns, tans, oranges
- Mimics actual animal coloring

### 2. Ocean
- Blue-to-teal gradient
- Aquatic, cool tones

### 3. Thermal
- Heat-map style: purple → red → yellow → white
- Scientific visualization aesthetic

## Interaction Behaviors

### Canvas Interaction
- **Mouse drag:** Disturbs chemicals (adds activator chemical)
- **Brush size:** Medium (configurable in code, ~15-20 pixels)
- **Visual feedback:** Cursor changes to indicate draw mode

### Preset Buttons
- **Click behavior:** 
  1. Update F/K parameters
  2. Trigger background transition
  3. Reset simulation to show new pattern
  4. Button highlights to show active preset

### Color Scheme Buttons
- **Click behavior:**
  1. Updates color palette for rendering
  2. Active button highlighted
  3. No simulation reset needed

### Control Buttons
- **Reset:** Clears canvas, randomizes initial state, maintains current preset/colors
- **Pause/Play:** Toggles simulation updates, button text changes accordingly

## Technical Requirements

### Simulation Engine
- **Algorithm:** Gray-Scott reaction-diffusion
- **Grid size:** 256x256 (rendered to 512x512 canvas)
- **Update rate:** 60 FPS target
- **Diffusion rates:** Du = 1.0, Dv = 0.5 (standard values)

### Performance
- **Optimization:** Use efficient loops, avoid unnecessary allocations
- **Responsiveness:** UI should remain responsive during simulation

### File Structure
```
index.html          # Main HTML structure
styles.css          # All styling including backgrounds
script.js           # Simulation logic and UI controls
README.md           # Project description and live URL
```

## Visual Design Preferences

### Typography
- Clean, modern sans-serif font
- Preset buttons: Clear labels with optional small description text
- Title: "Turing Patterns Explorer" at top

### Color Palette (UI elements)
- Background overlay: Semi-transparent dark panel for controls
- Buttons: Subtle colors that don't compete with simulation
- Active states: Clear but not garish highlighting

### Spacing
- Generous padding around elements
- Clear visual hierarchy
- Mobile-responsive considerations (bonus, not required)

## Background Images
Since we're working quickly, use CSS gradients that evoke the biomes rather than requiring actual image files:

- **Jungle:** Deep green gradient with darker accents
- **Savannah:** Golden-yellow to tan gradient
- **Underwater:** Deep blue to teal gradient
- **African Sunset:** Warm orange to purple gradient
- **Desert:** Sandy tan to warm brown gradient
- **Microscopic:** Blue-purple to pink gradient

## Implementation Notes
- Start with working simulation first
- Add UI controls second
- Add backgrounds and transitions last
- Test all presets to ensure interesting patterns appear
- Ensure "drag to disturb" feels responsive and satisfying

## Success Criteria
- All 6 presets produce visually distinct patterns
- Backgrounds transition smoothly between presets
- Color schemes apply correctly
- Controls work reliably
- Overall aesthetic is polished and cohesive
- Canvas interaction feels natural and responsive
