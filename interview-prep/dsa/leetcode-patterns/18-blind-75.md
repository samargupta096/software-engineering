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

### 1. Two Sum 🟢

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

### 2. Contains Duplicate 🟢

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

### 3. Valid Anagram 🟢

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

### 4. Group Anagrams 🟡

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

### 5. Top K Frequent Elements 🟡

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

### 6. Product of Array Except Self 🟡

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

### 7. Valid Sudoku 🟡

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

### 8. Encode and Decode Strings 🟡

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

### 9. Longest Consecutive Sequence 🟡

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

### 10. Valid Palindrome 🟢

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

### 11. 3Sum 🟡

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

### 12. Container With Most Water 🟡

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

### 13. Trapping Rain Water 🔴

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

### 14. Two Sum II (Sorted) 🟡

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

### 15. Best Time to Buy and Sell Stock 🟢

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

### 16. Longest Substring Without Repeating Characters 🟡

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

### 17. Longest Repeating Character Replacement 🟡

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

### 18. Minimum Window Substring 🔴

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

### 19. Valid Parentheses 🟢

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
