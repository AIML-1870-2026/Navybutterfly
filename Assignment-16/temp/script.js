/* ============================================================
   LLM Switchboard — script.js
   Full logic: API, providers, modes, comparison, metrics,
   prompt library, structured output validator.
   ============================================================ */

'use strict';

/* ---- Preset keys — read from DOM at runtime (keys live in index.html) ---- */
let CLASS_KEYS = { openai: '', anthropic: '' };

/* ---- In-memory state ---- */
const state = {
  provider: 'openai',        // 'openai' | 'anthropic'
  model: 'gpt-4o',
  compareModelA: 'gpt-4o',
  compareModelB: 'gpt-4o-mini',
  apiKeyA: '',
  apiKeyB: '',
  mode: 'unstructured',      // 'unstructured' | 'structured'
  compareMode: false,
  libraryOpen: false,
  promptLibrary: [],         // max 20 saved prompts
  MAX_LIBRARY: 20,
};

/* ============================================================
   EXAMPLE PROMPTS
   ============================================================ */
const EXAMPLE_PROMPTS = {
  'unstructured-1': {
    prompt: 'Explain the mechanism of action of beta-blockers and why they\'re used in heart failure.',
    mode: 'unstructured',
  },
  'unstructured-2': {
    prompt: 'What is the difference between Type 1 and Type 2 diabetes at the cellular level?',
    mode: 'unstructured',
  },
  'unstructured-3': {
    prompt: 'Walk me through the steps of a physical exam for a patient presenting with chest pain.',
    mode: 'unstructured',
  },
  'unstructured-4': {
    prompt: 'Explain how the kidneys regulate blood pressure using the renin-angiotensin-aldosterone system.',
    mode: 'unstructured',
  },
  'unstructured-5': {
    prompt: 'What are the key differences between gram-positive and gram-negative bacteria in terms of structure and antibiotic targets?',
    mode: 'unstructured',
  },
  'structured-1': {
    prompt: 'Describe the drug ibuprofen',
    mode: 'structured',
    schema: 'drug',
  },
  'structured-2': {
    prompt: 'Summarize the condition myocardial infarction',
    mode: 'structured',
    schema: 'condition',
  },
  'structured-3': {
    prompt: 'Describe the muscle biceps brachii',
    mode: 'structured',
    schema: 'muscle',
  },
  'structured-4': {
    prompt: 'Identify key facts about the element calcium in the human body',
    mode: 'structured',
    schema: 'element',
  },
};

/* ============================================================
   JSON SCHEMA TEMPLATES
   ============================================================ */
const SCHEMA_TEMPLATES = {
  drug: {
    type: 'object',
    properties: {
      name:             { type: 'string' },
      drug_class:       { type: 'string' },
      mechanism:        { type: 'string' },
      common_uses:      { type: 'array', items: { type: 'string' } },
      side_effects:     { type: 'array', items: { type: 'string' } },
      contraindications:{ type: 'array', items: { type: 'string' } },
    },
    required: ['name', 'drug_class', 'mechanism', 'common_uses', 'side_effects'],
  },
  condition: {
    type: 'object',
    properties: {
      condition:           { type: 'string' },
      affected_organ:      { type: 'string' },
      pathophysiology:     { type: 'string' },
      symptoms:            { type: 'array', items: { type: 'string' } },
      emergency_treatment: { type: 'string' },
    },
    required: ['condition', 'affected_organ', 'pathophysiology', 'symptoms'],
  },
  muscle: {
    type: 'object',
    properties: {
      muscle_name:   { type: 'string' },
      origin:        { type: 'string' },
      insertion:     { type: 'string' },
      action:        { type: 'string' },
      innervation:   { type: 'string' },
      clinical_note: { type: 'string' },
    },
    required: ['muscle_name', 'origin', 'insertion', 'action', 'innervation'],
  },
  element: {
    type: 'object',
    properties: {
      element:            { type: 'string' },
      role_in_body:       { type: 'string' },
      normal_serum_range: { type: 'string' },
      deficiency_condition:{ type: 'string' },
      excess_condition:   { type: 'string' },
    },
    required: ['element', 'role_in_body', 'normal_serum_range'],
  },
  custom: null,
};

/* ============================================================
   DOM REFERENCES
   ============================================================ */
const $ = id => document.getElementById(id);

const dom = {
  // Provider
  btnOpenAI:         $('btn-openai'),
  btnAnthropic:      $('btn-anthropic'),
  modelSelect:       $('model-select'),
  singleModeProvider:$('single-mode-provider'),
  compareModeProvider:$('compare-mode-provider'),
  anthropicInfo:     $('anthropic-info'),
  compareModelA:     $('compare-model-a'),
  compareModelB:     $('compare-model-b'),

  // API keys
  apiKeyA:           $('api-key-a'),
  apiKeyB:           $('api-key-b'),
  btnShowKeyA:       $('btn-show-key-a'),
  btnShowKeyB:       $('btn-show-key-b'),
  keyMaskedA:        $('key-masked-a'),
  keyMaskedB:        $('key-masked-b'),
  keyMaskedTextA:    $('key-masked-text-a'),
  keyMaskedTextB:    $('key-masked-text-b'),
  btnClearKeyA:      $('btn-clear-key-a'),
  btnClearKeyB:      $('btn-clear-key-b'),
  keyFileA:          $('key-file-a'),
  keyFileB:          $('key-file-b'),
  keySuggestionsA:   $('key-suggestions-a'),
  keySuggestionsB:   $('key-suggestions-b'),
  keyErrorA:         $('key-error-a'),
  keyErrorB:         $('key-error-b'),
  compareKeyToggle:  $('compare-key-toggle'),
  keySectionA:       $('key-section-a'),
  keySectionB:       $('key-section-b'),

  // Mode
  btnModeUnstructured: $('btn-mode-unstructured'),
  btnModeStructured:   $('btn-mode-structured'),

  // Prompt
  systemPrompt:      $('system-prompt'),
  examplePrompts:    $('example-prompts'),
  userPrompt:        $('user-prompt'),
  promptError:       $('prompt-error'),
  btnSavePrompt:     $('btn-save-prompt'),

  // Schema
  cardSchema:        $('card-schema'),
  schemaTemplate:    $('schema-template'),
  schemaTextarea:    $('schema-textarea'),

  // Send
  btnSend:           $('btn-send'),
  btnSendText:       $('btn-send-text'),
  btnSendSpinner:    $('btn-send-spinner'),

  // Output
  errorBanner:       $('error-banner'),
  errorBannerText:   $('error-banner-text'),
  btnDismissError:   $('btn-dismiss-error'),
  emptyState:        $('empty-state'),
  responsePanel:     $('response-panel'),
  responseModelLabel:$('response-model-label'),
  responseContent:   $('response-content'),
  btnCopyResponse:   $('btn-copy-response'),
  metricsBar:        $('metrics-bar'),
  metricTime:        $('metric-time'),
  metricTokens:      $('metric-tokens'),
  metricChars:       $('metric-chars'),
  validatorPanel:    $('validator-panel'),
  validatorContent:  $('validator-content'),
  validatorFooter:   $('validator-footer'),
  validatorSummary:  $('validator-summary'),
  btnCopyReport:     $('btn-copy-report'),
  singleResponseArea:$('single-response-area'),

  // Compare
  compareArea:       $('compare-area'),
  btnCompareToggle:  $('btn-compare-toggle'),
  compareResponseA:  $('compare-response-a'),
  compareResponseB:  $('compare-response-b'),
  compareEmptyA:     $('compare-empty-a'),
  compareEmptyB:     $('compare-empty-b'),
  compareMetricsA:   $('compare-metrics-a'),
  compareMetricsB:   $('compare-metrics-b'),
  compareTimeA:      $('compare-time-a'),
  compareTokensA:    $('compare-tokens-a'),
  compareCharsA:     $('compare-chars-a'),
  compareTimeB:      $('compare-time-b'),
  compareTokensB:    $('compare-tokens-b'),
  compareCharsB:     $('compare-chars-b'),
  compareLabelA:     $('compare-label-a'),
  compareLabelB:     $('compare-label-b'),
  btnCopyA:          $('btn-copy-a'),
  btnCopyB:          $('btn-copy-b'),

  // Library
  btnLibraryToggle:  $('btn-library-toggle'),
  btnLibraryClose:   $('btn-library-close'),
  libraryDrawer:     $('library-drawer'),
  libraryBackdrop:   $('library-backdrop'),
  libraryEmpty:      $('library-empty'),
  libraryList:       $('library-list'),
};

/* ============================================================
   INIT
   ============================================================ */
function init() {
  // Read preset keys from HTML data attributes (keys never live in script.js)
  const presetEl = document.getElementById('key-presets');
  if (presetEl) {
    CLASS_KEYS.openai    = presetEl.dataset.openai    || '';
    CLASS_KEYS.anthropic = presetEl.dataset.anthropic || '';
  }

  attachProviderListeners();
  attachKeyListeners();
  attachModeListeners();
  attachPromptListeners();
  attachSchemaListeners();
  attachSendListener();
  attachCompareListeners();
  attachLibraryListeners();
  attachCopyListeners();
  updateSendButton();
}

/* ============================================================
   PROVIDER LISTENERS
   ============================================================ */
function attachProviderListeners() {
  dom.btnOpenAI.addEventListener('click', () => setProvider('openai'));
  dom.btnAnthropic.addEventListener('click', () => setProvider('anthropic'));
  dom.compareModelA.addEventListener('change', () => {
    state.compareModelA = dom.compareModelA.value;
  });
  dom.compareModelB.addEventListener('change', () => {
    state.compareModelB = dom.compareModelB.value;
  });
  dom.modelSelect.addEventListener('change', () => {
    state.model = dom.modelSelect.value;
  });
}

function setProvider(provider) {
  state.provider = provider;

  dom.btnOpenAI.classList.toggle('active', provider === 'openai');
  dom.btnAnthropic.classList.toggle('active', provider === 'anthropic');

  // Populate model dropdown for the chosen provider
  const openaiGroup     = document.getElementById('openai-models');
  const anthropicGroup  = document.getElementById('anthropic-models');
  if (provider === 'openai') {
    openaiGroup.removeAttribute('disabled');
    anthropicGroup.setAttribute('disabled', '');
    dom.modelSelect.value = 'gpt-4o';
    state.model = 'gpt-4o';
    dom.anthropicInfo.classList.add('hidden');
  } else {
    openaiGroup.setAttribute('disabled', '');
    anthropicGroup.removeAttribute('disabled');
    dom.modelSelect.value = 'claude-sonnet-4-6';
    state.model = 'claude-sonnet-4-6';
    dom.anthropicInfo.classList.remove('hidden');
  }
  updateSendButton();
}

/* ============================================================
   API KEY LISTENERS
   ============================================================ */
function attachKeyListeners() {
  // Show/hide toggle
  dom.btnShowKeyA.addEventListener('click', () => toggleKeyVisibility('a'));
  dom.btnShowKeyB.addEventListener('click', () => toggleKeyVisibility('b'));

  // Input entry
  dom.apiKeyA.addEventListener('input', () => handleKeyInput('a'));
  dom.apiKeyB.addEventListener('input', () => handleKeyInput('b'));

  // Clear
  dom.btnClearKeyA.addEventListener('click', () => clearKey('a'));
  dom.btnClearKeyB.addEventListener('click', () => clearKey('b'));

  // File upload
  dom.keyFileA.addEventListener('change', e => handleKeyFile(e, 'a'));
  dom.keyFileB.addEventListener('change', e => handleKeyFile(e, 'b'));

  // Autocomplete dropdowns
  attachKeyDropdown(dom.apiKeyA, dom.keySuggestionsA, 'a');
  attachKeyDropdown(dom.apiKeyB, dom.keySuggestionsB, 'b');

  // Key tab switching (compare mode)
  document.querySelectorAll('[data-key-tab]').forEach(btn => {
    btn.addEventListener('click', () => switchKeyTab(btn.dataset.keyTab));
  });
}

function toggleKeyVisibility(slot) {
  const input = slot === 'a' ? dom.apiKeyA : dom.apiKeyB;
  input.type = input.type === 'password' ? 'text' : 'password';
}

function handleKeyInput(slot) {
  const input = slot === 'a' ? dom.apiKeyA : dom.apiKeyB;
  const val = input.value.trim();
  if (slot === 'a') {
    state.apiKeyA = val;
  } else {
    state.apiKeyB = val;
  }
  if (val) {
    maskKey(slot, val);
  }
  updateSendButton();
  clearFieldError(slot === 'a' ? dom.keyErrorA : dom.keyErrorB);
}

function maskKey(slot, rawKey) {
  const last6 = rawKey.slice(-6);
  const masked = '••••••••••' + last6;
  const maskedTextEl   = slot === 'a' ? dom.keyMaskedTextA : dom.keyMaskedTextB;
  const maskedBlockEl  = slot === 'a' ? dom.keyMaskedA : dom.keyMaskedB;
  const inputEl        = slot === 'a' ? dom.apiKeyA : dom.apiKeyB;

  maskedTextEl.textContent = masked;
  maskedBlockEl.classList.remove('hidden');
  inputEl.classList.add('hidden');
}

function clearKey(slot) {
  if (slot === 'a') {
    state.apiKeyA = '';
    dom.apiKeyA.value = '';
    dom.apiKeyA.classList.remove('hidden');
    dom.keyMaskedA.classList.add('hidden');
  } else {
    state.apiKeyB = '';
    dom.apiKeyB.value = '';
    dom.apiKeyB.classList.remove('hidden');
    dom.keyMaskedB.classList.add('hidden');
  }
  updateSendButton();
}

function handleKeyFile(event, slot) {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = e => {
    const text = e.target.result;
    const key = parseKeyFromFile(text, file.name);
    if (key) {
      if (slot === 'a') {
        state.apiKeyA = key;
        dom.apiKeyA.value = key;
      } else {
        state.apiKeyB = key;
        dom.apiKeyB.value = key;
      }
      maskKey(slot, key);
      updateSendButton();
    } else {
      showError('Could not find an API key in that file. Expected OPENAI_API_KEY=sk-... format or sk- in the first CSV column.', 'error');
    }
  };
  reader.readAsText(file);
  // Reset file input so the same file can be re-uploaded
  event.target.value = '';
}

/* ============================================================
   KEY AUTOCOMPLETE DROPDOWN
   ============================================================ */
function attachKeyDropdown(inputEl, listEl, slot) {
  const presets = [
    { label: 'OpenAI Class Key',    provider: 'openai' },
    { label: 'Anthropic Class Key', provider: 'anthropic' },
  ];

  // Build list items once
  presets.forEach(({ label, provider }) => {
    const key = CLASS_KEYS[provider] || '';
    const preview = key ? key.slice(0, 10) + '...' : '(not set)';

    const li = document.createElement('li');
    li.setAttribute('role', 'option');

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'key-suggestion-item';
    btn.innerHTML =
      `<span class="key-suggestion-icon" aria-hidden="true">🔑</span>` +
      `<span class="key-suggestion-label">${escapeHtml(label)}</span>` +
      `<span class="key-suggestion-preview">${escapeHtml(preview)}</span>`;

    btn.addEventListener('mousedown', e => {
      // mousedown fires before blur — prevent input from losing focus/hiding before click
      e.preventDefault();
      applyPresetKey(slot, key);
      hideDropdown(inputEl, listEl);
    });

    li.appendChild(btn);
    listEl.appendChild(li);
  });

  // Show on focus
  inputEl.addEventListener('focus', () => {
    if (CLASS_KEYS.openai || CLASS_KEYS.anthropic) {
      showDropdown(inputEl, listEl);
    }
  });

  // Hide on blur (blur fires after mousedown's e.preventDefault, so dropdown click still works)
  inputEl.addEventListener('blur', () => {
    hideDropdown(inputEl, listEl);
  });

  // Hide when user starts typing
  inputEl.addEventListener('input', () => {
    hideDropdown(inputEl, listEl);
  });
}

function showDropdown(inputEl, listEl) {
  listEl.classList.remove('hidden');
  inputEl.setAttribute('aria-expanded', 'true');
}

function hideDropdown(inputEl, listEl) {
  listEl.classList.add('hidden');
  inputEl.setAttribute('aria-expanded', 'false');
}

function applyPresetKey(slot, key) {
  if (!key) return;
  if (slot === 'a') {
    state.apiKeyA = key;
    dom.apiKeyA.value = key;
    clearFieldError(dom.keyErrorA);
  } else {
    state.apiKeyB = key;
    dom.apiKeyB.value = key;
    clearFieldError(dom.keyErrorB);
  }
  maskKey(slot, key);
  updateSendButton();
}

function parseKeyFromFile(text, filename) {
  // .env format: OPENAI_API_KEY=sk-...
  const envMatch = text.match(/OPENAI_API_KEY\s*=\s*["']?(sk-[A-Za-z0-9\-_]+)["']?/i);
  if (envMatch) return envMatch[1].trim();

  // CSV: first column of first data row starting with sk-
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

function switchKeyTab(tab) {
  document.querySelectorAll('[data-key-tab]').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.keyTab === tab);
    btn.setAttribute('aria-selected', btn.dataset.keyTab === tab ? 'true' : 'false');
  });
  dom.keySectionA.classList.toggle('hidden', tab !== 'a');
  dom.keySectionB.classList.toggle('hidden', tab !== 'b');
}

/* ============================================================
   OUTPUT MODE LISTENERS
   ============================================================ */
function attachModeListeners() {
  dom.btnModeUnstructured.addEventListener('click', () => setMode('unstructured'));
  dom.btnModeStructured.addEventListener('click', () => setMode('structured'));
}

function setMode(mode) {
  state.mode = mode;
  dom.btnModeUnstructured.classList.toggle('active', mode === 'unstructured');
  dom.btnModeStructured.classList.toggle('active', mode === 'structured');
  dom.cardSchema.classList.toggle('hidden', mode !== 'structured');

  // Update example prompt optgroups visibility hint
  document.getElementById('example-group-unstructured').label =
    mode === 'structured' ? 'Unstructured (switch mode to use)' : 'Unstructured';
  document.getElementById('example-group-structured').label =
    mode === 'unstructured' ? 'Structured (switch mode to use)' : 'Structured';

  // Clear validator when switching modes
  dom.validatorPanel.classList.add('hidden');
}

/* ============================================================
   PROMPT LISTENERS
   ============================================================ */
function attachPromptListeners() {
  dom.examplePrompts.addEventListener('change', () => {
    const key = dom.examplePrompts.value;
    if (!key) return;
    const example = EXAMPLE_PROMPTS[key];
    if (!example) return;

    dom.userPrompt.value = example.prompt;
    clearFieldError(dom.promptError);

    // Switch to the example's mode
    if (example.mode) setMode(example.mode);

    // Load schema template if structured
    if (example.mode === 'structured' && example.schema) {
      loadSchemaTemplate(example.schema);
      dom.schemaTemplate.value = example.schema;
    }

    dom.examplePrompts.value = '';
  });

  dom.userPrompt.addEventListener('input', () => {
    clearFieldError(dom.promptError);
  });
}

/* ============================================================
   SCHEMA LISTENERS
   ============================================================ */
function attachSchemaListeners() {
  dom.schemaTemplate.addEventListener('change', () => {
    loadSchemaTemplate(dom.schemaTemplate.value);
  });
}

function loadSchemaTemplate(key) {
  if (!key || key === 'custom') {
    dom.schemaTextarea.value = '';
    return;
  }
  const template = SCHEMA_TEMPLATES[key];
  if (template) {
    dom.schemaTextarea.value = JSON.stringify(template, null, 2);
  }
}

/* ============================================================
   COMPARE MODE LISTENERS
   ============================================================ */
function attachCompareListeners() {
  dom.btnCompareToggle.addEventListener('click', toggleCompareMode);
}

function toggleCompareMode() {
  state.compareMode = !state.compareMode;
  const active = state.compareMode;

  dom.btnCompareToggle.setAttribute('aria-pressed', String(active));
  dom.btnCompareToggle.classList.toggle('btn-outline', !active);

  // Show/hide provider UI sections
  dom.singleModeProvider.classList.toggle('hidden', active);
  dom.compareModeProvider.classList.toggle('hidden', !active);

  // Show/hide key tab UI
  dom.compareKeyToggle.classList.toggle('hidden', !active);
  if (!active) {
    // Back to single mode: show key A, hide key B
    dom.keySectionA.classList.remove('hidden');
    dom.keySectionB.classList.add('hidden');
  } else {
    switchKeyTab('a');
  }

  // Show/hide output areas
  dom.singleResponseArea.classList.toggle('hidden', active);
  dom.compareArea.classList.toggle('hidden', !active);

  if (active) {
    // Reset compare panels to empty state
    showCompareEmptyStates();
    dom.btnCompareToggle.style.background = 'var(--accent-soft)';
    dom.btnCompareToggle.style.borderColor = 'var(--accent)';
    dom.btnCompareToggle.style.color = 'var(--accent)';
  } else {
    dom.btnCompareToggle.style.background = '';
    dom.btnCompareToggle.style.borderColor = '';
    dom.btnCompareToggle.style.color = '';
  }

  updateSendButton();
}

function showCompareEmptyStates() {
  dom.compareEmptyA.classList.remove('hidden');
  dom.compareEmptyB.classList.remove('hidden');
  dom.compareResponseA.classList.add('hidden');
  dom.compareResponseB.classList.add('hidden');
  dom.compareMetricsA.classList.add('hidden');
  dom.compareMetricsB.classList.add('hidden');
}

/* ============================================================
   SEND BUTTON — validation & enable/disable
   ============================================================ */
function updateSendButton() {
  const anthropicSelected = state.provider === 'anthropic' && !state.compareMode;
  const noKeyA = !state.apiKeyA;
  const noKeyB = state.compareMode && !state.apiKeyB;

  dom.btnSend.disabled = anthropicSelected || noKeyA || noKeyB;
}

/* ============================================================
   SEND LISTENER
   ============================================================ */
function attachSendListener() {
  dom.btnSend.addEventListener('click', handleSend);
}

async function handleSend() {
  clearError();

  const prompt = dom.userPrompt.value.trim();
  if (!prompt) {
    showFieldError(dom.promptError, 'Add a prompt to get started.');
    return;
  }

  if (!state.apiKeyA) {
    showFieldError(dom.keyErrorA, 'API key is required to send prompts.');
    return;
  }

  if (state.compareMode && !state.apiKeyB) {
    showFieldError(dom.keyErrorB, 'API key B is required for comparison mode.');
    return;
  }

  setLoading(true);
  hideValidatorPanel();

  try {
    if (state.compareMode) {
      await sendComparison(prompt);
    } else {
      await sendSingle(prompt);
    }
  } catch (err) {
    handleApiError(err);
  } finally {
    setLoading(false);
  }
}

/* ============================================================
   SINGLE API CALL
   ============================================================ */
async function sendSingle(prompt) {
  dom.emptyState.classList.add('hidden');

  // Show loading overlay
  dom.responsePanel.classList.add('hidden');
  dom.metricsBar.classList.add('hidden');
  showLoadingInPanel(dom.singleResponseArea);

  const start = performance.now();

  const body = buildRequestBody(
    state.mode === 'structured' ? 'structured' : 'unstructured',
    prompt,
    state.model
  );

  const data = await callOpenAI(body, state.apiKeyA);
  const elapsed = Math.round(performance.now() - start);

  removeLoadingOverlay(dom.singleResponseArea);

  const text = data.choices[0].message.content.trim();
  const tokens = data.usage?.total_tokens ?? '—';

  displayResponse(text, state.model, elapsed, tokens);

  if (state.mode === 'structured') {
    validateStructuredResponse(text);
  }
}

/* ============================================================
   COMPARISON API CALLS (Promise.all)
   ============================================================ */
async function sendComparison(prompt) {
  // Update labels
  dom.compareLabelA.textContent = dom.compareModelA.value;
  dom.compareLabelB.textContent = dom.compareModelB.value;

  // Reset panels
  showCompareEmptyStates();
  showLoadingInPanel(document.getElementById('compare-panel-a'));
  showLoadingInPanel(document.getElementById('compare-panel-b'));

  const bodyA = buildRequestBody('unstructured', prompt, dom.compareModelA.value);
  const bodyB = buildRequestBody('unstructured', prompt, dom.compareModelB.value);

  const startA = performance.now();
  const startB = performance.now();

  const [resultA, resultB] = await Promise.allSettled([
    callOpenAI(bodyA, state.apiKeyA),
    callOpenAI(bodyB, state.apiKeyB),
  ]);

  const elapsedA = Math.round(performance.now() - startA);
  const elapsedB = Math.round(performance.now() - startB);

  removeLoadingOverlay(document.getElementById('compare-panel-a'));
  removeLoadingOverlay(document.getElementById('compare-panel-b'));

  if (resultA.status === 'fulfilled') {
    const text = resultA.value.choices[0].message.content.trim();
    const tokens = resultA.value.usage?.total_tokens ?? '—';
    displayCompareResponse('a', text, elapsedA, tokens);
  } else {
    displayCompareError('a', resultA.reason);
  }

  if (resultB.status === 'fulfilled') {
    const text = resultB.value.choices[0].message.content.trim();
    const tokens = resultB.value.usage?.total_tokens ?? '—';
    displayCompareResponse('b', text, elapsedB, tokens);
  } else {
    displayCompareError('b', resultB.reason);
  }
}

/* ============================================================
   BUILD REQUEST BODY
   ============================================================ */
function buildRequestBody(mode, userPrompt, model) {
  if (mode === 'structured') {
    const schemaText = dom.schemaTextarea.value.trim();
    return {
      model,
      messages: [
        {
          role: 'system',
          content: 'You are a helpful assistant. Respond ONLY with valid JSON matching the provided schema. No markdown, no backticks, just raw JSON.',
        },
        {
          role: 'user',
          content: `${userPrompt}\n\nRespond using this JSON schema:\n${schemaText}`,
        },
      ],
      response_format: { type: 'json_object' },
      max_tokens: 1000,
    };
  } else {
    const sysPrompt = dom.systemPrompt.value.trim() || 'You are a helpful medical education assistant.';
    return {
      model,
      messages: [
        { role: 'system', content: sysPrompt },
        { role: 'user',   content: userPrompt },
      ],
      max_tokens: 1000,
    };
  }
}

/* ============================================================
   OPENAI FETCH
   ============================================================ */
async function callOpenAI(body, apiKey) {
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify(body),
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
   DISPLAY SINGLE RESPONSE
   ============================================================ */
function displayResponse(text, model, elapsedMs, tokens) {
  dom.responseModelLabel.textContent = model;

  if (state.mode === 'structured') {
    dom.responseContent.innerHTML = buildJsonBlock(text);
  } else {
    dom.responseContent.innerHTML = formatUnstructuredResponse(text);
  }

  dom.responsePanel.classList.remove('hidden');
  dom.emptyState.classList.add('hidden');

  // Metrics
  dom.metricTime.textContent   = `⏱ ${elapsedMs} ms`;
  dom.metricTokens.textContent = `🔢 ${tokens} tokens`;
  dom.metricChars.textContent  = `📝 ${text.length} chars`;
  dom.metricsBar.classList.remove('hidden');
}

/* ============================================================
   DISPLAY COMPARE RESPONSE
   ============================================================ */
function displayCompareResponse(slot, text, elapsedMs, tokens) {
  const responseEl = slot === 'a' ? dom.compareResponseA : dom.compareResponseB;
  const emptyEl    = slot === 'a' ? dom.compareEmptyA : dom.compareEmptyB;
  const metricsEl  = slot === 'a' ? dom.compareMetricsA : dom.compareMetricsB;
  const timeEl     = slot === 'a' ? dom.compareTimeA : dom.compareTimeB;
  const tokensEl   = slot === 'a' ? dom.compareTokensA : dom.compareTokensB;
  const charsEl    = slot === 'a' ? dom.compareCharsA : dom.compareCharsB;

  responseEl.innerHTML = formatUnstructuredResponse(text);
  emptyEl.classList.add('hidden');
  responseEl.classList.remove('hidden');

  timeEl.textContent   = `⏱ ${elapsedMs} ms`;
  tokensEl.textContent = `🔢 ${tokens} tokens`;
  charsEl.textContent  = `📝 ${text.length} chars`;
  metricsEl.classList.remove('hidden');
}

function displayCompareError(slot, error) {
  const responseEl = slot === 'a' ? dom.compareResponseA : dom.compareResponseB;
  const emptyEl    = slot === 'a' ? dom.compareEmptyA : dom.compareEmptyB;

  responseEl.innerHTML = `<span style="color:var(--error);font-size:0.875rem;">${escapeHtml(getErrorMessage(error))}</span>`;
  emptyEl.classList.add('hidden');
  responseEl.classList.remove('hidden');
}

/* ============================================================
   FORMAT RESPONSE TEXT
   ============================================================ */
function formatUnstructuredResponse(text) {
  // Split on first sentence to style it with Fraunces
  const firstPeriod = text.search(/[.!?]/);
  let lead = '';
  let rest = '';

  if (firstPeriod > 0 && firstPeriod < 200) {
    lead = text.slice(0, firstPeriod + 1);
    rest = text.slice(firstPeriod + 1).trim();
  } else {
    rest = text;
  }

  let html = '';
  if (lead) {
    html += `<span class="response-lead">${escapeHtml(lead)}</span>`;
  }
  if (rest) {
    // Preserve line breaks
    html += escapeHtml(rest).replace(/\n\n+/g, '</p><p>').replace(/\n/g, '<br>');
    if (rest.includes('\n\n')) {
      html = html.replace(/^/, '<p>') + '</p>';
    }
  }
  return html;
}

function buildJsonBlock(jsonText) {
  return `<div class="code-block">${syntaxHighlightJSON(jsonText)}</div>`;
}

/* ============================================================
   JSON SYNTAX HIGHLIGHTING (CSS classes, no libraries)
   ============================================================ */
function syntaxHighlightJSON(jsonStr) {
  // Pretty-print if possible
  let pretty = jsonStr;
  try {
    pretty = JSON.stringify(JSON.parse(jsonStr), null, 2);
  } catch (_) { /* use raw */ }

  return escapeHtml(pretty).replace(
    /("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g,
    match => {
      if (/^"/.test(match)) {
        if (/:$/.test(match)) {
          return `<span class="json-key">${match}</span>`;
        }
        return `<span class="json-string">${match}</span>`;
      }
      if (/true|false/.test(match)) return `<span class="json-bool">${match}</span>`;
      if (/null/.test(match))       return `<span class="json-null">${match}</span>`;
      return `<span class="json-number">${match}</span>`;
    }
  );
}

/* ============================================================
   STRUCTURED OUTPUT VALIDATOR
   ============================================================ */
function validateStructuredResponse(jsonText) {
  const schemaText = dom.schemaTextarea.value.trim();
  dom.validatorPanel.classList.remove('hidden');

  let parsed;
  try {
    parsed = JSON.parse(jsonText);
  } catch (_) {
    dom.validatorContent.innerHTML = `<div class="error-banner type-error" style="border-radius:var(--radius-sm);padding:12px 16px;">
      Model returned invalid JSON — could not validate.
    </div>`;
    dom.validatorFooter.classList.add('hidden');
    return;
  }

  let schema;
  try {
    schema = JSON.parse(schemaText);
  } catch (_) {
    dom.validatorContent.innerHTML = `<p style="color:var(--text-2);font-size:0.875rem;">No valid schema provided — skipping validation.</p>`;
    dom.validatorFooter.classList.add('hidden');
    return;
  }

  const properties = schema.properties || {};
  const required   = new Set(schema.required || []);

  const rows = Object.entries(properties).map(([field, def]) => {
    const expected = def.type || '?';
    const received = parsed.hasOwnProperty(field) ? parsed[field] : undefined;
    const present  = received !== undefined;
    const typeOk   = present && checkType(received, def);
    const statusOk = present && typeOk;

    let receivedDisplay = '—';
    if (present) {
      if (Array.isArray(received)) {
        receivedDisplay = `[${received.slice(0, 3).map(v => JSON.stringify(v)).join(', ')}${received.length > 3 ? ', …' : ''}]`;
      } else {
        receivedDisplay = JSON.stringify(received).slice(0, 60);
      }
    }

    const statusIcon = present
      ? (typeOk ? '✅ Match' : '⚠️ Type mismatch')
      : (required.has(field) ? '❌ Missing' : '— Optional/missing');

    const statusClass = present && typeOk ? 'status-ok' : (present ? '' : 'status-err');

    return { field, expected, receivedDisplay, statusIcon, statusClass, statusOk };
  });

  const matched = rows.filter(r => r.statusOk).length;
  const total   = rows.length;

  const tableHtml = `
    <table class="validator-table" aria-label="Validation results">
      <thead>
        <tr>
          <th>Field</th>
          <th>Expected</th>
          <th>Received</th>
          <th>Status</th>
        </tr>
      </thead>
      <tbody>
        ${rows.map(r => `
          <tr>
            <td><code>${escapeHtml(r.field)}</code></td>
            <td>${escapeHtml(r.expected)}</td>
            <td><code>${escapeHtml(r.receivedDisplay)}</code></td>
            <td class="${r.statusClass}">${r.statusIcon}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;

  dom.validatorContent.innerHTML = tableHtml;
  dom.validatorSummary.textContent = `${matched}/${total} fields matched`;
  dom.validatorFooter.classList.remove('hidden');

  // Store rows for copy report
  dom.validatorPanel.dataset.rows = JSON.stringify(rows);
  dom.validatorPanel.dataset.summary = `${matched}/${total} fields matched`;
}

function checkType(value, def) {
  const t = def.type;
  if (t === 'string')  return typeof value === 'string';
  if (t === 'number')  return typeof value === 'number';
  if (t === 'integer') return Number.isInteger(value);
  if (t === 'boolean') return typeof value === 'boolean';
  if (t === 'array')   return Array.isArray(value);
  if (t === 'object')  return typeof value === 'object' && !Array.isArray(value) && value !== null;
  return true; // unknown type — pass
}

function hideValidatorPanel() {
  dom.validatorPanel.classList.add('hidden');
}

/* ============================================================
   PROMPT LIBRARY
   ============================================================ */
function attachLibraryListeners() {
  dom.btnSavePrompt.addEventListener('click', savePrompt);
  dom.btnLibraryToggle.addEventListener('click', openLibrary);
  dom.btnLibraryClose.addEventListener('click', closeLibrary);
  dom.libraryBackdrop.addEventListener('click', closeLibrary);
}

function savePrompt() {
  const prompt = dom.userPrompt.value.trim();
  if (!prompt) {
    showFieldError(dom.promptError, 'Add a prompt to save it.');
    return;
  }

  const schema = state.mode === 'structured' ? dom.schemaTextarea.value.trim() : '';
  const entry = {
    id: Date.now(),
    prompt,
    mode: state.mode,
    schema,
  };

  // Remove oldest if at max
  if (state.promptLibrary.length >= state.MAX_LIBRARY) {
    state.promptLibrary.shift();
  }

  state.promptLibrary.push(entry);
  renderLibrary();

  // Brief visual feedback
  const original = dom.btnSavePrompt.textContent;
  dom.btnSavePrompt.textContent = 'Saved!';
  dom.btnSavePrompt.disabled = true;
  setTimeout(() => {
    dom.btnSavePrompt.textContent = original;
    dom.btnSavePrompt.disabled = false;
  }, 1500);
}

function openLibrary() {
  state.libraryOpen = true;
  dom.libraryDrawer.classList.add('open');
  dom.libraryDrawer.setAttribute('aria-hidden', 'false');
  dom.libraryBackdrop.classList.remove('hidden');
  renderLibrary();
}

function closeLibrary() {
  state.libraryOpen = false;
  dom.libraryDrawer.classList.remove('open');
  dom.libraryDrawer.setAttribute('aria-hidden', 'true');
  dom.libraryBackdrop.classList.add('hidden');
}

function renderLibrary() {
  const library = state.promptLibrary;
  dom.libraryEmpty.classList.toggle('hidden', library.length > 0);
  dom.libraryList.innerHTML = '';

  if (library.length === 0) return;

  // Render newest first
  [...library].reverse().forEach(entry => {
    const li = document.createElement('li');
    li.className = 'library-item';
    li.setAttribute('role', 'option');
    li.setAttribute('aria-label', `Load prompt: ${entry.prompt.slice(0, 60)}`);

    const preview = entry.prompt.length > 120
      ? entry.prompt.slice(0, 117) + '…'
      : entry.prompt;

    li.innerHTML = `
      <div class="library-item-header">
        <span class="library-item-preview">${escapeHtml(preview)}</span>
        <span class="library-item-mode">${entry.mode}</span>
        <button class="library-item-delete" data-id="${entry.id}" aria-label="Delete saved prompt">×</button>
      </div>
      ${entry.schema ? `<div class="library-item-schema">${escapeHtml(entry.schema.slice(0, 80))}${entry.schema.length > 80 ? '…' : ''}</div>` : ''}
    `;

    li.addEventListener('click', e => {
      if (e.target.classList.contains('library-item-delete')) return;
      loadLibraryEntry(entry);
      closeLibrary();
    });

    li.querySelector('.library-item-delete').addEventListener('click', e => {
      e.stopPropagation();
      deleteLibraryEntry(entry.id);
    });

    dom.libraryList.appendChild(li);
  });
}

function loadLibraryEntry(entry) {
  dom.userPrompt.value = entry.prompt;
  setMode(entry.mode);
  if (entry.mode === 'structured' && entry.schema) {
    dom.schemaTextarea.value = entry.schema;
    dom.schemaTemplate.value = '';
  }
}

function deleteLibraryEntry(id) {
  state.promptLibrary = state.promptLibrary.filter(e => e.id !== id);
  renderLibrary();
}

/* ============================================================
   COPY LISTENERS
   ============================================================ */
function attachCopyListeners() {
  dom.btnCopyResponse.addEventListener('click', () => {
    copyText(dom.responseContent.innerText || dom.responseContent.textContent);
    flashButton(dom.btnCopyResponse, 'Copied!');
  });

  dom.btnCopyReport.addEventListener('click', () => {
    const rows = JSON.parse(dom.validatorPanel.dataset.rows || '[]');
    const summary = dom.validatorPanel.dataset.summary || '';
    const lines = ['Field\tExpected\tReceived\tStatus'];
    rows.forEach(r => {
      lines.push(`${r.field}\t${r.expected}\t${r.receivedDisplay}\t${r.statusIcon}`);
    });
    lines.push('');
    lines.push(summary);
    copyText(lines.join('\n'));
    flashButton(dom.btnCopyReport, 'Copied!');
  });

  dom.btnCopyA.addEventListener('click', () => {
    copyText(dom.compareResponseA.innerText || dom.compareResponseA.textContent);
    flashButton(dom.btnCopyA, 'Copied!');
  });

  dom.btnCopyB.addEventListener('click', () => {
    copyText(dom.compareResponseB.innerText || dom.compareResponseB.textContent);
    flashButton(dom.btnCopyB, 'Copied!');
  });
}

function copyText(text) {
  if (navigator.clipboard) {
    navigator.clipboard.writeText(text).catch(() => fallbackCopy(text));
  } else {
    fallbackCopy(text);
  }
}

function fallbackCopy(text) {
  const ta = document.createElement('textarea');
  ta.value = text;
  ta.style.position = 'fixed';
  ta.style.opacity = '0';
  document.body.appendChild(ta);
  ta.select();
  document.execCommand('copy');
  document.body.removeChild(ta);
}

function flashButton(btn, label) {
  const orig = btn.textContent;
  btn.textContent = label;
  btn.disabled = true;
  setTimeout(() => {
    btn.textContent = orig;
    btn.disabled = false;
  }, 1500);
}

/* ============================================================
   ERROR HANDLING
   ============================================================ */
function handleApiError(err) {
  const status = err.status;
  let msg = '';
  let type = 'error';

  if (status === 401) {
    msg = 'Invalid API key. Check and re-enter.';
  } else if (status === 429) {
    msg = 'Rate limit reached. Wait a moment and try again.';
    type = 'warning';
  } else if (err.name === 'TypeError' || err.message?.includes('fetch')) {
    msg = 'Network error. Check your connection.';
  } else {
    msg = `Error: ${err.message || 'Something went wrong. Please try again.'}`;
  }

  showError(msg, type);
  removeLoadingOverlay(dom.singleResponseArea);
  removeLoadingOverlay(document.getElementById('compare-panel-a'));
  removeLoadingOverlay(document.getElementById('compare-panel-b'));
}

function showError(message, type = 'error') {
  dom.errorBannerText.textContent = message;
  dom.errorBanner.className = `error-banner type-${type}`;
  dom.errorBanner.classList.remove('hidden');
}

function clearError() {
  dom.errorBanner.classList.add('hidden');
  dom.errorBannerText.textContent = '';
}

dom.btnDismissError.addEventListener('click', clearError);

function showFieldError(el, message) {
  el.textContent = message;
  el.classList.remove('hidden');
}

function clearFieldError(el) {
  el.classList.add('hidden');
  el.textContent = '';
}

/* ============================================================
   LOADING STATES
   ============================================================ */
function setLoading(on) {
  dom.btnSend.disabled = on;
  dom.btnSendText.classList.toggle('hidden', on);
  dom.btnSendSpinner.classList.toggle('hidden', !on);
}

function showLoadingInPanel(container) {
  const existing = container.querySelector('.loading-overlay');
  if (existing) return;
  const overlay = document.createElement('div');
  overlay.className = 'loading-overlay';
  overlay.innerHTML = `<span class="spinner"></span> Generating response…`;
  container.appendChild(overlay);
}

function removeLoadingOverlay(container) {
  if (!container) return;
  const overlay = container.querySelector('.loading-overlay');
  if (overlay) overlay.remove();
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

function getErrorMessage(err) {
  if (err && err.message) return err.message;
  return String(err);
}

/* ============================================================
   BOOT
   ============================================================ */
document.addEventListener('DOMContentLoaded', init);
