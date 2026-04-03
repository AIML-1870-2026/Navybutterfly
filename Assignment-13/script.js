// ================================================================
// Drug Safety Explorer — script.js
// Data: OpenFDA public API (no key required)
// ================================================================

// ================================================================
// CONSTANTS
// ================================================================

const DRUG_CLASSES = {
  "SSRIs":           ["fluoxetine", "sertraline", "escitalopram", "paroxetine", "citalopram"],
  "Statins":         ["atorvastatin", "simvastatin", "rosuvastatin", "lovastatin", "pravastatin"],
  "ACE Inhibitors":  ["lisinopril", "enalapril", "ramipril", "captopril", "benazepril"],
  "NSAIDs":          ["ibuprofen", "naproxen", "celecoxib", "diclofenac", "meloxicam"],
  "Beta Blockers":   ["metoprolol", "atenolol", "carvedilol", "propranolol", "bisoprolol"],
  "Benzodiazepines": ["alprazolam", "diazepam", "lorazepam", "clonazepam", "temazepam"]
};

const CLASS_CONTEXT = {
  "SSRIs": {
    mechanism: "SSRIs (Selective Serotonin Reuptake Inhibitors) block serotonin reabsorption in the brain, increasing serotonin availability at synaptic connections.",
    interaction: "Combining SSRIs with MAO inhibitors, triptans, or certain opioids can trigger serotonin syndrome — a potentially life-threatening reaction requiring immediate medical attention.",
    uses: "Major depressive disorder, generalized anxiety disorder, OCD, PTSD, panic disorder, and social anxiety."
  },
  "Statins": {
    mechanism: "Statins inhibit HMG-CoA reductase — the rate-limiting enzyme in cholesterol synthesis — reducing LDL cholesterol and cardiovascular risk.",
    interaction: "Grapefruit juice inhibits the CYP3A4 enzyme that metabolizes many statins, leading to dangerously elevated drug levels and increased risk of myopathy or rhabdomyolysis.",
    uses: "High cholesterol (hyperlipidemia), cardiovascular disease prevention, atherosclerosis management."
  },
  "ACE Inhibitors": {
    mechanism: "ACE inhibitors block angiotensin-converting enzyme, preventing formation of angiotensin II and relaxing blood vessels to lower blood pressure.",
    interaction: "NSAIDs can blunt the blood pressure-lowering effect of ACE inhibitors and increase kidney damage risk when combined. Potassium-sparing diuretics can cause dangerous potassium levels.",
    uses: "Hypertension, heart failure, post-heart attack recovery, diabetic kidney disease."
  },
  "NSAIDs": {
    mechanism: "NSAIDs (Non-Steroidal Anti-Inflammatory Drugs) inhibit COX-1 and COX-2 enzymes, reducing prostaglandin production responsible for pain, fever, and inflammation.",
    interaction: "NSAIDs combined with warfarin significantly increase bleeding risk. NSAIDs also reduce kidney clearance of methotrexate, increasing toxicity — a potentially dangerous combination.",
    uses: "Pain relief, fever reduction, arthritis, sports injuries, menstrual cramps, headaches."
  },
  "Beta Blockers": {
    mechanism: "Beta blockers competitively block epinephrine at beta-adrenergic receptors, slowing heart rate and reducing cardiac output and blood pressure.",
    interaction: "Combining beta blockers with verapamil or diltiazem (calcium channel blockers) can cause severe heart block. Abrupt discontinuation can trigger rebound hypertension or angina.",
    uses: "Hypertension, angina, heart failure, arrhythmias, migraine prevention, performance anxiety."
  },
  "Benzodiazepines": {
    mechanism: "Benzodiazepines enhance the effect of GABA, an inhibitory neurotransmitter, by binding to GABA-A receptors and increasing the frequency of chloride channel opening.",
    interaction: "Combining benzodiazepines with opioids, alcohol, or other CNS depressants dramatically increases risk of respiratory depression and death. FDA has issued black box warnings for this combination.",
    uses: "Anxiety disorders, panic disorder, insomnia, acute seizure treatment, alcohol withdrawal, pre-procedural sedation."
  }
};

const HELP_CONTENT = {
  events: {
    icon: "📊",
    title: "How to Interpret Adverse Event Data",
    body: `<p>The FDA Adverse Event Reporting System (FAERS) is a <strong>voluntary reporting database</strong>. Patients, caregivers, and healthcare professionals can submit a report linking a drug to a side effect.</p>
      <p>This means:</p>
      <ul>
        <li>A report does <strong>not</strong> prove the drug caused the reaction</li>
        <li>Drugs taken by millions naturally accumulate far more reports</li>
        <li>Under-reporting is common — FAERS captures only a fraction of actual events</li>
      </ul>
      <p>Use this data to spot patterns and ask better questions — not to make safety judgments about individual drugs.</p>`
  },
  recalls: {
    icon: "⚠️",
    title: "Understanding Recall Classifications",
    body: `<p>The FDA classifies drug recalls by health risk:</p>
      <div class="modal-badge-row"><span class="badge badge-danger">Class I</span><div><strong>Most Serious:</strong> Reasonable probability the product will cause serious adverse health consequences or death. Examples: dangerous contamination, incorrect potency or dosage.</div></div>
      <div class="modal-badge-row"><span class="badge badge-warning">Class II</span><div><strong>Moderate:</strong> May cause temporary or reversible adverse health consequences, or where serious harm is remote. Examples: labeling errors, minor contamination.</div></div>
      <div class="modal-badge-row"><span class="badge badge-safe">Class III</span><div><strong>Least Serious:</strong> Unlikely to cause adverse health consequences. Examples: minor packaging defects, cosmetic issues not affecting the product itself.</div></div>
      <p>A recall means the product is being removed or corrected — it does not necessarily mean harm has occurred.</p>`
  },
  interactions: {
    icon: "⚡",
    title: "What Drug Labels Actually Tell You",
    body: `<p>FDA drug labels (also called "prescribing information" or "package inserts") are official, legally-reviewed documents written for clinicians.</p>
      <p>Key sections explained:</p>
      <ul>
        <li><strong>Warnings:</strong> FDA-determined safety risks based on clinical trials and post-market surveillance</li>
        <li><strong>Drug Interactions:</strong> Known interactions that may require dose adjustments or monitoring</li>
        <li><strong>Adverse Reactions:</strong> Side effects observed in clinical trials</li>
        <li><strong>Contraindications:</strong> Situations where the drug must NOT be used</li>
      </ul>
      <p>Labels are living documents — they update when new safety information emerges, sometimes years after a drug reaches market.</p>`
  },
  compare_events: {
    icon: "🔬",
    title: "Why Some Drugs Have More Reports Than Others",
    body: `<p>Adverse event report volume is <strong>heavily influenced by usage prevalence</strong>.</p>
      <p>A drug taken by 50 million people will have far more adverse event reports than one taken by 50,000 — even if the rarer drug is more dangerous per dose.</p>
      <p>This is called <strong>reporting bias</strong>. When comparing drugs, consider:</p>
      <ul>
        <li>How widely prescribed is each drug?</li>
        <li>How long has it been on the market?</li>
        <li>Has media attention driven voluntary reporting?</li>
      </ul>
      <p>Raw report counts are a starting point for investigation, not a safety ranking.</p>`
  },
  class_interactions: {
    icon: "💊",
    title: "Drug Pairs with Known Dangerous Interactions",
    body: `<p>Some drug combinations carry well-documented, serious risks:</p>
      <ul>
        <li><strong>Warfarin + NSAIDs</strong> — Dramatically increased bleeding risk. NSAIDs inhibit platelet function while warfarin reduces clotting ability.</li>
        <li><strong>MAO Inhibitors + SSRIs</strong> — Serotonin syndrome risk. Can be fatal. Requires a washout period between these medications.</li>
        <li><strong>Methotrexate + NSAIDs</strong> — NSAIDs reduce kidney clearance of methotrexate, leading to toxicity.</li>
        <li><strong>Grapefruit + Statins / Calcium Channel Blockers</strong> — Grapefruit inhibits CYP3A4 metabolism, causing dangerously elevated drug levels.</li>
        <li><strong>Benzodiazepines + Opioids</strong> — Combined CNS/respiratory depression significantly increases overdose risk. FDA black box warning.</li>
      </ul>
      <p>Always disclose all medications — including OTC and supplements — to your healthcare provider.</p>`
  },
  about: {
    icon: "ℹ️",
    title: "About This Tool",
    body: `<p>Drug Safety Explorer queries the FDA's publicly available <strong>OpenFDA database</strong> in real time. All data comes directly from the FDA — no intermediaries.</p>
      <p><strong>Data sources used:</strong></p>
      <ul>
        <li>Drug Labels — official FDA prescribing information</li>
        <li>Adverse Events — FAERS (FDA Adverse Event Reporting System)</li>
        <li>Enforcement Actions — FDA drug recall database</li>
      </ul>
      <div class="modal-disclaimer"><strong>⚠️ For Educational Purposes Only</strong><br>This tool is not a substitute for professional medical advice. Always consult a licensed healthcare provider before making any medication decisions.</div>
      <p class="modal-fda-note">This product uses publicly available data from the U.S. Food and Drug Administration (FDA). FDA is not responsible for the product and does not endorse or recommend this or any other product.</p>`
  }
};

// ================================================================
// STATE
// ================================================================

const compareState = {
  drugA: '',
  drugB: '',
  dataA: null,
  dataB: null,
  activeTab: 'warnings'
};

let expandCounter = 0;

// ================================================================
// API HELPERS
// ================================================================

async function fetchFDA(endpoint) {
  try {
    const res = await fetch(`https://api.fda.gov${endpoint}`);
    if (res.status === 404) return { notFound: true };
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (data.error) return { notFound: true };
    return data;
  } catch (err) {
    console.error('OpenFDA error:', endpoint, err);
    return null;
  }
}

async function fetchLabel(drug) {
  const enc = encodeURIComponent(`"${drug}"`);
  let data = await fetchFDA(`/drug/label.json?search=openfda.generic_name:${enc}&limit=1`);
  if (!data || data.notFound) {
    data = await fetchFDA(`/drug/label.json?search=openfda.brand_name:${enc}&limit=1`);
  }
  return data;
}

async function fetchEventReactions(drug) {
  const enc = encodeURIComponent(`"${drug}"`);
  return fetchFDA(`/drug/event.json?search=patient.drug.medicinalproduct:${enc}&count=patient.reaction.reactionmeddrapt.exact&limit=10`);
}

async function fetchEventTotal(drug) {
  const enc = encodeURIComponent(`"${drug}"`);
  return fetchFDA(`/drug/event.json?search=patient.drug.medicinalproduct:${enc}&limit=1`);
}

async function fetchRecalls(drug, limit = 10) {
  const enc = encodeURIComponent(`"${drug}"`);
  return fetchFDA(`/drug/enforcement.json?search=product_description:${enc}&limit=${limit}&sort=report_date:desc`);
}

async function fetchRecentRecalls(limit = 25) {
  return fetchFDA(`/drug/enforcement.json?limit=${limit}&sort=report_date:desc`);
}

// ================================================================
// UTILITIES
// ================================================================

function formatDate(dateStr) {
  if (!dateStr || dateStr.length < 8) return dateStr || '—';
  const y = dateStr.slice(0, 4);
  const m = parseInt(dateStr.slice(4, 6)) - 1;
  const d = parseInt(dateStr.slice(6, 8));
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return `${months[m]} ${d}, ${y}`;
}

function classificationBadge(cls) {
  if (!cls) return '<span class="badge badge-unknown">Unknown</span>';
  const c = cls.toUpperCase();
  // Must check in reverse specificity order to avoid "CLASS II" matching "CLASS I"
  if (c.includes('CLASS III')) return '<span class="badge badge-safe">Class III</span>';
  if (c.includes('CLASS II'))  return '<span class="badge badge-warning">Class II</span>';
  if (c.includes('CLASS I'))   return '<span class="badge badge-danger">Class I</span>';
  return `<span class="badge badge-unknown">${cls}</span>`;
}

function worstClass(recalls) {
  if (!recalls || !recalls.length) return null;
  const classes = recalls.map(r => (r.classification || '').toUpperCase());
  if (classes.some(c => c.includes('CLASS I') && !c.includes('CLASS II') && !c.includes('CLASS III'))) return 'Class I';
  if (classes.some(c => c.includes('CLASS II') && !c.includes('CLASS III'))) return 'Class II';
  if (classes.some(c => c.includes('CLASS III'))) return 'Class III';
  return null;
}

function expandableText(text, maxLen = 300) {
  if (!text) return '<p class="text-muted-italic">Not available in this label.</p>';
  const clean = text.replace(/<[^>]+>/g, '').trim();
  if (clean.length <= maxLen) return `<p>${clean}</p>`;
  const id = ++expandCounter;
  const truncated = clean.slice(0, maxLen);
  const rest = clean.slice(maxLen);
  return `<p>${truncated}<span class="hidden" id="more-${id}">${rest}</span>…<button class="read-more-btn" onclick="toggleExpand(${id})" aria-expanded="false">Read more</button></p>`;
}

function toggleExpand(id) {
  const el = document.getElementById(`more-${id}`);
  if (!el) return;
  const btn = el.nextElementSibling;
  const isHidden = el.classList.contains('hidden');
  el.classList.toggle('hidden', !isHidden);
  if (btn) {
    btn.textContent = isHidden ? 'Read less' : 'Read more';
    btn.setAttribute('aria-expanded', String(isHidden));
  }
}

function skeletonLines(n = 4) {
  const widths = [85, 70, 90, 60, 75];
  return Array.from({length: n}, (_, i) =>
    `<div class="skeleton" style="width:${widths[i % widths.length]}%"></div>`
  ).join('');
}

function skeletonCardHTML(title) {
  return `<div class="card"><div class="card-header"><h2 class="card-title">${title}</h2></div><div class="card-body">${skeletonLines(5)}</div></div>`;
}

function errorBanner(msg) {
  return `<div class="warning-banner">⚠️ ${msg}</div>`;
}

function emptyState(icon, msg) {
  return `<div class="empty-state"><div class="empty-icon">${icon}</div><p>${msg}</p></div>`;
}

// ================================================================
// CANVAS BAR CHART
// ================================================================

function drawBarChart(canvas, items, { maxValue = null } = {}) {
  if (!items || !items.length) return;

  const COLORS = ['#2d8c9e','#5ba8b5','#8ec4cc','#b8dde3','#d4ecf0'];
  const BAR_H   = 32;
  const GAP     = 10;
  const PAD     = { top: 16, right: 90, bottom: 16, left: 195 };

  const W = canvas.width || 500;
  const H = items.length * (BAR_H + GAP) - GAP + PAD.top + PAD.bottom;
  canvas.height = H;

  const ctx = canvas.getContext('2d');
  const chartW = W - PAD.left - PAD.right;
  const maxVal = maxValue || Math.max(...items.map(d => d.value), 1);

  let hoveredIdx = -1;
  let animDone = false;

  function drawRoundRect(x, y, w, h, r) {
    if (w <= 0) { ctx.beginPath(); return; }
    r = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  }

  function draw(progress) {
    ctx.clearRect(0, 0, W, H);
    const ease = 1 - Math.pow(1 - Math.min(progress, 1), 3);

    items.forEach((item, i) => {
      const y = PAD.top + i * (BAR_H + GAP);
      const fullW = (item.value / maxVal) * chartW;
      const barW = fullW * ease;

      // Bar fill
      ctx.fillStyle = i === hoveredIdx ? '#1f6b7a' : COLORS[i % COLORS.length];
      drawRoundRect(PAD.left, y, Math.max(barW, 2), BAR_H, 4);
      ctx.fill();

      // Label (left)
      const label = item.label.length > 28 ? item.label.slice(0, 27) + '…' : item.label;
      ctx.fillStyle = '#4a5568';
      ctx.font = '13px "DM Sans", system-ui, sans-serif';
      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';
      ctx.fillText(label, PAD.left - 10, y + BAR_H / 2);

      // Count (right of bar, only after animation)
      if (progress >= 1) {
        ctx.fillStyle = '#1a2332';
        ctx.font = '600 12px "JetBrains Mono", monospace';
        ctx.textAlign = 'left';
        ctx.fillText(item.value.toLocaleString(), PAD.left + fullW + 6, y + BAR_H / 2);
      }
    });

    // Tooltip
    if (hoveredIdx >= 0 && animDone) {
      const item = items[hoveredIdx];
      const y = PAD.top + hoveredIdx * (BAR_H + GAP);
      const barW = (item.value / maxVal) * chartW;

      const tipText = `${item.value.toLocaleString()} reports`;
      ctx.font = '12px "DM Sans", system-ui, sans-serif';
      const tw = ctx.measureText(tipText).width;
      const bw = tw + 18;
      const bh = 26;
      const tx = PAD.left + barW / 2;
      const ty = y - 8;

      ctx.fillStyle = '#1a2332';
      drawRoundRect(tx - bw / 2, ty - bh, bw, bh, 4);
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(tipText, tx, ty - bh / 2);
    }
  }

  // Animate bars growing from 0
  let startTs = null;
  function animate(ts) {
    if (!startTs) startTs = ts;
    const progress = (ts - startTs) / 300;
    draw(progress);
    if (progress < 1) {
      requestAnimationFrame(animate);
    } else {
      animDone = true;
      draw(1);
    }
  }
  requestAnimationFrame(animate);

  // Hover tooltip
  function getHoveredIdx(mx, my) {
    for (let i = 0; i < items.length; i++) {
      const y = PAD.top + i * (BAR_H + GAP);
      const bw = (items[i].value / maxVal) * chartW;
      if (mx >= PAD.left && mx <= PAD.left + bw && my >= y && my <= y + BAR_H) return i;
    }
    return -1;
  }

  canvas.addEventListener('mousemove', (e) => {
    if (!animDone) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const mx = (e.clientX - rect.left) * scaleX;
    const my = (e.clientY - rect.top) * scaleY;
    const idx = getHoveredIdx(mx, my);
    if (idx !== hoveredIdx) { hoveredIdx = idx; draw(1); }
  });

  canvas.addEventListener('mouseleave', () => {
    if (hoveredIdx !== -1) { hoveredIdx = -1; if (animDone) draw(1); }
  });
}

function createChart(container, items, options = {}) {
  if (!items || !items.length) {
    container.innerHTML = emptyState('📭', 'No event data available.');
    return;
  }
  const canvas = document.createElement('canvas');
  canvas.style.maxWidth = '100%';
  canvas.style.display = 'block';
  container.appendChild(canvas);
  canvas.width = container.clientWidth || 500;
  drawBarChart(canvas, items, options);
}

// ================================================================
// MODAL SYSTEM
// ================================================================

function showModal(key) {
  const content = HELP_CONTENT[key];
  if (!content) return;
  document.getElementById('modal-icon').textContent = content.icon;
  document.getElementById('modal-title').textContent = content.title;
  document.getElementById('modal-body').innerHTML = content.body;
  const bd = document.getElementById('modal-backdrop');
  bd.classList.add('visible');
  document.getElementById('modal-close').focus();
}

function closeModal() {
  document.getElementById('modal-backdrop').classList.remove('visible');
}

function initModals() {
  document.getElementById('modal-close').addEventListener('click', closeModal);
  document.getElementById('btn-about').addEventListener('click', () => showModal('about'));
  document.getElementById('modal-backdrop').addEventListener('click', (e) => {
    if (e.target === document.getElementById('modal-backdrop')) closeModal();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeModal();
  });
}

// ================================================================
// NAVIGATION
// ================================================================

const modeInitialized = new Set();

function initNav() {
  document.querySelectorAll('.nav-item').forEach(btn => {
    btn.addEventListener('click', () => showMode(btn.dataset.mode));
  });
}

function showMode(mode) {
  document.querySelectorAll('.nav-item').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.mode === mode);
  });
  document.querySelectorAll('.mode-section').forEach(sec => {
    sec.classList.toggle('active', sec.id === `mode-${mode}`);
  });

  if (!modeInitialized.has(mode)) {
    modeInitialized.add(mode);
    if (mode === 'compare') {
      runCompare('warfarin', 'ibuprofen');
    } else if (mode === 'classes') {
      selectClass('SSRIs');
    } else if (mode === 'timeline') {
      runTimeline('');
    }
  }
}

// ================================================================
// MODE 1: DRUG LOOKUP
// ================================================================

function initLookup() {
  const btn   = document.getElementById('lookup-btn');
  const input = document.getElementById('lookup-input');

  const go = () => {
    const drug = input.value.trim();
    if (drug) runLookup(drug);
  };

  btn.addEventListener('click', go);
  input.addEventListener('keydown', (e) => { if (e.key === 'Enter') go(); });

  // Pre-load warfarin on page load
  runLookup('warfarin');
  modeInitialized.add('lookup');
}

async function runLookup(drug) {
  const container = document.getElementById('lookup-results');
  container.innerHTML =
    skeletonCardHTML('Label Warnings') +
    skeletonCardHTML('Adverse Events') +
    skeletonCardHTML('Recall History');

  const [labelData, eventsData, recallsData] = await Promise.all([
    fetchLabel(drug),
    fetchEventReactions(drug),
    fetchRecalls(drug, 10)
  ]);

  container.innerHTML = '';
  container.appendChild(buildLabelCard(drug, labelData));
  container.appendChild(buildEventsCard(drug, eventsData));
  container.appendChild(buildRecallsCard(drug, recallsData));
}

function buildLabelCard(drug, data) {
  const card = document.createElement('div');
  card.className = 'card';

  const headerHTML = `<div class="card-header"><h2 class="card-title">Label Warnings</h2></div>`;

  if (!data || data.notFound) {
    const msg = data === null
      ? 'Unable to reach OpenFDA. Please try again in a moment.'
      : `No label found for "<strong>${drug}</strong>". Try a generic name (e.g. "ibuprofen" instead of "Advil").`;
    card.innerHTML = `${headerHTML}<div class="card-body">${errorBanner(msg)}</div>`;
    return card;
  }

  const result = data.results && data.results[0];
  if (!result) {
    card.innerHTML = `${headerHTML}<div class="card-body">${errorBanner(`No label results for "${drug}".`)}</div>`;
    return card;
  }

  const ofd     = result.openfda || {};
  const brand   = (ofd.brand_name   || []).join(', ') || drug;
  const generic = (ofd.generic_name || []).join(', ') || drug;

  const getText = (key) => {
    const val = result[key];
    if (!val) return null;
    return Array.isArray(val) ? val[0] : val;
  };

  const fields = [
    { key: 'warnings',           label: 'Warnings' },
    { key: 'drug_interactions',  label: 'Drug Interactions', help: 'interactions' },
    { key: 'adverse_reactions',  label: 'Adverse Reactions', help: 'events' },
    { key: 'contraindications',  label: 'Contraindications' }
  ];

  const fieldsHTML = fields.map(f => {
    const text = getText(f.key);
    const help = f.help
      ? `<button class="help-btn" onclick="showModal('${f.help}')" aria-label="Help: ${f.label}">ⓘ</button>`
      : '';
    return `<div class="label-section">
      <div class="label-section-header">
        <span class="label-section-title">${f.label}</span>${help}
      </div>
      <div class="label-section-body">${expandableText(text)}</div>
    </div>`;
  }).join('');

  card.innerHTML = `${headerHTML}
    <div class="card-body">
      <div class="drug-name-header">
        <span class="drug-brand">${brand}</span>
        <span class="drug-generic">${generic}</span>
      </div>
      ${fieldsHTML}
    </div>`;

  return card;
}

function buildEventsCard(drug, data) {
  const card = document.createElement('div');
  card.className = 'card';

  const headerHTML = `<div class="card-header"><h2 class="card-title">Adverse Events <button class="help-btn" onclick="showModal('events')" aria-label="Help: Adverse Events">ⓘ</button></h2></div>`;

  if (!data || data.notFound) {
    const msg = data === null
      ? 'Unable to reach OpenFDA. Please try again in a moment.'
      : `No adverse event reports found for "${drug}".`;
    card.innerHTML = `${headerHTML}<div class="card-body">${data === null ? errorBanner(msg) : emptyState('📭', msg)}</div>`;
    return card;
  }

  const total = (data.meta && data.meta.results && data.meta.results.total) || 0;
  const items = (data.results || []).map(r => ({
    label: r.term.toLowerCase(),
    value: r.count
  }));

  const chartId = `chart-${Date.now()}-${Math.random().toString(36).slice(2)}`;

  card.innerHTML = `${headerHTML}
    <div class="card-body">
      <div class="stat-number">${total.toLocaleString()}</div>
      <div class="stat-label">voluntary reports in FAERS</div>
      <div class="chart-container" id="${chartId}"></div>
      <p class="chart-note">Based on ${total.toLocaleString()} voluntary reports in FAERS. Report counts do not indicate drug safety or causation.</p>
    </div>`;

  requestAnimationFrame(() => {
    const ctr = document.getElementById(chartId);
    if (ctr) createChart(ctr, items);
  });

  return card;
}

function buildRecallsCard(drug, data) {
  const card = document.createElement('div');
  card.className = 'card';

  const headerHTML = `<div class="card-header"><h2 class="card-title">Recall History <button class="help-btn" onclick="showModal('recalls')" aria-label="Help: Recalls">ⓘ</button></h2></div>`;

  if (!data) {
    card.innerHTML = `${headerHTML}<div class="card-body">${errorBanner('Unable to reach OpenFDA. Please try again in a moment.')}</div>`;
    return card;
  }

  if (data.notFound || !data.results || !data.results.length) {
    card.innerHTML = `${headerHTML}<div class="card-body">${emptyState('✅', `No active recalls found for <em>${drug}</em>. That's actually good news.`)}</div>`;
    return card;
  }

  const recallsHTML = data.results.map(r => `
    <div class="recall-item">
      <div class="recall-top">
        <span class="recall-date">${formatDate(r.report_date)}</span>
        ${classificationBadge(r.classification)}
      </div>
      <div class="recall-firm">${r.recalling_firm || '—'}</div>
      <div class="recall-reason">${r.reason_for_recall ? r.reason_for_recall.slice(0, 120) + (r.reason_for_recall.length > 120 ? '…' : '') : '—'}</div>
    </div>`).join('');

  card.innerHTML = `${headerHTML}<div class="card-body"><div class="recall-list">${recallsHTML}</div></div>`;
  return card;
}

// ================================================================
// MODE 2: COMPARE DRUGS
// ================================================================

function initCompare() {
  const go = () => {
    const drugA = document.getElementById('compare-a').value.trim();
    const drugB = document.getElementById('compare-b').value.trim();
    if (drugA && drugB) runCompare(drugA, drugB);
  };

  document.getElementById('compare-btn').addEventListener('click', go);
  ['compare-a', 'compare-b'].forEach(id => {
    document.getElementById(id).addEventListener('keydown', (e) => { if (e.key === 'Enter') go(); });
  });

  document.querySelectorAll('#mode-compare .tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('#mode-compare .tab').forEach(t => {
        t.classList.remove('active');
        t.setAttribute('aria-selected', 'false');
      });
      tab.classList.add('active');
      tab.setAttribute('aria-selected', 'true');
      compareState.activeTab = tab.dataset.tab;
      renderCompareTab();
    });
  });
}

async function runCompare(drugA, drugB) {
  compareState.drugA = drugA;
  compareState.drugB = drugB;
  compareState.dataA = null;
  compareState.dataB = null;

  document.getElementById('compare-a').value = drugA;
  document.getElementById('compare-b').value = drugB;

  const container = document.getElementById('compare-results');
  container.innerHTML = `<div class="compare-grid"><div>${skeletonCardHTML(drugA)}</div><div>${skeletonCardHTML(drugB)}</div></div>`;

  const [labelA, labelB, eventsA, eventsB, recallsA, recallsB] = await Promise.all([
    fetchLabel(drugA), fetchLabel(drugB),
    fetchEventReactions(drugA), fetchEventReactions(drugB),
    fetchRecalls(drugA, 10), fetchRecalls(drugB, 10)
  ]);

  compareState.dataA = { label: labelA, events: eventsA, recalls: recallsA };
  compareState.dataB = { label: labelB, events: eventsB, recalls: recallsB };

  renderCompareTab();
}

function renderCompareTab() {
  if (!compareState.dataA && !compareState.dataB) return;
  const { tab: _tab, drugA, drugB, dataA, dataB, activeTab } = { ...compareState, tab: compareState.activeTab };
  const container = document.getElementById('compare-results');

  if (activeTab === 'warnings') {
    const cardA = buildLabelCard(drugA, dataA?.label);
    const cardB = buildLabelCard(drugB, dataB?.label);

    const colA = document.createElement('div');
    colA.innerHTML = `<h3 class="compare-col-header">${drugA}</h3>`;
    colA.appendChild(cardA);

    const colB = document.createElement('div');
    colB.innerHTML = `<h3 class="compare-col-header">${drugB}</h3>`;
    colB.appendChild(cardB);

    container.innerHTML = '';
    const grid = document.createElement('div');
    grid.className = 'compare-grid';
    grid.appendChild(colA);
    grid.appendChild(colB);
    container.appendChild(grid);

  } else if (activeTab === 'events') {
    const itemsA = (dataA?.events?.results || []).slice(0, 8).map(r => ({ label: r.term.toLowerCase(), value: r.count }));
    const itemsB = (dataB?.events?.results || []).slice(0, 8).map(r => ({ label: r.term.toLowerCase(), value: r.count }));
    const globalMax = Math.max(...itemsA.map(i => i.value), ...itemsB.map(i => i.value), 1);

    const idA = `cmp-chart-a-${Date.now()}`;
    const idB = `cmp-chart-b-${Date.now() + 1}`;

    container.innerHTML = `
      <div class="compare-grid">
        <div>
          <h3 class="compare-col-header">${drugA}</h3>
          <div class="card">
            <div class="card-header"><h2 class="card-title">Adverse Events <button class="help-btn" onclick="showModal('compare_events')" aria-label="Help: Adverse Events">ⓘ</button></h2></div>
            <div class="card-body"><div class="chart-container" id="${idA}"></div></div>
          </div>
        </div>
        <div>
          <h3 class="compare-col-header">${drugB}</h3>
          <div class="card">
            <div class="card-header"><h2 class="card-title">Adverse Events</h2></div>
            <div class="card-body"><div class="chart-container" id="${idB}"></div></div>
          </div>
        </div>
      </div>`;

    requestAnimationFrame(() => {
      const ctrA = document.getElementById(idA);
      const ctrB = document.getElementById(idB);
      if (ctrA) createChart(ctrA, itemsA, { maxValue: globalMax });
      if (ctrB) createChart(ctrB, itemsB, { maxValue: globalMax });
    });

  } else if (activeTab === 'recalls') {
    const mkList = (recalls, drug) => {
      if (!recalls || !recalls.length) return emptyState('✅', `No active recalls found for <em>${drug}</em>.`);
      return `<div class="recall-list">${recalls.map(r => `
        <div class="recall-item">
          <div class="recall-top">
            <span class="recall-date">${formatDate(r.report_date)}</span>
            ${classificationBadge(r.classification)}
          </div>
          <div class="recall-firm">${r.recalling_firm || '—'}</div>
          <div class="recall-reason">${r.reason_for_recall ? r.reason_for_recall.slice(0, 120) + (r.reason_for_recall.length > 120 ? '…' : '') : '—'}</div>
        </div>`).join('')}</div>`;
    };

    const listA = dataA?.recalls?.results || [];
    const listB = dataB?.recalls?.results || [];

    container.innerHTML = `
      <div class="compare-grid">
        <div>
          <h3 class="compare-col-header">${drugA}</h3>
          <div class="card">
            <div class="card-header"><h2 class="card-title">Recall History <button class="help-btn" onclick="showModal('recalls')" aria-label="Help: Recalls">ⓘ</button></h2></div>
            <div class="card-body">${mkList(listA, drugA)}</div>
          </div>
        </div>
        <div>
          <h3 class="compare-col-header">${drugB}</h3>
          <div class="card">
            <div class="card-header"><h2 class="card-title">Recall History</h2></div>
            <div class="card-body">${mkList(listB, drugB)}</div>
          </div>
        </div>
      </div>`;
  }
}

// ================================================================
// MODE 3: DRUG CLASSES
// ================================================================

function initClasses() {
  const pillsContainer = document.getElementById('class-pills');
  Object.keys(DRUG_CLASSES).forEach(cls => {
    const btn = document.createElement('button');
    btn.className = 'class-pill';
    btn.textContent = cls;
    btn.addEventListener('click', () => selectClass(cls));
    pillsContainer.appendChild(btn);
  });
}

function selectClass(cls) {
  document.querySelectorAll('.class-pill').forEach(p => {
    p.classList.toggle('active', p.textContent === cls);
  });
  runClasses(cls);
}

async function runClasses(className) {
  const drugs = DRUG_CLASSES[className];
  const container = document.getElementById('classes-results');
  container.innerHTML = `<div class="card"><div class="card-body">${skeletonLines(8)}</div></div>`;

  // Fetch totals and recalls for all drugs in parallel
  const [totals, recallsArr] = await Promise.all([
    Promise.all(drugs.map(d => fetchEventTotal(d))),
    Promise.all(drugs.map(d => fetchRecalls(d, 25)))
  ]);

  const drugData = drugs.map((drug, i) => ({
    drug,
    total:   (totals[i]?.meta?.results?.total) || 0,
    recalls: recallsArr[i]?.results || []
  })).sort((a, b) => b.total - a.total);

  container.innerHTML = '';

  // --- Section 1: Adverse Event Comparison Chart ---
  const chartId = `class-chart-${Date.now()}`;
  const chartCard = document.createElement('div');
  chartCard.className = 'card';
  chartCard.innerHTML = `
    <div class="card-header">
      <h2 class="card-title">Adverse Event Reports
        <button class="help-btn" onclick="showModal('compare_events')" aria-label="Help: Adverse Events">ⓘ</button>
      </h2>
    </div>
    <div class="card-body">
      <div class="chart-container" id="${chartId}"></div>
      <p class="chart-note">Total FAERS reports per drug, sorted by volume. Higher counts may reflect wider usage, not higher risk.</p>
    </div>`;
  container.appendChild(chartCard);

  requestAnimationFrame(() => {
    const ctr = document.getElementById(chartId);
    if (ctr) createChart(ctr, drugData.map(d => ({ label: d.drug, value: d.total })));
  });

  // --- Section 2: Recall Summary Table ---
  const recallCard = document.createElement('div');
  recallCard.className = 'card';
  const tableRows = drugData.map(d => {
    const worst = worstClass(d.recalls);
    const recent = d.recalls.length ? formatDate(d.recalls[0].report_date) : '—';
    return `<tr>
      <td class="table-drug">${d.drug}</td>
      <td>${d.recalls.length}</td>
      <td>${recent}</td>
      <td>${worst ? classificationBadge(worst) : '<span class="badge badge-safe">None</span>'}</td>
    </tr>`;
  }).join('');

  recallCard.innerHTML = `
    <div class="card-header"><h2 class="card-title">Recall Summary</h2></div>
    <div class="card-body">
      <table class="data-table">
        <thead>
          <tr>
            <th>Drug</th>
            <th>Total Recalls</th>
            <th>Most Recent</th>
            <th>Worst Class</th>
          </tr>
        </thead>
        <tbody>${tableRows}</tbody>
      </table>
    </div>`;
  container.appendChild(recallCard);

  // --- Section 3: Class Context Card ---
  const ctx = CLASS_CONTEXT[className];
  const contextCard = document.createElement('div');
  contextCard.className = 'card';
  contextCard.innerHTML = `
    <div class="card-header">
      <h2 class="card-title">${className}: Class Context
        <button class="help-btn" onclick="showModal('class_interactions')" aria-label="Help: Known Drug Interactions">ⓘ</button>
      </h2>
    </div>
    <div class="card-body">
      <div class="context-section">
        <div class="context-label">How This Class Works</div>
        <p>${ctx.mechanism}</p>
      </div>
      <div class="context-section">
        <div class="context-label context-label-warning">⚠️ Known Class-Wide Interaction</div>
        <p>${ctx.interaction}</p>
      </div>
      <div class="context-section">
        <div class="context-label">Common Uses</div>
        <p>${ctx.uses}</p>
      </div>
    </div>`;
  container.appendChild(contextCard);
}

// ================================================================
// MODE 4: RECALL TIMELINE
// ================================================================

function initTimeline() {
  const go = () => {
    const q = document.getElementById('timeline-input').value.trim();
    runTimeline(q);
  };
  document.getElementById('timeline-btn').addEventListener('click', go);
  document.getElementById('timeline-input').addEventListener('keydown', (e) => { if (e.key === 'Enter') go(); });
}

async function runTimeline(query) {
  const container = document.getElementById('timeline-results');
  container.innerHTML = `<div class="card"><div class="card-body">${skeletonLines(8)}</div></div>`;

  const data = query ? await fetchRecalls(query, 25) : await fetchRecentRecalls(25);

  if (!data) {
    container.innerHTML = errorBanner('Unable to reach OpenFDA. Please try again in a moment.');
    return;
  }

  if (data.notFound || !data.results || !data.results.length) {
    container.innerHTML = query
      ? emptyState('✅', `No recalls found for "${query}". That's actually good news.`)
      : emptyState('📭', 'No recent recall data available.');
    return;
  }

  const recalls = data.results;

  // Count by class
  const countI   = recalls.filter(r => { const c = (r.classification||'').toUpperCase(); return c.includes('CLASS I') && !c.includes('CLASS II') && !c.includes('CLASS III'); }).length;
  const countII  = recalls.filter(r => { const c = (r.classification||'').toUpperCase(); return c.includes('CLASS II') && !c.includes('CLASS III'); }).length;
  const countIII = recalls.filter(r => (r.classification||'').toUpperCase().includes('CLASS III')).length;

  const summaryHTML = `
    <div class="timeline-summary">
      <div class="timeline-summary-text">
        Showing <strong>${recalls.length}</strong> recalls &nbsp;|&nbsp;
        <span class="badge badge-danger">Class I: ${countI}</span>
        <span class="badge badge-warning">Class II: ${countII}</span>
        <span class="badge badge-safe">Class III: ${countIII}</span>
      </div>
      <button class="help-btn" onclick="showModal('recalls')" aria-label="Help: Recall Classifications">ⓘ Legend</button>
    </div>`;

  const timelineHTML = recalls.map(r => {
    const product = r.product_description
      ? r.product_description.slice(0, 100) + (r.product_description.length > 100 ? '…' : '')
      : '—';
    return `<div class="timeline-item">
      <div class="timeline-dot"></div>
      <div class="timeline-card">
        <div class="timeline-date">${formatDate(r.report_date)}</div>
        <div class="timeline-drug">${product}</div>
        <div class="timeline-firm">${r.recalling_firm || '—'}</div>
        <div class="timeline-badge-row">${classificationBadge(r.classification)}</div>
        <div class="timeline-reason">${r.reason_for_recall || '—'}</div>
      </div>
    </div>`;
  }).join('');

  container.innerHTML = `${summaryHTML}<div class="timeline">${timelineHTML}</div>`;
}

// ================================================================
// INIT
// ================================================================

function init() {
  initNav();
  initModals();
  initLookup();   // also triggers initial warfarin search
  initCompare();
  initClasses();
  initTimeline();
}

document.addEventListener('DOMContentLoaded', init);
