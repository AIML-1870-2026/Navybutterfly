# spec.md — LLM Switchboard
## AIML 1870 | Code Quest Assignment

---

## Project Overview

**Name:** LLM Switchboard  
**Type:** Three-file static web app (HTML / CSS / JS — separate files)  
**Deployment:** GitHub Pages (AIML-1870-2026 org, NavyButterfly repo)  
**APIs:** OpenAI (browser-callable) + Anthropic (CORS-blocked — handled gracefully)  
**Aesthetic:** Warm & modern — soft warm whites and creams, dusty rose and sage accents, rounded cards, generous whitespace, friendly and human. Think a beautifully designed medical reference tool: approachable, clean, trustworthy. NOT sterile or cold — warm like a well-designed health app.

---

## File Structure

```
llm-switchboard/
├── index.html
├── style.css
└── script.js
```

No build tools. No frameworks. Vanilla HTML/CSS/JS only.

---

## Visual Design System

### Fonts
- **Display / headings:** `Fraunces` (Google Fonts) — a warm serif with optical-size variation, distinctive and human
- **Body / UI:** `DM Sans` (Google Fonts) — friendly, modern, readable

### Color Palette (CSS variables)
```css
--bg:           #faf8f5;        /* warm off-white page background */
--surface:      #ffffff;        /* card surfaces */
--surface-2:    #f5f0eb;        /* subtle secondary surfaces */
--border:       #e8e0d6;        /* soft warm borders */
--accent:       #c4785a;        /* dusty terracotta — primary accent */
--accent-2:     #7a9e87;        /* sage green — secondary accent */
--accent-soft:  #f0e6de;        /* light terracotta tint for backgrounds */
--text:         #2d2420;        /* warm near-black */
--text-2:       #7a6b62;        /* muted warm gray */
--text-3:       #b5a89e;        /* lightest text for labels */
--error:        #c0392b;
--success:      #5a8a6a;
--radius:       14px;
--shadow:       0 2px 12px rgba(45,36,32,0.08);
--shadow-lg:    0 8px 32px rgba(45,36,32,0.12);
```

### Aesthetic Details
- Rounded corners everywhere (`--radius: 14px`, pill buttons use `border-radius: 999px`)
- Subtle warm drop shadows on cards
- Thin 1px warm borders
- Animated transitions (200–300ms ease) on all interactive elements
- Hover states: gentle lift (translateY(-2px)) + shadow increase
- Soft gradient on page header: `linear-gradient(135deg, #faf8f5 0%, #f0e6de 100%)`
- Loading spinner uses accent color
- Smooth fade-in on response panels

---

## Layout

### Page Header
- App name: **LLM Switchboard** in Fraunces display font
- Subtitle: "Explore AI language models — free text & structured output"
- Small tagline badge: "Pre-Med Edition" in sage green pill

### Two-Column Main Layout (desktop), stacked on mobile
- **Left column (~340px):** Controls panel (provider, model, API key, mode, prompts, schema)
- **Right column (flex-grow):** Output area (response display, metrics, comparison)

### Controls Panel (left)
Cards stacked vertically:
1. **Provider & Model Card** — provider toggle (OpenAI / Anthropic), model dropdown
2. **API Key Card** — manual paste input OR file upload (.env / CSV); memory-only badge
3. **Output Mode Card** — toggle: Unstructured / Structured
4. **Prompt Card** — textarea + example prompts dropdown
5. **Schema Card** (visible only in Structured mode) — textarea for JSON schema + template picker
6. **Send Button** — large, full-width, terracotta accent

### Output Area (right)
- **Response panel** — main response display with smooth fade-in
- **Metrics bar** — response time (ms), token count, character count (shown after each response)
- **Structured validator panel** — appears in Structured mode; shows field-by-field compliance report
- **Comparison panel** — appears when Side-by-Side mode is active; shows two responses

---

## Provider & Model Support

### OpenAI (fully functional from browser)
Models dropdown:
- `gpt-4o` — GPT-4o (recommended)
- `gpt-4o-mini` — GPT-4o Mini (faster/cheaper)
- `gpt-4-turbo` — GPT-4 Turbo
- `gpt-3.5-turbo` — GPT-3.5 Turbo

API endpoint: `https://api.openai.com/v1/chat/completions`

### Anthropic (CORS-blocked — graceful handling)
Models dropdown (shown but disabled):
- `claude-opus-4-6`
- `claude-sonnet-4-6`
- `claude-haiku-4-5-20251001`

When Anthropic is selected, disable the Send button and show a friendly info card:

> **Why can't I use Anthropic directly?**  
> Anthropic's API is designed to be called from a backend server, not directly from a browser. This is a web security feature called CORS (Cross-Origin Resource Sharing). OpenAI has configured their API to allow browser calls; Anthropic has not. In a real app, you'd route Anthropic calls through your own backend. For now, switch to OpenAI to send prompts.

Show this as a warm info card (sage green border, soft background), not as an error.

---

## API Key Handling

- Accept keys via:
  1. **Manual paste** — text input field with show/hide toggle (eye icon)
  2. **File upload** — accepts `.env` or `.csv`; parses `OPENAI_API_KEY=sk-...` format or first column of CSV
- Keys stored in JS variables **in memory only** — never in localStorage, sessionStorage, or cookies
- Display a small "🔒 Memory only — never saved" badge near the key input
- Mask key after entry: show only last 6 chars (e.g., `••••••••••abc123`)
- Clear key button (×) next to masked display

---

## Output Modes

### Unstructured Mode
- System prompt (optional, collapsible): default `"You are a helpful medical education assistant."`
- User sends prompt → receives free-text response
- Display response in a clean card with Fraunces quote styling for first sentence
- Copy button on response

### Structured Mode
- JSON schema textarea — user defines the shape they want
- Send prompt + schema → model returns JSON matching schema
- Display raw JSON in a styled code block (syntax highlighting via simple CSS classes — no libraries)
- **Structured Output Validator** panel below: after response arrives, parse JSON and validate against schema field-by-field; show a table:
  | Field | Expected Type | Received | Status |
  |---|---|---|---|
  | `symptom` | string | "headache" | ✅ Match |
  | `severity` | integer | 7 | ✅ Match |
  | `missing_field` | string | — | ❌ Missing |
- Summary line: "4/5 fields matched" in accent color

---

## Example Prompts (Pre-Med Edition)

Pre-loaded in a dropdown — selecting one fills the prompt textarea:

**Unstructured prompts:**
1. "Explain the mechanism of action of beta-blockers and why they're used in heart failure."
2. "What is the difference between Type 1 and Type 2 diabetes at the cellular level?"
3. "Walk me through the steps of a physical exam for a patient presenting with chest pain."
4. "Explain how the kidneys regulate blood pressure using the renin-angiotensin-aldosterone system."
5. "What are the key differences between gram-positive and gram-negative bacteria in terms of structure and antibiotic targets?"

**Structured prompts (paired with schema templates):**
1. "Describe the drug ibuprofen" → schema: `{name, drug_class, mechanism, common_uses, side_effects, contraindications}`
2. "Summarize the condition myocardial infarction" → schema: `{condition, affected_organ, pathophysiology, symptoms, emergency_treatment}`
3. "Describe the muscle biceps brachii" → schema: `{muscle_name, origin, insertion, action, innervation, clinical_note}`
4. "Identify key facts about the element calcium in the human body" → schema: `{element, role_in_body, normal_serum_range, deficiency_condition, excess_condition}`

---

## JSON Schema Templates

Pre-loaded in a dropdown in Structured mode — selecting one fills the schema textarea:

1. **Drug Profile**
```json
{
  "type": "object",
  "properties": {
    "name": { "type": "string" },
    "drug_class": { "type": "string" },
    "mechanism": { "type": "string" },
    "common_uses": { "type": "array", "items": { "type": "string" } },
    "side_effects": { "type": "array", "items": { "type": "string" } },
    "contraindications": { "type": "array", "items": { "type": "string" } }
  },
  "required": ["name", "drug_class", "mechanism", "common_uses", "side_effects"]
}
```

2. **Medical Condition**
```json
{
  "type": "object",
  "properties": {
    "condition": { "type": "string" },
    "affected_organ": { "type": "string" },
    "pathophysiology": { "type": "string" },
    "symptoms": { "type": "array", "items": { "type": "string" } },
    "emergency_treatment": { "type": "string" }
  },
  "required": ["condition", "affected_organ", "pathophysiology", "symptoms"]
}
```

3. **Muscle OIA**
```json
{
  "type": "object",
  "properties": {
    "muscle_name": { "type": "string" },
    "origin": { "type": "string" },
    "insertion": { "type": "string" },
    "action": { "type": "string" },
    "innervation": { "type": "string" },
    "clinical_note": { "type": "string" }
  },
  "required": ["muscle_name", "origin", "insertion", "action", "innervation"]
}
```

4. **Custom** — blank textarea for user to write their own

---

## Stretch Features

### 1. Side-by-Side Comparison Mode
- Toggle button in the header: "Compare Models"
- When active: two provider/model selectors appear (Model A, Model B); each needs its own API key
- Send one prompt → fires both API calls simultaneously (Promise.all)
- Display responses in two side-by-side panels with model labels
- Metrics shown for each panel separately
- Only available for two OpenAI models (Anthropic CORS caveat applies)

### 2. Response Metrics
- Shown in a thin bar below each response panel
- Fields:
  - ⏱ Response time: measured from send → first response character (or full response if not streaming)
  - 🔢 Tokens used: from `usage.total_tokens` in API response (OpenAI returns this)
  - 📝 Characters: `response.length`
- Display as pill badges in `--text-3` color
- In comparison mode, show metrics for both panels

### 3. Prompt Library
- Small "💾 Save" button on the prompt textarea
- Saved prompts stored in a JS array in memory (lost on refresh — this is intentional; note it to user)
- "Library" drawer slides in from the right (CSS transform animation)
- Shows saved prompts as cards with: prompt preview (truncated), schema if saved with one, delete button
- Clicking a saved prompt loads it into the prompt + schema fields
- Max 20 saved prompts (oldest removed when full)
- Empty state: "No saved prompts yet. Send a prompt you like and save it here."

### 4. Structured Output Validator
- Already described in Structured Mode section above
- Additional feature: "Copy Report" button that copies the validation table as plain text
- If JSON parse fails entirely: show a red banner "Model returned invalid JSON — could not validate"

---

## Error Handling

| Scenario | Display |
|---|---|
| No API key | Inline warning below key field; Send button disabled |
| Invalid API key (401) | Red card: "Invalid API key. Check and re-enter." |
| Rate limit (429) | Orange card: "Rate limit reached. Wait a moment and try again." |
| Network error | Red card: "Network error. Check your connection." |
| Model returns invalid JSON (structured mode) | Red banner: "Invalid JSON returned — validation skipped." |
| Anthropic selected | Sage info card explaining CORS (not an error) |
| Empty prompt | Inline nudge: "Add a prompt to get started." |

All errors dismissible with ×.

---

## API Call Structure (OpenAI)

### Unstructured
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
      { role: "user", content: userPrompt }
    ],
    max_tokens: 1000
  })
})
```

### Structured
```js
// Include response_format with json_schema
body: JSON.stringify({
  model: selectedModel,
  messages: [
    { role: "system", content: "You are a helpful assistant. Respond ONLY with valid JSON matching the provided schema. No markdown, no backticks, just raw JSON." },
    { role: "user", content: `${userPrompt}\n\nRespond using this JSON schema:\n${schemaText}` }
  ],
  response_format: { type: "json_object" },
  max_tokens: 1000
})
```

Extract token usage: `data.usage.total_tokens`

---

## Responsive Design

- Desktop (>900px): two-column layout (controls left, output right)
- Tablet (600–900px): controls collapse to top accordion, output below
- Mobile (<600px): fully stacked, controls → output; Send button sticky at bottom

---

## Accessibility

- All inputs have labels
- Focus rings preserved (custom styled in accent color)
- ARIA labels on icon-only buttons
- Color is never the only indicator of state (icons + text always accompany color)

---

## Deployment

- Folder: `llm-switchboard/` inside NavyButterfly repo
- Entry point: `llm-switchboard/index.html`
- Live URL pattern: `https://aiml-1870-2026.github.io/NavyButterfly/llm-switchboard/`
- No API keys committed to repo — keys entered at runtime only
