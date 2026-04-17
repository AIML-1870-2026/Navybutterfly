# Spec: The Velvet Room — AI Agent Edition
**Assignment:** AI Agent Blackjack Quest  
**Structure:** Three files — `index.html`, `style.css`, `script.js`  
**Aesthetic:** Faithful recreation of The Velvet Room (1920s speakeasy, art deco, Ace Eddie Marlowe)  
**New additions:** AI agent layer, bug fixes, CSS polish  

---

## Project Structure

```
Assignment-16/
├── index.html       ← markup only, no inline styles or scripts
├── style.css        ← all styles
├── script.js        ← all game logic + AI agent logic
└── temp/
    ├── index.html   ← reference implementation (.env upload + Anthropic API fetch)
    └── .env.example ← shows expected format: ANTHROPIC_API_KEY=sk-ant-...
```

> **IMPORTANT:** The `temp/` folder is a working reference only. Do NOT link to or deploy it. It exists so Claude Code can study the `.env` parse pattern and the `fetch()` call structure before building the real thing.

---

## Reference Implementation (`temp/`)

Build a minimal working page in `temp/index.html` that:
- Has a file input for `.env` upload
- Reads the file in-memory (no server, no storage)
- Parses `ANTHROPIC_API_KEY=sk-ant-...` from the file text
- Makes a single `fetch()` POST to `https://api.anthropic.com/v1/messages` using that key
- Sends a hardcoded test prompt and displays the response
- Logs the raw API response to console
- Handles errors gracefully (bad key, network failure, malformed response)

This is the canonical pattern. The main game will replicate it exactly.

---

## Visual Design (unchanged from original Velvet Room)

### Color Palette
```css
--bg:         #1a0f0a   /* near-black espresso */
--felt:       #1b4332   /* deep casino green */
--gold:       #c9a84c   /* aged gold */
--gold-40:    rgba(201,168,76,0.40)
--gold-20:    rgba(201,168,76,0.20)
--gold-10:    rgba(201,168,76,0.10)
--cream:      #f5f0e8   /* aged cream */
--burgundy:   #6b1a1a
--chip-red:   #8b1a1a
--chip-green: #1b5e3b
--chip-black: #1a1a1a
--result-win: #c9a84c
--result-lose:#cc3333
```

### Typography
- **Playfair Display** — headers, Eddie's name, buttons, hand labels
- **EB Garamond** — body text, Eddie's speech, flavor text
- **Courier Prime** — scores, bet amounts, monospace data

### Preserved Aesthetic Elements
- Fixed art deco page frame (double-border `inset: 7px` outer, `inset: 12px` inner hairline)
- Four SVG corner ornaments (gold polygon deco, same SVG as original)
- Warm amber radial vignette overlay (`body::after`)
- Deep green felt center with crosshatch diamond texture pattern
- Inner hairline ring inside the felt oval
- Entry screen: gold-bordered box, corner diamonds, `swordfish` password (any non-empty input accepted per original — removed strict validation), fade transition into game
- Eddie Marlowe SVG portrait (fedora silhouette, same art)
- Poker chip buttons: ivory $1, red $5, green $25, black $100

---

## Layout

```
┌─────────────────────────────────────────────────┐  ← art deco frame
│            🎴 THE VELVET ROOM 🎴                │  ← header
│              Est. 1923 — Members Only           │
├─────────────────────────────────────────────────┤  ← g-rule
│  [Eddie portrait]  "Eddie's line here..."       │  ← eddie-section
├─────────────────────────────────────────────────┤  ← g-rule
│  DEALER  [score]   [card] [card]                │  ← dealer hand section
├─────────────────────────────────────────────────┤
│                                                 │
│         [        FELT CENTER        ]           │  ← result banner lives here
│         [   EST. 1923 watermark     ]           │
│                                                 │
├─────────────────────────────────────────────────┤
│  PLAYER  [score]   [card] [card]                │  ← player hand section
├─────────────────────────────────────────────────┤  ← g-rule
│  ┌─────────────────────────────────────────┐    │
│  │  🤖 AI ANALYSIS                         │    │  ← AI agent panel (NEW)
│  │  [.env upload btn]  [API status dot]    │    │
│  │  ─────────────────────────────────────  │    │
│  │  Recommendation: [ STAND ]              │    │
│  │  "Reasoning text from Claude here..."   │    │
│  │  [ Execute Recommendation ]             │    │
│  └─────────────────────────────────────────┘    │
├─────────────────────────────────────────────────┤  ← g-rule
│  Bet: $25        Balance: $500                  │  ← bet/balance bar
│  [chip $1] [chip $5] [chip $25] [chip $100]  [Clear Bet]
├─────────────────────────────────────────────────┤
│  [ DEAL ]  [ HIT ]  [ STAND ]  [ DOUBLE ]  [ SPLIT ]
└─────────────────────────────────────────────────┘
```

---

## HTML Structure (`index.html`)

Markup only — link to `style.css` and `script.js`. No inline styles or `<script>` tags.

Sections in order:
1. `<link>` to Google Fonts (Playfair Display, EB Garamond, Courier Prime)
2. `<link rel="stylesheet" href="style.css">`
3. Art deco frame div + 4 corner SVGs
4. `#entry-screen` — password screen
5. `#game-screen` — main game (hidden until password entered)
   - `#game-header`
   - `.g-rule`
   - `#eddie-section` (portrait + bubble)
   - `.g-rule`
   - `#dealer-section` (hand-meta + cards-row)
   - `#felt-center` (contains `#result-banner`)
   - `#player-section` (hand-meta + cards-row + split wrap)
   - `.g-rule`
   - `#ai-panel` (NEW — see AI Agent Panel section below)
   - `.g-rule`
   - `#betting-area` (bet/balance bar + chips + clear)
   - `#action-buttons` (deal, hit, stand, double, split)
6. `#gameover-screen`
7. `<script src="script.js">`

---

## AI Agent Panel (`#ai-panel`) — NEW

This panel sits between the player hand and the betting area.

### HTML Structure
```html
<div id="ai-panel">
  <div id="ai-panel-header">
    <span id="ai-panel-title">🤖 AI Analysis</span>
    <div id="ai-status-row">
      <span id="ai-status-dot" class="dot-inactive"></span>
      <span id="ai-status-label">No API key loaded</span>
      <label id="env-upload-label" for="env-file-input">Upload .env</label>
      <input type="file" id="env-file-input" accept=".env" style="display:none">
    </div>
  </div>
  <div id="ai-divider"></div>
  <div id="ai-content">
    <div id="ai-recommendation-row">
      <span id="ai-rec-label">Recommendation:</span>
      <span id="ai-rec-badge" class="rec-none">—</span>
    </div>
    <p id="ai-reasoning">Upload a .env file with your ANTHROPIC_API_KEY to enable the AI agent.</p>
    <button id="ai-execute-btn" disabled>Execute Recommendation</button>
  </div>
</div>
```

### AI Panel Visual Styling
- Background: `rgba(0,0,0,0.32)` with `border: 1px solid var(--gold-20)`
- Panel title: Playfair Display, gold, small caps, `0.72rem`, letter-spacing
- Status dot: 8px circle — grey when no key, amber pulsing when key loaded, green flash on successful call
- `.env` upload label styled as a small ghost button (same style as Clear Bet)
- Divider: `1px solid var(--gold-20)` horizontal line
- Recommendation badge: pill-shaped, Courier Prime monospace
  - `rec-none`: grey, `—`
  - `rec-hit`: burgundy background, cream text, `HIT`
  - `rec-stand`: felt-green background, cream text, `STAND`
  - `rec-double`: gold background, dark text, `DOUBLE`
  - `rec-split`: deep blue-grey background, cream text, `SPLIT`
  - `rec-loading`: muted, animated ellipsis `...`
- Reasoning text: EB Garamond italic, cream, 0.88rem, line-height 1.5
- Execute button: same `.action-btn` style as game buttons but with a gold left border accent; disabled until a recommendation is ready; hidden during BETTING state

### AI Panel States
- **No key:** reasoning = "Upload a .env file with your ANTHROPIC_API_KEY to enable the AI agent." Execute btn hidden.
- **Key loaded, waiting for deal:** reasoning = "Deal a hand and I'll analyze your position." Execute btn hidden.
- **Loading (API call in flight):** badge = `rec-loading` with animated `...`, reasoning = "Consulting the odds..." Execute btn disabled.
- **Ready:** badge shows action, reasoning shows Claude's explanation. Execute btn enabled.
- **BETTING state:** entire `#ai-content` area is dimmed (`opacity: 0.4`), execute btn hidden, badge reset to `—`.

---

## AI Agent Logic (in `script.js`)

### .env Parsing
```javascript
// When file input changes:
const reader = new FileReader();
reader.onload = (e) => {
  const text = e.target.result;
  const match = text.match(/ANTHROPIC_API_KEY\s*=\s*([^\s\n\r]+)/);
  if (match) {
    apiKey = match[1].trim();
    // Update status dot to loaded state
    // Log to console: "[AI Agent] API key loaded successfully."
  } else {
    // Log to console: "[AI Agent] No ANTHROPIC_API_KEY found in .env file."
  }
};
reader.readAsText(file);
```

Key is stored in a module-scoped variable `let apiKey = null`. It is NEVER stored in localStorage, sessionStorage, or sent anywhere except the Anthropic API call.

### API Call — Structured JSON Output

Called automatically after every deal (once player and dealer cards are visible). Also callable manually if needed.

**Prompt structure:**
```javascript
async function consultAIAgent(playerHand, dealerUpCard, playerTotal, isSoftHand, canDouble, canSplit) {
  if (!apiKey) return;

  // Set panel to loading state
  setAILoading();
  console.log('[AI Agent] Consulting Claude...');
  console.log('[AI Agent] Game state:', { playerHand, dealerUpCard, playerTotal, isSoftHand, canDouble, canSplit });

  const systemPrompt = `You are an expert Blackjack strategy advisor. 
Analyze the given game state and respond with ONLY a valid JSON object — no preamble, no markdown, no explanation outside the JSON.
The JSON must have exactly this shape:
{
  "action": "hit" | "stand" | "double" | "split",
  "confidence": "high" | "medium" | "low",
  "reasoning": "One or two sentences explaining the recommendation in the style of a seasoned 1920s card dealer."
}`;

  const userPrompt = `Player hand: ${playerHand}
Player total: ${playerTotal} (${isSoftHand ? 'soft' : 'hard'})
Dealer up card: ${dealerUpCard}
Double available: ${canDouble}
Split available: ${canSplit}
What is the optimal play?`;

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 256,
        system: systemPrompt,
        messages: [{ role: 'user', content: userPrompt }]
      })
    });

    const data = await response.json();
    console.log('[AI Agent] Raw API response:', data);

    const raw = data.content?.[0]?.text || '';
    console.log('[AI Agent] Raw text:', raw);

    // Strip any accidental markdown fences before parsing
    const cleaned = raw.replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(cleaned);
    console.log('[AI Agent] Parsed recommendation:', parsed);

    setAIRecommendation(parsed.action, parsed.reasoning, parsed.confidence);

  } catch (err) {
    console.error('[AI Agent] Error:', err);
    setAIError('Something went wrong. Check console for details.');
  }
}
```

### Execute Recommendation Button

When clicked, fires the recommended action programmatically:
```javascript
document.getElementById('ai-execute-btn').addEventListener('click', () => {
  if (!currentAIAction) return;
  console.log('[AI Agent] Executing recommendation:', currentAIAction);
  switch (currentAIAction) {
    case 'hit':    hitBtn.click();    break;
    case 'stand':  standBtn.click();  break;
    case 'double': doubleBtn.click(); break;
    case 'split':  splitBtn.click();  break;
  }
  // Reset panel to waiting state
  resetAIPanel();
});
```

### When to Call the Agent
- Automatically after the initial deal completes (after the 4-card deal sequence finishes and it's confirmed NOT a blackjack situation)
- After each hit (re-evaluate the new hand)
- After advancing to the next split hand
- Do NOT call during dealer play or after round is complete

### Console Logging Requirements (per assignment spec)
Every AI interaction must log:
1. `[AI Agent] API key loaded successfully.`
2. `[AI Agent] Consulting Claude...` + game state object
3. `[AI Agent] Raw API response:` + full response object
4. `[AI Agent] Raw text:` + the text content
5. `[AI Agent] Parsed recommendation:` + parsed JSON
6. `[AI Agent] Executing recommendation:` + action string
7. Any errors: `[AI Agent] Error:` + error object

---

## Bug Fixes (all must be implemented)

### BUG 1 & 2 — Payout: Win doesn't return bet; Push doesn't return bet (Q1: -5)

**Root cause:** The bet is deducted from balance at deal time (`balance -= currentBet`). The `delta` in `resolveRound` must therefore return the *full payout including the original stake*, not just the net profit.

**Fix — replace the entire delta logic in `resolveRound`:**
```javascript
// BUST
delta = 0;  // bet already lost at deal time, nothing to return

// PUSH (both blackjack or equal totals)
delta = bet;  // return the original stake

// Player blackjack (natural, not from split)
delta = bet + Math.floor(bet * 1.5);  // return stake + 1.5x profit

// Dealer blackjack (player loses)
delta = 0;  // stake already gone

// Player wins (dealer bust OR player total > dealer total)
delta = bet * 2;  // return stake + equal profit

// Player loses
delta = 0;  // stake already gone
```

The `resultDetail` display line should show the *net change* for clarity:
- Win: `+$${bet}` (net profit)
- Blackjack: `+$${Math.floor(bet * 1.5)}` (net profit)
- Push: `Bet returned`
- Bust/Lose: `-$${bet}`

### BUG 3 — Split balance check uses wrong variable

**Fix:** In the split button handler, replace:
```javascript
if (balance < currentBet)  // ❌ wrong
```
with:
```javascript
if (balance < playerBets[0])  // ✅ correct
```

### BUG 4 — Dealer plays after all hands bust (split)

**Fix:** In `checkBust()`, when it's the last split hand and it busts, check if ALL hands are busted before calling `dealerPlay`. If every hand has `handTotal > 21`, skip dealer play and call `resolveRound` directly:
```javascript
const allBust = playerHands.every(h => handTotal(h) > 21);
if (allBust) {
  setTimeout(resolveRound, 700);
} else {
  setTimeout(() => dealerPlay(resolveRound), 700);
}
```

### BUG 5 — Dealer plays after single-hand bust

**Fix:** In the single-hand bust path inside `checkBust()`, replace `dealerPlay(resolveRound)` with a direct `resolveRound()` call (after a short delay for animation):
```javascript
setTimeout(resolveRound, 700);  // skip dealer draw when player busts
```

### BUG 6 — Split aces timing race condition

**Fix:** Restructure the split aces flow. After splitting aces, deal one card to hand[0], then one card to hand[1], THEN call `dealerPlay(resolveRound)` — all inside a single chained setTimeout sequence. Never call `advanceSplitOrResolve` for aces; go straight to dealer after both hands are complete.

```javascript
if (isSplitAces) {
  setTimeout(() => {
    dealCard(playerHands[0]);
    setTimeout(() => {
      dealCard(playerHands[1]);
      renderPlayerHand();
      updateUI();
      setTimeout(() => dealerPlay(resolveRound), 500);
    }, 350);
  }, 300);
}
```

### BUG 7 — `dv === 1` dead code; dealer ace hint partially broken

**Fix:** Remove the `dv === 1` condition entirely from `getStrategyHint`. The ace check should only use `dealerUp.rank === 'A'`:
```javascript
// Remove this: if (dv === 1 || dealerUp.rank === 'A')
// Replace with:
if (dealerUp.rank === 'A') return eddieLines.dealerAce;
if (dv === 6)              return eddieLines.dealerSix;
```

### BUG 8 — Single 52-card deck can run out and crash

**Fix:** Replace `freshDeck()` with a 6-deck shoe (312 cards). Shuffle at start of each round (not at the start of each deal action — already correct). Add a low-deck guard: if `deck.length < 20` at the start of a new round, reshuffle a fresh shoe.

```javascript
function freshShoe(numDecks = 6) {
  const d = [];
  for (let n = 0; n < numDecks; n++)
    for (const s of SUITS) for (const r of RANKS) d.push({ rank: r, suit: s });
  return shuffle(d);
}

// In newRound() / init:
if (deck.length < 20) {
  deck = freshShoe();
  console.log('[Deck] Reshuffled fresh 6-deck shoe.');
}
```

### BUG 9 — Dealer score shows rank value number for face cards

**Fix:** In `renderDealerHand`, when showing the up-card score (hole hidden), display the raw rank string directly instead of computing `rankVal`:
```javascript
// Remove:
dealerScoreEl.textContent = rankVal(dealerHand[0].rank) === 11 ? 'A' : rankVal(dealerHand[0].rank).toString();
// Replace with:
dealerScoreEl.textContent = dealerHand[0].rank;
```

### BUG 10 — Auto-stand on 21 uses fragile synthetic click

**Fix:** Extract stand logic into a `doStand()` function and call it directly instead of `standBtn.click()`:
```javascript
function doStand() {
  if (state !== S.PLAYING) return;
  if (currentHandIdx < playerHands.length - 1) {
    currentHandIdx++;
    renderPlayerHand();
    updateUI();
    if (isSplitAces) {
      setTimeout(advanceSplitOrResolve, 300);
    } else {
      const hint = getStrategyHint(playerHands[currentHandIdx], dealerHand[0]);
      if (hint) eddie(hint);
    }
  } else {
    dealerPlay(resolveRound);
  }
}
// standBtn.addEventListener('click', doStand);
// When hitting 21: setTimeout(doStand, 400);  ← no synthetic click
```

---

## CSS Polish (in `style.css`)

### Short Screen Fix (BUG 13)
Remove `overflow: hidden` from `body`. Instead use `overflow-y: auto` with suppressed scrollbars via `::-webkit-scrollbar { display: none }`. The layout should use `min-height: 100vh` rather than `height: 100vh` so it doesn't clip on short displays.

Alternatively: use `clamp()` on `#game-screen` padding and reduce gap on small viewports with a `@media (max-height: 720px)` breakpoint that tightens padding and reduces the felt center `min-height`.

### Card Overflow Fix (BUG 14)
`.cards-row` should NOT use `flex-wrap: wrap`. Instead use `overflow-x: auto` with `scrollbar-width: none` so long hands scroll horizontally rather than wrapping:
```css
.cards-row {
  display: flex;
  gap: 7px;
  flex-wrap: nowrap;       /* ← change from wrap */
  overflow-x: auto;
  scrollbar-width: none;
  align-items: flex-start;
}
```

### Felt Watermark (POLISH 18)
Add a subtle "EST. 1923" text watermark inside `#felt-center` as a positioned element:
```html
<div id="felt-watermark">EST. 1923</div>
```
```css
#felt-watermark {
  font-family: 'Playfair Display', serif;
  font-size: clamp(1rem, 2.5vw, 1.6rem);
  color: rgba(201,168,76,0.12);
  letter-spacing: 0.5em;
  text-transform: uppercase;
  pointer-events: none;
  user-select: none;
  position: absolute;
}
```
The watermark should be hidden when the result banner is visible.

### Player Score Initial State (POLISH 23)
Change initial player score display from `0` to `—` to match the dealer. Set it to the actual total once cards are dealt.

### Deal Button Visual Distinction (POLISH 21)
When state is `S.COMPLETE` and the button reads "New Round", add a CSS class `deal-btn-ready` that gives it a slightly brighter gold background and a subtle pulsing box-shadow animation to draw the eye:
```css
#deal-btn.deal-btn-ready {
  background: rgba(201,168,76,0.28);
  border-color: var(--gold);
  animation: pulse-gold 1.6s ease-in-out infinite;
}
@keyframes pulse-gold {
  0%, 100% { box-shadow: 0 0 0px rgba(201,168,76,0); }
  50%       { box-shadow: 0 0 16px rgba(201,168,76,0.45); }
}
```

### Session Stats Counter (POLISH 22)
Add a small stats strip in the header area (right side, subtle):
```
Hands: 0  |  W: 0  L: 0  P: 0
```
```css
#session-stats {
  font-family: 'Courier Prime', monospace;
  font-size: 0.68rem;
  color: var(--gold-40);
  letter-spacing: 0.08em;
  text-align: right;
}
```
Track `handsPlayed`, `wins`, `losses`, `pushes` in `script.js`. Increment at `resolveRound`.

### Result Detail Hold (POLISH 20)
In `newRound()`, do not immediately clear `resultDetail`. Instead add a 600ms delay before clearing it so the player can read the result one more moment after clicking New Round.

### AI Panel CSS
```css
#ai-panel {
  flex-shrink: 0;
  background: rgba(0,0,0,0.32);
  border: 1px solid var(--gold-20);
  padding: 10px 14px;
}

#ai-panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

#ai-panel-title {
  font-family: 'Playfair Display', serif;
  font-size: 0.72rem;
  color: var(--gold);
  letter-spacing: 0.2em;
  text-transform: uppercase;
}

#ai-status-row {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.72rem;
  color: var(--cream);
  opacity: 0.7;
}

.dot-inactive { background: #555; }
.dot-loaded   { background: var(--gold); animation: pulse-dot 2s infinite; }
.dot-success  { background: #4caf50; }

@keyframes pulse-dot {
  0%, 100% { opacity: 1; }
  50%       { opacity: 0.4; }
}

/* status dot shared */
#ai-status-dot {
  width: 8px; height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}

#env-upload-label {
  /* same ghost-button style as #clear-bet-btn */
  font-family: 'EB Garamond', serif;
  font-size: 0.82rem;
  color: var(--cream);
  background: transparent;
  border: 1px solid var(--gold-40);
  padding: 4px 10px;
  cursor: pointer;
  letter-spacing: 0.05em;
  transition: border-color 0.2s, color 0.2s;
}
#env-upload-label:hover {
  border-color: var(--gold);
  color: var(--gold);
}

#ai-divider {
  height: 1px;
  background: linear-gradient(to right, transparent, var(--gold-20), transparent);
  margin-bottom: 8px;
}

#ai-recommendation-row {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 6px;
}

#ai-rec-label {
  font-family: 'Playfair Display', serif;
  font-size: 0.72rem;
  color: var(--gold-40);
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

#ai-rec-badge {
  font-family: 'Courier Prime', monospace;
  font-size: 0.82rem;
  font-weight: 700;
  padding: 3px 12px;
  border-radius: 20px;
  letter-spacing: 0.12em;
}

.rec-none   { background: rgba(255,255,255,0.08); color: var(--cream); opacity: 0.5; }
.rec-hit    { background: rgba(139,26,26,0.7);    color: #ffd0c0; }
.rec-stand  { background: rgba(27,67,50,0.8);     color: #c0e8c8; }
.rec-double { background: rgba(201,168,76,0.3);   color: var(--gold); }
.rec-split  { background: rgba(40,60,90,0.7);     color: #c0d0f0; }
.rec-loading { background: rgba(255,255,255,0.06); color: var(--cream); opacity: 0.6; }

#ai-reasoning {
  font-style: italic;
  font-size: 0.88rem;
  color: var(--cream);
  opacity: 0.82;
  line-height: 1.5;
  margin-bottom: 8px;
  min-height: 2.6em;
}

#ai-execute-btn {
  /* same base as .action-btn but narrower with a gold left accent */
  font-family: 'Playfair Display', serif;
  font-size: 0.78rem;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--cream);
  background: rgba(201,168,76,0.10);
  border: 1px solid var(--gold-40);
  border-left: 3px solid var(--gold);
  padding: 8px 18px;
  cursor: pointer;
  transition: background 0.2s, border-color 0.2s, color 0.2s;
}
#ai-execute-btn:hover:not(:disabled) {
  background: rgba(201,168,76,0.22);
  border-color: var(--gold);
  color: var(--gold);
}
#ai-execute-btn:disabled {
  opacity: 0.25;
  cursor: not-allowed;
}
```

---

## Game Logic Notes for `script.js`

### State Machine
Preserve the three states: `S.BETTING`, `S.PLAYING`, `S.COMPLETE`.

### Deck
Use a 6-deck shoe via `freshShoe(6)`. Reshuffle if `deck.length < 20` at the start of a new round.

### Eddie Marlowe
Preserve all existing lines and `getStrategyHint()` logic with BUG 7 fix applied. No other changes to Eddie.

### `updateUI()` additions
- Apply/remove `deal-btn-ready` class on `#deal-btn` when state is `S.COMPLETE`
- Show/hide and enable/disable `#ai-execute-btn` based on state and whether a recommendation exists
- Dim `#ai-content` in `S.BETTING` state
- Reset AI badge to `rec-none` at start of each new round

### Session Stats
Track and update `handsPlayed`, `wins`, `losses`, `pushes` in `resolveRound()`. Display in `#session-stats`.

### Web Audio
Preserve the entire Web Audio engine (`playChipClick`, `playCardDeal`, `playCardFlip`, `playWin`, `playLose`, `playBlackjack`) unchanged.

### No Changes To
- Entry screen / password logic (any non-empty input accepted)
- Art deco frame and corner SVGs
- Chip button interactions
- Clear Bet button
- Game over screen and restart logic (reset balance to $500)
- `calcHand`, `handTotal`, `isSoft`, `isBlackjack`, `rankVal` utility functions
- `renderPlayerHand` split display logic
- `dealerPlay` stepping logic (dealer hits on soft 17? — standard rules: dealer stands on soft 17, hits below 17)

---

## Claude Code Prompt to Kickstart the Session

```
The temp/ folder contains a working example of a static webpage that interacts 
with an LLM via an uploaded .env file. Use it as a reference for:
- How to parse a .env file for the API key (in-memory only, never stored)
- The fetch() call structure for the Anthropic API
- Error handling patterns for failed API requests

Do NOT include the temp/ folder in the final build or deployment.

Build the Blackjack AI agent page per spec_velvet_room_ai_agent.md. The project 
uses three files: index.html, style.css, script.js. It is a faithful rebuild of 
The Velvet Room (Assignment-10) with bug fixes and a new AI agent panel added.

Key priorities in order:
1. Fix all bugs listed in the spec before adding any new features
2. Build the AI agent panel and .env upload exactly per spec
3. Apply CSS polish items
4. Ensure all console logging is in place for the AI agent interactions
5. Test that balance math is correct: win returns bet*2, blackjack returns bet + floor(bet*1.5), push returns bet, bust/lose returns 0
```

---

## Stretch Challenges (if time allows)

Per the assignment spec, implement 2+ of these:

**Recommended — Performance Analytics (easiest, high impact)**
Add a collapsible stats panel below the AI panel showing:
- Win rate % (updated live)
- Bankroll chart (sparkline of balance over last 10 rounds)
- AI accuracy: how often the AI recommendation, when executed, resulted in a win

**Recommended — Strategy Visualization**
A small 4×4 grid that lights up to show where the current hand falls on the basic strategy chart. Color-coded: green = stand, red = hit, gold = double, blue = split. Updates every hand.

**Optional — Explainability Levels**
Toggle between:
- `Brief` — just the action badge
- `Standard` — one sentence reasoning (default)
- `Detailed` — full statistical breakdown (costs more tokens, raises `max_tokens` to 512)
