/* ═══════════════════════════════════════════════════════
   ELASTICSEARCH VISUALIZER — Interactive Logic
   ═══════════════════════════════════════════════════════ */

;(function () {
  'use strict';

  /* ──────────────────────────────────────────────────────
     1. SCROLL REVEAL (Intersection Observer)
     ────────────────────────────────────────────────────── */
  const revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          e.target.classList.add('visible');
        }
      });
    },
    { threshold: 0.08 }
  );
  document.querySelectorAll('.reveal').forEach((el) => revealObserver.observe(el));

  /* ──────────────────────────────────────────────────────
     2. CLUSTER ARCHITECTURE
     ────────────────────────────────────────────────────── */
  const NODES = [
    { id: 0, name: 'Node 0', icon: '🟡', roles: ['master', 'data'], isMaster: true },
    { id: 1, name: 'Node 1', icon: '🔵', roles: ['data'], isMaster: false },
    { id: 2, name: 'Node 2', icon: '🔵', roles: ['data'], isMaster: false },
    { id: 3, name: 'Node 3', icon: '🟣', roles: ['data', 'coordinating'], isMaster: false },
  ];

  function renderCluster() {
    const container = document.getElementById('cluster-viz');
    if (!container) return;
    container.innerHTML = NODES.map((n) => {
      const roleClass = n.isMaster ? 'master' : '';
      const roleBadges = n.roles.map((r) => {
        const cls = r === 'master' ? 'master-role' : r === 'data' ? 'data-role' : 'coord-role';
        return `<span class="es-node__role ${cls}">${r}</span>`;
      }).join(' ');
      return `
        <div class="es-node ${roleClass}" data-node-id="${n.id}">
          <div class="es-node__icon">${n.icon}</div>
          <div class="es-node__title">${n.name}</div>
          ${roleBadges}
          ${n.isMaster ? '<div style="font-size:0.7rem;color:var(--accent-amber);margin-top:4px;">★ Elected Master</div>' : ''}
        </div>`;
    }).join('');
  }
  renderCluster();

  const btnElect = document.getElementById('btn-elect-master');
  const btnRestore = document.getElementById('btn-restore-cluster');
  if (btnElect) {
    btnElect.addEventListener('click', () => {
      const currentMaster = NODES.find((n) => n.isMaster);
      if (currentMaster) currentMaster.isMaster = false;
      const eligible = NODES.filter((n) => n.roles.includes('master') || n.roles.includes('data'));
      const next = eligible.find((n) => !n.isMaster && n.id !== (currentMaster ? currentMaster.id : -1)) || eligible[0];
      next.isMaster = true;
      next.icon = '🟡';
      NODES.forEach((n) => { if (!n.isMaster) n.icon = n.roles.includes('coordinating') ? '🟣' : '🔵'; });
      renderCluster();
    });
  }
  if (btnRestore) {
    btnRestore.addEventListener('click', () => {
      NODES.forEach((n, i) => {
        n.isMaster = i === 0;
        n.icon = i === 0 ? '🟡' : n.roles.includes('coordinating') ? '🟣' : '🔵';
      });
      renderCluster();
    });
  }

  /* ──────────────────────────────────────────────────────
     3. INDICES, SHARDS & REPLICAS
     ────────────────────────────────────────────────────── */
  const sliderShards = document.getElementById('slider-shards');
  const sliderReplicas = document.getElementById('slider-replicas');
  const valShards = document.getElementById('val-shards');
  const valReplicas = document.getElementById('val-replicas');
  const shardDistribution = document.getElementById('shard-distribution');

  function renderShardDistribution() {
    if (!shardDistribution) return;
    const numPrimary = parseInt(sliderShards.value);
    const numReplicas = parseInt(sliderReplicas.value);
    const numNodes = 3;

    // Assign primary shards round-robin to nodes
    const nodeShards = Array.from({ length: numNodes }, () => []);
    for (let p = 0; p < numPrimary; p++) {
      nodeShards[p % numNodes].push({ id: `P${p}`, type: 'primary' });
    }
    // Assign replicas to different nodes
    for (let r = 0; r < numReplicas; r++) {
      for (let p = 0; p < numPrimary; p++) {
        const primaryNode = p % numNodes;
        // Put replica on a different node
        const replicaNode = (primaryNode + 1 + r) % numNodes;
        nodeShards[replicaNode].push({ id: `R${p}`, type: 'replica' });
      }
    }

    const totalShards = numPrimary * (1 + numReplicas);
    shardDistribution.innerHTML = `
      <div class="scaling-nodes">
        ${nodeShards.map((shards, i) => `
          <div class="scaling-node">
            <div class="scaling-node__name">🖥️ Node ${i}</div>
            <div class="scaling-node__shards">
              ${shards.map((s) => `<div class="shard-chip ${s.type}">${s.id}</div>`).join('')}
            </div>
          </div>
        `).join('')}
      </div>
      <div class="scaling-metrics">
        <div class="merge-stat">
          <div class="merge-stat__value">${numPrimary}</div>
          <div class="merge-stat__label">Primary Shards</div>
        </div>
        <div class="merge-stat">
          <div class="merge-stat__value">${numPrimary * numReplicas}</div>
          <div class="merge-stat__label">Replica Shards</div>
        </div>
        <div class="merge-stat">
          <div class="merge-stat__value">${totalShards}</div>
          <div class="merge-stat__label">Total Shards</div>
        </div>
      </div>`;
  }

  if (sliderShards && sliderReplicas) {
    renderShardDistribution();
    sliderShards.addEventListener('input', () => {
      valShards.textContent = sliderShards.value;
      renderShardDistribution();
    });
    sliderReplicas.addEventListener('input', () => {
      valReplicas.textContent = sliderReplicas.value;
      renderShardDistribution();
    });
  }

  /* ──────────────────────────────────────────────────────
     4. INVERTED INDEX
     ────────────────────────────────────────────────────── */
  let documents = [
    { id: 1, text: 'the quick brown fox jumps over the lazy dog' },
    { id: 2, text: 'quick brown rabbits and lazy turtles' },
    { id: 3, text: 'the fox is very quick and smart' },
  ];
  let docCounter = 3;

  function tokenize(text) {
    return text.toLowerCase().replace(/[^\w\s]/g, '').split(/\s+/).filter(Boolean);
  }

  function buildInvertedIndex() {
    const index = {};
    documents.forEach((doc) => {
      const tokens = tokenize(doc.text);
      const unique = [...new Set(tokens)];
      unique.forEach((term) => {
        if (!index[term]) index[term] = [];
        index[term].push(doc.id);
      });
    });
    return index;
  }

  function renderInvertedIndex() {
    const docsEl = document.getElementById('ii-docs');
    const tableBody = document.getElementById('ii-table-body');
    if (!docsEl || !tableBody) return;

    docsEl.innerHTML = documents.map((d) => `
      <div class="ii-doc">
        <span class="ii-doc__id">Doc ${d.id}</span>
        <span class="ii-doc__text">${d.text}</span>
      </div>
    `).join('');

    const idx = buildInvertedIndex();
    const sorted = Object.entries(idx).sort((a, b) => a[0].localeCompare(b[0]));
    tableBody.innerHTML = sorted.map(([term, docIds]) => `
      <tr>
        <td class="term-cell">${term}</td>
        <td>${docIds.length}</td>
        <td>
          <div class="doc-ids">
            ${docIds.map((id) => `<span class="doc-id-badge">Doc ${id}</span>`).join('')}
          </div>
        </td>
      </tr>
    `).join('');
  }

  renderInvertedIndex();

  const btnAddDoc = document.getElementById('btn-add-doc');
  const iiDocInput = document.getElementById('ii-doc-input');
  const btnClearDocs = document.getElementById('btn-clear-docs');

  if (btnAddDoc && iiDocInput) {
    btnAddDoc.addEventListener('click', () => {
      const text = iiDocInput.value.trim();
      if (!text) return;
      docCounter++;
      documents.push({ id: docCounter, text });
      iiDocInput.value = '';
      renderInvertedIndex();
    });
    iiDocInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') btnAddDoc.click();
    });
  }
  if (btnClearDocs) {
    btnClearDocs.addEventListener('click', () => {
      documents = [];
      docCounter = 0;
      renderInvertedIndex();
    });
  }

  /* ──────────────────────────────────────────────────────
     5. ANALYZERS & TOKENIZATION
     ────────────────────────────────────────────────────── */
  const analyzerToggle = document.getElementById('analyzer-toggle');
  const analyzerInput = document.getElementById('analyzer-input');
  const analyzerPipeline = document.getElementById('analyzer-pipeline');
  let currentAnalyzer = 'standard';

  const STOP_WORDS = new Set(['the', 'a', 'an', 'is', 'are', 'was', 'were', 'in', 'on', 'at', 'to', 'for', 'of', 'and', 'or', 'but', 'not', 'with', 'this', 'that', 'it']);

  function analyzeText(text, analyzer) {
    const stages = [];
    let currentText = text;

    // Stage 1: Char Filter
    if (analyzer === 'custom') {
      const filtered = currentText.replace(/<[^>]*>/g, '').replace(/&amp;/g, '&');
      stages.push({ label: 'Char Filter', sublabel: 'html_strip', tokens: [filtered], raw: true });
      currentText = filtered;
    } else {
      stages.push({ label: 'Char Filter', sublabel: 'none', tokens: [currentText], raw: true });
    }

    // Stage 2: Tokenizer
    let tokens;
    if (analyzer === 'keyword') {
      tokens = [currentText];
      stages.push({ label: 'Tokenizer', sublabel: 'keyword', tokens: [...tokens] });
    } else if (analyzer === 'whitespace') {
      tokens = currentText.split(/\s+/).filter(Boolean);
      stages.push({ label: 'Tokenizer', sublabel: 'whitespace', tokens: [...tokens] });
    } else {
      tokens = currentText.split(/[\s\-_.,!?;:'"()\[\]{}]+/).filter(Boolean);
      stages.push({ label: 'Tokenizer', sublabel: 'standard', tokens: [...tokens] });
    }

    // Stage 3: Token Filters
    if (analyzer === 'standard' || analyzer === 'custom') {
      const lowered = tokens.map((t) => t.toLowerCase());
      stages.push({ label: 'Token Filter', sublabel: 'lowercase', tokens: [...lowered] });
      tokens = lowered;
    }

    if (analyzer === 'custom') {
      const filtered = tokens.filter((t) => !STOP_WORDS.has(t));
      const removed = tokens.filter((t) => STOP_WORDS.has(t));
      stages.push({ label: 'Token Filter', sublabel: 'stop_words', tokens: tokens.map((t) => ({ text: t, removed: STOP_WORDS.has(t) })) });
      tokens = filtered;

      // Simple stemming
      const stemmed = tokens.map((t) => {
        if (t.endsWith('ing')) return t.slice(0, -3);
        if (t.endsWith('tion')) return t.slice(0, -4) + 't';
        if (t.endsWith('ly')) return t.slice(0, -2);
        if (t.endsWith('es')) return t.slice(0, -2);
        if (t.endsWith('ed')) return t.slice(0, -2);
        if (t.endsWith('s') && !t.endsWith('ss')) return t.slice(0, -1);
        return t;
      });
      stages.push({
        label: 'Token Filter',
        sublabel: 'stemmer',
        tokens: stemmed.map((t, i) => ({ text: t, modified: t !== tokens[i] })),
      });
    }

    return stages;
  }

  function renderAnalyzerPipeline() {
    if (!analyzerPipeline || !analyzerInput) return;
    const text = analyzerInput.value || 'The Quick Brown FOX-123!';
    const stages = analyzeText(text, currentAnalyzer);

    analyzerPipeline.innerHTML = stages.map((stage, i) => {
      let tokenHtml;
      if (stage.raw) {
        tokenHtml = `<span class="token-chip" style="font-size:0.85rem;">${stage.tokens[0]}</span>`;
      } else if (Array.isArray(stage.tokens) && stage.tokens.length > 0 && typeof stage.tokens[0] === 'object') {
        tokenHtml = stage.tokens.map((t) => {
          const cls = t.removed ? 'removed' : t.modified ? 'modified' : '';
          return `<span class="token-chip ${cls}">${t.text}</span>`;
        }).join('');
      } else {
        tokenHtml = stage.tokens.map((t) => `<span class="token-chip">${t}</span>`).join('');
      }
      return `
        ${i > 0 ? '<div class="pipeline-arrow">↓</div>' : ''}
        <div class="pipeline-stage">
          <div class="pipeline-stage__label">${stage.label}<br><small style="opacity:0.7;">${stage.sublabel}</small></div>
          <div class="pipeline-stage__output">${tokenHtml}</div>
        </div>`;
    }).join('');
  }

  if (analyzerToggle) {
    analyzerToggle.querySelectorAll('.strategy-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        analyzerToggle.querySelectorAll('.strategy-btn').forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        currentAnalyzer = btn.dataset.analyzer;
        renderAnalyzerPipeline();
      });
    });
  }
  if (analyzerInput) {
    analyzerInput.addEventListener('input', renderAnalyzerPipeline);
    renderAnalyzerPipeline();
  }

  /* ──────────────────────────────────────────────────────
     6. DOCUMENT INDEXING FLOW
     ────────────────────────────────────────────────────── */
  const flowStages = ['flow-client', 'flow-buffer', 'flow-translog', 'flow-refresh', 'flow-segment', 'flow-merge'];
  const btnIndexDoc = document.getElementById('btn-index-doc');
  const btnFlush = document.getElementById('btn-flush');

  function animateFlow(stageIds, speed = 400) {
    stageIds.forEach((id) => {
      const el = document.getElementById(id);
      if (el) { el.classList.remove('active', 'done'); }
    });
    stageIds.forEach((id, i) => {
      setTimeout(() => {
        const el = document.getElementById(id);
        if (!el) return;
        el.classList.add('active');
        if (i > 0) {
          const prev = document.getElementById(stageIds[i - 1]);
          if (prev) { prev.classList.remove('active'); prev.classList.add('done'); }
        }
        if (i === stageIds.length - 1) {
          setTimeout(() => { el.classList.remove('active'); el.classList.add('done'); }, speed);
        }
      }, i * speed);
    });
  }

  if (btnIndexDoc) {
    btnIndexDoc.addEventListener('click', () => {
      animateFlow(flowStages, 500);
    });
  }
  if (btnFlush) {
    btnFlush.addEventListener('click', () => {
      animateFlow(['flow-buffer', 'flow-translog', 'flow-segment'], 600);
    });
  }

  /* ──────────────────────────────────────────────────────
     7. FULL-TEXT SEARCH
     ────────────────────────────────────────────────────── */
  const searchQuery = document.getElementById('search-query');
  const btnSearch = document.getElementById('btn-search');
  const searchResults = document.getElementById('search-results');
  const searchTypeToggle = document.getElementById('search-type-toggle');
  let searchType = 'match';

  if (searchTypeToggle) {
    searchTypeToggle.querySelectorAll('.strategy-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        searchTypeToggle.querySelectorAll('.strategy-btn').forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        searchType = btn.dataset.type;
      });
    });
  }

  function computeBM25(queryTerms, doc, allDocs) {
    const k1 = 1.2, b = 0.75;
    const docTokens = tokenize(doc.text);
    const avgdl = allDocs.reduce((sum, d) => sum + tokenize(d.text).length, 0) / allDocs.length;
    const dl = docTokens.length;
    let score = 0;

    queryTerms.forEach((term) => {
      const df = allDocs.filter((d) => tokenize(d.text).includes(term)).length;
      const idf = Math.log((allDocs.length - df + 0.5) / (df + 0.5) + 1);
      const tf = docTokens.filter((t) => t === term).length;
      const tfNorm = (tf * (k1 + 1)) / (tf + k1 * (1 - b + b * (dl / avgdl)));
      score += idf * tfNorm;
    });
    return Math.max(0, score);
  }

  function highlightTerms(text, terms) {
    let result = text;
    terms.forEach((term) => {
      const regex = new RegExp(`\\b(${term})\\b`, 'gi');
      result = result.replace(regex, '<mark>$1</mark>');
    });
    return result;
  }

  function performSearch() {
    if (!searchQuery || !searchResults || documents.length === 0) return;
    const query = searchQuery.value.trim();
    if (!query) {
      searchResults.innerHTML = '<div style="color:var(--text-muted);font-style:italic;">Type a query and click Search</div>';
      return;
    }

    const queryTerms = tokenize(query);
    let results = [];

    if (searchType === 'match') {
      results = documents.map((doc) => {
        const docTerms = tokenize(doc.text);
        const matches = queryTerms.filter((t) => docTerms.includes(t));
        if (matches.length === 0) return null;
        return { doc, score: computeBM25(queryTerms, doc, documents), matchedTerms: matches };
      }).filter(Boolean);
    } else if (searchType === 'match_phrase') {
      const phraseStr = queryTerms.join(' ');
      results = documents.map((doc) => {
        const docStr = tokenize(doc.text).join(' ');
        if (!docStr.includes(phraseStr)) return null;
        return { doc, score: computeBM25(queryTerms, doc, documents) + 2, matchedTerms: queryTerms };
      }).filter(Boolean);
    } else {
      // multi_match — search across all fields (we only have text)
      results = documents.map((doc) => {
        const docTerms = tokenize(doc.text);
        const matches = queryTerms.filter((t) => docTerms.includes(t));
        if (matches.length === 0) return null;
        return { doc, score: computeBM25(queryTerms, doc, documents) * 1.2, matchedTerms: matches };
      }).filter(Boolean);
    }

    results.sort((a, b) => b.score - a.score);

    if (results.length === 0) {
      searchResults.innerHTML = '<div style="color:var(--text-muted);font-style:italic;">No matching documents found.</div>';
      return;
    }

    searchResults.innerHTML = results.map((r) => `
      <div class="search-result">
        <div class="search-result__score">${r.score.toFixed(2)}</div>
        <div class="search-result__doc">
          <div class="search-result__id">Doc ${r.doc.id}</div>
          <div class="search-result__text">${highlightTerms(r.doc.text, r.matchedTerms)}</div>
        </div>
      </div>
    `).join('');
  }

  if (btnSearch) btnSearch.addEventListener('click', performSearch);
  if (searchQuery) searchQuery.addEventListener('keydown', (e) => { if (e.key === 'Enter') performSearch(); });

  /* ──────────────────────────────────────────────────────
     8. FUZZY SEARCH & EDIT DISTANCE
     ────────────────────────────────────────────────────── */
  const fuzzySource = document.getElementById('fuzzy-source');
  const fuzzyTarget = document.getElementById('fuzzy-target');
  const btnFuzzyCalc = document.getElementById('btn-fuzzy-calc');
  const edMatrix = document.getElementById('ed-matrix');
  const fuzzyMatches = document.getElementById('fuzzy-matches');

  function computeEditDistance(s, t) {
    const m = s.length, n = t.length;
    const dp = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
    for (let i = 0; i <= m; i++) dp[i][0] = i;
    for (let j = 0; j <= n; j++) dp[0][j] = j;
    for (let i = 1; i <= m; i++) {
      for (let j = 1; j <= n; j++) {
        const cost = s[i - 1] === t[j - 1] ? 0 : 1;
        dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + cost);
      }
    }
    // Trace back path
    const path = new Set();
    let i = m, j = n;
    while (i > 0 || j > 0) {
      path.add(`${i},${j}`);
      if (i > 0 && j > 0 && dp[i][j] === dp[i - 1][j - 1] + (s[i - 1] === t[j - 1] ? 0 : 1)) {
        i--; j--;
      } else if (i > 0 && dp[i][j] === dp[i - 1][j] + 1) {
        i--;
      } else {
        j--;
      }
    }
    path.add('0,0');
    return { dp, distance: dp[m][n], path };
  }

  function renderEditDistanceMatrix(s, t) {
    if (!edMatrix) return;
    const { dp, distance, path } = computeEditDistance(s, t);

    let html = '<table class="ed-table"><thead><tr><th></th><th>ε</th>';
    for (let j = 0; j < t.length; j++) html += `<th>${t[j]}</th>`;
    html += '</tr></thead><tbody>';
    for (let i = 0; i <= s.length; i++) {
      html += `<tr><th>${i === 0 ? 'ε' : s[i - 1]}</th>`;
      for (let j = 0; j <= t.length; j++) {
        const isPath = path.has(`${i},${j}`);
        html += `<td class="${isPath ? 'path' : ''}">${dp[i][j]}</td>`;
      }
      html += '</tr>';
    }
    html += '</tbody></table>';
    html += `<div style="margin-top:0.8rem;font-family:var(--font-mono);font-size:0.9rem;">
      Edit Distance: <span style="color:var(--accent-amber);font-weight:800;">${distance}</span>
    </div>`;
    edMatrix.innerHTML = html;
  }

  function renderFuzzyMatches(source) {
    if (!fuzzyMatches) return;
    const idx = buildInvertedIndex();
    const terms = Object.keys(idx);
    const matches = terms.map((term) => {
      const { distance } = computeEditDistance(source.toLowerCase(), term);
      return { term, distance };
    }).filter((m) => m.distance <= 2).sort((a, b) => a.distance - b.distance);

    if (matches.length === 0) {
      fuzzyMatches.innerHTML = '<div style="color:var(--text-muted);font-style:italic;">No fuzzy matches found (edit distance ≤ 2)</div>';
      return;
    }

    fuzzyMatches.innerHTML = matches.map((m) => `
      <div class="fuzzy-match">
        <span class="fuzzy-match__term">${m.term}</span>
        <span class="fuzzy-match__distance d${m.distance}">distance: ${m.distance}</span>
      </div>
    `).join('');
  }

  if (btnFuzzyCalc) {
    btnFuzzyCalc.addEventListener('click', () => {
      const s = (fuzzySource.value || 'quik').trim();
      const t = (fuzzyTarget.value || 'quick').trim();
      if (!s || !t) return;
      renderEditDistanceMatrix(s, t);
      renderFuzzyMatches(s);
    });
    // Auto-run with defaults
    renderEditDistanceMatrix('quik', 'quick');
    renderFuzzyMatches('quik');
  }

  /* ──────────────────────────────────────────────────────
     9. QUERY DSL & SCORING
     ────────────────────────────────────────────────────── */
  function buildQueryJSON() {
    const clauses = [1, 2, 3].map((i) => {
      const type = document.getElementById(`qb-clause-${i}-type`)?.value;
      const query = document.getElementById(`qb-clause-${i}-query`)?.value;
      const field = document.getElementById(`qb-clause-${i}-field`)?.value;
      const value = document.getElementById(`qb-clause-${i}-value`)?.value;
      return { type, query, field, value };
    });

    const bool = {};
    clauses.forEach((c) => {
      if (!c.field || !c.value) return;
      if (!bool[c.type]) bool[c.type] = [];
      let clause;
      if (c.query === 'range') {
        const parts = c.value.split(',').map((p) => p.trim());
        const rangeObj = {};
        parts.forEach((p) => {
          const [op, val] = p.split(':');
          if (op && val) rangeObj[op] = val;
        });
        clause = { range: { [c.field]: rangeObj } };
      } else {
        clause = { [c.query]: { [c.field]: c.value } };
      }
      bool[c.type].push(clause);
    });

    // Convert arrays with single items for cleaner output
    return { query: { bool } };
  }

  function syntaxHighlightJSON(json) {
    return JSON.stringify(json, null, 2)
      .replace(/(".*?")(?=\s*:)/g, '<span class="json-key">$1</span>')
      .replace(/:\s*(".*?")/g, ': <span class="json-string">$1</span>')
      .replace(/:\s*(\d+)/g, ': <span class="json-number">$1</span>')
      .replace(/[{}\[\]]/g, '<span class="json-bracket">$&</span>');
  }

  function renderQueryJSON() {
    const output = document.getElementById('qb-json-output');
    if (!output) return;
    const json = buildQueryJSON();
    output.innerHTML = syntaxHighlightJSON(json);
  }

  // Bind all query builder inputs
  [1, 2, 3].forEach((i) => {
    ['type', 'query', 'field', 'value'].forEach((f) => {
      const el = document.getElementById(`qb-clause-${i}-${f}`);
      if (el) el.addEventListener('input', renderQueryJSON);
      if (el) el.addEventListener('change', renderQueryJSON);
    });
  });
  renderQueryJSON();

  // Scoring cards interactive
  const scoringCards = document.getElementById('scoring-cards');
  if (scoringCards) {
    scoringCards.querySelectorAll('.scoring-card').forEach((card) => {
      card.addEventListener('click', () => {
        scoringCards.querySelectorAll('.scoring-card').forEach((c) => c.classList.remove('selected'));
        card.classList.add('selected');
      });
    });
  }

  /* ──────────────────────────────────────────────────────
     10. AGGREGATIONS
     ────────────────────────────────────────────────────── */
  const aggButtons = document.getElementById('agg-buttons');
  const aggResult = document.getElementById('agg-result');

  const AGG_DATA = {
    terms: {
      title: 'Terms Aggregation — Products by Category',
      bars: [
        { label: 'Electronics', value: 340, max: 400, color: 'amber' },
        { label: 'Clothing', value: 280, max: 400, color: 'cyan' },
        { label: 'Books', value: 190, max: 400, color: 'green' },
        { label: 'Home', value: 150, max: 400, color: 'purple' },
        { label: 'Sports', value: 90, max: 400, color: 'pink' },
      ],
    },
    range: {
      title: 'Range Aggregation — Products by Price',
      bars: [
        { label: '$0–$25', value: 320, max: 400, color: 'green' },
        { label: '$25–$50', value: 250, max: 400, color: 'cyan' },
        { label: '$50–$100', value: 180, max: 400, color: 'amber' },
        { label: '$100–$500', value: 120, max: 400, color: 'purple' },
        { label: '$500+', value: 45, max: 400, color: 'pink' },
      ],
    },
    date_histogram: {
      title: 'Date Histogram — Orders by Month',
      bars: [
        { label: 'Sep', value: 180, max: 400, color: 'amber' },
        { label: 'Oct', value: 260, max: 400, color: 'cyan' },
        { label: 'Nov', value: 380, max: 400, color: 'green' },
        { label: 'Dec', value: 400, max: 400, color: 'purple' },
        { label: 'Jan', value: 210, max: 400, color: 'pink' },
      ],
    },
    stats: {
      title: 'Stats Aggregation — Price Statistics',
      stats: [
        { label: 'Count', value: '1,050' },
        { label: 'Min', value: '$4.99' },
        { label: 'Max', value: '$1,299.99' },
        { label: 'Avg', value: '$87.42' },
        { label: 'Sum', value: '$91,791' },
      ],
    },
  };

  function renderAggResult(type) {
    if (!aggResult) return;
    const data = AGG_DATA[type];
    if (!data) return;

    if (data.stats) {
      aggResult.innerHTML = `
        <h4 style="font-size:0.9rem;font-weight:700;margin-bottom:1rem;color:var(--accent-amber);">${data.title}</h4>
        <div class="merge-stats">
          ${data.stats.map((s) => `
            <div class="merge-stat">
              <div class="merge-stat__value">${s.value}</div>
              <div class="merge-stat__label">${s.label}</div>
            </div>
          `).join('')}
        </div>`;
      return;
    }

    aggResult.innerHTML = `
      <h4 style="font-size:0.9rem;font-weight:700;margin-bottom:1rem;color:var(--accent-amber);">${data.title}</h4>
      <div class="agg-bars">
        ${data.bars.map((bar) => `
          <div class="agg-bar-row">
            <div class="agg-bar-label">${bar.label}</div>
            <div class="agg-bar">
              <div class="agg-bar__fill ${bar.color}" style="width: 0%;" data-width="${(bar.value / bar.max) * 100}%">
                ${bar.value}
              </div>
            </div>
          </div>
        `).join('')}
      </div>`;

    // Animate bars
    requestAnimationFrame(() => {
      aggResult.querySelectorAll('.agg-bar__fill').forEach((bar) => {
        bar.style.width = bar.dataset.width;
      });
    });
  }

  if (aggButtons) {
    aggButtons.querySelectorAll('.agg-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        aggButtons.querySelectorAll('.agg-btn').forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        renderAggResult(btn.dataset.agg);
      });
    });
    renderAggResult('terms');
  }

  /* ──────────────────────────────────────────────────────
     11. SCALING & SHARD ALLOCATION
     ────────────────────────────────────────────────────── */
  const sliderNodes = document.getElementById('slider-nodes');
  const valNodes = document.getElementById('val-nodes');
  const scalingNodes = document.getElementById('scaling-nodes');
  const scalingMetrics = document.getElementById('scaling-metrics');
  const btnRebalance = document.getElementById('btn-rebalance');
  const NUM_PRIMARY_SHARDS = 5;
  const NUM_REPLICAS_SCALING = 1;

  function renderScaling() {
    if (!scalingNodes || !scalingMetrics) return;
    const numNodes = parseInt(sliderNodes.value);
    const totalShards = NUM_PRIMARY_SHARDS * (1 + NUM_REPLICAS_SCALING);

    const nodeAlloc = Array.from({ length: numNodes }, () => []);

    // Allocate primary shards
    for (let p = 0; p < NUM_PRIMARY_SHARDS; p++) {
      nodeAlloc[p % numNodes].push({ id: `P${p}`, type: 'primary' });
    }
    // Allocate replicas to different nodes
    for (let p = 0; p < NUM_PRIMARY_SHARDS; p++) {
      const primaryNode = p % numNodes;
      if (numNodes > 1) {
        const replicaNode = (primaryNode + 1) % numNodes;
        nodeAlloc[replicaNode].push({ id: `R${p}`, type: 'replica' });
      } else {
        // Single node — can't allocate replicas (unassigned)
        // Show as warning
      }
    }

    scalingNodes.innerHTML = nodeAlloc.map((shards, i) => `
      <div class="scaling-node new-node">
        <div class="scaling-node__name">🖥️ Data Node ${i}</div>
        <div class="scaling-node__shards">
          ${shards.map((s) => `<div class="shard-chip ${s.type}">${s.id}</div>`).join('')}
        </div>
        <div style="margin-top:0.5rem;font-size:0.72rem;color:var(--text-muted);">${shards.length} shards</div>
      </div>
    `).join('');

    const unassigned = numNodes === 1 ? NUM_PRIMARY_SHARDS : 0;
    scalingMetrics.innerHTML = `
      <div class="merge-stat">
        <div class="merge-stat__value">${numNodes}</div>
        <div class="merge-stat__label">Data Nodes</div>
      </div>
      <div class="merge-stat">
        <div class="merge-stat__value">${totalShards}</div>
        <div class="merge-stat__label">Total Shards</div>
      </div>
      <div class="merge-stat">
        <div class="merge-stat__value">${Math.ceil(totalShards / numNodes)}</div>
        <div class="merge-stat__label">Shards per Node</div>
      </div>
      <div class="merge-stat">
        <div class="merge-stat__value" style="${unassigned > 0 ? 'color:var(--accent-red);-webkit-text-fill-color:var(--accent-red);background:none;' : ''}">${unassigned}</div>
        <div class="merge-stat__label">Unassigned Replicas</div>
      </div>`;
  }

  if (sliderNodes) {
    renderScaling();
    sliderNodes.addEventListener('input', () => {
      valNodes.textContent = sliderNodes.value;
      renderScaling();
    });
  }
  if (btnRebalance) {
    btnRebalance.addEventListener('click', renderScaling);
  }

  /* ──────────────────────────────────────────────────────
     12. SEGMENT MERGING & PERFORMANCE
     ────────────────────────────────────────────────────── */
  const segmentsContainer = document.getElementById('segments-container');
  const mergeStatsEl = document.getElementById('merge-stats');
  const btnAddSegments = document.getElementById('btn-add-segments');
  const btnMerge = document.getElementById('btn-merge-segments');
  const btnForceMerge = document.getElementById('btn-force-merge');

  let segments = [
    { id: 0, docs: 120, size: 'large' },
    { id: 1, docs: 45, size: 'medium' },
    { id: 2, docs: 20, size: 'small' },
  ];
  let segCounter = 3;

  function renderSegments() {
    if (!segmentsContainer) return;
    segmentsContainer.innerHTML = `
      <div style="font-size:0.82rem;font-weight:600;color:var(--text-secondary);margin-bottom:0.5rem;">
        Segments in Shard 0 (${segments.length} total):
      </div>
      <div class="segment-row">
        ${segments.map((s) => `
          <div class="segment-block ${s.size}" title="${s.docs} docs">
            S${s.id}<br><small>${s.docs}</small>
          </div>
        `).join('')}
      </div>`;

    if (mergeStatsEl) {
      const totalDocs = segments.reduce((sum, s) => sum + s.docs, 0);
      mergeStatsEl.innerHTML = `
        <div class="merge-stat">
          <div class="merge-stat__value">${segments.length}</div>
          <div class="merge-stat__label">Segments</div>
        </div>
        <div class="merge-stat">
          <div class="merge-stat__value">${totalDocs}</div>
          <div class="merge-stat__label">Total Docs</div>
        </div>
        <div class="merge-stat">
          <div class="merge-stat__value">${segments.length <= 1 ? '⚡' : segments.length <= 3 ? '🟢' : segments.length <= 6 ? '🟡' : '🔴'}</div>
          <div class="merge-stat__label">Search Speed</div>
        </div>`;
    }
  }

  renderSegments();

  if (btnAddSegments) {
    btnAddSegments.addEventListener('click', () => {
      const count = 3;
      for (let i = 0; i < count; i++) {
        const docs = Math.floor(Math.random() * 30) + 5;
        segments.push({ id: segCounter++, docs, size: docs < 20 ? 'small' : 'medium' });
      }
      renderSegments();
    });
  }

  if (btnMerge) {
    btnMerge.addEventListener('click', () => {
      if (segments.length <= 1) return;
      // Merge the two smallest segments
      segments.sort((a, b) => a.docs - b.docs);
      const s1 = segments.shift();
      const s2 = segments.shift();
      const merged = {
        id: segCounter++,
        docs: s1.docs + s2.docs,
        size: (s1.docs + s2.docs) > 80 ? 'large' : (s1.docs + s2.docs) > 30 ? 'medium' : 'small',
      };
      segments.push(merged);
      segments.sort((a, b) => b.docs - a.docs);
      renderSegments();
    });
  }

  if (btnForceMerge) {
    btnForceMerge.addEventListener('click', () => {
      if (segments.length <= 1) return;
      const totalDocs = segments.reduce((sum, s) => sum + s.docs, 0);
      segments = [{ id: segCounter++, docs: totalDocs, size: 'large' }];
      renderSegments();
    });
  }

})();
