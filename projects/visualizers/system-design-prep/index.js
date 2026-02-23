/* ═══════════════════════════════════════════════════════
   SYSTEM DESIGN INTERVIEW PREP — Interactive Logic
   ═══════════════════════════════════════════════════════ */

// ── Scroll Reveal ────────────────────────────────────
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('visible'); } });
}, { threshold: 0.1 });
document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));

// ── Helper ───────────────────────────────────────────
const $ = (s, p = document) => p.querySelector(s);
const $$ = (s, p = document) => [...p.querySelectorAll(s)];
function fmt(n) {
  if (n >= 1e12) return (n / 1e12).toFixed(1) + 'T';
  if (n >= 1e9) return (n / 1e9).toFixed(1) + 'B';
  if (n >= 1e6) return (n / 1e6).toFixed(1) + 'M';
  if (n >= 1e3) return (n / 1e3).toFixed(1) + 'K';
  return n.toFixed(0);
}

/* ═══════════════ 01. FRAMEWORK ═══════════════ */
const fwData = [
  { title: 'Step 1: Clarify Requirements', items: ['Ask functional vs non-functional requirements', 'Define users: who are they? how many?', "Clarify scope: what's in/out for 45 min?", 'Identify read-heavy vs write-heavy workload', 'Discuss consistency vs availability trade-offs'] },
  { title: 'Step 2: Back-of-Envelope Estimation', items: ['Estimate DAU, QPS (queries/sec)', 'Calculate storage needs (per day, per year)', 'Estimate bandwidth (read + write)', 'Determine cache size using 80/20 rule', 'Estimate number of servers needed'] },
  { title: 'Step 3: API Design', items: ['Define core API endpoints (REST/gRPC)', 'Specify request & response payloads', 'Consider pagination for list endpoints', 'Define rate limits and auth headers', 'Version your API: /api/v1/...'] },
  { title: 'Step 4: Data Model', items: ['Identify core entities & relationships', 'Choose SQL vs NoSQL with reasoning', 'Design schema / document structure', 'Plan indexes for read patterns', 'Consider data partitioning strategy'] },
  { title: 'Step 5: High-Level Design', items: ['Draw the architecture diagram', 'Identify microservices & responsibilities', 'Add load balancers, caches, CDN', 'Show data flow for read & write paths', 'Discuss message queues for async tasks'] },
  { title: 'Step 6: Deep Dive', items: ['Detailed design of 1-2 critical components', 'Discuss failure scenarios & mitigations', 'Talk about monitoring & alerting', 'Address security: auth, encryption, rate limiting', 'Discuss trade-offs you made and why'] }
];
let fwCurrent = 0;
function renderFwStep(i) {
  fwCurrent = i;
  $$('.fw-step').forEach((s, idx) => { s.classList.toggle('active', idx === i); s.classList.toggle('completed', idx < i); });
  const d = $('#fw-detail');
  const data = fwData[i];
  d.innerHTML = `<h4>${data.title}</h4><ul>${data.items.map(x => `<li>${x}</li>`).join('')}</ul>`;
}
$$('.fw-step').forEach(s => s.addEventListener('click', () => renderFwStep(+s.dataset.step)));
let fwTimer = null;
$('#btn-fw-auto').addEventListener('click', () => {
  if (fwTimer) return;
  renderFwStep(0);
  let step = 0;
  fwTimer = setInterval(() => {
    step++;
    if (step >= 6) { clearInterval(fwTimer); fwTimer = null; return; }
    renderFwStep(step);
  }, 2000);
});
$('#btn-fw-reset').addEventListener('click', () => {
  clearInterval(fwTimer); fwTimer = null;
  renderFwStep(0);
});

/* ═══════════════ 02. ESTIMATION ═══════════════ */
const estPresets = {
  twitter: { dau: 300000000, actions: 5, size: 2, peak: 3 },
  instagram: { dau: 500000000, actions: 10, size: 500, peak: 2.5 },
  uber: { dau: 20000000, actions: 2, size: 3, peak: 5 },
  whatsapp: { dau: 2000000000, actions: 50, size: 1, peak: 2 },
  custom: { dau: 1000000, actions: 10, size: 5, peak: 3 }
};
function calcEstimation() {
  const dau = +$('#est-dau').value || 0;
  const actions = +$('#est-actions').value || 0;
  const size = +$('#est-size').value || 0;
  const peak = +$('#est-peak').value || 1;
  const totalReq = dau * actions;
  const avgQPS = totalReq / 86400;
  const peakQPS = avgQPS * peak;
  const dailyStorageKB = totalReq * size;
  const dailyStorageGB = dailyStorageKB / 1e6;
  const monthlyStorageTB = (dailyStorageGB * 30) / 1000;
  const bandwidthMBps = (peakQPS * size) / 1000;
  const container = $('#est-results');
  container.innerHTML = `
    <div class="est-result-card"><div class="est-result-value">${fmt(totalReq)}</div><div class="est-result-label">Requests / Day</div></div>
    <div class="est-result-card"><div class="est-result-value">${fmt(avgQPS)}</div><div class="est-result-label">Avg QPS</div></div>
    <div class="est-result-card"><div class="est-result-value">${fmt(peakQPS)}</div><div class="est-result-label">Peak QPS</div></div>
    <div class="est-result-card"><div class="est-result-value">${fmt(dailyStorageGB)} GB</div><div class="est-result-label">Storage / Day</div></div>
    <div class="est-result-card"><div class="est-result-value">${fmt(monthlyStorageTB)} TB</div><div class="est-result-label">Storage / Month</div></div>
    <div class="est-result-card"><div class="est-result-value">${fmt(bandwidthMBps)} MB/s</div><div class="est-result-label">Peak Bandwidth</div></div>`;
}
$$('.est-preset').forEach(btn => btn.addEventListener('click', () => {
  $$('.est-preset').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  const p = estPresets[btn.dataset.preset];
  $('#est-dau').value = p.dau; $('#est-actions').value = p.actions;
  $('#est-size').value = p.size; $('#est-peak').value = p.peak;
  calcEstimation();
}));
$$('#est-dau,#est-actions,#est-size,#est-peak').forEach(i => i.addEventListener('input', () => {
  $$('.est-preset').forEach(b => b.classList.remove('active'));
  $('.est-preset[data-preset="custom"]').classList.add('active');
  calcEstimation();
}));
calcEstimation();

/* ═══════════════ 03. SCALABILITY ═══════════════ */
let vServers = 1, hServers = 1, vUpgraded = false;
function renderScaleServers() {
  const load = +$('#slider-load').value;
  $('#val-load').textContent = load + 'x';
  // Vertical
  const vDiv = $('#scale-v-servers');
  const vCapacity = vUpgraded ? 5 : 2;
  vDiv.innerHTML = `<div class="scale-server${vUpgraded ? ' upgraded' : ''}"><div class="srv-icon">🖥️</div>${vUpgraded ? '16 CPU' : '4 CPU'}</div>`;
  const vLoadPct = Math.min(100, (load / vCapacity) * 100);
  $('#scale-v-load').style.width = vLoadPct + '%';
  $('#scale-v-load').style.background = vLoadPct > 80 ? 'linear-gradient(90deg,var(--accent-red),#d63b5e)' : '';
  // Horizontal
  const hDiv = $('#scale-h-servers');
  hDiv.innerHTML = '';
  for (let i = 0; i < hServers; i++) {
    const s = document.createElement('div');
    s.className = 'scale-server' + (i >= hServers - 1 && hServers > 1 ? ' new' : '');
    s.innerHTML = '<div class="srv-icon">🖥️</div>4 CPU';
    hDiv.appendChild(s);
  }
  const hCapacity = hServers * 2;
  const hLoadPct = Math.min(100, (load / hCapacity) * 100);
  $('#scale-h-load').style.width = hLoadPct + '%';
  $('#scale-h-load').style.background = hLoadPct > 80 ? 'linear-gradient(90deg,var(--accent-red),#d63b5e)' : '';
}
$('#slider-load').addEventListener('input', renderScaleServers);
$('#btn-scale-v').addEventListener('click', () => { vUpgraded = true; renderScaleServers(); });
$('#btn-scale-h').addEventListener('click', () => { hServers = Math.min(8, hServers + 1); renderScaleServers(); });
$('#btn-scale-reset').addEventListener('click', () => { vUpgraded = false; hServers = 1; $('#slider-load').value = 3; renderScaleServers(); });
renderScaleServers();

/* ═══════════════ 04. LOAD BALANCING ═══════════════ */
const lbServerNames = ['Server-A', 'Server-B', 'Server-C', 'Server-D'];
const lbWeights = [3, 2, 2, 1];
let lbCounts = [0, 0, 0, 0], lbRRIndex = 0, lbStrategy = 'round-robin';
function renderLBServers() {
  const total = Math.max(1, lbCounts.reduce((a, b) => a + b, 0));
  $('#lb-servers').innerHTML = lbServerNames.map((name, i) => `
    <div class="lb-server" id="lb-srv-${i}">
      <div class="lb-server__name">${name}</div>
      <div class="lb-server__bar"><div class="lb-server__fill" style="width:${(lbCounts[i] / Math.max(1, Math.max(...lbCounts))) * 100}%"></div></div>
      <div class="lb-server__count">${lbCounts[i]}</div>
    </div>`).join('');
}
function lbRoute() {
  let idx;
  if (lbStrategy === 'round-robin') { idx = lbRRIndex % 4; lbRRIndex++; }
  else if (lbStrategy === 'weighted') {
    const totalW = lbWeights.reduce((a, b) => a + b, 0);
    let r = Math.random() * totalW, cum = 0;
    idx = 0;
    for (let i = 0; i < lbWeights.length; i++) { cum += lbWeights[i]; if (r <= cum) { idx = i; break; } }
  } else if (lbStrategy === 'least-conn') { idx = lbCounts.indexOf(Math.min(...lbCounts)); }
  else { idx = Math.floor(Math.random() * 4); /* ip-hash simplified */ }
  lbCounts[idx]++;
  renderLBServers();
  const srv = $(`#lb-srv-${idx}`);
  if (srv) { srv.classList.add('hit'); setTimeout(() => srv.classList.remove('hit'), 400); }
}
$$('#lb-strategy-toggle .strategy-btn').forEach(btn => btn.addEventListener('click', () => {
  $$('#lb-strategy-toggle .strategy-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active'); lbStrategy = btn.dataset.strategy;
  $('#lb-algo-name').textContent = btn.textContent;
}));
$('#btn-lb-send').addEventListener('click', lbRoute);
$('#btn-lb-burst').addEventListener('click', () => { for (let i = 0; i < 10; i++) setTimeout(lbRoute, i * 150); });
$('#btn-lb-reset').addEventListener('click', () => { lbCounts = [0, 0, 0, 0]; lbRRIndex = 0; renderLBServers(); });
renderLBServers();

/* ═══════════════ 05. CACHING ═══════════════ */
let cacheStrategy = 'cache-aside', cacheStore = new Set(), cacheLogEntries = [];
function cacheAnimate(nodes, arrowIds, statusText, statusClass) {
  const allNodes = $$('#cache-flow .cache-node');
  const allArrows = $$('#cache-flow .cache-arrow');
  allNodes.forEach(n => n.classList.remove('active'));
  allArrows.forEach(a => a.classList.remove('active'));
  nodes.forEach((ni, i) => setTimeout(() => allNodes[ni]?.classList.add('active'), i * 400));
  arrowIds.forEach((ai, i) => setTimeout(() => allArrows[ai]?.classList.add('active'), i * 400));
  const st = $('#cache-status');
  setTimeout(() => { st.textContent = statusText; st.className = 'cache-status ' + statusClass; }, nodes.length * 400);
  cacheLogEntries.unshift(`<div class="cache-log-entry ${statusClass}">[${new Date().toLocaleTimeString()}] ${statusText}</div>`);
  if (cacheLogEntries.length > 20) cacheLogEntries.pop();
  setTimeout(() => { $('#cache-log').innerHTML = cacheLogEntries.join(''); }, nodes.length * 400);
}
$('#btn-cache-read').addEventListener('click', () => {
  const key = 'user:' + Math.floor(Math.random() * 5 + 1);
  if (cacheStore.has(key)) {
    cacheAnimate([0, 1], [0], `✅ CACHE HIT — ${key} found in cache`, 'hit');
  } else {
    cacheStore.add(key);
    if (cacheStrategy === 'cache-aside') {
      cacheAnimate([0, 1, 2, 1], [0, 1], `❌ CACHE MISS — ${key} loaded from DB → cached`, 'miss');
    } else {
      cacheAnimate([0, 1, 2], [0, 1], `❌ CACHE MISS — ${key} read-through from DB`, 'miss');
    }
  }
});
$('#btn-cache-write').addEventListener('click', () => {
  const key = 'user:' + Math.floor(Math.random() * 5 + 1);
  cacheStore.add(key);
  if (cacheStrategy === 'write-through' || cacheStrategy === 'write-behind') {
    cacheAnimate([0, 1, 2], [0, 1], `✏️ WRITE — ${key} written to cache → DB`, 'hit');
  } else {
    cacheAnimate([0, 2], [0, 1], `✏️ WRITE — ${key} written to DB (cache invalidated)`, 'miss');
    cacheStore.delete(key);
  }
});
$$('#cache-strategy-toggle .strategy-btn').forEach(btn => btn.addEventListener('click', () => {
  $$('#cache-strategy-toggle .strategy-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active'); cacheStrategy = btn.dataset.strategy;
}));

/* ═══════════════ 06. DATABASE ═══════════════ */
const dbScenarios = {
  banking: { rec: 'SQL', db: 'PostgreSQL / MySQL', reason: 'Banking requires ACID transactions, strong consistency, and complex joins for account balances, transfers, and audit trails.' },
  social: { rec: 'NoSQL', db: 'Cassandra / DynamoDB', reason: 'Social feeds need high write throughput, horizontal scaling for billions of posts, and eventual consistency is acceptable.' },
  iot: { rec: 'NoSQL', db: 'TimescaleDB / InfluxDB', reason: 'IoT generates massive time-series data with append-heavy writes. Time-series databases are optimized for this pattern.' },
  ecommerce: { rec: 'Both', db: 'PostgreSQL + Elasticsearch', reason: 'SQL for orders/transactions (ACID), NoSQL/search for product catalog with flexible attributes and full-text search.' },
  chat: { rec: 'NoSQL', db: 'Cassandra / ScyllaDB', reason: 'Chat needs high write throughput for messages, partition by conversation_id, and horizontal scaling. Eventual consistency is fine.' },
  analytics: { rec: 'NoSQL', db: 'ClickHouse / BigQuery', reason: 'Analytics requires columnar storage for fast aggregations over massive datasets. Write-optimized, read-heavy analytical queries.' }
};
$$('.db-scenario').forEach(btn => btn.addEventListener('click', () => {
  $$('.db-scenario').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  const s = dbScenarios[btn.dataset.scenario];
  $('#db-sql').classList.toggle('active', s.rec === 'SQL' || s.rec === 'Both');
  $('#db-nosql').classList.toggle('active', s.rec === 'NoSQL' || s.rec === 'Both');
  $('#db-recommendation').innerHTML = `<strong>Recommended: ${s.rec}</strong> — ${s.db}<br><span style="color:var(--text-muted)">${s.reason}</span>`;
}));

/* ═══════════════ 07. SHARDING ═══════════════ */
let shardCount = 3, shardStrategy = 'hash', shardData = [], shardNextId = 1;
const sampleNames = ['Alice','Bob','Charlie','Diana','Eve','Frank','Grace','Hank','Ivy','Jack','Kate','Liam','Mia','Noah','Olivia','Pete'];
function renderShards() {
  const c = $('#shard-container');
  const buckets = Array.from({ length: shardCount }, () => []);
  shardData.forEach(d => {
    let si;
    if (shardStrategy === 'hash') { si = d.id % shardCount; }
    else { si = Math.min(shardCount - 1, Math.floor((d.id - 1) / Math.ceil(shardNextId / shardCount))); }
    buckets[si].push(d);
  });
  const maxItems = Math.max(1, ...buckets.map(b => b.length));
  c.innerHTML = buckets.map((b, i) => {
    const isHot = b.length > maxItems * 0.6 && shardStrategy === 'range' && shardData.length > 5;
    return `<div class="shard-box${isHot ? ' hot' : ''}">
      <div class="shard-box__title">Shard ${i + 1}</div>
      <div class="shard-box__items">${b.map(d => `<div class="shard-item">${d.name} (${d.id})</div>`).join('')}</div>
    </div>`;
  }).join('');
  $('#shard-stats').innerHTML = buckets.map((b, i) => `
    <div class="shard-stat"><div class="shard-stat__value">${b.length}</div><div class="shard-stat__label">Shard ${i + 1} Records</div></div>`).join('');
}
$('#slider-shards').addEventListener('input', e => { shardCount = +e.target.value; $('#val-shards').textContent = shardCount; renderShards(); });
$$('#shard-strategy-toggle .strategy-btn').forEach(btn => btn.addEventListener('click', () => {
  $$('#shard-strategy-toggle .strategy-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active'); shardStrategy = btn.dataset.strategy; renderShards();
}));
$('#btn-shard-add').addEventListener('click', () => { shardData.push({ id: shardNextId++, name: sampleNames[Math.floor(Math.random() * sampleNames.length)] }); renderShards(); });
$('#btn-shard-burst').addEventListener('click', () => { for (let i = 0; i < 10; i++) shardData.push({ id: shardNextId++, name: sampleNames[Math.floor(Math.random() * sampleNames.length)] }); renderShards(); });
$('#btn-shard-reset').addEventListener('click', () => { shardData = []; shardNextId = 1; renderShards(); });
renderShards();

/* ═══════════════ 08. CAP THEOREM ═══════════════ */
const capDB = {
  CP: { title: 'CP — Consistency + Partition Tolerance', desc: 'System stays consistent during a partition but may become unavailable (rejects requests).', dbs: ['MongoDB', 'HBase', 'Redis (Cluster)', 'Zookeeper', 'Etcd'] },
  AP: { title: 'AP — Availability + Partition Tolerance', desc: 'System stays available during a partition but may return stale data (eventually consistent).', dbs: ['Cassandra', 'DynamoDB', 'CouchDB', 'Riak', 'Voldemort'] },
  CA: { title: 'CA — Consistency + Availability', desc: 'Only possible if there are NO network partitions (single node). Rarely practical in distributed systems.', dbs: ['PostgreSQL', 'MySQL', 'Oracle', 'SQL Server', '(Single-node only)'] }
};
let capSelected = [];
$$('.cap-node').forEach(node => node.addEventListener('click', () => {
  const cap = node.dataset.cap;
  if (capSelected.includes(cap)) {
    capSelected = capSelected.filter(c => c !== cap);
  } else {
    if (capSelected.length >= 2) capSelected.shift();
    capSelected.push(cap);
  }
  $$('.cap-node').forEach(n => n.classList.toggle('selected', capSelected.includes(n.dataset.cap)));
  // Lines
  const sorted = [...capSelected].sort().join('');
  $('#cap-line-ca').classList.toggle('active', sorted === 'AC');
  $('#cap-line-cp').classList.toggle('active', sorted === 'CP');
  $('#cap-line-ap').classList.toggle('active', sorted === 'AP');
  // Result
  if (capSelected.length === 2) {
    const key = [...capSelected].sort().join('');
    const data = capDB[key] || capDB[key.split('').reverse().join('')];
    if (data) {
      $('#cap-result').innerHTML = `<div class="cap-result__title">${data.title}</div>
        <p style="color:var(--text-secondary);font-size:.88rem;margin-bottom:.8rem">${data.desc}</p>
        <div style="font-size:.8rem;color:var(--text-muted);margin-bottom:.4rem">DATABASES:</div>
        <div class="cap-result__db">${data.dbs.map(d => `<span class="cap-db-chip">${d}</span>`).join('')}</div>`;
    }
  } else {
    $('#cap-result').innerHTML = '<div class="cap-result__title">Click two nodes to explore</div><p style="color:var(--text-secondary);font-size:.9rem">Select any two CAP properties.</p>';
  }
}));

/* ═══════════════ 09. MESSAGE QUEUES ═══════════════ */
let mqQueue = [], mqNextId = 1;
function renderMQ() {
  $('#mq-queue').innerHTML = mqQueue.map(m => `<div class="mq-msg${m.consumed ? ' consumed' : ''}">${m.id}</div>`).join('');
  $('#mq-hint').textContent = `Queue size: ${mqQueue.filter(m => !m.consumed).length} messages`;
}
$('#btn-mq-produce').addEventListener('click', () => { mqQueue.push({ id: mqNextId++, consumed: false }); renderMQ(); });
$('#btn-mq-produce5').addEventListener('click', () => { for (let i = 0; i < 5; i++) mqQueue.push({ id: mqNextId++, consumed: false }); renderMQ(); });
$('#btn-mq-consume').addEventListener('click', () => {
  const msg = mqQueue.find(m => !m.consumed);
  if (msg) { msg.consumed = true; renderMQ(); setTimeout(() => { mqQueue = mqQueue.filter(m => !m.consumed || m !== msg); renderMQ(); }, 500); }
});
$('#btn-mq-reset').addEventListener('click', () => { mqQueue = []; mqNextId = 1; renderMQ(); });
$('#btn-mq-compare').addEventListener('click', () => {
  $('#mq-sync-bar').style.width = '0%';
  $('#mq-async-bar').style.width = '0%';
  // Async finishes fast (accept immediately)
  setTimeout(() => { $('#mq-async-bar').style.width = '100%'; }, 100);
  // Sync is slow
  let pct = 0;
  const syncInt = setInterval(() => { pct += 10; $('#mq-sync-bar').style.width = pct + '%'; if (pct >= 100) clearInterval(syncInt); }, 300);
});
renderMQ();

/* ═══════════════ 10. CDN ═══════════════ */
const cdnEdges = [
  { x: 15, y: 25, label: 'US-West' }, { x: 30, y: 30, label: 'US-East' },
  { x: 48, y: 20, label: 'Europe' }, { x: 65, y: 35, label: 'India' },
  { x: 80, y: 25, label: 'Japan' }, { x: 75, y: 65, label: 'Australia' },
  { x: 45, y: 60, label: 'Africa' }, { x: 25, y: 65, label: 'Brazil' }
];
const cdnUsers = [
  { x: 10, y: 35, label: '👤' }, { x: 35, y: 20, label: '👤' },
  { x: 55, y: 45, label: '👤' }, { x: 70, y: 30, label: '👤' },
  { x: 85, y: 55, label: '👤' }
];
(function initCDN() {
  const world = $('#cdn-world');
  cdnEdges.forEach((e, i) => {
    const el = document.createElement('div');
    el.className = 'cdn-edge'; el.id = `cdn-e-${i}`;
    el.style.left = e.x + '%'; el.style.top = e.y + '%';
    el.title = e.label; el.textContent = '📡';
    world.appendChild(el);
  });
  cdnUsers.forEach((u, i) => {
    const el = document.createElement('div');
    el.className = 'cdn-user'; el.id = `cdn-u-${i}`;
    el.style.left = u.x + '%'; el.style.top = u.y + '%';
    el.textContent = u.label;
    world.appendChild(el);
  });
})();
$('#btn-cdn-without').addEventListener('click', () => {
  const latency = Math.floor(Math.random() * 200 + 200);
  $('#cdn-no-val').textContent = latency + 'ms';
  $('#cdn-yes-val').textContent = '—';
  // Animate origin pulse
  $('.cdn-origin').style.boxShadow = '0 0 30px var(--accent-orange-glow)';
  setTimeout(() => { $('.cdn-origin').style.boxShadow = ''; }, 800);
});
$('#btn-cdn-with').addEventListener('click', () => {
  const latency = Math.floor(Math.random() * 30 + 10);
  $('#cdn-yes-val').textContent = latency + 'ms';
  if ($('#cdn-no-val').textContent === '—') $('#cdn-no-val').textContent = Math.floor(Math.random() * 200 + 200) + 'ms';
  // Animate nearest edge
  const idx = Math.floor(Math.random() * cdnEdges.length);
  const edge = $(`#cdn-e-${idx}`);
  edge.classList.add('active');
  setTimeout(() => edge.classList.remove('active'), 800);
});

/* ═══════════════ 11. RATE LIMITING ═══════════════ */
let rlTokens, rlCapacity = 8, rlRate = 3, rlRefillTimer;
function rlInit() {
  rlCapacity = +$('#slider-rl-capacity').value;
  rlRate = +$('#slider-rl-rate').value;
  rlTokens = rlCapacity;
  renderRL();
  clearInterval(rlRefillTimer);
  rlRefillTimer = setInterval(() => { if (rlTokens < rlCapacity) { rlTokens++; renderRL(); } }, 1000 / rlRate * 3);
}
function renderRL() {
  const cont = $('#rl-tokens');
  cont.innerHTML = '';
  for (let i = 0; i < rlTokens; i++) {
    const t = document.createElement('div');
    t.className = 'rl-token'; t.textContent = '●';
    cont.appendChild(t);
  }
  $('#rl-water').style.height = (rlTokens / rlCapacity * 100) + '%';
}
function rlRequest() {
  const log = $('#rl-requests');
  if (rlTokens > 0) {
    rlTokens--;
    renderRL();
    log.innerHTML = `<div class="rl-request allowed">✅ 200 OK — Token consumed (${rlTokens} left)</div>` + log.innerHTML;
  } else {
    log.innerHTML = `<div class="rl-request rejected">❌ 429 Too Many Requests — No tokens</div>` + log.innerHTML;
  }
  if (log.children.length > 20) log.removeChild(log.lastChild);
}
$('#slider-rl-rate').addEventListener('input', e => { rlRate = +e.target.value; $('#val-rl-rate').textContent = rlRate; rlInit(); });
$('#slider-rl-capacity').addEventListener('input', e => { rlCapacity = +e.target.value; $('#val-rl-capacity').textContent = rlCapacity; rlInit(); });
$('#btn-rl-send').addEventListener('click', rlRequest);
$('#btn-rl-burst').addEventListener('click', () => { for (let i = 0; i < 15; i++) setTimeout(rlRequest, i * 100); });
rlInit();

/* ═══════════════ 12. CHEAT SHEET ═══════════════ */
const cheatSheets = [
  { icon: '🔗', title: 'URL Shortener (TinyURL)', tags: ['Hash','Base62','NoSQL','Cache'],
    items: ['Base62 encoding for short IDs','Key-value store (DynamoDB/Redis)','Read-heavy → aggressive caching','301 redirect for SEO, 302 for analytics','Rate limit creation API'] },
  { icon: '🐦', title: 'Twitter / News Feed', tags: ['Fan-out','Cache','Queue','Sharding'],
    items: ['Fan-out on write for small followings','Fan-out on read for celebrities','Timeline cache per user (Redis)','Shard tweets by user_id','Async media processing via queue'] },
  { icon: '🚕', title: 'Uber / Ride Sharing', tags: ['Geospatial','WebSocket','Queue','Matching'],
    items: ['Geospatial index (QuadTree/GeoHash)','WebSockets for real-time location','Matching service with ETA calculation','Event-driven architecture (Kafka)','Pricing service with surge logic'] },
  { icon: '💬', title: 'WhatsApp / Chat System', tags: ['WebSocket','Queue','E2E','Sharding'],
    items: ['WebSocket for real-time delivery','Message queue for offline users','Shard by conversation_id','End-to-end encryption','Last-seen & read receipts via pub/sub'] },
  { icon: '📺', title: 'YouTube / Video Streaming', tags: ['CDN','Transcoding','Blob','Queue'],
    items: ['Blob storage (S3) for videos','Async transcoding pipeline (multiple resolutions)','CDN for video delivery','Recommendation engine (ML)','View count with eventual consistency'] },
  { icon: '🔍', title: 'Search Engine / Autocomplete', tags: ['Trie','Index','Cache','Ranking'],
    items: ['Inverted index for full-text search','Trie data structure for autocomplete','Result ranking (TF-IDF / PageRank)','Cache top queries aggressively','Shard index by document hash'] },
  { icon: '📦', title: 'E-Commerce (Amazon)', tags: ['ACID','Cache','Queue','Search'],
    items: ['SQL for orders (ACID transactions)','Elasticsearch for product search','Cart service with Redis','Inventory with optimistic locking','Async order processing pipeline'] },
  { icon: '📸', title: 'Instagram / Photo Sharing', tags: ['CDN','Blob','Feed','Cache'],
    items: ['S3 + CDN for image delivery','Multiple resolution thumbnails','Feed generation (push/pull hybrid)','Redis cache for hot user feeds','Cassandra for activity/likes storage'] }
];
(function renderCheatSheet() {
  const grid = $('#cheat-grid');
  grid.innerHTML = cheatSheets.map((c, i) => `
    <div class="cheat-card" data-idx="${i}">
      <div class="cheat-card__header">
        <span class="cheat-card__icon">${c.icon}</span>
        <span class="cheat-card__title">${c.title}</span>
        <span class="cheat-card__chevron">▼</span>
      </div>
      <div class="cheat-card__body">
        <div class="cheat-card__content">
          <ul>${c.items.map(item => `<li>${item}</li>`).join('')}</ul>
          <div class="cheat-card__tags">${c.tags.map(t => `<span class="cheat-tag">${t}</span>`).join('')}</div>
        </div>
      </div>
    </div>`).join('');
  $$('.cheat-card').forEach(card => card.addEventListener('click', () => card.classList.toggle('open')));
})();

/* ═══════════════ 13. CONSISTENT HASHING ═══════════════ */
// A. Naive Hashing Demo
let naiveKeys = Array.from({length: 24}, (_, i) => i + 1);
let naiveN = 3;
function renderNaive() {
  const container = $('#ch-naive-grid');
  if(!container) return;
  const prevN = naiveN === 3 ? 4 : 3;
  let remappedCount = 0;
  
  const nodes = Array.from({length: naiveN}, () => []);
  naiveKeys.forEach(k => {
    const currentPos = k % naiveN;
    const prevPos = k % prevN;
    const moved = currentPos !== prevPos && naiveN === 4;
    if (moved) remappedCount++;
    nodes[currentPos].push({ id: k, moved });
  });

  const nodeColors = ['#4cc9f0', '#9b5de5', '#06d6a0', '#ff6b35'];
  
  container.innerHTML = nodes.map((n, i) => `
    <div class="ch-naive-node">
      <div class="ch-naive-node__title" style="color:${nodeColors[i]}">Server ${i}</div>
      <div class="ch-naive-keys">
        ${n.map(k => `<div class="ch-naive-key ${k.moved ? 'moved' : ''}" style="background:${k.moved ? 'transparent' : nodeColors[i]}">${k.id}</div>`).join('')}
      </div>
    </div>
  `).join('');

  if (naiveN === 4) {
    $('#ch-naive-stats').innerHTML = `
      <div class="ch-naive-stat"><div class="ch-naive-stat-val">${remappedCount} / 24</div><div>Keys Remapped</div></div>
      <div class="ch-naive-stat"><div class="ch-naive-stat-val">${Math.round(remappedCount/24*100)}%</div><div>Cache Miss Rate</div></div>
    `;
  } else {
    $('#ch-naive-stats').innerHTML = '';
  }
}
if($('#naive-toggle')) {
  $$('#naive-toggle .strategy-btn').forEach(btn => btn.addEventListener('click', (e) => {
    $$('#naive-toggle .strategy-btn').forEach(b => b.classList.remove('active'));
    e.target.classList.add('active');
    naiveN = parseInt(e.target.dataset.count);
    renderNaive();
  }));
  renderNaive();
}

// B. Consistent Hash Ring Demo
const ringCanvas = $('#ch-ring-canvas');
const ctx = ringCanvas ? ringCanvas.getContext('2d') : null;
const ringRadius = 160;
const ringCenter = {x: 210, y: 210};
let ringNodes = [
  {id: 'Node A', angle: 0, color: '#4cc9f0'},
  {id: 'Node B', angle: Math.PI * 2 / 3, color: '#9b5de5'},
  {id: 'Node C', angle: Math.PI * 4 / 3, color: '#06d6a0'}
];
let ringKeys = [];
let ringKeyId = 1;
let chrLogEntries = [];

function getAssignedNode(keyAngle) {
  let assigned = ringNodes[0];
  let minDiff = Infinity;
  for (const node of ringNodes) {
    let diff = node.angle - keyAngle;
    if (diff < 0) diff += Math.PI * 2;
    if (diff < minDiff) { minDiff = diff; assigned = node; }
  }
  return assigned;
}

function chrLog(msg) {
  chrLogEntries.unshift(`[${new Date().toLocaleTimeString()}] ${msg}`);
  if(chrLogEntries.length > 5) chrLogEntries.pop();
  const logEl = $('#ch-ring-log');
  if(logEl) logEl.innerHTML = chrLogEntries.join('<br>');
}

function renderRing() {
  if (!ctx) return;
  ctx.clearRect(0, 0, 420, 420);
  
  // Draw ring
  ctx.beginPath();
  ctx.arc(ringCenter.x, ringCenter.y, ringRadius, 0, Math.PI * 2);
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
  ctx.lineWidth = 10;
  ctx.stroke();

  if(ringNodes.length > 0) {
    // Draw colored arcs representing ownership
    ringNodes.sort((a, b) => a.angle - b.angle);
    for (let i = 0; i < ringNodes.length; i++) {
      const node = ringNodes[i];
      const prevNode = i === 0 ? ringNodes[ringNodes.length - 1] : ringNodes[i - 1];
      
      let startAngle = prevNode.angle;
      let endAngle = node.angle;
      
      ctx.beginPath();
      ctx.arc(ringCenter.x, ringCenter.y, ringRadius, startAngle, endAngle, false);
      ctx.strokeStyle = node.color + '40';
      ctx.lineWidth = 14;
      ctx.stroke();
    }
  }

  // Draw node markers
  ringNodes.forEach(node => {
    const nx = ringCenter.x + Math.cos(node.angle) * ringRadius;
    const ny = ringCenter.y + Math.sin(node.angle) * ringRadius;
    
    ctx.beginPath();
    ctx.arc(nx, ny, 12, 0, Math.PI * 2);
    ctx.fillStyle = node.color;
    ctx.fill();
    ctx.strokeStyle = '#0a0e1a';
    ctx.lineWidth = 3;
    ctx.stroke();
    
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 12px Inter';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(node.id.charAt(5), nx + Math.cos(node.angle) * 22, ny + Math.sin(node.angle) * 22);
  });

  // Draw keys
  ringKeys.forEach(k => {
    let fill = '#fff', stroke = 'rgba(255,255,255,0.5)';
    if(ringNodes.length > 0) {
      const owner = getAssignedNode(k.angle);
      k.owner = owner.id;
      fill = owner.color;
      stroke = owner.color + '80';
    } else {
      k.owner = null;
    }
    
    const kx = ringCenter.x + Math.cos(k.angle) * (ringRadius - 25);
    const ky = ringCenter.y + Math.sin(k.angle) * (ringRadius - 25);
    
    ctx.beginPath();
    ctx.arc(kx, ky, 6, 0, Math.PI * 2);
    ctx.fillStyle = fill;
    ctx.fill();
    
    ctx.beginPath();
    ctx.moveTo(kx, ky);
    ctx.lineTo(ringCenter.x + Math.cos(k.angle) * ringRadius, ringCenter.y + Math.sin(k.angle) * ringRadius);
    ctx.strokeStyle = stroke;
    ctx.lineWidth = 1;
    ctx.stroke();
  });

  // Legend
  const legend = $('#ch-ring-legend');
  if(legend) {
    legend.innerHTML = ringNodes.map(n => `
      <div class="ch-ring-legend-item">
        <div class="ch-ring-legend-color" style="background:${n.color}"></div>
        <span>${n.id} (${ringKeys.filter(k=>k.owner===n.id).length} keys)</span>
      </div>
    `).join('');
  }
}

if($('#btn-ch-add-node')) {
  $('#btn-ch-add-node').addEventListener('click', () => {
    if (ringNodes.length >= 6) return chrLog("Max servers reached.");
    const id = 'Node ' + String.fromCharCode(65 + ringNodes.length);
    const colors = ['#4cc9f0', '#9b5de5', '#06d6a0', '#ff6b35', '#ef476f', '#ffd166'];
    const angle = Math.random() * Math.PI * 2;
    ringNodes.push({id, angle, color: colors[ringNodes.length % colors.length]});
    
    let moved = 0;
    ringKeys.forEach(k => {
      const newOwner = getAssignedNode(k.angle);
      if (newOwner.id === id) moved++;
    });
    
    chrLog(`➕ Added ${id}. Only ${moved}/${ringKeys.length} keys remapped.`);
    renderRing();
  });
  
  $('#btn-ch-remove-node').addEventListener('click', () => {
    if (ringNodes.length <= 1) return chrLog("Cannot remove last server.");
    const removed = ringNodes.pop();
    
    const affected = ringKeys.filter(k => k.owner === removed.id).length;
    chrLog(`➖ Removed ${removed.id}. ${affected} keys seamlessly remapped to neighbor.`);
    renderRing();
  });

  $('#btn-ch-add-key').addEventListener('click', () => {
    ringKeys.push({ id: ringKeyId++, angle: Math.random() * Math.PI * 2 });
    renderRing();
  });

  $('#btn-ch-add5').addEventListener('click', () => {
    for(let i=0; i<5; i++) ringKeys.push({ id: ringKeyId++, angle: Math.random() * Math.PI * 2 });
    renderRing();
  });

  $('#btn-ch-reset').addEventListener('click', () => {
    ringNodes = [
        {id: 'Node A', angle: 0, color: '#4cc9f0'},
        {id: 'Node B', angle: Math.PI * 2 / 3, color: '#9b5de5'},
        {id: 'Node C', angle: Math.PI * 4 / 3, color: '#06d6a0'}
    ];
    ringKeys = [];
    ringKeyId = 1;
    chrLogEntries = [];
    if($('#ch-ring-log')) $('#ch-ring-log').innerHTML = '';
    renderRing();
  });
  
  renderRing(); // init
}

// C. Virtual Nodes Demo
const vnodeNodes = [
  {id: 'Server A', color: '#4cc9f0'},
  {id: 'Server B', color: '#9b5de5'},
  {id: 'Server C', color: '#06d6a0'}
];
function renderVNodes(vCount) {
  const container = $('#ch-vnode-bars');
  if(!container) return;
  
  let ring = [];
  vnodeNodes.forEach((node, i) => {
    for(let v=0; v<vCount; v++) {
      // FNV-1a hash for excellent avalanche and uniform distribution
      let str = node.id + '#' + v;
      let h = 0x811c9dc5;
      for (let c = 0; c < str.length; c++) {
        h ^= str.charCodeAt(c);
        h = Math.imul(h, 0x01000193);
      }
      let normalized = (h >>> 0) / 4294967296;
      ring.push({ owner: node, angle: normalized * 360 });
    }
  });
  ring.sort((a,b) => a.angle - b.angle);
  
  let ownership = { 'Server A': 0, 'Server B': 0, 'Server C': 0 };
  for(let i=0; i<ring.length; i++) {
    let nextIdx = (i+1) % ring.length;
    let dist = ring[nextIdx].angle - ring[i].angle;
    if (dist < 0) dist += 360;
    ownership[ring[nextIdx].owner.id] += dist;
  }
  
  container.innerHTML = vnodeNodes.map(n => {
    const pct = (ownership[n.id] / 360 * 100).toFixed(1);
    return `
      <div class="ch-vnode-bar-container">
        <div class="ch-vnode-label" style="color:${n.color}">${n.id}</div>
        <div class="ch-vnode-track">
          <div class="ch-vnode-fill" style="width:${pct}%;background:${n.color}"></div>
        </div>
        <div class="ch-vnode-pct">${pct}%</div>
      </div>
    `;
  }).join('');
}
if($('#slider-vnodes')) {
  $('#slider-vnodes').addEventListener('input', (e) => {
    const valMap = [1, 2, 5, 10, 20, 50, 100, 200];
    const vCount = valMap[e.target.value - 1];
    $('#val-vnodes').textContent = vCount;
    renderVNodes(vCount);
  });
  renderVNodes(1);
}

