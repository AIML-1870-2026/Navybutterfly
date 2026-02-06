# Starfield - Particle System Project

## Project Overview
Create an interactive starfield webpage using a particle system. Users can control the animation through sliders and switch between different movement patterns using buttons.

## Target User
A beginner-friendly, visually engaging particle system that demonstrates how simple rules create complex effects.

## Technical Requirements

### File Structure
```
starfield/
├── index.html       (page structure)
├── styles.css       (all styling)
├── script.js        (particle system logic)
└── README.md        (project documentation)
```

### Deployment
- Must work as a GitHub Pages website
- All files should be clean and well-organized for repository deployment

## Core Features

### 1. Canvas Animation
- Full-screen HTML5 canvas that fills the browser window
- Black background
- Responsive to window resizing

### 2. Particle System
Each star particle has:
- **Position**: x, y coordinates
- **Velocity**: speed and direction of movement
- **Trail effect**: Stars leave a fading trail behind them as they move
- **Varied colors**: Stars should have different colors (not just white)
- **Size variation**: Different sized stars for visual interest
- **Lifetime**: Stars that reach the edge respawn at the center

### 3. Movement Modes (Button Controls)
Four different movement patterns, selectable via buttons:

#### Normal Mode (default)
- Stars radiate outward from the center point
- Move in straight lines at constant speed
- Classic "warp speed" starfield effect

#### Fountain Mode
- Stars shoot upward from a center point
- Gravity pulls them back down
- Creates an arc/parabolic trajectory
- Stars respawn when they fall below the canvas

#### Donut Mode
- Stars orbit in circular paths around the center
- Multiple orbital rings at different radii
- Constant angular velocity
- Creates a rotating donut/torus shape

#### Spiral Mode
- Stars move outward in spiral patterns
- Combination of radial movement and rotation
- Creates galaxy-like spiral arms
- Multiple spirals starting from center

### 4. Control Sliders
Sliders should control these attributes (work in all modes):

- **Star Speed**: Controls how fast stars move (0-200%)
- **Number of Stars**: Controls particle count (50-500 stars)
- **Trail Length**: Controls how long the trail effect lasts (0-100%)
- **Star Size**: Controls base size of stars (1-10px)
- **Color Intensity**: Controls brightness/saturation of star colors (0-100%)

Each slider should:
- Display its current value
- Update the animation in real-time as the user adjusts it
- Have clear labels

### 5. UI Layout (Stretch Goal)
- Position controls OUTSIDE the main canvas area
- Suggestion: Create a control panel on the right side or bottom
- Ensure controls don't cover the starfield animation
- Controls should have a semi-transparent background for visibility
- Maintain clean, organized layout

## Visual Design

### Color Palette
- **Background**: Pure black (#000000)
- **Stars**: Varied colors - whites, blues, purples, pinks, yellows (randomized)
- **Controls**: Dark semi-transparent background with white text
- **Buttons**: Clear visual distinction for active/selected mode

### Typography
- Clean, modern sans-serif font
- Good contrast for readability
- Label all controls clearly

### Styling Guidelines
- Minimalist, space-themed aesthetic
- Smooth animations and transitions
- Professional but playful feel
- Accessible button states (hover, active)

## User Experience

### On Page Load
- Animation starts immediately in Normal mode
- Default slider values provide a good baseline effect
- Controls are visible and accessible

### Interactions
- Clicking mode buttons instantly switches particle behavior
- Active mode button should be visually highlighted
- Sliders respond smoothly with immediate visual feedback
- Page is responsive to window resizing

### Performance
- Smooth 60fps animation
- Efficient particle rendering
- No lag when adjusting controls

## Implementation Notes

### Beginner-Friendly Approach
Since this is a learning project:
- Use clear, well-commented code
- Break functionality into logical functions
- Use descriptive variable names
- Include helpful comments explaining the particle system logic

### Canvas Rendering
- Use `requestAnimationFrame` for smooth animation
- Clear and redraw canvas each frame
- Implement trail effect by drawing semi-transparent rectangles over the canvas (not fully clearing)

### Particle Physics
Each mode requires different physics calculations:
- **Normal**: Simple linear velocity from center
- **Fountain**: Vertical velocity + gravity acceleration
- **Donut**: Polar coordinates with constant angular velocity
- **Spiral**: Polar coordinates with increasing radius

### Particle Management
- Store particles in an array
- Update all particles each frame
- Respawn particles when they go off-screen or complete their lifecycle
- Each mode may need different respawn logic

## Success Criteria

### Must Have (Main Task)
✅ Canvas-based starfield with particle system
✅ Trail effect on stars
✅ Four movement modes with button controls
✅ Five sliders controlling animation attributes
✅ Varied, colorful stars
✅ Smooth, performant animation

### Stretch Goal
✅ Controls positioned outside canvas area
✅ Clean, organized UI layout
✅ Professional presentation

## README Content
The README.md should include:
- Project title and brief description
- Link to live demo (GitHub Pages URL)
- Features list
- How to use the controls
- Technologies used (HTML5 Canvas, JavaScript, CSS)
- Future enhancement ideas

## Testing Checklist
- [ ] All four modes work correctly
- [ ] All sliders affect the animation as expected
- [ ] Window resizing doesn't break the canvas
- [ ] Performance stays smooth with max number of stars
- [ ] Controls are accessible and intuitive
- [ ] Works in modern browsers (Chrome, Firefox, Safari, Edge)

---

## Development Approach
1. Start with basic canvas setup and Normal mode
2. Add particle system with trails
3. Implement sliders for Normal mode
4. Add the three additional movement modes
5. Implement mode switching buttons
6. Style and position controls (stretch goal)
7. Polish and optimize

This spec is ready to hand to Claude Code for implementation!