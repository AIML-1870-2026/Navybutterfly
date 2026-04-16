# Neon Cube Quest — Spec

## Overview

A Geometry Dash-inspired endless runner built as a single HTML file. The player controls a glowing neon cube that auto-runs across a dark stage, jumping over spikes and dodging spinning saw blades. Speed increases over time, pushing the player's reaction limits. Death triggers a dramatic cube-shatter explosion. The game is juicy, fast, and punishing in the best GD tradition.

---

## File Structure

- `index.html` — markup and canvas element, imports CSS and JS
- `style.css` — all visual styling, fonts, UI screens, HUD
- `script.js` — all game logic, canvas rendering, audio engine

---

## Visual Design

### Theme
Dark neon — Geometry Dash faithful. Black background, electric neon accents.

### Color Palette (CSS variables)
```css
--bg: #0a0a0f
--ground: #1a1a2e
--ground-line: #00ffff
--player-fill: #00ffff
--player-glow: #00ffff88
--spike-fill: #ff2d55
--spike-glow: #ff2d5566
--saw-fill: #ffcc00
--saw-glow: #ffcc0066
--particle-colors: #00ffff, #ff2d55, #ffcc00, #a855f7, #ffffff
--text-primary: #ffffff
--text-accent: #00ffff
--hud-bg: rgba(0,0,0,0.5)
```

### Typography
- Font: `'Orbitron'` (Google Fonts) for all UI text — geometric, sci-fi, GD-appropriate
- HUD score: bold Orbitron, top-left
- Start/game over screens: large Orbitron display text

### Background & Parallax
Three parallax layers scrolling at different speeds (slowest to fastest):
1. **Layer 1 (slowest, 0.2x)** — distant grid lines (faint cyan horizontal lines fading into distance, perspective effect)
2. **Layer 2 (0.5x)** — mid-ground geometric shapes: faint rotating hexagons and diamonds drifting across screen
3. **Layer 3 (0.8x)** — near-ground: thin vertical neon streaks (speed lines) in cyan and purple

Background always pure `#0a0a0f` black.

### Ground
- Solid platform line at y=75% of canvas height
- Top edge: bright cyan line (`--ground-line`), 2px
- Body: dark `--ground` color
- Subtle grid texture on ground surface (dotted pattern)

---

## Player (The Cube)

### Appearance
- 40×40px square
- Fill: transparent center with bright cyan border (3px stroke) + inner glow
- Small "inner square" rotated 45° inside (GD logo detail), same cyan
- Eyes: two small white dot "eyes" that shift direction based on velocity (look up when rising, look forward when running, look down when falling)
- Glow effect: box-shadow / canvas shadow blur in `--player-glow`

### Animation States
| State | Animation |
|-------|-----------|
| Running | Cube rotates continuously (360°/second), inner square counter-rotates |
| Rising (jump) | Squash → stretch vertically (taller, narrower) |
| Falling | Stretch → squash vertically (shorter, wider) |
| Landing | Quick squash on impact (0.6x height, 1.3x width), bounce back in 100ms |
| Dead | Cube shatters into 8–12 square fragments flying outward (see Death section) |

### Physics
- Gravity: constant downward acceleration (~1800 px/s²)
- Jump: single tap = short hop (~180px height), hold = full jump (~300px height)
  - Detect hold vs tap: if SPACE released before apex, cut upward velocity in half (variable jump height, GD mechanic)
- Ground collision: land on top of ground platform only
- No double jump (faithful to base GD)
- Player X position: fixed at 20% from left edge

---

## Controls

| Input | Action |
|-------|--------|
| SPACE (tap) | Short hop |
| SPACE (hold) | Full jump |
| Click / tap (mobile) | Same as SPACE |

---

## Hazards

### Spike
- Triangle shape, pointing upward, 30px wide × 30px tall
- Fill: `--spike-fill` (red/pink)
- Glow: soft red halo (canvas shadow)
- Animated: subtle pulse (scale 1.0 → 1.05 → 1.0, 800ms loop) to feel alive
- Placed on ground

### Saw Blade
- Circle, 28px radius
- 8 triangular "teeth" around the perimeter (drawn with canvas arc + triangles)
- Fill: `--saw-fill` (yellow)
- Glow: yellow halo
- Continuously spins (360°/second clockwise)
- Can be placed on ground OR floating mid-air (on a short pillar drawn below it)

### Collision Detection
- AABB with ~4px shrink on all sides (forgiving hitbox, GD-style)
- Any contact with spike or saw → death

---

## Pattern Library (Obstacle Chunks)

Each chunk is a pre-designed sequence of hazards. The game randomly selects chunks from this library and chains them end-to-end. Each chunk starts and ends with enough clear space for safe transition.

| # | Name | Description |
|---|------|-------------|
| 1 | `single_spike` | One spike, medium gap before and after |
| 2 | `double_spike` | Two spikes side by side |
| 3 | `triple_spike` | Three spikes in a row (tight) |
| 4 | `spike_gap_spike` | Spike, small gap, spike (rhythm timing) |
| 5 | `floating_saw` | Single saw floating at jump-height, must jump under or over |
| 6 | `ground_saw` | Saw on ground — must jump over it |
| 7 | `saw_spike_combo` | Ground saw followed by spike (two quick jumps) |
| 8 | `spike_saw_spike` | Spike → saw → spike (full rhythm chunk) |
| 9 | `staircase_spikes` | Three spikes with slight vertical offset (ascending stagger on a step platform) |
| 10 | `double_saw_gap` | Two floating saws with a gap between, player must thread through or time carefully |
| 11 | `safe_breather` | Long clear stretch (reward after hard section) |
| 12 | `speed_blitz` | Four single spikes spaced for rapid-fire jumping (appears only after score 500+) |

### Difficulty Gating
- Score 0–200: chunks 1–5, 11 only (easy set)
- Score 200–500: chunks 1–8, 11
- Score 500+: full library including 12

---

## Juice Effects

### Jump
- Squash → stretch on liftoff (cubic easing)
- Small "launch dust" particle burst at feet (4–6 cyan particles, fan upward-outward)

### Landing
- Squash on landing frame (100ms recovery)
- "Dust puff" particles at feet (4 particles, spread horizontally)

### Running
- Cube rotates continuously — feels like rolling momentum
- Subtle motion trail: 3 ghost copies behind player at decreasing opacity (0.3, 0.15, 0.05)

### Screen Shake
- On death: 400ms shake (random offset ±6px each frame)

### Death — Cube Shatter
1. Freeze frame: 80ms pause (world stops, cube visible)
2. Screen flash: white overlay fades in 60ms then out
3. Cube explodes: 10 square fragments (5–12px each) fly outward in random directions with initial velocity, rotate as they travel, fade out over 600ms
4. Fragment colors: cycle through `--particle-colors`
5. After explosion: brief screen shake (300ms)
6. After 900ms total: transition to Game Over screen

### Speed Indicator
- As game speed increases, background streaks (layer 3) become more intense (faster, brighter)
- A subtle vignette darkens at the edges as speed increases (tension effect)

---

## Difficulty Progression

- Base scroll speed: **400px/s**
- Speed increases every 10 seconds by **15px/s**
- Maximum speed cap: **900px/s**
- Chunk spawn frequency also subtly tightens (gaps shrink slightly) after score 300

---

## Scoring

- Score = distance traveled (pixels / 10, displayed as integer)
- Score displayed top-left in Orbitron font
- High score persisted via `localStorage` key `"neonCubeHighScore"`
- On game over: show current score and high score
- New high score: flash "NEW BEST!" in gold/yellow with brief glow pulse

---

## UI Screens

### Start Screen
- Title: **"NEON CUBE"** — large Orbitron, cyan, glow effect
- Subtitle: "QUEST" below in smaller text, purple
- Animated background (parallax running, cube idle bobbing)
- Instructions: "HOLD SPACE to jump — TAP for short hop"
- "PRESS SPACE TO START" — pulsing text
- Show high score if exists: "BEST: [score]"

### HUD (in-game)
- Top-left: current score (Orbitron, white, small)
- Top-right: current speed indicator ("×1.0" → "×2.2" etc., cyan)
- Minimal — doesn't clutter the action

### Game Over Screen
- "GAME OVER" — large Orbitron, red/pink
- Score: "SCORE: [n]"
- High score: "BEST: [n]" (gold if new best, with "NEW BEST!" label)
- "PRESS SPACE TO RETRY" — pulsing
- Background: frozen last-frame state with dark overlay

---

## Audio

All audio generated procedurally via Web Audio API — no external files required.

### Background Music — Procedural Chiptune Loop
A looping chiptune track built from oscillators that plays during gameplay:

**Structure:** 8-bar loop, ~140 BPM (energetic, GD-paced)
- **Melody** (square wave oscillator): A repeating 16-note melodic phrase in A minor pentatonic scale. Notes: A4, C5, D5, E5, G5 and their octave variants. Bright, driving feel.
- **Bass** (sawtooth wave oscillator, -2 octaves): Root notes that follow the chord progression. A minor → F major → C major → E major (4 bars each, repeating).
- **Arpeggio** (triangle wave oscillator): Rapid 16th-note arpeggios on the chord tones. Fills in the high-frequency texture.
- **Kick drum** (sine wave, pitch-dropped): Hits on beats 1 and 3. Short sine burst from 150Hz → 40Hz over 80ms.
- **Snare** (white noise burst): Hits on beats 2 and 4. White noise envelope, 60ms decay.
- **Hi-hat** (filtered white noise): 8th note pattern, very short decay (20ms), low gain.

**Speed Sync:** As game speed increases, music BPM increases proportionally (mapped from 140 BPM at base speed → 180 BPM at max speed). This is the signature GD effect — the music and world accelerate together.

**Implementation approach:** Use a `AudioContext` with a `ScriptProcessor` or scheduled `OscillatorNode` events. Build a `Sequencer` class that holds the note pattern arrays and fires scheduled notes using `audioCtx.currentTime`. Loop the 8-bar pattern indefinitely.

### Sound Effects

| Event | Sound |
|-------|-------|
| Jump (short) | Quick ascending sine tone (~80ms, 300→600Hz) |
| Jump (full) | Slightly longer ascending tone (~120ms, 250→700Hz) |
| Landing | Short thud (low sine, 60ms, 150→80Hz) |
| Death | Descending crash tone + noise burst (200ms) |
| Score milestone (every 100pts) | Brief ascending chime (3 notes, 80ms each) |

### Volume Levels
- Music: 0.25 gain (background, not overpowering)
- SFX: 0.4 gain (punchy, satisfying)
- Mute toggle button in HUD (top-right corner, 🔊/🔇 icon)

---

## Technical Notes

- Three files: `index.html`, `style.css`, `script.js` — linked normally
- Canvas-based rendering (HTML5 Canvas 2D API) in `script.js`
- Target 60fps via `requestAnimationFrame`
- Canvas size: full window, responsive to resize
- Google Fonts import for Orbitron in `index.html` `<head>`
- `localStorage` for high score only
- No external libraries or dependencies
- Web Audio API `AudioContext` initialized on first user gesture (browser autoplay policy)

---

## Stretch Goals (Optional)

- Combo multiplier for near-misses (pass within 5px of hazard without dying)
- Background color slowly shifts hue over time (long-session visual variety)
- "Practice mode" toggle that shows upcoming chunk type as a ghost preview
