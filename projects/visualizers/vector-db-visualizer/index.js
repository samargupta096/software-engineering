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

});
