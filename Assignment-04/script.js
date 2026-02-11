// ========== BOIDS SIMULATION - Main Script ==========
// Core simulation loop, Boid class, mode logic, UI wiring, and live charting.
// Uses p5.js in global mode, SpatialGrid, AudioAnalyzer, and ThemeManager.

// ========== CONSTANTS ==========
const DEFAULT_SEPARATION = 1.5;
const DEFAULT_ALIGNMENT = 1.0;
const DEFAULT_COHESION = 1.0;
const DEFAULT_RADIUS = 80;
const DEFAULT_MAX_SPEED = 4;
const DEFAULT_BOID_COUNT = 200;
const MAX_FORCE = 0.2;
const PERCEPTION_CONE_ANGLE = Math.PI / 3; // 60° half-angle = 120° total
const TRAIL_LIFETIME = 1000; // ms
const TRAIL_RECORD_INTERVAL = 50; // ms between trail points

// ========== SIMULATION STATE ==========
let boids = [];
let spatialGrid;
let audioAnalyzer;

// Parameters (read from sliders)
let separationWeight = DEFAULT_SEPARATION;
let alignmentWeight = DEFAULT_ALIGNMENT;
let cohesionWeight = DEFAULT_COHESION;
let neighborRadius = DEFAULT_RADIUS;
let maxSpeed = DEFAULT_MAX_SPEED;
let targetBoidCount = DEFAULT_BOID_COUNT;

// Options
let boundaryMode = 'wrap'; // 'wrap' or 'bounce'
let visionMode = 'omni';   // 'omni' or 'cone'
let trailsEnabled = false;
let spatialGridEnabled = true;
let twoSpeciesEnabled = false;
let debugVision = false;
let paused = false;

// Mode
let currentMode = 'normal'; // 'normal', 'predator', 'painter', 'evolution', 'sound'

// Predator mode state
let predatorPos = null;
let predatorDisplayPos = null;
let predatorRadius = 150;
let predatorFollowMode = false;
let predatorFearTrail = true;
let killCount = 0;
let fearPoints = []; // {x, y, time}
let deadBoids = [];  // {boid, respawnTime}

// Painter mode state
let obstacles = []; // {x, y, radius, type, vx, vy}
let paintDragging = false;
let followObstacle = null;

// Evolution mode state
let generation = 0;
let lastSelectionTime = 0;
let evolutionInterval = 10000; // ms
let evolutionPredators = []; // auto predators {x, y, vx, vy}

// Sound reactive state (managed by AudioAnalyzer)
let baseSeparation = DEFAULT_SEPARATION;
let baseAlignment = DEFAULT_ALIGNMENT;
let baseCohesion = DEFAULT_COHESION;

// Charting
let chartVisible = false;
let chartData = { avgNeighbors: [], avgSpeed: [], compactness: [] };
const CHART_MAX_POINTS = 120; // ~60 seconds at 2 points/sec
let lastChartUpdate = 0;

// Selection
let selectedBoid = null;

// FPS tracking
let fpsHistory = [];
let lastFpsUpdate = 0;
let displayFps = 0;

// Stats
let avgSpeed = 0;
let avgNeighborCount = 0;

// Canvas reference
let canvasContainer;
let cnv;

// ========== P5.JS SETUP ==========
function setup() {
  canvasContainer = document.getElementById('canvas-container');
  const w = canvasContainer.offsetWidth;
  const h = canvasContainer.offsetHeight;

  cnv = createCanvas(w, h);
  cnv.parent('canvas-container');

  spatialGrid = new SpatialGrid(neighborRadius, w, h);
  audioAnalyzer = new AudioAnalyzer();

  // Spawn initial boids
  spawnBoids(DEFAULT_BOID_COUNT);

  // Apply default theme
  ThemeManager.apply('minimal');

  // Wire up all UI controls
  wireUI();

  // Pause on tab visibility change
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && !paused) {
      togglePause();
    }
  });
}

// ========== P5.JS DRAW LOOP ==========
function draw() {
  // Track FPS
  fpsHistory.push(frameRate());
  if (fpsHistory.length > 30) fpsHistory.shift();

  const now = millis();
  if (now - lastFpsUpdate > 500) {
    displayFps = Math.round(fpsHistory.reduce((a, b) => a + b, 0) / fpsHistory.length);
    lastFpsUpdate = now;
  }

  // Draw themed background
  ThemeManager.drawBackground(window);

  // Audio pulse background for sound mode
  if (currentMode === 'sound' && audioAnalyzer.active) {
    const intensity = audioAnalyzer.getIntensity();
    const theme = ThemeManager.getTheme();
    const bg = theme.canvasBg;
    const pulse = intensity * 30;
    background(bg[0] + pulse, bg[1] + pulse, bg[2] + pulse, 20);
  }

  if (!paused) {
    // Sound reactive parameter modulation
    if (currentMode === 'sound' && audioAnalyzer.active) {
      audioAnalyzer.analyze();
      const modulated = audioAnalyzer.getModulatedParams({
        baseSeparation, baseAlignment, baseCohesion
      });
      separationWeight = modulated.separationWeight;
      alignmentWeight = modulated.alignmentWeight;
      cohesionWeight = modulated.cohesionWeight;
      updateSliderDisplays();
    }

    // Update spatial grid
    if (spatialGridEnabled) {
      spatialGrid.cellSize = neighborRadius;
      spatialGrid.resize(neighborRadius, width, height);
      spatialGrid.clear();
      for (const boid of boids) {
        spatialGrid.insert(boid);
      }
    }

    // Update predator position
    updatePredator();

    // Update evolution mode
    if (currentMode === 'evolution') {
      updateEvolution(now);
    }

    // Move drifting obstacles
    updateObstacles();

    // Update each boid
    let totalSpeed = 0;
    let totalNeighbors = 0;

    for (const boid of boids) {
      boid.flock();
      boid.update();
      boid.edges();
      totalSpeed += boid.velocity.mag();
      totalNeighbors += boid.neighborCount;
    }

    // Process dead boids (predator mode)
    processDeadBoids(now);

    // Update stats
    if (boids.length > 0) {
      avgSpeed = totalSpeed / boids.length;
      avgNeighborCount = totalNeighbors / boids.length;
    }

    // Update chart data every 500ms
    if (now - lastChartUpdate > 500) {
      updateChartData();
      lastChartUpdate = now;
    }
  }

  // ===== RENDER =====

  // Draw trails first (behind boids)
  if (trailsEnabled) {
    for (const boid of boids) {
      boid.renderTrails();
    }
  }

  // Draw obstacles
  renderObstacles();

  // Draw fear trail
  if (currentMode === 'predator' && predatorFearTrail) {
    renderFearTrail();
  }

  // Draw boids
  for (const boid of boids) {
    ThemeManager.renderBoid(window, boid, boid === selectedBoid);

    // Debug vision cone
    if (debugVision && boid === selectedBoid) {
      boid.drawVisionCone();
    }
  }

  // Draw predator
  if (currentMode === 'predator' && predatorDisplayPos) {
    renderPredator();
  }

  // Draw evolution predators
  if (currentMode === 'evolution') {
    for (const pred of evolutionPredators) {
      push();
      noFill();
      stroke(255, 0, 0, 150);
      strokeWeight(2);
      ellipse(pred.x, pred.y, 20);
      line(pred.x - 10, pred.y, pred.x + 10, pred.y);
      line(pred.x, pred.y - 10, pred.x, pred.y + 10);
      pop();
    }
  }

  // Update stats display
  updateStatsDisplay();

  // Update EQ display for sound mode
  if (currentMode === 'sound') {
    updateEQDisplay();
  }

  // Draw chart
  if (chartVisible) {
    drawChart();
  }

  // Update evolution UI
  if (currentMode === 'evolution') {
    updateEvolutionUI();
  }
}

// ========== BOID CLASS ==========
class Boid {
  /**
   * @param {number} x - Initial x position
   * @param {number} y - Initial y position
   * @param {string} species - 'blue' or 'red'
   */
  constructor(x, y, species = 'blue') {
    this.position = createVector(x, y);
    this.velocity = p5.Vector.random2D().mult(random(1, maxSpeed));
    this.acceleration = createVector(0, 0);
    this.species = species;
    this.fitness = 50;
    this.neighborCount = 0;
    this.panicTimer = 0;
    this.trails = []; // [{x, y, time}]
    this.lastTrailTime = 0;

    // Per-boid params for evolution mode
    this.genes = {
      separation: separationWeight,
      alignment: alignmentWeight,
      cohesion: cohesionWeight,
      maxSpeed: maxSpeed,
      radius: neighborRadius
    };
  }

  /**
   * Calculate and apply flocking forces from neighbors.
   */
  flock() {
    let neighbors;

    // Get neighbors using spatial grid or brute force
    if (spatialGridEnabled) {
      neighbors = boundaryMode === 'wrap'
        ? spatialGrid.getNeighborsWrapped(this, neighborRadius)
        : spatialGrid.getNeighbors(this, neighborRadius);
    } else {
      neighbors = this.getBruteForceNeighbors();
    }

    // Filter by vision cone if enabled
    if (visionMode === 'cone') {
      neighbors = neighbors.filter(other => {
        const toOther = p5.Vector.sub(other.position, this.position);
        const angle = this.velocity.angleBetween(toOther);
        return Math.abs(angle) < PERCEPTION_CONE_ANGLE;
      });
    }

    // Filter by species for alignment/cohesion if two species mode
    let sameSpecies = neighbors;
    let otherSpecies = [];
    if (twoSpeciesEnabled) {
      sameSpecies = neighbors.filter(b => b.species === this.species);
      otherSpecies = neighbors.filter(b => b.species !== this.species);
    }

    this.neighborCount = neighbors.length;

    // Core flocking forces (same species only in two-species mode)
    const sep = this.separate(sameSpecies);
    const ali = this.align(sameSpecies);
    const coh = this.cohesion(sameSpecies);

    // Use per-boid genes in evolution mode, otherwise global params
    const sw = currentMode === 'evolution' ? this.genes.separation : separationWeight;
    const aw = currentMode === 'evolution' ? this.genes.alignment : alignmentWeight;
    const cw = currentMode === 'evolution' ? this.genes.cohesion : cohesionWeight;

    sep.mult(sw);
    ali.mult(aw);
    coh.mult(cw);

    this.applyForce(sep);
    this.applyForce(ali);
    this.applyForce(coh);

    // Extra separation from other species (2x)
    if (twoSpeciesEnabled && otherSpecies.length > 0) {
      const interSep = this.separate(otherSpecies);
      interSep.mult(sw * 2);
      this.applyForce(interSep);
    }

    // Obstacle avoidance
    if (obstacles.length > 0) {
      const avoid = this.avoidObstacles();
      this.applyForce(avoid);
    }

    // Predator flee force
    if (currentMode === 'predator' && predatorDisplayPos) {
      this.fleeFromPredator(predatorDisplayPos, predatorRadius);
    }

    // Fear trail avoidance
    if (currentMode === 'predator' && predatorFearTrail) {
      this.avoidFearTrail();
    }

    // Evolution predators flee
    if (currentMode === 'evolution') {
      for (const pred of evolutionPredators) {
        const predVec = createVector(pred.x, pred.y);
        this.fleeFromPredator(predVec, 150);

        // Fitness: survive near predator
        const d = p5.Vector.dist(this.position, predVec);
        if (d < 200) {
          this.fitness += 0.02; // ~1 per second at 60fps
        }
      }
    }

    // Panic timer decay
    if (this.panicTimer > 0) {
      this.panicTimer -= deltaTime;
    }
  }

  /** Get neighbors via brute force O(n²) - used when spatial grid is off. */
  getBruteForceNeighbors() {
    const neighbors = [];
    const radiusSq = neighborRadius * neighborRadius;
    for (const other of boids) {
      if (other === this) continue;
      const dSq = p5.Vector.sub(other.position, this.position).magSq();
      if (dSq < radiusSq) {
        neighbors.push(other);
      }
    }
    return neighbors;
  }

  /**
   * Separation: steer away from nearby boids to avoid crowding.
   * @param {Array<Boid>} neighbors
   * @returns {p5.Vector} Steering force
   */
  separate(neighbors) {
    const steer = createVector(0, 0);
    let count = 0;
    const desiredSep = neighborRadius * 0.4;

    for (const other of neighbors) {
      const d = p5.Vector.dist(this.position, other.position);
      if (d > 0 && d < desiredSep) {
        const diff = p5.Vector.sub(this.position, other.position);
        diff.normalize();
        diff.div(d); // Weight by distance (closer = stronger)
        steer.add(diff);
        count++;
      }
    }

    if (count > 0) {
      steer.div(count);
      steer.setMag(maxSpeed);
      steer.sub(this.velocity);
      steer.limit(MAX_FORCE);
    }
    return steer;
  }

  /**
   * Alignment: steer toward average heading of neighbors.
   * @param {Array<Boid>} neighbors
   * @returns {p5.Vector} Steering force
   */
  align(neighbors) {
    const avg = createVector(0, 0);
    if (neighbors.length === 0) return avg;

    for (const other of neighbors) {
      avg.add(other.velocity);
    }
    avg.div(neighbors.length);
    avg.setMag(maxSpeed);
    const steer = p5.Vector.sub(avg, this.velocity);
    steer.limit(MAX_FORCE);
    return steer;
  }

  /**
   * Cohesion: steer toward average position of neighbors.
   * @param {Array<Boid>} neighbors
   * @returns {p5.Vector} Steering force
   */
  cohesion(neighbors) {
    const center = createVector(0, 0);
    if (neighbors.length === 0) return center;

    for (const other of neighbors) {
      center.add(other.position);
    }
    center.div(neighbors.length);
    return this.seek(center);
  }

  /**
   * Seek: steer toward a target position.
   * @param {p5.Vector} target
   * @returns {p5.Vector} Steering force
   */
  seek(target) {
    const desired = p5.Vector.sub(target, this.position);
    desired.setMag(maxSpeed);
    const steer = p5.Vector.sub(desired, this.velocity);
    steer.limit(MAX_FORCE);
    return steer;
  }

  /**
   * Flee from predator position.
   * @param {p5.Vector} predPos - Predator position
   * @param {number} radius - Predator influence radius
   */
  fleeFromPredator(predPos, radius) {
    const d = p5.Vector.dist(this.position, predPos);
    if (d < radius) {
      const flee = p5.Vector.sub(this.position, predPos);
      flee.setMag(maxSpeed * 1.5);
      flee.sub(this.velocity);
      flee.limit(MAX_FORCE * 3); // 3x force for flee
      this.applyForce(flee);

      // Kill check (within 10px)
      if (d < 10 && currentMode === 'predator') {
        this.die();
      }
    }
  }

  /** Handle boid death in predator mode. */
  die() {
    const idx = boids.indexOf(this);
    if (idx === -1) return;

    killCount++;
    document.getElementById('kill-count').textContent = killCount;

    // Nearby boids enter panic state
    for (const other of boids) {
      if (other === this) continue;
      const d = p5.Vector.dist(this.position, other.position);
      if (d < neighborRadius) {
        other.panicTimer = 2000; // 2 seconds
      }
    }

    // Remove and schedule respawn
    boids.splice(idx, 1);
    deadBoids.push({ species: this.species, respawnTime: millis() + 3000 });

    if (selectedBoid === this) selectedBoid = null;
  }

  /**
   * Avoid obstacles with steering force.
   * @returns {p5.Vector} Combined avoidance force
   */
  avoidObstacles() {
    const steer = createVector(0, 0);
    for (const obs of obstacles) {
      const obsPos = createVector(obs.x, obs.y);
      const d = p5.Vector.dist(this.position, obsPos);
      const avoidDist = obs.radius + neighborRadius;

      if (d < avoidDist) {
        const diff = p5.Vector.sub(this.position, obsPos);
        diff.normalize();
        diff.div(max(d - obs.radius, 1));

        // Repel type has extra force
        const multiplier = obs.type === 'repel' ? 4 : 2;
        diff.mult(separationWeight * multiplier);
        steer.add(diff);
      }
    }
    steer.limit(MAX_FORCE * 3);
    return steer;
  }

  /** Avoid recent fear trail positions. */
  avoidFearTrail() {
    const now = millis();
    for (const fp of fearPoints) {
      if (now - fp.time > 5000) continue;
      const d = dist(this.position.x, this.position.y, fp.x, fp.y);
      if (d < 60) {
        const flee = createVector(this.position.x - fp.x, this.position.y - fp.y);
        flee.normalize();
        flee.mult(MAX_FORCE * 0.5);
        this.applyForce(flee);
      }
    }
  }

  /**
   * Apply a force to the boid's acceleration.
   * @param {p5.Vector} force
   */
  applyForce(force) {
    this.acceleration.add(force);
  }

  /** Update position, velocity, and trails. */
  update() {
    this.velocity.add(this.acceleration);

    // Use per-boid max speed in evolution mode
    const ms = currentMode === 'evolution' ? this.genes.maxSpeed : maxSpeed;
    const effectiveSpeed = this.panicTimer > 0 ? ms * 1.5 : ms;
    this.velocity.limit(effectiveSpeed);

    this.position.add(this.velocity);
    this.acceleration.mult(0);

    // Record trail
    if (trailsEnabled) {
      const now = millis();
      if (now - this.lastTrailTime > TRAIL_RECORD_INTERVAL) {
        this.trails.push({ x: this.position.x, y: this.position.y, time: now });
        this.lastTrailTime = now;
      }
      // Remove old trail points
      while (this.trails.length > 0 && millis() - this.trails[0].time > TRAIL_LIFETIME) {
        this.trails.shift();
      }
    }
  }

  /** Handle boundary wrapping or bouncing. */
  edges() {
    const margin = 5;
    if (boundaryMode === 'wrap') {
      if (this.position.x > width) this.position.x = 0;
      if (this.position.x < 0) this.position.x = width;
      if (this.position.y > height) this.position.y = 0;
      if (this.position.y < 0) this.position.y = height;
    } else {
      // Bounce
      if (this.position.x < margin) {
        this.position.x = margin;
        this.velocity.x *= -1;
      }
      if (this.position.x > width - margin) {
        this.position.x = width - margin;
        this.velocity.x *= -1;
      }
      if (this.position.y < margin) {
        this.position.y = margin;
        this.velocity.y *= -1;
      }
      if (this.position.y > height - margin) {
        this.position.y = height - margin;
        this.velocity.y *= -1;
      }
    }
  }

  /** Render trail points. */
  renderTrails() {
    const now = millis();
    for (const tp of this.trails) {
      const age = (now - tp.time) / TRAIL_LIFETIME;
      ThemeManager.renderTrail(window, tp.x, tp.y, age, this);
    }
  }

  /** Draw vision cone for debug mode. */
  drawVisionCone() {
    push();
    translate(this.position.x, this.position.y);
    const heading = this.velocity.heading();

    if (visionMode === 'cone') {
      // Draw cone
      noFill();
      stroke(255, 255, 0, 80);
      strokeWeight(1);
      arc(0, 0, neighborRadius * 2, neighborRadius * 2,
        heading - PERCEPTION_CONE_ANGLE,
        heading + PERCEPTION_CONE_ANGLE);
      line(0, 0,
        cos(heading - PERCEPTION_CONE_ANGLE) * neighborRadius,
        sin(heading - PERCEPTION_CONE_ANGLE) * neighborRadius);
      line(0, 0,
        cos(heading + PERCEPTION_CONE_ANGLE) * neighborRadius,
        sin(heading + PERCEPTION_CONE_ANGLE) * neighborRadius);
    } else {
      // Draw full circle
      noFill();
      stroke(255, 255, 0, 60);
      strokeWeight(1);
      ellipse(0, 0, neighborRadius * 2);
    }
    pop();
  }
}

// ========== SPAWN / MANAGE BOIDS ==========

/**
 * Spawn a given number of boids at random positions.
 * @param {number} count - Number of boids to spawn
 */
function spawnBoids(count) {
  for (let i = 0; i < count; i++) {
    const species = twoSpeciesEnabled && i >= count / 2 ? 'red' : 'blue';
    boids.push(new Boid(random(width || 800), random(height || 600), species));
  }
}

/** Adjust boid count to match target. */
function adjustBoidCount() {
  const diff = targetBoidCount - boids.length;
  if (diff > 0) {
    for (let i = 0; i < diff; i++) {
      const species = twoSpeciesEnabled && Math.random() > 0.5 ? 'red' : 'blue';
      boids.push(new Boid(random(width), random(height), species));
    }
  } else if (diff < 0) {
    boids.splice(boids.length + diff, -diff);
    if (selectedBoid && !boids.includes(selectedBoid)) selectedBoid = null;
  }
}

// ========== PREDATOR ==========

/** Update predator position (direct or with delay). */
function updatePredator() {
  if (currentMode !== 'predator') return;
  if (mouseX < 0 || mouseX > width || mouseY < 0 || mouseY > height) {
    predatorDisplayPos = null;
    return;
  }

  predatorPos = createVector(mouseX, mouseY);

  if (predatorFollowMode) {
    // Smooth follow with delay
    if (!predatorDisplayPos) {
      predatorDisplayPos = predatorPos.copy();
    } else {
      predatorDisplayPos.lerp(predatorPos, 0.05);
    }
  } else {
    predatorDisplayPos = predatorPos.copy();
  }

  // Add to fear trail
  if (predatorFearTrail && frameCount % 10 === 0) {
    fearPoints.push({ x: predatorDisplayPos.x, y: predatorDisplayPos.y, time: millis() });
  }

  // Clean old fear points
  const now = millis();
  fearPoints = fearPoints.filter(fp => now - fp.time < 5000);
}

/** Render predator visual. */
function renderPredator() {
  const theme = ThemeManager.getTheme();
  const p = theme.predator;
  push();
  // Outer influence radius
  noFill();
  stroke(255, 0, 0, 40);
  strokeWeight(1);
  ellipse(predatorDisplayPos.x, predatorDisplayPos.y, predatorRadius * 2);

  // Predator body
  fill(p.fill[0], p.fill[1], p.fill[2]);
  stroke(p.stroke[0], p.stroke[1], p.stroke[2]);
  strokeWeight(2);
  ellipse(predatorDisplayPos.x, predatorDisplayPos.y, p.radius * 2);

  // Crosshairs
  stroke(255, 255, 255, 180);
  strokeWeight(1);
  line(predatorDisplayPos.x - p.radius, predatorDisplayPos.y,
    predatorDisplayPos.x + p.radius, predatorDisplayPos.y);
  line(predatorDisplayPos.x, predatorDisplayPos.y - p.radius,
    predatorDisplayPos.x, predatorDisplayPos.y + p.radius);
  pop();
}

/** Render fear trail as fading red dots. */
function renderFearTrail() {
  const now = millis();
  push();
  noStroke();
  for (const fp of fearPoints) {
    const age = (now - fp.time) / 5000;
    fill(255, 0, 0, (1 - age) * 40);
    ellipse(fp.x, fp.y, 15);
  }
  pop();
}

/** Process dead boids and respawn them after delay. */
function processDeadBoids(now) {
  const respawned = [];
  for (let i = deadBoids.length - 1; i >= 0; i--) {
    if (now >= deadBoids[i].respawnTime) {
      boids.push(new Boid(random(width), random(height), deadBoids[i].species));
      respawned.push(i);
    }
  }
  for (const idx of respawned) {
    deadBoids.splice(idx, 1);
  }
}

// ========== OBSTACLES (Painter Mode) ==========

/** Render all obstacles. */
function renderObstacles() {
  const theme = ThemeManager.getTheme();
  const obs = theme.obstacle;
  push();
  for (const o of obstacles) {
    fill(obs.fill[0], obs.fill[1], obs.fill[2], obs.fill[3] || 200);
    stroke(obs.stroke[0], obs.stroke[1], obs.stroke[2]);
    strokeWeight(obs.strokeWeight);
    ellipse(o.x, o.y, o.radius * 2);

    // Repel type: draw pulsing ring
    if (o.type === 'repel') {
      noFill();
      stroke(obs.stroke[0], obs.stroke[1], obs.stroke[2], 100);
      const pulse = sin(millis() * 0.003) * 10;
      ellipse(o.x, o.y, o.radius * 2 + 20 + pulse);
    }
  }
  pop();
}

/** Update obstacle positions (drift type, follow mode). */
function updateObstacles() {
  for (const o of obstacles) {
    if (o.type === 'drift') {
      o.x += o.vx;
      o.y += o.vy;
      // Bounce off edges
      if (o.x < o.radius || o.x > width - o.radius) o.vx *= -1;
      if (o.y < o.radius || o.y > height - o.radius) o.vy *= -1;
      o.x = constrain(o.x, o.radius, width - o.radius);
      o.y = constrain(o.y, o.radius, height - o.radius);
    }
  }

  // Follow obstacle tracks mouse
  if (followObstacle && currentMode === 'painter') {
    followObstacle.x = lerp(followObstacle.x, mouseX, 0.1);
    followObstacle.y = lerp(followObstacle.y, mouseY, 0.1);
  }
}

/** Generate a random maze of obstacles. */
function generateMaze() {
  obstacles = [];
  const spacing = 80;
  const obsRadius = 20;
  for (let x = spacing; x < width - spacing; x += spacing) {
    for (let y = spacing; y < height - spacing; y += spacing) {
      if (random() < 0.35) {
        obstacles.push({
          x, y, radius: obsRadius,
          type: 'static', vx: 0, vy: 0
        });
      }
    }
  }
}

// ========== EVOLUTION MODE ==========

/** Update evolution logic: fitness tracking and natural selection. */
function updateEvolution(now) {
  // Move auto-predators
  for (const pred of evolutionPredators) {
    pred.x += pred.vx;
    pred.y += pred.vy;
    // Bounce
    if (pred.x < 0 || pred.x > width) pred.vx *= -1;
    if (pred.y < 0 || pred.y > height) pred.vy *= -1;
    pred.x = constrain(pred.x, 0, width);
    pred.y = constrain(pred.y, 0, height);
    // Slight random direction changes
    if (random() < 0.02) {
      pred.vx += random(-0.5, 0.5);
      pred.vy += random(-0.5, 0.5);
      const sp = sqrt(pred.vx * pred.vx + pred.vy * pred.vy);
      if (sp > 2) {
        pred.vx = (pred.vx / sp) * 2;
        pred.vy = (pred.vy / sp) * 2;
      }
    }
  }

  // Natural selection
  if (now - lastSelectionTime > evolutionInterval && boids.length > 10) {
    lastSelectionTime = now;
    generation++;

    // Sort by fitness
    boids.sort((a, b) => b.fitness - a.fitness);

    const totalCount = boids.length;
    const bottomCount = Math.floor(totalCount * 0.2);
    const topCount = Math.floor(totalCount * 0.2);

    // Get top performers' average genes
    const topBoids = boids.slice(0, topCount);
    const avgGenes = {
      separation: 0, alignment: 0, cohesion: 0, maxSpeed: 0, radius: 0
    };
    for (const b of topBoids) {
      avgGenes.separation += b.genes.separation;
      avgGenes.alignment += b.genes.alignment;
      avgGenes.cohesion += b.genes.cohesion;
      avgGenes.maxSpeed += b.genes.maxSpeed;
      avgGenes.radius += b.genes.radius;
    }
    for (const key in avgGenes) {
      avgGenes[key] /= topCount;
    }

    // Replace bottom 20% with mutated top-gene offspring
    for (let i = totalCount - bottomCount; i < totalCount; i++) {
      const b = boids[i];
      b.position.set(random(width), random(height));
      b.velocity = p5.Vector.random2D().mult(2);
      b.fitness = 50;

      // Inherit + mutate
      b.genes.separation = avgGenes.separation * random(0.9, 1.1);
      b.genes.alignment = avgGenes.alignment * random(0.9, 1.1);
      b.genes.cohesion = avgGenes.cohesion * random(0.9, 1.1);
      b.genes.maxSpeed = constrain(avgGenes.maxSpeed * random(0.9, 1.1), 1, 10);
      b.genes.radius = constrain(avgGenes.radius * random(0.9, 1.1), 20, 200);
    }
  }
}

/** Update evolution mode UI. */
function updateEvolutionUI() {
  document.getElementById('generation-count').textContent = generation;

  if (boids.length === 0) return;

  const topFit = Math.max(...boids.map(b => b.fitness));
  const avgFit = boids.reduce((s, b) => s + b.fitness, 0) / boids.length;
  document.getElementById('top-fitness').textContent = topFit.toFixed(1);
  document.getElementById('avg-fitness').textContent = avgFit.toFixed(1);

  // Fitness histogram (10 bins)
  const histEl = document.getElementById('fitness-histogram');
  const bins = new Array(10).fill(0);
  for (const b of boids) {
    const binIdx = constrain(Math.floor(b.fitness / 10), 0, 9);
    bins[binIdx]++;
  }
  const maxBin = Math.max(...bins, 1);

  // Build histogram bars
  if (histEl.children.length !== 10) {
    histEl.innerHTML = '';
    for (let i = 0; i < 10; i++) {
      const bar = document.createElement('div');
      bar.className = 'bar';
      histEl.appendChild(bar);
    }
  }
  for (let i = 0; i < 10; i++) {
    const pct = (bins[i] / maxBin) * 100;
    histEl.children[i].style.height = `${Math.max(pct, 2)}%`;
  }
}

// ========== CHARTING ==========

/** Update chart data arrays. */
function updateChartData() {
  chartData.avgNeighbors.push(avgNeighborCount);
  chartData.avgSpeed.push(avgSpeed);

  // Compactness: average distance between boids and their flock center
  if (boids.length > 0) {
    const cx = boids.reduce((s, b) => s + b.position.x, 0) / boids.length;
    const cy = boids.reduce((s, b) => s + b.position.y, 0) / boids.length;
    const avgDist = boids.reduce((s, b) => {
      return s + dist(b.position.x, b.position.y, cx, cy);
    }, 0) / boids.length;
    chartData.compactness.push(avgDist);
  } else {
    chartData.compactness.push(0);
  }

  // Trim to max points
  for (const key in chartData) {
    if (chartData[key].length > CHART_MAX_POINTS) {
      chartData[key].shift();
    }
  }
}

/** Draw the live chart on the chart canvas. */
function drawChart() {
  const canvas = document.getElementById('chart-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const rect = canvas.parentElement.getBoundingClientRect();
  canvas.width = rect.width;
  canvas.height = rect.height;

  const theme = ThemeManager.getTheme();
  const textColor = theme.ui.textColor;
  const accentColor = theme.ui.accentColor;

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = theme.ui.panelBg;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const padding = { top: 20, right: 20, bottom: 25, left: 50 };
  const chartW = canvas.width - padding.left - padding.right;
  const chartH = canvas.height - padding.top - padding.bottom;

  // Labels
  ctx.font = '10px ' + theme.ui.fontFamily;
  ctx.fillStyle = textColor;
  ctx.textAlign = 'center';
  ctx.fillText('Avg Neighbors', padding.left + chartW * 0.2, 12);
  ctx.fillText('Avg Speed', padding.left + chartW * 0.5, 12);
  ctx.fillText('Compactness', padding.left + chartW * 0.8, 12);

  // Color legend dots
  const colors = ['#4CAF50', '#2196F3', '#FF9800'];
  const labels = ['avgNeighbors', 'avgSpeed', 'compactness'];

  ctx.fillStyle = colors[0];
  ctx.fillRect(padding.left + chartW * 0.2 - 35, 6, 8, 8);
  ctx.fillStyle = colors[1];
  ctx.fillRect(padding.left + chartW * 0.5 - 30, 6, 8, 8);
  ctx.fillStyle = colors[2];
  ctx.fillRect(padding.left + chartW * 0.8 - 35, 6, 8, 8);

  // Draw each line
  for (let s = 0; s < 3; s++) {
    const data = chartData[labels[s]];
    if (data.length < 2) continue;

    const maxVal = Math.max(...data, 1);

    ctx.strokeStyle = colors[s];
    ctx.lineWidth = 1.5;
    ctx.beginPath();

    for (let i = 0; i < data.length; i++) {
      const x = padding.left + (i / CHART_MAX_POINTS) * chartW;
      const y = padding.top + chartH - (data[i] / maxVal) * chartH;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
  }

  // Axes
  ctx.strokeStyle = textColor;
  ctx.lineWidth = 0.5;
  ctx.beginPath();
  ctx.moveTo(padding.left, padding.top);
  ctx.lineTo(padding.left, padding.top + chartH);
  ctx.lineTo(padding.left + chartW, padding.top + chartH);
  ctx.stroke();
}

// ========== STATS DISPLAY ==========

/** Update the bottom stats bar. */
function updateStatsDisplay() {
  if (frameCount % 15 !== 0) return; // Throttle DOM updates
  document.getElementById('stat-fps').textContent = displayFps;
  document.getElementById('stat-boids').textContent = boids.length;
  document.getElementById('stat-speed').textContent = avgSpeed.toFixed(1);
  document.getElementById('stat-neighbors').textContent = avgNeighborCount.toFixed(1);
}

/** Update EQ display bars for sound mode. */
function updateEQDisplay() {
  if (frameCount % 6 !== 0) return;
  const maxH = 36;
  document.getElementById('eq-bass').style.height =
    `${Math.max(audioAnalyzer.smoothBass * maxH, 2)}px`;
  document.getElementById('eq-mid').style.height =
    `${Math.max(audioAnalyzer.smoothMid * maxH, 2)}px`;
  document.getElementById('eq-treble').style.height =
    `${Math.max(audioAnalyzer.smoothTreble * maxH, 2)}px`;
}

/** Update slider display values to match current param values. */
function updateSliderDisplays() {
  document.getElementById('separation-val').textContent = separationWeight.toFixed(1);
  document.getElementById('alignment-val').textContent = alignmentWeight.toFixed(1);
  document.getElementById('cohesion-val').textContent = cohesionWeight.toFixed(1);
}

// ========== MOUSE INTERACTION ==========

function mousePressed() {
  // Ignore clicks on UI elements
  if (mouseX < 0 || mouseX > width || mouseY < 0 || mouseY > height) return;

  if (currentMode === 'painter') {
    if (mouseButton === LEFT) {
      const obsRadius = parseInt(document.getElementById('obstacle-radius').value);
      const obsType = document.getElementById('obstacle-type').value;
      obstacles.push({
        x: mouseX, y: mouseY, radius: obsRadius,
        type: obsType,
        vx: obsType === 'drift' ? random(-0.5, 0.5) : 0,
        vy: obsType === 'drift' ? random(-0.5, 0.5) : 0
      });
      paintDragging = true;
    }
  } else {
    // Select boid on click
    let closest = null;
    let closestDist = 20;
    for (const boid of boids) {
      const d = dist(mouseX, mouseY, boid.position.x, boid.position.y);
      if (d < closestDist) {
        closest = boid;
        closestDist = d;
      }
    }
    selectedBoid = closest;
  }
}

function mouseDragged() {
  if (currentMode === 'painter' && paintDragging && mouseButton === LEFT) {
    const obsRadius = parseInt(document.getElementById('obstacle-radius').value);
    const obsType = document.getElementById('obstacle-type').value;
    // Only place if far enough from last obstacle
    const last = obstacles[obstacles.length - 1];
    if (last && dist(mouseX, mouseY, last.x, last.y) > obsRadius) {
      obstacles.push({
        x: mouseX, y: mouseY, radius: obsRadius,
        type: obsType,
        vx: obsType === 'drift' ? random(-0.5, 0.5) : 0,
        vy: obsType === 'drift' ? random(-0.5, 0.5) : 0
      });
    }
  }
}

function mouseReleased() {
  paintDragging = false;
}

// Right-click to remove obstacle in painter mode
function contextMenuHandler(e) {
  if (currentMode !== 'painter') return;

  const rect = cnv.elt.getBoundingClientRect();
  const mx = e.clientX - rect.left;
  const my = e.clientY - rect.top;

  for (let i = obstacles.length - 1; i >= 0; i--) {
    const d = dist(mx, my, obstacles[i].x, obstacles[i].y);
    if (d < obstacles[i].radius) {
      obstacles.splice(i, 1);
      e.preventDefault();
      return;
    }
  }
}

// ========== WINDOW RESIZE ==========

function windowResized() {
  const w = canvasContainer.offsetWidth;
  const h = canvasContainer.offsetHeight;
  resizeCanvas(w, h);
  spatialGrid.resize(neighborRadius, w, h);
  ThemeManager._matrixColumns = null; // Reset matrix rain
}

// ========== PAUSE / RESET ==========

function togglePause() {
  paused = !paused;
  const btn = document.getElementById('pause-btn');
  btn.textContent = paused ? 'Resume' : 'Pause';
}

function resetSimulation() {
  boids = [];
  deadBoids = [];
  obstacles = [];
  followObstacle = null;
  fearPoints = [];
  killCount = 0;
  generation = 0;
  lastSelectionTime = millis();
  evolutionPredators = [];
  selectedBoid = null;
  chartData = { avgNeighbors: [], avgSpeed: [], compactness: [] };

  // Reset params to defaults
  separationWeight = DEFAULT_SEPARATION;
  alignmentWeight = DEFAULT_ALIGNMENT;
  cohesionWeight = DEFAULT_COHESION;
  neighborRadius = DEFAULT_RADIUS;
  maxSpeed = DEFAULT_MAX_SPEED;
  targetBoidCount = DEFAULT_BOID_COUNT;

  // Reset sliders
  document.getElementById('separation').value = DEFAULT_SEPARATION;
  document.getElementById('alignment').value = DEFAULT_ALIGNMENT;
  document.getElementById('cohesion').value = DEFAULT_COHESION;
  document.getElementById('neighbor-radius').value = DEFAULT_RADIUS;
  document.getElementById('max-speed').value = DEFAULT_MAX_SPEED;
  document.getElementById('boid-count').value = DEFAULT_BOID_COUNT;

  updateSliderDisplays();
  document.getElementById('neighbor-radius-val').textContent = DEFAULT_RADIUS;
  document.getElementById('max-speed-val').textContent = DEFAULT_MAX_SPEED.toFixed(1);
  document.getElementById('boid-count-val').textContent = DEFAULT_BOID_COUNT;
  document.getElementById('kill-count').textContent = '0';

  // Respawn
  spawnBoids(DEFAULT_BOID_COUNT);

  // Setup evolution predators if in evolution mode
  if (currentMode === 'evolution') {
    setupEvolutionPredators();
  }

  if (paused) togglePause();
}

// ========== MODE SWITCHING ==========

function switchMode(mode) {
  currentMode = mode;

  // Hide all mode panels
  document.querySelectorAll('.mode-panel').forEach(el => el.classList.remove('active'));

  // Show relevant panel
  const panelId = `mode-${mode}`;
  const panel = document.getElementById(panelId);
  if (panel) panel.classList.add('active');

  // Clean up previous mode
  predatorDisplayPos = null;
  fearPoints = [];
  followObstacle = null;

  // Audio cleanup
  if (mode !== 'sound') {
    audioAnalyzer.cleanup();
  }

  // Evolution setup
  if (mode === 'evolution') {
    generation = 0;
    lastSelectionTime = millis();
    for (const b of boids) {
      b.fitness = 50;
      b.genes = {
        separation: separationWeight,
        alignment: alignmentWeight,
        cohesion: cohesionWeight,
        maxSpeed: maxSpeed,
        radius: neighborRadius
      };
    }
    setupEvolutionPredators();
  } else {
    evolutionPredators = [];
  }

  // Sound mode: reset base params
  if (mode === 'sound') {
    baseSeparation = separationWeight;
    baseAlignment = alignmentWeight;
    baseCohesion = cohesionWeight;
  }
}

/** Spawn random-moving predators for evolution mode. */
function setupEvolutionPredators() {
  evolutionPredators = [];
  for (let i = 0; i < 3; i++) {
    evolutionPredators.push({
      x: random(width),
      y: random(height),
      vx: random(-1.5, 1.5),
      vy: random(-1.5, 1.5)
    });
  }
}

// ========== PRESETS ==========

function applyPreset(name) {
  // Clear active state
  document.querySelectorAll('.preset-btn').forEach(b => b.classList.remove('active'));

  let sep, ali, coh, rad, spd;
  switch (name) {
    case 'schooling':
      sep = 1.0; ali = 2.5; coh = 1.2; rad = 100; spd = 3;
      break;
    case 'chaotic':
      sep = 0.5; ali = 0.3; coh = 0.8; rad = 40; spd = 6;
      break;
    case 'tight':
      sep = 0.8; ali = 1.0; coh = 3.0; rad = 120; spd = 2;
      break;
    default:
      return;
  }

  separationWeight = sep;
  alignmentWeight = ali;
  cohesionWeight = coh;
  neighborRadius = rad;
  maxSpeed = spd;

  document.getElementById('separation').value = sep;
  document.getElementById('alignment').value = ali;
  document.getElementById('cohesion').value = coh;
  document.getElementById('neighbor-radius').value = rad;
  document.getElementById('max-speed').value = spd;

  document.getElementById('separation-val').textContent = sep.toFixed(1);
  document.getElementById('alignment-val').textContent = ali.toFixed(1);
  document.getElementById('cohesion-val').textContent = coh.toFixed(1);
  document.getElementById('neighbor-radius-val').textContent = rad;
  document.getElementById('max-speed-val').textContent = spd.toFixed(1);

  document.getElementById(`preset-${name}`).classList.add('active');
}

// ========== UI WIRING ==========

/** Connect all DOM elements to simulation state. */
function wireUI() {
  // Sliders
  wireSlider('separation', v => { separationWeight = v; baseSeparation = v; }, 1);
  wireSlider('alignment', v => { alignmentWeight = v; baseAlignment = v; }, 1);
  wireSlider('cohesion', v => { cohesionWeight = v; baseCohesion = v; }, 1);
  wireSlider('neighbor-radius', v => { neighborRadius = v; }, 0);
  wireSlider('max-speed', v => { maxSpeed = v; }, 1);
  wireSlider('boid-count', v => { targetBoidCount = v; adjustBoidCount(); }, 0);

  // Predator sliders
  wireSlider('predator-radius', v => { predatorRadius = v; }, 0);
  wireSlider('obstacle-radius', null, 0);
  wireSlider('evolution-speed', v => { evolutionInterval = v * 1000; }, 0, 's');

  // Audio sensitivity sliders
  wireSlider('bass-sensitivity', v => { audioAnalyzer.bassSensitivity = v; }, 1);
  wireSlider('mid-sensitivity', v => { audioAnalyzer.midSensitivity = v; }, 1);
  wireSlider('treble-sensitivity', v => { audioAnalyzer.trebleSensitivity = v; }, 1);

  // Presets
  document.getElementById('preset-schooling').addEventListener('click', () => applyPreset('schooling'));
  document.getElementById('preset-chaotic').addEventListener('click', () => applyPreset('chaotic'));
  document.getElementById('preset-tight').addEventListener('click', () => applyPreset('tight'));

  // Mode selector
  document.getElementById('mode-select').addEventListener('change', e => switchMode(e.target.value));

  // Theme selector
  document.getElementById('theme-select').addEventListener('change', e => ThemeManager.apply(e.target.value));

  // Boundary toggle
  document.getElementById('boundary-wrap').addEventListener('click', () => {
    boundaryMode = 'wrap';
    document.getElementById('boundary-wrap').classList.add('active');
    document.getElementById('boundary-bounce').classList.remove('active');
  });
  document.getElementById('boundary-bounce').addEventListener('click', () => {
    boundaryMode = 'bounce';
    document.getElementById('boundary-bounce').classList.add('active');
    document.getElementById('boundary-wrap').classList.remove('active');
  });

  // Vision toggle
  document.getElementById('vision-omni').addEventListener('click', () => {
    visionMode = 'omni';
    document.getElementById('vision-omni').classList.add('active');
    document.getElementById('vision-cone').classList.remove('active');
  });
  document.getElementById('vision-cone').addEventListener('click', () => {
    visionMode = 'cone';
    document.getElementById('vision-cone').classList.add('active');
    document.getElementById('vision-omni').classList.remove('active');
  });

  // Checkboxes
  document.getElementById('trails-toggle').addEventListener('change', e => {
    trailsEnabled = e.target.checked;
    if (!trailsEnabled) boids.forEach(b => b.trails = []);
  });
  document.getElementById('spatial-toggle').addEventListener('change', e => {
    spatialGridEnabled = e.target.checked;
  });
  document.getElementById('species-toggle').addEventListener('change', e => {
    twoSpeciesEnabled = e.target.checked;
    // Reassign species
    for (let i = 0; i < boids.length; i++) {
      boids[i].species = twoSpeciesEnabled && i >= boids.length / 2 ? 'red' : 'blue';
    }
  });
  document.getElementById('debug-toggle').addEventListener('change', e => {
    debugVision = e.target.checked;
  });

  // Predator options
  document.getElementById('predator-follow').addEventListener('change', e => {
    predatorFollowMode = e.target.checked;
  });
  document.getElementById('predator-fear-trail').addEventListener('change', e => {
    predatorFearTrail = e.target.checked;
    if (!predatorFearTrail) fearPoints = [];
  });

  // Painter options
  document.getElementById('clear-obstacles').addEventListener('click', () => {
    obstacles = [];
    followObstacle = null;
  });
  document.getElementById('generate-maze').addEventListener('click', generateMaze);
  document.getElementById('obstacle-follow').addEventListener('change', e => {
    if (e.target.checked) {
      followObstacle = { x: width / 2, y: height / 2, radius: 30, type: 'static', vx: 0, vy: 0 };
      obstacles.push(followObstacle);
    } else {
      if (followObstacle) {
        const idx = obstacles.indexOf(followObstacle);
        if (idx !== -1) obstacles.splice(idx, 1);
        followObstacle = null;
      }
    }
  });

  // Audio source buttons
  document.getElementById('audio-mic-btn').addEventListener('click', async () => {
    const success = await audioAnalyzer.initMicrophone();
    if (success) {
      document.getElementById('audio-mic-btn').classList.add('active');
      document.getElementById('audio-file-btn').classList.remove('active');
    } else {
      alert('Microphone access was denied or is unavailable.');
    }
  });
  document.getElementById('audio-file-btn').addEventListener('click', () => {
    document.getElementById('audio-file-input').click();
  });
  document.getElementById('audio-file-input').addEventListener('change', async e => {
    if (e.target.files.length > 0) {
      const success = await audioAnalyzer.initFile(e.target.files[0]);
      if (success) {
        document.getElementById('audio-file-btn').classList.add('active');
        document.getElementById('audio-mic-btn').classList.remove('active');
      }
    }
  });
  document.getElementById('audio-mute').addEventListener('change', () => {
    audioAnalyzer.toggleMute();
  });

  // Actions
  document.getElementById('pause-btn').addEventListener('click', togglePause);
  document.getElementById('reset-btn').addEventListener('click', resetSimulation);

  // Chart toggle
  document.getElementById('chart-toggle').addEventListener('click', () => {
    chartVisible = !chartVisible;
    document.getElementById('chart-panel').classList.toggle('visible', chartVisible);
    document.getElementById('chart-toggle').textContent = chartVisible ? 'Hide Charts' : 'Show Charts';
  });

  // Help modal
  document.getElementById('help-btn').addEventListener('click', () => {
    document.getElementById('help-modal').classList.add('visible');
  });
  document.getElementById('modal-close').addEventListener('click', () => {
    document.getElementById('help-modal').classList.remove('visible');
  });
  document.getElementById('help-modal').addEventListener('click', e => {
    if (e.target === document.getElementById('help-modal')) {
      document.getElementById('help-modal').classList.remove('visible');
    }
  });

  // Panel toggle (responsive)
  document.getElementById('panel-toggle').addEventListener('click', () => {
    document.getElementById('side-panel').classList.toggle('open');
  });

  // Right-click handler for painter mode
  document.addEventListener('contextmenu', contextMenuHandler);
}

/**
 * Wire a slider input to a callback and value display.
 * @param {string} id - Element ID of the range input
 * @param {function|null} callback - Called with numeric value on change
 * @param {number} decimals - Decimal places for display
 * @param {string} suffix - Optional suffix for display
 */
function wireSlider(id, callback, decimals, suffix = '') {
  const slider = document.getElementById(id);
  const display = document.getElementById(`${id}-val`);
  if (!slider) return;

  const handler = () => {
    const val = parseFloat(slider.value);
    if (display) {
      display.textContent = decimals > 0 ? val.toFixed(decimals) + suffix : val + suffix;
    }
    if (callback) callback(val);
  };

  slider.addEventListener('input', handler);
}
