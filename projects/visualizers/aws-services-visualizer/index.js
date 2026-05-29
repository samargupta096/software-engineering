/* ═══════════════════════════════════════════════════════
   AWS SERVICES VISUALIZER — Interactive Logic
   ═══════════════════════════════════════════════════════ */
;(function () {
  'use strict';

  // ── TOC Active State ──
  const tocLinks = document.querySelectorAll('.toc__link');
  const tocObs = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        tocLinks.forEach(l => l.classList.remove('active'));
        const link = document.querySelector('.toc__link[data-section="' + e.target.id + '"]');
        if (link) link.classList.add('active');
      }
    });
  }, { threshold: 0.3 });
  document.querySelectorAll('.section').forEach(s => tocObs.observe(s));


  /* ──────────────────────────────────────────────────────
     1. SCROLL REVEAL
     ────────────────────────────────────────────────────── */
  const revealObs = new IntersectionObserver((entries) => {
    entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('visible'); } });
  }, { threshold: 0.08 });
  document.querySelectorAll('.reveal').forEach(s => revealObs.observe(s));

  /* ──────────────────────────────────────────────────────
     2. VPC & NETWORKING
     ────────────────────────────────────────────────────── */
  const vpcSubnets = document.getElementById('vpc-subnets');
  const VPC_DATA = [
    { name: 'Public Subnet A', cidr: '10.0.1.0/24', az: 'us-east-1a', type: 'public',
      resources: [
        { icon: '🚀', name: 'EC2 (Web Server)', desc: 'Public IP, serves traffic' },
        { icon: '⚖️', name: 'ALB', desc: 'Application Load Balancer' },
        { icon: '🔄', name: 'NAT Gateway', desc: 'Outbound for private subnets' },
      ]},
    { name: 'Private Subnet A', cidr: '10.0.2.0/24', az: 'us-east-1a', type: 'private',
      resources: [
        { icon: '🖥️', name: 'EC2 (App Server)', desc: 'No public IP' },
        { icon: '🗄️', name: 'RDS (Primary)', desc: 'Database instance' },
      ]},
    { name: 'Public Subnet B', cidr: '10.0.3.0/24', az: 'us-east-1b', type: 'public',
      resources: [
        { icon: '🚀', name: 'EC2 (Web Server)', desc: 'Multi-AZ redundancy' },
      ]},
    { name: 'Private Subnet B', cidr: '10.0.4.0/24', az: 'us-east-1b', type: 'private',
      resources: [
        { icon: '🗄️', name: 'RDS (Standby)', desc: 'Multi-AZ failover' },
        { icon: '📦', name: 'ElastiCache', desc: 'Redis cluster' },
      ]},
  ];

  function renderVPC() {
    if (!vpcSubnets) return;
    vpcSubnets.innerHTML = VPC_DATA.map((s, i) => `
      <div class="subnet ${s.type}" data-idx="${i}" title="Click to toggle type">
        <div class="subnet__label">${s.type === 'public' ? '🌍' : '🔒'} ${s.name}</div>
        <div style="font-size:.72rem;color:var(--text-muted);margin-bottom:.5rem;font-family:var(--font-mono)">${s.cidr} · ${s.az}</div>
        <div class="subnet__resources">
          ${s.resources.map(r => `
            <div class="resource-chip" title="${r.desc}">
              <span class="icon">${r.icon}</span> ${r.name}
            </div>
          `).join('')}
        </div>
      </div>
    `).join('');
    vpcSubnets.querySelectorAll('.subnet').forEach(el => {
      el.addEventListener('click', () => {
        const idx = +el.dataset.idx;
        VPC_DATA[idx].type = VPC_DATA[idx].type === 'public' ? 'private' : 'public';
        VPC_DATA[idx].name = VPC_DATA[idx].name.replace(/Public|Private/, VPC_DATA[idx].type === 'public' ? 'Public' : 'Private');
        renderVPC();
      });
    });
  }
  renderVPC();

  /* ──────────────────────────────────────────────────────
     3. IAM — Identity & Access
     ────────────────────────────────────────────────────── */
  const iamEntities = document.getElementById('iam-entities');
  const IAM_ENTITIES = [
    { icon: '👤', name: 'User', desc: 'Person or app with long-term credentials' },
    { icon: '👥', name: 'Group', desc: 'Collection of users sharing permissions' },
    { icon: '🎭', name: 'Role', desc: 'Temporary credentials for services/cross-account' },
    { icon: '📜', name: 'Policy', desc: 'JSON document defining permissions' },
    { icon: '🔑', name: 'Access Keys', desc: 'Programmatic access (avoid if possible)' },
  ];
  function renderIAMEntities() {
    if (!iamEntities) return;
    iamEntities.innerHTML = IAM_ENTITIES.map(e => `
      <div class="iam-entity">
        <div class="icon">${e.icon}</div>
        <div class="name">${e.name}</div>
        <div class="desc">${e.desc}</div>
      </div>
    `).join('');
  }
  renderIAMEntities();

  // Policy Simulator
  const POLICIES = [
    { effect: 'Allow', action: 's3:GetObject', resource: 'arn:aws:s3:::my-bucket/*' },
    { effect: 'Allow', action: 's3:PutObject', resource: 'arn:aws:s3:::my-bucket/*' },
    { effect: 'Deny',  action: 's3:DeleteObject', resource: 'arn:aws:s3:::my-bucket/*' },
    { effect: 'Allow', action: 'ec2:DescribeInstances', resource: '*' },
    { effect: 'Deny',  action: 'ec2:TerminateInstances', resource: '*' },
  ];
  let currentAction = 's3:GetObject';
  const policyRules = document.getElementById('policy-rules');
  const policyResult = document.getElementById('policy-result');
  const iamActionToggle = document.getElementById('iam-action-toggle');
  const btnEvalPolicy = document.getElementById('btn-evaluate-policy');

  function renderPolicies() {
    if (!policyRules) return;
    policyRules.innerHTML = POLICIES.map(p => `
      <div class="policy-rule ${p.effect.toLowerCase()}">
        <strong style="min-width:50px;color:${p.effect === 'Allow' ? 'var(--accent-teal)' : 'var(--accent-red)'}">${p.effect}</strong>
        <code>${p.action}</code>
        <span style="color:var(--text-muted);font-size:.8rem">${p.resource}</span>
      </div>
    `).join('');
  }
  renderPolicies();

  function evaluatePolicy() {
    if (!policyResult) return;
    const matching = POLICIES.filter(p => p.action === currentAction || p.action === '*');
    const denied = matching.some(p => p.effect === 'Deny');
    const allowed = matching.some(p => p.effect === 'Allow');
    if (denied) {
      policyResult.className = 'policy-result denied';
      policyResult.textContent = `❌ DENIED — Explicit Deny on ${currentAction}`;
    } else if (allowed) {
      policyResult.className = 'policy-result allowed';
      policyResult.textContent = `✅ ALLOWED — ${currentAction} is permitted`;
    } else {
      policyResult.className = 'policy-result denied';
      policyResult.textContent = `❌ DENIED — No matching Allow for ${currentAction} (implicit deny)`;
    }
  }

  if (iamActionToggle) {
    iamActionToggle.querySelectorAll('.strategy-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        iamActionToggle.querySelectorAll('.strategy-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentAction = btn.dataset.action;
      });
    });
  }
  if (btnEvalPolicy) btnEvalPolicy.addEventListener('click', evaluatePolicy);

  /* ──────────────────────────────────────────────────────
     4. S3 — Object Storage
     ────────────────────────────────────────────────────── */
  const STORAGE_CLASSES = [
    { tier: 'Standard', cost: '$0.023/GB', durability: '99.999999999%', availability: '99.99%', use: 'Frequently accessed data', retrieval: 'Instant' },
    { tier: 'Intelligent', cost: '$0.023/GB', durability: '99.999999999%', availability: '99.9%', use: 'Unknown access patterns', retrieval: 'Instant' },
    { tier: 'Standard-IA', cost: '$0.0125/GB', durability: '99.999999999%', availability: '99.9%', use: 'Infrequent but needs fast access', retrieval: 'Instant, $0.01/GB fee' },
    { tier: 'One Zone-IA', cost: '$0.01/GB', durability: '99.999999999%', availability: '99.5%', use: 'Non-critical infrequent data', retrieval: 'Instant, single AZ only' },
    { tier: 'Glacier Instant', cost: '$0.004/GB', durability: '99.999999999%', availability: '99.9%', use: 'Archive with instant access', retrieval: 'Milliseconds' },
    { tier: 'Glacier Deep', cost: '$0.00099/GB', durability: '99.999999999%', availability: '99.99%', use: 'Long-term archive (7-10yr)', retrieval: '12-48 hours' },
  ];

  const storageClassesEl = document.getElementById('storage-classes');
  const storageDetail = document.getElementById('storage-class-detail');

  function renderStorageClasses() {
    if (!storageClassesEl) return;
    storageClassesEl.innerHTML = STORAGE_CLASSES.map((sc, i) => `
      <div class="storage-class-card" data-idx="${i}">
        <div class="tier">${sc.tier}</div>
        <div class="cost">${sc.cost}</div>
        <div class="use">${sc.use}</div>
      </div>
    `).join('');
    storageClassesEl.querySelectorAll('.storage-class-card').forEach(card => {
      card.addEventListener('click', () => {
        storageClassesEl.querySelectorAll('.storage-class-card').forEach(c => c.classList.remove('selected'));
        card.classList.add('selected');
        const sc = STORAGE_CLASSES[+card.dataset.idx];
        if (storageDetail) {
          storageDetail.innerHTML = `<strong>📦 ${sc.tier}</strong> — Cost: <code>${sc.cost}</code> · Durability: <code>${sc.durability}</code> · Availability: <code>${sc.availability}</code> · Retrieval: ${sc.retrieval}. <br/><strong>Best for:</strong> ${sc.use}`;
        }
      });
    });
  }
  renderStorageClasses();

  // S3 Upload / Versioning
  let s3VersionCounter = 0;
  let s3Objects = [];
  const s3ObjectsEl = document.getElementById('s3-objects');
  const s3VersionsEl = document.getElementById('s3-versions');
  const btnS3Upload = document.getElementById('btn-s3-upload');
  const btnS3Version = document.getElementById('btn-s3-version');
  const btnS3Delete = document.getElementById('btn-s3-delete');

  function renderS3() {
    if (!s3ObjectsEl || !s3VersionsEl) return;
    const latest = s3Objects[s3Objects.length - 1];
    s3ObjectsEl.innerHTML = latest && !latest.deleted
      ? `<div class="s3-object">📄 ${latest.name}</div>` : latest && latest.deleted
      ? `<div class="s3-object" style="opacity:.5;border-color:var(--accent-red)">🗑️ ${latest.name} (delete marker)</div>` : '';
    s3VersionsEl.innerHTML = s3Objects.map((o, i) => `
      <div class="version-item ${i === s3Objects.length - 1 ? 'current' : 'old'}">
        <span>${o.deleted ? '🗑️' : '📄'} v${o.version}</span>
        <span style="color:var(--text-muted)">${o.deleted ? 'Delete Marker' : o.size}</span>
      </div>
    `).reverse().join('');
  }

  if (btnS3Upload) btnS3Upload.addEventListener('click', () => {
    s3VersionCounter++;
    s3Objects.push({ name: 'report.pdf', version: s3VersionCounter, size: `${Math.floor(Math.random() * 500 + 100)}KB`, deleted: false });
    renderS3();
  });
  if (btnS3Version) btnS3Version.addEventListener('click', () => {
    if (s3Objects.length === 0) return;
    s3VersionCounter++;
    s3Objects.push({ name: 'report.pdf', version: s3VersionCounter, size: `${Math.floor(Math.random() * 500 + 100)}KB`, deleted: false });
    renderS3();
  });
  if (btnS3Delete) btnS3Delete.addEventListener('click', () => {
    if (s3Objects.length === 0) return;
    s3VersionCounter++;
    s3Objects.push({ name: 'report.pdf', version: s3VersionCounter, deleted: true });
    renderS3();
  });

  /* ──────────────────────────────────────────────────────
     5. SQS — Message Queuing
     ────────────────────────────────────────────────────── */
  let sqsState = { type: 'standard', nextId: 1, queue: [], processed: [], dlq: [], sent: [] };
  const sqsTypeToggle = document.getElementById('sqs-type-toggle');
  const sqsSent = document.getElementById('sqs-sent');
  const sqsQueue = document.getElementById('sqs-queue');
  const sqsProcessed = document.getElementById('sqs-processed');
  const sqsDlq = document.getElementById('sqs-dlq');
  const sqsStats = document.getElementById('sqs-stats');
  const btnSqsSend = document.getElementById('btn-sqs-send');
  const btnSqsSend5 = document.getElementById('btn-sqs-send5');
  const btnSqsProcess = document.getElementById('btn-sqs-process');

  function renderSQS() {
    if (!sqsQueue) return;
    const renderMsgs = (arr, el, cls) => {
      if (!el) return;
      el.innerHTML = arr.slice(-6).map(m => `
        <div class="queue-msg ${cls}">
          ${m.type === 'fifo' ? '📋' : '📨'} MSG-${m.id} ${m.attempts > 0 ? `(${m.attempts}x)` : ''}
        </div>
      `).join('');
    };
    renderMsgs(sqsState.sent, sqsSent, '');
    renderMsgs(sqsState.queue, sqsQueue, 'processing');
    renderMsgs(sqsState.processed, sqsProcessed, 'done');
    renderMsgs(sqsState.dlq, sqsDlq, 'dlq');

    if (sqsStats) {
      sqsStats.innerHTML = [
        { val: sqsState.sent.length, label: 'Sent' },
        { val: sqsState.queue.length, label: 'In Queue' },
        { val: sqsState.processed.length, label: 'Processed' },
        { val: sqsState.dlq.length, label: 'Dead Letter' },
      ].map(s => `
        <div class="queue-stat">
          <div class="queue-stat__val">${s.val}</div>
          <div class="queue-stat__label">${s.label}</div>
        </div>
      `).join('');
    }
  }

  function sqsSend() {
    const msg = { id: sqsState.nextId++, type: sqsState.type, attempts: 0 };
    sqsState.sent.push(msg);
    sqsState.queue.push(msg);
    renderSQS();
  }

  function sqsProcess() {
    if (sqsState.queue.length === 0) return;
    const idx = sqsState.type === 'fifo' ? 0 : Math.floor(Math.random() * sqsState.queue.length);
    const msg = sqsState.queue[idx];
    msg.attempts++;
    const fails = Math.random() < 0.3;
    if (fails && msg.attempts < 3) {
      renderSQS();
    } else if (fails && msg.attempts >= 3) {
      sqsState.queue.splice(idx, 1);
      sqsState.dlq.push(msg);
      renderSQS();
    } else {
      sqsState.queue.splice(idx, 1);
      sqsState.processed.push(msg);
      renderSQS();
    }
  }

  if (sqsTypeToggle) {
    sqsTypeToggle.querySelectorAll('.strategy-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        sqsTypeToggle.querySelectorAll('.strategy-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        sqsState.type = btn.dataset.type;
      });
    });
  }
  if (btnSqsSend) btnSqsSend.addEventListener('click', sqsSend);
  if (btnSqsSend5) btnSqsSend5.addEventListener('click', () => { for (let i = 0; i < 5; i++) setTimeout(sqsSend, i * 100); });
  if (btnSqsProcess) btnSqsProcess.addEventListener('click', sqsProcess);
  renderSQS();

  /* ──────────────────────────────────────────────────────
     6. SNS — Fan-Out
     ────────────────────────────────────────────────────── */
  const snsTopic = document.getElementById('sns-topic');
  const fanoutSubs = document.getElementById('fanout-subs');
  const btnSnsPublish = document.getElementById('btn-sns-publish');
  const btnSnsReset = document.getElementById('btn-sns-reset');

  function snsPublish() {
    if (!snsTopic) return;
    snsTopic.classList.add('active');
    const arrows = document.querySelectorAll('.fanout-arrow');
    const subs = fanoutSubs ? fanoutSubs.querySelectorAll('.subscriber-node') : [];
    arrows.forEach((a, i) => setTimeout(() => a.classList.add('active'), 200 + i * 150));
    subs.forEach((s, i) => setTimeout(() => s.classList.add('received'), 500 + i * 200));
  }

  function snsReset() {
    if (snsTopic) snsTopic.classList.remove('active');
    document.querySelectorAll('.fanout-arrow').forEach(a => a.classList.remove('active'));
    if (fanoutSubs) fanoutSubs.querySelectorAll('.subscriber-node').forEach(s => s.classList.remove('received'));
  }

  if (btnSnsPublish) btnSnsPublish.addEventListener('click', snsPublish);
  if (btnSnsReset) btnSnsReset.addEventListener('click', snsReset);

  /* ──────────────────────────────────────────────────────
     7. SNS + SQS Fan-Out Pipeline
     ────────────────────────────────────────────────────── */
  const PIPE_NODES = ['pipe-producer','pipe-sns','pipe-sqs1','pipe-sqs2','pipe-sqs3','pipe-lambda1','pipe-lambda2','pipe-lambda3'];
  const PIPE_CONNS = ['pipe-c1','pipe-c2a','pipe-c2b','pipe-c2c','pipe-c3a','pipe-c3b','pipe-c3c'];
  const btnFanoutRun = document.getElementById('btn-fanout-run');
  const btnFanoutReset = document.getElementById('btn-fanout-reset');

  function runFanoutPipeline() {
    resetFanoutPipeline();
    const stages = [
      { nodes: ['pipe-producer'], conns: [], delay: 0 },
      { nodes: [], conns: ['pipe-c1'], delay: 400 },
      { nodes: ['pipe-sns'], conns: [], delay: 800 },
      { nodes: [], conns: ['pipe-c2a','pipe-c2b','pipe-c2c'], delay: 1200 },
      { nodes: ['pipe-sqs1','pipe-sqs2','pipe-sqs3'], conns: [], delay: 1600 },
      { nodes: [], conns: ['pipe-c3a','pipe-c3b','pipe-c3c'], delay: 2000 },
      { nodes: ['pipe-lambda1','pipe-lambda2','pipe-lambda3'], conns: [], delay: 2400 },
    ];
    stages.forEach(stage => {
      setTimeout(() => {
        stage.nodes.forEach(id => { const el = document.getElementById(id); if (el) { el.classList.remove('active'); el.classList.add('complete'); }});
        stage.conns.forEach(id => { const el = document.getElementById(id); if (el) el.classList.add('active'); });
      }, stage.delay);
    });
  }

  function resetFanoutPipeline() {
    PIPE_NODES.forEach(id => { const el = document.getElementById(id); if (el) { el.classList.remove('active','complete'); }});
    PIPE_CONNS.forEach(id => { const el = document.getElementById(id); if (el) el.classList.remove('active'); });
  }

  if (btnFanoutRun) btnFanoutRun.addEventListener('click', runFanoutPipeline);
  if (btnFanoutReset) btnFanoutReset.addEventListener('click', resetFanoutPipeline);

  /* ──────────────────────────────────────────────────────
     8. ECS / EKS — Container Scaling
     ────────────────────────────────────────────────────── */
  const sliderTasks = document.getElementById('slider-tasks');
  const valTasks = document.getElementById('val-tasks');
  const taskGrid = document.getElementById('task-grid');
  const launchToggle = document.getElementById('launch-type-toggle');
  let launchType = 'fargate';

  function renderTasks() {
    if (!taskGrid || !sliderTasks) return;
    const count = parseInt(sliderTasks.value);
    taskGrid.innerHTML = '';
    for (let i = 0; i < count; i++) {
      const box = document.createElement('div');
      box.className = 'task-box running';
      box.innerHTML = `<div class="task-icon">${launchType === 'fargate' ? '🚀' : '🖥️'}</div><span>${launchType === 'fargate' ? 'Fargate' : 'EC2'} #${i + 1}</span>`;
      box.style.animationDelay = `${i * 0.05}s`;
      taskGrid.appendChild(box);
    }
  }

  if (sliderTasks) {
    renderTasks();
    sliderTasks.addEventListener('input', () => { if (valTasks) valTasks.textContent = sliderTasks.value; renderTasks(); });
  }
  if (launchToggle) {
    launchToggle.querySelectorAll('.strategy-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        launchToggle.querySelectorAll('.strategy-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        launchType = btn.dataset.type;
        renderTasks();
      });
    });
  }

  /* ──────────────────────────────────────────────────────
     9. STEP FUNCTIONS — State Machine
     ────────────────────────────────────────────────────── */
  const SF_SUCCESS_PATH = ['sf-start','sf-c1','sf-validate','sf-c2','sf-check','sf-c3','sf-charge','sf-c4','sf-ship','sf-c5','sf-notify','sf-c6','sf-end'];
  const SF_FAIL_PATH = ['sf-start','sf-c1','sf-validate','sf-c2','sf-check','sf-c3','sf-refund','sf-c7','sf-end-fail'];
  const btnSfRun = document.getElementById('btn-sf-run');
  const btnSfFail = document.getElementById('btn-sf-fail');
  const btnSfReset = document.getElementById('btn-sf-reset');

  function resetSF() {
    [...SF_SUCCESS_PATH, ...SF_FAIL_PATH].forEach(id => {
      const el = document.getElementById(id);
      if (el) { el.classList.remove('active','success','failed'); }
    });
  }

  function runSF(path, isSuccess) {
    resetSF();
    path.forEach((id, i) => {
      setTimeout(() => {
        const el = document.getElementById(id);
        if (!el) return;
        if (el.classList.contains('state-connector')) {
          el.classList.add('active');
        } else {
          el.classList.add('active');
          setTimeout(() => {
            el.classList.remove('active');
            el.classList.add(isSuccess || i < path.length - 1 ? 'success' : 'failed');
            if (!isSuccess && i === path.length - 1) el.classList.add('failed');
          }, 280);
        }
      }, i * 350);
    });
  }

  if (btnSfRun) btnSfRun.addEventListener('click', () => runSF(SF_SUCCESS_PATH, true));
  if (btnSfFail) btnSfFail.addEventListener('click', () => runSF(SF_FAIL_PATH, false));
  if (btnSfReset) btnSfReset.addEventListener('click', resetSF);

  /* ──────────────────────────────────────────────────────
     10. CLOUDWATCH & EVENTBRIDGE
     ────────────────────────────────────────────────────── */
  const cwMetrics = document.getElementById('cw-metrics');
  const btnCwRefresh = document.getElementById('btn-cw-refresh');
  const btnCwAlarm = document.getElementById('btn-cw-alarm');

  const CW_METRICS = [
    { name: 'CPU Utilization', unit: '%', min: 10, max: 95 },
    { name: 'Memory Usage', unit: '%', min: 20, max: 85 },
    { name: 'Request Count', unit: '/min', min: 100, max: 5000 },
    { name: 'Latency (p99)', unit: 'ms', min: 5, max: 500 },
    { name: 'Error Rate', unit: '%', min: 0, max: 5 },
    { name: 'Network In', unit: 'MB/s', min: 1, max: 100 },
  ];

  function renderCWMetrics(alarm) {
    if (!cwMetrics) return;
    cwMetrics.innerHTML = CW_METRICS.map(m => {
      const val = alarm && m.name === 'CPU Utilization' ? 98 : Math.floor(Math.random() * (m.max - m.min) + m.min);
      const pct = Math.min(100, (val / m.max) * 100);
      const isAlarming = alarm && m.name === 'CPU Utilization';
      return `
        <div class="metric-card" style="${isAlarming ? 'border-color:var(--accent-red);box-shadow:0 0 20px var(--accent-red-glow)' : ''}">
          <div class="metric-card__name">${m.name}</div>
          <div class="metric-card__value" style="${isAlarming ? 'color:var(--accent-red)' : ''}">${val}${m.unit}</div>
          <div class="metric-card__bar">
            <div class="metric-card__fill" style="width:${pct}%;${isAlarming ? 'background:var(--accent-red)' : ''}"></div>
          </div>
          ${isAlarming ? '<div style="font-size:.72rem;color:var(--accent-red);margin-top:.4rem;font-weight:700">🚨 ALARM: Threshold exceeded!</div>' : ''}
        </div>
      `;
    }).join('');
  }
  renderCWMetrics(false);
  if (btnCwRefresh) btnCwRefresh.addEventListener('click', () => renderCWMetrics(false));
  if (btnCwAlarm) btnCwAlarm.addEventListener('click', () => renderCWMetrics(true));

  // EventBridge
  const ebSourceToggle = document.getElementById('eb-source-toggle');
  const btnEbFire = document.getElementById('btn-eb-fire');
  const ebRuleSource = document.getElementById('eb-rule-source');
  const ebRuleDetail = document.getElementById('eb-rule-detail');
  const ebRulePattern = document.getElementById('eb-rule-pattern');
  const ebTargets = document.getElementById('eb-targets');

  const EB_SOURCES = {
    ec2: { source: 'aws.ec2', detail: 'EC2 Instance State-change', pattern: '{"state": "stopped"}' },
    s3: { source: 'aws.s3', detail: 'Object Created', pattern: '{"bucket": "my-bucket"}' },
    custom: { source: 'com.myapp', detail: 'Order Placed', pattern: '{"status": "new"}' },
  };
  let ebCurrentSource = 'ec2';

  if (ebSourceToggle) {
    ebSourceToggle.querySelectorAll('.strategy-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        ebSourceToggle.querySelectorAll('.strategy-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        ebCurrentSource = btn.dataset.source;
        const src = EB_SOURCES[ebCurrentSource];
        if (ebRuleSource) ebRuleSource.textContent = src.source;
        if (ebRuleDetail) ebRuleDetail.textContent = src.detail;
        if (ebRulePattern) ebRulePattern.textContent = src.pattern;
        if (ebTargets) ebTargets.querySelectorAll('.event-target').forEach(t => t.classList.remove('triggered'));
      });
    });
  }

  if (btnEbFire) {
    btnEbFire.addEventListener('click', () => {
      if (!ebTargets) return;
      const targets = ebTargets.querySelectorAll('.event-target');
      targets.forEach(t => t.classList.remove('triggered'));
      targets.forEach((t, i) => setTimeout(() => t.classList.add('triggered'), 200 + i * 250));
    });
  }

  /* ──────────────────────────────────────────────────────
     11. LAMBDA & API GATEWAY — Request Flow
     ────────────────────────────────────────────────────── */
  const RF_NODES = ['rf-client','rf-apigw','rf-lambda','rf-db','rf-response'];
  const RF_ARROWS = ['rf-a1','rf-a2','rf-a3','rf-a4'];
  const btnLambdaRun = document.getElementById('btn-lambda-run');
  const btnLambdaCold = document.getElementById('btn-lambda-cold');
  const lambdaMetrics = document.getElementById('lambda-metrics');

  function resetRF() {
    RF_NODES.forEach(id => { const el = document.getElementById(id); if (el) el.classList.remove('active','complete'); });
    RF_ARROWS.forEach(id => { const el = document.getElementById(id); if (el) el.classList.remove('active'); });
  }

  function runRequestFlow(cold) {
    resetRF();
    const baseDelay = cold ? 600 : 300;
    const steps = [];
    for (let i = 0; i < RF_NODES.length; i++) {
      if (i > 0) steps.push({ type: 'arrow', id: RF_ARROWS[i - 1], delay: baseDelay * (i * 2 - 1) });
      steps.push({ type: 'node', id: RF_NODES[i], delay: baseDelay * i * 2 });
    }
    steps.forEach(step => {
      setTimeout(() => {
        const el = document.getElementById(step.id);
        if (!el) return;
        if (step.type === 'arrow') el.classList.add('active');
        else { el.classList.add('active'); setTimeout(() => { el.classList.remove('active'); el.classList.add('complete'); }, 250); }
      }, step.delay);
    });

    const totalTime = cold ? 1200 : 45;
    if (lambdaMetrics) {
      setTimeout(() => {
        lambdaMetrics.innerHTML = [
          { val: `${totalTime}ms`, label: 'Total Latency' },
          { val: cold ? '~800ms' : '~1ms', label: cold ? 'Cold Start' : 'Warm Start' },
          { val: '128MB', label: 'Memory' },
          { val: '$0.0000002', label: 'Cost' },
        ].map(s => `
          <div class="queue-stat">
            <div class="queue-stat__val">${s.val}</div>
            <div class="queue-stat__label">${s.label}</div>
          </div>
        `).join('');
      }, baseDelay * RF_NODES.length * 2);
    }
  }

  if (btnLambdaRun) btnLambdaRun.addEventListener('click', () => runRequestFlow(false));
  if (btnLambdaCold) btnLambdaCold.addEventListener('click', () => runRequestFlow(true));


  /* ──────────────────────────────────────────────────────
     11. DYNAMODB
     ────────────────────────────────────────────────────── */
  // Schema Toggle
  const ddbSchemaToggle = document.getElementById('ddb-schema-toggle');
  const ddbTable = document.getElementById('ddb-table');
  const SCHEMAS = {
    simple: `
      <div class="ddb-row header">
        <div class="ddb-cell pk">PK (Partition Key)</div>
        <div class="ddb-cell attr">Attributes</div>
      </div>
      <div class="ddb-row">
        <div class="ddb-cell pk">USER#123</div>
        <div class="ddb-cell attr">{"name": "Alice", "email": "a@b.com"}</div>
      </div>
      <div class="ddb-row">
        <div class="ddb-cell pk">USER#456</div>
        <div class="ddb-cell attr">{"name": "Bob", "email": "b@c.com"}</div>
      </div>
    `,
    composite: `
      <div class="ddb-row header">
        <div class="ddb-cell pk">PK (Partition Key)</div>
        <div class="ddb-cell sk">SK (Sort Key)</div>
        <div class="ddb-cell attr">Attributes</div>
      </div>
      <div class="ddb-row">
        <div class="ddb-cell pk">USER#123</div>
        <div class="ddb-cell sk">ORDER#1001</div>
        <div class="ddb-cell attr">{"total": 50, "status": "shipped"}</div>
      </div>
      <div class="ddb-row">
        <div class="ddb-cell pk">USER#123</div>
        <div class="ddb-cell sk">ORDER#1002</div>
        <div class="ddb-cell attr">{"total": 120, "status": "pending"}</div>
      </div>
    `,
    'single-table': `
      <div class="ddb-row header">
        <div class="ddb-cell pk">PK (Partition Key)</div>
        <div class="ddb-cell sk">SK (Sort Key)</div>
        <div class="ddb-cell attr">Attributes</div>
      </div>
      <div class="ddb-row">
        <div class="ddb-cell pk">USER#123</div>
        <div class="ddb-cell sk">PROFILE</div>
        <div class="ddb-cell attr">{"name": "Alice"}</div>
      </div>
      <div class="ddb-row">
        <div class="ddb-cell pk">USER#123</div>
        <div class="ddb-cell sk">ORDER#1001</div>
        <div class="ddb-cell attr">{"total": 50}</div>
      </div>
      <div class="ddb-row">
        <div class="ddb-cell pk">PRODUCT#99</div>
        <div class="ddb-cell sk">INVENTORY</div>
        <div class="ddb-cell attr">{"stock": 42}</div>
      </div>
    `
  };
  if (ddbSchemaToggle && ddbTable) {
    const renderSchema = (s) => ddbTable.innerHTML = SCHEMAS[s] || '';
    renderSchema('simple');
    ddbSchemaToggle.querySelectorAll('.strategy-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        ddbSchemaToggle.querySelectorAll('.strategy-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        renderSchema(btn.dataset.schema);
      });
    });
  }

  // Capacity Toggle
  const ddbCapToggle = document.getElementById('ddb-capacity-toggle');
  if (ddbCapToggle) {
    ddbCapToggle.querySelectorAll('.strategy-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        ddbCapToggle.querySelectorAll('.strategy-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const mode = btn.dataset.mode;
        document.getElementById('ddb-cap-left').style.opacity = mode === 'ondemand' ? '1' : '0.4';
        document.getElementById('ddb-cap-right').style.opacity = mode === 'provisioned' ? '1' : '0.4';
      });
    });
    document.getElementById('ddb-cap-right').style.opacity = '0.4'; // Default
  }

  // Index Demo
  const ddbIndexToggle = document.getElementById('ddb-index-toggle');
  const ddbIndexDemo = document.getElementById('ddb-index-demo');
  const INDEX_VIEWS = {
    none: `
      <div class="ddb-index-view">
        <div class="ddb-index-title">Base Table</div>
        <div class="ddb-table">
          <div class="ddb-row header"><div class="ddb-cell pk">PK (UserId)</div><div class="ddb-cell sk">SK (OrderId)</div><div class="ddb-cell attr">Amount</div><div class="ddb-cell attr">Date</div></div>
          <div class="ddb-row"><div class="ddb-cell pk">U1</div><div class="ddb-cell sk">O1</div><div class="ddb-cell attr">$50</div><div class="ddb-cell attr">2026-01-01</div></div>
          <div class="ddb-row"><div class="ddb-cell pk">U1</div><div class="ddb-cell sk">O2</div><div class="ddb-cell attr">$20</div><div class="ddb-cell attr">2026-02-15</div></div>
        </div>
        <p style="margin-top:1rem;font-size:0.8rem;color:var(--text-muted)">Can easily query: "Get all orders for User U1". Cannot efficiently query by Date or Amount.</p>
      </div>
    `,
    gsi: `
      <div class="ddb-index-view">
        <div class="ddb-index-title">GSI (Partition by Date)</div>
        <div class="ddb-table">
          <div class="ddb-row header"><div class="ddb-cell pk">GSI PK (Date)</div><div class="ddb-cell sk">GSI SK (Amount)</div><div class="ddb-cell attr">UserId</div><div class="ddb-cell attr">OrderId</div></div>
          <div class="ddb-row"><div class="ddb-cell pk">2026-01-01</div><div class="ddb-cell sk">$50</div><div class="ddb-cell attr">U1</div><div class="ddb-cell attr">O1</div></div>
          <div class="ddb-row"><div class="ddb-cell pk">2026-02-15</div><div class="ddb-cell sk">$20</div><div class="ddb-cell attr">U1</div><div class="ddb-cell attr">O2</div></div>
        </div>
        <p style="margin-top:1rem;font-size:0.8rem;color:var(--text-muted)">Unlocks query: "Get all orders placed on 2026-01-01, sorted by Amount".</p>
      </div>
    `,
    lsi: `
      <div class="ddb-index-view">
        <div class="ddb-index-title">LSI (Same PK, New SK)</div>
        <div class="ddb-table">
          <div class="ddb-row header"><div class="ddb-cell pk">PK (UserId)</div><div class="ddb-cell sk">LSI SK (Date)</div><div class="ddb-cell attr">OrderId</div><div class="ddb-cell attr">Amount</div></div>
          <div class="ddb-row"><div class="ddb-cell pk">U1</div><div class="ddb-cell sk">2026-01-01</div><div class="ddb-cell attr">O1</div><div class="ddb-cell attr">$50</div></div>
          <div class="ddb-row"><div class="ddb-cell pk">U1</div><div class="ddb-cell sk">2026-02-15</div><div class="ddb-cell attr">O2</div><div class="ddb-cell attr">$20</div></div>
        </div>
        <p style="margin-top:1rem;font-size:0.8rem;color:var(--text-muted)">Unlocks query: "Get all orders for User U1, sorted by Date instead of OrderId".</p>
      </div>
    `
  };
  if (ddbIndexToggle && ddbIndexDemo) {
    const renderIdx = (i) => ddbIndexDemo.innerHTML = INDEX_VIEWS[i] || '';
    renderIdx('none');
    ddbIndexToggle.querySelectorAll('.strategy-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        ddbIndexToggle.querySelectorAll('.strategy-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        renderIdx(btn.dataset.idx);
      });
    });
  }

  // DynamoDB Streams
  const btnDdbStream = document.getElementById('btn-ddb-stream');
  const btnDdbStreamReset = document.getElementById('btn-ddb-stream-reset');
  if (btnDdbStream) {
    btnDdbStream.addEventListener('click', () => {
      const nodes = ['ddb-sf-table', 'ddb-sf-a1', 'ddb-sf-stream', 'ddb-sf-a2', 'ddb-sf-lambda', 'ddb-sf-a3', 'ddb-sf-es'];
      nodes.forEach((id, i) => {
        setTimeout(() => {
          const el = document.getElementById(id);
          if (el) {
            el.style.opacity = '1';
            el.style.color = id.includes('-a') ? 'var(--accent-teal)' : 'var(--bg-primary)';
            if (!id.includes('-a')) {
              el.style.backgroundColor = 'var(--accent-teal)';
              el.style.transform = 'scale(1.05)';
            }
          }
        }, i * 400);
      });
    });
  }
  if (btnDdbStreamReset) {
    btnDdbStreamReset.addEventListener('click', () => {
      const nodes = ['ddb-sf-table', 'ddb-sf-a1', 'ddb-sf-stream', 'ddb-sf-a2', 'ddb-sf-lambda', 'ddb-sf-a3', 'ddb-sf-es'];
      nodes.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
          el.style.opacity = '0.5';
          el.style.color = '';
          el.style.backgroundColor = '';
          el.style.transform = 'scale(1)';
        }
      });
    });
  }

  /* ──────────────────────────────────────────────────────
     12. VPC ADVANCED
     ────────────────────────────────────────────────────── */
  // Transit Gateway
  const tgwSpokes = document.querySelectorAll('.tgw-spoke');
  if (tgwSpokes.length > 0) {
    tgwSpokes.forEach(spoke => {
      spoke.addEventListener('click', () => {
        spoke.classList.toggle('active');
      });
    });
  }

  // VPC Endpoints
  const vpcEpToggle = document.getElementById('vpc-ep-toggle');
  const vpcEpFlow = document.getElementById('vpc-ep-flow');
  const vpcEpCallout = document.getElementById('vpc-ep-callout');
  if (vpcEpToggle && vpcEpFlow) {
    vpcEpToggle.querySelectorAll('.strategy-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        vpcEpToggle.querySelectorAll('.strategy-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const ep = btn.dataset.ep;
        document.getElementById('ep-endpoint').innerText = ep === 'gateway' ? '🔗 Gateway EP' : '🔗 Interface EP (ENI)';
        document.getElementById('ep-service').innerText = ep === 'gateway' ? '📦 S3 / DynamoDB' : '📦 Kinesis, SNS, etc.';
        vpcEpCallout.innerHTML = ep === 'gateway'
          ? '<strong>Gateway Endpoints:</strong> Free. Route table entry. Supports S3 and DynamoDB only. Traffic stays on AWS backbone.'
          : '<strong>Interface Endpoints:</strong> Costs ~$0.01/hr + data. Elastic Network Interface (ENI) with private IP. Powered by PrivateLink. Supports 80+ services.';
      });
    });
  }

  // Flow Logs
  const btnFlowlogGen = document.getElementById('btn-flowlog-gen');
  const flowlogTable = document.getElementById('flowlog-table');
  if (btnFlowlogGen && flowlogTable) {
    btnFlowlogGen.addEventListener('click', () => {
      flowlogTable.innerHTML = `
        <div class="ddb-row header">
          <div class="ddb-cell" style="width:50px">Version</div><div class="ddb-cell pk">Account</div><div class="ddb-cell sk">ENI</div>
          <div class="ddb-cell attr">Src IP</div><div class="ddb-cell attr">Dest IP</div><div class="ddb-cell" style="width:80px">Action</div>
        </div>
        <div class="ddb-row" style="animation:slideIn 0.3s ease">
          <div class="ddb-cell" style="width:50px">2</div><div class="ddb-cell pk">123456789012</div><div class="ddb-cell sk">eni-1235b8ca</div>
          <div class="ddb-cell attr">10.0.1.14</div><div class="ddb-cell attr">192.168.1.5</div><div class="ddb-cell" style="width:80px;color:var(--accent-teal)">ACCEPT</div>
        </div>
        <div class="ddb-row" style="animation:slideIn 0.6s ease">
          <div class="ddb-cell" style="width:50px">2</div><div class="ddb-cell pk">123456789012</div><div class="ddb-cell sk">eni-1235b8ca</div>
          <div class="ddb-cell attr">103.45.67.89</div><div class="ddb-cell attr">10.0.1.14</div><div class="ddb-cell" style="width:80px;color:var(--accent-red)">REJECT</div>
        </div>
      `;
    });
  }

  /* ──────────────────────────────────────────────────────
     13. STEP FUNCTIONS ADVANCED
     ────────────────────────────────────────────────────── */
  const btnSagaRun = document.getElementById('btn-saga-run');
  const btnSagaFail = document.getElementById('btn-saga-fail');
  const btnSagaReset = document.getElementById('btn-saga-reset');
  const sagaCompensate = document.getElementById('saga-compensate');
  let sagaTimer = null;

  const resetSaga = () => {
    clearTimeout(sagaTimer);
    document.querySelectorAll('.saga-step').forEach(el => {
      el.classList.remove('active', 'success', 'failed');
    });
    document.querySelectorAll('.state-connector').forEach(el => el.classList.remove('active'));
    if (sagaCompensate) sagaCompensate.style.display = 'none';
  };

  if (btnSagaRun) {
    btnSagaRun.addEventListener('click', () => {
      resetSaga();
      const steps = ['saga-reserve', 'saga-c1', 'saga-payment', 'saga-c2', 'saga-ship', 'saga-c3', 'saga-notify'];
      steps.forEach((id, i) => {
        setTimeout(() => {
          const el = document.getElementById(id);
          if (!el) return;
          if (id.includes('-c')) el.classList.add('active');
          else el.classList.add('success');
        }, i * 600);
      });
    });
  }

  if (btnSagaFail) {
    btnSagaFail.addEventListener('click', () => {
      resetSaga();
      const runSteps = ['saga-reserve', 'saga-c1', 'saga-payment'];
      runSteps.forEach((id, i) => {
        setTimeout(() => {
          const el = document.getElementById(id);
          if (!el) return;
          if (id.includes('-c')) el.classList.add('active');
          else if (id === 'saga-payment') el.classList.add('failed');
          else el.classList.add('success');
        }, i * 600);
      });
      sagaTimer = setTimeout(() => {
        if (sagaCompensate) sagaCompensate.style.display = 'flex';
        setTimeout(() => document.getElementById('saga-comp-refund')?.classList.add('success'), 400);
        setTimeout(() => document.getElementById('saga-cc1')?.classList.add('active'), 1000);
        setTimeout(() => document.getElementById('saga-comp-reserve')?.classList.add('success'), 1600);
      }, runSteps.length * 600 + 400);
    });
  }
  if (btnSagaReset) btnSagaReset.addEventListener('click', resetSaga);

  /* ──────────────────────────────────────────────────────
     14. API GATEWAY ADVANCED
     ────────────────────────────────────────────────────── */
  const btnApigwRun = document.getElementById('btn-apigw-run');
  const btnApigwFail = document.getElementById('btn-apigw-fail');
  const btnApigwCache = document.getElementById('btn-apigw-cache');

  const runApigwFlow = (outcome) => {
    const nodes = ['agw-client', 'agw-c1', 'agw-auth', 'agw-c2', 'agw-throttle', 'agw-c3', 'agw-cache', 'agw-c4', 'agw-integration'];
    // Reset
    nodes.forEach(id => {
      const el = document.getElementById(id);
      if (el) { el.style.opacity = '0.5'; el.style.backgroundColor = ''; el.style.color = ''; el.style.transform = 'scale(1)'; }
    });

    nodes.forEach((id, i) => {
      setTimeout(() => {
        // Stop logic
        if (outcome === 'fail' && i > 4) return; // Stop after throttle
        if (outcome === 'cache' && i > 6) return; // Stop after cache

        const el = document.getElementById(id);
        if (!el) return;
        el.style.opacity = '1';
        
        if (!id.includes('-c')) {
          el.style.transform = 'scale(1.05)';
          el.style.color = 'var(--bg-primary)';
          
          if (id === 'agw-throttle' && outcome === 'fail') {
            el.style.backgroundColor = 'var(--accent-red)';
            el.innerHTML = '🚦 Throttled (429)';
          } else if (id === 'agw-cache' && outcome === 'cache') {
            el.style.backgroundColor = 'var(--accent-teal)';
            el.innerHTML = '📦 Cache HIT';
          } else {
            // Restore text if needed
            if (id === 'agw-throttle') el.innerHTML = '🚦 Throttling';
            if (id === 'agw-cache') el.innerHTML = '📦 Cache';
            // Set success color based on type
            if (id === 'agw-auth') el.style.backgroundColor = 'var(--accent-purple)';
            else if (id === 'agw-integration') el.style.backgroundColor = 'var(--accent-orange)';
            else el.style.backgroundColor = 'var(--accent-teal)';
          }
        }
      }, i * 400);
    });
  };

  if (btnApigwRun) btnApigwRun.addEventListener('click', () => runApigwFlow('success'));
  if (btnApigwFail) btnApigwFail.addEventListener('click', () => runApigwFlow('fail'));
  if (btnApigwCache) btnApigwCache.addEventListener('click', () => runApigwFlow('cache'));

  /* ──────────────────────────────────────────────────────
     15. SECURITY & IAM ADVANCED
     ────────────────────────────────────────────────────── */
  // GuardDuty
  const btnGdScan = document.getElementById('btn-gd-scan');
  const btnGdThreat = document.getElementById('btn-gd-threat');
  const gdFindings = document.getElementById('gd-findings');
  if (btnGdScan && gdFindings) {
    btnGdScan.addEventListener('click', () => {
      gdFindings.innerHTML = `
        <div class="gd-finding">
          <div class="gd-severity low">LOW</div>
          <div class="gd-desc">Unusual IAM user login from new IP.</div>
          <div class="gd-time">Just now</div>
        </div>
      `;
    });
  }
  if (btnGdThreat && gdFindings) {
    btnGdThreat.addEventListener('click', () => {
      gdFindings.innerHTML = `
        <div class="gd-finding">
          <div class="gd-severity high">HIGH</div>
          <div class="gd-desc">EC2 instance querying Bitcoin mining domains.</div>
          <div class="gd-time">Just now</div>
        </div>
        <div class="gd-finding">
          <div class="gd-severity medium">MEDIUM</div>
          <div class="gd-desc">S3 bucket made public unexpectedly.</div>
          <div class="gd-time">2 mins ago</div>
        </div>
      ` + gdFindings.innerHTML;
    });
  }

  // KMS Flow
  const btnKmsEncrypt = document.getElementById('btn-kms-encrypt');
  if (btnKmsEncrypt) {
    btnKmsEncrypt.addEventListener('click', () => {
      const nodes = ['kms-cmk', 'kms-a1', 'kms-dek', 'kms-a2', 'kms-data', 'kms-a3', 'kms-cipher'];
      nodes.forEach((id, i) => {
        const el = document.getElementById(id);
        if(el) { el.style.opacity = '0.5'; el.style.backgroundColor = ''; el.style.color = ''; el.style.transform = 'scale(1)'; }
      });
      nodes.forEach((id, i) => {
        setTimeout(() => {
          const el = document.getElementById(id);
          if (!el) return;
          el.style.opacity = '1';
          if (!id.includes('-a')) {
            el.style.transform = 'scale(1.05)';
            if (id === 'kms-dek' || id === 'kms-cmk') {
              el.style.backgroundColor = 'var(--accent-teal)';
              el.style.color = 'var(--bg-primary)';
            }
            if (id === 'kms-cipher') {
              el.style.backgroundColor = 'var(--accent-purple)';
              el.style.color = 'var(--bg-primary)';
            }
          }
        }, i * 500);
      });
    });
  }
  /* ──────────────────────────────────────────────────────
     16. COMBINED ARCHITECTURE PATTERNS
     ────────────────────────────────────────────────────── */
  const archTabs = document.getElementById('arch-tabs');
  const archDiagram = document.getElementById('arch-diagram');

  const ARCHITECTURES = {
    webapp: {
      title: '🌐 Serverless Web App',
      rows: [
        [{ label: '👤 Client (Browser)', cls: '' }],
        [{ label: '↓', cls: '', isArrow: true }],
        [{ label: '🌍 CloudFront (CDN)', cls: 'highlight-blue' }],
        [{ label: '↓', cls: '', isArrow: true }],
        [{ label: '🚪 API Gateway', cls: 'highlight' }, { label: '📦 S3 (Static)', cls: 'highlight-blue' }],
        [{ label: '↓', cls: '', isArrow: true }],
        [{ label: '⚡ Lambda', cls: 'highlight' }],
        [{ label: '↓', cls: '', isArrow: true }],
        [{ label: '🗄️ DynamoDB', cls: 'highlight-teal' }, { label: '🔐 Cognito (Auth)', cls: 'highlight-purple' }],
      ],
      desc: 'Fully serverless: S3 hosts the frontend, API GW + Lambda handle API requests, DynamoDB stores data, CloudFront provides CDN, Cognito manages auth.',
    },
    event: {
      title: '⚡ Event Processing Pipeline',
      rows: [
        [{ label: '📤 Producer Service', cls: '' }],
        [{ label: '↓', cls: '', isArrow: true }],
        [{ label: '📢 SNS Topic', cls: 'highlight' }],
        [{ label: '↓    ↓    ↓', cls: '', isArrow: true }],
        [{ label: '📬 SQS: Email', cls: 'highlight-blue' }, { label: '📬 SQS: Analytics', cls: 'highlight-blue' }, { label: '📬 SQS: Inventory', cls: 'highlight-blue' }],
        [{ label: '↓    ↓    ↓', cls: '', isArrow: true }],
        [{ label: '⚡ Lambda', cls: 'highlight' }, { label: '⚡ Lambda', cls: 'highlight' }, { label: '⚡ Lambda', cls: 'highlight' }],
        [{ label: '↓    ↓    ↓', cls: '', isArrow: true }],
        [{ label: '📧 SES', cls: 'highlight-teal' }, { label: '📊 Redshift', cls: 'highlight-teal' }, { label: '🗄️ DynamoDB', cls: 'highlight-teal' }],
      ],
      desc: 'SNS fans out events to multiple SQS queues. Each queue triggers an independent Lambda for parallel processing. DLQs handle failures.',
    },
    micro: {
      title: '🔄 Microservices on ECS',
      rows: [
        [{ label: '👤 Client', cls: '' }],
        [{ label: '↓', cls: '', isArrow: true }],
        [{ label: '⚖️ ALB', cls: 'highlight-blue' }],
        [{ label: '↓', cls: '', isArrow: true }],
        [{ label: '🐳 User Svc (ECS)', cls: 'highlight' }, { label: '🐳 Order Svc (ECS)', cls: 'highlight' }, { label: '🐳 Payment Svc (ECS)', cls: 'highlight' }],
        [{ label: '↓', cls: '', isArrow: true }],
        [{ label: '🗄️ RDS', cls: 'highlight-teal' }, { label: '📢 SNS/SQS', cls: 'highlight-purple' }, { label: '🔐 Secrets Mgr', cls: 'highlight-purple' }],
        [{ label: '↓', cls: '', isArrow: true }],
        [{ label: '📊 CloudWatch', cls: 'highlight-blue' }, { label: '🎯 EventBridge', cls: 'highlight-blue' }, { label: '📉 X-Ray', cls: 'highlight-blue' }],
      ],
      desc: 'ALB routes to ECS Fargate services. Services communicate via SNS/SQS (async) or direct calls (sync). CloudWatch + X-Ray for observability.',
    },
  };

  function renderArchitecture(key) {
    if (!archDiagram) return;
    const arch = ARCHITECTURES[key];
    archDiagram.innerHTML = `
      <div class="arch-flow">
        ${arch.rows.map(row => `
          <div class="arch-row">
            ${row.map(node => node.isArrow
              ? `<span class="arch-arrow">${node.label}</span>`
              : `<div class="arch-node ${node.cls}">${node.label}</div>`
            ).join('')}
          </div>
        `).join('')}
      </div>
      <div class="callout teal" style="margin-top:1.5rem">
        <strong>${arch.title}:</strong> ${arch.desc}
      </div>
    `;
  }

  if (archTabs) {
    renderArchitecture('webapp');
    archTabs.querySelectorAll('.arch-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        archTabs.querySelectorAll('.arch-tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        renderArchitecture(tab.dataset.arch);
      });
    });
  }

  /* ──────────────────────────────────────────────────────
     17. CHEAT SHEET — Searchable Reference
     ────────────────────────────────────────────────────── */
  const cheatSearch = document.getElementById('cheat-search');
  const cheatGrid = document.getElementById('cheat-grid');

  const CHEAT_DATA = [
    { service: '🌐 VPC', desc: 'Virtual Private Cloud — isolated network for your AWS resources.', limits: 'Max 5 VPCs/region (adjustable)', tags: ['security'], keywords: 'vpc network subnet cidr routing' },
    { service: '🔐 IAM', desc: 'Identity & Access Management — users, roles, policies for auth/authz.', limits: 'Max 5000 users/account, 10 groups/user', tags: ['security'], keywords: 'iam role policy user group permission' },
    { service: '📦 S3', desc: 'Object storage with 99.999999999% durability. Virtually unlimited.', limits: 'Max 5TB/object, 100 buckets/account', tags: ['storage'], keywords: 's3 bucket object storage versioning lifecycle' },
    { service: '📬 SQS', desc: 'Fully managed message queue. Decouples microservices.', limits: '256KB max message, 14 day retention', tags: ['messaging'], keywords: 'sqs queue message fifo standard dlq' },
    { service: '📢 SNS', desc: 'Pub/sub messaging for fan-out to multiple subscribers.', limits: '12.5M subs/topic, 256KB message', tags: ['messaging'], keywords: 'sns topic subscription publish fanout notification' },
    { service: '⚡ Lambda', desc: 'Serverless functions — run code without managing servers.', limits: '15min timeout, 10GB memory, 1000 concurrent', tags: ['compute'], keywords: 'lambda function serverless trigger event cold start' },
    { service: '🐳 ECS', desc: 'AWS-native container orchestration. Fargate = serverless.', limits: '5000 tasks/service, 10 containers/task', tags: ['compute'], keywords: 'ecs container task fargate docker service' },
    { service: '☸️ EKS', desc: 'Managed Kubernetes. Cloud-native, portable, rich ecosystem.', limits: '5000 nodes/cluster, 110 pods/node', tags: ['compute'], keywords: 'eks kubernetes pod cluster helm istio' },
    { service: '🔄 Step Functions', desc: 'Visual workflow orchestration with state machines.', limits: 'Standard: 1yr/execution, Express: 5min', tags: ['compute'], keywords: 'step functions workflow state machine orchestration' },
    { service: '📊 CloudWatch', desc: 'Monitoring, logging, and alerting for AWS resources.', limits: '10 alarms free tier, 5min default metrics', tags: ['monitoring'], keywords: 'cloudwatch metrics logs alarms dashboard monitoring' },
    { service: '🎯 EventBridge', desc: 'Serverless event bus for event-driven architectures.', limits: 'Up to 10K rules/bus, 5 targets/rule', tags: ['messaging'], keywords: 'eventbridge event bus rule pattern target schedule' },
    { service: '🚪 API Gateway', desc: 'Create, manage, and secure RESTful and WebSocket APIs.', limits: '10K requests/sec, 29sec timeout', tags: ['compute'], keywords: 'api gateway rest http websocket throttle cache' },
    { service: '🗄️ DynamoDB', desc: 'Serverless NoSQL database with single-digit ms latency.', limits: '400KB/item, unlimited throughput', tags: ['storage'], keywords: 'dynamodb nosql table partition key sort key gsi lsi' },
    { service: '📧 SES', desc: 'Scalable email sending and receiving service.', limits: '50K emails/day (production)', tags: ['messaging'], keywords: 'ses email sending notification' },
    { service: '🔑 KMS', desc: 'Managed encryption keys for data-at-rest and envelope encryption.', limits: '10K requests/sec per key', tags: ['security'], keywords: 'kms encryption key cmk envelope' },
    { service: '🤫 Secrets Manager', desc: 'Store and rotate secrets (DB creds, API keys) securely.', limits: '65KB max secret, auto-rotation', tags: ['security'], keywords: 'secrets manager password rotation credentials' },
    { service: '🔀 Transit Gateway', desc: 'Central hub connecting VPCs and on-premises networks.', limits: '5000 VPCs, 50 Gbps per VPC attach', tags: ['security'], keywords: 'transit gateway tgw network hub spoke peering' },
    { service: '🛡️ WAF', desc: 'Web Application Firewall protecting against common exploits.', limits: '1500 WCUs per web ACL', tags: ['security'], keywords: 'waf firewall sql xss rules bot' },
    { service: '🕵️ GuardDuty', desc: 'Intelligent threat detection using ML and log analysis.', limits: 'Continuous monitoring, no limits', tags: ['security'], keywords: 'guardduty threat detection ml anomaly security' },
  ];

  function renderCheatSheet(filter) {
    if (!cheatGrid) return;
    const f = (filter || '').toLowerCase();
    const filtered = CHEAT_DATA.filter(c =>
      !f || c.service.toLowerCase().includes(f) || c.desc.toLowerCase().includes(f) || c.keywords.includes(f)
      || c.tags.some(t => t.includes(f))
    );
    cheatGrid.innerHTML = filtered.map(c => `
      <div class="cheat-card">
        <div class="cheat-card__service">${c.service}</div>
        <div class="cheat-card__desc">${c.desc}</div>
        <div class="cheat-card__limits">${c.limits}</div>
        <div style="margin-top:.5rem">
          ${c.tags.map(t => `<span class="cheat-card__tag ${t}">${t}</span>`).join('')}
        </div>
      </div>
    `).join('');
  }
  renderCheatSheet('');
  if (cheatSearch) cheatSearch.addEventListener('input', () => renderCheatSheet(cheatSearch.value));

})();
