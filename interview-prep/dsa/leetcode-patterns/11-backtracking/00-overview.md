[🏠 Home](../../README.md) | [⬅️ Graphs](../10-graphs/00-overview.md) | [➡️ Dynamic Programming](../12-dynamic-programming/00-overview.md)

# 🔙 Backtracking Pattern

> Exhaustive search with pruning: "Try, Fail, Undo"

---

## 🎯 When to Use

| Clue | Pattern |
|------|---------|
| "Find all combinations" | Subsets / Combinations |
| "Find all permutations" | Permutations |
| "Find one valid solution" | Sudoku / N-Queens |
| "Partition string" | Palindrome Partitioning |
| "Constraints check" | Constraint Satisfaction |

---

## 🔧 Core Template

```java
public void backtrack(State state) {
    // 1. Base case: Goal reached
    if (isSolution(state)) {
        res.add(new ArrayList<>(state));
        return;
    }
    
    // 2. Iterate through choices
    for (Choice choice : choices) {
        if (isValid(choice)) {
            // 3. Make choice
            state.add(choice);
            
            // 4. Recurse
            backtrack(state);
            
            // 5. Undo choice (Backtrack)
            state.remove(state.size() - 1);
        }
    }
}
```

---

## 💻 Core Problems

### Problem 1: Subsets (Power Set)

```java
// Findings all unique subsets of [1, 2, 3]
public List<List<Integer>> subsets(int[] nums) {
    List<List<Integer>> result = new ArrayList<>();
    backtrack(nums, 0, new ArrayList<>(), result);
    return result;
}

private void backtrack(int[] nums, int start, List<Integer> curr, List<List<Integer>> result) {
    // Every state is a valid subset
    result.add(new ArrayList<>(curr));
    
    for (int i = start; i < nums.length; i++) {
        curr.add(nums[i]);       // Include
        backtrack(nums, i + 1, curr, result);
        curr.remove(curr.size() - 1); // Exclude
    }
}
```

**Visualization**:
```
[]
 ├── [1]
 │    ├── [1,2]
 │    │    └── [1,2,3]
 │    └── [1,3]
 ├── [2]
 │    └── [2,3]
 └── [3]
```

---

### Problem 2: Permutations

```java
// All orderings of [1, 2, 3]
public List<List<Integer>> permute(int[] nums) {
    List<List<Integer>> result = new ArrayList<>();
    backtrack(nums, new ArrayList<>(), result);
    return result;
}

private void backtrack(int[] nums, List<Integer> curr, List<List<Integer>> result) {
    if (curr.size() == nums.length) {
        result.add(new ArrayList<>(curr));
        return;
    }
    
    for (int num : nums) {
        if (curr.contains(num)) continue; // Skip used
        
        curr.add(num);
        backtrack(nums, curr, result);
        curr.remove(curr.size() - 1);
    }
}
```

**Note**: For better performance than `contains`, use a boolean `used` array.

---

### Problem 3: Combination Sum

```java
// Find combinations that sum to target (reuse allowed)
public List<List<Integer>> combinationSum(int[] candidates, int target) {
    List<List<Integer>> result = new ArrayList<>();
    backtrack(candidates, target, 0, new ArrayList<>(), result);
    return result;
}

private void backtrack(int[] candidates, int remain, int start, 
                      List<Integer> curr, List<List<Integer>> result) {
    if (remain == 0) {
        result.add(new ArrayList<>(curr));
        return;
    }
    if (remain < 0) return;
    
    for (int i = start; i < candidates.length; i++) {
        curr.add(candidates[i]);
        // i (not i+1) because we can reuse same element
        backtrack(candidates, remain - candidates[i], i, curr, result);
        curr.remove(curr.size() - 1);
    }
}
```

---

### Problem 4: Word Search (2D Grid)

```java
public boolean exist(char[][] board, String word) {
    for (int i = 0; i < board.length; i++) {
        for (int j = 0; j < board[0].length; j++) {
            if (dfs(board, i, j, word, 0)) return true;
        }
    }
    return false;
}

private boolean dfs(char[][] board, int r, int c, String word, int idx) {
    if (idx == word.length()) return true;
    
    if (r < 0 || c < 0 || r >= board.length || c >= board[0].length || 
        board[r][c] != word.charAt(idx)) {
        return false;
    }
    
    char temp = board[r][c];
    board[r][c] = '#';  // Mark visited
    
    boolean found = dfs(board, r+1, c, word, idx+1) ||
                   dfs(board, r-1, c, word, idx+1) ||
                   dfs(board, r, c+1, word, idx+1) ||
                   dfs(board, r, c-1, word, idx+1);
                   
    board[r][c] = temp; // Backtrack
    return found;
}
```

---

## 🧠 Permutations vs Combinations vs Subsets

| Problem | Order Matters? | Distinct Length? | Logic |
|---------|---------------|------------------|-------|
| **Permutations** | Yes | n | Use every element once |
| **Combinations** | No | k | Select k elements |
| **Subsets** | No | 0 to n | Select any number |

**Duplicate Handling** (`nums = [1, 2, 2]`):
Sort array first.
```java
if (i > start && nums[i] == nums[i-1]) continue;
```

---

## 📊 Complexity Summary

| Problem | Time | Space |
|---------|------|-------|
| Subsets | O(n * 2ⁿ) | O(n) |
| Permutations | O(n * n!) | O(n) |
| Combination Sum | O(Target/MinVal) | O(Target/MinVal) |
| Word Search | O(R*C * 3ᴸ) | O(L) |

---

## 📝 Practice Problems

| # | Problem | Difficulty | Link | Key Insight |
|---|---------|------------|------|-------------|
| 1 | Subsets | 🟡 Medium | [LeetCode](https://leetcode.com/problems/subsets/) | Include vs Exclude |
| 2 | Combination Sum | 🟡 Medium | [LeetCode](https://leetcode.com/problems/combination-sum/) | Unbounded Knapsack-ish |
| 3 | Permutations | 🟡 Medium | [LeetCode](https://leetcode.com/problems/permutations/) | Used array |
| 4 | Word Search | 🟡 Medium | [LeetCode](https://leetcode.com/problems/word-search/) | Grid DFS + Backtrack |
| 5 | Palindrome Part. | 🟡 Medium | [LeetCode](https://leetcode.com/problems/palindrome-partitioning/) | Check prefix palindrome |
| 6 | N-Queens | 🔴 Hard | [LeetCode](https://leetcode.com/problems/n-queens/) | Diagonals tracking |

---

*Next: [Dynamic Programming →](../12-dynamic-programming/00-overview.md)*
