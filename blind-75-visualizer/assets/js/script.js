/**
 * Application Controller for Blind 75 Visualizer
 */

document.addEventListener('DOMContentLoaded', () => {
    // State
    const state = {
        category: 'array',
        problemIdx: 0,
        visualizer: null
    };

    // DOM Elements
    const elements = {
        categoryList: document.querySelectorAll('.nav-item'),
        categoryTitle: document.getElementById('category-title'),
        categoryDesc: document.getElementById('category-desc'),
        problemTabs: document.getElementById('problem-tabs'),
        codeBlock: document.getElementById('code-block'),
        btnNext: document.getElementById('btn-next'),
        btnReset: document.getElementById('btn-reset'),
        visualizerTitle: document.getElementById('visualizer-title'),
        visualizerContainer: document.getElementById('visualizer-container'),
        mathDisplay: document.getElementById('math-display'),
        statusMessage: document.getElementById('status-message')
    };

    const categoryDescriptions = {
        'array': 'Core array manipulation and traversal.',
        'binary': 'Bitwise operations and binary representations.',
        'dp': 'Dynamic Programming and memoization.',
        'graph': 'Graph traversal (BFS/DFS) and topological sorting.',
        'interval': 'Merging, inserting, and managing intervals.',
        'linked-list': 'Pointer manipulation and list reversal.',
        'matrix': '2D array traversal and in-place modification.',
        'string': 'String manipulation, palindromes, and anagrams.',
        'tree': 'Tree traversal, BSTs, and Tries.',
        'heap': 'Priority Queues and k-way merging.'
    };

    // Initialize
    function init() {
        attachEventListeners();
        loadCategory(state.category);
    }

    // Attach Listeners
    function attachEventListeners() {
        elements.categoryList.forEach(item => {
            item.addEventListener('click', () => {
                const category = item.dataset.category;
                if (state.category !== category) {
                    elements.categoryList.forEach(el => el.classList.remove('active'));
                    item.classList.add('active');
                    loadCategory(category);
                }
            });
        });

        elements.btnNext.addEventListener('click', () => {
            if (state.visualizer) {
                const isDone = state.visualizer.nextStep();
                if (isDone) {
                    elements.statusMessage.innerHTML = '<span style="color:var(--success)">Finished</span>';
                    elements.btnNext.disabled = true;
                    elements.btnNext.style.opacity = '0.5';
                } else {
                    elements.statusMessage.innerHTML = 'Step ' + state.visualizer.step;
                }
            }
        });

        elements.btnReset.addEventListener('click', () => {
            loadProblem(state.problemIdx);
        });
    }

    // Load Category
    function loadCategory(categoryKey) {
        state.category = categoryKey;
        state.problemIdx = 0; // reset to first problem
        
        // Update header
        const activeNav = document.querySelector(`.nav-item[data-category="${categoryKey}"]`);
        elements.categoryTitle.textContent = activeNav.querySelector('span').textContent;
        elements.categoryDesc.textContent = categoryDescriptions[categoryKey];

        // Render Tabs
        const problems = window.BLIND_75_SNIPPETS[categoryKey] || [];
        elements.problemTabs.innerHTML = '';
        
        problems.forEach((prob, index) => {
            const li = document.createElement('li');
            li.className = `tab-item ${index === 0 ? 'active' : ''}`;
            li.textContent = prob.shortTitle;
            li.addEventListener('click', () => {
                document.querySelectorAll('.tab-item').forEach(el => el.classList.remove('active'));
                li.classList.add('active');
                loadProblem(index);
            });
            elements.problemTabs.appendChild(li);
        });

        if (problems.length > 0) {
            loadProblem(0);
        } else {
            // empty category
            elements.codeBlock.textContent = "// No problems loaded for this category yet.";
            elements.visualizerContainer.innerHTML = "<p>No visualizer available.</p>";
            elements.mathDisplay.innerHTML = "";
            hljs.highlightElement(elements.codeBlock);
        }
    }

    // Load Problem
    function loadProblem(index) {
        state.problemIdx = index;
        const problems = window.BLIND_75_SNIPPETS[state.category];
        if (!problems || !problems[index]) return;

        const problem = problems[index];

        // Update Code Side
        elements.codeBlock.textContent = problem.snippet;
        hljs.highlightElement(elements.codeBlock);
        const highlight = document.getElementById('code-highlight');
        if (highlight) highlight.style.display = 'none';

        // Reset UI Context
        elements.statusMessage.innerHTML = 'Ready to start.';
        elements.btnNext.disabled = false;
        elements.btnNext.style.opacity = '1';
        elements.visualizerTitle.textContent = problem.shortTitle;

        // Initialize Visualizer via Factory
        if (window.getVisualizer) {
            state.visualizer = window.getVisualizer(
                state.category, 
                index, 
                elements.visualizerContainer, 
                elements.mathDisplay,
                problem.shortTitle
            );
        }
    }

    init();
});
