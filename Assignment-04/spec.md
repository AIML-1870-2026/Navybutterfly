# BOIDS SIMULATION - COMPREHENSIVE TECHNICAL SPECIFICATION

## PROJECT OVERVIEW
Build an interactive boids simulation that exceeds assignment requirements through creative modes, visual theming, performance optimization, and polished UX. Target: stand out among 45 student projects through technical depth AND creative wow-factor.

## 1. CORE REQUIREMENTS (Assignment Must-Haves)

### 1.1 Parameter Controls (Real-time sliders)
- **Separation Weight** (0-5, default: 1.5, step: 0.1)
  - Tooltip: "Avoid crowding—higher = more personal space"
- **Alignment Weight** (0-5, default: 1.0, step: 0.1)
  - Tooltip: "Match neighbors' direction—higher = smoother flocking"
- **Cohesion Weight** (0-5, default: 1.0, step: 0.1)
  - Tooltip: "Stay with the group—higher = tighter clusters"
- **Neighbor Radius** (20-200px, default: 80px, step: 5)
  - Tooltip: "How far boids can 'see' neighbors"
- **Max Speed** (1-10, default: 4, step: 0.5)
  - Tooltip: "Maximum velocity—higher = faster, more chaotic"

### 1.2 Behavior Presets (One-click configurations)
1. **"Schooling"** - Smooth, coordinated movement
   - Separation: 1.0, Alignment: 2.5, Cohesion: 1.2, Radius: 100, Speed: 3
2. **"Chaotic Swarm"** - Erratic, unpredictable
   - Separation: 0.5, Alignment: 0.3, Cohesion: 0.8, Radius: 40, Speed: 6
3. **"Tight Cluster"** - Dense, slow-moving group
   - Separation: 0.8, Alignment: 1.0, Cohesion: 3.0, Radius: 120, Speed: 2

### 1.3 Instrumentation (Live readouts)
- **FPS** (frames per second, update every 500ms)
- **Boid Count** (current number of active boids)
- **Average Speed** (mean velocity across all boids, 1 decimal)
- **Average Neighbors** (mean neighbors per boid within radius, 1 decimal)

### 1.4 Basic Controls
- **Reset** - Return to initial state (200 boids, default params)
- **Pause/Resume** - Toggle simulation update loop
- **Boid Count Slider** (50-1000, default: 200, step: 50)
  - Updates spawn new boids or removes excess

### 1.5 Boundary Behavior
- **Toggle: Wrap vs Bounce**
  - Wrap: Boids teleport to opposite edge
  - Bounce: Boids reflect off edges
- Visual indicator showing current mode

---

## 2. STRETCH GOALS (Assignment Extra Credit)

### 2.1 Perception Cone ✅
- Boids only "see" neighbors within 120° forward field-of-view
- Toggle: "Omnidirectional vs Cone Vision"
- Visual debug mode: Draw perception cone for selected boid (click to select)

### 2.2 Obstacle Avoidance ✅
- Circular obstacles that boids steer around
- Avoidance force: 2x separation weight when within obstacle radius + neighbor radius
- See "Painter Mode" below for interactive obstacle placement

### 2.3 Spatial Partitioning ✅
- Uniform grid (cell size = neighbor radius)
- Reduces neighbor checks from O(n²) to O(n)
- Performance comparison display: "Spatial Grid: ON (580 FPS) vs OFF (140 FPS)"

### 2.4 Heterogeneous Species ✅
- Two flocks: "Blue Team" and "Red Team"
- Different parameter sets per species
- Inter-species behavior: ignore alignment/cohesion, double separation

### 2.5 Live Charting ✅
- Real-time line graph (last 60 seconds of data)
- Metrics: Average neighbors, speed variance, flock compactness
- Toggle chart visibility (collapsible panel)

### 2.6 Trails & Visual Effects ✅
- Motion trails (fade over 1 second)
- Toggle: Trails ON/OFF
- Trail color matches boid color or theme

---

## 3. CREATIVE MODES SYSTEM (The "Wow Factor")

### 3.1 MODE SELECTOR
- Dropdown or tab interface: "Normal | Predator | Painter | Evolution | Sound Reactive"
- Modes are mutually exclusive (selecting one disables others)
- Each mode has its own UI panel with mode-specific controls

### 3.2 PREDATOR MODE 🦅
**Concept**: Mouse becomes a hawk; boids flee in panic

**Behavior**:
- Predator position = mouse cursor
- Predator radius = 150px (adjustable slider)
- Boids within radius experience "flee force" (3x separation weight)
- Flee force direction: directly away from predator
- Visual: Predator rendered as red circle with crosshairs or hawk icon

**UI**:
- Predator Radius slider (50-300px)
- "Predator Speed" toggle: stationary vs follows mouse with slight delay (more realistic hunting)
- Kill counter: Boid "dies" if predator gets within 10px (respawns after 3 seconds)

**Creative Twist**: 
- Predator leaves a "fear trail"—boids remember recent predator positions and avoid those areas for 5 seconds
- "Panic state": When predator kills a boid, nearby boids turn orange and move 50% faster for 2 seconds

### 3.3 PAINTER MODE 🎨
**Concept**: Click and drag to create obstacles, watch boids navigate

**Behavior**:
- Click: Place circular obstacle (radius 30px)
- Click + Drag: Draw obstacle path (chain of circles)
- Right-click: Remove obstacle
- Obstacles persist until manually cleared

**UI**:
- "Clear All Obstacles" button
- Obstacle radius slider (10-80px)
- Obstacle type dropdown:
  - Static (never moves)
  - Drift (slow random movement)
  - Repel (pushes boids away like a magnet)
- "Save/Load Layout" buttons (export obstacle JSON, load from file)

**Creative Twist**:
- "Maze Generator" button: Auto-generate random obstacle maze
- "Follow Mode": One obstacle follows mouse, creating dynamic challenges

### 3.4 EVOLUTION MODE 🧬
**Concept**: Boids adapt over time based on survival near predators

**Behavior**:
- Enable predator automatically (or multiple random-moving predators)
- Boids have hidden "fitness" stat (0-100)
- Fitness increases when boid survives near predator (+1 per second within 200px)
- Every 10 seconds, bottom 20% fitness boids "die" and respawn with params averaged from top 20%
- Visual: Boid color intensity = fitness (dim = low, bright = high)

**UI**:
- Generation counter
- Fitness histogram (live chart showing fitness distribution)
- "Evolution Speed" slider (how often selection happens: 5-30 seconds)
- Display current "champion" boid (highest fitness) with spotlight

**Creative Twist**:
- Trait mutation: When boids respawn, randomly mutate one parameter by ±10%
- "Speciation": After 5 generations, boids cluster into two species based on parameter similarity

### 3.5 SOUND REACTIVE MODE 🎵
**Concept**: Boids respond to music or microphone input

**Behavior**:
- Request microphone access (or allow file upload for music)
- Analyze audio in real-time:
  - **Bass (0-200 Hz)**: Increases cohesion (boids cluster on bass drops)
  - **Mid (200-2000 Hz)**: Increases alignment (smooth flocking)
  - **Treble (2000+ Hz)**: Increases separation (scatter on high notes)
- Visual: Background pulses with audio intensity

**UI**:
- Audio source selector: "Microphone | Upload File"
- Frequency band visualizer (3-bar EQ display)
- Sensitivity sliders for each band (how much audio affects params)
- "Mute" toggle (stop audio processing but keep visual effects)

**Creative Twist**:
- "Beat Detection": On strong beats, spawn 10 new boids that fade out after 3 seconds
- "Color Sync": Boid colors shift based on dominant frequency (bass = red, mid = green, treble = blue)

---

## 4. VISUAL THEMING SYSTEM

### 4.1 THEME SELECTOR
Dropdown in top-right corner: "Minimal | Neon | Nature | Comic Book | Digital"

### 4.2 THEME DEFINITIONS

**MINIMAL**
- Background: #FFFFFF (white)
- Boids: Small black circles (3px radius)
- Trails: Light gray, 50% opacity
- UI: Clean sans-serif, light gray panels
- Grid lines (if shown): Thin light gray

**NEON**
- Background: #0a0a0a (near-black)
- Boids: Glowing cyan/magenta gradient circles (5px radius, bloom effect)
- Trails: Neon glow with motion blur
- UI: Cyberpunk style, glowing borders
- Particles: Add sparkles on boid creation/death
- Font: Futuristic monospace (e.g., "Orbitron")

**NATURE**
- Background: Soft sky blue gradient (#87CEEB → #E0F6FF)
- Boids: Bird silhouettes (use simple SVG or Unicode "🐦", 8px size)
- Trails: Feather-like fade
- Obstacles: Tree stumps (brown circles with texture)
- UI: Earthy tones, wood grain textures
- Font: Rounded sans-serif

**COMIC BOOK**
- Background: Halftone dot pattern (like comic print)
- Boids: Bold outlined circles with bright fill (red, blue, yellow)
- Trails: Motion lines (like comic speed effects)
- UI: Speech bubble style panels, "POW!" style labels
- Font: Bold impact-style font
- Sound effects on collisions: "BONK!" text appears briefly

**DIGITAL**
- Background: Matrix-style falling code (faint green)
- Boids: Wireframe triangles or hexagons (geometric, not circles)
- Trails: Binary code "0101" fading out
- UI: Terminal/hacker aesthetic, green monospace text
- Grid: Tron-style glowing grid lines
- Font: Monospace (e.g., "Courier New")

### 4.3 THEME TRANSITIONS
- Smooth CSS transitions (0.3s) when switching themes
- No layout jumps—only colors, fonts, and visual effects change

---

## 5. TECHNICAL ARCHITECTURE

### 5.1 FILE STRUCTURE
```
boids-simulation/
├── index.html          (main page, all UI structure)
├── styles.css          (all themes, responsive layout)
├── script.js           (main simulation loop, boid class)
├── spatial-grid.js     (spatial partitioning logic)
├── audio-analyzer.js   (sound reactive mode, Web Audio API)
├── themes.js           (theme definitions and switcher)
└── README.md           (project documentation)
```

### 5.2 BOID CLASS STRUCTURE
```javascript
class Boid {
  constructor(x, y, species = 'blue') {
    this.position = createVector(x, y);
    this.velocity = p5.Vector.random2D().mult(2);
    this.acceleration = createVector(0, 0);
    this.species = species;  // 'blue' or 'red'
    this.fitness = 50;       // for evolution mode
    this.neighbors = [];
  }

  update() { /* apply acceleration, update position */ }
  
  applyForce(force) { /* add to acceleration */ }
  
  flock(boids, spatialGrid) {
    // Get neighbors from spatial grid (not all boids)
    this.neighbors = spatialGrid.getNeighbors(this);
    
    let sep = this.separate(this.neighbors);
    let ali = this.align(this.neighbors);
    let coh = this.cohesion(this.neighbors);
    
    // Apply weights from sliders
    sep.mult(separationWeight);
    ali.mult(alignmentWeight);
    coh.mult(cohesionWeight);
    
    this.applyForce(sep);
    this.applyForce(ali);
    this.applyForce(coh);
  }
  
  separate(neighbors) { /* standard separation logic */ }
  align(neighbors) { /* standard alignment logic */ }
  cohesion(neighbors) { /* standard cohesion logic */ }
  
  edges() { /* wrap or bounce based on boundary mode */ }
  
  render(theme) { /* draw boid based on current theme */ }
}
```

### 5.3 SPATIAL GRID (Performance Optimization)
```javascript
class SpatialGrid {
  constructor(cellSize) {
    this.cellSize = cellSize;
    this.grid = new Map();  // key: "x,y", value: [boids]
  }

  clear() { this.grid.clear(); }

  insert(boid) {
    let cell = this.getCell(boid.position);
    let key = `${cell.x},${cell.y}`;
    if (!this.grid.has(key)) this.grid.set(key, []);
    this.grid.get(key).push(boid);
  }

  getNeighbors(boid) {
    // Check 9 cells (current + 8 surrounding)
    let neighbors = [];
    let cell = this.getCell(boid.position);
    for (let dx = -1; dx <= 1; dx++) {
      for (let dy = -1; dy <= 1; dy++) {
        let key = `${cell.x + dx},${cell.y + dy}`;
        if (this.grid.has(key)) {
          neighbors.push(...this.grid.get(key));
        }
      }
    }
    return neighbors.filter(other => 
      other !== boid && 
      p5.Vector.dist(boid.position, other.position) < neighborRadius
    );
  }

  getCell(position) {
    return {
      x: Math.floor(position.x / this.cellSize),
      y: Math.floor(position.y / this.cellSize)
    };
  }
}
```

### 5.4 AUDIO ANALYZER (Sound Reactive Mode)
```javascript
class AudioAnalyzer {
  constructor() {
    this.audioContext = null;
    this.analyzer = null;
    this.dataArray = null;
    this.bassLevel = 0;
    this.midLevel = 0;
    this.trebleLevel = 0;
  }

  async initMicrophone() {
    let stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    this.audioContext = new AudioContext();
    let source = this.audioContext.createMediaStreamSource(stream);
    this.analyzer = this.audioContext.createAnalyser();
    this.analyzer.fftSize = 512;
    source.connect(this.analyzer);
    this.dataArray = new Uint8Array(this.analyzer.frequencyBinCount);
  }

  analyze() {
    if (!this.analyzer) return;
    this.analyzer.getByteFrequencyData(this.dataArray);
    
    // Split into frequency bands
    let bassRange = this.dataArray.slice(0, 10);    // 0-200 Hz
    let midRange = this.dataArray.slice(10, 100);   // 200-2000 Hz
    let trebleRange = this.dataArray.slice(100);    // 2000+ Hz
    
    this.bassLevel = this.average(bassRange) / 255;
    this.midLevel = this.average(midRange) / 255;
    this.trebleLevel = this.average(trebleRange) / 255;
  }

  average(arr) {
    return arr.reduce((sum, val) => sum + val, 0) / arr.length;
  }

  applyToParams() {
    // Modulate parameters based on audio
    cohesionWeight = baseCohesion + (this.bassLevel * bassSensitivity);
    alignmentWeight = baseAlignment + (this.midLevel * midSensitivity);
    separationWeight = baseSeparation + (this.trebleLevel * trebleSensitivity);
  }
}
```

### 5.5 PERFORMANCE TARGETS
- **60 FPS** with 200 boids (no spatial grid)
- **60 FPS** with 1000 boids (with spatial grid)
- Smooth slider updates (no lag when adjusting params)
- Theme switches in <300ms

---

## 6. UI/UX DESIGN

### 6.1 LAYOUT
```
+----------------------------------------------------------+
|  [Theme Dropdown ▼]           BOIDS SIMULATION   [? Help]|
+----------------------------------------------------------+
|                                                           |
|  [Canvas - Full viewport minus UI panels]                |
|                                                           |
|                                                           |
+----------------------------------------------------------+
|  LEFT PANEL (280px wide, collapsible):                   |
|  ┌─ CONTROLS ────────────────────────────────────────┐  |
|  │ Separation     [====|----] 1.5                     │  |
|  │ Alignment      [======|--] 2.0                     │  |
|  │ Cohesion       [===|-----] 1.0                     │  |
|  │ Neighbor Radius [=====|--] 100px                   │  |
|  │ Max Speed      [====|----] 4.0                     │  |
|  │ Boid Count     [====|----] 200                     │  |
|  ├─ PRESETS ─────────────────────────────────────────┤  |
|  │ [Schooling] [Chaotic] [Tight Cluster]             │  |
|  ├─ MODES ───────────────────────────────────────────┤  |
|  │ [Normal ▼]  ← Dropdown: Predator/Painter/etc      │  |
|  │ ... mode-specific controls appear here ...        │  |
|  ├─ OPTIONS ─────────────────────────────────────────┤  |
|  │ Boundary: ○ Wrap  ● Bounce                        │  |
|  │ Vision:   ● Omni  ○ Cone                          │  |
|  │ Trails:   ☑ Enabled                               │  |
|  │ Spatial Grid: ☑ ON (580 FPS vs 140 OFF)           │  |
|  ├─ ACTIONS ─────────────────────────────────────────┤  |
|  │ [▶ Pause] [🔄 Reset]                              │  |
|  └──────────────────────────────────────────────────┘  |
+----------------------------------------------------------+
|  BOTTOM PANEL (60px tall, always visible):               |
|  FPS: 60  |  Boids: 200  |  Avg Speed: 3.2  |  Avg      |
|  Neighbors: 8.4  |  [▼ Show Charts]                     |
+----------------------------------------------------------+
```

### 6.2 RESPONSIVE DESIGN
- **Desktop (>1200px)**: Side panel visible, full canvas
- **Tablet (768-1200px)**: Collapsible side panel (hamburger menu)
- **Mobile (<768px)**: Bottom sheet UI, simplified controls

### 6.3 TOOLTIPS & HELP
- Hover over any slider → Show tooltip with explanation
- "?" button in header → Opens modal with:
  - What are boids? (brief explanation)
  - How to use controls
  - Mode descriptions
  - Link to Craig Reynolds' original paper

### 6.4 ACCESSIBILITY
- All controls keyboard-navigable (Tab, Arrow keys for sliders)
- ARIA labels on all interactive elements
- High contrast mode option (auto-detect OS preference)
- Pause simulation on focus loss (tab switches)

---

## 7. DEPLOYMENT & DOCUMENTATION

### 7.1 GITHUB SETUP
- Repo name: `boids-simulation` (under your personal account)
- Public repository
- GitHub Pages enabled: Settings → Pages → Source: `main` branch, `/ (root)` folder

### 7.2 README.md STRUCTURE
```markdown
# Boids Simulation - Emergent Behavior Explorer

[Live Demo](https://[your-username].github.io/boids-simulation/)

## Overview
Interactive boids simulation showcasing emergent flocking behavior with multiple creative modes and visual themes.

## Features
- 🎮 **5 Interactive Modes**: Normal, Predator, Painter, Evolution, Sound Reactive
- 🎨 **5 Visual Themes**: Minimal, Neon, Nature, Comic Book, Digital
- ⚡ **Performance Optimized**: Spatial partitioning handles 1000+ boids at 60 FPS
- 📊 **Live Analytics**: Real-time charts and instrumentation
- 🔧 **Full Control**: Adjust separation, alignment, cohesion, and more

## How to Use
1. **Adjust Parameters**: Use sliders to modify boid behavior
2. **Try Presets**: Quick-start with Schooling, Chaotic, or Tight Cluster
3. **Explore Modes**: Switch between creative modes for different experiences
4. **Change Themes**: Pick a visual style that suits your mood

## Modes Explained
- **Predator Mode**: Your mouse becomes a hawk—watch boids flee!
- **Painter Mode**: Draw obstacles and maze layouts
- **Evolution Mode**: Boids adapt and evolve over generations
- **Sound Reactive**: Boids respond to music or microphone input

## Technical Details
- Built with p5.js for canvas rendering
- Spatial grid optimization for O(n) neighbor searches
- Web Audio API for sound reactive mode
- Responsive design (desktop, tablet, mobile)

## Assignment Context
Created for AIML 1870 - Code Quest: Boids  
University of Nebraska Omaha, Spring 2026

## Credits
- Original boids algorithm: Craig Reynolds (1987)
- Student: [Your Name]
- Course Instructor: [Professor Name]
```

### 7.3 CODE COMMENTS
- Every function has JSDoc-style comment explaining purpose, params, return value
- Complex algorithms (e.g., spatial grid) have inline comments explaining logic
- Clear section headers in code (e.g., `// ========== BOID CLASS ==========`)

### 7.4 PERFORMANCE PROFILING
- Include commented-out `console.time()` blocks for debugging
- FPS counter updates every 500ms (not every frame—too noisy)
- Spatial grid toggle shows real FPS comparison

---

## 8. TESTING CHECKLIST (Before Submission)

### 8.1 FUNCTIONALITY
- [ ] All 5 sliders update behavior in real-time
- [ ] All 3 presets work and feel distinct
- [ ] Pause/Resume/Reset buttons functional
- [ ] Boundary toggle (wrap/bounce) works
- [ ] All 5 modes are mutually exclusive and functional
- [ ] All 5 themes render correctly
- [ ] Spatial grid toggle shows FPS improvement
- [ ] Charts update without crashing

### 8.2 CROSS-BROWSER
- [ ] Chrome (primary)
- [ ] Firefox
- [ ] Safari (if on Mac)
- [ ] Edge

### 8.3 RESPONSIVE
- [ ] Desktop (1920x1080) - full layout
- [ ] Tablet (768x1024) - collapsible panel
- [ ] Mobile (375x667) - bottom sheet UI

### 8.4 PERFORMANCE
- [ ] 60 FPS with 200 boids (spatial grid off)
- [ ] 60 FPS with 1000 boids (spatial grid on)
- [ ] No memory leaks (check DevTools over 5 minutes)
- [ ] Smooth theme transitions

### 8.5 POLISH
- [ ] No console errors
- [ ] Tooltips work on all controls
- [ ] Help modal opens and closes properly
- [ ] GitHub Pages deployed and accessible
- [ ] README.md complete with screenshots

---

## 9. CREATIVE "WOW FACTOR" BONUS IDEAS

If Claude Code finishes early and you want even MORE polish:

1. **"Replay Mode"**: Record a simulation run, then replay it with different themes
2. **"Boid Cam"**: Click a boid to follow its first-person perspective (camera tracks it)
3. **"Heatmap Overlay"**: Show density heatmap of where boids spend most time
4. **"Social Network Graph"**: Visualize neighbor connections as lines between boids
5. **"Achievement System"**: Unlock badges (e.g., "Survived 100 predator encounters")
6. **"Export GIF"**: Capture 5-second simulation loop as animated GIF
7. **"Shader Mode"**: WebGL shaders for boids (particle effects, bloom, motion blur)
8. **"3D Mode"**: Optional Z-axis for true 3D flocking (toggle between 2D/3D views)

---

## 10. FINAL NOTES FOR CLAUDE CODE

### CRITICAL CONSTRAINTS:
- Use **p5.js** for canvas rendering (simple, widely compatible)
- All code in vanilla JavaScript (no frameworks beyond p5.js)
- Mobile-friendly touch controls (not just mouse)
- Graceful degradation (if microphone denied, show error but don't crash)
- Every parameter must have VISIBLE effect (no "dead" sliders)

### PRIORITY ORDER (if time-limited):
1. Core requirements (must be 100% functional)
2. Spatial grid + performance optimization
3. Theme system (at least 3 themes)
4. Predator mode (most visually impressive)
5. Painter mode
6. Evolution mode
7. Sound reactive mode (last—requires mic permissions)

### STYLE GUIDE:
- Clear, self-documenting variable names (`neighborRadius`, not `nr`)
- Consistent formatting (Prettier or ESLint config provided)
- No magic numbers (use named constants)
- Fail gracefully (try-catch on audio/file operations)