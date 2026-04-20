/* ═══════════════════════════════════════════════════════
   KAFKA ARCHITECTURE VISUALIZER — Interactive Logic
   ═══════════════════════════════════════════════════════ */

;(function () {
  'use strict';

  /* ──────────────────────────────────────────────────────
     1. SCROLL REVEAL (Intersection Observer)
     ────────────────────────────────────────────────────── */
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          e.target.classList.add('visible');
        }
      });
    },
    { threshold: 0.1 }
  );
  document.querySelectorAll('.reveal').forEach((el) => observer.observe(el));

  /* ──────────────────────────────────────────────────────
     2. CLUSTER / BROKER OVERVIEW
     ────────────────────────────────────────────────────── */
  const BROKERS = [
    {
      id: 0,
      name: 'Broker 0',
      icon: '🖥️',
      partitions: [
        { topic: 'orders', id: 0, role: 'leader' },
        { topic: 'orders', id: 2, role: 'follower' },
        { topic: 'users', id: 1, role: 'leader' },
      ],
    },
    {
      id: 1,
      name: 'Broker 1',
      icon: '🖥️',
      partitions: [
        { topic: 'orders', id: 1, role: 'leader' },
        { topic: 'orders', id: 0, role: 'follower' },
        { topic: 'users', id: 0, role: 'leader' },
      ],
    },
    {
      id: 2,
      name: 'Broker 2',
      icon: '🖥️',
      partitions: [
        { topic: 'orders', id: 2, role: 'leader' },
        { topic: 'orders', id: 1, role: 'follower' },
        { topic: 'users', id: 1, role: 'follower' },
      ],
    },
  ];

  function renderCluster() {
    const c = document.getElementById('cluster-viz');
    if (!c) return;
    c.innerHTML = '';
    BROKERS.forEach((b) => {
      const node = document.createElement('div');
      node.className = 'broker-node';
      node.dataset.brokerId = b.id;
      node.innerHTML = `
        <div class="broker-node__icon">${b.icon}</div>
        <div class="broker-node__title">${b.name}</div>
        <div class="broker-node__status">● Online</div>
        <div class="broker-node__partitions">
          ${b.partitions
            .map(
              (p) =>
                `<span class="broker-partition-chip ${p.role}">${p.topic}-P${p.id} (${p.role === 'leader' ? 'L' : 'F'})</span>`
            )
            .join('')}
        </div>
      `;
      c.appendChild(node);
    });
  }
  renderCluster();

  /* ──────────────────────────────────────────────────────
     3. TOPICS & PARTITIONS  
     ────────────────────────────────────────────────────── */
  const sliderPart = document.getElementById('slider-partitions');
  const valPart = document.getElementById('val-partitions');
  const partGrid = document.getElementById('partition-grid');

  function renderPartitions(count) {
    if (!partGrid) return;
    partGrid.innerHTML = '';
    for (let i = 0; i < count; i++) {
      const row = document.createElement('div');
      row.className = 'partition-row';
      const label = document.createElement('span');
      label.className = 'partition-label';
      label.textContent = `Partition ${i}`;
      const log = document.createElement('div');
      log.className = 'partition-log';
      // Show some pre-filled offsets
      const filled = 3 + Math.floor(Math.random() * 5);
      for (let j = 0; j < 12; j++) {
        const cell = document.createElement('div');
        cell.className = 'log-cell' + (j < filled ? ' filled' : '');
        cell.textContent = j < filled ? j : '';
        log.appendChild(cell);
      }
      row.appendChild(label);
      row.appendChild(log);
      partGrid.appendChild(row);
    }
  }

  if (sliderPart) {
    renderPartitions(parseInt(sliderPart.value));
    sliderPart.addEventListener('input', () => {
      valPart.textContent = sliderPart.value;
      renderPartitions(parseInt(sliderPart.value));
    });
  }

  /* ──────────────────────────────────────────────────────
     4. PRODUCERS & MESSAGE FLOW
     ────────────────────────────────────────────────────── */
  const PRODUCER_PARTITIONS = 4;
  const producerGrid = document.getElementById('producer-partitions');
  const btnSendMsg = document.getElementById('btn-send-msg');
  const btnSendBurst = document.getElementById('btn-send-burst');
  const strategyToggle = document.getElementById('strategy-toggle');
  const producerHint = document.getElementById('producer-hint');

  let producerState = {
    strategy: 'round-robin',
    rrIndex: 0,
    partitions: [],
    keys: ['A', 'B', 'C', 'D'],
    keyColors: ['key-a', 'key-b', 'key-c', 'key-d'],
    msgCounter: 0,
  };

  function initProducerPartitions() {
    if (!producerGrid) return;
    producerGrid.innerHTML = '';
    producerState.partitions = [];
    for (let i = 0; i < PRODUCER_PARTITIONS; i++) {
      const row = document.createElement('div');
      row.className = 'partition-row';
      const label = document.createElement('span');
      label.className = 'partition-label';
      label.textContent = `Partition ${i}`;
      const log = document.createElement('div');
      log.className = 'partition-log';
      log.id = `prod-log-${i}`;
      row.appendChild(label);
      row.appendChild(log);
      producerGrid.appendChild(row);
      producerState.partitions.push([]);
    }
  }

  function sendMessage() {
    const keyIdx = Math.floor(Math.random() * producerState.keys.length);
    const key = producerState.keys[keyIdx];
    const colorCls = producerState.keyColors[keyIdx];
    let partIdx;

    if (producerState.strategy === 'round-robin') {
      partIdx = producerState.rrIndex % PRODUCER_PARTITIONS;
      producerState.rrIndex++;
    } else {
      // Key-based: hash to partition
      partIdx = key.charCodeAt(0) % PRODUCER_PARTITIONS;
    }

    const log = document.getElementById(`prod-log-${partIdx}`);
    if (!log) return;

    const cell = document.createElement('div');
    producerState.msgCounter++;
    cell.className = `log-cell filled new-msg ${colorCls}`;
    cell.textContent = `${key}${producerState.msgCounter}`;
    cell.title = `Key: ${key} | Partition: ${partIdx}`;
    log.appendChild(cell);

    // Auto-scroll log
    log.scrollLeft = log.scrollWidth;
  }

  if (strategyToggle) {
    strategyToggle.querySelectorAll('.strategy-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        strategyToggle.querySelectorAll('.strategy-btn').forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        producerState.strategy = btn.dataset.strategy;
        producerState.rrIndex = 0;
        initProducerPartitions();
        producerState.msgCounter = 0;
        if (producerHint) {
          producerHint.textContent =
            producerState.strategy === 'round-robin'
              ? 'Click "Send Message" to see round-robin distribution across partitions.'
              : 'Click "Send Message" — same key always goes to the same partition (hash-based).';
        }
      });
    });
  }

  if (btnSendMsg) {
    btnSendMsg.addEventListener('click', () => sendMessage());
  }

  if (btnSendBurst) {
    btnSendBurst.addEventListener('click', () => {
      let i = 0;
      const iv = setInterval(() => {
        sendMessage();
        i++;
        if (i >= 10) clearInterval(iv);
      }, 120);
    });
  }

  initProducerPartitions();

  /* ──────────────────────────────────────────────────────
     5. CONSUMER GROUPS & PARALLEL PROCESSING  
     ────────────────────────────────────────────────────── */
  const sliderCgP = document.getElementById('slider-cg-partitions');
  const sliderCgC = document.getElementById('slider-cg-consumers');
  const valCgP = document.getElementById('val-cg-partitions');
  const valCgC = document.getElementById('val-cg-consumers');
  const cgPartitionsEl = document.getElementById('cg-partitions');
  const cgConsumersEl = document.getElementById('cg-consumers');
  const cgSvg = document.getElementById('cg-svg');
  const cgMetrics = document.getElementById('cg-metrics');

  const ASSIGNMENT_COLORS = [
    '#ff6b35', '#06d6a0', '#4cc9f0', '#9b5de5', '#ffd166', '#ef476f',
  ];

  function renderConsumerGroup() {
    if (!cgPartitionsEl || !cgConsumersEl || !cgSvg) return;

    const pCount = parseInt(sliderCgP.value);
    const cCount = parseInt(sliderCgC.value);

    // Clear
    cgPartitionsEl.innerHTML = '';
    cgConsumersEl.innerHTML = '';

    // Build assignment: round-robin assign partitions to consumers
    const assignments = new Array(cCount).fill(null).map(() => []);
    for (let i = 0; i < pCount; i++) {
      assignments[i % cCount].push(i);
    }

    // Render partitions
    for (let i = 0; i < pCount; i++) {
      const el = document.createElement('div');
      el.className = 'cg-partition';
      el.id = `cg-p-${i}`;
      // Find which consumer owns this
      const ownerIdx = i % cCount;
      el.style.borderColor = ASSIGNMENT_COLORS[ownerIdx % ASSIGNMENT_COLORS.length];
      el.innerHTML = `<span class="cg-partition__dot" style="background:${ASSIGNMENT_COLORS[ownerIdx % ASSIGNMENT_COLORS.length]}"></span> Partition ${i}`;
      cgPartitionsEl.appendChild(el);
    }

    // Render consumers
    for (let i = 0; i < cCount; i++) {
      const el = document.createElement('div');
      const isIdle = assignments[i].length === 0;
      el.className = 'cg-consumer' + (isIdle ? ' idle' : '');
      el.id = `cg-c-${i}`;
      if (!isIdle) {
        el.style.borderColor = ASSIGNMENT_COLORS[i % ASSIGNMENT_COLORS.length];
      }
      el.innerHTML = `<span class="cg-consumer__dot" ${!isIdle ? `style="background:${ASSIGNMENT_COLORS[i % ASSIGNMENT_COLORS.length]}"` : ''}></span> Consumer ${i}${isIdle ? '' : ` <span style="font-size:0.7rem;color:var(--text-muted);margin-left:4px;">[P${assignments[i].join(', P')}]</span>`}`;
      cgConsumersEl.appendChild(el);
    }

    // Draw SVG arrows
    drawCgArrows(pCount, cCount, assignments);

    // Metrics
    renderCgMetrics(pCount, cCount, assignments);
  }

  function drawCgArrows(pCount, cCount, assignments) {
    if (!cgSvg) return;
    // We need to wait a tick for DOM to update positions
    requestAnimationFrame(() => {
      const arrowContainer = document.getElementById('cg-arrows');
      if (!arrowContainer) return;
      const containerRect = arrowContainer.getBoundingClientRect();

      cgSvg.setAttribute('width', containerRect.width);
      cgSvg.setAttribute('height', Math.max(containerRect.height, 1));
      cgSvg.innerHTML = '';

      // For each assignment, draw a line from partition to consumer
      for (let cIdx = 0; cIdx < cCount; cIdx++) {
        assignments[cIdx].forEach((pIdx) => {
          const pEl = document.getElementById(`cg-p-${pIdx}`);
          const cEl = document.getElementById(`cg-c-${cIdx}`);
          if (!pEl || !cEl) return;

          const pRect = pEl.getBoundingClientRect();
          const cRect = cEl.getBoundingClientRect();

          const x1 = 0;
          const y1 = pRect.top - containerRect.top + pRect.height / 2;
          const x2 = containerRect.width;
          const y2 = cRect.top - containerRect.top + cRect.height / 2;

          const midX = containerRect.width / 2;
          const color = ASSIGNMENT_COLORS[cIdx % ASSIGNMENT_COLORS.length];

          const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
          path.setAttribute('d', `M ${x1} ${y1} C ${midX} ${y1}, ${midX} ${y2}, ${x2} ${y2}`);
          path.setAttribute('stroke', color);
          path.setAttribute('stroke-width', '2');
          path.setAttribute('fill', 'none');
          path.setAttribute('opacity', '0.6');
          path.setAttribute('stroke-dasharray', '6 3');

          // Animate dash
          const animate = document.createElementNS('http://www.w3.org/2000/svg', 'animate');
          animate.setAttribute('attributeName', 'stroke-dashoffset');
          animate.setAttribute('from', '0');
          animate.setAttribute('to', '-18');
          animate.setAttribute('dur', '1s');
          animate.setAttribute('repeatCount', 'indefinite');
          path.appendChild(animate);

          cgSvg.appendChild(path);
        });
      }
    });
  }

  function renderCgMetrics(pCount, cCount, assignments) {
    if (!cgMetrics) return;
    const activeConsumers = assignments.filter((a) => a.length > 0).length;
    const idleConsumers = cCount - activeConsumers;
    const maxPartitionsPerConsumer = Math.max(...assignments.map((a) => a.length));

    cgMetrics.innerHTML = `
      <div class="cg-metric">
        <div class="cg-metric__value">${pCount}</div>
        <div class="cg-metric__label">Partitions</div>
      </div>
      <div class="cg-metric">
        <div class="cg-metric__value">${activeConsumers}</div>
        <div class="cg-metric__label">Active Consumers</div>
      </div>
      <div class="cg-metric">
        <div class="cg-metric__value">${idleConsumers}</div>
        <div class="cg-metric__label" style="color: ${idleConsumers > 0 ? 'var(--accent-red)' : 'var(--text-muted)'}">Idle Consumers</div>
      </div>
      <div class="cg-metric">
        <div class="cg-metric__value">${maxPartitionsPerConsumer}</div>
        <div class="cg-metric__label">Max Partitions/Consumer</div>
      </div>
      <div class="cg-metric">
        <div class="cg-metric__value">${Math.min(pCount, cCount)}x</div>
        <div class="cg-metric__label">Parallelism Level</div>
      </div>
    `;
  }

  if (sliderCgP && sliderCgC) {
    renderConsumerGroup();
    sliderCgP.addEventListener('input', () => {
      valCgP.textContent = sliderCgP.value;
      renderConsumerGroup();
    });
    sliderCgC.addEventListener('input', () => {
      valCgC.textContent = sliderCgC.value;
      renderConsumerGroup();
    });
  }

  // Multi-consumer-group demo
  function renderMultiCg() {
    const gridA = document.getElementById('multi-cg-a');
    const gridB = document.getElementById('multi-cg-b');
    if (!gridA || !gridB) return;

    const partitions = 3;
    const messagesA = [
      ['A1', 'A2', 'A3'],
      ['B1', 'B2'],
      ['C1', 'C2', 'C3', 'C4'],
    ];
    // Group B reads the SAME data independently
    const messagesB = [
      ['A1', 'A2', 'A3'],
      ['B1', 'B2'],
      ['C1', 'C2', 'C3', 'C4'],
    ];

    [
      [gridA, messagesA, 'A'],
      [gridB, messagesB, 'B'],
    ].forEach(([grid, msgs, group]) => {
      grid.innerHTML = '';
      for (let i = 0; i < partitions; i++) {
        const row = document.createElement('div');
        row.className = 'partition-row';
        const label = document.createElement('span');
        label.className = 'partition-label';
        label.textContent = `P${i}`;
        label.style.minWidth = '40px';
        const log = document.createElement('div');
        log.className = 'partition-log';
        msgs[i].forEach((m) => {
          const cell = document.createElement('div');
          const keyClass = m.startsWith('A') ? 'key-a' : m.startsWith('B') ? 'key-b' : 'key-c';
          cell.className = `log-cell filled ${keyClass}`;
          cell.textContent = m;
          cell.style.fontSize = '0.65rem';
          log.appendChild(cell);
        });
        // Show offset pointer
        const offsetEl = document.createElement('span');
        offsetEl.style.cssText = 'font-family:var(--font-mono);font-size:0.7rem;color:var(--text-muted);margin-left:8px;white-space:nowrap;';
        offsetEl.textContent = `offset: ${msgs[i].length}`;
        row.appendChild(label);
        row.appendChild(log);
        row.appendChild(offsetEl);
        grid.appendChild(row);
      }
    });
  }
  renderMultiCg();

  /* ──────────────────────────────────────────────────────
     6. MESSAGE ORDERING DEMO  
     ────────────────────────────────────────────────────── */
  const btnOrdering = document.getElementById('btn-ordering-demo');
  const orderingPerPartition = document.getElementById('ordering-per-partition');
  const orderingGlobal = document.getElementById('ordering-global');

  function runOrderingDemo() {
    if (!orderingPerPartition || !orderingGlobal) return;
    orderingPerPartition.innerHTML = '';
    orderingGlobal.innerHTML = '';

    // Simulate messages with keys
    const messages = [
      { key: 'A', seq: 1 },
      { key: 'B', seq: 1 },
      { key: 'A', seq: 2 },
      { key: 'C', seq: 1 },
      { key: 'B', seq: 2 },
      { key: 'A', seq: 3 },
      { key: 'C', seq: 2 },
      { key: 'B', seq: 3 },
      { key: 'A', seq: 4 },
      { key: 'C', seq: 3 },
    ];

    // Per-partition: group by key, show in order
    const byKey = {};
    messages.forEach((m) => {
      if (!byKey[m.key]) byKey[m.key] = [];
      byKey[m.key].push(m);
    });

    let delay = 0;
    Object.entries(byKey).forEach(([key, msgs]) => {
      // Add a partition label
      const partLabel = document.createElement('div');
      partLabel.style.cssText = 'width:100%;font-family:var(--font-mono);font-size:0.75rem;color:var(--text-muted);margin-top:8px;margin-bottom:2px;';
      partLabel.textContent = `── Key "${key}" partition ──`;
      setTimeout(() => orderingPerPartition.appendChild(partLabel), delay * 100);
      delay++;

      msgs.forEach((m) => {
        const el = document.createElement('div');
        const colorClass = m.key === 'A' ? 'key-a' : m.key === 'B' ? 'key-b' : 'key-c';
        el.className = `order-msg ${colorClass}`;
        el.textContent = `${m.key}${m.seq}`;
        setTimeout(() => {
          orderingPerPartition.appendChild(el);
        }, delay * 100);
        delay++;
      });
    });

    // Global: show interleaved (as consumer might see from multiple partitions)
    const shuffled = [...messages];
    // Shuffle but keep per-key order intact — interleave
    const interleaved = [];
    const queues = { A: [], B: [], C: [] };
    messages.forEach((m) => queues[m.key].push(m));
    const keys = Object.keys(queues);
    let idx = 0;
    while (interleaved.length < messages.length) {
      const k = keys[idx % keys.length];
      if (queues[k].length > 0) {
        interleaved.push(queues[k].shift());
      }
      idx++;
    }

    let gDelay = 0;
    interleaved.forEach((m) => {
      const el = document.createElement('div');
      const colorClass = m.key === 'A' ? 'key-a' : m.key === 'B' ? 'key-b' : 'key-c';
      el.className = `order-msg ${colorClass}`;
      el.textContent = `${m.key}${m.seq}`;
      setTimeout(() => {
        orderingGlobal.appendChild(el);
      }, gDelay * 150);
      gDelay++;
    });
  }

  if (btnOrdering) {
    btnOrdering.addEventListener('click', runOrderingDemo);
    // Auto-run on first view
    runOrderingDemo();
  }

  /* ──────────────────────────────────────────────────────
     7. REPLICATION & FAULT TOLERANCE
     ────────────────────────────────────────────────────── */
  const replicationGrid = document.getElementById('replication-grid');
  const btnKillLeader = document.getElementById('btn-kill-leader');
  const btnRestore = document.getElementById('btn-restore');
  const replicationHint = document.getElementById('replication-hint');

  let replicationState = {
    offsets: 8,
    replicas: [
      { name: 'Broker 0', role: 'leader', syncedTo: 8, alive: true },
      { name: 'Broker 1', role: 'follower', syncedTo: 7, alive: true },
      { name: 'Broker 2', role: 'follower', syncedTo: 8, alive: true },
    ],
  };

  function renderReplication() {
    if (!replicationGrid) return;
    replicationGrid.innerHTML = '';

    replicationState.replicas.forEach((r, idx) => {
      const row = document.createElement('div');
      row.className = 'replica-row';
      if (!r.alive) row.style.opacity = '0.3';

      const label = document.createElement('span');
      label.className = `replica-label ${r.role}`;
      label.innerHTML = `${r.name}<br><span style="font-size:0.65rem;color:var(--text-muted);">${r.role.toUpperCase()}${!r.alive ? ' ✗ DEAD' : ''}</span>`;

      const segs = document.createElement('div');
      segs.className = 'replica-segments';
      for (let i = 0; i < replicationState.offsets; i++) {
        const seg = document.createElement('div');
        const isSynced = i < r.syncedTo;
        seg.className = `replica-seg ${r.role === 'leader' ? 'leader-seg' : isSynced ? 'synced' : 'lagging'}`;
        seg.textContent = i;
        if (!r.alive) seg.style.opacity = '0.3';
        segs.appendChild(seg);
      }

      row.appendChild(label);
      row.appendChild(segs);
      replicationGrid.appendChild(row);
    });
  }

  if (btnKillLeader) {
    btnKillLeader.addEventListener('click', () => {
      const leader = replicationState.replicas.find((r) => r.role === 'leader' && r.alive);
      if (!leader) {
        if (replicationHint) replicationHint.textContent = 'No leader to kill! Click Restore first.';
        return;
      }
      leader.alive = false;
      leader.role = 'dead';

      // Elect new leader from ISR (fully synced follower)
      const candidate = replicationState.replicas.find(
        (r) => r.alive && r.role === 'follower' && r.syncedTo >= replicationState.offsets - 1
      );
      if (candidate) {
        setTimeout(() => {
          candidate.role = 'leader';
          renderReplication();
          if (replicationHint) {
            replicationHint.textContent = `⚡ ${leader.name} failed! ${candidate.name} elected as new leader (was in ISR).`;
            replicationHint.style.color = 'var(--accent-teal)';
          }
        }, 600);
      }
      renderReplication();
      if (replicationHint) {
        replicationHint.textContent = `⚡ Killing ${leader.name}... electing new leader...`;
        replicationHint.style.color = 'var(--accent-red)';
      }
    });
  }

  if (btnRestore) {
    btnRestore.addEventListener('click', () => {
      replicationState.replicas = [
        { name: 'Broker 0', role: 'leader', syncedTo: 8, alive: true },
        { name: 'Broker 1', role: 'follower', syncedTo: 7, alive: true },
        { name: 'Broker 2', role: 'follower', syncedTo: 8, alive: true },
      ];
      renderReplication();
      if (replicationHint) {
        replicationHint.textContent = 'Click "Kill Leader" to simulate a broker failure and watch leader election happen.';
        replicationHint.style.color = '';
      }
    });
  }

  renderReplication();

  /* ──────────────────────────────────────────────────────
     8. ACK LEVELS  
     ────────────────────────────────────────────────────── */
  const ackLevels = document.getElementById('ack-levels');
  if (ackLevels) {
    ackLevels.querySelectorAll('.ack-card').forEach((card) => {
      card.addEventListener('click', () => {
        ackLevels.querySelectorAll('.ack-card').forEach((c) => c.classList.remove('selected'));
        card.classList.add('selected');
      });
    });
  }

  /* ──────────────────────────────────────────────────────
     9. HIGH THROUGHPUT VISUALIZATIONS 
     ────────────────────────────────────────────────────── */

  // — 9a. Sequential I/O —
  const btnSeqIo = document.getElementById('btn-seqio');
  const seqTrack = document.getElementById('seqio-seq-track');
  const randTrack = document.getElementById('seqio-rand-track');
  const seqTime = document.getElementById('seqio-seq-time');
  const randTime = document.getElementById('seqio-rand-time');

  function runSeqIoDemo() {
    if (!seqTrack || !randTrack) return;
    seqTrack.innerHTML = '';
    randTrack.innerHTML = '';
    seqTime.textContent = '—';
    seqTime.style.color = '';
    randTime.textContent = '—';
    randTime.style.color = '';

    const BLOCKS = 16;
    // Pre-create blocks
    const seqBlocks = [];
    const randBlocks = [];
    for (let i = 0; i < BLOCKS; i++) {
      const sb = document.createElement('div');
      sb.className = 'seqio-block seq';
      sb.textContent = i;
      sb.style.opacity = '0.3';
      seqTrack.appendChild(sb);
      seqBlocks.push(sb);

      const rb = document.createElement('div');
      rb.className = 'seqio-block rand';
      rb.textContent = i;
      rb.style.opacity = '0.3';
      randTrack.appendChild(rb);
      randBlocks.push(rb);
    }

    // Sequential: fill in order, fast
    let si = 0;
    const seqInterval = setInterval(() => {
      if (si > 0) { seqBlocks[si - 1].classList.remove('active'); seqBlocks[si - 1].style.opacity = '1'; }
      if (si >= BLOCKS) {
        clearInterval(seqInterval);
        seqTime.textContent = `~${(BLOCKS * 50)}ms`;
        seqTime.style.color = 'var(--accent-teal)';
        return;
      }
      seqBlocks[si].classList.add('active');
      seqBlocks[si].style.opacity = '1';
      si++;
    }, 50);

    // Random: fill in random order, slow (with seek delay)
    const order = Array.from({ length: BLOCKS }, (_, i) => i);
    for (let i = order.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [order[i], order[j]] = [order[j], order[i]];
    }
    let ri = 0;
    const randInterval = setInterval(() => {
      if (ri > 0) { randBlocks[order[ri - 1]].classList.remove('active'); randBlocks[order[ri - 1]].style.opacity = '1'; }
      if (ri >= BLOCKS) {
        clearInterval(randInterval);
        randTime.textContent = `~${(BLOCKS * 180)}ms`;
        randTime.style.color = 'var(--accent-red)';
        return;
      }
      randBlocks[order[ri]].classList.add('active');
      randBlocks[order[ri]].style.opacity = '1';
      ri++;
    }, 180);
  }

  if (btnSeqIo) btnSeqIo.addEventListener('click', runSeqIoDemo);

  // — 9b. Zero-Copy —
  const zcToggle = document.getElementById('zerocopy-toggle');
  const btnZc = document.getElementById('btn-zerocopy');
  const zcDemo = document.getElementById('zerocopy-demo');
  let zcMode = 'zerocopy';

  const ZC_STAGES = {
    traditional: [
      { icon: '💿', name: 'Disk', copy: 'Copy 1' },
      { icon: '🔧', name: 'Kernel Buffer', copy: '' },
      { icon: '📋', name: 'User Space', copy: 'Copy 2' },
      { icon: '📋', name: 'Socket Buffer', copy: 'Copy 3' },
      { icon: '🌐', name: 'NIC', copy: 'Copy 4' },
      { icon: '📡', name: 'Network', copy: '' },
    ],
    zerocopy: [
      { icon: '💿', name: 'Disk', copy: 'Copy 1' },
      { icon: '🔧', name: 'Kernel Buffer', copy: '' },
      { icon: '📋', name: 'User Space', copy: '', skip: true },
      { icon: '📋', name: 'Socket Buffer', copy: '', skip: true },
      { icon: '🌐', name: 'NIC', copy: 'Copy 2' },
      { icon: '📡', name: 'Network', copy: '' },
    ],
  };

  function renderZcPipeline(mode, animate) {
    if (!zcDemo) return;
    const stages = ZC_STAGES[mode];
    zcDemo.innerHTML = '';
    const pipeline = document.createElement('div');
    pipeline.className = 'zc-pipeline';

    stages.forEach((s, i) => {
      if (i > 0) {
        const arrow = document.createElement('span');
        arrow.className = 'zc-arrow';
        arrow.textContent = '→';
        if (s.skip) arrow.style.opacity = '0.2';
        pipeline.appendChild(arrow);
      }
      const stage = document.createElement('div');
      stage.className = 'zc-stage' + (s.skip ? ' skipped' : '');
      stage.innerHTML = `
        <div class="zc-stage__icon">${s.icon}</div>
        <div class="zc-stage__name">${s.name}</div>
        ${s.copy ? `<div class="zc-stage__copy">${s.copy}</div>` : ''}
      `;
      pipeline.appendChild(stage);
    });

    zcDemo.appendChild(pipeline);

    const summary = document.createElement('div');
    summary.className = 'zc-summary';
    const copies = stages.filter(s => s.copy && !s.skip).length;
    const color = mode === 'zerocopy' ? 'var(--accent-teal)' : 'var(--accent-red)';
    summary.innerHTML = `<span style="color:${color}">${copies} data copies</span> — ${mode === 'zerocopy' ? 'sendfile() bypasses user space entirely' : '4 copies + 2 context switches'}`;
    zcDemo.appendChild(summary);

    if (animate) {
      const stageEls = pipeline.querySelectorAll('.zc-stage:not(.skipped)');
      const arrowEls = pipeline.querySelectorAll('.zc-arrow');
      stageEls.forEach((el, i) => {
        setTimeout(() => {
          el.classList.add('highlight');
          setTimeout(() => el.classList.remove('highlight'), 400);
        }, i * 300);
      });
      arrowEls.forEach((el, i) => {
        if (el.style.opacity !== '0.2') {
          setTimeout(() => el.classList.add('active-arrow'), (i + 0.5) * 300);
        }
      });
    }
  }

  if (zcToggle) {
    zcToggle.querySelectorAll('.strategy-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        zcToggle.querySelectorAll('.strategy-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        zcMode = btn.dataset.mode;
        renderZcPipeline(zcMode, false);
      });
    });
  }
  if (btnZc) btnZc.addEventListener('click', () => renderZcPipeline(zcMode, true));
  renderZcPipeline(zcMode, false);

  // — 9c. Batching —
  const sliderBatch = document.getElementById('slider-batch');
  const valBatch = document.getElementById('val-batch');
  const btnBatchSend = document.getElementById('btn-batch-send');
  const batchBuffer = document.getElementById('batch-buffer');
  const batchPackets = document.getElementById('batch-packets');
  const batchReceived = document.getElementById('batch-received');
  const batchStats = document.getElementById('batch-stats');

  if (sliderBatch) {
    sliderBatch.addEventListener('input', () => {
      valBatch.textContent = sliderBatch.value;
    });
  }

  if (btnBatchSend) {
    btnBatchSend.addEventListener('click', () => {
      const batchSize = parseInt(sliderBatch.value);
      const totalMsgs = 8;
      if (batchBuffer) batchBuffer.innerHTML = '';
      if (batchPackets) batchPackets.innerHTML = '';
      if (batchReceived) batchReceived.innerHTML = '';

      const batches = Math.ceil(totalMsgs / batchSize);
      let msgIdx = 0;

      // Animate: add messages to buffer, then send batch
      function sendNextBatch(batchNum) {
        if (batchNum >= batches) {
          // Show stats
          if (batchStats) {
            batchStats.innerHTML = `
              <span>Network calls: <strong>${batches}</strong></span>
              <span>Messages/call: <strong>${batchSize}</strong></span>
              <span>Reduction: <strong>${Math.round((1 - batches / totalMsgs) * 100)}%</strong> fewer calls</span>
            `;
          }
          return;
        }

        const msgsInBatch = Math.min(batchSize, totalMsgs - batchNum * batchSize);
        let added = 0;

        const addInterval = setInterval(() => {
          if (added >= msgsInBatch) {
            clearInterval(addInterval);
            // Send the batch (move from buffer to network)
            setTimeout(() => {
              // Create packet
              const pkt = document.createElement('div');
              pkt.className = 'batch-packet';
              pkt.textContent = `📦 Batch ${batchNum + 1} (${msgsInBatch} msgs)`;
              if (batchPackets) batchPackets.appendChild(pkt);

              // Add to received
              setTimeout(() => {
                for (let k = 0; k < msgsInBatch; k++) {
                  const recv = document.createElement('div');
                  recv.className = 'batch-msg';
                  recv.textContent = `M${batchNum * batchSize + k + 1}`;
                  recv.style.background = 'rgba(6,214,160,0.12)';
                  recv.style.borderColor = 'rgba(6,214,160,0.3)';
                  recv.style.color = 'var(--accent-teal)';
                  if (batchReceived) batchReceived.appendChild(recv);
                }
                sendNextBatch(batchNum + 1);
              }, 200);
            }, 150);
            return;
          }

          msgIdx++;
          const msg = document.createElement('div');
          msg.className = 'batch-msg';
          msg.textContent = `M${msgIdx}`;
          if (batchBuffer) batchBuffer.appendChild(msg);
          added++;
        }, 80);
      }

      sendNextBatch(0);
    });
  }

  // — 9d. Page Cache —
  const btnCacheHot = document.getElementById('btn-cache-hot');
  const btnCacheCold = document.getElementById('btn-cache-cold');
  const cacheBlocks = document.getElementById('cache-blocks');
  const diskBlocks = document.getElementById('disk-blocks');
  const cacheResult = document.getElementById('cache-result');

  function initCache() {
    if (!cacheBlocks || !diskBlocks) return;
    cacheBlocks.innerHTML = '';
    diskBlocks.innerHTML = '';

    // Disk has offsets 0-15; cache has recent ones (10-15)
    for (let i = 0; i < 16; i++) {
      const isCached = i >= 10;
      const cb = document.createElement('div');
      cb.className = `cache-block ${isCached ? 'in-cache' : 'not-cached'}`;
      cb.textContent = `O:${i}`;
      cb.id = `cache-${i}`;
      cacheBlocks.appendChild(cb);

      const db = document.createElement('div');
      db.className = 'cache-block on-disk';
      db.textContent = `O:${i}`;
      db.id = `disk-${i}`;
      diskBlocks.appendChild(db);
    }
    if (cacheResult) cacheResult.textContent = '';
  }

  function readCache(hot) {
    // Reset all highlights
    document.querySelectorAll('.cache-block').forEach(b => {
      b.classList.remove('hit', 'miss');
    });

    if (hot) {
      // Read offsets 12-15 (in cache)
      const offsets = [12, 13, 14, 15];
      offsets.forEach((o, i) => {
        setTimeout(() => {
          const el = document.getElementById(`cache-${o}`);
          if (el) el.classList.add('hit');
        }, i * 200);
      });
      setTimeout(() => {
        if (cacheResult) {
          cacheResult.innerHTML = '<span style="color:var(--accent-teal)">✓ CACHE HIT — Served from RAM (~1ms)</span>';
        }
      }, offsets.length * 200);
    } else {
      // Read offsets 2-5 (NOT in cache)
      const offsets = [2, 3, 4, 5];
      offsets.forEach((o, i) => {
        setTimeout(() => {
          const cEl = document.getElementById(`cache-${o}`);
          if (cEl) cEl.classList.add('miss');
          const dEl = document.getElementById(`disk-${o}`);
          if (dEl) dEl.classList.add('hit');
        }, i * 300);
      });
      setTimeout(() => {
        if (cacheResult) {
          cacheResult.innerHTML = '<span style="color:var(--accent-yellow)">✗ CACHE MISS — Must read from disk (~10ms, 10x slower)</span>';
        }
      }, offsets.length * 300);
    }
  }

  initCache();
  if (btnCacheHot) btnCacheHot.addEventListener('click', () => readCache(true));
  if (btnCacheCold) btnCacheCold.addEventListener('click', () => readCache(false));

  // — 9e. Partitioning (Parallelism) —
  const sliderTpPart = document.getElementById('slider-tp-partitions');
  const valTpPart = document.getElementById('val-tp-partitions');
  const btnTpRace = document.getElementById('btn-tp-race');
  const parDemo = document.getElementById('parallelism-demo');
  const parStats = document.getElementById('parallelism-stats');

  if (sliderTpPart) {
    sliderTpPart.addEventListener('input', () => {
      valTpPart.textContent = sliderTpPart.value;
    });
  }

  function runParallelismRace() {
    if (!parDemo) return;
    const numPartitions = parseInt(sliderTpPart.value);
    const totalMsgs = 12;
    const msgsPerPartition = Math.ceil(totalMsgs / numPartitions);

    parDemo.innerHTML = '';
    const lanes = [];
    const COLORS = ['var(--accent-orange)', 'var(--accent-teal)', 'var(--accent-blue)', 'var(--accent-purple)', 'var(--accent-yellow)', 'var(--accent-red)'];

    for (let i = 0; i < numPartitions; i++) {
      const lane = document.createElement('div');
      lane.className = 'par-lane';
      const label = document.createElement('span');
      label.className = 'par-lane-label';
      label.style.color = COLORS[i % COLORS.length];
      label.textContent = `P${i}`;
      const track = document.createElement('div');
      track.className = 'par-track';

      const count = i < totalMsgs % numPartitions ? msgsPerPartition : (totalMsgs % numPartitions === 0 ? msgsPerPartition : msgsPerPartition - 1);
      const blocks = [];
      for (let j = 0; j < Math.max(count, 1); j++) {
        const block = document.createElement('div');
        block.className = 'par-block';
        block.textContent = `M${i * msgsPerPartition + j + 1}`;
        track.appendChild(block);
        blocks.push(block);
      }

      lane.appendChild(label);
      lane.appendChild(track);
      parDemo.appendChild(lane);
      lanes.push(blocks);
    }

    // Animate: all partitions process in parallel
    const PROCESS_TIME = 300; // ms per message
    let maxTime = 0;

    lanes.forEach((blocks, pIdx) => {
      blocks.forEach((block, mIdx) => {
        const start = mIdx * PROCESS_TIME;
        const end = start + PROCESS_TIME;
        if (end > maxTime) maxTime = end;

        setTimeout(() => {
          block.classList.add('processing');
        }, start);
        setTimeout(() => {
          block.classList.remove('processing');
          block.classList.add('done');
        }, end);
      });
    });

    const sequentialTime = totalMsgs * PROCESS_TIME;
    const parallelTime = maxTime;
    const speedup = (sequentialTime / parallelTime).toFixed(1);

    setTimeout(() => {
      if (parStats) {
        parStats.innerHTML = `
          <span>Sequential: <strong>${sequentialTime}ms</strong></span>
          <span>Parallel (${numPartitions}P): <strong>${parallelTime}ms</strong></span>
          <span>Speedup: <strong>${speedup}x faster</strong></span>
        `;
      }
    }, maxTime + 100);
  }

  if (btnTpRace) btnTpRace.addEventListener('click', runParallelismRace);

  // — 9f. Pull vs Push —
  const btnPullDemo = document.getElementById('btn-pull-demo');
  const pushArrows = document.getElementById('push-arrows');
  const pullArrows = document.getElementById('pull-arrows');
  const pushStatus = document.getElementById('push-status');
  const pullStatus = document.getElementById('pull-status');

  function runPullVsPush() {
    if (!pushArrows || !pullArrows) return;
    pushArrows.innerHTML = '';
    pullArrows.innerHTML = '';
    if (pushStatus) pushStatus.textContent = '';
    if (pullStatus) pullStatus.textContent = '';

    // Remove overflow class
    document.querySelectorAll('.pull-consumer').forEach(c => c.classList.remove('overflow'));

    const msgs = 8;

    // PUSH: broker sends at its own rate (fast), slow consumer overflows
    let pushCount = 0;
    const pushInterval = setInterval(() => {
      if (pushCount >= msgs) {
        clearInterval(pushInterval);
        setTimeout(() => {
          // Mark slow consumer as overflowed
          const slowConsumers = document.querySelectorAll('#pull-demo .pull-lane:first-child .pull-consumer.slow');
          slowConsumers.forEach(c => c.classList.add('overflow'));
          if (pushStatus) {
            pushStatus.innerHTML = '<span style="color:var(--accent-red)">⚠ Slow consumer overwhelmed! Messages queuing up / dropped</span>';
          }
        }, 300);
        return;
      }
      const arrow = document.createElement('div');
      arrow.className = 'pull-arrow-msg to-consumer';
      arrow.textContent = `→ Push M${pushCount + 1}`;
      pushArrows.appendChild(arrow);
      pushCount++;
    }, 150);

    // PULL: consumers request at own pace
    let fastCount = 0;
    let slowCount = 0;
    const pullFastInterval = setInterval(() => {
      if (fastCount >= 5) { clearInterval(pullFastInterval); return; }
      const arrow = document.createElement('div');
      arrow.className = 'pull-arrow-msg from-consumer';
      arrow.textContent = `← Pull M${fastCount + 1} (fast)`;
      pullArrows.appendChild(arrow);
      fastCount++;
    }, 200);

    const pullSlowInterval = setInterval(() => {
      if (slowCount >= 3) {
        clearInterval(pullSlowInterval);
        setTimeout(() => {
          if (pullStatus) {
            pullStatus.innerHTML = '<span style="color:var(--accent-teal)">✓ Both consumers healthy — each pulls at its own pace</span>';
          }
        }, 300);
        return;
      }
      const arrow = document.createElement('div');
      arrow.className = 'pull-arrow-msg from-consumer';
      arrow.textContent = `← Pull M${slowCount + 1} (slow)`;
      arrow.style.opacity = '0.7';
      pullArrows.appendChild(arrow);
      slowCount++;
    }, 500);
  }

  if (btnPullDemo) btnPullDemo.addEventListener('click', runPullVsPush);

  /* ──────────────────────────────────────────────────────
     10. CONSUMER GROUP REBALANCING
     ────────────────────────────────────────────────────── */
  const rbViz = document.getElementById('rb-viz');
  const rbLog = document.getElementById('rb-log');
  const btnRbAdd = document.getElementById('btn-rb-add');
  const btnRbRemove = document.getElementById('btn-rb-remove');
  const btnRbCrash = document.getElementById('btn-rb-crash');
  const btnRbReset = document.getElementById('btn-rb-reset');

  const RB_COLORS = ['#ff6b35', '#06d6a0', '#4cc9f0', '#9b5de5', '#ffd166', '#ef476f'];
  let rbPartitions = 6;
  let rbConsumers = 3;

  function rbAssign(pCount, cCount) {
    const a = new Array(cCount).fill(null).map(() => []);
    for (let i = 0; i < pCount; i++) a[i % cCount].push(i);
    return a;
  }

  function renderRb() {
    if (!rbViz) return;
    const assignments = rbAssign(rbPartitions, rbConsumers);
    rbViz.innerHTML = '';
    for (let p = 0; p < rbPartitions; p++) {
      const owner = p % rbConsumers;
      const row = document.createElement('div');
      row.className = 'rb-partition-row';
      const label = document.createElement('span');
      label.className = 'rb-partition-label';
      label.textContent = `P${p}`;
      const chip = document.createElement('span');
      chip.className = 'rb-consumer-chip';
      chip.style.background = RB_COLORS[owner % RB_COLORS.length] + '20';
      chip.style.border = `1px solid ${RB_COLORS[owner % RB_COLORS.length]}60`;
      chip.style.color = RB_COLORS[owner % RB_COLORS.length];
      chip.textContent = `Consumer ${owner}`;
      row.appendChild(label);
      row.appendChild(chip);
      rbViz.appendChild(row);
    }
  }

  function rbLogMsg(msg, color) {
    if (!rbLog) return;
    const el = document.createElement('div');
    el.className = 'rb-log-entry';
    el.style.borderColor = color || 'var(--border-card)';
    el.style.color = color || 'var(--text-secondary)';
    el.textContent = `[${new Date().toLocaleTimeString()}] ${msg}`;
    rbLog.prepend(el);
  }

  if (btnRbAdd) btnRbAdd.addEventListener('click', () => {
    if (rbConsumers >= 6) { rbLogMsg('Max 6 consumers reached', 'var(--accent-yellow)'); return; }
    rbConsumers++;
    rbLogMsg(`Consumer ${rbConsumers - 1} JOINED → Rebalancing triggered`, 'var(--accent-teal)');
    setTimeout(() => { renderRb(); rbLogMsg(`Rebalance complete. ${rbPartitions} partitions across ${rbConsumers} consumers`, 'var(--accent-teal)'); }, 500);
  });

  if (btnRbRemove) btnRbRemove.addEventListener('click', () => {
    if (rbConsumers <= 1) { rbLogMsg('Cannot remove last consumer', 'var(--accent-yellow)'); return; }
    rbConsumers--;
    rbLogMsg(`Consumer ${rbConsumers} gracefully LEFT → Rebalancing triggered`, 'var(--accent-blue)');
    setTimeout(() => { renderRb(); rbLogMsg(`Rebalance complete. ${rbPartitions} partitions across ${rbConsumers} consumers`, 'var(--accent-teal)'); }, 500);
  });

  if (btnRbCrash) btnRbCrash.addEventListener('click', () => {
    if (rbConsumers <= 1) { rbLogMsg('Cannot crash last consumer', 'var(--accent-yellow)'); return; }
    const crashed = rbConsumers - 1;
    rbConsumers--;
    rbLogMsg(`💀 Consumer ${crashed} CRASHED — no heartbeat for 45s...`, 'var(--accent-red)');
    setTimeout(() => { rbLogMsg('session.timeout.ms expired → Rebalancing triggered', 'var(--accent-yellow)'); }, 800);
    setTimeout(() => { renderRb(); rbLogMsg(`Rebalance complete. Partitions reassigned to ${rbConsumers} consumers`, 'var(--accent-teal)'); }, 1600);
  });

  if (btnRbReset) btnRbReset.addEventListener('click', () => {
    rbConsumers = 3;
    if (rbLog) rbLog.innerHTML = '';
    renderRb();
    rbLogMsg('Reset: 3 consumers, 6 partitions', 'var(--text-muted)');
  });

  renderRb();

  // Eager vs Cooperative demo
  const rbStrategyToggle = document.getElementById('rb-strategy-toggle');
  const btnRbDemo = document.getElementById('btn-rb-demo');
  const rbTimeline = document.getElementById('rb-timeline');
  let rbStrategy = 'eager';

  if (rbStrategyToggle) {
    rbStrategyToggle.querySelectorAll('.strategy-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        rbStrategyToggle.querySelectorAll('.strategy-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        rbStrategy = btn.dataset.strategy;
        document.getElementById('rb-eager-callout').style.display = rbStrategy === 'eager' ? '' : 'none';
        document.getElementById('rb-coop-callout').style.display = rbStrategy === 'cooperative' ? '' : 'none';
      });
    });
  }

  if (btnRbDemo) btnRbDemo.addEventListener('click', () => {
    if (!rbTimeline) return;
    rbTimeline.innerHTML = '';
    const consumers = ['C0', 'C1', 'C2'];

    if (rbStrategy === 'eager') {
      // All consumers stop → rebalance → resume
      consumers.forEach(c => {
        const row = document.createElement('div');
        row.className = 'rb-tl-row';
        const label = document.createElement('span');
        label.className = 'rb-tl-label';
        label.textContent = c;
        const bar = document.createElement('div');
        bar.className = 'rb-tl-bar';
        bar.innerHTML = `
          <div class="rb-tl-segment processing" style="width:30%">Processing</div>
          <div class="rb-tl-segment stopped" style="width:40%">⛔ ALL STOPPED</div>
          <div class="rb-tl-segment processing" style="width:30%">Resumed</div>
        `;
        row.appendChild(label);
        row.appendChild(bar);
        rbTimeline.appendChild(row);
      });
    } else {
      // Only affected consumer stops briefly
      consumers.forEach((c, i) => {
        const row = document.createElement('div');
        row.className = 'rb-tl-row';
        const label = document.createElement('span');
        label.className = 'rb-tl-label';
        label.textContent = c;
        const bar = document.createElement('div');
        bar.className = 'rb-tl-bar';
        if (i === 2) {
          bar.innerHTML = `
            <div class="rb-tl-segment processing" style="width:30%">Processing</div>
            <div class="rb-tl-segment rebalancing" style="width:15%">Revoke P5</div>
            <div class="rb-tl-segment processing" style="width:55%">Continue (P4 only)</div>
          `;
        } else {
          bar.innerHTML = `<div class="rb-tl-segment processing" style="width:100%">✓ Uninterrupted processing</div>`;
        }
        row.appendChild(label);
        row.appendChild(bar);
        rbTimeline.appendChild(row);
      });
    }
  });

  /* ──────────────────────────────────────────────────────
     11. IDEMPOTENT PRODUCERS & EXACTLY-ONCE
     ────────────────────────────────────────────────────── */
  const idemDemo = document.getElementById('idem-demo');
  const idemResult = document.getElementById('idem-result');
  const btnIdemNoDup = document.getElementById('btn-idem-nodup');
  const btnIdemWithDup = document.getElementById('btn-idem-withdup');

  function runIdemDemo(idempotent) {
    if (!idemDemo) return;
    idemDemo.innerHTML = '';
    if (idemResult) idemResult.textContent = '';

    // Build pipeline
    const pipeline = document.createElement('div');
    pipeline.className = 'idem-pipeline';
    const steps = [
      { name: '📤 Producer', id: 'idem-producer' },
      { arrow: '→', label: 'Send M1' },
      { name: '🖥️ Broker', id: 'idem-broker' },
      { arrow: '→', label: 'ACK' },
      { name: '✅ ACK', id: 'idem-ack' },
    ];

    steps.forEach(s => {
      if (s.arrow) {
        const a = document.createElement('span');
        a.className = 'idem-arrow';
        a.textContent = s.label || s.arrow;
        a.id = s.id || '';
        pipeline.appendChild(a);
      } else {
        const n = document.createElement('div');
        n.className = 'idem-node';
        n.textContent = s.name;
        n.id = s.id;
        pipeline.appendChild(n);
      }
    });
    idemDemo.appendChild(pipeline);

    const brokerLog = document.createElement('div');
    brokerLog.className = 'idem-broker-log';
    brokerLog.id = 'idem-broker-log';
    idemDemo.appendChild(brokerLog);

    // Animation
    const producer = document.getElementById('idem-producer');
    const broker = document.getElementById('idem-broker');
    const ack = document.getElementById('idem-ack');
    const blog = document.getElementById('idem-broker-log');

    // Step 1: Producer sends
    setTimeout(() => { if (producer) producer.classList.add('active'); }, 200);
    // Step 2: Broker receives → writes
    setTimeout(() => {
      if (producer) producer.classList.remove('active');
      if (broker) broker.classList.add('active');
      const cell = document.createElement('div');
      cell.className = 'idem-log-cell normal';
      cell.textContent = idempotent ? 'M1 (S:1)' : 'M1';
      if (blog) blog.appendChild(cell);
    }, 600);
    // Step 3: ACK lost!
    setTimeout(() => {
      if (broker) broker.classList.remove('active');
      if (ack) { ack.classList.add('error'); ack.textContent = '❌ ACK Lost!'; }
    }, 1000);
    // Step 4: Retry
    setTimeout(() => {
      if (ack) { ack.classList.remove('error'); ack.textContent = '🔄 Retry'; }
      if (producer) producer.classList.add('active');
    }, 1500);
    // Step 5: Broker receives retry
    setTimeout(() => {
      if (producer) producer.classList.remove('active');
      if (broker) broker.classList.add('active');
      const cell = document.createElement('div');
      if (idempotent) {
        cell.className = 'idem-log-cell rejected';
        cell.textContent = 'M1 (S:1)';
        cell.title = 'Duplicate rejected! Same PID+SeqNum';
      } else {
        cell.className = 'idem-log-cell dup';
        cell.textContent = 'M1 DUP!';
      }
      if (blog) blog.appendChild(cell);
    }, 2000);
    // Step 6: Result
    setTimeout(() => {
      if (broker) broker.classList.remove('active');
      if (ack) {
        ack.classList.add('success');
        ack.textContent = '✅ ACK';
      }
      if (idemResult) {
        if (idempotent) {
          idemResult.innerHTML = '<span style="color:var(--accent-teal)">✓ Idempotent: Duplicate detected (PID + SeqNum match) → Rejected. Only 1 message in log.</span>';
        } else {
          idemResult.innerHTML = '<span style="color:var(--accent-red)">⚠ No Idempotency: Broker has M1 TWICE! Duplicate created on retry.</span>';
        }
      }
    }, 2500);
  }

  if (btnIdemNoDup) btnIdemNoDup.addEventListener('click', () => runIdemDemo(false));
  if (btnIdemWithDup) btnIdemWithDup.addEventListener('click', () => runIdemDemo(true));

  // Delivery guarantee cards
  const deliveryCards = document.getElementById('delivery-cards');
  if (deliveryCards) {
    deliveryCards.querySelectorAll('.delivery-card').forEach(card => {
      card.addEventListener('click', () => {
        deliveryCards.querySelectorAll('.delivery-card').forEach(c => c.classList.remove('selected'));
        card.classList.add('selected');
      });
    });
  }

  /* ──────────────────────────────────────────────────────
     12. KAFKA TRANSACTIONS
     ────────────────────────────────────────────────────── */
  const txnPipeline = document.getElementById('txn-pipeline');
  const txnResult = document.getElementById('txn-result');
  const btnTxnSuccess = document.getElementById('btn-txn-success');
  const btnTxnFail = document.getElementById('btn-txn-fail');

  function runTxnDemo(success) {
    if (!txnPipeline) return;
    txnPipeline.innerHTML = '';
    if (txnResult) txnResult.textContent = '';

    const flow = document.createElement('div');
    flow.className = 'txn-flow';

    const steps = [
      { name: '📥 Consume\nfrom Topic A', id: 'txn-consume' },
      { name: '⚙️ Process\n& Transform', id: 'txn-process' },
      { name: '📤 Produce\nto Topic B', id: 'txn-produce' },
      { name: '✅ Commit\nOffsets + Msgs', id: 'txn-commit' },
    ];

    steps.forEach((s, i) => {
      if (i > 0) {
        const arrow = document.createElement('span');
        arrow.className = 'txn-step-arrow';
        arrow.textContent = '→';
        flow.appendChild(arrow);
      }
      const step = document.createElement('div');
      step.className = 'txn-step';
      step.id = s.id;
      step.textContent = s.name;
      step.style.whiteSpace = 'pre-line';
      flow.appendChild(step);
    });
    txnPipeline.appendChild(flow);

    const failAt = success ? -1 : 2; // fail at process step
    const ids = ['txn-consume', 'txn-process', 'txn-produce', 'txn-commit'];

    ids.forEach((id, i) => {
      setTimeout(() => {
        const el = document.getElementById(id);
        if (!el) return;
        // Clear previous active
        ids.forEach(prev => { const p = document.getElementById(prev); if (p) p.classList.remove('active'); });

        if (i === failAt) {
          el.classList.add('failed');
          el.textContent = '💥 FAILED!';
          // Mark all as failed/rolled back
          setTimeout(() => {
            ids.slice(0, i).forEach(prev => {
              const p = document.getElementById(prev);
              if (p) { p.classList.add('failed'); p.style.opacity = '0.5'; }
            });
            if (txnResult) txnResult.innerHTML = '<span style="color:var(--accent-red)">❌ Transaction ABORTED — offsets NOT committed, output messages NOT visible to read_committed consumers.</span>';
          }, 400);
        } else if (i > failAt && failAt >= 0) {
          // skip
        } else {
          el.classList.add('active');
          setTimeout(() => { el.classList.remove('active'); el.classList.add('done'); }, 450);
          if (i === ids.length - 1 && success) {
            setTimeout(() => {
              if (txnResult) txnResult.innerHTML = '<span style="color:var(--accent-teal)">✅ Transaction COMMITTED — offsets and output messages atomically committed together.</span>';
            }, 500);
          }
        }
      }, i * 600);
    });

    // Animate state machine
    const stateEls = document.querySelectorAll('#txn-states .txn-state');
    const stateOrder = success ? ['init', 'begin', 'produce', 'commit'] : ['init', 'begin', 'produce', 'abort'];
    stateOrder.forEach((state, i) => {
      setTimeout(() => {
        stateEls.forEach(el => el.classList.remove('active-state'));
        const el = document.querySelector(`.txn-state[data-state="${state}"]`);
        if (el) el.classList.add('active-state');
      }, i * 600);
    });
  }

  if (btnTxnSuccess) btnTxnSuccess.addEventListener('click', () => runTxnDemo(true));
  if (btnTxnFail) btnTxnFail.addEventListener('click', () => runTxnDemo(false));

  /* ──────────────────────────────────────────────────────
     13. SAGA PATTERN
     ────────────────────────────────────────────────────── */
  const sagaFlow = document.getElementById('saga-flow');
  const sagaResult = document.getElementById('saga-result');
  const sagaToggle = document.getElementById('saga-toggle');
  const btnSagaSuccess = document.getElementById('btn-saga-success');
  const btnSagaFail = document.getElementById('btn-saga-fail');
  let sagaPattern = 'choreography';

  const SAGA_SERVICES = [
    { name: '🛒 Order\nService', event: 'OrderCreated', compensate: 'CancelOrder' },
    { name: '💳 Payment\nService', event: 'PaymentCompleted', compensate: 'RefundPayment' },
    { name: '📦 Inventory\nService', event: 'StockReserved', compensate: 'ReleaseStock' },
    { name: '🚚 Shipping\nService', event: 'ShipmentScheduled', compensate: 'CancelShipment' },
  ];

  if (sagaToggle) {
    sagaToggle.querySelectorAll('.strategy-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        sagaToggle.querySelectorAll('.strategy-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        sagaPattern = btn.dataset.pattern;
      });
    });
  }

  function runSaga(success) {
    if (!sagaFlow) return;
    sagaFlow.innerHTML = '';
    if (sagaResult) sagaResult.textContent = '';

    const services = document.createElement('div');
    services.className = 'saga-services';

    const isOrch = sagaPattern === 'orchestration';
    const failAt = success ? -1 : 2; // fail at Inventory

    // Add orchestrator node if orchestration
    if (isOrch) {
      const orch = document.createElement('div');
      orch.className = 'saga-node orchestrator';
      orch.textContent = '🎯 Orchestrator';
      orch.id = 'saga-orch';
      services.appendChild(orch);
      const arrow = document.createElement('span');
      arrow.className = 'saga-arrow';
      arrow.textContent = '→';
      arrow.id = 'saga-orch-arrow';
      services.appendChild(arrow);
    }

    SAGA_SERVICES.forEach((s, i) => {
      if (i > 0) {
        const arrow = document.createElement('span');
        arrow.className = 'saga-arrow';
        arrow.textContent = isOrch ? '←→' : '→';
        arrow.id = `saga-arrow-${i}`;
        services.appendChild(arrow);
      }
      const node = document.createElement('div');
      node.className = 'saga-node';
      node.textContent = s.name;
      node.id = `saga-svc-${i}`;
      node.style.whiteSpace = 'pre-line';
      services.appendChild(node);
    });
    sagaFlow.appendChild(services);

    const eventLog = document.createElement('div');
    eventLog.className = 'saga-event-log';
    eventLog.id = 'saga-event-log';
    sagaFlow.appendChild(eventLog);

    // Animate forward
    SAGA_SERVICES.forEach((s, i) => {
      setTimeout(() => {
        const node = document.getElementById(`saga-svc-${i}`);
        const arrow = document.getElementById(`saga-arrow-${i}`);
        const log = document.getElementById('saga-event-log');
        if (!node) return;

        if (i === failAt) {
          node.classList.add('failed');
          if (arrow) arrow.classList.add('fail-arrow');
          const evt = document.createElement('span');
          evt.className = 'saga-event failure';
          evt.textContent = `❌ ${s.name.split('\n')[1]} FAILED`;
          if (log) log.appendChild(evt);

          // Compensate backwards
          for (let j = i - 1; j >= 0; j--) {
            const svc = SAGA_SERVICES[j];
            setTimeout(() => {
              const prevNode = document.getElementById(`saga-svc-${j}`);
              const prevArrow = document.getElementById(`saga-arrow-${j}`);
              if (prevNode) { prevNode.classList.remove('done'); prevNode.classList.add('compensating'); }
              if (prevArrow) prevArrow.classList.add('compensate-arrow');
              const compEvt = document.createElement('span');
              compEvt.className = 'saga-event compensate';
              compEvt.textContent = `↩ ${svc.compensate}`;
              if (log) log.appendChild(compEvt);
            }, (i - j) * 500);
          }

          setTimeout(() => {
            if (sagaResult) sagaResult.innerHTML = '<span style="color:var(--accent-red)">❌ Saga FAILED at Inventory — compensating transactions rolled back Payment and Order.</span>';
          }, i * 500 + 500);
        } else if (failAt >= 0 && i > failAt) {
          // skip
        } else {
          node.classList.add('active');
          if (arrow) arrow.classList.add('active-arrow');
          setTimeout(() => { node.classList.remove('active'); node.classList.add('done'); }, 400);
          const evt = document.createElement('span');
          evt.className = 'saga-event success';
          evt.textContent = `✓ ${s.event}`;
          if (log) log.appendChild(evt);

          if (i === SAGA_SERVICES.length - 1 && success) {
            setTimeout(() => {
              if (sagaResult) sagaResult.innerHTML = '<span style="color:var(--accent-teal)">✅ Saga COMPLETED — all services committed their local transactions successfully.</span>';
            }, 500);
          }
        }
      }, i * 700);
    });
  }

  if (btnSagaSuccess) btnSagaSuccess.addEventListener('click', () => runSaga(true));
  if (btnSagaFail) btnSagaFail.addEventListener('click', () => runSaga(false));

  /* ──────────────────────────────────────────────────────
     14. CONSUMER OFFSETS & COMMIT STRATEGIES
     ────────────────────────────────────────────────────── */
  const offsetDemo = document.getElementById('offset-demo');
  const offsetResult = document.getElementById('offset-result');
  const btnOffsetConsume = document.getElementById('btn-offset-consume');
  const btnOffsetCommit = document.getElementById('btn-offset-commit');
  const btnOffsetCrash = document.getElementById('btn-offset-crash');
  const btnOffsetReset = document.getElementById('btn-offset-reset');

  const OFFSET_TOTAL = 12;
  let offsetCurrent = 0, offsetCommitted = -1;

  function renderOffsets() {
    if (!offsetDemo) return;
    offsetDemo.innerHTML = '';
    const log = document.createElement('div');
    log.className = 'offset-log';
    for (let i = 0; i < OFFSET_TOTAL; i++) {
      const cell = document.createElement('div');
      cell.className = 'offset-cell';
      if (i < offsetCurrent) cell.classList.add('consumed');
      if (i === offsetCurrent) cell.classList.add('current');
      if (i <= offsetCommitted) cell.classList.add('committed-mark');
      cell.innerHTML = `<span style="font-size:0.5rem;color:var(--text-muted)">O:${i}</span><span>M${i}</span>`;
      log.appendChild(cell);
    }
    offsetDemo.appendChild(log);
    const ptrs = document.createElement('div');
    ptrs.className = 'offset-pointers';
    ptrs.innerHTML = `<span><strong style="color:var(--accent-orange)">▸ Current:</strong> ${offsetCurrent}</span>
      <span><strong style="color:var(--accent-teal)">✓ Committed:</strong> ${offsetCommitted < 0 ? 'none' : offsetCommitted}</span>
      <span><strong style="color:var(--text-muted)">Uncommitted:</strong> ${offsetCurrent - offsetCommitted - 1}</span>`;
    offsetDemo.appendChild(ptrs);
  }

  if (btnOffsetConsume) btnOffsetConsume.addEventListener('click', () => {
    if (offsetCurrent >= OFFSET_TOTAL) { if (offsetResult) offsetResult.innerHTML = '<span style="color:var(--accent-yellow)">End of partition reached</span>'; return; }
    offsetCurrent++;
    renderOffsets();
    if (offsetResult) offsetResult.innerHTML = `<span style="color:var(--accent-orange)">Consumed message at offset ${offsetCurrent - 1}. Not yet committed.</span>`;
  });

  if (btnOffsetCommit) btnOffsetCommit.addEventListener('click', () => {
    if (offsetCurrent <= 0) return;
    offsetCommitted = offsetCurrent - 1;
    renderOffsets();
    if (offsetResult) offsetResult.innerHTML = `<span style="color:var(--accent-teal)">✓ Committed offset ${offsetCommitted} to __consumer_offsets topic.</span>`;
  });

  if (btnOffsetCrash) btnOffsetCrash.addEventListener('click', () => {
    const lost = offsetCurrent - offsetCommitted - 1;
    offsetCurrent = offsetCommitted + 1;
    renderOffsets();
    if (offsetResult) offsetResult.innerHTML = `<span style="color:var(--accent-red)">💀 CRASH! Consumer restarts at committed offset ${offsetCommitted < 0 ? 0 : offsetCommitted + 1}. ${lost > 0 ? lost + ' messages will be RE-PROCESSED (at-least-once).' : 'No uncommitted work lost.'}</span>`;
  });

  if (btnOffsetReset) btnOffsetReset.addEventListener('click', () => {
    offsetCurrent = 0; offsetCommitted = -1;
    renderOffsets();
    if (offsetResult) offsetResult.textContent = '';
  });

  renderOffsets();

  /* ──────────────────────────────────────────────────────
     15. LOG COMPACTION
     ────────────────────────────────────────────────────── */
  const compactDemo = document.getElementById('compact-demo');
  const btnCompact = document.getElementById('btn-compact');
  const btnCompactReset = document.getElementById('btn-compact-reset');

  const COMPACT_LOG = [
    { key: 'user.1', val: 'Alice', offset: 0 },
    { key: 'user.2', val: 'Bob', offset: 1 },
    { key: 'user.1', val: 'Alice2', offset: 2 },
    { key: 'user.3', val: 'Carol', offset: 3 },
    { key: 'user.2', val: 'Bob2', offset: 4 },
    { key: 'user.1', val: 'Alice3', offset: 5 },
    { key: 'user.3', val: null, offset: 6 }, // tombstone
    { key: 'user.4', val: 'Dave', offset: 7 },
    { key: 'user.2', val: 'Bob3', offset: 8 },
  ];

  function renderCompaction(compacted = false) {
    if (!compactDemo) return;
    compactDemo.innerHTML = '';
    // Before
    const bLabel = document.createElement('div');
    bLabel.className = 'compact-section-label';
    bLabel.textContent = compacted ? 'Before Compaction' : 'Topic Log (before)';
    compactDemo.appendChild(bLabel);
    const bLog = document.createElement('div');
    bLog.className = 'compact-log';

    // Find latest per key
    const latest = {};
    COMPACT_LOG.forEach(e => { latest[e.key] = e.offset; });

    COMPACT_LOG.forEach(e => {
      const cell = document.createElement('div');
      cell.className = 'compact-cell';
      if (compacted) {
        if (e.val === null) { cell.classList.add('tombstone'); }
        else if (latest[e.key] !== e.offset) { cell.classList.add('removed'); }
        else { cell.classList.add('kept'); }
      }
      cell.innerHTML = `<span class="compact-key">${e.key}</span><span class="compact-val">${e.val === null ? '🪦 null' : e.val}</span><span style="font-size:0.5rem;color:var(--text-muted)">o:${e.offset}</span>`;
      bLog.appendChild(cell);
    });
    compactDemo.appendChild(bLog);

    if (compacted) {
      const aLabel = document.createElement('div');
      aLabel.className = 'compact-section-label';
      aLabel.textContent = 'After Compaction';
      compactDemo.appendChild(aLabel);
      const aLog = document.createElement('div');
      aLog.className = 'compact-log';
      COMPACT_LOG.filter(e => latest[e.key] === e.offset && e.val !== null).forEach(e => {
        const cell = document.createElement('div');
        cell.className = 'compact-cell kept';
        cell.innerHTML = `<span class="compact-key">${e.key}</span><span class="compact-val">${e.val}</span>`;
        aLog.appendChild(cell);
      });
      compactDemo.appendChild(aLog);
    }
  }

  if (btnCompact) btnCompact.addEventListener('click', () => renderCompaction(true));
  if (btnCompactReset) btnCompactReset.addEventListener('click', () => renderCompaction(false));
  renderCompaction(false);

  /* ──────────────────────────────────────────────────────
     16. SCHEMA REGISTRY & EVOLUTION
     ────────────────────────────────────────────────────── */
  const schemaDemo = document.getElementById('schema-demo');
  const schemaResult = document.getElementById('schema-result');
  const schemaToggle = document.getElementById('schema-compat-toggle');
  const btnSchemaAdd = document.getElementById('btn-schema-add');
  const btnSchemaRemove = document.getElementById('btn-schema-remove');
  let schemaCompat = 'backward';

  const SCHEMA_V1 = ['id (int)', 'name (string)', 'email (string)'];

  if (schemaToggle) {
    schemaToggle.querySelectorAll('.strategy-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        schemaToggle.querySelectorAll('.strategy-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        schemaCompat = btn.dataset.compat;
      });
    });
  }

  function runSchemaCheck(action) {
    if (!schemaDemo) return;
    schemaDemo.innerHTML = '';
    if (schemaResult) schemaResult.textContent = '';

    // Pipeline
    const pipe = document.createElement('div');
    pipe.className = 'schema-pipeline';
    const nodes = [
      { name: '📤 Producer\n(v2 schema)', id: 'sch-producer' },
      { name: '📋 Registry\n(check compat)', id: 'sch-registry' },
      { name: '🖥️ Broker', id: 'sch-broker' },
    ];
    nodes.forEach((n, i) => {
      if (i > 0) { const a = document.createElement('span'); a.className = 'schema-arrow'; a.textContent = '→'; pipe.appendChild(a); }
      const el = document.createElement('div');
      el.className = 'schema-node';
      el.textContent = n.name;
      el.id = n.id;
      el.style.whiteSpace = 'pre-line';
      pipe.appendChild(el);
    });
    schemaDemo.appendChild(pipe);

    // Fields
    const fields = document.createElement('div');
    fields.className = 'schema-fields';
    fields.id = 'sch-fields';
    SCHEMA_V1.forEach(f => {
      const tag = document.createElement('span');
      tag.className = 'schema-field existing';
      tag.textContent = f;
      fields.appendChild(tag);
    });
    schemaDemo.appendChild(fields);

    // Determine pass/fail
    let pass = false, reason = '';
    if (action === 'add') {
      if (schemaCompat === 'backward' || schemaCompat === 'full') { pass = true; reason = 'Adding field with default is BACKWARD compatible — new consumers can read old data.'; }
      else { pass = true; reason = 'FORWARD: Adding optional field is allowed (old consumers ignore it).'; }
    } else {
      if (schemaCompat === 'backward') { pass = false; reason = 'BACKWARD: Cannot remove field — old data has it, new schema cannot read it.'; }
      else if (schemaCompat === 'forward') { pass = true; reason = 'FORWARD: Removing field is allowed — old consumers still have the field.'; }
      else { pass = false; reason = 'FULL: Removing fields breaks backward compatibility.'; }
    }

    // Animate
    setTimeout(() => { const p = document.getElementById('sch-producer'); if (p) p.classList.add('active'); }, 200);
    setTimeout(() => {
      const p = document.getElementById('sch-producer');
      const r = document.getElementById('sch-registry');
      if (p) p.classList.remove('active');
      if (r) r.classList.add('active');
      const fl = document.getElementById('sch-fields');
      if (fl) {
        const tag = document.createElement('span');
        tag.className = action === 'add' ? 'schema-field added' : 'schema-field removed';
        tag.textContent = action === 'add' ? '+ age (int, default=0)' : '− email (string)';
        fl.appendChild(tag);
      }
    }, 600);
    setTimeout(() => {
      const r = document.getElementById('sch-registry');
      const b = document.getElementById('sch-broker');
      if (r) { r.classList.remove('active'); r.classList.add(pass ? 'pass' : 'fail'); }
      if (pass && b) b.classList.add('pass');
      if (schemaResult) schemaResult.innerHTML = `<span style="color:var(${pass ? '--accent-teal' : '--accent-red'})">${pass ? '✅' : '❌'} ${schemaCompat.toUpperCase()}: ${reason}</span>`;
    }, 1200);
  }

  if (btnSchemaAdd) btnSchemaAdd.addEventListener('click', () => runSchemaCheck('add'));
  if (btnSchemaRemove) btnSchemaRemove.addEventListener('click', () => runSchemaCheck('remove'));

  /* ──────────────────────────────────────────────────────
     17. DEAD LETTER QUEUE
     ────────────────────────────────────────────────────── */
  const dlqDemo = document.getElementById('dlq-demo');
  const dlqResult = document.getElementById('dlq-result');
  const btnDlqGood = document.getElementById('btn-dlq-good');
  const btnDlqPoison = document.getElementById('btn-dlq-poison');
  const btnDlqReset = document.getElementById('btn-dlq-reset');

  function runDlqDemo(poison) {
    if (!dlqDemo) return;
    dlqDemo.innerHTML = '';
    if (dlqResult) dlqResult.textContent = '';

    const pipe = document.createElement('div');
    pipe.className = 'dlq-pipeline';
    const steps = [
      { name: '📥 Main Topic', id: 'dlq-source' },
      { name: '⚙️ Consumer\nProcess', id: 'dlq-process' },
      { name: poison ? '🔁 Retry (0/3)' : '✅ Success', id: 'dlq-outcome' },
    ];
    if (poison) steps.push({ name: '☠️ DLQ Topic', id: 'dlq-dead' });

    steps.forEach((s, i) => {
      if (i > 0) { const a = document.createElement('span'); a.className = 'dlq-arrow'; a.textContent = '→'; pipe.appendChild(a); }
      const n = document.createElement('div');
      n.className = 'dlq-node';
      n.textContent = s.name;
      n.id = s.id;
      pipe.appendChild(n);
    });
    dlqDemo.appendChild(pipe);

    // Animate
    setTimeout(() => { const el = document.getElementById('dlq-source'); if (el) el.classList.add('active'); }, 200);
    setTimeout(() => {
      const s = document.getElementById('dlq-source');
      const p = document.getElementById('dlq-process');
      if (s) s.classList.remove('active');
      if (p) p.classList.add('active');
    }, 600);

    if (!poison) {
      setTimeout(() => {
        const p = document.getElementById('dlq-process');
        const o = document.getElementById('dlq-outcome');
        if (p) p.classList.remove('active');
        if (o) o.classList.add('success');
        if (dlqResult) dlqResult.innerHTML = '<span style="color:var(--accent-teal)">✅ Message processed successfully. Offset committed.</span>';
      }, 1000);
    } else {
      // Retry loop
      for (let attempt = 1; attempt <= 3; attempt++) {
        setTimeout(() => {
          const o = document.getElementById('dlq-outcome');
          if (o) { o.classList.remove('active'); o.classList.add('retry'); o.textContent = `🔁 Retry (${attempt}/3)`; }
        }, 600 + attempt * 500);
      }
      setTimeout(() => {
        const o = document.getElementById('dlq-outcome');
        const d = document.getElementById('dlq-dead');
        if (o) { o.classList.remove('retry'); o.classList.add('dead'); o.textContent = '❌ Failed 3x'; }
        if (d) d.classList.add('dead');
        if (dlqResult) dlqResult.innerHTML = '<span style="color:var(--accent-red)">☠ Message routed to DLQ after 3 failed attempts. Consumer continues with next message.</span>';
      }, 2200);
    }
  }

  if (btnDlqGood) btnDlqGood.addEventListener('click', () => runDlqDemo(false));
  if (btnDlqPoison) btnDlqPoison.addEventListener('click', () => runDlqDemo(true));
  if (btnDlqReset) btnDlqReset.addEventListener('click', () => { if (dlqDemo) dlqDemo.innerHTML = ''; if (dlqResult) dlqResult.textContent = ''; });

  /* ──────────────────────────────────────────────────────
     18. CONSUMER LAG & MONITORING
     ────────────────────────────────────────────────────── */
  const lagDemo = document.getElementById('lag-demo');
  const lagResult = document.getElementById('lag-result');
  const btnLagProduce = document.getElementById('btn-lag-produce');
  const btnLagConsume = document.getElementById('btn-lag-consume');
  const btnLagSlow = document.getElementById('btn-lag-slow');
  const btnLagReset = document.getElementById('btn-lag-reset');

  const LAG_MAX = 100;
  let lagData = [
    { produced: 30, consumed: 28 },
    { produced: 25, consumed: 24 },
    { produced: 35, consumed: 32 },
    { produced: 20, consumed: 18 },
  ];

  function renderLag() {
    if (!lagDemo) return;
    lagDemo.innerHTML = '';
    const parts = document.createElement('div');
    parts.className = 'lag-partitions';
    let totalLag = 0;

    lagData.forEach((d, i) => {
      const lag = d.produced - d.consumed;
      totalLag += lag;
      const row = document.createElement('div');
      row.className = 'lag-partition';
      const label = document.createElement('span');
      label.className = 'lag-label';
      label.textContent = `P${i}`;
      const barContainer = document.createElement('div');
      barContainer.className = 'lag-bar-container';
      const produced = document.createElement('div');
      produced.className = 'lag-bar-produced';
      produced.style.width = (d.produced / LAG_MAX * 100) + '%';
      const consumed = document.createElement('div');
      consumed.className = 'lag-bar-consumed';
      consumed.style.width = (d.consumed / LAG_MAX * 100) + '%';
      barContainer.appendChild(produced);
      barContainer.appendChild(consumed);
      const val = document.createElement('span');
      val.className = 'lag-value' + (lag > 10 ? ' high' : ' low');
      val.textContent = `Lag: ${lag}`;
      row.appendChild(label);
      row.appendChild(barContainer);
      row.appendChild(val);
      parts.appendChild(row);
    });
    lagDemo.appendChild(parts);

    const stats = document.createElement('div');
    stats.className = 'lag-stats';
    stats.innerHTML = `<span><strong style="color:var(--accent-orange)">🟠 Produced</strong></span> <span><strong style="color:var(--accent-teal)">🟢 Consumed</strong></span> <span>Total Lag: <strong style="color:${totalLag > 20 ? 'var(--accent-red)' : 'var(--accent-teal)'}">${totalLag}</strong></span>`;
    lagDemo.appendChild(stats);

    if (lagResult) {
      if (totalLag > 30) lagResult.innerHTML = '<span style="color:var(--accent-red)">⚠ HIGH LAG — consumers can\'t keep up! Scale up consumers or optimize processing.</span>';
      else if (totalLag > 10) lagResult.innerHTML = '<span style="color:var(--accent-yellow)">⚡ Moderate lag — monitor closely.</span>';
      else lagResult.innerHTML = '<span style="color:var(--accent-teal)">✅ Healthy — consumers are keeping up with producers.</span>';
    }
  }

  if (btnLagProduce) btnLagProduce.addEventListener('click', () => {
    lagData.forEach(d => { d.produced = Math.min(LAG_MAX, d.produced + Math.floor(Math.random() * 8) + 3); });
    renderLag();
  });
  if (btnLagConsume) btnLagConsume.addEventListener('click', () => {
    lagData.forEach(d => { d.consumed = Math.min(d.produced, d.consumed + Math.floor(Math.random() * 10) + 5); });
    renderLag();
  });
  if (btnLagSlow) btnLagSlow.addEventListener('click', () => {
    lagData.forEach(d => { d.produced = Math.min(LAG_MAX, d.produced + 15); d.consumed = Math.min(d.produced, d.consumed + 2); });
    renderLag();
  });
  if (btnLagReset) btnLagReset.addEventListener('click', () => {
    lagData = [{ produced: 30, consumed: 28 }, { produced: 25, consumed: 24 }, { produced: 35, consumed: 32 }, { produced: 20, consumed: 18 }];
    renderLag();
  });
  renderLag();

  /* ──────────────────────────────────────────────────────
     19. KAFKA STREAMS
     ────────────────────────────────────────────────────── */
  const streamDemo = document.getElementById('stream-demo');
  const streamToggle = document.getElementById('stream-toggle');
  const btnStreamSend = document.getElementById('btn-stream-send');
  let streamType = 'kstream';

  const STREAM_EVENTS = [
    { key: 'user-A', val: '$10' },
    { key: 'user-B', val: '$25' },
    { key: 'user-A', val: '$15' },
    { key: 'user-C', val: '$30' },
    { key: 'user-B', val: '$20' },
    { key: 'user-A', val: '$5' },
  ];

  if (streamToggle) streamToggle.querySelectorAll('.strategy-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      streamToggle.querySelectorAll('.strategy-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      streamType = btn.dataset.type;
    });
  });

  if (btnStreamSend) btnStreamSend.addEventListener('click', () => {
    if (!streamDemo) return;
    streamDemo.innerHTML = '';
    const events = document.createElement('div');
    events.className = 'stream-events';
    events.id = 'stream-events-list';
    streamDemo.appendChild(events);

    const stateDiv = document.createElement('div');
    stateDiv.className = 'stream-state';
    stateDiv.id = 'stream-state-view';
    stateDiv.innerHTML = '<div class="stream-state-title">📊 State Store (KTable)</div>';
    streamDemo.appendChild(stateDiv);

    const state = {};
    STREAM_EVENTS.forEach((e, i) => {
      setTimeout(() => {
        const list = document.getElementById('stream-events-list');
        const sv = document.getElementById('stream-state-view');
        if (!list) return;

        const row = document.createElement('div');
        row.className = 'stream-event';
        if (streamType === 'kstream') {
          row.innerHTML = `<span class="se-key">${e.key}</span><span class="se-val">${e.val}</span><span class="se-op">APPEND</span>`;
        } else {
          state[e.key] = e.val;
          row.innerHTML = `<span class="se-key">${e.key}</span><span class="se-val">${e.val}</span><span class="se-op">UPSERT</span>`;
        }
        list.appendChild(row);

        if (streamType === 'ktable' && sv) {
          sv.innerHTML = '<div class="stream-state-title">📊 State Store (KTable) — Latest per key</div>';
          Object.entries(state).forEach(([k, v]) => {
            const r = document.createElement('div');
            r.className = 'stream-state-row';
            r.innerHTML = `<span style="color:var(--accent-orange)">${k}</span> → <span>${v}</span>`;
            sv.appendChild(r);
          });
        }
      }, i * 400);
    });
  });

  /* ──────────────────────────────────────────────────────
     20. KAFKA CONNECT
     ────────────────────────────────────────────────────── */
  const connectDemo = document.getElementById('connect-demo');
  const connectResult = document.getElementById('connect-result');
  const btnConnectSource = document.getElementById('btn-connect-source');
  const btnConnectSink = document.getElementById('btn-connect-sink');

  function runConnect(type) {
    if (!connectDemo) return;
    connectDemo.innerHTML = '';
    if (connectResult) connectResult.textContent = '';
    const pipe = document.createElement('div');
    pipe.className = 'connect-pipeline';

    const steps = type === 'source'
      ? [{ n: '🗄️ Database\n(PostgreSQL)', id: 'cn-src' }, { n: '📡 Source\nConnector', id: 'cn-connector' }, { n: '🔄 SMT\n(Transform)', id: 'cn-smt' }, { n: '📥 Kafka\nTopic', id: 'cn-dest' }]
      : [{ n: '📤 Kafka\nTopic', id: 'cn-src' }, { n: '📡 Sink\nConnector', id: 'cn-connector' }, { n: '🔄 SMT\n(Transform)', id: 'cn-smt' }, { n: '🔍 Elastic\nsearch', id: 'cn-dest' }];

    steps.forEach((s, i) => {
      if (i > 0) { const a = document.createElement('span'); a.className = 'connect-arrow'; a.textContent = '→'; pipe.appendChild(a); }
      const n = document.createElement('div');
      n.className = 'connect-node';
      n.textContent = s.n;
      n.id = s.id;
      pipe.appendChild(n);
    });
    connectDemo.appendChild(pipe);

    steps.forEach((s, i) => {
      setTimeout(() => {
        const el = document.getElementById(s.id);
        if (el) { el.classList.add('active'); }
        if (i > 0) { const prev = document.getElementById(steps[i-1].id); if (prev) { prev.classList.remove('active'); prev.classList.add('done'); } }
        if (i === steps.length - 1) {
          setTimeout(() => { if (el) { el.classList.remove('active'); el.classList.add('done'); }
            if (connectResult) connectResult.innerHTML = `<span style="color:var(--accent-teal)">✅ ${type === 'source' ? 'CDC data streamed from DB to Kafka topic.' : 'Data indexed from Kafka to Elasticsearch.'}</span>`;
          }, 400);
        }
      }, i * 500);
    });
  }

  if (btnConnectSource) btnConnectSource.addEventListener('click', () => runConnect('source'));
  if (btnConnectSink) btnConnectSink.addEventListener('click', () => runConnect('sink'));

  /* ──────────────────────────────────────────────────────
     21. PARTITIONING STRATEGIES
     ────────────────────────────────────────────────────── */
  const partDemo = document.getElementById('part-demo');
  const partToggle = document.getElementById('part-strategy-toggle');
  const btnPartSend = document.getElementById('btn-part-send');
  let partStrategy = 'roundrobin';
  const PART_COLORS = ['#06d6a0', '#4cc9f0', '#ff6b35', '#ef476f', '#ffd166', '#7b2ff7'];
  const PART_KEYS = ['order-us', 'order-eu', 'order-us', 'order-us', 'order-eu', 'order-jp', 'order-us', 'order-eu', 'order-us', 'order-us', 'order-jp', 'order-us'];

  if (partToggle) partToggle.querySelectorAll('.strategy-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      partToggle.querySelectorAll('.strategy-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      partStrategy = btn.dataset.strat;
    });
  });

  if (btnPartSend) btnPartSend.addEventListener('click', () => {
    if (!partDemo) return;
    partDemo.innerHTML = '';
    const bins = document.createElement('div');
    bins.className = 'part-bins';
    const NUM_PARTS = 4;
    const binEls = [];
    for (let i = 0; i < NUM_PARTS; i++) {
      const bin = document.createElement('div');
      bin.className = 'part-bin';
      bin.id = `part-bin-${i}`;
      bin.innerHTML = `<div class="part-bin-label">P${i}</div><div class="part-bin-count" id="part-count-${i}">0 msgs</div>`;
      bins.appendChild(bin);
      binEls.push(bin);
    }
    partDemo.appendChild(bins);

    const counts = new Array(NUM_PARTS).fill(0);
    const keyMap = { 'order-us': 0, 'order-eu': 1, 'order-jp': 2 };

    PART_KEYS.forEach((key, i) => {
      setTimeout(() => {
        let p;
        if (partStrategy === 'roundrobin') p = i % NUM_PARTS;
        else if (partStrategy === 'keyhash') p = keyMap[key] !== undefined ? keyMap[key] % NUM_PARTS : 3;
        else p = key === 'order-us' ? 0 : (keyMap[key] !== undefined ? keyMap[key] % NUM_PARTS : 3); // hot key

        counts[p]++;
        const bin = document.getElementById(`part-bin-${p}`);
        const cnt = document.getElementById(`part-count-${p}`);
        if (bin) {
          const msg = document.createElement('span');
          msg.className = 'part-msg';
          msg.style.background = `${PART_COLORS[Object.keys(keyMap).indexOf(key) % PART_COLORS.length]}20`;
          msg.style.color = PART_COLORS[Object.keys(keyMap).indexOf(key) % PART_COLORS.length];
          msg.style.border = `1px solid ${PART_COLORS[Object.keys(keyMap).indexOf(key) % PART_COLORS.length]}40`;
          msg.textContent = key;
          bin.appendChild(msg);
          if (partStrategy === 'hotkey' && p === 0 && counts[0] > 4) bin.classList.add('hot');
        }
        if (cnt) cnt.textContent = `${counts[p]} msgs`;
      }, i * 200);
    });
  });

  /* ──────────────────────────────────────────────────────
     22. EVENT SOURCING & CQRS
     ────────────────────────────────────────────────────── */
  const esDemo = document.getElementById('es-demo');
  const btnEsCreate = document.getElementById('btn-es-create');
  const btnEsUpdate = document.getElementById('btn-es-update');
  const btnEsCancel = document.getElementById('btn-es-cancel');
  const btnEsReplay = document.getElementById('btn-es-replay');
  const btnEsReset = document.getElementById('btn-es-reset');
  let esEvents = [];
  let esOrderId = 1001;

  function renderES() {
    if (!esDemo) return;
    esDemo.innerHTML = '';
    const layout = document.createElement('div');
    layout.className = 'es-layout';

    // Event log
    const logCol = document.createElement('div');
    const logLabel = document.createElement('div');
    logLabel.className = 'es-section-label';
    logLabel.textContent = '📝 Event Log (Append-Only)';
    logCol.appendChild(logLabel);
    const log = document.createElement('div');
    log.className = 'es-log';
    esEvents.forEach(e => {
      const row = document.createElement('div');
      row.className = `es-event ${e.type}`;
      row.textContent = `${e.type.toUpperCase()} | Order #${e.orderId} | ${e.detail}`;
      log.appendChild(row);
    });
    if (esEvents.length === 0) { const empty = document.createElement('div'); empty.style.cssText = 'color:var(--text-muted);font-size:0.72rem;font-style:italic;'; empty.textContent = 'No events yet…'; log.appendChild(empty); }
    logCol.appendChild(log);
    layout.appendChild(logCol);

    // Materialized View
    const stateCol = document.createElement('div');
    const stateLabel = document.createElement('div');
    stateLabel.className = 'es-section-label';
    stateLabel.textContent = '📊 Materialized View (Read Model)';
    stateCol.appendChild(stateLabel);
    const state = document.createElement('div');
    state.className = 'es-state';
    // Build state from events
    const orders = {};
    esEvents.forEach(e => {
      if (e.type === 'create') orders[e.orderId] = { status: 'CREATED', amount: e.amount, item: e.item };
      else if (e.type === 'update') { if (orders[e.orderId]) { orders[e.orderId].status = 'UPDATED'; orders[e.orderId].amount = e.amount; } }
      else if (e.type === 'cancel') { if (orders[e.orderId]) orders[e.orderId].status = 'CANCELLED'; }
    });
    if (Object.keys(orders).length === 0) { state.innerHTML = '<div style="color:var(--text-muted);font-size:0.72rem;font-style:italic;">Empty — no state yet</div>'; }
    else {
      Object.entries(orders).forEach(([id, o]) => {
        const r = document.createElement('div');
        r.className = 'es-state-row';
        const statusColor = o.status === 'CANCELLED' ? 'var(--accent-red)' : o.status === 'UPDATED' ? 'var(--accent-blue)' : 'var(--accent-teal)';
        r.innerHTML = `<strong>Order #${id}</strong> — ${o.item} — $${o.amount} — <span style="color:${statusColor}">${o.status}</span>`;
        state.appendChild(r);
      });
    }
    stateCol.appendChild(state);
    layout.appendChild(stateCol);
    esDemo.appendChild(layout);
  }

  if (btnEsCreate) btnEsCreate.addEventListener('click', () => {
    const items = ['Laptop', 'Phone', 'Headphones', 'Keyboard'];
    const amounts = [999, 699, 149, 89];
    const idx = Math.floor(Math.random() * items.length);
    esEvents.push({ type: 'create', orderId: esOrderId, item: items[idx], amount: amounts[idx], detail: `${items[idx]} - $${amounts[idx]}` });
    esOrderId++;
    renderES();
  });
  if (btnEsUpdate) btnEsUpdate.addEventListener('click', () => {
    if (esEvents.length === 0) return;
    const lastCreate = [...esEvents].reverse().find(e => e.type === 'create');
    if (!lastCreate) return;
    const newAmt = lastCreate.amount + 50;
    esEvents.push({ type: 'update', orderId: lastCreate.orderId, amount: newAmt, detail: `Amount → $${newAmt}` });
    renderES();
  });
  if (btnEsCancel) btnEsCancel.addEventListener('click', () => {
    if (esEvents.length === 0) return;
    const lastCreate = [...esEvents].reverse().find(e => e.type === 'create' || e.type === 'update');
    if (!lastCreate) return;
    esEvents.push({ type: 'cancel', orderId: lastCreate.orderId, detail: 'Order cancelled' });
    renderES();
  });
  if (btnEsReplay) btnEsReplay.addEventListener('click', () => {
    if (!esDemo || esEvents.length === 0) return;
    const saved = [...esEvents];
    esEvents = [];
    renderES();
    saved.forEach((e, i) => {
      setTimeout(() => { esEvents.push(e); renderES(); }, (i + 1) * 400);
    });
  });
  if (btnEsReset) btnEsReset.addEventListener('click', () => { esEvents = []; esOrderId = 1001; renderES(); });
  renderES();

  /* ──────────────────────────────────────────────────────
     23. KAFKA SECURITY
     ────────────────────────────────────────────────────── */
  const secDemo = document.getElementById('sec-demo');
  const btnSecUnsecured = document.getElementById('btn-sec-unsecured');
  const btnSecSecured = document.getElementById('btn-sec-secured');

  function renderSecurity(secured) {
    if (!secDemo) return;
    secDemo.innerHTML = '';
    const layers = document.createElement('div');
    layers.className = 'sec-layers';
    const items = [
      { icon: '🔐', name: 'SSL/TLS', desc: secured ? 'Enabled — data encrypted in transit' : 'Disabled — plaintext traffic', enabled: secured },
      { icon: '🪪', name: 'SASL Auth', desc: secured ? 'SCRAM-SHA-512 — identity verified' : 'None — anonymous access', enabled: secured },
      { icon: '📋', name: 'ACLs', desc: secured ? 'READ/WRITE per topic + user' : 'No ACLs — full access to all topics', enabled: secured },
      { icon: '🔗', name: 'Inter-Broker', desc: secured ? 'SSL + SASL between brokers' : 'Plaintext between brokers', enabled: secured },
      { icon: '💾', name: 'At-Rest', desc: secured ? 'EBS encryption enabled' : 'No disk encryption', enabled: secured },
    ];
    items.forEach(item => {
      const row = document.createElement('div');
      row.className = `sec-layer ${item.enabled ? 'enabled' : 'disabled'}`;
      row.innerHTML = `<span class="sec-icon">${item.icon}</span><span class="sec-name">${item.name}</span><span style="flex:1;font-size:0.68rem;color:var(--text-secondary)">${item.desc}</span><span class="sec-status">${item.enabled ? '✅ ON' : '❌ OFF'}</span>`;
      layers.appendChild(row);
    });
    secDemo.appendChild(layers);
  }

  if (btnSecUnsecured) btnSecUnsecured.addEventListener('click', () => renderSecurity(false));
  if (btnSecSecured) btnSecSecured.addEventListener('click', () => renderSecurity(true));
  renderSecurity(false);

  /* ──────────────────────────────────────────────────────
     24. WINDOW RESIZE → redraw CG arrows
     ────────────────────────────────────────────────────── */
  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      renderConsumerGroup();
    }, 200);
  });

  /* ──────────────────────────────────────────────────────
     25. PRODUCTION ISSUES & LEARNINGS
     ────────────────────────────────────────────────────── */
  const PROD_SCENARIOS = {
    'lag-spike': {
      name: '📈 Consumer Lag Spike', severity: 'critical',
      symptoms: ['Consumer lag growing rapidly on Grafana/Burrow', 'End-to-end latency > SLA threshold', 'Consumers showing high poll() times', 'Messages piling up — stale data served to users'],
      rootcause: ['Slow downstream dependency (DB, API) blocking processing', 'max.poll.records too high — each batch takes > max.poll.interval.ms', 'GC pauses in consumer JVM causing heartbeat timeouts', 'Not enough consumers for partition count'],
      fix: ['Reduce max.poll.records (e.g., 500 → 100)', 'Add more consumer instances (scale horizontally)', 'Tune max.poll.interval.ms to match actual processing time', 'Add circuit breaker for slow downstream calls', 'Monitor with: kafka-consumer-groups.sh --describe --group <group>'],
      config: 'max.poll.records=100\nmax.poll.interval.ms=300000\nfetch.max.bytes=52428800\nsession.timeout.ms=30000'
    },
    'rebalance-storm': {
      name: '🌪️ Rebalance Storm', severity: 'critical',
      symptoms: ['Consumers constantly joining/leaving group', 'Processing stops every few minutes', '"Member consumer-X has failed" in broker logs', 'Consumer group state flapping: Stable → PreparingRebalance → Stable'],
      rootcause: ['Consumer processing takes longer than session.timeout.ms', 'Heartbeat thread blocked by heavy processing on same thread', 'Frequent deployments triggering graceful shutdowns', 'Static group membership not configured'],
      fix: ['Use CooperativeStickyAssignor (incremental rebalance)', 'Set group.instance.id for static membership (avoids rebalance on restart)', 'Increase session.timeout.ms to 45s+', 'Separate heartbeat thread from processing (Kafka does this by default in 2.3+)', 'Use rolling restarts with proper shutdown hooks'],
      config: 'partition.assignment.strategy=org.apache.kafka.clients.consumer.CooperativeStickyAssignor\ngroup.instance.id=consumer-pod-1\nsession.timeout.ms=45000\nheartbeat.interval.ms=10000'
    },
    'data-loss': {
      name: '💀 Data Loss', severity: 'critical',
      symptoms: ['Messages produced but never consumed', 'Gaps in event sequence numbers', 'Business reports show missing transactions', 'auto.offset.reset=latest caused skip after consumer restart'],
      rootcause: ['acks=0 or acks=1 — leader crash before replication', 'min.insync.replicas=1 — no durability guarantee', 'auto.commit before processing completes — crash loses messages', 'Consumer offset reset to latest after topic retention expired'],
      fix: ['Set acks=all + min.insync.replicas=2', 'Disable auto-commit: enable.auto.commit=false', 'Commit offsets AFTER successful processing', 'Set auto.offset.reset=earliest for safety', 'Monitor __consumer_offsets for gaps'],
      config: '# Producer\nacks=all\nenable.idempotence=true\n\n# Broker\nmin.insync.replicas=2\n\n# Consumer\nenable.auto.commit=false\nauto.offset.reset=earliest'
    },
    'broker-oom': {
      name: '💥 Broker Out of Memory', severity: 'high',
      symptoms: ['Broker JVM throwing OutOfMemoryError', 'Broker becoming unresponsive, ISR shrinking', 'Produce requests timing out', 'Log segments not being cleaned up'],
      rootcause: ['Too many partitions on a single broker (each uses memory for indexes)', 'Large message sizes without proper buffer config', 'Log compaction falling behind, dirty ratio too high', 'JVM heap too small for partition count'],
      fix: ['Limit partitions per broker (< 4000 recommended)', 'Set message.max.bytes appropriately', 'Tune log.cleaner.threads and log.cleaner.dedupe.buffer.size', 'Increase JVM heap (-Xmx6g) or use G1GC', 'Rebalance partitions across brokers with kafka-reassign-partitions.sh'],
      config: '# Broker config\nlog.cleaner.threads=4\nlog.cleaner.dedupe.buffer.size=134217728\nnum.partitions=6  # default for new topics\nmessage.max.bytes=1048576'
    },
    'hot-partition': {
      name: '🔥 Hot Partition', severity: 'high',
      symptoms: ['One partition has 10x the data of others', 'One consumer maxed out while others are idle', 'Uneven consumer lag across partitions', 'Single broker disk filling faster than peers'],
      rootcause: ['Partition key has skewed distribution (e.g., country="US" = 80% traffic)', 'Null key causing round-robin only before sticky partitioner', 'Using timestamp as key (all events in same time window → same partition)', 'Not enough key cardinality for partition count'],
      fix: ['Add suffix to hot keys: "US" → "US-0", "US-1", "US-2"', 'Use compound keys: userId + random suffix', 'Implement custom partitioner for business-aware routing', 'Monitor partition size: kafka-log-dirs.sh --describe', 'Consider increasing partitions (but beware — this rebalances existing keys)'],
      config: '# Custom partitioner in producer config\npartitioner.class=com.example.WeightedPartitioner\n\n# Or use key suffix strategy\n# key = originalKey + "-" + (hash % subPartitions)'
    },
    'schema-break': {
      name: '📐 Schema Evolution Failure', severity: 'medium',
      symptoms: ['New consumers crash with deserialization errors', 'Schema Registry rejects new schema version', '"Incompatible schema" errors in producer logs', 'Old consumers can\'t read new messages'],
      rootcause: ['Removed a required field without default (breaks BACKWARD)', 'Added required field without default (breaks FORWARD)', 'Changed field type (string → int — breaks everything)', 'Schema Registry compatibility mode not set correctly'],
      fix: ['Always add fields with defaults (BACKWARD safe)', 'Never remove required fields — deprecate, then remove after consumers update', 'Use FULL compatibility for maximum safety', 'Test schema changes in dev before prod: confluent schema-registry test', 'Version your schemas: use subject name strategy'],
      config: '# Schema Registry config\nschema.compatibility.level=BACKWARD\n\n# Producer config\nvalue.subject.name.strategy=TopicNameStrategy\nkey.subject.name.strategy=TopicNameStrategy'
    }
  };

  const prodToggle = document.getElementById('prod-issue-toggle');
  const prodScenario = document.getElementById('prod-scenario');

  function renderProdScenario(key) {
    if (!prodScenario) return;
    const s = PROD_SCENARIOS[key];
    prodScenario.innerHTML = `
      <div class="scenario-header">
        <span class="scenario-severity ${s.severity}">${s.severity}</span>
        <span class="scenario-name">${s.name}</span>
      </div>
      <div class="scenario-body">
        <div class="scenario-col">
          <div class="scenario-col__title symptoms">🚨 Symptoms</div>
          <ul>${s.symptoms.map(x => `<li>${x}</li>`).join('')}</ul>
        </div>
        <div class="scenario-col">
          <div class="scenario-col__title rootcause">🔍 Root Cause</div>
          <ul>${s.rootcause.map(x => `<li>${x}</li>`).join('')}</ul>
        </div>
        <div class="scenario-col fix-col">
          <div class="scenario-col__title fix">✅ Fix / Solution</div>
          <ul>${s.fix.map(x => `<li>${x}</li>`).join('')}</ul>
          <div class="scenario-config">${s.config}</div>
        </div>
      </div>`;
  }

  if (prodToggle) {
    prodToggle.querySelectorAll('.strategy-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        prodToggle.querySelectorAll('.strategy-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        renderProdScenario(btn.dataset.scenario);
      });
    });
    renderProdScenario('lag-spike');
  }

  // Incident Timeline
  const INCIDENT_STEPS = [
    { time: 'T+0m', type: 'alert', text: '🚨 PagerDuty alert: consumer lag > 50,000 on order-events topic' },
    { time: 'T+2m', type: 'alert', text: '📊 Grafana dashboard confirms lag growing at 5,000 msg/min' },
    { time: 'T+5m', type: 'investigate', text: '🔍 Check consumer logs — seeing slow DB queries (avg 2s per message)' },
    { time: 'T+8m', type: 'investigate', text: '🔍 DB team confirms: missing index on orders table causing full table scans' },
    { time: 'T+12m', type: 'action', text: '⚙️ Hotfix: add index on orders(user_id, created_at) — query drops to 5ms' },
    { time: 'T+15m', type: 'action', text: '📈 Scale consumers from 3 → 6 to clear backlog faster' },
    { time: 'T+25m', type: 'action', text: '📉 Lag decreasing at 10,000 msg/min — consumers catching up' },
    { time: 'T+45m', type: 'resolve', text: '✅ Lag back to 0. Scale consumers back to 4 (one extra for headroom)' },
    { time: 'T+60m', type: 'resolve', text: '📝 Post-mortem: add max.poll.records=200, add DB query latency alerts, add index coverage check to CI' },
  ];

  const incidentTimeline = document.getElementById('incident-timeline');
  const btnIncidentPlay = document.getElementById('btn-incident-play');
  const btnIncidentReset = document.getElementById('btn-incident-reset');

  function renderIncidentTimeline(activeCount) {
    if (!incidentTimeline) return;
    incidentTimeline.innerHTML = '';
    INCIDENT_STEPS.forEach((step, i) => {
      const el = document.createElement('div');
      el.className = 'incident-step' + (i < activeCount ? ' active' : '');
      el.innerHTML = `<span class="incident-step__time">${step.time}</span><span class="incident-step__dot ${step.type}"></span><span class="incident-step__text">${step.text}</span>`;
      incidentTimeline.appendChild(el);
    });
  }

  if (btnIncidentPlay) {
    btnIncidentPlay.addEventListener('click', () => {
      renderIncidentTimeline(0);
      INCIDENT_STEPS.forEach((_, i) => {
        setTimeout(() => renderIncidentTimeline(i + 1), (i + 1) * 700);
      });
    });
  }
  if (btnIncidentReset) btnIncidentReset.addEventListener('click', () => renderIncidentTimeline(0));
  renderIncidentTimeline(0);

  // Checklist toggle
  document.querySelectorAll('.checklist-item').forEach(item => {
    item.addEventListener('click', () => {
      const checked = item.dataset.checked === 'true';
      item.dataset.checked = checked ? 'false' : 'true';
      item.querySelector('.check-icon').textContent = checked ? '☐' : '☑';
    });
  });

  /* ──────────────────────────────────────────────────────
     26. CONFLUENT PLATFORM DASHBOARD
     ────────────────────────────────────────────────────── */
  const cfTabToggle = document.getElementById('confluent-tab-toggle');
  const cfDashboard = document.getElementById('confluent-dashboard');

  const CF_TABS = {
    overview: () => `
      <div class="cf-dash-header"><span class="cf-dash-header__logo">☁️</span><span class="cf-dash-header__title">Cluster Overview</span><span class="cf-dash-header__env">production</span></div>
      <div class="cf-dash-body">
        <div class="cf-metrics-grid">
          <div class="cf-metric-card"><div class="cf-metric-card__value" style="color:var(--accent-teal)">3</div><div class="cf-metric-card__label">Brokers</div><div class="cf-metric-card__trend stable">● All Healthy</div></div>
          <div class="cf-metric-card"><div class="cf-metric-card__value" style="color:var(--accent-orange)">24</div><div class="cf-metric-card__label">Topics</div><div class="cf-metric-card__trend up">↑ +2 this week</div></div>
          <div class="cf-metric-card"><div class="cf-metric-card__value" style="color:var(--accent-blue)">142</div><div class="cf-metric-card__label">Partitions</div><div class="cf-metric-card__trend stable">— Balanced</div></div>
          <div class="cf-metric-card"><div class="cf-metric-card__value" style="color:var(--accent-purple)">8</div><div class="cf-metric-card__label">Consumer Groups</div><div class="cf-metric-card__trend up">↑ 7 Stable, 1 Rebalancing</div></div>
          <div class="cf-metric-card"><div class="cf-metric-card__value" style="color:var(--accent-teal)">45K</div><div class="cf-metric-card__label">Messages/sec</div><div class="cf-metric-card__trend up">↑ 12% vs yesterday</div></div>
          <div class="cf-metric-card"><div class="cf-metric-card__value" style="color:var(--accent-yellow)">2.1</div><div class="cf-metric-card__label">CKUs Used</div><div class="cf-metric-card__trend stable">— Within budget</div></div>
        </div>
        <div class="callout teal"><strong>Cluster Health:</strong> All brokers healthy. ISR count matches replication factor across all partitions. No under-replicated partitions detected.</div>
      </div>`,
    topics: () => `
      <div class="cf-dash-header"><span class="cf-dash-header__logo">📋</span><span class="cf-dash-header__title">Topics</span><span class="cf-dash-header__env">24 topics</span></div>
      <div class="cf-dash-body"><div class="cf-topic-list">
        <div class="cf-topic-row header"><span>Topic Name</span><span>Partitions</span><span>Replication</span><span>Throughput</span><span>Status</span></div>
        <div class="cf-topic-row"><span class="cf-topic-name">order-events</span><span>12</span><span>3</span><span>8.2K msg/s</span><span class="cf-status-badge healthy">Healthy</span></div>
        <div class="cf-topic-row"><span class="cf-topic-name">payment-transactions</span><span>6</span><span>3</span><span>3.1K msg/s</span><span class="cf-status-badge healthy">Healthy</span></div>
        <div class="cf-topic-row"><span class="cf-topic-name">user-activity</span><span>8</span><span>3</span><span>15.4K msg/s</span><span class="cf-status-badge healthy">Healthy</span></div>
        <div class="cf-topic-row"><span class="cf-topic-name">notification-outbox</span><span>4</span><span>3</span><span>1.8K msg/s</span><span class="cf-status-badge warning">High Lag</span></div>
        <div class="cf-topic-row"><span class="cf-topic-name">inventory-updates</span><span>6</span><span>3</span><span>2.5K msg/s</span><span class="cf-status-badge healthy">Healthy</span></div>
        <div class="cf-topic-row"><span class="cf-topic-name">audit-log</span><span>3</span><span>3</span><span>950 msg/s</span><span class="cf-status-badge healthy">Healthy</span></div>
        <div class="cf-topic-row"><span class="cf-topic-name">dead-letter-queue</span><span>1</span><span>3</span><span>12 msg/s</span><span class="cf-status-badge error">Attention</span></div>
      </div></div>`,
    consumers: () => `
      <div class="cf-dash-header"><span class="cf-dash-header__logo">👥</span><span class="cf-dash-header__title">Consumer Groups</span><span class="cf-dash-header__env">8 groups</span></div>
      <div class="cf-dash-body"><div class="cf-cg-list">
        <div class="cf-cg-card"><div class="cf-cg-card__header"><span class="cf-cg-card__name">order-processing-svc</span><span class="cf-cg-card__state stable">STABLE</span></div><div class="cf-cg-card__meta"><span>Members: 4</span><span>Topic: order-events</span><span>Lag: <span class="cf-cg-card__lag low">234</span></span></div></div>
        <div class="cf-cg-card"><div class="cf-cg-card__header"><span class="cf-cg-card__name">notification-svc</span><span class="cf-cg-card__state rebalancing">REBALANCING</span></div><div class="cf-cg-card__meta"><span>Members: 2 → 3</span><span>Topic: notification-outbox</span><span>Lag: <span class="cf-cg-card__lag high">48,291</span></span></div></div>
        <div class="cf-cg-card"><div class="cf-cg-card__header"><span class="cf-cg-card__name">analytics-pipeline</span><span class="cf-cg-card__state stable">STABLE</span></div><div class="cf-cg-card__meta"><span>Members: 8</span><span>Topic: user-activity</span><span>Lag: <span class="cf-cg-card__lag low">89</span></span></div></div>
        <div class="cf-cg-card"><div class="cf-cg-card__header"><span class="cf-cg-card__name">payment-validator</span><span class="cf-cg-card__state stable">STABLE</span></div><div class="cf-cg-card__meta"><span>Members: 3</span><span>Topic: payment-transactions</span><span>Lag: <span class="cf-cg-card__lag low">12</span></span></div></div>
      </div></div>`,
    connectors: () => `
      <div class="cf-dash-header"><span class="cf-dash-header__logo">🔌</span><span class="cf-dash-header__title">Managed Connectors</span><span class="cf-dash-header__env">5 connectors</span></div>
      <div class="cf-dash-body"><div class="cf-connector-grid">
        <div class="cf-connector-card"><div class="cf-connector-card__header"><span class="cf-connector-card__icon">🐘</span><span class="cf-connector-card__name">PostgreSQL CDC</span><span class="cf-connector-card__type source">SOURCE</span></div><div class="cf-connector-card__detail">Debezium · orders DB → order-events · <span style="color:var(--accent-teal)">● Running</span></div></div>
        <div class="cf-connector-card"><div class="cf-connector-card__header"><span class="cf-connector-card__icon">🔍</span><span class="cf-connector-card__name">Elasticsearch Sink</span><span class="cf-connector-card__type sink">SINK</span></div><div class="cf-connector-card__detail">order-events → ES index · <span style="color:var(--accent-teal)">● Running</span></div></div>
        <div class="cf-connector-card"><div class="cf-connector-card__header"><span class="cf-connector-card__icon">📦</span><span class="cf-connector-card__name">S3 Sink (Archive)</span><span class="cf-connector-card__type sink">SINK</span></div><div class="cf-connector-card__detail">audit-log → s3://audit-archive/ · <span style="color:var(--accent-teal)">● Running</span></div></div>
        <div class="cf-connector-card"><div class="cf-connector-card__header"><span class="cf-connector-card__icon">📊</span><span class="cf-connector-card__name">JDBC Source</span><span class="cf-connector-card__type source">SOURCE</span></div><div class="cf-connector-card__detail">inventory DB → inventory-updates · <span style="color:var(--accent-yellow)">● Degraded</span></div></div>
      </div></div>`,
    schema: () => `
      <div class="cf-dash-header"><span class="cf-dash-header__logo">📐</span><span class="cf-dash-header__title">Schema Registry</span><span class="cf-dash-header__env">18 subjects</span></div>
      <div class="cf-dash-body"><div class="cf-topic-list">
        <div class="cf-topic-row header"><span>Subject</span><span>Format</span><span>Version</span><span>Compat</span><span>Status</span></div>
        <div class="cf-topic-row"><span class="cf-topic-name">order-events-value</span><span>Avro</span><span>v3</span><span>BACKWARD</span><span class="cf-status-badge healthy">Valid</span></div>
        <div class="cf-topic-row"><span class="cf-topic-name">payment-transactions-value</span><span>Protobuf</span><span>v2</span><span>FULL</span><span class="cf-status-badge healthy">Valid</span></div>
        <div class="cf-topic-row"><span class="cf-topic-name">user-activity-value</span><span>JSON</span><span>v5</span><span>BACKWARD</span><span class="cf-status-badge healthy">Valid</span></div>
        <div class="cf-topic-row"><span class="cf-topic-name">inventory-updates-value</span><span>Avro</span><span>v1</span><span>NONE</span><span class="cf-status-badge warning">No compat</span></div>
      </div></div>`,
    ksql: () => `
      <div class="cf-dash-header"><span class="cf-dash-header__logo">⚡</span><span class="cf-dash-header__title">ksqlDB Editor</span><span class="cf-dash-header__env">ksqldb-cluster-01</span></div>
      <div class="cf-dash-body">
        <div class="cf-ksql-editor"><span class="cf-ksql-comment">-- Create a stream from order-events topic</span><br><span class="cf-ksql-keyword">CREATE STREAM</span> orders_stream (<br>&nbsp;&nbsp;order_id <span class="cf-ksql-keyword">VARCHAR KEY</span>,<br>&nbsp;&nbsp;user_id <span class="cf-ksql-keyword">VARCHAR</span>,<br>&nbsp;&nbsp;amount <span class="cf-ksql-keyword">DOUBLE</span>,<br>&nbsp;&nbsp;status <span class="cf-ksql-keyword">VARCHAR</span><br>) <span class="cf-ksql-keyword">WITH</span> (<br>&nbsp;&nbsp;kafka_topic = <span class="cf-ksql-string">'order-events'</span>,<br>&nbsp;&nbsp;value_format = <span class="cf-ksql-string">'AVRO'</span><br>);<br><br><span class="cf-ksql-comment">-- Real-time aggregation: revenue per minute</span><br><span class="cf-ksql-keyword">SELECT</span> <br>&nbsp;&nbsp;<span class="cf-ksql-keyword">WINDOWSTART</span> <span class="cf-ksql-keyword">AS</span> window_start,<br>&nbsp;&nbsp;<span class="cf-ksql-keyword">SUM</span>(amount) <span class="cf-ksql-keyword">AS</span> total_revenue,<br>&nbsp;&nbsp;<span class="cf-ksql-keyword">COUNT</span>(*) <span class="cf-ksql-keyword">AS</span> order_count<br><span class="cf-ksql-keyword">FROM</span> orders_stream<br><span class="cf-ksql-keyword">WINDOW TUMBLING</span> (<span class="cf-ksql-keyword">SIZE</span> 1 <span class="cf-ksql-keyword">MINUTE</span>)<br><span class="cf-ksql-keyword">GROUP BY</span> 1<br><span class="cf-ksql-keyword">EMIT CHANGES</span>;</div>
        <div class="callout"><strong>ksqlDB</strong> lets you write SQL queries that run continuously on Kafka streams. Use it for real-time aggregations, joins, filtering, and creating materialized views — no Java/Python code needed.</div>
      </div>`
  };

  function renderCfDashboard(tab) {
    if (!cfDashboard || !CF_TABS[tab]) return;
    cfDashboard.innerHTML = CF_TABS[tab]();
  }

  if (cfTabToggle) {
    cfTabToggle.querySelectorAll('.strategy-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        cfTabToggle.querySelectorAll('.strategy-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        renderCfDashboard(btn.dataset.tab);
      });
    });
    renderCfDashboard('overview');
  }

})();
