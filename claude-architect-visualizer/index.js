document.addEventListener('DOMContentLoaded', () => {
  /* --------------------------------------------------------------------------
     Domain 1: Agentic Simulator
     -------------------------------------------------------------------------- */
  const btnRunAgent = document.getElementById('btnRunAgent');
  const agentLogs = document.getElementById('agentLogs');
  
  const nodes = {
    supervisor: document.getElementById('nodeSupervisor'),
    researcher: document.getElementById('nodeResearcher'),
    coder: document.getElementById('nodeCoder'),
    reviewer: document.getElementById('nodeReviewer')
  };

  const statuses = {
    supervisor: document.getElementById('statusSupervisor'),
    researcher: document.getElementById('statusResearcher'),
    coder: document.getElementById('statusCoder'),
    reviewer: document.getElementById('statusReviewer')
  };

  const links = {
    researcher: document.getElementById('linkResearcher'),
    coder: document.getElementById('linkCoder'),
    reviewer: document.getElementById('linkReviewer')
  };

  function addLog(msg, type = '') {
    const entry = document.createElement('div');
    entry.className = `log-entry ${type}`;
    entry.textContent = msg;
    agentLogs.appendChild(entry);
    agentLogs.scrollTop = agentLogs.scrollHeight;
  }

  function resetAgents() {
    Object.values(nodes).forEach(n => { n.classList.remove('active', 'done'); });
    Object.values(statuses).forEach(s => { s.textContent = 'Idle'; });
    statuses.supervisor.textContent = 'Waiting...';
    agentLogs.innerHTML = '<div class="log-entry system-msg">[System] Ready.</div>';
  }

  const delay = ms => new Promise(res => setTimeout(res, ms));

  btnRunAgent.addEventListener('click', async () => {
    const prompt = document.getElementById('agentPrompt').value.trim() || 'Process task';
    btnRunAgent.disabled = true;
    resetAgents();

    // Supervisor parses
    nodes.supervisor.classList.add('active');
    statuses.supervisor.textContent = 'Decomposing task...';
    addLog(`[Supervisor] Received: "${prompt}"`);
    await delay(1000);
    
    // Delegate to Researcher
    addLog(`[Supervisor] Delegating research to Sub-agent.`, 'active');
    nodes.supervisor.classList.remove('active');
    nodes.researcher.classList.add('active');
    statuses.researcher.textContent = 'Searching web...';
    await delay(1500);
    nodes.researcher.classList.replace('active', 'done');
    statuses.researcher.textContent = 'Done';
    
    // Delegate to Coder
    addLog(`[Supervisor] Delegating coding to Sub-agent.`, 'active');
    nodes.coder.classList.add('active');
    statuses.coder.textContent = 'Writing script...';
    await delay(1500);
    nodes.coder.classList.replace('active', 'done');
    statuses.coder.textContent = 'Done';

    // Delegate to Reviewer
    addLog(`[Supervisor] Delegating review to Sub-agent.`, 'active');
    nodes.reviewer.classList.add('active');
    statuses.reviewer.textContent = 'Linting...';
    await delay(1500);
    nodes.reviewer.classList.replace('active', 'done');
    statuses.reviewer.textContent = 'Done';

    // Synthesis
    nodes.supervisor.classList.add('active');
    statuses.supervisor.textContent = 'Synthesizing...';
    addLog(`[Supervisor] Synthesizing final response.`);
    await delay(1000);
    
    nodes.supervisor.classList.replace('active', 'done');
    statuses.supervisor.textContent = 'Complete';
    addLog(`[System] Task completed successfully.`, 'success');
    
    btnRunAgent.disabled = false;
  });

  /* --------------------------------------------------------------------------
     Domain 2: CLAUDE.md Explorer
     -------------------------------------------------------------------------- */
  const treeNodes = document.querySelectorAll('.tree-node');
  const resolvedContext = document.getElementById('resolvedContext');

  const contextData = {
    'root': [
      { source: '/CLAUDE.md', text: 'System: You are an expert developer.' },
      { source: '/CLAUDE.md', text: 'Commands: /test runs `npm test`' }
    ],
    'backend': [
      { source: '/CLAUDE.md', text: 'System: You are an expert developer.' },
      { source: '/CLAUDE.md', text: 'Commands: /test runs `npm test`' },
      { source: '/backend/CLAUDE.md', text: 'System (Append): Focus on Node.js performance.' },
      { source: '/backend/CLAUDE.md', text: 'Commands (Override): /test runs `jest --coverage`' }
    ],
    'frontend': [
      { source: '/CLAUDE.md', text: 'System: You are an expert developer.' },
      { source: '/CLAUDE.md', text: 'Commands: /test runs `npm test`' },
      { source: 'implicit', text: 'No local CLAUDE.md found. Inheriting from root.' }
    ]
  };

  function renderContext(path) {
    const data = contextData[path];
    resolvedContext.innerHTML = data.map(item => `
      <div class="context-item">
        <div class="context-source">${item.source}</div>
        <div>${item.text}</div>
      </div>
    `).join('');
  }

  treeNodes.forEach(node => {
    node.addEventListener('click', (e) => {
      e.stopPropagation(); // prevent bubbling to parent folder
      treeNodes.forEach(n => n.classList.remove('active'));
      node.classList.add('active');
      renderContext(node.dataset.path);
    });
  });
  
  // Init
  renderContext('root');


  /* --------------------------------------------------------------------------
     Domain 3: Schema Validation
     -------------------------------------------------------------------------- */
  const toggleBtns = document.querySelectorAll('.toggle-btn');
  const btnParse = document.getElementById('btnParseData');
  const schemaOut = document.getElementById('schemaOutputJson');
  const validationStatus = document.getElementById('validationStatus');
  let isStrictMode = false;

  toggleBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      toggleBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      isStrictMode = btn.dataset.mode === 'strict';
      
      // Reset output
      schemaOut.innerHTML = '// Output will appear here';
      validationStatus.className = 'validation-status';
    });
  });

  btnParse.addEventListener('click', async () => {
    schemaOut.innerHTML = 'Parsing...';
    validationStatus.className = 'validation-status';
    await delay(600);
    
    if (isStrictMode) {
      // Perfect JSON via Tool use
      const json = {
        "user_data": {
          "name": "Alice",
          "age": 28,
          "status": "active"
        }
      };
      schemaOut.innerHTML = syntaxHighlight(JSON.stringify(json, null, 2));
      validationStatus.textContent = '✓ Schema validated against ToolInput schema.';
      validationStatus.className = 'validation-status success';
    } else {
      // Loose prompting simulates extra conversational text
      const looseOutput = `Here is the JSON you requested:\n\`\`\`json\n{\n  "user": "Alice",\n  "age": 28\n}\n\`\`\`\nLet me know if you need anything else!`;
      schemaOut.textContent = looseOutput;
      validationStatus.textContent = '✗ JSON.parse() failed. Output contains conversational text.';
      validationStatus.className = 'validation-status error';
    }
  });

  function syntaxHighlight(json) {
    return json.replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g, function (match) {
        let cls = 'number';
        if (/^"/.test(match)) {
            if (/:$/.test(match)) { cls = 'key'; } 
            else { cls = 'string'; }
        } else if (/true|false/.test(match)) { cls = 'boolean'; } 
        else if (/null/.test(match)) { cls = 'null'; }
        return '<span class="' + cls + '">' + match + '</span>';
    });
  }


  /* --------------------------------------------------------------------------
     Domain 4: MCP Toggle
     -------------------------------------------------------------------------- */
  const mcpToggles = document.querySelectorAll('.mcp-toggle');
  const injectedTools = document.getElementById('injectedTools');
  
  const mcpData = {
    github: [
      { name: 'github_read_repo', desc: 'Reads files from GitHub' },
      { name: 'github_create_pr', desc: 'Opens a pull request' }
    ],
    postgres: [
      { name: 'pg_query', desc: 'Executes read-only SQL' },
      { name: 'pg_schema', desc: 'Lists database schema' }
    ],
    fs: [
      { name: 'fs_read_file', desc: 'Reads local file contents' }
    ]
  };

  let activeTools = [];

  function renderTools() {
    if (activeTools.length === 0) {
      injectedTools.innerHTML = '<span class="mcp-empty">No tools connected.</span>';
      return;
    }
    injectedTools.innerHTML = activeTools.map(t => 
      `<div class="tool-tag">🔧 ${t.name}</div>`
    ).join('');
  }

  mcpToggles.forEach(toggle => {
    toggle.addEventListener('change', (e) => {
      const serverKey = e.target.value;
      const node = document.querySelector(`.mcp-server-node[data-server="${serverKey}"]`);
      const line = document.getElementById(`line-${serverKey}`);
      
      if (e.target.checked) {
        node.classList.add('active');
        line.classList.add('active');
        activeTools = [...activeTools, ...mcpData[serverKey]];
      } else {
        node.classList.remove('active');
        line.classList.remove('active');
        activeTools = activeTools.filter(t => !mcpData[serverKey].find(mt => mt.name === t.name));
      }
      renderTools();
    });
  });

  /* --------------------------------------------------------------------------
     Domain 5: Token Caching Math
     -------------------------------------------------------------------------- */
  const btnSys = document.getElementById('btnAddSys');
  const btnDocs = document.getElementById('btnAddDocs');
  const btnChat = document.getElementById('btnAddChat');
  const btnClear = document.getElementById('btnClearTokens');

  const fillSys = document.getElementById('fillSys');
  const fillDocs = document.getElementById('fillDocs');
  const fillChat = document.getElementById('fillChat');
  
  const elUsed = document.getElementById('tokenUsed');
  const elCached = document.getElementById('tokenCached');
  const elCost = document.getElementById('metricCost');
  const elDiscount = document.getElementById('metricDiscount');
  const elLatency = document.getElementById('metricLatency');

  const MAX_TOKENS = 200000;
  const CACHE_MIN = 1024;
  // Mock pricing: $3.00 per 1M input. Cached is $0.30 per 1M input.
  const BASE_PRICE_PER_M = 3.00;
  const CACHE_PRICE_PER_M = 0.30;

  let state = {
    sys: 0, docs: 0, chat: 0
  };

  function updateMath() {
    const total = state.sys + state.docs + state.chat;
    let cached = 0;
    
    // Simplistic mock: If sys+docs > 1024, they get cached.
    const staticContext = state.sys + state.docs;
    if (staticContext >= CACHE_MIN) {
      cached = staticContext;
    }

    const nonCached = total - cached;
    
    const costBase = (total / 1000000) * BASE_PRICE_PER_M;
    const costActual = (nonCached / 1000000) * BASE_PRICE_PER_M + (cached / 1000000) * CACHE_PRICE_PER_M;
    const discount = costBase - costActual;

    // Latency mock
    let latency = 0.5 + (nonCached / 50000) * 1.5 + (cached / 50000) * 0.1;

    // UI Updates
    fillSys.style.width = `${(state.sys / MAX_TOKENS) * 100}%`;
    fillDocs.style.width = `${(state.docs / MAX_TOKENS) * 100}%`;
    fillChat.style.width = `${(state.chat / MAX_TOKENS) * 100}%`;

    elUsed.textContent = total.toLocaleString();
    elCached.textContent = cached.toLocaleString();
    
    elCost.textContent = `$${costActual.toFixed(4)}`;
    elDiscount.textContent = `-$${discount.toFixed(4)}`;
    elLatency.textContent = `~${latency.toFixed(2)}s`;
    
    // Disable buttons if full
    btnSys.disabled = (total + 5000 > MAX_TOKENS || state.sys > 0);
    btnDocs.disabled = (total + 50000 > MAX_TOKENS || state.docs > 0);
    btnChat.disabled = (total + 15000 > MAX_TOKENS);
  }

  btnSys.addEventListener('click', () => { state.sys = 5000; updateMath(); });
  btnDocs.addEventListener('click', () => { state.docs = 50000; updateMath(); });
  btnChat.addEventListener('click', () => { state.chat += 15000; updateMath(); });
  
  btnClear.addEventListener('click', () => {
    state = { sys: 0, docs: 0, chat: 0 };
    updateMath();
  });

  /* --------------------------------------------------------------------------
     Tabs Logic
     -------------------------------------------------------------------------- */
  const tabBtns = document.querySelectorAll('.tab-btn');
  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const card = btn.closest('.viz-card');
      const tabs = card.querySelectorAll('.tab-btn');
      const contents = card.querySelectorAll('.tab-content');
      
      tabs.forEach(t => t.classList.remove('active'));
      contents.forEach(c => c.classList.remove('active'));
      
      btn.classList.add('active');
      document.getElementById(btn.dataset.target).classList.add('active');
    });
  });

  /* --------------------------------------------------------------------------
     Flashcards Logic
     -------------------------------------------------------------------------- */
  const flashcards = document.querySelectorAll('.flashcard');
  flashcards.forEach(card => {
    card.addEventListener('click', () => {
      card.classList.toggle('flipped');
    });
  });

  /* --------------------------------------------------------------------------
     Mock Quiz Engine
     -------------------------------------------------------------------------- */
  const quizData = [
    {
      q: "You are building a system that needs to extract specific data from an email and insert it into a Postgres database. How should you ensure the LLM provides the correct schema?",
      opts: [
        "Include a JSON template in the system prompt and ask nicely.",
        "Use the Tool Use API with `tool_choice` to enforce the schema programmatically.",
        "Use Prompt Caching to cache the schema.",
        "Add a Reviewer Agent to parse the text."
      ],
      ans: 1,
      exp: "Using the Tool Use API provides the strongest guarantee that the output will match the schema, as the model is heavily trained to map arguments to provided tool definitions."
    },
    {
      q: "Your application is experiencing high latency and costs when processing 50-page reference PDFs. What is the most effective optimization?",
      opts: [
        "Switch to a smaller model like Haiku.",
        "Remove the system prompt to save tokens.",
        "Place the PDF at the beginning of the prompt and use Prompt Caching.",
        "Break the PDF into 50 separate requests."
      ],
      ans: 2,
      exp: "Prompt Caching is designed exactly for this. By placing the massive, static PDF at the start of the context window, it crosses the 1024 token threshold and drastically reduces TTFT (Time To First Token) and cost."
    },
    {
      q: "When configuring a project directory with `CLAUDE.md`, what happens if you have a `CLAUDE.md` in the root and another in the `/backend` folder?",
      opts: [
        "The root file is ignored completely for files in `/backend`.",
        "The `/backend` file throws an error for duplicating configurations.",
        "They cascade. The `/backend` file will append to or override the root file's rules.",
        "You must manually link them using the `-config` flag."
      ],
      ans: 2,
      exp: "CLAUDE.md files follow a cascading inheritance model, similar to .gitignore or .eslintrc files."
    }
  ];

  let currentQuestion = 0;
  let score = 0;
  
  const qProgress = document.getElementById('quizProgress');
  const qScore = document.getElementById('quizScore');
  const qBody = document.getElementById('quizBody');
  const qFeedback = document.getElementById('quizFeedback');
  const fbTitle = document.getElementById('feedbackTitle');
  const fbText = document.getElementById('feedbackText');
  const btnNext = document.getElementById('btnNextQuestion');

  function renderQuiz() {
    if (currentQuestion >= quizData.length) {
      qBody.innerHTML = `<div class="quiz-question">Quiz Complete! Final Score: ${score} / ${quizData.length}</div>`;
      qFeedback.style.display = 'none';
      return;
    }
    
    const data = quizData[currentQuestion];
    qProgress.textContent = `Question ${currentQuestion + 1} of ${quizData.length}`;
    qScore.textContent = `Score: ${score}`;
    qFeedback.style.display = 'none';
    
    let html = `<div class="quiz-question">${data.q}</div><div class="quiz-options">`;
    data.opts.forEach((opt, idx) => {
      html += `<button class="quiz-option" data-idx="${idx}">${opt}</button>`;
    });
    html += `</div>`;
    qBody.innerHTML = html;
    
    const optsBtns = document.querySelectorAll('.quiz-option');
    optsBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        // Disable all
        optsBtns.forEach(b => { b.disabled = true; b.style.cursor = 'default'; });
        
        const selectedIdx = parseInt(e.target.dataset.idx);
        const correctIdx = data.ans;
        
        if (selectedIdx === correctIdx) {
          e.target.classList.add('correct');
          score++;
          fbTitle.textContent = "Correct!";
          qFeedback.className = "quiz-feedback success";
        } else {
          e.target.classList.add('wrong');
          document.querySelector(`.quiz-option[data-idx="${correctIdx}"]`).classList.add('correct');
          fbTitle.textContent = "Incorrect";
          qFeedback.className = "quiz-feedback error";
        }
        
        fbText.textContent = data.exp;
        qFeedback.style.display = 'block';
      });
    });
  }

  if (btnNext) {
      btnNext.addEventListener('click', () => {
        currentQuestion++;
        renderQuiz();
      });
      renderQuiz();
  }

});
