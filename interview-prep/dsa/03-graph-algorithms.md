# 🌐 Graph Algorithms Mastery for Java Developers

> **Complete Guide to Graph Data Structures and Algorithms**

---

## 📋 Table of Contents

1. [Graph Fundamentals](#graph-fundamentals)
2. [Graph Representations](#graph-representations)
3. [Traversal Algorithms](#traversal-algorithms-bfs--dfs)
4. [Shortest Path Algorithms](#shortest-path-algorithms)
5. [Minimum Spanning Tree](#minimum-spanning-tree)
6. [Topological Sort](#topological-sort)
7. [Union-Find (Disjoint Set)](#union-find-disjoint-set)
8. [Advanced Graph Algorithms](#advanced-graph-algorithms)
9. [Graph Problem Patterns](#graph-problem-patterns)
10. [Top 40 Graph Problems](#-top-40-graph-problems)
11. [🎓 Understanding WHY Graph Algorithms Work - Beginner's Guide](#-understanding-why-graph-algorithms-work---beginners-guide)

---

## 🎓 Understanding WHY Graph Algorithms Work - Beginner's Guide

> **🎯 This section is for beginners!** Before memorizing algorithms, understand WHY they work. This transforms graph problems from scary to intuitive!

---

### 🤔 What is a Graph? The Real-World Intuition

```
A graph is just THINGS connected by RELATIONSHIPS!

Real-world examples:
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                              │
│  Social Network:          Map/GPS:              Internet:                   │
│                                                                              │
│  Alice ─── Bob           City A ──5km── City B   Server1 ─── Router        │
│    │        │              │               │        │           │           │
│  Carol ─── David         City C ──3km── City D   Server2 ─── Server3       │
│                                                                              │
│  Nodes = People          Nodes = Cities          Nodes = Computers         │
│  Edges = Friendships     Edges = Roads           Edges = Connections       │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

### 🔍 BFS vs DFS: The Cave Exploration Analogy

**Imagine you're exploring a cave system:**

```
                    Entrance
                       │
         ┌─────────────┼─────────────┐
         │             │             │
      Room A        Room B        Room C
         │             │
    ┌────┴────┐        │
    │         │        │
 Room D    Room E   Room F
```

**BFS (Breadth-First Search) - "Explore ALL nearby rooms first"**
```
Order: Entrance → A → B → C → D → E → F

Like spreading ripples in a pond:
- First explore ALL rooms 1 step away
- Then explore ALL rooms 2 steps away
- Then 3 steps, 4 steps...
```

**DFS (Depth-First Search) - "Go as DEEP as possible, then backtrack"**
```
Order: Entrance → A → D → (backtrack) → E → (backtrack) → B → F → (backtrack) → C

Like following a single path until you hit a dead end, then backtracking.
```

---

### 💡 WHY BFS Finds Shortest Path (Unweighted Graphs)

**The Key Insight:**
```
BFS explores nodes in order of DISTANCE from the start!

Level 0: Start node
Level 1: All nodes 1 edge away
Level 2: All nodes 2 edges away
...and so on

When BFS reaches a node, it's GUARANTEED to be via the shortest path!
```

**Visual Proof:**
```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    BFS WAVE PROPAGATION                                      │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   Start: A                                                                   │
│                                                                              │
│   Wave 1 (distance=1):     Wave 2 (distance=2):     Wave 3 (distance=3):    │
│                                                                              │
│        A                        A                        A                   │
│       /|\                      /|\                      /|\                  │
│      B C D  ← visited        B C D                    B C D                  │
│                               /   \                   /   \                  │
│                              E     F  ← visited      E     F                 │
│                                                        \                     │
│                                                         G  ← visited         │
│                                                                              │
│   Distance from A to G = 3 (BFS always finds this minimum!)                 │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Why BFS works for shortest path:**
```
When we visit node X at level L:
1. We've already visited ALL nodes at levels 0, 1, ..., L-1
2. If there was a shorter path to X, we would have found X earlier!
3. Therefore, the first time we reach X IS the shortest path!
```

---

### 🎯 WHY Dijkstra Works (Weighted Graphs)

**The Greedy Insight:**
```
Always process the node with the SMALLEST known distance first!

Why? If we pick the closest unprocessed node, no future path through 
other nodes can be shorter (because all edges have non-negative weights).
```

**Step-by-Step Example:**
```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    DIJKSTRA'S ALGORITHM IN ACTION                            │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   Graph:      A ──1── B ──3── D                                             │
│               │       │       │                                              │
│               4       2       1                                              │
│               │       │       │                                              │
│               C ──────5───────┘                                              │
│                                                                              │
│   Find shortest path from A to D                                            │
│                                                                              │
│   Step 1: Start at A, distance[A] = 0                                       │
│           Priority Queue: [(A, 0)]                                          │
│           Update neighbors: B=1, C=4                                        │
│           PQ: [(B,1), (C,4)]                                                │
│                                                                              │
│   Step 2: Process B (smallest distance = 1)                                 │
│           Update neighbors: D=1+3=4, C=min(4, 1+2)=3                        │
│           PQ: [(C,3), (C,4), (D,4)]                                         │
│                                                                              │
│   Step 3: Process C (smallest distance = 3)                                 │
│           Update neighbors: D=min(4, 3+5)=4 (no change)                     │
│           PQ: [(D,4)]                                                       │
│                                                                              │
│   Step 4: Process D (distance = 4).                                        │
│           FOUND! Shortest path A→D = 4 (via A→B→D)                          │
│                                                                              │
│   Path: A → B → D (cost: 1 + 3 = 4)                                         │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Mathematical Proof of Correctness:**
```
Invariant: When we process a node, its distance is FINAL.

Proof by contradiction:
- Suppose we process node X with distance d, but there's a shorter path.
- That shorter path must go through some unprocessed node Y.
- But wait! We always process the node with smallest distance first.
- So distance[Y] ≥ distance[X] (since we chose X, not Y)
- Since edges are non-negative, path through Y ≥ distance[Y] ≥ distance[X]
- Contradiction! Therefore d is the true shortest distance. ∎
```

---

### ⚠️ WHY Dijkstra Fails with Negative Edges

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    DIJKSTRA FAILS WITH NEGATIVE EDGES!                       │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   Graph:      A ──1── B                                                     │
│               │       │                                                      │
│               2      -5   ← NEGATIVE EDGE!                                  │
│               │       │                                                      │
│               └── C ──┘                                                      │
│                                                                              │
│   Dijkstra's logic:                                                          │
│   1. Start at A (distance = 0)                                              │
│   2. Process A: neighbors B=1, C=2                                          │
│   3. Process B (distance = 1) ← MARKED AS FINAL!                            │
│   4. Process C (distance = 2)                                               │
│                                                                              │
│   But wait! Path A→C→B = 2 + (-5) = -3 < 1                                  │
│   Dijkstra gave WRONG answer because it finalized B too early!              │
│                                                                              │
│   Solution: Use Bellman-Ford for negative edges                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

### 🔗 WHY Union-Find is O(α(n)) ≈ O(1)

**The Two Optimizations:**

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    UNION-FIND OPTIMIZATIONS                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  WITHOUT optimization:           WITH path compression:                     │
│                                                                              │
│       A                              A                                       │
│       │                             /|\ \                                    │
│       B                            B C D E                                   │
│       │                                                                      │
│       C                          After finding E, all nodes                  │
│       │                          point directly to root!                     │
│       D                                                                      │
│       │                          find(E) now takes O(1)                      │
│       E                          instead of O(n)                             │
│                                                                              │
│  Height = n (bad!)              Height = 1 (amazing!)                       │
│                                                                              │
│  UNION BY RANK: Always attach smaller tree under larger tree.               │
│  This keeps trees balanced!                                                  │
│                                                                              │
│  Combined: Amortized O(α(n)) where α is inverse Ackermann ≈ O(1)            │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

### 🎯 Quick Algorithm Selection for Beginners

| Problem Type | Algorithm | Why? |
|--------------|-----------|------|
| "Shortest path, no weights" | **BFS** | Explores by distance layers |
| "Shortest path, positive weights" | **Dijkstra** | Greedy: closest first is optimal |
| "Shortest path, negative weights" | **Bellman-Ford** | Relaxes all edges |
| "Detect cycle (undirected)" | **Union-Find** | Cycle = connecting already-connected nodes |
| "Detect cycle (directed)" | **DFS + colors** | Gray node reached again = cycle |
| "Order tasks with dependencies" | **Topological Sort** | Process nodes with no dependencies first |
| "Minimum cost to connect all" | **MST (Kruskal/Prim)** | Greedily pick cheapest edges |
| "Connected groups" | **Union-Find or DFS** | Group nodes by reachability |

---

### 🧠 Pattern Recognition for Graph Problems

```
"Can we reach X from Y?"
    └── BFS or DFS (just check if visited)

"What's the shortest path?"
    └── Unweighted → BFS
    └── Weighted positive → Dijkstra
    └── Weighted with negatives → Bellman-Ford

"Is there a cycle?"
    └── Undirected → Union-Find (edge creates cycle if nodes already connected)
    └── Directed → DFS with 3 colors (white/gray/black)

"How many groups/islands?"
    └── BFS/DFS from each unvisited node, count starts
    └── Or Union-Find and count distinct parents

"Can we split into 2 groups?"
    └── Bipartite check with 2-coloring BFS

"What order to complete tasks?"
    └── Topological sort (Kahn's BFS or DFS)
```

---

## Graph Fundamentals

### Types of Graphs

```
┌─────────────────────────────────────────────────────────────────┐
│                      GRAPH CLASSIFICATION                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  By Direction:                                                   │
│  ┌───────────────┐      ┌───────────────┐                       │
│  │   Undirected  │      │   Directed    │                       │
│  │   A ─── B     │      │   A ──► B     │                       │
│  │   │     │     │      │   │     │     │                       │
│  │   C ─── D     │      │   ▼     ▼     │                       │
│  └───────────────┘      │   C ──► D     │                       │
│                         └───────────────┘                       │
│                                                                  │
│  By Weight:                                                      │
│  ┌───────────────┐      ┌───────────────┐                       │
│  │   Unweighted  │      │   Weighted    │                       │
│  │   A ─── B     │      │   A ─5─ B     │                       │
│  │   │     │     │      │   │     │     │                       │
│  │   C ─── D     │      │  3│     │2    │                       │
│  └───────────────┘      │   C ─4─ D     │                       │
│                         └───────────────┘                       │
│                                                                  │
│  Special Types:                                                  │
│  • DAG (Directed Acyclic Graph) - No cycles                     │
│  • Tree - Connected, no cycles, n-1 edges                       │
│  • Bipartite - Nodes split into 2 independent sets              │
│  • Complete - Every pair connected                              │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Graph Representations

### 1. Adjacency List (Most Common)

```java
// Unweighted Graph
Map<Integer, List<Integer>> graph = new HashMap<>();

public void addEdge(int u, int v) {
    graph.computeIfAbsent(u, k -> new ArrayList<>()).add(v);
    graph.computeIfAbsent(v, k -> new ArrayList<>()).add(u);  // Undirected
}

// Weighted Graph
Map<Integer, List<int[]>> weightedGraph = new HashMap<>();

public void addWeightedEdge(int u, int v, int weight) {
    weightedGraph.computeIfAbsent(u, k -> new ArrayList<>()).add(new int[]{v, weight});
    weightedGraph.computeIfAbsent(v, k -> new ArrayList<>()).add(new int[]{u, weight});
}

// From edge list
public Map<Integer, List<Integer>> buildGraph(int n, int[][] edges) {
    Map<Integer, List<Integer>> graph = new HashMap<>();
    for (int i = 0; i < n; i++) graph.put(i, new ArrayList<>());
    
    for (int[] edge : edges) {
        graph.get(edge[0]).add(edge[1]);
        graph.get(edge[1]).add(edge[0]);  // Undirected
    }
    return graph;
}
```

### 2. Adjacency Matrix

```java
// Better for dense graphs, O(1) edge lookup
int[][] matrix = new int[n][n];

public void addEdge(int u, int v, int weight) {
    matrix[u][v] = weight;
    matrix[v][u] = weight;  // Undirected
}

public boolean hasEdge(int u, int v) {
    return matrix[u][v] != 0;
}
```

### 3. Edge List

```java
List<int[]> edges = new ArrayList<>();  // [u, v, weight]

public void addEdge(int u, int v, int weight) {
    edges.add(new int[]{u, v, weight});
}
```

### Comparison

| Representation | Space | Add Edge | Remove Edge | Check Edge | Neighbors |
|----------------|-------|----------|-------------|------------|-----------|
| Adjacency List | O(V+E) | O(1) | O(E) | O(degree) | O(1) |
| Adjacency Matrix | O(V²) | O(1) | O(1) | O(1) | O(V) |
| Edge List | O(E) | O(1) | O(E) | O(E) | O(E) |

---

## Traversal Algorithms: BFS & DFS

### BFS (Breadth-First Search)

```java
// Level-order traversal, shortest path in unweighted graphs
public void bfs(Map<Integer, List<Integer>> graph, int start) {
    Queue<Integer> queue = new LinkedList<>();
    Set<Integer> visited = new HashSet<>();
    
    queue.offer(start);
    visited.add(start);
    
    while (!queue.isEmpty()) {
        int node = queue.poll();
        System.out.println("Visited: " + node);
        
        for (int neighbor : graph.getOrDefault(node, Collections.emptyList())) {
            if (!visited.contains(neighbor)) {
                visited.add(neighbor);
                queue.offer(neighbor);
            }
        }
    }
}

// BFS with level tracking
public int bfsWithLevels(Map<Integer, List<Integer>> graph, int start, int target) {
    Queue<Integer> queue = new LinkedList<>();
    Set<Integer> visited = new HashSet<>();
    
    queue.offer(start);
    visited.add(start);
    int level = 0;
    
    while (!queue.isEmpty()) {
        int size = queue.size();
        
        for (int i = 0; i < size; i++) {
            int node = queue.poll();
            if (node == target) return level;
            
            for (int neighbor : graph.getOrDefault(node, Collections.emptyList())) {
                if (!visited.contains(neighbor)) {
                    visited.add(neighbor);
                    queue.offer(neighbor);
                }
            }
        }
        level++;
    }
    return -1;  // Not found
}
```

### DFS (Depth-First Search)

```java
// Recursive DFS
public void dfsRecursive(Map<Integer, List<Integer>> graph, int node, Set<Integer> visited) {
    visited.add(node);
    System.out.println("Visited: " + node);
    
    for (int neighbor : graph.getOrDefault(node, Collections.emptyList())) {
        if (!visited.contains(neighbor)) {
            dfsRecursive(graph, neighbor, visited);
        }
    }
}

// Iterative DFS (with stack)
public void dfsIterative(Map<Integer, List<Integer>> graph, int start) {
    Deque<Integer> stack = new ArrayDeque<>();
    Set<Integer> visited = new HashSet<>();
    
    stack.push(start);
    
    while (!stack.isEmpty()) {
        int node = stack.pop();
        
        if (!visited.contains(node)) {
            visited.add(node);
            System.out.println("Visited: " + node);
            
            for (int neighbor : graph.getOrDefault(node, Collections.emptyList())) {
                if (!visited.contains(neighbor)) {
                    stack.push(neighbor);
                }
            }
        }
    }
}
```

### Grid Traversal

```java
// 4-directional movement
int[][] DIRECTIONS = {{0, 1}, {1, 0}, {0, -1}, {-1, 0}};

// Number of Islands (Classic BFS/DFS on Grid)
public int numIslands(char[][] grid) {
    int count = 0;
    int m = grid.length, n = grid[0].length;
    
    for (int i = 0; i < m; i++) {
        for (int j = 0; j < n; j++) {
            if (grid[i][j] == '1') {
                count++;
                bfsGrid(grid, i, j);
            }
        }
    }
    return count;
}

private void bfsGrid(char[][] grid, int row, int col) {
    Queue<int[]> queue = new LinkedList<>();
    queue.offer(new int[]{row, col});
    grid[row][col] = '0';  // Mark visited
    
    while (!queue.isEmpty()) {
        int[] cell = queue.poll();
        
        for (int[] dir : DIRECTIONS) {
            int r = cell[0] + dir[0];
            int c = cell[1] + dir[1];
            
            if (r >= 0 && r < grid.length && c >= 0 && c < grid[0].length 
                && grid[r][c] == '1') {
                grid[r][c] = '0';
                queue.offer(new int[]{r, c});
            }
        }
    }
}
```

---

## Shortest Path Algorithms

### 1. BFS (Unweighted Graphs)

```java
public int shortestPath(Map<Integer, List<Integer>> graph, int src, int dest) {
    Queue<Integer> queue = new LinkedList<>();
    Map<Integer, Integer> distance = new HashMap<>();
    
    queue.offer(src);
    distance.put(src, 0);
    
    while (!queue.isEmpty()) {
        int node = queue.poll();
        if (node == dest) return distance.get(node);
        
        for (int neighbor : graph.getOrDefault(node, Collections.emptyList())) {
            if (!distance.containsKey(neighbor)) {
                distance.put(neighbor, distance.get(node) + 1);
                queue.offer(neighbor);
            }
        }
    }
    return -1;
}
```

### 2. Dijkstra's Algorithm (Non-negative Weights)

```java
// Time: O((V + E) log V) with priority queue
public int[] dijkstra(Map<Integer, List<int[]>> graph, int src, int n) {
    int[] dist = new int[n];
    Arrays.fill(dist, Integer.MAX_VALUE);
    dist[src] = 0;
    
    // [distance, node]
    PriorityQueue<int[]> pq = new PriorityQueue<>((a, b) -> a[0] - b[0]);
    pq.offer(new int[]{0, src});
    
    while (!pq.isEmpty()) {
        int[] curr = pq.poll();
        int d = curr[0], u = curr[1];
        
        if (d > dist[u]) continue;  // Skip outdated entries
        
        for (int[] edge : graph.getOrDefault(u, Collections.emptyList())) {
            int v = edge[0], weight = edge[1];
            if (dist[u] + weight < dist[v]) {
                dist[v] = dist[u] + weight;
                pq.offer(new int[]{dist[v], v});
            }
        }
    }
    return dist;
}

// Reconstruct path
public List<Integer> dijkstraWithPath(Map<Integer, List<int[]>> graph, int src, int dest, int n) {
    int[] dist = new int[n];
    int[] parent = new int[n];
    Arrays.fill(dist, Integer.MAX_VALUE);
    Arrays.fill(parent, -1);
    dist[src] = 0;
    
    PriorityQueue<int[]> pq = new PriorityQueue<>((a, b) -> a[0] - b[0]);
    pq.offer(new int[]{0, src});
    
    while (!pq.isEmpty()) {
        int[] curr = pq.poll();
        int d = curr[0], u = curr[1];
        
        if (d > dist[u]) continue;
        
        for (int[] edge : graph.getOrDefault(u, Collections.emptyList())) {
            int v = edge[0], weight = edge[1];
            if (dist[u] + weight < dist[v]) {
                dist[v] = dist[u] + weight;
                parent[v] = u;
                pq.offer(new int[]{dist[v], v});
            }
        }
    }
    
    // Reconstruct path
    List<Integer> path = new ArrayList<>();
    for (int node = dest; node != -1; node = parent[node]) {
        path.add(node);
    }
    Collections.reverse(path);
    return path;
}
```

### 3. Bellman-Ford (Handles Negative Weights)

```java
// Time: O(V * E), can detect negative cycles
public int[] bellmanFord(int n, int[][] edges, int src) {
    int[] dist = new int[n];
    Arrays.fill(dist, Integer.MAX_VALUE);
    dist[src] = 0;
    
    // Relax all edges V-1 times
    for (int i = 0; i < n - 1; i++) {
        for (int[] edge : edges) {
            int u = edge[0], v = edge[1], w = edge[2];
            if (dist[u] != Integer.MAX_VALUE && dist[u] + w < dist[v]) {
                dist[v] = dist[u] + w;
            }
        }
    }
    
    // Check for negative cycles
    for (int[] edge : edges) {
        int u = edge[0], v = edge[1], w = edge[2];
        if (dist[u] != Integer.MAX_VALUE && dist[u] + w < dist[v]) {
            throw new RuntimeException("Negative cycle detected!");
        }
    }
    
    return dist;
}
```

### 4. Floyd-Warshall (All Pairs Shortest Path)

```java
// Time: O(V³), useful for dense graphs
public int[][] floydWarshall(int[][] graph) {
    int n = graph.length;
    int[][] dist = new int[n][n];
    
    // Initialize
    for (int i = 0; i < n; i++) {
        for (int j = 0; j < n; j++) {
            dist[i][j] = graph[i][j];
        }
    }
    
    // Dynamic programming
    for (int k = 0; k < n; k++) {
        for (int i = 0; i < n; i++) {
            for (int j = 0; j < n; j++) {
                if (dist[i][k] != Integer.MAX_VALUE && dist[k][j] != Integer.MAX_VALUE) {
                    dist[i][j] = Math.min(dist[i][j], dist[i][k] + dist[k][j]);
                }
            }
        }
    }
    return dist;
}
```

### Algorithm Selection Guide

| Algorithm | Time | Use Case |
|-----------|------|----------|
| **BFS** | O(V+E) | Unweighted graphs |
| **Dijkstra** | O((V+E)logV) | Non-negative weights |
| **Bellman-Ford** | O(VE) | Negative weights, detect negative cycles |
| **Floyd-Warshall** | O(V³) | All-pairs, small dense graphs |

---

## Minimum Spanning Tree

### 1. Kruskal's Algorithm (Edge-based)

```java
// Sort edges, use Union-Find, O(E log E)
public int kruskal(int n, int[][] edges) {
    // Sort by weight
    Arrays.sort(edges, (a, b) -> a[2] - b[2]);
    
    UnionFind uf = new UnionFind(n);
    int mstWeight = 0, edgesUsed = 0;
    
    for (int[] edge : edges) {
        int u = edge[0], v = edge[1], w = edge[2];
        
        if (uf.union(u, v)) {
            mstWeight += w;
            edgesUsed++;
            if (edgesUsed == n - 1) break;
        }
    }
    
    return edgesUsed == n - 1 ? mstWeight : -1;  // -1 if not connected
}
```

### 2. Prim's Algorithm (Vertex-based)

```java
// Start from any vertex, greedily add minimum edge, O((V+E) log V)
public int prim(Map<Integer, List<int[]>> graph, int n) {
    boolean[] inMST = new boolean[n];
    PriorityQueue<int[]> pq = new PriorityQueue<>((a, b) -> a[1] - b[1]);
    
    pq.offer(new int[]{0, 0});  // [node, weight]
    int mstWeight = 0, nodesAdded = 0;
    
    while (!pq.isEmpty() && nodesAdded < n) {
        int[] curr = pq.poll();
        int node = curr[0], weight = curr[1];
        
        if (inMST[node]) continue;
        
        inMST[node] = true;
        mstWeight += weight;
        nodesAdded++;
        
        for (int[] edge : graph.getOrDefault(node, Collections.emptyList())) {
            if (!inMST[edge[0]]) {
                pq.offer(new int[]{edge[0], edge[1]});
            }
        }
    }
    
    return nodesAdded == n ? mstWeight : -1;
}
```

---

## Topological Sort

### Kahn's Algorithm (BFS-based)

```java
// O(V + E), also detects cycles
public int[] topologicalSort(int numCourses, int[][] prerequisites) {
    List<List<Integer>> graph = new ArrayList<>();
    int[] inDegree = new int[numCourses];
    
    for (int i = 0; i < numCourses; i++) graph.add(new ArrayList<>());
    
    for (int[] pre : prerequisites) {
        graph.get(pre[1]).add(pre[0]);
        inDegree[pre[0]]++;
    }
    
    Queue<Integer> queue = new LinkedList<>();
    for (int i = 0; i < numCourses; i++) {
        if (inDegree[i] == 0) queue.offer(i);
    }
    
    int[] result = new int[numCourses];
    int idx = 0;
    
    while (!queue.isEmpty()) {
        int node = queue.poll();
        result[idx++] = node;
        
        for (int neighbor : graph.get(node)) {
            if (--inDegree[neighbor] == 0) {
                queue.offer(neighbor);
            }
        }
    }
    
    return idx == numCourses ? result : new int[0];  // Empty if cycle exists
}
```

### DFS-based Topological Sort

```java
public List<Integer> topologicalSortDFS(int n, int[][] edges) {
    List<List<Integer>> graph = new ArrayList<>();
    for (int i = 0; i < n; i++) graph.add(new ArrayList<>());
    
    for (int[] edge : edges) {
        graph.get(edge[0]).add(edge[1]);
    }
    
    int[] state = new int[n];  // 0: unvisited, 1: visiting, 2: visited
    Deque<Integer> stack = new ArrayDeque<>();
    
    for (int i = 0; i < n; i++) {
        if (!dfs(graph, i, state, stack)) {
            return Collections.emptyList();  // Cycle detected
        }
    }
    
    List<Integer> result = new ArrayList<>();
    while (!stack.isEmpty()) result.add(stack.pop());
    return result;
}

private boolean dfs(List<List<Integer>> graph, int node, int[] state, Deque<Integer> stack) {
    if (state[node] == 1) return false;  // Cycle
    if (state[node] == 2) return true;   // Already processed
    
    state[node] = 1;
    for (int neighbor : graph.get(node)) {
        if (!dfs(graph, neighbor, state, stack)) return false;
    }
    state[node] = 2;
    stack.push(node);
    return true;
}
```

---

## Union-Find (Disjoint Set)

```java
class UnionFind {
    private int[] parent, rank;
    private int components;
    
    public UnionFind(int n) {
        parent = new int[n];
        rank = new int[n];
        components = n;
        for (int i = 0; i < n; i++) parent[i] = i;
    }
    
    // Path compression
    public int find(int x) {
        if (parent[x] != x) {
            parent[x] = find(parent[x]);
        }
        return parent[x];
    }
    
    // Union by rank
    public boolean union(int x, int y) {
        int px = find(x), py = find(y);
        if (px == py) return false;
        
        if (rank[px] < rank[py]) {
            parent[px] = py;
        } else if (rank[px] > rank[py]) {
            parent[py] = px;
        } else {
            parent[py] = px;
            rank[px]++;
        }
        components--;
        return true;
    }
    
    public boolean connected(int x, int y) {
        return find(x) == find(y);
    }
    
    public int getComponents() {
        return components;
    }
}

// Usage: Number of Connected Components
public int countComponents(int n, int[][] edges) {
    UnionFind uf = new UnionFind(n);
    for (int[] edge : edges) {
        uf.union(edge[0], edge[1]);
    }
    return uf.getComponents();
}
```

---

## Advanced Graph Algorithms

### Cycle Detection

```java
// Undirected Graph - Union Find
public boolean hasCycleUndirected(int n, int[][] edges) {
    UnionFind uf = new UnionFind(n);
    for (int[] edge : edges) {
        if (!uf.union(edge[0], edge[1])) {
            return true;  // Already connected = cycle
        }
    }
    return false;
}

// Directed Graph - DFS with colors
public boolean hasCycleDirected(int n, List<List<Integer>> graph) {
    int[] color = new int[n];  // 0: white, 1: gray, 2: black
    
    for (int i = 0; i < n; i++) {
        if (color[i] == 0 && hasCycleDFS(graph, i, color)) {
            return true;
        }
    }
    return false;
}

private boolean hasCycleDFS(List<List<Integer>> graph, int node, int[] color) {
    color[node] = 1;  // Gray - being processed
    
    for (int neighbor : graph.get(node)) {
        if (color[neighbor] == 1) return true;  // Back edge = cycle
        if (color[neighbor] == 0 && hasCycleDFS(graph, neighbor, color)) {
            return true;
        }
    }
    
    color[node] = 2;  // Black - done
    return false;
}
```

### Bipartite Check

```java
public boolean isBipartite(int[][] graph) {
    int n = graph.length;
    int[] colors = new int[n];  // 0: uncolored, 1: color A, -1: color B
    
    for (int i = 0; i < n; i++) {
        if (colors[i] == 0 && !bfsBipartite(graph, i, colors)) {
            return false;
        }
    }
    return true;
}

private boolean bfsBipartite(int[][] graph, int start, int[] colors) {
    Queue<Integer> queue = new LinkedList<>();
    queue.offer(start);
    colors[start] = 1;
    
    while (!queue.isEmpty()) {
        int node = queue.poll();
        for (int neighbor : graph[node]) {
            if (colors[neighbor] == colors[node]) return false;
            if (colors[neighbor] == 0) {
                colors[neighbor] = -colors[node];
                queue.offer(neighbor);
            }
        }
    }
    return true;
}
```

### Tarjan's Algorithm (SCCs & Bridges)

```java
// Finding Bridges (Critical Connections)
class TarjanBridges {
    private int time = 0;
    private List<List<Integer>> result = new ArrayList<>();
    
    public List<List<Integer>> criticalConnections(int n, List<List<Integer>> connections) {
        List<List<Integer>> graph = new ArrayList<>();
        for (int i = 0; i < n; i++) graph.add(new ArrayList<>());
        
        for (List<Integer> conn : connections) {
            graph.get(conn.get(0)).add(conn.get(1));
            graph.get(conn.get(1)).add(conn.get(0));
        }
        
        int[] disc = new int[n], low = new int[n];
        Arrays.fill(disc, -1);
        
        dfs(graph, 0, -1, disc, low);
        return result;
    }
    
    private void dfs(List<List<Integer>> graph, int node, int parent, int[] disc, int[] low) {
        disc[node] = low[node] = time++;
        
        for (int neighbor : graph.get(node)) {
            if (disc[neighbor] == -1) {
                dfs(graph, neighbor, node, disc, low);
                low[node] = Math.min(low[node], low[neighbor]);
                
                if (low[neighbor] > disc[node]) {
                    result.add(Arrays.asList(node, neighbor));
                }
            } else if (neighbor != parent) {
                low[node] = Math.min(low[node], disc[neighbor]);
            }
        }
    }
}
```

---

## Graph Problem Patterns

```
┌────────────────────────────────────────────────────────────────┐
│                   GRAPH PATTERN RECOGNITION                    │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  "Shortest path" / "Minimum steps"                             │
│      └── Unweighted → BFS                                      │
│      └── Weighted, no negative → Dijkstra                      │
│      └── Negative weights → Bellman-Ford                       │
│                                                                │
│  "Connected components" / "Groups"                             │
│      └── Union-Find or BFS/DFS                                 │
│                                                                │
│  "Order of tasks" / "Course schedule"                          │
│      └── Topological Sort (Kahn's or DFS)                      │
│                                                                │
│  "Minimum cost to connect"                                     │
│      └── MST (Kruskal's or Prim's)                            │
│                                                                │
│  "Detect cycle"                                                │
│      └── Undirected → Union-Find                              │
│      └── Directed → DFS with colors                           │
│                                                                │
│  "Bipartite" / "Two coloring"                                  │
│      └── BFS/DFS with 2 colors                                │
│                                                                │
│  "Clone graph" / "Deep copy"                                   │
│      └── DFS/BFS with HashMap                                 │
│                                                                │
│  Grid problems (2D array)                                      │
│      └── Treat as implicit graph                              │
│      └── Use BFS/DFS with direction arrays                    │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

---

## 🎯 Top 40 Graph Problems

### Tier 1: Essential (20 Problems)

| # | Problem | Algorithm | Difficulty |
|---|---------|-----------|------------|
| 1 | Number of Islands | BFS/DFS/Union-Find | Medium |
| 2 | Clone Graph | BFS/DFS + HashMap | Medium |
| 3 | Course Schedule I | Topological Sort | Medium |
| 4 | Course Schedule II | Topological Sort | Medium |
| 5 | Pacific Atlantic Water Flow | Multi-source BFS/DFS | Medium |
| 6 | Number of Connected Components | Union-Find/DFS | Medium |
| 7 | Graph Valid Tree | Union-Find/DFS | Medium |
| 8 | Redundant Connection | Union-Find | Medium |
| 9 | Network Delay Time | Dijkstra | Medium |
| 10 | Cheapest Flights Within K Stops | Bellman-Ford/BFS | Medium |
| 11 | Word Ladder | BFS | Hard |
| 12 | Surrounded Regions | BFS/DFS | Medium |
| 13 | Rotting Oranges | Multi-source BFS | Medium |
| 14 | 01 Matrix | Multi-source BFS | Medium |
| 15 | Is Graph Bipartite? | BFS/DFS | Medium |
| 16 | Find the Town Judge | In/Out Degree | Easy |
| 17 | All Paths From Source to Target | DFS/Backtracking | Medium |
| 18 | Shortest Path in Binary Matrix | BFS | Medium |
| 19 | Min Cost to Connect All Points | MST (Prim/Kruskal) | Medium |
| 20 | Swim in Rising Water | Binary Search + BFS | Hard |

### Tier 2: Advanced (20 Problems)

| # | Problem | Algorithm | Difficulty |
|---|---------|-----------|------------|
| 21 | Critical Connections | Tarjan's | Hard |
| 22 | Accounts Merge | Union-Find | Medium |
| 23 | Alien Dictionary | Topological Sort | Hard |
| 24 | Evaluate Division | DFS/Union-Find | Medium |
| 25 | Reconstruct Itinerary | Eulerian Path | Hard |
| 26 | Shortest Path Visiting All Nodes | BFS + Bitmask | Hard |
| 27 | Word Ladder II | BFS + DFS | Hard |
| 28 | Bus Routes | BFS | Hard |
| 29 | Making A Large Island | Union-Find | Hard |
| 30 | Minimum Height Trees | BFS from leaves | Medium |
| 31 | Longest Increasing Path in Matrix | DFS + Memo | Hard |
| 32 | Parallel Courses | Topological Sort | Medium |
| 33 | Find Eventual Safe States | Reverse Topo Sort | Medium |
| 34 | Shortest Bridge | BFS + DFS | Medium |
| 35 | K-Similar Strings | BFS | Hard |
| 36 | Minimum Cost to Make at Least One Valid Path | 0-1 BFS | Hard |
| 37 | Path With Maximum Probability | Modified Dijkstra | Medium |
| 38 | Number of Operations to Make Network Connected | Union-Find | Medium |
| 39 | Validate Binary Tree Nodes | In-degree + Union-Find | Medium |
| 40 | Find All People With Secret | Union-Find with Time | Hard |

---

## Quick Reference: Time Complexities

| Algorithm | Time | Space |
|-----------|------|-------|
| BFS/DFS | O(V + E) | O(V) |
| Dijkstra (Binary Heap) | O((V + E) log V) | O(V) |
| Bellman-Ford | O(V × E) | O(V) |
| Floyd-Warshall | O(V³) | O(V²) |
| Kruskal's MST | O(E log E) | O(V) |
| Prim's MST | O((V + E) log V) | O(V) |
| Topological Sort | O(V + E) | O(V) |
| Union-Find (with optimizations) | O(α(n)) ≈ O(1) | O(V) |
| Tarjan's SCC/Bridges | O(V + E) | O(V) |

---

> **Pro Tip:** Master BFS, DFS, Dijkstra, Topological Sort, and Union-Find — these cover 90% of graph interview questions!

**Happy Coding! 🚀**