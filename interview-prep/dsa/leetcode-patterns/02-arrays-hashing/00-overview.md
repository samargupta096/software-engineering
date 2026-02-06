[🏠 Home](../../README.md) | [⬅️ Time Complexity](../01-time-space-complexity.md) | [➡️ Two Pointers](../03-two-pointers/00-overview.md)

# 📦 Arrays & Hashing

> The foundation of most coding problems

---

## 🎯 When to Use

| Clue | Pattern |
|------|---------|
| "Find if exists" | HashMap/HashSet |
| "Count frequency" | HashMap |
| "Find pair that sums to X" | HashMap (complement lookup) |
| "Group similar items" | HashMap with List values |
| "Find duplicates" | HashSet |

---

## 🔧 Core Techniques

### 1. HashMap for O(1) Lookup

**Problem**: Find two numbers that sum to target

```java
// ❌ Brute Force: O(n²)
for (int i = 0; i < n; i++) {
    for (int j = i + 1; j < n; j++) {
        if (nums[i] + nums[j] == target) return new int[]{i, j};
    }
}

// ✅ HashMap: O(n)
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

**Memory Visualization**:
```
nums = [2, 7, 11, 15], target = 9

Step 1: i=0, nums[i]=2
        complement = 9-2 = 7
        map = {2: 0}
        
Step 2: i=1, nums[i]=7
        complement = 9-7 = 2
        map.containsKey(2) ✅ → return [0, 1]
```

---

### 2. HashSet for Duplicate Detection

```java
// Check if array contains duplicate
public boolean containsDuplicate(int[] nums) {
    Set<Integer> seen = new HashSet<>();
    for (int num : nums) {
        if (!seen.add(num)) {  // add() returns false if exists
            return true;
        }
    }
    return false;
}
```

---

### 3. Frequency Counting

```java
// Count character frequency
public Map<Character, Integer> countFrequency(String s) {
    Map<Character, Integer> freq = new HashMap<>();
    for (char c : s.toCharArray()) {
        freq.put(c, freq.getOrDefault(c, 0) + 1);
    }
    return freq;
}

// Java 8+ Alternative
Map<Character, Long> freq = s.chars()
    .mapToObj(c -> (char) c)
    .collect(Collectors.groupingBy(c -> c, Collectors.counting()));
```

---

### 4. Grouping with HashMap

```java
// Group anagrams: ["eat","tea","tan","ate","nat","bat"]
// Output: [["bat"],["nat","tan"],["ate","eat","tea"]]
public List<List<String>> groupAnagrams(String[] strs) {
    Map<String, List<String>> map = new HashMap<>();
    
    for (String s : strs) {
        char[] chars = s.toCharArray();
        Arrays.sort(chars);
        String key = new String(chars);  // "eat" → "aet"
        
        map.computeIfAbsent(key, k -> new ArrayList<>()).add(s);
    }
    
    return new ArrayList<>(map.values());
}
```

---

### 5. Prefix Sum for Range Queries

```java
// Compute prefix sum for O(1) range sum queries
public class PrefixSum {
    private int[] prefix;
    
    public PrefixSum(int[] nums) {
        prefix = new int[nums.length + 1];
        for (int i = 0; i < nums.length; i++) {
            prefix[i + 1] = prefix[i] + nums[i];
        }
    }
    
    // Sum of elements from index i to j (inclusive)
    public int rangeSum(int i, int j) {
        return prefix[j + 1] - prefix[i];
    }
}
```

**Visualization**:
```
nums   = [1, 2, 3, 4, 5]
prefix = [0, 1, 3, 6, 10, 15]
         
rangeSum(1, 3) = prefix[4] - prefix[1] = 10 - 1 = 9
                 (2 + 3 + 4 = 9) ✅
```

---

## 📊 Complexity Summary

| Technique | Time | Space |
|-----------|------|-------|
| HashMap lookup | O(1) avg | O(n) |
| HashSet add/contains | O(1) avg | O(n) |
| Frequency count | O(n) | O(k) k=unique |
| Prefix sum build | O(n) | O(n) |
| Prefix sum query | O(1) | - |

---

## ⚠️ Common Mistakes

1. **Not handling duplicates**: Use `getOrDefault()` for counting
2. **Wrong key type**: Use `Arrays.toString()` for array keys
3. **Modifying during iteration**: Use iterator or collect first

---

## 📝 Practice Problems

| # | Problem | Difficulty | Link | Key Pattern |
|---|---------|------------|------|-------------|
| 1 | Two Sum | 🟢 Easy | [LeetCode](https://leetcode.com/problems/two-sum/) | HashMap complement |
| 2 | Contains Duplicate | 🟢 Easy | [LeetCode](https://leetcode.com/problems/contains-duplicate/) | HashSet |
| 3 | Valid Anagram | 🟢 Easy | [LeetCode](https://leetcode.com/problems/valid-anagram/) | Frequency count |
| 4 | Group Anagrams | 🟡 Medium | [LeetCode](https://leetcode.com/problems/group-anagrams/) | HashMap grouping |
| 5 | Top K Frequent Elements | 🟡 Medium | [LeetCode](https://leetcode.com/problems/top-k-frequent-elements/) | Frequency + Bucket |
| 6 | Product of Array Except Self | 🟡 Medium | [LeetCode](https://leetcode.com/problems/product-of-array-except-self/) | Prefix/Suffix |
| 7 | Longest Consecutive Sequence | 🟡 Medium | [LeetCode](https://leetcode.com/problems/longest-consecutive-sequence/) | HashSet |
| 8 | Encode and Decode Strings | 🟡 Medium | [LeetCode](https://leetcode.com/problems/encode-and-decode-strings/) | String encoding |

---

*Next: [Two Pointers →](../03-two-pointers/00-overview.md)*
