# Snake Quest - Enhanced Snake Game

## Project Overview
An enhanced, cute cartoon-style Snake game built with HTML5 Canvas, CSS, and JavaScript. The game features a chunky, rounded art style with bold outlines, soft pastel colors, and a handful of gameplay enhancements that add strategic depth and replayability. The snake has a little cartoon face and leaves sparkly particle trails as it moves.

## Target User
A visually charming, fun-to-play Snake game that feels polished and alive. Simple to pick up, but the enhancements (bridges, power-ups, streaks) add enough depth to keep it interesting.

## Technical Requirements

### File Structure
```
snake-quest/
├── index.html       (page structure and canvas)
├── styles.css       (all styling — background, UI, layout)
├── script.js        (all game logic, rendering, input)
└── README.md        (project documentation)
```

### Deployment
- Deploys to GitHub Pages via the NavyButterfly kingdom repo and Royal Decree (CLAUDE.md inheritance)
- All files clean and self-contained — no external dependencies beyond standard HTML5 Canvas

---

## Visual Design & Art Style

### Color Palette
- **Background / Grid**: Soft cream (#FFF8F0) with very faint grid lines in a warm beige (#F0E6D8)
- **Snake Body**: Sage green (#7EC8A0) with a slightly darker green outline (#4A9A6E) — each segment is a rounded square with a bold dark outline
- **Snake Head**: Same sage green, slightly larger than body segments, with two simple white dot eyes and a tiny brown dot mouth (a little smile)
- **Food (normal)**: Bright cherry red (#E8495A) with a golden highlight, outlined in dark brown (#5C3D2E), with a soft pulsing glow effect
- **Poison Food**: A muted purple (#9B6BBF) with a darker outline — visually distinct so the player can tell it apart
- **Power-Up Food (berries)**: Golden yellow (#F5C542) with a warm glow — grants a temporary buff when eaten
- **Bridges**: Warm woody brown (#A0785A) with planks drawn on top in a darker brown (#7A5C3A), bold outline
- **Obstacles**: Soft dusty gray (#B0A898) rounded blocks with dark outlines
- **UI / Text**: Deep navy (#2C3E50) for all text, buttons outlined in the same navy
- **Outline Color (universal)**: Deep chocolate brown (#3D2B1F) — used on everything to keep the "bold line art" feel consistent and soft (not harsh black)

### Rendering Style
- All game objects (snake segments, food, obstacles, bridges) are drawn as **rounded rectangles or circles** — nothing sharp or angular
- Every object has a **bold dark outline** (2-3px) in the universal outline color
- The snake head is drawn **last** (on top of everything except bridges) so it always feels like the "active" element
- Bridge segments are drawn **on top of** any snake body segments that pass under them, but **below** the snake head — this is what sells the "under the bridge" illusion
- Food pulses with a subtle glow/bloom using a soft shadow or repeated draw with decreasing opacity

### Particle Trail
- As the snake moves, each segment leaves a small fading particle behind
- Particles are soft white or pale gold (#FFF5D0), start semi-transparent, and fade out over ~15-20 frames
- They drift very slightly (tiny random offset each frame) so the trail feels organic, not rigid
- Particle size is small (3-4px radius) — sparkly, not overwhelming

---

## Core Gameplay Mechanics

### Grid & Movement
- The game runs on a grid (recommend 20x20 cells, each cell ~25px, fitting a 500x500 canvas)
- The snake moves one cell per tick in the current direction
- Direction is controlled by arrow keys (or WASD)
- The snake cannot reverse direction instantly (pressing left while moving right does nothing)

### Eating & Growing
- When the snake's head moves onto a food cell, it eats the food
- Normal food: snake grows by 1 segment, score +10
- The next food spawns at a random empty cell

### Game Over Conditions
- The snake hits a wall (edge of the canvas) — game over
- The snake hits one of its own body segments — game over
- The snake hits an obstacle — game over
- (Hitting a bridge does NOT cause game over — see Bridge System below)

### Scoring & Streak System
- Each normal food eaten: +10 points (base)
- Eating food consecutively without dying or hitting a wall builds a **streak multiplier**: 1x → 2x → 3x → etc.
- The streak multiplier applies to the base score, so at 3x streak, each food is worth 30 points
- The streak resets to 1x if the snake hits a wall (but doesn't die, in wall-wrap mode) or if it eats poison food
- Current streak and multiplier are displayed in the UI

---

## Enhancement: Bridge / Tunnel System

### How It Works
- Bridges are placed on the grid at game start (procedurally, 2-3 per game)
- Each bridge is a **1x3 horizontal or vertical** stretch of cells
- When the snake's head enters one end of a bridge, it passes **under** the bridge and emerges from the other end
- This means the snake can cross over its own body at a bridge without dying — a huge strategic tool in the endgame

### Visual Behavior
- The bridge is drawn as a wooden plank structure on top of the grid
- Snake body segments that are currently "under" the bridge are drawn **dimmed** (lower opacity, ~50%) to sell the illusion of depth
- The bridge tiles are drawn **on top of** dimmed snake segments, but **below** the snake head
- The snake head is always fully visible, even while passing under a bridge

### Placement Rules
- Bridges are placed **after** obstacles, on empty cells only
- No bridge can overlap an obstacle or another bridge
- At least **2 bridges** spawn per game, max **3**
- Bridges should be distributed across the grid (not all clumped in one corner) — simple approach: divide the grid into quadrants and place one bridge per quadrant where space allows

---

## Enhancement: Obstacles

- 3-5 static obstacle blocks spawn at game start in random empty cells
- Obstacles are never placed on the snake's starting position or the first food spawn
- Hitting an obstacle = game over
- Obstacles are drawn as rounded gray blocks with bold outlines (same art style as everything else)

---

## Enhancement: Food Types

### Normal Food
- Cherry red, pulsing glow
- +10 points (modified by streak multiplier)
- Grows the snake by 1 segment
- Only one normal food exists at a time; a new one spawns when the current one is eaten

### Poison Food
- Muted purple, no glow
- Resets the streak multiplier to 1x
- **Shrinks** the snake by 1 segment (minimum length: 3 — the snake can never shrink below 3 segments)
- Spawn chance: ~20% chance a poison food spawns alongside normal food (so sometimes 1 food on the board, sometimes 2)
- If eaten, a brief visual flash of purple tints the screen

### Power-Up Berry
- Golden yellow, warm glow
- Does NOT grow the snake
- Grants one of these temporary buffs (chosen randomly when it spawns):
  - **Slow-Mo**: Game tick slows down for 5 seconds — gives the player breathing room
  - **Ghost**: Snake can pass through its own body for 5 seconds (but not walls or obstacles)
  - **Score Boost**: All points doubled for 5 seconds
- Spawn chance: ~15% chance when new food spawns, disappears after 8 seconds if not eaten
- Active buff is shown in the UI with a timer countdown

---

## Enhancement: Wall Wrapping

- Toggle option available in the start/pause screen
- When **enabled**: the snake wraps around to the opposite edge instead of dying when it hits a wall
  - Wrapping does reset the streak multiplier (but doesn't end the game)
- When **disabled**: hitting a wall = game over (default behavior)

---

## Controls

| Key | Action |
|---|---|
| Arrow Keys / WASD | Move the snake (up, down, left, right) |
| P or Escape | Pause / Resume |
| Enter | Start game / Restart after game over |

---

## UI Layout

- **Top bar**: Score (left), Streak multiplier (center), High score (right)
- **Active buff indicator**: Shown below the top bar when a power-up is active, with a small countdown timer
- **Game canvas**: Centered on the page
- **Start screen**: Shown before the first game — title, instructions, wall-wrap toggle, and "Press Enter to Start"
- **Pause screen**: Overlay on the canvas saying "Paused" with a brief countdown (3, 2, 1) on resume
- **Game over screen**: Overlay showing final score, streak high, and "Press Enter to Restart"

---

## Success Criteria

### Must Have
- ✅ Fully playable Snake game on a grid with arrow key / WASD controls
- ✅ Cute cartoon art style: chunky rounded segments, bold outlines, pastel palette, snake face
- ✅ Particle trail effect behind the snake
- ✅ Bridge system (2-3 per game, snake passes under, body dims beneath bridge)
- ✅ Procedural obstacles (3-5 per game)
- ✅ Normal food with pulsing glow
- ✅ Poison food (shrinks snake, resets streak)
- ✅ Power-up berries (Slow-Mo, Ghost, Score Boost)
- ✅ Streak multiplier system
- ✅ Wall-wrap toggle
- ✅ Pause/resume with countdown
- ✅ Start screen, game over screen, and UI bar (score, streak, high score)
- ✅ Deploys cleanly to GitHub Pages

### Nice to Have
- ✅ Smooth food pulse/glow animation
- ✅ Brief screen flash on poison food eaten
- ✅ Active buff timer shown in UI
- ✅ High score persists across games (using in-memory storage, reset on page refresh)

---

## Testing Checklist
- [ ] Snake moves in all four directions, cannot reverse instantly
- [ ] Snake grows when eating normal food
- [ ] Snake shrinks when eating poison food (never below 3 segments)
- [ ] Power-up berries grant and expire buffs correctly
- [ ] Streak multiplier increases on consecutive eats, resets correctly
- [ ] Bridges render on top of body, body dims underneath, head stays visible
- [ ] Snake can cross its own body at a bridge without dying
- [ ] Obstacles cause game over on collision
- [ ] Wall-wrap toggle works correctly (wrap vs. die)
- [ ] Pause and resume with countdown works
- [ ] Game over and restart flow works
- [ ] Particle trail renders and fades smoothly
- [ ] All art style elements are consistent (rounded shapes, bold outlines, pastel colors)
- [ ] Deploys and runs correctly on GitHub Pages

---

## Development Approach
1. Set up canvas, grid, and basic snake movement (arrow keys)
2. Add normal food spawning, eating, and growing
3. Implement the art style — rounded segments, snake face, bold outlines, color palette
4. Add particle trail system
5. Add obstacles (procedural placement)
6. Implement the bridge system (placement, under-bridge rendering, collision logic)
7. Add poison food and power-up berries
8. Implement streak multiplier and scoring
9. Add wall-wrap toggle
10. Build UI (top bar, start screen, pause screen, game over screen)
11. Polish — food glow pulse, poison screen flash, buff timer display
12. Final testing and README
