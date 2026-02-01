# 📋 DSA Patterns Cheat Sheet for Java

> **Quick Reference Guide — Print-Friendly Version**

---

## 🎯 Pattern Recognition Matrix

| Problem Signals | Primary Pattern | Secondary |
|-----------------|-----------------|-----------|
| "Sorted array" + "Find target" | Binary Search | Two Pointer |
| "Unsorted" + "Find pair/triplet" | HashMap/HashSet | Sorting |
| "Subarray sum" | Prefix Sum + HashMap | Sliding Window |
| "Contiguous subarray" | Sliding Window | Two Pointer |
| "Minimum/Maximum" | DP / Greedy | Heap |
| "Count ways" | DP | Backtracking |
| "All combinations/permutations" | Backtracking | Bit Manipulation |
| "Tree traversal" | DFS/BFS | Stack/Queue |
| "Shortest path (unweighted)" | BFS | - |
| "Shortest path (weighted)" | Dijkstra | Bellman-Ford |
| "Connected components" | Union-Find | DFS/BFS |
| "Task ordering" | Topological Sort | - |
| "k-th largest/smallest" | Heap | Quick Select |
| "Prefix matching" | Trie | - |
| "Intervals overlap" | Sorting + Greedy | Sweep Line |
| "Parentheses matching" | Stack | - |
| "Next greater element" | Monotonic Stack | - |

---

## 📐 Core Algorithms

### Two Pointers

```java
// Opposite ends
int left = 0, right = arr.length - 1;
while (left < right) {
    // Process and move pointers
}

// Same direction (fast-slow)
int slow = 0, fast = 0;
while (fast < arr.length) {
    if (condition) arr[slow++] = arr[fast];
    fast++;
}
```

### Sliding Window

```java
// Fixed size
int sum = 0;
for (int i = 0; i < arr.length; i++) {
    sum += arr[i];
    if (i >= k - 1) {
        result = Math.max(result, sum);
        sum -= arr[i - k + 1];
    }
}

// Variable size
int left = 0, sum = 0;
for (int right = 0; right < arr.length; right++) {
    sum += arr[right];
    while (sum > target) sum -= arr[left++];
    result = Math.max(result, right - left + 1);
}
```

### Binary Search

```java
// Standard
int lo = 0, hi = arr.length - 1;
while (lo <= hi) {
    int mid = lo + (hi - lo) / 2;
    if (arr[mid] == target) return mid;
    else if (arr[mid] < target) lo = mid + 1;
    else hi = mid - 1;
}

// Lower bound (first >= target)
while (lo < hi) {
    int mid = lo + (hi - lo) / 2;
    if (arr[mid] < target) lo = mid + 1;
    else hi = mid;
}
```

### Prefix Sum

```java
int[] prefix = new int[n + 1];
for (int i = 0; i < n; i++) prefix[i + 1] = prefix[i] + arr[i];
// Sum [l, r] = prefix[r + 1] - prefix[l]
```

---

## 🌳 Tree Patterns

### DFS Traversals

```java
void preorder(TreeNode n) { visit(n); preorder(n.left); preorder(n.right); }
void inorder(TreeNode n)  { inorder(n.left); visit(n); inorder(n.right); }
void postorder(TreeNode n){ postorder(n.left); postorder(n.right); visit(n); }
```

### BFS (Level Order)

```java
Queue<TreeNode> q = new LinkedList<>();
q.offer(root);
while (!q.isEmpty()) {
    int size = q.size();
    for (int i = 0; i < size; i++) {
        TreeNode n = q.poll();
        if (n.left != null) q.offer(n.left);
        if (n.right != null) q.offer(n.right);
    }
}
```

---

## 📊 Graph Patterns

### BFS Template

```java
Queue<Integer> q = new LinkedList<>();
Set<Integer> visited = new HashSet<>();
q.offer(start); visited.add(start);
while (!q.isEmpty()) {
    int node = q.poll();
    for (int neighbor : graph.get(node)) {
        if (!visited.contains(neighbor)) {
            visited.add(neighbor);
            q.offer(neighbor);
        }
    }
}
```

### DFS Template

```java
void dfs(int node, Set<Integer> visited) {
    visited.add(node);
    for (int neighbor : graph.get(node)) {
        if (!visited.contains(neighbor)) dfs(neighbor, visited);
    }
}
```

### Dijkstra

```java
PriorityQueue<int[]> pq = new PriorityQueue<>((a,b) -> a[1] - b[1]);
int[] dist = new int[n]; Arrays.fill(dist, INF); dist[src] = 0;
pq.offer(new int[]{src, 0});
while (!pq.isEmpty()) {
    int[] curr = pq.poll();
    if (curr[1] > dist[curr[0]]) continue;
    for (int[] edge : graph.get(curr[0])) {
        if (dist[curr[0]] + edge[1] < dist[edge[0]]) {
            dist[edge[0]] = dist[curr[0]] + edge[1];
            pq.offer(new int[]{edge[0], dist[edge[0]]});
        }
    }
}
```

### Union-Find

```java
int find(int x) { return parent[x] == x ? x : (parent[x] = find(parent[x])); }
boolean union(int x, int y) {
    int px = find(x), py = find(y);
    if (px == py) return false;
    parent[px] = py;
    return true;
}
```

### Topological Sort (Kahn's)

```java
Queue<Integer> q = new LinkedList<>();
for (int i = 0; i < n; i++) if (inDegree[i] == 0) q.offer(i);
while (!q.isEmpty()) {
    int node = q.poll();
    result.add(node);
    for (int next : graph.get(node)) if (--inDegree[next] == 0) q.offer(next);
}
```

---

## 🧩 DP Patterns

### Linear DP

```java
// Fibonacci pattern
int prev2 = 0, prev1 = 1;
for (int i = 2; i <= n; i++) {
    int curr = prev1 + prev2;
    prev2 = prev1; prev1 = curr;
}
```

### Grid DP

```java
for (int i = 0; i < m; i++) {
    for (int j = 0; j < n; j++) {
        dp[i][j] = grid[i][j] + min(dp[i-1][j], dp[i][j-1]);
    }
}
```

### Knapsack

```java
// 0/1 Knapsack (reverse order)
for (int item : items) {
    for (int w = W; w >= item; w--) {
        dp[w] = max(dp[w], dp[w - item] + value);
    }
}

// Unbounded (forward order)
for (int w = 0; w <= W; w++) {
    for (int item : items) {
        if (w >= item) dp[w] = max(dp[w], dp[w - item] + value);
    }
}
```

### LCS

```java
for (int i = 1; i <= m; i++) {
    for (int j = 1; j <= n; j++) {
        if (s1[i-1] == s2[j-1]) dp[i][j] = dp[i-1][j-1] + 1;
        else dp[i][j] = max(dp[i-1][j], dp[i][j-1]);
    }
}
```

---

## 🔙 Backtracking Template

```java
void backtrack(int start, List<Integer> path) {
    if (isComplete(path)) { result.add(new ArrayList<>(path)); return; }
    for (int i = start; i < n; i++) {
        path.add(nums[i]);           // Choose
        backtrack(i + 1, path);      // Explore
        path.remove(path.size()-1);  // Unchoose
    }
}
```

---

## 📚 Stack Patterns

### Monotonic Stack

```java
// Next greater element
Deque<Integer> stack = new ArrayDeque<>();
for (int i = n - 1; i >= 0; i--) {
    while (!stack.isEmpty() && stack.peek() <= arr[i]) stack.pop();
    result[i] = stack.isEmpty() ? -1 : stack.peek();
    stack.push(arr[i]);
}
```

---

## 🔢 Heap Patterns

```java
// Top K (min-heap of size k)
PriorityQueue<Integer> pq = new PriorityQueue<>();
for (int num : nums) {
    pq.offer(num);
    if (pq.size() > k) pq.poll();
}
// pq.peek() = kth largest

// Median (two heaps)
PriorityQueue<Integer> maxH = new PriorityQueue<>(Collections.reverseOrder());
PriorityQueue<Integer> minH = new PriorityQueue<>();
```

---

## 🔤 Trie Template

```java
class Trie {
    Trie[] children = new Trie[26];
    boolean isWord;
    
    void insert(String w) {
        Trie n = this;
        for (char c : w.toCharArray()) {
            if (n.children[c-'a'] == null) n.children[c-'a'] = new Trie();
            n = n.children[c-'a'];
        }
        n.isWord = true;
    }
}
```

---

## ⚡ Java Quick Tips

```java
// Array to List
List<Integer> list = Arrays.stream(arr).boxed().toList();

// List to Array
int[] arr = list.stream().mapToInt(i -> i).toArray();

// Sort with comparator
Arrays.sort(arr, (a, b) -> a[1] - b[1]);  // 2D array by second element

// HashMap frequency count
map.merge(key, 1, Integer::sum);

// Safe mid calculation
int mid = lo + (hi - lo) / 2;

// Initialize array with value
Arrays.fill(arr, value);
```

---

## 📊 Time Complexity Quick Reference

| Operation | ArrayList | LinkedList | HashMap | TreeMap | PriorityQueue |
|-----------|-----------|------------|---------|---------|---------------|
| add | O(1)* | O(1) | O(1) | O(log n) | O(log n) |
| get | O(1) | O(n) | O(1) | O(log n) | O(1)** |
| remove | O(n) | O(1) | O(1) | O(log n) | O(n) |
| contains | O(n) | O(n) | O(1) | O(log n) | O(n) |

\* Amortized, \*\* peek only

---

## 🎯 Interview Checklist

- [ ] Clarify constraints & edge cases
- [ ] Think of brute force first
- [ ] Identify patterns from signals
- [ ] Discuss time/space complexity
- [ ] Write clean, modular code
- [ ] Test with examples
- [ ] Handle edge cases

---

**Good Luck! 🚀**
