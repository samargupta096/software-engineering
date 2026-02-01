[🏠 Home](../../README.md) | [⬅️ Sliding Window](../04-sliding-window/00-overview.md) | [➡️ Linked Lists](../06-linked-lists/00-overview.md)

# 🔍 Binary Search Pattern

> O(log n) search by halving the search space

---

## 🎯 When to Use

| Clue | Apply Binary Search |
|------|---------------------|
| Sorted array | Classic BS |
| "Minimum/Maximum that satisfies X" | Search on answer |
| Rotated sorted array | Modified BS |
| "Find position to insert" | Lower/Upper bound |
| Monotonic function | Decision BS |

---

## 🔧 Templates

### 1. Classic Binary Search

```java
public int binarySearch(int[] nums, int target) {
    int left = 0, right = nums.length - 1;
    
    while (left <= right) {
        int mid = left + (right - left) / 2;  // Avoid overflow
        
        if (nums[mid] == target) {
            return mid;
        } else if (nums[mid] < target) {
            left = mid + 1;
        } else {
            right = mid - 1;
        }
    }
    return -1;  // Not found
}
```

**Visualization**:
```
nums = [1, 3, 5, 7, 9, 11, 13], target = 7

Step 1: left=0, right=6, mid=3
        nums[3]=7 == target ✅
        Return 3
```

---

### 2. Left Bound (First Occurrence)

```java
// Find first index where nums[i] >= target
public int leftBound(int[] nums, int target) {
    int left = 0, right = nums.length;  // Note: right = length
    
    while (left < right) {
        int mid = left + (right - left) / 2;
        
        if (nums[mid] < target) {
            left = mid + 1;
        } else {
            right = mid;  // Don't exclude mid
        }
    }
    return left;  // Insertion point
}
```

---

### 3. Right Bound (Last Occurrence)

```java
// Find last index where nums[i] <= target
public int rightBound(int[] nums, int target) {
    int left = 0, right = nums.length;
    
    while (left < right) {
        int mid = left + (right - left) / 2;
        
        if (nums[mid] <= target) {
            left = mid + 1;
        } else {
            right = mid;
        }
    }
    return left - 1;  // Last valid position
}
```

---

### 4. Binary Search on Answer

When you need to find min/max value that satisfies condition.

```java
// Find minimum capacity to ship within D days
public int minCapacity(int[] weights, int days) {
    int left = max(weights);  // Min possible
    int right = sum(weights);  // Max possible
    
    while (left < right) {
        int mid = left + (right - left) / 2;
        
        if (canShip(weights, days, mid)) {
            right = mid;  // Try smaller
        } else {
            left = mid + 1;  // Need larger
        }
    }
    return left;
}

private boolean canShip(int[] weights, int days, int capacity) {
    int currentLoad = 0;
    int daysNeeded = 1;
    
    for (int w : weights) {
        if (currentLoad + w > capacity) {
            daysNeeded++;
            currentLoad = 0;
        }
        currentLoad += w;
    }
    return daysNeeded <= days;
}
```

---

## 💻 Core Problems

### Problem 1: Search in Rotated Sorted Array

```java
// [4,5,6,7,0,1,2], target=0 → return 4
public int search(int[] nums, int target) {
    int left = 0, right = nums.length - 1;
    
    while (left <= right) {
        int mid = left + (right - left) / 2;
        
        if (nums[mid] == target) return mid;
        
        // Left half is sorted
        if (nums[left] <= nums[mid]) {
            if (nums[left] <= target && target < nums[mid]) {
                right = mid - 1;
            } else {
                left = mid + 1;
            }
        }
        // Right half is sorted
        else {
            if (nums[mid] < target && target <= nums[right]) {
                left = mid + 1;
            } else {
                right = mid - 1;
            }
        }
    }
    return -1;
}
```

**Key Insight**: One half is always sorted.

---

### Problem 2: Find Minimum in Rotated Sorted Array

```java
public int findMin(int[] nums) {
    int left = 0, right = nums.length - 1;
    
    while (left < right) {
        int mid = left + (right - left) / 2;
        
        if (nums[mid] > nums[right]) {
            // Min is in right half
            left = mid + 1;
        } else {
            // Min is in left half (including mid)
            right = mid;
        }
    }
    return nums[left];
}
```

---

### Problem 3: Search a 2D Matrix

```java
// Treat 2D matrix as 1D sorted array
public boolean searchMatrix(int[][] matrix, int target) {
    int m = matrix.length, n = matrix[0].length;
    int left = 0, right = m * n - 1;
    
    while (left <= right) {
        int mid = left + (right - left) / 2;
        int row = mid / n;
        int col = mid % n;
        int val = matrix[row][col];
        
        if (val == target) return true;
        if (val < target) left = mid + 1;
        else right = mid - 1;
    }
    return false;
}
```

---

### Problem 4: Koko Eating Bananas

```java
// Minimum eating speed to finish in h hours
public int minEatingSpeed(int[] piles, int h) {
    int left = 1;
    int right = Arrays.stream(piles).max().getAsInt();
    
    while (left < right) {
        int mid = left + (right - left) / 2;
        
        if (canFinish(piles, h, mid)) {
            right = mid;
        } else {
            left = mid + 1;
        }
    }
    return left;
}

private boolean canFinish(int[] piles, int h, int speed) {
    int hours = 0;
    for (int pile : piles) {
        hours += (pile + speed - 1) / speed;  // Ceiling division
    }
    return hours <= h;
}
```

---

## 🧠 Visual Guide

### When to Use Which Template

```
┌────────────────────────────────────────────────────┐
│                   BINARY SEARCH                     │
├────────────────────────────────────────────────────┤
│  Find exact value?                                  │
│  → Classic: left <= right, return mid               │
│                                                     │
│  Find insertion point / first >= target?            │
│  → Left bound: left < right, right = mid            │
│                                                     │
│  Find min value that satisfies condition?           │
│  → Search on answer: left < right, right = mid      │
│                                                     │
│  Find max value that satisfies condition?           │
│  → Search on answer: left < right, left = mid + 1   │
└────────────────────────────────────────────────────┘
```

---

## 📊 Complexity Summary

| Problem | Time | Space |
|---------|------|-------|
| Classic BS | O(log n) | O(1) |
| Rotated Array | O(log n) | O(1) |
| Find Min | O(log n) | O(1) |
| Search 2D | O(log(m*n)) | O(1) |
| Search on Answer | O(n log k) | O(1) |

---

## ⚠️ Common Mistakes

1. **Integer overflow**: Use `left + (right - left) / 2` not `(left + right) / 2`
2. **Infinite loop**: Check `left < right` vs `left <= right` carefully
3. **Off-by-one**: Know when to use `right = mid` vs `right = mid - 1`

---

## 📝 Practice Problems

| # | Problem | Difficulty | Link | Key Insight |
|---|---------|------------|------|-------------|
| 1 | Binary Search | 🟢 Easy | [LeetCode](https://leetcode.com/problems/binary-search/) | Classic |
| 2 | Search in Rotated Array | 🟡 Medium | [LeetCode](https://leetcode.com/problems/search-in-rotated-sorted-array/) | One half sorted |
| 3 | Find Minimum in Rotated | 🟡 Medium | [LeetCode](https://leetcode.com/problems/find-minimum-in-rotated-sorted-array/) | Compare with right |
| 4 | Search 2D Matrix | 🟡 Medium | [LeetCode](https://leetcode.com/problems/search-a-2d-matrix/) | 2D → 1D |
| 5 | Koko Eating Bananas | 🟡 Medium | [LeetCode](https://leetcode.com/problems/koko-eating-bananas/) | Search on answer |
| 6 | Median of Two Sorted | 🔴 Hard | [LeetCode](https://leetcode.com/problems/median-of-two-sorted-arrays/) | Binary partition |

---

*Next: [Linked Lists →](../06-linked-lists/00-overview.md)*
