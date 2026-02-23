/* ═══════════════════════════════════════════════════════════
   LLM Generation Parameters — Interactive Visualizer (JS)
   ═══════════════════════════════════════════════════════════ */

;(() => {
  "use strict";

  /* ───────────── SAMPLE DATA ───────────── */
  const SAMPLE_TOKENS = [
    "The","capital","of","France","is","Paris",".","It","is","known",
    "for","the","Eiffel","Tower",",","fine","cuisine",",","art",
    "museums","like","the","Louvre",",","and","its","rich","cultural",
    "heritage",".","Millions","of","tourists","visit","each","year",
    "to","explore","its","beautiful","streets","and","vibrant",
    "neighborhoods",".","The","Seine","River","flows","through",
    "the","heart","of","the","city",",","offering","stunning","views","."
  ];

  const TOKEN_CANDIDATES = [
    { label: "Paris",   baseProb: 0.42 },
    { label: "London",  baseProb: 0.18 },
    { label: "Berlin",  baseProb: 0.12 },
    { label: "Madrid",  baseProb: 0.09 },
    { label: "Rome",    baseProb: 0.07 },
    { label: "Vienna",  baseProb: 0.05 },
    { label: "Lisbon",  baseProb: 0.04 },
    { label: "Prague",  baseProb: 0.02 },
    { label: "Oslo",    baseProb: 0.008 },
    { label: "Tallinn", baseProb: 0.002 },
  ];

  const FREQ_SENTENCE_WORDS = [
    { w: "The", count: 3 },
    { w: "cat",  count: 2 },
    { w: "sat",  count: 2 },
    { w: "on",   count: 1 },
    { w: "the",  count: 3 },
    { w: "mat",  count: 2 },
    { w: "by",   count: 1 },
    { w: "the",  count: 3 },
    { w: "door", count: 1 },
  ];

  const PRES_TOPICS = [
    { topic: "weather", present: true },
    { topic: "sports",  present: true },
    { topic: "food",    present: false },
    { topic: "travel",  present: false },
    { topic: "music",   present: false },
    { topic: "movies",  present: true },
    { topic: "science", present: false },
    { topic: "books",   present: false },
  ];

  const STOP_SENTENCE = "The capital of India is Delhi. It is a bustling metropolis. The city has rich history.";

  /* ───────────── HELPERS ───────────── */
  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];

  function softmax(logits, temperature) {
    const t = Math.max(temperature, 0.01);
    const scaled = logits.map(l => l / t);
    const maxL = Math.max(...scaled);
    const exps = scaled.map(s => Math.exp(s - maxL));
    const sum = exps.reduce((a, b) => a + b, 0);
    return exps.map(e => e / sum);
  }

  /* ═══════════════ SCROLL REVEAL ═══════════════ */
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add("visible");
      }
    });
  }, { threshold: 0.12 });

  document.addEventListener("DOMContentLoaded", () => {
    $$(".param-section__inner").forEach(el => observer.observe(el));
    initMaxTokens();
    initTemperature();
    initTopP();
    initTopK();
    initFrequency();
    initPresence();
    initStop();
  });

  /* ═══════════════ 1. max_tokens ═══════════════ */
  function initMaxTokens() {
    const slider = $("#slider-max-tokens");
    const valEl  = $("#val-max-tokens");
    const stream = $("#token-stream");

    function render(maxT) {
      valEl.textContent = maxT;
      stream.innerHTML = "";
      SAMPLE_TOKENS.forEach((tok, i) => {
        const chip = document.createElement("span");
        chip.className = "token-chip";
        chip.textContent = tok;
        if (i < maxT) {
          chip.classList.add("active");
        } else {
          chip.classList.add("cut");
        }
        chip.style.animationDelay = `${i * 20}ms`;
        stream.appendChild(chip);
      });
    }

    slider.addEventListener("input", () => render(+slider.value));
    render(+slider.value);
  }

  /* ═══════════════ 2. temperature ═══════════════ */
  function initTemperature() {
    const slider = $("#slider-temperature");
    const valEl  = $("#val-temperature");
    const container = $("#temp-bars");

    // Convert base probs to logits (inverse softmax at T=1)
    const baseLogits = TOKEN_CANDIDATES.map(c => Math.log(c.baseProb + 1e-9));

    function render(temp) {
      valEl.textContent = temp.toFixed(2);
      const probs = softmax(baseLogits, temp);
      const maxProb = Math.max(...probs);

      container.innerHTML = "";
      TOKEN_CANDIDATES.forEach((c, i) => {
        const col = document.createElement("div");
        col.className = "bar-col";

        const bar = document.createElement("div");
        bar.className = "bar";
        const heightPct = (probs[i] / maxProb) * 150;
        bar.style.height = `${heightPct}px`;
        bar.setAttribute("data-prob", `${(probs[i] * 100).toFixed(1)}%`);

        const label = document.createElement("span");
        label.className = "bar-label";
        label.textContent = c.label;

        col.appendChild(bar);
        col.appendChild(label);
        container.appendChild(col);
      });
    }

    slider.addEventListener("input", () => render(+slider.value / 100));
    render(+slider.value / 100);
  }

  /* ═══════════════ 3. top_p ═══════════════ */
  function initTopP() {
    const slider = $("#slider-top-p");
    const valEl  = $("#val-top-p");
    const container = $("#topp-bars");

    function render(topP) {
      valEl.textContent = topP.toFixed(2);

      // Use base probs sorted descending
      const sorted = [...TOKEN_CANDIDATES].sort((a, b) => b.baseProb - a.baseProb);
      const maxProb = sorted[0].baseProb;

      let cumulative = 0;
      const nucleusIndices = new Set();
      for (let i = 0; i < sorted.length; i++) {
        if (cumulative < topP) {
          nucleusIndices.add(i);
          cumulative += sorted[i].baseProb;
        }
      }

      container.innerHTML = "";
      sorted.forEach((c, i) => {
        const col = document.createElement("div");
        col.className = "bar-col";
        if (nucleusIndices.has(i)) col.classList.add("in-nucleus");

        const bar = document.createElement("div");
        bar.className = "bar";
        bar.style.height = `${(c.baseProb / maxProb) * 150}px`;
        bar.setAttribute("data-prob", `${(c.baseProb * 100).toFixed(1)}%`);

        const label = document.createElement("span");
        label.className = "bar-label";
        label.textContent = c.label;

        col.appendChild(bar);
        col.appendChild(label);
        container.appendChild(col);
      });
    }

    slider.addEventListener("input", () => render(+slider.value / 100));
    render(+slider.value / 100);
  }

  /* ═══════════════ 4. top_k ═══════════════ */
  function initTopK() {
    const slider = $("#slider-top-k");
    const valEl  = $("#val-top-k");
    const container = $("#topk-bars");

    function render(k) {
      valEl.textContent = k;
      const sorted = [...TOKEN_CANDIDATES].sort((a, b) => b.baseProb - a.baseProb);
      const maxProb = sorted[0].baseProb;

      container.innerHTML = "";
      sorted.forEach((c, i) => {
        const col = document.createElement("div");
        col.className = "bar-col";
        if (i < k) col.classList.add("in-topk");

        const bar = document.createElement("div");
        bar.className = "bar";
        bar.style.height = `${(c.baseProb / maxProb) * 150}px`;
        bar.setAttribute("data-prob", `${(c.baseProb * 100).toFixed(1)}%`);

        const label = document.createElement("span");
        label.className = "bar-label";
        label.textContent = c.label;

        col.appendChild(bar);
        col.appendChild(label);
        container.appendChild(col);
      });
    }

    slider.addEventListener("input", () => render(+slider.value));
    render(+slider.value);
  }

  /* ═══════════════ 5. frequency_penalty ═══════════════ */
  function initFrequency() {
    const slider = $("#slider-freq");
    const valEl  = $("#val-freq");
    const container = $("#freq-demo");

    function render(penalty) {
      valEl.textContent = penalty.toFixed(2);
      container.innerHTML = "";

      // Label
      const lbl = document.createElement("div");
      lbl.className = "penalty-label";
      lbl.textContent = penalty > 0
        ? "⬇ Tokens that appear more often get penalized more"
        : penalty < 0
        ? "⬆ Tokens that appear more often get boosted"
        : "— No penalty applied";
      container.appendChild(lbl);

      // Sentence
      const row = document.createElement("div");
      row.className = "sentence-row";
      FREQ_SENTENCE_WORDS.forEach((item) => {
        const tag = document.createElement("span");
        tag.className = "word-tag";
        tag.innerHTML = `${item.w} <span class="count">×${item.count}</span>`;

        if (penalty > 0 && item.count > 1) {
          const intensity = Math.min(1, (penalty / 2) * (item.count / 3));
          tag.classList.add("penalized");
          tag.style.opacity = 1 - intensity * 0.4;
        } else if (penalty < 0 && item.count > 1) {
          tag.classList.add("boosted");
        }
        row.appendChild(tag);
      });
      container.appendChild(row);

      // Explanation
      const exp = document.createElement("div");
      exp.className = "penalty-label";
      exp.style.marginTop = "12px";
      if (penalty > 0) {
        exp.textContent = `Words with high frequency (×2, ×3) receive stronger penalty → model avoids repeating "the", "cat", "sat", "mat"`;
      } else if (penalty < 0) {
        exp.textContent = `Negative penalty encourages repetition → repeated words become even more likely`;
      } else {
        exp.textContent = `All tokens treated equally regardless of how often they appeared`;
      }
      container.appendChild(exp);
    }

    slider.addEventListener("input", () => render(+slider.value / 100));
    render(+slider.value / 100);
  }

  /* ═══════════════ 6. presence_penalty ═══════════════ */
  function initPresence() {
    const slider = $("#slider-pres");
    const valEl  = $("#val-pres");
    const container = $("#pres-demo");

    function render(penalty) {
      valEl.textContent = penalty.toFixed(2);
      container.innerHTML = "";

      const lbl = document.createElement("div");
      lbl.className = "penalty-label";
      lbl.textContent = penalty > 0
        ? "⬇ Already-mentioned topics penalized · ⬆ New topics encouraged"
        : penalty < 0
        ? "⬆ Already-mentioned topics encouraged · ⬇ New topics suppressed"
        : "— No presence penalty applied";
      container.appendChild(lbl);

      const row = document.createElement("div");
      row.className = "sentence-row";
      PRES_TOPICS.forEach((item) => {
        const tag = document.createElement("span");
        tag.className = "word-tag";
        tag.innerHTML = `${item.topic} ${item.present ? '<span class="count">seen</span>' : '<span class="count">new</span>'}`;

        if (penalty > 0) {
          if (item.present) {
            tag.classList.add("penalized");
            tag.style.opacity = 1 - Math.min(0.5, penalty / 4);
          } else {
            tag.classList.add("new-topic");
          }
        } else if (penalty < 0) {
          if (item.present) {
            tag.classList.add("boosted");
          } else {
            tag.classList.add("penalized");
            tag.style.opacity = 1 - Math.min(0.5, Math.abs(penalty) / 4);
          }
        }
        row.appendChild(tag);
      });
      container.appendChild(row);

      const exp = document.createElement("div");
      exp.className = "penalty-label";
      exp.style.marginTop = "12px";
      if (penalty > 0) {
        exp.textContent = `Presence = binary. If a topic appeared at all, it's penalized equally regardless of frequency`;
      } else if (penalty < 0) {
        exp.textContent = `Negative presence penalty makes the model stick to already-discussed topics`;
      } else {
        exp.textContent = `All topics treated equally regardless of prior presence`;
      }
      container.appendChild(exp);
    }

    slider.addEventListener("input", () => render(+slider.value / 100));
    render(+slider.value / 100);
  }

  /* ═══════════════ 7. stop ═══════════════ */
  function initStop() {
    const input = $("#input-stop");
    const btn   = $("#btn-stop-run");
    const container = $("#stop-demo");

    function render() {
      const stops = input.value.split(",").map(s => s.trim()).filter(Boolean);
      container.innerHTML = "";

      const words = STOP_SENTENCE.split(/(\s+)/);
      let stopped = false;
      let stopIdx = -1;

      words.forEach((w, i) => {
        if (!w.trim()) {
          // whitespace node
          container.appendChild(document.createTextNode(" "));
          return;
        }

        const span = document.createElement("span");
        span.className = "stop-word";
        span.textContent = w;

        if (stopped) {
          span.classList.add("after-stop");
        } else {
          // Check if this word contains a stop sequence
          const hasStop = stops.some(s => w.includes(s));
          if (hasStop) {
            span.classList.add("stopped");
            stopped = true;
            stopIdx = i;
          } else {
            span.classList.add("normal");
          }
        }

        container.appendChild(span);
      });

      if (!stopped) {
        const cursor = document.createElement("span");
        cursor.className = "stop-cursor";
        container.appendChild(cursor);
      }
    }

    btn.addEventListener("click", render);
    input.addEventListener("keydown", e => { if (e.key === "Enter") render(); });
    render();
  }

})();
