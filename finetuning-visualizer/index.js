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
    initLoRA();
    initDecisionMatrix();
  });

  // ═══════════════ 3. LORA MATRIX ═══════════════
  function initLoRA() {
    const slider = $("#slider-rank");
    const valLabel = $("#val-rank");
    const container = $("#lora-demo");
    const statsContainer = $("#lora-stats");

    // Let's assume a base model matrix W of size 4096 x 4096
    const dim = 4096;
    const baseParams = dim * dim; // ~16.7M

    // Slider maps 1-5 to ranks: 4, 8, 16, 32, 64
    const ranks = {
      1: 4,
      2: 8,
      3: 16,
      4: 32,
      5: 64
    };

    function render() {
      const r = ranks[slider.value];
      valLabel.textContent = `r=${r}`;

      const loraParams = (dim * r) + (r * dim); // A + B
      const savingsPct = ((1 - (loraParams / baseParams)) * 100).toFixed(2);

      // Viz width logic
      // W is 160x160.
      // A is dim x r -> 160 x (r * scale). Let scale be 1.5
      // B is r x dim -> (r * scale) x 160.
      const scale = 1.2;
      const rSize = Math.max(8, r * scale);

      container.innerHTML = `
        <div class="matrix-box W" data-dim="${dim}×${dim}">W (Frozen)</div>
        <div class="math-op">+</div>
        <div class="matrix-box A" style="width: ${rSize}px" data-dim="${dim}×${r}">A</div>
        <div class="math-op">×</div>
        <div class="matrix-box B" style="height: ${rSize}px" data-dim="${r}×${dim}">B</div>
      `;

      statsContainer.innerHTML = `
        <div class="lora-stat-item">
          <div class="lora-stat-val" style="color:var(--text-muted); text-decoration:line-through;">${(baseParams/1000000).toFixed(1)}M</div>
          <div class="lora-stat-label">Original Trainable</div>
        </div>
        <div class="lora-stat-item">
          <div class="lora-stat-val" style="color:var(--accent-1);">${(loraParams/1000000).toFixed(2)}M</div>
          <div class="lora-stat-label">LoRA Trainable</div>
        </div>
        <div class="lora-stat-item">
          <div class="lora-stat-val" style="color:var(--green);">${savingsPct}%</div>
          <div class="lora-stat-label">Reduction</div>
        </div>
      `;
    }

    slider.addEventListener("input", render);
    render();
  }

  // ═══════════════ 6. DECISION MATRIX ═══════════════
  function initDecisionMatrix() {
    const btns = $$("#usecase-toggle .prec-btn");
    const resultBox = $("#usecase-result");

    const cases = {
      1: {
        title: "Teach proprietary facts/docs",
        decision: "RAG (Retrieval-Augmented Generation)",
        color: "var(--amber)",
        desc: "Do not fine-tune. LLMs are terrible at memorizing specific facts through training. Instead, put your documents in a Vector Database and inject the relevant text into the prompt at runtime (RAG)."
      },
      2: {
        title: "Output strict JSON schemas",
        decision: "Fine-Tuning (or Constrained Decoding)",
        color: "var(--accent-3)",
        desc: "Fine-tuning is great for teaching form and structure. By showing the model 1,000 examples of valid JSON outputs, it learns the syntax perfectly. You can also use libraries like Outlines for constrained decoding."
      },
      3: {
        title: "Copy a specific writing style",
        decision: "Fine-Tuning",
        color: "var(--green)",
        desc: "Perfect use case for Fine-tuning. You can provide 500 examples of Shakespearean dialogue or your company's tone of voice, and the model will internalize the linguistic style."
      },
      4: {
        title: "Teach a new language",
        decision: "Continued Pre-training / Full Fine-tuning",
        color: "var(--red)",
        desc: "Extremely difficult. LoRA doesn't have enough capacity to learn thousands of new grammar rules and vocabulary. You need Full Fine-tuning or continued Pre-training on billions of tokens in that language."
      }
    };

    function render(caseId) {
      btns.forEach(b => b.classList.toggle("active", b.dataset.case === caseId));
      const c = cases[caseId];

      resultBox.innerHTML = `
        <div style="font-weight:700; color:${c.color}; margin-bottom:8px; font-size:1.3rem;">Use: ${c.decision}</div>
        <div style="color:var(--text-secondary); font-size:0.95rem;">${c.desc}</div>
      `;
      resultBox.style.borderLeft = `4px solid ${c.color}`;
    }

    btns.forEach(b => b.addEventListener("click", () => render(b.dataset.case)));
    render("1");
  }

})();
