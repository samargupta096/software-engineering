[🏠 Home](../../../README.md) | [⬅️ Bit Manipulation](../../system-design/components/overview.md)

# 📝 Technical Interview Q&A

> Behavioral & Technical Tips for Success

---

## 🧠 General Problem Solving (UMPIRE)

```
┌──────────────────────────────────────────────────┐
│              UMPIRE Framework                     │
│                                                  │
│  U ─ Understand ──→ Clarify inputs/outputs       │
│  M ─ Match ───────→ Map to known patterns        │
│  P ─ Plan ────────→ Design approach + complexity  │
│  I ─ Implement ──→ Write clean code               │
│  R ─ Review ─────→ Dry-run + edge cases           │
│  E ─ Evaluate ───→ Discuss tradeoffs              │
└──────────────────────────────────────────────────┘
```

### 1. Understand (5 min)

Ask clarifying questions:

- "Can the input be null or empty?"
- "Is the array sorted?"
- "Can there be duplicates?"
- "What is the range of values?"
- "Is it a directed or undirected graph?"

Confirm input/output format.

**Example — "Find Pair with Target Sum"**:

```
Interviewer: "Given an array, find two numbers that add up to target."

Your Questions:
  ✅ "Is the array sorted?"         → Determines Two Pointers vs HashMap
  ✅ "Can I use the same element?"  → index i ≠ j constraint?
  ✅ "Multiple valid pairs?"        → Return first? All? Any?
  ✅ "Negative numbers?"            → Affects approach choice
  ✅ "Return indices or values?"    → Changes return type
```

### 2. Match (2 min)

Match to patterns (see [Roadmap](./00-dsa-roadmap.md)).

```
Problem Clue                  →  Pattern to Try
─────────────────────────────────────────────────
"sorted array + target"       →  Two Pointers / Binary Search
"substring / subarray"        →  Sliding Window
"k-th largest/smallest"       →  Heap / Quick Select
"all combinations/subsets"    →  Backtracking
"optimal substructure"        →  Dynamic Programming
"connected components"        →  BFS / DFS / Union-Find
"valid sequence of brackets"  →  Stack
"prefix/suffix computation"   →  Prefix Sum / Prefix Product
"shortest path"               →  BFS (unweighted) / Dijkstra
"detect cycle"                →  Floyd's / Coloring
```

**Verbalize**: "Since it's a sorted array and we need a target, I'll use Two Pointers — O(n) time, O(1) space."

### 3. Plan (5-10 min)

Talk through your approach BEFORE coding.

```
Example Plan (Two Sum on Sorted Array):

Step 1: Initialize left=0, right=n-1
Step 2: While left < right:
        - sum = nums[left] + nums[right]
        - if sum == target → return [left, right]
        - if sum < target  → left++
        - if sum > target  → right--
Step 3: Return [-1, -1] if not found

Time:  O(n) — single pass
Space: O(1) — no extra structure
```

### 4. Implement (15-20 min)

Write clean, modular code with meaningful names:

```java
public int[] twoSum(int[] nums, int target) {
    int left = 0, right = nums.length - 1;

    while (left < right) {
        int sum = nums[left] + nums[right];
        if (sum == target) return new int[]{left, right};
        else if (sum < target) left++;
        else right--;
    }

    return new int[]{-1, -1};  // Not found
}
```

### 5. Review (5 min)

Dry run with a small example:

```
nums = [2, 7, 11, 15], target = 9

left=0, right=3: sum = 2+15 = 17 > 9 → right--
left=0, right=2: sum = 2+11 = 13 > 9 → right--
left=0, right=1: sum = 2+7  =  9 = target ✅ → return [0, 1]
```

**Common dry-run mistakes to catch**:

| Bug Type | What to Check |
|----------|---------------|
| Off-by-one | `<` vs `<=`, `i-1` vs `i` |
| Boundary | Empty array, single element |
| Integer overflow | `mid = left + (right-left)/2` |
| Null pointer | Check node/list is not null |
| Infinite loop | Ensure pointers always move |

### 6. Evaluate

- "This solution is O(n) time because we pass once, and O(1) space."
- "For unsorted input, I'd use a HashMap — O(n) time, O(n) space."
- "We could also sort first in O(n log n), then two pointers."

---

## 💬 Common Java Interview Questions

### Q: ArrayList vs LinkedList?

```
ArrayList (Dynamic Array)              LinkedList (Doubly Linked)
┌───┬───┬───┬───┬───┬───┐            ┌──────┐   ┌──────┐   ┌──────┐
│ 0 │ 1 │ 2 │ 3 │ 4 │   │            │ prev │←→│ data │←→│ next │
└───┴───┴───┴───┴───┴───┘            └──────┘   └──────┘   └──────┘
  ↑ Contiguous memory                  ↑ Scattered nodes + pointers
  ✅ O(1) random access               ❌ O(n) random access
  ❌ O(n) insert middle               ✅ O(1) insert (if ref known)
```

| Feature | ArrayList | LinkedList |
|---------|-----------|------------|
| Access | O(1) random | O(n) sequential |
| Insert (End) | O(1) amortized | O(1) |
| Insert (Middle) | O(n) shift | O(1) if ref known |
| Delete | O(n) shift | O(1) if ref known |
| Memory | Contiguous, cache-friendly | Nodes + Pointers, more overhead |
| Iterator Remove | O(n) | O(1) |

```java
// When to use ArrayList (99% of the time):
List<Integer> list = new ArrayList<>();  // Default choice
list.add(42);           // O(1) amortized
list.get(0);            // O(1) direct access

// When to use LinkedList (rare — mainly as Deque):
Deque<Integer> deque = new LinkedList<>();
deque.addFirst(1);      // O(1) — stack/queue operations
deque.addLast(2);       // O(1)
deque.pollFirst();      // O(1)
```

---

### Q: HashMap Internals?

```
HashMap<String, Integer> map — Internal Structure

put("cat", 5)  →  hashCode("cat") % 16 = 3
put("dog", 7)  →  hashCode("dog") % 16 = 7
put("rat", 2)  →  hashCode("rat") % 16 = 3  ← collision!

Bucket Array (capacity=16):
Index: │ 0 │ 1 │ 2 │  3        │ 4 │ 5 │ 6 │  7    │ ...
       └───┴───┴───┼───────────┴───┴───┴───┼───────┤
                    ↓                       ↓
               ┌─────────┐            ┌─────────┐
               │"cat" → 5│            │"dog" → 7│
               └────┬────┘            └─────────┘
                    ↓
               ┌─────────┐
               │"rat" → 2│  ← Chained (LinkedList)
               └─────────┘

When bucket size > 8 (Java 8+):
  LinkedList → Red-Black Tree (O(n) → O(log n) worst case)

Load Factor = 0.75 → Rehash when 75% full (double capacity)
```

**Key Details**:

| Property | Value |
|----------|-------|
| Default capacity | 16 |
| Load factor | 0.75 |
| Rehash trigger | size > capacity × 0.75 |
| Collision < 8 | LinkedList chain |
| Collision ≥ 8 | Red-Black Tree |
| Avg Time | O(1) |
| Worst Time | O(log n) with trees, O(n) without |

```java
// HashMap usage patterns in interviews
Map<Integer, Integer> freq = new HashMap<>();

// Count frequencies
for (int x : nums)
    freq.merge(x, 1, Integer::sum);  // Modern way

// getOrDefault
freq.getOrDefault(key, 0);

// Iterate entries
for (Map.Entry<Integer, Integer> e : freq.entrySet())
    System.out.println(e.getKey() + " → " + e.getValue());

// computeIfAbsent (for adjacency lists)
Map<Integer, List<Integer>> graph = new HashMap<>();
graph.computeIfAbsent(node, k -> new ArrayList<>()).add(neighbor);
```

---

### Q: Comparable vs Comparator?

```
Comparable<T>                          Comparator<T>
─────────────                          ──────────────
Defined IN the class                   Defined OUTSIDE the class
compareTo(T other)                     compare(T a, T b)
Natural ordering (one way)             Custom ordering (many ways)
java.lang.Comparable                   java.util.Comparator
```

```java
// Comparable — natural ordering (built INTO the class)
class Student implements Comparable<Student> {
    String name;
    int gpa;

    @Override
    public int compareTo(Student other) {
        return Integer.compare(this.gpa, other.gpa);  // Sort by GPA ascending
    }
}

Collections.sort(students);  // Uses compareTo()

// Comparator — external, flexible ordering
Collections.sort(students, (a, b) -> a.name.compareTo(b.name));  // By name
Collections.sort(students, Comparator.comparingInt(s -> -s.gpa)); // By GPA descending

// Chained comparators
students.sort(
    Comparator.comparingInt((Student s) -> s.gpa)
              .reversed()                          // Descending GPA
              .thenComparing(s -> s.name)           // Then alphabetical
);
```

```
Sort students by GPA desc, then name asc:

BEFORE:  [{Alice,3.5}, {Bob,3.9}, {Carol,3.9}, {Dave,3.5}]
AFTER:   [{Bob,3.9}, {Carol,3.9}, {Alice,3.5}, {Dave,3.5}]
           ↑ GPA 3.9 first    ↑ B<C alphabetical
```

---

### Q: PriorityQueue vs TreeSet?

```
PriorityQueue (Min-Heap)                TreeSet (Red-Black Tree)
─────────────────────────               ──────────────────────────
         1                                     5
        / \                                   / \
       3   2                                 3   8
      / \                                   / \   \
     5   4                                 1   4   10

✅ peek/poll min: O(1)/O(log n)         ✅ Sorted iteration
✅ Duplicates allowed                   ❌ No duplicates
❌ No sorted iteration                 ✅ floor/ceiling/range queries
❌ No search by value                  ✅ O(log n) contains
```

| Feature | PriorityQueue | TreeSet |
|---------|--------------|---------|
| Peek min/max | O(1) | O(log n) |
| Insert | O(log n) | O(log n) |
| Remove | O(log n) | O(log n) |
| Contains | O(n) | O(log n) |
| Duplicates | ✅ Yes | ❌ No |
| Sorted walk | ❌ No | ✅ Yes |
| Use case | Top K, median | Range queries, unique sorted |

```java
// PriorityQueue — top K frequent elements
PriorityQueue<int[]> minHeap = new PriorityQueue<>((a, b) -> a[1] - b[1]);
for (var entry : freq.entrySet()) {
    minHeap.offer(new int[]{entry.getKey(), entry.getValue()});
    if (minHeap.size() > k) minHeap.poll();  // Keep only top K
}

// TreeSet — finding closest value
TreeSet<Integer> set = new TreeSet<>();
set.add(10); set.add(20); set.add(30);
set.floor(25);    // 20 (largest ≤ 25)
set.ceiling(25);  // 30 (smallest ≥ 25)
```

---

### Q: Stack vs Deque?

```java
// ❌ Legacy Stack class (don't use in interviews)
Stack<Integer> stack = new Stack<>();

// ✅ Use ArrayDeque for stack
Deque<Integer> stack = new ArrayDeque<>();
stack.push(1);       // addFirst
stack.pop();         // removeFirst
stack.peek();        // peekFirst

// ✅ Use ArrayDeque for queue
Deque<Integer> queue = new ArrayDeque<>();
queue.offer(1);      // addLast
queue.poll();        // removeFirst
queue.peek();        // peekFirst

// ✅ Use LinkedList only for Queue with null support
Queue<Integer> queue = new LinkedList<>();
```

---

### Q: String vs StringBuilder?

```
String (Immutable)                    StringBuilder (Mutable)
──────────────────                    ────────────────────────
s = "abc"                             sb = new StringBuilder("abc")
s += "d" → creates NEW String         sb.append("d") → modifies in-place
Each concat = O(n) copy               Each append = O(1) amortized

Loop concat: O(n²) total              Loop append: O(n) total
```

```java
// ❌ BAD — O(n²) in loops
String result = "";
for (String word : words)
    result += word;  // Creates new String each time!

// ✅ GOOD — O(n) with StringBuilder
StringBuilder sb = new StringBuilder();
for (String word : words)
    sb.append(word);
return sb.toString();

// Common interview patterns
sb.reverse();                    // Palindrome check
sb.deleteCharAt(sb.length()-1);  // Remove last char
sb.insert(0, 'x');               // Prepend
sb.setCharAt(i, 'a');            // Modify in-place
```

---

### Q: `==` vs `.equals()`?

```java
// == compares REFERENCES (memory address)
String a = new String("hello");
String b = new String("hello");
a == b;          // false ❌ (different objects)
a.equals(b);     // true  ✅ (same content)

// String pool optimization
String c = "hello";
String d = "hello";
c == d;          // true ✅ (same pool reference — but don't rely on this!)

// Integer caching (-128 to 127)
Integer x = 127;
Integer y = 127;
x == y;          // true ✅ (cached)
Integer p = 128;
Integer q = 128;
p == q;          // false ❌ (not cached!)
p.equals(q);     // true  ✅ (always use .equals for wrapper types)
```

---

### Q: How does `Collections.sort()` work?

```
Java uses TimSort (hybrid Merge Sort + Insertion Sort)

TimSort Steps:
1. Divide array into "runs" (naturally sorted subsequences)
2. If run < 32 elements → Insertion Sort (good for small/nearly-sorted)
3. Merge runs using Merge Sort logic

[5,1,4,2,3,8,7,6] → Find runs:
Run 1: [1,5]  Run 2: [2,3,4]  Run 3: [6,7,8]
Merge: [1,2,3,4,5] + [6,7,8] → [1,2,3,4,5,6,7,8]

Time:  O(n log n) worst, O(n) best (already sorted!)
Space: O(n)
Stable: ✅ Yes (equal elements keep original order)
```

---

### Q: Concurrency — synchronized vs Lock?

```java
// synchronized — simple, automatic release
public synchronized void increment() {
    count++;  // Only one thread at a time
}

// ReentrantLock — more control
Lock lock = new ReentrantLock();
lock.lock();
try {
    count++;
} finally {
    lock.unlock();  // MUST unlock in finally
}

// ConcurrentHashMap — thread-safe map
Map<String, Integer> map = new ConcurrentHashMap<>();
map.merge("key", 1, Integer::sum);  // Atomic operation
```

| Feature | `synchronized` | `ReentrantLock` |
|---------|---------------|-----------------|
| Ease of use | ✅ Simple | More verbose |
| Try-lock | ❌ No | ✅ `tryLock()` |
| Fairness | ❌ No | ✅ Optional |
| Read/Write | ❌ No | ✅ `ReadWriteLock` |
| Condition | `wait/notify` | `Condition` objects |

---

## 🚀 Behavioral Tips (STAR Method)

```
STAR Framework for Structured Answers:

┌───────────┐     ┌──────────┐     ┌──────────┐     ┌──────────┐
│ Situation │ ──→ │   Task   │ ──→ │  Action  │ ──→ │  Result  │
│ (Context) │     │  (Goal)  │     │ (What YOU│     │(Outcome +│
│           │     │          │     │   did)   │     │ metrics) │
└───────────┘     └──────────┘     └──────────┘     └──────────┘
```

**Example — "Tell me about a challenging project"**:

- **Situation**: "Our e-commerce platform's checkout API had p99 latency of 500ms, causing cart abandonment."
- **Task**: "I needed to reduce latency to under 100ms while maintaining data consistency."
- **Action**: "I profiled the hot path, identified N+1 queries, implemented Redis caching for product data, and added database connection pooling."
- **Result**: "Latency dropped to 45ms (91% improvement), cart abandonment decreased by 15%, and the pattern was adopted across 3 other services."

**More STAR Examples (Common Questions)**:

| Question | Good Focus |
|----------|------------|
| "Time you disagreed with a team member" | Professionalism, data-driven resolution |
| "Describe a failure" | Ownership, learning, process improvement |
| "How do you prioritize?" | Framework (urgency vs impact), stakeholder communication |
| "Leading without authority" | Influence, documentation, building consensus |

---

## ❌ Red Flags to Avoid

```
❌ DO NOT                              ✅ DO INSTEAD
──────────────────────────             ──────────────────────────
Jump straight to coding               Plan first, confirm approach
Go silent for long periods             Think aloud continuously
Ignore interviewer's hints             Pause and re-evaluate
Write monolithic functions             Use helper functions
Give up when stuck                     Brute force → then optimize
Memorize solutions                     Understand patterns + WHY
Say "I don't know" and stop            Say "I haven't seen this,
                                       but here's how I'd approach it"
Argue with feedback                    "That's a great point, let me
                                       reconsider..."
```

---

## 🎯 Common Interview Anti-Patterns (Code)

```java
// ❌ Integer overflow in binary search
int mid = (left + right) / 2;            // Can overflow!
int mid = left + (right - left) / 2;     // ✅ Safe

// ❌ Modifying collection while iterating
for (int x : list) {
    if (x == 5) list.remove(x);          // ConcurrentModificationException!
}
Iterator<Integer> it = list.iterator();   // ✅ Safe
while (it.hasNext()) {
    if (it.next() == 5) it.remove();
}

// ❌ Checking null after method call
node.left.val;                  // NullPointerException if left is null!
if (node.left != null)          // ✅ Always null-check first
    node.left.val;

// ❌ Off-by-one in loops
for (int i = 0; i <= nums.length; i++)   // ArrayIndexOutOfBounds!
for (int i = 0; i < nums.length; i++)    // ✅ Correct

// ❌ Comparing objects with ==
if (str1 == str2)               // Compares references!
if (str1.equals(str2))          // ✅ Compares content
```

---

## 🎓 Final Checklist

```
Interview Day Checklist:

Before the interview:
  □ Review your top 5 projects/stories (STAR format)
  □ Practice 2-3 problems end-to-end (timed, 25 min each)
  □ Review Big O cheat sheet

During problem solving:
  □ Ask clarifying questions (2-3 minimum)
  □ State your approach + complexity BEFORE coding
  □ Handle edge cases (null, empty, single element, MAX_INT)
  □ Use meaningful variable names (left/right, slow/fast, curr)
  □ Dry run with small example
  □ Discuss time/space tradeoffs

If you get stuck:
  □ Start with brute force — say it explicitly
  □ Think about what data structure would help
  □ Look for sub-problems or patterns
  □ Ask: "Can I sort the input?" "Can I use extra space?"
```

---

*Happy Coding! You got this! 🚀*
