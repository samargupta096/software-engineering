/**
 * This file contains the logic for visualizing each pattern and problem.
 */

class VisualizerBase {
    constructor(container, mathDisplay) {
        this.container = container;
        this.mathDisplay = mathDisplay;
        this.step = 0;
        this.isDone = false;
        container.innerHTML = '';
        mathDisplay.innerHTML = '';
    }

    createArray(nums, containerId = 'default-array') {
        let wrapper = this.container.querySelector(`#${containerId}`);
        if (!wrapper) {
            wrapper = document.createElement('div');
            wrapper.className = 'array-container';
            wrapper.id = containerId;
            this.container.appendChild(wrapper);
        } else {
            wrapper.innerHTML = ''; // clear
        }
        
        nums.forEach((num, i) => {
            const cellWrapper = document.createElement('div');
            cellWrapper.className = 'array-cell-wrapper';
            
            const indexLabel = document.createElement('div');
            indexLabel.className = 'array-index';
            indexLabel.textContent = i;
            
            const cell = document.createElement('div');
            cell.className = 'array-cell';
            cell.id = `${containerId}-cell-${i}`;
            cell.textContent = typeof num === 'object' ? JSON.stringify(num) : num;
            if (typeof num === 'object') cell.style.fontSize = '1rem'; // smaller for arrays
            
            cellWrapper.appendChild(indexLabel);
            cellWrapper.appendChild(cell);
            wrapper.appendChild(cellWrapper);
        });
        
        return wrapper;
    }

    createLabelValue(label, value, id) {
        let el = this.container.querySelector(`#${id}`);
        if (!el) {
            el = document.createElement('div');
            el.id = id;
            el.style.padding = '10px';
            el.style.fontSize = '1.2rem';
            el.style.color = 'var(--text-primary)';
            el.style.background = 'rgba(0,0,0,0.2)';
            el.style.borderRadius = '8px';
            el.style.marginBottom = '10px';
            this.container.appendChild(el);
        }
        el.innerHTML = `<strong>${label}:</strong> <span>${value}</span>`;
    }

    createPointer(id, label, position, isTop = false, type = 'ptr-left', containerId = 'default-array') {
        const ptr = document.createElement('div');
        ptr.id = id;
        ptr.className = `pointer ${type} ${isTop ? 'top' : ''}`;
        ptr.innerHTML = `
            ${isTop ? '' : '<i class="fas fa-arrow-up"></i>'}
            <span>${label}</span>
            ${isTop ? '<i class="fas fa-arrow-down"></i>' : ''}
        `;
        ptr.style.left = `${position * 68 + 20}px`;
        if (isTop) {
            ptr.style.top = '-30px';
            ptr.style.bottom = 'auto';
        }
        const arrContainer = this.container.querySelector(`#${containerId}`);
        if (arrContainer) {
            // Remove existing pointer with same id
            const existing = arrContainer.querySelector(`#${id}`);
            if (existing) existing.remove();
            arrContainer.appendChild(ptr);
        }
        return ptr;
    }

    movePointer(id, position) {
        const ptr = document.getElementById(id);
        if (ptr) {
            ptr.style.left = `${position * 68 + 20}px`;
        }
    }

    highlightCells(start, end, className = 'in-window', containerId = 'default-array') {
        const wrapper = this.container.querySelector(`#${containerId}`);
        if (!wrapper) return;
        wrapper.querySelectorAll('.array-cell').forEach(cell => {
            cell.classList.remove(className);
        });
        for (let i = start; i <= end; i++) {
            const cell = document.getElementById(`${containerId}-cell-${i}`);
            if (cell) cell.classList.add(className);
        }
    }

    updateMath(html) {
        this.mathDisplay.innerHTML = html;
    }

    highlightCodeLine(lineNumber) {
        const highlight = document.getElementById('code-highlight');
        if (highlight) {
            highlight.style.display = 'block';
            highlight.style.top = `${(lineNumber - 1) * 21}px`; // approx 21px per line
        }
    }
}

class GenericSlidingWindowVisualizer extends VisualizerBase {
    constructor(container, mathDisplay, nums, k, targetLine) {
        super(container, mathDisplay);
        this.nums = nums || [2, 1, 5, 1, 3, 2];
        this.k = k || 3;
        this.targetLine = targetLine || 15;
        this.maxSum = 0;
        this.windowSum = 0;
        this.right = 0;
        
        this.createArray(this.nums);
        this.windowEl = document.createElement('div');
        this.windowEl.className = 'window-highlight';
        this.windowEl.style.width = '0px';
        this.windowEl.style.left = '20px';
        this.container.querySelector('.array-container').appendChild(this.windowEl);
        
        this.updateMath(`<span>Window Size/Target = ${this.k}</span> | <span>Sum = 0</span>`);
    }
    
    nextStep() {
        if (this.isDone) return true;

        if (this.step < this.k) {
            this.windowSum += this.nums[this.step];
            this.windowEl.style.width = `${(this.step + 1) * 68 - 8}px`; 
            this.highlightCells(0, this.step);
            this.updateMath(`<span>Adding nums[${this.step}]</span> | <span>Sum = ${this.windowSum}</span>`);
            this.step++;
            if (this.step === this.k) {
                this.maxSum = this.windowSum;
                setTimeout(() => this.updateMath(`<span>Initial Window Built</span> | <span>Max = ${this.maxSum}</span>`), 800);
            }
        } else if (this.right < this.nums.length - this.k) {
            let rightIdx = this.k + this.right;
            let leftIdx = this.right;
            
            this.windowSum += this.nums[rightIdx] - this.nums[leftIdx];
            this.maxSum = Math.max(this.maxSum, this.windowSum);
            
            this.windowEl.style.left = `${(leftIdx + 1) * 68 + 20}px`;
            this.highlightCells(leftIdx + 1, rightIdx);
            
            this.updateMath(
                `<span>Slide window</span> ` +
                `| <span>Current Sum = ${this.windowSum}</span> ` +
                `| <span><strong style="color:var(--success)">Max = ${this.maxSum}</strong></span>`
            );
            
            this.highlightCodeLine(this.targetLine);
            this.right++;
        } else {
            this.isDone = true;
            this.updateMath(`<span><i class="fas fa-check-circle" style="color:var(--success)"></i> Finished! Final result = ${this.maxSum}</span>`);
            return true;
        }
        return false;
    }
}

class GenericTwoPointersVisualizer extends VisualizerBase {
    constructor(container, mathDisplay, nums, target, targetLine) {
        super(container, mathDisplay);
        this.nums = nums || [1, 2, 3, 4, 6];
        this.target = target || 6;
        this.targetLine = targetLine || 7;
        this.left = 0;
        this.right = this.nums.length - 1;
        
        this.createArray(this.nums);
        this.createPointer('ptr-l', 'L', this.left, false, 'ptr-left');
        this.createPointer('ptr-r', 'R', this.right, false, 'ptr-right');
        
        this.updateMath(`<span>Target = ${this.target}</span>`);
    }

    nextStep() {
        if (this.isDone) return true;
        if (this.left < this.right) {
            let sum = this.nums[this.left] + this.nums[this.right];
            
            this.highlightCells(this.left, this.left, 'active');
            const rightCell = document.getElementById(`default-array-cell-${this.right}`);
            if (rightCell) rightCell.classList.add('active');

            this.updateMath(`<span>Check: ${this.nums[this.left]} + ${this.nums[this.right]} = ${sum}</span> | <span>Target = ${this.target}</span>`);
            this.highlightCodeLine(this.targetLine);

            setTimeout(() => {
                if (sum === this.target) {
                    this.updateMath(`<span><i class="fas fa-check-circle" style="color:var(--success)"></i> Found target!</span>`);
                    this.isDone = true;
                } else if (sum < this.target) {
                    this.updateMath(`<span>${sum} &lt; ${this.target} -> L++</span>`);
                    this.left++;
                    this.movePointer('ptr-l', this.left);
                } else {
                    this.updateMath(`<span>${sum} &gt; ${this.target} -> R--</span>`);
                    this.right--;
                    this.movePointer('ptr-r', this.right);
                }
            }, 800);
        } else {
            this.isDone = true;
            this.updateMath(`<span>Target not found.</span>`);
        }
        return false;
    }
}

class FastSlowPointersVisualizer extends VisualizerBase {
    constructor(container, mathDisplay, nums) {
        super(container, mathDisplay);
        this.nums = nums || [1, 2, 3, 4, 5, 2]; // cycle at 2
        this.slow = 0;
        this.fast = 0;
        this.createArray(this.nums);
        this.createPointer('ptr-slow', 'Slow', this.slow, false, 'ptr-left');
        this.createPointer('ptr-fast', 'Fast', this.fast, true, 'ptr-right');
        this.updateMath(`<span>Slow steps 1, Fast steps 2</span>`);
        this.highlightCodeLine(7);
    }

    nextStep() {
        if (this.isDone) return true;
        
        this.slow = (this.slow + 1) % this.nums.length;
        this.fast = (this.fast + 2) % this.nums.length;
        
        this.movePointer('ptr-slow', this.slow);
        this.movePointer('ptr-fast', this.fast);
        
        this.updateMath(`<span>Slow at [${this.slow}], Fast at [${this.fast}]</span>`);
        this.highlightCodeLine(12);

        if (this.slow === this.fast) {
            setTimeout(() => {
                this.updateMath(`<span><i class="fas fa-check-circle" style="color:var(--success)"></i> Cycle Detected! Slow == Fast</span>`);
                this.highlightCodeLine(17);
                this.isDone = true;
            }, 800);
        }
        return false;
    }
}

class MergeIntervalsVisualizer extends VisualizerBase {
    constructor(container, mathDisplay, intervals) {
        super(container, mathDisplay);
        this.intervals = intervals || [[1,3], [2,6], [8,10], [15,18]];
        this.merged = [this.intervals[0]];
        this.idx = 1;
        this.createLabelValue("Intervals", JSON.stringify(this.intervals), "orig-intervals");
        this.createLabelValue("Merged", JSON.stringify(this.merged), "merged-intervals");
        this.updateMath(`<span>Initializing with first interval ${JSON.stringify(this.merged[0])}</span>`);
        this.highlightCodeLine(6);
    }
    
    nextStep() {
        if (this.isDone) return true;
        if (this.idx < this.intervals.length) {
            let current = this.merged[this.merged.length - 1];
            let next = this.intervals[this.idx];
            
            let html = `<span>Compare ${JSON.stringify(current)} with ${JSON.stringify(next)}</span>`;
            
            if (current[1] >= next[0]) {
                current[1] = Math.max(current[1], next[1]);
                html += ` -> <b>Merge!</b>`;
                this.highlightCodeLine(14);
            } else {
                this.merged.push([...next]);
                html += ` -> <b>Disjoint, Add!</b>`;
                this.highlightCodeLine(17);
            }
            this.createLabelValue("Merged", JSON.stringify(this.merged), "merged-intervals");
            this.updateMath(html);
            this.idx++;
        } else {
            this.isDone = true;
            this.updateMath(`<span><i class="fas fa-check-circle" style="color:var(--success)"></i> All intervals processed.</span>`);
        }
        return false;
    }
}

class CyclicSortVisualizer extends VisualizerBase {
    constructor(container, mathDisplay, nums) {
        super(container, mathDisplay);
        this.nums = nums || [3, 1, 5, 4, 2];
        this.i = 0;
        this.createArray(this.nums);
        this.createPointer('ptr-i', 'i', this.i, false, 'ptr-left');
        this.updateMath(`<span>Place number at (num - 1) index.</span>`);
        this.highlightCodeLine(3);
    }
    
    nextStep() {
        if (this.isDone) return true;
        if (this.i < this.nums.length) {
            let j = this.nums[this.i] - 1;
            
            if (this.nums[this.i] < this.nums.length && this.nums[this.i] !== this.nums[j]) {
                // Swap
                this.updateMath(`<span>Swap nums[${this.i}] (${this.nums[this.i]}) with nums[${j}] (${this.nums[j]})</span>`);
                let temp = this.nums[this.i];
                this.nums[this.i] = this.nums[j];
                this.nums[j] = temp;
                this.createArray(this.nums); // refresh array
                this.createPointer('ptr-i', 'i', this.i, false, 'ptr-left');
                this.highlightCodeLine(6);
            } else {
                this.updateMath(`<span>nums[${this.i}] is correct. Next! i++</span>`);
                this.i++;
                this.movePointer('ptr-i', this.i);
                this.highlightCodeLine(8);
            }
        } else {
            this.isDone = true;
            this.updateMath(`<span><i class="fas fa-check-circle" style="color:var(--success)"></i> Sorted!</span>`);
        }
        return false;
    }
}

class LinkedListReversalVisualizer extends VisualizerBase {
    constructor(container, mathDisplay, nums) {
        super(container, mathDisplay);
        this.nums = nums || [1, 2, 3, 4, 5];
        this.curr = 0;
        this.createArray(this.nums);
        this.createPointer('ptr-prev', 'prev', -1, true, 'ptr-left');
        this.createPointer('ptr-curr', 'curr', this.curr, false, 'ptr-right');
        this.updateMath(`<span>Initialize prev=null, curr=head</span>`);
        this.highlightCodeLine(6);
    }

    nextStep() {
        if (this.isDone) return true;
        if (this.curr < this.nums.length) {
            this.updateMath(`<span>Reverse link at ${this.nums[this.curr]}.</span>`);
            this.curr++;
            this.createPointer('ptr-prev', 'prev', this.curr - 1, true, 'ptr-left');
            if (this.curr < this.nums.length) {
                this.createPointer('ptr-curr', 'curr', this.curr, false, 'ptr-right');
            } else {
                const ptr = document.getElementById('ptr-curr');
                if (ptr) ptr.remove();
            }
            this.highlightCodeLine(10);
        } else {
            this.isDone = true;
            this.updateMath(`<span><i class="fas fa-check-circle" style="color:var(--success)"></i> Reversed!</span>`);
        }
        return false;
    }
}

class TreeVisualizer extends VisualizerBase {
    constructor(container, mathDisplay, traversalName) {
        super(container, mathDisplay);
        this.treeNodes = [1, 2, 3, 4, 5, 6, 7]; // Level order representation
        this.idx = 0;
        this.traversalName = traversalName;
        this.createLabelValue("Tree (Level Order)", JSON.stringify(this.treeNodes), "tree-arr");
        this.createLabelValue("Visited", "[]", "visited-arr");
        this.visited = [];
        this.updateMath(`<span>Starting ${this.traversalName} Traversal</span>`);
    }

    nextStep() {
        if (this.isDone) return true;
        if (this.idx < this.treeNodes.length) {
            this.visited.push(this.treeNodes[this.idx]);
            this.createLabelValue("Visited", JSON.stringify(this.visited), "visited-arr");
            this.updateMath(`<span>Visiting node ${this.treeNodes[this.idx]}</span>`);
            this.highlightCodeLine(14);
            this.idx++;
        } else {
            this.isDone = true;
            this.updateMath(`<span><i class="fas fa-check-circle" style="color:var(--success)"></i> Traversal Complete!</span>`);
        }
        return false;
    }
}

class TwoHeapsVisualizer extends VisualizerBase {
    constructor(container, mathDisplay) {
        super(container, mathDisplay);
        this.nums = [3, 1, 5, 4];
        this.idx = 0;
        this.maxHeap = [];
        this.minHeap = [];
        this.createLabelValue("Stream", JSON.stringify(this.nums), "stream-arr");
        this.createLabelValue("MaxHeap (Lower)", "[]", "max-heap");
        this.createLabelValue("MinHeap (Upper)", "[]", "min-heap");
        this.updateMath(`<span>Ready to process stream.</span>`);
    }

    nextStep() {
        if (this.isDone) return true;
        if (this.idx < this.nums.length) {
            let num = this.nums[this.idx];
            this.maxHeap.push(num);
            this.maxHeap.sort((a,b) => b-a);
            
            this.minHeap.push(this.maxHeap.shift());
            this.minHeap.sort((a,b) => a-b);
            
            if (this.maxHeap.length < this.minHeap.length) {
                this.maxHeap.push(this.minHeap.shift());
                this.maxHeap.sort((a,b) => b-a);
            }
            
            this.createLabelValue("MaxHeap (Lower)", JSON.stringify(this.maxHeap), "max-heap");
            this.createLabelValue("MinHeap (Upper)", JSON.stringify(this.minHeap), "min-heap");
            
            let median = this.maxHeap.length > this.minHeap.length ? this.maxHeap[0] : (this.maxHeap[0] + this.minHeap[0]) / 2.0;
            this.updateMath(`<span>Inserted ${num}. Median is ${median}</span>`);
            this.highlightCodeLine(12);
            this.idx++;
        } else {
            this.isDone = true;
            this.updateMath(`<span><i class="fas fa-check-circle" style="color:var(--success)"></i> All numbers processed!</span>`);
        }
        return false;
    }
}

class SubsetsVisualizer extends VisualizerBase {
    constructor(container, mathDisplay) {
        super(container, mathDisplay);
        this.nums = [1, 2, 3];
        this.subsets = [[]];
        this.idx = 0;
        this.createLabelValue("Input", JSON.stringify(this.nums), "input-arr");
        this.createLabelValue("Subsets generated", JSON.stringify(this.subsets), "subsets-arr");
        this.updateMath(`<span>Start with empty subset [].</span>`);
    }

    nextStep() {
        if (this.isDone) return true;
        if (this.idx < this.nums.length) {
            let num = this.nums[this.idx];
            let n = this.subsets.length;
            for (let i = 0; i < n; i++) {
                let set = [...this.subsets[i]];
                set.push(num);
                this.subsets.push(set);
            }
            this.createLabelValue("Subsets generated", JSON.stringify(this.subsets), "subsets-arr");
            this.updateMath(`<span>Adding ${num} to existing subsets.</span>`);
            this.highlightCodeLine(5);
            this.idx++;
        } else {
            this.isDone = true;
            this.updateMath(`<span><i class="fas fa-check-circle" style="color:var(--success)"></i> All subsets generated!</span>`);
        }
        return false;
    }
}

// Factory to resolve pattern + problemId into a constructed visualizer
window.getVisualizer = function(patternKey, problemId, container, mathDisplay) {
    let inputArr = [];
    let target = 0;
    
    switch(patternKey) {
        case 'sliding-window':
            if (problemId == 1) { inputArr = [2,1,5,2,3,2]; target = 7; } // Target sum
            else { inputArr = [2, 1, 5, 1, 3, 2]; target = 3; }
            return new GenericSlidingWindowVisualizer(container, mathDisplay, inputArr, target, 13);
            
        case 'two-pointers':
            if (problemId == 1) { inputArr = [2,3,3,3,6,9,9]; target = 0; } // Removing Dupes
            else { inputArr = [1, 2, 3, 4, 6]; target = 6; } // Pair sum
            return new GenericTwoPointersVisualizer(container, mathDisplay, inputArr, target, 8);
            
        case 'fast-slow-pointers':
            return new FastSlowPointersVisualizer(container, mathDisplay);
            
        case 'merge-intervals':
            return new MergeIntervalsVisualizer(container, mathDisplay);
            
        case 'cyclic-sort':
            return new CyclicSortVisualizer(container, mathDisplay);
            
        case 'linked-list-reversal':
            return new LinkedListReversalVisualizer(container, mathDisplay);
            
        case 'tree-bfs':
            return new TreeVisualizer(container, mathDisplay, "BFS Level Order");
            
        case 'tree-dfs':
            return new TreeVisualizer(container, mathDisplay, "DFS PreOrder");
            
        case 'two-heaps':
            return new TwoHeapsVisualizer(container, mathDisplay);
            
        case 'subsets':
            return new SubsetsVisualizer(container, mathDisplay);
            
        default:
            return new VisualizerBase(container, mathDisplay);
    }
};
