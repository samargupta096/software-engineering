[🏠 Home](../../README.md) | [⬅️ Dynamic Programming](../12-dynamic-programming/00-overview.md) | [➡️ Intervals](../14-intervals/00-overview.md)

# 🤑 Greedy Pattern

> Making locally optimal choices for global optimum

---

## 🎯 When to Use

| Clue | Approach |
|------|----------|
| "Max/Min elements" | Sort + Pick best |
| "Activity selection" | Sort by end time |
| "Partition labels" | Furthest reach |
| "Jump Game" | Max reach so far |
| "Gas Station" | Current tank balance |

**Key**: Unlike DP, Greedy never looks back. Once a choice is made, it's final.

---

## 💻 Core Problems

### Problem 1: Maximum Subarray (Kadane's Algorithm)

```java
// Keep adding unless sum becomes negative
public int maxSubArray(int[] nums) {
    int currentSum = 0;
    int maxSum = nums[0];
    
    for (int num : nums) {
        if (currentSum < 0) {
            currentSum = 0;  // Reset if negative
        }
        currentSum += num;
        maxSum = Math.max(maxSum, currentSum);
    }
    return maxSum;
}
```

### Problem 2: Jump Game

```java
// Can you reach the last index?
public boolean canJump(int[] nums) {
    int maxReach = 0;
    
    for (int i = 0; i < nums.length; i++) {
        if (i > maxReach) return false;  // Stuck
        maxReach = Math.max(maxReach, i + nums[i]);
    }
    return true;
}
```

### Problem 3: Gas Station

```java
// Find valid starting station
public int canCompleteCircuit(int[] gas, int[] cost) {
    int totalGas = 0, totalCost = 0;
    for (int i = 0; i < gas.length; i++) {
        totalGas += gas[i];
        totalCost += cost[i];
    }
    if (totalGas < totalCost) return -1;
    
    int tank = 0;
    int start = 0;
    
    for (int i = 0; i < gas.length; i++) {
        tank += gas[i] - cost[i];
        if (tank < 0) {
            start = i + 1;  // Fail, try next
            tank = 0;
        }
    }
    return start;
}
```

### Problem 4: Partition Labels

```java
// Partition "ababcbacadefegdehijhklij" into parts
public List<Integer> partitionLabels(String s) {
    int[] lastIndex = new int[26];
    for (int i = 0; i < s.length(); i++) {
        lastIndex[s.charAt(i) - 'a'] = i;
    }
    
    List<Integer> result = new ArrayList<>();
    int start = 0, end = 0;
    
    for (int i = 0; i < s.length(); i++) {
        end = Math.max(end, lastIndex[s.charAt(i) - 'a']);
        
        if (i == end) {
            result.add(end - start + 1);
            start = i + 1;
        }
    }
    return result;
}
```

---

## 📝 Practice Problems

| # | Problem | Difficulty | Link | Key Insight |
|---|---------|------------|------|-------------|
| 1 | Max Subarray | 🟡 Medium | [LeetCode](https://leetcode.com/problems/maximum-subarray/) | Kadane's |
| 2 | Jump Game | 🟡 Medium | [LeetCode](https://leetcode.com/problems/jump-game/) | Max reach |
| 3 | Jump Game II | 🟡 Medium | [LeetCode](https://leetcode.com/problems/jump-game-ii/) | BFS/Greedy |
| 4 | Gas Station | 🟡 Medium | [LeetCode](https://leetcode.com/problems/gas-station/) | Total sum check |
| 5 | Hand of Straights | 🟡 Medium | [LeetCode](https://leetcode.com/problems/hand-of-straights/) | Min heap / TreeMap |

---

*Next: [Intervals →](../14-intervals/00-overview.md)*
