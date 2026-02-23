document.addEventListener('DOMContentLoaded', () => {
  /* ── Intersection Observer for reveal ───────── */
  const io = new IntersectionObserver(entries => {
    entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible'); });
  }, { threshold: 0.08 });
  document.querySelectorAll('.reveal').forEach(s => io.observe(s));

  /* ══════════════════════════════════════════════
     1. SINGLETON
     ══════════════════════════════════════════════ */
  const singletonDemo = document.getElementById('singleton-demo');
  const singletonResult = document.getElementById('singleton-result');
  let singletonInstance = null;
  let singletonCallCount = 0;
  const SINGLETON_HASH = '0x7a3f' + ((Math.random() * 0xffff) | 0).toString(16).slice(0, 4);

  function renderSingleton() {
    if (!singletonDemo) return;
    singletonDemo.innerHTML = '';
    const row = document.createElement('div');
    row.className = 'instance-row';

    if (singletonCallCount === 0) {
      const placeholder = document.createElement('div');
      placeholder.className = 'instance-card neutral';
      placeholder.textContent = 'No instances yet — click getInstance()';
      row.appendChild(placeholder);
    } else {
      for (let i = 0; i < singletonCallCount; i++) {
        const card = document.createElement('div');
        card.className = 'instance-card same';
        card.innerHTML = `<div style="font-size:0.55rem;color:var(--text-muted)">Call #${i + 1}</div>Singleton@${SINGLETON_HASH}`;
        row.appendChild(card);
      }
    }
    singletonDemo.appendChild(row);
  }

  document.getElementById('btn-singleton-get')?.addEventListener('click', () => {
    singletonCallCount = 1;
    singletonInstance = SINGLETON_HASH;
    renderSingleton();
    if (singletonResult) singletonResult.innerHTML = `<span style="color:var(--accent-green)">✅ Created Singleton@${SINGLETON_HASH}. Instance stored.</span>`;
  });

  document.getElementById('btn-singleton-get2')?.addEventListener('click', () => {
    if (singletonCallCount === 0) {
      singletonCallCount = 1;
    }
    singletonCallCount++;
    renderSingleton();
    if (singletonResult) singletonResult.innerHTML = `<span style="color:var(--accent-green)">✅ All ${singletonCallCount} calls return the SAME object: Singleton@${SINGLETON_HASH} — identity verified!</span>`;
  });

  document.getElementById('btn-singleton-reset')?.addEventListener('click', () => {
    singletonCallCount = 0;
    singletonInstance = null;
    renderSingleton();
    if (singletonResult) singletonResult.textContent = '';
  });

  renderSingleton();

  // Singleton code variants
  const SINGLETON_CODES = {
    eager: {
      title: 'Eager Initialization',
      pros: '✅ Thread-safe (JVM class loading guarantees)',
      cons: '⚠ Instance created even if never used',
      code: `<span class="kw">public class</span> <span class="type">Singleton</span> {
  <span class="cmt">// Created at class loading time</span>
  <span class="kw">private static final</span> <span class="type">Singleton</span> INSTANCE = <span class="kw">new</span> <span class="type">Singleton</span>();

  <span class="kw">private</span> <span class="fn">Singleton</span>() {}  <span class="cmt">// private constructor</span>

  <span class="kw">public static</span> <span class="type">Singleton</span> <span class="fn">getInstance</span>() {
    <span class="kw">return</span> INSTANCE;
  }
}`
    },
    lazy: {
      title: 'Lazy Initialization (NOT Thread-Safe! ❌)',
      pros: '✅ Lazy — only created when needed',
      cons: '❌ BROKEN in multi-threaded environments — race condition!',
      code: `<span class="kw">public class</span> <span class="type">Singleton</span> {
  <span class="kw">private static</span> <span class="type">Singleton</span> instance;  <span class="cmt">// null initially</span>

  <span class="kw">private</span> <span class="fn">Singleton</span>() {}

  <span class="kw">public static</span> <span class="type">Singleton</span> <span class="fn">getInstance</span>() {
    <span class="kw">if</span> (instance == <span class="kw">null</span>) {       <span class="cmt">// ❌ Thread A & B both see null</span>
      instance = <span class="kw">new</span> <span class="type">Singleton</span>(); <span class="cmt">// ❌ Two instances created!</span>
    }
    <span class="kw">return</span> instance;
  }
}`
    },
    dcl: {
      title: 'Double-Checked Locking',
      pros: '✅ Thread-safe + Lazy + Minimal locking',
      cons: '⚠ Needs volatile (Java 5+) to prevent instruction reordering',
      code: `<span class="kw">public class</span> <span class="type">Singleton</span> {
  <span class="kw">private static volatile</span> <span class="type">Singleton</span> instance; <span class="cmt">// volatile is KEY!</span>

  <span class="kw">private</span> <span class="fn">Singleton</span>() {}

  <span class="kw">public static</span> <span class="type">Singleton</span> <span class="fn">getInstance</span>() {
    <span class="kw">if</span> (instance == <span class="kw">null</span>) {             <span class="cmt">// 1st check (no lock)</span>
      <span class="kw">synchronized</span> (<span class="type">Singleton</span>.<span class="kw">class</span>) {
        <span class="kw">if</span> (instance == <span class="kw">null</span>) {         <span class="cmt">// 2nd check (in lock)</span>
          instance = <span class="kw">new</span> <span class="type">Singleton</span>();
        }
      }
    }
    <span class="kw">return</span> instance;
  }
}`
    },
    holder: {
      title: 'Bill Pugh Holder (Recommended ⭐)',
      pros: '✅ Thread-safe + Lazy + No synchronization overhead',
      cons: 'None — the best classic approach',
      code: `<span class="kw">public class</span> <span class="type">Singleton</span> {
  <span class="kw">private</span> <span class="fn">Singleton</span>() {}

  <span class="cmt">// Inner class is NOT loaded until getInstance() is called</span>
  <span class="kw">private static class</span> <span class="type">Holder</span> {
    <span class="kw">static final</span> <span class="type">Singleton</span> INSTANCE = <span class="kw">new</span> <span class="type">Singleton</span>();
  }

  <span class="kw">public static</span> <span class="type">Singleton</span> <span class="fn">getInstance</span>() {
    <span class="kw">return</span> <span class="type">Holder</span>.INSTANCE;  <span class="cmt">// JVM guarantees thread-safety</span>
  }
}`
    },
    enum: {
      title: 'Enum Singleton (Joshua Bloch\'s Pick ⭐)',
      pros: '✅ Thread-safe + Serialization-safe + Reflection-proof',
      cons: '⚠ Cannot extend other classes, slightly unconventional',
      code: `<span class="kw">public enum</span> <span class="type">Singleton</span> {
  INSTANCE;  <span class="cmt">// The one and only instance</span>

  <span class="kw">private</span> <span class="type">String</span> data;

  <span class="kw">public void</span> <span class="fn">doSomething</span>() {
    <span class="type">System</span>.out.<span class="fn">println</span>(<span class="str">"Working: "</span> + data);
  }
}
<span class="cmt">// Usage: Singleton.INSTANCE.doSomething();</span>`
    }
  };

  function renderSingletonCode(type) {
    const el = document.getElementById('singleton-code');
    if (!el) return;
    const variant = SINGLETON_CODES[type];
    el.innerHTML = `
      <div class="code-block">
        <div class="code-header">
          <span class="code-lang">☕ Java — ${variant.title}</span>
        </div>
        <div class="code-body">${variant.code}</div>
      </div>
      <div style="display:flex;gap:0.8rem;flex-wrap:wrap;margin-top:0.5rem;">
        <span style="font-family:var(--font-mono);font-size:0.72rem;font-weight:700;color:var(--accent-green)">${variant.pros}</span>
        <span style="font-family:var(--font-mono);font-size:0.72rem;font-weight:700;color:var(--accent-red)">${variant.cons}</span>
      </div>`;
  }

  const singletonToggle = document.getElementById('singleton-toggle');
  if (singletonToggle) {
    singletonToggle.querySelectorAll('.toggle-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        singletonToggle.querySelectorAll('.toggle-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        renderSingletonCode(btn.dataset.type);
      });
    });
  }
  renderSingletonCode('eager');

  /* ══════════════════════════════════════════════
     2. FACTORY METHOD
     ══════════════════════════════════════════════ */
  const factoryDemo = document.getElementById('factory-demo');
  const factoryResult = document.getElementById('factory-result');

  const FACTORY_PRODUCTS = {
    email: { icon: '📧', name: 'EmailNotification', cls: 'type', method: 'send(to, subject, body)', color: 'var(--accent-blue)' },
    sms:   { icon: '📱', name: 'SMSNotification',   cls: 'type', method: 'send(phoneNumber, text)', color: 'var(--accent-green)' },
    push:  { icon: '🔔', name: 'PushNotification',  cls: 'type', method: 'send(deviceToken, payload)', color: 'var(--accent-orange)' },
  };

  function renderFactory(type) {
    if (!factoryDemo) return;
    factoryDemo.innerHTML = '';
    const prod = FACTORY_PRODUCTS[type];
    const pipeline = document.createElement('div');
    pipeline.className = 'flow-pipeline';

    const steps = [
      { text: `Client\ncreate("${type}")`, cls: '' },
      { text: `NotificationFactory\ncreateNotification()`, cls: '' },
      { text: `${prod.icon} ${prod.name}\n${prod.method}`, cls: '' },
    ];

    steps.forEach((s, i) => {
      if (i > 0) {
        const arrow = document.createElement('span');
        arrow.className = 'flow-arrow';
        arrow.textContent = '→';
        pipeline.appendChild(arrow);
      }
      const node = document.createElement('div');
      node.className = 'flow-node';
      node.textContent = s.text;
      node.style.whiteSpace = 'pre-line';
      pipeline.appendChild(node);
    });

    factoryDemo.appendChild(pipeline);

    // Animate
    const nodes = pipeline.querySelectorAll('.flow-node');
    setTimeout(() => nodes[0]?.classList.add('active'), 200);
    setTimeout(() => { nodes[0]?.classList.remove('active'); nodes[0]?.classList.add('done'); nodes[1]?.classList.add('active'); }, 600);
    setTimeout(() => { nodes[1]?.classList.remove('active'); nodes[1]?.classList.add('done'); nodes[2]?.classList.add('new-node'); }, 1000);
    setTimeout(() => {
      if (factoryResult) factoryResult.innerHTML = `<span style="color:${prod.color}">✅ Factory created ${prod.icon} ${prod.name} — client never uses "new" directly!</span>`;
    }, 1200);
  }

  document.querySelectorAll('.factory-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      if (factoryResult) factoryResult.textContent = '';
      renderFactory(btn.dataset.type);
    });
  });

  document.getElementById('btn-factory-reset')?.addEventListener('click', () => {
    if (factoryDemo) factoryDemo.innerHTML = '';
    if (factoryResult) factoryResult.textContent = '';
  });

  /* ══════════════════════════════════════════════
     3. ABSTRACT FACTORY
     ══════════════════════════════════════════════ */
  const afDemo = document.getElementById('af-demo');
  const afResult = document.getElementById('af-result');
  const afToggle = document.getElementById('af-toggle');
  let afTheme = 'dark';

  if (afToggle) afToggle.querySelectorAll('.toggle-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      afToggle.querySelectorAll('.toggle-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      afTheme = btn.dataset.theme;
    });
  });

  const AF_THEMES = {
    dark: {
      factory: 'DarkThemeFactory',
      button: { name: 'DarkButton', style: 'background:#1e293b;color:#e2e8f0;border:1px solid #334155;padding:8px 16px;border-radius:6px;font-weight:700;cursor:pointer;font-family:var(--font-mono);font-size:0.72rem;' },
      checkbox: { name: 'DarkCheckbox', style: 'accent-color:#4cc9f0;' },
      color: 'var(--accent-blue)',
    },
    light: {
      factory: 'LightThemeFactory',
      button: { name: 'LightButton', style: 'background:#f1f5f9;color:#1e293b;border:1px solid #cbd5e1;padding:8px 16px;border-radius:6px;font-weight:700;cursor:pointer;font-family:var(--font-mono);font-size:0.72rem;' },
      checkbox: { name: 'LightCheckbox', style: 'accent-color:#7b2ff7;' },
      color: 'var(--accent-yellow)',
    },
  };

  document.getElementById('btn-af-create')?.addEventListener('click', () => {
    if (!afDemo) return;
    afDemo.innerHTML = '';
    if (afResult) afResult.textContent = '';
    const t = AF_THEMES[afTheme];

    // Show factory pipeline
    const pipeline = document.createElement('div');
    pipeline.className = 'flow-pipeline';
    pipeline.style.marginBottom = '1.5rem';

    const factoryNode = document.createElement('div');
    factoryNode.className = 'flow-node';
    factoryNode.textContent = `🏭 ${t.factory}`;
    pipeline.appendChild(factoryNode);

    const arrow1 = document.createElement('span');
    arrow1.className = 'flow-arrow';
    arrow1.textContent = '→';
    pipeline.appendChild(arrow1);

    const productsNode = document.createElement('div');
    productsNode.className = 'flow-node';
    productsNode.textContent = `createButton()\ncreateCheckbox()`;
    productsNode.style.whiteSpace = 'pre-line';
    pipeline.appendChild(productsNode);

    afDemo.appendChild(pipeline);

    // Animate
    setTimeout(() => factoryNode.classList.add('active'), 200);
    setTimeout(() => {
      factoryNode.classList.remove('active');
      factoryNode.classList.add('done');
      productsNode.classList.add('active');
    }, 600);

    setTimeout(() => {
      productsNode.classList.remove('active');
      productsNode.classList.add('done');

      // Show actual rendered components
      const preview = document.createElement('div');
      preview.style.cssText = 'display:flex;gap:1.5rem;align-items:center;flex-wrap:wrap;padding:16px;border:1px solid var(--border-card);border-radius:var(--radius-sm);background:var(--bg-glass);animation:fadeIn 0.4s ease;';

      const btnPreview = document.createElement('div');
      btnPreview.innerHTML = `<div style="font-size:0.55rem;color:var(--text-muted);margin-bottom:4px;">createButton()</div><button style="${t.button.style}">${t.button.name}</button>`;
      preview.appendChild(btnPreview);

      const cbPreview = document.createElement('div');
      cbPreview.innerHTML = `<div style="font-size:0.55rem;color:var(--text-muted);margin-bottom:4px;">createCheckbox()</div><label style="display:flex;align-items:center;gap:6px;font-family:var(--font-mono);font-size:0.72rem;font-weight:700;color:var(--text-secondary);cursor:pointer;"><input type="checkbox" checked style="${t.checkbox.style}transform:scale(1.3);"> ${t.checkbox.name}</label>`;
      preview.appendChild(cbPreview);

      afDemo.appendChild(preview);
      if (afResult) afResult.innerHTML = `<span style="color:${t.color}">✅ ${t.factory} created matching ${t.button.name} + ${t.checkbox.name} — consistent family!</span>`;
    }, 1000);
  });

  /* ══════════════════════════════════════════════
     4. BUILDER
     ══════════════════════════════════════════════ */
  const builderDemo = document.getElementById('builder-demo');
  const builderResult = document.getElementById('builder-result');
  let builderFields = {};

  function renderBuilder() {
    if (!builderDemo) return;
    builderDemo.innerHTML = '';
    const steps = document.createElement('div');
    steps.className = 'builder-steps';
    const fields = Object.entries(builderFields);

    if (fields.length === 0) {
      const placeholder = document.createElement('div');
      placeholder.className = 'instance-card neutral';
      placeholder.textContent = 'User.builder() — click setters to chain methods';
      builderDemo.appendChild(placeholder);
      return;
    }

    fields.forEach(([key, val], i) => {
      setTimeout(() => {
        const step = document.createElement('div');
        step.className = 'builder-step chain';
        step.innerHTML = `<span class="step-dot"></span>.${key}("${val}")`;
        steps.appendChild(step);
      }, i * 100);
    });

    builderDemo.appendChild(steps);
  }

  document.querySelectorAll('.builder-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      builderFields[btn.dataset.field] = btn.dataset.val;
      renderBuilder();
      if (builderResult) builderResult.innerHTML = `<span style="color:var(--accent-blue)">🔗 Chained .${btn.dataset.field}("${btn.dataset.val}") → returns this (fluent API)</span>`;
    });
  });

  document.getElementById('btn-builder-build')?.addEventListener('click', () => {
    if (Object.keys(builderFields).length === 0) {
      if (builderResult) builderResult.innerHTML = '<span style="color:var(--accent-yellow)">⚠ Add at least one field first!</span>';
      return;
    }
    const steps = builderDemo?.querySelector('.builder-steps');
    if (steps) {
      const buildStep = document.createElement('div');
      buildStep.className = 'builder-step build';
      buildStep.innerHTML = '<span class="step-dot"></span>.build() → creates immutable User';
      steps.appendChild(buildStep);

      const obj = document.createElement('div');
      obj.className = 'builder-obj';
      const fieldStr = Object.entries(builderFields).map(([k, v]) => `${k}="${v}"`).join(', ');
      obj.innerHTML = `📦 User { ${fieldStr} }`;
      builderDemo.appendChild(obj);
    }
    if (builderResult) builderResult.innerHTML = `<span style="color:var(--accent-green)">✅ .build() called — immutable User object created with ${Object.keys(builderFields).length} fields!</span>`;
  });

  document.getElementById('btn-builder-reset')?.addEventListener('click', () => {
    builderFields = {};
    renderBuilder();
    if (builderResult) builderResult.textContent = '';
  });

  renderBuilder();

  /* ══════════════════════════════════════════════
     5. STRATEGY
     ══════════════════════════════════════════════ */
  const strategyDemo = document.getElementById('strategy-demo');
  const strategyResult = document.getElementById('strategy-result');
  const UNSORTED = [38, 27, 43, 3, 9, 82, 10];

  const STRATEGIES = {
    bubble: {
      name: 'BubbleSort', icon: '🫧', complexity: 'O(n²)',
      description: 'Compares adjacent elements and swaps — simple but slow.',
      color: 'var(--accent-blue)',
      stepCount: 5,
    },
    merge: {
      name: 'MergeSort', icon: '🔀', complexity: 'O(n log n)',
      description: 'Divide & conquer — splits, sorts halves, merges back.',
      color: 'var(--accent-green)',
      stepCount: 3,
    },
    quick: {
      name: 'QuickSort', icon: '⚡', complexity: 'O(n log n) avg',
      description: 'Picks pivot, partitions around it. Fastest in practice.',
      color: 'var(--accent-orange)',
      stepCount: 3,
    },
  };

  function renderStrategy(strategyKey) {
    if (!strategyDemo) return;
    strategyDemo.innerHTML = '';
    if (strategyResult) strategyResult.textContent = '';
    const s = STRATEGIES[strategyKey];

    // Context → Strategy pipeline
    const pipeline = document.createElement('div');
    pipeline.className = 'flow-pipeline';
    pipeline.style.marginBottom = '1rem';

    const ctxNode = document.createElement('div');
    ctxNode.className = 'flow-node';
    ctxNode.textContent = `SortContext\nsetStrategy()`;
    ctxNode.style.whiteSpace = 'pre-line';
    pipeline.appendChild(ctxNode);

    const arrow = document.createElement('span');
    arrow.className = 'flow-arrow';
    arrow.textContent = '→';
    pipeline.appendChild(arrow);

    const stratNode = document.createElement('div');
    stratNode.className = 'flow-node';
    stratNode.textContent = `${s.icon} ${s.name}\n${s.complexity}`;
    stratNode.style.whiteSpace = 'pre-line';
    pipeline.appendChild(stratNode);

    strategyDemo.appendChild(pipeline);

    // Show array transformation
    const arrayContainer = document.createElement('div');
    arrayContainer.style.cssText = 'display:flex;flex-direction:column;gap:0.5rem;margin-top:1rem;';

    const before = document.createElement('div');
    before.className = 'instance-row';
    before.innerHTML = `<span style="font-family:var(--font-mono);font-size:0.65rem;color:var(--text-muted);min-width:60px;">Input:</span>`;
    UNSORTED.forEach(n => {
      const card = document.createElement('div');
      card.className = 'instance-card neutral';
      card.textContent = n;
      before.appendChild(card);
    });
    arrayContainer.appendChild(before);
    strategyDemo.appendChild(arrayContainer);

    // Animate
    setTimeout(() => ctxNode.classList.add('active'), 200);
    setTimeout(() => { ctxNode.classList.remove('active'); ctxNode.classList.add('done'); stratNode.classList.add('active'); }, 600);
    setTimeout(() => {
      stratNode.classList.remove('active');
      stratNode.classList.add('done');

      const sorted = [...UNSORTED].sort((a, b) => a - b);
      const after = document.createElement('div');
      after.className = 'instance-row';
      after.innerHTML = `<span style="font-family:var(--font-mono);font-size:0.65rem;color:var(--text-muted);min-width:60px;">Output:</span>`;
      sorted.forEach(n => {
        const card = document.createElement('div');
        card.className = 'instance-card same';
        card.textContent = n;
        after.appendChild(card);
      });
      arrayContainer.appendChild(after);

      if (strategyResult) strategyResult.innerHTML = `<span style="color:${s.color}">${s.icon} ${s.name} — ${s.description} ${s.complexity}</span>`;
    }, 1200);
  }

  document.querySelectorAll('.strategy-btn').forEach(btn => {
    btn.addEventListener('click', () => renderStrategy(btn.dataset.strategy));
  });

  document.getElementById('btn-strategy-reset')?.addEventListener('click', () => {
    if (strategyDemo) strategyDemo.innerHTML = '';
    if (strategyResult) strategyResult.textContent = '';
  });

  /* ══════════════════════════════════════════════
     6. OBSERVER
     ══════════════════════════════════════════════ */
  const observerDemo = document.getElementById('observer-demo');
  const observerResult = document.getElementById('observer-result');
  const SUB_NAMES = ['EmailService', 'LogService', 'AnalyticsService', 'CacheInvalidator', 'NotificationService'];
  let subscribers = ['EmailService', 'LogService', 'AnalyticsService'];

  function renderObserver(firing = false) {
    if (!observerDemo) return;
    observerDemo.innerHTML = '';
    const layout = document.createElement('div');
    layout.className = 'observer-layout';

    // Publisher
    const pub = document.createElement('div');
    pub.className = 'observer-publisher' + (firing ? ' firing' : '');
    pub.innerHTML = `<div class="pub-title">📡 EventPublisher</div><div class="pub-event">${firing ? '🔔 "USER_CREATED"' : 'Waiting...'}</div>`;
    layout.appendChild(pub);

    // Arrows
    const arrows = document.createElement('div');
    arrows.className = 'observer-arrows';
    subscribers.forEach((_, i) => {
      const line = document.createElement('div');
      line.className = 'observer-arrow-line';
      line.textContent = '——→';
      line.id = `obs-arrow-${i}`;
      arrows.appendChild(line);
    });
    layout.appendChild(arrows);

    // Subscribers
    const subs = document.createElement('div');
    subs.className = 'observer-subs';
    subscribers.forEach((name, i) => {
      const sub = document.createElement('div');
      sub.className = 'observer-sub';
      sub.id = `obs-sub-${i}`;
      sub.innerHTML = `<div style="font-size:0.55rem;color:var(--text-muted)">Observer #${i + 1}</div>${name}`;
      subs.appendChild(sub);
    });
    layout.appendChild(subs);
    observerDemo.appendChild(layout);
  }

  document.getElementById('btn-obs-add')?.addEventListener('click', () => {
    if (subscribers.length >= SUB_NAMES.length) {
      if (observerResult) observerResult.innerHTML = '<span style="color:var(--accent-yellow)">⚠ Max 5 subscribers</span>';
      return;
    }
    const nextName = SUB_NAMES.find(n => !subscribers.includes(n));
    if (nextName) subscribers.push(nextName);
    renderObserver();
    if (observerResult) observerResult.innerHTML = `<span style="color:var(--accent-green)">+ Subscribed: ${nextName} (${subscribers.length} total)</span>`;
  });

  document.getElementById('btn-obs-remove')?.addEventListener('click', () => {
    if (subscribers.length === 0) return;
    const removed = subscribers.pop();
    renderObserver();
    if (observerResult) observerResult.innerHTML = `<span style="color:var(--accent-red)">− Unsubscribed: ${removed} (${subscribers.length} remaining)</span>`;
  });

  document.getElementById('btn-obs-fire')?.addEventListener('click', () => {
    if (subscribers.length === 0) {
      if (observerResult) observerResult.innerHTML = '<span style="color:var(--accent-yellow)">⚠ No subscribers to notify!</span>';
      return;
    }
    renderObserver(true);
    subscribers.forEach((_, i) => {
      setTimeout(() => {
        const arrow = document.getElementById(`obs-arrow-${i}`);
        const sub = document.getElementById(`obs-sub-${i}`);
        if (arrow) arrow.classList.add('active');
        if (sub) sub.classList.add('notified');
      }, 200 + i * 200);
    });
    setTimeout(() => {
      if (observerResult) observerResult.innerHTML = `<span style="color:var(--accent-green)">✅ Event "USER_CREATED" → ${subscribers.length} observers notified simultaneously!</span>`;
    }, 200 + subscribers.length * 200 + 100);
  });

  document.getElementById('btn-obs-reset')?.addEventListener('click', () => {
    subscribers = ['EmailService', 'LogService', 'AnalyticsService'];
    renderObserver();
    if (observerResult) observerResult.textContent = '';
  });

  renderObserver();

  /* ══════════════════════════════════════════════
     7. DECORATOR
     ══════════════════════════════════════════════ */
  const decoratorDemo = document.getElementById('decorator-demo');
  const decoratorResult = document.getElementById('decorator-result');
  const DECORATORS = {
    milk:    { name: '🥛 MilkDecorator', cost: 0.50 },
    sugar:   { name: '🍬 SugarDecorator', cost: 0.30 },
    whip:    { name: '🍦 WhipCreamDecorator', cost: 0.70 },
    caramel: { name: '🍯 CaramelDecorator', cost: 0.60 },
  };
  let decoratorStack = [];
  const BASE_COST = 2.00;

  function renderDecorator() {
    if (!decoratorDemo) return;
    decoratorDemo.innerHTML = '';
    const stack = document.createElement('div');
    stack.className = 'decorator-stack';

    // Decorators (outermost first)
    const reversedStack = [...decoratorStack].reverse();
    reversedStack.forEach((dKey, i) => {
      const layer = document.createElement('div');
      layer.className = 'decorator-layer wrap';
      const d = DECORATORS[dKey];
      layer.innerHTML = `<span class="layer-label">Decorator #${decoratorStack.length - i}</span><br>${d.name} (+$${d.cost.toFixed(2)})`;
      stack.appendChild(layer);
    });

    // Base
    const base = document.createElement('div');
    base.className = 'decorator-layer base';
    base.innerHTML = `<span class="layer-label">Base Component</span><br>☕ SimpleCoffee ($${BASE_COST.toFixed(2)})`;
    stack.appendChild(base);

    decoratorDemo.appendChild(stack);

    const total = BASE_COST + decoratorStack.reduce((sum, k) => sum + DECORATORS[k].cost, 0);
    if (decoratorResult) {
      if (decoratorStack.length === 0) {
        decoratorResult.innerHTML = `<span style="color:var(--accent-blue)">☕ Base coffee = $${BASE_COST.toFixed(2)}. Add decorators to wrap it!</span>`;
      } else {
        decoratorResult.innerHTML = `<span style="color:var(--accent-green)">🧅 ${decoratorStack.length} decorator(s) wrapping base → Total: $${total.toFixed(2)} | getDescription() chains through all layers</span>`;
      }
    }
  }

  document.querySelectorAll('.decorator-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      decoratorStack.push(btn.dataset.decorator);
      renderDecorator();
    });
  });

  document.getElementById('btn-decorator-reset')?.addEventListener('click', () => {
    decoratorStack = [];
    renderDecorator();
  });

  renderDecorator();

  /* ══════════════════════════════════════════════
     8. ADAPTER
     ══════════════════════════════════════════════ */
  const adapterDemo = document.getElementById('adapter-demo');
  const adapterResult = document.getElementById('adapter-result');

  function renderAdapter(mode) {
    if (!adapterDemo) return;
    adapterDemo.innerHTML = '';
    if (adapterResult) adapterResult.textContent = '';

    const pipeline = document.createElement('div');
    pipeline.className = 'adapter-pipeline';

    if (mode === 'direct') {
      const nodes = [
        { text: '📡 LegacyAPI\n<xml>data</xml>', cls: 'source' },
        { text: '❌ INCOMPATIBLE', cls: '' },
        { text: '📱 NewClient\nexpects JSON', cls: 'target' },
      ];
      nodes.forEach((n, i) => {
        if (i > 0) {
          const arrow = document.createElement('span');
          arrow.className = 'adapter-arrow';
          arrow.textContent = i === 1 ? '✕' : '→';
          pipeline.appendChild(arrow);
        }
        const node = document.createElement('div');
        node.className = `adapter-node ${n.cls}`;
        node.textContent = n.text;
        node.style.whiteSpace = 'pre-line';
        pipeline.appendChild(node);
      });

      adapterDemo.appendChild(pipeline);
      const pipeNodes = pipeline.querySelectorAll('.adapter-node');
      setTimeout(() => pipeNodes[0]?.classList.add('active'), 200);
      setTimeout(() => {
        pipeNodes[1].style.cssText = 'border-color:var(--accent-red);color:var(--accent-red);background:rgba(239,71,111,0.08);';
        pipeNodes[1].classList.add('active');
        if (adapterResult) adapterResult.innerHTML = '<span style="color:var(--accent-red)">❌ TypeError: Cannot parse XML as JSON — incompatible interfaces!</span>';
      }, 800);

    } else {
      const nodes = [
        { text: '📡 LegacyAPI\n<xml>data</xml>', cls: 'source' },
        { text: '🔌 XmlToJsonAdapter\nconvert(xml) → json', cls: 'adapter' },
        { text: '📱 NewClient\n{"data": "..."}', cls: 'target' },
      ];
      nodes.forEach((n, i) => {
        if (i > 0) {
          const arrow = document.createElement('span');
          arrow.className = 'adapter-arrow';
          arrow.textContent = '→';
          pipeline.appendChild(arrow);
        }
        const node = document.createElement('div');
        node.className = `adapter-node ${n.cls}`;
        node.textContent = n.text;
        node.style.whiteSpace = 'pre-line';
        pipeline.appendChild(node);
      });

      adapterDemo.appendChild(pipeline);
      const pipeNodes = pipeline.querySelectorAll('.adapter-node');
      setTimeout(() => pipeNodes[0]?.classList.add('active'), 200);
      setTimeout(() => {
        pipeNodes[0].style.boxShadow = 'none';
        pipeNodes[1]?.classList.add('active');
      }, 600);
      setTimeout(() => {
        pipeNodes[1].style.boxShadow = 'none';
        pipeNodes[2]?.classList.add('active');
      }, 1000);
      setTimeout(() => {
        if (adapterResult) adapterResult.innerHTML = '<span style="color:var(--accent-green)">✅ Adapter converted XML → JSON seamlessly. Client works without knowing about the legacy format!</span>';
      }, 1200);
    }
  }

  document.getElementById('btn-adapter-direct')?.addEventListener('click', () => renderAdapter('direct'));
  document.getElementById('btn-adapter-adapted')?.addEventListener('click', () => renderAdapter('adapted'));
  document.getElementById('btn-adapter-reset')?.addEventListener('click', () => {
    if (adapterDemo) adapterDemo.innerHTML = '';
    if (adapterResult) adapterResult.textContent = '';
  });

  /* ══════════════════════════════════════════════
     9. PROXY
     ══════════════════════════════════════════════ */
  const proxyDemo = document.getElementById('proxy-demo');
  const proxyResult = document.getElementById('proxy-result');
  let proxyCache = {};

  function renderProxy(key, cached) {
    if (!proxyDemo) return;
    proxyDemo.innerHTML = '';
    const layout = document.createElement('div');
    layout.className = 'proxy-layout';
    proxyDemo.appendChild(layout);

    const steps = [];
    steps.push({ text: `📡 Client → proxy.fetchData("${key}")`, cls: 'proxy-op', delay: 0 });
    steps.push({ text: `🛡️ Proxy: checking cache for "${key}"...`, cls: 'proxy-op', delay: 300 });

    if (cached) {
      steps.push({ text: `⚡ CACHE HIT — returning cached "${key}" instantly`, cls: 'cached', delay: 600 });
    } else {
      steps.push({ text: `❌ Cache miss — delegating to RealService`, cls: 'proxy-op', delay: 600 });
      steps.push({ text: `🔄 RealService: fetching "${key}" from database... (500ms)`, cls: 'real-op', delay: 900 });
      steps.push({ text: `💾 Proxy: caching result for "${key}"`, cls: 'proxy-op', delay: 1500 });
      steps.push({ text: `✅ Result returned + cached for future calls`, cls: 'cached', delay: 1800 });
    }

    steps.forEach(s => {
      setTimeout(() => {
        const step = document.createElement('div');
        step.className = `proxy-step ${s.cls}`;
        step.textContent = s.text;
        layout.appendChild(step);
      }, s.delay);
    });

    const totalDelay = steps[steps.length - 1].delay + 200;
    setTimeout(() => {
      if (proxyResult) {
        proxyResult.innerHTML = cached
          ? `<span style="color:var(--accent-blue)">⚡ Cache hit! Response in ~0ms. Proxy avoided database call.</span>`
          : `<span style="color:var(--accent-green)">✅ Fetched "${key}" in ~500ms. Result now cached — next call will be instant!</span>`;
      }
    }, totalDelay);
  }

  document.getElementById('btn-proxy-call1')?.addEventListener('click', () => {
    const cached = !!proxyCache['users'];
    renderProxy('users', cached);
    proxyCache['users'] = true;
  });

  document.getElementById('btn-proxy-call2')?.addEventListener('click', () => {
    if (!proxyCache['users']) {
      proxyCache['users'] = true;
      renderProxy('users', false);
    } else {
      renderProxy('users', true);
    }
  });

  document.getElementById('btn-proxy-call3')?.addEventListener('click', () => {
    const cached = !!proxyCache['orders'];
    renderProxy('orders', cached);
    proxyCache['orders'] = true;
  });

  document.getElementById('btn-proxy-reset')?.addEventListener('click', () => {
    proxyCache = {};
    if (proxyDemo) proxyDemo.innerHTML = '';
    if (proxyResult) proxyResult.textContent = '';
  });

  /* ══════════════════════════════════════════════
     10. TEMPLATE METHOD
     ══════════════════════════════════════════════ */
  const templateDemo = document.getElementById('template-demo');
  const templateResult = document.getElementById('template-result');
  const templateToggle = document.getElementById('template-toggle');
  let templateType = 'csv';

  if (templateToggle) templateToggle.querySelectorAll('.toggle-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      templateToggle.querySelectorAll('.toggle-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      templateType = btn.dataset.type;
    });
  });

  const TEMPLATE_ALGOS = {
    csv: {
      name: 'CSVDataMiner',
      steps: [
        { text: '📂 openFile() — Open CSV file', type: 'variable', icon: '🔶' },
        { text: '📖 extractData() — Parse CSV rows', type: 'variable', icon: '🔶' },
        { text: '🔄 parseData() — Convert strings to objects (FIXED)', type: 'fixed', icon: '🔷' },
        { text: '📊 analyzeData() — Run statistics (FIXED)', type: 'fixed', icon: '🔷' },
        { text: '📄 generateReport() — Output results (FIXED)', type: 'fixed', icon: '🔷' },
        { text: '🔒 closeFile() — Close CSV handle', type: 'variable', icon: '🔶' },
      ]
    },
    json: {
      name: 'JSONDataMiner',
      steps: [
        { text: '📂 openFile() — Open JSON file', type: 'variable', icon: '🔶' },
        { text: '📖 extractData() — Parse JSON nodes', type: 'variable', icon: '🔶' },
        { text: '🔄 parseData() — Convert strings to objects (FIXED)', type: 'fixed', icon: '🔷' },
        { text: '📊 analyzeData() — Run statistics (FIXED)', type: 'fixed', icon: '🔷' },
        { text: '📄 generateReport() — Output results (FIXED)', type: 'fixed', icon: '🔷' },
        { text: '🔒 closeFile() — Close JSON reader', type: 'variable', icon: '🔶' },
      ]
    },
    db: {
      name: 'DatabaseMiner',
      steps: [
        { text: '📂 openFile() — Connect to database', type: 'variable', icon: '🔶' },
        { text: '📖 extractData() — Execute SQL query', type: 'variable', icon: '🔶' },
        { text: '🔄 parseData() — Convert strings to objects (FIXED)', type: 'fixed', icon: '🔷' },
        { text: '📊 analyzeData() — Run statistics (FIXED)', type: 'fixed', icon: '🔷' },
        { text: '📄 generateReport() — Output results (FIXED)', type: 'fixed', icon: '🔷' },
        { text: '🔒 closeFile() — Close DB connection', type: 'variable', icon: '🔶' },
      ]
    },
  };

  document.getElementById('btn-template-run')?.addEventListener('click', () => {
    if (!templateDemo) return;
    templateDemo.innerHTML = '';
    if (templateResult) templateResult.textContent = '';

    const algo = TEMPLATE_ALGOS[templateType];
    const titleEl = document.createElement('div');
    titleEl.style.cssText = 'font-family:var(--font-mono);font-size:0.82rem;font-weight:700;color:var(--accent-blue);margin-bottom:0.8rem;';
    titleEl.textContent = `▶ Running ${algo.name}.mine() ...`;
    templateDemo.appendChild(titleEl);

    const steps = document.createElement('div');
    steps.className = 'template-steps';
    templateDemo.appendChild(steps);

    algo.steps.forEach((s, i) => {
      setTimeout(() => {
        const step = document.createElement('div');
        step.className = `template-step ${s.type}`;
        step.innerHTML = `<span class="step-icon">${s.icon}</span><span>${s.text}</span>`;
        steps.appendChild(step);

        // Briefly flash "running"
        step.classList.add('running');
        setTimeout(() => step.classList.remove('running'), 300);

        if (i === algo.steps.length - 1) {
          setTimeout(() => {
            const variableCount = algo.steps.filter(st => st.type === 'variable').length;
            const fixedCount = algo.steps.filter(st => st.type === 'fixed').length;
            if (templateResult) templateResult.innerHTML = `<span style="color:var(--accent-green)">✅ Algorithm complete! 🔷 ${fixedCount} fixed steps (shared) + 🔶 ${variableCount} overridden steps (${algo.name}-specific)</span>`;
          }, 300);
        }
      }, i * 350);
    });
  });

});
