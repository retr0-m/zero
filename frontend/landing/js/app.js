const API_BASE = 'http://localhost:8000/api';

// bind analyze button safely after DOM is ready
document.addEventListener('DOMContentLoaded', function () {
  const btn = document.getElementById('analyze-btn');
  if (btn) btn.addEventListener('click', startQuickRead);
});

// app state
const state = {
  idea: '',
  quickRead: null,       // QuickReadResult
  questions: [],         // Question[]
  step: 'input',         // input | loading-quick | quick | questions | loading-full | result
};

AOS.init({ once: true, easing: 'ease-out-cubic', offset: 60 });

// char counter
document.getElementById('idea-input').addEventListener('input', function () {
  document.getElementById('char-count').textContent = `${this.value.length} / 1000`;
});

document.getElementById('idea-input').addEventListener('keydown', function (e) {
  if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) startQuickRead();
});

// canvas particle network
(function () {
  const canvas = document.getElementById('bg-canvas');
  const ctx = canvas.getContext('2d');
  let W, H, particles = [];
  const mouse = { x: -1000, y: -1000 };
  const N = 80;

  function resize() { W = canvas.width = window.innerWidth; H = canvas.height = window.innerHeight; }
  function init() {
    particles = [];
    for (let i = 0; i < N; i++) {
      particles.push({
        x: Math.random() * W, y: Math.random() * H,
        vx: (Math.random() - 0.5) * 0.3, vy: (Math.random() - 0.5) * 0.3,
        r: Math.random() * 1.5 + 0.5
      });
    }
  }
  window.addEventListener('mousemove', e => { mouse.x = e.clientX; mouse.y = e.clientY; });
  window.addEventListener('resize', () => { resize(); init(); });
  resize(); init();

  function draw() {
    ctx.clearRect(0, 0, W, H);
    for (let i = 0; i < N; i++) {
      const p = particles[i];
      const dx = p.x - mouse.x, dy = p.y - mouse.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 120) { p.vx += (dx / dist) * 0.04; p.vy += (dy / dist) * 0.04; }
      p.vx *= 0.995; p.vy *= 0.995;
      p.x += p.vx; p.y += p.vy;
      if (p.x < 0) p.x = W; if (p.x > W) p.x = 0;
      if (p.y < 0) p.y = H; if (p.y > H) p.y = 0;
      ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255,255,255,0.25)'; ctx.fill();
      for (let j = i + 1; j < N; j++) {
        const q = particles[j];
        const ex = p.x - q.x, ey = p.y - q.y, ed = Math.sqrt(ex * ex + ey * ey);
        if (ed < 130) {
          ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(q.x, q.y);
          ctx.strokeStyle = `rgba(200,255,0,${(1 - ed / 130) * 0.12})`;
          ctx.lineWidth = 0.6; ctx.stroke();
        }
      }
    }
    requestAnimationFrame(draw);
  }
  draw();
})();

// helpers
function fmt(n, currency) {
  return currency + ' ' + new Intl.NumberFormat('de-CH').format(Math.round(n));
}

function showError(msg) {
  const el = document.getElementById('error-box');
  el.textContent = msg;
  el.classList.remove('hidden');
}

function hideError() {
  document.getElementById('error-box').classList.add('hidden');
}

function scrollToOutput() {
  setTimeout(() => {
    document.getElementById('output').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, 80);
}

// viability color
function viabilityColor(score) {
  if (score <= 3) return '#ff4d4d';
  if (score <= 5) return '#ffaa00';
  if (score <= 7) return '#c8ff00';
  return '#4dff91';
}

// step 1 — quick read
async function startQuickRead() {
  const idea = document.getElementById('idea-input').value.trim();
  if (idea.length < 20) { showError('Please describe your idea in a bit more detail.'); return; }

  state.idea = idea;
  hideError();

  // set btn loading
  const btn = document.getElementById('analyze-btn');
  const label = document.getElementById('btn-label');
  const arrow = document.getElementById('btn-arrow');
  const spinner = document.getElementById('btn-spinner');
  btn.disabled = true;
  label.textContent = 'Reading idea';
  arrow.classList.add('hidden');
  spinner.classList.remove('hidden');

  // show skeleton for quick read card
  const output = document.getElementById('output');
  output.classList.remove('hidden');
  output.innerHTML = renderQuickReadSkeleton();
  scrollToOutput();

  try {
    const res = await fetch(`${API_BASE}/quick-read`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idea }),
    });
    if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.detail || `Error ${res.status}`); }
    const data = await res.json();
    state.quickRead = data;
    state.questions = data.questions;
    renderQuickRead(data);
  } catch (err) {
    output.classList.add('hidden');
    showError(err.message || 'Something went wrong. Is the backend running?');
  } finally {
    btn.disabled = false;
    label.textContent = 'Analyze';
    arrow.classList.remove('hidden');
    spinner.classList.add('hidden');
  }
}

function renderQuickReadSkeleton() {
  return `
    <div class="shimmer-border rounded-2xl bg-zinc-900 border border-white/8 p-6 space-y-4">
      <div class="flex items-start justify-between gap-4 flex-wrap">
        <div class="flex-1 space-y-2">
          <div class="skel skel-header"></div>
          <div class="skel skel-line skel-line-full"></div>
          <div class="skel skel-line skel-line-mid"></div>
        </div>
        <div class="flex-shrink-0 space-y-2">
          <div class="skel skel-score"></div>
          <div class="skel skel-bar"></div>
        </div>
      </div>
    </div>`;
}

function renderRejected(data) {
  const output = document.getElementById('output');
  output.innerHTML = `
    <div data-aos="fade-up" class="rounded-2xl border border-red-900/40 bg-red-950/20 p-6">
      <div class="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div class="flex items-center gap-2 mb-3">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <circle cx="7" cy="7" r="6" stroke="#ff4d4d" stroke-width="1.5"/>
              <path d="M7 4v3M7 9.5v.5" stroke="#ff4d4d" stroke-width="1.5" stroke-linecap="round"/>
            </svg>
            <span class="text-xs font-mono text-red-400 uppercase tracking-widest">Not viable</span>
          </div>
          <h3 class="font-serif text-3xl font-normal tracking-tight mb-2 text-zinc-200">${data.title}</h3>
          <p class="text-sm text-red-300/80 max-w-lg leading-relaxed">${data.summary}</p>
        </div>
        <div class="text-right flex-shrink-0">
          <div class="text-xs font-mono text-zinc-500 mb-2 uppercase tracking-widest">Viability</div>
          <div class="font-mono text-4xl font-medium text-red-400">${data.viability_score}/10</div>
          <div class="w-24 h-px bg-white/10 mt-2 rounded-full overflow-hidden">
            <div class="viability-fill" style="width:0%;background:#ff4d4d" id="viability-bar"></div>
          </div>
        </div>
      </div>
      <div class="mt-5 pt-5 border-t border-red-900/30 flex items-center justify-between gap-4 flex-wrap">
        <p class="text-xs text-zinc-500 font-mono">Refine the idea and try again, or start fresh.</p>
        <button onclick="restart()"
          class="px-5 py-2 rounded-full border border-white/10 text-xs text-zinc-300 hover:border-white/30 hover:text-white transition-all">
          Try another idea
        </button>
      </div>
    </div>
  `;
  AOS.refresh();
  setTimeout(() => { document.getElementById('viability-bar').style.width = `${data.viability_score * 10}%`; }, 120);
  scrollToOutput();
}

function renderQuickRead(data) {
  // gate: score <= 2 means not viable, no questions shown
  if (data.viability_score <= 2) {
    renderRejected(data);
    return;
  }

  const color = viabilityColor(data.viability_score);
  const output = document.getElementById('output');
  output.innerHTML = `
    <div data-aos="fade-up" class="shimmer-border rounded-2xl bg-zinc-900 border border-white/8 p-6">
      <div class="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h3 class="font-serif text-3xl font-normal tracking-tight mb-1">${data.title}</h3>
          <p class="text-sm text-zinc-400 max-w-lg leading-relaxed">${data.summary}</p>
        </div>
        <div class="text-right flex-shrink-0">
          <div class="text-xs font-mono text-zinc-500 mb-2 uppercase tracking-widest">Viability</div>
          <div class="font-mono text-4xl font-medium" style="color:${color}">${data.viability_score}/10</div>
          <div class="w-24 h-px bg-white/10 mt-2 rounded-full overflow-hidden">
            <div class="viability-fill" style="width:0%;background:linear-gradient(90deg,${color},#fff)" id="viability-bar"></div>
          </div>
        </div>
      </div>
    </div>
    ${renderQuestionsForm(data.questions)}
  `;
  AOS.refresh();
  setTimeout(() => { document.getElementById('viability-bar').style.width = `${data.viability_score * 10}%`; }, 120);
  scrollToOutput();
}

function renderQuestionsForm(questions) {
  // fixed questions always rendered first
  const fixedHtml = `
    <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
      <div class="bg-zinc-900 rounded-xl border border-white/8 p-4">
        <label class="text-xs font-mono text-zinc-500 uppercase tracking-wider block mb-3">Hours per day available</label>
        <div class="flex flex-wrap gap-2" id="fixed-hours">
          ${['< 1h', '1-2h', '3-4h', 'Full time'].map(o =>
    `<button onclick="selectChoice(this,'fixed-hours')"
              class="choice-btn px-3 py-1.5 rounded-full border border-white/10 text-xs text-zinc-400 hover:border-lime/50 hover:text-lime transition-all">
              ${o}
            </button>`
  ).join('')}
        </div>
      </div>
      <div class="bg-zinc-900 rounded-xl border border-white/8 p-4">
        <label class="text-xs font-mono text-zinc-500 uppercase tracking-wider block mb-3">Available budget</label>
        <div class="flex flex-wrap gap-2" id="fixed-budget">
          ${['< EUR 1k', 'EUR 1-5k', 'EUR 5-20k', 'EUR 20k+'].map(o =>
    `<button onclick="selectChoice(this,'fixed-budget')"
              class="choice-btn px-3 py-1.5 rounded-full border border-white/10 text-xs text-zinc-400 hover:border-lime/50 hover:text-lime transition-all">
              ${o}
            </button>`
  ).join('')}
        </div>
      </div>
    </div>`;

  // dynamic idea-specific questions
  const dynamicHtml = questions.map(q => `
    <div class="bg-zinc-900 rounded-xl border border-white/8 p-4" data-question-id="${q.id}">
      <label class="text-xs font-mono text-zinc-500 uppercase tracking-wider block mb-3">${q.text}</label>
      ${q.type === 'choice'
      ? `<div class="flex flex-wrap gap-2" id="dyn-${q.id}">
            ${(q.choices || []).map(o =>
        `<button onclick="selectChoice(this,'dyn-${q.id}')"
                class="choice-btn px-3 py-1.5 rounded-full border border-white/10 text-xs text-zinc-400 hover:border-lime/50 hover:text-lime transition-all">
                ${o}
              </button>`
      ).join('')}
           </div>`
      : `<input type="text" id="dyn-${q.id}"
             class="w-full bg-zinc-800 border border-white/8 rounded-lg px-3 py-2 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-lime/40 transition-colors"
             placeholder="Your answer..."/>`
    }
    </div>`).join('');

  return `
    <div data-aos="fade-up" data-aos-delay="100" class="space-y-3">
      <div class="text-xs font-mono text-zinc-500 uppercase tracking-widest px-1 pt-2">A few quick questions</div>
      ${fixedHtml}
      ${dynamicHtml}
      <div class="flex justify-end pt-2">
        <button onclick="startFullAnalysis()"
          class="flex items-center gap-2 px-6 py-2.5 rounded-full bg-lime text-black text-xs font-medium hover:bg-lime-dark transition-colors">
          Generate full plan
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
            <path d="M2 5h6M5 2l3 3-3 3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </button>
      </div>
    </div>`;
}

// choice pill selection
function selectChoice(btn, groupId) {
  document.querySelectorAll(`#${groupId} .choice-btn`).forEach(b => {
    b.classList.remove('border-lime', 'text-lime', 'bg-lime/10');
    b.classList.add('border-white/10', 'text-zinc-400');
  });
  btn.classList.add('border-lime', 'text-lime', 'bg-lime/10');
  btn.classList.remove('border-white/10', 'text-zinc-400');
}

// collect all answers before submitting
function collectAnswers() {
  const errors = [];

  // fixed — hours
  const hoursBtn = document.querySelector('#fixed-hours .border-lime');
  if (!hoursBtn) errors.push('hours_per_day');
  const hours = hoursBtn ? hoursBtn.textContent.trim() : null;

  // fixed — budget
  const budgetBtn = document.querySelector('#fixed-budget .border-lime');
  if (!budgetBtn) errors.push('budget');
  const budget = budgetBtn ? budgetBtn.textContent.trim() : null;

  // dynamic
  const answers = {};
  for (const q of state.questions) {
    if (q.type === 'choice') {
      const selected = document.querySelector(`#dyn-${q.id} .border-lime`);
      if (!selected) errors.push(q.id);
      else answers[q.id] = selected.textContent.trim();
    } else {
      const input = document.getElementById(`dyn-${q.id}`);
      const val = input ? input.value.trim() : '';
      if (!val) errors.push(q.id);
      else answers[q.id] = val;
    }
  }

  return { hours, budget, answers, errors };
}

// step 2 — full analysis
async function startFullAnalysis() {
  const { hours, budget, answers, errors } = collectAnswers();
  if (errors.length > 0) {
    showError('Please answer all questions before generating the full plan.');
    return;
  }

  hideError();

  // keep quick read + questions visible, append skeleton below
  const output = document.getElementById('output');
  const fullSkeleton = document.createElement('div');
  fullSkeleton.id = 'full-skeleton';
  fullSkeleton.className = 'space-y-4 mt-4';
  fullSkeleton.innerHTML = renderFullSkeleton();
  output.appendChild(fullSkeleton);
  fullSkeleton.scrollIntoView({ behavior: 'smooth', block: 'start' });

  // disable generate button
  const genBtn = document.querySelector('button[onclick="startFullAnalysis()"]');
  if (genBtn) { genBtn.disabled = true; genBtn.textContent = 'Generating...'; genBtn.classList.add('opacity-50'); }

  try {
    const res = await fetch(`${API_BASE}/full-analysis`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idea: state.idea, hours_per_day: hours, budget, answers }),
    });
    if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.detail || `Error ${res.status}`); }
    const data = await res.json();
    renderFullResult(data);
  } catch (err) {
    document.getElementById('full-skeleton')?.remove();
    showError(err.message || 'Something went wrong. Is the backend running?');
    if (genBtn) { genBtn.disabled = false; genBtn.innerHTML = 'Generate full plan <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M2 5h6M5 2l3 3-3 3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>'; genBtn.classList.remove('opacity-50'); }
  }
}

function renderFullSkeleton() {
  return `
    <div class="grid grid-cols-3 gap-px bg-white/5 rounded-2xl overflow-hidden border border-white/5">
      ${[0, 1, 2].map(() => `
        <div class="bg-zinc-950 p-4">
          <div class="skel skel-line mb-3" style="width:60%;height:10px"></div>
          <div class="skel skel-metric"></div>
          <div class="skel skel-metric-note mt-2"></div>
        </div>`).join('')}
    </div>
    <div class="grid grid-cols-1 sm:grid-cols-2 gap-px bg-white/5 rounded-2xl overflow-hidden border border-white/5">
      <div class="bg-zinc-950 p-5">
        <div class="skel skel-line mb-4" style="width:45%;height:10px"></div>
        ${[85, 70, 90, 75, 80].map(w => `
          <div class="flex gap-3 mb-3">
            <div class="skel" style="width:16px;height:12px;flex-shrink:0;border-radius:3px"></div>
            <div class="skel skel-line" style="width:${w}%"></div>
          </div>`).join('')}
      </div>
      <div class="bg-zinc-950 p-5">
        <div class="skel skel-line mb-4" style="width:35%;height:10px"></div>
        ${[0, 1, 2, 3].map(() => `
          <div class="flex gap-3 items-start pl-6 mb-4 relative">
            <div class="skel skel-roadmap-dot absolute left-0 top-1"></div>
            <div>
              <div class="skel skel-roadmap-when"></div>
              <div class="skel skel-roadmap-text mt-1"></div>
            </div>
          </div>`).join('')}
      </div>
    </div>
    <div class="shimmer-border rounded-2xl bg-zinc-900 border border-white/8 p-5">
      <div class="skel skel-line mb-4" style="width:35%;height:10px"></div>
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
        ${[0, 1, 2, 3].map(() => `
          <div class="bg-zinc-800/50 rounded-xl p-4 border border-white/5">
            <div class="skel skel-contact-title"></div>
            <div class="skel skel-contact-why"></div>
            <div class="skel skel-contact-where"></div>
          </div>`).join('')}
      </div>
    </div>`;
}

function renderFullResult(d) {
  const skeleton = document.getElementById('full-skeleton');
  if (skeleton) skeleton.remove();

  const color = viabilityColor(d.viability_score);
  const output = document.getElementById('output');

  const fullHtml = document.createElement('div');
  fullHtml.className = 'space-y-4 mt-4';
  fullHtml.innerHTML = `
    <!-- metrics -->
    <div data-aos="fade-up" class="grid grid-cols-3 gap-px bg-white/5 rounded-2xl overflow-hidden border border-white/5">
      <div class="bg-zinc-950 p-4">
        <div class="text-xs font-mono text-zinc-500 uppercase tracking-wider mb-2">Investment</div>
        <div class="font-mono text-lg text-white font-medium">
          ${d.investment.currency} ${new Intl.NumberFormat('de-CH').format(d.investment.min)}–${new Intl.NumberFormat('de-CH').format(d.investment.max)}
        </div>
        <div class="text-xs text-zinc-500 mt-1 leading-relaxed">${d.investment.breakdown}</div>
      </div>
      <div class="bg-zinc-950 p-4">
        <div class="text-xs font-mono text-zinc-500 uppercase tracking-wider mb-2">Revenue / 12mo</div>
        <div class="font-mono text-lg font-medium" style="color:${color}">${fmt(d.revenue.month_12, d.revenue.currency)}/mo</div>
        <div class="text-xs text-zinc-500 mt-1">
          6mo: ${fmt(d.revenue.month_6, d.revenue.currency)} &middot; 3mo: ${fmt(d.revenue.month_3, d.revenue.currency)}
        </div>
      </div>
      <div class="bg-zinc-950 p-4">
        <div class="text-xs font-mono text-zinc-500 uppercase tracking-wider mb-2">Break-even</div>
        <div class="font-mono text-lg text-white font-medium">${d.timeline.break_even}</div>
        <div class="text-xs text-zinc-500 mt-1">1st customer: ${d.timeline.first_customer}</div>
      </div>
    </div>

    <!-- plan + roadmap -->
    <div data-aos="fade-up" class="grid grid-cols-1 sm:grid-cols-2 gap-px bg-white/5 rounded-2xl overflow-hidden border border-white/5">
      <div class="bg-zinc-950 p-5">
        <div class="text-xs font-mono text-zinc-500 uppercase tracking-wider mb-4">Business plan</div>
        <ol class="space-y-3">
          ${d.business_plan.map((step, i) => `
            <li class="flex gap-3 items-start">
              <span class="font-mono text-xs text-zinc-600 pt-0.5 flex-shrink-0">0${i + 1}</span>
              <span class="text-xs text-zinc-300 leading-relaxed">${step}</span>
            </li>`).join('')}
        </ol>
      </div>
      <div class="bg-zinc-950 p-5">
        <div class="text-xs font-mono text-zinc-500 uppercase tracking-wider mb-4">Roadmap</div>
        <div class="space-y-1 relative">
          <div class="roadmap-line"></div>
          ${d.roadmap.map(r => `
            <div class="flex gap-3 items-start pl-6 relative">
              <span class="absolute left-0 top-1.5 w-2.5 h-2.5 rounded-full bg-zinc-800 border flex-shrink-0" style="border-color:${color}55"></span>
              <div>
                <span class="font-mono text-xs block mb-0.5" style="color:${color}">${r.when}</span>
                <span class="text-xs text-zinc-400 leading-relaxed">${r.milestone}</span>
              </div>
            </div>`).join('')}
        </div>
      </div>
    </div>

    <!-- contacts -->
    <div data-aos="fade-up" class="shimmer-border rounded-2xl bg-zinc-900 border border-white/8 p-5">
      <div class="text-xs font-mono text-zinc-500 uppercase tracking-wider mb-4">Who you need</div>
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
        ${d.contacts_needed.map(c => `
          <div class="bg-zinc-800/50 rounded-xl p-4 border border-white/5 hover:border-white/10 transition-colors">
            <div class="text-xs font-medium text-zinc-200 mb-1">${c.role}</div>
            <div class="text-xs text-zinc-500 mb-2 leading-relaxed">${c.why}</div>
            <div class="font-mono text-xs" style="color:${color}">${c.where}</div>
          </div>`).join('')}
      </div>
    </div>

    <!-- restart -->
    <div class="flex justify-center pt-4">
      <button onclick="restart()"
        class="text-xs font-mono text-zinc-600 hover:text-zinc-400 transition-colors underline underline-offset-4">
        Analyze another idea
      </button>
    </div>
  `;

  output.appendChild(fullHtml);
  AOS.refresh();
  fullHtml.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function restart() {
  state.idea = '';
  state.quickRead = null;
  state.questions = [];
  document.getElementById('idea-input').value = '';
  document.getElementById('char-count').textContent = '0 / 1000';
  document.getElementById('output').classList.add('hidden');
  document.getElementById('output').innerHTML = '';
  hideError();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}