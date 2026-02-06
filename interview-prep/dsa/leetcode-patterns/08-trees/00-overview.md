[🏠 Home](../../README.md) | [⬅️ Stacks](../07-stacks-queues/00-overview.md) | [➡️ Heaps](../09-heaps-priority-queues/00-overview.md)

# 🌳 Tree Patterns

> Hierarchical data traversal and manipulation

---

## 🎯 When to Use

| Clue | Pattern |
|------|---------|
| "Level by level" | BFS (Queue) |
| "Path from root" | DFS (Recursion) |
| "BST property" | In-order traversal |
| "All paths/combinations" | Backtracking DFS |
| "Lowest common ancestor" | DFS with tracking |

---

## 🔧 Core Traversals

### 1. DFS Traversals

```java
// Preorder: Root → Left → Right
public void preorder(TreeNode root) {
    if (root == null) return;
    process(root.val);      // Root
    preorder(root.left);    // Left
    preorder(root.right);   // Right
}

// Inorder: Left → Root → Right (BST gives sorted)
public void inorder(TreeNode root) {
    if (root == null) return;
    inorder(root.left);     // Left
    process(root.val);      // Root
    inorder(root.right);    // Right
}

// Postorder: Left → Right → Root
public void postorder(TreeNode root) {
    if (root == null) return;
    postorder(root.left);   // Left
    postorder(root.right);  // Right
    process(root.val);      // Root
}
```

**Visualization**:
```
        1
       / \
      2   3
     / \
    4   5

Preorder:  [1, 2, 4, 5, 3]
Inorder:   [4, 2, 5, 1, 3]
Postorder: [4, 5, 2, 3, 1]
```

---

### 2. BFS (Level Order)

```java
public List<List<Integer>> levelOrder(TreeNode root) {
    List<List<Integer>> result = new ArrayList<>();
    if (root == null) return result;
    
    Queue<TreeNode> queue = new LinkedList<>();
    queue.offer(root);
    
    while (!queue.isEmpty()) {
        int levelSize = queue.size();
        List<Integer> level = new ArrayList<>();
        
        for (int i = 0; i < levelSize; i++) {
            TreeNode node = queue.poll();
            level.add(node.val);
            
            if (node.left != null) queue.offer(node.left);
            if (node.right != null) queue.offer(node.right);
        }
        result.add(level);
    }
    return result;
}
```

---

## 💻 Core Problems

### Problem 1: Maximum Depth of Binary Tree

```java
public int maxDepth(TreeNode root) {
    if (root == null) return 0;
    return 1 + Math.max(maxDepth(root.left), maxDepth(root.right));
}
```

**Iterative BFS**:
```java
public int maxDepth(TreeNode root) {
    if (root == null) return 0;
    Queue<TreeNode> queue = new LinkedList<>();
    queue.offer(root);
    int depth = 0;
    
    while (!queue.isEmpty()) {
        depth++;
        int size = queue.size();
        for (int i = 0; i < size; i++) {
            TreeNode node = queue.poll();
            if (node.left != null) queue.offer(node.left);
            if (node.right != null) queue.offer(node.right);
        }
    }
    return depth;
}
```

---

### Problem 2: Invert Binary Tree

```java
public TreeNode invertTree(TreeNode root) {
    if (root == null) return null;
    
    TreeNode left = invertTree(root.left);
    TreeNode right = invertTree(root.right);
    
    root.left = right;
    root.right = left;
    
    return root;
}
```

---

### Problem 3: Same Tree / Symmetric Tree

```java
public boolean isSameTree(TreeNode p, TreeNode q) {
    if (p == null && q == null) return true;
    if (p == null || q == null) return false;
    if (p.val != q.val) return false;
    
    return isSameTree(p.left, q.left) && isSameTree(p.right, q.right);
}

public boolean isSymmetric(TreeNode root) {
    return isMirror(root, root);
}

private boolean isMirror(TreeNode t1, TreeNode t2) {
    if (t1 == null && t2 == null) return true;
    if (t1 == null || t2 == null) return false;
    
    return t1.val == t2.val 
        && isMirror(t1.left, t2.right) 
        && isMirror(t1.right, t2.left);
}
```

---

### Problem 4: Validate BST

```java
public boolean isValidBST(TreeNode root) {
    return validate(root, Long.MIN_VALUE, Long.MAX_VALUE);
}

private boolean validate(TreeNode node, long min, long max) {
    if (node == null) return true;
    if (node.val <= min || node.val >= max) return false;
    
    return validate(node.left, min, node.val) 
        && validate(node.right, node.val, max);
}
```

---

### Problem 5: Lowest Common Ancestor

```java
public TreeNode lowestCommonAncestor(TreeNode root, TreeNode p, TreeNode q) {
    if (root == null || root == p || root == q) return root;
    
    TreeNode left = lowestCommonAncestor(root.left, p, q);
    TreeNode right = lowestCommonAncestor(root.right, p, q);
    
    if (left != null && right != null) return root;  // p,q on different sides
    return left != null ? left : right;
}
```

---

### Problem 6: Serialize and Deserialize

```java
public class Codec {
    public String serialize(TreeNode root) {
        if (root == null) return "null";
        return root.val + "," + serialize(root.left) + "," + serialize(root.right);
    }

    public TreeNode deserialize(String data) {
        Queue<String> queue = new LinkedList<>(Arrays.asList(data.split(",")));
        return build(queue);
    }
    
    private TreeNode build(Queue<String> queue) {
        String val = queue.poll();
        if (val.equals("null")) return null;
        
        TreeNode node = new TreeNode(Integer.parseInt(val));
        node.left = build(queue);
        node.right = build(queue);
        return node;
    }
}
```

---

## 🧠 Pattern Templates

### Template 1: Return Value DFS
```java
// Use when: Need aggregate result from subtrees
int dfs(TreeNode node) {
    if (node == null) return BASE_CASE;
    
    int left = dfs(node.left);
    int right = dfs(node.right);
    
    return COMBINE(left, right, node);
}
```

### Template 2: Global Variable DFS
```java
// Use when: Finding max across all nodes
int maxVal = 0;

int dfs(TreeNode node) {
    if (node == null) return 0;
    
    int left = dfs(node.left);
    int right = dfs(node.right);
    
    maxVal = Math.max(maxVal, left + right + node.val);
    return Math.max(left, right) + node.val;
}
```

---

## 📊 Complexity Summary

| Problem | Time | Space |
|---------|------|-------|
| Max Depth | O(n) | O(h) |
| Level Order | O(n) | O(w) |
| Validate BST | O(n) | O(h) |
| LCA | O(n) | O(h) |
| Serialize | O(n) | O(n) |

*h = height, w = max width*

---

## 📝 Practice Problems

| # | Problem | Difficulty | Link | Key Insight |
|---|---------|------------|------|-------------|
| 1 | Max Depth | 🟢 Easy | [LeetCode](https://leetcode.com/problems/maximum-depth-of-binary-tree/) | Simple recursion |
| 2 | Invert Tree | 🟢 Easy | [LeetCode](https://leetcode.com/problems/invert-binary-tree/) | Swap children |
| 3 | Same Tree | 🟢 Easy | [LeetCode](https://leetcode.com/problems/same-tree/) | Compare recursively |
| 4 | Level Order | 🟡 Medium | [LeetCode](https://leetcode.com/problems/binary-tree-level-order-traversal/) | BFS queue |
| 5 | Validate BST | 🟡 Medium | [LeetCode](https://leetcode.com/problems/validate-binary-search-tree/) | Range checking |
| 6 | LCA | 🟡 Medium | [LeetCode](https://leetcode.com/problems/lowest-common-ancestor-of-a-binary-tree/) | Split point |
| 7 | Kth Smallest BST | 🟡 Medium | [LeetCode](https://leetcode.com/problems/kth-smallest-element-in-a-bst/) | Inorder |
| 8 | Binary Tree Max Path | 🔴 Hard | [LeetCode](https://leetcode.com/problems/binary-tree-maximum-path-sum/) | Global max |

---

*Next: [Heaps & Priority Queues →](../09-heaps-priority-queues/00-overview.md)*
