// Snake Quest - Enhanced Snake Game

// ============================================
// CONFIGURATION & CONSTANTS
// ============================================

const GRID_SIZE = 12;
const CELL_SIZE = 50;
const CANVAS_SIZE = GRID_SIZE * CELL_SIZE;

// Colors from spec
const COLORS = {
    background: '#FFF8F0',
    gridLine: '#F0E6D8',
    snakeBody: '#6BC47D',  // Warmer, brighter green
    snakeOutline: '#4A9A5E',  // Matching warmer outline
    snakeHeadOutline: '#3D8A4E',  // Slightly darker for head
    food: '#E8495A',
    foodHighlight: '#FFD700',
    foodOutline: '#5C3D2E',
    poison: '#9B6BBF',
    poisonOutline: '#6B4A8A',
    powerUp: '#F5C542',
    powerUpOutline: '#C99A2E',
    bridge: '#A0785A',
    bridgePlanks: '#7A5C3A',
    obstacle: '#B0A898',
    obstacleOutline: '#8A8070',
    outline: '#3D2B1F',
    particle: '#FFF5D0',
    eyeWhite: '#FFFFFF',
    eyePupil: '#3D2B1F',
    mouth: '#5C3D2E'
};

// Game state
const GameState = {
    START: 'start',
    PLAYING: 'playing',
    PAUSED: 'paused',
    COUNTDOWN: 'countdown',
    GAMEOVER: 'gameover'
};

// Directions
const Direction = {
    UP: { x: 0, y: -1 },
    DOWN: { x: 0, y: 1 },
    LEFT: { x: -1, y: 0 },
    RIGHT: { x: 1, y: 0 }
};

// Power-up types
const PowerUpType = {
    SLOW_MO: 'Slow-Mo',
    GHOST: 'Ghost',
    SCORE_BOOST: 'Score Boost'
};

// ============================================
// GAME CLASS
// ============================================

class SnakeQuest {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');

        // UI Elements
        this.scoreDisplay = document.getElementById('score');
        this.streakDisplay = document.getElementById('streak');
        this.highscoreDisplay = document.getElementById('highscore');
        this.buffIndicator = document.getElementById('buff-indicator');
        this.buffName = document.getElementById('buff-name');
        this.buffTimer = document.getElementById('buff-timer');
        this.startScreen = document.getElementById('start-screen');
        this.pauseScreen = document.getElementById('pause-screen');
        this.gameoverScreen = document.getElementById('gameover-screen');
        this.countdownDisplay = document.getElementById('countdown');
        this.finalScoreDisplay = document.getElementById('final-score');
        this.bestStreakDisplay = document.getElementById('best-streak');
        this.backToMenuBtn = document.getElementById('back-to-menu');
        this.customOptions = document.getElementById('custom-options');
        this.modeButtons = document.querySelectorAll('.mode-btn');

        // Custom toggle elements
        this.toggleObstacles = document.getElementById('toggle-obstacles');
        this.toggleBridges = document.getElementById('toggle-bridges');
        this.togglePoison = document.getElementById('toggle-poison');
        this.togglePowerups = document.getElementById('toggle-powerups');
        this.toggleWallwrap = document.getElementById('toggle-wallwrap');

        // Game state
        this.state = GameState.START;
        this.highScore = 0;

        // Game mode settings
        this.gameMode = 'classic'; // 'classic', 'full', 'custom'
        this.settings = {
            obstacles: false,
            bridges: false,
            poison: false,
            powerups: false,
            wallWrap: false
        };

        // Initialize game arrays (prevents errors before game starts)
        this.snake = [];
        this.obstacles = [];
        this.bridges = [];
        this.particles = [];
        this.food = null;
        this.poisonFood = null;
        this.powerUp = null;
        this.activeBuff = null;

        // Bind event listeners
        this.bindEvents();

        // Start render loop
        this.lastTime = 0;
        this.accumulator = 0;
        this.render();
    }

    bindEvents() {
        document.addEventListener('keydown', (e) => this.handleKeyDown(e));

        // Mode button listeners
        this.modeButtons.forEach(btn => {
            btn.addEventListener('click', () => this.selectMode(btn.dataset.mode));
        });

        // Custom toggle listeners
        if (this.toggleObstacles) {
            this.toggleObstacles.addEventListener('change', (e) => {
                this.settings.obstacles = e.target.checked;
            });
        }
        if (this.toggleBridges) {
            this.toggleBridges.addEventListener('change', (e) => {
                this.settings.bridges = e.target.checked;
            });
        }
        if (this.togglePoison) {
            this.togglePoison.addEventListener('change', (e) => {
                this.settings.poison = e.target.checked;
            });
        }
        if (this.togglePowerups) {
            this.togglePowerups.addEventListener('change', (e) => {
                this.settings.powerups = e.target.checked;
            });
        }
        if (this.toggleWallwrap) {
            this.toggleWallwrap.addEventListener('change', (e) => {
                this.settings.wallWrap = e.target.checked;
            });
        }

        // Back to menu button
        if (this.backToMenuBtn) {
            this.backToMenuBtn.addEventListener('click', () => this.backToMenu());
        }
    }

    backToMenu() {
        this.state = GameState.START;
        this.gameoverScreen.classList.add('hidden');
        this.startScreen.classList.remove('hidden');

        // Reset game arrays
        this.snake = [];
        this.obstacles = [];
        this.bridges = [];
        this.particles = [];
        this.food = null;
        this.poisonFood = null;
        this.powerUp = null;
        this.activeBuff = null;
    }

    selectMode(mode) {
        this.gameMode = mode;

        // Update button states
        this.modeButtons.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.mode === mode);
        });

        // Show/hide custom options
        if (this.customOptions) {
            this.customOptions.classList.toggle('hidden', mode !== 'custom');
        }

        // Apply mode presets
        if (mode === 'classic') {
            this.settings = {
                obstacles: false,
                bridges: false,
                poison: false,
                powerups: false,
                wallWrap: false
            };
        } else if (mode === 'full') {
            this.settings = {
                obstacles: true,
                bridges: true,
                poison: true,
                powerups: true,
                wallWrap: false
            };
        }
        // 'custom' mode uses whatever toggles are set
    }

    handleKeyDown(e) {
        const key = e.key.toLowerCase();

        // Start/Restart
        if (key === 'enter') {
            if (this.state === GameState.START || this.state === GameState.GAMEOVER) {
                this.startGame();
            }
            return;
        }

        // Pause/Resume
        if (key === 'p' || key === 'escape') {
            if (this.state === GameState.PLAYING) {
                this.pause();
            } else if (this.state === GameState.PAUSED) {
                this.resumeWithCountdown();
            }
            return;
        }

        // Direction controls
        if (this.state === GameState.PLAYING) {
            let newDirection = null;

            if (key === 'arrowup' || key === 'w') {
                newDirection = Direction.UP;
            } else if (key === 'arrowdown' || key === 's') {
                newDirection = Direction.DOWN;
            } else if (key === 'arrowleft' || key === 'a') {
                newDirection = Direction.LEFT;
            } else if (key === 'arrowright' || key === 'd') {
                newDirection = Direction.RIGHT;
            }

            if (newDirection) {
                e.preventDefault();
                this.setDirection(newDirection);
            }
        }
    }

    setDirection(newDir) {
        // Prevent reversing direction (can't go opposite of current direction)
        const isOpposite = (
            (this.direction.x === -newDir.x && this.direction.x !== 0) ||
            (this.direction.y === -newDir.y && this.direction.y !== 0)
        );

        if (isOpposite) return;

        this.nextDirection = newDir;
    }

    // ============================================
    // GAME INITIALIZATION
    // ============================================

    startGame() {
        // Reset game state
        this.score = 0;
        this.streak = 1;
        this.bestStreak = 1;

        // Apply wall wrap setting
        this.wallWrap = this.settings.wallWrap;

        // Snake starts in the center, 3 segments long
        const startX = Math.floor(GRID_SIZE / 2);
        const startY = Math.floor(GRID_SIZE / 2);
        this.snake = [
            { x: startX, y: startY },
            { x: startX - 1, y: startY },
            { x: startX - 2, y: startY }
        ];

        this.direction = Direction.RIGHT;
        this.nextDirection = Direction.RIGHT;

        // Particles
        this.particles = [];

        // Active power-up
        this.activeBuff = null;
        this.buffEndTime = 0;

        // Generate obstacles (if enabled)
        if (this.settings.obstacles) {
            this.generateObstacles();
        } else {
            this.obstacles = [];
        }

        // Generate bridges (if enabled)
        if (this.settings.bridges) {
            this.generateBridges();
        } else {
            this.bridges = [];
        }

        // Food
        this.food = null;
        this.poisonFood = null;
        this.powerUp = null;
        this.powerUpExpireTime = 0;

        this.spawnFood();

        // Timing - slower for classic mode (180ms), faster for enhanced modes (130ms)
        this.baseTickRate = this.gameMode === 'classic' ? 180 : 130;
        this.tickRate = this.baseTickRate;

        // Hide overlays
        this.startScreen.classList.add('hidden');
        this.pauseScreen.classList.add('hidden');
        this.gameoverScreen.classList.add('hidden');

        // Update UI
        this.updateUI();

        this.state = GameState.PLAYING;
    }

    generateObstacles() {
        this.obstacles = [];
        const numObstacles = 3 + Math.floor(Math.random() * 3); // 3-5 obstacles

        // Get snake starting area to avoid
        const safeZone = [];
        const centerX = Math.floor(GRID_SIZE / 2);
        const centerY = Math.floor(GRID_SIZE / 2);
        for (let dx = -3; dx <= 3; dx++) {
            for (let dy = -2; dy <= 2; dy++) {
                safeZone.push({ x: centerX + dx, y: centerY + dy });
            }
        }

        for (let i = 0; i < numObstacles; i++) {
            let pos;
            let attempts = 0;
            do {
                pos = {
                    x: Math.floor(Math.random() * GRID_SIZE),
                    y: Math.floor(Math.random() * GRID_SIZE)
                };
                attempts++;
            } while (attempts < 100 && (
                this.obstacles.some(o => o.x === pos.x && o.y === pos.y) ||
                safeZone.some(s => s.x === pos.x && s.y === pos.y)
            ));

            if (attempts < 100) {
                this.obstacles.push(pos);
            }
        }
    }

    generateBridges() {
        this.bridges = [];
        const numBridges = 2 + Math.floor(Math.random() * 2); // 2-3 bridges

        // Divide grid into quadrants for distribution
        const quadrants = [
            { minX: 1, maxX: 8, minY: 1, maxY: 8 },
            { minX: 11, maxX: 18, minY: 1, maxY: 8 },
            { minX: 1, maxX: 8, minY: 11, maxY: 18 },
            { minX: 11, maxX: 18, minY: 11, maxY: 18 }
        ];

        // Shuffle quadrants
        for (let i = quadrants.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [quadrants[i], quadrants[j]] = [quadrants[j], quadrants[i]];
        }

        for (let i = 0; i < numBridges && i < quadrants.length; i++) {
            const q = quadrants[i];
            const isHorizontal = Math.random() < 0.5;

            let bridge = null;
            let attempts = 0;

            while (attempts < 50 && !bridge) {
                const x = q.minX + Math.floor(Math.random() * (q.maxX - q.minX - 2));
                const y = q.minY + Math.floor(Math.random() * (q.maxY - q.minY - 2));

                const cells = [];
                for (let j = 0; j < 3; j++) {
                    if (isHorizontal) {
                        cells.push({ x: x + j, y });
                    } else {
                        cells.push({ x, y: y + j });
                    }
                }

                // Check if all cells are valid
                const valid = cells.every(c =>
                    c.x >= 0 && c.x < GRID_SIZE &&
                    c.y >= 0 && c.y < GRID_SIZE &&
                    !this.obstacles.some(o => o.x === c.x && o.y === c.y) &&
                    !this.bridges.some(b => b.cells.some(bc => bc.x === c.x && bc.y === c.y))
                );

                if (valid) {
                    bridge = { cells, isHorizontal };
                }
                attempts++;
            }

            if (bridge) {
                this.bridges.push(bridge);
            }
        }
    }

    // ============================================
    // FOOD SPAWNING
    // ============================================

    spawnFood() {
        this.food = this.getRandomEmptyCell();

        // Maybe spawn poison food (20% chance, if enabled)
        if (this.settings.poison && Math.random() < 0.2) {
            this.poisonFood = this.getRandomEmptyCell();
        } else {
            this.poisonFood = null;
        }

        // Maybe spawn power-up (15% chance, if enabled)
        if (this.settings.powerups && Math.random() < 0.15) {
            this.powerUp = {
                pos: this.getRandomEmptyCell(),
                type: this.getRandomPowerUpType()
            };
            this.powerUpExpireTime = Date.now() + 8000; // 8 seconds
        } else {
            this.powerUp = null;
        }
    }

    getRandomEmptyCell() {
        let cell;
        let attempts = 0;

        do {
            cell = {
                x: Math.floor(Math.random() * GRID_SIZE),
                y: Math.floor(Math.random() * GRID_SIZE)
            };
            attempts++;
        } while (attempts < 200 && (
            this.snake.some(s => s.x === cell.x && s.y === cell.y) ||
            this.obstacles.some(o => o.x === cell.x && o.y === cell.y) ||
            (this.food && this.food.x === cell.x && this.food.y === cell.y) ||
            (this.poisonFood && this.poisonFood.x === cell.x && this.poisonFood.y === cell.y) ||
            (this.powerUp && this.powerUp.pos.x === cell.x && this.powerUp.pos.y === cell.y)
        ));

        return cell;
    }

    getRandomPowerUpType() {
        const types = [PowerUpType.SLOW_MO, PowerUpType.GHOST, PowerUpType.SCORE_BOOST];
        return types[Math.floor(Math.random() * types.length)];
    }

    // ============================================
    // GAME LOOP
    // ============================================

    render(currentTime = 0) {
        const deltaTime = currentTime - this.lastTime;
        this.lastTime = currentTime;

        if (this.state === GameState.PLAYING) {
            this.accumulator += deltaTime;

            while (this.accumulator >= this.tickRate) {
                this.update();
                this.accumulator -= this.tickRate;
            }
        }

        // Check power-up expiration
        if (this.powerUp && Date.now() > this.powerUpExpireTime) {
            this.powerUp = null;
        }

        // Check buff expiration
        if (this.activeBuff && Date.now() > this.buffEndTime) {
            this.endBuff();
        }

        // Update particles
        this.updateParticles();

        // Draw
        this.draw();

        requestAnimationFrame((t) => this.render(t));
    }

    update() {
        // Apply direction change
        this.direction = this.nextDirection;

        // Calculate new head position
        const head = this.snake[0];
        let newHead = {
            x: head.x + this.direction.x,
            y: head.y + this.direction.y
        };

        // Wall collision/wrap
        if (newHead.x < 0 || newHead.x >= GRID_SIZE ||
            newHead.y < 0 || newHead.y >= GRID_SIZE) {
            if (this.wallWrap) {
                // Wrap around
                newHead.x = (newHead.x + GRID_SIZE) % GRID_SIZE;
                newHead.y = (newHead.y + GRID_SIZE) % GRID_SIZE;
                // Reset streak on wrap
                this.streak = 1;
            } else {
                this.gameOver();
                return;
            }
        }

        // Obstacle collision
        if (this.obstacles.some(o => o.x === newHead.x && o.y === newHead.y)) {
            this.gameOver();
            return;
        }

        // Self collision (unless ghost mode or on bridge)
        const onBridge = this.isOnBridge(newHead);
        if (!this.isGhostMode() && !onBridge) {
            if (this.snake.slice(1).some(s => s.x === newHead.x && s.y === newHead.y)) {
                this.gameOver();
                return;
            }
        }

        // Add particles before moving
        this.addParticles();

        // Move snake
        this.snake.unshift(newHead);

        // Check food collision
        let ate = false;

        if (this.food && newHead.x === this.food.x && newHead.y === this.food.y) {
            // Eat normal food
            let points = 10 * this.streak;
            if (this.activeBuff === PowerUpType.SCORE_BOOST) {
                points *= 2;
            }
            this.score += points;
            this.streak++;
            if (this.streak > this.bestStreak) {
                this.bestStreak = this.streak;
            }
            ate = true;
            this.spawnFood();
        } else if (this.poisonFood && newHead.x === this.poisonFood.x && newHead.y === this.poisonFood.y) {
            // Eat poison food
            this.streak = 1;
            // Shrink snake (min 3)
            if (this.snake.length > 3) {
                this.snake.pop();
            }
            this.snake.pop(); // Remove the tail that was added
            this.poisonFood = null;
            // Flash effect
            this.canvas.parentElement.classList.add('poison-flash');
            setTimeout(() => {
                this.canvas.parentElement.classList.remove('poison-flash');
            }, 300);
        } else if (this.powerUp && newHead.x === this.powerUp.pos.x && newHead.y === this.powerUp.pos.y) {
            // Eat power-up
            this.activateBuff(this.powerUp.type);
            this.powerUp = null;
            this.snake.pop(); // Don't grow
        } else {
            // No food eaten, remove tail
            this.snake.pop();
        }

        // Update high score
        if (this.score > this.highScore) {
            this.highScore = this.score;
        }

        this.updateUI();
    }

    isOnBridge(pos) {
        if (!this.bridges || this.bridges.length === 0) return false;
        return this.bridges.some(b =>
            b.cells.some(c => c.x === pos.x && c.y === pos.y)
        );
    }

    isGhostMode() {
        return this.activeBuff === PowerUpType.GHOST;
    }

    // ============================================
    // POWER-UPS
    // ============================================

    activateBuff(type) {
        this.activeBuff = type;
        this.buffEndTime = Date.now() + 5000; // 5 seconds

        if (type === PowerUpType.SLOW_MO) {
            this.tickRate = this.baseTickRate * 1.5; // Slower
        }

        this.buffIndicator.classList.remove('hidden');
        this.buffName.textContent = type;
    }

    endBuff() {
        if (this.activeBuff === PowerUpType.SLOW_MO) {
            this.tickRate = this.baseTickRate;
        }

        this.activeBuff = null;
        this.buffIndicator.classList.add('hidden');
    }

    // ============================================
    // PARTICLES
    // ============================================

    addParticles() {
        // Add particles at each segment position
        for (let i = 0; i < this.snake.length; i++) {
            const seg = this.snake[i];
            // Random chance to add particle
            if (Math.random() < 0.3) {
                this.particles.push({
                    x: seg.x * CELL_SIZE + CELL_SIZE / 2 + (Math.random() - 0.5) * 5,
                    y: seg.y * CELL_SIZE + CELL_SIZE / 2 + (Math.random() - 0.5) * 5,
                    life: 20,
                    maxLife: 20,
                    vx: (Math.random() - 0.5) * 0.5,
                    vy: (Math.random() - 0.5) * 0.5
                });
            }
        }
    }

    updateParticles() {
        if (!this.particles || this.particles.length === 0) return;
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.life--;
            p.x += p.vx;
            p.y += p.vy;

            if (p.life <= 0) {
                this.particles.splice(i, 1);
            }
        }
    }

    // ============================================
    // DRAWING
    // ============================================

    draw() {
        const ctx = this.ctx;

        // Draw gingham/checkerboard pattern
        // Gingham overlays horizontal and vertical stripes:
        // - Both stripes light (even+even or odd+odd with offset): lightest
        // - Both stripes dark: darkest
        // - One light, one dark: medium
        const lightest = '#FFF8F0';  // Cream
        const medium = '#F4EBE0';    // Warm beige
        const darkest = '#E8DFD2';   // Darker beige

        for (let row = 0; row < GRID_SIZE; row++) {
            for (let col = 0; col < GRID_SIZE; col++) {
                const rowLight = row % 2 === 0;
                const colLight = col % 2 === 0;

                if (rowLight && colLight) {
                    ctx.fillStyle = lightest;
                } else if (!rowLight && !colLight) {
                    ctx.fillStyle = darkest;
                } else {
                    ctx.fillStyle = medium;
                }

                ctx.fillRect(col * CELL_SIZE, row * CELL_SIZE, CELL_SIZE, CELL_SIZE);
            }
        }

        // Draw particles
        this.drawParticles();

        // Draw obstacles
        this.drawObstacles();

        // Draw food
        this.drawFood();

        // Draw snake body (not under bridges)
        this.drawSnakeBody(false);

        // Draw bridges
        this.drawBridges();

        // Draw snake segments under bridges (dimmed)
        this.drawSnakeBody(true);

        // Draw snake head (always on top)
        this.drawSnakeHead();
    }

    drawParticles() {
        if (!this.particles || this.particles.length === 0) return;
        const ctx = this.ctx;

        for (const p of this.particles) {
            const alpha = (p.life / p.maxLife) * 0.6;
            ctx.fillStyle = `rgba(255, 245, 208, ${alpha})`;
            ctx.beginPath();
            ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    drawObstacles() {
        if (!this.obstacles || this.obstacles.length === 0) return;
        const ctx = this.ctx;

        for (const obs of this.obstacles) {
            const x = obs.x * CELL_SIZE;
            const y = obs.y * CELL_SIZE;

            // Rounded rectangle
            this.drawRoundedRect(x + 2, y + 2, CELL_SIZE - 4, CELL_SIZE - 4, 6, COLORS.obstacle, COLORS.outline, 2);
        }
    }

    drawFruit(x, y, fillColor, outlineColor, glowColor, hasGlow, time) {
        const ctx = this.ctx;
        const scale = CELL_SIZE / 50;
        const radius = 14 * scale;
        const pulse = hasGlow ? (1 + Math.sin(time * 4) * 0.08) : 1;
        const actualRadius = radius * pulse;

        ctx.save();

        // Glow effect
        if (hasGlow) {
            ctx.shadowColor = glowColor;
            ctx.shadowBlur = 15 + Math.sin(time * 4) * 5;
        }

        // Fruit body (slightly offset down for stem room)
        const fruitY = y + 2 * scale;
        ctx.fillStyle = fillColor;
        ctx.strokeStyle = COLORS.outline;
        ctx.lineWidth = 3 * scale;
        ctx.beginPath();
        ctx.arc(x, fruitY, actualRadius, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        ctx.restore();

        // Stem
        ctx.strokeStyle = '#5C3D2E';
        ctx.lineWidth = 3 * scale;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(x, fruitY - actualRadius);
        ctx.quadraticCurveTo(x + 4 * scale, fruitY - actualRadius - 8 * scale, x + 2 * scale, fruitY - actualRadius - 12 * scale);
        ctx.stroke();

        // Small leaf
        ctx.fillStyle = '#6BC47D';
        ctx.strokeStyle = COLORS.outline;
        ctx.lineWidth = 2 * scale;
        ctx.beginPath();
        ctx.ellipse(x + 6 * scale, fruitY - actualRadius - 6 * scale, 5 * scale, 3 * scale, Math.PI / 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Highlight
        ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.beginPath();
        ctx.arc(x - 4 * scale, fruitY - 4 * scale, 4 * scale, 0, Math.PI * 2);
        ctx.fill();
    }

    drawFood() {
        const ctx = this.ctx;
        const time = Date.now() / 1000;

        // Normal food - red apple/cherry with stem
        if (this.food) {
            const x = this.food.x * CELL_SIZE + CELL_SIZE / 2;
            const y = this.food.y * CELL_SIZE + CELL_SIZE / 2;
            this.drawFruit(x, y, COLORS.food, COLORS.foodOutline, COLORS.food, true, time);
        }

        // Poison food - purple berry with stem
        if (this.poisonFood) {
            const x = this.poisonFood.x * CELL_SIZE + CELL_SIZE / 2;
            const y = this.poisonFood.y * CELL_SIZE + CELL_SIZE / 2;
            this.drawFruit(x, y, COLORS.poison, COLORS.poisonOutline, null, false, time);
        }

        // Power-up - golden fruit with stem
        if (this.powerUp) {
            const x = this.powerUp.pos.x * CELL_SIZE + CELL_SIZE / 2;
            const y = this.powerUp.pos.y * CELL_SIZE + CELL_SIZE / 2;
            this.drawFruit(x, y, COLORS.powerUp, COLORS.powerUpOutline, COLORS.powerUp, true, time);
        }
    }

    drawSnakeBody(underBridge) {
        if (!this.snake || this.snake.length === 0) return;
        const ctx = this.ctx;

        // Circle radius - large enough to touch adjacent segments
        const radius = CELL_SIZE / 2 - 2;

        for (let i = 1; i < this.snake.length; i++) {
            const seg = this.snake[i];
            const isUnderBridge = this.isOnBridge(seg);

            // Skip if we're drawing under-bridge but this isn't under a bridge, or vice versa
            if (underBridge !== isUnderBridge) continue;

            const centerX = seg.x * CELL_SIZE + CELL_SIZE / 2;
            const centerY = seg.y * CELL_SIZE + CELL_SIZE / 2;

            ctx.save();
            if (underBridge) {
                ctx.globalAlpha = 0.5; // Dim segments under bridge
            }

            // Ghost mode effect
            if (this.isGhostMode()) {
                ctx.globalAlpha *= 0.7;
            }

            // Draw circle segment
            ctx.fillStyle = COLORS.snakeBody;
            ctx.strokeStyle = COLORS.snakeOutline;
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();

            ctx.restore();
        }
    }

    drawSnakeHead() {
        if (!this.snake || this.snake.length === 0) return;
        const ctx = this.ctx;
        const head = this.snake[0];
        const centerX = head.x * CELL_SIZE + CELL_SIZE / 2;
        const centerY = head.y * CELL_SIZE + CELL_SIZE / 2;

        // Head radius - slightly larger than body
        const radius = CELL_SIZE / 2;

        ctx.save();

        // Ghost mode effect
        if (this.isGhostMode()) {
            ctx.globalAlpha = 0.8;
        }

        // Draw head circle
        ctx.fillStyle = COLORS.snakeBody;
        ctx.strokeStyle = COLORS.snakeHeadOutline;
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Scale factor for features based on cell size
        const scale = CELL_SIZE / 50;

        // Eyes and mouth based on direction
        let eyeOffset = { x: 0, y: 0 };
        let mouthOffset = { x: 0, y: 0 };

        if (this.direction === Direction.RIGHT) {
            eyeOffset = { x: 8 * scale, y: -8 * scale };
            mouthOffset = { x: 16 * scale, y: 8 * scale };
        } else if (this.direction === Direction.LEFT) {
            eyeOffset = { x: -8 * scale, y: -8 * scale };
            mouthOffset = { x: -16 * scale, y: 8 * scale };
        } else if (this.direction === Direction.UP) {
            eyeOffset = { x: -8 * scale, y: -10 * scale };
            mouthOffset = { x: 0, y: -16 * scale };
        } else if (this.direction === Direction.DOWN) {
            eyeOffset = { x: -8 * scale, y: 8 * scale };
            mouthOffset = { x: 0, y: 16 * scale };
        }

        const eyeRadius = 6 * scale;
        const pupilRadius = 3 * scale;
        const eyeSpacing = 16 * scale;

        // White of eyes
        ctx.fillStyle = COLORS.eyeWhite;
        if (this.direction === Direction.LEFT || this.direction === Direction.RIGHT) {
            ctx.beginPath();
            ctx.arc(centerX + eyeOffset.x, centerY - 6 * scale, eyeRadius, 0, Math.PI * 2);
            ctx.arc(centerX + eyeOffset.x, centerY + 6 * scale, eyeRadius, 0, Math.PI * 2);
            ctx.fill();
        } else {
            ctx.beginPath();
            ctx.arc(centerX - 6 * scale, centerY + eyeOffset.y, eyeRadius, 0, Math.PI * 2);
            ctx.arc(centerX + 6 * scale, centerY + eyeOffset.y, eyeRadius, 0, Math.PI * 2);
            ctx.fill();
        }

        // Pupils
        ctx.fillStyle = COLORS.eyePupil;
        const pupilShift = 2 * scale;
        if (this.direction === Direction.LEFT || this.direction === Direction.RIGHT) {
            const px = this.direction === Direction.RIGHT ? pupilShift : -pupilShift;
            ctx.beginPath();
            ctx.arc(centerX + eyeOffset.x + px, centerY - 6 * scale, pupilRadius, 0, Math.PI * 2);
            ctx.arc(centerX + eyeOffset.x + px, centerY + 6 * scale, pupilRadius, 0, Math.PI * 2);
            ctx.fill();
        } else {
            const py = this.direction === Direction.DOWN ? pupilShift : -pupilShift;
            ctx.beginPath();
            ctx.arc(centerX - 6 * scale, centerY + eyeOffset.y + py, pupilRadius, 0, Math.PI * 2);
            ctx.arc(centerX + 6 * scale, centerY + eyeOffset.y + py, pupilRadius, 0, Math.PI * 2);
            ctx.fill();
        }

        // Mouth (small smile)
        ctx.fillStyle = COLORS.mouth;
        ctx.beginPath();
        ctx.arc(centerX + mouthOffset.x * 0.5, centerY + mouthOffset.y * 0.5, 3 * scale, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }

    drawBridges() {
        if (!this.bridges || this.bridges.length === 0) return;
        const ctx = this.ctx;
        const scale = CELL_SIZE / 50;

        for (const bridge of this.bridges) {
            const isHoriz = bridge.isHorizontal;

            // Get bridge bounds
            const startCell = bridge.cells[0];
            const endCell = bridge.cells[bridge.cells.length - 1];

            // Draw continuous bridge deck
            for (let i = 0; i < bridge.cells.length; i++) {
                const cell = bridge.cells[i];
                const x = cell.x * CELL_SIZE;
                const y = cell.y * CELL_SIZE;

                // Bridge deck (wooden planks)
                ctx.fillStyle = COLORS.bridge;
                ctx.strokeStyle = COLORS.outline;
                ctx.lineWidth = 2 * scale;

                // Main deck
                if (isHoriz) {
                    ctx.fillRect(x, y + 8 * scale, CELL_SIZE, CELL_SIZE - 16 * scale);
                    ctx.strokeRect(x, y + 8 * scale, CELL_SIZE, CELL_SIZE - 16 * scale);
                } else {
                    ctx.fillRect(x + 8 * scale, y, CELL_SIZE - 16 * scale, CELL_SIZE);
                    ctx.strokeRect(x + 8 * scale, y, CELL_SIZE - 16 * scale, CELL_SIZE);
                }

                // Plank lines
                ctx.strokeStyle = COLORS.bridgePlanks;
                ctx.lineWidth = 1 * scale;
                if (isHoriz) {
                    for (let px = 0; px < CELL_SIZE; px += 10 * scale) {
                        ctx.beginPath();
                        ctx.moveTo(x + px, y + 8 * scale);
                        ctx.lineTo(x + px, y + CELL_SIZE - 8 * scale);
                        ctx.stroke();
                    }
                } else {
                    for (let py = 0; py < CELL_SIZE; py += 10 * scale) {
                        ctx.beginPath();
                        ctx.moveTo(x + 8 * scale, y + py);
                        ctx.lineTo(x + CELL_SIZE - 8 * scale, y + py);
                        ctx.stroke();
                    }
                }
            }

            // Draw railings on top and bottom edges
            ctx.strokeStyle = COLORS.outline;
            ctx.lineWidth = 3 * scale;
            ctx.lineCap = 'round';

            const bridgeStartX = startCell.x * CELL_SIZE;
            const bridgeStartY = startCell.y * CELL_SIZE;
            const bridgeEndX = endCell.x * CELL_SIZE + CELL_SIZE;
            const bridgeEndY = endCell.y * CELL_SIZE + CELL_SIZE;

            if (isHoriz) {
                // Top railing
                ctx.strokeStyle = '#8B5A2B';
                ctx.lineWidth = 4 * scale;
                ctx.beginPath();
                ctx.moveTo(bridgeStartX, bridgeStartY + 6 * scale);
                ctx.lineTo(bridgeEndX, bridgeStartY + 6 * scale);
                ctx.stroke();

                // Bottom railing
                ctx.beginPath();
                ctx.moveTo(bridgeStartX, bridgeEndY - 6 * scale);
                ctx.lineTo(bridgeEndX, bridgeEndY - 6 * scale);
                ctx.stroke();

                // Posts
                ctx.fillStyle = '#6B4423';
                ctx.strokeStyle = COLORS.outline;
                ctx.lineWidth = 2 * scale;
                for (let i = 0; i <= bridge.cells.length; i++) {
                    const postX = bridgeStartX + i * CELL_SIZE - 3 * scale;
                    // Top posts
                    ctx.fillRect(postX, bridgeStartY + 2 * scale, 6 * scale, 10 * scale);
                    ctx.strokeRect(postX, bridgeStartY + 2 * scale, 6 * scale, 10 * scale);
                    // Bottom posts
                    ctx.fillRect(postX, bridgeEndY - 12 * scale, 6 * scale, 10 * scale);
                    ctx.strokeRect(postX, bridgeEndY - 12 * scale, 6 * scale, 10 * scale);
                }
            } else {
                // Left railing
                ctx.strokeStyle = '#8B5A2B';
                ctx.lineWidth = 4 * scale;
                ctx.beginPath();
                ctx.moveTo(bridgeStartX + 6 * scale, bridgeStartY);
                ctx.lineTo(bridgeStartX + 6 * scale, bridgeEndY);
                ctx.stroke();

                // Right railing
                ctx.beginPath();
                ctx.moveTo(bridgeEndX - 6 * scale, bridgeStartY);
                ctx.lineTo(bridgeEndX - 6 * scale, bridgeEndY);
                ctx.stroke();

                // Posts
                ctx.fillStyle = '#6B4423';
                ctx.strokeStyle = COLORS.outline;
                ctx.lineWidth = 2 * scale;
                for (let i = 0; i <= bridge.cells.length; i++) {
                    const postY = bridgeStartY + i * CELL_SIZE - 3 * scale;
                    // Left posts
                    ctx.fillRect(bridgeStartX + 2 * scale, postY, 10 * scale, 6 * scale);
                    ctx.strokeRect(bridgeStartX + 2 * scale, postY, 10 * scale, 6 * scale);
                    // Right posts
                    ctx.fillRect(bridgeEndX - 12 * scale, postY, 10 * scale, 6 * scale);
                    ctx.strokeRect(bridgeEndX - 12 * scale, postY, 10 * scale, 6 * scale);
                }
            }
        }
    }

    drawRoundedRect(x, y, w, h, r, fill, stroke, lineWidth) {
        const ctx = this.ctx;

        ctx.fillStyle = fill;
        ctx.strokeStyle = stroke;
        ctx.lineWidth = lineWidth;

        ctx.beginPath();
        ctx.moveTo(x + r, y);
        ctx.lineTo(x + w - r, y);
        ctx.quadraticCurveTo(x + w, y, x + w, y + r);
        ctx.lineTo(x + w, y + h - r);
        ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
        ctx.lineTo(x + r, y + h);
        ctx.quadraticCurveTo(x, y + h, x, y + h - r);
        ctx.lineTo(x, y + r);
        ctx.quadraticCurveTo(x, y, x + r, y);
        ctx.closePath();

        ctx.fill();
        ctx.stroke();
    }

    // ============================================
    // UI
    // ============================================

    updateUI() {
        this.scoreDisplay.textContent = this.score;
        this.streakDisplay.textContent = this.streak + 'x';
        this.highscoreDisplay.textContent = this.highScore;

        // Buff timer
        if (this.activeBuff) {
            const remaining = Math.max(0, Math.ceil((this.buffEndTime - Date.now()) / 1000));
            this.buffTimer.textContent = remaining + 's';
        }
    }

    // ============================================
    // GAME STATE
    // ============================================

    pause() {
        this.state = GameState.PAUSED;
        this.pauseScreen.classList.remove('hidden');
        this.countdownDisplay.classList.add('hidden');
        document.querySelector('.pause-prompt').classList.remove('hidden');
    }

    resumeWithCountdown() {
        this.state = GameState.COUNTDOWN;
        document.querySelector('.pause-prompt').classList.add('hidden');
        this.countdownDisplay.classList.remove('hidden');

        let count = 3;
        this.countdownDisplay.textContent = count;

        const countdownInterval = setInterval(() => {
            count--;
            if (count > 0) {
                this.countdownDisplay.textContent = count;
            } else {
                clearInterval(countdownInterval);
                this.pauseScreen.classList.add('hidden');
                this.state = GameState.PLAYING;
            }
        }, 1000);
    }

    gameOver() {
        this.state = GameState.GAMEOVER;
        this.finalScoreDisplay.textContent = this.score;
        this.bestStreakDisplay.textContent = this.bestStreak + 'x';
        this.gameoverScreen.classList.remove('hidden');
        this.buffIndicator.classList.add('hidden');
    }
}

// ============================================
// INITIALIZE GAME
// ============================================

const game = new SnakeQuest();
