# Blackjack Quest Spec: *The Velvet Room*

## Visual Design

**Color Palette**
- Background: `#1a0f0a` (near-black espresso)
- Felt table: `#1b4332` (deep casino green)
- Table border/trim: `#c9a84c` (aged gold)
- Primary text: `#f5f0e8` (aged cream)
- Accent/highlight: `#6b1a1a` (deep burgundy)
- Chip colors: ivory `#f5f0e8`, red `#8b1a1a`, green `#1b5e3b`, black `#1a1a1a`

**Typography**
- Headers & dealer name: *Playfair Display* (Google Fonts) — serif, dramatic
- Body & game text: *EB Garamond* (Google Fonts) — elegant, period-accurate
- Numbers/counts: *Courier Prime* — typewriter feel

**Aesthetic Details**
- Art deco geometric border pattern framing the entire page (CSS or SVG)
- Warm amber vignette overlay on background (radial gradient, darker at edges)
- Gold divider lines between UI sections
- Subtle CSS texture on the felt surface
- Candlelight amber glow on hover states (gold box-shadow)

---

## Layout

```
┌─────────────────────────────────────────┐
│         🎴 THE VELVET ROOM 🎴           │  ← Art deco header, Playfair Display
│     "Est. 1923 — Members Only"          │
├─────────────────────────────────────────┤
│  [Ace Eddie portrait + speech bubble]   │  ← Eddie's whisper zone (top-left)
│  "Good evening, friend. Place your bet."│
├──────────────────┬──────────────────────┤
│   DEALER HAND    │   Score: ?           │  ← Dealer area (hole card hidden)
│   [card][card]   │                      │
├──────────────────┴──────────────────────┤
│             GREEN FELT TABLE            │
│         (chips + bet display)           │
├──────────────────┬──────────────────────┤
│   PLAYER HAND    │   Score: 0           │  ← Player area
│   [card][card]   │                      │
├─────────────────────────────────────────┤
│  Bet: $25   Balance: $500               │  ← Bet/balance bar (gold text)
│  [chip $1][chip $5][chip $25][chip $100]│  ← Clickable chip stack buttons
│  [Clear Bet]                            │
├─────────────────────────────────────────┤
│  [Deal] [Hit] [Stand] [Double] [Split]  │  ← Action buttons, context-sensitive
└─────────────────────────────────────────┘
```

---

## Password / Entry Screen

- Full-screen art deco splash: *"The Velvet Room"* in large Playfair Display
- Flavor text: *"A gentleman doesn't knock twice."*
- Single text input with placeholder: *"The password, friend…"*
- Submit button: *"Enter"*
- Correct password: `swordfish` (case-insensitive)
- On correct entry: fade transition into the main game
- On wrong entry: input shakes, placeholder changes to *"...That's not it, friend."*

---

## Dealer Character: "Ace" Eddie Marlowe

Small illustrated portrait (CSS art deco silhouette) in the top-left corner.
Speech bubble updates on every game event.

### Eddie's Line Library

| Event | Eddie Says |
|---|---|
| Game load | *"Good evening, friend. The house always welcomes new blood."* |
| Cards dealt | *"Let's see what fate has dealt us tonight."* |
| Player has 11 | *"Eleven, friend. Double down — that's what I'd do."* |
| Player has soft 17-18 | *"Soft hand. You could take one more without much risk."* |
| Dealer shows 6 | *"The dealer's showing a six. Stand pat and let them bust."* |
| Dealer shows Ace | *"An ace. Careful now — the house has teeth tonight."* |
| Player hits on 18+ | *"Bold move, friend. Very bold."* |
| Player busts | *"The cards are cruel tonight. They often are."* |
| Player blackjack | *"A natural! Lady Luck smiles on the bold."* |
| Dealer blackjack | *"The house remembers, friend. Always."* |
| Push | *"A gentleman's tie. Your coins return to you."* |
| Player wins | *"Well played. The Velvet Room respects a winner."* |
| Player doubles down | *"Doubling down — a man of conviction. I respect it."* |
| Player splits | *"Two hands, two chances. Fortune favors the daring."* |
| Balance < $50 | *"Running thin, friend. The house can extend credit… but I wouldn't advise it."* |

### Strategy Whispers (Basic Strategy Hints)

| Player Hand | Eddie Says |
|---|---|
| Hard 8 or less | *"Take a card. You've got room."* |
| Hard 9 vs dealer 3-6 | *"Double if you can. The odds are with you."* |
| Hard 10-11 | *"Double down, friend. Don't be shy."* |
| Hard 12-16 vs dealer 2-6 | *"Stand pat. Let the dealer dig their own grave."* |
| Hard 12-16 vs dealer 7+ | *"You'll need to hit. The dealer's strong."* |
| Hard 17+ | *"Stand. A wise man knows when to stop."* |
| Soft 17 or less | *"That ace gives you room. Take another card."* |
| Pair of Aces or 8s | *"Split those. Every gambler knows this one."* |
| Pair of 10s | *"Don't you dare split those tens, friend."* |

---

## Game States

### State 1: Betting Phase
- Chip buttons active
- Deal button active only if bet > 0
- Hit / Stand / Double / Split disabled and visually muted
- Eddie greets or reflects on last round

### State 2: Playing Phase
- Chip buttons disabled
- Deal button disabled
- Hit and Stand always active
- Double active only if: exactly 2 cards AND balance ≥ current bet
- Split active only if: exactly 2 cards of equal value AND balance ≥ current bet
- Eddie whispers strategy each time player's hand changes

### State 3: Round Complete
- All action buttons disabled except "New Round"
- Results banner: WIN / LOSE / PUSH / BLACKJACK in large styled text
- Payout applied to balance
- Eddie delivers closing line
- If balance = $0: show "The House Wins Tonight" screen with restart option

---

## Blackjack Rules

**Deck:** Standard 52-card deck, freshly shuffled each round (single deck)

**Card Values:**
- Number cards: face value
- Jack, Queen, King: 10
- Ace: 11, reduced to 1 if hand would bust

**Deal:** Player gets 2 face-up cards; dealer gets 1 face-up, 1 face-down (hole card)

**Blackjack:** Ace + 10-value card on initial deal
- Player blackjack, dealer no blackjack → player wins 1.5x bet
- Both blackjack → push (bet returned)
- Dealer blackjack, player no blackjack → dealer wins

**Hit:** Player receives one more card. Total > 21 → bust → dealer wins.

**Stand:** Player keeps hand. Dealer reveals hole card and plays to completion.

**Dealer Rule:** Hits on 16 or less, stands on 17 or more (including soft 17).

**Double Down:** Player doubles bet, receives exactly one more card, then stands automatically.

**Split:** Player separates a pair into two hands, matches bet on second hand, plays each independently. Split Aces receive only one card each.

**Push:** Tie → bet returned, no win/loss.

**Starting Balance:** $500

---

## Betting Chips UI

Four clickable poker chip tokens:
- `$1` — ivory/cream chip
- `$5` — red chip
- `$25` — green chip
- `$100` — black/gold chip

Each click adds that value to current bet. "Clear Bet" resets to $0.
Current bet displayed in gold text above chips.
Cannot bet more than current balance.

---

## Card Display

**For now: styled text cards** (e.g. "A♠", "K♥") rendered in elegant card frames.
- White/cream card face with gold border
- Suit colors: black for ♠♣, burgundy for ♥♦
- Dealer hole card shown as a face-down card back (dark pattern) until reveal
- Cards dealt with a brief CSS slide-in animation (0.3s ease)

*Note: Real card images can be swapped in as a second pass once assets are available.*

---

## Sound Effects

Use Web Audio API to synthesize all sounds (no external files needed):
- **Chip click:** soft ceramic clink when adding to bet
- **Card deal:** crisp paper slide
- **Card flip:** dealer hole card reveal
- **Win:** warm ascending tone
- **Bust/lose:** low descending tone
- **Blackjack:** short triumphant fanfare
- **Ambient jazz:** optional very quiet looping tone (toggle off by default)

---

## Testing Scenarios

| Test | Expected Result |
|---|---|
| Player: A+K, Dealer: 7+9 | Player wins, balance +$37.50 on $25 bet |
| Player: A+K, Dealer: A+Q | Push, balance unchanged |
| Player hits to 22 | Bust, balance decreases by bet |
| Player doubles on 11, gets 10 | Player has 21, stands automatically |
| Player splits 8s, wins one, loses one | Net: +1 bet win, -1 bet loss |
| Balance reaches $0 | "The House Wins Tonight" screen shown |
| Wrong password entered | Input shakes, placeholder updates |
| Correct password entered | Fade transition into game |
| Dealer shows 6, player has 14 | Eddie says "Stand pat. Let the dealer dig their own grave." |
| Player dealt pair of Aces | Eddie says "Split those. Every gambler knows this one." |
