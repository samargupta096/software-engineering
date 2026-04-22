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
    initBitExplorer();
    initNumberLine();
    initHistogram();
    initMethodsGrid();
    initMemoryCalculator();
    initTradeoffChart();
    initRealWorld();
  });

  // ═══════════════ 1. BIT EXPLORER ═══════════════
  function initBitExplorer() {
    const container = $("#bit-explorer");
    const btns = $$("#precision-toggle .prec-btn");

    const formats = {
      32: { name: "FP32 (Single Precision)", desc: "1 sign, 8 exponent, 23 mantissa bits.", layout: ["sign", ...Array(8).fill("exponent"), ...Array(23).fill("mantissa")] },
      16: { name: "FP16 (Half Precision)", desc: "1 sign, 5 exponent, 10 mantissa bits.", layout: ["sign", ...Array(5).fill("exponent"), ...Array(10).fill("mantissa")] },
      8: { name: "INT8 (8-bit Integer)", desc: "1 sign, 7 magnitude bits (values -128 to 127).", layout: ["sign", ...Array(7).fill("mantissa")] },
      4: { name: "INT4 (4-bit Integer)", desc: "1 sign, 3 magnitude bits (values -8 to 7).", layout: ["sign", ...Array(3).fill("mantissa")] }
    };

    function render(bits) {
      btns.forEach(b => b.classList.toggle("active", b.dataset.bits == bits));
      const f = formats[bits];
      container.innerHTML = `
        <div class="bit-row">
          <div class="bit-row__value">${f.name}</div>
          <div class="bit-row__label">${f.desc}</div>
          <div class="bit-row__binary">
            ${f.layout.map(type => `<div class="bit-cell ${type}">${Math.random() > 0.5 ? 1 : 0}</div>`).join("")}
          </div>
          <div class="bit-legend">
            ${bits >= 16 ? `
              <span><div class="dot" style="background:var(--red);"></div> Sign</span>
              <span><div class="dot" style="background:var(--amber);"></div> Exponent</span>
              <span><div class="dot" style="background:var(--accent-1);"></div> Mantissa (Fraction)</span>
            ` : `
              <span><div class="dot" style="background:var(--red);"></div> Sign</span>
              <span><div class="dot" style="background:var(--accent-1);"></div> Magnitude</span>
            `}
          </div>
        </div>
      `;
    }

    btns.forEach(b => b.addEventListener("click", () => render(b.dataset.bits)));
    render(32);
  }

  // ═══════════════ 2. NUMBER LINE ROUNDING ═══════════════
  function initNumberLine() {
    const slider = $("#slider-original-value");
    const valLabel = $("#val-original");
    const container = $("#number-line");

    const grids = [
      { name: "FP16 (Grid step ~0.01)", step: 0.01, color: "var(--green)", desc: "low" },
      { name: "INT8 (Grid step ~0.1)", step: 0.1, color: "var(--amber)", desc: "medium" },
      { name: "INT4 (Grid step ~0.5)", step: 0.5, color: "var(--red)", desc: "high" }
    ];

    function render() {
      const orig = parseFloat(slider.value) / 100;
      valLabel.textContent = orig.toFixed(2);
      
      container.innerHTML = grids.map(g => {
        const quantized = Math.round(orig / g.step) * g.step;
        const error = Math.abs(orig - quantized).toFixed(3);
        const origPct = ((orig + 3) / 6) * 100;
        const quantPct = ((quantized + 3) / 6) * 100;
        
        return `
          <div class="nl-row">
            <div class="nl-label">
              <span>${g.name}</span>
              <span class="nl-error ${g.desc}">Error: ${error}</span>
            </div>
            <div class="nl-track">
              <!-- Grid lines simulation -->
              <div style="position:absolute; inset:0; background:repeating-linear-gradient(90deg, transparent, transparent calc(${(g.step/6)*100}% - 1px), var(--border) calc(${(g.step/6)*100}% - 1px), var(--border) ${(g.step/6)*100}%);"></div>
              <div class="nl-marker original" style="left: ${origPct}%; z-index:2; box-shadow: 0 0 8px var(--accent-3);"></div>
              <div class="nl-marker quantized" style="left: ${quantPct}%; z-index:1; background: ${g.color}; box-shadow: 0 0 8px ${g.color};"></div>
            </div>
          </div>
        `;
      }).join("");
    }

    slider.addEventListener("input", render);
    render();
  }

  // ═══════════════ 3. WEIGHT HISTOGRAM ═══════════════
  function initHistogram() {
    const slider = $("#slider-weight-bits");
    const valLabel = $("#val-weight-bits");
    const container = $("#histogram");
    const statsContainer = $("#weight-stats");

    // Generate normal distribution once
    const numBars = 50;
    const baseDistribution = Array.from({length: numBars}, (_, i) => {
      const x = (i - numBars/2) / (numBars/6); // -3 to 3 std dev
      return Math.exp(-0.5 * x * x); // Unnormalized bell curve
    });
    const maxBase = Math.max(...baseDistribution);

    function render() {
      const bits = parseInt(slider.value);
      valLabel.textContent = bits + "-bit";

      // Calculate quantization effects
      const buckets = Math.pow(2, bits) - 1; 
      const clipThreshold = bits < 8 ? (bits === 2 ? 0.3 : 0.6) : 1.0; // Simulate clipping at low bits
      
      let clippedCount = 0;
      let totalCount = 0;

      container.innerHTML = baseDistribution.map((val, i) => {
        const x = (i - numBars/2) / (numBars/6);
        let currentVal = val;
        let isClipped = false;

        // Simulate clipping of outliers
        if (Math.abs(x) > clipThreshold * 3) {
           currentVal = 0;
           isClipped = true;
           clippedCount += val;
        }

        // Simulate grouping into fewer buckets (staircase effect)
        const activeBuckets = Math.min(numBars, buckets);
        const bucketSize = numBars / activeBuckets;
        const bucketIndex = Math.floor(i / bucketSize);
        // Average value in bucket (rough approximation for viz)
        
        totalCount += val;
        
        const heightPct = isClipped ? 5 : (currentVal / maxBase) * 100;
        
        return `<div class="hist-bar ${isClipped ? 'clipped' : ''}" 
                     style="height: ${heightPct}%; width: ${100/numBars}%;"
                     data-count="w=${x.toFixed(1)}"></div>`;
      }).join("");

      const clipPct = ((clippedCount / totalCount) * 100).toFixed(1);
      const uniqueVals = Math.min(buckets, 1000000).toLocaleString();

      statsContainer.innerHTML = `
        <div class="stat-item">
          <div class="stat-val">${uniqueVals}</div>
          <div class="stat-label">Unique Values Allowed</div>
        </div>
        <div class="stat-item">
          <div class="stat-val" style="color: ${clipPct > 5 ? 'var(--red)' : 'var(--accent-3)'}">${clipPct}%</div>
          <div class="stat-label">Outliers Clipped</div>
        </div>
      `;
    }

    slider.addEventListener("input", render);
    render();
  }

  // ═══════════════ 4. METHODS GRID ═══════════════
  function initMethodsGrid() {
    const grid = $("#methods-grid");
    const methods = [
      { name: "PTQ", full: "Post-Training Quantization", desc: "Fastest method. Compress an already trained model without retraining. Often uses calibration data to adjust scaling factors." },
      { name: "QAT", full: "Quantization-Aware Training", desc: "Simulates lower precision during the actual training process. Takes longer but yields the highest accuracy for low bit-widths (e.g., 4-bit)." },
      { name: "GPTQ", full: "Accurate PTQ for Generative PT", desc: "A popular PTQ method specifically optimized for LLMs. Processes weights column by column to minimize output error. Great for GPU inference." },
      { name: "AWQ", full: "Activation-aware Weight Quantization", desc: "Observes activations (data flowing through) to identify the 1% most salient weights, keeping them at FP16 while quantizing the rest to INT4." }
    ];

    grid.innerHTML = methods.map((m, i) => `
      <div class="method-card ${i===0 ? 'active' : ''}">
        <div class="method-card__type">${m.full}</div>
        <div class="method-card__name">${m.name}</div>
        <div class="method-card__desc">${m.desc}</div>
      </div>
    `).join("");

    // Add interactivity to cards
    const cards = $$(".method-card", grid);
    cards.forEach(c => c.addEventListener("click", () => {
      cards.forEach(cc => cc.classList.remove("active"));
      c.classList.add("active");
    }));
  }

  // ═══════════════ 5. MEMORY CALCULATOR ═══════════════
  function initMemoryCalculator() {
    const container = $("#memory-bars");
    const fitContainer = $("#gpu-fit");
    const btns = $$("#model-size-toggle .prec-btn");

    const gpus = [
      { name: "MacBook Air", vram: 8, mem: 8 },
      { name: "RTX 4070", vram: 12, mem: 12 },
      { name: "MacBook Pro", vram: 18, mem: 18 },
      { name: "RTX 4090", vram: 24, mem: 24 },
      { name: "Mac Studio", vram: 64, mem: 64 },
      { name: "A100", vram: 80, mem: 80 }
    ];

    function render(params) {
      btns.forEach(b => b.classList.toggle("active", b.dataset.params == params));
      
      const p = parseFloat(params); // in billions
      const memVals = [
        { name: "FP32", bytes: 4, class: "fp32" },
        { name: "FP16", bytes: 2, class: "fp16" },
        { name: "INT8", bytes: 1, class: "int8" },
        { name: "INT4", bytes: 0.5, class: "int4" }
      ];

      // Add 20% overhead for context window/KV cache
      const calculateVram = (bytes) => (p * bytes) * 1.2;
      const maxVram = calculateVram(4); // FP32 VRAM for this model

      container.innerHTML = memVals.map(m => {
        const vram = calculateVram(m.bytes);
        const width = Math.max(10, (vram / maxVram) * 100);
        return `
          <div class="mem-row">
            <div class="mem-label">${m.name}</div>
            <div class="mem-track">
              <div class="mem-fill ${m.class}" style="width: ${width}%">${vram.toFixed(1)} GB</div>
            </div>
          </div>
        `;
      }).join("");

      // Update GPU fit section based on INT4 requirement
      const int4Vram = calculateVram(0.5);
      
      fitContainer.innerHTML = gpus.map(g => {
        const fits = g.vram >= int4Vram;
        return `
          <div class="gpu-card ${fits ? 'fits' : 'no-fit'}">
            <div class="gpu-name">${g.name}</div>
            <div class="gpu-vram">${g.vram}GB Unified/VRAM</div>
            <div style="margin-top: 5px;">${fits ? '✅ INT4 Fits' : '❌ Out of Memory'}</div>
          </div>
        `;
      }).join("");
    }

    btns.forEach(b => b.addEventListener("click", () => render(b.dataset.params)));
    render(7); // Default to 7B
  }

  // ═══════════════ 6. QUALITY VS SIZE ═══════════════
  function initTradeoffChart() {
    const container = $("#tradeoff-chart");
    const legend = $("#tradeoff-legend");

    // Mock data: Bits vs Perplexity (lower is better, higher is worse)
    // Base perplexity ~5.0. As bits drop, PPL shoots up.
    const data = [
      { bits: 16, ppl: 5.02, label: "FP16" },
      { bits: 8, ppl: 5.04, label: "INT8" },
      { bits: 6, ppl: 5.08, label: "6-bit" },
      { bits: 5, ppl: 5.15, label: "5-bit" },
      { bits: 4, ppl: 5.30, label: "4-bit (Sweet Spot)" },
      { bits: 3, ppl: 6.20, label: "3-bit" },
      { bits: 2, ppl: 14.50, label: "2-bit (Garbage)" }
    ];

    const maxPpl = 15.0;

    container.innerHTML = data.map(d => {
      // Calculate height inversely (since low PPL is good, we want low bars for good quality)
      // Actually, standard bar charts show higher = more. Let's make the bar represent Perplexity.
      // So high bar = high perplexity = bad.
      const height = (d.ppl / maxPpl) * 100;
      let colorClass = "q-fast"; // green
      if (d.ppl > 5.2 && d.ppl < 6.0) colorClass = "q-good"; // amber
      else if (d.ppl >= 6.0) colorClass = "q-slow"; // red
      
      let colorHex = "var(--green)";
      if (colorClass === "q-good") colorHex = "var(--amber)";
      if (colorClass === "q-slow") colorHex = "var(--red)";

      return `
        <div class="tradeoff-col">
          <div class="tradeoff-bar" style="height: ${height}%; background: ${colorHex};" data-ppl="${d.ppl.toFixed(2)}"></div>
          <div class="tradeoff-label">${d.bits}-bit</div>
        </div>
      `;
    }).join("");

    legend.innerHTML = `
      <span><div class="leg-dot" style="background:var(--green)"></div> Near Lossless (< 5.2 PPL)</span>
      <span><div class="leg-dot" style="background:var(--amber)"></div> Mild Degradation (5.2 - 6.0 PPL)</span>
      <span><div class="leg-dot" style="background:var(--red)"></div> Severe Degradation (> 6.0 PPL)</span>
    `;
  }

  // ═══════════════ 7. REAL WORLD EXAMPLES ═══════════════
  function initRealWorld() {
    const grid = $("#real-world-grid");
    
    const examples = [
      {
        model: "Llama 3 (8B)",
        quant: "Q4_K_M (GGUF)",
        fp16_size: "16 GB",
        quant_size: "4.7 GB",
        hardware: "Runs perfectly on MacBook Air (M1, 8GB RAM)"
      },
      {
        model: "Mixtral 8x7B (MoE)",
        quant: "AWQ 4-bit",
        fp16_size: "94 GB",
        quant_size: "24 GB",
        hardware: "Fits exactly in one RTX 4090 or RTX 3090"
      },
      {
        model: "Llama 3 (70B)",
        quant: "INT8 (bitsandbytes)",
        fp16_size: "140 GB",
        quant_size: "70 GB",
        hardware: "Requires 1x A100 (80GB) instead of 2x A100s"
      }
    ];

    grid.innerHTML = examples.map(e => `
      <div class="rw-card">
        <div class="rw-card__model">${e.model}</div>
        <div class="rw-card__quant">${e.quant}</div>
        <div class="rw-card__details">
          <div class="rw-detail">
            <span class="rw-key">Original (FP16):</span>
            <span class="rw-val">${e.fp16_size}</span>
          </div>
          <div class="rw-detail">
            <span class="rw-key">Quantized:</span>
            <span class="rw-val" style="color:var(--accent-3);">${e.quant_size}</span>
          </div>
        </div>
        <div class="rw-card__hw">${e.hardware}</div>
      </div>
    `).join("");
  }

})();
