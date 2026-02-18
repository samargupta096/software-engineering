[🏠 Home](../README.md) | [⬅️ Pattern Selector](./17-pattern-selector.md) | [📋 Roadmap](./00-dsa-roadmap.md)

# 🎯 BLIND 75 — Complete Study Guide

> The curated 75 LeetCode problems every software engineer should master for coding interviews

---

## 📊 Overview — All 75 Problems

| # | Category | Count | Difficulty |
|---|----------|-------|------------|
| 1 | [Arrays & Hashing](#-arrays--hashing) | 9 | 🟢🟢🟢🟢 🟡🟡🟡🟡 🔴 |
| 2 | [Two Pointers](#-two-pointers) | 5 | 🟢 🟡🟡🟡 🔴 |
| 3 | [Sliding Window](#-sliding-window) | 4 | 🟡🟡🟡 🔴 |
| 4 | [Stack](#-stack) | 1 | 🟢 |
| 5 | [Binary Search](#-binary-search) | 2 | 🟡🟡 |
| 6 | [Linked Lists](#-linked-lists) | 6 | 🟢🟢 🟡🟡🟡 🔴 |
| 7 | [Trees](#-trees) | 11 | 🟢🟢🟢🟢 🟡🟡🟡🟡🟡🟡 🔴 |
| 8 | [Tries](#-tries) | 3 | 🟡🟡 🔴 |
| 9 | [Heap / Priority Queue](#-heap--priority-queue) | 1 | 🔴 |
| 10 | [Backtracking](#-backtracking) | 2 | 🟡🟡 |
| 11 | [Graphs](#-graphs) | 6 | 🟡🟡🟡🟡🟡🟡 |
| 12 | [1-D Dynamic Programming](#-1-d-dynamic-programming) | 10 | 🟢 🟡🟡🟡🟡🟡🟡🟡🟡🟡 |
| 13 | [2-D Dynamic Programming](#-2-d-dynamic-programming) | 2 | 🟡🟡 |
| 14 | [Greedy](#-greedy) | 2 | 🟡🟡 |
| 15 | [Intervals](#-intervals) | 4 | 🟡🟡🟡 🔴 |
| 16 | [Math & Geometry](#-math--geometry) | 2 | 🟡🟡 |
| 17 | [Bit Manipulation](#-bit-manipulation) | 5 | 🟢🟢 🟡🟡🟡 |

**Total: 75 problems** | ⏱️ Estimated completion: 3–4 weeks

---

## 📅 3-Week Study Plan

| Week | Categories | Problems | Focus |
|------|-----------|----------|-------|
| **Week 1** | Arrays, Two Pointers, Sliding Window, Stack, Binary Search | 21 | Foundation patterns |
| **Week 2** | Linked Lists, Trees, Tries, Heaps, Backtracking | 23 | Data structure mastery |
| **Week 3** | Graphs, DP, Greedy, Intervals, Math, Bits | 31 | Advanced patterns |

---

# 📦 Arrays & Hashing

> [Deep dive →](./02-arrays-hashing.md)

### 1. Two Sum (LC #1) 🟢

> 🧠 **Thought Process**
> 1. **Brute force**: Check every pair → O(n²)
> 2. **Insight**: For each number, we need `target - num` — a **lookup** problem
> 3. **Optimization**: HashMap gives O(1) lookups → single pass
> 4. **Pattern**: "Find pair with property X" → HashMap complement check

```java
// HashMap: O(n) time, O(n) space
public int[] twoSum(int[] nums, int target) {
    Map<Integer, Integer> map = new HashMap<>();
    for (int i = 0; i < nums.length; i++) {
        int complement = target - nums[i];
        if (map.containsKey(complement)) {
            return new int[]{map.get(complement), i};
        }
        map.put(nums[i], i);
    }
    return new int[]{};
}
```

```
nums = [2, 7, 11, 15], target = 9

i=0: comp=9-2=7, map={} → miss, store {2:0}
i=1: comp=9-7=2, map={2:0} → HIT! return [0,1] ✅

💡 Store complement. One-pass lookup avoids O(n²).
```

**Complexity**: Time O(n). Space O(n).

---

### 2. Contains Duplicate (LC #217) 🟢

> 🧠 **Thought Process**
> 1. **Brute force**: Compare all pairs → O(n²)
> 2. **Sort first**: Adjacent duplicates → O(n log n)
> 3. **Best**: HashSet for O(1) existence check → O(n)
> 4. **Pattern**: "Any duplicates?" → HashSet

```java
public boolean containsDuplicate(int[] nums) {
    Set<Integer> seen = new HashSet<>();
    for (int num : nums) {
        if (!seen.add(num)) return true;
    }
    return false;
}
```

```
nums = [1, 2, 3, 1]
add(1) → true, add(2) → true, add(3) → true, add(1) → FALSE → duplicate! ✅

💡 HashSet.add() returns false if element already exists.
```

**Complexity**: Time O(n). Space O(n).

---

### 3. Valid Anagram (LC #242) 🟢

> 🧠 **Thought Process**
> 1. **Sort both strings**: Compare → O(n log n)
> 2. **Better**: Count characters — anagrams have identical char frequencies
> 3. **Key trick**: Single array, increment for `s`, decrement for `t` — all zeros = anagram
> 4. **Pattern**: "Same characters?" → frequency counting

```java
public boolean isAnagram(String s, String t) {
    if (s.length() != t.length()) return false;
    int[] count = new int[26];
    for (int i = 0; i < s.length(); i++) {
        count[s.charAt(i) - 'a']++;
        count[t.charAt(i) - 'a']--;
    }
    for (int c : count) if (c != 0) return false;
    return true;
}
```

```
s="anagram", t="nagaram"
Count: a:3-3=0, n:1-1=0, g:1-1=0, r:1-1=0, m:1-1=0 → all zero ✅

💡 Increment for s, decrement for t. All zeros = anagram.
```

**Complexity**: Time O(n). Space O(1) (fixed 26 chars).

---

### 4. Group Anagrams (LC #49) 🟡

> 🧠 **Thought Process**
> 1. **Key insight**: All anagrams produce the same sorted string
> 2. **Approach**: Sort each word → use as HashMap key → group by key
> 3. **Alternative**: Use char frequency array as key (avoids sorting)
> 4. **Pattern**: "Group by equivalence" → canonical form as HashMap key

```java
public List<List<String>> groupAnagrams(String[] strs) {
    Map<String, List<String>> map = new HashMap<>();
    for (String s : strs) {
        char[] chars = s.toCharArray();
        Arrays.sort(chars);
        String key = new String(chars);
        map.computeIfAbsent(key, k -> new ArrayList<>()).add(s);
    }
    return new ArrayList<>(map.values());
}
```

```
Input: ["eat","tea","tan","ate","nat","bat"]

Sort each → key:
  "eat" → "aet"  |  "tea" → "aet"  |  "ate" → "aet"
  "tan" → "ant"  |  "nat" → "ant"
  "bat" → "abt"

Map: {"aet":["eat","tea","ate"], "ant":["tan","nat"], "abt":["bat"]} ✅

💡 Sorted string = canonical key for anagrams.
```

**Complexity**: Time O(n·k log k) where k=max string length. Space O(n·k).

---

### 5. Top K Frequent Elements (LC #347) 🟡

> 🧠 **Thought Process**
> 1. **Step 1**: Count frequencies with HashMap → O(n)
> 2. **Heap approach**: Min-heap of size k → O(n log k)
> 3. **Better — Bucket sort**: Index = frequency, max freq ≤ n → O(n)
> 4. **Pattern**: "Top K" → Heap or Bucket Sort

```
Bucket Sort Visualization:

nums = [1,1,1,2,2,3]

freq map: {1:3, 2:2, 3:1}

buckets (index = frequency):
  idx:  0    1    2    3    4    5    6
      [ _ , {3}, {2}, {1},  _,   _,  _ ]
                  ↑     ↑
          freq=2      freq=3

Scan right→left: pick k elements
```

```java
public int[] topKFrequent(int[] nums, int k) {
    Map<Integer, Integer> freq = new HashMap<>();
    for (int n : nums) freq.merge(n, 1, Integer::sum);

    // Bucket sort: index = frequency
    List<Integer>[] buckets = new List[nums.length + 1];
    for (var e : freq.entrySet()) {
        int f = e.getValue();
        if (buckets[f] == null) buckets[f] = new ArrayList<>();
        buckets[f].add(e.getKey());
    }

    int[] res = new int[k];
    int idx = 0;
    for (int i = buckets.length - 1; i >= 0 && idx < k; i--) {
        if (buckets[i] != null)
            for (int n : buckets[i]) { res[idx++] = n; if (idx == k) break; }
    }
    return res;
}
```

```
nums=[1,1,1,2,2,3], k=2

Freq: {1:3, 2:2, 3:1}
Buckets: [_,{3},{2},{1},_,_,_]  (index=freq)
Scan from right: bucket[3]={1} → bucket[2]={2} → result=[1,2] ✅

💡 Bucket sort avoids heap's O(n log k) — achieves O(n).
```

**Complexity**: Time O(n). Space O(n).

---

### 6. Product of Array Except Self (LC #238) 🟡

> 🧠 **Thought Process**
> 1. **Brute force**: For each index, multiply all others → O(n²)
> 2. **Division trick**: Total product / nums[i] — but division is banned!
> 3. **Key insight**: result[i] = (product of left) × (product of right)
> 4. **Two-pass**: Build left prefix, then multiply by right suffix in-place
> 5. **Pattern**: Prefix/suffix decomposition

```
Visualization:
nums = [1, 2, 3, 4]

Left prefix:   [1,   1,   1×2, 1×2×3] = [1, 1, 2, 6]
Right suffix:  [2×3×4, 3×4, 4,   1  ] = [24,12, 4, 1]
Result:        [1×24, 1×12, 2×4, 6×1] = [24,12, 8, 6]
```

```java
public int[] productExceptSelf(int[] nums) {
    int n = nums.length;
    int[] result = new int[n];

    result[0] = 1;
    for (int i = 1; i < n; i++)
        result[i] = result[i-1] * nums[i-1];    // Left prefix product

    int right = 1;
    for (int i = n - 2; i >= 0; i--) {
        right *= nums[i+1];                       // Right suffix product
        result[i] *= right;
    }
    return result;
}
```

```
nums = [1, 2, 3, 4]

Pass 1 (left prefix): [1, 1, 2, 6]    ← result[i] = product of all left of i
Pass 2 (right suffix): right=1
  i=2: right=4, result[2]=2*4=8
  i=1: right=4*3=12, result[1]=1*12=12
  i=0: right=12*2=24, result[0]=1*24=24

Result: [24, 12, 8, 6] ✅

💡 Two passes: left prefix × right suffix. No division needed.
```

**Complexity**: Time O(n). Space O(1) (output array doesn't count).

---

### 7. Valid Sudoku (LC #36) 🟡

> 🧠 **Thought Process**
> 1. **Three constraints**: Each row, column, and 3×3 box must have unique digits
> 2. **Naive**: 3 separate checks with 3 sets each → verbose
> 3. **Elegant**: Encode all constraints as unique strings in ONE set
> 4. **Box index trick**: `i/3` and `j/3` maps any cell to its 3×3 box
> 5. **Pattern**: Constraint encoding with HashSet

```
Box Index Mapping:
┌─────┬─────┬─────┐
│ 0,0 │ 0,1 │ 0,2 │  ← i/3, j/3
├─────┼─────┼─────┤
│ 1,0 │ 1,1 │ 1,2 │
├─────┼─────┼─────┤
│ 2,0 │ 2,1 │ 2,2 │
└─────┴─────┴─────┘
```

```java
public boolean isValidSudoku(char[][] board) {
    Set<String> seen = new HashSet<>();
    for (int i = 0; i < 9; i++) {
        for (int j = 0; j < 9; j++) {
            char c = board[i][j];
            if (c == '.') continue;
            if (!seen.add(c + " in row " + i) ||
                !seen.add(c + " in col " + j) ||
                !seen.add(c + " in box " + i/3 + "-" + j/3))
                return false;
        }
    }
    return true;
}
```

```
For cell (4,5) with value '7':
  Add "7 in row 4"
  Add "7 in col 5"
  Add "7 in box 1-1"    (i/3=1, j/3=1 → center box)

If any already exists → invalid ✅

💡 Encode row/col/box constraints as unique strings in one set.
```

**Complexity**: Time O(81) = O(1). Space O(81) = O(1).

---

### 8. Encode and Decode Strings (LC #271) 🟡

> 🧠 **Thought Process**
> 1. **Problem**: Strings can contain ANY character — no safe delimiter
> 2. **Delimiter approach fails**: `"a,b"` vs `["a","b"]` vs `["a,b"]`
> 3. **Key insight**: Length prefix `len#string` — we know exactly how many chars to read
> 4. **Pattern**: Self-describing format / length-prefixed encoding

```
Encode/Decode Flow:
["leet", "co#de"] → "4#leet5#co#de"
                     │ │    │ │
                     │ └─4chars─┘ └─5chars──┘
                     len       len
```

```java
// Encode: "4#leet6#coding" for ["leet","coding"]
public String encode(List<String> strs) {
    StringBuilder sb = new StringBuilder();
    for (String s : strs) sb.append(s.length()).append('#').append(s);
    return sb.toString();
}

public List<String> decode(String s) {
    List<String> result = new ArrayList<>();
    int i = 0;
    while (i < s.length()) {
        int j = s.indexOf('#', i);
        int len = Integer.parseInt(s.substring(i, j));
        result.add(s.substring(j + 1, j + 1 + len));
        i = j + 1 + len;
    }
    return result;
}
```

```
Input: ["leet", "co#de"]
Encode: "4#leet5#co#de"

Decode:
  i=0: find '#' at 1, len=4 → "leet", i=6
  i=6: find '#' at 7, len=5 → "co#de", i=13 ✅

💡 Length prefix avoids delimiter collision.
```

**Complexity**: Time O(n). Space O(n). Where n = total characters.

---

### 9. Longest Consecutive Sequence (LC #128) 🟡

> 🧠 **Thought Process**
> 1. **Sort first**: Scan for consecutive runs → O(n log n)
> 2. **Can we do O(n)?** Need O(1) lookups → HashSet
> 3. **Key insight**: Only start counting from sequence **beginnings** (no `n-1` in set)
> 4. **Why O(n)?**: Each element is visited at most twice (once in loop, once in while)
> 5. **Pattern**: HashSet + smart iteration starting point

```
Visualization:
nums = [100, 4, 200, 1, 3, 2]
Set  = {1, 2, 3, 4, 100, 200}

  100: has 99? NO → start! → 100→101? NO → len=1
    4: has  3? YES → skip (not a start)
    1: has  0? NO → start! → 1→2→3→4→5? NO → len=4 ✅
  200: has 199? NO → start! → 200→201? NO → len=1
```

```java
public int longestConsecutive(int[] nums) {
    Set<Integer> set = new HashSet<>();
    for (int n : nums) set.add(n);

    int longest = 0;
    for (int n : set) {
        if (!set.contains(n - 1)) {  // Start of sequence
            int length = 1;
            while (set.contains(n + length)) length++;
            longest = Math.max(longest, length);
        }
    }
    return longest;
}
```

```
nums = [100, 4, 200, 1, 3, 2]
Set = {1, 2, 3, 4, 100, 200}

100: no 99 → start! 100,101? no → length=1
4: has 3 → skip (not start)
1: no 0 → start! 1→2→3→4→5? no → length=4 ✅

💡 Only start counting from sequence beginnings (no n-1). Each element visited once → O(n).
```

**Complexity**: Time O(n). Space O(n).

---

# ↔️ Two Pointers

> [Deep dive →](./03-two-pointers.md)

### 10. Valid Palindrome (LC #125) 🟢

> 🧠 **Thought Process**
> 1. **Reverse string**: Compare with original → O(n) space
> 2. **Better**: Two pointers from both ends, skip non-alphanumeric
> 3. **Key**: Case-insensitive comparison + filter junk chars
> 4. **Pattern**: Symmetry check → two pointers converging inward

```java
public boolean isPalindrome(String s) {
    int l = 0, r = s.length() - 1;
    while (l < r) {
        while (l < r && !Character.isLetterOrDigit(s.charAt(l))) l++;
        while (l < r && !Character.isLetterOrDigit(s.charAt(r))) r--;
        if (Character.toLowerCase(s.charAt(l)) != Character.toLowerCase(s.charAt(r)))
            return false;
        l++; r--;
    }
    return true;
}
```

```
s = "A man, a plan, a canal: Panama"

l→A  r→a → match (case insensitive)
l→m  r→m → match
...continues matching... → true ✅

💡 Skip non-alphanumeric, compare case-insensitively from both ends.
```

**Complexity**: Time O(n). Space O(1).

---

### 11. 3Sum (LC #15) 🟡

> 🧠 **Thought Process**
> 1. **Brute force**: Three nested loops → O(n³)
> 2. **Reduce to 2Sum**: Fix one element, find pair summing to `-fixed`
> 3. **Sort first**: Enables two-pointer on remaining subarray → O(n²)
> 4. **Dedup trick**: Skip consecutive equal values for both `i` and pointers
> 5. **Pattern**: Sort + fix one + two-pointer sweep

```
Diagram:
sorted: [-4, -1, -1, 0, 1, 2]
          i    l            r
          │    │            │
          fix  ├──narrow──┘
                  sum < 0 → l++
                  sum > 0 → r--
                  sum = 0 → record!
```

```java
public List<List<Integer>> threeSum(int[] nums) {
    Arrays.sort(nums);
    List<List<Integer>> result = new ArrayList<>();

    for (int i = 0; i < nums.length - 2; i++) {
        if (i > 0 && nums[i] == nums[i-1]) continue;  // Skip duplicates
        int l = i + 1, r = nums.length - 1;
        while (l < r) {
            int sum = nums[i] + nums[l] + nums[r];
            if (sum < 0) l++;
            else if (sum > 0) r--;
            else {
                result.add(Arrays.asList(nums[i], nums[l], nums[r]));
                while (l < r && nums[l] == nums[l+1]) l++;  // Skip dups
                while (l < r && nums[r] == nums[r-1]) r--;
                l++; r--;
            }
        }
    }
    return result;
}
```

```
nums = [-1, 0, 1, 2, -1, -4] → sorted: [-4,-1,-1,0,1,2]

i=0 (-4): l=1,r=5 → sum=-4+(-1)+2=-3 < 0 → l++ ... no triplet
i=1 (-1): l=2,r=5 → sum=-1+(-1)+2=0 ✅ → [-1,-1,2]
           l=3,r=4 → sum=-1+0+1=0 ✅ → [-1,0,1]

💡 Fix one element, two-pointer on rest. Skip duplicates to avoid repeats.
```

**Complexity**: Time O(n²). Space O(1) extra (excluding output).

---

### 12. Container With Most Water (LC #11) 🟡

> 🧠 **Thought Process**
> 1. **Brute force**: Check all pairs → O(n²)
> 2. **Greedy insight**: Start with widest container (l=0, r=end)
> 3. **Move shorter side**: Shorter side limits height — moving taller can only lose width
> 4. **Proof**: We never skip a potentially better pair
> 5. **Pattern**: Two pointers greedy narrowing

```
  8 |  █         █
  7 |  █───────────█   area = 7 × 7 = 49
  6 |  █  █       █
  5 |  █  █  █    █
  4 |  █  █  █ █  █
  3 |  █  █  █ █  █ █
  2 |  █  █  █ █  █ █
  1 |█ █  █  █ █  █ █ █
    ─────────────────
     l                 r
```

```java
public int maxArea(int[] height) {
    int l = 0, r = height.length - 1, max = 0;
    while (l < r) {
        int area = Math.min(height[l], height[r]) * (r - l);
        max = Math.max(max, area);
        if (height[l] < height[r]) l++;
        else r--;
    }
    return max;
}
```

```
height = [1,8,6,2,5,4,8,3,7]

l=0(1),r=8(7): area=1*8=8, move l (shorter)
l=1(8),r=8(7): area=7*7=49 ✅ max so far
l=1(8),r=7(3): area=3*6=18
...

💡 Always move the shorter side — moving the taller can only decrease area.
```

**Complexity**: Time O(n). Space O(1).

---

### 13. Trapping Rain Water (LC #42) 🔴

> 🧠 **Thought Process**
> 1. **Per-column**: Water at `i` = `min(leftMax, rightMax) - height[i]`
> 2. **Prefix arrays**: Precompute leftMax[] and rightMax[] → O(n) space
> 3. **Optimize to O(1) space**: Two pointers — process from the smaller side
> 4. **Why it works**: If `height[l] < height[r]`, water at `l` depends only on `leftMax`
> 5. **Pattern**: Two-pointer with running max from both sides

```
Water Visualization:
height = [0,1,0,2,1,0,1,3,2,1,2,1]

  3 |         █
  2 |      █▒▒▒▒█▒█
  1 |   █▒█▒▒███▒██
  0 | █  █  █  ███ ██  (▒ = trapped water = 6)
```

```java
public int trap(int[] height) {
    int l = 0, r = height.length - 1;
    int leftMax = 0, rightMax = 0, water = 0;
    while (l < r) {
        if (height[l] < height[r]) {
            leftMax = Math.max(leftMax, height[l]);
            water += leftMax - height[l];
            l++;
        } else {
            rightMax = Math.max(rightMax, height[r]);
            water += rightMax - height[r];
            r--;
        }
    }
    return water;
}
```

```
height = [0,1,0,2,1,0,1,3,2,1,2,1]

l=0(0): leftMax=0, water+=0, l++
l=1(1): leftMax=1, water+=0, l++
l=2(0): leftMax=1, water+=1, l++
l=3(2): leftMax=2, water+=0, l++
l=4(1): leftMax=2, water+=1, l++
l=5(0): leftMax=2, water+=2, l++ → total=6 ✅

💡 Water at position = min(leftMax, rightMax) - height. Two pointers avoid prefix arrays.
```

**Complexity**: Time O(n). Space O(1).

---

### 14. Two Sum II — Sorted (LC #167) 🟡

> 🧠 **Thought Process**
> 1. **HashMap**: Works but doesn't use the sorted property
> 2. **Binary search per element**: O(n log n) — better but not optimal
> 3. **Two pointers**: Sum too small → l++, too big → r--. O(n)
> 4. **Why it works**: Sorted array → narrowing window guarantees finding the pair
> 5. **Pattern**: Sorted array + target sum → two pointers

```java
public int[] twoSum(int[] numbers, int target) {
    int l = 0, r = numbers.length - 1;
    while (l < r) {
        int sum = numbers[l] + numbers[r];
        if (sum == target) return new int[]{l + 1, r + 1};
        if (sum < target) l++;
        else r--;
    }
    return new int[]{};
}
```

```
numbers = [2,7,11,15], target = 9
l=0(2), r=3(15): sum=17 > 9 → r--
l=0(2), r=2(11): sum=13 > 9 → r--
l=0(2), r=1(7):  sum=9 == 9 → [1,2] ✅

💡 Sorted → narrowing window guarantees finding the pair.
```

**Complexity**: Time O(n). Space O(1).

---

# 🪟 Sliding Window

> [Deep dive →](./04-sliding-window.md)

### 15. Best Time to Buy and Sell Stock (LC #121) 🟢

> 🧠 **Thought Process**
> 1. **Brute force**: Check all buy/sell pairs → O(n²)
> 2. **Insight**: Best profit ending at day `i` = `price[i] - minSoFar`
> 3. **One pass**: Track running minimum, compute profit at each step
> 4. **Pattern**: Sliding window / running min-max

```java
public int maxProfit(int[] prices) {
    int min = Integer.MAX_VALUE, maxProfit = 0;
    for (int price : prices) {
        min = Math.min(min, price);
        maxProfit = Math.max(maxProfit, price - min);
    }
    return maxProfit;
}
```

```
prices = [7, 1, 5, 3, 6, 4]

i=0: min=7, profit=0
i=1: min=1, profit=0
i=2: min=1, profit=4
i=4: min=1, profit=5 ✅ (buy at 1, sell at 6)

💡 Track running minimum. Profit = current - min so far.
```

**Complexity**: Time O(n). Space O(1).

---

### 16. Longest Substring Without Repeating Characters (LC #3) 🟡

> 🧠 **Thought Process**
> 1. **Brute force**: Check all substrings for uniqueness → O(n³)
> 2. **Sliding window**: Expand right, shrink left on duplicate
> 3. **Optimization**: HashMap stores last index — jump `left` past duplicate directly
> 4. **Pattern**: Variable-size sliding window with HashMap

```
Window Sliding:
s = "a b c a b c b b"
     [       ]         window="abc", max=3
         [     ]       'a' seen → jump left past old 'a'
```

```java
public int lengthOfLongestSubstring(String s) {
    Map<Character, Integer> map = new HashMap<>();
    int max = 0, left = 0;
    for (int right = 0; right < s.length(); right++) {
        char c = s.charAt(right);
        if (map.containsKey(c) && map.get(c) >= left) {
            left = map.get(c) + 1;
        }
        map.put(c, right);
        max = Math.max(max, right - left + 1);
    }
    return max;
}
```

```
s = "abcabcbb"

right=0(a): map={a:0}, window="a", max=1
right=1(b): map={a:0,b:1}, window="ab", max=2
right=2(c): map={..c:2}, window="abc", max=3
right=3(a): a seen at 0 → left=1, window="bca", max=3
right=4(b): b seen at 1 → left=2, window="cab", max=3

Answer: 3 ("abc") ✅

💡 Map stores last index. Jump left pointer past duplicate.
```

**Complexity**: Time O(n). Space O(min(n, 26)) = O(1).

---

### 17. Longest Repeating Character Replacement (LC #424) 🟡

> 🧠 **Thought Process**
> 1. **Key formula**: `windowSize - maxFreq = replacements needed`
> 2. **If replacements ≤ k**: Window is valid (all same char after k changes)
> 3. **If replacements > k**: Shrink from left
> 4. **Trick**: `maxFreq` never needs to decrease — we only care about growing the window
> 5. **Pattern**: Sliding window with character frequency count

```java
public int characterReplacement(String s, int k) {
    int[] count = new int[26];
    int maxFreq = 0, left = 0, result = 0;

    for (int right = 0; right < s.length(); right++) {
        count[s.charAt(right) - 'A']++;
        maxFreq = Math.max(maxFreq, count[s.charAt(right) - 'A']);

        while ((right - left + 1) - maxFreq > k) {
            count[s.charAt(left) - 'A']--;
            left++;
        }
        result = Math.max(result, right - left + 1);
    }
    return result;
}
```

```
s = "AABABBA", k = 1

Window "AAB" (right=2): maxFreq=2(A), replacements=3-2=1 ≤ k ✅, result=3
Window "AABA" (right=3): maxFreq=3(A), replacements=4-3=1 ≤ k ✅, result=4
Window "AABAB" (right=4): replacements=5-3=2 > k → shrink left

Answer: 4 ✅

💡 windowSize - maxFreq = chars to replace. Keep ≤ k.
```

**Complexity**: Time O(n). Space O(1).

---

### 18. Minimum Window Substring (LC #76) 🔴

> 🧠 **Thought Process**
> 1. **Need**: Smallest window in `s` containing all chars of `t`
> 2. **Expand right** until window satisfies requirement
> 3. **Shrink left** to minimize while still valid
> 4. **Track**: Count of unique characters fully satisfied (`formed == required`)
> 5. **Pattern**: Variable sliding window with two frequency maps

```
Sliding Window:
s = "A D O B E C O D E B A N C",  t = "ABC"
     [==========]                   expand until A,B,C found
       [========]                   shrink left
                     [=======]      final: "BANC" (len=4) ✅
```

```java
public String minWindow(String s, String t) {
    int[] need = new int[128], have = new int[128];
    for (char c : t.toCharArray()) need[c]++;

    int required = 0;
    for (int n : need) if (n > 0) required++;

    int formed = 0, left = 0, minLen = Integer.MAX_VALUE, start = 0;

    for (int right = 0; right < s.length(); right++) {
        char c = s.charAt(right);
        have[c]++;
        if (need[c] > 0 && have[c] == need[c]) formed++;

        while (formed == required) {
            if (right - left + 1 < minLen) {
                minLen = right - left + 1;
                start = left;
            }
            char lc = s.charAt(left);
            have[lc]--;
            if (need[lc] > 0 && have[lc] < need[lc]) formed--;
            left++;
        }
    }
    return minLen == Integer.MAX_VALUE ? "" : s.substring(start, start + minLen);
}
```

```
s = "ADOBECODEBANC", t = "ABC"

Expand right until all of "ABC" found...
Window "ADOBEC" (0-5): has A,B,C → valid, len=6
Shrink left: "DOBEC" → lost A → expand again
...
Window "BANC" (9-12): has B,A,N,C → valid, len=4 ✅

💡 Expand to satisfy, shrink to minimize. Track count of unique chars satisfied.
```

**Complexity**: Time O(n + m). Space O(1) (fixed 128 chars).

---

# 📚 Stack

> [Deep dive →](./07-stacks-queues.md)

### 19. Valid Parentheses (LC #20) 🟢

> 🧠 **Thought Process**
> 1. **Matching pairs**: Each opener needs its closer in correct order → LIFO = Stack
> 2. **Elegant trick**: Push expected closer instead of opener → simpler comparison
> 3. **End check**: Stack must be empty (no unmatched openers)
> 4. **Pattern**: Bracket matching → Stack

```java
public boolean isValid(String s) {
    Stack<Character> stack = new Stack<>();
    for (char c : s.toCharArray()) {
        if (c == '(') stack.push(')');
        else if (c == '{') stack.push('}');
        else if (c == '[') stack.push(']');
        else if (stack.isEmpty() || stack.pop() != c) return false;
    }
    return stack.isEmpty();
}
```

```
s = "({[]})"

Push ')' for '('  → stack: [)]
Push '}' for '{'  → stack: [), }]
Push ']' for '['  → stack: [), }, ]]
Pop ']' matches ']' ✅
Pop '}' matches '}' ✅
Pop ')' matches ')' ✅
Stack empty → true ✅

💡 Push expected closing bracket. Pop and compare.
```

**Complexity**: Time O(n). Space O(n).

---

# 🔍 Binary Search

> [Deep dive →](./05-binary-search.md)

### 20. Search in Rotated Sorted Array 🟡

```java
public int search(int[] nums, int target) {
    int l = 0, r = nums.length - 1;
    while (l <= r) {
        int mid = l + (r - l) / 2;
        if (nums[mid] == target) return mid;

        if (nums[l] <= nums[mid]) {  // Left half sorted
            if (target >= nums[l] && target < nums[mid]) r = mid - 1;
            else l = mid + 1;
        } else {                      // Right half sorted
            if (target > nums[mid] && target <= nums[r]) l = mid + 1;
            else r = mid - 1;
        }
    }
    return -1;
}
```

```
nums = [4,5,6,7,0,1,2], target = 0

l=0,r=6,mid=3(7): left [4,5,6,7] sorted, 0 not in [4,7] → l=4
l=4,r=6,mid=5(1): left [0,1] sorted, 0 in [0,1] → r=4
l=4,r=4,mid=4(0): found! return 4 ✅

💡 One half is always sorted. Determine which, then check if target is in that half.
```

**Complexity**: Time O(log n). Space O(1).

---

### 21. Find Minimum in Rotated Sorted Array 🟡

```java
public int findMin(int[] nums) {
    int l = 0, r = nums.length - 1;
    while (l < r) {
        int mid = l + (r - l) / 2;
        if (nums[mid] > nums[r]) l = mid + 1;  // Min is in right half
        else r = mid;                            // Min is in left half (or mid)
    }
    return nums[l];
}
```

```
nums = [3, 4, 5, 1, 2]

l=0,r=4,mid=2(5): 5 > 2 → min in right → l=3
l=3,r=4,mid=3(1): 1 < 2 → min in left (incl mid) → r=3
l=3,r=3 → return nums[3] = 1 ✅

💡 Compare mid with right end. If mid > right, rotation point is right of mid.
```

**Complexity**: Time O(log n). Space O(1).

---

# 🔗 Linked Lists

> [Deep dive →](./06-linked-lists.md)

### 22. Reverse Linked List 🟢

```java
public ListNode reverseList(ListNode head) {
    ListNode prev = null, curr = head;
    while (curr != null) {
        ListNode next = curr.next;
        curr.next = prev;
        prev = curr;
        curr = next;
    }
    return prev;
}
```

```
1→2→3→null
prev=null,curr=1: 1.next=null → prev=1,curr=2
prev=1,curr=2: 2.next=1 → prev=2,curr=3
prev=2,curr=3: 3.next=2 → prev=3,curr=null
Result: 3→2→1→null ✅

💡 Three pointers: prev, curr, next. Flip one link at a time.
```

**Complexity**: Time O(n). Space O(1).

---

### 23. Merge Two Sorted Lists 🟢

```java
public ListNode mergeTwoLists(ListNode l1, ListNode l2) {
    ListNode dummy = new ListNode(0), curr = dummy;
    while (l1 != null && l2 != null) {
        if (l1.val <= l2.val) { curr.next = l1; l1 = l1.next; }
        else { curr.next = l2; l2 = l2.next; }
        curr = curr.next;
    }
    curr.next = (l1 != null) ? l1 : l2;
    return dummy.next;
}
```

```
l1: 1→2→4    l2: 1→3→4
Compare 1≤1→take l1. 2>1→take l2. 2≤3→take l1. 4>3→take l2. 4≤4→take l1. Append l2.
Result: 1→1→2→3→4→4 ✅
```

**Complexity**: Time O(n+m). Space O(1).

---

### 24. Linked List Cycle 🟢

```java
public boolean hasCycle(ListNode head) {
    ListNode slow = head, fast = head;
    while (fast != null && fast.next != null) {
        slow = slow.next;
        fast = fast.next.next;
        if (slow == fast) return true;
    }
    return false;
}
```

```
3→2→0→-4→(back to 2)
slow: 3→2→0→-4→2   fast: 3→0→2→2
Meet! → cycle ✅

💡 Floyd's Tortoise and Hare: fast moves 2x, must meet if cycle exists.
```

**Complexity**: Time O(n). Space O(1).

---

### 25. Reorder List 🟡

```java
public void reorderList(ListNode head) {
    ListNode slow = head, fast = head;
    while (fast.next != null && fast.next.next != null) {
        slow = slow.next; fast = fast.next.next;
    }
    ListNode prev = null, curr = slow.next;
    slow.next = null;
    while (curr != null) {
        ListNode next = curr.next; curr.next = prev; prev = curr; curr = next;
    }
    ListNode first = head, second = prev;
    while (second != null) {
        ListNode t1 = first.next, t2 = second.next;
        first.next = second; second.next = t1;
        first = t1; second = t2;
    }
}
```

```
1→2→3→4→5
Find mid→3. Split [1→2→3],[4→5]. Reverse 2nd [5→4]. Interleave: 1→5→2→4→3 ✅

💡 Find middle + reverse second half + merge alternating.
```

**Complexity**: Time O(n). Space O(1).

---

### 26. Remove Nth Node From End 🟡

```java
public ListNode removeNthFromEnd(ListNode head, int n) {
    ListNode dummy = new ListNode(0, head), fast = dummy, slow = dummy;
    for (int i = 0; i <= n; i++) fast = fast.next;
    while (fast != null) { slow = slow.next; fast = fast.next; }
    slow.next = slow.next.next;
    return dummy.next;
}
```

```
1→2→3→4→5, n=2
Advance fast by 3: fast→3. Move both until fast=null: slow→3.
Remove slow.next(4): 1→2→3→5 ✅

💡 Gap of n+1. When fast hits null, slow is right before target.
```

**Complexity**: Time O(n). Space O(1).

---

### 27. Merge K Sorted Lists 🔴

```java
public ListNode mergeKLists(ListNode[] lists) {
    PriorityQueue<ListNode> heap = new PriorityQueue<>((a,b) -> a.val - b.val);
    for (ListNode n : lists) if (n != null) heap.offer(n);
    ListNode dummy = new ListNode(0), curr = dummy;
    while (!heap.isEmpty()) {
        ListNode node = heap.poll();
        curr.next = node; curr = curr.next;
        if (node.next != null) heap.offer(node.next);
    }
    return dummy.next;
}
```

```
[1→4→5],[1→3→4],[2→6] → heap=[1,1,2]
Poll 1→push 4, poll 1→push 3, poll 2→push 6...
Result: 1→1→2→3→4→4→5→6 ✅

💡 Min-heap of size k. Always poll smallest head. O(N log k).
```

**Complexity**: Time O(N log k). Space O(k).

---

# 🌳 Trees

> [Deep dive →](./08-trees.md)

### 28. Invert Binary Tree 🟢

```java
public TreeNode invertTree(TreeNode root) {
    if (root == null) return null;
    TreeNode l = invertTree(root.left), r = invertTree(root.right);
    root.left = r; root.right = l;
    return root;
}
```

```
    4          4
   / \   →   / \
  2   7     7   2
 / \ / \   / \ / \
1  3 6  9 9  6 3  1   ✅

💡 Post-order: invert children, then swap.
```

**Complexity**: Time O(n). Space O(h).

---

### 29. Maximum Depth of Binary Tree 🟢

```java
public int maxDepth(TreeNode root) {
    if (root == null) return 0;
    return 1 + Math.max(maxDepth(root.left), maxDepth(root.right));
}
```

```
    3       depth(3)=1+max(1,2)=3 ✅
   / \      depth(9)=1, depth(20)=1+max(1,1)=2
  9   20
     / \
   15   7
```

**Complexity**: Time O(n). Space O(h).

---

### 30. Same Tree 🟢

```java
public boolean isSameTree(TreeNode p, TreeNode q) {
    if (p == null && q == null) return true;
    if (p == null || q == null || p.val != q.val) return false;
    return isSameTree(p.left, q.left) && isSameTree(p.right, q.right);
}
```

```
    1         1
   / \       / \
  2   3     2   3     → same(1,1)→same(2,2)→same(3,3)→all match ✅

  1         1
   \       / 
    2     2           → same(1,1)→right≠left → false ❌

💡 Both null→true. One null or val≠→false. Recurse left+right.
```

**Complexity**: Time O(n). Space O(h).

---

### 31. Subtree of Another Tree 🟢

```java
public boolean isSubtree(TreeNode root, TreeNode subRoot) {
    if (root == null) return false;
    if (isSameTree(root, subRoot)) return true;
    return isSubtree(root.left, subRoot) || isSubtree(root.right, subRoot);
}
```

```
    root:        sub:
      3            4
     / \          / \
    4   5        1   2
   / \
  1   2

isSame(root,sub)? 3≠4→no
isSame(root.left,sub)? 4=4→check children→1=1,2=2 ✅ subtree found!

💡 At each node check isSameTree. Reuses same-tree logic.
```

**Complexity**: Time O(m·n). Space O(h).

---

### 32. Lowest Common Ancestor of BST 🟡

```java
public TreeNode lowestCommonAncestor(TreeNode root, TreeNode p, TreeNode q) {
    while (root != null) {
        if (p.val < root.val && q.val < root.val) root = root.left;
        else if (p.val > root.val && q.val > root.val) root = root.right;
        else return root;
    }
    return null;
}
```

```
    6
   / \     LCA(2,8)=6 (split)
  2   8    LCA(2,4)=2 (p is ancestor)

💡 BST: both < root→left, both > root→right, else split point=LCA.
```

**Complexity**: Time O(h). Space O(1).

---

### 33. Binary Tree Level Order Traversal 🟡

```java
public List<List<Integer>> levelOrder(TreeNode root) {
    List<List<Integer>> res = new ArrayList<>();
    if (root == null) return res;
    Queue<TreeNode> q = new LinkedList<>();
    q.offer(root);
    while (!q.isEmpty()) {
        int size = q.size();
        List<Integer> level = new ArrayList<>();
        for (int i = 0; i < size; i++) {
            TreeNode node = q.poll();
            level.add(node.val);
            if (node.left != null) q.offer(node.left);
            if (node.right != null) q.offer(node.right);
        }
        res.add(level);
    }
    return res;
}
```

```
    3
   / \    → [[3],[9,20],[15,7]] ✅
  9   20
     / \
   15   7

💡 BFS. Process levelSize nodes per iteration.
```

**Complexity**: Time O(n). Space O(w).

---

### 34. Validate Binary Search Tree 🟡

```java
public boolean isValidBST(TreeNode root) {
    return validate(root, Long.MIN_VALUE, Long.MAX_VALUE);
}
private boolean validate(TreeNode n, long min, long max) {
    if (n == null) return true;
    if (n.val <= min || n.val >= max) return false;
    return validate(n.left, min, n.val) && validate(n.right, n.val, max);
}
```

```
      5  [−∞, +∞]
     / \
    1    4  ← 4 not in (5, +∞) → INVALID ❌
   / \
  3   6

      5  [−∞, +∞]
     / \
    1    6  [5, +∞] ← 6 in range ✅
   / \   / \
  0   3 5   7  ← 5 not in (5,6) strict → INVALID ❌

💡 Pass valid [min,max] range down. Each node tightens the range.
```

**Complexity**: Time O(n). Space O(h).

---

### 35. Kth Smallest Element in BST 🟡

```java
public int kthSmallest(TreeNode root, int k) {
    Stack<TreeNode> stack = new Stack<>();
    TreeNode curr = root;
    while (curr != null || !stack.isEmpty()) {
        while (curr != null) { stack.push(curr); curr = curr.left; }
        curr = stack.pop();
        if (--k == 0) return curr.val;
        curr = curr.right;
    }
    return -1;
}
```

```
      5         Inorder traversal: 1, 2, 3, 4, 5, 6
     / \        k=3 → answer = 3
    3   6
   / \
  2   4       Push 5→3→2→1. Pop 1(k=3→2). Pop 2(k=2→1).
  /            Pop 3(k=1→0) → return 3 ✅
 1

💡 Iterative inorder. BST inorder = sorted. Stop at kth.
```

**Complexity**: Time O(h + k). Space O(h).

---

### 36. Construct from Preorder and Inorder 🟡

```java
int preIdx = 0;
Map<Integer,Integer> inMap = new HashMap<>();

public TreeNode buildTree(int[] pre, int[] in) {
    for (int i = 0; i < in.length; i++) inMap.put(in[i], i);
    return build(pre, 0, in.length - 1);
}

TreeNode build(int[] pre, int lo, int hi) {
    if (lo > hi) return null;
    int val = pre[preIdx++];
    TreeNode root = new TreeNode(val);
    int idx = inMap.get(val);
    root.left = build(pre, lo, idx - 1);
    root.right = build(pre, idx + 1, hi);
    return root;
}
```

```
pre=[3,9,20,15,7] in=[9,3,15,20,7]
Root=3. In inorder: left=[9] right=[15,20,7]
     3
    / \    ✅
   9   20
      / \
    15   7

💡 Preorder → root. Inorder → split left/right subtrees.
```

**Complexity**: Time O(n). Space O(n).

---

### 37. Binary Tree Maximum Path Sum 🔴

```java
int maxSum = Integer.MIN_VALUE;
public int maxPathSum(TreeNode root) { dfs(root); return maxSum; }

int dfs(TreeNode node) {
    if (node == null) return 0;
    int l = Math.max(0, dfs(node.left));
    int r = Math.max(0, dfs(node.right));
    maxSum = Math.max(maxSum, l + r + node.val);
    return Math.max(l, r) + node.val;
}
```

```
   -10
   / \      dfs(20): l=15, r=7, maxSum=42, return 35
  9   20    dfs(-10): l=9, r=35, through=34 < 42
     / \    Answer: 42 (path 15→20→7) ✅
    15   7

💡 Update global max with through-path (l+r+val). Return best single-direction.
```

**Complexity**: Time O(n). Space O(h).

---

### 38. Serialize and Deserialize Binary Tree 🔴

```java
public String serialize(TreeNode root) {
    if (root == null) return "null";
    return root.val + "," + serialize(root.left) + "," + serialize(root.right);
}

public TreeNode deserialize(String data) {
    Queue<String> q = new LinkedList<>(Arrays.asList(data.split(",")));
    return build(q);
}

TreeNode build(Queue<String> q) {
    String v = q.poll();
    if (v.equals("null")) return null;
    TreeNode n = new TreeNode(Integer.parseInt(v));
    n.left = build(q); n.right = build(q);
    return n;
}
```

```
      1
     / \         serialize → "1,2,null,null,3,4,null,null,5,null,null"
    2   3
       / \
      4   5

Deserialize: queue = [1,2,null,null,3,4,null,null,5,null,null]
  poll 1→root. Left=poll 2→left. poll null,null→leaves.
  Right=poll 3. poll 4→left of 3. poll 5→right of 3. ✅

💡 Preorder with null markers. Queue enables sequential reconstruction.
```

**Complexity**: Time O(n). Space O(n).

---

# 🔤 Tries

### 39. Implement Trie 🟡

```java
class Trie {
    Trie[] ch = new Trie[26];
    boolean end;

    public void insert(String w) {
        Trie n = this;
        for (char c : w.toCharArray()) {
            int i = c - 'a';
            if (n.ch[i] == null) n.ch[i] = new Trie();
            n = n.ch[i];
        }
        n.end = true;
    }

    public boolean search(String w) { Trie n = find(w); return n != null && n.end; }
    public boolean startsWith(String p) { return find(p) != null; }

    Trie find(String w) {
        Trie n = this;
        for (char c : w.toCharArray()) {
            if (n.ch[c-'a'] == null) return null;
            n = n.ch[c-'a'];
        }
        return n;
    }
}
```

```
insert("apple"): root→a→p→p→l→e(✓)
search("app"): traverse a→p→p, end=true ✅
startsWith("ap"): node exists ✅

💡 Each node = 26 children. end marks complete words.
```

**Complexity**: Insert/Search O(L). Space O(N·L).

---

### 40. Add and Search Words 🟡

```java
class WordDictionary {
    WordDictionary[] ch = new WordDictionary[26];
    boolean end;

    public void addWord(String w) {
        WordDictionary n = this;
        for (char c : w.toCharArray()) {
            int i = c-'a';
            if (n.ch[i] == null) n.ch[i] = new WordDictionary();
            n = n.ch[i];
        }
        n.end = true;
    }

    public boolean search(String w) { return dfs(w, 0, this); }

    boolean dfs(String w, int i, WordDictionary n) {
        if (n == null) return false;
        if (i == w.length()) return n.end;
        if (w.charAt(i) == '.') {
            for (var c : n.ch) if (dfs(w, i+1, c)) return true;
            return false;
        }
        return dfs(w, i+1, n.ch[w.charAt(i)-'a']);
    }
}
```

```
search("b.d") → b→(try all)→d → found ✅

💡 '.' wildcard = try all 26 children (backtracking in trie).
```

**Complexity**: Search O(26^dots · L). Insert O(L).

---

### 41. Word Search II 🔴

```java
public List<String> findWords(char[][] board, String[] words) {
    TrieNode root = buildTrie(words);
    List<String> res = new ArrayList<>();
    for (int i = 0; i < board.length; i++)
        for (int j = 0; j < board[0].length; j++)
            dfs(board, i, j, root, res);
    return res;
}

void dfs(char[][] b, int r, int c, TrieNode n, List<String> res) {
    if (r<0||r>=b.length||c<0||c>=b[0].length) return;
    char ch = b[r][c];
    if (ch=='#'||n.children[ch-'a']==null) return;
    n = n.children[ch-'a'];
    if (n.word != null) { res.add(n.word); n.word = null; }
    b[r][c] = '#';
    dfs(b,r+1,c,n,res); dfs(b,r-1,c,n,res);
    dfs(b,r,c+1,n,res); dfs(b,r,c-1,n,res);
    b[r][c] = ch;
}
```

```
board:      words: ["oath","pea","eat","rain"]
o a a n
e t a e     Trie:  root→o→a→t→h(✓)
i h k r            root→e→a→t(✓)
                   root→p→e→a(✓)

DFS from (0,0)='o': trie has o→follow. (1,0)='e'? no 'e' child of 'o'.
  But (0,1)='a': o→a→match! (1,1)='t': o→a→t→match! (1,2)='h'? no.
  But (0,2)='a': no. Try (2,1)='h': o→a→t→h→"oath" found! ✅

💡 Build trie from words. DFS from each cell, follow trie paths. Trie prunes search space.
```

**Complexity**: Time O(m·n·4^L). Space O(total chars).

---

# ⛰️ Heap / Priority Queue

> [Deep dive →](./09-heaps-priority-queues.md)

### 42. Find Median from Data Stream 🔴

```java
PriorityQueue<Integer> small = new PriorityQueue<>(Collections.reverseOrder());
PriorityQueue<Integer> large = new PriorityQueue<>();

public void addNum(int num) {
    small.offer(num);
    large.offer(small.poll());
    if (large.size() > small.size()) small.offer(large.poll());
}

public double findMedian() {
    return small.size() > large.size() ? small.peek()
        : (small.peek() + large.peek()) / 2.0;
}
```

```
Stream: 5, 2, 8, 1, 4

       max-heap (small)   |   min-heap (large)
       ← left half        |   right half →
Add 5: [5]                |   []               median = 5
Add 2: [2]                |   [5]              median = (2+5)/2 = 3.5
Add 8: [5,2]              |   [8]              median = 5
Add 1: [2,1]              |   [5,8]            median = (2+5)/2 = 3.5
Add 4: [4,2,1]            |   [5,8]            median = 4 ✅

💡 Two heaps: max-heap (left half) ≤ min-heap (right half). Balance sizes.
```

**Complexity**: addNum O(log n). findMedian O(1).

---

# 🔙 Backtracking

> [Deep dive →](./11-backtracking.md)

### 43. Combination Sum 🟡

```java
public List<List<Integer>> combinationSum(int[] cands, int target) {
    List<List<Integer>> res = new ArrayList<>();
    bt(cands, target, 0, new ArrayList<>(), res);
    return res;
}

void bt(int[] nums, int rem, int start, List<Integer> path, List<List<Integer>> res) {
    if (rem == 0) { res.add(new ArrayList<>(path)); return; }
    if (rem < 0) return;
    for (int i = start; i < nums.length; i++) {
        path.add(nums[i]);
        bt(nums, rem-nums[i], i, path, res);  // i not i+1 (reuse)
        path.remove(path.size()-1);
    }
}
```

```
cands=[2,3,6,7], target=7

                     bt(7, [])          rem=7
              /          |        \         \
      bt(5,[2])    bt(4,[3])  bt(1,[6])  bt(0,[7])✅
       /    |         |            ❌
 bt(3,[2,2]) bt(2,[2,3]) bt(1,[3,3])
   /    |       ❌           ❌
bt(1,[2,2,2]) bt(0,[2,2,3])✅
   ❌

Result: [[2,2,3], [7]] ✅

💡 Start from i (not i+1) for reuse. Prune when remain < 0.
```

**Complexity**: Time O(n^(T/M)). Space O(T/M).

---

### 44. Word Search 🟡

```java
public boolean exist(char[][] board, String word) {
    for (int i = 0; i < board.length; i++)
        for (int j = 0; j < board[0].length; j++)
            if (dfs(board, word, i, j, 0)) return true;
    return false;
}

boolean dfs(char[][] b, String w, int r, int c, int idx) {
    if (idx == w.length()) return true;
    if (r<0||r>=b.length||c<0||c>=b[0].length||b[r][c]!=w.charAt(idx)) return false;
    char tmp = b[r][c]; b[r][c] = '#';
    boolean found = dfs(b,w,r+1,c,idx+1)||dfs(b,w,r-1,c,idx+1)
                  ||dfs(b,w,r,c+1,idx+1)||dfs(b,w,r,c-1,idx+1);
    b[r][c] = tmp;
    return found;
}
```

```
board:         word = "ABCCED"
A B C E
S F C S
A D E E

Start (0,0)='A' matches w[0].
  (0,1)='B' matches w[1]. (0,2)='C' matches w[2].
    (1,2)='C' matches w[3]. (2,2)='E' matches w[4].
      (2,1)='D' matches w[5] → found! ✅

Path: A(0,0)→B(0,1)→C(0,2)→C(1,2)→E(2,2)→D(2,1)

💡 DFS with backtracking. Mark visited with '#', restore after.
```

**Complexity**: Time O(m·n·4^L). Space O(L).

---

# 🌐 Graphs

> [Deep dive →](./10-graphs.md)

### 45. Number of Islands 🟡

```java
public int numIslands(char[][] grid) {
    int count = 0;
    for (int i = 0; i < grid.length; i++)
        for (int j = 0; j < grid[0].length; j++)
            if (grid[i][j] == '1') { dfs(grid, i, j); count++; }
    return count;
}

void dfs(char[][] g, int r, int c) {
    if (r<0||r>=g.length||c<0||c>=g[0].length||g[r][c]!='1') return;
    g[r][c] = '0';
    dfs(g,r+1,c); dfs(g,r-1,c); dfs(g,r,c+1); dfs(g,r,c-1);
}
```

```
1 1 0 0 0      0 0 0 0 0
1 1 0 0 0  →   0 0 0 0 0   count=1
0 0 1 0 0      0 0 0 0 0   count=2
0 0 0 1 1      0 0 0 0 0   count=3

💡 DFS flood-fill sinks visited land. Each trigger = new island.
```

**Complexity**: Time O(m·n). Space O(m·n).

---

### 46. Clone Graph 🟡

```java
Map<Node, Node> visited = new HashMap<>();
public Node cloneGraph(Node node) {
    if (node == null) return null;
    if (visited.containsKey(node)) return visited.get(node);
    Node clone = new Node(node.val);
    visited.put(node, clone);
    for (Node n : node.neighbors) clone.neighbors.add(cloneGraph(n));
    return clone;
}
```

```
  1 ── 2          clone(1): create 1', visit neighbors
  |    |            clone(2): create 2', visit neighbors
  4 ── 3            clone(3)→clone(4)→ all cloned. Wire neighbors.

original:                 cloned:
  1'→[2',4']              1'→[2',4']    (deep copy) ✅
  2'→[1',3']              2'→[1',3']
  3'→[2',4']              3'→[2',4']
  4'→[1',3']              4'→[1',3']

💡 DFS + HashMap to track cloned nodes. Prevents infinite loops in cycles.
```

**Complexity**: Time O(V+E). Space O(V).

---

### 47. Pacific Atlantic Water Flow 🟡

```java
public List<List<Integer>> pacificAtlantic(int[][] heights) {
    int m = heights.length, n = heights[0].length;
    boolean[][] pac = new boolean[m][n], atl = new boolean[m][n];
    for (int i = 0; i < m; i++) { dfs(heights,pac,i,0); dfs(heights,atl,i,n-1); }
    for (int j = 0; j < n; j++) { dfs(heights,pac,0,j); dfs(heights,atl,m-1,j); }
    List<List<Integer>> res = new ArrayList<>();
    for (int i = 0; i < m; i++)
        for (int j = 0; j < n; j++)
            if (pac[i][j] && atl[i][j]) res.add(Arrays.asList(i, j));
    return res;
}
```

```
heights:           Pacific (top+left)   Atlantic (right+bot)
 1 2 2 3 5        P P P P P             . . . . A
 3 2 3 4 4        P . . . .             . . . A A
 2 4 5 3 1        P . . . .             . . A A A
 6 7 1 4 5        P . . . .             . A A A A
 5 1 1 2 4        P . . . .             A A A A A

DFS from Pacific border inward (↑ or →), mark reachable.
DFS from Atlantic border inward (↑ or ←), mark reachable.
Intersection = cells that flow to BOTH oceans ✅

💡 Reverse thinking: DFS from ocean borders inward. Result = intersection of both reachable sets.
```

**Complexity**: Time O(m·n). Space O(m·n).

---

### 48. Course Schedule 🟡

```java
public boolean canFinish(int n, int[][] prereqs) {
    List<List<Integer>> adj = new ArrayList<>();
    int[] inDeg = new int[n];
    for (int i = 0; i < n; i++) adj.add(new ArrayList<>());
    for (int[] p : prereqs) { adj.get(p[1]).add(p[0]); inDeg[p[0]]++; }
    Queue<Integer> q = new LinkedList<>();
    for (int i = 0; i < n; i++) if (inDeg[i] == 0) q.offer(i);
    int count = 0;
    while (!q.isEmpty()) {
        int c = q.poll(); count++;
        for (int next : adj.get(c)) if (--inDeg[next] == 0) q.offer(next);
    }
    return count == n;
}
```

```
n=4, prereqs=[[1,0],[2,1],[3,2]]
inDeg: [0,1,1,1] → start with 0
Process 0→1(deg:0)→2(deg:0)→3(deg:0) → count=4=n ✅

💡 Topological sort (Kahn's). If count < n, cycle exists.
```

**Complexity**: Time O(V+E). Space O(V+E).

---

### 49. Number of Connected Components 🟡

```java
public int countComponents(int n, int[][] edges) {
    int[] parent = new int[n], rank = new int[n];
    for (int i = 0; i < n; i++) parent[i] = i;
    int components = n;
    for (int[] e : edges)
        if (union(parent, rank, e[0], e[1])) components--;
    return components;
}

int find(int[] p, int x) { return p[x] == x ? x : (p[x] = find(p, p[x])); }

boolean union(int[] p, int[] r, int a, int b) {
    int pa = find(p, a), pb = find(p, b);
    if (pa == pb) return false;
    if (r[pa] < r[pb]) p[pa] = pb; else if (r[pa] > r[pb]) p[pb] = pa;
    else { p[pb] = pa; r[pa]++; }
    return true;
}
```

```
n=5, edges=[[0,1],[1,2],[3,4]]

parent: [0,1,2,3,4]  components=5
union(0,1): parent[1]=0  components=4
union(1,2): find(1)=0, parent[2]=0  components=3
union(3,4): parent[4]=3  components=2

Answer: 2  (groups: {0,1,2} and {3,4}) ✅

💡 Union-Find. Start with n components. Each successful union decrements by 1.
```

**Complexity**: Time O(E·α(n)) ≈ O(E). Space O(n).

---

### 50. Graph Valid Tree 🟡

```java
public boolean validTree(int n, int[][] edges) {
    if (edges.length != n - 1) return false;  // Tree must have n-1 edges
    int[] parent = new int[n];
    for (int i = 0; i < n; i++) parent[i] = i;
    for (int[] e : edges)
        if (!union(parent, e[0], e[1])) return false;  // Cycle detected
    return true;
}
```

```
n=5, edges=[[0,1],[0,2],[0,3],[1,4]]
Edge count = 4 = n-1 ✅ (first check passes)

union(0,1)✅ union(0,2)✅ union(0,3)✅ union(1,4)✅ → no cycle → valid tree ✅

n=5, edges=[[0,1],[1,2],[2,3],[1,3],[1,4]]
Edge count = 5 ≠ 4 → NOT a tree ❌ (rejected immediately)

💡 Tree = connected + no cycles. Check: exactly n-1 edges + Union-Find finds no cycle.
```

**Complexity**: Time O(E·α(n)). Space O(n).

---

# 📈 1-D Dynamic Programming

> [Deep dive →](./12-dynamic-programming.md)

### 51. Climbing Stairs 🟢

```java
public int climbStairs(int n) {
    if (n <= 2) return n;
    int a = 1, b = 2;
    for (int i = 3; i <= n; i++) { int c = a + b; a = b; b = c; }
    return b;
}
```

```
n=5: 1→2→3→5→8  (Fibonacci!)

💡 dp[i] = dp[i-1] + dp[i-2]. Only need last two values.
```

**Complexity**: Time O(n). Space O(1).

---

### 52. House Robber 🟡

```java
public int rob(int[] nums) {
    int prev2 = 0, prev1 = 0;
    for (int n : nums) {
        int curr = Math.max(prev1, prev2 + n);
        prev2 = prev1; prev1 = curr;
    }
    return prev1;
}
```

```
nums = [2,7,9,3,1]
prev2=0,prev1=0
n=2: curr=max(0,0+2)=2, prev2=0,prev1=2
n=7: curr=max(2,0+7)=7, prev2=2,prev1=7
n=9: curr=max(7,2+9)=11, prev2=7,prev1=11
n=3: curr=max(11,7+3)=11
n=1: curr=max(11,11+1)=12 ✅

💡 Rob or skip each house: dp[i] = max(dp[i-1], dp[i-2]+nums[i]).
```

**Complexity**: Time O(n). Space O(1).

---

### 53. House Robber II 🟡

```java
public int rob(int[] nums) {
    if (nums.length == 1) return nums[0];
    return Math.max(robRange(nums, 0, nums.length-2),
                    robRange(nums, 1, nums.length-1));
}

int robRange(int[] nums, int lo, int hi) {
    int p2 = 0, p1 = 0;
    for (int i = lo; i <= hi; i++) { int c = Math.max(p1, p2+nums[i]); p2=p1; p1=c; }
    return p1;
}
```

```
nums = [2, 3, 2] (circular: house 0 and house 2 are adjacent)

Split into two linear problems:
  Case 1: rob [0..1] = [2, 3] → max = 3
  Case 2: rob [1..2] = [3, 2] → max = 3
  Answer: max(3, 3) = 3 ✅

nums = [1, 2, 3, 1] → rob [0..2]=[1,2,3]→4, rob [1..3]=[2,3,1]→3 → answer=4 ✅

💡 Circular: can't rob both first and last. Run House Robber twice: [0..n-2] and [1..n-1].
```

**Complexity**: Time O(n). Space O(1).

---

### 54. Longest Palindromic Substring 🟡

```java
int start = 0, maxLen = 0;
public String longestPalindrome(String s) {
    for (int i = 0; i < s.length(); i++) {
        expand(s, i, i);     // Odd length
        expand(s, i, i + 1); // Even length
    }
    return s.substring(start, start + maxLen);
}

void expand(String s, int l, int r) {
    while (l >= 0 && r < s.length() && s.charAt(l) == s.charAt(r)) { l--; r++; }
    if (r - l - 1 > maxLen) { start = l + 1; maxLen = r - l - 1; }
}
```

```
s = "babad"
Center at 'a'(1): expand → "bab" len=3 ✅
Center at 'b'(2): expand → "aba" len=3
Center at 'a'(3): expand → "bab"... but same length

💡 Expand from each center (odd + even). O(n²) but simple and practical.
```

**Complexity**: Time O(n²). Space O(1).

---

### 55. Palindromic Substrings 🟡

```java
public int countSubstrings(String s) {
    int count = 0;
    for (int i = 0; i < s.length(); i++) {
        count += expand(s, i, i);     // Odd
        count += expand(s, i, i + 1); // Even
    }
    return count;
}

int expand(String s, int l, int r) {
    int cnt = 0;
    while (l >= 0 && r < s.length() && s.charAt(l) == s.charAt(r)) { cnt++; l--; r++; }
    return cnt;
}
```

```
s = "aaa"
Center 0 (a):   "a" ✅                    count=1
Center 0-1 (a,a): "aa" ✅                  count=2
Center 1 (a):   "a" ✅, expand→ "aaa" ✅   count=4
Center 1-2 (a,a): "aa" ✅                  count=5
Center 2 (a):   "a" ✅                     count=6

Answer: 6 ✅

💡 Same expand technique. Count every palindrome found during expansion.
```

**Complexity**: Time O(n²). Space O(1).

---

### 56. Decode Ways 🟡

```java
public int numDecodings(String s) {
    int n = s.length();
    int[] dp = new int[n + 1];
    dp[n] = 1;
    for (int i = n - 1; i >= 0; i--) {
        if (s.charAt(i) == '0') dp[i] = 0;
        else {
            dp[i] = dp[i + 1];
            if (i + 1 < n && Integer.parseInt(s.substring(i, i + 2)) <= 26)
                dp[i] += dp[i + 2];
        }
    }
    return dp[0];
}
```

```
s = "226"
dp[3]=1
i=2: '6'→dp[2]=dp[3]=1
i=1: '2'→dp[1]=dp[2]=1, "26"≤26→dp[1]+=dp[3]=2
i=0: '2'→dp[0]=dp[1]=2, "22"≤26→dp[0]+=dp[2]=3

3 ways: "2|2|6", "22|6", "2|26" ✅
```

**Complexity**: Time O(n). Space O(n).

---

### 57. Coin Change 🟡

```java
public int coinChange(int[] coins, int amount) {
    int[] dp = new int[amount + 1];
    Arrays.fill(dp, amount + 1);
    dp[0] = 0;
    for (int i = 1; i <= amount; i++)
        for (int c : coins)
            if (c <= i) dp[i] = Math.min(dp[i], dp[i - c] + 1);
    return dp[amount] > amount ? -1 : dp[amount];
}
```

```
coins=[1,3,4], amount=6
dp: [0,1,2,1,1,2,2]
dp[6] = min(dp[5]+1, dp[3]+1, dp[2]+1) = min(3,2,3) = 2 → coins [3,3] ✅

💡 dp[i] = min coins to make amount i. Try each coin.
```

**Complexity**: Time O(amount·coins). Space O(amount).

---

### 58. Maximum Product Subarray 🟡

```java
public int maxProduct(int[] nums) {
    int max = nums[0], min = nums[0], result = nums[0];
    for (int i = 1; i < nums.length; i++) {
        if (nums[i] < 0) { int t = max; max = min; min = t; }
        max = Math.max(nums[i], max * nums[i]);
        min = Math.min(nums[i], min * nums[i]);
        result = Math.max(result, max);
    }
    return result;
}
```

```
nums = [2,3,-2,4]
i=0: max=2, min=2, res=2
i=1: max=6, min=3, res=6
i=2: neg→swap, max=max(-2,-12)=-2, min=min(-2,-6)=-6, res=6
i=3: max=max(4,-8)=4, res=6 ✅

💡 Track both max AND min (negative×negative = positive). Swap on negative.
```

**Complexity**: Time O(n). Space O(1).

---

### 59. Word Break 🟡

```java
public boolean wordBreak(String s, List<String> wordDict) {
    Set<String> dict = new HashSet<>(wordDict);
    boolean[] dp = new boolean[s.length() + 1];
    dp[0] = true;
    for (int i = 1; i <= s.length(); i++)
        for (int j = 0; j < i; j++)
            if (dp[j] && dict.contains(s.substring(j, i))) { dp[i] = true; break; }
    return dp[s.length()];
}
```

```
s="leetcode", dict=["leet","code"]
dp[4]=true ("leet"), dp[8]=true ("code") → true ✅

💡 dp[i] = can s[0..i] be segmented? Try all split points j where dp[j]=true.
```

**Complexity**: Time O(n²·L). Space O(n).

---

### 60. Longest Increasing Subsequence 🟡

```java
public int lengthOfLIS(int[] nums) {
    List<Integer> tails = new ArrayList<>();
    for (int n : nums) {
        int pos = Collections.binarySearch(tails, n);
        if (pos < 0) pos = -(pos + 1);
        if (pos == tails.size()) tails.add(n);
        else tails.set(pos, n);
    }
    return tails.size();
}
```

```
nums = [10,9,2,5,3,7,101,18]
tails: [10] → [9] → [2] → [2,5] → [2,3] → [2,3,7] → [2,3,7,101] → [2,3,7,18]
Answer: 4 (LIS: [2,3,7,101] or [2,3,7,18]) ✅

💡 Binary search on patience-sort tails. O(n log n) vs O(n²) DP.
```

**Complexity**: Time O(n log n). Space O(n).

---

# 📊 2-D Dynamic Programming

### 61. Unique Paths 🟡

```java
public int uniquePaths(int m, int n) {
    int[] dp = new int[n];
    Arrays.fill(dp, 1);
    for (int i = 1; i < m; i++)
        for (int j = 1; j < n; j++)
            dp[j] += dp[j - 1];
    return dp[n - 1];
}
```

```
3×3 grid:
1  1  1
1  2  3
1  3  6  → 6 paths ✅

💡 dp[r][c] = dp[r-1][c] + dp[r][c-1]. Optimize to 1D row.
```

**Complexity**: Time O(m·n). Space O(n).

---

### 62. Longest Common Subsequence 🟡

```java
public int longestCommonSubsequence(String s1, String s2) {
    int m = s1.length(), n = s2.length();
    int[][] dp = new int[m + 1][n + 1];
    for (int i = 1; i <= m; i++)
        for (int j = 1; j <= n; j++)
            dp[i][j] = s1.charAt(i-1) == s2.charAt(j-1)
                ? dp[i-1][j-1] + 1
                : Math.max(dp[i-1][j], dp[i][j-1]);
    return dp[m][n];
}
```

```
s1="abcde", s2="ace"
     ""  a  c  e
"" [  0  0  0  0 ]
a  [  0  1  1  1 ]
b  [  0  1  1  1 ]
c  [  0  1  2  2 ]
d  [  0  1  2  2 ]
e  [  0  1  2  3 ] → LCS = 3 ("ace") ✅

💡 Match → diagonal+1. No match → max(up, left).
```

**Complexity**: Time O(m·n). Space O(m·n).

---

# 💰 Greedy

> [Deep dive →](./13-greedy.md)

### 63. Maximum Subarray 🟡

```java
public int maxSubArray(int[] nums) {
    int curr = nums[0], max = nums[0];
    for (int i = 1; i < nums.length; i++) {
        curr = Math.max(nums[i], curr + nums[i]);
        max = Math.max(max, curr);
    }
    return max;
}
```

```
nums = [-2,1,-3,4,-1,2,1,-5,4]
curr: -2→1→-2→4→3→5→6→1→5
max:  -2→1→ 1→4→4→5→6→6→6  ✅ (subarray [4,-1,2,1])

💡 Kadane's: extend or restart at each element. curr = max(nums[i], curr+nums[i]).
```

**Complexity**: Time O(n). Space O(1).

---

### 64. Jump Game 🟡

```java
public boolean canJump(int[] nums) {
    int farthest = 0;
    for (int i = 0; i < nums.length; i++) {
        if (i > farthest) return false;
        farthest = Math.max(farthest, i + nums[i]);
    }
    return true;
}
```

```
nums = [2,3,1,1,4]
i=0: farthest=2. i=1: farthest=4. 4≥4 → true ✅
nums = [3,2,1,0,4]
i=0: far=3. i=1: far=3. i=2: far=3. i=3: far=3. i=4: 4>3 → false ❌

💡 Track farthest reachable. If current index > farthest, stuck.
```

**Complexity**: Time O(n). Space O(1).

---

# 📐 Intervals

> [Deep dive →](./14-intervals.md)

### 65. Merge Intervals 🟡

```java
public int[][] merge(int[][] intervals) {
    Arrays.sort(intervals, (a,b) -> a[0] - b[0]);
    List<int[]> res = new ArrayList<>();
    res.add(intervals[0]);
    for (int i = 1; i < intervals.length; i++) {
        int[] last = res.get(res.size()-1);
        if (intervals[i][0] <= last[1]) last[1] = Math.max(last[1], intervals[i][1]);
        else res.add(intervals[i]);
    }
    return res.toArray(new int[0][]);
}
```

```
[[1,3],[2,6],[8,10],[15,18]]
[1,3]+[2,6]→[1,6] (overlap). [8,10] no overlap. [15,18] no overlap.
Result: [[1,6],[8,10],[15,18]] ✅

💡 Sort by start. Merge if current start ≤ prev end.
```

**Complexity**: Time O(n log n). Space O(n).

---

### 66. Insert Interval 🟡

```java
public int[][] insert(int[][] intervals, int[] newInt) {
    List<int[]> res = new ArrayList<>();
    int i = 0;
    while (i < intervals.length && intervals[i][1] < newInt[0])
        res.add(intervals[i++]);
    while (i < intervals.length && intervals[i][0] <= newInt[1]) {
        newInt[0] = Math.min(newInt[0], intervals[i][0]);
        newInt[1] = Math.max(newInt[1], intervals[i][1]);
        i++;
    }
    res.add(newInt);
    while (i < intervals.length) res.add(intervals[i++]);
    return res.toArray(new int[0][]);
}
```

```
intervals = [[1,3],[6,9]], newInterval = [2,5]

Phase 1 — Before: none (1 < 2? no, [1,3] overlaps)
Phase 2 — Merge:  [1,3] overlaps [2,5] → merge to [1,5]. [6,9] no overlap.
Phase 3 — After:  add [6,9]

Result: [[1,5],[6,9]] ✅

intervals = [[1,2],[3,5],[6,7],[8,10],[12,16]], newInterval = [4,8]
Before: [1,2]. Merge: [3,5]+[6,7]+[8,10] → [3,10]. After: [12,16]
Result: [[1,2],[3,10],[12,16]] ✅

💡 Three phases: add before, merge overlapping, add after.
```

**Complexity**: Time O(n). Space O(n).

---

### 67. Non-overlapping Intervals 🟡

```java
public int eraseOverlapIntervals(int[][] intervals) {
    Arrays.sort(intervals, (a,b) -> a[1] - b[1]);  // Sort by END
    int count = 0, prevEnd = Integer.MIN_VALUE;
    for (int[] i : intervals) {
        if (i[0] >= prevEnd) prevEnd = i[1];
        else count++;
    }
    return count;
}
```

```
[[1,2],[2,3],[3,4],[1,3]]  Sorted by end: [[1,2],[2,3],[1,3],[3,4]]
Keep [1,2]✅, keep [2,3]✅, remove [1,3]❌(overlap), keep [3,4]✅ → remove 1

💡 Sort by end time. Greedy: always keep interval ending earliest.
```

**Complexity**: Time O(n log n). Space O(1).

---

### 68. Meeting Rooms II 🔴

```java
public int minMeetingRooms(int[][] intervals) {
    int[] starts = new int[intervals.length], ends = new int[intervals.length];
    for (int i = 0; i < intervals.length; i++) {
        starts[i] = intervals[i][0]; ends[i] = intervals[i][1];
    }
    Arrays.sort(starts); Arrays.sort(ends);
    int rooms = 0, endPtr = 0;
    for (int start : starts) {
        if (start < ends[endPtr]) rooms++;
        else endPtr++;
    }
    return rooms;
}
```

```
[[0,30],[5,10],[15,20]]
starts: [0,5,15]  ends: [10,20,30]
s=0 < e=10 → rooms=1. s=5 < e=10 → rooms=2. s=15 ≥ e=10 → endPtr++

Answer: 2 ✅

💡 Sort starts and ends separately. If next start < earliest end, need new room.
```

**Complexity**: Time O(n log n). Space O(n).

---

# 🔢 Math & Geometry

### 69. Rotate Image 🟡

```java
public void rotate(int[][] matrix) {
    int n = matrix.length;
    // Transpose
    for (int i = 0; i < n; i++)
        for (int j = i + 1; j < n; j++) {
            int t = matrix[i][j]; matrix[i][j] = matrix[j][i]; matrix[j][i] = t;
        }
    // Reverse each row
    for (int[] row : matrix)
        for (int l = 0, r = n-1; l < r; l++, r--) {
            int t = row[l]; row[l] = row[r]; row[r] = t;
        }
}
```

```
[1,2,3]    [1,4,7]    [7,4,1]
[4,5,6] →  [2,5,8] →  [8,5,2]  ✅
[7,8,9]    [3,6,9]    [9,6,3]
 (orig)   (transpose) (reverse rows)

💡 Rotate 90° CW = transpose + reverse each row. In-place, O(1) space.
```

**Complexity**: Time O(n²). Space O(1).

---

### 70. Spiral Matrix 🟡

```java
public List<Integer> spiralOrder(int[][] matrix) {
    List<Integer> res = new ArrayList<>();
    int top=0, bot=matrix.length-1, left=0, right=matrix[0].length-1;
    while (top <= bot && left <= right) {
        for (int j = left; j <= right; j++) res.add(matrix[top][j]); top++;
        for (int i = top; i <= bot; i++) res.add(matrix[i][right]); right--;
        if (top <= bot) { for (int j = right; j >= left; j--) res.add(matrix[bot][j]); bot--; }
        if (left <= right) { for (int i = bot; i >= top; i--) res.add(matrix[i][left]); left++; }
    }
    return res;
}
```

```
[1,2,3]
[4,5,6]  → [1,2,3,6,9,8,7,4,5] ✅
[7,8,9]

💡 Shrink boundaries: top++, right--, bot--, left++.
```

**Complexity**: Time O(m·n). Space O(1) extra.

---

# 🔧 Bit Manipulation

> [Deep dive →](./15-bit-manipulation.md)

### 71. Single Number 🟢

```java
public int singleNumber(int[] nums) {
    int res = 0;
    for (int n : nums) res ^= n;
    return res;
}
```

```
[4,1,2,1,2] → 4^1^2^1^2 = 4^(1^1)^(2^2) = 4^0^0 = 4 ✅

💡 XOR: a^a=0, a^0=a. Pairs cancel out, single remains.
```

**Complexity**: Time O(n). Space O(1).

---

### 72. Number of 1 Bits 🟢

```java
public int hammingWeight(int n) {
    int count = 0;
    while (n != 0) { count++; n &= (n - 1); }
    return count;
}
```

```
n=11 (1011): 1011 & 1010 = 1010 (count=1)
             1010 & 1001 = 1000 (count=2)
             1000 & 0111 = 0000 (count=3) ✅

💡 n & (n-1) flips the lowest set bit. Count iterations until 0.
```

**Complexity**: Time O(k) where k=number of 1 bits. Space O(1).

---

### 73. Counting Bits 🟡

```java
public int[] countBits(int n) {
    int[] dp = new int[n + 1];
    for (int i = 1; i <= n; i++) dp[i] = dp[i >> 1] + (i & 1);
    return dp;
}
```

```
dp[0]=0, dp[1]=dp[0]+1=1, dp[2]=dp[1]+0=1, dp[3]=dp[1]+1=2
dp[4]=dp[2]+0=1, dp[5]=dp[2]+1=2
Result: [0,1,1,2,1,2] ✅

💡 dp[i] = dp[i/2] + last bit. Right-shift reuses previous results.
```

**Complexity**: Time O(n). Space O(n).

---

### 74. Reverse Bits 🟢

```java
public int reverseBits(int n) {
    int res = 0;
    for (int i = 0; i < 32; i++) {
        res = (res << 1) | (n & 1);
        n >>= 1;
    }
    return res;
}
```

```
n = ...1011 → extract rightmost bit, shift into result left
After 32 iterations: bits are reversed ✅

💡 Extract LSB of n, push into result. 32 iterations for all bits.
```

**Complexity**: Time O(1). Space O(1).

---

### 75. Missing Number 🟡

```java
public int missingNumber(int[] nums) {
    int xor = nums.length;
    for (int i = 0; i < nums.length; i++) xor ^= i ^ nums[i];
    return xor;
}
```

```
nums = [3,0,1], n=3
xor = 3 ^ (0^3) ^ (1^0) ^ (2^1) = 3^3^0^1^0^2^1 = (3^3)^(1^1)^(0^0)^2 = 2 ✅

💡 XOR all indices (0..n) with all values. Missing number survives.
```

**Complexity**: Time O(n). Space O(1).

---

# 🏁 Quick Reference — All 75 Problems

| # | Problem | Pattern | Time | Space | Difficulty |
|---|---------|---------|------|-------|------------|
| 1 | Two Sum | HashMap | O(n) | O(n) | 🟢 |
| 2 | Contains Duplicate | HashSet | O(n) | O(n) | 🟢 |
| 3 | Valid Anagram | Counting | O(n) | O(1) | 🟢 |
| 4 | Group Anagrams | Sort+Map | O(nk log k) | O(nk) | 🟡 |
| 5 | Top K Frequent | Bucket Sort | O(n) | O(n) | 🟡 |
| 6 | Product Except Self | Prefix | O(n) | O(1) | 🟡 |
| 7 | Valid Sudoku | HashSet | O(1) | O(1) | 🟡 |
| 8 | Encode/Decode | Length Prefix | O(n) | O(n) | 🟡 |
| 9 | Longest Consecutive | HashSet | O(n) | O(n) | 🟡 |
| 10 | Valid Palindrome | Two Pointers | O(n) | O(1) | 🟢 |
| 11 | 3Sum | Sort+2P | O(n²) | O(1) | 🟡 |
| 12 | Container Water | Two Pointers | O(n) | O(1) | 🟡 |
| 13 | Trapping Rain Water | Two Pointers | O(n) | O(1) | 🔴 |
| 14 | Two Sum II | Two Pointers | O(n) | O(1) | 🟡 |
| 15 | Buy/Sell Stock | Sliding Window | O(n) | O(1) | 🟢 |
| 16 | Longest No Repeat | Sliding Window | O(n) | O(1) | 🟡 |
| 17 | Char Replacement | Sliding Window | O(n) | O(1) | 🟡 |
| 18 | Min Window Substr | Sliding Window | O(n) | O(1) | 🔴 |
| 19 | Valid Parentheses | Stack | O(n) | O(n) | 🟢 |
| 20 | Search Rotated | Binary Search | O(log n) | O(1) | 🟡 |
| 21 | Find Min Rotated | Binary Search | O(log n) | O(1) | 🟡 |
| 22 | Reverse List | Iteration | O(n) | O(1) | 🟢 |
| 23 | Merge Two Lists | Two Pointers | O(n+m) | O(1) | 🟢 |
| 24 | Linked List Cycle | Floyd's | O(n) | O(1) | 🟢 |
| 25 | Reorder List | Mid+Rev+Merge | O(n) | O(1) | 🟡 |
| 26 | Remove Nth End | Two Pointers | O(n) | O(1) | 🟡 |
| 27 | Merge K Lists | Heap | O(N log k) | O(k) | 🔴 |
| 28 | Invert Tree | Recursion | O(n) | O(h) | 🟢 |
| 29 | Max Depth | Recursion | O(n) | O(h) | 🟢 |
| 30 | Same Tree | Recursion | O(n) | O(h) | 🟢 |
| 31 | Subtree of Tree | Recursion | O(m·n) | O(h) | 🟢 |
| 32 | LCA of BST | BST Property | O(h) | O(1) | 🟡 |
| 33 | Level Order | BFS | O(n) | O(w) | 🟡 |
| 34 | Validate BST | DFS+Range | O(n) | O(h) | 🟡 |
| 35 | Kth Smallest BST | Inorder | O(h+k) | O(h) | 🟡 |
| 36 | Build from Pre+In | Recursion | O(n) | O(n) | 🟡 |
| 37 | Max Path Sum | DFS | O(n) | O(h) | 🔴 |
| 38 | Serialize Tree | DFS | O(n) | O(n) | 🔴 |
| 39 | Implement Trie | Trie | O(L) | O(N·L) | 🟡 |
| 40 | Add/Search Words | Trie+DFS | O(26^d·L) | O(N·L) | 🟡 |
| 41 | Word Search II | Trie+DFS | O(mn·4^L) | O(chars) | 🔴 |
| 42 | Find Median | Two Heaps | O(log n) | O(n) | 🔴 |
| 43 | Combination Sum | Backtracking | O(n^(T/M)) | O(T/M) | 🟡 |
| 44 | Word Search | Backtracking | O(mn·4^L) | O(L) | 🟡 |
| 45 | Number of Islands | DFS | O(m·n) | O(m·n) | 🟡 |
| 46 | Clone Graph | DFS+Map | O(V+E) | O(V) | 🟡 |
| 47 | Pacific Atlantic | Multi-source DFS | O(m·n) | O(m·n) | 🟡 |
| 48 | Course Schedule | Topological Sort | O(V+E) | O(V+E) | 🟡 |
| 49 | Connected Components | Union-Find | O(E·α) | O(n) | 🟡 |
| 50 | Graph Valid Tree | Union-Find | O(E·α) | O(n) | 🟡 |
| 51 | Climbing Stairs | DP | O(n) | O(1) | 🟢 |
| 52 | House Robber | DP | O(n) | O(1) | 🟡 |
| 53 | House Robber II | DP (circular) | O(n) | O(1) | 🟡 |
| 54 | Longest Palindrome | Expand Center | O(n²) | O(1) | 🟡 |
| 55 | Palindrome Count | Expand Center | O(n²) | O(1) | 🟡 |
| 56 | Decode Ways | DP | O(n) | O(n) | 🟡 |
| 57 | Coin Change | DP | O(n·c) | O(n) | 🟡 |
| 58 | Max Product Sub | DP | O(n) | O(1) | 🟡 |
| 59 | Word Break | DP | O(n²·L) | O(n) | 🟡 |
| 60 | LIS | Binary Search | O(n log n) | O(n) | 🟡 |
| 61 | Unique Paths | DP | O(m·n) | O(n) | 🟡 |
| 62 | LCS | DP | O(m·n) | O(m·n) | 🟡 |
| 63 | Max Subarray | Kadane's | O(n) | O(1) | 🟡 |
| 64 | Jump Game | Greedy | O(n) | O(1) | 🟡 |
| 65 | Merge Intervals | Sort+Sweep | O(n log n) | O(n) | 🟡 |
| 66 | Insert Interval | Linear Scan | O(n) | O(n) | 🟡 |
| 67 | Non-overlapping | Greedy | O(n log n) | O(1) | 🟡 |
| 68 | Meeting Rooms II | Sort | O(n log n) | O(n) | 🔴 |
| 69 | Rotate Image | Transpose+Rev | O(n²) | O(1) | 🟡 |
| 70 | Spiral Matrix | Boundary | O(m·n) | O(1) | 🟡 |
| 71 | Single Number | XOR | O(n) | O(1) | 🟢 |
| 72 | Number of 1 Bits | Bit Trick | O(k) | O(1) | 🟢 |
| 73 | Counting Bits | DP+Bits | O(n) | O(n) | 🟡 |
| 74 | Reverse Bits | Bit Shift | O(1) | O(1) | 🟢 |
| 75 | Missing Number | XOR | O(n) | O(1) | 🟡 |

---

*🎯 Master these 75 problems and you'll have the pattern vocabulary to tackle any coding interview. Good luck!*
