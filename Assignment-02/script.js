// Canvas setup
const canvas = document.getElementById('starfield');
const ctx = canvas.getContext('2d');

// Resize canvas to fill window
function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
resizeCanvas();
window.addEventListener('resize', resizeCanvas);

// Configuration - controlled by sliders
const config = {
    speedMultiplier: 1.0,    // 0-2 (from 0-200% slider)
    starCount: 200,          // 50-500
    trailLength: 0.5,        // 0-1 (from 0-100% slider)
    starSize: 3,             // 1-10 pixels
    colorIntensity: 0.8,     // 0-1 (from 0-100% slider)
    mode: 'normal'           // normal, fountain, donut, spiral
};

// Star colors palette - varied colors as specified
const starColors = [
    { r: 255, g: 255, b: 255 }, // White
    { r: 200, g: 220, b: 255 }, // Light blue
    { r: 150, g: 180, b: 255 }, // Blue
    { r: 200, g: 150, b: 255 }, // Purple
    { r: 255, g: 180, b: 220 }, // Pink
    { r: 255, g: 240, b: 180 }, // Yellow
    { r: 255, g: 200, b: 150 }, // Orange-ish
];

// Particle class - represents a single star
class Particle {
    constructor() {
        this.reset();
    }

    // Initialize or reset particle to starting position
    reset() {
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;

        // Start at center with small random offset
        this.x = centerX + (Math.random() - 0.5) * 10;
        this.y = centerY + (Math.random() - 0.5) * 10;

        // Random angle for direction (radiate outward)
        const angle = Math.random() * Math.PI * 2;

        // Base speed with some variation
        const speed = 0.5 + Math.random() * 1.5;

        this.vx = Math.cos(angle) * speed;
        this.vy = Math.sin(angle) * speed;

        // Random size variation (will be multiplied by config.starSize)
        this.sizeMultiplier = 0.5 + Math.random() * 1.0;

        // Pick a random color from palette
        this.color = starColors[Math.floor(Math.random() * starColors.length)];

        // For fountain mode
        this.gravity = 0;

        // For donut mode
        this.orbitRadius = 50 + Math.random() * 150;
        this.orbitAngle = Math.random() * Math.PI * 2;
        this.orbitSpeed = 0.01 + Math.random() * 0.02;

        // For spiral mode
        this.spiralRadius = 5;
        this.spiralAngle = Math.random() * Math.PI * 2;
        this.spiralArm = Math.floor(Math.random() * 4); // 4 spiral arms
    }

    // Update particle position based on current mode
    update() {
        const speed = config.speedMultiplier;

        switch (config.mode) {
            case 'normal':
                this.updateNormal(speed);
                break;
            case 'fountain':
                this.updateFountain(speed);
                break;
            case 'donut':
                this.updateDonut(speed);
                break;
            case 'spiral':
                this.updateSpiral(speed);
                break;
        }
    }

    // Normal mode: stars radiate outward from center
    updateNormal(speed) {
        this.x += this.vx * speed * 2;
        this.y += this.vy * speed * 2;

        // Check if particle is off screen
        if (this.x < -50 || this.x > canvas.width + 50 ||
            this.y < -50 || this.y > canvas.height + 50) {
            this.reset();
        }
    }

    // Fountain mode: stars shoot up and fall with gravity
    updateFountain(speed) {
        const centerX = canvas.width / 2;
        const bottomY = canvas.height;

        // On first update or reset, set fountain initial velocity
        if (this.gravity === 0) {
            this.x = centerX + (Math.random() - 0.5) * 50;
            this.y = bottomY;
            this.vx = (Math.random() - 0.5) * 3;
            this.vy = -(8 + Math.random() * 6); // Shoot upward
            this.gravity = 0.15;
        }

        // Apply gravity
        this.vy += this.gravity * speed;

        // Update position
        this.x += this.vx * speed;
        this.y += this.vy * speed;

        // Respawn when falling below canvas
        if (this.y > bottomY + 20) {
            this.x = centerX + (Math.random() - 0.5) * 50;
            this.y = bottomY;
            this.vx = (Math.random() - 0.5) * 3;
            this.vy = -(8 + Math.random() * 6);
        }
    }

    // Donut mode: stars orbit in circles around center
    updateDonut(speed) {
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;

        // Update orbit angle
        this.orbitAngle += this.orbitSpeed * speed;

        // Calculate position on orbit
        this.x = centerX + Math.cos(this.orbitAngle) * this.orbitRadius;
        this.y = centerY + Math.sin(this.orbitAngle) * this.orbitRadius;
    }

    // Spiral mode: stars spiral outward from center
    updateSpiral(speed) {
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;

        // Increase radius as star moves outward
        this.spiralRadius += 0.5 * speed;

        // Rotate based on spiral arm
        const armOffset = (this.spiralArm / 4) * Math.PI * 2;
        this.spiralAngle += 0.02 * speed;

        // Calculate position
        this.x = centerX + Math.cos(this.spiralAngle + armOffset) * this.spiralRadius;
        this.y = centerY + Math.sin(this.spiralAngle + armOffset) * this.spiralRadius;

        // Reset when too far from center
        const maxRadius = Math.max(canvas.width, canvas.height) * 0.6;
        if (this.spiralRadius > maxRadius) {
            this.spiralRadius = 5;
            this.spiralAngle = Math.random() * Math.PI * 2;
        }
    }

    // Draw the particle
    draw() {
        const size = config.starSize * this.sizeMultiplier;
        const intensity = config.colorIntensity;

        // Apply intensity to color
        const r = Math.floor(this.color.r * intensity);
        const g = Math.floor(this.color.g * intensity);
        const b = Math.floor(this.color.b * intensity);

        // Draw star with glow effect
        ctx.beginPath();
        ctx.arc(this.x, this.y, size, 0, Math.PI * 2);
        ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
        ctx.fill();

        // Add subtle glow for larger stars
        if (size > 2) {
            ctx.beginPath();
            ctx.arc(this.x, this.y, size * 2, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(${r}, ${g}, ${b}, 0.2)`;
            ctx.fill();
        }
    }
}

// Particle array
let particles = [];

// Initialize particles
function initParticles() {
    particles = [];
    for (let i = 0; i < config.starCount; i++) {
        particles.push(new Particle());
    }
}

// Adjust particle count (add or remove particles)
function adjustParticleCount() {
    while (particles.length < config.starCount) {
        particles.push(new Particle());
    }
    while (particles.length > config.starCount) {
        particles.pop();
    }
}

// Main animation loop
function animate() {
    // Trail effect: draw semi-transparent black rectangle
    // Lower alpha = longer trails, higher alpha = shorter trails
    const trailAlpha = 1 - (config.trailLength * 0.95);
    ctx.fillStyle = `rgba(0, 0, 0, ${trailAlpha})`;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Update and draw all particles
    for (const particle of particles) {
        particle.update();
        particle.draw();
    }

    requestAnimationFrame(animate);
}

// Switch movement mode
function setMode(mode) {
    config.mode = mode;

    // Reset all particles for clean transition
    for (const particle of particles) {
        particle.reset();
        particle.gravity = 0; // Reset fountain gravity flag
    }

    // Update button states
    document.querySelectorAll('.mode-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.mode === mode);
    });
}

// Set up slider controls
function setupControls() {
    // Speed slider
    const speedSlider = document.getElementById('speed');
    const speedValue = document.getElementById('speed-value');
    speedSlider.addEventListener('input', () => {
        config.speedMultiplier = speedSlider.value / 100;
        speedValue.textContent = `${speedSlider.value}%`;
    });

    // Star count slider
    const countSlider = document.getElementById('count');
    const countValue = document.getElementById('count-value');
    countSlider.addEventListener('input', () => {
        config.starCount = parseInt(countSlider.value);
        countValue.textContent = countSlider.value;
        adjustParticleCount();
    });

    // Trail length slider
    const trailSlider = document.getElementById('trail');
    const trailValue = document.getElementById('trail-value');
    trailSlider.addEventListener('input', () => {
        config.trailLength = trailSlider.value / 100;
        trailValue.textContent = `${trailSlider.value}%`;
    });

    // Star size slider
    const sizeSlider = document.getElementById('size');
    const sizeValue = document.getElementById('size-value');
    sizeSlider.addEventListener('input', () => {
        config.starSize = parseInt(sizeSlider.value);
        sizeValue.textContent = `${sizeSlider.value}px`;
    });

    // Color intensity slider
    const intensitySlider = document.getElementById('intensity');
    const intensityValue = document.getElementById('intensity-value');
    intensitySlider.addEventListener('input', () => {
        config.colorIntensity = intensitySlider.value / 100;
        intensityValue.textContent = `${intensitySlider.value}%`;
    });

    // Mode buttons
    document.querySelectorAll('.mode-btn').forEach(btn => {
        btn.addEventListener('click', () => setMode(btn.dataset.mode));
    });
}

// Initialize and start
initParticles();
setupControls();
animate();
