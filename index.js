document.addEventListener('DOMContentLoaded', () => {
    const visualizerGrid = document.getElementById('visualizerGrid');
    const searchInput = document.getElementById('searchInput');
    const filterBtns = document.querySelectorAll('.filter-btn');
    const emptyState = document.getElementById('emptyState');
    const resetBtn = document.getElementById('resetBtn');

    // Visualizer Data
    const visualizers = [
        {
            id: 'aws-services',
            title: 'AWS Services Visualizer',
            desc: 'Interactive guide to core AWS services (VPC, IAM, S3, ECS) and common architecture patterns.',
            path: './aws-services-visualizer/index.html',
            category: 'cloud',
            tags: ['AWS', 'Cloud', 'Architecture'],
            icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z"></path></svg>`
        },
        {
            id: 'blind-75',
            title: 'Blind 75 Data Structures',
            desc: 'Step-by-step visual breakdowns of the top 75 most common algorithmic interview questions.',
            path: './blind-75-visualizer/index.html',
            category: 'algorithms',
            tags: ['Algorithms', 'LeetCode', 'Python'],
            icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="16 18 22 12 16 6"></polyline><polyline points="8 6 2 12 8 18"></polyline></svg>`
        },
        {
            id: 'db-indexing',
            title: 'Database Indexing',
            desc: 'Learn how B-Trees work under the hood and how to optimize slow SQL queries using indexes.',
            path: './db-indexing-visualizer/index.html',
            category: 'database',
            tags: ['SQL', 'Performance', 'B-Tree'],
            icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><ellipse cx="12" cy="5" rx="9" ry="3"></ellipse><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"></path><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"></path></svg>`
        },
        {
            id: 'design-patterns',
            title: 'Design Patterns',
            desc: 'Interactive UML diagrams and code examples for the top 10 most frequently used GoF patterns.',
            path: './design-patterns-visualizer/index.html',
            category: 'architecture',
            tags: ['Java', 'OOP', 'UML'],
            icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 2 7 12 12 22 7 12 2"></polygon><polyline points="2 17 12 22 22 17"></polyline><polyline points="2 12 12 17 22 12"></polyline></svg>`
        },
        {
            id: 'elasticsearch',
            title: 'Elasticsearch Internals',
            desc: 'Deep dive into inverted indexes, analyzers, clustering, and the ELK stack search engine.',
            path: './elasticsearch-visualizer/index.html',
            category: 'database',
            tags: ['Search', 'NoSQL', 'Lucence'],
            icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line><line x1="11" y1="8" x2="11" y2="14"></line><line x1="8" y1="11" x2="14" y2="11"></line></svg>`
        },
        {
            id: 'internet-networking',
            title: 'Internet & Networking',
            desc: 'Visualizing DNS, TCP/IP, TLS handshakes, routing, and how data travels across the web.',
            path: './internet-networking-visualizer/index.html',
            category: 'architecture',
            tags: ['Networking', 'Protocols', 'Web'],
            icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path></svg>`
        },
        {
            id: 'kafka',
            title: 'Apache Kafka Architecture',
            desc: 'Master message brokers, topics, partitions, consumer groups, and event-driven design.',
            path: './kafka-visualizer/index.html',
            category: 'architecture',
            tags: ['Streaming', 'Events', 'Pub/Sub'],
            icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 22h14a2 2 0 0 0 2-2V7.5L14.5 2H6a2 2 0 0 0-2 2v4"></path><polyline points="14 2 14 8 20 8"></polyline><path d="M2 15h10"></path><path d="m9 18 3-3-3-3"></path></svg>`
        },
        {
            id: 'leetcode-patterns',
            title: 'LeetCode Patterns',
            desc: 'Visualizations of common algorithmic problem-solving patterns (Sliding Window, Two Pointers).',
            path: './leetcode-patterns-visualizer/index.html',
            category: 'algorithms',
            tags: ['Patterns', 'Interviews', 'Arrays'],
            icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m18 16 4-4-4-4"></path><path d="m6 8-4 4 4 4"></path><path d="m14.5 4-5 16"></path></svg>`
        },
        {
            id: 'llm-params',
            title: 'LLM Generation Parameters',
            desc: 'Interactive playground to understand Temperature, Top-P, Top-K, and repetition penalties.',
            path: './llm-parameters-visualizer/index.html',
            category: 'algorithms',
            tags: ['AI', 'LLM', 'GPT'],
            icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2v20"></path><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>`
        },
        {
            id: 'postgres',
            title: 'PostgreSQL Internals',
            desc: 'Explore MVCC, WAL, buffer management, and complex joins in the world\'s most advanced RDBMS.',
            path: './postgres-visualizer/index.html',
            category: 'database',
            tags: ['SQL', 'ACID', 'Relational'],
            icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><ellipse cx="12" cy="5" rx="9" ry="3"></ellipse><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"></path><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"></path></svg>`
        },
        {
            id: 'system-design',
            title: 'System Design Interview',
            desc: 'Interactive components for consistent hashing, rate limiting, and building scalable backends.',
            path: './system-design-prep/index.html',
            category: 'architecture',
            tags: ['Scalability', 'Backend', 'System Design'],
            icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect><line x1="8" y1="21" x2="16" y2="21"></line><line x1="12" y1="17" x2="12" y2="21"></line></svg>`
        }
    ];

    let currentFilter = 'all';
    let searchQuery = '';

    // Function to render cards
    function renderVisualizers() {
        visualizerGrid.innerHTML = '';
        visualizerGrid.classList.remove('loaded');

        const filtered = visualizers.filter(v => {
            const matchesFilter = currentFilter === 'all' || v.category === currentFilter;
            const searchTerm = searchQuery.toLowerCase();
            const matchesSearch = 
                v.title.toLowerCase().includes(searchTerm) || 
                v.desc.toLowerCase().includes(searchTerm) ||
                v.tags.some(tag => tag.toLowerCase().includes(searchTerm));
            
            return matchesFilter && matchesSearch;
        });

        if (filtered.length === 0) {
            emptyState.style.display = 'block';
        } else {
            emptyState.style.display = 'none';
            
            filtered.forEach((vis, index) => {
                const tagsHtml = vis.tags.map(tag => `<span class="tag">${tag}</span>`).join('');
                
                const card = document.createElement('a');
                card.href = vis.path;
                card.className = 'vis-card';
                // Stagger animations based on index
                card.style.animationDelay = `${index * 0.1}s`;
                card.style.animation = 'popIn 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) both';
                
                card.innerHTML = `
                    <div class="card-icon">${vis.icon}</div>
                    <h2 class="card-title">${vis.title}</h2>
                    <p class="card-desc">${vis.desc}</p>
                    <div class="card-tags">
                        ${tagsHtml}
                    </div>
                    <div class="card-arrow">
                        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
                    </div>
                `;
                
                visualizerGrid.appendChild(card);
            });
        }

        // Small delay to allow DOM update before adding loaded class for transition
        setTimeout(() => {
            visualizerGrid.classList.add('loaded');
        }, 50);
    }

    // Event Listeners
    searchInput.addEventListener('input', (e) => {
        searchQuery = e.target.value;
        renderVisualizers();
    });

    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            // Update active state
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            // Update filter
            currentFilter = btn.getAttribute('data-filter');
            renderVisualizers();
        });
    });

    resetBtn.addEventListener('click', () => {
        searchInput.value = '';
        searchQuery = '';
        
        filterBtns.forEach(b => b.classList.remove('active'));
        document.querySelector('.filter-btn[data-filter="all"]').classList.add('active');
        currentFilter = 'all';
        
        renderVisualizers();
    });

    // Initial render
    renderVisualizers();
});
