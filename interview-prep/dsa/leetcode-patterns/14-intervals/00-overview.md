[🏠 Home](../../README.md) | [⬅️ Greedy](../13-greedy/00-overview.md) | [➡️ Bit Manipulation](../15-bit-manipulation/00-overview.md)

# 🕒 Interval Patterns

> Managing overlapping ranges and time slots

---

## 🎯 When to Use

| Clue | Approach |
|------|----------|
| "Merge overlapping" | Sort by start time |
| "Non-overlapping" | Sort by end time |
| "Meeting rooms required" | Min-heap or Two pointers |
| "Insert interval" | Linear scan |

---

## 🧠 WHY Interval Patterns Work: Developer's Guide

> **🎯 For Beginners:** Most interval problems become simple after sorting. The key is knowing WHAT to sort by!

### The Core Insight: Sorting Reveals Structure

```
Unsorted intervals: [(2,6), (1,3), (8,10), (15,18)]
                    
                    ???  Hard to see relationships

Sorted by START:    [(1,3), (2,6), (8,10), (15,18)]
                    
  Timeline:     1---3
                  2-------6
                            8----10
                                    15----18
                    
                    NOW we can see overlaps!
```

### Sort by START vs Sort by END

```
SORT BY START TIME:
  Use when: Merging overlapping intervals
  
  Why? Process left-to-right on timeline
  Each new interval either:
    - Overlaps with current → merge
    - Doesn't overlap → start new group
  
  [(1,3), (2,6)] → overlap! → merge to (1,6)

SORT BY END TIME:
  Use when: Maximizing non-overlapping intervals
  
  Why? Ending early = more room for future intervals
  
  [(1,4), (2,3), (3,5)]
  Sort by end: [(2,3), (1,4), (3,5)]
  
  Pick (2,3) → ends at 3
  Skip (1,4) → starts at 1 < 3 → overlaps
  Pick (3,5) → starts at 3 ≥ 3 → OK!
  
  Result: 2 non-overlapping intervals
```

### Detecting Overlap: The Key Condition

```
Two intervals [a, b] and [c, d] overlap if:

  a ≤ d AND c ≤ b
  
  OR more simply (when sorted by start):
  
  If intervals are sorted: [a,b] then [c,d] where a ≤ c
    Overlap if: c ≤ b  (next starts before current ends)
    
  Visual:
    a-------b
        c-------d    ← c ≤ b? YES → OVERLAP
        
    a---b
          c---d      ← c ≤ b? NO → NO OVERLAP
```

### Meeting Rooms: The Two-Pointer Trick

```
Problem: How many meeting rooms needed?

Intervals: [(0,30), (5,10), (15,20)]

Instead of simulation, use EVENT points:

  Start events: [0, 5, 15]
  End events:   [10, 20, 30]

  Process chronologically:
  t=0:  +1 room (start)     → rooms=1
  t=5:  +1 room (start)     → rooms=2  ← MAX
  t=10: -1 room (end)       → rooms=1
  t=15: +1 room (start)     → rooms=2
  t=20: -1 room (end)       → rooms=1
  t=30: -1 room (end)       → rooms=0

  Answer: 2 rooms needed
```

### Thought Process Template

```
🧠 "How do I solve this interval problem?"

1. What's the goal?
   → Merge overlaps: Sort by START
   → Max non-overlapping: Sort by END
   → Count simultaneous: Sweep line / two pointers

2. How do I detect overlap?
   → Sorted by start: next.start ≤ current.end

3. What do I do on overlap?
   → Merge: Extend current.end = max(current.end, next.end)
   → Count: Increment overlap counter
   → Remove: Don't add to result

4. What do I do on no overlap?
   → Start a new group/interval
```

---

## 💻 Core Problems

### Problem 1: Merge Intervals

```java
// [[1,3],[2,6],[8,10],[15,18]] → [[1,6],[8,10],[15,18]]
public int[][] merge(int[][] intervals) {
    if (intervals.length <= 1) return intervals;
    
    // Sort by start time
    Arrays.sort(intervals, (a, b) -> Integer.compare(a[0], b[0]));
    
    List<int[]> result = new ArrayList<>();
    int[] current = intervals[0];
    result.add(current);
    
    for (int[] interval : intervals) {
        int currentEnd = current[1];
        int nextStart = interval[0];
        int nextEnd = interval[1];
        
        if (currentEnd >= nextStart) { // Overlap
            current[1] = Math.max(currentEnd, nextEnd);
        } else { // No overlap
            current = interval;
            result.add(current);
        }
    }
    
    return result.toArray(new int[result.size()][]);
}
```

### Problem 2: Insert Interval

```java
// Insert newInterval into sorted intervals
public int[][] insert(int[][] intervals, int[] newInterval) {
    List<int[]> result = new ArrayList<>();
    int i = 0;
    
    // Add all before overlap
    while (i < intervals.length && intervals[i][1] < newInterval[0]) {
        result.add(intervals[i]);
        i++;
    }
    
    // Merge overlapping
    while (i < intervals.length && intervals[i][0] <= newInterval[1]) {
        newInterval[0] = Math.min(newInterval[0], intervals[i][0]);
        newInterval[1] = Math.max(newInterval[1], intervals[i][1]);
        i++;
    }
    result.add(newInterval);
    
    // Add all after
    while (i < intervals.length) {
        result.add(intervals[i]);
        i++;
    }
    
    return result.toArray(new int[result.size()][]);
}
```

### Problem 3: Non-overlapping Intervals

```java
// Remove min intervals to make rest non-overlapping
public int eraseOverlapIntervals(int[][] intervals) {
    if (intervals.length == 0) return 0;
    
    // Sort by END time (Greedy!)
    Arrays.sort(intervals, (a, b) -> Integer.compare(a[1], b[1]));
    
    int end = intervals[0][1];
    int count = 1; // Count non-overlapping
    
    for (int i = 1; i < intervals.length; i++) {
        if (intervals[i][0] >= end) {
            count++;
            end = intervals[i][1];
        }
    }
    
    return intervals.length - count;
}
```

---

## 📝 Practice Problems

| # | Problem | Difficulty | Link | Key Insight |
|---|---------|------------|------|-------------|
| 1 | Merge Intervals | 🟡 Medium | [LeetCode](https://leetcode.com/problems/merge-intervals/) | Sort start |
| 2 | Insert Interval | 🟡 Medium | [LeetCode](https://leetcode.com/problems/insert-interval/) | Linear scan |
| 3 | Non-overlapping | 🟡 Medium | [LeetCode](https://leetcode.com/problems/non-overlapping-intervals/) | Sort end |
| 4 | Meeting Rooms II | 🟡 Medium | [LeetCode](https://leetcode.com/problems/meeting-rooms-ii/) | Two pointers |

---

*Next: [Bit Manipulation →](../15-bit-manipulation/00-overview.md)*
