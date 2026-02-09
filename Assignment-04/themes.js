// ========== THEME SYSTEM - Visual Theming ==========
// Defines 5 visual themes and handles switching between them.
// Each theme specifies colors, fonts, boid rendering style, and UI aesthetics.

const THEMES = {
  minimal: {
    name: 'Minimal',
    background: '#FFFFFF',
    canvasBg: [255, 255, 255],
    boid: {
      style: 'circle',
      radius: 3,
      fillBlue: [30, 30, 30],
      fillRed: [180, 60, 60],
      stroke: null,
      strokeWeight: 0
    },
    trail: {
      color: [180, 180, 180],
      opacity: 0.5,
      width: 1
    },
    obstacle: {
      fill: [200, 200, 200],
      stroke: [150, 150, 150],
      strokeWeight: 1
    },
    predator: {
      fill: [220, 50, 50],
      stroke: [180, 30, 30],
      radius: 12
    },
    ui: {
      panelBg: '#f8f9fa',
      panelBorder: '#dee2e6',
      textColor: '#212529',
      accentColor: '#495057',
      sliderTrack: '#dee2e6',
      sliderThumb: '#495057',
      buttonBg: '#e9ecef',
      buttonHover: '#dee2e6',
      buttonText: '#212529',
      fontFamily: "'Inter', 'Segoe UI', sans-serif",
      headerBg: '#f8f9fa',
      statsBg: '#f8f9fa'
    },
    grid: {
      show: false,
      color: [230, 230, 230],
      weight: 0.5
    },
    effects: {
      bloom: false,
      sparkles: false,
      backgroundAnimation: null
    }
  },

  neon: {
    name: 'Neon',
    background: '#0a0a0a',
    canvasBg: [10, 10, 10],
    boid: {
      style: 'glow-circle',
      radius: 5,
      fillBlue: [0, 255, 255],
      fillRed: [255, 0, 200],
      stroke: null,
      strokeWeight: 0
    },
    trail: {
      color: [0, 255, 255],
      opacity: 0.6,
      width: 2
    },
    obstacle: {
      fill: [60, 0, 80, 180],
      stroke: [180, 0, 255],
      strokeWeight: 2
    },
    predator: {
      fill: [255, 50, 50],
      stroke: [255, 100, 100],
      radius: 14
    },
    ui: {
      panelBg: '#111118',
      panelBorder: '#2a1a3a',
      textColor: '#e0e0ff',
      accentColor: '#00ffff',
      sliderTrack: '#1a1a2e',
      sliderThumb: '#00ffff',
      buttonBg: '#1a1a2e',
      buttonHover: '#2a2a4e',
      buttonText: '#00ffff',
      fontFamily: "'Orbitron', 'Courier New', monospace",
      headerBg: '#0a0a12',
      statsBg: '#0a0a12'
    },
    grid: {
      show: true,
      color: [20, 20, 40],
      weight: 0.5
    },
    effects: {
      bloom: true,
      sparkles: true,
      backgroundAnimation: null
    }
  },

  nature: {
    name: 'Nature',
    background: 'linear-gradient(180deg, #87CEEB, #E0F6FF)',
    canvasBg: [135, 206, 235],
    canvasBgGradient: { top: [135, 206, 235], bottom: [224, 246, 255] },
    boid: {
      style: 'bird',
      radius: 8,
      fillBlue: [50, 80, 120],
      fillRed: [140, 60, 40],
      stroke: [30, 50, 80],
      strokeWeight: 1
    },
    trail: {
      color: [180, 200, 220],
      opacity: 0.3,
      width: 1
    },
    obstacle: {
      fill: [101, 67, 33],
      stroke: [60, 40, 20],
      strokeWeight: 2
    },
    predator: {
      fill: [139, 69, 19],
      stroke: [100, 50, 10],
      radius: 16
    },
    ui: {
      panelBg: '#f5ebe0',
      panelBorder: '#d5c4a1',
      textColor: '#3e2723',
      accentColor: '#558b2f',
      sliderTrack: '#d5c4a1',
      sliderThumb: '#558b2f',
      buttonBg: '#e6d5b8',
      buttonHover: '#d5c4a1',
      buttonText: '#3e2723',
      fontFamily: "'Nunito', 'Verdana', sans-serif",
      headerBg: '#f5ebe0',
      statsBg: '#f5ebe0'
    },
    grid: {
      show: false,
      color: [180, 210, 230],
      weight: 0.5
    },
    effects: {
      bloom: false,
      sparkles: false,
      backgroundAnimation: null
    }
  },

  comic: {
    name: 'Comic Book',
    background: '#FFFDE7',
    canvasBg: [255, 253, 231],
    boid: {
      style: 'bold-circle',
      radius: 5,
      fillBlue: [33, 150, 243],
      fillRed: [244, 67, 54],
      stroke: [0, 0, 0],
      strokeWeight: 2
    },
    trail: {
      color: [0, 0, 0],
      opacity: 0.4,
      width: 2,
      style: 'speed-lines'
    },
    obstacle: {
      fill: [255, 235, 59],
      stroke: [0, 0, 0],
      strokeWeight: 3
    },
    predator: {
      fill: [244, 67, 54],
      stroke: [0, 0, 0],
      radius: 14
    },
    ui: {
      panelBg: '#FFFDE7',
      panelBorder: '#000000',
      textColor: '#000000',
      accentColor: '#FF5722',
      sliderTrack: '#FFE082',
      sliderThumb: '#FF5722',
      buttonBg: '#FFEB3B',
      buttonHover: '#FFC107',
      buttonText: '#000000',
      fontFamily: "'Bangers', 'Impact', fantasy",
      headerBg: '#FFEB3B',
      statsBg: '#FFFDE7'
    },
    grid: {
      show: false,
      color: [200, 200, 200],
      weight: 1
    },
    effects: {
      bloom: false,
      sparkles: false,
      backgroundAnimation: 'halftone'
    }
  },

  digital: {
    name: 'Digital',
    background: '#000a00',
    canvasBg: [0, 10, 0],
    boid: {
      style: 'triangle',
      radius: 6,
      fillBlue: [0, 200, 50],
      fillRed: [200, 50, 0],
      stroke: [0, 255, 65],
      strokeWeight: 1
    },
    trail: {
      color: [0, 180, 40],
      opacity: 0.4,
      width: 1,
      style: 'binary'
    },
    obstacle: {
      fill: [0, 40, 0],
      stroke: [0, 200, 50],
      strokeWeight: 1
    },
    predator: {
      fill: [200, 0, 0],
      stroke: [255, 50, 50],
      radius: 12
    },
    ui: {
      panelBg: '#001200',
      panelBorder: '#004400',
      textColor: '#00ff41',
      accentColor: '#00ff41',
      sliderTrack: '#003300',
      sliderThumb: '#00ff41',
      buttonBg: '#002200',
      buttonHover: '#003300',
      buttonText: '#00ff41',
      fontFamily: "'Courier New', 'Consolas', monospace",
      headerBg: '#000a00',
      statsBg: '#000a00'
    },
    grid: {
      show: true,
      color: [0, 30, 0],
      weight: 0.5
    },
    effects: {
      bloom: true,
      sparkles: false,
      backgroundAnimation: 'matrix'
    }
  }
};

// ========== THEME MANAGER ==========

const ThemeManager = {
  current: 'minimal',

  /**
   * Get the current theme object.
   * @returns {object} Current theme definition
   */
  getTheme() {
    return THEMES[this.current];
  },

  /**
   * Switch to a new theme and update UI.
   * @param {string} themeName - Theme key to switch to
   */
  apply(themeName) {
    if (!THEMES[themeName]) return;
    this.current = themeName;
    const theme = THEMES[themeName];

    // Apply CSS custom properties
    const root = document.documentElement;
    root.style.setProperty('--panel-bg', theme.ui.panelBg);
    root.style.setProperty('--panel-border', theme.ui.panelBorder);
    root.style.setProperty('--text-color', theme.ui.textColor);
    root.style.setProperty('--accent-color', theme.ui.accentColor);
    root.style.setProperty('--slider-track', theme.ui.sliderTrack);
    root.style.setProperty('--slider-thumb', theme.ui.sliderThumb);
    root.style.setProperty('--button-bg', theme.ui.buttonBg);
    root.style.setProperty('--button-hover', theme.ui.buttonHover);
    root.style.setProperty('--button-text', theme.ui.buttonText);
    root.style.setProperty('--font-family', theme.ui.fontFamily);
    root.style.setProperty('--header-bg', theme.ui.headerBg);
    root.style.setProperty('--stats-bg', theme.ui.statsBg);
    root.style.setProperty('--page-bg', theme.background);

    // Update body class for theme-specific CSS
    document.body.className = `theme-${themeName}`;

    // Update theme selector if it exists
    const selector = document.getElementById('theme-select');
    if (selector) selector.value = themeName;
  },

  /**
   * Render a boid based on the current theme.
   * @param {object} p - p5 instance
   * @param {Boid} boid - The boid to render
   * @param {boolean} selected - Whether this boid is selected
   */
  renderBoid(p, boid, selected = false) {
    const theme = this.getTheme();
    const style = theme.boid;
    const fillColor = boid.species === 'blue' ? style.fillBlue : style.fillRed;

    // Fitness-based brightness for evolution mode
    let alpha = 255;
    if (boid.fitness !== undefined && boid.fitness < 100) {
      alpha = p.map(boid.fitness, 0, 100, 80, 255);
    }

    // Panic state: orange flash
    if (boid.panicTimer > 0) {
      p.push();
      p.noStroke();
      p.fill(255, 165, 0, alpha);
      p.ellipse(boid.position.x, boid.position.y, style.radius * 2.5);
      p.pop();
      return;
    }

    p.push();

    switch (style.style) {
      case 'circle':
        p.noStroke();
        p.fill(fillColor[0], fillColor[1], fillColor[2], alpha);
        p.ellipse(boid.position.x, boid.position.y, style.radius * 2);
        break;

      case 'glow-circle':
        // Outer glow
        for (let i = 3; i > 0; i--) {
          p.noStroke();
          p.fill(fillColor[0], fillColor[1], fillColor[2], alpha * 0.1 * i);
          p.ellipse(boid.position.x, boid.position.y, style.radius * 2 + i * 6);
        }
        // Core
        p.fill(fillColor[0], fillColor[1], fillColor[2], alpha);
        p.ellipse(boid.position.x, boid.position.y, style.radius * 2);
        break;

      case 'bird': {
        // Simple bird silhouette pointing in velocity direction
        const angle = boid.velocity.heading();
        p.translate(boid.position.x, boid.position.y);
        p.rotate(angle);
        p.fill(fillColor[0], fillColor[1], fillColor[2], alpha);
        if (style.stroke) {
          p.stroke(style.stroke[0], style.stroke[1], style.stroke[2]);
          p.strokeWeight(style.strokeWeight);
        } else {
          p.noStroke();
        }
        // Bird shape: body + wings
        p.beginShape();
        p.vertex(style.radius, 0);
        p.vertex(-style.radius * 0.5, -style.radius * 0.7);
        p.vertex(-style.radius * 0.3, 0);
        p.vertex(-style.radius * 0.5, style.radius * 0.7);
        p.endShape(p.CLOSE);
        break;
      }

      case 'bold-circle':
        p.stroke(style.stroke[0], style.stroke[1], style.stroke[2]);
        p.strokeWeight(style.strokeWeight);
        p.fill(fillColor[0], fillColor[1], fillColor[2], alpha);
        p.ellipse(boid.position.x, boid.position.y, style.radius * 2);
        break;

      case 'triangle': {
        const ang = boid.velocity.heading();
        p.translate(boid.position.x, boid.position.y);
        p.rotate(ang);
        p.stroke(style.stroke[0], style.stroke[1], style.stroke[2], alpha);
        p.strokeWeight(style.strokeWeight);
        p.noFill();
        p.beginShape();
        p.vertex(style.radius, 0);
        p.vertex(-style.radius * 0.6, -style.radius * 0.5);
        p.vertex(-style.radius * 0.6, style.radius * 0.5);
        p.endShape(p.CLOSE);
        break;
      }

      default:
        p.noStroke();
        p.fill(fillColor[0], fillColor[1], fillColor[2], alpha);
        p.ellipse(boid.position.x, boid.position.y, style.radius * 2);
    }

    p.pop();

    // Selection indicator
    if (selected) {
      p.push();
      p.noFill();
      p.stroke(255, 255, 0);
      p.strokeWeight(1.5);
      p.ellipse(boid.position.x, boid.position.y, style.radius * 4);
      p.pop();
    }
  },

  /**
   * Render a trail point.
   * @param {object} p - p5 instance
   * @param {number} x - x position
   * @param {number} y - y position
   * @param {number} age - Age of trail point (0=new, 1=fading)
   * @param {Boid} boid - The boid that owns this trail
   */
  renderTrail(p, x, y, age, boid) {
    const theme = this.getTheme();
    const trail = theme.trail;
    const alpha = (1 - age) * trail.opacity * 255;

    if (trail.style === 'speed-lines') {
      // Comic-style speed lines
      p.stroke(trail.color[0], trail.color[1], trail.color[2], alpha);
      p.strokeWeight(trail.width);
      const len = 5;
      const angle = boid.velocity.heading() + p.PI;
      p.line(x, y, x + Math.cos(angle) * len, y + Math.sin(angle) * len);
    } else if (trail.style === 'binary') {
      // Digital binary trail
      if (Math.random() < 0.3) {
        p.fill(trail.color[0], trail.color[1], trail.color[2], alpha);
        p.noStroke();
        p.textSize(8);
        p.text(Math.random() > 0.5 ? '1' : '0', x, y);
      }
    } else {
      // Default dot trail
      p.noStroke();
      p.fill(trail.color[0], trail.color[1], trail.color[2], alpha);
      p.ellipse(x, y, trail.width * 2);
    }
  },

  /**
   * Draw the canvas background for the current theme.
   * @param {object} p - p5 instance
   */
  drawBackground(p) {
    const theme = this.getTheme();

    if (theme.canvasBgGradient) {
      // Gradient background (nature theme)
      const top = theme.canvasBgGradient.top;
      const bot = theme.canvasBgGradient.bottom;
      for (let y = 0; y < p.height; y += 4) {
        const t = y / p.height;
        p.stroke(
          p.lerp(top[0], bot[0], t),
          p.lerp(top[1], bot[1], t),
          p.lerp(top[2], bot[2], t)
        );
        p.line(0, y, p.width, y);
      }
    } else {
      p.background(theme.canvasBg[0], theme.canvasBg[1], theme.canvasBg[2]);
    }

    // Theme-specific background effects
    if (theme.effects.backgroundAnimation === 'halftone') {
      this.drawHalftone(p);
    } else if (theme.effects.backgroundAnimation === 'matrix') {
      this.drawMatrixRain(p);
    }

    // Grid overlay
    if (theme.grid.show) {
      this.drawGrid(p, theme);
    }
  },

  /** Draw halftone dot pattern for comic theme. */
  drawHalftone(p) {
    p.noStroke();
    p.fill(230, 228, 200, 30);
    const spacing = 20;
    for (let x = 0; x < p.width; x += spacing) {
      for (let y = 0; y < p.height; y += spacing) {
        p.ellipse(x, y, 2);
      }
    }
  },

  // Matrix rain state
  _matrixColumns: null,
  _matrixChars: '01',

  /** Draw matrix-style falling code for digital theme. */
  drawMatrixRain(p) {
    if (!this._matrixColumns) {
      const cols = Math.ceil(p.width / 14);
      this._matrixColumns = new Array(cols).fill(0).map(() => ({
        y: Math.random() * p.height,
        speed: 1 + Math.random() * 3,
        chars: []
      }));
    }

    p.textSize(12);
    p.textFont('Courier New');
    p.noStroke();

    for (const col of this._matrixColumns) {
      const x = this._matrixColumns.indexOf(col) * 14;
      p.fill(0, 80, 0, 25);
      const char = this._matrixChars[Math.floor(Math.random() * this._matrixChars.length)];
      p.text(char, x, col.y);
      col.y += col.speed;
      if (col.y > p.height) {
        col.y = 0;
      }
    }
  },

  /** Draw grid overlay. */
  drawGrid(p, theme) {
    p.stroke(theme.grid.color[0], theme.grid.color[1], theme.grid.color[2]);
    p.strokeWeight(theme.grid.weight);
    const spacing = 50;
    for (let x = 0; x < p.width; x += spacing) {
      p.line(x, 0, x, p.height);
    }
    for (let y = 0; y < p.height; y += spacing) {
      p.line(0, y, p.width, y);
    }
  }
};
