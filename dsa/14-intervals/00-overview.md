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
