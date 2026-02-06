# Java Collections Framework - From Beginner to Master 🚀

> **The Ultimate Guide to Understanding WHY Collections Are Optimal**  
> Learn the math, the thought process, and become a Collections expert!

---

## 📋 Table of Contents

1. [Why Collections Exist - The Problem They Solve](#why-collections-exist---the-problem-they-solve)
2. [HashMap - The Magic of O(1)](#hashmap---the-magic-of-o1)
3. [ArrayList vs LinkedList - When to Use What](#arraylist-vs-linkedlist---when-to-use-what)
4. [HashSet - Uniqueness Made Efficient](#hashset---uniqueness-made-efficient)
5. [TreeMap & TreeSet - When You Need Order](#treemap--treeset---when-you-need-order)
6. [Queue & Deque - FIFO/LIFO Done Right](#queue--deque---fifolifo-done-right)
7. [Common Interview Patterns with Collections](#common-interview-patterns-with-collections)
8. [Time Complexity Cheat Sheet](#time-complexity-cheat-sheet)

---

## 🤔 Why Collections Exist - The Problem They Solve

### The Beginner's Question:
> "Why can't I just use arrays for everything?"

### The Answer: Arrays Are Limited!

```java
// ❌ PROBLEM 1: Fixed Size
int[] arr = new int[5];
// Want to add 6th element? Create new array, copy everything!

// ❌ PROBLEM 2: No Built-in Search
int[] arr = {5, 2, 8, 1, 9};
// Find if 8 exists? Loop through ALL elements every time

// ❌ PROBLEM 3: No Easy Removal
int[] arr = {1, 2, 3, 4, 5};
// Remove element at index 2? Shift all elements left!
```

### Collections Solve ALL These Problems!

```java
// ✅ Dynamic Size
ArrayList<Integer> list = new ArrayList<>();
list.add(1);
list.add(2); // Grows automatically!

// ✅ O(1) Search
HashSet<Integer> set = new HashSet<>();
set.contains(8); // Instant lookup!

// ✅ Easy Removal
list.remove(Integer.valueOf(3)); // Just works!
```

---

## 🗺️ HashMap - The Magic of O(1)

### The Million Dollar Question:
> "How can HashMap find any element instantly, regardless of size?"

### 📊 The Math Behind It

#### Naive Approach: Linear Search
```
Array of 1,000,000 elements:
- Check 1st element: not it
- Check 2nd element: not it
- ...
- Check 999,999th element: not it
- Check 1,000,000th element: FOUND!

Worst case: 1,000,000 comparisons 😱
```

**Time Complexity: O(n)**

| Data Size | Time (assuming 1μs per comparison) |
|-----------|-----------------------------------|
| 1,000 | 1 millisecond |
| 1,000,000 | 1 second |
| 1,000,000,000 | 16+ minutes! |

#### HashMap Approach: Hash Function Magic
```
HashMap with 1,000,000 elements:

Step 1: Calculate hash code of key
        hash("John") = 2314539 (one calculation)
        
Step 2: Find bucket index
        index = 2314539 % 16 = 7 (one calculation)
        
Step 3: Get value from bucket 7
        bucket[7] = "John's data" (direct access)

Total: ~3 operations regardless of size! 🎉
```

**Time Complexity: O(1)**

| Data Size | Time |
|-----------|------|
| 1,000 | ~1 microsecond |
| 1,000,000 | ~1 microsecond |
| 1,000,000,000 | ~1 microsecond |

### 🧠 Thought Process: How HashMap Works Internally

```
┌─────────────────────────────────────────────────────────────┐
│                   HashMap Internal Structure                 │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Key: "John" ──▶ hashCode() ──▶ 2314539                     │
│                                    │                         │
│                                    ▼                         │
│                       index = hash % buckets.length          │
│                       index = 2314539 % 16 = 7               │
│                                    │                         │
│                                    ▼                         │
│  ┌────┬────┬────┬────┬────┬────┬────┬────┬────┬────┬────┐   │
│  │ 0  │ 1  │ 2  │ 3  │ 4  │ 5  │ 6  │ 7  │ 8  │ 9  │... │   │
│  └────┴────┴────┴────┴────┴────┴────┴─▲──┴────┴────┴────┘   │
│                                        │                     │
│                                   ┌────┴────┐                │
│                                   │  Node   │                │
│                                   │(John,32)│                │
│                                   └────┬────┘                │
│                                        │ (if collision)      │
│                                   ┌────▼────┐                │
│                                   │  Node   │                │
│                                   │(Jane,28)│                │
│                                   └─────────┘                │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### 🎓 Master Level: Understanding Collisions

**What happens when two keys get same bucket index?**

```java
// Example: Two different keys, same hash bucket
"John".hashCode() % 16 = 7
"Jane".hashCode() % 16 = 7  // Collision!

// HashMap handles this with linked list (or tree)
// bucket[7] → ["John", 32] → ["Jane", 28] → null
```

**Java 8 Optimization:**
- When a bucket has > 8 elements → Linked List converts to Red-Black Tree
- Search in bucket: O(n) → O(log n)
- This is why HashMap is O(1) *average*, not O(1) *guaranteed*

### 💻 Code Example: HashMap vs Array Search

```java
import java.util.*;

public class HashMapVsArray {
    public static void main(String[] args) {
        int SIZE = 1_000_000;
        
        // ==================== NAIVE APPROACH: Array ====================
        String[] names = new String[SIZE];
        for (int i = 0; i < SIZE; i++) {
            names[i] = "Person" + i;
        }
        
        // Searching in Array
        long startArray = System.nanoTime();
        boolean foundInArray = false;
        for (String name : names) {
            if (name.equals("Person999999")) {
                foundInArray = true;
                break;
            }
        }
        long endArray = System.nanoTime();
        System.out.println("Array Search Time: " + (endArray - startArray) / 1_000_000.0 + " ms");
        
        // ==================== OPTIMAL: HashMap ====================
        Map<String, Integer> map = new HashMap<>();
        for (int i = 0; i < SIZE; i++) {
            map.put("Person" + i, i);
        }
        
        // Searching in HashMap
        long startMap = System.nanoTime();
        boolean foundInMap = map.containsKey("Person999999");
        long endMap = System.nanoTime();
        System.out.println("HashMap Search Time: " + (endMap - startMap) / 1_000_000.0 + " ms");
    }
}

/* 
OUTPUT (approximate):
Array Search Time: 15.234 ms     ← Scanned ~1 million elements
HashMap Search Time: 0.002 ms   ← Direct access!

That's 7,600x FASTER! 🚀
*/
```

### 🔑 When to Use HashMap

| Use Case | Why HashMap? |
|----------|-------------|
| Counting frequency | O(1) increment for each element |
| Two Sum problem | O(1) lookup for complement |
| Caching | O(1) store and retrieve |
| Grouping data | O(1) access to each group |
| Removing duplicates | Keys are unique |

### ⚠️ HashMap Gotchas

```java
// ❌ WRONG: Using mutable object as key
List<Integer> list = new ArrayList<>();
map.put(list, "value1");
list.add(1); // Hash code changes!
map.get(list); // Returns null! Object is "lost"

// ✅ CORRECT: Use immutable keys
String key = "immutableKey";
Integer key2 = 42;
```

---

## 📝 ArrayList vs LinkedList - When to Use What

### The Beginner's Question:
> "Both store lists of items. What's the difference?"

### 🎯 The Core Difference: Memory Layout

```
ArrayList (Contiguous Memory):
┌───┬───┬───┬───┬───┬───┬───┬───┐
│ 0 │ 1 │ 2 │ 3 │ 4 │ 5 │ 6 │ 7 │  ← All elements side by side
└───┴───┴───┴───┴───┴───┴───┴───┘
  ↑
  Direct access: arr[3] = memory_start + (3 × element_size)

LinkedList (Scattered Memory):
┌───┐     ┌───┐     ┌───┐     ┌───┐
│ 0 │────▶│ 1 │────▶│ 2 │────▶│ 3 │    ← Elements anywhere in memory
└───┘     └───┘     └───┘     └───┘
  ↑
  To reach index 3: Follow 3 pointers!
```

### 📊 The Math: Time Complexity Comparison

| Operation | ArrayList | LinkedList | Winner |
|-----------|-----------|------------|--------|
| Get by index | **O(1)** | O(n) | ArrayList |
| Add at end | **O(1)*** | O(1) | Tie |
| Add at beginning | O(n) | **O(1)** | LinkedList |
| Add in middle | O(n) | O(n)** | Tie |
| Remove from middle | O(n) | O(n)** | Tie |
| Memory per element | **Less** | More | ArrayList |

*Amortized - occasionally O(n) when array needs to resize  
**O(1) if you already have the node reference

### 🧠 Thought Process: Why ArrayList is Faster for Get

**ArrayList Get(index):**
```
Memory address = base_address + (index × element_size)
Example: Get element at index 5
  base_address = 1000
  element_size = 8 bytes
  address = 1000 + (5 × 8) = 1040
  
→ ONE calculation, done! O(1)
```

**LinkedList Get(index):**
```
Start at head
  head.next → node1
  node1.next → node2
  node2.next → node3
  node3.next → node4
  node4.next → node5  ← Found!
  
→ 5 pointer hops! For index 1000? Need 1000 hops! O(n)
```

### 🧠 Thought Process: Why LinkedList is Faster for Add at Beginning

**ArrayList Add at Beginning:**
```
Before: [A, B, C, D, E]
Add 'X' at index 0:
  Step 1: Shift E → position 5
  Step 2: Shift D → position 4
  Step 3: Shift C → position 3
  Step 4: Shift B → position 2
  Step 5: Shift A → position 1
  Step 6: Place X at position 0
After:  [X, A, B, C, D, E]

→ Shifted 5 elements! For 1 million? Shift 1 million! O(n)
```

**LinkedList Add at Beginning:**
```
Before: head → [A] → [B] → [C] → [D] → [E]
Add 'X' at beginning:
  Step 1: Create new node [X]
  Step 2: Point X.next to old head (A)
  Step 3: Update head to X
After:  head → [X] → [A] → [B] → [C] → [D] → [E]

→ Just 3 pointer operations! Always O(1)
```

### 💻 Code Example: Real Performance Comparison

```java
import java.util.*;

public class ListPerformanceTest {
    public static void main(String[] args) {
        int SIZE = 100_000;
        
        // ========== Test 1: Add at Beginning ==========
        ArrayList<Integer> arrayList = new ArrayList<>();
        LinkedList<Integer> linkedList = new LinkedList<>();
        
        // ArrayList: Add at beginning
        long start = System.nanoTime();
        for (int i = 0; i < SIZE; i++) {
            arrayList.add(0, i);  // Insert at index 0
        }
        long arrayTime = System.nanoTime() - start;
        
        // LinkedList: Add at beginning
        start = System.nanoTime();
        for (int i = 0; i < SIZE; i++) {
            linkedList.addFirst(i);  // Insert at beginning
        }
        long linkedTime = System.nanoTime() - start;
        
        System.out.println("=== Add at Beginning (100,000 elements) ===");
        System.out.println("ArrayList:  " + arrayTime / 1_000_000 + " ms");
        System.out.println("LinkedList: " + linkedTime / 1_000_000 + " ms");
        
        // ========== Test 2: Random Access ==========
        start = System.nanoTime();
        for (int i = 0; i < SIZE; i++) {
            int value = arrayList.get(i);
        }
        arrayTime = System.nanoTime() - start;
        
        start = System.nanoTime();
        for (int i = 0; i < SIZE; i++) {
            int value = linkedList.get(i);
        }
        linkedTime = System.nanoTime() - start;
        
        System.out.println("\n=== Random Access (100,000 gets) ===");
        System.out.println("ArrayList:  " + arrayTime / 1_000_000 + " ms");
        System.out.println("LinkedList: " + linkedTime / 1_000_000 + " ms");
    }
}

/*
OUTPUT (approximate):
=== Add at Beginning (100,000 elements) ===
ArrayList:  2,847 ms    ← SLOW! Shifting elements each time
LinkedList: 8 ms        ← FAST! Just pointer updates

=== Random Access (100,000 gets) ===
ArrayList:  3 ms        ← FAST! Direct memory access
LinkedList: 4,521 ms    ← SLOW! Traversing each time
*/
```

### 🎯 When to Use Which?

| Scenario | Use This | Why |
|----------|----------|-----|
| Mostly reading | **ArrayList** | O(1) random access |
| Stack/Queue operations | **LinkedList** | O(1) add/remove at ends |
| Unknown size, lots of adds | **ArrayList** | Better cache locality |
| Frequent inserts at beginning | **LinkedList** | No shifting needed |
| Memory is tight | **ArrayList** | Less overhead per element |

### 💡 Pro Tip: 99% of the Time, Use ArrayList!

Modern CPUs have cache optimization that makes ArrayList faster even for some operations where LinkedList has better theoretical complexity!

---

## 🎯 HashSet - Uniqueness Made Efficient

### The Beginner's Question:
> "How do I remove duplicates from a list efficiently?"

### ❌ Naive Approach: Nested Loop

```java
// Check each element against all others
List<Integer> unique = new ArrayList<>();
for (int num : numbers) {
    boolean isDuplicate = false;
    for (int existing : unique) {
        if (num == existing) {
            isDuplicate = true;
            break;
        }
    }
    if (!isDuplicate) {
        unique.add(num);
    }
}
```

**Time Complexity Analysis:**
```
For n elements:
- 1st element: 0 comparisons
- 2nd element: 1 comparison
- 3rd element: 2 comparisons
- ...
- nth element: (n-1) comparisons

Total = 0 + 1 + 2 + ... + (n-1) = n(n-1)/2 = O(n²)
```

| Input Size | Approximate Comparisons |
|------------|-------------------------|
| 100 | 4,950 |
| 1,000 | 499,500 |
| 10,000 | 49,995,000 |
| 100,000 | 4,999,950,000 😱 |

### ✅ Optimal Approach: HashSet

```java
// HashSet: O(1) lookup for each element
Set<Integer> unique = new HashSet<>(numbers);
// Done! All duplicates removed.
```

**Time Complexity Analysis:**
```
For n elements:
- Each add() is O(1)
- Each contains() check (internal) is O(1)
- Total: n × O(1) = O(n)
```

| Input Size | Approximate Operations |
|------------|------------------------|
| 100 | 100 |
| 1,000 | 1,000 |
| 10,000 | 10,000 |
| 100,000 | 100,000 ✨ |

### 📊 The Dramatic Difference

```
Input: 100,000 elements

Naive (O(n²)):  5,000,000,000 operations
HashSet (O(n)): 100,000 operations

HashSet is 50,000x FASTER! 🚀
```

### 💻 Code Example: Removing Duplicates

```java
import java.util.*;

public class RemoveDuplicates {
    public static void main(String[] args) {
        int[] numbers = {1, 5, 2, 1, 3, 5, 2, 4, 1, 5};
        
        // ========== NAIVE: O(n²) ==========
        List<Integer> naiveUnique = new ArrayList<>();
        for (int num : numbers) {
            if (!naiveUnique.contains(num)) {  // contains() is O(n)!
                naiveUnique.add(num);
            }
        }
        System.out.println("Naive result: " + naiveUnique);
        // [1, 5, 2, 3, 4]
        
        // ========== OPTIMAL: O(n) ==========
        Set<Integer> optimalUnique = new LinkedHashSet<>();  // Preserves order
        for (int num : numbers) {
            optimalUnique.add(num);  // add() is O(1)
        }
        System.out.println("Optimal result: " + optimalUnique);
        // [1, 5, 2, 3, 4]
    }
}
```

### 🎓 Master Level: Why HashSet Uses HashMap Internally

```java
// HashSet is actually a HashMap where:
// - The element is the KEY
// - A dummy object is the VALUE

// Simplified internal structure:
public class HashSet<E> {
    private HashMap<E, Object> map;
    private static final Object PRESENT = new Object();  // Dummy value
    
    public boolean add(E e) {
        return map.put(e, PRESENT) == null;
    }
    
    public boolean contains(Object o) {
        return map.containsKey(o);
    }
}
```

This is why HashSet has O(1) operations - it's leveraging HashMap's hash function magic!

---

## 🌳 TreeMap & TreeSet - When You Need Order

### The Beginner's Question:
> "What if I need elements sorted, but also fast operations?"

### 🎯 The Core Difference: Hash vs Tree

| Collection | Data Structure | Order | Time Complexity |
|------------|----------------|-------|-----------------|
| HashMap/HashSet | Hash Table | No order | O(1) average |
| TreeMap/TreeSet | Red-Black Tree | Sorted | O(log n) always |

### 📊 The Math: O(log n) is Still Very Fast!

```
Binary Search Tree Height = log₂(n)

n = 1,000         → height = 10 (10 comparisons max)
n = 1,000,000     → height = 20 (20 comparisons max)
n = 1,000,000,000 → height = 30 (30 comparisons max)

Even with a BILLION elements, only 30 operations! 🎉
```

### 🧠 Thought Process: When to Choose TreeMap over HashMap

```
Use TreeMap when you need:

1. RANGE QUERIES
   - "Give me all entries between 'apple' and 'banana'"
   - "What's the smallest key greater than X?"
   
2. SORTED ITERATION
   - "Process elements in order"
   - "Get the top 5 largest keys"
   
3. FLOOR/CEILING OPERATIONS
   - "What's the nearest key to my value?"
```

### 💻 Code Example: TreeMap Features

```java
import java.util.*;

public class TreeMapDemo {
    public static void main(String[] args) {
        TreeMap<Integer, String> scores = new TreeMap<>();
        scores.put(85, "Bob");
        scores.put(92, "Alice");
        scores.put(78, "Charlie");
        scores.put(95, "Diana");
        scores.put(88, "Eve");
        
        // Automatic sorting!
        System.out.println("All scores (sorted): " + scores);
        // {78=Charlie, 85=Bob, 88=Eve, 92=Alice, 95=Diana}
        
        // Get highest score
        System.out.println("Highest: " + scores.lastEntry());
        // 95=Diana
        
        // Get lowest score
        System.out.println("Lowest: " + scores.firstEntry());
        // 78=Charlie
        
        // Get scores between 80 and 90
        System.out.println("80-90 range: " + scores.subMap(80, 91));
        // {85=Bob, 88=Eve}
        
        // Floor: largest key ≤ 90
        System.out.println("Floor of 90: " + scores.floorEntry(90));
        // 88=Eve
        
        // Ceiling: smallest key ≥ 90
        System.out.println("Ceiling of 90: " + scores.ceilingEntry(90));
        // 92=Alice
    }
}
```

### 🎯 Real Interview Problem: Find K Closest Elements

```java
/*
Problem: Given a sorted array and a target value, find K closest elements.

Example:
  arr = [1, 2, 3, 4, 5], k = 4, target = 3
  Output: [1, 2, 3, 4]
*/

// TreeMap Solution - Clean and Efficient!
public List<Integer> findKClosest(int[] arr, int k, int target) {
    TreeMap<Integer, List<Integer>> distanceMap = new TreeMap<>();
    
    // Group elements by distance from target
    for (int num : arr) {
        int distance = Math.abs(num - target);
        distanceMap.computeIfAbsent(distance, d -> new ArrayList<>()).add(num);
    }
    
    // Collect K closest
    List<Integer> result = new ArrayList<>();
    for (List<Integer> group : distanceMap.values()) {
        for (int num : group) {
            if (result.size() < k) {
                result.add(num);
            } else {
                break;
            }
        }
    }
    
    Collections.sort(result);
    return result;
}
```

---

## 📥 Queue & Deque - FIFO/LIFO Done Right

### The Beginner's Question:
> "When do I need a Queue instead of a List?"

### 🎯 Queue Concepts Visualized

```
QUEUE (FIFO - First In, First Out):
Like a line at a store - first person in line gets served first

  BACK                           FRONT
   ↓                               ↓
┌─────┬─────┬─────┬─────┬─────┬─────┐
│  F  │  E  │  D  │  C  │  B  │  A  │ ──→ DEQUEUE (remove A)
└─────┴─────┴─────┴─────┴─────┴─────┘
   ↑
 ENQUEUE (add here)


STACK (LIFO - Last In, First Out):
Like a stack of plates - last plate placed is first removed

               TOP
                ↓
             ┌─────┐
             │  C  │ ←── POP (remove) / PUSH (add)
             ├─────┤
             │  B  │
             ├─────┤
             │  A  │
             └─────┘
              BOTTOM
```

### 📊 Which Queue Implementation to Use?

| Implementation | Thread-Safe | Blocking | Best For |
|----------------|-------------|----------|----------|
| `LinkedList` | ❌ | ❌ | Simple queue operations |
| `ArrayDeque` | ❌ | ❌ | **Fastest for single-threaded** |
| `PriorityQueue` | ❌ | ❌ | Ordered by priority |
| `ConcurrentLinkedQueue` | ✅ | ❌ | Multi-threaded, non-blocking |
| `ArrayBlockingQueue` | ✅ | ✅ | Producer-consumer pattern |
| `LinkedBlockingQueue` | ✅ | ✅ | Unbounded producer-consumer |

### 🧠 Thought Process: Why ArrayDeque is Faster Than LinkedList

```
LinkedList:
┌───┐     ┌───┐     ┌───┐
│ A │────▶│ B │────▶│ C │
│ ← │◀────│ ← │◀────│   │
└───┘     └───┘     └───┘
  ↑
More memory: Each node has prev + next pointers
More cache misses: Nodes scattered in memory

ArrayDeque:
┌───┬───┬───┬───┬───┬───┬───┬───┐
│   │   │ A │ B │ C │   │   │   │
└───┴───┴───┴───┴───┴───┴───┴───┘
          ↑           ↑
         head       tail

Less memory: No pointers needed
Better cache: Contiguous memory
```

### 💻 Code Example: BFS with Queue

```java
import java.util.*;

public class BFSExample {
    /*
     * BFS: Level Order Traversal of Binary Tree
     * 
     * Why Queue? 
     * We process nodes level by level.
     * First node added to a level = First processed (FIFO)
     */
    public List<List<Integer>> levelOrder(TreeNode root) {
        List<List<Integer>> result = new ArrayList<>();
        if (root == null) return result;
        
        Queue<TreeNode> queue = new LinkedList<>();
        queue.offer(root);  // O(1)
        
        while (!queue.isEmpty()) {
            int levelSize = queue.size();
            List<Integer> currentLevel = new ArrayList<>();
            
            for (int i = 0; i < levelSize; i++) {
                TreeNode node = queue.poll();  // O(1)
                currentLevel.add(node.val);
                
                if (node.left != null) queue.offer(node.left);
                if (node.right != null) queue.offer(node.right);
            }
            
            result.add(currentLevel);
        }
        
        return result;
    }
}

/*
Tree:       3
          /   \
         9    20
             /  \
            15   7

Queue processing:
Initial:    [3]
After level 0: [9, 20]       → Result: [[3]]
After level 1: [15, 7]       → Result: [[3], [9, 20]]
After level 2: []            → Result: [[3], [9, 20], [15, 7]]
*/
```

### 💻 Code Example: Deque as Stack

```java
import java.util.*;

public class DequeAsStack {
    /*
     * Problem: Valid Parentheses
     * 
     * Given a string containing '(', ')', '{', '}', '[', ']'
     * Determine if the input string is valid.
     */
    public boolean isValid(String s) {
        Deque<Character> stack = new ArrayDeque<>();  // Faster than Stack class!
        
        Map<Character, Character> map = Map.of(
            ')', '(',
            '}', '{',
            ']', '['
        );
        
        for (char c : s.toCharArray()) {
            if (map.containsKey(c)) {
                // Closing bracket
                if (stack.isEmpty() || stack.pop() != map.get(c)) {
                    return false;
                }
            } else {
                // Opening bracket
                stack.push(c);
            }
        }
        
        return stack.isEmpty();
    }
}

/*
Example: "({[]})"

Stack progression:
'(' → stack: ['(']
'{' → stack: ['(', '{']
'[' → stack: ['(', '{', '[']
']' → pop '[', matches! stack: ['(', '{']
'}' → pop '{', matches! stack: ['(']
')' → pop '(', matches! stack: []

Stack empty at end → VALID! ✓
*/
```

### 🎓 Master Level: PriorityQueue for K Largest/Smallest

```java
import java.util.*;

public class PriorityQueueExample {
    /*
     * Problem: Find K Largest Elements in Array
     * 
     * Naive: Sort array O(n log n), take last K
     * Optimal: Use Min-Heap of size K → O(n log k)
     * 
     * Why Min-Heap for LARGEST elements?
     * - Keep K largest seen so far in heap
     * - If new element > heap top (smallest of K largest)
     * - Remove top, add new element
     * - At end, heap contains K largest!
     */
    public int[] findKLargest(int[] nums, int k) {
        // Min-heap (default in Java)
        PriorityQueue<Integer> minHeap = new PriorityQueue<>();
        
        for (int num : nums) {
            minHeap.offer(num);  // O(log k)
            
            if (minHeap.size() > k) {
                minHeap.poll();  // Remove smallest, O(log k)
            }
        }
        
        // Heap now contains K largest elements
        int[] result = new int[k];
        for (int i = 0; i < k; i++) {
            result[i] = minHeap.poll();
        }
        
        return result;
    }
}

/*
Example: nums = [3, 2, 1, 5, 6, 4], k = 2

Processing:
3 → heap: [3]
2 → heap: [2, 3]
1 → heap: [1, 2, 3] → size > k → remove 1 → heap: [2, 3]
5 → heap: [2, 3, 5] → size > k → remove 2 → heap: [3, 5]
6 → heap: [3, 5, 6] → size > k → remove 3 → heap: [5, 6]
4 → heap: [4, 5, 6] → size > k → remove 4 → heap: [5, 6]

Result: [5, 6] ✓
*/
```

---

## 🎯 Common Interview Patterns with Collections

### Pattern 1: Two Sum (HashMap)

```java
/*
 * Problem: Find two numbers that add up to target
 * 
 * NAIVE: Check every pair → O(n²)
 * OPTIMAL: HashMap for complement lookup → O(n)
 */
public int[] twoSum(int[] nums, int target) {
    Map<Integer, Integer> map = new HashMap<>();
    
    for (int i = 0; i < nums.length; i++) {
        int complement = target - nums[i];
        
        if (map.containsKey(complement)) {  // O(1) lookup!
            return new int[]{map.get(complement), i};
        }
        
        map.put(nums[i], i);  // O(1) insert
    }
    
    return new int[]{-1, -1};
}

/*
Example: nums = [2, 7, 11, 15], target = 9

i=0: complement = 9-2 = 7, map = {} → not found, add: map = {2:0}
i=1: complement = 9-7 = 2, map = {2:0} → FOUND! Return [0, 1]
*/
```

### Pattern 2: Anagram Grouping (HashMap + Sorting)

```java
/*
 * Problem: Group anagrams together
 * 
 * Key Insight: Sorted anagrams are identical!
 * "eat" → "aet"
 * "tea" → "aet"
 * "ate" → "aet"
 */
public List<List<String>> groupAnagrams(String[] strs) {
    Map<String, List<String>> map = new HashMap<>();
    
    for (String s : strs) {
        char[] chars = s.toCharArray();
        Arrays.sort(chars);
        String key = new String(chars);  // Sorted version as key
        
        map.computeIfAbsent(key, k -> new ArrayList<>()).add(s);
    }
    
    return new ArrayList<>(map.values());
}

/*
Input: ["eat", "tea", "tan", "ate", "nat", "bat"]

Processing:
"eat" → key="aet" → map: {"aet": ["eat"]}
"tea" → key="aet" → map: {"aet": ["eat", "tea"]}
"tan" → key="ant" → map: {"aet": [...], "ant": ["tan"]}
...

Output: [["eat","tea","ate"], ["tan","nat"], ["bat"]]
*/
```

### Pattern 3: Sliding Window with HashMap

```java
/*
 * Problem: Longest Substring Without Repeating Characters
 * 
 * Use HashMap to track last seen position of each character
 */
public int lengthOfLongestSubstring(String s) {
    Map<Character, Integer> lastSeen = new HashMap<>();
    int maxLen = 0;
    int start = 0;  // Window start
    
    for (int end = 0; end < s.length(); end++) {
        char c = s.charAt(end);
        
        if (lastSeen.containsKey(c) && lastSeen.get(c) >= start) {
            // Character repeated within window
            start = lastSeen.get(c) + 1;  // Move start past duplicate
        }
        
        lastSeen.put(c, end);
        maxLen = Math.max(maxLen, end - start + 1);
    }
    
    return maxLen;
}

/*
Example: s = "abcabcbb"

end=0, c='a': lastSeen={a:0}, window="a", len=1
end=1, c='b': lastSeen={a:0,b:1}, window="ab", len=2
end=2, c='c': lastSeen={a:0,b:1,c:2}, window="abc", len=3
end=3, c='a': 'a' at 0 >= start(0)! start=1, window="bca", len=3
end=4, c='b': 'b' at 1 >= start(1)! start=2, window="cab", len=3
...

Result: 3
*/
```

### Pattern 4: Top K Frequent Elements (HashMap + PriorityQueue)

```java
/*
 * Problem: Find K most frequent elements
 * 
 * Step 1: Count frequency with HashMap O(n)
 * Step 2: Use min-heap of size K to get top K O(n log k)
 */
public int[] topKFrequent(int[] nums, int k) {
    // Step 1: Count frequency
    Map<Integer, Integer> freq = new HashMap<>();
    for (int num : nums) {
        freq.merge(num, 1, Integer::sum);
    }
    
    // Step 2: Min-heap by frequency
    PriorityQueue<Integer> heap = new PriorityQueue<>(
        (a, b) -> freq.get(a) - freq.get(b)
    );
    
    for (int num : freq.keySet()) {
        heap.offer(num);
        if (heap.size() > k) {
            heap.poll();  // Remove least frequent
        }
    }
    
    // Extract result
    int[] result = new int[k];
    for (int i = k - 1; i >= 0; i--) {
        result[i] = heap.poll();
    }
    
    return result;
}

/*
Example: nums = [1,1,1,2,2,3], k = 2

freq = {1:3, 2:2, 3:1}

heap processing:
Add 1 (freq 3) → heap: [1]
Add 2 (freq 2) → heap: [2, 1]
Add 3 (freq 1) → heap: [3, 2, 1] → size > k → remove 3 → heap: [2, 1]

Result: [1, 2] ✓
*/
```

---

## 📊 Time Complexity Cheat Sheet

### Summary Table: All Collections

| Collection | Add | Remove | Get | Contains | Notes |
|------------|-----|--------|-----|----------|-------|
| **ArrayList** | O(1)* | O(n) | **O(1)** | O(n) | Best for random access |
| **LinkedList** | **O(1)** | O(1)** | O(n) | O(n) | Best for queue ops |
| **HashSet** | **O(1)** | **O(1)** | N/A | **O(1)** | Best for uniqueness |
| **TreeSet** | O(log n) | O(log n) | N/A | O(log n) | Sorted order |
| **HashMap** | **O(1)** | **O(1)** | **O(1)** | **O(1)** | Best for key-value |
| **TreeMap** | O(log n) | O(log n) | O(log n) | O(log n) | Sorted keys |
| **PriorityQueue** | O(log n) | O(log n) | **O(1)*** | O(n) | Min/Max always at top |
| **ArrayDeque** | **O(1)** | **O(1)** | O(n) | O(n) | Best for stack/queue |

*Amortized  
**With direct reference  
***Only peek, not arbitrary get

### 🎯 Quick Decision Guide

```
Need O(1) lookup by key?          → HashMap
Need O(1) uniqueness check?       → HashSet
Need sorted order?                → TreeMap/TreeSet
Need FIFO queue?                  → ArrayDeque (as Queue)
Need LIFO stack?                  → ArrayDeque (as Stack)
Need priority ordering?           → PriorityQueue
Need random access by index?      → ArrayList
Need frequent inserts at ends?    → LinkedList or ArrayDeque
```

---

## 🏆 Key Takeaways for Mastery

### 1. **Always Think About Time Complexity First**
```
Before coding, ask: "What's the best possible complexity?"
- For search: Can I get O(1) with HashMap?
- For sorting: Can I avoid O(n²) with the right structure?
- For duplicates: Can I use HashSet?
```

### 2. **HashMap is Your Best Friend**
```
90% of optimization problems can use HashMap:
- Two Sum → HashMap
- Frequency counting → HashMap
- Caching → HashMap
- Grouping → HashMap
```

### 3. **Know the Trade-offs**
```
Speed vs Order:
- HashMap: O(1) but unordered
- TreeMap: O(log n) but sorted

Speed vs Memory:
- ArrayList: Less memory, contiguous
- LinkedList: More memory, scattered
```

### 4. **Practice Pattern Recognition**
```
See nested loops? → Think HashMap
Need min/max K elements? → Think PriorityQueue
Need to check for duplicates? → Think HashSet
Need sorted iteration? → Think TreeMap/TreeSet
```

---

## 🎓 Final Words

> **"The difference between a good programmer and a great programmer is knowing WHICH data structure to use and WHY."**

Now you understand:
- ✅ WHY HashMap is O(1) - the hash function magic
- ✅ WHY ArrayList beats LinkedList for most cases
- ✅ WHY HashSet is perfect for uniqueness
- ✅ WHEN to use TreeMap vs HashMap
- ✅ HOW to apply collections to solve real problems

**You're now ready to master any Collections-based interview question! 🚀**

---

_Practice these patterns, understand the math, and you'll never be stumped by a Collections question again!_
