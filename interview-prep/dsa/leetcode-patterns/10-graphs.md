[🏠 Home](../../README.md) | [⬅️ Heaps](../09-heaps-priority-queues/00-overview.md) | [➡️ Backtracking](../11-backtracking/00-overview.md)

# 🕸️ Graph Patterns

> Traversing connections and finding paths

---

## 🎯 When to Use

| Clue | Pattern |
|------|---------|
| "Shortest path (unweighted)" | BFS |
| "Explore all paths / Maze" | DFS |
| "Detect cycle (directed)" | DFS (Recursion stack) |
| "Detect cycle (undirected)" | Union-Find or DFS |
| "Course prerequisites" | Topological Sort |
| "Connected components" | BFS/DFS/Union-Find |
| "Network delay / Cheapest flight" | Dijkstra (Weighted BFS) |

---

## 🧠 WHY Graph Algorithms Work: The Developer's Guide

> **🎯 For Beginners:** Graphs are everywhere - social networks, maps, dependencies. Master these patterns!

### The Core Insight: Everything is Connected

```
Graph = Nodes + Edges

Real-world graphs:
  ├── Social Network: People = nodes, Friendships = edges
  ├── Map: Cities = nodes, Roads = edges
  ├── Dependencies: Courses = nodes, Prerequisites = edges
  └── Web: Pages = nodes, Links = edges

Once you see the graph structure, patterns apply!
```

### BFS vs DFS: When to Use Which

```
BFS (Breadth-First Search):
  Explores LEVEL BY LEVEL (like ripples in water)
  
  Uses: Queue
  Perfect for: SHORTEST PATH (unweighted)
  
  Why? First time you reach a node is the shortest way!
  
       1         Level 0
      / \
     2   3       Level 1 (distance 1 from start)
    / \   \
   4   5   6     Level 2 (distance 2 from start)

DFS (Depth-First Search):
  Explores ONE PATH FULLY before backtracking
  
  Uses: Recursion / Stack
  Perfect for: ALL PATHS, cycle detection, connected components
  
  Why? Goes deep, then backtracks = explores all possibilities
```

### Cycle Detection: The Intuition

```
DIRECTED Graph (like course prerequisites):
  
  ❌ Cycle = IMPOSSIBLE to complete!
     A → B → C → A (circular dependency)
     
  Detection: If we visit a node that's CURRENTLY in our path
  
  States: WHITE (unvisited) → GRAY (processing) → BLACK (done)
  Cycle exists if we hit a GRAY node!

UNDIRECTED Graph:
  
  Detection: If we visit a node that's not our parent
  (Going back to where we came from is OK)
```

### Union-Find: Grouping Magic

```
"Are A and B connected?" - O(1) answer!

Key Insight: Each group has one "representative"

Initially: [0] [1] [2] [3] [4]
           Each node is its own group

Union(0, 1): [0, 1] [2] [3] [4]
             0 is the representative of {0, 1}

Union(1, 2): [0, 1, 2] [3] [4]
             All point to 0

Find(2) = Find(1) = Find(0) = 0

Are 0 and 2 connected? Find(0) == Find(2)? YES!
```

### Topological Sort: The Dependency Resolver

```
Course Schedule: What order to take courses?

Prerequisites: 
  Course 1 → Course 2 (take 1 before 2)
  Course 1 → Course 3
  Course 2 → Course 4

Topological Order: 1 → 2 → 3 → 4
                   or 1 → 3 → 2 → 4

Key: Process nodes with no incoming edges first!
If we can't process all nodes → CYCLE exists
```

### Thought Process Template

```
🧠 "How do I approach this graph problem?"

1. Is it a shortest path problem?
   → Unweighted: BFS
   → Weighted: Dijkstra

2. Need all paths or combinations?
   → DFS with backtracking

3. Detect cycle?
   → Directed: DFS with color/state
   → Undirected: Union-Find or DFS

4. Dependency ordering?
   → Topological Sort (Kahn's algorithm)

5. Count connected components?
   → BFS/DFS from each unvisited, or Union-Find
```

---

## 📊 Graph Representations — Visual

```mermaid
graph LR
    subgraph AdjList["Adjacency List"]
        direction TB
        AL0["0 → [1, 2]"]
        AL1["1 → [0, 3]"]
        AL2["2 → [0, 3]"]
        AL3["3 → [1, 2]"]
    end

    subgraph Visual["Graph View"]
        V0((0)) --- V1((1))
        V0 --- V2((2))
        V1 --- V3((3))
        V2 --- V3
    end

    style V0 fill:#3b82f6,color:#fff
    style V1 fill:#22c55e,color:#fff
    style V2 fill:#f59e0b,color:#000
    style V3 fill:#ef4444,color:#fff
```

### 🧭 Graph Algorithm Selector

```mermaid
flowchart TD
    A["Graph Problem"] --> B{"What's the goal?"}
    B -- "Shortest path (unweighted)" --> C["🌊 BFS\n(level-by-level)"]
    B -- "Shortest path (weighted)" --> D["⚖️ Dijkstra\n(priority queue)"]
    B -- "Explore all paths" --> E["🔍 DFS\n(recursion/stack)"]
    B -- "Detect cycle" --> F{"Directed?"}
    F -- "Yes" --> G["🔄 DFS with 3 colors\n(white/gray/black)"]
    F -- "No" --> H["🤝 Union-Find\nor DFS"]
    B -- "Ordering with dependencies" --> I["📋 Topological Sort\n(Kahns BFS)"]
    B -- "Connected components" --> J["🏝️ BFS/DFS or\nUnion-Find"]

    style C fill:#3b82f6,color:#fff
    style D fill:#8b5cf6,color:#fff
    style E fill:#22c55e,color:#fff
    style G fill:#ef4444,color:#fff
    style H fill:#f59e0b,color:#000
    style I fill:#06b6d4,color:#fff
    style J fill:#ec4899,color:#fff
```

---

## 🔧 Core Traversals

### 1. BFS (Shortest Path)

```java
// Find shortest path from start to target in unweighted graph
public int bfs(int start, int target, List<List<Integer>> adj) {
    Queue<Integer> queue = new LinkedList<>();
    boolean[] visited = new boolean[adj.size()];
    
    queue.offer(start);
    visited[start] = true;
    int distance = 0;
    
    while (!queue.isEmpty()) {
        int size = queue.size();
        for (int i = 0; i < size; i++) {
            int node = queue.poll();
            if (node == target) return distance;
            
            for (int neighbor : adj.get(node)) {
                if (!visited[neighbor]) {
                    visited[neighbor] = true;
                    queue.offer(neighbor);
                }
            }
        }
        distance++;
    }
    return -1;
}
```

### 2. DFS (Exploration)

```java
// Visit all nodes in connected component
public void dfs(int node, List<List<Integer>> adj, boolean[] visited) {
    visited[node] = true;
    process(node);
    
    for (int neighbor : adj.get(node)) {
        if (!visited[neighbor]) {
            dfs(neighbor, adj, visited);
        }
    }
}
```

### 3. Grid Traversal (Implicit Graph)

```java
int[][] dirs = {{0,1}, {0,-1}, {1,0}, {-1,0}};

public void dfsGrid(int[][] grid, int r, int c, boolean[][] visited) {
    if (r < 0 || c < 0 || r >= grid.length || c >= grid[0].length || 
        visited[r][c] || grid[r][c] == 0) {
        return;
    }
    
    visited[r][c] = true;
    
    for (int[] d : dirs) {
        dfsGrid(grid, r + d[0], c + d[1], visited);
    }
}
```

---

## 💻 Core Problems

### Problem 1: Number of Islands

```java
public int numIslands(char[][] grid) {
    if (grid == null || grid.length == 0) return 0;
    
    int count = 0;
    int m = grid.length, n = grid[0].length;
    
    for (int i = 0; i < m; i++) {
        for (int j = 0; j < n; j++) {
            if (grid[i][j] == '1') {
                count++;
                dfs(grid, i, j);
            }
        }
    }
    return count;
}

private void dfs(char[][] grid, int r, int c) {
    if (r < 0 || c < 0 || r >= grid.length || c >= grid[0].length || grid[r][c] == '0') {
        return;
    }
    
    grid[r][c] = '0';  // Mark as visited by sinking
    
    dfs(grid, r+1, c);
    dfs(grid, r-1, c);
    dfs(grid, r, c+1);
    dfs(grid, r, c-1);
}
```

**Visualization**:
```
1 1 0 0 0    →    0 0 0 0 0
1 1 0 0 0         0 0 0 0 0
0 0 1 0 0         0 0 0 0 0
0 0 0 1 1         0 0 0 0 0
Island #1 found, sink neighbors. Then #2, #3. Total = 3
```

---

### Problem 2: Course Schedule (Topological Sort)

```java
// Can you finish all courses? (Cycle detection)
public boolean canFinish(int numCourses, int[][] prerequisites) {
    List<List<Integer>> adj = new ArrayList<>();
    for (int i = 0; i < numCourses; i++) adj.add(new ArrayList<>());
    
    int[] inDegree = new int[numCourses];
    for (int[] pr : prerequisites) {
        adj.get(pr[1]).add(pr[0]);
        inDegree[pr[0]]++;
    }
    
    Queue<Integer> queue = new LinkedList<>();
    for (int i = 0; i < numCourses; i++) {
        if (inDegree[i] == 0) queue.offer(i);
    }
    
    int count = 0;
    while (!queue.isEmpty()) {
        int course = queue.poll();
        count++;
        
        for (int neighbor : adj.get(course)) {
            inDegree[neighbor]--;
            if (inDegree[neighbor] == 0) {
                queue.offer(neighbor);
            }
        }
    }
    
    return count == numCourses;
}
```

---

### Problem 3: Clone Graph

```java
// Deep copy of connected graph
public Node cloneGraph(Node node) {
    if (node == null) return null;
    
    Map<Node, Node> visited = new HashMap<>(); // Original -> Clone
    
    return dfsClone(node, visited);
}

private Node dfsClone(Node node, Map<Node, Node> visited) {
    if (visited.containsKey(node)) return visited.get(node);
    
    Node clone = new Node(node.val);
    visited.put(node, clone);
    
    for (Node neighbor : node.neighbors) {
        clone.neighbors.add(dfsClone(neighbor, visited));
    }
    return clone;
}
```

---

### Problem 4: Pacific Atlantic Water Flow

```java
public List<List<Integer>> pacificAtlantic(int[][] heights) {
    int m = heights.length, n = heights[0].length;
    boolean[][] pacific = new boolean[m][n];
    boolean[][] atlantic = new boolean[m][n];
    
    // DFS from borders inward
    for (int i = 0; i < m; i++) {
        dfs(heights, pacific, i, 0, Integer.MIN_VALUE);      // Left border
        dfs(heights, atlantic, i, n-1, Integer.MIN_VALUE);   // Right border
    }
    for (int j = 0; j < n; j++) {
        dfs(heights, pacific, 0, j, Integer.MIN_VALUE);      // Top border
        dfs(heights, atlantic, m-1, j, Integer.MIN_VALUE);   // Bottom border
    }
    
    List<List<Integer>> result = new ArrayList<>();
    for (int i = 0; i < m; i++) {
        for (int j = 0; j < n; j++) {
            if (pacific[i][j] && atlantic[i][j]) {
                result.add(Arrays.asList(i, j));
            }
        }
    }
    return result;
}

private void dfs(int[][] h, boolean[][] visited, int r, int c, int prevH) {
    if (r<0 || c<0 || r>=h.length || c>=h[0].length || visited[r][c] || h[r][c] < prevH)
        return;
    
    visited[r][c] = true;
    dfs(h, visited, r+1, c, h[r][c]);
    dfs(h, visited, r-1, c, h[r][c]);
    dfs(h, visited, r, c+1, h[r][c]);
    dfs(h, visited, r, c-1, h[r][c]);
}
```

---

### Problem 5: Union-Find (Disjoint Set)

Used for connected components, cycle detection in undirected graphs.

```java
class UnionFind {
    int[] parent;
    int[] rank;
    
    public UnionFind(int n) {
        parent = new int[n];
        rank = new int[n];
        for (int i = 0; i < n; i++) parent[i] = i;
    }
    
    public int find(int x) {
        if (parent[x] != x) {
            parent[x] = find(parent[x]); // Path compression
        }
        return parent[x];
    }
    
    public boolean union(int x, int y) {
        int rootX = find(x);
        int rootY = find(y);
        
        if (rootX == rootY) return false; // Already connected
        
        if (rank[rootX] > rank[rootY]) {
            parent[rootY] = rootX;
        } else if (rank[rootX] < rank[rootY]) {
            parent[rootX] = rootY;
        } else {
            parent[rootY] = rootX;
            rank[rootX]++;
        }
        return true;
    }
}
```

**Use Case**: Number of Connected Components in an Undirected Graph.

---

## 📊 Complexity Summary

| Algorithm | Time | Space |
|-----------|------|-------|
| BFS/DFS (Adjacency List) | O(V + E) | O(V) |
| BFS/DFS (Matrix) | O(R * C) | O(R * C) |
| Topological Sort | O(V + E) | O(V) |
| Union-Find | O(α(N)) ≈ O(1) | O(N) |

---

## 📝 Practice Problems

| # | Problem | Difficulty | Link | Key Insight |
|---|---------|------------|------|-------------|
| 1 | Number of Islands | 🟡 Medium | [LeetCode](https://leetcode.com/problems/number-of-islands/) | Grid DFS/BFS |
| 2 | Clone Graph | 🟡 Medium | [LeetCode](https://leetcode.com/problems/clone-graph/) | HashMap visited |
| 3 | Max Area of Island | 🟡 Medium | [LeetCode](https://leetcode.com/problems/max-area-of-island/) | DFS counting |
| 4 | Pacific Atlantic | 🟡 Medium | [LeetCode](https://leetcode.com/problems/pacific-atlantic-water-flow/) | DFS from borders |
| 5 | Course Schedule | 🟡 Medium | [LeetCode](https://leetcode.com/problems/course-schedule/) | Topo Sort |
| 6 | Rotting Oranges | 🟡 Medium | [LeetCode](https://leetcode.com/problems/rotting-oranges/) | Multi-source BFS |
| 7 | Word Ladder | 🔴 Hard | [LeetCode](https://leetcode.com/problems/word-ladder/) | BFS shortest path |

---

*Next: [Backtracking →](../11-backtracking/00-overview.md)*
