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

## 🧠 WHY Bit Manipulation is Powerful: Developer's Guide

> **🎯 For Beginners:** Bits are the computer's native language. Bit tricks = O(1) operations that feel like magic!

### The Core Insight: XOR is Your Best Friend

```
XOR (^) Properties:

  a ^ 0 = a     (XOR with 0 keeps the value)
  a ^ a = 0     (XOR with itself cancels out)
  a ^ b = b ^ a (commutative)
  
Why this matters for "Single Number":

  nums = [4, 1, 2, 1, 2]
  
  XOR all: 4 ^ 1 ^ 2 ^ 1 ^ 2
         = 4 ^ (1 ^ 1) ^ (2 ^ 2)
         = 4 ^ 0 ^ 0
         = 4  ← The unique number!
         
  Pairs cancel out, singleton remains!
  Time: O(n), Space: O(1)
```

### The n & (n-1) Trick: Removing Rightmost 1

```
Why does n & (n-1) remove the rightmost set bit?

  n = 12      →  1100
  n - 1 = 11  →  1011
                 ----
  n & (n-1)   →  1000  (rightmost 1 is gone!)
  
  What happened?
  - Subtracting 1 flips all bits from rightmost 1 onwards
  - AND operation keeps only the unchanged bits
  
Use case: Count set bits (Hamming Weight)
  
  12 → 1100 → count++
   8 → 1000 → count++
   0 → 0000 → stop
   
  Done in O(number of 1s), not O(32)!
```

### Power of 2: The Elegant Check

```
A number is power of 2 if it has exactly ONE set bit:

  1  = 0001  ✓
  2  = 0010  ✓
  4  = 0100  ✓
  8  = 1000  ✓
  3  = 0011  ✗ (two 1s)
  
Test: n & (n-1) == 0

  8 = 1000
  7 = 0111
  --------
      0000  ← Only one 1, so result is 0 → Power of 2!
      
  6 = 0110
  5 = 0101
  --------
      0100  ← Non-zero → NOT power of 2
```

### Bit Manipulation Cheat Sheet

```
Operation              |  Code            |  Example (n=5=0101)
-----------------------|------------------|---------------------
Get bit at i           |  (n >> i) & 1    |  bit 0: (5>>0)&1 = 1
Set bit at i           |  n | (1 << i)    |  set 1: 5|(1<<1) = 7
Clear bit at i         |  n & ~(1 << i)   |  clear 0: 5&~1 = 4
Toggle bit at i        |  n ^ (1 << i)    |  toggle 2: 5^4 = 1
Check if power of 2    |  n & (n-1) == 0  |  5&4 = 4 ≠ 0 → No
Get lowest set bit     |  n & (-n)        |  5 & -5 = 1
Clear lowest set bit   |  n & (n-1)       |  5 & 4 = 4
```

### When to Think "Bits"?

```
🧠 Problem signals for bit manipulation:

1. "Find the unique/single element"
   → XOR all elements

2. "Count bits" or "Hamming distance"
   → n & (n-1) trick

3. "Power of 2" check
   → n & (n-1) == 0

4. "Subset generation"
   → Use bitmask (each bit = include/exclude)

5. Space constraint (O(1) extra space)
   → Bits can pack multiple booleans

6. "Swap without temp"
   → a ^= b; b ^= a; a ^= b;
```

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
