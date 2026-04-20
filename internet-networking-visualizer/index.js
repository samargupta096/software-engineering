/* ═══════════════════════════════════════════════════════
   INTERNET & NETWORKING VISUALIZER — Interactive Logic
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


  /* ── 1. SCROLL REVEAL ────────────────────────────── */
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('visible'); } });
  }, { threshold: 0.1 });
  document.querySelectorAll('.reveal').forEach((el) => revealObserver.observe(el));

  /* ── 2. NETWORK OF NETWORKS (Canvas) ─────────────── */
  const netCanvas = document.getElementById('network-canvas');
  if (netCanvas) {
    const ctx = netCanvas.getContext('2d');
    let W, H;
    const nodes = [
      { id: 'you', label: '💻 You', x: 0.08, y: 0.5, r: 22, color: '#00d4ff', type: 'device' },
      { id: 'router', label: '📡 Router', x: 0.18, y: 0.5, r: 18, color: '#ffb347', type: 'router' },
      { id: 'isp', label: '🏢 Your ISP', x: 0.32, y: 0.35, r: 24, color: '#9b5de5', type: 'isp' },
      { id: 'ixp', label: '🔀 IXP', x: 0.5, y: 0.5, r: 26, color: '#06d6a0', type: 'ixp' },
      { id: 'isp2', label: '🏢 Remote ISP', x: 0.68, y: 0.35, r: 24, color: '#9b5de5', type: 'isp' },
      { id: 'backbone', label: '🌐 Backbone', x: 0.5, y: 0.2, r: 22, color: '#ef476f', type: 'backbone' },
      { id: 'backbone2', label: '🌐 Backbone 2', x: 0.5, y: 0.8, r: 22, color: '#ef476f', type: 'backbone' },
      { id: 'dns', label: '📋 DNS Server', x: 0.32, y: 0.75, r: 18, color: '#4cc9f0', type: 'dns' },
      { id: 'cdn', label: '⚡ CDN Edge', x: 0.68, y: 0.7, r: 18, color: '#ffd166', type: 'cdn' },
      { id: 'server', label: '🖥️ Web Server', x: 0.92, y: 0.5, r: 22, color: '#06d6a0', type: 'server' },
    ];
    const edges = [
      ['you','router'],['router','isp'],['isp','ixp'],['ixp','isp2'],['isp2','server'],
      ['isp','backbone'],['backbone','isp2'],['ixp','backbone'],['ixp','backbone2'],
      ['backbone2','isp'],['backbone','backbone2'],['isp','dns'],['isp2','cdn'],['cdn','server'],
    ];
    let activePathIdx = -1;
    const paths = [
      ['you','router','isp','ixp','isp2','server'],
      ['you','router','isp','backbone','isp2','server'],
      ['you','router','isp','dns'],
      ['you','router','isp','ixp','isp2','cdn','server'],
    ];

    function resizeCanvas() {
      const rect = netCanvas.parentElement.getBoundingClientRect();
      W = netCanvas.width = rect.width;
      H = netCanvas.height = Math.max(450, rect.width * 0.45);
      drawNetwork();
    }

    function getNodePos(n) { return { x: n.x * W, y: n.y * H }; }

    function drawNetwork() {
      ctx.clearRect(0, 0, W, H);
      // edges
      edges.forEach(([a, b]) => {
        const na = nodes.find(n => n.id === a), nb = nodes.find(n => n.id === b);
        const pa = getNodePos(na), pb = getNodePos(nb);
        ctx.beginPath(); ctx.moveTo(pa.x, pa.y); ctx.lineTo(pb.x, pb.y);
        ctx.strokeStyle = 'rgba(255,255,255,0.06)'; ctx.lineWidth = 1.5; ctx.stroke();
      });
      // active path
      if (activePathIdx >= 0) {
        const path = paths[activePathIdx];
        for (let i = 0; i < path.length - 1; i++) {
          const na = nodes.find(n => n.id === path[i]), nb = nodes.find(n => n.id === path[i+1]);
          const pa = getNodePos(na), pb = getNodePos(nb);
          ctx.beginPath(); ctx.moveTo(pa.x, pa.y); ctx.lineTo(pb.x, pb.y);
          const grad = ctx.createLinearGradient(pa.x, pa.y, pb.x, pb.y);
          grad.addColorStop(0, '#00d4ff'); grad.addColorStop(1, '#06d6a0');
          ctx.strokeStyle = grad; ctx.lineWidth = 3; ctx.stroke();
          ctx.shadowColor = '#00d4ff'; ctx.shadowBlur = 10; ctx.stroke(); ctx.shadowBlur = 0;
        }
      }
      // nodes
      nodes.forEach(n => {
        const p = getNodePos(n);
        const isActive = activePathIdx >= 0 && paths[activePathIdx].includes(n.id);
        ctx.beginPath(); ctx.arc(p.x, p.y, n.r, 0, Math.PI * 2);
        ctx.fillStyle = isActive ? n.color : 'rgba(17,24,39,0.9)';
        ctx.fill();
        ctx.strokeStyle = isActive ? n.color : 'rgba(255,255,255,0.15)';
        ctx.lineWidth = isActive ? 2.5 : 1.5; ctx.stroke();
        if (isActive) { ctx.shadowColor = n.color; ctx.shadowBlur = 20; ctx.stroke(); ctx.shadowBlur = 0; }
        ctx.fillStyle = isActive ? '#fff' : '#94a3b8';
        ctx.font = '600 11px Inter, sans-serif'; ctx.textAlign = 'center';
        ctx.fillText(n.label, p.x, p.y + n.r + 16);
      });
    }

    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();

    let pathCycle = 0;
    document.getElementById('btn-trace-path')?.addEventListener('click', () => {
      activePathIdx = pathCycle % paths.length; pathCycle++; drawNetwork();
    });
    document.getElementById('btn-reset-network')?.addEventListener('click', () => {
      activePathIdx = -1; drawNetwork();
    });
  }

  /* ── 3. DNS RESOLUTION ───────────────────────────── */
  const btnDns = document.getElementById('btn-dns-lookup');
  const dnsResult = document.getElementById('dns-result');
  if (btnDns) {
    btnDns.addEventListener('click', () => {
      const domain = document.getElementById('dns-domain')?.value || 'www.example.com';
      const allNodes = document.querySelectorAll('.dns-node');
      const allArrows = document.querySelectorAll('.dns-arrow');
      allNodes.forEach(n => n.classList.remove('active'));
      allArrows.forEach(a => a.classList.remove('active'));
      dnsResult.innerHTML = '';
      dnsResult.style.background = 'transparent';

      const steps = [0, 1, 2, 3, 4];
      const msgs = [
        `Browser checks local cache for ${domain}...`,
        `Cache miss → Querying recursive resolver (ISP DNS)...`,
        `Resolver queries Root Server (.) → Referral to .${domain.split('.').pop()} TLD...`,
        `Querying TLD server → Referral to authoritative NS...`,
        `Authoritative NS returns A record: ${domain} → 93.184.216.34 ✅`,
      ];

      steps.forEach((step, i) => {
        setTimeout(() => {
          allNodes[step]?.classList.add('active');
          if (i > 0) allArrows[i - 1]?.classList.add('active');
          dnsResult.innerHTML = `<span style="color:var(--accent-cyan);">[${(i * 25 + 5)}ms]</span> ${msgs[i]}`;
          dnsResult.style.background = 'rgba(0,212,255,0.06)';
          if (i === steps.length - 1) {
            setTimeout(() => {
              dnsResult.innerHTML += `<br><span style="color:var(--accent-green);font-weight:700;">✅ DNS resolved: ${domain} → 93.184.216.34 (TTL: 3600s)</span>`;
              dnsResult.style.background = 'rgba(6,214,160,0.08)';
            }, 400);
          }
        }, i * 700);
      });
    });
  }

  // DNS Record cards interactivity
  document.querySelectorAll('.record-card').forEach(card => {
    card.addEventListener('click', () => {
      document.querySelectorAll('.record-card').forEach(c => c.classList.remove('active'));
      card.classList.add('active');
    });
  });

  /* ── 4. TCP/IP & OSI MODEL ───────────────────────── */
  const modelToggle = document.getElementById('model-toggle');
  const layerStack = document.getElementById('layer-stack');
  const btnEncapsulate = document.getElementById('btn-encapsulate');

  const TCP_IP_LAYERS = [
    { num: '4', name: 'Application', protocols: 'HTTP, DNS, FTP, SMTP', header: '+ HTTP Headers', cls: 'l7' },
    { num: '3', name: 'Transport', protocols: 'TCP / UDP', header: '+ TCP/UDP Header', cls: 'l4' },
    { num: '2', name: 'Internet', protocols: 'IP, ICMP, ARP', header: '+ IP Header', cls: 'l3' },
    { num: '1', name: 'Network Access', protocols: 'Ethernet, Wi-Fi', header: '+ Frame Header/Trailer', cls: 'l1' },
  ];
  const OSI_LAYERS = [
    { num: '7', name: 'Application', protocols: 'HTTP, DNS, FTP', header: '+ App Data', cls: 'l7' },
    { num: '6', name: 'Presentation', protocols: 'SSL/TLS, JPEG, ASCII', header: '+ Encoding', cls: 'l6' },
    { num: '5', name: 'Session', protocols: 'NetBIOS, RPC', header: '+ Session ID', cls: 'l5' },
    { num: '4', name: 'Transport', protocols: 'TCP, UDP', header: '+ TCP Header', cls: 'l4' },
    { num: '3', name: 'Network', protocols: 'IP, ICMP, OSPF', header: '+ IP Header', cls: 'l3' },
    { num: '2', name: 'Data Link', protocols: 'Ethernet, PPP, MAC', header: '+ Frame Header', cls: 'l2' },
    { num: '1', name: 'Physical', protocols: 'Cables, Radio, Fiber', header: '→ Bits on wire', cls: 'l1' },
  ];

  let currentModel = 'tcpip';

  function renderLayers(layers, animate = false) {
    if (!layerStack) return;
    layerStack.innerHTML = layers.map((l, i) =>
      `<div class="layer-item ${l.cls}${!animate ? ' active' : ''}" style="${animate ? `transition-delay:${i * 150}ms` : ''}">
        <span class="layer-item__num">L${l.num}</span>
        <span class="layer-item__name">${l.name}</span>
        <span class="layer-item__protocol">${l.protocols}</span>
        <span class="layer-item__header">${l.header}</span>
      </div>`
    ).join('');
    if (animate) {
      setTimeout(() => {
        layerStack.querySelectorAll('.layer-item').forEach((el, i) => {
          setTimeout(() => el.classList.add('active'), i * 200);
        });
      }, 50);
    }
  }

  if (modelToggle) {
    renderLayers(TCP_IP_LAYERS);
    modelToggle.querySelectorAll('.strategy-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        modelToggle.querySelectorAll('.strategy-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentModel = btn.dataset.model;
        renderLayers(currentModel === 'tcpip' ? TCP_IP_LAYERS : OSI_LAYERS);
      });
    });
  }

  btnEncapsulate?.addEventListener('click', () => {
    renderLayers(currentModel === 'tcpip' ? TCP_IP_LAYERS : OSI_LAYERS, true);
  });

  /* ── 5. TCP HANDSHAKE ────────────────────────────── */
  const btnHandshake = document.getElementById('btn-handshake');
  const btnTeardown = document.getElementById('btn-teardown');
  const hsTimeline = document.getElementById('hs-timeline');
  const hsLog = document.getElementById('hs-log');
  const hsClientState = document.getElementById('hs-client-state');
  const hsServerState = document.getElementById('hs-server-state');

  function clearHandshake() {
    if (hsTimeline) hsTimeline.innerHTML = '';
    if (hsLog) hsLog.innerHTML = '';
    if (hsClientState) hsClientState.textContent = 'CLOSED';
    if (hsServerState) hsServerState.textContent = 'LISTEN';
  }

  function addHsArrow(cls, dir, label, delay) {
    return new Promise(resolve => {
      setTimeout(() => {
        const arrow = document.createElement('div');
        arrow.className = `hs-arrow ${cls} ${dir}`;
        arrow.innerHTML = `<div class="hs-arrow__line"></div><div class="hs-arrow__label">${label}</div>`;
        hsTimeline.appendChild(arrow);
        requestAnimationFrame(() => arrow.classList.add('visible'));
        if (hsLog) hsLog.innerHTML += `<div>[${new Date().toLocaleTimeString()}] ${label}</div>`;
        resolve();
      }, delay);
    });
  }

  btnHandshake?.addEventListener('click', async () => {
    clearHandshake();
    await addHsArrow('syn', 'to-server', 'SYN  seq=100', 300);
    hsClientState.textContent = 'SYN_SENT';
    await addHsArrow('syn-ack', 'to-client', 'SYN-ACK  seq=300, ack=101', 800);
    hsServerState.textContent = 'SYN_RCVD';
    await addHsArrow('ack', 'to-server', 'ACK  seq=101, ack=301', 800);
    hsClientState.textContent = 'ESTABLISHED';
    hsServerState.textContent = 'ESTABLISHED';
    if (hsLog) hsLog.innerHTML += `<div style="color:var(--accent-green);">✅ Connection ESTABLISHED — data can flow</div>`;
  });

  btnTeardown?.addEventListener('click', async () => {
    clearHandshake();
    hsClientState.textContent = 'ESTABLISHED';
    hsServerState.textContent = 'ESTABLISHED';
    await addHsArrow('fin', 'to-server', 'FIN  seq=500', 300);
    hsClientState.textContent = 'FIN_WAIT_1';
    await addHsArrow('ack', 'to-client', 'ACK  ack=501', 800);
    hsServerState.textContent = 'CLOSE_WAIT';
    hsClientState.textContent = 'FIN_WAIT_2';
    await addHsArrow('fin', 'to-client', 'FIN  seq=600', 800);
    hsServerState.textContent = 'LAST_ACK';
    await addHsArrow('ack', 'to-server', 'ACK  ack=601', 800);
    hsClientState.textContent = 'TIME_WAIT';
    hsServerState.textContent = 'CLOSED';
    if (hsLog) hsLog.innerHTML += `<div style="color:var(--accent-red);">🔌 Connection CLOSED (4-way teardown)</div>`;
    setTimeout(() => { hsClientState.textContent = 'CLOSED'; }, 1500);
  });

  /* ── 6. HTTP REQUEST/RESPONSE ────────────────────── */
  const httpMethodToggle = document.getElementById('http-method-toggle');
  const btnSendReq = document.getElementById('btn-send-request');
  const httpReqCode = document.getElementById('http-request-code');
  const httpResCode = document.getElementById('http-response-code');
  const httpPacket = document.getElementById('http-packet');

  const HTTP_EXAMPLES = {
    GET: {
      req: `GET /api/users HTTP/1.1\nHost: api.example.com\nAccept: application/json\nAuthorization: Bearer eyJhbGciOi...\nUser-Agent: Mozilla/5.0\nConnection: keep-alive`,
      res: `HTTP/1.1 200 OK\nContent-Type: application/json\nCache-Control: max-age=3600\n\n{\n  "users": [\n    { "id": 1, "name": "Alice" },\n    { "id": 2, "name": "Bob" }\n  ]\n}`,
      status: '200 OK'
    },
    POST: {
      req: `POST /api/users HTTP/1.1\nHost: api.example.com\nContent-Type: application/json\nAuthorization: Bearer eyJhbGciOi...\n\n{\n  "name": "Charlie",\n  "email": "charlie@example.com"\n}`,
      res: `HTTP/1.1 201 Created\nContent-Type: application/json\nLocation: /api/users/3\n\n{\n  "id": 3,\n  "name": "Charlie",\n  "created": true\n}`,
      status: '201 Created'
    },
    PUT: {
      req: `PUT /api/users/1 HTTP/1.1\nHost: api.example.com\nContent-Type: application/json\n\n{\n  "name": "Alice Updated",\n  "email": "alice.new@example.com"\n}`,
      res: `HTTP/1.1 200 OK\nContent-Type: application/json\n\n{\n  "id": 1,\n  "name": "Alice Updated",\n  "updated": true\n}`,
      status: '200 OK'
    },
    DELETE: {
      req: `DELETE /api/users/2 HTTP/1.1\nHost: api.example.com\nAuthorization: Bearer eyJhbGciOi...`,
      res: `HTTP/1.1 204 No Content`,
      status: '204 No Content'
    },
  };

  let currentMethod = 'GET';

  if (httpMethodToggle) {
    httpMethodToggle.querySelectorAll('.strategy-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        httpMethodToggle.querySelectorAll('.strategy-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentMethod = btn.dataset.method;
        const ex = HTTP_EXAMPLES[currentMethod];
        if (httpReqCode) httpReqCode.textContent = ex.req;
        if (httpResCode) httpResCode.textContent = ex.res;
      });
    });
  }

  btnSendReq?.addEventListener('click', () => {
    if (!httpPacket) return;
    httpPacket.style.opacity = '1';
    httpPacket.style.left = '0';
    httpPacket.style.transition = 'left 0.8s ease-in-out';
    requestAnimationFrame(() => { httpPacket.style.left = 'calc(100% - 20px)'; });
    setTimeout(() => {
      httpPacket.style.background = 'var(--accent-green)';
      httpPacket.style.boxShadow = '0 0 15px var(--accent-green-glow)';
      httpPacket.style.transition = 'left 0.8s ease-in-out';
      httpPacket.style.left = '0';
    }, 1000);
    setTimeout(() => {
      httpPacket.style.opacity = '0';
      httpPacket.style.background = 'var(--accent-cyan)';
      httpPacket.style.boxShadow = '0 0 15px var(--accent-cyan-glow)';
    }, 2000);
  });

  /* ── 7. TLS/SSL HANDSHAKE ────────────────────────── */
  const tlsToggle = document.getElementById('tls-toggle');
  const btnTls = document.getElementById('btn-tls-handshake');
  const tlsSteps = document.getElementById('tls-steps');
  let tlsMode = 'https';

  const TLS_STEPS = [
    { cls: 'client-hello', icon: '📤', label: 'ClientHello: supported ciphers, random bytes, SNI' },
    { cls: 'server-hello', icon: '📥', label: 'ServerHello: chosen cipher, random bytes' },
    { cls: 'certificate', icon: '📜', label: 'Certificate: server sends X.509 cert chain' },
    { cls: 'key-exchange', icon: '🔑', label: 'Key Exchange: ECDHE params → shared secret' },
    { cls: 'encrypted', icon: '🔒', label: '✅ Encrypted channel established (AES-256-GCM)' },
  ];

  if (tlsToggle) {
    tlsToggle.querySelectorAll('.strategy-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        tlsToggle.querySelectorAll('.strategy-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        tlsMode = btn.dataset.mode;
      });
    });
  }

  btnTls?.addEventListener('click', () => {
    if (!tlsSteps) return;
    if (tlsMode === 'http') {
      tlsSteps.innerHTML = `<div class="tls-step client-hello visible" style="opacity:1;transform:translateY(0);">
        <span class="tls-step__icon">⚠️</span>
        <span class="tls-step__label">HTTP: No TLS handshake! Data sent in plaintext...</span>
      </div>`;
      return;
    }
    tlsSteps.innerHTML = TLS_STEPS.map(s =>
      `<div class="tls-step ${s.cls}"><span class="tls-step__icon">${s.icon}</span><span class="tls-step__label">${s.label}</span></div>`
    ).join('');
    const stepEls = tlsSteps.querySelectorAll('.tls-step');
    stepEls.forEach((el, i) => {
      setTimeout(() => el.classList.add('visible'), i * 600);
    });
  });

  /* ── 8. ROUTING & TRACEROUTE ─────────────────────── */
  const routeViz = document.getElementById('route-viz');
  const routeLog = document.getElementById('route-log');
  const sliderTtl = document.getElementById('slider-ttl');
  const valTtl = document.getElementById('val-ttl');
  const btnTrace = document.getElementById('btn-trace-route');

  const ROUTE_HOPS = [
    { icon: '💻', label: 'You', ip: '192.168.1.10' },
    { icon: '📡', label: 'Gateway', ip: '192.168.1.1' },
    { icon: '🏢', label: 'ISP Node 1', ip: '10.0.0.1' },
    { icon: '🔀', label: 'IXP', ip: '198.32.132.1' },
    { icon: '🌐', label: 'Backbone', ip: '4.69.148.1' },
    { icon: '🌐', label: 'Backbone 2', ip: '4.69.149.21' },
    { icon: '🏢', label: 'Remote ISP', ip: '72.14.216.1' },
    { icon: '⚡', label: 'CDN Edge', ip: '142.250.66.1' },
    { icon: '🖥️', label: 'Server', ip: '142.250.190.14' },
  ];

  function renderRoute(ttl) {
    if (!routeViz) return;
    routeViz.innerHTML = ROUTE_HOPS.map((h, i) => {
      const link = i < ROUTE_HOPS.length - 1 ? '<div class="route-link"></div>' : '';
      return `<div class="route-hop" data-idx="${i}">
        <div class="route-hop__icon">${h.icon}</div>
        <div class="route-hop__label">${h.label}</div>
        <div class="route-hop__ttl">TTL: ${Math.max(0, ttl - i)}</div>
      </div>${link}`;
    }).join('');
  }

  if (sliderTtl) {
    renderRoute(parseInt(sliderTtl.value));
    sliderTtl.addEventListener('input', () => {
      valTtl.textContent = sliderTtl.value;
      renderRoute(parseInt(sliderTtl.value));
    });
  }

  btnTrace?.addEventListener('click', () => {
    const ttl = parseInt(sliderTtl?.value || 6);
    if (routeLog) routeLog.innerHTML = '';
    const hops = routeViz?.querySelectorAll('.route-hop') || [];
    const links = routeViz?.querySelectorAll('.route-link') || [];

    hops.forEach((hop, i) => {
      setTimeout(() => {
        if (i < ttl) {
          hop.classList.add('active');
          if (links[i]) links[i].classList.add('active');
          const h = ROUTE_HOPS[i];
          const latency = i === 0 ? '<1' : (i * 8 + Math.floor(Math.random() * 10));
          if (routeLog) routeLog.innerHTML += `<div>Hop ${i + 1}: ${h.ip} (${h.label}) — ${latency}ms  TTL=${ttl - i}</div>`;
        } else {
          hop.classList.add('expired');
          if (routeLog) routeLog.innerHTML += `<div style="color:var(--accent-red);">Hop ${i + 1}: *** TTL expired — ICMP Time Exceeded sent back</div>`;
        }
        if (i === Math.min(ttl, ROUTE_HOPS.length) - 1 && i < ttl) {
          if (routeLog) routeLog.innerHTML += `<div style="color:var(--accent-green);">✅ Destination reached: ${ROUTE_HOPS[i].ip}</div>`;
        }
      }, i * 400);
    });
  });

  /* ── 9. FIREWALL ─────────────────────────────────── */
  const btnSendPackets = document.getElementById('btn-send-packets');
  const fwPackets = document.getElementById('fw-packets');
  const fwPassed = document.getElementById('fw-passed');
  const fwBlocked = document.getElementById('fw-blocked');

  const SAMPLE_PACKETS = [
    { port: 443, proto: 'HTTPS', src: '203.0.113.5', allowed: true },
    { port: 80, proto: 'HTTP', src: '198.51.100.2', allowed: true },
    { port: 22, proto: 'SSH', src: '192.168.1.50', allowed: false },
    { port: 53, proto: 'DNS', src: '8.8.8.8', allowed: true },
    { port: 23, proto: 'Telnet', src: '10.0.0.5', allowed: false },
    { port: 443, proto: 'HTTPS', src: '172.16.0.3', allowed: true },
    { port: 3389, proto: 'RDP', src: '192.168.1.100', allowed: false },
  ];

  function renderFwPackets() {
    if (!fwPackets) return;
    fwPackets.innerHTML = SAMPLE_PACKETS.map((p, i) =>
      `<div class="fw-packet" data-idx="${i}">📦 ${p.src}:${p.port} (${p.proto})</div>`
    ).join('');
  }

  renderFwPackets();

  btnSendPackets?.addEventListener('click', () => {
    if (fwPassed) fwPassed.innerHTML = '';
    if (fwBlocked) fwBlocked.innerHTML = '';
    renderFwPackets();
    const packetEls = fwPackets?.querySelectorAll('.fw-packet') || [];
    packetEls.forEach((el, i) => {
      setTimeout(() => {
        const p = SAMPLE_PACKETS[i];
        el.classList.add(p.allowed ? 'allowed' : 'blocked');
        const clone = document.createElement('div');
        clone.className = `fw-packet animating ${p.allowed ? 'allowed' : 'blocked'}`;
        clone.textContent = `${p.allowed ? '✅' : '❌'} :${p.port} (${p.proto})`;
        if (p.allowed && fwPassed) fwPassed.appendChild(clone);
        if (!p.allowed && fwBlocked) fwBlocked.appendChild(clone);
      }, i * 350);
    });
  });

  document.getElementById('btn-reset-firewall')?.addEventListener('click', () => {
    if (fwPassed) fwPassed.innerHTML = '';
    if (fwBlocked) fwBlocked.innerHTML = '';
    renderFwPackets();
  });

  /* ── 10. CDN CACHING ─────────────────────────────── */
  const cdnLocToggle = document.getElementById('cdn-location-toggle');
  const btnCdn = document.getElementById('btn-cdn-request');
  const cdnPath = document.getElementById('cdn-path');
  const cdnOriginPath = document.getElementById('cdn-origin-path');
  const cdnCacheStatus = document.getElementById('cdn-cache-status');
  const cdnMetrics = document.getElementById('cdn-metrics');

  let cdnLocation = 'nearby';
  let cdnHitCount = 0;
  let cdnMissCount = 0;

  if (cdnLocToggle) {
    cdnLocToggle.querySelectorAll('.strategy-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        cdnLocToggle.querySelectorAll('.strategy-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        cdnLocation = btn.dataset.location;
      });
    });
  }

  function updateCdnMetrics(latency, hit) {
    if (!cdnMetrics) return;
    cdnMetrics.innerHTML = `
      <div class="cdn-metric"><div class="cdn-metric__value">${latency}ms</div><div class="cdn-metric__label">Latency</div></div>
      <div class="cdn-metric"><div class="cdn-metric__value">${hit ? 'HIT' : 'MISS'}</div><div class="cdn-metric__label">Cache Status</div></div>
      <div class="cdn-metric"><div class="cdn-metric__value">${cdnHitCount}</div><div class="cdn-metric__label">Cache Hits</div></div>
      <div class="cdn-metric"><div class="cdn-metric__value">${cdnMissCount}</div><div class="cdn-metric__label">Cache Misses</div></div>`;
  }

  btnCdn?.addEventListener('click', () => {
    const isNearby = cdnLocation === 'nearby';
    const isHit = isNearby && Math.random() > 0.3;
    const latency = isHit ? Math.floor(15 + Math.random() * 15) : (isNearby ? Math.floor(80 + Math.random() * 60) : Math.floor(250 + Math.random() * 150));

    if (isHit) cdnHitCount++; else cdnMissCount++;

    cdnPath?.classList.add('active');
    if (cdnCacheStatus) {
      cdnCacheStatus.textContent = isHit ? 'CACHE HIT ⚡' : 'CACHE MISS';
      cdnCacheStatus.style.background = isHit ? 'rgba(6,214,160,0.15)' : 'rgba(239,71,111,0.15)';
      cdnCacheStatus.style.color = isHit ? 'var(--accent-green)' : 'var(--accent-red)';
    }

    if (!isHit) {
      setTimeout(() => cdnOriginPath?.classList.add('active'), 300);
    }

    setTimeout(() => {
      updateCdnMetrics(latency, isHit);
      cdnPath?.classList.remove('active');
      cdnOriginPath?.classList.remove('active');
    }, 1200);
  });

  /* ── 11. WEBSOCKETS ──────────────────────────────── */
  const wsModeToggle = document.getElementById('ws-mode-toggle');
  const btnWsDemo = document.getElementById('btn-ws-demo');
  const btnWsStop = document.getElementById('btn-ws-stop');
  const wsMessages = document.getElementById('ws-messages');
  const wsChannelLabel = document.getElementById('ws-channel-label');
  const wsStats = document.getElementById('ws-stats');

  let wsMode = 'websocket';
  let wsInterval = null;
  let wsMsgCount = 0;
  let wsOverhead = 0;

  if (wsModeToggle) {
    wsModeToggle.querySelectorAll('.strategy-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        wsModeToggle.querySelectorAll('.strategy-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        wsMode = btn.dataset.mode;
        if (wsChannelLabel) wsChannelLabel.textContent = wsMode === 'websocket' ? 'WebSocket Connection' : 'HTTP Polling';
      });
    });
  }

  function addWsMsg(from, text, cls = '') {
    if (!wsMessages) return;
    const msg = document.createElement('div');
    msg.className = `ws-msg ${from} ${cls}`;
    msg.textContent = text;
    wsMessages.appendChild(msg);
    wsMessages.scrollTop = wsMessages.scrollHeight;
    wsMsgCount++;
  }

  function updateWsStats() {
    if (!wsStats) return;
    const overheadPerMsg = wsMode === 'websocket' ? 6 : 800;
    wsOverhead = wsMsgCount * overheadPerMsg;
    wsStats.innerHTML = `
      <div class="ws-stat"><div class="ws-stat__value">${wsMsgCount}</div><div class="ws-stat__label">Messages</div></div>
      <div class="ws-stat"><div class="ws-stat__value">${wsMode === 'websocket' ? '6B' : '~800B'}</div><div class="ws-stat__label">Overhead/msg</div></div>
      <div class="ws-stat"><div class="ws-stat__value">${(wsOverhead / 1024).toFixed(1)}KB</div><div class="ws-stat__label">Total Overhead</div></div>
      <div class="ws-stat"><div class="ws-stat__value">${wsMode === 'websocket' ? 'Full-duplex' : 'Half-duplex'}</div><div class="ws-stat__label">Mode</div></div>`;
  }

  const WS_MESSAGES = [
    { from: 'from-client', text: '→ Subscribe: stock-AAPL' },
    { from: 'from-server', text: '← AAPL: $185.42 (+0.8%)' },
    { from: 'from-server', text: '← AAPL: $185.55 (+0.9%)' },
    { from: 'from-client', text: '→ Subscribe: stock-GOOGL' },
    { from: 'from-server', text: '← GOOGL: $141.80 (+0.3%)' },
    { from: 'from-server', text: '← AAPL: $185.61 (+0.9%)' },
    { from: 'from-server', text: '← AAPL: $185.70 (+1.0%)' },
    { from: 'from-server', text: '← GOOGL: $141.95 (+0.4%)' },
  ];

  const POLL_MESSAGES = [
    { from: 'from-client', text: '→ GET /api/stocks (poll #1)', cls: 'polling' },
    { from: 'from-server', text: '← 200: AAPL $185.42' },
    { from: 'from-client', text: '→ GET /api/stocks (poll #2)', cls: 'polling' },
    { from: 'from-server', text: '← 304: No changes' },
    { from: 'from-client', text: '→ GET /api/stocks (poll #3)', cls: 'polling' },
    { from: 'from-server', text: '← 200: AAPL $185.55' },
    { from: 'from-client', text: '→ GET /api/stocks (poll #4)', cls: 'polling' },
    { from: 'from-server', text: '← 304: No changes' },
  ];

  btnWsDemo?.addEventListener('click', () => {
    if (wsInterval) clearInterval(wsInterval);
    if (wsMessages) wsMessages.innerHTML = '';
    wsMsgCount = 0;
    const msgs = wsMode === 'websocket' ? WS_MESSAGES : POLL_MESSAGES;
    let idx = 0;
    wsInterval = setInterval(() => {
      if (idx >= msgs.length) { clearInterval(wsInterval); wsInterval = null; return; }
      addWsMsg(msgs[idx].from, msgs[idx].text, msgs[idx].cls || '');
      updateWsStats();
      idx++;
    }, 600);
  });

  btnWsStop?.addEventListener('click', () => {
    if (wsInterval) { clearInterval(wsInterval); wsInterval = null; }
  });

  /* ── HERO PARTICLES ──────────────────────────────── */
  const particleContainer = document.getElementById('hero-particles');
  if (particleContainer) {
    for (let i = 0; i < 30; i++) {
      const p = document.createElement('div');
      p.style.cssText = `position:absolute;width:${2 + Math.random() * 3}px;height:${2 + Math.random() * 3}px;background:rgba(0,212,255,${0.1 + Math.random() * 0.3});border-radius:50%;left:${Math.random() * 100}%;top:${Math.random() * 100}%;animation:particleFloat ${5 + Math.random() * 10}s ease-in-out infinite alternate;animation-delay:${-Math.random() * 10}s;`;
      particleContainer.appendChild(p);
    }
    const style = document.createElement('style');
    style.textContent = `@keyframes particleFloat{0%{transform:translate(0,0);opacity:.3}50%{opacity:.7}100%{transform:translate(${Math.random()>0.5?'':'-'}${20+Math.random()*40}px,${Math.random()>0.5?'':'-'}${20+Math.random()*40}px);opacity:.3}}`;
    document.head.appendChild(style);
  }

})();
