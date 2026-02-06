# 🚀 DSA Mastery Guide for Senior Java Developers

> **Target Audience:** Senior Java Developers preparing for FAANG/Top-tier interviews  
> **Time Commitment:** 8-12 weeks (2-3 hours/day)

---

## 📋 Table of Contents

1. [Learning Path Overview](#-learning-path-overview)
2. [Phase 1: Foundations & Core Data Structures](#phase-1-foundations--core-data-structures-weeks-1-3)
3. [Phase 2: Advanced Data Structures](#phase-2-advanced-data-structures-weeks-4-5)
4. [Phase 3: Algorithm Paradigms](#phase-3-algorithm-paradigms-weeks-6-8)
5. [Phase 4: Advanced Patterns & Problem Solving](#phase-4-advanced-patterns--problem-solving-weeks-9-10)
6. [Phase 5: System Design Integration](#phase-5-system-design-integration-weeks-11-12)
7. [Java-Specific Best Practices](#-java-specific-best-practices)
8. [Resources & Practice Platforms](#-resources--practice-platforms)
9. [🎓 Understanding WHY - Beginner's Mathematical Guide](#-understanding-why---beginners-mathematical-guide)

---

## 🎓 Understanding WHY - Beginner's Mathematical Guide

> **🎯 This section is for beginners!** Before diving into patterns, let's understand WHY certain approaches are optimal. This knowledge will make you a master problem solver.

---

### 🤔 The Million Dollar Question: Why Do We Need Efficient Algorithms?

**Real-World Scenario:**
Imagine you have a list of 1 million users and need to find one user.

| Approach | Operations | Time (1μs each) |
|----------|-----------|-----------------|
| ❌ Naive (check each) | 1,000,000 | **1 second** |
| ✅ HashMap | 1 | **0.000001 second** |

**That's 1,000,000x faster!** 🚀

---

### 📊 Understanding Time Complexity with Real Numbers

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                   COMPLEXITY GROWTH VISUALIZATION                            │
│                                                                              │
│  Operations                                                                  │
│  (log scale)                                                                 │
│      │                                                                       │
│ 10^12│                                              O(n²) ← AVOID!          │
│      │                                           ╱                           │
│ 10^9 │                                        ╱                              │
│      │                                     ╱                                 │
│ 10^6 │                    O(n log n) ───────        ← OK for n ≤ 10^6       │
│      │                  ╱                                                    │
│ 10^3 │      O(n) ─────╱                          ← GOOD                     │
│      │    ╱                                                                  │
│ 10^0 │ O(1) ═══════════════════════════════════  ← BEST!                    │
│      └──────────────────────────────────────────────────────────────────────│
│           10    100   1000  10^4  10^5  10^6  10^7  10^8  10^9   n (input)  │
└─────────────────────────────────────────────────────────────────────────────┘
```

| n (input size) | O(1) | O(log n) | O(n) | O(n log n) | O(n²) |
|----------------|------|----------|------|------------|-------|
| 10 | 1 | 3 | 10 | 30 | 100 |
| 1,000 | 1 | 10 | 1,000 | 10,000 | 1,000,000 |
| 1,000,000 | 1 | 20 | 1,000,000 | 20,000,000 | **1,000,000,000,000** |

**Key Insight:** At n = 1,000,000, O(n²) needs **1 trillion** operations vs O(n)'s **1 million**!

---

### 🗺️ HashMap: The Magic of O(1) - Explained Simply

#### 🎯 The Problem HashMap Solves

**Task:** Find if "John" exists in a list of names.

**❌ Naive Approach (Array/List Search):**
```
Check "Alice" - NO
Check "Bob"   - NO
Check "Carol" - NO
... (997 more checks) ...
Check "John"  - YES! 

Total: 1000 checks for 1000 names = O(n)
```

**✅ HashMap Approach:**
```
Step 1: hash("John") = 7293847
Step 2: bucket_index = 7293847 % 16 = 7
Step 3: Look in bucket 7 → Found "John"!

Total: 3 operations regardless of size = O(1)
```

#### 🧠 Thought Process: How Does HashMap Work?

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       HOW HASHMAP ACHIEVES O(1)                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   Key: "John" ─────▶ hashCode() ─────▶ 7293847                              │
│                                            │                                 │
│                                            ▼                                 │
│                            bucket_index = 7293847 % 16 = 7                  │
│                                            │                                 │
│                                            ▼                                 │
│  Buckets Array:                                                              │
│  ┌───┬───┬───┬───┬───┬───┬───┬───┬───┬───┬───┬───┬───┬───┬───┬───┐         │
│  │ 0 │ 1 │ 2 │ 3 │ 4 │ 5 │ 6 │ 7 │ 8 │ 9 │10 │11 │12 │13 │14 │15 │         │
│  └───┴───┴───┴───┴───┴───┴───┴─┬─┴───┴───┴───┴───┴───┴───┴───┴───┘         │
│                                │                                             │
│                           ┌────▼────┐                                        │
│                           │  Node   │                                        │
│                           │("John") │ ◀── Direct access! No searching!      │
│                           └─────────┘                                        │
│                                                                              │
│  RESULT: O(1) - Constant time regardless of how many elements!              │
└─────────────────────────────────────────────────────────────────────────────┘
```

#### 📐 Mathematical Proof: Why O(1)?

```
Given:
- n = number of elements in HashMap
- b = number of buckets (typically 16, grows as needed)
- Load factor α = n/b (kept ≈ 0.75 by automatic resizing)

Time for lookup:
1. Hash computation: O(1) - just math on the key
2. Bucket access: O(1) - array index lookup
3. Chain traversal: O(α) ≈ O(0.75) ≈ O(1)

Total: O(1) + O(1) + O(1) = O(1) ✓

Key insight: HashMap maintains α ≤ 0.75 by DOUBLING buckets when full!
```

#### 💻 Code Comparison: See the Difference

```java
// ❌ NAIVE: O(n) - Gets slower as list grows
public boolean findInArray(String[] names, String target) {
    for (String name : names) {        // Loop through ALL elements
        if (name.equals(target)) {
            return true;
        }
    }
    return false;
}
// For 1 million names → 1 million comparisons!

// ✅ OPTIMAL: O(1) - Constant time always
public boolean findInHashSet(HashSet<String> names, String target) {
    return names.contains(target);     // ONE hash calculation + lookup
}
// For 1 million names → ~3 operations!
```

---

### 🎯 Two-Pointer Technique: Why O(n) Beats O(n²)

#### 🤔 Problem: Two Sum (Sorted Array)

Given sorted array `[1, 2, 7, 11, 15]` and target `9`, find two numbers that sum to 9.

#### ❌ Naive Approach: Nested Loops O(n²)

```
For each element i:
    For each element j > i:
        if arr[i] + arr[j] == target: return (i, j)

Trace for target = 9:
  i=0(1): j=1(2)→3, j=2(7)→8, j=3(11)→12, j=4(15)→16  [4 checks]
  i=1(2): j=2(7)→9 ✅ FOUND!                           [1 check]

Total: 5 checks (worst case for n=5: 10 checks)
```

**Mathematical Analysis:**
```
Number of pairs to check = n(n-1)/2

For n = 5:     5 × 4 / 2 = 10 pairs
For n = 100:   100 × 99 / 2 = 4,950 pairs
For n = 10,000: 10000 × 9999 / 2 = 49,995,000 pairs!
```

#### ✅ Two-Pointer Approach: O(n)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                  TWO-POINTER TECHNIQUE VISUALIZATION                         │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   Array (sorted): [1, 2, 7, 11, 15]    Target: 9                            │
│                                                                              │
│   Step 1:    [1, 2, 7, 11, 15]                                              │
│               ↑              ↑                                               │
│             left=0        right=4                                            │
│             sum = 1 + 15 = 16 > 9  →  right-- (reduce sum)                  │
│                                                                              │
│   Step 2:    [1, 2, 7, 11, 15]                                              │
│               ↑          ↑                                                   │
│             left=0    right=3                                                │
│             sum = 1 + 11 = 12 > 9  →  right-- (reduce sum)                  │
│                                                                              │
│   Step 3:    [1, 2, 7, 11, 15]                                              │
│               ↑      ↑                                                       │
│             left=0  right=2                                                  │
│             sum = 1 + 7 = 8 < 9  →  left++ (increase sum)                   │
│                                                                              │
│   Step 4:    [1, 2, 7, 11, 15]                                              │
│                  ↑   ↑                                                       │
│              left=1 right=2                                                  │
│              sum = 2 + 7 = 9 = 9  →  FOUND! return (1, 2)                   │
│                                                                              │
│   Total steps: 4 (vs naive: 5-10 for this example)                          │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Why Does This Work?**
```
Key Insight: In a SORTED array:
- If sum > target → we need smaller numbers → move RIGHT pointer left
- If sum < target → we need larger numbers → move LEFT pointer right
- Each move eliminates multiple possibilities at once!

Mathematical proof of correctness:
- When we skip a pair, we're not missing the answer
- If arr[left] + arr[right] > target:
  - arr[left] + arr[right-1] might work (we check this next)
  - arr[left+1] + arr[right] is EVEN LARGER (so we skip it correctly!)
```

**Time Comparison:**

| n | Naive O(n²) | Two-Pointer O(n) | Speedup |
|---|-------------|------------------|---------|
| 100 | 4,950 | 100 | **50x** |
| 10,000 | 49,995,000 | 10,000 | **5,000x** |
| 1,000,000 | 500,000,000,000 | 1,000,000 | **500,000x** |

---

### 🪟 Sliding Window: Why O(n) Beats O(n×k)

#### 🤔 Problem: Maximum Sum of K Consecutive Elements

Given array `[2, 1, 5, 1, 3, 2]` and k=3, find max sum of 3 consecutive elements.

#### ❌ Naive Approach: Recalculate Each Window O(n×k)

```
Window [0,1,2]: 2 + 1 + 5 = 8  (3 additions)
Window [1,2,3]: 1 + 5 + 1 = 7  (3 additions)
Window [2,3,4]: 5 + 1 + 3 = 9  (3 additions)  ← MAX
Window [3,4,5]: 1 + 3 + 2 = 6  (3 additions)

Total: 4 windows × 3 additions = 12 operations
```

#### ✅ Sliding Window: O(n)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    SLIDING WINDOW TECHNIQUE                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   Array: [2, 1, 5, 1, 3, 2]    k = 3                                        │
│                                                                              │
│   Step 1: Build initial window                                               │
│           [2, 1, 5, 1, 3, 2]                                                │
│            └──────┘                                                          │
│           sum = 2 + 1 + 5 = 8                                               │
│                                                                              │
│   Step 2: SLIDE - Remove old, Add new (just 2 operations!)                  │
│           [2, 1, 5, 1, 3, 2]                                                │
│           -2     └──────┘ +1                                                │
│           sum = 8 - 2 + 1 = 7                                               │
│                                                                              │
│   Step 3: SLIDE again                                                        │
│           [2, 1, 5, 1, 3, 2]                                                │
│              -1     └──────┘ +3                                             │
│           sum = 7 - 1 + 3 = 9  ← MAX!                                       │
│                                                                              │
│   Step 4: SLIDE again                                                        │
│           [2, 1, 5, 1, 3, 2]                                                │
│                 -5     └──────┘ +2                                          │
│           sum = 9 - 5 + 2 = 6                                               │
│                                                                              │
│   Total: 3 (initial) + 3×2 (slides) = 9 operations                          │
│   Naive: 4 × 3 = 12 operations                                              │
│                                                                              │
│   For large k: HUGE savings!                                                 │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Mathematical Insight:**
```
Naive: For each of (n-k+1) windows, sum k elements = O(n × k)
Sliding: Build first window O(k) + slide (n-k) times × O(1) each = O(n)

For n = 1,000,000 and k = 1,000:
Naive:  1,000,000 × 1,000 = 1,000,000,000 operations
Sliding: 1,000,000 + 999,000 = ~2,000,000 operations

That's 500x faster! 🚀
```

---

### 📊 Prefix Sum: Precomputation Magic

#### 🤔 Problem: Query Sum of Any Subarray Multiple Times

Given array `[3, 1, 4, 1, 5, 9, 2, 6]`, answer 100 queries like "sum from index 2 to 5".

#### ❌ Naive: Compute Each Query O(n)

```
Query sum(2,5): 4 + 1 + 5 + 9 = 19  (4 additions)
Query sum(0,3): 3 + 1 + 4 + 1 = 9   (4 additions)
... 98 more queries ...

Total: 100 queries × ~4 additions = 400 operations
For larger array (n=10000) with 1000 queries: 10,000,000 operations!
```

#### ✅ Prefix Sum: Precompute Once, Query O(1)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                     PREFIX SUM PRECOMPUTATION                                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   Original array:        [3, 1, 4, 1, 5, 9, 2, 6]                           │
│   Index:                  0  1  2  3  4  5  6  7                            │
│                                                                              │
│   Prefix sum array:   [0, 3, 4, 8, 9, 14, 23, 25, 31]                       │
│   Index:               0  1  2  3  4  5   6   7   8                         │
│                                                                              │
│   prefix[i] = sum of all elements from index 0 to i-1                       │
│                                                                              │
│   Query: sum(2, 5) = ?                                                       │
│                                                                              │
│   Formula: sum(left, right) = prefix[right+1] - prefix[left]                │
│                                                                              │
│   Calculation:                                                               │
│   sum(2, 5) = prefix[6] - prefix[2]                                         │
│             = 23 - 4 = 19 ✓                                                 │
│                                                                              │
│   Just ONE subtraction! O(1)                                                 │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Why This Works (Visual Proof):**
```
Original: [3, 1, 4, 1, 5, 9, 2, 6]
           └─────────────────────┘
prefix[6] = 3 + 1 + 4 + 1 + 5 + 9 = 23 (sum up to index 5)

           └──┘
prefix[2] = 3 + 1 = 4 (sum up to index 1)

sum(2,5) = prefix[6] - prefix[2]
         = (3+1+4+1+5+9) - (3+1)
         = 4 + 1 + 5 + 9 = 19  ✓

The subtraction "cancels out" the unwanted prefix!
```

---

### 🎯 Key Takeaways for Beginners

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         PATTERN SELECTION GUIDE                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  "I need to find something quickly"                                          │
│       └──▶ HashMap/HashSet (O(1) lookup)                                    │
│                                                                              │
│  "I have a SORTED array and need pairs"                                      │
│       └──▶ Two Pointers (O(n) instead of O(n²))                             │
│                                                                              │
│  "I need to calculate something over subarrays"                              │
│       └──▶ Sliding Window (O(n) instead of O(n×k))                          │
│                                                                              │
│  "I'll query the same data many times"                                       │
│       └──▶ Prefix Sum (O(1) per query after O(n) preprocessing)             │
│                                                                              │
│  "I see nested loops" → 🚨 RED FLAG! There's probably a better way!         │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 🗺️ Learning Path Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    DSA LEARNING ROADMAP                                  │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  Week 1-3        Week 4-5        Week 6-8        Week 9-10    Week 11-12│
│  ┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐   ┌─────────┐│
│  │ Arrays  │───▶│  Trees  │───▶│ Dynamic │───▶│ Advanced│──▶│ System  ││
│  │ Strings │    │  Heaps  │    │ Program │    │ Patterns│   │ Design  ││
│  │ HashMap │    │  Graphs │    │ Greedy  │    │ Practice│   │ + DSA   ││
│  │ Stack   │    │  Tries  │    │ Backtr. │    │         │   │         ││
│  │ Queue   │    │         │    │         │    │         │   │         ││
│  └─────────┘    └─────────┘    └─────────┘    └─────────┘   └─────────┘│
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Phase 1: Foundations & Core Data Structures (Weeks 1-3)

### Week 1: Arrays, Strings & Basic Patterns

#### 📚 Core Concepts

| Topic | Java Classes | Key Methods |
|-------|--------------|-------------|
| **Arrays** | `int[]`, `Arrays` | `sort()`, `binarySearch()`, `copyOf()` |
| **ArrayList** | `ArrayList<T>` | `add()`, `get()`, `set()`, `remove()` |
| **Strings** | `String`, `StringBuilder` | `charAt()`, `substring()`, `toCharArray()` |

#### 🎯 Essential Patterns

```java
// 1. Two Pointer Technique
public int[] twoSum(int[] nums, int target) {
    int left = 0, right = nums.length - 1;
    while (left < right) {
        int sum = nums[left] + nums[right];
        if (sum == target) return new int[]{left, right};
        else if (sum < target) left++;
        else right--;
    }
    return new int[]{-1, -1};
}

// 2. Sliding Window Pattern
public int maxSumSubarray(int[] arr, int k) {
    int windowSum = 0, maxSum = Integer.MIN_VALUE;
    for (int i = 0; i < arr.length; i++) {
        windowSum += arr[i];
        if (i >= k - 1) {
            maxSum = Math.max(maxSum, windowSum);
            windowSum -= arr[i - k + 1];
        }
    }
    return maxSum;
}

// 3. Prefix Sum Pattern
public int[] prefixSum(int[] arr) {
    int[] prefix = new int[arr.length + 1];
    for (int i = 0; i < arr.length; i++) {
        prefix[i + 1] = prefix[i] + arr[i];
    }
    return prefix;
}
```

#### ✅ Practice Problems (15 problems)

| # | Problem | Difficulty | Pattern | LeetCode Link |
|---|---------|------------|---------|---------------|
| 1 | Two Sum | Easy | HashMap | [#1](https://leetcode.com/problems/two-sum/) |
| 2 | Best Time to Buy and Sell Stock | Easy | Kadane's | [#121](https://leetcode.com/problems/best-time-to-buy-and-sell-stock/) |
| 3 | Contains Duplicate | Easy | HashSet | [#217](https://leetcode.com/problems/contains-duplicate/) |
| 4 | Product of Array Except Self | Medium | Prefix/Suffix | [#238](https://leetcode.com/problems/product-of-array-except-self/) |
| 5 | Maximum Subarray | Medium | Kadane's | [#53](https://leetcode.com/problems/maximum-subarray/) |
| 6 | 3Sum | Medium | Two Pointer | [#15](https://leetcode.com/problems/3sum/) |
| 7 | Container With Most Water | Medium | Two Pointer | [#11](https://leetcode.com/problems/container-with-most-water/) |
| 8 | Longest Substring Without Repeating | Medium | Sliding Window | [#3](https://leetcode.com/problems/longest-substring-without-repeating-characters/) |
| 9 | Valid Anagram | Easy | HashMap | [#242](https://leetcode.com/problems/valid-anagram/) |
| 10 | Group Anagrams | Medium | HashMap | [#49](https://leetcode.com/problems/group-anagrams/) |
| 11 | Valid Palindrome | Easy | Two Pointer | [#125](https://leetcode.com/problems/valid-palindrome/) |
| 12 | Longest Palindromic Substring | Medium | Expand Around Center | [#5](https://leetcode.com/problems/longest-palindromic-substring/) |
| 13 | Merge Intervals | Medium | Sorting | [#56](https://leetcode.com/problems/merge-intervals/) |
| 14 | Rotate Array | Medium | Reversal | [#189](https://leetcode.com/problems/rotate-array/) |
| 15 | Trapping Rain Water | Hard | Two Pointer/Stack | [#42](https://leetcode.com/problems/trapping-rain-water/) |

---

### Week 2: HashMap, HashSet & Hashing

#### 📚 Core Concepts

```java
// HashMap - O(1) average for get/put/remove
Map<String, Integer> map = new HashMap<>();
map.put("key", 1);
map.getOrDefault("key", 0);
map.computeIfAbsent("key", k -> new ArrayList<>());

// LinkedHashMap - Maintains insertion order
Map<String, Integer> lruCache = new LinkedHashMap<>(16, 0.75f, true);

// TreeMap - Sorted keys, O(log n) operations
TreeMap<Integer, String> treeMap = new TreeMap<>();
treeMap.floorKey(5);   // Greatest key <= 5
treeMap.ceilingKey(5); // Smallest key >= 5
```

#### 🎯 Advanced Hashing Patterns

```java
// 1. Frequency Counter Pattern
public int[] topKFrequent(int[] nums, int k) {
    Map<Integer, Integer> freq = new HashMap<>();
    for (int num : nums) {
        freq.merge(num, 1, Integer::sum);
    }
    
    return freq.entrySet().stream()
        .sorted((a, b) -> b.getValue() - a.getValue())
        .limit(k)
        .mapToInt(Map.Entry::getKey)
        .toArray();
}

// 2. Subarray Sum Pattern (Prefix Sum + HashMap)
public int subarraySum(int[] nums, int k) {
    Map<Integer, Integer> prefixCount = new HashMap<>();
    prefixCount.put(0, 1);
    int sum = 0, count = 0;
    
    for (int num : nums) {
        sum += num;
        count += prefixCount.getOrDefault(sum - k, 0);
        prefixCount.merge(sum, 1, Integer::sum);
    }
    return count;
}

// 3. Rolling Hash (Rabin-Karp)
public int strStr(String haystack, String needle) {
    long MOD = 1_000_000_007, BASE = 26;
    int n = needle.length();
    
    long needleHash = 0, windowHash = 0, pow = 1;
    for (int i = 0; i < n; i++) {
        needleHash = (needleHash * BASE + needle.charAt(i)) % MOD;
        windowHash = (windowHash * BASE + haystack.charAt(i)) % MOD;
        if (i > 0) pow = (pow * BASE) % MOD;
    }
    
    for (int i = 0; i <= haystack.length() - n; i++) {
        if (windowHash == needleHash) return i;
        if (i + n < haystack.length()) {
            windowHash = ((windowHash - haystack.charAt(i) * pow % MOD + MOD) * BASE 
                         + haystack.charAt(i + n)) % MOD;
        }
    }
    return -1;
}
```

#### ✅ Practice Problems (10 problems)

| # | Problem | Difficulty | Key Insight |
|---|---------|------------|-------------|
| 1 | Subarray Sum Equals K | Medium | Prefix Sum + HashMap |
| 2 | Longest Consecutive Sequence | Medium | HashSet |
| 3 | Top K Frequent Elements | Medium | HashMap + Heap/Bucket |
| 4 | LRU Cache | Medium | LinkedHashMap/Custom |
| 5 | First Unique Character | Easy | Frequency Map |
| 6 | Isomorphic Strings | Easy | Two HashMaps |
| 7 | Word Pattern | Easy | Bijection Check |
| 8 | Minimum Window Substring | Hard | Sliding Window + HashMap |
| 9 | Encode and Decode TinyURL | Medium | Bijective Hashing |
| 10 | Find All Anagrams | Medium | Fixed Sliding Window |

---

### Week 3: Stack, Queue & Monotonic Patterns

#### 📚 Core Data Structures

```java
// Stack - LIFO
Deque<Integer> stack = new ArrayDeque<>();
stack.push(1);        // addFirst
stack.pop();          // removeFirst
stack.peek();         // peekFirst

// Queue - FIFO
Queue<Integer> queue = new LinkedList<>();
queue.offer(1);       // add to tail
queue.poll();         // remove from head
queue.peek();         // view head

// Deque - Double-ended queue
Deque<Integer> deque = new ArrayDeque<>();
deque.addFirst(1);    deque.addLast(2);
deque.removeFirst();  deque.removeLast();

// PriorityQueue (Min-Heap by default)
PriorityQueue<Integer> minHeap = new PriorityQueue<>();
PriorityQueue<Integer> maxHeap = new PriorityQueue<>(Collections.reverseOrder());
```

#### 🎯 Monotonic Stack/Queue Patterns

```java
// 1. Next Greater Element Pattern
public int[] nextGreaterElement(int[] nums) {
    int n = nums.length;
    int[] result = new int[n];
    Deque<Integer> stack = new ArrayDeque<>();
    
    for (int i = n - 1; i >= 0; i--) {
        while (!stack.isEmpty() && stack.peek() <= nums[i]) {
            stack.pop();
        }
        result[i] = stack.isEmpty() ? -1 : stack.peek();
        stack.push(nums[i]);
    }
    return result;
}

// 2. Largest Rectangle in Histogram
public int largestRectangleInHistogram(int[] heights) {
    Deque<Integer> stack = new ArrayDeque<>();
    int maxArea = 0;
    
    for (int i = 0; i <= heights.length; i++) {
        int h = (i == heights.length) ? 0 : heights[i];
        while (!stack.isEmpty() && h < heights[stack.peek()]) {
            int height = heights[stack.pop()];
            int width = stack.isEmpty() ? i : i - stack.peek() - 1;
            maxArea = Math.max(maxArea, height * width);
        }
        stack.push(i);
    }
    return maxArea;
}

// 3. Sliding Window Maximum (Monotonic Deque)
public int[] maxSlidingWindow(int[] nums, int k) {
    Deque<Integer> deque = new ArrayDeque<>();
    int[] result = new int[nums.length - k + 1];
    
    for (int i = 0; i < nums.length; i++) {
        // Remove indices outside window
        while (!deque.isEmpty() && deque.peekFirst() < i - k + 1) {
            deque.pollFirst();
        }
        // Maintain decreasing order
        while (!deque.isEmpty() && nums[deque.peekLast()] < nums[i]) {
            deque.pollLast();
        }
        deque.offerLast(i);
        
        if (i >= k - 1) {
            result[i - k + 1] = nums[deque.peekFirst()];
        }
    }
    return result;
}
```

#### ✅ Practice Problems (10 problems)

| # | Problem | Difficulty | Pattern |
|---|---------|------------|---------|
| 1 | Valid Parentheses | Easy | Stack |
| 2 | Min Stack | Medium | Auxiliary Stack |
| 3 | Daily Temperatures | Medium | Monotonic Stack |
| 4 | Next Greater Element I/II | Medium | Monotonic Stack |
| 5 | Largest Rectangle in Histogram | Hard | Monotonic Stack |
| 6 | Sliding Window Maximum | Hard | Monotonic Deque |
| 7 | Implement Queue using Stacks | Easy | Two Stacks |
| 8 | Evaluate Reverse Polish Notation | Medium | Stack |
| 9 | Basic Calculator I/II | Hard | Stack + Parsing |
| 10 | Maximal Rectangle | Hard | DP + Monotonic Stack |

---

## Phase 2: Advanced Data Structures (Weeks 4-5)

### Week 4: Trees & Binary Search Trees

#### 📚 Tree Fundamentals

```java
// TreeNode Definition
class TreeNode {
    int val;
    TreeNode left, right;
    TreeNode(int val) { this.val = val; }
}

// Binary Search Tree Operations
class BST {
    public TreeNode insert(TreeNode root, int val) {
        if (root == null) return new TreeNode(val);
        if (val < root.val) root.left = insert(root.left, val);
        else root.right = insert(root.right, val);
        return root;
    }
    
    public TreeNode delete(TreeNode root, int val) {
        if (root == null) return null;
        if (val < root.val) root.left = delete(root.left, val);
        else if (val > root.val) root.right = delete(root.right, val);
        else {
            if (root.left == null) return root.right;
            if (root.right == null) return root.left;
            TreeNode successor = findMin(root.right);
            root.val = successor.val;
            root.right = delete(root.right, successor.val);
        }
        return root;
    }
    
    private TreeNode findMin(TreeNode node) {
        while (node.left != null) node = node.left;
        return node;
    }
}
```

#### 🎯 Tree Traversal Patterns

```java
// 1. DFS Traversals (Recursive)
public void inorder(TreeNode root, List<Integer> result) {
    if (root == null) return;
    inorder(root.left, result);
    result.add(root.val);
    inorder(root.right, result);
}

// 2. BFS / Level Order Traversal
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

// 3. Morris Traversal (O(1) space)
public List<Integer> morrisInorder(TreeNode root) {
    List<Integer> result = new ArrayList<>();
    TreeNode curr = root;
    
    while (curr != null) {
        if (curr.left == null) {
            result.add(curr.val);
            curr = curr.right;
        } else {
            TreeNode pred = curr.left;
            while (pred.right != null && pred.right != curr) {
                pred = pred.right;
            }
            
            if (pred.right == null) {
                pred.right = curr;
                curr = curr.left;
            } else {
                pred.right = null;
                result.add(curr.val);
                curr = curr.right;
            }
        }
    }
    return result;
}
```

#### ✅ Practice Problems (15 problems)

| # | Problem | Difficulty | Pattern |
|---|---------|------------|---------|
| 1 | Maximum Depth of Binary Tree | Easy | DFS |
| 2 | Same Tree | Easy | DFS Comparison |
| 3 | Invert Binary Tree | Easy | DFS/BFS |
| 4 | Binary Tree Level Order Traversal | Medium | BFS |
| 5 | Validate BST | Medium | Inorder Property |
| 6 | Lowest Common Ancestor (BST) | Medium | BST Property |
| 7 | Lowest Common Ancestor (BT) | Medium | Postorder DFS |
| 8 | Binary Tree Right Side View | Medium | BFS/DFS |
| 9 | Construct BT from Preorder/Inorder | Medium | Divide & Conquer |
| 10 | Serialize/Deserialize Binary Tree | Hard | BFS/DFS |
| 11 | Binary Tree Maximum Path Sum | Hard | Postorder DFS |
| 12 | Kth Smallest Element in BST | Medium | Inorder |
| 13 | Diameter of Binary Tree | Easy | Postorder DFS |
| 14 | Path Sum I/II/III | Easy-Hard | DFS + Prefix Sum |
| 15 | Balanced Binary Tree | Easy | Postorder DFS |

---

### Week 5: Heaps, Graphs & Advanced Trees

#### 📚 Heap Operations

```java
// Custom Comparator for Object-based Heaps
PriorityQueue<int[]> pq = new PriorityQueue<>((a, b) -> {
    if (a[0] != b[0]) return a[0] - b[0];  // Primary: ascending
    return b[1] - a[1];                      // Secondary: descending
});

// K-way Merge Pattern
public ListNode mergeKLists(ListNode[] lists) {
    PriorityQueue<ListNode> pq = new PriorityQueue<>(
        (a, b) -> a.val - b.val
    );
    
    for (ListNode head : lists) {
        if (head != null) pq.offer(head);
    }
    
    ListNode dummy = new ListNode(0), curr = dummy;
    while (!pq.isEmpty()) {
        ListNode node = pq.poll();
        curr.next = node;
        curr = curr.next;
        if (node.next != null) pq.offer(node.next);
    }
    return dummy.next;
}

// Median Finder (Two Heaps)
class MedianFinder {
    PriorityQueue<Integer> maxHeap = new PriorityQueue<>(Collections.reverseOrder());
    PriorityQueue<Integer> minHeap = new PriorityQueue<>();
    
    public void addNum(int num) {
        maxHeap.offer(num);
        minHeap.offer(maxHeap.poll());
        if (minHeap.size() > maxHeap.size()) {
            maxHeap.offer(minHeap.poll());
        }
    }
    
    public double findMedian() {
        if (maxHeap.size() > minHeap.size()) return maxHeap.peek();
        return (maxHeap.peek() + minHeap.peek()) / 2.0;
    }
}
```

#### 📚 Graph Fundamentals

```java
// Adjacency List Representation
Map<Integer, List<int[]>> graph = new HashMap<>();
// graph.get(node) = [(neighbor1, weight1), (neighbor2, weight2), ...]

// BFS Template
public int bfs(int[][] graph, int start, int target) {
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
            
            for (int neighbor : graph[node]) {
                if (!visited.contains(neighbor)) {
                    visited.add(neighbor);
                    queue.offer(neighbor);
                }
            }
        }
        level++;
    }
    return -1;
}

// DFS Template (Topological Sort)
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
    
    int[] order = new int[numCourses];
    int idx = 0;
    while (!queue.isEmpty()) {
        int course = queue.poll();
        order[idx++] = course;
        for (int next : graph.get(course)) {
            if (--inDegree[next] == 0) queue.offer(next);
        }
    }
    return idx == numCourses ? order : new int[0];
}

// Dijkstra's Algorithm
public int[] dijkstra(int[][] graph, int src) {
    int n = graph.length;
    int[] dist = new int[n];
    Arrays.fill(dist, Integer.MAX_VALUE);
    dist[src] = 0;
    
    PriorityQueue<int[]> pq = new PriorityQueue<>((a, b) -> a[1] - b[1]);
    pq.offer(new int[]{src, 0});
    
    while (!pq.isEmpty()) {
        int[] curr = pq.poll();
        int u = curr[0], d = curr[1];
        if (d > dist[u]) continue;
        
        for (int v = 0; v < n; v++) {
            if (graph[u][v] > 0 && dist[u] + graph[u][v] < dist[v]) {
                dist[v] = dist[u] + graph[u][v];
                pq.offer(new int[]{v, dist[v]});
            }
        }
    }
    return dist;
}
```

#### 📚 Union-Find (Disjoint Set)

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
    
    public int find(int x) {
        if (parent[x] != x) parent[x] = find(parent[x]); // Path compression
        return parent[x];
    }
    
    public boolean union(int x, int y) {
        int px = find(x), py = find(y);
        if (px == py) return false;
        
        // Union by rank
        if (rank[px] < rank[py]) { int temp = px; px = py; py = temp; }
        parent[py] = px;
        if (rank[px] == rank[py]) rank[px]++;
        components--;
        return true;
    }
    
    public int getComponents() { return components; }
}
```

#### ✅ Practice Problems (15 problems)

| # | Problem | Difficulty | Algorithm |
|---|---------|------------|-----------|
| 1 | Kth Largest Element | Medium | Quick Select/Heap |
| 2 | Merge K Sorted Lists | Hard | K-way Merge |
| 3 | Find Median from Data Stream | Hard | Two Heaps |
| 4 | Number of Islands | Medium | BFS/DFS/Union-Find |
| 5 | Clone Graph | Medium | BFS/DFS |
| 6 | Course Schedule I/II | Medium | Topological Sort |
| 7 | Pacific Atlantic Water Flow | Medium | Multi-source BFS |
| 8 | Graph Valid Tree | Medium | Union-Find/DFS |
| 9 | Redundant Connection | Medium | Union-Find |
| 10 | Network Delay Time | Medium | Dijkstra |
| 11 | Cheapest Flights Within K Stops | Medium | Bellman-Ford/BFS |
| 12 | Word Ladder | Hard | BFS |
| 13 | Accounts Merge | Medium | Union-Find |
| 14 | Critical Connections | Hard | Tarjan's Algorithm |
| 15 | Alien Dictionary | Hard | Topological Sort |

---

## Phase 3: Algorithm Paradigms (Weeks 6-8)

### Week 6: Binary Search & Divide and Conquer

#### 🎯 Binary Search Patterns

```java
// 1. Standard Binary Search
public int binarySearch(int[] arr, int target) {
    int left = 0, right = arr.length - 1;
    while (left <= right) {
        int mid = left + (right - left) / 2;
        if (arr[mid] == target) return mid;
        else if (arr[mid] < target) left = mid + 1;
        else right = mid - 1;
    }
    return -1;
}

// 2. Lower Bound (First position >= target)
public int lowerBound(int[] arr, int target) {
    int left = 0, right = arr.length;
    while (left < right) {
        int mid = left + (right - left) / 2;
        if (arr[mid] < target) left = mid + 1;
        else right = mid;
    }
    return left;
}

// 3. Binary Search on Answer Space
public int minEatingSpeed(int[] piles, int h) {
    int left = 1, right = Arrays.stream(piles).max().getAsInt();
    
    while (left < right) {
        int mid = left + (right - left) / 2;
        if (canFinish(piles, mid, h)) right = mid;
        else left = mid + 1;
    }
    return left;
}

private boolean canFinish(int[] piles, int speed, int h) {
    int hours = 0;
    for (int pile : piles) {
        hours += (pile + speed - 1) / speed;
    }
    return hours <= h;
}
```

#### ✅ Practice Problems (10 problems)

| # | Problem | Pattern |
|---|---------|---------|
| 1 | Binary Search | Classic |
| 2 | Search in Rotated Sorted Array | Modified BS |
| 3 | Find First and Last Position | Lower/Upper Bound |
| 4 | Search a 2D Matrix | 2D BS |
| 5 | Koko Eating Bananas | BS on Answer |
| 6 | Median of Two Sorted Arrays | BS on Partition |
| 7 | Split Array Largest Sum | BS on Answer |
| 8 | Find Peak Element | BS on Condition |
| 9 | Capacity To Ship Packages | BS on Answer |
| 10 | Find Minimum in Rotated Sorted Array | Modified BS |

---

### Week 7: Dynamic Programming

#### 🎯 DP Patterns & Templates

```java
// 1. 1D DP - Climbing Stairs Pattern
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

// 2. 2D DP - Grid Pattern
public int uniquePaths(int m, int n) {
    int[][] dp = new int[m][n];
    Arrays.fill(dp[0], 1);
    for (int i = 0; i < m; i++) dp[i][0] = 1;
    
    for (int i = 1; i < m; i++) {
        for (int j = 1; j < n; j++) {
            dp[i][j] = dp[i-1][j] + dp[i][j-1];
        }
    }
    return dp[m-1][n-1];
}

// 3. Knapsack Pattern (0/1)
public int knapsack(int[] weights, int[] values, int W) {
    int n = weights.length;
    int[][] dp = new int[n + 1][W + 1];
    
    for (int i = 1; i <= n; i++) {
        for (int w = 0; w <= W; w++) {
            dp[i][w] = dp[i-1][w];  // Don't take
            if (weights[i-1] <= w) {
                dp[i][w] = Math.max(dp[i][w], 
                    dp[i-1][w - weights[i-1]] + values[i-1]);  // Take
            }
        }
    }
    return dp[n][W];
}

// 4. LCS Pattern
public int longestCommonSubsequence(String s1, String s2) {
    int m = s1.length(), n = s2.length();
    int[][] dp = new int[m + 1][n + 1];
    
    for (int i = 1; i <= m; i++) {
        for (int j = 1; j <= n; j++) {
            if (s1.charAt(i-1) == s2.charAt(j-1)) {
                dp[i][j] = dp[i-1][j-1] + 1;
            } else {
                dp[i][j] = Math.max(dp[i-1][j], dp[i][j-1]);
            }
        }
    }
    return dp[m][n];
}

// 5. Interval DP Pattern
public int minCost(int[] stones) {
    int n = stones.length;
    int[] prefix = new int[n + 1];
    for (int i = 0; i < n; i++) prefix[i+1] = prefix[i] + stones[i];
    
    int[][] dp = new int[n][n];
    
    for (int len = 2; len <= n; len++) {
        for (int i = 0; i + len - 1 < n; i++) {
            int j = i + len - 1;
            dp[i][j] = Integer.MAX_VALUE;
            for (int k = i; k < j; k++) {
                dp[i][j] = Math.min(dp[i][j], 
                    dp[i][k] + dp[k+1][j] + prefix[j+1] - prefix[i]);
            }
        }
    }
    return dp[0][n-1];
}
```

#### ✅ Practice Problems (20 problems)

| # | Problem | Pattern | Difficulty |
|---|---------|---------|------------|
| 1 | Climbing Stairs | Fibonacci | Easy |
| 2 | House Robber I/II | Linear DP | Medium |
| 3 | Coin Change | Unbounded Knapsack | Medium |
| 4 | Longest Increasing Subsequence | LIS | Medium |
| 5 | Longest Common Subsequence | LCS | Medium |
| 6 | Edit Distance | LCS Variant | Hard |
| 7 | 0/1 Knapsack | Classic Knapsack | Medium |
| 8 | Partition Equal Subset Sum | Subset Sum | Medium |
| 9 | Target Sum | Subset Sum | Medium |
| 10 | Word Break | Linear DP + HashSet | Medium |
| 11 | Decode Ways | Linear DP | Medium |
| 12 | Unique Paths I/II | Grid DP | Medium |
| 13 | Minimum Path Sum | Grid DP | Medium |
| 14 | Maximum Square | Grid DP | Medium |
| 15 | Burst Balloons | Interval DP | Hard |
| 16 | Matrix Chain Multiplication | Interval DP | Hard |
| 17 | Palindrome Partitioning II | Interval DP | Hard |
| 18 | Longest Palindromic Subsequence | LCS Variant | Medium |
| 19 | Regular Expression Matching | 2D DP | Hard |
| 20 | Distinct Subsequences | 2D DP | Hard |

---

### Week 8: Greedy & Backtracking

#### 🎯 Greedy Patterns

```java
// 1. Interval Scheduling
public int eraseOverlapIntervals(int[][] intervals) {
    Arrays.sort(intervals, (a, b) -> a[1] - b[1]);  // Sort by end
    int count = 0, prevEnd = Integer.MIN_VALUE;
    
    for (int[] interval : intervals) {
        if (interval[0] >= prevEnd) {
            prevEnd = interval[1];
        } else {
            count++;
        }
    }
    return count;
}

// 2. Activity Selection / Meeting Rooms
public int minMeetingRooms(int[][] intervals) {
    int[] starts = new int[intervals.length];
    int[] ends = new int[intervals.length];
    
    for (int i = 0; i < intervals.length; i++) {
        starts[i] = intervals[i][0];
        ends[i] = intervals[i][1];
    }
    
    Arrays.sort(starts);
    Arrays.sort(ends);
    
    int rooms = 0, endPtr = 0;
    for (int start : starts) {
        if (start < ends[endPtr]) {
            rooms++;
        } else {
            endPtr++;
        }
    }
    return rooms;
}
```

#### 🎯 Backtracking Template

```java
// Generic Backtracking Template
public List<List<Integer>> subsets(int[] nums) {
    List<List<Integer>> result = new ArrayList<>();
    backtrack(nums, 0, new ArrayList<>(), result);
    return result;
}

private void backtrack(int[] nums, int start, List<Integer> path, 
                       List<List<Integer>> result) {
    result.add(new ArrayList<>(path));  // Add current subset
    
    for (int i = start; i < nums.length; i++) {
        path.add(nums[i]);           // Choose
        backtrack(nums, i + 1, path, result);  // Explore
        path.remove(path.size() - 1);  // Unchoose (backtrack)
    }
}

// Permutations with Swap
public List<List<Integer>> permute(int[] nums) {
    List<List<Integer>> result = new ArrayList<>();
    backtrackPermute(nums, 0, result);
    return result;
}

private void backtrackPermute(int[] nums, int start, List<List<Integer>> result) {
    if (start == nums.length) {
        result.add(Arrays.stream(nums).boxed().collect(Collectors.toList()));
        return;
    }
    
    for (int i = start; i < nums.length; i++) {
        swap(nums, start, i);
        backtrackPermute(nums, start + 1, result);
        swap(nums, start, i);
    }
}

private void swap(int[] nums, int i, int j) {
    int temp = nums[i]; nums[i] = nums[j]; nums[j] = temp;
}
```

#### ✅ Practice Problems (15 problems)

| # | Problem | Type | Difficulty |
|---|---------|------|------------|
| 1 | Jump Game I/II | Greedy | Medium |
| 2 | Gas Station | Greedy | Medium |
| 3 | Task Scheduler | Greedy | Medium |
| 4 | Non-overlapping Intervals | Interval Greedy | Medium |
| 5 | Meeting Rooms II | Interval Greedy | Medium |
| 6 | Subsets I/II | Backtracking | Medium |
| 7 | Permutations I/II | Backtracking | Medium |
| 8 | Combination Sum I/II/III | Backtracking | Medium |
| 9 | Palindrome Partitioning | Backtracking | Medium |
| 10 | N-Queens | Backtracking | Hard |
| 11 | Sudoku Solver | Backtracking | Hard |
| 12 | Word Search I/II | Backtracking + Trie | Medium/Hard |
| 13 | Letter Combinations | Backtracking | Medium |
| 14 | Generate Parentheses | Backtracking | Medium |
| 15 | Restore IP Addresses | Backtracking | Medium |

---

## Phase 4: Advanced Patterns & Problem Solving (Weeks 9-10)

### 🎯 Trie (Prefix Tree)

```java
class Trie {
    private TrieNode root = new TrieNode();
    
    class TrieNode {
        TrieNode[] children = new TrieNode[26];
        boolean isWord = false;
    }
    
    public void insert(String word) {
        TrieNode node = root;
        for (char c : word.toCharArray()) {
            int idx = c - 'a';
            if (node.children[idx] == null) {
                node.children[idx] = new TrieNode();
            }
            node = node.children[idx];
        }
        node.isWord = true;
    }
    
    public boolean search(String word) {
        TrieNode node = searchPrefix(word);
        return node != null && node.isWord;
    }
    
    public boolean startsWith(String prefix) {
        return searchPrefix(prefix) != null;
    }
    
    private TrieNode searchPrefix(String prefix) {
        TrieNode node = root;
        for (char c : prefix.toCharArray()) {
            int idx = c - 'a';
            if (node.children[idx] == null) return null;
            node = node.children[idx];
        }
        return node;
    }
}
```

### 🎯 Segment Tree

```java
class SegmentTree {
    private int[] tree, arr;
    private int n;
    
    public SegmentTree(int[] arr) {
        this.arr = arr;
        this.n = arr.length;
        this.tree = new int[4 * n];
        build(0, 0, n - 1);
    }
    
    private void build(int node, int start, int end) {
        if (start == end) {
            tree[node] = arr[start];
        } else {
            int mid = (start + end) / 2;
            build(2 * node + 1, start, mid);
            build(2 * node + 2, mid + 1, end);
            tree[node] = tree[2 * node + 1] + tree[2 * node + 2];
        }
    }
    
    public void update(int idx, int val) {
        update(0, 0, n - 1, idx, val);
    }
    
    private void update(int node, int start, int end, int idx, int val) {
        if (start == end) {
            arr[idx] = val;
            tree[node] = val;
        } else {
            int mid = (start + end) / 2;
            if (idx <= mid) update(2 * node + 1, start, mid, idx, val);
            else update(2 * node + 2, mid + 1, end, idx, val);
            tree[node] = tree[2 * node + 1] + tree[2 * node + 2];
        }
    }
    
    public int query(int l, int r) {
        return query(0, 0, n - 1, l, r);
    }
    
    private int query(int node, int start, int end, int l, int r) {
        if (r < start || end < l) return 0;
        if (l <= start && end <= r) return tree[node];
        int mid = (start + end) / 2;
        return query(2 * node + 1, start, mid, l, r) + 
               query(2 * node + 2, mid + 1, end, l, r);
    }
}
```

### 🎯 Must-Know Advanced Problems (20 problems)

| # | Problem | Key Technique | Company Frequency |
|---|---------|---------------|-------------------|
| 1 | LRU Cache | LinkedHashMap/Custom | ⭐⭐⭐⭐⭐ |
| 2 | LFU Cache | HashMap + DLL | ⭐⭐⭐⭐ |
| 3 | Implement Trie | Trie | ⭐⭐⭐⭐⭐ |
| 4 | Design Twitter | HashMap + Heap | ⭐⭐⭐⭐ |
| 5 | Word Search II | Trie + Backtracking | ⭐⭐⭐⭐⭐ |
| 6 | Find Median from Stream | Two Heaps | ⭐⭐⭐⭐⭐ |
| 7 | Serialize/Deserialize Tree | BFS/DFS | ⭐⭐⭐⭐ |
| 8 | Design Search Autocomplete | Trie + PQ | ⭐⭐⭐⭐ |
| 9 | Range Sum Query Mutable | Segment Tree/BIT | ⭐⭐⭐ |
| 10 | Count of Smaller Numbers | Merge Sort/BIT | ⭐⭐⭐ |
| 11 | Skyline Problem | Sweep Line + Heap | ⭐⭐⭐ |
| 12 | Text Justification | Simulation | ⭐⭐⭐⭐ |
| 13 | Wildcard Matching | 2D DP | ⭐⭐⭐⭐ |
| 14 | Alien Dictionary | Topological Sort | ⭐⭐⭐⭐⭐ |
| 15 | Minimum Window Substring | Sliding Window | ⭐⭐⭐⭐⭐ |
| 16 | Maximum Profit in Job Scheduling | DP + Binary Search | ⭐⭐⭐⭐ |
| 17 | Longest Valid Parentheses | Stack/DP | ⭐⭐⭐⭐ |
| 18 | Merge K Sorted Lists | K-way Merge | ⭐⭐⭐⭐⭐ |
| 19 | Trapping Rain Water | Two Pointer/Stack | ⭐⭐⭐⭐⭐ |
| 20 | Regular Expression Matching | 2D DP | ⭐⭐⭐⭐ |

---

## Phase 5: System Design Integration (Weeks 11-12)

### 🔗 DSA in System Design

| Data Structure | System Design Application |
|----------------|---------------------------|
| **HashMap** | Cache implementation, URL shortener, distributed key-value store |
| **Trie** | Autocomplete, spell checker, IP routing tables |
| **Heap** | Task scheduling, finding top-k elements, load balancing |
| **Bloom Filter** | Checking existence, spam detection, cache filtering |
| **Skip List** | In-memory databases (Redis), concurrent data structures |
| **Consistent Hashing** | Distributed caching, sharding |
| **B-Trees/B+ Trees** | Database indexing, file systems |
| **Graphs** | Social networks, recommendation systems, routing |
| **LSM Trees** | Write-optimized databases (LevelDB, RocksDB) |
| **Merkle Trees** | Data integrity verification (blockchain, Git) |

---

## 🛠️ Java-Specific Best Practices

### Time Complexity of Java Collections

| Collection | add | remove | contains | get |
|------------|-----|--------|----------|-----|
| ArrayList | O(1)* | O(n) | O(n) | O(1) |
| LinkedList | O(1) | O(1) | O(n) | O(n) |
| HashSet | O(1) | O(1) | O(1) | - |
| TreeSet | O(log n) | O(log n) | O(log n) | - |
| HashMap | O(1) | O(1) | O(1) | O(1) |
| TreeMap | O(log n) | O(log n) | O(log n) | O(log n) |
| PriorityQueue | O(log n) | O(n) | O(n) | O(1)** |

\* Amortized, ** peek only

### Java 8+ Features for DSA

```java
// Stream API for Collections
List<Integer> sortedUnique = list.stream()
    .distinct()
    .sorted()
    .collect(Collectors.toList());

// Map operations
map.computeIfAbsent(key, k -> new ArrayList<>()).add(value);
map.merge(key, 1, Integer::sum);
map.getOrDefault(key, defaultValue);

// Array utilities
int[] copy = Arrays.copyOfRange(arr, start, end);
Arrays.stream(arr).boxed().collect(Collectors.toList());

// String utilities
String reversed = new StringBuilder(s).reverse().toString();
String[] parts = s.split("\\s+");
String joined = String.join(",", list);
```

### Common Pitfalls & Best Practices

```java
// ❌ Integer overflow
int mid = (left + right) / 2;
// ✅ Safe mid calculation
int mid = left + (right - left) / 2;

// ❌ Modifying list while iterating
for (Integer item : list) { list.remove(item); }
// ✅ Use iterator or separate list
Iterator<Integer> it = list.iterator();
while (it.hasNext()) { if (condition) it.remove(); }

// ❌ Comparing Integer objects with ==
Integer a = 128, b = 128;
a == b;  // false!
// ✅ Use equals() or intValue()
a.equals(b);  // true

// ❌ ArrayDeque as stack with null values
Deque<Integer> stack = new ArrayDeque<>();
stack.push(null);  // NullPointerException!
// ✅ Use LinkedList if nulls needed
Deque<Integer> stack = new LinkedList<>();
```

---

## 📚 Resources & Practice Platforms

### Primary Platforms

| Platform | Best For | Link |
|----------|----------|------|
| **LeetCode** | Interview problems, contests | [leetcode.com](https://leetcode.com) |
| **NeetCode** | Curated lists, explanations | [neetcode.io](https://neetcode.io) |
| **Codeforces** | Competitive programming | [codeforces.com](https://codeforces.com) |
| **AlgoExpert** | Video explanations | [algoexpert.io](https://algoexpert.io) |

### Recommended Problem Lists

1. **Blind 75** - Must-do for FAANG interviews
2. **NeetCode 150** - Extended essential problems
3. **LeetCode Top Interview Questions** - Frequent interview problems
4. **Company-specific tags** on LeetCode Premium

### Books

| Book | Focus |
|------|-------|
| *Cracking the Coding Interview* | Interview preparation |
| *Elements of Programming Interviews (Java)* | Advanced problems |
| *Introduction to Algorithms (CLRS)* | Theory deep-dive |
| *Grokking Algorithms* | Visual explanations |

---

## 📅 Weekly Study Plan Template

| Day | Activity | Duration |
|-----|----------|----------|
| **Mon** | Learn new pattern/concept | 2 hrs |
| **Tue** | Practice 3-4 problems (Easy/Medium) | 2 hrs |
| **Wed** | Practice 2-3 problems (Medium/Hard) | 2 hrs |
| **Thu** | Review + 2-3 new problems | 2 hrs |
| **Fri** | Mock interview or hard problems | 2 hrs |
| **Sat** | Weekly review + weak areas | 3 hrs |
| **Sun** | Contest (LeetCode) or rest | 2 hrs |

---

## 🎯 Interview Day Checklist

1. ✅ Clarify problem & constraints
2. ✅ Think out loud, discuss approach
3. ✅ Start with brute force, then optimize
4. ✅ Write clean, modular code
5. ✅ Walk through test cases
6. ✅ Discuss time & space complexity
7. ✅ Handle edge cases

---

> **Pro Tip:** Focus on **understanding patterns** rather than memorizing solutions. Most interview problems are variations of ~15-20 core patterns.

**Good luck with your preparation! 🚀**
