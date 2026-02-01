[🏠 Home](../../README.md) | [⬅️ Intervals](../14-intervals/00-overview.md) | [➡️ Interview Q&A](../16-interview-qa.md)

# 0101 Bit Manipulation

> Low-level binary operations for optimization

---

## 🎯 When to Use

| Clue | Operation |
|------|-----------|
| "Unique number" | XOR (`^`) |
| "Count 1 bits" | `n & (n-1)` |
| "Power of 2" | `n & (n-1) == 0` |
| "Set/Get bit" | `|` and `&` |
| "Divide/Multiply by 2" | `>> 1` and `<< 1` |

---

## 🔧 Core Operations

```java
// 1. Get bit at i
boolean getBit(int n, int i) {
    return (n & (1 << i)) != 0;
}

// 2. Set bit at i
int setBit(int n, int i) {
    return n | (1 << i);
}

// 3. Clear bit at i
int clearBit(int n, int i) {
    return n & ~(1 << i);
}

// 4. Update bit at i to v (0 or 1)
int updateBit(int n, int i, int v) {
    int mask = ~(1 << i);
    return (n & mask) | (v << i);
}
```

---

## 💻 Core Problems

### Problem 1: Single Number

```java
// Every number appears twice except one
// a ^ a = 0, a ^ 0 = a
public int singleNumber(int[] nums) {
    int count = 0;
    for (int n : nums) {
        count ^= n;
    }
    return count;
}
```

### Problem 2: Number of 1 Bits (Hamming Weight)

```java
public int hammingWeight(int n) {
    int count = 0;
    while (n != 0) {
        n = n & (n - 1);  // Removes last set bit (Brian Kernighan's Algorithm)
        count++;
    }
    return count;
}
```

### Problem 3: Counting Bits

```java
// Count bits for all numbers 0 to n
// dp[i] = dp[i >> 1] + (i & 1)
public int[] countBits(int n) {
    int[] ans = new int[n + 1];
    for (int i = 1; i <= n; i++) {
        ans[i] = ans[i >> 1] + (i & 1);
    }
    return ans;
}
```

---

## 📝 Practice Problems

| # | Problem | Difficulty | Link | Key Insight |
|---|---------|------------|------|-------------|
| 1 | Single Number | 🟢 Easy | [LeetCode](https://leetcode.com/problems/single-number/) | XOR |
| 2 | Number of 1 Bits | 🟢 Easy | [LeetCode](https://leetcode.com/problems/number-of-1-bits/) | n & (n-1) |
| 3 | Counting Bits | 🟢 Easy | [LeetCode](https://leetcode.com/problems/counting-bits/) | DP + Bits |
| 4 | Reverse Bits | 🟢 Easy | [LeetCode](https://leetcode.com/problems/reverse-bits/) | Shift |
| 5 | Sum of Two Integers | 🟡 Medium | [LeetCode](https://leetcode.com/problems/sum-of-two-integers/) | Bits Adder |

---

*Next: [Interview Q&A →](../16-interview-qa.md)*
