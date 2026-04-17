/* ============================================================
   Science Experiment Generator — script.js
   ============================================================ */

'use strict';

/* ============================================================
   IN-MEMORY STATE
   ============================================================ */
let apiKey = '';
let currentExperiment = null;  // { html, grade, title, difficulty, timestamp }
const experimentHistory = [];  // array of experiment objects

/* ============================================================
   DOM REFERENCES
   ============================================================ */
const $ = id => document.getElementById(id);

const dom = {
  keyFile:              $('key-file'),
  keyLoadedBadge:       $('key-loaded-badge'),
  apiKeyManual:         $('api-key-manual'),
  keyError:             $('key-error'),

  gradeSelect:          $('grade-select'),
  gradeError:           $('grade-error'),

  suppliesInput:        $('supplies-input'),
  suppliesError:        $('supplies-error'),

  quickSuppliesGrid:    $('quick-supplies-grid'),

  btnGenerate:          $('btn-generate'),
  btnGenerateText:      $('btn-generate-text'),
  btnGenerateSpinner:   $('btn-generate-spinner'),

  errorBanner:          $('error-banner'),
  errorBannerText:      $('error-banner-text'),
  btnDismissError:      $('btn-dismiss-error'),

  emptyState:           $('empty-state'),
  experimentCard:       $('experiment-card'),
  difficultyBadge:      $('difficulty-badge'),
  btnPrint:             $('btn-print'),
  experimentOutput:     $('experiment-output'),

  substitutionSection:  $('substitution-section'),
  btnSubstitution:      $('btn-substitution'),
  substitutionPanel:    $('substitution-panel'),
  substitutionInput:    $('substitution-input'),
  btnSubstitutionSubmit:$('btn-substitution-submit'),
  substitutionOutput:   $('substitution-output'),

  historySection:       $('history-section'),
  btnClearHistory:      $('btn-clear-history'),
  historyList:          $('history-list'),

  printWorksheet:       $('print-worksheet'),
  printExperimentTitle: $('print-experiment-title'),
};

/* ============================================================
   PROMPTS
   ============================================================ */
const SYSTEM_PROMPT = `You are a friendly, enthusiastic science teacher who creates safe, fun, engaging science experiments for K-12 students. Your experiments use only the supplies provided. Always format your response with clear sections: a title, difficulty rating, materials needed, hypothesis, step-by-step procedure, what to observe, the science behind it, and a fun variation to try. Use age-appropriate language for the specified grade level.`;

function buildUserPrompt(grade, supplies) {
  return `Create a science experiment for a ${grade} student using these supplies: ${supplies}.
Format the experiment with these sections:
🧪 Experiment Title
⭐ Difficulty: [Easy / Medium / Hard]
📋 Materials Needed
💡 Hypothesis (what we think will happen)
📝 Step-by-Step Procedure
👀 What to Observe
🔬 The Science Behind It
🌟 Fun Variation to Try
Make it exciting and age-appropriate for ${grade}!`;
}

function buildSubstitutionPrompt(supply, experimentContext) {
  return `I am doing a science experiment and I don't have "${supply}". What are 2-3 safe, common household substitutes I could use instead? Keep your answer brief and practical. Context: ${experimentContext}`;
}

/* ============================================================
   OPENAI FETCH — same pattern as temp/script.js
   ============================================================ */
async function callOpenAI(messages, maxTokens = 1200) {
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages,
      max_tokens: maxTokens,
    }),
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    const err = new Error(errData?.error?.message || `HTTP ${res.status}`);
    err.status = res.status;
    throw err;
  }

  return res.json();
}

/* ============================================================
   API KEY HANDLING
   ============================================================ */

/* Identical parsing logic to temp/script.js parseKeyFromFile */
function parseKeyFromFile(text) {
  // .env: OPENAI_API_KEY=sk-...
  const envMatch = text.match(/OPENAI_API_KEY\s*=\s*["']?(sk-[A-Za-z0-9\-_]+)["']?/i);
  if (envMatch) return envMatch[1].trim();

  // CSV: first column starting with sk-
  const lines = text.split(/\r?\n/).filter(l => l.trim());
  for (const line of lines) {
    const firstCol = line.split(',')[0].replace(/["']/g, '').trim();
    if (firstCol.startsWith('sk-')) return firstCol;
  }

  // Bare key anywhere in the file
  const bareMatch = text.match(/sk-[A-Za-z0-9\-_]{20,}/);
  if (bareMatch) return bareMatch[0].trim();

  return null;
}

function onKeyLoaded(key) {
  apiKey = key;
  dom.keyLoadedBadge.classList.remove('hidden');
  clearFieldError(dom.keyError);
  updateGenerateButton();
}

function attachKeyListeners() {
  dom.keyFile.addEventListener('change', e => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = evt => {
      const key = parseKeyFromFile(evt.target.result);
      if (key) {
        onKeyLoaded(key);
        dom.apiKeyManual.value = '';
      } else {
        showFieldError(dom.keyError, 'Could not find OPENAI_API_KEY in that file.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  });

  dom.apiKeyManual.addEventListener('input', () => {
    const val = dom.apiKeyManual.value.trim();
    if (val) {
      onKeyLoaded(val);
    } else {
      apiKey = '';
      dom.keyLoadedBadge.classList.add('hidden');
      updateGenerateButton();
    }
    clearFieldError(dom.keyError);
  });
}

/* ============================================================
   GENERATE BUTTON — enable/disable logic
   ============================================================ */
function updateGenerateButton() {
  const hasKey     = apiKey.trim().length > 0;
  const hasSupplies = dom.suppliesInput.value.trim().length > 0;
  dom.btnGenerate.disabled = !(hasKey && hasSupplies);
}

/* ============================================================
   QUICK-SELECT CHIPS (Stretch 2)
   ============================================================ */
const CATEGORY_CLASS = {
  'chip-chemical': 'chip-chemical',
  'chip-kitchen':  'chip-kitchen',
  'chip-craft':    'chip-craft',
};

let activeFilter = null;  // 'chip-chemical' | 'chip-kitchen' | 'chip-craft' | null

function applyChipFilter(category) {
  const allChips = dom.quickSuppliesGrid.querySelectorAll('.supply-chip');
  allChips.forEach(chip => {
    chip.style.display = (!category || chip.classList.contains(category)) ? '' : 'none';
  });
}

function attachChipListeners() {
  // Legend filter clicks
  document.querySelectorAll('.chip-legend .legend-chip').forEach(legend => {
    legend.style.cursor = 'pointer';
    legend.addEventListener('click', () => {
      const cat = Object.keys(CATEGORY_CLASS).find(c => legend.classList.contains(c));
      if (!cat) return;

      if (activeFilter === cat) {
        // Deselect — show all
        activeFilter = null;
        legend.style.outline = '';
        document.querySelectorAll('.chip-legend .legend-chip').forEach(l => {
          l.style.opacity = '';
        });
      } else {
        activeFilter = cat;
        document.querySelectorAll('.chip-legend .legend-chip').forEach(l => {
          l.style.opacity = l === legend ? '1' : '0.4';
        });
        legend.style.outline = '2px solid currentColor';
        legend.style.outlineOffset = '2px';
      }

      applyChipFilter(activeFilter);
    });
  });

  dom.quickSuppliesGrid.addEventListener('click', e => {
    const chip = e.target.closest('.supply-chip');
    if (!chip) return;

    const supply = chip.dataset.supply;
    const isActive = chip.classList.toggle('active');

    const textarea = dom.suppliesInput;
    const current = textarea.value;

    if (isActive) {
      // Append supply (comma-separated)
      if (current.trim()) {
        textarea.value = current.trimEnd().replace(/,\s*$/, '') + ', ' + supply;
      } else {
        textarea.value = supply;
      }
    } else {
      // Remove supply from textarea
      const pattern = new RegExp(
        '(^|,\\s*)' + escapeRegex(supply) + '(\\s*,|$)',
        'gi'
      );
      let updated = textarea.value.replace(pattern, (_, pre, post) => {
        if (pre && post) return ', ';
        return '';
      }).replace(/^,\s*/, '').replace(/,\s*$/, '').trim();
      textarea.value = updated;
    }

    updateGenerateButton();
  });
}

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/* ============================================================
   MAIN GENERATE FLOW
   ============================================================ */
function attachGenerateListener() {
  dom.btnGenerate.addEventListener('click', handleGenerate);
}

async function handleGenerate() {
  clearError();
  clearFieldError(dom.gradeError);
  clearFieldError(dom.suppliesError);

  const grade    = dom.gradeSelect.value.trim();
  const supplies = dom.suppliesInput.value.trim();

  if (!grade) {
    showFieldError(dom.gradeError, 'Please select a grade level.');
    dom.gradeSelect.focus();
    return;
  }

  if (!supplies) {
    showFieldError(dom.suppliesError, 'Please list at least one supply.');
    dom.suppliesInput.focus();
    return;
  }

  setGenerateLoading(true);

  try {
    const messages = [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user',   content: buildUserPrompt(grade, supplies) },
    ];

    const data = await callOpenAI(messages, 1200);
    const raw  = data.choices[0].message.content.trim();

    const html       = markdownToHtml(raw);
    const title      = extractTitle(raw);
    const difficulty = extractDifficulty(raw);

    currentExperiment = {
      html,
      grade,
      title,
      difficulty,
      raw,
      timestamp: new Date(),
    };

    renderExperiment(currentExperiment);
    saveToHistory(currentExperiment);

  } catch (err) {
    handleApiError(err);
  } finally {
    setGenerateLoading(false);
  }
}

/* ============================================================
   RENDER EXPERIMENT
   ============================================================ */
function renderExperiment(exp) {
  dom.emptyState.classList.add('hidden');
  dom.experimentOutput.innerHTML = exp.html;
  renderDifficultyBadge(exp.difficulty);
  dom.btnPrint.classList.remove('hidden');
  dom.substitutionSection.classList.remove('hidden');
  dom.substitutionPanel.classList.add('hidden');
  dom.substitutionOutput.classList.add('hidden');
  dom.substitutionOutput.innerHTML = '';
  dom.substitutionInput.value = '';
  dom.experimentCard.classList.remove('hidden');
  dom.printExperimentTitle.textContent = exp.title || 'Science Experiment';
  dom.experimentCard.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

/* ============================================================
   MARKDOWN → HTML CONVERTER
   Handles: # headings, **bold**, bullet lists, numbered lists,
   blank-line paragraphs, emoji section headers, line breaks.
   ============================================================ */
function markdownToHtml(text) {
  const lines = text.split('\n');
  const out   = [];
  let inList      = false;
  let listType    = null;  // 'ul' | 'ol'

  function closeList() {
    if (inList) {
      out.push(`</${listType}>`);
      inList   = false;
      listType = null;
    }
  }

  for (let i = 0; i < lines.length; i++) {
    const raw  = lines[i];
    const line = raw.trim();

    // Blank line
    if (!line) {
      closeList();
      out.push('<br>');
      continue;
    }

    // ATX headings
    const h3Match = line.match(/^###\s+(.+)/);
    const h2Match = line.match(/^##\s+(.+)/);
    const h1Match = line.match(/^#\s+(.+)/);
    if (h3Match) { closeList(); out.push(`<h3>${inlineFormat(h3Match[1])}</h3>`); continue; }
    if (h2Match) { closeList(); out.push(`<h2>${inlineFormat(h2Match[1])}</h2>`); continue; }
    if (h1Match) { closeList(); out.push(`<h1>${inlineFormat(h1Match[1])}</h1>`); continue; }

    // Unordered list
    const ulMatch = line.match(/^[-*]\s+(.+)/);
    if (ulMatch) {
      if (!inList || listType !== 'ul') {
        closeList();
        out.push('<ul>');
        inList   = true;
        listType = 'ul';
      }
      out.push(`<li>${inlineFormat(ulMatch[1])}</li>`);
      continue;
    }

    // Ordered list
    const olMatch = line.match(/^\d+\.\s+(.+)/);
    if (olMatch) {
      if (!inList || listType !== 'ol') {
        closeList();
        out.push('<ol>');
        inList   = true;
        listType = 'ol';
      }
      out.push(`<li>${inlineFormat(olMatch[1])}</li>`);
      continue;
    }

    closeList();

    // Emoji section headers (lines that start with a known section emoji)
    const sectionEmojiRe = /^(🧪|⭐|📋|💡|📝|👀|🔬|🌟)/;
    if (sectionEmojiRe.test(line)) {
      out.push(`<span class="experiment-section-header">${inlineFormat(line)}</span>`);
      continue;
    }

    // Regular paragraph line
    out.push(`<p>${inlineFormat(line)}</p>`);
  }

  closeList();

  // Collapse consecutive <br> into a single one
  return out.join('\n').replace(/(<br>\s*){2,}/g, '<br>');
}

function inlineFormat(text) {
  // Bold: **text** or __text__
  text = text.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  text = text.replace(/__(.+?)__/g, '<strong>$1</strong>');
  // Italic: *text* or _text_
  text = text.replace(/\*(.+?)\*/g, '<em>$1</em>');
  text = text.replace(/_(.+?)_/g, '<em>$1</em>');
  return text;
}

/* ============================================================
   DIFFICULTY BADGE (Stretch 5)
   ============================================================ */
function extractDifficulty(text) {
  const match = text.match(/difficulty[:\s*]+\[?(easy|medium|hard)\]?/i);
  if (match) return match[1].toLowerCase();
  if (/\beasy\b/i.test(text))   return 'easy';
  if (/\bmedium\b/i.test(text)) return 'medium';
  if (/\bhard\b/i.test(text))   return 'hard';
  return null;
}

function extractTitle(text) {
  // Look for the 🧪 section line
  const match = text.match(/🧪\s*(?:Experiment Title[:\s]*)?(.+)/i);
  if (match) return match[1].replace(/[*_#]/g, '').trim();
  // Fallback: first non-empty line
  const firstLine = text.split('\n').find(l => l.trim());
  return firstLine ? firstLine.replace(/[*_#🧪]/g, '').trim() : 'Science Experiment';
}

function renderDifficultyBadge(difficulty) {
  const badge = dom.difficultyBadge;
  badge.className = 'difficulty-badge';

  if (!difficulty) {
    badge.classList.add('hidden');
    return;
  }

  const configs = {
    easy:   { cls: 'badge-easy',   label: '⭐ Easy' },
    medium: { cls: 'badge-medium', label: '⭐⭐ Medium' },
    hard:   { cls: 'badge-hard',   label: '⭐⭐⭐ Hard' },
  };

  const cfg = configs[difficulty];
  if (!cfg) { badge.classList.add('hidden'); return; }

  badge.classList.add(cfg.cls);
  badge.textContent = cfg.label;
  badge.classList.remove('hidden');
}

/* ============================================================
   HISTORY (Stretch 1)
   ============================================================ */
function saveToHistory(exp) {
  experimentHistory.unshift(exp);
  renderHistory();
}

function renderHistory() {
  if (experimentHistory.length === 0) {
    dom.historySection.classList.add('hidden');
    return;
  }

  dom.historySection.classList.remove('hidden');
  dom.historyList.innerHTML = '';

  experimentHistory.forEach((exp, idx) => {
    const card = document.createElement('div');
    card.className = 'history-card';
    card.setAttribute('role', 'listitem');

    const timeStr = exp.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const dateStr = exp.timestamp.toLocaleDateString();

    const diffLabel = exp.difficulty
      ? { easy: '⭐ Easy', medium: '⭐⭐ Medium', hard: '⭐⭐⭐ Hard' }[exp.difficulty] || ''
      : '';

    card.innerHTML = `
      <div class="history-card-info">
        <span class="history-card-title">${escapeHtml(exp.title || 'Experiment')}</span>
        <span class="history-card-meta">${escapeHtml(exp.grade)} · ${dateStr} ${timeStr}${diffLabel ? ' · ' + diffLabel : ''}</span>
      </div>
      <div class="history-card-actions">
        <button type="button" class="btn btn-sm btn-outline" data-idx="${idx}" aria-label="View experiment: ${escapeHtml(exp.title || 'Experiment')}">View</button>
      </div>
    `;

    card.querySelector('button').addEventListener('click', () => {
      currentExperiment = exp;
      renderExperiment(exp);
    });

    dom.historyList.appendChild(card);
  });
}

function attachHistoryListeners() {
  dom.btnClearHistory.addEventListener('click', () => {
    experimentHistory.length = 0;
    renderHistory();
  });
}

/* ============================================================
   SUBSTITUTION (Stretch 3)
   ============================================================ */
function attachSubstitutionListeners() {
  dom.btnSubstitution.addEventListener('click', () => {
    const isOpen = !dom.substitutionPanel.classList.contains('hidden');
    dom.substitutionPanel.classList.toggle('hidden', isOpen);
    if (!isOpen) dom.substitutionInput.focus();
  });

  dom.btnSubstitutionSubmit.addEventListener('click', handleSubstitution);

  dom.substitutionInput.addEventListener('keydown', e => {
    if (e.key === 'Enter') handleSubstitution();
  });
}

async function handleSubstitution() {
  const supply = dom.substitutionInput.value.trim();
  if (!supply) return;

  const context = currentExperiment
    ? `The experiment is: ${currentExperiment.title || 'a science experiment'} for ${currentExperiment.grade || 'K-12'} using: ${dom.suppliesInput.value.trim()}.`
    : `Science experiment using: ${dom.suppliesInput.value.trim()}.`;

  dom.btnSubstitutionSubmit.disabled = true;
  dom.btnSubstitutionSubmit.textContent = '…';
  dom.substitutionOutput.classList.add('hidden');

  try {
    const messages = [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user',   content: buildSubstitutionPrompt(supply, context) },
    ];
    const data = await callOpenAI(messages, 400);
    const raw  = data.choices[0].message.content.trim();
    dom.substitutionOutput.innerHTML = markdownToHtml(raw);
    dom.substitutionOutput.classList.remove('hidden');
  } catch (err) {
    dom.substitutionOutput.innerHTML = `<span style="color:var(--color-error);">Could not fetch substitutions — check your API key and try again.</span>`;
    dom.substitutionOutput.classList.remove('hidden');
  } finally {
    dom.btnSubstitutionSubmit.disabled = false;
    dom.btnSubstitutionSubmit.textContent = 'Find Substitutes';
  }
}

/* ============================================================
   PRINT WORKSHEET (Stretch 4)
   ============================================================ */
function attachPrintListener() {
  dom.btnPrint.addEventListener('click', () => {
    dom.printExperimentTitle.textContent =
      currentExperiment?.title || 'Science Experiment';
    window.print();
  });
}

/* ============================================================
   LOADING STATE
   ============================================================ */
function setGenerateLoading(on) {
  dom.btnGenerate.disabled      = on;
  dom.btnGenerateText.classList.toggle('hidden', on);
  dom.btnGenerateSpinner.classList.toggle('hidden', !on);

  if (on) {
    dom.btnGenerate.setAttribute('aria-label', 'Cooking up an experiment, please wait…');
    // Show inline loading in output area
    dom.emptyState.classList.add('hidden');
    dom.experimentCard.classList.add('hidden');

    let loadingEl = document.getElementById('loading-overlay-main');
    if (!loadingEl) {
      loadingEl = document.createElement('div');
      loadingEl.id = 'loading-overlay-main';
      loadingEl.className = 'loading-overlay';
      loadingEl.innerHTML = `<span class="spinner"></span> 🔬 Cooking up an experiment…`;
      dom.experimentCard.parentNode.insertBefore(loadingEl, dom.experimentCard);
    }
  } else {
    dom.btnGenerate.setAttribute('aria-label', 'Generate science experiment');
    const loadingEl = document.getElementById('loading-overlay-main');
    if (loadingEl) loadingEl.remove();
    if (!on && !apiKey) {
      // restore disabled state after loading if key was cleared
    } else {
      updateGenerateButton();
    }
  }
}

/* ============================================================
   ERROR HANDLING — same pattern as temp/script.js
   ============================================================ */
function handleApiError(err) {
  let msg;
  if (err.status === 401) {
    msg = 'Invalid API key. Please check and re-enter.';
  } else if (err.status === 429) {
    msg = 'Rate limit reached. Wait a moment and try again.';
  } else if (err.name === 'TypeError' || err.message?.includes('fetch')) {
    msg = 'Network error — check your internet connection.';
  } else {
    msg = `Something went wrong — check your API key and try again. (${err.message || 'Unknown error'})`;
  }
  showError(msg);
}

function showError(message) {
  dom.errorBannerText.textContent = message;
  dom.errorBanner.classList.remove('hidden');
}

function clearError() {
  dom.errorBanner.classList.add('hidden');
  dom.errorBannerText.textContent = '';
}

function showFieldError(el, message) {
  el.textContent = message;
  el.classList.remove('hidden');
}

function clearFieldError(el) {
  el.textContent = '';
  el.classList.add('hidden');
}

/* ============================================================
   UTILITIES
   ============================================================ */
function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/* ============================================================
   INIT
   ============================================================ */
function init() {
  attachKeyListeners();
  attachChipListeners();
  attachGenerateListener();
  attachHistoryListeners();
  attachSubstitutionListeners();
  attachPrintListener();

  dom.btnDismissError.addEventListener('click', clearError);

  // Update generate button whenever supplies change
  dom.suppliesInput.addEventListener('input', updateGenerateButton);
  dom.gradeSelect.addEventListener('change', () => clearFieldError(dom.gradeError));

  updateGenerateButton();
}

document.addEventListener('DOMContentLoaded', init);
