/* ═══════════════════════════════════════════════════════
   POSTGRESQL INTERNALS VISUALIZER — Interactive Logic
   Part 1: Core + Sections 1-8
   ═══════════════════════════════════════════════════════ */
;(function () {
  'use strict';

  // ── Scroll Reveal ──
  const revealObs = new IntersectionObserver((entries) => {
    entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('visible'); revealObs.unobserve(e.target); }});
  }, { threshold: 0.1 });
  document.querySelectorAll('.reveal').forEach(s => revealObs.observe(s));

  // ── TOC Active State ──
  const tocLinks = document.querySelectorAll('.toc__link');
  const tocObs = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        tocLinks.forEach(l => l.classList.remove('active'));
        const link = document.querySelector(`.toc__link[data-section="${e.target.id}"]`);
        if (link) link.classList.add('active');
      }
    });
  }, { threshold: 0.3 });
  document.querySelectorAll('.section').forEach(s => tocObs.observe(s));

  // ════════════════════════════════════════════
  // 2. PROCESS MODEL
  // ════════════════════════════════════════════
  let backendCount = 0;
  const procConnArea = document.getElementById('proc-conn-area');
  const procCounter = document.getElementById('proc-counter');
  const btnSpawn = document.getElementById('btn-spawn-conn');
  const btnKillConn = document.getElementById('btn-kill-conn');
  const btnResetProcs = document.getElementById('btn-reset-procs');

  function addBackend() {
    if (backendCount >= 12) return;
    backendCount++;
    const el = document.createElement('div');
    el.className = 'proc-node proc-conn';
    el.innerHTML = `<span class="proc-icon">👤</span><span class="proc-name">Backend ${backendCount}</span>`;
    procConnArea.appendChild(el);
    procCounter.textContent = `Active Backends: ${backendCount}`;
  }
  function removeBackend() {
    if (!procConnArea.lastChild) return;
    const el = procConnArea.lastChild;
    el.style.animation = 'fadeOutDown .3s ease forwards';
    setTimeout(() => { el.remove(); backendCount--; procCounter.textContent = `Active Backends: ${backendCount}`; }, 300);
  }
  if (btnSpawn) btnSpawn.addEventListener('click', addBackend);
  if (btnKillConn) btnKillConn.addEventListener('click', removeBackend);
  if (btnResetProcs) btnResetProcs.addEventListener('click', () => {
    procConnArea.innerHTML = ''; backendCount = 0; procCounter.textContent = 'Active Backends: 0';
  });

  // ════════════════════════════════════════════
  // 3. BUFFER POOL
  // ════════════════════════════════════════════
  const BUFFER_SIZE = 8;
  const DISK_PAGES = 16;
  let buffers = Array(BUFFER_SIZE).fill(null);
  let bufDirty = Array(BUFFER_SIZE).fill(false);
  let hits = 0, misses = 0, clockHand = 0;

  function renderBufferPool() {
    const pool = document.getElementById('buf-pool');
    if (!pool) return;
    pool.innerHTML = '';
    buffers.forEach((page, i) => {
      const slot = document.createElement('div');
      slot.className = 'buf-slot' + (page !== null ? ' occupied' : '') + (bufDirty[i] ? ' dirty' : '');
      slot.innerHTML = `<div class="buf-slot__label">Slot ${i}</div><div class="buf-slot__page">${page !== null ? 'Page ' + page : '—'}</div>${bufDirty[i] ? '<div class="buf-slot__dirty">●dirty</div>' : ''}`;
      pool.appendChild(slot);
    });
    const dp = document.getElementById('buf-disk-pages');
    if (dp) {
      dp.innerHTML = '';
      for (let i = 0; i < DISK_PAGES; i++) {
        const p = document.createElement('div');
        p.className = 'buf-page';
        p.textContent = 'P' + i;
        dp.appendChild(p);
      }
    }
    updateBufStats();
  }
  function updateBufStats() {
    const el = (id) => document.getElementById(id);
    if (el('buf-hits')) el('buf-hits').textContent = hits;
    if (el('buf-misses')) el('buf-misses').textContent = misses;
    if (el('buf-ratio')) el('buf-ratio').textContent = (hits + misses) > 0 ? ((hits / (hits + misses)) * 100).toFixed(1) + '%' : '—';
    if (el('buf-dirty')) el('buf-dirty').textContent = bufDirty.filter(Boolean).length;
  }
  function bufferRead() {
    const pageId = Math.floor(Math.random() * DISK_PAGES);
    const idx = buffers.indexOf(pageId);
    if (idx >= 0) {
      hits++;
      const slots = document.querySelectorAll('.buf-slot');
      if (slots[idx]) { slots[idx].classList.add('hit'); setTimeout(() => slots[idx].classList.remove('hit'), 500); }
    } else {
      misses++;
      let slot = buffers.indexOf(null);
      if (slot < 0) { slot = clockHand % BUFFER_SIZE; clockHand++; }
      buffers[slot] = pageId;
      bufDirty[slot] = false;
      renderBufferPool();
      const slots = document.querySelectorAll('.buf-slot');
      if (slots[slot]) { slots[slot].classList.add('miss'); setTimeout(() => slots[slot].classList.remove('miss'), 500); }
    }
    updateBufStats();
  }
  function bufferWrite() {
    const pageId = Math.floor(Math.random() * DISK_PAGES);
    let idx = buffers.indexOf(pageId);
    if (idx < 0) { idx = buffers.indexOf(null); if (idx < 0) { idx = clockHand % BUFFER_SIZE; clockHand++; } buffers[idx] = pageId; misses++; } else { hits++; }
    bufDirty[idx] = true;
    renderBufferPool();
  }
  function flushDirty() {
    bufDirty = bufDirty.map(() => false);
    renderBufferPool();
  }
  const btnBufRead = document.getElementById('btn-buf-read');
  const btnBufWrite = document.getElementById('btn-buf-write');
  const btnBufFlush = document.getElementById('btn-buf-flush');
  if (btnBufRead) btnBufRead.addEventListener('click', bufferRead);
  if (btnBufWrite) btnBufWrite.addEventListener('click', bufferWrite);
  if (btnBufFlush) btnBufFlush.addEventListener('click', flushDirty);
  renderBufferPool();

  // ════════════════════════════════════════════
  // 4. QUERY EXECUTION PIPELINE
  // ════════════════════════════════════════════
  const stages = ['parse', 'analyze', 'rewrite', 'plan', 'execute'];
  const stageDetails = {
    parse: '📝 Tokenizing SQL → building raw parse tree. Checking syntax...',
    analyze: '🔍 Resolving table "users", checking column "age" exists, validating types...',
    rewrite: '🔄 Applying view definitions and row-level security policies...',
    plan: '🗺️ Estimating costs: SeqScan cost=0..25, IndexScan cost=0..8. Choosing IndexScan + Sort.',
    execute: '⚡ Running IndexScan on idx_users_age → Sort → returning 42 rows in 2.3ms.'
  };
  const btnRunQuery = document.getElementById('btn-run-query');
  const qpDetail = document.getElementById('qp-detail');
  if (btnRunQuery) {
    btnRunQuery.addEventListener('click', () => {
      const allStages = document.querySelectorAll('.qp-stage');
      allStages.forEach(s => { s.classList.remove('active', 'done'); s.style.opacity = '.5'; });
      if (qpDetail) qpDetail.textContent = '';
      let i = 0;
      const iv = setInterval(() => {
        if (i > 0) { const prev = document.querySelector(`.qp-stage[data-stage="${stages[i-1]}"]`); if (prev) { prev.classList.remove('active'); prev.classList.add('done'); prev.style.opacity = '1'; }}
        if (i >= stages.length) { clearInterval(iv); if (qpDetail) qpDetail.innerHTML = '<span style="color:var(--accent-teal);font-weight:700;">✅ Query complete! 42 rows returned in 2.3ms</span>'; return; }
        const cur = document.querySelector(`.qp-stage[data-stage="${stages[i]}"]`);
        if (cur) { cur.classList.add('active'); cur.style.opacity = '1'; }
        if (qpDetail) qpDetail.textContent = stageDetails[stages[i]];
        i++;
      }, 800);
    });
  }

  // ════════════════════════════════════════════
  // 5. MVCC
  // ════════════════════════════════════════════
  let txnId = 100;
  let mvccRows = [];
  const mvccRowsEl = document.getElementById('mvcc-rows');
  const mvccTxnInfo = document.getElementById('mvcc-txn-info');

  function renderMvcc() {
    if (!mvccRowsEl) return;
    mvccRowsEl.innerHTML = '';
    mvccRows.forEach(r => {
      const row = document.createElement('div');
      row.className = 'mvcc-row' + (r.dead ? ' dead' : '') + (r.isNew ? ' new' : '');
      row.innerHTML = `<span class="mvcc-col">${r.xmin}</span><span class="mvcc-col">${r.xmax || '—'}</span><span>${r.name}</span><span>${r.email}</span><span>${r.status}</span>`;
      mvccRowsEl.appendChild(row);
    });
    if (mvccTxnInfo) mvccTxnInfo.innerHTML = `Current Transaction ID: <strong>${txnId}</strong>`;
  }

  const btnMvccInsert = document.getElementById('btn-mvcc-insert');
  const btnMvccUpdate = document.getElementById('btn-mvcc-update');
  const btnMvccDelete = document.getElementById('btn-mvcc-delete');
  const btnMvccReset = document.getElementById('btn-mvcc-reset');

  if (btnMvccInsert) btnMvccInsert.addEventListener('click', () => {
    const names = ['Alice', 'Bob', 'Charlie', 'Diana', 'Eve'];
    const n = names[mvccRows.filter(r => !r.dead).length % names.length];
    mvccRows.push({ xmin: txnId, xmax: null, name: n, email: n.toLowerCase() + '@example.com', status: '✅ LIVE', dead: false, isNew: true });
    txnId++;
    renderMvcc();
    setTimeout(() => { mvccRows.forEach(r => r.isNew = false); renderMvcc(); }, 600);
  });

  if (btnMvccUpdate) btnMvccUpdate.addEventListener('click', () => {
    const live = mvccRows.filter(r => !r.dead);
    if (!live.length) return;
    const target = live[live.length - 1];
    target.xmax = txnId;
    target.dead = true;
    target.status = '💀 DEAD';
    mvccRows.push({ xmin: txnId, xmax: null, name: target.name, email: target.name.toLowerCase() + '_v2@example.com', status: '✅ LIVE', dead: false, isNew: true });
    txnId++;
    renderMvcc();
    setTimeout(() => { mvccRows.forEach(r => r.isNew = false); renderMvcc(); }, 600);
  });

  if (btnMvccDelete) btnMvccDelete.addEventListener('click', () => {
    const live = mvccRows.filter(r => !r.dead);
    if (!live.length) return;
    const target = live[live.length - 1];
    target.xmax = txnId;
    target.dead = true;
    target.status = '💀 DEAD';
    txnId++;
    renderMvcc();
  });

  if (btnMvccReset) btnMvccReset.addEventListener('click', () => {
    txnId = 100; mvccRows = []; renderMvcc();
  });

  // Snapshot demo
  const btnSnapT1 = document.getElementById('btn-snap-t1');
  const btnSnapT2 = document.getElementById('btn-snap-t2');
  const btnSnapReset = document.getElementById('btn-snap-reset');
  const snapDemo = document.getElementById('snap-demo');
  let snapState = 0;

  function renderSnap() {
    if (!snapDemo) return;
    const scenarios = [
      { html: '<div class="callout">Click "Start Txn T1" to begin the snapshot demonstration.</div>' },
      { html: '<div class="iso-txn" style="flex:1"><div class="iso-txn__title">T1 (xid=200)</div><div class="iso-step highlight">BEGIN; -- Snapshot taken: sees xid < 200</div><div class="iso-step">SELECT balance FROM accounts; → $1000</div></div><div class="callout" style="flex:1">T1 has a snapshot. It can only see transactions committed before xid 200.</div>' },
      { html: '<div class="iso-txn" style="flex:1"><div class="iso-txn__title">T1 (xid=200)</div><div class="iso-step">BEGIN; -- Snapshot: sees xid < 200</div><div class="iso-step highlight">SELECT balance → $1000 (still!)</div></div><div class="iso-txn" style="flex:1"><div class="iso-txn__title">T2 (xid=201)</div><div class="iso-step highlight">UPDATE accounts SET balance = $500; COMMIT;</div></div><div class="callout pg-blue" style="flex-basis:100%"><strong>T1 still sees $1000!</strong> Even though T2 committed, T1\'s snapshot was taken before T2, so the update is invisible to T1. This is MVCC in action.</div>' },
    ];
    snapDemo.innerHTML = scenarios[snapState].html;
  }
  if (btnSnapT1) btnSnapT1.addEventListener('click', () => { snapState = Math.min(1, snapState + 1); renderSnap(); });
  if (btnSnapT2) btnSnapT2.addEventListener('click', () => { snapState = 2; renderSnap(); });
  if (btnSnapReset) btnSnapReset.addEventListener('click', () => { snapState = 0; renderSnap(); });
  renderSnap();

  // ════════════════════════════════════════════
  // 6. WAL
  // ════════════════════════════════════════════
  let walLog = [];
  let walDataWritten = [];
  let walCrashed = false;
  const walBufferContent = document.getElementById('wal-buffer-content');
  const walDiskContent = document.getElementById('wal-disk-content');
  const walDataContent = document.getElementById('wal-data-content');
  const walStatus = document.getElementById('wal-status');
  const btnWalWrite = document.getElementById('btn-wal-write');
  const btnWalCrash = document.getElementById('btn-wal-crash');
  const btnWalRecover = document.getElementById('btn-wal-recover');

  function renderWal() {
    if (walBufferContent) walBufferContent.textContent = walLog.length > 0 ? walLog[walLog.length - 1] : '';
    if (walDiskContent) walDiskContent.innerHTML = walLog.map(l => `<div>${l}</div>`).join('');
    if (walDataContent) walDataContent.innerHTML = walDataWritten.map(d => `<div style="font-size:.72rem">${d}</div>`).join('');
  }

  if (btnWalWrite) btnWalWrite.addEventListener('click', () => {
    if (walCrashed) return;
    const lsn = walLog.length + 1;
    const entry = `LSN ${lsn}: INSERT orders(id=${lsn})`;
    walLog.push(entry);

    // Arrow animation
    const a1 = document.getElementById('wal-arrow-1');
    const a2 = document.getElementById('wal-arrow-2');
    if (a1) a1.classList.add('active');
    setTimeout(() => {
      if (a1) a1.classList.remove('active');
      if (a2) a2.classList.add('active');
      renderWal();
      setTimeout(() => { if (a2) a2.classList.remove('active'); }, 400);
    }, 400);

    // Delayed data file write
    setTimeout(() => {
      walDataWritten.push(`orders(id=${lsn})`);
      renderWal();
    }, 1200);
    if (walStatus) walStatus.innerHTML = `<span style="color:var(--accent-teal)">✅ WAL written first (LSN ${lsn}), data file update follows...</span>`;
  });

  if (btnWalCrash) btnWalCrash.addEventListener('click', () => {
    walCrashed = true;
    walDataWritten = walDataWritten.slice(0, Math.max(0, walDataWritten.length - 2));
    const df = document.querySelector('.wal-data-file');
    if (df) df.classList.add('crashed');
    renderWal();
    if (walStatus) walStatus.innerHTML = '<span style="color:var(--accent-red)">💥 CRASH! Data files may be incomplete. WAL is safe on disk.</span>';
  });

  if (btnWalRecover) btnWalRecover.addEventListener('click', () => {
    if (!walCrashed) return;
    walCrashed = false;
    const df = document.querySelector('.wal-data-file');
    if (df) { df.classList.remove('crashed'); df.classList.add('recovered'); setTimeout(() => df.classList.remove('recovered'), 1500); }
    // Replay WAL
    walDataWritten = walLog.map((_, i) => `orders(id=${i + 1})`);
    renderWal();
    if (walStatus) walStatus.innerHTML = '<span style="color:var(--accent-teal)">🔄 Recovery complete! WAL replayed — all data restored.</span>';
  });
  renderWal();

  // ════════════════════════════════════════════
  // 7. INDEXING — B-Tree + Scan Compare
  // ════════════════════════════════════════════
  let btreeKeys = [];
  const btreeViz = document.getElementById('btree-viz');
  const btreeInput = document.getElementById('btree-input');
  const btnBtreeInsert = document.getElementById('btn-btree-insert');
  const btnBtreeSearch = document.getElementById('btn-btree-search');
  const btnBtreeReset = document.getElementById('btn-btree-reset');
  const btreeHint = document.getElementById('btree-hint');

  function renderBtree(searchKey) {
    if (!btreeViz) return;
    if (btreeKeys.length === 0) { btreeViz.innerHTML = '<div style="color:var(--text-muted);font-style:italic;">Insert keys to build the B-Tree</div>'; return; }
    const sorted = [...btreeKeys].sort((a, b) => a - b);
    // Simple 2-level visualization
    const perNode = 3;
    const leaves = [];
    for (let i = 0; i < sorted.length; i += perNode) leaves.push(sorted.slice(i, i + perNode));
    const rootKeys = leaves.slice(1).map(l => l[0]);

    let html = '';
    // Root
    if (rootKeys.length > 0) {
      html += '<div class="btree-level"><div class="btree-node' + (searchKey !== undefined ? ' highlight' : '') + '">';
      rootKeys.forEach(k => { html += `<div class="btree-key${searchKey !== undefined ? ' searched' : ''}">${k}</div>`; });
      html += '</div></div>';
    }
    // Leaves
    html += '<div class="btree-level">';
    leaves.forEach(leaf => {
      html += '<div class="btree-node">';
      leaf.forEach(k => {
        const found = searchKey !== undefined && k === searchKey;
        html += `<div class="btree-key${found ? ' found' : ''}">${k}</div>`;
      });
      html += '</div>';
    });
    html += '</div>';
    btreeViz.innerHTML = html;
  }

  if (btnBtreeInsert) btnBtreeInsert.addEventListener('click', () => {
    const val = parseInt(btreeInput.value);
    if (isNaN(val) || btreeKeys.includes(val)) return;
    btreeKeys.push(val);
    renderBtree();
    if (btreeHint) btreeHint.textContent = `Inserted key ${val}. Total keys: ${btreeKeys.length}`;
  });

  if (btnBtreeSearch) btnBtreeSearch.addEventListener('click', () => {
    const val = parseInt(btreeInput.value);
    renderBtree(val);
    const found = btreeKeys.includes(val);
    if (btreeHint) btreeHint.innerHTML = found ? `<span style="color:var(--accent-teal)">✅ Found key ${val} — traversed root → leaf in O(log n)</span>` : `<span style="color:var(--accent-red)">❌ Key ${val} not found</span>`;
  });

  if (btnBtreeReset) btnBtreeReset.addEventListener('click', () => { btreeKeys = []; renderBtree(); });
  renderBtree();

  // Scan Compare
  const SCAN_ROWS = 20;
  const scanTarget = 7;
  const scanBlocks = document.getElementById('scan-blocks');
  const scanResult = document.getElementById('scan-result');

  function initScanBlocks() {
    if (!scanBlocks) return;
    scanBlocks.innerHTML = '';
    for (let i = 0; i < SCAN_ROWS; i++) {
      const b = document.createElement('div');
      b.className = 'scan-block';
      b.textContent = i;
      b.dataset.id = i;
      scanBlocks.appendChild(b);
    }
  }
  initScanBlocks();

  const btnScanSeq = document.getElementById('btn-scan-seq');
  const btnScanIdx = document.getElementById('btn-scan-idx');

  if (btnScanSeq) btnScanSeq.addEventListener('click', () => {
    initScanBlocks();
    const blocks = document.querySelectorAll('#scan-blocks .scan-block');
    let i = 0;
    const iv = setInterval(() => {
      if (i >= blocks.length) { clearInterval(iv); return; }
      blocks[i].classList.add('scanned');
      if (parseInt(blocks[i].dataset.id) === scanTarget) blocks[i].classList.add('target');
      i++;
    }, 80);
    if (scanResult) scanResult.innerHTML = `<span style="color:var(--accent-red)">Sequential Scan: checked ALL ${SCAN_ROWS} blocks to find row ${scanTarget}</span>`;
  });

  if (btnScanIdx) btnScanIdx.addEventListener('click', () => {
    initScanBlocks();
    const blocks = document.querySelectorAll('#scan-blocks .scan-block');
    setTimeout(() => {
      blocks[scanTarget].classList.add('target');
      if (scanResult) scanResult.innerHTML = `<span style="color:var(--accent-teal)">Index Scan: jumped directly to row ${scanTarget} — 1 block read!</span>`;
    }, 200);
  });

  // ════════════════════════════════════════════
  // 8. VACUUM
  // ════════════════════════════════════════════
  const TOTAL_BLOCKS = 40;
  let vacBlocks = [];
  const vacTable = document.getElementById('vac-table');

  function initVacuum() {
    vacBlocks = [];
    for (let i = 0; i < TOTAL_BLOCKS; i++) vacBlocks.push(i < 20 ? 'live' : 'empty');
    renderVacuum();
  }

  function renderVacuum() {
    if (!vacTable) return;
    vacTable.innerHTML = '';
    vacBlocks.forEach((state, i) => {
      const b = document.createElement('div');
      b.className = 'vac-block ' + (state === 'live' ? 'live' : state === 'dead' ? 'dead' : 'free');
      b.textContent = state === 'live' ? 'L' : state === 'dead' ? 'D' : '·';
      vacTable.appendChild(b);
    });
    const live = vacBlocks.filter(b => b === 'live').length;
    const dead = vacBlocks.filter(b => b === 'dead').length;
    const free = vacBlocks.filter(b => b === 'free').length;
    const used = live + dead;
    const el = (id) => document.getElementById(id);
    if (el('vac-live')) el('vac-live').textContent = live;
    if (el('vac-dead')) el('vac-dead').textContent = dead;
    if (el('vac-free')) el('vac-free').textContent = free;
    if (el('vac-bloat')) el('vac-bloat').textContent = used > 0 ? Math.round((dead / used) * 100) + '%' : '0%';
  }

  const btnVacUpdates = document.getElementById('btn-vac-updates');
  const btnVacVacuum = document.getElementById('btn-vac-vacuum');
  const btnVacFull = document.getElementById('btn-vac-full');
  const btnVacReset = document.getElementById('btn-vac-reset');

  if (btnVacUpdates) btnVacUpdates.addEventListener('click', () => {
    let updated = 0;
    for (let i = 0; i < vacBlocks.length && updated < 10; i++) {
      if (vacBlocks[i] === 'live') { vacBlocks[i] = 'dead'; updated++; }
    }
    // New live tuples go to empty/end
    for (let i = 0; i < vacBlocks.length && updated > 0; i++) {
      if (vacBlocks[i] === 'empty') { vacBlocks[i] = 'live'; updated--; }
    }
    // If no empty space, expand
    while (updated > 0) { vacBlocks.push('live'); updated--; }
    renderVacuum();
  });

  if (btnVacVacuum) btnVacVacuum.addEventListener('click', () => {
    let i = 0;
    const iv = setInterval(() => {
      if (i >= vacBlocks.length) { clearInterval(iv); return; }
      if (vacBlocks[i] === 'dead') {
        vacBlocks[i] = 'free';
        renderVacuum();
        const blocks = vacTable.querySelectorAll('.vac-block');
        if (blocks[i]) blocks[i].classList.add('vacuuming');
      }
      i++;
    }, 60);
  });

  if (btnVacFull) btnVacFull.addEventListener('click', () => {
    vacBlocks = vacBlocks.filter(b => b === 'live');
    while (vacBlocks.length < 20) vacBlocks.push('empty');
    renderVacuum();
  });

  if (btnVacReset) btnVacReset.addEventListener('click', initVacuum);
  initVacuum();

  // ════════════════════════════════════════════
  // 9. ISOLATION LEVELS
  // ════════════════════════════════════════════
  let isoLevel = 'read-committed';
  const isoToggle = document.getElementById('iso-toggle');
  const btnIsoRun = document.getElementById('btn-iso-run');
  const isoT1Steps = document.getElementById('iso-t1-steps');
  const isoT2Steps = document.getElementById('iso-t2-steps');
  const isoResult = document.getElementById('iso-result');

  if (isoToggle) isoToggle.querySelectorAll('.strategy-btn').forEach(b => {
    b.addEventListener('click', () => {
      isoToggle.querySelectorAll('.strategy-btn').forEach(x => x.classList.remove('active'));
      b.classList.add('active');
      isoLevel = b.dataset.level;
    });
  });

  const isoScenarios = {
    'read-committed': {
      t1: ['BEGIN;', 'SELECT balance → $1000', '-- T2 commits here --', 'SELECT balance → $1200 ⚠️', 'COMMIT;'],
      t2: ['', 'BEGIN;', 'UPDATE balance = $1200; COMMIT;', '', ''],
      anomaly: ['', '', '', 'anomaly', ''],
      result: '⚠️ Non-Repeatable Read: T1 sees different value for same query because T2 committed in between.'
    },
    'repeatable-read': {
      t1: ['BEGIN;', 'SELECT balance → $1000', '-- T2 commits here --', 'SELECT balance → $1000 ✅', 'COMMIT;'],
      t2: ['', 'BEGIN;', 'UPDATE balance = $1200; COMMIT;', '', ''],
      anomaly: ['', '', '', 'highlight', ''],
      result: '✅ Prevented: T1 uses snapshot from BEGIN — it always sees $1000 regardless of T2.'
    },
    'serializable': {
      t1: ['BEGIN;', 'SELECT SUM(x) → 100', '-- T2 inserts here --', 'SELECT SUM(x) → 100 ✅', 'COMMIT;'],
      t2: ['', 'BEGIN;', 'INSERT x=50; COMMIT;', '', ''],
      anomaly: ['', '', '', 'highlight', ''],
      result: '✅ Full serialization: T1 sees consistent snapshot. T2\'s insert invisible. If conflict arises, one aborts.'
    }
  };

  if (btnIsoRun) btnIsoRun.addEventListener('click', () => {
    const sc = isoScenarios[isoLevel];
    if (!sc) return;
    if (isoT1Steps) isoT1Steps.innerHTML = '';
    if (isoT2Steps) isoT2Steps.innerHTML = '';
    if (isoResult) isoResult.textContent = '';
    let i = 0;
    const iv = setInterval(() => {
      if (i >= sc.t1.length) { clearInterval(iv); if (isoResult) isoResult.innerHTML = `<span style="color:${sc.anomaly.includes('anomaly') ? 'var(--accent-red)' : 'var(--accent-teal)'}">${sc.result}</span>`; return; }
      if (sc.t1[i] && isoT1Steps) {
        const el = document.createElement('div');
        el.className = 'iso-step' + (sc.anomaly[i] ? ' ' + sc.anomaly[i] : '');
        el.textContent = sc.t1[i];
        isoT1Steps.appendChild(el);
      }
      if (sc.t2[i] && isoT2Steps) {
        const el = document.createElement('div');
        el.className = 'iso-step';
        el.textContent = sc.t2[i];
        isoT2Steps.appendChild(el);
      }
      i++;
    }, 700);
  });

  // ════════════════════════════════════════════
  // 10. LOCKS
  // ════════════════════════════════════════════
  const btnLockDemo = document.getElementById('btn-lock-demo');
  const btnDeadlockDemo = document.getElementById('btn-deadlock-demo');
  const btnLockReset = document.getElementById('btn-lock-reset');
  const lockLog = document.getElementById('lock-log');
  const lockT1Status = document.getElementById('lock-t1-status');
  const lockT2Status = document.getElementById('lock-t2-status');
  const lockR1 = document.getElementById('lock-r1');
  const lockR2 = document.getElementById('lock-r2');
  const lockTxn1El = document.getElementById('lock-txn1');
  const lockTxn2El = document.getElementById('lock-txn2');

  function addLockLog(msg) {
    if (!lockLog) return;
    const el = document.createElement('div');
    el.className = 'lock-log-entry';
    el.textContent = `[${new Date().toLocaleTimeString()}] ${msg}`;
    lockLog.appendChild(el);
    lockLog.scrollTop = lockLog.scrollHeight;
  }

  function resetLocks() {
    if (lockT1Status) lockT1Status.textContent = 'Idle';
    if (lockT2Status) lockT2Status.textContent = 'Idle';
    if (lockR1) lockR1.textContent = '';
    if (lockR2) lockR2.textContent = '';
    if (lockTxn1El) lockTxn1El.className = 'lock-txn';
    if (lockTxn2El) lockTxn2El.className = 'lock-txn';
    if (lockLog) lockLog.innerHTML = '';
  }

  if (btnLockDemo) btnLockDemo.addEventListener('click', () => {
    resetLocks();
    addLockLog('T1: BEGIN');
    setTimeout(() => {
      addLockLog('T1: UPDATE accounts SET balance=900 WHERE id=1 (acquires ROW EXCLUSIVE lock on Row 1)');
      if (lockR1) lockR1.innerHTML = '<span style="color:var(--accent-teal)">🔒 T1</span>';
      if (lockT1Status) lockT1Status.textContent = 'Holding lock on Row 1';
      if (lockTxn1El) lockTxn1El.classList.add('holding');
    }, 500);
    setTimeout(() => {
      addLockLog('T2: BEGIN');
      addLockLog('T2: UPDATE accounts SET balance=400 WHERE id=1 (WAITING for T1 lock...)');
      if (lockT2Status) lockT2Status.textContent = 'WAITING for Row 1...';
      if (lockTxn2El) lockTxn2El.classList.add('waiting');
    }, 1500);
    setTimeout(() => {
      addLockLog('T1: COMMIT (releases lock on Row 1)');
      addLockLog('T2: Acquired lock! Proceeds with UPDATE.');
      if (lockR1) lockR1.innerHTML = '<span style="color:var(--accent-blue)">🔒 T2</span>';
      if (lockT1Status) lockT1Status.textContent = 'Committed';
      if (lockT2Status) lockT2Status.textContent = 'Holding lock on Row 1';
      if (lockTxn1El) lockTxn1El.className = 'lock-txn';
      if (lockTxn2El) { lockTxn2El.classList.remove('waiting'); lockTxn2El.classList.add('holding'); }
    }, 3500);
  });

  if (btnDeadlockDemo) btnDeadlockDemo.addEventListener('click', () => {
    resetLocks();
    addLockLog('T1: BEGIN; T2: BEGIN;');
    setTimeout(() => {
      addLockLog('T1: locks Row 1');
      if (lockR1) lockR1.innerHTML = '<span style="color:var(--accent-teal)">🔒 T1</span>';
      if (lockT1Status) lockT1Status.textContent = 'Holds Row 1';
      if (lockTxn1El) lockTxn1El.classList.add('holding');
    }, 500);
    setTimeout(() => {
      addLockLog('T2: locks Row 2');
      if (lockR2) lockR2.innerHTML = '<span style="color:var(--accent-blue)">🔒 T2</span>';
      if (lockT2Status) lockT2Status.textContent = 'Holds Row 2';
      if (lockTxn2El) lockTxn2El.classList.add('holding');
    }, 1000);
    setTimeout(() => {
      addLockLog('T1: tries to lock Row 2 → WAITING (held by T2)');
      if (lockT1Status) lockT1Status.textContent = 'WAITING for Row 2...';
      if (lockTxn1El) { lockTxn1El.classList.remove('holding'); lockTxn1El.classList.add('waiting'); }
    }, 2000);
    setTimeout(() => {
      addLockLog('T2: tries to lock Row 1 → WAITING (held by T1)');
      addLockLog('💀 DEADLOCK DETECTED! T1 ↔ T2 circular wait');
      if (lockT2Status) lockT2Status.textContent = 'DEADLOCKED!';
      if (lockTxn2El) { lockTxn2El.classList.remove('holding'); lockTxn2El.classList.add('deadlocked'); }
      if (lockTxn1El) { lockTxn1El.classList.remove('waiting'); lockTxn1El.classList.add('deadlocked'); }
    }, 3000);
    setTimeout(() => {
      addLockLog('PostgreSQL aborts T2 → T1 proceeds');
      if (lockT2Status) lockT2Status.textContent = 'ABORTED (victim)';
      if (lockT1Status) lockT1Status.textContent = 'Proceeds with both rows';
      if (lockTxn2El) lockTxn2El.className = 'lock-txn';
      if (lockTxn1El) { lockTxn1El.className = 'lock-txn holding'; }
      if (lockR2) lockR2.innerHTML = '<span style="color:var(--accent-teal)">🔒 T1</span>';
    }, 4500);
  });

  if (btnLockReset) btnLockReset.addEventListener('click', resetLocks);

  // ════════════════════════════════════════════
  // 11. QUERY PLANNER
  // ════════════════════════════════════════════
  const sliderSel = document.getElementById('slider-selectivity');
  const valSel = document.getElementById('val-selectivity');
  const planSeqFill = document.getElementById('plan-seq-fill');
  const planIdxFill = document.getElementById('plan-idx-fill');
  const planBmpFill = document.getElementById('plan-bmp-fill');
  const planSeqCost = document.getElementById('plan-seq-cost');
  const planIdxCost = document.getElementById('plan-idx-cost');
  const planBmpCost = document.getElementById('plan-bmp-cost');
  const plannerWinner = document.getElementById('planner-winner');

  function updatePlanner() {
    const sel = parseInt(sliderSel ? sliderSel.value : 5);
    if (valSel) valSel.textContent = sel + '%';
    const seqCost = 100; // Fixed
    const idxCost = Math.round(sel * 4 + 5); // Grows with selectivity
    const bmpCost = Math.round(sel * 2 + 15);
    const maxCost = 120;
    if (planSeqFill) planSeqFill.style.width = (seqCost / maxCost * 100) + '%';
    if (planIdxFill) planIdxFill.style.width = (idxCost / maxCost * 100) + '%';
    if (planBmpFill) planBmpFill.style.width = (bmpCost / maxCost * 100) + '%';
    if (planSeqCost) planSeqCost.textContent = `Cost: ${seqCost}`;
    if (planIdxCost) planIdxCost.textContent = `Cost: ${idxCost}`;
    if (planBmpCost) planBmpCost.textContent = `Cost: ${bmpCost}`;

    // Winner
    const costs = [{ name: 'Sequential Scan', cost: seqCost, el: 'plan-seq' }, { name: 'Index Scan', cost: idxCost, el: 'plan-idx' }, { name: 'Bitmap Index Scan', cost: bmpCost, el: 'plan-bmp' }];
    costs.sort((a, b) => a.cost - b.cost);
    document.querySelectorAll('.plan-card').forEach(c => c.classList.remove('winner'));
    const winEl = document.getElementById(costs[0].el);
    if (winEl) winEl.classList.add('winner');
    if (plannerWinner) plannerWinner.innerHTML = `<span style="color:var(--accent-teal)">🏆 Winner: ${costs[0].name} (cost: ${costs[0].cost})</span>`;
  }
  if (sliderSel) { sliderSel.addEventListener('input', updatePlanner); updatePlanner(); }

  // Join strategy info
  const joinToggle = document.getElementById('join-toggle');
  const joinDemo = document.getElementById('join-demo');
  const joinInfo = document.getElementById('join-info');
  const joinData = {
    'nested-loop': { viz: '🔄 For each row in A → scan all rows in B', info: 'Best for small tables or when inner table has an index. O(N×M) worst case. Used when one side is very small.' },
    'hash-join': { viz: '# Build hash table from B → probe with each row of A', info: 'Best for equi-joins on large unsorted tables. O(N+M). Needs memory for hash table (work_mem).' },
    'merge-join': { viz: '↕ Sort both A and B → merge in single pass', info: 'Best when both inputs are already sorted (e.g., from index). O(N log N + M log M). Very efficient for large sorted datasets.' }
  };
  if (joinToggle) joinToggle.querySelectorAll('.strategy-btn').forEach(b => {
    b.addEventListener('click', () => {
      joinToggle.querySelectorAll('.strategy-btn').forEach(x => x.classList.remove('active'));
      b.classList.add('active');
      const j = b.dataset.join;
      if (joinDemo) joinDemo.innerHTML = `<div style="font-size:1.5rem;padding:1rem;background:rgba(255,255,255,.03);border-radius:8px;text-align:center;width:100%">${joinData[j].viz}</div>`;
      if (joinInfo) joinInfo.textContent = joinData[j].info;
    });
    if (b.classList.contains('active')) b.click();
  });

  // ════════════════════════════════════════════
  // 12. CONNECTION POOLING
  // ════════════════════════════════════════════
  const sliderPoolClients = document.getElementById('slider-pool-clients');
  const valPoolClients = document.getElementById('val-pool-clients');
  const btnPoolRun = document.getElementById('btn-pool-run');

  if (sliderPoolClients) sliderPoolClients.addEventListener('input', () => {
    if (valPoolClients) valPoolClients.textContent = sliderPoolClients.value;
  });

  if (btnPoolRun) btnPoolRun.addEventListener('click', () => {
    const n = parseInt(sliderPoolClients ? sliderPoolClients.value : 20);
    const poolSize = 5;
    // Without pooling
    const noClients = document.getElementById('pool-no-clients');
    const noConns = document.getElementById('pool-no-conns');
    if (noClients) { noClients.innerHTML = ''; for (let i = 0; i < n; i++) { const d = document.createElement('div'); d.className = 'pool-client active'; noClients.appendChild(d); }}
    if (noConns) { noConns.innerHTML = ''; for (let i = 0; i < n; i++) { const d = document.createElement('div'); d.className = 'pool-conn'; noConns.appendChild(d); }}
    // With pooling
    const yesClients = document.getElementById('pool-yes-clients');
    const bouncerConns = document.getElementById('pool-bouncer-conns');
    const yesConns = document.getElementById('pool-yes-conns');
    if (yesClients) { yesClients.innerHTML = ''; for (let i = 0; i < n; i++) { const d = document.createElement('div'); d.className = 'pool-client active'; yesClients.appendChild(d); }}
    if (bouncerConns) { bouncerConns.innerHTML = ''; for (let i = 0; i < n; i++) { const d = document.createElement('div'); d.className = 'pool-conn'; bouncerConns.appendChild(d); }}
    if (yesConns) { yesConns.innerHTML = ''; for (let i = 0; i < poolSize; i++) { const d = document.createElement('div'); d.className = 'pool-conn active'; yesConns.appendChild(d); }}

    const stats = document.getElementById('pool-stats');
    if (stats) stats.innerHTML = `<span style="color:var(--accent-red)">❌ Without pooling: ${n} PG processes (~${n * 7}MB RAM)</span> &nbsp; <span style="color:var(--accent-teal)">✅ With pooling: ${poolSize} PG processes (~${poolSize * 7}MB RAM) — ${Math.round((1 - poolSize/n) * 100)}% reduction</span>`;
  });

  // ════════════════════════════════════════════
  // 13. REPLICATION
  // ════════════════════════════════════════════
  let replLsn = 0;
  const replPrimaryWal = document.getElementById('repl-primary-wal');
  const replStandby1Wal = document.getElementById('repl-standby1-wal');
  const replStandby2Wal = document.getElementById('repl-standby2-wal');
  const replLog = document.getElementById('repl-log');
  const btnReplWrite = document.getElementById('btn-repl-write');
  const btnReplFailover = document.getElementById('btn-repl-failover');
  const btnReplRestore = document.getElementById('btn-repl-restore');

  function addReplWalEntry(el) {
    if (!el) return;
    const e = document.createElement('span');
    e.className = 'repl-wal-entry';
    e.textContent = `LSN ${replLsn}`;
    el.appendChild(e);
  }
  function addReplLog(msg) {
    if (!replLog) return;
    replLog.innerHTML += msg + '<br>';
  }

  if (btnReplWrite) btnReplWrite.addEventListener('click', () => {
    replLsn++;
    addReplWalEntry(replPrimaryWal);
    addReplLog(`✏️ Write LSN ${replLsn} to primary`);
    // Sync standby
    setTimeout(() => { addReplWalEntry(replStandby1Wal); addReplLog(`📡 LSN ${replLsn} replicated to Standby 1 (sync)`); }, 300);
    // Async standby (delayed)
    setTimeout(() => { addReplWalEntry(replStandby2Wal); addReplLog(`📡 LSN ${replLsn} replicated to Standby 2 (async)`); }, 800);
  });

  if (btnReplFailover) btnReplFailover.addEventListener('click', () => {
    const primary = document.getElementById('repl-primary');
    const standby1 = document.getElementById('repl-standby-1');
    if (primary) primary.classList.add('failed');
    if (standby1) standby1.classList.add('promoted');
    addReplLog('💥 Primary FAILED!');
    setTimeout(() => { addReplLog('🔄 Standby 1 promoted to PRIMARY — zero data loss (sync replica)'); }, 800);
  });

  if (btnReplRestore) btnReplRestore.addEventListener('click', () => {
    document.querySelectorAll('.repl-node').forEach(n => { n.classList.remove('failed', 'promoted'); });
    addReplLog('🔄 All nodes restored');
  });

  // ════════════════════════════════════════════
  // 14. PARTITIONING
  // ════════════════════════════════════════════
  let partStrategy = 'range';
  let partRows = [];
  const partToggle = document.getElementById('part-toggle');
  const partChildren = document.getElementById('part-children');
  const partLog = document.getElementById('part-log');
  const btnPartInsert = document.getElementById('btn-part-insert');

  const partDefs = {
    range: [
      { title: 'orders_2024_q1', range: 'Jan-Mar 2024', check: m => m >= 1 && m <= 3 },
      { title: 'orders_2024_q2', range: 'Apr-Jun 2024', check: m => m >= 4 && m <= 6 },
      { title: 'orders_2024_q3', range: 'Jul-Sep 2024', check: m => m >= 7 && m <= 9 },
      { title: 'orders_2024_q4', range: 'Oct-Dec 2024', check: m => m >= 10 && m <= 12 }
    ],
    list: [
      { title: 'orders_us', range: "region IN ('US')", check: r => r === 'US' },
      { title: 'orders_eu', range: "region IN ('EU')", check: r => r === 'EU' },
      { title: 'orders_asia', range: "region IN ('ASIA')", check: r => r === 'ASIA' },
      { title: 'orders_default', range: 'DEFAULT', check: () => true }
    ],
    hash: [
      { title: 'orders_p0', range: 'hash % 4 = 0', check: h => h % 4 === 0 },
      { title: 'orders_p1', range: 'hash % 4 = 1', check: h => h % 4 === 1 },
      { title: 'orders_p2', range: 'hash % 4 = 2', check: h => h % 4 === 2 },
      { title: 'orders_p3', range: 'hash % 4 = 3', check: h => h % 4 === 3 }
    ]
  };

  function renderPartitions() {
    if (!partChildren) return;
    const defs = partDefs[partStrategy];
    partChildren.innerHTML = '';
    defs.forEach((d, i) => {
      const el = document.createElement('div');
      el.className = 'part-child';
      el.dataset.idx = i;
      const rows = partRows.filter(r => r.partIdx === i);
      el.innerHTML = `<div class="part-child__title">${d.title}</div><div class="part-child__range">${d.range}</div><div class="part-child__rows">${rows.map(r => `<div class="part-row">${r.label}</div>`).join('')}</div>`;
      partChildren.appendChild(el);
    });
  }

  if (partToggle) partToggle.querySelectorAll('.strategy-btn').forEach(b => {
    b.addEventListener('click', () => {
      partToggle.querySelectorAll('.strategy-btn').forEach(x => x.classList.remove('active'));
      b.classList.add('active');
      partStrategy = b.dataset.part;
      partRows = [];
      renderPartitions();
    });
  });

  if (btnPartInsert) btnPartInsert.addEventListener('click', () => {
    const defs = partDefs[partStrategy];
    let value, label, partIdx = -1;

    if (partStrategy === 'range') {
      value = Math.floor(Math.random() * 12) + 1;
      const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
      label = `order #${partRows.length + 1} (${months[value - 1]} 2024)`;
      partIdx = defs.findIndex(d => d.check(value));
    } else if (partStrategy === 'list') {
      const regions = ['US', 'EU', 'ASIA', 'OTHER'];
      value = regions[Math.floor(Math.random() * regions.length)];
      label = `order #${partRows.length + 1} (${value})`;
      partIdx = defs.findIndex(d => d.check(value));
    } else {
      value = Math.floor(Math.random() * 1000);
      label = `order #${partRows.length + 1} (hash=${value})`;
      partIdx = defs.findIndex(d => d.check(value));
    }
    partRows.push({ label, partIdx });
    renderPartitions();

    // Highlight target partition
    setTimeout(() => {
      const children = partChildren.querySelectorAll('.part-child');
      children.forEach(c => c.classList.remove('active'));
      if (children[partIdx]) children[partIdx].classList.add('active');
    }, 50);
    if (partLog) partLog.innerHTML = `<span style="color:var(--accent-teal)">→ Routed to <strong>${defs[partIdx].title}</strong></span>`;
  });
  renderPartitions();

  // ════════════════════════════════════════════
  // 15. TOAST
  // ════════════════════════════════════════════
  const sliderToastSize = document.getElementById('slider-toast-size');
  const valToastSize = document.getElementById('val-toast-size');
  const btnToastInsert = document.getElementById('btn-toast-insert');
  const toastPage = document.getElementById('toast-page');
  const toastArrow = document.getElementById('toast-arrow');
  const toastChunks = document.getElementById('toast-chunks');
  const toastExt = document.getElementById('toast-ext');
  const toastStatus = document.getElementById('toast-status');
  let toastItems = [];

  if (sliderToastSize) sliderToastSize.addEventListener('input', () => {
    const v = parseInt(sliderToastSize.value);
    if (valToastSize) valToastSize.textContent = v >= 1000 ? (v / 1000).toFixed(1) + ' KB' : v + ' B';
  });

  if (btnToastInsert) btnToastInsert.addEventListener('click', () => {
    const size = parseInt(sliderToastSize ? sliderToastSize.value : 100);
    const threshold = 2000;
    const pageLimit = 8000;
    const item = { size, toasted: size > threshold };
    toastItems.push(item);

    // Render main table
    if (toastPage) {
      toastPage.innerHTML = '';
      let totalInline = 0;
      toastItems.forEach((it, i) => {
        const bar = document.createElement('div');
        const displaySize = it.toasted ? 24 : it.size; // Pointer only if toasted
        const pct = Math.min((displaySize / pageLimit) * 100, 100);
        bar.className = 'toast-page-bar ' + (it.toasted ? 'toasted' : 'inline');
        bar.style.width = Math.max(pct, 5) + '%';
        bar.innerHTML = `<span class="toast-page-bar__label">${it.toasted ? '→ptr' : it.size + 'B'}</span>`;
        toastPage.appendChild(bar);
        totalInline += displaySize;
      });
    }

    // Render TOAST table
    const toastedItems = toastItems.filter(it => it.toasted);
    if (toastedItems.length > 0) {
      if (toastArrow) toastArrow.style.display = 'block';
      if (toastExt) toastExt.classList.add('active');
      if (toastChunks) {
        toastChunks.innerHTML = '';
        toastedItems.forEach((it, i) => {
          const numChunks = Math.ceil(it.size / 2000);
          for (let c = 0; c < numChunks; c++) {
            const ch = document.createElement('div');
            ch.className = 'toast-chunk';
            ch.textContent = `chunk ${i+1}.${c} (${Math.min(2000, it.size - c * 2000)}B)`;
            toastChunks.appendChild(ch);
          }
        });
      }
    } else {
      if (toastArrow) toastArrow.style.display = 'none';
      if (toastExt) toastExt.classList.remove('active');
    }

    // Status
    if (toastStatus) {
      if (size <= threshold) {
        toastStatus.innerHTML = `<span style="color:var(--accent-teal)">✅ ${size}B stored inline — below TOAST threshold (2KB)</span>`;
      } else {
        const chunks = Math.ceil(size / 2000);
        toastStatus.innerHTML = `<span style="color:var(--accent-orange)">📦 ${size}B exceeds threshold → compressed & stored in ${chunks} TOAST chunk(s)</span>`;
      }
    }
  });

})();
