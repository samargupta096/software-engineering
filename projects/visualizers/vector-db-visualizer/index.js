document.addEventListener('DOMContentLoaded', () => {

    // ═══════════════ 1. EMBEDDINGS ═══════════════
    const embeddingInput = document.getElementById('embedding-input');
    const btnAddWord = document.getElementById('btn-add-word');
    const btnClearWords = document.getElementById('btn-clear-words');
    const embeddingsPlot = document.getElementById('embeddings-plot');

    // Pseudo-embeddings for demo purposes
    const mockEmbeddings = {
        'king': {x: 80, y: 80},
        'queen': {x: 85, y: 75},
        'man': {x: 70, y: 50},
        'woman': {x: 75, y: 45},
        'apple': {x: 20, y: 20},
        'banana': {x: 25, y: 15},
        'computer': {x: 20, y: 80},
        'laptop': {x: 25, y: 85},
        'dog': {x: 50, y: 20},
        'cat': {x: 55, y: 25}
    };

    function plotWord(word) {
        if(!word) return;
        word = word.toLowerCase().trim();
        
        let coords;
        if (mockEmbeddings[word]) {
            coords = mockEmbeddings[word];
        } else {
            // Random coordinates for unknown words
            coords = {
                x: 10 + Math.random() * 80,
                y: 10 + Math.random() * 80
            };
        }

        const point = document.createElement('div');
        point.className = 'data-point';
        point.style.left = `${coords.x}%`;
        point.style.top = `${100 - coords.y}%`;

        const label = document.createElement('div');
        label.className = 'data-label';
        label.innerText = word;
        
        point.appendChild(label);
        embeddingsPlot.appendChild(point);
    }

    btnAddWord.addEventListener('click', () => {
        plotWord(embeddingInput.value);
        embeddingInput.value = '';
    });
    
    embeddingInput.addEventListener('keypress', (e) => {
        if(e.key === 'Enter') {
            plotWord(embeddingInput.value);
            embeddingInput.value = '';
        }
    });

    btnClearWords.addEventListener('click', () => {
        embeddingsPlot.innerHTML = '';
    });

    // Initial plots
    ['king', 'queen', 'apple', 'computer'].forEach(plotWord);


    // ═══════════════ 2. DISTANCE METRICS ═══════════════
    const metricBtns = document.querySelectorAll('#metric-toggle .strategy-btn');
    let currentMetric = 'cosine';
    
    const vecALine = document.getElementById('vec-a-line');
    const vecBLine = document.getElementById('vec-b-line');
    const calcBox = document.getElementById('metric-calculation');

    // Simple vectors for demo
    let vA = {x: 80, y: 20}; // Display coords (y is flipped in SVG)
    let vB = {x: 40, y: 70};

    function calculateMetrics() {
        // Convert SVG coords to Cartesian (0,0 at bottom left)
        const A = {x: vA.x, y: 100 - vA.y};
        const B = {x: vB.x, y: 100 - vB.y};

        const dotProduct = (A.x * B.x) + (A.y * B.y);
        const magA = Math.sqrt(A.x*A.x + A.y*A.y);
        const magB = Math.sqrt(B.x*B.x + B.y*B.y);
        const cosine = dotProduct / (magA * magB);
        
        const dx = A.x - B.x;
        const dy = A.y - B.y;
        const euclidean = Math.sqrt(dx*dx + dy*dy);

        let html = '';
        if (currentMetric === 'cosine') {
            html = `
                <div><strong>Cosine Similarity</strong></div>
                <div style="margin-top: 0.5rem; color: #a0aabf;">Formula: (A · B) / (||A|| ||B||)</div>
                <div style="margin-top: 0.5rem;">Dot Product: ${dotProduct.toFixed(2)}</div>
                <div>||A||: ${magA.toFixed(2)}, ||B||: ${magB.toFixed(2)}</div>
                <div style="margin-top: 1rem; font-size: 1.2rem; color: var(--accent-cyan);">Similarity: ${cosine.toFixed(4)}</div>
            `;
        } else if (currentMetric === 'euclidean') {
            html = `
                <div><strong>Euclidean Distance (L2)</strong></div>
                <div style="margin-top: 0.5rem; color: #a0aabf;">Formula: √((x2-x1)² + (y2-y1)²)</div>
                <div style="margin-top: 0.5rem;">dx: ${Math.abs(dx).toFixed(2)}, dy: ${Math.abs(dy).toFixed(2)}</div>
                <div style="margin-top: 1rem; font-size: 1.2rem; color: var(--accent-cyan);">Distance: ${euclidean.toFixed(2)}</div>
            `;
        } else {
            html = `
                <div><strong>Dot Product</strong></div>
                <div style="margin-top: 0.5rem; color: #a0aabf;">Formula: (x1*x2) + (y1*y2)</div>
                <div style="margin-top: 0.5rem;">(${A.x.toFixed(1)} * ${B.x.toFixed(1)}) + (${A.y.toFixed(1)} * ${B.y.toFixed(1)})</div>
                <div style="margin-top: 1rem; font-size: 1.2rem; color: var(--accent-cyan);">Result: ${dotProduct.toFixed(2)}</div>
            `;
        }
        calcBox.innerHTML = html;
    }

    metricBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            metricBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentMetric = btn.dataset.metric;
            calculateMetrics();
        });
    });

    calculateMetrics(); // Initial calc

    // ═══════════════ 3. KNN VS ANN ═══════════════
    const btnKnn = document.getElementById('btn-run-knn');
    const btnAnn = document.getElementById('btn-run-ann');
    const simContainer = document.getElementById('search-sim');

    function createSimPoints() {
        simContainer.innerHTML = '';
        for(let i=0; i<100; i++) {
            const pt = document.createElement('div');
            pt.className = 'data-point';
            pt.style.width = '6px';
            pt.style.height = '6px';
            pt.style.left = `${Math.random()*100}%`;
            pt.style.top = `${Math.random()*100}%`;
            pt.style.background = '#334155';
            pt.style.boxShadow = 'none';
            simContainer.appendChild(pt);
        }
        // Target point
        const target = document.createElement('div');
        target.className = 'data-point';
        target.style.left = '50%'; target.style.top = '50%';
        target.style.background = 'var(--accent-amber)';
        target.style.boxShadow = '0 0 10px var(--accent-amber)';
        simContainer.appendChild(target);
    }

    createSimPoints();

    btnKnn.addEventListener('click', async () => {
        btnKnn.disabled = true; btnAnn.disabled = true;
        createSimPoints();
        const points = simContainer.querySelectorAll('.data-point');
        
        for(let i=0; i<points.length - 1; i++) {
            points[i].style.background = 'var(--accent-red)';
            await new Promise(r => setTimeout(r, 20));
            points[i].style.background = '#334155';
        }
        // Highlight closest (mock)
        points[42].style.background = 'var(--accent-cyan)';
        points[42].style.boxShadow = '0 0 10px var(--accent-cyan)';
        
        btnKnn.disabled = false; btnAnn.disabled = false;
    });

    btnAnn.addEventListener('click', async () => {
        btnKnn.disabled = true; btnAnn.disabled = true;
        createSimPoints();
        const points = simContainer.querySelectorAll('.data-point');
        
        // Skip most, only check a cluster
        for(let i=40; i<50; i++) {
            points[i].style.background = 'var(--accent-blue)';
            await new Promise(r => setTimeout(r, 50));
            points[i].style.background = '#334155';
        }
        points[42].style.background = 'var(--accent-cyan)';
        points[42].style.boxShadow = '0 0 10px var(--accent-cyan)';
        
        btnKnn.disabled = false; btnAnn.disabled = false;
    });


    // ═══════════════ 4. HNSW ═══════════════
    const btnHnsw = document.getElementById('btn-hnsw-search');
    const hnswContainer = document.getElementById('hnsw-layers');
    
    function buildHnsw() {
        hnswContainer.innerHTML = '';
        hnswContainer.innerHTML = `
            <div style="position: absolute; top: 10%; width: 100%; text-align: center; color: #a0aabf;">Layer 2 (Sparse)</div>
            <div style="position: absolute; top: 40%; width: 100%; text-align: center; color: #a0aabf;">Layer 1 (Medium)</div>
            <div style="position: absolute; top: 70%; width: 100%; text-align: center; color: #a0aabf;">Layer 0 (Dense - All Nodes)</div>
        `;

        // Nodes
        const l2 = [{x: 20, y: 15}, {x: 80, y: 15}];
        const l1 = [{x: 20, y: 45}, {x: 50, y: 45}, {x: 80, y: 45}];
        const l0 = [{x: 10, y: 75}, {x: 30, y: 75}, {x: 50, y: 75}, {x: 70, y: 75}, {x: 90, y: 75}];

        [l2, l1, l0].forEach((layer, li) => {
            layer.forEach((pos, i) => {
                const pt = document.createElement('div');
                pt.className = 'data-point hnsw-node';
                pt.id = `hnsw-l${2-li}-n${i}`;
                pt.style.left = `${pos.x}%`;
                pt.style.top = `${pos.y}%`;
                pt.style.background = '#334155';
                pt.style.boxShadow = 'none';
                hnswContainer.appendChild(pt);
            });
        });
    }

    buildHnsw();

    btnHnsw.addEventListener('click', async () => {
        btnHnsw.disabled = true;
        buildHnsw();
        
        const path = [
            'hnsw-l2-n0', 'hnsw-l2-n1', // Check top layer
            'hnsw-l1-n2', 'hnsw-l1-n1', // Drop to L1
            'hnsw-l0-n2' // Drop to L0 (Target)
        ];

        for(let id of path) {
            const el = document.getElementById(id);
            if(el) {
                el.style.background = 'var(--accent-amber)';
                el.style.boxShadow = '0 0 10px var(--accent-amber)';
                await new Promise(r => setTimeout(r, 600));
            }
        }
        const final = document.getElementById('hnsw-l0-n2');
        final.style.background = 'var(--accent-cyan)';
        final.style.boxShadow = '0 0 15px var(--accent-cyan)';

        btnHnsw.disabled = false;
    });


    // ═══════════════ 6. RAG FLOW ═══════════════
    const btnRag = document.getElementById('btn-trigger-rag');
    const ragQuery = document.getElementById('rag-query');
    const ragLogs = document.getElementById('rag-logs');
    
    const stages = [
        { id: 'rag-user', log: 'User submits query.' },
        { id: 'rag-embed', log: 'Text chunk sent to Embedding Model (e.g. text-embedding-3-small). Received vector: [0.012, -0.045, ...]' },
        { id: 'rag-vdb', log: 'Performing ANN Search (Cosine Similarity) in Vector DB. Found 3 matching documents.' },
        { id: 'rag-prompt', log: 'Injecting retrieved documents into LLM Prompt Context.' },
        { id: 'rag-llm', log: 'LLM generated response based on context: "The Q3 revenue was $1.2M."' }
    ];

    btnRag.addEventListener('click', async () => {
        if(!ragQuery.value) return;
        btnRag.disabled = true;
        
        // Reset
        document.querySelectorAll('.flow-stage').forEach(el => el.classList.remove('active'));
        ragLogs.innerHTML = '';

        for(let stage of stages) {
            const el = document.getElementById(stage.id);
            el.classList.add('active');
            
            const logEntry = document.createElement('div');
            logEntry.className = 'log-entry';
            const time = new Date().toISOString().split('T')[1].substring(0, 8);
            logEntry.innerHTML = `<span style="color:var(--accent-blue)">[${time}]</span> ${stage.log}`;
            ragLogs.appendChild(logEntry);
            ragLogs.scrollTop = ragLogs.scrollHeight;

            await new Promise(r => setTimeout(r, 1000));
            el.classList.remove('active');
        }
        
        btnRag.disabled = false;
    });


    // ═══════════════ 7. SEMANTIC SEARCH ═══════════════
    const btnSemantic = document.getElementById('btn-semantic-search');
    const semanticQueryInput = document.getElementById('semantic-query');
    const keywordResults = document.getElementById('keyword-results');
    const semanticResults = document.getElementById('semantic-results');

    const productCatalog = [
        { title: 'MacBook Air M3 - Lightweight Laptop', desc: 'Ultra-thin notebook, perfect for college and daily productivity.', keywords: ['macbook', 'laptop', 'lightweight', 'air', 'm3', 'notebook'] },
        { title: 'Budget Chromebook 14"', desc: 'Affordable computing for students and web browsing.', keywords: ['budget', 'chromebook', 'affordable', 'students'] },
        { title: 'Dell XPS 13 - Compact Ultrabook', desc: 'Premium thin-and-light with stunning display for professionals.', keywords: ['dell', 'xps', 'compact', 'ultrabook', 'premium'] },
        { title: 'Gaming Desktop RTX 4090', desc: 'High-performance tower for gaming and content creation.', keywords: ['gaming', 'desktop', 'rtx', 'performance', 'tower'] },
        { title: 'iPad Air with Keyboard', desc: 'Portable tablet with keyboard accessory for note-taking in class.', keywords: ['ipad', 'tablet', 'keyboard', 'portable'] },
        { title: 'ThinkPad X1 Carbon', desc: 'Business laptop built for reliability and all-day battery life.', keywords: ['thinkpad', 'business', 'laptop', 'battery', 'carbon'] },
        { title: 'Ergonomic Running Shoes', desc: 'Comfortable footwear with arch support for daily runs.', keywords: ['shoes', 'running', 'ergonomic', 'footwear', 'comfortable'] },
        { title: 'Standing Desk Converter', desc: 'Adjustable desk riser for healthier work posture.', keywords: ['desk', 'standing', 'adjustable', 'ergonomic', 'work'] },
    ];

    // Semantic similarity mock: measures conceptual closeness
    const semanticGroups = {
        'laptop': ['macbook', 'notebook', 'ultrabook', 'chromebook', 'thinkpad', 'computer', 'portable', 'lightweight'],
        'affordable': ['budget', 'cheap', 'inexpensive', 'low-cost', 'value', 'economical'],
        'student': ['college', 'school', 'class', 'education', 'note-taking', 'study', 'students'],
        'comfortable': ['ergonomic', 'comfy', 'cozy', 'supportive', 'cushioned'],
        'shoes': ['footwear', 'sneakers', 'running', 'boots'],
        'work': ['business', 'professional', 'productivity', 'office'],
    };

    function semanticScore(query, item) {
        const qWords = query.toLowerCase().split(/\s+/);
        let score = 0;
        const allText = (item.title + ' ' + item.desc).toLowerCase();

        for (const qw of qWords) {
            if (allText.includes(qw)) score += 0.3;
            // Check semantic groups
            for (const [groupKey, synonyms] of Object.entries(semanticGroups)) {
                const groupAll = [groupKey, ...synonyms];
                if (groupAll.includes(qw)) {
                    for (const syn of groupAll) {
                        if (allText.includes(syn)) { score += 0.2; break; }
                    }
                }
            }
        }
        return Math.min(score, 1.0);
    }

    function keywordScore(query, item) {
        const qWords = query.toLowerCase().split(/\s+/);
        let matches = 0;
        const allText = (item.title + ' ' + item.desc).toLowerCase();
        for (const w of qWords) {
            if (allText.includes(w)) matches++;
        }
        return qWords.length > 0 ? matches / qWords.length : 0;
    }

    function renderResultItem(item, score, type) {
        const scoreClass = score > 0.6 ? 'high' : score > 0.3 ? 'medium' : 'low';
        return `<div class="result-item" style="animation-delay:${Math.random()*0.2}s">
            <div class="result-item__title">${item.title}</div>
            <span class="result-item__score ${scoreClass}">${(score * 100).toFixed(0)}% match</span>
            <div class="result-item__desc">${item.desc}</div>
        </div>`;
    }

    btnSemantic.addEventListener('click', () => {
        const q = semanticQueryInput.value.trim();
        if (!q) return;

        // Keyword search
        const kResults = productCatalog.map(p => ({ ...p, score: keywordScore(q, p) }))
            .filter(p => p.score > 0).sort((a,b) => b.score - a.score);
        keywordResults.innerHTML = kResults.length > 0
            ? kResults.map(r => renderResultItem(r, r.score, 'keyword')).join('')
            : '<div class="no-match">❌ No keyword matches found</div>';

        // Semantic search
        const sResults = productCatalog.map(p => ({ ...p, score: semanticScore(q, p) }))
            .filter(p => p.score > 0).sort((a,b) => b.score - a.score);
        semanticResults.innerHTML = sResults.length > 0
            ? sResults.map(r => renderResultItem(r, r.score, 'semantic')).join('')
            : '<div class="no-match">No results</div>';
    });

    semanticQueryInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') btnSemantic.click();
    });


    // ═══════════════ 8. DOCUMENT CHUNKING ═══════════════
    const chunkToggle = document.querySelectorAll('#chunk-toggle .strategy-btn');
    const chunkSizeSlider = document.getElementById('chunk-size-slider');
    const chunkOverlapSlider = document.getElementById('chunk-overlap-slider');
    const chunkSizeVal = document.getElementById('chunk-size-val');
    const chunkOverlapVal = document.getElementById('chunk-overlap-val');
    const chunkDemo = document.getElementById('chunk-demo');
    const chunkStatsEl = document.getElementById('chunk-stats');

    let chunkStrategy = 'fixed';

    const sampleDoc = `Vector databases are a specialized type of database designed to store, index, and query high-dimensional vector data efficiently. Unlike traditional databases that handle scalar data types like numbers and strings, vector databases work with vectors—arrays of numbers that represent data in a multi-dimensional space.

The core idea is that similar items are mapped to nearby points in this vector space. This is achieved through machine learning models called embedding models, which convert raw data (text, images, audio) into dense numerical representations.

When a user performs a query, the query itself is converted into a vector using the same embedding model. The vector database then performs an Approximate Nearest Neighbor (ANN) search to find the stored vectors closest to the query vector. This is fundamentally different from keyword-based search.

Popular ANN algorithms include HNSW (Hierarchical Navigable Small World), IVF (Inverted File Index), and Product Quantization. HNSW is the most widely adopted due to its excellent balance of speed and recall accuracy.

Real-world applications include semantic search engines, recommendation systems, RAG pipelines for LLMs, anomaly detection in cybersecurity, and drug discovery in bioinformatics. Companies like Spotify, Netflix, and Google use vector search at massive scale.`;

    const chunkColors = [
        'rgba(59,130,246,0.25)', 'rgba(6,182,212,0.25)', 'rgba(139,92,246,0.25)',
        'rgba(16,185,129,0.25)', 'rgba(245,158,11,0.25)', 'rgba(239,68,68,0.25)',
        'rgba(168,85,247,0.25)', 'rgba(34,211,238,0.25)', 'rgba(251,191,36,0.25)'
    ];

    function chunkText() {
        const size = parseInt(chunkSizeSlider.value);
        const overlap = parseInt(chunkOverlapSlider.value);
        let chunks = [];

        if (chunkStrategy === 'fixed') {
            const step = Math.max(size - overlap, 1);
            for (let i = 0; i < sampleDoc.length; i += step) {
                chunks.push(sampleDoc.slice(i, i + size));
            }
        } else if (chunkStrategy === 'sentence') {
            chunks = sampleDoc.match(/[^.!?]+[.!?]+/g) || [sampleDoc];
        } else if (chunkStrategy === 'paragraph') {
            chunks = sampleDoc.split(/\n\n+/).filter(p => p.trim());
        } else { // semantic
            // Simulate semantic chunking by splitting at topic changes
            const paragraphs = sampleDoc.split(/\n\n+/).filter(p => p.trim());
            chunks = paragraphs; // Semantic ≈ paragraph in this demo
        }

        // Render
        let html = '';
        let charIdx = 0;
        chunks.forEach((chunk, i) => {
            const color = chunkColors[i % chunkColors.length];
            const start = sampleDoc.indexOf(chunk, charIdx);
            if (start > charIdx) {
                // Gap text (overlap region or unmatched)
            }
            html += `<span class="chunk" style="background:${color}" title="Chunk ${i+1} (${chunk.length} chars)">${escapeHtml(chunk)}</span>`;
            if (i < chunks.length - 1) html += '<span class="chunk-boundary"></span>';
            charIdx = start + chunk.length;
        });
        chunkDemo.innerHTML = html;

        // Stats
        const avgLen = chunks.reduce((s, c) => s + c.length, 0) / chunks.length;
        chunkStatsEl.innerHTML = `
            <div class="chunk-stat"><span class="chunk-stat__value">${chunks.length}</span><span class="chunk-stat__label">Total Chunks</span></div>
            <div class="chunk-stat"><span class="chunk-stat__value">${Math.round(avgLen)}</span><span class="chunk-stat__label">Avg Chunk Size (chars)</span></div>
            <div class="chunk-stat"><span class="chunk-stat__value">${overlap}</span><span class="chunk-stat__label">Overlap (chars)</span></div>
            <div class="chunk-stat"><span class="chunk-stat__value">${chunkStrategy}</span><span class="chunk-stat__label">Strategy</span></div>
        `;
    }

    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    chunkToggle.forEach(btn => {
        btn.addEventListener('click', () => {
            chunkToggle.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            chunkStrategy = btn.dataset.strategy;
            chunkText();
        });
    });
    chunkSizeSlider.addEventListener('input', () => { chunkSizeVal.textContent = chunkSizeSlider.value + ' chars'; chunkText(); });
    chunkOverlapSlider.addEventListener('input', () => { chunkOverlapVal.textContent = chunkOverlapSlider.value + ' chars'; chunkText(); });
    chunkText();


    // ═══════════════ 9. RECOMMENDATIONS ═══════════════
    const btnRecommend = document.getElementById('btn-recommend');
    const movieSelect = document.getElementById('movie-select');
    const recoContainer = document.getElementById('reco-container');

    const movieDB = {
        inception:     { title: 'Inception', genre: 'Sci-Fi, Thriller', emoji: '🌀', vec: [0.9, 0.8, 0.1, 0.2, 0.7] },
        titanic:       { title: 'Titanic', genre: 'Romance, Drama', emoji: '🚢', vec: [0.1, 0.2, 0.9, 0.8, 0.1] },
        avengers:      { title: 'Avengers', genre: 'Action, Superhero', emoji: '🦸', vec: [0.8, 0.9, 0.1, 0.3, 0.6] },
        notebook:      { title: 'The Notebook', genre: 'Romance', emoji: '💌', vec: [0.1, 0.1, 0.95, 0.9, 0.05] },
        interstellar:  { title: 'Interstellar', genre: 'Sci-Fi, Space', emoji: '🚀', vec: [0.95, 0.7, 0.15, 0.1, 0.8] },
        godfather:     { title: 'The Godfather', genre: 'Crime, Drama', emoji: '🎩', vec: [0.3, 0.5, 0.6, 0.7, 0.2] },
        // Extra movies for reco results
        matrix:        { title: 'The Matrix', genre: 'Sci-Fi, Action', emoji: '🕶️', vec: [0.85, 0.85, 0.1, 0.15, 0.75] },
        pride:         { title: 'Pride & Prejudice', genre: 'Romance, Period', emoji: '🌹', vec: [0.05, 0.1, 0.9, 0.85, 0.1] },
        darkKnight:    { title: 'The Dark Knight', genre: 'Action, Thriller', emoji: '🦇', vec: [0.75, 0.9, 0.15, 0.25, 0.6] },
        arrival:       { title: 'Arrival', genre: 'Sci-Fi, Drama', emoji: '👽', vec: [0.8, 0.5, 0.3, 0.2, 0.85] },
        lalaland:      { title: 'La La Land', genre: 'Romance, Musical', emoji: '🎶', vec: [0.15, 0.2, 0.85, 0.75, 0.15] },
        goodfellas:    { title: 'Goodfellas', genre: 'Crime, Drama', emoji: '🔫', vec: [0.35, 0.55, 0.55, 0.65, 0.25] },
    };

    function cosineSim(a, b) {
        let dot = 0, magA = 0, magB = 0;
        for (let i = 0; i < a.length; i++) {
            dot += a[i] * b[i];
            magA += a[i] * a[i];
            magB += b[i] * b[i];
        }
        return dot / (Math.sqrt(magA) * Math.sqrt(magB));
    }

    btnRecommend.addEventListener('click', () => {
        const selectedKey = movieSelect.value;
        const source = movieDB[selectedKey];

        const results = Object.entries(movieDB)
            .filter(([k]) => k !== selectedKey)
            .map(([k, m]) => ({ ...m, key: k, sim: cosineSim(source.vec, m.vec) }))
            .sort((a, b) => b.sim - a.sim)
            .slice(0, 5);

        recoContainer.innerHTML = `
            <div class="reco-card source">
                <div class="reco-card__emoji">${source.emoji}</div>
                <div class="reco-card__title">${source.title}</div>
                <div class="reco-card__genre">${source.genre}</div>
                <div class="reco-card__score">⭐ Selected</div>
            </div>
            ${results.map((m, i) => `
                <div class="reco-card" style="animation-delay: ${(i+1)*0.1}s">
                    <div class="reco-card__emoji">${m.emoji}</div>
                    <div class="reco-card__title">${m.title}</div>
                    <div class="reco-card__genre">${m.genre}</div>
                    <div class="reco-card__score">${(m.sim * 100).toFixed(1)}% similar</div>
                </div>
            `).join('')}
        `;
    });


    // ═══════════════ 10. CHATBOT MEMORY ═══════════════
    const btnChatSend = document.getElementById('btn-chat-send');
    const chatInput = document.getElementById('chat-input');
    const chatMessages = document.getElementById('chat-messages');
    const memoryEntries = document.getElementById('memory-entries');

    const vectorMemory = []; // Stores {text, vector}
    let memoryInitialized = false;

    function pseudoEmbed(text) {
        // Create a deterministic pseudo-vector from text
        let hash = 0;
        for (let i = 0; i < text.length; i++) hash = ((hash << 5) - hash) + text.charCodeAt(i);
        const v = [];
        for (let i = 0; i < 4; i++) {
            v.push(parseFloat(((Math.sin(hash * (i+1)) + 1) / 2).toFixed(3)));
        }
        return v;
    }

    function simpleWordOverlap(a, b) {
        const wordsA = new Set(a.toLowerCase().split(/\s+/));
        const wordsB = new Set(b.toLowerCase().split(/\s+/));
        let overlap = 0;
        wordsA.forEach(w => { if (wordsB.has(w)) overlap++; });
        return overlap / Math.max(wordsA.size, wordsB.size);
    }

    function addMessage(text, type, retrievedFrom) {
        const msg = document.createElement('div');
        msg.className = `chat-msg ${type}`;
        let bubbleContent = '';
        if (retrievedFrom) {
            bubbleContent = `<div class="retrieved-tag">📎 Retrieved from memory</div>`;
        }
        bubbleContent += text;
        msg.innerHTML = `
            <div class="chat-msg__avatar">${type === 'user' ? '👤' : '🤖'}</div>
            <div class="chat-msg__bubble">${bubbleContent}</div>
        `;
        chatMessages.appendChild(msg);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    function updateMemoryPanel() {
        if (vectorMemory.length === 0) {
            memoryEntries.innerHTML = '<div style="color: var(--text-secondary); font-size: 0.85rem;">No memories stored yet.</div>';
            return;
        }
        memoryEntries.innerHTML = vectorMemory.map((m, i) => `
            <div class="memory-entry" id="mem-${i}">
                <span class="memory-entry__vector">[${m.vector.join(', ')}]</span>
                <span class="memory-entry__text">${m.text.substring(0, 60)}${m.text.length > 60 ? '...' : ''}</span>
            </div>
        `).join('');
    }

    const botResponses = [
        "Got it! I've stored that in my vector memory. 🧠",
        "Interesting! I'll remember that. The embedding has been saved.",
        "Noted! I embedded your message and stored the vector for later retrieval.",
        "That's been added to my long-term vector memory store!",
        "Stored! I can now recall this information using similarity search.",
    ];

    btnChatSend.addEventListener('click', () => {
        const text = chatInput.value.trim();
        if (!text) return;
        chatInput.value = '';

        addMessage(text, 'user');

        // Store in vector memory
        const vec = pseudoEmbed(text);
        vectorMemory.push({ text, vector: vec });

        // Check if any past memory is relevant
        let retrieved = null;
        if (vectorMemory.length > 1) {
            let bestScore = 0, bestIdx = -1;
            for (let i = 0; i < vectorMemory.length - 1; i++) {
                const score = simpleWordOverlap(text, vectorMemory[i].text);
                if (score > bestScore && score > 0.2) {
                    bestScore = score;
                    bestIdx = i;
                }
            }
            if (bestIdx >= 0) {
                retrieved = vectorMemory[bestIdx];
                // Highlight in memory panel
                setTimeout(() => {
                    const el = document.getElementById(`mem-${bestIdx}`);
                    if (el) el.classList.add('highlighted');
                }, 100);
            }
        }

        // Bot response
        setTimeout(() => {
            if (retrieved) {
                addMessage(
                    `I found a related memory: "<em>${retrieved.text.substring(0, 80)}...</em>"<br><br>` +
                    `This was retrieved via cosine similarity on the vector store. I can use this as context for a better answer!`,
                    'bot', true
                );
            } else {
                const reply = botResponses[vectorMemory.length % botResponses.length];
                addMessage(reply, 'bot');
            }
            updateMemoryPanel();
        }, 600);
    });

    chatInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') btnChatSend.click();
    });

});
