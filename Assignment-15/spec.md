# Product Review Generator — Code Quest Spec

## Project Goal

Build a single-file web application (`index.html`) where a user enters a product
name, adjusts review options, and clicks a button to receive an AI-generated
product review via the OpenAI API.

This is an **educational tool** — reviews are generated for learning purposes
and are not for publication (per FTC rule effective Oct 21 2024).

---

## File Structure

```
Assignment-15/
├── index.html     ← entire app: HTML + CSS + JS all in one file
├── spec.md        ← this file
└── temp/          ← reference only, DO NOT deploy or include in build
    ├── index.html ← Switchboard HTML (reference)
    ├── style.css  ← Switchboard styles (reference)
    └── script.js  ← Switchboard JS (reference)
```

---

## Reference Implementation (temp/ folder)

The `temp/` folder contains the complete LLM Switchboard project from
Assignment 14. It is **not** part of this project. Do not include it in the
final build or deploy it to GitHub Pages.

Use it as a reference for the following specific patterns:

### API key handling
The Switchboard reads the key from a password input (`type="password"`) and
holds it in a JS variable only — never written to localStorage or any storage.
The key is passed directly into the `fetch()` Authorization header at call time.
A file upload option parses `.env` / `.csv` files in-memory using FileReader.
Replicate this exact pattern. The "memory only — never saved" badge UI should
also be carried over.

### fetch() call structure
The Switchboard calls `https://api.openai.com/v1/chat/completions` with:
```js
fetch("https://api.openai.com/v1/chat/completions", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${apiKey}`
  },
  body: JSON.stringify({
    model: selectedModel,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user",   content: userPrompt }
    ]
  })
})
```
Use this same structure. Do not invent a different fetch pattern.

### Error handling
The Switchboard catches fetch errors and API error responses and displays them
in a visible error banner with a dismiss button. Replicate this — do not let
errors fail silently.

### Loading state
The send button shows a spinner and disables itself while waiting for the API
response. Re-enable it after response or error. Replicate this pattern exactly.

---

## UI Layout

Two-column layout (same general structure as the Switchboard):
- **Left column:** all form inputs / controls
- **Right column:** generated review output area

On mobile (< 768px), stack into a single column.

---

## Left Column — Controls

### 1. Product Info Card
- Text input: **Product Name** (required, placeholder: "e.g. Sony WH-1000XM5")
- Text input (optional): **Product Category** (placeholder: "e.g. Headphones")

### 2. Review Options Card

**Tone slider** (required)
- Range: 0–100
- Labels at ends: "Harsh" ←→ "Glowing"
- Display current label dynamically:
  - 0–20 → Harsh
  - 21–40 → Critical
  - 41–59 → Balanced
  - 60–79 → Positive
  - 80–100 → Glowing

**Length slider** (required)
- Range: 0–100
- Labels: "Brief" ←→ "Detailed"
- Display current label dynamically:
  - 0–33 → Brief (~100 words)
  - 34–66 → Medium (~250 words)
  - 67–100 → Detailed (~500 words)

### 3. Aspects Card (stretch — required per instructor)

A row of clickable aspect pills (toggle on/off):
- Price · Features · Usability · Design · Value

When an aspect pill is toggled ON, reveal a sentiment slider beneath it:
- Range: 0–100
- Labels: "Negative" ←→ "Positive"
- Show current label: 0–33 Negative / 34–66 Neutral / 67–100 Positive

### 4. API Key Card
- Password input with show/hide toggle button (eye icon)
- File upload button: "Upload .env / .csv" (parse key from file in-memory)
- "Memory only — never saved" badge (lock icon + text, same as Switchboard)
- Inline error message if key is missing on submit

### 5. Generate Button
- Full-width primary button: "Generate Review"
- Shows spinner + disables while API call is in flight
- Re-enables after response or error

---

## Right Column — Output Area

### Empty state (default)
- Centered icon + text: "Your review will appear here."
- Subtext: "Fill in the product details and click Generate Review."

### Response panel (shown after successful API call)
- Header row: model name label (left) + "Copy" button (right)
- Review text rendered as formatted prose (preserve paragraph breaks)
- Metrics bar below: response time · token count · character count

### Error banner
- Shown on API errors (invalid key, rate limit, network failure)
- Includes dismiss (×) button
- Same pattern as Switchboard's `#error-banner`

---

## Prompt Construction

Build the prompt dynamically from form values. Do not hardcode review content.

**System prompt:**
```
You are a product review writer. Write realistic, balanced, human-sounding
product reviews for educational purposes only. These reviews are not for
publication or commercial use.
```

**User prompt (assembled at submit time):**
```
Write a [length label] product review for "[product name]"[, a [category]]
in a [tone label] tone.

[If aspects are selected:]
Focus on the following aspects and reflect the stated sentiment for each:
- Price: [sentiment label]
- Features: [sentiment label]
- Usability: [sentiment label]
[...only include toggled-on aspects]

Write the review as a single piece of flowing prose. Do not use bullet points
or headers inside the review itself.
```

---

## Visual Design

Match the Switchboard's aesthetic:
- Font: Fraunces (headings) + DM Sans (body) — same Google Fonts import
- Color palette: warm linen background (`#f5f0eb`), terracotta accent
  (`#c1714a`), soft sage highlights
- Cards: white background, subtle border, gentle border-radius, light shadow
- Sliders: styled range inputs with the accent color as the thumb/track fill
- Pills: rounded toggle buttons, outlined when off, filled accent when on
- Spacing and card structure should feel like a sibling app to the Switchboard

---

## What NOT to Do

- Do not split into separate CSS or JS files — everything in `index.html`
- Do not use localStorage, sessionStorage, or cookies for the API key
- Do not hardcode any API key in the source (the `#key-presets` hidden div
  pattern from the Switchboard is acceptable if the instructor shared a class
  key — otherwise leave the input empty)
- Do not include or deploy the `temp/` folder
- Do not use dropdowns for tone or length — use sliders per the assignment

---

## Deployment

Push `index.html` to the NavyButterfly GitHub repo at:

```
Assignment-15/index.html
```

Live URL will be:
`https://aiml-1870-2026.github.io/Navybutterfly/Assignment-15/`
