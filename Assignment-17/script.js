'use strict';

/* ============================================================
   WEB AUDIO ENGINE
============================================================ */
let _audioCtx = null;
function audioCtx() {
  if (!_audioCtx) _audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  return _audioCtx;
}

function playChipClick() {
  try {
    const ctx = audioCtx();
    const osc  = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain); gain.connect(ctx.destination);
    osc.type = 'sine';
    osc.frequency.setValueAtTime(1300, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(750, ctx.currentTime + 0.09);
    gain.gain.setValueAtTime(0.28, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.13);
    osc.start(); osc.stop(ctx.currentTime + 0.14);
  } catch(e) {}
}

function playCardDeal() {
  try {
    const ctx = audioCtx();
    const len  = Math.floor(ctx.sampleRate * 0.14);
    const buf  = ctx.createBuffer(1, len, ctx.sampleRate);
    const d    = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = (Math.random()*2-1) * Math.exp(-i / (len * 0.18));
    const src  = ctx.createBufferSource();
    const gain = ctx.createGain();
    src.buffer = buf;
    src.connect(gain); gain.connect(ctx.destination);
    gain.gain.setValueAtTime(0.22, ctx.currentTime);
    src.start();
  } catch(e) {}
}

function playCardFlip() {
  try {
    const ctx = audioCtx();
    const len  = Math.floor(ctx.sampleRate * 0.18);
    const buf  = ctx.createBuffer(1, len, ctx.sampleRate);
    const d    = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = (Math.random()*2-1) * Math.exp(-i / (len * 0.14));
    const src  = ctx.createBufferSource();
    const filt = ctx.createBiquadFilter();
    const gain = ctx.createGain();
    src.buffer = buf;
    filt.type = 'highpass'; filt.frequency.value = 1800;
    src.connect(filt); filt.connect(gain); gain.connect(ctx.destination);
    gain.gain.setValueAtTime(0.28, ctx.currentTime);
    src.start();
  } catch(e) {}
}

function playWin() {
  try {
    const ctx = audioCtx();
    [523.25, 659.25, 783.99].forEach((f, i) => {
      const t = ctx.currentTime + i * 0.13;
      const osc = ctx.createOscillator(), gain = ctx.createGain();
      osc.connect(gain); gain.connect(ctx.destination);
      osc.type = 'sine'; osc.frequency.value = f;
      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(0.28, t + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.55);
      osc.start(t); osc.stop(t + 0.56);
    });
  } catch(e) {}
}

function playLose() {
  try {
    const ctx = audioCtx();
    [311.13, 261.63, 207.65].forEach((f, i) => {
      const t = ctx.currentTime + i * 0.15;
      const osc = ctx.createOscillator(), gain = ctx.createGain();
      osc.connect(gain); gain.connect(ctx.destination);
      osc.type = 'triangle'; osc.frequency.value = f;
      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(0.22, t + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.55);
      osc.start(t); osc.stop(t + 0.56);
    });
  } catch(e) {}
}

function playBlackjack() {
  try {
    const ctx = audioCtx();
    [392, 523.25, 659.25, 783.99, 1046.5].forEach((f, i) => {
      const t = ctx.currentTime + i * 0.1;
      const osc = ctx.createOscillator(), gain = ctx.createGain();
      osc.connect(gain); gain.connect(ctx.destination);
      osc.type = 'triangle'; osc.frequency.value = f;
      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(0.2, t + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.38);
      osc.start(t); osc.stop(t + 0.39);
    });
  } catch(e) {}
}

/* ============================================================
   DECK UTILITIES
============================================================ */
const SUITS = ['♠','♣','♥','♦'];
const RANKS = ['A','2','3','4','5','6','7','8','9','10','J','Q','K'];

function freshShoe(numDecks = 6) {
  const d = [];
  for (let n = 0; n < numDecks; n++)
    for (const s of SUITS) for (const r of RANKS) d.push({ rank: r, suit: s });
  return shuffle(d);
}

function shuffle(d) {
  for (let i = d.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [d[i], d[j]] = [d[j], d[i]];
  }
  return d;
}

function rankVal(rank) {
  if (rank === 'A') return 11;
  if (['J','Q','K'].includes(rank)) return 10;
  return parseInt(rank, 10);
}

function calcHand(hand) {
  let total = 0, aces = 0;
  for (const c of hand) {
    if (c.rank === 'A') { aces++; total += 11; }
    else total += rankVal(c.rank);
  }
  let soft = aces > 0;
  while (total > 21 && aces > 0) { total -= 10; aces--; }
  soft = soft && aces > 0 && total <= 21;
  return { total, soft };
}

function handTotal(hand) { return calcHand(hand).total; }
function isSoft(hand)    { return calcHand(hand).soft;  }

function isBlackjack(hand) {
  return hand.length === 2 && handTotal(hand) === 21;
}

/* ============================================================
   HI-LO CARD COUNTING
============================================================ */
function hiLoValue(rank) {
  if (['2','3','4','5','6'].includes(rank)) return 1;
  if (['7','8','9'].includes(rank)) return 0;
  return -1; // 10, J, Q, K, A
}

function countCard(rank) {
  runningCount += hiLoValue(rank);
  updateCountDisplay();
}

function updateCountDisplay() {
  const decksLeft = Math.max(deck.length / 52, 0.1);
  const trueCount = runningCount / decksLeft;

  const rcSign = runningCount > 0 ? '+' : '';
  runningCountVal.textContent = rcSign + runningCount;
  if (runningCount > 0) {
    runningCountVal.style.color   = 'var(--gold)';
    runningCountVal.style.opacity = '1';
  } else if (runningCount < 0) {
    runningCountVal.style.color   = '#cc3333';
    runningCountVal.style.opacity = '1';
  } else {
    runningCountVal.style.color   = '';
    runningCountVal.style.opacity = '0.6';
  }

  const tcSign = trueCount > 0 ? '+' : '';
  trueCountVal.textContent = tcSign + trueCount.toFixed(1);
  decksLeftVal.textContent = '~' + decksLeft.toFixed(1);
}

/* ============================================================
   GAME STATE
============================================================ */
const S = { BETTING: 'betting', PLAYING: 'playing', COMPLETE: 'complete' };

let state          = S.BETTING;
let deck           = freshShoe();
let dealerHand     = [];
let playerHands    = [[]];
let playerBets     = [0];
let currentHandIdx = 0;
let balance        = 500;
let currentBet     = 0;
let isSplitAces    = false;
let selectedDecks  = 6;
let runningCount   = 0;

// Session stats — POLISH 22
let handsPlayed = 0, wins = 0, losses = 0, pushes = 0;

/* ============================================================
   DOM REFS
============================================================ */
const $  = id => document.getElementById(id);
const entryScreen    = $('entry-screen');
const gameScreen     = $('game-screen');
const gameoverScreen = $('gameover-screen');
const passwordInput  = $('password-input');
const enterBtn       = $('enter-btn');
const eddieText      = $('eddie-text');
const dealerHandEl   = $('dealer-hand');
const dealerScoreEl  = $('dealer-score');
const playerHandEl   = $('player-hand');
const playerHandsWrap= $('player-hands-wrap');
const playerScoreEl  = $('player-score');
const currentBetDisp = $('current-bet-display');
const balanceDisp    = $('balance-display');
const resultBanner   = $('result-banner');
const resultText     = $('result-text');
const resultDetail   = $('result-detail');
const dealBtn        = $('deal-btn');
const hitBtn         = $('hit-btn');
const standBtn       = $('stand-btn');
const doubleBtn      = $('double-btn');
const splitBtn       = $('split-btn');
const clearBetBtn    = $('clear-bet-btn');
const restartBtn     = $('restart-btn');
const chipBtns       = document.querySelectorAll('.chip');
const sessionStatsEl = $('session-stats');
const feltWatermark  = $('felt-watermark');
const runningCountVal = $('running-count-val');
const trueCountVal    = $('true-count-val');
const decksLeftVal    = $('decks-left-val');
const deckBtns        = document.querySelectorAll('.deck-btn');

// AI panel DOM refs
const aiStatusDot    = $('ai-status-dot');
const aiStatusLabel  = $('ai-status-label');
const envFileInput   = $('env-file-input');
const aiContent      = $('ai-content');
const aiRecBadge     = $('ai-rec-badge');
const aiReasoning    = $('ai-reasoning');
const aiExecuteBtn   = $('ai-execute-btn');

/* ============================================================
   EDDIE DIALOGUE
============================================================ */
const eddieLines = {
  load:       "Good evening, friend. The house always welcomes new blood.",
  dealt:      "Let's see what fate has dealt us tonight.",
  bust:       "The cards are cruel tonight. They often are.",
  playerBJ:   "A natural! Lady Luck smiles on the bold.",
  dealerBJ:   "The house remembers, friend. Always.",
  push:       "A gentleman's tie. Your coins return to you.",
  win:        "Well played. The Velvet Room respects a winner.",
  lose:       "The house collects. It always does, in the end.",
  doubleDown: "Doubling down — a man of conviction. I respect it.",
  split:      "Two hands, two chances. Fortune favors the daring.",
  lowBalance: "Running thin, friend. The house can extend credit… but I wouldn't advise it.",
  boldHit:    "Bold move, friend. Very bold.",
  dealerSix:  "The dealer's showing a six. Stand pat and let them bust.",
  dealerAce:  "An ace. Careful now — the house has teeth tonight.",
  eleven:     "Eleven, friend. Double down — that's what I'd do.",
  soft1718:   "Soft hand. You could take one more without much risk.",
  shoe1:      "One deck. Sharp eyes and sharper memory, friend.",
  shoe2:      "Two decks. The odds narrow, but so does the mystery.",
  shoe6:      "Six decks. The shoe is long tonight. Patience, friend.",
};

function getStrategyHint(hand, dealerUp) {
  const { total, soft } = calcHand(hand);
  const dv = rankVal(dealerUp.rank);

  if (hand.length === 2 && rankVal(hand[0].rank) === rankVal(hand[1].rank)) {
    const r = hand[0].rank;
    if (r === 'A' || r === '8')
      return "Split those. Every gambler knows this one.";
    if (r === '10' || r === 'J' || r === 'Q' || r === 'K')
      return "Don't you dare split those tens, friend.";
  }

  // BUG 7 fix: use rank string, not dv === 1
  if (dealerUp.rank === 'A') return eddieLines.dealerAce;
  if (dv === 6)              return eddieLines.dealerSix;

  if (soft) {
    if (total <= 17) return "That ace gives you room. Take another card.";
    if (total === 17 || total === 18) return eddieLines.soft1718;
  }

  if (total <= 8)  return "Take a card. You've got room.";
  if (total === 9  && dv >= 3 && dv <= 6) return "Double if you can. The odds are with you.";
  if (total === 11) return eddieLines.eleven;
  if (total === 10) return "Double down, friend. Don't be shy.";
  if (total >= 12 && total <= 16) {
    if (dv >= 2 && dv <= 6) return "Stand pat. Let the dealer dig their own grave.";
    return "You'll need to hit. The dealer's strong.";
  }
  if (total >= 17)  return "Stand. A wise man knows when to stop.";
  return null;
}

let eddieTimeout = null;
function eddie(line) {
  if (!line) return;
  clearTimeout(eddieTimeout);
  eddieText.classList.add('fade');
  eddieTimeout = setTimeout(() => {
    eddieText.textContent = line;
    eddieText.classList.remove('fade');
  }, 260);
}

/* ============================================================
   CARD RENDERING
============================================================ */
function isRed(suit) { return suit === '♥' || suit === '♦'; }

function makeCardEl(card, faceDown = false, delay = 0) {
  const el = document.createElement('div');
  if (faceDown) {
    el.className = 'card face-down';
    el.style.animationDelay = delay + 's';
    el.setAttribute('aria-label', 'Face-down card');
    return el;
  }
  el.className = 'card' + (isRed(card.suit) ? ' red-suit' : '');
  el.style.animationDelay = delay + 's';
  el.setAttribute('aria-label', card.rank + ' of ' + card.suit);
  el.innerHTML = `
    <div class="card-corner top">
      <span class="card-rank">${card.rank}</span>
      <span class="card-suit-s">${card.suit}</span>
    </div>
    <div class="card-center">${card.suit}</div>
    <div class="card-corner bottom">
      <span class="card-rank">${card.rank}</span>
      <span class="card-suit-s">${card.suit}</span>
    </div>`;
  return el;
}

function renderDealerHand(hideHole = true) {
  dealerHandEl.innerHTML = '';
  dealerHand.forEach((card, i) => {
    const hidden = hideHole && i === 1;
    dealerHandEl.appendChild(makeCardEl(card, hidden, i * 0.1));
  });
  if (hideHole) {
    // BUG 9 fix: show the raw rank string, not a computed number
    dealerScoreEl.textContent = dealerHand[0].rank;
    dealerScoreEl.className = 'hand-score';
  } else {
    const t = handTotal(dealerHand);
    dealerScoreEl.textContent = t;
    dealerScoreEl.className = 'hand-score' + (t > 21 ? ' bust' : t === 21 && dealerHand.length === 2 ? ' blackjack' : '');
  }
}

function renderPlayerHand() {
  const isSplit = playerHands.length > 1;
  if (!isSplit) {
    playerHandEl.style.display = 'flex';
    playerHandsWrap.style.display = 'none';
    playerHandEl.innerHTML = '';
    const hand = playerHands[0];
    hand.forEach((card, i) => playerHandEl.appendChild(makeCardEl(card, false, i * 0.1)));
    const t = handTotal(hand);
    playerScoreEl.textContent = t;
    playerScoreEl.className = 'hand-score' + (t > 21 ? ' bust' : isBlackjack(hand) ? ' blackjack' : '');
  } else {
    playerHandEl.style.display = 'none';
    playerHandsWrap.style.display = 'flex';
    playerHandsWrap.innerHTML = '';
    playerHands.forEach((hand, hi) => {
      const col = document.createElement('div');
      col.className = 'split-hand-col' + (hi === currentHandIdx ? ' active-hand' : '');
      const row = document.createElement('div');
      row.className = 'cards-row';
      hand.forEach((card, ci) => row.appendChild(makeCardEl(card, false, ci * 0.08)));
      const sc = document.createElement('div');
      const t = handTotal(hand);
      sc.className = 'split-hand-score' + (t > 21 ? ' bust' : isBlackjack(hand) ? ' blackjack' : '');
      sc.textContent = 'Hand ' + (hi + 1) + ': ' + t;
      const bet = document.createElement('div');
      bet.className = 'split-hand-score';
      bet.style.color = 'rgba(201,168,76,0.7)';
      bet.style.fontSize = '0.72rem';
      bet.textContent = 'Bet $' + playerBets[hi];
      col.appendChild(row);
      col.appendChild(sc);
      col.appendChild(bet);
      playerHandsWrap.appendChild(col);
    });
    const t = handTotal(playerHands[currentHandIdx]);
    playerScoreEl.textContent = t;
    playerScoreEl.className = 'hand-score' + (t > 21 ? ' bust' : '');
  }
}

/* ============================================================
   UI STATE MACHINE
============================================================ */
function updateUI() {
  currentBetDisp.textContent = '$' + currentBet;
  balanceDisp.textContent    = '$' + balance;

  const isSplit = playerHands.length > 1;

  if (state === S.BETTING) {
    dealBtn.textContent = 'Deal';
    dealBtn.disabled    = currentBet === 0;
    dealBtn.classList.remove('deal-btn-ready');
    hitBtn.disabled     = true;
    standBtn.disabled   = true;
    doubleBtn.disabled  = true;
    splitBtn.disabled   = true;
    chipBtns.forEach(b => b.disabled = false);
    clearBetBtn.disabled = currentBet === 0;
    // AI panel: dim content in BETTING state
    aiContent.classList.add('dimmed');
    aiExecuteBtn.style.display = 'none';
    resetAIBadge();
  }

  if (state === S.PLAYING) {
    const hand = playerHands[currentHandIdx];
    dealBtn.disabled   = true;
    dealBtn.classList.remove('deal-btn-ready');
    hitBtn.disabled    = false;
    standBtn.disabled  = false;
    doubleBtn.disabled = !(hand.length === 2 && balance >= playerBets[currentHandIdx] && !isSplitAces);
    splitBtn.disabled  = !(
      hand.length === 2 &&
      rankVal(hand[0].rank) === rankVal(hand[1].rank) &&
      balance >= playerBets[currentHandIdx] &&
      !isSplit
    );
    chipBtns.forEach(b => b.disabled = true);
    clearBetBtn.disabled = true;
    // AI panel: undim in PLAYING state
    aiContent.classList.remove('dimmed');
  }

  if (state === S.COMPLETE) {
    dealBtn.textContent = 'New Round';
    dealBtn.disabled    = false;
    dealBtn.classList.add('deal-btn-ready');
    hitBtn.disabled     = true;
    standBtn.disabled   = true;
    doubleBtn.disabled  = true;
    splitBtn.disabled   = true;
    chipBtns.forEach(b => b.disabled = true);
    clearBetBtn.disabled = true;
    // Hide execute button after round ends
    aiExecuteBtn.style.display = 'none';
  }

  // Update session stats — POLISH 22
  sessionStatsEl.textContent = `Hands: ${handsPlayed} \u00a0|\u00a0 W: ${wins} \u00a0L: ${losses} \u00a0P: ${pushes}`;
}

/* ============================================================
   DEALING HELPERS
============================================================ */
function draw() { return deck.pop(); }

function dealCard(hand) {
  const card = draw();
  hand.push(card);
  playCardDeal();
  return card;
}

/* ============================================================
   DEALER PLAY
============================================================ */
function dealerPlay(callback) {
  countCard(dealerHand[1].rank); // hole card now revealed
  renderDealerHand(false);
  playCardFlip();

  function dealerStep() {
    const t = handTotal(dealerHand);
    if (t < 17) {
      setTimeout(() => {
        countCard(dealCard(dealerHand).rank);
        renderDealerHand(false);
        dealerStep();
      }, 450);
    } else {
      callback();
    }
  }
  dealerStep();
}

/* ============================================================
   PAYOUT & RESULT
   BUG 1 & 2 fix: delta now represents full amount returned to balance.
   Bet was already deducted at deal time.
   win=bet*2, blackjack=bet+floor(bet*1.5), push=bet, bust/lose=0
============================================================ */
function resolveRound() {
  const dt = handTotal(dealerHand);
  const dealerBJ = isBlackjack(dealerHand);

  let totalDelta = 0;
  const results  = [];

  for (let hi = 0; hi < playerHands.length; hi++) {
    const hand = playerHands[hi];
    const bet  = playerBets[hi];
    const pt   = handTotal(hand);
    const pBJ  = isBlackjack(hand) && playerHands.length === 1;

    let delta = 0, label = '', cls = '';

    if (pt > 21) {
      delta = 0; label = 'BUST'; cls = 'lose';
    } else if (pBJ && dealerBJ) {
      delta = bet; label = 'PUSH'; cls = 'push';
    } else if (pBJ) {
      delta = bet + Math.floor(bet * 1.5); label = 'BLACKJACK'; cls = 'blackjack';
    } else if (dealerBJ) {
      delta = 0; label = 'DEALER BLACKJACK'; cls = 'lose';
    } else if (dt > 21) {
      delta = bet * 2; label = 'WIN'; cls = 'win';
    } else if (pt > dt) {
      delta = bet * 2; label = 'WIN'; cls = 'win';
    } else if (pt === dt) {
      delta = bet; label = 'PUSH'; cls = 'push';
    } else {
      delta = 0; label = 'LOSE'; cls = 'lose';
    }

    balance    += delta;
    totalDelta += delta;
    results.push({ label, cls, delta, bet });
  }

  // Session stats — POLISH 22
  handsPlayed++;
  const primaryResult = results[0];
  if (primaryResult.cls === 'win' || primaryResult.cls === 'blackjack') wins++;
  else if (primaryResult.cls === 'push') pushes++;
  else losses++;

  // Display result
  resultText.textContent = primaryResult.label;
  resultText.className   = 'result-text ' + primaryResult.cls;

  if (results.length > 1) {
    const d = results.map((r, i) => {
      let netStr;
      if (r.cls === 'push') netStr = 'Push';
      else if (r.delta === 0) netStr = `-$${r.bet}`;
      else if (r.cls === 'blackjack') netStr = `+$${Math.floor(r.bet * 1.5)}`;
      else netStr = `+$${r.bet}`;
      return `Hand ${i+1}: ${r.label} (${netStr})`;
    }).join('  |  ');
    resultDetail.textContent = d;
  } else {
    let d;
    if (primaryResult.cls === 'push') d = 'Bet returned';
    else if (primaryResult.cls === 'blackjack') d = `+$${Math.floor(primaryResult.bet * 1.5)}`;
    else if (primaryResult.cls === 'win') d = `+$${primaryResult.bet}`;
    else d = `-$${primaryResult.bet}`;
    resultDetail.textContent = d;
  }

  resultBanner.classList.add('visible');
  // Hide watermark when result is showing
  feltWatermark.style.opacity = '0';

  if (primaryResult.cls === 'blackjack') playBlackjack();
  else if (primaryResult.cls === 'win')  playWin();
  else if (primaryResult.cls === 'lose') playLose();

  if (primaryResult.cls === 'blackjack')             eddie(eddieLines.playerBJ);
  else if (primaryResult.label === 'DEALER BLACKJACK') eddie(eddieLines.dealerBJ);
  else if (primaryResult.cls === 'push')              eddie(eddieLines.push);
  else if (primaryResult.cls === 'win')               eddie(eddieLines.win);
  else                                                 eddie(eddieLines.lose);

  state = S.COMPLETE;
  updateUI();

  if (balance <= 0) {
    setTimeout(() => { gameoverScreen.classList.add('visible'); }, 1200);
  } else if (balance < 50) {
    setTimeout(() => eddie(eddieLines.lowBalance), 2000);
  }
}

/* ============================================================
   BUST CHECK (called after every hit)
   BUG 4 fix: when last split hand busts, check if ALL hands busted
   BUG 5 fix: single-hand bust goes directly to resolveRound, skips dealer
============================================================ */
function checkBust() {
  const hand = playerHands[currentHandIdx];
  const t    = handTotal(hand);
  if (t > 21) {
    renderPlayerHand();
    playLose();
    eddie(eddieLines.bust);

    if (currentHandIdx < playerHands.length - 1) {
      // Still more split hands to play
      currentHandIdx++;
      setTimeout(() => {
        renderPlayerHand();
        updateUI();
        if (isSplitAces) {
          setTimeout(advanceSplitOrResolve, 400);
        } else {
          eddie(getStrategyHint(playerHands[currentHandIdx], dealerHand[0]) || eddieLines.dealt);
          consultAIAgent();
        }
      }, 700);
    } else {
      // BUG 4 fix: check if all hands are busted before calling dealer
      const allBust = playerHands.every(h => handTotal(h) > 21);
      if (allBust) {
        setTimeout(resolveRound, 700);
      } else {
        setTimeout(() => dealerPlay(resolveRound), 700);
      }
    }
    return true;
  }
  return false;
}

function advanceSplitOrResolve() {
  if (currentHandIdx < playerHands.length - 1) {
    currentHandIdx++;
    renderPlayerHand();
    updateUI();
    if (isSplitAces) {
      setTimeout(advanceSplitOrResolve, 400);
    }
  } else {
    dealerPlay(resolveRound);
  }
}

/* ============================================================
   ACTION: STAND (extracted to doStand — BUG 10 fix)
============================================================ */
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
      consultAIAgent();
    }
  } else {
    dealerPlay(resolveRound);
  }
}

standBtn.addEventListener('click', doStand);

/* ============================================================
   ENTRY SCREEN LOGIC
============================================================ */
function tryPassword() {
  const val = passwordInput.value.trim();
  if (val.length > 0) {
    entryScreen.classList.add('fade-out');
    setTimeout(() => {
      entryScreen.style.display = 'none';
      gameScreen.classList.add('visible');
      eddie(eddieLines.load);
    }, 950);
  } else {
    passwordInput.classList.remove('shake');
    void passwordInput.offsetWidth;
    passwordInput.classList.add('shake');
    passwordInput.placeholder = '…That\'s not it, friend.';
    setTimeout(() => { passwordInput.classList.remove('shake'); }, 500);
  }
}

enterBtn.addEventListener('click', tryPassword);
passwordInput.addEventListener('keydown', e => { if (e.key === 'Enter') tryPassword(); });

/* ============================================================
   CHIP BUTTONS
============================================================ */
chipBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    const val = parseInt(btn.dataset.value, 10);
    if (currentBet + val > balance) return;
    currentBet += val;
    playChipClick();
    updateUI();
  });
});

clearBetBtn.addEventListener('click', () => {
  currentBet = 0;
  updateUI();
});

/* ============================================================
   DECK SELECTOR
============================================================ */
deckBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    const n = parseInt(btn.dataset.decks, 10);
    if (n === selectedDecks) return;
    selectedDecks = n;
    deckBtns.forEach(b => b.classList.toggle('deck-btn-active', b === btn));
    deck = freshShoe(selectedDecks);
    runningCount = 0;
    updateCountDisplay();
    const lines = { 1: eddieLines.shoe1, 2: eddieLines.shoe2, 6: eddieLines.shoe6 };
    eddie(lines[selectedDecks]);
  });
});

/* ============================================================
   ACTION: DEAL / NEW ROUND
   BUG 8 fix: 6-deck shoe, reshuffle if < 20 cards remain
============================================================ */
dealBtn.addEventListener('click', () => {
  if (state === S.COMPLETE) {
    newRound();
    return;
  }

  if (state !== S.BETTING || currentBet === 0) return;

  // BUG 8: reshuffle shoe if running low
  if (deck.length < 20) {
    deck = freshShoe(selectedDecks);
    runningCount = 0;
    updateCountDisplay();
    console.log('[Deck] Reshuffled fresh shoe.');
  }

  balance -= currentBet;
  playerBets     = [currentBet];
  playerHands    = [[]];
  currentHandIdx = 0;
  isSplitAces    = false;
  dealerHand     = [];

  resultBanner.classList.remove('visible');
  feltWatermark.style.opacity = '';

  state = S.PLAYING;

  countCard(dealCard(playerHands[0]).rank);
  setTimeout(() => {
    countCard(dealCard(dealerHand).rank); // up card
    setTimeout(() => {
      countCard(dealCard(playerHands[0]).rank);
      setTimeout(() => {
        dealCard(dealerHand); // hole card — counted when revealed
        renderDealerHand(true);
        renderPlayerHand();
        updateUI();

        const pBJ = isBlackjack(playerHands[0]);
        const dBJ = isBlackjack(dealerHand);

        if (pBJ || dBJ) {
          setTimeout(() => {
            countCard(dealerHand[1].rank); // hole revealed
            renderDealerHand(false);
            playCardFlip();
            setTimeout(resolveRound, 600);
          }, 400);
          return;
        }

        eddie(eddieLines.dealt);
        setTimeout(() => {
          const hint = getStrategyHint(playerHands[0], dealerHand[0]);
          if (hint) eddie(hint);
        }, 1200);

        // Consult AI after deal sequence completes
        setTimeout(() => consultAIAgent(), 800);
      }, 300);
    }, 300);
  }, 300);
});

/* ============================================================
   ACTION: HIT
   BUG 10 fix: use doStand() instead of standBtn.click() for auto-stand on 21
============================================================ */
hitBtn.addEventListener('click', () => {
  if (state !== S.PLAYING) return;
  const hand  = playerHands[currentHandIdx];
  const prevT = handTotal(hand);

  if (prevT >= 18) eddie(eddieLines.boldHit);

  countCard(dealCard(hand).rank);
  renderPlayerHand();
  updateUI();

  if (!checkBust()) {
    if (handTotal(hand) === 21) {
      setTimeout(doStand, 400); // BUG 10 fix: no synthetic click
      return;
    }
    const hint = getStrategyHint(hand, dealerHand[0]);
    if (hint) eddie(hint);
    consultAIAgent();
  }
});

/* ============================================================
   ACTION: DOUBLE DOWN
   BUG 5 fix: bust after double goes directly to resolveRound
   BUG 10 fix: use doStand() for auto-stand
============================================================ */
doubleBtn.addEventListener('click', () => {
  if (state !== S.PLAYING) return;
  const hand = playerHands[currentHandIdx];
  if (hand.length !== 2 || balance < playerBets[currentHandIdx]) return;

  balance -= playerBets[currentHandIdx];
  playerBets[currentHandIdx] *= 2;
  eddie(eddieLines.doubleDown);

  countCard(dealCard(hand).rank);
  renderPlayerHand();
  updateUI();

  const t = handTotal(hand);
  if (t > 21) {
    playLose();
    eddie(eddieLines.bust);
    // BUG 5 fix: skip dealer play when player busts
    setTimeout(resolveRound, 700);
  } else {
    setTimeout(doStand, 450);
  }
});

/* ============================================================
   ACTION: SPLIT
   BUG 3 fix: balance check uses playerBets[0] not currentBet
   BUG 6 fix: split aces deal sequence is chained, then dealer plays
============================================================ */
splitBtn.addEventListener('click', () => {
  if (state !== S.PLAYING) return;
  const hand = playerHands[0];
  if (hand.length !== 2 || rankVal(hand[0].rank) !== rankVal(hand[1].rank)) return;
  // BUG 3 fix: use playerBets[0]
  if (balance < playerBets[0]) return;

  isSplitAces = (hand[0].rank === 'A');
  balance -= playerBets[0];

  playerHands = [[hand[0]], [hand[1]]];
  playerBets  = [playerBets[0], playerBets[0]];
  currentHandIdx = 0;

  eddie(eddieLines.split);

  if (isSplitAces) {
    // BUG 6 fix: fully chained sequence, no advanceSplitOrResolve for aces
    setTimeout(() => {
      countCard(dealCard(playerHands[0]).rank);
      setTimeout(() => {
        countCard(dealCard(playerHands[1]).rank);
        renderPlayerHand();
        updateUI();
        setTimeout(() => dealerPlay(resolveRound), 500);
      }, 350);
    }, 300);
  } else {
    setTimeout(() => {
      countCard(dealCard(playerHands[0]).rank);
      setTimeout(() => {
        countCard(dealCard(playerHands[1]).rank);
        renderPlayerHand();
        updateUI();
        const hint = getStrategyHint(playerHands[0], dealerHand[0]);
        if (hint) eddie(hint);
        consultAIAgent();
      }, 350);
    }, 300);
  }
});

/* ============================================================
   NEW ROUND
   POLISH 20: delay clearing resultDetail by 600ms
   POLISH 23: initial player score shows — not 0
============================================================ */
function newRound() {
  currentBet     = 0;
  playerHands    = [[]];
  playerBets     = [0];
  currentHandIdx = 0;
  isSplitAces    = false;
  dealerHand     = [];

  dealerHandEl.innerHTML     = '';
  playerHandEl.innerHTML     = '';
  playerHandsWrap.innerHTML  = '';
  playerHandEl.style.display = 'flex';
  playerHandsWrap.style.display = 'none';
  dealerScoreEl.textContent  = '—';
  dealerScoreEl.className    = 'hand-score';
  playerScoreEl.textContent  = '—'; // POLISH 23: — instead of 0
  playerScoreEl.className    = 'hand-score';

  // POLISH 20: delay clearing result detail
  setTimeout(() => {
    resultBanner.classList.remove('visible');
    resultText.textContent   = '';
    resultDetail.textContent = '';
    feltWatermark.style.opacity = '';
  }, 600);

  resetAIPanel();
  state = S.BETTING;
  updateUI();

  if (balance < 50) {
    eddie(eddieLines.lowBalance);
  } else {
    eddie("Place your bet and let's see what the deck holds tonight.");
  }
}

/* ============================================================
   RESTART (game over)
============================================================ */
restartBtn.addEventListener('click', () => {
  balance = 500;
  runningCount = 0;
  updateCountDisplay();
  gameoverScreen.classList.remove('visible');
  newRound();
  balanceDisp.textContent = '$500';
  eddie(eddieLines.load);
});

/* ============================================================
   AI AGENT — .env PARSING
============================================================ */
let apiKey = null;
let currentAIAction = null;

document.getElementById('api-key-input').addEventListener('input', (e) => {
  const val = e.target.value.trim();
  if (val.startsWith('sk-ant-')) {
    apiKey = val;
    aiStatusDot.className     = 'dot-loaded';
    aiStatusLabel.textContent = 'Key loaded';
    console.log('[AI Agent] API key set via paste input.');
  }
});
document.getElementById('api-key-input').addEventListener('keydown', (e) => {
  if (e.key !== 'Enter') return;
  const val = e.target.value.trim();
  if (val.startsWith('sk-ant-')) {
    apiKey = val;
    aiStatusDot.className     = 'dot-loaded';
    aiStatusLabel.textContent = 'Key loaded';
    console.log('[AI Agent] API key set via Enter key.');
  }
});

envFileInput.addEventListener('change', () => {
  const file = envFileInput.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (e) => {
    const text = e.target.result;
    const match = text.match(/ANTHROPIC_API_KEY\s*=\s*([^\s\n\r]+)/);
    if (match) {
      apiKey = match[1].trim();
      aiStatusDot.className   = 'dot-loaded';
      aiStatusLabel.textContent = 'Key loaded';
      console.log('[AI Agent] API key loaded successfully.');
    } else {
      apiKey = null;
      aiStatusDot.className   = 'dot-inactive';
      aiStatusLabel.textContent = 'No key found in file';
      console.log('[AI Agent] No ANTHROPIC_API_KEY found in .env file.');
    }
  };
  reader.readAsText(file);
});

/* ============================================================
   AI AGENT — PANEL STATE HELPERS
============================================================ */
function setAILoading() {
  currentAIAction = null;
  aiRecBadge.className   = 'rec-loading';
  aiRecBadge.textContent = '...';
  aiReasoning.textContent = 'Consulting the odds...';
  aiExecuteBtn.disabled  = true;
  aiExecuteBtn.style.display = 'inline-block';
}

function setAIRecommendation(action, reasoning, confidence) {
  currentAIAction = action ? action.toLowerCase() : null;
  const cls = {
    hit: 'rec-hit', stand: 'rec-stand',
    double: 'rec-double', split: 'rec-split'
  }[currentAIAction] || 'rec-none';

  aiRecBadge.className   = cls;
  aiRecBadge.textContent = action ? action.toUpperCase() : '—';
  aiReasoning.textContent = reasoning || '';
  aiExecuteBtn.disabled  = !currentAIAction;
  aiExecuteBtn.style.display = currentAIAction ? 'inline-block' : 'none';

  // Flash dot green briefly on success
  aiStatusDot.className = 'dot-success';
  setTimeout(() => { aiStatusDot.className = apiKey ? 'dot-loaded' : 'dot-inactive'; }, 2000);
}

function setAIError(msg) {
  currentAIAction = null;
  aiRecBadge.className   = 'rec-none';
  aiRecBadge.textContent = '—';
  aiReasoning.textContent = msg;
  aiExecuteBtn.disabled  = true;
  aiExecuteBtn.style.display = 'none';
}

function resetAIBadge() {
  currentAIAction = null;
  aiRecBadge.className   = 'rec-none';
  aiRecBadge.textContent = '—';
  aiExecuteBtn.style.display = 'none';
}

function resetAIPanel() {
  resetAIBadge();
  if (apiKey) {
    aiReasoning.textContent = 'Deal a hand and I\'ll analyze your position.';
  } else {
    aiReasoning.textContent = 'Upload a .env file with your ANTHROPIC_API_KEY to enable the AI agent.';
  }
}

/* ============================================================
   AI AGENT — API CALL
============================================================ */
async function consultAIAgent() {
  if (!apiKey) return;
  if (state !== S.PLAYING) return;

  const hand         = playerHands[currentHandIdx];
  const playerTotal  = handTotal(hand);
  const soft         = isSoft(hand);
  const canDouble    = hand.length === 2 && balance >= playerBets[currentHandIdx] && !isSplitAces;
  const canSplit     = hand.length === 2 &&
                       rankVal(hand[0].rank) === rankVal(hand[1].rank) &&
                       balance >= playerBets[currentHandIdx] &&
                       playerHands.length === 1;
  const dealerUpCard = dealerHand[0] ? dealerHand[0].rank : '?';
  const playerHand   = hand.map(c => c.rank + c.suit).join(', ');

  setAILoading();
  console.log('[AI Agent] Consulting Claude...');
  console.log('[AI Agent] Game state:', { playerHand, dealerUpCard, playerTotal, soft, canDouble, canSplit });

  const systemPrompt = `You are an expert Blackjack strategy advisor.
Analyze the given game state and respond with ONLY a valid JSON object — no preamble, no markdown, no explanation outside the JSON.
The JSON must have exactly this shape:
{
  "action": "hit" | "stand" | "double" | "split",
  "confidence": "high" | "medium" | "low",
  "reasoning": "One or two sentences explaining the recommendation in the style of a seasoned 1920s card dealer."
}`;

  const userPrompt = `Player hand: ${playerHand}
Player total: ${playerTotal} (${soft ? 'soft' : 'hard'})
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

    const cleaned = raw.replace(/```json|```/g, '').trim();
    const parsed  = JSON.parse(cleaned);
    console.log('[AI Agent] Parsed recommendation:', parsed);

    // Only apply if still in PLAYING state
    if (state === S.PLAYING) {
      setAIRecommendation(parsed.action, parsed.reasoning, parsed.confidence);
    }
  } catch (err) {
    console.error('[AI Agent] Error:', err);
    if (state === S.PLAYING) {
      setAIError('Something went wrong. Check console for details.');
    }
  }
}

/* ============================================================
   AI AGENT — EXECUTE RECOMMENDATION BUTTON
============================================================ */
aiExecuteBtn.addEventListener('click', () => {
  if (!currentAIAction) return;
  console.log('[AI Agent] Executing recommendation:', currentAIAction);
  switch (currentAIAction) {
    case 'hit':    hitBtn.click();    break;
    case 'stand':  doStand();         break;
    case 'double': doubleBtn.click(); break;
    case 'split':  splitBtn.click();  break;
  }
  resetAIPanel();
});

/* ============================================================
   INIT
============================================================ */
updateUI();
updateCountDisplay();
