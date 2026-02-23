document.addEventListener('DOMContentLoaded', () => {
    // Elements
    const navItems = document.querySelectorAll('.nav-item');
    const problemTabs = document.querySelectorAll('.tab-item');
    const titleEl = document.getElementById('pattern-title');
    const descEl = document.getElementById('pattern-desc');
    const codeBlock = document.getElementById('code-block');
    const visualizerContainer = document.getElementById('visualizer-container');
    const mathDisplay = document.getElementById('math-display');
    const btnNext = document.getElementById('btn-next');
    const btnReset = document.getElementById('btn-reset');
    
    // State
    let currentPattern = 'sliding-window';
    let currentProblemId = 0;
    let visualizerInstance = null;

    // Pattern Metadata
    const patternData = {
        'sliding-window': { title: '1. Sliding Window', desc: 'Maintain a window that satisfies a condition and compute tracking sums/lengths.' },
        'two-pointers': { title: '2. Two Pointers', desc: 'Process two elements per step. Useful for sorted arrays or target sum.' },
        'fast-slow-pointers': { title: '3. Fast & Slow Pointers', desc: 'Move pointers at different speeds to detect cycles or find middle elements.' },
        'merge-intervals': { title: '4. Merge Intervals', desc: 'Sort intervals by start time, and merge overlapping ones using max end times.' },
        'cyclic-sort': { title: '5. Cyclic Sort', desc: 'Place numbers from 1 to N in their correct indices (1 at index 0, 2 at index 1).' },
        'linked-list-reversal': { title: '6. LinkedList Reversal', desc: 'Reverse the links of a linked list in place using prev, curr, and next.' },
        'tree-bfs': { title: '7. Tree BFS', desc: 'Traverse a tree level-by-level using a Queue.' },
        'tree-dfs': { title: '8. Tree DFS', desc: 'Traverse a tree depth-first, often recursively simulating a Stack.' },
        'two-heaps': { title: '9. Two Heaps', desc: 'Use a Max Heap for lower half and Min Heap for upper half to find streams median.' },
        'subsets': { title: '10. Subsets', desc: 'Use backtracking to generate all possible combinations/permutations.' }
    };

    // Initialization
    function initPattern(key) {
        currentPattern = key;
        currentProblemId = 0; // Default to first problem when switching pattern
        
        // Update Sidebar
        navItems.forEach(item => item.classList.remove('active'));
        document.querySelector(`[data-target="${key}"]`).classList.add('active');
        
        // Update Header Text
        titleEl.textContent = patternData[key].title;
        descEl.textContent = patternData[key].desc;
        
        loadProblem(currentProblemId);
    }

    function loadProblem(problemId) {
        currentProblemId = parseInt(problemId);
        
        // Update Tabs UI
        problemTabs.forEach(item => item.classList.remove('active'));
        document.querySelector(`[data-problem="${currentProblemId}"]`).classList.add('active');
        
        const patternProblems = window.PATTERN_SNIPPETS[currentPattern] || [];
        const problemData = patternProblems[currentProblemId] || { shortTitle: `Problem ${currentProblemId + 1}`, snippet: '// Code snippet coming soon...' };
        
        // Update tab names
        problemTabs.forEach((tab, index) => {
            if (patternProblems[index]) {
                tab.textContent = patternProblems[index].shortTitle;
            } else {
                tab.textContent = `Problem ${index + 1}`;
            }
        });

        // Load Snippet
        codeBlock.textContent = problemData.snippet;
        hljs.highlightElement(codeBlock);
        
        // Hide code highlight initially
        const highlight = document.getElementById('code-highlight');
        if (highlight) highlight.style.display = 'none';

        // Load Visualizer
        resetVisualizer();
    }

    function resetVisualizer() {
        if (window.getVisualizer) {
            visualizerInstance = window.getVisualizer(currentPattern, currentProblemId, visualizerContainer, mathDisplay);
        } else {
            visualizerContainer.innerHTML = '<p style="color:var(--text-secondary)">Visualizer not available.</p>';
            mathDisplay.innerHTML = '';
        }
        btnNext.disabled = false;
        btnNext.innerHTML = '<i class="fas fa-step-forward"></i> Next Step';
    }

    // Event Listeners
    navItems.forEach(item => {
        item.addEventListener('click', () => {
            const target = item.getAttribute('data-target');
            if (target !== currentPattern) {
                initPattern(target);
            }
        });
    });

    problemTabs.forEach(item => {
        item.addEventListener('click', () => {
            const targetProblem = item.getAttribute('data-problem');
            if (parseInt(targetProblem) !== currentProblemId) {
                loadProblem(targetProblem);
            }
        });
    });

    btnReset.addEventListener('click', resetVisualizer);

    btnNext.addEventListener('click', () => {
        if (visualizerInstance) {
            const isDone = visualizerInstance.nextStep();
            if (isDone) {
                btnNext.disabled = true;
                btnNext.innerHTML = '<i class="fas fa-check"></i> Completed';
            }
        }
    });

    // Start App
    initPattern(currentPattern);
});
