document.addEventListener('DOMContentLoaded', () => {
  const delay = ms => new Promise(res => setTimeout(res, ms));

  // ── Tabs Logic ──
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const card = btn.closest('.viz-card');
      card.querySelectorAll('.tab-btn').forEach(t => t.classList.remove('active'));
      card.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
      btn.classList.add('active');
      document.getElementById(btn.dataset.target).classList.add('active');
    });
  });

  // ── Flashcards ──
  document.querySelectorAll('.flashcard').forEach(c => c.addEventListener('click', () => c.classList.toggle('flipped')));

  // ── Domain 1: Agent Simulator ──
  const btnRunAgent = document.getElementById('btnRunAgent');
  const agentLogs = document.getElementById('agentLogs');
  const nodes = { supervisor: document.getElementById('nodeSupervisor'), researcher: document.getElementById('nodeResearcher'), coder: document.getElementById('nodeCoder'), reviewer: document.getElementById('nodeReviewer') };
  const statuses = { supervisor: document.getElementById('statusSupervisor'), researcher: document.getElementById('statusResearcher'), coder: document.getElementById('statusCoder'), reviewer: document.getElementById('statusReviewer') };

  function addLog(msg, type = '') { const e = document.createElement('div'); e.className = `log-entry ${type}`; e.textContent = msg; agentLogs.appendChild(e); agentLogs.scrollTop = agentLogs.scrollHeight; }
  function resetAgents() { Object.values(nodes).forEach(n => n.classList.remove('active','done')); Object.values(statuses).forEach(s => s.textContent = 'Idle'); statuses.supervisor.textContent = 'Waiting...'; agentLogs.innerHTML = '<div class="log-entry system-msg">[System] Ready.</div>'; }

  btnRunAgent.addEventListener('click', async () => {
    const prompt = document.getElementById('agentPrompt').value.trim() || 'Process task';
    btnRunAgent.disabled = true; resetAgents();
    nodes.supervisor.classList.add('active'); statuses.supervisor.textContent = 'Decomposing...'; addLog(`[Supervisor] Received: "${prompt}"`); await delay(1000);
    addLog('[Supervisor] Delegating research.', 'active'); nodes.supervisor.classList.remove('active'); nodes.researcher.classList.add('active'); statuses.researcher.textContent = 'Searching...'; await delay(1500); nodes.researcher.classList.replace('active','done'); statuses.researcher.textContent = 'Done';
    addLog('[Supervisor] Delegating coding.', 'active'); nodes.coder.classList.add('active'); statuses.coder.textContent = 'Writing...'; await delay(1500); nodes.coder.classList.replace('active','done'); statuses.coder.textContent = 'Done';
    addLog('[Supervisor] Delegating review.', 'active'); nodes.reviewer.classList.add('active'); statuses.reviewer.textContent = 'Linting...'; await delay(1500); nodes.reviewer.classList.replace('active','done'); statuses.reviewer.textContent = 'Done';
    nodes.supervisor.classList.add('active'); statuses.supervisor.textContent = 'Synthesizing...'; addLog('[Supervisor] Synthesizing.'); await delay(1000);
    nodes.supervisor.classList.replace('active','done'); statuses.supervisor.textContent = 'Complete'; addLog('[System] Task completed.', 'success'); btnRunAgent.disabled = false;
  });

  // ── Domain 2: CLAUDE.md Explorer ──
  const resolvedContext = document.getElementById('resolvedContext');
  const contextData = {
    root: [{source:'/CLAUDE.md',text:'System: You are an expert developer.'},{source:'/CLAUDE.md',text:'Commands: /test runs `npm test`'}],
    backend: [{source:'/CLAUDE.md',text:'System: You are an expert developer.'},{source:'/CLAUDE.md',text:'Commands: /test runs `npm test`'},{source:'/backend/CLAUDE.md',text:'System (Append): Focus on Node.js performance.'},{source:'/backend/CLAUDE.md',text:'Commands (Override): /test runs `jest --coverage`'}],
    frontend: [{source:'/CLAUDE.md',text:'System: You are an expert developer.'},{source:'/CLAUDE.md',text:'Commands: /test runs `npm test`'},{source:'implicit',text:'No local CLAUDE.md found. Inheriting from root.'}]
  };
  function renderContext(path) { resolvedContext.innerHTML = contextData[path].map(i => `<div class="context-item"><div class="context-source">${i.source}</div><div>${i.text}</div></div>`).join(''); }
  document.querySelectorAll('.tree-node').forEach(node => { node.addEventListener('click', e => { e.stopPropagation(); document.querySelectorAll('.tree-node').forEach(n => n.classList.remove('active')); node.classList.add('active'); renderContext(node.dataset.path); }); });
  renderContext('root');

  // ── Domain 3: Schema Validation ──
  const toggleBtns = document.querySelectorAll('.toggle-btn');
  const schemaOut = document.getElementById('schemaOutputJson');
  const validationStatus = document.getElementById('validationStatus');
  let isStrictMode = false;
  toggleBtns.forEach(btn => { btn.addEventListener('click', () => { toggleBtns.forEach(b => b.classList.remove('active')); btn.classList.add('active'); isStrictMode = btn.dataset.mode === 'strict'; schemaOut.innerHTML = '// Output will appear here'; validationStatus.className = 'validation-status'; }); });
  function syntaxHighlight(json) { return json.replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+-]?\d+)?)/g, m => { let c='number'; if(/^"/.test(m)){c=/:$/.test(m)?'key':'string';} return `<span class="${c}">${m}</span>`; }); }
  document.getElementById('btnParseData').addEventListener('click', async () => {
    schemaOut.innerHTML = 'Parsing...'; validationStatus.className = 'validation-status'; await delay(600);
    if (isStrictMode) { schemaOut.innerHTML = syntaxHighlight(JSON.stringify({user_data:{name:"Alice",age:28,status:"active"}},null,2)); validationStatus.textContent = '✓ Schema validated against ToolInput schema.'; validationStatus.className = 'validation-status success'; }
    else { schemaOut.textContent = 'Here is the JSON you requested:\n```json\n{\n  "user": "Alice",\n  "age": 28\n}\n```\nLet me know if you need anything else!'; validationStatus.textContent = '✗ JSON.parse() failed. Output contains conversational text.'; validationStatus.className = 'validation-status error'; }
  });

  // ── Domain 4: MCP Toggle ──
  const injectedTools = document.getElementById('injectedTools');
  const mcpData = { github:[{name:'github_read_repo'},{name:'github_create_pr'}], postgres:[{name:'pg_query'},{name:'pg_schema'}], fs:[{name:'fs_read_file'}] };
  let activeTools = [];
  function renderTools() { injectedTools.innerHTML = activeTools.length === 0 ? '<span class="mcp-empty">No tools connected.</span>' : activeTools.map(t => `<div class="tool-tag">🔧 ${t.name}</div>`).join(''); }
  document.querySelectorAll('.mcp-toggle').forEach(toggle => {
    toggle.addEventListener('change', e => {
      const k = e.target.value, node = document.querySelector(`.mcp-server-node[data-server="${k}"]`), line = document.getElementById(`line-${k}`);
      if (e.target.checked) { node.classList.add('active'); line.classList.add('active'); activeTools = [...activeTools, ...mcpData[k]]; } else { node.classList.remove('active'); line.classList.remove('active'); activeTools = activeTools.filter(t => !mcpData[k].find(mt => mt.name === t.name)); }
      renderTools();
    });
  });

  // ── Domain 5: Token Caching ──
  const MAX_T = 200000, CACHE_MIN = 1024, BP = 3.00, CP = 0.30;
  let ts = {sys:0,docs:0,chat:0};
  const fillSys=document.getElementById('fillSys'),fillDocs=document.getElementById('fillDocs'),fillChat=document.getElementById('fillChat');
  const elUsed=document.getElementById('tokenUsed'),elCached=document.getElementById('tokenCached'),elCost=document.getElementById('metricCost'),elDiscount=document.getElementById('metricDiscount'),elLatency=document.getElementById('metricLatency');
  const btnSys=document.getElementById('btnAddSys'),btnDocs=document.getElementById('btnAddDocs'),btnChat=document.getElementById('btnAddChat');
  function updateMath() {
    const total=ts.sys+ts.docs+ts.chat; let cached=0; const sc=ts.sys+ts.docs; if(sc>=CACHE_MIN) cached=sc;
    const nc=total-cached, cBase=(total/1e6)*BP, cAct=(nc/1e6)*BP+(cached/1e6)*CP, disc=cBase-cAct, lat=0.5+(nc/50000)*1.5+(cached/50000)*0.1;
    fillSys.style.width=`${(ts.sys/MAX_T)*100}%`; fillDocs.style.width=`${(ts.docs/MAX_T)*100}%`; fillChat.style.width=`${(ts.chat/MAX_T)*100}%`;
    elUsed.textContent=total.toLocaleString(); elCached.textContent=cached.toLocaleString();
    elCost.textContent=`$${cAct.toFixed(4)}`; elDiscount.textContent=`-$${disc.toFixed(4)}`; elLatency.textContent=`~${lat.toFixed(2)}s`;
    btnSys.disabled=(total+5000>MAX_T||ts.sys>0); btnDocs.disabled=(total+50000>MAX_T||ts.docs>0); btnChat.disabled=(total+15000>MAX_T);
  }
  btnSys.addEventListener('click',()=>{ts.sys=5000;updateMath();}); btnDocs.addEventListener('click',()=>{ts.docs=50000;updateMath();}); btnChat.addEventListener('click',()=>{ts.chat+=15000;updateMath();});
  document.getElementById('btnClearTokens').addEventListener('click',()=>{ts={sys:0,docs:0,chat:0};updateMath();});

  // ── Cheat Sheet Modal ──
  const fab = document.getElementById('cheatFab'), overlay = document.getElementById('cheatOverlay');
  if (fab && overlay) {
    fab.addEventListener('click', () => overlay.classList.add('open'));
    document.getElementById('cheatClose').addEventListener('click', () => overlay.classList.remove('open'));
    overlay.addEventListener('click', e => { if (e.target === overlay) overlay.classList.remove('open'); });
  }

  // ── Quiz Engine ──
  if (typeof QUIZ_DATA === 'undefined') return;
  let currentQ = 0, score = 0, activeDomain = 0, filteredQs = [...QUIZ_DATA];
  const qProg = document.getElementById('quizProgress'), qScore = document.getElementById('quizScore'), qBody = document.getElementById('quizBody'), qFeedback = document.getElementById('quizFeedback'), fbTitle = document.getElementById('feedbackTitle'), fbText = document.getElementById('feedbackText'), btnNext = document.getElementById('btnNextQuestion');

  // Domain filter buttons
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      activeDomain = parseInt(btn.dataset.domain);
      filteredQs = activeDomain === 0 ? [...QUIZ_DATA] : QUIZ_DATA.filter(q => q.d === activeDomain);
      currentQ = 0; score = 0; renderQuiz();
    });
  });

  function renderQuiz() {
    if (currentQ >= filteredQs.length) {
      const pct = Math.round((score / filteredQs.length) * 100);
      const pass = pct >= 72;
      qBody.innerHTML = `<div class="quiz-summary"><div class="score-label">Final Score</div><div class="score-big ${pass ? 'pass' : 'fail'}">${pct}%</div><div class="score-label">${score} / ${filteredQs.length} correct</div><p style="margin-top:1rem;color:var(--text-muted)">${pass ? '✅ You passed! (≥72% = 720/1000 scaled)' : '❌ Below passing threshold. Review weak domains and retry.'}</p><button class="btn btn-primary mt-2" onclick="location.reload()">Restart Quiz</button></div>`;
      qFeedback.style.display = 'none'; return;
    }
    const data = filteredQs[currentQ];
    qProg.textContent = `Question ${currentQ + 1} of ${filteredQs.length}`; qScore.textContent = `Score: ${score}`; qFeedback.style.display = 'none';
    let html = `<div class="quiz-question">${data.q}</div><div class="quiz-options">`;
    data.opts.forEach((o, i) => { html += `<button class="quiz-option" data-idx="${i}">${o}</button>`; });
    html += '</div>'; qBody.innerHTML = html;
    document.querySelectorAll('.quiz-option').forEach(btn => {
      btn.addEventListener('click', e => {
        document.querySelectorAll('.quiz-option').forEach(b => { b.disabled = true; b.style.cursor = 'default'; });
        const sel = parseInt(e.target.dataset.idx), correct = data.ans;
        if (sel === correct) { e.target.classList.add('correct'); score++; fbTitle.textContent = 'Correct!'; qFeedback.className = 'quiz-feedback success'; }
        else { e.target.classList.add('wrong'); document.querySelector(`.quiz-option[data-idx="${correct}"]`).classList.add('correct'); fbTitle.textContent = 'Incorrect'; qFeedback.className = 'quiz-feedback error'; }
        fbText.textContent = data.exp; qFeedback.style.display = 'block';
      });
    });
  }
  if (btnNext) { btnNext.addEventListener('click', () => { currentQ++; renderQuiz(); }); renderQuiz(); }

  // ── TOC Active Tracking ──
  const tocLinks = document.querySelectorAll('.toc__link');
  const tocObs = new IntersectionObserver(entries => {
    entries.forEach(e => { if (e.isIntersecting) { tocLinks.forEach(l => l.classList.remove('active')); const link = document.querySelector(`.toc__link[href="#${e.target.id}"]`); if (link) link.classList.add('active'); } });
  }, { threshold: 0.2 });
  document.querySelectorAll('.viz-section').forEach(s => tocObs.observe(s));
});
