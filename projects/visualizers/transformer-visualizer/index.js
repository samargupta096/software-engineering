;(() => {
  "use strict";

  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];

  // ── TOC Active State ──
  const tocLinks = $$('.toc__link');
  const tocObs = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        tocLinks.forEach(l => l.classList.remove('active'));
        const link = $('.toc__link[data-section="' + e.target.id + '"]');
        if (link) link.classList.add('active');
      }
    });
  }, { threshold: 0.3 });
  $$('.section').forEach(s => tocObs.observe(s));

  // ── Scroll Reveal ──
  const revealObs = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) e.target.classList.add("visible");
    });
  }, { threshold: 0.12 });
  $$(".section.reveal").forEach(el => revealObs.observe(el));

  document.addEventListener("DOMContentLoaded", () => {
    initEmbeddings();
    initSelfAttention();
    initMultiHead();
    initFFN();
    initLayerNorm();
  });

  // ═══════════════ 1. EMBEDDINGS + POSITIONAL ═══════════════
  function initEmbeddings() {
    const input = $("#sentence-input");
    const btn = $("#btn-tokenize");
    const container = $("#embedding-demo");

    function getBaseColor(word) {
      // Deterministic pseudo-random color based on word hash
      let hash = 0;
      for (let i = 0; i < word.length; i++) hash = word.charCodeAt(i) + ((hash << 5) - hash);
      const h = Math.abs(hash) % 360;
      return `hsl(${h}, 70%, 60%)`;
    }

    function render() {
      const text = input.value.trim() || "The cat sat";
      const words = text.split(/\s+/).slice(0, 8); // limit to 8 words
      
      container.innerHTML = words.map((w, pos) => {
        const baseColor = getBaseColor(w);
        // Positional encoding adds a wave pattern
        const posEffect = Math.sin(pos * 0.8) * 0.5 + 0.5; 
        
        return `
          <div class="embed-row">
            <div class="embed-word">${w}</div>
            <div class="embed-vector" title="Semantic Embedding">
              ${Array(10).fill(0).map(() => `<div class="embed-cell" style="background:${baseColor}; opacity:${Math.random()*0.5 + 0.5}"></div>`).join('')}
            </div>
            <div class="embed-plus">+</div>
            <div class="embed-vector" title="Positional Encoding (pos=${pos})">
              ${Array(10).fill(0).map((_, i) => {
                const wave = Math.sin(pos / Math.pow(10000, 2*i/10)) * 0.5 + 0.5;
                return `<div class="embed-cell" style="background:var(--amber); opacity:${wave}"></div>`;
              }).join('')}
            </div>
            <div class="embed-plus">=</div>
            <div class="embed-vector" title="Final Input to Transformer">
              ${Array(10).fill(0).map((_, i) => {
                const wave = Math.sin(pos / Math.pow(10000, 2*i/10)) * 0.5 + 0.5;
                // Mix semantic and positional
                return `<div class="embed-cell" style="background: color-mix(in srgb, ${baseColor} ${50 + Math.random()*20}%, var(--amber) ${wave*50}%);"></div>`;
              }).join('')}
            </div>
          </div>
        `;
      }).join('');
    }

    btn.addEventListener("click", render);
    input.addEventListener("keydown", e => { if (e.key === "Enter") render(); });
    render();
  }

  // ═══════════════ 2. SELF-ATTENTION (QKV) ═══════════════
  function initSelfAttention() {
    const container = $("#attention-demo");
    const btns = $$("#attention-scenario .prec-btn");

    const scenarios = {
      river: {
        words: ["I", "sat", "by", "the", "river", "bank"],
        weights: {
          "bank": [0.05, 0.1, 0.15, 0.1, 0.5, 1.0], // bank pays attention to river
          "river": [0.05, 0.1, 0.1, 0.1, 1.0, 0.5],
          "sat": [0.2, 1.0, 0.3, 0.1, 0.1, 0.1],
          "I": [1.0, 0.4, 0.1, 0.05, 0.05, 0.05]
        }
      },
      money: {
        words: ["I", "went", "to", "the", "bank", "to", "deposit", "money"],
        weights: {
          "bank": [0.05, 0.1, 0.05, 0.1, 1.0, 0.1, 0.3, 0.4], // bank pays attention to deposit, money
          "money": [0.1, 0.05, 0.05, 0.05, 0.3, 0.1, 0.5, 1.0],
          "deposit": [0.1, 0.1, 0.1, 0.05, 0.4, 0.1, 1.0, 0.5]
        }
      }
    };

    function render(key) {
      btns.forEach(b => b.classList.toggle("active", b.dataset.scenario === key));
      const s = scenarios[key];
      
      container.innerHTML = s.words.map(w => `<div class="attn-word">${w}</div>`).join("");
      
      const wordEls = $$(".attn-word", container);
      
      wordEls.forEach((el, i) => {
        el.addEventListener("mouseenter", () => {
          const w = el.textContent;
          // Use predefined weights or a generic fallback
          const wArr = s.weights[w] || Array(s.words.length).fill(0).map((_, idx) => idx === i ? 1.0 : 0.1);
          
          wordEls.forEach((wel, j) => {
            const weight = wArr[j];
            wel.style.backgroundColor = `rgba(99,102,241, ${weight * 0.4})`;
            wel.style.borderColor = `rgba(99,102,241, ${weight})`;
            if (weight > 0.3) wel.style.color = "var(--text-primary)";
            else wel.style.color = "var(--text-secondary)";
          });
          el.classList.add("active");
        });
        
        el.addEventListener("mouseleave", () => {
          wordEls.forEach(wel => {
            wel.style.backgroundColor = "";
            wel.style.borderColor = "";
            wel.style.color = "";
            wel.classList.remove("active");
          });
        });
      });
    }

    btns.forEach(b => b.addEventListener("click", () => render(b.dataset.scenario)));
    render("river");
  }

  // ═══════════════ 3. MULTI-HEAD ATTENTION ═══════════════
  function initMultiHead() {
    const container = $("#multihead-demo");
    const btns = $$("#head-toggle .prec-btn");

    const words = ["The", "ball", "hit", "the", "window", "and", "it", "broke", "."];
    
    // Simulating what different heads might focus on for the word "it" (index 6)
    const heads = {
      1: [0.1, 0.8, 0.1, 0.1, 0.2, 0.1, 1.0, 0.1, 0.1], // Head 1: Pronoun resolution -> "it" refers to "ball"
      2: [0.1, 0.1, 0.7, 0.1, 0.1, 0.1, 1.0, 0.6, 0.1], // Head 2: Subject-verb -> "it" + "hit/broke"
      3: [0.5, 0.2, 0.1, 0.5, 0.2, 0.1, 1.0, 0.1, 0.1]  // Head 3: Determiners -> "it" loosely connects to "The/the"
    };

    function render(headId) {
      btns.forEach(b => b.classList.toggle("active", b.dataset.head === headId));
      
      const weights = heads[headId];
      
      container.innerHTML = words.map((w, i) => {
        const weight = weights[i];
        let color = "var(--text-secondary)";
        if (weight > 0.4) color = "var(--text-primary)";
        if (i === 6) color = "var(--accent-3)"; // Target word "it"
        
        return `<div class="attn-word" style="
          background-color: rgba(139,92,246, ${weight * 0.4});
          border-color: rgba(139,92,246, ${weight});
          color: ${color};
        ">${w}</div>`;
      }).join("");
    }

    btns.forEach(b => b.addEventListener("click", () => render(b.dataset.head)));
    render("1");
  }

  // ═══════════════ 4. FEED-FORWARD NETWORK ═══════════════
  function initFFN() {
    const container = $("#ffn-demo");
    const btns = $$("#activation-toggle .prec-btn");

    // Generate some random input values from -3 to 3
    const numBars = 40;
    const inputs = Array.from({length: numBars}, (_, i) => {
      // Sine wave with noise
      return Math.sin(i * 0.3) * 2 + (Math.random() - 0.5);
    });

    // Activation functions
    const funcs = {
      relu: (x) => Math.max(0, x),
      gelu: (x) => 0.5 * x * (1 + Math.tanh(Math.sqrt(2 / Math.PI) * (x + 0.044715 * Math.pow(x, 3)))),
      swish: (x) => x * (1 / (1 + Math.exp(-x)))
    };

    function render(funcName) {
      btns.forEach(b => b.classList.toggle("active", b.dataset.func === funcName));
      const fn = funcs[funcName];
      
      container.innerHTML = inputs.map(x => {
        const y = fn(x);
        
        // Scale for viz (max height 100px)
        const scale = 30; 
        const height = Math.abs(y * scale);
        const isNeg = y < 0;
        
        return `<div class="ffn-bar ${isNeg ? 'negative' : ''}" style="height: ${height}px; opacity: ${Math.min(1, height/10 + 0.2)};"></div>`;
      }).join("");
    }

    btns.forEach(b => b.addEventListener("click", () => render(b.dataset.func)));
    render("gelu");
  }

  // ═══════════════ 5. LAYER NORMALIZATION ═══════════════
  function initLayerNorm() {
    const slider = $("#slider-norm");
    const container = $("#norm-demo");

    // Random base vector (100 dimensions)
    const baseVector = Array.from({length: 100}, () => Math.random() * 2 - 1);

    function render() {
      const scale = parseFloat(slider.value) / 10; // scale from 0.1 to 10
      
      // Apply scale (simulate exploding gradients)
      const inputVector = baseVector.map(x => x * scale);
      
      // Calculate LayerNorm (mean 0, variance 1)
      const mean = inputVector.reduce((a,b)=>a+b, 0) / inputVector.length;
      const variance = inputVector.reduce((a,b)=>a+Math.pow(b-mean, 2), 0) / inputVector.length;
      const stdDev = Math.sqrt(variance + 1e-5);
      
      const normVector = inputVector.map(x => (x - mean) / stdDev);

      // Viz function
      const renderVector = (vec, maxAbs) => {
        return vec.map(x => {
          const h = (Math.abs(x) / maxAbs) * 100;
          return `<div class="norm-bar" style="height: ${Math.min(100, h)}%; opacity: ${Math.min(1, h/20+0.1)}"></div>`;
        }).join("");
      };

      // Raw inputs can grow huge, fix max scale at 10 for viz
      container.innerHTML = `
        <div class="norm-section">
          <div class="norm-label">Raw Input (Variance: ${variance.toFixed(2)})</div>
          ${renderVector(inputVector, 10)}
        </div>
        <div class="norm-section normalized">
          <div class="norm-label">After LayerNorm (Variance: 1.00)</div>
          ${renderVector(normVector, 3)}
        </div>
      `;
    }

    slider.addEventListener("input", render);
    render();
  }

})();
