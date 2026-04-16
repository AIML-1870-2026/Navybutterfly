# spec.md — Drug Safety Explorer
## AIML 1870 | Code Quest Assignment

---

## Project Overview

**Name:** Drug Safety Explorer  
**Type:** Single-page web application (HTML / CSS / JS — three separate files)  
**Deployment:** GitHub Pages (AIML-1870-2026 org, NavyButterfly repo)  
**Data Source:** OpenFDA public API (no key required)  
**Aesthetic:** Clean, approachable, clinical-but-human — muted teal/slate blue accent palette, generous whitespace, soft card shadows, friendly explanatory copy throughout

---

## File Structure

```
index.html
style.css
script.js
```

No build tools. No frameworks. Vanilla HTML/CSS/JS only.

---

## Design System

### Color Palette (CSS variables)
```css
--bg:           #f7f8fa        /* near-white page background */
--surface:      #ffffff        /* card/panel background */
--border:       #e2e6ea        /* subtle card borders */
--sidebar-bg:   #1e2d3d        /* deep navy sidebar */
--sidebar-text: #a8bfd4        /* muted sidebar labels */
--accent:       #2d8c9e        /* primary teal */
--accent-light: #e6f4f7        /* tint for highlights */
--accent-dark:  #1f6b7a        /* hover/active state */
--text-primary: #1a2332        /* headings */
--text-body:    #4a5568        /* body copy */
--text-muted:   #8a9bb0        /* captions, labels */
--danger:       #c0392b        /* Class I recalls, severe */
--warning:      #e67e22        /* Class II recalls */
--safe:         #27ae60        /* Class III / low severity */
--chart-1:      #2d8c9e
--chart-2:      #5ba8b5
--chart-3:      #8ec4cc
--chart-4:      #b8dde3
--chart-5:      #d4ecf0
```

### Typography
- **Display / Headers:** `'DM Serif Display'` (Google Fonts) — warm, trustworthy, editorial feel
- **Body / UI:** `'DM Sans'` (Google Fonts) — clean, readable, pairs perfectly with DM Serif
- **Monospace / Data:** `'JetBrains Mono'` (Google Fonts) — for drug names in code-like contexts, counts

### Layout
- **Sidebar:** 240px fixed left, full viewport height, dark navy (`--sidebar-bg`)
- **Main content area:** fills remaining width, scrollable
- **Content max-width:** 1100px centered within main area
- **Card padding:** 24px
- **Section gap:** 24px

---

## Application Structure

### Sidebar (persistent, always visible)

Contains:
- App name: **"Drug Safety Explorer"** in DM Serif Display, white, 18px
- Tagline: *"Powered by OpenFDA"* in muted text, 11px
- Divider
- Navigation items (icon + label each):
  - 🔍 Drug Lookup
  - ⚖️ Compare Drugs
  - 🧬 Drug Classes
  - 📋 Recall Timeline
- Divider at bottom
- Small "ⓘ About This Tool" link that opens the global help modal

Active nav item: teal left border + teal text + light teal background pill

---

## Mode 1: Drug Lookup (default view on load)

### Purpose
Deep dive into a single drug — surfaces adverse events, label warnings, and recall history all in one place.

### Layout
- Search bar at top: text input + "Search" button. Placeholder: *"e.g. ibuprofen, warfarin, metformin"*
- On load: pre-populated with **"warfarin"** so users see results immediately
- Results appear below in three stacked cards

### Card 1 — Label Warnings
**API:** `GET https://api.fda.gov/drug/label.json?search=openfda.generic_name:"DRUG"&limit=1`

Display (from the first result):
- Drug name (brand + generic) as card header
- **Warnings** section text (truncated to ~300 chars with "Read more" toggle)
- **Drug Interactions** section text (truncated similarly)
- **Adverse Reactions** section text (truncated)
- **Contraindications** if present
- Each field in its own labeled subsection with a subtle left border in `--accent`
- Help button (ⓘ) next to "Drug Interactions" header → opens "What Drug Labels Actually Tell You" modal

### Card 2 — Adverse Events
**API:** `GET https://api.fda.gov/drug/event.json?search=patient.drug.medicinalproduct:"DRUG"&count=patient.reaction.reactionmeddrapt.exact&limit=10`

Display:
- Horizontal bar chart (Canvas API) — top 10 reported reactions, bars colored in teal gradient
- Below chart: small note in muted text: *"Based on [N] voluntary reports in FAERS. Report counts do not indicate drug safety or causation."*
- Help button (ⓘ) next to section header → opens "How to Interpret Adverse Event Data" modal
- Total report count shown as a large stat number above the chart

### Card 3 — Recall History
**API:** `GET https://api.fda.gov/drug/enforcement.json?search=product_description:"DRUG"&limit=10&sort=report_date:desc`

Display:
- List of recall entries, each showing:
  - Date (formatted nicely)
  - Reason for recall (truncated to 120 chars)
  - Classification badge: **Class I** (red), **Class II** (orange), **Class III** (green)
  - Recalling firm
- If no recalls found: friendly empty state — *"No active recalls found for this drug."* with a checkmark icon
- Help button (ⓘ) next to section header → opens "Understanding Recall Classifications" modal

### Error States
- Drug not found: *"No results found for '[query]'. Try a generic name (e.g. 'ibuprofen' instead of 'Advil')."*
- API error: *"Unable to reach OpenFDA. Please try again in a moment."*
- All API calls wrapped in try/catch with graceful UI feedback

---

## Mode 2: Compare Drugs

### Purpose
Side-by-side comparison of two drugs across safety categories.

### Layout
- Two search inputs side by side ("Drug A" / "Drug B") + "Compare" button
- Pre-populated on load: **Drug A = "warfarin"**, **Drug B = "ibuprofen"**
- Tab bar below the inputs: **Warnings | Adverse Events | Recalls**
- Active tab content renders in a two-column grid (Drug A left, Drug B right)
- Column headers show drug name in teal

### Tab: Warnings
Same label data as Mode 1, but rendered in two columns. Fields shown side by side.

### Tab: Adverse Events
Two bar charts side by side (same scale if possible). Each chart shows top 8 reactions. Help button (ⓘ) → "Why Some Drugs Have More Reports Than Others" modal.

### Tab: Recalls
Two recall lists side by side. Classification badges same as Mode 1.

### Responsive behavior
On narrow screens, columns stack vertically.

---

## Mode 3: Drug Classes

### Purpose
Explore entire drug classes — compare safety profiles of related medications within a class.

### Layout
- Pill selector at top to choose a drug class
- Pre-built drug class definitions (hardcoded):

```js
const DRUG_CLASSES = {
  "SSRIs": ["fluoxetine", "sertraline", "escitalopram", "paroxetine", "citalopram"],
  "Statins": ["atorvastatin", "simvastatin", "rosuvastatin", "lovastatin", "pravastatin"],
  "ACE Inhibitors": ["lisinopril", "enalapril", "ramipril", "captopril", "benazepril"],
  "NSAIDs": ["ibuprofen", "naproxen", "celecoxib", "diclofenac", "meloxicam"],
  "Beta Blockers": ["metoprolol", "atenolol", "carvedilol", "propranolol", "bisoprolol"],
  "Benzodiazepines": ["alprazolam", "diazepam", "lorazepam", "clonazepam", "temazepam"]
};
```

- On class selection, fire parallel API calls for all drugs (Promise.all)
- Loading state: skeleton shimmer cards while data loads

### Display — Three sub-sections:

**1. Adverse Event Comparison**
Horizontal bar chart — one bar per drug showing total FAERS report count. Sorted descending. Teal gradient. Reporting bias note + help button.

**2. Recall Summary**
Table: Drug name | Total Recalls | Most Recent Recall Date | Worst Classification. Color-coded classification column.

**3. Class Context Card**
Static informational card (hardcoded per class) with:
- How this drug class works (1–2 sentences, plain language)
- A known class-wide interaction warning
- Common use cases

Help button → "Drug Pairs with Known Dangerous Interactions" modal

---

## Mode 4: Recall Timeline

### Purpose
Chronological view of recall history — searchable by drug name, or browse recent recalls.

### Layout
- Search bar: *"Search recalls by drug name..."* — defaults to showing last 25 recalls across all drugs if empty
- "Search" button

**API (no filter):** `GET https://api.fda.gov/drug/enforcement.json?limit=25&sort=report_date:desc`  
**API (with filter):** `GET https://api.fda.gov/drug/enforcement.json?search=product_description:"DRUG"&limit=25&sort=report_date:desc`

### Timeline Display
Vertical timeline — date axis on left, recall cards on right.

Each recall card:
- **Date** — large, teal, DM Serif Display
- **Drug / Product name** — bold
- **Recalling firm**
- **Classification badge** — Class I (red) / Class II (orange) / Class III (green), prominent pill
- **Reason** — full text
- Subtle connecting line between cards on the left axis

Summary row at top:
*"Showing [N] recalls | [X] Class I · [Y] Class II · [Z] Class III"*

Classification legend at top. Help button → "Understanding Recall Classifications" modal.

---

## Help Modals (Stretch Challenge #1)

All modals share the same structure. Triggered by ⓘ buttons throughout the UI.

### Modal Structure
- Backdrop: semi-transparent dark overlay, click-outside to close
- Modal card: white, 540px max-width, centered, soft shadow, rounded corners
- Header: icon + title in DM Serif Display
- Body: DM Sans, 15px, `--text-body`, line-height 1.7
- Close button (×) top right
- Keyboard: Escape to close
- Smooth CSS fade-in animation

### Help Topics

**1. How to Interpret Adverse Event Data**
FAERS reports are voluntary. A report linking a drug to a side effect does not prove causation. Drugs taken by millions naturally have more reports. Use this data to spot patterns, not to make safety judgments.

**2. Understanding Recall Classifications**
Class I: reasonable probability of serious adverse health consequences or death (e.g., dangerous contamination). Class II: may cause temporary harm or remote probability of serious harm (e.g., labeling errors). Class III: unlikely to cause adverse health consequences (e.g., minor packaging defects).

**3. Drug Pairs with Known Dangerous Interactions**
Well-established dangers: Warfarin + NSAIDs (bleeding risk), MAO inhibitors + SSRIs (serotonin syndrome), Methotrexate + NSAIDs (methotrexate toxicity), Grapefruit juice + statins/calcium channel blockers (dangerously elevated drug levels).

**4. What Drug Labels Actually Tell You**
FDA drug labels are official, legally-reviewed prescribing information written for clinicians. The warnings section reflects FDA determinations based on clinical trial data and post-market surveillance. Labels update when new safety information emerges.

**5. Why Some Drugs Have More Reports Than Others**
A drug taken by 50 million people will have far more adverse event reports than one taken by 50,000 — even if the rarer drug is more dangerous. This is reporting bias. Report volume reflects usage prevalence as much as risk profile.

**6. About This Tool** (from sidebar link)
This tool queries the FDA's publicly available OpenFDA database in real time. For educational purposes only — not a substitute for medical advice. Always consult a licensed healthcare provider. This product uses publicly available data from the U.S. Food and Drug Administration (FDA). FDA is not responsible for the product and does not endorse or recommend this or any other product.

---

## Visual Charts (Stretch Challenge #2)

All charts built with the HTML Canvas API (no external libraries).

### Adverse Event Bar Chart
- Horizontal bars
- Y-axis: reaction names (truncated to 28 chars if needed)
- X-axis: report count
- Bars: teal gradient cycling through `--chart-1` to `--chart-5`
- Hover tooltip: exact count
- Animate bars growing from 0 on render (300ms ease-out via requestAnimationFrame)
- Canvas height: auto-calculated (40px per bar + padding)

### Drug Class Comparison Chart
- Same horizontal bar style
- One bar per drug in the class
- Sorted descending by report count
- Label: generic drug name

---

## Loading & Empty States

- **Loading:** CSS skeleton shimmer animation on card bodies while API calls resolve
- **Empty / no data:** Friendly message with icon — e.g. *"No recalls found. That's actually good news."*
- **API failure:** Soft yellow warning banner: *"Couldn't load data from OpenFDA. Please try again."*
- **Partial failure:** If one of three API calls fails, show the other two. Don't blank the whole page.

---

## API Reference Summary

Base URL: `https://api.fda.gov`

| Endpoint | Used In | Notes |
|---|---|---|
| `/drug/label.json?search=openfda.generic_name:"DRUG"&limit=1` | Lookup, Compare | Fall back to `openfda.brand_name` if no results |
| `/drug/event.json?search=patient.drug.medicinalproduct:"DRUG"&count=patient.reaction.reactionmeddrapt.exact&limit=10` | Lookup, Compare, Classes | Returns top reactions by count |
| `/drug/enforcement.json?search=product_description:"DRUG"&limit=25&sort=report_date:desc` | Lookup, Compare, Timeline | URL-encode drug names |
| `/drug/enforcement.json?limit=25&sort=report_date:desc` | Timeline (no filter) | Recent recalls across all drugs |
| `/drug/event.json?search=patient.drug.medicinalproduct:"DRUG"&limit=1` | Classes | Use `meta.results.total` for total count |

### Standard Fetch Pattern
```js
async function fetchFDA(endpoint) {
  try {
    const res = await fetch(`https://api.fda.gov${endpoint}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.error('OpenFDA error:', err);
    return null;
  }
}
```

---

## Accessibility & Polish

- All interactive elements keyboard-navigable (logical tab order)
- Focus styles: visible teal outline
- Color never the only indicator — classification badges include text labels alongside color
- `aria-label` on icon-only buttons
- Smooth scroll behavior
- Sidebar nav items have `title` tooltips

---

## Footer (persistent, bottom of main content area)

Muted small text:

> This product uses publicly available data from the U.S. Food and Drug Administration (FDA). FDA is not responsible for the product and does not endorse or recommend this or any other product. For educational purposes only. Not a substitute for professional medical advice.
