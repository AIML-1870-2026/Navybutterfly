# Weather Dashboard Quest — spec.md
## Assignment: AIML 1870, Q2 — "The Weather Report"

---

## Concept

A vintage 1940s–50s newspaper-style weather dashboard. The aesthetic is aged newsprint:
cream/tan paper background, black ink typography, ruled column dividers, double-border
section headers, and typewriter-style fonts. The page feels like an official meteorological
dispatch printed for public distribution.

---

## Tech Stack

- **Single HTML file** (`index.html`) — HTML + CSS + vanilla JS, no frameworks
- **Deployed to GitHub Pages** under the AIML-1870-2026/NavyButterfly repo
- **API:** OpenWeatherMap (free tier)
  - Current weather: `https://api.openweathermap.org/data/2.5/weather`
  - 5-day forecast: `https://api.openweathermap.org/data/2.5/forecast`
  - Air quality: `http://api.openweathermap.org/data/2.5/air_pollution`
  - UV index is included in the current weather response (`uvi` field from One Call, or
    use the `uv` field available via `https://api.openweathermap.org/data/2.5/uvi`)

---

## API Key

Store it as a constant at the top of the `<script>` block:

```js
const API_KEY = "YOUR_KEY_HERE"; // replace with real key before submitting
```

Every fetch URL appends `&appid=${API_KEY}`. No other auth needed.

---

## Features (Required)

1. **City search** — text input, user types a city name and presses Enter or clicks
   "Dispatch". Fetches current weather for that city.
2. **°F / °C pill toggle** — two-segment pill switch. Default °F. Toggling re-renders
   all temperatures without a new API call (convert client-side from Kelvin or store
   both unit values).
3. **Geolocation** — "Locate" button uses `navigator.geolocation.getCurrentPosition()`
   to get lat/lon, then fetches weather by coordinates instead of city name.

---

## Features (Stretch — all four)

4. **5-day forecast strip** — use the `/forecast` endpoint (returns 3-hour intervals).
   Group by day, show high/low + weather icon for each of the next 5 days.
5. **Air Quality Index** — use the `/air_pollution` endpoint (requires lat/lon).
   After fetching current weather by city, use the returned coordinates to fetch AQI.
   Display AQI number, category label (Good / Moderate / Unhealthy etc.), and a
   color-coded progress bar.
6. **UV Index** — displayed as its own featured column. Show the numeric UV index,
   a categorical label (Low / Moderate / High / Very High / Extreme), a 5-pip color
   scale (green → yellow → orange → red → violet), and sun protection tips that
   update based on the level. UV is included in the OpenWeatherMap One Call API
   response, or fetch separately from `/uvi` endpoint.
7. **Weather-reactive background** — a subtle sky gradient behind the whole page
   that changes based on current conditions. Map weather condition codes to sky colors:
   - Clear/sunny → warm gold-blue gradient
   - Clouds/partly cloudy → muted grey-blue
   - Rain/drizzle → dark steel blue
   - Thunderstorm → deep purple-grey
   - Snow → pale white-blue
   - Mist/fog → flat warm grey
   The gradient should be subtle (low opacity overlay), not overwhelming the newsprint aesthetic.

---

## Layout

Three-column newspaper grid, inside a max-width ~820px centered container:

```
┌─────────────────────────────────────────────────────┐
│           THE WEATHER REPORT  (masthead)            │
│  Vol. LXXXIII · No. 85    Thursday, March 26, 1953  │
├─────────────────────────────────────────────────────┤
│  Station: [city input]  [°F|°C]  [Locate] [Dispatch]│
├──────────────────┬──────────────┬───────────────────┤
│ Current          │ Air Quality  ║  ★ UV Index ★     │
│ Conditions       │ Index        ║  (featured col)   │
│                  │              ║                   │
│ BIG TEMP NUMBER  │ AQI number   ║  BIG UV NUMBER    │
│ Condition desc   │ Good/Mod/etc ║  Moderate badge   │
│ Feels like...    │ PM2.5, PM10  ║  pip scale        │
│ Wind / Pressure  │ Ozone / NO₂  ║  sun tips         │
│ Dew Pt / Humid   │ bar gauge    ║                   │
├──────────────────┴──────────────┴───────────────────┤
│  Five-Day Forecast  (5 equal columns)               │
│  Day | icon | high | low  ×5                        │
├─────────────────────────────────────────────────────┤
│  Teletype footer: station · time · next bulletin    │
└─────────────────────────────────────────────────────┘
```

The UV column has a heavier left border (3px solid black) and an inverted black banner
header ("★ UV Index Report ★") to distinguish it as the featured story.

---

## Visual Design

### Fonts (load from Google Fonts)
- **Special Elite** — masthead title, big numbers (temp, AQI, UV), forecast day highs,
  section headers
- **IBM Plex Mono** — all other text: labels, stats, tips, footer, inputs, buttons

### Color palette (newsprint)
```css
--paper:     #f2ead8;   /* aged newsprint background */
--ink:       #1a1208;   /* deep black ink */
--ink-mid:   #4a3c20;   /* muted brown-black for secondary text */
--ink-faint: #6a5a38;   /* faint ink for tertiary text */
--rule:      #8a7a58;   /* column rule / divider lines */
--paper-mid: #ddd4b0;   /* slightly darker paper for recessed fields */
--aqi-good:  #2a6a1a;   /* green for AQI Good */
--uv-orange: #c25a00;   /* burnt orange for UV index number */
```

### UV pip scale colors (hardcoded, not CSS vars — physical meaning)
```
pip 1 (UV 0–2 Low):       #4caf50  green
pip 2 (UV 3–5 Moderate):  #8bc34a  yellow-green
pip 3 (UV 6–7 High):      #ffeb3b  yellow
pip 4 (UV 8–10 Very High):#ff9800  orange
pip 5 (UV 11+ Extreme):   #f44336  red
```

### Structural details
- Outer border: `1px solid #b8a880`
- Section dividers: `border-top: 2px solid #1a1208`
- Column rules: `border-right: 1px solid #8a7a58`
- Masthead: `border-top: 4px solid; border-bottom: 4px double`
- Stat grid: `1px` gap creating hairline rules between cells (gap fills with `#8a7a58`
  background on grid container)
- Forecast strip: same hairline grid treatment
- Inputs: no border-radius (square corners, newspaper feel)
- Buttons: square corners, black fill for primary, paper fill for secondary
- UV column left border: `3px solid #1a1208` (heavier, editorial emphasis)

### Noise / paper texture
Add a faint repeating SVG noise pattern as a pseudo-element or inline background-image
on `.wb-root` to simulate paper grain. Keep opacity ≤ 0.4.

### Sky reactive background
Position: absolute, inset 0, z-index 0, opacity 0.15–0.20. Change via JS by
setting a CSS class or inline `background` on `.sky-bg` element after weather loads.

---

## JavaScript Architecture

```
index.html
└── <script>
    ├── const API_KEY = "..."
    ├── state = { city, lat, lon, unit: 'imperial', weatherData, forecastData, aqiData }
    ├── fetchWeather(city | {lat,lon})
    │   ├── fetch /weather → store current
    │   ├── fetch /forecast → store 5-day
    │   └── fetch /air_pollution (using coords from weather response)
    ├── renderCurrent(data)
    ├── renderForecast(data)
    ├── renderAQI(data)
    ├── renderUV(uvIndex)
    ├── updateSkyBackground(weatherCode)
    ├── toggleUnits()   ← re-renders temps client-side, no new fetch
    └── event listeners: search input (Enter), Dispatch btn, Locate btn, toggle pill
```

Store Kelvin temps from the API and convert at render time:
```js
const toF = k => Math.round((k - 273.15) * 9/5 + 32);
const toC = k => Math.round(k - 273.15);
```

---

## UV Index Logic

```js
function uvCategory(uv) {
  if (uv <= 2)  return { label: 'Low',       pips: 1, color: '#4caf50', tips: [...] };
  if (uv <= 5)  return { label: 'Moderate',  pips: 2, color: '#8bc34a', tips: [...] };
  if (uv <= 7)  return { label: 'High',      pips: 3, color: '#ffeb3b', tips: [...] };
  if (uv <= 10) return { label: 'Very High', pips: 4, color: '#ff9800', tips: [...] };
  return        { label: 'Extreme',  pips: 5, color: '#f44336', tips: [...] };
}
```

Sun tips examples by level:
- Low: No protection needed · Safe to be outside
- Moderate: Wear SPF 30+ · Seek shade at midday
- High: SPF 30+ required · Cover up · Peak hours 10am–4pm
- Very High: SPF 50+ · Limit midday exposure · Hat & sunglasses
- Extreme: Avoid sun 10am–4pm · Full cover · SPF 50+ every 2hrs

---

## AQI Category Logic

```js
function aqiCategory(aqi) {
  // OpenWeatherMap AQI scale: 1=Good, 2=Fair, 3=Moderate, 4=Poor, 5=Very Poor
  const labels = ['', 'Good', 'Fair', 'Moderate', 'Poor', 'Very Poor'];
  const colors = ['', '#2a6a1a', '#8bc34a', '#f0a500', '#d84315', '#7b1fa2'];
  return { label: labels[aqi], color: colors[aqi], pct: (aqi / 5) * 100 };
}
```

---

## Error Handling

- City not found → show inline message in the conditions column: "No station data
  found for [city]. Check spelling and try again."
- Geolocation denied → show: "Location access denied. Please enter a city manually."
- API failure → show: "Transmission error. Please try again."
- On load, default to Omaha, NE so the page isn't blank.

---

## Footer / Dateline

- Masthead dateline: show today's actual date formatted as `Thursday, March 26, 1953`
  style — use JS `new Date()` for the real date but keep the vintage styling
- Vol./No.: can be static flavor text
- Footer teletype line: `"Teletype transmission · [City] · Report issued [HH:MM local] · Next bulletin [HH+3:00]"`

---

## File Structure

```
Assignment-11/
├── index.html     ← structure and markup only, links to style.css and script.js
├── style.css      ← all styling: newsprint theme, layout, column grid, UV/AQI/forecast
└── script.js      ← all logic, organized in labeled sections:
│                     1. Constants (API_KEY, unit state)
│                     2. Fetch helpers (fetchWeather, fetchForecast, fetchAQI)
│                     3. Render functions (renderCurrent, renderForecast, renderAQI, renderUV)
│                     4. Sky background (updateSkyBackground by weather code)
│                     5. Unit toggle (toggleUnits — no new fetch, convert client-side)
│                     6. Geolocation (handleLocate)
│                     7. Event listeners (search input, Dispatch btn, Locate btn, toggle pill)
│                     8. Init (load default city on page open)
```

No build tools. No npm. Three plain files linked normally — `index.html` links
`<link rel="stylesheet" href="style.css">` and `<script src="script.js"></script>`.

---

## Submission Checklist

- [ ] City search works
- [ ] °F/°C toggle works (both directions, all temps update)
- [ ] Geolocation "Locate" button works
- [ ] 5-day forecast renders with correct highs/lows
- [ ] AQI column populated with real data
- [ ] UV Index featured column with pips + tips
- [ ] Sky background changes with weather conditions
- [ ] Deployed to GitHub Pages
- [ ] API key in the file (expected for this assignment)
- [ ] Default city loads on page open (no blank state)
