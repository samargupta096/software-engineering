# DSA Practice Problems for Barclays 🧮

> **Difficulty Distribution:** 40% Easy | 50% Medium | 10% Hard  
> **Focus Areas:** Arrays, Strings, DP, Trees, Graphs, Binary Search

---

## 📋 Problem Set Overview

| # | Problem | Difficulty | Pattern | Barclays Frequency |
|---|---------|------------|---------|-------------------|
| 1 | Maximum Subarray (Kadane's) | Medium | DP | ⭐⭐⭐ Very High |
| 2 | Reverse String In-Place | Easy | Two Pointers | ⭐⭐⭐ Very High |
| 3 | LIS - Longest Increasing Subsequence | Medium | DP | ⭐⭐⭐ Very High |
| 4 | First & Last Position in Sorted Array | Medium | Binary Search | ⭐⭐⭐ Very High |
| 5 | BFS on Unweighted Graph | Medium | Graph/BFS | ⭐⭐⭐ Very High |
| 6 | LRU Cache | Medium | Design | ⭐⭐ High |
| 7 | Detect Cycle in Directed Graph | Medium | Graph/DFS | ⭐⭐ High |
| 8 | Two Sum | Easy | HashMap | ⭐⭐ High |
| 9 | Longest Palindromic Substring | Medium | DP | ⭐⭐ High |
| 10 | Fibonacci Number | Easy | DP | ⭐⭐ High |

---

## Problem 1: Maximum Subarray (Kadane's Algorithm) ⭐⭐⭐

**LeetCode:** [LC 53](https://leetcode.com/problems/maximum-subarray/)  
**Difficulty:** Medium  
**Pattern:** Dynamic Programming / Greedy

### Problem Statement
Given an integer array `nums`, find the contiguous subarray which has the largest sum and return its sum.

### Example
```
Input: nums = [-2,1,-3,4,-1,2,1,-5,4]
Output: 6
Explanation: [4,-1,2,1] has the largest sum = 6.
```

### Solution (Java)

```java
class Solution {
    public int maxSubArray(int[] nums) {
        // Kadane's Algorithm
        int maxSum = nums[0];     // Global maximum
        int currentSum = nums[0]; // Current subarray sum
        
        for (int i = 1; i < nums.length; i++) {
            // Either extend current subarray or start new one
            currentSum = Math.max(nums[i], currentSum + nums[i]);
            // Update global maximum
            maxSum = Math.max(maxSum, currentSum);
        }
        
        return maxSum;
    }
}
```

### Complexity
- **Time:** O(n) - Single pass through array
- **Space:** O(1) - Only two variables

### Key Insight
At each position, we decide: "Should I extend the previous subarray or start fresh from here?"
If `currentSum + nums[i] < nums[i]`, starting fresh is better.

---

## Problem 2: Reverse String In-Place ⭐⭐⭐

**LeetCode:** [LC 344](https://leetcode.com/problems/reverse-string/)  
**Difficulty:** Easy  
**Pattern:** Two Pointers

### Problem Statement
Write a function that reverses a string in-place without using extra space.

### Solution (Java)

```java
class Solution {
    public void reverseString(char[] s) {
        int left = 0;
        int right = s.length - 1;
        
        while (left < right) {
            // Swap characters
            char temp = s[left];
            s[left] = s[right];
            s[right] = temp;
            
            left++;
            right--;
        }
    }
    
    // Alternative: Using XOR (no temp variable)
    public void reverseStringXOR(char[] s) {
        int left = 0, right = s.length - 1;
        
        while (left < right) {
            s[left] ^= s[right];
            s[right] ^= s[left];
            s[left] ^= s[right];
            left++;
            right--;
        }
    }
}
```

### Complexity
- **Time:** O(n) - Half of array traversal
- **Space:** O(1) - In-place swap

---

## Problem 3: Longest Increasing Subsequence ⭐⭐⭐

**LeetCode:** [LC 300](https://leetcode.com/problems/longest-increasing-subsequence/)  
**Difficulty:** Medium  
**Pattern:** Dynamic Programming / Binary Search

### Problem Statement
Given an integer array `nums`, return the length of the longest strictly increasing subsequence.

### Example
```
Input: nums = [10,9,2,5,3,7,101,18]
Output: 4
Explanation: LIS is [2,3,7,101], length = 4
```

### Solution 1: DP O(n²)

```java
class Solution {
    public int lengthOfLIS(int[] nums) {
        int n = nums.length;
        int[] dp = new int[n];
        Arrays.fill(dp, 1); // Each element is a subsequence of length 1
        
        int maxLen = 1;
        
        for (int i = 1; i < n; i++) {
            for (int j = 0; j < i; j++) {
                if (nums[i] > nums[j]) {
                    dp[i] = Math.max(dp[i], dp[j] + 1);
                }
            }
            maxLen = Math.max(maxLen, dp[i]);
        }
        
        return maxLen;
    }
}
```

### Solution 2: Binary Search O(n log n)

```java
class Solution {
    public int lengthOfLIS(int[] nums) {
        List<Integer> sub = new ArrayList<>();
        
        for (int num : nums) {
            int pos = binarySearch(sub, num);
            
            if (pos == sub.size()) {
                sub.add(num);
            } else {
                sub.set(pos, num);
            }
        }
        
        return sub.size();
    }
    
    private int binarySearch(List<Integer> sub, int target) {
        int left = 0, right = sub.size();
        
        while (left < right) {
            int mid = left + (right - left) / 2;
            if (sub.get(mid) < target) {
                left = mid + 1;
            } else {
                right = mid;
            }
        }
        
        return left;
    }
}
```

### Complexity
| Approach | Time | Space |
|----------|------|-------|
| DP | O(n²) | O(n) |
| Binary Search | O(n log n) | O(n) |

---

## Problem 4: First and Last Position in Sorted Array ⭐⭐⭐

**LeetCode:** [LC 34](https://leetcode.com/problems/find-first-and-last-position-of-element-in-sorted-array/)  
**Difficulty:** Medium  
**Pattern:** Binary Search

### Problem Statement
Given a sorted array of integers and a target value, find the starting and ending position of the target. Return `[-1, -1]` if not found.

### Example
```
Input: nums = [5,7,7,8,8,10], target = 8
Output: [3,4]
```

### Solution (Java)

```java
class Solution {
    public int[] searchRange(int[] nums, int target) {
        int first = findBound(nums, target, true);  // Find first occurrence
        int last = findBound(nums, target, false);  // Find last occurrence
        return new int[]{first, last};
    }
    
    private int findBound(int[] nums, int target, boolean isFirst) {
        int left = 0, right = nums.length - 1;
        int result = -1;
        
        while (left <= right) {
            int mid = left + (right - left) / 2;
            
            if (nums[mid] == target) {
                result = mid;
                if (isFirst) {
                    right = mid - 1; // Keep searching left for first
                } else {
                    left = mid + 1;  // Keep searching right for last
                }
            } else if (nums[mid] < target) {
                left = mid + 1;
            } else {
                right = mid - 1;
            }
        }
        
        return result;
    }
}
```

### Complexity
- **Time:** O(log n) - Two binary searches
- **Space:** O(1)

---

## Problem 5: BFS on Unweighted Graph ⭐⭐⭐

**LeetCode:** [LC 102 - Level Order Traversal](https://leetcode.com/problems/binary-tree-level-order-traversal/)  
**Difficulty:** Medium  
**Pattern:** BFS

### Problem Statement
Given the root of a binary tree, return the level order traversal (BFS).

### Solution (Java)

```java
class Solution {
    public List<List<Integer>> levelOrder(TreeNode root) {
        List<List<Integer>> result = new ArrayList<>();
        if (root == null) return result;
        
        Queue<TreeNode> queue = new LinkedList<>();
        queue.offer(root);
        
        while (!queue.isEmpty()) {
            int levelSize = queue.size();
            List<Integer> currentLevel = new ArrayList<>();
            
            for (int i = 0; i < levelSize; i++) {
                TreeNode node = queue.poll();
                currentLevel.add(node.val);
                
                if (node.left != null) queue.offer(node.left);
                if (node.right != null) queue.offer(node.right);
            }
            
            result.add(currentLevel);
        }
        
        return result;
    }
}
```

### BFS Template for Graphs

```java
public void bfsGraph(int start, Map<Integer, List<Integer>> graph) {
    Queue<Integer> queue = new LinkedList<>();
    Set<Integer> visited = new HashSet<>();
    
    queue.offer(start);
    visited.add(start);
    int level = 0; // Distance from start
    
    while (!queue.isEmpty()) {
        int size = queue.size();
        System.out.println("Level " + level + ": ");
        
        for (int i = 0; i < size; i++) {
            int node = queue.poll();
            System.out.print(node + " ");
            
            for (int neighbor : graph.getOrDefault(node, new ArrayList<>())) {
                if (!visited.contains(neighbor)) {
                    visited.add(neighbor);
                    queue.offer(neighbor);
                }
            }
        }
        level++;
    }
}
```

### Complexity
- **Time:** O(V + E) where V = vertices, E = edges
- **Space:** O(V) for queue and visited set

---

## Problem 6: LRU Cache ⭐⭐

**LeetCode:** [LC 146](https://leetcode.com/problems/lru-cache/)  
**Difficulty:** Medium  
**Pattern:** Design (HashMap + Doubly Linked List)

### Problem Statement
Design a data structure that follows LRU (Least Recently Used) caching constraints.

### Solution (Java)

```java
class LRUCache {
    // Doubly Linked List Node
    class Node {
        int key, value;
        Node prev, next;
        Node(int k, int v) { key = k; value = v; }
    }
    
    private int capacity;
    private Map<Integer, Node> cache;
    private Node head, tail; // Dummy nodes
    
    public LRUCache(int capacity) {
        this.capacity = capacity;
        this.cache = new HashMap<>();
        
        // Initialize dummy head and tail
        head = new Node(0, 0);
        tail = new Node(0, 0);
        head.next = tail;
        tail.prev = head;
    }
    
    public int get(int key) {
        if (!cache.containsKey(key)) return -1;
        
        Node node = cache.get(key);
        moveToHead(node); // Mark as recently used
        return node.value;
    }
    
    public void put(int key, int value) {
        if (cache.containsKey(key)) {
            Node node = cache.get(key);
            node.value = value;
            moveToHead(node);
        } else {
            Node newNode = new Node(key, value);
            cache.put(key, newNode);
            addToHead(newNode);
            
            if (cache.size() > capacity) {
                Node lru = removeTail();
                cache.remove(lru.key);
            }
        }
    }
    
    private void addToHead(Node node) {
        node.prev = head;
        node.next = head.next;
        head.next.prev = node;
        head.next = node;
    }
    
    private void removeNode(Node node) {
        node.prev.next = node.next;
        node.next.prev = node.prev;
    }
    
    private void moveToHead(Node node) {
        removeNode(node);
        addToHead(node);
    }
    
    private Node removeTail() {
        Node lru = tail.prev;
        removeNode(lru);
        return lru;
    }
}
```

### Complexity
- **Time:** O(1) for both get and put
- **Space:** O(capacity)

---

## Problem 7: Detect Cycle in Directed Graph ⭐⭐

**LeetCode:** [LC 207 - Course Schedule](https://leetcode.com/problems/course-schedule/)  
**Difficulty:** Medium  
**Pattern:** Graph (DFS with Coloring)

### Problem Statement
Determine if you can finish all courses given prerequisites (detect cycle in directed graph).

### Solution (Java)

```java
class Solution {
    public boolean canFinish(int numCourses, int[][] prerequisites) {
        // Build adjacency list
        List<List<Integer>> graph = new ArrayList<>();
        for (int i = 0; i < numCourses; i++) {
            graph.add(new ArrayList<>());
        }
        for (int[] prereq : prerequisites) {
            graph.get(prereq[1]).add(prereq[0]);
        }
        
        // 0 = unvisited, 1 = visiting (in current path), 2 = visited
        int[] state = new int[numCourses];
        
        for (int i = 0; i < numCourses; i++) {
            if (hasCycle(i, graph, state)) {
                return false; // Cycle detected
            }
        }
        
        return true;
    }
    
    private boolean hasCycle(int node, List<List<Integer>> graph, int[] state) {
        if (state[node] == 1) return true;  // Back edge - cycle!
        if (state[node] == 2) return false; // Already processed
        
        state[node] = 1; // Mark as visiting
        
        for (int neighbor : graph.get(node)) {
            if (hasCycle(neighbor, graph, state)) {
                return true;
            }
        }
        
        state[node] = 2; // Mark as visited
        return false;
    }
}
```

### Key Concept: Three-Color DFS
- **White (0):** Unvisited
- **Gray (1):** Currently in recursion stack (visiting)
- **Black (2):** Completely processed

A **cycle exists** if we encounter a **gray node** while exploring.

---

## Problem 8: Two Sum ⭐⭐

**LeetCode:** [LC 1](https://leetcode.com/problems/two-sum/)  
**Difficulty:** Easy  
**Pattern:** HashMap

### Solution (Java)

```java
class Solution {
    public int[] twoSum(int[] nums, int target) {
        Map<Integer, Integer> map = new HashMap<>();
        
        for (int i = 0; i < nums.length; i++) {
            int complement = target - nums[i];
            
            if (map.containsKey(complement)) {
                return new int[]{map.get(complement), i};
            }
            
            map.put(nums[i], i);
        }
        
        return new int[]{-1, -1}; // No solution found
    }
}
```

### Complexity
- **Time:** O(n)
- **Space:** O(n)

---

## Problem 9: Longest Palindromic Substring ⭐⭐

**LeetCode:** [LC 5](https://leetcode.com/problems/longest-palindromic-substring/)  
**Difficulty:** Medium  
**Pattern:** Expand Around Center / DP

### Solution (Java) - Expand Around Center

```java
class Solution {
    public String longestPalindrome(String s) {
        if (s == null || s.length() < 1) return "";
        
        int start = 0, maxLen = 0;
        
        for (int i = 0; i < s.length(); i++) {
            // Odd length palindrome
            int len1 = expandAroundCenter(s, i, i);
            // Even length palindrome
            int len2 = expandAroundCenter(s, i, i + 1);
            
            int len = Math.max(len1, len2);
            
            if (len > maxLen) {
                maxLen = len;
                start = i - (len - 1) / 2;
            }
        }
        
        return s.substring(start, start + maxLen);
    }
    
    private int expandAroundCenter(String s, int left, int right) {
        while (left >= 0 && right < s.length() && s.charAt(left) == s.charAt(right)) {
            left--;
            right++;
        }
        return right - left - 1;
    }
}
```

### Complexity
- **Time:** O(n²)
- **Space:** O(1)

---

## Problem 10: Fibonacci Number ⭐⭐

**LeetCode:** [LC 509](https://leetcode.com/problems/fibonacci-number/)  
**Difficulty:** Easy  
**Pattern:** DP / Memoization

### Multiple Approaches

```java
class Solution {
    // Approach 1: Recursion with Memoization
    public int fibMemo(int n) {
        int[] memo = new int[n + 1];
        Arrays.fill(memo, -1);
        return helper(n, memo);
    }
    
    private int helper(int n, int[] memo) {
        if (n <= 1) return n;
        if (memo[n] != -1) return memo[n];
        memo[n] = helper(n - 1, memo) + helper(n - 2, memo);
        return memo[n];
    }
    
    // Approach 2: Bottom-up DP (Space Optimized)
    public int fibDP(int n) {
        if (n <= 1) return n;
        
        int prev2 = 0, prev1 = 1;
        
        for (int i = 2; i <= n; i++) {
            int curr = prev1 + prev2;
            prev2 = prev1;
            prev1 = curr;
        }
        
        return prev1;
    }
}
```

### Complexity Comparison

| Approach | Time | Space |
|----------|------|-------|
| Naive Recursion | O(2^n) | O(n) |
| Memoization | O(n) | O(n) |
| Bottom-up DP | O(n) | O(1) ✓ |

---

## 🎯 Additional Must-Practice Problems

### Arrays & Hashing
| Problem | Difficulty | Link |
|---------|------------|------|
| Contains Duplicate | Easy | [LC 217](https://leetcode.com/problems/contains-duplicate/) |
| Product of Array Except Self | Medium | [LC 238](https://leetcode.com/problems/product-of-array-except-self/) |
| Valid Anagram | Easy | [LC 242](https://leetcode.com/problems/valid-anagram/) |
| Group Anagrams | Medium | [LC 49](https://leetcode.com/problems/group-anagrams/) |

### Sliding Window
| Problem | Difficulty | Link |
|---------|------------|------|
| Best Time to Buy and Sell Stock | Easy | [LC 121](https://leetcode.com/problems/best-time-to-buy-and-sell-stock/) |
| Longest Substring Without Repeating | Medium | [LC 3](https://leetcode.com/problems/longest-substring-without-repeating-characters/) |
| Minimum Window Substring | Hard | [LC 76](https://leetcode.com/problems/minimum-window-substring/) |

### Trees
| Problem | Difficulty | Link |
|---------|------------|------|
| Invert Binary Tree | Easy | [LC 226](https://leetcode.com/problems/invert-binary-tree/) |
| Maximum Depth of Binary Tree | Easy | [LC 104](https://leetcode.com/problems/maximum-depth-of-binary-tree/) |
| Validate BST | Medium | [LC 98](https://leetcode.com/problems/validate-binary-search-tree/) |
| Lowest Common Ancestor | Medium | [LC 236](https://leetcode.com/problems/lowest-common-ancestor-of-a-binary-tree/) |

### Dynamic Programming
| Problem | Difficulty | Link |
|---------|------------|------|
| Climbing Stairs | Easy | [LC 70](https://leetcode.com/problems/climbing-stairs/) |
| House Robber | Medium | [LC 198](https://leetcode.com/problems/house-robber/) |
| Coin Change | Medium | [LC 322](https://leetcode.com/problems/coin-change/) |
| Longest Common Subsequence | Medium | [LC 1143](https://leetcode.com/problems/longest-common-subsequence/) |

---

## 📝 Pattern Recognition Cheat Sheet

| Pattern | When to Use | Example Problems |
|---------|-------------|------------------|
| **Two Pointers** | Sorted array, in-place modifications | Reverse String, Two Sum II |
| **Sliding Window** | Subarray/substring optimization | Max Sum Subarray of Size K |
| **HashMap** | Frequency counting, lookup optimization | Two Sum, Anagrams |
| **Binary Search** | Sorted array, search space reduction | First/Last Position |
| **BFS** | Shortest path, level order | Level Order Traversal |
| **DFS** | Path finding, exhaustive search | Cycle Detection |
| **Dynamic Programming** | Overlapping subproblems, optimal substructure | LIS, Fibonacci |
| **Greedy** | Local optimal = Global optimal | Kadane's Algorithm |

---

**Good luck with your preparation! 🍀**
