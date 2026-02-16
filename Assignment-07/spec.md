# Decision Neuron: Dinner with Family or Show with Roommates?

## Overview
An interactive single-neuron decision simulator that models the everyday college dilemma: **"Should I get dinner with my family or watch a show with my roommates?"**

- **"Yes" (≥50%)** → 🍽️ Go to dinner with family
- **"No" (<50%)** → 📺 Stay and watch the show with roommates

The app has three panels: a **Neuron Calculator** with sliders, a **Decision Boundary Visualizer** (2D heatmap/scatter plot), and a **Training Mode** where users label examples and watch the neuron learn.

---

## Inputs (4 Factors)

| # | Input Name | Description | Range | Weight Sign | Default Weight |
|---|-----------|-------------|-------|-------------|----------------|
| 1 | **Hunger Level** | How hungry am I right now? | 0–1 | Positive (+) | +2.0 |
| 2 | **Family Miss Factor** | How long since I've seen my family? | 0–1 | Positive (+) | +2.5 |
| 3 | **Show Hype** | How good/hyped is the show we're watching? | 0–1 | Negative (−) | −1.8 |
| 4 | **Tiredness** | How tired am I? (tired = stay in) | 0–1 | Negative (−) | −1.5 |

## Bias: "Homebody Tendency"
- **Range:** −3.0 to +3.0
- **Default:** −0.5 (slight lean toward staying in — it's easier)
- **Interpretation:** Negative = default toward roommates/show; Positive = default toward family dinner

## Activation
- **Sigmoid function**: σ(z) = 1 / (1 + e^(−z))
- **z** = (hunger × w₁) + (familyMiss × w₂) + (showHype × w₃) + (tiredness × w₄) + bias
- Output displayed as a **percentage probability** (0–100%) with contextual label:
  - ≥ 80%: "Definitely going to dinner! 🍽️"
  - 60–79%: "Leaning toward family dinner"
  - 40–59%: "Tough call..."
  - 20–39%: "Leaning toward the show"
  - < 20%: "Staying in for sure! 📺"

---

## Panel 1: Neuron Calculator

### Layout
- 4 horizontal sliders (0–1, step 0.01) for each input factor
- Each slider shows: label, current value, weight badge (colored green for positive, red for negative)
- Bias slider below inputs (−3 to +3)
- **Live math display** showing the weighted sum calculation:
  ```
  z = (0.65 × 2.0) + (0.80 × 2.5) + (0.30 × −1.8) + (0.40 × −1.5) + (−0.5) = 1.26
  σ(1.26) = 77.9% → "Leaning toward family dinner"
  ```
- Large animated probability display (number + emoji + label)
- Probability meter/bar that fills and changes color (blue for show → warm orange/red for dinner)

---

## Panel 2: Decision Boundary Visualizer

### 2D Heatmap
- **X-axis:** Hunger Level (0–1)
- **Y-axis:** Family Miss Factor (0–1)
- Heatmap colors: cool blue (show/roommates) → white (50% boundary) → warm coral/orange (family dinner)
- **Gold contour line** at the 50% decision threshold — this IS the decision boundary
- **Crosshair dot** tracks current slider positions for Hunger and Family Miss
- When other sliders (Show Hype, Tiredness) or bias change, the entire boundary shifts — animate this smoothly
- Axis labels and grid lines for readability
- **Dropdown** to swap which two inputs map to X/Y axes (default: Hunger × Family Miss)

---

## Panel 3: Training Mode

### How It Works
- User clicks on the 2D scatter plot to place data points
- Toggle or two-button system to label points: 🍽️ "Went to dinner" (yes) or 📺 "Watched the show" (no)
- Points appear as colored dots on the plot (orange = dinner, blue = show)

### Controls
- **"Step" button**: Runs ONE perceptron learning iteration
  - Picks a random training point
  - Highlights it briefly (pulse animation)
  - Computes prediction vs actual label
  - Updates weights using perceptron learning rule: w_new = w_old + lr × (target − prediction) × input
  - Animates the decision boundary line shifting to its new position
  - Learning rate: 0.1 (could add a slider)
- **"Train" button**: Runs multiple steps automatically (e.g., 50 iterations with visible animation)
- **"Reset" button**: Clears all points, resets weights to defaults

### Display During Training
- Current weights (all 4 + bias) updating in real-time
- Step counter
- Accuracy percentage (correct predictions / total points)
- The decision boundary line animating as it adjusts

---

## UI/UX Requirements

### Aesthetic Direction
- **Warm, cozy evening vibe** — this is about dinner and TV after all
- Dark background with warm accent colors (amber/orange for dinner, soft blue/indigo for show)
- Rounded corners, soft shadows, comfortable spacing
- Font: Something friendly and modern (e.g., "DM Sans" for body, "Fraunces" or "Playfair Display" for headings)

### Layout
- Desktop: Three panels side-by-side or tabbed
- Mobile-responsive: Stack vertically, full-width sliders
- Smooth transitions between panels on mobile (tab-based)

### Animations
- Slider interactions: probability number animates smoothly (counting up/down)
- Decision boundary: smooth CSS/JS transition when weights change
- Training step: pulse effect on selected point, boundary line slides
- Emoji/label transitions when crossing probability thresholds

### Accessibility
- Color-blind friendly palette (don't rely solely on red/green)
- Slider labels visible at all times
- Clear contrast ratios

---

## Tech Stack
- Single HTML file (HTML + CSS + JavaScript, no framework)
- Canvas or SVG for the 2D heatmap/scatter plot (Canvas recommended for heatmap performance)
- All math done in vanilla JS
- Mobile-responsive via CSS media queries
- Deploy to GitHub Pages

---

---

## Stretch Feature: Multi-Scenario Neuron

A row of scenario chips at the top lets users swap the entire decision domain. Clicking a scenario updates all labels, weights, emoji, bias name, and celebration text.

### Presets

| Scenario | Yes Label | No Label | Inputs (4) | Bias Name |
|----------|-----------|----------|------------|-----------|
| 🍽️ Dinner vs Show (default) | Go to dinner | Watch the show | Hunger, Family Miss, Show Hype, Tiredness | Homebody Tendency |
| 📚 Study vs Go Out | Hit the books | Go out | Exam Closeness, Grade Anxiety, Friend FOMO, Energy Level | Procrastinator Tendency |
| 🍳 Cook vs Takeout | Cook at home | Order takeout | Ingredients Available, Time Available, Craving Complexity, Laziness | Convenience Bias |

### "+ Custom" Button
- Opens a modal/panel where users can define: title, emoji, yes/no labels, 3-5 input names with weight signs, and bias name
- Applying a custom scenario works identically to presets

### Behavior
- Switching scenarios resets slider values to 0.5, clears training points, and resets weights to that scenario's defaults
- The entire UI (labels, emoji, math display, boundary axes, training labels) updates to match

---

## File Structure
```
index.html    ← everything in one file
```
