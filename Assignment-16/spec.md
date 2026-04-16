# spec.md — Science Experiment Generator
## AIML 1870 | Code Quest Assignment

---

## Project Overview

**Name:** Science Experiment Generator  
**Type:** Static web application (HTML / CSS / JS — three separate files)  
**Deployment:** GitHub Pages (AIML-1870-2026 org, NavyButterfly repo)  
**API:** OpenAI `gpt-4o-mini` via browser fetch (OpenAI allows CORS; no backend needed)  
**Aesthetic:** Bright, playful, kid-friendly — primary color energy, chunky rounded elements, bold typography, science-classroom character

---

## File Structure

```
Assignment-XX/
├── index.html       ← structure and markup
├── style.css        ← all styles
├── script.js        ← all logic, API calls, state management
├── spec.md          ← this file
└── temp/            ← reference only, DO NOT deploy
    ├── index.html   ← Switchboard HTML (reference)
    ├── style.css    ← Switchboard styles (reference)
    └── script.js    ← Switchboard JS (reference)
```

No build tools. No frameworks. Vanilla HTML/CSS/JS only. No npm, no Node.js, no bundler.

---

## Reference Implementation (`temp/` folder)

The `temp/` folder contains the complete LLM Switchboard project from a prior assignment. It is **NOT** part of this project. Do not include it in the final build or deploy it.

Use it as a reference for:
- How to parse a `.env` file for the OpenAI API key (in-memory only, never stored)
- The `fetch()` call structure for `https://api.openai.com/v1/chat/completions`
- Error handling patterns for failed API requests
- How the code is organized across separate HTML/CSS/JS files
- General approach to building a single-page LLM tool

**Ignore these Switchboard features (not needed here):**
- Anthropic integration — this project is OpenAI-only
- Model selection dropdown / provider switching — hardcode `gpt-4o-mini`
- Structured output mode and JSON schema handling — this project uses free-form responses only
- Compare Models tab or Prompt Library tab

---

## Aesthetic Direction

**Concept:** Science classroom bulletin board meets toy box — the kind of interface that makes a 4th grader excited to try an experiment. Think bold crayon-style primary colors (red, yellow, blue, green), big rounded corners, hand-drawn-feeling decorative elements, and a generous, approachable layout. Energetic but not chaotic.

**Typography:**
- Display/headings: `Fredoka One` or `Nunito` (Google Fonts) — rounded, bold, friendly
- Body/labels: `Nunito` or `Quicksand` — legible, soft, approachable
- Monospace (experiment output): `Courier Prime` — gives "lab notes" feel

**Color Palette (CSS variables):**
```css
--color-bg: #FFF9F0;           /* warm off-white, like construction paper */
--color-primary: #E63946;      /* bold red */
--color-secondary: #457B9D;    /* bright blue */
--color-accent-yellow: #F4D03F;/* crayon yellow */
--color-accent-green: #2ECC71; /* science green */
--color-accent-orange: #F39C12;/* energetic orange */
--color-surface: #FFFFFF;
--color-border: #E0D6C8;
--color-text: #2D2D2D;
--color-text-muted: #8A8A8A;
--radius-lg: 20px;
--radius-xl: 32px;
```

**Visual details:**
- Thick colored borders (3–4px) on cards and input areas
- Subtle drop shadows on cards (`box-shadow: 4px 4px 0px rgba(0,0,0,0.1)`)
- Emoji used intentionally as decorative accents (🧪 🔬 ⚗️ 💡 📋 ⭐)
- Dotted or dashed borders for the supplies input area (like a dashed cut-out zone)
- Large, chunky buttons with hover transform: `translateY(-2px)` and bold shadow
- Background: light warm off-white with a very subtle dot-grid or graph-paper texture via CSS

---

## Application Layout

### Header
- App name: **"Science Experiment Generator"** in large display font
- Tagline: *"Turn your supplies into discovery!"*
- Decorative emoji row: 🔬 🧪 ⚗️ 💡 🌡️
- Color: primary red background with white text, full width

### Main Content — Two Column Layout (desktop), single column (mobile)
**Left column (inputs):**
1. API Key section (`.env` file upload — see API Key Handling)
2. Grade Level dropdown
3. Available Supplies input
4. Generate button
5. Quick-Select Supplies panel (stretch)

**Right column (output):**
1. Experiment result card (rendered markdown → HTML)
2. Previously generated experiments history (stretch)
3. Printable worksheet button (stretch)

---

## Core Features

### 1. API Key Handling
- File upload button labeled **"Upload your .env file"** with a small lock icon
- On file select: read file in-memory using `FileReader`, parse for `OPENAI_API_KEY=...`
- Store key in a JS `let` variable only — **never** `localStorage`, never any persistence
- Display a green badge: **"🔒 Key loaded — memory only, never saved"** once loaded
- Also allow manual paste: a `type="password"` text field as fallback
- API key is injected into the `Authorization` header at call time, exactly as in the Switchboard `temp/` reference

### 2. Grade Level Dropdown
- Label: **"Grade Level"**
- Options (individual grades): Kindergarten, 1st Grade, 2nd Grade, 3rd Grade, 4th Grade, 5th Grade, 6th Grade, 7th Grade, 8th Grade, 9th Grade, 10th Grade, 11th Grade, 12th Grade
- Styled with a colorful accent border; large font, rounded corners

### 3. Available Supplies Input
- Label: **"What supplies do you have?"**
- `<textarea>` — multi-line, resizable
- Placeholder: *"e.g., baking soda, vinegar, food coloring, empty bottles, balloons..."*
- Helper text below: *"List anything you have on hand — household items work great!"*
- Dashed border style to feel like a "fill in the blank" box

### 4. Generate Button
- Label: **"🚀 Generate My Experiment!"**
- Full-width, large (min-height 56px), bold font, primary red → orange gradient
- Hover: lifts with `transform: translateY(-3px)` and stronger shadow
- Loading state: spinner + text **"🔬 Cooking up an experiment..."** (disable button)
- Disabled if no API key loaded or supplies field empty

### 5. Prompt Construction

**System prompt:**
```
You are a friendly, enthusiastic science teacher who creates safe, fun, engaging science experiments for K-12 students. Your experiments use only the supplies provided. Always format your response with clear sections: a title, difficulty rating, materials needed, hypothesis, step-by-step procedure, what to observe, the science behind it, and a fun variation to try. Use age-appropriate language for the specified grade level.
```

**User prompt (assembled dynamically):**
```
Create a science experiment for a {grade} student using these supplies: {supplies}.
Format the experiment with these sections:
🧪 Experiment Title
⭐ Difficulty: [Easy / Medium / Hard]
📋 Materials Needed
💡 Hypothesis (what we think will happen)
📝 Step-by-Step Procedure
👀 What to Observe
🔬 The Science Behind It
🌟 Fun Variation to Try
Make it exciting and age-appropriate for {grade}!
```

### 6. Response Rendering
- Parse the model's markdown/emoji-formatted response
- Render it as formatted HTML (not raw text) in the output card
- Use a simple markdown-to-HTML conversion (handle `**bold**`, `# headings`, numbered lists, bullet lists, line breaks)
- Output card: white surface, generous padding, colored left border (accent-green), large readable font
- Each section header (🧪, ⭐, 📋, etc.) rendered prominently with emoji + bold text

---

## Stretch Features

### Stretch 1: Save & Display Previously Generated Experiments
- After each successful generation, append a compact summary card to a "Previous Experiments" section below the main output
- Summary card shows: grade level, a truncated title, date/time, and a **"View"** button
- Clicking **"View"** re-renders that experiment in the main output card
- Store history in a JS array (in-memory only, clears on page refresh)
- Show a **"Clear History"** button when at least one saved experiment exists
- Section label: **"📚 Your Experiment History"**

### Stretch 2: Quick-Select Common Household Supplies
- A labeled panel: **"⚡ Quick Add Supplies"**
- Grid of clickable pill/chip buttons for common items:
  - Baking soda, Vinegar, Food coloring, Water, Salt, Sugar, Dish soap, Balloons, Empty bottles, Rubber bands, Paper clips, Aluminum foil, Cornstarch, Eggs, Lemons, Magnets, String, Tape, Straws, Candles
- Clicking a chip appends it to the supplies textarea (comma-separated)
- Chips toggle color (active/inactive) to show what's been added
- Chips are color-coded by category: household chemicals (blue), kitchen items (yellow), craft supplies (green)

### Stretch 3: Supply Substitution Suggestions
- After an experiment is generated, show a secondary prompt button: **"🔄 Missing a supply? Get substitutions"**
- Opens a small modal or inline panel where the user can type a supply they don't have
- On submit: calls the API with a targeted prompt asking for safe, common substitutes
- Response rendered inline below the experiment

### Stretch 4: Printable Observation Worksheets
- After an experiment is generated, show a **"🖨️ Print Worksheet"** button
- Clicking opens a `window.print()` print dialog with a specially styled print layout
- Print layout: `@media print` CSS that hides the UI chrome and renders:
  - Experiment title (large)
  - Name: ____________ / Date: ____________ / Grade: ____________
  - Hypothesis section with lined blanks for student to fill in
  - Observation log with rows for recording results
  - Conclusion: *"What did I learn?"* with lined space
  - School-appropriate header: "Science Lab Worksheet"
- Print styles: black and white, clean margins, no backgrounds

### Stretch 5: Difficulty Ratings
- The model is prompted to include a difficulty rating (Easy / Medium / Hard) in its response
- Parse this from the response and render a visual badge on the output card:
  - Easy → green badge with ⭐
  - Medium → yellow/orange badge with ⭐⭐
  - Hard → red badge with ⭐⭐⭐
- Also shown on history summary cards (Stretch 1)

---

## API Call Details

- **Endpoint:** `https://api.openai.com/v1/chat/completions`
- **Model:** `gpt-4o-mini` (hardcoded — no model selector)
- **Method:** POST
- **Headers:**
  ```
  Content-Type: application/json
  Authorization: Bearer {apiKey}
  ```
- **Body:**
  ```json
  {
    "model": "gpt-4o-mini",
    "messages": [
      { "role": "system", "content": "..." },
      { "role": "user", "content": "..." }
    ],
    "max_tokens": 1200
  }
  ```
- **Response:** `data.choices[0].message.content` — free-form text, render as HTML
- **Error handling:** Catch fetch errors and non-200 status codes; display a friendly red error banner: *"Something went wrong — check your API key and try again."*
- **Loading state:** Disable the generate button and show spinner while awaiting response

Follow the exact `fetch()` structure and error handling from `temp/script.js`. Do not invent a different pattern.

---

## Responsive Design

- Desktop (≥768px): two-column layout (inputs left, output right)
- Mobile (<768px): single column, inputs stacked above output
- All inputs, buttons, and text must be comfortably tappable on mobile (min 44px touch targets)
- Font sizes scale down slightly on mobile but remain large and readable

---

## Accessibility

- All form fields have associated `<label>` elements
- Generate button has meaningful `aria-label` during loading state
- Error messages use `role="alert"` for screen readers
- Color is never the only indicator — difficulty badges include text labels

---

## Notes for Claude Code

- Build in order: `index.html` → `style.css` → `script.js`
- Each file gets its own focused session — don't combine them
- Reference `temp/` for fetch/key patterns; ignore everything else from it
- The `.env` file parsing should match the Switchboard exactly (FileReader, split on `=`, trim whitespace)
- Use Google Fonts: load `Fredoka One` and `Nunito` via `<link>` in `<head>`
- All stretch features should be fully wired up and functional, not placeholder UI
- The output rendering must convert markdown to HTML (bold, lists, headings) — do not display raw text or raw markdown
