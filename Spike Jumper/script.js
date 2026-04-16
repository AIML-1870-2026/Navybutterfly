// ─── Constants ───────────────────────────────────────────────────────────────
const GRAVITY = 2800;
const JUMP_VELOCITY = -1050;
const SHORT_HOP_CUTOFF = 0.35;
const PLAYER_X_RATIO = 0.2;
const GROUND_Y_RATIO = 0.75;
const PLAYER_SIZE = 40;
const BASE_SPEED = 400;
const MAX_SPEED = 900;
const SPEED_INCREMENT = 15;
const SPEED_INTERVAL = 10;
const HITBOX_SHRINK = 4;

const COLORS = {
  bg: '#0a0a0f',
  ground: '#1a1a2e',
  groundLine: '#00ffff',
  playerFill: '#00ffff',
  playerGlow: 'rgba(0,255,255,0.53)',
  spikeFill: '#ff2d55',
  spikeGlow: 'rgba(255,45,85,0.4)',
  sawFill: '#ffcc00',
  sawGlow: 'rgba(255,204,0,0.4)',
  particles: ['#00ffff', '#ff2d55', '#ffcc00', '#a855f7', '#ffffff'],
};

// ─── Audio Engine ─────────────────────────────────────────────────────────────
class AudioEngine {
  constructor() {
    this.ctx = null;
    this.masterGain = null;
    this.musicGain = null;
    this.sfxGain = null;
    this.muted = false;
    this.bpm = 140;
    this.sequencerTimer = null;
    this.currentBar = 0;
    this.currentBeat = 0;
    this.currentStep = 0;
    this.nextNoteTime = 0;
    this.scheduleAhead = 0.1;
    this.lookahead = 25;
    this.running = false;
    this._schedulerInterval = null;
  }

  init() {
    if (this.ctx) return;
    this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.value = 1;
    this.masterGain.connect(this.ctx.destination);

    this.musicGain = this.ctx.createGain();
    this.musicGain.gain.value = 0.25;
    this.musicGain.connect(this.masterGain);

    this.sfxGain = this.ctx.createGain();
    this.sfxGain.gain.value = 0.4;
    this.sfxGain.connect(this.masterGain);
  }

  // Notes: A minor pentatonic: A4=440, C5=523.25, D5=587.33, E5=659.25, G5=784
  // Bass root notes per bar (2 bars each in 4-bar pattern, repeating)
  // Melody 16-note phrase
  get melodyPattern() {
    return [
      440, 523.25, 587.33, 659.25,
      784,  659.25, 587.33, 523.25,
      440,  440,   523.25, 587.33,
      659.25, 784, 880,   784,
    ];
  }

  get bassPattern() {
    // A2, F2, C3, E2 (chord roots, 4 steps each)
    return [110, 110, 110, 110, 87.31, 87.31, 87.31, 87.31,
            130.81, 130.81, 130.81, 130.81, 82.41, 82.41, 82.41, 82.41];
  }

  get arpPattern() {
    // 16th note arpeggios cycling chord tones
    const chords = [
      [220, 277.18, 329.63],  // Am
      [174.61, 220, 261.63],  // F
      [261.63, 329.63, 392],  // C
      [164.81, 220, 329.63],  // Em
    ];
    const out = [];
    for (let c = 0; c < 4; c++) {
      for (let i = 0; i < 4; i++) {
        out.push(chords[c][i % 3]);
      }
    }
    return out;
  }

  _stepDuration() {
    return 60 / this.bpm / 4; // 16th note
  }

  _scheduleNote(freq, time, duration, type, gain, gainNode) {
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    g.gain.setValueAtTime(gain, time);
    g.gain.exponentialRampToValueAtTime(0.001, time + duration);
    osc.connect(g);
    g.connect(gainNode);
    osc.start(time);
    osc.stop(time + duration + 0.01);
  }

  _scheduleKick(time) {
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(150, time);
    osc.frequency.exponentialRampToValueAtTime(40, time + 0.08);
    g.gain.setValueAtTime(0.8, time);
    g.gain.exponentialRampToValueAtTime(0.001, time + 0.1);
    osc.connect(g);
    g.connect(this.musicGain);
    osc.start(time);
    osc.stop(time + 0.12);
  }

  _scheduleSnare(time) {
    const buf = this.ctx.createBuffer(1, this.ctx.sampleRate * 0.06, this.ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    const src = this.ctx.createBufferSource();
    src.buffer = buf;
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0.3, time);
    g.gain.exponentialRampToValueAtTime(0.001, time + 0.06);
    src.connect(g);
    g.connect(this.musicGain);
    src.start(time);
  }

  _scheduleHihat(time) {
    const buf = this.ctx.createBuffer(1, this.ctx.sampleRate * 0.02, this.ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    const src = this.ctx.createBufferSource();
    src.buffer = buf;
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.value = 8000;
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0.15, time);
    g.gain.exponentialRampToValueAtTime(0.001, time + 0.02);
    src.connect(filter);
    filter.connect(g);
    g.connect(this.musicGain);
    src.start(time);
  }

  _scheduler() {
    while (this.nextNoteTime < this.ctx.currentTime + this.scheduleAhead) {
      const step = this.currentStep;
      const t = this.nextNoteTime;
      const sd = this._stepDuration();

      // Melody
      this._scheduleNote(this.melodyPattern[step], t, sd * 0.8, 'square', 0.18, this.musicGain);

      // Bass
      this._scheduleNote(this.bassPattern[step], t, sd * 1.5, 'sawtooth', 0.22, this.musicGain);

      // Arpeggio
      this._scheduleNote(this.arpPattern[step], t, sd * 0.4, 'triangle', 0.12, this.musicGain);

      // Drums: kick on beats 1 and 3 (steps 0 and 8)
      if (step === 0 || step === 8) this._scheduleKick(t);
      // Snare on beats 2 and 4 (steps 4 and 12)
      if (step === 4 || step === 12) this._scheduleSnare(t);
      // Hi-hat every 2 steps
      if (step % 2 === 0) this._scheduleHihat(t);

      this.currentStep = (this.currentStep + 1) % 16;
      this.nextNoteTime += sd;
    }
  }

  startMusic() {
    if (!this.ctx || this.running) return;
    this.running = true;
    this.currentStep = 0;
    this.nextNoteTime = this.ctx.currentTime;
    this._schedulerInterval = setInterval(() => this._scheduler(), this.lookahead);
  }

  stopMusic() {
    this.running = false;
    if (this._schedulerInterval) {
      clearInterval(this._schedulerInterval);
      this._schedulerInterval = null;
    }
  }

  setBPM(bpm) {
    this.bpm = Math.max(140, Math.min(180, bpm));
  }

  toggleMute() {
    this.muted = !this.muted;
    if (this.masterGain) {
      this.masterGain.gain.value = this.muted ? 0 : 1;
    }
    return this.muted;
  }

  // SFX
  playJump(full) {
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    const t = this.ctx.currentTime;
    const dur = full ? 0.12 : 0.08;
    osc.type = 'sine';
    osc.frequency.setValueAtTime(full ? 250 : 300, t);
    osc.frequency.exponentialRampToValueAtTime(full ? 700 : 600, t + dur);
    g.gain.setValueAtTime(0.4, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    osc.connect(g);
    g.connect(this.sfxGain);
    osc.start(t);
    osc.stop(t + dur + 0.01);
  }

  playLand() {
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    const t = this.ctx.currentTime;
    osc.type = 'sine';
    osc.frequency.setValueAtTime(150, t);
    osc.frequency.exponentialRampToValueAtTime(80, t + 0.06);
    g.gain.setValueAtTime(0.5, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.06);
    osc.connect(g);
    g.connect(this.sfxGain);
    osc.start(t);
    osc.stop(t + 0.08);
  }

  playDeath() {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    // Crash tone
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(400, t);
    osc.frequency.exponentialRampToValueAtTime(60, t + 0.2);
    g.gain.setValueAtTime(0.5, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
    osc.connect(g);
    g.connect(this.sfxGain);
    osc.start(t);
    osc.stop(t + 0.22);
    // Noise burst
    const buf = this.ctx.createBuffer(1, this.ctx.sampleRate * 0.2, this.ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    const src = this.ctx.createBufferSource();
    src.buffer = buf;
    const ng = this.ctx.createGain();
    ng.gain.setValueAtTime(0.4, t);
    ng.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
    src.connect(ng);
    ng.connect(this.sfxGain);
    src.start(t);
  }

  playMilestone() {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    const notes = [523.25, 659.25, 784];
    notes.forEach((freq, i) => {
      const osc = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      const start = t + i * 0.08;
      osc.type = 'sine';
      osc.frequency.value = freq;
      g.gain.setValueAtTime(0.35, start);
      g.gain.exponentialRampToValueAtTime(0.001, start + 0.08);
      osc.connect(g);
      g.connect(this.sfxGain);
      osc.start(start);
      osc.stop(start + 0.1);
    });
  }
}

// ─── Particle System ──────────────────────────────────────────────────────────
class Particle {
  constructor(x, y, vx, vy, size, color, life, isFragment = false, rotation = 0, rotVel = 0) {
    this.x = x; this.y = y;
    this.vx = vx; this.vy = vy;
    this.size = size;
    this.color = color;
    this.life = life; // seconds
    this.maxLife = life;
    this.isFragment = isFragment;
    this.rotation = rotation;
    this.rotVel = rotVel;
  }

  update(dt) {
    this.vy += GRAVITY * 0.3 * dt;
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    this.rotation += this.rotVel * dt;
    this.life -= dt;
    return this.life > 0;
  }

  draw(ctx) {
    const alpha = Math.max(0, this.life / this.maxLife);
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(this.x, this.y);
    if (this.isFragment) {
      ctx.rotate(this.rotation);
      ctx.fillStyle = this.color;
      ctx.strokeStyle = this.color;
      ctx.shadowColor = this.color;
      ctx.shadowBlur = 8;
      ctx.fillRect(-this.size / 2, -this.size / 2, this.size, this.size);
    } else {
      ctx.fillStyle = this.color;
      ctx.shadowColor = this.color;
      ctx.shadowBlur = 6;
      ctx.beginPath();
      ctx.arc(0, 0, this.size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }
}

class ParticleSystem {
  constructor() {
    this.particles = [];
  }

  spawnDust(x, y, count, spreadX, upward) {
    for (let i = 0; i < count; i++) {
      const angle = upward
        ? (-Math.PI / 2) + (Math.random() - 0.5) * 1.2
        : (Math.random() - 0.5) * Math.PI;
      const speed = 80 + Math.random() * 120;
      this.particles.push(new Particle(
        x + (Math.random() - 0.5) * spreadX,
        y,
        Math.cos(angle) * speed,
        Math.sin(angle) * speed,
        2 + Math.random() * 2,
        COLORS.particles[0],
        0.3 + Math.random() * 0.2,
      ));
    }
  }

  spawnFragments(x, y) {
    const count = 10 + Math.floor(Math.random() * 3);
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 / count) * i + (Math.random() - 0.5) * 0.5;
      const speed = 150 + Math.random() * 300;
      this.particles.push(new Particle(
        x, y,
        Math.cos(angle) * speed,
        Math.sin(angle) * speed,
        5 + Math.random() * 8,
        COLORS.particles[i % COLORS.particles.length],
        0.6 + Math.random() * 0.3,
        true,
        Math.random() * Math.PI * 2,
        (Math.random() - 0.5) * 15,
      ));
    }
  }

  update(dt) {
    this.particles = this.particles.filter(p => p.update(dt));
  }

  draw(ctx) {
    this.particles.forEach(p => p.draw(ctx));
  }

  clear() {
    this.particles = [];
  }
}

// ─── Background Layers ────────────────────────────────────────────────────────
class Background {
  constructor() {
    this.layer1Offset = 0;
    this.layer2Offset = 0;
    this.layer3Offset = 0;
    this.shapes = Array.from({ length: 8 }, () => ({
      x: Math.random(),
      y: 0.1 + Math.random() * 0.6,
      rot: Math.random() * Math.PI * 2,
      rotSpeed: (Math.random() - 0.5) * 0.5,
      size: 20 + Math.random() * 40,
      type: Math.random() > 0.5 ? 'hex' : 'diamond',
    }));
    this.streaks = Array.from({ length: 20 }, () => ({
      x: Math.random(),
      y: Math.random() * 0.75,
      length: 20 + Math.random() * 60,
      speed: 0.3 + Math.random() * 0.4,
      color: Math.random() > 0.5 ? '#00ffff' : '#a855f7',
    }));
  }

  update(dt, speed, baseSpeed) {
    const ratio = speed / baseSpeed;
    this.layer1Offset += speed * 0.2 * dt;
    this.layer2Offset += speed * 0.5 * dt;
    this.layer3Offset += speed * 0.8 * dt;
    this.shapes.forEach(s => { s.rot += s.rotSpeed * dt; });
  }

  drawLayer1(ctx, W, H, groundY) {
    ctx.save();
    ctx.globalAlpha = 0.07;
    ctx.strokeStyle = '#00ffff';
    ctx.lineWidth = 1;
    const spacing = 60;
    const lines = Math.floor(H / spacing) + 2;
    for (let i = 0; i < lines; i++) {
      const y = (i * spacing - this.layer1Offset % spacing);
      if (y > groundY) continue;
      const fade = y / groundY;
      ctx.globalAlpha = 0.03 + fade * 0.05;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(W, y);
      ctx.stroke();
    }
    ctx.restore();
  }

  drawLayer2(ctx, W, H) {
    ctx.save();
    ctx.globalAlpha = 0.06;
    this.shapes.forEach(s => {
      const sx = ((s.x * W - this.layer2Offset * s.speed) % (W + 100) + W + 100) % (W + 100) - 50;
      const sy = s.y * H;
      ctx.save();
      ctx.translate(sx, sy);
      ctx.rotate(s.rot);
      ctx.strokeStyle = '#a855f7';
      ctx.lineWidth = 1;
      if (s.type === 'hex') {
        ctx.beginPath();
        for (let i = 0; i < 6; i++) {
          const a = (Math.PI / 3) * i;
          i === 0 ? ctx.moveTo(Math.cos(a) * s.size, Math.sin(a) * s.size)
                  : ctx.lineTo(Math.cos(a) * s.size, Math.sin(a) * s.size);
        }
        ctx.closePath();
        ctx.stroke();
      } else {
        ctx.beginPath();
        ctx.moveTo(0, -s.size); ctx.lineTo(s.size * 0.6, 0);
        ctx.lineTo(0, s.size); ctx.lineTo(-s.size * 0.6, 0);
        ctx.closePath();
        ctx.stroke();
      }
      ctx.restore();
    });
    ctx.restore();
  }

  drawLayer3(ctx, W, H, speed, baseSpeed) {
    const intensity = Math.min(1, (speed - baseSpeed) / (MAX_SPEED - baseSpeed));
    ctx.save();
    this.streaks.forEach((s, i) => {
      const x = ((s.x * W - this.layer3Offset * s.speed) % (W + 200) + W + 200) % (W + 200);
      const alpha = 0.08 + intensity * 0.25;
      const len = s.length * (1 + intensity * 2);
      ctx.globalAlpha = alpha;
      ctx.strokeStyle = s.color;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x, s.y * H);
      ctx.lineTo(x - len, s.y * H);
      ctx.stroke();
    });
    ctx.restore();
  }

  draw(ctx, W, H, groundY, speed, baseSpeed) {
    ctx.fillStyle = COLORS.bg;
    ctx.fillRect(0, 0, W, H);
    this.drawLayer1(ctx, W, H, groundY);
    this.drawLayer2(ctx, W, H);
    this.drawLayer3(ctx, W, H, speed, baseSpeed);

    // Vignette based on speed
    const intensity = Math.min(0.6, (speed - baseSpeed) / (MAX_SPEED - baseSpeed) * 0.6);
    if (intensity > 0) {
      const grad = ctx.createRadialGradient(W / 2, H / 2, H * 0.3, W / 2, H / 2, H * 0.8);
      grad.addColorStop(0, 'rgba(0,0,0,0)');
      grad.addColorStop(1, `rgba(0,0,0,${intensity})`);
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, W, H);
    }
  }
}

// ─── Player ───────────────────────────────────────────────────────────────────
class Player {
  constructor(x, groundY) {
    this.baseX = x;
    this.x = x;
    this.y = groundY - PLAYER_SIZE;
    this.vy = 0;
    this.groundY = groundY;
    this.onGround = true;
    this.jumpHeld = false;
    this.jumpCut = false;
    this.rotation = 0;
    this.scaleX = 1;
    this.scaleY = 1;
    this.landTimer = 0;
    this.innerRot = 0;
    this.trail = [];
    this.dead = false;
    this.justLanded = false;
  }

  get hitbox() {
    return {
      x: this.x - PLAYER_SIZE / 2 + HITBOX_SHRINK,
      y: this.y + HITBOX_SHRINK,
      w: PLAYER_SIZE - HITBOX_SHRINK * 2,
      h: PLAYER_SIZE - HITBOX_SHRINK * 2,
    };
  }

  jump(full) {
    if (!this.onGround || this.dead) return false;
    this.vy = JUMP_VELOCITY;
    this.onGround = false;
    this.jumpHeld = full;
    this.jumpCut = false;
    this.scaleX = 0.8;
    this.scaleY = 1.3;
    return true;
  }

  releaseJump() {
    if (!this.onGround && !this.jumpCut && this.vy < 0) {
      this.vy *= SHORT_HOP_CUTOFF;
      this.jumpCut = true;
    }
  }

  update(dt) {
    if (this.dead) return;

    // Store trail
    this.trail.unshift({ x: this.x, y: this.y, scaleX: this.scaleX, scaleY: this.scaleY });
    if (this.trail.length > 3) this.trail.pop();

    // Physics
    if (!this.onGround) {
      this.vy += GRAVITY * dt;
    }
    this.y += this.vy * dt;

    const groundTop = this.groundY - PLAYER_SIZE;
    if (this.y >= groundTop) {
      this.y = groundTop;
      if (this.vy > 0) {
        this.onGround = true;
        this.jumpHeld = false;
        this.jumpCut = false;
        this.justLanded = true;
        this.scaleX = 1.3;
        this.scaleY = 0.6;
        this.landTimer = 0.1;
      }
      this.vy = 0;
    }

    // Squash/stretch recovery
    if (this.landTimer > 0) {
      this.landTimer -= dt;
      if (this.landTimer <= 0) {
        this.scaleX = 1;
        this.scaleY = 1;
      }
    } else if (!this.onGround) {
      // In air: stretch based on velocity
      const t = Math.max(-1, Math.min(1, this.vy / 900));
      if (t < 0) {
        // Rising
        this.scaleX = 1 - Math.abs(t) * 0.2;
        this.scaleY = 1 + Math.abs(t) * 0.3;
      } else {
        // Falling
        this.scaleX = 1 + t * 0.2;
        this.scaleY = 1 - t * 0.2;
      }
    } else if (this.landTimer <= 0) {
      this.scaleX += (1 - this.scaleX) * dt * 12;
      this.scaleY += (1 - this.scaleY) * dt * 12;
    }

    // Rotation
    this.rotation += (Math.PI * 2) * dt;
    this.innerRot -= (Math.PI * 2) * dt;
  }

  draw(ctx) {
    if (this.dead) return;
    const cx = this.x + PLAYER_SIZE / 2;
    const cy = this.y + PLAYER_SIZE / 2;

    // Motion trail
    const opacities = [0.3, 0.15, 0.05];
    this.trail.forEach((t, i) => {
      if (i >= opacities.length) return;
      ctx.save();
      ctx.globalAlpha = opacities[i];
      ctx.translate(t.x + PLAYER_SIZE / 2, t.y + PLAYER_SIZE / 2);
      ctx.rotate(this.rotation - (i + 1) * 0.3);
      ctx.scale(t.scaleX, t.scaleY);
      ctx.strokeStyle = COLORS.playerFill;
      ctx.lineWidth = 2;
      ctx.shadowColor = COLORS.playerFill;
      ctx.shadowBlur = 10;
      ctx.strokeRect(-PLAYER_SIZE / 2, -PLAYER_SIZE / 2, PLAYER_SIZE, PLAYER_SIZE);
      ctx.restore();
    });

    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(this.rotation);
    ctx.scale(this.scaleX, this.scaleY);

    ctx.shadowColor = COLORS.playerFill;
    ctx.shadowBlur = 20;

    // Outer square
    ctx.strokeStyle = COLORS.playerFill;
    ctx.lineWidth = 3;
    ctx.strokeRect(-PLAYER_SIZE / 2, -PLAYER_SIZE / 2, PLAYER_SIZE, PLAYER_SIZE);

    // Inner rotated square (GD detail)
    ctx.save();
    ctx.rotate(this.innerRot + Math.PI / 4);
    const innerSize = PLAYER_SIZE * 0.35;
    ctx.strokeStyle = COLORS.playerFill;
    ctx.lineWidth = 1.5;
    ctx.strokeRect(-innerSize / 2, -innerSize / 2, innerSize, innerSize);
    ctx.restore();

    // Eyes
    const eyeOffsetX = 6;
    const eyeOffsetY = this.vy < -100 ? -4 : this.vy > 100 ? 4 : 0;
    ctx.fillStyle = '#ffffff';
    ctx.shadowBlur = 0;
    ctx.beginPath();
    ctx.arc(-eyeOffsetX / 2 - 3, eyeOffsetY, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(eyeOffsetX / 2 + 3, eyeOffsetY, 3, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }
}

// ─── Hazards ──────────────────────────────────────────────────────────────────
class Spike {
  constructor(x, groundY) {
    this.x = x;
    this.groundY = groundY;
    this.width = 30;
    this.height = 30;
    this.pulseTimer = 0;
    this.scale = 1;
  }

  get hitbox() {
    const cx = this.x + this.width / 2;
    const shrink = 4;
    return {
      x: cx - this.width / 2 + shrink,
      y: this.groundY - this.height + shrink,
      w: this.width - shrink * 2,
      h: this.height - shrink,
    };
  }

  update(dt, speed) {
    this.x -= speed * dt;
    this.pulseTimer += dt;
    this.scale = 1 + Math.sin(this.pulseTimer * Math.PI * 2 / 0.8) * 0.025;
  }

  draw(ctx, groundY) {
    const cx = this.x + this.width / 2;
    const base = groundY;
    ctx.save();
    ctx.translate(cx, base);
    ctx.scale(this.scale, this.scale);
    ctx.shadowColor = COLORS.spikeFill;
    ctx.shadowBlur = 12;
    ctx.fillStyle = COLORS.spikeFill;
    ctx.beginPath();
    ctx.moveTo(0, -this.height);
    ctx.lineTo(this.width / 2, 0);
    ctx.lineTo(-this.width / 2, 0);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  isOffscreen() { return this.x + this.width < 0; }
}

class Saw {
  constructor(x, groundY, floating = false) {
    this.x = x;
    this.groundY = groundY;
    this.radius = 28;
    this.floating = floating;
    this.y = floating ? groundY - 120 : groundY - this.radius;
    this.rotation = 0;
  }

  get hitbox() {
    const shrink = 6;
    return {
      x: this.x - this.radius + shrink,
      y: this.y - this.radius + shrink,
      w: (this.radius - shrink) * 2,
      h: (this.radius - shrink) * 2,
    };
  }

  update(dt, speed) {
    this.x -= speed * dt;
    this.rotation += Math.PI * 2 * dt;
  }

  draw(ctx, groundY) {
    const r = this.radius;
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.rotation);
    ctx.shadowColor = COLORS.sawFill;
    ctx.shadowBlur = 16;
    ctx.fillStyle = COLORS.sawFill;

    // Circle body
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.65, 0, Math.PI * 2);
    ctx.fill();

    // Teeth
    const teeth = 8;
    ctx.beginPath();
    for (let i = 0; i < teeth; i++) {
      const a = (Math.PI * 2 / teeth) * i;
      const a1 = a - 0.2;
      const a2 = a + 0.2;
      ctx.moveTo(Math.cos(a1) * r * 0.65, Math.sin(a1) * r * 0.65);
      ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
      ctx.lineTo(Math.cos(a2) * r * 0.65, Math.sin(a2) * r * 0.65);
    }
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // Pillar for floating saws
    if (this.floating) {
      ctx.save();
      ctx.fillStyle = '#1a1a2e';
      ctx.strokeStyle = '#00ffff';
      ctx.lineWidth = 1;
      ctx.globalAlpha = 0.6;
      const pillarX = this.x - 4;
      const pillarTop = this.y + r;
      ctx.fillRect(pillarX, pillarTop, 8, groundY - pillarTop);
      ctx.strokeRect(pillarX, pillarTop, 8, groundY - pillarTop);
      ctx.restore();
    }
  }

  isOffscreen() { return this.x + this.radius < 0; }
}

// ─── Pattern Library ──────────────────────────────────────────────────────────
function buildChunks(startX, groundY, score) {
  const hazards = [];
  const GAP = 60;
  const type = pickChunkType(score);
  let x = startX + GAP;

  switch (type) {
    case 'single_spike':
      hazards.push(new Spike(x, groundY));
      break;
    case 'double_spike':
      hazards.push(new Spike(x, groundY));
      hazards.push(new Spike(x + 32, groundY));
      break;
    case 'triple_spike':
      for (let i = 0; i < 3; i++) hazards.push(new Spike(x + i * 31, groundY));
      break;
    case 'spike_gap_spike':
      hazards.push(new Spike(x, groundY));
      hazards.push(new Spike(x + 80, groundY));
      break;
    case 'floating_saw':
      hazards.push(new Saw(x + 20, groundY, true));
      break;
    case 'ground_saw':
      hazards.push(new Saw(x + 10, groundY, false));
      break;
    case 'saw_spike_combo':
      hazards.push(new Saw(x + 10, groundY, false));
      hazards.push(new Spike(x + 90, groundY));
      break;
    case 'spike_saw_spike':
      hazards.push(new Spike(x, groundY));
      hazards.push(new Saw(x + 70, groundY, false));
      hazards.push(new Spike(x + 160, groundY));
      break;
    case 'staircase_spikes':
      hazards.push(new Spike(x, groundY));
      hazards.push(new Spike(x + 35, groundY));
      hazards.push(new Spike(x + 70, groundY));
      break;
    case 'double_saw_gap':
      hazards.push(new Saw(x + 10, groundY, true));
      hazards.push(new Saw(x + 110, groundY, true));
      break;
    case 'safe_breather':
      break; // empty chunk
    case 'speed_blitz':
      for (let i = 0; i < 4; i++) hazards.push(new Spike(x + i * 60, groundY));
      break;
  }

  const chunkWidths = {
    single_spike: 120, double_spike: 160, triple_spike: 180,
    spike_gap_spike: 200, floating_saw: 160, ground_saw: 150,
    saw_spike_combo: 220, spike_saw_spike: 300, staircase_spikes: 200,
    double_saw_gap: 260, safe_breather: 350, speed_blitz: 380,
  };

  return { hazards, width: (chunkWidths[type] || 200) + GAP };
}

function pickChunkType(score) {
  let pool;
  if (score < 200) {
    pool = ['single_spike', 'double_spike', 'spike_gap_spike', 'floating_saw', 'ground_saw', 'safe_breather'];
  } else if (score < 500) {
    pool = ['single_spike', 'double_spike', 'triple_spike', 'spike_gap_spike',
            'floating_saw', 'ground_saw', 'saw_spike_combo', 'spike_saw_spike', 'safe_breather'];
  } else {
    pool = ['single_spike', 'double_spike', 'triple_spike', 'spike_gap_spike',
            'floating_saw', 'ground_saw', 'saw_spike_combo', 'spike_saw_spike',
            'staircase_spikes', 'double_saw_gap', 'safe_breather', 'speed_blitz'];
  }
  return pool[Math.floor(Math.random() * pool.length)];
}

// ─── Ground ───────────────────────────────────────────────────────────────────
function drawGround(ctx, W, H, groundY) {
  ctx.fillStyle = COLORS.ground;
  ctx.fillRect(0, groundY, W, H - groundY);

  // Grid texture
  ctx.save();
  ctx.globalAlpha = 0.15;
  ctx.strokeStyle = '#00ffff';
  ctx.lineWidth = 0.5;
  const dotSpacing = 20;
  for (let gx = 0; gx < W; gx += dotSpacing) {
    for (let gy = groundY; gy < H; gy += dotSpacing) {
      ctx.beginPath();
      ctx.arc(gx, gy, 0.8, 0, Math.PI * 2);
      ctx.stroke();
    }
  }
  ctx.restore();

  // Top edge
  ctx.strokeStyle = COLORS.groundLine;
  ctx.lineWidth = 2;
  ctx.shadowColor = COLORS.groundLine;
  ctx.shadowBlur = 8;
  ctx.beginPath();
  ctx.moveTo(0, groundY);
  ctx.lineTo(W, groundY);
  ctx.stroke();
  ctx.shadowBlur = 0;
}

// ─── Game ─────────────────────────────────────────────────────────────────────
class Game {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.W = canvas.width;
    this.H = canvas.height;
    this.groundY = this.H * GROUND_Y_RATIO;

    this.state = 'start'; // 'start' | 'playing' | 'dying' | 'dead'
    this.score = 0;
    this.highScore = parseInt(localStorage.getItem('neonCubeHighScore') || '0');
    this.distanceTraveled = 0;

    this.speed = BASE_SPEED;
    this.speedTimer = 0;

    this.player = new Player(this.W * PLAYER_X_RATIO, this.groundY);
    this.hazards = [];
    this.particles = new ParticleSystem();
    this.background = new Background();
    this.audio = new AudioEngine();

    this.chunkX = this.W + 200;
    this.nextChunkAt = this.W + 200;

    this.deathTimer = 0;
    this.deathPhase = 0; // 0=freeze 1=flash 2=explode 3=shake 4=done
    this.flashAlpha = 0;
    this.shakeX = 0;
    this.shakeY = 0;
    this.shakeTimer = 0;

    this.lastMilestone = 0;
    this.newBest = false;
    this.newBestTimer = 0;
    this.pulseTimer = 0;

    this.keys = { space: false };
    this.spaceWasDown = false;
    this.holdStartTime = null;

    this._bindInput();
    this._loop = this._loop.bind(this);
    this.lastTime = null;
    requestAnimationFrame(this._loop);
  }

  resize(W, H) {
    this.W = W;
    this.H = H;
    this.groundY = H * GROUND_Y_RATIO;
    this.player.groundY = this.groundY;
    if (this.state === 'start') {
      this.player.y = this.groundY - PLAYER_SIZE;
    }
  }

  _bindInput() {
    document.addEventListener('keydown', e => {
      if (e.code === 'Space' && !e.repeat) {
        e.preventDefault();
        this._onJumpDown();
      }
    });
    document.addEventListener('keyup', e => {
      if (e.code === 'Space') {
        this._onJumpUp();
      }
    });
    this.canvas.addEventListener('pointerdown', e => {
      e.preventDefault();
      this._onJumpDown();
    });
    this.canvas.addEventListener('pointerup', () => this._onJumpUp());
  }

  _onJumpDown() {
    if (this.state === 'start') {
      this._startGame();
      return;
    }
    if (this.state === 'dead') {
      this._restartGame();
      return;
    }
    if (this.state === 'playing') {
      this.holdStartTime = performance.now();
      const jumped = this.player.jump(true);
      if (jumped) {
        this.audio.playJump(true);
        this.particles.spawnDust(this.player.x + PLAYER_SIZE / 2, this.player.y + PLAYER_SIZE, 5, 20, true);
      }
    }
  }

  _onJumpUp() {
    if (this.state === 'playing') {
      const heldMs = this.holdStartTime ? performance.now() - this.holdStartTime : 999;
      if (heldMs < 120) {
        // Short hop
        this.player.releaseJump();
        // re-play short jump sound if still in early flight
        this.audio.playJump(false);
      }
      this.holdStartTime = null;
    }
  }

  _startGame() {
    this.audio.init();
    this.state = 'playing';
    this.score = 0;
    this.distanceTraveled = 0;
    this.speed = BASE_SPEED;
    this.speedTimer = 0;
    this.lastMilestone = 0;
    this.newBest = false;
    this.hazards = [];
    this.particles.clear();
    this.player = new Player(this.W * PLAYER_X_RATIO, this.groundY);
    this.chunkX = this.W + 100;
    this.deathPhase = 0;
    this.flashAlpha = 0;
    this.shakeTimer = 0;
    this.audio.startMusic();
  }

  _restartGame() {
    this._startGame();
  }

  _die() {
    if (this.state !== 'playing') return;
    this.state = 'dying';
    this.deathPhase = 0;
    this.deathTimer = 0;
    this.audio.stopMusic();
    this.audio.playDeath();

    if (this.score > this.highScore) {
      this.highScore = this.score;
      localStorage.setItem('neonCubeHighScore', this.highScore);
      this.newBest = true;
    }
  }

  _updateDying(dt) {
    this.deathTimer += dt;

    if (this.deathPhase === 0 && this.deathTimer >= 0.08) {
      // Freeze done → flash
      this.deathPhase = 1;
      this.deathTimer = 0;
      this.flashAlpha = 1;
      // Spawn fragments
      this.particles.spawnFragments(
        this.player.x + PLAYER_SIZE / 2,
        this.player.y + PLAYER_SIZE / 2,
      );
      this.player.dead = true;
    }

    if (this.deathPhase === 1) {
      this.flashAlpha = Math.max(0, 1 - this.deathTimer / 0.06);
      if (this.deathTimer >= 0.06) {
        this.deathPhase = 2;
        this.deathTimer = 0;
      }
    }

    if (this.deathPhase === 2) {
      this.particles.update(dt);
      if (this.deathTimer >= 0.3) {
        this.deathPhase = 3;
        this.deathTimer = 0;
        this.shakeTimer = 0.3;
      }
    }

    if (this.deathPhase === 3) {
      this.particles.update(dt);
      this.shakeTimer -= dt;
      if (this.shakeTimer <= 0) {
        this.deathPhase = 4;
        this.deathTimer = 0;
        this.shakeTimer = 0;
        this.shakeX = 0;
        this.shakeY = 0;
      } else {
        this.shakeX = (Math.random() - 0.5) * 12;
        this.shakeY = (Math.random() - 0.5) * 12;
      }
    }

    if (this.deathPhase === 4 && this.deathTimer >= 0.3) {
      this.state = 'dead';
      this.newBestTimer = 2;
    }
  }

  _update(dt) {
    if (this.state === 'start') {
      this.background.update(dt, BASE_SPEED * 0.5, BASE_SPEED);
      this.pulseTimer += dt;
      // Idle bob
      this.player.y = (this.groundY - PLAYER_SIZE) + Math.sin(this.pulseTimer * 2) * 4;
      this.player.rotation += dt * 1.5;
      return;
    }

    if (this.state === 'dying') {
      this._updateDying(dt);
      return;
    }

    if (this.state === 'dead') {
      this.particles.update(dt);
      this.pulseTimer += dt;
      if (this.newBestTimer > 0) this.newBestTimer -= dt;
      return;
    }

    // Playing
    this.speedTimer += dt;
    if (this.speedTimer >= SPEED_INTERVAL) {
      this.speedTimer -= SPEED_INTERVAL;
      this.speed = Math.min(MAX_SPEED, this.speed + SPEED_INCREMENT);
      // Sync music BPM
      const speedRatio = (this.speed - BASE_SPEED) / (MAX_SPEED - BASE_SPEED);
      this.audio.setBPM(140 + speedRatio * 40);
    }

    this.distanceTraveled += this.speed * dt;
    const newScore = Math.floor(this.distanceTraveled / 10);
    if (newScore > this.score) {
      this.score = newScore;
      if (Math.floor(this.score / 100) > Math.floor(this.lastMilestone / 100)) {
        this.audio.playMilestone();
        this.lastMilestone = this.score;
      }
    }

    this.background.update(dt, this.speed, BASE_SPEED);
    this.player.update(dt);

    // Landing dust
    if (this.player.justLanded) {
      this.player.justLanded = false;
      this.audio.playLand();
      this.particles.spawnDust(this.player.x + PLAYER_SIZE / 2, this.player.y + PLAYER_SIZE, 4, 30, false);
    }

    // Spawn chunks
    while (this.chunkX < this.W + 600) {
      const chunk = buildChunks(this.chunkX, this.groundY, this.score);
      chunk.hazards.forEach(h => this.hazards.push(h));
      this.chunkX += chunk.width;
      // Tighten gaps after score 300
      if (this.score > 300) this.chunkX -= 20;
    }

    // Update hazards
    this.hazards.forEach(h => h.update(dt, this.speed));
    this.hazards = this.hazards.filter(h => !h.isOffscreen());
    this.chunkX -= this.speed * dt;

    this.particles.update(dt);
    this.pulseTimer += dt;

    // Collision
    const pb = this.player.hitbox;
    for (const h of this.hazards) {
      const hb = h.hitbox;
      if (pb.x < hb.x + hb.w && pb.x + pb.w > hb.x &&
          pb.y < hb.y + hb.h && pb.y + pb.h > hb.y) {
        this._die();
        return;
      }
    }
  }

  _draw() {
    const { ctx, W, H, groundY } = this;

    ctx.save();
    if (this.shakeTimer > 0) {
      ctx.translate(this.shakeX, this.shakeY);
    }

    this.background.draw(ctx, W, H, groundY, this.speed, BASE_SPEED);
    drawGround(ctx, W, H, groundY);

    this.hazards.forEach(h => h.draw(ctx, groundY));
    this.player.draw(ctx);
    this.particles.draw(ctx);

    ctx.restore();

    // Flash overlay
    if (this.flashAlpha > 0) {
      ctx.save();
      ctx.globalAlpha = this.flashAlpha;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, W, H);
      ctx.restore();
    }

    if (this.state === 'start') this._drawStartScreen();
    else if (this.state === 'playing') this._drawHUD();
    else if (this.state === 'dying') {
      this._drawHUD();
      this.particles.draw(ctx);
    }
    else if (this.state === 'dead') this._drawGameOver();
  }

  _drawHUD() {
    const { ctx, W } = this;
    ctx.save();
    ctx.font = 'bold 20px Orbitron, monospace';
    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = '#ffffff';
    ctx.shadowBlur = 6;
    ctx.fillText(`${this.score}`, 16, 36);

    const speedMult = (this.speed / BASE_SPEED).toFixed(1);
    ctx.font = '14px Orbitron, monospace';
    ctx.fillStyle = COLORS.groundLine;
    ctx.shadowColor = COLORS.groundLine;
    ctx.textAlign = 'right';
    ctx.fillText(`×${speedMult}`, W - 60, 36);
    ctx.restore();
  }

  _drawStartScreen() {
    const { ctx, W, H } = this;
    ctx.save();

    // Title
    ctx.textAlign = 'center';
    ctx.font = 'bold 72px Orbitron, monospace';
    ctx.fillStyle = COLORS.groundLine;
    ctx.shadowColor = COLORS.groundLine;
    ctx.shadowBlur = 30;
    ctx.fillText('NEON CUBE', W / 2, H / 2 - 60);

    ctx.font = 'bold 36px Orbitron, monospace';
    ctx.fillStyle = '#a855f7';
    ctx.shadowColor = '#a855f7';
    ctx.shadowBlur = 20;
    ctx.fillText('QUEST', W / 2, H / 2 - 10);

    ctx.font = '14px Orbitron, monospace';
    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    ctx.shadowBlur = 0;
    ctx.fillText('HOLD SPACE to jump  —  TAP for short hop', W / 2, H / 2 + 40);

    // Pulsing prompt
    const pulse = 0.5 + 0.5 * Math.sin(this.pulseTimer * 3);
    ctx.font = 'bold 16px Orbitron, monospace';
    ctx.fillStyle = `rgba(255,255,255,${0.4 + pulse * 0.6})`;
    ctx.shadowColor = '#ffffff';
    ctx.shadowBlur = pulse * 10;
    ctx.fillText('PRESS SPACE TO START', W / 2, H / 2 + 80);

    if (this.highScore > 0) {
      ctx.font = '14px Orbitron, monospace';
      ctx.fillStyle = '#ffcc00';
      ctx.shadowColor = '#ffcc00';
      ctx.shadowBlur = 8;
      ctx.fillText(`BEST: ${this.highScore}`, W / 2, H / 2 + 115);
    }

    ctx.restore();
  }

  _drawGameOver() {
    const { ctx, W, H } = this;
    ctx.save();

    // Dark overlay
    ctx.fillStyle = 'rgba(0,0,0,0.65)';
    ctx.fillRect(0, 0, W, H);

    ctx.textAlign = 'center';

    ctx.font = 'bold 64px Orbitron, monospace';
    ctx.fillStyle = COLORS.spikeFill;
    ctx.shadowColor = COLORS.spikeFill;
    ctx.shadowBlur = 30;
    ctx.fillText('GAME OVER', W / 2, H / 2 - 70);

    ctx.font = 'bold 24px Orbitron, monospace';
    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = '#ffffff';
    ctx.shadowBlur = 8;
    ctx.fillText(`SCORE: ${this.score}`, W / 2, H / 2 - 10);

    if (this.newBest) {
      const pulse = 0.5 + 0.5 * Math.sin(this.pulseTimer * 5);
      ctx.font = 'bold 18px Orbitron, monospace';
      ctx.fillStyle = `rgba(255,204,0,${0.7 + pulse * 0.3})`;
      ctx.shadowColor = '#ffcc00';
      ctx.shadowBlur = 10 + pulse * 15;
      ctx.fillText(`★ NEW BEST! ★`, W / 2, H / 2 + 25);
      ctx.fillStyle = '#ffcc00';
      ctx.shadowBlur = 6;
      ctx.fillText(`BEST: ${this.highScore}`, W / 2, H / 2 + 55);
    } else {
      ctx.font = '16px Orbitron, monospace';
      ctx.fillStyle = '#ffcc00';
      ctx.shadowColor = '#ffcc00';
      ctx.shadowBlur = 6;
      ctx.fillText(`BEST: ${this.highScore}`, W / 2, H / 2 + 30);
    }

    const pulse2 = 0.5 + 0.5 * Math.sin(this.pulseTimer * 3);
    ctx.font = 'bold 16px Orbitron, monospace';
    ctx.fillStyle = `rgba(255,255,255,${0.4 + pulse2 * 0.6})`;
    ctx.shadowBlur = pulse2 * 8;
    ctx.fillText('PRESS SPACE TO RETRY', W / 2, H / 2 + (this.newBest ? 95 : 75));

    ctx.restore();
  }

  _loop(ts) {
    if (this.lastTime === null) this.lastTime = ts;
    const dt = Math.min((ts - this.lastTime) / 1000, 0.05);
    this.lastTime = ts;

    this._update(dt);
    this._draw();

    requestAnimationFrame(this._loop);
  }
}

// ─── Init ─────────────────────────────────────────────────────────────────────
let game;

window.addEventListener('load', () => {
  const canvas = document.getElementById('gameCanvas');
  function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    if (game) game.resize(canvas.width, canvas.height);
  }
  resize();
  window.addEventListener('resize', resize);
  game = new Game(canvas);
});

// Mute button wired up after DOM is ready — see index.html
window.toggleMute = function () {
  if (!game) return;
  game.audio.init();
  const muted = game.audio.toggleMute();
  document.getElementById('muteBtn').textContent = muted ? '🔇' : '🔊';
};
