# 🧩 Dynamic Programming Mastery for Java Developers

> **The Complete DP Pattern Guide with Java Solutions**

---

## 📋 Table of Contents

1. [DP Fundamentals](#dp-fundamentals)
2. [Pattern 1: Linear DP](#pattern-1-linear-dp)
3. [Pattern 2: Grid DP](#pattern-2-grid-dp)
4. [Pattern 3: Knapsack Variants](#pattern-3-knapsack-variants)
5. [Pattern 4: String DP (LCS Family)](#pattern-4-string-dp-lcs-family)
6. [Pattern 5: Interval DP](#pattern-5-interval-dp)
7. [Pattern 6: State Machine DP](#pattern-6-state-machine-dp)
8. [Pattern 7: DP on Trees](#pattern-7-dp-on-trees)
9. [Pattern 8: Bitmask DP](#pattern-8-bitmask-dp)
10. [Top 50 DP Problems](#-top-50-dp-problems)

---

## DP Fundamentals

### When to Use DP?

```
┌─────────────────────────────────────────────────────────────┐
│                    DP IDENTIFICATION CHECKLIST              │
├─────────────────────────────────────────────────────────────┤
│  ✅ Optimal substructure - Solution uses solutions of       │
│     smaller subproblems                                     │
│                                                             │
│  ✅ Overlapping subproblems - Same subproblems solved       │
│     multiple times                                          │
│                                                             │
│  ✅ Keywords: "minimum", "maximum", "count ways",           │
│     "is it possible", "longest", "shortest"                 │
└─────────────────────────────────────────────────────────────┘
```

### DP Approach Framework

```java
// Step 1: Define state - What parameters define a subproblem?
// Step 2: Define recurrence - How do states relate?
// Step 3: Define base cases - What are the smallest subproblems?
// Step 4: Define computation order - Bottom-up or top-down?
// Step 5: Optimize space if possible
```

### Top-Down vs Bottom-Up

```java
// TOP-DOWN (Memoization) - Recursive with cache
public int fib(int n, int[] memo) {
    if (n <= 1) return n;
    if (memo[n] != 0) return memo[n];
    return memo[n] = fib(n - 1, memo) + fib(n - 2, memo);
}

// BOTTOM-UP (Tabulation) - Iterative with table
public int fib(int n) {
    if (n <= 1) return n;
    int[] dp = new int[n + 1];
    dp[1] = 1;
    for (int i = 2; i <= n; i++) {
        dp[i] = dp[i-1] + dp[i-2];
    }
    return dp[n];
}

// SPACE-OPTIMIZED - When only previous states needed
public int fib(int n) {
    if (n <= 1) return n;
    int prev2 = 0, prev1 = 1;
    for (int i = 2; i <= n; i++) {
        int curr = prev1 + prev2;
        prev2 = prev1;
        prev1 = curr;
    }
    return prev1;
}
```

---

## Pattern 1: Linear DP

> **State:** `dp[i]` = answer for subproblem ending at or considering index `i`

### 1.1 Climbing Stairs Family

```java
// Classic: How many ways to reach step n?
public int climbStairs(int n) {
    if (n <= 2) return n;
    int prev2 = 1, prev1 = 2;
    for (int i = 3; i <= n; i++) {
        int curr = prev1 + prev2;
        prev2 = prev1;
        prev1 = curr;
    }
    return prev1;
}

// Variant: Min cost climbing stairs
public int minCostClimbingStairs(int[] cost) {
    int n = cost.length;
    int prev2 = cost[0], prev1 = cost[1];
    for (int i = 2; i < n; i++) {
        int curr = cost[i] + Math.min(prev1, prev2);
        prev2 = prev1;
        prev1 = curr;
    }
    return Math.min(prev1, prev2);
}
```

### 1.2 House Robber Family

```java
// House Robber I - Can't rob adjacent houses
public int rob(int[] nums) {
    int prev2 = 0, prev1 = 0;
    for (int num : nums) {
        int curr = Math.max(prev1, prev2 + num);
        prev2 = prev1;
        prev1 = curr;
    }
    return prev1;
}

// House Robber II - Houses in circle
public int robCircular(int[] nums) {
    if (nums.length == 1) return nums[0];
    return Math.max(
        robRange(nums, 0, nums.length - 2),
        robRange(nums, 1, nums.length - 1)
    );
}

private int robRange(int[] nums, int start, int end) {
    int prev2 = 0, prev1 = 0;
    for (int i = start; i <= end; i++) {
        int curr = Math.max(prev1, prev2 + nums[i]);
        prev2 = prev1;
        prev1 = curr;
    }
    return prev1;
}

// House Robber III - Binary tree
public int robTree(TreeNode root) {
    int[] result = robHelper(root);
    return Math.max(result[0], result[1]);
}

private int[] robHelper(TreeNode node) {
    if (node == null) return new int[]{0, 0};
    
    int[] left = robHelper(node.left);
    int[] right = robHelper(node.right);
    
    // [0] = max when NOT robbing this node
    // [1] = max when robbing this node
    int notRob = Math.max(left[0], left[1]) + Math.max(right[0], right[1]);
    int rob = node.val + left[0] + right[0];
    
    return new int[]{notRob, rob};
}
```

### 1.3 Maximum Subarray (Kadane's Algorithm)

```java
// Maximum sum subarray
public int maxSubArray(int[] nums) {
    int maxSum = nums[0], currSum = nums[0];
    for (int i = 1; i < nums.length; i++) {
        currSum = Math.max(nums[i], currSum + nums[i]);
        maxSum = Math.max(maxSum, currSum);
    }
    return maxSum;
}

// Maximum product subarray
public int maxProduct(int[] nums) {
    int maxProd = nums[0], minProd = nums[0], result = nums[0];
    for (int i = 1; i < nums.length; i++) {
        if (nums[i] < 0) {
            int temp = maxProd;
            maxProd = minProd;
            minProd = temp;
        }
        maxProd = Math.max(nums[i], maxProd * nums[i]);
        minProd = Math.min(nums[i], minProd * nums[i]);
        result = Math.max(result, maxProd);
    }
    return result;
}
```

### 1.4 Longest Increasing Subsequence (LIS)

```java
// O(n²) DP Solution
public int lengthOfLIS(int[] nums) {
    int[] dp = new int[nums.length];
    Arrays.fill(dp, 1);
    int maxLen = 1;
    
    for (int i = 1; i < nums.length; i++) {
        for (int j = 0; j < i; j++) {
            if (nums[j] < nums[i]) {
                dp[i] = Math.max(dp[i], dp[j] + 1);
            }
        }
        maxLen = Math.max(maxLen, dp[i]);
    }
    return maxLen;
}

// O(n log n) Binary Search Solution ⭐
public int lengthOfLIS_Optimized(int[] nums) {
    List<Integer> tails = new ArrayList<>();
    
    for (int num : nums) {
        int pos = Collections.binarySearch(tails, num);
        if (pos < 0) pos = -(pos + 1);
        
        if (pos == tails.size()) {
            tails.add(num);
        } else {
            tails.set(pos, num);
        }
    }
    return tails.size();
}
```

---

## Pattern 2: Grid DP

> **State:** `dp[i][j]` = answer for cell (i, j)

### 2.1 Unique Paths

```java
// Count paths from top-left to bottom-right
public int uniquePaths(int m, int n) {
    int[] dp = new int[n];
    Arrays.fill(dp, 1);
    
    for (int i = 1; i < m; i++) {
        for (int j = 1; j < n; j++) {
            dp[j] += dp[j - 1];
        }
    }
    return dp[n - 1];
}

// With obstacles
public int uniquePathsWithObstacles(int[][] obstacleGrid) {
    int n = obstacleGrid[0].length;
    int[] dp = new int[n];
    dp[0] = 1;
    
    for (int[] row : obstacleGrid) {
        for (int j = 0; j < n; j++) {
            if (row[j] == 1) {
                dp[j] = 0;
            } else if (j > 0) {
                dp[j] += dp[j - 1];
            }
        }
    }
    return dp[n - 1];
}
```

### 2.2 Minimum Path Sum

```java
public int minPathSum(int[][] grid) {
    int m = grid.length, n = grid[0].length;
    int[] dp = new int[n];
    
    for (int i = 0; i < m; i++) {
        for (int j = 0; j < n; j++) {
            if (i == 0 && j == 0) {
                dp[j] = grid[0][0];
            } else if (i == 0) {
                dp[j] = dp[j - 1] + grid[i][j];
            } else if (j == 0) {
                dp[j] = dp[j] + grid[i][j];
            } else {
                dp[j] = Math.min(dp[j], dp[j - 1]) + grid[i][j];
            }
        }
    }
    return dp[n - 1];
}
```

### 2.3 Maximal Square

```java
public int maximalSquare(char[][] matrix) {
    int m = matrix.length, n = matrix[0].length;
    int[] dp = new int[n + 1];
    int maxSide = 0, prev = 0;
    
    for (int i = 1; i <= m; i++) {
        for (int j = 1; j <= n; j++) {
            int temp = dp[j];
            if (matrix[i-1][j-1] == '1') {
                dp[j] = Math.min(Math.min(dp[j-1], dp[j]), prev) + 1;
                maxSide = Math.max(maxSide, dp[j]);
            } else {
                dp[j] = 0;
            }
            prev = temp;
        }
    }
    return maxSide * maxSide;
}
```

---

## Pattern 3: Knapsack Variants

### 3.1 0/1 Knapsack

```java
// Classic: Each item can be used once
public int knapsack01(int[] weights, int[] values, int W) {
    int n = weights.length;
    int[] dp = new int[W + 1];
    
    for (int i = 0; i < n; i++) {
        for (int w = W; w >= weights[i]; w--) {  // Reverse order!
            dp[w] = Math.max(dp[w], dp[w - weights[i]] + values[i]);
        }
    }
    return dp[W];
}

// Partition Equal Subset Sum
public boolean canPartition(int[] nums) {
    int sum = Arrays.stream(nums).sum();
    if (sum % 2 != 0) return false;
    
    int target = sum / 2;
    boolean[] dp = new boolean[target + 1];
    dp[0] = true;
    
    for (int num : nums) {
        for (int j = target; j >= num; j--) {
            dp[j] = dp[j] || dp[j - num];
        }
    }
    return dp[target];
}

// Target Sum (+ and - signs)
public int findTargetSumWays(int[] nums, int target) {
    int sum = Arrays.stream(nums).sum();
    if ((sum + target) % 2 != 0 || sum < Math.abs(target)) return 0;
    
    int positiveSum = (sum + target) / 2;
    int[] dp = new int[positiveSum + 1];
    dp[0] = 1;
    
    for (int num : nums) {
        for (int j = positiveSum; j >= num; j--) {
            dp[j] += dp[j - num];
        }
    }
    return dp[positiveSum];
}
```

### 3.2 Unbounded Knapsack

```java
// Coin Change - Minimum coins
public int coinChange(int[] coins, int amount) {
    int[] dp = new int[amount + 1];
    Arrays.fill(dp, amount + 1);
    dp[0] = 0;
    
    for (int i = 1; i <= amount; i++) {
        for (int coin : coins) {
            if (coin <= i) {
                dp[i] = Math.min(dp[i], dp[i - coin] + 1);
            }
        }
    }
    return dp[amount] > amount ? -1 : dp[amount];
}

// Coin Change II - Count ways
public int coinChangeWays(int[] coins, int amount) {
    int[] dp = new int[amount + 1];
    dp[0] = 1;
    
    for (int coin : coins) {  // Coins in outer loop for unique combinations
        for (int i = coin; i <= amount; i++) {
            dp[i] += dp[i - coin];
        }
    }
    return dp[amount];
}

// Integer Break
public int integerBreak(int n) {
    int[] dp = new int[n + 1];
    dp[1] = 1;
    
    for (int i = 2; i <= n; i++) {
        for (int j = 1; j < i; j++) {
            dp[i] = Math.max(dp[i], Math.max(j, dp[j]) * Math.max(i - j, dp[i - j]));
        }
    }
    return dp[n];
}
```

### 3.3 Bounded Knapsack

```java
// Each item has limited quantity
public int boundedKnapsack(int[] weights, int[] values, int[] quantities, int W) {
    int[] dp = new int[W + 1];
    
    for (int i = 0; i < weights.length; i++) {
        for (int k = 0; k < quantities[i]; k++) {  // Use each item up to quantity times
            for (int w = W; w >= weights[i]; w--) {
                dp[w] = Math.max(dp[w], dp[w - weights[i]] + values[i]);
            }
        }
    }
    return dp[W];
}
```

---

## Pattern 4: String DP (LCS Family)

### 4.1 Longest Common Subsequence

```java
public int longestCommonSubsequence(String text1, String text2) {
    int m = text1.length(), n = text2.length();
    int[] dp = new int[n + 1];
    
    for (int i = 1; i <= m; i++) {
        int prev = 0;
        for (int j = 1; j <= n; j++) {
            int temp = dp[j];
            if (text1.charAt(i-1) == text2.charAt(j-1)) {
                dp[j] = prev + 1;
            } else {
                dp[j] = Math.max(dp[j], dp[j-1]);
            }
            prev = temp;
        }
    }
    return dp[n];
}
```

### 4.2 Edit Distance (Levenshtein)

```java
public int minDistance(String word1, String word2) {
    int m = word1.length(), n = word2.length();
    int[] dp = new int[n + 1];
    
    for (int j = 0; j <= n; j++) dp[j] = j;
    
    for (int i = 1; i <= m; i++) {
        int prev = dp[0];
        dp[0] = i;
        for (int j = 1; j <= n; j++) {
            int temp = dp[j];
            if (word1.charAt(i-1) == word2.charAt(j-1)) {
                dp[j] = prev;
            } else {
                dp[j] = 1 + Math.min(prev, Math.min(dp[j], dp[j-1]));
            }
            prev = temp;
        }
    }
    return dp[n];
}
```

### 4.3 Longest Palindromic Subsequence

```java
public int longestPalindromeSubseq(String s) {
    int n = s.length();
    int[] dp = new int[n];
    
    for (int i = n - 1; i >= 0; i--) {
        int[] newDp = new int[n];
        newDp[i] = 1;
        for (int j = i + 1; j < n; j++) {
            if (s.charAt(i) == s.charAt(j)) {
                newDp[j] = dp[j - 1] + 2;
            } else {
                newDp[j] = Math.max(dp[j], newDp[j - 1]);
            }
        }
        dp = newDp;
    }
    return dp[n - 1];
}
```

### 4.4 Distinct Subsequences

```java
public int numDistinct(String s, String t) {
    int m = s.length(), n = t.length();
    int[] dp = new int[n + 1];
    dp[0] = 1;
    
    for (int i = 1; i <= m; i++) {
        for (int j = n; j >= 1; j--) {  // Reverse to avoid overwriting
            if (s.charAt(i-1) == t.charAt(j-1)) {
                dp[j] += dp[j - 1];
            }
        }
    }
    return dp[n];
}
```

### 4.5 Word Break

```java
public boolean wordBreak(String s, List<String> wordDict) {
    Set<String> dict = new HashSet<>(wordDict);
    boolean[] dp = new boolean[s.length() + 1];
    dp[0] = true;
    
    for (int i = 1; i <= s.length(); i++) {
        for (int j = 0; j < i; j++) {
            if (dp[j] && dict.contains(s.substring(j, i))) {
                dp[i] = true;
                break;
            }
        }
    }
    return dp[s.length()];
}
```

---

## Pattern 5: Interval DP

> **State:** `dp[i][j]` = answer for interval [i, j]

### 5.1 Burst Balloons

```java
public int maxCoins(int[] nums) {
    int n = nums.length;
    int[] arr = new int[n + 2];
    arr[0] = arr[n + 1] = 1;
    for (int i = 0; i < n; i++) arr[i + 1] = nums[i];
    
    int[][] dp = new int[n + 2][n + 2];
    
    for (int len = 1; len <= n; len++) {
        for (int left = 1; left + len - 1 <= n; left++) {
            int right = left + len - 1;
            for (int k = left; k <= right; k++) {
                // k is the LAST balloon to burst in range [left, right]
                dp[left][right] = Math.max(dp[left][right],
                    dp[left][k-1] + arr[left-1] * arr[k] * arr[right+1] + dp[k+1][right]);
            }
        }
    }
    return dp[1][n];
}
```

### 5.2 Palindrome Partitioning II

```java
public int minCut(String s) {
    int n = s.length();
    boolean[][] isPalin = new boolean[n][n];
    int[] dp = new int[n];
    
    for (int i = 0; i < n; i++) {
        int minCut = i;  // Max cuts = i (each char is a partition)
        for (int j = 0; j <= i; j++) {
            if (s.charAt(j) == s.charAt(i) && (i - j < 2 || isPalin[j+1][i-1])) {
                isPalin[j][i] = true;
                minCut = (j == 0) ? 0 : Math.min(minCut, dp[j-1] + 1);
            }
        }
        dp[i] = minCut;
    }
    return dp[n - 1];
}
```

### 5.3 Matrix Chain Multiplication

```java
public int matrixChainMultiplication(int[] dims) {
    int n = dims.length - 1;  // Number of matrices
    int[][] dp = new int[n][n];
    
    for (int len = 2; len <= n; len++) {
        for (int i = 0; i + len - 1 < n; i++) {
            int j = i + len - 1;
            dp[i][j] = Integer.MAX_VALUE;
            for (int k = i; k < j; k++) {
                int cost = dp[i][k] + dp[k+1][j] + dims[i] * dims[k+1] * dims[j+1];
                dp[i][j] = Math.min(dp[i][j], cost);
            }
        }
    }
    return dp[0][n - 1];
}
```

---

## Pattern 6: State Machine DP

> **State:** `dp[i][state]` = answer at position i in given state

### 6.1 Best Time to Buy and Sell Stock Series

```java
// One transaction
public int maxProfit1(int[] prices) {
    int minPrice = Integer.MAX_VALUE, maxProfit = 0;
    for (int price : prices) {
        minPrice = Math.min(minPrice, price);
        maxProfit = Math.max(maxProfit, price - minPrice);
    }
    return maxProfit;
}

// Unlimited transactions
public int maxProfitUnlimited(int[] prices) {
    int profit = 0;
    for (int i = 1; i < prices.length; i++) {
        if (prices[i] > prices[i-1]) {
            profit += prices[i] - prices[i-1];
        }
    }
    return profit;
}

// At most k transactions
public int maxProfitK(int k, int[] prices) {
    if (prices.length == 0) return 0;
    
    if (k >= prices.length / 2) {
        return maxProfitUnlimited(prices);  // Unlimited case
    }
    
    int[][] dp = new int[k + 1][2];
    for (int i = 0; i <= k; i++) dp[i][1] = Integer.MIN_VALUE;
    
    for (int price : prices) {
        for (int j = 1; j <= k; j++) {
            dp[j][0] = Math.max(dp[j][0], dp[j][1] + price);  // Sell
            dp[j][1] = Math.max(dp[j][1], dp[j-1][0] - price);  // Buy
        }
    }
    return dp[k][0];
}

// With cooldown (must wait 1 day after selling)
public int maxProfitCooldown(int[] prices) {
    int sold = 0, held = Integer.MIN_VALUE, rest = 0;
    
    for (int price : prices) {
        int prevSold = sold;
        sold = held + price;         // Sell today
        held = Math.max(held, rest - price);  // Buy today or hold
        rest = Math.max(rest, prevSold);      // Rest today
    }
    return Math.max(sold, rest);
}

// With transaction fee
public int maxProfitWithFee(int[] prices, int fee) {
    int cash = 0, hold = -prices[0];
    
    for (int i = 1; i < prices.length; i++) {
        cash = Math.max(cash, hold + prices[i] - fee);  // Sell
        hold = Math.max(hold, cash - prices[i]);         // Buy
    }
    return cash;
}
```

---

## Pattern 7: DP on Trees

### 7.1 Tree Diameter

```java
int diameter = 0;

public int diameterOfBinaryTree(TreeNode root) {
    depth(root);
    return diameter;
}

private int depth(TreeNode node) {
    if (node == null) return 0;
    int left = depth(node.left);
    int right = depth(node.right);
    diameter = Math.max(diameter, left + right);
    return 1 + Math.max(left, right);
}
```

### 7.2 Binary Tree Maximum Path Sum

```java
int maxSum = Integer.MIN_VALUE;

public int maxPathSum(TreeNode root) {
    maxGain(root);
    return maxSum;
}

private int maxGain(TreeNode node) {
    if (node == null) return 0;
    
    int leftGain = Math.max(maxGain(node.left), 0);
    int rightGain = Math.max(maxGain(node.right), 0);
    
    maxSum = Math.max(maxSum, node.val + leftGain + rightGain);
    
    return node.val + Math.max(leftGain, rightGain);
}
```

---

## Pattern 8: Bitmask DP

> **State:** `dp[mask]` where mask represents subset of elements

### 8.1 Traveling Salesman Problem

```java
public int tsp(int[][] dist) {
    int n = dist.length;
    int[][] dp = new int[1 << n][n];
    for (int[] row : dp) Arrays.fill(row, Integer.MAX_VALUE / 2);
    dp[1][0] = 0;
    
    for (int mask = 1; mask < (1 << n); mask++) {
        for (int last = 0; last < n; last++) {
            if ((mask & (1 << last)) == 0) continue;
            
            for (int next = 0; next < n; next++) {
                if ((mask & (1 << next)) != 0) continue;
                int newMask = mask | (1 << next);
                dp[newMask][next] = Math.min(dp[newMask][next], 
                                              dp[mask][last] + dist[last][next]);
            }
        }
    }
    
    int ans = Integer.MAX_VALUE;
    for (int i = 1; i < n; i++) {
        ans = Math.min(ans, dp[(1 << n) - 1][i] + dist[i][0]);
    }
    return ans;
}
```

### 8.2 Partition to K Equal Subsets

```java
public boolean canPartitionKSubsets(int[] nums, int k) {
    int sum = Arrays.stream(nums).sum();
    if (sum % k != 0) return false;
    
    int target = sum / k;
    int n = nums.length;
    int[] dp = new int[1 << n];
    Arrays.fill(dp, -1);
    dp[0] = 0;
    
    for (int mask = 0; mask < (1 << n); mask++) {
        if (dp[mask] == -1) continue;
        
        for (int i = 0; i < n; i++) {
            if ((mask & (1 << i)) != 0) continue;
            if (dp[mask] + nums[i] <= target) {
                dp[mask | (1 << i)] = (dp[mask] + nums[i]) % target;
            }
        }
    }
    return dp[(1 << n) - 1] == 0;
}
```

---

## 🎯 Top 50 DP Problems

### Tier 1: Must Solve (25 Problems)

| # | Problem | Pattern | Difficulty |
|---|---------|---------|------------|
| 1 | Climbing Stairs | Linear | Easy |
| 2 | House Robber I/II/III | Linear | Medium |
| 3 | Maximum Subarray | Kadane | Medium |
| 4 | Coin Change | Unbounded Knapsack | Medium |
| 5 | Coin Change II | Unbounded Knapsack | Medium |
| 6 | Longest Increasing Subsequence | LIS | Medium |
| 7 | Longest Common Subsequence | LCS | Medium |
| 8 | Edit Distance | LCS Variant | Hard |
| 9 | Word Break | Linear + HashSet | Medium |
| 10 | Decode Ways | Linear | Medium |
| 11 | Unique Paths I/II | Grid | Medium |
| 12 | Minimum Path Sum | Grid | Medium |
| 13 | Longest Palindromic Substring | Interval/Expand | Medium |
| 14 | Palindromic Substrings | Interval | Medium |
| 15 | Partition Equal Subset Sum | 0/1 Knapsack | Medium |
| 16 | Target Sum | 0/1 Knapsack | Medium |
| 17 | Best Time Buy/Sell Stock (all) | State Machine | Easy-Hard |
| 18 | Jump Game I/II | Greedy/DP | Medium |
| 19 | Maximal Square | Grid | Medium |
| 20 | Longest Palindromic Subsequence | Interval | Medium |
| 21 | Interleaving String | 2D DP | Medium |
| 22 | Regular Expression Matching | 2D DP | Hard |
| 23 | Wildcard Matching | 2D DP | Hard |
| 24 | Distinct Subsequences | 2D DP | Hard |
| 25 | Burst Balloons | Interval | Hard |

### Tier 2: Advanced (25 Problems)

| # | Problem | Pattern | Difficulty |
|---|---------|---------|------------|
| 26 | Maximum Profit in Job Scheduling | DP + Binary Search | Hard |
| 27 | Longest Valid Parentheses | Linear/Stack | Hard |
| 28 | Super Egg Drop | Binary Search + DP | Hard |
| 29 | Stone Game I/II/III | Game Theory DP | Medium-Hard |
| 30 | Dungeon Game | Grid (Reverse) | Hard |
| 31 | Cherry Pickup | 3D Grid | Hard |
| 32 | Minimum Window Subsequence | 2D DP | Hard |
| 33 | Arithmetic Slices II | HashMap DP | Hard |
| 34 | Number of Longest Increasing Subsequence | LIS Variant | Medium |
| 35 | Russian Doll Envelopes | LIS 2D | Hard |
| 36 | Minimum Cost to Merge Stones | Interval | Hard |
| 37 | Scramble String | Interval/Memo | Hard |
| 38 | Frog Jump | HashMap + DP | Hard |
| 39 | Split Array Largest Sum | Binary Search + DP | Hard |
| 40 | Strange Printer | Interval | Hard |
| 41 | Tallest Billboard | Subset Sum Variant | Hard |
| 42 | Painting the Walls | Knapsack Variant | Hard |
| 43 | Minimum Cost to Cut a Stick | Interval | Hard |
| 44 | Count All Valid Pickup/Delivery | Combinatorics | Hard |
| 45 | Build Array Where You Can Find Max | Linear with Constraints | Hard |
| 46 | Minimum Falling Path Sum II | Grid | Hard |
| 47 | Minimum Cost Tree From Leaf Values | Interval/Stack | Medium |
| 48 | Count Vowels Permutation | State Machine | Hard |
| 49 | Profitable Schemes | 3D Knapsack | Hard |
| 50 | Minimum Difficulty of a Job Schedule | Interval-like | Hard |

---

## 🔑 Quick Reference: Pattern Identification

```
┌──────────────────────────────────────────────────────────────┐
│                   DP PATTERN DECISION TREE                   │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  "Minimum/Maximum of X"                                      │
│      └── Single array → Linear DP                            │
│      └── Two sequences → LCS family                          │
│      └── Grid → Grid DP                                      │
│                                                              │
│  "Count number of ways"                                      │
│      └── Combinatorics → Often Knapsack variant              │
│      └── Subset selection → 0/1 Knapsack                     │
│      └── Unlimited usage → Unbounded Knapsack                │
│                                                              │
│  "Yes/No possible"                                           │
│      └── Can we make target? → Subset Sum                    │
│      └── Can we partition? → Knapsack                        │
│                                                              │
│  Substrings/Ranges involved                                  │
│      └── [i, j] ranges → Interval DP                         │
│                                                              │
│  Multiple states/phases                                      │
│      └── Buy/Sell, Hold/Rest → State Machine                 │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

---

> **Pro Tip:** For interviews, know these 5 patterns deeply: **Linear DP, Grid DP, Knapsack, LCS, and State Machine**. These cover 90%+ of DP interview questions.

**Happy Coding! 🚀**
