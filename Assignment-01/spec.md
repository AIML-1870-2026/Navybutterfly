# Stellar Web - Technical Specification

## Project Overview

**Stellar Web** is an interactive visualization that simulates a dynamic star field with constellation-like connections. Stars drift through space, and when they come within proximity of each other, luminous threads connect them—forming an ever-shifting cosmic web that resembles both neural networks and galactic structures.

### Goals
- Create an immersive, meditative visual experience
- Demonstrate advanced canvas rendering techniques
- Build on concepts from Assignment-01 (Particle Network) with enhanced visual fidelity
- Achieve smooth 60fps animation performance

## Technical Approach

### Technologies
- **HTML5 Canvas** - Primary rendering surface
- **Vanilla JavaScript** - No external dependencies
- **CSS3** - UI styling with glassmorphism effects
- **requestAnimationFrame** - Smooth animation loop

### Architecture
- Single HTML file (self-contained)
- Object-oriented particle system
- Spatial partitioning for efficient neighbor detection (optional optimization)
- Event-driven control system

## Core Features

### 1. Star Field System
- 100-300 stars with varying sizes and brightness
- Multiple star types:
  - **Primary stars**: Large, bright, slow-moving
  - **Secondary stars**: Medium, moderate brightness
  - **Background stars**: Small, dim, static or slow parallax
- Depth layers for parallax effect (3 layers minimum)

### 2. Connection Web
- Dynamic edges between nearby stars
- Connection strength based on:
  - Distance (closer = stronger)
  - Star brightness (brighter stars have stronger connections)
- Animated connection formation/dissolution
- Maximum connections per star (prevent visual clutter)

### 3. Visual Effects
- **Star glow**: Radial gradient with bloom effect
- **Twinkle animation**: Subtle brightness oscillation
- **Connection pulse**: Energy flowing along connections
- **Color temperature**: Stars range from cool blue to warm white
- **Nebula clouds**: Optional background particle clouds

### 4. Interactivity
- Mouse hover: Stars near cursor brighten and attract
- Click: Create temporary "supernova" burst effect
- Drag: Push stars away (gravitational repulsion)

## Control Parameters

| Parameter | Range | Default | Description |
|-----------|-------|---------|-------------|
| Star Count | 50-300 | 150 | Total number of stars |
| Connection Distance | 50-250px | 120 | Max distance for connections |
| Star Speed | 0.1-2.0 | 0.5 | Base movement speed |
| Twinkle Intensity | 0-100% | 50% | Star brightness variation |
| Connection Opacity | 0.1-1.0 | 0.4 | Base opacity of web threads |
| Connection Width | 0.5-3px | 1.0 | Thickness of connections |
| Glow Intensity | 0-100% | 70% | Star glow/bloom amount |
| Parallax Depth | 0-100% | 50% | Depth effect strength |
| Color Temperature | Cool-Warm | Neutral | Overall color palette shift |

## Visual Design Requirements

### Color Palette
```
Background:     #050510 (deep space black)
                #0a0a20 (dark blue tint)

Stars:          #ffffff (white core)
                #e0f0ff (cool blue)
                #fff8e0 (warm white)
                #ffd0a0 (orange giant)

Connections:    #4080ff (primary blue)
                #80c0ff (light blue)
                #ffffff (bright flash)

UI Elements:    rgba(255,255,255,0.1) (glass panels)
                #7dd3fc (accent cyan)
```

### Layout
- Canvas: Full viewport width minus control panel
- Control panel: 300-320px fixed width, right side
- Statistics display: Bottom of control panel
- Responsive: Collapse controls on mobile

### Typography
- UI Labels: System sans-serif, 13-14px
- Values: Monospace, 12-13px
- Headers: 16-18px, letter-spacing 1-2px

## Implementation Phases

### Phase 1: Foundation
- [ ] Set up HTML structure with canvas and control panel
- [ ] Implement basic Star class with position, velocity, size
- [ ] Create animation loop with requestAnimationFrame
- [ ] Add depth/z-coordinate for 3D projection

### Phase 2: Core Rendering
- [ ] Render stars with size based on depth
- [ ] Implement star glow effect (radial gradients)
- [ ] Add twinkle animation (sine wave brightness)
- [ ] Create connection detection algorithm
- [ ] Draw connections with distance-based opacity

### Phase 3: Controls
- [ ] Build control panel UI with sliders
- [ ] Wire up all control parameters
- [ ] Add real-time parameter updates
- [ ] Implement statistics calculation and display

### Phase 4: Visual Polish
- [ ] Add color temperature variation to stars
- [ ] Implement connection pulse animation
- [ ] Add parallax layers for depth
- [ ] Create smooth fade-in on load

### Phase 5: Interactivity
- [ ] Mouse proximity detection
- [ ] Hover effect (star attraction/brightening)
- [ ] Click supernova effect
- [ ] Optional: drag repulsion

### Phase 6: Optimization & Testing
- [ ] Profile and optimize render loop
- [ ] Test on multiple browsers
- [ ] Verify 60fps performance
- [ ] Mobile responsiveness check

## Statistics Display

The following metrics should be calculated and displayed in real-time:

- **Total Stars**: Current star count
- **Active Connections**: Number of visible edges
- **Avg Connections/Star**: Mean connectivity
- **Network Density**: Connections / Max possible connections
- **Brightest Star**: Highest current brightness value
- **FPS**: Frames per second (performance monitor)

## File Structure

```
Assignment-02/
├── index.html      # Complete self-contained application
└── spec.md         # This specification document
```

## Performance Targets

- **Target FPS**: 60fps on modern hardware
- **Fallback FPS**: 30fps acceptable on older devices
- **Max Stars**: Should handle 300 stars without frame drops
- **Connection Algorithm**: O(n²) acceptable for n ≤ 300

## Success Criteria

1. Visually stunning cosmic aesthetic
2. Smooth, fluid animation
3. Intuitive, responsive controls
4. All parameters adjustable in real-time
5. Statistics accurately reflect network state
6. No visual glitches or rendering artifacts
7. Works in Chrome, Firefox, Safari, Edge
