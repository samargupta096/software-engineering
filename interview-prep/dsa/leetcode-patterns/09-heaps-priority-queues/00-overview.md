[🏠 Home](../../README.md) | [⬅️ Trees](../08-trees/00-overview.md) | [➡️ Graphs](../10-graphs/00-overview.md)

# ⛰️ Heaps & Priority Queues

> Efficient access to min/max elements

---

## 🎯 When to Use

| Clue | Pattern |
|------|---------|
| "K largest/smallest" | Min/Max Heap |
| "Top K frequent" | Heap + HashMap |
| "Continuous median" | Two heaps |
| "Merge K sorted" | Min heap |
| "Schedule tasks" | Priority Queue |

---

## 🔧 Java Heap Basics

```java
// Min Heap (default)
PriorityQueue<Integer> minHeap = new PriorityQueue<>();

// Max Heap
PriorityQueue<Integer> maxHeap = new PriorityQueue<>(Collections.reverseOrder());
// OR
PriorityQueue<Integer> maxHeap = new PriorityQueue<>((a, b) -> b - a);

// Custom comparator
PriorityQueue<int[]> pq = new PriorityQueue<>((a, b) -> a[0] - b[0]);
```

**Operations**:
| Operation | Time |
|-----------|------|
| offer/add | O(log n) |
| poll/remove | O(log n) |
| peek | O(1) |
| size | O(1) |

---

## 💻 Core Problems

### Problem 1: Kth Largest Element

```java
// Use min-heap of size k
public int findKthLargest(int[] nums, int k) {
    PriorityQueue<Integer> minHeap = new PriorityQueue<>();
    
    for (int num : nums) {
        minHeap.offer(num);
        if (minHeap.size() > k) {
            minHeap.poll();  // Remove smallest
        }
    }
    
    return minHeap.peek();  // Kth largest
}
```

**Visualization**:
```
nums = [3,2,1,5,6,4], k = 2

Add 3: heap = [3]
Add 2: heap = [2,3]
Add 1: heap = [1,2,3] → size>k, poll → [2,3]
Add 5: heap = [2,3,5] → poll → [3,5]
Add 6: heap = [3,5,6] → poll → [5,6]
Add 4: heap = [4,5,6] → poll → [5,6]

Answer: 5 (2nd largest)
```

---

### Problem 2: Top K Frequent Elements

```java
public int[] topKFrequent(int[] nums, int k) {
    // Count frequency
    Map<Integer, Integer> freq = new HashMap<>();
    for (int num : nums) {
        freq.put(num, freq.getOrDefault(num, 0) + 1);
    }
    
    // Min heap by frequency
    PriorityQueue<Integer> heap = new PriorityQueue<>(
        (a, b) -> freq.get(a) - freq.get(b)
    );
    
    for (int num : freq.keySet()) {
        heap.offer(num);
        if (heap.size() > k) {
            heap.poll();
        }
    }
    
    int[] result = new int[k];
    for (int i = 0; i < k; i++) {
        result[i] = heap.poll();
    }
    return result;
}
```

**Alternative: Bucket Sort O(n)**:
```java
public int[] topKFrequent(int[] nums, int k) {
    Map<Integer, Integer> freq = new HashMap<>();
    for (int num : nums) freq.merge(num, 1, Integer::sum);
    
    List<Integer>[] buckets = new List[nums.length + 1];
    for (int num : freq.keySet()) {
        int f = freq.get(num);
        if (buckets[f] == null) buckets[f] = new ArrayList<>();
        buckets[f].add(num);
    }
    
    int[] result = new int[k];
    int idx = 0;
    for (int i = buckets.length - 1; i >= 0 && idx < k; i--) {
        if (buckets[i] != null) {
            for (int num : buckets[i]) {
                result[idx++] = num;
                if (idx == k) break;
            }
        }
    }
    return result;
}
```

---

### Problem 3: Find Median from Data Stream (Two Heaps)

```java
class MedianFinder {
    PriorityQueue<Integer> small; // Max heap (left half)
    PriorityQueue<Integer> large; // Min heap (right half)
    
    public MedianFinder() {
        small = new PriorityQueue<>(Collections.reverseOrder());
        large = new PriorityQueue<>();
    }
    
    public void addNum(int num) {
        small.offer(num);
        large.offer(small.poll());  // Balance
        
        if (large.size() > small.size()) {
            small.offer(large.poll());
        }
    }
    
    public double findMedian() {
        if (small.size() > large.size()) {
            return small.peek();
        }
        return (small.peek() + large.peek()) / 2.0;
    }
}
```

**Visualization**:
```
Stream: [2, 3, 4]

Add 2: small=[2], large=[]     → median=2
Add 3: small=[2], large=[3]    → median=2.5
Add 4: small=[3,2], large=[4]  → median=3
```

---

### Problem 4: Merge K Sorted Lists

```java
public ListNode mergeKLists(ListNode[] lists) {
    PriorityQueue<ListNode> heap = new PriorityQueue<>(
        (a, b) -> a.val - b.val
    );
    
    // Add first node of each list
    for (ListNode node : lists) {
        if (node != null) heap.offer(node);
    }
    
    ListNode dummy = new ListNode(0);
    ListNode curr = dummy;
    
    while (!heap.isEmpty()) {
        ListNode node = heap.poll();
        curr.next = node;
        curr = curr.next;
        
        if (node.next != null) {
            heap.offer(node.next);
        }
    }
    
    return dummy.next;
}
```

---

### Problem 5: Task Scheduler

```java
public int leastInterval(char[] tasks, int n) {
    int[] freq = new int[26];
    for (char task : tasks) {
        freq[task - 'A']++;
    }
    
    PriorityQueue<Integer> maxHeap = new PriorityQueue<>(Collections.reverseOrder());
    for (int f : freq) {
        if (f > 0) maxHeap.offer(f);
    }
    
    int time = 0;
    while (!maxHeap.isEmpty()) {
        List<Integer> temp = new ArrayList<>();
        
        // Process n+1 tasks (or idle)
        for (int i = 0; i <= n; i++) {
            if (!maxHeap.isEmpty()) {
                int count = maxHeap.poll() - 1;
                if (count > 0) temp.add(count);
            }
            time++;
            if (maxHeap.isEmpty() && temp.isEmpty()) break;
        }
        
        // Add back remaining tasks
        for (int count : temp) {
            maxHeap.offer(count);
        }
    }
    return time;
}
```

---

## 🧠 Pattern Summary

```
┌─────────────────────────────────────────────────────┐
│                  HEAP PATTERNS                       │
├─────────────────────────────────────────────────────┤
│ K Largest:  Min-heap of size K                      │
│ K Smallest: Max-heap of size K                      │
│                                                      │
│ Median:     Two heaps (max for left, min for right) │
│                                                      │
│ Merge K:    Min-heap with one node from each list   │
│                                                      │
│ Top K Freq: Map frequency + heap by frequency       │
└─────────────────────────────────────────────────────┘
```

---

## 📊 Complexity Summary

| Problem | Time | Space |
|---------|------|-------|
| Kth Largest | O(n log k) | O(k) |
| Top K Frequent | O(n log k) | O(n) |
| Median Stream | O(log n) per add | O(n) |
| Merge K Lists | O(n log k) | O(k) |

---

## 📝 Practice Problems

| # | Problem | Difficulty | Link | Key Insight |
|---|---------|------------|------|-------------|
| 1 | Kth Largest | 🟡 Medium | [LeetCode](https://leetcode.com/problems/kth-largest-element-in-an-array/) | Min heap size k |
| 2 | Last Stone Weight | 🟢 Easy | [LeetCode](https://leetcode.com/problems/last-stone-weight/) | Max heap |
| 3 | K Closest Points | 🟡 Medium | [LeetCode](https://leetcode.com/problems/k-closest-points-to-origin/) | Max heap by distance |
| 4 | Top K Frequent | 🟡 Medium | [LeetCode](https://leetcode.com/problems/top-k-frequent-elements/) | Freq map + heap |
| 5 | Task Scheduler | 🟡 Medium | [LeetCode](https://leetcode.com/problems/task-scheduler/) | Greedy max freq |
| 6 | Find Median | 🔴 Hard | [LeetCode](https://leetcode.com/problems/find-median-from-data-stream/) | Two heaps |
| 7 | Merge K Lists | 🔴 Hard | [LeetCode](https://leetcode.com/problems/merge-k-sorted-lists/) | Min heap |

---

*Next: [Graphs →](../10-graphs/00-overview.md)*
