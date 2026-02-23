document.addEventListener('DOMContentLoaded', () => {
  /* ── Intersection Observer for reveal ───────── */
  const io = new IntersectionObserver(entries => {
    entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible'); });
  }, { threshold: 0.08 });
  document.querySelectorAll('.reveal').forEach(s => io.observe(s));

  /* ──────────────────────────────────────────────
     1. FULL SCAN vs INDEX SCAN
     ────────────────────────────────────────────── */
  const scanDemo = document.getElementById('scan-demo');
  const scanResult = document.getElementById('scan-result');
  const btnFull = document.getElementById('btn-full-scan');
  const btnIndex = document.getElementById('btn-index-scan');
  const btnScanReset = document.getElementById('btn-scan-reset');

  const TABLE_SIZE = 20;
  const TARGET_IDX = 13; // "user_42" is at index 13
  const rows = [];
  for (let i = 0; i < TABLE_SIZE; i++) {
    rows.push(i === TARGET_IDX ? 'user_42' : `user_${(Math.random() * 100 | 0)}`);
  }

  function renderScanTable() {
    if (!scanDemo) return;
    scanDemo.innerHTML = '';
    const table = document.createElement('div');
    table.className = 'scan-table';
    rows.forEach((r, i) => {
      const cell = document.createElement('div');
      cell.className = 'scan-row';
      cell.id = `scan-cell-${i}`;
      cell.innerHTML = `<div style="font-size:0.5rem;color:var(--text-muted)">row ${i}</div>${r}`;
      table.appendChild(cell);
    });
    scanDemo.appendChild(table);
  }
  renderScanTable();

  if (btnFull) btnFull.addEventListener('click', () => {
    renderScanTable();
    if (scanResult) scanResult.textContent = '';
    let scanned = 0;
    for (let i = 0; i < TABLE_SIZE; i++) {
      setTimeout(() => {
        const cell = document.getElementById(`scan-cell-${i}`);
        scanned++;
        if (i === TARGET_IDX) {
          if (cell) cell.className = 'scan-row found';
          if (scanResult) scanResult.innerHTML = `<span style="color:var(--accent-yellow)">⚠ Full Scan: Found at row ${i}. Scanned <strong>${scanned}/${TABLE_SIZE}</strong> rows. O(n)</span>`;
        } else if (cell) {
          cell.className = 'scan-row checking';
          setTimeout(() => { cell.className = 'scan-row checked'; }, 80);
        }
      }, i * 100);
    }
  });

  if (btnIndex) btnIndex.addEventListener('click', () => {
    renderScanTable();
    if (scanResult) scanResult.textContent = '';
    setTimeout(() => {
      const cell = document.getElementById(`scan-cell-${TARGET_IDX}`);
      if (cell) cell.className = 'scan-row found';
      if (scanResult) scanResult.innerHTML = `<span style="color:var(--accent-green)">⚡ Index Lookup: Found instantly at row ${TARGET_IDX}. Scanned <strong>1</strong> row via B-Tree. O(log n)</span>`;
    }, 200);
  });

  if (btnScanReset) btnScanReset.addEventListener('click', () => { renderScanTable(); if (scanResult) scanResult.textContent = ''; });

  /* ──────────────────────────────────────────────
     2. B-TREE / B+ TREE
     ────────────────────────────────────────────── */
  const btreeDemo = document.getElementById('btree-demo');
  const btreeResult = document.getElementById('btree-result');
  const btreeInput = document.getElementById('btree-input');
  const btnBtreeSearch = document.getElementById('btn-btree-search');
  const btnBtreeInsert = document.getElementById('btn-btree-insert');

  // Fixed B+ tree structure for visualization
  let btreeData = {
    root: [30, 60],
    internal: [[10, 20], [40, 50], [70, 80]],
    leaves: [[5, 8, 10], [12, 15, 20], [25, 28, 30], [35, 38, 40], [45, 48, 50], [55, 58, 60], [65, 68, 70], [75, 78, 80], [85, 90, 95]]
  };

  function renderBTree(highlightPath, foundVal) {
    if (!btreeDemo) return;
    btreeDemo.innerHTML = '';
    const container = document.createElement('div');
    container.className = 'btree-container';

    // Root
    const rootLevel = document.createElement('div');
    rootLevel.className = 'btree-level';
    const rootNode = document.createElement('div');
    rootNode.className = 'btree-node' + (highlightPath && highlightPath.includes('root') ? ' highlight' : '');
    btreeData.root.forEach(k => {
      const key = document.createElement('span');
      key.className = 'btree-key' + (highlightPath && highlightPath.includes(`root-${k}`) ? ' active' : '') + (k === foundVal ? ' found-key' : '');
      key.textContent = k;
      rootNode.appendChild(key);
    });
    rootLevel.appendChild(rootNode);
    container.appendChild(rootLevel);

    // Arrow
    const arrow1 = document.createElement('div');
    arrow1.className = 'btree-arrow';
    arrow1.textContent = '↙  ↓  ↘';
    container.appendChild(arrow1);

    // Internal
    const intLevel = document.createElement('div');
    intLevel.className = 'btree-level';
    btreeData.internal.forEach((node, ni) => {
      const nodeEl = document.createElement('div');
      nodeEl.className = 'btree-node' + (highlightPath && highlightPath.includes(`int-${ni}`) ? ' highlight' : '');
      node.forEach(k => {
        const key = document.createElement('span');
        key.className = 'btree-key' + (highlightPath && highlightPath.includes(`int-${ni}-${k}`) ? ' active' : '') + (k === foundVal ? ' found-key' : '');
        key.textContent = k;
        nodeEl.appendChild(key);
      });
      intLevel.appendChild(nodeEl);
    });
    container.appendChild(intLevel);

    // Arrow
    const arrow2 = document.createElement('div');
    arrow2.className = 'btree-arrow';
    arrow2.textContent = '↓ ↓ ↓   ↓ ↓ ↓   ↓ ↓ ↓';
    container.appendChild(arrow2);

    // Leaves with linked list
    const leafLevel = document.createElement('div');
    leafLevel.className = 'btree-level btree-leaf-chain';
    btreeData.leaves.forEach((leaf, li) => {
      if (li > 0) {
        const la = document.createElement('span');
        la.className = 'btree-leaf-arrow';
        la.textContent = '→';
        leafLevel.appendChild(la);
      }
      const nodeEl = document.createElement('div');
      nodeEl.className = 'btree-node' + (highlightPath && highlightPath.includes(`leaf-${li}`) ? ' highlight' : '') + (highlightPath && highlightPath.includes(`leaf-${li}-found`) ? ' found' : '');
      leaf.forEach(k => {
        const key = document.createElement('span');
        key.className = 'btree-key' + (k === foundVal ? ' found-key' : '');
        key.textContent = k;
        nodeEl.appendChild(key);
      });
      leafLevel.appendChild(nodeEl);
    });
    container.appendChild(leafLevel);
    btreeDemo.appendChild(container);
  }

  function searchBTree(val) {
    const path = ['root'];
    let intIdx = 0;
    if (val <= btreeData.root[0]) { intIdx = 0; path.push(`root-${btreeData.root[0]}`); }
    else if (val <= btreeData.root[1]) { intIdx = 1; path.push(`root-${btreeData.root[1]}`); }
    else { intIdx = 2; path.push(`root-${btreeData.root[1]}`); }
    path.push(`int-${intIdx}`);
    const intNode = btreeData.internal[intIdx];
    let leafIdx = intIdx * 3;
    if (val <= intNode[0]) { leafIdx = intIdx * 3; path.push(`int-${intIdx}-${intNode[0]}`); }
    else if (val <= intNode[1]) { leafIdx = intIdx * 3 + 1; path.push(`int-${intIdx}-${intNode[1]}`); }
    else { leafIdx = intIdx * 3 + 2; path.push(`int-${intIdx}-${intNode[1]}`); }
    if (leafIdx >= btreeData.leaves.length) leafIdx = btreeData.leaves.length - 1;
    path.push(`leaf-${leafIdx}`);
    const found = btreeData.leaves[leafIdx].includes(val);
    if (found) path.push(`leaf-${leafIdx}-found`);
    return { path, found, leafIdx };
  }

  if (btnBtreeSearch) btnBtreeSearch.addEventListener('click', () => {
    const val = parseInt(btreeInput?.value);
    if (!val || val < 1 || val > 99) { if (btreeResult) btreeResult.innerHTML = '<span style="color:var(--accent-yellow)">Enter a value 1-99</span>'; return; }
    // Animate search
    const { path, found, leafIdx } = searchBTree(val);
    renderBTree([], null);
    setTimeout(() => renderBTree(['root', ...path.filter(p => p.startsWith('root'))], null), 300);
    setTimeout(() => renderBTree(path.filter(p => !p.startsWith('leaf')), null), 700);
    setTimeout(() => {
      renderBTree(path, found ? val : null);
      if (btreeResult) btreeResult.innerHTML = found
        ? `<span style="color:var(--accent-green)">✅ Found ${val} in leaf node ${leafIdx}. Path: Root → Internal → Leaf (${path.length - 1} comparisons)</span>`
        : `<span style="color:var(--accent-red)">❌ Value ${val} not found. Searched to leaf node ${leafIdx}.</span>`;
    }, 1100);
  });

  if (btnBtreeInsert) btnBtreeInsert.addEventListener('click', () => {
    const val = parseInt(btreeInput?.value);
    if (!val || val < 1 || val > 99) { if (btreeResult) btreeResult.innerHTML = '<span style="color:var(--accent-yellow)">Enter a value 1-99</span>'; return; }
    const { path, found, leafIdx } = searchBTree(val);
    if (found) { if (btreeResult) btreeResult.innerHTML = `<span style="color:var(--accent-yellow)">⚠ Value ${val} already exists</span>`; return; }
    btreeData.leaves[leafIdx].push(val);
    btreeData.leaves[leafIdx].sort((a, b) => a - b);
    renderBTree([...path, `leaf-${leafIdx}-found`], val);
    if (btreeResult) btreeResult.innerHTML = `<span style="color:var(--accent-green)">+ Inserted ${val} into leaf node ${leafIdx}</span>`;
  });

  renderBTree([], null);

  /* ──────────────────────────────────────────────
     3. HASH INDEX
     ────────────────────────────────────────────── */
  const hashDemo = document.getElementById('hash-demo');
  const hashResult = document.getElementById('hash-result');
  const hashInput = document.getElementById('hash-input');
  const btnHashLookup = document.getElementById('btn-hash-lookup');

  const NUM_BUCKETS = 8;
  const hashStore = {};

  function simpleHash(str) {
    let h = 0;
    for (let i = 0; i < str.length; i++) h = ((h << 5) - h + str.charCodeAt(i)) | 0;
    return Math.abs(h) % NUM_BUCKETS;
  }

  function renderHash(key, targetBucket, stage) {
    if (!hashDemo) return;
    hashDemo.innerHTML = '';

    if (key) {
      const pipe = document.createElement('div');
      pipe.className = 'hash-pipeline';
      const nodes = [
        { name: `Key\n"${key}"`, cls: stage >= 1 ? 'active' : '' },
        { name: `hash()\n→ ${targetBucket !== null ? targetBucket : '?'}`, cls: stage >= 2 ? 'active' : '' },
        { name: `Bucket[${targetBucket !== null ? targetBucket : '?'}]`, cls: stage >= 3 ? 'done' : '' },
      ];
      nodes.forEach((n, i) => {
        if (i > 0) { const a = document.createElement('span'); a.className = 'hash-arrow'; a.textContent = '→'; pipe.appendChild(a); }
        const el = document.createElement('div');
        el.className = `hash-node ${n.cls}`;
        el.textContent = n.name;
        el.style.whiteSpace = 'pre-line';
        pipe.appendChild(el);
      });
      hashDemo.appendChild(pipe);
    }

    // Buckets
    const buckets = document.createElement('div');
    buckets.className = 'hash-buckets';
    for (let i = 0; i < NUM_BUCKETS; i++) {
      const b = document.createElement('div');
      b.className = 'hash-bucket' + (i === targetBucket && stage >= 3 ? ' target' : '') + (hashStore[i] ? ' occupied' : '');
      b.innerHTML = `<div style="font-size:0.5rem;color:var(--text-muted)">B${i}</div>${hashStore[i] ? hashStore[i].join(', ') : '—'}`;
      buckets.appendChild(b);
    }
    hashDemo.appendChild(buckets);
  }

  if (btnHashLookup) btnHashLookup.addEventListener('click', () => {
    const key = hashInput?.value?.trim() || 'user_42';
    const bucket = simpleHash(key);
    if (!hashStore[bucket]) hashStore[bucket] = [];
    if (!hashStore[bucket].includes(key)) hashStore[bucket].push(key);

    renderHash(key, null, 1);
    setTimeout(() => renderHash(key, bucket, 2), 400);
    setTimeout(() => {
      renderHash(key, bucket, 3);
      if (hashResult) hashResult.innerHTML = `<span style="color:var(--accent-green)">hash("${key}") = ${bucket} → Found in Bucket[${bucket}] in O(1)!</span>`;
    }, 800);
  });

  renderHash(null, null, 0);

  /* ──────────────────────────────────────────────
     4. CLUSTERED vs NON-CLUSTERED
     ────────────────────────────────────────────── */
  const clusterDemo = document.getElementById('cluster-demo');
  const clusterResult = document.getElementById('cluster-result');
  const clusterToggle = document.getElementById('cluster-toggle');
  const btnClusterSearch = document.getElementById('btn-cluster-search');
  let clusterType = 'clustered';

  const CL_DATA = [
    { id: 1, name: 'Alice', age: 28 }, { id: 2, name: 'Bob', age: 35 },
    { id: 3, name: 'Carol', age: 22 }, { id: 4, name: 'Dave', age: 41 },
    { id: 5, name: 'Eve', age: 30 }, { id: 6, name: 'Frank', age: 19 },
    { id: 7, name: 'Grace', age: 33 }, { id: 8, name: 'Hank', age: 26 },
  ];
  const CL_SHUFFLED = [3, 7, 1, 5, 8, 2, 6, 4]; // heap order

  if (clusterToggle) clusterToggle.querySelectorAll('.toggle-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      clusterToggle.querySelectorAll('.toggle-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      clusterType = btn.dataset.type;
      renderCluster([], null);
    });
  });

  function renderCluster(highlights, foundId) {
    if (!clusterDemo) return;
    clusterDemo.innerHTML = '';
    const layout = document.createElement('div');
    layout.className = 'cluster-layout';

    // Index column
    const idxCol = document.createElement('div');
    const idxLabel = document.createElement('div');
    idxLabel.className = 'cluster-col-label';
    idxLabel.textContent = clusterType === 'clustered' ? '📁 Clustered Index (= Table)' : '📋 Non-Clustered Index';
    idxCol.appendChild(idxLabel);
    const idxRows = document.createElement('div');
    idxRows.className = 'cluster-rows';
    CL_DATA.forEach(d => {
      const row = document.createElement('div');
      row.className = 'cluster-row' + (highlights.includes(`idx-${d.id}`) ? ' highlight' : '') + (d.id === foundId ? ' found' : '');
      if (clusterType === 'clustered') {
        row.innerHTML = `<span class="row-id">id=${d.id}</span><span class="row-data">${d.name}, age=${d.age}</span>`;
      } else {
        row.innerHTML = `<span class="row-id">id=${d.id}</span><span class="cluster-pointer">→ heap[${CL_SHUFFLED.indexOf(d.id)}]</span>`;
      }
      idxRows.appendChild(row);
    });
    idxCol.appendChild(idxRows);
    layout.appendChild(idxCol);

    // Data / Heap column
    if (clusterType === 'nonclustered') {
      const heapCol = document.createElement('div');
      const heapLabel = document.createElement('div');
      heapLabel.className = 'cluster-col-label';
      heapLabel.textContent = '💾 Heap (Physical Rows)';
      heapCol.appendChild(heapLabel);
      const heapRows = document.createElement('div');
      heapRows.className = 'cluster-rows';
      CL_SHUFFLED.forEach((id, i) => {
        const d = CL_DATA.find(r => r.id === id);
        const row = document.createElement('div');
        row.className = 'cluster-row' + (highlights.includes(`heap-${id}`) ? ' highlight' : '') + (id === foundId ? ' found' : '');
        row.innerHTML = `<span style="color:var(--text-muted);min-width:40px;">heap[${i}]</span><span class="row-data">id=${d.id}, ${d.name}, age=${d.age}</span>`;
        heapRows.appendChild(row);
      });
      heapCol.appendChild(heapRows);
      layout.appendChild(heapCol);
    }
    clusterDemo.appendChild(layout);
  }

  if (btnClusterSearch) btnClusterSearch.addEventListener('click', () => {
    renderCluster([], null);
    if (clusterResult) clusterResult.textContent = '';
    setTimeout(() => renderCluster(['idx-7'], null), 300);
    setTimeout(() => {
      if (clusterType === 'clustered') {
        renderCluster(['idx-7'], 7);
        if (clusterResult) clusterResult.innerHTML = '<span style="color:var(--accent-green)">✅ Clustered: Found id=7 directly — data IS the index. 1 lookup, sequential I/O.</span>';
      } else {
        renderCluster(['idx-7', 'heap-7'], null);
        setTimeout(() => {
          renderCluster(['idx-7', 'heap-7'], 7);
          if (clusterResult) clusterResult.innerHTML = '<span style="color:var(--accent-yellow)">⚠ Non-Clustered: Index → pointer → heap lookup. <strong>2 lookups</strong>, random I/O to fetch row.</span>';
        }, 400);
      }
    }, 700);
  });

  renderCluster([], null);

  /* ──────────────────────────────────────────────
     5. COMPOSITE INDEX
     ────────────────────────────────────────────── */
  const compositeDemo = document.getElementById('composite-demo');
  const compositeResult = document.getElementById('composite-result');

  const COMP_DATA = [
    { last: 'Adams', first: 'Amy', age: 25 },
    { last: 'Adams', first: 'Brian', age: 30 },
    { last: 'Johnson', first: 'Carol', age: 28 },
    { last: 'Johnson', first: 'Dave', age: 35 },
    { last: 'Smith', first: 'Eve', age: 22 },
    { last: 'Smith', first: 'John', age: 30 },
    { last: 'Smith', first: 'Kate', age: 28 },
    { last: 'Wilson', first: 'Leo', age: 40 },
  ];

  const COMP_QUERIES = {
    last:      { used: [0], matches: r => r.last === 'Smith', note: '✅ Uses leftmost column (last_name) — full index scan on prefix.', ok: true },
    lastfirst: { used: [0, 1], matches: r => r.last === 'Smith' && r.first === 'John', note: '✅ Uses first 2 columns — narrows to exact match.', ok: true },
    all3:      { used: [0, 1, 2], matches: r => r.last === 'Smith' && r.first === 'John' && r.age === 30, note: '✅ Uses ALL 3 columns — most selective, fastest.', ok: true },
    first:     { used: [], matches: r => r.first === 'John', note: '❌ Skips leftmost column! Cannot use index — falls back to full scan.', ok: false },
    age:       { used: [], matches: r => r.age === 30, note: '❌ Skips leftmost 2 columns! Full table scan required.', ok: false },
    firstage:  { used: [], matches: r => r.first === 'John' && r.age === 30, note: '❌ Neither column is leftmost prefix. Full scan — index is useless here.', ok: false },
  };

  function renderComposite(queryKey) {
    if (!compositeDemo) return;
    compositeDemo.innerHTML = '';
    const q = queryKey ? COMP_QUERIES[queryKey] : null;
    const idx = document.createElement('div');
    idx.className = 'composite-index';

    // Header
    const header = document.createElement('div');
    header.className = 'composite-entry';
    ['last_name', 'first_name', 'age'].forEach((c, i) => {
      const col = document.createElement('div');
      col.className = 'composite-col';
      col.style.cssText = 'background: rgba(76,201,240,0.05); color: var(--accent-blue);';
      if (q) col.classList.add(q.used.includes(i) ? 'used' : 'unused');
      col.textContent = c;
      header.appendChild(col);
    });
    idx.appendChild(header);

    COMP_DATA.forEach(d => {
      const entry = document.createElement('div');
      entry.className = 'composite-entry';
      if (q) entry.classList.add(q.matches(d) ? 'matched' : 'skipped');
      [d.last, d.first, d.age].forEach((v, i) => {
        const col = document.createElement('div');
        col.className = 'composite-col';
        if (q) col.classList.add(q.used.includes(i) ? 'used' : 'unused');
        col.textContent = v;
        entry.appendChild(col);
      });
      idx.appendChild(entry);
    });
    compositeDemo.appendChild(idx);
    if (q && compositeResult) {
      compositeResult.innerHTML = `<span style="color:var(${q.ok ? '--accent-green' : '--accent-red'})">${q.note}</span>`;
    }
  }

  document.querySelectorAll('.composite-query').forEach(btn => {
    btn.addEventListener('click', () => renderComposite(btn.dataset.q));
  });
  renderComposite(null);

  /* ──────────────────────────────────────────────
     6. COVERING INDEX
     ────────────────────────────────────────────── */
  const coverDemo = document.getElementById('cover-demo');
  const coverResult = document.getElementById('cover-result');
  const coverToggle = document.getElementById('cover-toggle');
  const btnCoverQuery = document.getElementById('btn-cover-query');
  let coverType = 'regular';

  if (coverToggle) coverToggle.querySelectorAll('.toggle-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      coverToggle.querySelectorAll('.toggle-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      coverType = btn.dataset.type;
    });
  });

  function runCoverQuery() {
    if (!coverDemo) return;
    coverDemo.innerHTML = '';
    if (coverResult) coverResult.textContent = '';

    const pipe = document.createElement('div');
    pipe.className = 'cover-pipeline';
    const steps = coverType === 'regular'
      ? [
          { name: '🔍 Query\nSELECT *', id: 'cv-query' },
          { name: '🌳 Index\n(email)', id: 'cv-index' },
          { name: '💾 Table\n(heap lookup)', id: 'cv-table' },
          { name: '📄 Result', id: 'cv-result-node' },
        ]
      : [
          { name: '🔍 Query\nSELECT name', id: 'cv-query' },
          { name: '🌳 Covering\nIndex (email,name)', id: 'cv-index' },
          { name: '💾 Table\n(SKIPPED!)', id: 'cv-table', skip: true },
          { name: '📄 Result', id: 'cv-result-node' },
        ];

    steps.forEach((s, i) => {
      if (i > 0) { const a = document.createElement('span'); a.className = 'cover-arrow'; a.textContent = s.skip ? '✕' : '→'; pipe.appendChild(a); }
      const el = document.createElement('div');
      el.className = 'cover-node';
      el.textContent = s.name;
      el.id = s.id;
      el.style.whiteSpace = 'pre-line';
      pipe.appendChild(el);
    });
    coverDemo.appendChild(pipe);

    setTimeout(() => { const el = document.getElementById('cv-query'); if (el) el.classList.add('active'); }, 200);
    setTimeout(() => {
      const q = document.getElementById('cv-query');
      const idx = document.getElementById('cv-index');
      if (q) { q.classList.remove('active'); q.classList.add('done'); }
      if (idx) idx.classList.add('active');
    }, 600);
    setTimeout(() => {
      const idx = document.getElementById('cv-index');
      const tbl = document.getElementById('cv-table');
      if (idx) { idx.classList.remove('active'); idx.classList.add('done'); }
      if (coverType === 'covering') {
        if (tbl) tbl.classList.add('skipped');
      } else {
        if (tbl) tbl.classList.add('active');
      }
    }, 1000);
    setTimeout(() => {
      const tbl = document.getElementById('cv-table');
      const res = document.getElementById('cv-result-node');
      if (tbl && coverType === 'regular') { tbl.classList.remove('active'); tbl.classList.add('done'); }
      if (res) res.classList.add('done');
      if (coverResult) {
        coverResult.innerHTML = coverType === 'covering'
          ? '<span style="color:var(--accent-green)">✅ INDEX-ONLY SCAN — all columns in the index. No table lookup needed!</span>'
          : '<span style="color:var(--accent-yellow)">⚠ INDEX SCAN + TABLE LOOKUP — must fetch full row from heap (extra I/O).</span>';
      }
    }, 1400);
  }

  if (btnCoverQuery) btnCoverQuery.addEventListener('click', runCoverQuery);

  /* ──────────────────────────────────────────────
     7. EXPLAIN / QUERY PLAN
     ────────────────────────────────────────────── */
  const explainDemo = document.getElementById('explain-demo');

  const PLANS = {
    seqscan: {
      query: "SELECT * FROM users WHERE status = 'active'",
      steps: [
        { icon: '🔴', type: 'Seq Scan', detail: 'on users (no index on status)', cost: 'Cost: 0..1500', cls: 'bad' },
        { icon: '🔍', type: 'Filter', detail: "status = 'active'", cost: 'Rows: 500/10000', cls: 'bad' },
      ],
      summary: '⚠ Full table scan — consider adding INDEX on status column!'
    },
    indexscan: {
      query: 'SELECT * FROM users WHERE id = 42',
      steps: [
        { icon: '🟢', type: 'Index Scan', detail: 'using PRIMARY KEY on users', cost: 'Cost: 0..8', cls: 'good' },
        { icon: '🎯', type: 'Index Cond', detail: 'id = 42', cost: 'Rows: 1', cls: 'good' },
      ],
      summary: '✅ Primary key lookup — optimal! O(log n) via B-Tree.'
    },
    indexonly: {
      query: "SELECT name FROM users WHERE email = 'a@b.com'",
      steps: [
        { icon: '🔵', type: 'Index Only Scan', detail: 'using idx_email_name (covering)', cost: 'Cost: 0..4', cls: 'great' },
        { icon: '🎯', type: 'Index Cond', detail: "email = 'a@b.com'", cost: 'Rows: 1', cls: 'great' },
      ],
      summary: '🏆 Index-only scan — no table access needed! Fastest possible.'
    },
    bitmap: {
      query: "SELECT * FROM orders WHERE total > 100 AND date > '2024-01'",
      steps: [
        { icon: '🟡', type: 'Bitmap Heap Scan', detail: 'on orders', cost: 'Cost: 50..200', cls: 'good' },
        { icon: '→', type: 'BitmapAnd', detail: 'combine 2 indexes', cost: '', cls: 'good' },
        { icon: '🌳', type: 'Bitmap Index Scan', detail: 'idx_total (total > 100)', cost: 'Rows: 2000', cls: 'good' },
        { icon: '🌳', type: 'Bitmap Index Scan', detail: "idx_date (date > '2024-01')", cost: 'Rows: 3000', cls: 'good' },
      ],
      summary: '✅ Bitmap scan — combines multiple indexes via bitmap AND. Good for multi-column filters.'
    }
  };

  document.querySelectorAll('.explain-query').forEach(btn => {
    btn.addEventListener('click', () => {
      const plan = PLANS[btn.dataset.plan];
      if (!plan || !explainDemo) return;
      explainDemo.innerHTML = '';

      // Query
      const queryEl = document.createElement('div');
      queryEl.style.cssText = 'font-family: var(--font-mono); font-size: 0.78rem; color: var(--accent-blue); margin-bottom: 1rem; padding: 8px 12px; border-radius: 5px; background: rgba(76,201,240,0.06); border: 1px solid rgba(76,201,240,0.15);';
      queryEl.textContent = `EXPLAIN ${plan.query}`;
      explainDemo.appendChild(queryEl);

      const planEl = document.createElement('div');
      planEl.className = 'explain-plan';
      explainDemo.appendChild(planEl);

      plan.steps.forEach((s, i) => {
        setTimeout(() => {
          const step = document.createElement('div');
          step.className = `explain-step ${s.cls}`;
          step.innerHTML = `<span class="explain-icon">${s.icon}</span><span class="explain-type">${s.type}</span><span class="explain-detail">${s.detail}</span><span class="explain-cost">${s.cost}</span>`;
          planEl.appendChild(step);

          if (i === plan.steps.length - 1) {
            setTimeout(() => {
              const sum = document.createElement('div');
              sum.style.cssText = 'font-family: var(--font-mono); font-size: 0.82rem; font-weight: 700; text-align: center; margin-top: 1rem;';
              sum.innerHTML = plan.summary;
              explainDemo.appendChild(sum);
            }, 300);
          }
        }, i * 300);
      });
    });
  });

  /* ──────────────────────────────────────────────
     8. SELECTIVITY & CARDINALITY
     ────────────────────────────────────────────── */
  const selDemo = document.getElementById('selectivity-demo');
  const btnSelShow = document.getElementById('btn-sel-show');

  const SEL_DATA = [
    { col: 'email', unique: 10000, total: 10000, color: 'var(--accent-green)', verdict: '🏆 Perfect' },
    { col: 'user_id', unique: 10000, total: 10000, color: 'var(--accent-green)', verdict: '🏆 Perfect' },
    { col: 'city', unique: 500, total: 10000, color: 'var(--accent-blue)', verdict: '✅ Good' },
    { col: 'country', unique: 50, total: 10000, color: 'var(--accent-yellow)', verdict: '⚠ Moderate' },
    { col: 'status', unique: 5, total: 10000, color: 'var(--accent-orange)', verdict: '⚠ Low' },
    { col: 'gender', unique: 2, total: 10000, color: 'var(--accent-red)', verdict: '❌ Terrible' },
    { col: 'is_active', unique: 2, total: 10000, color: 'var(--accent-red)', verdict: '❌ Terrible' },
  ];

  if (btnSelShow) btnSelShow.addEventListener('click', () => {
    if (!selDemo) return;
    selDemo.innerHTML = '';
    const bars = document.createElement('div');
    bars.className = 'sel-bars';

    SEL_DATA.forEach((d, i) => {
      setTimeout(() => {
        const row = document.createElement('div');
        row.className = 'sel-bar-row';
        const label = document.createElement('span');
        label.className = 'sel-label';
        label.textContent = d.col;
        const barContainer = document.createElement('div');
        barContainer.className = 'sel-bar-container';
        const bar = document.createElement('div');
        bar.className = 'sel-bar';
        bar.style.background = d.color;
        bar.style.width = '0%';
        const pct = (d.unique / d.total * 100);
        setTimeout(() => { bar.style.width = Math.max(pct, 3) + '%'; }, 50);
        bar.textContent = `${d.unique}/${d.total}`;
        barContainer.appendChild(bar);
        const verdict = document.createElement('span');
        verdict.className = 'sel-verdict';
        verdict.style.color = d.color;
        verdict.textContent = d.verdict;
        row.appendChild(label);
        row.appendChild(barContainer);
        row.appendChild(verdict);
        bars.appendChild(row);
      }, i * 150);
    });
    selDemo.appendChild(bars);
  });

  /* ──────────────────────────────────────────────
     9. WRITE PENALTY
     ────────────────────────────────────────────── */
  const writeDemo = document.getElementById('write-demo');
  const writeResult = document.getElementById('write-result');
  const btnWrite0 = document.getElementById('btn-write-zero');
  const btnWrite3 = document.getElementById('btn-write-three');
  const btnWrite5 = document.getElementById('btn-write-five');

  function runWriteDemo(numIndexes) {
    if (!writeDemo) return;
    writeDemo.innerHTML = '';
    if (writeResult) writeResult.textContent = '';
    const steps = document.createElement('div');
    steps.className = 'write-steps';
    writeDemo.appendChild(steps);

    const ops = [{ name: '✅ Write row to table (heap)', cls: 'table-op' }];
    const indexNames = ['idx_email', 'idx_name', 'idx_city', 'idx_status', 'idx_date'];
    for (let i = 0; i < numIndexes; i++) {
      ops.push({ name: `🌳 Update B-Tree: ${indexNames[i]}`, cls: 'index-op' });
    }

    ops.forEach((op, i) => {
      setTimeout(() => {
        const step = document.createElement('div');
        step.className = `write-step ${op.cls}`;
        step.textContent = op.name;
        steps.appendChild(step);

        if (i === ops.length - 1) {
          const factor = 1 + numIndexes;
          if (writeResult) writeResult.innerHTML = `<span style="color:${numIndexes > 3 ? 'var(--accent-red)' : numIndexes > 0 ? 'var(--accent-yellow)' : 'var(--accent-green)'}">Write amplification: ${factor}x (1 table + ${numIndexes} index writes). ${numIndexes >= 5 ? '⚠ Every INSERT does 6 writes!' : ''}</span>`;
        }
      }, i * 250);
    });
  }

  if (btnWrite0) btnWrite0.addEventListener('click', () => runWriteDemo(0));
  if (btnWrite3) btnWrite3.addEventListener('click', () => runWriteDemo(3));
  if (btnWrite5) btnWrite5.addEventListener('click', () => runWriteDemo(5));

  /* ──────────────────────────────────────────────
     10. WHEN NOT TO INDEX (ANTIPATTERNS)
     ────────────────────────────────────────────── */
  const apDemo = document.getElementById('antipattern-demo');
  const apResult = document.getElementById('antipattern-result');

  const AP_CONDITIONS = [
    { label: 'Table has < 1000 rows', weight: -3, id: 'ap-small' },
    { label: 'Column has low cardinality (e.g., boolean)', weight: -2, id: 'ap-lowcard' },
    { label: 'Table is write-heavy (> 80% writes)', weight: -3, id: 'ap-writes' },
    { label: 'Column is rarely used in WHERE/JOIN', weight: -2, id: 'ap-rare' },
    { label: 'Column is frequently updated', weight: -2, id: 'ap-updated' },
    { label: 'Query uses functions on column (WHERE YEAR(date))', weight: -1, id: 'ap-function' },
  ];

  let apState = {};
  AP_CONDITIONS.forEach(c => { apState[c.id] = false; });

  function renderAntipatterns() {
    if (!apDemo) return;
    apDemo.innerHTML = '';
    const checks = document.createElement('div');
    checks.className = 'antipattern-checks';

    AP_CONDITIONS.forEach(c => {
      const check = document.createElement('div');
      check.className = 'ap-check' + (apState[c.id] ? ' on' : '');
      check.innerHTML = `<div class="ap-toggle"></div><span class="ap-label">${c.label}</span><span class="ap-score">${c.weight} pts</span>`;
      check.addEventListener('click', () => {
        apState[c.id] = !apState[c.id];
        renderAntipatterns();
      });
      checks.appendChild(check);
    });
    apDemo.appendChild(checks);

    // Score
    let score = 10; // start at "should index"
    AP_CONDITIONS.forEach(c => { if (apState[c.id]) score += c.weight; });
    score = Math.max(0, Math.min(10, score));

    if (apResult) {
      if (score >= 7) apResult.innerHTML = '<span style="color:var(--accent-green)">✅ GO — Index would likely help. High selectivity + read-heavy workload.</span>';
      else if (score >= 4) apResult.innerHTML = '<span style="color:var(--accent-yellow)">⚠ MAYBE — Some concerns. Benchmark before adding. Consider partial or covering index.</span>';
      else apResult.innerHTML = '<span style="color:var(--accent-red)">❌ SKIP — Index would hurt more than help. Too many negatives for this column.</span>';
    }
  }
  renderAntipatterns();

});
